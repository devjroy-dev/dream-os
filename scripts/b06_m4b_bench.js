#!/usr/bin/env node
'use strict';
// scripts/b06_m4b_bench.js — TDW_06 · M-4 RE-SEAL · THE REGISTER FLOOR.
// Runnable from any working directory (Q-SP-5).
//
// WHAT THIS PROVES, and why it is a desk question where M-4's opener was not: the opener
// was a prompt paragraph and a desk can say nothing about one. THIS cure is an ARM — a
// pure function on the wire — so the desk is exactly the right instrument, and the walk's
// job is only to confirm the arm is sited where the traffic runs.
//
// THE FIXTURES ARE THE WALK'S OWN BYTES. Not invented shapes: the Meera/Keka line Harvey
// minted at 11:55 on 27 Jul, the `Rs 50k` notification at 11:29, the couple-lane intent
// summary, and the 24 Jul padded deflection. A bench over invented forms would have
// greened while production bled.
//
// NON-VACUITY: every mutation edits SHIPPED PRODUCTION CODE — the arm, the donor, the
// scorer — never this bench's setup, and every mutated file is restored byte-identical.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');
const write = (rel, s) => fs.writeFileSync(P(rel), s);

const SCRUB = 'src/lib/vendor/scrub.js';
const ENRICH = 'src/lib/vendor/enquiryEnrichment.js';
const GAUNTLET = 'scripts/b06_gauntlet.js';
const DOOR = 'src/lib/vendorInbound.js';
const HARVEY = 'src/engine/src/core/harveySoul.ts';

