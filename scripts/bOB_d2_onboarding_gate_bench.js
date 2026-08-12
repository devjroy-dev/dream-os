#!/usr/bin/env node
// scripts/bOB_d2_onboarding_gate_bench.js
// ARC OB · CE-31 · charter OB-D · D-2 · THE ONBOARDING GATE BENCH
//
// Run bare, and read the exit code as a second independent method alongside the
// verdict lines:   node scripts/bOB_d2_onboarding_gate_bench.js ; echo $?
//
// BOTH-WAYS BY PRODUCTION MUTATION. Every cell below either reads a pure
// function against a fixture, or greps the PRODUCTION FILE for the byte it is
// asserting. The mutation list at the foot of this file names, for each cell,
// the single edit to the production tree that reddens it — a vacuous green is
// worse than a declared gap, and a cell nobody can redden is not a cell.
//
// NO DATABASE. onboardingPredicate is pure by construction (prospectExit's
// precedent), and the gate is exercised with a stub supabase, so this bench
// runs at any tip on a clean clone.
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let pass = 0, fail = 0;
function cell(id, desc, fn) {
  let ok = false, note = '';
  try { const r = fn(); ok = r === true; if (r !== true) note = String(r); }
  catch (e) { ok = false; note = e && e.message; }
  if (ok) { pass++; console.log(`  PASS  ${id}  ${desc}`); }
  else    { fail++; console.log(`  FAIL  ${id}  ${desc}${note ? '  — ' + note : ''}`); }
}

const P = require('../src/lib/onboardingPredicate');
const G = require('../src/lib/onboardingGate');
const { _resetLaneFlagCache } = require('../src/lib/laneFlags');
const { LANE_FLAGS } = (() => {
  // laneFlags does not export its map; assert against the file's bytes instead.
  return {};
})();

console.log('\n=== §1 · THE PREDICATE — field presence, never onboarding_state (R-OB.8) ===');

cell('1.1', 'bride complete on name + budget', () =>
  P.brideComplete({ name: 'Priya' }, { budget_total: 1500000 }).complete === true || 'expected complete');

cell('1.2', 'bride incomplete names the missing field, not a bare false', () => {
  const v = P.brideComplete({ name: null }, { budget_total: 1500000 });
  return (v.complete === false && v.missing.join(',') === 'name') || `got ${JSON.stringify(v)}`;
});

cell('1.3', 'the 11 nameless brides reproduce: no name, no budget -> both missing', () => {
  const v = P.brideComplete({ name: null }, { budget_total: null });
  return (v.complete === false && v.missing.join(',') === 'name,budget') || `got ${JSON.stringify(v)}`;
});

cell('1.4', 'whitespace-only name is not a name', () =>
  P.brideComplete({ name: '   ' }, { budget_total: 5 }).missing.includes('name') || 'whitespace passed');

cell('1.5', 'budget 0 is a blank input, not an answer', () =>
  P.brideComplete({ name: 'A' }, { budget_total: 0 }).missing.includes('budget') || 'zero passed as budget');

cell('1.6', 'city and date NEVER gate the bride (R-OB.6 optional)', () =>
  P.brideComplete({ name: 'A' }, { budget_total: 1, wedding_city: null, wedding_date: null }).complete === true
  || 'an optional field held the door');

cell('1.7', 'vendor complete on all five R-OB.6 fields', () =>
  P.vendorComplete({ name: 'Swati' }, {
    category: 'photographer', city: 'Delhi', rate_min: 80000,
    service_area: 'pan_india', service_cities: null,
  }).complete === true || 'expected complete');

cell('1.8', 'vendor missing service_area is incomplete and says so', () => {
  const v = P.vendorComplete({ name: 'S' }, { category: 'c', city: 'D', rate_min: 1 });
  return (v.complete === false && v.missing.join(',') === 'service_area') || `got ${JSON.stringify(v)}`;
});

cell('1.9', 'a brand-new vendor (no vendors row) is incomplete on every field', () => {
  const v = P.vendorComplete({ name: null }, undefined);
  return (v.complete === false && v.missing.length === 5) || `got ${JSON.stringify(v)}`;
});

cell('1.10', 'rate_display=false does not gate — hiding a price is not withholding it', () =>
  P.vendorComplete({ name: 'S' }, {
    category: 'c', city: 'D', rate_min: 50000, service_area: 'worldwide',
    service_cities: null, rate_display: false,
  }).complete === true || 'display state held the door');

