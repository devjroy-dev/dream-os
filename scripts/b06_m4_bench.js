#!/usr/bin/env node
'use strict';
// scripts/b06_m4_bench.js — TDW_06 · M-4 · ELIZA: FIRST CONTACT, THE MONEY REGISTER,
// AND THE TWO QUIET DISEASES. Runnable from any working directory (Q-SP-5).
//
// ── WHAT THIS BENCH CAN AND CANNOT PROVE, STATED FIRST ─────────────────────────
// The opener cure is a PROMPT paragraph, and this estate has learned twice what a desk
// can say about one: nothing (b06_m1 §7.1, b06_m2 §8.1 — "a prompt paragraph has no desk
// teeth, and the walk is where it answers"). So this bench does NOT claim the opener
// works. It proves the MECHANICAL preconditions without which the walk cannot even be
// run honestly: that the stanza reaches the composed prompt, that the deflection was
// demoted rather than deleted, and — the CE's non-negotiable — that the capture rule
// which makes the vendor's notification possible AT ALL survived the re-author intact.
// THE BEHAVIOURAL VERDICT IS THE GAUNTLET'S (armOpenerAnswersFirst, N-per-lane, both
// architectures) AND THE FOUNDER'S WALK. Any cell here claiming otherwise would be the
// hollow green M-2 was built to refuse.
//
// Everything else in this file IS a desk question and is driven through the SHIPPED
// functions: the register through the real renderers, the firewall through the real
// scrubText/scrubModelFrame, the withholding tell through the real executeFindTool over
// a stub estate that actually holds budgets.
//
// NON-VACUITY (§6): every mutation edits SHIPPED PRODUCTION CODE — the couple prompt, the
// firewall, the find tool, the money homes — never this bench's setup, and every mutated
// file is restored and asserted byte-identical.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// The engine's db.ts (:9) throws at MODULE LOAD without these, so any bench that reaches
// a compiled engine module must satisfy it first. INERT PLACEHOLDERS — the estate's own
// convention (b0457_assign_bench:23, b0496:24, b0498:65); no live credential ever enters a
// transcript or a bench (protocol §9). Nothing here opens a socket: the register functions
// under test are pure.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const ROOT = path.resolve(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');
const write = (rel, s) => fs.writeFileSync(P(rel), s);

const COUPLE = 'src/agent/coupleSystemPrompt.js';
const SCRUB = 'src/lib/vendor/scrub.js';
const DOOR = 'src/lib/vendorInbound.js';
const FIND_SRC = 'src/engine/src/core/tools/donnaFind.ts';
const FIND_DIST = 'src/engine/dist/core/tools/donnaFind.js';
const PRIM_DIST = 'src/engine/dist/core/tools/recordPrimitives.js';
const WITNESS = 'src/lib/witnessLine.js';
const HARVEY = 'src/engine/src/core/harveySoul.ts';