let pass = 0, fail = 0;
const H = (s) => console.log(`\n── ${s} ──`);
function t(name, fn) {
  try { fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e && e.message}`); fail++; }
}
function fresh(rel) {
  const full = P(rel);
  delete require.cache[require.resolve(full)];
  return require(full);
}
// The scorer lives inside the gauntlet; lift its bytes and evaluate (the estate's technique).
function opener() {
  const src = read(GAUNTLET);
  const body = src.slice(src.indexOf('const _OPENER_DEFLECT_RE'), src.indexOf('// ── M-2 (F-06.22)'));
  // eslint-disable-next-line no-eval
  return eval(`${body}; openerFidelity`);
}

// ════════════════════════════════════════════════════════════════════════════
H('§1 — THE ARM CURES ALL THREE PLANES THE WALK CAUGHT BLEEDING');

t('§1.1 HARVEY\'S PROSE — the 11:55 specimen, byte-for-byte from the wire', () => {
  const { registerScrub } = fresh(SCRUB);
  const live = "Meera Kapoor's advance — ₹20,000 landed on the 14th (she's booked for November, balance ₹40,000 due before the event). Kavya's ₹15,000 came through on the 14th as well.";
  const out = registerScrub(live);
  assert.ok(!/₹/.test(out), `a glyph survived: ${out}`);
  assert.ok(out.includes('Rs 20,000') && out.includes('Rs 40,000') && out.includes('Rs 15,000'), out);
});

t('§1.2 THE COUPLE-LANE INTENT SUMMARY — "budget of 50k", the shape HARD RULE 12 forbade', () => {
  const { registerScrub } = fresh(SCRUB);
  assert.strictEqual(
    registerScrub('Dev Test 23 is inquiring about photography packages within her budget of 50k.'),
    'Dev Test 23 is inquiring about photography packages within her budget of Rs 50,000.');
});

t('§1.3 THE NOTIFICATION LINE — F-06.42\'s own output', () => {
  const { registerScrub } = fresh(SCRUB);
  assert.strictEqual(registerScrub('💰 Her budget: Rs 50k.'), '💰 Her budget: Rs 50,000.');
});

t('§1.4 EVERY FORBIDDEN DRESS — glyph, k, L, Cr, bare-ungrouped, and the lakh word', () => {
  const { registerScrub } = fresh(SCRUB);
  const table = [
    ['₹20,000', 'Rs 20,000'], ['₹50k', 'Rs 50,000'], ['Rs 50k', 'Rs 50,000'],
    ['Rs 4.5L', 'Rs 4,50,000'], ['1.2Cr', 'Rs 1,20,00,000'], ['₹4 lakh', 'Rs 4,00,000'],
    ['Rs 500000', 'Rs 5,00,000'], ['INR 350000', 'Rs 3,50,000'],
  ];
  for (const [i, o] of table) assert.strictEqual(registerScrub(i), o, `${i} -> ${registerScrub(i)}`);
});

t('§1.5 AN ALREADY-CLEAN FIGURE IS UNTOUCHED — the arm is a floor, not a rewriter', () => {
  const { registerScrub } = fresh(SCRUB);
  const clean = 'client="Nidipta" | Rs 37,000 in | received Rs 10,000 | pending Rs 27,000';
  assert.strictEqual(registerScrub(clean), clean);
});

// ════════════════════════════════════════════════════════════════════════════
H('§2 — ⚑ IT RE-DRESSES, IT NEVER RE-COMPUTES (CE R3, constraint 1)');

t('§2.1 THE VALUE IS INVARIANT ACROSS THE WHOLE BATTERY', () => {
  // The one thing an arm on money must never get wrong. ₹20,000 -> Rs 20,000, NEVER
  // Rs 2,00,000. A wrong figure spoken confidently is worse than an ugly right one.
  const { registerScrub } = fresh(SCRUB);
  const digits = (s) => Number(String(s).replace(/[^\d]/g, ''));
  const battery = [
    ['₹20,000', 20000], ['₹50k', 50000], ['Rs 4.5L', 450000], ['1.2Cr', 12000000],
    ['₹4 lakh', 400000], ['Rs 500000', 500000], ['Rs 37,000', 37000], ['Rs 999', 999],
    ['Rs 1,00,000', 100000], ['₹2.5 lakhs', 250000],
  ];
  for (const [input, expected] of battery) {
    assert.strictEqual(digits(registerScrub(input)), expected,
      `VALUE CHANGED: ${input} -> ${registerScrub(input)} (expected value ${expected})`);
  }
});

t('§2.2 A FRACTIONAL RUPEE IS LEFT ALONE — not ours to round', () => {
  const { registerScrub } = fresh(SCRUB);
  assert.strictEqual(registerScrub('Rs 0.7'), 'Rs 0.7');
});

t('§2.3 NON-MONEY DIGITS ARE NOT MONEY — ids, times, years, phones', () => {
  // A register arm that ate a record id or a wedding year would be a worse disease than
  // the one it cures. Bare digit runs with no Rs/₹/INR and no scale word are not touched.
  const { registerScrub } = fresh(SCRUB);
  for (const s of ['rec-34 is her ref', 'I called at 11:55 about 2026 plans',
                   'phone +919625759924', 'the 25th at 09:00', 'binder 8db4d2a6']) {
    assert.strictEqual(registerScrub(s), s, `non-money text was rewritten: ${s} -> ${registerScrub(s)}`);
  }
});

// ════════════════════════════════════════════════════════════════════════════
H('§3 — ⚑ HER QUOTED SPAN IS INVIOLATE (CE R3, constraint 2)');

t('§3.1 A BRIDE WHO WRITES "₹50k" IN HER OWN WORDS KEEPS EVERY BYTE', () => {
  // By CONSTRUCTION: scrubModelFrame calls scrubText on the frame halves only. The arm
  // lives inside scrubText, so her span never reaches it — the same guarantee the persona
  // arms inherit, for free.
  const { scrubModelFrame } = fresh(DOOR);
  const hers = 'hi, do you do packages around ₹50k?';
  const framed = `Dev Test 23 is asking about packages. Her message: "${hers}"`;
  const out = scrubModelFrame(framed, hers);
  assert.ok(out.includes(`"${hers}"`), `HER bytes were re-dressed: ${out}`);
});

t('§3.2 AND THE FRAME AROUND HER QUOTE IS STILL CURED — both halves, one string', () => {
  const { scrubModelFrame } = fresh(DOOR);
  const hers = 'do you do packages around ₹50k?';
  const framed = `Her budget is ₹50k. Her message: "${hers}"`;
  const out = scrubModelFrame(framed, hers);
  assert.ok(out.startsWith('Her budget is Rs 50,000.'), `the model's frame was not cured: ${out}`);
  assert.ok(out.includes(`"${hers}"`), 'her quote was damaged while curing the frame');
});

