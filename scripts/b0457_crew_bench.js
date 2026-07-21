#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b0457_crew_bench.js — TDW_04.5 P1, the CREW ASSIGNMENT ENGINE bench.
//
//   node scripts/b0457_crew_bench.js
//
// WHAT IT DRIVES: the REAL writeEvent, the REAL checkOccupancy (member_clash hoist),
// the REAL memberClashCheck, the REAL scrub — against an in-memory events / vendors /
// team_members / crew_confirmations. The ONLY doubles are the ledger (fire-and-forget by
// contract) and the network. Nothing under test is stubbed. Sibling of checker_bench.js,
// which it does not touch.
//
// BOTH-WAYS (the law): the cured tree is GREEN here. To witness the cure is non-vacuous,
// comment out the two member_clash lines in occupancy.js — the computed `memberClash`
// block above the posture gate, and the `|| memberClash` on the occupying dispatch — and
// re-run: sections 1/2/4 go RED (no clash surfaces, planner falls silent), while the
// validation / capacity-precedence / confirmations / note-trail sections stay GREEN. The
// delivery script does exactly this mutation and reverts it; the red set is disclosed.
//
// ⚠ WHAT IT DOES NOT PROVE, NAMED: that a live Victor turn or the live PWA picker wires
//   these together. The doors are the completion seam; their identical-payload property is
//   STRUCTURAL (both call this one writeEvent), and this bench proves the payload at the
//   writeEvent boundary — exactly where checker_bench.js ruled the crown proof to live.
// ══════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const EW   = path.join(ROOT, 'src/lib/vendor/eventWrite.js');
const OCC  = path.join(ROOT, 'src/lib/vendor/occupancy.js');

// ── the ONLY double: the ledger (fire-and-forget by contract) ──
const snapPath = path.join(ROOT, 'src/lib/vendor/snapshot.js');
require.cache[snapPath] = { id: snapPath, filename: snapPath, loaded: true,
  exports: { logActivity: async () => {}, fetchRecentActivity: async () => [], formatActivityBlock: () => '' } };

const { writeEvent } = require(EW);
const { checkOccupancy, memberClashCheck } = require(OCC);

// ══════════════════════════════════════════════════════════════════════════
// An in-memory supabase. Filters run for real; nothing is faked past the wire.
// upsert honours onConflict + ignoreDuplicates against the unique key.
// ══════════════════════════════════════════════════════════════════════════
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
    if (this.mode === 'insert') {
      const r = { id: uuid(), state: 'upcoming', deleted_at: null, assigned_member_ids: [], ...this.row };
      T.push(r); return { data: [r], error: null };
    }
    if (this.mode === 'upsert') {
      const keys = (this.opts.onConflict || 'id').split(',').map(s => s.trim());
      for (const row of this.rows) {
        const hit = T.find(r => keys.every(k => r[k] === row[k]));
        if (hit) { if (!this.opts.ignoreDuplicates) Object.assign(hit, row); }
        else T.push({ id: uuid(), ...row });
      }
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
    events: events.map(e => ({ state: 'upcoming', deleted_at: null, notes: null, slot: null, event_time: null,
                               ready_by: null, assigned_member_ids: [], ...e })),
    team_members: team.map(m => ({ active: true, deleted_at: null, ...m })),
    crew_confirmations: [],
  } };
  return { api: { from: (t) => new Q(db, t), schema() { return this; } }, db };
}

// ══════════════════════════════════════════════════════════════════════════
let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  PASS  ' + m)) : (fail++, console.log('  FAIL  ' + m)); };
const sec = (t) => console.log('\n── ' + t + ' ──');

const V   = uuid('1');
const RAHUL = uuid('a');
const PRIYA = uuid('b');

(async () => {

// ─────────────────────────────────────────────────────────────────────────
sec('1. member_clash PAYLOAD — the shape + the sentence (photographer)');
{
  // Rahul already on an EVENING shoot; assigning him to a NOON shoot the same day -> no clash.
  // Assigning him to another EVENING shoot -> clash.
  const { api, db } = makeDb({
    vendor: { id: V, category: 'photographer', slot_capacity: 9 },   // lift capacity: isolate the member path
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }, { id: PRIYA, vendor_id: V, name: 'Priya' }],
    events: [{ id: uuid(), vendor_id: V, title: 'Sharma sangeet', event_date: '2026-08-01', slot: 'evening', kind: 'shoot', assigned_member_ids: [RAHUL] }],
  });
  const c = await checkOccupancy({ supabase: api, vendorId: V, kind: 'shoot', event_date: '2026-08-01',
    slot: 'evening', members: [{ id: RAHUL, name: 'Rahul' }] });
  ok(c && c.kind === 'member_clash', 'kind is member_clash');
  ok(c && c.member && c.member.id === RAHUL && c.member.name === 'Rahul', 'member {id,name} carried');
  ok(c && Array.isArray(c.holding) && c.holding[0] && c.holding[0].title === 'Sharma sangeet', 'holding names the clashing event');
  ok(c && c.message === 'Rahul is already on the Sharma sangeet that evening.', 'message = spec sentence verbatim');
  db; // (db retained for parallel reads if needed)
}

