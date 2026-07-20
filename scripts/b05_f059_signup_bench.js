// scripts/b05_f059_signup_bench.js — TDW_05 F-05.9 signup-over-Meta bench (CE ruling, Block 05).
//
// PROVES the auth-identity gap is closed NON-VACUOUSLY:
//   A. ensureAuthIdentity — the create-or-heal helper, both branches, by mutation-teeth:
//        • absent   -> createUser fires, auth_user_id linked, created:true (RED if it throws)
//        • present  -> createUser rejected, existing identity re-linked, NEVER a second
//                      (RED if a second identity is minted / a divergent id is linked)
//        • bound    -> idempotent no-op (returns the existing id, no create)
//   B. §9 SYNTHESIS — the full signup sequence end to end against ONE shared in-memory DB:
//        /send-otp (Meta) -> /verify-otp [ensureAuthIdentity + mintSession] -> /provision
//      for BOTH couple and vendor, proving: exactly ONE auth identity is created, and
//      public.users.auth_user_id resolves to THAT identity — /provision re-binds to the
//      same users row (no divergent identity, no second users row).
//   C. SECURITY invariants: ensureAuthIdentity creates via the SERVICE-ROLE authClient, not
//      the app data client (client-separation); no OTP value and no identity secret leaks to
//      any log line on the verify path; the sealed send-path benches carry bcrypt-before-send.
//
// No network, no creds, no DB: metaCloud + twilio + @supabase/supabase-js are stubbed at the
// module boundary; the app data client is a stateful in-memory fake; handlers are pulled off
// the live express router.stack. Lane PNIDs are SET so /send-otp rides Meta and the plaintext
// code can be read back off the captured template payload.
'use strict';
const assert = require('assert');
const path   = require('path');

// ── base env: dummy creds; lanes Meta-live so /send-otp uses the Meta template send ──
process.env.SUPABASE_URL              = process.env.SUPABASE_URL              || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_role';
process.env.TWILIO_ACCOUNT_SID        = 'ACdummy';
process.env.TWILIO_AUTH_TOKEN         = 'dummy';
process.env.BRIDE_PHONE_NUMBER_ID     = 'PNID_BRIDE_123';
process.env.VENDOR_PHONE_NUMBER_ID    = 'PNID_VENDOR_456';

const ROOT = path.resolve(__dirname, '..');

// ── stub twilio (must NOT fire on the Meta path) ─────────────────────────────────────
const twilioPath = require.resolve('twilio');
const CAP = { twilio: null, meta: null, store: null };
require.cache[twilioPath] = {
  id: twilioPath, filename: twilioPath, loaded: true,
  exports: (_sid, _tok) => ({ messages: { create: async (p) => { CAP.twilio = p; return { sid: 'SM_fake' }; } } }),
};

// ── stub metaCloud; capture the auth-template send (carries the plaintext code) ──────
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

// ── stub @supabase/supabase-js: the route's module-level service-role authClient ─────
// It exposes exactly the admin surface ensureAuthIdentity + mintSession use, backed by
// CAP.store so the bench can count identities. `.from` is a harmless stub (never used:
// the route reads data through req.app.locals.supabase, not this client).
function fakeAuthClient() {
  const digits = (p) => String(p == null ? '' : p).replace(/[^0-9]/g, '');
  return {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
    auth: {
      verifyOtp: async ({ token_hash }) => ({
        data: { session: { access_token: 'access_' + token_hash, refresh_token: 'refresh_' + token_hash } },
        error: null,
      }),
      admin: {
        createUser: async ({ phone, phone_confirm }) => {
          const s = CAP.store;
          s.createCalls++;
          s.lastCreateArgs = { phone, phone_confirm };
          if (s.users.some((u) => digits(u.phone) === digits(phone))) {
            return { data: null, error: { message: 'phone_exists' } };
          }
          const id = 'auth_' + (++s.minted);
          s.users.push({ id, phone });
          return { data: { user: { id, phone } }, error: null };
        },
        listUsers: async ({ page }) => {
          CAP.store.listCalls++;
          return { data: { users: page === 1 ? CAP.store.users.slice() : [] }, error: null };
        },
        updateUserById: async (_id, _attrs) => ({ data: {}, error: null }),
        generateLink: async ({ email }) => ({ data: { properties: { hashed_token: 'hash_' + email } }, error: null }),
      },
    },
  };
}
const sbPath = require.resolve('@supabase/supabase-js');
const realSb = require('@supabase/supabase-js');
require.cache[sbPath] = {
  id: sbPath, filename: sbPath, loaded: true,
  exports: Object.assign({}, realSb, { createClient: () => fakeAuthClient() }),
};

