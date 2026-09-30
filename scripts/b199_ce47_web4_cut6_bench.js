// scripts/b199_ce47_web4_cut6_bench.js
// TDW · CE-47 · WEB-4 cut 6 · b199 — §1 an unpublished paid vendor's card skips every site read (item b) · §2 Publish
// keeps each page's row (item a; 0190, rehearsed in scripts/lib/b199r_0190_rehearse.sh) · §3 mutations, run.
// (The panel's two doors and site.trade.row join this rung when their contracts arrive.) Red on a tree without the cut.
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
const SITE_TABLES = ['vendor_site_sections', 'vendor_site_pages', 'vendor_looks', 'vendor_look_photos', 'vendor_collections', 'vendor_collection_looks', 'vendor_testimonials', 'vendor_site_faq', 'vendor_site_drafts'];

(async () => {
  const express = require('express');
  const V = (id, tier) => ({ id, business_name: 'S ' + id, category: 'makeup', city: 'Delhi', routing_handle: id.toUpperCase(), status: 'active', discover_paused: false, tier, rate_display: true, rate_min: 40000 });
  const seed = () => ({ vendors: [V('basic1', 'basic'), V('sig1', 'signature'), V('pub1', 'signature')],
    vendor_sites: [{ vendor_id: 'sig1', style: 'noir' }, { vendor_id: 'pub1', style: 'noir', published_at: '2026-09-30T00:00:00Z' }] });
  async function measure(src, code) {
    const st = makeStore(seed()); const VC = load('src/api/public/vendorCard.js', src); if (!VC) return null;
    const app = express(); app.locals.supabase = st; app.use('/card', VC);
    const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
    st.meter.waves = 0; st.calls.length = 0;
    const body = await new Promise((res) => http.get(`http://127.0.0.1:${srv.address().port}/card/${code}`, (rs) => { let b = ''; rs.on('data', (d) => (b += d)); rs.on('end', () => res(b)); }));
    await new Promise((r) => srv.close(r));
    let card = null; try { card = JSON.parse(body).card; } catch { /* */ }
    return { waves: st.meter.waves, siteReads: st.calls.filter((c) => SITE_TABLES.includes(c.table)).length, card };
  }
  const SRC = read('src/api/public/vendorCard.js');

  sec('1  published_at decided first: an unpublished paid vendor\'s card skips the site reads (item b)');
  const b = await measure(SRC, 'basic1'); const u = await measure(SRC, 'sig1'); const p = await measure(SRC, 'pub1');
  ok(() => u && u.siteReads === 0 && u.card.site.v === 'classic', '1.1 unpublished Signature: zero reads of the site tables, today\'s page', u && JSON.stringify({ reads: u.siteReads, v: u.card && u.card.site.v }));
  ok(() => u.waves === b.waves, '1.2 ...and it awaits exactly as many stages as a Basic card', `basic ${b && b.waves}, unpublished ${u && u.waves}`);
  ok(() => p && p.siteReads >= 6 && p.card.site.v === 'styles' && p.waves - b.waves >= 1 && p.waves - b.waves <= 2, '1.3 a published site still reads them, in at most two stages more (the second only when she has looks or collections)', p && JSON.stringify({ reads: p.siteReads, waves: p.waves }));
  const VC = load('src/api/public/vendorCard.js');
  ok(() => VC && VC.SITE_SELECT === 'look, pages, credit_shown, published_at', '1.4 the gate rides the row the card already reads (SITE_SELECT), no extra read');

  sec('2  Publish keeps a page\'s row (item a; 0190)');
  const M = read('db/migrations/0190_site_publish_pages_in_place.sql'); const body = M.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
  ok(() => /CREATE OR REPLACE FUNCTION public\.site_publish_draft\(p_vendor uuid\)/.test(body) && /WHERE vendor_id = p_vendor AND slug = e->>'slug' AND deleted_at IS NULL;/.test(body) && /NOT \(slug = ANY \(slugs\)\)/.test(body), '2.1 0190: pages updated in place by slug; only slugs absent from the draft soft-deleted');
  ok(() => !/UPDATE public\.vendor_site_pages SET deleted_at = at WHERE vendor_id = p_vendor AND deleted_at IS NULL;/.test(body) && !/search_path/.test(body) && /GRANT EXECUTE ON FUNCTION public\.site_publish_draft\(uuid\) TO service_role;/.test(body), '2.2 no blanket delete of her pages; no search_path; EXECUTE to service_role only');
  ok(() => fs.existsSync(P('scripts/lib/b199r_0190_rehearse.sh')) && /the kept page keeps its row \(same id\)/.test(read('scripts/lib/b199r_0190_rehearse.sh')), '2.3 the rehearsal proves it on Postgres (same id; its section still tied; the absent page soft-deleted)');

  sec('3  mutations, run');
  const mut = SRC.replace("      if (styles && !previewOn && !(siteRow && siteRow.published_at)) styles = false;\n", '');
  const m = mut !== SRC ? await measure(mut, 'sig1') : null;
  ok(() => m && m.siteReads > 0, '3.1 the early gate removed: the unpublished card reads the site tables again (1.1 reddens)', m && m.siteReads);

  console.log(`\nb199 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.message)); console.log(`\nb199 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
