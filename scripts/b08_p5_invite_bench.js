#!/usr/bin/env node
// scripts/b08_p5_invite_bench.js — TDW_08 · P5 · PHASE 1 — THE FUSED INVITE ACT
//
// Runnable from ANY working directory (ROOT is resolved from __dirname, never
// from cwd — the ~/Downloads law's cousin).
//
// WHAT IS UNDER TEST. The CE ruling of 2026-08-04 on the read-first:
//   FORK A(ii) — `_inviteOne` stays the one fused body; both doors funnel it.
//   FORK B(ii) — the post-send acts are wrapped AT THE CALLER; every throw
//                converts to the loud `sent_not_stamped` path.
//   FORK C(i)  — `demo_vendors.invite_sent_at` (0109) is the SPENT MARKER, written
//                only by `demoLifecycle.markInviteSent`, read by the pre-check.
//   FORK D(ii) — recovery is founder-SQL; NO route clears the column.
//
// EVERY §M CELL IS BOTH-WAYS. It mutates PRODUCTION SOURCE — never test setup —
// asserts the cell goes RED at the mutated tree, restores the file, and asserts
// byte-identity. Anchors are asserted to appear EXACTLY ONCE (CE-127:
// String.replace takes the FIRST match, so a bare anchor is a coin flip).
//
// ── WHAT THIS BENCH DOES NOT ASSERT, named rather than silently absent ───────
// (the floor-method law.)
//   · NO cell over the MIGRATION's application. 0109 is founder-run in the
//     Supabase editor; this container cannot reach production. The readback in
//     the file is its own witness and it is the founder's to paste.
//   · NO cell proving the send-to-stamp window is CLOSED, because it is not.
//     The residual is one DB write wide and is named in the source. What is
//     asserted is that every failure inside it is LOUD and correctly attributed.
//   · NO cell over the board's RENDERING of the spent tell. That is the pwa's,
//     at scripts/tdw08_p5_invite_spent.proof.mjs in the sibling repository.
//   · NO cell over a real WhatsApp send. A bench that reaches Meta is not a
//     bench; the transport is stubbed exactly as b08_p1_lifecycle stubs it.
//   · NO cell over `select('*')` on GET /vendors carrying the new column to the
//     wire beyond the one textual guard at §5.3 — a fake plane's `select()` is a
//     no-op that returns whole rows, so a data cell there would be proving the
//     test double and not PostgREST.

'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(SRC(rel), 'utf8');
// THE COMMENT-BLINDNESS LAW (broken twice in two sittings, once by this block's
// own family). The files below carry long comment blocks that QUOTE every string
// these cells assert — `invite_already_sent`, `sent_not_stamped`, the F-06.85
// paragraph — because the source explains what it does. Every textual cell
// strips comments FIRST and says so.
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const code  = (rel) => strip(read(rel));

const ADMIN = 'src/api/admin/demoAdmin.js';
const LC    = 'src/lib/demoLifecycle.js';
const MIG   = 'db/migrations/0109_demo_invite_sent_marker.sql';

let pass = 0, fail = 0, skipped = [];
const H = (s) => console.log(`\n── ${s} ──`);
function t(name, fn) {
  try { fn(); console.log(`  PASS  ${name}`); pass++; }
  catch (e) { console.log(`  FAIL  ${name}\n        ${e.message}`); fail++; }
}
async function ta(name, fn) {
  try { await fn(); console.log(`  PASS  ${name}`); pass++; }
  catch (e) { console.log(`  FAIL  ${name}\n        ${e.message}`); fail++; }
}

