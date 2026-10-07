'use strict';
// scripts/lib/ptn_fakedb.js · CE-47 · PTN · a small in-memory stand-in for the Supabase client, ONLY the calls PTN's
// files make (select, eq, neq, in, ilike, lte, gte, order, limit, insert, update, upsert, delete, maybeSingle, single,
// head counts). Shared by b292 (and b290's own copy stays as it is). Every write is logged in `writes`.
const crypto = require('crypto');
function fakeDb(tables = {}) {
  const T = (n) => (tables[n] ||= []);
  const writes = [];
  function q(name) {
    let filters = []; let mode = 'select'; let payload = null; let headCount = false; let lim = null; let order = null;
    const apply = () => T(name).filter((r) => filters.every((f) => f(r)));
    const api = {
      select(_c, o) { if (o && o.head) headCount = true; return api; },
      eq(c, v) { filters.push((r) => r[c] === v); return api; },
      neq(c, v) { filters.push((r) => r[c] !== v); return api; },
      in(c, vs) { filters.push((r) => vs.includes(r[c])); return api; },
      ilike(c, v) { filters.push((r) => String(r[c]).toLowerCase() === String(v).toLowerCase()); return api; },
      lte(c, v) { filters.push((r) => r[c] != null && String(r[c]) <= String(v)); return api; },
      gte(c, v) { filters.push((r) => r[c] != null && String(r[c]) >= String(v)); return api; },
      order(c, o) { order = { c, asc: !o || o.ascending !== false }; return api; }, limit(n) { lim = n; return api; },
      insert(p) { mode = 'insert'; payload = p; return api; },
      update(p) { mode = 'update'; payload = p; return api; },
      upsert(p) { mode = 'upsert'; payload = p; return api; },
      delete() { mode = 'delete'; return api; },
      async maybeSingle() { const r = await run(); return { data: Array.isArray(r.data) ? (r.data[0] || null) : r.data, error: r.error }; },
      async single() { const r = await run(); const d = Array.isArray(r.data) ? r.data[0] : r.data; return { data: d || null, error: r.error || (d ? null : { message: 'no row' }) }; },
      then(res, rej) { return run().then(res, rej); },
    };
    async function run() {
      if (mode === 'insert') {
        const list = (Array.isArray(payload) ? payload : [payload]).map((p) => ({ id: p.id || crypto.randomUUID(), created_at: new Date().toISOString(), ...p }));
        const uniq = tables.__unique && tables.__unique[name];
        if (uniq) for (const row of list) if (T(name).some((x) => uniq.every((k) => x[k] === row[k]))) return { data: null, error: { message: `duplicate key on ${name}` } };
        T(name).push(...list); writes.push({ name, mode, list }); return { data: list, error: null };
      }
      if (mode === 'update') { const hit = apply(); hit.forEach((r) => Object.assign(r, payload)); writes.push({ name, mode, payload, n: hit.length }); return { data: hit, error: null }; }
      if (mode === 'upsert') { T(name).push({ ...payload }); writes.push({ name, mode, payload }); return { data: [payload], error: null }; }
      if (mode === 'delete') { tables[name] = T(name).filter((r) => !filters.every((f) => f(r))); return { data: null, error: null }; }
      let hit = apply();
      if (order) hit = hit.slice().sort((a, b) => (String(a[order.c]) < String(b[order.c]) ? -1 : 1) * (order.asc ? 1 : -1));
      if (headCount) return { data: null, count: hit.length, error: null };
      return { data: lim ? hit.slice(0, lim) : hit, error: null };
    }
    return api;
  }
  return { from: q, tables, writes };
}
// Call one route's last handler as Express would, with a fake req/res. Returns { code, body }.
async function callRoute(router, method, path, req) {
  const layer = router.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
  if (!layer) throw new Error(`no route ${method.toUpperCase()} ${path}`);
  const fn = layer.route.stack[layer.route.stack.length - 1].handle;
  return new Promise((done, fail) => {
    let code = 200;
    const res = { status(c) { code = c; return res; }, json(b) { done({ code, body: b }); return res; } };
    Promise.resolve(fn({ headers: {}, query: {}, body: {}, params: {}, ...req }, res, (e) => (e ? fail(e) : done({ code, body: null })))).catch(fail);
  });
}
module.exports = { fakeDb, callRoute };
