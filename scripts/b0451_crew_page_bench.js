#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
// scripts/b0451_crew_page_bench.js — TDW_04.5 P3, THE CREW PAGE bench.
//
//   node scripts/b0451_crew_page_bench.js
//
// WHAT IT DRIVES: the REAL routers — `src/api/crew.js` and `src/api/vendor/studio/
// team.js` — mounted on a REAL express app answering REAL HTTP on an ephemeral port.
// It does not call the builders directly, because THE CAPABILITY LAW is a statement
// about what leaves the process: the only honest way to assert that a phone number is
// absent from the response is to read the response. The CE ruled exactly that as
// acceptance ("the bench asserts phone/amount fields ABSENT FROM THE RESPONSE, not
// merely unselected"), so the assertion walks the whole serialized body and fails on
// the VALUE appearing anywhere at any depth — not on a key it remembered to check.
//
// The in-memory supabase runs its filters for real (the b0457_crew_bench Q class,
// extended here with `contains` for 0087 §A's GIN predicate and with a NAMESPACED
// engine schema, because this door reads `public.users` AND `engine.users` in one
// chain and a harness that collapsed them would prove nothing about either).
// NOTHING UNDER TEST IS STUBBED. The only doubles are the network and the three auth
// middlewares on the team router — the exact allowance b0450_bands_bench declares in
// its own header, and this door has no auth of its own to double.
//
// BOTH-WAYS (the law), BY MUTATION OF PRODUCTION CODE, never of test setup:
//   (i)   In src/api/crew.js::buildCrewPage, delete BOTH halves of the read gate — the
//         `.contains('assigned_member_ids', [member.id])` clause and the JS
//         re-assertion under it (the gate has two halves on purpose; removing one is
//         caught by the other, which is the whole point of writing it twice).
//         RE-RUN: section 3 goes RED — another member's function appears on this
//         member's board.
//   (ii)  Two forms, because the first taught something and both are recorded:
//         (a) In the assignment map, add `...e` before the eight named fields (the
//             natural shortcut, and the mistake THE CAPABILITY LAW exists to stop).
//             RE-RUN: section 2 goes RED on the member-id and exact-field asserts —
//             but NOT on the F7 asserts, because the events select list had ALREADY
//             excluded `notes`. Two layers, and the bench sees the outer one fail
//             while the inner one holds. Recorded as witnessed, not as predicted.
//         (b) ALSO add `notes` to that same select list, i.e. defeat both layers.
//             RE-RUN: section 2 now goes RED on the F7 asserts too — Rhea Malhotra's
//             preference and the "4,50,000 due" sentence reach a public URL.
//   (iii) In confirmAssignment, delete the `assigned_member_ids.includes(member.id)`
//         refusal. RE-RUN: section 4 goes RED on exactly the write-gate asserts — an
//         unassigned member writes a confirmation to somebody else's function.
//   (iv)  In src/api/vendor/studio/team.js, revert `MEMBER_COLS` to `'*'`.
//         RE-RUN: section 8 goes RED on exactly the F-04.106 asserts.
// Each mutation is reverted after witnessing and the file re-verified byte-identical.
// The red sets are recorded in the handover.
//
// ⚠ ONE MUTATION THAT DOES *NOT* GO RED, DISCLOSED RATHER THAN DRESSED UP: widening the
//   engine hop's `.select('id, client')` to `.select('*')` changes nothing this bench
//   can see. That is not a hole — it is the boundary working as designed. The response
//   is assembled field by named field, so an over-broad QUERY still cannot produce an
//   over-broad ANSWER. The select list is defence in depth (it keeps the money and the
//   client's phone out of process memory at all), and its narrowness is asserted by
//   reading the source in the handover, not by this bench. Said plainly because a
//   mutation table with a line that quietly never fires is worse than a shorter one.
//
// ⚠ WHAT IT DOES NOT PROVE, NAMED: that the PWA renders any of this; that the founder's
//   test vendor is on the Prestige tier (no DB reach from an LE container — which is
//   why the smoke card's first step is self-witnessing); that Meta/WhatsApp delivers
//   the wa.me link. The wire contract and the boundary are what this bench owns.
// ══════════════════════════════════════════════════════════════════════════════
'use strict';

const path    = require('path');
const http    = require('http');
const express = require('express');
const ROOT    = path.resolve(__dirname, '..');

// ── the auth doubles, installed BEFORE team.js is required ───────────────────
// requireAuth / resolveVendor / requirePrestige are the declared-permissible doubles.
// Everything inside the team router's handlers is the real thing.
const VENDOR = { id: 'c0ffee00-0000-4000-8000-000000000001', user_id: 'u1', business_name: 'Vera Studios' };
function stub(rel, mod) {
  const p = require.resolve(path.join(ROOT, rel));
  require.cache[p] = { id: p, filename: p, loaded: true, exports: mod };
}
stub('src/api/middleware/requireAuth',    (req, _res, next) => { req.auth = { user_id: 'u1' }; next(); });
stub('src/api/middleware/resolveVendor',  () => (req, _res, next) => { req.vendor = VENDOR; next(); });
stub('src/api/middleware/requirePrestige', (req, _res, next) => next());

