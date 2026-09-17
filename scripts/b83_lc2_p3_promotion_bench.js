#!/usr/bin/env node
'use strict';
// scripts/b83_lc2_p3_promotion_bench.js — TDW CE-43 · LC-2 · packet 3 (dream-os) · the promotion
// act and everything it touches. Rung b83, chair-allocated. Runnable from any directory.
// Exit 0 green, 1 red, 2 bench error.
//
//   §1  bookedLeads.js: the booked-lead binder set; arm (iii) proven equal to the .not() form.
//   §2  F13(a) in the two slicers (vendor-engine/cabinet.js, vendor-engine/today.js), real handlers.
//   §3  F13(a) in LC-1's seam predicate (bookingEvent.js).
//   §4  schedules.js: F7's remainder helper, explicit amounts, F6's date and due move, F17, F16,
//       the R-43.11 mirror behind PACKAGE_MONEY_MIRROR; the milestone PATCH door (F7, F-43.81).
//   §5  invoices: createInvoice's two links and error code; F4 in generateInvoiceForBinder.
//   §6  promotion.js driven end to end over a double of both planes (the synthesis scenario):
//       F3's order, F27(b), choices 1 to 4, idempotency, refusals, the invoice race, a failed step.
//   §7  the two doors: POST /leads/:leadId/promote and POST /clients/direct (F28(b), C5 vs F29).
//   §8  F17 on the money door's mark-paid.
//   §9  the engine export (door-only).
//   §10 column existence against docs/db/PUBLIC_SCHEMA.md and ENGINE_SCHEMA.md (R-40.80).
//   §11 mutations of production code, compiled in memory under their real paths.
//
// NOT PROVEN HERE (declared): the real database and the real engine client. The double models
// the unique indexes this act relies on (uq_leads_binder_id, uq_invoices_lead_package,
// payment_schedules (invoice_id, ordinal), the records primary key); the founder's walk and
// SELECTs are the database witness.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-dummy-key';
delete process.env.PACKAGE_MONEY_MIRROR;
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ROOT = path.resolve(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const readIf = (rel) => (fs.existsSync(P(rel)) ? fs.readFileSync(P(rel), 'utf8') : '');

let pass = 0, fail = 0;
const fails = [];
const sec = (s) => console.log(`\n── ${s} ──`);
function ok(c, n) { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; fails.push(n); console.log(`  FAIL ${n}`); } }
const tryRequire = (rel) => { try { return require(P(rel)); } catch (e) { console.log(`  (require ${rel} failed: ${e.message.split('\n')[0]})`); return null; } };
// A driver that throws (a symbol absent at base) reads as an empty result, so its cells RED.
const safe = async (fn) => { try { return (await fn()) || {}; } catch (e) { console.log(`  (driver threw: ${String(e && e.message).split('\n')[0]})`); return {}; } };
const quiet = async (fn) => { const w = console.warn, e = console.error, l = console.log; console.warn = () => {}; console.error = () => {}; console.log = () => {}; try { return await fn(); } finally { console.warn = w; console.error = e; console.log = l; } };

function loadMutated(rel, from, to, overrides = {}) {
  const file = P(rel);
  if (!fs.existsSync(file)) return { missing: true };
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes(from)) return { missing: true };
  const m = new Module(file, module);
  m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
  const origReq = m.require.bind(m);
  m.require = (spec) => {
    const resolved = Module._resolveFilename(spec, m);
    return Object.prototype.hasOwnProperty.call(overrides, resolved) ? overrides[resolved] : origReq(spec);
  };
  try { m._compile(src.replace(from, to), file); return { mod: m.exports }; }
  catch (e) { console.log(`  (mutated ${rel} did not load: ${e.message.split('\n')[0]})`); return { failed: true }; }
}

// ── the database double: two schemas, filters that bite, the unique indexes this act leans on ──
function makeDb(seed = {}, opts = {}) {
  const tables = {};
  for (const [k, v] of Object.entries(seed)) tables[k] = v.map((r) => ({ ...r }));
  let nextId = 1;
  const calls = [];
  const live = (r) => r.deleted_at == null;
  function violates(table, all) {
    const dup = (rows, key) => { const seen = new Set(); for (const r of rows) { const k = key(r); if (k == null) continue; if (seen.has(k)) return true; seen.add(k); } return false; };
    if (table === 'leads' && dup(all, (r) => r.binder_id || null)) return 'uq_leads_binder_id';
    if (table === 'lead_packages' && dup(all.filter(live), (r) => r.lead_id)) return 'uq_lead_packages_live';
    if (table === 'invoices' && dup(all.filter(live), (r) => r.lead_package_id || null)) return 'uq_invoices_lead_package';
    if (table === 'invoices' && dup(all, (r) => `${r.vendor_id}|${r.invoice_number}`)) return 'invoices_vendor_number_unique';
    if (table === 'payment_schedules' && dup(all, (r) => `${r.invoice_id}|${r.ordinal}`)) return 'payment_schedules_invoice_id_ordinal_key';
    if ((table === 'engine.records' || table === 'events' || table === 'invoices') && dup(all, (r) => r.id)) return `${table}_pkey`;
    return null;
  }
  function from(table) {
    const st = { op: 'select', filters: [], rows: null, patch: null, limit: null, single: false, maybe: false, returning: false, order: null };
    const b = {
      select() { if (st.op !== 'select') st.returning = true; return b; },
      eq(c, v) { st.filters.push([c, 'eq', v, (r) => r[c] === v]); return b; },
      neq(c, v) { st.filters.push([c, 'neq', v, (r) => r[c] !== v]); return b; },
      is(c, v) { st.filters.push([c, 'is', v, (r) => (v === null ? r[c] == null : r[c] === v)]); return b; },
      not(c, o, v) { if (o === 'is' && v === null) st.filters.push([c, 'not', v, (r) => r[c] != null]); return b; },
      in(c, vs) { st.filters.push([c, 'in', vs, (r) => vs.includes(r[c])]); return b; },
      gte(c, v) { st.filters.push([c, 'gte', v, (r) => String(r[c]) >= String(v)]); return b; },
      lte(c, v) { st.filters.push([c, 'lte', v, (r) => String(r[c]) <= String(v)]); return b; },
      order(c, o = {}) { if (!st.order) st.order = [c, o.ascending !== false]; return b; },
      limit(n) { st.limit = n; return b; },
      insert(rows) { st.op = 'insert'; st.rows = Array.isArray(rows) ? rows : [rows]; return b; },
      update(patch) { st.op = 'update'; st.patch = patch; return b; },
      delete() { st.op = 'delete'; return b; },
      single() { st.single = true; return b; },
      maybeSingle() { st.maybe = true; return b; },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    };
    function shape(rows) {
      if (st.single) return rows.length === 1 ? { data: { ...rows[0] }, error: null } : { data: null, error: { code: 'PGRST116', message: 'not one row' } };
      if (st.maybe) return { data: rows[0] ? { ...rows[0] } : null, error: null };
      return { data: rows.map((r) => ({ ...r })), error: null };
    }
    function run() {
      const call = { table, op: st.op, patch: st.patch, rows: st.rows, filters: st.filters.map(([c, o, v]) => [c, o, v]) };
      calls.push(call);
      const t = tables[table] || (tables[table] = []);
      const hook = opts.fail && opts.fail(call);
      if (hook) return { data: null, error: hook };
      if (st.op === 'insert') {
        const stamp = '2026-09-17T10:00:00Z';
        const made = st.rows.map((r) => ({ id: `${table.replace('engine.', 'e')}-${nextId++}`, created_at: stamp, updated_at: stamp, deleted_at: null, ...r }));
        const bad = violates(table, [...t, ...made]);
        if (bad) return { data: null, error: { code: '23505', message: `duplicate key value violates unique constraint "${bad}"` } };
        t.push(...made);
        call.returned = made;
        return st.returning ? shape(made) : { data: null, error: null };
      }
      let rows = t.filter((r) => st.filters.every((f) => f[3](r)));
      if (st.op === 'update') {
        const before = rows.map((r) => ({ ...r }));
        rows.forEach((r) => Object.assign(r, st.patch));
        const bad = violates(table, t);
        if (bad) { rows.forEach((r, i) => { for (const k of Object.keys(r)) delete r[k]; Object.assign(r, before[i]); }); return { data: null, error: { code: '23505', message: `duplicate key value violates unique constraint "${bad}"` } }; }
        call.returned = rows;
        return st.returning ? shape(rows) : { data: null, error: null };
      }
      if (st.op === 'delete') {
        tables[table] = t.filter((r) => !rows.includes(r));
        return { data: null, error: null };
      }
      rows = rows.slice();
      if (st.order) { const [c, asc] = st.order; rows.sort((a, b2) => (a[c] < b2[c] ? -1 : a[c] > b2[c] ? 1 : 0) * (asc ? 1 : -1)); }
      if (st.limit != null) rows = rows.slice(0, st.limit);
      call.returned = rows;
      return shape(rows);
    }
    return b;
  }
  const api = { from, tables, calls, schema: (s) => ({ from: (t) => from(s === 'engine' ? `engine.${t}` : t) }) };
  return api;
}