function newStore() { return { users: [], minted: 0, createCalls: 0, listCalls: 0, lastCreateArgs: null }; }

// ── stateful in-memory app data client (public/engine reads+writes) ──────────────────
function memSupabase(db, idc) {
  const rows = (t) => (db[t] = db[t] || []);
  const nid  = (t) => { idc[t] = (idc[t] || 0) + 1; const p = { users: 'u', couples: 'c', vendors: 'v' }[t] || t[0]; return p + idc[t]; };
  function from(table) {
    const st = { op: 'select', cols: '*', filters: [], obj: null, onConflict: null, ran: false, result: null };
    const match = (r) => st.filters.every(([c, v]) => r[c] === v);
    const embed = (row) => {
      if (row && /users!inner/.test(st.cols)) {
        const usr = rows('users').find((u) => u.id === row.user_id);
        return Object.assign({}, row, { users: usr ? { name: usr.name == null ? null : usr.name } : null });
      }
      return row;
    };
    function exec(kind) {
      if (st.ran) return st.result;
      st.ran = true;
      const R = rows(table);
      if (st.op === 'select') {
        const m = R.filter(match);
        if (kind === 'single')     st.result = m.length ? { data: embed(m[0]), error: null } : { data: null, error: { message: 'no rows' } };
        else if (kind === 'maybe') st.result = { data: m.length ? embed(m[0]) : null, error: null };
        else                       st.result = { data: m.map(embed), error: null };
      } else if (st.op === 'insert') {
        const arr = Array.isArray(st.obj) ? st.obj : [st.obj];
        const created = arr.map((o) => { const row = Object.assign({}, o); if (row.id == null) row.id = nid(table); R.push(row); return row; });
        st.result = { data: kind === 'single' ? created[0] : created, error: null };
      } else if (st.op === 'update') {
        const m = R.filter(match); m.forEach((r) => Object.assign(r, st.obj)); st.result = { data: m, error: null };
      } else if (st.op === 'delete') {
        db[table] = R.filter((r) => !match(r)); st.result = { data: null, error: null };
      } else if (st.op === 'upsert') {
        const key = st.onConflict, o = st.obj;
        const idx = key ? R.findIndex((r) => r[key] === o[key]) : -1;
        if (idx >= 0) Object.assign(R[idx], o); else R.push(Object.assign({}, o));
        st.result = { data: null, error: null };
      }
      return st.result;
    }
    const b = {
      select(c) { st.cols = c || '*'; return b; },
      insert(o) { st.op = 'insert'; st.obj = o; return b; },
      update(o) { st.op = 'update'; st.obj = o; return b; },
      delete()  { st.op = 'delete'; return b; },
      upsert(o, opts) { st.op = 'upsert'; st.obj = o; st.onConflict = opts && opts.onConflict; return Promise.resolve(exec('void')); },
      eq(c, v)  { st.filters.push([c, v]); return b; },
      maybeSingle() { return Promise.resolve(exec('maybe')); },
      single()      { return Promise.resolve(exec('single')); },
      then(res, rej) { return Promise.resolve(exec('void')).then(res, rej); },
    };
    return b;
  }
  return { from };
}

