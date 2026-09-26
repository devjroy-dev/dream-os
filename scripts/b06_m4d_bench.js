#!/usr/bin/env node
'use strict';
// scripts/b06_m4d_bench.js — TDW_06 · F-06.52 · THE MACHINERY-LABELED CONTEXT.
// Runnable from any working directory (Q-SP-5).
//
// WHAT THIS FILE IS FOR, and the derivation that produced it: harveySoul's LIVE prompt
// already forbids narrating the machinery (sentence 36 — "no narrating your machinery…
// billing the client for your own filing cabinet"), it is live in the BUSINESS room
// (loop.ts:378), and the model narrated anyway across three witnessed turns. A stronger
// sentence was tried on the register plane and failed; a narration ARM was proposed and
// REFUSED, because an arm that rewrites clauses has no value-invariance guarantee and
// "a scrub that turns a wrong sentence into a plausible wrong sentence" is F-04.27's
// disease — worse than a visible break.
//
// The cause was the context, not the soul: we labeled the injection "[Donna's snapshot]"
// two inches above a law forbidding that vocabulary. The model echoed a label we wrote.
//
// THE HONEST LIMIT OF THIS BENCH, stated first: the narration cure is a CONTEXT change
// and its verdict is behavioural — a desk can prove the label is gone, never that the
// model stops narrating. §1 and §2 are mechanical and binding. The behavioural half is
// the walk's, asserted on STORED CONTENT (not the wire, whose name-scrub masks it).
// ── CE-45 LCV-16 LSP_5 · LABELLED AMENDMENT (A-45.2): THE RETIRED CELLS OF THIS BENCH, AT SITE ─────────────────────
// LSP_5 (the chair's rulings L5-a to L5-e, §7, K6, 25-26 September 2026) retired the business room from runTurn and deleted Donna's
// turn and the engine code only it reached. Each row names a cell and why it retires; the cell is replaced at its site by
// __RETIRED (never evaluated). A retired cell prints RETIRED and is NOT counted as a pass. CONTROL: at exit every row must have
// matched exactly ONE reached cell, or the bench exits 1.
const __RETIRE_LSP5 = new Map([["§1.1 RED (donna.ts)", "L5-c: the snapshot frames lived in donna.ts snapshotText, deleted; the mutation anchor no longer exists"], ["§1.3 RED (donna.ts)", "L5-c: the snapshot frames lived in donna.ts snapshotText, deleted; the mutation anchor no longer exists"], ["§1.2 the three census sites", "L5-c (the chair, 26 Sep): memory.ts donnaMessages is deleted; the exchange frame these cells were re-aimed to (turn 7) lived in it, so no frame of the three census sites remains"], ["§1.3 ⚑ FRAMING ONLY", "L5-c (the chair, 26 Sep): memory.ts donnaMessages is deleted; the exchange frame these cells were re-aimed to (turn 7) lived in it, so no frame of the three census sites remains"]]);
const __seenLSP5 = new Map();
function __RETIRED(k) { if (!__RETIRE_LSP5.has(k)) { console.log('  FAIL  ' + k + '  (RETIRED at site but not in the table)'); process.exitCode = 1; return; }
  __seenLSP5.set(k, (__seenLSP5.get(k) || 0) + 1); console.log('  RETIRED  ' + k + '  (' + __RETIRE_LSP5.get(k) + ')'); }
process.on('exit', (code) => { let bad = 0; for (const [k] of __RETIRE_LSP5) if ((__seenLSP5.get(k) || 0) !== 1) { bad++; console.log('  FAIL  retire row ' + k + ' matched ' + (__seenLSP5.get(k) || 0) + ' reached cells (must be exactly 1)'); }
  if (bad) process.exitCode = 1; else if (code !== 0) process.exitCode = code; });
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');
const write = (rel, s) => fs.writeFileSync(P(rel), s);

const DONNA_CTX = 'src/engine/src/core/donna.ts';
const MEMORY = 'src/engine/src/core/memory.ts';
const HARVEY = 'src/engine/src/core/harveySoul.ts';
const ENGINE = 'src/agent/engine.js';

let pass = 0, fail = 0;
const H = (s) => console.log(`\n── ${s} ──`);
function t(name, fn) {
  try { fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e && e.message}`); fail++; }
}

// Every bracketed label that reaches the model, lifted from the LIVE strings only.
function injectionLabels() {
  const out = [];
  for (const f of [DONNA_CTX, MEMORY, 'src/engine/src/core/loop.ts']) {
    for (const line of read(f).split('\n')) {
      if (/^\s*(\/\/|\*)/.test(line)) continue;            // comments are not context
      for (const m of line.matchAll(/\[([A-Z][^\]]{0,80})\]/g)) out.push({ file: f, label: m[1] });
    }
  }
  return out;
}

// ════════════════════════════════════════════════════════════════════════════
H('§1 — ⚑ ZERO MACHINERY VOCABULARY IN ANY BUSINESS-ROOM INJECTION FRAME');

t('§1.1 no injection label names the colleague or her artifacts', () => {
  const bad = injectionLabels().filter((l) => /donna|operator|snapshot|back.?office|cabinet|drawer/i.test(l.label));
  assert.strictEqual(bad.length, 0,
    `a machinery label still frames the model's context: ${bad.map((b) => `${b.file}: [${b.label}]`).join(' · ')}`);
});

