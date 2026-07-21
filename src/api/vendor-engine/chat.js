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
const { OCCUPYING_KINDS, isWeddingAnchor } = require('../../lib/vendor/occupancy'); // TDW_04 B3 — the one set + the one rule (Q-B3-10, CE-ratified)
const { llmStream, llmCreate } = require('../../lib/llm');   // TDW_02 P5
const { scrubText } = require('../../lib/vendor/scrub');        // TDW_04 B2 — F-04.38
const { writeEvent } = require('../../lib/vendor/eventWrite');  // TDW_04 B2 — the ONE writer
const { blockDates, unblockDates, blockLines, unblockLines } = require('../../lib/vendor/blockHands'); // TDW_04 B2 §1.5

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

// ── TDW_06 sitting 0 — F-04.41's LEAD-PLANE CURE (CE ruling D-2). ONE HOME. ──
// The question "does this hand of hers wear a witness, and what does it say?" is
// asked ONCE here and rendered TWICE: as the live CHIP (translateBeat, below) and
// as the PERSISTED LINE (donnaWitnessLines -> composedTail). A second copy of this
// branch order would be F-04.36 wearing a chip; there is one.
// Returns the filing when the hand wears a witness, null when it does not:
//   · HER VOICE IS NOT A HAND. donna.ts:514 pushes `listen_harvey_talk` with a bare
//     toolCalls.push — never through record() — so it fires no donna_action and has
//     never worn a chip. It rides `donna_calls` all the same, and actionKind would
//     read it as a 'write'. Fenced here, by name, at the one home.
//   · reads and calendar signals wear no witness (P7-b; G1 caught donna_find dressed
//     as "Filed") — EXCEPT when the door's own display is an ERROR (F3).
//   · calendar hands are the chat.js doors' business: bookingLines/mutationLines
//     already speak for them in this same tail. One act, one line, never two.
function chipFiling(vendorId, name, input, result) {
  if (name === 'listen_harvey_talk') return null;
  const kindOf = actionKind(name);
  const raw = typeof result === 'string' ? result : '';
  if (kindOf !== 'write' && !raw.startsWith('ERROR')) return null;
  return deriveFiling(vendorId, name, input, raw);
}

// THE CURE ITSELF (D-2). Her hands are read from the turn's OWN nested donna_calls
// — the chip's existing source of truth, never a new source, NEVER Victor's claim.
// NESTED ONLY, per the ruling's own fence: at the top level sits `dear_donna_talk`,
// which actionKind would call a 'write' and which is not one.
//
// WHY IT EXISTS, in one line: composedTail patches seven door families and ZERO lead
// lines — a lead is filed by HER hand inside the engine and no chat.js door ever sees
// it — so `engine.messages` held "Done. Tara Door Test is logged" (which FILED,
// 17:03:44) and "Got it. Log Vera Seal Test —" (which filed NOTHING, 17:32:04) as the
// SAME artifact, forever: for the vendor's refresh AND for loadThread's replay
// (memory.ts:66 — role/content only; tool evidence never rides).
// A filed turn now replays WITNESSED; a narrated turn replays BARE. That asymmetry
// is the cure. Its effect on the dispatch failure is a STATED INFERENCE (D-2),
// watched and reported — never claimed.
function donnaWitnessLines(vendorId, result) {
  const lines = [];
  for (const call of (result && result.tool_calls) || []) {
    for (const dc of (call && call.donna_calls) || []) {
      const filing = chipFiling(vendorId, dc && dc.name, dc && dc.input, dc && dc.result);
      if (filing && filing.summary) lines.push(filing.summary);
    }
  }
  return lines;
}

// ── TDW_06 D-6 — F-04.81's MECHANICAL HALF (the §0.2 report's trigger, ruled). ──
// THE DISEASE: Donna searched, found nothing, and ended her segment asking
// ("Want me to log her as a fresh lead?" — 17:08:36); loop.ts ended the turn on
// Harvey's prose; the question died in the turn with zero rows, and the vendor
// read the narration as done. The machine asked itself for permission and hung up.
// THE TRIGGER, mechanical (D-6, ruled): donna.ts's pendingToolUseId — set EXACTLY
// when she spoke ALONE (work.length === 0), "she asked and is waiting" — surfaced
// by loop.ts as TurnResult.pendingDonnaQuestion (her final message text, or empty).
// No language detection; Q-R-3's aesthetic, one rule further in.
// THE GUARD (D-6's three clauses + D-9's fourth): turn ended (this post-turn door
// holds the result) AND pendingDonnaQuestion non-empty AND her message CARRIES `?`
// (D-9 — the conjunctive filter, the mechanical signal's OWN false-positive trap)
// AND ZERO WRITE HANDS in the turn's NESTED donna_calls — the only convicting
// reader, per D-1. The walk reuses the one home's own vocabulary: actionKind
// decides "write", and her voice (listen_harvey_talk) is fenced by name exactly
// as chipFiling fences it — it rides donna_calls and actionKind would misread it
// as a write. The top level is never walked (dear_donna_talk is not a hand).
//
// D-9 (F-04.82, CE-ruled; the §0.2 gloss "she asked and is waiting" RETIRED —
// the CE's own premise error owned by name in the ruling): listen-ALONE equally
// means "she answered whole" — the Ananya specimen (01:59:47) was Donna serving
// the healthiest read the engine has, snapshot-whole, no tools — and the guard
// dressed her report as an open question. The mechanical leg stays PRIMARY and
// untouched (pendingToolUseId); prose NARROWS it, never replaces it (Q-R-3's
// aesthetic intact). THE RULING'S GROUND, the asymmetry: a missed unmarked
// question = pre-cure silence for that turn (filed-on-sight if witnessed); a
// false "still open" = an active lie in the witness costume, strictly worse.
// THE LINE rides the witness machinery's own home: composedTail for persistence
// (the LAST element — matching its live position on the wire, so the stored and
// live renderings stay twins in order as well as bytes) and the wire for live.
// COPY, minted by the CE for the founder's veto (shipped byte-exact here);
// D-9's same one line trims the punctuation seam — no `?.` / `..` in the
// rendered form (the template's period is appended only when her sentence
// carries no terminal mark of its own; under the filter the surviving lines
// end `?`, subject to the founder's standing veto):
//   Still open — Donna asked: {her question} Answer it and she'll finish the filing.
// RENDERING DISCLOSURE, on the veto set not silently adapted: every rendering of
// this slot rides scrubText (CE-18/F-04.27, the persona firewall), which rewrites
// \bDonna\b -> Operator — the vendor reads "Still open — Operator asked: …". Both
// forms sit in front of the founder at delivery; the builder's bytes are the
// ruling's own letters.
const OPEN_QUESTION_LINE = (q) => `Still open — Donna asked: ${q}${/[.?!…]$/.test(q) ? '' : '.'} Answer it and she'll finish the filing.`;
function donnaOpenLine(result) {
  const q = result && typeof result.pendingDonnaQuestion === 'string'
    ? result.pendingDonnaQuestion.trim() : '';
  if (!q) return '';
  if (q.indexOf('?') === -1) return ''; // D-9: a report is not a question — the ? filter (F-04.82's cure)
  for (const call of (result && result.tool_calls) || []) {
    for (const dc of (call && call.donna_calls) || []) {
      if (!dc || dc.name === 'listen_harvey_talk') continue; // her voice is not a hand (D-2's fence)
      if (actionKind(dc.name) === 'write') return '';        // a write hand fired — nothing stands open
    }
  }
  return OPEN_QUESTION_LINE(q);
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
      // TDW_06 sitting 0 (D-2): the branch order moved into chipFiling — ONE home,
      // shared with the persisted witness line. BYTE-IDENTICAL for every reachable
      // input (the voice hand never reaches this beat: donna.ts:514 skips record()),
      // asserted both directions in b6_witness_bench §3.
      const raw = typeof e.result === 'string' ? e.result : '';
      const filing = chipFiling(vendorId, e.name, e.input, e.result);
      if (!filing) {
        return { type: 'operator_action', kind: actionKind(e.name), detail: scrubText(raw) };
      }
      if (filing.kind === 'error') {
        return { type: 'operator_action', kind: 'error', detail: filing.summary, summary: filing.summary, retryable: true };
      }
      return {
        type: 'operator_action', kind: actionKind(e.name),
        detail: scrubText(raw),
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
  // ── F-04.55's CURE, BOOKING HALF (Q-B4-5, CE-ratified 2026-07-16) ────────
  // `refused` is NEW and it is the whole point of this sitting. What it collects was
  // previously thrown away by the `continue` twelve lines down.
  //
  // ⚠ THE SIGNATURE CHANGES: this returned an ARRAY; it now returns { booked, refused }.
  //   Both call sites (the SSE route and the JSON route) move with it. DISCLOSED, never
  //   silent — Q-B2-7's ratified law: the relocation law bends, STATED.
  //
  // AMENDED F-04.55 (CE-ruled at B4): the booking half is not a silence, it is
  // PROTOCOL §4's "never a false 'done'" by name. The refused row never entered
  // `booked`, so bookingLines appended NOTHING — and the only thing the vendor read was
  // the model's own prose, ALREADY COMPOSED, because donna_book_event is a SIGNAL and
  // the model never learns the door refused. The log's own specimen wears it:
  // engine.messages holds "Done. Meera's trial is booked 30 July" forever, and the
  // trial is on 1 November (F-04.41). The fabricated success stood UNOPPOSED.
  const refused = [];
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
        // `|| undefined` — NOT `|| null`. The origin's guards were `if (bk.event_time)`
        // and `if (bk.notes)`: absent means DON'T TOUCH, never "set to NULL". eventWrite
        // reads undefined as untouched and null as clear, so this is the byte-faithful
        // translation of the guard that was here.
        event_time:  bk.event_time || undefined,
        kind,
        notes:       bk.notes || undefined,
        client_hint: bk.binder_id || null,
        state:       'upcoming',
      });
      if (!r.ok) {
        // STILL TRUE, and still the point: a failed booking is never pushed to `booked`,
        // so no bookingLine claims it. The door has never lied about a write that
        // didn't land. WHAT IS NEW IS THAT IT NO LONGER STAYS SILENT ABOUT IT.
        console.error('[vendor-e chat:donna_book_event]', r.error || (r.conflict && r.conflict.kind) || 'write refused');
        // The payload, carried — NOT re-derived. `conflict.message` is the founder-
        // blessed sentence and the door hands it to Victor VERBATIM (spec P2). `title`
        // rides only so the ledger/log line can name what was refused; the vendor-facing
        // string is the message and nothing else.
        refused.push({ title: bk.title, conflict: r.conflict || null, error: r.conflict ? null : (r.error || null) });
        continue;
      }
      booked.push(r.event);
    } catch (e) { console.error('[vendor-e chat:donna_book_event]', e.message); }
  }
  return { booked, refused };
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

