'use strict';
// src/lib/vendor/calendarSignals.js
// Vendor Suit — the post-turn calendar/turn-input signal apparatus, factored out of
// the web door (src/api/vendor-engine/chat.js) so the WhatsApp turn shares the exact
// same behaviour: one mind, two surfaces. Pure functions over an explicit
// (supabase, vendor, agentId, result) — no Express req. The web door's own comment
// always intended "the same handler a future WhatsApp door will call"; this is it.
//
// Covers: turn inputs (calendar snapshot + owner scratchpad fed into runTurn), and the
// post-turn signal hands — donna_book_event (book), donna_edit_event/donna_cancel_event
// (mutate), retro-link on client file, and binder<->event date lockstep. Invoice PDF
// (donna_invoice_pdf) is handled per-surface (web door + WA handler each mint+deliver
// their own way), so it is NOT here.
//
// ══════════════════════════════════════════════════════════════════════════
// TDW_05 BLOCK 05, SITTING 1 — F-04.65: THE WA DOOR THROUGH THE CHECKER.
// ══════════════════════════════════════════════════════════════════════════
// This file was RULED EXEMPT from eventWrite's one-writer guardrail through 04 and
// 06 (eventWrite.js:20-25 census — "05 owns the WA surface end-to-end"). The app
// chat door earned the checker's verdicts, honest refusals, and witness discipline
// at B2/B4/B6; this WA twin never did — it wrote public.events RAW at five sites and
// through events.js::updateEvent (no checkOccupancy) at a sixth. The exemption was
// priced when the checker was a stub; it is four verdicts deep now and nobody
// re-quoted it. Addendum §1 (standing): the WA calendar write path gets the SAME
// verdicts, the SAME honest refusals, the SAME witness discipline the app doors have.
//
// THE CURE IS A PORT, NOT AN AUTHORING. Every calendar write below now routes through
// writeEvent (lib/vendor/eventWrite.js), the ONE writer, exactly as the app chat door
// does site-for-site (chat.js book :294 · retro-link :446 · edit :634 · cancel :674 ·
// lockstep b->e :917 force:true). The only difference from the app door is the
// signature: pure (supabase, vendor, agentId, result), never req. No sentence is
// composed here that the app door does not already compose; the verdict is
// conflict.message, printed VERBATIM (spec P2), scrubbed at the seam (F-04.33).
//
// FOLDED — F-04.66 (read-side twin), on the sitting's evidence, ratify-or-revert:
// fetchCalendarSnapshot no longer hands raw row ids under a "[handle]" header, and
// resolveEvent is now the SAME two-leg gate the app door gained at B6 (UUID | sayable
// referent via nameMatches + on_date). The reason it folds here rather than deferring:
// the shared tool schemas (recordPrimitives.ts:422-445, NOT surface-aware, re-taught at
// B6) already instruct the model to pass the booking's NAME + on_date — and the WA
// resolveEvent rejected everything non-UUID, so the WA edit/cancel path was BROKEN for
// the referent the schema teaches while the snapshot still taught the handle. The app
// door proves the referent gate and the checker port coexist without interference
// (resolveEvent -> writeEvent, side by side); deferring would only force reopening
// mutateEvents/resolveEvent a second time. scrub.js is NOT the seam (ruled: shared with
// tool-result renders) and stays 0-line.
const { writeEvent } = require('./eventWrite');            // TDW_05 S1 — the ONE writer
const { OCCUPYING_KINDS } = require('./occupancy');        // TDW_05 S1 — lockstep's kind filter (F-04.43's shape)
const { logActivity } = require('./snapshot');             // TDW_05 S1 — lockstep's ledger (F-04.56 visibility)
const { executeAndPatch } = require('../executeAndPatch');
const { scrubText } = require('./scrub'); // TDW_04 B2 — F-04.38 (line scrub only; storage scrub is eventWrite's)
const { blockDates, unblockDates, blockLines, unblockLines } = require('./blockHands'); // TDW_04 B2 §1.5

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const BOOKED_KINDS = ['shoot', 'meeting', 'recce', 'fitting', 'trial', 'family', 'ceremony', 'social', 'other'];
const S = 'whatsapp'; // F-04.38: this door's surface. snapshot.js:130's vocabulary; engine.js:270's precedent.

