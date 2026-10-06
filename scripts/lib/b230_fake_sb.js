'use strict';
// scripts/lib/b230_fake_sb.js · CE-47 · OFF-A1 · an in-memory stand-in for the Supabase client, only as wide as
// src/lib/shop/shop.js uses it: from().select().eq().neq().is().in().order().limit().maybeSingle()/single(), insert().select(),
// update().eq()...select(), and embedded relations by foreign key (shop_orders(...), shop_items(...), shop_vouchers(...)).
const crypto = require('crypto');
const FK = { // child.table: { relation: [localKey, foreignKey, many] }
  shop_orders: { shop_items: ['item_id', 'id', false], shop_vouchers: ['id', 'order_id', true] },
  shop_vouchers: { shop_orders: ['order_id', 'id', false], shop_items: ['item_id', 'id', false] },
};
function parseSelect(sel) {
  const rels = []; const cols = [];
  const re = /(\w+)\(([^)]*)\)|(\w+)/g; let m;
  while ((m = re.exec(String(sel || '*')))) { if (m[1]) rels.push({ rel: m[1], cols: m[2].split(',').map((c) => c.trim()) }); else cols.push(m[3]); }
  return { cols, rels };
}
function makeDb(seed = {}) {
  const t = {}; for (const k of Object.keys(seed)) t[k] = seed[k].map((r) => ({ ...r }));
  const log = [];
  const table = (n) => (t[n] = t[n] || []);
  function project(name, row, sel) {
    const { cols, rels } = parseSelect(sel); const out = {};
    for (const c of cols) out[c] = row[c] === undefined ? null : row[c];
    for (const r of rels) {
      const fk = (FK[name] || {})[r.rel]; if (!fk) throw new Error(`fake: no relation ${name}->${r.rel}`);
      const pick = (x) => Object.fromEntries(r.cols.map((c) => [c, x[c] === undefined ? null : x[c]]));
      const hits = table(r.rel).filter((x) => x[fk[1]] === row[fk[0]]);
      out[r.rel] = fk[2] ? hits.map(pick) : (hits[0] ? pick(hits[0]) : null);
    }
    return out;
  }
  function q(name) {
    const st = { name, filters: [], op: 'select', sel: '*', order: null, lim: null, values: null, returning: null };
    const api = {
      select(sel) { if (st.op === 'select') st.sel = sel || '*'; else st.returning = sel || '*'; return api; },
      insert(v) { st.op = 'insert'; st.values = v; return api; },
      update(v) { st.op = 'update'; st.values = v; return api; },
      eq(c, v) { st.filters.push((r) => r[c] === v); return api; },
      neq(c, v) { st.filters.push((r) => r[c] !== v); return api; },
      is(c, v) { st.filters.push((r) => (r[c] === undefined ? null : r[c]) === v); return api; },
      in(c, vs) { st.filters.push((r) => vs.includes(r[c])); return api; },
      gte(c, v) { st.filters.push((r) => r[c] >= v); return api; },
      order(c, o) { st.order = [c, !(o && o.ascending === false)]; return api; },
      limit(n) { st.lim = n; return api; },
      maybeSingle() { return run('maybe'); },
      single() { return run('single'); },
      then(res, rej) { return run('many').then(res, rej); },
    };
    function run(mode) {
      try {
        let rows;
        if (st.op === 'insert') {
          const list = (Array.isArray(st.values) ? st.values : [st.values]).map((v) => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...v }));
          if (name === 'shop_vouchers') for (const v of list) if (table(name).some((x) => x.vendor_id === v.vendor_id && x.code === v.code)) return Promise.resolve({ data: null, error: { message: 'duplicate key value violates unique constraint "shop_vouchers_code_uidx"' } });
          table(name).push(...list); log.push({ op: 'insert', name, rows: list }); rows = list;
          if (st.returning == null) return Promise.resolve({ data: null, error: null });
        } else {
          rows = table(name).filter((r) => st.filters.every((f) => f(r)));
          if (st.op === 'update') { rows.forEach((r) => Object.assign(r, st.values)); log.push({ op: 'update', name, rows: rows.map((r) => r.id), values: st.values }); if (st.returning == null) return Promise.resolve({ data: null, error: null }); }
          if (st.order) { const [c, asc] = st.order; rows = [...rows].sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1)); }
          if (st.lim != null) rows = rows.slice(0, st.lim);
        }
        const sel = st.op === 'select' ? st.sel : st.returning;
        const data = rows.map((r) => project(name, r, sel));
        if (mode === 'many') return Promise.resolve({ data, error: null });
        if (mode === 'single' && data.length !== 1) return Promise.resolve({ data: null, error: { message: `expected one row, got ${data.length}` } });
        return Promise.resolve({ data: data[0] || null, error: null });
      } catch (e) { return Promise.resolve({ data: null, error: { message: e.message } }); }
    }
    return api;
  }
  return { from: q, t, log };
}
module.exports = { makeDb };
