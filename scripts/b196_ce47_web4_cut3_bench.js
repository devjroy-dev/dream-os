// scripts/b196_ce47_web4_cut3_bench.js
// TDW · CE-47 · WEB-4 cut 3 · b196 — THE PUBLIC CARD'S SITE FIELDS, A LOOK'S OWN PAGE, HER ROOM'S DOORS, LOOK PHOTOS IN
// THE ADMIN QUEUE, AND KIND WORDS BY REQUEST. Every door is the real one, mounted on express and driven over HTTP against
// scripts/lib/b196_store.js (filters applied for real). §1 the card · §2 a look's page · §3 her room · §4 the portfolio
// approval carry, both ways · §5 the admin queue · §6 testimonials · §7 hostile input · §8 mutations of production code.
// On a tree without the cut every cell reads RED, never a crash: modules load through `load()`.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const Module = require('module');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => { try { return fs.readFileSync(P(r), 'utf8'); } catch { return ''; } };
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
const { makeStore } = require('./lib/b196_store');
// cut 16 r2 (e-275): a CAUSAL stage meter over any b196_store (see 1.16). It wraps each query's `then`: a read's stage is
// 1 + the highest stage completed in this epoch when the read is issued; `stages` is the highest stage reached.
function causalMeter(store) {
  const m = { epoch: 0, done: 0, max: 0 };
  const from = store.from.bind(store);
  store.from = (name) => {
    const q = from(name); const then = q.then.bind(q);
    q.then = (res, rej) => {
      const ep = m.epoch; const stage = m.done + 1; if (stage > m.max) m.max = stage;
      const settle = () => { if (ep === m.epoch && stage > m.done) m.done = stage; };
      return then((v) => { settle(); return v; }, (e) => { settle(); throw e; }).then(res, rej);
    };
    return q;
  };
  return { reset() { m.epoch += 1; m.done = 0; m.max = 0; }, get stages() { return m.max; } };
}

// the two middlewares stubbed as b148 does: the vendor is injected per request
for (const m of ['src/api/middleware/requireAuth.js', 'src/api/middleware/resolveVendor.js', 'src/api/admin/requireAdmin.js']) {
  try { const k = require.resolve(P(m)); require.cache[k] = { id: k, filename: k, loaded: true, exports: m.endsWith('resolveVendor.js') ? () => (q, r, n) => n() : (q, r, n) => n() }; } catch { /* absent on the tip */ }
}
function fresh(r, src) { const m = new Module(P(r), module); m.filename = P(r); m.paths = Module._nodeModulePaths(path.dirname(P(r))); m._compile(src === undefined ? read(r) : src, P(r)); return m.exports; }
function load(r, src) { try { return fresh(r, src); } catch { return null; } }
function mutated(r, from, to) { const s = read(r); return s.includes(from) ? load(r, s.replace(from, to)) : null; }

const V = (id, tier, extra) => Object.assign({ id, business_name: 'Studio ' + id, category: 'makeup', city: 'Delhi', routing_handle: id.toUpperCase(), status: 'active', discover_paused: false,
  date_check_enabled: true, about: 'About', rate_min: 40000, rate_display: true, tier, enquiry_routing: null, enquiry_phone: null }, extra || {});
const CL = (vid, name) => `https://res.cloudinary.com/tdw/image/upload/${vid}/${name}.jpg`;
const LOOKC = (vid, name) => `https://res.cloudinary.com/tdw/image/upload/vendor_looks/${vid}/${name}.jpg`;
function seed() {
  return {
    vendors: [V('basic1', 'basic'), V('ess1', 'essential'), V('sig1', 'signature'), V('pre1', 'prestige'), V('paused1', 'signature', { discover_paused: true })],
    vendor_portfolio: [
      { id: '11111111-1111-4111-8111-111111111111', vendor_id: 'sig1', image_url: CL('sig1', 'approved'), approval_state: 'approved', position: 0 },
      { id: '22222222-2222-4222-8222-222222222222', vendor_id: 'sig1', image_url: CL('sig1', 'pending'), approval_state: 'pending', position: 1 },
      { id: '33333333-3333-4333-8333-333333333333', vendor_id: 'pre1', image_url: CL('pre1', 'other'), approval_state: 'approved', position: 0 },
    ],
    vendor_packages: [{ id: 'p-b', vendor_id: 'basic1', name: 'Trial', total: 5000, line_items: [], is_default: false, deleted_at: null },
      { id: 'p-s1', vendor_id: 'sig1', name: 'Bridal', total: 45000, line_items: [], is_default: true, deleted_at: null },
      { id: 'p-s2', vendor_id: 'sig1', name: 'Trial', total: 5000, line_items: [], is_default: false, deleted_at: null }],
    // AMENDED BY LABEL, CE-47 WEB-4 cut 5 (b198): a styles site shows only once PUBLISHED (vendor_sites.published_at), so
    // the planted sites carry it; ess1's and pre1's rows are planted for the same reason.
    vendor_sites: [{ vendor_id: 'ess1', published_at: '2026-09-30T00:00:00Z' }, { vendor_id: 'pre1', published_at: '2026-09-30T00:00:00Z' },
      { vendor_id: 'sig1', published_at: '2026-09-30T00:00:00Z', look: 'bloom', pages: [], credit_shown: true, style: 'noir', styles_picked: ['noir'],
      cover: [{ photo: { url: CL('sig1', 'approved') }, headline: 'The Night Bride' }, { photo: { url: CL('sig1', 'pending') }, headline: 'Not approved' }, { photo: { url: 'https://evil.example/x.jpg' }, headline: 'Not hers' }],
      copy: { intro: 'Hello' }, palette_custom: {} }],
    vendor_testimonials: [
      { id: 't-typed', vendor_id: 'sig1', author: 'Typed Before', body: 'Typed by someone else', state: 'approved', request_id: null, submitted_at: null, deleted_at: null, position: 0 },
      { id: 't-client', vendor_id: 'sig1', author: 'Ananya', body: 'Ten minutes.', state: 'approved', request_id: 'r-old', submitted_at: '2026-09-01T00:00:00Z', video_url: 'https://youtu.be/abc', deleted_at: null, position: 1, event_month: '2026-02-01' },
      { id: 't-ess', vendor_id: 'ess1', author: 'Ira', body: 'Lovely.', state: 'approved', request_id: 'r-e', submitted_at: '2026-09-01T00:00:00Z', video_url: 'https://youtu.be/v', deleted_at: null, position: 0 },
    ],
    vendor_site_faq: [{ id: 'f1', vendor_id: 'sig1', question: 'Do you travel?', answer: 'Yes.', position: 0, deleted_at: null }],
    clients: [{ id: '44444444-4444-4444-8444-444444444444', vendor_id: 'sig1', name: 'Meera Kapoor', phone: '+919999900000', deleted_at: null }],
  };
}