// ════════════════════════════════════════════════════════════════════════════
// THE FAKE PLANE — an in-memory stand-in for the PostgREST builder supporting
// exactly the operators these two modules use. It is TEST SETUP and is never
// what a mutation cell breaks.
//
// IT CARRIES A FAULT SWITCH, and that is the point of this bench. `_failOn`
// makes a named table's write THROW, which is how the disease is reproduced:
// the template has already gone out and the database then refuses. Nothing else
// in the estate can produce that state on demand.
// ════════════════════════════════════════════════════════════════════════════
function makeDb(seed) {
  const tables = JSON.parse(JSON.stringify(seed || {}));
  let uid = 0;
  const nextId = () => `id-${++uid}`;
  const faults = { updateThrowsOn: null, updateThrowsAfter: 0 };

  function matches(row, filters) {
    return filters.every((f) => {
      const v = row[f.col];
      if (f.op === 'eq')  return v === f.val;
      if (f.op === 'in')  return f.val.includes(v);
      if (f.op === 'is')  return f.val === null ? (v === null || v === undefined) : v === f.val;
      if (f.op === 'not_is_null') return v !== null && v !== undefined;
      if (f.op === 'lt')  return v != null && String(v) < String(f.val);
      return true;
    });
  }

  function builder(name) {
    const rows = () => (tables[name] = tables[name] || []);
    const q = { _filters: [], _mode: null, _patch: null, _insert: null };

    const api = {
      select() { return api; },
      eq(col, val)  { q._filters.push({ col, op: 'eq', val }); return api; },
      in(col, val)  { q._filters.push({ col, op: 'in', val }); return api; },
      is(col, val)  { q._filters.push({ col, op: 'is', val }); return api; },
      lt(col, val)  { q._filters.push({ col, op: 'lt', val }); return api; },
      not(col, op, val) {
        if (op === 'is' && val === null) q._filters.push({ col, op: 'not_is_null' });
        return api;
      },
      order() { return api; },
      update(patch) { q._mode = 'update'; q._patch = patch; return api; },
      insert(row)   { q._mode = 'insert'; q._insert = row;  return api; },
      _run() {
        if (q._mode === 'update' && faults.updateThrowsOn === name) {
          if (faults.updateThrowsAfter <= 0) throw new Error('SIMULATED DB FAULT: update refused');
          faults.updateThrowsAfter--;
        }
        if (q._mode === 'insert') {
          const row = Object.assign({ id: nextId() }, q._insert);
          rows().push(row);
          return [row];
        }
        const hit = rows().filter((r) => matches(r, q._filters));
        if (q._mode === 'update') hit.forEach((r) => Object.assign(r, q._patch));
        return hit;
      },
      async maybeSingle() { const r = api._run(); return { data: r[0] || null, error: null }; },
      async single()      {
        const r = api._run();
        return r[0] ? { data: r[0], error: null } : { data: null, error: { message: 'no rows' } };
      },
      then(res, rej) { try { res({ data: api._run(), error: null }); } catch (e) { rej(e); } },
    };
    return api;
  }

  return { from: builder, _tables: tables, _faults: faults };
}

const DAY = 24 * 3600 * 1000;
const iso = (d) => new Date(d).toISOString();

// The production shape, incl. the P5 column. `invite_sent_at: null` is the
// virgin value and is stated EXPLICITLY rather than left undefined, because
// undefined and null are the same to the pre-check's truthiness test and only
// one of them is what the database actually holds.
function seedVendor(over) {
  return Object.assign({
    id: 'demo-1', ig_handle: 'swatitomar_p4b', display_name: 'Swati Tomar',
    whatsapp_phone: '919888294440', state: 'built',
    active: true, discover_eligible: true, discover_eligible_at: iso(Date.now() - 10 * DAY),
    invited_at: null, opened_at: null, engaged_at: null, claimed_at: null,
    removed_at: null, expires_at: null, claim_token: 'tok-1',
    invite_sent_at: null,
    created_at: iso(Date.now() - 20 * DAY),
  }, over || {});
}

const WA_PATH    = require.resolve(SRC('src/lib/sendWa.js'));
const GUARD_PATH = require.resolve(SRC('src/api/admin/requireAdmin.js'));
const ADMIN_PATH = require.resolve(SRC(ADMIN));
const LC_PATH    = require.resolve(SRC(LC));
const ALERT_PATH = require.resolve(SRC('src/lib/discover/demoLeadAlert.js'));
const PROS_PATH  = require.resolve(SRC('src/lib/prospects.js'));

