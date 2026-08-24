#!/usr/bin/env node
// scripts/b05_f0589_name_at_mint_bench.js
// BLOCK 05 · F-05.89 · THE NAME THAT MUST TRAVEL · R-37.1, R-37.14–.20
//
// Run bare, and read the exit code as a second independent method alongside the
// verdict lines:   node scripts/b05_f0589_name_at_mint_bench.js ; echo $?
//
// WHAT THIS BENCH IS FOR. Both send-otp doors read `{ phone }` alone and minted
// `users` rows with NO NAME, while the landing sheet had already made the first
// name compulsory and was holding it in browser state until /provision — which
// runs only after a successful OTP. Every abandon in between was a permanent
// nameless row. The founder's census of 2026-08-25 measured 31 of them (28
// couple, 3 vendor), 18 never verified. This bench asserts the whole wire on
// this side of it: the door reads the name, the FRESH insert carries it, an
// EXISTING row is never overwritten from the door, and the verified-login
// promotion at the provision seam fires exactly once and then never again.
//
// BOTH-WAYS BY PRODUCTION MUTATION. Every cell drives a SHIPPED handler or the
// shipped `provisionRole`; nothing here re-implements the cure. §7's mutation
// list names, per cell, the single edit to PRODUCTION SOURCE that reddens it.
// A cell nobody can redden is not a cell.
//
// NO DATABASE, NO NETWORK, NO CREDS. The doors run inside a real express app on
// an ephemeral loopback port with a RECORDING in-memory supabase fake in
// `app.locals` (the b05_f0578 precedent), and `sendOtpCode` is stubbed at the
// module registry so no Meta send is ever attempted. The fake REMEMBERS its
// writes: the disease's signature is an insert whose payload has no `name`.
//
// WHAT THIS BENCH DOES NOT PROVE, so nobody reads more into it than it does:
// that the BROWSER posts the field. That half lives in `dreamos-pwa` and has
// its own bench (`scripts/b05_f0589_pwa_name_wire_bench.js`); the founder's
// walk is the only witness that the two halves meet on the wire.
'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');
const http   = require('http');
const express = require('express');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// ── HARMLESS PLACEHOLDER ENV, SEATED BEFORE ANY REQUIRE ──────────────────────
// Both door modules build a GoTrue client at MODULE LOAD (`createClient` at
// couple/auth.js and vendor/auth.js), and `@supabase/supabase-js` throws on an
// empty url before a single test can run. These two values are LOCAL FICTIONS
// and are the only credentials this bench has ever seen: no live secret is read
// here, none is printed, and the client they build is never called — every
// database read in this file goes through the in-memory fake below.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:1/bench-not-a-real-host';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-not-a-real-key';

// ── STUB THE TRANSPORT BEFORE THE DOORS ARE REQUIRED ─────────────────────────
// The doors `require('../../lib/otpSend')` at module load, so the stub must be
// seated in the registry first or the real module wins the reference.
const otpSendPath = require.resolve('../src/lib/otpSend.js');
require.cache[otpSendPath] = {
  id: otpSendPath, filename: otpSendPath, loaded: true, exports: {
    sendOtpCode: async () => ({ ok: true, stubbed: true }),
  },
};

const coupleAuth = require('../src/api/couple/auth.js');
const vendorAuth = require('../src/api/vendor/auth.js');
const { provisionRole } = require('../src/lib/provisionRole.js');
const { textPresent } = require('../src/lib/onboardingPredicate.js');

let pass = 0, fail = 0;
async function t(id, name, fn) {
  try { await fn(); console.log(`  PASS  ${id}  ${name}`); pass++; }
  catch (e) { console.log(`  FAIL  ${id}  ${name}\n        — ${e && e.message}`); fail++; }
}

// ── fixtures ─────────────────────────────────────────────────────────────────
const FRESH_PHONE = '+919800000589';
const HELD_PHONE  = '+919800000590';
const AUTH_ID     = '00000000-0000-4000-8000-000000000589';