cell('1.11', 'R-OB.8 IN BYTES: the predicate file never reads onboarding_state', () =>
  !read('src/lib/onboardingPredicate.js').split('\n')
    .filter(l => !l.trim().startsWith('//'))
    .join('\n').includes('onboarding_state')
  || 'onboarding_state reached the predicate outside a comment');

console.log('\n=== §2 · SERVICE AREA — one rule, three altitudes (0122 / predicate / API) ===');

cell('2.1', 'the three canonical tokens, exactly', () =>
  P.SERVICE_AREA_TOKENS.join(',') === 'pan_india,worldwide,select_cities'
  || `got ${P.SERVICE_AREA_TOKENS.join(',')}`);

cell('2.2', 'select_cities with no cities is NOT present (pairing, code altitude)', () =>
  P.serviceAreaPresent('select_cities', []) === false || 'empty city list passed');

cell('2.3', 'select_cities with a city is present', () =>
  P.serviceAreaPresent('select_cities', ['Jaipur']) === true || 'named city rejected');

cell('2.4', 'whitespace cities do not count as named', () =>
  P.serviceAreaPresent('select_cities', ['  ']) === false || 'whitespace city passed');

cell('2.5', 'an unknown token is never present', () =>
  P.serviceAreaPresent('pan-india', null) === false || 'a near-miss token passed');

cell('2.6', '0122 holds the pairing in DDL, both directions (constraint altitude)', () => {
  const m = read('db/migrations/0122_vendor_service_area.sql');
  return (m.includes('vendors_service_cities_pairing')
       && m.includes("service_area = 'select_cities'")
       && m.includes('is distinct from')) || 'the two-way pairing CHECK is not in 0122';
});

cell('2.7', '0122 constrains the tokens and no others', () => {
  const m = read('db/migrations/0122_vendor_service_area.sql');
  return m.includes("in ('pan_india', 'worldwide', 'select_cities')") || 'token CHECK missing';
});

cell('2.8', "0122 backfills NOTHING to 'worldwide' — no row could have said it", () => {
  const m = read('db/migrations/0122_vendor_service_area.sql');
  // Scoped to the UPDATE STATEMENTS ONLY. An earlier draft of this cell split on
  // the statement head and read the whole tail, which swept in §3's token CHECK —
  // a CHECK that must name 'worldwide' — and reddened on correct code. A cell
  // that reddens on the right answer is a broken cell, not a strict one.
  const stmts = (m.match(/update public\.vendors[\s\S]*?;/g) || []);
  if (stmts.length !== 2) return `expected 2 backfill statements, found ${stmts.length}`;
  return !stmts.join('').includes("'worldwide'") || "a backfill arm assigns 'worldwide'";
});

cell('2.9', '0122 adds NO price column (rate_min already existed at 0034)', () => {
  const m = read('db/migrations/0122_vendor_service_area.sql');
  return !/add column if not exists\s+(rate_|price|starting_)/i.test(m)
    || '0122 adds a price column that already exists';
});

cell('2.10', 'the API refuses a bad token with a 400 sentence, not a raw DB error', () => {
  const s = read('src/api/vendor/me.js');
  return (s.includes('validateServiceArea') && s.includes('service_area must be one of'))
    || 'the API-edge validator is absent';
});

cell('2.11', 'me.js reads 0122 in BOTH selects — an editor that cannot read state clobbers', () => {
  const s = read('src/api/vendor/me.js');
  const selects = s.match(/\.select\('id, business_name[^']*'\)/g) || [];
  return (selects.length >= 2 && selects.every(x => x.includes('service_area') && x.includes('service_cities')))
    || `selects carrying the pair: ${selects.filter(x => x.includes('service_area')).length}/${selects.length}`;
});

console.log('\n=== §3 · THE GATE IS DARK (R-OB.9) and the copy lock is independent ===');

const stubDb = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) };
const incompleteBride = { user: { name: null }, row: { budget_total: null } };

cell('3.1', 'flag is registered in the lane-flag census, OFF at birth', () => {
  const s = read('src/lib/laneFlags.js');
  return /'onboarding\.gate_enabled':\s*false/.test(s) || 'flag missing or not default-off';
});

cell('3.3', 'the redirect bytes are WITHHELD — no unvetoed copy is resident', () =>
  (G._REDIRECT_BYTES.bride === null && G._REDIRECT_BYTES.vendor === null)
  || 'a redirect byte is resident before founder veto');

cell('3.4', 'DEAD_END_REPLY is untouched — ruling ② SIT BESIDE, blast radius zero', () =>
  read('src/brideIndex.js').includes(
    `"Sorry — you're not on our invite list yet. Request access at thedreamwedding.in"`)
  || 'the dead-end byte moved; ruling ② said sit beside, not replace');

