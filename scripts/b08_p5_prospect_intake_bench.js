#!/usr/bin/env node
// scripts/b08_p5_prospect_intake_bench.js — THE INTAKE GUARD (F-08.55 at the door).
//
// Runnable from ANY working directory (ROOT resolves from __dirname).
//
// WHAT IS UNDER TEST. The CE ruling of 2026-08-04 chartering the prospect
// console: `POST /` and `POST /bulk` gain the registered-user refusal
// SERVER-SIDE, and the phone shape is checked AT THE DOOR so the register law
// holds at intake rather than only on the wire.
//
// ── WHY THE CELLS ARE RUNTIME AND NOT SOURCE-TEXT ───────────────────────────
// `b08_p5_closer_bench` learned this the expensive way: its harness mutates
// production source IN MEMORY before require, so an `fs.readFileSync` cell can
// never see a mutation and comes back green over a mutated tree. Every cell
// below drives the ROUTER, through a fake express and a fake supabase plane, so
// a mutation that removes the guard reddens something.
//
// ── WHAT THIS BENCH DOES NOT ASSERT, named rather than silently absent ──────
//   · NO cell over `requireAdmin`. It is injected past here deliberately — this
//     bench is about the guard, and an auth cell belongs with auth.
//   · NO cell over a real WhatsApp send. `send-opener` is untouched by this
//     delivery and a bench that reaches Meta is not a bench.
//   · NO cell over the SCREEN's rendering of `already_registered`. That is the
//     pwa's, at scripts/tdw08_p5_prospects_console.proof.mjs in the sibling.
//   · NO cell over PostgREST's real unique-violation code. `23505` is asserted
//     against a fake plane, so it proves the branch and not the database.

'use strict';

const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'src/api/admin/prospects.js');

