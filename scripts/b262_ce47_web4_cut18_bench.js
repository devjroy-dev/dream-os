// scripts/b262_ce47_web4_cut18_bench.js
// TDW · CE-47 · WEB-4 cut 18 · b262 — F-44.401: AN ENQUIRY TO A REAL VENDOR NEEDS A DREAMER SESSION; NO IDENTITY OR PHONE
// FROM THE BODY. Drives the real door (src/api/couple/enquire.js, POST /api/v2/discover/enquire) over HTTP on b196_store,
// with the session resolver stood in (who is signed in is the only thing the bench decides). §1 signed out · §2 signed
// in, the body's three fields ignored · §3 demo vendors · §4 mutations, run. Red on a tree without the cut.
'use strict';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://bench.invalid.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench';
const fs = require('fs'); const path = require('path'); const http = require('http'); const Module = require('module');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r); const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
let who = { present: false, coupleId: null };
{ const k = require.resolve(P('src/lib/resolveCoupleIfPresent.js')); require.cache[k] = { id: k, filename: k, loaded: true, exports: { resolveCoupleIfPresent: async () => who } }; }
const { makeStore } = require('./lib/b196_store');
const express = require('express');
const seed = () => ({
  vendors: [{ id: 'v1', business_name: 'Studio', routing_handle: 'S1', user_id: 'u-v', category: 'makeup', city: 'Delhi', tier: 'basic', discover_eligible: true, discover_paused: false, base_fee_min: null, base_fee_max: null }],
  users: [{ id: 'u-v', phone: '+919888294440', name: 'Dev' }, { id: 'u-b', phone: '+919625759924', name: 'Sarah' }, { id: 'u-x', phone: '+919811111111', name: 'Someone Else' }],
  couples: [{ id: 'c-b', user_id: 'u-b' }, { id: 'c-x', user_id: 'u-x' }],
  demo_vendors: [{ id: 'd1', display_name: 'Demo Studio', ig_handle: 'demo_studio', category: 'makeup', city: 'Delhi', whatsapp_phone: null, status: 'live' }],
  leads: [], couple_enquiries: [], enquiry_taps: [], conversations: [], messages: [], clients: [], demo_leads: [],
});
function load(src) { const f = P('src/api/couple/enquire.js'); const m = new Module(f, module); m.filename = f; m.paths = Module._nodeModulePaths(path.dirname(f)); m._compile(src, f); return m.exports; }
async function door(src) {
  const st = makeStore(seed()); const app = express(); app.use(express.json()); app.locals.supabase = st; app.use('/e', load(src));
  const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
  const post = (b) => new Promise((res) => { const d = JSON.stringify(b); const rq = http.request({ host: '127.0.0.1', port: srv.address().port, path: '/e', method: 'POST', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(d) } }, (rs) => { let x = ''; rs.on('data', (c) => (x += c)); rs.on('end', () => { let j = null; try { j = JSON.parse(x); } catch { /* */ } res({ status: rs.statusCode, body: j }); }); }); rq.write(d); rq.end(); });
  return { st, post, close: () => new Promise((r) => srv.close(r)) };
}
const FORGED = { couple_id: 'c-x', bride_name: 'Forged Name', bride_phone: '+911234567890' };
const SRC = read('src/api/couple/enquire.js');