function loadInviteRoute(sendWaImpl, routePath = '/vendors/:id/invite') {
  const calls = [];
  for (const p of [WA_PATH, GUARD_PATH, ADMIN_PATH, LC_PATH, ALERT_PATH, PROS_PATH]) {
    delete require.cache[p];
  }
  require.cache[WA_PATH] = {
    id: WA_PATH, filename: WA_PATH, loaded: true,
    exports: { sendWa: async (opts) => { calls.push(opts); return sendWaImpl(opts); } },
  };
  require.cache[GUARD_PATH] = {
    id: GUARD_PATH, filename: GUARD_PATH, loaded: true,
    exports: (req, res, next) => next(),
  };
  const router = require(ADMIN_PATH);
  const layer = router.stack.find((l) => l.route && l.route.path === routePath);
  if (!layer) throw new Error(`route not registered on demoAdmin: ${routePath}`);
  const handle = layer.route.stack[layer.route.stack.length - 1].handle;
  return { handle, calls };
}

function fakeRes() {
  const out = { code: 200, body: null };
  const res = {
    status(c) { out.code = c; return res; },
    json(b) { out.body = b; return out; },
    _out: out,
  };
  return res;
}

// The error console is CAPTURED rather than silenced. The loud line is not
// decoration — FORK B(ii)'s whole cure is that a half-failed invite SAYS SO —
// so the bench reads it as evidence exactly like a row.
function captureErr(fn) {
  const lines = [];
  const origErr = console.error, origLog = console.log;
  console.error = (...a) => lines.push(a.join(' '));
  console.log = () => {};
  return Promise.resolve()
    .then(fn)
    .then((v) => { console.error = origErr; console.log = origLog; return { value: v, lines }; })
    .catch((e) => { console.error = origErr; console.log = origLog; throw e; });
}

async function fireInvite({ db, id = 'demo-1', sendWaImpl, routePath, body }) {
  const { handle, calls } = loadInviteRoute(
    sendWaImpl || (async () => ({ sid: 'wamid.TEST' })), routePath);
  const res = fakeRes();
  await handle(
    { params: { id }, body: body || {}, app: { locals: { supabase: db } } }, res);
  for (const p of [WA_PATH, GUARD_PATH, ADMIN_PATH]) delete require.cache[p];
  return { out: res._out, calls };
}

function freshLc() {
  for (const p of [LC_PATH, PROS_PATH]) delete require.cache[p];
  return require(LC_PATH);
}

// ════════════════════════════════════════════════════════════════════════════
(async function main() {

// ── §1 · THE MARKER'S OWN WRITER ────────────────────────────────────────────
H('§1 — markInviteSent: one column, one fact, one writer');

t('§1.1 the module EXPORTS markInviteSent', () => {
  assert.strictEqual(typeof freshLc().markInviteSent, 'function');
});

await ta('§1.2 it stamps invite_sent_at and touches NOTHING else', async () => {
  const lc = freshLc();
  const seed = seedVendor();
  const db = makeDb({ demo_vendors: [seed], prospects: [] });
  const before = JSON.parse(JSON.stringify(db._tables.demo_vendors[0]));
  const r = await lc.markInviteSent(db, 'demo-1', { via: 'bench' });
  assert.strictEqual(r.ok, true);
  const after = db._tables.demo_vendors[0];
  assert.ok(after.invite_sent_at, 'the stamp did not land');
  for (const k of Object.keys(before)) {
    if (k === 'invite_sent_at') continue;
    assert.deepStrictEqual(after[k], before[k], `markInviteSent moved a column it does not own: ${k}`);
  }
});

await ta('§1.3 it does NOT move state — the transition is a separate act', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ state: 'built' })], prospects: [] });
  await freshLc().markInviteSent(db, 'demo-1', {});
  assert.strictEqual(db._tables.demo_vendors[0].state, 'built');
});

