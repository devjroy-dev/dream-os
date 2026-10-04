// scripts/b208_ce47_web4_cut14_bench.js
// TDW · CE-47 · WEB-4 cut 14 · b208 — TWO SEAM BUGS FROM THE FOUNDER'S WALK.
// §1 the site-kind door answers { ok: true, v }, read through the APP'S OWN RULE (dreamos-pwa f4f227a lib/site/kind.ts:17,
//    `if (j && j.ok && j.v === 'styles') v = 'styles'`), both ways · §2 PATCH /api/v2/vendor/me takes seo_title and
//    seo_description: trimmed, empty to null, capped 70 and 200 with a plain 400, both ways · §3 mutations, run.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const Module = require('module');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
function load(r, src) { try { const m = new Module(P(r), module); m.filename = P(r); m.paths = Module._nodeModulePaths(path.dirname(P(r))); m._compile(src === undefined ? read(r) : src, P(r)); return m.exports; } catch (e) { return null; } }
const { makeStore } = require('./lib/b196_store');
// THE APP'S RULE, verbatim in substance from dreamos-pwa lib/site/kind.ts (WEB-5): only this decides 'styles'.
const appRule = (j) => { let v = 'classic'; if (j && j.ok && j.v === 'styles') v = 'styles'; return v; };
// the middlewares, stood in so the door can be driven: a session for vendor v1
require.cache[require.resolve(P('src/api/middleware/requireAuth'))] = { id: 'ra', filename: 'ra', loaded: true, exports: (req, res, next) => { req.auth = { user_id: 'auth1' }; next(); } };
require.cache[require.resolve(P('src/api/middleware/resolveVendor'))] = { id: 'rv', filename: 'rv', loaded: true, exports: () => (req, res, next) => { req.vendor = { id: 'v1', tier: 'signature' }; next(); } };

async function serve(router, store) {
  const express = require('express'); const app = express(); app.use(express.json()); app.locals.supabase = store; app.use('/d', router);
  const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
  const call = (method, p, body) => new Promise((res) => { const data = body ? JSON.stringify(body) : null;
    const rq = http.request({ host: '127.0.0.1', port: srv.address().port, path: p, method, headers: data ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } : {} }, (rs) => {
      let b = ''; rs.on('data', (d) => (b += d)); rs.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } res({ status: rs.statusCode, body: j }); }); });
    if (data) rq.write(data); rq.end(); });
  return { call, close: () => new Promise((r) => srv.close(r)) };
}
const kindRows = () => ({
  vendors: [{ id: 'v1', routing_handle: 'SWATI1', status: 'active', discover_paused: false, tier: 'prestige' },
    { id: 'v2', routing_handle: 'DRAFT2', status: 'active', discover_paused: false, tier: 'essential' },
    { id: 'v3', routing_handle: 'BASIC3', status: 'active', discover_paused: false, tier: 'basic' }],
  vendor_sites: [{ vendor_id: 'v1', published_at: '2026-10-03T14:00:00Z' }, { vendor_id: 'v2', published_at: null }, { vendor_id: 'v3', published_at: '2026-10-03T14:00:00Z' }],
});

