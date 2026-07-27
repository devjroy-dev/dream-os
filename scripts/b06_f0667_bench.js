#!/usr/bin/env node
'use strict';
// scripts/b06_f0667_bench.js — TDW_06 · F-06.67 · THE LENS IS TERMINAL IN THE PROMPT.
// Runnable from any working directory (Q-SP-5).
//
// THE FINDING THIS FILE MAKES A FLOOR:
//   advisorLens.ts's crux was re-authored THREE times — the F-06.4 re-author, the
//   theatre-seam addition, the delegated-look close — and each header records
//   "position (last paragraph, maximum recency) preserved". Every one of those was
//   true of the FILE. None was true of the PROMPT: `loop.ts` closed the static prefix
//   with `fieldBlock`, so the whole SMM Codex (>=95k chars, the committed census)
//   stood BETWEEN the lens and the model's most recent context.
//
//   Measured at `2c24959`, photography advisor, trade index excluded so these are FLOORS:
//     HARVEY_SOUL 31,717 + NO_MACHINERY_LAW 511 + ADVISOR_LENS 7,383 (crux 4,216)
//     + SMM header/codex >=95,536  =>  prefix >=135,147
//     crux at 35,395..39,611; >=70.7% of the prompt stood AFTER it; lens = 5.5%.
//
//   That is F-06.58's own sentence one file down — "true of the FILE and false of the
//   always-on PROMPT" — and CE-77's position doctrine (position is instruction) is what
//   makes it load-bearing rather than cosmetic.
//
// THE CURE IS AN ORDER AND NOTHING ELSE. Zero model-voiced bytes move; advisorLens.ts is
// byte-untouched and b06_m4c §1.3's byte-identity holds. So this bench must NOT assert a
// sentence — LD-5 forbids it and a grep for new prose would be the fourth fence this
// disease has walked around. It asserts POSITION, on the LIFTED production expression.
//
// WHY THE EXPRESSION IS LIFTED AND NEVER RETYPED (b06_f0658's method, inherited): a
// retyped compose expression tests the typist. This one reads loop.ts's own bytes, so a
// shape change REDs the extraction instead of quietly testing a fossil.
//
// WHY fieldBlock IS MODELLED AT CENSUS SIZE HERE: with an EMPTY fieldBlock the old order
// and the new order produce THE SAME STRING. A bench that stubbed it (as b06_f0658 did,
// '\n\n[FIELD BLOCK]') can state the order but cannot witness the disease. §3 asserts
// exactly that non-vacuity before §1's cells are allowed to mean anything.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');
const write = (rel, s) => fs.writeFileSync(P(rel), s);

const LOOP = 'src/engine/src/core/loop.ts';
const HARVEY = 'src/engine/src/core/harveySoul.ts';
const LENS = 'src/engine/src/core/advisorLens.ts';
const CONSULT = 'src/engine/src/core/consultantHarveySoul.ts';

let pass = 0, fail = 0;
const H = (s) => console.log(`\n── ${s} ──`);
function t(name, fn) {
  try { fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e && e.message}`); fail++; }
}

function body(src, name) {
  const k = `export const ${name} = \``;
  const i = src.indexOf(k);
  assert.ok(i >= 0, `${name} did not extract — re-derive before trusting any cell`);
  const a = i + k.length;
  return src.slice(a, src.indexOf('`;', a));
}

// ── THE COMPOSE HARNESS ─────────────────────────────────────────────────────
function lift(loopSrc) {
  const m = loopSrc.match(/const isPlannerVoice = ([^;]+);\s*\n\s*const staticPrefix = ([\s\S]*?);\n/);
  assert.ok(m, 'the compose expression was not found in loop.ts — RE-DERIVE before trusting any cell below');
  return { gate: m[1], prefix: m[2] };
}

// Census sizes, CE_FIELD_NOTE_2026-07-18 §3 — quoted, not invented.
const SMM_CHARS = 95253;
const FIELD_MARK = '[FIELD BLOCK — the Codex payload at census size]';
const FIELD_BLOCK = '\n\n' + FIELD_MARK + '\n' + 'x'.repeat(SMM_CHARS);

