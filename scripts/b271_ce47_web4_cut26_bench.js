// scripts/b271_ce47_web4_cut26_bench.js
// TDW · CE-47 · WEB-4 cut 26 · b271 — THE FIRST BUILD FROM HER OWN PHOTOS (the chair's rulings of 8 October, (a) to (e)).
// Drives src/lib/vendor/firstBuild.js on b196_store with the Instagram and seed helpers stood in, and the door over HTTP.
// §1 no Instagram, her own photos: the website is built from them · §2 no Instagram, no photos: the draft is TDW's and
// untouched · §3 POST { step: 'website' } fills it, once, and only the website step runs · §4 her work is never filled
// · §5 the door's refusals · §6 Instagram unchanged · §7 the R-47.1 lines · §8 mutations, run.
// No fixed pause anywhere: the HTTP cells wait on the build's own state, bounded (e-275). Each cell names what it holds.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const Module = require('module');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r); const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
function load(r, src) { const m = new Module(P(r), module); m.filename = P(r); m.paths = Module._nodeModulePaths(path.dirname(P(r))); m._compile(src === undefined ? read(r) : src, P(r)); return m.exports; }
for (const m of ['src/api/middleware/requireAuth.js', 'src/api/middleware/resolveVendor.js']) { const k = require.resolve(P(m)); require.cache[k] = { id: k, filename: k, loaded: true, exports: m.endsWith('resolveVendor.js') ? () => (q, r, n) => n() : (q, r, n) => n() }; }
const { makeStore } = require('./lib/b196_store');
const FB = load('src/lib/vendor/firstBuild.js');
const CL = (i) => `https://res.cloudinary.com/tdw/image/upload/v1/${i}.jpg`;
const V = (id, tier, extra) => Object.assign({ id, business_name: 'Swati Roy Makeup', category: 'makeup', city: 'Delhi', tier, about: null }, extra || {});
const UP = (i, vid) => ({ id: 'u' + i, vendor_id: vid || 'v1', image_url: CL('up' + i), caption: null, approval_state: 'pending', source: 'upload', position: i });
function world(extra) {
  return makeStore(Object.assign({ vendors: [V('v1', 'basic')], vendor_portfolio: [], vendor_sites: [], vendor_site_drafts: [], vendor_looks: [], vendor_look_photos: [], vendor_packages: [], vendor_first_builds: [] }, extra || {}));
}
// tokenFor answers null: no Instagram connected. listMedia and fetchBio count their calls, so a rerun that touches
// Instagram is seen.
function deps(st, over) {
  const seen = { listMedia: 0, fetchBio: 0, seed: 0 };
  const d = {
    seen,
    tokenFor: async () => null,
    fetchBio: async () => { seen.fetchBio += 1; return 'Bridal makeup in Delhi NCR.'; },
    listMedia: async () => { seen.listMedia += 1; return { ok: true, items: [] }; },
    canAcceptMore: async () => ({ ok: true, remaining: 20 }),
    importSelected: async () => ({ ok: true, imported_count: 0 }),
    ensureSeeded: async (sb, vendor) => { seen.seed += 1; if (st.tables.vendor_packages.some((p) => p.vendor_id === vendor.id)) return { seeded: false, reason: 'already_seeded' }; for (const [i, n] of ['One function', 'Every function, with a trial'].entries()) st.tables.vendor_packages.push({ id: 'k' + i, vendor_id: vendor.id, name: n, total: 20000 + i, deleted_at: null }); return { seeded: true, count: 2 }; },
  };
  return Object.assign(d, over || {});
}
const stepOf = (steps, k) => (steps || []).find((s) => s.key === k);
async function build(mod, st, vendor, d) { let job = null; const r = await mod.start(st, vendor, Object.assign({}, d, { onRun: (j) => { job = j; } })); return job ? await job : (await mod.read(st, vendor.id, r.build_id)).steps; }
async function rerun(mod, st, vendor, d) { let job = null; const r = await mod.rerunWebsite(st, vendor, Object.assign({}, d, { onRun: (j) => { job = j; } })); if (job) await job; return r; }
const later = (iso, ms) => new Date(Date.parse(iso) + ms).toISOString();

