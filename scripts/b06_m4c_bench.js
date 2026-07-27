#!/usr/bin/env node
'use strict';
// scripts/b06_m4c_bench.js — TDW_06 · CE-77 · THE REVERT, POSITION MADE MECHANICAL.
// Runnable from any working directory (Q-SP-5).
//
// THE DOCTRINE THIS FILE EXISTS TO MAKE A FLOOR (CE-77 correction №12):
//   POSITION INSIDE A SOUL PARAGRAPH IS PART OF THE INSTRUCTION.
// M-4's veto read checked what every byte SAID and never where it SAT. Three register
// sentences were approved on their content and each displaced a terminal clause:
// harveySoul's voice run was SPLIT, advisorLens's "never the machinery of how you would
// have known it" was pushed off-terminal, donnaSoul's own closing line was displaced.
// The wire proved it at 12:28-12:29 on 27 Jul — "Let me pull the fresh leads from Donna's
// snapshot" (witnessed on the columns via persona_scrub_on_wire).
//
// A doctrine that lives only in a ruling gets re-broken by the next sitting. So this bench
// asserts POSITION as a mechanical property: the closing clause of each guarded paragraph
// must BE the closing clause. Any future append that pushes it off-terminal REDs here
// before it reaches a wire.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');
const write = (rel, s) => fs.writeFileSync(P(rel), s);

const HARVEY = 'src/engine/src/core/harveySoul.ts';
const DONNA = 'src/engine/src/core/donnaSoul.ts';
const LENS = 'src/engine/src/core/advisorLens.ts';
const COUPLE = 'src/agent/coupleSystemPrompt.js';
const FIND = 'src/engine/src/core/tools/donnaFind.ts';
const SCRUB = 'src/lib/vendor/scrub.js';
const EVENTWRITE = 'src/lib/vendor/eventWrite.js';

// The bytes the revert must land on — read from git, never retyped. A revert asserted
// against a hand-typed expectation proves the typist, not the revert.
const PRE_M4 = 'daacf4f^';
const gitShow = (rev, rel) => execFileSync('git', ['show', `${rev}:${rel}`], { cwd: ROOT, encoding: 'utf8' });

let pass = 0, fail = 0;
const H = (s) => console.log(`\n── ${s} ──`);
function t(name, fn) {
  try { fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e && e.message}`); fail++; }
}
function fresh(rel) { const f = P(rel); delete require.cache[require.resolve(f)]; return require(f); }

// The last non-empty line of the soul's template literal body — its closing clause.
function closingClause(src) {
  const lines = src.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/[a-z]/.test(lines[i]) && !lines[i].startsWith('//')) return lines[i];
  }
  return '';
}

// ════════════════════════════════════════════════════════════════════════════
H('§1 — THE REVERT LANDED ON THE EXACT PRE-M-4 BYTES');

for (const [label, f] of [['V-1 harveySoul', HARVEY], ['V-2 donnaSoul', DONNA], ['V-3 advisorLens', LENS]]) {
  t(`§1.${f === HARVEY ? 1 : f === DONNA ? 2 : 3} ${label} is BYTE-IDENTICAL to ${PRE_M4}`, () => {
    assert.strictEqual(read(f), gitShow(PRE_M4, f),
      `${f} does not match its pre-M-4 bytes — the revert is partial, and a partial revert of a soul is a third version nobody ruled`);
  });
}

// ════════════════════════════════════════════════════════════════════════════
H('§2 — ⚑ POSITION IS NOW A MECHANICAL PROPERTY (the CE-77 doctrine as a floor)');

t('§2.1 advisorLens — "never the machinery of how you would have known it" governs its paragraph again', () => {
  const src = read(LENS);
  // The clause must not merely EXIST — it must CLOSE its paragraph. That is the whole
  // finding: V-3 kept the clause and moved it, and the voice regressed anyway.
  const para = src.split('\n\n').find((p) => p.includes('never the machinery of how you would have known it'));
  assert.ok(para, 'the machinery clause is gone entirely');
  assert.ok(/never the machinery of how you would have known it\.\s*$/.test(para.trim()),
    'the machinery clause is no longer TERMINAL in its paragraph — the CE-77 regression, restored');
});

t('§2.2 donnaSoul — "You make him right. He does the rest." closes the soul again', () => {
  assert.ok(/You make him right\. He does the rest\.`;\s*$/.test(read(DONNA).trim()),
    'donnaSoul no longer closes on its own purpose line — V-2\'s displacement, restored');
});