let pass = 0, fail = 0;
const fails = [];
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ok   ${label}`); }
  else { fail++; fails.push(label); console.log(`  FAIL ${label}`); }
}
function section(t) { console.log(`\n── ${t} ──`); }

// ═════════════════════════════════════════════════════════════════════════════
// MUTATION HARNESS — mutates PRODUCTION source, in memory, before require
// ═════════════════════════════════════════════════════════════════════════════
const MUTATIONS = {
  // The guard never fires: a registered vendor loads onto the marketing lane.
  guard_off: (s) => s.replace(
    '    if (await isRegisteredPhone(supabase, input.phone)) {',
    '    if (false) {'),
  // The guard loses the second phone form — `users.phone` shape is DECLARED.
  guard_one_form: (s) => s.replace(
    ".in('phone', [phone, `+${phone}`])", ".in('phone', [phone])"),
  // The bulk door stops guarding while the single door still does: the twin gap.
  bulk_guard_off: (s) => s.replace(
    '      if (await isRegisteredPhone(supabase, input.phone)) {\n        refused.push',
    '      if (false) {\n        refused.push'),
  // The lookup failing OPEN instead of closed — the wrong asymmetry.
  guard_fails_open: (s) => s.replace(
    "    return errRes(res, 503, 'Could not check that number against existing vendors. Nothing was added — try again.', 'registered_check_failed');",
    '    /* fall through */'),
  // The bare ten-digit number sails through and dies silently at Meta.
  phone_shape_off: (s) => s.replace(
    'if (BARE_TEN_DIGIT_RE.test(phone)) return \'missing_country_code\';', ''),
};

const MUTATE = (process.argv.find(a => a.startsWith('--mutate=')) || '').split('=')[1] || null;
if (process.argv.includes('--mutations')) {
  console.log(Object.keys(MUTATIONS).join('\n')); process.exit(0);
}

function loadRouter() {
  let src = fs.readFileSync(TARGET, 'utf8');
  if (MUTATE) {
    const fn = MUTATIONS[MUTATE];
    if (!fn) { console.log(`UNKNOWN MUTATION ${MUTATE}`); process.exit(2); }
    const out = fn(src);
    if (out === src) {
      console.log(`MUTATION ${MUTATE} DID NOT APPLY — its anchor moved. This is a RED, not a pass.`);
      process.exit(2);
    }
    src = out;
  }
  // Hand the mutated source to the module system without touching the file.
  const Module = require('module');
  const m = new Module(TARGET, null);
  m.filename = TARGET;
  m.paths = Module._nodeModulePaths(path.dirname(TARGET));
  // requireAdmin is injected past: this bench is about the guard, not auth.
  const realResolve = Module._resolveFilename;
  Module._resolveFilename = function (req, ...rest) {
    if (req === './requireAdmin') return require.resolve(path.join(__dirname, '_noop_middleware.js'));
    return realResolve.call(this, req, ...rest);
  };
  try { m._compile(src, TARGET); } finally { Module._resolveFilename = realResolve; }
  return m.exports;
}

// ⚠ THE ENVELOPE IS DERIVED, NOT ASSUMED. `src/lib/response.js`: ok() spreads
// the payload onto `{ok:true, ...}` — there is no `data` wrapper — and err()
// puts the key on `code`, not `error_key`. My first draft of this bench asserted
// both wrong and went red against correct production code. Protocol §6: read the
// actual handler before writing the caller, and a bench is a caller.

// ── A fake express: capture the handlers the router registered ──────────────
function collect(router) {
  const routes = {};
  for (const layer of router.stack) {
    const p = layer.route && layer.route.path;
    if (!p) continue;
    for (const m of Object.keys(layer.route.methods)) {
      const stack = layer.route.stack;
      routes[`${m.toUpperCase()} ${p}`] = stack[stack.length - 1].handle;
    }
  }
  return routes;
}

// ── A fake supabase plane ───────────────────────────────────────────────────
function fakePlane({ users = [], prospects = [], throwOnUsers = false }) {
  const D = { users: users.slice(), prospects: prospects.slice(), admin_config: [] };
  function q(table) {
    let rows = D[table].slice();
    let pending = null;
    const api = {
      select() { return api; },
      eq(c, v) { rows = rows.filter(r => r[c] === v); return api; },
      in(c, vs) {
        if (table === 'users' && throwOnUsers) { api._throw = true; return api; }
        rows = rows.filter(r => vs.includes(r[c])); return api;
      },
      limit() { return api; },
      order() { return api; },
      range() { return api; },
      insert(row) { pending = row; return api; },
      upsert() { return api; },
      update(row) { pending = row; return api; },
      maybeSingle() {
        if (api._throw) return Promise.resolve({ data: null, error: new Error('db down') });
        return Promise.resolve({ data: rows[0] || null, error: null });
      },
      single() {
        if (pending) {
          const dup = D[table].some(r => r.phone && pending.phone && r.phone === pending.phone);
          if (dup) return Promise.resolve({ data: null, error: { code: '23505' } });
          const row = Object.assign({ id: 'p_' + (D[table].length + 1) }, pending);
          D[table].push(row);
          return Promise.resolve({ data: row, error: null });
        }
        return Promise.resolve({ data: rows[0] || null, error: rows[0] ? null : { message: 'not found' } });
      },
      then(f) { return Promise.resolve({ data: rows, error: null }).then(f); },
    };
    return api;
  }
  return { from: q, db: D };
}

// ⚠ AWAIT THE RESPONSE, NEVER THE HANDLER. `asyncHandler` calls the route and
// returns UNDEFINED — `await` on it yields one microtask and no more. My first
// draft awaited the handler, and the short paths happened to have resolved by
// then while `POST /bulk`'s loop had not: the bench read `res.body === null` and
// crashed on a correct tree. A test that races the thing it is testing is not a
// test. This resolves when `res.json` is actually called.
function fakeRes() {
  const r = { statusCode: 200, body: null };
  r.done = new Promise((resolve) => { r._resolve = resolve; });
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; r._resolve(r); return r; };
  return r;
}

const REGISTERED = '919888294440';   // the founder's own, one `users` row live

(async function main() {
  const routes = collect(loadRouter());

  // ═══ 1 · THE DOOR EXISTS AND IS THE ONE THE CONSOLE CALLS ════════════════
  section('1 · the eight routes the console is built against');
  const expected = ['GET /', 'POST /', 'POST /bulk', 'GET /cap', 'PATCH /cap',
                    'GET /:id/conversation', 'POST /:id/send-opener', 'POST /:id/mark-converted'];
  ok(expected.every(k => typeof routes[k] === 'function'),
     'all eight routes are registered — the console is built against a door that exists');

  // ═══ 2 · THE INTAKE GUARD, SINGLE DOOR ═══════════════════════════════════
  section('2 · POST / — a registered vendor cannot be loaded onto the lane');
  const call = async (key, { body = {}, params = {}, query = {}, plane }) => {
    const req = { body, params, query, app: { locals: { supabase: plane } } };
    const res = fakeRes();
    let routeErr = null;
    routes[key](req, res, (e) => { routeErr = e; res._resolve(res); });
    await res.done;
    if (routeErr) throw routeErr;
    return res;
  };

  let plane = fakePlane({ users: [{ id: 'u1', phone: '+' + REGISTERED }] });
  let res = await call('POST /', { body: { phone: REGISTERED }, plane });
  ok(res.statusCode === 409 && res.body && res.body.code === 'already_registered',
     'F-08.55 AT THE DOOR — the refusal is a KEY, not prose the screen has to match');
  ok(plane.db.prospects.length === 0,
     'and NOTHING was written: the guard runs before the insert, not beside it');

  // BOTH PHONE FORMS — `users.phone` has no normalizer governing writes.
  plane = fakePlane({ users: [{ id: 'u1', phone: REGISTERED }] });   // no '+'
  res = await call('POST /', { body: { phone: '+' + REGISTERED }, plane });
  ok(res.statusCode === 409,
     'both phone forms are checked, because the stored shape is DECLARED and never derived');

  // A STRANGER STILL GETS IN — a guard that refuses everyone is not a guard.
  plane = fakePlane({ users: [{ id: 'u1', phone: '+' + REGISTERED }] });
  res = await call('POST /', { body: { phone: '919000000123', name: 'Test Row' }, plane });
  ok(res.statusCode === 200 && plane.db.prospects.length === 1,
     'a number that is NOT a vendor is added exactly as before');

  // ═══ 3 · IT FAILS CLOSED, AND THAT IS THE OPPOSITE OF THE TURN ═══════════
  section('3 · the asymmetry — nothing is waiting at intake');
  plane = fakePlane({ users: [], throwOnUsers: true });
  res = await call('POST /', { body: { phone: '919000000123' }, plane });
  ok(res.statusCode === 503 && res.body && res.body.code === 'registered_check_failed'
     && plane.db.prospects.length === 0,
     'a broken lookup REFUSES here — at the turn it fails open, and the reason differs');

  // ═══ 4 · THE PHONE SHAPE AT THE DOOR ═════════════════════════════════════
  section('4 · the register law holds at intake, not only on the wire');
  plane = fakePlane({});
  res = await call('POST /', { body: { phone: '9888294440' }, plane });
  ok(res.statusCode === 400 && res.body && res.body.code === 'missing_country_code',
     'a bare ten-digit number is refused HERE rather than dying silently at Meta hours later');
  plane = fakePlane({});
  res = await call('POST /', { body: { phone: '+91 98882 94440' }, plane });
  ok(res.statusCode === 200 && plane.db.prospects[0].phone === '919888294440',
     'and the shapes a human actually types are normalized, not refused');
  plane = fakePlane({});
  res = await call('POST /', { body: {} , plane });
  ok(res.statusCode === 400 && res.body && res.body.code === 'phone_required',
     'a missing phone keeps its own key, so the screen can say the right thing');

  // ═══ 5 · THE BULK DOOR — THE TWIN THAT MUST NOT BE MISSED ════════════════
  section('5 · POST /bulk — the twin door, guarded the same way');
  plane = fakePlane({ users: [{ id: 'u1', phone: '+' + REGISTERED }] });
  res = await call('POST /bulk', { body: { prospects: [
    { phone: REGISTERED, name: 'The Founder' },
    { phone: '919000000123', name: 'A Stranger' },
    { phone: '9888294440', name: 'No Country Code' },
  ] }, plane });
  ok(res.statusCode === 200 && res.body.refusedCount === 1
     && res.body.refused[0].error === 'already_registered',
     'F-08.55 AT THE BULK DOOR — the registered row is refused, per row, with its key');
  ok(res.body.insertedCount === 1 && res.body.failedCount === 1,
     'the stranger is inserted and the malformed row fails — three buckets, three outcomes');
  ok(plane.db.prospects.length === 1 && plane.db.prospects[0].phone === '919000000123',
     'and only the stranger reached the table');
  // ADDITIVE, so the n8n sheet flow does not break on a new key.
  ok(['insertedCount', 'skippedCount', 'failedCount', 'inserted', 'skipped', 'failed']
       .every(k => res.body[k] !== undefined),
     'the three original counters survive: `refused` is a FOURTH bucket, never a rename');

  // ═══ SUMMARY ═════════════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`b08_p5_prospect_intake_bench: ${pass} passed, ${fail} failed`);
  if (fail) { console.log('FAILED CELLS:'); fails.forEach(f => console.log(`  · ${f}`)); }
  console.log(`${'═'.repeat(60)}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('BENCH CRASHED:', e); process.exit(2); });
