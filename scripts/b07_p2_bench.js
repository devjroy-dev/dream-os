#!/usr/bin/env node
// scripts/b07_p2_bench.js — TDW_07 P2's floor (Discover Profile).
//
// WHAT THIS BENCH ASSERTS, and why each cell exists:
//   §1  the 5→6 raise at the ONE constant       (both consumers move together, no second copy)
//   §2  the travel term + the re-normalisation  (the STATED policy, never the boolean)
//   §3  the meter's hints                       (Fork 5's ruled substitute + the tie-break)
//   §4  the PATCH allowlist's three additions   (through the REAL handler, incl. `about`)
//   §5  the boolean guard                       (a string posture is a 400, never a coercion)
//   §6  the pause ROUND TRIP, server-side       (set → GET reads it back → the feed excludes)
//   §7  GET /me's shape — F-07.9's server half  (every editable field travels, incl. IG)
//   §8  F-07.4 reconciled                       (gate on total, score on approved, both real)
//   §9  the server-carried floor                (getDiscoverStatus tells the client the number)
//
// NON-VACUITY: §10 is the MUTATION LEDGER. Every mutation named there was applied to a
// PRODUCTION source file (never a fixture, never test setup), this bench re-run, and the
// file cp-restored byte-identical. Runnable from any working directory (Q-SP-5); it drives
// the REAL express handlers and the REAL score module, never a re-implementation.
//
// F-06.111 GUARD: no `every` over a filtered array without a length limb — where a cell
// asserts "all of X", it asserts the COUNT first.

'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const profileScore = require(path.join(ROOT, 'src/lib/vendor/profileScore'));
const vendorDisc   = require(path.join(ROOT, 'src/lib/vendor/discover'));
const ranking      = require(path.join(ROOT, 'src/lib/discover/ranking'));

let pass = 0, fail = 0;
function ok(label, cond, detail) {
  if (cond) { pass++; console.log(`  ok   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}`); if (detail) console.log(`       ${detail}`); }
}
function section(t) { console.log(`\n${t}`); }

// ── The chainable Supabase double (P1's shape, extended with update()) ─────────────
// It records the filters AND the update payloads, so a cell can assert WHAT THE HANDLER
// SENT rather than only what came back. A handler that silently dropped a field from its
// update object would green a bench that only read the response.
function makeSupabase(tables) {
  const calls = [];
  const updates = [];
  function builder(table) {
    const state = { table, filters: [], rows: (tables[table] || []).slice(), payload: null };
    const b = {
      _state: state,
      select() { return b; },
      order()  { return b; },
      limit()  { return b; },
      update(payload) { state.payload = payload; updates.push({ table, payload }); 
                        state.rows = state.rows.map(r => ({ ...r, ...payload })); return b; },
      insert(payload) { state.payload = payload;
                        const rowsIn = Array.isArray(payload) ? payload : [payload];
                        state.rows = rowsIn.map((r, i) => ({ id: `ins-${i}`, ...r })); return b; },
      eq(col, val)      { state.filters.push(`eq:${col}=${val}`); state.rows = state.rows.filter(r => r[col] === val); return b; },
      lte(col, val)     { state.filters.push(`lte:${col}=${val}`); state.rows = state.rows.filter(r => r[col] != null && r[col] <= val); return b; },
      in(col, vals)     { state.filters.push(`in:${col}`); state.rows = state.rows.filter(r => vals.includes(r[col])); return b; },
      gte(col, val)     { state.filters.push(`gte:${col}=${val}`); state.rows = state.rows.filter(r => r[col] != null && r[col] >= val); return b; },
      is()      { return b; },
      not()     { return b; },
      ilike()   { return b; },
      overlaps(){ return b; },
      neq()     { return b; },
      maybeSingle() { calls.push(state); return Promise.resolve({ data: state.rows[0] || null, error: null }); },
      single()      { calls.push(state); return Promise.resolve({ data: state.rows[0] || null, error: null }); },
      then(resolve) { calls.push(state); return Promise.resolve({ data: state.rows, error: null, count: state.rows.length }).then(resolve); },
    };
    return b;
  }
  return { from: (t) => builder(t), _calls: calls, _updates: updates };
}

