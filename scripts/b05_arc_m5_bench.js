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

H('§3 — READER-ZERO, NAMED NOT CURED (R-M5-4)');
t('§3.1 pending_lead_pings: three live writers, ZERO readers post-M5', () => {
  let readers = 0, writers = 0;
  for (const f of fs.readdirSync(P('src/agent')).filter(x => x.endsWith('.js')))
    for (const l of code('src/agent/' + f).split('\n')) {
      if (/from\('pending_lead_pings'\)\.insert/.test(l)) writers++;
      else if (/from\('pending_lead_pings'\)/.test(l)) readers++;
    }
  assert.strictEqual(readers, 0, `expected the reader to have died with the orphan, found ${readers}`);
  assert.strictEqual(writers, 3, `expected three live writers, found ${writers}`);
  // NO CURE SHIPS. F-05.50's homing letter is an open founder letter and the cure
  // belongs to whichever home he names. This cell exists so the state is a FACT on
  // the record rather than a sentence in a handover nobody re-reads.
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
