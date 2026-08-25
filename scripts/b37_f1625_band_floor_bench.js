#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b37_f1625_band_floor_bench.js
// F-16.25 · R-37.21 (Fork A) — THE OPEN-ENDED BAND GETS A COLUMN. Door half.
//
// ── THE DISEASE, IN ONE SENTENCE ────────────────────────────────────────────
// `Rs 10,00,000+` is a FLOOR WITH NO CEILING. The sheet posted only the ceiling,
// so the richest bride on the feed was stored identically to a bride who
// answered nothing — and rendered `Rs —`.
//
// ── WHAT IS NOT THE DISEASE, AND IS ASSERTED HERE SO IT STAYS UNCURED ───────
// `bandCeiling('') === null` is CORRECT and its reasoning is load-bearing: its
// own header names the trap (`Number('')` is 0, which would make the richest
// band the poorest lead and have enrichment compute a fee comparison against
// zero). A cell below pins that null. A future tidy-up that "fixes" it by
// returning 0 reds here — the F-08.104 quote-pin pattern, second use.
//
// Likewise `budget_max: null` for the top band is TRUTHFUL. There is no ceiling.
// Nothing in this bench asks for one.
//
// ── COUNTS, derived by running this file and counting its own output ────────
//   §1 the two parsers ......................  14
//   §2 the enquiry door's wiring ............   8
//   §3 the list door's wire .................   5
//   §4 THE MARK (floor+ceiling as a pair) ...   5
//   §5 the demo exclusion (R-37.26) .........   3
//   total ................................... see the footer, never estimated
//
// Run: node scripts/b37_f1625_band_floor_bench.js
'use strict';

const path = require('path');
const fs   = require('fs');
const ROOT = path.join(__dirname, '..');

const { bandCeiling, bandFloor, bandAnswered } =
  require(path.join(ROOT, 'src/lib/discover/enquiryFields'));

let pass = 0, fail = 0;
const reds = [];
function t(name, fn) {
  let ok = false, detail = '';
  try { const r = fn(); ok = r === true; if (!ok) detail = String(r); }
  catch (e) { ok = false; detail = e.message; }
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; reds.push(name); console.log(`  RED  ${name}${detail ? ' — ' + detail : ''}`); }
}

// ── [F-06.192] SOURCE CELLS READ CODE, NEVER PROSE ──────────────────────────
// This file's own comments name every symbol it greps for. Unstripped, a
// mutation deleting `budget_min` from a SELECT would leave the word in the
// paragraph above it and the cell would stay green — a one-way cell in
// both-ways clothes. Block comments and WHOLE-LINE `//` comments only: a
// trailing strip would cut `https://…` in half and these sources carry URLs.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !/^\s*\/\//.test(l))
    .join('\n');
}
const readCode = (rel) => stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const readRaw  = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const ENQUIRE = readCode('src/api/couple/enquire.js');
const LEADS   = readCode('src/api/vendor/leads.js');

console.log('\n§1 · THE TWO PARSERS — ONE HOME, TWO FACTS');
t('bandFloor: the top band\'s floor parses', () => bandFloor('1000000') === 1000000);
t('bandFloor: a middle band\'s floor parses', () => bandFloor('300000') === 300000);
t('bandFloor: the FIRST band has no floor ("" -> null)', () => bandFloor('') === null);
t('bandFloor: absent -> null', () => bandFloor(undefined) === null && bandFloor(null) === null);
t('bandFloor: whitespace is folded', () => bandFloor('  500000 ') === 500000);
t('bandFloor: zero is NOT a floor', () => bandFloor('0') === null);
t('bandFloor: a negative is NOT a floor', () => bandFloor('-5') === null);
t('bandFloor: junk is NOT a floor', () => bandFloor('lots') === null);
// THE PIN. This is `bandCeiling`'s own reasoning, held from the outside so that
// a future "simplification" reds instead of shipping the ₹0 lead.
// ── WHERE THE TRAP IS ACTUALLY HELD SHUT, derived by mutation this sitting ──
// `bandCeiling` opens with `if (s === '') return null`, and it reads like the
// guard. IT IS NOT THE LOAD-BEARING ONE. `Number('')` is 0 and the closing
// `n > 0` refuses it independently — a mutation deleting the empty-string line
// bit NOTHING. The line is defence in depth and a statement of intent; `n > 0`
// is the guard. A future tidy-up that removes `n > 0` "because the '' case is
// already handled above" would ship the Rs 0 lead, which is precisely the shape
// this pin exists to stop. Both are pinned below.
t('[PIN] bandCeiling("") stays NULL, never 0 — the top band is not the poorest', () =>
  bandCeiling('') === null
    ? true : 'bandCeiling now returns a number for the open band — the richest bride is about to be stored as the poorest');