const crewRouter = require(path.join(ROOT, 'src/api/crew.js'));
const teamRouter = require(path.join(ROOT, 'src/api/vendor/studio/team.js'));
const { _resetBuckets, LIMIT_GET, LIMIT_POST, LIMIT_IP_MISS, OPEN_TASK_STATES, istToday } = crewRouter;

let pass = 0, fail = 0;
const ok  = (c, m) => { if (c) { pass++; console.log('  PASS  ' + m); } else { fail++; console.log('  FAIL  ' + m); } };
const sec = (t) => console.log('\n── ' + t + ' ──');

// ══════════════════════════════════════════════════════════════════════════════
// An in-memory supabase. Filters run for real; nothing is faked past the wire.
// ══════════════════════════════════════════════════════════════════════════════
class Q {
  constructor(db, table) { this.db = db; this.table = table; this.f = []; this.n = null; this.mode = 'select'; this.cols = null; }
  // PROJECTION IS REAL. A harness that ignored the select list would let a `select('*')`
  // regression pass unnoticed, which is precisely the class F-04.106 names.
  select(cols) { this.cols = cols || null; return this; }
  _project(rows) {
    if (!this.cols || this.cols === '*') return rows;
    const keys = this.cols.split(',').map(s => s.trim()).filter(Boolean);
    return rows.map(r => { const o = {}; for (const k of keys) if (k in r) o[k] = r[k]; return o; });
  }
  eq(c, v)  { this.f.push(r => r[c] === v); return this; }
  neq(c, v) { this.f.push(r => r[c] !== v); return this; }
  is(c, v)  { this.f.push(r => (r[c] === undefined ? null : r[c]) === v); return this; }
  in(c, vs) { this.f.push(r => vs.includes(r[c])); return this; }
  gte(c, v) { this.f.push(r => r[c] != null && r[c] >= v); return this; }
  lte(c, v) { this.f.push(r => r[c] != null && r[c] <= v); return this; }
  // 0087 §A's GIN containment: does the array column contain every wanted element?
  contains(c, vs) { this.f.push(r => Array.isArray(r[c]) && vs.every(v => r[c].includes(v))); return this; }
  order()   { return this; }
  limit(n)  { this.n = n; return this; }
  update(p) { this.mode = 'update'; this.patch = p; return this; }
  insert(r) { this.mode = 'insert'; this.row = r; return this; }
  upsert(rows, opts = {}) { this.mode = 'upsert'; this.rows = Array.isArray(rows) ? rows : [rows]; this.opts = opts; return this; }
  _rows() { let rs = this.db.t[this.table] || []; for (const fn of this.f) rs = rs.filter(fn); return this.n ? rs.slice(0, this.n) : rs; }
  run() {
    const T = (this.db.t[this.table] = this.db.t[this.table] || []);
    if (this.db.fail[this.table]) return { data: null, error: { message: `${this.table} exploded` } };
    if (this.mode === 'update') { const rs = this._rows(); rs.forEach(r => Object.assign(r, this.patch)); return { data: this._project(rs), error: null }; }
    if (this.mode === 'insert') {
      const stamp = new Date().toISOString();
      const r = { id: 'new-' + (T.length + 1), active: true, deleted_at: null, role: null, phone: null,
                  daily_rate_inr: null, notes: null, roster_vendor_id: null,
                  page_token: 'eeeeeeee-0000-4000-8000-00000000000e',
                  created_at: stamp, updated_at: stamp, ...this.row };
      T.push(r); return { data: this._project([r]), error: null };
    }
    if (this.mode === 'upsert') {
      const keys = (this.opts.onConflict || 'id').split(',').map(s => s.trim());
      for (const row of this.rows) {
        const hitRow = T.find(r => keys.every(k => r[k] === row[k]));
        if (hitRow) { if (!this.opts.ignoreDuplicates) Object.assign(hitRow, row); }
        else T.push({ id: 'c-' + (T.length + 1), ...row });
      }
      return { data: null, error: null };
    }
    return { data: this._project(this._rows()), error: null };
  }
  async maybeSingle() { const { data, error } = this.run(); return error ? { data: null, error } : { data: data[0] || null, error: null }; }
  async single()      { const { data, error } = this.run(); return error ? { data: null, error } : { data: data[0] || null, error: data[0] ? null : { code: 'PGRST116' } }; }
  then(res, rej) { try { res(this.run()); } catch (e) { rej(e); } }
}

// THE ENGINE SCHEMA IS NAMESPACED, deliberately. resolveAgentIdReadOnly walks
// public.users -> engine.users -> engine.agents; a harness that let `.schema('engine')`
// return the same `users` table as the public client would make that chain pass for
// the wrong reason and would hide a real cross-plane mistake.
function makeClient(db) {
  return {
    from: (t) => new Q(db, t),
    schema: (s) => ({ from: (t) => new Q(db, s === 'engine' ? `engine:${t}` : t) }),
  };
}

