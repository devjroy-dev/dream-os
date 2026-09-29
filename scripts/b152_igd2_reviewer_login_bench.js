'use strict';
// scripts/b152_igd2_reviewer_login_bench.js · TDW CE-46 · IGD-2 · G7 · THE REVIEWER ACCOUNT'S SIGN-IN (rung b152).
// WHAT IT HOLDS: src/lib/vendor/reviewerLogin.js and its three uses in src/api/vendor/auth.js, driven through the real router with
// an in-memory database double, the WhatsApp send doubled (counted, never sent), bcrypt real.
//   · REVIEWER_PHONE unset: send-otp is today's path (a random code, one send).
//   · the reviewer phone with REVIEWER_OTP set: the session holds the fixed code's hash; NO send; logged.
//   · the reviewer phone with REVIEWER_OTP unset or malformed: refused 503, no session, no send, nothing minted; logged.
//   · any other phone with both set: untouched (random code, one send).
//   · verify-otp accepts the fixed code for the reviewer phone, refuses a wrong one, logs; forgot-pin behaves as send-otp.
// No network, no key. `--mutate` compiles each production mutation IN MEMORY (A-45.4). THE EXIT CODE IS THE VERDICT.
const fs = require('fs');
const path = require('path');
const Module = require('module');
const bcrypt = require('bcryptjs');
const ROOT = path.join(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const MUTATE = process.argv.includes('--mutate');
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://bench.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'bench';

const SENDS = [];
function stub(rel, exportsObj) { const f = require.resolve(P(rel)); require.cache[f] = { id: f, filename: f, loaded: true, exports: exportsObj }; }
stub('src/lib/otpSend.js', { sendOtpCode: async (a) => { SENDS.push(a); } });
stub('src/lib/ensureAuthIdentity.js', { ensureAuthIdentity: async () => {}, AuthIdentityBoundElsewhereError: class extends Error {} });

function loadAt(rel, src) { const f = P(rel); const m = new Module(f, module); m.filename = f; m.paths = Module._nodeModulePaths(path.dirname(f)); m._compile(src, f); return m.exports; }

function makeDb(seed = {}) {
  const T = { users: [], vendors: [], couples: [], otp_sessions: [], ...JSON.parse(JSON.stringify(seed)) };
  let n = 0;
  return {
    T,
    from(table) {
      const st = { f: [], op: 'select', p: null };
      const hit = () => (T[table] || []).filter((r) => st.f.every((fn) => fn(r)));
      const api = {
        select() { return api; },
        eq(c, v) { st.f.push((r) => r[c] === v); return api; },
        insert(p) { st.op = 'insert'; st.p = p; return api; },
        upsert(p) { const i = (T[table] = T[table] || []).findIndex((r) => r.phone === p.phone); if (i >= 0) T[table][i] = { ...p }; else T[table].push({ ...p }); return Promise.resolve({ error: null }); },
        delete() { st.op = 'delete'; return api; },
        async maybeSingle() { return { data: hit()[0] || null, error: null }; },
        async single() { const row = { id: `${table}-${(n += 1)}`, ...st.p }; (T[table] = T[table] || []).push(row); return { data: row, error: null }; },
        then(a, b) {
          if (st.op === 'insert') { (T[table] = T[table] || []).push({ id: `${table}-${(n += 1)}`, ...st.p }); return Promise.resolve({ error: null }).then(a, b); }
          if (st.op === 'delete') { T[table] = (T[table] || []).filter((r) => !st.f.every((fn) => fn(r))); return Promise.resolve({ error: null }).then(a, b); }
          return Promise.resolve({ data: hit(), error: null }).then(a, b);
        },
      };
      return api;
    },
  };
}

async function drive(router, routePath, body, db) {
  const layer = router.stack.find((l) => l.route && l.route.path === routePath && l.route.methods.post);
  const h = layer.route.stack[layer.route.stack.length - 1].handle;
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; }, cookie() { return res; } };
  try { await h({ body, app: { locals: { supabase: db } } }, res, () => {}); } catch (e) { out.status = 'threw'; out.body = { error: e.message }; }
  return out;
}