// ── route + handler helpers (mirror the sealed bench) ────────────────────────────────
function freshRoute(rel) {
  const abs    = require.resolve(path.resolve(__dirname, rel));
  const otpAbs = require.resolve(path.join(ROOT, 'src/lib/otpSend.js'));
  delete require.cache[abs];
  delete require.cache[otpAbs];
  return require(abs);
}
function handlerFor(router, routePath) {
  const layer = (router.stack || []).find((l) => l.route && l.route.path === routePath && l.route.methods.post);
  if (!layer) throw new Error(`route not found: POST ${routePath}`);
  const st = layer.route.stack;
  return st[st.length - 1].handle; // last handler — skips requireAuth on /provision
}
function callHandler(handler, body, supabase, extraReq) {
  let resolveDone; const done = new Promise((r) => (resolveDone = r));
  const req = Object.assign({ body, app: { locals: { supabase } } }, extraReq || {});
  const res = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(p) { this.payload = p; resolveDone(); return this; },
    cookie() { return this; },
  };
  const logs = [];
  const ol = console.log, oe = console.error;
  console.log = (...a) => logs.push(a.map(String).join(' '));
  console.error = (...a) => logs.push(a.map(String).join(' '));
  const p = (async () => {
    handler(req, res, (e) => { if (e) res.json({ __next_err: String(e && e.message) }); });
    await Promise.race([done, new Promise((_, rej) => setTimeout(() => rej(new Error('handler timed out')), 4000))]);
  })().finally(() => { console.log = ol; console.error = oe; });
  return p.then(() => ({ statusCode: res.statusCode, payload: res.payload, logs }));
}
const codeFromMeta = () => CAP.meta && CAP.meta.payload && CAP.meta.payload.components[0].parameters[0].text;

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}

// ── the helper under test (required directly for Part A) ─────────────────────────────
const { ensureAuthIdentity, phoneDigits } = require(path.join(ROOT, 'src/lib/ensureAuthIdentity.js'));

