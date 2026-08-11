#!/usr/bin/env node
// scripts/b05_p3d_prospect_exit_bench.js — THE PROSPECT LANE'S EXIT DOOR.
//
// TDW_05 P3-D · CE-30, R-30.10 → R-30.20. Runnable from ANY working directory
// (ROOT resolves from __dirname).
//
// ── WHAT IS UNDER TEST ──────────────────────────────────────────────────────
// The lane had no exit: `src/api/admin/prospects.js` carried ZERO `router.delete`
// while `runOpenerJob` picks `cold` rows oldest-first at 10am IST and MESSAGES
// them. This delivery mints DELETE /:id (never-contacted rows only, a FOUR-member
// discriminator), POST /:id/discard, POST /:id/restore, and closes five of the
// six paths that could reach a discarded human.
//
// ── ENVIRONMENT (R-30.5 / F-06.196: a summary speaks its environment) ────────
// Every cell here runs IN-PROCESS against production source. No network, no
// database, no Meta. Nothing is environment-gated and nothing is skipped, so the
// summary's arithmetic is total = run, skipped = 0 — stated, not implied.
//
// ── TWO INSTRUMENTS, DELIBERATELY ───────────────────────────────────────────
// §1-§3 EXECUTE `src/lib/prospectExit.js` — the discriminator is a pure function
// of its arguments, so its cells are a table of rows and no harness at all.
// §4-§8 DRIVE THE REAL ROUTER through a fake express and a fake supabase plane,
// because R-29.34 REACHABILITY wants a cell on the actual admin router entry —
// a green over a path no caller can reach is not evidence. Source-text cells
// appear NOWHERE: the sibling bench's own lesson is that an `fs.readFileSync`
// cell cannot see an in-memory mutation and comes back green over a mutated tree.
//
// ── WHAT THIS BENCH DOES NOT ASSERT, named rather than silently absent ──────
//   · NO cell over `requireAdmin` — injected past, as the sibling bench does.
//   · NO cell over the real cascade. `on delete cascade` (0085:69 → 0001:66) is
//     the DATABASE's behaviour; a fake plane cannot prove it and asserting it
//     here would be a claim about the fake. What IS proven is that no row
//     carrying a conversation can reach the delete — the cascade is unreachable
//     BY CONSTRUCTION, which is the property this sitting owns.
//   · NO cell over 0119 having been applied. The CHECK lives in production; the
//     apply order (migration first, then code) is the founder's card.
//   · NO cell over the pwa screen. That is the sibling's, at
//     scripts/tdw05_p3d_prospect_exit.proof.mjs.
'use strict';

const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const ROUTER_SRC = path.join(ROOT, 'src/api/admin/prospects.js');
const EXIT_SRC   = path.join(ROOT, 'src/lib/prospectExit.js');
const LIB_SRC    = path.join(ROOT, 'src/lib/prospects.js');

