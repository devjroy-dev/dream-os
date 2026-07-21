// ══════════════════════════════════════════════════════════════════════════
// b0457_crud_crew_bench — TDW_04.5 P1 #6 (CE Ruling №10) — the CRUD crew exposure
// ══════════════════════════════════════════════════════════════════════════
//
// WHAT IT DRIVES: the REAL PATCH /:eventId handler and the REAL GET day handler
// (extracted from their routers' stacks, req.vendor injected so only the auth
// middleware is bypassed — never the handler logic), plus the REAL writeEvent +
// checkOccupancy + crew core behind them, AND the REAL mutateEvents (Victor's door,
// chat.js) for the identical-row proof — against the sealed crew bench's proven
// double (reused verbatim; per the per-bench-self-contained convention, copying the
// PROVEN artifact is not hand-rolling). ONLY the ledger is doubled by omission.
//
// PROVES (CE Ruling №10's list):
//   (i)   PATCH with an array  -> row SETs, note-trail + crew_confirmations fire
//   (ii)  PATCH without field  -> row untouched (writeEvent's undefined law)
//   (iii) PATCH with []        -> crew cleared
//   (iv)  IDENTICAL-ROW PROOF (spec §9): a CRUD-path assign and a Victor-path assign
//         land byte-identical rows (same SET, same note-trail, same crew_confirmations)
//   (v)   bad shape (non-array) -> 400 before the writer, no write
//   (vi)  [seam b] the day-fetch payload carries assigned_member_ids, always-an-array
//
// LOAD NOTE: chat.js builds a Supabase client at load (never used by these paths —
// they run on the double); placeholder env satisfies the lazy createClient only. A
// VALID URL is required (supabase-js validates the URL at construction).
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-dummy-key';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test';
process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'test';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const eventsRouter = require(path.join(ROOT, 'src/api/vendor/events.js'));
const dayRouter    = require(path.join(ROOT, 'src/api/vendor/day.js'));
const { mutateEvents } = require(path.join(ROOT, 'src/api/vendor-engine/chat.js'));

// ── extract the real handlers from the router stacks (auth middleware bypassed) ──
function handlerFor(router, routePath, method) {
  for (const layer of (router.stack || [])) {
    if (layer.route && layer.route.path === routePath && layer.route.methods[method]) {
      return layer.route.stack[layer.route.stack.length - 1].handle;   // asyncHandler(fn)
    }
  }
  throw new Error(`handler not found: ${method.toUpperCase()} ${routePath}`);
}
const PATCH = handlerFor(eventsRouter, '/:eventId', 'patch');
const DAYGET = handlerFor(dayRouter, '/:vendorId/:date', 'get');

function invoke(handler, req) {
  return new Promise((resolve, reject) => {
    const res = { _s: 200, status(c) { this._s = c; return this; }, json(b) { resolve({ status: this._s, body: b }); return this; } };
    try { handler(req, res, (e) => reject(e || new Error('next() called'))); } catch (e) { reject(e); }
  });
}