// ─────────────────────────────────────────────────────────────────────────
sec('2. member_clash is ADVISORY — the write LANDS on {ok:true, event, conflict}');
{
  const { api } = makeDb({
    vendor: { id: V, category: 'photographer', slot_capacity: 9 },   // capacity high -> no capacity refusal
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
    events: [{ id: uuid(), vendor_id: V, title: 'Sharma sangeet', event_date: '2026-08-02', slot: 'evening', kind: 'shoot', assigned_member_ids: [RAHUL] }],
  });
  const res = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud',
    title: 'Verma reception', event_date: '2026-08-02', slot: 'evening', kind: 'shoot',
    assigned_member_ids: [RAHUL] });
  ok(res.ok === true, 'ok:true — the advisory did NOT block the write');
  ok(res.event && Array.isArray(res.event.assigned_member_ids) && res.event.assigned_member_ids.includes(RAHUL), 'assigned_member_ids written to the row');
  ok(res.conflict && res.conflict.kind === 'member_clash', 'the member_clash rides out on the return');
}

// ─────────────────────────────────────────────────────────────────────────
sec('3. CAPACITY keeps precedence — a full slot refuses, member_clash yields');
{
  // photographer capacity 1; the evening already holds one shoot. A NEW evening shoot is
  // BOTH a capacity refusal AND a member double-book. Capacity must win (the refusal).
  const { api } = makeDb({
    vendor: { id: V, category: 'photographer' },   // capacity default 1
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
    events: [{ id: uuid(), vendor_id: V, title: 'Sharma sangeet', event_date: '2026-08-03', slot: 'evening', kind: 'shoot', assigned_member_ids: [RAHUL] }],
  });
  const res = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud',
    title: 'Verma reception', event_date: '2026-08-03', slot: 'evening', kind: 'shoot',
    assigned_member_ids: [RAHUL] });
  ok(res.ok === false && res.conflict && res.conflict.kind === 'capacity', 'capacity refusal returned, not member_clash');
}

// ─────────────────────────────────────────────────────────────────────────
sec('4. PLANNER (RULED_OFF) — own capacity silent-off, crew math ON');
{
  const { api } = makeDb({
    vendor: { id: V, category: 'planner' },   // normaliseCategory -> planning -> RULED_OFF
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
    events: [{ id: uuid(), vendor_id: V, title: 'Kapoor mehendi', event_date: '2026-08-04', slot: 'noon', kind: 'ceremony', assigned_member_ids: [RAHUL] }],
  });
  const c = await checkOccupancy({ supabase: api, vendorId: V, kind: 'ceremony', event_date: '2026-08-04',
    slot: 'noon', members: [{ id: RAHUL, name: 'Rahul' }] });
  ok(c && c.kind === 'member_clash', 'planner still gets member_clash (crew math ON despite RULED_OFF)');
  // and with NO clashing member, the planner is silent (byte-behaviour of the old return null)
  const c2 = await checkOccupancy({ supabase: api, vendorId: V, kind: 'ceremony', event_date: '2026-08-04',
    slot: 'noon', members: [{ id: PRIYA, name: 'Priya' }] });
  ok(c2 === null, 'planner with no clash -> null (own capacity stays silent-off)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('5. VALIDATION — a non-team id is refused as a sentence, nothing written');
{
  const STRANGER = uuid('f');
  const { api, db } = makeDb({
    vendor: { id: V, category: 'photographer' },
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
    events: [],
  });
  const res = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud',
    title: 'Iyer wedding', event_date: '2026-08-05', slot: 'evening', kind: 'shoot',
    assigned_member_ids: [RAHUL, STRANGER] });
  ok(res.ok === false && /not on your active team/.test(res.error || ''), 'off-team id refused with a sentence');
  ok((db.t.events || []).length === 0, 'nothing was written (fail-closed before the write)');

  // an INACTIVE member is off the active set too
  const GONE = uuid('c');
  const { api: api2 } = makeDb({ vendor: { id: V, category: 'photographer' },
    team: [{ id: GONE, vendor_id: V, name: 'Gone', active: false }], events: [] });
  const res2 = await writeEvent(api2, { vendorId: V, surface: 'pwa', source: 'crud',
    title: 'Iyer wedding', event_date: '2026-08-05', slot: 'evening', kind: 'shoot', assigned_member_ids: [GONE] });
  ok(res2.ok === false && /not on your active team/.test(res2.error || ''), 'inactive member refused');
}

