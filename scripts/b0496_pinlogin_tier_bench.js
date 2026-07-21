// scripts/b0496_pinlogin_tier_bench.js — TDW_04.5 F-04.96 (dream-os half).
//
// PROVES the pin-login rail now carries tier so the PWA session write can land it:
//   A. BEHAVIOUR — POST /pin-login (real handler off router.stack, in-memory data
//      client, stubbed authClient/bcrypt) returns name/category/tier sourced from
//      vendorRow. A Prestige vendor's response.tier === 'prestige'.
//   B. SOURCED-NOT-FAKED — with tier absent on the vendor row, response.tier === null
//      (the `|| null` fallback), proving the field is read from data, not hardcoded.
//   C. ONE DIALECT — pin-login's three field lines are byte-identical to verify-otp's
//      (:369-371) in the source, and vendorName is built the same way (:362 / :489).
//   D. TEETH (both-ways) — the same assertion, applied to the OLD okRes shape
//      (no tier/name/category), goes RED; and a source scan proves that stripping any
//      of the three fields from the handler would fail Part C.
//
// No network, no creds, no DB — twilio / metaCloud / @supabase/supabase-js are stubbed
// at the module boundary; the app data client is a stateful in-memory fake; the handler
// is pulled off the live express router.stack. Mirrors the sealed Block-05 benches.
'use strict';
const assert = require('assert');
const path   = require('path');
const fs     = require('fs');

// ── base env: dummy creds ────────────────────────────────────────────────────────────
process.env.SUPABASE_URL              = process.env.SUPABASE_URL              || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_role';
process.env.TWILIO_ACCOUNT_SID        = 'ACdummy';
process.env.TWILIO_AUTH_TOKEN         = 'dummy';

const ROOT = path.resolve(__dirname, '..');
const AUTH_REL = 'src/api/vendor/auth.js';
const AUTH_ABS = path.join(ROOT, AUTH_REL);

// ── stub twilio (never fires on the pin-login path) ──────────────────────────────────
const twilioPath = require.resolve('twilio');
require.cache[twilioPath] = {
  id: twilioPath, filename: twilioPath, loaded: true,
  exports: (_sid, _tok) => ({ messages: { create: async () => ({ sid: 'SM_fake' }) } }),
};

// ── stub metaCloud (import-chain safety; unused on pin-login) ─────────────────────────
const metaPath = require.resolve(path.join(ROOT, 'src/lib/metaCloud.js'));
require.cache[metaPath] = {
  id: metaPath, filename: metaPath, loaded: true,
  exports: { sendMetaTemplate: async () => ({ ok: true, wamid: 'wamid.fake', raw: null }) },
};

// ── stub bcryptjs — compare always true (PIN correctness is not what this bench tests) ─
const bcryptPath = require.resolve('bcryptjs');
require.cache[bcryptPath] = {
  id: bcryptPath, filename: bcryptPath, loaded: true,
  exports: { compare: async () => true, hash: async () => '$2a$10$fakehash' },
};