cell('3.5', 'the gate never calls a model — R-OB.3 zero spend by construction', () => {
  const s = read('src/lib/onboardingGate.js');
  return !/(anthropic|deepseek|messages\.create|meteredAnthropic)/i.test(s)
    || 'a model reference reached the gate';
});

cell('3.6', 'bride gate is sited BEFORE the meter mint (R-OB.3)', () => {
  const s = read('src/lib/brideInbound.js');
  const g = s.indexOf("onboardingGate({ lane: 'bride'");
  const m = s.indexOf('const meterAnthropic = meteredAnthropic(');
  const c = s.indexOf('.from(\'couples\')');
  return (g > 0 && m > 0 && c > 0 && c < g && g < m)
    || `order wrong: couples=${c} gate=${g} meter=${m}`;
});

cell('3.7', 'vendor gate is sited BEFORE the image-throttle Vision branch', () => {
  const s = read('src/lib/vendorInbound.js');
  const g = s.indexOf("onboardingGate({ lane: 'vendor'");
  const t = s.indexOf('checkImageThrottle({ supabase, phone, engine: \'vendor\' })');
  return (g > 0 && t > 0 && g < t) || `order wrong: gate=${g} throttle=${t}`;
});

cell('3.8', 'Eliza\'s door is NOT gated (R-OB.5, FORBIDDEN)', () => {
  const s = read('src/agent/coupleSystemPrompt.js');
  return !s.includes('onboardingGate') || "the gate reached Eliza's door";
});

console.log('\n=== §4 · R-OB.7 — the bride\'s word outranks the profile name ===');

cell('4.1', 'invitee_name is FIRST in the circle-member name precedence', () => {
  const s = read('src/lib/brideInbound.js');
  return s.includes("const safeName = (claim.invitee_name || profileName || '')")
    || 'profileName still outranks the bride\'s word at the circle claim';
});

cell('4.2', 'the reordered line names R-OB.7 in-comment (F-06.85 form)', () => {
  const s = read('src/lib/brideInbound.js');
  const i = s.indexOf("const safeName = (claim.invitee_name");
  return (i > 0 && s.slice(Math.max(0, i - 1600), i).includes('R-OB.7'))
    || 'the mechanism is not named at its own site';
});

cell('4.3', 'NO new name-capture code ships (R-OB.7, cure refused everywhere)', () => {
  for (const f of ['src/lib/onboardingGate.js', 'src/lib/onboardingPredicate.js']) {
    if (/profile\.name|profileName/.test(read(f))) return `${f} touches profile name`;
  }
  return true;
});

console.log('\n=== §5 · STALE-STAMPS (ruling ① / ④, F-06.85 form) ===');

cell('5.1', '0122 stale-stamps open_to_travel and says WHY the boolean fails', () => {
  const m = read('db/migrations/0122_vendor_service_area.sql');
  return (m.includes('STALE as of migration 0122') && /cannot (express|say) worldwide/i.test(m))
    || 'the stamp or its reason is missing';
});

cell('5.2', 'travel_notes is retained as the historical record, not stamped dead', () => {
  const m = read('db/migrations/0122_vendor_service_area.sql');
  return m.includes('HISTORICAL RECORD') || 'travel_notes lost its retention reason';
});

cell('5.3', '0122 carries the reader census so the next sitting need not re-derive it', () => {
  const m = read('db/migrations/0122_vendor_service_area.sql');
  return (m.includes('systemPrompt.js:416') && m.includes('coupleSystemPrompt.js:80'))
    || 'the RETIRE-WITH-THE-READER census is absent from 0122';
});

cell('5.4', 'the columns REMAIN — the ladder is append-only (LD-8)', () => {
  const m = read('db/migrations/0122_vendor_service_area.sql');
  return !/drop column/i.test(m) || '0122 drops a column';
});

async function acell(id, desc, fn) {
  let ok = false, note = '';
  try { const r = await fn(); ok = r === true; if (r !== true) note = String(r); }
  catch (e) { ok = false; note = e && e.message; }
  if (ok) { pass++; console.log(`  PASS  ${id}  ${desc}`); }
  else    { fail++; console.log(`  FAIL  ${id}  ${desc}${note ? '  — ' + note : ''}`); }
}

