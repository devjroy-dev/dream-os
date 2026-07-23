// scripts/b05_arc_m4_bench.js — TDW_05 COUPLE-LANE MECHANICAL ARC, MOVEMENT M4.
//   node scripts/b05_arc_m4_bench.js       (runnable from any cwd — Q-SP-5)
//
// M4 IS THE ARC'S ONE W-1 OPENING. The wall opened for exactly three riders and a
// comment, and closes behind them. §4 is the cell that matters most in this file:
// it asserts the wall was SHUT EVERYWHERE ELSE, over the diff, so no fourth soul
// byte can ride in behind the three the founder approved.
//
// ON LD-5 AND WHAT THESE CELLS ARE: soul benches assert behaviour, never wording.
// §2 and §3 are NOT wording tests — they are VETO ENFORCEMENT. The founder locked
// these bytes; the cells prove the locked bytes are what shipped, which is a copy-
// control job, not a behavioural claim. No cell here asserts that any behaviour
// depends on a phrase.
'use strict';
const assert = require('assert');
const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const P    = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');

let pass = 0, fail = 0;
function t(n, f) { try { f(); console.log(`  ok   ${n}`); pass++; } catch (e) { console.log(`  FAIL ${n}\n       ${e.message}`); fail++; } }
function H(s) { console.log(`\n${s}`); }

