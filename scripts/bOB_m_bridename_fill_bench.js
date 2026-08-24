#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/bOB_m_bridename_fill_bench.js
// M-BRIDE-NAME · ZIP 1 (dream-os) — F-OB.13 + F-OB.14
//
// THE CLAIM UNDER TEST, in one sentence: a name presented at the signup door
// LANDS on `public.users.name` no matter which of provisionRole's three identity
// paths the caller takes, and NEVER overwrites a name already on file.
//
// WHY THE SECOND HALF MATTERS AS MUCH AS THE FIRST. `provisionRole` runs on
// EVERY login, not only at signup, and three other writers set `users.name`
// deliberately (`src/api/vendor/me.js`, `src/api/vendor/onboarding.js`,
// `src/agent/onboarding.js`). A fill that clobbered would let a stale value in
// a signup form quietly undo a correction its owner had already made — a defect
// strictly worse than the one being cured. §1.2, §1.6 and the §3.2/§3.3
// mutations exist for that half alone.
//
// Runnable from ANY working directory (§9: "a cure nobody can re-run quietly
// stops being a cure"). Paths resolve from __dirname, never from cwd.
//
//   node scripts/bOB_m_bridename_fill_bench.js
//
// §1 BEHAVIOURAL — drives the REAL `provisionRole` against a fake supabase
//    plane, on all three identity paths and BOTH caller shapes (couple and
//    vendor), because R-35.13 put the fill in the shared function.
// §2 STRUCTURAL — asserts in SHIPPED SOURCE what a live HTTP stack would be
//    needed to drive (PROVABLE-EQUIVALENT DOCTRINE, CE-115).
// §3 MUTATION — proves §1 and §2 are non-vacuous by breaking PRODUCTION CODE
//    (never test setup) and asserting the corresponding cell goes RED.
//
// ── ON THE FIXTURES ──────────────────────────────────────────────────────────
// These uuids are SYNTHETIC and are labelled so deliberately. The precedent in
// this estate is to use the founder's own pasted production rows, and that is
// not available here: the 2026-08-18 census SELECT returned AGGREGATE COUNTS
// (20 nameless of 38), never row identities, so no production uuid was ever
// pasted to this seat. Inventing one and calling it his would be the worse sin.
// The founder's WALK is what tests this against real rows; this bench tests the
// logic. Both are needed and neither substitutes for the other.
'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = (p) => path.join(ROOT, p);
const read = (p) => fs.readFileSync(SRC(p), 'utf8');

let pass = 0, fail = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; fails.push(name); console.log(`  FAIL ${name}\n         ${e.message}`); }
}
async function ta(name, fn) {
  try { await fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; fails.push(name); console.log(`  FAIL ${name}\n         ${e.message}`); }
}
function H(h) { console.log(`\n${h}`); }

// ── FIXTURES (SYNTHETIC — see the header) ────────────────────────────────────
const AUTH_LINKED  = 'a1111111-1111-4111-8111-111111111111'; // path (a) subject
const AUTH_REBIND  = 'a2222222-2222-4222-8222-222222222222'; // path (b) subject
const AUTH_FRESH   = 'a3333333-3333-4333-8333-333333333333'; // path (c) subject
const USER_LINKED  = 'u1111111-1111-4111-8111-111111111111';
const USER_REBIND  = 'u2222222-2222-4222-8222-222222222222';
const PHONE_REBIND = '+919888294440';

