// scripts/b280_clb1_collab_v2_bench.js · CE-47 · CLB-1 · COLLAB HUB v2, THE SERVER HALF.
// What it holds: src/lib/collab/{social,testers,gate,publish}.js, the v2 fields and house shares on
// POST /api/v2/vendor/collab, /share-gate, /:post_id/shares, the admin door src/api/admin/collab.js (F-44.300's cure),
// the flag.collab_house_instagram gate in metaGates, and db/migrations/0196_collab_v2.sql.
// Rule 1 (ruling 1): pending opens for clb.testers only. Rule 2: no '@' ever reaches Meta; prospects never read by
// a publish path. In-process: a supabase double and a FAKE META (never a live call). Mutations of production code run
// each in a fresh child (B280_CHILD) and are restored by sha on every exit path.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const crypto = require('crypto'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const CHILD = !!process.env.B280_CHILD;
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { if (c) { pass += 1; if (!CHILD) console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
function sec(t) { if (!CHILD) console.log(`\n── ${t} ──`); }

// ── the supabase double (b4c1's, with update·select and the admin door's reads) ──
function makeDb(seed = {}) {
  const tables = { vendors: [], collab_posts: [], collab_post_items: [], collab_responses: [], vendor_roster: [], admin_config: [], capabilities: [], collab_shares: [], collab_prospects: [], ...seed };
  let uid = 0;
  function from(table) {
    const rows = tables[table] || (tables[table] = []);
    const q = { _f: [], _order: null };
    const matched = () => { let out = rows.filter((r) => q._f.every((f) => f(r))); if (q._order) { const { col, asc } = q._order; out = out.slice().sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1)); } return out; };
    q.select = () => q; q.eq = (c, v) => { q._f.push((r) => r[c] === v); return q; }; q.neq = (c, v) => { q._f.push((r) => r[c] !== v); return q; };
    q.gt = (c, v) => { q._f.push((r) => r[c] > v); return q; }; q.lt = (c, v) => { q._f.push((r) => r[c] < v); return q; };
    q.in = (c, vs) => { q._f.push((r) => vs.includes(r[c])); return q; };
    q.not = (c, op, v) => { if (op === 'is' && v === null) q._f.push((r) => (r[c] ?? null) !== null); else q._f.push((r) => r[c] !== v); return q; };
    q.is = (c, v) => { q._f.push((r) => (r[c] ?? null) === v); return q; };
    q.order = (col, o) => { q._order = { col, asc: !!(o && o.ascending) }; return q; }; q.limit = (n) => { q._limit = n; return q; };
    const settle = (many) => { const r = matched(); return { data: many ? (q._limit ? r.slice(0, q._limit) : r) : (r[0] || null), error: null }; };
    q.maybeSingle = async () => settle(false); q.single = async () => settle(false);
    q.then = (res, rej) => Promise.resolve(settle(true)).then(res, rej);
    q.insert = (payload) => {
      const list = Array.isArray(payload) ? payload : [payload];
      const made = list.map((p) => { const row = { id: `${table}-${++uid}`, created_at: new Date(Date.now() + uid).toISOString(), ...p }; rows.push(row); return row; });
      const res1 = { data: Array.isArray(payload) ? made : made[0], error: null };
      const done = { select: () => done, single: async () => res1, maybeSingle: async () => res1, then: (r, j) => Promise.resolve(res1).then(r, j) };
      return done;
    };
    q.update = (patch) => {
      const u = { _f: [] }; u.eq = (c, v) => { u._f.push((r) => r[c] === v); return u; }; u.lt = (c, v) => { u._f.push((r) => r[c] < v); return u; }; u.select = () => u;
      const run = () => { const hits = rows.filter((r) => u._f.every((f) => f(r))); hits.forEach((r) => Object.assign(r, patch)); return { data: hits.map((h) => ({ ...h })), error: null }; };
      u.maybeSingle = async () => { const r = run(); return { data: r.data[0] || null, error: null }; }; u.single = u.maybeSingle;
      u.then = (r, j) => Promise.resolve(run()).then(r, j); return u;
    };
    q.delete = () => { const d = { eq: () => d, then: (r) => Promise.resolve({ data: null, error: null }).then(r) }; return d; };
    return q;
  }
  return { from, _tables: tables };
}
function stubs(vendorId) {
  const put = (rel, exp) => { const p = path.join(ROOT, rel); require.cache[require.resolve(p)] = { id: p, filename: p, loaded: true, exports: exp }; };
  put('src/api/middleware/requireAuth.js', (req, res, next) => next());
  put('src/api/middleware/resolveVendor.js', () => (req, res, next) => { req.vendor = { id: vendorId }; next(); });
  put('src/api/admin/requireAdmin.js', (req, res, next) => next());
}
async function serve(db, vendorId) {
  stubs(vendorId);
  for (const f of ['src/api/vendor/collab.js', 'src/api/admin/collab.js']) delete require.cache[require.resolve(path.join(ROOT, f))];
  const cap = require(path.join(ROOT, 'src/lib/capabilities.js')); cap.bind(db); cap._resetCapabilitiesCache();
  require(path.join(ROOT, 'src/lib/collab/testers.js'))._reset();
  const express = require('express'); const app = express(); app.use(express.json()); app.locals.supabase = db;
  app.use('/collab', require(path.join(ROOT, 'src/api/vendor/collab.js')));
  app.use('/admin/collab', require(path.join(ROOT, 'src/api/admin/collab.js')));
  const server = http.createServer(app); await new Promise((r) => server.listen(0, r)); const port = server.address().port;
  const call = async (method, url, body) => { const r = await fetch(`http://127.0.0.1:${port}${url}`, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, body: await r.json().catch(() => null) }; };
  return { call, close: () => new Promise((r) => server.close(r)) };
}
const ME = 'v-dev440', OTHER = 'v-other';
const FUTURE = (() => { const d = new Date(Date.now() + 40 * 86400000); return d.toISOString().slice(0, 10); })();
const REF = 'https://res.cloudinary.com/demo/image/upload/v1/collab_refs/v-dev440/a1.jpg';
const seed = (capStatus, testers) => ({
  vendors: [{ id: ME, business_name: 'DEV440 Studio', city: 'Delhi' }, { id: OTHER, business_name: 'Other Studio', city: 'Delhi' }],   // the live column (SRV_4)
  capabilities: [{ key: 'flag.collab_house_instagram', kind: 'flag', status: capStatus }, { key: 'flag.collab_threads', kind: 'flag', status: 'pending' }],
  admin_config: testers === undefined ? [] : [{ key: 'clb.testers', value: testers }],
});
const V2 = (over) => ({ items: [{ requirement_type: 'photography' }, { requirement_type: 'makeup' }], event_date: FUTURE, city: 'Delhi', event_type: 'wedding', details: 'Soft look', pay_kind: 'credit_only', reference_urls: [REF], share_tdw: true, ...over });
const ENV = { CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: 'k', CLOUDINARY_API_SECRET: 's' };
Object.assign(process.env, ENV);

