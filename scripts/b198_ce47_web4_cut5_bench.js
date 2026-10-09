// scripts/b198_ce47_web4_limits_bench.js
// TDW · CE-47 · WEB-4 · cut 5 (the package after cut 4) · b198 — THE CHAIR'S ITEMS a AND b.
// §1 one limiter, pruned and capped (src/lib/site/limiter.js), used by BOTH public doors · §2 her own live domain reads as
// direct · §3 mutations of a and b, run · §4 the draft and Publish · §5 the preview · §6 the site-kind door · §7 the card
// fields for WEB-5's port · §8 mutations of 1 to 4, run · §9 every column and the function are real (0189). On a tree without the package every cell is RED (modules load through `load()`).
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const Module = require('module');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => { try { return fs.readFileSync(P(r), 'utf8'); } catch { return ''; } };
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
function load(r, src) { try { const m = new Module(P(r), module); m.filename = P(r); m.paths = Module._nodeModulePaths(path.dirname(P(r))); m._compile(src === undefined ? read(r) : src, P(r)); return m.exports; } catch { return null; } }
const { makeStore } = require('./lib/b196_store');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const LIM = load('src/lib/site/limiter.js');
  sec('1  one limiter, pruned and capped, in both public doors (the chair\'s item a)');
  ok(() => { const l = LIM.makeLimiter({ cap: 50 }); return [1, 2, 3, 4].map(() => l.hit('k', 3, 60000)).join() === 'true,true,true,false'; }, '1.1 it still limits: three tries pass, the fourth does not');
  await (async () => { const l = LIM && LIM.makeLimiter({ cap: 50 }); if (!l) return ok(false, '1.2 expired entries are swept');
    for (let i = 0; i < 20; i += 1) l.hit('a' + i, 5, 5); await wait(20); l.sweep(); ok(() => l.size() === 0, '1.2 expired entries are swept: 20 keys past their window, 0 left', l.size()); })();
  ok(() => { const l = LIM.makeLimiter({ cap: 100 }); for (let i = 0; i < 1000; i += 1) l.hit('addr' + i, 5, 3600000); return l.size() <= 100 && l._map.has('addr999') && !l._map.has('addr0'); }, '1.3 the map never passes its cap: 1000 addresses, at most 100 kept, the newest kept and the oldest gone');
  ok(() => { const l = LIM.makeLimiter({ cap: 10, lifetimeMs: 5 }); l.hit('tok', 5, 0); return l._map.get('tok').until - Date.now() <= 5; }, '1.4 a lifetime count (window 0) is held for its lifetime and then forgotten');
  ok(() => { const l = LIM.makeLimiter({ cap: 20 }); let c = 0; for (let i = 0; i < LIM.SWEEP_EVERY + 5; i += 1) c += l.hit('x' + (i % 10), 1e9, 1) ? 1 : 0; return l.size() <= 20 && c > 0; }, '1.5 many calls: the scheduled sweep keeps the map small');
  const SV = read('src/api/public/siteVisit.js'); const TS = read('src/api/public/testimonial.js');
  ok(() => /require\('\.\.\/\.\.\/lib\/site\/limiter'\)\.makeLimiter\(\{ cap: 5000 \}\)/.test(SV) && /require\('\.\.\/\.\.\/lib\/site\/limiter'\)\.makeLimiter\(\{ cap: 5000 \}\)/.test(TS) && !/const buckets = new Map\(\)/.test(SV + TS), '1.6 both doors (siteVisit.js and testimonial.js) use it, capped at 5000; neither keeps its own map');
  const TSm = load('src/api/public/testimonial.js'); const SVm = load('src/api/public/siteVisit.js');
  ok(() => TSm && TSm._limiter && TSm._limiter.cap === 5000 && SVm && SVm._limiter && SVm._limiter.cap === 5000, '1.7 loaded, each door exposes its limiter at cap 5000');

  sec('2  her own linked, live domain reads as direct (the chair\'s item b)');
  const own = new Set(['aarohi.in', 'www.aarohi.in']);
  ok(() => SVm.sourceOf('https://www.aarohi.in/looks/emerald', '', own) === 'direct' && SVm.sourceOf('https://aarohi.in/', '', own) === 'direct', '2.1 a referrer on her own domain (with or without www.) is direct');
  ok(() => SVm.sourceOf('https://www.aarohi.in/', '', null) === 'other' && SVm.sourceOf('https://aarohi.in.evil.com/', '', own) === 'other' && SVm.sourceOf('https://notaarohi.in/', '', own) === 'other', '2.2 without her domain, or a look-alike, it is other');
  ok(() => SVm.sourceOf('https://www.aarohi.in/', 'instagram', own) === 'instagram', '2.3 utm_source still comes first');
  const express = require('express');
  async function run(src, status) {
    const st = makeStore({ vendors: [{ id: 'sig1', routing_handle: 'SIG1', status: 'active', discover_paused: false, tier: 'signature' }],
      vendor_domains: [{ vendor_id: 'sig1', domain: 'aarohi.in', status, deleted_at: null }] });
    const M = load('src/api/public/siteVisit.js', src); const app = express(); app.use(express.json()); app.locals.supabase = st; app.set('trust proxy', true); app.use('/s', M);
    const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
    await new Promise((res) => { const rq = http.request(`http://127.0.0.1:${srv.address().port}/s/visit`, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 Safari', 'x-forwarded-for': '203.0.113.5' } }, (rs) => { rs.resume(); rs.on('end', res); }); rq.write(JSON.stringify({ code: 'sig1', page: 'home', ref: 'https://www.aarohi.in/looks' })); rq.end(); });
    await wait(80); await new Promise((r) => srv.close(r));
    return ((st.tables.site_visits_daily || [])[0] || {}).source;
  }
  const live = SVm ? await run(SV, 'live') : null; const wiring = SVm ? await run(SV, 'wiring') : null;
  ok(() => live === 'direct', '2.4 through the door: a visit from her LIVE domain counts as direct', live);
  ok(() => wiring === 'other', '2.5 a domain not yet live is not hers yet: other', wiring);
  ok(() => /sends `ref` on ENTRY only/.test(SV) && /sends `ref` on entry only/i.test(read('docs/handovers/TDW_CE47_WEB4_CUT5_HANDOVER.md')), '2.6 the door and the handover say the page sends `ref` on entry only');

  sec('3  mutations of production code, run');
  const mOwn = SV.replace("  if (ownHosts && typeof ownHosts.has === 'function' && ownHosts.has(host)) return 'direct';\n", '');
  const mv = mOwn !== SV ? await run(mOwn, 'live') : null;
  ok(() => mv === 'other', '3.1 her-domain line removed: her own visitor reads as other (2.4 reddens)', mv);
  const LIMs = read('src/lib/site/limiter.js');
  const L2 = load('src/lib/site/limiter.js', LIMs.replace('    while (map.size > cap) map.delete(map.keys().next().value);   // oldest first\n', ''));
  ok(() => { if (!L2) return false; const l = L2.makeLimiter({ cap: 100 }); for (let i = 0; i < 1000; i += 1) l.hit('a' + i, 5, 3600000); return l.size() > 100; }, '3.2 the cap line removed: the map grows past its cap (1.3 reddens)');
  const L3 = load('src/lib/site/limiter.js', LIMs.replace('    for (const [k, b] of map) if (b.until <= t) map.delete(k);\n', ''));
  await (async () => { if (!L3) return ok(false, '3.3 the expiry sweep removed'); const l = L3.makeLimiter({ cap: 50 }); for (let i = 0; i < 20; i += 1) l.hit('a' + i, 5, 5); await wait(20); l.sweep(); ok(() => l.size() === 20, '3.3 the expiry sweep removed: expired entries stay (1.2 reddens)', l.size()); })();


  // ── cut 5's items 1 to 4 over HTTP ───────────────────────────────────────────────────────────────────────────────
  for (const m of ['src/api/middleware/requireAuth.js', 'src/api/middleware/resolveVendor.js']) {
    try { const k = require.resolve(P(m)); require.cache[k] = { id: k, filename: k, loaded: true, exports: m.endsWith('resolveVendor.js') ? () => (q, r, n) => n() : (q, r, n) => n() }; } catch { /* */ }
  }
  const VEN = (id, tier, extra) => Object.assign({ id, business_name: 'Studio ' + id, category: 'makeup', city: 'Delhi', routing_handle: id.toUpperCase(), status: 'active', discover_paused: false,
    date_check_enabled: true, about: 'About', rate_min: 40000, rate_display: true, tier }, extra || {});
  const CL = (n) => `https://res.cloudinary.com/tdw/image/upload/sig1/${n}.jpg`;
  const seed = () => ({
    vendors: [VEN('basic1', 'basic'), VEN('sig1', 'signature'), VEN('pub1', 'signature'), VEN('pre1', 'prestige'), VEN('paused1', 'signature', { discover_paused: true })],
    vendor_sites: [{ vendor_id: 'pub1', published_at: '2026-09-30T00:00:00Z', style: 'noir', styles_picked: ['noir'] }, { vendor_id: 'paused1', published_at: '2026-09-30T00:00:00Z' }],
    vendor_looks: [{ id: 'lk1', vendor_id: 'pub1', slug: 'emerald', title: 'Emerald', status: 'published', published_at: '2026-09-01T00:00:00Z', position: 0, deleted_at: null }],
    vendor_look_photos: [{ id: 'f1', look_id: 'lk1', vendor_id: 'pub1', image_url: CL('one'), approval_state: 'approved', position: 0, deleted_at: null },
      { id: 'f2', look_id: 'lk1', vendor_id: 'pub1', image_url: CL('two'), approval_state: 'approved', position: 1, deleted_at: null }],
    vendor_testimonials: [{ id: 't1', vendor_id: 'pub1', author: 'Ananya', body: 'Lovely.', state: 'approved', request_id: 'r1', submitted_at: '2026-09-01T00:00:00Z', video_url: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ', deleted_at: null, position: 0 }],
    vendor_site_sections: [{ id: 'sb', vendor_id: 'pub1', key: 'band', page_id: null, shown: true, position: 30, body: { words: ['Grace'], photos: [{ url: CL('one') }], button: 'See the looks' }, deleted_at: null }],
  });
  // the JS stand-in for site_publish_draft (the SQL is rehearsed in b198r); it applies settings and sections by key
  const publishStandIn = (t, a) => {
    const d = (t.vendor_site_drafts || []).find((x) => x.vendor_id === a.p_vendor); if (!d) return { data: null, error: null };
    t.vendor_sites = t.vendor_sites || []; let row = t.vendor_sites.find((x) => x.vendor_id === a.p_vendor);
    if (!row) { row = { vendor_id: a.p_vendor }; t.vendor_sites.push(row); }
    const at = new Date().toISOString(); Object.assign(row, d.settings || {}, { published_at: at });
    t.vendor_site_sections = t.vendor_site_sections || [];
    for (const e of d.sections || []) { const ex = t.vendor_site_sections.find((x) => x.vendor_id === a.p_vendor && x.key === e.key && !x.page_id && !x.deleted_at); if (ex) Object.assign(ex, e); else t.vendor_site_sections.push(Object.assign({ id: 'sx' + e.key, vendor_id: a.p_vendor, page_id: null, deleted_at: null }, e)); }
    t.vendor_site_drafts = t.vendor_site_drafts.filter((x) => x.vendor_id !== a.p_vendor);
    return { data: at, error: null };
  };
  async function server2(store, parts) {
    const app = express(); app.use(express.json()); app.locals.supabase = store; app.set('trust proxy', true);
    let who = null; app.use((q, r, n) => { q.vendor = who; n(); });
    for (const [k, v] of Object.entries(parts)) if (v) app.use(k, v);
    const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
    const call = (m, p, body, as) => new Promise((resolve) => { who = as || null;
      const rq = http.request(`http://127.0.0.1:${srv.address().port}${p}`, { method: m, headers: { 'content-type': 'application/json' } }, (rs) => {
        let b = ''; rs.on('data', (d) => (b += d)); rs.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } resolve({ status: rs.statusCode, body: j, raw: b, headers: rs.headers }); }); });
      rq.on('error', () => resolve({ status: 0, raw: '', headers: {} })); if (body !== undefined) rq.write(JSON.stringify(body)); rq.end(); });
    return { call, close: () => new Promise((r) => srv.close(r)) };
  }
  const VC = load('src/api/public/vendorCard.js'); const SITE = load('src/api/vendor/solutions/site.js'); const KIND = load('src/api/public/siteKind.js');
  const st = makeStore(seed()); st.rpcs.site_publish_draft = publishStandIn;
  const S = VC && SITE ? await server2(st, { '/card': VC, '/site': SITE, '/kind': KIND }) : null;
  const ven = (id) => st.tables.vendors.find((x) => x.id === id);
  const room = async (id) => (await S.call('GET', '/site/room', undefined, ven(id))).body;
  const card = async (code, q) => (await S.call('GET', '/card/' + code + (q || ''))).body;

  sec('4  her draft, and Publish (the chair\'s item 1)');
  const p1 = S ? await S.call('PATCH', '/site/settings', { style: 'heritage' }, ven('sig1')) : {};
  ok(() => p1.status === 200 && !(st.tables.vendor_sites || []).some((x) => x.vendor_id === 'sig1') && st.tables.vendor_site_drafts.find((x) => x.vendor_id === 'sig1').settings.style === 'heritage', '4.1 PATCH /settings writes her draft; the live row is untouched');
  await S.call('PUT', '/site/sections', { sections: [{ key: 'band', shown: false }] }, ven('sig1'));
  const r1 = S ? await room('sig1') : null;
  ok(() => r1 && r1.room.stored.style === 'heritage' && r1.room.is_live === false && r1.room.changes.count === 3 && JSON.stringify(r1.room.changes.list) === JSON.stringify([{ area: 'settings', line: 'You changed the styles you picked.' }, { area: 'settings', line: 'You changed your style.' }, { area: 'sections', line: 'You changed the Band section.' }]), '4.2 GET /room: `stored` is the draft; changes in plain words; is_live false before the first Publish', r1 && JSON.stringify(r1.room.changes));
  const c0 = S ? await card('sig1') : null;
  ok(() => c0 && c0.card.site.v === 'classic' && c0.card.looks.length === 0, '4.3 unpublished, the public card is today\'s page (live rows only)');
  const pub = S ? await S.call('POST', '/site/publish', undefined, ven('sig1')) : {};
  const c1 = S ? await card('sig1') : null; const r2 = S ? await room('sig1') : null;
  ok(() => pub.status === 200 && pub.body.is_live === true && c1.card.site.v === 'styles' && c1.card.site.style === 'heritage' && r2.room.is_live && r2.room.changes.count === 0 && !(st.tables.vendor_site_drafts || []).some((x) => x.vendor_id === 'sig1'), '4.4 POST /publish applies the draft through site_publish_draft, the card shows it, the draft is gone');
  const pub2 = S ? await S.call('POST', '/site/publish', undefined, ven('sig1')) : {};
  ok(() => pub2.status === 400 && /no changes to publish/.test(pub2.raw), '4.5 publishing with no draft: "There are no changes to publish."');
  await S.call('PATCH', '/site/settings', { style: 'noir' }, ven('sig1')); const dis = await S.call('POST', '/site/discard', undefined, ven('sig1')); const c2 = await card('sig1');
  ok(() => dis.status === 200 && !(st.tables.vendor_site_drafts || []).some((x) => x.vendor_id === 'sig1') && c2.card.site.style === 'heritage', '4.6 POST /discard drops the draft; the live site is unchanged');
  const pg = S ? await S.call('PUT', '/site/pages', { pages: [{ title: 'Our Story' }] }, ven('pre1')) : {};
  ok(() => pg.status === 200 && !(st.tables.vendor_site_pages || []).length && st.tables.vendor_site_drafts.find((x) => x.vendor_id === 'pre1').pages[0].title === 'Our Story', '4.7 PUT /pages (Prestige) writes the draft, not the live pages');
  const SR = read('src/api/vendor/solutions/siteRoom.js');
  /* AMENDED BY LABEL, CE-47 WEB-4 cut 16 (b261): Publish now starts the style clock, its one live write (style_changed_at), after the publish */ ok(() => !/from\('vendor_sites'\)\.(upsert|insert)/.test(SR) && (SR.match(/from\('vendor_sites'\)\.update\(/g) || []).length === 1 && /from\('vendor_sites'\)\.update\(\{ style_changed_at: data \}\)/.test(SR) && !/from\('vendor_site_sections'\)\.(update|insert)/.test(SR) && !/rate_display\s*:/.test(SR.replace(/v\.rate_display/g, '')), '4.8 her room writes no live site row and never touches the prices switch (prices are not drafted)');

  sec('5  the preview (the chair\'s item 2): `?preview=<token>` and `?style=<id>`');
  await S.call('PATCH', '/site/settings', { style: 'aurora', styles_picked: ['heritage', 'aurora'] }, ven('sig1'));
  const tok = (await room('sig1')).room.preview.token; const tokOther = (await room('pub1')).room.preview.token;
  const pv = S ? await S.call('GET', '/card/sig1?preview=' + encodeURIComponent(tok)) : {};
  ok(() => pv.status === 200 && pv.body.card.site.style === 'aurora' && pv.headers['cache-control'] === 'no-store' && /noindex/.test(pv.headers['x-robots-tag'] || ''), '5.1 with her token the card serves HER DRAFT, never cached, never indexed');
  const nv = await S.call('GET', '/card/sig1'); const ov = await S.call('GET', '/card/sig1?preview=' + encodeURIComponent(tokOther)); const tv = await S.call('GET', '/card/sig1?preview=' + encodeURIComponent(tok.slice(0, -2) + 'AA'));
  ok(() => nv.body.card.site.style === 'heritage' && ov.body.card.site.style === 'heritage' && tv.body.card.site.style === 'heritage' && !nv.headers['x-robots-tag'], '5.2 without it, with another vendor\'s token, or a tampered one: the live site');
  const sv = await S.call('GET', '/card/sig1?preview=' + encodeURIComponent(tok) + '&style=heritage'); const sn = await S.call('GET', '/card/sig1?style=aurora');
  ok(() => sv.body.card.site.style === 'heritage' && sn.body.card.site.style === 'heritage', '5.3 `?style=<id>` shows a style card with her token only (a style her plan opens)');
  const PV = load('src/lib/site/preview.js');
  ok(() => PV && PV.verify(PV.issue('sig1', Date.now() - 31 * 60000).token) === null && PV.TTL_MS === 30 * 60000, '5.4 a token lives 30 minutes');

  sec('6  the site-kind door (the chair\'s item 3)');
  const k = async (c) => S.call('GET', '/kind/' + c);
  const kb = await k('basic1'); const ks = await k('sig1'); const kp = await k('pre1'); const kz = await k('paused1'); const ku = await k('nobody'); const cardMiss = await S.call('GET', '/card/nobody');
  ok(() => kb.body && kb.body.v === 'classic' && ks.body.v === 'styles' && kp.body.v === 'classic', '6.1 { v }: Basic classic; published Signature styles; unpublished Prestige classic');
  // AMENDED BY LABEL, CE-47 WEB-4 cut 14 (b208): the answer gains `ok: true` beside `v`, because the app's
  // lib/site/kind.ts takes 'styles' only when j.ok && j.v === 'styles'. Still nothing else.
  ok(() => /public, max-age=60, s-maxage=60/.test(ks.headers['cache-control'] || '') && JSON.stringify(Object.keys(ks.body)) === '["ok","v"]' && ks.body.ok === true, '6.2 a short shared cache; the answer carries only `ok` and `v`');
  ok(() => kz.status === 404 && ku.status === 404 && kz.raw === ku.raw && ku.raw === cardMiss.raw, '6.3 every miss (paused, unknown) is the card\'s one 404 body');

  sec('7  the card fields for WEB-5\'s port (the chair\'s item 4)');
  const pc = S ? await card('pub1') : null;
  ok(() => pc && pc.card.looks[0].second && pc.card.looks[0].second.url === CL('two'), '7.1 looks[].second: the second approved photograph');
  ok(() => pc.card.testimonials[0].video.poster === 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', '7.2 testimonials[].video.poster: the YouTube still from the address (m.youtube.com too)');
  const band = pc && pc.card.site.sections.find((x) => x.key === 'band');
  ok(() => Boolean(band) && (band.body.photo && band.body.photo.url === CL('one') && band.body.button === 'See the looks' && band.body.words[0] === 'Grace'), '7.3 the band\'s body: words[], photo, button', band && JSON.stringify(band.body).slice(0, 160));
  ok(() => SC_trade(pc), '7.4 site.trade carries items, item and request (row is not a field: see the card)');
  function SC_trade(c) { return c && c.card.site.trade && ['items', 'item', 'request'].every((x) => x in c.card.site.trade); }

  sec('8  mutations of items 1 to 4, run');
  const VCs = read('src/api/public/vendorCard.js');
  const VCm1 = load('src/api/public/vendorCard.js', VCs.replace("previewLib.verify(typeof req.query.preview === 'string' ? req.query.preview : null) === v.id", "previewLib.verify(typeof req.query.preview === 'string' ? req.query.preview : null) !== null"));
  { const X = await server2(st, { '/card': VCm1 }); const r = await X.call('GET', '/card/sig1?preview=' + encodeURIComponent(tokOther)); await X.close();
    ok(() => r.body.card.site.style === 'aurora', '8.1 the token\'s vendor check removed: another vendor\'s token opens her draft (5.2 reddens)'); }
  // AMENDED BY LABEL, CE-47 WEB-4 cut 6 (b199): the gate is now read first as well, so the mutation removes both lines.
  const VCm2 = load('src/api/public/vendorCard.js', VCs.replace("      if (styles && !previewOn && !(siteRow && siteRow.published_at)) styles = false;\n", '').replace("        } else if (!(sr2 && sr2.published_at)) {\n          styles = false;", "        } else if (false) {\n          styles = false;"));
  { const X = await server2(st, { '/card': VCm2 }); const r = await X.call('GET', '/card/pre1'); await X.close();
    ok(() => r.body.card.site.v === 'styles', '8.2 the published gate removed: an unpublished site goes public (4.3 reddens)'); }
  const KDm = load('src/api/public/siteKind.js', read('src/api/public/siteKind.js').replace("if (s && s.published_at) kind = 'styles';", "kind = 'styles';"));
  { const X = await server2(st, { '/kind': KDm }); const r = await X.call('GET', '/kind/pre1'); await X.close();
    ok(() => r.body.v === 'styles', '8.3 the site-kind published check removed: an unpublished Prestige reads styles (6.1 reddens)'); }

  sec('9  every column written and read, and the function, are real (0189 and the ladder)');
  const cols = {}; const add = (t, c) => { (cols[t] = cols[t] || new Set()).add(c); };
  for (const f of fs.readdirSync(P('db/migrations')).filter((x) => /^\d{4}_.*\.sql$/.test(x) && x.slice(0, 4) > '0168')) {
    const sql = read('db/migrations/' + f).split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
    // AMENDED BY LABEL, CE-47 WEB-4 cut 30: the parser also reads "IF NOT EXISTS" (0223 writes it, as 0208-0219 do)
    for (const b of sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?public\.(\w+) \(([\s\S]*?)\n\);/g)) for (const l of b[2].split('\n')) { const c = /^\s+([a-z_]+)\s+(uuid|text|integer|boolean|jsonb|timestamptz|date|bytea|numeric|text\[\]|uuid\[\])/.exec(l); if (c) add(b[1], c[1]); }
    for (const b of sql.matchAll(/ALTER TABLE public\.(\w+)([\s\S]*?);/g)) for (const c of b[2].matchAll(/ADD COLUMN (?:IF NOT EXISTS )?([a-z_]+)/g)) add(b[1], c[1]);
  }
  for (const sct of read('docs/db/PUBLIC_SCHEMA.md').split(/\n## public\./).slice(1)) { const t = sct.split(/\s/)[0]; for (const c of sct.matchAll(/\n\d+\. ([a-z_]+) /g)) add(t, c[1]); }
  add('vendor_sites', 'published_at');   // 0179's own column (in the snapshot and the ladder)
  const bad = []; for (const bag of [st.written, st.selected]) for (const [t, ks] of Object.entries(bag)) for (const k2 of ks) if (!(cols[t] && cols[t].has(k2))) bad.push(t + '.' + k2);
  ok(() => st.written.vendor_site_drafts && bad.length === 0, '9.1 every column the cut\'s doors wrote or read exists', bad.join(' '));
  const M89 = read('db/migrations/0189_site_drafts.sql');
  ok(() => /CREATE OR REPLACE FUNCTION public\.site_publish_draft\(p_vendor uuid\)/.test(M89) && /rpc\('site_publish_draft', \{ p_vendor: v\.id \}\)/.test(SR) && /GRANT EXECUTE ON FUNCTION public\.site_publish_draft\(uuid\) TO service_role;/.test(M89), '9.2 the door calls the function 0189 creates, by its name and argument; EXECUTE to service_role');

  if (S) await S.close();
  console.log(`\nb198 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.message)); console.log(`\nb198 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
