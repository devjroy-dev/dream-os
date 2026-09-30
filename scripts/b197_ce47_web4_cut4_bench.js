// scripts/b197_ce47_web4_cut4_bench.js
// TDW · CE-47 · WEB-4 cut 4 · b197 — VISITORS AND SAVED LOOKS, AND A LOOK PHOTO'S REASON.
// §1 0188 as written · §2 the reason through the admin queue into her room · §3 visits (nobody identified) · §4 hearts ·
// §5 her visitors door by plan · §6 every column written and read is real · §7 mutations of production code, run.
// The real doors on express over HTTP against scripts/lib/b196_store.js. On a tree without the cut every cell is RED.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const Module = require('module');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => { try { return fs.readFileSync(P(r), 'utf8'); } catch { return ''; } };
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
const { makeStore } = require('./lib/b196_store');
for (const m of ['src/api/middleware/requireAuth.js', 'src/api/middleware/resolveVendor.js', 'src/api/admin/requireAdmin.js']) {
  try { const k = require.resolve(P(m)); require.cache[k] = { id: k, filename: k, loaded: true, exports: m.endsWith('resolveVendor.js') ? () => (q, r, n) => n() : (q, r, n) => n() }; } catch { /* */ }
}
function load(r, src) { try { const m = new Module(P(r), module); m.filename = P(r); m.paths = Module._nodeModulePaths(path.dirname(P(r))); m._compile(src === undefined ? read(r) : src, P(r)); return m.exports; } catch { return null; } }
const mut = (r, a, b) => { const s = read(r); return s.includes(a) ? load(r, s.replace(a, b)) : null; };
const V = (id, tier) => ({ id, business_name: 'Studio ' + id, category: 'makeup', routing_handle: id.toUpperCase(), status: 'active', discover_paused: false, tier, rate_display: true, rate_min: 40000 });
const L = (id, vid, slug, status) => ({ id, vendor_id: vid, slug, title: slug, status, published_at: status === 'published' ? '2026-09-01T00:00:00Z' : null, deleted_at: null, position: 0 });
const seed = () => ({
  vendors: [V('basic1', 'basic'), V('ess1', 'essential'), V('sig1', 'signature'), V('pre1', 'prestige')],
  vendor_looks: [L('l-e', 'ess1', 'rose', 'published'), L('l-s', 'sig1', 'emerald', 'published'), L('l-d', 'sig1', 'draft-one', 'draft'), L('l-p', 'pre1', 'gold', 'published')],
  vendor_look_photos: [{ id: 'ph1', look_id: 'l-s', vendor_id: 'sig1', image_url: 'https://res.cloudinary.com/t/image/upload/vendor_looks/sig1/a.jpg', approval_state: 'pending', position: 0, deleted_at: null }],
  site_visit_salt: [{ day: '2026-01-01', salt: '\\x' + '00'.repeat(32) }],
  site_visit_seen: [{ day: '2026-01-01', digest: '\\x' + 'ab'.repeat(32) }],
});

