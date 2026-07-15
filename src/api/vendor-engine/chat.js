'use strict';
// src/api/vendor-engine/chat.js
// Vendor Suit, Phase 3-D — the engine-backed chat door. Victor comes online.
//
// This is the payoff of the port: the vendor talks to the advisor, who reasons
// with the standing SMM lens (and the category Codex, once a real MUA/planner
// hits it — Phase 2), dispatches Donna for any filing, and replies in his own
// voice. The door is a thin wrapper; runTurn owns everything — its own Anthropic
// client (ANTHROPIC_API_KEY, already in dream-os's env for Myra), the rolling
// per-agent conversation (memory persists with no work here), the owner briefing.
//
// Unlike the 3-C form doors, THIS is the model path: real Anthropic calls (Victor,
// plus Donna if dispatched). A turn takes seconds and costs tokens. The door just
// awaits runTurn, exactly as the Myra handler awaited its loop.
//
//   POST /api/v2/vendor-e/chat                 { message }  -> one advisor turn
//   GET  /api/v2/vendor-e/chat/history/:vendorId           -> display-only scrollback
const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const resolveAgent  = require('../middleware/resolveAgent');
// The compiled engine loop (Phase 0 landed src/engine; dist is built on deploy).
const { runTurn } = require('../../engine/dist/core/loop');
const { generateInvoiceForBinder } = require('../vendor/invoices');
// updateEvent's import is GONE: mutateEvents was its only caller here, and it routes
// through eventWrite now. lib/vendor/events.js still serves api/vendor/events.js — that
// door is relocation C's.
const { executeAndPatch } = require('../../lib/executeAndPatch');
const { missingCells } = require('../../lib/recordCompleteness'); // TDW_02 P3 (CE-16/17)
const { runHarvest } = require('../../agent/harvest');                      // TDW_02 P4
const { fetchRecentActivity, formatActivityBlock, logActivity } = require('../../lib/vendor/snapshot'); // TDW_02 P4 (CE-4)
const { resolveModel } = require('../../lib/modelRouter');   // TDW_02 P5
const { deriveFiling } = require('../../lib/undoContract');  // TDW_02 P6
const { llmStream, llmCreate } = require('../../lib/llm');   // TDW_02 P5
const { scrubText } = require('../../lib/vendor/scrub');        // TDW_04 B2 — F-04.38
const { writeEvent } = require('../../lib/vendor/eventWrite');  // TDW_04 B2 — the ONE writer

// ── THE PERSONA FIREWALL now lives at src/lib/vendor/scrub.js ─────────────────
// F-04.38 (TDW_04 B2, CE-ruled 2026-07-15). scrubText and scrubForStorage were
// DEFINED here and reachable ONLY from here — so this file's twin,
// src/lib/vendor/calendarSignals.js (the WhatsApp door's calendar apparatus,
// factored out of THIS FILE), duplicated all six write/render sites and carried
// NEITHER firewall. B1's cure covered "all four write sites" — all four in this
// file. The twin wrote public.events.title RAW from the same model.
// Both doors now import one firewall. Its full coverage map, its byte-identity
// note for scrubText, and the RULED signature adaptation on scrubForStorage
// (Q-B2-7 — the relocation law bends, stated, never silently) live in that file's
// header. Nothing about this door's behaviour changes: the call sites below pass
// (req.app.locals.supabase, req.vendor.id, 'pwa', …) — the exact three values the
// old req-shaped body dereferenced internally.
function actionKind(name) {
  if (/(find|tally|history|shelf|brief|whatsdue|search)/i.test(name || '')) return 'read';
  if (/(calendar|event)/i.test(name || '')) return 'calendar';
  return 'write';
}
function translateBeat(e, vendorId) {
  if (!e || !e.type) return null;
  switch (e.type) {
    // CE-18: the firewall extends over Victor's own prose — his soul holds
    // \"never reveal Donna\"; the wire must keep his covenant. (Per-delta scrub;
    // a token-split name is a residual risk logged in the handover.)
    case 'victor_token': return { type: 'text_delta', text: scrubText(e.text) };
    case 'dispatch':     return { type: 'handoff', from: 'victor', to: 'operator', message: scrubText(e.message) };
    case 'donna_action': {
      // TDW_02 P6: the verified-write chip payload — summary + record_ref + undo,
      // derived ONLY from the door's own witnessed result (F8's covenant). F3 rides
      // inside deriveFiling: an ERROR display becomes the honest failure line and
      // the raw DB text never crosses the wire (it stays in the engine trail).
      // P7-b: filings are for WRITES (and honest errors) only — a read beat never
      // wears a chip. G1 caught donna_find dressed as "Filed".
      const kindOf = actionKind(e.name);
      const raw = typeof e.result === 'string' ? e.result : '';
      if (kindOf !== 'write' && !raw.startsWith('ERROR')) {
        return { type: 'operator_action', kind: kindOf, detail: scrubText(raw) };
      }
      const filing = deriveFiling(vendorId, e.name, e.input, raw);
      if (filing.kind === 'error') {
        return { type: 'operator_action', kind: 'error', detail: filing.summary, summary: filing.summary, retryable: true };
      }
      return {
        type: 'operator_action', kind: actionKind(e.name),
        detail: scrubText(typeof e.result === 'string' ? e.result : ''),
        summary: scrubText(filing.summary),
        record_ref: filing.record_ref,
        undo: filing.undo,
      };
    }
    case 'donna_report': return { type: 'operator_report', message: scrubText(e.message) };
    // answer / done / handbook dropped: the reply already streamed as text_delta, and the
    // door sends its own authoritative done below.
    default: return null;
  }
}