t('§3.3 THE PERSONA ARMS STILL WORK — the register arm did not displace the firewall', () => {
  const { scrubText } = fresh(SCRUB);
  const out = scrubText('donna filed it — Rs 50k received.');
  assert.ok(!/\bdonna\b/i.test(out), `persona leak: ${out}`);
  assert.ok(out.includes('Rs 50,000'), `register not applied alongside: ${out}`);
});

// ════════════════════════════════════════════════════════════════════════════
H('§4 — F-06.42: THE DONOR HANDS A CLEAN FIGURE (belt and suspenders)');

t('§4.1 fmtRsShort NOW RENDERS THE HOUSE FORM — the k/L/Cr shapes are retired', () => {
  const src = read(ENRICH);
  assert.ok(!/\}\)\}Cr`|\}\)\}L`|\/ 1000\)\}k`/.test(src), 'a short form survived in the donor');
  assert.ok(/const \{ rupees \} = require\('\.\.\/witnessLine'\)/.test(src), 'the donor does not use the grouped home');
});

t('§4.2 ITS THREE CALL SITES ARE UNCHANGED — the cure is the renderer, not the callers', () => {
  const src = read(ENRICH);
  for (const line of ['💰 Her budget (${fmtRsShort(brideBudget)}) is ${verdict}',
                      '💰 Her budget: ${fmtRsShort(brideBudget)}.',
                      '💰 Total wedding budget: ${fmtRsShort(brideBudget)}.']) {
    assert.ok(src.includes(line), `call site moved: ${line}`);
  }
});

// ════════════════════════════════════════════════════════════════════════════
H('§5 — LD-5: THE LAW IS NOT DECORATIVE (CE R4)');

t('§5.1 harveySoul:179 AND ITS MIRRORS SURVIVE — the soul is the intent, the arm the floor', () => {
  const soul = read(HARVEY);
  assert.ok(/never the symbol/.test(soul) && /grouped the Indian way/.test(soul),
    'the register law was deleted once the arm landed — the arm is a floor UNDER the law, not a replacement');
  assert.ok(/count the zeros/.test(soul), 'LD-5: the reason attached to the law was lost');
});

t('§5.2 THE ARM STATES ITS OWN TWO-LAYER DOCTRINE — a future reader cannot mistake it', () => {
  const src = read(SCRUB);
  assert.ok(/NOT\s*\n?\/\/ decorative|are NOT/.test(src), 'the arm does not record why the law stays');
});

// ════════════════════════════════════════════════════════════════════════════
H('§6 — F-06.45: THE DEFLECTION LIMB CATCHES THE SHAPE IT MISSED');

t('§6.1 THE 24 JUL WALK SPECIMEN NOW CONVICTS — a padded deflection is still a door closing', () => {
  const openerFidelity = opener();
  const ask = 'Makeupbyswatiroy hi, do you do bridal makeup packages around 50k?';
  const padded = 'Let me check with dev and get back to you. In the meantime, is this for a wedding, and roughly how many functions are you planning and over how many days?';
  const r = openerFidelity(padded, ask);
  assert.strictEqual(r.ok, false, `the padded deflection still passes: ${JSON.stringify(r)}`);
  assert.strictEqual(r.quality, 'bare-deflection');
});

t('§6.2 A DEFLECTION THAT ANSWERS FIRST STILL PASSES — the limb judges the LEAD, not the phrase', () => {
  const openerFidelity = opener();
  const ask = 'do you do packages around 50k?';
  const ruled = "Swati prices on the number of functions, so she'll want your dates before quoting — let me check with her and get back to you today. How many functions are you planning?";
  assert.strictEqual(openerFidelity(ruled, ask).ok, true, 'the ruled shape is now falsely convicted');
});

t('§6.3 THE M-4 CELLS STILL HOLD — the widening did not break the questionnaire limb', () => {
  const openerFidelity = opener();
  const ask = 'do you do packages around 50k?';
  assert.strictEqual(openerFidelity("Hi Dev Test 23! I'm Swati Roy's assistant — is this for a single day wedding, or multiple functions?", ask).quality, 'questionnaire');
  assert.strictEqual(openerFidelity("Hi! I'm Swati's assistant — is this a wedding?", 'hi').quality, 'n/a');
});

// ════════════════════════════════════════════════════════════════════════════
H('§7 — NON-VACUOUS: RED AT THE UNCURED TREE, BY PRODUCTION MUTATION');

const MUTATIONS = [
  { label: '§1 RED — the arm is unsited: the glyph rides the wire again, exactly as at 11:55',
    file: SCRUB, from: '  s = registerScrub(s);', to: '  // s = registerScrub(s);',
    check: () => { const { scrubText } = fresh(SCRUB); assert.ok(/₹/.test(scrubText('advance ₹20,000 landed'))); } },
  { label: '§2.1 RED — the arm RE-COMPUTES: a scale multiplier is wrong and the figure lies',
    file: SCRUB, from: '  l: 1e5, lakh: 1e5,', to: '  l: 1e6, lakh: 1e6,',
    check: () => { const { registerScrub } = fresh(SCRUB); assert.strictEqual(registerScrub('Rs 4.5L'), 'Rs 45,00,000'); } },
  { label: "\u00A72.3 RED \u2014 the arm eats bare digits: a wedding year becomes money",
    file: SCRUB,
    // The anchor is DERIVED from the file at runtime, not hand-escaped. Hand-escaping a
    // regex that lives inside a template literal, three quoting layers deep, is how a
    // mutation anchor silently stops matching and a RED cell quietly becomes vacuous.
    fromRe: /(\(cr\|crore\|crores\|l\|lakh\|lakhs\|lac\|lacs\|k\|thousand\))([\s\S]{0,12}?\]\.join)/,
    to: "$1?$2",
    check: () => { const { registerScrub } = fresh(SCRUB); assert.notStrictEqual(registerScrub('about 2026 plans'), 'about 2026 plans'); } },
  { label: '§4.1 RED — the donor reverts to short forms: Rs 50k back on the notification',
    file: ENRICH, from: '  return rupees(n) || `Rs ${n}`;', to: '  if (n >= 1000) return `Rs ${Math.round(n / 1000)}k`;\n  return `Rs ${n}`;',
    check: () => { delete require.cache[require.resolve(P(ENRICH))]; const src = read(ENRICH); assert.ok(/\/ 1000\)\}k`/.test(src)); } },
  { label: '§6.1 RED — the deflection limb narrows back: the 24 Jul specimen walks free again',
    file: GAUNTLET, from: '  const bareDeflection = deflectLeads && nonQuestionResidue.length < 25;',
    to: '  const bareDeflection = deflectLeads && nonQuestionResidue.length < 0;',
    check: () => {
      const openerFidelity = opener();
      const padded = 'Let me check with dev and get back to you. In the meantime, is this for a wedding, and roughly how many functions are you planning and over how many days?';
      assert.strictEqual(openerFidelity(padded, 'do you do packages around 50k?').ok, true);
    } },
];

