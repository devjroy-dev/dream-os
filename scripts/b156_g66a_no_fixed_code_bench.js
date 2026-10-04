'use strict';
// scripts/b156_g66a_no_fixed_code_bench.js · CE-46 · G6-4 · F-44.245 · RUNG b156.
// DEV_OTP's universal code removed from both verify-otp doors. Drives the SHIPPED handlers through IGD-2 b152's harness (copied
// here, not required, so b152 stays its own). Mutations are compiled in memory; no file on disk is ever written.
// THE EXIT CODE IS THE VERDICT.
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


// ── THE RUNG ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const RP = '+919000000001'; const OTHER = '+919000000002'; const COUPLE = '+919000000003'; const RCODE = '246810'; const DEVCODE = '111111';
const inAMinute = () => new Date(Date.now() + 60000).toISOString();
const sess = (phone, code) => ({ phone, otp_hash: bcrypt.hashSync(code, 4), purpose: 'login', expires_at: inAMinute() });
const withEnv = (env, fn) => async () => {
  const names = ['REVIEWER_PHONE', 'REVIEWER_OTP', 'DEV_OTP']; const keep = {};
  for (const k of names) { keep[k] = process.env[k]; delete process.env[k]; }
  Object.assign(process.env, env);
  try { return await fn(); } finally { for (const k of names) { if (keep[k] === undefined) delete process.env[k]; else process.env[k] = keep[k]; } }
};
const VENDOR = 'src/api/vendor/auth.js'; const COUPLE_AUTH = 'src/api/couple/auth.js';
const load = (rel, src) => loadAt(rel, src == null ? fs.readFileSync(P(rel), 'utf8') : src);
// A correct code reaches the account lookup (no users row here: 500 "Account not found after OTP verification"); a wrong one is 400
// otp_invalid before it. So "signed in" reads as passing the code check.
// AMENDED BY LABEL, CE-47 WEB-4 cut 11 (b205; F-44.271 ruling c): send-otp no longer makes rows, so a correct code on a
// number with no account now goes on to the NEW-ACCOUNT session (an auth identity for the phone); with no auth service in
// this harness that answers 500 "Could not create session", or 200 new_account where one answers. Either is past the code check.
const passed = (x) => (x.r.status === 500 && /not found after OTP verification|Could not create session/.test(x.r.body.error)) || (x.r.status === 200 && x.r.body && x.r.body.new_account === true);
const refused = (x) => x.r.status === 400 && x.r.body.reason === 'otp_invalid';
const ALL = { DEV_OTP: DEVCODE, REVIEWER_PHONE: RP, REVIEWER_OTP: RCODE };