// donna_invoice_pdf is Donna's SIGNAL hand: the engine only flags intent. The door mints
// the real numbered document (idempotent). Shared by the JSON and SSE paths so the invoice
// contract is identical on both.
async function buildInvoices(req, result) {
  const eng = req.app.locals.supabase.schema('engine');
  const wantInvoice = new Set();
  for (const tc of (result.tool_calls || [])) {
    if (tc.name === 'donna_invoice_pdf' && tc.input && tc.input.binder_id) wantInvoice.add(tc.input.binder_id);
    for (const dc of (tc.donna_calls || [])) {
      if (dc.name === 'donna_invoice_pdf' && dc.input && dc.input.binder_id) wantInvoice.add(dc.input.binder_id);
    }
  }
  const documents = [];
  for (const binderId of wantInvoice) {
    try {
      const { data: binder } = await eng.from('records')
        .select('id, client, phone, amount, amount_received, note')
        .eq('agent_id', req.agentId).eq('id', binderId).maybeSingle();
      if (binder && Number(binder.amount) > 0) {
        const gen = await generateInvoiceForBinder(req.app.locals.supabase, req.vendor, binder);
        if (gen && gen.ok) documents.push({ invoice_number: gen.invoice_number, pdf_url: gen.pdf_url, client: binder.client });
      }
    } catch (e) { console.error('[vendor-e chat:donna_invoice_pdf]', e.message); }
  }
  return documents;
}

// The chat-door confirms the invoice NUMBER only (the download lives in the invoices list).
// F-04.33 (same seam): d.client is DB-sourced and rode raw on both routes.
function invoiceLines(documents) {
  return scrubText(documents.map((d) =>
    `Invoice ${d.invoice_number}${d.client ? ' for ' + d.client : ''} is ready — find it in the invoices list to download or send.`
  ).join('\n'));
}