async function door(mod, st, d) {
  const express = require('express'); const app = express(); app.use(express.json()); app.locals.supabase = st; app.locals.firstBuildDeps = d;
  app.use((q, r, n) => { q.vendor = V('v1', 'basic'); n(); });
  if (mod) { const k = require.resolve(P('src/lib/vendor/firstBuild.js')); require.cache[k] = { id: k, filename: k, loaded: true, exports: mod }; }
  app.use('/fb', load('src/api/vendor/firstBuild.js'));
  const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
  const call = (m, p, body) => new Promise((res) => { const data = body === undefined ? null : JSON.stringify(body);
    const rq = http.request({ host: '127.0.0.1', port: srv.address().port, path: p, method: m, headers: data ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } : {} }, (rs) => { let x = ''; rs.on('data', (c) => (x += c)); rs.on('end', () => res({ status: rs.statusCode, body: JSON.parse(x || '{}') })); });
    if (data) rq.write(data); rq.end(); });
  const settle = async (id) => { let g; const t0 = Date.now(); do { g = await call('GET', '/fb/' + id); if (g.body.state !== 'running') break; await new Promise((r) => setImmediate(r)); } while (Date.now() - t0 < 10000); return g; };
  return { call, settle, close: () => new Promise((r) => srv.close(r)) };
}