(async () => {
  sec('1  signed out: a real vendor is refused, nothing sent, nothing written');
  let D = await door(SRC); who = { present: false, coupleId: null };
  let r = await D.post(Object.assign({ vendor_id: 'v1' }, FORGED));
  ok(() => r.status === 401 && r.body.error === 'Please sign in to send an enquiry.' && r.body.reason === 'sign_in', '1.1 no session: 401 "Please sign in to send an enquiry."', JSON.stringify(r.body));
  ok(() => D.st.tables.leads.length === 0 && D.st.tables.couple_enquiries.length === 0 && D.st.tables.messages.length === 0, '1.2 nothing written: no lead, no enquiry row, no message (the posted couple_id was not believed)');
  who = { present: true, coupleId: null };
  r = await D.post(Object.assign({ vendor_id: 'v1' }, FORGED));
  ok(() => r.status === 401 && D.st.tables.leads.length === 0, '1.3 a session that is no Dreamer\'s (a vendor token on the couple door): 401, nothing written');
  await D.close();

  sec('2  signed in: identity from the session, name and phone from her row; the body\'s three fields ignored');
  D = await door(SRC); who = { present: true, coupleId: 'c-b' };
  r = await D.post(Object.assign({ vendor_id: 'v1' }, FORGED));
  const lead = D.st.tables.leads[0] || {};
  ok(() => r.status === 200 && r.body.ok === true && r.body.species === 'real', '2.1 her enquiry is sent (200, real vendor)', JSON.stringify(r.body).slice(0, 160));
  ok(() => lead.name === 'Sarah' && lead.phone === '+919625759924', '2.2 the lead carries HER name and phone, from her row (not "Forged Name" / +911234567890)', JSON.stringify([lead.name, lead.phone]));
  ok(() => !JSON.stringify(D.st.tables).includes('Forged Name') && !JSON.stringify(D.st.tables).includes('+911234567890') && !(D.st.tables.couple_enquiries || []).some((e) => e.couple_id === 'c-x'), '2.3 nothing anywhere carries the posted name, phone or couple_id (another Dreamer\'s id never used)');
  await D.close();

  sec('3  demo vendors: identity from the session only; a signed-out tap stays alert-only');
  D = await door(SRC); who = { present: false, coupleId: null };
  r = await D.post(Object.assign({ vendor_id: 'd1' }, FORGED));
  ok(() => r.status !== 401 && !(D.st.tables.demo_leads || []).some((l) => l.couple_id === 'c-x'), '3.1 a signed-out demo tap is not refused (alert-only, as today) and never takes the posted couple_id', `${r.status} ${JSON.stringify(D.st.tables.demo_leads)}`);
  await D.close();
  ok(() => /const identityCoupleId = coupleAuth\.present \? coupleAuth\.coupleId : null;/.test(SRC) && /bride_name: null, bride_phone: null,   \/\/ F-44\.401: never from the body/.test(SRC), '3.2 the door: identity only from the session; the real handler is passed no body name or phone');

  sec('4  mutations, run');
  const M1 = SRC.replace('const identityCoupleId = coupleAuth.present ? coupleAuth.coupleId : null;', 'const identityCoupleId = coupleAuth.present ? coupleAuth.coupleId : (couple_id || null);');
  D = await door(M1); who = { present: false, coupleId: null }; r = await D.post(Object.assign({ vendor_id: 'v1' }, FORGED));
  ok(() => M1 !== SRC && r.status === 200 && D.st.tables.leads.length === 1, '4.1 the body\'s couple_id believed again: a signed-out stranger files an enquiry as another Dreamer (1.1 reddens)', r.status); await D.close();
  const M2 = SRC.replace('bride_name: null, bride_phone: null,   // F-44.401: never from the body', 'bride_name, bride_phone,');
  D = await door(M2); who = { present: true, coupleId: 'c-b' };
  D.st.tables.users = D.st.tables.users.map((u) => (u.id === 'u-b' ? Object.assign({}, u, { phone: null, name: null }) : u));
  r = await D.post(Object.assign({ vendor_id: 'v1' }, FORGED));
  ok(() => M2 !== SRC && (D.st.tables.leads[0] || {}).phone === '+911234567890', '4.2 the body\'s phone passed through again: an unverified number reaches the vendor (2.2 reddens)', JSON.stringify(D.st.tables.leads[0] || {}).slice(0, 120)); await D.close();

  console.log(`\nb262 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.stack || e)); console.log(`\nb262 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
