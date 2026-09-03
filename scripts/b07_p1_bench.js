#!/usr/bin/env node
// scripts/b07_p1_bench.js — TDW_07 P1's floor.
//
// WHAT THIS BENCH ASSERTS, and why each cell exists:
//   §1  the ranking math on fixture rows          (D-5's formula, term by term)
//   §2  the completeness score                    (profileScore.js, the one home)
//   §3  the weights loader + its 60s cache        (admin_config, string→number, fallbacks)
//   §4  the PAUSED PREDICATE EXCLUDING            (P1 item 4, driven through the REAL route)
//   §5  FEATURED marking                          (F5's ruling: the window, not eligibility)
//   §6  the IG handle normaliser + both link forms (D-3: app scheme AND https fallback)
//   §7  rank-then-interleave order of operations  (CE §C/F4)
//   §8  the demo_lead_alert registry entry        (the sitting-one rider, gate + compliance)
//
// NON-VACUITY: §9 is the MUTATION LEDGER — it names, for each section, the exact
// PRODUCTION byte whose mutation must turn that section RED. Those mutations were run
// at the executor's hand against production code (never test setup) and each is
// recorded in the handover with its observed count. This bench is runnable from any
// working directory (Q-SP-5) and drives the REAL route handler, the REAL ranking
// module and the REAL registry — never a re-implementation.
//
// F-06.111 GUARD: this file contains no `every` over a filtered array without a
// length limb. Where a cell asserts "all of X", it asserts the COUNT first.

'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const ranking      = require(path.join(ROOT, 'src/lib/discover/ranking'));
const profileScore = require(path.join(ROOT, 'src/lib/vendor/profileScore'));
const templates    = require(path.join(ROOT, 'src/lib/templates'));

let pass = 0, fail = 0;
function ok(label, cond, detail) {
  if (cond) { pass++; console.log(`  ok   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}`); if (detail) console.log(`       ${detail}`); }
}
function section(t) { console.log(`\n${t}`); }

// ── A minimal chainable Supabase double ──────────────────────────────────────────
// It records every filter applied so the bench can assert WHICH PREDICATE THE ROUTE
// SENT — not merely which rows came back. A route that dropped `.eq('discover_paused',
// false)` and simply received pre-filtered fixtures would green a naive bench; this
// double makes the predicate itself the evidence.
function makeSupabase(tables) {
  const calls = [];
  function builder(table) {
    const state = { table, filters: [], rows: (tables[table] || []).slice() };
    const b = {
      _state: state,
      select() { return b; },
      order()  { return b; },
      limit()  { return b; },
      eq(col, val)      { state.filters.push(['eq', col, val]);      state.rows = state.rows.filter(r => r[col] === val); return b; },
      lte(col, val)     { state.filters.push(['lte', col, val]);     state.rows = state.rows.filter(r => r[col] != null && r[col] <= val); return b; },
      gte(col, val)     { state.filters.push(['gte', col, val]);     state.rows = state.rows.filter(r => r[col] != null && r[col] >= val); return b; },
      ilike(col, val)   { state.filters.push(['ilike', col, val]);   return b; },
      overlaps(col, val){ state.filters.push(['overlaps', col, val]); return b; },
      in(col, vals)     { state.filters.push(['in', col, vals]);     state.rows = state.rows.filter(r => vals.includes(r[col])); return b; },
      then(resolve)     { calls.push(state); return Promise.resolve({ data: state.rows, error: null, count: state.rows.length }).then(resolve); },
    };
    return b;
  }
  return { from: (t) => builder(t), _calls: calls };
}

// Drive the REAL express router's GET /feed handler.
async function callFeed(tables, query = {}) {
  delete require.cache[require.resolve(path.join(ROOT, 'src/api/couple/discover'))];
  ranking._resetWeightsCache();
  const router = require(path.join(ROOT, 'src/api/couple/discover'));
  const layer = router.stack.find(l => l.route && l.route.path === '/feed' && l.route.methods.get);
  if (!layer) throw new Error('GET /feed layer not found on the real router');
  const supabase = makeSupabase(tables);
  const req = { app: { locals: { supabase } }, query };
  let captured = null;
  const res = {
    status(code) { this._code = code; return this; },
    json(body)   { captured = { code: this._code, body }; return this; },
  };
  await new Promise((resolve, reject) => {
    layer.route.stack[0].handle(req, res, (e) => (e ? reject(e) : resolve()));
    setTimeout(resolve, 0);
  });
  // asyncHandler resolves on its own microtask; drain.
  for (let i = 0; i < 8 && !captured; i++) await new Promise(r => setImmediate(r));
  return { captured, supabase };
}