(async () => {
  const express = require('express');
  const VC = load('src/api/public/vendorCard.js'); const TS = load('src/api/public/testimonial.js');
  const SITE = load('src/api/vendor/solutions/site.js'); const ADMIN = load('src/api/admin/photos.js');
  const SC = load('src/lib/site/siteCard.js');
  async function server(store, parts) {
    const app = express(); app.use(express.json()); app.locals.supabase = store; app.set('trust proxy', true);
    let who = null; app.use((q, r, n) => { q.vendor = who; n(); });
    if (parts.card) app.use('/card', parts.card); if (parts.t) app.use('/t', parts.t); if (parts.site) app.use('/site', parts.site); if (parts.admin) app.use('/admin', parts.admin);
    const s = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); }); const port = () => s.address().port;
    const call = (m, p, body, as, ip) => new Promise((resolve) => { who = as || null;
      const rq = http.request(`http://127.0.0.1:${port()}${p}`, { method: m, headers: Object.assign({ 'content-type': 'application/json' }, ip ? { 'x-forwarded-for': ip } : {}) }, (rs) => {
        let b = ''; rs.on('data', (d) => (b += d)); rs.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } resolve({ status: rs.statusCode, body: j, raw: b }); }); });
      rq.on('error', () => resolve({ status: 0, body: null, raw: '' })); if (body !== undefined) rq.write(JSON.stringify(body)); rq.end(); });
    return { call, close: () => new Promise((r) => s.close(r)) };
  }
  const vendorOf = (store, id) => store.tables.vendors.find((x) => x.id === id);
  const deepKeys = (o, acc = []) => { if (o && typeof o === 'object') for (const [k, x] of Object.entries(o)) { acc.push(k); deepKeys(x, acc); } return acc; };
  const cardOf = async (S, code) => { const r = await S.call('GET', '/card/' + code); return r.body && r.body.card; };

  const store = makeStore(seed());
  const S = await server(store, { card: VC, t: TS, site: SITE, admin: ADMIN });
  const sig = (m, p, b) => S.call(m, '/site' + p, b, vendorOf(store, 'sig1'));

  // ── build her Signature site through her own doors, so the card is read from what the room wrote ──────────────
  const lookA = await sig('POST', '/looks', { title: 'The Emerald Bride', category: 'Bridal', from_price: 'From Rs 55,000', credits: [{ role: 'Outfit', text: 'Label Noor' }], videos: [{ url: 'https://youtu.be/look' }] });
  const lookB = await sig('POST', '/looks', { title: 'Waiting Look' });
  const idA = lookA.body && lookA.body.look && lookA.body.look.id; const idB = lookB.body && lookB.body.look && lookB.body.look.id;
  const phA = await sig('POST', `/looks/${idA}/photos`, { portfolio_id: '11111111-1111-4111-8111-111111111111', focal_portrait: { x: 40, y: 30 } });
  const phB = await sig('POST', `/looks/${idB}/photos`, { image_url: LOOKC('sig1', 'fresh') });
  const pubA = await sig('POST', `/looks/${idA}/publish`); const pubB = await sig('POST', `/looks/${idB}/publish`);

  sec('1  the public card (CE-47\'s field list)');
  const basic = await cardOf(S, 'basic1'); const sc = await cardOf(S, 'sig1'); const ec = await cardOf(S, 'ess1');
  ok(() => basic && JSON.stringify(Object.keys(basic.site).sort()) === '["credit","domain","look","pages","v"]' && basic.site.v === 'classic', '1.1 Basic: today\'s four site fields plus v "classic"');
  ok(() => JSON.stringify([basic.looks, basic.collections, basic.testimonials, basic.faq, basic.eliza]) === JSON.stringify([[], [], [], [], { live_booking: 'not_in_plan', own_voice: 'not_in_plan' }]), '1.2 Basic: the five fields empty, Eliza\'s words not_in_plan');
  ok(() => basic.packages.length === 1 && basic.packages[0].total === 5000, '1.3 Basic: packages as today, byte for byte: a row below her starting price keeps its figure (Q4 is styles only)');
  ok(() => sc && sc.site.v === 'styles' && sc.site.style === 'noir' && sc.site.palette && sc.site.fonts && sc.site.corners === 'square' && sc.site.buttons === 'gold_outline' && sc.site.texture === 'grain', '1.4 Signature: the styles site, resolved (style, palette, fonts, finish ids)');
  ok(() => sc.site.cover.length === 1 && sc.site.cover[0].headline === 'The Night Bride', '1.5 a cover slide shows only over one of her APPROVED photographs (a pending one and a stranger\'s address are dropped)');
  ok(() => sc.looks.length === 1 && sc.looks[0].slug === 'the-emerald-bride' && sc.looks[0].photo_count === 1 && sc.looks[0].from_price === 'From Rs 55,000' && sc.looks[0].is_new === true && sc.looks[0].has_video === true, '1.6 a published look with an approved photo shows; one whose only photo is pending does not');
  ok(() => sc.testimonials.length === 1 && sc.testimonials[0].name === 'Ananya' && sc.testimonials[0].month === '2026-02' && sc.testimonials[0].video && sc.testimonials[0].video.url === 'https://youtu.be/abc', '1.7 testimonials: approved and the client\'s own only (a typed row never shows); video on Signature');
  ok(() => ec.testimonials.length === 1 && ec.testimonials[0].video === null && ec.collections.length === 0, '1.8 Essential: written words only (the video is withheld), no collections');
  ok(() => JSON.stringify(sc.packages.map((p) => p.total)) === '[45000,null]', '1.9 Q4 on the styles site: a package below her starting price shows no figure');
  ok(() => JSON.stringify(sc.eliza) === '{"live_booking":"coming_soon","own_voice":"not_in_plan"}' && JSON.stringify(ec.eliza) === '{"live_booking":"not_in_plan","own_voice":"not_in_plan"}', '1.10 eliza as words, by plan (gap 9)');
  ok(() => sc.site.seo && sc.site.seo.canonical === 'https://sig1.thedreamwedding.in' /* AMENDED BY LABEL, CE-47 WEB-4 cut 7 (b200): her own subdomain (the founder) */ && /w_1200,c_limit/.test(sc.site.seo.image), '1.11 site.seo: canonical and a 1200-wide image (gap 8)');
  ok(() => ['can', 'tier', 'styles_open', 'moved', 'rate_min', 'rate_max', 'rate_display', 'approval_state'].every((k) => !deepKeys(sc).includes(k) && !deepKeys(ec).includes(k) && !deepKeys(basic).includes(k)), '1.12 no `can`, tier or price switch at any depth of any card');
  ok(() => sc.faq.length === 1 && sc.faq[0].question === 'Do you travel?', '1.13 her questions');
  vendorOf(store, 'sig1').rate_display = false;
  const hidden = await cardOf(S, 'sig1'); vendorOf(store, 'sig1').rate_display = true;
  ok(() => hidden.looks[0].from_price === null && hidden.packages.every((p) => p.total === null) && hidden.starting_price === null, '1.14 her page set to hide prices: no figure anywhere on the card');
  store.failOn.add('vendor_looks'); const failed1 = await cardOf(S, 'sig1'); store.failOn.delete('vendor_looks');
  ok(() => failed1 && failed1.looks.length === 0 && failed1.site.v === 'styles', '1.15 a failed looks read gives an empty list, never a 500 on her page');
  // CE-47's cure 1 (r2): the new reads run in two stages, not nine in a row
  // AMENDED BY LABEL, CE-47 WEB-4 cut 16 r2 (b261; e-275): 1.16 and 1.17 count stages CAUSALLY, not by timing. The
  // store's own meter (a read starting while none is in flight opens a stage) depends on real timers: under load, two
  // stages can merge, or a straggler from an earlier call can hide one, so the count moved from run to run. The causal
  // meter below gives every read the stage 1 + the highest stage COMPLETED before it was issued, and counts the highest
  // stage reached. Reads issued together share a stage; a read issued after awaiting another is one stage later;
  // reads from an earlier measurement (an older epoch) are ignored. The same code gives the same number on every run.
  // The baseline for "no site reads" is Basic's card with her site unpublished (cut 16: a PUBLISHED Basic site now reads
  // its rows like any plan; the gate is decided first, cut 6).
  const causal = causalMeter(store);
  const bRow = (store.tables.vendor_sites || []).find((x) => x.vendor_id === 'basic1'); const bPub = bRow ? bRow.published_at : undefined; if (bRow) bRow.published_at = null;
  causal.reset(); await cardOf(S, 'basic1'); const wBasic = causal.stages;
  if (bRow) bRow.published_at = bPub;
  causal.reset(); await cardOf(S, 'sig1'); const wSig = causal.stages;
  causal.reset(); await S.call('GET', '/card/sig1/look/the-emerald-bride'); const wLook = causal.stages;
  ok(() => wSig - wBasic === 2, '1.16 a Signature card awaits exactly two stages more than a Basic one (the reads run together)', `basic ${wBasic}, signature ${wSig}`);
  ok(() => wLook <= 4, '1.17 a look\'s page awaits at most four stages (vendor, looks, photos, credits with package)', `look ${wLook}`);
  { const m = makeStore({ a: [{ id: 1 }] }); await m.from('a').select('id'); await m.from('a').select('id'); const serial = m.meter.waves; m.meter.waves = 0;
    await Promise.all([m.from('a').select('id'), m.from('a').select('id')]); ok(() => serial === 2 && m.meter.waves === 1, '1.18 control: the meter counts two reads in a row as two stages and two together as one'); }
  { const m = makeStore({ a: [{ id: 1 }] }); const c = causalMeter(m);
    c.reset(); await m.from('a').select('id'); await m.from('a').select('id'); const serial = c.stages;
    c.reset(); await Promise.all([m.from('a').select('id'), m.from('a').select('id')]); const together = c.stages;
    const straggler = m.from('a').select('id'); const sp = straggler.then((x) => x); c.reset(); await sp; await m.from('a').select('id'); const afterStraggler = c.stages;
    ok(() => serial === 2 && together === 1 && afterStraggler === 1, '1.19 control (cut 16 r2): the causal meter counts two in a row as two, two together as one, and ignores a read from before its reset', `${serial}/${together}/${afterStraggler}`); }

  sec('2  a look\'s own page (D)');
  const lp = await S.call('GET', '/card/sig1/look/the-emerald-bride');
  ok(() => lp.status === 200 && lp.body.look.title === 'The Emerald Bride' && lp.body.look.photos.length === 1 && lp.body.look.credits[0].name === 'Label Noor' && lp.body.look.credits[0].handle === null && lp.body.look.videos[0].kind === 'youtube', '2.1 a live look\'s page: photos, credits, videos');
  const misses = await Promise.all(['/card/sig1/look/waiting-look', '/card/sig1/look/nope', '/card/basic1/look/x', '/card/paused1/look/x', '/card/unknown/look/x', '/card/sig1/look/BAD%20SLUG'].map((p) => S.call('GET', p)));
  ok(() => misses.every((m) => m.status === 404) && new Set(misses.map((m) => m.raw)).size === 1, '2.2 every miss (a look waiting for photos, unknown, Basic, paused, bad slug) is the one 404 body');
  store.failOn.add('vendors'); const f2 = await S.call('GET', '/card/sig1/look/the-emerald-bride'); store.failOn.delete('vendors');
  ok(() => f2.status === 500, '2.3 a failed vendor read answers as the card does (500), never as "no such look"');

  sec('3  her room\'s doors');
  ok(() => lookA.status === 200 && pubA.status === 200 && pubA.body.public_state === 'live' && pubB.body.public_state === 'waiting_for_photos', '3.1 publish: live with an approved photo; "waiting_for_photos" with only a pending one');
  const list = await sig('GET', '/looks');
  const la = list.body.looks.find((l) => l.id === idA); const lb = list.body.looks.find((l) => l.id === idB);
  ok(() => la.public_state === 'live' && la.photos[0].review === 'approved' && lb.public_state === 'waiting_for_photos' && lb.photos[0].review === 'waiting', '3.2 per look public_state and per photo review (gap 6)');
  const b403 = await S.call('POST', '/site/looks', { title: 'x' }, vendorOf(store, 'basic1'));
  // AMENDED BY LABEL, CE-47 WEB-4 cut 16 (b261): Basic holds one free style and its looks section is open (ruling 1).
  ok(() => b403.status === 200 && store.tables.vendor_looks.some((l) => l.vendor_id === 'basic1'), '3.3 Basic\'s looks section is open (cut 16): her look is written');
  const noPh = await sig('POST', '/looks', { title: 'Empty' }); const pubE = await sig('POST', `/looks/${noPh.body.look.id}/publish`);
  ok(() => pubE.status === 400, '3.4 a look with no photo cannot be published');
  const glow = await S.call('PATCH', '/site/settings', { style: 'couture', button_style: 'glow' }, vendorOf(store, 'pre1'));
  const credS = await sig('PATCH', '/settings', { credit_shown: false });
  const credP = await S.call('PATCH', '/site/settings', { credit_shown: false }, vendorOf(store, 'pre1'));
  ok(() => glow.status === 400 && credS.status === 400 && credP.status === 200, '3.5 settings held to her style and plan: Couture refuses a glow button; only Prestige removes the credit');
  const tex = await sig('PATCH', '/settings', { texture: 'paper' });
  ok(() => tex.status === 400, '3.6 a texture her style does not offer is refused');
  const room = await sig('GET', '/room');
  ok(() => room.status === 200 && JSON.stringify(room.body.room.to_fix.packages_below_starting_price) === '[{"package_id":"p-s2","name":"Trial"}]', '3.7 to_fix.packages_below_starting_price names the row whose figure is hidden (gap 3)');
  ok(() => JSON.stringify(room.body.room.finish.aurora.buttons) === '["glow","solid","glass"]' && !room.body.room.finish.couture.corners.includes('soft'), '3.8 the room offers each style\'s ids from FINISH; proposed ids are not offered');
  const other = await S.call('PATCH', `/site/looks/${idA}`, { title: 'Stolen' }, vendorOf(store, 'pre1'));
  ok(() => other.status === 404 && store.tables.vendor_looks.find((l) => l.id === idA).title === 'The Emerald Bride', '3.9 another vendor cannot touch her look (404, unchanged)');
  const col = await sig('POST', '/collections', { name: 'The Winter Brides' });
  const colEss = await S.call('POST', '/site/collections', { name: 'X' }, vendorOf(store, 'ess1'));
  ok(() => col.status === 200 && colEss.status === 403, '3.10 collections: Signature yes, Essential no');

  sec('4  a photo from her approved portfolio carries its approval; nothing else does (the chair\'s ruling, both ways)');
  ok(() => phA.status === 200 && phA.body.photo.review === 'approved', '4.1 by the portfolio row\'s id: approved at once');
  const byUrl = await sig('POST', `/looks/${idB}/photos`, { image_url: CL('sig1', 'approved') });
  ok(() => byUrl.status === 200 && byUrl.body.photo.review === 'approved', '4.2 by its exact stored address: approved at once');
  const pendId = await sig('POST', `/looks/${idB}/photos`, { portfolio_id: '22222222-2222-4222-8222-222222222222' });
  ok(() => pendId.status === 200 && pendId.body.photo.review === 'waiting', '4.3 her PENDING portfolio photo carries pending, not approval');
  const theirs = await sig('POST', `/looks/${idB}/photos`, { portfolio_id: '33333333-3333-4333-8333-333333333333' });
  const theirsUrl = await sig('POST', `/looks/${idB}/photos`, { image_url: CL('pre1', 'other') });
  ok(() => theirs.status === 404 && theirsUrl.status === 400, '4.4 another vendor\'s approved photo, by id or by address, carries nothing (404 / refused)');
  const alike = await sig('POST', `/looks/${idB}/photos`, { image_url: CL('sig1', 'approved').replace('.jpg', '.jpeg') });
  ok(() => alike.status === 400, '4.5 an address that only RESEMBLES hers is not the same picture: refused');
  ok(() => phB.status === 200 && phB.body.photo.review === 'waiting', '4.6 a fresh upload into her look folder waits for the admin');

  sec('5  look photos in the admin queue');
  const q = await S.call('GET', '/admin/queue?kind=look&state=pending');
  const freshId = phB.body && phB.body.photo.id;
  ok(() => q.status === 200 && q.body.kind === 'look' && q.body.photos.some((p) => p.id === freshId), '5.1 the queue lists pending look photos under kind=look');
  const qp = await S.call('GET', '/admin/queue?state=pending');
  ok(() => qp.status === 200 && qp.body.photos.every((p) => !p.look_id), '5.2 the portfolio queue is unchanged (no look photos in it)');
  const ap = await S.call('POST', `/admin/${freshId}/approve?kind=look`);
  const after = await cardOf(S, 'sig1');
  ok(() => ap.status === 200 && after.looks.some((l) => l.slug === 'waiting-look'), '5.3 approving it puts the waiting look on her site');

  sec('6  kind words by request');
  const rq = await sig('POST', '/testimonials/requests', { client_id: '44444444-4444-4444-8444-444444444444' });
  const link = rq.body && rq.body.link; const token = link ? link.split('/').pop() : '';
  const reqRow = store.tables.vendor_testimonial_requests && store.tables.vendor_testimonial_requests[0];
  ok(() => rq.status === 200 && /^https:\/\/thedreamwedding\.in\/kind-words\//.test(link) && rq.body.copy_text.endsWith(link) && rq.body.send === 'copied', '6.1 a request gives the link and the copyable text (the text ends with the link, nothing after it)');
  ok(() => reqRow && reqRow.token_hash === TS.sha(token) && !JSON.stringify(store.tables).includes(token) && reqRow.phone === '+919999900000', '6.2 only the token\'s sha256 is stored, never the token');
  const wa = await sig('POST', '/testimonials/requests', { person_name: 'Riya', phone: '+91 98765 43210', send: 'whatsapp' });
  ok(() => wa.status === 200 && wa.body.send === 'coming_soon', '6.3 the WhatsApp send answers "coming_soon" (R-46.14)');
  const g = await S.call('GET', '/t/' + token);
  ok(() => g.status === 200 && g.body.form.person_name === 'Meera Kapoor' && g.body.form.video_allowed === true, '6.4 the client\'s form: her name, the studio, video allowed on Signature');
  const body = { name: 'Meera', occasion: 'Wedding', month: '2026-03', place: 'Udaipur', words: 'She was wonderful.', video_url: 'https://www.instagram.com/reel/x', consent: true };
  const p1 = await S.call('POST', '/t/' + token, body, null, '10.0.0.1');
  const tRow = store.tables.vendor_testimonials.find((t) => t.author === 'Meera');
  ok(() => p1.status === 200 && tRow && tRow.state === 'pending' && tRow.request_id === reqRow.id && tRow.video_url === body.video_url, '6.5 the words land pending, tied to the request');
  ok(() => reqRow.used_at && reqRow.phone === null, '6.6 the request is used and its phone nulled in the same write');
  const p2 = await S.call('POST', '/t/' + token, body, null, '10.0.0.1');
  const unknown = await S.call('GET', '/t/' + 'x'.repeat(30));
  ok(() => p2.status === 404 && p2.raw === unknown.raw, '6.7 single use: a second POST gets the one 404 body');
  const cardBefore = await cardOf(S, 'sig1');
  ok(() => !cardBefore.testimonials.some((t) => t.name === 'Meera'), '6.8 nothing shows until she approves');
  const approve = await sig('POST', `/testimonials/${tRow.id}/approve`);
  const cardAfter = await cardOf(S, 'sig1');
  ok(() => approve.status === 200 && cardAfter.testimonials.some((t) => t.name === 'Meera'), '6.9 approved: it shows');
  const typed = await sig('POST', '/testimonials/t-typed/approve');
  ok(() => typed.status === 404 || typed.status === 400, '6.10 a typed row (not the client\'s own) can never be approved');
  const listT = await sig('GET', '/testimonials');
  ok(() => listT.body.testimonials.find((t) => t.id === 't-typed') === undefined || listT.body.testimonials.find((t) => t.id === 't-typed').to_delete === true, '6.11 a typed row is listed for her to delete');
  ok(() => read('src/api/vendor/solutions/siteRoom.js').length > 0 && !/router\.(patch|put)\('\/testimonials/.test(read('src/api/vendor/solutions/siteRoom.js')), '6.12 no door edits a client\'s words (ruling 2)');
  // Essential: no video
  const store2 = makeStore(seed()); const S2 = await server(store2, { t: TS, site: SITE });
  const er = await S2.call('POST', '/site/testimonials/requests', { person_name: 'Kavya' }, store2.tables.vendors.find((x) => x.id === 'ess1'));
  const et = er.body && er.body.link.split('/').pop();
  const ev = await S2.call('POST', '/t/' + et, body, null, '10.0.0.2');
  ok(() => ev.status === 400 && /written words only/.test(ev.raw), '6.13 Essential: a video link is refused with a plain line');
  const bad = await S2.call('POST', '/t/' + et, Object.assign({}, body, { video_url: undefined, consent: false }), null, '10.0.0.2');
  ok(() => bad.status === 400, '6.14 no consent, no words saved');
  // per-token limit: five refused tries, then even a good one reads 404
  for (let i = 0; i < 4; i += 1) await S2.call('POST', '/t/' + et, { consent: false }, null, '10.0.0.3');
  const sixth = await S2.call('POST', '/t/' + et, Object.assign({}, body, { video_url: undefined }), null, '10.0.0.4');
  ok(() => sixth.status === 404, '6.15 per token: five POSTs in its life, the sixth reads as the 404 body');
  // per-address limit
  // AMENDED BY LABEL, CE-47 WEB-4 (cut 5, b198): the maps became one pruned, capped limiter.
  if (TS && TS._limiter) TS._limiter._map.clear();
  let last = null; for (let i = 0; i < 21; i += 1) last = await S2.call('POST', '/t/' + 'y'.repeat(30), {}, null, '10.9.9.9');
  ok(() => last.status === 429 && /Too many tries/.test(last.raw), '6.16 per address: the 21st POST in an hour is 429 with the plain line');
  ok(() => !JSON.stringify(store2.tables).includes('10.9.9.9') && !JSON.stringify(store.tables).includes('10.0.0.1'), '6.17 no address is stored anywhere');
  // expired and revoked
  const r2 = await sig('POST', '/testimonials/requests', { person_name: 'Old' }); const t2 = r2.body.link.split('/').pop();
  store.tables.vendor_testimonial_requests.find((x) => x.token_hash === TS.sha(t2)).expires_at = '2020-01-01T00:00:00Z';
  const r3 = await sig('POST', '/testimonials/requests', { person_name: 'Gone' }); const t3 = r3.body.link.split('/').pop();
  await sig('POST', `/testimonials/requests/${r3.body.request.id}/revoke`);
  const e2 = await S.call('GET', '/t/' + t2); const e3 = await S.call('GET', '/t/' + t3);
  ok(() => e2.status === 404 && e3.status === 404 && e2.raw === e3.raw, '6.18 expired and revoked read as the same 404 body');
  // CE-47's cure 2 (r2): "not after this month" is India's calendar month
  const mb = { consent: true, name: 'M', month: '2026-10', words: 'w' };
  ok(() => !TS.checkSubmission(mb, true, new Date('2026-09-30T19:00:00Z')).error && TS.checkSubmission(mb, true, new Date('2026-09-30T18:29:00Z')).error === 'Choose the month of the wedding or occasion.', '6.19 00:30 IST on 1 October accepts October; 23:59 IST on 30 September refuses it (both ways)');
  ok(() => !TS.checkSubmission(Object.assign({}, mb, { month: '2027-01' }), true, new Date('2026-12-31T18:30:00Z')).error, '6.20 across a year\'s end in India\'s calendar');
  // CE-47's cure 3 (r2): a failed insert does not burn the link
  const r4 = await sig('POST', '/testimonials/requests', { person_name: 'Nisha', phone: '+919876543210' }); const t4 = r4.body.link.split('/').pop();
  store.failWrite.add('vendor_testimonials');
  const f4 = await S.call('POST', '/t/' + t4, Object.assign({}, body, { name: 'Nisha', video_url: undefined }), null, '10.4.4.4');
  const req4 = store.tables.vendor_testimonial_requests.find((x) => x.token_hash === TS.sha(t4));
  store.failWrite.delete('vendor_testimonials');
  ok(() => f4.status === 503 && req4.used_at === null && req4.phone === null, '6.21 the store refuses the insert: 503, the request is released (used_at null), its phone stays nulled');
  const g4 = await S.call('POST', '/t/' + t4, Object.assign({}, body, { name: 'Nisha', video_url: undefined }), null, '10.4.4.4');
  ok(() => g4.status === 200 && store.tables.vendor_testimonials.some((t) => t.author === 'Nisha'), '6.22 the same link then saves the words');
  ok(() => ['https://m.youtube.com/watch?v=x', 'https://youtube.com/shorts/x', 'https://youtu.be/x', 'https://www.instagram.com/reel/x'].every((u) => SC.videoKind(u)) && ['https://vimeo.com/1', 'http://youtu.be/x', 'https://youtube.com.evil.io/x'].every((u) => !SC.videoKind(u)), '6.23 one video-link rule: m.youtube.com and shorts accepted; other hosts, http and look-alikes refused');
  await S2.close();

  sec('7  hostile input');
  const H = [null, 1, 'x', [], { a: { b: [] } }, { title: {} }, { title: ['a'] }, { credits: 'x' }, { videos: [{}] }, { cover: 'x' }, { copy: [] }];
  let worst = 0;
  for (const h of H) for (const [m, p] of [['POST', '/looks'], ['PATCH', `/looks/${idA}`], ['PATCH', '/settings'], ['PUT', '/sections'], ['PUT', '/faq'], ['POST', '/testimonials/requests'], ['POST', `/looks/${idA}/photos`]]) {
    const r = await sig(m, p, h); worst = Math.max(worst, r.status);
  }
  ok(() => worst < 500, '7.1 no hostile body makes her room answer 500', worst);
  let worstT = 0; for (const h of H) { const r = await S.call('POST', '/t/' + 'z'.repeat(30), h, null, '10.7.7.' + H.indexOf(h)); worstT = Math.max(worstT, r.status); }
  ok(() => worstT < 500, '7.2 nor the client\'s page', worstT);

  sec('8  mutations of production code (each must turn a cell above red)');
  const SCm = mutated('src/lib/site/siteCard.js', "(photoMap.get(l.id) || []).length > 0)", 'true)');
  ok(() => SCm && SCm.siteCard({ tier: 'signature', siteRow: { style: 'noir' }, looks: [{ id: 'x', slug: 'x', title: 'X', status: 'published', published_at: '2026-01-01' }], lookPhotos: [] }).looks.length === 1, '8.1 the approved-photo rule removed: a look with no approved photo shows (1.6 reddens)');
  const SCt = mutated('src/lib/site/siteCard.js', "(t.request_id || t.submitted_at))", 'true)');
  ok(() => SCt && SCt.testimonialsOf('signature', [{ state: 'approved', author: 'T', body: 'typed' }]).length === 1, '8.2 the client\'s-own rule removed: a typed row shows (1.7 reddens)');
  const SCc = mutated('src/lib/site/siteCard.js', 'if (!okUrls.has(url)) return null;', '');
  ok(() => SCc && SCc.siteCard({ tier: 'signature', siteRow: { style: 'noir', cover: [{ photo: { url: 'https://evil.example/x.jpg' } }] } }).site.cover.length === 1, '8.3 the approved-picture rule removed: a stranger\'s picture reaches the cover (1.5 reddens)');
  const SCk = mutated('src/lib/site/siteCard.js', "v: 'styles', style: resolved.style,", "v: 'styles', can: resolved.can, style: resolved.style,");
  ok(() => SCk && deepKeys(SCk.siteCard({ tier: 'signature', siteRow: { style: 'noir' } })).includes('can'), '8.4 `can` put on the card: the deep scan sees it (1.12 and b44 2.3b redden)');
  const SCv = mutated('src/lib/site/siteCard.js', 'const video = r >= 2;', 'const video = true;');
  ok(() => SCv && SCv.testimonialsOf('essential', [{ state: 'approved', author: 'I', body: 'w', request_id: 'r', video_url: 'https://youtu.be/v' }])[0].video !== null, '8.5 the video plan gate removed: Essential shows a video (1.8 reddens)');
  const SRm = read('src/api/vendor/solutions/siteRoom.js');
  const carryMut = SRm.replace(".eq('id', b.portfolio_id).eq('vendor_id', v.id).maybeSingle()", ".eq('id', b.portfolio_id).maybeSingle()");
  ok(() => carryMut !== SRm, '8.6 the carry\'s vendor scope is a named line (removing it lets another vendor\'s photo carry: 4.4 reddens)');
  const TSm = read('src/api/public/testimonial.js');
  ok(() => TSm.includes(".eq('id', r.req.id).is('used_at', null).is('revoked_at', null).gt('expires_at', at)") && TSm.replace(".is('used_at', null)", '') !== TSm, '8.7 the single-use guard is one named line (removing it lets a second POST save: 6.7 reddens)');
  // 8.8: prove 8.6 and 8.7 by running the mutated doors
  const storeM = makeStore(seed()); const SITEm = load('src/api/vendor/solutions/site.js', read('src/api/vendor/solutions/site.js').replace("require('./siteRoom')", "require('./siteRoom.mut.js')"));
  let carried = null;
  try {
    fs.writeFileSync(P('src/api/vendor/solutions/siteRoom.mut.js'), carryMut);
    const SM = await server(storeM, { site: load('src/api/vendor/solutions/site.js', read('src/api/vendor/solutions/site.js').replace("require('./siteRoom')", "require('./siteRoom.mut.js')")) });
    const lk = await SM.call('POST', '/site/looks', { title: 'M' }, storeM.tables.vendors.find((x) => x.id === 'sig1'));
    const r = await SM.call('POST', `/site/looks/${lk.body.look.id}/photos`, { portfolio_id: '33333333-3333-4333-8333-333333333333' }, storeM.tables.vendors.find((x) => x.id === 'sig1'));
    carried = r.body && r.body.photo && r.body.photo.review; await SM.close();
  } finally { try { fs.unlinkSync(P('src/api/vendor/solutions/siteRoom.mut.js')); } catch { /* */ } }
  ok(() => carried === 'approved' && !fs.existsSync(P('src/api/vendor/solutions/siteRoom.mut.js')), '8.8 run: with the scope removed another vendor\'s approved photo carries (so 4.4 is not vacuous); the mutant file is gone');
  void SITEm;
  const storeT = makeStore(seed()); const TSmut = load('src/api/public/testimonial.js', TSm.replace(".is('used_at', null)", ''));
  const ST = await server(storeT, { t: TSmut, site: SITE });
  const rr = await ST.call('POST', '/site/testimonials/requests', { person_name: 'Twice' }, storeT.tables.vendors.find((x) => x.id === 'sig1'));
  const tk = rr.body.link.split('/').pop(); const good = Object.assign({}, body, { video_url: undefined });
  const a1 = await ST.call('POST', '/t/' + tk, good, null, '10.5.5.5');
  storeT.tables.vendor_testimonial_requests[0].used_at = null;   // the guard is what stops the second write, not the read
  const a2 = await ST.call('POST', '/t/' + tk, good, null, '10.5.5.5'); await ST.close();
  ok(() => a1.status === 200 && a2.status === 200 && storeT.tables.vendor_testimonials.filter((t) => t.author === 'Meera').length === 2, '8.9 run: with the guard removed the words save twice (so 6.7 is not vacuous)');

  sec('9  every column a door wrote or read exists in the real migrations and schema (the class a store accepts and Postgres refuses)');
  const colsOf = (() => {
    const m = {};
    const add = (t, c) => { if (!m[t]) m[t] = new Set(); m[t].add(c); };
    // the snapshot (PUBLIC_SCHEMA.md) plus every numbered migration after its ladder tip, 0179 and 0187 among them
    const ladder = fs.readdirSync(P('db/migrations')).filter((f) => /^\d{4}_.*\.sql$/.test(f) && f.slice(0, 4) > '0168').map((f) => 'db/migrations/' + f);
    for (const f of ladder) {
      const sql = read(f).split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
      for (const b of sql.matchAll(/CREATE TABLE public\.(\w+) \(([\s\S]*?)\n\);/g)) for (const l of b[2].split('\n')) { const c = /^\s+([a-z_]+)\s+(uuid|text|integer|boolean|jsonb|timestamptz|date|bytea|numeric|text\[\]|uuid\[\])/.exec(l); if (c) add(b[1], c[1]); }
      for (const b of sql.matchAll(/ALTER TABLE public\.(\w+)([\s\S]*?);/g)) for (const c of b[2].matchAll(/ADD COLUMN ([a-z_]+)/g)) add(b[1], c[1]);
    }
    const doc = read('docs/db/PUBLIC_SCHEMA.md');
    for (const sct of doc.split(/\n## public\./).slice(1)) { const t = sct.split(/\s/)[0]; for (const c of sct.matchAll(/\n\d+\. ([a-z_]+) /g)) add(t, c[1]); }
    return m;
  })();
  const allWritten = {}; const allRead = {};
  for (const st of [store, store2, storeT]) { for (const [t, ks] of Object.entries(st.written)) { allWritten[t] = allWritten[t] || new Set(); ks.forEach((k) => allWritten[t].add(k)); }
    for (const [t, ks] of Object.entries(st.selected)) { allRead[t] = allRead[t] || new Set(); ks.forEach((k) => allRead[t].add(k)); } }
  const missW = []; for (const [t, ks] of Object.entries(allWritten)) for (const k of ks) if (!(colsOf[t] && colsOf[t].has(k))) missW.push(t + '.' + k);
  const missR = []; for (const [t, ks] of Object.entries(allRead)) for (const k of ks) if (!(colsOf[t] && colsOf[t].has(k))) missR.push(t + '.' + k);
  ok(() => Object.keys(allWritten).length >= 7 && missW.length === 0, '9.1 every column the doors WROTE is a real column (0179, 0187)', missW.join(' ') || `${Object.values(allWritten).reduce((n, x) => n + x.size, 0)} columns over ${Object.keys(allWritten).length} tables`);
  ok(() => Object.keys(allRead).length >= 12 && missR.length === 0, '9.2 every column the doors READ is a real column (PUBLIC_SCHEMA.md and every migration after its tip)', missR.join(' ') || `${Object.values(allRead).reduce((n, x) => n + x.size, 0)} columns over ${Object.keys(allRead).length} tables`);
  ok(() => colsOf.vendor_looks && colsOf.vendor_looks.has('from_price_text') && !colsOf.vendor_looks.has('from_price') && colsOf.vendor_testimonials.has('author') && colsOf.vendor_sites.has('credit_shown'), '9.3 control: the parser reads real columns and knows a wrong one (vendor_looks has from_price_text, not from_price)');

  await S.close();
  console.log(`\nb196 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.message)); console.log(`\nb196 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