// ─────────────────────────────────────────────────────────────────────────
sec('6. crew_confirmations — pending upserted; a confirmed row is NOT reset');
{
  const { api, db } = makeDb({
    vendor: { id: V, category: 'photographer', slot_capacity: 9 },
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }, { id: PRIYA, vendor_id: V, name: 'Priya' }],
    events: [],
  });
  const r1 = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud',
    title: 'Nair wedding', event_date: '2026-08-06', slot: 'evening', kind: 'shoot', assigned_member_ids: [RAHUL] });
  const evId = r1.event.id;
  let rows = db.t.crew_confirmations.filter(r => r.event_id === evId);
  ok(rows.length === 1 && rows[0].member_id === RAHUL && rows[0].status === 'pending', 'first assign -> one pending row');

  // Rahul confirms out of band
  db.t.crew_confirmations.find(r => r.member_id === RAHUL).status = 'confirmed';

  // re-assign the SAME event, adding Priya. Rahul must stay confirmed; Priya joins pending.
  await writeEvent(api, { vendorId: V, event_id: evId, source: 'crud', assigned_member_ids: [RAHUL, PRIYA] });
  const rahulRow = db.t.crew_confirmations.find(r => r.event_id === evId && r.member_id === RAHUL);
  const priyaRow = db.t.crew_confirmations.find(r => r.event_id === evId && r.member_id === PRIYA);
  ok(rahulRow && rahulRow.status === 'confirmed', 're-assign did NOT reset Rahul to pending (idempotent upsert)');
  ok(priyaRow && priyaRow.status === 'pending', 'newly-added Priya joins as pending');
}

// ─────────────────────────────────────────────────────────────────────────
sec('7. NOTE-TRAIL — assigned / unassigned lines accumulate on the event');
{
  const { api, db } = makeDb({
    vendor: { id: V, category: 'photographer', slot_capacity: 9 },
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }, { id: PRIYA, vendor_id: V, name: 'Priya' }],
    events: [],
  });
  const r1 = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud',
    title: 'Rao wedding', event_date: '2026-08-07', slot: 'evening', kind: 'shoot', assigned_member_ids: [RAHUL] });
  const evId = r1.event.id;
  ok(/Rahul assigned — \d+ \w{3}/.test(r1.event.notes || ''), 'create records "Rahul assigned — DD Mon"');

  // swap Rahul -> Priya: one assigned line + one unassigned line, trail preserved
  const r2 = await writeEvent(api, { vendorId: V, event_id: evId, source: 'crud', assigned_member_ids: [PRIYA] });
  const notes = (db.t.events.find(e => e.id === evId) || {}).notes || '';
  ok(/Rahul assigned — \d+ \w{3}/.test(notes), 'earlier "Rahul assigned" line still present (trail accumulates)');
  ok(/Priya assigned — \d+ \w{3}/.test(notes),  'new "Priya assigned" line added');
  ok(/Rahul unassigned — \d+ \w{3}/.test(notes),'"Rahul unassigned" line added');
  r2;
}

// ─────────────────────────────────────────────────────────────────────────
sec('8. NO SELF-CLASH — re-saving an event with its own crew does not clash');
{
  const { api } = makeDb({
    vendor: { id: V, category: 'photographer', slot_capacity: 9 },
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
    events: [],
  });
  const r1 = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud',
    title: 'Bose wedding', event_date: '2026-08-08', slot: 'evening', kind: 'shoot', assigned_member_ids: [RAHUL] });
  const r2 = await writeEvent(api, { vendorId: V, event_id: r1.event.id, source: 'crud', assigned_member_ids: [RAHUL] });
  ok(r2.ok === true && !r2.conflict, 'the event does not clash with itself (self excluded)');
}

// ─────────────────────────────────────────────────────────────────────────
console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