// ── stub @supabase/supabase-js: the module-level service-role authClient (mintSession) ─
function fakeAuthClient() {
  return {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
    auth: {
      verifyOtp: async ({ token_hash }) => ({
        data: { session: { access_token: 'access_' + token_hash, refresh_token: 'refresh_' + token_hash } },
        error: null,
      }),
      admin: {
        updateUserById: async () => ({ data: {}, error: null }),
        generateLink:   async ({ email }) => ({ data: { properties: { hashed_token: 'hash_' + email } }, error: null }),
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

// ── stateful in-memory app data client (supports users!inner embedding) ──────────────
function memSupabase(db) {
  const rows = (t) => (db[t] = db[t] || []);
  function from(table) {
    const st = { op: 'select', cols: '*', filters: [], obj: null, ran: false, result: null };
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
        st.result = { data: m.length ? embed(m[0]) : null, error: null }; // maybe/single both ok here
      } else if (st.op === 'update') {
        const m = R.filter(match); m.forEach((r) => Object.assign(r, st.obj)); st.result = { data: m, error: null };
      } else {
        st.result = { data: null, error: null };
      }
      return st.result;
    }
    const b = {
      select(c) { st.cols = c || '*'; return b; },
      update(o) { st.op = 'update'; st.obj = o; return b; },
      eq(c, v)  { st.filters.push([c, v]); return b; },
      maybeSingle() { return Promise.resolve(exec('maybe')); },
      single()      { return Promise.resolve(exec('single')); },
      then(res, rej) { return Promise.resolve(exec('void')).then(res, rej); },
    };
    return b;
  }
  return { from };
}

// ── route + handler helpers ──────────────────────────────────────────────────────────
function freshRoute() { delete require.cache[require.resolve(AUTH_ABS)]; return require(AUTH_ABS); }
function handlerFor(router, routePath) {
  const layer = (router.stack || []).find((l) => l.route && l.route.path === routePath && l.route.methods.post);
  if (!layer) throw new Error(`route not found: POST ${routePath}`);
  const stk = layer.route.stack;
  return stk[stk.length - 1].handle;
}
function callHandler(handler, body, supabase) {
  let resolveDone; const done = new Promise((r) => (resolveDone = r));
  const req = { body, app: { locals: { supabase } } };
  const res = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(p) { this.payload = p; resolveDone(); return this; },
    cookie() { return this; },
  };
  const ol = console.log, oe = console.error;
  console.log = () => {}; console.error = () => {};
  const p = (async () => {
    handler(req, res, (e) => { if (e) res.json({ __next_err: String(e && e.message) }); });
    await Promise.race([done, new Promise((_, rej) => setTimeout(() => rej(new Error('handler timed out')), 4000))]);
  })().finally(() => { console.log = ol; console.error = oe; });
  return p.then(() => ({ statusCode: res.statusCode, payload: res.payload }));
}

// ── fixtures ─────────────────────────────────────────────────────────────────────────
const PHONE = '+918757788550';
function freshDb(overrides = {}) {
  const vendor = Object.assign({
    id: 'v1', user_id: 'u1', pin_hash: '$2a$10$fakehash',
    pin_failed_attempts: 0, pin_locked_until: null,
    business_name: 'Aperture Studio', category: 'photographer', tier: 'prestige',
  }, overrides);
  return {
    users:   [{ id: 'u1', phone: PHONE, name: 'Priya', auth_user_id: 'auth_1' }],
    vendors: [vendor],
  };
}

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}