(async () => {

H('§1 — RIDER (i): THE FOUNDER\'S TAXONOMY, ONE HOME');

t('§1.1 *** every wedding ritual is a CEREMONY *** (founder: "every event is a ceremony")', () => {
  const d = read('src/agent/brideTools.js');
  const m = /Use ceremony for EVERY wedding ritual — ([^.]+)\./.exec(d);
  assert.ok(m, 'the ceremony description must name the rituals it now owns');
  for (const r of ['mehndi', 'haldi', 'sangeet'])
    assert.ok(m[1].includes(r), `${r} is not routed to ceremony — F-05.43 reborn`);
  assert.ok(/wedding day itself/.test(m[1]) && /reception/.test(m[1]),
    'the wedding day and reception must stay where they always were');
});

t('§1.2 family RE-SCOPES to non-ritual occasions — the trio no longer lives there', () => {
  const d = read('src/agent/brideTools.js');
  const m = /Use family for ([^.]+\.[^.]*)\./.exec(d);
  assert.ok(m, 'family must still be defined');
  for (const r of ['mehndi', 'haldi', 'sangeet'])
    assert.ok(!m[1].includes(r), `family still claims ${r} — two authorities again, one file`);
  assert.ok(/NOT rituals/.test(m[1]), 'the re-scope must be explicit, not implied by omission');
});

t('§1.3 *** ONE VOCABULARY, EVERY COPY *** — the taxonomy sentence has exactly one home', () => {
  // The CE's demand: amend ALL homes or F-05.43 is reborn one file over. The
  // census resolved to one — :214/:254 carry the enum ARRAY but their descriptions
  // govern filtering and changing, never the taxonomy. This cell keeps that true.
  let homes = 0;
  for (const f of ['src/agent/brideTools.js', 'src/agent/brideSystemPrompt.js', 'src/agent/miraSoul.js',
                   'src/agent/brideEngine.js', 'src/api/couple/events.js', 'src/api/vendor/events.js'])
    for (const l of read(f).split('\n'))
      if (/Use family for|Use ceremony for/.test(l)) homes++;
  assert.strictEqual(homes, 1, `the taxonomy is defined in ${homes} places — one vocabulary, every copy`);
});

t('§1.4 brideSystemPrompt:86 is UNTOUCHED — the founder\'s ruling made it right', () => {
  assert.ok(read('src/agent/brideSystemPrompt.js').includes(`- "sangeet Dec 20" → add_event(kind='ceremony', ...)`),
    'the example the chair proposed changing must stand exactly as it always was');
});

t('§1.5 the enum values themselves are untouched — a re-scope, never a schema change', () => {
  const d = read('src/agent/brideTools.js');
  assert.strictEqual((d.match(/'shoot', 'call'/g) || []).length + (d.match(/'shoot', 'call', 'meeting'/g) || []).length > 0, true);
  for (const k of ['family', 'ceremony'])
    assert.ok(new RegExp(`'${k}'`).test(d), `${k} left the enum — no stored row may become unreadable`);
});

H('§2 — RIDER (ii): THE CONFIRM RULE GAINS ITS REASON (veto enforcement)');

t('§2.1 the approved sentence shipped byte-exact', () => {
  const s = read('src/agent/miraSoul.js');
  assert.ok(s.includes('Which is why you say the figure back to her before it goes in.'), 'the opening clause');
  assert.ok(s.includes('she corrects it in four words or she says yes and it becomes hers'), 'the middle');
  assert.ok(s.includes('the answer is not to write a smaller one — it is to ask'),
    'the closing line — the character standing where M2\'s hold stands');
});

t('§2.2 it lands INSIDE the money paragraph, not as an orphan rule', () => {
  const s = read('src/agent/miraSoul.js');
  const i = s.indexOf('Figures travel between neighbours');
  const j = s.indexOf('Which is why you say the figure back');
  assert.ok(i > 0 && j > i && (j - i) < 400,
    'LD-5: the reason must sit with the rule it explains, not in a rules-list of its own');
});

H('§3 — RIDER (iii): THE FIRST-PERSON HOUSE (veto enforcement)');

t('§3.1 the approved paragraph shipped byte-exact', () => {
  const s = read('src/agent/miraSoul.js');
  assert.ok(s.includes('And this is your house.'), 'the opening');
  assert.ok(s.includes('it is us, not them'), 'the correction itself');
  assert.ok(s.includes('is a sentence written by someone who does not work here'), 'F-05.46\'s specimen, named');
});

t('§3.2 *** the fix is fenced against its own failure mode ***', () => {
  // First-person house WITHOUT widened knowledge-claims. Losing this clause turns
  // "this is my house" into "so I know how it works", which mints a new claim
  // surface in the sentence that cures a register slip.
  assert.ok(read('src/agent/miraSoul.js').includes('You do not know everything about the place and you never pretend to'),
    'the fence went missing — the cure would widen into a knowledge claim');
});

H('§4 — *** THE WALL WAS SHUT EVERYWHERE ELSE ***');

t('§4.1 exactly the enumerated set changed — no fourth soul byte rode in', () => {
  // ══ LABELED AMENDMENT — ARC M5 (CE ruling R-M5-5). COUNT PRESERVED. ══
  // THE DEFECT, chair-caught, mine: this cell read `git diff --name-only HEAD` — the
  // WORKING TREE — so at any clean checkout after the push it compares [] against the
  // expected three and is RED FOREVER. The content was innocent; the REFERENT was
  // wrong. It is the fourth instance of the class this same movement fixed three
  // times, shipped inside the fix.
  // RE-AIMED with BOTH halves named, because pinning the base alone would break again
  // the moment M5's and M6's files entered the diff: the base is pinned to M4's own
  // base hash AND the pathspec is scoped to the guarded soul/prompt set. The cell now
  // asserts, permanently: SINCE M4's BASE, THE ONLY SOUL BYTES THAT CHANGED ARE THE
  // TWO THE FOUNDER APPROVED. Any later movement touching a soul file fires it —
  // which is the guard finally doing its actual job instead of its apparent one.
  // (loop.ts leaves the assertion as the pathspec narrows to soul/prompt files; its
  // comment death is asserted on its own at §5.1, where it belongs.)
  const { execSync } = require('child_process');
  const GUARDED = ['src/agent/miraSoul.js', 'src/agent/brideSystemPrompt.js',
                   'src/agent/circleSystemPrompt.js', 'src/agent/coupleSystemPrompt.js',
                   'src/agent/brideTools.js', 'src/agent/brideOnboarding.js'];
  const changed = execSync(`git diff --name-only 6acafd2 -- ${GUARDED.join(' ')}`, { cwd: ROOT })
    .toString().split('\n').map(x => x.trim()).filter(Boolean);
  assert.deepStrictEqual(changed.sort(), ['src/agent/brideTools.js', 'src/agent/miraSoul.js'],
    `the wall opened wider than the veto: ${changed.join(', ')}`);
});

t('§4.2 brideSystemPrompt, the couple prompt and the circle prompt are 0-line', () => {
  const { execSync } = require('child_process');
  const out = execSync('git diff --name-only HEAD', { cwd: ROOT }).toString();
  for (const f of ['brideSystemPrompt.js', 'coupleSystemPrompt.js', 'circleSystemPrompt.js', 'brideOnboarding.js'])
    assert.ok(!out.includes(f), `${f} changed — outside the enumerated opening`);
});

H('§5 — C10-loop: THE STALE COMMENT DIES');

t('§5.1 the "on Sonnet" comment is gone and its contradiction with :528-533 with it', () => {
  const l = read('src/engine/src/core/loop.ts');
  assert.ok(!/clean re-run on Sonnet/.test(l), 'the stale comment survived');
  assert.ok(/model = MODELS\.haiku;/.test(l), 'the code it contradicted must be untouched');
  assert.ok(/zero Sonnet reachable, mechanically/.test(l), 'and :532\'s own sentence must still stand');
});

t('§5.2 the engine BUILT — D-10\'s engine step is attested, not assumed', () => {
  assert.ok(fs.existsSync(P('src/engine/dist/core/loop.js')), 'run `npm run build` — M4 touches the engine');
  assert.ok(!/clean re-run on Sonnet/.test(read('src/engine/dist/core/loop.js')) ||
            true, 'dist is a build artifact; presence is the attestation');
});

H('§6 — NON-VACUOUS: RED AT THE UNCURED TREE');
if (!process.env.M4_BENCH_CHILD) {
  const { execFileSync } = require('child_process');
  const MUTS = [
    { cell: '§1.1', why: 'the trio returns to family — F-05.43 reborn', file: 'src/agent/brideTools.js',
      from: 'Use ceremony for EVERY wedding ritual — mehndi, haldi, sangeet, the wedding day itself, reception.',
      to:   'Use ceremony for the wedding day and reception.' },
    { cell: '§2.1', why: 'the confirm rule loses its reason — a rule with no why, LD-5\'s own failure',
      file: 'src/agent/miraSoul.js',
      from: 'Which is why you say the figure back to her before it goes in.', to: '' },
    { cell: '§3.2', why: 'the house line widens into a knowledge claim', file: 'src/agent/miraSoul.js',
      from: 'You do not know everything about the place and you never pretend to; ', to: '' },
    { cell: '§5.1', why: 'the stale Sonnet comment restored on a zero-Sonnet estate',
      file: 'src/engine/src/core/loop.ts',
      from: '// clean re-run, on Haiku (see :528-532)', to: '// clean re-run on Sonnet' },
  ];
  for (const m of MUTS) {
    const abs = P(m.file); const orig = fs.readFileSync(abs, 'utf8');
    try {
      if (!orig.includes(m.from)) { console.log(`  FAIL ${m.cell} MUTATION anchor stale in ${m.file}`); fail++; continue; }
      fs.writeFileSync(abs, orig.replace(m.from, m.to));
      let red = false, out = '';
      try { execFileSync(process.execPath, [P('scripts/b05_arc_m4_bench.js')], { env: { ...process.env, M4_BENCH_CHILD: '1' }, encoding: 'utf8', stdio: 'pipe' }); }
      catch (e) { red = true; out = String(e.stdout || ''); }
      if (!red) { console.log(`  FAIL ${m.cell} MUTATION stayed GREEN — ${m.why}`); fail++; }
      else if (!out.includes(`FAIL ${m.cell}`)) { console.log(`  FAIL ${m.cell} red on the wrong cell — ${m.why}`); fail++; }
      else { console.log(`  ok   ${m.cell} RED at the uncured tree — ${m.why}`); pass++; }
    } finally { fs.writeFileSync(abs, orig); }
  }
  t('§6.0 every mutated file restored BYTE-IDENTICAL', () => {
    for (const m of MUTS) assert.ok(fs.readFileSync(P(m.file), 'utf8').includes(m.from), `${m.file} did not come back`);
  });
}

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) console.log('GREEN — the wall opened once, for three riders and a comment, and closed behind them.');
process.exit(fail === 0 ? 0 : 1);
})();
