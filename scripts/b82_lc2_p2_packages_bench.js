#!/usr/bin/env node
'use strict';
// scripts/b82_lc2_p2_packages_bench.js — TDW CE-43 · LC-2 · packet 2 (dream-os) · the package's money,
// its writes, and the package on a lead. Rung b82, chair-allocated. Runnable from any directory.
// Exit 0 green, 1 red, 2 bench error.
//
//   §1 computeSchedule / splitShares (src/lib/vendor/packageSchedule.js), driven: C-43.2 to C-43.4,
//      F10, F19, F20, F21, F24, F25, F26, with an arithmetic sweep for the remainder invariant.
//   §2 validatePackage (src/api/vendor/packages.js): 0168's CHECKs as named refusals.
//      P2b adds §2.9, §3.6b and M15 for F-43.78 (the middle share ignored when the switch is off).
//   §3 the Packages writes, the real handlers over a database double that enforces 0168's three
//      unique indexes on insert AND update, as Postgres does.
//   §4 the lead's package (src/api/vendor/leadPackages.js): attach, edits, re-attach, refusals, read.
//   §5 the mount order in core.js.
//   §6 column existence against docs/db/PUBLIC_SCHEMA.md (R-40.80).
//   §7 mutations of production code, compiled in memory under their real paths.
//
// NOT PROVEN HERE (declared): the real database. The double models the constraints this door
// relies on; the founder's walk and SELECTs are the database witness.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-dummy-key';
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

// Compile a production file with one textual mutation, under its real path. Modules it requires
// resolve normally; `overrides` swaps a required module (by resolved path) for the mutated one.
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

// ── the database double ─────────────────────────────────────────────────────────────────────
function makeDb(seed = {}, opts = {}) {
  const tables = {};
  for (const [k, v] of Object.entries(seed)) tables[k] = v.map((r) => ({ ...r }));
  let nextId = 1;
  const calls = [];
  const live = (r) => r.deleted_at == null;
  function violates(table, rows) {
    const t = tables[table] || [];
    const all = [...t, ...rows.filter((r) => !t.includes(r))];
    if (table === 'vendor_packages') {
      const defaults = all.filter((r) => r.is_default && live(r));
      const byVendor = {};
      for (const r of defaults) { byVendor[r.vendor_id] = (byVendor[r.vendor_id] || 0) + 1; if (byVendor[r.vendor_id] > 1) return 'uq_vendor_packages_default'; }
      const seen = new Set();
      for (const r of all) if (r.seeded_from) { const k = `${r.vendor_id}|${r.seeded_from}`; if (seen.has(k)) return 'uq_vendor_packages_seed'; seen.add(k); }
    }
    if (table === 'lead_packages') {
      const seen = new Set();
      for (const r of all.filter(live)) { if (seen.has(r.lead_id)) return 'uq_lead_packages_live'; seen.add(r.lead_id); }
    }
    return null;
  }
  function from(table) {
    const st = { op: 'select', filters: [], rows: null, patch: null, limit: null, single: false, maybe: false, returning: false };
    const b = {
      select() { if (st.op !== 'select') st.returning = true; return b; },
      eq(c, v) { st.filters.push((r) => r[c] === v); return b; },
      neq(c, v) { st.filters.push((r) => r[c] !== v); return b; },
      is(c, v) { st.filters.push((r) => (v === null ? r[c] == null : r[c] === v)); return b; },
      not(c, o, v) { if (o === 'is' && v === null) st.filters.push((r) => r[c] != null); return b; },
      limit(n) { st.limit = n; return b; },
      insert(rows) { st.op = 'insert'; st.rows = Array.isArray(rows) ? rows : [rows]; return b; },
      update(patch) { st.op = 'update'; st.patch = patch; return b; },
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
      calls.push({ table, op: st.op, patch: st.patch });
      const t = tables[table] || (tables[table] = []);
      const hook = opts.fail && opts.fail({ table, op: st.op, patch: st.patch, rows: st.rows });
      if (hook) return { data: null, error: hook };
      if (st.op === 'insert') {
        const stamp = '2026-09-17T10:00:00Z';
        const made = st.rows.map((r) => ({ id: `${table.slice(0, 2)}${nextId++}`, created_at: stamp, updated_at: stamp, deleted_at: null, ...r }));
        const bad = violates(table, made);
        if (bad) return { data: null, error: { code: '23505', message: `duplicate key value violates unique constraint "${bad}"` } };
        t.push(...made);
        return st.returning ? shape(made) : { data: null, error: null };
      }
      let rows = t.filter((r) => st.filters.every((f) => f(r)));
      if (st.op === 'update') {
        const before = rows.map((r) => ({ ...r }));
        rows.forEach((r) => Object.assign(r, st.patch));
        const bad = violates(table, []);
        if (bad) { rows.forEach((r, i) => { for (const k of Object.keys(r)) delete r[k]; Object.assign(r, before[i]); }); return { data: null, error: { code: '23505', message: `duplicate key value violates unique constraint "${bad}"` } }; }
        return st.returning ? shape(rows) : { data: null, error: null };
      }
      rows = rows.slice().reverse();
      if (st.limit != null) rows = rows.slice(0, st.limit);
      return shape(rows);
    }
    return b;
  }
  return { from, tables, calls };
}