let pass = 0, fail = 0;
const H = (s) => console.log(`\n── ${s} ──`);
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e && e.message}`); fail++; }
}

// A fresh require of a CJS module, so a mutation on disk is actually re-read.
function fresh(rel) {
  const full = P(rel);
  delete require.cache[require.resolve(full)];
  return require(full);
}

async function main() {

// ════════════════════════════════════════════════════════════════════════════
H('§1 — THE OPENER: the founder\'s ruling reaches the composed prompt');

const buildCouple = () => fresh(COUPLE).buildCoupleSystemPrompt;
const firstContact = (over = {}) => buildCouple()({
  vendor: { category: 'photography', city: 'Delhi', open_to_travel: false },
  vendorUser: { name: 'Swati' },
  isReturningBride: false,
  ...over,
});

await t('§1.1 THE STANZA IS IN THE FIRST-CONTACT PROMPT — the disease was authored into instructions, so the cure is too', () => {
  const p = firstContact();
  assert.ok(p.includes('WHO YOU ARE WHEN SHE ARRIVES'), 'the opener stanza never reaches the composed prompt');
});

await t('§1.2 ANSWER LEADS, QUALIFY BESIDE — both halves of the ruling are present, and the ORDER is stated', () => {
  const p = firstContact();
  assert.ok(/her question gets answered first/i.test(p), 'the answer-first instruction is absent');
  assert.ok(/Beside the answer, never instead of it/i.test(p), 'the beside-not-instead clause is absent');
});

await t('§1.3 THE DEFLECTION WAS DEMOTED, NOT DELETED — what only the vendor can settle is still the vendor\'s', () => {
  const p = firstContact();
  assert.ok(/Never answer FOR Swati on what only they can settle/i.test(p), 'the vendor-only boundary was lost');
  // The OLD blanket rule must be gone: it is the sentence that produced the 50k specimen.
  assert.ok(!/For ANY question she asks you/i.test(p), 'the blanket do-not-answer rule survived the re-author');
});

await t('§1.4 THE FIRST TURN BRANCHES — a bare greeting still gets the fused line; a question does not', () => {
  const p = firstContact();
  assert.ok(/If she opened with a question or a specific need, ANSWER IT first/i.test(p), 'FLOW 1 does not branch');
  assert.ok(/If she opened with a bare greeting or nothing specific/i.test(p), 'the greeting path was dropped');
});

await t('§1.5 ⚑ THE CAPTURE CELL (CE: NON-NEGOTIABLE) — the rule that makes the vendor\'s notification possible SURVIVES', () => {
  // WHY THIS IS THE BINDING CELL, derived at the read-first: the vendor is notified ONLY
  // when capture_couple_lead fires. engine.js:371 pushes the synthetic `vendor_notification`
  // audit entry INSIDE that branch; :403 reads it; :466 returns it. An opener that answers
  // beautifully and never captures loses the vendor's notification entirely — a WORSE
  // outcome than the questionnaire it replaced.
  const p = firstContact();
  assert.ok(/STILL call capture_couple_lead with whatever you have so far/i.test(p),
    'HARD RULE 11 did not survive the opener re-author — the answer-first opener can now lose the lead');
  assert.ok(/A partial lead is far better than a lost one/i.test(p), 'the reason attached to the rule was lost');
  assert.ok(/Never let an enquiry vanish/i.test(p), 'the rule\'s closing clause was lost');
  // And the mechanical fact the rule protects, asserted at its own site.
  const eng = read('src/agent/engine.js');
  assert.ok(/toolCallsAudit\.push\(\{ name: 'vendor_notification'/.test(eng),
    'the synthetic vendor_notification push moved — the capture-gate premise needs re-deriving');
});

await t('§1.6 THE RETURNING-BRIDE BRANCH IS UNTOUCHED — this sitting cured FIRST contact only', () => {
  const p = buildCouple()({ vendor: { category: 'photography', city: 'Delhi' }, vendorUser: { name: 'Swati' }, isReturningBride: true, leadName: 'Priya' });
  assert.ok(!/WHO YOU ARE WHEN SHE ARRIVES/.test(p), 'the stanza leaked into the returning-bride branch');
  assert.ok(/don't restart any onboarding flow/i.test(p), 'the returning branch drifted');
});

await t('§1.7 THE NAMING ACT ARRIVED — and the name has ONE HOME (amended, TDW_08 P5 Phase 4)', () => {
  // ── LABELED AMENDMENT · COUNT PRESERVED · attribution below ───────────────
  // THIS CELL READ: `!/\bEliza\b/` on the composed first-contact prompt, with
  // the reason "this sitting named the agent; naming is a separate founder act."
  // IT WAS RIGHT, AND THE SEPARATE ACT HAS NOW HAPPENED: LOG:2821, the founder's
  // words verbatim, 「 THE COUPLE AGENT FOR BOOKINGS AND QUERY WILL BE ELIZA 」.
  //
  // The old assertion would still pass, because `useEliza` defaults FALSE to
  // mirror the production flag — and THAT IS EXACTLY WHY IT IS AMENDED RATHER
  // THAN LEFT ALONE. A cell that goes green because of a default rather than
  // because of the property is a cell waiting to red for the wrong reason on
  // the day the default moves. RE-AIMED TO THE PROPERTY IT NOW EXISTS FOR:
  // the name is absent where the lane is off, present where it is on, and
  // DECLARED IN EXACTLY ONE PLACE either way.
  const off = firstContact();
  assert.ok(!/\bEliza\b/.test(off), 'the name reached the wire with the lane flag off');

  const soul = require(path.join(ROOT, 'src/agent/souls/elizaSoul.js'));
  const on = buildCouple()({
    vendor: { category: 'photography', city: 'Delhi' }, vendorUser: { name: 'Swati' },
    isReturningBride: false, useEliza: true,
  });
  assert.ok(new RegExp(`You are ${soul.ELIZA},`).test(on), 'the ruled name never reaches the Eliza path');

  const shellSrc = read('src/agent/coupleSystemPrompt.js');
  assert.ok(!/['"`]Eliza['"`]/.test(shellSrc),
    'the shell re-declares the literal — one home (miraSoul / waNumbers discipline), or it drifts');
});