async function capture(fn) {
  const logs = []; const o = { l: console.log, w: console.warn, e: console.error };
  console.log = (...a) => logs.push(a.join(' ')); console.warn = console.log; console.error = console.log;
  try { return { r: await fn(), logs }; } finally { console.log = o.l; console.warn = o.w; console.error = o.e; }
}

const RP = '+919000000001'; const OTHER = '+919000000002'; const CODE = '246810';
const withEnv = (env, fn) => async () => {
  const keep = { REVIEWER_PHONE: process.env.REVIEWER_PHONE, REVIEWER_OTP: process.env.REVIEWER_OTP };
  delete process.env.REVIEWER_PHONE; delete process.env.REVIEWER_OTP; Object.assign(process.env, env);
  try { return await fn(); } finally {
    for (const k of Object.keys(keep)) { if (keep[k] === undefined) delete process.env[k]; else process.env[k] = keep[k]; }
  }
};

async function cells(auth) {
  const R = []; const ok = (c, name) => R.push({ name, pass: !!c });
  let db; let x;

  // 1 · REVIEWER_PHONE unset: today's path
  SENDS.length = 0; db = makeDb();
  x = await capture(withEnv({ REVIEWER_OTP: CODE }, () => drive(auth, '/send-otp', { phone: RP }, db)));
  ok(x.r.status === 200 && SENDS.length === 1 && SENDS[0].code !== CODE && db.T.otp_sessions.length === 1 && !x.logs.some((l) => l.startsWith('[reviewer]')),
    '1.1 REVIEWER_PHONE unset: a random code and one WhatsApp send, as today');

  // 2 · the reviewer phone, both set
  SENDS.length = 0; db = makeDb();
  x = await capture(withEnv({ REVIEWER_PHONE: RP, REVIEWER_OTP: CODE }, () => drive(auth, '/send-otp', { phone: RP }, db)));
  const sess = db.T.otp_sessions[0];
  ok(x.r.status === 200 && x.r.body.ok === true && SENDS.length === 0, '2.1 the reviewer phone: answered ok and NO message sent');
  ok(sess && sess.purpose === 'login' && bcrypt.compareSync(CODE, sess.otp_hash), '2.2 its session holds the fixed code\u2019s hash (purpose login)');
  ok(x.logs.some((l) => l.includes('[reviewer] session opened for the reviewer account (send-otp; no message sent)')), '2.3 the use is logged');
  ok(db.T.users.length === 1 && db.T.vendors.length === 1, '2.4 the account is minted as any new phone is');

  // 3 · refused when the code is unset or malformed
  for (const [label, env] of [['unset', { REVIEWER_PHONE: RP }], ['malformed', { REVIEWER_PHONE: RP, REVIEWER_OTP: '12ab' }]]) {
    SENDS.length = 0; db = makeDb();
    x = await capture(withEnv(env, () => drive(auth, '/send-otp', { phone: RP }, db)));
    ok(x.r.status === 503 && x.r.body.reason === 'reviewer_unavailable' && SENDS.length === 0 && db.T.otp_sessions.length === 0 && db.T.users.length === 0
      && x.logs.some((l) => l.startsWith('[reviewer] refused')), `3.${label === 'unset' ? 1 : 2} REVIEWER_OTP ${label}: refused, no session, no send, nothing minted, logged`);
  }

  // 4 · any other phone is untouched
  SENDS.length = 0; db = makeDb();
  x = await capture(withEnv({ REVIEWER_PHONE: RP, REVIEWER_OTP: CODE }, () => drive(auth, '/send-otp', { phone: OTHER }, db)));
  ok(x.r.status === 200 && SENDS.length === 1 && SENDS[0].to === OTHER && SENDS[0].code !== CODE && !bcrypt.compareSync(CODE, db.T.otp_sessions[0].otp_hash)
    && !x.logs.some((l) => l.startsWith('[reviewer]')), '4.1 any other phone, with both set: a random code and a send, as today');

  // 5 · verify-otp checks the fixed code by its own comparison (the users row is absent here, so a correct code reaches the
  //     account lookup's 500 and a wrong code is refused 400 before it)
  db = makeDb({ otp_sessions: [{ phone: RP, otp_hash: bcrypt.hashSync(CODE, 4), purpose: 'login', expires_at: new Date(Date.now() + 60000).toISOString() }] });
  x = await capture(withEnv({ REVIEWER_PHONE: RP, REVIEWER_OTP: CODE }, () => drive(auth, '/verify-otp', { phone: RP, otp: CODE, purpose: 'login' }, db)));
  ok(x.r.status === 500 && /Account not found after OTP verification/.test(x.r.body.error) && x.logs.some((l) => l.includes('[reviewer] verify-otp for the reviewer account purpose=login')),
    '5.1 verify-otp accepts the fixed code for the reviewer phone, and logs');
  db = makeDb({ otp_sessions: [{ phone: RP, otp_hash: bcrypt.hashSync(CODE, 4), purpose: 'login', expires_at: new Date(Date.now() + 60000).toISOString() }] });
  x = await capture(withEnv({ REVIEWER_PHONE: RP, REVIEWER_OTP: CODE }, () => drive(auth, '/verify-otp', { phone: RP, otp: '000000', purpose: 'login' }, db)));
  ok(x.r.status === 400 && x.r.body.reason === 'otp_invalid', '5.2 a wrong code for the reviewer phone is refused');

  // 6 · forgot-pin behaves as send-otp
  SENDS.length = 0; db = makeDb({ users: [{ id: 'u1', phone: RP }], vendors: [{ id: 'v1', user_id: 'u1' }] });
  x = await capture(withEnv({ REVIEWER_PHONE: RP, REVIEWER_OTP: CODE }, () => drive(auth, '/forgot-pin', { phone: RP }, db)));
  ok(x.r.status === 200 && SENDS.length === 0 && db.T.otp_sessions[0].purpose === 'reset' && bcrypt.compareSync(CODE, db.T.otp_sessions[0].otp_hash)
    && x.logs.some((l) => l.includes('(forgot-pin; no message sent)')), '6.1 forgot-pin for the reviewer: the fixed code, purpose reset, no send, logged');
  SENDS.length = 0; db = makeDb({ users: [{ id: 'u1', phone: RP }], vendors: [{ id: 'v1', user_id: 'u1' }] });
  x = await capture(withEnv({ REVIEWER_PHONE: RP }, () => drive(auth, '/forgot-pin', { phone: RP }, db)));
  ok(x.r.status === 503 && SENDS.length === 0 && db.T.otp_sessions.length === 0, '6.2 forgot-pin with REVIEWER_OTP unset: refused, no session, no send');

  // 7 · the one home, pure
  const { reviewerFor } = loadAt('src/lib/vendor/reviewerLogin.js', fs.readFileSync(P('src/lib/vendor/reviewerLogin.js'), 'utf8'));
  ok(reviewerFor(RP, {}) === null && reviewerFor(RP, { REVIEWER_PHONE: OTHER, REVIEWER_OTP: CODE }) === null
    && reviewerFor(` ${RP} `, { REVIEWER_PHONE: RP, REVIEWER_OTP: CODE }).code === CODE && reviewerFor(RP, { REVIEWER_PHONE: RP, REVIEWER_OTP: '1234567' }).refuse === true,
    '7.1 reviewerFor: null unless the phone matches; the code only when six digits');
  const authSrc = fs.readFileSync(P('src/api/vendor/auth.js'), 'utf8');
  ok(/const _devOk = !!\(process\.env\.DEV_OTP && cleanOtp === process\.env\.DEV_OTP\);/.test(authSrc) && !/process\.env\.REVIEWER_(OTP|PHONE)/.test(authSrc),
    '7.2 DEV_OTP\u2019s line is untouched, and auth.js never reads REVIEWER_PHONE or REVIEWER_OTP itself (one home)');
  return R;
}

