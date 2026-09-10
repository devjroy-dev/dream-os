#!/usr/bin/env node
'use strict';
// scripts/b72_identity_misbind_bench.js — F-42.148 / F-42.149 · THE MIS-BIND REFUSAL.
// CE-42 seat E, micro C. Bench number derived free at the cut.
//
// ═══ WHAT THIS PINS ══════════════════════════════════════════════════════════
// `users_auth_user_id_key` is UNIQUE (auth_user_id) WHERE NOT NULL. When the
// identity a phone owns is already bound to ANOTHER users row, the bind used to
// hand Postgres a collision and the caller got a sentence naming a CONSTRAINT and
// neither row. This bench pins that the arm now names both rows and refuses by
// type, and that every other path is untouched.
//
// ⚠ THE COST OF THE OLD MESSAGE IS THE REASON THIS EXISTS. On 2026-09-10 this
// seat read `duplicate key value violates "users_auth_user_id_key"`, inferred a
// split users register, proposed a fork built on it, and was disproven by one
// SELECT returning a single row. An error that cannot name its own subjects
// sends the next reader after the wrong bug.

const assert = require('assert');

let PASS = 0; const FAILS = [];
function cell(name, fn) {
  return Promise.resolve().then(fn).then(
    () => { PASS++; console.log(`  GREEN  ${name}`); },
    (e) => { FAILS.push(name); console.log(`  RED    ${name}\n         ${e && e.message}`); },
  );
}

// A supabase stub answering only the chains this arm builds, over real row shapes.
function makeDb(users) {
  const rows = users.map((u) => Object.assign({}, u));
  const writes = [];
  return {
    __rows: rows, __writes: writes,
    from() {
      let sel = rows.slice(); let mode = 'select'; let patch = null;
      const api = {
        select() { return api; },
        update(p) { mode = 'update'; patch = p; return api; },
        eq(col, val) { sel = sel.filter((r) => r[col] === val); return api; },
        maybeSingle() {
          if (mode === 'update') {
            for (const r of sel) {
              // The partial UNIQUE index, honoured by the stub — otherwise a bench
              // could go green over a write the database would have refused.
              if (patch.auth_user_id
                  && rows.some((o) => o.id !== r.id && o.auth_user_id === patch.auth_user_id)) {
                return Promise.resolve({ data: null, error: { message: 'duplicate key value violates "users_auth_user_id_key"' } });
              }
              Object.assign(r, patch); writes.push({ id: r.id, patch });
            }
          }
          return Promise.resolve({ data: sel[0] || null, error: null });
        },
        then(res) {
          if (mode === 'update') {
            for (const r of sel) {
              if (patch.auth_user_id
                  && rows.some((o) => o.id !== r.id && o.auth_user_id === patch.auth_user_id)) {
                return Promise.resolve({ data: null, error: { message: 'duplicate key value violates "users_auth_user_id_key"' } }).then(res);
              }
              Object.assign(r, patch); writes.push({ id: r.id, patch });
            }
          }
          return Promise.resolve({ data: sel, error: null }).then(res);
        },
      };
      return api;
    },
  };
}

const authClientThatHealsTo = (id, phone) => ({
  auth: {
    admin: {
      createUser: async () => ({ data: null, error: { message: 'phone already registered' } }),
      listUsers: async () => ({ data: { users: [{ id, phone }] }, error: null }),
    },
  },
});

// F-42.148's own specimen, from the founder's production rows of 2026-09-10.
const AUTH_ID  = 'ce496223-e460-40b4-b457-afe30841f310';
const CLAIMANT = 'f0fc38c5-ac73-41c2-92dd-48a0d2e858b1';   // +918757788550, unbound
const HOLDER   = '3c8eb9e0-e746-4d95-9630-17897aa64f05';   // +919999900550, holds AUTH_ID