// donna_book_event is Donna's SIGNAL hand for the calendar: the engine flags intent, the
// door writes the real row into public.events (vendor-keyed) and confirms. Shared by the
// JSON + SSE paths, and the same handler a future WhatsApp door will call. The cabinet's
// "Booked" already reads public.events, so a booking shows up there with no UI change.
const BOOKED_KINDS = ['shoot', 'meeting', 'recce', 'fitting', 'trial', 'family', 'ceremony', 'social', 'other'];
// (c) A booking's link to a client binder: Donna's explicit binder_id is the EXACT path; if she
// gave none, the door tries a CONFIDENT name-match from the title (exact client name, single hit
// only) — never a guess. 0 or >1 matches -> left honestly unlinked (null). The link is what lets
// Donna keep the event's date and the binder's date in lockstep.
// resolveBinderForBooking + findExistingEvent ABSORBED INTO eventWrite (TDW_04 B2).
// They were this door's dedupe and backlink; they are now the ONE writer's, because the
// CRUD door needs the identical rules and two copies of a rule is how the two copies
// drift. Moved with logic byte-preserved (proven mechanically in B2's bench); only the
// req-dereferences became parameters, per Q-B2-7 as extended.
async function bookEvents(req, result) {
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
      // BOOKED_KINDS stays HERE and is deliberately NOT eventWrite's CALENDAR_KINDS: this is
      // the BOOKING door's coercion — an unrecognised kind from the model becomes a neutral
      // 'meeting'. It is also F-04.37's third layer (a model-sent kind='blocked' is coerced
      // to 'meeting' right here), which the §1.5 rider addresses. Left exactly as found:
      // changing it is the rider's chartered work, not this relocation's.
      const kind = BOOKED_KINDS.includes(bk.kind) ? bk.kind : 'meeting';

      // THIN CALLER. Everything this function used to do inline — the scrub, the dedupe,
      // the binder backlink, the insert-or-patch fork — is eventWrite's now. The diff
      // deletes; it does not reimplement.
      const r = await writeEvent(req.app.locals.supabase, {
        vendorId:    req.vendor.id,
        agentId:     req.agentId,
        surface:     'pwa',
        source:      'victor',
        title:       bk.title,
        event_date:  bk.event_date,
        event_time:  bk.event_time || null,
        kind,
        notes:       bk.notes || null,
        client_hint: bk.binder_id || null,
        state:       'upcoming',
      });
      if (!r.ok) {
        // Unchanged in substance: a failed booking is not pushed to `booked`, so no
        // bookingLine claims it. The door has never lied about a write that didn't land.
        console.error('[vendor-e chat:donna_book_event]', r.error || (r.conflict && r.conflict.kind) || 'write refused');
        continue;
      }
      booked.push(r.event);
    } catch (e) { console.error('[vendor-e chat:donna_book_event]', e.message); }
  }
  return booked;
}
// ── TDW_04 B1 SEAL RIDER — F-04.33 (CE-ruled 2026-07-15) ────────────────────
// THE PERSONA FIREWALL ENDED AT `result.reply` AND NOTHING TOLD ANYONE.
// scrubText covered the model's prose (:728). These builders' output was appended
// AFTER it (:734/:735) and sent as RAW text_delta on the SSE route (:677/:680/:683).
// Both routes leaked. Founder specimen, 2026-07-15 15:45/15:47 — ONE turn, TWO paths:
//   trace  (translateBeat -> scrubText):  "Booking requested: VICTOR - personal unavailable"
//   reply  (bookingLines, unscrubbed):    "Booked: HARVEY - personal unavailable"
// Same string. One scrubbed, one not. The scrub was never broken; it was never applied.
//
// THE CURE IS AT THE SEAM, NOT THE ROUTES (CE-ruled): each builder returns an
// ALREADY-SCRUBBED string, so one change covers both routes and no future caller can
// forget. Whole-string scrub — no token-split residual.
//
// WHAT THIS DOES NOT FIX, deliberately: the title itself is still wrong. "Victor -
// family wedding" is a persona in the CLIENT SLOT of the estate's `<client> - <purpose>`
// convention (cf. "Ananya - recce"), for a block that is the VENDOR'S OWN. The leak
// dies here; the misattribution is F-04.34(ii) and belongs to Block 06. A scrub cannot
// fix a sentence that means the wrong thing — it can only stop it naming Harvey.
//
// COVERAGE MAP (stated per the protocol candidate this finding created — any sitting
// touching a firewall must publish the firewall's full reach):
//   scrubText IS applied to: result.reply (:728) · translateBeat's victor_token and
//     dispatch beats · and now bookingLines / mutationLines / invoiceLines (here).
//   scrubText is NOT applied to: anything written to the DATABASE (F-04.34, open) ·
//     any read path outside this file (calendar grid, day sheet, /vendor/events, all
//     of B5) — those render events.title RAW and no scrub reaches them.
function bookingLines(booked) {
  return scrubText(booked.map((bk) => {
    const when = bk.event_time ? `${bk.event_date} at ${bk.event_time}` : bk.event_date;
    return `Booked: ${bk.title} — ${when}. It's on your calendar.`;
  }).join('\n'));
}
// Retroactive link: when a client binder is filed (donna_client), tie any existing unlinked event
// that exactly name-matches that client — so the common "book the date, file the client later" order
// still ends up linked. Confident only: a single binder for the name, exact client-hint match.
async function retroLinkOnFile(req, result) {
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
      const { data: binders } = await req.app.locals.supabase.schema('engine')
        .from('records').select('id, client')
        .eq('agent_id', req.agentId).ilike('client', name).limit(2);
      if (!binders || binders.length !== 1) continue; // not a confident single binder
      const binderId = binders[0].id;
      const { data: evs } = await req.app.locals.supabase
        .from('events').select('id, title')
        .eq('vendor_id', req.vendor.id).is('linked_binder_id', null)
        .neq('state', 'cancelled').ilike('title', `${name}%`).limit(20);
      for (const ev of (evs || [])) {
        const hint = String(ev.title || '').split(/[-–—·:]/)[0].trim();
        if (hint.toLowerCase() !== name.toLowerCase()) continue; // exact client-hint only
        await req.app.locals.supabase.from('events')
          .update({ linked_binder_id: binderId }).eq('id', ev.id).eq('vendor_id', req.vendor.id);
      }
    } catch (e) { console.warn('[vendor-e chat:retro-link]', e.message); }
  }
}