// ── donna_book_event ─────────────────────────────────────────────────────────
// THIN CALLER (mirrors chat.js:283-330). The scrub, the dedupe, the binder backlink,
// the insert-or-patch fork — all eventWrite's now. This loop collects, routes, and
// reports; it never touches public.events directly. A refused booking is NEVER pushed
// to `booked`, so no bookingLine claims it — but it no longer stays SILENT about it
// either (F-04.55): the conflict rides out on `refused` and conflictLines prints it.
async function bookEvents(supabase, vendor, agentId, result) {
  const wantBook = [];
  const collect = (call) => {
    if (call && call.name === 'donna_book_event' && call.input && call.input.title && call.input.event_date) {
      wantBook.push(call.input);
    }
  };
  for (const tc of (result.tool_calls || [])) {
    collect(tc);
    for (const dc of (tc.donna_calls || [])) collect(dc);
  }
  const booked = [];
  const refused = [];
  for (const bk of wantBook) {
    try {
      // BOOKED_KINDS stays HERE and is deliberately NOT eventWrite's CALENDAR_KINDS: this
      // is the BOOKING door's coercion — an unrecognised kind from the model becomes a
      // neutral 'meeting'. Left exactly as found (chat.js:288's precedent).
      const kind = BOOKED_KINDS.includes(bk.kind) ? bk.kind : 'meeting';
      const r = await writeEvent(supabase, {
        vendorId:    vendor.id,
        agentId,
        surface:     S,
        source:      'victor',
        title:       bk.title,
        event_date:  bk.event_date,
        // `|| undefined` — NOT `|| null`. Absent means DON'T TOUCH, never "set to NULL".
        // eventWrite reads undefined as untouched and null as clear. Byte-faithful to
        // the old inline `if (bk.event_time)` / `if (bk.notes)` guards.
        event_time:  bk.event_time || undefined,
        kind,
        notes:       bk.notes || undefined,
        client_hint: bk.binder_id || null,
        state:       'upcoming',
      });
      if (!r.ok) {
        console.error('[calSignals:donna_book_event]', r.error || (r.conflict && r.conflict.kind) || 'write refused');
        // The payload, carried — NOT re-derived. conflict.message is the founder-blessed
        // sentence; the door hands it to Victor VERBATIM (spec P2). title rides only so a
        // ledger/log line can name what was refused.
        refused.push({ title: bk.title, conflict: r.conflict || null, error: r.conflict ? null : (r.error || null) });
        continue;
      }
      booked.push(r.event);
    } catch (e) { console.error('[calSignals:donna_book_event]', e.message); }
  }
  return { booked, refused };
}

// F-04.38 (same seam, same reason as chat.js's F-04.33 cure): bk.title is DB-sourced
// and rode RAW to the vendor on the WhatsApp reply. Whole-string scrub, no residual.
function bookingLines(booked) {
  return scrubText(booked.map((bk) => {
    const when = bk.event_time ? `${bk.event_date} at ${bk.event_time}` : bk.event_date;
    return `Booked: ${bk.title} — ${when}. It's on your calendar.`;
  }).join('\n'));
}

// conflictLines — F-04.55's CURE AT THIS DOOR, ported from chat.js:400. It prints
// conflict.message VERBATIM (spec P2 — a plain sentence the door hands Victor); it
// composes NOTHING. The error channel (FAIL-CLOSED) rides the same rail: nothing was
// written and the vendor is owed the truth. Already-scrubbed, like its siblings, because
// holding[] carries DB-sourced titles the messages interpolate (F-04.33's specimen).
function conflictLines(refused) {
  return scrubText(refused.map((r) =>
    (r.conflict && r.conflict.message) || r.error || `Couldn't put that on the calendar — nothing was changed.`
  ).join('\n'));
}

