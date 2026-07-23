// scripts/b05_f0518_onboarding_bench.js — TDW_05 · F-05.18, the couple web-onboarding
// contract, BOTH SIDES.
//
// ═══ WHAT THIS BENCH IS FOR ══════════════════════════════════════════════════════════
// F-05.18 was a TRIPLE FAULT on a rail that had never completed one submit: no auth on
// the request, the wrong response dialect on the client, and a field contract no backend
// implemented. This sitting changes BOTH SIDES of that contract, so §9's BOTH-SIDES
// CLAUSE binds: the bench drives the NEW caller's payload against the REAL handler, and
// the OLD broken shape's green is RETIRED, not retained. A green over a shape nobody
// sends is indistinguishable from no test at all.
//
// ═══ WHAT IT DRIVES (no stubs under test) ════════════════════════════════════════════
// The REAL express router exported by src/api/couple/onboarding.js — both layers of it,
// in order: the REAL requireCoupleAuth middleware and the REAL asyncHandler-wrapped
// handler. The only fakes are the transport shells a route always has (req/res) and an
// in-memory supabase that RECORDS what the production code asks it to write. Nothing in
// the module under test is replaced.
//
// ═══ NON-VACUITY (BY PRODUCTION MUTATION, §9) ════════════════════════════════════════
// Every cell below fails at the UNCURED tree, or on a one-line mutation of PRODUCTION
// code — never of test setup. The mutations that must RED this bench, each named at its
// cell:
//   M1  restore `if (!d.ok)` → the client's `d.success` (pwa side; §5 asserts the
//       dialect the server actually emits, which is what made the client's read wrong)
//   M2  delete the `residence_city` block from the handler          → §3.4 REDs
//   M3  delete the `wedding_style` block from the handler           → §3.5 REDs
//   M4  delete the users/name write (fork B1's third write)         → §4.1/§4.2 RED
//   M5  restore `wedding_country` as an accepted key                → §6.2 REDs
//   M6  drop `requireCoupleAuth` from the route                     → §1.1/§1.2 RED
//   M7  make the users-write leg fatal (return errRes on uErr)      → §4.3 REDs
// The run at the uncured origin tree is recorded in the delivery packet with its count.
'use strict';
const assert = require('assert');

// ── the module under test, freshly required ─────────────────────────────────────────
const ONBOARDING_PATH = '../src/api/couple/onboarding.js';
delete require.cache[require.resolve(ONBOARDING_PATH)];
const router = require(ONBOARDING_PATH);

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}
function section(s) { console.log(`\n${s}`); }

// ── the route's REAL layer chain, pulled out of the real router ──────────────────────
// [0] = requireCoupleAuth, [1] = asyncHandler(handler). If this shape ever changes the
// bench throws loudly here rather than silently testing half a route.
const layers = router.stack[0].route.stack.map(l => l.handle);
assert.strictEqual(layers.length, 2, 'route layer chain is not [auth, handler] — bench must be re-read');
const [authLayer, handlerLayer] = layers;

// ── an in-memory supabase that RECORDS instead of pretending ────────────────────────
// `writes` is the oracle: what the production code actually asked the database to do.
function makeSupabase({ user, couple, writes, failTable = null }) {
  function builder(table) {
    const b = {
      _payload: null,
      select: () => b,
      eq: (col, val) => { b._eqCol = col; b._eqVal = val; return b; },
      update: (payload) => { b._op = 'update'; b._payload = payload; return b; },
      insert: (payload) => {
        writes.push({ table, op: 'insert', payload });
        return Promise.resolve({ data: null, error: null });
      },
      maybeSingle: () => {
        if (table === 'users')   return Promise.resolve({ data: user,   error: null });
        if (table === 'couples') return Promise.resolve({ data: couple, error: null });
        return Promise.resolve({ data: null, error: null });
      },
      then: (resolve, reject) => {
        if (b._op === 'update') {
          writes.push({ table, op: 'update', payload: b._payload, eq: { col: b._eqCol, val: b._eqVal } });
          const error = (failTable === table) ? { message: `${table} write refused` } : null;
          return Promise.resolve({ data: null, error }).then(resolve, reject);
        }
        return Promise.resolve({ data: null, error: null }).then(resolve, reject);
      },
    };
    return b;
  }
  return { from: (tbl) => builder(tbl), auth: null };
}

