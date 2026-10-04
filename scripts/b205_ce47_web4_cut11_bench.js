// scripts/b205_ce47_web4_cut11_bench.js
// TDW · CE-47 · WEB-4 cut 11 · b205 — F-44.271: NO ACCOUNT WITHOUT A NAME, AND EVERY PATH STILL SIGNS IN.
// Drives the REAL vendor and couple auth doors end to end on an in-memory plane (scripts/lib/b205_auth_plane.js):
// §1 join · §2 sign-in, unknown number · §3 sign-in, known named · §4 returning nameless (needs_name) · §5 the PIN path ·
// §6 reset and wrong role · §7 the admin vendor mint · §8 enquiry rows untouched · §9 mutations, run. Red without the cut.
'use strict';
const fs = require('fs'); const path = require('path'); const Module = require('module');
const bcrypt = require('bcryptjs');
const PL = require('./lib/b205_auth_plane');
const { CAP, ROOT, newStore, memSupabase, freshRoute, handlerFor, callHandler, codeFromMeta } = PL;
const read = (r) => fs.readFileSync(path.join(ROOT, r), 'utf8');
let pass = 0, fail = 0; const failed = [];
async function ok(name, fn) { let v = false, info; try { v = await fn(); } catch (e) { info = 'threw: ' + e.message; }
  if (v === true) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info ? '  [' + info.slice(0, 200) + ']' : (typeof v === 'string' ? '  [' + v.slice(0, 200) + ']' : '')}`); } }
const sec = (t) => console.log(`\n§${t}`);
const ROLE = { vendor: { file: 'src/api/vendor/auth.js', table: 'vendors', id: 'vendor_id', other: 'couples' }, couple: { file: 'src/api/couple/auth.js', table: 'couples', id: 'couple_id', other: 'vendors' } };

function world(seed) { CAP.store = newStore(); const db = JSON.parse(JSON.stringify(seed || {})); const idc = { users: 50, vendors: 50, couples: 50 }; return { db, sb: memSupabase(db, idc) }; }
async function signIn(kind, router, w, phone, sendName) {
  CAP.meta = null;
  const send = await callHandler(handlerFor(router, '/send-otp'), sendName ? { phone, name: sendName } : { phone }, w.sb);
  const code = codeFromMeta();
  const verify = code ? await callHandler(handlerFor(router, '/verify-otp'), { phone, otp: code, purpose: 'login' }, w.sb) : null;
  return { send, verify };
}
const authIdOf = (w, v, phone) => { const u = (w.db.users || []).find((x) => x.phone === phone); return (u && u.auth_user_id) || (CAP.store.users.find((x) => x.phone === phone) || {}).id; };
const provision = (router, w, phone, authId, body) => callHandler(handlerFor(router, '/provision'), Object.assign({ phone }, body || {}), w.sb, { auth: { user_id: authId, phone } });

(async () => {
  for (const kind of ['vendor', 'couple']) {
    const R = ROLE[kind]; const router = freshRoute(R.file); const P0 = kind === 'vendor' ? '+91981100' : '+91982200';
    sec(`1-${kind}  join: phone + name + code`);
    let w = world(); let ph = P0 + '0001'; let s = await signIn(kind, router, w, ph, 'Meera');
    await ok(`1.1 ${kind}: send-otp makes no rows; verify answers new_account with a session`, () => (w.db.users || []).length === 0 && (w.db[R.table] || []).length === 0 && s.verify && s.verify.payload.ok && s.verify.payload.new_account === true && !!s.verify.payload.access_token);
    let p = await provision(router, w, ph, authIdOf(w, s.verify, ph), kind === 'vendor' ? { name: 'Meera', category: 'photographer' } : { name: 'Meera' });
    const u = (w.db.users || []).find((x) => x.phone === ph);
    await ok(`1.2 ${kind}: provision with the name makes ONE named account and its role row; needs_name false`, () => p.payload.ok === true && u && u.name === 'Meera' && (w.db[R.table] || []).length === 1 && p.payload[R.id] && p.payload.needs_name === false);
    if (kind === 'vendor') await ok('1.3 vendor: the new vendor row is born pending, as the OTP door used to make it', () => w.db.vendors[0].status === 'pending');

    sec(`2-${kind}  sign-in on an UNKNOWN number (the hole): no name, no account`);
    w = world(); ph = P0 + '0002'; s = await signIn(kind, router, w, ph);
    p = await provision(router, w, ph, authIdOf(w, s.verify, ph));
    await ok(`2.1 ${kind}: provision without a name is refused 400 name_required, with the plain line, and writes nothing`, () => p.statusCode === 400 && p.payload.ok === false && p.payload.reason === 'name_required' && p.payload.field === 'name' && p.payload.error === 'Please add your name.' && (w.db.users || []).length === 0 && (w.db[R.table] || []).length === 0);
    p = await provision(router, w, ph, authIdOf(w, s.verify, ph), { name: 'Asha' });
    await ok(`2.2 ${kind}: asked, she gives her name: the account is made, named`, () => p.payload.ok === true && (w.db.users || []).some((x) => x.phone === ph && x.name === 'Asha'));

    sec(`3-${kind}  sign-in on a KNOWN, named account`);
    ph = P0 + '0003';
    w = world({ users: [{ id: 'u1', phone: ph, name: 'Riya', auth_user_id: null }], [R.table]: [{ id: 'r1', user_id: 'u1', pin_hash: null, onboarding_state: 'done' }] });
    s = await signIn(kind, router, w, ph);
    p = await provision(router, w, ph, authIdOf(w, s.verify, ph));
    await ok(`3.1 ${kind}: verify answers her account (not new_account); provision with no name is fine; her name is untouched`, () => s.verify.payload.ok === true && s.verify.payload.user_id === 'u1' && s.verify.payload[R.id] === 'r1' && !s.verify.payload.new_account && p.payload.ok === true && p.payload.needs_name === false && w.db.users[0].name === 'Riya' && w.db.users.length === 1);

    sec(`4-${kind}  a RETURNING nameless account: asked, never locked out`);
    ph = P0 + '0004';
    w = world({ users: [{ id: 'u2', phone: ph, name: null, auth_user_id: null }], [R.table]: [{ id: 'r2', user_id: 'u2', pin_hash: null, onboarding_state: 'new' }] });
    s = await signIn(kind, router, w, ph);
    p = await provision(router, w, ph, authIdOf(w, s.verify, ph));
    await ok(`4.1 ${kind}: provision answers ok with needs_name true (she is in, and asked)`, () => s.verify.payload.ok === true && p.statusCode === 200 && p.payload.ok === true && p.payload.needs_name === true);
    p = await provision(router, w, ph, authIdOf(w, s.verify, ph), { name: 'Kavya' });
    await ok(`4.2 ${kind}: she gives it: the name fills, needs_name false`, () => p.payload.ok === true && p.payload.needs_name === false && w.db.users[0].name === 'Kavya');

    sec(`5-${kind}  the PIN path`);
    ph = P0 + '0005';
    w = world({ users: [{ id: 'u3', phone: ph, name: 'Isha', auth_user_id: 'auth_pin' }], [R.table]: [{ id: 'r3', user_id: 'u3', pin_hash: bcrypt.hashSync('2580', 4), pin_failed_attempts: 0, pin_locked_until: null, onboarding_state: 'done' }] });
    CAP.store.users.push({ id: 'auth_pin', phone: ph });
    const pin = await callHandler(handlerFor(router, '/pin-login'), { phone: ph, pin: '2580' }, w.sb);
    await ok(`5.1 ${kind}: a named account with a PIN signs in by PIN, as before`, () => pin.payload && pin.payload.ok === true && !!pin.payload.access_token, () => JSON.stringify(pin.payload));

    sec(`6-${kind}  reset on an unknown number; wrong role`);
    w = world(); ph = P0 + '0006';
    await callHandler(handlerFor(router, '/send-otp'), { phone: ph }, w.sb);
    w.db.otp_sessions[0].purpose = 'reset';
    const rs = await callHandler(handlerFor(router, '/verify-otp'), { phone: ph, otp: codeFromMeta(), purpose: 'reset' }, w.sb);
    await ok(`6.1 ${kind}: a reset needs an account: 404 account_not_found, no session`, () => rs.statusCode === 404 && rs.payload.reason === 'account_not_found' && !rs.payload.access_token);
    ph = P0 + '0007';
    w = world({ users: [{ id: 'u4', phone: ph, name: 'Other', auth_user_id: null }], [R.other]: [{ id: 'o4', user_id: 'u4' }] });
    const wr = await callHandler(handlerFor(router, '/send-otp'), { phone: ph }, w.sb);
    await ok(`6.2 ${kind}: a number on the other side is still refused at send-otp (wrong_role)`, () => wr.statusCode === 403 && wr.payload.reason === 'wrong_role');
  }

  sec('7  the admin vendor mint requires a name (no placeholder)');
  const ADM = require(path.join(ROOT, 'src/api/admin/vendors.js'));
  const rpcs = [];
  const admWorld = (seed) => { const w = world(seed); w.sb.rpc = async (fn, args) => { rpcs.push({ fn, args }); return { data: null, error: null }; }; return w; };
  const drive = async (w, body) => { let out = {}; const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } }; await ADM.mintVendor({ body, app: { locals: { supabase: w.sb } } }, res); return out; };
  let a = await drive(admWorld(), { phone: '+919000000101' });
  await ok('7.1 no name and no stored name: 400 "name is required.", no vendor born', () => a.status === 400 && /name is required/.test(JSON.stringify(a.body)) && rpcs.length === 0);
  await drive(admWorld({ users: [{ id: 'u9', phone: '+919000000102', name: 'Stored Studio' }] }), { phone: '+919000000102' });
  await ok('7.2 a person whose users row holds a name: born under THAT name', () => rpcs.length === 1 && rpcs[0].args.p_name === 'Stored Studio');
  await drive(admWorld(), { phone: '+919000000103', business_name: 'Studio Lumen' });
  await ok('7.3 a typed name: born under it; the word "Vendor" is never a name', () => rpcs.length === 2 && rpcs[1].args.p_name === 'Studio Lumen' && !/\|\| 'Vendor'/.test(read('src/api/admin/vendors.js')));

  sec('8  enquiry rows are not accounts: unchanged');
  await ok('8.1 the WhatsApp, own-number and website writers are untouched by this cut', () => ['src/lib/vendorInbound.js', 'src/lib/coupleIdentity.js', 'src/lib/ownNumber/turn.js', 'src/lib/website/enquiry.js'].every((f) => !/F-44\.271/.test(read(f))));

  sec('9  mutations, run');
  const mutate = async (rel, from, to, fn) => { const abs = path.join(ROOT, rel); const orig = fs.readFileSync(abs, 'utf8'); if (!orig.includes(from)) return 'mutation target missing'; fs.writeFileSync(abs, orig.replace(from, to)); try { for (const k of Object.keys(require.cache)) if (k.startsWith(path.join(ROOT, 'src')) && !k.endsWith(path.join('src', 'lib', 'metaCloud.js'))) delete require.cache[k]; return await fn(); } finally { fs.writeFileSync(abs, orig); for (const k of Object.keys(require.cache)) if (k.startsWith(path.join(ROOT, 'src')) && !k.endsWith(path.join('src', 'lib', 'metaCloud.js'))) delete require.cache[k]; } };
  const m1 = await mutate('src/lib/provisionRole.js', "if (!roleExists && !textPresent(name) && !textPresent(currentName)) throw new NameRequiredError();", '', async () => {
    const router = freshRoute(ROLE.vendor.file); const w = world(); const ph = '+919811100099'; const s = await signIn('vendor', router, w, ph);
    const p = await provision(router, w, ph, authIdOf(w, s.verify, ph)); return p.payload.ok === true && (w.db.users || []).some((x) => x.phone === ph && !x.name);
  });
  await ok('9.1 the name gate removed: a nameless account is made again (2.1 reddens)', () => m1 === true, () => String(m1));
  const m2 = await mutate('src/lib/provisionRole.js', "{ user_id: usersId, onboarding_state: 'new', status: 'pending' }", "{ user_id: usersId, onboarding_state: 'new' }", async () => {
    const router = freshRoute(ROLE.vendor.file); const w = world(); const ph = '+919811100098'; const s = await signIn('vendor', router, w, ph);
    await provision(router, w, ph, authIdOf(w, s.verify, ph), { name: 'X', category: 'photographer' }); return w.db.vendors[0].status !== 'pending';
  });
  await ok('9.2 the pending status dropped from provision: a new vendor is born without it (1.3 reddens)', () => m2 === true, () => String(m2));
  const m3 = await mutate('src/api/admin/vendors.js', "if (!existingVendor && !storedName && !cleanName) return errRes(res, 400, 'name is required.');", '', async () => {
    const A2 = require(path.join(ROOT, 'src/api/admin/vendors.js')); const before = rpcs.length; const w = admWorld(); let out = {};
    const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
    await A2.mintVendor({ body: { phone: '+919000000109' }, app: { locals: { supabase: w.sb } } }, res); return rpcs.length === before + 1;
  });
  await ok('9.3 the admin name check removed: a nameless vendor is born (7.1 reddens)', () => m3 === true, () => String(m3));

  console.log(`\nb205 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.stack || e)); console.log(`\nb205 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