for (const m of MUTATIONS) {
  t(m.label, () => {
    const before = read(m.file);
    if (m.fromRe) {
      assert.ok(m.fromRe.test(before), `MUTATION ANCHOR MISSING (re) in ${m.file}: ${m.fromRe}`);
      const mutated = before.replace(m.fromRe, m.to);
      assert.notStrictEqual(mutated, before, 'the regex mutation changed nothing — a vacuous RED');
      write(m.file, mutated);
    } else {
      assert.ok(before.includes(m.from), `MUTATION ANCHOR MISSING in ${m.file}: ${m.from}`);
      write(m.file, before.replace(m.from, m.to));
    }
    try { m.check(); } finally { write(m.file, before); }
  });
}

t('§7.0 every mutated file is restored BYTE-IDENTICAL', () => {
  assert.ok(read(SCRUB).includes('  s = registerScrub(s);'), 'a mutation survived in the arm');
  assert.ok(read(SCRUB).includes('  l: 1e5, lakh: 1e5,'), 'a mutation survived in the scale table');
  assert.ok(read(ENRICH).includes('  return rupees(n) || `Rs ${n}`;'), 'a mutation survived in the donor');
  assert.ok(read(GAUNTLET).includes('nonQuestionResidue.length < 25;'), 'a mutation survived in the scorer');
});

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) {
  console.log('GREEN — the register has a floor under its law: the glyph cannot reach the wire,');
  console.log('the figure is never re-computed, and her own sentence keeps every byte.');
}
process.exit(fail === 0 ? 0 : 1);
