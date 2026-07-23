// scripts/b05_f056_otp_meta_bench.js — TDW_05 F-05.6 fix (a) bench (CE-35).
//
// PROVES the OTP-on-Meta primary path NON-VACUOUSLY by driving the REAL route handlers
// (couple/auth.js ×2, circle/join.js, vendor/auth.js ×2) and reading what each transport
// actually received. No network, no creds, no DB: metaCloud + twilio are stubbed at the
// module boundary (require.cache) to capture args; supabase is a chainable fake; the
// handler is pulled off the live express router.stack.
//
// Assertions:
//   (i)   lane Meta-live (*_PHONE_NUMBER_ID set) -> sendMetaTemplate called with the
//         registry template name, the OTP as BOTH the body code param AND the OTP-button
//         param, on the RIGHT lane phone-number-id; the Twilio path does NOT fire.
//   (ii)  lane NOT Meta-live -> the Twilio (b) fallback fires BYTE-IDENTICAL (from + body
//         oracle per site); sendMetaTemplate does NOT fire.
//   (iii) the OTP is bcrypt-hashed BEFORE the send (otp_sessions.otp_hash verifies against
//         the sent code) and is NEVER logged, on BOTH transports; phone-only log still fires.
//   (iv)  OTP does NOT pass through the F-05.2 gate: whatsapp.js's sendWhatsApp (the sole
//         gate site) is NEVER invoked on any OTP path, AND otpSend.js's source never
//         requires whatsapp / references the opt-out gate (call-graph bypass, by construction).
//
// Vacuity guards: the whatsapp spy is self-tested against a direct call; a wrong-PNID
// expectation is asserted to THROW; the log scanner is self-tested against a planted leak;
// every run asserts the chosen transport actually executed (captured args non-null).
'use strict';
const assert = require('assert');
const path   = require('path');
const bcrypt = require('bcryptjs');

// ── base env: dummy creds so route modules load; lane PNIDs unset by default ────────
process.env.SUPABASE_URL              = process.env.SUPABASE_URL              || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_role';
process.env.TWILIO_ACCOUNT_SID        = 'ACdummy';
process.env.TWILIO_AUTH_TOKEN         = 'dummy';
delete process.env.BRIDE_WA_NUMBER; delete process.env.TDW_WA_NUMBER;
delete process.env.BRIDE_PHONE_NUMBER_ID; delete process.env.VENDOR_PHONE_NUMBER_ID;

const ROOT = path.resolve(__dirname, '..');

// M2b (CE-62): the twilio module stub is DELETED. It existed so route modules that did
// `require('twilio')` could load without the real SDK. No module requires twilio any more
// and the package is purged from package.json, so require.resolve('twilio') now THROWS —
// the stub had become the only thing in this bench that still needed Twilio to exist.
const CAP = { meta: null };  // M2b: the `twilio` capture slot died with the stub

// ── stub metaCloud at the module boundary; capture sendMetaTemplate(args, opts) ──────
const metaPath = require.resolve(path.join(ROOT, 'src/lib/metaCloud.js'));
require.cache[metaPath] = {
  id: metaPath, filename: metaPath, loaded: true,
  exports: {
    sendMetaTemplate: async ({ to, payload }, opts = {}) => {
      CAP.meta = { to, payload, phoneNumberId: opts && opts.phoneNumberId };
      return { ok: true, wamid: 'wamid.fake', raw: null };
    },
  },
};

// ── spy whatsapp.js: the SOLE F-05.2 gate site. Must never fire on an OTP path. ──────
const waPath = require.resolve(path.join(ROOT, 'src/lib/whatsapp.js'));
const GATE = { called: false };
require.cache[waPath] = {
  id: waPath, filename: waPath, loaded: true,
  exports: { sendWhatsApp: async () => { GATE.called = true; return { sid: 'via_gate' }; }, metaLaneFor: () => null },
};

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}