t('§2.3 harveySoul — the VOICE RUN is contiguous again, unsplit', () => {
  const src = read(HARVEY);
  assert.ok(/never the symbol\. Plain Indian English\./.test(src),
    'the voice run is still split by a money digression — V-1\'s displacement, restored');
  assert.ok(/Every reply is simply the next line in an ongoing relationship\.`;/.test(src),
    'harveySoul no longer closes on the relationship line');
});

t('§2.4 ⚑ coupleSystemPrompt — CAPTURE is LIST-TERMINAL again (V-4 repositioned, not reverted)', () => {
  // V-4 STAYS: the bride-facing reply ships raw (vendorInbound :572/:682/:817/:955), so the
  // arm does NOT cover this plane and rule 12 is the bride lane's only register guarantee.
  // But it had displaced the capture rule — the chair's own non-negotiable — from terminal.
  // Reposition, don't revert: one byte moves, nothing is deleted.
  const p = fresh(COUPLE).buildCoupleSystemPrompt({
    vendor: { category: 'photography', city: 'Delhi' }, vendorUser: { name: 'Swati' }, isReturningBride: false,
  });
  const rules = p.split('HARD RULES')[1].split('FLOW')[0].trim().split('\n').filter((l) => /^\d+\./.test(l));
  assert.ok(/STILL call capture_couple_lead/.test(rules[rules.length - 1]),
    `the capture rule is not list-terminal — last rule is: ${rules[rules.length - 1].slice(0, 80)}`);
  assert.ok(/Rs 5,00,000/.test(p), 'the bride lane lost its register instruction — the plane the arm cannot reach');
});

t('§2.5 THE PLANE GAP IS REAL — the bride reply is unscrubbed, which is why V-4 earns its keep (F-06.51)', () => {
  const door = read('src/lib/vendorInbound.js');
  const rawSends = (door.match(/sendWhatsApp\(phone, result\.reply\)/g) || []).length;
  assert.ok(rawSends >= 4,
    `the bride-facing sends are no longer raw (${rawSends}) — if the arm now reaches this plane, F-06.51 changed and V-4's justification must be re-derived`);
});

// ════════════════════════════════════════════════════════════════════════════
H('§3 — F-06.49: THE RENDERER SEES budget_min');

t('§3.1 budget_min IS SELECTED — it appeared ZERO times before this cure', () => {
  const src = read(FIND);
  assert.ok(/\.select\('id, name, phone, state, budget_min, budget_max/.test(src), 'budget_min is not selected');
  assert.ok(/budget_min: number \| null/.test(src), 'budget_min is not on the typed plane');
});

t('§3.2 A budget_min-ONLY LEAD NO LONGER READS BUDGET-LESS — Droy\'s 7e3bd732, the specimen', () => {
  const src = read(FIND);
  assert.ok(/budget from \$\{rs\(lo\)\}/.test(src),
    'a floor-only lead still renders no budget — the exact shape that produced the false "no budgeted enquiries on file yet"');
});

t('§3.3 THE RANGE RENDERS HONESTLY — floor, ceiling, both, and equal', () => {
  const src = read(FIND);
  assert.ok(/lo === hi \? `budget \$\{rs\(lo\)\}`/.test(src), 'an equal range renders as a range instead of a figure');
  assert.ok(/budget up to \$\{rs\(hi as number\)\}/.test(src), 'a ceiling-only lead lost its rendering');
});

t('§3.4 AND IT WEARS THE HOUSE REGISTER — the F-06.49 cure did not reintroduce raw digits', () => {
  const src = read(FIND);
  const block = src.slice(src.indexOf('F-06.49'), src.indexOf('F-06.49') + 1400);
  assert.ok(!/\$\{l\.budget_(min|max)\}/.test(block), 'a raw budget digit string rides the payload again');
});

// ════════════════════════════════════════════════════════════════════════════
H('§4 — F-06.50: THE ARM\'S REACH EXTENDS TO THE STORAGE PLANE (declared, asserted)');

t('§4.1 THE WRITE PATH RE-DRESSES MONEY — declared behaviour, not a defect', () => {
  // scrubForStorage -> scrubText -> registerScrub, so event titles/notes are normalized on
  // write (eventWrite.js:540/:542). Money is normalized on WRITE, not only on the wire.
  // Declared at CE-77 R5 after riding in unannounced at M-4B — asserted here so a future
  // reader finds the behaviour on the floor rather than discovering it in a column.
  const ew = read(EVENTWRITE);
  assert.ok(/scrubForStorage\(supabase, vendorId, surface, String\(title\)/.test(ew), 'the title write path moved');
  assert.ok(/scrubForStorage\(supabase, vendorId, surface, String\(notes\)/.test(ew), 'the notes write path moved');
  const { scrubForStorage } = fresh(SCRUB);
  assert.strictEqual(scrubForStorage(null, null, 'whatsapp', 'Advance ₹50k', 'bench', 'notes'), 'Advance Rs 50,000');
});

t('§4.2 ⚑ VALUE-INVARIANT ON THE WRITE PATH TOO — storage must never re-compute a figure', () => {
  const { scrubForStorage } = fresh(SCRUB);
  const digits = (s) => Number(String(s).replace(/[^\d]/g, ''));
  for (const [input, expected] of [['₹20,000', 20000], ['Rs 4.5L', 450000], ['₹50k', 50000], ['1.2Cr', 12000000]]) {
    const out = scrubForStorage(null, null, 'whatsapp', input, 'bench', 'notes');
    assert.strictEqual(digits(out), expected, `WRITE-PATH VALUE CHANGED: ${input} -> ${out}`);
  }
});

// ════════════════════════════════════════════════════════════════════════════
H('§5 — NON-VACUOUS: RED AT THE UNCURED TREE, BY PRODUCTION MUTATION');

const MUTATIONS = [
  { label: '§2.1 RED — a sentence is appended after the machinery clause: the M-4 regression, reproduced exactly',
    file: LENS, from: 'never the machinery of how you would have known it.',
    to: 'never the machinery of how you would have known it. And any figure you speak wears the house form.',
    check: () => {
      const para = read(LENS).split('\n\n').find((p) => p.includes('never the machinery'));
      assert.ok(!/never the machinery of how you would have known it\.\s*$/.test(para.trim()));
    } },
  { label: '§2.2 RED — donnaSoul gains a closing paragraph: her purpose line displaced again',
    file: DONNA, from: 'You make him right. He does the rest.`;',
    to: 'You make him right. He does the rest.\n\nAnd a figure you hand him wears this house\'s form.`;',
    check: () => assert.ok(!/He does the rest\.`;\s*$/.test(read(DONNA).trim())) },
  { label: '§2.4 RED — the register rule moves back below capture: the non-negotiable falls off list-terminal',
    file: COUPLE,
    // Swap the two rules back to their M-4 order — the exact displacement CE-77 ruled out.
    fromRe: /(11\. Any rupee figure[\s\S]*?\n)(12\. If she clearly wants to stop[\s\S]*?vanish\.)/,
    toFn: (src) => { const L = src.split('\n'); const i = L.findIndex((l) => l.startsWith('11. Any rupee')); const j = L.findIndex((l) => l.startsWith('12. If she clearly')); const a = L[i].replace('11.', '12.'); const b = L[j].replace('12.', '11.'); L[i] = b; L[j] = a; return L.join('\n'); },
    check: () => {
      const p = fresh(COUPLE).buildCoupleSystemPrompt({ vendor: { category: 'photography', city: 'Delhi' }, vendorUser: { name: 'Swati' }, isReturningBride: false });
      const rules = p.split('HARD RULES')[1].split('FLOW')[0].trim().split('\n').filter((l) => /^\d+\./.test(l));
      assert.ok(!/STILL call capture_couple_lead/.test(rules[rules.length - 1]));
    } },
  { label: '§3.2 RED — budget_min is dropped from the render: the false absence returns',
    file: FIND, from: 'if (l.budget_min != null || l.budget_max != null) {', to: 'if (l.budget_max != null) {',
    check: () => assert.ok(!/if \(l\.budget_min != null \|\| l\.budget_max != null\)/.test(read(FIND))) },
  { label: '§4.2 RED — the write path re-computes: storage lies about a figure',
    file: SCRUB, from: '  k: 1e3, thousand: 1e3,', to: '  k: 1e4, thousand: 1e4,',
    check: () => {
      const { scrubForStorage } = fresh(SCRUB);
      assert.strictEqual(scrubForStorage(null, null, 'whatsapp', '₹50k', 'bench', 'notes'), 'Rs 5,00,000');
    } },
];

for (const m of MUTATIONS) {
  t(m.label, () => {
    const before = read(m.file);
    let mutated;
    if (m.toFn) {
      mutated = m.toFn(before);
      assert.notStrictEqual(mutated, before, 'the mutation changed nothing — a vacuous RED');
    } else {
      assert.ok(before.includes(m.from), `MUTATION ANCHOR MISSING in ${m.file}: ${m.from}`);
      mutated = before.replace(m.from, m.to);
    }
    write(m.file, mutated);
    try { m.check(); } finally { write(m.file, before); }
  });
}

t('§5.0 every mutated file is restored BYTE-IDENTICAL', () => {
  for (const f of [LENS, DONNA, HARVEY]) {
    assert.strictEqual(read(f), gitShow(PRE_M4, f), `a mutation survived in ${f}`);
  }
  assert.ok(read(COUPLE).includes('11. Any rupee figure you write'), 'a mutation survived in the couple prompt');
  assert.ok(read(FIND).includes('if (l.budget_min != null || l.budget_max != null) {'), 'a mutation survived in the renderer');
  assert.ok(read(SCRUB).includes('  k: 1e3, thousand: 1e3,'), 'a mutation survived in the scale table');
});

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) {
  console.log('GREEN — the voice has its closing clauses back, position is a floor and not a hope,');
  console.log('and a lead with a floor and no ceiling no longer reads as a lead with no budget.');
}
process.exit(fail === 0 ? 0 : 1);
