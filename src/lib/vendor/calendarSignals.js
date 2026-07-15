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
const { updateEvent } = require('./events');
const { executeAndPatch } = require('../executeAndPatch');
const { scrubText, scrubForStorage } = require('./scrub'); // TDW_04 B2 — F-04.38

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOOKED_KINDS = ['shoot', 'meeting', 'recce', 'fitting', 'trial', 'family', 'ceremony', 'social', 'other'];
const S = 'whatsapp'; // F-04.38: this door's surface. snapshot.js:130's vocabulary; engine.js:270's precedent.

// ── donna_book_event ─────────────────────────────────────────────────────────
async function resolveBinderForBooking(supabase, agentId, bk) {
  const given = String(bk.binder_id || '').trim();
  if (UUID_RE.test(given)) return given;
  const hint = String(bk.title || '').split(/[-\u2013\u2014\u00b7:]/)[0].trim();
  if (hint.length < 2) return null;
  try {
    const { data, error } = await supabase.schema('engine')
      .from('records').select('id, client')
      .eq('agent_id', agentId).ilike('client', hint).limit(2);
    if (error || !data || data.length !== 1) return null;
    return data[0].id;
  } catch (e) { console.warn('[calSignals:link binder]', e.message); return null; }
}

async function findExistingEvent(supabase, vendor, bk) {
  const hint = String(bk.title || '').split(/[-\u2013\u2014\u00b7:]/)[0].trim();
  if (hint.length < 2) return null;
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, event_date, event_time, kind, linked_binder_id, state')
      .eq('vendor_id', vendor.id)
      .eq('event_date', bk.event_date)
      .neq('state', 'cancelled')
      .ilike('title', `${hint}%`)
      .limit(2);
    if (error || !data || data.length !== 1) return null;
    return data[0];
  } catch (e) { console.warn('[calSignals:dedupe]', e.message); return null; }
}

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
  for (const bk of wantBook) {
    try {
      const kind = BOOKED_KINDS.includes(bk.kind) ? bk.kind : 'meeting';
      // F-04.38: scrub-with-witness — no internal persona name reaches public.events
      // from THIS door either. Mirrors chat.js's B1 cure site-for-site.
      const row = { vendor_id: vendor.id, title: scrubForStorage(supabase, vendor.id, S, String(bk.title).slice(0, 200), 'donna_book_event', 'title'), event_date: bk.event_date, kind, state: 'upcoming' };
      if (bk.event_time) row.event_time = bk.event_time;
      if (bk.notes) row.notes = scrubForStorage(supabase, vendor.id, S, String(bk.notes), 'donna_book_event', 'notes');
      const linkedBinder = await resolveBinderForBooking(supabase, agentId, bk);
      const existing = await findExistingEvent(supabase, vendor, bk);
      if (existing) {
        const patch = {};
        if (bk.event_time) patch.event_time = bk.event_time;
        if (bk.notes) patch.notes = scrubForStorage(supabase, vendor.id, S, String(bk.notes), 'donna_book_event', 'notes'); // F-04.38
        if (linkedBinder && !existing.linked_binder_id) patch.linked_binder_id = linkedBinder;
        if (Object.keys(patch).length) {
          const { data } = await supabase.from('events')
            .update(patch).eq('id', existing.id).eq('vendor_id', vendor.id)
            .select('id, title, event_date, event_time, kind').maybeSingle();
          booked.push(data || existing);
        } else {
          booked.push(existing);
        }
        continue;
      }
      if (linkedBinder) row.linked_binder_id = linkedBinder;
      const { data, error } = await supabase
        .from('events').insert(row).select('id, title, event_date, event_time, kind').single();
      if (error) { console.error('[calSignals:donna_book_event]', error.message); continue; }
      booked.push(data);
    } catch (e) { console.error('[calSignals:donna_book_event]', e.message); }
  }
  return booked;
}

// F-04.38 (same seam, same reason as chat.js's F-04.33 cure): bk.title is
// DB-sourced and rode RAW to the vendor on the WhatsApp reply.
function bookingLines(booked) {
  return scrubText(booked.map((bk) => {
    const when = bk.event_time ? `${bk.event_date} at ${bk.event_time}` : bk.event_date;
    return `Booked: ${bk.title} — ${when}. It's on your calendar.`;
  }).join('\n'));
}

// ── retro-link on client file ────────────────────────────────────────────────
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
        if (hint.toLowerCase() !== name.toLowerCase()) continue;
        await supabase.from('events')
          .update({ linked_binder_id: binderId }).eq('id', ev.id).eq('vendor_id', vendor.id);
      }
    } catch (e) { console.warn('[calSignals:retro-link]', e.message); }
  }
}