// ── TEST SETUP, DISCLOSED (never production code) ────────────────────────────
// A plane shaped to EXACTLY the calls `provisionRole` makes:
//   .from('users').select(cols).eq('auth_user_id'|'phone', v).maybeSingle()
//   .from('users').update({...}).eq('id', v)                  -> terminal
//   .from('users').insert({...}).select(cols).single()
//   .from('couples'|'vendors').select('id, pin_hash').eq('user_id', v).maybeSingle()
//   .from('couples'|'vendors').insert({...}).select('id, pin_hash').single()
//
// THE PROJECTION IS HONOURED, AND THAT IS LOAD-BEARING, NOT DECORATION. A plane
// that returned every column regardless of `select(...)` would make the widening
// to `select('id, name')` invisible to this bench — narrowing it back to `'id'`
// would still pass, even though on the real plane it would leave `currentName`
// undefined and turn the never-clobber guard into a clobber. §3.3 is that proof,
// and it only works because this plane projects what it was asked for.
function plane(users) {
  const state = {
    users: users.map((u) => ({ ...u })),
    roles: [],
    writes: [],          // every update issued, in order
    inserts: [],         // every insert issued, in order
  };
  const project = (row, cols) => {
    if (!row) return null;
    const out = {};
    String(cols).split(',').map((c) => c.trim()).forEach((c) => { out[c] = row[c] ?? null; });
    return out;
  };
  const api = {
    _state: state,
    from(table) {
      const q = { _t: table, _cols: '*', _mode: null, _payload: null };
      q.select = (cols) => { if (cols) q._cols = cols; return q; };
      q.update = (payload) => { q._mode = 'update'; q._payload = payload; return q; };
      q.insert = (payload) => { q._mode = 'insert'; q._payload = payload; return q; };
      q.eq = (col, val) => {
        if (q._mode === 'update') {
          // TERMINAL: `await supabase.from(t).update({...}).eq('id', v)`
          state.writes.push({ table: q._t, by: { [col]: val }, payload: { ...q._payload } });
          const row = state.users.find((u) => u[col] === val);
          if (row) Object.assign(row, q._payload);
          return Promise.resolve({ error: null });
        }
        q._eqCol = col; q._eqVal = val;
        return q;
      };
      q.maybeSingle = async () => {
        if (q._t === 'users') {
          const row = state.users.find((u) => u[q._eqCol] === q._eqVal);
          return { data: project(row, q._cols) };
        }
        const row = state.roles.find((r) => r.table === q._t && r.user_id === q._eqVal);
        return { data: row ? { id: row.id, pin_hash: row.pin_hash ?? null } : null };
      };
      q.single = async () => {
        state.inserts.push({ table: q._t, payload: { ...q._payload } });
        if (q._t === 'users') {
          const row = { id: `NEW-${state.users.length}`, ...q._payload };
          state.users.push(row);
          return { data: project(row, q._cols), error: null };
        }
        const row = { table: q._t, id: `ROLE-${state.roles.length}`, pin_hash: null, ...q._payload };
        state.roles.push(row);
        return { data: { id: row.id, pin_hash: row.pin_hash }, error: null };
      };
      return q;
    },
  };
  return api;
}

const userWrites = (p) => p._state.writes.filter((w) => w.table === 'users');
const nameWrites = (p) => userWrites(p).filter((w) => 'name' in w.payload);
const rowById    = (p, id) => p._state.users.find((u) => u.id === id);

function loadProvision() {
  delete require.cache[require.resolve(SRC('src/lib/provisionRole'))];
  return require(SRC('src/lib/provisionRole')).provisionRole;
}
let provisionRole = loadProvision();