// ══════════════════════════════════════════════════════════════════════════
// conflictLines — F-04.55's CURE AT THIS DOOR. (TDW_04 B4, Q-B4-5 CE-ratified)
// ══════════════════════════════════════════════════════════════════════════
//
// THE CHECKER HAS BEEN CORRECT AND UNREAD SINCE ZIP D. THIS IS THE FUNCTION THAT
// READS IT. Every vendor-facing sentence in occupancy.js was authored at the checker
// sitting SO THAT THIS WOULD BE A WIRING JOB AND NOT AN AUTHORING JOB — and it is:
// nothing below composes a sentence. It prints `conflict.message`.
//
// VERBATIM, AND NO WRAPPER PROSE. Spec P2: "message = a plain sentence, the door hands
// it to Victor VERBATIM." Spec P4.4: "authored so Victor can carry them verbatim
// without breaking voice — write them as he'd speak." A wrapper ("Sorry, but —") would
// be NEW vendor-facing copy and would need its own founder veto. There is none.
//
// NO SECOND MODEL CALL, and that is ruled, not saved-for-later (Q-B4-5(a)): the model
// has already composed by the time this runs. §7's economics clause — "date-awareness
// lookups are DB reads, not model calls — zero token cost" — is why the sentences were
// written in his register in the first place. A turn to "put it in his voice" would
// spend tokens to re-say a sentence already in his voice.
//
// ALREADY-SCRUBBED, LIKE ITS FOUR SIBLINGS — F-04.33's cure was ruled AT THE SEAM, not
// at the routes: "each builder returns an ALREADY-SCRUBBED string, so one change covers
// both routes and no future caller can forget." Two routes append these; neither may
// need to remember. (These strings are estate-authored, but `holding` carries DB-sourced
// titles and the messages interpolate them — overlapMessage prints one. F-04.33's
// specimen was exactly a DB-sourced title riding raw. The scrub is not ceremonial here.)
//
// ── THE ADVISORY ASYMMETRY (Q-B4-5(b), CE-ruled: SURFACE THEM) ────────────
// This builder is for REFUSALS — the write did not land, and the sentence stands alone.
// appointment_overlap and cluster ride out on { ok:true, event, conflict }: THE WRITE
// LANDED. They append BESIDE the success line, never instead of it — see advisoryLines.
// eventWrite's own gate says why: "a forced write that CLAIMS to have forced past an
// advisory is the same lie facing the other way." Announcing a heads-up as a refusal is
// that lie, one layer up.
//
// ── THE ERROR CHANNEL RIDES THE SAME RAIL ─────────────────────────────────
// FAIL-CLOSED's honest string ("Couldn't verify the calendar — nothing was changed. Try
// again.") is a refusal too — the checker could not see the calendar, so nothing was
// written. Same treatment, no special case: the vendor is owed the truth in both.
function conflictLines(refused) {
  return scrubText(refused.map((r) =>
    (r.conflict && r.conflict.message) || r.error || `Couldn't put that on the calendar — nothing was changed.`
  ).join('\n'));
}

// ── ADVISORIES: the write LANDED. Beside, never instead. (Q-B4-5(b)) ──────
// C9's "never blocks" was ruled three times and isRefusal is what makes it survive
// contact with the door's gate. This is the same ruling one layer up: an advisory that
// arrives where a refusal belongs is a heads-up wearing a refusal's clothes.
function advisoryLines(withAdvisory) {
  return scrubText(withAdvisory.map((a) => a.conflict.message).join('\n'));
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
        // Q-B2-11(1), CE-ruled 2026-07-15: ROUTED. The charter's "preserved verbatim"
        // clause was written to protect this function's EXISTENCE and BEHAVIOUR — the
        // §3.5 audit found an unspecced load-bearing wire and the fear was loss, not
        // modification. Its routing ruling was never written because retroLink was
        // never in the spec; it is written now. Behaviour identical; the census now
        // carries ZERO exceptions on the web door.
        await writeEvent(req.app.locals.supabase, {
          vendorId: req.vendor.id, surface: 'pwa', source: 'victor',
          event_id: ev.id, linked_binder_id: binderId,
        });
      }
    } catch (e) { console.warn('[vendor-e chat:retro-link]', e.message); }
  }
}