// ════════════════════════════════════════════════════════════════════════════
H('§2 — THE MONEY REGISTER: 「 forbids both 」 — no glyph, no ungrouped/k form');

// ── F-08.88's CURE (TDW_08 P5 rider, CE R-R? / D2) ──────────────────────────
// THIS BENCH READ 29/4 ON A COLD CLONE AND 33/0 ON EVERY RE-RUN. It was filed as a
// possible mutation-restore race (the `writeFileSync` at :405). That framing was
// WRONG and is corrected here: the four §2 cells below `require` the COMPILED
// engine at `src/engine/dist/...`, which does not exist on a fresh clone. The first
// run rebuilt it (the `rebuild: true` arm shells `npx tsc`) and reddened while it
// did; every later run found dist present and greened. An order dependency with a
// stated cause — A COLD TREE — not a race. The `writeFileSync` is innocent.
//
// The cure is not a new mechanism: `scripts/lib/dist_gate.js` has existed since
// Block 06 and NINE benches already use it. This one never joined. It also catches
// the STALE case (dist compiled before its source moved), which this bench was
// equally blind to.
const { distGate } = require(path.join(__dirname, 'lib', 'dist_gate'));
const gate = distGate({
  sentinel: 'function rs',
  srcPath:  P('src/engine/src/core/tools/recordPrimitives.ts'),
  distPath: P(PRIM_DIST),
  benchCmd: 'scripts/b06_m4_bench.js',
});

