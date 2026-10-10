// scripts/ux_s1_p4_bench.js · TDW · UX-S1 P4 · WEDDING PAGES: THE DELETE DOOR AND THE PHOTO LINK.
// (a) DELETE /api/v2/vendor/studio/weddings/:id: soft, owner-scoped, the page leaves her public site at once, a second delete is 404.
// (b) DELETE .../:id/photos/:photoId removes only the link when the same picture is in her portfolio (or another page, or a look).
// No network, no database. Cloudinary's destroy is a recording stub.
'use strict';
const path = require('path'); const http = require('http');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r);
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } }
const stub = (m, exports) => { const k = require.resolve(P(m)); require.cache[k] = { id: k, filename: k, loaded: true, exports }; };
stub('src/api/middleware/requireAuth.js', (q, r, n) => n());
stub('src/api/middleware/resolveVendor.js', () => (q, r, n) => n());
const destroyed = [];
stub('src/lib/admin/cloudinary.js', { destroyVerified: async (id) => { destroyed.push(id); return { ok: true, reason: 'ok' }; } });
const { makeStore } = require('./lib/b196_store'); const express = require('express');
const CL = (n) => `https://res.cloudinary.com/tdw/image/upload/v1/weddings/${n}.jpg`;
const seed = () => ({
  weddings: [
    { id: 'w1', owner_vendor_id: 'v1', slug: 'anaya', title: 'Anaya', visibility: 'published', couple_consent: true, deleted_at: null, created_at: '2026-01-01' },
    { id: 'w2', owner_vendor_id: 'v1', slug: 'second', title: 'Second', visibility: 'draft', couple_consent: false, deleted_at: null, created_at: '2026-01-02' },
    { id: 'w9', owner_vendor_id: 'v2', slug: 'other', title: 'Other', visibility: 'published', couple_consent: true, deleted_at: null, created_at: '2026-01-03' },
  ],
  wedding_photos: [
    { id: 'p1', wedding_id: 'w1', url: CL('shared'), public_id: 'weddings/shared', position: 0 },
    { id: 'p2', wedding_id: 'w1', url: CL('only'), public_id: 'weddings/only', position: 1 },
    { id: 'p3', wedding_id: 'w1', url: CL('twice'), public_id: 'weddings/twice', position: 2 },
    { id: 'p4', wedding_id: 'w2', url: CL('twice'), public_id: 'weddings/twice', position: 0 },
    { id: 'p5', wedding_id: 'w1', url: CL('inlook'), public_id: 'weddings/inlook', position: 3 },
  ],
  vendor_portfolio: [{ id: 'f1', vendor_id: 'v1', image_url: CL('shared') }, { id: 'f2', vendor_id: 'v2', image_url: CL('only') }],
  vendor_look_photos: [{ id: 'l1', vendor_id: 'v1', look_id: 'k', image_url: CL('inlook') }],
});
(async () => {
  const router = require(P('src/api/vendor/studio/weddings.js')); const W = require(P('src/lib/vendor/weddings.js'));
  const st = makeStore(seed()); let who = { id: 'v1' };
  const app = express(); app.use(express.json()); app.locals.supabase = st; app.use((q, r, n) => { q.vendor = who; n(); }); app.use('/w', router);
  const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
  const call = (m, p, as) => new Promise((resolve) => { who = as || { id: 'v1' };
    const rq = http.request(`http://127.0.0.1:${srv.address().port}${p}`, { method: m }, (rs) => { let b = ''; rs.on('data', (d) => (b += d)); rs.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } resolve({ status: rs.statusCode, body: j }); }); });
    rq.on('error', () => resolve({ status: 0, body: null })); rq.end(); });
  const row = (id) => st.tables.weddings.find((x) => x.id === id);

  console.log('\n§1 (a) the delete door');
  const notMine = await call('DELETE', '/w/w9');
  ok(() => notMine.status === 404 && row('w9').deleted_at === null && row('w9').visibility === 'published', '1.1 a page that is not hers: 404, nothing changed');
  const d = await call('DELETE', '/w/w1');
  ok(() => d.status === 200 && d.body.deleted === true && d.body.wedding.id === 'w1', '1.2 her page: 200, deleted:true', JSON.stringify(d.body));
  ok(() => row('w1') && typeof row('w1').deleted_at === 'string' && row('w1').visibility === 'draft' && row('w1').couple_consent === true, '1.3 soft: the row stays, deleted_at is set, visibility is draft in the same write, consent untouched');
  ok(() => st.tables.wedding_photos.filter((p) => p.wedding_id === 'w1').length === 4 && destroyed.length === 0, '1.4 her photographs and the stored pictures are not touched', destroyed.join());
  const again = await call('DELETE', '/w/w1');
  ok(() => again.status === 404, '1.5 a second delete is 404');
  const list = await call('GET', '/w/');
  const ids = JSON.stringify(list.body);
  ok(() => list.status === 200 && !/"w1"/.test(ids) && /"w2"/.test(ids), '1.6 the page is out of her list; her other page stays', ids.slice(0, 160));
  const one = await call('GET', '/w/w1');
  const pub = await call('POST', '/w/w1/publish');
  ok(() => one.status === 404 && pub.status === 404, '1.7 a deleted page cannot be opened or published');
  ok(() => st.tables.weddings.filter((w) => w.visibility === 'published' && w.couple_consent === true).every((w) => w.id !== 'w1'), '1.8 no public reader can find it: it is no longer published');

  console.log('\n§2 (b) removing a photograph');
  destroyed.length = 0;
  const shared = await call('DELETE', '/w/w2/photos/p4');   // w2's copy of "twice": w1 still holds the same picture
  ok(() => shared.status === 200 && destroyed.length === 0 && shared.body.asset.kept === true && shared.body.asset.held_by === 'wedding_page' && !st.tables.wedding_photos.some((p) => p.id === 'p4'), '2.1 the same picture on another page: only the link goes, the picture is kept', JSON.stringify(shared.body));
  const row0 = await call('DELETE', '/w/w2/photos/nope');
  ok(() => row0.status === 404, '2.2 a photograph that is not on the page: 404');
  st.tables.weddings.find((x) => x.id === 'w1').deleted_at = null; st.tables.weddings.find((x) => x.id === 'w1').visibility = 'published';
  const inPortfolio = await call('DELETE', '/w/w1/photos/p1');
  ok(() => inPortfolio.status === 200 && destroyed.length === 0 && inPortfolio.body.asset.held_by === 'portfolio' && !st.tables.wedding_photos.some((p) => p.id === 'p1') && st.tables.vendor_portfolio.some((p) => p.id === 'f1'), '2.3 the same picture in her portfolio: the link goes, the picture and her portfolio row stay', JSON.stringify(inPortfolio.body));
  const inLook = await call('DELETE', '/w/w1/photos/p5');
  ok(() => inLook.status === 200 && destroyed.length === 0 && inLook.body.asset.held_by === 'look', '2.4 the same picture in one of her looks: kept');
  const lone = await call('DELETE', '/w/w1/photos/p2');   // v2's portfolio holds "only", not v1's: another vendor's portfolio does not keep it
  ok(() => lone.status === 200 && destroyed.join() === 'weddings/only' && lone.body.asset.ok === true && !lone.body.asset.kept, '2.5 a picture held nowhere else of hers is destroyed, as before (another vendor\'s portfolio does not count)', destroyed.join());
  const failing = makeStore(seed()); const realFrom = failing.from.bind(failing);
  failing.from = (t) => { if (t === 'vendor_portfolio') { return { select: () => ({ eq: () => ({ then: (res) => res({ data: null, error: { message: 'down' } }) }) }) }; } return realFrom(t); };
  destroyed.length = 0;

  console.log('\n§3 the lib');
  destroyed.length = 0;
  const held = await W.pictureHeldElsewhere(failing, { vendorId: 'v1', photo: { url: CL('only'), public_id: 'weddings/only' } });
  ok(() => held === 'unknown', '3.2 a read that fails keeps the picture (answers unknown, never destroys on doubt)', held);
  const nocolList = await W.listForOwner({ from: () => { const mk = (withIs) => ({ select: () => mk(withIs), eq: () => mk(withIs), is: () => mk(true), order: () => mk(withIs), then: (res) => res(withIs ? { data: null, error: { code: '42703', message: 'column weddings.deleted_at does not exist' } } : { data: [{ id: 'x' }], error: null }) }); return mk(false); } }, 'v1');
  ok(() => nocolList.length === 1 && nocolList[0].id === 'x', '3.1 before the migration runs the room still lists her pages (the read retries without the filter)', JSON.stringify(nocolList));
  ok(() => { for (const h of [null, undefined, 5, {}]) { W.pictureHeldElsewhere(h, h).then((x) => x); } return true; }, '3.3 the lib never throws on a bad store');
  await new Promise((r) => srv.close(r));
  console.log(`\nux_s1_p4 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`); process.exit(fail ? 1 : 0);
})();