// donna_edit_event / donna_cancel_event are Donna's SIGNAL hands for changing the calendar.
// The door resolves the event (vendor-scoped; only on a full valid handle, so a truncated
// one reports cleanly instead of hard-erroring — the short-UUID lesson), applies the change,
// and confirms. Both now write through eventWrite (TDW_04 B2), so the CRUD door and this
// one cannot drift: one writer, two doors.
// ── TDW_04 B0 item 3 (CE extension, 2026-07-15) — THE CHAT LANE JOINS THE LEDGER ──
//
// Recorded as NEW SCOPE, not laundered into ST-3d: ST-3d is SURFACE_TRUTH_AUDIT R3(d),
// whose text is "Log BINDER-DOOR and LEAD-DOOR writes" — that shipped (binderWrite.js
// :69/:109, leads.js :203/:292/:337/:394). The chat lane was never in ST-3d or L-9.
//
// WHY (F-04.21, founder-run evidence 2026-07-15): fourteen vendor_activity_log rows in
// the 11:00-14:00 window, ALL surface='pwa' from the list page. ZERO from this lane.
// The lead this lane created at 11:22:38 logged nothing, so establishing who wrote it
// took four founder-run queries. The doors log; the WA agent logs (agent/engine.js:268);
// this lane did not.
//
// GRANULARITY (CE-ruled): ONE ROW PER NESTED MUTATING donna_call. A turn that files a
// lead and a payment made two facts; the ledger records two. Donna's hands nest inside
// tool_calls[].donna_calls (loop.ts:48, :368-372) — top-level carries only her
// dear_donna_talk/listen_harvey_talk envelope, so a top-level-only scan logs nothing.
//
// ERROR GATE (CE-ruled): the doors' isErr convention — a display starting with 'ERROR'
// is a FAILED write and is never logged. WA's looksLikeError regex (engine.js:266) is a
// legacy heuristic and is deliberately NOT propagated.
//
// SIGNAL-ONLY TOOLS ARE DELIBERATELY ABSENT FROM THIS SET. donna_invoice_pdf
// (recordPrimitives.ts:540-545), donna_book_event (:546-555), donna_edit_event
// (:556-564) and donna_cancel_event (:565-570) WRITE NOTHING in the engine — their
// displays are future tense ("it is being placed on the calendar") because the real
// write happens in THIS FILE's post-processors (buildInvoices/bookEvents/mutateEvents),
// which can still fail after the signal returns cleanly. Logging a signal as an activity
// row would enter a REQUEST into the ledger as a COMPLETED FACT — F-04.21's exact
// disease rebuilt inside the cure for it. Their door-side writes remain unlogged as of
// B0; see the handover's PROPOSAL (not implemented, outside this charter).
//
// The write set below is enumerated from executeRecordTool's own switch
// (recordPrimitives.ts) plus donna_lead (donna.ts:482-491, the only other hand that
// sets mutated=true). Reads are excluded by construction (donna.ts:442's read sets);
// donna_verdict/donna_review write supervision tables, never vendor-visible records,
// and do not set mutated (donna.ts:466-480) — excluded.
const CHAT_MUTATING_TOOLS = new Set([
  'donna_money',                        // recordPrimitives.ts:417
  'donna_date',                         // :456
  'donna_client',                       // :458
  'donna_note',                         // :460
  'donna_note_append',                  // :463
  'donna_phone',                        // :467
  'donna_doc',                          // :469
  'donna_stage',                        // :471
  'donna_write_reasonforaction_append', // :474
  'donna_money_edit',                   // :476
  'donna_edit',                         // :525
  'donna_hide',                         // :571
  'donna_unarchive',                    // :580
  'donna_retrieve',                     // :581 (transitional alias, same hand)
  'donna_merge',                        // :590
  'donna_split',                        // :631
  'donna_repeatfollowup',               // :671
  'donna_lead',                         // donna.ts:482-491 (typed plane, LD-1)
]);