// Drive a real route's LAST handler (auth and resolveVendor are the estate's, proven elsewhere;
// vendor scoping inside the handlers is what these cells prove).
async function call(router, method, routePath, { db, vendor, params = {}, body = {} }) {
  const layer = router.stack.find((l) => l.route && l.route.path === routePath && l.route.methods[method]);
  if (!layer) throw new Error(`no ${method} ${routePath}`);
  const h = layer.route.stack[layer.route.stack.length - 1].handle;
  let status = 200, out = null;
  const res = { status(s) { status = s; return res; }, json(b) { out = b; return res; } };
  const req = { app: { locals: { supabase: db } }, vendor, params, body, query: {} };
  await new Promise((resolve, reject) => { Promise.resolve(h(req, res, (e) => (e ? reject(e) : resolve()))).then(() => setImmediate(resolve), reject); });
  return { status, body: out };
}

const V = { id: 'v-dev440', category: 'photography' };
const OTHER = { id: 'v-other', category: 'decor' };
const TODAY = '2026-09-17';

function scheduleCells(S) {
  const r = {};
  try {
    const base = { deposit_pct: 30, middle_pct: 30, middle_enabled: true, delivery_basis: 'days', delivery_days: 45, wedding_date: '2026-12-22', wedding_date_precision: 'day', today: TODAY };
    const a = S.computeSchedule({ ...base, total: 80000 });
    r.shape = a.ok && JSON.stringify(a.rows) === JSON.stringify([
      { kind: 'deposit', pct: 30, amount: 24000, due_on: '2026-09-17' },
      { kind: 'middle', pct: 30, amount: 24000, due_on: '2026-11-22' },
      { kind: 'final', pct: 40, amount: 32000, due_on: '2027-02-05' },
    ]) && a.delivery_on === '2027-02-05' && a.tells.join() === 'counted_from_wedding';
    const b = S.computeSchedule({ ...base, total: 100001 });
    r.remainder = b.ok && b.rows.map((x) => x.amount).join() === '30000,30000,40001';
    const c = S.computeSchedule({ ...base, total: 5 });
    r.halfUp = c.ok && c.rows.map((x) => x.amount).join() === '2,2,1';
    r.clamp = S.monthBefore('2027-03-31') === '2027-02-28' && S.monthBefore('2028-03-31') === '2028-02-29' && S.monthBefore('2027-01-15') === '2026-12-15';
    const d = S.computeSchedule({ ...base, total: 80000, wedding_date: '2026-10-10' });
    r.fold = d.ok && d.rows.length === 2 && d.rows[1].kind === 'final' && d.rows[1].pct === 70 && d.rows[1].amount === 56000 && d.tells.includes('middle_folded');
    const e = S.computeSchedule({ ...base, total: 80000, wedding_date: '2026-10-17' });
    r.foldBoundary = e.ok && e.rows.length === 2 && e.tells.includes('middle_folded');
    const e2 = S.computeSchedule({ ...base, total: 80000, wedding_date: '2026-10-18' });
    r.noFoldNextDay = e2.ok && e2.rows.length === 3 && e2.rows[1].due_on === '2026-09-18';
    const f = S.computeSchedule({ ...base, total: 80000, middle_enabled: false });
    r.middleOff = f.ok && f.rows.map((x) => `${x.kind}:${x.pct}:${x.amount}`).join() === 'deposit:30:24000,final:70:56000' && !f.tells.includes('middle_folded');
    const g = S.computeSchedule({ ...base, total: 80000, delivery_basis: 'on_the_day', delivery_days: null });
    r.onTheDay = g.ok && g.rows[2].due_on === '2026-12-22' && g.tells.length === 0;
    const h1 = S.computeSchedule({ ...base, total: 80000, delivery_basis: 'handover', delivery_days: null });
    const h2 = S.computeSchedule({ ...base, total: 80000, delivery_basis: 'handover', delivery_days: null, delivery_on: '2026-12-15' });
    r.handover = !h1.ok && h1.code === 'no_handover_date' && h2.ok && h2.rows[2].due_on === '2026-12-15';
    r.noFee = ['no_fee', 'no_fee', 'no_fee'].join() === [null, 0, 1.5].map((t) => S.computeSchedule({ ...base, total: t }).code).join();
    r.noDate = S.computeSchedule({ ...base, total: 80000, wedding_date: null }).code === 'no_wedding_date';
    r.precision = S.computeSchedule({ ...base, total: 80000, wedding_date_precision: 'month' }).code === 'no_wedding_date'
      && S.computeSchedule({ ...base, total: 80000, wedding_date_precision: 'year' }).code === 'no_wedding_date'
      && S.computeSchedule({ ...base, total: 80000, wedding_date_precision: null }).ok === true;
    const k = S.computeSchedule({ ...base, total: 80000, deposit_pct: 40, middle_pct: 20 });
    r.ownShares = k.ok && k.rows.map((x) => x.pct).join() === '40,20,40' && k.rows.map((x) => x.amount).join() === '32000,16000,32000';
    const s1 = S.splitShares({ total: null, deposit_pct: 30, middle_pct: 30, middle_enabled: true });
    const s2 = S.splitShares({ total: 80000, deposit_pct: 30, middle_pct: 30, middle_enabled: true });
    const s3 = S.splitShares({ total: null, deposit_pct: 30, middle_pct: 30, middle_enabled: false });
    r.split = s1.map((x) => `${x.pct}:${x.amount}`).join() === '30:null,30:null,40:null'
      && s2.map((x) => `${x.pct}:${x.amount}`).join() === '30:24000,30:24000,40:32000'
      && s3.map((x) => `${x.kind}:${x.pct}`).join() === 'deposit:30,final:70'
      && s2.every((x) => !('due_on' in x));
    let sweep = true;
    for (let tot = 1; tot <= 3001 && sweep; tot += 37) {
      for (const [dp, mp] of [[30, 30], [33, 33], [1, 1], [49, 49], [99, 1], [10, 89]]) {
        for (const me of [true, false]) {
          if (dp + (me ? mp : 0) >= 100) continue;
          const x = S.computeSchedule({ ...base, total: tot, deposit_pct: dp, middle_pct: mp, middle_enabled: me });
          const y = S.splitShares({ total: tot, deposit_pct: dp, middle_pct: mp, middle_enabled: me });
          if (!x.ok || x.rows.reduce((s, q) => s + q.amount, 0) !== tot || x.rows.some((q) => !Number.isInteger(q.amount))
            || x.rows.reduce((s, q) => s + q.pct, 0) !== 100 || y.reduce((s, q) => s + q.amount, 0) !== tot) { sweep = false; break; }
        }
      }
    }
    r.sweep = sweep;
  } catch (e) { r.err = e.message; }
  return r;
}

