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

// ── LABELLED AMENDMENT (D-3, CE-32 ruling ⓵) · cells 1.7-1.10 ───────────────
// The predicate learned a SIXTH mandatory field (business_name), so four D-2
// cells that described a five-field world are amended to describe a six-field
// one. This is the ruling landing in the bench, not a cell being loosened to
// keep a green: every amendment below makes the assertion STRICTER (one more
// field must be present) and 1.9's count moves UP. Ratify-or-revert.
cell('1.7', 'vendor complete on all SIX fields (CE-32 ruling ⓵)', () =>
  P.vendorComplete({ name: 'Swati' }, {
    business_name: 'Swati Roy Studio',
    category: 'photography', city: 'Delhi', rate_min: 80000,
    service_area: 'pan_india', service_cities: null,
  }).complete === true || 'expected complete');

cell('1.8', 'vendor missing service_area is incomplete and says so', () => {
  const v = P.vendorComplete({ name: 'S' }, { business_name: 'B', category: 'c', city: 'D', rate_min: 1 });
  return (v.complete === false && v.missing.join(',') === 'service_area') || `got ${JSON.stringify(v)}`;
});

cell('1.9', 'a brand-new vendor (no vendors row) is incomplete on every field', () => {
  const v = P.vendorComplete({ name: null }, undefined);
  return (v.complete === false && v.missing.length === 6) || `got ${JSON.stringify(v)}`;
});

cell('1.10', 'rate_display=false does not gate — hiding a price is not withholding it', () =>
  P.vendorComplete({ name: 'S' }, {
    business_name: 'B', category: 'c', city: 'D', rate_min: 50000,
    service_area: 'worldwide', service_cities: null, rate_display: false,
  }).complete === true || 'display state held the door');

cell('1.11', 'R-OB.8 IN BYTES: the predicate file never reads onboarding_state', () =>
  !read('src/lib/onboardingPredicate.js').split('\n')
    .filter(l => !l.trim().startsWith('//'))
    .join('\n').includes('onboarding_state')
  || 'onboarding_state reached the predicate outside a comment');

// ── D-3 · THE SIXTH FIELD, IN ITS OWN CELLS (CE-32 ruling ⓵) ────────────────

cell('1.12', 'business_name is MANDATORY: everything else present, still incomplete', () => {
  const v = P.vendorComplete({ name: 'Swati' }, {
    category: 'photography', city: 'Delhi', rate_min: 80000,
    service_area: 'pan_india', service_cities: null,
  });
  return (v.complete === false && v.missing.join(',') === 'business_name')
    || `got ${JSON.stringify(v)}`;
});

cell('1.13', "the two names are NOT interchangeable — a studio name is not a person's name", () => {
  // The reading CE-32 ruled: users.name and vendors.business_name are two
  // fields, not one word meaning two tables. Each alone leaves the other missing.
  const onlyPerson = P.vendorComplete({ name: 'Swati' }, {
    category: 'photography', city: 'Delhi', rate_min: 1, service_area: 'worldwide', service_cities: null });
  const onlyStudio = P.vendorComplete({ name: null }, {
    business_name: 'Swati Roy Studio',
    category: 'photography', city: 'Delhi', rate_min: 1, service_area: 'worldwide', service_cities: null });
  return (onlyPerson.missing.join(',') === 'business_name' && onlyStudio.missing.join(',') === 'name')
    || `person:${JSON.stringify(onlyPerson.missing)} studio:${JSON.stringify(onlyStudio.missing)}`;
});

cell('1.14', 'VENDOR_FIELDS is the SIX-field interface OB-P keys off, in report order', () =>
  P.VENDOR_FIELDS.join(',') === 'name,business_name,category,city,starting_price,service_area'
  || `got ${P.VENDOR_FIELDS.join(',')}`);

cell('1.15', 'VENDOR_FIELDS and vendorComplete cannot drift apart', () => {
  // R-31.1 posture: the cell DERIVES the missing-list from a fully-empty vendor
  // rather than repeating the author's list, so a field added to the vocabulary
  // and forgotten in the function (or the reverse) reddens here.
  const v = P.vendorComplete({}, {});
  return v.missing.join(',') === P.VENDOR_FIELDS.join(',')
    || `vocabulary=${P.VENDOR_FIELDS.join(',')} predicate=${v.missing.join(',')}`;
});

cell('1.16', 'whitespace is not a business name', () =>
  P.vendorComplete({ name: 'S' }, {
    business_name: '   ', category: 'c', city: 'D', rate_min: 1,
    service_area: 'worldwide', service_cities: null,
  }).missing.includes('business_name') || 'whitespace passed as a business name');

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