// Drive the REAL vendor me router. `resolveVendor` and `requireAuth` are middleware we
// bypass deliberately — this bench tests the HANDLER's field discipline, and the auth
// layer is benched by its own suite. req.vendor is supplied exactly as resolveVendor
// would supply it: the row.
async function callMe(method, vendorRow, body, tables) {
  const modPath = path.join(ROOT, 'src/api/vendor/me');
  delete require.cache[require.resolve(modPath)];
  const router = require(modPath);
  const layer = router.stack.find(l => l.route && l.route.path === '/' && l.route.methods[method]);
  if (!layer) throw new Error(`${method.toUpperCase()} / layer not found on the real vendor/me router`);
  const supabase = makeSupabase(tables);
  const req = { app: { locals: { supabase } }, vendor: vendorRow, body: body || {} };
  let captured = null;
  const res = {
    status(code) { this._code = code; return this; },
    json(b) { captured = { code: this._code || 200, body: b }; return this; },
  };
  const handlers = layer.route.stack.map(s => s.handle);
  const final = handlers[handlers.length - 1];
  await new Promise((resolve, reject) => {
    Promise.resolve(final(req, res, (e) => (e ? reject(e) : resolve()))).then(resolve, reject);
  });
  for (let i = 0; i < 8 && !captured; i++) await new Promise(r => setImmediate(r));
  return { captured, supabase };
}

// The live fixture this sitting was authored against: the founder's own pasted row for
// the test account (Swati Roy, a8c52506…), reproduced here as a bench fixture so the cells
// assert against REAL production posture rather than a convenient invention.
const SWATI = {
  id: 'a8c52506-d363-4a36-9cec-09b50cc32c4c',
  user_id: 'u-swati',
  business_name: null, category: 'makeup', city: 'Delhi', tier: 'trial',
  style_notes: null, open_to_travel: true, travel_notes: null,
  instagram_handle: 'Makeupbyswatiroy', routing_handle: 'MAKEUPBYSWATIROY',
  about: null, upi_id: null, gstin: null, briefing_enabled: true, invoice_prefix: null,
  aesthetic_tags: [], rate_min: null, rate_max: null,
  rate_display: true, discover_paused: false, discover_eligible: true,
  discover_request_state: 'approved', discover_preview: false,
  couture_eligible: false, featured_eligible: false, slot_capacity: null,
  onboarding_state: 'done', founding_cohort: false,
};
const swatiScoreArgs = {
  approvedPhotoCount: 2, hasHero: false, about: null, aestheticTags: [],
  rateMin: null, rateMax: null, instagramHandle: 'Makeupbyswatiroy', travelNotes: null,
};