function validateCells(validatePackage) {
  const good = { name: 'Photographs', description: '', line_items: [{ label: 'Team', detail: '2 photographers' }], total: null, deposit_pct: 30, middle_pct: 30, middle_enabled: true, delivery_basis: 'days', delivery_days: 45 };
  const f = (o) => { const v = validatePackage({ ...good, ...o }); return v.ok ? 'ok' : v.field; };
  return {
    good: f({}) === 'ok' && validatePackage({ ...good, name: '  Trimmed  ' }).row.name === 'Trimmed',
    name: f({ name: '   ' }) === 'name',
    total: f({ total: 0 }) === 'total' && f({ total: 1.5 }) === 'total' && f({ total: '100' }) === 'total' && f({ total: 90000 }) === 'ok',
    pcts: f({ deposit_pct: 0 }) === 'deposit_pct' && f({ deposit_pct: 100 }) === 'deposit_pct' && f({ middle_pct: 99 }) === 'middle_pct',
    remainder: f({ deposit_pct: 70, middle_pct: 30 }) === 'remainder' && f({ deposit_pct: 70, middle_pct: 29 }) === 'ok' && f({ deposit_pct: 70, middle_pct: 30, middle_enabled: false }) === 'ok',
    pairing: f({ delivery_days: null }) === 'delivery_days' && validatePackage({ ...good, delivery_basis: 'on_the_day', delivery_days: 9 }).row.delivery_days === null,
    basis: f({ delivery_basis: 'later' }) === 'delivery_basis',
    items: f({ line_items: [{ label: 'Team', detail: ' ' }] }) === 'line_items' && f({ line_items: {} }) === 'line_items',
    // F-43.78 (P2b): middle off → the share is not a refusal; the fallback is stored.
    middleOff: (() => {
      const a = validatePackage({ ...good, middle_enabled: false, middle_pct: null });
      const b = validatePackage({ ...good, middle_enabled: false, middle_pct: 0 }, 45);
      return a.ok && a.row.middle_pct === 30 && b.ok && b.row.middle_pct === 45
        && f({ middle_enabled: true, middle_pct: null }) === 'middle_pct' && f({ middle_enabled: true, middle_pct: 0 }) === 'middle_pct';
    })(),
  };
}