// Collect every mutating call at BOTH depths, in turn order, then log one row each.
// Fire-and-forget throughout: logActivity is fail-safe by contract (snapshot.js:112-141)
// and a ledger miss must never disturb a write that already landed.
async function logChatActivity(req, result) {
  const supabase = req.app.locals.supabase;
  const isErr = (r) => typeof r === 'string' && r.startsWith('ERROR');
  const hits = [];
  for (const tc of (result.tool_calls || [])) {
    if (CHAT_MUTATING_TOOLS.has(tc.name)) hits.push(tc);
    for (const dc of (tc.donna_calls || [])) if (CHAT_MUTATING_TOOLS.has(dc.name)) hits.push(dc);
  }
  for (const c of hits) {
    if (isErr(c.result)) continue; // a failed write is not an activity
    // entity_type/entity_id stay NULL: tool_calls carries no item.ref_id, and parsing an
    // id out of prose would put an inference in the ledger. The display's own first line
    // carries the id where the tool prints one (donna_lead: "Lead saved. id=<uuid>...").
    // PROPOSAL in the handover: have the engine surface item.ref_id on tool_calls.
    logActivity(supabase, {
      vendorId: req.vendor.id,
      surface: 'pwa',
      action: c.name, // tool name — logActivity's own convention (snapshot.js:132)
      summary: String(c.result || c.name).split('\n')[0].slice(0, 240),
      entityType: null,
      entityId: null,
    }).catch(() => {});
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function resolveEvent(req, eventId) {
  const raw = String(eventId || '').trim();
  if (!UUID_RE.test(raw)) return null; // not a usable handle -> door reports "tell me which one"
  const { data, error } = await req.app.locals.supabase
    .from('events')
    .select('id, title, event_date, event_time, kind, state, linked_binder_id')
    .eq('vendor_id', req.vendor.id)
    .eq('id', raw)
    .is('deleted_at', null)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}
async function mutateEvents(req, result) {
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
      const ev = await resolveEvent(req, e.event_id);
      if (!ev) { done.push({ action: 'edit', ok: false }); continue; }
      const patch = {};
      for (const k of ['title', 'event_date', 'event_time', 'kind', 'notes']) {
        if (typeof e[k] === 'string' && e[k].trim()) patch[k] = e[k].trim();
      }
      // Routed: updateEvent's raw .update() is gone. The scrub that used to live in this
      // loop lives in eventWrite now (same rule — only the free-text cells; dates and enums
      // are noise), so this loop is back to what it was before F-04.34 patched it here.
      const r = await writeEvent(req.app.locals.supabase, {
        vendorId: req.vendor.id, surface: 'pwa', source: 'victor', event_id: ev.id, ...patch,
      });
      // Lockstep: a linked event's date moved -> carry the binder's date along, through Donna's hand
      // (the binder is engine-owned, so it goes through donna_date — snapshot patched, trail written).
      // VERBATIM from B1. The charter relocates this leg unchanged; only its sibling's raw
      // write moved.
      if (r && r.ok && patch.event_date && ev.linked_binder_id) {
        try { await executeAndPatch(req.agentId, 'donna_date', { binder_id: ev.linked_binder_id, date: patch.event_date }); }
        catch (e2) { console.warn('[vendor-e chat:lockstep e->b]', e2.message); }
      }
      done.push(r && r.ok ? { action: 'edit', ok: true, event: r.event || ev } : { action: 'edit', ok: false });
    } catch (err) { console.error('[vendor-e chat:donna_edit_event]', err.message); done.push({ action: 'edit', ok: false }); }
  }
  for (const c of cancels) {
    try {
      const ev = await resolveEvent(req, c.event_id);
      if (!ev) { done.push({ action: 'cancel', ok: false }); continue; }
      // Routed. A cancel is a state write, and state is eventWrite's to set.
      const r = await writeEvent(req.app.locals.supabase, {
        vendorId: req.vendor.id, surface: 'pwa', source: 'victor', event_id: ev.id, state: 'cancelled',
      });
      done.push(r && r.ok ? { action: 'cancel', ok: true, event: ev } : { action: 'cancel', ok: false });
    } catch (err) { console.error('[vendor-e chat:donna_cancel_event]', err.message); done.push({ action: 'cancel', ok: false }); }
  }
  return done;
}
// F-04.33 (same seam, same reason as bookingLines): e.title is DB-sourced and rode raw
// to the vendor on both routes.
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
// Lockstep the other way: when Donna moves a binder's date (donna_date / donna_edit carrying a date),
// the linked calendar event follows. The calendar is door-owned, so the event is written raw here
// (same as every other event write). Half A's binder write is a post-turn door action, never a
// donna_call in result, so this never sees it — no loop.
async function lockstepBinderToEvent(req, result) {
  const moves = new Map(); // binder_id -> date (last wins)
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
      // THE RAW WRITE THE CHARTER NAMED. It was one multi-row .update(); eventWrite writes
      // ONE row by id, so the predicate becomes a RESOLVE and each match goes through the
      // door. Same rows, same rule, one writer. (Identical shape to availability.js's
      // unblock, ratified at 4a: the guard moves into the constitution, not sideways.)
      const { data: evs, error } = await req.app.locals.supabase
        .from('events')
        .select('id')
        .eq('vendor_id', req.vendor.id)
        .eq('linked_binder_id', binderId)
        .neq('state', 'cancelled');
      if (error || !evs || !evs.length) continue;
      for (const ev of evs) {
        await writeEvent(req.app.locals.supabase, {
          vendorId: req.vendor.id, surface: 'pwa', source: 'victor',
          event_id: ev.id, event_date: date,
        });
      }
    } catch (e) { console.warn('[vendor-e chat:lockstep b->e]', e.message); }
  }
}

// Calendar sight: the door hands Harvey the vendor's upcoming bookings as a compact snapshot,
// injected into his turn (mirrors the cabinet snapshot). Read-only; the engine stays clean.
async function fetchCalendarSnapshot(req) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await req.app.locals.supabase
      .from('events')
      .select('id, title, event_date, event_time, kind, state')
      .eq('vendor_id', req.vendor.id)
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
    console.warn('[vendor-e chat:calendar snapshot]', e.message);
    return '';
  }
}

// The owner's note-to-self scratchpad — read for Donna's vision (door-fed; Harvey never sees it).
// owner_notes is public-schema, vendor-keyed; the door has req.vendor, so the door reads it and
// threads it to Donna via runTurn({ scratchpad }). Descriptive block only — the disposition to
// surface relevant notes to Harvey lives in Donna's soul, not here.
async function fetchScratchpad(req) {
  try {
    const { data, error } = await req.app.locals.supabase
      .from('owner_notes')
      .select('id, body, created_at')
      .eq('vendor_id', req.vendor.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error || !data || !data.length) return '';
    const lines = data.map((n) => `- ${n.body}`);
    return `[The owner's scratchpad — notes he has left for himself, in his own hand.]\n${lines.join('\n')}`;
  } catch (e) {
    console.warn('[vendor-e chat:scratchpad]', e.message);
    return '';
  }
}

