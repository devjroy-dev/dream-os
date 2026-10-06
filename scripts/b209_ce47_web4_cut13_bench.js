// scripts/b209_ce47_web4_cut13_bench.js
// TDW · CE-47 · WEB-4 cut 13 · b209 — THE STORED PHONES (option 1): the demo numbers gain their code; prospects stay in
// Meta's form. §1 withIndianCode · §2 the three demo writers store the code (the claim door driven) · §3 0194 touches only
// the two demo columns and only the two shapes · §4 prospects unchanged, and why · §5 mutations. Database proof: b209r.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const Module = require('module');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r); const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
function load(r, src) { try { const m = new Module(P(r), module); m.filename = P(r); m.paths = Module._nodeModulePaths(path.dirname(P(r))); m._compile(src === undefined ? read(r) : src, P(r)); return m.exports; } catch { return null; } }

(async () => {
  sec('1  withIndianCode: the clean-up\'s exact predicates');
  const PH = load('src/lib/phone.js'); const w = PH && PH.withIndianCode;
  ok(() => w('9876543210') === '+919876543210' && w(' 9876543210 ') === '+919876543210', '1.1 ten digits starting 6 to 9: +91 and the ten');
  ok(() => w('919876543210') === '+919876543210', '1.2 91 then ten digits starting 6 to 9: + and the twelve');
  ok(() => ['+919876543210', '+14155550100', '09812345678', '98123 45678', '5551234', '1234567890', '915551234567'].every((x) => w(x) === x.trim()), '1.3 every other shape as typed: has +, foreign, 0-prefixed, spaced, short, ten not 6-9, 91 then not 6-9');
  ok(() => w(null) === '' && w(undefined) === '' && w('') === '', '1.4 nothing in, empty out (the writers store null for that)');
  ok(() => PH && PH.toE164('9876543210') === '+919876543210' && PH.toE164('09812345678') === '+09812345678', '1.5 toE164 unchanged (and why it is not used here: it turns a 0-prefixed number into "+0...")');

  sec('2  the three demo writers store the code');
  const DA = read('src/api/admin/demoAdmin.js');
  ok(() => /const \{ withIndianCode \} = require\('\.\.\/\.\.\/lib\/phone'\);/.test(DA) && /whatsapp_phone: \(whatsapp_phone && withIndianCode\(whatsapp_phone\)\) \|\| null,/.test(DA) && /whatsapp_phone: rawPhone \? withIndianCode\(rawPhone\) : null,/.test(DA), '2.1 the admin\'s single create and its import both store whatsapp_phone through withIndianCode; empty stays null');
  const st = { rows: [] };
  const sb = { from: (t) => ({ insert: (row) => { st.rows.push({ t, row }); return { throwOnError: async () => ({ data: null, error: null }) }; } }) };
  const express = require('express'); const app = express(); app.use(express.json()); app.locals.supabase = sb;
  const V = load('src/api/demo/vendor.js'); if (V) app.use('/demo/vendor', V);
  const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
  const post = (p, body) => new Promise((res) => { const d = JSON.stringify(body); const rq = http.request({ host: '127.0.0.1', port: srv.address().port, path: p, method: 'POST', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(d) } }, (rs) => { let b = ''; rs.on('data', (c) => (b += c)); rs.on('end', () => res({ status: rs.statusCode, body: b })); }); rq.write(d); rq.end(); });
  const r1 = await post('/demo/vendor/studio_a/claim', { phone: '9876501199', vendor_name: 'Studio A' });
  const r2 = await post('/demo/vendor/studio_b/claim', { phone: '+14155550100', vendor_name: 'Studio B' });
  await new Promise((r) => srv.close(r));
  ok(() => r1.status === 200 && st.rows[0] && st.rows[0].t === 'demo_claim_requests' && st.rows[0].row.phone === '+919876501199', '2.2 the claim door, driven: a ten-digit number is stored +91', JSON.stringify(st.rows[0]));
  ok(() => r2.status === 200 && st.rows[1] && st.rows[1].row.phone === '+14155550100', '2.3 a number already with its code is stored as given');

  sec('3  0194: the two demo columns, the two shapes, nothing else');
  const M = read('db/migrations/0194_demo_phones_with_code.sql'); const code = M.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
  const ups = code.match(/^UPDATE .*;$/gm) || [];
  ok(() => ups.length === 4 && ups.every((u) => /^UPDATE public\.(demo_vendors|demo_claim_requests)\s/.test(u)), '3.1 four UPDATEs, on demo_vendors and demo_claim_requests only');
  ok(() => ups.filter((u) => /'\+91' \|\| (\w+)\s+WHERE \1\s+~ '\^\[6-9\]\[0-9\]\{9\}\$';$/.test(u)).length === 2 && ups.filter((u) => /'\+'\s+\|\| (\w+)\s+WHERE \1\s+~ '\^91\[6-9\]\[0-9\]\{9\}\$';$/.test(u)).length === 2, '3.2 each guarded by its exact shape (the founder\'s counts); a re-run finds neither shape');
  ok(() => !/prospects/i.test(code) && !/\b(DELETE|INSERT|DROP|ALTER)\b/i.test(code) && /^BEGIN;$/m.test(code) && /^COMMIT;$/m.test(code), '3.3 no prospects, no delete, insert or schema change; one transaction');

  sec('4  prospects stay in Meta\'s form');
  ok(() => /phone: normalizeTo\(phone\),/.test(read('src/lib/prospects.js')) && /\.eq\('phone', normalizeTo\(phone\)\)\.maybeSingle\(\)/.test(read('src/lib/prospects.js')), '4.1 the prospects writer and its lookup are unchanged: the lane keys on Meta\'s form');
  ok(() => /NOT prospects\.phone: the prospects lane stores numbers in Meta's own form/.test(M), '4.2 0194 says why prospects is left alone');

  sec('5  mutations, run');
  const M1 = load('src/lib/phone.js', read('src/lib/phone.js').replace("if (/^91[6-9][0-9]{9}$/.test(s)) return `+${s}`;", ''));
  ok(() => M1 && M1.withIndianCode('919876543210') === '919876543210', '5.1 the twelve-digit shape dropped from the helper: 1.2 reddens');
  const M2 = load('src/lib/phone.js', read('src/lib/phone.js').replace('return s;\n}', "return s ? '+' + s.replace(/\\D/g, '') : s;\n}"));
  ok(() => M2 && M2.withIndianCode('09812345678') === '+09812345678', '5.2 a guessing helper (toE164\'s habit): 1.3 reddens');

  console.log(`\nb209 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.stack || e)); console.log(`\nb209 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