async function writeCells(router) {
  const r = {};
  try {
    const db = makeDb();
    const add = await call(router, 'post', '/', { db, vendor: V, body: { name: 'Pre-wedding shoot', total: 50000, delivery_basis: 'on_the_day', vendor_id: 'v-other', is_default: true } });
    const pk = db.tables.vendor_packages;
    r.addSeedsFirst = add.status === 200 && pk.filter((x) => x.seeded_from).length === 3 && pk.length === 4;
    const mine = pk.find((x) => x.name === 'Pre-wedding shoot');
    r.addSafe = !!mine && mine.vendor_id === V.id && mine.is_default === false && mine.seeded_from === null
      && add.body.package.split.map((x) => x.amount).join() === '15000,15000,20000';
    const bad = await call(router, 'post', '/', { db, vendor: V, body: { name: 'x', deposit_pct: 80, middle_pct: 30 } });
    r.addRefuses = bad.status === 422 && bad.body.field === 'remainder' && pk.length === 4;

    const seed1 = pk.find((x) => x.seeded_from === 'photography:1');
    const ed = await call(router, 'patch', '/:id', { db, vendor: V, params: { id: seed1.id }, body: { name: 'Photographs, one day', total: 60000, seeded_from: 'x', vendor_id: 'v-other' } });
    r.patch = ed.status === 200 && seed1.name === 'Photographs, one day' && seed1.total === 60000 && seed1.seeded_from === 'photography:1' && seed1.vendor_id === V.id
      && seed1.line_items.length === 5 && ed.body.package.split[0].amount === 18000;
    const ed2 = await call(router, 'patch', '/:id', { db, vendor: V, params: { id: seed1.id }, body: { deposit_pct: 75 } });
    r.patchMerged = ed2.status === 422 && ed2.body.field === 'remainder' && seed1.deposit_pct === 30;
    const off = await call(router, 'patch', '/:id', { db, vendor: V, params: { id: seed1.id }, body: { middle_enabled: false, middle_pct: null } });
    r.patchMiddleOff = off.status === 200 && seed1.middle_enabled === false && seed1.middle_pct === 30
      && off.body.package.split.map((x) => x.kind).join() === 'deposit,final';
    await call(router, 'patch', '/:id', { db, vendor: V, params: { id: seed1.id }, body: { middle_enabled: true } });
    const theirs = await call(router, 'patch', '/:id', { db, vendor: OTHER, params: { id: seed1.id }, body: { name: 'Stolen' } });
    r.patchScoped = theirs.status === 404 && seed1.name === 'Photographs, one day';

    const seed2 = pk.find((x) => x.seeded_from === 'photography:2');
    const seed3 = pk.find((x) => x.seeded_from === 'photography:3');
    const df = await call(router, 'post', '/:id/default', { db, vendor: V, params: { id: seed3.id } });
    r.setDefault = df.status === 200 && seed3.is_default === true && seed2.is_default === false && pk.filter((x) => x.is_default).length === 1;

    const del = await call(router, 'delete', '/:id', { db, vendor: V, params: { id: seed3.id } });
    r.softDelete = del.status === 200 && seed3.deleted_at != null && seed3.is_default === false && pk.includes(seed3);
    const del2 = await call(router, 'delete', '/:id', { db, vendor: V, params: { id: seed3.id } });
    const edDeleted = await call(router, 'patch', '/:id', { db, vendor: V, params: { id: seed3.id }, body: { name: 'Back' } });
    r.deletedGone = del2.status === 404 && edDeleted.status === 404;
    const list = await call(router, 'get', '/', { db, vendor: V });
    r.listSplit = list.body.packages.length === 3 && list.body.packages.every((p) => Array.isArray(p.split))
      && list.body.packages.find((p) => p.id === seed2.id).split.every((x) => x.amount === null);

    // The race: a second live default appears between the clear and the set.
    const rdb = makeDb({ vendor_packages: [
      { id: 'a', vendor_id: V.id, name: 'A', is_default: true, deleted_at: null, seeded_from: null, line_items: [], deposit_pct: 30, middle_pct: 30, middle_enabled: true, delivery_basis: 'on_the_day', delivery_days: null },
      { id: 'b', vendor_id: V.id, name: 'B', is_default: false, deleted_at: null, seeded_from: null, line_items: [], deposit_pct: 30, middle_pct: 30, middle_enabled: true, delivery_basis: 'on_the_day', delivery_days: null },
      { id: 'c', vendor_id: V.id, name: 'C', is_default: false, deleted_at: null, seeded_from: null, line_items: [], deposit_pct: 30, middle_pct: 30, middle_enabled: true, delivery_basis: 'on_the_day', delivery_days: null },
    ] }, { fail: ({ table, op, patch }) => {
      if (table === 'vendor_packages' && op === 'update' && patch && patch.is_default === true) {
        rdb.tables.vendor_packages.find((x) => x.id === 'c').is_default = true;   // the other writer lands
      }
      return null;
    } });
    const race = await call(router, 'post', '/:id/default', { db: rdb, vendor: V, params: { id: 'b' } });
    const updatesToTrue = rdb.calls.filter((c) => c.op === 'update' && c.patch && c.patch.is_default === true).length;
    r.race = race.status === 409 && race.body.error === 'default_race' && updatesToTrue === 1;
  } catch (e) { r.err = e.message; }
  return r;
}

const LEAD = { id: 'lead-sarah', vendor_id: V.id, wedding_date: '2026-12-22', wedding_date_precision: 'day', deleted_at: null };
function pkgRow(o) {
  return { id: 'pkg-film', vendor_id: V.id, name: 'Photographs and film', description: 'We photograph and film.', line_items: [{ label: 'Team', detail: '2 photographers' }], total: null, deposit_pct: 30, middle_pct: 30, middle_enabled: true, delivery_basis: 'days', delivery_days: 45, is_default: true, seeded_from: 'photography:2', deleted_at: null, ...o };
}

