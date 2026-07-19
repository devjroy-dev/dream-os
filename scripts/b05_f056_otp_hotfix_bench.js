// scripts/b05_f056_otp_hotfix_bench.js — TDW_05 F-05.6 fix (b) bench (CE-34).
//
// PROVES the OTP/auth from-resolution cure NON-VACUOUSLY by driving the REAL route
// handlers (couple/auth.js ×2, circle/join.js, vendor/auth.js ×2) and reading the
// exact `from` that getTwilio().messages.create() actually receives — the value a
// real caller produces. No network, no creds, no DB: twilio is stubbed at the module
// boundary (require.cache) to capture params; supabase is a chainable fake returning
// the happy-path role rows; the handler is pulled off the live express router.stack.
//
// Assertions:
//   (i)  OTP_WA_NUMBER SET   -> all five sends leave from the dedicated number.
//   (ii) OTP_WA_NUMBER UNSET -> each falls back to its current per-file number,
//        BYTE-IDENTICAL to the pre-fix send (default + custom-lane-var cases).
//   (iii) OTP body strings byte-stable (reference oracle per site); the OTP is
//        bcrypt-hashed before send (otp_sessions.otp_hash is a $2 hash, != the code);
//        NO code path logs the OTP (log scan), while phone-only logging still fires.
//
// Vacuity guards: every run asserts the send path actually executed (captured params
// non-null); a wrong-`from` expectation is asserted to THROW; the no-OTP-in-logs
// scanner is self-tested against a planted leak.
'use strict';
const assert = require('assert');
const path   = require('path');

// ── base env: dummy creds so route modules load; lane vars unset => repo defaults ──
process.env.SUPABASE_URL              = process.env.SUPABASE_URL              || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_role';
process.env.TWILIO_ACCOUNT_SID        = 'ACdummy';
process.env.TWILIO_AUTH_TOKEN         = 'dummy';

// ── stub twilio at the module boundary; capture messages.create params ─────────────
const twilioPath = require.resolve('twilio');
const CAP = { params: null };
require.cache[twilioPath] = {
  id: twilioPath, filename: twilioPath, loaded: true,
  exports: (_sid, _tok) => ({ messages: { create: async (p) => { CAP.params = p; return { sid: 'SM_fake' }; } } }),
};

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}

// ── fresh-require a route module (OTP_WA is a module-load-time const) ───────────────
function freshRoute(rel) {
  const abs = require.resolve(path.resolve(__dirname, rel));
  delete require.cache[abs];
  return require(abs);
}
function handlerFor(router, method, routePath) {
  const layer = (router.stack || []).find(l => l.route && l.route.path === routePath && l.route.methods[method]);
  if (!layer) throw new Error(`route not found: ${method.toUpperCase()} ${routePath}`);
  const st = layer.route.stack;
  return st[st.length - 1].handle; // the real handler (asyncHandler wrapper for circle is fine)
}

// ── chainable fake supabase: happy-path rows; captures the otp_sessions upsert ─────
function fakeSupabase(rows) {
  const cap = {};
  const from = (table) => {
    const b = {
      select: () => b, eq: () => b, insert: () => b, delete: () => b,
      upsert: async (payload) => { if (table === 'otp_sessions') cap.otpUpsert = payload; return { error: rows.__upsertErr || null }; },
      maybeSingle: async () => ({ data: (table in rows) ? rows[table] : null, error: null }),
      single:      async () => ({ data: (table in rows) ? rows[table] : { id: 'gen' }, error: null }),
      then: (resolve) => resolve({ error: null, data: null }), // bare-await on insert()/delete().eq()
    };
    return b;
  };
  return { from, __cap: cap };
}

// ── fake req/res; done resolves when the handler emits its terminal response ────────
function fakeReqRes(body, supabase) {
  let resolveDone; const done = new Promise(r => (resolveDone = r));
  const req = { body, app: { locals: { supabase } } };
  const res = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(payload) { this.payload = payload; resolveDone(); return this; },
    cookie() { return this; },
  };
  return { req, res, done };
}