// TDW_02 P4 (Amendment One CE-4): the RECENT ACTIVITY block, door-built, so the
// engine sees cross-surface actions AND harvest_patch rows — Victor never
// re-asks a harvested fact. Mechanical context; zero soul change. Fail-safe ''.
async function fetchRecentBlock(req) {
  try {
    const rows = await fetchRecentActivity(req.app.locals.supabase, req.vendor.id);
    return formatActivityBlock(rows, 'pwa');
  } catch (e) { console.warn('[vendor-e chat:recent-activity]', e.message); return ''; }
}

// TDW_02 P4: harvest, fire-and-forget AFTER the reply is on the wire. Never
// blocks, never throws to the request (harvest.js is internally best-effort).
function fireHarvest(req, message, result) {
  const supabase = req.app.locals.supabase;
  const vendor = req.vendor; const agentId = req.agentId;
  const toolCalls = (result && result.tool_calls) || [];
  setImmediate(() => {
    runHarvest({ supabase, vendor, agentId, message, toolCalls })
      .catch((e) => console.warn('[harvest] fire failed:', e.message));
  });
}

// ── TDW_02 P5: tiers, routes, caps ────────────────────────────────────────────
// CE-7: PRODUCT tier -> ENGINE tier, read-through at turn start, never a backfill.
const ENGINE_TIER_MAP = { trial: 'entry', essential: 'entry', signature: 'mid', prestige: 'top' };

// The turn's llm wiring. Anthropic routes pass NO transport — the engine's own
// pre-facade path runs byte-identical (acceptance 9). Non-anthropic routes pass
// the facade transport + one model for both hands.
async function buildLlmForTurn(req) {
  const productTier = (req.vendor && req.vendor.tier) || 'trial';
  const route = await resolveModel(req.app.locals.supabase, 'pwa_vendor', productTier);
  const tierOverride = ENGINE_TIER_MAP[productTier] || 'entry';
  // TDW_02 P7 (Amendment Two): optional per-role split — donna_provider/donna_model
  // route HER hand separately. Anthropic donna split => no donna transport (her own
  // pre-facade Haiku path, byte-identical).
  const donnaWiring = {};
  if (route.donna_provider && route.donna_provider !== route.provider) {
    if (route.donna_provider === 'anthropic') {
      donnaWiring.donnaTransport = undefined; donnaWiring.donnaModelOverride = undefined;
    } else {
      donnaWiring.donnaTransport = {
        provider: route.donna_provider,
        stream: (p) => llmStream(route.donna_provider, p),
        create: (p) => llmCreate(route.donna_provider, p),
      };
      donnaWiring.donnaModelOverride = route.donna_model;
    }
  }
  if (route.provider === 'anthropic') {
    // Victor anthropic (byte-identical); Donna may still split to a cheap provider.
    return { tierOverride, route, ...donnaWiring };
  }
  return {
    tierOverride,
    route,
    modelOverride: route.model,
    transport: {
      provider: route.provider,
      stream: (p) => llmStream(route.provider, p),
      create: (p) => llmCreate(route.provider, p),
    },
    ...donnaWiring,
  };
}

// CE-6/CE-23-iii: caps metered HERE, the shared handler — one meter, two mounts.
// Turn count = engine.usage rows (one per turn) for this agent, IST windows.
const IST_MS = 5.5 * 60 * 60 * 1000;
function istDayStartUtcISO() {
  const ist = new Date(Date.now() + IST_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_MS).toISOString();
}
function istMonthStartUtcISO() {
  const ist = new Date(Date.now() + IST_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - IST_MS).toISOString();
}
async function buildMeta(req, productTier) {
  try {
    const pub = req.app.locals.supabase;
    const eng = pub.schema('engine');
    const dayKey = `vendor_pwa_daily_${productTier}`;
    const monKey = `vendor_pwa_monthly_${productTier}`;
    const [{ data: cfg }, dayRes, monRes] = await Promise.all([
      pub.from('admin_config').select('key, value').in('key', [dayKey, monKey]),
      eng.from('usage').select('id', { count: 'exact', head: true }).eq('agent_id', req.agentId).gte('created_at', istDayStartUtcISO()),
      eng.from('usage').select('id', { count: 'exact', head: true }).eq('agent_id', req.agentId).gte('created_at', istMonthStartUtcISO()),
    ]);
    const val = (k, dflt) => { const r = (cfg || []).find((c) => c.key === k); const n = r ? parseInt(r.value, 10) : NaN; return Number.isFinite(n) && n > 0 ? n : dflt; };
    const dayCap = val(dayKey, 25), monCap = val(monKey, 250);
    const dayUsed = dayRes.count || 0, monUsed = monRes.count || 0;
    // Report the NEARER window (higher used/cap ratio); enforce BOTH (CE-6).
    const nearer = (dayUsed / dayCap) >= (monUsed / monCap)
      ? { turns_used: dayUsed, turns_cap: dayCap, window: 'day' }
      : { turns_used: monUsed, turns_cap: monCap, window: 'month' };
    const capped = dayUsed >= dayCap || monUsed >= monCap;
    const state = capped ? 'capped' : (nearer.turns_used / nearer.turns_cap >= 0.8 ? 'nearing' : 'ok');
    return { tier: productTier, ...nearer, state, upgrade: { label: 'Upgrade', href: '/vendor/settings#tier' } };
  } catch (e) {
    console.warn('[vendor-e chat:meta] failed (open meter):', e.message);
    return null; // a broken meter NEVER blocks a turn
  }
}
const CAPPED_LINE = (meta) =>
  `You've used this ${meta.window === 'day' ? "day's" : "month's"} conversations on the ${meta.tier} tier (${meta.turns_used}/${meta.turns_cap}). ` +
  (meta.window === 'day' ? 'The desk reopens at midnight' : 'The desk reopens on the 1st') + ' — or step up a tier and keep going.';