function compose({ vendorCategory, isConsult = false, isAdvisor = false, fieldBlock = FIELD_BLOCK, loopSrc = read(LOOP) }) {
  const { gate, prefix } = lift(loopSrc);
  const soulSrc = read(HARVEY);
  const HARVEY_SOUL = body(soulSrc, 'HARVEY_SOUL');
  const PRODUCTION_WEAVE = body(soulSrc, 'PRODUCTION_WEAVE');
  const NO_MACHINERY_LAW = body(soulSrc, 'NO_MACHINERY_LAW');
  const ADVISOR_LENS = body(read(LENS), 'ADVISOR_LENS');
  const CONSULTANT_HARVEY_SOUL = body(read(CONSULT), 'CONSULTANT_HARVEY_SOUL');
  assert.ok(HARVEY_SOUL && PRODUCTION_WEAVE && NO_MACHINERY_LAW && ADVISOR_LENS && CONSULTANT_HARVEY_SOUL,
    'a soul constant did not extract — re-derive');
  const args = { vendorCategory };
  // eslint-disable-next-line no-eval
  const isPlannerVoice = eval(gate);
  // eslint-disable-next-line no-eval
  return eval(prefix);
}

const LENS_BODY = body(read(LENS), 'ADVISOR_LENS');
const LENS_HEAD = LENS_BODY.trim().slice(0, 80);
const CRUX_TAIL = 'the wall between thinking and doing so that neither one is ever done badly — or worse, only pretended.';
const NON_PLANNER = ['photography', 'decor', 'jewellery', 'makeup', 'catering'];

// ════════════════════════════════════════════════════════════════════════════
H('§1 — ⚑ THE LENS CLOSES THE COMPOSED PREFIX (the cure)');

t('§1.1 ⚑ the ADVISOR prefix ENDS with the lens — planner and non-planner alike', () => {
  for (const c of ['planning', ...NON_PLANNER]) {
    const p = compose({ vendorCategory: c, isAdvisor: true });
    assert.ok(p.trimEnd().endsWith(LENS_BODY.trimEnd()),
      `'${c}': the advisor prefix does not close on the lens — F-06.67, live`);
  }
});