// ── RECORDING supabase fake ──────────────────────────────────────────────────
// Faithful enough to reach the real branches, and it REMEMBERS every write.
// `writes` is the evidentiary surface of §2 and §3: the disease's signature is
// a `users` insert whose payload carries no `name` key at all.
function makeSupabase(rows, writes) {
  const store = JSON.parse(JSON.stringify(rows));
  function builder(table) {
    const filters = [];
    const b = {
      _table: table,
      select() { return b; },
      eq(col, val) { filters.push([col, val]); return b; },
      _match() {
        return (store[table] || []).filter(r =>
          filters.every(([c, v]) => (r[c] ?? null) === (v ?? null)));
      },
      maybeSingle() { const m = b._match(); return Promise.resolve({ data: m[0] || null, error: null }); },
      single() {
        const m = b._match();
        if (m.length !== 1) return Promise.resolve({ data: null, error: { message: 'not one row' } });
        return Promise.resolve({ data: m[0], error: null });
      },
      insert(payload) {
        writes.push({ op: 'insert', table, payload: JSON.parse(JSON.stringify(payload)) });
        const row = Object.assign({ id: `${table}-${(store[table] || []).length + 1}` }, payload);
        store[table] = (store[table] || []).concat([row]);
        const ret = {
          select() { return ret; },
          single() { return Promise.resolve({ data: row, error: null }); },
          maybeSingle() { return Promise.resolve({ data: row, error: null }); },
        };
        return ret;
      },
      update(payload) {
        const u = {
          eq(col, val) {
            const hit = (store[table] || []).filter(r => (r[col] ?? null) === (val ?? null));
            // BENCH SELF-CATCH, recorded rather than quietly fixed: this line
            // was `JSON.parse(JSON.stringify(payload))`, and `JSON.stringify`
            // DROPS keys whose value is `undefined`. A mutation that made the
            // seam write `{ name: undefined }` therefore recorded a payload
            // with no `name` key at all, and cell 5.7 read that as "no name
            // was written" — a green over the exact defect it exists to catch.
            // `keys` is captured from the LIVE object, before any copy.
            writes.push({
              op: 'update', table, matched: hit.length,
              payload: Object.assign({}, payload),
              keys: Object.keys(payload),
            });
            hit.forEach(r => Object.assign(r, payload));
            return Promise.resolve({ data: null, error: null });
          },
        };
        return u;
      },
      upsert() { writes.push({ op: 'upsert', table }); return Promise.resolve({ data: null, error: null }); },
      delete() { return { eq: () => Promise.resolve({ data: null, error: null }) }; },
    };
    return b;
  }
  return { from: builder, _store: store };
}