t('[PIN] bandCeiling and bandFloor are DIFFERENT functions', () =>
  bandCeiling !== bandFloor
    ? true : 'the two facts collapsed into one function — see bandFloor\'s header');
t('bandAnswered: silence (key omitted) reads as UNANSWERED', () =>
  bandAnswered(undefined) === false);
t('bandAnswered: the top band ("") reads as ANSWERED', () =>
  bandAnswered('') === true);
t('bandAnswered: a bounded band reads as ANSWERED', () =>
  bandAnswered('300000') === true);
t('bandAnswered is NOT wired as the carrier — the floor is', () =>
  /budget_min:\s*postedBudgetMin/.test(ENQUIRE) && !/budget_min:[^\n]*bandAnswered/.test(ENQUIRE)
    ? true : 'the top-band inference is riding "" — that puts the band table in two repos');

console.log('\n§2 · THE ENQUIRY DOOR — THE FLOOR IS ACCEPTED, PARSED AND WRITTEN');
t('the door imports bandFloor from the one parse home', () =>
  /bandFloor[^\n]*require\([^\n]*enquiryFields/.test(ENQUIRE)
  || /\{[^}]*bandFloor[^}]*\}\s*=\s*require\([^\n]*enquiryFields/.test(ENQUIRE));
t('the door DESTRUCTURES budget_floor off the request body', () =>
  /^\s*budget_floor,/m.test(ENQUIRE));
t('the door parses it through bandFloor, never inline', () =>
  /const postedBudgetMin\s*=\s*bandFloor\(budget_floor\)/.test(ENQUIRE));
t('the door WRITES budget_min on the lead', () =>
  /budget_min:\s*postedBudgetMin/.test(ENQUIRE));
t('budget_max is UNMOVED — still bandCeiling(budget_band)', () =>
  /const postedBudgetMax\s*=\s*bandCeiling\(budget_band\)/.test(ENQUIRE)
  && /budget_max:\s*postedBudgetMax/.test(ENQUIRE));
t('the door reads the ""-vs-absent distinction rather than discarding it', () =>
  /const budgetAnswered\s*=\s*bandAnswered\(budget_band\)/.test(ENQUIRE));