const HOUR = 3600 * 1000, DAY = 24 * HOUR;

// ─────────────────────────────────────────────────────────────────────────────────
section('§1 · THE RANKING MATH (D-5)');
{
  const spot = new Set(['v-spot']);
  ok('§1.1 spotlightNorm is 1.0 for a vendor holding an ACTIVE card',
    ranking.spotlightNorm('v-spot', spot) === 1);
  ok('§1.2 spotlightNorm is 0 for a vendor holding none — no partial credit exists',
    ranking.spotlightNorm('v-none', spot) === 0);
  ok('§1.3 a null-vendor_id editorial card cannot contribute (it never enters the set)',
    ranking.spotlightNorm(null, spot) === 0 && ranking.spotlightNorm(undefined, spot) === 0);

  const now = Date.UTC(2026, 6, 29, 12, 0, 0);
  ok('§1.4 freshnessNorm is 1.0 at this instant',
    ranking.freshnessNorm(new Date(now).toISOString(), now) === 1);
  const halfway = ranking.freshnessNorm(new Date(now - 15 * DAY).toISOString(), now);
  ok('§1.5 freshnessNorm decays LINEARLY — 15d into a 30d horizon reads 0.5',
    Math.abs(halfway - 0.5) < 1e-9, `got ${halfway}`);
  ok('§1.6 freshnessNorm floors at 0 beyond the horizon, never negative',
    ranking.freshnessNorm(new Date(now - 400 * DAY).toISOString(), now) === 0);
  ok('§1.7 a NULL last_active reads 0 — the honest bottom, not an invented penalty',
    ranking.freshnessNorm(null, now) === 0);
  ok('§1.8 an unparseable timestamp reads 0 rather than NaN reaching an ORDER BY',
    ranking.freshnessNorm('not-a-date', now) === 0);
  ok('§1.9 a FUTURE timestamp clamps to 1.0 — clock skew cannot out-rank a real vendor',
    ranking.freshnessNorm(new Date(now + 5 * DAY).toISOString(), now) === 1);

  const w = { spotlight: 0.5, freshness: 0.25, completeness: 0.25 };
  const s = ranking.rankScore({ spotlight: 1, freshness: 1, completeness: 1 }, w);
  ok('§1.10 rankScore sums the three weighted terms', Math.abs(s - 1.0) < 1e-9, `got ${s}`);
  const s2 = ranking.rankScore({ spotlight: 1, freshness: 0, completeness: 0 }, w);
  ok('§1.11 each term is weighted by ITS OWN weight, not a shared one',
    Math.abs(s2 - 0.5) < 1e-9, `got ${s2}`);
  const s3 = ranking.rankScore({ spotlight: 99, freshness: 0, completeness: 0 }, w);
  ok('§1.12 an out-of-range term is CLAMPED — a raw count cannot swamp the order',
    Math.abs(s3 - 0.5) < 1e-9, `got ${s3}`);

  const ordered = ranking.rankVendors([
    { id: 'a', _rank_score: 0.1 }, { id: 'b', _rank_score: 0.9 }, { id: 'c', _rank_score: 0.5 },
  ]);
  ok('§1.13 rankVendors orders DESC by score', ordered.map(v => v.id).join('') === 'bca');
  const tied = ranking.rankVendors([{ id: 'x', _rank_score: 0 }, { id: 'y', _rank_score: 0 }, { id: 'z', _rank_score: 0 }]);
  ok('§1.14 an ALL-ZERO feed comes out in the INCOMING order — today\'s created_at-desc feed is preserved exactly',
    tied.map(v => v.id).join('') === 'xyz');
  const input = [{ id: 'a', _rank_score: 0.1 }, { id: 'b', _rank_score: 0.9 }];
  ranking.rankVendors(input);
  ok('§1.15 rankVendors does not mutate its input', input.map(v => v.id).join('') === 'ab');
}