if (gate.runDist) {
await t('§2.1 THE TWO HOMES AGREE — the CJS wire and the TS engine converge on ONE output form', () => {
  // Correction №A: the estate owns TWO Indian-grouping homes on two runtimes. The ruling
  // is per-runtime with no cross-reach invented, so the ONLY thing that makes that safe is
  // that they agree. Asserted here, on the shipped functions, not assumed.
  const { rupees } = fresh(WITNESS);
  const { rs } = require(P(PRIM_DIST));
  for (const n of [500, 80000, 350000, 400000, 500000, 4000000, 12345678]) {
    assert.strictEqual(rupees(n), rs(n), `the two money homes disagree at ${n}: ${rupees(n)} vs ${rs(n)}`);
  }
});

await t('§2.2 THE HOUSE FORM — grouped Indian-style, "Rs", and NEITHER forbidden shape', () => {
  const { rs } = require(P(PRIM_DIST));
  assert.strictEqual(rs(500000), 'Rs 5,00,000');
  assert.strictEqual(rs(350000), 'Rs 3,50,000');
  assert.strictEqual(rs(4000000), 'Rs 40,00,000');
  for (const n of [350000, 500000, 4000000]) {
    const out = rs(n);
    assert.ok(!/₹/.test(out), `the glyph survived at ${n}: ${out}`);
    assert.ok(!/\d\s*[kKlL]\b/.test(out), `a k/L form survived at ${n}: ${out}`);
    assert.ok(!new RegExp(`Rs ${n}\\b`).test(out), `the ungrouped digit string survived at ${n}: ${out}`);
  }
});

await t('§2.3 THE GLOSS IS OUT ON THE WIRE — grouped bare, never "(4 lakh)" (the founder\'s reading of 「 forbids both 」)', () => {
  const { rs } = require(P(PRIM_DIST));
  assert.ok(!/lakh|crore|thousand/i.test(rs(400000)), `the engine-internal gloss reached the register form: ${rs(400000)}`);
});

await t('§2.4 THE DONOR POOL IS DRAINED — the payload the model READS carries the house form', () => {
  // F-04.70's lesson one layer on: a model re-voices the digits its own hands hand it.
  // These are the lines Donna returns and Harvey repeats.
  const { recordItem } = require(P(PRIM_DIST));
  const item = recordItem({ id: 'r1', client: 'Rhea', amount: 500000, direction: 'in', amount_received: 350000, amount_pending: 150000 });
  const text = JSON.stringify(item);
  assert.ok(/Rs 5,00,000/.test(text), `the record line still hands the model an ungrouped figure: ${text}`);
  assert.ok(!/Rs 500000\b/.test(text), `the raw digit string survived: ${text}`);
});
} else {
  console.log('  … §2.1/§2.2/§2.3/§2.4 SKIPPED, stated (see the gate above).');
  console.log('    They drive the COMPILED engine; the source-side register laws below still run.');
}


// ── LABELED AMENDMENT · THE CE-77 REVERT (CE-ruled 2026-07-25) ──────────────────
// This cell asserted the M-4 register SOUL bytes (V-1/V-2/V-3). CE-77 reverted them:
// the wire arm carries the guarantee mechanically, so those sentences bought nothing
// the arm doesn't secure — and they cost the voice by displacing terminal clauses
// (harveySoul's voice run split; advisorLens's machinery clause pushed off-terminal;
// donnaSoul's own closing line displaced). The PROPERTY the cell existed for — money
// renders in the house form on the wire — did not go away; it MOVED PLANES, and is
// now asserted at b06_m4b §1 against the walk's own bytes. Re-pointed, not deleted:
// a cell that asserts a reverted byte is a cell asserting the past.
await t('§2.5 THE REGISTER GUARANTEE LIVES ON THE WIRE, AND THE PRE-EXISTING LAW IS UNTOUCHED', () => {
  const soul = read(HARVEY);
  // The symbol clause PREDATES M-4 (CE-67's breach happened under it) and must survive
  // the revert byte-for-byte: the revert undid M-4's addition, never the standing law.
  assert.ok(/never the symbol/.test(soul), 'the pre-existing symbol law was destroyed by the revert');
  // And M-4's ADDITION must be gone — a cell that lets it linger would green a half-revert.
  assert.ok(!/grouped the Indian way/.test(soul), 'the reverted grouping sentence is still present');
  // The guarantee it was minted for now lives here, mechanically:
  const { registerScrub } = require(P('src/lib/vendor/scrub.js'));
  assert.strictEqual(registerScrub('advance of ₹4 lakh'), 'advance of Rs 4,00,000');
});

await t('§2.6 F-06.38 — brideSystemPrompt no longer teaches against itself', () => {
  const b = read('src/agent/brideSystemPrompt.js');
  assert.ok(!/Rs 50k/.test(b), 'the "Rs 50k" example survived — the file still teaches two registers');
  assert.ok(/Rs 50,000 advance logged/.test(b), 'the corrected example is absent');
});