// ── fresh-require a route + its otpSend (so otpSend rebinds to the stubbed metaCloud) ─
function freshRoute(rel) {
  const abs     = require.resolve(path.resolve(__dirname, rel));
  const otpAbs  = require.resolve(path.join(ROOT, 'src/lib/otpSend.js'));
  delete require.cache[abs];
  delete require.cache[otpAbs];   // rebinds require('./metaCloud') -> the stub (never deleted)
  return require(abs);
}
function handlerFor(router, method, routePath) {
  const layer = (router.stack || []).find(l => l.route && l.route.path === routePath && l.route.methods[method]);
  if (!layer) throw new Error(`route not found: ${method.toUpperCase()} ${routePath}`);
  const st = layer.route.stack;
  return st[st.length - 1].handle;
}

// ── chainable fake supabase: happy-path rows; captures the otp_sessions upsert ──────
function fakeSupabase(rows) {
  const cap = {};
  const from = (table) => {
    const b = {
      select: () => b, eq: () => b, insert: () => b, delete: () => b,
      upsert: async (payload) => { if (table === 'otp_sessions') cap.otpUpsert = payload; return { error: rows.__upsertErr || null }; },
      maybeSingle: async () => ({ data: (table in rows) ? rows[table] : null, error: null }),
      single:      async () => ({ data: (table in rows) ? rows[table] : { id: 'gen' }, error: null }),
      then: (resolve) => resolve({ error: null, data: null }),
    };
    return b;
  };
  return { from, __cap: cap };
}

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

async function runSite(site) {
  CAP.twilio = null; CAP.meta = null; GATE.called = false;
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
  return { twilio: CAP.twilio, meta: CAP.meta, gateCalled: GATE.called, otpUpsert: supabase.__cap.otpUpsert, logs, payload: res.payload };
}

// ── site matrix ─────────────────────────────────────────────────────────────────────
const PHONE = '+919800000001';
// ── W-1 DISCLOSURE (M2b, CE-62) ───────────────────────────────────────────────────────
// `fallback` and `expectBody` are GONE from this fixture, and the reason is founder-facing:
// the five OTP body strings they asserted lived ONLY inside the twilioSend closures, which
// the founder's gate (ii) deleted. `git grep "login code is" -- src` is now ZERO.
//
// The words did not MOVE and no new copy was authored — the branch that held them died, per
// the ruling. But the copy a user now receives comes from the Meta AUTHENTICATION templates
// on the WABA (tdw_couple_login_otp, tdw_couple_reset_otp, tdw_circle_join_otp,
// tdw_vendor_login_otp, tdw_vendor_reset_otp), NOT from this repo. The founder's copy veto
// over OTP wording is therefore exercised in Meta's template manager from here on, and no
// bench in this estate can assert those bytes. Named, not buried.
const SITES = [
  { name: 'couple /send-otp (login)',   file: '../src/api/couple/auth.js', path: '/send-otp',   lane: 'bride',
    pnidVar: 'BRIDE_PHONE_NUMBER_ID', tmplName: 'tdw_couple_login_otp',
    body: { phone: PHONE }, rows: { users: { id: 'u1', name: 'T' }, vendors: null, couples: { id: 'c1' } } },
  { name: 'couple /forgot-pin (reset)', file: '../src/api/couple/auth.js', path: '/forgot-pin', lane: 'bride',
    pnidVar: 'BRIDE_PHONE_NUMBER_ID', tmplName: 'tdw_couple_reset_otp',
    body: { phone: PHONE }, rows: { users: { id: 'u1' }, couples: { id: 'c1' } } },
  { name: 'circle /send-otp (join)',    file: '../src/api/circle/join.js', path: '/send-otp',   lane: 'bride',
    pnidVar: 'BRIDE_PHONE_NUMBER_ID', tmplName: 'tdw_circle_join_otp',
    body: { token: 'CIRCLE-ABCD', phone: PHONE }, rows: { circle_members: { id: 'm1', status: 'pending', expires_at: null } } },
  { name: 'vendor /send-otp (login)',   file: '../src/api/vendor/auth.js', path: '/send-otp',   lane: 'vendor',
    pnidVar: 'VENDOR_PHONE_NUMBER_ID', tmplName: 'tdw_vendor_login_otp',
    body: { phone: PHONE }, rows: { users: { id: 'u1', name: 'T' }, couples: null, vendors: { id: 'v1' } } },
  { name: 'vendor /forgot-pin (reset)', file: '../src/api/vendor/auth.js', path: '/forgot-pin', lane: 'vendor',
    pnidVar: 'VENDOR_PHONE_NUMBER_ID', tmplName: 'tdw_vendor_reset_otp',
    body: { phone: PHONE }, rows: { users: { id: 'u1' }, vendors: { id: 'v1' } } },
];