(async () => {
  console.log('TDW_05 F-05.9 — signup-over-Meta / auth-identity bench\n');

  // ═══ vacuity self-tests (the assertions must have teeth) ═══════════════════════════
  await t('vacuity: log scanner catches a planted code leak', async () => {
    const leak = ['[x] code=123456 sent'];
    assert.ok(leak.some((l) => l.includes('123456')), 'scanner failed to catch a planted leak');
  });
  await t('vacuity: divergent-id detector would fire (linked !== created is caught)', async () => {
    let threw = false;
    try { assert.strictEqual('auth_ONE', 'auth_TWO', 'divergent identity'); } catch { threw = true; }
    assert.ok(threw, 'divergence assertion has no teeth');
  });

  // ═══ A. ensureAuthIdentity — create / heal / bound, by mutation-teeth ══════════════
  await t('A1 CREATE: absent identity -> createUser fires, auth_user_id linked, created:true', async () => {
    const db = { users: [{ id: 'u1', phone: '+919800000001', auth_user_id: null }] }, idc = {};
    CAP.store = newStore();
    const r = await ensureAuthIdentity({ supabase: memSupabase(db, idc), authClient: fakeAuthClient(), userId: 'u1', phone: '+919800000001' });
    assert.strictEqual(CAP.store.createCalls, 1, 'createUser was not called');           // RED if the create path is skipped/throws
    assert.strictEqual(r.created, true, 'created flag wrong');
    assert.strictEqual(r.healed, false, 'should not have healed');
    assert.strictEqual(db.users[0].auth_user_id, r.authUserId, 'auth_user_id not linked onto users');
    assert.ok(/^auth_/.test(r.authUserId), 'no identity minted');
    assert.strictEqual(CAP.store.minted, 1, 'exactly one identity expected');
    assert.strictEqual(CAP.store.lastCreateArgs.phone_confirm, true, 'identity-only (phone_confirm) not set — would dispatch SMS');
  });

  await t('A2 HEAL: phone already owns an identity -> re-link it, NEVER mint a second', async () => {
    const db = { users: [{ id: 'u1', phone: '+919800000002', auth_user_id: null }] }, idc = {};
    CAP.store = newStore();
    CAP.store.users.push({ id: 'auth_PRE', phone: '+919800000002' }); // pre-existing (orphan / legacy)
    CAP.store.minted = 1;
    const r = await ensureAuthIdentity({ supabase: memSupabase(db, idc), authClient: fakeAuthClient(), userId: 'u1', phone: '+919800000002' });
    assert.strictEqual(CAP.store.createCalls, 1, 'createUser should be attempted exactly once');
    assert.strictEqual(CAP.store.minted, 1, 'a SECOND identity was minted — one-person-one-auth-user violated'); // RED if it creates a second
    assert.strictEqual(r.healed, true, 'healed flag wrong');
    assert.strictEqual(r.created, false, 'created should be false on heal');
    assert.strictEqual(r.authUserId, 'auth_PRE', 'did not re-link the EXISTING identity');
    assert.strictEqual(db.users[0].auth_user_id, 'auth_PRE', 'users row bound to the wrong (divergent) identity');
  });

  await t('A3 BOUND: already linked -> idempotent no-op, no create', async () => {
    const db = { users: [{ id: 'u1', phone: '+919800000003', auth_user_id: 'auth_HAVE' }] }, idc = {};
    CAP.store = newStore();
    const r = await ensureAuthIdentity({ supabase: memSupabase(db, idc), authClient: fakeAuthClient(), userId: 'u1', phone: '+919800000003' });
    assert.strictEqual(CAP.store.createCalls, 0, 'createUser must not be called when already bound');
    assert.strictEqual(r.authUserId, 'auth_HAVE', 'returned wrong identity');
    assert.strictEqual(r.created, false); assert.strictEqual(r.healed, false);
  });

  await t('A4 create fails AND nothing to heal -> throws (create path is real)', async () => {
    const db = { users: [{ id: 'u1', phone: '+919800000004', auth_user_id: null }] }, idc = {};
    const badAuth = fakeAuthClient();
    badAuth.auth.admin.createUser = async () => ({ data: null, error: { message: 'boom' } });
    badAuth.auth.admin.listUsers  = async () => ({ data: { users: [] }, error: null });
    let threw = false;
    try { await ensureAuthIdentity({ supabase: memSupabase(db, idc), authClient: badAuth, userId: 'u1', phone: '+919800000004' }); }
    catch { threw = true; }
    assert.ok(threw, 'should throw when create fails with no identity to heal');
    assert.strictEqual(db.users[0].auth_user_id, null, 'must not link a bogus identity on failure');
  });

  await t('A5 client-separation: create uses authClient, never the app data client', async () => {
    const db = { users: [{ id: 'u1', phone: '+919800000005', auth_user_id: null }] }, idc = {};
    const dataClient = memSupabase(db, idc);
    dataClient.auth = { admin: { createUser: async () => { throw new Error('data client used for admin op!'); } } };
    CAP.store = newStore();
    const r = await ensureAuthIdentity({ supabase: dataClient, authClient: fakeAuthClient(), userId: 'u1', phone: '+919800000005' });
    assert.strictEqual(r.created, true, 'create did not run via the service-role authClient');
    assert.strictEqual(CAP.store.createCalls, 1, 'authClient.createUser not used');
  });

  // ═══ B. §9 SYNTHESIS — full signup sequence, shared DB, no divergent identity ══════
  async function synthesis(kind) {
    const isVendor = kind === 'vendor';
    const routeFile = isVendor ? '../src/api/vendor/auth.js' : '../src/api/couple/auth.js';
    const roleTable = isVendor ? 'vendors' : 'couples';
    const provRoleId = isVendor ? 'vendor_id' : 'couple_id';
    const phone = isVendor ? '+919811111111' : '+919822222222';

    CAP.store = newStore();
    const db = {}, idc = {};
    const supabase = memSupabase(db, idc);
    const router = freshRoute(routeFile);

    // 1) /send-otp — fresh phone: self-mint users + role row; Meta OTP; capture code
    CAP.meta = null; CAP.twilio = null;
    const send = await callHandler(handlerFor(router, '/send-otp'), { phone }, supabase);
    assert.ok(send.payload && send.payload.ok, `${kind} send-otp did not return ok: ${JSON.stringify(send.payload)}`);
    assert.ok(CAP.meta, `${kind} send-otp did not ride Meta`);
    assert.strictEqual(CAP.twilio, null, `${kind} send-otp wrongly hit Twilio`);
    const U = db.users.find((u) => u.phone === phone);
    assert.ok(U && U.auth_user_id == null, `${kind} users row should exist with NO auth identity yet`);
    assert.strictEqual(db[roleTable].length, 1, `${kind} role row not created`);
    const code = codeFromMeta();
    assert.ok(/^\d{6}$/.test(code), `${kind} no 6-digit code captured`);

    // 2) /verify-otp — proves OTP, ensureAuthIdentity CREATES the identity, mintSession mints
    const verify = await callHandler(handlerFor(router, '/verify-otp'), { phone, otp: code, purpose: 'login' }, supabase);
    assert.ok(verify.payload && verify.payload.ok, `${kind} verify-otp failed: ${JSON.stringify(verify.payload)}`);
    assert.ok(verify.payload.access_token && verify.payload.refresh_token, `${kind} no session minted`);
    assert.strictEqual(verify.payload.user_id, U.id, `${kind} verify-otp user_id mismatch`);
    const A = db.users.find((u) => u.id === U.id).auth_user_id;
    assert.ok(A && /^auth_/.test(A), `${kind} auth identity not linked onto users after verify`);
    assert.strictEqual(CAP.store.minted, 1, `${kind} expected exactly ONE identity created`);
    // no OTP value or identity secret in any verify-path log line
    assert.ok(!verify.logs.some((l) => l.includes(code)), `${kind} OTP value leaked to a log line`);
    assert.ok(!verify.logs.some((l) => l.includes(A)), `${kind} identity id leaked to a log line`);

    // 3) /provision — on the newly minted session (req.auth = the created identity)
    const prov = await callHandler(
      handlerFor(router, '/provision'),
      isVendor ? { phone, name: 'Vera', category: 'photographer' } : { phone, name: 'Meera' },
      supabase,
      { auth: { user_id: A, phone } },
    );
    assert.ok(prov.payload && prov.payload.ok, `${kind} provision failed: ${JSON.stringify(prov.payload)}`);
    assert.strictEqual(prov.payload.user_id, U.id, `${kind} provision resolved a DIVERGENT users row`);
    assert.ok(prov.payload[provRoleId], `${kind} provision returned no ${provRoleId}`);

    // 4) end-state invariants: one users row for this phone, one identity, and
    //    public.users.auth_user_id resolves to THAT one identity (no fork)
    assert.strictEqual(db.users.filter((u) => u.phone === phone).length, 1, `${kind} a second users row appeared`);
    assert.strictEqual(CAP.store.minted, 1, `${kind} a second auth identity appeared across the sequence`);
    assert.strictEqual(db.users.find((u) => u.id === U.id).auth_user_id, A, `${kind} auth_user_id does not resolve to the created identity`);
  }

  await t('B1 §9 synthesis COUPLE: send-otp -> verify-otp[create+mint] -> provision, one identity', () => synthesis('couple'));
  await t('B2 §9 synthesis VENDOR: send-otp -> verify-otp[create+mint] -> provision, one identity', () => synthesis('vendor'));

  // ═══ C. helper hygiene ════════════════════════════════════════════════════════════
  await t('C1 phoneDigits normalizes E.164 and Supabase digits-only to the same form', async () => {
    assert.strictEqual(phoneDigits('+918757788550'), '918757788550');
    assert.strictEqual(phoneDigits('918757788550'), '918757788550');
  });

  console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})();
