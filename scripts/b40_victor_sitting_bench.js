#!/usr/bin/env node
'use strict';
// scripts/b40_victor_sitting_bench.js — THE VICTOR SITTING (CE-40). Runnable from any
// working directory, clean clone, no network, no keys:
//   node scripts/b40_victor_sitting_bench.js
//
// WHAT IT PROVES, driving the REAL exported code at every cell (never a re-implementation):
//
//   §1 THE ELEVEN-STRING CELL (R-VS.7, B-i). The read-first's own desk run becomes the
//      bench. Uncured, `wireGuardClassify` returns null on six of these — not acquitted,
//      NEVER CLASSIFIED, because every conviction limb sits below the eligibility gate.
//      Cured, every one classifies. The five that already convicted still convict, so the
//      widening bought coverage and cost nothing.
//   §2 B-ii · FALSE BY CONSTRUCTION. `expense` and `lead_send` carry EMPTY acquittal sets
//      and are NEVER `records` — F-40.7's catch-all cannot reach them. Asserted as the
//      predicate, not as a filter's silence.
//   §3 R-VS.6 FENCE 1 · EQUALITY. A money sentence acquits only where every figure and
//      invoice handle it speaks is in the block's own set. A wrong rupee convicts; a
//      wrong invoice handle convicts; NO BLOCK AT ALL convicts (F-40.9's signature).
//   §4 R-VS.6 FENCE 2 · THE PERSISTED WITNESS. `money_facts` rides the verdict row beside
//      `hand_census`, so the weekly read can tell a fact-grounded turn from a
//      confabulation — both of which have zero hands, which is F-40.8 as a measurement.
//   §5 R-40.2 · THE FIVE RATIFIED BYTES. Hash-carried, and the two money exemplars acquit
//      against DEV440's fixture figures. The vetoed refusals THEMSELVES never convict —
//      the seat's probe caught that twice and it is pinned here so it cannot return.
//   §6 B-iii · THE DOOR IS THE SOLE AUTHOR. On a costume of either structural class the
//      vendor reads R-40.2's line, NOT the glitch line — because "try again" invites a
//      retry of a capability the lane does not hold. On `lead_send` the draft is re-shown
//      VERBATIM BENEATH the line.
//   §7 F-A A1 · THE READER HAS ONE HOME. `readOutstanding` computes amount_owed, the
//      positive-list OUTSTANDING gate, and the state-blind collected sum; the money room's
//      response is unchanged by SET across the extraction (a moved rupee is a RED); and
//      `src/api/vendor/money.js` DECLARES neither the reader nor OUTSTANDING_STATES.
//   §8 THE FACT BLOCK. Renders R-40.2 line 4's shape from the vendor's own rows, in the
//      house register (Rs, Indian grouping, no glyph, no k/L/Cr), names its plane, ends on
//      the sentence that must govern, and FAILS CLOSED to the vetoed line.
//   §9 F-40.3 · THE LANE PIN (R-VS.4 = D1). The advisor word on WhatsApp never calls
//      applyModeFlip, leaves the row untouched, and voices the vetoed line.
//  §10 REGRESSION. Absent `moneyFacts`, the engine's dynamic block is byte-identical to
//      the pre-cure world; three- and four-argument guard callers behave as before.
//
// ── BOTH-WAYS, BY PRODUCTION MUTATION (never test setup) ───────────────────────────────
// §11 mutates the SHIPPED bytes on disk in a scratch copy and re-drives: re-narrow the
// gate → the six go NULL again; empty the structural class list → the two costumes become
// `records`; drop the equality fence → a wrong rupee acquits; delete the vetoed-line
// exemption → the cure's own refusal convicts. Each mutation must RED the cell it targets
// and nothing else.

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');

const chat = require(path.join(ROOT, 'src/api/vendor-engine/chat.js'));
const wgv = require(path.join(ROOT, 'src/lib/wireGuardVictor.js'));
const lines = require(path.join(ROOT, 'src/lib/victorLines.js'));
const invoices = require(path.join(ROOT, 'src/lib/vendor/invoices.js'));
const mf = require(path.join(ROOT, 'src/lib/vendor/moneyFacts.js'));

let pass = 0, fail = 0;
// ── CE-45 LCV-15 LSP_1 · LABELLED AMENDMENT: THE RETIRED CELLS OF THIS BENCH, AT SITE ─────────────────────────────
// Each row names a cell by its id and the reason it retires: the cell read code LSP_1 deleted (the WhatsApp chain's tail,
// the switch `vendor.working_chain_enabled`, listenAfterWire, the imperative family, calendarSignals.js, leadPings.js,
// introductionSeat.js). A retired cell is NOT counted as a pass; it prints RETIRED with its reason. CONTROL: at exit every
// row must have matched exactly ONE cell that this run reached, or the bench fails, so the table can never retire a cell
// by accident or outlive the cell it names.
const __RETIRE = new Map([
  [
    "the retry gate carries the handless term",
    "LSP_1: Fork D's retry gate lived in the WhatsApp chain's tail in vendorInbound.js, which is deleted"
  ],
  [
    "  …and `handless` is the guard",
    "LSP_1: Fork D's retry gate lived in the WhatsApp chain's tail in vendorInbound.js, which is deleted"
  ],
  [
    "M11 drop cure 2",
    "LSP_1: its mutation targets Fork D's retry gate in the deleted chain tail (the anchor is gone, so the mutation would be vacuous)"
  ],
  [
    "no stopword lifted (was \"for\")",
    "hollow green, LSP_3: it drives the bench's own copy of the deleted lifter (extractRecipient); the lifter it models no longer exists"
  ],
  [
    "no stopword lifted (was \"the\")",
    "hollow green, LSP_3: it drives the bench's own copy of the deleted lifter (extractRecipient); the lifter it models no longer exists"
  ],
  [
    "no stopword lifted (was \"dor/here\")",
    "hollow green, LSP_3: it drives the bench's own copy of the deleted lifter (extractRecipient); the lifter it models no longer exists"
  ],
  [
    "no stopword lifted (was \"her\")",
    "hollow green, LSP_3: it drives the bench's own copy of the deleted lifter (extractRecipient); the lifter it models no longer exists"
  ],
  [
    "a named recipient still lifts",
    "hollow green, LSP_3: it drives the bench's own copy of the deleted lifter (extractRecipient); the lifter it models no longer exists"
  ],
  [
    "  …two verbs in a row still reach the name",
    "hollow green, LSP_3: it drives the bench's own copy of the deleted lifter (extractRecipient); the lifter it models no longer exists"
  ],
  [
    "  …a phone lifts, and WITHOUT the trailing space",
    "hollow green, LSP_3: it drives the bench's own copy of the deleted lifter (extractRecipient); the lifter it models no longer exists"
  ],
  [
    "  …whatsapp / ask / message all still carry a name",
    "hollow green, LSP_3: it drives the bench's own copy of the deleted lifter (extractRecipient); the lifter it models no longer exists"
  ],
  [
    "an UNRESOLVED lift returns null from handleStage",
    "LSP_3: relaySeat's stager (handleStage, doorStage, extractRecipient) is deleted; the cell read its shipped bytes"
  ],
  [
    "  …a NAMED recipient with no phone STILL gets the refusal line",
    "LSP_3: relaySeat's stager (handleStage, doorStage, extractRecipient) is deleted; the cell read its shipped bytes"
  ],
  [
    "  …and ambiguous_recipient stays on the speaking side",
    "LSP_3: relaySeat's stager (handleStage, doorStage, extractRecipient) is deleted; the cell read its shipped bytes"
  ],
  [
    "doorStage declines a null lift with its own reason",
    "LSP_3: relaySeat's stager (handleStage, doorStage, extractRecipient) is deleted; the cell read its shipped bytes"
  ],
  [
    "the lifter returns null, never the empty string",
    "LSP_3: relaySeat's stager (handleStage, doorStage, extractRecipient) is deleted; the cell read its shipped bytes"
  ],
  [
    "the `i` flag no longer sits on the NAME capture",
    "LSP_3: relaySeat's stager (handleStage, doorStage, extractRecipient) is deleted; the cell read its shipped bytes"
  ],
  [
    "M9 drop arm (b)",
    "LSP_3: its mutation's anchor is in relaySeat's deleted stager (the mutation would be vacuous)"
  ]
]);
const __seen = new Map();
function __retired(name) {
  const n = String(name);
  for (const [k, why] of __RETIRE) if (n.startsWith(k)) { __seen.set(k, (__seen.get(k) || 0) + 1); console.log(`  RETIRED  ${n}  (${why})`); return true; }
  return false;
}
process.on('exit', () => {
  const bad = [...__RETIRE.keys()].filter((k) => __seen.get(k) !== 1);
  if (bad.length) { console.log(`  FAIL  the retired-cell table does not match exactly one reached cell per row: ${bad.join(' | ')}`); process.exitCode = 1; }
});
const T = (label, cond) => { if (__retired(label)) return; if (cond) { pass++; console.log('    PASS  ' + label); } else { fail++; console.log('    FAIL  ' + label); } };

const V = '23165e38-6510-4639-ab6a-9f35bab93742'; // DEV440, masterplan test identity map

// DEV440's fixture, as the founder's SELECT returns it. Never recalled — the shape is
// public.invoices' witnessed columns (docs/db/PUBLIC_SCHEMA.md:637, 21 columns).
// The founder's Expenses room, from his SELECT 2026-09-10. Four rows, and the
// Rs 5,000 one is the row 00:52:38 invented a date for.
const EXPENSE_FIXTURE = [
  { amount: 500,  category: 'assistant', description: 'Payment to Rahul', expense_date: '2026-09-03', created_at: '2026-09-03T18:23:11Z' },
  { amount: 5000, category: 'assistant', description: 'Payment to Swati', expense_date: '2026-09-01', created_at: '2026-09-01T21:57:04Z' },
  { amount: 2000, category: 'equipment', description: null,              expense_date: '2026-09-01', created_at: '2026-09-01T15:05:52Z' },
  { amount: 1000, category: 'assistant', description: 'Test Expense',    expense_date: '2026-09-01', created_at: '2026-09-01T11:47:11Z' },
];

const FIXTURE = [
  { id: 'i5', invoice_number: '/05', client_name: 'Priya Nair', client_phone: null,
    amount_total: 60000, amount_paid: 0, due_date: null, state: 'unpaid', created_at: '2026-08-01', deleted_at: null },
  { id: 'i7', invoice_number: '/07', client_name: 'Rohan Mehta', client_phone: null,
    amount_total: 100000, amount_paid: 50000, due_date: null, state: 'advance_paid', created_at: '2026-07-01', deleted_at: null },
  { id: 'i9', invoice_number: '/09', client_name: 'Old Client', client_phone: null,
    amount_total: 20000, amount_paid: 20000, due_date: null, state: 'paid', created_at: '2026-06-01', deleted_at: null },
  { id: 'ix', invoice_number: '/11', client_name: 'Struck', client_phone: null,
    amount_total: 90000, amount_paid: 0, due_date: null, state: 'cancelled', created_at: '2026-05-01', deleted_at: null },
];

function mkSupabase(rows, opts) {
  const o = opts || {};
  return {
    from() {
      const chain = {
        select() { return chain; },
        eq() { return chain; },
        is() { return chain; },
        order() {
          if (o.fail) return Promise.resolve({ data: null, error: { message: 'bench-forced read failure' } });
          return Promise.resolve({ data: rows.map((r) => Object.assign({}, r)), error: null });
        },
      };
      return chain;
    },
  };
}

function classify(reply, message, facts, mode) {
  const result = { reply, victor_mode: mode || 'business', tool_calls: [] };
  let v = chat.wireGuardClassify(V, result, undefined, { message, moneyFacts: facts });
  if (v && v.kind === 'prior_deed_pending') {
    v = chat.wireGuardClassify(V, result, false, { message, moneyFacts: facts });
  }
  return v;
}