// donna_edit_event / donna_cancel_event are Donna's SIGNAL hands for changing the calendar.
// The door resolves the event through the TWO-LEG GATE at resolveEvent (a UUID for any
// caller that still holds one; otherwise a SAYABLE REFERENT — the booking's title,
// prefix-tolerant, with exact on_date when given — R-B6-1), applies the change,
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
// ── THE TWO-LEG GATE (R-B6-1's known second half, CE-ruled 2026-07-17) ──────
// The snapshot no longer hands Victor row ids, so a gate that required a UUID
// would strand every edit/cancel reference. Leg 1 (UUID, byte-identical to the
// B4-era gate) survives for any caller that still holds a real id. Leg 2 is the
// SAYABLE-REFERENT leg: vendor-scoped resolution on the booking's TITLE
// (prefix-tolerant — nameMatches, imported from resolveClientReference.js, the
// estate's ONE home for the token-boundary prefix rule; the resolver itself is
// precedent-not-reused because it resolves PEOPLE across clients/leads/invoices
// and this resolves EVENTS — different entity, different tables, different match
// shape) plus exact `on_date` when the model supplies it, against LIVE ROWS ONLY
// (`deleted_at is null` + `state <> 'cancelled'` — the covenant; note leg 1
// deliberately keeps its original predicate, which does NOT exclude cancelled —
// 0-behaviour-change on the UUID path, disclosed).
//
// AMBIGUITY RESOLVES TO HONESTY, NEVER TO A GUESS (the ruling's own words): two
// or more candidates return `{ambiguous:[…]}` and mutationLines speaks "tell me
// which one", listing each by title + date. Returns exactly one of:
//   { ev }                      resolved
//   { ambiguous: [{title, event_date}, …] }
//   { none: true }              nothing matched (the old null)
async function resolveEvent(req, eventId, onDate) {
  const raw = String(eventId || '').trim();
  if (!raw) return { none: true };
  if (UUID_RE.test(raw)) {
    const { data, error } = await req.app.locals.supabase
      .from('events')
      .select('id, title, event_date, event_time, kind, state, linked_binder_id')
      .eq('vendor_id', req.vendor.id)
      .eq('id', raw)
      .is('deleted_at', null)
      .maybeSingle();
    if (error || !data) return { none: true };
    return { ev: data };
  }
  // Leg 2. The ilike is a coarse DB-side prefilter refined by nameMatches —
  // resolveClientReference.js's own pattern, so "riya" never matches "Priya".
  const { nameMatches } = require('../../lib/vendor/resolveClientReference');
  let q = req.app.locals.supabase
    .from('events')
    .select('id, title, event_date, event_time, kind, state, linked_binder_id')
    .eq('vendor_id', req.vendor.id)
    .is('deleted_at', null)
    .neq('state', 'cancelled')
    .ilike('title', `%${raw}%`);
  const day = String(onDate || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) q = q.eq('event_date', day);
  const { data, error } = await q;
  if (error || !data) return { none: true };
  const hits = data.filter((r) => nameMatches(r.title, raw));
  if (hits.length === 1) return { ev: hits[0] };
  if (hits.length > 1) return { ambiguous: hits.map((r) => ({ title: r.title, event_date: r.event_date })) };
  return { none: true };
}
// TDW_04.5 P1 #4 — the crew name matcher. Case-insensitive, WITHIN THE ACTIVE TEAM
// (the door reads that set with team.js's own predicate before calling this). A member
// answers to the vendor's word when it is the full name OR any name-token (first or
// surname) — so "Rahul" reaches both Rahuls and clarify-once fires, while "Rahul Mehra"
// resolves to one. NOT resolveClientReference.nameMatches: that resolves PEOPLE across
// clients/leads/invoices; this resolves TEAM MEMBERS, a different set (resolveEvent's own
// precedent-not-reused note, one layer down).
function memberNameMatches(name, want) {
  const n = String(name || '').trim().toLowerCase();
  const w = String(want || '').trim().toLowerCase();
  if (!n || !w) return false;
  if (n === w) return true;                     // exact full name
  return n.split(/\s+/).includes(w);            // any token — the clarify-once source
}
async function mutateEvents(req, result) {
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
      const res = await resolveEvent(req, e.event_id, e.on_date);
      // ── AMBIGUITY (R-B6-1): two candidates resolve to honesty, never a guess.
      // The outcome carries the candidates so mutationLines can list them by
      // title + date — F-04.62's law extended: every cause names itself.
      if (res.ambiguous) { done.push({ action: 'edit', ok: false, reason: 'ambiguous', candidates: res.ambiguous }); continue; }
      const ev = res.ev;
      // ── F-04.62's CURE (CE-ruled 2026-07-16, filed and cured this ZIP) ────
      // `reason:'unresolved'` is the WHOLE FIX, and it is one word. THREE distinct
      // causes used to collapse into a bare `{ok:false}` here — no single match, a
      // deliberate REFUSAL, and a FAIL-CLOSED error — and mutationLines rendered all
      // three as "I didn't find a single match. Tell me which one." THIS is the only
      // branch that sentence was ever true of. See mutationLines' own note.
      if (!ev) { done.push({ action: 'edit', ok: false, reason: 'unresolved' }); continue; }
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
      // ── THE ANCHOR VETO (Q-B3-3 + Q-B3-9's amendment, CE-ruled 2026-07-16) ──
      // Lockstep: a linked event's date moved -> carry the binder's date along, through
      // Donna's hand (the binder is engine-owned, so it goes through donna_date — snapshot
      // patched, trail written). VERBATIM from B1 except the veto.
      //
      // THIS IS THE LEG THAT REWROTE MEERA'S WEDDING — witnessed, turn log 2026-07-15
      // 21:49 (donna_edit_event on the trial; binder written 697ms later by this line).
      // F-04.46 was FILED against T11, the CRUD door — which is router.patch('/:eventId')
      // and cannot be reached from chat at all. Q-B3-4's widening is what saved the cure:
      // had "only T11" been ruled, the fix would have landed on the leg that never fires
      // from Victor and left THIS one live. F-04.38's twin lesson, third instance.
      if (r && r.ok && patch.event_date && ev.linked_binder_id) {
        try {
          if (await isWeddingAnchor(req.app.locals.supabase, ev, ev.linked_binder_id)) {
            await executeAndPatch(req.agentId, 'donna_date', { binder_id: ev.linked_binder_id, date: patch.event_date });
          }
        }
        catch (e2) { console.warn('[vendor-e chat:lockstep e->b]', e2.message); }
      }
      // F-04.62: the outcome now carries its CAUSE. `conflict` rides on BOTH branches —
      // on ok:true it is an ADVISORY (the write landed; appointment_overlap/cluster ride
      // out on {ok:true, event, conflict}), and on ok:false it is a REFUSAL. Same field,
      // opposite meanings, and `ok` is the only thing that tells them apart — which is
      // exactly why isRefusal lives in occupancy.js and not in a door.
      done.push(r && r.ok
        ? { action: 'edit', ok: true,  event: r.event || ev, conflict: r.conflict || null }
        : { action: 'edit', ok: false, conflict: (r && r.conflict) || null,
            error: (r && !r.conflict && r.error) || null, reason: (r && (r.conflict || r.error)) ? null : 'unresolved' });
    } catch (err) { console.error('[vendor-e chat:donna_edit_event]', err.message); done.push({ action: 'edit', ok: false, reason: 'unresolved' }); }
  }
  for (const c of cancels) {
    try {
      const res = await resolveEvent(req, c.event_id, c.on_date);
      if (res.ambiguous) { done.push({ action: 'cancel', ok: false, reason: 'ambiguous', candidates: res.ambiguous }); continue; }
      const ev = res.ev;
      if (!ev) { done.push({ action: 'cancel', ok: false, reason: 'unresolved' }); continue; }
      // Routed. A cancel is a state write, and state is eventWrite's to set.
      const r = await writeEvent(req.app.locals.supabase, {
        vendorId: req.vendor.id, surface: 'pwa', source: 'victor', event_id: ev.id, state: 'cancelled',
      });
      // A cancel CANNOT draw a conflict — checkOccupancy's Item 3 guard returns null for
      // `eff.state === 'cancelled'` above every query ("a row leaving occupancy asks no
      // occupancy question"). It CAN still draw a FAIL-CLOSED error, and that is the
      // only reason `error` is read here. Read from the checker, not assumed by symmetry.
      done.push(r && r.ok
        ? { action: 'cancel', ok: true, event: ev }
        : { action: 'cancel', ok: false, error: (r && r.error) || null, reason: (r && r.error) ? null : 'unresolved' });
    } catch (err) { console.error('[vendor-e chat:donna_cancel_event]', err.message); done.push({ action: 'cancel', ok: false, reason: 'unresolved' }); }
  }
  // ── CREW (04.5 P1 #4) — assign / unassign, riding the SAME shared done[] ──────
  // Mirrors donna_edit_event: the SHARED resolveEvent (untouched) resolves the booking,
  // then a member is resolved case-insensitively within the ACTIVE team, and the crew SET
  // is written through writeEvent — the ONE writer (assign = union, unassign = difference;
  // array = SET semantics). The note-trail + crew_confirmations come FREE from eventWrite's
  // sealed crew core; nothing is re-implemented here. Every outcome names its own cause
  // (F-04.62's law): member_unresolved / member_ambiguous / idempotent / guard, and — for
  // the booking itself — the mirrored event ambiguous / unresolved reasons.
  const supabase = req.app.locals.supabase;
  for (const a of assigns) {
    try {
      const res = await resolveEvent(req, a.event_id, a.on_date);
      if (res.ambiguous) { done.push({ action: a.action, ok: false, reason: 'ambiguous', candidates: res.ambiguous }); continue; }
      const ev = res.ev;
      if (!ev) { done.push({ action: a.action, ok: false, reason: 'unresolved' }); continue; }
      // ── member resolution: ACTIVE team, team.js's predicate (active=true AND deleted_at
      //    IS NULL — the same set eventWrite validates the write against) ──
      const { data: teamRows, error: teamErr } = await supabase
        .from('team_members').select('id, name')
        .eq('vendor_id', req.vendor.id).eq('active', true).is('deleted_at', null);
      if (teamErr) { done.push({ action: a.action, ok: false, reason: 'unresolved' }); continue; }
      const matches = (teamRows || []).filter((m) => memberNameMatches(m.name, a.member));
      if (matches.length === 0) { done.push({ action: a.action, ok: false, reason: 'member_unresolved', memberName: a.member }); continue; }
      if (matches.length > 1)  { done.push({ action: a.action, ok: false, reason: 'member_ambiguous', memberName: a.member, memberCandidates: matches.map((m) => ({ id: m.id, name: m.name })) }); continue; }
      const member = { id: matches[0].id, name: matches[0].name };
      // ── ONE targeted vendor-scoped read of the current crew for ev.id. resolveEvent's
      //    select stays byte-identical (it never carries assigned_member_ids), so the crew
      //    read lives HERE, not in the shared resolver. ──
      const { data: cur } = await supabase
        .from('events').select('assigned_member_ids')
        .eq('id', ev.id).eq('vendor_id', req.vendor.id).is('deleted_at', null).maybeSingle();
      const currentIds = Array.isArray(cur && cur.assigned_member_ids) ? cur.assigned_member_ids.map(String) : [];
      const isOn = currentIds.includes(member.id);
      // idempotent-add no-op / remove-guard — THE BRANCH IS THE GUARD, no write fires.
      if (a.action === 'assign'   &&  isOn) { done.push({ action: 'assign',   ok: false, reason: 'idempotent', member, event: ev }); continue; }
      if (a.action === 'unassign' && !isOn) { done.push({ action: 'unassign', ok: false, reason: 'guard',      member, event: ev }); continue; }
      const newSet = a.action === 'assign'
        ? [...new Set([...currentIds, member.id])]         // union
        : currentIds.filter((id) => id !== member.id);     // difference
      const r = await writeEvent(supabase, {
        vendorId: req.vendor.id, surface: 'pwa', source: 'victor', event_id: ev.id, assigned_member_ids: newSet,
      });
      // `conflict` rides on ok:true as an ADVISORY (member_clash), exactly as edit's does —
      // the advised filter (mutated.filter: m.ok && m.conflict && m.conflict.message) carries
      // it to advisoryLines, BESIDE the witness, never instead. BYTE-READY-DORMANT (Rulings
      // 6/7, F-04.88): a crew-only write returns conflict==null TODAY because occupancy.js:551
      // short-circuits on touchesSpatial BEFORE the member_clash block (SPATIAL_KEYS has no
      // `members`). This plumbing surfaces the clash THE INSTANT the core cure teaches
      // touchesSpatial that members are spatial — NO door-side workaround, NO occupancy.js touch.
      done.push(r && r.ok
        ? { action: a.action, ok: true,  member, event: r.event || ev, conflict: r.conflict || null }
        : { action: a.action, ok: false, member, event: ev, conflict: (r && r.conflict) || null,
            error: (r && !r.conflict && r.error) || null, reason: (r && (r.conflict || r.error)) ? null : 'unresolved' });
    } catch (err) { console.error('[vendor-e chat:donna_assign_crew]', err.message); done.push({ action: a.action, ok: false, reason: 'unresolved' }); }
  }
  return done;
}
// F-04.33 (same seam, same reason as bookingLines): e.title is DB-sourced and rode raw
// to the vendor on both routes.
// ── F-04.62's CURE LIVES HERE (🔴, filed and cured this ZIP, CE-ruled 2026-07-16) ──
//
// THE SENTENCE BELOW WAS A LIE THE MOMENT THE CHECKER GOT A BODY, AND IT WAS LIVE IN
// PRODUCTION FROM ZIP D UNTIL THIS ZIP.
//
// It read, for EVERY `ok:false`:
//   "Couldn't change that booking — I didn't find a single match. Tell me which one."
//
// Three causes reached it. It was true of ONE:
//   · !ev              -> resolveEvent found no single match.  THE SENTENCE IS TRUE.
//   · a CONFLICT       -> the checker refused ON PURPOSE. Victor told the vendor he
//                         could not FIND a booking he found perfectly well and refused
//                         deliberately — and the vendor, taking him at his word, would
//                         re-specify the event and read the same sentence FOREVER.
//   · a FAIL-CLOSED    -> the checker could not see the calendar. Nothing was written,
//     ERROR               and the reason given named the wrong thing entirely.
//
// A DELIBERATE REFUSAL REPORTED AS A SEARCH FAILURE IS A FALSE DIAGNOSIS OF THE
// ESTATE'S OWN ACT. It is F-04.55's sibling and it is worse in kind: F-04.55's chat
// half was SILENCE (the kind went to a server log); this was a WRONG SENTENCE, spoken
// confidently, in Victor's voice, about the estate's own correct behaviour.
//
// The cure is one word — `reason:'unresolved'` at the two !ev branches — and this
// branch order. Every sentence now names what actually happened.
function mutationLines(done) {
  return scrubText(done.map((m) => {
    if (!m.ok) {
      // The REFUSAL: the checker's own sentence, VERBATIM (spec P2). It already says
      // what happened and why, in his register, and it is founder-blessed.
      if (m.conflict && m.conflict.message) return m.conflict.message;
      // FAIL-CLOSED's honest, retryable string. Also verbatim; also already true.
      if (m.error) return m.error;
      // ── CREW (04.5 P1 #4) — the crew-side causes, each naming itself. VERBATIM,
      //    founder veto (CE Ruling №8). More specific than the event reasons below,
      //    so they are tested first; the `reason` values do not collide with edit's. ──
      // Member ambiguity → clarify-once. Honesty, never a guess: the shared word,
      // then the full names to choose between.
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
      // AMBIGUITY (R-B6-1): more than one booking answers to that name. Honesty,
      // never a guess — each candidate listed by title + date so the vendor can
      // say which one in his next breath.
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
    // ── CREW WITNESS (04.5 P1 #4) — the ok:true action-aware branch; THE BRANCH IS
    //    THE GUARD (CE Ruling №5). Reading A (CE Ruling №8): raw {when}, time-optional,
    //    mirroring the sibling Updated: line's own event_date-guarded handling EXACTLY —
    //    one reply, one date voice. Humanizing is parked to the Block 09 estate-wide pass
    //    (F-04.89, filed). VERBATIM, founder veto. ──
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
// THE ANCHOR RULE lives in lib/vendor/occupancy.js beside the set it consumes
// (Q-B3-10, CE-ruled 2026-07-16 — it was shipped twice at B3; "they agree today;
// I read both" is F-04.36's origin sentence). Leg 1 and leg 3 now import ONE rule.

// ══════════════════════════════════════════════════════════════════════════
// THE COMPOSED-REPLY SAVE — Q-B4-6(b), F-04.41's CURE. (TDW_04 B6 sitting 2,
// R-B6-3 CE-confirmed: its own ZIP, after R-B6-1's green — this is that ZIP.)
// ══════════════════════════════════════════════════════════════════════════
//
// F-04.41, in one sentence: loop.ts saves the model's reply BEFORE these
// post-processors run, so the door lines — the WITNESS — ride only as text_delta
// and evaporate on refresh, while the model's prose — the GUESS — persists in
// engine.messages forever. The B6 smoke photographed the full sequence (the 06
// harvest, item 2): fabricate -> persist -> compound -> BLOCK a real write on
// the strength of a preserved fabrication. The founder screen-witnessed the
// refresh-evaporation the same sitting: the honest "Couldn't change that
// booking" gone, the fabricated "Done. 30 November is locked" standing alone.
//
// THE CURE: after every line-producing post-processor has run, the door patches
// the door lines onto the EXACT row loop.ts saved — result.assistant_message_id,
// the engine's own witness (never "the latest assistant row", which is a guess).
// The thread's channel 1 (loadThread, memory.ts — content only) then carries the
// witnessed lines beside the prose, so a preserved "Done" can no longer stand
// unopposed and the compounding chain loses its fuel.
//
// WHAT IS STORED: `result.reply` (the model half, byte-identical to what loop.ts
// saved — raw, pre-scrub, exactly as today) + the tail. The tail's strings are
// the builders' own output, already scrubbed at the seam (F-04.33's cure), which
// is also the copy-law's storage clause satisfied: no internal name can ride.
//
// WHAT IS DELIBERATELY NOT DONE: the model half is not re-scrubbed in storage
// (0-behaviour-change on what the thread held yesterday); a missing id writes
// NOTHING (never guess a row); a failed patch warns and never disturbs the
// response (the reply is already owed — leads.js:224's convention).
//
// composedTail RECOMPUTES the builders. Disclosed, and safe by construction:
// bookingLines/conflictLines/mutationLines/advisoryLines/invoiceLines and the
// blockHands pair are PURE functions of their inputs — a second call returns a
// byte-identical string — so the live send/append code above is untouched
// (0-line diff on the wire paths) and the two routes cannot drift from a third
// copy of the append order: this IS the one ordered list, same order as both
// routes append (documents · booked · refused · mutated · advised · blocked ·
// unblocked).
//
// TDW_06 sitting 0 (D-2) — `witnessed` joins the list FIRST and is the ONE element
// the routes do NOT append to the wire: her hands fire INSIDE the turn (before any
// door below runs), and live they are already rendered as CHIPS by translateBeat.
// So the live turn shows prose + chip; the stored turn shows prose + the same
// sentence as text. Two renderings of one witnessed fact — disclosed, because the
// list above claims to be the routes' order and now carries one line that is
// storage-only. Everything below it stays byte-identical, both routes.
// ADDITIVE: absent or empty `witnessed` returns the pre-cure bytes exactly (older
// callers and the sealed b6_sitting2_bench unaffected — proven both ways).
// TDW_06 D-6 — `open` joins the list LAST, and unlike `witnessed` it IS appended
// to the wire by both routes (it has no chip to render it live; the wire IS its
// live rendering, ruled). Last here so stored order equals live order — twins.
// ADDITIVE: absent or empty `open` returns the pre-D-6 bytes exactly (older
// callers and the sealed benches unaffected — proven both ways in the bench).
// Scrubbed here for the witnessed slot's own stated reason PLUS the line's own:
// it quotes Donna's sentence by name, and the firewall owns that rendering.
function composedTail({ witnessed, documents, booked, refused, mutated, advised, blocked, unblocked, open }) {
  const parts = [];
  // scrubText for blockLines' own stated reason: these summaries carry a
  // vendor-supplied NAME back to the wire, and a name is free text. The chip
  // scrubs its own summary at translateBeat; the stored twin scrubs here.
  if (witnessed && witnessed.length) parts.push(scrubText(witnessed.join('\n')));
  if (documents && documents.length) parts.push(invoiceLines(documents));
  if (booked && booked.length)       parts.push(bookingLines(booked));
  if (refused && refused.length)     parts.push(conflictLines(refused));
  if (mutated && mutated.length)     parts.push(mutationLines(mutated));
  if (advised && advised.length)     parts.push(advisoryLines(advised));
  if (blocked && blocked.length)     parts.push(scrubText(blockLines(blocked)));
  if (unblocked && unblocked.length) parts.push(scrubText(unblockLines(unblocked)));
  if (open)                          parts.push(scrubText(open)); // D-6, last by design
  return parts.length ? '\n\n' + parts.join('\n\n') : '';
}

async function persistComposedReply(req, result, tail) {
  if (!tail) return; // no door lines this turn — the saved row is already the whole truth
  const id = result && result.assistant_message_id;
  if (!id) return;   // the engine did not witness the row — write nothing, never guess one
  try {
    const { error } = await req.app.locals.supabase.schema('engine')
      .from('messages')
      .update({ content: `${result.reply || ''}${tail}` })
      .eq('id', id);
    if (error) console.warn('[vendor-e chat:composed-reply]', error.message);
  } catch (e) { console.warn('[vendor-e chat:composed-reply]', e.message); }
}

// Lockstep the other way: when Donna moves a binder's date (donna_date / donna_edit carrying a date),
// the linked calendar event follows — BUT ONLY IF THAT EVENT IS THE ENGAGEMENT.
// Half A's binder write is a post-turn door action, never a donna_call in result,
// so this never sees it — no loop.
//
// ── F-04.43's WALL (Q-B3-9's amendment, CE-ruled 2026-07-16) ──────────────
// A BINDER'S DATE IS THE WEDDING. A LINKED EVENT IS USUALLY AN APPOINTMENT
// LEADING UP TO IT. This leg used to drag EVERY linked event onto the binder's
// date. THE SPECIMEN, read from the turn log at B3 (2026-07-15 20:20:22): the
// founder filed "Meera Kapoor … wedding in November"; donna_edit wrote the
// binder's date NULL -> 2026-11-01 (a genuine FIRST write — donna_history in the
// same turn showed six writes, not one of them a date); this leg then dragged
// "Meera - trial" (kind='trial') off 30 Jul onto the wedding. Silently.
//
// F-04.43's filed headline — "the binder already carried 2026-11-01; re-asserting
// an existing date is enough" — WAS FALSE, and corrected on the record at B3.
// The old != new sentinel below CANNOT stop that crime: old and new differ. The
// KIND CHECK is what stops it. An appointment's date is its own; a wedding moving
// has no authority over a trial's calendar.
async function lockstepBinderToEvent(req, result) {
  // The gate (Q-B3-1 as re-scoped = F-04.48's cure): PROPAGATE ONLY A WITNESSED
  // CHANGE. This leg reads call.INPUT, never the write's outcome — so before B3
  // a donna_date that ERRORED still moved the vendor's calendar off a write that
  // never landed. Status-sniffing on the result string, exactly as chat.js:339's
  // isErr does — never value-parsing out of prose (eventWrite.js:472-475's rule).
  const isErr           = (r) => typeof r === 'string' && r.startsWith('ERROR');
  const isDateUnchanged = (r) => typeof r === 'string' && r.startsWith('DATE UNCHANGED');
  const moves = new Map(); // binder_id -> date (last wins)
  const collect = (call) => {
    if (!call || !call.input) return;
    if ((call.name === 'donna_date' || call.name === 'donna_edit') && call.input.binder_id
        && typeof call.input.date === 'string' && call.input.date.trim()) {
      if (isErr(call.result) || isDateUnchanged(call.result)) return; // no write landed -> nothing to mirror
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
      //
      // .in('kind', OCCUPYING_KINDS) IS F-04.43's CURE. The filter is pushed to the
      // database so an appointment is never even resolved, let alone written.
      const { data: evs, error } = await req.app.locals.supabase
        .from('events')
        .select('id')
        .eq('vendor_id', req.vendor.id)
        .eq('linked_binder_id', binderId)
        .neq('state', 'cancelled')
        .in('kind', OCCUPYING_KINDS);
      if (error || !evs || !evs.length) continue;
      // ── §2.5 / Q-S-2, CE-RULED — THE ONE AUTHORISED TOUCH ON THIS SEALED LEG ──
      //
      // `force: true`. A WEDDING MOVING IS A DECISION ALREADY MADE; the drag is its
      // CONSEQUENCE, not a proposal. The vendor is not asking the calendar whether
      // his client may marry on the 15th.
      //
      // F-04.56 IS WHY THIS LINE EXISTS, and until the checker sitting it was inert:
      // this leg passed no `force` and NEVER READ THE RETURN. The catch below catches
      // THROWS; `{ok:false, conflict}` is a RETURN. It was harmless only because
      // checkOccupancy returned null always. The moment the checker got a body, a
      // drag onto a date already at capacity would return a conflict, this leg would
      // discard it in silence, and THE BINDER WOULD MOVE WHILE THE CALENDAR DID NOT
      // — the exact divergence this block exists to kill, re-created by this block's
      // own checker, inside a leg the charter forbids reopening.
      //
      // ⚠ THE RULING'S OWN JUSTIFICATION — "date_blocked still refuses by Q-B3-8, so
      //   a drag can never land on a block" — WAS FALSE AGAINST THE CODE WHEN IT WAS
      //   WRITTEN, and was made true before this line shipped. The door's gate read
      //   `if (conflict && !force)` with no second term: force beat EVERY verdict,
      //   including date_blocked. Proven by running it: a forced booking landed on a
      //   block and wrote "[forced] You've blocked 19 July" into the vendor's note —
      //   the sentence Q-B3-8 exists to make impossible. Q-C-3 (CE-ruled 2026-07-16)
      //   put `isOverridable` in the gate. THIS LINE IS SAFE BECAUSE OF THAT ONE, AND
      //   NOT BEFORE IT. Do not port `force: true` to another caller without it.
      //
      // The vendor-facing surfacing ("your wedding move overloaded the 15th") is
      // B4's, with F-04.55. This is visibility without a surface change: the LEDGER
      // records what happened, both ways, so the estate stops being unable to answer
      // "did the calendar follow?" from anything but the rows.
      for (const ev of evs) {
        const r = await writeEvent(req.app.locals.supabase, {
          vendorId: req.vendor.id, surface: 'pwa', source: 'victor',
          event_id: ev.id, event_date: date, force: true,
        });
        // Fire-and-forget, BOTH OUTCOMES (CE-ruled): logActivity is fail-safe by
        // contract (snapshot.js:112-141) and a ledger miss must never disturb a write
        // that already landed. Only a WITNESSED outcome is logged — `r` is the door's
        // own return, not a guess about it. F-04.41's lesson: the door line is the
        // witness, the prose is the guess.
        if (r && r.ok && r.conflict) {
          logActivity(req.app.locals.supabase, {
            vendorId: req.vendor.id, surface: 'pwa', action: 'event_update',
            summary: `binder date-move: conflict overridden — "${(r.event && r.event.title) || ev.id}" moved to ${date} · ${r.conflict.message}`,
            entityType: 'event', entityId: ev.id,
          }).catch(() => {});
        } else if (r && !r.ok && r.conflict) {
          logActivity(req.app.locals.supabase, {
            vendorId: req.vendor.id, surface: 'pwa', action: 'event_update',
            summary: `binder date-move: drag refused by block — "${ev.id}" stayed put; ${date} is blocked · ${r.conflict.message}`,
            entityType: 'event', entityId: ev.id,
          }).catch(() => {});
        } else if (r && !r.ok) {
          // The third outcome the ruling did not name, and it is F-04.56's harm
          // wearing a different hat: the checker went FAIL-CLOSED (F15) or the write
          // refused, so the binder moved and this event did not. Logged to the server
          // only — inventing a ledger vocabulary the CE did not rule is how a wire
          // grows a fifth kind nobody ratified. Raised to B4 with F-04.55/F-04.56.
          console.warn('[vendor-e chat:lockstep b->e] drag did not land:', r.error || 'refused');
        }
      }
    } catch (e) { console.warn('[vendor-e chat:lockstep b->e]', e.message); }
  }
}

// Calendar sight: the door hands Harvey the vendor's upcoming bookings as a compact snapshot,
// injected into his turn (mirrors the cabinet snapshot). Read-only; the engine stays clean.
//
// ── F-04.66's CURE + P4.1, ONE EDIT TO ONE FUNCTION (R-B6-1, CE-ruled 2026-07-17) ──
// THE IDS LEAVE THIS PROSE AND THE WORD "handle" LEAVES WITH THEM. The old header
// handed Victor raw row ids, NAMED them "handle", and INSTRUCTED him to use them —
// F-04.37's signature ("he was not lying — he was obeying"), third instance, and the
// founder's 2026-07-17 19:43 specimen ("… (handle: 6cde1a36-…)") was the proof. A
// snapshot line is now a referent Victor can SAY — date + title — and the mutation
// gate below (resolveEvent) resolves what he says. Scrubbing the id at scrub.js was
// ruled OUT: scrubText is shared with tool-result renders (chat.js:85 scrubs
// e.result; donnaLead.ts:259 prints an id into it), so a UUID pattern there scrubs
// payloads — and a stripped id leaves "(handle: )" while the instruction survives
// (F-04.27's lesson inverted). The cure is at the source of the hand: this function.
//
// P4.1's DATE-PRESSURE LINE lands in the same edit, because it extends this exact
// function — building it first and curing second would reopen the first (the
// handoff's "two edits to one function where the second undoes the first").
// Siting re-ruled at B4 §3 and confirmed at R-B6-1: HERE, one home, door-fed —
// not donna.ts. Fed by describeWindow, which is fed by describeDate (occupancy.js;
// the eleven-null warrant in its header governs — OFF is spoken as OFF, unknown as
// unknown, never as free). Muhurat + enquiry dates are door reads (they are market
// and pipeline facts, not occupancy's): hot_dates is global (witnessed 8 columns,
// PUBLIC_SCHEMA.md — date/active/label); leads' open states are new/contacted/quoted
// — ⚠ that list's home is leads.js:75 ACTIVE_PIPELINE_STATES (a router export, not
// importable without dragging express); carried here BY VALUE with this pointer.
// Two homes for one list is F-04.36's shape — named, not hidden; a structural cure
// (export the constant or bench the agreement) is proposed in the B6 handover.
const PRESSURE_WINDOW_DAYS = 30; // spec P4.1's own number
function pressureDateWord(iso) {
  try {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  } catch { return iso; }
}
async function fetchCalendarSnapshot(req) {
  try {
    const supabase = req.app.locals.supabase;
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
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
      return `- ${when} · ${e.title}${e.kind ? ` (${e.kind})` : ''}`;
    });

    // ── P4.1: the date-pressure line. One dense line, words not tables. ──
    // Each read is best-effort and HONEST about failure: a failed market read says
    // "unknown", never "none" (F-04.21's family — absence is only evidence if you
    // looked). The occupancy half's honesty lives inside windowWords itself.
    let pressure = '';
    try {
      const { describeWindow, windowWords } = require('../../lib/vendor/occupancy');
      const horizon = new Date(`${today}T00:00:00Z`);
      horizon.setUTCDate(horizon.getUTCDate() + PRESSURE_WINDOW_DAYS - 1);
      const to = horizon.toISOString().slice(0, 10);

      // The date-FINDER lives at the DOOR, not in occupancy.js — checker_bench §14
      // holds that file horizon-free by construction (F-04.47's invariant), and this
      // window is the DOOR's question. Covenant lines are liveRowsOn's two, verbatim.
      // Its only power is which dates get asked: a missed date is an omission this
      // finder owns; every ANSWER still comes out of describeDate, per date.
      let candidateDates = null; // null = the finder failed -> the window is UNKNOWN
      try {
        const { data: cd, error: cdErr } = await supabase
          .from('events')
          .select('event_date')
          .eq('vendor_id', req.vendor.id)
          .gte('event_date', today)
          .lte('event_date', to)
          .is('deleted_at', null)              // F-04.25's covenant — the only lawful
          .neq('state', 'cancelled');          // non-occupancy, same as liveRowsOn.
        if (!cdErr) candidateDates = [...new Set((cd || []).map((r) => r.event_date).filter(Boolean))];
      } catch { candidateDates = null; }

      const win = await describeWindow({ supabase, vendorId: req.vendor.id, from: today, days: PRESSURE_WINDOW_DAYS, candidateDates });

      let muhurat;
      try {
        const { data: hd, error: hdErr } = await supabase
          .from('hot_dates')
          .select('date')
          .eq('active', true)
          .gte('date', today)
          .lte('date', to)
          .order('date', { ascending: true });
        muhurat = hdErr ? null : [...new Set((hd || []).map((r) => r.date))];
      } catch { muhurat = null; }

      let enquiry;
      try {
        const { data: ld, error: ldErr } = await supabase
          .from('leads')
          .select('wedding_date')
          .eq('vendor_id', req.vendor.id)
          .is('deleted_at', null)
          .in('state', ['new', 'contacted', 'quoted']) // ACTIVE_PIPELINE_STATES, leads.js:75 — see header
          .not('wedding_date', 'is', null)
          .gte('wedding_date', today)
          .lte('wedding_date', to);
        enquiry = ldErr ? null : [...new Set((ld || []).map((r) => r.wedding_date))].sort();
      } catch { enquiry = null; }

      const bits = [windowWords(win)];
      if (muhurat === null) bits.push('muhurat dates unknown (could not be read)');
      else if (muhurat.length) bits.push(`muhurat ${muhurat.map(pressureDateWord).join(', ')}`);
      else bits.push('no muhurat dates');
      if (enquiry === null) bits.push('enquiry dates unknown (could not be read)');
      else if (enquiry.length) bits.push(`${enquiry.length} enquiry date${enquiry.length === 1 ? '' : 's'} in play (${enquiry.map(pressureDateWord).join(', ')})`);
      else bits.push('no enquiry dates in play');
      pressure = `\n[Next ${PRESSURE_WINDOW_DAYS} days: ${bits.join(' · ')}.]`;
    } catch (e) {
      console.warn('[vendor-e chat:date-pressure]', e.message);
      // A failed pressure read never sinks the snapshot; it is simply absent —
      // an absent line claims nothing, which is the honest degradation.
      pressure = '';
    }

    // ── 04.5 P1.3: the STAFFING-GAP line. Sibling of the pressure line, beside it —
    // NOT merged (CE-ruled: its own 21-day window, the spec's "next 3 weeks", distinct
    // from the pressure line's 30). PLANNER-GATED by the estate's own predicate (the
    // RULED_OFF family — normaliseCategory === 'planning'); silent for every other craft.
    // Occupying bookings with no crew on them yet — the gap = occupying && crew empty.
    // HONESTY LAW, inherited from the block it joins (F-04.21's family): a failed read
    // renders NO line, never "0 functions" — absence is only evidence if you looked.
    // ZERO model calls, one DB read — exactly like its sibling. req.vendor is the full
    // vendors row (resolveVendor select('*')), so category costs no query. The string is
    // a FOUNDER-VETO proposal (bare shape, singular/plural agreed).
    let gap = '';
    try {
      const { normaliseCategory } = require('../../lib/vendor/categoryFraming');
      if (normaliseCategory(req.vendor.category) === 'planning') {
        const { OCCUPYING_KINDS } = require('../../lib/vendor/occupancy');
        const GAP_WINDOW_DAYS = 21;                        // spec's "next 3 weeks" — its OWN window
        const gapHorizon = new Date(`${today}T00:00:00Z`);
        gapHorizon.setUTCDate(gapHorizon.getUTCDate() + GAP_WINDOW_DAYS - 1);
        const gapTo = gapHorizon.toISOString().slice(0, 10);
        const { data: gd, error: gErr } = await supabase
          .from('events')
          .select('title, event_date, assigned_member_ids')
          .eq('vendor_id', req.vendor.id)
          .in('kind', OCCUPYING_KINDS)
          .gte('event_date', today).lte('event_date', gapTo)
          .is('deleted_at', null).neq('state', 'cancelled')   // liveRowsOn's two covenant lines
          .order('event_date', { ascending: true })
          .limit(50);
        if (!gErr && gd) {   // gErr -> NO line (honest); empty crew filtered in JS, real+bench alike
          const gaps = gd.filter((e) => !Array.isArray(e.assigned_member_ids) || e.assigned_member_ids.length === 0);
          if (gaps.length) {
            const soonest = gaps[0];
            const days = Math.round((Date.parse(`${soonest.event_date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
            const n = gaps.length;
            const noun = n === 1 ? 'function' : 'functions';
            const verb = n === 1 ? 'has' : 'have';
            const on   = n === 1 ? 'it' : 'them';
            const dw   = days === 1 ? 'day' : 'days';
            gap = `\n[${n} ${noun} in the next 3 weeks ${verb} no one on ${on} (${soonest.title} — ${days} ${dw}).]`;
          }
        }
      }
    } catch (e) {
      console.warn('[vendor-e chat:staffing-gap]', e.message);
      gap = '';   // a failed read says nothing — never "0 functions"
    }

    return `[Calendar — upcoming, kept for you. Refer to a booking by its name as it appears below (with its date, if two share a name) to change or cancel it.]\n${lines.join('\n')}${pressure}${gap}`;
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

// TDW_06 P6b (F-06.2, CE-ratified): the advisor room yields COUNSEL, not vendor facts —
// harvest must not mine an advisory turn for lead/binder patches. Gate on the turn's
// RESOLVED victor_mode (set by the engine on the result at loop.ts:700), so a mid-turn
// reality wins over the door's read. 'business' and consult (victor_mode absent) harvest
// byte-identically to today — only 'advisor' is gated.
const advisorHarvestGate = (result) => !!(result && result.victor_mode === 'advisor');

// TDW_02 P4: harvest, fire-and-forget AFTER the reply is on the wire. Never
// blocks, never throws to the request (harvest.js is internally best-effort).
function fireHarvest(req, message, result) {
  if (advisorHarvestGate(result)) return; // F-06.2: no harvest on the advisor room's counsel
  const supabase = req.app.locals.supabase;
  const vendor = req.vendor; const agentId = req.agentId;
  const toolCalls = (result && result.tool_calls) || [];
  setImmediate(() => {
    // F-04.72 (R-B6-29 shape (a)): the harvest now sees the turn's MODEL reply —
    // the disambiguation hold cannot exist without it. Door lines excluded by
    // design (they never ask); absent reply -> no holds, pre-rider behaviour.
    runHarvest({ supabase, vendor, agentId, message, toolCalls, replyText: (result && result.reply) || '' })
      .catch((e) => console.warn('[harvest] fire failed:', e.message));
  });
}

// ── TDW_02 P5: tiers, routes, caps ────────────────────────────────────────────
// CE-7: PRODUCT tier -> ENGINE tier, read-through at turn start, never a backfill.
const ENGINE_TIER_MAP = { trial: 'entry', essential: 'entry', signature: 'mid', prestige: 'top' };

// The turn's llm wiring. Anthropic routes pass NO transport — the engine's own
// pre-facade path runs byte-identical (acceptance 9). Non-anthropic routes pass
// the facade transport + one model for both hands.
// TDW_06 P6b (F-06.4, CE-ratified): the advisor room's model is chosen AT THE DOOR.
// victor_mode is read from engine.agents by the SERVER-RESOLVED agentId (resolveAgent
// middleware — the reverse bridge; NEVER a client-supplied id) and, when 'advisor',
// routes Victor to the model.pwa_vendor.advisor key. A read miss falls to 'business'
// (no advisor route). Business/consult are byte-identical to before this seam.
// TDW_06 P7b (F-06.1 second limb): PLAIN-ARGS ctx { supabase, agentId } so the WA door can
// share it — it has no Express req. Moved in LOCKSTEP with buildLlmForTurn (CE correction:
// buildLlmForTurn's co-dependent must not keep reading req.app or the WA call throws).
async function readVictorMode({ supabase, agentId }) {
  try {
    const { data } = await supabase.schema('engine')
      .from('agents').select('victor_mode').eq('id', agentId).maybeSingle();
    return (data && data.victor_mode) === 'advisor' ? 'advisor' : 'business';
  } catch (e) {
    console.warn('[vendor-e chat:victor_mode read]', e.message);
    return 'business';
  }
}

// TDW_06 P7b (F-06.1 second limb): PLAIN-ARGS ctx { supabase, vendor, agentId } — the ONE
// route builder both doors call, so the PWA door and the WA lane route IDENTICALLY (advisor
// -> deepseek; product tier otherwise). The PWA door passes { supabase: req.app.locals.supabase,
// vendor: req.vendor, agentId: req.agentId }; the WA lane (index.js) passes the same shape.
async function buildLlmForTurn({ supabase, vendor, agentId }) {
  const productTier = (vendor && vendor.tier) || 'trial';
  // F-06.4: the advisor room routes on its own key; every other mode routes on the
  // product tier exactly as before. The ENGINE tier (capabilities/caps) always follows
  // the PRODUCT tier — advisor changes only which MODEL serves Victor, not the tier.
  const victorMode = await readVictorMode({ supabase, agentId });
  const routeTier = victorMode === 'advisor' ? 'advisor' : productTier;
  const route = await resolveModel(supabase, 'pwa_vendor', routeTier);
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
      // TDW_06 meter fix: harvest's newly-metered rows carry conversation_id NULL
      // (they are spend, never turns). Every chat turn's row carries its conversation
      // (loop.ts sets it unconditionally), so on the pre-fix estate this filter is
      // count-neutral — the founder's read-only verify (delivery message) witnesses
      // the zero. Spend caps (server.ts agentSpendTodayInr) deliberately UNFILTERED:
      // harvest cost is real money and counts.
      eng.from('usage').select('id', { count: 'exact', head: true }).eq('agent_id', req.agentId).not('conversation_id', 'is', null).gte('created_at', istDayStartUtcISO()),
      eng.from('usage').select('id', { count: 'exact', head: true }).eq('agent_id', req.agentId).not('conversation_id', 'is', null).gte('created_at', istMonthStartUtcISO()),
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
      const llmWiring = await buildLlmForTurn({ supabase: req.app.locals.supabase, vendor: req.vendor, agentId: req.agentId }); // TDW_02 P5 · P7b ctx
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

      // TDW_04 B4 — F-04.55's cure, chat half. bookEvents' signature changed with it
      // ({booked, refused}); this is one of its two disclosed call sites (Q-B2-7).
      const { booked, refused } = await bookEvents(req, result);
      if (booked.length) send({ type: 'text_delta', text: '\n\n' + bookingLines(booked) });
      // THE REFUSAL, IN HIS VOICE. Ordered AFTER bookingLines and it matters: one turn
      // can book two dates and be refused a third, and the vendor is owed both facts in
      // the order they happened — what landed, then what did not.
      if (refused.length) send({ type: 'text_delta', text: '\n\n' + conflictLines(refused) });

      const mutated = await mutateEvents(req, result);
      if (mutated.length) send({ type: 'text_delta', text: '\n\n' + mutationLines(mutated) });
      // Advisories on writes that LANDED — beside the success line, never instead of it
      // (Q-B4-5(b)). mutationLines already spoke for the write; this speaks for the
      // heads-up. C9's "never blocks", honoured one layer up from the gate.
      const advised = mutated.filter((m) => m.ok && m.conflict && m.conflict.message);
      if (advised.length) send({ type: 'text_delta', text: '\n\n' + advisoryLines(advised) });

      // §1.5's two hands. scrubText wraps them for the same reason bookingLines is
      // wrapped (F-04.33's seam): these strings carry a vendor-supplied reason straight
      // back to the wire, and a reason is free text.
      const blocked = await blockDates(req.app.locals.supabase, req.vendor.id, result);
      if (blocked.length) send({ type: 'text_delta', text: '\n\n' + scrubText(blockLines(blocked)) });

      const unblocked = await unblockDates(req.app.locals.supabase, req.vendor.id, result);
      if (unblocked.length) send({ type: 'text_delta', text: '\n\n' + scrubText(unblockLines(unblocked)) });

      // TDW_06 D-6 — F-04.81's mechanical half: the open-question line. The wire
      // IS its live rendering (no chip exists for a hand that never fired); the
      // stored twin rides composedTail below, last, same bytes through the same
      // scrub. Sent after every door line — the open state speaks last.
      const openLine = donnaOpenLine(result);
      if (openLine) send({ type: 'text_delta', text: '\n\n' + scrubText(openLine) });

      await retroLinkOnFile(req, result);
      await lockstepBinderToEvent(req, result);
      await logChatActivity(req, result); // TDW_04 B0 item 3
      // TDW_04 B6 sitting 2 — Q-B4-6(b): the door lines join the thread's row.
      // Awaited (one UPDATE) so a refresh cannot race the patch it exists to fix.
      await persistComposedReply(req, result,
        composedTail({ witnessed: donnaWitnessLines(req.vendor.id, result), documents, booked, refused, mutated, advised, blocked, unblocked, open: openLine }));

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
    const llmWiring = await buildLlmForTurn({ supabase: req.app.locals.supabase, vendor: req.vendor, agentId: req.agentId }); // TDW_02 P5 · P7b ctx
    const calendarSnapshot = await fetchCalendarSnapshot(req);
    const scratchpad = await fetchScratchpad(req);
    const recentActivity = await fetchRecentBlock(req); // TDW_02 P4 (CE-4)
    const result    = await runTurn({ agentId: req.agentId, message, calendarSnapshot, scratchpad, recentActivity, tierOverride: llmWiring.tierOverride, modelOverride: llmWiring.modelOverride, transport: llmWiring.transport, donnaTransport: llmWiring.donnaTransport, donnaModelOverride: llmWiring.donnaModelOverride });
    if (result.provider_downgrade) {
      logActivity(req.app.locals.supabase, { vendorId: req.vendor.id, surface: 'pwa', action: 'provider_downgrade', summary: `provider ${llmWiring.route.provider} downgraded to Haiku mid-turn` }).catch(() => {});
    }

    const documents = await buildInvoices(req, result);
    // TDW_04 B4 — the second of bookEvents' two disclosed call sites.
    const { booked, refused } = await bookEvents(req, result);
    const mutated   = await mutateEvents(req, result);
    const advised   = mutated.filter((m) => m.ok && m.conflict && m.conflict.message);
    const blocked   = await blockDates(req.app.locals.supabase, req.vendor.id, result);   // §1.5
    const unblocked = await unblockDates(req.app.locals.supabase, req.vendor.id, result); // §1.5
    await retroLinkOnFile(req, result);
    await lockstepBinderToEvent(req, result);
    await logChatActivity(req, result); // TDW_04 B0 item 3
    // TDW_04 B6 sitting 2 — Q-B4-6(b): same call, same order, the JSON route's copy
    // of the SSE line above (the tail builder is the ONE ordered list for both).
    // TDW_06 sitting 0 (D-2): `witnessed` joins on BOTH routes — the stored row is
    // the cure's target and both routes store. This route's RETURNED `reply` below
    // is deliberately untouched (curl/eval bytes are existing behaviour, and this
    // route has no chip to twin); the divergence is one line, disclosed.
    // TDW_06 D-6: `open` joins on both routes too — and unlike `witnessed` it ALSO
    // joins this route's returned reply below, following the door-line convention
    // (booked/refused/mutated all do): a NEW line has no curl bytes to preserve,
    // and the line's live rendering is text on every surface.
    const openLine = donnaOpenLine(result);
    await persistComposedReply(req, result,
      composedTail({ witnessed: donnaWitnessLines(req.vendor.id, result), documents, booked, refused, mutated, advised, blocked, unblocked, open: openLine }));

    let reply = scrubText(result.reply); // CE-18: the firewall covers the reply itself
    // F-04.33: this route hand-rolled the invoice line instead of calling the builder —
    // precisely how a seam gets missed. One builder, one scrub, both routes.
    if (documents.length) reply += '\n\n' + invoiceLines(documents);
    if (booked.length) reply += '\n\n' + bookingLines(booked);
    if (refused.length) reply += '\n\n' + conflictLines(refused);   // TDW_04 B4 — F-04.55
    if (mutated.length) reply += '\n\n' + mutationLines(mutated);
    if (advised.length) reply += '\n\n' + advisoryLines(advised);   // TDW_04 B4 — Q-B4-5(b)
    if (blocked.length) reply += '\n\n' + scrubText(blockLines(blocked));       // §1.5
    if (unblocked.length) reply += '\n\n' + scrubText(unblockLines(unblocked)); // §1.5
    if (openLine) reply += '\n\n' + scrubText(openLine);                        // TDW_06 D-6, last

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

// ── TDW_06 D-7 — the new-thread endpoint (the PWA rider's backend half). ──────
// D-4 chartered the button; D-7 rules its machinery: ONE endpoint that closes
// the active conversation CLEANLY, using memory.ts's OWN abandonment shape —
// `.update({ state: 'abandoned' })` — the exact write getOrCreateConversation
// performs when the 30-minute timeout fires (memory.ts, read at HEAD: any
// state !== 'active' reads as stale and the next turn starts fresh). NEVER a
// delete: the conversation row and every message under it stand untouched —
// the scrollback persists on the estate, and the PWA's job is to make that a
// visible truth (the divider, ZIP 2's PWA half), not a caption claim.
// Idempotent by construction: no active conversation -> { ok: true, closed: null }
// (the timeout may already have done the work; tapping twice is harmless).
// On the vendor's next message, getOrCreateConversation finds nothing active
// and inserts a fresh thread — the interim relief's mechanism, on demand.
// TDW_06 P7a (F-06.8, CE-ratified): the mode-flip fresh-thread seam — ONE home, both
// flip surfaces chain it. A mid-thread mode flip must not leave the next turn reading the
// prior room's turns (Image-1: advisor-Victor reading the business thread's cabinet). The
// cure abandons the agent's active conversation (memory.ts's own 'abandoned' state — NEVER
// a delete; D-4's no-clear law: the rows persist, scrollback stays, the seam renders) so
// the next turn opens fresh with ZERO prior-room turns. Idempotent: nothing active ->
// { ok:true, closed:null } — safe to call on a no-op flip. Callers: POST /thread/fresh
// below (the PWA chip chains it after a successful mode PATCH) and the WA mode-words seam
// (src/index.js) once item 3 lands. Exported for both and for b06_fresh_thread_bench.
async function abandonActiveThread(supabase, agentId) {
  const eng = supabase.schema('engine');
  const { data: convo } = await eng.from('conversations')
    .select('id, state')
    .eq('agent_id', agentId)
    .order('last_active_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!convo || convo.state !== 'active') {
    return { ok: true, closed: null }; // nothing active — already fresh
  }
  const { error } = await eng.from('conversations')
    .update({ state: 'abandoned' }) // memory.ts's own shape — never delete
    .eq('id', convo.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, closed: convo.id };
}

router.post('/thread/fresh', requireAuth, resolveVendor(), resolveAgent(), async (req, res) => {
  try {
    const r = await abandonActiveThread(req.app.locals.supabase, req.agentId);
    if (!r.ok) {
      console.error('[vendor-e chat/thread-fresh] update failed:', r.error);
      return res.status(500).json({ ok: false, error: 'Could not close the thread.' });
    }
    return res.json({ ok: true, closed: r.closed });
  } catch (err) {
    console.error('[vendor-e chat/thread-fresh]', err.message);
    return res.status(500).json({ ok: false, error: 'Could not close the thread.' });
  }
});

module.exports = router;
// ── TEST SEAMS (TDW_04 B4) — occupancy.js's ratified precedent ────────────
// The bench drives the REAL builders. conflictLines/mutationLines/advisoryLines are
// where F-04.55's and F-04.62's cures live; a bench that re-implemented their branch
// order would prove its own copy and nothing else.
module.exports.conflictLines  = conflictLines;
module.exports.mutationLines  = mutationLines;
module.exports.advisoryLines  = advisoryLines;
// ── TEST SEAMS (TDW_04 B6, R-B6-1) — same precedent, same reason ──────────
// fetchCalendarSnapshot is where F-04.66's cure and P4.1's line live; resolveEvent
// is the two-leg gate. b6_referent_bench drives the REAL ones: the no-UUID
// assertion runs by regex against THIS function's built output, never a copy.
module.exports.fetchCalendarSnapshot = fetchCalendarSnapshot;
module.exports.resolveEvent          = resolveEvent;
// ── TEST SEAM (TDW_04.5 P1 #4) — same precedent, same reason ──────────────
// mutateEvents is the resolving door leg; b0457_assign_bench drives the REAL one
// (with the REAL resolveEvent, writeEvent, memberNameMatches and mutationLines behind
// it) against the sealed crew bench's proven double — a bench that re-implemented the
// resolve→delta→write path would prove its own copy and nothing else.
module.exports.mutateEvents          = mutateEvents;
// ── TEST SEAMS (TDW_04 B6 sitting 2, Q-B4-6(b)) — same precedent, same reason ──
// persistComposedReply is where F-04.41's cure lives; composedTail is the one
// ordered list. b6_sitting2_bench drives the REAL pair against a capturing
// double — a bench that re-implemented the append order would prove its copy.
module.exports.persistComposedReply  = persistComposedReply;
module.exports.composedTail          = composedTail;
// ── TEST SEAMS (TDW_06 sitting 0, D-2) — same precedent, same reason ──────
// donnaWitnessLines + chipFiling are where F-04.41's lead-plane cure lives, and
// translateBeat is the chip whose byte-identity the one-home move must prove.
// b6_witness_bench drives the REAL three (with the REAL deriveFiling and the REAL
// scrubText behind them) — a bench that re-implemented the branch order would
// prove its own copy and nothing else.
module.exports.donnaWitnessLines     = donnaWitnessLines;
module.exports.chipFiling            = chipFiling;
module.exports.translateBeat         = translateBeat;
// ── TEST SEAM (TDW_06 D-6) — same precedent, same reason ──────────────────
// donnaOpenLine is where F-04.81's mechanical half lives (the guard's three
// clauses + the minted line). b6_open_question_bench drives the REAL one, with
// the REAL composedTail, persistComposedReply and scrubText behind it.
module.exports.donnaOpenLine         = donnaOpenLine;
// ── TEST SEAM (TDW_06 economics sitting) — same precedent, same reason ─────
// actionKind is the ONE write/read/calendar vocabulary (D-1: only nested hands
// convict, and this is the word that classifies a hand). b06_gauntlet.js
// convicts candidates with the REAL classifier — a gauntlet that re-implemented
// it would convict against its own copy and nothing else.
module.exports.actionKind            = actionKind;
// TDW_06 P6b (F-06.4/F-06.2): door-seam seams exposed for b06_advisor_route_bench.
module.exports.buildLlmForTurn       = buildLlmForTurn;
module.exports.abandonActiveThread   = abandonActiveThread; // TDW_06 P7a (F-06.8): shared flip seam
module.exports.fireHarvest           = fireHarvest;
module.exports.advisorHarvestGate    = advisorHarvestGate;
module.exports.readVictorMode        = readVictorMode;
