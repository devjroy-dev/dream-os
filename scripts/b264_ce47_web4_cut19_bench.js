// scripts/b264_ce47_web4_cut19_bench.js
// TDW · CE-47 · WEB-4 cut 19 · b264 — THE FIRST-BUILD DOOR (the chair's contract, three amendments).
// Drives src/lib/vendor/firstBuild.js on b196_store with the Instagram and seed helpers stood in, and the two doors over
// HTTP. §1 a whole build · §2 NEVER (publish, overwrite, invent) · §3 one at a time; latest · §4 a restart resumes ·
// §5 a failed step does not stop the others · §6 Basic's parts with `opens` · §7 0220 · §8 mutations, run.
// No fixed pause anywhere: the HTTP cell waits on the build's own state, bounded (e-275).
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
function world(extra) {
  return makeStore(Object.assign({ vendors: [V('v1', 'basic')], vendor_portfolio: [], vendor_sites: [], vendor_site_drafts: [], vendor_looks: [], vendor_look_photos: [], vendor_packages: [], vendor_first_builds: [] }, extra || {}));
}
function deps(st, over) {
  const d = {
    tokenFor: async () => 'tok', fetchBio: async () => 'Bridal makeup in Delhi NCR.',
    listMedia: async () => ({ ok: true, items: Array.from({ length: 24 }, (_, i) => ({ media_type: 'IMAGE', media_url: CL('ig' + i), caption: i === 0 ? 'Soft glam for Riya\nmore' : '' })) }),
    canAcceptMore: async (sb, vid) => { const held = st.tables.vendor_portfolio.filter((p) => p.vendor_id === vid).length; return { ok: true, remaining: Math.max(0, 20 - held) }; },
    importSelected: async (sb, vid, urls) => { for (const u of urls) st.tables.vendor_portfolio.push({ id: 'p' + st.tables.vendor_portfolio.length, vendor_id: vid, image_url: u, caption: null, approval_state: 'approved', source: 'instagram', position: st.tables.vendor_portfolio.length }); return { ok: true, imported_count: urls.length }; },
    ensureSeeded: async (sb, vendor) => { if (st.tables.vendor_packages.some((p) => p.vendor_id === vendor.id)) return { seeded: false, reason: 'already_seeded' }; for (const [i, n] of ['One function', 'Every function, with a trial', 'Wedding party makeup'].entries()) st.tables.vendor_packages.push({ id: 'k' + i, vendor_id: vendor.id, name: n, total: 20000 + i, seeded_from: 'makeup:' + (i + 1), deleted_at: null }); return { seeded: true, count: 3 }; },
  };
  return Object.assign(d, over || {});
}
const stepOf = (steps, k) => steps.find((s) => s.key === k);
// start() launches the build itself (not awaited, as the door does); the bench awaits THAT run, never a second one.
async function build(mod, st, vendor, d) { let job = null; const r = await mod.start(st, vendor, Object.assign({}, d, { onRun: (j) => { job = j; } })); return job ? await job : (await mod.read(st, vendor.id, r.build_id)).steps; }