// ── the PROVEN double, reused verbatim from b0457_crew_bench ──
let SEQ = 0;
const uuid = (p = '0') => `${p.repeat(8).slice(0,8)}-0000-4000-8000-${String(++SEQ).padStart(12, '0')}`;
class Q {
  constructor(db, table) { this.db = db; this.table = table; this.f = []; this.n = null; this.mode = 'select'; }
  select() { return this; }
  eq(c, v)  { this.f.push(r => r[c] === v); return this; }
  neq(c, v) { this.f.push(r => r[c] !== v); return this; }
  is(c, v)  { this.f.push(r => (r[c] === undefined ? null : r[c]) === v); return this; }
  in(c, vs) { this.f.push(r => vs.includes(r[c])); return this; }
  gte(c, v) { this.f.push(r => r[c] != null && r[c] >= v); return this; }
  lte(c, v) { this.f.push(r => r[c] != null && r[c] <= v); return this; }
  ilike(c, p){ const re = new RegExp('^' + String(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*'), 'i');
               this.f.push(r => re.test(String(r[c] == null ? '' : r[c]))); return this; }
  limit(n)  { this.n = n; return this; }
  order()   { return this; }
  update(p) { this.mode = 'update'; this.patch = p; return this; }
  insert(r) { this.mode = 'insert'; this.row = r; return this; }
  upsert(rows, opts = {}) { this.mode = 'upsert'; this.rows = Array.isArray(rows) ? rows : [rows]; this.opts = opts; return this; }
  _rows() { let rs = this.db.t[this.table] || []; for (const fn of this.f) rs = rs.filter(fn); return this.n ? rs.slice(0, this.n) : rs; }
  run() {
    const T = (this.db.t[this.table] = this.db.t[this.table] || []);
    if (this.mode === 'update') { const rs = this._rows(); rs.forEach(r => Object.assign(r, this.patch)); return { data: rs, error: null }; }
    if (this.mode === 'insert') { const r = { id: uuid(), state: 'upcoming', deleted_at: null, assigned_member_ids: [], ...this.row }; T.push(r); return { data: [r], error: null }; }
    if (this.mode === 'upsert') {
      const keys = (this.opts.onConflict || 'id').split(',').map(s => s.trim());
      for (const row of this.rows) { const hit = T.find(r => keys.every(k => r[k] === row[k])); if (hit) { if (!this.opts.ignoreDuplicates) Object.assign(hit, row); } else T.push({ id: uuid(), ...row }); }
      return { data: null, error: null };
    }
    return { data: this._rows(), error: null };
  }
  async maybeSingle() { const { data, error } = this.run(); return error ? { data: null, error } : { data: data[0] || null, error: null }; }
  async single()      { const { data, error } = this.run(); return error ? { data: null, error } : { data: data[0] || null, error: data[0] ? null : { code: 'PGRST116' } }; }
  then(res, rej) { try { res(this.run()); } catch (e) { rej(e); } }
}
function makeDb({ vendor = {}, events = [], team = [] } = {}) {
  const db = { t: {
    vendors: [{ id: vendor.id, category: 'photographer', slot_capacity: null, ...vendor }],
    events: events.map(e => ({ state: 'upcoming', deleted_at: null, notes: null, slot: null, event_time: null, ready_by: null, assigned_member_ids: [], ...e })),
    team_members: team.map(m => ({ active: true, deleted_at: null, ...m })),
    crew_confirmations: [],
  } };
  return { api: { from: (t) => new Q(db, t), schema() { return this; } }, db };
}

// ══════════════════════════════════════════════════════════════════════════
let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  PASS  ' + m)) : (fail++, console.log('  FAIL  ' + m)); };
const sec = (t) => console.log('\n── ' + t + ' ──');

const V = uuid('1'), AG = uuid('e'), RAHUL = uuid('a'), EVID = uuid('d');
const DATE = '2026-07-24';
const patchReq = (api, eventId, body) => ({ app: { locals: { supabase: api } }, vendor: { id: V }, params: { eventId }, body, auth: { user_id: uuid() } });
const dayReq   = (api, date) => ({ app: { locals: { supabase: api } }, vendor: { id: V }, params: { vendorId: V, date } });
const seedOne = (crew = []) => ({ vendor: { id: V, category: 'photographer', slot_capacity: 9 }, team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }], events: [{ id: EVID, vendor_id: V, title: 'Verma reception', event_date: DATE, event_time: '19:00', slot: 'evening', kind: 'shoot', assigned_member_ids: crew }] });