const AUTH = 'src/api/vendor/auth.js';
const HOME = 'src/lib/vendor/reviewerLogin.js';
const MUTATIONS = [
  { id: 'M1', file: AUTH, from: "  if (reviewer) {\n    console.log('[reviewer] session opened for the reviewer account (send-otp; no message sent)');\n    return res.json({ ok: true });\n  }\n", to: '', cell: '2.1' },
  { id: 'M2', file: AUTH, from: "  const otp     = reviewer ? reviewer.code : generateOtp();\n  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);\n  const expires = new Date(Date.now() + OTP_TTL_MS).toISOString();\n\n  const { error: upsertErr } = await supabase.from('otp_sessions').upsert(\n    { phone: cleanPhone, otp_hash: otpHash, purpose: 'login'", to: "  const otp     = generateOtp();\n  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);\n  const expires = new Date(Date.now() + OTP_TTL_MS).toISOString();\n\n  const { error: upsertErr } = await supabase.from('otp_sessions').upsert(\n    { phone: cleanPhone, otp_hash: otpHash, purpose: 'login'", cell: '2.2' },
  { id: 'M3', file: AUTH, from: "  if (reviewer && reviewer.refuse) {\n    console.warn('[reviewer] refused: REVIEWER_OTP unset or not six digits (send-otp)');", to: "  if (false) {\n    console.warn('[reviewer] refused: REVIEWER_OTP unset or not six digits (send-otp)');", cell: '3.1' },
  { id: 'M4', file: HOME, from: "  if (!SIX_DIGITS.test(code)) return { refuse: true };", to: "  if (!code) return { refuse: true };", cell: '3.2' },
  { id: 'M5', file: HOME, from: "  if (!rp || !p || p !== rp) return null;", to: "  if (!rp || !p) return null;", cell: '4.1' },
  { id: 'M6', file: AUTH, from: "  if (reviewerFor(cleanPhone)) console.log(`[reviewer] verify-otp for the reviewer account purpose=${purpose}`);   // CE-46 IGD-2 G7\n", to: '', cell: '5.1' },
  { id: 'M7', file: AUTH, from: "    console.log('[reviewer] session opened for the reviewer account (forgot-pin; no message sent)');\n    return res.json({ ok: true });", to: "    console.log('[reviewer] session opened for the reviewer account (forgot-pin; no message sent)');", cell: '6.1' },
  { id: 'M8', file: AUTH, from: "  if (reviewer && reviewer.refuse) {\n    console.warn('[reviewer] refused: REVIEWER_OTP unset or not six digits (forgot-pin)');", to: "  if (false) {\n    console.warn('[reviewer] refused: REVIEWER_OTP unset or not six digits (forgot-pin)');", cell: '6.2' },
];