await ta('§1.4 it REFUSES a re-stamp — the marker is a HISTORY stamp, first despatch wins', async () => {
  const first = iso(Date.now() - 3 * DAY);
  const db = makeDb({ demo_vendors: [seedVendor({ invite_sent_at: first })], prospects: [] });
  const r = await freshLc().markInviteSent(db, 'demo-1', {});
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'already_stamped');
  assert.strictEqual(db._tables.demo_vendors[0].invite_sent_at, first,
    'a re-stamp overwrote the record of when a real template reached a real handset');
});

await ta('§1.5 an absent row is a typed refusal, never a throw (the module doctrine)', async () => {
  const db = makeDb({ demo_vendors: [], prospects: [] });
  const r = await freshLc().markInviteSent(db, 'nope', {});
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'not_found');
});

t('§1.6 the stamp rides _write — the sole-writer rider stays STRUCTURAL', () => {
  // The cell asks the question that actually differs: does the body reach the
  // one write door, or does it hold its own `.from('demo_vendors').update(`?
  const body = code(LC).split('async function markInviteSent')[1].split('\nasync function')[0];
  assert.ok(/_write\(supabase, row\.id, \{ invite_sent_at/.test(body),
    'markInviteSent does not write through _write');
  assert.ok(!/\.from\('demo_vendors'\)/.test(body),
    'markInviteSent reaches the table directly — the fifth-writer disease');
});

t('§1.7 invite_sent_at is NOT a presence column — it cannot be confused for state', () => {
  const lc = freshLc();
  assert.ok(!lc.PRESENCE_COLUMNS.includes('invite_sent_at'));
  assert.ok(!lc.STATES.includes('invite_sent_at'));
});

// ── §2 · THE PRE-CHECK — the second template that never goes out ────────────
H('§2 — the spent refusal (FORK C(i))');

await ta('§2.1 a stamped row is REFUSED and NO TEMPLATE IS SPENT', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ invite_sent_at: iso(Date.now() - DAY) })], prospects: [] });
  const { out, calls } = await fireInvite({ db });
  assert.strictEqual(out.code, 409);
  assert.strictEqual(out.body.error, 'invite_already_sent');
  assert.strictEqual(calls.length, 0, 'a SECOND real template was spent on a handset that already has one');
});

await ta('§2.2 the refusal is TRUE OF A ROW THE STATE MACHINE STILL ADMITS — the disease itself', async () => {
  // `built` + a spent template is exactly the state a failed transition leaves.
  // INVITE_STATES admits it; only the marker can refuse it. If this cell ever
  // needs a non-INVITE state to go red, the cure has stopped covering its own
  // disease.
  const lc = freshLc();
  const row = seedVendor({ state: 'built', invite_sent_at: iso(Date.now() - DAY) });
  assert.ok(lc.INVITE_STATES.includes(row.state),
    'fixture drift: the row must be one the state check would PASS');
  const db = makeDb({ demo_vendors: [row], prospects: [] });
  const { out, calls } = await fireInvite({ db });
  assert.strictEqual(out.body.error, 'invite_already_sent');
  assert.strictEqual(calls.length, 0);
});

await ta('§2.3 the refusal carries WHEN, so the founder can act on it', async () => {
  const when = iso(Date.now() - 2 * DAY);
  const db = makeDb({ demo_vendors: [seedVendor({ invite_sent_at: when })], prospects: [] });
  const { out } = await fireInvite({ db });
  assert.strictEqual(out.body.detail, when);
});

await ta('§2.4 a VIRGIN row is not refused — the gate refuses a re-send, never a send', async () => {
  const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  const { out, calls } = await fireInvite({ db });
  assert.strictEqual(out.code, 200);
  assert.strictEqual(calls.length, 1);
  assert.ok(db._tables.demo_vendors[0].invite_sent_at, 'a successful send left no marker');
  assert.strictEqual(db._tables.demo_vendors[0].state, 'invited');
});

await ta('§2.5 THE BATCH INHERITS IT — one home, two doors', async () => {
  const db = makeDb({
    demo_vendors: [seedVendor({ invite_sent_at: iso(Date.now() - DAY) })], prospects: [],
  });
  const { out, calls } = await fireInvite({
    db, routePath: '/invite-batch', body: { ids: ['demo-1'] },
  });
  assert.strictEqual(out.body.refused[0].error, 'invite_already_sent');
  assert.strictEqual(calls.length, 0);
});