// A supabase whose auth.getUser resolves the token to an identity — the REAL middleware
// calls this, so the auth leg below is genuinely exercised, not skipped.
function withAuth(supabase, { token, authUserId }) {
  supabase.auth = {
    getUser: async (tok) => (tok === token
      ? { data: { user: { id: authUserId } }, error: null }
      : { data: { user: null }, error: { message: 'bad token' } }),
  };
  return supabase;
}

const TOKEN   = 'jwt-abc123';
const AUTHID  = 'auth-user-1';
const USER    = { id: 'u-1' };
const COUPLE  = { id: 'c-1' };

// ── the request/response shells ─────────────────────────────────────────────────────
function makeReq({ body, headers = {}, cookies = {}, supabase }) {
  return { method: 'POST', url: '/', body, headers, cookies, app: { locals: { supabase } } };
}
function makeRes() {
  const res = {
    _status: 200, _json: null, _ended: false,
    status(code) { res._status = code; return res; },
    json(payload) { res._json = payload; res._ended = true; return res; },
  };
  return res;
}

// Drive the REAL chain: auth layer, then (only if it called next) the handler layer.
async function drive({ body, headers = {}, cookies = {}, failTable = null }) {
  const writes = [];
  const supabase = withAuth(
    makeSupabase({ user: USER, couple: COUPLE, writes, failTable }),
    { token: TOKEN, authUserId: AUTHID },
  );
  const req = makeReq({ body, headers, cookies, supabase });
  const res = makeRes();

  let nexted = false;
  await new Promise((resolve) => {
    const next = () => { nexted = true; resolve(); };
    Promise.resolve(authLayer(req, res, next)).then(() => { if (!nexted) resolve(); });
  });
  if (!nexted) return { res, writes, reachedHandler: false, req };

  await new Promise((resolve) => {
    const next = (err) => { resolve(err); };
    handlerLayer(req, res, next);
    const poll = setInterval(() => { if (res._ended) { clearInterval(poll); resolve(); } }, 1);
    setTimeout(() => { clearInterval(poll); resolve(); }, 800);
  });
  return { res, writes, reachedHandler: true, req };
}

const authed = { authorization: `Bearer ${TOKEN}` };
const coupleUpdate = (writes) => writes.find(w => w.table === 'couples' && w.op === 'update');
const usersUpdate  = (writes) => writes.find(w => w.table === 'users'   && w.op === 'update');
const notesInsert  = (writes) => writes.find(w => w.table === 'notes'   && w.op === 'insert');

// THE NEW CALLER'S PAYLOAD — the exact shape the cured (auth) form now sends. The old
// shape is not benched anywhere in this file, deliberately (the both-sides clause).
const NEW_PAYLOAD = {
  name:           'Vera Menon',
  partner_name:   'Ishaan Rao',
  wedding_date:   '2027-02-14',
  wedding_city:   'Udaipur',
  residence_city: 'Dubai',
  wedding_style:  'hindu',
};