(async () => {

// ─────────────────────────────────────────────────────────────────────────
sec('(i) PATCH with an array — row SETs, note-trail + crew_confirmations fire');
{
  const { api, db } = makeDb(seedOne([]));
  const r = await invoke(PATCH, patchReq(api, EVID, { assigned_member_ids: [RAHUL] }));
  const row = db.t.events.find(e => e.id === EVID);
  ok(r.status === 200 && r.body.ok === true, 'handler 200 ok');
  ok(Array.isArray(row.assigned_member_ids) && row.assigned_member_ids.includes(RAHUL), 'RAHUL SET on the row');
  ok(/Rahul assigned — \d+ \w{3}/.test(row.notes || ''), 'note-trail "Rahul assigned — DD Mon" fired (sealed core)');
  ok((db.t.crew_confirmations || []).some(c => c.event_id === EVID && c.member_id === RAHUL), 'crew_confirmations upserted (sealed core)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('(ii) PATCH WITHOUT the field — crew untouched (writeEvent undefined law)');
{
  const { api, db } = makeDb(seedOne([RAHUL]));
  const r = await invoke(PATCH, patchReq(api, EVID, { title: 'Verma reception (garden)' }));
  const row = db.t.events.find(e => e.id === EVID);
  ok(r.status === 200 && r.body.ok === true, 'handler 200 ok');
  ok(JSON.stringify(row.assigned_member_ids) === JSON.stringify([RAHUL]), 'crew UNTOUCHED — still [RAHUL] (undefined = do not touch)');
  ok(row.title === 'Verma reception (garden)', 'the title edit still landed (the field the PATCH carried)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('(iii) PATCH with [] — crew cleared');
{
  const { api, db } = makeDb(seedOne([RAHUL]));
  const r = await invoke(PATCH, patchReq(api, EVID, { assigned_member_ids: [] }));
  const row = db.t.events.find(e => e.id === EVID);
  ok(r.status === 200 && r.body.ok === true, 'handler 200 ok');
  ok(Array.isArray(row.assigned_member_ids) && row.assigned_member_ids.length === 0, 'crew CLEARED — [] SET the empty set');
}

// ─────────────────────────────────────────────────────────────────────────
sec('(iv) IDENTICAL-ROW PROOF (spec §9) — CRUD-path assign === Victor-path assign');
{
  // Two identical fixtures; CRUD PATCH on one, Victor donna_assign_crew on the other.
  const crud = makeDb(seedOne([]));
  await invoke(PATCH, patchReq(crud.api, EVID, { assigned_member_ids: [RAHUL] }));
  const crudRow = crud.db.t.events.find(e => e.id === EVID);

  const vic = makeDb(seedOne([]));
  const crewResult = { tool_calls: [ { name: 'dear_donna_talk', donna_calls: [ { name: 'donna_assign_crew', input: { event_id: 'Verma', member: 'Rahul', action: 'assign' } } ] } ] };
  await mutateEvents({ app: { locals: { supabase: vic.api } }, vendor: { id: V }, agentId: AG }, crewResult);
  const vicRow = vic.db.t.events.find(e => e.id === EVID);

  // Same SET, same note-trail, same crew_confirmations — the three things spec §9 names.
  ok(JSON.stringify(crudRow.assigned_member_ids) === JSON.stringify(vicRow.assigned_member_ids), 'assigned_member_ids IDENTICAL across both paths');
  ok((crudRow.notes || '') === (vicRow.notes || ''), 'note-trail IDENTICAL across both paths');
  const cc = (db) => (db.t.crew_confirmations || []).map(c => `${c.event_id}:${c.member_id}:${c.status}`).sort().join('|');
  ok(cc(crud.db) === cc(vic.db) && cc(crud.db).length > 0, 'crew_confirmations IDENTICAL across both paths');
}

// ─────────────────────────────────────────────────────────────────────────
sec('(v) bad shape (non-array) — 400 before the writer, no write');
{
  const { api, db } = makeDb(seedOne([]));
  const r = await invoke(PATCH, patchReq(api, EVID, { assigned_member_ids: 'rahul' }));
  const row = db.t.events.find(e => e.id === EVID);
  ok(r.status === 400 && r.body.ok === false, '400 rejected');
  ok(/must be an array/.test(r.body.error || ''), 'the shape message (matches the kind-guard register)');
  ok((row.assigned_member_ids || []).length === 0 && !(row.notes || ''), 'NO write fired (crew empty, no trail)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('(vi) [seam b] the day-fetch payload carries assigned_member_ids, always-an-array');
{
  // one event WITH crew, one WITHOUT (null seed) -> both ride the payload as arrays.
  const EV2 = uuid('c');
  const { api } = makeDb({
    vendor: { id: V, category: 'photographer', slot_capacity: 9 },
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
    events: [
      { id: EVID, vendor_id: V, title: 'Verma reception', event_date: DATE, event_time: '19:00', slot: 'evening', kind: 'shoot', assigned_member_ids: [RAHUL] },
      { id: EV2,  vendor_id: V, title: 'Iyer recce', event_date: DATE, event_time: '11:00', slot: 'morning', kind: 'recce', assigned_member_ids: null },
    ],
  });
  const r = await invoke(DAYGET, dayReq(api, DATE));
  ok(r.status === 200 && r.body.ok === true, 'day handler 200 ok');
  const withCrew = (r.body.events || []).find(e => e.id === EVID);
  const without  = (r.body.events || []).find(e => e.id === EV2);
  ok(withCrew && JSON.stringify(withCrew.assigned_member_ids) === JSON.stringify([RAHUL]), 'crewed event rides its array on the payload');
  ok(without && Array.isArray(without.assigned_member_ids) && without.assigned_member_ids.length === 0, 'null crew normalized to [] (always-an-array contract)');
  // The proven double's select() is a no-op (returns full rows), so it cannot witness
  // the SELECT column list — in production Postgres that list IS load-bearing (a column
  // absent from the select comes back undefined). Assert it at source, the estate's own
  // b6 §4 precedent for a fact a behavioural double cannot reach. This line fails the
  // moment assigned_member_ids leaves the day-fetch select.
  const daySrc = require('fs').readFileSync(path.join(ROOT, 'src/api/vendor/day.js'), 'utf8');
  ok(/\.select\(\s*'[^']*assigned_member_ids/.test(daySrc), 'seam b: the day-fetch SELECT carries assigned_member_ids (source)');
}

// ─────────────────────────────────────────────────────────────────────────
console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('BENCH CRASHED:', e); process.exit(2); });
