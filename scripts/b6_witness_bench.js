#!/usr/bin/env node
// scripts/b6_witness_bench.js — TDW_06 sitting 0: F-04.41's LEAD-PLANE CURE
// (CE ruling D-2). Runnable from any working directory, clean clone, no npm
// install (Q-SP-5's law):
//   node scripts/b6_witness_bench.js
//
// WHAT THIS BENCH DRIVES, disclosed:
//  §1 THE CE'S NAMED TEST, FIRST — the 17:03:44-vs-17:32:04 pair from the outage
//     evening's own rows: the FILED turn (donna_lead landed, "Lead saved. id=…")
//     must replay WITNESSED; the NARRATED turn (tool_calls: [], the no-write
//     specimen) must replay BARE. Both run through the REAL donnaWitnessLines ->
//     REAL composedTail -> REAL persistComposedReply against a capturing double
//     (b6_sitting2_bench's own rig, carried). The REAL deriveFiling and the REAL
//     scrubText sit behind them — relative requires load for real under the fence.
//  §2 the fences: reads wear no witness (the 17:08:36 turn — four donna_finds and
//     her voice, zero rows: it must produce ZERO lines); her VOICE is not a hand;
//     calendar signals are the doors' business (no double-report); the top level
//     is never walked (dear_donna_talk is not a write).
//  §3 the ONE-HOME move's proof: translateBeat is BYTE-IDENTICAL for every
//     reachable beat, asserted against the pre-cure branch order re-stated here as
//     an oracle (the only re-implementation in this file, and it exists precisely
//     to be diffed against the real one).
//  §4 additivity: composedTail without `witnessed` returns pre-cure bytes; a tail
//     of only witness lines still lands; the empty tail still writes NOTHING.
//
// Ruling trail: D-2 (shape (a) ships as F-04.41's lead-plane cure on its own
// conviction; the dispatch effect is a STATED INFERENCE, never claimed) · D-1
// (only nested hands convict) · Q-B4-6(b) (the persist rig this extends).
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// ── the ratified doubles: the ledger shim + the module fence (b6_sitting2's own) ──
const snapPath = path.join(ROOT, 'src/lib/vendor/snapshot.js');
require.cache[snapPath] = { id: snapPath, filename: snapPath, loaded: true,
  exports: { logActivity: async () => {}, fetchRecentActivity: async () => [], formatActivityBlock: () => '' } };

