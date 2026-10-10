// scripts/ux_s1_p3_bench.js · TDW · UX-S1 P3 · THE STYLE PREVIEW WITH TDW'S EXAMPLE PICTURES.
// A verified preview token AND examples=1 AND no pictures of her own: the card is drawn with the four example pictures, each marked TDW.
// Anything else (no token, another vendor's token, no examples=1, pictures of her own): unchanged. No network, no database.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r);
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } }
for (const m of ['src/api/middleware/requireAuth.js', 'src/api/middleware/resolveVendor.js']) {
  try { const k = require.resolve(P(m)); require.cache[k] = { id: k, filename: k, loaded: true, exports: m.endsWith('resolveVendor.js') ? () => (q, r, n) => n() : (q, r, n) => n() }; } catch { /* */ }
}
const { makeStore } = require('./lib/b196_store');
const express = require('express');
const EX = require(P('src/lib/site/examples.js')); const PV = require(P('src/lib/site/preview.js'));
const VEN = (id, tier) => ({ id, business_name: 'Studio ' + id, category: 'makeup', city: 'Delhi', routing_handle: id.toUpperCase(), status: 'active', discover_paused: false, date_check_enabled: true, about: 'About', rate_min: 40000, rate_display: true, tier });
const CL = (n) => `https://res.cloudinary.com/tdw/image/upload/pub1/${n}.jpg`;
const seed = () => ({
  vendors: [VEN('sig1', 'signature'), VEN('pub1', 'signature')],
  vendor_sites: [{ vendor_id: 'pub1', published_at: '2026-09-30T00:00:00Z', style: 'noir', styles_picked: ['noir'] }, { vendor_id: 'sig1', published_at: '2026-09-30T00:00:00Z', style: 'noir', styles_picked: ['noir'] }],
  vendor_looks: [{ id: 'lk1', vendor_id: 'pub1', slug: 'emerald', title: 'Emerald', status: 'published', published_at: '2026-09-01T00:00:00Z', position: 0, deleted_at: null }],
  vendor_look_photos: [{ id: 'f1', look_id: 'lk1', vendor_id: 'pub1', image_url: CL('one'), approval_state: 'approved', position: 0, deleted_at: null }],
});
(async () => {
  const VC = require(P('src/api/public/vendorCard.js'));
  const st = makeStore(seed());
  const app = express(); app.use(express.json()); app.locals.supabase = st; app.set('trust proxy', true); app.use('/card', VC);
  const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
  const get = (p) => new Promise((resolve) => http.get(`http://127.0.0.1:${srv.address().port}${p}`, (rs) => { let b = ''; rs.on('data', (d) => (b += d)); rs.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } resolve({ status: rs.statusCode, body: j, headers: rs.headers }); }); }));
  const q = (t) => encodeURIComponent(typeof t === 'string' ? t : t.token);
  const urls = (c) => [].concat(...c.card.looks.map((l) => [l.cover && l.cover.url, l.second && l.second.url].filter(Boolean)));
  const withEx = await get('/card/sig1?preview=' + q(PV.issue('sig1')) + '&examples=1');
  ok(() => withEx.status === 200 && withEx.body.card.looks.length === 1 && urls(withEx.body).length === 2 && urls(withEx.body).every((u) => /\/examples\/ads\/example-(portrait|couple)\.jpg$/.test(u)), '1.1 verified token + examples=1 + no pictures of her own: the page is drawn with the example pictures', JSON.stringify(withEx.body && withEx.body.card.looks));
  ok(() => withEx.body.card.looks[0].cover.example === true && withEx.body.card.looks[0].cover.mark === 'TDW' && withEx.body.card.looks[0].second.mark === 'TDW', '1.2 each example picture carries example:true and the mark "TDW"');
  const plain = await get('/card/sig1?preview=' + q(PV.issue('sig1')));
  ok(() => plain.status === 200 && plain.body.card.looks.length === 0, '2.1 verified token without examples=1: no example pictures');
  const none = await get('/card/sig1?examples=1');
  ok(() => none.status === 200 && none.body.card.looks.length === 0 && JSON.stringify(none.body).indexOf('/examples/') < 0, '2.2 examples=1 without a token: a public page never shows them');
  const other = await get('/card/sig1?examples=1&preview=' + q(PV.issue('pub1')));
  ok(() => other.status === 200 && other.body.card.looks.length === 0 && JSON.stringify(other.body).indexOf('/examples/') < 0, '2.3 examples=1 with another vendor\'s token: none');
  const bad = await get('/card/sig1?examples=1&preview=' + q('x' + PV.issue('sig1').token));
  ok(() => bad.status === 200 && JSON.stringify(bad.body).indexOf('/examples/') < 0, '2.4 examples=1 with a tampered token: none');
  const own = await get('/card/pub1?preview=' + q(PV.issue('pub1')) + '&examples=1');
  ok(() => own.status === 200 && own.body.card.looks.length === 1 && own.body.card.looks[0].slug === 'emerald' && JSON.stringify(own.body).indexOf('/examples/') < 0, '3.1 a vendor with pictures of her own keeps them; no example is added');
  ok(() => EX.standIns('https://x.in', [{ id: 'p' }], []) === null && EX.standIns('https://x.in', [], [{ id: 'a', deleted_at: '2026-01-01' }]) !== null && EX.standIns('https://x.in/', [], []).portfolio.map((r) => r.image_url).join() === ['portrait', 'couple', 'hands', 'bouquet'].map((n) => `https://x.in/examples/ads/example-${n}.jpg`).join(), '4.1 the four pictures, in the app\'s order, on the given origin; none when she has her own');
  ok(() => { for (const h of [null, undefined, 5, {}, [], Symbol('x')]) { try { EX.standIns(h, h, h); EX.hasOwnPictures(h, h); EX.portfolioRows(h); } catch { return false; } } return true; }, '4.2 the module never throws');
  const VCs = fs.readFileSync(P('src/api/public/vendorCard.js'), 'utf8');
  ok(() => /if \(styles && previewOn && req\.query\.examples === '1'\)/.test(VCs), '5.1 the only gate in the door is previewOn and examples=1');
  await new Promise((r) => srv.close(r));
  console.log(`\nux_s1_p3 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`); process.exit(fail ? 1 : 0);
})();