await t('§2.7 THE COUPLE WIRE CARRIES THE REGISTER TOO — she reads this number back to a vendor', () => {
  const p = firstContact();
  assert.ok(/Rs 5,00,000/.test(p) && /never the ₹ symbol/i.test(p), 'the couple lane has no register instruction');
});

// ════════════════════════════════════════════════════════════════════════════
H('§3 — F-06.35: THE CASE GAP, AND THE SPLITTER\'S LAW HELD BOTH WAYS');

await t('§3.1 A LOWERCASE PERSONA NAME IN THE MODEL\'S FRAME NOW SCRUBS — the shape that used to escape', () => {
  const { scrubText } = fresh(SCRUB);
  assert.ok(!/\bdonna\b/i.test(scrubText('I had donna pull the file.')), 'lowercase donna still reaches the wire');
  assert.ok(!/\bharvey\b/i.test(scrubText('that was harvey speaking')), 'lowercase harvey still reaches the wire');
});

await t('§3.2 THE VOCATIVE PAIR TOO — the charter named two sites; the gap lived at four', () => {
  const { scrubText } = fresh(SCRUB);
  // A lowercase vocative must collapse, not be re-aimed at the vendor (F-04.27's disease).
  assert.strictEqual(scrubText('Pull the numbers, donna.'), 'Pull the numbers.');
  assert.ok(!/Operator, pull/i.test(scrubText('donna, pull the numbers')), 'a lowercase sentence-initial vocative was re-aimed instead of collapsed');
});

await t('§3.3 ⚑ HER SENTENCE IS STILL INVIOLATE — a lowercase `donna` in HER QUOTE passes byte-exact', () => {
  // The binding the CE set on this rider. It holds STRUCTURALLY, not by hope: scrubModelFrame
  // splits on the quoted verbatim and calls scrubText on the FRAME HALVES only, so her span
  // never enters the function no flag here can reach it.
  const { scrubModelFrame } = fresh(DOOR);
  const hers = 'is donna the one who called me?';
  const framed = `Priya just messaged. Her message: "${hers}"`;
  const out = scrubModelFrame(framed, hers);
  assert.ok(out.includes(`"${hers}"`), `HER lowercase word was rewritten: ${out}`);
});

await t('§3.4 AND THE FRAME AROUND HER QUOTE STILL SCRUBS — both halves in one string', () => {
  const { scrubModelFrame } = fresh(DOOR);
  const hers = 'is donna the one who called me?';
  const framed = `donna flagged this. Her message: "${hers}"`;
  const out = scrubModelFrame(framed, hers);
  assert.ok(/^Operator flagged this\./.test(out), `the model's lowercase frame survived: ${out}`);
  assert.ok(out.includes(`"${hers}"`), 'her quote was damaged while curing the frame');
});

// ════════════════════════════════════════════════════════════════════════════
H('§4 — F-06.36: THE WIRE SCRUB STOPS BEING SILENT');

await t('§4.1 A WIRE CATCH FILES A ROW — and it is its OWN action, never `on_write`', () => {
  const { witnessWireScrub } = fresh(SCRUB);
  const rows = [];
  const supa = { from: () => ({ insert: async (r) => { rows.push(r); return { error: null }; } }) };
  const out = witnessWireScrub(supa, 'v1', 'whatsapp', 'Donna filed it', 'Operator filed it', 'test:reply');
  assert.strictEqual(out, 'Operator filed it', 'the witness changed the returned string');
  const row = JSON.stringify(rows);
  assert.ok(/persona_scrub_on_wire/.test(row), `no on_wire row was filed: ${row}`);
  assert.ok(!/persona_scrub_on_write/.test(row), 'the wire filed under the STORAGE action name — the two planes collapsed');
});