// ── retro-link on client file ────────────────────────────────────────────────
// ROUTED (mirrors chat.js:446). A link-only patch draws no occupancy verdict — the
// context is the patch and the patch carries no date/kind/slot — but it is still a
// public.events write and the one-writer guardrail now binds this door too. Behaviour
// identical; the census now carries ZERO exceptions on the WA door either.
async function retroLinkOnFile(supabase, vendor, agentId, result) {
  const names = new Set();
  const collect = (call) => {
    if (call && call.name === 'donna_client' && call.input && typeof call.input.client === 'string') {
      const n = call.input.client.trim();
      if (n.length >= 2) names.add(n);
    }
  };
  for (const tc of (result.tool_calls || [])) { collect(tc); for (const dc of (tc.donna_calls || [])) collect(dc); }
  if (!names.size) return;
  for (const name of names) {
    try {
      const { data: binders } = await supabase.schema('engine')
        .from('records').select('id, client')
        .eq('agent_id', agentId).ilike('client', name).limit(2);
      if (!binders || binders.length !== 1) continue;
      const binderId = binders[0].id;
      const { data: evs } = await supabase
        .from('events').select('id, title')
        .eq('vendor_id', vendor.id).is('linked_binder_id', null)
        .neq('state', 'cancelled').ilike('title', `${name}%`).limit(20);
      for (const ev of (evs || [])) {
        const hint = String(ev.title || '').split(/[-\u2013\u2014\u00b7:]/)[0].trim();
        if (hint.toLowerCase() !== name.toLowerCase()) continue; // exact client-hint only
        await writeEvent(supabase, {
          vendorId: vendor.id, surface: S, source: 'victor',
          event_id: ev.id, linked_binder_id: binderId,
        });
      }
    } catch (e) { console.warn('[calSignals:retro-link]', e.message); }
  }
}

// ── donna_edit_event / donna_cancel_event ────────────────────────────────────
// THE TWO-LEG GATE (F-04.66 folded — ported from chat.js:567). Leg 1: a UUID resolves
// exactly (byte-behaviour of the old resolver). Leg 2: a sayable referent — the booking's
// NAME as shown, refined by nameMatches (resolveClientReference.js's own pattern, so
// "riya" never matches "Priya") + an optional on_date disambiguator, live rows only.
//   { none:true } · { ev } · { ambiguous:[{title,event_date}] }
async function resolveEvent(supabase, vendor, eventId, onDate) {
  const raw = String(eventId || '').trim();
  if (!raw) return { none: true };
  if (UUID_RE.test(raw)) {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, event_date, event_time, kind, state, linked_binder_id')
      .eq('vendor_id', vendor.id)
      .eq('id', raw)
      .is('deleted_at', null)
      .maybeSingle();
    if (error || !data) return { none: true };
    return { ev: data };
  }
  // Leg 2. ilike is a coarse DB-side prefilter refined by nameMatches — same as the
  // app door, so the resolver behaves identically across surfaces (one mind).
  const { nameMatches, nameNeedleTokens } = require('./resolveClientReference');
  let q = supabase
    .from('events')
    .select('id, title, event_date, event_time, kind, state, linked_binder_id')
    .eq('vendor_id', vendor.id)
    .is('deleted_at', null)
    .neq('state', 'cancelled');
  // F-04.98 CURE 2 — token-AND prefilter so the coarse net survives punctuation in
  // the title: a single '%Ananya recce%' never matches 'Ananya - recce', but
  // '%ananya%' AND '%recce%' both hit it. nameMatches refines below exactly as
  // before (so 'riya' still cannot reach 'Priya'). Empty tokens (all-punctuation
  // raw) fall back to the single ilike — harmless.
  const toks = nameNeedleTokens(raw);
  if (toks.length) { for (const t of toks) q = q.ilike('title', `%${t}%`); }
  else             q = q.ilike('title', `%${raw}%`);
  const day = String(onDate || '').trim();
  if (DATE_RE.test(day)) q = q.eq('event_date', day);
  const { data, error } = await q;
  if (error || !data) return { none: true };
  const hits = data.filter((r) => nameMatches(r.title, raw));
  if (hits.length === 1) return { ev: hits[0] };
  if (hits.length > 1) return { ambiguous: hits.map((r) => ({ title: r.title, event_date: r.event_date })) };
  return { none: true };
}