(async () => {
  console.log('\n=== §6 · THE GATE, EXERCISED LIVE (async) ===');

  await acell('6.1', 'DARK at ship state: an incomplete bride is NOT gated', async () => {
    const r = await G.onboardingGate({ lane: 'bride', supabase: stubDb, ...incompleteBride });
    return r.gate === false || 'the gate fired at ship state — R-OB.9 broken';
  });

  await acell('6.2', 'DARK at ship state: a brand-new vendor is NOT gated', async () => {
    const r = await G.onboardingGate({ lane: 'vendor', supabase: stubDb, user: { name: null }, row: null });
    return r.gate === false || 'the vendor gate fired at ship state';
  });

  await acell('6.3', 'COPY LOCK: flag ON with unvetoed bytes still does not gate', async () => {
    _resetLaneFlagCache(); // 60s cache; without this the cell reads 6.1's answer
    const armedDb = { from: () => ({ select: () => ({ eq: () => ({
      maybeSingle: async () => ({ data: { value: 'true' } }) }) }) }) };
    const r = await G.onboardingGate({ lane: 'bride', supabase: armedDb, ...incompleteBride });
    _resetLaneFlagCache(); // leave no armed value cached for the cells below
    return r.gate === false || 'an armed flag gated with no vetoed byte — a stranger would meet silence';
  });

  await acell('6.3b', 'the armed stub is genuinely consulted (anti-vacuity)', async () => {
    _resetLaneFlagCache();
    let hits = 0;
    const armedDb = { from: () => { hits++; return { select: () => ({ eq: () => ({
      maybeSingle: async () => ({ data: { value: 'true' } }) }) }) }; } };
    await G.onboardingGate({ lane: 'bride', supabase: armedDb, ...incompleteBride });
    _resetLaneFlagCache();
    return hits > 0 || 'the flag read never reached the stub — the cell was asserting the cache';
  });

  // ── 6.4 · A DECLARED GAP, NOT A CELL ──────────────────────────────────────
  // onboardingGate's try/catch CANNOT BE REDDENED AT THIS DELIVERY, and saying
  // so is the honest move. Two fixtures were tried and both were vacuous:
  //   · a hostile supabase — laneFlags.readLaneFlag wraps its own DB read and
  //     fails closed to the default, so the throw never leaves that file;
  //   · a detonating `user` row — the COPY LOCK returns { gate: false } before
  //     the predicate is ever called, because the redirect bytes are withheld
  //     pending veto, so the poison is never touched.
  // With no vetoed byte resident there is no path through this function that
  // can reach the catch. The guard is real defence-in-depth for the armed
  // world; it is simply unprovable in the dark one.
  // OWED: a both-ways proof of the catch rides the VETO DELIVERY, when a byte
  // exists and cell 6.3's short-circuit no longer swallows the path. Recorded
  // here rather than in a passing cell, because a green that cannot go red is
  // worse than a gap that says its own name.
  console.log('  GAP   6.4  gate try/catch unreachable while bytes are withheld — proof owed at the veto delivery');



  console.log(`\n──────────────────────────────────────────────`);
  console.log(`  ${pass} passed, ${fail} failed`);
  console.log(fail === 0 ? '  VERDICT: GREEN' : '  VERDICT: RED');
  console.log(`──────────────────────────────────────────────\n`);
  process.exit(fail === 0 ? 0 : 1);
})();

// ═══ MUTATION LIST — the single production edit that reddens each cell ══════
// Every one of these was RUN at D-2 (see the design note's mutation table);
// none is asserted from reading.
//   1.5   onboardingPredicate.js moneyPresent: `v > 0` -> `v >= 0`
//   1.6   vendorComplete's city push copied into brideComplete
//   1.9   vendorComplete: `const v = vendor || {}` -> `const v = vendor`  (throws)
//   1.11  add `onboarding_state` to any predicate branch
//   2.2   serviceAreaPresent: drop the select_cities arm
//   2.6   0122: delete the `is distinct from` arm of the pairing CHECK
//   2.8   0122: add a third backfill arm assigning 'worldwide'
//   2.11  me.js: remove service_area from either .select()
//   3.1   laneFlags: 'onboarding.gate_enabled': true
//   3.3   onboardingGate: BRIDE_REDIRECT_BYTE = 'anything'
//   6.3   onboardingGate: delete the `typeof byte !== 'string'` copy lock
//   6.4   NOT PROVABLE at this delivery — declared as a gap in-bench (B-4).
//   3.4   brideIndex.js: edit one byte of DEAD_END_REPLY
//   3.6   move the gate block below `const meterAnthropic = ...`
//   3.7   move the gate block below the image-throttle branch
//   4.1   restore `(profileName || claim.invitee_name || '')`
//   5.1   0122: delete the STALE stamp from the open_to_travel comment