// ── fixtures (the Vera-era names) ───────────────────────────────────────────
const TOK_SWATI = 'aaaaaaaa-0000-4000-8000-000000000001';
const TOK_ISHAAN = 'bbbbbbbb-0000-4000-8000-000000000002';
const TOK_GONE  = 'cccccccc-0000-4000-8000-000000000003';   // never existed
const M_SWATI   = 'a1b20000-0000-4000-8000-00000000000a';
const M_ISHAAN  = 'a1b20000-0000-4000-8000-00000000000b';
const M_DEAD    = 'a1b20000-0000-4000-8000-00000000000c';
const E_SANGEET = 'e0000000-0000-4000-8000-0000000000a1';
const E_RECCE   = 'e0000000-0000-4000-8000-0000000000a2';
const E_OTHER   = 'e0000000-0000-4000-8000-0000000000a3';   // Ishaan's, not Swati's
const E_PAST    = 'e0000000-0000-4000-8000-0000000000a4';
const E_CANX    = 'e0000000-0000-4000-8000-0000000000a5';
const T_OPEN    = 'facade00-0000-4000-8000-0000000000b1';
const T_DONE    = 'facade00-0000-4000-8000-0000000000b2';
const T_OTHER   = 'facade00-0000-4000-8000-0000000000b3';
const B_RHEA    = 'bead0000-0000-4000-8000-0000000000c1';

const TOMORROW = new Date(Date.now() + 5.5 * 3600e3 + 86400e3).toISOString().slice(0, 10);
const NEXTWEEK = new Date(Date.now() + 5.5 * 3600e3 + 7 * 86400e3).toISOString().slice(0, 10);
const LASTYEAR = '2001-01-01';

const CLIENT_PHONE = '+919812345678';
const CLIENT_MONEY = 1250000;

