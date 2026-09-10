// scripts/b4c1_shoot_board_bench.js
// CE-42 · SEAT R7 · 4c-1 — G5.2 THE SHOOT BOARD (dream-os half), F-42.184/.187/.181, F-42.192.
//
// Drives the REAL collab router over a supabase double (the b0453 harness,
// copied, not required: b0453 runs on require). Every cell names the production
// mutation that turns it RED; the handover records each one run both ways.
//
// Exit: 0 green · 1 RED · 3 REFUSED (the sibling dreamos-pwa is absent, so the
// twin cell cannot read the other half — R-38.20b's "names what lies").
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const ROOT = path.resolve(__dirname, '..');
const PWA = path.resolve(ROOT, '..', 'dreamos-pwa');

let pass = 0, fail = 0;
const ok = (label, cond, why) => {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else      { fail++; console.log(`  FAIL  ${label}${why ? ' — ' + why : ''}`); }
};
const section = (t) => console.log(`\n── ${t} ──`);
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(l => l.replace(/(^|[^:'"`])\/\/.*$/, '$1')).join('\n');

// ── the supabase double (b0453's, trimmed to what these doors touch) ────────
function makeDb(seed = {}) {
  const tables = { vendors: [], collab_posts: [], collab_responses: [], collab_post_items: [], vendor_roster: [], admin_config: [], ...seed };
  let uid = 0;
  const nextId = (p) => `${p}-${++uid}`;
  function from(table) {
    const rows = tables[table] || (tables[table] = []);
    const q = { _f: [], _order: null };
    const matched = () => {
      let out = rows.filter(r => q._f.every(f => f(r)));
      if (q._order) { const { col, asc } = q._order; out = out.slice().sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1)); }
      return out;
    };
    q.select = () => q;
    q.eq  = (c, v) => { q._f.push(r => r[c] === v); return q; };
    q.neq = (c, v) => { q._f.push(r => r[c] !== v); return q; };
    q.gt  = (c, v) => { q._f.push(r => r[c] > v); return q; };
    q.lt  = (c, v) => { q._f.push(r => r[c] < v); return q; };
    q.in  = (c, vs) => { q._f.push(r => vs.includes(r[c])); return q; };
    q.not = (c, op, v) => { if (op === 'is' && v === null) q._f.push(r => (r[c] ?? null) !== null); else q._f.push(r => r[c] !== v); return q; };
    q.order = (col, o) => { q._order = { col, asc: !!(o && o.ascending) }; return q; };
    q.limit = (n) => { q._limit = n; return q; };
    const settle = (many) => { const r = matched(); return { data: many ? (q._limit ? r.slice(0, q._limit) : r) : (r[0] || null), error: null }; };
    q.maybeSingle = async () => settle(false);
    q.single = async () => settle(false);
    q.then = (res, rej) => Promise.resolve(settle(true)).then(res, rej);
    q.insert = (payload) => {
      const list = Array.isArray(payload) ? payload : [payload];
      const made = list.map(p => { const row = { id: nextId(table), filled_by_response_id: null, ...p }; rows.push(row); return row; });
      const res1 = { data: Array.isArray(payload) ? made : made[0], error: null };
      const done = { select: () => done, single: async () => res1, maybeSingle: async () => res1, then: (r, j) => Promise.resolve(res1).then(r, j) };
      return done;
    };
    q.update = (patch) => {
      const u = { _f: [] };
      u.eq = (c, v) => { u._f.push(r => r[c] === v); return u; };
      u.lt = (c, v) => { u._f.push(r => r[c] < v); return u; };
      u.select = () => u;
      const run = () => { const hits = rows.filter(r => u._f.every(f => f(r))); hits.forEach(r => Object.assign(r, patch)); return { data: hits.map(h => ({ id: h.id })), error: null }; };
      u.maybeSingle = async () => { const r = run(); return { data: r.data[0] || null, error: null }; };
      u.then = (r, j) => Promise.resolve(run()).then(r, j);
      return u;
    };
    q.delete = () => { const d = { eq: () => d, then: (r) => Promise.resolve({ data: null, error: null }).then(r) }; return d; };
    return q;
  }
  return { from, _tables: tables };
}

function stubMiddleware(vendorId) {
  const reqAuth = path.join(ROOT, 'src/api/middleware/requireAuth.js');
  const resVen  = path.join(ROOT, 'src/api/middleware/resolveVendor.js');
  require.cache[require.resolve(reqAuth)] = { id: reqAuth, filename: reqAuth, loaded: true, exports: (req, res, next) => next() };
  require.cache[require.resolve(resVen)]  = { id: resVen, filename: resVen, loaded: true, exports: () => (req, res, next) => { req.vendor = { id: vendorId }; next(); } };
}
async function serve(db, vendorId) {
  stubMiddleware(vendorId);
  delete require.cache[require.resolve(path.join(ROOT, 'src/api/vendor/collab.js'))];
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.locals.supabase = db;
  app.use('/collab', require(path.join(ROOT, 'src/api/vendor/collab.js')));
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const call = async (method, url, body) => {
    const r = await fetch(`http://127.0.0.1:${port}${url}`, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  return { call, close: () => new Promise(r => server.close(r)) };
}

const POSTER = 'v-poster', VIEWER = 'v-viewer', FAR = 'v-far';
const FUTURE = '2027-01-15';
const post = (id, over) => ({ id, vendor_id: POSTER, requirement_type: 'photography', event_date: FUTURE, city: 'Delhi NCR',
  open_to_other_cities: false, event_type: null, details: null, state: 'open', expires_at: '2099-01-01T00:00:00.000Z', created_at: '2026-09-10T00:00:00.000Z', ...over });
const seed = () => ({
  vendors: [
    { id: POSTER, category: 'designer',    city: 'Delhi',   open_to_travel: false },
    { id: VIEWER, category: 'photography', city: 'Delhi',   open_to_travel: false },   // DEV440's shape, fixture 1
    { id: FAR,    category: 'photography', city: 'Lucknow', open_to_travel: false },
  ],
  collab_posts: [
    post('p-collab', { event_type: 'wedding' }),
    post('p-shoot',  { event_type: 'editorial' }),
    post('p-kochi',  { city: 'Kochi' }),
  ],
});

(async () => {
  // ── §1 · THE TWIN (ruling §4(a)) ──────────────────────────────────────────
  // MUTATION → RED: in src/lib/vendor/cityMatch.js, add `'delhi ncr region': 'Delhi NCR',` to CITY_ALIASES.
  section('§1 · the city twin is byte-identical across both repos');
  const pwaFile = path.join(PWA, 'lib/vendor/cityMatch.ts');
  if (!fs.existsSync(pwaFile)) { console.log(`REFUSED — sibling dreamos-pwa absent at ${PWA}; the twin cell cannot read its other half`); process.exit(3); }
  const js = fs.readFileSync(path.join(ROOT, 'src/lib/vendor/cityMatch.js'), 'utf8');
  const ts = fs.readFileSync(pwaFile, 'utf8');
  const part = (src, re) => { const m = re.exec(src); return m ? m[1] : null; };
  const reCities = /CITIES = \[([\s\S]*?)\];/;
  const reAlias  = /CITY_ALIASES[^=]*= \{([\s\S]*?)\};/;
  const reFn     = /function matchCity\([^)]*\)[^{]*\{([\s\S]*?)\n\}\n/;
  for (const [name, re] of [['CITIES', reCities], ['CITY_ALIASES', reAlias], ['matchCity body', reFn]]) {
    const a = part(js, re), b = part(ts, re);
    ok(`${name}: dream-os twin === dreamos-pwa home`, a !== null && b !== null && a === b, a === null || b === null ? 'block not found' : 'bytes differ');
  }

  // ── §2 · THE DOOR (ruling 4(b), F-42.184) ─────────────────────────────────
  // MUTATION → RED: in src/api/vendor/collab.js /requirement-types, serve a literal ['photography','videography'] list.
  section('§2 · GET /requirement-types serves the one home');
  const { REQUIREMENT_TYPES } = require(path.join(ROOT, 'src/lib/vendor/collabItems'));
  const { SHOOT_EVENT_TYPES } = require(path.join(ROOT, 'src/lib/vendor/collabKinds'));
  {
    const s = await serve(makeDb(seed()), VIEWER);
    const r = await s.call('GET', '/collab/requirement-types');
    ok('200', r.status === 200, String(r.status));
    ok('requirement_types IS collabItems.REQUIREMENT_TYPES (the eleven)', JSON.stringify(r.body?.requirement_types) === JSON.stringify([...REQUIREMENT_TYPES]) && REQUIREMENT_TYPES.length === 11);
    ok('shoot_event_types IS collabKinds.SHOOT_EVENT_TYPES = editorial, brand_shoot', JSON.stringify(r.body?.shoot_event_types) === JSON.stringify(['editorial', 'brand_shoot']) && JSON.stringify([...SHOOT_EVENT_TYPES]) === JSON.stringify(['editorial', 'brand_shoot']));
    await s.close();
  }

  // ── §3 · ONE GLASS PER ACT (ruling 3(ii)) ─────────────────────────────────
  // MUTATION → RED: in collab.js /feed, drop `.filter(p => kindOfPost(p) === kind)` from openWindow.
  // MUTATION → RED: in collab.js /my-posts, map `(posts || [])` instead of `mine`.
  section('§3 · the kind leg — /feed and /my-posts answer one kind per call');
  {
    const s = await serve(makeDb(seed()), VIEWER);
    const f0 = await s.call('GET', '/collab/feed');
    const f1 = await s.call('GET', '/collab/feed?kind=shoot');
    const fb = await s.call('GET', '/collab/feed?kind=bogus');
    const ids = (r) => (r.body?.feed || []).map(p => p.id).sort().join(',');
    ok('the Collab room (no kind) is offered the wedding post and NOT the shoot', ids(f0) === 'p-collab', ids(f0));
    ok('?kind=shoot is offered the shoot and NOT the collab post', ids(f1) === 'p-shoot', ids(f1));
    ok('?kind=bogus is refused 400, never guessed into a room', fb.status === 400, String(fb.status));
    await s.close();
    const p = await serve(makeDb(seed()), POSTER);
    const m0 = await p.call('GET', '/collab/my-posts');
    const m1 = await p.call('GET', '/collab/my-posts?kind=shoot');
    const mids = (r) => (r.body?.posts || []).map(x => x.id).sort().join(',');
    ok('/my-posts (no kind) lists her collabs, not her shoot', mids(m0) === 'p-collab,p-kochi', mids(m0));
    ok('/my-posts?kind=shoot lists her shoot only', mids(m1) === 'p-shoot', mids(m1));
    await p.close();
  }

  // ── §4 · THE CITY LEG (F-42.187) ──────────────────────────────────────────
  // MUTATION → RED: in collab.js /feed, restore `p.city === me.city ||` for `sameCity(p.city, me.city) ||`.
  // MUTATION → RED: in cityMatch.js sameCity, drop `ma !== '' &&`.
  section('§4 · the city leg resolves both sides through the twin');
  {
    const s = await serve(makeDb(seed()), VIEWER);
    const f = await s.call('GET', '/collab/feed');
    ok("a 'Delhi' vendor with travel off is offered a 'Delhi NCR' post (fixture 1/3's shape)", (f.body?.feed || []).some(p => p.id === 'p-collab'));
    ok("…and not a 'Kochi' one", !(f.body?.feed || []).some(p => p.id === 'p-kochi'));
    await s.close();
    const far = await serve(makeDb(seed()), FAR);
    const g = await far.call('GET', '/collab/feed');
    ok("two UNPLACEABLE cities ('Lucknow' vs 'Kochi') never match — unknown is not equal to unknown", !(g.body?.feed || []).some(p => p.id === 'p-kochi'));
    await far.close();
  }

  // ── §5 · SHOOT EXPIRY AT INSERT (ruling 1(a), F-42.181) ───────────────────
  // MUTATION → RED: in collab.js POST /, drop the `...(isShootEventType(event_type) ? { expires_at: … } : {})` spread.
  section('§5 · a shoot expires at the end of its own day (IST); other kinds keep the DEFAULT');
  {
    const db = makeDb(seed());
    const s = await serve(db, POSTER);
    const a = await s.call('POST', '/collab', { items: [{ requirement_type: 'makeup' }], event_date: '2027-10-18', city: 'Delhi NCR', event_type: 'editorial' });
    const b = await s.call('POST', '/collab', { items: [{ requirement_type: 'makeup' }], event_date: '2027-10-18', city: 'Delhi NCR', event_type: 'wedding' });
    const rowOf = (r) => db._tables.collab_posts.find(x => x.id === r.body?.post?.id);
    ok('the editorial post landed', a.status === 200 && !!rowOf(a), String(a.status));
    ok('its expires_at = 2027-10-18T18:30:00.000Z (midnight IST that night)', rowOf(a)?.expires_at === '2027-10-18T18:30:00.000Z', rowOf(a)?.expires_at);
    ok('the wedding post names no expires_at (0048 DEFAULT stands)', b.status === 200 && rowOf(b) && rowOf(b).expires_at === undefined);
    await s.close();
  }

  // ── §6 · THE SWEEP (ruling 1(a)) ──────────────────────────────────────────
  // MUTATION → RED: in collabKinds.js expireCollabPosts, delete the `byDate` update.
  section('§6 · the nightly sweep closes past-dated open posts, every kind');
  {
    const { expireCollabPosts } = require(path.join(ROOT, 'src/lib/vendor/collabKinds'));
    const now = new Date('2026-09-10T21:45:00.000Z');        // 03:15 IST on 11 Sep
    const db = makeDb({ collab_posts: [
      post('x-5f04', { event_date: '2026-09-04', requirement_type: 'decor', expires_at: '2026-09-27T20:36:24.418Z' }), // fixture 3's open row
      post('x-today', { event_date: '2026-09-11' }),
      post('x-filled', { event_date: '2026-09-01', state: 'filled' }),
      post('x-window', { expires_at: '2026-09-01T00:00:00.000Z' }),
    ] });
    const out = await expireCollabPosts(db, now);
    const st = (id) => db._tables.collab_posts.find(p => p.id === id).state;
    ok('the 5f047847 shape (decor, dated 4 Sep, window open to 27 Sep) → expired by date', st('x-5f04') === 'expired' && out.byDate.includes('x-5f04'));
    ok("a post dated TODAY (IST) stays open", st('x-today') === 'open');
    ok('a filled post is never touched', st('x-filled') === 'filled');
    ok('the 0048 window rule still closes a post past expires_at', st('x-window') === 'expired' && out.byWindow.includes('x-window'));
  }

  // ── §7 · THE CRON CALLS THE HOME ──────────────────────────────────────────
  // MUTATION → RED: in src/cron.js, restore the inline `.from('collab_posts').update(...)` body.
  section('§7 · src/cron.js drives expireCollabPosts and carries no inline copy');
  {
    const src = stripComments(fs.readFileSync(path.join(ROOT, 'src/cron.js'), 'utf8'));
    ok('cron.js calls expireCollabPosts(supabase)', /expireCollabPosts\(supabase\)/.test(src));
    ok("cron.js names no .from('collab_posts') of its own", !/from\(['"]collab_posts['"]\)/.test(src));
  }

  // ── §8 · F-42.192 (ruled §3) ──────────────────────────────────────────────
  // MUTATION → RED: in src/lib/pwaPaths.js, spell yourWebsite '/vendor/storefront'.
  section('§8 · the Google return lands in Your website & SEO');
  {
    const { vendorPath } = require(path.join(ROOT, 'src/lib/pwaPaths'));
    ok("vendorPath('yourWebsite') === '/vendor/your-website'", vendorPath('yourWebsite') === '/vendor/your-website');
    const g = stripComments(fs.readFileSync(path.join(ROOT, 'src/api/vendor/solutions/google.js'), 'utf8'));
    ok("solutions/google.js RETURN_PATH reads vendorPath('yourWebsite')", /RETURN_PATH\s*=\s*require\([^)]*pwaPaths['"]\)\.vendorPath\('yourWebsite'\)/.test(g));
  }

  // ── §9 · COLUMN WITNESS (R-40.80) ─────────────────────────────────────────
  section('§9 · every collab_posts column this delivery drives exists in PUBLIC_SCHEMA.md');
  {
    const doc = fs.readFileSync(path.join(ROOT, 'docs/db/PUBLIC_SCHEMA.md'), 'utf8');
    const blk = (/## public\.collab_posts  ·  \d+ columns\n\n```\n([\s\S]*?)```/.exec(doc) || [])[1] || '';
    for (const c of ['event_type', 'event_date', 'expires_at', 'state', 'city']) ok(`collab_posts.${c}`, new RegExp(`^\\d+\\. ${c} `, 'm').test(blk));
  }

  console.log(`\n${pass} PASS · ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(2); });
