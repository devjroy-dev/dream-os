// scripts/b201_ce47_web4_cut8_bench.js
// TDW · CE-47 · WEB-4 cut 8 · b201 — THE ACCOUNT ID ON THE ADMIN'S TWO LISTS (ADM-1's delete card).
// GET /api/v2/admin/vendors and GET /api/v2/admin/couples, mounted as router.js mounts them, behind the REAL requireAdmin
// with a real admin session. Per door: user_id present and equal to the row's account (users.id); a non-admin still refused;
// the rest of each row byte-equal to the clean tip's door on the same rows. Red on a tree without the cut.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const Module = require('module');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => { try { return fs.readFileSync(P(r), 'utf8'); } catch { return ''; } };
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
function load(r, src) { try { const m = new Module(P(r), module); m.filename = P(r); m.paths = Module._nodeModulePaths(path.dirname(P(r))); m._compile(src === undefined ? read(r) : src, P(r)); return m.exports; } catch { return null; } }
process.env.ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'b201-admin-secret-for-this-rung-only-0123456789';

// The rows, with the account joined as PostgREST returns users!inner(...): an object under `users`.
const USERS = { '11111111-1111-4111-8111-111111111111': { id: '11111111-1111-4111-8111-111111111111', name: 'Aarohi', phone: '+919999900001' }, '22222222-2222-4222-8222-222222222222': { id: '22222222-2222-4222-8222-222222222222', name: 'Riya', phone: '+919999900002' } };
const T = {
  vendors: [{ id: 'v1', user_id: '11111111-1111-4111-8111-111111111111', business_name: 'Studio Aarohi', category: 'makeup', city: 'Delhi', tier: 'signature', status: 'active', founding_cohort: true, discover_eligible: true, discover_request_state: 'approved', created_at: '2026-09-01T00:00:00Z' }],
  couples: [{ id: 'c1', user_id: '22222222-2222-4222-8222-222222222222', wedding_date: '2026-12-12', wedding_city: 'Jaipur', planning_state: 'planning', created_at: '2026-09-02T00:00:00Z' },
    { id: 'c2', user_id: '11111111-1111-4111-8111-111111111111', wedding_date: null, wedding_city: null, planning_state: 'browsing', created_at: '2026-09-03T00:00:00Z' }],
  muse_saves: [{ couple_id: 'c1' }], circle_members: [{ couple_id: 'c1', status: 'active' }],
};
function store() {
  const selects = [];
  const from = (name) => {
    let cols = '*'; const filters = [];
    const api = {
      select(c) { cols = c; selects.push({ name, cols: String(c).replace(/\s+/g, ' ').trim() }); return api; },
      order() { return api; }, in(c, v) { filters.push((r) => v.includes(r[c])); return api; }, eq(c, v) { filters.push((r) => r[c] === v); return api; },
      then(res, rej) {
        const want = String(cols).replace(/users!inner\([^)]*\)/, '').split(',').map((x) => x.trim()).filter(Boolean);
        const rows = (T[name] || []).filter((r) => filters.every((f) => f(r))).map((r) => {
          const o = {}; for (const k of want) o[k] = r[k];   // only the columns asked for, as PostgREST does
          if (/users!inner/.test(cols)) o.users = { name: USERS[r.user_id].name, phone: USERS[r.user_id].phone };
          return o;
        });
        return Promise.resolve({ data: rows, error: null }).then(res, rej);
      },
    };
    return api;
  };
  return { from, selects };
}