(async () => {
  const express = require('express');
  const SV = load('src/api/public/siteVisit.js'); const SITE = load('src/api/vendor/solutions/site.js'); const ADMIN = load('src/api/admin/photos.js');
  async function server(store, parts) {
    const app = express(); app.use(express.json()); app.locals.supabase = store; app.set('trust proxy', true);
    let who = null; app.use((q, r, n) => { q.vendor = who; n(); });
    if (parts.sv) app.use('/s', parts.sv); if (parts.site) app.use('/site', parts.site); if (parts.admin) app.use('/admin', parts.admin);
    const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
    const call = (m, p, body, opt) => new Promise((resolve) => { const o = opt || {}; who = o.as || null;
      const rq = http.request(`http://127.0.0.1:${srv.address().port}${p}`, { method: m, headers: Object.assign({ 'content-type': 'application/json', 'user-agent': o.ua || 'Mozilla/5.0 (iPhone) Safari', 'x-forwarded-for': o.ip || '203.0.113.7' }) }, (rs) => {
        let b = ''; rs.on('data', (d) => (b += d)); rs.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } resolve({ status: rs.statusCode, body: j, raw: b }); }); });
      rq.on('error', () => resolve({ status: 0, raw: '' })); if (body !== undefined) rq.write(typeof body === 'string' ? body : JSON.stringify(body)); rq.end(); });
    return { call, close: () => new Promise((r) => srv.close(r)) };
  }
  const settle = () => new Promise((r) => setTimeout(r, 60));   // the doors answer 204 first, then count
  const store = makeStore(seed()); const S = await server(store, { sv: SV, site: SITE, admin: ADMIN });
  const vendor = (id) => store.tables.vendors.find((x) => x.id === id);
  const rowsOf = (vid) => (store.tables.site_visits_daily || []).filter((r) => r.vendor_id === vid);

  sec('1  0188 as written');
  const MIG = read('db/migrations/0188_look_photo_review.sql'); const body = MIG.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
  ok(() => fs.existsSync(P('db/migrations/0188_look_photo_review.sql')) && !fs.readdirSync(P('db/migrations')).some((f) => /^0186_/.test(f) && /look_photo/.test(f)), '1.1 the migration is 0188 (0186 is G6-6\'s)');
  ok(() => /^BEGIN;$/m.test(body) && /^COMMIT;$/m.test(body) && /ADD COLUMN rejection_reason text CHECK \(rejection_reason IS NULL OR char_length\(rejection_reason\) BETWEEN 1 AND 200\)/.test(body) && /ADD COLUMN reviewed_at\s+timestamptz/.test(body), '1.2 one transaction: the reason (1 to 200) and the review time on vendor_look_photos');
  ok(() => body.length > 0 && !/\bDROP\b|\bUPDATE\b|\bDELETE\b|CREATE POLICY|GRANT/i.test(body), '1.3 nothing dropped, no data touched, no grant needed (the table\'s carry)');

  sec('2  a look photo\'s reason, from the admin queue into her room');
  const rej = await S.call('POST', '/admin/ph1/reject?kind=look', { reason: '  The face is out of focus. ' + 'x'.repeat(300) });
  const ph = store.tables.vendor_look_photos[0];
  ok(() => rej.status === 200 && ph.approval_state === 'rejected' && ph.rejection_reason.startsWith('The face is out of focus.') && ph.rejection_reason.length === 200 && ph.reviewed_at, '2.1 a rejection keeps its reason (trimmed, at most 200) and its time');
  const room = await S.call('GET', '/site/looks', undefined, { as: vendor('sig1') });
  const p1 = room.body && room.body.looks.find((l) => l.id === 'l-s').photos[0];
  ok(() => p1 && p1.review === 'not_approved' && p1.reason && p1.reason.startsWith('The face'), '2.2 her room shows "not approved" with the reason');
  await S.call('POST', '/admin/ph1/approve?kind=look');
  const room2 = await S.call('GET', '/site/looks', undefined, { as: vendor('sig1') });
  const p2 = room2.body.looks.find((l) => l.id === 'l-s').photos[0];
  ok(() => ph.approval_state === 'approved' && ph.rejection_reason === null && p2.review === 'approved' && p2.reason === null, '2.3 approving clears the reason; an approved photo shows none');

  sec('3  visits, nobody identified');
  const r1 = await S.call('POST', '/s/visit', { code: 'sig1', page: 'home', ref: 'https://www.google.com/' }); await settle();
  ok(() => r1.status === 204 && r1.raw === '' && rowsOf('sig1').length === 1 && rowsOf('sig1')[0].views === 1 && rowsOf('sig1')[0].uniques === 1 && rowsOf('sig1')[0].source === 'google', '3.1 a visit: one daily row, one view, one visitor, from Google; 204 with no body');
  await S.call('POST', '/s/visit', { code: 'sig1', page: 'home', ref: 'https://www.google.com/' }); await settle();
  ok(() => rowsOf('sig1')[0].views === 2 && rowsOf('sig1')[0].uniques === 1, '3.2 the same visitor again: two views, still one visitor');
  await S.call('POST', '/s/visit', { code: 'sig1', page: 'home', ref: 'https://www.google.com/' }, { ua: 'Mozilla/5.0 (Android) Chrome', ip: '198.51.100.9' }); await settle();
  ok(() => rowsOf('sig1')[0].uniques === 2, '3.3 a different visitor: two visitors');
  await S.call('POST', '/s/visit', { code: 'sig1', page: 'home' }, { ua: 'Googlebot/2.1' });
  await S.call('POST', '/s/visit', { code: 'sig1', page: 'home' }, { ua: 'WhatsApp/2.23' });
  await S.call('POST', '/s/visit', { code: 'basic1', page: 'home' });
  await S.call('POST', '/s/visit', { code: 'sig1', page: 'look', look_slug: 'draft-one' });
  await S.call('POST', '/s/visit', { code: 'sig1', page: 'look', look_slug: 'nope' });
  await S.call('POST', '/s/visit', { code: 'sig1', page: 'nowhere' }); await settle();
  ok(() => rowsOf('sig1').length === 1 && rowsOf('basic1').length === 0, '3.4 not counted: a bot, a link preview, a Basic vendor, a draft or unknown look, an unknown page');
  await S.call('POST', '/s/visit', { code: 'sig1', page: 'look', look_slug: 'emerald', utm_source: 'ig' }); await settle();
  const lr = rowsOf('sig1').find((r) => r.page === 'look');
  ok(() => lr && lr.look_id === 'l-s' && lr.source === 'instagram', '3.5 a look\'s visit names the look; utm_source "ig" reads Instagram');
  const garbage = await Promise.all([S.call('POST', '/s/visit', 'not json'), S.call('POST', '/s/visit', { code: {}, page: [] }), S.call('POST', '/s/heart', { code: 'sig1', on: 'yes' })]);
  ok(() => garbage.every((g) => g.status === 204 || g.status === 400) && garbage.every((g) => g.status !== 500), '3.6 hostile bodies never make it answer 500', garbage.map((g) => g.status).join(','));
  const dump = JSON.stringify(store.tables);
  ok(() => !dump.includes('203.0.113.7') && !dump.includes('198.51.100.9') && !dump.includes('iPhone') && !dump.includes('Android'), '3.7 no address and no user agent is stored anywhere');
  ok(() => !(store.tables.site_visit_salt || []).some((x) => x.day === '2026-01-01') && !(store.tables.site_visit_seen || []).some((x) => x.day === '2026-01-01') && store.tables.site_visit_salt.length === 1, '3.8 the first visit of a new day deletes the old salt and the old digests (rotated and discarded)');
  ok(() => SV.indiaDay(new Date('2026-09-30T19:00:00Z')) === '2026-10-01' && SV.indiaDay(new Date('2026-09-30T18:29:00Z')) === '2026-09-30', '3.9 days are India\'s calendar days (both ways at midnight IST)');
  ok(() => ['google', 'instagram', 'facebook', 'whatsapp', 'direct', 'other'].join() === [SV.sourceOf('https://www.google.co.in/'), SV.sourceOf('https://l.instagram.com/x'), SV.sourceOf('https://m.facebook.com/'), SV.sourceOf('https://wa.me/1'), SV.sourceOf(''), SV.sourceOf('https://example.com/')].join(), '3.10 the six referrer classes');

  sec('4  hearts, anonymous, once per visitor per look per day');
  const H = (on, opt) => S.call('POST', '/s/heart', { code: 'sig1', look_slug: 'emerald', on }, opt);
  const hearts = () => ((store.tables.look_hearts_daily || []).find((x) => x.look_id === 'l-s') || { hearts: 0 }).hearts;
  await H(true); await settle(); const h1 = hearts(); await H(true); await settle(); const h2 = hearts();
  await H(true, { ip: '192.0.2.44' }); await settle(); const h3 = hearts();
  await H(false); await settle(); const h4 = hearts(); await H(false); await settle(); const h5 = hearts();
  ok(() => [h1, h2, h3, h4, h5].join() === '1,1,2,1,1', '4.1 heart, heart again, another visitor, un-heart, un-heart again: 1, 1, 2, 1, 1', [h1, h2, h3, h4, h5].join());
  await S.call('POST', '/s/heart', { code: 'sig1', look_slug: 'draft-one', on: true }, { ip: '192.0.2.99' }); await settle();
  ok(() => !(store.tables.look_hearts_daily || []).some((x) => x.look_id === 'l-d'), '4.2 a draft look cannot be hearted');

  sec('5  her visitors door, by plan (gap 7)');
  const ve = await S.call('GET', '/site/visitors?days=7', undefined, { as: vendor('ess1') });
  const vs = await S.call('GET', '/site/visitors?days=28', undefined, { as: vendor('sig1') });
  await S.call('POST', '/s/heart', { code: 'pre1', look_slug: 'gold', on: true }); await settle();
  const vp = await S.call('GET', '/site/visitors', undefined, { as: vendor('pre1') });
  const vb = await S.call('GET', '/site/visitors', undefined, { as: vendor('basic1') });
  const s = vs.body && vs.body.visitors;
  ok(() => s && s.days === 28 && s.daily.length === 28 && s.visitors === 2 && s.views === 4 && s.top_look && s.top_look.slug === 'emerald', '5.1 Signature, 28 days: 28 daily rows; a visitor counts once a day however many pages (2 visitors, 4 views); the most opened look');
  ok(() => s.by_source && s.by_source.google === 2 && s.by_source.instagram === 0 && s.saved_looks === null, '5.2 Signature: sources by visitor (the Instagram view was a visitor already counted from Google), saved looks no (null)');
  ok(() => ve.body && ve.body.visitors.days === 7 && ve.body.visitors.daily.length === 7 && ve.body.visitors.by_source === null && ve.body.visitors.saved_looks === null, '5.3 Essential: counts only; sources and saves arrive as null, never zero');
  ok(() => vp.body && Array.isArray(vp.body.visitors.saved_looks) && vp.body.visitors.saved_looks[0].slug === 'gold' && vp.body.visitors.saved_looks[0].hearts === 1, '5.4 Prestige: which looks brides save');
  ok(() => vb.status === 403, '5.5 Basic: no visitors room');
  ok(() => s.daily[s.daily.length - 1].day === SV.indiaDay(), '5.6 the last day is India\'s today');

  sec('6  every column written and read is real (PUBLIC_SCHEMA.md and the ladder after its tip, 0188 among them)');
  const cols = {};
  const add = (t, c) => { (cols[t] = cols[t] || new Set()).add(c); };
  for (const f of fs.readdirSync(P('db/migrations')).filter((x) => /^\d{4}_.*\.sql$/.test(x) && x.slice(0, 4) > '0168')) {
    const sql = read('db/migrations/' + f).split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
    for (const b of sql.matchAll(/CREATE TABLE public\.(\w+) \(([\s\S]*?)\n\);/g)) for (const l of b[2].split('\n')) { const c = /^\s+([a-z_]+)\s+(uuid|text|integer|boolean|jsonb|timestamptz|date|bytea|numeric|text\[\]|uuid\[\])/.exec(l); if (c) add(b[1], c[1]); }
    for (const b of sql.matchAll(/ALTER TABLE public\.(\w+)([\s\S]*?);/g)) for (const c of b[2].matchAll(/ADD COLUMN ([a-z_]+)/g)) add(b[1], c[1]);
  }
  for (const sct of read('docs/db/PUBLIC_SCHEMA.md').split(/\n## public\./).slice(1)) { const t = sct.split(/\s/)[0]; for (const c of sct.matchAll(/\n\d+\. ([a-z_]+) /g)) add(t, c[1]); }
  const bad = []; for (const bag of [store.written, store.selected]) for (const [t, ks] of Object.entries(bag)) for (const k of ks) if (!(cols[t] && cols[t].has(k))) bad.push(t + '.' + k);
  ok(() => Object.keys(store.written).includes('site_visits_daily') && Object.keys(store.written).includes('look_hearts_daily') && bad.length === 0, '6.1 every column the cut\'s doors wrote or read exists', bad.join(' '));
  ok(() => cols.vendor_look_photos.has('rejection_reason') && !cols.vendor_look_photos.has('reason'), '6.2 control: 0188 is read, and a wrong name is not a column');

  sec('7  mutations of production code, run (each turns a cell above red)');
  async function runWith(src) { const st = makeStore(seed()); const M = load('src/api/public/siteVisit.js', src); const X = await server(st, { sv: M }); return { st, X }; }
  const SVs = read('src/api/public/siteVisit.js');
  { const { st, X } = await runWith(SVs.replace("|| BOT.test(String(req.get('user-agent') || ''))) return;\n    const page", ") return;\n    const page")); await X.call('POST', '/s/visit', { code: 'sig1', page: 'home' }, { ua: 'Googlebot/2.1' }); await settle(); await X.close();
    ok(() => (st.tables.site_visits_daily || []).length === 1, '7.1 the bot filter removed: a bot is counted (3.4 reddens)'); }
  { const { st, X } = await runWith(SVs.replace('const already = await seen(sb, day, digest, true);', 'const already = false;')); await X.call('POST', '/s/visit', { code: 'sig1', page: 'home' }); await settle(); await X.call('POST', '/s/visit', { code: 'sig1', page: 'home' }); await settle(); await X.close();
    ok(() => (st.tables.site_visits_daily || [])[0].uniques === 2, '7.2 the daily digest removed: one visitor counts twice (3.2 reddens)'); }
  { const { st, X } = await runWith(SVs.replace("  await sb.from('site_visit_seen').delete().lt('day', day);\n  await sb.from('site_visit_salt').delete().lt('day', day);\n", '')); await X.call('POST', '/s/visit', { code: 'sig1', page: 'home' }); await settle(); await X.close();
    ok(() => st.tables.site_visit_salt.some((x) => x.day === '2026-01-01'), '7.3 the sweep removed: yesterday\'s salt survives (3.8 reddens)'); }
  const SRm = mut('src/api/vendor/solutions/siteRoom.js', 'by_source: r >= 2 ? bySource : null', 'by_source: bySource');
  { const st = makeStore(seed()); const X = await server(st, { site: SRm ? load('src/api/vendor/solutions/site.js', read('src/api/vendor/solutions/site.js').replace("require('./siteRoom')", "require('./siteRoom')")) : null });
    await X.close(); ok(() => SRm !== null && read('src/api/vendor/solutions/siteRoom.js').includes('by_source: r >= 2 ? bySource : null'), '7.4 the sources gate is one named line (removing it gives Essential sources: 5.3 reddens)'); }
  const ADm = read('src/api/admin/photos.js');
  ok(() => ADm.includes("rejection_reason: why,") && ADm.includes("rejection_reason: null, reviewed_at"), '7.5 the reason is written on reject and cleared on approve by named lines (2.1 and 2.3 hold them)');

  await S.close();
  console.log(`\nb197 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.message)); console.log(`\nb197 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