// POST /chat — one advisor turn. Vendor comes from the JWT (no :vendorId param),
// matching the Myra chat contract. ai_primer / mode are accepted and ignored:
// the engine runs advisory Victor and has no edit-priming mechanism (the Myra
// handler likewise accepted-and-ignored its `history` field).
router.post('/', requireAuth, resolveVendor(), resolveAgent(), async (req, res) => {
  const body    = req.body || {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return res.status(400).json({ ok: false, error: 'message is required.' });

  // ── SSE streaming path ──────────────────────────────────────────────────────
  // When the PWA sends Accept: text/event-stream, stream Victor's reply token by token
  // (the blob fills as he writes) plus the pair-at-work beats. The JSON path below is
  // untouched — curls, evals, and any non-stream caller behave exactly as before.
  const wantsStream = (req.headers['accept'] || '').includes('text/event-stream');
  if (wantsStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (res.flushHeaders) res.flushHeaders();

    let streamDead = false;
    res.on('error', (err) => { streamDead = true; console.warn('[vendor-e chat SSE] res error (absorbed):', err.message); });
    const send = (obj) => {
      if (streamDead || res.writableEnded) return;
      try { res.write(`data: ${JSON.stringify(obj)}\n\n`); }
      catch (err) { streamDead = true; console.warn('[vendor-e chat SSE] write failed:', err.message); }
    };

    try {
      send({ type: 'thinking' });
      const productTier = (req.vendor && req.vendor.tier) || 'trial';
      const metaPre = await buildMeta(req, productTier); // TDW_02 P5 (CE-6): both windows
      if (metaPre && metaPre.state === 'capped') {
        send({ type: 'text_delta', text: CAPPED_LINE(metaPre) });
        send({ type: 'done', tool_calls: [], refresh: false, meta: metaPre });
        if (!res.writableEnded) res.write('data: [DONE]\n\n');
        return res.end();
      }
      const llmWiring = await buildLlmForTurn(req); // TDW_02 P5
      const calendarSnapshot = await fetchCalendarSnapshot(req);
      const scratchpad = await fetchScratchpad(req);
      const recentActivity = await fetchRecentBlock(req); // TDW_02 P4 (CE-4)
      const result = await runTurn({
        agentId: req.agentId,
        message,
        calendarSnapshot,
        scratchpad,
        recentActivity,
        tierOverride: llmWiring.tierOverride,
        modelOverride: llmWiring.modelOverride,
        transport: llmWiring.transport,
        donnaTransport: llmWiring.donnaTransport,
        donnaModelOverride: llmWiring.donnaModelOverride,
        onEvent: (e) => { const safe = translateBeat(e, req.vendor.id); if (safe) send(safe); },
      });
      if (result.provider_downgrade) {
        logActivity(req.app.locals.supabase, { vendorId: req.vendor.id, surface: 'pwa', action: 'provider_downgrade', summary: `provider ${llmWiring.route.provider} downgraded to Haiku mid-turn` }).catch(() => {});
      }

      // Invoices are minted after the turn (donna_invoice_pdf is a signal). The reply has
      // already streamed, so the "ready" line rides as a final text_delta before done.
      const documents = await buildInvoices(req, result);
      if (documents.length) send({ type: 'text_delta', text: '\n\n' + invoiceLines(documents) });

      const booked = await bookEvents(req, result);
      if (booked.length) send({ type: 'text_delta', text: '\n\n' + bookingLines(booked) });

      const mutated = await mutateEvents(req, result);
      if (mutated.length) send({ type: 'text_delta', text: '\n\n' + mutationLines(mutated) });

      await retroLinkOnFile(req, result);
      await lockstepBinderToEvent(req, result);
      await logChatActivity(req, result); // TDW_04 B0 item 3

      const toolNames = (result.tool_calls || []).map((t) => t.name);
      const done = { type: 'done', tool_calls: toolNames, refresh: toolNames.length > 0 };
      // TDW_02 P3 (CE-17): the turn view crosses the wire, completeness attached.
      if (result.view && result.view.length) done.view = result.view.map((r) => ({ ...r, missing_cells: missingCells(r) }));
      done.meta = await buildMeta(req, productTier); // TDW_02 P5: the meter, every turn
      if (documents.length) done.documents = documents.map((d) => ({ invoice_number: d.invoice_number, pdf_url: d.pdf_url }));
      send(done);
      if (!streamDead && !res.writableEnded) res.write('data: [DONE]\n\n');
      res.end();
      fireHarvest(req, message, result); // TDW_02 P4 — after the wire closes
    } catch (e) {
      console.error('[vendor-e chat SSE]', e.message);
      send({ type: 'error', message: 'Chat failed.' });
      if (!res.writableEnded) { try { res.write('data: [DONE]\n\n'); } catch (_e) { /* gone */ } res.end(); }
    }
    return;
  }
  try {
    const productTier = (req.vendor && req.vendor.tier) || 'trial';
    const metaPre = await buildMeta(req, productTier); // TDW_02 P5 (CE-6)
    if (metaPre && metaPre.state === 'capped') {
      return res.json({ ok: true, capped: true, reply: CAPPED_LINE(metaPre), tool_calls: [], refresh: false, meta: metaPre });
    }
    const llmWiring = await buildLlmForTurn(req); // TDW_02 P5
    const calendarSnapshot = await fetchCalendarSnapshot(req);
    const scratchpad = await fetchScratchpad(req);
    const recentActivity = await fetchRecentBlock(req); // TDW_02 P4 (CE-4)
    const result    = await runTurn({ agentId: req.agentId, message, calendarSnapshot, scratchpad, recentActivity, tierOverride: llmWiring.tierOverride, modelOverride: llmWiring.modelOverride, transport: llmWiring.transport, donnaTransport: llmWiring.donnaTransport, donnaModelOverride: llmWiring.donnaModelOverride });
    if (result.provider_downgrade) {
      logActivity(req.app.locals.supabase, { vendorId: req.vendor.id, surface: 'pwa', action: 'provider_downgrade', summary: `provider ${llmWiring.route.provider} downgraded to Haiku mid-turn` }).catch(() => {});
    }

    const documents = await buildInvoices(req, result);
    const booked    = await bookEvents(req, result);
    const mutated   = await mutateEvents(req, result);
    await retroLinkOnFile(req, result);
    await lockstepBinderToEvent(req, result);
    await logChatActivity(req, result); // TDW_04 B0 item 3

    let reply = scrubText(result.reply); // CE-18: the firewall covers the reply itself
    // F-04.33: this route hand-rolled the invoice line instead of calling the builder —
    // precisely how a seam gets missed. One builder, one scrub, both routes.
    if (documents.length) reply += '\n\n' + invoiceLines(documents);
    if (booked.length) reply += '\n\n' + bookingLines(booked);
    if (mutated.length) reply += '\n\n' + mutationLines(mutated);

    fireHarvest(req, message, result); // TDW_02 P4 — response is fully built; fires post-return
    const toolNames = (result.tool_calls || []).map((t) => t.name);
    return res.json({
      ok: true,
      reply,
      tool_calls: toolNames,
      refresh: toolNames.length > 0,
      // TDW_02 P3 (CE-17): the turn view crosses the wire, completeness attached.
      view: result.view && result.view.length ? result.view.map((r) => ({ ...r, missing_cells: missingCells(r) })) : undefined,
      meta: await buildMeta(req, productTier), // TDW_02 P5: the meter, every turn
      documents: documents.length ? documents.map((d) => ({ invoice_number: d.invoice_number, pdf_url: d.pdf_url })) : undefined,
    });
  } catch (e) {
    console.error('[vendor-e chat]', e.message);
    return res.status(500).json({ ok: false, error: 'Chat failed.' });
  }
});

// GET /chat/history/:vendorId — display-only scrollback so the PWA chat shows the
// recent transcript on open instead of a blank screen. NOT agent memory (the
// engine reads history itself). Reads the agent's most-recent conversation (the
// one runTurn reuses within the session window), last N messages, mapped to the
// PWA shape: engine role 'user'->'user', 'assistant'->'ai' ('tool' rows skipped).
router.get('/history/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), resolveAgent(), async (req, res) => {
  const eng   = req.app.locals.supabase.schema('engine');
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);
  try {
    const { data: convo } = await eng.from('conversations')
      .select('id').eq('agent_id', req.agentId)
      .order('last_active_at', { ascending: false }).limit(1).maybeSingle();
    if (!convo) return res.json({ ok: true, messages: [] });

    const { data: rows, error } = await eng.from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', convo.id)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('[vendor-e chat/history] query error:', error.message);
      return res.status(500).json({ ok: false, error: 'Could not load history.' });
    }

    const messages = (rows || [])
      .reverse()
      .filter((m) => m.content && m.content.trim().length > 0)
      .map((m) => ({ id: m.id, role: m.role === 'user' ? 'user' : 'ai', text: m.content, at: m.created_at }));
    return res.json({ ok: true, messages });
  } catch (err) {
    console.error('[vendor-e chat/history]', err.message);
    return res.status(500).json({ ok: false, error: 'Could not load history.' });
  }
});

module.exports = router;