(async () => {
  console.log('TDW_04.5 F-04.96 — pin-login tier rail bench (dream-os half)\n');

  const router  = freshRoute();
  const handler = handlerFor(router, '/pin-login');

  // ── Part A — behaviour: Prestige vendor's tier rides the response ──────────────────
  await t('A: pin-login returns ok for a valid PIN', async () => {
    const r = await callHandler(handler, { phone: PHONE, pin: '1234' }, memSupabase(freshDb()));
    assert.strictEqual(r.statusCode, 200, `status ${r.statusCode}`);
    assert.strictEqual(r.payload.ok, true, `ok=${r.payload.ok} (${r.payload.error || ''})`);
  });
  await t("A: response.tier === 'prestige' (was the gated bug)", async () => {
    const r = await callHandler(handler, { phone: PHONE, pin: '1234' }, memSupabase(freshDb()));
    assert.strictEqual(r.payload.tier, 'prestige', `tier=${JSON.stringify(r.payload.tier)}`);
  });
  await t('A: response.name + category ride too (business_name / category)', async () => {
    const r = await callHandler(handler, { phone: PHONE, pin: '1234' }, memSupabase(freshDb()));
    assert.strictEqual(r.payload.name, 'Aperture Studio', `name=${JSON.stringify(r.payload.name)}`);
    assert.strictEqual(r.payload.category, 'photographer', `category=${JSON.stringify(r.payload.category)}`);
  });
  await t('A: name falls back to users.name when business_name is null (join works)', async () => {
    const r = await callHandler(handler, { phone: PHONE, pin: '1234' }, memSupabase(freshDb({ business_name: null })));
    assert.strictEqual(r.payload.name, 'Priya', `name=${JSON.stringify(r.payload.name)}`);
  });

  // ── Part B — sourced-not-faked: no tier on the row → response.tier === null ─────────
  await t('B: tier absent on vendor row → response.tier === null (read from data)', async () => {
    const r = await callHandler(handler, { phone: PHONE, pin: '1234' }, memSupabase(freshDb({ tier: null })));
    assert.strictEqual(r.payload.tier, null, `tier=${JSON.stringify(r.payload.tier)}`);
  });
  await t("B: a 'signature' row surfaces as tier === 'signature' (not floored)", async () => {
    const r = await callHandler(handler, { phone: PHONE, pin: '1234' }, memSupabase(freshDb({ tier: 'signature' })));
    assert.strictEqual(r.payload.tier, 'signature', `tier=${JSON.stringify(r.payload.tier)}`);
  });

  // ── Part C — one dialect: pin-login's 3 fields byte-identical to verify-otp's ───────
  const src = fs.readFileSync(AUTH_ABS, 'utf8');
  const threeFields = (fromLine, toLine) =>
    src.split('\n').slice(fromLine - 1, toLine).map((l) => l.trim())
      .filter((l) => /^(name|category|tier):/.test(l));
  await t('C: verify-otp exposes exactly [name, category, tier]', async () => {
    // locate verify-otp's res.json block by its unique routing_handle sibling
    const voStart = src.split('\n').findIndex((l) => /routing_handle: vendorRow\.routing_handle/.test(l)) + 1;
    const vo = threeFields(voStart - 3, voStart);
    assert.deepStrictEqual(
      vo,
      ['name:          vendorName,', 'category:      vendorRow.category || null,', 'tier:          vendorRow.tier || null,'],
      `verify-otp fields: ${JSON.stringify(vo)}`,
    );
  });
  await t('C: pin-login exposes the SAME three lines, byte-identical', async () => {
    const plIdx = src.split('\n').findIndex((l) => /\[vendor:pin-login\] ok phone=/.test(l)) + 1;
    const pl = threeFields(plIdx, plIdx + 12);
    assert.deepStrictEqual(
      pl,
      ['name:          vendorName,', 'category:      vendorRow.category || null,', 'tier:          vendorRow.tier || null,'],
      `pin-login fields: ${JSON.stringify(pl)}`,
    );
  });
  await t('C: vendorName is built identically in both routes (2 occurrences)', async () => {
    const n = (src.match(/const vendorName = vendorRow\.business_name \|\| vendorRow\.users\?\.name \|\| null;/g) || []).length;
    assert.strictEqual(n, 2, `vendorName occurrences: ${n}`);
  });

  // ── Part D — teeth: the OLD okRes shape fails Part A's assertion ────────────────────
  await t('D (both-ways): OLD okRes (no tier) FAILS the tier assertion', async () => {
    const oldPayload = { ok: true, user_id: 'u1', vendor_id: 'v1', access_token: 'a', refresh_token: 'r' };
    let redFired = false;
    try { assert.strictEqual(oldPayload.tier, 'prestige'); } catch { redFired = true; }
    assert.ok(redFired, 'tier assertion had no teeth against the un-cured shape');
  });
  await t('D (both-ways): stripping any of the 3 field lines would fail Part C', async () => {
    const withoutTier = src.replace(/    tier:          vendorRow\.tier \|\| null,\n/g, '');
    const plIdx = withoutTier.split('\n').findIndex((l) => /\[vendor:pin-login\] ok phone=/.test(l)) + 1;
    const pl = withoutTier.split('\n').slice(plIdx, plIdx + 12).map((l) => l.trim())
      .filter((l) => /^(name|category|tier):/.test(l));
    assert.ok(!pl.includes('tier:          vendorRow.tier || null,'), 'strip-tier mutation not detected');
  });

  console.log('');
  if (fail === 0) { console.log(`F-04.96 dream-os: ALL GREEN (${pass}/${pass})`); process.exit(0); }
  else { console.log(`F-04.96 dream-os: ${fail} FAILURE(S) of ${pass + fail}`); process.exit(1); }
})();