(async () => {
  const express = require('express');
  const S = require(P('src/lib/adminSession.js'));
  const token = S.mintAdminSession();
  async function serve(vendorsSrc, couplesSrc) {
    const st = store(); const app = express(); app.locals.supabase = st;
    const V = load('src/api/admin/vendors.js', vendorsSrc); const C = load('src/api/admin/couples.js', couplesSrc);
    if (V) app.use('/api/v2/admin/vendors', V); if (C) app.use('/api/v2/admin/couples', C);
    const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
    const get = (p, auth) => new Promise((res) => http.get({ host: '127.0.0.1', port: srv.address().port, path: p, headers: auth ? { authorization: 'Bearer ' + auth } : {} }, (rs) => {
      let b = ''; rs.on('data', (d) => (b += d)); rs.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } res({ status: rs.statusCode, body: j }); }); }));
    return { get, st, close: () => new Promise((r) => srv.close(r)) };
  }
  // the clean tip's doors, for "the rest of each row is byte-equal": the cut with its two added lines taken back out
  const strip = (src) => src.replace(/  +\/\/ CE-47 WEB-4 cut 8 \(ADM-1\)[^\n]*\n  +user_id: +[vc]\.user_id,\n/, '').replace('id, user_id, ', 'id, ');
  const cut = await serve(); const tip = await serve(strip(read('src/api/admin/vendors.js')), strip(read('src/api/admin/couples.js')));
  const minus = (rows) => (rows || []).map((r) => { const o = Object.assign({}, r); delete o.user_id; return o; });

  for (const [door, list, table] of [['vendors', 'vendors', 'vendors'], ['couples', 'couples', 'couples']]) {
    sec(`${door === 'vendors' ? 1 : 2}  GET /api/v2/admin/${door}`);
    const a = await cut.get(`/api/v2/admin/${door}`, token); const b = await tip.get(`/api/v2/admin/${door}`, token);
    const rows = a.body && a.body[list];
    ok(() => a.status === 200 && rows.length === T[table].length && rows.every((r) => typeof r.user_id === 'string' && r.user_id === T[table].find((x) => x.id === r.id).user_id && USERS[r.user_id].id === r.user_id),
      `${door}.1 every row carries user_id, equal to its account (users.id)`, rows && JSON.stringify(rows.map((r) => [r.id, r.user_id])));
    ok(() => cut.st.selects.some((s) => s.name === table && /^id, user_id, /.test(s.cols) && /users!inner\(name, phone\)/.test(s.cols)), `${door}.2 the select names user_id; the join is unchanged`);
    // THE CHAIR'S PIN: exactly one new key, named "user_id", always present, a uuid string; nothing else in the item changes
    ok(() => rows.every((r, i) => { const k = Object.keys(r); const was = Object.keys(b.body[list][i]); return k.length === was.length + 1 && k.filter((x) => !was.includes(x)).join() === 'user_id'
      && typeof r.user_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(r.user_id); }), `${door}.0 each item gains exactly one key, "user_id": a uuid string, always present`);
    ok(() => b.status === 200 && JSON.stringify(minus(rows)) === JSON.stringify(b.body[list]) && JSON.stringify(Object.keys(a.body).sort()) === JSON.stringify(Object.keys(b.body).sort()), `${door}.3 the rest of each row is byte-equal to the clean tip's door on the same rows`);
    const none = await cut.get(`/api/v2/admin/${door}`); const bad = await cut.get(`/api/v2/admin/${door}`, 'not-a-session');
    ok(() => none.status === 401 && (bad.status === 401 || bad.status === 403) && !(bad.body && bad.body[list]), `${door}.4 a non-admin is still refused (no session: 401; a forged one: refused), and gets no rows`, `${none.status}/${bad.status}`);
  }
  sec('3  the two doors are admin doors only');
  ok(() => /router\.get\('\/', requireAdmin, asyncHandler/.test(read('src/api/admin/vendors.js')) && /router\.get\('\/', requireAdmin, asyncHandler/.test(read('src/api/admin/couples.js')), '3.1 both lists stay behind requireAdmin');
  ok(() => (read('src/api/admin/vendors.js').match(/user_id/g) || []).length >= 2 && !/user_id/.test(read('src/api/public/vendorCard.js').split('VENDOR_SELECT')[1] ? read('src/api/public/vendorCard.js').match(/const VENDOR_SELECT *= *'([^']*)'/)[1] : ''), '3.2 the public card does not gain the account id');
  await cut.close(); await tip.close();
  console.log(`\nb201 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.message)); console.log(`\nb201 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
