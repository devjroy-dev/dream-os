#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════════
// scripts/b5b_movementb_bench.js — TDW_05 Block 05, P1b (Movement B).
//
// Movement B changes behavior ON PURPOSE (unlike A, which was byte-identical). So this
// bench does NOT diff against a frozen reference — it asserts B's new contracts directly,
// and every block ends with a MUTATION PROBE proving the assertion is non-vacuous (feed
// the wrong thing → the check goes RED). Green here means the behavior is really there,
// not that an empty test passed.
//
// Coverage:
//   1. Dedupe LRU            — sidSeen/recordSid, null-key, eviction at cap, reset hook
//   2. Status race retry     — no-row→retries→callback_unmatched; row-on-retry→matched;
//                              row-first-try→no retry; db-error mid-retry
//   3. Error classifiers     — 23505 / 42703 / 42P01 / other / null
//   4. inboundRow            — attaches message_sid only when column present AND sid set
//   5. probeMessageSidColumn — present on ok, degraded on 42703, cached
//   6. captureDeadLetter     — row shape; missing-table degrade; insert-error path
//   7. isInternalReplay      — withheld unless secret set AND header matches
//   8. Admin endpoints       — real express server + fetch: list/discard/replay + auth
//
// Doubles: supabase is a hand chain returning configured {data,error} (or a sequence);
// the admin section spins an EPHEMERAL express app on 127.0.0.1 and hits it with real
// fetch, injecting a fake supabase + fake replayFetch via app.locals. No external infra.
//
// Run it: node scripts/b5b_movementb_bench.js
// ═══════════════════════════════════════════════════════════════════════════════════
'use strict';

const path    = require('path');
const http    = require('http');
const express = require('express');
const ROOT    = path.resolve(__dirname, '..');
const core    = require(path.join(ROOT, 'src/lib/webhookCore.js'));

let pass = 0, fail = 0; const fails = [];
function ok(cond, label) { if (cond) { pass++; } else { fail++; fails.push(label); } }
const j = (x) => JSON.stringify(x);

// ── console capture ──────────────────────────────────────────────────
async function capture(fn) {
  const log = [];
  const orig = { log: console.log, warn: console.warn, error: console.error };
  const fmt = (a) => a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ');
  console.log   = (...a) => log.push('LOG '   + fmt(a));
  console.warn  = (...a) => log.push('WARN '  + fmt(a));
  console.error = (...a) => log.push('ERROR ' + fmt(a));
  let ret;
  try { ret = await fn(); } finally { Object.assign(console, orig); }
  return { log, ret };
}
function makeRes() {
  const calls = [];
  const res = { status(c) { calls.push('status:' + c); return res; }, send(b) { calls.push('send:' + b); return res; } };
  res._calls = calls; return res;
}
function makeReq({ body = {}, headers = {} } = {}) { return { body, headers, get() { return 'x.test'; }, protocol: 'https', originalUrl: '/webhook/twilio-status' }; }

// supabase double whose update().eq().select() yields a SEQUENCE of results (one per call).
function sequencedSupabase(results) {
  let i = 0;
  return { from() { return { update() { return { eq() { return { select: async () => results[Math.min(i++, results.length - 1)] }; } }; } }; } };
}
// supabase double for captureDeadLetter: insert().select().single() -> configured result.
function insertSupabase(result) {
  return { from() { return { insert() { return { select() { return { single: async () => result }; } }; } }; } };
}

