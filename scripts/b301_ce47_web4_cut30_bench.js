// scripts/b301_ce47_web4_cut30_bench.js
// TDW · CE-47 · WEB-4 cut 30 · b301 — R-47.2, THE FOUNDER'S RULE OF 8 OCTOBER 2026: a vendor's pictures belong to her.
// §1 the one rule file (the chair's threshold of 9 October pinned) · §2 the safety check and its sweep · §3 the vendor
// door over HTTP (the chair's ruling 5: approval_state and source sent by a vendor are ignored) · §4 every reader
// moved (no code reads approval_state) · §5 the admin doors over HTTP (no remove button; hide and its undo; release;
// a legal removal logged first, the vendor told) · §6 the Report door over HTTP (hides nothing) · §7 0223 ·
// §8 mutations, run. Drives the real files on b196_store; Google is stood in. No timing cell.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const Module = require('module');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r); const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
function load(r, src) { const m = new Module(P(r), module); m.filename = P(r); m.paths = Module._nodeModulePaths(path.dirname(P(r))); m._compile(src === undefined ? read(r) : src, P(r)); return m.exports; }
// the doors' guards stood in: the vendor is v1; the admin is admin; the Dreamer is u1 (or nobody, when asked)
let DREAMER = { id: 'cu1', user_id: '11111111-1111-4111-8111-111111111111', couple_id: 'c1' };
const stub = (rel, exp) => { const k = require.resolve(P(rel)); require.cache[k] = { id: k, filename: k, loaded: true, exports: exp }; };
stub('src/api/middleware/requireAuth.js', (q, r, n) => n());
stub('src/api/middleware/resolveVendor.js', () => (q, r, n) => { q.vendor = { id: VID, tier: 'basic' }; n(); });
stub('src/api/admin/requireAdmin.js', (q, r, n) => n());
stub('src/lib/cloudinarySign.js', { signUpload: () => 'sig', uploadUrl: () => 'https://api.cloudinary.com/x', nowTimestamp: () => 1 });
const { makeStore } = require('./lib/b196_store');
const VID = '22222222-2222-4222-8222-222222222222';
const CL = (n) => `https://res.cloudinary.com/tdw/image/upload/v1/${n}.jpg`;

// GOOGLE, stood in: an address's file name says what Google answers ("adult-LIKELY", "racy-VERY_LIKELY", "clean").
let visionCalls = []; let visionDown = false;
function vision(answerFor) {
  return { apiKey: 'k', fetch: async (url, opt) => {
    visionCalls.push(JSON.parse(opt.body).requests.length);
    if (visionDown) throw new Error('down');
    const reqs = JSON.parse(opt.body).requests;
    return { ok: true, json: async () => ({ responses: reqs.map((r) => answerFor(r.image.source.imageUri)) }) };
  } };
}
const byName = (u) => { const base = { adult: 'VERY_UNLIKELY', spoof: 'VERY_UNLIKELY', medical: 'VERY_UNLIKELY', violence: 'VERY_UNLIKELY', racy: 'VERY_UNLIKELY' };
  const m = /\/([a-z]+)-([A-Z_]+)\.jpg$/.exec(u); if (u.includes('/broken')) return { error: { message: 'unreadable' } };
  if (m) base[m[1]] = m[2]; return { safeSearchAnnotation: base }; };
const DEPS = vision(byName);

async function serve(mount, sb, extra) {
  const express = require('express'); const app = express(); app.use(express.json());
  app.locals.supabase = sb; app.locals.safetyDeps = DEPS; Object.assign(app.locals, extra || {});
  app.use((q, r, n) => { if (DREAMER) q.coupleUser = DREAMER; n(); });
  for (const [at, rel, src] of mount) app.use(at, load(rel, src));
  const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
  const call = (m, p, body) => new Promise((done) => { const data = body === undefined ? null : JSON.stringify(body);
    const rq = http.request({ host: '127.0.0.1', port: srv.address().port, path: p, method: m, headers: data ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } : {} },
      (rs) => { let x = ''; rs.on('data', (c) => (x += c)); rs.on('end', () => { let b = {}; try { b = JSON.parse(x || '{}'); } catch (_e) { b = { raw: x }; } done({ status: rs.statusCode, body: b }); }); });
    if (data) rq.write(data); rq.end(); });
  return { call, close: () => new Promise((r) => srv.close(r)) };
}
const world = (extra) => makeStore(Object.assign({ vendors: [{ id: VID, business_name: 'Swati Roy Makeup', status: 'active' }], vendor_portfolio: [], vendor_look_photos: [], vendor_looks: [],
  picture_reports: [], picture_notices: [], admin_activity_log: [] }, extra || {}));