// TDW_04.5 P1 #4 / F-04.98 — the crew name matcher. BYTE-MIRROR of chat.js's own
// memberNameMatches (the app door's copy, sealed at CE-53): case-insensitive, WITHIN
// THE ACTIVE TEAM. A member answers to the full name OR any name-token (first or
// surname), so "Rahul" reaches both Rahuls and clarify-once fires while "Rahul Mehra"
// resolves to one. NOT resolveClientReference.nameMatches — that resolves PEOPLE across
// clients/leads/invoices; this resolves TEAM MEMBERS, a different set. Copied, not
// shared, per the estate's one-mind-two-surfaces port doctrine (F-04.65): the WA door
// gets the SAME resolution the app door proved, site-for-site.
function memberNameMatches(name, want) {
  const n = String(name || '').trim().toLowerCase();
  const w = String(want || '').trim().toLowerCase();
  if (!n || !w) return false;
  if (n === w) return true;                     // exact full name
  return n.split(/\s+/).includes(w);            // any token — the clarify-once source
}
async function mutateEvents(supabase, vendor, agentId, result) {
  const edits = [], cancels = [], assigns = [];
  const collect = (call) => {
    if (!call || !call.input) return;
    if (call.name === 'donna_edit_event' && call.input.event_id) edits.push(call.input);
    if (call.name === 'donna_cancel_event' && call.input.event_id) cancels.push(call.input);
    if (call.name === 'donna_assign_crew' && call.input.event_id) assigns.push(call.input);
  };
  for (const tc of (result.tool_calls || [])) {
    collect(tc);
    for (const dc of (tc.donna_calls || [])) collect(dc);
  }
  const done = [];
  for (const e of edits) {
    try {
      const res = await resolveEvent(supabase, vendor, e.event_id, e.on_date);
      if (res.ambiguous) { done.push({ action: 'edit', ok: false, reason: 'ambiguous', candidates: res.ambiguous }); continue; }
      const ev = res.ev;
      if (!ev) { done.push({ action: 'edit', ok: false, reason: 'unresolved' }); continue; }
      // RAW patch — writeEvent scrubs the free-text cells (title, notes) itself now, so
      // this loop no longer double-scrubs (chat.js:628's shape).
      const patch = {};
      for (const k of ['title', 'event_date', 'event_time', 'kind', 'notes']) {
        if (typeof e[k] === 'string' && e[k].trim()) patch[k] = e[k].trim();
      }
      const r = await writeEvent(supabase, {
        vendorId: vendor.id, surface: S, source: 'victor', event_id: ev.id, ...patch,
      });
      // e->b lockstep: a linked event's date moved -> carry the binder's date along
      // (engine-owned, through donna_date). LEFT AS FOUND — this is an ENGINE binder
      // write, not a public.events write, so it is outside F-04.65's checker scope. The
      // app door additionally gates this behind isWeddingAnchor (Q-B3-3); that anchor
      // veto is NOT ported here (it is not this sitting's finding). Disclosed.
      if (r && r.ok && patch.event_date && ev.linked_binder_id) {
        try { await executeAndPatch(agentId, 'donna_date', { binder_id: ev.linked_binder_id, date: patch.event_date }); }
        catch (e2) { console.warn('[calSignals:lockstep e->b]', e2.message); }
      }
      // conflict rides BOTH branches (F-04.62): on ok:true an ADVISORY (write landed),
      // on ok:false a REFUSAL. `ok` is the only thing that tells them apart.
      done.push(r && r.ok
        ? { action: 'edit', ok: true,  event: r.event || ev, conflict: r.conflict || null }
        : { action: 'edit', ok: false, conflict: (r && r.conflict) || null,
            error: (r && !r.conflict && r.error) || null, reason: (r && (r.conflict || r.error)) ? null : 'unresolved' });
    } catch (err) { console.error('[calSignals:donna_edit_event]', err.message); done.push({ action: 'edit', ok: false, reason: 'unresolved' }); }
  }
  for (const c of cancels) {
    try {
      const res = await resolveEvent(supabase, vendor, c.event_id, c.on_date);
      if (res.ambiguous) { done.push({ action: 'cancel', ok: false, reason: 'ambiguous', candidates: res.ambiguous }); continue; }
      const ev = res.ev;
      if (!ev) { done.push({ action: 'cancel', ok: false, reason: 'unresolved' }); continue; }
      // Routed. A cancel is a state write, and state is eventWrite's to set. A cancel
      // CANNOT draw a conflict (checkOccupancy Item 3 returns null for state:'cancelled')
      // but it CAN draw a FAIL-CLOSED error — that is the only reason `error` is read.
      const r = await writeEvent(supabase, {
        vendorId: vendor.id, surface: S, source: 'victor', event_id: ev.id, state: 'cancelled',
      });
      done.push(r && r.ok
        ? { action: 'cancel', ok: true, event: ev }
        : { action: 'cancel', ok: false, error: (r && r.error) || null, reason: (r && r.error) ? null : 'unresolved' });
    } catch (err) { console.error('[calSignals:donna_cancel_event]', err.message); done.push({ action: 'cancel', ok: false, reason: 'unresolved' }); }
  }
  // ── CREW (04.5 P1 #4 / F-04.98) — assign / unassign, riding the SAME shared done[] ──
  // BYTE-MIRROR of chat.js's sealed #4 assign leg (CE-53), the app door's copy — ported
  // here so the WA door RESOLVES a crew signal instead of stranding it (F-04.98's disease:
  // the #4 leg landed in chat.js only; this file — the ONE the WA door runs via
  // applyCalendarSignals — never got it, so a WA voice-assign fired the signal, resolved
  // NOTHING, rendered NO line, and the model's prose shipped alone). The SHARED resolveEvent
  // (the two-leg gate) resolves the booking; a member is resolved case-insensitively within
  // the ACTIVE team; the crew SET is written through writeEvent — the ONE writer (assign =
  // union, unassign = difference; array = SET semantics). Note-trail + crew_confirmations
  // come FREE from eventWrite's sealed crew core. The ONLY difference from the app door's
  // leg is `surface: S` (whatsapp), exactly as edit/cancel above already differ. Every
  // outcome names its own cause (F-04.62). conflict is BYTE-READY-DORMANT (F-04.88): a
  // crew-only write returns conflict==null today (occupancy.js:551 short-circuits on
  // touchesSpatial before member_clash); it surfaces the instant that core cure lands.
  for (const a of assigns) {
    try {
      const res = await resolveEvent(supabase, vendor, a.event_id, a.on_date);
      if (res.ambiguous) { done.push({ action: a.action, ok: false, reason: 'ambiguous', candidates: res.ambiguous }); continue; }
      const ev = res.ev;
      if (!ev) { done.push({ action: a.action, ok: false, reason: 'unresolved' }); continue; }
      // member resolution: ACTIVE team (active=true AND deleted_at IS NULL — the same set
      // eventWrite validates the write against).
      const { data: teamRows, error: teamErr } = await supabase
        .from('team_members').select('id, name')
        .eq('vendor_id', vendor.id).eq('active', true).is('deleted_at', null);
      if (teamErr) { done.push({ action: a.action, ok: false, reason: 'unresolved' }); continue; }
      const matches = (teamRows || []).filter((m) => memberNameMatches(m.name, a.member));
      if (matches.length === 0) { done.push({ action: a.action, ok: false, reason: 'member_unresolved', memberName: a.member }); continue; }
      if (matches.length > 1)  { done.push({ action: a.action, ok: false, reason: 'member_ambiguous', memberName: a.member, memberCandidates: matches.map((m) => ({ id: m.id, name: m.name })) }); continue; }
      const member = { id: matches[0].id, name: matches[0].name };
      // ONE targeted vendor-scoped read of the current crew for ev.id. resolveEvent's select
      // stays byte-identical (it never carries assigned_member_ids), so the crew read lives HERE.
      const { data: cur } = await supabase
        .from('events').select('assigned_member_ids')
        .eq('id', ev.id).eq('vendor_id', vendor.id).is('deleted_at', null).maybeSingle();
      const currentIds = Array.isArray(cur && cur.assigned_member_ids) ? cur.assigned_member_ids.map(String) : [];
      const isOn = currentIds.includes(member.id);
      // idempotent-add no-op / remove-guard — THE BRANCH IS THE GUARD, no write fires.
      if (a.action === 'assign'   &&  isOn) { done.push({ action: 'assign',   ok: false, reason: 'idempotent', member, event: ev }); continue; }
      if (a.action === 'unassign' && !isOn) { done.push({ action: 'unassign', ok: false, reason: 'guard',      member, event: ev }); continue; }
      const newSet = a.action === 'assign'
        ? [...new Set([...currentIds, member.id])]         // union
        : currentIds.filter((id) => id !== member.id);     // difference
      const r = await writeEvent(supabase, {
        vendorId: vendor.id, surface: S, source: 'victor', event_id: ev.id, assigned_member_ids: newSet,
      });
      // conflict rides on ok:true as an ADVISORY (member_clash), exactly as edit's does —
      // BYTE-READY-DORMANT (F-04.88): returns null today, surfaces when the core cure lands.
      done.push(r && r.ok
        ? { action: a.action, ok: true,  member, event: r.event || ev, conflict: r.conflict || null }
        : { action: a.action, ok: false, member, event: ev, conflict: (r && r.conflict) || null,
            error: (r && !r.conflict && r.error) || null, reason: (r && (r.conflict || r.error)) ? null : 'unresolved' });
    } catch (err) { console.error('[calSignals:donna_assign_crew]', err.message); done.push({ action: a.action, ok: false, reason: 'unresolved' }); }
  }
  return done;
}