cell('2.12', 'THE BOUND MIRROR: me.js and the predicate refuse in IDENTICAL WORDS (parity arbiter = the predicate)', () => {
  // D-3 gave the endpoint its own edge-validator in onboardingPredicate.js
  // rather than re-pointing me.js's (whose bytes cell 2.10 pins and whose radius
  // is additive-only this sitting). Two copies of one rule is a drift engine
  // unless the drift is mechanical to catch — so it is caught here. The day
  // either sentence moves a character, this reddens; the day a sitting re-homes
  // me.js onto the predicate, this cell retires WITH the duplication.
  const meJs = read('src/api/vendor/me.js');
  const pred = read('src/lib/onboardingPredicate.js');
  const SENTENCES = [
    "'service_area and service_cities must be sent together.'",
    '"service_area must be one of: "',
    "'service_cities must name at least one city when service_area is select_cities.'",
    "'service_cities must be null unless service_area is select_cities.'",
  ];
  const missing = SENTENCES.filter(x => !(meJs.includes(x) && pred.includes(x)));
  return missing.length === 0 || `sentences not present in BOTH homes: ${missing.length}`;
});

console.log('\n=== §3 · THE GATE IS DARK (R-OB.9) and the copy lock is independent ===');

const stubDb = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) };
const incompleteBride = { user: { name: null }, row: { budget_total: null } };

cell('3.1', 'flag is registered in the lane-flag census, OFF at birth', () => {
  const s = read('src/lib/laneFlags.js');
  return /'onboarding\.gate_enabled':\s*false/.test(s) || 'flag missing or not default-off';
});

// ── LABELLED AMENDMENT (D-3) · cell 3.3 flips from NULL-ASSERT to PIN-ASSERT ─
// At D-2 this cell's job was to prove no UNVETOED byte had crept in. The veto
// arrived 2026-08-12, so the same cell now does the stronger version of the same
// job: it pins both sentences CHARACTER-FOR-CHARACTER. The assertion did not
// weaken when the bytes landed — it became specific. Ratify-or-revert.
//
// APPROVED-COPY-CARRIES-ITS-HASH: the two literals below are the founder's own
// bytes. An edited comma reddens this cell, which is the entire point — copy
// may not ride a refactor.
const BRIDE_BYTE_VETOED  = 'Hi! Before we start planning, head over to thedreamwedding.in, sign in and fill in the details about your wedding.';
const VENDOR_BYTE_VETOED = 'Hi! Before I can start working for you, I need your business details. Head over to thedreamwedding.in and set up your profile.';

cell('3.3', 'THE BRIDE BYTE IS PINNED, character-for-character', () =>
  G._REDIRECT_BYTES.bride === BRIDE_BYTE_VETOED
  || `the bride byte is not the vetoed sentence: ${JSON.stringify(G._REDIRECT_BYTES.bride)}`);

cell('3.3b', 'THE VENDOR BYTE IS PINNED, character-for-character', () =>
  G._REDIRECT_BYTES.vendor === VENDOR_BYTE_VETOED
  || `the vendor byte is not the vetoed sentence: ${JSON.stringify(G._REDIRECT_BYTES.vendor)}`);

cell('3.3c', 'ONE HOST, both lanes — and no draft host survives anywhere in the gate', () => {
  const g = read('src/lib/onboardingGate.js');
  const bothOnHost = G._REDIRECT_BYTES.bride.includes('thedreamwedding.in')
                  && G._REDIRECT_BYTES.vendor.includes('thedreamwedding.in');
  // The D-2 drafts pointed vendors at thedreamai.in; the founder consolidated to
  // one host. A cell that only checked the new host would stay green if the old
  // one came back beside it.
  //
  // COMMENTS STRIPPED, per the standing bench law — and this cell EARNED that
  // clause the honest way: it first reddened on the very comment four lines
  // above, which names the retired host as history. A check a comment can absorb
  // is a check on the comment. Prose may discuss the old host forever; a LITERAL
  // is what reddens.
  const gCode = g.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  const noOldHost = !/thedreamai\.in/.test(gCode);
  return (bothOnHost && noOldHost) || `oneHost=${bothOnHost} noOldHost=${noOldHost}`;
});