async function call(router, method, routePath, { db, vendor, params = {}, body = {}, agentId = null, auth = null }) {
  const layer = router.stack.find((l) => l.route && l.route.path === routePath && l.route.methods[method]);
  if (!layer) throw new Error(`no ${method} ${routePath}`);
  const h = layer.route.stack[layer.route.stack.length - 1].handle;
  let status = 200, out = null;
  const res = { status(s) { status = s; return res; }, json(b) { out = b; return res; } };
  const req = { app: { locals: { supabase: db } }, vendor, params, body, query: {}, agentId, auth };
  await new Promise((resolve, reject) => { Promise.resolve(h(req, res, (e) => (e ? reject(e) : resolve()))).then(() => setImmediate(resolve), reject); });
  return { status, body: out };
}
const hasRoute = (router, method, p) => !!(router && router.stack.find((l) => l.route && l.route.path === p && l.route.methods[method]));

const V = { id: 'v-dev440', user_id: 'u-dev', category: 'photography' };
const OTHER = { id: 'v-other', user_id: 'u-oth', category: 'decor' };
const AGENT = 'a-dev440';
const U = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

// ── fixtures for the synthesis ────────────────────────────────────────────────────────────
const SARAH_LP = {
  id: 'lp-sarah', vendor_id: V.id, lead_id: 'lead-sarah', package_id: 'pk-2',
  snapshot: { name: 'Photographs and film', deposit_pct: 30, middle_pct: 30, middle_enabled: true },
  total: 80000, delivery_on: '2027-02-05', deleted_at: null,
  schedule: [
    { kind: 'deposit', pct: 30, amount: 24000, due_on: '2026-09-17' },
    { kind: 'middle', pct: 30, amount: 24000, due_on: '2026-11-22' },
    { kind: 'final', pct: 40, amount: 32000, due_on: '2027-02-05' },
  ],
};
function world(extra = {}) {
  return {
    vendors: [{ id: V.id, business_name: 'DEV440', routing_handle: 'DEV440', invoice_prefix: 'TDW/DEV440', invoice_counter: 11, user_id: V.user_id }],
    clients: [],
    leads: [
      { id: 'lead-sarah', vendor_id: V.id, name: 'Sarah', phone: '+919876543210', wedding_date: '2026-12-22', wedding_date_precision: 'day', state: 'quoted', binder_id: null, deleted_at: null },
      { id: 'lead-bare', vendor_id: V.id, name: 'Bare', phone: null, wedding_date: '2026-12-22', wedding_date_precision: 'day', state: 'new', binder_id: null, deleted_at: null },
      { id: 'lead-other', vendor_id: OTHER.id, name: 'Nope', phone: null, wedding_date: '2026-12-22', state: 'new', binder_id: null, deleted_at: null },
    ],
    lead_packages: [{ ...SARAH_LP }],
    events: [],
    invoices: [],
    payment_schedules: [],
    'engine.records': [],
    ...extra,
  };
}
// the engine doubles: they write the same double the act reads
function engineFakes(db, log = []) {
  const apply = (id, patch) => { const r = db.tables['engine.records'].find((x) => x.id === id); if (!r) return { display: `ERROR: binder ${id} not found.` }; Object.assign(r, patch); return { display: `Updated record ${id}`, item: { ref_id: id } }; };
  return {
    openRecordWithId: async (agentId, id, fields) => {
      log.push(['open', id, { ...fields }]);
      db.calls.push({ table: 'engine.records', op: 'insert', rows: [{ id }] });
      const t = db.tables['engine.records'];
      if (t.find((r) => r.id === id)) return { display: 'ERROR creating record: duplicate key value violates unique constraint "records_pkey"' };
      t.push({ id, agent_id: agentId, hidden: false, ...fields });
      return { display: `Record ${id} created`, item: { ref_id: id } };
    },
    patchNote: async () => {},
    executeAndPatch: async (agentId, name, input) => {
      log.push([name, { ...input }]);
      if (name === 'donna_stage') return apply(input.binder_id, { stage: input.stage });
      if (name === 'donna_money') return apply(input.binder_id, { amount: Number(input.amount), direction: input.direction });
      if (name === 'donna_money_edit') { const p = { ...input }; delete p.binder_id; for (const k of ['amount_received', 'amount_pending']) if (k in p) p[k] = Number(p[k]); return apply(input.binder_id, p); }
      return { display: `ERROR: unexpected ${name}` };
    },
  };
}
function fakeWriteEvent(db, mode = 'ok') {
  return async (supabase, p) => {
    if (mode === 'conflict') return { ok: false, conflict: { kind: 'date_blocked', message: 'That day is blocked.' } };
    const row = { id: `ev-${db.tables.events.length + 1}`, vendor_id: p.vendorId, title: p.title, event_date: p.event_date, kind: p.kind, linked_lead_id: p.linked_lead_id, linked_binder_id: p.linked_binder_id, state: p.state, deleted_at: null };
    db.tables.events.push(row);
    db.calls.push({ table: 'events', op: 'insert', rows: [row] });
    return { ok: true, event: row };
  };
}