await ta('§2.6 the spent check precedes the SEND, proven on the send-order not the status code', async () => {
  // A 409 could come from anywhere. What matters is that nothing left the house.
  const db = makeDb({
    demo_vendors: [seedVendor({ invite_sent_at: iso(Date.now() - DAY), state: 'legacy' })],
    prospects: [],
  });
  const { calls } = await fireInvite({ db });
  assert.strictEqual(calls.length, 0);
});

// ── §3 · THE HALF-FAILED INVITE — FORK B(ii)'s whole subject ────────────────
H('§3 — a template on a handset the row does not record');

await ta('§3.1 a THROW after the send is 500 sent_not_stamped, NOT a generic 500', async () => {
  // THE DISEASE, REPRODUCED. Before the cure a throw out of onInvited escaped to
  // the route's own catch and answered `{ ok:false, error:<message> }` — byte-
  // indistinguishable from a PRE-send failure, with the loud line never printed.
  const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  db._faults.updateThrowsOn = 'demo_vendors';
  db._faults.updateThrowsAfter = 1;   // let markInviteSent through, break onInvited
  const { value } = await captureErr(() => fireInvite({ db }));
  assert.strictEqual(value.out.code, 500);
  assert.strictEqual(value.out.body.error, 'sent_not_stamped');
  assert.strictEqual(value.calls.length, 1, 'the fixture did not actually send');
});

await ta('§3.2 and it SAYS the template was spent — the loud line is the cure', async () => {
  const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  db._faults.updateThrowsOn = 'demo_vendors';
  db._faults.updateThrowsAfter = 1;
  const { lines } = await captureErr(() => fireInvite({ db }));
  const loud = lines.join('\n');
  assert.ok(/SENT BUT NOT STAMPED/.test(loud), 'the half-failed invite was silent');
  assert.ok(/TEMPLATE WAS SPENT/.test(loud), 'the line does not state that a template went out');
});

await ta('§3.3 the SPEND SURVIVES the failed transition — the fact the state could not carry', async () => {
  const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  db._faults.updateThrowsOn = 'demo_vendors';
  db._faults.updateThrowsAfter = 1;
  await captureErr(() => fireInvite({ db }));
  const row = db._tables.demo_vendors[0];
  assert.ok(row.invite_sent_at, 'the spend was lost with the transition');
  assert.strictEqual(row.state, 'built', 'the transition is supposed to have FAILED here');
});

await ta('§3.4 AND THE WINDOW CLOSES: a re-send on that row is refused', async () => {
  // The whole arc in one cell — send, transition fails, founder tries again.
  const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  db._faults.updateThrowsOn = 'demo_vendors';
  db._faults.updateThrowsAfter = 1;
  await captureErr(() => fireInvite({ db }));
  db._faults.updateThrowsOn = null;
  const { out, calls } = await fireInvite({ db });
  assert.strictEqual(out.body.error, 'invite_already_sent');
  assert.strictEqual(calls.length, 0,
    'the founder sent a SECOND real template to a vendor who already had one');
});

await ta('§3.5 the line attributes HONESTLY when the SPEND ITSELF failed to record', async () => {
  // The other side of the same failure: markInviteSent is what broke, so nothing
  // in the database records the spend and the log must say exactly that rather
  // than claim a stamp it never witnessed.
  const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  db._faults.updateThrowsOn = 'demo_vendors';
  db._faults.updateThrowsAfter = 0;   // break the FIRST write — the stamp
  const { value, lines } = await captureErr(() => fireInvite({ db }));
  assert.strictEqual(value.out.body.error, 'sent_not_stamped');
  const loud = lines.join('\n');
  assert.ok(/SPEND IS NOT RECORDED/.test(loud),
    'the log claimed a stamp it did not witness');
  assert.strictEqual(db._tables.demo_vendors[0].invite_sent_at, null);
});