// ── run one site's real handler under a given env; capture from/body/hash/logs ──────
async function runSite(site) {
  CAP.params = null;
  const router   = freshRoute(site.file);
  const handler  = handlerFor(router, 'post', site.path);
  const supabase = fakeSupabase(JSON.parse(JSON.stringify(site.rows)));
  const { req, res, done } = fakeReqRes(site.body, supabase);

  const logs = [];
  const ol = console.log, oe = console.error;
  console.log   = (...a) => logs.push(a.map(String).join(' '));
  console.error = (...a) => logs.push(a.map(String).join(' '));
  try {
    handler(req, res, (e) => { if (e) { res.json({ __next_err: String(e && e.message) }); } });
    await Promise.race([done, new Promise((_, rej) => setTimeout(() => rej(new Error('handler timed out')), 4000))]);
  } finally {
    console.log = ol; console.error = oe;
  }
  return {
    from:      CAP.params && CAP.params.from,
    body:      CAP.params && CAP.params.body,
    otpUpsert: supabase.__cap.otpUpsert,
    logs,
    payload:   res.payload,
  };
}

// ── site matrix ─────────────────────────────────────────────────────────────────────
const PHONE = '+919800000001';
const SITES = [
  { name: 'couple /send-otp (login)',   file: '../src/api/couple/auth.js', path: '/send-otp',   fallback: '+14787788550',
    body: { phone: PHONE }, rows: { users: { id: 'u1', name: 'T' }, vendors: null, couples: { id: 'c1' } },
    laneVar: 'BRIDE_WA_NUMBER',
    expect: (c) => `Your Dream Wedding login code is: ${c}. Valid for 5 minutes. Do not share this code.` },
  { name: 'couple /forgot-pin (reset)', file: '../src/api/couple/auth.js', path: '/forgot-pin', fallback: '+14787788550',
    body: { phone: PHONE }, rows: { users: { id: 'u1' }, couples: { id: 'c1' } },
    laneVar: 'BRIDE_WA_NUMBER',
    expect: (c) => `Your Dream Wedding PIN reset code is: ${c}. Valid for 5 minutes. Do not share this code.` },
  { name: 'circle /send-otp (join)',    file: '../src/api/circle/join.js', path: '/send-otp',   fallback: '+14787788550',
    body: { token: 'CIRCLE-ABCD', phone: PHONE }, rows: { circle_members: { id: 'm1', status: 'pending', expires_at: null } },
    laneVar: 'BRIDE_WA_NUMBER',
    expect: (c) => `Your Dream Wedding circle code is: ${c}. Valid for 5 minutes. Do not share this code.` },
  { name: 'vendor /send-otp (login)',   file: '../src/api/vendor/auth.js', path: '/send-otp',   fallback: '+917982159047',
    body: { phone: PHONE }, rows: { users: { id: 'u1', name: 'T' }, couples: null, vendors: { id: 'v1' } },
    laneVar: 'TDW_WA_NUMBER',
    expect: (c) => `Your DreamAI login code is: ${c}. Valid for 5 minutes. Do not share this code.` },
  { name: 'vendor /forgot-pin (reset)', file: '../src/api/vendor/auth.js', path: '/forgot-pin', fallback: '+917982159047',
    body: { phone: PHONE }, rows: { users: { id: 'u1' }, vendors: { id: 'v1' } },
    laneVar: 'TDW_WA_NUMBER',
    expect: (c) => `Your DreamAI PIN reset code is: ${c}. Valid for 5 minutes. Do not share this code.` },
];

const codeOf = (body) => { const m = /(\d{6})/.exec(String(body || '')); return m ? m[1] : null; };
const logScanLeaks = (logs, code) => logs.some((l) => l.includes(code));