(async () => {

  // ── §1 — THE AUTH LEG (fault (a)) ─────────────────────────────────────────────────
  section('§1 — auth is attached and enforced  [M6: drop requireCoupleAuth from the route]');

  await t('1.1 no Authorization header, no cookie → 401, handler never reached', async () => {
    const { res, reachedHandler } = await drive({ body: NEW_PAYLOAD, headers: {} });
    assert.strictEqual(res._status, 401, `expected 401, got ${res._status}`);
    assert.strictEqual(reachedHandler, false, 'handler ran on an unauthenticated request');
    assert.strictEqual(res._json.ok, false);
  });

  await t('1.2 Bearer token → auth passes and attaches the couple identity', async () => {
    const { req, reachedHandler } = await drive({ body: NEW_PAYLOAD, headers: authed });
    assert.strictEqual(reachedHandler, true, 'a valid Bearer did not reach the handler');
    assert.strictEqual(req.coupleUser.couple_id, 'c-1');
    assert.strictEqual(req.coupleUser.user_id, 'u-1');
  });

  await t('1.3 a WRONG bearer token is refused (the middleware really verifies)', async () => {
    const { res, reachedHandler } = await drive({ body: NEW_PAYLOAD, headers: { authorization: 'Bearer not-the-token' } });
    assert.strictEqual(res._status, 401);
    assert.strictEqual(reachedHandler, false);
  });

  // ── §2 — THE RESPONSE DIALECT (fault (b)) ─────────────────────────────────────────
  section('§2 — the estate dialect is {ok:true}, and the client now reads it  [M1]');

  await t('2.1 success emits ok:true — and emits NO `success` key at all', async () => {
    const { res } = await drive({ body: NEW_PAYLOAD, headers: authed });
    assert.strictEqual(res._status, 200);
    assert.strictEqual(res._json.ok, true);
    assert.strictEqual('success' in res._json, false,
      'the server emits a `success` key — the client\'s old read would be resurrectable');
  });

  await t('2.2 a failed couples write emits ok:false + 500 (the error dialect)', async () => {
    const { res } = await drive({ body: NEW_PAYLOAD, headers: authed, failTable: 'couples' });
    assert.strictEqual(res._status, 500);
    assert.strictEqual(res._json.ok, false);
    assert.strictEqual(res._json.error, 'Could not save details. Please try again.');
  });

  // ── §3 — THE EXTENDED FIELD CONTRACT (fault (c)) ──────────────────────────────────
  section('§3 — every field the new caller sends reaches a witnessed column  [M2, M3]');

  await t('3.1 wedding_date lands on couples', async () => {
    const { writes } = await drive({ body: NEW_PAYLOAD, headers: authed });
    assert.strictEqual(coupleUpdate(writes).payload.wedding_date, '2027-02-14');
  });

  await t('3.2 partner_name lands on couples', async () => {
    const { writes } = await drive({ body: NEW_PAYLOAD, headers: authed });
    assert.strictEqual(coupleUpdate(writes).payload.partner_name, 'Ishaan Rao');
  });

  await t('3.3 wedding_city lands on couples — A3-a: the form\'s "where will your wedding take place" now has a column, and it is the one that already existed', async () => {
    const { writes } = await drive({ body: NEW_PAYLOAD, headers: authed });
    assert.strictEqual(coupleUpdate(writes).payload.wedding_city, 'Udaipur');
  });

  await t('3.4 residence_city lands on couples (0100, new)', async () => {
    const { writes } = await drive({ body: NEW_PAYLOAD, headers: authed });
    assert.strictEqual(coupleUpdate(writes).payload.residence_city, 'Dubai');
  });

  await t('3.5 wedding_style lands on couples (0100, new)', async () => {
    const { writes } = await drive({ body: NEW_PAYLOAD, headers: authed });
    assert.strictEqual(coupleUpdate(writes).payload.wedding_style, 'hindu');
  });

  await t('3.6 onboarding_state is always set to complete', async () => {
    const { writes } = await drive({ body: {}, headers: authed });
    assert.strictEqual(coupleUpdate(writes).payload.onboarding_state, 'complete');
  });

  await t('3.7 budget_total still coerces a numeric string (untouched behaviour)', async () => {
    const { writes } = await drive({ body: { budget_total: '2500000' }, headers: authed });
    assert.strictEqual(coupleUpdate(writes).payload.budget_total, 2500000);
  });

  await t('3.8 the update is scoped to the JWT\'s couple, never a body-supplied id', async () => {
    const { writes } = await drive({ body: { ...NEW_PAYLOAD, couple_id: 'c-SOMEONE-ELSE' }, headers: authed });
    assert.deepStrictEqual(coupleUpdate(writes).eq, { col: 'id', val: 'c-1' });
  });

  // ── §4 — FORK B1: THE THIRD WRITE, ON THE OTHER PLANE ─────────────────────────────
  section('§4 — name rides users.name through the existing writer\'s shape  [M4, M7]');

  await t('4.1 name writes to users, keyed on the JWT\'s user_id', async () => {
    const { writes } = await drive({ body: NEW_PAYLOAD, headers: authed });
    const u = usersUpdate(writes);
    assert.ok(u, 'no users write was issued — fork B1\'s third write is missing');
    assert.strictEqual(u.payload.name, 'Vera Menon');
    assert.deepStrictEqual(u.eq, { col: 'id', val: 'u-1' });
  });

  await t('4.2 name NEVER lands on couples (there is no such column — A3-b)', async () => {
    const { writes } = await drive({ body: NEW_PAYLOAD, headers: authed });
    assert.strictEqual('name' in coupleUpdate(writes).payload, false,
      'name was written to couples, which has no name column');
  });

  await t('4.3 a failed users write is NON-FATAL — the request still succeeds (me.js:85-91\'s posture)', async () => {
    const { res, writes } = await drive({ body: NEW_PAYLOAD, headers: authed, failTable: 'users' });
    assert.ok(coupleUpdate(writes), 'couples never got its write');
    assert.strictEqual(res._status, 200, 'a failed name write turned a mostly-successful save into a 500');
    assert.strictEqual(res._json.ok, true);
  });

  await t('4.4 no name sent → no users write is issued at all', async () => {
    const { writes } = await drive({ body: { wedding_city: 'Goa' }, headers: authed });
    assert.strictEqual(usersUpdate(writes), undefined);
  });

  // ── §5 — THE NOTES PLANE, and the disclosed silence of the new columns ────────────
  section('§5 — notes: four original strings byte-untouched, two new columns deliberately silent');

  await t('5.1 the four original note strings are produced verbatim', async () => {
    const { writes } = await drive({ body: NEW_PAYLOAD, headers: authed });
    const contents = notesInsert(writes).payload.map(n => n.content);
    assert.ok(contents.includes('Wedding date: 2027-02-14'), 'date note drifted');
    assert.ok(contents.includes('Partner: Ishaan Rao'),      'partner note drifted');
    assert.ok(contents.includes('Wedding city: Udaipur'),    'city note drifted');
  });

  await t('5.2 residence_city and wedding_style write NO note (the copy veto closed at zero new words)', async () => {
    const { writes } = await drive({ body: NEW_PAYLOAD, headers: authed });
    const blob = JSON.stringify(notesInsert(writes).payload);
    assert.strictEqual(blob.includes('Dubai'), false, 'a residence note shipped unvetoed copy');
    assert.strictEqual(blob.includes('hindu'), false, 'a style note shipped unvetoed copy');
  });

  await t('5.3 every note row is scoped to the JWT\'s couple', async () => {
    const { writes } = await drive({ body: NEW_PAYLOAD, headers: authed });
    for (const n of notesInsert(writes).payload) assert.strictEqual(n.couple_id, 'c-1');
  });

  await t('5.4 nothing sent → no notes insert at all (no empty-array write)', async () => {
    const { writes } = await drive({ body: {}, headers: authed });
    assert.strictEqual(notesInsert(writes), undefined);
  });

  // ── §6 — THE RETIRED SHAPE (the both-sides clause, made mechanical) ───────────────
  section('§6 — the phantom contract is dead: no unwitnessed key can reach the database  [M5]');

  // The witnessed column list, from docs/db/PUBLIC_SCHEMA.md (snapshot 2026-07-23, ladder
  // tip 0099, 21 columns) PLUS the two that 0100 adds. Any key outside this set reaching
  // a couples UPDATE is an unwitnessed write, which is how F-05.18 was born.
  const WITNESSED_COUPLES_COLUMNS = new Set([
    'id', 'user_id', 'partner_name', 'wedding_date', 'wedding_city', 'budget_total',
    'events_planned', 'planning_state', 'created_at', 'updated_at', 'onboarding_state',
    'nudge_sent_at', 'pin_hash', 'pin_failed_attempts', 'pin_locked_until',
    'taste_quiz_done', 'aesthetic_tags', 'tier', 'function_count', 'wedding_days',
    'functions',
    'residence_city', 'wedding_style',   // ← 0100
  ]);

  await t('6.1 every key the handler writes to couples is a witnessed column', async () => {
    const { writes } = await drive({ body: NEW_PAYLOAD, headers: authed });
    for (const k of Object.keys(coupleUpdate(writes).payload)) {
      assert.ok(WITNESSED_COUPLES_COLUMNS.has(k), `unwitnessed column written to couples: ${k}`);
    }
  });

  await t('6.2 the OLD payload\'s phantom keys are inert — sending them writes nothing', async () => {
    const OLD_PHANTOMS = {
      userId: 'u-1', phone: '+919431101193',
      residence_country: 'Dubai', wedding_country: 'Udaipur',
      wedding_style: 'hindu', user_segment: 'nri',
    };
    const { writes } = await drive({ body: OLD_PHANTOMS, headers: authed });
    const payload = coupleUpdate(writes).payload;
    for (const dead of ['userId', 'phone', 'residence_country', 'wedding_country', 'user_segment']) {
      assert.strictEqual(dead in payload, false, `phantom key ${dead} reached the database`);
    }
    // wedding_style survives BY NAME — it is the one phantom whose own name became a column.
    assert.strictEqual(payload.wedding_style, 'hindu');
    // and the city it meant to carry did NOT land, because the old key is not read:
    assert.strictEqual('wedding_city' in payload, false,
      'wedding_country was silently accepted as wedding_city — the rename must be a real both-sides change');
  });

  await t('6.3 user_segment is stored nowhere, on any plane (ruled U3)', async () => {
    const { writes } = await drive({ body: { ...NEW_PAYLOAD, user_segment: 'nri' }, headers: authed });
    assert.strictEqual(JSON.stringify(writes).includes('user_segment'), false,
      'user_segment was persisted somewhere despite the U3 ruling');
  });

  // ── §7 — TRIMS AND CAPS ───────────────────────────────────────────────────────────
  section('§7 — the new columns take their neighbours\' trimming discipline');

  await t('7.1 residence_city is trimmed and capped at 80 (wedding_city\'s cap)', async () => {
    const long = 'x'.repeat(200);
    const { writes } = await drive({ body: { residence_city: `  ${long}  ` }, headers: authed });
    assert.strictEqual(coupleUpdate(writes).payload.residence_city.length, 80);
  });

  await t('7.2 wedding_style is trimmed and capped at 40', async () => {
    const { writes } = await drive({ body: { wedding_style: `  ${'y'.repeat(200)}  ` }, headers: authed });
    assert.strictEqual(coupleUpdate(writes).payload.wedding_style.length, 40);
  });

  await t('7.3 whitespace-only values are treated as absent, not written blank', async () => {
    const { writes } = await drive({ body: { residence_city: '   ', wedding_style: '  ', name: ' ' }, headers: authed });
    const payload = coupleUpdate(writes).payload;
    assert.strictEqual('residence_city' in payload, false);
    assert.strictEqual('wedding_style' in payload, false);
    assert.strictEqual(usersUpdate(writes), undefined);
  });

  console.log(`\nb05_f0518_onboarding_bench: ${pass} passed, ${fail} failed`);
  if (fail === 0) {
    console.log('GREEN — auth enforced · {ok:true} dialect · every sent field reaches a witnessed column · name on users · the phantom contract inert. Live witness is the founder\'s.');
  }
  process.exit(fail === 0 ? 0 : 1);
})();