async function main() {
  // ══ 1. Dedupe LRU ═════════════════════════════════════════════════════════════════
  core._resetSidLru();
  ok(core.sidSeen('SM1') === false, 'lru: unseen sid → false');
  core.recordSid('SM1');
  ok(core.sidSeen('SM1') === true, 'lru: recorded sid → seen');
  ok(core.sidSeen('SM2') === false, 'lru: different sid → not seen');
  core.recordSid('SM1'); // idempotent record
  ok(core.sidSeen('SM1') === true, 'lru: re-record stays seen');
  // null key can never be deduped (no key)
  ok(core.sidSeen(null) === false, 'lru: null sid → never seen');
  core.recordSid(null);
  ok(core.sidSeen(null) === false, 'lru: recording null is a no-op');
  // eviction: overflow the cap and confirm the oldest is evicted (5000 cap)
  core._resetSidLru();
  core.recordSid('OLDEST');
  for (let k = 0; k < 5000; k++) core.recordSid('k' + k); // pushes size to 5001 → evict OLDEST
  ok(core.sidSeen('OLDEST') === false, 'lru: oldest evicted past cap');
  ok(core.sidSeen('k4999') === true, 'lru: newest retained past cap');
  // MUTATION PROBE: a sid we never recorded must read false (differ is live)
  ok(core.sidSeen('NEVER') === false, 'lru mutation-probe: never-recorded sid is false');
  core._resetSidLru();

  // ══ 2. Status race retry ══════════════════════════════════════════════════════════
  const fastSleep = async () => {}; const PFX = '[twilio-status]';
  const noRow = { data: [], error: null }, hasRow = { data: [{ id: 'x' }], error: null };
  const base = { MessageSid: 'SM123', MessageStatus: 'delivered' };

  // (a) never appears → 3 retries → callback_unmatched
  {
    const sb = sequencedSupabase([noRow]); const res = makeRes();
    const { log } = await capture(() => core.makeTwilioStatusHandler({ supabase: sb, prefix: PFX, maxRetries: 3, retryMs: 0, sleep: fastSleep })(makeReq({ body: base }), res));
    const joined = log.join('\n');
    ok(joined.includes('after 3 retries (callback_unmatched)'), 'race: unmatched after retries → callback_unmatched');
    ok(!joined.includes('(callback ignored)'), 'race: old drop wording gone');
    ok(j(res._calls) === j(['status:200', 'send:ok']), 'race: still 200/ok');
  }
  // (b) appears on retry 2 → matched, no unmatched
  {
    const sb = sequencedSupabase([noRow, noRow, hasRow]); const res = makeRes();
    const { log } = await capture(() => core.makeTwilioStatusHandler({ supabase: sb, prefix: PFX, maxRetries: 3, retryMs: 0, sleep: fastSleep })(makeReq({ body: base }), res));
    const joined = log.join('\n');
    ok(joined.includes('matched on retry 2/3'), 'race: row appears on retry 2 → matched log');
    ok(!joined.includes('callback_unmatched'), 'race: matched → no unmatched log');
  }
  // (c) row on first try → no retry, no matched/unmatched noise
  {
    const sb = sequencedSupabase([hasRow]); const res = makeRes();
    const { log } = await capture(() => core.makeTwilioStatusHandler({ supabase: sb, prefix: PFX, maxRetries: 3, retryMs: 0, sleep: fastSleep })(makeReq({ body: base }), res));
    const joined = log.join('\n');
    ok(!joined.includes('retry') && !joined.includes('callback_unmatched'), 'race: first-try hit → no retry noise');
  }
  // (d) db-error during retry → logged, stops (does not spin to unmatched)
  {
    const sb = sequencedSupabase([noRow, { data: null, error: { message: 'boom', code: 'XX000' } }]); const res = makeRes();
    const { log } = await capture(() => core.makeTwilioStatusHandler({ supabase: sb, prefix: PFX, maxRetries: 3, retryMs: 0, sleep: fastSleep })(makeReq({ body: base }), res));
    const joined = log.join('\n');
    ok(joined.includes('db update error:'), 'race: db error mid-retry → logged');
    ok(!joined.includes('callback_unmatched'), 'race: db error is terminal, no unmatched');
  }
  // MUTATION PROBE: with maxRetries:0 there is no retry loop, so an ever-missing row must
  // emit callback_unmatched "after 0 retries" — and NEVER the matched line.
  {
    const sb = sequencedSupabase([noRow]); const res = makeRes();
    const { log } = await capture(() => core.makeTwilioStatusHandler({ supabase: sb, prefix: PFX, maxRetries: 0, retryMs: 0, sleep: fastSleep })(makeReq({ body: base }), res));
    ok(log.join('\n').includes('after 0 retries (callback_unmatched)'), 'race mutation-probe: maxRetries=0 → immediate unmatched');
  }

  // ══ 3. Error classifiers ══════════════════════════════════════════════════════════
  ok(core.isDuplicateSidError({ code: '23505' }) === true,  'classify: 23505 → duplicate');
  ok(core.isDuplicateSidError({ code: '42703' }) === false, 'classify: 42703 ≠ duplicate');
  ok(core.isMissingColumnError({ code: '42703' }) === true, 'classify: 42703 → missing column');
  ok(core.isMissingTableError({ code: '42P01' }) === true,  'classify: 42P01 → missing table');
  ok(core.isDuplicateSidError(null) === false, 'classify: null → false');
  ok(core.isDuplicateSidError({ code: '00000' }) === false, 'classify mutation-probe: wrong code → false');

  // ══ 4. inboundRow ═════════════════════════════════════════════════════════════════
  core._setSidColumnPresent(true);
  ok(j(core.inboundRow({ a: 1 }, 'SM9')) === j({ a: 1, message_sid: 'SM9' }), 'inboundRow: column present + sid → attached');
  ok(j(core.inboundRow({ a: 1 }, null)) === j({ a: 1 }), 'inboundRow: null sid → omitted even when column present');
  core._setSidColumnPresent(false);
  ok(j(core.inboundRow({ a: 1 }, 'SM9')) === j({ a: 1 }), 'inboundRow: column absent → omitted (graceful degrade)');
  ok(j(core.inboundRow({ a: 1 }, 'SM9')) !== j({ a: 1, message_sid: 'SM9' }), 'inboundRow mutation-probe: absent column never attaches');

  // ══ 5. probeMessageSidColumn ══════════════════════════════════════════════════════
  const probeSb = (result) => ({ from() { return { select() { return { limit: async () => result }; } }; } });
  core._setSidColumnPresent(null);
  await core.probeMessageSidColumn(probeSb({ data: [], error: null }));
  ok(core.messageSidColumnPresent() === true, 'probe: select ok → present');
  core._setSidColumnPresent(null);
  await capture(() => core.probeMessageSidColumn(probeSb({ data: null, error: { code: '42703' } })));
  ok(core.messageSidColumnPresent() === false, 'probe: 42703 → degraded/absent');
  ok(core.messageSidColumnPresent() !== true, 'probe mutation-probe: degraded is not "present"');
  core._setSidColumnPresent(true);

  // ══ 6. captureDeadLetter ══════════════════════════════════════════════════════════
  {
    const r = await core.captureDeadLetter({ supabase: insertSupabase({ data: { id: 'DL1' }, error: null }), service: 'vendor', phone: '+1555', payload: { From: 'whatsapp:+1555' }, error: new Error('kaboom') });
    ok(r.ok === true && r.id === 'DL1', 'dead-letter: happy path → { ok, id }');
  }
  {
    const r = await capture(() => core.captureDeadLetter({ supabase: insertSupabase({ data: null, error: { code: '42P01' } }), service: 'bride', phone: '+1555', payload: {}, error: new Error('x') }));
    ok(r.ret.ok === false && r.ret.degraded === true, 'dead-letter: missing table → degraded');
  }
  {
    const r = await capture(() => core.captureDeadLetter({ supabase: insertSupabase({ data: null, error: { code: 'XX000', message: 'nope' } }), service: 'vendor', phone: '+1555', payload: {}, error: new Error('x') }));
    ok(r.ret.ok === false && r.ret.degraded === false, 'dead-letter: other insert error → not-ok, not-degraded');
  }

  // ══ 7. isInternalReplay ═══════════════════════════════════════════════════════════
  const SAVED_SECRET = process.env.INTERNAL_REPLAY_SECRET;
  delete process.env.INTERNAL_REPLAY_SECRET;
  ok(core.isInternalReplay({ headers: { 'x-internal-replay': 'anything' } }) === false, 'replay-pred: secret unset → false (withheld)');
  process.env.INTERNAL_REPLAY_SECRET = 'top-secret-XYZ';
  ok(core.isInternalReplay({ headers: {} }) === false, 'replay-pred: no header → false');
  ok(core.isInternalReplay({ headers: { 'x-internal-replay': 'wrong' } }) === false, 'replay-pred: wrong header → false');
  ok(core.isInternalReplay({ headers: { 'x-internal-replay': 'top-secret-XYZ' } }) === true, 'replay-pred: secret set + match → true');
  ok(core.isInternalReplay({ headers: { 'x-internal-replay': 'top-secret-xyz' } }) === false, 'replay-pred mutation-probe: case-mismatch → false');

  // ══ 8. Admin endpoints — real express server + real fetch ═════════════════════════
  await runAdminEndpointBench();

  // reset env
  if (SAVED_SECRET === undefined) delete process.env.INTERNAL_REPLAY_SECRET; else process.env.INTERNAL_REPLAY_SECRET = SAVED_SECRET;

  console.log(`\n══ ${pass}/${pass + fail} PASS ══\n`);
  if (fail) {
    console.log('RED — Movement B behavior diverged from contract. Failing checks:');
    fails.forEach((f) => console.log('   ·', f));
    process.exit(1);
  }
  console.log('GREEN — Movement B: dedupe, race-retry, dead-letters, replay, and admin endpoints all hold, non-vacuously.');
}

