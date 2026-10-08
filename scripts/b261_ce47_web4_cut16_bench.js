// scripts/b261_ce47_web4_cut16_bench.js
// TDW · CE-47 · WEB-4 cut 16 · b261 — BASIC'S ONE FREE STYLE (the founder; the chair's rulings 1 to 5, 6 October 2026).
// §1 the model (a b c g) · §2 the room open to Basic, each lock refused by name (f) · §3 the 30-day clock (e, ruling 2) ·
// §4 the public card and the site-kind door (d) · §5 her own domain on Signature · §6 0195 and the register ·
// §7 mutations, run. The room and card are driven over HTTP on b196_store, as b198 drives them.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const Module = require('module');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => { try { return fs.readFileSync(P(r), 'utf8'); } catch { return ''; } };
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
function load(r, src) { try { const m = new Module(P(r), module); m.filename = P(r); m.paths = Module._nodeModulePaths(path.dirname(P(r))); m._compile(src === undefined ? read(r) : src, P(r)); return m.exports; } catch { return null; } }
const { makeStore } = require('./lib/b196_store');
const express = require('express');
for (const m of ['src/api/middleware/requireAuth.js', 'src/api/middleware/resolveVendor.js']) {
  const k = require.resolve(P(m)); require.cache[k] = { id: k, filename: k, loaded: true, exports: m.endsWith('resolveVendor.js') ? () => (q, r, n) => n() : (q, r, n) => n() };
}
const DAY = 86400000;
const VEN = (id, tier, extra) => Object.assign({ id, business_name: 'Studio ' + id, category: 'makeup', city: 'Delhi', routing_handle: id.toUpperCase(), status: 'active', discover_paused: false, tier }, extra || {});
const CL = (n) => `https://res.cloudinary.com/tdw/image/upload/b1/${n}.jpg`;
const publishStandIn = (t, a) => {
  const d = (t.vendor_site_drafts || []).find((x) => x.vendor_id === a.p_vendor); if (!d) return { data: null, error: null };
  t.vendor_sites = t.vendor_sites || []; let row = t.vendor_sites.find((x) => x.vendor_id === a.p_vendor);
  if (!row) { row = { vendor_id: a.p_vendor }; t.vendor_sites.push(row); }
  const at = new Date().toISOString(); Object.assign(row, d.settings || {}, { published_at: at });
  t.vendor_site_drafts = t.vendor_site_drafts.filter((x) => x.vendor_id !== a.p_vendor);
  return { data: at, error: null };
};
async function server(store, parts) {
  const app = express(); app.use(express.json()); app.locals.supabase = store;
  let who = null; app.use((q, r, n) => { q.vendor = who; n(); });
  for (const [k, v] of Object.entries(parts)) if (v) app.use(k, v);
  const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
  const call = (m, p, body, as) => new Promise((resolve) => { who = as || null;
    const rq = http.request(`http://127.0.0.1:${srv.address().port}${p}`, { method: m, headers: { 'content-type': 'application/json' } }, (rs) => {
      let b = ''; rs.on('data', (d) => (b += d)); rs.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } resolve({ status: rs.statusCode, body: j, raw: b }); }); });
    rq.on('error', () => resolve({ status: 0, raw: '' })); if (body !== undefined) rq.write(JSON.stringify(body)); rq.end(); });
  return { call, close: () => new Promise((r) => srv.close(r)) };
}