const Module  = require('module');
const _load   = Module._load;
const BUILTIN = new Set(Module.builtinModules);
const noop    = () => new Proxy(function () {}, { get: () => noop() });
Module._load = function (req) {
  if (req === 'express') { const e = () => {}; e.Router = () => ({ get(){}, post(){}, patch(){}, put(){}, delete(){}, use(){} }); return e; }
  if (/engine\/dist\//.test(req)) return noop();
  if (!req.startsWith('.') && !req.startsWith('/') && !req.startsWith('node:') && !BUILTIN.has(req)) return noop();
  return _load.apply(this, arguments);
};

const CHAT  = path.join(ROOT, 'src/api/vendor-engine/chat.js');
const seams = require(CHAT);
const { composedTail, persistComposedReply } = seams;   // present at BOTH trees (Q-B4-6(b)'s seams)
const { deriveFiling } = require(path.join(ROOT, 'src/lib/undoContract'));
const { scrubText }    = require(path.join(ROOT, 'src/lib/vendor/scrub'));

// GRACEFUL DEGRADE — the sibling benches' convention (b6_f79_bench's disclosure
// (d)), applied at birth: at an UNCURED tree these seams do not exist, and this
// bench must read as FAILS, never a crash. Each shim returns a sentinel that
// satisfies NO assertion, so an uncured tree fails on exactly the cure and the
// sacred-behaviour floors in §4 stay green — as they must.
const ABSENT_LINES = ['<no witness seam at this tree>', '<uncured>'];
const donnaWitnessLines = (...a) => { try { return seams.donnaWitnessLines(...a) || []; } catch (_e) { return ABSENT_LINES; } };
const chipFiling        = (...a) => { try { return seams.chipFiling(...a); } catch (_e) { return { summary: '<no chipFiling seam at this tree>' }; } };
const translateBeat     = (...a) => { try { return seams.translateBeat(...a); } catch (_e) { return { __cure_absent_at_this_tree: true }; } };

let pass = 0, fail = 0;
const ok  = (cond, label) => { if (cond) { pass++; console.log('  PASS  ' + label); } else { fail++; console.log('  FAIL  ' + label); } };
const sec = (t) => console.log('\n── ' + t + ' ──');

const VENDOR = '11111111-1111-4111-8111-111111111111';
const MSG_ID = '22222222-2222-4222-8222-222222222222';
const LEAD_ID = '33333333-3333-4333-8333-333333333333';

// The capturing double: one .update() lands, its payload kept whole.
function mkReq(sink) {
  return { vendor: { id: VENDOR }, app: { locals: { supabase: { schema: () => ({
    from: () => ({ update: (payload) => { sink.push(payload); return { eq: async () => ({ error: null }) }; } }),
  }) } } } };
}

// ═══════════════════════════════════════════════════════════════════════════
// §1 — THE CE'S NAMED TEST: the outage evening's own pair.
// ═══════════════════════════════════════════════════════════════════════════
sec('§1 THE NAMED TEST — 17:03:44 (filed) vs 17:32:04 (narrated)');

// 17:03:44Z, conversation b68c07ab, the FRESH thread's first turn — it FILED.
// Shapes verbatim: loop.ts:492-498 (two entries per exchange, donna_calls nested);
// donnaLead.ts:281 (the door's own display); donna.ts:514 (her voice, bare push).
const FILED_TURN = {
  reply: 'Done. Tara Door Test is logged — wedding 20 March 2027, Jaipur, stage new, nothing paid.',
  assistant_message_id: MSG_ID,
  tool_calls: [
    { name: 'dear_donna_talk', input: { message: 'Log a new lead: Tara Door Test…' }, result: '(handed to Donna)',
      donna_calls: [
        { name: 'donna_find', input: { client: 'Tara Door Test' }, result: 'No record matched for "Tara Door Test". …' },
        { name: 'donna_lead', input: { name: 'Tara Door Test' },
          result: `Lead saved. id=${LEAD_ID}, name=Tara Door Test, state=new. (Typed lead — this id is not a binder; binder hands like follow-ups, money or notes don't attach to it.)` },
        { name: 'listen_harvey_talk', input: { message: 'Filed her.' }, result: '(spoken to Harvey)' },
      ] },
    { name: 'listen_harvey_talk', input: { message: 'Log a new lead: Tara Door Test…' }, result: 'Listen Harvey — Filed her.' },
  ],
};

// 17:32:04Z, the SAME conversation, 28 minutes later — the no-write specimen.
// tool_calls: [] — tools were on the wire (the 32,491 cache quantum; the wire-tap
// 12/12); the model narrated the dispatch instead of making it.
const NARRATED_TURN = {
  reply: 'Got it. Log Vera Seal Test — wedding 20 March 2027, Jaipur, nothing paid, stage new.',
  assistant_message_id: MSG_ID,
  tool_calls: [],
};

const filedLines = donnaWitnessLines(VENDOR, FILED_TURN);
ok(filedLines.length === 1, 'the FILED turn yields exactly ONE witness line (the lead hand; her voice and the find are not hands)');
ok(filedLines[0] === 'Lead filed: Tara Door Test', 'the line is deriveFiling\'s own summary, verbatim: "Lead filed: Tara Door Test"');

const narratedLines = donnaWitnessLines(VENDOR, NARRATED_TURN);
ok(narratedLines.length === 0, 'the NARRATED turn yields ZERO witness lines — nothing fired, nothing is witnessed');

// Through the REAL tail + the REAL persist, to the row.
const sinkA = [];
const tailFiled = composedTail({ witnessed: filedLines, documents: [], booked: [], refused: [], mutated: [], advised: [], blocked: [], unblocked: [] });
const sinkB = [];
const tailNarrated = composedTail({ witnessed: narratedLines, documents: [], booked: [], refused: [], mutated: [], advised: [], blocked: [], unblocked: [] });

(async () => {
  await persistComposedReply(mkReq(sinkA), FILED_TURN, tailFiled);
  await persistComposedReply(mkReq(sinkB), NARRATED_TURN, tailNarrated);

  ok(sinkA.length === 1, 'the FILED turn patches its row (one UPDATE)');
  ok(sinkA[0] && sinkA[0].content === `${FILED_TURN.reply}\n\nLead filed: Tara Door Test`,
     'THE CURE, ASSERTED: the filed turn REPLAYS WITNESSED — prose + the hand\'s own line');
  ok(sinkB.length === 0,
     'THE ASYMMETRY, ASSERTED: the narrated turn REPLAYS BARE — no tail, so persistComposedReply writes NOTHING and the row stays the prose alone');

  // The two ROWS AS CAPTURED — never a re-stated literal (assert the artifact).
  // A narrated turn is never patched, so the row that stands is the one loop.ts
  // saved: result.reply, bare. Before this cure the filed row was that too.
  const filedRow    = sinkA.length ? sinkA[0].content : null;
  const narratedRow = sinkB.length ? sinkB[0].content : NARRATED_TURN.reply;
  ok(filedRow !== null && /Lead filed/.test(filedRow) && !/Lead filed/.test(narratedRow) && filedRow !== narratedRow,
     'THE FINDING, REVERSED: the two rows are no longer the same kind of artifact — the filed one carries its hand, the narrated one cannot (F-04.41, lead plane)');

  // ═════════════════════════════════════════════════════════════════════════
  // §2 — the fences.
  // ═════════════════════════════════════════════════════════════════════════
  sec('§2 THE FENCES');

  // 17:08:36Z — run 2's read-only turn: four donna_finds, her voice, ZERO rows.
  const READ_ONLY_TURN = {
    reply: 'Clear — log her as a new lead: Tara Seal Test, wedding photography, 20 March 2027, Jaipur, nothing paid, stage new.',
    assistant_message_id: MSG_ID,
    tool_calls: [
      { name: 'dear_donna_talk', input: { message: 'Do we have a Tara Seal Test anywhere already?' }, result: '(handed to Donna)',
        donna_calls: [
          { name: 'donna_find', input: { client: 'Tara Seal Test' }, result: 'Found 2 records: …' },
          { name: 'donna_find', input: { note: 'Seal', client: 'Tara' }, result: 'No record matched for "Tara Seal". …' },
          { name: 'donna_find', input: { note: '20 March 2027', client: 'Tara' }, result: 'Found 8 records: …' },
          { name: 'donna_find', input: { client: 'Tara Seal' }, result: 'No record matched for "Tara Seal". …' },
          { name: 'listen_harvey_talk', input: { message: 'Nothing on Tara Seal Test anywhere… Want me to log her as a fresh lead?' }, result: '(spoken to Harvey)' },
        ] },
      { name: 'listen_harvey_talk', input: { message: 'Do we have a Tara Seal Test anywhere already?' }, result: 'Listen Harvey — Nothing on Tara Seal Test anywhere…' },
    ],
  };
  ok(donnaWitnessLines(VENDOR, READ_ONLY_TURN).length === 0,
     'run 2\'s READ-ONLY turn (17:08:36) yields ZERO witness lines — she searched and asked; nothing was filed, so nothing is witnessed (F-04.81\'s specimen, correctly bare)');

  ok(chipFiling(VENDOR, 'listen_harvey_talk', { message: 'anything' }, '(spoken to Harvey)') === null,
     'HER VOICE IS NOT A HAND — listen_harvey_talk rides donna_calls and actionKind would call it a write; fenced at the one home');
  ok(chipFiling(VENDOR, 'donna_find', { client: 'X' }, 'Found 2 records: …') === null,
     'a READ wears no witness (P7-b; G1\'s donna_find-dressed-as-Filed, dead)');
  ok(chipFiling(VENDOR, 'donna_book_event', { title: 'X' }, 'Noted — it is being placed on the calendar.') === null,
     'a CALENDAR signal wears no witness — bookingLines/mutationLines already speak for it in this same tail (no double-report)');

  const CALENDAR_TURN = { reply: 'Done.', assistant_message_id: MSG_ID, tool_calls: [
    { name: 'dear_donna_talk', input: {}, result: '(handed to Donna)', donna_calls: [
      { name: 'donna_book_event', input: { title: 'Shoot' }, result: 'Noted — it is being placed on the calendar.' },
    ] },
  ] };
  ok(donnaWitnessLines(VENDOR, CALENDAR_TURN).length === 0, 'a calendar-only turn yields ZERO witness lines (the doors own that sentence)');

  const TOP_LEVEL_ONLY = { reply: 'x', tool_calls: [{ name: 'dear_donna_talk', input: {}, result: '(handed to Donna)' }] };
  ok(donnaWitnessLines(VENDOR, TOP_LEVEL_ONLY).length === 0,
     'THE RULING\'S FENCE: the top level is never walked — dear_donna_talk would read as a \'write\' and is not one');
  ok(donnaWitnessLines(VENDOR, { reply: 'x' }).length === 0 && donnaWitnessLines(VENDOR, null).length === 0,
     'a shapeless/absent result yields zero lines, never a throw (the reply is already owed)');

  // An errored hand: the honest failure line survives the refresh. DISCLOSED as an
  // authored extension of the proposed shape (ratify-or-revert) — same call, same
  // source; F-04.41's disease is exactly a witness that evaporates while the
  // optimistic prose persists, and an ERROR display is a witness.
  const ERROR_TURN = { reply: 'Done — she\'s filed.', assistant_message_id: MSG_ID, tool_calls: [
    { name: 'dear_donna_talk', input: {}, result: '(handed to Donna)', donna_calls: [
      { name: 'donna_lead', input: { name: 'X' }, result: 'ERROR: insert failed (23505 duplicate key)' },
    ] },
  ] };
  ok(donnaWitnessLines(VENDOR, ERROR_TURN)[0] === "That didn't land — nothing was changed.",
     'an ERRORED hand persists its HONEST FAILURE line (F3\'s sentence, deriveFiling\'s own) — the optimistic prose no longer stands alone on refresh [DISCLOSED extension]');

  // The firewall: a vendor-named lead cannot smuggle an internal name into storage.
  const SCRUB_TURN = { reply: 'x', assistant_message_id: MSG_ID, tool_calls: [
    { name: 'dear_donna_talk', input: {}, result: '(handed to Donna)', donna_calls: [
      { name: 'donna_lead', input: {}, result: `Lead saved. id=${LEAD_ID}, name=Donna, state=new.` },
    ] },
  ] };
  const scrubbedTail = composedTail({ witnessed: donnaWitnessLines(VENDOR, SCRUB_TURN), documents: [], booked: [], refused: [], mutated: [], advised: [], blocked: [], unblocked: [] });
  ok(scrubbedTail === '\n\n' + scrubText('Lead filed: Donna'),
     'the stored line goes through the REAL scrubText — blockLines\' own reason: a lead name is free text (copy law\'s storage clause)');

  // ═════════════════════════════════════════════════════════════════════════
  // §3 — the ONE-HOME move: translateBeat byte-identical.
  // ═════════════════════════════════════════════════════════════════════════
  sec('§3 THE ONE-HOME MOVE — translateBeat BYTE-IDENTICAL');

  // The pre-cure branch order, re-stated as an ORACLE. This is the only
  // re-implementation in this file and it exists to be diffed against the real one.
  const actionKindOracle = (name) => {
    if (/(find|tally|history|shelf|brief|whatsdue|search)/i.test(name || '')) return 'read';
    if (/(calendar|event)/i.test(name || '')) return 'calendar';
    return 'write';
  };
  function preCureBeat(e, vendorId) {
    const kindOf = actionKindOracle(e.name);
    const raw = typeof e.result === 'string' ? e.result : '';
    if (kindOf !== 'write' && !raw.startsWith('ERROR')) return { type: 'operator_action', kind: kindOf, detail: scrubText(raw) };
    const filing = deriveFiling(vendorId, e.name, e.input, raw);
    if (filing.kind === 'error') return { type: 'operator_action', kind: 'error', detail: filing.summary, summary: filing.summary, retryable: true };
    return { type: 'operator_action', kind: actionKindOracle(e.name), detail: scrubText(raw),
             summary: scrubText(filing.summary), record_ref: filing.record_ref, undo: filing.undo };
  }

  const BEATS = [
    { type: 'donna_action', name: 'donna_lead',       input: { name: 'Asha' }, result: `Lead saved. id=${LEAD_ID}, name=Asha Fresh Test, state=new.` },
    { type: 'donna_action', name: 'donna_lead',       input: {},              result: `Updated existing lead "Tara" (id=${LEAD_ID}) — phone.` },
    { type: 'donna_action', name: 'donna_client',     input: {},              result: `Record ${LEAD_ID} created, client="Kavya".` },
    { type: 'donna_action', name: 'donna_money',      input: { binder_id: LEAD_ID }, result: 'Money filed Rs 15,000.' },
    { type: 'donna_action', name: 'donna_money_edit', input: { binder_id: LEAD_ID }, result: 'received: (empty) → Rs 15,000; payment: (empty) → received.' },
    { type: 'donna_action', name: 'donna_note',       input: { binder_id: LEAD_ID }, result: 'Note filed.' },
    { type: 'donna_action', name: 'donna_edit',       input: { binder_id: LEAD_ID }, result: 'edited client, date.' },
    { type: 'donna_action', name: 'donna_find',       input: { client: 'X' },  result: 'Found 2 records: …' },
    { type: 'donna_action', name: 'donna_history',    input: {},              result: 'six writes…' },
    { type: 'donna_action', name: 'donna_book_event', input: {},              result: 'Noted — it is being placed on the calendar.' },
    { type: 'donna_action', name: 'donna_edit_event', input: {},              result: 'it is being updated on the calendar.' },
    { type: 'donna_action', name: 'donna_find',       input: {},              result: 'ERROR: read failed' },
    { type: 'donna_action', name: 'donna_lead',       input: {},              result: 'ERROR: insert failed' },
    { type: 'donna_action', name: 'donna_invoice_pdf', input: {},             result: `INV-0007 ${LEAD_ID}` },
    { type: 'donna_action', name: 'donna_lead',       input: {},              result: null },
  ];
  let identical = 0;
  for (const b of BEATS) {
    const now = JSON.stringify(translateBeat(b, VENDOR));
    const was = JSON.stringify(preCureBeat(b, VENDOR));
    if (now === was) identical++;
    else console.log(`      ↳ DIVERGED on ${b.name}: ${was}  ->  ${now}`);
  }
  ok(identical === BEATS.length, `translateBeat is byte-identical to the pre-cure branch order on all ${BEATS.length} reachable beats (the chip did not move)`);
  ok(JSON.stringify(translateBeat({ type: 'victor_token', text: 'hi' }, VENDOR)) === JSON.stringify({ type: 'text_delta', text: scrubText('hi') }),
     'the other beats are untouched (victor_token co-witness)');

  // ═════════════════════════════════════════════════════════════════════════
  // §4 — additivity + the sacred floors.
  // ═════════════════════════════════════════════════════════════════════════
  sec('§4 ADDITIVITY + THE SACRED FLOORS');

  const preCureCall = composedTail({ documents: [], booked: [], refused: [], mutated: [], advised: [], blocked: [], unblocked: [] });
  ok(preCureCall === '', 'composedTail WITHOUT `witnessed` returns the pre-cure bytes (older callers + the sealed b6_sitting2_bench unaffected)');
  ok(composedTail({ witnessed: [], documents: [], booked: [], refused: [], mutated: [], advised: [], blocked: [], unblocked: [] }) === '',
     'an EMPTY witnessed is the same as absent — a narrated turn cannot accidentally grow a tail');

  const sinkC = [];
  await persistComposedReply(mkReq(sinkC), { reply: 'Noted.', assistant_message_id: MSG_ID }, '');
  ok(sinkC.length === 0, 'the empty tail still writes NOTHING (Q-B4-6(b)\'s floor, unregressed)');

  const sinkD = [];
  await persistComposedReply(mkReq(sinkD), { reply: 'Noted.' }, '\n\nLead filed: X');
  ok(sinkD.length === 0, 'a missing assistant_message_id still writes NOTHING — never guess a row (Q-B4-6(b)\'s floor, unregressed)');

  console.log(`\n${pass}/${pass + fail} — ${fail === 0 ? 'ALL PASS' : 'FAILURES PRESENT'}`);
  process.exit(fail === 0 ? 0 : 1);
})();