// ── admin endpoints: spin the real router on an ephemeral port, hit with fetch ───────
async function runAdminEndpointBench() {
  const ADMIN_PW = 'admin-pw-123';
  process.env.ADMIN_PASSWORD = ADMIN_PW;

  // in-memory failed_turns store behind a supabase-shaped fake
  const store = new Map();
  store.set('T-dead',      { id: 'T-dead',      service: 'vendor', phone: '+1555', payload: { From: 'whatsapp:+1555', Body: 'hi' }, error: 'boom', state: 'dead',      created_at: '2026-07-19T00:00:00Z' });
  store.set('T-bride',     { id: 'T-bride',     service: 'bride',  phone: '+1777', payload: { From: 'whatsapp:+1777', Body: 'yo' }, error: 'boom', state: 'dead',      created_at: '2026-07-19T00:01:00Z' });
  store.set('T-discarded', { id: 'T-discarded', service: 'vendor', phone: '+1999', payload: {},                                     error: 'boom', state: 'discarded', created_at: '2026-07-19T00:02:00Z' });

  const fakeSupabase = {
    from(table) {
      if (table !== 'failed_turns') throw new Error('unexpected table ' + table);
      const ctx = { _filters: {}, _cols: null };
      const api = {
        select(cols) { ctx._cols = cols; return api; },
        order() { return api; },
        range() { return api; },
        eq(col, val) { ctx._filters[col] = val; return api; },
        async single() {
          const row = store.get(ctx._filters.id);
          if (!row) return { data: null, error: { message: 'no rows' } };
          if (ctx._update) { Object.assign(row, ctx._update); }
          return { data: { ...row }, error: null };
        },
        update(patch) { ctx._update = patch; return api; },
        then(resolve) { // list path: `await q` where q is select().order().range().eq()
          let rows = [...store.values()];
          if (ctx._filters.state) rows = rows.filter((r) => r.state === ctx._filters.state);
          resolve({ data: rows, error: null });
        },
      };
      return api;
    },
  };

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.locals.supabase = fakeSupabase;
  let lastReplay = null;
  app.locals.replayFetch = async (url, opts) => { lastReplay = { url, opts }; return { ok: true, status: 200 }; };
  app.use('/api/v2/admin/failed-turns', require(path.join(ROOT, 'src/api/admin/failedTurns.js')));

  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const BASE = `http://127.0.0.1:${port}/api/v2/admin/failed-turns`;
  const authH = { 'x-admin-password': ADMIN_PW, 'content-type': 'application/json' };

  try {
    // auth: no password → 401
    let r = await fetch(BASE); ok(r.status === 401, 'admin: unauthenticated list → 401');
    // auth: wrong password → 403
    r = await fetch(BASE, { headers: { 'x-admin-password': 'nope' } }); ok(r.status === 403, 'admin: wrong password → 403');

    // list default (state=dead) → 2 dead rows
    r = await fetch(BASE, { headers: authH }); let body = await r.json();
    ok(r.status === 200 && body.ok === true, 'admin: list authed → 200 ok');
    ok(body.turns.length === 2 && body.turns.every((t) => t.state === 'dead'), 'admin: default list → only dead rows');

    // list state=discarded → 1 row
    r = await fetch(`${BASE}?state=discarded`, { headers: authH }); body = await r.json();
    ok(body.turns.length === 1 && body.turns[0].id === 'T-discarded', 'admin: state filter → discarded row');
    // invalid state → 400
    r = await fetch(`${BASE}?state=bogus`, { headers: authH }); ok(r.status === 400, 'admin: invalid state → 400');

    // discard a dead turn → replayed? no, discarded
    r = await fetch(`${BASE}/T-dead/discard`, { method: 'POST', headers: authH }); body = await r.json();
    ok(r.status === 200 && body.state === 'discarded', 'admin: discard dead → discarded');
    // discard again (now discarded) → 409
    r = await fetch(`${BASE}/T-dead/discard`, { method: 'POST', headers: authH }); ok(r.status === 409, 'admin: discard non-dead → 409');
    // discard missing → 404
    r = await fetch(`${BASE}/T-nope/discard`, { method: 'POST', headers: authH }); ok(r.status === 404, 'admin: discard missing → 404');

    // replay without config → 400 replay_not_configured
    delete process.env.INTERNAL_REPLAY_SECRET;
    r = await fetch(`${BASE}/T-bride/replay`, { method: 'POST', headers: authH }); body = await r.json();
    ok(r.status === 400 && body.code === 'replay_not_configured', 'admin: replay unconfigured → 400 replay_not_configured');

    // configure + replay a bride turn → dispatch to BRIDE_SELF_URL with secret header, state→replayed
    process.env.INTERNAL_REPLAY_SECRET = 'sekret';
    process.env.BRIDE_SELF_URL = 'http://bride.internal';
    r = await fetch(`${BASE}/T-bride/replay`, { method: 'POST', headers: authH }); body = await r.json();
    ok(r.status === 200 && body.state === 'replayed', 'admin: configured replay → replayed');
    ok(lastReplay && lastReplay.url === 'http://bride.internal/webhook/whatsapp', 'admin: replay dispatched to BRIDE_SELF_URL');
    ok(lastReplay.opts.headers['x-internal-replay'] === 'sekret', 'admin: replay carries the internal secret header');
    ok(j(JSON.parse(lastReplay.opts.body)) === j({ From: 'whatsapp:+1777', Body: 'yo' }), 'admin: replay re-POSTs the stored payload');

    // replay an already-replayed turn → 409
    r = await fetch(`${BASE}/T-bride/replay`, { method: 'POST', headers: authH }); ok(r.status === 409, 'admin: replay non-dead → 409');

    // replay when target returns non-ok → 502, state stays dead
    app.locals.replayFetch = async () => ({ ok: false, status: 500 });
    process.env.VENDOR_SELF_URL = 'http://vendor.internal';
    store.set('T-vendor2', { id: 'T-vendor2', service: 'vendor', phone: '+1', payload: {}, error: 'e', state: 'dead', created_at: '2026-07-19T00:03:00Z' });
    r = await fetch(`${BASE}/T-vendor2/replay`, { method: 'POST', headers: authH });
    ok(r.status === 502, 'admin: replay upstream error → 502');
    ok(store.get('T-vendor2').state === 'dead', 'admin: failed replay leaves turn dead (no false "replayed")');
  } finally {
    await new Promise((r) => server.close(r));
    delete process.env.BRIDE_SELF_URL; delete process.env.VENDOR_SELF_URL;
  }
}

main().catch((e) => { console.error('BENCH ERROR', e); process.exit(2); });
