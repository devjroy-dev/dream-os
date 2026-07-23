// scripts/b05_arc_m5_bench.js — TDW_05 COUPLE-LANE ARC, MOVEMENT M5 (C6 / F-05.44).
//   node scripts/b05_arc_m5_bench.js      (runnable from any cwd — Q-SP-5)
// Deletions-pure. The trio: pre-delete grep-positive (in the handover) · post-delete
// grep-zero (§1) · floor at the smaller world (the floor run, disclosed).
'use strict';
const assert = require('assert');
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
const code = (r) => read(r).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
let pass=0, fail=0;
const t=(n,f)=>{try{f();console.log(`  ok   ${n}`);pass++;}catch(e){console.log(`  FAIL ${n}\n       ${e.message}`);fail++;}};
const H=(s)=>console.log(`\n${s}`);

H('§1 — THE TRIO, LEG 2: POST-DELETE GREP-ZERO');
t('§1.1 runAgenticTurn is gone from every executable line in src/**', () => {
  const hits = [];
  for (const f of ['src/agent/engine.js','src/agent/brideEngine.js','src/agent/classifier.js','src/lib/vendorInbound.js','src/index.js','src/brideIndex.js'])
    for (const l of code(f).split('\n'))
      if (/\brunAgenticTurn\b/.test(l)) hits.push(`${f}: ${l.trim()}`);
  assert.deepStrictEqual(hits, [], 'the orphan survived somewhere executable');
});
t('§1.2 the ask-gate went WITH it — the survivor lived inside the corpse', () => {
  const e = code('src/agent/engine.js');
  assert.ok(!/ambiguity === 'ambiguous'/.test(e), 'the gate survived its own function');
  assert.ok(!/Is this a lead to log, a note to save/.test(e), 'and so did its line');
});
t('§1.3 ZERO callers of EITHER classifier export anywhere in src/**', () => {
  const hits = [];
  for (const f of fs.readdirSync(P('src/agent')).filter(x => x.endsWith('.js') && x !== 'classifier.js'))
    for (const l of code('src/agent/' + f).split('\n'))
      if (/classifyMessage\(|classifyVendorMessage\(/.test(l)) hits.push(`${f}: ${l.trim()}`);
  assert.deepStrictEqual(hits, [], 'a classifier call survived');
});
t('§1.4 the dead requires died with their calls', () => {
  assert.ok(!/require\('\.\/classifier'\)/.test(code('src/agent/engine.js')), 'engine.js:13');
  assert.ok(!/require\('\.\/classifier'\)/.test(code('src/agent/brideEngine.js')), 'brideEngine.js:36');
});
t('§1.5 the export shrank to its one survivor', () => {
  assert.ok(/module\.exports = \{ runCoupleAgenticTurn \};/.test(code('src/agent/engine.js')),
    'the export must not name a function that no longer exists');
});

H('§2 — THE DEFUSED ISLAND (R-M5-3: shape (b), widened to the file)');
t('§2.1 classifier.js SURVIVES INTACT — both exports, both bodies', () => {
  const c = require(P('src/agent/classifier.js'));
  assert.strictEqual(typeof c.classifyMessage, 'function');
  assert.strictEqual(typeof c.classifyVendorMessage, 'function');
});
t('§2.2 *** the ambiguity limb is preserved — the only home that logic has ***', () => {
  assert.ok(/ambiguous/.test(read('src/agent/classifier.js')),
    'the limb the charter protected by name must still exist to be revived');
});
t('§2.3 the island DECLARES itself, with its revival pointer', () => {
  const h = read('src/agent/classifier.js').slice(0, 1400);
  assert.ok(/ZERO CALLERS SINCE ARC M5/.test(h), 'a zero-caller file that does not say so is a trap');
  assert.ok(/REVIVAL POINTER/.test(h), 'and the next reader needs the pointer');
});

// ── LABELED AMENDMENT, F-05.50(b) / CE-68 R4 · COUNT PRESERVED (1 cell, 11 total) ──
// TWO WORDS IN THE ORIGINAL LABEL WERE DOING WORK THE ASSERTION DID NOT DO, and both
// are corrected here rather than left to mislead the next reader:
//   1. "three LIVE writers" — this cell counts TEXTUAL occurrences in src/agent/*.js.
//      One of the three (engine.js's create_lead hand, inside `executeTool`) has been
//      DEAD since M5 orphaned it: F-05.56, filed and labeled in engine.js this ZIP.
//      Two writers can still fire, both inside runCoupleAgenticTurn.
//   2. "ZERO readers" — still TRUE, and it must be read with its SWEEP WORLD named.
//      This loop reads src/agent/*.js and nothing else. The drain F-05.50(b) shipped
//      lives at src/lib/vendor/leadPings.js — OUTSIDE that world by design, because
//      the read is a DOOR concern (the engine's client cannot see the public plane).
//      So the zero below is honest about src/agent and would be a LIE about the
//      estate; §3.1b asserts where the real reader is, in this same cell, so the two
//      facts can never again be read apart.
H('§3 — READER-ZERO IN src/agent, NAMED AT M5 · THE READER SHIPPED AT F-05.50(b) (R-M5-4, amended)');
t('§3.1 pending_lead_pings: three TEXTUAL writers in src/agent (one DEAD, F-05.56), ZERO readers in THIS sweep world — the drain lives at src/lib/vendor/leadPings.js', () => {
  let readers = 0, writers = 0;
  for (const f of fs.readdirSync(P('src/agent')).filter(x => x.endsWith('.js')))
    for (const l of code('src/agent/' + f).split('\n')) {
      if (/from\('pending_lead_pings'\)\.insert/.test(l)) writers++;
      else if (/from\('pending_lead_pings'\)/.test(l)) readers++;
    }
  assert.strictEqual(readers, 0, `src/agent still holds a reader — the drain's home is lib/vendor, found ${readers}`);
  assert.strictEqual(writers, 3, `expected three textual writers, found ${writers}`);
  // §3.1b — THE REFERENT, ASSERTED NOT NARRATED (§4.1's own lesson, arc M5 §8).
  // A "zero" whose scope lives only in a comment is one refactor away from a lie.
  const drain = 'src/lib/vendor/leadPings.js';
  assert.ok(fs.existsSync(P(drain)), `the zero above is only honest because the reader lives at ${drain} — and it does not`);
  const d = code(drain);
  assert.ok(/from\('pending_lead_pings'\)/.test(d), 'the drain must actually read the table it drains');
  assert.ok(/acknowledged_at/.test(d), 'and stamp it (R2/L1) — surfacing is draining');
});

H('§4 — W-1 AND PURITY');
t('§4.1 zero soul/prompt bytes', () => {
  const { execSync } = require('child_process');
  const out = execSync('git diff --name-only 8560ca0', { cwd: ROOT }).toString();
  for (const f of ['miraSoul','brideSystemPrompt','circleSystemPrompt','coupleSystemPrompt','brideTools','brideOnboarding'])
    assert.ok(!out.includes(f), `W-1 BREACH: ${f}`);
});
t('§4.2 deletions-pure, with its ONE disclosed exception', () => {
  // classifier.js gains a header and NOTHING else — R-M5-3's sole non-deletion delta.
  const { execSync } = require('child_process');
  const d = execSync('git diff --numstat 8560ca0 -- src/agent/classifier.js', { cwd: ROOT }).toString().trim();
  const [added, removed] = d ? d.split(/\s+/).map(Number) : [0, 0];
  assert.strictEqual(removed, 0, 'the island must lose NOTHING — it is kept whole by ruling');
  assert.ok(added > 0 && added < 20, `the header only, found +${added}`);
});

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) console.log('GREEN — the orphan is gone, its classifier waits whole and uncalled, and the census says so out loud.');
process.exit(fail === 0 ? 0 : 1);