// ─────────────────────────────────────────────────────────────────────────────────
section('§2 · THE COMPLETENESS SCORE (profileScore.js, the one home)');
{
  const sum = Object.values(profileScore.TERM_WEIGHTS).reduce((a, b) => a + b, 0);
  ok('§2.1 the internal term weights sum to exactly 1.0 — asserted, never hoped',
    Math.abs(sum - 1) < 1e-9, `got ${sum}`);

  const empty = profileScore.computeCompleteness({});
  ok('§2.2 an empty profile scores 0', empty === 0, `got ${empty}`);

  const full = profileScore.computeCompleteness({
    approvedPhotoCount: profileScore.MIN_PORTFOLIO_IMAGES,
    hasHero: true, about: 'We shoot weddings.', aestheticTags: ['candid', 'royal', 'moody'],
    rateMin: 100000, rateMax: 300000, instagramHandle: 'studio.one',
    // LABELED AMENDMENT (TDW_07 P2, CE-ruled). COUNT PRESERVED — one field, same cell.
    // The travel term joined profileScore this sitting and the weights re-normalised, so a
    // fixture that omits it is no longer a COMPLETE profile and 1.0 became unreachable. The
    // cell's meaning is untouched: "everything filled scores exactly 1.0". Every other §2
    // cell is written relative to TERM_WEIGHTS and survives the re-normalisation unedited.
    travelNotes: 'Delhi NCR and destination, travel billed at cost.',
  });
  ok('§2.3 a complete profile scores exactly 1.0', Math.abs(full - 1) < 1e-9, `got ${full}`);

  const half = profileScore.computeCompleteness({ approvedPhotoCount: Math.ceil(profileScore.MIN_PORTFOLIO_IMAGES / 2) });
  ok('§2.4 photos give PARTIAL credit below the floor — P2\'s hint needs a number that moves',
    half > 0 && half < profileScore.TERM_WEIGHTS.photos + 1e-9, `got ${half}`);

  const over = profileScore.computeCompleteness({ approvedPhotoCount: 500 });
  ok('§2.5 photos above the floor do not exceed their term\'s weight',
    Math.abs(over - profileScore.TERM_WEIGHTS.photos) < 1e-9, `got ${over}`);

  // ── LABELED AMENDMENT (TDW_07 P4b · F4, WIDENED) — TITLE RE-AUTHORED, NOT RELAXED. ──
  // This cell asserted the RETIRED law: that a rate with only a minimum scored ZERO because
  // requestDiscover demanded both bounds. P4b retires `rate_max` from the estate's rate
  // model — the gate is min-only, the submit form drops the field, and the write no longer
  // stores it — so a min-only rate is now the COMPLETE shape, not a half one. The old title
  // is false at this tree and is re-authored rather than left describing a world that ended.
  // The assertion is INVERTED, not weakened: it still pins an exact value, and it still
  // fails if the term's arithmetic drifts.
  const minOnlyRate = profileScore.computeCompleteness({ rateMin: 100000, rateMax: null });
  ok('§2.6 a MIN-ONLY rate earns the rate term in full — F4 retired the upper bound from completeness',
    Math.abs(minOnlyRate - profileScore.TERM_WEIGHTS.rate) < 1e-9, `got ${minOnlyRate}`);

  // §2.6b — the retirement must not have quietly re-weighted the term. 0.135 by ruling.
  ok('§2.6b the rate term still weighs exactly 0.135 — F4 changed WHEN it is earned, never what it is worth',
    Math.abs(profileScore.TERM_WEIGHTS.rate - 0.135) < 1e-12, `got ${profileScore.TERM_WEIGHTS.rate}`);

  // §2.6c — `rate_max` is now inert in the score. Passing it must change nothing at all.
  const withMax = profileScore.computeCompleteness({ rateMin: 100000, rateMax: 400000 });
  ok('§2.6c passing rate_max changes NOTHING — the field is accepted and ignored, never read',
    Math.abs(withMax - minOnlyRate) < 1e-12, `got ${withMax} vs ${minOnlyRate}`);

  // §2.6d — fail-closed on shape. The empty-string hole the executor shipped and self-caught.
  const emptyRate = profileScore.computeCompleteness({ rateMin: '' });
  ok('§2.6d an EMPTY-STRING rate earns nothing — Number("") is 0 and finite, and that is the trap',
    emptyRate === 0, `got ${emptyRate}`);

  const twoTags = profileScore.computeCompleteness({ aestheticTags: ['a', 'b'] });
  const three   = profileScore.computeCompleteness({ aestheticTags: ['a', 'b', 'c'] });
  ok('§2.7 tags credit partially and cap at the ≥3 threshold',
    twoTags < three && Math.abs(three - profileScore.TERM_WEIGHTS.tags) < 1e-9);

  const junkTags = profileScore.computeCompleteness({ aestheticTags: ['', '   ', 42, null] });
  ok('§2.8 blank and non-string tags are not counted', junkTags === 0);

  const blankAbout = profileScore.computeCompleteness({ about: '   ' });
  ok('§2.9 whitespace-only text is not "filled in"', blankAbout === 0);

  ok('§2.10 the photo FLOOR IS IMPORTED from its enforcement site — one home, not a second copy',
    profileScore.MIN_PORTFOLIO_IMAGES === require(path.join(ROOT, 'src/lib/vendor/discover')).MIN_PORTFOLIO_IMAGES);

  const bd = profileScore.completenessBreakdown({ approvedPhotoCount: 2, aestheticTags: ['a'] });
  ok('§2.11 the breakdown reports have/need per term (P2\'s meter extends this file, not a twin)',
    bd.photos.have === 2 && bd.photos.need === profileScore.MIN_PORTFOLIO_IMAGES && bd.photos.met === false && bd.tags.have === 1);
}