// mutationLines — F-04.62's branch order, ported from chat.js:719: a deliberate
// refusal must never be reported as a search failure. conflict -> error -> ambiguous
// -> unresolved -> success. Each sentence names what actually happened.
function mutationLines(done) {
  return scrubText(done.map((m) => {
    if (!m.ok) {
      // REFUSAL: the checker's own sentence, VERBATIM (spec P2), founder-blessed.
      if (m.conflict && m.conflict.message) return m.conflict.message;
      // FAIL-CLOSED's honest, retryable string. Also verbatim; also already true.
      if (m.error) return m.error;
      // ── CREW (04.5 P1 #4 / F-04.98) — BYTE-MIRROR of chat.js's crew render branches
      //    (CE Ruling №8, founder veto). More specific than the event reasons below, so
      //    tested first; the `reason` values do not collide with edit's. ──
      // Member ambiguity → clarify-once: the shared word, then the full names to choose.
      if (m.reason === 'member_ambiguous' && Array.isArray(m.memberCandidates) && m.memberCandidates.length > 1) {
        const names = m.memberCandidates.map((c) => c.name);
        const plural = String(m.memberName || 'teammate').trim().replace(/\b\w/g, (ch) => ch.toUpperCase());
        const numWord = { 2: 'two', 3: 'three', 4: 'four' }[names.length] || String(names.length);
        const joined = names.length === 2
          ? names.join(' or ')
          : `${names.slice(0, -1).join(', ')}, or ${names[names.length - 1]}`;
        return `I have ${numWord} ${plural}s — ${joined}?`;
      }
      // Member not on the team — echo the vendor's own word back.
      if (m.reason === 'member_unresolved') {
        return `I couldn't find anyone called ${m.memberName} on your team.`;
      }
      // Idempotent add — already there, no write fired.
      if (m.reason === 'idempotent') {
        return `${m.member.name}'s already on the ${(m.event && m.event.title) || 'booking'}.`;
      }
      // Remove-guard — wasn't there to take off, no write fired.
      if (m.reason === 'guard') {
        return `${m.member.name} isn't on the ${(m.event && m.event.title) || 'booking'}.`;
      }
      // AMBIGUITY (R-B6-1): each candidate by title + date so the vendor can say which.
      if (m.reason === 'ambiguous' && Array.isArray(m.candidates) && m.candidates.length) {
        const list = m.candidates.map((x) => `${x.title} (${x.event_date})`).join(' · ');
        return m.action === 'cancel'
          ? `Couldn't cancel that booking — more than one matches: ${list}. Tell me which one.`
          : `Couldn't change that booking — more than one matches: ${list}. Tell me which one.`;
      }
      // AND ONLY NOW, the sentence that was always true HERE and nowhere else.
      return m.action === 'cancel'
        ? `Couldn't cancel that booking — I didn't find a single match. Tell me which one.`
        : `Couldn't change that booking — I didn't find a single match. Tell me which one.`;
    }
    // ── CREW WITNESS (04.5 P1 #4 / F-04.98) — BYTE-MIRROR of chat.js's ok:true crew
    //    branch (CE Ruling №5/№8, founder veto). Reading A: raw {when}, time-optional,
    //    mirroring the Updated: line's own event_date guard. THE BRANCH IS THE GUARD. ──
    if (m.action === 'assign' || m.action === 'unassign') {
      const ce = m.event || {};
      const title = ce.title || 'booking';
      if (m.action === 'unassign') return `${m.member.name}'s off the ${title}.`;
      const cwhen = ce.event_time ? `${ce.event_date} at ${ce.event_time}` : ce.event_date;
      return `${m.member.name}'s on the ${title}${ce.event_date ? ` — ${cwhen}` : ''}.`;
    }
    const e = m.event || {};
    const when = e.event_time ? `${e.event_date} at ${e.event_time}` : e.event_date;
    return m.action === 'cancel'
      ? `Cancelled: ${e.title}${e.event_date ? ` — ${when}` : ''}. It's off your calendar.`
      : `Updated: ${e.title} — ${when}. The calendar's set.`;
  }).join('\n'));
}