(async () => {

// ─────────────────────────────────────────────────────────────────────────────────
section('§1 · THE 5→6 RAISE AT THE ONE CONSTANT');
{
  ok('§1.1 the enforced floor is 6', vendorDisc.MIN_PORTFOLIO_IMAGES === 6,
    `got ${vendorDisc.MIN_PORTFOLIO_IMAGES}`);
  ok('§1.2 the SCORE reads the SAME object, not a copy — one byte moved both consumers',
    profileScore.MIN_PORTFOLIO_IMAGES === vendorDisc.MIN_PORTFOLIO_IMAGES);
  const fs = require('fs');
  const src = fs.readFileSync(path.join(ROOT, 'src/lib/vendor/profileScore.js'), 'utf8');
  ok('§1.3 profileScore mints NO literal floor of its own — it imports the name',
    !/MIN_PORTFOLIO_IMAGES\s*=\s*\d/.test(src) && /require\('\.\/discover'\)/.test(src));
  const disc = fs.readFileSync(path.join(ROOT, 'src/lib/vendor/discover.js'), 'utf8');
  const literals = (disc.match(/MIN_PORTFOLIO_IMAGES\s*=\s*\d+/g) || []);
  ok('§1.4 the constant is DECLARED EXACTLY ONCE in the estate\'s enforcement file',
    literals.length === 1, literals.join(' | '));
}

// ─────────────────────────────────────────────────────────────────────────────────
section('§2 · THE TRAVEL TERM + THE RE-NORMALISATION (Fork 3 as ruled)');
{
  const sum = Object.values(profileScore.TERM_WEIGHTS).reduce((a, b) => a + b, 0);
  ok('§2.1 the seven term weights still sum to exactly 1.0 — asserted, never hoped',
    Math.abs(sum - 1) < 1e-9, `got ${sum}`);
  ok('§2.2 the travel term exists and carries 0.10',
    Math.abs(profileScore.TERM_WEIGHTS.travel - 0.10) < 1e-9);
  ok('§2.3 the six P1 terms were scaled PROPORTIONALLY by 0.90 — no editorial re-weighting',
    Math.abs(profileScore.TERM_WEIGHTS.photos - 0.30 * 0.9) < 1e-9
    && Math.abs(profileScore.TERM_WEIGHTS.about - 0.15 * 0.9) < 1e-9
    && Math.abs(profileScore.TERM_WEIGHTS.ig - 0.10 * 0.9) < 1e-9);

  // THE RULING'S DISCRIMINATING CELL, on the live specimen that forced it.
  const boolYesNotesEmpty = profileScore.computeCompleteness({ ...swatiScoreArgs, travelNotes: null });
  const boolNoNotesWritten = profileScore.computeCompleteness({
    ...swatiScoreArgs, travelNotes: 'I work Delhi NCR only.',
  });
  ok('§2.4 ★ open_to_travel=TRUE with EMPTY notes scores ZERO on travel — the boolean is not the term',
    Math.abs(boolYesNotesEmpty - 0.180) < 1e-9, `got ${boolYesNotesEmpty}`);
  ok('§2.5 ★ a STATED "no travel" policy scores FULL credit — an honest posture is completeness',
    Math.abs(boolNoNotesWritten - boolYesNotesEmpty - 0.100) < 1e-9,
    `delta ${boolNoNotesWritten - boolYesNotesEmpty}`);
  ok('§2.6 whitespace-only travel notes are not a stated policy',
    profileScore.computeCompleteness({ ...swatiScoreArgs, travelNotes: '   ' }) === boolYesNotesEmpty);
  ok('§2.7 the breakdown reports travel per-term (the meter extends this file, not a twin)',
    profileScore.completenessBreakdown({ travelNotes: 'x' }).travel.met === true
    && profileScore.completenessBreakdown({}).travel.met === false);

  // The disclosed ranking-movement class, asserted rather than promised.
  const p1Weights = { photos: 0.30, about: 0.15, tags: 0.15, rate: 0.15, hero: 0.15, ig: 0.10 };
  const p1Score = (a) => p1Weights.photos * Math.min(a.approvedPhotoCount / 6, 1)
    + p1Weights.ig * (a.instagramHandle ? 1 : 0);
  ok('§2.8 with NO policy stated anywhere, the new score is exactly old × 0.90 — a MONOTONE '
    + 'transform, so completeness ORDERING cannot move',
    Math.abs(profileScore.computeCompleteness(swatiScoreArgs) - p1Score(swatiScoreArgs) * 0.9) < 1e-9);
}

// ─────────────────────────────────────────────────────────────────────────────────
section('§3 · THE METER\'S HINTS (Fork 5\'s ruled substitute)');
{
  const hints = profileScore.meterHints(swatiScoreArgs);
  ok('§3.1 exactly three hints are returned by default', hints.length === 3, JSON.stringify(hints.map(h => h.term)));
  ok('§3.2 a MET term produces NO hint — the live IG handle is silent, the control cell',
    !hints.some(h => h.term === 'ig'));
  ok('§3.3 the largest weight×gap leads — photos, at 0.180 against a four-way 0.135 tie',
    hints[0].term === 'photos' && Math.abs(hints[0].value - 0.180) < 1e-9);
  // RE-AIMED BEFORE DELIVERY, disclosed: the first draft of this cell asserted that two
  // calls agree and that the order was hero-then-about. Mutation P2-4 (deleting the
  // comparator's SECTION_ORDER limb) left it GREEN — because the array is built by
  // SECTION_ORDER.filter() and Array#sort is stable, so the limb is belt-and-braces and
  // the cell was greening on a property it was not testing. That is F-06.111's shape in a
  // new costume. The cell now asserts the tie group against SECTION_ORDER ITSELF, so the
  // mechanism that actually decides the order is the thing under test — and P2-4 mutates
  // SECTION_ORDER accordingly.
  // The expectation is WRITTEN OUT, deliberately, rather than derived from SECTION_ORDER:
  // a cell that computes its own prediction from the same constant it is testing moves with
  // the mutation and can never fail. (Both wrong drafts are recorded above and in the
  // handover — the second was the tautological one.)
  ok('§3.4 ★ the TIE-BREAK IS SECTION_ORDER — the four-way 0.135 tie resolves HERO then ABOUT, '
    + 'screen order, identically on every call (never a different three per page load)',
    hints[1].term === 'hero' && hints[2].term === 'about'
    && JSON.stringify(profileScore.meterHints(swatiScoreArgs).map(h => h.term))
       === JSON.stringify(hints.map(h => h.term)),
    `got ${JSON.stringify(hints.map(h => h.term))}`);
  ok('§3.5 hints carry the NUMBER the copy interpolates — "add {n} more photos" has a real n',
    hints[0].detail.need === 6 && hints[0].detail.have === 2);
  const complete = profileScore.meterHints({
    approvedPhotoCount: 6, hasHero: true, about: 'a', aestheticTags: ['a', 'b', 'c'],
    rateMin: 1, rateMax: 2, instagramHandle: 'h', travelNotes: 'n',
  });
  ok('§3.6 a complete profile produces ZERO hints — the meter stops nagging when it should',
    complete.length === 0);
  ok('§3.7 SECTION_ORDER covers every scored term — no term can tie into an undefined slot',
    Object.keys(profileScore.TERM_WEIGHTS).filter(k => !profileScore.SECTION_ORDER.includes(k)).length === 0);
}

// ─────────────────────────────────────────────────────────────────────────────────
section('§4 · THE PATCH ALLOWLIST\'S THREE ADDITIONS — through the REAL handler');
{
  const t = { vendors: [SWATI], users: [{ id: 'u-swati', name: 'Swati Roy' }] };
  const r = await callMe('patch', SWATI, {
    about: 'Delhi makeup artist, ten years of brides.',
    rate_display: false,
    discover_paused: true,
  }, t);
  const sent = r.supabase._updates.find(u => u.table === 'vendors');
  ok('§4.1 the handler accepted the write (200)', r.captured && r.captured.code !== 400, JSON.stringify(r.captured && r.captured.body));
  ok('§4.2 ★ `about` REACHED THE UPDATE — F-07.8\'s cure: the scored, feed-rendered column '
    + 'had zero writers in the estate before this line',
    !!sent && sent.payload.about === 'Delhi makeup artist, ten years of brides.', JSON.stringify(sent && sent.payload));
  ok('§4.3 `rate_display` reached the update', !!sent && sent.payload.rate_display === false);
  ok('§4.4 `discover_paused` reached the update', !!sent && sent.payload.discover_paused === true);
  ok('§4.5 the response ECHOES all three — a save the screen cannot read back is faith, not proof',
    r.captured.body.vendor.about === 'Delhi makeup artist, ten years of brides.'
    && r.captured.body.vendor.rate_display === false
    && r.captured.body.vendor.discover_paused === true, JSON.stringify(r.captured.body.vendor));

  const locked = await callMe('patch', SWATI, { tier: 'prestige' }, t);
  ok('§4.6 LOCKED_FIELDS still refuse — the allowlist grew, the lock did not loosen',
    locked.captured.code === 400);
  const unknown = await callMe('patch', SWATI, { discover_eligible: true }, t);
  const unkSent = unknown.supabase._updates.find(u => u.table === 'vendors');
  ok('§4.7 ★ a field on NEITHER list is silently DROPPED, never written — a vendor cannot '
    + 'grant themselves Discover eligibility through the profile editor',
    !unkSent || unkSent.payload.discover_eligible === undefined);
}

// ─────────────────────────────────────────────────────────────────────────────────
section('§5 · THE BOOLEAN GUARD');
{
  const t = { vendors: [SWATI], users: [{ id: 'u-swati', name: 'Swati Roy' }] };
  const bad = await callMe('patch', SWATI, { discover_paused: 'maybe' }, t);
  ok('§5.1 ★ a STRING posture is a 400, never a coercion — "am I hidden?" must not be '
    + 'answered by whatever the driver decided that day',
    bad.captured.code === 400, JSON.stringify(bad.captured && bad.captured.body));
  ok('§5.2 nothing was written on the refused turn',
    !bad.supabase._updates.some(u => u.table === 'vendors'));
  const bad2 = await callMe('patch', SWATI, { rate_display: 1 }, t);
  ok('§5.3 the guard covers rate_display too — 1 is not true', bad2.captured.code === 400);
  const bad3 = await callMe('patch', SWATI, { briefing_enabled: 'yes' }, t);
  ok('§5.4 and briefing_enabled, which was allowlisted long before this sitting and unguarded',
    bad3.captured.code === 400);
  const good = await callMe('patch', SWATI, { discover_paused: false }, t);
  ok('§5.5 a real boolean passes — the guard refuses shapes, not values',
    good.captured.code !== 400);
}

// ─────────────────────────────────────────────────────────────────────────────────
section('§6 · THE PAUSE ROUND TRIP, SERVER-SIDE (this retires the P1 §8.3 founder SQL)');
{
  const paused = { ...SWATI, discover_paused: true };
  const g = await callMe('get', paused, null, { vendors: [paused], users: [{ id: 'u-swati', name: 'Swati Roy' }] });
  ok('§6.1 GET reports the paused posture back — the switch can render its own truth',
    g.captured.body.vendor.discover_paused === true);
  ok('§6.2 ★ APPROVAL IS RETAINED while paused — the whole point of a second column',
    g.captured.body.vendor.discover_eligible === true);

  // …and the feed, driven for real, must not carry her.
  const feedMod = path.join(ROOT, 'src/api/couple/discover');
  delete require.cache[require.resolve(feedMod)];
  ranking._resetWeightsCache();
  const router = require(feedMod);
  const layer = router.stack.find(l => l.route && l.route.path === '/feed' && l.route.methods.get);
  const sb = makeSupabase({
    vendors: [paused, { ...SWATI, id: 'v-live', discover_paused: false }],
    vendor_portfolio: [], spotlight: [], vendor_featured_submissions: [],
    vendor_activity_log: [], demo_vendors: [], admin_config: [],
  });
  let cap = null;
  const res = { status(c) { this._code = c; return this; }, json(b) { cap = { code: this._code, body: b }; return this; } };
  await new Promise((resolve, reject) => {
    layer.route.stack[0].handle({ app: { locals: { supabase: sb } }, query: {} }, res,
      (e) => (e ? reject(e) : resolve()));
    setTimeout(resolve, 0);
  });
  for (let i = 0; i < 12 && !cap; i++) await new Promise(r => setImmediate(r));
  const ids = (cap.body.vendors || []).map(v => v.id);
  ok('§6.3 ★ the paused vendor is ABSENT from the real feed', !ids.includes(paused.id), ids.join(','));
  ok('§6.4 the unpaused sibling is present — pause removes one row, not the feed', ids.includes('v-live'));
  const filters = sb._calls.filter(c => c.table === 'vendors').flatMap(c => c.filters);
  ok('§6.5 the PREDICATE ITSELF was sent, not merely reflected by fixtures',
    filters.includes('eq:discover_paused=false'), filters.join(' | '));
}

// ─────────────────────────────────────────────────────────────────────────────────
section('§7 · GET /me\'s SHAPE — F-07.9\'s SERVER HALF');
{
  const g = await callMe('get', SWATI, null, { vendors: [SWATI], users: [{ id: 'u-swati', name: 'Swati Roy' }] });
  const v = g.captured.body.vendor;
  // The live defect this cures, in one line: the settings screen rendered its routing
  // HANDLE populated two cards below an Instagram field showing a placeholder, while the
  // column held 'Makeupbyswatiroy'. The response had it; the hook dropped it. Now BOTH
  // travel, and the pwa harness asserts the hook stops dropping.
  ok('§7.1 ★ instagram_handle travels — the witnessed lie\'s server half',
    v.instagram_handle === 'Makeupbyswatiroy', JSON.stringify(v.instagram_handle));
  const owed = ['style_notes', 'travel_notes', 'about', 'invoice_prefix', 'briefing_enabled',
                'rate_display', 'discover_paused'];
  const missing = owed.filter(k => !(k in v));
  ok('§7.2 every field the vendor can EDIT is a field GET returns — count first, then names',
    missing.length === 0, `missing: ${missing.join(', ')}`);
  ok('§7.3 ★ briefing_enabled reflects the ROW, not a constant — an opted-out vendor sees OFF '
    + 'and can turn it back on (the hook\'s hardcoded `true` trapped them)',
    (await callMe('get', { ...SWATI, briefing_enabled: false }, null,
      { vendors: [{ ...SWATI, briefing_enabled: false }], users: [{ id: 'u-swati', name: 'Swati Roy' }] }
    )).captured.body.vendor.briefing_enabled === false);
  ok('§7.4 NOT-NULL-with-default columns read exactly — `!== false`, never a "not yet decided"',
    v.rate_display === true && v.discover_paused === false);
  ok('§7.5 the travel pair travels TOGETHER — the boolean and the policy, both readable',
    v.open_to_travel === true && v.travel_notes === null);
}

// ─────────────────────────────────────────────────────────────────────────────────
section('§8 · F-07.4 RECONCILED — the gate counts total, the score counts approved');
{
  // The specimen the whole fork was argued on: six uploaded, four approved.
  const rows = [];
  for (let i = 0; i < 4; i++) rows.push({ id: `p${i}`, vendor_id: SWATI.id, approval_state: 'approved' });
  for (let i = 4; i < 6; i++) rows.push({ id: `p${i}`, vendor_id: SWATI.id, approval_state: 'pending' });
  const sb = makeSupabase({
    vendors: [SWATI], vendor_portfolio: rows, vendor_discover_requests: [], muse_saves: [],
  });
  const res = await vendorDisc.requestDiscover(sb, SWATI.id, {
    rate_min: 100000, rate_max: 300000, aesthetic_tags: ['soft', 'editorial', 'bridal'],
  });
  ok('§8.1 ★ 6 uploaded / 4 approved PASSES the gate — requesting Discover stays SELF-SERVE, '
    + 'never a wait on the standalone admin photo queue',
    res.ok === true, JSON.stringify(res));
  const score = profileScore.computeCompleteness({ ...swatiScoreArgs, approvedPhotoCount: 4 });
  const full  = profileScore.computeCompleteness({ ...swatiScoreArgs, approvedPhotoCount: 6 });
  ok('§8.2 ★ the SCORE on the same vendor counts 4, not 6 — a couple sees approved rows only '
    + 'and a score crediting invisible photos would rank a card above what it renders',
    score < full, `${score} vs ${full}`);
  ok('§8.3 the breakdown exposes BOTH numbers so one line can show them and never contradict',
    profileScore.completenessBreakdown({ ...swatiScoreArgs, approvedPhotoCount: 4 }).photos.have === 4);

  const five = [];
  for (let i = 0; i < 5; i++) five.push({ id: `q${i}`, vendor_id: SWATI.id, approval_state: 'approved' });
  const sb2 = makeSupabase({ vendors: [SWATI], vendor_portfolio: five, vendor_discover_requests: [], muse_saves: [] });
  const res2 = await vendorDisc.requestDiscover(sb2, SWATI.id, {
    rate_min: 100000, rate_max: 300000, aesthetic_tags: ['a'],
  });
  ok('§8.4 ★ FIVE no longer passes — the raise is enforced server-side, not merely displayed',
    res2.ok === false && /6/.test(res2.error), JSON.stringify(res2));
}

// ─────────────────────────────────────────────────────────────────────────────────
section('§9 · THE SERVER CARRIES THE FLOOR (CE ruling §F)');
{
  const sb = makeSupabase({
    vendors: [SWATI],
    vendor_portfolio: [{ id: 'p1', vendor_id: SWATI.id, approval_state: 'approved' }],
    vendor_discover_requests: [], muse_saves: [],
  });
  const st = await vendorDisc.getDiscoverStatus(sb, SWATI.id);
  ok('§9.1 ★ getDiscoverStatus TELLS the client the floor — the pwa\'s number becomes '
    + 'display-only truth instead of a second authority',
    st.min_portfolio_images === 6, JSON.stringify(st.min_portfolio_images));
  ok('§9.2 it is the SAME constant, not a literal typed beside it',
    st.min_portfolio_images === vendorDisc.MIN_PORTFOLIO_IMAGES);
  ok('§9.3 the summary still travels beside it — both numbers, one call',
    st.portfolio_summary && st.portfolio_summary.total === 1 && st.portfolio_summary.approved === 1);
}

// ─────────────────────────────────────────────────────────────────────────────────
section('§10 · THE MUTATION LEDGER (non-vacuity — production bytes, not test setup)');
console.log('      Each line names the PRODUCTION byte whose mutation must redden the section.');
console.log('      Every one was run at the executor\'s hand and cmp-restored; counts in the handover.');
console.log('      P2-1  discover.js   MIN_PORTFOLIO_IMAGES 6 → 5                     ⇒ §1.1/§8.4 RED');
console.log('      P2-2  profileScore  TERM_WEIGHTS.travel 0.10 → 0                   ⇒ §2.1/§2.5 RED');
console.log('      P2-3  profileScore  travelTerm reads open_to_travel, not the notes  ⇒ §2.4 RED');
console.log('      P2-4  profileScore  SECTION_ORDER re-ordered (hero after about)       ⇒ §3.4 RED');
console.log('      P2-5  me.js         \'about\' removed from ALLOWED_FIELDS              ⇒ §4.2 RED');
console.log('      P2-6  me.js         the BOOLEAN_FIELDS guard loop deleted            ⇒ §5.1 RED');
console.log('      P2-7  me.js         instagram_handle dropped from the GET response   ⇒ §7.1 RED');
console.log('      P2-8  discover.js   min_portfolio_images removed from the status     ⇒ §9.1 RED');

console.log('');
const total = pass + fail;
if (fail === 0) console.log(`GREEN — b07_p2_bench ${pass}/${total}`);
else            console.log(`RED — b07_p2_bench ${pass}/${total}`);
process.exit(fail === 0 ? 0 : 1);
})().catch(err => { console.error('BENCH THREW:', err); process.exit(1); });