function loadAuth(mut) {
  const homeSrc = fs.readFileSync(P(HOME), 'utf8');
  const hs = mut && mut.file === HOME ? homeSrc.replace(mut.from, mut.to) : homeSrc;
  if (mut && mut.file === HOME && hs === homeSrc) throw new Error(`${mut.id} anchor not found`);
  const hf = require.resolve(P(HOME)); delete require.cache[hf];
  require.cache[hf] = { id: hf, filename: hf, loaded: true, exports: loadAt(HOME, hs) };
  const as = fs.readFileSync(P(AUTH), 'utf8');
  const a2 = mut && mut.file === AUTH ? as.replace(mut.from, mut.to) : as;
  if (mut && mut.file === AUTH && a2 === as) throw new Error(`${mut.id} anchor not found`);
  return loadAt(AUTH, a2);
}

(async () => {
  let fail = 0;
  const base = await cells(loadAuth(null));
  console.log('b152 \u00b7 the reviewer account\u2019s sign-in (CE-46 IGD-2 G7)');
  for (const c of base) { console.log(`  ${c.pass ? 'PASS' : 'FAIL'}  ${c.name}`); if (!c.pass) fail += 1; }
  console.log(`\nb152: ${base.length - fail} passed, ${fail} failed`);
  if (MUTATE) {
    let mf = 0;
    console.log('\nmutations (each must redden its cell; nothing on disk is written)');
    for (const m of MUTATIONS) {
      let red = false; let why = '';
      try { const res = await cells(loadAuth(m)); const c = res.find((x) => x.name.startsWith(`${m.cell} `)); red = !!c && !c.pass; } catch (e) { why = e.message; }
      console.log(`  ${red ? 'RED (good)' : 'GREEN (BAD)'}  ${m.id} -> cell ${m.cell}${why ? `  [${why}]` : ''}`);
      if (!red) mf += 1;
    }
    console.log(`\nb152 --mutate: ${MUTATIONS.length - mf} of ${MUTATIONS.length} reddened`);
    fail += mf;
  }
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('b152 threw:', e && e.stack); process.exit(1); });
