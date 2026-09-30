'use strict';
// scripts/b144_ads1_panel_bench.js · TDW CE-46 · ADS-1 · cut 1 · rung b144.
//
// WHAT IT HOLDS: the dream-os half of the Posts & ads control panel (R-46.10, R-46.11, R-46.12) behaves as ruled.
//   §1 the connect's state: signed, kind 'ads', expires, refuses a tamper and a foreign key.
//   §2 the gate: flag.ads 'armed' opens for ADS_WALK_VENDOR_ID only; 'on' for all; anything else shut.
//   §3 the three gaps, in the founder's order, with the configuration's seven scopes.
//   §4 her settings: validate() refuses in words, turns choices into Meta's fields, one day takes a total, the echo
//      moves with any setting.
//   §5 THE DOORS OVER HTTP, through the real router (express), Meta's fetch and Supabase stubbed in memory:
//      closed gate; not connected; /authorize arms one nonce; /callback spends it ONCE and stores the token; no door
//      ever returns the token; /prepare creates NOTHING; /run refuses a wrong echo and a below-minimum amount before any
//      Meta call; a good /run writes the row BEFORE Meta, creates four objects PAUSED, then sets three ACTIVE; a Meta
//      refusal marks the row with its step and code; management: echo, re-validation, minimum, only the changed field
//      sent, duplicate touches no Meta, another vendor's ad is not found; Meta's 190 surfaces as 'expired'.
//   §6 MUTATIONS of production code, each run in a child and each required to redden, restored by sha.
// No network, no database, no clock beyond Date.now for TTLs. THE EXIT CODE IS THE VERDICT.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
let pass = 0; let fail = 0; const failed = [];
function ok(c, name, info) { if (c) { pass += 1; if (!process.env.B144_QUIET) console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => { if (!process.env.B144_QUIET) console.log(`\n§${t}`); };

// ── stubs: auth middleware, then the modules ─────────────────────────────────────────────────────────────────────
const VENDOR_A = '11111111-1111-4111-8111-111111111111';
const VENDOR_B = '22222222-2222-4222-8222-222222222222';
function stubModule(rel, exp) { const p = require.resolve(path.join(ROOT, rel)); require.cache[p] = { id: p, filename: p, loaded: true, exports: exp }; }
stubModule('src/api/middleware/requireAuth.js', (req, _res, next) => next());
stubModule('src/api/middleware/resolveVendor.js', () => (req, _res, next) => { req.vendor = { id: req.get('x-vendor') || VENDOR_A, city: 'Lucknow' }; next(); });

const ENV = { ADS_APP_ID: '4570863996490339', ADS_APP_SECRET: 'bench-secret', ADS_CONFIG_ID: '1863002924861430',
  ADS_REDIRECT_URI: 'https://api.thedreamwedding.in/api/v2/vendor/ads/callback', ADS_WALK_VENDOR_ID: VENDOR_A, PWA_BASE_URL: 'https://pwa.test' };
Object.assign(process.env, ENV);

const oauth = require(path.join(ROOT, 'src/lib/ads/oauth'));
const door = require(path.join(ROOT, 'src/lib/ads/door'));
const meta = require(path.join(ROOT, 'src/lib/ads/meta'));
const target = require(path.join(ROOT, 'src/lib/ads/targeting'));
const cap = require(path.join(ROOT, 'src/lib/capabilities'));
const express = require('express');
const adsRouter = require(path.join(ROOT, 'src/api/vendor/ads'));

// ── an in-memory Supabase covering exactly the calls the ads files make ──────────────────────────────────────────
function fakeDb() {
  const T = { capabilities: [], vendor_ad_connections: [], vendor_ads: [] };
  const log = [];
  const timeline = [];
  function q(table) {
    const st = { table, op: 'select', filters: [], cols: '*', patch: null, rows: null, order: null, lim: null, ret: false };
    const rowsNow = () => T[table].filter((r) => st.filters.every(([k, v]) => r[k] === v));
    const pick = (r) => { if (st.cols === '*') return { ...r }; const o = {}; for (const c of st.cols.split(',').map((x) => x.trim())) o[c] = r[c] === undefined ? null : r[c]; return o; };
    function run() {
      if (st.op === 'select') { let rs = rowsNow(); if (st.order) rs = rs.slice().sort((a, b) => (st.order.asc ? 1 : -1) * String(a[st.order.k]).localeCompare(String(b[st.order.k]))); if (st.lim) rs = rs.slice(0, st.lim); return rs.map(pick); }
      if (st.op === 'insert') { const r = { id: crypto.randomUUID(), created_at: new Date(Date.now() + T[table].length).toISOString(), ...st.rows }; T[table].push(r); log.push(['insert', table, r.id]); timeline.push(['db', 'insert', table]); return [pick(r)]; }
      if (st.op === 'upsert') { const k = st.conflict; let r = T[table].find((x) => x[k] === st.rows[k]); if (r) Object.assign(r, st.rows); else { r = { id: crypto.randomUUID(), ...st.rows }; T[table].push(r); } log.push(['upsert', table]); return [pick(r)]; }
      if (st.op === 'update') { const rs = rowsNow(); for (const r of rs) Object.assign(r, st.patch); log.push(['update', table, Object.keys(st.patch).join(',')]); return st.ret ? rs.map(pick) : null; }
      if (st.op === 'delete') { const rs = rowsNow(); T[table] = T[table].filter((r) => !rs.includes(r)); return null; }
      return null;
    }
    const api = {
      select(c) { if (st.op === 'select') st.cols = c || '*'; else { st.ret = true; st.cols = c || '*'; } return api; },
      insert(r) { st.op = 'insert'; st.rows = r; return api; },
      upsert(r, o) { st.op = 'upsert'; st.rows = r; st.conflict = (o && o.onConflict) || 'id'; return api; },
      update(p) { st.op = 'update'; st.patch = p; return api; },
      delete() { st.op = 'delete'; return api; },
      eq(k, v) { st.filters.push([k, v]); return api; },
      order(k, o) { st.order = { k, asc: !(o && o.ascending === false) }; return api; },
      limit(n) { st.lim = n; return api; },
      maybeSingle() { const d = run(); return Promise.resolve({ data: Array.isArray(d) ? (d[0] || null) : d, error: null }); },
      single() { const d = run(); return Promise.resolve({ data: Array.isArray(d) ? d[0] : d, error: null }); },
      then(res, rej) { try { return Promise.resolve({ data: run(), error: null }).then(res, rej); } catch (e) { return Promise.reject(e).then(res, rej); } },
    };
    return api;
  }
  return { T, log, timeline, from: q };
}

// ── Meta, stubbed: a scripted Graph ───────────────────────────────────────────────────────────────────────────────
function fakeMeta(opts = {}) {
  const calls = [];
  const timeline = opts.timeline || null;
  const acct = { currency: 'INR', min_daily_budget: 10000, account_status: 1, name: 'Swati Roy Makeup' };
  async function f(url, init) {
    const u = new URL(url); const p = u.pathname.replace(/^\/v[0-9.]+\//, '');
    const form = init && init.body ? Object.fromEntries(new URLSearchParams(init.body)) : null;
    calls.push({ method: init && init.method, p, form, auth: init && init.headers && init.headers.Authorization });
    if (timeline) timeline.push(['meta', init && init.method, p]);
    const J = (o, status = 200) => ({ ok: status < 400, status, json: async () => o });
    if (opts.dead) return J({ error: { code: 190, message: 'Error validating access token' } }, 400);
    if (p === 'oauth/access_token') return J({ access_token: u.searchParams.get('grant_type') ? 'LONG-TOKEN' : 'SHORT-TOKEN', expires_in: 5184000 });
    if (p === 'me') return J({ id: 'FB1' });
    if (p === 'me/permissions') return J({ data: meta.NEEDED_SCOPES.map((permission) => ({ permission, status: 'granted' })) });
    const PAGE = { id: 'PAGE1', name: 'The Dream Wedding', instagram_business_account: { id: 'IG1', username: 'thedreamwedding_in' } };
    if (p === 'me/accounts') return J({ data: opts.portfolioOnly ? [] : [PAGE] });
    if (p === 'me/businesses') return J({ data: opts.portfolioOnly ? [{ id: 'B1', name: 'thedreamwedding', owned_pages: { data: [PAGE] } }] : [] });
    if (p === 'me/adaccounts') return J({ data: [{ id: 'act_4417', name: 'Swati Roy Makeup', account_status: 1, currency: 'INR' }]
      .concat(opts.twoAccounts ? [{ id: 'act_9999', name: 'Dev Roy', account_status: 1, currency: 'INR' }] : []) });
    if (p === 'PAGE1' && u.searchParams.get('fields') === 'access_token') return J({ id: 'PAGE1', access_token: 'PAGE-TOKEN' });
    if (p === 'PAGE1/posts') return J({ data: [{ id: '1008033895736362_555', message: 'Meher and Kabir. Jaipur', full_picture: 'https://x/fb.jpg', created_time: new Date().toISOString() }] });
    if (p === 'act_4417' && init.method === 'GET') return J(acct);
    if (p === 'IG1/media') return J({ data: [
      { id: '17890000000000001', caption: 'Aanya and Rohan', media_type: 'IMAGE', timestamp: new Date(Date.now() - 7 * 864e5).toISOString(), boost_eligibility_info: { eligible_to_boost: true },
        ...(opts.noLikes ? {} : { like_count: 212, comments_count: 18 }) },
      { id: '17890000000000003', caption: 'A reel', media_type: 'VIDEO', media_url: 'https://x/reel.mp4', thumbnail_url: 'https://x/reel-cover.jpg', timestamp: new Date(Date.now() - 3 * 864e5).toISOString(), boost_eligibility_info: { eligible_to_boost: true } },
      { id: '17890000000000002', caption: 'Newest one', media_type: 'IMAGE', timestamp: new Date(Date.now() - 1 * 864e5).toISOString(), boost_eligibility_info: { eligible_to_boost: true },
        ...(opts.noLikes ? {} : { like_count: 3, comments_count: 0 }) }] });
    if (/\/insights$/.test(p) && p.startsWith('1789')) return opts.noInsights ? J({ error: { code: 10, message: 'Application does not have permission' } }, 400)
      : J({ data: [{ name: 'saved', values: [{ value: 48 }] }, { name: 'reach', values: [{ value: 3100 }] }] });
    if (p === 'search') return J({ data: [{ key: '1035921', name: 'Lucknow', type: 'city', region: 'Uttar Pradesh', country_name: 'India' }] });
    if (init.method === 'POST' && opts.refuseAt && p.endsWith(opts.refuseAt)) return J({ error: { code: 100, message: 'Invalid parameter' } }, 400);
    if (init.method === 'POST' && /^act_4417\/(campaigns|adsets|adcreatives|ads)$/.test(p)) return J({ id: `${p.split('/')[1]}-id` });
    if (init.method === 'POST') return J({ success: true });
    if (/\/insights$/.test(p)) return J({ data: [{ date_start: '2026-10-01', impressions: '1802', reach: '1240', clicks: '61', spend: '210.5', actions: [{ action_type: 'onsite_conversion.messaging_conversation_started_7d', value: '2' }] }] });
    if (/^ads-id$/.test(p)) return J({ status: 'ACTIVE', effective_status: 'PENDING_REVIEW' });
    return J({ data: [] });
  }
  return { f, calls, acct };
}

// ── HTTP harness ─────────────────────────────────────────────────────────────────────────────────────────────────
async function withServer(db, fn) {
  const app = express(); app.use(express.json()); app.locals.supabase = db; app.use('/ads', adsRouter);
  const srv = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const base = `http://127.0.0.1:${srv.address().port}/ads`;
  const call = async (m, p, body, vendor) => {
    const res = await fetch(base + p, { method: m, redirect: 'manual', headers: { 'content-type': 'application/json', 'x-vendor': vendor || VENDOR_A }, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch (_e) { json = null; }
    return { status: res.status, json, text, location: res.headers.get('location') };
  };
  try { await fn(call); } finally { srv.close(); }
}
const armed = (db, status = 'armed') => { db.T.capabilities = [{ key: 'flag.ads', kind: 'flag', status }]; cap._resetCapabilitiesCache(); };
function connected(db, vendor = VENDOR_A) {
  db.T.vendor_ad_connections.push({ id: crypto.randomUUID(), vendor_id: vendor, access_token: 'LONG-TOKEN', token_expires_at: new Date(Date.now() + 864e5).toISOString(), connected_at: new Date().toISOString(), granted_scopes: meta.NEEDED_SCOPES.slice() });
}
function goodSettings() {
  const start = new Date(Date.now() + 3600e3); const end = new Date(start.getTime() + 3 * 864e5);
  return { places: [{ type: 'city', key: '1035921', name: 'Lucknow', radius_km: 25 }], age_min: 22, age_max: 40, placements: { instagram: ['stream', 'reels'], facebook: [] },
    budget: { kind: 'daily', minor: 20000 }, start: start.toISOString(), end: end.toISOString(), media_id: '17890000000000001', welcome: { text: 'Hi', icebreakers: ['Is my date free?'] } };
}

(async () => {
  sec('1  the connect\'s state');
  const s1 = oauth.mintState(VENDOR_A, ENV, 1000);
  ok(oauth.verifyState(s1.state, ENV, 2000).ok === true, '1.1 a fresh state verifies');
  ok(/expired/.test(oauth.verifyState(s1.state, ENV, 1000 + oauth.STATE_TTL_MS + 1).error), '1.2 an old state expires');
  ok(oauth.verifyState('X' + s1.state.slice(1), ENV, 2000).ok === false, '1.3 a tampered state refuses');
  ok(oauth.verifyState(s1.state, { ...ENV, ADS_APP_SECRET: 'other' }, 2000).ok === false, '1.4 another key refuses');
  const u = new URL(oauth.authorizeUrl(s1.state, ENV));
  ok(u.searchParams.get('config_id') === ENV.ADS_CONFIG_ID && u.searchParams.get('redirect_uri') === ENV.ADS_REDIRECT_URI, '1.5 the address carries the configuration and the redirect');

  sec('2  the gate');
  const g = (status, v) => door.openFor({ row: status ? { status } : null, vendorId: v, env: ENV }).open;
  ok(g(null, VENDOR_A) === false && g('off', VENDOR_A) === false, '2.1 no row or off: shut');
  ok(g('armed', VENDOR_A) === true && g('armed', VENDOR_B) === false, '2.2 armed opens only for the walk vendor');
  ok(g('on', VENDOR_B) === true, '2.3 on opens for every vendor');

  sec('3  the three gaps, the founder\'s order');
  const all = meta.NEEDED_SCOPES;
  ok(all.length === 7 && !all.includes('business_management'), '3.1 the seven scopes, business_management not among them');
  ok(meta.gapsFrom({ scopes: all.slice(1) }).gap === 'scopes', '3.2 a declined permission first');
  ok(meta.gapsFrom({ scopes: all }).gap === 'page', '3.3 then no Page');
  ok(meta.gapsFrom({ scopes: all, pageList: [{ id: '1', name: 'P', ig: null }] }).gap === 'link', '3.4 then no Instagram link');
  ok(meta.gapsFrom({ scopes: all, pageList: [{ id: '1', name: 'P', ig: { id: '9' } }], accounts: [{ id: 'act_1', status: 2 }] }).gap === 'ad_account', '3.5 then no active ad account');
  ok(meta.gapsFrom({ scopes: all, pageList: [{ id: '1', name: 'P', ig: { id: '9' } }], accounts: [{ id: 'act_1', status: 1 }] }).gap === null, '3.6 then ready');

  sec('4  her settings');
  const v1 = target.validate(goodSettings());
  ok(v1.ok && v1.days === 3 && v1.total_minor === 60000, '4.1 good settings: 3 days, total 3 x the amount', JSON.stringify(v1.errors));
  ok(v1.adset.daily_budget === '20000' && v1.adset.targeting.geo_locations.cities[0].radius === 25, '4.2 Meta\'s fields: daily_budget and the city with its radius');
  const one = goodSettings(); one.end = new Date(Date.parse(one.start) + 864e5).toISOString();
  const v2 = target.validate(one);
  ok(v2.ok && v2.adset.lifetime_budget === '20000' && !('daily_budget' in v2.adset), '4.3 exactly one day takes a total (Meta\'s 24-hour rule)');
  ok(target.validate({ ...goodSettings(), age_max: 41 }).confirm !== v1.confirm, '4.4 the echo moves with a setting');
  const bad = target.validate({ places: [], age_min: 17, genders: [3], budget: {}, welcome: { icebreakers: ['a', 'b', 'c', 'd'] } });
  ok(!bad.ok && bad.errors.length >= 6 && bad.errors.every((m) => /^[A-Z]/.test(m)), '4.5 malformed settings refused in words', JSON.stringify(bad.errors));

  sec('5  the doors over HTTP');
  {
    const db = fakeDb(); const m = fakeMeta(); adsRouter._setFetch(m.f); armed(db, 'off');
    await withServer(db, async (call) => {
      const r = await call('GET', '/'); ok(r.status === 200 && r.json.open === false, '5.1 flag off: the section is shut');
      armed(db, 'armed');
      const r2 = await call('GET', '/', null, VENDOR_B); ok(r2.json.open === false, '5.2 armed: another vendor still shut');
      const r3 = await call('GET', '/'); ok(r3.json.open === true && r3.json.connected === false, '5.3 armed walk vendor, not connected');
      const a = await call('GET', '/authorize'); const st = new URL(a.json.authorize_url).searchParams.get('state');
      ok(a.status === 200 && db.T.vendor_ad_connections.length === 1 && db.T.vendor_ad_connections[0].pending_state_nonce, '5.4 /authorize arms one nonce');
      const cb = await call('GET', `/callback?code=C&state=${encodeURIComponent(st)}`);
      ok(cb.status === 302 && /ads=connected/.test(cb.location), '5.5 /callback spends the state and returns to the room', cb.location);
      ok(db.T.vendor_ad_connections[0].access_token === 'LONG-TOKEN' && db.T.vendor_ad_connections[0].pending_state_nonce === null, '5.6 the long-lived token stored, the nonce cleared');
      const replay = await call('GET', `/callback?code=C&state=${encodeURIComponent(st)}`);
      ok(/ads=expired/.test(replay.location), '5.7 a replayed state is refused');
      const r4 = await call('GET', '/');
      ok(r4.json.connected === true && r4.json.gaps.gap === null && !/LONG-TOKEN/.test(r4.text), '5.8 connected, ready, and no door returns the token', r4.text.slice(0, 200));
    });
  }
  {
    const db = fakeDb(); const m = fakeMeta({ timeline: db.timeline }); adsRouter._setFetch(m.f); armed(db); connected(db);
    await withServer(db, async (call) => {
      const st = await call('GET', '/start');
      ok(st.json.settings && st.json.settings.places[0].name.startsWith('Lucknow') && st.json.settings.places[0].radius_km === 25 && st.json.settings.age_min === 22, '5.9 the starting draft: her city at 25 km, 22 to 40');
      ok(st.json.suggestion && st.json.suggestion.basis === 'saves', '5.10 the suggestion by saves when Meta has insights');
      const posts0 = m.calls.filter((c) => c.method === 'POST').length;
      const pr = await call('POST', '/prepare', { settings: goodSettings() });
      ok(pr.json.confirm && pr.json.total_minor === 60000 && pr.json.facts.minDailyMinor === 10000, '5.11 /prepare returns the total, Meta\'s minimum and the echo');
      ok(m.calls.filter((c) => c.method === 'POST').length === posts0 && db.T.vendor_ads.length === 0, '5.12 /prepare creates NOTHING');
      const wrong = await call('POST', '/run', { settings: pr.json.settings, confirm: 'not-it' });
      const rebuilt = await call('POST', '/run', { settings: goodSettings(), confirm: pr.json.confirm });
      ok(rebuilt.status === 400 && db.T.vendor_ads.length === 0, '5.13a settings rebuilt a moment later do not match the echo: refused');
      ok(wrong.status === 400 && db.T.vendor_ads.length === 0 && m.calls.filter((c) => c.method === 'POST').length === posts0, '5.13 a wrong echo: refused before any row or Meta call');
      const low = goodSettings(); low.budget.minor = 5000; const lp = target.validate(low);
      const lr = await call('POST', '/run', { settings: low, confirm: lp.confirm });
      ok(lr.status === 400 && lr.json.code === 'ADS_BELOW_MIN' && db.T.vendor_ads.length === 0, '5.14 below Meta\'s minimum: refused before any row');
      db.timeline.length = 0; const before = m.calls.length;
      const run = await call('POST', '/run', { settings: pr.json.settings, confirm: pr.json.confirm });   // the room sends back what /prepare returned
      const posts = m.calls.slice(before).filter((c) => c.method === 'POST');
      ok(run.json.ad && run.json.ad.status === 'running', '5.15 a good /run is running', run.text);
      const iRow = db.timeline.findIndex((e) => e[0] === 'db' && e[2] === 'vendor_ads'); const iMeta = db.timeline.findIndex((e) => e[0] === 'meta' && e[1] === 'POST');
      ok(iRow >= 0 && iMeta > iRow, '5.16 the row is written BEFORE any Meta POST', JSON.stringify(db.timeline.slice(0, 8)));
      const creates = posts.slice(0, 4);
      ok(creates.map((c) => c.p.split('/')[1]).join(',') === 'campaigns,adsets,adcreatives,ads', '5.17 four objects, in order');
      ok(creates.length === 4 && creates.filter((c) => c.form.status).length === 3 && creates.filter((c) => c.form.status).every((c) => c.form.status === 'PAUSED'), '5.18 every created object is PAUSED (the creative has no status)');
      ok(creates[1].form.destination_type === 'INSTAGRAM_DIRECT' && creates[1].form.optimization_goal === 'CONVERSATIONS' && creates[1].form.billing_event === 'IMPRESSIONS', '5.19 the messages ad\'s fixed fields');
      ok(/INSTAGRAM_MESSAGE/.test(creates[2].form.call_to_action) && creates[2].form.source_instagram_media_id === '17890000000000001', '5.20 the creative is her post with Send message');
      ok(posts.slice(4).length === 3 && posts.slice(4).every((c) => c.form.status === 'ACTIVE'), '5.21 then exactly three set ACTIVE');
      ok(db.T.vendor_ads[0].status === 'running' && db.T.vendor_ads[0].ad_id === 'ads-id' && db.T.vendor_ads[0].settings.media_id, '5.22 the row holds Meta\'s ids and every setting');
      ok(db.T.vendor_ads[0].settings.post && db.T.vendor_ads[0].settings.post.caption_line === 'Aanya and Rohan', '5.22a the row carries the post\'s first caption line (gap 1)', JSON.stringify(db.T.vendor_ads[0].settings.post));
      ok(target.validate(db.T.vendor_ads[0].settings).confirm === pr.json.confirm, '5.22b the stored post does not change the settings\' echo (a duplicate validates the same)');
      const res = await call('GET', '/results');
      ok(res.json.ad.reviewing === true && res.json.ad.by_day[0].conversations === 2, '5.23 results: Meta reviewing, conversations by day');
      const list = await call('GET', '/list'); ok(list.json.ads.length === 1 && !('access_token' in list.json.ads[0]), '5.24 Your ads lists her ad');
      const id = db.T.vendor_ads[0].id;
      const bad = await call('POST', '/manage', { id, action: 'pause', values: {}, confirm: 'x' });
      ok(bad.status === 400, '5.25 a management change with a wrong echo is refused');
      const pp = await call('POST', '/manage/prepare', { id, action: 'pause' }); const b0 = m.calls.length;
      const pz = await call('POST', '/manage', { id, action: 'pause', values: pp.json.values, confirm: pp.json.confirm });
      const pzCalls = m.calls.slice(b0).filter((c) => c.method === 'POST');
      ok(pz.json.ad && pz.json.ad.status === 'paused' && pzCalls.length === 3 && pzCalls.every((c) => Object.keys(c.form).join() === 'status' && c.form.status === 'PAUSED'), '5.26 pause sends only status PAUSED, three times');
      const bl = await call('POST', '/manage/prepare', { id, action: 'budget', values: { minor: 5000 } });
      const blr = await call('POST', '/manage', { id, action: 'budget', values: bl.json.values, confirm: bl.json.confirm });
      ok(blr.status === 400 && blr.json.code === 'ADS_BELOW_MIN', '5.27 a daily amount below the minimum is refused at the door');
      const bg = await call('POST', '/manage/prepare', { id, action: 'budget', values: { minor: 30000 } }); const b1 = m.calls.length;
      await call('POST', '/manage', { id, action: 'budget', values: bg.json.values, confirm: bg.json.confirm });
      const bgC = m.calls.slice(b1).filter((c) => c.method === 'POST');
      ok(bgC.length === 1 && Object.keys(bgC[0].form).join() === 'daily_budget' && bgC[0].form.daily_budget === '30000' && db.T.vendor_ads[0].settings.budget.minor === 30000, '5.28 an amount change sends only daily_budget, and the stored settings follow');
      const endAt = new Date(Date.now() + 5 * 864e5).toISOString();
      const ed = await call('POST', '/manage/prepare', { id, action: 'end_date', values: { end: endAt } }); const b2 = m.calls.length;
      await call('POST', '/manage', { id, action: 'end_date', values: ed.json.values, confirm: ed.json.confirm });
      const edC = m.calls.slice(b2).filter((c) => c.method === 'POST');
      ok(edC.length === 1 && Object.keys(edC[0].form).join() === 'end_time', '5.29 an end change sends only end_time');
      const du = await call('POST', '/manage/prepare', { id, action: 'duplicate' }); const b3 = m.calls.length;
      const dr = await call('POST', '/manage', { id, action: 'duplicate', values: du.json.values, confirm: du.json.confirm });
      ok(dr.json.draft && dr.json.draft.media_id && m.calls.slice(b3).filter((c) => c.method === 'POST').length === 0, '5.30 duplicate returns a draft and touches no Meta object');
      const other = await call('POST', '/manage/prepare', { id, action: 'pause' }, VENDOR_B);
      ok(other.status === 403 || other.status === 404, '5.31 another vendor cannot reach her ad');
    });
  }
  {
    const db = fakeDb(); const m = fakeMeta({ refuseAt: 'adcreatives' }); adsRouter._setFetch(m.f); armed(db); connected(db);
    await withServer(db, async (call) => {
      const pr = await call('POST', '/prepare', { settings: goodSettings() });
      const run = await call('POST', '/run', { settings: pr.json.settings, confirm: pr.json.confirm });
      ok(run.json.ad.status === 'refused' && run.json.ad.step === 'creative' && db.T.vendor_ads[0].refused_reason === 'creative 100', '5.32 a Meta refusal is recorded with its step and code', JSON.stringify(db.T.vendor_ads[0]));
      ok(!m.calls.some((c) => c.method === 'POST' && c.form && c.form.status === 'ACTIVE'), '5.33 nothing was set ACTIVE after the refusal');
    });
  }
  {
    const db = fakeDb(); const m = fakeMeta({ dead: true }); adsRouter._setFetch(m.f); armed(db); connected(db);
    await withServer(db, async (call) => {
      const r = await call('GET', '/'); ok(r.json.gaps && r.json.gaps.gap === 'expired', '5.34 Meta\'s 190 reads as expired, never a raw error');
    });
  }

  sec('6  cut1e: portfolio Pages, the chooser, the Page token, Page posts, not-hers, five figures, the fallback');
  {
    const db = fakeDb(); const m = fakeMeta({ portfolioOnly: true }); adsRouter._setFetch(m.f); armed(db); connected(db);
    await withServer(db, async (call) => {
      const r = await call('GET', '/');
      ok(r.json.gaps && r.json.gaps.gap === null && r.json.gaps.page.id === 'PAGE1', '6.1 a Page reached only through a portfolio is found (me/accounts empty, me/businesses owned_pages)', JSON.stringify(r.json.gaps));
    });
  }
  {
    const db = fakeDb(); const m = fakeMeta({ twoAccounts: true }); adsRouter._setFetch(m.f); armed(db); connected(db);
    await withServer(db, async (call) => {
      const r = await call('GET', '/');
      ok(r.json.gaps.gap === 'choose' && r.json.gaps.choose.accounts.length === 2 && !r.json.gaps.choose.pages, '6.2 two active ad accounts: she chooses; nothing is picked for her', JSON.stringify(r.json.gaps));
      const bad = await call('POST', '/choose', { ad_account_id: 'act_1234' });
      ok(bad.status === 400, '6.3 an id Meta does not list for her is refused');
      const c = await call('POST', '/choose', { ad_account_id: 'act_9999' });
      ok(c.json.gaps && c.json.gaps.gap === null && c.json.gaps.account.id === 'act_9999', '6.4 her tap is stored and honoured (the second account, not the first found)', JSON.stringify(c.json.gaps));
      const again = await call('GET', '/');
      ok(again.json.gaps.gap === null && again.json.gaps.account.id === 'act_9999', '6.5 her pick holds on the next read');
    });
  }
  ok(meta.gapsFrom({ scopes: meta.NEEDED_SCOPES, pageList: [{ id: 'A', name: 'a', ig: { id: '1' } }, { id: 'B', name: 'b', ig: { id: '2' } }], accounts: [{ id: 'act_1', status: 1 }] }).gap === 'choose',
    '6.6 two linked Pages and no pick: choose (pure)');
  {
    const db = fakeDb(); const m = fakeMeta(); adsRouter._setFetch(m.f); armed(db); connected(db);
    await withServer(db, async (call) => {
      const posts = await call('GET', '/posts');
      const fbp = (posts.json.posts || []).find((x) => x.source === 'facebook');
      ok(fbp && fbp.id === '1008033895736362_555', '6.7 her Facebook Page posts are listed beside her Instagram posts (G4)', JSON.stringify(posts.json.posts));
      const set = (mediaId) => { const g = goodSettings(); g.media_id = mediaId; return g; };
      const b0 = m.calls.length;
      const pr = await call('POST', '/prepare', { settings: set('17890000000000001') });
      await call('POST', '/run', { settings: pr.json.settings, confirm: pr.json.confirm });
      const creates = m.calls.slice(b0).filter((c) => c.method === 'POST' && /^act_4417\//.test(c.p));
      ok(creates.length === 4 && creates.every((c) => c.auth === 'Bearer PAGE-TOKEN'), '6.8 the four objects are created with the Page token, never her user token', JSON.stringify(creates.map((c) => c.auth)));
      const b1 = m.calls.length;
      const pr2 = await call('POST', '/prepare', { settings: set('1008033895736362_555') });
      await call('POST', '/run', { settings: pr2.json.settings, confirm: pr2.json.confirm });
      const c2 = m.calls.slice(b1).filter((c) => c.method === 'POST' && /^act_4417\//.test(c.p));
      ok(c2.length === 4 && c2[1].form.destination_type === 'MESSENGER' && c2[2].form.object_story_id === '1008033895736362_555' && /MESSAGE_PAGE/.test(c2[2].form.call_to_action),
        '6.9 a Facebook Page post boosts to Messenger with object_story_id (G4 as read)', JSON.stringify(c2.map((c) => c.form)).slice(0, 200));
      const b2 = m.calls.length;
      const pr3 = await call('POST', '/prepare', { settings: set('17899999999999999') });
      const r3 = await call('POST', '/run', { settings: pr3.json.settings, confirm: pr3.json.confirm });
      ok(r3.status === 400 && r3.json.code === 'ADS_NOT_HER_POST' && m.calls.slice(b2).filter((c) => c.method === 'POST').length === 0,
        '6.10 a post that is not hers on Meta (an example) never reaches a create call (R-46.16)');
      const res = await call('GET', '/results');
      const d = res.json.ad && res.json.ad.by_day && res.json.ad.by_day[0];
      ok(d && d.impressions === 1802 && d.clicks === 61 && d.reach === 1240 && d.conversations === 2 && d.spend === 210.5, '6.11 the five figures: impressions, reach, clicks, results, spend (G3)', JSON.stringify(d));
    });
  }
  {
    const db = fakeDb(); const m = fakeMeta(); adsRouter._setFetch(m.f); armed(db); connected(db);
    await withServer(db, async (call) => {
      const posts = await call('GET', '/posts');
      const reel = (posts.json.posts || []).find((x) => x.id === '17890000000000003');
      ok(reel && reel.url === 'https://x/reel-cover.jpg', '6.14 cut1f: a reel is drawn from its cover picture (thumbnail_url), never its video file', JSON.stringify(reel));
    });
  }
  {
    const db = fakeDb(); const m = fakeMeta({ noInsights: true }); adsRouter._setFetch(m.f); armed(db); connected(db);
    await withServer(db, async (call) => {
      const st = await call('GET', '/start');
      ok(st.json.suggestion && st.json.suggestion.basis === 'likes' && st.json.suggestion.id === '17890000000000001', '6.12 insights refused: the likes line (the most liked)', JSON.stringify(st.json.suggestion));
    });
  }
  {
    const db = fakeDb(); const m = fakeMeta({ noInsights: true, noLikes: true }); adsRouter._setFetch(m.f); armed(db); connected(db);
    await withServer(db, async (call) => {
      const st = await call('GET', '/start');
      ok(st.json.suggestion && st.json.suggestion.basis === 'newest' && st.json.suggestion.id === '17890000000000002', '6.13 insights and likes refused: the newest post', JSON.stringify(st.json.suggestion));
    });
  }

  if (!process.env.B144_CHILD) {
    sec('6  mutations of production code (each must redden a child run; restored by sha)');
    const MUTS = [
      ['src/lib/ads/meta.js', "objective: 'OUTCOME_ENGAGEMENT', status: 'PAUSED'", "objective: 'OUTCOME_ENGAGEMENT', status: 'ACTIVE'", 'M1 the campaign created ACTIVE'],
      ['src/api/vendor/ads.js', "if (!v.ok || body.confirm !== v.confirm) return", "if (!v.ok) return", 'M2 /run without the echo check'],
      ['src/api/vendor/ads.js', "if (b.action === 'budget' && vv.kind === 'daily') {", "if (false) {", 'M3 management without the minimum check'],
      ['src/lib/ads/connection.js', ".eq('vendor_id', vendorId).eq('pending_state_nonce', nonce)", ".eq('vendor_id', vendorId)", 'M4 the nonce spent without matching it'],
      ['src/lib/ads/door.js', "if (s === 'armed' && walk && vendorId === walk)", "if (s === 'armed')", 'M5 armed opens for every vendor'],
      ['src/lib/ads/connection.js', "const SAFE_COLUMNS = 'vendor_id, ", "const SAFE_COLUMNS = 'access_token, vendor_id, ", 'M6 the token in SAFE_COLUMNS'],
      ['src/lib/ads/targeting.js', "const effKind = kind === 'daily' && hours <= 24 ? 'lifetime' : kind;", "const effKind = kind;", 'M7 one day keeps a daily amount'],
      ['src/api/vendor/ads.js', "  const row = await ads.draft(r.supabase, req.vendor.id, { adAccountId: r.gaps.account.id, settings: { ...v.settings, post },", "  const row0 = await ads.draft(r.supabase, req.vendor.id, { adAccountId: r.gaps.account.id, settings: { ...v.settings, post },", 'M8 the row written after Meta (renamed away)'],
      ['src/lib/ads/meta.js', "for (const edge of ['owned_pages', 'client_pages']) {", "for (const edge of []) {", 'M9 portfolio Pages not read (the walk\'s false "no Page")'],
      ['src/lib/ads/meta.js', "let account = active.length === 1 ? active[0] : active.find((a) => a.id === pick.ad_account_id);", "let account = active[0];", 'M10 the first ad account found, not hers'],
      ['src/api/vendor/ads.js', "const ids = await meta.createPaused({ token: pt,", "const ids = await meta.createPaused({ token: r.token,", 'M11 the objects made with her user token, not the Page token'],
      ['src/api/vendor/ads.js', "if (!source) return errRes(res, 400, 'Choose one of your own posts.', 'ADS_NOT_HER_POST');", "if (!source) source = 'instagram';", 'M12 a post that is not hers reaches a create call'],
      ['src/lib/ads/meta.js', "(m.media_type === 'VIDEO' || m.media_type === 'REELS') ? (m.thumbnail_url || m.media_url || null) : (m.media_url || m.thumbnail_url || null)", "(m.media_url || m.thumbnail_url || null)", 'M13 a reel drawn from its video file'],
    ];
    for (const [rel, from, to, name] of MUTS) {
      const file = path.join(ROOT, rel); const orig = fs.readFileSync(file, 'utf8'); const h = sha(orig);
      if (orig.split(from).length !== 2) { ok(false, `${name}: anchor found exactly once`, rel); continue; }
      let mutated = orig.replace(from, to);
      if (name.startsWith('M8')) mutated = mutated.replace('if (!row.ok) return errRes(res, 500, row.error);', 'const row = { ok: true, id: "none" };');
      fs.writeFileSync(file, mutated);
      let red = false;
      try { const r = spawnSync(process.execPath, [__filename], { env: { ...process.env, B144_CHILD: '1', B144_QUIET: '1' }, encoding: 'utf8', timeout: 120000 }); red = r.status !== 0; }
      finally { fs.writeFileSync(file, orig); }
      ok(red && sha(fs.readFileSync(file, 'utf8')) === h, `${name}: reddens, restored by sha`);
    }
  }

  console.log(`\nb144 · ${pass} pass · ${fail} fail`);
  if (fail) { console.log('FAILED: ' + failed.join(' | ')); process.exit(1); }
  process.exit(0);
})().catch((e) => { console.error('b144 crashed:', e); process.exit(2); });