(async () => {
  console.log('TDW_05 F-05.6 fix (b) — OTP dedicated-number resolution bench\n');

  // ── vacuity self-test: the no-OTP-in-logs scanner actually catches a leak ─────────
  await t('vacuity: log scanner flags a planted OTP leak (guards (iii) non-vacuity)', () => {
    assert.strictEqual(logScanLeaks(['[x] code is 123456 oops'], '123456'), true);
    assert.strictEqual(logScanLeaks(['[x] sent to +919800000001'], '123456'), false);
  });

  // ── (i) OTP_WA_NUMBER SET -> every site leaves from the dedicated number ──────────
  const DEDICATED = '15550009999';
  for (const site of SITES) {
    await t(`(i) SET   ${site.name} -> from = whatsapp:+${DEDICATED}`, async () => {
      process.env.OTP_WA_NUMBER = DEDICATED;
      delete process.env.BRIDE_WA_NUMBER; delete process.env.TDW_WA_NUMBER;
      const r = await runSite(site);
      assert.ok(r.from != null, 'send path did not execute (from captured null)'); // non-vacuous
      assert.strictEqual(r.from, `whatsapp:+${DEDICATED}`);
      assert.throws(() => assert.strictEqual(r.from, `whatsapp:+${site.fallback.slice(1)}`)); // mutation guard
    });
  }

  // ── (ii) UNSET -> byte-identical fallback to the current per-file number ───────────
  for (const site of SITES) {
    await t(`(ii) UNSET ${site.name} -> falls back to ${site.fallback} (byte-identical)`, async () => {
      delete process.env.OTP_WA_NUMBER;
      delete process.env.BRIDE_WA_NUMBER; delete process.env.TDW_WA_NUMBER; // repo defaults
      const r = await runSite(site);
      assert.ok(r.from != null, 'send path did not execute (from captured null)');
      assert.strictEqual(r.from, `whatsapp:${site.fallback}`);
    });
  }

  // ── (ii-custom) UNSET tracks the per-file lane var -> proves the fallback IS that var
  for (const site of SITES) {
    await t(`(ii) UNSET ${site.name} -> tracks ${site.laneVar} when set (dormant/byte-identical)`, async () => {
      delete process.env.OTP_WA_NUMBER;
      delete process.env.BRIDE_WA_NUMBER; delete process.env.TDW_WA_NUMBER;
      process.env[site.laneVar] = '15551234567';
      const r = await runSite(site);
      assert.strictEqual(r.from, 'whatsapp:+15551234567');
      delete process.env[site.laneVar];
    });
  }

  // ── (iii) body byte-stable + bcrypt-hash-before-send + no-OTP-in-logs ──────────────
  for (const site of SITES) {
    await t(`(iii) ${site.name} -> body byte-stable, OTP bcrypt-hashed, no OTP in logs`, async () => {
      process.env.OTP_WA_NUMBER = DEDICATED; // arbitrary; body/hash/logs are transport-agnostic
      delete process.env.BRIDE_WA_NUMBER; delete process.env.TDW_WA_NUMBER;
      const r = await runSite(site);
      assert.ok(r.from != null, 'send path did not execute');
      const code = codeOf(r.body);
      assert.ok(code, 'no 6-digit code found in body');
      // body byte-stable against the reference oracle
      assert.strictEqual(r.body, site.expect(code));
      // OTP bcrypt-hashed before send: otp_sessions.otp_hash is a $2 hash, not the code
      assert.ok(r.otpUpsert, 'otp_sessions.upsert not observed');
      assert.match(r.otpUpsert.otp_hash, /^\$2[aby]?\$\d{2}\$/, 'otp_hash is not a bcrypt hash');
      assert.notStrictEqual(r.otpUpsert.otp_hash, code, 'otp stored as plaintext');
      assert.strictEqual(r.otpUpsert.phone, PHONE, 'otp_session keyed on phone');
      // no code in any log line; phone-only logging still fires
      assert.strictEqual(logScanLeaks(r.logs, code), false, `OTP ${code} leaked into logs`);
      assert.ok(r.logs.some((l) => l.includes(PHONE)), 'expected phone-only send log line');
    });
  }

  console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})();