(async () => {

// ═════════════════════════════════════════════════════════════════════════════
H('§1 BEHAVIOURAL — the real provisionRole on all three identity paths');
// ═════════════════════════════════════════════════════════════════════════════

await ta('§1.1 path (a) linked row, name NULL, name typed ⇒ FILLED, and returned', async () => {
  const p = plane([{ id: USER_LINKED, auth_user_id: AUTH_LINKED, phone: PHONE_REBIND, name: null }]);
  const r = await provisionRole(p, { authUserId: AUTH_LINKED, phone: PHONE_REBIND, name: 'Meera', role: 'couple' });
  assert.strictEqual(rowById(p, USER_LINKED).name, 'Meera', 'F-OB.13: the typed name did not land on path (a)');
  assert.strictEqual(r.name, 'Meera', 'the post-write witness did not come back');
  assert.strictEqual(nameWrites(p).length, 1, 'expected exactly one name write');
});

await ta('§1.2 path (a) linked row ALREADY NAMED ⇒ NEVER clobbered, and no write issued', async () => {
  const p = plane([{ id: USER_LINKED, auth_user_id: AUTH_LINKED, phone: PHONE_REBIND, name: 'Priya' }]);
  const r = await provisionRole(p, { authUserId: AUTH_LINKED, phone: PHONE_REBIND, name: 'Meera', role: 'couple' });
  assert.strictEqual(rowById(p, USER_LINKED).name, 'Priya', 'a stale signup value overwrote a name on file');
  assert.strictEqual(r.name, 'Priya', 'the response reported a name the row does not hold');
  assert.strictEqual(nameWrites(p).length, 0, 'a write was issued against a row that needed none');
});

await ta('§1.3 path (a) name is WHITESPACE ONLY ⇒ treated as absence, filled', async () => {
  const p = plane([{ id: USER_LINKED, auth_user_id: AUTH_LINKED, phone: PHONE_REBIND, name: '   ' }]);
  await provisionRole(p, { authUserId: AUTH_LINKED, phone: PHONE_REBIND, name: 'Meera', role: 'couple' });
  assert.strictEqual(rowById(p, USER_LINKED).name, 'Meera',
    'a one-space name blocked the fill; the door and brideComplete now disagree about what a name is');
});

await ta('§1.4 path (a) NO name presented ⇒ zero writes, null returned (login is not a write)', async () => {
  const p = plane([{ id: USER_LINKED, auth_user_id: AUTH_LINKED, phone: PHONE_REBIND, name: null }]);
  const r = await provisionRole(p, { authUserId: AUTH_LINKED, phone: PHONE_REBIND, name: null, role: 'couple' });
  assert.strictEqual(userWrites(p).length, 0, 'a plain login issued a users write');
  assert.strictEqual(r.name, null);
});

await ta('§1.5 path (b) re-bind, name NULL ⇒ auth bound AND name filled', async () => {
  const p = plane([{ id: USER_REBIND, auth_user_id: null, phone: PHONE_REBIND, name: null }]);
  const r = await provisionRole(p, { authUserId: AUTH_REBIND, phone: PHONE_REBIND, name: 'Meera', role: 'couple' });
  const row = rowById(p, USER_REBIND);
  assert.strictEqual(row.auth_user_id, AUTH_REBIND, 'the re-bind itself regressed');
  assert.strictEqual(row.name, 'Meera', 'F-OB.13: path (b) still discards the typed name');
  assert.strictEqual(r.name, 'Meera');
});

// ── CELL RE-AIMED 2026-08-25 · F-05.89 · R-37.14, founder-ratified ──────────
// THIS CELL ASSERTED THE OPPOSITE UNTIL TODAY, and the reversal is a ruling,
// not a regression. It read: "path (b) re-bind onto an ALREADY NAMED legacy row
// ⇒ bound, never clobbered", guarding against "a legacy account losing its name
// to a signup form". R-37.14 promotes exactly this shape — a name on a row that
// NO VERIFIED LOGIN HAS EVER CLAIMED (`auth_user_id IS NULL`) yields ONCE to a
// name typed at the verified rebind, after which the marker flips and
// never-clobber resumes forever. Founder's word, 2026-08-25: typed beats
// scraped.
//
// THE RADIUS WAS MEASURED BEFORE THIS CELL WAS TOUCHED, because reversing a
// protection on a live estate is not a thing to do on reasoning alone. The
// founder's census of 2026-08-25 (`auth_user_id IS NULL AND name IS NOT NULL`)
// returned ONE row estate-wide — couple lane, minted 2026-06-30. That is the
// entire population this reversal can reach, and it can reach it exactly once,
// with the winning byte typed by the row's own owner at a verified door.
//
// §1.6b below is the half that did NOT move, and it is why this cell's change
// is a narrowing rather than a surrender: once ANY verified login has claimed a
// row, a later re-bind to a different identity cannot touch the name at all.
await ta('§1.6 path (b) re-bind onto a NEVER-VERIFIED named row ⇒ promoted once [R-37.14]', async () => {
  const p = plane([{ id: USER_REBIND, auth_user_id: null, phone: PHONE_REBIND, name: 'Anita' }]);
  const r = await provisionRole(p, { authUserId: AUTH_REBIND, phone: PHONE_REBIND, name: 'Meera', role: 'couple' });
  const row = rowById(p, USER_REBIND);
  assert.strictEqual(row.auth_user_id, AUTH_REBIND, 'the re-bind itself regressed');
  assert.strictEqual(row.name, 'Meera', 'R-37.14: the unverified pre-name was not promoted over');
  assert.strictEqual(r.name, 'Meera');
});

await ta('§1.6b path (b) re-bind onto an ALREADY-VERIFIED named row ⇒ never clobbered', async () => {
  // The protection §1.6 used to carry, kept where it still applies and where it
  // matters most: this row's name was set behind a verified login once already,
  // so a re-bind to a NEW Supabase identity must not disturb it. Only the
  // `auth_user_id IS NULL` marker separates this cell from the one above.
  const p = plane([{ id: USER_REBIND, auth_user_id: AUTH_LINKED, phone: PHONE_REBIND, name: 'Anita' }]);
  const r = await provisionRole(p, { authUserId: AUTH_REBIND, phone: PHONE_REBIND, name: 'Meera', role: 'couple' });
  const row = rowById(p, USER_REBIND);
  assert.strictEqual(row.name, 'Anita', 'a verified account lost its name to a signup form');
  assert.strictEqual(r.name, 'Anita');
});

await ta('§1.7 path (c) fresh row WITH a name ⇒ inserted and returned (unchanged behaviour)', async () => {
  const p = plane([]);
  const r = await provisionRole(p, { authUserId: AUTH_FRESH, phone: PHONE_REBIND, name: 'Meera', role: 'couple' });
  const ins = p._state.inserts.find((i) => i.table === 'users');
  assert.strictEqual(ins.payload.name, 'Meera', 'path (c) regressed — it was the one path that worked');
  assert.strictEqual(r.name, 'Meera');
});

await ta('§1.8 path (c) fresh row with NO name ⇒ no name key, null returned', async () => {
  const p = plane([]);
  const r = await provisionRole(p, { authUserId: AUTH_FRESH, phone: PHONE_REBIND, name: null, role: 'couple' });
  const ins = p._state.inserts.find((i) => i.table === 'users');
  assert.ok(!('name' in ins.payload), 'an absent name was written as a key');
  assert.strictEqual(r.name, null);
});

await ta('§1.9 the VENDOR caller shape gets the same fill [R-35.13 blast radius, proven not assumed]', async () => {
  const p = plane([{ id: USER_LINKED, auth_user_id: AUTH_LINKED, phone: PHONE_REBIND, name: null }]);
  const r = await provisionRole(p, { authUserId: AUTH_LINKED, phone: PHONE_REBIND, name: 'Ravi Studios', role: 'vendor' });
  assert.strictEqual(rowById(p, USER_LINKED).name, 'Ravi Studios');
  assert.strictEqual(r.name, 'Ravi Studios');
  assert.ok(p._state.roles.some((x) => x.table === 'vendors'), 'the vendor lane did not reach the vendors table');
});

await ta('§1.10 the return shape carries exactly four keys on every path', async () => {
  for (const [label, rows, auth] of [
    ['(a)', [{ id: USER_LINKED, auth_user_id: AUTH_LINKED, phone: PHONE_REBIND, name: null }], AUTH_LINKED],
    ['(b)', [{ id: USER_REBIND, auth_user_id: null, phone: PHONE_REBIND, name: null }], AUTH_REBIND],
    ['(c)', [], AUTH_FRESH],
  ]) {
    const r = await provisionRole(plane(rows), { authUserId: auth, phone: PHONE_REBIND, name: 'Meera', role: 'couple' });
    assert.deepStrictEqual(Object.keys(r).sort(), ['name', 'pin_set', 'role_id', 'user_id'],
      `path ${label} returned a different shape`);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
H('§2 STRUCTURAL — shipped source, where a live stack would be needed to drive');
// ═════════════════════════════════════════════════════════════════════════════

t('§2.1 couple /provision returns the post-write name [F-OB.14]', () => {
  const s = read('src/api/couple/auth.js');
  const line = s.split('\n').find((l) => l.includes('couple_id: r.role_id'));
  assert.ok(line, 'the couple /provision response line moved — this cell must move with it');
  assert.ok(/name:\s*r\.name/.test(line), 'F-OB.14: /provision still returns no name key');
});

t('§2.2 vendor /provision does NOT gain a name key — the recorded non-act [R-35.13]', () => {
  const s = read('src/api/vendor/auth.js');
  const line = s.split('\n').find((l) => l.includes('vendor_id: r.role_id'));
  assert.ok(line, 'the vendor /provision response line moved — this cell must move with it');
  assert.ok(!/name:\s*r\.name/.test(line),
    'the vendor response grew a name key; R-35.13 killed that symmetry fork as a non-act, and a field with no reader is a shape nobody can rely on');
});

t('§2.3 BOTH users lookups project `id, name` — the fill cannot ask about what it did not read', () => {
  const s = read('src/lib/provisionRole.js');
  const projections = s.match(/\.from\('users'\)\.select\('[^']*'\)/g) || [];
  assert.strictEqual(projections.length, 2, `expected two users lookups, found ${projections.length}`);
  projections.forEach((p, i) => assert.ok(/id,\s*name/.test(p), `users lookup ${i + 1} does not project name: ${p}`));
});

t('§2.4 path (c) `if (name)` guard preserved byte-for-byte (§8: existing behaviour is sacred)', () => {
  const s = read('src/lib/provisionRole.js');
  assert.ok(s.includes('if (name)  ins.name  = name;'), 'path (c) was rewritten; it was never the defect');
});

// ═════════════════════════════════════════════════════════════════════════════
H('§3 MUTATION — production code broken, the matching cell must go RED');
// ═════════════════════════════════════════════════════════════════════════════
// Each mutation edits SHIPPED SOURCE (never test setup) and restores it in a
// `finally`. LESSON 3 of run-floor.sh is why the restore is unconditional: a
// bench killed mid-write once left production source carrying its mutation, and
// the floor measured green over it.

async function withMutation(relPath, from, to, fn) {
  const abs = SRC(relPath);
  const original = fs.readFileSync(abs, 'utf8');
  assert.ok(original.includes(from), `MUTATION TARGET ABSENT in ${relPath} — this bench is stale, not passing`);
  try {
    fs.writeFileSync(abs, original.replace(from, to), 'utf8');
    provisionRole = loadProvision();
    return await fn();
  } finally {
    fs.writeFileSync(abs, original, 'utf8');
    provisionRole = loadProvision();
  }
}
async function reddens(label, fn) {
  try { await fn(); return false; } catch { return true; }
}

// ── ANCHOR RE-FOUNDED 2026-08-25 · F-05.89 · R-37.19 [LE, this sitting] ──────
// This pin named `namePresent`, provisionRole's local duplicate of
// `textPresent`. R-37.19 retired that duplicate onto its one home
// (`onboardingPredicate.js`, now exporting it) per the instruction the file
// carried in its own bytes, and R-37.14 widened the guard into `nameWins`.
// The pin is re-aimed at the CURRENT condition; the law it asserts — a fill
// that is removable must redden §1.1 — is unchanged, and the cell count is
// unchanged. Re-founded, not deleted: F-15.12's class.
await ta('§3.1 THE MUTATION: delete the fill block ⇒ §1.1 RED', async () => {
  const red = await withMutation('src/lib/provisionRole.js',
    'if (landedOnExisting && nameWins) {',
    'if (false) {',
    () => reddens('1.1', async () => {
      const p = plane([{ id: USER_LINKED, auth_user_id: AUTH_LINKED, phone: PHONE_REBIND, name: null }]);
      await provisionRole(p, { authUserId: AUTH_LINKED, phone: PHONE_REBIND, name: 'Meera', role: 'couple' });
      assert.strictEqual(rowById(p, USER_LINKED).name, 'Meera');
    }));
  assert.ok(red, '§1.1 passed with the fill removed — it proves nothing');
});

// ── ANCHOR RE-FOUNDED 2026-08-25 · F-05.89 · R-37.19 [LE, this sitting] ──────
// Same re-founding as §3.1: the never-clobber term is now
// `!textPresent(currentName)` inside `nameWins` rather than
// `!namePresent(currentName)` inline. Neutralising the term still inverts the
// guard into a clobber on every login, which is the law this cell asserts.
await ta('§3.2 THE MUTATION: drop the never-clobber term ⇒ §1.2 RED', async () => {
  const red = await withMutation('src/lib/provisionRole.js',
    '    !textPresent(currentName) ||',
    '    true ||',
    () => reddens('1.2', async () => {
      const p = plane([{ id: USER_LINKED, auth_user_id: AUTH_LINKED, phone: PHONE_REBIND, name: 'Priya' }]);
      await provisionRole(p, { authUserId: AUTH_LINKED, phone: PHONE_REBIND, name: 'Meera', role: 'couple' });
      assert.strictEqual(rowById(p, USER_LINKED).name, 'Priya');
    }));
  assert.ok(red, '§1.2 passed with the never-clobber term dropped — the guarantee is untested');
});

await ta('§3.3 THE MUTATION: narrow path (a) back to select(\'id\') ⇒ §1.2 RED', async () => {
  // The projection is not cosmetic. Narrow it and `currentName` is undefined,
  // `namePresent(undefined)` is false, and the never-clobber guard inverts into
  // a clobber on every login. This is the cell that makes §2.3 more than grep.
  const red = await withMutation('src/lib/provisionRole.js',
    ".from('users').select('id, name').eq('auth_user_id', authUserId).maybeSingle()",
    ".from('users').select('id').eq('auth_user_id', authUserId).maybeSingle()",
    () => reddens('1.2', async () => {
      const p = plane([{ id: USER_LINKED, auth_user_id: AUTH_LINKED, phone: PHONE_REBIND, name: 'Priya' }]);
      await provisionRole(p, { authUserId: AUTH_LINKED, phone: PHONE_REBIND, name: 'Meera', role: 'couple' });
      assert.strictEqual(rowById(p, USER_LINKED).name, 'Priya');
    }));
  assert.ok(red, 'a narrowed projection did not redden the never-clobber cell');
});

await ta('§3.4 THE MUTATION: remove `name: r.name` from couple /provision ⇒ §2.1 RED', async () => {
  const red = await withMutation('src/api/couple/auth.js',
    'pin_set: r.pin_set, name: r.name });',
    'pin_set: r.pin_set });',
    () => reddens('2.1', () => {
      const s = read('src/api/couple/auth.js');
      const line = s.split('\n').find((l) => l.includes('couple_id: r.role_id'));
      assert.ok(/name:\s*r\.name/.test(line));
    }));
  assert.ok(red, '§2.1 passed without the name key — it is grepping something else');
});

// ═════════════════════════════════════════════════════════════════════════════
console.log(`\n${'─'.repeat(70)}`);
console.log(`bOB_m_bridename_fill_bench: ${pass} ok, ${fail} FAIL`);
if (fail) { console.log('FAILED CELLS:'); fails.forEach((f) => console.log(`  · ${f}`)); }
console.log('─'.repeat(70));
process.exit(fail ? 1 : 0);
})();