// advisoryLines — the write LANDED; the heads-up rides BESIDE the success, never instead
// of it (Q-B4-5(b), ported from chat.js:407). appointment_overlap / cluster come out on
// { ok:true, event, conflict }.
function advisoryLines(withAdvisory) {
  return scrubText(withAdvisory.map((a) => a.conflict.message).join('\n'));
}

// ── binder -> event date lockstep ────────────────────────────────────────────
// ROUTED with force:true (F-04.56's cure, ported from chat.js:877-935). A WEDDING
// MOVING IS A DECISION ALREADY MADE; the drag is its CONSEQUENCE. Until this sitting the
// WA leg passed no force and NEVER READ THE RETURN — inert only while checkOccupancy
// returned null. Now the checker has a body, and a raw drag onto a date at capacity or
// a block would move the calendar with no verdict — the exact divergence this block
// exists to kill, and it lived here longest. force:true is SAFE only because eventWrite's
// gate now carries isOverridable (Q-C-3): date_blocked still refuses a drag; capacity
// yields. .in('kind', OCCUPYING_KINDS) is F-04.43's filter, so a linked call/reminder is
// never dragged. Visibility without a surface change: the LEDGER records both outcomes.
async function lockstepBinderToEvent(supabase, vendor, result) {
  const moves = new Map();
  const collect = (call) => {
    if (!call || !call.input) return;
    if ((call.name === 'donna_date' || call.name === 'donna_edit') && call.input.binder_id
        && typeof call.input.date === 'string' && call.input.date.trim()) {
      moves.set(String(call.input.binder_id), call.input.date.trim());
    }
  };
  for (const tc of (result.tool_calls || [])) { collect(tc); for (const dc of (tc.donna_calls || [])) collect(dc); }
  for (const [binderId, date] of moves) {
    try {
      const { data: evs, error } = await supabase
        .from('events')
        .select('id')
        .eq('vendor_id', vendor.id)
        .eq('linked_binder_id', binderId)
        .neq('state', 'cancelled')
        .in('kind', OCCUPYING_KINDS);
      if (error || !evs || !evs.length) continue;
      for (const ev of evs) {
        const r = await writeEvent(supabase, {
          vendorId: vendor.id, surface: S, source: 'victor',
          event_id: ev.id, event_date: date, force: true,
        });
        // Fire-and-forget, BOTH outcomes — logActivity is fail-safe by contract. Only a
        // WITNESSED outcome is logged (`r` is the door's own return, never a guess).
        if (r && r.ok && r.conflict) {
          logActivity(supabase, {
            vendorId: vendor.id, surface: S, action: 'event_update',
            summary: `binder date-move: conflict overridden — "${(r.event && r.event.title) || ev.id}" moved to ${date} · ${r.conflict.message}`,
            entityType: 'event', entityId: ev.id,
          }).catch(() => {});
        } else if (r && !r.ok && r.conflict) {
          logActivity(supabase, {
            vendorId: vendor.id, surface: S, action: 'event_update',
            summary: `binder date-move: drag refused by block — "${ev.id}" stayed put; ${date} is blocked · ${r.conflict.message}`,
            entityType: 'event', entityId: ev.id,
          }).catch(() => {});
        } else if (r && !r.ok) {
          logActivity(supabase, {
            vendorId: vendor.id, surface: S, action: 'event_update',
            summary: `binder date-move: drag could not be verified — "${ev.id}" stayed put; ${r.error || 'checker unavailable'}`,
            entityType: 'event', entityId: ev.id,
          }).catch(() => {});
        }
      }
    } catch (e) { console.warn('[calSignals:lockstep b->e]', e.message); }
  }
}