async function attachCells(router) {
  const r = {};
  try {
    const db = makeDb({ leads: [LEAD, { ...LEAD, id: 'lead-month', wedding_date_precision: 'month' }, { ...LEAD, id: 'lead-theirs', vendor_id: OTHER.id }],
      vendor_packages: [pkgRow({}), pkgRow({ id: 'pkg-set', name: 'Photographs', total: 90000, seeded_from: 'photography:1', is_default: false }),
        pkgRow({ id: 'pkg-gone', deleted_at: '2026-09-16T00:00:00Z', is_default: false, seeded_from: 'photography:3' }),
        pkgRow({ id: 'pkg-jewel', delivery_basis: 'handover', delivery_days: null, total: 70000, is_default: false, seeded_from: null })] });
    const film = db.tables.vendor_packages[0];
    const before = JSON.stringify(film);

    const nofee = await call(router, 'post', '/:leadId/package', { db, vendor: V, params: { leadId: 'lead-sarah' }, body: { package_id: 'pkg-film' } });
    r.noFee = nofee.status === 422 && nofee.body.code === 'no_fee' && !(db.tables.lead_packages || []).length;

    const a = await call(router, 'post', '/:leadId/package', { db, vendor: V, params: { leadId: 'lead-sarah' }, body: { package_id: 'pkg-film', total: 80000, name: 'Film for Sarah', line_items: [{ label: 'Team', detail: '3 photographers' }] } });
    const row = a.body && a.body.lead_package;
    r.attach = a.status === 200 && row.total === 80000 && row.snapshot.name === 'Film for Sarah' && row.snapshot.line_items[0].detail === '3 photographers'
      && row.snapshot.source_package_id === 'pkg-film' && row.snapshot.source_seeded_from === 'photography:2'
      && row.schedule.map((x) => x.amount).join() === '24000,24000,32000' && row.schedule[0].due_on.length === 10 && row.delivery_on === '2027-02-05';
    r.packageUntouched = JSON.stringify(film) === before;

    const b = await call(router, 'post', '/:leadId/package', { db, vendor: V, params: { leadId: 'lead-sarah' }, body: { package_id: 'pkg-set' } });
    const lp = db.tables.lead_packages;
    r.reattach = b.status === 200 && lp.length === 2 && lp.filter((x) => x.deleted_at == null).length === 1
      && lp.find((x) => x.deleted_at == null).total === 90000 && lp[0].deleted_at != null;
    const got = await call(router, 'get', '/:leadId/package', { db, vendor: V, params: { leadId: 'lead-sarah' } });
    r.read = got.status === 200 && got.body.lead_package.package_id === 'pkg-set';
    const none = await call(router, 'get', '/:leadId/package', { db, vendor: V, params: { leadId: 'lead-month' } });
    r.readNone = none.status === 200 && none.body.lead_package === null;

    const month = await call(router, 'post', '/:leadId/package', { db, vendor: V, params: { leadId: 'lead-month' }, body: { package_id: 'pkg-set' } });
    r.monthDate = month.status === 422 && month.body.code === 'no_wedding_date';
    const jw = await call(router, 'post', '/:leadId/package', { db, vendor: V, params: { leadId: 'lead-sarah' }, body: { package_id: 'pkg-jewel' } });
    const jw2 = await call(router, 'post', '/:leadId/package', { db, vendor: V, params: { leadId: 'lead-sarah' }, body: { package_id: 'pkg-jewel', delivery_on: '2026-12-15' } });
    r.handover = jw.status === 422 && jw.body.code === 'no_handover_date' && jw2.status === 200 && jw2.body.lead_package.delivery_on === '2026-12-15';
    // ── LABELED AMENDMENT (CE-44, LC-2t, packet 5, F-44.6). RE-AIMED, TEETH KEPT,
    // COUNT PRESERVED, RATIFY-OR-REVERT. The founder walked the gap this cell used to
    // guard: "the change package button does not give an option of altering the
    // payment schedule." The five shape fields are now per-couple, so `deposit_pct`
    // is accepted where it was refused. THE SUBJECT IS UNTOUCHED — this cell has
    // always asserted that the accept-list is CLOSED and that a key outside it is
    // refused by name, and it still does, on a key that is outside it in both worlds.
    const unk = await call(router, 'post', '/:leadId/package', { db, vendor: V, params: { leadId: 'lead-sarah' }, body: { package_id: 'pkg-set', not_a_field: 1 } });
    r.onlyEdits = unk.status === 422 && unk.body.field === 'not_a_field';
    const gone = await call(router, 'post', '/:leadId/package', { db, vendor: V, params: { leadId: 'lead-sarah' }, body: { package_id: 'pkg-gone' } });
    r.deletedPackage = gone.status === 422 && gone.body.field === 'package_id';
    const theirs = await call(router, 'post', '/:leadId/package', { db, vendor: V, params: { leadId: 'lead-theirs' }, body: { package_id: 'pkg-set' } });
    r.scoped = theirs.status === 404;

    // The named half-failure: the live row cleared, the insert refused.
    const hdb = makeDb({ leads: [LEAD], vendor_packages: [pkgRow({ total: 80000 })], lead_packages: [{ id: 'lp-old', vendor_id: V.id, lead_id: 'lead-sarah', deleted_at: null }] },
      { fail: ({ table, op }) => (table === 'lead_packages' && op === 'insert' ? { code: 'XX000', message: 'insert broke' } : null) });
    const hf = await call(router, 'post', '/:leadId/package', { db: hdb, vendor: V, params: { leadId: 'lead-sarah' }, body: { package_id: 'pkg-film' } });
    r.halfFailure = hf.status === 500 && hdb.tables.lead_packages.length === 1 && hdb.tables.lead_packages[0].deleted_at != null;
  } catch (e) { r.err = e.message; }
  return r;
}