(async () => {
  const mod = require('../src/lib/ensureAuthIdentity');
  const { ensureAuthIdentity, AuthIdentityBoundElsewhereError } = mod;

  console.log('\nb72 · F-42.148 / F-42.149 · THE MIS-BIND REFUSAL\n');

  await cell('1 · a mis-bind throws the TYPED error, not a constraint message', async () => {
    const db = makeDb([
      { id: CLAIMANT, phone: '+918757788550', auth_user_id: null },
      { id: HOLDER,   phone: '+919999900550', auth_user_id: AUTH_ID },
    ]);
    let thrown = null;
    try {
      await ensureAuthIdentity({
        supabase: db, authClient: authClientThatHealsTo(AUTH_ID, '918757788550'),
        userId: CLAIMANT, phone: '+918757788550',
      });
    } catch (e) { thrown = e; }
    assert.ok(thrown, 'it bound successfully — the collision was not caught');
    assert.ok(thrown instanceof AuthIdentityBoundElsewhereError,
      `threw ${thrown.name}: ${thrown.message}`);
    assert.strictEqual(thrown.code, 'identity_bound_elsewhere');
    assert.ok(!/duplicate key|users_auth_user_id_key/.test(thrown.message),
      'Postgres\'s constraint name reached the caller');
  });

  await cell('2 · the error NAMES BOTH ROWS — the whole point of it', async () => {
    const db = makeDb([
      { id: CLAIMANT, phone: '+918757788550', auth_user_id: null },
      { id: HOLDER,   phone: '+919999900550', auth_user_id: AUTH_ID },
    ]);
    let thrown = null;
    try {
      await ensureAuthIdentity({
        supabase: db, authClient: authClientThatHealsTo(AUTH_ID, '918757788550'),
        userId: CLAIMANT, phone: '+918757788550',
      });
    } catch (e) { thrown = e; }
    assert.strictEqual(thrown.holderUserId, HOLDER, 'the holder is not named');
    assert.strictEqual(thrown.userId, CLAIMANT, 'the claimant is not named');
    assert.strictEqual(thrown.authUserId, AUTH_ID, 'the identity is not named');
    assert.ok(thrown.message.includes(HOLDER) && thrown.message.includes(CLAIMANT),
      'both ids must be in the message a log line prints');
  });

  await cell('3 · IT REFUSES AND REPAIRS NOTHING — no row is moved', async () => {
    const db = makeDb([
      { id: CLAIMANT, phone: '+918757788550', auth_user_id: null },
      { id: HOLDER,   phone: '+919999900550', auth_user_id: AUTH_ID },
    ]);
    try {
      await ensureAuthIdentity({
        supabase: db, authClient: authClientThatHealsTo(AUTH_ID, '918757788550'),
        userId: CLAIMANT, phone: '+918757788550',
      });
    } catch (_e) { /* expected */ }
    assert.strictEqual(db.__writes.length, 0, `it wrote ${db.__writes.length} time(s)`);
    assert.strictEqual(db.__rows.find((r) => r.id === HOLDER).auth_user_id, AUTH_ID,
      'the holder was unbound — a data act an error path may not take');
    assert.strictEqual(db.__rows.find((r) => r.id === CLAIMANT).auth_user_id, null);
  });

  await cell('4 · the ORDINARY heal still binds — nothing else is touched', async () => {
    const db = makeDb([{ id: CLAIMANT, phone: '+918757788550', auth_user_id: null }]);
    const out = await ensureAuthIdentity({
      supabase: db, authClient: authClientThatHealsTo(AUTH_ID, '918757788550'),
      userId: CLAIMANT, phone: '+918757788550',
    });
    assert.strictEqual(out.authUserId, AUTH_ID);
    assert.strictEqual(out.healed, true);
    assert.strictEqual(db.__rows[0].auth_user_id, AUTH_ID, 'the bind did not happen');
  });

  await cell('5 · an ALREADY-BOUND row returns untouched (step 0, idempotent)', async () => {
    const db = makeDb([{ id: CLAIMANT, phone: '+918757788550', auth_user_id: AUTH_ID }]);
    const out = await ensureAuthIdentity({
      supabase: db, authClient: authClientThatHealsTo(AUTH_ID, '918757788550'),
      userId: CLAIMANT, phone: '+918757788550',
    });
    assert.strictEqual(out.authUserId, AUTH_ID);
    assert.strictEqual(out.created, false);
    assert.strictEqual(out.healed, false);
    assert.strictEqual(db.__writes.length, 0, 'an already-bound row was rewritten');
  });

  await cell('6 · both doors answer a mis-bind with a typed 409, never "try again"', async () => {
    const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    for (const p of ['src/api/couple/auth.js', 'src/api/vendor/auth.js']) {
      const src = strip(require('fs').readFileSync(p, 'utf8'));
      assert.ok(/AuthIdentityBoundElsewhereError/.test(src), `${p}: the typed error is not imported`);
      assert.ok(/reason:\s*'identity_bound_elsewhere'/.test(src), `${p}: no typed reason on the wire`);
      assert.ok(/status\(409\)/.test(src), `${p}: a mis-bind is not a 500 — it is a conflict`);
      const at = (n) => src.indexOf(n);
      assert.ok(at('identity_bound_elsewhere') < at("'Could not create session. Please try again.'"),
        `${p}: the retryable message is reached first, so the typed arm is dead`);
    }
  });

  console.log(`\nb72: ${PASS}/${PASS + FAILS.length} green`);
  if (FAILS.length) { console.log(`RED BY NAME: ${FAILS.join(' | ')}`); process.exit(1); }
  process.exit(0);
})().catch((e) => { console.error('bench threw:', e); process.exit(1); });