// ── turn inputs (pre-runTurn) ────────────────────────────────────────────────
// F-04.66 folded: the raw row ids and the word "handle" leave the snapshot prose. A
// line is now a referent Victor can SAY, and the header teaches the referent where it
// used to teach the handle — the SAME header the app door ships since B6 (R-B6-1), so
// the two surfaces feed the one mind the same instruction. P4.1's date-pressure line is
// NOT ported here: it is held P4 work, out of this sitting.
async function fetchCalendarSnapshot(supabase, vendorId) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('events')
      .select('id, title, event_date, event_time, kind, state')
      .eq('vendor_id', vendorId)
      .eq('state', 'upcoming')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(12);
    if (error || !data || !data.length) return '';
    const lines = data.map((e) => {
      const when = e.event_time ? `${e.event_date} ${e.event_time}` : e.event_date;
      return `- ${when} · ${e.title}${e.kind ? ` (${e.kind})` : ''}`;
    });
    return `[Calendar — upcoming, kept for you. Refer to a booking by its name as it appears below (with its date, if two share a name) to change or cancel it. Crew assignments are not shown here — signal donna_assign_crew; the calendar adjudicates. For event_id use the booking's name from the lines below, never a note or description.]\n${lines.join('\n')}`;
  } catch (e) {
    console.warn('[calSignals:calendar snapshot]', e.message);
    return '';
  }
}