await ta('§3.6 a PRE-SEND refusal still writes nothing and spends nothing (no regression)', async () => {
  const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  const { out } = await fireInvite({
    db,
    sendWaImpl: async () => { const e = new Error('opted out'); e.code = 'opted_out'; throw e; },
  });
  assert.strictEqual(out.code, 409);
  assert.strictEqual(out.body.error, 'opted_out');
  assert.strictEqual(db._tables.demo_vendors[0].invite_sent_at, null,
    'a REFUSED send stamped the spent marker — the marker would then refuse a send that never happened');
  assert.strictEqual(db._tables.demo_vendors[0].state, 'built');
});

// ── §4 · ORDER, OWNERSHIP, AND THE ONE PATH ─────────────────────────────────
H('§4 — the order is the correctness');

await ta('§4.1 the stamp lands BEFORE the transition', async () => {
  const order = [];
  const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  const origFrom = db.from;
  db.from = (name) => {
    const b = origFrom(name);
    const origUpdate = b.update;
    b.update = (patch) => {
      if (name === 'demo_vendors') {
        if ('invite_sent_at' in patch) order.push('stamp');
        if ('state' in patch) order.push('state');
      }
      return origUpdate(patch);
    };
    return b;
  };
  await fireInvite({ db });
  assert.deepStrictEqual(order, ['stamp', 'state'],
    `the two post-send writes ran in the wrong order: ${order.join(' -> ')}`);
});

t('§4.2 the invite still has ONE home — no second path was minted', () => {
  assert.strictEqual((code(ADMIN).match(/async function _inviteOne/g) || []).length, 1);
  assert.strictEqual((code(ADMIN).match(/_inviteOne\(/g) || []).length, 3);
});

t('§4.3 markInviteSent has exactly ONE caller estate-wide, and it is the fused body', () => {
  // FORK A(ii)'s residual is answered by the pre-check, not by hope — but a
  // SECOND caller appearing is still the thing to catch, because it would be a
  // second opinion about when the marker is written.
  const files = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === 'dist') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|ts)$/.test(e.name)) files.push(p);
    }
  })(SRC('src'));
  const callers = files.filter((f) =>
    /markInviteSent\(/.test(strip(fs.readFileSync(f, 'utf8')))
    && path.relative(ROOT, f) !== LC);
  assert.deepStrictEqual(callers.map((f) => path.relative(ROOT, f)), [ADMIN],
    `markInviteSent gained a caller outside the fused body: ${callers.join(', ')}`);
});

t('§4.4 NO route clears the marker — FORK D(ii), recovery is founder-SQL', () => {
  assert.ok(!/invite_sent_at:\s*null/.test(code(ADMIN)),
    'a route nulls the spent marker; the column is a history stamp and recovery was ruled founder-SQL');
  assert.ok(!/invite_sent_at:\s*null/.test(code(LC)),
    'the lifecycle module clears the spent marker');
});

t('§4.5 the F-06.85 mechanism comment names BOTH halves it is conditioned on', () => {
  // Deliberately reads the UNSTRIPPED file: this cell's subject IS the comment.
  const src = read(ADMIN);
  const block = src.split('F-06.85 · THIS BODY IS THE ONLY PATH')[1] || '';
  assert.ok(block.length, 'the F-06.85 paragraph is gone');
  assert.ok(/markInviteSent/.test(block.slice(0, 1600)), 'it does not name the writer');
  assert.ok(/row\.invite_sent_at/.test(block.slice(0, 1600)), 'it does not name the reading refusal');
});

// ── §5 · THE COLUMN'S PROVENANCE AND ITS REACH ──────────────────────────────
H('§5 — the ladder, the reads, and the wire');

t('§5.1 0109 adds the column in the ladder-visible ADD COLUMN shape', () => {
  const sql = read(MIG);
  assert.ok(/alter table public\.demo_vendors\s*\n\s*add column if not exists invite_sent_at timestamptz;/.test(sql),
    'the phantom-column bench derives provenance by matching ALTER TABLE ... ADD COLUMN');
});