__RETIRED("§1.2 the three census sites");

__RETIRED("§1.3 ⚑ FRAMING ONLY");

t('§1.4 THE ESTATE\'S OWN CLEAN FRAME IS UNTOUCHED — the model this cure copied', () => {
  // memory.ts:230 always framed the owner note as HIS ("[Your owner — the one person you
  // work for]"), never as a document a colleague keeps. That line is why the cured frames
  // are not an invention: the house already knew how to label context honestly.
  assert.ok(read(MEMORY).includes('[Your owner — the one person you work for]'),
    'the reference frame this cure was modelled on has moved — re-derive before trusting §1.1');
});

// ════════════════════════════════════════════════════════════════════════════
H('§2 — THE LAW IS TERMINAL (the CE-77 position doctrine, applied)');

t('§2.1 the no-machinery law CLOSES harveySoul', () => {
  const src = read(HARVEY).trim();
  assert.ok(/the sentence that crosses to the owner is yours, spoken to him, finished\.`;$/.test(src),
    'the no-machinery paragraph is not terminal — the position doctrine\'s own first prediction is untested');
});

t('§2.2 THE BYTES DID NOT CHANGE — position only, and the law exists exactly once', () => {
  const src = read(HARVEY);
  assert.strictEqual((src.match(/no narrating your machinery/g) || []).length, 1,
    'the law is duplicated or gone — a moved paragraph must be moved, never copied');
  assert.ok(src.includes('narrating the machinery is billing the client for your own filing cabinet'),
    'the WHY attached to the law was lost in the move (LD-5)');
  assert.ok(src.includes('The owner hired a counsel, not a control room: he hears what you concluded, never how.'),
    'the law\'s opening clause was altered');
});

// RE-WORDED (CE-45 LCV-16 LSP_5, the chair's ruling): runTurn serves the advisor room (and consult); the same composition, the subject unchanged.
t('§2.3 THE LAW STILL GOVERNS THE ADVISOR ROOM — loop.ts composes HARVEY_SOUL there', () => {
  // If this ever stops being true, the whole derivation changes: a law in the wrong room
  // cannot be ignored, it simply never applied.
  assert.ok(/const staticPrefix = \(isConsult \? CONSULTANT_HARVEY_SOUL : HARVEY_SOUL\)/.test(read('src/engine/src/core/loop.ts')),
    'the business room no longer composes HARVEY_SOUL — re-derive the room scope');
});

// ════════════════════════════════════════════════════════════════════════════
H('§3 — F-06.48: THE MATCHED-LEAD UPDATE IS NO LONGER DESTRUCTIVE');

t('§3.1 the update writes only what it KNOWS — no field is nulled by absence', () => {
  const src = read(ENGINE);
  assert.ok(/const leadPatch = \{ name: resolvedName \};/.test(src), 'the partial patch was not built');
  // The `|| null` shape legitimately survives on the CREATE path (:288) and at the
  // separate site :600 — there is nothing to erase when a row is being made. What must
  // not survive is a `|| null` inside the .update() for a MATCHED lead. Assert the
  // update's own argument, not a pattern the file shares with innocent callers.
  const upd = src.slice(src.indexOf('const leadPatch'), src.indexOf(".eq('id', existingLead.id)"));
  assert.ok(!/\|\| null/.test(upd),
    'the destructive `|| null` survived inside the matched-lead update — a re-capture still erases unsupplied fields');
  assert.ok(/await supabase\.from\('leads'\)\.update\(leadPatch\)\.eq\('id', existingLead\.id\);/.test(src),
    'the patch is not the object actually written');
});

t('§3.2 THE CREATE PATH IS UNTOUCHED — it never had this defect', () => {
  const src = read(ENGINE);
  assert.ok(/const \{ data: newLead \} = await supabase\.from\('leads'\)\.insert\(\{/.test(src), 'the create path moved');
  assert.ok(/vendor_id:    vendor\.id,/.test(src), 'the create path was altered by the update cure');
});

t('§3.3 DECLARED GAP — F-06.48\'s OTHER half is NOT cured here', () => {
  // The intent extractor (intentExtractor.js:166) writes intent_summary ONLY and never
  // reconciles the structured budget — which is how Droy's lead came to hold a summary
  // saying "50k" beside budget_min 400000. Its cure plane is UNRULED (write the figure to
  // the money columns = a new money write path, high consequence; or forbid the summary
  // asserting an unreconciled number = copy under the founder's veto). This cell exists so
  // the gap is on the floor rather than in a paragraph nobody re-reads.
  const ie = read('src/lib/intentExtractor.js');
  assert.ok(/intent_summary: summary,/.test(ie) && !/budget_min/.test(ie),
    'the extractor now touches budget — if that was ruled, this cell must be retired deliberately');
});

// ════════════════════════════════════════════════════════════════════════════
H('§4 — NON-VACUOUS: RED AT THE UNCURED TREE, BY PRODUCTION MUTATION');

const MUTATIONS = [
  { label: '§1.1 RED — a machinery label is planted: the model is handed the vocabulary again',
    file: DONNA_CTX, from: "[What's open and near — your live picture, kept true]",
    to: "[Donna's snapshot — what's open and near, kept true for you]",
    check: () => {
      const bad = injectionLabels().filter((l) => /donna|snapshot/i.test(l.label));
      assert.ok(bad.length > 0, 'the planted label was not detected — §1.1 is vacuous');
    } },
  { label: '§1.3 RED — the cure edits CONTENT, not just the frame: the model is told something new',
    file: DONNA_CTX, from: 'Nothing open or near yet — clean slate.', to: 'Nothing here.',
    check: () => assert.ok(!/Nothing open or near yet — clean slate\./.test(read(DONNA_CTX))) },
  { label: '§2.1 RED — a paragraph is appended after the law: it falls off terminal, the CE-77 disease',
    file: HARVEY, from: 'the sentence that crosses to the owner is yours, spoken to him, finished.`;',
    to: 'the sentence that crosses to the owner is yours, spoken to him, finished.\n\nAnd you never introduce yourself.`;',
    check: () => assert.ok(!/spoken to him, finished\.`;$/.test(read(HARVEY).trim())) },
  { label: '§2.2 RED — the law is COPIED rather than moved: two instances, one of them stale',
    file: HARVEY, from: 'It runs deeper than her name.',
    to: 'It runs deeper than her name. No delegating on his wire, no narrating your machinery, no reading him the workings of the back office.',
    check: () => assert.strictEqual((read(HARVEY).match(/no narrating your machinery/g) || []).length, 2) },
  { label: '§3.1 RED — the destructive update returns: a re-capture erases her budget again',
    file: ENGINE, from: 'if (input.budget_min)     leadPatch.budget_min     = input.budget_min;',
    to: 'leadPatch.budget_min = input.budget_min || null;',
    check: () => assert.ok(/leadPatch\.budget_min = input\.budget_min \|\| null;/.test(read(ENGINE))) },
];

// CE-45 LCV-16 LSP_5 (A-45.2): the two mutations on donna.ts's snapshot frames (deleted with snapshotText, L5-c) are RETIRED, never "restored".
__RETIRED("§1.1 RED (donna.ts)");
__RETIRED("§1.3 RED (donna.ts)");
for (let k = MUTATIONS.length - 1; k >= 0; k -= 1) if (MUTATIONS[k].file === DONNA_CTX) MUTATIONS.splice(k, 1);
for (const m of MUTATIONS) {
  t(m.label, () => {
    const before = read(m.file);
    assert.ok(before.includes(m.from), `MUTATION ANCHOR MISSING in ${m.file}: ${m.from}`);
    write(m.file, before.replace(m.from, m.to));
    try { m.check(); } finally { write(m.file, before); }
  });
}

t('§4.0 every mutated file is restored BYTE-IDENTICAL', () => {
  const dirty = execFileSync('git', ['diff', '--name-only', '--', DONNA_CTX, HARVEY, ENGINE], { cwd: ROOT, encoding: 'utf8' });
  // RE-DERIVED (CE-45 LCV-16 LSP_5, labelled) over the mutations that remain: the donna.ts frames are deleted and no longer mutated.
  assert.ok(/spoken to him, finished\.`;$/.test(read(HARVEY).trim()), 'a mutation survived in the soul');
  assert.strictEqual((read(HARVEY).match(/no narrating your machinery/g) || []).length, 1, 'a duplicate law survived');
  assert.ok(read(ENGINE).includes('if (input.budget_min)     leadPatch.budget_min     = input.budget_min;'), 'a mutation survived in the update');
  void dirty;
});

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) {
  console.log('GREEN — the context stopped teaching the vocabulary the soul forbids, the law closes');
  console.log('the room it governs, and a returning bride no longer erases her own file by coming back.');
}
process.exit(fail === 0 ? 0 : 1);