async function cells(vendor, couple) {
  const R = []; const ok = (c, name) => R.push({ name, pass: !!c }); let x;
  const v = (phone, otp, stored) => capture(withEnv(ALL, () => drive(vendor, '/verify-otp', { phone, otp, purpose: 'login' }, makeDb({ otp_sessions: [sess(phone, stored)] }))));
  const c = (phone, otp, stored) => capture(withEnv(ALL, () => drive(couple, '/verify-otp', { phone, otp, purpose: 'login' }, makeDb({ otp_sessions: [sess(phone, stored)] }))));
  x = await v(OTHER, DEVCODE, '482913'); ok(refused(x), '1.1 vendor door, DEV_OTP set in the env: its code no longer signs a vendor in');
  x = await v(RP, DEVCODE, RCODE); ok(refused(x), '1.2 vendor door: DEV_OTP\u2019s code does not sign the reviewer in either');
  x = await c(COUPLE, DEVCODE, '482913'); ok(refused(x), '1.3 couple door, DEV_OTP set: its code no longer signs a couple in');
  x = await v(OTHER, '482913', '482913'); ok(passed(x), '2.1 vendor door: the code sent to THIS phone still passes');
  x = await c(COUPLE, '482913', '482913'); ok(passed(x), '2.2 couple door: the code sent to THIS phone still passes');
  x = await v(RP, RCODE, RCODE); ok(passed(x), '3.1 the ONE fixed code: REVIEWER_OTP on REVIEWER_PHONE passes (its session holds that code, b152)');
  x = await v(OTHER, RCODE, '482913'); ok(refused(x), '3.2 REVIEWER_OTP on any other phone is refused');
  x = await c(RP, RCODE, '482913'); ok(refused(x), '3.3 REVIEWER_OTP is not a couple\u2019s code, even for the reviewer\u2019s number');
  const srcs = ['src/api/vendor/auth.js', 'src/api/couple/auth.js'].map((f) => fs.readFileSync(P(f), 'utf8'));
  ok(srcs.every((s) => !/process\.env\.DEV_OTP|_devOk/.test(s)), '4.1 neither door reads DEV_OTP any more');
  const all = require('child_process').execSync("grep -rln 'DEV_OTP' src || true", { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  const reads = all.filter((f) => /process\.env\.DEV_OTP|env\.DEV_OTP/.test(fs.readFileSync(P(f), 'utf8')));
  ok(reads.length === 0, '4.2 no file under src reads DEV_OTP (comments may name it)', reads.join(','));
  for (const s of srcs) {
    const verify = s.slice(s.indexOf("router.post('/verify-otp'"));
    ok(/const valid = await bcrypt\.compare\(cleanOtp, otpRow\.otp_hash\);/.test(verify) && !/cleanOtp === /.test(verify.slice(0, verify.indexOf('const valid'))), '4.3 verify-otp\u2019s only test is the stored hash for this phone (no fixed-code comparison beside it)');
  }
  return R;
}

const DEVLINE = "  const valid = await bcrypt.compare(cleanOtp, otpRow.otp_hash);";
const BACK = "  const _devOk = !!(process.env.DEV_OTP && cleanOtp === process.env.DEV_OTP);\n  const valid = _devOk || await bcrypt.compare(cleanOtp, otpRow.otp_hash);";
const MUTATIONS = [
  { id: 'M1', file: VENDOR, from: DEVLINE, to: BACK, cell: '1.1' },
  { id: 'M2', file: COUPLE_AUTH, from: DEVLINE, to: BACK, cell: '1.3' },
  { id: 'M3', file: VENDOR, from: DEVLINE, to: "  const valid = cleanOtp === '246810' || await bcrypt.compare(cleanOtp, otpRow.otp_hash);", cell: '3.2' },
];

(async () => {
  let fail = 0;
  const base = await cells(load(VENDOR), load(COUPLE_AUTH));
  console.log('b156 \u00b7 F-44.245: no fixed code signs anyone in but REVIEWER_OTP on REVIEWER_PHONE (CE-46 G6-4)');
  for (const c of base) { console.log(`  ${c.pass ? 'PASS' : 'FAIL'}  ${c.name}`); if (!c.pass) fail += 1; }
  console.log('\nmutations (each must redden its cell; nothing on disk is written: the mutated source is compiled in memory)');
  for (const m of MUTATIONS) {
    const src = fs.readFileSync(P(m.file), 'utf8');
    if (!src.includes(m.from)) { console.log(`  GREEN (BAD)  ${m.id} anchor not found`); fail += 1; continue; }
    const vm = load(VENDOR, m.file === VENDOR ? src.replace(m.from, m.to) : null);
    const cm = load(COUPLE_AUTH, m.file === COUPLE_AUTH ? src.replace(m.from, m.to) : null);
    const got = await cells(vm, cm); const cell = got.find((c) => c.name.startsWith(m.cell + ' '));
    if (cell && !cell.pass) console.log(`  RED (good)  ${m.id} -> cell ${m.cell}`); else { console.log(`  GREEN (BAD)  ${m.id} -> cell ${m.cell}`); fail += 1; }
  }
  const total = base.length + MUTATIONS.length;
  console.log(`\nb156: ${total - fail} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('b156 crashed:', e && e.stack); process.exit(2); });
