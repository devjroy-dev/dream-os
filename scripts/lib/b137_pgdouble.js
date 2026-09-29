'use strict';
// scripts/lib/b137_pgdouble.js · CE-46 G6-2 · rung b137's Postgres-shaped double (C-44.3: data the way Postgres returns it).
// Tables are arrays of rows. A select returns ONLY the named columns ('*' = all); maybeSingle over two or more rows is
// PostgREST's error (PGRST116) with no data; a UNIQUE column refuses a second equal non-null value with 23505;
// .contains() is jsonb @> (an array contains another when every element of the second is contained in some element of
// the first). Every write is logged in `writes` so a cell can assert what was, and was not, written.
function containsJson(a, b) {
  if (Array.isArray(b)) return Array.isArray(a) && b.every((x) => a.some((y) => containsJson(y, x)));
  if (b && typeof b === 'object') return !!a && typeof a === 'object' && !Array.isArray(a) && Object.keys(b).every((k) => containsJson(a[k], b[k]));
  return a === b;
}
function makeDb(seed = {}, { unique = { messages: ['message_sid'] }, failReads = {} } = {}) {
  const tables = {}; for (const k of Object.keys(seed)) tables[k] = seed[k].map((r) => ({ ...r }));
  const writes = []; const reads = [];
  let n = 0; const newId = (t) => `${t}-new-${++n}`;
  const project = (row, cols) => { if (!cols || cols.trim() === '*' || cols.includes('*')) return { ...row }; const o = {}; for (const c of cols.split(',').map((x) => x.trim())) o[c] = row[c] === undefined ? null : row[c]; return o; };
  function q(table) {
    const st = { table, filters: [], cols: '*', lim: null, op: 'select', payload: null, ret: false };
    const match = (r) => st.filters.every(([k, c, v]) => k === 'eq' ? String(r[c]) === String(v) : k === 'is' ? (r[c] === undefined ? null : r[c]) === v
      : k === 'gte' ? String(r[c]) >= String(v) : k === 'contains' ? containsJson(r[c], v)
      : k === 'in' ? v.map(String).includes(String(r[c])) : true); // 'in': CE-46 G6-3 cut three, PostgREST's in.(...)
    const run = () => {
      const rows = tables[table] || (tables[table] = []);
      if (st.op === 'select') {
        reads.push({ table, filters: st.filters.map((f) => f.slice()) });
        if (failReads[table]) return { data: null, error: { message: `${table} read refused (plant)` } };
        let out = rows.filter(match); if (st.lim != null) out = out.slice(0, st.lim);
        return { data: out.map((r) => project(r, st.cols)), error: null };
      }
      if (st.op === 'insert') {
        const list = Array.isArray(st.payload) ? st.payload : [st.payload];
        for (const r of list) for (const col of (unique[table] || [])) if (r[col] != null && rows.some((x) => x[col] === r[col])) return { data: null, error: { code: '23505', message: `duplicate key value violates unique constraint (${table}.${col})` } };
        const made = list.map((r) => ({ id: newId(table), ...r })); rows.push(...made); writes.push({ table, op: 'insert', rows: made });
        return { data: made.map((r) => project(r, st.cols)), error: null };
      }
      if (st.op === 'update') { const hit = rows.filter(match); hit.forEach((r) => Object.assign(r, st.payload)); writes.push({ table, op: 'update', patch: st.payload, count: hit.length }); return { data: hit.map((r) => project(r, st.cols)), error: null }; }
      // CE-46 G6-4 (b150): delete, so a rung can witness a row replaced (F6) against a row kept (F-d). Removes the matched rows in place.
      if (st.op === 'delete') { const hit = rows.filter(match); for (const r of hit) rows.splice(rows.indexOf(r), 1); writes.push({ table, op: 'delete', count: hit.length }); return { data: hit.map((r) => project(r, st.cols)), error: null }; }
      return { data: null, error: { message: 'unknown op' } };
    };
    const b = {
      select(c) { if (st.op === 'select') st.cols = c || '*'; else { st.ret = true; st.cols = c || '*'; } return b; },
      insert(p) { st.op = 'insert'; st.payload = p; return b; },
      update(p) { st.op = 'update'; st.payload = p; return b; },
      delete() { st.op = 'delete'; return b; },
      eq(c, v) { st.filters.push(['eq', c, v]); return b; }, is(c, v) { st.filters.push(['is', c, v]); return b; },
      gte(c, v) { st.filters.push(['gte', c, v]); return b; }, contains(c, v) { st.filters.push(['contains', c, v]); return b; },
      in(c, v) { st.filters.push(['in', c, Array.isArray(v) ? v : []]); return b; },
      order() { return b; }, limit(n) { st.lim = n; return b; },
      maybeSingle() { const r = run(); if (r.error) return Promise.resolve(r); if (r.data.length > 1) return Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'multiple rows' } }); return Promise.resolve({ data: r.data[0] || null, error: null }); },
      single() { const r = run(); if (r.error) return Promise.resolve(r); if (r.data.length !== 1) return Promise.resolve({ data: null, error: { code: 'PGRST116', message: `${r.data.length} rows` } }); return Promise.resolve({ data: r.data[0], error: null }); },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    };
    return b;
  }
  return { from: q, tables, writes, reads, schema: () => ({ from: q }), rpc: () => Promise.resolve({ data: null, error: null }) };
}
module.exports = { makeDb, containsJson };