// ── donna_edit_event / donna_cancel_event ────────────────────────────────────
async function resolveEvent(supabase, vendor, eventId) {
  const raw = String(eventId || '').trim();
  if (!UUID_RE.test(raw)) return null;
  const { data, error } = await supabase
    .from('events')
    .select('id, title, event_date, event_time, kind, state, linked_binder_id')
    .eq('vendor_id', vendor.id)
    .eq('id', raw)
    .is('deleted_at', null)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

async function mutateEvents(supabase, vendor, agentId, result) {
  const edits = [], cancels = [];
  const collect = (call) => {
    if (!call || !call.input) return;
    if (call.name === 'donna_edit_event' && call.input.event_id) edits.push(call.input);
    if (call.name === 'donna_cancel_event' && call.input.event_id) cancels.push(call.input);
  };
  for (const tc of (result.tool_calls || [])) {
    collect(tc);
    for (const dc of (tc.donna_calls || [])) collect(dc);
  }
  const done = [];
  for (const e of edits) {
    try {
      const ev = await resolveEvent(supabase, vendor, e.event_id);
      if (!ev) { done.push({ action: 'edit', ok: false }); continue; }
      const patch = {};
      for (const k of ['title', 'event_date', 'event_time', 'kind', 'notes']) {
        if (typeof e[k] === 'string' && e[k].trim()) {
          // F-04.38 (mirrors chat.js): only the free-text cells can carry a persona
          // name. event_date / event_time / kind are enums and dates — noise.
          patch[k] = (k === 'title' || k === 'notes')
            ? scrubForStorage(supabase, vendor.id, S, e[k].trim(), 'donna_edit_event', k)
            : e[k].trim();
        }
      }
      const r = await updateEvent(supabase, vendor.id, ev.id, patch);
      if (r && r.ok && patch.event_date && ev.linked_binder_id) {
        try { await executeAndPatch(agentId, 'donna_date', { binder_id: ev.linked_binder_id, date: patch.event_date }); }
        catch (e2) { console.warn('[calSignals:lockstep e->b]', e2.message); }
      }
      done.push(r && r.ok ? { action: 'edit', ok: true, event: r.event || ev } : { action: 'edit', ok: false });
    } catch (err) { console.error('[calSignals:donna_edit_event]', err.message); done.push({ action: 'edit', ok: false }); }
  }
  for (const c of cancels) {
    try {
      const ev = await resolveEvent(supabase, vendor, c.event_id);
      if (!ev) { done.push({ action: 'cancel', ok: false }); continue; }
      const { error } = await supabase
        .from('events').update({ state: 'cancelled' })
        .eq('id', ev.id).eq('vendor_id', vendor.id);
      done.push(!error ? { action: 'cancel', ok: true, event: ev } : { action: 'cancel', ok: false });
    } catch (err) { console.error('[calSignals:donna_cancel_event]', err.message); done.push({ action: 'cancel', ok: false }); }
  }
  return done;
}

// F-04.38: same seam. e.title is DB-sourced.
function mutationLines(done) {
  return scrubText(done.map((m) => {
    if (!m.ok) return m.action === 'cancel'
      ? `Couldn't cancel that booking — I didn't find a single match. Tell me which one.`
      : `Couldn't change that booking — I didn't find a single match. Tell me which one.`;
    const e = m.event || {};
    const when = e.event_time ? `${e.event_date} at ${e.event_time}` : e.event_date;
    return m.action === 'cancel'
      ? `Cancelled: ${e.title}${e.event_date ? ` — ${when}` : ''}. It's off your calendar.`
      : `Updated: ${e.title} — ${when}. The calendar's set.`;
  }).join('\n'));
}

// ── binder -> event date lockstep ────────────────────────────────────────────
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
      await supabase.from('events')
        .update({ event_date: date })
        .eq('vendor_id', vendor.id)
        .eq('linked_binder_id', binderId)
        .neq('state', 'cancelled');
    } catch (e) { console.warn('[calSignals:lockstep b->e]', e.message); }
  }
}

// ── turn inputs (pre-runTurn) ────────────────────────────────────────────────
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
      return `- [${e.id}] ${when} · ${e.title}${e.kind ? ` (${e.kind})` : ''}`;
    });
    return `[Calendar — upcoming, kept for you. The [handle] before each booking is how you reference it to change or cancel it.]\n${lines.join('\n')}`;
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
  const booked  = await bookEvents(supabase, vendor, agentId, result);
  const mutated = await mutateEvents(supabase, vendor, agentId, result);
  await retroLinkOnFile(supabase, vendor, agentId, result);
  await lockstepBinderToEvent(supabase, vendor, result);
  let suffix = '';
  if (booked.length)  suffix += '\n\n' + bookingLines(booked);
  if (mutated.length) suffix += '\n\n' + mutationLines(mutated);
  return { booked, mutated, suffix };
}

module.exports = {
  fetchCalendarSnapshot, fetchScratchpad,
  bookEvents, mutateEvents, retroLinkOnFile, lockstepBinderToEvent,
  bookingLines, mutationLines, applyCalendarSignals,
};
