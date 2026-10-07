// scripts/b265_ce47_web4_cut20_bench.js
// TDW · CE-47 · WEB-4 cut 20 · b265 — THE INSTAGRAM RETURN FOR THE TWO-MINUTE START (option A, the chair's ruling).
// authorize accepts return=start (the ONLY extra value); the signed state carries r:'start'; the callback returns her to
// /vendor/onboarding with the usual ?ig= result. THE HARD LINE: the redirect URI, the scopes and sign() byte-equal to
// main's (the base, 68b6568); a state minted without the field built exactly as before; a state minted BEFORE this cut
// still verifies; an unlisted or missing value behaves as today. §1 the hard line · §2 the state · §3 the doors over
// HTTP · §4 mutations. No timing cell: no fixed pause, nothing order-dependent.
'use strict';
process.env.IG_APP_ID = process.env.IG_APP_ID || '1234567890'; process.env.IG_APP_SECRET = process.env.IG_APP_SECRET || 'bench-secret';
process.env.IG_REDIRECT_URI = process.env.IG_REDIRECT_URI || 'https://api.example.test/api/v2/vendor/ig/callback';
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'x'; process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'x'; process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'x';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://bench.invalid.supabase.co'; process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench';
const fs = require('fs'); const path = require('path'); const http = require('http'); const Module = require('module'); const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r); const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
function load(r, src) { const m = new Module(P(r), module); m.filename = P(r); m.paths = Module._nodeModulePaths(path.dirname(P(r))); m._compile(src === undefined ? read(r) : src, P(r)); return m.exports; }
const BASE = '68b6568';
const mainSrc = (r) => execSync(`git show ${BASE}:${r}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const fnSrc = (src, name) => { const i = src.indexOf(`function ${name}(`); if (i < 0) return null; let d = 0; for (let j = src.indexOf('{', i); j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) return src.slice(i, j + 1); } return null; };
const b64 = (s) => JSON.parse(Buffer.from(s.split('.')[0].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());

(async () => {
  const NOW = load('src/lib/vendor/igOAuth.js'); const MAIN = load('src/lib/vendor/igOAuth.js', mainSrc('src/lib/vendor/igOAuth.js'));
  sec('1  the hard line: redirect URI, scopes, sign() byte-equal to main\'s');
  const st0 = NOW.mintState('v-1', { flavour: 'basic' }).state;
  ok(() => ['basic', 'insights', 'messages'].every((f) => NOW.authorizeUrl(st0, { flavour: f }) === MAIN.authorizeUrl(st0, { flavour: f })), '1.1 the authorize URL (redirect URI and scopes inside it) is byte-equal to main\'s, for every kind', NOW.authorizeUrl(st0, { flavour: 'basic' }).slice(0, 120));
  ok(() => NOW.IG_SCOPE === MAIN.IG_SCOPE && NOW.INSIGHTS_SCOPE === MAIN.INSIGHTS_SCOPE && NOW.IG_CALLBACK_PATH === MAIN.IG_CALLBACK_PATH && /const MESSAGES_SCOPE = 'instagram_business_manage_messages';/.test(read('src/lib/vendor/igOAuth.js')), '1.2 the scopes and the callback path unchanged');
  ok(() => fnSrc(read('src/lib/vendor/igOAuth.js'), 'sign') === fnSrc(mainSrc('src/lib/vendor/igOAuth.js'), 'sign') && /const STATE_TTL_MS/.test(read('src/lib/vendor/igOAuth.js')) && (read('src/lib/vendor/igOAuth.js').match(/const STATE_TTL_MS[^\n]*/) || [''])[0] === (mainSrc('src/lib/vendor/igOAuth.js').match(/const STATE_TTL_MS[^\n]*/) || [''])[0], '1.3 sign() byte-equal to main\'s; the TTL unchanged');

  sec('2  the state');
  const plain = NOW.mintState('v-1', { flavour: 'insights' }); const mainPlain = MAIN.mintState('v-1', { flavour: 'insights' });
  ok(() => JSON.stringify(Object.keys(b64(plain.state))) === JSON.stringify(Object.keys(b64(mainPlain.state))) && !('r' in b64(plain.state)), '2.1 a state minted without the field is built exactly as before (the same keys, no r)', JSON.stringify(Object.keys(b64(plain.state))));
  ok(() => { const v = NOW.verifyState(mainPlain.state); return v.ok && v.vendorId === 'v-1' && v.flavour === 'insights' && v.ret === null; }, '2.2 a state minted BEFORE this cut (main\'s mintState) still verifies, with no return');
  const s1 = NOW.mintState('v-1', { flavour: 'basic', ret: 'start' }); const v1 = NOW.verifyState(s1.state);
  ok(() => b64(s1.state).r === 'start' && v1.ok && v1.ret === 'start' && v1.flavour === 'basic', '2.3 asked for start: the signed state carries r:\'start\' and verifyState reads it back');
  const sx = NOW.mintState('v-1', { flavour: 'basic', ret: '/evil' });
  ok(() => !('r' in b64(sx.state)) && NOW.verifyState(sx.state).ret === null, '2.4 any other value is never written: start is the only one');
  const forged = s1.state.split('.')[0] + '.' + 'x'.repeat(s1.state.split('.')[1].length);
  ok(() => NOW.verifyState(forged).ok === false, '2.5 the field is under the signature: a changed state is refused');

  sec('3  the doors over HTTP');
  for (const m of ['src/api/middleware/requireAuth.js', 'src/api/middleware/resolveVendor.js']) { const k = require.resolve(P(m)); require.cache[k] = { id: k, filename: k, loaded: true, exports: m.endsWith('resolveVendor.js') ? () => (q, r, n) => n() : (q, r, n) => n() }; }
  { const k = require.resolve(P('src/lib/vendor/igOAuth.js')); require.cache[k] = { id: k, filename: k, loaded: true, exports: NOW }; }
  const { makeStore } = require('./lib/b196_store');
  const st = makeStore({ vendor_ig_connections: [] }); const express = require('express'); const app = express(); app.locals.supabase = st;
  app.use((q, r, n) => { q.vendor = { id: 'v-1', tier: 'basic' }; n(); }); app.use('/ig', load('src/api/vendor/ig.js'));
  const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
  const get = (p) => new Promise((res) => { http.get({ host: '127.0.0.1', port: srv.address().port, path: p }, (rs) => { let x = ''; rs.on('data', (c) => (x += c)); rs.on('end', () => res({ status: rs.statusCode, loc: rs.headers.location || '', body: x })); }); });
  const a1 = await get('/ig/authorize?return=start'); const a2 = await get('/ig/authorize?return=%2Fevil'); const a3 = await get('/ig/authorize');
  const stateOf = (r) => { try { return new URL(JSON.parse(r.body).data ? JSON.parse(r.body).data.authorize_url : JSON.parse(r.body).authorize_url).searchParams.get('state'); } catch { return null; } };
  ok(() => a1.status === 200 && b64(stateOf(a1)).r === 'start' && !('r' in b64(stateOf(a2))) && !('r' in b64(stateOf(a3))), '3.1 authorize: return=start rides the state; an unlisted value or none does not', `${a1.status} ${a1.body.slice(0, 120)}`);
  const c1 = await get(`/ig/callback?error=access_denied&state=${encodeURIComponent(stateOf(a1))}`);
  const c3 = await get(`/ig/callback?error=access_denied&state=${encodeURIComponent(stateOf(a3))}`);
  const c2 = await get(`/ig/callback?error=access_denied&state=${encodeURIComponent(stateOf(a2))}`);
  const c4 = await get('/ig/callback?code=x');
  await new Promise((r) => srv.close(r));
  ok(() => /\/vendor\/onboarding\?ig=cancelled$/.test(c1.loc) && c1.status === 302, '3.2 from set-up: the callback returns her to /vendor/onboarding with the usual ?ig= result', c1.loc);
  ok(() => /\/vendor\/portfolio\?ig=cancelled$/.test(c3.loc) && /\/vendor\/portfolio\?ig=cancelled$/.test(c2.loc) && /\/vendor\/portfolio\?ig=failed&reason=incomplete$/.test(c4.loc), '3.3 no value, or an unlisted one: exactly today\'s return (her portfolio)', `${c3.loc} | ${c2.loc} | ${c4.loc}`);
  ok(() => /const ONBOARDING_RETURN_PATH = require\('\.\.\/\.\.\/lib\/pwaPaths'\)\.vendorPath\('onboarding'\);/.test(read('src/api/vendor/ig.js')) && require(P('src/lib/pwaPaths.js')).vendorPath('onboarding') === '/vendor/onboarding' && /const RETURN_PATH = require\('\.\.\/\.\.\/lib\/pwaPaths'\)\.vendorPath\('portfolio'\);/.test(read('src/api/vendor/ig.js')) && /POSTS_RETURN_PATH = require\('\.\.\/\.\.\/lib\/pwaPaths'\)\.vendorPath\('posts'\);/.test(read('src/api/vendor/ig.js')), '3.4 every existing return unchanged; the one new address lives in the one home, pwaPaths.js (F-38.p12)');

  sec('4  mutations, run');
  const SRC = read('src/lib/vendor/igOAuth.js');
  const M1 = load('src/lib/vendor/igOAuth.js', SRC.replace("  if (opts.ret === 'start') body.r = 'start';", '  if (opts.ret) body.r = opts.ret;'));
  ok(() => 'r' in b64(M1.mintState('v-1', { ret: '/evil' }).state), '4.1 the allow-list removed: any value rides the state (2.4 reddens)');
  const M2 = load('src/lib/vendor/igOAuth.js', SRC.replace("    ret: parsed.r === 'start' ? 'start' : null };", '    ret: null };'));
  ok(() => M2.verifyState(M2.mintState('v-1', { ret: 'start' }).state).ret === null, '4.2 the read-back removed: she is never returned to set-up (2.3 and 3.2 redden)');

  console.log(`\nb265 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.stack || e)); console.log(`\nb265 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