async function fetchScratchpad(supabase, vendorId) {
  try {
    const { data, error } = await supabase
      .from('owner_notes')
      .select('id, body, created_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error || !data || !data.length) return '';
    const lines = data.map((n) => `- ${n.body}`);
    return `[The owner's scratchpad — notes he has left for himself, in his own hand.]\n${lines.join('\n')}`;
  } catch (e) {
    console.warn('[calSignals:scratchpad]', e.message);
    return '';
  }
}

// ── orchestrator: all post-turn calendar signals + the reply suffix ──────────
async function applyCalendarSignals(supabase, vendor, agentId, result) {
  const { booked, refused } = await bookEvents(supabase, vendor, agentId, result);
  const mutated = await mutateEvents(supabase, vendor, agentId, result);
  // §1.5's two hands land on THIS door too, and that is the whole point. DONNA_TOOLS is
  // ONE list (donna.ts:278) — not surface-aware — so the moment donna_block_date is
  // registered, the model can call it here. The hands live in ONE home (blockHands.js)
  // that both doors import.
  const blocked   = await blockDates(supabase, vendor.id, result);
  const unblocked = await unblockDates(supabase, vendor.id, result);
  await retroLinkOnFile(supabase, vendor, agentId, result);
  await lockstepBinderToEvent(supabase, vendor, result);
  // Advisories ride out beside the successes (Q-B4-5(b)): edits whose write landed WITH
  // a heads-up (appointment_overlap / cluster).
  const advised = mutated.filter((m) => m.ok && m.conflict);
  let suffix = '';
  if (booked.length)    suffix += '\n\n' + bookingLines(booked);
  if (refused.length)   suffix += '\n\n' + conflictLines(refused);   // F-04.55: the WA door stops being silent
  if (mutated.length)   suffix += '\n\n' + mutationLines(mutated);
  if (advised.length)   suffix += '\n\n' + advisoryLines(advised);
  if (blocked.length)   suffix += '\n\n' + scrubText(blockLines(blocked));
  if (unblocked.length) suffix += '\n\n' + scrubText(unblockLines(unblocked));
  return { booked, refused, mutated, blocked, unblocked, suffix };
}

module.exports = {
  fetchCalendarSnapshot, fetchScratchpad,
  bookEvents, mutateEvents, retroLinkOnFile, lockstepBinderToEvent, resolveEvent,
  bookingLines, conflictLines, mutationLines, advisoryLines, applyCalendarSignals,
};