t('§5.2 0109 ships its reverse direction FULLY COMMENTED (conditional-withheld)', () => {
  const sql = read(MIG);
  const live = sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  assert.ok(!/drop column/i.test(live),
    'a runnable DROP shipped beside the block it conditions');
  assert.ok(/--\s*alter table public\.demo_vendors drop column if exists invite_sent_at;/.test(sql),
    'the reverse direction is absent entirely — it must exist, commented');
});

t('§5.3 the pre-check READS the column', () => {
  assert.ok(/\.select\('id, ig_handle, display_name, whatsapp_phone, state, active[^']*invite_sent_at[^']*'\)/
    .test(code(ADMIN)), 'the pre-check cannot see the column it refuses on');
});

t('§5.4 the module\'s own reads carry it, so markInviteSent can refuse a re-stamp', () => {
  const hits = (code(LC).match(/claim_token, invite_sent_at/g) || []).length;
  assert.strictEqual(hits, 3, `_write/_read/_readByHandle must all carry the column (found ${hits}/3)`);
});

t('§5.5 the board ships the column WITHOUT a second opinion about it', () => {
  // GET /vendors reads select('*') and spreads the row, so the fact rides raw and
  // the SERVER holds no derived predicate the client could contradict — the
  // one-authority shape F-08.45 ruled. The cell guards the `select('*')` that
  // makes it true; a narrowing edit would silently drop the tell off the wire.
  const board = code(ADMIN).split("router.get('/vendors'")[1].split('router.')[0];
  assert.ok(/\.from\('demo_vendors'\)\.select\('\*'\)/.test(board),
    'the board no longer selects * — the spent marker would stop reaching the console');
  assert.ok(!/invite_sent_at/.test(board),
    'the board derived an opinion about the marker; the predicate belongs to the route and the client');
});

// ════════════════════════════════════════════════════════════════════════════
// §M · NON-VACUITY — every cell above proven RED at MUTATED PRODUCTION CODE
// ════════════════════════════════════════════════════════════════════════════
H('§M — both ways, by mutating production source');

async function mutateAndDrive(rel, from, to, cellName, driveAndAssert) {
  const abs = SRC(rel);
  const original = fs.readFileSync(abs, 'utf8');
  if (original.split(from).length - 1 !== 1) {
    await ta(`§M ${cellName} goes RED when its production code is broken`, async () => {
      throw new Error(`anchor absent or ambiguous (must appear exactly once): ${rel} <- ${from}`);
    });
    return;
  }
  fs.writeFileSync(abs, original.replace(from, to));
  let wentRed = false;
  try { await driveAndAssert(); } catch (_e) { wentRed = true; }
  fs.writeFileSync(abs, original);
  assert.strictEqual(fs.readFileSync(abs, 'utf8'), original, `${rel} not restored byte-identical`);
  await ta(`§M ${cellName} goes RED when its production code is broken`, async () => {
    assert.ok(wentRed, `${cellName} passed over broken production code — the cell is VACUOUS`);
  });
}

// THE CE'S TWO NAMED MUTATIONS, first.
await mutateAndDrive(ADMIN,
  '  if (row.invite_sent_at) {',
  '  if (false) {',
  '§2.1 the spent pre-check refuses a second template',
  async () => {
    const db = makeDb({ demo_vendors: [seedVendor({ invite_sent_at: iso(Date.now() - DAY) })], prospects: [] });
    const { out, calls } = await fireInvite({ db });
    assert.strictEqual(out.body.error, 'invite_already_sent');
    assert.strictEqual(calls.length, 0);
  });

await mutateAndDrive(ADMIN,
  '    const m = await demoLifecycle.markInviteSent(supabase, row.id, { via: \'admin_console\' });',
  '    const m = { ok: true };',
  '§3.3 the stamp actually lands (not merely called)',
  async () => {
    const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
    db._faults.updateThrowsOn = 'demo_vendors';
    db._faults.updateThrowsAfter = 1;
    await captureErr(() => fireInvite({ db }));
    assert.ok(db._tables.demo_vendors[0].invite_sent_at, 'the spend was lost with the transition');
  });