cell('3.3d', 'the copy LOCK survives the bytes landing — it guards the next sitting', () => {
  const g = read('src/lib/onboardingGate.js');
  return (g.includes("typeof byte !== 'string'") && g.includes('byte.trim().length === 0'))
    || 'the copy lock was retired when the bytes arrived — a null byte would now reach a stranger';
});

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

  // ── LABELLED AMENDMENT (D-3) · cell 6.3 keeps its QUESTION, changes its FIXTURE
  // D-2 could ask "does an armed flag gate with no vetoed byte?" using the real
  // module, because the real module's bytes WERE null. They are vetoed now, so
  // that fixture is gone — and the honest move is not to delete the cell (the
  // lock still guards every future sitting that nulls a byte or trims one to
  // whitespace) but to build the fixture the question now needs.
  //
  // THE FIXTURE IS DERIVED FROM THE PRODUCTION FILE, never hand-written: the
  // gate's own source is read, its two byte constants are nulled, its two
  // relative requires are re-pointed at the REAL laneFlags and the REAL
  // predicate, and the result is loaded as a module. So the lock under test is
  // the shipped lock — delete it in production and this copy loses it too, and
  // the cell reddens. A hand-written imitation of the lock would have proved
  // only that the bench can write an if-statement.
  await acell('6.3', 'COPY LOCK: an armed flag with a NULLED byte still does not gate', async () => {
    _resetLaneFlagCache();
    const os  = require('os');
    const src = read('src/lib/onboardingGate.js')
      .replace(/const BRIDE_REDIRECT_BYTE\s*=\s*'[^']*';/,  'const BRIDE_REDIRECT_BYTE  = null;')
      .replace(/const VENDOR_REDIRECT_BYTE\s*=\s*'[^']*';/, 'const VENDOR_REDIRECT_BYTE = null;')
      .replace("require('./laneFlags')",          JSON.stringify(path.join(ROOT, 'src/lib/laneFlags')).replace(/^/, 'require('). replace(/$/, ')'))
      .replace("require('./onboardingPredicate')", JSON.stringify(path.join(ROOT, 'src/lib/onboardingPredicate')).replace(/^/, 'require(').replace(/$/, ')'));
    if (/= *'/.test(src.match(/const BRIDE_REDIRECT_BYTE[^\n]*/)[0])) {
      return 'the byte-nulling rewrite did not take — the fixture would have tested the shipped byte';
    }
    const tmp = path.join(os.tmpdir(), `ob_gate_copylock_${process.pid}.js`);
    fs.writeFileSync(tmp, src);
    let verdict;
    try {
      const NulledGate = require(tmp);
      if (NulledGate._REDIRECT_BYTES.bride !== null) return 'the nulled copy still carries a byte';
      const armedDb = { from: () => ({ select: () => ({ eq: () => ({
        maybeSingle: async () => ({ data: { value: 'true' } }) }) }) }) };
      const r = await NulledGate.onboardingGate({ lane: 'bride', supabase: armedDb, ...incompleteBride });
      verdict = r.gate === false || 'an armed flag gated with no vetoed byte — a stranger would meet silence';
    } finally {
      fs.unlinkSync(tmp);
      _resetLaneFlagCache();
    }
    return verdict;
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

  // ── 6.4 · THE D-2 GAP, CLOSED (CE-32 ruling fork a) ───────────────────────
  // B-4 declared this unprovable and OWED the proof at the veto delivery. Both
  // of D-2's fixtures were hollow for reasons that no longer hold or never did:
  //   · a hostile supabase — laneFlags.readLaneFlag wraps its own DB read and
  //     fails closed inside that file, so the throw never reaches this catch.
  //     STILL TRUE, and still the wrong door to knock on.
  //   · a detonating row — the COPY LOCK returned before the predicate was ever
  //     called, because the bytes were withheld. NO LONGER TRUE: the bytes are
  //     vetoed and resident, so the lock passes and the predicate runs.
  // THE THIRD SHAPE: a `user` object whose `name` is a THROWING GETTER. The
  // predicate's very first touch is textPresent(user && user.name), so the
  // detonation happens INSIDE vendorComplete, INSIDE the gate's try. The
  // anti-vacuity flag proves the getter actually fired — B-3's lesson applied
  // to a fixture rather than a cache: assert your fixture was consulted, never
  // merely that the answer was the one you wanted.
  await acell('6.4', 'the gate FAILS OPEN on a detonating predicate — the try/catch is REAL', async () => {
    _resetLaneFlagCache();
    let detonated = false;
    const armedDb = { from: () => ({ select: () => ({ eq: () => ({
      maybeSingle: async () => ({ data: { value: 'true' } }) }) }) }) };
    const poisoned = { get name() { detonated = true; throw new Error('detonated inside the predicate'); } };
    const r = await G.onboardingGate({ lane: 'vendor', supabase: armedDb, user: poisoned, row: {} });
    _resetLaneFlagCache();
    if (!detonated) return 'the poisoned getter was never touched — this cell proved nothing (the B-4 class)';
    return r.gate === false || `the throw escaped the gate: ${JSON.stringify(r)}`;
  });

  await acell('6.5', 'ARMED + COMPLETE still passes — the gate refuses only the incomplete', async () => {
    _resetLaneFlagCache();
    const armedDb = { from: () => ({ select: () => ({ eq: () => ({
      maybeSingle: async () => ({ data: { value: 'true' } }) }) }) }) };
    const r = await G.onboardingGate({ lane: 'vendor', supabase: armedDb,
      user: { name: 'Swati' },
      row: { business_name: 'Swati Roy Studio', category: 'photography', city: 'Delhi',
             rate_min: 80000, service_area: 'pan_india', service_cities: null } });
    _resetLaneFlagCache();
    return r.gate === false || `a complete vendor was gated: ${JSON.stringify(r)}`;
  });

  await acell('6.6', 'ARMED + INCOMPLETE now SPEAKS THE VETOED BYTE and names what is missing', async () => {
    // The first end-to-end proof that the armed gate produces the founder's own
    // sentence — impossible at D-2 by construction, since there was no sentence.
    _resetLaneFlagCache();
    const armedDb = { from: () => ({ select: () => ({ eq: () => ({
      maybeSingle: async () => ({ data: { value: 'true' } }) }) }) }) };
    const r = await G.onboardingGate({ lane: 'vendor', supabase: armedDb,
      user: { name: 'Swati' },
      row: { category: 'photography', city: 'Delhi', rate_min: 80000,
             service_area: 'pan_india', service_cities: null } });
    _resetLaneFlagCache();
    return (r.gate === true
         && r.byte === VENDOR_BYTE_VETOED
         && r.missing.join(',') === 'business_name')
      || `got ${JSON.stringify(r)}`;
  });

  await acell('6.7', 'the bride lane speaks the BRIDE byte, never the vendor one', async () => {
    _resetLaneFlagCache();
    const armedDb = { from: () => ({ select: () => ({ eq: () => ({
      maybeSingle: async () => ({ data: { value: 'true' } }) }) }) }) };
    const r = await G.onboardingGate({ lane: 'bride', supabase: armedDb, ...incompleteBride });
    _resetLaneFlagCache();
    return (r.gate === true && r.byte === BRIDE_BYTE_VETOED)
      || `the bride lane's byte is wrong: ${JSON.stringify(r)}`;
  });


  console.log('\n=== §7 · THE ENDPOINT — F-OB.2 CURED, driven through the REAL route handler ===');

  // ── THE HARNESS ───────────────────────────────────────────────────────────
  // The router is required and its FINAL route handler is pulled off express's
  // own stack, so these cells drive THE SHIPPED FUNCTION — not a copy of its
  // logic, and not the middleware chain (requireAuth/resolveVendor are
  // authentication, not this cure). asyncHandler does not return its promise,
  // so the response object resolves a deferred and the cell awaits THAT; a
  // handler that never answers fails on the timeout instead of hanging the run.
  const onboardingRouter = require('../src/api/vendor/onboarding');
  const routeLayer = onboardingRouter.stack.find(l => l.route && l.route.path === '/');
  const realHandler = routeLayer && routeLayer.route.stack[routeLayer.route.stack.length - 1].handle;

  function fakeDb({ user, vendorRow }) {
    const writes = { users: [], vendors: [], vendor_state: [] };
    const db = {
      from(table) {
        return {
          select() {
            return {
              eq(col) {
                return {
                  maybeSingle: async () => {
                    if (table === 'users')  return { data: user };
                    // the handle-collision probe must find nobody, or every
                    // candidate is taken and the fallback fires
                    if (table === 'vendors' && col === 'routing_handle') return { data: null };
                    if (table === 'vendors') return { data: vendorRow };
                    return { data: null };
                  },
                };
              },
            };
          },
          update(payload) {
            return { eq: async () => { writes[table].push(payload); return { error: null }; } };
          },
          upsert: async (payload) => { writes[table].push(payload); return { error: null }; },
        };
      },
    };
    return { db, writes };
  }

  async function callEndpoint({ body, user, vendorRow }) {
    const { db, writes } = fakeDb({ user, vendorRow });
    let resolve;
    const answered = new Promise((r) => { resolve = r; });
    const res = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      json(payload) { resolve({ status: this.statusCode, body: payload }); return this; },
    };
    const req = { body, vendor: vendorRow, app: { locals: { supabase: db } } };
    realHandler(req, res, (e) => resolve({ status: 500, body: { ok: false, error: String(e && e.message) } }));
    const answer = await Promise.race([
      answered,
      new Promise((r) => setTimeout(() => r({ status: 0, body: { ok: false, error: 'the handler never answered' } }), 4000)),
    ]);
    return { ...answer, writes };
  }

  const VENDOR_USER  = { name: 'Swati', phone: '+919888294440' };
  const VIRGIN_ROW   = { id: 'v-1', user_id: 'u-1', business_name: null, category: null, city: null,
                         rate_min: null, service_area: null, service_cities: null, routing_handle: null,
                         instagram_handle: null };
  const SIX_FIELDS   = { name: 'Swati', business_name: 'Swati Roy Studio', category: 'photography',
                         city: 'Delhi', rate_min: 80000, service_area: 'pan_india', service_cities: null };

  await acell('7.1', 'the route handler is REACHABLE — the harness drives shipped code', async () =>
    typeof realHandler === 'function' || 'the real handler was not found on the router stack');

  await acell('7.2', 'F-OB.2 REPRODUCED AND REFUSED: city alone no longer completes anything', async () => {
    // THE UNCURED SHAPE, exactly as the live PWA sends it today. At the uncured
    // tree this returned 200 with onboarding_state='complete' written over a row
    // holding none of the six. That is the finding, and this is its cell.
    const r = await callEndpoint({ body: { city: 'Delhi' }, user: { name: null, phone: '+919888294440' }, vendorRow: VIRGIN_ROW });
    return (r.status === 400 && r.body.code === 'INCOMPLETE' && r.body.ok === false)
      || `city alone got ${r.status} ${JSON.stringify(r.body)}`;
  });

  await acell('7.3', 'the refusal is ATOMIC — an incomplete submission writes NOTHING', async () => {
    const r = await callEndpoint({ body: { city: 'Delhi', business_name: 'Studio' }, user: { name: null, phone: '+91988' }, vendorRow: VIRGIN_ROW });
    const total = r.writes.users.length + r.writes.vendors.length + r.writes.vendor_state.length;
    return (r.status === 400 && total === 0)
      || `status=${r.status} writes=${JSON.stringify(r.writes)}`;
  });

  await acell('7.4', 'missing[] is HONEST — it names every absent field, in interface order', async () => {
    const r = await callEndpoint({ body: { city: 'Delhi' }, user: { name: null, phone: '+91988' }, vendorRow: VIRGIN_ROW });
    return (r.body.missing.join(',') === 'name,business_name,category,starting_price,service_area')
      || `got ${JSON.stringify(r.body.missing)}`;
  });

  await acell('7.5', 'the SIXTH FIELD holds the door at the endpoint too (ruling ⓵ end to end)', async () => {
    const body = { ...SIX_FIELDS }; delete body.business_name;
    const r = await callEndpoint({ body, user: VENDOR_USER, vendorRow: VIRGIN_ROW });
    return (r.status === 400 && r.body.missing.join(',') === 'business_name')
      || `got ${r.status} ${JSON.stringify(r.body)}`;
  });

  await acell('7.6', "COMPLETE writes 'complete' — and only the predicate can say so", async () => {
    const r = await callEndpoint({ body: SIX_FIELDS, user: VENDOR_USER, vendorRow: VIRGIN_ROW });
    const w = r.writes.vendors[0] || {};
    return (r.status === 200 && r.body.ok === true && w.onboarding_state === 'complete'
            && w.category === 'photography' && w.rate_min === 80000
            && w.service_area === 'pan_india' && w.business_name === 'Swati Roy Studio')
      || `status=${r.status} write=${JSON.stringify(w)}`;
  });

  await acell('7.7', 'CATEGORY IS COLLECTED AND WRITTEN — the field with no vendor-reachable writer gets one', async () => {
    // design-note ⓶: category is LOCKED in me.js and its only live writers were
    // the retiring conversational flow and admin. This is the writer that keeps
    // it fillable after the retirement — collected BEFORE it, per the seal.
    const r = await callEndpoint({ body: SIX_FIELDS, user: VENDOR_USER, vendorRow: VIRGIN_ROW });
    return (r.writes.vendors[0] && r.writes.vendors[0].category === 'photography')
      || `category was not written: ${JSON.stringify(r.writes.vendors[0])}`;
  });

  await acell('7.8', 'an unknown category is REFUSED against the locked taxonomy, not written raw', async () => {
    const r = await callEndpoint({ body: { ...SIX_FIELDS, category: 'drone guy' }, user: VENDOR_USER, vendorRow: VIRGIN_ROW });
    const total = r.writes.users.length + r.writes.vendors.length;
    return (r.status === 400 && r.body.code === 'CATEGORY_UNKNOWN' && total === 0)
      || `status=${r.status} code=${r.body.code} writes=${total}`;
  });

  // ── LABELLED AMENDMENT (founder ruling, 2026-08-12) · cell 7.9 ─────────────
  // WRITTEN FOR THE ENUMERATING DRAFT, RETIRED WITH IT. 7.9 asserted the
  // refusal SENTENCE named all 16 tokens; the founder refused that sentence in
  // favour of a taxonomy-agnostic one, so the cell's old question no longer has
  // a right answer. Its DURABLE half — "one taxonomy, never a second list" —
  // survives here in a stronger, behavioural form, and its copy half moved to
  // 7.21/7.22. RETIRE-WITH-THE-READER, applied to a bench cell: the ruling that
  // retires a byte owns the cell that read it. Ratify-or-revert.
  await acell('7.9', 'EVERY token the estate defines is ACCEPTED — no second, narrower list', async () => {
    // R-31.1 posture: the cell enumerates the taxonomy ITSELF and drives one
    // submission per token, rather than repeating a list the author typed. A
    // hardcoded allowlist in the endpoint that had fallen behind the taxonomy
    // would redden here — which is exactly the drift a mirrored map produces.
    const { VENDOR_CATEGORIES } = require('../src/agent/categories');
    const refused = [];
    for (const token of VENDOR_CATEGORIES) {
      const r = await callEndpoint({ body: { ...SIX_FIELDS, category: token }, user: VENDOR_USER, vendorRow: VIRGIN_ROW });
      if (r.status !== 200 || r.writes.vendors[0].category !== token) refused.push(token);
    }
    return refused.length === 0 || `the estate defines ${VENDOR_CATEGORIES.length} tokens; the endpoint refuses ${refused.length}: ${refused.join(',')}`;
  });

  await acell('7.10', 'the service-area pair is refused in the SHIPPED sentence, not a new one', async () => {
    const r = await callEndpoint({ body: { ...SIX_FIELDS, service_area: 'select_cities', service_cities: [] }, user: VENDOR_USER, vendorRow: VIRGIN_ROW });
    return (r.status === 400 && r.body.code === 'SERVICE_AREA_INVALID'
            && r.body.error === 'service_cities must name at least one city when service_area is select_cities.')
      || `got ${r.status} ${JSON.stringify(r.body)}`;
  });

  await acell('7.11', 'FORK C · open_to_travel IS NOT WRITTEN — 0122\'s stamp is obeyed', async () => {
    const r = await callEndpoint({ body: { ...SIX_FIELDS, open_to_travel: true }, user: VENDOR_USER, vendorRow: VIRGIN_ROW });
    const w = r.writes.vendors[0] || {};
    return (r.status === 200 && !('open_to_travel' in w))
      || `the stale field was written despite the stamp: ${JSON.stringify(w)}`;
  });

  await acell('7.12', 'a RETURNING vendor is not re-asked for facts already on file (body over row)', async () => {
    // Validating the body alone would refuse a vendor for what she filled last
    // week. The predicate reads the MERGED shape.
    const halfFilled = { ...VIRGIN_ROW, category: 'photography', city: 'Delhi', rate_min: 80000,
                         service_area: 'pan_india', service_cities: null };
    const r = await callEndpoint({ body: { business_name: 'Swati Roy Studio' }, user: VENDOR_USER, vendorRow: halfFilled });
    return (r.status === 200 && r.writes.vendors[0].onboarding_state === 'complete')
      || `a returning vendor was refused: ${r.status} ${JSON.stringify(r.body)}`;
  });

  await acell('7.13', 'a blank price is MISSING, not zero — the blank-box class F-OB.2 belongs to', async () => {
    const r = await callEndpoint({ body: { ...SIX_FIELDS, rate_min: 0 }, user: VENDOR_USER, vendorRow: VIRGIN_ROW });
    return (r.status === 400 && r.body.missing.join(',') === 'starting_price')
      || `got ${r.status} ${JSON.stringify(r.body)}`;
  });

  await acell('7.18', 'a blank price box does NOT clobber a price already on file', async () => {
    // THIS CELL EXISTS BECAUSE A MUTATION FOUND NOTHING. Flipping coerceRateMin's
    // `n > 0` to `n >= 0` reddened no cell: the predicate refuses 0 anyway, so on
    // a VIRGIN row both readings end at the same refusal. The difference is only
    // visible on a RETURNING vendor — where `>= 0` turns an empty numeric input
    // into a real 0 that overwrites the ₹80,000 she saved last week, and the
    // predicate then refuses her for a field she had already filled. A guard
    // whose only cell is satisfied by a different guard is an unproven guard.
    const priced = { ...VIRGIN_ROW, business_name: 'Swati Roy Studio', category: 'photography',
                     city: 'Delhi', rate_min: 80000, service_area: 'pan_india', service_cities: null };
    const r = await callEndpoint({ body: { rate_min: 0 }, user: VENDOR_USER, vendorRow: priced });
    return (r.status === 200 && r.writes.vendors[0].rate_min === 80000)
      || `the blank box reached the row: ${r.status} ${JSON.stringify(r.writes.vendors[0] || r.body)}`;
  });

  await acell('7.14', 'a formatted price is understood, not refused ("80,000")', async () => {
    const r = await callEndpoint({ body: { ...SIX_FIELDS, rate_min: '80,000' }, user: VENDOR_USER, vendorRow: VIRGIN_ROW });
    return (r.status === 200 && r.writes.vendors[0].rate_min === 80000)
      || `got ${r.status} ${JSON.stringify(r.writes.vendors[0])}`;
  });

  await acell('7.15', "the person's name reaches users.name, not the vendors row", async () => {
    const r = await callEndpoint({ body: SIX_FIELDS, user: { name: null, phone: '+919888294440' }, vendorRow: VIRGIN_ROW });
    return (r.writes.users.length === 1 && r.writes.users[0].name === 'Swati'
            && !('name' in (r.writes.vendors[0] || {})))
      || `users=${JSON.stringify(r.writes.users)} vendors=${JSON.stringify(r.writes.vendors[0])}`;
  });

  await acell('7.19', 'THE INCOMPLETE REFUSAL IS PINNED, character-for-character (vetoed 2026-08-12)', async () => {
    // APPROVED-COPY-CARRIES-ITS-HASH. The founder vetoed this sentence at the
    // D-3 relay; it is frozen at the byte, not at the meaning, and it may not
    // ride a refactor. A use-site alone is not a pin: a cell that only checked
    // the endpoint returns SOME error would stay green through a rewrite.
    const r = await callEndpoint({ body: { city: 'Delhi' }, user: { name: null, phone: '+91988' }, vendorRow: VIRGIN_ROW });
    return r.body.error === 'A few details are still needed before your profile is live.'
      || `the vetoed sentence moved: ${JSON.stringify(r.body.error)}`;
  });

  await acell('7.20', 'THE CATEGORY REFUSAL IS PINNED, character-for-character (vetoed 2026-08-12)', async () => {
    // APPROVED-COPY-CARRIES-ITS-HASH. Note the ASCII apostrophe: a smart-quote
    // substitution by an editor is a silent copy edit, and this cell is where
    // it stops being silent.
    const r = await callEndpoint({ body: { ...SIX_FIELDS, category: 'drone guy' }, user: VENDOR_USER, vendorRow: VIRGIN_ROW });
    return r.body.error === "That isn't one of our categories. Please pick one from the list."
      || `the vetoed sentence moved: ${JSON.stringify(r.body.error)}`;
  });

  await acell('7.21', 'THE SENTENCE NAMES NO CATEGORY — it must survive the taxonomy moving', async () => {
    // The founder ruled the enumerating draft OUT because the taxonomy is under
    // revision. This cell is that ruling made mechanical: if a later sitting
    // "helpfully" folds the list back into the sentence, the copy silently
    // acquires an expiry date again, and this reddens.
    const { VENDOR_CATEGORIES } = require('../src/agent/categories');
    const r = await callEndpoint({ body: { ...SIX_FIELDS, category: 'drone guy' }, user: VENDOR_USER, vendorRow: VIRGIN_ROW });
    const leaked = VENDOR_CATEGORIES.filter(t => r.body.error.includes(t));
    return leaked.length === 0 || `the sentence names ${leaked.length} token(s) — it will expire with the taxonomy`;
  });

  await acell('7.22', 'allowed[] CARRIES THE LIST AS DATA, derived from the taxonomy, never restated', async () => {
    // The other half of the founder's ruling: the human sentence is frozen, the
    // machine list is live. Derived by comparing against the taxonomy module
    // itself, so a hardcoded second copy in the endpoint reddens here rather
    // than drifting quietly (F-04.36's mirrored-map class).
    const { VENDOR_CATEGORIES } = require('../src/agent/categories');
    const r = await callEndpoint({ body: { ...SIX_FIELDS, category: 'drone guy' }, user: VENDOR_USER, vendorRow: VIRGIN_ROW });
    return (Array.isArray(r.body.allowed)
            && r.body.allowed.join(',') === VENDOR_CATEGORIES.join(',')
            && r.body.code === 'CATEGORY_UNKNOWN')
      || `allowed=${JSON.stringify(r.body.allowed)}`;
  });

  await acell('7.16', 'R-OB.8 IN BYTES AT THE ENDPOINT: onboarding_state is WRITTEN, never READ as the predicate', () => {
    // SELF-CORRECTION, on the record: this cell first counted OCCURRENCES and
    // reddened at 2 — the write and the 200's honest echo of it. Counting a
    // token is not asking the question. R-OB.8 forbids READING the marker to
    // decide anything; it says nothing about writing it or reporting it back.
    // The cell now looks for the shapes a READ would take.
    const code = read('src/api/vendor/onboarding.js').split('\n')
      .filter(l => !l.trim().startsWith('//')).join('\n');
    const readShapes = [
      /vendor\.onboarding_state/,          // branching on the row's marker
      /onboarding_state\s*===/,            // comparing it
      /onboarding_state\s*!==/,
      /if\s*\([^)]*onboarding_state/,       // any conditional over it
      /select\([^)]*onboarding_state/,     // fetching it in order to consult it
    ].filter(re => re.test(code));
    const written = /onboarding_state:\s*'complete'/.test(code);
    return (readShapes.length === 0 && written)
      || `readShapes=${readShapes.length} written=${written}`;
  });

  await acell('7.17', 'the endpoint reads the ONE PREDICATE HOME and re-derives nothing locally', () => {
    const code = read('src/api/vendor/onboarding.js').split('\n')
      .filter(l => !l.trim().startsWith('//')).join('\n');
    const requiresHome = /require\(['"]\.\.\/\.\.\/lib\/onboardingPredicate['"]\)/.test(code)
                      && /vendorComplete\(/.test(code);
    // COMMON's whole point: a third reader that re-derives completeness is a
    // fourth definition. A local re-implementation would name these columns.
    const reDerives = /rate_min\s*>\s*0/.test(code) || /trim\(\)\.length\s*>\s*0\s*&&.*category/.test(code);
    return (requiresHome && !reDerives) || `requiresHome=${requiresHome} reDerives=${reDerives}`;
  });

  // R-30.5/.7/.8 — A SUMMARY SPEAKS ITS ENVIRONMENT: total · run · skipped, and
  // the reason names ANY missing precondition. Nothing in this file is
  // environment-conditional — no database, no network, no sibling repo — so
  // skipped is 0 and says why it is 0 rather than leaving a reader to assume
  // the run was whole. A bench that can silently skip and still print GREEN is
  // the census's own finding (F-06.196).
  const total = pass + fail;
  console.log(`\n──────────────────────────────────────────────`);
  console.log(`  total ${total} · run ${total} · skipped 0 (no environment-conditional cells: no DB, no network, no sibling repo)`);
  console.log(`  ${pass} passed, ${fail} failed`);
  console.log(fail === 0 ? '  VERDICT: GREEN' : '  VERDICT: RED');
  console.log(`──────────────────────────────────────────────\n`);
  process.exit(fail === 0 ? 0 : 1);
})();

// ═══ MUTATION LIST — the single production edit that reddens each cell ══════
// D-2's seventeen were RUN at D-2 (its design note carries the table). Every
// D-3 line below was RUN AT D-3 against the production tree, the bench re-run,
// and the file restored — none is asserted from reading.
//
// ── D-2's, carried forward ─────────────────────────────────────────────────
//   1.5   onboardingPredicate.js moneyPresent: `v > 0` -> `v >= 0`
//   1.6   vendorComplete's city push copied into brideComplete
//   1.9   vendorComplete: `const v = vendor || {}` -> `const v = vendor`  (throws)
//   1.11  add `onboarding_state` to any predicate branch
//   2.2   serviceAreaPresent: drop the select_cities arm
//   2.6   0122: delete the `is distinct from` arm of the pairing CHECK
//   2.8   0122: add a third backfill arm assigning 'worldwide'
//   2.11  me.js: remove service_area from either .select()
//   3.1   laneFlags: 'onboarding.gate_enabled': true
//   3.4   brideIndex.js: edit one byte of DEAD_END_REPLY
//   3.6   move the gate block below `const meterAnthropic = ...`
//   3.7   move the gate block below the image-throttle branch
//   4.1   restore `(profileName || claim.invitee_name || '')`
//   5.1   0122: delete the STALE stamp from the open_to_travel comment
//
// ── D-3's ──────────────────────────────────────────────────────────────────
//   1.12  vendorComplete: delete the business_name push
//   1.14  VENDOR_FIELDS: drop 'business_name' from the array
//   1.15  VENDOR_FIELDS: add a seventh field the predicate does not check
//   2.12  me.js OR onboardingPredicate.js: edit one character of any of the
//         four service-area sentences (the drift this parity cell exists for)
//   3.3   onboardingGate: change one character of BRIDE_REDIRECT_BYTE
//   3.3b  onboardingGate: change one character of VENDOR_REDIRECT_BYTE
//   3.3c  onboardingGate: point either byte at thedreamai.in
//   3.3d  onboardingGate: delete the `typeof byte !== 'string'` copy lock
//   6.3   onboardingGate: delete the copy lock (the nulled-byte copy is DERIVED
//         from the production file, so the lock vanishes from the fixture too)
//   6.4   onboardingGate: delete the try/catch  ← THE D-2 GAP, NOW PROVABLE
//   6.6   onboardingGate: return the bride byte on the vendor lane
//   7.2   onboarding.js: delete the `if (!verdict.complete)` refusal
//   7.3   onboarding.js: move either write above the predicate check
//   7.6   onboarding.js: drop onboarding_state from vendorUpdate
//   7.8   onboarding.js: delete the VENDOR_CATEGORIES membership check
//   7.9   onboarding.js: replace VENDOR_CATEGORIES in the membership check with
//         a hardcoded subset (a second list, narrower than the taxonomy)
//   7.10  onboarding.js: delete the validateServiceAreaPair call
//   7.11  onboarding.js: restore `open_to_travel` to vendorUpdate
//   7.12  onboarding.js: drop the `: vendor.category` fallback in the candidate
//         — a returning vendor is then refused for a fact already on file.
//         NAMED PRECISELY, because the first edit tried here (dropping the
//         business_name fallback) reddened 7.18 and NOT 7.12: 7.12's body sends
//         business_name, so that fallback is not the one it stands on. A
//         mutation list that names the wrong edit teaches the next reader to
//         believe a cell is proven when it is not.
//   7.18  onboarding.js: coerceRateMin `n > 0` -> `n >= 0`  (7.13 does NOT bite
//         this edit — the predicate refuses 0 on a virgin row either way; the
//         clobber is only visible on a row that already holds a price)
//   7.17  onboarding.js: re-derive completeness locally instead of requiring
//         the predicate home
//   7.19  change one character of INCOMPLETE_REFUSAL. THE BYTE MOVED HOMES in
//         the CE-32 predicate-wire micro — it is no longer declared in
//         onboarding.js but required from src/lib/onboardingPredicate.js, so
//         both lanes refuse in one sentence rather than two copies. Mutate it
//         THERE. This cell's assertion is behavioural (it reads the response),
//         so it did not move with the byte; only this instruction did.
//         RETIRE-WITH-THE-READER: the sitting that moves a subject owns the
//         lines that point at it.
//   7.20  onboarding.js: change one character of CATEGORY_REFUSAL
//   7.21  onboarding.js: fold the token list back into CATEGORY_REFUSAL
//   7.22  onboarding.js: hardcode the allowed list instead of reading the
//         taxonomy (a literal array in place of VENDOR_CATEGORIES)