(async () => {
  sec('1  the site switch: the door\'s answer, read through the app\'s own rule');
  const KSRC = read('src/api/public/siteKind.js');
  const tipSrc = KSRC.replace(/\n    \/\/ CE-47 WEB-4 cut 14:[^\n]*\n    \/\/[^\n]*\n    return res\.status\(200\)\.json\(\{ ok: true, v: kind \}\);/, '\n    return res.status(200).json({ v: kind });');
  const cut = await serve(load('src/api/public/siteKind.js'), makeStore(kindRows()));
  const a = await cut.call('GET', '/d/swati1'), b = await cut.call('GET', '/d/draft2'), c = await cut.call('GET', '/d/basic3'), d = await cut.call('GET', '/d/nobody');
  await cut.close();
  ok(() => a.status === 200 && JSON.stringify(a.body) === '{"ok":true,"v":"styles"}' && appRule(a.body) === 'styles', '1.1 a published Prestige site: { ok: true, v: "styles" }, and the app draws the styles site', JSON.stringify(a.body));
  ok(() => appRule(b.body) === 'classic' && b.body.ok === true && b.body.v === 'classic' && appRule(c.body) === 'classic' && c.body.v === 'classic', '1.2 unpublished, and Basic: { ok: true, v: "classic" }, and the app draws the classic page');
  ok(() => d.status === 404 && appRule(d.body) === 'classic', '1.3 no such vendor: the one 404, and the app falls to classic');
  const tip = await serve(load('src/api/public/siteKind.js', tipSrc), makeStore(kindRows()));
  const t = await tip.call('GET', '/d/swati1'); await tip.close();
  ok(() => tipSrc !== KSRC && JSON.stringify(t.body) === '{"v":"styles"}' && appRule(t.body) === 'classic', '1.4 THE BUG, shown: the door as it was answers { v: "styles" } for her published site, and the app\'s rule still draws classic', JSON.stringify(t.body));

  sec('2  PATCH /api/v2/vendor/me: the SEO pair');
  const ME = load('src/api/vendor/me.js');
  const meStore = () => makeStore({ vendors: [{ id: 'v1', business_name: 'Swati Roy Makeup', seo_title: null, seo_description: null, about: 'x' }] });
  const run = async (body, R) => { const st = meStore(); const s = await serve(R || ME, st); const r = await s.call('PATCH', '/d/', body); await s.close(); return { r, row: st.tables ? st.tables.vendors[0] : (st.db || st._db || {}).vendors[0], st }; };
  const rowOf = (st) => { const T = st.tables || st.db || st._db || st.data || st.T; return T && T.vendors ? T.vendors[0] : null; };
  let x = await run({ seo_title: '  Bridal makeup in Delhi  ', seo_description: '  Soft glam for weddings across Delhi NCR.  ' });
  ok(() => x.r.status === 200 && rowOf(x.st).seo_title === 'Bridal makeup in Delhi' && rowOf(x.st).seo_description === 'Soft glam for weddings across Delhi NCR.', '2.1 both saved, trimmed (the founder\'s refused Save now goes through)', JSON.stringify(x.r.body).slice(0, 160));
  x = await run({ seo_title: '   ', seo_description: '' });
  ok(() => x.r.status === 200 && rowOf(x.st).seo_title === null && rowOf(x.st).seo_description === null, '2.2 empty (or only spaces) is null: the card door then says it for her');
  x = await run({ seo_title: 'T'.repeat(70), seo_description: 'D'.repeat(200) });
  ok(() => x.r.status === 200 && Array.from(rowOf(x.st).seo_title).length === 70 && Array.from(rowOf(x.st).seo_description).length === 200, '2.3 exactly at the caps (70 and 200): saved whole');
  x = await run({ seo_title: 'T'.repeat(71) });
  const y = await run({ seo_description: 'D'.repeat(201) });
  ok(() => x.r.status === 400 && /Your Google title can be up to 70 characters\./.test(JSON.stringify(x.r.body)) && rowOf(x.st).seo_title === null
    && y.r.status === 400 && /Your Google description can be up to 200 characters\./.test(JSON.stringify(y.r.body)) && rowOf(y.st).seo_description === null, '2.4 one over a cap: 400 with a plain line, nothing written, never cut short');
  x = await run({ seo_title: 'é'.repeat(70) });
  ok(() => x.r.status === 200 && rowOf(x.st).seo_title === 'é'.repeat(70), '2.5 the cap counts characters as the database does, not bytes');
  x = await run({ seo_title: 12 });
  ok(() => x.r.status === 400 && /Your Google title must be text\./.test(JSON.stringify(x.r.body)), '2.6 not text: 400 with a plain line');
  const meSrc = read('src/api/vendor/me.js');
  const tipMe = load('src/api/vendor/me.js', meSrc.replace("                        'seo_title', 'seo_description',\n", ''));
  x = await run({ seo_title: 'Bridal makeup in Delhi', seo_description: 'Soft glam.' }, tipMe);
  ok(() => x.r.status === 400 && /No editable fields provided\./.test(JSON.stringify(x.r.body)), '2.7 THE BUG, shown: without the pair in the allowlist the same Save is the 400 the founder met', JSON.stringify(x.r.body));
  x = await run({ business_name: 'Swati Roy', about: 'hello' });
  ok(() => x.r.status === 200 && rowOf(x.st).seo_title === null, '2.8 a save without the pair leaves it untouched');

  sec('3  mutations, run');
  const M1 = load('src/api/vendor/me.js', meSrc.replace("    if (Array.from(t).length > cap) return errRes(res, 400, `${label} can be up to ${cap} characters.`);\n", ''));
  x = await run({ seo_title: 'T'.repeat(71) }, M1);
  ok(() => M1 && x.r.status !== 400, '3.1 the cap removed: an over-long title is not refused (2.4 reddens; the database CHECK would then answer a 500)');
  const M2 = load('src/api/vendor/me.js', meSrc.replace("    update[key] = t === '' ? null : t;\n", "    update[key] = t;\n"));
  x = await run({ seo_title: '   ' }, M2);
  ok(() => M2 && rowOf(x.st).seo_title === '', '3.2 empty kept as an empty string: 2.2 reddens (and 0147\'s CHECK would refuse it live)');

  console.log(`\nb208 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.stack || e)); console.log(`\nb208 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