(async () => {
  sec('1  a whole build, Basic makeup artist with nothing yet');
  let st = world(); const s1 = await build(FB, st, V('v1', 'basic'), deps(st));
  const row = st.tables.vendor_first_builds[0];
  ok(() => JSON.stringify(s1.map((s) => [s.key, s.state])) === '[["photos","done"],["website","done"],["packages","done"],["storefront","done"],["eliza","done"]]' && row.state === 'done', '1.1 the five steps in order, each done; the build done', JSON.stringify(s1.map((s) => [s.key, s.state])));
  ok(() => stepOf(s1, 'photos').line === 'We added 20 of your photos. 4 more did not fit.' && stepOf(s1, 'photos').counts.imported === 20 && stepOf(s1, 'photos').counts.no_room === 4, '1.2 N = min(20, her room); what did not fit is said in the line (amendment 3)', stepOf(s1, 'photos').line);
  const dr = st.tables.vendor_site_drafts[0] || {};
  ok(() => dr.settings && dr.settings.style === 'gallery' && JSON.stringify(dr.settings.styles_picked) === '["gallery"]' && dr.settings.palette_id === null && dr.settings.font_pair === null && dr.settings.site_name === 'Swati Roy Makeup' && dr.settings.cover.length === 3, '1.3 her DRAFT: the ONE neutral style written explicitly (gallery, picked), its default palette and pairing, her name, three cover slides');
  // r2 (the chair's correction): a style is never tied to a profession. Every trade's draft gets the same style.
  { const got = []; for (const cat of ['photography', 'makeup', 'designer', 'decor', 'performer', 'other', 'planning']) { const w = world({ vendors: [V('v1', 'basic', { category: cat })] }); await FB.STEPS.website(w, V('v1', 'basic', { category: cat })); got.push(w.tables.vendor_site_drafts[0].settings.style); }
    ok(() => got.every((x) => x === 'gallery') && FB.NEUTRAL_STYLE === 'gallery' && !/STYLE_BY_TRADE|vendor\.category\]/.test(read('src/lib/vendor/firstBuild.js')), '1.3b the website step\'s style does not vary with her trade (seven trades, all gallery); no trade-to-style map in the code', got.join()); }
  ok(() => st.tables.vendor_looks.length === 12 && st.tables.vendor_looks.every((l) => l.status === 'draft' && l.source === 'instagram') && st.tables.vendor_looks[0].title === 'Look 1' && st.tables.vendor_looks[11].title === 'Look 12' && st.tables.vendor_look_photos.every((p) => p.source === 'instagram'), '1.4 twelve looks, status draft, from her photos (titled "Look N": the import carries no caption, and nothing is invented); their photos marked instagram');
  ok(() => stepOf(s1, 'packages').line === 'We added 3 starter packages.' && stepOf(s1, 'storefront').line === 'We filled in your About from your Instagram bio.' && st.tables.vendors[0].about === 'Bridal makeup in Delhi NCR.' && stepOf(s1, 'eliza').line === 'Eliza knows your packages and prices.', '1.5 packages seeded; her empty About filled from her bio; Eliza\'s inputs present; the contract\'s plain lines');

  sec('2  NEVER: publish, overwrite, invent');
  ok(() => !st.tables.vendor_sites.some((x) => x.published_at) && !(st.rpcCalls || []).some((c) => /publish/.test(c)) && st.tables.vendor_looks.every((l) => l.status !== 'published'), '2.1 nothing published: no live site row, no publish call, every look a draft');
  let st2 = world({ vendors: [V('v1', 'essential', { about: 'Her own words.' })], vendor_site_drafts: [{ vendor_id: 'v1', settings: { style: 'noir' }, sections: [], pages: [] }], vendor_packages: [{ id: 'own', vendor_id: 'v1', name: 'Mine', total: 9000, deleted_at: null }] });
  const s2 = await build(FB, st2, V('v1', 'essential'), deps(st2));
  ok(() => st2.tables.vendors[0].about === 'Her own words.' && st2.tables.vendor_site_drafts[0].settings.style === 'noir' && st2.tables.vendor_looks.length === 0 && st2.tables.vendor_packages.length === 1, '2.2 a field she filled is never overwritten: her About, her draft\'s style, her packages; no looks made over her work');
  ok(() => ['website', 'packages', 'storefront'].every((k) => stepOf(s2, k).state === 'skipped' && typeof stepOf(s2, k).line === 'string' && stepOf(s2, k).line.length > 0), '2.3 each kept step is SKIPPED with a plain line from the server (amendment 2)', JSON.stringify(s2.map((s) => [s.key, s.state, s.line])));
  const st3 = world({ vendors: [V('v1', 'basic', { city: null })] });
  const bioless = deps(st3, { fetchBio: async () => null });
  const s3 = await build(FB, st3, V('v1', 'basic'), bioless);
  ok(() => stepOf(s3, 'storefront').state === 'skipped' && stepOf(s3, 'storefront').line === 'Your Instagram has no bio, so we left your About empty.' && st3.tables.vendors[0].about === null, '2.4 no bio: "Your Instagram has no bio, so we left your About empty.", nothing filled (never a guess)');
  ok(() => stepOf(s3, 'eliza').line === 'Add your city so Eliza can answer clients\' questions.', '2.5 Eliza\'s gap named plainly; nothing invented', stepOf(s3, 'eliza').line);
  const before = JSON.stringify(st.tables); const sEl = world({ vendor_packages: [{ id: 'k', vendor_id: 'v1', total: 100, deleted_at: null }] }); const snap = JSON.stringify(sEl.tables);
  await FB.STEPS.eliza(sEl, V('v1', 'basic'));
  ok(() => JSON.stringify(sEl.tables) === snap && before.length > 0, '2.6 the Eliza step writes NO row (ruling 2)');

  sec('3  one at a time; latest');
  const st4 = world(); let job4 = null; const d4 = Object.assign(deps(st4), { onRun: (j) => { job4 = job4 || j; } });
  const a = await FB.start(st4, V('v1', 'basic'), d4); const b = await FB.start(st4, V('v1', 'basic'), d4);
  ok(() => a.build_id && a.build_id === b.build_id && b.already === true && st4.tables.vendor_first_builds.length === 1, '3.1 a second POST while one runs returns the same build_id');
  ok(() => /CREATE UNIQUE INDEX vendor_first_builds_one_running ON public\.vendor_first_builds \(vendor_id\) WHERE state = 'running';/.test(read('db/migrations/0220_vendor_first_builds.sql')), '3.2 and the database holds one running build per vendor (the unique index)');
  await job4;
  const L = await FB.latest(st4, 'v1');
  ok(() => L && L.build_id === a.build_id && L.state === 'done' && L.site_ready === true, '3.3 GET latest: her most recent build, done, site_ready (Home: "Your business is ready to check")');

  sec('4  a restart resumes from the last finished step');
  const st5 = world(); let imports = 0; const d5 = deps(st5); const imp = d5.importSelected; d5.importSelected = async (...x) => { imports += 1; return imp(...x); };
  st5.tables.vendor_first_builds.push({ id: 'b-5', vendor_id: 'v1', state: 'running', steps: [] }); const id5 = 'b-5';
  await FB.STEPS.photos(st5, V('v1', 'basic'), d5); imports = 0;
  const r5 = st5.tables.vendor_first_builds[0]; r5.steps = FB.freshSteps(); r5.steps[0] = Object.assign(r5.steps[0], { state: 'done', line: 'We added 20 of your photos.', counts: { imported: 20, no_room: 4 } }); r5.steps[1].state = 'running';
  const s5 = await FB.run(st5, V('v1', 'basic'), id5, d5);
  ok(() => imports === 0 && stepOf(s5, 'photos').line === 'We added 20 of your photos.' && stepOf(s5, 'website').state === 'done' && st5.tables.vendor_first_builds[0].state === 'done', '4.1 a build stopped mid-website: the photos are not imported again; it resumes at the website and finishes');

  sec('5  a failed step does not stop the independent ones');
  const st6 = world(); const d6 = deps(st6, { listMedia: async () => { throw new Error('Meta down'); } });
  const s6 = await build(FB, st6, V('v1', 'basic'), d6);
  ok(() => stepOf(s6, 'photos').state === 'failed' && stepOf(s6, 'photos').line === 'TDW could not finish this step. You can fill in this part yourself.' && stepOf(s6, 'packages').state === 'done' && stepOf(s6, 'storefront').state === 'done' && stepOf(s6, 'eliza').state === 'done' && st6.tables.vendor_first_builds[0].state === 'failed', '5.1 photos failed (Meta down): packages, storefront and Eliza still ran; the build reads failed, each step its own line', JSON.stringify(s6.map((s) => [s.key, s.state])));

  sec('6  Basic: parts of a step, with the plan that opens them (amendment 1)');
  const w = stepOf(s1, 'website');
  ok(() => Array.isArray(w.opens) && JSON.stringify(w.opens) === JSON.stringify(FB.BASIC_OPENS) && w.opens.some((o) => o.line === 'More styles, colour sets and font pairings are available on Essential.' && o.plan === 'Essential') && s1.every((s) => s.state !== 'skipped' || s.key !== 'website'), '6.1 on Basic the DONE website step carries opens [{ line, plan }]; no whole step is skipped for her plan');
  ok(() => stepOf(s2, 'website').opens === null, '6.2 on Essential, no opens on the website step');

  sec('6b  no Instagram connected (cut 21, amended by label): a whole build, nothing failed');
  const stN = world(); const dN = deps(stN, { tokenFor: async () => null });
  const sN = await build(FB, stN, V('v1', 'basic'), dN);
  ok(() => stepOf(sN, 'photos').state === 'skipped' && stepOf(sN, 'photos').line === 'Instagram is not connected, so we added no photos.' && JSON.stringify(stepOf(sN, 'photos').counts) === '{"imported":0,"no_room":0}', '6b.1 photos: skipped, not failed, "Instagram is not connected, so we added no photos."', JSON.stringify(stepOf(sN, 'photos')));
  ok(() => stepOf(sN, 'storefront').state === 'skipped' && stepOf(sN, 'storefront').line === 'Instagram is not connected, so we left your About empty.' && stN.tables.vendors[0].about === null, '6b.2 storefront: "Instagram is not connected, so we left your About empty."; nothing filled');
  ok(() => stepOf(sN, 'website').state === 'done' && stepOf(sN, 'website').line === 'Your website draft is ready to check. It has no photos yet.' && stN.tables.vendor_site_drafts.length === 1 && stN.tables.vendor_looks.length === 0, '6b.3 website: her draft built from what her portfolio holds (nothing), the line says so plainly');
  ok(() => !sN.some((x) => x.state === 'failed') && sN.filter((x) => x.state === 'skipped').every((x) => typeof x.line === 'string' && x.line.length > 0) && stN.tables.vendor_first_builds[0].state === 'done' && !stN.tables.vendor_sites.some((x) => x.published_at) && stN.tables.vendor_looks.every((l) => l.status !== 'published'), '6b.4 the whole no-Instagram build: no step failed, every skipped step has a line, the build done, nothing published', JSON.stringify(sN.map((x) => [x.key, x.state])));
  ok(() => stepOf(s3, 'storefront').line === 'Your Instagram has no bio, so we left your About empty.', '6b.5 a connected account with an empty bio keeps "Your Instagram has no bio, so we left your About empty."');

  sec('7  the doors over HTTP, and 0220');
  const st7 = world(); const express = require('express'); const app = express(); app.use(express.json()); app.locals.supabase = st7; app.locals.firstBuildDeps = deps(st7);
  app.use((q, r, n) => { q.vendor = V('v1', 'basic'); n(); }); app.use('/fb', load('src/api/vendor/firstBuild.js'));
  const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
  const call = (m, p) => new Promise((res) => { const rq = http.request({ host: '127.0.0.1', port: srv.address().port, path: p, method: m }, (rs) => { let x = ''; rs.on('data', (c) => (x += c)); rs.on('end', () => res({ status: rs.statusCode, body: JSON.parse(x || '{}') })); }); rq.end(); });
  const p1 = await call('POST', '/fb'); let g; const t0 = Date.now();
  do { g = await call('GET', '/fb/' + p1.body.build_id); if (g.body.state !== 'running') break; await new Promise((r) => setImmediate(r)); } while (Date.now() - t0 < 10000);
  const lat = await call('GET', '/fb/latest'); const miss = await call('GET', '/fb/00000000-0000-4000-8000-000000000000');
  await new Promise((r) => srv.close(r));
  ok(() => p1.status === 200 && g.body.state === 'done' && g.body.steps.length === 5 && lat.body.build.build_id === p1.body.build_id && miss.status === 404, '7.1 POST answers a build_id; GET reports it to done (waited on its state, bounded); /latest finds it; another id is 404', `${p1.status} ${g.body.state}`);
  const SQL = read('db/migrations/0220_vendor_first_builds.sql').split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
  ok(() => /CREATE TABLE public\.vendor_first_builds/.test(SQL) && /ENABLE ROW LEVEL SECURITY/.test(SQL) && /GRANT SELECT, INSERT, UPDATE, DELETE ON public\.vendor_first_builds TO service_role;/.test(SQL) && /^BEGIN;$/m.test(SQL) && /^COMMIT;$/m.test(SQL), '7.2 0220: the table, RLS and grants in one transaction (e-273)');
  ok(() => /router\.use\('\/first-build', require\('\.\/firstBuild'\)\);/.test(read('src/api/vendor/core.js')), '7.3 mounted at /api/v2/vendor/first-build (one line in core.js)');

  sec('8  mutations, run');
  const SRC = read('src/lib/vendor/firstBuild.js');
  const M1 = load('src/lib/vendor/firstBuild.js', SRC.replace("insert({ vendor_id: vendor.id, slug, title, status: 'draft', source: p.source === 'instagram' ? 'instagram' : 'manual' })", "insert({ vendor_id: vendor.id, slug, title, status: 'published', source: p.source === 'instagram' ? 'instagram' : 'manual' })"));
  const st8 = world(); await build(M1, st8, V('v1', 'basic'), deps(st8));
  ok(() => st8.tables.vendor_looks.some((l) => l.status === 'published'), '8.1 looks written published: 2.1 reddens');
  const M2 = load('src/lib/vendor/firstBuild.js', SRC.replace("    if (v && !blank(v.about)) return { state: 'skipped', line: LINES.storefrontKept, counts: { filled: 0 } };\n", ''));
  const st9 = world({ vendors: [V('v1', 'essential', { about: 'Her own words.' })] }); await build(M2, st9, V('v1', 'essential'), deps(st9));
  ok(() => st9.tables.vendors[0].about !== 'Her own words.', '8.2 the filled-About check removed: her words are overwritten (2.2 reddens)');
  const M3 = load('src/lib/vendor/firstBuild.js', SRC.replace("  if (running) return { build_id: running.id, already: true };\n", ''));
  const st10 = world(); const d10 = Object.assign(deps(st10), { onRun: () => {} }); const a10 = await M3.start(st10, V('v1', 'basic'), d10); const b10 = await M3.start(st10, V('v1', 'basic'), d10);
  ok(() => a10.build_id !== b10.build_id || st10.tables.vendor_first_builds.length > 1, '8.3 the running check removed: a second POST starts a second build (3.1 reddens; only the database index would stop it)');

  console.log(`\nb264 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.stack || e)); console.log(`\nb264 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