(async () => {
  const booked = tryRequire('src/lib/vendor/bookedLeads.js');
  const schedules = tryRequire('src/lib/vendor/schedules.js');
  const promotion = tryRequire('src/lib/vendor/promotion.js');
  const invLib = tryRequire('src/lib/vendor/invoices.js');
  const bookingEvent = tryRequire('src/lib/vendor/bookingEvent.js');

  // shared drivers, each taking the module under test so §11 can pass a mutated one
  async function bookedCells(B) {
    const r = {};
    if (!B) return r;
    const rows = [
      { id: 'l1', vendor_id: V.id, state: 'booked', binder_id: 'b1', deleted_at: null },
      { id: 'l2', vendor_id: V.id, state: 'booked', binder_id: null, deleted_at: null },
      { id: 'l3', vendor_id: V.id, state: 'booked', binder_id: 'b3', deleted_at: null },
      { id: 'l4', vendor_id: V.id, state: 'quoted', binder_id: 'b4', deleted_at: null },
      { id: 'l5', vendor_id: V.id, state: 'booked', binder_id: 'b5', deleted_at: '2026-09-01' },
      { id: 'l6', vendor_id: OTHER.id, state: 'booked', binder_id: 'b6', deleted_at: null },
    ];
    const db = makeDb({ leads: rows });
    const got = await B.readBookedBinderIds(db, V.id);
    const notForm = await db.from('leads').select('binder_id').eq('vendor_id', V.id).eq('state', 'booked').is('deleted_at', null).not('binder_id', 'is', null);
    const want = new Set(notForm.data.map((x) => x.binder_id));
    r.equal = got.ok && got.ids.size === want.size && [...want].every((x) => got.ids.has(x));
    r.exact = got.ok && [...got.ids].sort().join() === 'b1,b3';
    r.noNull = got.ok && !got.ids.has(null) && ![...got.ids].some((x) => x == null);
    const readCall = db.calls.find((c) => c.table === 'leads');
    r.noNot = !!readCall && !readCall.filters.some((f) => f[1] === 'not');
    const bad = makeDb({ leads: rows }, { fail: (c) => (c.table === 'leads' ? { message: 'boom' } : null) });
    const e = await B.readBookedBinderIds(bad, V.id);
    r.error = e.ok === false && e.error === 'boom';
    return r;
  }
  async function scheduleCells(S) {
    const r = {};
    if (!S) return r;
    const m1 = S.milestoneAmounts(100001, [{ pct: 30 }, { pct: 30 }, { pct: 40 }]);
    r.remainder = m1.ok && m1.amounts.join() === '30000,30000,40001';
    const m2 = S.milestoneAmounts(80000, [{ pct: 30, amount_due: 24000 }, { pct: 30, amount_due: 24000 }, { pct: 40, amount_due: 32000 }]);
    r.explicit = m2.ok && m2.amounts.join() === '24000,24000,32000';
    const m3 = S.milestoneAmounts(80000, [{ pct: 50, amount_due: 40000 }, { pct: 50, amount_due: 39999 }]);
    r.explicitRefused = !m3.ok;
    const m4 = S.milestoneAmounts(7, [{ pct: 33.33 }, { pct: 33.33 }, { pct: 33.34 }]);
    r.sumsToTotal = m4.ok && m4.amounts.reduce((a, b2) => a + b2, 0) === 7;

    const db = makeDb({ invoices: [{ id: 'inv1', vendor_id: V.id, amount_total: 100001, amount_paid: 0, state: 'unpaid', has_schedule: false, lead_package_id: 'lp1', deleted_at: null }], payment_schedules: [] });
    const cs = await S.createSchedule(db, V.id, 'inv1', [{ label: 'A', pct: 30, due_date: '2026-10-01' }, { label: 'B', pct: 30, due_date: '2026-11-01' }, { label: 'C', pct: 40, due_date: '2026-12-01' }]);
    r.createRemainder = cs.ok && db.tables.payment_schedules.map((m) => m.amount_due).join() === '30000,30000,40001' && db.tables.invoices[0].has_schedule === true;
    const [a, b2] = db.tables.payment_schedules;
    const p1 = await quiet(() => S.markMilestonePaid(db, V.id, a.id, a.amount_due, '2026-09-20'));
    r.paidOn = p1.ok && String(db.tables.payment_schedules[0].paid_at).startsWith('2026-09-20');
    r.dueMoved = p1.ok && db.tables.invoices[0].due_date === '2026-11-01' && db.tables.invoices[0].state === 'advance_paid';
    r.mirrorOff = p1.ok && p1.mirror && p1.mirror.mirrored === false && p1.mirror.reason === 'off';
    const again = await S.markMilestonePaid(db, V.id, a.id, a.amount_due, '2026-09-20');
    r.alreadyPaid = !again.ok && again.code === 'ALREADY_PAID';
    r.badDate = !(await S.markMilestonePaid(db, V.id, b2.id, 1, '20 Sep')).ok;
    const nx = await quiet(() => S.payNextMilestone(db, V.id, 'inv1', '2026-10-05'));
    r.nextPaid = nx.handled && nx.ok && db.tables.payment_schedules[1].state === 'paid' && db.tables.payment_schedules[1].paid_amount === 30000 && db.tables.invoices[0].due_date === '2026-12-01';
    await quiet(() => S.payNextMilestone(db, V.id, 'inv1', '2026-12-01'));
    r.dueNullAtEnd = db.tables.invoices[0].due_date === null && db.tables.invoices[0].state === 'paid' && db.tables.invoices[0].amount_paid === 100001;
    const done = await S.payNextMilestone(db, V.id, 'inv1', '2026-12-02');
    r.nothingLeft = done.handled && !done.ok && done.code === 'INVOICE_PAID';

    const plain = makeDb({ invoices: [{ id: 'inv2', vendor_id: V.id, amount_total: 500, amount_paid: 0, state: 'unpaid', has_schedule: true, lead_package_id: null, deleted_at: null }], payment_schedules: [{ id: 'm9', invoice_id: 'inv2', vendor_id: V.id, ordinal: 1, amount_due: 500, state: 'pending', pct: 100 }] });
    const np = await S.payNextMilestone(plain, V.id, 'inv2', '2026-10-05');
    r.notPackage = np.handled === false && plain.tables.payment_schedules[0].state === 'pending';
    const del1 = await S.deleteSchedule(db, V.id, 'inv1');
    const del2 = await S.deleteSchedule(plain, V.id, 'inv2');
    r.f16 = !del1.ok && del1.code === 'PACKAGE_SCHEDULE' && db.tables.payment_schedules.length === 3;
    r.plainDelete = del2.ok && plain.tables.payment_schedules.length === 0;

    const mdb = makeDb({ invoices: [{ id: 'inv3', vendor_id: V.id, binder_id: 'b1', lead_package_id: 'lp3', amount_total: 1000, amount_paid: 300 }] });
    const seen = [];
    const exec = async (agentId, name, input) => { seen.push([agentId, name, input]); return { display: 'ok' }; };
    const off = await S.mirrorToBinder(mdb, V.id, 'inv3', { agentId: AGENT, env: {}, executeAndPatch: exec });
    const on = await S.mirrorToBinder(mdb, V.id, 'inv3', { resolveAgentId: async () => AGENT, env: { PACKAGE_MONEY_MIRROR: '1' }, executeAndPatch: exec });
    r.mirrorGate = off.mirrored === false && seen.length === 1;
    r.mirrorAbsolute = on.mirrored === true && seen.length === 1 && seen[0][0] === AGENT && seen[0][1] === 'donna_money_edit'
      && seen[0][2].binder_id === 'b1' && seen[0][2].amount_received === 300 && seen[0][2].amount_pending === 700 && seen[0][2].payment_status === 'partial';
    return r;
  }

  sec('§1 bookedLeads.js · the booked-lead set (arm (iii), ratified)');
  {
    const r = await safe(() => bookedCells(booked));
    ok(r.equal, '§1.1 THE CHAIR\'S CELL: the id set equals the .not(binder_id is null) form on a fixture with null and non-null binder ids');
    ok(r.exact, '§1.2 only live, booked, this vendor\'s leads (quoted, deleted and another vendor\'s are out)');
    ok(r.noNull, '§1.3 null binder ids are dropped in code');
    ok(r.noNot, '§1.4 the production read uses no .not()');
    ok(r.error, '§1.5 a failed read is ok:false with the message, never an empty set');
  }

  // slicer drivers
  async function slicerCells(cabinetMod, todayMod) {
    const r = {};
    const recs = [
      { id: 'b-promoted', agent_id: AGENT, client: 'Sarah', stage: 'quoted', direction: 'in', amount: 80000, hidden: false, date: '2026-12-22', created_at: '2026-09-17' },
      { id: 'b-legacy', agent_id: AGENT, client: 'Dholakia', stage: 'confirmed booking', direction: 'in', amount: 50000, hidden: false, date: '2026-09-21', created_at: '2026-09-15' },
      { id: 'b-lead', agent_id: AGENT, client: 'Priya', stage: 'quoted', direction: 'in', hidden: false, created_at: '2026-09-10' },
    ];
    const seed = () => ({ users: [{ id: V.user_id, name: 'Dev' }], events: [], 'engine.records': recs.map((x) => ({ ...x })),
      leads: [{ id: 'l1', vendor_id: V.id, state: 'booked', binder_id: 'b-promoted', deleted_at: null }, { id: 'l2', vendor_id: V.id, state: 'quoted', binder_id: 'b-lead', deleted_at: null }] });
    if (cabinetMod) {
      const out = await call(cabinetMod, 'get', '/:vendorId', { db: makeDb(seed()), vendor: V, params: { vendorId: V.id }, agentId: AGENT });
      const c = (out.body && out.body.clients || []).map((b2) => b2.id);
      const l = (out.body && out.body.leads || []).map((b2) => b2.id);
      r.cabClient = c.includes('b-promoted') && !l.includes('b-promoted');
      r.cabLegacy = c.includes('b-legacy');
      r.cabLead = l.includes('b-lead') && !c.includes('b-lead');
      const bad = await quiet(() => call(cabinetMod, 'get', '/:vendorId', { db: makeDb(seed(), { fail: (x) => (x.table === 'leads' ? { message: 'down' } : null) }), vendor: V, params: { vendorId: V.id }, agentId: AGENT }));
      r.cabFails = bad.status === 500 && bad.body && bad.body.which === 'leads';
    }
    if (todayMod) {
      const out = await call(todayMod, 'get', '/:vendorId', { db: makeDb(seed()), vendor: V, params: { vendorId: V.id }, agentId: AGENT });
      const nl = ((out.body && out.body.needs_attention && out.body.needs_attention.new_leads) || []).map((b2) => b2.id);
      r.todayOut = out.status === 200 && nl.length === 1 && !nl.includes('b-promoted') && nl.includes('b-lead') && !nl.includes('b-legacy');
    }
    return r;
  }
  sec('§2 F13(a) · the Clients and Today slicers, real handlers');
  {
    const r = await safe(() => slicerCells(tryRequire('src/api/vendor-engine/cabinet.js'), tryRequire('src/api/vendor-engine/today.js')));
    ok(r.cabClient, '§2.1 Clients: a binder at stage "quoted" with a booked lead behind it is a client, not a lead');
    ok(r.cabLegacy, '§2.2 Clients: the legacy six-word set still makes a client (no binder falls off)');
    ok(r.cabLead, '§2.3 Clients: a binder whose lead is only quoted stays a lead');
    ok(r.cabFails, '§2.4 Clients: a failed booked-lead read refuses (500, which = leads), never a silent empty set');
    ok(r.todayOut, '§2.5 Today: the promoted binder leaves new_leads; the quoted one stays');
  }

  async function seamCells(BE) {
    const r = {};
    if (!BE) return r;
    const row = { id: 'b-x', hidden: false, date: '2026-12-22', client: 'Sarah', stage: 'quoted' };
    r.withSet = BE.qualifies(row, new Set(['b-x'])) === true;
    r.withoutSet = BE.qualifies(row, new Set()) === false && BE.qualifies(row) === false;
    r.legacy = BE.qualifies({ ...row, stage: 'Confirmed booking' }, new Set()) === true;
    r.stillLive = BE.qualifies({ ...row, hidden: true }, new Set(['b-x'])) === false;
    const db = makeDb({ 'engine.records': [{ ...row, agent_id: AGENT }], leads: [{ vendor_id: V.id, state: 'booked', binder_id: 'b-x', deleted_at: null }], events: [] }, { fail: (c) => (c.table === 'leads' ? { message: 'down' } : null) });
    const out = await BE.ensureForBinders(db, V, AGENT, ['b-x'], { dryRun: true });
    r.failClosed = out.created.length === 0 && out.errors.length === 1 && /booked lead read failed/.test(out.errors[0].error);
    const db2 = makeDb({ 'engine.records': [{ ...row, agent_id: AGENT }], leads: [{ vendor_id: V.id, state: 'booked', binder_id: 'b-x', deleted_at: null }], events: [] });
    const out2 = await BE.ensureForBinders(db2, V, AGENT, ['b-x'], { dryRun: true });
    r.dryCreates = out2.created.length === 1 && out2.created[0].binder_id === 'b-x';
    return r;
  }
  sec('§3 F13(a) · LC-1\'s seam predicate');
  {
    const r = await safe(() => seamCells(bookingEvent));
    ok(r.withSet, '§3.1 a dated live binder with a booked lead qualifies at any stage');
    ok(r.withoutSet, '§3.2 without the booked lead, a "quoted" binder does not');
    ok(r.legacy, '§3.3 the legacy (book|confirm) test still qualifies');
    ok(r.stillLive, '§3.4 a hidden binder never qualifies');
    ok(r.failClosed, '§3.5 a failed booked-lead read writes nothing for the pass');
    ok(r.dryCreates, '§3.6 the booked-lead binder reaches the event writer (dry run)');
  }

  sec('§4 schedules.js · F7, F6, F17, F16, R-43.11');
  {
    const r = await safe(() => scheduleCells(schedules));
    ok(r.remainder, '§4.1 F7: the last milestone is the remainder (1,00,001 → 30,000 · 30,000 · 40,001)');
    ok(r.explicit, '§4.2 C-43.2: explicit whole-rupee amounts are used as given');
    ok(r.explicitRefused, '§4.3 explicit amounts that do not add up are refused, never re-rounded');
    ok(r.sumsToTotal, '§4.4 fractional shares still add up to the total');
    ok(r.createRemainder, '§4.5 createSchedule writes the remainder rows and sets has_schedule');
    ok(r.paidOn, '§4.6 F6: the payment is dated the received-on day');
    ok(r.dueMoved, '§4.7 F6: due_date moves to the next unpaid milestone; state advance_paid');
    ok(r.mirrorOff, '§4.8 R-43.11: with PACKAGE_MONEY_MIRROR unset the mirror does nothing');
    ok(r.alreadyPaid, '§4.9 a second mark on a paid milestone is ALREADY_PAID');
    ok(r.badDate, '§4.10 a received-on that is not a date is refused');
    ok(r.nextPaid, '§4.11 F17: the next unpaid milestone is paid, its own amount, and due moves on');
    ok(r.dueNullAtEnd, '§4.12 F6: nothing left to pay → due_date null, state paid, amount_paid = total');
    ok(r.nothingLeft, '§4.13 F17: a fully paid package invoice answers INVOICE_PAID');
    ok(r.notPackage, '§4.14 F17: an invoice with no lead package is not handled here');
    ok(r.f16, '§4.15 F16: a package invoice\'s schedule cannot be removed');
    ok(r.plainDelete, '§4.16 F16 bites only package invoices: a plain schedule still deletes');
    ok(r.mirrorGate, '§4.17 R-43.11: the flag gates the write (off: no engine call)');
    ok(r.mirrorAbsolute, '§4.18 R-43.11: on, the binder gets ABSOLUTE received and pending off the invoice');
  }

  async function patchDoorCells(router) {
    const r = {};
    if (!router) return r;
    const seed = () => ({
      invoices: [{ id: 'inv1', vendor_id: V.id, amount_total: 1000 }, { id: 'invX', vendor_id: OTHER.id, amount_total: 9999 }],
      payment_schedules: [
        { id: 'm1', invoice_id: 'inv1', vendor_id: V.id, ordinal: 1, pct: 30, amount_due: 300 },
        { id: 'm2', invoice_id: 'inv1', vendor_id: V.id, ordinal: 2, pct: 70, amount_due: 700 },
        { id: 'mX', invoice_id: 'invX', vendor_id: OTHER.id, ordinal: 1, pct: 100, amount_due: 9999 },
      ],
    });
    const db = makeDb(seed());
    const bad = await call(router, 'patch', '/schedules/:milestoneId', { db, vendor: V, params: { milestoneId: 'm1' }, body: { pct: 33.33 } });
    r.sumRefused = bad.status === 400;
    db.tables.payment_schedules[1].pct = 66.67;
    const okr = await call(router, 'patch', '/schedules/:milestoneId', { db, vendor: V, params: { milestoneId: 'm1' }, body: { pct: 33.33 } });
    const ms = db.tables.payment_schedules;
    r.f7 = okr.status === 200 && ms[0].amount_due === 333 && ms[1].amount_due === 667 && ms[0].amount_due + ms[1].amount_due === 1000;
    const db2 = makeDb(seed());
    const foreign = await call(router, 'patch', '/schedules/:milestoneId', { db: db2, vendor: V, params: { milestoneId: 'mX' }, body: { pct: 100 } });
    const leaked = db2.calls.some((c) => (c.returned || []).some((row) => row.vendor_id && row.vendor_id !== V.id));
    r.scope = foreign.status === 404 && !leaked && db2.tables.payment_schedules[2].amount_due === 9999;
    return r;
  }
  sec('§4b the milestone PATCH door · F7 and F-43.81');
  {
    const r = await safe(() => patchDoorCells(tryRequire('src/api/vendor/schedules.js')));
    ok(r.sumRefused, '§4b.1 a pct change that breaks 100 is refused');
    ok(r.f7, '§4b.2 F7: the changed milestone is rounded and the last absorbs the difference');
    ok(r.scope, '§4b.3 F-43.81: another vendor\'s milestone is 404 and no foreign row is ever read back');
  }

  async function invoiceLibCells(L) {
    const r = {};
    if (!L) return r;
    const db = makeDb({ vendors: [{ id: V.id, routing_handle: 'DEV440', invoice_prefix: 'TDW/DEV440', invoice_counter: 3 }], clients: [], invoices: [] });
    const c = await L.createInvoice(db, V.id, { client_name: 'Sarah', amount_total: 100, binder_id: 'b1', lead_package_id: 'lp1' });
    r.links = c.ok && db.tables.invoices[0].binder_id === 'b1' && db.tables.invoices[0].lead_package_id === 'lp1';
    const c2 = await L.createInvoice(db, V.id, { client_name: 'Old caller', amount_total: 100 });
    r.nulls = c2.ok && db.tables.invoices[1].binder_id === null && db.tables.invoices[1].lead_package_id === null;
    const c3 = await L.createInvoice(db, V.id, { client_name: 'Sarah again', amount_total: 100, lead_package_id: 'lp1' });
    r.code = !c3.ok && c3.code === '23505';
    return r;
  }
  async function f4Cells(api) {
    const r = {};
    if (!api || !api.generateInvoiceForBinder) return r;
    const db = makeDb({
      vendors: [{ id: V.id, routing_handle: 'DEV440', invoice_prefix: 'TDW/DEV440', invoice_counter: 12 }], clients: [],
      invoices: [{ id: 'inv-pkg', vendor_id: V.id, binder_id: 'b1', lead_package_id: 'lp1', invoice_number: 'TDW/DEV440/12', amount_total: 80000, amount_paid: 48000, pdf_url: 'https://x/pdf', deleted_at: null, created_at: '2026-09-17' }],
    });
    const out = await quiet(() => api.generateInvoiceForBinder(db, V, { id: 'b1', client: 'Sarah', amount: 80000, amount_received: 24000 }));
    r.served = out.ok && out.invoice_number === 'TDW/DEV440/12' && db.tables.invoices.length === 1 && db.tables.vendors[0].invoice_counter === 12;
    const db2 = makeDb({ vendors: [{ id: V.id, routing_handle: 'DEV440', invoice_prefix: 'TDW/DEV440', invoice_counter: 12 }], clients: [],
      invoices: [{ id: 'inv-old', vendor_id: V.id, binder_id: 'b2', lead_package_id: null, invoice_number: 'TDW/DEV440/09', amount_total: 50000, amount_paid: 0, pdf_url: 'https://x/old', deleted_at: null, created_at: '2026-09-15' }] });
    const out2 = await quiet(() => api.generateInvoiceForBinder(db2, V, { id: 'b2', client: 'Dholakia', amount: 50000, amount_received: 0 }));
    r.legacy = out2.ok && out2.invoice_number === 'TDW/DEV440/09' && db2.tables.invoices.length === 1;
    return r;
  }
  sec('§5 invoices · the two links and F4');
  {
    const r = await safe(() => invoiceLibCells(invLib));
    ok(r.links, '§5.1 createInvoice writes binder_id and lead_package_id');
    ok(r.nulls, '§5.2 every other caller still inserts null for both');
    ok(r.code, '§5.3 a uq_invoices_lead_package refusal comes back with its code');
    const f = await safe(() => f4Cells(tryRequire('src/api/vendor/invoices.js')));
    ok(f.served, '§5.4 F4: a binder with a package invoice is served that invoice; nothing new is minted though the binder money lags');
    ok(f.legacy, '§5.5 F4 bites only package invoices: a current legacy invoice is served as before');
  }

  // ── §6 the synthesis ────────────────────────────────────────────────────────────────────
  async function run(P, db, params, depsExtra = {}) {
    const log = [];
    const deps = { engine: engineFakes(db, log), writeEvent: fakeWriteEvent(db), uuid: (() => { let n = 0; return () => U(++n); })(), ...depsExtra };
    const out = await quiet(() => P.promoteLead(db, { vendor: V, agentId: AGENT, ...params }, deps));
    return { out, log };
  }
  async function promotionCells(P) {
    const r = {};
    if (!P) return r;
    // 6.1 to 6.5: advance paid on Sarah
    const db = makeDb(world());
    const { out, log } = await run(P, db, { leadId: 'lead-sarah', kind: 'advance_paid', advanceReceivedOn: '2026-09-18' });
    const lead = db.tables.leads[0];
    const rec = db.tables['engine.records'][0];
    const iReserve = db.calls.findIndex((c) => c.table === 'leads' && c.op === 'update' && c.patch && c.patch.binder_id);
    const iOpen = db.calls.findIndex((c) => c.table === 'engine.records' && c.op === 'insert');
    const iBooked = db.calls.findIndex((c) => c.table === 'leads' && c.op === 'update' && c.patch && c.patch.state === 'booked');
    const reserveCall = db.calls[iReserve];
    r.ok = out.status === 200 && out.body.ok === true;
    r.reserveFirst = iReserve >= 0 && iOpen > iReserve && reserveCall.filters.some((f) => f[0] === 'binder_id' && f[1] === 'is' && f[2] === null);
    r.sameId = !!rec && lead.binder_id === rec.id && out.body.promoted.binder_id === rec.id && log.some((x) => x[0] === 'open' && x[1] === rec.id);
    r.binderFacts = !!rec && rec.stage === 'confirmed booking' && rec.amount === 80000 && rec.direction === 'in' && rec.amount_received === 24000 && rec.amount_pending === 56000 && rec.client === 'Sarah' && rec.date === '2026-12-22';
    r.bookedAfter = lead.state === 'booked' && iBooked > iOpen;
    const ev = db.tables.events[0];
    r.event = db.tables.events.length === 1 && ev.title === 'Sarah · wedding' && ev.kind === 'ceremony' && ev.linked_lead_id === 'lead-sarah' && ev.linked_binder_id === rec.id && ev.event_date === '2026-12-22';
    const inv = db.tables.invoices[0];
    r.invoice = db.tables.invoices.length === 1 && inv.lead_package_id === 'lp-sarah' && inv.binder_id === rec.id && inv.lead_id === 'lead-sarah' && inv.amount_total === 80000 && inv.invoice_number === 'TDW/DEV440/12';
    const ms = db.tables.payment_schedules.slice().sort((a, b2) => a.ordinal - b2.ordinal);
    r.rows = ms.length === 3 && ms.map((m) => m.amount_due).join() === '24000,24000,32000' && inv.has_schedule === true;
    r.labels = ms.map((m) => m.milestone_label).join('|') === 'Deposit, 30% of the fee, on booking|30% one month before the first function (optional)|The remainder, on delivery, before the work is handed over';
    r.deposit = ms[0].state === 'paid' && ms[0].due_date === '2026-09-18' && String(ms[0].paid_at).startsWith('2026-09-18') && ms[0].paid_amount === 24000 && ms[1].state === 'pending';
    r.invoiceMoney = inv.amount_paid === 24000 && inv.state === 'advance_paid' && inv.due_date === '2026-11-22';
    r.promotedFacts = !!(lead.binder_id && rec && inv.lead_package_id === 'lp-sarah');
    // second tap
    const before = JSON.stringify([db.tables.invoices, db.tables.payment_schedules, db.tables.events, db.tables['engine.records'], db.tables.vendors]);
    const again = await run(P, db, { leadId: 'lead-sarah', kind: 'advance_paid', advanceReceivedOn: '2026-09-18' });
    r.idem = again.out.status === 200 && JSON.stringify([db.tables.invoices, db.tables.payment_schedules, db.tables.events, db.tables['engine.records'], db.tables.vendors]) === before
      && !again.log.some((x) => x[0] !== 'open' && x[0] !== undefined && x[0].startsWith('donna_')) && !again.log.some((x) => x[0] === 'open');

    // 6.6 booking confirmed
    const dbB = makeDb(world());
    const b = await run(P, dbB, { leadId: 'lead-sarah', kind: 'booking_confirmed' });
    const invB = dbB.tables.invoices[0];
    const recB = dbB.tables['engine.records'][0];
    r.confirmed = b.out.status === 200 && invB && invB.amount_paid === 0 && invB.state === 'unpaid' && invB.due_date === '2026-09-17'
      && dbB.tables.payment_schedules.every((m) => m.state === 'pending') && recB.amount_received === undefined && recB.stage === 'confirmed booking';

    // 6.7 refusals
    const dbR = makeDb(world({ lead_packages: [] }));
    const noPkg = await run(P, dbR, { leadId: 'lead-sarah', kind: 'booking_confirmed' });
    const dbF = makeDb(world({ lead_packages: [{ ...SARAH_LP, total: null }] }));
    const noFee = await run(P, dbF, { leadId: 'lead-sarah', kind: 'booking_confirmed' });
    const badKind = await run(P, makeDb(world()), { leadId: 'lead-sarah', kind: 'paid' });
    const noDate = await run(P, makeDb(world()), { leadId: 'lead-sarah', kind: 'advance_paid' });
    const foreign = await run(P, makeDb(world()), { leadId: 'lead-other', kind: 'booking_confirmed' });
    r.refusals = noPkg.out.status === 422 && noPkg.out.body.code === 'no_package'
      && noFee.out.status === 422 && noFee.out.body.code === 'no_fee'
      && badKind.out.status === 422 && badKind.out.body.field === 'kind'
      && noDate.out.status === 422 && noDate.out.body.field === 'advance_received_on'
      && foreign.out.status === 404;
    r.refusalsWriteNothing = dbR.tables['engine.records'].length === 0 && dbR.tables.leads[0].binder_id === null && dbR.tables.leads[0].state === 'quoted';

    // 6.8 F27(b) adoption and choice 4
    const dbA = makeDb(world({ 'engine.records': [{ id: 'b-old', agent_id: AGENT, client: '  SARAH ', phone: '98765 43210', stage: 'quoted', hidden: false, amount: 90000, direction: 'in', amount_received: null, amount_pending: null, payment_status: null }] }));
    const ad = await run(P, dbA, { leadId: 'lead-sarah', kind: 'advance_paid', advanceReceivedOn: '2026-09-18' });
    const old = dbA.tables['engine.records'][0];
    r.adopted = ad.out.status === 200 && ad.out.body.promoted.adopted === true && dbA.tables.leads[0].binder_id === 'b-old' && dbA.tables['engine.records'].length === 1 && !ad.log.some((x) => x[0] === 'open');
    r.choice4 = old.stage === 'confirmed booking' && old.amount === 90000 && old.amount_received === 24000 && old.amount_pending == null && old.client === '  SARAH '
      && ad.log.some((x) => x[0] === 'donna_stage') && !ad.log.some((x) => x[0] === 'donna_money');
    // 6.9 not adopted
    const nameDiffers = makeDb(world({ 'engine.records': [{ id: 'b-old', agent_id: AGENT, client: 'Sara', phone: '+919876543210', stage: 'quoted', hidden: false }] }));
    const nd = await run(P, nameDiffers, { leadId: 'lead-sarah', kind: 'booking_confirmed' });
    const twoMatch = makeDb(world({ 'engine.records': [
      { id: 'b-1', agent_id: AGENT, client: 'Sarah', phone: '9876543210', stage: 'quoted', hidden: false },
      { id: 'b-2', agent_id: AGENT, client: 'sarah', phone: '09876543210', stage: 'quoted', hidden: false }] }));
    const tm = await run(P, twoMatch, { leadId: 'lead-sarah', kind: 'booking_confirmed' });
    const taken = makeDb(world({ 'engine.records': [{ id: 'b-t', agent_id: AGENT, client: 'Sarah', phone: '9876543210', stage: 'quoted', hidden: false }] }));
    taken.tables.leads.push({ id: 'lead-twin', vendor_id: V.id, name: 'Sarah', state: 'booked', binder_id: 'b-t', deleted_at: null });
    const tk = await run(P, taken, { leadId: 'lead-sarah', kind: 'booking_confirmed' });
    const noPhone = makeDb(world({ 'engine.records': [{ id: 'b-np', agent_id: AGENT, client: 'Bare', phone: null, stage: 'quoted', hidden: false }], lead_packages: [{ ...SARAH_LP, lead_id: 'lead-bare' }] }));
    const np = await run(P, noPhone, { leadId: 'lead-bare', kind: 'booking_confirmed' });
    r.notAdopted = nd.out.body.promoted.adopted === false && nameDiffers.tables.leads[0].binder_id === U(1)
      && tm.out.body.promoted.adopted === false && twoMatch.tables.leads[0].binder_id === U(1)
      && tk.out.body.promoted.adopted === false && taken.tables.leads[0].binder_id === U(1)
      && np.out.body.promoted.adopted === false && noPhone.tables.leads[1].binder_id === U(1);
    // 6.10 a reservation left by a crashed run
    const dbC = makeDb(world());
    dbC.tables.leads[0].binder_id = U(77);
    const cr = await run(P, dbC, { leadId: 'lead-sarah', kind: 'booking_confirmed' });
    r.crashResume = cr.out.status === 200 && dbC.tables['engine.records'].length === 1 && dbC.tables['engine.records'][0].id === U(77) && dbC.tables.invoices[0].binder_id === U(77);
    // 6.11 choice 1
    const dbE = makeDb(world());
    const ce = await run(P, dbE, { leadId: 'lead-sarah', kind: 'booking_confirmed' }, { writeEvent: fakeWriteEvent(dbE, 'conflict') });
    r.choice1 = ce.out.status === 200 && ce.out.body.promoted.event.refused && ce.out.body.promoted.event.refused.kind === 'date_blocked' && dbE.tables.invoices.length === 1 && dbE.tables.leads[0].state === 'booked';
    const dbE2 = makeDb(world({ events: [{ id: 'ev-old', vendor_id: V.id, linked_binder_id: null, linked_lead_id: 'lead-sarah', state: 'upcoming', deleted_at: null }] }));
    const ce2 = await run(P, dbE2, { leadId: 'lead-sarah', kind: 'booking_confirmed' });
    r.eventOnce = ce2.out.body.promoted.event.existing === true && dbE2.tables.events.length === 1;
    // 6.12 the invoice race
    const dbI = makeDb(world());
    const invoicesLib = require(P_('src/lib/vendor/invoices.js'));
    const racing = async (sb, vid, p) => {
      await invoicesLib.createInvoice(sb, vid, { ...p, client_name: 'Winner' });
      return invoicesLib.createInvoice(sb, vid, p);
    };
    const ri = await run(P, dbI, { leadId: 'lead-sarah', kind: 'booking_confirmed' }, { createInvoice: racing });
    r.race = ri.out.status === 200 && dbI.tables.invoices.length === 1 && dbI.tables.invoices[0].client_name === 'Winner' && ri.out.body.promoted.invoice_id === dbI.tables.invoices[0].id
      && dbI.tables.payment_schedules.length === 3 && dbI.tables.vendors[0].invoice_counter === 13;
    // 6.13 a failed step is named
    const dbS = makeDb(world(), { fail: (c) => (c.table === 'payment_schedules' && c.op === 'insert' ? { message: 'schedule broke' } : null) });
    const fs2 = await run(P, dbS, { leadId: 'lead-sarah', kind: 'booking_confirmed' });
    r.failStep = fs2.out.status === 500 && fs2.out.body.error === 'promotion_failed' && fs2.out.body.step === 'schedule';
    const retry = await run(P, makeDbFrom(dbS), { leadId: 'lead-sarah', kind: 'booking_confirmed' });
    r.retryHeals = retry.out.status === 200;
    r.labelFn = P.packageScheduleLabel('deposit', 40) === 'Deposit, 40% of the fee, on booking' && P.packageScheduleLabel('middle', 20) === '20% one month before the first function (optional)';
    return r;
  }
  function P_(rel) { return P(rel); }
  function makeDbFrom(db) { return makeDb(JSON.parse(JSON.stringify(db.tables))); }

  sec('§6 promotion.js · the synthesis over both planes');
  {
    const r = await safe(() => promotionCells(promotion));
    ok(r.ok, '§6.1 advance_paid on Sarah answers 200');
    ok(r.reserveFirst, '§6.2 F3: leads.binder_id is written first, WHERE binder_id IS NULL, before the binder opens');
    ok(r.sameId, '§6.3 F3: the binder opens under the reserved id through openRecordWithId');
    ok(r.binderFacts, '§6.4 the new binder: confirmed booking, Rs 80,000 in, received 24,000, pending 56,000, name and date');
    ok(r.bookedAfter, '§6.5 the lead is booked, and only after the binder exists');
    ok(r.event, '§6.6 the event: "Sarah · wedding", ceremony, on the wedding date, both links set');
    ok(r.invoice, '§6.7 one invoice: lead_package_id, binder_id and lead_id set, the next number');
    ok(r.rows, '§6.8 explicit amounts from the package schedule; has_schedule set');
    ok(r.labels, '§6.9 choice 2: A5\'s labels with the package\'s own shares');
    ok(r.deposit, '§6.10 the deposit is dated and paid on advance_received_on (F19, F6)');
    ok(r.invoiceMoney, '§6.11 amount_paid 24,000, advance_paid, due_date = the middle payment\'s date');
    ok(r.promotedFacts, '§6.12 "promoted": link set, binder present, invoice for the lead package');
    ok(r.idem, '§6.13 a second tap writes nothing (no binder, invoice, row, event, counter or engine hand)');
    ok(r.confirmed, '§6.14 booking_confirmed: nothing paid, due_date is the deposit\'s, binder carries no received figure');
    ok(r.refusals, '§6.15 refusals: no_package, no_fee, bad kind, advance without its date, another vendor\'s lead');
    ok(r.refusalsWriteNothing, '§6.16 a refusal writes nothing (no reservation, no binder, no state)');
    ok(r.adopted, '§6.17 F27(b): one live binder with the same normalised phone and name is adopted, not duplicated');
    ok(r.choice4, '§6.18 choice 4: stage set through the engine writer; money only into empty cells; nothing else rewritten');
    ok(r.notAdopted, '§6.19 F27(b): no adoption on a different name, two matches, an already-linked binder, or no phone');
    ok(r.crashResume, '§6.20 F3: a reservation left by a crashed run is opened under the same id');
    ok(r.choice1, '§6.21 choice 1: a calendar refusal is returned; the booking completes');
    ok(r.eventOnce, '§6.22 a live linked event means no second event');
    ok(r.race, '§6.23 the invoice race: the winner is read, no second invoice, one number skipped');
    ok(r.failStep, '§6.24 a failed step answers 500 promotion_failed with the step named');
    ok(r.retryHeals, '§6.25 the next tap after a failed step completes the booking');
    ok(r.labelFn, '§6.26 F26: labels carry the package\'s own shares');
  }

  // ── §7 the doors ────────────────────────────────────────────────────────────────────────
  async function doorCells(leadPkgRel, clientsRel, clientsFrom = null, clientsTo = null) {
    const r = {};
    const promoPath = require.resolve(P('src/lib/vendor/promotion.js'));
    const seen = [];
    let answer = { status: 200, body: { ok: true, promoted: { binder_id: 'b1' } } };
    const fakePromo = { promoteLead: async (sb, p) => { seen.push(p); return answer; } };
    const lp = loadMutated(leadPkgRel, 'router.post(', 'router.post(', { [promoPath]: fakePromo }).mod;
    if (lp) {
      r.promoteRoute = hasRoute(lp, 'post', '/:leadId/promote');
      const out = await call(lp, 'post', '/:leadId/promote', { db: makeDb({}), vendor: V, agentId: AGENT, params: { leadId: 'lead-sarah' }, body: { kind: 'advance_paid', advance_received_on: '2026-09-18' } });
      r.promotePass = out.status === 200 && seen[0] && seen[0].leadId === 'lead-sarah' && seen[0].agentId === AGENT && seen[0].kind === 'advance_paid' && seen[0].advanceReceivedOn === '2026-09-18';
      answer = { status: 422, body: { ok: false, error: 'refused', code: 'no_fee' } };
      const out2 = await call(lp, 'post', '/:leadId/promote', { db: makeDb({}), vendor: V, agentId: AGENT, params: { leadId: 'lead-sarah' }, body: { kind: 'booking_confirmed' } });
      r.promoteRefusal = out2.status === 422 && out2.body.code === 'no_fee';
    }
    const cl = loadMutated(clientsRel, clientsFrom == null ? 'router.post(' : clientsFrom, clientsTo == null ? 'router.post(' : clientsTo, { [promoPath]: fakePromo }).mod;
    if (cl) {
      const pkgs = [{ id: 'pk-2', vendor_id: V.id, name: 'Photographs and film', description: '', line_items: [], total: null, deposit_pct: 30, middle_pct: 30, middle_enabled: true, delivery_basis: 'days', delivery_days: 45, deleted_at: null }];
      const base = () => makeDb({ leads: [], clients: [], vendor_packages: pkgs.map((x) => ({ ...x })), lead_packages: [] });
      r.directRoute = hasRoute(cl, 'post', '/direct');
      seen.length = 0; answer = { status: 200, body: { ok: true, promoted: { binder_id: 'b1' } } };
      const db = base();
      const yes = await quiet(() => call(cl, 'post', '/direct', { db, vendor: V, agentId: AGENT, body: { name: 'Meena', phone: '9811111111', wedding_date: '2026-12-10', package_id: 'pk-2', fee: 60000, advance_received: true, received_on: '2026-09-17', advance_amount: 1 } }));
      r.directYes = yes.status === 200 && db.tables.leads.length === 1 && db.tables.leads[0].source === 'direct' && db.tables.leads[0].state === 'new'
        && db.tables.lead_packages.length === 1 && db.tables.lead_packages[0].total === 60000
        && seen[0] && seen[0].kind === 'advance_paid' && seen[0].advanceReceivedOn === '2026-09-17' && seen[0].leadId === db.tables.leads[0].id;
      seen.length = 0;
      const db2 = base();
      const no = await quiet(() => call(cl, 'post', '/direct', { db: db2, vendor: V, agentId: AGENT, body: { name: 'Nisha', wedding_date: '2026-12-10', package_id: 'pk-2', fee: 60000, advance_received: false, received_on: '2026-09-01' } }));
      r.directNo = no.status === 200 && seen[0] && seen[0].kind === 'booking_confirmed' && seen[0].advanceReceivedOn === undefined;
      const db3 = base();
      const noOn = await call(cl, 'post', '/direct', { db: db3, vendor: V, agentId: AGENT, body: { name: 'Nisha', wedding_date: '2026-12-10', package_id: 'pk-2', advance_received: true } });
      r.f28 = noOn.status === 422 && noOn.body.field === 'received_on' && db3.tables.leads.length === 0;
      const db4 = base();
      const noFee = await quiet(() => call(cl, 'post', '/direct', { db: db4, vendor: V, agentId: AGENT, body: { name: 'Nisha', wedding_date: '2026-12-10', package_id: 'pk-2', advance_received: false } }));
      r.c5attach = noFee.status === 422 && noFee.body.error === 'saved_as_lead' && noFee.body.lead_id === db4.tables.leads[0].id && noFee.body.step === 'attach' && noFee.body.code === 'no_fee';
      answer = { status: 500, body: { ok: false, error: 'promotion_failed', step: 'invoice' } };
      const db5 = base();
      const pf = await quiet(() => call(cl, 'post', '/direct', { db: db5, vendor: V, agentId: AGENT, body: { name: 'Nisha', wedding_date: '2026-12-10', package_id: 'pk-2', fee: 1000, advance_received: false } }));
      r.c5promote = pf.status === 500 && pf.body.error === 'saved_as_lead' && pf.body.step === 'promote' && db5.tables.leads.length === 1;
      const db6 = makeDb({ leads: [], clients: [] }, { fail: (c) => (c.table === 'leads' && c.op === 'insert' ? { message: 'down' } : null) });
      const lf = await quiet(() => call(cl, 'post', '/direct', { db: db6, vendor: V, agentId: AGENT, body: { name: 'Nisha', wedding_date: '2026-12-10', package_id: 'pk-2', fee: 1000, advance_received: false } }));
      r.f29 = lf.status === 500 && lf.body.error === 'promotion_failed' && lf.body.step === 'lead';
      const bad = await call(cl, 'post', '/direct', { db: base(), vendor: V, agentId: AGENT, body: { name: 'N', wedding_date: '2026-12-10', package_id: 'pk-2' } });
      const bad2 = await call(cl, 'post', '/direct', { db: base(), vendor: V, agentId: AGENT, body: { name: 'Nisha', wedding_date: '10 Dec', package_id: 'pk-2' } });
      r.valid = bad.status === 422 && bad.body.field === 'name' && bad2.status === 422 && bad2.body.field === 'wedding_date';
    }
    return r;
  }
  sec('§7 the two doors');
  {
    const r = await safe(() => doorCells('src/api/vendor/leadPackages.js', 'src/api/vendor/clients.js'));
    ok(r.promoteRoute, '§7.1 POST /:leadId/promote exists on the lead package router');
    ok(r.promotePass, '§7.2 the promote door hands the lead, agent, kind and date to promoteLead');
    ok(r.promoteRefusal, '§7.3 the promote door passes a refusal through unchanged');
    ok(r.directRoute, '§7.4 POST /direct exists on the clients router');
    ok(r.directYes, '§7.5 a walk-in: lead created (source direct), package attached with the fee, advance_paid on the received date');
    ok(r.directNo, '§7.6 F28(b): advance "no" promotes booking_confirmed and ignores a stray date');
    ok(r.f28, '§7.7 F28(b): advance "yes" without a date is refused before any lead is written');
    ok(r.c5attach, '§7.8 C5: an attach refusal after the lead exists answers saved_as_lead with the lead id');
    ok(r.c5promote, '§7.9 C5: a promotion failure after the lead exists answers saved_as_lead');
    ok(r.f29, '§7.10 F29: a failure before any lead exists answers promotion_failed');
    ok(r.valid, '§7.11 a missing name or a bad date is a named 422');
  }

  async function moneyCells(router) {
    const r = {};
    if (!router) return r;
    const db = makeDb({
      invoices: [
        { id: 'inv-p', vendor_id: V.id, lead_package_id: 'lp1', amount_total: 1000, amount_paid: 300, state: 'advance_paid', deleted_at: null, invoice_number: 'N1' },
        { id: 'inv-l', vendor_id: V.id, lead_package_id: null, amount_total: 1000, amount_paid: 0, state: 'unpaid', deleted_at: null, invoice_number: 'N2' },
      ],
      payment_schedules: [
        { id: 'p1', invoice_id: 'inv-p', vendor_id: V.id, ordinal: 1, amount_due: 300, state: 'paid' },
        { id: 'p2', invoice_id: 'inv-p', vendor_id: V.id, ordinal: 2, amount_due: 300, state: 'pending', due_date: '2026-11-01' },
        { id: 'p3', invoice_id: 'inv-p', vendor_id: V.id, ordinal: 3, amount_due: 400, state: 'pending', due_date: '2027-01-01' },
      ],
    });
    const out = await quiet(() => call(router, 'post', '/invoices/:vendorId/:invoiceId/payments', { db, vendor: V, params: { vendorId: V.id, invoiceId: 'inv-p' }, body: { amount: 700 } }));
    const inv = db.tables.invoices[0];
    const today = require(P('src/lib/istDay.js')).istTodayStr(new Date());
    r.f17 = out.status === 200 && db.tables.payment_schedules[1].state === 'paid' && db.tables.payment_schedules[1].paid_amount === 300
      && String(db.tables.payment_schedules[1].paid_at).startsWith(today) && db.tables.payment_schedules[2].state === 'pending'
      && inv.amount_paid === 600 && inv.due_date === '2027-01-01';
    const out2 = await quiet(() => call(router, 'post', '/invoices/:vendorId/:invoiceId/payments', { db, vendor: V, params: { vendorId: V.id, invoiceId: 'inv-l' }, body: { amount: 250 } }));
    r.legacy = out2.status === 200 && db.tables.invoices[1].amount_paid === 250 && db.tables.invoices[1].state === 'advance_paid';
    return r;
  }
  sec('§8 F17 on the money door');
  {
    const r = await safe(() => moneyCells(tryRequire('src/api/vendor/money.js')));
    ok(r.f17, '§8.1 F17: mark-paid on a package invoice pays the next milestone, its own amount, today; the body figure is ignored');
    ok(r.legacy, '§8.2 any other invoice keeps recordPayment with the body figure');
  }

  sec('§9 the engine export');
  {
    const ts = readIf('src/engine/src/core/tools/recordPrimitives.ts');
    let dist = null; try { dist = require(P('src/engine/dist/core/tools/recordPrimitives.js')); } catch { /* reported */ }
    ok(/export async function openRecordWithId\(/.test(ts), '§9.1 recordPrimitives.ts exports openRecordWithId');
    ok(!!dist && typeof dist.openRecordWithId === 'function', '§9.2 the built engine carries it (npm run build)');
    ok(!!dist && !dist.RECORD_TOOLS.some((t) => /openRecord/i.test(t.name)) && !/openRecordWithId/.test((ts.match(/RECORD_TOOLS[\s\S]*?\];/) || [''])[0]), '§9.3 no tool schema names it (door-only)');
    let refused = null; if (dist && typeof dist.openRecordWithId === 'function') refused = await dist.openRecordWithId(AGENT, 'not-a-uuid', { client: 'x' }, 'x');
    ok(!!refused && /^ERROR/.test(refused.display), '§9.4 a non-uuid id is refused before any write');
  }

  sec('§10 column existence (R-40.80)');
  {
    const pub = readIf('docs/db/PUBLIC_SCHEMA.md');
    const engDoc = readIf('docs/db/ENGINE_SCHEMA.md');
    const block = (doc, name) => { const i = doc.indexOf(`## ${name}  ·`); if (i < 0) return ''; const j = doc.indexOf('\n## ', i + 5); return doc.slice(i, j < 0 ? undefined : j); };
    const has = (doc, t, cols) => { const b2 = block(doc, t); return !!b2 && cols.every((c) => new RegExp(`^\\d+\\. ${c} `, 'm').test(b2)); };
    ok(has(pub, 'public.leads', ['id', 'vendor_id', 'name', 'phone', 'wedding_date', 'state', 'updated_at', 'deleted_at', 'wedding_date_precision', 'binder_id', 'source']), '§10.1 public.leads columns read and written');
    ok(has(pub, 'public.lead_packages', ['id', 'vendor_id', 'lead_id', 'snapshot', 'total', 'schedule', 'delivery_on', 'deleted_at']), '§10.2 public.lead_packages columns read');
    ok(has(pub, 'public.invoices', ['binder_id', 'lead_package_id', 'lead_id', 'amount_advance', 'due_date', 'has_schedule', 'deleted_at', 'amount_paid', 'state']), '§10.3 public.invoices columns written');
    ok(has(pub, 'public.payment_schedules', ['invoice_id', 'vendor_id', 'milestone_label', 'pct', 'amount_due', 'due_date', 'state', 'paid_at', 'paid_amount', 'ordinal']), '§10.4 public.payment_schedules columns written');
    ok(has(pub, 'public.events', ['linked_lead_id', 'linked_binder_id', 'state', 'deleted_at', 'vendor_id']), '§10.5 public.events columns read');
    ok(has(engDoc, 'engine.records', ['id', 'agent_id', 'amount', 'client', 'date', 'direction', 'phone', 'stage', 'hidden', 'amount_received', 'amount_pending', 'payment_status']), '§10.6 engine.records columns read and written');
    ok(/uq_invoices_lead_package[\s\S]{0,200}lead_package_id IS NOT NULL/.test(pub) && /uq_leads_binder_id[\s\S]{0,160}binder_id IS NOT NULL/.test(pub), '§10.7 the two unique indexes the act leans on are witnessed');
    ok(/payment_schedules_state_check[\s\S]{0,120}'pending'::text, 'paid'::text/.test(pub), '§10.8 the milestone states written are the CHECK\'s');
  }

  sec('§11 mutations of production code');
  const M = [
    ['src/lib/vendor/bookedLeads.js', "if (r && typeof r.binder_id === 'string' && r.binder_id) ids.add(r.binder_id);", 'if (r) ids.add(r.binder_id);',
      async (m) => !(await bookedCells(m)).equal, 'M1 null binder ids kept → §1.1 RED'],
    ['src/lib/vendor/bookedLeads.js', ".eq('state', 'booked')", '', async (m) => !(await bookedCells(m)).exact, 'M2 the booked filter dropped → §1.2 RED'],
    ['src/lib/vendor/promotion.js', '&& nameKey(r.client) === nk', '', async (m) => !(await promotionCells(m)).notAdopted, 'M3 adoption on phone alone → §6.19 RED'],
    ['src/lib/vendor/promotion.js', "if (lead.state !== 'booked') {", 'if (false) {', async (m) => !(await promotionCells(m)).bookedAfter, 'M4 the lead never booked → §6.5 RED'],
    ['src/lib/vendor/promotion.js', 'else if (r && r.conflict) event = { refused: r.conflict };', "else if (r && r.conflict) return failed('event', 'conflict', ctx);", async (m) => !(await promotionCells(m)).choice1, 'M5 a calendar refusal made fatal → §6.21 RED'],
    ['src/lib/vendor/promotion.js', "? advanceReceivedOn : (r.due_on || null)", '? (r.due_on || null) : (r.due_on || null)', async (m) => !(await promotionCells(m)).deposit, 'M6 the deposit keeps the attach date → §6.10 RED'],
    ['src/lib/vendor/promotion.js', "if (made.code === '23505') {", 'if (false) {', async (m) => !(await promotionCells(m)).race, 'M7 the invoice race not re-read → §6.23 RED'],
    ['src/lib/vendor/promotion.js', '.eq(\'id\', leadId).eq(\'vendor_id\', vendorId).is(\'binder_id\', null)', ".eq('id', leadId).eq('vendor_id', vendorId)", async (m) => !(await promotionCells(m)).reserveFirst, 'M8 the reservation loses WHERE binder_id IS NULL → §6.2 RED'],
    ['src/lib/vendor/promotion.js', 'if (empty(binder.amount_received)) edit.amount_received = money.received;', 'edit.amount_received = money.received; edit.amount = money.total;', async (m) => !(await promotionCells(m)).choice4, 'M9 money written over a filled cell → §6.18 RED'],
    ['src/lib/vendor/schedules.js', 'amounts.push(t - used); return;', 'amounts.push(Math.round((t * Number(m.pct)) / 100)); return;', async (m) => !(await scheduleCells(m)).remainder, 'M10 the last milestone rounded, not computed → §4.1 RED'],
    ['src/lib/vendor/schedules.js', 'due_date:    next ? next.due_date : null,', '', async (m) => !(await scheduleCells(m)).dueMoved, 'M11 due_date not moved → §4.7 RED'],
    ['src/lib/vendor/schedules.js', 'if (inv && inv.lead_package_id)', 'if (false)', async (m) => !(await scheduleCells(m)).f16, 'M12 F16 guard removed → §4.15 RED'],
    ['src/lib/vendor/schedules.js', "if (!mirrorEnabled(deps.env)) return { mirrored: false, reason: 'off' };", '', async (m) => !(await scheduleCells(m)).mirrorGate, 'M13 the mirror ignores its flag → §4.17 RED'],
    ['src/lib/vendor/invoices.js', 'lead_package_id: lead_package_id || null,', '', async (m) => !(await invoiceLibCells(m)).links, 'M14 lead_package_id not inserted → §5.1 RED'],
    ['src/api/vendor/invoices.js', 'if (pkgInvoice) {', 'if (false) {', async (m) => !(await f4Cells(m)).served, 'M15 F4 removed → §5.4 RED'],
    ['src/api/vendor/money.js', 'if (pkg.handled) {', 'if (false) {', async (m) => !(await moneyCells(m)).f17, 'M16 F17 bypassed on the money door → §8.1 RED'],
    ['src/api/vendor/schedules.js', ".select('id, invoice_id').eq('id', req.params.milestoneId).eq('vendor_id', vendorId).maybeSingle();", ".select('id, invoice_id, vendor_id').eq('id', req.params.milestoneId).maybeSingle();", async (m) => !(await patchDoorCells(m)).scope, 'M17 the milestone read unscoped → §4b.3 RED'],
    ['src/api/vendor/schedules.js', 'if (last.id !== ms.id && Number(last.amount_due) !== lastAmount) lastPatch', 'if (false) lastPatch', async (m) => !(await patchDoorCells(m)).f7, 'M18 the remainder not moved on PATCH → §4b.2 RED'],
    ['src/api/vendor-engine/cabinet.js', 'const isClientBinder = (b) => bookedLeads.ids.has(b.id) || isClientStage(b);', 'const isClientBinder = (b) => isClientStage(b);', async (m) => !(await slicerCells(m, null)).cabClient, 'M19 Clients ignores the booked lead → §2.1 RED'],
    ['src/api/vendor-engine/today.js', 'const isClientBinder = (b) => bookedLeads.ids.has(b.id) || isClientStage(b);', 'const isClientBinder = (b) => isClientStage(b);', async (m) => !(await slicerCells(null, m)).todayOut, 'M20 Today ignores the booked lead → §2.5 RED'],
    ['src/lib/vendor/bookingEvent.js', '&& ((bookedIds && bookedIds.has(row.id)) || isBookingStage(row.stage));', '&& isBookingStage(row.stage);', async (m) => !(await seamCells(m)).withSet, 'M21 the seam ignores the booked lead → §3.1 RED'],
  ];
  for (const [rel, from, to, bites, name] of M) {
    const lm = loadMutated(rel, from, to);
    if (!lm.mod) { ok(false, `§11 ${name} (anchor missing or did not load)`); continue; }
    let bit = false;
    try { bit = await quiet(() => bites(lm.mod)); } catch (e) { bit = false; }
    ok(bit, `§11 ${name}`);
  }
  // the two door mutations need the promotion override, so they run through doorCells
  {
    const d1 = await safe(() => doorCells('src/api/vendor/leadPackages.js', 'src/api/vendor/clients.js', "kind: advance ? 'advance_paid' : 'booking_confirmed',", "kind: 'booking_confirmed',"));
    ok(readIf('src/api/vendor/clients.js').includes("kind: advance ? 'advance_paid' : 'booking_confirmed',") && d1.directRoute === true && !d1.directYes, '§11 M22 the walk-in always booking_confirmed → §7.5 RED');
    const d2 = await safe(() => doorCells('src/api/vendor/leadPackages.js', 'src/api/vendor/clients.js', "if (advance && !isDateKey(b.received_on)) return res.status(422).json({ ok: false, error: 'invalid', field: 'received_on' });", ''));
    ok(d2.directRoute === true && !d2.f28, '§11 M23 F28(b) date gate removed → §7.7 RED');
  }

  console.log(`\n════════  b83_lc2_p3_promotion_bench: ${pass} passed, ${fail} failed  ════════\n`);
  if (fail) { console.log('RED. Failing checks:'); for (const f of fails) console.log(`   · ${f}`); process.exit(1); }
  process.exit(0);
})().catch((e) => { console.error('BENCH ERROR', e); process.exit(2); });