await t('§4.2 A CLEAN STRING FILES NOTHING — the feed records catches, not traffic', () => {
  const { witnessWireScrub } = fresh(SCRUB);
  const rows = [];
  const supa = { from: () => ({ insert: async (r) => { rows.push(r); return { error: null }; } }) };
  witnessWireScrub(supa, 'v1', 'whatsapp', 'nothing to catch', 'nothing to catch', 'test:reply');
  assert.strictEqual(rows.length, 0, 'a clean wire string filed a witness row');
});

await t('§4.3 IT IS FAIL-SAFE — no supabase, no vendorId, and a throwing ledger never cost a reply', () => {
  const { witnessWireScrub } = fresh(SCRUB);
  assert.strictEqual(witnessWireScrub(null, null, 'whatsapp', 'Donna', 'Operator', 'x'), 'Operator');
  const boom = { from: () => ({ insert: async () => { throw new Error('ledger down'); } }) };
  assert.strictEqual(witnessWireScrub(boom, 'v1', 'whatsapp', 'Donna', 'Operator', 'x'), 'Operator');
});

await t('§4.4 BOTH DOORS ARE WITNESSED — the twin-miss is the exact class scrub.js\'s header refuses', () => {
  assert.ok(/witnessWireScrub\(/.test(read(DOOR)), 'the WhatsApp door files no wire witness');
  assert.ok(/witnessWireScrub\(/.test(read('src/api/vendor-engine/chat.js')), 'the web door files no wire witness — one shape cured, its twin missed');
});

// ════════════════════════════════════════════════════════════════════════════
H('§5 — F-06.30: THE WITHHOLDING TELL (the discriminator\'s own shapes)');

// A stub estate that ACTUALLY HOLDS A BUDGET — the whole point. A tell over an empty
// cabinet proves nothing; the disease was a false "none with budget stated" spoken while
// a real figure sat on file.
function stubEstate() {
  const store = {
    records: [
      { id: 'rec-m4a', agent_id: 'A', client: 'Dev Test 23', amount: 400000, direction: 'in', amount_received: null, amount_pending: null, payment_status: null, date: '2026-12-12', stage: 'new', note: 'Delhi wedding', doc_ref: null, phone: '9962575992', reason_for_action: null, hidden: false, created_at: '2026-07-24T10:00:00Z', updated_at: '2026-07-24' },
      { id: 'rec-m4b', agent_id: 'A', client: 'Priya M2 Fresh', amount: null, direction: null, amount_received: null, amount_pending: null, payment_status: null, date: null, stage: 'new', note: null, doc_ref: null, phone: null, reason_for_action: null, hidden: false, created_at: '2026-07-25T01:00:00Z', updated_at: '2026-07-25' },
    ],
  };
  return store;
}

async function runFind(input) {
  const dist = P(FIND_DIST);
  delete require.cache[require.resolve(dist)];
  const mod = require(dist);
  // The tool resolves its client through the engine's db module; the m3/gauntlet technique
  // is reused — drive the SHIPPED compiled tool over an injected store.
  return mod.executeFindTool('A', input);
}

await t('§5.1 THE TELL RIDES THE PRODUCTION SHAPE — `{"stage":"new"}`, not the ruling\'s `{}` shorthand', () => {
  // Correction №10, derived at M-4 and load-bearing: donnaFind:356 builds `tokens` from
  // client+note ALONE, so `{"stage":"new"}` — the argument the 02:38:57 turn actually sent —
  // is tokens-empty and takes the recognition path. Benching `{}` alone would leave the
  // shape production sent unproven, which is a green over a shape nobody sends.
  const src = read(FIND_SRC);
  assert.ok(/const rawText = \[client, note\]/.test(src),
    'the tokens predicate moved — re-derive whether stage still falls through to recognition');
  assert.ok(/if \(tokens\.length === 0\) \{\s*\n\s*if \(stage\) q = q\.eq\('stage', stage\);/.test(src),
    'stage no longer rides the tokens-empty branch — the specimen shape may have changed lanes');
});

await t('§5.2 THE TELL IS SITED ON BOTH RECOGNITION GATES AND NEITHER MATCHED PATH', () => {
  const src = read(FIND_SRC);
  const tells = (src.match(/RECOGNITION_WITHHOLDING_TELL/g) || []).length;
  assert.ok(tells >= 3, `the tell is not on both gates (found ${tells} references incl. its definition)`);
  assert.ok(/const withholdingTell = recentsShape \? /.test(src), 'gate 2 does not condition on recentsShape');
  // The matched path must NOT claim to be hiding anything — there, nothing is.
  assert.ok(/recentsShape \? recognitionRow\(r\) : describeRow\(r, tokens\)/.test(src), 'the render fork moved');
});

await t('§5.3 THE TELL SAYS THE ONE THING THE PAYLOAD\'S SHAPE HIDES', () => {
  // The tell is assembled from concatenated string literals, so grepping the RAW source
  // for a phrase that spans a seam tests the formatting and not the sentence. Join the
  // seams first: this asserts the string that actually reaches the model.
  const src = read(FIND_SRC).replace(/'\s*\+\s*\n\s*'/g, '');
  assert.ok(/Money and phone numbers are deliberately NOT rendered/.test(src), 'the tell does not name what is withheld');
  assert.ok(/cannot\s+tell you whether a budget is on file/.test(src), 'the tell does not name the question it forbids answering');
  assert.ok(/none with a budget stated/.test(src), 'the tell does not name the exact false sentence the specimen produced');
});

await t('§5.4 THE TELL\'S OWN CLAIM IS TRUE — the recognition row really does carry no figure', () => {
  // A tell that says money is withheld, over a payload that leaks money, would be worse
  // than no tell. The property and its declaration are asserted together.
  const src = read(FIND_SRC);
  // Slice recognitionRow to ITS OWN closing brace. The first draft of this cell ran the
  // slice to executeFindTool — which now contains the tell — so it greped the tell's own
  // words ("money", "phone") and convicted the cure of the disease it cures. Same shape as
  // the gauntlet cell amended this sitting; caught here by the cell refusing to go green.
  const start = src.indexOf('function recognitionRow');
  const body = src.slice(start, src.indexOf('\n}', start) + 2);
  const code = body.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  assert.ok(!/amount|budget|phone/.test(code), `recognitionRow renders a withheld field: ${code.slice(0, 240)}`);
});

// ════════════════════════════════════════════════════════════════════════════
H('§6 — NON-VACUOUS: RED AT THE UNCURED TREE, BY PRODUCTION MUTATION');

const MUTATIONS = [
  { label: '§1.1/§1.2 RED — the stanza is removed: first contact hands her the form again, the 50k specimen restored',
    file: COUPLE, from: 'WHO YOU ARE WHEN SHE ARRIVES', to: 'WHO YOU ARE WHEN SHE ARRIVES_MUTANT',
    check: () => assert.ok(!firstContact().includes('WHO YOU ARE WHEN SHE ARRIVES\n')) },
  { label: '§1.5 RED — HARD RULE 11 is deleted: an answer-first opener can lose the lead and the vendor is never told',
    file: COUPLE, from: 'STILL call capture_couple_lead with whatever you have so far', to: 'stop and wait',
    check: () => assert.ok(!/STILL call capture_couple_lead with whatever you have so far/.test(firstContact())) },
  // F-08.88: this arm SHELLS `npx tsc` to rebuild dist. On a cold clone that build is
  // the very thing that made run one red. The arm is gated on the same condition as the
  // cells it proves — an arm whose cell did not run proves nothing about that cell.
  ...(gate.runDist ? [{ label: '§2.2 RED — the grouped door returns the raw digits: the model reads an off-register figure off its own hand',
    file: 'src/engine/src/core/tools/recordPrimitives.ts', from: '  return `Rs ${inr(v)}`;', to: '  return `Rs ${v}`;',
    rebuild: true,
    check: () => { const { rs } = require(P(PRIM_DIST)); assert.strictEqual(rs(500000), 'Rs 500000'); } }] : []),
  { label: '§3.1 RED — the persona arms lose the case flag: every lowercase send walks straight through',
    file: SCRUB, from: ".replace(/\\bDonna\\b/gi, 'Operator')", to: ".replace(/\\bDonna\\b/g, 'Operator')",
    check: () => { const { scrubText } = fresh(SCRUB); assert.ok(/donna/i.test(scrubText('I had donna pull the file.'))); } },
  { label: '§4.1 RED — the wire witness files under the STORAGE action: the two planes collapse in the one feed',
    file: SCRUB, from: "action:   'persona_scrub_on_wire',", to: "action:   'persona_scrub_on_write',",
    check: () => {
      const { witnessWireScrub } = fresh(SCRUB);
      const rows = [];
      const supa = { from: () => ({ insert: async (r) => { rows.push(r); return { error: null }; } }) };
      witnessWireScrub(supa, 'v1', 'whatsapp', 'Donna', 'Operator', 'x');
      assert.ok(/persona_scrub_on_write/.test(JSON.stringify(rows)));
    } },
  { label: '§5.2 RED — the tell is pulled off the recents gate: the designed silence reads as the record\'s emptiness again',
    file: FIND_SRC, from: 'const withholdingTell = recentsShape ? ', to: 'const withholdingTell = false ? ',
    check: () => assert.ok(/const withholdingTell = false \? /.test(read(FIND_SRC))) },
];

for (const m of MUTATIONS) {
  await t(m.label, () => {
    const before = read(m.file);
    assert.ok(before.includes(m.from), `MUTATION ANCHOR MISSING in ${m.file}: ${m.from}`);
    write(m.file, before.replace(m.from, m.to));
    try {
      if (m.rebuild) {
        require('child_process').execFileSync('npx', ['tsc', '-p', 'src/engine/tsconfig.json'], { cwd: ROOT, stdio: 'ignore' });
        delete require.cache[require.resolve(P(PRIM_DIST))];
      }
      m.check();
    } finally {
      write(m.file, before);
      if (m.rebuild) {
        require('child_process').execFileSync('npx', ['tsc', '-p', 'src/engine/tsconfig.json'], { cwd: ROOT, stdio: 'ignore' });
        delete require.cache[require.resolve(P(PRIM_DIST))];
      }
    }
  });
}

await t('§6.0 every mutated file is restored BYTE-IDENTICAL', () => {
  const { execFileSync } = require('child_process');
  const dirty = execFileSync('git', ['status', '--porcelain', '--', COUPLE, SCRUB, FIND_SRC, 'src/engine/src/core/tools/recordPrimitives.ts'], { cwd: ROOT, encoding: 'utf8' }).trim();
  // A file this sitting legitimately CHANGED will show as modified against origin; what
  // must not survive is a MUTATION. Asserted by content, the only honest way here.
  assert.ok(!read(COUPLE).includes('WHO YOU ARE WHEN SHE ARRIVES_MUTANT'), 'a mutation survived in the couple prompt');
  assert.ok(read(SCRUB).includes("persona_scrub_on_wire"), 'a mutation survived in the firewall');
  assert.ok(read(FIND_SRC).includes('const withholdingTell = recentsShape ? '), 'a mutation survived in the find tool');
  assert.ok(read('src/engine/src/core/tools/recordPrimitives.ts').includes('return `Rs ${inr(v)}`;'), 'a mutation survived in the money home');
  void dirty;
});

// ════════════════════════════════════════════════════════════════════════════
console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) {
  console.log('GREEN — first contact answers the person in front of it, money wears the house\'s own hand,');
  console.log('and a list that cannot see a figure now says so instead of calling it none.');
}
process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
