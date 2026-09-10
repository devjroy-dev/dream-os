#!/usr/bin/env node
'use strict';
// scripts/b77_sunday_brief_bench.js — G4.1 · THE SUNDAY BRIEF (CE-42 4b-3b), seat R6.
//
// NUMBERED b77, DERIVED ACROSS BOTH REPOS (b69's rule): dream-os holds b75 (4b-2);
// dreamos-pwa holds TWO b76 files at a9b5e0cd (R6's Sunday shell AND R7's exchange
// shell — F-42.179, the rung was taken twice). First rung free on both trees: 77.
//
// Every cell drives PRODUCTION source: src/lib/vendor/sundayBrief.js, igOAuth.js's
// insights readers, igConnection.tokenForCall, capabilitiesSweep.probeInsights, the
// Sunday doors, postCards.briefCardUrl, cron.js, 0165. The supabase double answers
// the PostgREST chains those files build and RECORDS EVERY WRITE; `global.fetch`
// is a spy that answers Meta's documented shapes and RECORDS EVERY URL — which is
// how "cap off → no network" and "graph.instagram.com, never graph.facebook.com"
// are asserted rather than argued. No token string in any recorded reason is a
// cell, not a comment. Both ways: each cell's red is proven by mutating production
// source (manifest in the handover).

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let PASS = 0; const FAILS = [];
async function cell(name, fn) {
  try { await fn(); PASS++; console.log(`  GREEN  ${name}`); }
  catch (e) { FAILS.push(name); console.log(`  RED    ${name}\n         ${e && e.message}`); }
}
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
const src = (rel) => strip(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

// ── the double ─────────────────────────────────────────────────────────────────
function makeDb(tables, opts = {}) {
  const db = JSON.parse(JSON.stringify(tables));
  db.__writes = []; db.__reads = 0;
  let seq = 0;
  function q(name) {
    if (opts.forbid) throw new Error(`the door touched the database (${name}) before the plane`);
    db.__reads += 1;
    let op = 'select'; let payload = null; const filters = []; let orderBy = null; let lim = null; let single = false; let conflict = null;
    const apply = () => {
      let r = (db[name] || []).slice();
      for (const f of filters) r = r.filter(f);
      if (orderBy) r.sort((a, b) => (String(a[orderBy.col]) < String(b[orderBy.col]) ? 1 : -1) * (orderBy.asc ? -1 : 1));
      if (lim != null) r = r.slice(0, lim);
      return r;
    };
    const api = {
      select() { return api; },
      eq(c, v) { filters.push((r) => r[c] === v); return api; },
      not(c, _op, v) { filters.push((r) => (v === null ? r[c] != null : r[c] !== v)); return api; },
      order(c, o) { orderBy = { col: c, asc: !o || o.ascending !== false }; return api; },
      limit(n) { lim = n; return api; },
      update(p) { op = 'update'; payload = p; return api; },
      upsert(p, o) { op = 'upsert'; payload = p; conflict = (o && o.onConflict) || null; return api; },
      delete() { op = 'delete'; return api; },
      maybeSingle() { single = true; return api; },
      single() { single = true; return api; },
      then(resolve) {
        if (op === 'upsert') {
          const keys = String(conflict || '').split(',').map((s) => s.trim()).filter(Boolean);
          const rows = (db[name] = db[name] || []);
          const hit = keys.length ? rows.find((r) => keys.every((k) => r[k] === payload[k])) : null;
          if (hit) Object.assign(hit, payload); else rows.push(Object.assign({ id: `${name}-${++seq}` }, payload));
          db.__writes.push({ table: name, op: hit ? 'upsert:update' : 'upsert:insert', row: payload, conflict });
          return resolve({ data: null, error: null });
        }
        if (op === 'update') { const hit = apply(); for (const r of hit) Object.assign(r, payload); db.__writes.push({ table: name, op, patch: payload, n: hit.length }); return resolve({ data: hit, error: null }); }
        if (op === 'delete') { const hit = apply(); db[name] = (db[name] || []).filter((r) => !hit.includes(r)); db.__writes.push({ table: name, op, n: hit.length }); return resolve({ data: null, error: null }); }
        const r = apply();
        return resolve({ data: single ? (r[0] || null) : r, error: null });
      },
    };
    return api;
  }
  return Object.assign(db, { from: q });
}

// ── the wire ───────────────────────────────────────────────────────────────────
// NOW: Thursday 2026-09-10 12:00 IST → the week 7–13 September (the fixture's week).
const NOW = Date.parse('2026-09-10T06:30:00Z');
const V = { id: 'v-dev440', routing_handle: 'DEV440', business_name: 'Dev Roy Photography', category: 'photography' };
const TOKEN = 'IGQVJ-SECRET-TOKEN-NEVER-ON-A-ROW';
const FUTURE = '2026-11-01T00:00:00Z';
const conn = (over = {}) => Object.assign({ vendor_id: V.id, ig_user_id: '17841400000000001', ig_username: 'devroy', access_token: TOKEN, token_expires_at: FUTURE, connected_at: '2026-09-01T00:00:00Z', last_refreshed_at: null, insights_granted_at: '2026-09-09T10:00:00Z' }, over);

function wire(spec = {}) {
  const calls = [];
  const media = spec.media || [
    { id: 'm-old', media_type: 'IMAGE', media_url: 'https://cdn/old.jpg', timestamp: '2026-08-30T10:00:00+0000', permalink: 'https://instagram.com/p/old' },
    { id: 'm-1',   media_type: 'IMAGE', media_url: 'https://cdn/1.jpg',   timestamp: '2026-09-08T10:00:00+0000', permalink: 'https://instagram.com/p/one' },
    { id: 'm-2',   media_type: 'VIDEO', thumbnail_url: 'https://cdn/2.jpg', timestamp: '2026-09-09T10:00:00+0000', permalink: 'https://instagram.com/p/two' },
  ];
  const mediaIns = spec.mediaInsights || { 'm-1': { saved: 5, shares: 2 }, 'm-2': { saved: 31, shares: 9 } };
  const acct = spec.account !== undefined ? spec.account : { reach: 4120, follows_and_unfollows: 18, saves: 64, shares: 22 };
  const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
  global.fetch = async (url) => {
    calls.push(String(url));
    const u = new URL(String(url));
    if (spec.down) return json(503, { error: { code: 2, message: 'down' } });
    if (u.pathname === '/me/media') return json(200, { data: media });
    if (u.pathname === '/me') return json(200, { id: '1', followers_count: spec.followers === undefined ? 640 : spec.followers });
    if (/\/insights$/.test(u.pathname)) {
      const id = u.pathname.split('/')[1];
      if (id === '17841400000000001') {
        if (spec.noScope) return json(403, { error: { code: 10, message: '(#10) permission' } });
        const data = Object.keys(acct).filter((k) => acct[k] != null).map((name) => ({ name, period: 'day', total_value: { value: acct[name] } }));
        return json(200, { data });
      }
      const mi = mediaIns[id];
      if (!mi) return json(400, { error: { code: 100, message: 'no such media' } });
      return json(200, { data: [{ name: 'saved', period: 'lifetime', values: [{ value: mi.saved }] }, { name: 'shares', period: 'lifetime', values: [{ value: mi.shares }] }] });
    }
    return json(404, { error: { code: 803, message: 'unknown' } });
  };
  return calls;
}

(async () => {
  const igOAuth = require(path.join(ROOT, 'src/lib/vendor/igOAuth.js'));
  const igConn  = require(path.join(ROOT, 'src/lib/vendor/igConnection.js'));
  const igImport = require(path.join(ROOT, 'src/lib/vendor/igImport.js'));
  const cap     = require(path.join(ROOT, 'src/lib/capabilities.js'));
  const sunday  = require(path.join(ROOT, 'src/lib/vendor/sundayBrief.js'));
  const sweep   = require(path.join(ROOT, 'src/capabilitiesSweep.js'));
  const postCards = require(path.join(ROOT, 'src/lib/vendor/postCards.js'));
  const PERM = cap.CAPABILITY_KEYS.PERM_INSIGHTS;
  const capOn  = { on: (k) => k === PERM, reason: () => null };
  const capOff = { on: () => false, reason: (k) => `${k} is pending on the switchboard` };
  const lastWeekRow = { id: 'b-0', vendor_id: V.id, week_start: '2026-08-31', week_end: '2026-09-06', status: 'live', generated_at: '2026-09-06T01:30:00Z',
    payload: { week_start: '2026-08-31', week_end: '2026-09-06', reach: { value: 3680, prev: null }, new_followers: { value: 12, prev: null }, saves: { value: 50, prev: null }, shares: { value: 20, prev: null }, best_post: null, best_time: null, follower_count: 622, media_count: 2 } };

  console.log('§1 · THE CALLS — one home, cited names (F-42.174 moved now; F-42.164 cured)');
  await cell('1.1 /me/media is built in igOAuth.js and nowhere else; igImport.js reads it back by name (same function object)', async () => {
    const o = src('src/lib/vendor/igOAuth.js'), i = src('src/lib/vendor/igImport.js');
    assert.ok(/\/me\/media\?/.test(o), 'igOAuth does not build /me/media');
    assert.ok(!/\/me\/media/.test(i), 'igImport still spells /me/media');
    assert.ok(!/access_token:/.test(i), 'igImport still puts a token on a query');
    assert.strictEqual(igImport.listInstagramMedia, igOAuth.listInstagramMedia);
  });
  await cell('1.2 the account read: graph.instagram.com/{ig_user_id}/insights · reach,follows_and_unfollows,saves,shares · period=day · metric_type=total_value · since/until', async () => {
    const calls = wire();
    const r = await igOAuth.fetchAccountInsights(TOKEN, '17841400000000001', { since: 1000, until: 2000 });
    assert.ok(r.ok, r.error);
    const u = new URL(calls[0]);
    assert.strictEqual(u.host, 'graph.instagram.com');
    assert.strictEqual(u.pathname, '/17841400000000001/insights');
    assert.strictEqual(u.searchParams.get('metric'), 'reach,follows_and_unfollows,saves,shares');
    assert.strictEqual(u.searchParams.get('period'), 'day');
    assert.strictEqual(u.searchParams.get('metric_type'), 'total_value');
    assert.deepStrictEqual([u.searchParams.get('since'), u.searchParams.get('until')], ['1000', '2000']);
    assert.deepStrictEqual(r.metrics, { reach: 4120, follows_and_unfollows: 18, saves: 64, shares: 22 });
  });
  await cell('1.3 the media read asks `saved,shares` on the wire and answers `saves` (the stored name)', async () => {
    const calls = wire();
    const r = await igOAuth.fetchMediaInsights(TOKEN, 'm-2');
    assert.strictEqual(new URL(calls[0]).searchParams.get('metric'), 'saved,shares');
    assert.deepStrictEqual([r.ok, r.saves, r.shares], [true, 31, 9]);
  });
  await cell('1.4 an ABSENT metric is null, never 0 — Meta\'s empty data set (the under-100 code)', async () => {
    wire({ account: { reach: 40, follows_and_unfollows: null, saves: 1, shares: 0 } });
    const r = await igOAuth.fetchAccountInsights(TOKEN, '17841400000000001', {});
    assert.strictEqual(r.metrics.follows_and_unfollows, null);
    assert.strictEqual(r.metrics.shares, 0);
  });
  await cell('1.5 a refusal carries the status and Meta\'s code and NEVER the token', async () => {
    wire({ noScope: true });
    const r = await igOAuth.fetchAccountInsights(TOKEN, '17841400000000001', {});
    assert.strictEqual(r.ok, false);
    assert.ok(/403, 10/.test(r.error), r.error);
    assert.ok(!r.error.includes(TOKEN));
  });
  await cell('1.6 probeInsightsScope: 200 → granted, a 4xx permission refusal → not granted, a 5xx → ok:false (says nothing about the scope)', async () => {
    wire(); assert.deepStrictEqual((await igOAuth.probeInsightsScope(TOKEN, '17841400000000001')).granted, true);
    wire({ noScope: true }); assert.deepStrictEqual((await igOAuth.probeInsightsScope(TOKEN, '17841400000000001')).granted, false);
    wire({ down: true }); assert.strictEqual((await igOAuth.probeInsightsScope(TOKEN, '17841400000000001')).ok, false);
  });
  await cell('1.7 followers_count is a User field on /me (the chair\'s witness-at-the-cut); absent → null, never a gate', async () => {
    const calls = wire({ followers: undefined });
    let r = await igOAuth.fetchFollowersCount(TOKEN);
    assert.strictEqual(new URL(calls[0]).searchParams.get('fields'), 'followers_count');
    assert.strictEqual(r.followers_count, 640);
    wire({ followers: null }); r = await igOAuth.fetchFollowersCount(TOKEN);
    assert.deepStrictEqual([r.ok, r.followers_count], [true, null]);
  });

  console.log('§2 · THE FLAVOUR (ruling 13(b)) — IG_SCOPE stays one scope');
  await cell('2.1 a state minted `insights` verifies as insights; a plain mint verifies as basic; both sign', async () => {
    const a = igOAuth.mintState(V.id, { flavour: 'insights' }), b = igOAuth.mintState(V.id);
    assert.strictEqual(igOAuth.verifyState(a.state).flavour, 'insights');
    assert.strictEqual(igOAuth.verifyState(b.state).flavour, 'basic');
    assert.strictEqual(igOAuth.verifyState(a.state).vendorId, V.id);
  });
  await cell('2.2 the insights authorize asks basic + manage_insights; the portfolio\'s asks exactly IG_SCOPE', async () => {
    const ins = new URL(igOAuth.authorizeUrl('S', { flavour: 'insights' })).searchParams.get('scope');
    const bas = new URL(igOAuth.authorizeUrl('S')).searchParams.get('scope');
    assert.strictEqual(ins, 'instagram_business_basic,instagram_business_manage_insights');
    assert.strictEqual(bas, 'instagram_business_basic');
    assert.strictEqual(igOAuth.IG_SCOPE, 'instagram_business_basic');
  });
  await cell('2.3 ig.js: ?scope=insights mints the flavour; the callback PROVES the grant before markInsightsGranted and returns the insights flavour to pwaPaths posts', async () => {
    const r = src('src/api/vendor/ig.js');
    assert.ok(/req\.query\.scope/.test(r) && /mintState\(req\.vendor\.id, \{ flavour \}\)/.test(r));
    const cb = r.slice(r.indexOf("router.get('/callback'"), r.indexOf("router.get('/media'"));
    assert.ok(cb.indexOf('probeInsightsScope') > 0 && cb.indexOf('probeInsightsScope') < cb.indexOf('markInsightsGranted'), 'the grant is stored unproven');
    assert.ok(/vendorPath\('posts'\)/.test(r), 'no posts return path');
    assert.strictEqual(require(path.join(ROOT, 'src/lib/pwaPaths.js')).vendorPath('posts'), '/vendor/posts');
    assert.ok(!/async function tokenForCall/.test(r) && /igConn\.tokenForCall/.test(r), 'F-42.177: tokenForCall still in the router');
  });

  console.log('§3 · THE KEY (ruling 14(b)) and S1 — cap off → pending, no row, no network');
  await cell('3.1 PERM_INSIGHTS is on the roster with the seeded key; no other perm.* constant joined', async () => {
    assert.strictEqual(PERM, 'perm.instagram_business_manage_insights');
    assert.strictEqual(Object.values(cap.CAPABILITY_KEYS).filter((k) => k.startsWith('perm.')).length, 1);
  });
  await cell('3.2 S1: with the plane off the door answers `pending` — the double THROWS on any table read and the fetch spy counts zero', async () => {
    const calls = wire();
    const out = await sunday.readForDoor(makeDb({}, { forbid: true }), V, {}, { cap: capOff, now: NOW });
    assert.deepStrictEqual(out, { state: 'pending', brief: null, share_card_url: null });
    assert.strictEqual(calls.length, 0);
  });

  console.log('§4 · THE DOOR\'S CODES — one per state the shell draws');
  const door = (tables, opts = {}, deps = {}) => sunday.readForDoor(makeDb(tables), V, opts, Object.assign({ cap: capOn, now: NOW }, deps));
  await cell('4.1 S11 notconnected: no finished connect', async () => {
    assert.strictEqual((await door({ vendor_ig_connections: [], instagram_briefs: [] })).state, 'notconnected');
    assert.strictEqual((await door({ vendor_ig_connections: [conn({ ig_user_id: null, token_expires_at: null })], instagram_briefs: [] })).state, 'notconnected');
  });
  await cell('4.2 S2 connect: a live row whose insights_granted_at is null (she connected for photos)', async () => {
    const calls = wire();
    assert.strictEqual((await door({ vendor_ig_connections: [conn({ insights_granted_at: null })], instagram_briefs: [] })).state, 'connect');
    assert.strictEqual(calls.length, 0, 'the door read Meta to say connect');
  });
  await cell('4.3 S10 expired: refreshDecision says expired', async () => {
    assert.strictEqual((await door({ vendor_ig_connections: [conn({ token_expires_at: '2026-09-01T00:00:00Z' })], instagram_briefs: [] })).state, 'expired');
  });
  await cell('4.4 S8 error: the latest row is an error row; its reason does not travel', async () => {
    const out = await door({ vendor_ig_connections: [conn()], instagram_briefs: [{ vendor_id: V.id, week_start: '2026-09-07', week_end: '2026-09-13', status: 'error', reason: 'Instagram refused the account insights read (403, 10).', payload: null, generated_at: '2026-09-10T05:00:00Z' }] });
    assert.strictEqual(out.state, 'error');
    assert.ok(!JSON.stringify(out).includes('403'), 'the reason reached the glass');
  });
  await cell('4.5 S9 stale: the latest live row is last week\'s — by comparison at the door, its brief still handed over', async () => {
    const out = await door({ vendor_ig_connections: [conn()], instagram_briefs: [lastWeekRow] });
    assert.strictEqual(out.state, 'stale');
    assert.strictEqual(out.brief.week_start, '2026-08-31');
  });
  await cell('4.6 S4 empty: this week\'s row saw zero media in the window', async () => {
    const row = JSON.parse(JSON.stringify(lastWeekRow)); Object.assign(row, { week_start: '2026-09-07', week_end: '2026-09-13', generated_at: '2026-09-10T05:00:00Z' }); row.payload.media_count = 0; row.payload.week_start = '2026-09-07';
    assert.strictEqual((await door({ vendor_ig_connections: [conn()], instagram_briefs: [row] })).state, 'empty');
  });
  await cell('4.7 S5/S6/S3 live: this week\'s row, the accepted shape exactly (no media_count, no reason), the share card URL beside it', async () => {
    const row = JSON.parse(JSON.stringify(lastWeekRow)); Object.assign(row, { week_start: '2026-09-07', week_end: '2026-09-13', generated_at: '2026-09-10T05:00:00Z' }); row.payload.week_start = '2026-09-07'; row.payload.new_followers = null;
    const out = await door({ vendor_ig_connections: [conn()], instagram_briefs: [row] }, {}, { shareCard: async () => 'https://res.cloudinary.com/x/brief.jpg' });
    assert.strictEqual(out.state, 'live');
    assert.deepStrictEqual(Object.keys(out.brief).sort(), ['best_post', 'best_time', 'follower_count', 'generated_at', 'new_followers', 'reach', 'saves', 'shares', 'week_end', 'week_start']);
    assert.strictEqual(out.brief.new_followers, null, 'S3 is the null shape');
    assert.strictEqual(out.share_card_url, 'https://res.cloudinary.com/x/brief.jpg');
  });
  await cell('4.8 no fixture reaches the door: the arm and the doors carry no illustrative literal', async () => {
    const s = src('src/lib/vendor/sundayBrief.js') + src('src/api/vendor/posts.js');
    assert.ok(!/4120|'sample'|FIXTURE/.test(s));
  });

  console.log('§5 · GENERATION — week window (b), the row, prev, best post, the error row, the upsert');
  await cell('5.1 the week: Thu 10 Sep IST → 7–13 September; since = Mon 00:00 IST, until = Sat 23:59:59 IST', async () => {
    const w = sunday.weekFor(NOW);
    assert.deepStrictEqual([w.week_start, w.week_end], ['2026-09-07', '2026-09-13']);
    assert.strictEqual(w.since, Math.floor(Date.parse('2026-09-06T18:30:00Z') / 1000));
    assert.strictEqual(w.until, Math.floor(Date.parse('2026-09-12T18:29:59Z') / 1000));
    assert.strictEqual(sunday.weekFor(Date.parse('2026-09-13T01:30:00Z')).week_start, '2026-09-07', 'Sunday 07:00 IST is still the week of the 7th');
    assert.strictEqual(sunday.weekFor(Date.parse('2026-09-13T18:31:00Z')).week_start, '2026-09-14', 'Monday 00:01 IST starts the next');
  });
  await cell('5.2 one live row: the accepted shape, prev from last week\'s row, the best post by saves+shares (m-2: 31+9) with its permalink, follower_count 640', async () => {
    const calls = wire();
    const db = makeDb({ vendor_ig_connections: [conn()], instagram_briefs: [lastWeekRow] });
    const g = await sunday.generateForVendor(db, V.id, { now: NOW });
    assert.ok(g.ok && g.row.status === 'live');
    const p = g.row.payload;
    assert.deepStrictEqual(p.reach, { value: 4120, prev: 3680 });
    assert.deepStrictEqual(p.new_followers, { value: 18, prev: 12 });
    assert.deepStrictEqual(p.best_post, { media_id: 'm-2', photo_url: 'https://cdn/2.jpg', saves: 31, shares: 9, permalink: 'https://instagram.com/p/two' });
    assert.deepStrictEqual([p.follower_count, p.media_count, p.best_time], [640, 2, null]);
    assert.ok(!calls.some((u) => /m-old\/insights/.test(u)), 'a post outside the week was read');
    const w = db.__writes.filter((x) => x.table === 'instagram_briefs');
    assert.strictEqual(w.length, 1); assert.strictEqual(w[0].conflict, 'vendor_id,week_start');
    assert.ok(!JSON.stringify(g.row).includes(TOKEN));
  });
  await cell('5.3 under 100 followers: follows_and_unfollows absent → new_followers null; a first brief has prev null everywhere', async () => {
    wire({ account: { reach: 40, follows_and_unfollows: null, saves: 1, shares: 0 } });
    const g = await sunday.generateForVendor(makeDb({ vendor_ig_connections: [conn()], instagram_briefs: [] }), V.id, { now: NOW });
    assert.strictEqual(g.row.payload.new_followers, null);
    assert.deepStrictEqual(g.row.payload.reach, { value: 40, prev: null });
  });
  await cell('5.4 a Meta refusal WRITES an error row with the status and code as its reason — never the token', async () => {
    wire({ noScope: true });
    const db = makeDb({ vendor_ig_connections: [conn()], instagram_briefs: [] });
    const g = await sunday.generateForVendor(db, V.id, { now: NOW });
    assert.ok(g.ok && g.row.status === 'error' && /403, 10/.test(g.row.reason), JSON.stringify(g.row));
    assert.ok(!g.row.reason.includes(TOKEN));
    assert.strictEqual(g.row.payload, null);
  });
  await cell('5.5 the upsert REPLACES an error row with the live one for the same week (c-42.46: plain UNIQUE)', async () => {
    wire({ noScope: true });
    const db = makeDb({ vendor_ig_connections: [conn()], instagram_briefs: [] });
    await sunday.generateForVendor(db, V.id, { now: NOW });
    wire();
    await sunday.generateForVendor(db, V.id, { now: NOW + 60000 });
    assert.strictEqual(db.instagram_briefs.length, 1);
    assert.strictEqual(db.instagram_briefs[0].status, 'live');
    assert.deepStrictEqual(db.__writes.map((x) => x.op), ['upsert:insert', 'upsert:update']);
  });
  await cell('5.6 the three connection codes from generation: no row → notconnected, expired → expired, no grant → connect (no Meta call)', async () => {
    const calls = wire();
    assert.strictEqual((await sunday.generateForVendor(makeDb({ vendor_ig_connections: [] }), V.id, { now: NOW })).code, 'notconnected');
    assert.strictEqual((await sunday.generateForVendor(makeDb({ vendor_ig_connections: [conn({ token_expires_at: '2026-09-01T00:00:00Z' })] }), V.id, { now: NOW })).code, 'expired');
    assert.strictEqual((await sunday.generateForVendor(makeDb({ vendor_ig_connections: [conn({ insights_granted_at: null })] }), V.id, { now: NOW })).code, 'connect');
    assert.strictEqual(calls.length, 0);
  });
  await cell('5.7 Check again (ruled (b)): generates now; a second within 10 minutes reads the row and calls Meta zero times; a first read with no row generates', async () => {
    let calls = wire();
    const db = makeDb({ vendor_ig_connections: [conn()], instagram_briefs: [] });
    let out = await sunday.readForDoor(db, V, {}, { cap: capOn, now: NOW });
    assert.strictEqual(out.state, 'live', 'a first read did not generate');
    assert.ok(calls.length > 0);
    calls = wire();
    out = await sunday.readForDoor(db, V, { generate: true }, { cap: capOn, now: NOW + 5 * 60000 });
    assert.deepStrictEqual([out.state, calls.length], ['live', 0]);
    calls = wire();
    out = await sunday.readForDoor(db, V, { generate: true }, { cap: capOn, now: NOW + 11 * 60000 });
    assert.ok(calls.length > 0, 'past the throttle it did not regenerate');
  });

  console.log('§6 · THE JOB — Sunday 07:00 IST, the plane first, one row per vendor-week');
  await cell('6.1 cap off → skipped: no connection listed, no Meta call', async () => {
    const calls = wire();
    const r = await sunday.runSundayJob(makeDb({}, { forbid: true }), { cap: capOff, now: NOW });
    assert.deepStrictEqual([r.skipped, calls.length], [true, 0]);
  });
  await cell('6.2 cap on → every granted connection gets its row; an ungranted one is not listed; one vendor\'s refusal does not stop the next', async () => {
    wire();
    const db = makeDb({ vendor_ig_connections: [conn(), conn({ vendor_id: 'v-2', ig_user_id: '17841400000000001' }), conn({ vendor_id: 'v-3', insights_granted_at: null })], instagram_briefs: [] });
    const r = await sunday.runSundayJob(db, { cap: capOn, now: NOW });
    assert.deepStrictEqual([r.vendors, r.written, r.errors], [2, 2, 0]);
    assert.strictEqual(db.instagram_briefs.length, 2);
  });
  await cell('6.3 cron.js schedules it at `0 7 * * 0` in Asia/Kolkata and reads runSundayJob', async () => {
    const c = src('src/cron.js');
    const i = c.indexOf("cron.schedule('0 7 * * 0'");
    assert.ok(i > 0, 'no Sunday 07:00 schedule');
    const block = c.slice(i, c.indexOf('});', i) + 3);
    assert.ok(/runSundayJob/.test(block) && /timezone: 'Asia\/Kolkata'/.test(block));
  });

  console.log('§7 · THE PROBE (ruling 15(a)+(b), F-42.175)');
  await cell('7.1 probeOne routes ONLY perm.instagram_business_manage_insights to the probe; the other seven perm.* rows keep the withheld line', async () => {
    const s = src('src/capabilitiesSweep.js');
    assert.ok(/row\.key === cap\.CAPABILITY_KEYS\.PERM_INSIGHTS\) return probeInsights\(deps\)/.test(s));
    assert.ok(/probe withheld until the IG user id \(R-41\.39\)/.test(s));
  });
  await cell('7.2 the probe reads ig_probe_vendor (0163) → DEV440\'s token → graph.instagram.com, NEVER graph.facebook.com; 200 → approved; the evidence names the handle and "app mode unread"', async () => {
    const calls = wire();
    const db = makeDb({ admin_config: [{ key: 'ig_probe_vendor', value: 'DEV440' }], vendors: [{ id: V.id, routing_handle: 'DEV440' }], vendor_ig_connections: [conn()] });
    const r = await sweep.probeInsights({ supabase: db });
    assert.deepStrictEqual([r.ok, r.status], [true, 'approved'], JSON.stringify(r));
    assert.ok(/ig_probe_vendor DEV440/.test(r.evidence) && /app mode unread/.test(r.evidence), r.evidence);
    assert.ok(calls.every((u) => new URL(u).host === 'graph.instagram.com'));
    assert.ok(!r.evidence.includes(TOKEN));
  });
  await cell('7.3 the scope absent on that token → pending; the token missing → ok:false (status never moves)', async () => {
    wire({ noScope: true });
    const db = makeDb({ admin_config: [{ key: 'ig_probe_vendor', value: 'DEV440' }], vendors: [{ id: V.id, routing_handle: 'DEV440' }], vendor_ig_connections: [conn()] });
    assert.strictEqual((await sweep.probeInsights({ supabase: db })).status, 'pending');
    const db2 = makeDb({ admin_config: [{ key: 'ig_probe_vendor', value: 'DEV440' }], vendors: [{ id: V.id, routing_handle: 'DEV440' }], vendor_ig_connections: [] });
    assert.strictEqual((await sweep.probeInsights({ supabase: db2 })).ok, false);
  });

  console.log('§8 · THE SHARE CARD (ruled (a)) — kind `brief`, the transformation string');
  await cell('8.1 status geometry, the base colorized to Graphite, FIVE text layers: title (display ink) · reach · new followers · saves+shares (metal) · the address (ink-soft)', async () => {
    const t = postCards.briefTransformation({ reach: { value: 4120 }, new_followers: { value: 18 }, saves: { value: 64 }, shares: { value: 22 } }, V);
    assert.deepStrictEqual(t[0], { width: 1080, height: 1920, crop: 'fill', gravity: 'auto' });
    assert.deepStrictEqual(t[1], { effect: 'colorize:100', color: '#0A0B0C' });
    const texts = t.filter((x) => x.overlay).map((x) => [x.overlay.text, x.color]);
    assert.strictEqual(texts.length, 5);
    assert.deepStrictEqual(texts.find((x) => x[0] === 'My week on Instagram'), ['My week on Instagram', '#EDEEEF']);
    assert.deepStrictEqual(texts.find((x) => x[0] === 'Reach 4,120'), ['Reach 4,120', '#C9A84C']);
    assert.ok(texts.some((x) => x[0] === 'Saves 64 \u00b7 Shares 22' && x[1] === '#C9A84C'));
    assert.ok(texts.some((x) => x[0] === 'thedreamwedding.in/v/DEV440'));
    assert.ok(!postCards.KIND_ORDER.includes('brief'), 'buildCards would mint a brief with no brief');
  });
  await cell('8.2 under 100 the followers line reads —; no gallery and no portfolio → null (no card, no throw)', async () => {
    const t = postCards.briefTransformation({ reach: { value: 40 }, new_followers: null, saves: { value: 1 }, shares: { value: 0 } }, V);
    assert.ok(t.some((x) => x.overlay && x.overlay.text === 'New followers \u2014'));
    const url = await postCards.briefCardUrl(makeDb({ vendor_portfolio: [] }), V, { reach: { value: 1 }, new_followers: null, saves: { value: 0 }, shares: { value: 0 } },
      { env: { CLOUDINARY_CLOUD_NAME: 'c', CLOUDINARY_API_KEY: 'k', CLOUDINARY_API_SECRET: 's' }, W: { listForOwner: async () => [], photosFor: async () => [] } });
    assert.strictEqual(url, null);
  });
  await cell('8.3 with a portfolio photo the URL is signed on the brief transformation', async () => {
    const url = await postCards.briefCardUrl(makeDb({ vendor_portfolio: [{ vendor_id: V.id, image_url: 'https://res.cloudinary.com/c/image/upload/v1/vendor_portfolio/v-dev440/a.jpg', created_at: '2026-01-01' }] }), V,
      { reach: { value: 4120 }, new_followers: { value: 18 }, saves: { value: 64 }, shares: { value: 22 } },
      { env: { CLOUDINARY_CLOUD_NAME: 'c', CLOUDINARY_API_KEY: 'k', CLOUDINARY_API_SECRET: 's' }, W: { listForOwner: async () => [], photosFor: async () => [] } });
    assert.ok(/\/s--[^/]+--\//.test(url) && /e_colorize:100/.test(url) && /My%20week%20on%20Instagram/.test(url), url);
  });

  console.log('§9 · THE DOORS, THE PLANE, 0165');
  await cell('9.1 posts.js: GET /sunday and POST /sunday/refresh, both guarded; refresh hands generate:true; every door in the file guarded', async () => {
    const s = src('src/api/vendor/posts.js');
    assert.ok(/router\.get\('\/sunday', requireAuth, resolveVendor\(\)/.test(s));
    assert.ok(/router\.post\('\/sunday\/refresh', requireAuth, resolveVendor\(\)/.test(s));
    assert.ok(/\{ generate: true \}/.test(s));
    assert.strictEqual((s.match(/router\.(get|post)\(/g) || []).length, (s.match(/requireAuth, resolveVendor\(\)/g) || []).length);
  });
  await cell('9.2 0165: instagram_briefs with UNIQUE (vendor_id, week_start) PLAIN, status live|error; vendor_ig_connections.insights_granted_at; its own paste blocks', async () => {
    const m = fs.readFileSync(path.join(ROOT, 'db/migrations/0165_instagram_briefs.sql'), 'utf8');
    assert.ok(/create table if not exists public\.instagram_briefs/.test(m));
    assert.ok(/unique \(vendor_id, week_start\)\s*\n\);/.test(m), 'the UNIQUE is not plain');
    assert.ok(/status\s+text not null check \(status in \('live', 'error'\)\)/.test(m));
    assert.ok(/alter table public\.vendor_ig_connections\s+add column if not exists insights_granted_at timestamptz;/.test(m));
    assert.ok(!fs.existsSync(path.join(ROOT, 'db/migrations')) || !fs.readdirSync(path.join(ROOT, 'db/migrations')).some((f) => /^0166/.test(f)), '0166 exists');
  });
  await cell('9.3 igConnection: tokenForCall carries igUserId + insightsGrantedAt; listInsightsConnections lists only granted, finished connects; SAFE_COLUMNS carries the grant, never the token', async () => {
    assert.ok(igConn.SAFE_COLUMNS.includes('insights_granted_at') && !igConn.SAFE_COLUMNS.includes('access_token'));
    const db = makeDb({ vendor_ig_connections: [conn(), conn({ vendor_id: 'v-3', insights_granted_at: null }), conn({ vendor_id: 'v-4', ig_user_id: null })] });
    const l = await igConn.listInsightsConnections(db);
    assert.deepStrictEqual(l.connections.map((c) => c.vendor_id), [V.id]);
    const t = await igConn.tokenForCall(db, V.id);
    assert.deepStrictEqual([t.ok, t.igUserId, Boolean(t.insightsGrantedAt)], [true, '17841400000000001', true]);
  });

  console.log(`\nb77 · ${PASS} GREEN · ${FAILS.length} RED${FAILS.length ? ' — ' + FAILS.join(' | ') : ''}`);
  process.exit(FAILS.length === 0 ? 0 : 1);
})().catch((e) => { console.log('ERROR ' + (e && e.stack)); process.exit(1); });