t('§1.2 ⚑ the CRUX is the last paragraph of the prompt, which is what three re-authorings believed', () => {
  const p = compose({ vendorCategory: 'photography', isAdvisor: true });
  assert.ok(new RegExp(CRUX_TAIL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$').test(p),
    'the crux paragraph does not terminate the composed prefix');
});

t('§1.3 the ruled ORDER, whole: soul -> roster -> law -> field -> lens', () => {
  const p = compose({ vendorCategory: 'planning', isAdvisor: true });
  const iSoul = p.indexOf('You are Victor Hart');
  const iRoster = p.indexOf('A wedding is a production, and a production runs on people');
  const iLaw = p.indexOf('The owner hired a counsel, not a control room');
  const iField = p.indexOf(FIELD_MARK);
  const iLens = p.indexOf(LENS_HEAD);
  assert.ok(iSoul === 0, 'the soul does not open the prefix');
  assert.ok(iRoster > iSoul, 'the roster does not follow the soul');
  assert.ok(iLaw > iRoster, 'the law does not follow the roster');
  assert.ok(iField > iLaw, 'the field block does not follow the law');
  assert.ok(iLens > iField, 'THE LENS DOES NOT FOLLOW THE FIELD BLOCK — the disease');
});

// ════════════════════════════════════════════════════════════════════════════
H('§2 — ⚑ BUSINESS AND CONSULT DID NOT MOVE ONE BYTE');

t('§2.1 ⚑ BUSINESS is byte-identical to soul(+roster)+law+field — the lens term is the empty string', () => {
  const soulSrc = read(HARVEY);
  const S = body(soulSrc, 'HARVEY_SOUL');
  const W = body(soulSrc, 'PRODUCTION_WEAVE');
  const L = body(soulSrc, 'NO_MACHINERY_LAW');
  assert.strictEqual(compose({ vendorCategory: 'planning' }), S + W + L + FIELD_BLOCK,
    'the planner business prefix moved');
  for (const c of NON_PLANNER) {
    assert.strictEqual(compose({ vendorCategory: c }), S + L + FIELD_BLOCK,
      `the '${c}' business prefix moved`);
  }
});

t('§2.2 CONSULT is byte-identical to its own soul + field — untouched by both terms', () => {
  const C = body(read(CONSULT), 'CONSULTANT_HARVEY_SOUL');
  for (const c of ['planning', 'photography']) {
    assert.strictEqual(compose({ vendorCategory: c, isConsult: true }), C + FIELD_BLOCK,
      `the '${c}' consult prefix moved — the consult room must not see this change at all`);
  }
});

t('§2.3 ⚑ THE ALGEBRA IS THE GUARANTEE, stated mechanically: \'\' + f === f + \'\'', () => {
  // This is why §2.1/§2.2 can be asserted as equalities rather than as a diff against a
  // remembered "before". With isAdvisor false the lens term IS the empty string, so the
  // two orders are the same expression. The cell asserts the premise, not the belief.
  const { prefix } = lift(read(LOOP));
  assert.ok(/\(isAdvisor \? ADVISOR_LENS : ''\)/.test(prefix),
    'the lens term is no longer a ternary onto the empty string — §2.1/§2.2 lose their guarantee');
  assert.strictEqual('' + FIELD_BLOCK, FIELD_BLOCK + '', 'string concatenation is not associative here — stop');
});

// ════════════════════════════════════════════════════════════════════════════
H('§3 — ⚑ NON-VACUITY: THE STUB THAT HID THIS FOR THREE SITTINGS');

t('§3.1 ⚑ with a CENSUS-SIZED field block the two orders DIFFER — the cells above have teeth', () => {
  const p = compose({ vendorCategory: 'photography', isAdvisor: true });
  const soulSrc = read(HARVEY);
  const old = body(soulSrc, 'HARVEY_SOUL') + body(soulSrc, 'NO_MACHINERY_LAW') + LENS_BODY + FIELD_BLOCK;
  assert.notStrictEqual(p, old, 'the cured and uncured orders produced the same string — the field block is not modelled at size');
  assert.ok(FIELD_BLOCK.length > 90000, 'the field block fixture is not census-sized');
});

t('§3.2 ⚑ …and with an EMPTY field block they are IDENTICAL — which is exactly why the rig could not see it', () => {
  // b06_gauntlet's desk double served ZERO domain_handbooks rows, so fieldBlock composed
  // as '' on every path, live runs included. Under that double this whole file is
  // vacuous. F-06.68 is the repair; this cell is the reason it was necessary.
  const soulSrc = read(HARVEY);
  const S = body(soulSrc, 'HARVEY_SOUL');
  const L = body(soulSrc, 'NO_MACHINERY_LAW');
  const cured = compose({ vendorCategory: 'photography', isAdvisor: true, fieldBlock: '' });
  assert.strictEqual(cured, S + L + LENS_BODY + '', 'the empty-field case is not identity — re-derive');
});

t('§3.3 the post-lens tail is ZERO chars cured, and >=90,000 uncured (the number, not the adjective)', () => {
  const p = compose({ vendorCategory: 'photography', isAdvisor: true });
  const i = p.indexOf(LENS_HEAD);
  assert.ok(i > 0, 'the lens is absent from the advisor prefix');
  const tail = p.length - (i + LENS_BODY.trim().length);
  assert.ok(tail <= 2, `the post-lens tail is ${tail} chars, not terminal`);
  assert.ok(i > 90000, `the lens opens at ${i} — the Codex payload is not upstream of it`);
});

// ════════════════════════════════════════════════════════════════════════════
H('§4 — ⚑ BOTH-WAYS BY PRODUCTION MUTATION (loop.ts itself, never the fixture)');

const MUTATIONS = [
  { label: '§4.1 RED — the pre-cure order restored: fieldBlock closes the prefix and the lens is buried',
    from: "+ fieldBlock + (isAdvisor ? ADVISOR_LENS : '');",
    to: "+ (isAdvisor ? ADVISOR_LENS : '') + fieldBlock;",
    expect: (p) => {
      assert.ok(!p.trimEnd().endsWith(LENS_BODY.trimEnd()), 'the mutation did not move the lens');
      const i = p.indexOf(LENS_HEAD);
      assert.ok(p.length - (i + LENS_BODY.trim().length) > 90000, 'the buried lens does not carry a >=90k tail');
    } },
  { label: '§4.2 RED — the lens dropped from the expression entirely: the advisor room composes unlensed',
    from: "+ fieldBlock + (isAdvisor ? ADVISOR_LENS : '');",
    to: '+ fieldBlock;',
    expect: (p) => { assert.ok(!p.includes(LENS_HEAD), 'the lens survived its own deletion'); } },
];

t('§4.0 the mutation anchor exists EXACTLY ONCE in loop.ts — a mutation that matches nothing proves nothing', () => {
  const src = read(LOOP);
  const n = (src.match(/\+ fieldBlock \+ \(isAdvisor \? ADVISOR_LENS : ''\);/g) || []).length;
  assert.strictEqual(n, 1, `the compose anchor appears ${n} times — re-derive before trusting §4`);
});

for (const m of MUTATIONS) {
  t(m.label, () => {
    const original = read(LOOP);
    try {
      assert.ok(original.includes(m.from), 'the mutation anchor is absent');
      write(LOOP, original.replace(m.from, m.to));
      const mutated = read(LOOP);
      const p = compose({ vendorCategory: 'photography', isAdvisor: true, loopSrc: mutated });
      m.expect(p);
      // and the CURED assertion must FAIL against the mutated tree — the both-ways half.
      let cured = true;
      try { assert.ok(p.trimEnd().endsWith(LENS_BODY.trimEnd())); } catch { cured = false; }
      assert.strictEqual(cured, false, '§1.1 still greens on the mutated tree — the cell has no teeth');
    } finally {
      write(LOOP, original);
    }
  });
}

t('§4.3 the tree was RESTORED — the mutations left no residue', () => {
  const src = read(LOOP);
  assert.ok(src.includes("+ fieldBlock + (isAdvisor ? ADVISOR_LENS : '');"),
    'loop.ts did not come back to its cured bytes — STOP and restore by hand');
});

// ════════════════════════════════════════════════════════════════════════════
H('§5 — THE SOUL PLANE DID NOT OPEN (the cure cost zero model-voiced bytes)');

t('§5.1 advisorLens.ts is untouched by this cure — the veto slot stays unfired', () => {
  const { execFileSync } = require('child_process');
  const changed = execFileSync('git', ['diff', '--name-only', 'origin/main', '--', LENS], { cwd: ROOT, encoding: 'utf8' }).trim();
  assert.strictEqual(changed, '', 'advisorLens.ts moved — this cure is an ORDER, and a byte in the lens is a different sitting');
});

t('§5.2 the chartered redirect sentence rides the prefix byte-verbatim, wherever the lens sits', () => {
  const p = compose({ vendorCategory: 'photography', isAdvisor: true });
  assert.ok(p.includes("that one's for the ledger — flip me to business mode and it's filed"),
    'the founder-vetoed, byte-locked redirect line is not in the composed advisor prefix');
});

t('§5.3 the prefix is still WHOLLY STATIC — the cache law is untouched by a reordering', () => {
  const { prefix } = lift(read(LOOP));
  for (const dyn of ['today', 'snapshot', 'factsBlock', 'ownerBlock', 'donnaMsgs', 'shelfBlock', 'calBlock', 'actBlock', 'pingBlock']) {
    assert.ok(!new RegExp(`\\b${dyn}\\b`).test(prefix), `${dyn} crossed the cache breakpoint into the static prefix`);
  }
});

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail) { console.log('RED — F-06.67 is not held.'); process.exit(1); }
console.log('GREEN — the lens closes the prompt and not merely its file; business and consult');
console.log('did not move one byte; and the stub that hid this for three sittings is named.');