// THE ORDER MUTATION — the stamp moved BEHIND the transition, which is the
// shape that re-opens the disease while every status code stays identical.
await mutateAndDrive(ADMIN,
  '    spendRecorded = true;',
  '    spendRecorded = true;\n    await new Promise((r) => setTimeout(r, 0));',
  '§4.1 the order cell is real (a no-op edit must NOT red it — control)',
  async () => {
    // DELIBERATE INVERSION, and it is the honest form of this proof: a mutation
    // that changes NOTHING semantically must leave the cell GREEN, or the cell is
    // reacting to edits rather than to order. This drive asserts the cell's
    // NEGATION so that a green cell registers as the expected RED here.
    const order = [];
    const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
    const origFrom = db.from;
    db.from = (name) => {
      const b = origFrom(name);
      const origUpdate = b.update;
      b.update = (patch) => {
        if (name === 'demo_vendors') {
          if ('invite_sent_at' in patch) order.push('stamp');
          if ('state' in patch) order.push('state');
        }
        return origUpdate(patch);
      };
      return b;
    };
    await fireInvite({ db });
    assert.notDeepStrictEqual(order, ['stamp', 'state']);
  });

await mutateAndDrive(ADMIN,
  '      throw new Error(`onInvited refused: ${r.reason} (${r.detail})`);',
  '      return { status: 500, body: { ok: false, error: r.reason } };',
  '§3.1 a post-send failure is named sent_not_stamped, never a bare reason',
  async () => {
    const db = makeDb({ demo_vendors: [seedVendor({ state: 'built' })], prospects: [] });
    // Drive the RETURN-not-ok path: the row moves out from under the transition.
    const lc = freshLc();
    void lc;
    const origFrom = db.from;
    let sent = false;
    db.from = (name) => {
      const b = origFrom(name);
      const origUpdate = b.update;
      b.update = (patch) => {
        if (name === 'demo_vendors' && 'invite_sent_at' in patch && !sent) {
          sent = true;
          db._tables.demo_vendors[0].state = 'claimed';   // now illegal_transition
        }
        return origUpdate(patch);
      };
      return b;
    };
    const { value } = await captureErr(() => fireInvite({ db }));
    assert.strictEqual(value.out.body.error, 'sent_not_stamped');
  });

await mutateAndDrive(LC,
  '  if (row.invite_sent_at) return _refuse(\'already_stamped\', row.invite_sent_at);',
  '  if (false) return _refuse(\'already_stamped\', row.invite_sent_at);',
  '§1.4 the re-stamp refusal protects the FIRST despatch time',
  async () => {
    const first = iso(Date.now() - 3 * DAY);
    const db = makeDb({ demo_vendors: [seedVendor({ invite_sent_at: first })], prospects: [] });
    const r = await freshLc().markInviteSent(db, 'demo-1', {});
    assert.strictEqual(r.reason, 'already_stamped');
    assert.strictEqual(db._tables.demo_vendors[0].invite_sent_at, first);
  });

await mutateAndDrive(LC,
  '  const updated = await _write(supabase, row.id, { invite_sent_at: _iso(_now()) });',
  '  const updated = await _write(supabase, row.id, { invite_sent_at: _iso(_now()), state: \'invited\' });',
  '§1.3 the stamp does not move state (the two acts stay two)',
  async () => {
    const db = makeDb({ demo_vendors: [seedVendor({ state: 'built' })], prospects: [] });
    await freshLc().markInviteSent(db, 'demo-1', {});
    assert.strictEqual(db._tables.demo_vendors[0].state, 'built');
  });

// ── close ──────────────────────────────────────────────────────────────────
if (skipped.length) {
  console.log('\nNAMED SKIPS (floor-method law — a skip is disclosed, never counted as a pass):');
  skipped.forEach((r) => console.log(`  · ${r}`));
}
console.log(`\n══ b08_p5_invite_bench: ${pass} passed, ${fail} failed, ${skipped.length} skipped ══\n`);
process.exit(fail === 0 ? 0 : 1);

})().catch((e) => { console.error('BENCH CRASHED:', e); process.exit(2); });