async function cells() {
  const social = require(path.join(ROOT, 'src/lib/collab/social.js'));
  sec('1  the words (Rule 2, ruling 3)');
  const p = { city: 'New Delhi', event_type: 'wedding', event_date: '2026-10-17', pay_kind: 'credit_only', details: 'Ask @riya for the look' };
  const its = [{ requirement_type: 'photography' }, { requirement_type: 'makeup' }, { requirement_type: 'hairstylist' }, { requirement_type: 'jewellery' }, { requirement_type: 'designer' }, { requirement_type: 'other', note: '@model wanted' }];
  const ig = social.hashtagsFor(p, its, 'instagram'); const th = social.hashtagsFor(p, its, 'threads');
  ok(ig.length === 5 && ig[0] === '#NewDelhiPhotographer' && ig[1] === '#NewDelhiMakeupArtist', '1.1 Instagram: five tags, craft first, in the call\u2019s order', ig.join(' '));
  ok(th.length === 1 && th[0] === '#NewDelhiPhotographer', '1.2 Threads: one topic tag, the first craft with the city', th.join(' '));
  const few = social.hashtagsFor({ city: 'Delhi', event_type: 'wedding' }, [{ requirement_type: 'makeup' }], 'instagram');
  ok(few.join(' ') === '#DelhiMakeupArtist #DelhiWedding #DelhiBridalShoot', '1.3 craft, then city, then occasion', few.join(' '));
  const cap1 = social.captionFor(p, its, 'instagram', null).caption;
  ok(!/@/.test(cap1) && /Saturday, 17 October 2026/.test(cap1) && /Credit only/.test(cap1), '1.4 the caption carries no @ even when her words do; full month; pay in words', cap1);
  ok(!/couple|bride/i.test(cap1), '1.5 no "couple" or "bride" in the caption', cap1);
  ok(social.refuse('hello @x') && social.refuse('a\n@b') && social.refuse('#Delhi only') === null, '1.6 refuse(): any @ refuses, a clean caption passes');
  ok(social.cleanReferences([REF, 'http://evil/x.jpg', 'javascript:1', REF, REF, REF, REF]).length === 4 && social.cleanReferences(['http://evil/x.jpg']).length === 0, '1.7 references: Cloudinary https only, at most four');

  sec('2  Rule 1: who sees it (ruling 1)');
  ok(social.openFor({ status: 'on' }, OTHER, []) === true, '2.1 on: every vendor');
  ok(social.openFor({ status: 'pending' }, ME, [ME]) === true && social.openFor({ status: 'pending' }, OTHER, [ME]) === false, '2.2 pending: testers only');
  ok(social.openFor({ status: 'off' }, ME, [ME]) === false && social.openFor(null, ME, [ME]) === false, '2.3 off or no row: nobody, testers included');
  const t = require(path.join(ROOT, 'src/lib/collab/testers.js'));
  ok(t.parse('["a","b"]').length === 2 && t.parse('junk').length === 0 && t.parse('{"a":1}').length === 0 && t.parse(null).length === 0, '2.4 clb.testers fails closed on junk');

  sec('2b  the house gate: a TDW readiness switch, by hand (the chair\u2019s ruling, 4 October 2026)');
  const gate = require(path.join(ROOT, 'src/lib/collab/gate.js'));
  const capL = require(path.join(ROOT, 'src/lib/capabilities.js'));
  const gdb = (status) => { const d = makeDb(seed(status, JSON.stringify([ME]))); capL.bind(d); capL._resetCapabilitiesCache(); t._reset(); return d; };
  let hg = await gate.houseGate(gdb('on'), OTHER);
  ok(hg.instagram === true, '2.5 row on by hand: the tick opens for every vendor', JSON.stringify(hg));
  hg = await gate.houseGate(gdb('pending'), OTHER);
  ok(hg.instagram === false && hg.threads === false, '2.6 pending: shut for a vendor not on clb.testers', JSON.stringify(hg));
  hg = await gate.houseGate(gdb('off'), ME);
  ok(hg.instagram === false, '2.7 Instagram row off by hand: shut for testers too', JSON.stringify(hg));

  sec('3  the vendor door');
  let db = makeDb(seed('pending', JSON.stringify([ME]))); let s = await serve(db, ME);
  let g = await s.call('GET', '/collab/share-gate');
  ok(g.status === 200 && g.body.house && g.body.house.instagram === true && g.body.house.threads === true, '3.1 a tester sees both of TDW\u2019s accounts while the rows are pending', JSON.stringify(g.body));
  let r = await s.call('POST', '/collab', V2({ reference_urls: [], share_tdw: true }));
  ok(r.status === 400 && /Add a picture/.test(JSON.stringify(r.body)), '3.2 ticked with no picture: the plain line, nothing posted', JSON.stringify(r.body));
  ok(db._tables.collab_posts.length === 0, '3.3 and no call was written');
  r = await s.call('POST', '/collab', V2());
  const row = db._tables.collab_posts[0] || {};
  ok(r.status === 200 && row.pay_kind === 'credit_only' && Array.isArray(row.reference_urls) && row.reference_urls[0] === REF, '3.4 the call keeps its pay and its picture', JSON.stringify(row));
  const sh = db._tables.collab_shares;
  ok(sh.length === 2 && sh.every((x) => x.account === 'house' && x.state === 'queued' && !/@/.test(x.caption) && /^https:\/\/res\.cloudinary\.com\//.test(x.image_url || '')), '3.5 two queued house shares, no @, a card picture each', JSON.stringify(sh.map((x) => [x.platform, x.state])));
  ok(JSON.stringify(sh.find((x) => x.platform === 'threads').hashtags) === '["#DelhiPhotographer"]', '3.6 the Threads share carries one tag', JSON.stringify(sh.map((x) => x.hashtags)));
  r = await s.call('GET', `/collab/${row.id}/shares`);
  ok(r.status === 200 && r.body.shares.length === 2 && r.body.pay_kind === 'credit_only' && !('caption' in r.body.shares[0]) && !('image_url' in r.body.shares[0]), '3.7 GET shares: where it is posted, without the caption', JSON.stringify(r.body).slice(0, 200));
  await s.close();
  db = makeDb(seed('pending', JSON.stringify([ME]))); s = await serve(db, OTHER);
  g = await s.call('GET', '/collab/share-gate');
  ok(g.body.house.instagram === false && g.body.house.threads === false, '3.8 a vendor not on the list sees nothing while pending', JSON.stringify(g.body));
  r = await s.call('POST', '/collab', V2());
  ok(r.status === 200 && db._tables.collab_shares.length === 0, '3.9 her call posts, and nothing is queued for TDW\u2019s accounts', db._tables.collab_shares.length);
  await s.close();
  db = makeDb(seed('pending', JSON.stringify([ME]))); s = await serve(db, ME);
  r = await s.call('POST', '/collab', { items: [{ requirement_type: 'photography' }], event_date: FUTURE, city: 'Delhi' });
  ok(r.status === 200 && !('pay_kind' in db._tables.collab_posts[0]) && !('reference_urls' in db._tables.collab_posts[0]), '3.10 a v1 body writes exactly what it wrote before', JSON.stringify(db._tables.collab_posts[0]));
  r = await s.call('POST', '/collab', V2({ pay_kind: 'barter' }));
  ok(r.status === 400, '3.11 an unknown pay_kind is refused');
  await s.close();

  sec('4  the admin door (F-44.300) and the publish');
  db = makeDb(seed('pending', JSON.stringify([ME]))); s = await serve(db, ME);
  await s.call('POST', '/collab', V2());
  let q = await s.call('GET', '/admin/collab');
  ok(q.status === 200 && q.body.queue.length === 2 && q.body.queue[0].post && q.body.queue[0].vendor_name === 'DEV440 Studio', '4.1 the queue lists both shares with the call and the studio', JSON.stringify(q.body).slice(0, 200));
  const ig1 = db._tables.collab_shares.find((x) => x.platform === 'instagram');
  ig1.caption = 'tagged @someone';
  r = await s.call('POST', `/admin/collab/shares/${ig1.id}/approve`);
  ok(r.status === 400 && ig1.state === 'queued', '4.2 a caption holding @ cannot be approved', JSON.stringify(r.body));
  const th1 = db._tables.collab_shares.find((x) => x.platform === 'threads');
  r = await s.call('POST', `/admin/collab/shares/${th1.id}/reject`);
  ok(r.status === 200 && th1.state === 'rejected' && /^admin:/.test(th1.decided_by || ''), '4.3 reject records who and stays rejected');
  r = await s.call('POST', `/admin/collab/shares/${th1.id}/approve`);
  ok(r.status === 409, '4.4 a rejected share cannot be approved afterwards');
  const admin = require(path.join(ROOT, 'src/api/admin/collab.js'));
  ig1.caption = 'Looking for: photographer\n\n#DelhiPhotographer';
  const seen = [];
  const fakeMeta = async (url, o) => { seen.push({ url, method: o && o.method }); const u = new URL(url);
    if (/\/media$/.test(u.pathname)) return { ok: true, status: 200, json: async () => ({ id: 'C1' }) };
    if (/\/C1$/.test(u.pathname)) return { ok: true, status: 200, json: async () => ({ status_code: 'FINISHED' }) };
    if (/\/media_publish$/.test(u.pathname)) return { ok: true, status: 200, json: async () => ({ id: 'M1' }) };
    if (/\/M1$/.test(u.pathname)) return { ok: true, status: 200, json: async () => ({ permalink: 'https://www.instagram.com/p/M1/' }) };
    return { ok: false, status: 404, json: async () => ({ error: { message: 'no' } }) }; };
  const env = { ...ENV, TDW_HOUSE_IG_USER_ID: '1789', TDW_HOUSE_IG_TOKEN: 'HOUSETOKEN' };
  // CLB-2a: a house token refreshed today, so the publish makes no refresh call (b282 holds the refresh itself).
  db._tables.collab_house_tokens = [{ platform: 'instagram', token: 'HOUSETOKEN', refreshed_at: new Date().toISOString() }];
  let pr = await admin.runPublish(db, { ...ig1 }, { fetch: fakeMeta, env, sleep: async () => {} });
  ok(pr.ok && ig1.state === 'published' && ig1.media_id === 'M1' && ig1.permalink === 'https://www.instagram.com/p/M1/', '4.5 a publish writes published, the media id and the link', JSON.stringify(ig1).slice(0, 200));
  ok(seen.length === 4 && seen.every((x) => x.url.startsWith('https://graph.instagram.com/') && x.url.includes('/1789/') === (/media/.test(x.url))), '4.6 four calls, all to Instagram\u2019s graph, on TDW\u2019s house id', seen.map((x) => x.url.split('?')[0]).join(' '));
  const sh2 = { ...ig1, id: ig1.id, state: 'approved', caption: 'oops @x' }; seen.length = 0;
  pr = await admin.runPublish(db, sh2, { fetch: fakeMeta, env, sleep: async () => {} });
  ok(!pr.ok && seen.length === 0 && ig1.state === 'failed' && /Rule 2/.test(ig1.error || ''), '4.7 an @ that reaches the publish is refused before any call to Meta', `${seen.length} ${ig1.error}`);
  pr = await admin.runPublish(db, { ...ig1, caption: 'clean' }, { fetch: fakeMeta, env: ENV, sleep: async () => {} });
  ok(!pr.ok && /not connected/.test(ig1.error || ''), '4.8 no house connection on the service: failed, said plainly', ig1.error);
  r = await s.call('POST', '/admin/collab/prospects', { name: 'Neha', craft: 'Model', city: 'Delhi', instagram_handle: '@neha.looks' });
  ok(r.status === 200 && r.body.prospect.instagram_handle === 'neha.looks' && r.body.prospect.opted_out === undefined || (r.body.prospect && r.body.prospect.instagram_handle === 'neha.looks'), '4.9 a prospect is kept, the @ trimmed off the handle', JSON.stringify(r.body));
  const pid = r.body.prospect.id;
  r = await s.call('PATCH', `/admin/collab/prospects/${pid}`, { opted_out: true });
  ok(r.status === 200 && r.body.prospect.opted_out === true, '4.10 opted out is recorded');
  const post = db._tables.collab_posts[0];
  r = await s.call('GET', `/admin/collab/posts/${post.id}/share-text`);
  ok(r.status === 200 && /Looking for|looking for/.test(r.body.text) && !/@/.test(r.body.text) && r.body.text.includes(social.dateWords(FUTURE)), '4.11 share text: the call in plain words, its date in full words (derived as production derives it), no @', r.body && r.body.text);
  await s.close();

  sec('5  one home, the ladder, and Rule 2 at the source');
  const lib = ['social.js', 'publish.js', 'gate.js', 'testers.js'].map((f) => fs.readFileSync(path.join(ROOT, 'src/lib/collab', f), 'utf8')).join('\n');
  const adminSrc = fs.readFileSync(path.join(ROOT, 'src/api/admin/collab.js'), 'utf8');
  const runPub = adminSrc.slice(adminSrc.indexOf('async function runPublish'), adminSrc.indexOf("router.post('/shares/:id/approve'"));
  ok(!/collab_prospects/.test(lib) && !/collab_prospects/.test(runPub), '5.1 no publish path reads the prospects list');
  const mig = fs.readFileSync(path.join(ROOT, 'db/migrations/0196_collab_v2.sql'), 'utf8').replace(/--.*$/gm, '');
  const made = [...mig.matchAll(/CREATE TABLE IF NOT EXISTS public\.(\w+)/g)].map((m) => m[1]);
  ok(made.length === 3 && made.every((t2) => new RegExp(`ALTER TABLE public\\.${t2} ENABLE ROW LEVEL SECURITY`).test(mig)), '5.2 0196: three new tables, each with row level security in the same file', made.join(','));
  ok(/BEGIN;[\s\S]*COMMIT;/.test(mig) && /ON CONFLICT \(key\) DO NOTHING/.test(mig) && /'flag\.collab_house_instagram',\s+'flag',\s+'pending'\)/.test(mig) && /'flag\.collab_threads',\s+'flag',\s+'pending'\)/.test(mig) && !/auto_on/.test(mig) && !/^\s*UPDATE\s/im.test(mig) && !/DELETE\s+FROM/i.test(mig), '5.3 0196: one transaction; both switches seeded pending, by hand (no auto_on), idempotent; no UPDATE statement and no DELETE FROM');
  // AMENDED CE-47 (SRV_3, b128 2.1): 5.3 read the WORD "UPDATE" anywhere, so the grants below would have tripped it; it
  // now refuses an UPDATE statement or a DELETE FROM, which is what it always meant. 5.6 holds the grants themselves.
  ok(made.every((t2) => new RegExp(`ENABLE ROW LEVEL SECURITY;\\s*\\nGRANT SELECT, INSERT, UPDATE, DELETE ON public\\.${t2} TO service_role;`).test(mig)), '5.6 0196: each new table grants service_role SELECT, INSERT, UPDATE, DELETE right after its RLS line (after 0170, no grant means no read)', made.join(','));
  const gates = require(path.join(ROOT, 'src/lib/metaGates.js'));
  const fgSrc = fs.readFileSync(path.join(ROOT, 'src/lib/featureGate.js'), 'utf8');
  ok(!gates.FEATURES.some((x) => /collab/.test(x.gate)) && !Object.keys(gates.PERM_ROWS).some((k) => /collab/.test(k)) && !/collab/.test(fgSrc), '5.4 house posting is not a Meta-gated feature: not in metaGates, not in featureGate (ruled)');
  const router = fs.readFileSync(path.join(ROOT, 'src/api/router.js'), 'utf8');
  ok(/router\.use\('\/admin\/collab',\s+require\('\.\/admin\/collab'\)\)/.test(router), '5.5 the admin collab door is mounted (F-44.300)');
  // ADDED SRV_4: the double returns every column whatever select() names, so 4.1 alone could not see vendors.name
  // (a column the live table does not have). This cell reads the select itself.
  ok(/from\('vendors'\)\.select\('id, business_name'\)/.test(adminSrc) && !/from\('vendors'\)\.select\('[^']*\bname\b(?<!business_name)[^']*'\)/.test(adminSrc.replace(/business_name/g, '')), '5.7 the admin queue reads vendors.business_name, the live column');
}