// ─────────────────────────────────────────────────────────────────────────────────
section('§3 · THE WEIGHTS LOADER (admin_config, cached 60s)');
(async () => {
  ranking._resetWeightsCache();
  const sb = makeSupabase({ admin_config: [
    { key: 'discover.rank.w_spotlight',    value: '0.8' },
    { key: 'discover.rank.w_freshness',    value: '0.1' },
    { key: 'discover.rank.w_completeness', value: '0.1' },
  ] });
  const w = await ranking.loadWeights(sb, 1000);
  ok('§3.1 TEXT values from admin_config are coerced to numbers (value is `text`, witnessed)',
    w.spotlight === 0.8 && w.freshness === 0.1 && w.completeness === 0.1, JSON.stringify(w));

  ranking._resetWeightsCache();
  const wEmpty = await ranking.loadWeights(makeSupabase({ admin_config: [] }), 1000);
  ok('§3.2 an EMPTY admin_config serves the spec seeds 0.5/0.25/0.25 — the feed still orders',
    wEmpty.spotlight === 0.5 && wEmpty.freshness === 0.25 && wEmpty.completeness === 0.25);

  const junk = ranking.normalizeWeights({ spotlight: 'abc', freshness: -3, completeness: '0.4' });
  ok('§3.3 an unparseable or negative weight falls back to ITS OWN default, never to zero',
    junk.spotlight === 0.5 && junk.freshness === 0.25 && junk.completeness === 0.4, JSON.stringify(junk));

  ranking._resetWeightsCache();
  const sb2 = makeSupabase({ admin_config: [{ key: 'discover.rank.w_spotlight', value: '0.9' }] });
  await ranking.loadWeights(sb2, 5000);
  const cached = await ranking.loadWeights(makeSupabase({ admin_config: [{ key: 'discover.rank.w_spotlight', value: '0.1' }] }), 5000 + 30 * 1000);
  ok('§3.4 inside the TTL the cache is served — a second read does not re-query',
    cached.spotlight === 0.9, JSON.stringify(cached));
  const refreshed = await ranking.loadWeights(makeSupabase({ admin_config: [{ key: 'discover.rank.w_spotlight', value: '0.1' }] }), 5000 + ranking.WEIGHTS_TTL_MS + 1);
  ok('§3.5 past the TTL the cache REFRESHES — a founder flip takes effect on the next fetch',
    refreshed.spotlight === 0.1, JSON.stringify(refreshed));
  ok('§3.6 the TTL is the spec\'s 60s', ranking.WEIGHTS_TTL_MS === 60000);

  ranking._resetWeightsCache();
  const broken = { from: () => { throw new Error('db down'); } };
  const wSafe = await ranking.loadWeights(broken, 9000);
  ok('§3.7 a THROWING config read serves defaults and does not take the public feed down',
    wSafe.spotlight === 0.5);

  // ───────────────────────────────────────────────────────────────────────────────
  section('§4 · THE PAUSED PREDICATE (P1 item 4) — through the REAL route');
  const baseVendors = [
    { id: 'v-live',   business_name: 'Live Studio',   category: 'Photographers', city: 'Delhi NCR', routing_handle: 'live',   rate_min: 100000, rate_max: 200000, aesthetic_tags: [], about: 'a', instagram_handle: 'live.studio',  rate_display: true,  discover_paused: false, discover_eligible: true,  created_at: '2026-01-01' },
    { id: 'v-paused', business_name: 'Paused Studio', category: 'Photographers', city: 'Delhi NCR', routing_handle: 'paused', rate_min: 100000, rate_max: 200000, aesthetic_tags: [], about: 'a', instagram_handle: 'paused.studio', rate_display: true,  discover_paused: true,  discover_eligible: true,  created_at: '2026-01-02' },
    { id: 'v-unappr', business_name: 'Unapproved',    category: 'Photographers', city: 'Delhi NCR', routing_handle: 'unap',   rate_min: 100000, rate_max: 200000, aesthetic_tags: [], about: 'a', instagram_handle: null,           rate_display: true,  discover_paused: false, discover_eligible: false, created_at: '2026-01-03' },
  ];
  const tables = {
    vendors: baseVendors, vendor_portfolio: [], spotlight: [],
    vendor_featured_submissions: [], vendor_activity_log: [], demo_vendors: [], admin_config: [],
  };
  const r4 = await callFeed(tables);
  const ids4 = (r4.captured.body.vendors || []).map(v => v.id);
  ok('§4.1 the feed responds 200 with a vendors array', r4.captured.code === 200 && Array.isArray(r4.captured.body.vendors));
  ok('§4.2 THE PAUSED VENDOR IS ABSENT from the feed', !ids4.includes('v-paused'), ids4.join(','));
  ok('§4.3 the live vendor IS present — pause excludes one row, not the feed', ids4.includes('v-live'));
  ok('§4.4 an unapproved vendor stays absent — the eligibility gate is untouched', !ids4.includes('v-unappr'));

  const vendorCall = r4.supabase._calls.find(c => c.table === 'vendors');
  const filterPairs = (vendorCall ? vendorCall.filters : []).map(f => `${f[0]}:${f[1]}=${f[2]}`);
  ok('§4.5 THE PREDICATE ITSELF was sent — `.eq(discover_paused,false)` is on the query, not merely reflected by fixtures',
    filterPairs.includes('eq:discover_paused=false'), filterPairs.join(' | '));
  ok('§4.6 and it sits BESIDE the eligibility predicate, not instead of it',
    filterPairs.includes('eq:discover_eligible=true'), filterPairs.join(' | '));
  ok('§4.7 APPROVAL IS RETAINED for the paused vendor — the route writes nothing; the row is untouched',
    baseVendors[1].discover_eligible === true && baseVendors[1].discover_paused === true);

  // ───────────────────────────────────────────────────────────────────────────────
  section('§5 · FEATURED MARKING (CE §C/F5 — the window, not eligibility)');
  const nowMs = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const t5 = {
    vendors: [
      { id: 'v-in',     business_name: 'In Window',   category: 'c', city: 'Delhi NCR', routing_handle: 'in',   rate_min: 1, rate_max: 2, aesthetic_tags: [], about: 'a', instagram_handle: 'in.win',  rate_display: true, discover_paused: false, discover_eligible: true, created_at: '2026-01-01' },
      { id: 'v-past',   business_name: 'Past Window', category: 'c', city: 'Delhi NCR', routing_handle: 'past', rate_min: 1, rate_max: 2, aesthetic_tags: [], about: 'a', instagram_handle: null,      rate_display: true, discover_paused: false, discover_eligible: true, created_at: '2026-01-02' },
      { id: 'v-elig',   business_name: 'Eligible',    category: 'c', city: 'Delhi NCR', routing_handle: 'elig', rate_min: 1, rate_max: 2, aesthetic_tags: [], about: 'a', instagram_handle: null,      rate_display: true, discover_paused: false, discover_eligible: true, featured_eligible: true, created_at: '2026-01-03' },
    ],
    vendor_featured_submissions: [
      { vendor_id: 'v-in',   state: 'approved',  scheduled_start: iso(nowMs - DAY), scheduled_end: iso(nowMs + DAY) },
      { vendor_id: 'v-past', state: 'approved',  scheduled_start: iso(nowMs - 9 * DAY), scheduled_end: iso(nowMs - 2 * DAY) },
      { vendor_id: 'v-elig', state: 'submitted', scheduled_start: iso(nowMs - DAY), scheduled_end: iso(nowMs + DAY) },
    ],
    vendor_portfolio: [], spotlight: [], vendor_activity_log: [], demo_vendors: [], admin_config: [],
  };
  const r5 = await callFeed(t5);
  const by5 = {}; (r5.captured.body.vendors || []).forEach(v => { by5[v.id] = v; });
  ok('§5.1 a vendor INSIDE an approved window is marked featured:true', by5['v-in'] && by5['v-in'].featured === true);
  ok('§5.2 a vendor whose window has PASSED is NOT marked', by5['v-past'] && by5['v-past'].featured === false);
  ok('§5.3 featured_eligible ALONE does not mark — a pending submission is not a featured card',
    by5['v-elig'] && by5['v-elig'].featured === false);
  const submCall = r5.supabase._calls.find(c => c.table === 'vendor_featured_submissions');
  const submFilters = (submCall ? submCall.filters : []).map(f => `${f[0]}:${f[1]}`);
  ok('§5.4 the read is state-gated AND window-bounded on BOTH ends',
    submFilters.includes('eq:state') && submFilters.includes('lte:scheduled_start') && submFilters.includes('gte:scheduled_end'),
    submFilters.join(' | '));
  ok('§5.5 the route never reads vendors.featured_eligible for this decision',
    !(r5.supabase._calls.find(c => c.table === 'vendors') || { filters: [] }).filters.some(f => f[1] === 'featured_eligible'));
  ok('§5.6 EVERY shaped card carries the featured field — marked, always (count asserted first)',
    (r5.captured.body.vendors || []).length === 3 &&
    (r5.captured.body.vendors || []).filter(v => typeof v.featured === 'boolean').length === 3);

  // ───────────────────────────────────────────────────────────────────────────────
  section('§6 · THE IG CHIP (D-3) — the handle, and BOTH link forms');
  const t6 = {
    vendors: [
      { id: 'v-at',   business_name: 'At',   category: 'c', city: 'Delhi NCR', routing_handle: 'at',   rate_min: 1, rate_max: 2, aesthetic_tags: [], about: 'a', instagram_handle: '@Studio.One', rate_display: true, discover_paused: false, discover_eligible: true, created_at: '2026-01-01' },
      { id: 'v-url',  business_name: 'Url',  category: 'c', city: 'Delhi NCR', routing_handle: 'url',  rate_min: 1, rate_max: 2, aesthetic_tags: [], about: 'a', instagram_handle: 'https://www.instagram.com/lens.co/', rate_display: true, discover_paused: false, discover_eligible: true, created_at: '2026-01-02' },
      { id: 'v-junk', business_name: 'Junk', category: 'c', city: 'Delhi NCR', routing_handle: 'junk', rate_min: 1, rate_max: 2, aesthetic_tags: [], about: 'a', instagram_handle: 'not a handle!!', rate_display: true, discover_paused: false, discover_eligible: true, created_at: '2026-01-03' },
    ],
    vendor_portfolio: [], spotlight: [], vendor_featured_submissions: [], vendor_activity_log: [],
    demo_vendors: [
      { id: 'd-1', display_name: 'Demo One', category: 'c', city: 'Delhi NCR', ig_handle: 'demo.house', rate_display: 'From Rs 1,00,000', photos: [], about: 'a', discover_eligible: true, active: true, created_at: '2026-01-01' },
    ],
    admin_config: [],
  };
  const r6 = await callFeed(t6);
  const by6 = {}; (r6.captured.body.vendors || []).forEach(v => { by6[v.id] = v; });
  ok('§6.1 a leading @ is stripped — the deep link takes a BARE username', by6['v-at'] && by6['v-at'].instagram_handle === 'Studio.One');
  ok('§6.2 a full profile URL reduces to the username', by6['v-url'] && by6['v-url'].instagram_handle === 'lens.co');
  ok('§6.3 an unusable handle yields NULL — the chip renders on truth or not at all',
    by6['v-junk'] && by6['v-junk'].instagram_handle === null);
  ok('§6.4 a DEMO card carries the chip from its ig_handle (D-3: the truest thing on the card)',
    by6['d-1'] && by6['d-1'].instagram_handle === 'demo.house');

  // The two link forms, asserted against the pwa's own helper source — the bench for
  // the frontend half lives in the pwa proof harness, but the SHAPE is asserted here
  // so a scheme drift in either repo reddens a floor.
  // THE SIBLING-REPO CELLS. The two repos never share a terminal (protocol §2), so the
  // pwa tree may or may not sit beside this one. When it does, the link SHAPE is
  // asserted here too, so a scheme drift in either repo reddens a floor. When it does
  // not, these four cells SKIP WITH THEIR REASON NAMED (the floor-method law) rather
  // than throwing — and the pwa's own harness, tdw07_p1_discover.proof.mjs §2, carries
  // the same assertions unconditionally in the repo that owns the file.
  const fs = require('fs');
  const IG_PATH = path.join(ROOT, '..', 'dreamos-pwa', 'lib/frost/igLink.ts');
  let igSrc = null;
  try { igSrc = fs.readFileSync(IG_PATH, 'utf8'); } catch { /* sibling repo not checked out here */ }
  if (igSrc === null) {
    console.log('  skip §6.5–§6.8 — the dreamos-pwa tree is not beside this one; these four');
    console.log('       cells live unconditionally in tdw07_p1_discover.proof.mjs §2.1–§2.6.');
    console.log('       SKIPPED, NOT PASSED: the count below is 4 lower than a paired run.');
  } else {
    ok('§6.5 the APP form is instagram://user?username=', igSrc.includes('instagram://user?username='));
    ok('§6.6 the HTTPS fallback form is https://instagram.com/', igSrc.includes('https://instagram.com/'));
    ok('§6.7 the fallback delay is the spec\'s 300ms', /IG_FALLBACK_MS\s*=\s*300/.test(igSrc));
    ok('§6.8 the fallback opens in a NEW context with noopener — never in-app-browser-jacked (spec §3)',
      igSrc.includes("'_blank'") && igSrc.includes('noopener'));
  }

  // ───────────────────────────────────────────────────────────────────────────────
  section('§7 · ORDER OF OPERATIONS — rank the real leg, THEN interleave (CE §C/F4)');
  const t7 = {
    vendors: Array.from({ length: 6 }, (_, i) => ({
      id: `r${i}`, business_name: `R${i}`, category: 'c', city: 'Delhi NCR', routing_handle: `r${i}`,
      rate_min: 1, rate_max: 2, aesthetic_tags: [], about: 'a', instagram_handle: null,
      rate_display: true, discover_paused: false, discover_eligible: true, created_at: `2026-01-0${i + 1}`,
    })),
    // r5 alone holds an active spotlight card — with w_spotlight dominant it must lead.
    spotlight: [{ vendor_id: 'r5', active: true }],
    vendor_portfolio: [], vendor_featured_submissions: [], vendor_activity_log: [],
    demo_vendors: [
      { id: 'd-a', display_name: 'Demo A', category: 'c', city: 'Delhi NCR', ig_handle: 'a.demo', rate_display: 'x', photos: [], about: 'a', discover_eligible: true, active: true, created_at: '2026-01-01' },
    ],
    admin_config: [
      { key: 'discover.rank.w_spotlight',    value: '1' },
      { key: 'discover.rank.w_freshness',    value: '0' },
      { key: 'discover.rank.w_completeness', value: '0' },
    ],
  };
  const r7 = await callFeed(t7);
  const seq7 = (r7.captured.body.vendors || []).map(v => v.id);
  ok('§7.1 the spotlit vendor is ranked FIRST among the real leg', seq7[0] === 'r5', seq7.join(','));
  ok('§7.2 the demo card still lands at the every-5th slot — the interleave position law is UNTOUCHED',
    seq7[5] === 'd-a', seq7.join(','));
  ok('§7.3 the shaped card does NOT carry _rank_score to the client — no field the type does not declare',
    (r7.captured.body.vendors || []).length > 0 &&
    (r7.captured.body.vendors || []).filter(v => Object.prototype.hasOwnProperty.call(v, '_rank_score')).length === 0);

  // Flip the weights: the SAME fixtures must reorder. This is smoke ④ in a bench.
  const t7b = JSON.parse(JSON.stringify(t7));
  t7b.admin_config = [
    { key: 'discover.rank.w_spotlight',    value: '0' },
    { key: 'discover.rank.w_freshness',    value: '1' },
    { key: 'discover.rank.w_completeness', value: '0' },
  ];
  t7b.vendor_activity_log = [{ vendor_id: 'r0', created_at: new Date().toISOString() }];
  const r7b = await callFeed(t7b);
  const seq7b = (r7b.captured.body.vendors || []).map(v => v.id);
  ok('§7.4 FLIPPING A WEIGHT REORDERS THE SAME FIXTURES — D-5\'s acceptance criterion, benched',
    seq7b[0] === 'r0' && seq7[0] !== seq7b[0], `${seq7.join(',')}  →  ${seq7b.join(',')}`);

  // D-1's rate toggle.
  const t7c = JSON.parse(JSON.stringify(t7));
  t7c.vendors[0].rate_display = false;
  t7c.vendors[0].rate_min = 250000;
  t7c.vendors[1].rate_display = true;
  t7c.vendors[1].rate_min = 250000;
  const r7c = await callFeed(t7c);
  const by7c = {}; (r7c.captured.body.vendors || []).forEach(v => { by7c[v.id] = v; });
  ok('§7.5 D-1: rate_display=false hides the starting price', by7c['r0'] && by7c['r0'].starting_price === null);
  ok('§7.6 D-1: rate_display=true still shows it — the default is unchanged behaviour',
    by7c['r1'] && by7c['r1'].starting_price === 250000);

  // ───────────────────────────────────────────────────────────────────────────────
  section('§8 · THE SITTING-ONE RIDER — demo_lead_alert in the registry');
  const t = templates.TEMPLATES.demo_lead_alert;
  const body = t ? t.body.trim() : '';
  ok('§8.1 the key exists in the registry', !!t);
  ok('§8.2 the Meta name is tdw_demo_lead_alert', t && t.name === 'tdw_demo_lead_alert');
  ok('§8.3 it rides the MARKETING line — outreach, and therefore STOP + the 25/day cap',
    t && t.line === 'marketing');
  // LABELED AMENDMENT (TDW_07 P2, CE ruling §B). COUNT PRESERVED — one cell, both directions.
  // At P1 this asserted isApproved === false, which was the whole truth then: the template was
  // filed and Meta had not spoken. Meta approved it on 2026-07-29 and P2 flipped the field, so
  // the OLD assertion would now be red for the best possible reason. The cell is re-aimed at
  // the stronger property, per the ruling: the gate PASSES the approved key AND still REFUSES
  // an unapproved one — a gate that only ever saw one answer was never tested.
  ok('§8.4 THE GATE DISCRIMINATES: the approved template passes, an unapproved one still refuses',
    templates.isApproved('demo_lead_alert') === true
    && templates.isApproved('__no_such_template__') !== true);
  ok('§8.5 the body does NOT begin with a variable (TEMPLATES.md §1 — the spec\'s own draft did)',
    body.slice(0, 2) !== '{{');
  ok('§8.6 the body does NOT end with a variable', body.slice(-2) !== '}}');
  ok('§8.7 no two variables are adjacent', !/\}\}[^A-Za-z0-9]{0,2}\{\{/.test(body));
  ok('§8.8 the body is SINGLE-LINE — no newline can be rejected', body.indexOf('\n') === -1);
  ok('§8.9 variables are numbered 1..3 with no gaps',
    (body.match(/\{\{\d+\}\}/g) || []).join(' ') === '{{1}} {{2}} {{3}}');
  ok('§8.10 the registry body and docs/TEMPLATES.md carry the SAME bytes',
    fs.readFileSync(path.join(ROOT, 'docs/TEMPLATES.md'), 'utf8').includes(body));
  const payload = templates.buildTemplatePayload('demo_lead_alert', { name: 'Rahul', month: 'December', claim_link: 'https://x/y' });
  ok('§8.11 the Meta payload threads the three variables in order',
    payload.components[0].parameters.map(p => p.text).join('|') === 'Rahul|December|https://x/y');
  ok('§8.12 the six Block-05 bodies are untouched by this sitting — the registry gained one key, changed none',
    ['marketing_opener', 'morning_nudge_vendor', 'morning_nudge_bride', 'crew_assignment', 'payment_reminder', 'demo_invite']
      .filter(k => templates.TEMPLATES[k] && templates.TEMPLATES[k].status === 'approved').length === 6);

  // ───────────────────────────────────────────────────────────────────────────────
  section('§9 · THE MUTATION LEDGER (non-vacuity — production bytes, not test setup)');
  console.log('      Each line names the PRODUCTION byte whose mutation must redden the section.');
  console.log('      Every one was run at the executor\'s hand and cmp-restored; counts in the handover.');
  console.log('      M-1  ranking.js freshnessNorm: `1 - (age/horizonMs)` → `1`            ⇒ §1.5/§1.6 RED');
  console.log('      M-2  ranking.js rankVendors: `b - a` → `a - b`                        ⇒ §1.13/§7.1 RED');
  console.log('      M-3  profileScore.js TERM_WEIGHTS.photos: 0.30 → 0.40                 ⇒ §2.1/§2.3 RED');
  console.log('      M-4  couple/discover.js: DELETE `.eq(\'discover_paused\', false)`        ⇒ §4.2/§4.5 RED');
  console.log('      M-5  couple/discover.js: featured source → `v.featured_eligible`      ⇒ §5.1/§5.3 RED');
  console.log('      M-6  couple/discover.js: normalizeIgHandle `replace(/^@+/,\'\')` removed ⇒ §6.1 RED');
  console.log('      M-7  couple/discover.js: `rankVendors(...)` → the plain filter         ⇒ §7.1/§7.4 RED');
  console.log('      M-8  templates.js demo_lead_alert.status: \'approved\' → \'pending\'       ⇒ §8.4 RED');
  console.log('           (M-8 INVERTED at TDW_07 P2 — post-flip the honest mutation is the');
  console.log('            un-approval; the pre-flip direction would now assert the old world.)');

  console.log('');
  const total = pass + fail;
  if (fail === 0) console.log(`GREEN — b07_p1_bench ${pass}/${total}`);
  else            console.log(`RED — b07_p1_bench ${pass}/${total}`);
  process.exit(fail === 0 ? 0 : 1);
})().catch(err => { console.error('BENCH THREW:', err); process.exit(2) /* F-39.67: an unexpected throw is an ERROR, never a FAIL */; });