// ── drive a real door over real HTTP ─────────────────────────────────────────
async function callDoor(lane, body, rows) {
  const writes = [];
  const app = express();
  app.use(express.json());
  app.locals.supabase = makeSupabase(rows || { users: [], couples: [], vendors: [], otp_sessions: [] }, writes);
  app.use('/auth', lane === 'vendor' ? vendorAuth : coupleAuth);
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  try {
    const r = await fetch(`http://127.0.0.1:${port}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await r.json().catch(() => ({}));
    return { status: r.status, json, writes, store: app.locals.supabase._store };
  } finally { await new Promise(r => server.close(r)); }
}

const userInserts = (writes) => writes.filter(w => w.op === 'insert' && w.table === 'users');
// `keys` and not `payload`: see the recorder's self-catch note above. A write of
// `{ name: undefined }` is a NAME WRITE and must be counted as one.
const nameUpdates = (writes) => writes.filter(w => w.op === 'update' && w.table === 'users'
  && (w.keys || []).includes('name'));

// ── provision seam driver ────────────────────────────────────────────────────
async function callProvision({ rows, name, phone = HELD_PHONE, role = 'couple' }) {
  const writes = [];
  const supabase = makeSupabase(rows, writes);
  const out = await provisionRole(supabase, { authUserId: AUTH_ID, phone, name, role });
  return { out, writes, store: supabase._store };
}

// A row as the send-otp doors now mint one: named, but NEVER VERIFIED.
const unverifiedRow = (name) => ({
  users: [{ id: 'u-held', phone: HELD_PHONE, name, auth_user_id: null }],
  couples: [], vendors: [],
});

(async () => {
  console.log('\nb05_f0589_name_at_mint_bench — F-05.89 · the name that must travel\n');

  // ══ §1 · THE DOOR READS THE NAME ═══════════════════════════════════════════
  console.log('§1 — the door reads the name off the request');

  await t('1.1', 'couple door: fresh phone + name → users insert CARRIES the name', async () => {
    const { status, writes } = await callDoor('couple', { phone: FRESH_PHONE, name: 'Priya' });
    assert.strictEqual(status, 200, `expected 200, got ${status}`);
    const ins = userInserts(writes);
    assert.strictEqual(ins.length, 1, `expected 1 users insert, got ${ins.length}`);
    assert.strictEqual(ins[0].payload.name, 'Priya',
      `the typed name was discarded at the door — payload was ${JSON.stringify(ins[0].payload)}`);
  });

  await t('1.2', 'vendor door: fresh phone + name → users insert CARRIES the name [R-37.16]', async () => {
    const { status, writes } = await callDoor('vendor', { phone: FRESH_PHONE, name: 'Rahul' });
    assert.strictEqual(status, 200, `expected 200, got ${status}`);
    const ins = userInserts(writes);
    assert.strictEqual(ins.length, 1, `expected 1 users insert, got ${ins.length}`);
    assert.strictEqual(ins[0].payload.name, 'Rahul',
      `the vendor lane still discards — payload was ${JSON.stringify(ins[0].payload)}`);
  });

  await t('1.3', 'the phone is still the phone — the name did not disturb it', async () => {
    const { writes } = await callDoor('couple', { phone: FRESH_PHONE, name: 'Priya' });
    assert.strictEqual(userInserts(writes)[0].payload.phone, FRESH_PHONE);
  });

  await t('1.4', 'the role row is still minted beside the user', async () => {
    const { writes } = await callDoor('couple', { phone: FRESH_PHONE, name: 'Priya' });
    const role = writes.filter(w => w.op === 'insert' && w.table === 'couples');
    assert.strictEqual(role.length, 1, 'the couples row stopped being written');
    assert.strictEqual(role[0].payload.onboarding_state, 'new');
  });

  // ══ §2 · THE DISEASE, REPRODUCED AS ITS CURE ═══════════════════════════════
  // The abandon: SEND CODE is tapped, the OTP is never entered, nothing after
  // the door ever runs. What is on the row is what the door put there.
  console.log('\n§2 — the abandon: the row the founder finds tomorrow morning');

  await t('2.1', 'couple abandon → the minted row HOLDS the name (F-05.89 green)', async () => {
    const { store } = await callDoor('couple', { phone: FRESH_PHONE, name: 'Priya' });
    const row = store.users.find(u => u.phone === FRESH_PHONE);
    assert.ok(row, 'no users row was minted at all');
    assert.strictEqual(row.name, 'Priya',
      'the abandoned row is nameless — this is F-05.89 itself, uncured');
  });

  await t('2.2', 'vendor abandon → the minted row HOLDS the name', async () => {
    const { store } = await callDoor('vendor', { phone: FRESH_PHONE, name: 'Rahul' });
    assert.strictEqual(store.users.find(u => u.phone === FRESH_PHONE).name, 'Rahul');
  });

  await t('2.3', 'the minted row is never-verified by construction (auth_user_id unset)', async () => {
    const { store } = await callDoor('couple', { phone: FRESH_PHONE, name: 'Priya' });
    const row = store.users.find(u => u.phone === FRESH_PHONE);
    assert.ok(!row.auth_user_id,
      'the door minted a verified-looking row — R-37.14s marker would be destroyed');
  });

  // ══ §3 · NEVER OVER AN EXISTING ROW — the R-37.1 half ══════════════════════
  console.log('\n§3 — the door founds a row; it never overwrites one');

  await t('3.1', 'existing NAMED row + differing send-code name → NO name write', async () => {
    const rows = {
      users: [{ id: 'u1', phone: HELD_PHONE, name: 'Meera', auth_user_id: AUTH_ID }],
      couples: [{ id: 'c1', user_id: 'u1' }], vendors: [], otp_sessions: [],
    };
    const { writes, store } = await callDoor('couple', { phone: HELD_PHONE, name: 'IMPOSTOR' }, rows);
    assert.strictEqual(nameUpdates(writes).length, 0,
      'the door wrote a name onto an existing row — never-clobber breached at the door');
    assert.strictEqual(store.users[0].name, 'Meera');
  });

  await t('3.2', 'existing NAMELESS row + send-code name → still NO name write from the door', async () => {
    // Deliberate: the door founds, it does not fill. Filling an existing row is
    // provisionRole's, behind a verified login. An unverified caller must not
    // be able to name a row that already exists.
    const rows = {
      users: [{ id: 'u1', phone: HELD_PHONE, name: null, auth_user_id: null }],
      couples: [{ id: 'c1', user_id: 'u1' }], vendors: [], otp_sessions: [],
    };
    const { writes } = await callDoor('couple', { phone: HELD_PHONE, name: 'Priya' }, rows);
    assert.strictEqual(nameUpdates(writes).length, 0,
      'the door filled an existing row — that write belongs to the verified seam');
  });

  await t('3.3', 'existing row: no users INSERT is attempted at all', async () => {
    const rows = {
      users: [{ id: 'u1', phone: HELD_PHONE, name: 'Meera', auth_user_id: AUTH_ID }],
      couples: [{ id: 'c1', user_id: 'u1' }], vendors: [], otp_sessions: [],
    };
    const { writes } = await callDoor('couple', { phone: HELD_PHONE, name: 'Priya' }, rows);
    assert.strictEqual(userInserts(writes).length, 0);
  });

  // ══ §4 · HYGIENE — one predicate, one cap [R-37.19] ════════════════════════
  console.log('\n§4 — the door and the form agree about what a name is');

  await t('4.1', 'whitespace-only name → NULL, not a blank string', async () => {
    const { writes } = await callDoor('couple', { phone: FRESH_PHONE, name: '   ' });
    assert.strictEqual(userInserts(writes)[0].payload.name, null,
      'a name of one space was admitted — the door disagrees with brideComplete');
  });

  await t('4.2', 'absent name → NULL, and the door still succeeds (200)', async () => {
    const { status, writes } = await callDoor('couple', { phone: FRESH_PHONE });
    assert.strictEqual(status, 200, 'the door started refusing a nameless caller');
    assert.strictEqual(userInserts(writes)[0].payload.name, null);
  });

  await t('4.3', 'non-string name (a number) → NULL, never coerced', async () => {
    const { writes } = await callDoor('couple', { phone: FRESH_PHONE, name: 12345 });
    assert.strictEqual(userInserts(writes)[0].payload.name, null,
      'a non-string reached the column — textPresent was bypassed');
  });

  await t('4.4', 'surrounding whitespace is trimmed', async () => {
    const { writes } = await callDoor('couple', { phone: FRESH_PHONE, name: '  Priya  ' });
    assert.strictEqual(userInserts(writes)[0].payload.name, 'Priya');
  });

  await t('4.5', 'the cap is 80, matching couple/onboarding.js', async () => {
    const long = 'A'.repeat(200);
    const { writes } = await callDoor('couple', { phone: FRESH_PHONE, name: long });
    assert.strictEqual(userInserts(writes)[0].payload.name.length, 80,
      'the door admits a longer name than the form that writes the same column');
  });

  await t('4.6', 'the vendor door coerces identically — one cure, not two', async () => {
    const long = 'B'.repeat(200);
    const a = await callDoor('vendor', { phone: FRESH_PHONE, name: '  ' });
    const b = await callDoor('vendor', { phone: FRESH_PHONE, name: long });
    assert.strictEqual(userInserts(a.writes)[0].payload.name, null);
    assert.strictEqual(userInserts(b.writes)[0].payload.name.length, 80);
  });

  await t('4.7', 'the predicate is the ONE HOME, imported not copied [R-37.19]', async () => {
    assert.strictEqual(typeof textPresent, 'function',
      'textPresent is not exported — the un-fencing was reverted');
    const src = read('src/lib/provisionRole.js');
    assert.ok(!/^\s*function namePresent\s*\(/m.test(src),
      'provisionRole still defines its own namePresent — the duplicate did not die');
    assert.ok(/require\(['"]\.\/onboardingPredicate['"]\)/.test(src),
      'provisionRole does not import the one home');
    for (const rel of ['src/api/couple/auth.js', 'src/api/vendor/auth.js']) {
      assert.ok(/onboardingPredicate/.test(read(rel)), `${rel} does not import the predicate`);
    }
  });

  // ══ §5 · THE PROMOTION ARM [R-37.14] ═══════════════════════════════════════
  console.log('\n§5 — the verified login corrects a bad pre-name, exactly once');

  await t('5.1', 'never-verified row + DIFFERING verified name → PROMOTED', async () => {
    const { store, writes } = await callProvision({ rows: unverifiedRow('Pryia'), name: 'Priya' });
    assert.strictEqual(store.users[0].name, 'Priya',
      'the mistyped pre-name survived a verified login — R-37.14 did not fire');
    assert.strictEqual(nameUpdates(writes).length, 1, 'expected exactly one name write');
  });

  await t('5.2', 'AND the marker flips in the same breath — auth_user_id is set', async () => {
    const { store } = await callProvision({ rows: unverifiedRow('Pryia'), name: 'Priya' });
    assert.strictEqual(store.users[0].auth_user_id, AUTH_ID,
      'the rebind did not happen — the promotion could then repeat forever');
  });

  await t('5.3', 'SECOND login on the now-verified row → NEVER-CLOBBER, no write', async () => {
    // The whole "exactly once" claim: run provision twice against one row and
    // assert the second is inert. This is the cell that separates R-37.14 from
    // a plain clobber.
    const rows = unverifiedRow('Pryia');
    const writes = [];
    const supabase = makeSupabase(rows, writes);
    await provisionRole(supabase, { authUserId: AUTH_ID, phone: HELD_PHONE, name: 'Priya', role: 'couple' });
    const afterFirst = writes.length;
    await provisionRole(supabase, { authUserId: AUTH_ID, phone: HELD_PHONE, name: 'STALE FORM VALUE', role: 'couple' });
    const second = writes.slice(afterFirst).filter(w => w.op === 'update' && w.table === 'users'
      && Object.prototype.hasOwnProperty.call(w.payload, 'name'));
    assert.strictEqual(second.length, 0,
      'the promotion fired twice — a stale form value can now overwrite forever');
    assert.strictEqual(supabase._store.users[0].name, 'Priya');
  });

  await t('5.4', 'VERIFIED row + differing name → never-clobber holds (the F-OB.13 cell)', async () => {
    const rows = {
      users: [{ id: 'u-held', phone: HELD_PHONE, name: 'Meera', auth_user_id: AUTH_ID }],
      couples: [], vendors: [],
    };
    const { store, writes } = await callProvision({ rows, name: 'IMPOSTOR' });
    assert.strictEqual(store.users[0].name, 'Meera',
      'a verified row was clobbered — never-clobber breached at the seam');
    assert.strictEqual(nameUpdates(writes).length, 0);
  });

  await t('5.5', 'never-verified row + IDENTICAL name → no write at all', async () => {
    // The common case: the same person typed the same name at both doors. A
    // promotion that fired here would move updated_at for nothing.
    const { writes } = await callProvision({ rows: unverifiedRow('Priya'), name: 'Priya' });
    assert.strictEqual(nameUpdates(writes).length, 0,
      'an identical name issued a write — updated_at moved for nothing');
  });

  await t('5.6', 'VERIFIED nameless row + name → filled (the pure F-OB.13 cell)', async () => {
    // RETARGETED, and the reason is on the record. This cell first drove an
    // UNVERIFIED nameless row — where the fill term and the promotion term are
    // BOTH satisfied, so deleting the fill term left the cell green on the
    // promotion arm alone. Defence in depth in the code was a false claim in
    // the bench. A row that is already auth-bound cannot promote by
    // construction, so this now reaches the when-null fill and nothing else.
    const rows = {
      users: [{ id: 'u-held', phone: HELD_PHONE, name: null, auth_user_id: AUTH_ID }],
      couples: [], vendors: [],
    };
    const { store, writes } = await callProvision({ rows, name: 'Priya' });
    assert.strictEqual(store.users[0].name, 'Priya', 'the original when-null fill regressed');
    assert.strictEqual(nameUpdates(writes).length, 1);
  });

  await t('5.10', 'ALREADY-VERIFIED row re-bound to a NEW identity → NO promotion', async () => {
    // THE MARKER'S REAL JOB, and the cell that proves it is load-bearing.
    // 5.3's "exactly once" is guaranteed twice over: on a second login path (a)
    // matches by auth_user_id and path (b) never runs at all, so 5.3 stays
    // green even if the marker is forced true. THIS is the shape where only
    // the marker stands between a named row and a clobber — a phone whose row
    // is bound to one Supabase identity, meeting a NEW one (an identity re-mint
    // via ensureAuthIdentity). Path (a) misses, path (b) hits, and the row must
    // NOT promote because a verified login already claimed that name.
    const rows = {
      users: [{ id: 'u-held', phone: HELD_PHONE, name: 'Meera', auth_user_id: 'ffffffff-0000-4000-8000-00000000ffff' }],
      couples: [], vendors: [],
    };
    const { store, writes } = await callProvision({ rows, name: 'IMPOSTOR' });
    assert.strictEqual(store.users[0].name, 'Meera',
      'a re-bind promoted over a name a verified login had already set');
    assert.strictEqual(nameUpdates(writes).length, 0);
  });

  await t('5.7', 'never-verified row + NO name presented → nothing written', async () => {
    const { writes } = await callProvision({ rows: unverifiedRow('Pryia'), name: undefined });
    assert.strictEqual(nameUpdates(writes).length, 0,
      'a login with no name in hand still issued a write');
  });

  await t('5.8', 'the marker is READ, not assumed — the projection carries auth_user_id', async () => {
    // Independent method: the byte, not the behaviour. A projection that stops
    // selecting the column makes `promoteUnverified` silently always-true.
    const src = read('src/lib/provisionRole.js');
    assert.ok(/select\('id, name, auth_user_id'\)\.eq\('phone'/.test(src),
      'the phone-fallback projection no longer reads auth_user_id — the marker is fiction');
  });

  await t('5.9', 'the mechanism is NAMED beside the law [F-06.85] with its authority', async () => {
    // F-06.85: a soul/behaviour sentence conditioned on a mechanical fact names
    // the mechanism in-comment, so the mechanism's next sitting must re-read it.
    const src = read('src/lib/provisionRole.js');
    assert.ok(/users_auth_user_id_key/.test(src),
      'the partial-unique index the marker stands on is not named in-file');
    assert.ok(/typed beats scraped — founder word 2026-08-25/.test(src),
      'the founder ratification is not recorded beside the rule');
  });

  // ══ §6 · WHAT THIS SITTING DID NOT TOUCH ═══════════════════════════════════
  console.log('\n§6 — the fences this sitting kept');

  await t('6.1', 'no 23505 branch was added to either door [R-37.20]', async () => {
    for (const rel of ['src/api/couple/auth.js', 'src/api/vendor/auth.js']) {
      assert.ok(!/23505/.test(read(rel)),
        `${rel} grew race handling — that belongs to the F-05.85/.86 family, not here`);
    }
  });

  await t('6.2', 'brideInbound 120-cap path untouched', async () => {
    assert.ok(/slice\(0, 120\)/.test(read('src/lib/brideInbound.js')),
      'the circle-claim 120 cap moved — a different path with its own argued comment');
  });

  await t('6.3', 'the circle join door still carries its own name — unreached by this cure', async () => {
    assert.ok(/invitee_name/.test(read('src/api/circle/join.js')));
  });

  await t('6.4', 'ZERO new vendor- or bride-facing strings at either door', async () => {
    // The copy inventory, asserted rather than claimed: the error bytes the
    // doors can emit are the pre-arc set, character for character.
    for (const rel of ['src/api/couple/auth.js', 'src/api/vendor/auth.js']) {
      const src = read(rel);
      assert.ok(/Valid E\.164 phone number required\./.test(src));
      assert.ok(/Something went wrong\. Please try again\./.test(src));
      assert.ok(!/name is required/i.test(src), `${rel} minted a new refusal string`);
      assert.ok(!/enter your name/i.test(src), `${rel} minted a new refusal string`);
    }
  });

  // ══ §7 · THE MUTATION LEDGER ═══════════════════════════════════════════════
  // SEVENTEEN mutations, each a SINGLE edit to PRODUCTION SOURCE, each RUN at
  // this tree and each restored byte-identical after. The reds below are what
  // the runs actually printed, not what they were expected to print.
  // Comment-stripped per F-06.192: no cell here is satisfiable by editing a
  // comment except 5.9, whose whole subject IS a comment (F-06.85's law), and
  // which is labelled as such rather than counted as a behaviour cell.
  //
  //  M1   couple/auth.js  insert({phone, name: cleanName}) -> insert({phone})
  //                                         RED 1.1 2.1 4.1 4.2 4.3 4.4 4.5
  //  M2   vendor/auth.js  same edit                        RED 1.2 2.2 4.6
  //  M3   couple/auth.js  const {phone,name} -> const {phone}
  //                                         RED 1.1 2.1 4.4 4.5
  //  M4   couple/auth.js  textPresent(name) -> !!name      RED 4.1 4.3 4.4
  //  M5   both doors      slice(0,80) -> slice(0,200)      RED 4.5 4.6
  //  M6   couple/auth.js  name update added to the existing-row branch
  //                                         RED 3.1 3.2
  //  M7   couple/auth.js  a 23505 re-read branch added     RED 6.1
  //  M8   couple/auth.js  a new refusal string minted      RED 4.1 4.2 4.3 6.4
  //  M9   provisionRole   promotion arm -> false           RED 5.1 5.3
  //  M10  provisionRole   promoteUnverified = true         RED 5.10
  //  M11  provisionRole   !textPresent(currentName) -> true
  //                                         RED 5.3 5.4 5.5
  //  M12  provisionRole   !textPresent(currentName) -> false  RED 5.6
  //  M13  provisionRole   drop `name !== currentName`      RED 5.5
  //  M14  provisionRole   projection drops auth_user_id    RED 5.8
  //  M15  provisionRole   textPresent(name) -> true        RED 5.7
  //  M16  provisionRole   the rebind update emptied        RED 5.2 5.3
  //  M17  onboardingPred. textPresent removed from exports
  //                       RED BY PROCESS DEATH — TypeError at load, exit 1.
  //                       It prints no FAIL line, and a reader grepping only
  //                       for FAIL would score this mutation inert. The exit
  //                       code is the reading, which is why the header names
  //                       it as a second independent method.
  //
  // ── THREE VACUITY HOLES, FOUND BY THIS LEDGER AND RECORDED, NOT HIDDEN ─────
  // The first pass scored M10, M12 and M15 INERT. None was a weak mutation;
  // all three were weak CELLS, and all three are the same species — a cell
  // whose green had a second cause it was not testing.
  //   · M15 was inert because the RECORDER lied: `JSON.stringify` drops keys
  //     valued `undefined`, so a seam writing `{name: undefined}` recorded as
  //     no name write at all. The fake was destroying the evidence 5.7 exists
  //     to read. Cured at the recorder (`keys` captured live); 5.7 now bites.
  //   · M12 was inert because 5.6 drove an UNVERIFIED nameless row, where the
  //     fill term and the promotion term are BOTH satisfied — delete either and
  //     the other keeps the cell green. Retargeted to a VERIFIED nameless row,
  //     which the promotion arm cannot reach by construction.
  //   · M10 was inert because 5.3's "exactly once" is guaranteed twice over:
  //     on the second login path (a) matches by auth_user_id and path (b) never
  //     runs, so the marker is unreachable there. 5.10 was MINTED to reach the
  //     one shape where the marker alone stands between a named row and a
  //     clobber — a verified row re-binding to a NEW identity.
  // Defence in depth in the code was a false claim in the bench, three times.

  console.log(`\n──────────────────────────────────────────────`);
  console.log(`  ${pass} PASS · ${fail} FAIL   (${pass + fail} cells)`);
  console.log(`──────────────────────────────────────────────\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