const MUTS = [
  ['src/lib/collab/social.js', "return /@/.test(String(caption || '')) ? 'the caption holds an @, so it names an account (Rule 2)' : null;", 'return null;', 'M1 refuse() lets an @ through', '4.2'],
  ['src/lib/collab/social.js', "if ((s === 'pending' || s === 'armed' || s === 'approved') && vendorId && Array.isArray(testers)) return testers.includes(vendorId);", "if (s === 'pending') return true;", 'M2 pending opens for every vendor', '2.2'],
  ['src/lib/collab/social.js', 'const CAPS = Object.freeze({ instagram: 5, threads: 1 });', 'const CAPS = Object.freeze({ instagram: 5, threads: 5 });', 'M3 Threads takes five tags', '1.2'],
  ['src/api/vendor/collab.js', 'const rows = collabSocial.PLATFORMS.filter((p) => open[p]).map((p) => {', 'const rows = collabSocial.PLATFORMS.map((p) => {', 'M4 shares queued with the gate shut', '3.9'],
  ['src/lib/collab/social.js', 'if (post.details) lines.push(clean(post.details));', 'if (post.details) lines.push(String(post.details));', 'M5 her words reach the caption with their @', '1.4'],
  ['src/api/vendor/collab.js', 'const view = (shares || []).map(', 'const view = shares || []; void (shares || []).map(', 'M7 her page is sent the caption and the card', '3.7'],
  ['src/lib/collab/gate.js', 'out[p] = social.openFor(await capApi.get(ROWS[p], { supabase }), vendorId, list);', "out[p] = social.openFor({ status: 'on' }, vendorId, list);", 'M8 the gate ignores the switch row', '2.6'],
  ['db/migrations/0196_collab_v2.sql', 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.collab_prospects TO service_role;', '-- grant removed', 'M9 one table left without its grant', '5.6'],
  ['src/api/admin/collab.js', "select('id, business_name').in('id', vids)", "select('id, name').in('id', vids)", 'M10 the phantom vendors.name back', '5.7'],
  ['src/lib/collab/social.js', "const s = row ? row.status : null;\n  if (s === 'on') return true;", "const s = row ? row.status : null;\n  if (s === 'on' || s === 'off') return true;", 'M6 off opens', '2.3'],
];
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async () => {
  try { await cells(); } catch (e) { ok(false, `b280 crashed: ${e && e.stack}`); }
  if (CHILD) process.exit(fail ? 1 : 0);
  sec('6  mutations of production code (each must red its cell in a child run; restored by sha)');
  const saved = new Map(); const restore = () => { for (const [p, b] of saved) fs.writeFileSync(p, b); };
  process.on('exit', restore); for (const sg of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sg, () => process.exit(130));
  for (const [file, from, to, name, cell] of MUTS) {
    const p = path.join(ROOT, file); const before = sha(p); const src = fs.readFileSync(p, 'utf8');
    if (src.split(from).length !== 2) { ok(false, `${name}: anchor found exactly once`, file); continue; }
    saved.set(p, src); fs.writeFileSync(p, src.replace(from, to));
    const r = cp.spawnSync(process.execPath, [__filename], { env: { ...process.env, B280_CHILD: '1' }, encoding: 'utf8' });
    fs.writeFileSync(p, src); saved.delete(p);
    const red = r.status === 1 && new RegExp(`FAIL  ${cell.replace('.', '\\.')} `).test(r.stdout || '');
    ok(red && sha(p) === before, `${name}: reddens ${cell}, restored by sha`, (r.stdout || '').split('\n').filter((l) => l.includes('FAIL')).join(' / '));
  }
  console.log(`\nb280 · ${pass} pass · ${fail} fail`);
  if (fail) { console.log('FAILED: ' + failed.join(' | ')); process.exit(1); }
  process.exit(0);
})();