let pass = 0, fail = 0;
const fails = [];
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ok   ${label}`); }
  else { fail++; fails.push(label); console.log(`  FAIL ${label}`); }
}
function section(t) { console.log(`\n── ${t} ──`); }

// ═════════════════════════════════════════════════════════════════════════════
// MUTATION HARNESS — mutates PRODUCTION source, in memory, before require.
// Every mutation defaces the PRODUCTION MECHANISM, never test setup. A mutation
// whose anchor has moved EXITS 2 and is a RED: a mutation that does not apply is
// a cell that proves nothing while printing green.
// ═════════════════════════════════════════════════════════════════════════════
const MUTATIONS = {
  // The exit door is gone: the route census returns to its pre-delivery shape.
  // The exit door is gone: the census returns to its pre-delivery shape. The
  // route is RE-HOMED rather than syntactically broken, so the bench still RUNS
  // its full 36 cells and reds by NAME — a mutation that crashes the harness
  // proves the harness, not the guard.
  route_absent: { file: 'exit_router', fn: (s) => s.replace(
    "router.delete('/:id', requireAdmin,", "router.get('/__exit_absent/:id', requireAdmin,") },
  // MEMBER 1 off — a templated row becomes hard-deletable.
  member_contacted_off: { file: 'exit', fn: (s) => s.replace(
    '  if (prospect.last_template_at) return REFUSAL.ALREADY_CONTACTED;', '') },
  // MEMBER 2 off — the cascade becomes reachable through the API.
  member_conversation_off: { file: 'exit', fn: (s) => s.replace(
    '  if (hasConversation !== false) return REFUSAL.HAS_CONVERSATION;', '') },
  // MEMBER 2 loosened to truthiness — a FORGOTTEN lookup passes silently.
  member_conversation_truthy: { file: 'exit', fn: (s) => s.replace(
    '  if (hasConversation !== false) return REFUSAL.HAS_CONVERSATION;',
    '  if (hasConversation) return REFUSAL.HAS_CONVERSATION;') },
  // MEMBER 3 off — a prospect with a demo built for them becomes deletable.
  member_demo_off: { file: 'exit', fn: (s) => s.replace(
    '  if (prospect.demo_vendor_ref) return REFUSAL.HAS_DEMO;', '') },
  // MEMBER 4 off — F-05.68 uncured: the opt-out register becomes erasable.
  member_optout_off: { file: 'exit', fn: (s) => s.replace(
    "  if (prospect.state === 'opted_out') return REFUSAL.OPTED_OUT_LOCKED;\n  if (prospect.last_template_at)",
    '  if (prospect.last_template_at)') },
  // The discard half of F-05.68 uncured: opted_out becomes relabellable.
  discard_optout_off: { file: 'exit', fn: (s) => s.replace(
    "  if (prospect.state === 'opted_out') return REFUSAL.OPTED_OUT_LOCKED;\n  if (prospect.state === DISCARDED) return REFUSAL.ALREADY_DISCARDED;",
    '  if (prospect.state === DISCARDED) return REFUSAL.ALREADY_DISCARDED;') },
  // The delete's conversation lookup fails OPEN instead of closed.
  lookup_fails_open: { file: 'exit_router', fn: (s) => s.replace(
    "    return errRes(res, 503, 'Could not check whether this prospect has a conversation. Nothing was deleted — try again.', 'conversation_check_failed');",
    '    hasConversation = false;') },
  // Restore stops being discarded-only: any state can be flipped to cold.
  restore_wildcard: { file: 'exit', fn: (s) => s.replace(
    '  if (prospect.state !== DISCARDED) return REFUSAL.NOT_DISCARDED;', '') },
  // The second vocabulary stays behind — the Discarded pill never renders.
  vocabulary_half_moved: { file: 'exit_router', fn: (s) => s.replace(
    "'converted', 'opted_out', 'expired', DISCARDED];",
    "'converted', 'opted_out', 'expired'];") },
  // The send-opener door forgets discard — path 3 of six reopens.
  sendopener_open: { file: 'exit_router', fn: (s) => s.replace(
    '  if (p.state === DISCARDED) {\n    return errRes(res, 409,',
    '  if (false) {\n    return errRes(res, 409,') },
  // The inbound no-op is gone — path 4 reopens and the discard un-discards.
  inbound_open: { file: 'lib', fn: (s) => s.replace(
    "  if (prospect.state === 'discarded') {\n    return { action: 'noop_discarded', phone, prospectId: prospect.id };\n  }", '') },
  // The conversion job's exclusion is gone — path 5's latent write returns.
  conversion_open: { file: 'lib', fn: (s) => s.replace(
    "    .neq('state', 'discarded');", ';') },
  // Intake stops naming a discarded collision — it reads as a plain duplicate.
  intake_key_off: { file: 'exit_router', fn: (s) => s.replace(
    "      if (existing && existing.state === DISCARDED) {\n        return errRes(res, 409, 'That number was discarded. Restore it from the Discarded list to re-add.', REFUSAL.ALREADY_DISCARDED);\n      }", '') },
};

const MUTATE = (process.argv.find(a => a.startsWith('--mutate=')) || '').split('=')[1] || null;
if (process.argv.includes('--mutations')) {
  console.log(Object.keys(MUTATIONS).join('\n')); process.exit(0);
}
const MUT = MUTATE ? MUTATIONS[MUTATE] : null;
if (MUTATE && !MUT) { console.log(`UNKNOWN MUTATION ${MUTATE}`); process.exit(2); }

function readMutated(target, key) {
  let src = fs.readFileSync(target, 'utf8');
  if (MUT && MUT.file === key) {
    const out = MUT.fn(src);
    if (out === src) {
      console.log(`MUTATION ${MUTATE} DID NOT APPLY — its anchor moved. This is a RED, not a pass.`);
      process.exit(2);
    }
    src = out;
  }
  return src;
}

// Compile a module from (possibly mutated) source without touching the file.
function compile(target, key, resolveOverrides = {}) {
  const Module = require('module');
  const m = new Module(target, null);
  m.filename = target;
  m.paths = Module._nodeModulePaths(path.dirname(target));
  const realResolve = Module._resolveFilename;
  Module._resolveFilename = function (req, ...rest) {
    if (resolveOverrides[req]) return resolveOverrides[req];
    return realResolve.call(this, req, ...rest);
  };
  try { m._compile(readMutated(target, key), target); } finally { Module._resolveFilename = realResolve; }
  return m.exports;
}

// ── GUARDED SUBJECT LOAD (R-26.19 §A) ───────────────────────────────────────
// An absent module must produce a DECLARED red with the subject NAMED, never a
// silent ERR_MODULE_NOT_FOUND that yields zero cells. A red is a report; an
// ENOENT is a silence, and a silence is strictly worse.
let EXIT = null, EXIT_ABSENT = false;
try {
  EXIT = compile(EXIT_SRC, 'exit');
  if (typeof EXIT.deleteRefusal !== 'function') { EXIT_ABSENT = true; EXIT = null; }
} catch (e) { EXIT_ABSENT = true; }
const ABSENT_SUBJECT = 'src/lib/prospectExit.js';
const okExec = (cond, label) => EXIT_ABSENT
  ? ok(false, `${label}  [DECLARED-ABSENT-SUBJECT: ${ABSENT_SUBJECT}]`)
  : ok(cond(), label);

// The exit module is compiled ONCE above; the router must resolve to that same
// (possibly mutated) instance rather than requiring a pristine copy off disk.
const EXIT_STUB = path.join(__dirname, '_b05_p3d_exit_stub.js');
fs.writeFileSync(EXIT_STUB, 'module.exports = global.__TDW_EXIT__;\n');
global.__TDW_EXIT__ = EXIT;

// ── A fake express ───────────────────────────────────────────────────────────
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

// ── A fake supabase plane ────────────────────────────────────────────────────
// Carries `prospects` and `conversations` and supports .delete(), which the
// sibling bench's plane does not — the exit door is the first route in this
// estate that removes a public-plane row.
function fakePlane({ prospects = [], conversations = [], users = [], vendors = [], throwOnConversations = false }) {
  // `messages` exists here ONLY so the UNCURED tree can run: with the discard
  // no-op defaced, the inbound path proceeds to logMessage, and a plane that
  // threw there would turn a clean red into a crash.
  const D = { prospects: prospects.slice(), conversations: conversations.slice(),
              users: users.slice(), vendors: vendors.slice(), messages: [], admin_config: [] };
  function q(table) {
    let rows = D[table].slice();
    let pending = null, deleting = false, filters = [];
    const api = {
      select() { return api; },
      eq(c, v) { filters.push([c, v]); rows = rows.filter(r => r[c] === v); return api; },
      in(c, vs) { rows = rows.filter(r => vs.includes(r[c])); return api; },
      not() { return api; }, neq(c, v) { rows = rows.filter(r => r[c] !== v); return api; },
      limit() { return api; }, order() { return api; }, range() { return api; },
      insert(row) { pending = row; return api; },
      upsert() { return api; },
      update(row) { pending = row; return api; },
      delete() { deleting = true; return api; },
      maybeSingle() {
        if (table === 'conversations' && throwOnConversations) {
          return Promise.resolve({ data: null, error: new Error('conversations unreachable') });
        }
        return Promise.resolve({ data: rows[0] || null, error: null });
      },
      single() {
        if (deleting) {
          const gone = rows[0];
          if (!gone) return Promise.resolve({ data: null, error: { message: 'not found' } });
          D[table] = D[table].filter(r => r.id !== gone.id);
          return Promise.resolve({ data: gone, error: null });
        }
        if (pending && !filters.length) {          // insert
          const dup = D[table].some(r => r.phone && pending.phone && r.phone === pending.phone);
          if (dup) return Promise.resolve({ data: null, error: { code: '23505' } });
          const row = Object.assign({ id: 'p_' + (D[table].length + 1) }, pending);
          D[table].push(row);
          return Promise.resolve({ data: row, error: null });
        }
        if (pending) {                              // update
          const t = rows[0];
          if (!t) return Promise.resolve({ data: null, error: { message: 'not found' } });
          Object.assign(t, pending);
          return Promise.resolve({ data: t, error: null });
        }
        return Promise.resolve({ data: rows[0] || null, error: rows[0] ? null : { message: 'not found' } });
      },
      then(f) {
        if (table === 'conversations' && throwOnConversations) {
          return Promise.resolve({ data: null, error: new Error('conversations unreachable') }).then(f);
        }
        return Promise.resolve({ data: rows, error: null }).then(f);
      },
    };
    return api;
  }
  return { from: q, db: D };
}

function fakeRes() {
  const r = { statusCode: 200, body: null };
  r.done = new Promise((resolve) => { r._resolve = resolve; });
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; r._resolve(r); return r; };
  return r;
}

// Row shapes, named once so a cell reads as a claim and not as a literal.
const NEVER   = { id: 'x1', phone: '919000000001', state: 'cold',       last_template_at: null,                     demo_vendor_ref: null };
const TEMPLD  = { id: 'x2', phone: '919000000002', state: 'templated',  last_template_at: '2026-08-08T04:30:00Z',   demo_vendor_ref: null };
const INBOUND = { id: 'x3', phone: '919000000003', state: 'replied',    last_template_at: null,                     demo_vendor_ref: null };
const DEMOED  = { id: 'x4', phone: '919000000004', state: 'cold',       last_template_at: null,                     demo_vendor_ref: 'dv_1' };
const STOPPED = { id: 'x5', phone: '919000000005', state: 'opted_out',  last_template_at: null,                     demo_vendor_ref: null };
const DISCED  = { id: 'x6', phone: '919000000006', state: 'discarded',  last_template_at: '2026-08-08T04:30:00Z',   demo_vendor_ref: null };

(async function main() {
  const routes = collect(compile(ROUTER_SRC, 'exit_router', {
    './requireAdmin': require.resolve(path.join(__dirname, '_noop_middleware.js')),
    '../../lib/prospectExit': EXIT_STUB,
  }));

  const call = async (key, { body = {}, params = {}, query = {}, plane }) => {
    const req = { body, params, query, app: { locals: { supabase: plane } } };
    const res = fakeRes();
    let routeErr = null;
    if (typeof routes[key] !== 'function') return { statusCode: 0, body: null, missing: true };
    routes[key](req, res, (e) => { routeErr = e; res._resolve(res); });
    await res.done;
    if (routeErr) throw routeErr;
    return res;
  };

  // ═══ 1 · THE FOUR-MEMBER DISCRIMINATOR, EXECUTED (R-30.10 + R-30.19) ══════
  section('1 · deleteRefusal — four members, four distinct keys');
  okExec(() => EXIT.deleteRefusal(NEVER, false) === null,
    'a never-templated row with no conversation and no demo is hard-deletable — a guard that refuses everyone is not a guard');
  okExec(() => EXIT.deleteRefusal(TEMPLD, false) === 'already_contacted',
    'MEMBER 1 — a templated row refuses with already_contacted');
  okExec(() => EXIT.deleteRefusal(INBOUND, true) === 'has_conversation',
    'MEMBER 2 — the inbound-first row (never templated, live thread) refuses with has_conversation');
  okExec(() => EXIT.deleteRefusal(DEMOED, false) === 'has_demo',
    'MEMBER 3 — a row with a demo built for it refuses with has_demo');
  okExec(() => EXIT.deleteRefusal(STOPPED, false) === 'opted_out_locked',
    'MEMBER 4 — F-05.68: the opt-out register is not the house\'s to erase');
  okExec(() => new Set([
      EXIT.deleteRefusal(TEMPLD, false), EXIT.deleteRefusal(INBOUND, true),
      EXIT.deleteRefusal(DEMOED, false), EXIT.deleteRefusal(STOPPED, false),
    ]).size === 4,
    'the four keys are DISTINCT — a refusal that does not say which member fired is a shrug');

  section('1.1 · the forgotten-lookup asymmetry');
  okExec(() => EXIT.deleteRefusal(NEVER, undefined) === 'has_conversation',
    'an UNDETERMINED conversation member refuses — a caller who forgot the lookup is not handed a green light by omission');

  // ═══ 2 · THE OPTED-OUT ROW IS UNREACHABLE BY ALL THREE VERBS ══════════════
  section('2 · R-30.19/.20 — every exit verb refuses the register');
  okExec(() => EXIT.deleteRefusal(STOPPED, false) === 'opted_out_locked', 'delete refuses it');
  okExec(() => EXIT.discardRefusal(STOPPED) === 'opted_out_locked', 'discard refuses it — relabelling would un-block the wire gate');
  okExec(() => EXIT.restoreRefusal(STOPPED) === 'not_discarded', 'restore refuses it — discarded-only, never a wildcard');
  okExec(() => EXIT.exitKind(STOPPED, false) === 'none',
    'and the screen is told NONE, so no control renders at all — a greyed button still says "this is a thing you might do"');

  // ═══ 3 · DISCARD / RESTORE CONTRACTS ══════════════════════════════════════
  section('3 · discardRefusal / restoreRefusal / exitKind');
  okExec(() => EXIT.discardRefusal(TEMPLD) === null, 'a contacted row is discardable — that is the transition it takes instead');
  okExec(() => EXIT.discardRefusal(DISCED) === 'already_discarded', 'a discarded row refuses re-discard with its own key');
  okExec(() => EXIT.restoreRefusal(DISCED) === null, 'a discarded row restores');
  okExec(() => EXIT.restoreRefusal(TEMPLD) === 'not_discarded', 'R-30.11 — restore is discarded→cold ONLY');
  okExec(() => EXIT.exitKind(NEVER, false) === 'delete' && EXIT.exitKind(TEMPLD, false) === 'discard'
            && EXIT.exitKind(INBOUND, true) === 'discard' && EXIT.exitKind(DISCED, false) === 'restore',
    'exitKind agrees with the refusals on every shape — the button offered is the answer he would get');

  // ═══ 4 · THE DOOR EXISTS ON THE REAL ROUTER (R-29.34 reachability) ════════
  section('4 · the route census — the exit door is registered');
  ok(typeof routes['DELETE /:id'] === 'function',
     'DELETE /:id is registered — the census that carried ZERO router.delete now carries one');
  ok(typeof routes['POST /:id/discard'] === 'function' && typeof routes['POST /:id/restore'] === 'function',
     'POST /:id/discard and POST /:id/restore are registered');
  ok(['GET /', 'POST /', 'POST /bulk', 'GET /cap', 'PATCH /cap', 'GET /:id/conversation',
      'POST /:id/send-opener', 'POST /:id/mark-converted'].every(k => typeof routes[k] === 'function'),
     'and the eight the console was already built against all survive');

  // ═══ 5 · THE DELETE, DRIVEN END TO END ════════════════════════════════════
  section('5 · DELETE /:id against a real plane');
  let plane = fakePlane({ prospects: [{ ...NEVER }] });
  let res = await call('DELETE /:id', { params: { id: 'x1' }, plane });
  ok(res.statusCode === 200 && plane.db.prospects.length === 0,
     'a never-contacted row is removed — the lane has an exit');

  plane = fakePlane({ prospects: [{ ...INBOUND }],
                      conversations: [{ id: 'c1', prospect_id: 'x3', kind: 'prospect_marketing' }] });
  res = await call('DELETE /:id', { params: { id: 'x3' }, plane });
  ok(res.statusCode === 409 && res.body && res.body.code === 'has_conversation' && plane.db.prospects.length === 1,
     'THE CASCADE IS UNREACHABLE BY CONSTRUCTION — a row holding a thread refuses, and the row stands');

  plane = fakePlane({ prospects: [{ ...STOPPED }] });
  res = await call('DELETE /:id', { params: { id: 'x5' }, plane });
  ok(res.statusCode === 409 && res.body && res.body.code === 'opted_out_locked' && plane.db.prospects.length === 1,
     'F-05.68 AT THE ROUTE — the STOP-only row survives an admin delete press');

  plane = fakePlane({ prospects: [{ ...NEVER }], throwOnConversations: true });
  res = await call('DELETE /:id', { params: { id: 'x1' }, plane });
  ok(res.statusCode === 503 && res.body && res.body.code === 'conversation_check_failed' && plane.db.prospects.length === 1,
     'a broken conversation lookup REFUSES — a thread we cannot see is a thread we must not cascade');

  plane = fakePlane({ prospects: [] });
  res = await call('DELETE /:id', { params: { id: 'nope' }, plane });
  ok(res.statusCode === 404, 'an absent row 404s before any member is consulted');

  // ═══ 6 · DISCARD AND RESTORE, DRIVEN END TO END ═══════════════════════════
  section('6 · POST /:id/discard and POST /:id/restore');
  plane = fakePlane({ prospects: [{ ...TEMPLD }] });
  res = await call('POST /:id/discard', { params: { id: 'x2' }, plane });
  ok(res.statusCode === 200 && plane.db.prospects[0].state === 'discarded'
     && !!plane.db.prospects[0].discarded_at,
     'a contacted row discards: the record STANDS, the state moves, and discarded_at is stamped (R-30.12)');

  res = await call('POST /:id/restore', { params: { id: 'x2' }, plane });
  ok(res.statusCode === 200 && plane.db.prospects[0].state === 'cold'
     && plane.db.prospects[0].discarded_at === null,
     'restore returns it as cold and CLEARS the stamp — a stamp outliving its state is a second, disagreeing answer');

  plane = fakePlane({ prospects: [{ ...STOPPED }] });
  res = await call('POST /:id/discard', { params: { id: 'x5' }, plane });
  ok(res.statusCode === 409 && res.body.code === 'opted_out_locked' && plane.db.prospects[0].state === 'opted_out',
     'discard refuses the register too — the value all four gates match on does not move');

  plane = fakePlane({ prospects: [{ ...TEMPLD }] });
  res = await call('POST /:id/restore', { params: { id: 'x2' }, plane });
  ok(res.statusCode === 409 && res.body.code === 'not_discarded',
     'restore over a live row refuses — it is not a general state-setter');

  // ═══ 7 · THE OTHER FIVE PATHS ═════════════════════════════════════════════
  section('7 · the paths a discarded human must not be reached through');
  plane = fakePlane({ prospects: [{ ...DISCED }] });
  res = await call('POST /:id/send-opener', { params: { id: 'x6' }, plane });
  ok(res.statusCode === 409 && res.body && res.body.code === 'discarded',
     'PATH 3 — the console\'s own Send-opener typed-refuses, and the sentence points at Restore');

  const LIB = compile(LIB_SRC, 'lib');
  // THE CLOSER IS STUBBED, NOT THE GUARD. At the cured tree the stub is never
  // reached; at the defaced tree it is what lets the escape be OBSERVED as a
  // failed cell instead of a thrown require. Stubbing the thing under test would
  // be the vacuous class — this stubs the thing beyond it.
  const inboundPlane = fakePlane({ prospects: [{ ...DISCED }] });
  const inbound = await LIB.handleMarketingInbound({
    supabase: inboundPlane,
    from: DISCED.phone, text: 'hello?',
    closerTurn: async () => ({ text: 'MAYA SPOKE TO A DISCARDED HUMAN', source: 'stub' }),
    sendWa: async () => { throw new Error('A SEND ESCAPED THE DISCARD'); },
  });
  ok(inbound && inbound.action === 'noop_discarded',
     'PATH 4 — R-30.15: an inbound over a discarded row is SILENT, and no send is attempted');
  ok(inbound && inbound.replySent === undefined && inbound.conversationId === undefined,
     'and no conversation is opened and no state is moved — the house\'s word is not a stranger\'s to lift');

  // SELF-CAUGHT AT FIRST RUN: this cell was a regex over the file, which
  // contradicts this bench's own preamble ("source-text cells appear NOWHERE")
  // and would have gone green over any tree whose selector merely LOOKED right.
  // It now RUNS the job.
  // SECOND SELF-CAUGHT VACUITY, same cell, caught by the mutation matrix rather
  // than by reading: with no `vendors` row the job's lookup THREW into its own
  // F-07.38 catch, so `converted` was 0 on the defaced tree too and the cell went
  // green over a removed selector. The claimed vendor below is what makes the
  // uncured tree actually convert — the mutation now bites. A cell that cannot be
  // seen to fail is not a cell.
  const convPlane = fakePlane({
    prospects: [{ ...DISCED, demo_vendor_ref: 'dv_9' }],
    vendors:   [{ id: 'dv_9', user_id: 'u_claimed', claimed_at: '2026-08-09T00:00:00Z' }],
  });
  const convOut = await LIB.runConversionMatchJob({ supabase: convPlane });
  ok(convOut && convOut.converted === 0 && convPlane.db.prospects[0].state === 'discarded',
     'PATH 5 — a CLAIMED demo vendor cannot pull a discarded row back to converted; Block 08 arming this job cannot un-discard');

  // ═══ 8 · THE SECOND VOCABULARY (read-first §4.4) ══════════════════════════
  section('8 · both vocabularies move, or the state is invisible on its own screen');
  plane = fakePlane({ prospects: [{ ...DISCED }, { ...NEVER }] });
  res = await call('GET /', { query: {}, plane });
  ok(res.statusCode === 200 && res.body.counts && res.body.counts.discarded === 1,
     'GET / counts carry a `discarded` key — the console builds its pills from this object, so the pill renders');
  ok(res.body.prospects.every(p => p.exit_kind !== undefined && p.has_conversation !== undefined),
     'every row is stamped with exit_kind and has_conversation — the screen re-derives nothing');
  res = await call('GET /', { query: { state: 'discarded' }, plane });
  ok(res.statusCode === 200, '?state=discarded is a valid filter rather than a 400');

  plane = fakePlane({ prospects: [{ ...DISCED }] });
  res = await call('POST /', { body: { phone: DISCED.phone }, plane });
  ok(res.statusCode === 409 && res.body && res.body.code === 'already_discarded',
     'R-30.11 — re-adding a discarded number names it, never a silent un-discard and never a bare duplicate');

  // ═══ SUMMARY (R-30.5: the arithmetic is stated) ═══════════════════════════
  const total = pass + fail;
  console.log(`\n${'═'.repeat(62)}`);
  console.log(`b05_p3d_prospect_exit_bench: ${pass} passed, ${fail} failed`);
  console.log(`  total ${total} · run ${total} · skipped 0 · in-process, no network, no DB`);
  if (fail) { console.log('FAILED CELLS:'); fails.forEach(f => console.log(`  · ${f}`)); }
  console.log(`${'═'.repeat(62)}`);
  try { fs.unlinkSync(EXIT_STUB); } catch (_e) {}
  process.exit(fail ? 1 : 0);
})().catch(e => {
  try { fs.unlinkSync(EXIT_STUB); } catch (_e) {}
  console.error('BENCH CRASHED:', e); process.exit(2);
});