t('the ZIP-ORDER WINDOW announces itself instead of failing quietly', () => {
  const raw = readRaw('src/api/couple/enquire.js');
  return /budgetAnswered && postedBudgetMax == null && postedBudgetMin == null/.test(raw)
    && /console\.warn\([^)]*top-band enquiry carried no floor/s.test(raw)
    ? true : 'the door accepts a floor the sheet does not yet post, and says nothing about it';
});
// THIS CELL'S FIRST DRAFT WAS WRONG AND RED ON ITS OWN METHOD. It took a
// +/-400-character window around the warn string and grepped it for refusals —
// and swept in the `if (!vendor_id)` guard that lives further down the handler,
// convicting code it was never asking about. PROXIMITY IS NOT SCOPE. The cure
// is to extract the BLOCK and read only what is inside it, which is a different
// method with a different failure mode (it refuses when the anchor moves,
// rather than answering confidently about the wrong region).
t('the warn is a WARN, never a refusal — an enquiry is never lost to this', () => {
  const raw = readRaw('src/api/couple/enquire.js');
  const start = raw.indexOf('if (budgetAnswered && postedBudgetMax == null && postedBudgetMin == null) {');
  if (start < 0) throw new Error('REFUSED — could not find the ZIP-order window block');
  const end = raw.indexOf('\n  }', start);
  if (end < 0) throw new Error('REFUSED — could not find the block\'s close');
  const block = raw.slice(start, end);
  return /console\.warn\(/.test(block) && !/throw |return |res\.status\(/.test(block)
    ? true : `the ZIP-order window does more than speak:\n${block}`;
});

console.log('\n§3 · THE LIST DOOR — THE FLOOR REACHES THE WIRE');
t('dataSelect asks the database for budget_min', () => {
  const m = readRaw('src/api/vendor/leads.js').match(/const dataSelect\s*=\s*'([^']+)'/);
  if (!m) throw new Error('REFUSED — could not find dataSelect');
  return m[1].split(',').map((x) => x.trim()).includes('budget_min');
});
t('the MAPPER puts budget_min on the wire (F-04.10: the read is only half)', () =>
  /^\s{4}budget_min:\s*l\.budget_min,/m.test(LEADS));
t('budget_total is still the CEILING alias, unchanged', () =>
  /^\s{4}budget_total:\s*l\.budget_max,/m.test(LEADS));
t('the floor did NOT get folded into budget_total', () =>
  !/budget_total:\s*l\.budget_min/.test(LEADS)
    ? true : 'budget_total now means a third thing — the alias trap, re-entered');
t('the serializer census DISPOSITIONED the new key (R-37.4\'s guard answered)', () => {
  const { LIST_SELECT_CENSUS, LIST_WIRE_CENSUS } =
    require(path.join(ROOT, 'src/lib/vendor/leadSerializer'));
  return LIST_SELECT_CENSUS.includes('budget_min') && LIST_WIRE_CENSUS.includes('budget_min')
    ? true : 'budget_min reaches a money wire undispositioned';
});

console.log('\n§4 · THE MARK — FLOOR AND CEILING READ AS A PAIR');
// R-37.21's whole shape: no token machinery, no band table in this repo. The
// pair IS the answer, and these cells assert the three states are distinct.
function mark(floorRaw, ceilRaw) {
  return { min: bandFloor(floorRaw), max: bandCeiling(ceilRaw) };
}
t('TOP BAND -> floor present, ceiling null', () => {
  const m = mark('1000000', '');
  return m.min === 1000000 && m.max === null;
});
t('SILENCE -> both null', () => {
  const m = mark(undefined, undefined);
  return m.min === null && m.max === null;
});
t('the two are DISTINGUISHABLE (the whole point of R-37.21)', () => {
  const top = mark('1000000', ''), silent = mark(undefined, undefined);
  return JSON.stringify(top) !== JSON.stringify(silent)
    ? true : 'top-band and silence are the same row again — F-16.25 has regressed';
});
t('A BOUNDED BAND -> both present', () => {
  const m = mark('300000', '500000');
  return m.min === 300000 && m.max === 500000;
});
t('THE FIRST BAND -> ceiling only, and that is not silence either', () => {
  const m = mark('', '100000'), silent = mark(undefined, undefined);
  return m.min === null && m.max === 100000 && JSON.stringify(m) !== JSON.stringify(silent);
});

console.log('\n§5 · THE DEMO PLANE IS EXCLUDED BY RULING, NOT BY OVERSIGHT (R-37.26)');
// F-08.105: `demo_leads` carries no `budget_min` (witnessed, 15 columns), so
// demo parity costs a migration and this sitting attests zero. The exclusion is
// asserted so it stays deliberate — a later seat adding the column will red here
// and be forced to read the ruling rather than discover the gap.
t('handleDemoVendor is NOT handed the floor', () =>
  !/handleDemoVendor\([^)]*postedBudgetMin/s.test(ENQUIRE)
    ? true : 'the demo path took the floor — demo_leads has no column for it');
t('the demo write still carries the ceiling alone', () => {
  const i = ENQUIRE.indexOf('async function handleDemoVendor');
  if (i < 0) throw new Error('REFUSED — could not find handleDemoVendor');
  const body = ENQUIRE.slice(i);
  return /budget_max:\s*\w*[Pp]ostedBudgetMax/.test(body) && !/budget_min:/.test(body)
    ? true : 'the demo insert shape moved';
});
t('demo_leads still has no budget_min in the witnessed schema', () => {
  const doc = readRaw('docs/db/PUBLIC_SCHEMA.md');
  const m = doc.match(/## public\.demo_leads[^\n]*\n\n```\n([\s\S]*?)```/);
  if (!m) throw new Error('REFUSED — could not find the demo_leads block');
  return !/^\d+\.\s+budget_min\s/m.test(m[1])
    ? true : 'demo_leads gained budget_min — R-37.26\'s exclusion is now stale and needs re-ruling';
});

console.log(`\n${'═'.repeat(64)}`);
console.log(`b37_f1625_band_floor_bench: ${pass}/${pass + fail}`);
if (fail) { console.log('REDS:'); reds.forEach((r) => console.log('  - ' + r)); }
console.log('═'.repeat(64));
process.exit(fail ? 1 : 0);
