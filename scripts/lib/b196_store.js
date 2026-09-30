// scripts/lib/b196_store.js · CE-47 · WEB-4 cut 3 · the in-memory store b196 drives the real doors against.
// A small PostgREST-shaped builder: select (columns named are PROJECTED, so a door that forgets a column reads
// undefined, as it would in production), eq, is, in, gt, order, limit, maybeSingle, single, insert, update, upsert,
// delete, and `.select()` after a write. Filters are applied for real, so a door that drops a scope filter or the
// single-use guard is caught. `failOn` makes a named table's reads fail, `failWrite` its inserts. Every query waits a
// tick, so reads started together overlap: `waves` counts the stages a door awaited (a read starting while none is in
// flight opens a new stage). `written` and `selected` record every column a door wrote or read, per table, so b196 can
// hold them to the real migrations.
'use strict';
const crypto = require('crypto');

function makeStore(seed) {
  const t = {}; for (const [k, v] of Object.entries(seed || {})) t[k] = v.map((r) => Object.assign({}, r));
  const failOn = new Set(); const failWrite = new Set();
  const calls = []; const written = {}; const selected = {};
  const meter = { waves: 0, inFlight: 0 };
  const note = (bag, tbl, keys) => { if (!bag[tbl]) bag[tbl] = new Set(); for (const k of keys) bag[tbl].add(k); };
  function table(name) { if (!t[name]) t[name] = []; return t[name]; }
  function from(name) {
    const st = { name, op: 'select', cols: null, filters: [], orders: [], lim: null, payload: null, returning: null, single: null, onConflict: null };
    const api = {
      select(cols) { if (st.op === 'select') st.cols = cols; else st.returning = cols || '*'; return api; },
      eq(c, v) { st.filters.push((r) => r[c] === v); return api; },
      is(c, v) { st.filters.push((r) => (v === null ? r[c] === null || r[c] === undefined : r[c] === v)); return api; },
      in(c, vs) { const s = new Set(vs); st.filters.push((r) => s.has(r[c])); return api; },
      gt(c, v) { st.filters.push((r) => r[c] !== null && r[c] !== undefined && String(r[c]) > String(v)); return api; },
      order(c, o) { st.orders.push([c, !(o && o.ascending === false)]); return api; },
      limit(n) { st.lim = n; return api; },
      maybeSingle() { st.single = 'maybe'; return api; },
      single() { st.single = 'one'; return api; },
      insert(p) { st.op = 'insert'; st.payload = p; return api; },
      update(p) { st.op = 'update'; st.payload = p; return api; },
      upsert(p, o) { st.op = 'upsert'; st.payload = p; st.onConflict = o && o.onConflict; return api; },
      delete() { st.op = 'delete'; return api; },
      then(res, rej) {
        if (meter.inFlight === 0) meter.waves += 1;
        meter.inFlight += 1;
        return new Promise((r) => setTimeout(r, 2)).then(() => { try { return run(); } finally { meter.inFlight -= 1; } }).then(res, rej);
      },
    };
    function project(r, cols) {
      if (!cols || cols === '*') return Object.assign({}, r);
      const o = {}; for (const c of String(cols).split(',').map((x) => x.trim()).filter(Boolean)) { const k = c.split(':')[0].split('(')[0].trim(); if (!k.includes('(')) o[k] = r[k]; }
      return o;
    }
    function run() {
      calls.push({ table: name, op: st.op });
      if (st.op === 'select' && st.cols && st.cols !== '*') { let c0 = String(st.cols); let prev; do { prev = c0; c0 = c0.replace(/[a-z_]+:?[a-z_]*\([^()]*\)/g, ''); } while (c0 !== prev); note(selected, name, c0.split(',').map((c) => c.trim()).filter((c) => c && !c.includes(':'))); }
      if (['insert', 'update', 'upsert'].includes(st.op)) note(written, name, (Array.isArray(st.payload) ? st.payload : [st.payload]).flatMap((p) => Object.keys(p || {})));
      if (st.op === 'insert' && failWrite.has(name)) return st.single ? { data: null, error: { message: 'planted write failure' } } : { data: null, error: { message: 'planted write failure' } };
      if (failOn.has(name) && st.op === 'select') return { data: null, error: { message: 'planted failure' } };
      const rows = table(name);
      const match = (r) => st.filters.every((f) => f(r));
      let out;
      if (st.op === 'select') {
        out = rows.filter(match);
        for (const [c, asc] of st.orders.slice().reverse()) out = out.slice().sort((a, b) => ((a[c] ?? 0) > (b[c] ?? 0) ? 1 : (a[c] ?? 0) < (b[c] ?? 0) ? -1 : 0) * (asc ? 1 : -1));
        if (st.lim) out = out.slice(0, st.lim);
        out = out.map((r) => project(r, st.cols));
      } else if (st.op === 'insert') {
        const list = (Array.isArray(st.payload) ? st.payload : [st.payload]).map((p) => Object.assign({ id: crypto.randomUUID(), created_at: new Date().toISOString(), deleted_at: null }, p));
        rows.push(...list); out = list.map((r) => project(r, st.returning));
      } else if (st.op === 'update') {
        out = []; for (const r of rows) if (match(r)) { Object.assign(r, st.payload); out.push(project(r, st.returning)); }
      } else if (st.op === 'upsert') {
        const key = st.onConflict; const p = st.payload; const ex = rows.find((r) => r[key] === p[key]);
        if (ex) Object.assign(ex, p); else rows.push(Object.assign({ id: crypto.randomUUID() }, p)); out = [];
      } else if (st.op === 'delete') {
        const keep = rows.filter((r) => !match(r)); out = []; t[name] = keep;
      }
      if (st.single === 'maybe') return { data: out[0] || null, error: out.length > 1 ? { message: 'many' } : null };
      if (st.single === 'one') return out.length === 1 ? { data: out[0], error: null } : { data: null, error: { message: 'not one row' } };
      return { data: out, error: null };
    }
    return api;
  }
  return { from, tables: t, failOn, failWrite, calls, written, selected, meter };
}
module.exports = { makeStore };