const pic = (id, x) => Object.assign({ id, vendor_id: VID, image_url: CL(id), caption: null, aesthetic_tags: [], is_hero: false, in_carousel: true, position: 0,
  source: 'upload', approval_state: 'pending', rejection_reason: null, safety_state: 'passed', discover_hidden_at: null, created_at: '2026-10-09T00:00:00Z' }, x || {});

(async () => {
  const PR = load('src/lib/vendor/pictureRules.js');
  sec('1  the one rule file (src/lib/vendor/pictureRules.js)');
  ok(() => JSON.stringify(PR.HOLD_RULE) === '{"adult":"LIKELY","violence":"LIKELY"}', '1.1 THE CHAIR\'S RULING OF 9 OCTOBER: hold when adult >= LIKELY or violence >= LIKELY; nothing else (one constant)');
  const S = (o) => PR.stateFromScores(Object.assign({ adult: 'VERY_UNLIKELY', spoof: 'VERY_UNLIKELY', medical: 'VERY_UNLIKELY', violence: 'VERY_UNLIKELY', racy: 'VERY_UNLIKELY' }, o));
  ok(() => S({ racy: 'VERY_LIKELY' }) === 'passed' && S({ spoof: 'VERY_LIKELY' }) === 'passed' && S({ medical: 'VERY_LIKELY' }) === 'passed', '1.2 racy, spoof or medical VERY_LIKELY: passed (read by nothing)');
  ok(() => S({ adult: 'LIKELY' }) === 'held' && S({ adult: 'VERY_LIKELY' }) === 'held' && S({ violence: 'LIKELY' }) === 'held', '1.3 adult LIKELY (and above), violence LIKELY: held');
  ok(() => S({ adult: 'POSSIBLE' }) === 'passed' && S({ violence: 'POSSIBLE', racy: 'LIKELY' }) === 'passed' && S({}) === 'passed', '1.4 POSSIBLE is passed');
  ok(() => PR.onHerPages({ safety_state: 'passed' }) && PR.onHerPages({ safety_state: 'unchecked' }) && !PR.onHerPages({ safety_state: 'held' }) && PR.onHerPages({ safety_state: 'passed', discover_hidden_at: 'x' }), '1.5 her own pages: every picture that is not held (hidden from Discover still shows on her pages)');
  ok(() => PR.onDiscover({ safety_state: 'passed' }) && !PR.onDiscover({ safety_state: 'unchecked' }) && !PR.onDiscover({ safety_state: 'held' }) && !PR.onDiscover({ safety_state: 'passed', discover_hidden_at: 'x' }), '1.6 Discover: passed and not hidden; unchecked waits for the sweep');
  ok(() => PR.LINES.held === 'TDW is checking this picture. It is not shown yet.' && PR.LINES.hiddenFromDiscover === 'This picture is not shown on Discover.'
    && PR.LINES.legalRemoval('copyright claim') === 'TDW removed one of your pictures for a legal reason: copyright claim.' && PR.LINES.legalRemoval('a claim.') === 'TDW removed one of your pictures for a legal reason: a claim.', '1.7 the founder\'s lines, word for word (8 October, 21:33)');
  ok(() => JSON.stringify(Object.values(PR.REPORT_REASONS)) === JSON.stringify(['This is not wedding work.', "This is someone else's work.", 'This picture is offensive.', 'Something else.']), '1.8 the four report reasons, the founder\'s words');
  ok(() => { const v = PR.vendorPicture(pic('a', { approval_state: 'rejected', rejection_reason: 'blurry', safety_state: 'passed', discover_hidden_at: 'x', safety_scores: { adult: 'x' } }));
    return !('approval_state' in v) && !('rejection_reason' in v) && !('safety_scores' in v) && v.notice === PR.LINES.hiddenFromDiscover && v.shown_on_her_pages === true && v.shown_on_discover === false; }, '1.9 what she reads about a picture: never approval_state, never the old reason; one notice line');

  sec('2  the safety check and its sweep (src/lib/vendor/safetyCheck.js)');
  const SC = load('src/lib/vendor/safetyCheck.js');
  visionCalls = [];
  const urls = Array.from({ length: 35 }, (_, i) => CL(i === 3 ? 'adult-LIKELY' : i === 4 ? 'racy-VERY_LIKELY' : i === 5 ? 'broken' : 'p' + i));
  const r2 = await SC.check(urls, DEPS);
  ok(() => JSON.stringify(visionCalls) === '[16,16,3]' && r2.length === 35, '2.1 batches of 16 (Vision\'s limit)', JSON.stringify(visionCalls));
  ok(() => r2[3].state === 'held' && r2[4].state === 'passed' && r2[5].state === 'unchecked' && r2[0].state === 'passed' && r2[0].scores.racy === 'VERY_UNLIKELY', '2.2 held by the rule; racy passes; an unreadable picture is unchecked; scores kept');
  visionDown = true; const r3 = await SC.check([CL('p1')], DEPS); visionDown = false;
  const r4 = await SC.check([CL('p1')], { apiKey: '', fetch: async () => { throw new Error('never called'); } });
  ok(() => r3[0].state === 'unchecked' && r4[0].state === 'unchecked', '2.3 Google down, or no key: unchecked (live on her pages, not on Discover), never an error');
  { const st = world({ vendor_portfolio: [pic('u1', { safety_state: 'unchecked', image_url: CL('adult-VERY_LIKELY') }), pic('u2', { safety_state: 'unchecked' }), pic('u3', { safety_state: 'unchecked', image_url: CL('broken') })],
      vendor_look_photos: [Object.assign(pic('l1', { safety_state: 'unchecked' }), { look_id: 'L', deleted_at: null })] });
    const out = await SC.sweep(st, DEPS);
    const s = (id) => (st.tables.vendor_portfolio.find((r) => r.id === id) || st.tables.vendor_look_photos.find((r) => r.id === id)).safety_state;
    ok(() => s('u1') === 'held' && s('u2') === 'passed' && s('u3') === 'unchecked' && s('l1') === 'passed' && out.held === 1 && out.passed === 2 && out.still_unchecked === 1, '2.4 the sweep checks both tables and writes passed or held; an unreadable one stays unchecked', JSON.stringify(out)); }
  ok(() => /\.update\(f\)\.eq\('id', rows\[i\]\.id\)\.eq\('safety_state', R\.SAFETY\.UNCHECKED\)/.test(read('src/lib/vendor/safetyCheck.js')), '2.5 the sweep writes only a row still unchecked (an admin\'s release in between is never undone)');
  ok(() => /cron\.schedule\('13,28,43,58 \* \* \* \*'[\s\S]{0,200}safetyCheck'\)\.sweep\(supabase\)/.test(read('src/cron.js')), '2.6 the sweep runs every 15 minutes, on minutes of its own (:13 :28 :43 :58)');

  sec('3  the vendor door over HTTP (POST/GET /api/v2/vendor/portfolio; the chair\'s ruling 5)');
  { const st = world(); const h = await serve([['/p', 'src/api/vendor/portfolio.js']], st);
    const r = await h.call('POST', '/p', { image_url: CL('adult-LIKELY'), approval_state: 'approved', source: 'instagram', safety_state: 'passed', caption: 'Riya' });
    const row = st.tables.vendor_portfolio[0] || {};
    ok(() => r.status === 200 && row.source === 'upload' && row.safety_state === 'held' && row.approval_state === undefined && row.caption === 'Riya', '3.1 a vendor sends approval_state approved, source instagram and safety_state passed: all three ignored; the check held it; her caption kept', JSON.stringify({ s: r.status, src: row.source, st: row.safety_state, ap: row.approval_state }));
    ok(() => r.body.image && !('approval_state' in r.body.image) && !('rejection_reason' in r.body.image) && r.body.image.notice === 'TDW is checking this picture. It is not shown yet.' && r.body.image.shown_on_her_pages === false, '3.2 the answer carries her notice line, never an approval state', JSON.stringify(r.body.image));
    const r2b = await h.call('POST', '/p', { image_url: CL('racy-VERY_LIKELY') });
    ok(() => r2b.status === 200 && st.tables.vendor_portfolio[1].safety_state === 'passed' && r2b.body.image.notice === null && r2b.body.image.shown_on_discover === true, '3.3 a bridal picture Google calls racy VERY_LIKELY: passed, live everywhere at once');
    st.tables.vendor_portfolio.push(pic('old', { approval_state: 'rejected', rejection_reason: 'blurry', discover_hidden_at: '2026-10-09T00:00:00Z', position: 2 }));
    st.tables.picture_notices.push({ id: '33333333-3333-4333-8333-333333333333', vendor_id: VID, line: 'TDW removed one of your pictures for a legal reason: copyright claim.', created_at: 'x', seen_at: null });
    const g = await h.call('GET', '/p/' + VID);
    const old = (g.body.images || []).find((x) => x.id === 'old') || {};
    ok(() => g.status === 200 && g.body.images.length === 3 && !JSON.stringify(g.body.images).includes('blurry') && !JSON.stringify(g.body.images).includes('approval_state') && old.notice === 'This picture is not shown on Discover.' && old.shown_on_her_pages === true, '3.4 her list: every picture, the once-rejected one back on her pages and hidden from Discover; no reason, no approval state anywhere', JSON.stringify(old));
    ok(() => g.body.notices.length === 1 && g.body.notices[0].line === 'TDW removed one of your pictures for a legal reason: copyright claim.', '3.5 the notice of a legal removal is on her portfolio');
    const seen = await h.call('PATCH', '/p/notices/33333333-3333-4333-8333-333333333333/seen'); const g2 = await h.call('GET', '/p/' + VID);
    ok(() => seen.status === 200 && g2.body.notices.length === 0, '3.6 once she has read it, it stops showing');
    const hid = await h.call('GET', '/p/' + VID + '?state=hidden'); const held = await h.call('GET', '/p/' + VID + '?state=held');
    ok(() => hid.body.images.map((x) => x.id).join() === 'old' && held.body.images.length === 1, '3.7 her filters: hidden from Discover, held');
    await h.close(); }

  sec('4  every reader moved (no code reads approval_state; each door reads the one rule)');
  const walk = (dir) => fs.readdirSync(P(dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.js') ? [path.join(dir, e.name)] : []));
  const codeLines = (f) => read(f).split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => !/^\s*(\/\/|\*|\/\*)/.test(l));
  const readers = walk('src').flatMap((f) => codeLines(f).filter(([, l]) => /approval_state|rejection_reason|reviewed_by_admin/.test(l.replace(/\/\/.*$/, '')) && !/vendor_featured_submissions|featured/.test(f)).map(([n]) => `${f}:${n}`));
  ok(() => readers.length === 1 && readers[0].startsWith('src/lib/vendor/pictureRules.js'), '4.1 no code in src reads approval_state, rejection_reason or reviewed_by_admin, but the rule file that strips them from her wire (featured slots excepted: their own column)', JSON.stringify(readers));
  const DISC = /\.eq\('safety_state', 'passed'\)\.is\('discover_hidden_at', null\)/;
  ok(() => (read('src/api/couple/discover.js').match(new RegExp(DISC.source, 'g')) || []).length === 2 && DISC.test(read('src/api/couple/taste.js')) && DISC.test(read('src/lib/vendor/discover.js')), '4.2 Discover\'s four reads (feed, heroes, taste, her preview): passed and not hidden');
  ok(() => /\.neq\('safety_state', PR\.SAFETY\.HELD\)/.test(read('src/api/public/vendorCard.js')) && (read('src/api/public/vendorCard.js').match(/\.neq\('safety_state', PR\.SAFETY\.HELD\)/g) || []).length === 3 && /\.neq\('safety_state', 'held'\)/.test(read('src/lib/brands/kit.js')), '4.3 her own pages read "not held": the storefront, the website\'s look photos (both reads), the media kit');
  ok(() => /HELD_STATES = Object\.freeze\(\['held'\]\)/.test(read('src/lib/hub/profiles.js')) && /HELD_STATES\.includes\(row\.safety_state\)/.test(read('src/lib/hub/profiles.js')), '4.4 the Hub page and her Instagram package cards (CLB\'s one home): held is not on her page');
  ok(() => /pictureRules'\)\.onHerPages\(p\) && p\.is_hero/.test(read('src/api/vendor/collab.js')) && /pictureRules'\)\.onHerPages\(row\)/.test(read('src/lib/papers/issue.js')), '4.5 the Collab hero and Business papers: her picture unless held');
  { const SCd = load('src/lib/site/siteCard.js'); ok(() => /function showsOnHerSite\(r\) \{ return PR\.onHerPages\(r\); \}/.test(read('src/lib/site/siteCard.js')), '4.6 her website: every look photo but a held one (siteCard.showsOnHerSite reads the rule)'); }
  ok(() => /source: 'instagram', safety: checks\[i\]/.test(read('src/lib/vendor/igImport.js')) && /safety\.check\(mirrored\.map/.test(read('src/lib/vendor/igImport.js')), '4.7 the Instagram import: checked in batches before the rows are written; source through the internal argument only');

  sec('5  the admin doors over HTTP (src/api/admin/photos.js)');
  { const st = world({ vendor_portfolio: [pic('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', { safety_state: 'held' }), pic('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')],
      vendor_look_photos: [Object.assign(pic('cccccccc-cccc-4ccc-8ccc-cccccccccccc', { safety_state: 'held' }), { look_id: 'L', deleted_at: null })] });
    const h = await serve([['/a', 'src/api/admin/photos.js']], st);
    const q = await h.call('GET', '/a/queue');
    ok(() => q.status === 200 && q.body.held.length === 2 && q.body.held.map((x) => x.kind).sort().join() === 'look,portfolio' && Array.isArray(q.body.reports), '5.1 "Pictures to look at": what the safety check held, both tables, and the open reports');
    const hide = await h.call('POST', '/a/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/discover-hide');
    const b = () => st.tables.vendor_portfolio.find((x) => x.id.startsWith('bbbb'));
    const hiddenThen = Boolean(b().discover_hidden_at);
    const show = await h.call('POST', '/a/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/discover-show');
    ok(() => hide.status === 200 && hiddenThen && show.status === 200 && b().discover_hidden_at === null && st.tables.admin_activity_log.filter((l) => /picture_discover_(hide|show)/.test(l.action)).length === 2, '5.2 hide from Discover, and its one-tap undo; each act logged');
    const rel = await h.call('POST', '/a/cccccccc-cccc-4ccc-8ccc-cccccccccccc/release', { kind: 'look' }); const again = await h.call('POST', '/a/cccccccc-cccc-4ccc-8ccc-cccccccccccc/release', { kind: 'look' });
    ok(() => rel.status === 200 && st.tables.vendor_look_photos[0].safety_state === 'passed' && again.status === 404, '5.3 release: a held picture becomes passed; only a held one can be released');
    const gone = await Promise.all(['/a/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/approve', '/a/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/reject', '/a/bulk-approve'].map((p) => h.call('POST', p, {})));
    ok(() => gone.every((x) => x.status === 404) && !/router\.delete\(/.test(read('src/api/admin/vendorPortfolio.js')) && !/router\.delete\(/.test(read('src/api/admin/photos.js')), '5.4 NO REMOVE BUTTON: approve, reject and bulk-approve are gone, and the admin portfolio DELETE door too', gone.map((x) => x.status).join());
    const bad = await h.call('POST', '/a/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/legal-removal', { reason: '' });
    const lr = await h.call('POST', '/a/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/legal-removal', { reason: 'copyright claim from the photographer' });
    const log = st.tables.admin_activity_log.find((l) => l.action === 'picture_legal_removal');
    ok(() => bad.status === 400 && lr.status === 200 && !st.tables.vendor_portfolio.some((x) => x.id.startsWith('aaaa')) && log && log.metadata.reason === 'copyright claim from the photographer'
      && st.tables.picture_notices.length === 1 && st.tables.picture_notices[0].line === 'TDW removed one of your pictures for a legal reason: copyright claim from the photographer.', '5.5 a legal removal: a reason required; logged with it; the picture gone; the vendor told on her portfolio, in the founder\'s words');
    await h.close(); }
  { const st = world({ vendor_portfolio: [pic('dddddddd-dddd-4ddd-8ddd-dddddddddddd')] }); st.failWrite.add('admin_activity_log');
    const h = await serve([['/a', 'src/api/admin/photos.js']], st);
    const lr = await h.call('POST', '/a/dddddddd-dddd-4ddd-8ddd-dddddddddddd/legal-removal', { reason: 'court order' });
    ok(() => lr.status === 503 && st.tables.vendor_portfolio.length === 1 && st.tables.picture_notices.length === 0, '5.6 a removal that cannot be recorded does not happen');
    await h.close(); }

  sec('6  the Report button over HTTP (POST /api/v2/discover/report)');
  { const st = world({ vendor_portfolio: [pic('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'), pic('ffffffff-ffff-4fff-8fff-ffffffffffff', { discover_hidden_at: 'x' })] });
    const h = await serve([['/r', 'src/api/couple/report.js']], st);
    const body = { vendor_id: VID, image_url: CL('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'), reason: 'not_their_work', note: 'I saw this on another page.' };
    const a = await h.call('POST', '/r', body); const b2 = await h.call('POST', '/r', body);
    const e = st.tables.vendor_portfolio[0];
    ok(() => a.status === 200 && a.body.already === false && b2.body.already === true && st.tables.picture_reports.length === 1 && st.tables.picture_reports[0].reporter_user_id === DREAMER.user_id, '6.1 filed once; a second report by the same Dreamer files nothing (already: true)');
    ok(() => e.safety_state === 'passed' && e.discover_hidden_at === null, '6.2 a report hides nothing by itself');
    const why = await h.call('POST', '/r', Object.assign({}, body, { reason: 'ugly' })); const off = await h.call('POST', '/r', Object.assign({}, body, { image_url: CL('ffffffff-ffff-4fff-8fff-ffffffffffff') }));
    ok(() => why.status === 400 && off.status === 404, '6.3 only the four reasons; a picture not on Discover cannot be reported');
    DREAMER = null; const anon = await h.call('POST', '/r', body); DREAMER = { id: 'cu1', user_id: '11111111-1111-4111-8111-111111111111', couple_id: 'c1' };
    ok(() => anon.status === 401 && /router\.use\('\/discover\/report', requireCoupleAuth, require\('\.\/couple\/report'\)\)/.test(read('src/api/router.js')), '6.4 signed-in Dreamers only (requireCoupleAuth at the mount)');
    await h.close(); }

  sec('7  0223 (db/migrations/0223_picture_rules.sql)');
  const SQL = read('db/migrations/0223_picture_rules.sql').split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
  ok(() => /^BEGIN;$/m.test(SQL) && /^COMMIT;$/m.test(SQL) && (SQL.match(/safety_state\s+text\s+NOT NULL DEFAULT 'unchecked' CHECK \(safety_state IN \('unchecked', 'passed', 'held'\)\)/g) || []).length === 2, '7.1 safety_state on both tables, NOT NULL, unchecked by default, three states; one transaction');
  ok(() => /CREATE TABLE IF NOT EXISTS public\.picture_reports[\s\S]*UNIQUE \(picture_id, reporter_user_id\)/.test(SQL) && /reason\s+text\s+NOT NULL CHECK \(reason IN \('not_wedding_work', 'not_their_work', 'offensive', 'other'\)\)/.test(SQL), '7.2 picture_reports: one report per Dreamer per picture; the four reasons');
  ok(() => ['picture_reports', 'picture_notices'].every((t) => new RegExp(`ALTER TABLE public\\.${t} ENABLE ROW LEVEL SECURITY;`).test(SQL) && new RegExp(`GRANT SELECT, INSERT, UPDATE, DELETE ON public\\.${t} TO service_role;`).test(SQL)), '7.3 RLS on and the four grants for both new tables, in the transaction (e-273)');
  ok(() => /UPDATE public\.vendor_portfolio\s+SET safety_state = 'passed' WHERE approval_state = 'approved';/.test(SQL) && /SET discover_hidden_at = now\(\), discover_hidden_by = 'switch day: was rejected'\s+WHERE approval_state = 'rejected'/.test(SQL) && !/DROP COLUMN/.test(SQL), '7.4 switch day (Choice 1): approved -> passed; rejected -> hidden from Discover; nothing dropped (the old columns stay as history)');

  sec('8  mutations, run');
  { const src = read('src/lib/vendor/pictureRules.js'); const M = load('src/lib/vendor/pictureRules.js', src.replace("const HOLD_RULE = Object.freeze({ adult: 'LIKELY', violence: 'LIKELY' });", "const HOLD_RULE = Object.freeze({ adult: 'LIKELY', violence: 'LIKELY', racy: 'VERY_LIKELY' });"));
    ok(() => M.stateFromScores({ racy: 'VERY_LIKELY' }) === 'held', '8.1 racy put back in the rule: a bridal picture is held (1.1 and 1.2 redden)'); }
  { const src = read('src/api/vendor/portfolio.js'); const cut = "  const body = {}; for (const k of PICTURE_FIELDS) if (b[k] !== undefined) body[k] = b[k];\n  const result   = await registerImage(supabase, req.vendor.id, body, { source: 'upload', safetyDeps: req.app.locals.safetyDeps });";
    if (!src.includes(cut)) throw new Error('mutation target missing: the vendor door');
    const libSrc = read('src/lib/vendor/portfolio.js').replace("  const source = it.source === 'instagram' ? 'instagram' : 'upload';", "  const source = (body && body.source) || (it.source === 'instagram' ? 'instagram' : 'upload');");
    const lib = load('src/lib/vendor/portfolio.js', libSrc); const k = require.resolve(P('src/lib/vendor/portfolio.js')); const keep = require.cache[k];
    require.cache[k] = { id: k, filename: k, loaded: true, exports: lib };
    const st = world(); const h = await serve([['/p', 'src/api/vendor/portfolio.js', src.replace(cut, "  const result   = await registerImage(supabase, req.vendor.id, b, { safetyDeps: req.app.locals.safetyDeps });")]], st);
    await h.call('POST', '/p', { image_url: CL('p1'), source: 'instagram' }); await h.close(); require.cache[k] = keep;
    ok(() => st.tables.vendor_portfolio[0].source === 'instagram', '8.2 the door passing her body through and the register trusting it: her "instagram" is believed (3.1 reddens)'); }
  { const st = world({ vendor_portfolio: [pic('88888888-8888-4888-8888-888888888888')] }); const src = read('src/api/couple/report.js');
    const h = await serve([['/r', 'src/api/couple/report.js', src.replace("  return okRes(res, { already: false });", "  await sb.from('vendor_portfolio').update({ discover_hidden_at: new Date().toISOString() }).eq('id', pics[0].id);\n  return okRes(res, { already: false });")]], st);
    await h.call('POST', '/r', { vendor_id: VID, image_url: CL('88888888-8888-4888-8888-888888888888'), reason: 'offensive' }); await h.close();
    ok(() => st.tables.vendor_portfolio[0].discover_hidden_at !== null, '8.3 a report that hides the picture by itself (6.2 reddens)'); }
  { const st = world({ vendor_portfolio: [pic('99999999-9999-4999-8999-999999999999')] }); st.failWrite.add('admin_activity_log'); const src = read('src/api/admin/photos.js');
    const h = await serve([['/a', 'src/api/admin/photos.js', src.replace("  if (!logged.written) return errRes(res, 503, 'The removal could not be recorded, so nothing was removed. Please try again.');\n", '')]], st);
    await h.call('POST', '/a/99999999-9999-4999-8999-999999999999/legal-removal', { reason: 'court order' }); await h.close();
    ok(() => st.tables.vendor_portfolio.length === 0, '8.4 the log-first guard removed: an unrecorded removal happens (5.6 reddens)'); }
  { const src = read('src/lib/vendor/pictureRules.js'); const M = load('src/lib/vendor/pictureRules.js', src.replace("const onDiscover = (row) => Boolean(row) && row.safety_state === SAFETY.PASSED && !row.discover_hidden_at;", "const onDiscover = (row) => Boolean(row) && row.safety_state === SAFETY.PASSED;"));
    ok(() => M.onDiscover({ safety_state: 'passed', discover_hidden_at: 'x' }) === true, '8.5 Discover forgetting "hidden": the admin\'s one power undone (1.6 reddens)'); }

  console.log(`\nb301 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.stack || e)); console.log(`\nb301 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
