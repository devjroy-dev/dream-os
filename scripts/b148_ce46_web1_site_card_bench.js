// scripts/b148_ce46_web1_site_card_bench.js
// TDW · CE-46 · WEB-1 cut 4 · b148 — THE SITE'S DATA: 0179, THE TIER RULES, PACKAGES AND `site` ON THE PUBLIC CARD.
// §1 siteModel driven whole · §2 publicPackages driven · §3 the tier never on the wire · §4 the door's reads,
// guarded · §5 0179 · §6 mutations. No network, no database; 0179 is rehearsed by scripts/lib/b148r_0179_rehearse.sh.
'use strict';
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r); const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { if (c) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
function fresh(r) { const k = require.resolve(P(r)); delete require.cache[k]; return require(k); }
const Module = require('module');
function freshFrom(r, src) { const m = new Module(P(r), module); m.filename = P(r); m.paths = Module._nodeModulePaths(path.dirname(P(r))); m._compile(src, P(r)); return m.exports; }
const S = fresh('src/lib/site/siteModel.js');

(async () => {
sec('1  the tier rules (R-46.9 as ruled 28 September), driven');
ok(S.lookFor('basic', 'makeup', { look: 'atelier' }) === 'bloom' && S.lookFor('basic', 'photography', null) === 'quiet', '1.1 Basic: one look, her trade\'s, whatever her row says');
ok(S.lookFor('essential', 'makeup', { look: 'atelier' }) === 'atelier' && S.lookFor('essential', 'makeup', null) === 'bloom', '1.2 Essential and up: her pick, else her trade\'s');
const tm = S.TRADE_LOOK;
ok(['photography', 'content_creator', 'other'].every((c) => tm[c] === 'quiet') && ['makeup', 'hairstylist', 'designer', 'jewellery'].every((c) => tm[c] === 'bloom') && ['decor', 'venue_catering', 'planning', 'performer'].every((c) => tm[c] === 'atelier') && Object.keys(tm).length === 11, '1.3 the trade map is the founder\'s, all eleven categoryProfiles keys');
ok(S.tradeLook('unknown_trade') === 'quiet' && S.lookFor('essential', 'makeup', { look: 'neon' }) === 'bloom', '1.4 an unknown trade reads quiet; a look outside the three is ignored');
ok(JSON.stringify(S.pagesFor('basic', null)) === JSON.stringify(['home', 'portfolio', 'weddings', 'packages', 'about', 'contact']) && JSON.stringify(S.pagesFor('essential', null)) === JSON.stringify(S.pagesFor('basic', null)), '1.5 Basic and Essential: the five pages (Work as Portfolio and Weddings)');
ok(S.pagesFor('signature', null).includes('reviews') && !S.pagesFor('signature', null).includes('stories') && ['stories', 'faq', 'book'].every((p) => S.pagesFor('prestige', null).includes(p)), '1.6 Signature adds Reviews; Prestige adds Stories, FAQ, Book a consultation');
ok(JSON.stringify(S.pagesFor('prestige', { pages: [{ key: 'about' }, { key: 'faq', shown: false }, { key: 'home' }] }).slice(0, 2)) === JSON.stringify(['about', 'home']) && !S.pagesFor('prestige', { pages: [{ key: 'faq', shown: false }] }).includes('faq'), '1.7 her order leads and her hidden pages stay hidden');
const row = { pages: [{ key: 'stories' }, { key: 'reviews' }, { key: 'about' }] };
ok(!S.pagesFor('essential', row).includes('stories') && !S.pagesFor('essential', row).includes('reviews') && S.pagesFor('essential', row)[0] === 'about' && S.pagesFor('prestige', row).includes('stories'), '1.8 a downgrade HIDES the pages above her tier and keeps her row; an upgrade brings them back');
ok(S.pagesFor('essential', { pages: [{ key: 'home', shown: false }, { key: 'contact', shown: false }] }).includes('home') && S.pagesFor('essential', { pages: [{ key: 'contact', shown: false }] }).includes('contact'), '1.9 Home and Contact cannot be hidden (Contact carries WhatsApp: no page without it)');
// AMENDED BY LABEL, CE-46 WEB-4 cut 2 (W4-b; the WEB-4 brief §1 and design system §7, 30 September 2026): the credit is
// shown on Basic, Essential and Signature and removable on Prestige ONLY; was "removable on Signature, removed on Prestige".
ok(S.creditFor('basic', { credit_shown: false }) === true && S.creditFor('essential', { credit_shown: false }) === true && S.creditFor('signature', { credit_shown: false }) === true && S.creditFor('signature', null) === true && S.creditFor('prestige', null) === true && S.creditFor('prestige', { credit_shown: false }) === false, '1.10 the credit: shown on Basic, Essential and Signature; removable on Prestige only (W4-b)');
ok(S.tierOf('gold') === 'basic' && S.lookFor(undefined, 'makeup', { look: 'atelier' }) === 'bloom', '1.11 an unknown tier reads as Basic: never more than she has');

sec('2  packages as couples see them (F-44.241), driven');
const VC = fresh('src/api/public/vendorCard.js');
const rows = [{ name: 'One day', description: 'Two photographers', line_items: [{ label: 'Film', detail: '4 minutes' }, 'Album', { detail: 'no label' }], total: 185000, is_default: true }, { name: '', description: 'x', line_items: [], total: 1 }];
const on = VC.publicPackages(rows, true), off = VC.publicPackages(rows, false);
ok(on.length === 1 && on[0].total === 185000 && JSON.stringify(on[0].items) === JSON.stringify([{ label: 'Film', detail: '4 minutes' }, { label: 'Album', detail: null }]), '2.1 name, description, total, and the line items\' words; a nameless row and a labelless item are dropped');
ok(off[0].total === null && off[0].items.length === 2, '2.2 her rate switch off: every total null (the startingPrice rule), the words still shown');
ok(JSON.stringify(Object.keys(on[0]).sort()) === JSON.stringify(['description', 'items', 'name', 'total']), '2.3 nothing else of a package row leaves the server (no deposit, no delivery terms, no ids)');
ok(VC.PACKAGE_SELECT === 'name, description, line_items, total, is_default, created_at', '2.4 the packages select is an allowlist');

sec('3  the tier never on the wire');
const site = VC.siteFor('prestige', 'makeup', { look: 'atelier', pages: [], credit_shown: true }, 'aarohisen.in');
// AMENDED BY LABEL, CE-47 WEB-4 cut 3 (b161; CE-47's ruling 4): Basic's `site` gains only `v: 'classic'`.
ok(JSON.stringify(Object.keys(site).sort()) === JSON.stringify(['credit', 'domain', 'look', 'pages', 'v']) && site.v === 'classic' && site.domain === 'aarohisen.in' && site.credit === true, '3.1 `site` is exactly look, pages, credit, domain');   // AMENDED BY LABEL (W4-b): Prestige with credit_shown true now SHOWS the credit
const c = VC.card({ business_name: 'x', category: 'makeup', handle: 'dev440', packages: on, site });
function keysDeep(o, acc = []) { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { acc.push(k); keysDeep(v, acc); } return acc; }
ok(!keysDeep(c).includes('tier') && !keysDeep(c).includes('site_tier'), '3.2 no key anywhere in the card, at any depth, is tier');
// AMENDED BY LABEL, CE-47 WEB-4 cut 3 (b161): the default site names its shape, v 'classic', first.
ok(JSON.stringify(VC.card({ business_name: 'x', category: 'decor', handle: 'y' }).site) === JSON.stringify({ v: 'classic', look: 'atelier', pages: ['home', 'portfolio', 'weddings', 'packages', 'about', 'contact'], credit: true, domain: null }) && JSON.stringify(VC.card({ handle: 'y' }).packages) === '[]', '3.3 a card built without them (the demo leg) gets the default site from its trade and no packages');
// AMENDED BY LABEL, CE-47 WEB-4 cut 3 (b196; the chair's point 3): Basic's card gains five fields and they are pinned
// by VALUE here (b44 pins them by NAME): four empty lists and Eliza's plan words, from the route's own Basic branch.
{ const SC = require(path.join(ROOT, 'src/lib/site/siteCard.js'));
  const basic = VC.card({ business_name: 'x', category: 'makeup', handle: 'y', eliza: SC.elizaFor('basic') });
  ok(JSON.stringify([basic.looks, basic.collections, basic.testimonials, basic.faq, basic.eliza]) === JSON.stringify([[], [], [], [], { live_booking: 'not_in_plan', own_voice: 'not_in_plan' }]),
    '3.3b Basic gains exactly: looks [], collections [], testimonials [], faq [], eliza { not_in_plan, not_in_plan }'); }
ok(VC.VENDOR_SELECT.split(', ').includes('tier') && VC.CARD_KEYS.includes('packages') && VC.CARD_KEYS.includes('site') && !VC.CARD_KEYS.includes('tier'), '3.4 tier is read (VENDOR_SELECT) and not a card key');

sec('4  the door\'s three new reads, each guarded');
const src = read('src/api/public/vendorCard.js');
ok(/from\('vendor_packages'\)\.select\(PACKAGE_SELECT\)\s*\n\s*\.eq\('vendor_id', v\.id\)\.is\('deleted_at', null\)\s*\n\s*\.order\('is_default', \{ ascending: false \}\)\.order\('created_at', \{ ascending: true \}\)/.test(src), '4.1 packages: hers, not deleted, default first then oldest');
ok(/from\('vendor_sites'\)\.select\(SITE_SELECT\)\.eq\('vendor_id', v\.id\)\.maybeSingle\(\)/.test(src) && VC.SITE_SELECT === 'look, pages, credit_shown, published_at' /* AMENDED BY LABEL, CE-47 WEB-4 cut 6 (b199): the publish gate is read first */, '4.2 her site row: three columns, hers');
ok(/from\('vendor_domains'\)\.select\(DOMAIN_SELECT\)\.eq\('vendor_id', v\.id\)\.eq\('status', 'live'\)\.is\('deleted_at', null\)\.limit\(1\)/.test(src), '4.3 her domain: only a LIVE one (the canonical\'s domain field, for cut 5)');
ok((src.match(/catch \(_(pk|sr|dr)Err\)/g) || []).length === 3, '4.4 each read is in its own try: a missing table (0178 not yet applied) or row gives the default, never a 500 on her page');
// AMENDED BY LABEL, CE-47 WEB-4 cut 3 (b161): Basic's packages and site are still today's (publicPackages, siteFor);
// Essential and up take the styles site from siteCard. The cell reads both branches of the one call site.
ok(/const classic = publicPackages\(pkgRows, v\.rate_display\);/.test(src) && /if \(!styles\) return \{ packages: classic, site: siteFor\(v\.tier, v\.category, siteRow, liveDomain\)/.test(src) && /siteCardLib\.siteCard\(/.test(src), '4.5 the live card carries them (Basic as today; Essential and up through siteCard)');

sec('5  0179');
const mig = read('db/migrations/0179_vendor_sites.sql');
ok(['vendor_sites', 'vendor_stories', 'vendor_testimonials'].every((t) => new RegExp(`CREATE TABLE public\\.${t} \\(`).test(mig) && new RegExp(`ALTER TABLE public\\.${t} ENABLE ROW LEVEL SECURITY;`).test(mig)), '5.1 three tables, each with RLS enabled (SEC-1)');
ok(/^BEGIN;/m.test(mig) && mig.lastIndexOf('ENABLE ROW LEVEL SECURITY') < mig.indexOf('COMMIT;') && !/CREATE POLICY/.test(mig), '5.2 all inside one transaction; no policy (service_role bypasses)');
ok(/GRANT SELECT, INSERT, UPDATE, DELETE ON public\.vendor_sites, public\.vendor_stories, public\.vendor_testimonials TO service_role;/.test(mig), '5.3 A-45.8: the four privileges to service_role, in the file');
ok(/vendor_id\s+uuid NOT NULL UNIQUE REFERENCES public\.vendors\(id\)/.test(mig) && /look\s+text CHECK \(look IS NULL OR look IN \('quiet', 'bloom', 'atelier'\)\)/.test(mig) && /credit_shown\s+boolean NOT NULL DEFAULT true/.test(mig), '5.4 one site row per vendor; the look is one of three or none; the credit shown by default');
ok(/consented_at\s+timestamptz NOT NULL/.test(mig) && /UNIQUE \(vendor_id, slug\)/.test(mig), '5.5 a testimonial cannot exist without its consent time; a story\'s slug is unique per vendor');

sec('5b  the look-saving door (GET /site, POST /site/look), over HTTP');
await (async () => {
  const http = require('http'); const express = require('express');
  for (const m of ['src/api/middleware/requireAuth.js', 'src/api/middleware/resolveVendor.js']) { const k = require.resolve(P(m)); require.cache[k] = { id: k, filename: k, loaded: true, exports: m.endsWith('requireAuth.js') ? (q, r, n) => n() : () => (q, r, n) => n() }; }
  const rows = {}; const writes = [];
  const sb = { from(t) { if (t !== 'vendor_sites') throw new Error('UNDECLARED TABLE ' + t); const q = { f: {} };
    q.select = () => q; q.eq = (c, v) => { q.f[c] = v; return q; }; q.maybeSingle = async () => ({ data: rows[q.f.vendor_id] || null, error: null });
    q.upsert = async (row, opt) => { if (!opt || opt.onConflict !== 'vendor_id') return { error: { message: 'no conflict target' } }; writes.push(row); rows[row.vendor_id] = { ...(rows[row.vendor_id] || {}), ...row }; return { error: null }; };
    return q; } };
  let vendor = { id: 'v-1', tier: 'basic', category: 'makeup' };
  const app = express(); app.use(express.json()); app.locals.supabase = sb;
  app.use('/s', (q, r, n) => { q.vendor = vendor; n(); }, fresh('src/api/vendor/solutions/site.js'));
  const server = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); }); const B = 'http://127.0.0.1:' + server.address().port;
  const call = (m, p, body) => new Promise((resolve) => { const rq = http.request(B + p, { method: m, headers: { 'content-type': 'application/json' } }, (rs) => { let b = ''; rs.on('data', (d) => (b += d)); rs.on('end', () => resolve({ status: rs.statusCode, body: JSON.parse(b || '{}') })); }); if (body) rq.write(JSON.stringify(body)); rq.end(); });
  const g1 = await call('GET', '/s');
  ok(g1.status === 200 && g1.body.site.look === 'bloom' && g1.body.site.looks_open === false && g1.body.site.trade_look === 'bloom' && JSON.stringify(g1.body.site.looks) === '["quiet","bloom","atelier"]', '5b.1 Basic (makeup): her trade\'s look, looks_open false');
  const p1 = await call('POST', '/s/look', { look: 'atelier' });
  ok(p1.status === 403 && writes.length === 0 && /More looks are available on Essential\./.test(JSON.stringify(p1.body)), '5b.2 Basic cannot change her look: 403 with the plain line, nothing written');
  vendor = { id: 'v-1', tier: 'essential', category: 'makeup' };
  const p2 = await call('POST', '/s/look', { look: 'atelier' });
  ok(p2.status === 200 && p2.body.site.look === 'atelier' && p2.body.site.looks_open === true && writes.length === 1 && writes[0].look === 'atelier', '5b.3 Essential saves a look (one upsert on vendor_id) and the answer reads it back');
  const p3 = await call('POST', '/s/look', { look: 'neon' });
  ok(p3.status === 400 && writes.length === 1, '5b.4 a look outside the three is refused, nothing written');
  vendor = { id: 'v-1', tier: 'basic', category: 'makeup' };
  const g2 = await call('GET', '/s');
  ok(g2.body.site.look === 'bloom', '5b.5 a downgrade to Basic shows her trade\'s look again; her saved pick is kept for an upgrade');
  ok(!JSON.stringify(g2.body).includes('"tier"'), '5b.6 the answer carries looks_open, never the tier itself');
  server.close();
})();
const IDX = read('src/api/vendor/solutions/index.js');
ok(/router\.use\('\/site', require\('\.\/site'\)\);/.test(IDX) && (read('src/api/vendor/solutions/site.js').match(/requireAuth, resolveVendor\(\)/g) || []).length === 2, '5b.7 mounted under solutions; both doors behind requireAuth then resolveVendor()');

sec('6  mutations, each in memory');
const mS = freshFrom('src/lib/site/siteModel.js', read('src/lib/site/siteModel.js').replace("return looksOpen(tier) && picked ? picked : tradeLook(category);", "return picked || tradeLook(category);"));
ok(mS.lookFor('basic', 'makeup', { look: 'atelier' }) === 'atelier', '6.1 the looks gate removed: Basic picks freely, 1.1 reddens');
const mS2 = freshFrom('src/lib/site/siteModel.js', read('src/lib/site/siteModel.js').replace("if (!key || !allowed.includes(key) || ordered.some((o) => o.key === key)) continue;", "if (!key || ordered.some((o) => o.key === key)) continue;"));
ok(mS2.pagesFor('essential', row).includes('stories'), '6.2 the tier filter removed: a downgrade shows Prestige pages, 1.8 reddens');
ok(!/ENABLE ROW LEVEL SECURITY/.test(mig.replace(/ALTER TABLE public\.\w+ ENABLE ROW LEVEL SECURITY;\n/g, '')), '6.3 the RLS lines removed: 5.1 reddens');
ok(VC.publicPackages(rows, false)[0].total === null && freshFrom('src/api/public/vendorCard.js', src.replace("total: rate_display === false ? null : (Number.isFinite(r.total) ? r.total : null),", "total: r.total,")).publicPackages(rows, false)[0].total === 185000, '6.4 the rate switch ignored: a hidden price is published, 2.2 reddens');

console.log(`\nb148 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('b148 crashed:', e); process.exit(2); });