(async () => {
  const M = load('src/lib/site/siteModel.js');
  sec('1  the model: one style, its defaults, Basic\'s sections, the locks named');
  const site = { style: 'noir', styles_picked: ['noir', 'heritage'], palette_id: 'noir.wine', font_pair: 'not-default', copy: {} };
  const b = M.resolveSite({ tier: 'basic', category: 'makeup', businessName: 'Swati Roy', site });
  ok(() => M.STYLE_ALLOWANCE.basic === 1 && b.v === 'styles' && JSON.stringify(b.styles_open) === '["noir"]' && b.can.styles === 1, '1.1 (a) Basic holds one style: the one in use; styles 1');
  const offered0 = require(P('src/lib/site/styles.js')).STYLES.noir.pairs[0];
  ok(() => b.palette.id === require(P('src/lib/site/styles.js')).palettesOf('noir')[0].id && b.palette.custom === false && b.font_pair.id === offered0, '1.2 (b) her palette and font pairing are her style\'s defaults, whatever is stored');
  const secs = (t) => M.sectionsFor(t, []).filter((x) => x.allowed).map((x) => x.key).join();
  ok(() => secs('basic') === 'cover,looks,band,pricing,studio,faq,enquire', '1.3 (c, ruling 1) Basic\'s sections: cover, looks, band, pricing, studio, faq, enquire', secs('basic'));
  const locked = M.sectionsFor('basic', []).filter((x) => !x.allowed);
  ok(() => JSON.stringify(locked.map((x) => [x.key, x.opens])) === '[["collections","Signature"],["reviews","Essential"],["journal","Signature"]]', '1.4 (g) each locked section names the plan that opens it', JSON.stringify(locked.map((x) => [x.key, x.opens])));
  const o = b.can.opens;
  ok(() => o.palettes === 'Essential' && o.font_pairs === 'Essential' && o.more_styles === 'Essential' && o.own_domain === 'Signature' && o.credit_removable === 'Prestige' && o.custom_palette === 'Signature' && o.written_testimonials === 'Essential', '1.5 (g) `opens`: every locked item with its plan (palettes and pairings Essential, own domain Signature, the line Prestige)');
  ok(() => Object.keys(M.capabilitiesFor('prestige').opens).length === 0 && M.capabilitiesFor('signature').opens.more_styles === 'Prestige' && M.capabilitiesFor('essential').palettes === true, '1.6 nothing locked on Prestige; each plan names the next for more styles');
  ok(() => { const e = M.resolveSite({ tier: 'essential', category: 'makeup', businessName: 'S', site }); return e.palette.id === 'noir.wine' && e.styles_open.length === 2; }, '1.7 Essential unchanged: her chosen palette, two styles');

  sec('2  the room, open to Basic; each lock refused by name with its plan');
  const seed = () => ({ vendors: [VEN('basic1', 'basic'), VEN('basic2', 'basic'), VEN('ess1', 'essential'), VEN('sig1', 'signature')],
    vendor_sites: [{ vendor_id: 'basic2', published_at: new Date(Date.now() - 40 * DAY).toISOString(), style: 'noir', styles_picked: ['noir'], style_changed_at: new Date(Date.now() - 5 * DAY).toISOString() }],
    vendor_looks: [], vendor_look_photos: [], vendor_testimonials: [], vendor_site_sections: [], vendor_domains: [] });
  const st = makeStore(seed()); st.rpcs.site_publish_draft = publishStandIn;
  const SITE = load('src/api/vendor/solutions/site.js'); const VC = load('src/api/public/vendorCard.js'); const KIND = load('src/api/public/siteKind.js');
  const S = await server(st, { '/site': SITE, '/card': VC, '/kind': KIND });
  const ven = (id) => st.tables.vendors.find((x) => x.id === id);
  const r0 = await S.call('GET', '/site/room', undefined, ven('basic1'));
  ok(() => r0.status === 200 && r0.body.room.resolved.v === 'styles' && r0.body.room.resolved.can.styles === 1 && r0.body.room.preview, '2.1 Basic\'s room opens (was 403): her one-style site, its flags and a preview');
  const set = (body, id) => S.call('PATCH', '/site/settings', body, ven(id || 'basic1'));
  const two = await set({ styles_picked: ['noir', 'heritage'] });
  const pal = await set({ style: 'noir', palette_id: 'noir.wine' });
  const fnt = await set({ style: 'noir', font_pair: require(P('src/lib/site/styles.js')).STYLES.noir.pairs[1] });
  const cred = await set({ credit_shown: false });
  const own = await set({ palette_custom: { accent: '#aa3344' } });
  ok(() => two.status === 400 && /Basic includes one style\. More styles are available on Essential\./.test(two.raw), '2.2 a second style: "Basic includes one style. More styles are available on Essential."', two.raw);
  ok(() => pal.status === 400 && /Colour sets are available on Essential\./.test(pal.raw) && own.status === 400 && /Colour sets are available on Essential\./.test(own.raw), '2.3 another palette, or her own colour: "Colour sets are available on Essential."');
  ok(() => fnt.status === 400 && /Font pairings are available on Essential\./.test(fnt.raw), '2.4 another font pairing: "Font pairings are available on Essential."');
  ok(() => cred.status === 400 && /Removing the TDW line at the bottom of your site is available on Prestige\./.test(cred.raw), '2.5 removing the line below Prestige: refused, naming Prestige');
  const okStyle = await set({ style: 'heritage' });
  ok(() => okStyle.status === 200 && st.tables.vendor_site_drafts.find((x) => x.vendor_id === 'basic1').settings.style === 'heritage', '2.6 choosing her one style (and changing it in her draft before her first Publish) is free');
  const pub = await S.call('POST', '/site/publish', undefined, ven('basic1'));
  ok(() => pub.status === 200 && st.tables.vendor_sites.find((x) => x.vendor_id === 'basic1').published_at && !st.tables.vendor_sites.find((x) => x.vendor_id === 'basic1').style_changed_at, '2.7 (d) Publish is allowed on Basic; her FIRST published style starts no clock');
  const rv = await S.call('POST', '/site/testimonials/requests', { name: 'A' }, ven('basic1')); const vis = await S.call('GET', '/site/visitors', undefined, ven('basic1'));
  ok(() => rv.status === 403 && /Client reviews are available on Essential\./.test(rv.raw) && vis.status === 403 && /Visitor counts are available on Essential\./.test(vis.raw), '2.8 still Essential\'s: review requests and visitor counts, each refused by name');

  sec('3  the 30-day style clock (Basic; ruling 2)');
  const c1 = await set({ style: 'heritage' }, 'basic2');
  ok(() => c1.status === 400 && /^You can change your style once every 30 days\. You can change it again on \d{1,2} [A-Z][a-z]+\.$/.test(c1.body && c1.body.error), '3.1 inside 30 days of her last change: the settings door refuses with the date (day and month)', c1.raw);
  const rm = await S.call('GET', '/site/room', undefined, ven('basic2'));
  const clk = rm.body && rm.body.room.style_clock;
  ok(() => clk && clk.locked === true && /^\d{4}-\d{2}-\d{2}$/.test(clk.last_changed_on) && /^\d{4}-\d{2}-\d{2}$/.test(clk.next_change_on) && /^\d{1,2} [A-Z][a-z]+$/.test(clk.next_change_words) && c1.body.error.includes(clk.next_change_words), '3.2 the room gives both dates (her last change, the day she next can) and the refusal uses the same words', JSON.stringify(clk));
  const same = await set({ style: 'noir', motion: 'calm' }, 'basic2');
  ok(() => same.status === 200, '3.3 keeping her published style is never refused');
  st.tables.vendor_site_drafts = (st.tables.vendor_site_drafts || []).filter((x) => x.vendor_id !== 'basic2');
  st.tables.vendor_site_drafts.push({ vendor_id: 'basic2', settings: { style: 'heritage' }, sections: [], pages: [] });
  const pb = await S.call('POST', '/site/publish', undefined, ven('basic2'));
  ok(() => pb.status === 400 && /You can change your style once every 30 days\./.test(pb.raw) && st.tables.vendor_sites.find((x) => x.vendor_id === 'basic2').style === 'noir', '3.4 Publish refuses too (the backstop); her live style is unchanged');
  st.tables.vendor_sites.find((x) => x.vendor_id === 'basic2').style_changed_at = new Date(Date.now() - 31 * DAY).toISOString();
  const pb2 = await S.call('POST', '/site/publish', undefined, ven('basic2'));
  const row2 = st.tables.vendor_sites.find((x) => x.vendor_id === 'basic2');
  ok(() => pb2.status === 200 && row2.style === 'heritage' && Date.now() - Date.parse(row2.style_changed_at) < 60000, '3.5 after 30 days: the change publishes, and the clock starts again at Publish');
  const e1 = await set({ style: 'heritage' }, 'ess1');
  ok(() => e1.status === 200, '3.6 the clock binds Basic only');

  sec('4  (d) the public card and the site-kind door');
  const k1 = await S.call('GET', '/kind/basic1'); const kd = await S.call('GET', '/kind/basic2');
  ok(() => k1.status === 200 && k1.body.v === 'styles' && kd.body.v === 'styles', '4.1 a published Basic vendor is a styles site to the switch', k1.raw);
  const cc = await S.call('GET', '/card/basic1');
  ok(() => cc.status === 200 && cc.body.card.site.v === 'styles' && cc.body.card.site.style === 'heritage', '4.2 her public card draws her one style', cc.raw && cc.raw.slice(0, 160));
  st.tables.vendors.push(VEN('basic3', 'basic'));
  const k3 = await S.call('GET', '/kind/basic3'); const c3 = await S.call('GET', '/card/basic3');
  ok(() => k3.body.v === 'classic' && c3.body.card.site.v === 'classic', '4.3 an unpublished Basic site stays the classic page');
  await S.close();

  sec('5  her own domain opens on Signature');
  const D = load('src/api/vendor/solutions/domain.js'); const sd = makeStore(seed());
  const DS = await server(sd, { '/dom': D });
  const d1 = await DS.call('POST', '/dom/order', { domain: 'swati.in' }, VEN('basic1', 'basic')); const d2 = await DS.call('POST', '/dom/wire', { domain: 'swati.in' }, VEN('ess1', 'essential'));
  await DS.close();
  ok(() => d1.status === 403 && /Your own domain is available on Signature\./.test(d1.raw) && d2.status === 403 && /Your own domain is available on Signature\./.test(d2.raw), '5.1 ordering or wiring her own domain below Signature: "Your own domain is available on Signature."');

  sec('6  0195 and the out-of-order register');
  const SQL = read('db/migrations/0195_basic_style_and_photo_source.sql').split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
  ok(() => /ALTER TABLE public\.vendor_sites\s+ADD COLUMN style_changed_at timestamptz;/.test(SQL) && /ALTER TABLE public\.vendor_portfolio\s+ADD COLUMN source text NOT NULL DEFAULT 'upload';/.test(SQL) && /ALTER TABLE public\.vendor_look_photos ADD COLUMN source text NOT NULL DEFAULT 'upload';/.test(SQL), '6.1 0195: style_changed_at, and the two source columns (upload by default)');
  ok(() => (SQL.match(/CHECK \(source IN \('upload', 'instagram'\)\)/g) || []).length === 2 && !/CREATE TABLE|UPDATE |DELETE |DROP /.test(SQL) && /^BEGIN;$/m.test(SQL) && /^COMMIT;$/m.test(SQL), '6.2 each source held to upload or instagram; no table created, no row rewritten; one transaction');
  const R = JSON.parse(read('db/migrations/OUT_OF_ORDER.json')).register;
  /* AMENDED BY LABEL, CE-47 WEB-4 cut 17 (b263): the register goes on after 0195 (0197 in train 4); its first eight rows are held in this order */ ok(() => JSON.stringify(R.slice(0, 8).map((r) => r.number)) === '[183,204,196,200,208,209,205,195]' && R.slice(0, 8).every((r) => /fills a hole below the applied ladder tip/.test(r.note) && /^OWED/.test(r.state)), '6.3 the register, in history order (order is history, never sorted): main\'s 0183 and 0204 first, then 0196, 0200, 0208, 0209, OFF-A1b\'s 0205, and 0195 last (train 3\'s order)', JSON.stringify(R.map((r) => r.number)));
  const r205 = R.find((r) => r.number === 205);
  ok(() => r205 && /\*\*CE-47 · OFF-A1b · THE CLASS LINK\*\*/.test(r205.note) && r205.stale_for === '`public.shop_items`' && /^OWED — the snapshot does not carry `shop_items\.class_link`; `0205` and this file are its witnesses until the next PAIR regen\.$/.test(r205.state), '6.4 0205\'s record is OFF-A1b\'s own, copied verbatim (its file, sha256 e0b48576...)');

  sec('7  mutations, run');
  const MS = read('src/lib/site/siteModel.js');
  const M1 = load('src/lib/site/siteModel.js', MS.replace('const STYLE_ALLOWANCE = Object.freeze({ basic: 1,', 'const STYLE_ALLOWANCE = Object.freeze({ basic: 0,'));
  ok(() => M1 && M1.resolveSite({ tier: 'basic', category: 'makeup', businessName: 'S', site }).styles_open.length === 0, '7.1 Basic\'s allowance back to 0: no style open (1.1 reddens)');
  const M2 = load('src/lib/site/siteModel.js', MS.replace("const chosen = tierOf(tier) === 'basic' ? curated[0] : (curated.find((p) => p.id === s.palette_id) || curated[0]);", 'const chosen = curated.find((p) => p.id === s.palette_id) || curated[0];'));
  ok(() => M2 && M2.resolveSite({ tier: 'basic', category: 'makeup', businessName: 'S', site }).palette.id === 'noir.wine', '7.2 the fixed palette removed: Basic reads her stored palette (1.2 reddens)');
  const M3 = load('src/lib/site/siteModel.js', MS.replace("locked: tierOf(tier) === 'basic' && next !== null && now < next", 'locked: false'));
  ok(() => M3 && M3.styleClock('basic', { style_changed_at: new Date(Date.now() - DAY).toISOString() }, Date.now()).locked === false, '7.3 the clock unlocked: a change the day after is not refused (3.1 reddens)');

  console.log(`\nb261 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.stack || e)); console.log(`\nb261 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