function freshDb(over = {}) {
  const db = { fail: {}, t: {
    team_members: [
      { id: M_SWATI,  vendor_id: VENDOR.id, name: 'Swati Rao',  role: 'coordinator', phone: '+918757788550',
        daily_rate_inr: 5000, notes: 'weekends only', active: true, deleted_at: null, page_token: TOK_SWATI,
        roster_vendor_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
      { id: M_ISHAAN, vendor_id: VENDOR.id, name: 'Ishaan Puri', role: 'assistant', phone: '+919000000002',
        daily_rate_inr: 3000, notes: null, active: true, deleted_at: null, page_token: TOK_ISHAAN,
        roster_vendor_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
      { id: M_DEAD,   vendor_id: VENDOR.id, name: 'Nikita Sen', role: null, phone: null,
        daily_rate_inr: null, notes: null, active: false, deleted_at: '2026-01-01', page_token: TOK_GONE,
        roster_vendor_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    ],
    vendors: [{ id: VENDOR.id, user_id: 'u1', business_name: 'Vera Studios' }],
    users:   [{ id: 'u1', auth_user_id: 'auth-1', name: 'Vera', phone: '+910000000000' }],
    events: [
      { id: E_SANGEET, vendor_id: VENDOR.id, title: 'Rhea sangeet', kind: 'ceremony', slot: 'evening',
        event_date: TOMORROW, event_time: '18:30:00', state: 'upcoming', deleted_at: null,
        linked_binder_id: B_RHEA, assigned_member_ids: [M_SWATI],
        notes: 'Client Rhea Malhotra prefers no flash. Balance 4,50,000 due.' },
      { id: E_RECCE,   vendor_id: VENDOR.id, title: 'Ananya recce', kind: 'recce', slot: null,
        event_date: NEXTWEEK, event_time: null, state: 'upcoming', deleted_at: null,
        linked_binder_id: null, assigned_member_ids: [M_SWATI, M_ISHAAN], notes: null },
      { id: E_OTHER,   vendor_id: VENDOR.id, title: 'Kapoor mehendi', kind: 'ceremony', slot: 'morning',
        event_date: TOMORROW, event_time: '09:00:00', state: 'upcoming', deleted_at: null,
        linked_binder_id: null, assigned_member_ids: [M_ISHAAN], notes: null },
      { id: E_PAST,    vendor_id: VENDOR.id, title: 'old shoot', kind: 'shoot', slot: 'full_day',
        event_date: LASTYEAR, event_time: null, state: 'upcoming', deleted_at: null,
        linked_binder_id: null, assigned_member_ids: [M_SWATI], notes: null },
      { id: E_CANX,    vendor_id: VENDOR.id, title: 'called off', kind: 'ceremony', slot: 'evening',
        event_date: TOMORROW, event_time: null, state: 'cancelled', deleted_at: null,
        linked_binder_id: null, assigned_member_ids: [M_SWATI], notes: null },
    ],
    crew_confirmations: [],
    team_tasks: [
      { id: T_OPEN,  vendor_id: VENDOR.id, assigned_to_member_id: M_SWATI, title: 'Carry the spare battery',
        description: 'Two of them.', due_date: TOMORROW, priority: 'high', state: 'open',
        completed_at: null, deleted_at: null },
      { id: T_DONE,  vendor_id: VENDOR.id, assigned_to_member_id: M_SWATI, title: 'already finished',
        description: null, due_date: null, priority: 'normal', state: 'done',
        completed_at: '2026-01-01T00:00:00Z', deleted_at: null },
      { id: T_OTHER, vendor_id: VENDOR.id, assigned_to_member_id: M_ISHAAN, title: "Ishaan's own task",
        description: null, due_date: null, priority: 'normal', state: 'open',
        completed_at: null, deleted_at: null },
    ],
    'engine:users':  [{ id: 'eu1', auth_user_id: 'auth-1' }],
    'engine:agents': [{ id: 'ag1', user_id: 'eu1' }],
    'engine:records': [
      { id: B_RHEA, agent_id: 'ag1', client: 'Rhea Malhotra', phone: CLIENT_PHONE,
        amount: CLIENT_MONEY, direction: 'in', amount_received: 300000, amount_pending: 950000,
        note: 'internal binder note' },
    ],
  } };
  Object.assign(db.t, over);
  return db;
}

// ── the server ──────────────────────────────────────────────────────────────
let BASE = null, server = null, DB = null;
function boot() {
  const app = express();
  app.set('trust proxy', true);
  // src/index.js:97-98 mounts these app-wide; the team router relies on req.body being
  // parsed by the app. Mirrored here so the router under test runs in its real world.
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.locals.supabase = makeClient((DB = freshDb()));
  app.use('/api/v2/crew', crewRouter);
  app.use('/api/v2/vendor/studio/team', teamRouter);
  return new Promise((res) => {
    server = http.createServer(app).listen(0, '127.0.0.1', () => {
      BASE = `http://127.0.0.1:${server.address().port}`;
      res();
    });
  });
}
function reset() { DB = freshDb(); server.listeners('request')[0].locals.supabase = makeClient(DB); _resetBuckets(); }

async function GET(p, headers = {}) {
  const r = await fetch(BASE + p, { headers });
  const text = await r.text();
  let body = null; try { body = JSON.parse(text); } catch { /* non-JSON is itself a fact */ }
  return { status: r.status, body, text };
}
async function POST(p, payload, headers = {}) {
  const r = await fetch(BASE + p, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  });
  const text = await r.text();
  let body = null; try { body = JSON.parse(text); } catch { /* ditto */ }
  return { status: r.status, body, text };
}

/** Does this VALUE appear anywhere in the serialized response, at any depth? */
const leaks = (text, v) => text.includes(String(v));

(async () => {
await boot();

// ═══ 1. THE TOKEN — resolution and the ONE dead shape ════════════════════════
sec('1. the token — resolution, and never-existed ≡ rotated (F2)');
{
  reset();
  const good = await GET(`/api/v2/crew/${TOK_SWATI}`);
  ok(good.status === 200 && good.body.ok === true, 'a live token resolves 200');
  ok(good.body.member.name === 'Swati Rao', 'the page knows whose it is');
  ok(good.body.vendor.name === 'Vera Studios', 'the vendor eyebrow is the business name');

  const never = await GET('/api/v2/crew/99999999-0000-4000-8000-000000000009');
  ok(never.status === 404, 'a token that never existed is 404');
  ok(!leaks(never.text, 'Vera'), 'the dead body names no vendor');
  ok(!leaks(never.text, 'Swati'), 'the dead body names no member');

  // ROTATION: the same shape, byte for byte. This is F2's whole point.
  DB.t.team_members.find(m => m.id === M_SWATI).page_token = 'ffffffff-0000-4000-8000-00000000000f';
  const rotated = await GET(`/api/v2/crew/${TOK_SWATI}`);
  ok(rotated.status === 404, 'a ROTATED token is 404');
  ok(rotated.text === never.text, 'ROTATED ≡ NEVER-EXISTED, byte-identical body (F2)');

  const malformed = await GET('/api/v2/crew/not-a-uuid');
  ok(malformed.status === 404, 'a malformed token is 404, not a 500 and not a query');

  reset();
  const dead = await GET(`/api/v2/crew/${TOK_GONE}`);
  ok(dead.status === 404, 'a DEACTIVATED/soft-deleted member’s token is dead too');
  ok(!leaks(dead.text, 'Nikita'), 'and it names nobody either');
}

// ═══ 2. THE CAPABILITY LAW — by RESPONSE SHAPE (CE-ruled acceptance) ═════════
sec('2. THE CAPABILITY LAW — asserted on the response, not on the query');
{
  reset();
  const r = await GET(`/api/v2/crew/${TOK_SWATI}`);
  const t = r.text;

  ok(!leaks(t, CLIENT_MONEY),  'NO vendor financials: the binder amount is absent from the response');
  ok(!leaks(t, 300000),        'NO vendor financials: amount_received is absent');
  ok(!leaks(t, 950000),        'NO vendor financials: amount_pending is absent');
  ok(!leaks(t, CLIENT_PHONE),  'NO client phone: engine.records.phone is absent');
  ok(!leaks(t, 'internal binder note'), 'no engine binder note rides along');

  // F7 — the fork that mattered. events.notes carries client prose in this estate.
  ok(!leaks(t, 'Rhea Malhotra prefers no flash'), 'F7: events.notes NEVER leaves the vendor plane');
  ok(!leaks(t, '4,50,000'),    'F7: and neither does the money sentence inside it');
  ok(leaks(t, 'Rhea Malhotra'), 'the WEDDING TITLE does ship — the one client datum the spec allows');

  ok(!leaks(t, 'Ishaan'),      'NO other members: Ishaan is on a shared function and is still absent');
  ok(!leaks(t, "Ishaan's own task"), 'NO other members: his tasks are absent');
  ok(!leaks(t, '+918757788550'), 'not even THIS member’s own phone (unasked, so unshipped)');
  ok(!leaks(t, 5000),          'no daily_rate_inr');
  ok(!leaks(t, 'weekends only'), 'no member notes');
  ok(!leaks(t, M_SWATI),       'no member id on the wire');
  ok(!leaks(t, VENDOR.id),     'no vendor id on the wire');
  ok(!leaks(t, 'Kapoor mehendi'), 'no function this member is not on');

  const keys = Object.keys(r.body).sort().join(',');
  ok(keys === 'assignments,member,ok,tasks,vendor', `the top-level shape is exactly {ok,member,vendor,assignments,tasks} (got ${keys})`);
  ok(Object.keys(r.body.member).join(',') === 'name', 'member carries a name and nothing else');
  ok(Object.keys(r.body.vendor).join(',') === 'name', 'vendor carries a name and nothing else');
  const a = r.body.assignments.find(x => x.event_id === E_SANGEET);
  ok(Object.keys(a).sort().join(',') === 'call_time,confirmation,date,event_id,note,slot,title,wedding',
     'an assignment carries exactly the eight chartered fields');
}

// ═══ 3. THE READ GATE — assigned_member_ids, load-bearing ════════════════════
sec('3. the read gate — assigned_member_ids (Ruling №2, CE ruling F5)');
{
  reset();
  const r = await GET(`/api/v2/crew/${TOK_SWATI}`);
  const ids = r.body.assignments.map(x => x.event_id);
  ok(ids.includes(E_SANGEET), 'a function this member is assigned to is on the board');
  ok(ids.includes(E_RECCE),   'a SHARED function is on the board (both are assigned)');
  ok(!ids.includes(E_OTHER),  'THE GATE: a function assigned to ANOTHER member is not');
  ok(!ids.includes(E_PAST),   'past functions are not "upcoming"');
  ok(!ids.includes(E_CANX),   'the covenant holds: cancelled is not on the board');
  ok(ids.length === 2,        'exactly two functions survive the gate');

  // The stale-row case Ruling №2 created: confirmations are NOT pruned on unassign.
  DB.t.crew_confirmations.push({ id: 'c-stale', event_id: E_OTHER, member_id: M_SWATI, status: 'confirmed', note: null });
  const r2 = await GET(`/api/v2/crew/${TOK_SWATI}`);
  ok(!r2.body.assignments.some(x => x.event_id === E_OTHER),
     'a STALE confirmations row does NOT resurrect an unassigned function (the gate is on assigned_member_ids, not on the response table)');

  const sorted = r.body.assignments.map(x => x.date);
  ok(sorted[0] <= sorted[1], 'the board is in date order — soonest first');
}

// ═══ 4. CONFIRM — both states, the write gate, last-write-wins ═══════════════
sec('4. confirm/decline — 0087 §D’s states, the write gate, F5’s semantics');
{
  reset();
  const c1 = await POST(`/api/v2/crew/${TOK_SWATI}/confirm`, { event_id: E_SANGEET, status: 'confirmed' });
  ok(c1.status === 200 && c1.body.status === 'confirmed', 'confirmed writes');
  let row = DB.t.crew_confirmations.find(r => r.event_id === E_SANGEET && r.member_id === M_SWATI);
  ok(!!row && row.status === 'confirmed', 'the row exists in crew_confirmations with status confirmed');
  ok(!!row.updated_at, 'updated_at is set EXPLICITLY (0087 §D declares a default but no trigger)');
  const firstStamp = row.updated_at;

  await new Promise(r => setTimeout(r, 5));
  const c2 = await POST(`/api/v2/crew/${TOK_SWATI}/confirm`, { event_id: E_SANGEET, status: 'declined', note: 'Fever, sorry.' });
  ok(c2.status === 200 && c2.body.status === 'declined', 'declined writes over confirmed (F5(a): last write wins)');
  row = DB.t.crew_confirmations.find(r => r.event_id === E_SANGEET && r.member_id === M_SWATI);
  ok(row.status === 'declined', 'the SAME row moved — unique(event_id,member_id) held, no duplicate');
  ok(DB.t.crew_confirmations.filter(r => r.event_id === E_SANGEET && r.member_id === M_SWATI).length === 1,
     'exactly one row for the pair, ever');
  ok(row.note === 'Fever, sorry.', 'the decline note is stored');
  ok(row.updated_at !== firstStamp, 'updated_at MOVED on the second write');

  const c3 = await POST(`/api/v2/crew/${TOK_SWATI}/confirm`, { event_id: E_SANGEET, status: 'confirmed' });
  ok(c3.status === 200, 'declined -> confirmed is allowed (F5(a) ruled: the member may change their mind)');

  const bad = await POST(`/api/v2/crew/${TOK_SWATI}/confirm`, { event_id: E_SANGEET, status: 'pending' });
  ok(bad.status === 400, "'pending' is NOT respondable — only the assignment write mints it");
  const bad2 = await POST(`/api/v2/crew/${TOK_SWATI}/confirm`, { event_id: E_SANGEET, status: 'maybe' });
  ok(bad2.status === 400, 'a status outside 0087 §D:80’s CHECK is refused at the door');

  // THE WRITE GATE — the half that a read-only gate would have missed.
  const before = DB.t.crew_confirmations.length;
  const gated = await POST(`/api/v2/crew/${TOK_SWATI}/confirm`, { event_id: E_OTHER, status: 'confirmed' });
  ok(gated.status === 404, 'THE WRITE GATE: confirming a function you are not on is 404');
  ok(DB.t.crew_confirmations.length === before, 'and it wrote NOTHING');
  ok(!leaks(gated.text, 'Kapoor'), 'the refusal does not confirm the event even exists');

  const canx = await POST(`/api/v2/crew/${TOK_SWATI}/confirm`, { event_id: E_CANX, status: 'confirmed' });
  ok(canx.status === 404, 'a cancelled function cannot be confirmed');

  // The ring the vendor will see.
  reset();
  await POST(`/api/v2/crew/${TOK_SWATI}/confirm`, { event_id: E_SANGEET, status: 'declined', note: 'Fever.' });
  const back = await GET(`/api/v2/crew/${TOK_SWATI}`);
  const a = back.body.assignments.find(x => x.event_id === E_SANGEET);
  ok(a.confirmation === 'declined', 'the decline round-trips to the member’s own page');
  ok(a.note === 'Fever.', 'F7: `note` is the member’s OWN note, read back from crew_confirmations');
  const un = back.body.assignments.find(x => x.event_id === E_RECCE);
  ok(un.confirmation === 'pending', 'an unanswered assignment reads pending — absence and pending agree');
  ok(un.note === null, 'and carries no note');
}

// ═══ 5. TASKS — the vendor door’s own predicate (CE ruling F4) ═══════════════
sec('5. tasks — "open" and "assigned to them", adopted whole');
{
  reset();
  ok(OPEN_TASK_STATES.join(',') === 'open,in_progress',
     'the open predicate is the vendor door’s own (studio/tasks.js:37) and the DB index’s (PUBLIC_SCHEMA.md:2499)');
  const r = await GET(`/api/v2/crew/${TOK_SWATI}`);
  const ids = r.body.tasks.map(t => t.task_id);
  ok(ids.includes(T_OPEN),  'an open task assigned to this member is on the page');
  ok(!ids.includes(T_DONE), 'a done task is not');
  ok(!ids.includes(T_OTHER), 'another member’s open task is not');
  ok(r.body.tasks.length === 1, 'exactly one task survives');

  DB.t.team_tasks.find(t => t.id === T_OPEN).state = 'in_progress';
  const r2 = await GET(`/api/v2/crew/${TOK_SWATI}`);
  ok(r2.body.tasks.length === 1, "in_progress counts as open — the vendor door's second state, not dropped");

  DB.t.team_tasks.find(t => t.id === T_OPEN).deleted_at = '2026-01-01';
  const r3 = await GET(`/api/v2/crew/${TOK_SWATI}`);
  ok(r3.body.tasks.length === 0, 'a soft-deleted task is gone');
}

sec('6. task completion — the vendor door’s own transition, and its gate');
{
  reset();
  const done = await POST(`/api/v2/crew/${TOK_SWATI}/task`, { task_id: T_OPEN, done: true });
  ok(done.status === 200, 'completing your own open task works');
  const row = DB.t.team_tasks.find(t => t.id === T_OPEN);
  ok(row.state === 'done', "state -> 'done' (studio/tasks.js:88's shape, copied not invented)");
  ok(row.completed_at && row.completed_at !== null, 'completed_at is stamped in the same motion');

  const again = await POST(`/api/v2/crew/${TOK_SWATI}/task`, { task_id: T_OPEN, done: true });
  ok(again.status === 404, 'completing an already-done task is a no-op 404 (the state gate holds)');

  const other = await POST(`/api/v2/crew/${TOK_SWATI}/task`, { task_id: T_OTHER, done: true });
  ok(other.status === 404, 'THE GATE: completing ANOTHER member’s task is 404');
  ok(DB.t.team_tasks.find(t => t.id === T_OTHER).state === 'open', 'and it did not move');

  const nodone = await POST(`/api/v2/crew/${TOK_SWATI}/task`, { task_id: T_OTHER });
  ok(nodone.status === 400, 'done:true is required — the door does not guess intent');

  const junk = await POST(`/api/v2/crew/${TOK_SWATI}/task`, { task_id: "1; drop table team_tasks", done: true });
  ok(junk.status === 404, 'a task_id that is not a uuid is refused at the door, before any query');
  const junk2 = await POST(`/api/v2/crew/${TOK_SWATI}/confirm`, { event_id: 'not-a-uuid', status: 'confirmed' });
  ok(junk2.status === 404, 'and so is an event_id that is not a uuid');
}

// ═══ 7. RATE LIMITING — the CE-ruled budgets (F1) ════════════════════════════
sec('7. rate limits — the ruled budgets, per token and per IP');
{
  reset();
  let last = null;
  for (let i = 0; i < LIMIT_GET; i++) last = await GET(`/api/v2/crew/${TOK_SWATI}`);
  ok(last.status === 200, `the ${LIMIT_GET}th GET still passes (the budget is spent, not exceeded)`);
  const over = await GET(`/api/v2/crew/${TOK_SWATI}`);
  ok(over.status === 429, `the ${LIMIT_GET + 1}th GET is 429`);
  ok(!leaks(over.text, 'Swati'), 'a throttled response leaks nothing either');

  // The POST budget is its own bucket — a spent GET budget must not close the door
  // on a member who is trying to answer.
  const p = await POST(`/api/v2/crew/${TOK_SWATI}/confirm`, { event_id: E_SANGEET, status: 'confirmed' });
  ok(p.status === 200, 'the POST budget is a SEPARATE bucket from the GET budget');

  reset();
  let lastP = null;
  for (let i = 0; i < LIMIT_POST; i++) lastP = await POST(`/api/v2/crew/${TOK_SWATI}/confirm`, { event_id: E_SANGEET, status: 'confirmed' });
  ok(lastP.status === 200, `the ${LIMIT_POST}th POST still passes`);
  const overP = await POST(`/api/v2/crew/${TOK_SWATI}/confirm`, { event_id: E_SANGEET, status: 'confirmed' });
  ok(overP.status === 429, `the ${LIMIT_POST + 1}th POST is 429`);

  // The anti-enumeration bucket: misses only.
  reset();
  let lastMiss = null;
  for (let i = 0; i < LIMIT_IP_MISS; i++) {
    lastMiss = await GET(`/api/v2/crew/1111111${i % 10}-0000-4000-8000-00000000000${i % 10}`);
  }
  ok(lastMiss.status === 404, `the ${LIMIT_IP_MISS}th unresolved lookup is still 404`);
  const overMiss = await GET('/api/v2/crew/22222222-0000-4000-8000-000000000022');
  ok(overMiss.status === 429, 'the scanner is throttled per IP after the ruled ceiling');
  const stillFine = await GET(`/api/v2/crew/${TOK_SWATI}`);
  ok(stillFine.status === 200,
     'A REAL MEMBER IS UNAFFECTED BY THE SCANNER’S BUDGET — the miss bucket is spent only on misses');
}

// ═══ 8. F-04.106 — the explicit column list on team.js ═══════════════════════
sec('8. F-04.106 — team.js answers with a decision, not with *');
{
  reset();
  const r = await GET('/api/v2/vendor/studio/team');
  ok(r.status === 200 && Array.isArray(r.body.members), 'the team list still answers');
  const m = r.body.members.find(x => x.id === M_SWATI);
  ok(!!m.page_token, 'page_token IS on the wire — distribution needs it (CE-ruled IN)');
  ok(!('roster_vendor_id' in m), 'roster_vendor_id is NOT — P4’s internal bridge key stays internal');
  const cols = Object.keys(m).sort().join(',');
  ok(cols === 'active,created_at,daily_rate_inr,deleted_at,id,name,notes,page_token,phone,role,updated_at,vendor_id',
     `the shape is exactly the twelve decided columns (got ${cols})`);

  // The same decision on the write paths — a column that cannot arrive on GET must
  // not arrive on POST/PATCH either, or the class is only half dead.
  const added = await POST('/api/v2/vendor/studio/team', { name: 'Meera Nair' });
  ok(added.status === 200 && !('roster_vendor_id' in added.body.member),
     'POST answers with the same decided shape');
}

// ═══ 9. ROTATION — server-generated, body never read (CE ruling F9) ══════════
sec('9. rotate-token — the capability-forging hole, closed');
{
  reset();
  const before = DB.t.team_members.find(m => m.id === M_SWATI).page_token;
  const live = await GET(`/api/v2/crew/${before}`);
  ok(live.status === 200, 'the old link works before rotation');

  const forge = 'deadbeef-0000-4000-8000-00000000dead';
  const rot = await POST(`/api/v2/vendor/studio/team/${M_SWATI}/rotate-token`, { page_token: forge });
  ok(rot.status === 200, 'rotate answers 200');
  const after = DB.t.team_members.find(m => m.id === M_SWATI).page_token;
  ok(after !== before, 'the token CHANGED');
  ok(after !== forge, 'THE FORGE FAILED: the caller-supplied token was never read (F9)');
  ok(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(after),
     'the new token is a crypto v4 uuid — the same 122 bits 0087 §B mints');
  ok(rot.body.member.page_token === after, 'and it comes back so the page can re-share without a refetch');

  const dead = await GET(`/api/v2/crew/${before}`);
  ok(dead.status === 404, 'THE OLD LINK IS DEAD immediately');
  const fresh = await GET(`/api/v2/crew/${after}`);
  ok(fresh.status === 200 && fresh.body.member.name === 'Swati Rao', 'the new link works');

  // The PATCH hole itself, asserted shut.
  const patched = await fetch(`${BASE}/api/v2/vendor/studio/team/${M_SWATI}`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ page_token: forge, name: 'Swati Rao' }),
  });
  ok(patched.status === 200, 'PATCH still updates the fields it owns');
  ok(DB.t.team_members.find(m => m.id === M_SWATI).page_token === after,
     'PATCH CANNOT SET page_token — the allowlist refuses it silently (the spec’s struck sentence, proven shut)');
}

// ═══ 10. FAIL POSTURE — spine hard, decorations soft ════════════════════════
sec('10. fail posture — a failed read says nothing, it never says zero');
{
  reset();
  DB.fail['engine:records'] = true;
  const r = await GET(`/api/v2/crew/${TOK_SWATI}`);
  ok(r.status === 200, 'a failed binder hop does not fail the page');
  ok(r.body.assignments.find(x => x.event_id === E_SANGEET).wedding === null,
     'the wedding title is absent, never invented (ST-2 blindness, not a lie)');

  reset();
  DB.fail.team_tasks = true;
  const r2 = await GET(`/api/v2/crew/${TOK_SWATI}`);
  ok(r2.status === 200 && Array.isArray(r2.body.tasks) && r2.body.tasks.length === 0,
     'a failed tasks read soft-fails to an empty list');

  reset();
  DB.fail.crew_confirmations = true;
  const r3 = await GET(`/api/v2/crew/${TOK_SWATI}`);
  ok(r3.status === 200 && r3.body.assignments.length === 2, 'a failed confirmations read does not empty the board');

  reset();
  DB.fail.events = true;
  const r4 = await GET(`/api/v2/crew/${TOK_SWATI}`);
  ok(r4.status === 500, 'THE SPINE IS HARD: a failed events read is a failed request, never an empty board');
  ok(!leaks(r4.text, 'exploded'), 'and the DB’s own error text does not reach the public wire');
}

// ═══ 11. no engine agent -> the hop is skipped, never guessed ═══════════════
sec('11. the read-only agent chain');
{
  reset();
  DB.t['engine:agents'] = [];
  const r = await GET(`/api/v2/crew/${TOK_SWATI}`);
  ok(r.status === 200, 'no agent resolved -> the page still renders');
  ok(r.body.assignments.find(x => x.event_id === E_SANGEET).wedding === null, 'and the wedding title is elided, not guessed');
  ok(DB.t['engine:agents'].length === 0,
     'AND NOTHING WAS CREATED — the public door never mints an engine identity (agentBridge’s get-or-create is deliberately not called)');
  ok(DB.t['engine:users'].length === 1, 'engine.users untouched too');

  reset();
  DB.t.users = [];
  const r2 = await GET(`/api/v2/crew/${TOK_SWATI}`);
  ok(r2.status === 200, 'a broken public.users hop fails soft as well');
}

// ═══ 12. istToday ═══════════════════════════════════════════════════════════
sec('12. IST today');
{
  // 2026-07-22T19:00:00Z is 2026-07-23 00:30 IST — the case a UTC "today" gets wrong.
  ok(istToday(Date.parse('2026-07-22T19:00:00Z')) === '2026-07-23', 'after 18:30Z the IST date has already rolled');
  ok(istToday(Date.parse('2026-07-22T18:00:00Z')) === '2026-07-22', 'before 18:30Z it has not');
}

server.close();
console.log(`\n══ b0451_crew_page_bench: ${pass} passed, ${fail} failed ══\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('BENCH CRASHED:', e); try { server && server.close(); } catch {} process.exit(1); });
