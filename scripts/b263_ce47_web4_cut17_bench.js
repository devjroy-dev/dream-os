// scripts/b263_ce47_web4_cut17_bench.js
// TDW · CE-47 · WEB-4 cut 17 · b263 — THE TWO-MINUTE START'S SERVER HALF (no migration: 0195's columns are live).
// §1 built_from_instagram opens at Basic · §2 the source writers · §3 her own site shows her Instagram look photographs at
// once; Discover keeps its gate · §4 the package field on the enquiry door · §5 the register's 0197 · §6 mutations.
'use strict';
const fs = require('fs'); const path = require('path'); const Module = require('module');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r); const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
function load(r, src) { try { const m = new Module(P(r), module); m.filename = P(r); m.paths = Module._nodeModulePaths(path.dirname(P(r))); m._compile(src === undefined ? read(r) : src, P(r)); return m.exports; } catch { return null; } }
const { makeStore } = require('./lib/b196_store');

(async () => {
  sec('1  built_from_instagram opens at Basic (the chair, 6 October)');
  const M = load('src/lib/site/siteModel.js');
  ok(() => M.capabilitiesFor('basic').built_from_instagram === true && !('built_from_instagram' in M.capabilitiesFor('basic').opens), '1.1 Basic: built_from_instagram true, and not in her locked list');
  ok(() => M.capabilitiesFor('basic').styles === 1 && M.capabilitiesFor('basic').opens.palettes === 'Essential' && M.capabilitiesFor('basic').opens.own_domain === 'Signature', '1.2 Basic\'s other locks unchanged (one style; palettes Essential; own domain Signature)');

  sec('2  the source writers');
  const PF = load('src/lib/vendor/portfolio.js');
  const st = makeStore({ vendor_portfolio: [] });
  const a = await PF.registerImage(st, 'v1', { image_url: 'https://res.cloudinary.com/x/a.jpg' });
  const b = await PF.registerImage(st, 'v1', { image_url: 'https://res.cloudinary.com/x/b.jpg', source: 'instagram', approval_state: 'approved' });
  const c = await PF.registerImage(st, 'v1', { image_url: 'https://res.cloudinary.com/x/c.jpg', source: 'tiktok' });
  ok(() => a.ok && st.tables.vendor_portfolio[0].source === 'upload' && b.ok && st.tables.vendor_portfolio[1].source === 'instagram', '2.1 registerImage writes source: upload by default, instagram when the import says so', JSON.stringify(st.tables.vendor_portfolio.map((r) => r.source)));
  ok(() => c.ok === false && /source must be upload or instagram/.test(c.error) && st.tables.vendor_portfolio.length === 2, '2.2 any other source is refused, nothing written');
  ok(() => /source: 'instagram',   \/\/ CE-47 WEB-4 cut 17/.test(read('src/lib/vendor/igImport.js')), '2.3 the Instagram import marks its photographs instagram');
  const SR = read('src/api/vendor/solutions/siteRoom.js');
  ok(() => (SR.match(/select\('id, image_url, approval_state, source'\)/g) || []).length === 2 && /position: have\.length, approval_state, source \}\)/.test(SR), '2.4 a look photo carries its portfolio photograph\'s source (both ways she adds one)');

  sec('3  her own site: her Instagram look photographs at once; Discover keeps its gate');
  const SC = load('src/lib/site/siteCard.js');
  const looks = [{ id: 'l1', slug: 'a', title: 'A', status: 'published', published_at: '2026-09-01T00:00:00Z', position: 0 }];
  const ph = (id, state, source) => ({ id, look_id: 'l1', image_url: `https://res.cloudinary.com/tdw/image/upload/x/${id}.jpg`, approval_state: state, source, position: id.length });
  const page = (rows) => SC.lookPage({ tier: 'basic', slug: 'a', looks, lookPhotos: rows, vendor: { routing_handle: 'S', status: 'active' }, packageRows: [] });
  const shown = (rows) => { const p = page(rows); return p ? (p.photos || p.look && p.look.photos || []).length : -1; };
  ok(() => shown([ph('ig', 'pending', 'instagram')]) === 1, '3.1 a PENDING Instagram photograph shows on her own site at once', JSON.stringify(page([ph('ig', 'pending', 'instagram')])).slice(0, 160));
  ok(() => shown([ph('ig', 'pending', 'instagram'), ph('up', 'pending', 'upload')]) === 1 && shown([ph('ig', 'rejected', 'instagram')]) !== 1, '3.2 a pending UPLOAD waits for the queue; a rejected photograph never shows');
  const VC = read('src/api/public/vendorCard.js');
  ok(() => (VC.match(/\.in\('approval_state', \['approved', 'pending'\]\)/g) || []).length === 2 && /approval_state, source, deleted_at';/.test(VC), '3.3 her card reads approved and pending look photos with their source (the filter is her site\'s rule)');
  ok(() => /\.from\('vendor_portfolio'\)\s*\.select\(PORTFOLIO_SELECT\)\s*\.eq\('vendor_id', v\.id\)\s*\.eq\('approval_state', 'approved'\)/.test(VC) && /approval_state/.test(read('src/lib/vendor/discover.js')), '3.4 the portfolio (Discover\'s and the card\'s) keeps its approval gate for every source');

  sec('4  the package field on the website enquiry door');
  const E = load('src/lib/website/enquiry.js'); const now = Date.parse('2026-10-06T06:00:00Z');
  const base = { name: 'Riya', phone_e164: '+919812345678', country: 'IN', occasion: 'Wedding', consent: true, consent_version: 'enq-2026-09-30', page: { kind: 'other', title: 'Pricing' } };
  const e1 = E.checkEnquiry(Object.assign({}, base, { package: '  Every function, with a trial  ' }), now);
  const e2 = E.checkEnquiry(base, now);
  const e3 = E.checkEnquiry(Object.assign({}, base, { package: 'x'.repeat(81) }), now);
  ok(() => e1.ok && e1.ok.package === 'Every function, with a trial' && e2.ok && e2.ok.package === null, '4.1 optional, trimmed; absent is null', JSON.stringify(e1).slice(0, 160));
  ok(() => e3.field === 'package' && /Choose a package from the list\./.test(e3.error), '4.2 over 80 characters: refused by name', JSON.stringify(e3));
  ok(() => E.firstLine(e1.ok) === 'Website enquiry: Wedding, no date, from Pricing, about Every function, with a trial.' && E.firstLine(e2.ok) === 'Website enquiry: Wedding, no date, from Pricing.', '4.3 the thread\'s first line names the package; without one it is unchanged');

  sec('5  the register: 0197 after 0195');
  const R = JSON.parse(read('db/migrations/OUT_OF_ORDER.json')).register;
  ok(() => JSON.stringify(R.map((r) => r.number)) === '[183,204,196,200,208,209,205,195,197]' && /CLB-2a · THE COLLAB ROLE LIST/.test(R[8].note) && /collab_house_tokens/.test(R[8].stale_for) && /^OWED/.test(R[8].state), '5.1 0197\'s record, last, in history order (CLB-2a, server train 4)');

  sec('6  mutations, run');
  const MS = read('src/lib/site/siteModel.js');
  const M1 = load('src/lib/site/siteModel.js', MS.replace('own_domain: 2, built_from_instagram: 0,', 'own_domain: 2, built_from_instagram: 1,'));
  ok(() => M1 && M1.capabilitiesFor('basic').built_from_instagram === false, '6.1 the flag back at Essential: 1.1 reddens');
  const SS = read('src/lib/site/siteCard.js');
  const S2 = load('src/lib/site/siteCard.js', SS.replace("|| (r.approval_state === 'pending' && r.source === 'instagram')", ''));
  ok(() => { if (!S2 || S2 === SC) return false; const p2 = S2.lookPage({ tier: 'basic', slug: 'a', looks, lookPhotos: [ph('ig', 'pending', 'instagram')], vendor: { routing_handle: 'S', status: 'active' }, packageRows: [] }); return p2 === null || (p2.photos || (p2.look && p2.look.photos) || []).length === 0; }, '6.2 the Instagram arm removed: her pending Instagram photograph waits again (3.1 reddens)');

  console.log(`\nb263 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.stack || e)); console.log(`\nb263 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