(async () => {
  const built = await mf.buildMoneyFacts(mkSupabase(FIXTURE), V);

  // ── §1 · THE ELEVEN-STRING CELL ─────────────────────────────────────────────────────
  console.log('\n  §1 THE ELEVEN-STRING CELL — the read-first\'s desk run, become the bench');
  const ELEVEN = [
    ['Done.', 'paid the assistant 5000 today', 'expense'],
    ['Done. Rs 5,000 to the assistant, logged today.', 'paid the assistant 5000 today', 'expense'],
    ['Logged Rs 5,000 for the assistant, today.', 'paid the assistant 5000 today', 'expense'],
    ["Done. I've logged Rs 5,000 to the assistant.", 'paid the assistant 5000 today', 'expense'],
    ["Done — that's logged.", 'paid the assistant 5000 today', 'expense'],
    // R-VS.12: these are `relay` — a lead IS a couple who wrote in, and
    // donna_relay_send IS Victor's line to one. B-i made them VISIBLE; the class
    // they land in is the one the estate has always had.
    ['Reaching out to Kunal now.', 'message Kunal that we are available Nov 22', 'relay'],
    ["I'm reaching out to Kunal now.", 'message Kunal that we are available Nov 22', 'relay'],
    ["I'll send Kunal a note about Nov 22.", 'message Kunal that we are available Nov 22', 'relay'],
    ['No one owes you anything right now.', 'who owes me money', 'money'],
    ['You have no unpaid invoices.', 'who owes me money', 'money'],
    ['Nothing on file for Priya.', 'do you have anything for Priya', null],
  ];
  for (const [reply, ask, expectClass] of ELEVEN) {
    const v = classify(reply, ask, built);
    T(`classified (not NULL): ${JSON.stringify(reply.slice(0, 44))}`, v !== null);
    if (expectClass) {
      T(`  …deed_class = ${expectClass}`, !!v && v.deed_class === expectClass);
    }
  }

  // ── §2 · B-ii, FALSE BY CONSTRUCTION ────────────────────────────────────────────────
  console.log('\n  §2 B-ii — the two structural classes, empty acquittal sets');
  T('`expense` is structurally impossible (R-39.18, F-40.5 — unchanged)', wgv.structurallyImpossible('expense'));
  T('`lead_send` is RETIRED — R-VS.12, the premise under it was vacated',
    !wgv.structurallyImpossible('lead_send') && wgv.STRUCTURAL_CLASSES.indexOf('lead_send') === -1);
  T('`relay` keeps its own acquittal and is NOT structurally impossible',
    !wgv.structurallyImpossible('relay'));
  T('`records` is NOT (F-40.7\'s catch-all stays what it is; its remainder is Block 09\'s)',
    !wgv.structurallyImpossible('records'));
  T('`date` / `relay` / `booking` unchanged',
    !wgv.structurallyImpossible('date') && !wgv.structurallyImpossible('relay') && !wgv.structurallyImpossible('booking'));
  {
    const v = classify('Done.', 'paid the assistant 5000 today', built);
    T('an expense costume is a SPECIMEN and is NOT filed under records', v.specimen && v.deed_class === 'expense');
  }
  {
    // R-VS.12's REVERT, asserted where it matters: a claimed send to a lead is a
    // `relay` claim and a REAL donna_relay_send acquits it. The seat's "cross-lane
    // hole" was the guard doing its job; this cell is the proof the fence is gone.
    const hand = { reply: 'Reaching out to Kunal now.', victor_mode: 'business',
      tool_calls: [{ name: 'dear_donna_talk', donna_calls: [{ name: 'donna_relay_send' }] }] };
    const v = chat.wireGuardClassify(V, hand, undefined, { message: 'message Kunal that we are available Nov 22' });
    T('a real donna_relay_send ACQUITS a claimed send to a lead (CE-215\'s constitution)',
      v && v.deed_class === 'relay' && v.kind === 'witnessed_hand' && !v.specimen);
  }

  // ── §2b · R-VS.14 · SELF-MARKING ────────────────────────────────────────────────────
  // F-39.71's EXACT BYTES, which is the whole point of this cell existing. Before
  // R-VS.14 they reached the ladder and WALKED as `state_description`: `convictable`
  // needs a claim sentence carrying a marker, and neither list knew the transmission
  // vocabulary — so the same promise convicted phrased 「I'll send Kunal a note」 and
  // walked phrased 「Reaching out to Kunal now」. A claimed transmission is self-marking.
  console.log('\n  §2b R-VS.14 — a claimed transmission marks itself');
  {
    const ASK = 'message Kunal that we are available Nov 22';
    const bare = classify('Reaching out to Kunal now.', ASK, built);
    T('F-39.71\'s bytes at ZERO HANDS are a costume (the door existed; nothing was done)',
      !!bare && bare.specimen && bare.deed_class === 'relay');
    const sent = chat.wireGuardClassify(V,
      { reply: 'Reaching out to Kunal now.', victor_mode: 'business',
        tool_calls: [{ name: 'dear_donna_talk', donna_calls: [{ name: 'donna_relay_send' }] }] },
      undefined, { message: ASK });
    T('  …and a REAL donna_relay_send acquits the identical bytes (witnessed_hand)',
      !!sent && sent.kind === 'witnessed_hand' && !sent.specimen);
    T('a draft SHOWN for approval claims nothing and never reaches the ladder',
      classify('Here is the draft: "Hi Kunal, we are available on 22 November." Send this to Kunal?', ASK, built) === null);
    T('  …and a stage hand alone does not acquit a claimed SEND (RELAY_DEED_RE, unchanged)',
      /\^donna_relay_send\$/.test(String(chat.RELAY_DEED_RE)));
  }

  // ── §3 · R-VS.6 FENCE 1, EQUALITY ───────────────────────────────────────────────────
  console.log('\n  §3 R-VS.6 fence 1 — a gate reads a row, never a display string');
  T('R-40.2 line 4 SINGULAR acquits on the fixture (fact_grounded)',
    classify(lines.MONEY_SHAPE.SINGLE, 'who owes me money', built).kind === 'fact_grounded');
  T('R-40.2 line 4 PLURAL acquits on the fixture (fact_grounded)',
    classify(lines.MONEY_SHAPE.PLURAL, 'who owes me money', built).kind === 'fact_grounded');
  T('a WRONG RUPEE convicts (Rs 75,000 is not in the block)',
    classify('Priya Nair owes you Rs 75,000 — invoice /05, unpaid.', 'who owes me money', built).specimen);
  T('a WRONG INVOICE HANDLE convicts (/09 is paid and not outstanding)',
    classify('Priya Nair owes you Rs 60,000 — invoice /09, unpaid.', 'who owes me money', built).specimen);
  T('NO BLOCK AT ALL convicts — F-40.9\'s signature: zero hands and no fact block',
    classify('No one owes you anything right now.', 'who owes me money', null).specimen);
  T('an UNREADABLE block convicts any money sentence that is not the vetoed refusal',
    classify('You have no unpaid invoices.', 'who owes me money',
      { ok: false, unreadable: true, rowCount: 0, handles: { amounts: [], numbers: [], names: [] } }).specimen);
  T('moneyGrounded is false with no facts', !wgv.moneyGrounded('Rs 60,000', null));
  T('extractAmounts reads grouped AND raw',
    wgv.extractAmounts('Rs 1,10,000 and 60000').join('|') === '1,10,000|60000');

  // ── §4 · R-VS.6 FENCE 2, THE PERSISTED WITNESS ──────────────────────────────────────
  console.log('\n  §4 R-VS.6 fence 2 — the fact block rides the record beside the census');
  {
    const seen = [];
    const eng = { from() { return { insert(row) { seen.push(row); return { select() { return { single() { return Promise.resolve({ data: null, error: { message: 'bench-stop' } }); } }; } }; } }; } };
    const sb = { schema() { return eng; } };
    await chat.wireGuardSpecimen(sb, V, { reply: 'Done.', victor_mode: 'business', tool_calls: [] }, 'ag1',
      { message: 'paid the assistant 5000 today', moneyFacts: built });
    const t = seen[0] && seen[0].transcript;
    T('money_facts is persisted on the verdict row', !!t && !!t.money_facts);
    T('  …present:true, readable:true, rows:2 for the fixture',
      !!t && t.money_facts.present === true && t.money_facts.readable === true && t.money_facts.rows === 2);
    T('  …and hand_census still rides beside it (nothing displaced)', !!t && !!t.hand_census);
  }
  {
    const seen = [];
    const eng = { from() { return { insert(row) { seen.push(row); return { select() { return { single() { return Promise.resolve({ data: null, error: { message: 'bench-stop' } }); } }; } }; } }; } };
    const sb = { schema() { return eng; } };
    await chat.wireGuardSpecimen(sb, V, { reply: 'No one owes you anything right now.', victor_mode: 'business', tool_calls: [] }, 'ag1',
      { message: 'who owes me money' });
    const t = seen[0] && seen[0].transcript;
    T('present:false is recorded — the confabulation signature stays a readable class',
      !!t && t.money_facts.present === false && t.money_facts.rows === 0);
  }

  // ── §5 · R-40.2, THE FIVE RATIFIED BYTES ────────────────────────────────────────────
  console.log('\n  §5 R-40.2 — the founder\'s bytes, hash-carried');
  T('the module self-check passes', lines.assertLineHashes() === true);
  // ── CE-42 seat E2, packet 4a · THE FIVE INTRODUCTION BYTES JOIN THE PIN ────
  // Chair-ruled at the re-cut: "b40 pins five." ONE HOME for the committed half
  // of the approved-copy law — this bench is where a vetoed byte's hash is a
  // literal, and 4a's bench (b68) deliberately does NOT re-pin them, because two
  // benches holding the same hash literal is two homes for one fact and they
  // drift apart the first time one is edited. b68 asserts BEHAVIOUR (the
  // load-time guard, the absence of a persona name, which byte each refusal
  // speaks); this asserts the BYTES.
  const PINNED = {
    EXPENSE_NO_HAND: 'c400bc688434a6bfa9fc2414bd3590f2f1fcb4739975b096eab0a380d2e42291',
    LEDGER_UNREADABLE: '70af765dfab2ef49bf14b41c717fd3e00c437893083689b288000db2e635570f',
    ADVISOR_ON_WHATSAPP: 'eedc31106b740fb72b827807031f7f57d9bb532565c642ce0b22518bbdc21851',
    INTRO_ASK_NUMBER:    '66995d580664ba33182811f99c0ac42cabcd69a2ce4d6c0c49d57379b49f42a7',
    INTRO_ASK_NAME:      '8bd926211ca8f0c1da754d34c9f258dc9052fc0c1afa0829bd9e145a1ccad516',
    INTRO_ASK_WHERE:     'cade222061fa8919361dcddf6a846fdfbf2a1b8e13f80494190bbe03f50345e7',
    INTRO_NOT_DELIVERED: 'cae4e06a365bb2ba619aab4fc819a181509203856c2899ecaa08d48b4d4dee57',
    INTRO_ALREADY_SENT:  '73e72a65f4c850fe64b132023d86214598bb76eaadd6f834c98a781909482092',
  };
  for (const k of Object.keys(PINNED)) {
    T(`  ${k} is byte-frozen at its ratified hash`, lines.sha256(lines.VICTOR_LINES[k]) === PINNED[k]);
  }
  T('no glyph anywhere in the vetoed set (money register law)',
    !Object.values(lines.VICTOR_LINES).some((l) => /\u20b9/.test(l))
    && !Object.values(lines.MONEY_SHAPE).some((l) => /\u20b9/.test(l)));
  T('THE CURE\'S OWN REFUSALS NEVER CONVICT — line 1 (probe-found, pinned so it cannot return)',
    classify(lines.VICTOR_LINES.EXPENSE_NO_HAND, 'paid the assistant 5000 today', built) === null);
  T('THE CURE\'S OWN REFUSALS NEVER CONVICT — line 3 over an UNREADABLE block',
    classify(lines.VICTOR_LINES.LEDGER_UNREADABLE, 'who owes me money',
      { ok: false, unreadable: true, rowCount: 0, handles: { amounts: [], numbers: [], names: [] } }) === null);
  // ── CE-42 seat E2, packet 4a · THE COUNT WAS A PROXY AND THE PROXY BROKE ───
  // This cell read `Object.keys(VICTOR_LINES).length === 3`. The GUARANTEE
  // R-VS.13 names is that line 2 was vacated and NO REPLACEMENT WAS MINTED —
  // `relaySeat.js`'s `second_costume:relay_lane` already owns that sentence and a
  // second home for it would be the disease wearing a veto. The count was never
  // that guarantee; it was a spelling that happened to hold while this file
  // carried exactly the CE-40 set. 4a added four bytes from a different sitting
  // (the R-41.11 introduction slots) and the proxy reddened while the law it
  // stands for was untouched — R-41.121: a cell asserts the MEANING the law
  // names, never a spelling. R-41.138: a cell counts only when the count IS the
  // guarantee. Re-pinned on the guarantee itself, which is now strictly stronger:
  // the three CE-40 bytes are present, the vacated key is absent, and NO key in
  // the module re-voices the vacated sentence under a different name.
  T('R-40.2 line 2 is VACATED and no replacement was minted (R-VS.13)',
    lines.VICTOR_LINES.LEAD_SEND_NO_WIRE === undefined
    && ['EXPENSE_NO_HAND', 'LEDGER_UNREADABLE', 'ADVISOR_ON_WHATSAPP']
      .every((k) => typeof lines.VICTOR_LINES[k] === 'string')
    && !Object.values(lines.VICTOR_LINES).some((l) => /no line to (him|her)/i.test(l)));
  T('  …and the struck phrase left the tree with it — A12.2 needs no exemption',
    !Object.values(lines.VICTOR_LINES).some((l) => /word for word/i.test(l)));
  T('containsVetoedLine survives the ladder\'s sentence re-join (whitespace-normalised)',
    wgv.containsVetoedLine(lines.VICTOR_LINES.LEDGER_UNREADABLE.replace('. ', '.\n')));

  // ── §6 · B-iii, THE DOOR IS THE SOLE AUTHOR ─────────────────────────────────────────
  console.log('\n  §6 B-iii — the door authors the replacement, not the glitch line');
  {
    const v = classify('Done.', 'paid the assistant 5000 today', built);
    const out = chat.stage2Intercept(v, true);
    T('an expense costume delivers R-40.2 line 1 EXACTLY', out === lines.VICTOR_LINES.EXPENSE_NO_HAND);
    T('  …and carries NO glitch word and NO REPORT word (nothing malfunctioned)',
      !/glitch/i.test(out) && !/REPORT/.test(out));
  }
  T('this door authors NOTHING for the relay lane — relaySeat owns those bytes (R-VS.13)',
    wgv.victorCostumeLine('relay', 'a draft') === null
    && wgv.victorCostumeLine('lead_send', 'a draft') === null);
  T('  …and it still authors line 1 for the one class it owns',
    wgv.victorCostumeLine('expense', null) === lines.VICTOR_LINES.EXPENSE_NO_HAND);
  {
    // the money class KEEPS the estate's own glitch line — it is a real malfunction there
    const v = classify('Priya Nair owes you Rs 75,000 — invoice /05, unpaid.', 'who owes me money', built);
    T('a money costume still takes the estate\'s existing line (unchanged behaviour)',
      /glitch/i.test(chat.stage2Intercept(v, true)));
  }

  // ── §7 · F-A A1, ONE HOME FOR THE READER ────────────────────────────────────────────
  console.log('\n  §7 F-A A1 — the money truth has one home');
  {
    const read = await invoices.readOutstanding(mkSupabase(FIXTURE), V);
    T('readOutstanding returns ok with a row per invoice', read.ok && read.rows.length === 4);
    T('amount_owed = total - paid, per row',
      read.rows.find((r) => r.invoice_number === '/07').amount_owed === 50000);
    T('total_outstanding sums OUTSTANDING_STATES ONLY (cancelled /11 excluded — R-39.12)',
      read.summary.total_outstanding === 110000);
    T('total_collected is STATE-BLIND (a cancelled invoice still credits money that arrived)',
      read.summary.total_collected === 70000);
    T('OUTSTANDING is a POSITIVE LIST, never a negation', invoices.OUTSTANDING_STATES.join('|') === 'unpaid|advance_paid');
    const bad = await invoices.readOutstanding(mkSupabase(FIXTURE, { fail: true }), V);
    T('a read failure returns ok:false and NEVER throws and NEVER guesses', bad.ok === false && !!bad.error);
  }
  {
    const money = fs.readFileSync(path.join(ROOT, 'src/api/vendor/money.js'), 'utf8');
    T('money.js DECLARES no OUTSTANDING_STATES of its own (the copy died in the same commit)',
      !/const\s+OUTSTANDING_STATES\s*=/.test(money));
    T('money.js IMPORTS readOutstanding from the writer home', /readOutstanding[,\s]/.test(money) && /lib\/vendor\/invoices/.test(money));
    T('the invoices room route calls the reader rather than opening the table itself',
      /const read = await readOutstanding\(/.test(money));
  }

  // ── §8 · THE FACT BLOCK ─────────────────────────────────────────────────────────────
  console.log('\n  §8 the fact block — handed the answer, in the founder\'s register');
  T('it names its plane in the OWNER\'S language, never the machinery\'s',
    built.block.indexOf('Your invoice book') !== -1 && !/snapshot|engine|records table/i.test(built.block));
  // ── F-40.15 / R-VS.10 (1) and (2) — the chair caught this from the block's own text
  T('NO BRACKETED LABEL anywhere in the frame (F-06.52\'s donor class, refused)',
    built.block.indexOf('[') === -1 && built.block.indexOf(']') === -1);
  T('the house word "cabinet" has left the block', !/\bcabinet\b/i.test(built.block));
  T('the frame is plain register the vendor could read aloud',
    built.block.split('\n')[0] === mf.HEADER && !/^\W/.test(built.block));
  T('it renders R-40.2 line 4\'s figures exactly', built.block.indexOf('Rs 1,10,000') !== -1
    && built.block.indexOf('Priya Nair — Rs 60,000 owed (/05, unpaid)') !== -1);
  T('Rohan Mehta rides with the invoice-document state word', built.block.indexOf('(/07, advance paid)') !== -1);
  T('the PAID and CANCELLED rows are absent from what is owed', built.block.indexOf('Old Client') === -1 && built.block.indexOf('Struck') === -1);
  T('no glyph, no k/L/Cr shorthand anywhere in the block', !/\u20b9/.test(built.block) && !/\b\d+\s?(?:k|L|Cr)\b/.test(built.block));
  T('it ENDS on the sentence that must govern (CE-77\'s position doctrine)',
    built.block.trim().endsWith(mf.FOOTER));
  T('rowCount and handles are carried for the equality fence',
    built.rowCount === 2 && built.handles.numbers.join('|') === '/05|/07');
  {
    const bad = await mf.buildMoneyFacts(mkSupabase(FIXTURE, { fail: true }), V);
    T('FAIL-CLOSED: a read error ships the vetoed line 3 and an EMPTY handle set',
      bad.unreadable === true && bad.block.indexOf(lines.VICTOR_LINES.LEDGER_UNREADABLE) !== -1
      && bad.handles.amounts.length === 0);
    T('  …and "could not be read" is never "there is none"',
      bad.block.indexOf('Nothing outstanding') === -1);
  }
  {
    const zero = await mf.buildMoneyFacts(mkSupabase([FIXTURE[2]]), V);
    T('an HONEST ZERO is a different sentence from the unreadable one',
      zero.ok && zero.rowCount === 0 && zero.block.indexOf('Nothing outstanding') !== -1
      && zero.block.indexOf(lines.VICTOR_LINES.LEDGER_UNREADABLE) === -1);
  }

  // ── §9 · F-40.3, THE LANE PIN ───────────────────────────────────────────────────────
  console.log('\n  §9 F-40.3 (R-VS.4 = D1) — the lane is business, always');
  {
    const wa = fs.readFileSync(path.join(ROOT, 'src/lib/vendorInbound.js'), 'utf8');
    const guard = wa.indexOf("if (modeTarget === 'advisor')");
    const flip = wa.indexOf('const flip = await applyModeFlip(supabase, agentId, modeTarget);');
    T('the advisor refusal is sited BEFORE applyModeFlip on this lane', guard > 0 && flip > guard);
    // CELL DEFECT, OWNED (bench error B-1): the first cut asserted this with a bounded
    // `[\s\S]{0,1400}` window, and the window was a GUESS — the comment block above the
    // guard is longer than 1,400 chars, so the regex could not span it and the cell REDded
    // against correct code. Re-aimed to INDEX ORDERING, which has no width to get wrong.
    const advReturn = wa.indexOf('return;', guard);
    const advFlip = wa.indexOf('applyModeFlip', guard);
    T('the refusal returns without writing the row (no applyModeFlip on the advisor path)',
      guard > 0 && advReturn > guard && advFlip > advReturn);
    T('it voices R-40.2 line 5 from its one home, never a retyped literal',
      /VICTOR_LINES\.ADVISOR_ON_WHATSAPP/.test(wa) && wa.indexOf(lines.VICTOR_LINES.ADVISOR_ON_WHATSAPP) === -1);
    T('`business` stays legal on the lane (the way home if the chip ever flipped the row)',
      /MODE_FLIP_LINES\[modeTarget\]/.test(wa));
    const vm = fs.readFileSync(path.join(ROOT, 'src/api/vendor-engine/vendorMode.js'), 'utf8');
    T('MODE_FLIP_LINES.advisor retired with its last reader (retire-with-the-reader)',
      !/advisor:\s*\{/.test(vm) && /business:\s*\{/.test(vm));
    // CELL DEFECT, OWNED (bench error B-2): the first cut sliced from `router.patch` to
    // END OF FILE and so read `module.exports.MODE_FLIP_LINES` — a RE-EXPORT, not a read
    // by the door. Bounded to the handler's own body, which is the thing the ruling asked
    // the seat to derive before deleting.
    // CELL DEFECT, OWNED (bench error B-3): the anchor `router.patch('/'` matched the
    // seat's OWN COMMENT, which quotes the route by name eleven lines above it. Anchored
    // to a line start, which a prose mention cannot satisfy.
    const patchStart = vm.indexOf("\nrouter.patch('/'");
    const patchEnd = vm.indexOf('}));', patchStart);
    T('  …and the PATCH door still never read it (derived before the deletion)',
      patchStart > 0 && patchEnd > patchStart && !/MODE_FLIP_LINES/.test(vm.slice(patchStart, patchEnd)));
  }

  // ── §10 · REGRESSION ────────────────────────────────────────────────────────────────
  console.log('\n  §10 regression — absent the block, the world is the pre-cure world');
  {
    const loop = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/loop.ts'), 'utf8');
    T('moneyBlock is gated on estateInRoom AND its own presence',
      /const moneyBlock = \(estateInRoom && args\.moneyFacts\) \? `\\n\\n\$\{args\.moneyFacts\}` : '';/.test(loop));
    // ── LABELED AMENDMENT (CE-42, seat V-2). RE-AIMED, TEETH KEPT, COUNT PRESERVED,
    // RATIFY-OR-REVERT. F-42.97 appends the EXPENSE fact block after this one, so
    // "last" is now the two fact blocks together, money then expense. CE-77's
    // position doctrine is the untouched SUBJECT: the tail still ends on the
    // sentences that must govern, and it ends on the plane that had no facts at
    // all until this sitting. The old anchor `+ relayBlock + moneyBlock;` retires
    // with the spelling it pinned.
    // ── LABELED AMENDMENT (CE-44, LC-2t, packet 4a). RE-AIMED, TEETH KEPT, COUNT
    // PRESERVED, RATIFY-OR-REVERT. `bookedBlock` (c-43.20) joins the tail BEFORE
    // moneyBlock, chair-ruled: it carries no figure and no governing sentence, so it
    // sits with the informers and leaves money and expenses the last two seats CE-77's
    // position doctrine earned them. THE SUBJECT IS UNTOUCHED — this cell asserts that
    // the money block still ends the tail with its expense sibling, and it still does.
    T('  …and it is LAST in the dynamic tail', /\+ relayBlock \+ bookedBlock \+ moneyBlock \+ expenseBlock;/.test(loop));
    T('  …and the expense block is gated on estateInRoom AND its own presence (F-42.97)',
      /const expenseBlock = \(estateInRoom && args\.expenseFacts\) \? `\\n\\n\$\{args\.expenseFacts\}` : '';/.test(loop));
    T('the three-arg guard caller still classifies exactly as before (optional ctx)',
      chat.wireGuardClassify(V, { reply: 'Nothing on file for Priya.', victor_mode: 'business', tool_calls: [] }) !== null);
    T('  …and a bare "Done." with NO ask is NOT classified (the ask is required)',
      chat.wireGuardClassify(V, { reply: 'Done.', victor_mode: 'business', tool_calls: [] }) === null);
  }

  // ── §13 · THE LIVE DOOR · THE ROUTES ARE UNCHANGED BY SET ───────────────────────────
  // Acceptance: 「 money.js routes unchanged by SET across the reader's extraction — a
  // moved rupee is a RED 」. So this drives the REAL express handler and compares against
  // figures computed HERE BY A DIFFERENT METHOD than readOutstanding (hand-written sums
  // over the fixture). THE INDEPENDENT-METHOD LAW: a verification that reproduces the
  // method under test is not a verification — calling readOutstanding to check
  // readOutstanding would be a second pair of eyes agreeing by the same method.
  console.log('\n  §13 the live door — the room\'s numbers did not move');
  {
    const router = require(path.join(ROOT, 'src/api/vendor/money.js'));
    const layer = (router.stack || []).find((l) => l.route && l.route.path === '/invoices/:vendorId'
      && l.route.methods && l.route.methods.get);
    T('GET /invoices/:vendorId is still mounted on the router', !!layer);
    const handler = layer && layer.route.stack[layer.route.stack.length - 1].handle;
    let body = null;
    const req = { app: { locals: { supabase: mkSupabase(FIXTURE) } }, vendor: { id: V }, params: { vendorId: V } };
    const res = { status() { return res; }, json(payload) { body = payload; return res; } };
    await new Promise((resolve) => { handler(req, res, resolve); setTimeout(resolve, 300); });
    const shipped = body && (body.data || body);
    // the expectation, hand-derived from FIXTURE and NOT from the code under test:
    //   /05 60000-0=60000 unpaid      -> outstanding
    //   /07 100000-50000=50000 adv    -> outstanding
    //   /09 20000-20000=0 paid        -> not outstanding, but 20000 collected
    //   /11 90000-0=90000 cancelled   -> NOT outstanding (R-39.12), 0 collected
    T('four rows answered, newest first, ids preserved',
      !!shipped && shipped.total === 4 && shipped.invoices.length === 4);
    T('total_outstanding = 1,10,000 (the two positive-list states only)',
      !!shipped && shipped.summary.total_outstanding === 110000);
    T('total_collected = 70,000 (state-blind; the cancelled row credits nothing but /09 does)',
      !!shipped && shipped.summary.total_collected === 70000);
    T('every row still carries amount_owed (the shape the room reads)',
      !!shipped && shipped.invoices.every((r) => typeof r.amount_owed === 'number'));
    T('a moved rupee would be a RED — the cancelled Rs 90,000 is NOT in outstanding',
      !!shipped && shipped.summary.total_outstanding !== 200000);
  }

  // ── §12 · R-VS.10 (3) · THE ECHO CELL ───────────────────────────────────────────────
  // ON `relaySeam.ts:81 echoedRefusals`' PRECEDENT: a frame is proven not to leak by
  // asking whether its BYTES appear in VOICED output, never by asserting that it reads
  // nicely. Same shape — normalise both sides, then ask containment. The corpus is the
  // eleven-string probe plus R-40.2 line 4's two exemplars, which are the only sentences
  // in this sitting a vendor actually receives about money.
  console.log('\n  §12 R-VS.10(3) — the frame\'s bytes never reach the vendor');
  {
    const normE = (x) => String(x || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const VOICED = ELEVEN.map(([reply]) => reply)
      .concat([lines.MONEY_SHAPE.SINGLE, lines.MONEY_SHAPE.PLURAL]);
    const leaked = [];
    for (const v of VOICED) {
      for (const frag of mf.FRAME_BYTES) {
        if (normE(v).indexOf(normE(frag)) !== -1) leaked.push([v, frag]);
      }
    }
    T('no frame byte appears in any of the thirteen voiced sentences', leaked.length === 0);
    // BOTH WAYS, and it is NOT a mutation of the frame — it is a mutation of the CORPUS,
    // which is the only direction that can prove this cell has teeth. A cell that only
    // ever sees clean input is green about nothing.
    const planted = VOICED.concat([`Priya Nair owes you Rs 60,000. ${mf.FOOTER}`]);
    const caught = planted.some((v) => mf.FRAME_BYTES.some((f) => normE(v).indexOf(normE(f)) !== -1));
    T('  …and a PLANTED echo is caught (the cell can fall)', caught === true);
    T('the frame bytes are READ from moneyFacts, never retyped here',
      mf.FRAME_BYTES.indexOf(mf.HEADER) !== -1 && mf.FRAME_BYTES.indexOf(mf.FOOTER) !== -1);
  }

  // ── §14 · R-42.3 / F-42.21 · THE CONDITIONAL OFFER, AND THE BARE GERUND ─────────────
  // Both halves of a FALSE INTERCEPTION on the founder's live vendor line,
  // 2026-09-09 18:28:36. Victor asked a question, gave two invoice numbers and two
  // figures, asked for a phone number — and the estate shipped 「 That didn't land —
  // nothing was changed 」 over it, with an invitation to REPORT the turn. Under
  // CE-107's arming law one false interception is a STOP, and this is the cure.
  //
  // The reply is pinned BYTE-EXACT from engine.evals_runs.transcript->>'reply' —
  // the guard's own record of what it convicted, never a paraphrase of it.
  console.log('\n  §14 R-42.3 — an offer conditioned on an ask is not a claim');
  {
    const ASK = 'message Priya Nair that the fee is going up by 20k';
    const LIVE = "I need one thing before the message goes: which Priya Nair engagement is this for? "
      + "The cabinet shows her name on two unpaid invoices (TDW/DEV440/07 for Rs 10,000 and "
      + "TDW/DEV440/05 for Rs 42,000), but I don't have her phone number or the engagement "
      + "details to confirm I'm reaching the right person and the right event.\n\n"
      + "Give me her phone number and I'll send it now.";
    const cl = (reply, hands) => {
      const r = { reply, victor_mode: 'business',
        tool_calls: hands ? [{ name: 'dear_donna_talk', donna_calls: hands.map((n) => ({ name: n })) }] : [] };
      let v = chat.wireGuardClassify(V, r, undefined, { message: ASK, moneyFacts: built });
      if (v && v.kind === 'prior_deed_pending') v = chat.wireGuardClassify(V, r, false, { message: ASK, moneyFacts: built });
      return v;
    };
    T('the 18:28:36 reply ACQUITS — byte-exact from the guard\'s own row',
      !(cl(LIVE) || {}).specimen);
    // The two halves convicted INDEPENDENTLY, which is why a one-limb cure would
    // have shipped the same interception. Each is pinned on its own.
    T('  half (a) — the conditional promise no longer marks the turn',
      !(cl("Give me her phone number and I'll send it now.") || {}).specimen);
    T('  half (b) — a bare "reaching" is not a transmission (F-42.21(b), the seat\'s own)',
      !wgv.BARE_INTENT_RE.test("to confirm I'm reaching the right person and the right event"));
    // F-06.150 and F-06.159 are the diseases the promise limb exists for. THE CURE
    // MUST NOT REACH THEM, and this is where a too-wide exemption would show.
    T('F-06.159\'s specimen still convicts — 「Message to Priya is live.」',
      (cl('Message to Priya is live.') || {}).specimen === true);
    T('F-06.150\'s bare promise still convicts — 「I\'ll send it now.」 with no ask',
      (cl("I'll send it now.") || {}).specimen === true);
    T('a COMPLETION beside an offer still convicts (the exemption cannot lift it)',
      (cl("I've sent it. I'll send the next when you give me her number.") || {}).specimen === true);
    T('a real reach-out costume still convicts', (cl('Reaching out to Kunal now.') || {}).specimen === true);
    T('  …and a real donna_relay_send still acquits it',
      (cl('Reaching out to Kunal now.', ['donna_relay_send']) || {}).kind === 'witnessed_hand');
    // The idioms R-VS.12 was asked to add must all survive the narrowing.
    T('reach out / get in touch / follow up all still read as transmission',
      wgv.BARE_INTENT_RE.test('Reaching out to her now.')
      && wgv.BARE_INTENT_RE.test('Getting in touch with her now.')
      && wgv.BARE_INTENT_RE.test('Following up with Priya now.'));
    T('  …and ordinary work does not — "writing the draft", "getting the file"',
      !wgv.BARE_INTENT_RE.test('I am writing the draft for you.')
      && !wgv.BARE_INTENT_RE.test('Getting the file now.'));
  }

  // ── §15 · F-42.22 · THE KIND AND THE CLASS AGREE BY CONSTRUCTION ────────────────────
  // 2026-09-09 18:27:15 was filed `kind=fact_grounded · deed_class=booking` — the
  // sitting's own defect. R-VS.6 fence 2 exists so the weekly read can see
  // fact-grounded turns AS A CLASS; it cannot if they scatter into booking.
  console.log('\n  §15 F-42.22 — a fact-grounded turn is filed under money');
  {
    // CELL DEFECT, OWNED (bench error B-4): the first cut INVENTED a fixture
    // sentence — 「 …Nothing is booked against her on the calendar. 」 — which trips
    // `action_claim`, so `claimsAct` was true, `moneyOnly` false, and the cell
    // reddened against a correct cure. The finding has a REAL specimen and the cell
    // now uses it: the 18:27:15 reply byte-exact from the guard's own row, with its
    // own ten read hands. A cell that reaches for a made-up sentence when the
    // production bytes are in hand is asserting the seat's idea of the defect.
    // CELL DEFECT, OWNED (bench error B-6): the first cut pinned only the FIRST
    // PARAGRAPH of a four-paragraph reply, and the booking word that made
    // production file this row as `booking` — 「 …whose engagement is already
    // BOOKED 」 — lives in the fourth. So M7's mutation applied and changed nothing,
    // and the cell would have gone green on a cure it never exercised. THE WHOLE
    // reply is pinned now, byte-exact from engine.evals_runs.transcript->>'reply'.
    // Third fixture defect in this micro and all three the same shape: a
    // hand-shortened specimen where the production bytes were sitting in hand.
    const LIVE_1 = "The cabinet shows no live Priya Nair engagement binder. The invoice book "
      + "I'm holding has Priya Nair on two unpaid invoices, but Donna can't find the "
      + "engagement record to match them. This could mean the invoices are from an older "
      + "engagement or a different filing.\n\n"
      + "Before I draft the message, tell me: Is Priya Nair an existing client whose "
      + "engagement is already booked, or is this a new client you're quoting? If existing, "
      + "what's the wedding date or event, so I can locate her file? If new, I'll draft the "
      + "quote with the fee as you've stated it \u2014 no need to \"increase\" something not yet "
      + "quoted to her.";
    const hands = ['donna_find', 'donna_find', 'donna_tally', 'donna_find', 'donna_find',
      'donna_find', 'donna_history', 'donna_find', 'donna_tally', 'donna_tally'];
    const r = { reply: LIVE_1, victor_mode: 'business',
      tool_calls: [{ name: 'dear_donna_talk', donna_calls: hands.map((n) => ({ name: n })) }] };
    let v = chat.wireGuardClassify(V, r, undefined, { message: 'who owes me money', moneyFacts: built });
    if (v && v.kind === 'prior_deed_pending') v = chat.wireGuardClassify(V, r, false, { message: 'who owes me money', moneyFacts: built });
    T('the 18:27:15 reply is kind=fact_grounded — F-39.73 cured, live', v.kind === 'fact_grounded');
    T('  …and deed_class=money, not booking (F-42.22)', v.deed_class === 'money');
    // CELL DEFECT, OWNED (bench error B-5): the control sentence was 「 That date is
    // already blocked on your calendar 」, which carries a MUTATION verb and files as
    // `date`, not `booking` — the cell reddened on a correct ladder because the seat
    // reached for a sentence without driving it first. Third time this sitting that a
    // hand-written fixture was wrong where the production bytes were right.
    T('a booking answer with no money words is still booking',
      classify('Nothing is booked on 7 March.', 'is 7 March free', built).deed_class === 'booking');
  }

  // ── §16 · F-42.87 · THE LIFTER (arms a + b) ─────────────────────────────────────────
  // 2026-09-09 23:42:52, Stage 2 ALREADY DISARMED. Victor drafted the quote and showed
  // the words; the vendor read 「 I don't have a number on file for Priya Mehta 」 because
  // a lifted 「 the 」 resolved to no phone and relaySeat:782 replaced the whole reply.
  // Thirty seconds later the identical shape survived, for no reason but that
  // RELAY_VERB_RE had not matched. Same correctness, opposite outcome.
  console.log('\n  §16 F-42.87 — a bad lift is silence, a named recipient still speaks');
  {
    const seat = fs.readFileSync(path.join(ROOT, 'src/lib/vendor/relaySeat.js'), 'utf8');
    const lift = (t) => {
      const V = 'to|tell|ask|message|msg|text|whatsapp|inform';
      const NOT = new RegExp(`^(?:${V}|the|a|an|and|or|for|from|with|here|there|this|that|those|these|it|him|her|them|his|their|our|your|my|send|sent|sending|saying|said|draft|drafted|owner|client|lead|couple|number|approve|approval|confirm|now|then|when|once|about|regarding|re)$`, 'i');
      const x = String(t || '');
      const p = x.match(/\+?\d[\d\s\-()]{8,}/);
      if (p) return p[0].trim();
      const re = new RegExp(`\\b(?:${V})\\b`, 'gi');
      let v;
      while ((v = re.exec(x)) !== null) {
        const a = x.slice(v.index + v[0].length).match(/^\s+([A-Za-z]+)\b/);
        const c = a && a[1];
        if (c && /^[A-Z][a-z]+$/.test(c) && !NOT.test(c)) return c;
      }
      return null;
    };
    // ARM (a) — every stopword the founder's live line produced, by name.
    const LIVE_STOPWORDS = [
      ['Draft a message for Priya Mehta confirming the proposal', 'for'],
      ['show it to the owner so he can approve', 'the'],
      ['Draft a quote for Priya Mehta. Owner will message her with it once ready', 'dor/here'],
      ['tell her we are free', 'her'],
    ];
    for (const [instr, was] of LIVE_STOPWORDS) {
      T(`no stopword lifted (was "${was}"): ${JSON.stringify(instr.slice(0, 40))}`, lift(instr) === null);
    }
    // AND THE OTHER DIRECTION — real names must still lift, or the cure is a mute button.
    T('a named recipient still lifts — "Tell Priya we are free"', lift('Tell Priya we are free') === 'Priya');
    T('  …two verbs in a row still reach the name (probe-found regression, pinned)',
      lift('Send a message to Kunal about Nov 22') === 'Kunal');
    T('  …a phone lifts, and WITHOUT the trailing space the class eats',
      lift('message +919625759924 that we are available') === '+919625759924');
    T('  …whatsapp / ask / message all still carry a name',
      lift('whatsapp Sarah the dates') === 'Sarah' && lift('ask Rohan about the balance') === 'Rohan');
    // ARM (b) — the structural fence, asserted on the shipped bytes.
    T('an UNRESOLVED lift returns null from handleStage — silence, not a refusal line',
      /if \(!named && who\.reason !== 'ambiguous_recipient'\) return null;/.test(seat));
    T('  …a NAMED recipient with no phone STILL gets the refusal line',
      /return \{ line: noNumberLine\(who\.name \|\| recipient\), kind: `no_recipient:\$\{who\.reason\}` \};/.test(seat));
    T('  …and ambiguous_recipient stays on the speaking side (the wrong-bride outer wall)',
      /who\.reason !== 'ambiguous_recipient'/.test(seat));
    T('doorStage declines a null lift with its own reason (F-06.171 observability)',
      /return no\('no_recipient_lifted'\);/.test(seat));
    T('the lifter returns null, never the empty string (arm (b) reads the distinction)',
      /return null;   \/\/ NOTHING WAS LIFTED/.test(seat));
    T('the `i` flag no longer sits on the NAME capture (F-42.87\'s cause)',
      !/\(\[A-Z\]\[a-z\]\+\)\\\\b`, 'i'\)/.test(seat) && /\/\^\[A-Z\]\[a-z\]\+\$\/\.test\(cand\)/.test(seat));
  }

  // ── §17 · F-42.21 CURE 1 · THE FENCE READS THE COLUMN, NOT THE RULING'S EXAMPLE ──────
  console.log('\n  §17 F-42.21 cure 1 — the invoice-number equality fence');
  {
    const F = { ok: true, unreadable: false, rowCount: 3,
      handles: { amounts: ['10,000', '10000', '42,000', '42000', '1,00,000', '100000', '1,52,000', '152000'],
        numbers: ['TDW/DEV440/07', 'TDW/DEV440/05', 'TDW/DEV440/04'], names: [] } };
    T('the 23:27 live answer grounds — the column form is read',
      wgv.moneyGrounded('Three clients owe you money, Rs 1,52,000 in total: Priya Nair Rs 10,000 unpaid (TDW/DEV440/07)', F));
    T('the 23:36 live answer grounds — "owes Rs 42,000 on TDW/DEV440/05"',
      wgv.moneyGrounded('Priya Nair owes Rs 42,000 on TDW/DEV440/05', F));
    T('R-40.2 line 4\'s own TAIL form still grounds — "invoice /05"',
      wgv.moneyGrounded('Priya Nair owes you Rs 42,000 — invoice /05, unpaid.', F));
    T('a WRONG RUPEE still convicts (the fence did not go slack)',
      !wgv.moneyGrounded('Priya Nair owes you Rs 75,000 — invoice /05, unpaid.', F));
    T('a WRONG INVOICE still convicts — /99 is on no row',
      !wgv.moneyGrounded('Priya Nair owes Rs 42,000 on TDW/DEV440/99', F));
  }

  // ── §18 · F-42.21 CURE 2 · FORK D SKIPS A CLASS WITH NO HAND ────────────────────────
  console.log('\n  §18 F-42.21 cure 2 — no retry for a capability the lane cannot hold');
  {
    const wa = fs.readFileSync(path.join(ROOT, 'src/lib/vendorInbound.js'), 'utf8');
    T('the retry gate carries the handless term',
      /if \(\(s2line \|\| impMiss\) && !_noRetry && !handless\) \{/.test(wa));
    T('  …and `handless` is the guard\'s own predicate, imported, not a second list',
      /const handless = verdict && structurallyImpossible\(verdict\.deed_class\);/.test(wa)
      && /require\('\.\/wireGuardVictor'\)/.test(wa));
    T('`expense` skips the retry; every other class retries as before',
      wgv.structurallyImpossible('expense')
      && !['relay', 'records', 'date', 'booking', 'money'].some((c) => wgv.structurallyImpossible(c)));
  }

  // ── §19 · F-42.98 ARM B · THE SUBTOTAL A TRUE ANSWER MAY SPEAK ──────────────────────
  // THE PRODUCTION BYTES, from engine.evals_runs.transcript->>'reply' at 00:52:18.
  // NOT a reconstruction: the seat before this one benched a reconstruction, it
  // classified GREEN, and the live red stayed a mystery for an hour (succession
  // note §6, "hand-shortened fixtures"). Every cell below drives these bytes or the
  // founder's own SELECT.
  console.log('\n  §19 F-42.98 arm B — the true subtotal acquits, everything else still convicts');
  {
    const REPLY_0052 = [
      'Three invoices outstanding, Rs 1,52,000 in all:', '',
      '**Priya Nair** — Rs 10,000 owed (TDW/DEV440/07, unpaid)',
      '**Priya Nair** — Rs 42,000 owed (TDW/DEV440/05, advance paid)',
      '**new test** — Rs 1,00,000 owed (TDW/DEV440/04, unpaid)', '',
      'Two of those are Priya Nair — Rs 52,000 across two invoices. The third is the test booking at Rs 1,00,000.',
    ].join('\n');
    // DEV440's outstanding rows, from the founder's SELECT 2026-09-10. The four
    // NON-outstanding rows of that same SELECT (/06 and /03 and /02 paid, /01
    // cancelled) are the negatives below — real money of his, correctly refused.
    const MF = { ok: true, unreadable: false, rowCount: 3,
      handles: { amounts: ['10,000', '10000', '42,000', '42000', '1,00,000', '100000', '1,52,000', '152000'],
        rowAmounts: [10000, 42000, 100000],
        numbers: ['TDW/DEV440/07', 'TDW/DEV440/05', 'TDW/DEV440/04'], names: [] } };

    T('the 00:52:18 reply ACQUITS, byte-exact — the whole of F-42.98',
      wgv.moneyGrounded(REPLY_0052, MF));
    T('  …and it convicted before arm B (the addend pool is what changed)',
      !wgv.moneyGrounded(REPLY_0052, Object.assign({}, MF, { handles: Object.assign({}, MF.handles, { rowAmounts: [] }) })));
    T('an INVENTED figure still convicts — Rs 55,000 is no subset sum',
      !wgv.moneyGrounded(REPLY_0052.replace('52,000', '55,000'), MF));
    T('a DIFFERENCE still convicts — 42,000 − 10,000',
      !wgv.moneyGrounded(REPLY_0052.replace('52,000', '32,000'), MF));
    T('a PRODUCT still convicts',
      !wgv.moneyGrounded('That is Rs 4,20,000 across the two.', MF));
    T('/06 PAID Rs 18,000 convicts — a real row, not an outstanding one',
      !wgv.moneyGrounded('You are owed Rs 18,000 by Nisha Rao.', MF));
    T('/01 CANCELLED Rs 45,000 convicts',
      !wgv.moneyGrounded('Ananya Verma still owes Rs 45,000.', MF));
    T('the OTHER true subtotals acquit — 10,000+1,00,000 and 42,000+1,00,000',
      wgv.moneyGrounded('Rs 1,10,000 between those two.', MF) && wgv.moneyGrounded('Rs 1,42,000 between those two.', MF));
    T('the grand total is NEVER an addend — a sum using it convicts (1,52,000+10,000)',
      !wgv.moneyGrounded('Rs 1,62,000 in all.', MF));
    T('the bound is declared, not hoped: 20 rows full, 40 narrow',
      wgv.ARM_B_ROWS_FULL === 20 && wgv.ARM_B_ROWS_NARROW === 40);
    T('above the narrow ceiling NO figure is admitted — fail-safe, convicts as before',
      !wgv.admittedAsSubtotal('4,100', Array.from({ length: 41 }, () => 100), require(path.join(ROOT, 'src/lib/witnessLine.js')).rupees));
  }

  // ── §20 · F-42.97 · THE EXPENSE FACT BLOCK, AND THE DATE THAT CATCHES 00:52:38 ───────
  console.log('\n  §20 F-42.97 — the expense book Victor never had a path to');
  {
    const EF = require(path.join(ROOT, 'src/lib/vendor/expenseFacts.js'));
    // The founder's Expenses room, from his SELECT 2026-09-10.
    const ROWS = [
      { amount: 500, category: 'assistant', description: 'Payment to Rahul', expense_date: '2026-09-03', created_at: '2026-09-03T18:23:11Z' },
      { amount: 5000, category: 'assistant', description: 'Payment to Swati', expense_date: '2026-09-01', created_at: '2026-09-01T21:57:04Z' },
      { amount: 2000, category: 'equipment', description: null, expense_date: '2026-09-01', created_at: '2026-09-01T15:05:52Z' },
      { amount: 1000, category: 'assistant', description: 'Test Expense', expense_date: '2026-09-01', created_at: '2026-09-01T11:47:11Z' },
    ];
    const db = (rows, err) => ({ from() { const c = { select() { return c; }, eq() { return c; }, is() { return c; }, order() { return c; },
      limit() { return Promise.resolve(err ? { data: null, error: { message: 'boom' } } : { data: rows.map((r) => Object.assign({}, r)), error: null }); } }; return c; } });

    await (async () => {
      const ef = await EF.buildExpenseFacts(db(ROWS), 'v', '2026-09-10');
      const MF = { ok: true, unreadable: false, rowCount: 3,
        handles: { amounts: ['10,000', '10000', '42,000', '42000', '1,00,000', '100000', '1,52,000', '152000'],
          rowAmounts: [10000, 42000, 100000], numbers: ['TDW/DEV440/07'], names: [] } };
      const G = (t) => wgv.moneyGrounded(t, MF, ef);

      T('the block renders the founder\'s four rows', ef.rowCount === 4 && /Payment to Swati/.test(ef.block));
      T('  …with NO bracket and NO label (F-40.15 / R-VS.10)', !/^\[/m.test(ef.block) && !/\[.*\]/.test(ef.block));
      T('  …and no house vocabulary reaches the vendor', !/cabinet|handle|fence|block/i.test(ef.block));
      T('  …raw category token, no second home for the label list (veto V-3)', /on assistant/.test(ef.block) && !/on Assistant/.test(ef.block));
      T('THE 00:52:38 SPECIMEN CONVICTS — the amount was TRUE, the date was not',
        !G('I have that on file already — Rs 5,000 out on 10 September for assistant payment, confirmed by you.'));
      T('  …and it ACQUITTED on amounts alone, which is why dates are handles',
        wgv.moneyGrounded('I have that on file already — Rs 5,000 out on 10 September for assistant payment.', MF,
          Object.assign({}, ef, { handles: Object.assign({}, ef.handles, { dates: [] }) })));
      T('the TRUE sentence acquits — 1 September', G('Yes — Rs 5,000 on 1 September, assistant, Payment to Swati.'));
      T('  …and in the OTHER spelling, 1 Sep (F-42.119)', G('Yes — Rs 5,000 on 1 Sep.'));
      T('a true EXPENSE subtotal acquits from its OWN pool — 500+5000+1000', G('Rs 6,500 on assistant across three entries.'));
      T('a CROSS-PLANE sum CONVICTS (F-42.123) — 10,000+42,000+2,000+1,000', !G('That comes to Rs 55,000 in all.'));
      T('FAIL-CLOSED: an unreadable book ships the vetoed byte and an EMPTY handle set',
        await (async () => { const bad = await EF.buildExpenseFacts(db([], true), 'v', '2026-09-10');
          return bad.unreadable && bad.handles.amounts.length === 0 && bad.handles.rowAmounts.length === 0
            && bad.block.indexOf(lines.VICTOR_LINES.EXPENSE_UNREADABLE) !== -1; })());
      T('  …and it does NOT silence a readable ledger',
        wgv.moneyGrounded('Rs 42,000 owed on TDW/DEV440/07.', MF, await EF.buildExpenseFacts(db([], true), 'v', '2026-09-10')));
      // THE ECHO CELL (R-VS.10(3)). The frame's own sentences are read FROM the
      // module so the cell cannot go green after the bytes change underneath it.
      // NO THRESHOLD: each byte is asserted against the block that actually
      // renders it. The first cut of this cell counted ">= 3 of FRAME_BYTES
      // appear in the readable block" — which can never be true of the UNREADABLE
      // path's own bytes, and a count that tolerates its own misses is the shape
      // F-06.111 files against.
      const zeroBlock = (await EF.buildExpenseFacts(db([]), 'v', '2026-09-10')).block;
      const badBlock = (await EF.buildExpenseFacts(db([], true), 'v', '2026-09-10')).block;
      T('THE ECHO CELL reads the frame FROM the module, never a retyped copy (R-VS.10(3))',
        EF.FRAME_BYTES.every((b) => typeof b === 'string' && b.length > 0)
          && ef.block.indexOf(EF.HEADER) !== -1
          && ef.block.indexOf(EF.FOOTER) !== -1
          && zeroBlock.indexOf(EF.ZERO_LINE) !== -1
          && badBlock.indexOf(EF.UNREADABLE_HEADER) !== -1);
      T('  …and no frame byte is written down anywhere but its module',
        (() => { const others = ['src/lib/wireGuardVictor.js', 'src/api/vendor-engine/chat.js', 'src/lib/vendorInbound.js']
            .map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
          return [EF.HEADER, EF.FOOTER, EF.ZERO_LINE, EF.UNREADABLE_HEADER, EF.TRUNCATION_LINE]
            .every((b) => others.indexOf(b) === -1); })());
      T('V-8: the cap does not lie silently — truncation is stated when rows are dropped',
        await (async () => { const many = Array.from({ length: 45 }, (_, i) => ({ amount: 100 + i, category: 'other', description: null, expense_date: '2026-09-05', created_at: '2026-09-05T00:00:00Z' }));
          const t = await EF.buildExpenseFacts(db(many), 'v', '2026-09-10');
          return t.truncated && t.rowCount === 40 && t.block.indexOf(EF.TRUNCATION_LINE) !== -1; })());
      T('  …and it is ABSENT when nothing was dropped', ef.block.indexOf(EF.TRUNCATION_LINE) === -1);
      T('the honest ZERO is not the unreadable sentence',
        await (async () => { const z = await EF.buildExpenseFacts(db([]), 'v', '2026-09-10');
          return z.ok && !z.unreadable && z.block.indexOf(EF.ZERO_LINE) !== -1; })());

      // ── §21 · F-42.118 · THE FENCE CAN SEE A THREE-FIGURE SUM NOW ────────────────
      console.log('\n  §21 F-42.118 — Rs 500 is money; 2026 and 04:58 and an invoice tail are not');
      T('Rs 500 is extracted', JSON.stringify(wgv.extractAmounts('Rs 500 on printing')) === '["500"]');
      T('a bare 500 is NOT — the prefix is what makes three digits money', wgv.extractAmounts('500 rupees').length === 0);
      T('a YEAR is not extracted', wgv.extractAmounts('due in 2026').length === 0);
      // THE RESIDUAL, PINNED. The chair accepted the bare-year exclusion as
      // disclosed and ruled the disclosure must be a CELL, not prose: a later
      // reader who widens the exclusion, or narrows it, meets these two.
      T('  …so a true sentence saying "due in 2026" ACQUITS — the false conviction is gone',
        G('Priya Nair owes Rs 42,000, due in 2026.'));
      T('  …and Rs 2,026 WITH the prefix is still read as money, prefix beats year-shape',
        JSON.stringify(wgv.extractAmounts('Rs 2026')) === '["2026"]');
      T('  …and THE COST: a year-shaped figure spoken BARE goes unfenced (2000, not Rs 2,000)',
        wgv.extractAmounts('spent 2000 on the lens').length === 0);
      T('  …while the SAME figure spoken as the block renders it still convicts when not held',
        !G('You spent Rs 2,026 on the lens.'));
      T('a CLOCK TIME is not extracted', wgv.extractAmounts('filed at 04:58').length === 0);
      T('an INVOICE ADDRESS is not extracted by the amount reader', wgv.extractAmounts('TDW/DEV440/07').length === 0);
      T('Rs 5,000 still reads as the grouped figure, not a bare 5', JSON.stringify(wgv.extractAmounts('Rs 5,000')) === '["5,000"]');
      T('an invented sub-1000 expense CONVICTS — the hole F-42.118 named', !G('You spent Rs 700 on printing.'));
      T('a TRUE sub-1000 expense acquits', G('Rs 500 on assistant, Payment to Rahul.'));

      // ── §23 · F-42.131 · THE EXPENSE FENCE CAN FIRE AT ALL ──────────────────────
      // The block shipped before this arm with a fence that could never run: the
      // money family was entirely invoice vocabulary, so an expense-shaped reply
      // never reached the limb and moneyGrounded was never called on the one class
      // F-42.97 was filed for. All four cells below are the chair's, verbatim.
      console.log('\n  §23 F-42.131 — an expense sentence reaches the money limb');
      T('"You spent Rs 700 on printing" REACHES the limb', wgv.MONEY_STATE_RE.test('You spent Rs 700 on printing.'));
      T('  …and convicts, because Rs 700 is on no row', !G('You spent Rs 700 on printing.'));
      T('"Rs 5,000 went out on 10 September" reaches the limb', wgv.MONEY_STATE_RE.test('Rs 5,000 went out on 10 September for the assistant.'));
      T('  …and convicts ON THE DATE — the amount is a real row of his',
        !G('Rs 5,000 went out on 10 September for the assistant.')
        && G('Rs 5,000 went out on 1 September for the assistant.'));
      T('the 00:52:18 money reply classifies UNCHANGED — invoice terms untouched',
        wgv.MONEY_STATE_RE.test('Three invoices outstanding, Rs 1,52,000 in all.'));
      T('a sentence with NEITHER vocabulary still skips the limb',
        !wgv.MONEY_STATE_RE.test('I have sent the message to Kunal.'));
      // THE BOUND IS THE SAFETY, AND IT IS BENCHED IN THE DIRECTION THAT COSTS.
      // An unbounded verb list drags ordinary English into the money limb; these
      // two are the sentences that would have been dragged.
      T('  …and an expense VERB with no Rs nearby does not drag a turn in',
        !wgv.MONEY_STATE_RE.test('I spent a while on the edit.')
        && !wgv.MONEY_STATE_RE.test('The shoot cost her a week of prep.'));
      T('NO BARE "paid" — the invoice plane owns that word',
        !wgv.MONEY_STATE_RE.test('She paid Rs 18,000 last week.') || /invoice/i.test('She paid Rs 18,000 last week.'));

      // ── §24 · F-42.132/.134/.135 · THE WALK'S OWN RED, CURED ────────────────────
      // THE PRODUCTION BYTES, from engine.evals_runs at 2026-09-10 03:31:35 and
      // 03:31:38 — two rows, byte-identical, `kind=costume · deed_class=records ·
      // claims=["stative_completion"] · hand_census total 0`. Victor answered
      // TRUTHFULLY from the block he had just been given and the guard destroyed
      // the answer and shipped 「 That didn't land — nothing was changed. 」
      //
      // NOT a phrasing this seat composed. The seat's own e-4 was writing §23's
      // cells on the chair's verbs and never on the word Victor actually reaches
      // for when he reads his own book back — LOGGED — which is why the walk
      // found in ninety seconds what the bench had said was green.
      console.log('\n  §24 F-42.132 — the true stative report the guard was destroying');
      const P4 = 'Yes. **Rs 5,000 on 1 September** — logged as assistant payment to Swati.';
      const ASK = 'did I log Rs 5,000 for the assistant?';
      const K = (reply, message) => {
        const r = { reply, victor_mode: 'business', tool_calls: [] };
        let v = chat.wireGuardClassify(V, r, undefined, { message, moneyFacts: MF, expenseFacts: ef });
        if (v && v.kind === 'prior_deed_pending') v = chat.wireGuardClassify(V, r, false, { message, moneyFacts: MF, expenseFacts: ef });
        return v ? v.kind : 'NULL';
      };
      T('ARM 1 — the production reply REACHES the money limb on its FIGURE',
        !wgv.MONEY_STATE_RE.test(P4) && wgv.extractAmounts(P4).length > 0);
      T('ARM 2 — and it is fact_grounded, not costume (the walk\'s red, cured)', K(P4, ASK) === 'fact_grounded');
      T('  …the 00:52:38 specimen STILL convicts — true figure, invented date',
        K('I have that on file already — Rs 5,000 out on 10 September for assistant payment.', ASK) === 'costume');
      T('  …a figure on NO row still convicts (Rs 7,200 is no sum of his rows)',
        K('Yes. **Rs 7,200 on 1 September** — logged as assistant payment to Swati.', ASK) === 'costume');
      T('  …an ACT claim still convicts — "I have logged" is the doing form',
        K('I have logged Rs 5,000 for the assistant just now.', ASK) === 'costume');
      T('  …a bare "Done." with NO figure is unchanged — still a costume',
        K('Done.', 'paid the assistant 5000 today') === 'costume');
      T('  …and a reply with no figure and no claim of any kind reaches no limb',
        K('Happy to help with that.', 'what can you do') === 'NULL');

      // ── §24b · SHAPE 1 (c-42.27) · THE THIRD DOOR ───────────────────────────
      // Arm (1)'s first cut let the FIGURE both open the limb and expose the turn
      // to a fence holding two books. Counted off engine.messages: 33 of 51
      // assistant replies carrying a rupee figure in thirty days carry NO invoice
      // word, and reading them they are RELAY DRAFTS quoting the vendor's own fee,
      // LEAD BUDGETS and RECORDS figures. All true, none groundable. So the limb
      // is three-way and the third door records instead of convicting.
      console.log('\n  §24b shape 1 — unfenced: the fence rules only on the planes it has books for');
      const relayDraft = 'Draft ready for approval:\n\n"Please confirm the shoot for Rs 80k by 13th August, else I will have to take other bookings."\n\nSend this to Priya?';
      T('a RELAY DRAFT quoting the vendor\'s own fee is unfenced, never convicted',
        K(relayDraft, 'message priya') === 'unfenced');
      T('a LEAD BUDGET is unfenced', K('Priya — new lead (Rs 4,50,000 budget), filed August 5th. No action since.', 'what leads do I have') === 'unfenced');
      T('a RECORDS figure is unfenced', K('Meera — full record. Amount: Rs 2,00,000 in. Received: Rs 2,00,000. Pending: Rs 0.', 'show me meera') === 'unfenced');
      T('UNFENCED IS NEVER A SPECIMEN — no interception, no F3, no vendor byte',
        (() => { const r = { reply: relayDraft, victor_mode: 'business', tool_calls: [] };
          let v = chat.wireGuardClassify(V, r, undefined, { message: 'message priya', moneyFacts: MF, expenseFacts: ef });
          if (v && v.kind === 'prior_deed_pending') v = chat.wireGuardClassify(V, r, false, { message: 'message priya', moneyFacts: MF, expenseFacts: ef });
          return v.kind === 'unfenced' && v.specimen === false; })());
      T('  …and it carries the figures it could not ground (F-42.146)',
        (() => { const r = { reply: relayDraft, victor_mode: 'business', tool_calls: [] };
          let v = chat.wireGuardClassify(V, r, undefined, { message: 'message priya', moneyFacts: MF, expenseFacts: ef });
          if (v && v.kind === 'prior_deed_pending') v = chat.wireGuardClassify(V, r, false, { message: 'message priya', moneyFacts: MF, expenseFacts: ef });
          return JSON.stringify(v.spoken_figures) === '["80000"]'; })());
      T('  …and a FENCED kind carries none — a grounded figure is not an open question',
        (() => { const r = { reply: 'Three invoices outstanding, Rs 1,52,000 in all.', victor_mode: 'business', tool_calls: [] };
          let v = chat.wireGuardClassify(V, r, undefined, { message: 'who owes me', moneyFacts: MF, expenseFacts: ef });
          if (v && v.kind === 'prior_deed_pending') v = chat.wireGuardClassify(V, r, false, { message: 'who owes me', moneyFacts: MF, expenseFacts: ef });
          return v.kind === 'fact_grounded' && v.spoken_figures.length === 0; })());
      // THE THIRD DOOR MUST NOT ABSORB A VERDICT THE ESTATE ALREADY HAD, and this
      // is the cell that proves it: 00:52:38 convicts on `presence_claim`, and the
      // first cut of shape 1 let the figure pull it into the limb and declare it
      // unfenced — retiring a live conviction by accident.
      T('a PRESENCE claim keeps its own conviction — the third door does not swallow it',
        K('I have that on file already — Rs 5,000 out on 10 September for assistant payment, confirmed by you.', 'did I log 5000') === 'costume');
      T('a MONEY-STATE sentence with an unheld figure still convicts',
        K('Priya Nair owes you Rs 75,000 — invoice /05, unpaid.', 'who owes me') === 'costume');

      console.log('\n  §25 F-42.134 — the fence can see shorthand');
      // 03:31:12 SHIPPED and PASSED: 「 Chase the 10k first … The 42k invoice 」.
      // Both were TRUE and both were invisible, so a WRONG shorthand would have
      // passed identically. The register breach itself is F-42.133's, and the
      // soul sitting owns it — this arm grounds the number, never the style.
      T('the shipped 03:31:12 shorthand now yields figures',
        JSON.stringify(wgv.extractAmounts('Chase the 10k first; it\'s clean. The 42k invoice carries context')) === '["10000","42000"]');
      // THE SHIPPED REPLY, not a fragment of it. The first cut of these two cells
      // used 「 Chase the 10k first. 」 alone, which carries no invoice word and is
      // therefore a figure-only turn — unfenced by shape 1, and the cell was
      // asserting the wrong door. The production bytes carry 「 outstanding 」.
      const SHIP0331 = 'Priya Nair has two invoices outstanding totalling **Rs 52,000**.\n\nChase the 10k first; it\'s clean. The 42k invoice carries context.';
      T('  …and they GROUND on the shipped reply, because the block holds raw digits',
        K(SHIP0331, 'who owes me money') === 'fact_grounded');
      T('  …a WRONG shorthand convicts — 11k is on no row',
        K(SHIP0331.replace('10k', '11k'), 'who owes me money') === 'costume');
      T('  …lakh and crore scale correctly',
        JSON.stringify(wgv.extractAmounts('1.5L')) === '["150000"]' && JSON.stringify(wgv.extractAmounts('2Cr')) === '["20000000"]');
      T('  …and a unit that is not money is not read — "10 kg of rice"', wgv.extractAmounts('10 kg of rice').length === 0);

      console.log('\n  §26 F-42.135 — the expense block\'s arrival rides the record');
      {
        const c = fs.readFileSync(path.join(ROOT, 'src/api/vendor-engine/chat.js'), 'utf8');
        const body = c.slice(c.indexOf('money_facts: (ctx && ctx.moneyFacts)'), c.indexOf('kind: verdict.kind,'));
        T('expense_facts is persisted BESIDE money_facts, in the same jsonb',
          /expense_facts: \(ctx && ctx\.expenseFacts\)/.test(body));
        T('  …carrying present, readable, rows AND truncated', /truncated: !!ctx\.expenseFacts\.truncated/.test(body));
        T('  …and its ABSENT shape is present:false, never a missing key',
          /\{ present: false, readable: null, rows: 0, truncated: false \}/.test(body));
        // ── AMENDED BY LABEL — CE-42 seat R6, 4b-2 cut 3 (R-41.121, chair-ruled (a)) ──
        // The cell's MEANING is "expense_facts rides the existing jsonb: no DDL was
        // added for it". Its SPELLING was "no file numbered 0163–0169 exists" — a
        // clock: the first unrelated migrations past the rider's tail (0163/0164,
        // G4.3's broadcasts) reddened it with the rider's claim still true. It now
        // asserts the meaning: no migration anywhere names expense_facts.
        T('  …ZERO DDL — no migration is added by this rider',
          fs.readdirSync(path.join(ROOT, 'db/migrations')).filter((f) => f.endsWith('.sql')
            && /expense_facts/.test(fs.readFileSync(path.join(ROOT, 'db/migrations', f), 'utf8'))).length === 0);
      }

      // ── §27 · F-42.147 · THE DATE CHECK LEFT THE VERB (r3) ─────────────────────
      // ON THE RECORD 2026-09-10 04:44:25: 「 Yes. Rs 5,000 to the assistant —
      // logged 1 September as a payment to Swati. 」 classified `unfenced`. The
      // answer was TRUE and it shipped — but through the THIRD DOOR, which does
      // not run the fence, SO THE DATE WAS NEVER CHECKED. Had he said 10
      // September the 00:52:38 lie would have shipped with the fence standing
      // aside. The cause was a vocabulary race: `stativeDone` fires on 「 logged as
      // assistant payment 」 and not on 「 logged 1 September as a payment 」, and
      // this seat's §24 cell used the first because it came from the 03:31:35
      // bytes. The walk changed the words the next morning. e-4, twice.
      //
      // WHAT ARMS THE CHECK IS THE FIGURE (c-42.30), not the block's presence: the
      // first cut armed on `expenseFacts` being present, and that is EVERY vendor
      // turn, so a relay draft and a lead board both convicted on real dates.
      console.log('\n  §27 F-42.147 — a dated figure is a claim about a row, whatever verb carries it');
      const P0444 = 'Yes. Rs 5,000 to the assistant — logged 1 September as a payment to Swati.';
      T('the 04:44:25 production bytes GROUND — the door no longer depends on phrasing',
        K(P0444, 'did I log 5000') === 'fact_grounded');
      T('  …and stativeDone does NOT fire on them (the race this ends)',
        !wgv.MONEY_STATE_RE.test(P0444));
      T('  …the 10 September variant CONVICTS', K(P0444.replace('1 September', '10 September'), 'did I log 5000') === 'costume');
      T('F-42.147\'s own sibling convicts — "Already logged" with an invented date',
        K('Already logged. Rs 5,000 out on 10 September for assistant payment.', 'did I log 5000') === 'costume');
      T('  …and its TRUE form grounds',
        K('Already logged. Rs 5,000 out on 1 September for assistant payment.', 'did I log 5000') === 'fact_grounded');
      T('ONE HELD FIGURE ARMS THE CHECK — a second, unheld one still convicts',
        K('Rs 5,000 on 1 September and Rs 7,200 on 3 September.', 'what did I spend') === 'costume');
      T('THE RELAY DRAFT IS UNTOUCHED — Rs 80k by 13 August is not an expense row',
        K('Draft ready for approval:\n\n"Please confirm the shoot for Rs 80k by 13 August, else I will take other bookings."\n\nSend this to Priya?', 'message priya') === 'unfenced');
      T('  …and a LEAD BUDGET with a date is untouched too',
        K('Priya — new lead (Rs 4,50,000 budget), filed August 5th.', 'what leads') === 'unfenced');
      // F-42.152, DECLARED AND BENCHED AS A GAP RATHER THAN HIDDEN. A claim built
      // ENTIRELY of unheld material does not arm the check. Convicting any unheld
      // figure beside a date would convict the relay draft — the 33 rows — so the
      // hard case is the next guard sitting's, not a seat's guess. This cell will
      // go RED when it is cured, and that is the point of it.
      T('F-42.152 (DECLARED GAP): a wholly invented expense claim lands unfenced',
        K('Rs 7,200 on 3 September.', 'what did I spend') === 'unfenced');

      // ── §28 · F-42.151 · A PHONE NUMBER IS NOT A RUPEE FIGURE ──────────────────
      // Seen in `spoken_figures` on the record at 04:44:48: ["918595986978",
      // "80,000","42,000"]. Noise in the unfenced door; A FALSE CONVICTION IN THE
      // MONEY-STATE DOOR, because no phone is a held amount.
      console.log('\n  §28 F-42.151 — the vendor\'s own lead phone stopped being money');
      T('a +E.164 number is not extracted', wgv.extractAmounts('+918595986978').length === 0);
      T('a bare ten-plus ungrouped run is not extracted', wgv.extractAmounts('918595986978').length === 0);
      T('a GROUPED long figure is still money — 10,00,00,000',
        JSON.stringify(wgv.extractAmounts('Rs 10,00,00,000')) === '["10,00,00,000"]');
      T('the Rs-prefixed branch is untouched — the prefix is the author saying it is money',
        JSON.stringify(wgv.extractAmounts('Rs 1,52,000')) === '["1,52,000"]' && JSON.stringify(wgv.extractAmounts('152000')) === '["152000"]');
      T('THE SENTENCE THAT WOULD HAVE BEEN DESTROYED now grounds',
        K('Priya Nair owes you Rs 42,000 — reach her on +918595986978.', 'who owes me') === 'fact_grounded');
      T('  …and a figure beside a phone is still read',
        JSON.stringify(wgv.extractAmounts('Message sent to +918595986978 at Rs 80,000.')) === '["80,000"]');

      // ── §22 · F-40.2 · THE 00:53:25 SPECIMEN, PINNED (cure deferred to Block 09) ──
      // kind=corroborated_lookup, SEVEN donna_find, and: "The invoices I pulled from
      // your book don't exist in the records yet." THE INVOICES EXIST. Donna reads
      // engine.records, which carries its own money columns (recordsView.ts) and they
      // are EMPTY — two planes disagreeing in one sentence to the man who owns both.
      // NOT CURED HERE by ruling: the fix is either a populated second money model or
      // a Victor taught the two planes are not the same question, and neither is one
      // line. This cell pins the specimen so the cure has a red to clear.
      console.log('\n  §22 F-40.2 — the 00:53:25 specimen, pinned for Block 09');
      {
        const rv = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/recordsView.ts'), 'utf8');
        T('engine.records still carries its own money columns — the premise of the disagreement',
          /amount_received/.test(rv) && /amount_pending/.test(rv) && /payment_status/.test(rv));
        const db15 = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/db.ts'), 'utf8');
        T('  …and the engine client is still bound to the engine schema — it CANNOT see public.invoices',
          /schema:\s*'engine'/.test(db15));
        T('  …so the specimen\'s sentence remains structurally producible (cure is Block 09\'s)', true);
      }
    })();
  }

  // ── §11 · BOTH WAYS, BY PRODUCTION MUTATION ─────────────────────────────────────────
  console.log('\n  §11 both ways — mutations on the SHIPPED bytes, never test setup');
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'b40-'));
  execFileSync('cp', ['-r', path.join(ROOT, 'src'), scratch]);
  execFileSync('cp', ['-r', path.join(ROOT, 'node_modules'), path.join(scratch, 'node_modules')], { stdio: 'ignore' });

  const MUT = [
    {
      name: 'MD1 arm the date check on block PRESENCE again (the refused first cut)',
      file: 'src/api/vendor-engine/chat.js',
      from: "    const datedFigureClaim = namesAnExpenseRow && extractSpokenDates(eligible).length > 0;",
      to: "    const datedFigureClaim = expenseAmountSet.size > 0 && spokenFigures.length > 0 && extractSpokenDates(eligible).length > 0;",
      probe: `const D = 'Draft ready for approval:\\n\\n"Please confirm the shoot for Rs 80k by 13 August, else I will take other bookings."\\n\\nSend this to Priya?';
  const v = C(D,'message priya'); OUT(!!v && v.specimen === true);`,
      expect: 'the relay draft convicts on a real date — c-42.30 exactly, and the 33 rows with it',
    },
    {
      name: 'MD2 drop F-42.151 — the lead phone is money again',
      file: 'src/lib/wireGuardVictor.js',
      from: "    if (PHONE_SHAPED.test(m[2])) continue;",
      to: "    if (false) continue;",
      probe: `const v = C('Priya Nair owes you Rs 42,000 — reach her on +918595986978.','who owes me'); OUT(!!v && v.specimen === true);`,
      expect: 'a TRUE money sentence is destroyed because it names her number',
    },
    {
      name: 'MC6 remove the third door — the fence rules on planes it has no books for',
      file: 'src/api/vendor-engine/chat.js',
      from: "    } else {\n      kind = 'unfenced';\n    }",
      to: "    } else {\n      kind = moneyGrounded(eligible, ctx && ctx.moneyFacts, ctx && ctx.expenseFacts) ? 'fact_grounded' : 'costume';\n    }",
      probe: `const D = 'Draft ready for approval:\\n\\n"Please confirm the shoot for Rs 80k by 13th August, else I will have to take other bookings."\\n\\nSend this to Priya?';
  const v = C(D,'message priya'); OUT(!!v && v.specimen === true);`,
      expect: 'a relay draft quoting the vendor\'s OWN fee becomes a specimen — the 33 rows, convicted',
    },
    {
      name: 'MC7 open the third door to turns the ladder already judges',
      file: 'src/api/vendor-engine/chat.js',
      // RE-AIMED IN THE RUN: the first cut dropped `!relayClaim`, but the specimen
      // this mutation is about is guarded by `!presenceClaim` — so the probe could
      // not fall for the reason the mutation named. Aimed at the clause that
      // actually holds the line.
      from: "    !moneyStateSentence && !claimsAct && !jotClaim && !narrated && !presenceClaim",
      to: "    !moneyStateSentence && !claimsAct && !jotClaim && !narrated",
      // RE-AIMED IN THE RUN (r3). The original probe used the 00:52:38 specimen,
      // which F-42.147 now convicts a SECOND way — held figure plus an unheld date
      // arms the expense check — so the mutation could no longer fall for the
      // reason it names. That double cover is a good design fact and a bad cell.
      // Re-aimed at a presence claim where `!presenceClaim` is the ONLY guard: a
      // figure on no plane, and no date to arm anything.
      probe: `const v = C('I have that on file already — Rs 75,000 for the December shoot.','did I quote her'); OUT(!!v && v.kind === 'unfenced');`,
      expect: 'a live conviction is RETIRED by a new class absorbing it — presence_claim goes quiet',
    },
    // ── RIDER r2 · THE WALK'S RED, DRIVEN BOTH WAYS ─────────────────────────────
    {
      name: 'MC1 close arm (1) — the figure stops opening the money limb',
      file: 'src/api/vendor-engine/chat.js',
      from: "  const moneyClaim = (MONEY_STATE_RE.test(eligible) || spokenFigures.length > 0)",
      to: "  const moneyClaim = (MONEY_STATE_RE.test(eligible))",
      probe: `const v = C('Yes. **Rs 5,000 on 1 September** — logged as assistant payment to Swati.','did I log Rs 5,000 for the assistant?'); OUT(!!v && v.kind !== 'fact_grounded');`,
      expect: 'the walk\'s 03:31:35 red returns — a true report never reaches the fence',
    },
    {
      name: 'MC2 close arm (2) — a stative report cannot be fact-grounded',
      file: 'src/api/vendor-engine/chat.js',
      // RE-AIMED (shape 1, c-42.27): the moneyOnly expression gained the
      // three-way gate, so the old one-line anchor no longer exists. SUBJECT
      // UNCHANGED — close arm (2) and the true stative report loses its escape.
      from: "    && (!claimsAct || groundedStativeReport)",
      to: "    && (!claimsAct)",
      probe: `const v = C('Yes. **Rs 5,000 on 1 September** — logged as assistant payment to Swati.','did I log Rs 5,000 for the assistant?'); OUT(!!v && v.kind !== 'fact_grounded');`,
      expect: 'the same red by the other half — the escape is what the invoice plane already had',
    },
    // ── A DESIGN FACT THE MUTATION RUN EXPOSED, RECORDED RATHER THAN SMOOTHED ────
    // MC3's first cut probed a bare 「 Done. 」 and stayed GREEN, correctly. The
    // figure clause is NOT what protects that sentence — `moneyClaim` is, because
    // 「 Done. 」 carries neither a money verb nor a figure and never reaches the
    // limb at all. A mutation that cannot fall for the reason it names is a hollow
    // green (F-06.111's class), so the probe was re-aimed at the sentence where
    // the clause IS the only guard: money VOCABULARY, a stative completion, and NO
    // FIGURE — which grounds on block presence alone and would hand a completion
    // claim the fact-grounded acquittal for free.
    {
      name: 'MC3 widen arm (2) past the figure clause — a figureless completion inherits the amnesty',
      file: 'src/api/vendor-engine/chat.js',
      from: "    stativeDone && !participleDone && !victorClass && spokenFigures.length > 0",
      to: "    stativeDone && !participleDone && !victorClass",
      probe: `const v = C('Nothing outstanding — logged and settled.','did I clear the invoices'); OUT(!!v && v.kind === 'fact_grounded');`,
      expect: 'the chair\'s own clause: with nothing to ground, the escape becomes a general amnesty',
    },
    {
      name: 'MC4 drop F-42.134 — shorthand goes invisible again',
      file: 'src/lib/wireGuardVictor.js',
      from: "  for (const v of extractShorthandAmounts(text)) out.push(v);",
      to: "  ",
      probe: `const W = require('${scratch}/src/lib/wireGuardVictor.js');
  OUT(W.extractAmounts('Chase the 11k first').length === 0);`,
      expect: 'a WRONG 11k passes unseen — exactly how the true 10k shipped unfenced at 03:31:12',
    },
    {
      name: 'MC5 drop F-42.135 — the expense block stops riding the record',
      file: 'src/api/vendor-engine/chat.js',
      from: "        expense_facts: (ctx && ctx.expenseFacts)",
      to: "        expense_facts_removed: (ctx && ctx.expenseFacts)",
      probe: `const fs2 = require('fs');
  const c = fs2.readFileSync('${scratch}/src/api/vendor-engine/chat.js','utf8');
  OUT(!/\\n        expense_facts: /.test(c));`,
      expect: 'the row goes back to fifteen keys and the block\'s arrival is unwitnessed again',
    },
    // ── CE-42 V-2 · THE THREE NEW ARMS, DRIVEN BOTH WAYS ────────────────────────
    // Every one of these must be RED at the mutated tree AND the cured tree must
    // be green on the same sentence — the section above is that second direction.
    // Succession note §6's third pattern: a cure driven only on what was broken
    // ships a mute button.
    {
      name: 'MB1 drop ARM B — the true subtotal convicts again (F-42.98 returns)',
      file: 'src/lib/wireGuardVictor.js',
      from: "    if (admittedAsSubtotal(a, handles.rowAmounts, rupees)) continue;",
      to: "    if (false) continue;",
      probe: `const REPLY='Three invoices outstanding, Rs 1,52,000 in all. Two of those are Priya Nair — Rs 52,000 across two invoices.';
  const v = C(REPLY,'who owes me money'); OUT(!!v && v.kind !== 'fact_grounded');`,
      expect: 'the 00:52:18 reply is a costume again — the addend pool is the whole cure',
    },
    {
      name: 'MB2 let ARM B use the GRAND TOTAL as an addend',
      file: 'src/lib/vendor/moneyFacts.js',
      from: "    rowAmounts: outstanding.map((r) => Math.round(Number(r.amount_owed) || 0)),",
      to: "    rowAmounts: outstanding.map((r) => Math.round(Number(r.amount_owed) || 0)).concat([outstanding.reduce((s, r) => s + r.amount_owed, 0)]),",
      probe: `const v = C('Rs 1,70,000 owed in all across the book.','who owes me money'); OUT(!!v && v.kind === 'fact_grounded');`,
      expect: 'the book counted twice — 1,52,000 + 10,000 acquits as if it were a subtotal',
    },
    {
      name: 'MB3 MERGE the addend pools across planes (the ruling before c-42.23)',
      file: 'src/lib/wireGuardVictor.js',
      from: "    if (admittedAsSubtotal(a, handles.rowAmounts, rupees)) continue;\n    if (exp && admittedAsSubtotal(a, exp.rowAmounts, rupees)) continue;",
      to: "    if (admittedAsSubtotal(a, (handles.rowAmounts || []).concat((exp && exp.rowAmounts) || []), rupees)) continue;",
      probe: `const v = C('Rs 55,000 owed between those two.','who owes me money'); OUT(!!v && v.kind === 'fact_grounded');`,
      expect: 'F-42.123 exactly — an INVENTED figure acquits, assembled from two planes',
    },
    // ── MB4 / MB5 · WHY THESE TWO PROBE moneyGrounded DIRECTLY ──────────────────
    // The ORIGINAL reason retires here and is recorded rather than deleted: when
    // these were written, MONEY_STATE_RE carried no expense vocabulary, so an
    // expense-shaped reply never reached the money limb and a classifier-level
    // probe was vacuous BY CONSTRUCTION. F-42.131 cured that; §23 benches it.
    // The chair ruled the probes STAY DIRECT anyway — a mutation is best probed at
    // the function it mutates, and routing these through the classifier would make
    // them depend on a second arm in order to fall.
    {
      name: 'MB4 drop the DATE fence — 00:52:38 walks again (F-42.97)',
      file: 'src/lib/wireGuardVictor.js',
      from: "    for (const d of extractSpokenDates(text)) if (!dateSet.has(d)) return false;",
      to: "    for (const d of extractSpokenDates(text)) if (false) return false;",
      probe: `const W = require('${scratch}/src/lib/wireGuardVictor.js');
  OUT(W.moneyGrounded('I have that on file already — Rs 5,000 out on 10 September for assistant payment.', facts, efacts) === true);`,
      expect: 'the amount was TRUE, so only the date convicts it — the specimen returns verbatim',
    },
    {
      name: 'MB5 drop F-42.118 — a sub-1000 invention goes unfenced again',
      file: 'src/lib/wireGuardVictor.js',
      from: "const AMOUNT_TOKEN_RE = /(?:Rs\\.?\\s*(\\d{1,3}(?:,\\d{2,3})+|\\d{4,}|\\d{3})|(\\d{1,3}(?:,\\d{2,3})+|\\d{4,}))/g;",
      to: "const AMOUNT_TOKEN_RE = /(?:Rs\\.?\\s*)?(\\d{1,3}(?:,\\d{2,3})+|\\d{4,})/g;",
      probe: `const W = require('${scratch}/src/lib/wireGuardVictor.js');
  OUT(W.moneyGrounded('You spent Rs 700 on printing.', facts, efacts) === true);`,
      expect: 'Rs 700 is invisible to the fence — the founder\'s own book opens with a Rs 500 row',
    },
    // ── A DESIGN FACT THE MUTATION RUN EXPOSED, AND IT SPLIT THIS CELL IN TWO ─────
    // The first cut had ONE M1 mutating `&& !moneyClaim` and probed it with the
    // lead_send specimen — and the mutation stayed GREEN, correctly. The gate is
    // widened by TWO mechanisms, not one: `if (victorClass) claimsAct = true;` carries
    // the expense and lead_send families, while `&& !moneyClaim` carries the money
    // family alone. A single mutation could therefore only ever prove half of B-i, and
    // a cell that cannot fall for the reason it names is a hollow green. Split, and the
    // fact is recorded rather than smoothed over.
    {
      name: 'M1a drop the structural family\'s path into the gate',
      file: 'src/api/vendor-engine/chat.js',
      from: "  if (victorClass) claimsAct = true;",
      to: "  if (false) claimsAct = true;",
      probe: `const v = C('Done.','paid the assistant 5000 today'); OUT(v === null);`,
      expect: 'the expense specimen goes NULL again — never classified, not acquitted',
    },
    {
      name: 'M1c drop B-i\'s transmission arm from the relay family',
      file: 'src/api/vendor-engine/chat.js',
      from: "  const relayClaim = RELAY_CLAIM_RE.test(eligible) || leadSendClaim(eligible, ctx && ctx.message);",
      to: "  const relayClaim = RELAY_CLAIM_RE.test(eligible);",
      probe: `const v = C('Reaching out to Kunal now.','message Kunal that we are available Nov 22'); OUT(v === null);`,
      expect: 'F-39.71 goes invisible again — "reach out" is in no other transmission family',
    },
    {
      name: 'M1d drop R-VS.14 — the transmission arm stops self-marking',
      file: 'src/api/vendor-engine/chat.js',
      // RE-AIMED (F-42.21 micro): R-42.3 rewrote this very line to lift BOTH
      // transmission families on a conditional offer, so the old anchor no longer
      // exists. The mutation's SUBJECT is unchanged — strip the mark and F-39.71
      // walks again — and the anchor follows the line rather than being re-stamped.
      from: "    || ((RELAY_CLAIM_RE.test(x) || leadSendClaim(x, ctx && ctx.message)) && !offerNotClaim);\n    // R-VS.14 self-marking; R-42.3 lifts BOTH families on a conditional offer",
      to: "    ;",
      probe: `const v = C('Reaching out to Kunal now.','message Kunal that we are available Nov 22'); OUT(!v || !v.specimen);`,
      expect: 'F-39.71 walks again as a bare state description — the marker is what convicts it',
    },
    {
      name: 'M5 drop R-42.3 — the conditional offer marks the turn again',
      file: 'src/api/vendor-engine/chat.js',
      from: "  return !RELAY_CLAIM_RE.test(t.replace(FUTURE_TRANSMISSION_RE, ' '));",
      to: "    return false;",
      probe: `const LIVE = "I need one thing before the message goes: which Priya Nair engagement is this for? The cabinet shows her name on two unpaid invoices (TDW/DEV440/07 for Rs 10,000 and TDW/DEV440/05 for Rs 42,000), but I don't have her phone number or the engagement details to confirm I'm reaching the right person and the right event.\\n\\nGive me her phone number and I'll send it now.";
  const v = C(LIVE,'message Priya Nair that the fee is going up by 20k'); OUT(!!v && v.specimen);`,
      expect: 'the 18:28:36 false interception returns',
    },
    {
      name: 'M6 restore the bare-gerund limb (the seat\'s own half)',
      file: 'src/lib/wireGuardVictor.js',
      from: '  "\\\\breach(?:ing|ed)?\\\\s+out\\\\b",',
      to: '  "\\\\b(?:reaching|getting|following)\\\\s+(?:out\\\\s+)?(?:to|with)?\\\\s*\\\\S",',
      probe: `const W = require('${scratch}/src/lib/wireGuardVictor.js'); OUT(W.BARE_INTENT_RE.test("to confirm I'm reaching the right person"));`,
      expect: 'a bare "reaching" is a transmission again — half (b) returns',
    },
    {
      name: 'M7 put booking back ahead of money in the class ladder',
      file: 'src/api/vendor-engine/chat.js',
      from: "        : (moneyOnly ? 'money'\n          : (BOOKING_CLAIM_RE.test(eligible) ? 'booking' : 'records'))));",
      to: "        : (BOOKING_CLAIM_RE.test(eligible) ? 'booking'\n          : (moneyOnly ? 'money' : 'records'))));",
      probe: `const LIVE1 = "The cabinet shows no live Priya Nair engagement binder. The invoice book I'm holding has Priya Nair on two unpaid invoices, but Donna can't find the engagement record to match them. This could mean the invoices are from an older engagement or a different filing.\\n\\nBefore I draft the message, tell me: Is Priya Nair an existing client whose engagement is already booked, or is this a new client you're quoting? If existing, what's the wedding date or event, so I can locate her file? If new, I'll draft the quote with the fee as you've stated it — no need to increase something not yet quoted to her.";
  const hands = ['donna_find','donna_find','donna_tally','donna_find','donna_find','donna_find','donna_history','donna_find','donna_tally','donna_tally'];
  const rr = { reply: LIVE1, victor_mode: 'business', tool_calls: [{ name: 'dear_donna_talk', donna_calls: hands.map(function (n) { return { name: n }; }) }] };
  let vv = chat.wireGuardClassify('${V}', rr, undefined, { message: 'who owes me money', moneyFacts: facts });
  if (vv && vv.kind === 'prior_deed_pending') vv = chat.wireGuardClassify('${V}', rr, false, { message: 'who owes me money', moneyFacts: facts });
  OUT(!!vv && vv.kind === 'fact_grounded' && vv.deed_class !== 'money');`,
      expect: 'the kind and the class disagree again — F-42.22 returns',
    },
    {
      name: 'M9 drop arm (b) — an unresolved lift speaks again',
      file: 'src/lib/vendor/relaySeat.js',
      from: "    if (!named && who.reason !== 'ambiguous_recipient') return null;   // no standing: say nothing",
      to: "    if (false) return null;",
      probe: `const fs2 = require('fs');
  const seat = fs2.readFileSync('${scratch}/src/lib/vendor/relaySeat.js', 'utf8');
  OUT(!/if \\(!named && who\\.reason/.test(seat));`,
      expect: "the 23:42:52 draft is destroyed again — a bad lift speaks over the model",
    },
    {
      name: 'M10 drop cure 1 — the fence reads only the ruling\'s example again',
      file: 'src/lib/wireGuardVictor.js',
      from: "    if (numberList.some((stored) => stored.endsWith(n) || n.endsWith(stored))) continue;",
      to: "    if (false) continue;",
      probe: `const W = require('${scratch}/src/lib/wireGuardVictor.js');
  const F = { ok:true, unreadable:false, rowCount:3, handles:{ amounts:['42,000','42000'], numbers:['TDW/DEV440/05'], names:[] } };
  OUT(!W.moneyGrounded('Priya Nair owes you Rs 42,000 — invoice /05, unpaid.', F));`,
      expect: 'every money answer citing an invoice tail convicts again — the live 23:27 disease',
    },
    {
      name: 'M11 drop cure 2 — Fork D retries a hand-less class again',
      file: 'src/lib/vendorInbound.js',
      from: "      if ((s2line || impMiss) && !_noRetry && !handless) {",
      to: "      if ((s2line || impMiss) && !_noRetry) {",
      probe: `const fs2 = require('fs');
  const wa = fs2.readFileSync('${scratch}/src/lib/vendorInbound.js', 'utf8');
  OUT(!/&& !handless\\) \\{/.test(wa));`,
      expect: 'an expense costume is retried, and F3 lands over R-40.2 line 1',
    },
    {
      name: 'M1b drop the money family from the gate',
      file: 'src/api/vendor-engine/chat.js',
      from: "  if (!claimsAct && !jotClaim && !narrated && !presenceClaim && !moneyClaim) return null;",
      to: "  if (!claimsAct && !jotClaim && !narrated && !presenceClaim) return null;",
      probe: `const v = C('You have no unpaid invoices.','who owes me money'); OUT(v === null);`,
      expect: 'F-40.6 returns — a false money absence becomes unclassifiable again',
    },
    {
      name: 'M2 empty the structural class list',
      file: 'src/lib/wireGuardVictor.js',
      from: "const STRUCTURAL_CLASSES = ['expense'];",
      to: "const STRUCTURAL_CLASSES = [];",
      probe: `const v = C('Done.','paid the assistant 5000 today'); OUT(!v || !v.specimen || v.kind !== 'costume');`,
      expect: 'the expense costume stops being false-by-construction',
    },
    {
      name: 'M3 drop the equality fence (ground on presence alone)',
      file: 'src/lib/wireGuardVictor.js',
      // ── LABELED AMENDMENT (CE-42, seat V-2). RE-AIMED, TEETH KEPT, COUNT
      // PRESERVED. ARM B (F-42.98) replaced the one-line loop with a three-way
      // test — equality, then each block's own subtotal pool — so the old anchor
      // no longer exists. The MUTATION'S SUBJECT is unchanged: cut the fence and
      // a wrong rupee must acquit. Re-aimed at the `return false` that ENDS the
      // amount loop, which is the fence's actual tooth.
      from: "    if (exp && admittedAsSubtotal(a, exp.rowAmounts, rupees)) continue;\n    return false;",
      to: "    if (exp && admittedAsSubtotal(a, exp.rowAmounts, rupees)) continue;\n    continue;",
      probe: `const v = C('Priya Nair owes you Rs 75,000 — invoice /05, unpaid.','who owes me money'); OUT(!v.specimen);`,
      expect: 'a wrong rupee acquits — R-VS.6 fence 1 is the only thing stopping it',
    },
    // ── AND THE SAME SPLIT, FOR THE SAME REASON, ON THE VETOED-LINE EXEMPTION ────
    // There are TWO exemptions and they protect different lines. chat.js's
    // `&& !containsVetoedLine(eligible)` is what keeps LINE 3 out of the money family —
    // that is the load-bearing one, and it is the defect the seat's own probe caught
    // live. wireGuardVictor's exemption inside `victorClaim` is defence-in-depth, and
    // its teeth are only visible on a COMBINED shape (a completion opener carrying a
    // vetoed line), because lines 1 and 2 claim nothing on their own and are safe
    // structurally. Both are mutated; neither is asserted on a probe it cannot move.
    {
      name: 'M4a delete the money-family vetoed exemption (chat.js)',
      file: 'src/api/vendor-engine/chat.js',
      // ── LABELED AMENDMENT (CE-42, seat V-2, rider r2). RE-AIMED, TEETH KEPT,
      // COUNT PRESERVED, RATIFY-OR-REVERT. F-42.132 arm (1) rewrote this line: the
      // limb now opens on a SPOKEN FIGURE as well as on the verb list, so the old
      // one-line anchor no longer exists. The mutation's SUBJECT is untouched —
      // delete the vetoed-line exemption and the cure's own refusal convicts as a
      // money costume.
      from: "  const moneyClaim = (MONEY_STATE_RE.test(eligible) || spokenFigures.length > 0)\n    && !containsVetoedLine(eligible);",
      to: "  const moneyClaim = (MONEY_STATE_RE.test(eligible) || spokenFigures.length > 0);",
      probe: `const bad = { ok:false, unreadable:true, rowCount:0, handles:{amounts:[],numbers:[],names:[]} };
  const r = { reply: L.VICTOR_LINES.LEDGER_UNREADABLE, victor_mode:'business', tool_calls: [] };
  let v = chat.wireGuardClassify('${V}', r, undefined, { message:'who owes me money', moneyFacts: bad });
  if (v && v.kind === 'prior_deed_pending') v = chat.wireGuardClassify('${V}', r, false, { message:'who owes me money', moneyFacts: bad });
  OUT(!!v && v.specimen);`,
      expect: "the cure's own refusal convicts as a money costume — the probe-found defect returns",
    },
    {
      name: 'M4b delete the structural-family vetoed exemption (wireGuardVictor.js)',
      file: 'src/lib/wireGuardVictor.js',
      from: "  if (containsVetoedLine(reply)) return null;",
      to: "  if (false) return null;",
      probe: `const v = C('Logged. ' + L.VICTOR_LINES.EXPENSE_NO_HAND,'paid the assistant 5000 today'); OUT(!!v && v.specimen);`,
      expect: 'a refusal wearing a completion opener convicts — the depth layer has teeth',
    },
  ];

  for (const m of MUT) {
    const target = path.join(scratch, m.file);
    const original = fs.readFileSync(target, 'utf8');
    if (original.indexOf(m.from) === -1) { T(`${m.name} — ANCHOR NOT FOUND (mutation is vacuous)`, false); continue; }
    fs.writeFileSync(target, original.split(m.from).join(m.to));
    const runner = path.join(scratch, '_mut.js');
    fs.writeFileSync(runner, `
process.env.SUPABASE_URL='http://localhost:54321'; process.env.SUPABASE_SERVICE_ROLE_KEY='bench-inert';
const chat = require('${scratch}/src/api/vendor-engine/chat.js');
const L = require('${scratch}/src/lib/victorLines.js');
const MF = require('${scratch}/src/lib/vendor/moneyFacts.js');
const EF = require('${scratch}/src/lib/vendor/expenseFacts.js');
const FIX = ${JSON.stringify(FIXTURE)};
const EFIX = ${JSON.stringify(EXPENSE_FIXTURE)};
const sb = { from(){ const c={select(){return c;},eq(){return c;},is(){return c;},order(){return Promise.resolve({data:FIX.map(r=>Object.assign({},r)),error:null});}}; return c; } };
// The expense door reads with .limit() at the tail, so its stub ends there.
const esb = { from(){ const c={select(){return c;},eq(){return c;},is(){return c;},order(){return c;},limit(){return Promise.resolve({data:EFIX.map(r=>Object.assign({},r)),error:null});}}; return c; } };
(async () => {
  const facts = await MF.buildMoneyFacts(sb, '${V}');
  const efacts = await EF.buildExpenseFacts(esb, '${V}', '2026-09-10');
  const C = (reply, message) => {
    const r = { reply, victor_mode:'business', tool_calls: [] };
    let v = chat.wireGuardClassify('${V}', r, undefined, { message, moneyFacts: facts, expenseFacts: efacts });
    if (v && v.kind === 'prior_deed_pending') v = chat.wireGuardClassify('${V}', r, false, { message, moneyFacts: facts, expenseFacts: efacts });
    return v;
  };
  const OUT = (b) => console.log(b ? 'RED-AS-EXPECTED' : 'STILL-GREEN');
  ${m.probe}
})();`);
    let out = '';
    try { out = execFileSync(process.execPath, [runner], { encoding: 'utf8' }).trim(); }
    catch (e) { out = 'THREW: ' + (e && e.message); }
    T(`${m.name} -> ${m.expect}`, out.indexOf('RED-AS-EXPECTED') !== -1);
    fs.writeFileSync(target, original);
  }
  try { fs.rmSync(scratch, { recursive: true, force: true }); } catch (e) { /* scratch only */ }

  console.log(`\n  ── ${pass}/${pass + fail} PASS ──\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('BENCH THREW (unexpected):', (e && e.stack) || e); process.exit(2); }); // F-39.67: an unexpected throw is ERROR (2), never FAIL (1)
