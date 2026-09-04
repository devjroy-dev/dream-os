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
const T = (label, cond) => { if (cond) { pass++; console.log('    PASS  ' + label); } else { fail++; console.log('    FAIL  ' + label); } };

const V = '23165e38-6510-4639-ab6a-9f35bab93742'; // DEV440, masterplan test identity map

// DEV440's fixture, as the founder's SELECT returns it. Never recalled — the shape is
// public.invoices' witnessed columns (docs/db/PUBLIC_SCHEMA.md:637, 21 columns).
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
  const PINNED = {
    EXPENSE_NO_HAND: 'c400bc688434a6bfa9fc2414bd3590f2f1fcb4739975b096eab0a380d2e42291',
    LEDGER_UNREADABLE: '70af765dfab2ef49bf14b41c717fd3e00c437893083689b288000db2e635570f',
    ADVISOR_ON_WHATSAPP: 'eedc31106b740fb72b827807031f7f57d9bb532565c642ce0b22518bbdc21851',
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
  T('R-40.2 line 2 is VACATED and no replacement was minted (R-VS.13)',
    Object.keys(lines.VICTOR_LINES).length === 3
    && lines.VICTOR_LINES.LEAD_SEND_NO_WIRE === undefined);
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
    T('  …and it is LAST in the dynamic tail', /\+ relayBlock \+ moneyBlock;/.test(loop));
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

  // ── §11 · BOTH WAYS, BY PRODUCTION MUTATION ─────────────────────────────────────────
  console.log('\n  §11 both ways — mutations on the SHIPPED bytes, never test setup');
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'b40-'));
  execFileSync('cp', ['-r', path.join(ROOT, 'src'), scratch]);
  execFileSync('cp', ['-r', path.join(ROOT, 'node_modules'), path.join(scratch, 'node_modules')], { stdio: 'ignore' });

  const MUT = [
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
      from: "    || leadSendClaim(x, ctx && ctx.message);   // R-VS.14 — self-marking, both lists",
      to: "    ;",
      probe: `const v = C('Reaching out to Kunal now.','message Kunal that we are available Nov 22'); OUT(!v || !v.specimen);`,
      expect: 'F-39.71 walks again as a bare state description — the marker is what convicts it',
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
      from: "  for (const a of amounts) if (!amountSet.has(a)) return false;",
      to: "  for (const a of amounts) if (false) return false;",
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
      from: "  const moneyClaim = MONEY_STATE_RE.test(eligible) && !containsVetoedLine(eligible);",
      to: "  const moneyClaim = MONEY_STATE_RE.test(eligible);",
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
const FIX = ${JSON.stringify(FIXTURE)};
const sb = { from(){ const c={select(){return c;},eq(){return c;},is(){return c;},order(){return Promise.resolve({data:FIX.map(r=>Object.assign({},r)),error:null});}}; return c; } };
(async () => {
  const facts = await MF.buildMoneyFacts(sb, '${V}');
  const C = (reply, message) => {
    const r = { reply, victor_mode:'business', tool_calls: [] };
    let v = chat.wireGuardClassify('${V}', r, undefined, { message, moneyFacts: facts });
    if (v && v.kind === 'prior_deed_pending') v = chat.wireGuardClassify('${V}', r, false, { message, moneyFacts: facts });
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