const PNID = { bride: 'PNID_BRIDE_123', vendor: 'PNID_VENDOR_456' };
const logScanLeaks = (logs, code) => logs.some((l) => l.includes(code));
// pull the code out of whichever transport carried it
const codeFromMeta   = (m) => m && m.payload && m.payload.components && m.payload.components[0].parameters[0].text;
const codeFromTwilio = (p) => { const m = /(\d{6})/.exec(String(p && p.body || '')); return m ? m[1] : null; };

(async () => {
  console.log('TDW_05 F-05.6 fix (a) — OTP-on-Meta auth-template bench\n');

  // ── vacuity self-tests ────────────────────────────────────────────────────────────
  await t('vacuity: whatsapp gate spy flips when sendWhatsApp is called directly', async () => {
    GATE.called = false;
    await require(waPath).sendWhatsApp('+1', 'x');
    assert.strictEqual(GATE.called, true, 'spy did not register a direct gate call');
    GATE.called = false;
  });
  await t('vacuity: log scanner flags a planted OTP leak', () => {
    assert.strictEqual(logScanLeaks(['[x] code is 123456 oops'], '123456'), true);
    assert.strictEqual(logScanLeaks(['[x] sent to +919800000001'], '123456'), false);
  });

  // ── (i) lane Meta-live -> Meta auth template on the right PNID; Twilio silent ────────
  for (const site of SITES) {
    await t(`(i) META  ${site.name} -> sendMetaTemplate(${site.tmplName}) on ${site.lane} PNID, code in body+button`, async () => {
      process.env[site.pnidVar] = PNID[site.lane];
      const r = await runSite(site);
      delete process.env[site.pnidVar];
      assert.ok(r.meta != null, 'Meta send path did not execute (meta captured null)'); // non-vacuous
      assert.strictEqual(r.twilio, null, 'Twilio path fired on a Meta-live lane');
      // right phone-number-id (mutation guard: wrong PNID expectation throws)
      assert.strictEqual(r.meta.phoneNumberId, PNID[site.lane]);
      assert.throws(() => assert.strictEqual(r.meta.phoneNumberId, 'WRONG_PNID'));
      // right template name from the registry
      assert.strictEqual(r.meta.payload.name, site.tmplName);
      // OTP threaded as BOTH the body code param AND the OTP-button param
      const comps = r.meta.payload.components;
      const bodyCode   = comps[0].parameters[0].text;
      const buttonComp = comps.find(c => c.type === 'button');
      assert.ok(/^\d{6}$/.test(bodyCode), 'body param is not a 6-digit code');
      assert.ok(buttonComp, 'no OTP button component');
      assert.strictEqual(buttonComp.parameters[0].text, bodyCode, 'button code param != body code param');
    });
  }

  // ── (ii) lane NOT Meta-live -> Twilio (b) fallback byte-identical; Meta silent ───────
  // ══ (ii) TWILIO fallback — RETIRED AT M2b (CE-62, founder gate (ii)) ═══════════════
  // Five cells proved the Twilio else-branch stayed byte-identical while the Meta primary
  // was dormant. The founder ruled full sunset: the else-branch is deleted, so these cells
  // assert a transport that no longer exists. Replaced by the no-fallback floor below.

  // ══ THE NO-FALLBACK FLOOR — the founder's ruled case (gate (ii)) ═══════════════════
  // 'PNID absent -> a LOUD, HONEST failure, never a silent success and never a resurrection.'
  for (const site of SITES) {
    await t(`(ii) NO-FALLBACK ${site.name} -> PNID absent throws by name; NO send, NO silent success`, async () => {
      delete process.env[site.pnidVar];
      const { sendOtpCode } = require('../src/lib/otpSend.js');
      let threw = null;
      try {
        await sendOtpCode({ to: PHONE, code: '123456', lane: site.lane, templateKey: site.tmplName, deps: { env: {} } });
      } catch (e) { threw = e; }
      assert.ok(threw, 'an unresolvable lane MUST throw, not resolve');
      assert.ok(/no Meta phone-number-id/.test(threw.message), `throw must name the cause, got: ${threw && threw.message}`);
      assert.ok(/no Twilio fallback/.test(threw.message), 'and must state that no fallback exists (no resurrection)');
      assert.ok(new RegExp(site.pnidVar).test(threw.message), `and must name the missing var ${site.pnidVar}`);
    });
  }
  await t('(ii) NO-FALLBACK vacuity: a PRESENT PNID does NOT throw (the floor is not always-throw)', async () => {
    const { sendOtpCode } = require('../src/lib/otpSend.js');
    const r = await sendOtpCode({
      to: PHONE, code: '123456', lane: 'bride', templateKey: SITES[0].tmplName,
      deps: {
        env: { BRIDE_PHONE_NUMBER_ID: 'PNID_B' },
        templates: { buildAuthTemplatePayload: () => ({ name: SITES[0].tmplName, components: [] }) },
        metaCloud: { sendMetaTemplate: async () => ({ ok: true }) },
      },
    });
    assert.strictEqual(r.transport, 'meta', 'a configured lane must ride Meta');
  });

  // ── (iii) bcrypt-before-send + no-OTP-in-logs, on BOTH transports ────────────────────
  for (const site of SITES) {
    for (const mode of ['META']) {  // TWILIO leg retired at M2b
      await t(`(iii) ${mode} ${site.name} -> OTP bcrypt-hashed before send, never logged`, async () => {
        if (mode === 'META') process.env[site.pnidVar] = PNID[site.lane];
        else                 delete process.env[site.pnidVar];
        const r = await runSite(site);
        delete process.env[site.pnidVar];
        const code = mode === 'META' ? codeFromMeta(r.meta) : codeFromTwilio(r.twilio);
        assert.ok(code, 'no code found on the chosen transport');
        // bcrypt-hashed BEFORE the send: otp_sessions.otp_hash verifies against the sent code
        assert.ok(r.otpUpsert, 'otp_sessions.upsert not observed');
        assert.match(r.otpUpsert.otp_hash, /^\$2[aby]?\$\d{2}\$/, 'otp_hash is not a bcrypt hash');
        assert.ok(bcrypt.compareSync(code, r.otpUpsert.otp_hash), 'sent code does not match the stored hash');
        assert.strictEqual(r.otpUpsert.phone, PHONE, 'otp_session keyed on phone');
        // the code appears in NO log line; the phone-only send log still fires
        assert.strictEqual(logScanLeaks(r.logs, code), false, `OTP ${code} leaked into logs`);
        assert.ok(r.logs.some((l) => l.includes(PHONE)), 'expected phone-only send log line');
      });
    }
  }

  // ── (iv) F-05.2 gate BYPASS: sendWhatsApp never fires on any OTP path ────────────────
  for (const site of SITES) {
    for (const mode of ['META']) {  // TWILIO leg retired at M2b
      await t(`(iv) ${mode} ${site.name} -> whatsapp.js F-05.2 gate never invoked`, async () => {
        if (mode === 'META') process.env[site.pnidVar] = PNID[site.lane];
        else                 delete process.env[site.pnidVar];
        const r = await runSite(site);
        delete process.env[site.pnidVar];
        assert.strictEqual(r.gateCalled, false, 'OTP routed through whatsapp.js (F-05.2 gate) — must not');
      });
    }
  }

  // ── (iv-static) otpSend.js never requires whatsapp / references the opt-out gate ─────
  await t('(iv) static: otpSend.js does not require whatsapp / reference the opt-out gate', () => {
    const src = require('fs').readFileSync(path.join(ROOT, 'src/lib/otpSend.js'), 'utf8');
    // strip the comment-only mentions before scanning executable intent
    const code = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/require\(['"][^'"]*whatsapp['"]\)/.test(code), "otpSend requires whatsapp — the gate could leak in");
    assert.ok(!/sendWhatsApp/.test(code), 'otpSend references sendWhatsApp');
    assert.ok(!/optedOut|opted_out|isOptedOut/.test(code), 'otpSend references the opt-out gate');
  });

  console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})();