async function main() {
  const S = tryRequire('src/lib/vendor/packageSchedule.js');
  const pkgs = tryRequire('src/api/vendor/packages.js');
  const lps = tryRequire('src/api/vendor/leadPackages.js');

  sec('§1 · computeSchedule and splitShares');
  const s = S ? scheduleCells(S) : { err: 'no packageSchedule' };
  if (s.err) console.log(`  (${s.err})`);
  ok(s.shape === true, '§1.1 80,000 at 30/30, days 45: 24,000 today · 24,000 on 22 November · 32,000 on 5 February, counted from the wedding');
  ok(s.remainder === true, '§1.2 C-43.2: 1,00,001 → 30,000 · 30,000 · 40,001, the remainder absorbs');
  ok(s.halfUp === true, '§1.3 F20: half up (5 at 30% → 2)');
  ok(s.clamp === true, '§1.4 one calendar month before, clamped (31 March → 28 or 29 February; January → December)');
  ok(s.fold === true, '§1.5 C-43.3: a middle date already past folds into the final (70%), with the tell');
  ok(s.foldBoundary === true, '§1.6 C-43.3: a middle date that is today folds too');
  ok(s.noFoldNextDay === true, '§1.7 C-43.3: a middle date tomorrow stays');
  ok(s.middleOff === true, '§1.8 C-43.4: middle off → two rows, 30 and 70, no fold tell');
  ok(s.onTheDay === true, '§1.9 on the day → the final is due on the wedding date');
  ok(s.handover === true, '§1.10 F25: handover needs delivery_on and uses it');
  ok(s.noFee === true, '§1.11 no fee, a zero fee or a fractional fee refuses no_fee');
  ok(s.noDate === true, '§1.12 no wedding date refuses no_wedding_date');
  ok(s.precision === true, '§1.13 F24: month or year precision reads as no date; null precision on a dated row schedules');
  ok(s.ownShares === true, "§1.14 F26: each row carries the package's own share (40/20/40)");
  ok(s.split === true, '§1.15 F21: the room split shows shares unpriced, rupees priced, two parts with middle off, and never a date');
  ok(s.sweep === true, '§1.16 sweep: whole rupees, shares sum to 100, amounts sum to the fee (both helpers)');

  sec('§2 · validatePackage');
  const v = pkgs && pkgs.validatePackage ? validateCells(pkgs.validatePackage) : {};
  ok(v.good === true, '§2.1 a good package passes, the name trimmed');
  ok(v.name === true, '§2.2 a blank name refuses');
  ok(v.total === true, '§2.3 the fee is a positive whole number or unset');
  ok(v.pcts === true, '§2.4 deposit 1 to 99, middle 1 to 98');
  ok(v.remainder === true, '§2.5 the remainder must stay above zero (F2), middle off counted');
  ok(v.pairing === true, '§2.6 days needs delivery_days; other bases drop it');
  ok(v.basis === true, '§2.7 an unknown basis refuses');
  ok(v.items === true, '§2.8 a line item needs both a label and a detail');
  ok(v.middleOff === true, '§2.9 F-43.78: with the middle payment off, a blank or zero share is not a refusal; the fallback is stored');

  sec('§3 · the Packages writes');
  const w = pkgs ? await writeCells(pkgs) : { err: 'no packages router' };
  if (w.err) console.log(`  (${w.err})`);
  ok(w.addSeedsFirst === true, '§3.1 Add seeds the vendor first, then adds hers');
  ok(w.addSafe === true, '§3.2 Add ignores vendor_id, is_default and seeded_from from the body, and returns its split');
  ok(w.addRefuses === true, '§3.3 Add refuses a remainder of zero and writes nothing');
  ok(w.patch === true, '§3.4 Edit renames and prices a seed; seeded_from and vendor_id cannot be rewritten');
  ok(w.patchMerged === true, '§3.5 Edit validates the merged row (a share alone can still break the remainder)');
  ok(w.patchScoped === true, "§3.6 another vendor cannot edit her package");
  ok(w.patchMiddleOff === true, '§3.6b F-43.78: switching the middle payment off with a blank share saves and keeps the stored share');
  ok(w.setDefault === true, '§3.7 Set as default moves the one default');
  ok(w.softDelete === true, '§3.8 Delete is soft and drops the default flag');
  ok(w.deletedGone === true, '§3.9 a deleted package cannot be deleted or edited again');
  ok(w.listSplit === true, '§3.10 the list carries each split; an unpriced package shows shares only');
  ok(w.race === true, '§3.11 a racing default is reported as 409 default_race and not retried');

  sec('§4 · the package on a lead');
  const a = lps ? await attachCells(lps) : { err: 'no leadPackages router' };
  if (a.err) console.log(`  (${a.err})`);
  ok(a.noFee === true, '§4.1 attaching an unpriced package with no fee refuses no_fee and writes nothing');
  ok(a.attach === true, "§4.2 attach carries the couple's edits, the source, the schedule and the delivery day");
  ok(a.packageUntouched === true, "§4.3 R-43.3: the vendor's package row is byte-identical after an edited attach");
  ok(a.reattach === true, '§4.4 re-attach clears the live row first; one live row remains');
  ok(a.read === true, '§4.5 GET returns the live row');
  ok(a.readNone === true, '§4.6 GET on a lead with none returns null');
  ok(a.monthDate === true, '§4.7 F24: a month-precision wedding date refuses no_wedding_date');
  ok(a.handover === true, '§4.8 F25: a handover package refuses without delivery_on and uses it when given');
  ok(a.onlyEdits === true, '§4.9 F23: the accept-list is closed — a key outside it is refused by name (re-aimed at CE-44, F-44.6)');
  ok(a.deletedPackage === true, '§4.10 a deleted package cannot be attached');
  ok(a.scoped === true, "§4.11 another vendor's lead is not found");
  ok(a.halfFailure === true, '§4.12 the named half-failure: live row cleared, insert refused, 500 and no live row');

  sec('§5 · the mount order');
  {
    const core = readIf('src/api/vendor/core.js').replace(/\/\/.*$/gm, '').split('\n').map((l) => l.trim()).filter(Boolean);
    const i = core.indexOf("router.use('/leads',    require('./leadPackages'));");
    ok(i >= 0 && core[i + 1] === "router.use('/leads',    require('./leads'));", '§5.1 leadPackages mounts immediately above leads (F22, the F-40.181 pattern)');
  }

  sec('§6 · columns named here exist in the witnessed doc (R-40.80)');
  {
    const pub = readIf('docs/db/PUBLIC_SCHEMA.md');
    const section = (head) => { const i = pub.indexOf(head); if (i < 0) return ''; const j = pub.indexOf('\n## ', i + head.length); return pub.slice(i, j < 0 ? undefined : j); };
    const has = (sc, col) => new RegExp(`^\\d+\\. ${col} `, 'm').test(sc);
    ok(['id', 'lead_id', 'vendor_id', 'package_id', 'snapshot', 'total', 'schedule', 'delivery_on', 'quoted_at', 'created_at', 'updated_at', 'deleted_at'].every((c) => has(section('## public.lead_packages '), c)), '§6.1 lead_packages columns');
    ok(['id', 'vendor_id', 'wedding_date', 'wedding_date_precision', 'deleted_at'].every((c) => has(section('## public.leads '), c)), '§6.2 the lead columns the attach reads');
  }

  sec('§7 · mutations of production code');
  const schedPath = require.resolve(P('src/lib/vendor/packageSchedule.js'));
  const pkgsPath = require.resolve(P('src/api/vendor/packages.js'));
  const muts = [
    ['src/lib/vendor/packageSchedule.js', 'return Math.floor((total * pct + 50) / 100);', 'return Math.floor((total * pct) / 100);', async (m) => !scheduleCells(m).halfUp, 'M1 round half up → floor → §1.3 RED'],
    ['src/lib/vendor/packageSchedule.js', "rows.push({ kind: 'final', pct: 100 - paidPct, amount: total - paid, due_on: deliveryOn });", "rows.push({ kind: 'final', pct: 100 - paidPct, amount: share(total, 100 - paidPct), due_on: deliveryOn });", async (m) => !scheduleCells(m).remainder, 'M2 the remainder rounded instead of computed → §1.2 RED'],
    ['src/lib/vendor/packageSchedule.js', 'const dd = Math.min(d, last);', 'const dd = d;', async (m) => !scheduleCells(m).clamp, 'M3 no month-end clamp → §1.4 RED'],
    ['src/lib/vendor/packageSchedule.js', 'if (middleDue <= today)', 'if (middleDue < today)', async (m) => !scheduleCells(m).foldBoundary, 'M4 fold only when strictly past → §1.6 RED'],
    ['src/lib/vendor/packageSchedule.js', " || precision !== 'day') return { ok: false, code: 'no_wedding_date' };", ") return { ok: false, code: 'no_wedding_date' };", async (m) => !scheduleCells(m).precision, 'M5 the precision gate removed → §1.13 RED'],
    ['src/lib/vendor/packageSchedule.js', "if (!isDateKey(delivery_on)) return { ok: false, code: 'no_handover_date' };", '', async (m) => !scheduleCells(m).handover, 'M6 the handover gate removed → §1.10 RED'],
    ['src/api/vendor/packages.js', ".update({ is_default: false, updated_at: now })\n    .eq('vendor_id', vendor.id)\n    .eq('is_default', true)", ".update({ updated_at: now })\n    .eq('vendor_id', vendor.id)\n    .eq('is_default', true)", async (m) => !(await writeCells(m)).setDefault, 'M7 the clear step dropped → §3.7 RED'],
    ['src/api/vendor/packages.js', ".eq('id', id)\n    .eq('vendor_id', vendorId)", ".eq('id', id)", async (m) => !(await writeCells(m)).patchScoped, 'M8 readLive loses its vendor scope → §3.6 RED'],
    ['src/api/vendor/packages.js', "const v = validatePackage({ ...cur, ...pickWritable(req.body) }, cur.middle_pct);", "const v = validatePackage({ ...NEW_DEFAULTS, ...pickWritable(req.body), name: pickWritable(req.body).name || cur.name }, cur.middle_pct);", async (m) => !(await writeCells(m)).patchMerged || !(await writeCells(m)).patch, 'M9 Edit validates the body alone, not the merged row → §3.4/§3.5 RED'],
    ['src/api/vendor/packages.js', "if (error.code === '23505') {", 'if (false) {', async (m) => !(await writeCells(m)).race, 'M10 the race branch removed → §3.11 RED'],
    ['src/api/vendor/packages.js', '    merged = { ...merged, middle_pct: fallbackMiddle };', "    return { ok: false, field: 'middle_pct' };", async (m) => !validateCells(m.validatePackage).middleOff || !(await writeCells(m)).patchMiddleOff, 'M15 the middle-off fallback removed → §2.9/§3.6b RED (F-43.78)'],
    ['src/api/vendor/leadPackages.js', ".update({ deleted_at: now, updated_at: now })\n    .eq('lead_id', leadId)", ".update({ updated_at: now })\n    .eq('lead_id', leadId)", async (m) => !(await attachCells(m)).reattach, 'M11 re-attach does not clear the live row → §4.4 RED'],
    // AMENDED BY LABEL (CE-43 LC-2r, packet 3): the attach act moved into attachPackage() so
    // POST /clients/direct shares it; the refusal line now returns { status, body }. Same
    // refusal, same bite, new anchor (the P2b M9 precedent).
    ['src/api/vendor/leadPackages.js', "if (unknown.length) return { status: 422, body: { ok: false, error: 'invalid', field: unknown[0] } };", '', async (m) => !(await attachCells(m)).onlyEdits, 'M12 any body key accepted → §4.9 RED'],
    ['src/api/vendor/leadPackages.js', "  const now = new Date().toISOString();\n  const { error: delErr } = await supabase", "  const now = new Date().toISOString();\n  await supabase.from('vendor_packages').update({ name: v.row.name }).eq('id', pkg.id);\n  const { error: delErr } = await supabase", async (m) => { const c = await attachCells(m); return !c.packageUntouched; }, "M13 the vendor's package mutated by an edited attach → §4.3 RED"],
  ];
  for (const [rel, from, to, bites, label] of muts) {
    const overrides = {};
    const lm = loadMutated(rel, from, to);
    if (lm.mod && rel.endsWith('packageSchedule.js')) overrides[schedPath] = lm.mod;
    if (lm.mod && rel.endsWith('packages.js')) overrides[pkgsPath] = lm.mod;
    let red = false;
    if (lm.mod) { try { red = await bites(lm.mod); } catch (e) { red = true; } }
    ok(red, `§7 ${label}`);
  }
  {
    const core = readIf('src/api/vendor/core.js');
    const swapped = core.replace("router.use('/leads',    require('./leadPackages'));\nrouter.use('/leads',    require('./leads'));", "router.use('/leads',    require('./leads'));\nrouter.use('/leads',    require('./leadPackages'));");
    const lines = swapped.replace(/\/\/.*$/gm, '').split('\n').map((l) => l.trim()).filter(Boolean);
    const i = lines.indexOf("router.use('/leads',    require('./leadPackages'));");
    ok(swapped !== core && !(i >= 0 && lines[i + 1] === "router.use('/leads',    require('./leads'));"), '§7 M14 the mount order swapped → §5.1 RED');
  }

  console.log(`\n════════  b82_lc2_p2_packages_bench: ${pass} passed, ${fail} failed  ════════\n`);
  if (fail) { console.log('RED. Failing checks:'); fails.forEach((f) => console.log('   ·', f)); process.exit(1); }
}

main().catch((e) => { console.error('BENCH ERROR', e); process.exit(2); });