(async () => {
  sec('1  no Instagram, her own photos already in her portfolio: the website is built from them');
  const st1 = world({ vendor_portfolio: [UP(0), UP(1)] }); const d1 = deps(st1); const s1 = await build(FB, st1, V('v1', 'basic'), d1);
  const look1 = st1.tables.vendor_looks;
  ok(() => look1.length === 2 && look1.every((l) => l.source === 'manual' && l.status === 'draft'), '1.1 (c) a look made from her uploaded photo is written source manual, status draft', JSON.stringify(look1.map((l) => [l.source, l.status])));
  // AMENDED BY LABEL, CE-47 WEB-4 cut 30 (R-47.2): approval is gone; the look photo carries its portfolio picture's safety
  // state (the fixture's pictures were never checked: unchecked, which her site shows), and writes no approval_state.
  ok(() => st1.tables.vendor_look_photos.length === 2 && st1.tables.vendor_look_photos.every((p) => p.source === 'upload' && p.safety_state === 'unchecked' && p.approval_state === undefined), '1.2 (c) the look PHOTO keeps the truth: source upload, its picture\'s safety state (her site\'s rule reads this)');
  ok(() => stepOf(s1, 'photos').state === 'skipped' && stepOf(s1, 'photos').line === 'Your portfolio has 2 photos. We used them for your website.' && stepOf(s1, 'photos').counts.own === 2, '1.3 (d) the photos line names her photos and says they were used, not a gap', JSON.stringify(stepOf(s1, 'photos')));
  ok(() => stepOf(s1, 'website').state === 'done' && st1.tables.vendor_site_drafts[0].settings.cover.length === 2 && stepOf(s1, 'website').counts.photos === 2, '1.4 the website step: her draft has her two photos as cover slides');
  ok(() => !st1.tables.vendor_sites.some((x) => x.published_at), '1.5 nothing published');

  sec('2  no Instagram, no photos: the draft is TDW\'s and untouched');
  const st2 = world(); const d2 = deps(st2); const s2 = await build(FB, st2, V('v1', 'basic'), d2);
  const w2 = stepOf(s2, 'website'); const dr2 = st2.tables.vendor_site_drafts[0];
  ok(() => stepOf(s2, 'photos').line === 'Instagram is not connected, so we added no photos.' && stepOf(s2, 'photos').counts.own === undefined, '2.1 (d) no Instagram and no photos: the not-connected line, as before (R-47.1 wording)');
  ok(() => w2.state === 'done' && w2.counts.looks === 0 && w2.counts.cover_slides === 0 && w2.counts.photos === 0 && typeof w2.counts.draft_written_at === 'string' && Date.parse(w2.counts.draft_written_at) === Date.parse(dr2.updated_at), '2.2 (a) the website step records the updated_at it wrote, in its own step; no column', JSON.stringify(w2.counts));
  let lat2 = await FB.latest(st2, 'v1');
  ok(() => lat2 && lat2.website_can_fill === false, '2.3 (b) GET /latest: website_can_fill false while she has no photos');
  ok(() => /async function saveDraft[\s\S]{0,200}updated_at: new Date\(\)\.toISOString\(\)/.test(read('src/api/vendor/solutions/siteRoom.js')), '2.4 (a) every write of hers to the draft goes through saveDraft, which stamps updated_at');

  sec('3  she uploads photos: POST { step: \'website\' } fills TDW\'s draft, once; only the website step runs');
  st2.tables.vendor_portfolio.push(UP(0), UP(1), UP(2), UP(3));
  lat2 = await FB.latest(st2, 'v1');
  ok(() => lat2.website_can_fill === true, '3.1 (b) GET /latest: website_can_fill true once she has photos and the draft is untouched');
  const before = JSON.stringify({ pk: st2.tables.vendor_packages, about: st2.tables.vendors[0].about, steps: ['packages', 'storefront', 'eliza'].map((k) => stepOf(st2.tables.vendor_first_builds[0].steps, k)) });
  const seenBefore = Object.assign({}, d2.seen);
  const h = await door(null, st2, d2);
  const p3 = await h.call('POST', '/fb', { step: 'website' }); const g3 = await h.settle(p3.body.build_id);
  ok(() => p3.status === 200 && p3.body.build_id === lat2.build_id && p3.body.already === false && g3.body.state === 'done', '3.2 (b) 200 with the same build_id, already false; the build runs to done (waited on its state)', JSON.stringify(p3.body));
  const after = JSON.stringify({ pk: st2.tables.vendor_packages, about: st2.tables.vendors[0].about, steps: ['packages', 'storefront', 'eliza'].map((k) => stepOf(st2.tables.vendor_first_builds[0].steps, k)) });
  ok(() => before === after && d2.seen.listMedia === seenBefore.listMedia && d2.seen.fetchBio === seenBefore.fetchBio && d2.seen.seed === seenBefore.seed, '3.3 (b) only the website step ran: no Instagram read, no re-seed, About untouched, the other steps as they were');
  const dr3 = st2.tables.vendor_site_drafts[0];
  ok(() => dr3.settings.cover.length === 3 && st2.tables.vendor_looks.length === 4 && st2.tables.vendor_looks.every((l) => l.source === 'manual' && l.status === 'draft'), '3.4 her draft filled: three cover slides and four looks from her photos, each a draft, source manual');
  ok(() => stepOf(g3.body.steps, 'photos').line === 'Your portfolio has 4 photos. We used them for your website.', '3.5 (d) the photos line follows: her four photos, used', stepOf(g3.body.steps, 'photos').line);
  ok(() => !st2.tables.vendor_sites.some((x) => x.published_at), '3.6 never published');
  const lat3 = await h.call('GET', '/fb/latest');
  ok(() => lat3.body.build.website_can_fill === false, '3.7 after it filled, website_can_fill is false (the step wrote photos; she has looks)');
  const p3b = await h.call('POST', '/fb', { step: 'website' });
  ok(() => p3b.status === 409 && p3b.body.code === 'WEBSITE_HERS' && p3b.body.error === 'Your website already has your own work, so we left it as it is.', '3.8 a second POST fills nothing: 409 WEBSITE_HERS with its line', JSON.stringify(p3b.body));
  await h.close();

  sec('4  her work is never filled');
  async function untouchedWorld() { const st = world(); const d = deps(st); await build(FB, st, V('v1', 'basic'), d); st.tables.vendor_portfolio.push(UP(0), UP(1)); return { st, d }; }
  { const { st, d } = await untouchedWorld(); const dr = st.tables.vendor_site_drafts[0];
    dr.updated_at = later(dr.updated_at, 1000); dr.settings = Object.assign({}, dr.settings, { site_name: 'Her own name' });   // she edited, through saveDraft
    const r = await rerun(FB, st, V('v1', 'basic'), d); const l = await FB.latest(st, 'v1');
    ok(() => r.refused === 'WEBSITE_HERS' && l.website_can_fill === false && st.tables.vendor_site_drafts[0].settings.site_name === 'Her own name' && st.tables.vendor_looks.length === 0, '4.1 (a) she edited the draft: it is hers for good; nothing filled, her name kept', JSON.stringify(r)); }
  { const { st, d } = await untouchedWorld(); st.tables.vendor_looks.push({ id: 'L', vendor_id: 'v1', slug: 'mine', title: 'Mine', status: 'draft', source: 'manual', deleted_at: null });
    const r = await rerun(FB, st, V('v1', 'basic'), d);
    ok(() => r.refused === 'WEBSITE_HERS' && st.tables.vendor_looks.length === 1, '4.2 (a) she made a look: nothing filled'); }
  { const { st, d } = await untouchedWorld(); st.tables.vendor_sites.push({ vendor_id: 'v1', published_at: new Date().toISOString(), style: 'gallery' });
    const r = await rerun(FB, st, V('v1', 'basic'), d);
    ok(() => r.refused === 'WEBSITE_HERS' && st.tables.vendor_looks.length === 0, '4.3 (a) her site was published: nothing filled'); }
  { const { st, d } = await untouchedWorld(); st.tables.vendor_site_drafts.length = 0;   // she discarded the draft
    const r = await rerun(FB, st, V('v1', 'basic'), d);
    ok(() => r.refused === 'WEBSITE_HERS' && st.tables.vendor_site_drafts.length === 0, '4.4 (a) she discarded the draft: no draft is never TDW\'s; nothing filled'); }
  { const { st, d } = await untouchedWorld(); const b = st.tables.vendor_first_builds[0]; const w = stepOf(b.steps, 'website'); w.counts = Object.assign({}, w.counts, { cover_slides: 2 });   // the step had written photos
    const r = await rerun(FB, st, V('v1', 'basic'), d);
    ok(() => r.refused === 'WEBSITE_HERS' && st.tables.vendor_looks.length === 0, '4.5 (a) the step had written photos (looks since deleted): nothing filled again'); }
  { const st = world(); const d = deps(st); await build(FB, st, V('v1', 'basic'), d); st.tables.vendor_portfolio.push(UP(0));
    const w = stepOf(st.tables.vendor_first_builds[0].steps, 'website'); delete w.counts.draft_written_at;   // a build from before cut 26
    const r = await rerun(FB, st, V('v1', 'basic'), d);
    ok(() => r.refused === 'WEBSITE_HERS' && st.tables.vendor_looks.length === 0, '4.6 a build recorded before this cut carries no stamp: treated as hers, nothing filled'); }

  sec('5  the door\'s refusals');
  { const st = world(); const d = deps(st); const h5 = await door(null, st, d);
    const none = await h5.call('POST', '/fb', { step: 'website' }); const bad = await h5.call('POST', '/fb', { step: 'photos' });
    ok(() => none.status === 409 && none.body.code === 'NO_BUILD' && none.body.error === 'TDW has not made a website draft for you yet.', '5.1 no build yet: 409 NO_BUILD with its line', JSON.stringify(none.body));
    ok(() => bad.status === 400 && bad.body.code === 'STEP_UNKNOWN' && bad.body.error === 'That step cannot be run on its own.' && st.tables.vendor_first_builds.length === 0, '5.2 any step but website: 400 STEP_UNKNOWN; nothing starts', JSON.stringify(bad.body));
    const full = await h5.call('POST', '/fb'); await h5.settle(full.body.build_id);
    const nophotos = await h5.call('POST', '/fb', { step: 'website' });
    ok(() => full.status === 200 && full.body.already === false && nophotos.status === 409 && nophotos.body.code === 'NO_PHOTOS' && nophotos.body.error === 'Your portfolio has no photos yet, so we did not change your website.', '5.3 no body: today\'s full build; then website with no photos: 409 NO_PHOTOS', JSON.stringify(nophotos.body));
    st.tables.vendor_first_builds[0].state = 'running';
    const busy = await h5.call('POST', '/fb', { step: 'website' });
    ok(() => busy.status === 200 && busy.body.already === true && busy.body.build_id === full.body.build_id, '5.4 a build already running: its id, already true; nothing new starts');
    await h5.close(); }

  sec('6  Instagram unchanged');
  { const st = world(); const d = deps(st, { tokenFor: async () => 'tok', listMedia: async () => ({ ok: true, items: [{ media_type: 'IMAGE', media_url: CL('ig0') }] }),
      importSelected: async (sb, vid, urls) => { for (const u of urls) st.tables.vendor_portfolio.push({ id: 'p' + st.tables.vendor_portfolio.length, vendor_id: vid, image_url: u, caption: null, approval_state: 'approved', source: 'instagram', position: 0 }); return { ok: true, imported_count: urls.length }; } });
    const s = await build(FB, st, V('v1', 'basic'), d);
    ok(() => st.tables.vendor_looks.length === 1 && st.tables.vendor_looks[0].source === 'instagram' && st.tables.vendor_look_photos[0].source === 'instagram' && stepOf(s, 'photos').line === 'We added 1 of your photos.', '6.1 (c) a look from an Instagram photo is still source instagram; the photos line unchanged'); }

  sec('7  the R-47.1 lines');
  ok(() => FB.LINES.photosOwn(1, true) === 'Your portfolio has 1 photo. We used it for your website.' && FB.LINES.photosOwn(3, false) === 'Your portfolio has 3 photos.', '7.1 one photo reads "it"; photos not used are only counted');
  ok(() => FB.LINES.elizaGap(['your trade', 'your city', 'a package with a price']) === 'Add your trade, your city and a package with a price so Eliza can answer clients\' questions.' && FB.LINES.elizaGap(['your city']) === 'Add your city so Eliza can answer clients\' questions.', '7.2 Eliza\'s gaps joined with "and"');
  ok(() => FB.BASIC_OPENS.length === 4 && FB.BASIC_OPENS.every((o) => /^[A-Z].* (is|are) available on (Essential|Signature)\.$/.test(o.line) && o.line.endsWith(`available on ${o.plan}.`)), '7.4 each Basic opens line is one whole sentence that names its own plan; the plan field kept', JSON.stringify(FB.BASIC_OPENS.map((o) => o.line)));
  { const st = world({ vendor_portfolio: [UP(0)], vendor_sites: [{ vendor_id: 'v1', published_at: new Date().toISOString(), style: 'gallery' }] }); const s = await build(FB, st, V('v1', 'basic'), deps(st));
    ok(() => stepOf(s, 'website').state === 'skipped' && stepOf(s, 'photos').line === 'Your portfolio has 1 photo.', '7.3 (d) her website is hers: the photos line counts her photos and does not say they were used', stepOf(s, 'photos').line); }

  sec('8  mutations, run');
  const SRC = read('src/lib/vendor/firstBuild.js');
  const mut = (a, b) => { if (!SRC.includes(a)) throw new Error('mutation target missing: ' + a.slice(0, 60)); return load('src/lib/vendor/firstBuild.js', SRC.replace(a, b)); };
  { const M = mut('  return Number.isFinite(a) && a === b;', '  return Number.isFinite(a);');
    const st = world(); const d = deps(st); await build(M, st, V('v1', 'basic'), d); st.tables.vendor_portfolio.push(UP(0), UP(1));
    const dr = st.tables.vendor_site_drafts[0]; dr.updated_at = later(dr.updated_at, 1000); dr.settings = Object.assign({}, dr.settings, { site_name: 'Her own name' });
    await rerun(M, st, V('v1', 'basic'), d);
    ok(() => st.tables.vendor_site_drafts[0].settings.site_name !== 'Her own name', '8.1 the updated_at check removed: her edited draft is filled over (4.1 reddens)'); }
  { const M = mut("source: p.source === 'instagram' ? 'instagram' : 'manual' })", "source: 'instagram' })");
    const st = world({ vendor_portfolio: [UP(0)] }); await build(M, st, V('v1', 'basic'), deps(st));
    ok(() => st.tables.vendor_looks[0].source === 'instagram', '8.2 the look source line reverted: her uploaded photo\'s look reads instagram (1.1 reddens)'); }
  { const M = mut("    if (key === 'website') photosLineAfterWebsite(steps);\n", '');
    const st = world({ vendor_portfolio: [UP(0), UP(1)] }); const s = await build(M, st, V('v1', 'basic'), deps(st));
    ok(() => stepOf(s, 'photos').line === 'Instagram is not connected, so we added no photos.', '8.3 the photos line not reconciled: her photos read as a gap (1.3 reddens)'); }
  { const M = mut("  if ((prev.looks || 0) !== 0 || (prev.cover_slides || 0) !== 0) return false;     // that step wrote no photos\n", '');
    const st = world(); const d = deps(st); await build(M, st, V('v1', 'basic'), d); st.tables.vendor_portfolio.push(UP(0));
    const w = stepOf(st.tables.vendor_first_builds[0].steps, 'website'); w.counts = Object.assign({}, w.counts, { cover_slides: 2 });
    await rerun(M, st, V('v1', 'basic'), d);
    ok(() => st.tables.vendor_looks.length > 0, '8.4 the wrote-no-photos condition removed: a draft TDW already filled is filled again (4.5 reddens)'); }
  { const DOOR = read('src/api/vendor/firstBuild.js'); const cut = "  if (step !== undefined && step !== 'website') return errRes(res, 400, 'That step cannot be run on its own.', 'STEP_UNKNOWN');\n";
    if (!DOOR.includes(cut)) throw new Error('mutation target missing: the step allow-list');
    const st = world(); const d = deps(st); const express = require('express'); const app = express(); app.use(express.json()); app.locals.supabase = st; app.locals.firstBuildDeps = d;
    app.use((q, r, n) => { q.vendor = V('v1', 'basic'); n(); }); app.use('/fb', load('src/api/vendor/firstBuild.js', DOOR.replace(cut, '')));
    const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
    const res = await new Promise((done) => { const data = JSON.stringify({ step: 'photos' }); const rq = http.request({ host: '127.0.0.1', port: srv.address().port, path: '/fb', method: 'POST', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } }, (rs) => { let x = ''; rs.on('data', (c) => (x += c)); rs.on('end', () => done({ status: rs.statusCode })); }); rq.write(data); rq.end(); });
    await new Promise((r) => srv.close(r));
    ok(() => res.status === 200 && st.tables.vendor_first_builds.length === 1, '8.5 the step allow-list removed: { step: \'photos\' } starts a whole build (5.2 reddens)'); }

  console.log(`\nb271 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.stack || e)); console.log(`\nb271 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
