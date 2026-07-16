#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/checker_bench.js — TDW_04 Part B, the CHECKER sitting (ZIP D).
//
// Sibling to scripts/b3_rider_bench.js, which this file does not touch: its 20/20
// is a standing gate and B3's sealed artifact.
//
// Q-SP-5's law, and the reason this file exists at all: A CURE NOBODY CAN RE-RUN
// QUIETLY STOPS BEING A CURE. Run it from anywhere:
//     node scripts/checker_bench.js
//
// WHAT IT DRIVES: the REAL writeEvent, the REAL checkOccupancy, the REAL deriveSlot,
// the REAL category resolvers — against an in-memory `events`/`vendors` table. The
// only doubles are the network and the ledger. Nothing under test is stubbed.
//
// ⚠ WHAT IT DOES NOT PROVE, NAMED (B2's standard — a bench that oversells is worse
//   than no bench): that a live chat turn or a live HTTP door wires these together.
//   The doors SWALLOW the payload today — F-04.55, of eleven writeEvent call sites
//   exactly one mentions .conflict and it console.errors the kind. That is B4's, and
//   spec §5's founder smoke is deferred to where it becomes provable. This bench
//   proves the RULES and the GATE, at the writeEvent boundary, which is exactly where
//   Q-S-1(i) ruled the crown proof to live.
// ══════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');   // runs from its home AND from anywhere
const EW   = path.join(ROOT, 'src/lib/vendor/eventWrite.js');
const OCC  = path.join(ROOT, 'src/lib/vendor/occupancy.js');
const fs   = require('fs');

// ── the ONLY doubles: the ledger (fire-and-forget by contract) and the scrub ──
const snapPath  = path.join(ROOT, 'src/lib/vendor/snapshot.js');
require.cache[snapPath] = { id: snapPath, filename: snapPath, loaded: true,
  exports: { logActivity: async () => {}, fetchRecentActivity: async () => [], formatActivityBlock: () => '' } };

const { writeEvent, deriveSlot } = require(EW);
const { checkOccupancy, isRefusal, isOverridable, VERIFY_FAILED, CATEGORY_CAPACITY, _unmappedSeen } = require(OCC);

// ══════════════════════════════════════════════════════════════════════════
// An in-memory supabase. Filters are applied for real; nothing is faked past
// the wire.
// ══════════════════════════════════════════════════════════════════════════
let SEQ = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++SEQ).padStart(12, '0')}`;
const V = '11111111-1111-1111-1111-111111111111';

class Q {
  constructor(db, table) { this.db = db; this.table = table; this.f = []; this.n = null; this.mode = 'select'; }
  select() { return this; }
  eq(c, v)   { this.f.push(r => r[c] === v); return this; }
  neq(c, v)  { this.f.push(r => r[c] !== v); return this; }
  is(c, v)   { this.f.push(r => (r[c] === undefined ? null : r[c]) === v); return this; }
  in(c, vs)  { this.f.push(r => vs.includes(r[c])); return this; }
  gte(c, v)  { this.f.push(r => r[c] != null && r[c] >= v); return this; }
  lte(c, v)  { this.f.push(r => r[c] != null && r[c] <= v); return this; }
  ilike(c, p){ const re = new RegExp('^' + String(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*'), 'i');
               this.f.push(r => re.test(String(r[c] == null ? '' : r[c]))); return this; }
  limit(n)   { this.n = n; return this; }
  order()    { return this; }
  update(p)  { this.mode = 'update'; this.patch = p; return this; }
  insert(r)  { this.mode = 'insert'; this.row = r; return this; }
  rows() { let rs = this.db.t[this.table] || []; for (const fn of this.f) rs = rs.filter(fn); return this.n ? rs.slice(0, this.n) : rs; }
  run() {
    if (this.db.fail && this.db.fail.has(this.table)) return { data: null, error: { message: 'connection reset', code: '08006' } };
    if (this.mode === 'update') { const rs = this.rows(); rs.forEach(r => Object.assign(r, this.patch)); return { data: rs, error: null }; }
    if (this.mode === 'insert') { const r = { id: uuid(), state: 'upcoming', deleted_at: null, ...this.row }; (this.db.t[this.table] = this.db.t[this.table] || []).push(r); return { data: [r], error: null }; }
    return { data: this.rows(), error: null };
  }
  async maybeSingle() { const { data, error } = this.run(); return error ? { data: null, error } : { data: data[0] || null, error: null }; }
  async single()      { const { data, error } = this.run(); return error ? { data: null, error } : { data: data[0] || null, error: data[0] ? null : { code: 'PGRST116' } }; }
  then(res, rej) { try { res(this.run()); } catch (e) { rej(e); } }
}
function makeDb({ events = [], vendor = {}, fail = [] } = {}) {
  const db = { t: { events: events.map(e => ({ state: 'upcoming', deleted_at: null, notes: null, slot: null, event_time: null, ready_by: null, ...e })),
                    vendors: [{ id: V, category: 'photographer', slot_capacity: null, ...vendor }] },
               fail: new Set(fail) };
  const api = { from: (t) => new Q(db, t), schema: () => api };
  return { api, db };
}

// ══════════════════════════════════════════════════════════════════════════
let pass = 0, fail = 0;
const ok  = (c, m) => { c ? (pass++, console.log('  PASS  ' + m)) : (fail++, console.log('  FAIL  ' + m)); };
const sec = (t) => console.log('\n── ' + t + ' ──');

(async () => {

// ─────────────────────────────────────────────────────────────────────────
sec('1. ACCEPTANCE #9 — the C2 boundaries. Branches 1-2 are HEAD\'s; 3/4 are new.');
ok(deriveSlot({ event_time: '11:59' }) === 'morning', '11:59 -> morning');
ok(deriveSlot({ event_time: '12:00' }) === 'noon',    '12:00 -> noon');
ok(deriveSlot({ event_time: '15:59' }) === 'noon',    '15:59 -> noon');
ok(deriveSlot({ event_time: '16:00' }) === 'evening', '16:00 -> evening');
ok(deriveSlot({ slot: 'evening', event_time: '09:00' }) === 'evening', 'branch 1: a caller-sent slot wins, KIND-BLIND');
ok(deriveSlot({ kind: 'shoot' }) === 'full_day', 'branch 3: no time + OCCUPYING -> full_day');
ok(deriveSlot({ kind: 'trial' }) === null,       'branch 4: no time + APPOINTMENT -> null (timeline-only)');
ok(deriveSlot({}) === null, 'no time + no kind -> null — HEAD\'s behaviour, unchanged (pure extension)');

// ─────────────────────────────────────────────────────────────────────────
sec('2. ACCEPTANCE #3 — makeup 2: two morning bookings OK, the THIRD conflicts.');
{
  const { api, db } = makeDb({ vendor: { category: 'makeup' } });
  const book = (t) => writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', title: t, event_date: '2026-11-22', event_time: '09:00', kind: 'shoot', state: 'upcoming' });
  const a = await book('Priya - bridal');
  const b = await book('Kaaya - family');
  const c = await book('Sana - reception');
  ok(a.ok && !a.conflict, '1st morning booking lands');
  ok(b.ok && !b.conflict, '2nd morning booking lands (capacity 2)');
  ok(!c.ok && c.conflict && c.conflict.kind === 'capacity', '3rd morning booking -> capacity conflict');
  ok(c.conflict && c.conflict.capacity === 2 && c.conflict.slot === 'morning', '   payload carries capacity 2 · slot morning');
  ok(c.conflict && c.conflict.holding.length === 2, '   holding lists BOTH rows');
  ok(db.t.events.length === 2, 'CONFLICT WITHOUT FORCE WROTE NOTHING (the door\'s absolute)');
}
{
  const { api } = makeDb({ vendor: { category: 'photographer' } });
  await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', title: 'A - shoot', event_date: '2026-11-22', event_time: '18:00', kind: 'shoot' });
  const r = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', title: 'B - shoot', event_date: '2026-11-22', event_time: '18:00', kind: 'shoot' });
  ok(!r.ok && r.conflict && r.conflict.kind === 'capacity', 'photographer: 2nd EVENING booking conflicts (capacity 1)');
}
{ // full_day empties all slots (acceptance #3's tail)
  const { api } = makeDb({ vendor: { category: 'photographer' } });
  await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', title: 'A - shoot', event_date: '2026-11-22', kind: 'shoot' });  // no time -> branch 3 -> full_day
  const r = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', title: 'B - shoot', event_date: '2026-11-22', event_time: '09:00', kind: 'shoot' });
  ok(!r.ok && r.conflict && r.conflict.slot === 'morning', 'a full_day booking consumes the MORNING too (P3)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('3. THE CROWN (Q-S-1(i)) — byte-identical ConflictPayload, BOTH source positions.');
{
  const seed = () => [{ id: 'aaaaaaaa-0000-4000-8000-000000000001', vendor_id: V, title: 'Meera Kapoor - wedding shoot', event_date: '2026-11-22', event_time: '18:00', slot: 'evening', kind: 'shoot' }];
  // chat.js:171's payload shape (source 'victor')     vs   events.js:249's (source 'crud')
  const viaVictor = await writeEvent(makeDb({ events: seed() }).api, {
    vendorId: V, agentId: null, surface: 'pwa', source: 'victor',
    title: 'Anjali Rao - wedding shoot', event_date: '2026-11-22', event_time: '18:00', kind: 'shoot',
    notes: undefined, client_hint: null, state: 'upcoming',
  });
  const viaCrud = await writeEvent(makeDb({ events: seed() }).api, {
    vendorId: V, surface: 'pwa', source: 'crud',
    title: 'Anjali Rao - wedding shoot', event_date: '2026-11-22', event_time: '18:00', kind: 'shoot',
    linked_lead_id: null, notes: undefined,
  });
  ok(!viaVictor.ok && !viaCrud.ok, 'both doors refuse the colliding booking');
  const A = JSON.stringify(viaVictor.conflict), B = JSON.stringify(viaCrud.conflict);
  ok(A === B, 'BYTE-IDENTICAL ConflictPayload from both source positions');
  if (A !== B) { console.log('    victor: ' + A); console.log('    crud  : ' + B); }
  console.log('    payload: ' + A);
}

// ─────────────────────────────────────────────────────────────────────────
sec('4. Q-S-3 / §2.6 — ONE ROW SEEN TWICE is not a conflict. TWO ROWS is.');
{ // PATH B — the dedupe-resolved re-book. THE deciding case for the exclusion.
  const { api, db } = makeDb({ events: [{ id: 'bbbbbbbb-0000-4000-8000-000000000001', vendor_id: V, title: 'Meera Kapoor - wedding shoot', event_date: '2026-11-22', event_time: '18:00', slot: 'evening', kind: 'shoot' }] });
  const r = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'victor', title: 'Meera Kapoor - wedding shoot', event_date: '2026-11-22', event_time: '18:00', kind: 'shoot', state: 'upcoming' });
  ok(r.ok && !r.conflict, 'PATH B: an idempotent re-confirmation is NOT a conflict with itself');
  ok(db.t.events.length === 1, '   and it UPDATED, it did not mint a second row');
}
{ // PATH A — a no-op date PATCH: re-sending the date the row already holds.
  const { api } = makeDb({ events: [{ id: 'cccccccc-0000-4000-8000-000000000001', vendor_id: V, title: 'Meera - shoot', event_date: '2026-11-22', event_time: '18:00', slot: 'evening', kind: 'shoot' }] });
  const r = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', event_id: 'cccccccc-0000-4000-8000-000000000001', event_date: '2026-11-22' });
  ok(r.ok && !r.conflict, 'PATH A: a PATCH re-sending its own date does not conflict with itself');
}
{ // Q-B3-13 — exact duplicates ARE capacity consumption. That is TWO ROWS.
  const dup = (id) => ({ id, vendor_id: V, title: 'Meera Kapoor - wedding shoot', event_date: '2026-11-22', event_time: '18:00', slot: 'evening', kind: 'shoot' });
  const { api } = makeDb({ events: [dup('dddddddd-0000-4000-8000-000000000001'), dup('dddddddd-0000-4000-8000-000000000002')] });
  // dedupe returns 2 -> ambiguous -> null -> a FRESH insert asks the checker honestly
  const r = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'victor', title: 'Meera Kapoor - wedding shoot', event_date: '2026-11-22', event_time: '18:00', kind: 'shoot' });
  ok(!r.ok && r.conflict && r.conflict.kind === 'capacity', 'Q-B3-13: two identical rows ARE real capacity consumption');
  ok(r.conflict && r.conflict.holding.length === 2, '   the checker tells the truth — BOTH rows in holding');
}

// ─────────────────────────────────────────────────────────────────────────
sec('5. Q-C-1 — the EFFECTIVE ROW. ctx.kind is undefined on all nine update shapes.');
{ // the lockstep drag's exact payload: event_id + event_date, NO kind.
  const { api } = makeDb({ events: [
    { id: 'eeeeeeee-0000-4000-8000-000000000001', vendor_id: V, title: 'Meera - shoot', event_date: '2026-11-08', event_time: '18:00', slot: 'evening', kind: 'shoot', linked_binder_id: 'b1' },
    { id: 'eeeeeeee-0000-4000-8000-000000000002', vendor_id: V, title: 'Other - shoot', event_date: '2026-11-15', event_time: '18:00', slot: 'evening', kind: 'shoot' },
  ] });
  const r = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'victor', event_id: 'eeeeeeee-0000-4000-8000-000000000001', event_date: '2026-11-15' });
  ok(!r.ok && r.conflict && r.conflict.kind === 'capacity',
     'the DRAG (no kind in the payload) resolves kind from the ROW and conflicts — F-04.56 is real');
  ok(r.conflict && r.conflict.holding.length === 1 && r.conflict.holding[0].event_id === 'eeeeeeee-0000-4000-8000-000000000002',
     '   holding is the OTHER row, never itself');
}
{ // a title-only PATCH buys no round trip and no verdict (the ruled short-circuit)
  const { api, db } = makeDb({ events: [{ id: 'ffffffff-0000-4000-8000-000000000001', vendor_id: V, title: 'x', event_date: '2026-11-22', slot: 'full_day', kind: 'shoot' }] });
  db.fail = new Set(['vendors', 'events']);   // ANY read would error -> fail-closed -> refusal
  const r = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', event_id: 'ffffffff-0000-4000-8000-000000000001', title: 'new title' });
  ok(r.error !== VERIFY_FAILED, 'a title-only PATCH short-circuits BEFORE any read (no round trip bought)');
}
{ // legacy rows carry slot=NULL and are NOT empty air
  const { api } = makeDb({ events: [{ id: '99999999-0000-4000-8000-000000000001', vendor_id: V, title: 'legacy', event_date: '2026-11-22', event_time: null, slot: null, kind: 'shoot' }] });
  const r = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', title: 'new - shoot', event_date: '2026-11-22', event_time: '09:00', kind: 'shoot' });
  ok(!r.ok && r.conflict && r.conflict.kind === 'capacity',
     'a legacy slot=NULL occupying row is read through branch 3 as full_day — NOT as an empty calendar (F-04.47\'s disease, via the column)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('6. Q-SP-1 — slot_capacity = 0 is a POSTURE. Lawful, visible, FORCE-ABLE.');
{
  const { api, db } = makeDb({ vendor: { category: 'makeup', slot_capacity: 0 } });
  const r = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'victor', title: 'Priya - bridal', event_date: '2026-11-22', event_time: '09:00', kind: 'shoot' });
  ok(!r.ok && r.conflict && r.conflict.kind === 'capacity' && r.conflict.capacity === 0, '0 emits `capacity` on an EMPTY morning (0 is lawful; `??` not `||`)');
  ok(/capacity is 0/.test(r.conflict.message), '   the message MAKES THE POSTURE VISIBLE so the force is informed (§2.3)');
  ok(db.t.events.length === 0, '   unforced: WROTE NOTHING');
  const f = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'victor', title: 'Priya - bridal', event_date: '2026-11-22', event_time: '09:00', kind: 'shoot', force: true });
  ok(f.ok, 'FORCED PAST THE 0-POSTURE: the write lands (an exception to a posture is ordinary vendor life)');
  ok(/^\[forced \d{4}-\d{2}-\d{2}\] /.test(db.t.events[0].notes || ''), '   the clash is IN THE NOTE — a forced write never hides what it was forced past');
}

// ─────────────────────────────────────────────────────────────────────────
sec('7. Q-B3-8 + Q-C-3 — THE GATE. §2.9\'s ruled sentence, at the writeEvent boundary.');
{
  const seed = () => [{ id: 'abababab-0000-4000-8000-000000000001', vendor_id: V, title: 'Blocked', event_date: '2026-07-19', slot: 'full_day', kind: 'blocked' }];
  const { api: a1, db: d1 } = makeDb({ events: seed() });
  const un = await writeEvent(a1, { vendorId: V, surface: 'pwa', source: 'victor', title: 'Priya - shoot', event_date: '2026-07-19', event_time: '18:00', kind: 'shoot' });
  ok(!un.ok && un.conflict && un.conflict.kind === 'date_blocked', 'booking onto a block -> date_blocked');
  ok(d1.t.events.length === 1, '   wrote nothing');

  const { api: a2, db: d2 } = makeDb({ events: seed() });
  const fo = await writeEvent(a2, { vendorId: V, surface: 'pwa', source: 'victor', title: 'Priya - shoot', event_date: '2026-07-19', event_time: '18:00', kind: 'shoot', force: true });
  ok(!fo.ok && fo.conflict && fo.conflict.kind === 'date_blocked', '*** FORCE ON A BLOCK IS REFUSED *** (§2.9\'s sentence; FAILED at HEAD before Q-C-3)');
  ok(d2.t.events.length === 1, '   forced: STILL wrote nothing — "blocked" does not mean "blocked unless someone is confident"');

  ok(isOverridable({ kind: 'capacity' }) === true,      'isOverridable: capacity  -> yes (a double-booking is a risk a vendor may accept)');
  ok(isOverridable({ kind: 'date_blocked' }) === false, 'isOverridable: date_blocked -> NO (a stated refusal is not a risk)');
  ok(isRefusal({ kind: 'cluster' }) === false && isRefusal({ kind: 'appointment_overlap' }) === false, 'isRefusal: advisories are NOT refusals');
  ok(isRefusal({ kind: 'capacity' }) && isRefusal({ kind: 'date_blocked' }), 'isRefusal: both refusal classes are');
}
{ // Q-S-4: blocking ONTO a booking is SILENT.
  const { api, db } = makeDb({ events: [{ id: 'acacacac-0000-4000-8000-000000000001', vendor_id: V, title: 'Meera - shoot', event_date: '2026-07-19', slot: 'full_day', kind: 'shoot' }] });
  const r = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', title: 'Blocked', event_date: '2026-07-19', slot: 'full_day', kind: 'blocked', state: 'upcoming' });
  ok(r.ok && !r.conflict, 'Q-S-4: blocking onto a standing booking is SILENT (the day sheet\'s tension to render, not the wire\'s to invent)');
  ok(db.t.events.length === 2, '   the booking stands — visible, occupying');
}

// ─────────────────────────────────────────────────────────────────────────
sec('8. THE GATE, ASSERTED BY SOURCE POSITION (B2\'s method — both refusal classes).');
{
  const src = fs.readFileSync(EW, 'utf8');
  const iErr   = src.indexOf('if (conflict && conflict.err) return { ok: false, error: conflict.err };');
  const iGate  = src.indexOf('if (conflict && isRefusal(conflict) && (!force || !isOverridable(conflict)))');
  const iForce = src.indexOf('if (conflict && force && isRefusal(conflict)) {');
  const iBlock = src.indexOf("code: 'ALREADY_BLOCKED'");
  const iWrite = src.indexOf('// ── 5. WRITE ');
  ok(iErr > 0 && iGate > 0 && iForce > 0, 'all three gate lines are present in the source');
  ok(iErr < iForce,  'the ERROR channel sits ABOVE the force branch -> force cannot beat FAIL-CLOSED');
  ok(iGate < iForce, 'the REFUSAL gate sits ABOVE the force branch -> no path from a refusal to a write bypasses it');
  ok(iGate < iWrite, 'the gate sits ABOVE the write');
  ok(iBlock > 0 && iBlock < iGate, 'the RE-BLOCK refusal (ALREADY_BLOCKED) still returns above force — B2\'s half, intact');
  // Strip comments first: this door's own comment EXPLAINS why it must not name a
  // verdict, and an assertion that cannot tell code from prose proves nothing.
  const code = src.replace(/^\s*\/\/.*$/gm, '');
  ok(!/conflict\.kind\s*[!=]==\s*'date_blocked'/.test(code), 'the DOOR never names a verdict — it asks. One home for the vocabulary (F-04.36).');
}

// ─────────────────────────────────────────────────────────────────────────
sec('9. ADVISORIES NEVER BLOCK (C5 + C9). Ruled three times; the gate obeys.');
{
  const { api, db } = makeDb({ events: [{ id: 'adadadad-0000-4000-8000-000000000001', vendor_id: V, title: 'Meera - shoot', event_date: '2026-11-22', event_time: '18:00', slot: 'evening', kind: 'shoot' }] });
  // DISTINCT CLIENTS, deliberately: "Meera - trial" against "Meera - shoot" is the
  // same client on the same date, which B2's dedupe RESOLVES onto one row by design.
  // The first cut of this test used the same name and measured the dedupe, not C5.
  const r = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'victor', title: 'Anjali - trial', event_date: '2026-11-22', event_time: '18:00', kind: 'trial' });
  ok(r.ok, 'C5: an appointment sharing a slot with a booking LANDS — it never consumes capacity');
  ok(r.conflict && r.conflict.kind === 'appointment_overlap', '   and the advisory rides out on { ok:true, event, conflict } — the return B2 built for it');
  ok(db.t.events.length === 2, '   the row is really there');
  ok((db.t.events[1].notes || null) === null, '   NOTHING was forced, so nothing is in the note (and notes was not CLEARED)');
}
{ // C9 — the 4th ready_by in a rolling 7 days, advisory, once per window
  const d = (id, ready_by, notes) => ({ id, vendor_id: V, title: 'piece ' + id.slice(-1), event_date: ready_by, ready_by, kind: 'other', notes: notes || null });
  const { api, db } = makeDb({ vendor: { category: 'designer' }, events: [
    d('ae000000-0000-4000-8000-000000000001', '2026-11-20'), d('ae000000-0000-4000-8000-000000000002', '2026-11-21'), d('ae000000-0000-4000-8000-000000000003', '2026-11-23'),
  ] });
  const r = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'victor', title: 'piece 4', event_date: '2026-11-22', ready_by: '2026-11-22', kind: 'other' });
  ok(r.ok, 'C9: the 4th deadline LANDS — clustering NEVER blocks');
  ok(r.conflict && r.conflict.kind === 'cluster', '   -> single cluster advisory');
  ok(db.t.events.length === 4, '   the row is really there');
  // once per window: an existing note in the window silences it
  const { api: a2 } = makeDb({ vendor: { category: 'designer' }, events: [
    d('af000000-0000-4000-8000-000000000001', '2026-11-20', 'x [cluster noted] y'), d('af000000-0000-4000-8000-000000000002', '2026-11-21'), d('af000000-0000-4000-8000-000000000003', '2026-11-23'),
  ] });
  const r2 = await writeEvent(a2, { vendorId: V, surface: 'pwa', source: 'victor', title: 'piece 4', event_date: '2026-11-22', ready_by: '2026-11-22', kind: 'other' });
  ok(r2.ok && !r2.conflict, '   ONCE PER WINDOW: already noted -> silent (P3\'s ruled note-dedupe; "never nags")');
  // a delivery vendor is occupancy-OFF: a same-day second shoot does not conflict
  const { api: a3 } = makeDb({ vendor: { category: 'designer' }, events: [{ id: 'ba000000-0000-4000-8000-000000000001', vendor_id: V, title: 'A - shoot', event_date: '2026-11-22', slot: 'full_day', kind: 'shoot' }] });
  const r3 = await writeEvent(a3, { vendorId: V, surface: 'pwa', source: 'crud', title: 'B - shoot', event_date: '2026-11-22', kind: 'shoot' });
  ok(r3.ok && !r3.conflict, 'designer/jewellery: occupancy OFF (timelineType delivery) — no capacity verdict, ever');
}

// ─────────────────────────────────────────────────────────────────────────
sec('10. FAIL-CLOSED (F15) — force cannot beat a checker that cannot see.');
{
  const { api, db } = makeDb({ events: [{ id: 'bb000000-0000-4000-8000-000000000001', vendor_id: V, title: 'x', event_date: '2026-11-22', slot: 'full_day', kind: 'shoot' }] });
  db.fail = new Set(['vendors']);
  const r = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', title: 'y - shoot', event_date: '2026-11-22', kind: 'shoot' });
  ok(!r.ok && r.error === VERIFY_FAILED, 'a vendor-read that ERRORS refuses the write with the honest, retryable sentence');
  ok(!r.conflict, '   it comes back on the ERROR channel, not as a verdict');
  const f = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', title: 'y - shoot', event_date: '2026-11-22', kind: 'shoot', force: true });
  ok(!f.ok && f.error === VERIFY_FAILED, '*** FORCE CANNOT BEAT FAIL-CLOSED *** (the error channel is ABOVE the force branch)');
  ok(db.t.events.length === 1, '   nothing was written, either way');
}
{
  const { api } = makeDb({ events: [{ id: 'bc000000-0000-4000-8000-000000000001', vendor_id: V, title: 'x', event_date: '2026-11-22', slot: 'evening', kind: 'shoot' }] });
  const before = (await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', event_id: 'bc000000-0000-4000-8000-000000000001', event_date: '2026-11-23' }));
  ok(before.ok, 'control: the same edit lands when the reads are healthy');
}

// ─────────────────────────────────────────────────────────────────────────
sec('11. ITEM 3 — a row LEAVING occupancy asks no occupancy question.');
{
  const seed = () => [{ id: 'ca000000-0000-4000-8000-000000000001', vendor_id: V, title: 'Blocked', event_date: '2026-07-19', slot: 'full_day', kind: 'blocked' }];
  const { api, db } = makeDb({ events: seed() });
  const r = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', event_id: 'ca000000-0000-4000-8000-000000000001', deleted_at: '2026-07-16T00:00:00Z' });
  ok(r.ok, 'unblockDate\'s exact payload: the soft-delete LANDS — a vendor can unblock a date');
  ok(db.t.events[0].deleted_at === '2026-07-16T00:00:00Z', '   the tombstone is really stamped');
  const { api: a2 } = makeDb({ events: [{ id: 'cb000000-0000-4000-8000-000000000001', vendor_id: V, title: 'Meera - shoot', event_date: '2026-11-22', slot: 'full_day', kind: 'shoot' }, { id: 'cb000000-0000-4000-8000-000000000002', vendor_id: V, title: 'Other', event_date: '2026-11-22', slot: 'full_day', kind: 'shoot' }] });
  const c = await writeEvent(a2, { vendorId: V, surface: 'pwa', source: 'crud', event_id: 'cb000000-0000-4000-8000-000000000001', state: 'cancelled' });
  ok(c.ok && !c.conflict, 'a CANCEL on a date already over capacity lands — you never ask permission to stop using a slot');
}

// ─────────────────────────────────────────────────────────────────────────
sec('12. THE MAP (Q-B3-2 corrected) + RULED_OFF. Keyed on profile.key, NEVER timelineType.');
{
  ok(CATEGORY_CAPACITY.photography === 1 && CATEGORY_CAPACITY.makeup === 2 && CATEGORY_CAPACITY.decor === 1 && CATEGORY_CAPACITY.venue === 1,
     'photography 1 · makeup 2 · decor 1 · venue 1 (C4\'s mua:2 RESTORED; decor 1 is audit §9\'s Q-2, ruled)');
  ok(!('florist' in CATEGORY_CAPACITY) && !('other' in CATEGORY_CAPACITY) && !('planning' in CATEGORY_CAPACITY),
     'no florist key · no `other` key · no planner key — occupancy OFF is not capacity 1');
  const { profileFor } = require(path.join(ROOT, 'src/lib/vendor/categoryProfiles'));
  ok(profileFor('anything-unmapped').timelineType === 'event',
     'THE TRAP IS REAL: profileFor\'s synthetic `other` returns timelineType:\'event\' — a map keyed on it would turn `other` ON');
  // planner: RULED_OFF -> silent, no unmapped signal
  _unmappedSeen.clear();
  const { api } = makeDb({ vendor: { category: 'planner' }, events: [{ id: 'da000000-0000-4000-8000-000000000001', vendor_id: V, title: 'A', event_date: '2026-11-22', slot: 'full_day', kind: 'shoot' }] });
  const r = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', title: 'B - shoot', event_date: '2026-11-22', kind: 'shoot' });
  ok(r.ok && !r.conflict, 'planner: occupancy OFF (C4 / §8 — 04.5 owns the crew math)');
  ok(_unmappedSeen.size === 0, '   and SILENT — RULED_OFF fires no `occupancy_unmapped`; the signal stays loud where it means something');
  // a genuinely unmapped category: OFF + exactly one signal, per vendor
  _unmappedSeen.clear();
  const { api: a2 } = makeDb({ vendor: { category: 'balloon artist' }, events: [{ id: 'db000000-0000-4000-8000-000000000001', vendor_id: V, title: 'A', event_date: '2026-11-22', slot: 'full_day', kind: 'shoot' }] });
  const q1 = await writeEvent(a2, { vendorId: V, surface: 'pwa', source: 'crud', title: 'B - shoot', event_date: '2026-11-22', kind: 'shoot' });
  await writeEvent(a2, { vendorId: V, surface: 'pwa', source: 'crud', title: 'C - shoot', event_date: '2026-11-22', kind: 'shoot' });
  ok(q1.ok, 'genuinely unmapped -> occupancy OFF (uncertainty must never consume capacity)');
  ok(_unmappedSeen.size === 1, '   `occupancy_unmapped` fires ONCE PER VENDOR (per process — and the comment says so)');
  // F-04.59's rider
  const { normaliseCategory } = require(path.join(ROOT, 'src/lib/vendor/categoryFraming'));
  ok(normaliseCategory('florist') === 'decor', 'F-04.59: `florist` now normalises to `decor` — the 2026-05-15 merge reaches the ladder profileFor actually consults');
}

// ─────────────────────────────────────────────────────────────────────────
sec('13. F-04.58 — the dedupe honours the soft-delete covenant.');
{
  const { api, db } = makeDb({ events: [{ id: 'ea000000-0000-4000-8000-000000000001', vendor_id: V, title: 'Meera - shoot', event_date: '2026-11-22', slot: 'full_day', kind: 'shoot', deleted_at: '2026-07-01T00:00:00Z' }] });
  const r = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'victor', title: 'Meera - shoot', event_date: '2026-11-22', kind: 'shoot' });
  ok(r.ok, 're-booking a client whose event was SOFT-DELETED no longer reports "Event not found."');
  ok(db.t.events.length === 2, '   it minted a fresh row rather than resolving onto a tombstone (F-04.25\'s family)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('14. §2.7 — HORIZON-BLIND BY CONSTRUCTION (F-04.47).');
{
  const src = fs.readFileSync(OCC, 'utf8');
  ok(/F-04\.47/.test(src), 'the comment naming F-04.47 against a future "symmetry with the grid" is SHIPPED');
  ok(!/DEFAULT_WINDOW_DAYS|horizon|\.gte\('event_date'/.test(src.replace(/^\s*\/\/.*$/gm, '')), 'no horizon filter exists in the checker\'s code');
  const far = makeDb({ events: [{ id: 'fa000000-0000-4000-8000-000000000001', vendor_id: V, title: 'A - shoot', event_date: '2029-01-01', slot: 'full_day', kind: 'shoot' }] });
  const r = await writeEvent(far.api, { vendorId: V, surface: 'pwa', source: 'crud', title: 'B - shoot', event_date: '2029-01-01', kind: 'shoot' });
  ok(!r.ok && r.conflict, 'a booking PAST every surface\'s horizon still occupies — the checker reads the TABLE, never a view');
}

// ═════════════════════════════════════════════════════════════════════════
// TDW_04 B4 — THE DEATH CERTIFICATE. The checker has been correct and unread
// since ZIP D. §§14-17 are the sections that read it.
// ═════════════════════════════════════════════════════════════════════════
// ── THE DOOR SHIM, AND WHY IT IS NOT A FOURTH DOUBLE OF THE CODE UNDER TEST ──
//
// This bench's LAW is that it runs 78/78 from a CLEAN CLONE, from any working
// directory — no npm install, no npm run build. That property is Q-SP-5's ("a cure
// nobody can re-run quietly stops being a cure") and it is precisely what the
// tombstone bench lacked for two sittings.
//
// The door modules pull `express` (node_modules) and `executeAndPatch` pulls
// `engine/dist/...` (a BUILD ARTIFACT). Requiring them naively would have made this
// bench need `npm install && npm run build` — I would have traded the bench's own law
// to test my own code. Found by RUNNING it: `Error: Cannot find module 'express'`.
//
// So the loader is shimmed for the door's TRANSPORT and its UNRELATED NEIGHBOURS —
// never for the functions under test. `conflictOr400`, `conflictLines`,
// `mutationLines`, `advisoryLines` are the REAL ones, loaded from the real files.
// A bench that re-implemented their branch order would prove its own copy (B2
// disclosure §3: "a green bench over an unreachable path is not evidence").
const Module = require('module');
const _load  = Module._load;
const BUILTIN = new Set(Module.builtinModules);
const noop   = () => new Proxy(function () {}, { get: () => noop() });
Module._load = function (req) {
  // ⚠ Router() returns a PLAIN OBJECT, not a catch-all Proxy — and the first cut of
  //   this shim used a Proxy, whose `get` trap swallowed the door's own test-seam
  //   export and handed back a noop. `conflictOr400` resolved to undefined and the
  //   assertion blew up on `r.status`. FOUND BY RUNNING THE SHIM, not by reading it:
  //   a stub broad enough to fake anything is broad enough to fake the thing you came
  //   to test. §0.1's shape, in the bench that exists to catch §0.1's shape.
  if (req === 'express') { const e = () => {}; e.Router = () => ({ get(){}, post(){}, patch(){}, put(){}, delete(){}, use(){} }); return e; }
  if (/engine\/dist\//.test(req)) return noop();
  // Everything else from node_modules — pdfkit, @supabase/supabase-js, whatever the
  // door's NEIGHBOURS drag in (chat.js -> invoices.js -> invoicePdf.js -> pdfkit).
  // NEVER a relative/absolute path: every file under test loads for real, and the two
  // ratified doubles (the ledger, the scrub) are still the require.cache entries above.
  if (!req.startsWith('.') && !req.startsWith('/') && !req.startsWith('node:') && !BUILTIN.has(req)) return noop();
  return _load.apply(this, arguments);
};

sec('14. F-04.55 — THE CRUD DOOR. The payload reaches the wire.');
{
  const { conflictOr400 } = require(path.join(ROOT, 'src/api/vendor/events.js'));
  const mk = () => { const o = { _s: null }; o.status = (x) => { o._s = x; return o; }; o.json = (b) => ({ status: o._s, body: b }); return o; };

  // THE DEFECT, reproduced first so the cure has something to be a cure OF.
  const { err } = require(path.join(ROOT, 'src/lib/response.js'));
  const bare = err(mk(), 400, undefined);
  ok(bare.status === 400 && JSON.stringify(bare.body) === '{"ok":false}',
     'BEFORE: errRes(res,400,result.error) on a conflict shipped a bare {"ok":false} — the finding, reproduced by running the real helper');

  const conflict = { kind: 'date_blocked', date: '2026-07-19', holding: [{ event_id: 'x', title: 'Blocked', slot: 'full_day', kind: 'blocked' }],
                     message: "You've blocked 19 July. That one's a no — unblock it first if you want it back." };
  const r = conflictOr400(mk(), { ok: false, conflict });
  ok(r.status === 409, 'AFTER: a refusal is 409, not 400 — availability.js:73\'s ALREADY_BLOCKED precedent, one calendar, one semantics');
  ok(r.body.error === conflict.message, '   `error` CARRIES THE BLESSED SENTENCE — AddSheet\'s `?.error ?? "Something went wrong."` now prints it, ZERO PWA diff');
  ok(r.body.conflict && r.body.conflict.kind === 'date_blocked' && Array.isArray(r.body.conflict.holding),
     '   `conflict` rides WHOLE — kind, holding, the lot. B5\'s day sheet has something to render');
  ok(!('overridable' in r.body) && !('isOverridable' in r.body),
     '   `isOverridable` is NOT on the wire — the client must never learn kind !== \'date_blocked\' (Q-C-3: one home for force semantics)');
  ok(typeof r.body.error === 'string' && r.body.error.length > 0,
     '   ApiErr{ok:false;error:string}\'s REQUIRED field is satisfied again — the bare {"ok":false} never satisfied its own type');

  const e = conflictOr400(mk(), { ok: false, error: 'Invalid kind. Must be one of: shoot, call.' });
  ok(e.status === 400 && e.body.error === 'Invalid kind. Must be one of: shoot, call.',
     'a VALIDATION failure is still a 400 with its sentence — the 409 is for refusals only');
  const fc = conflictOr400(mk(), { ok: false, error: VERIFY_FAILED });
  ok(fc.status === 400 && fc.body.error === VERIFY_FAILED,
     'FAIL-CLOSED\'s honest string reaches the vendor through the same door (the error channel, unchanged)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('15. F-04.62 — THE FALSE DIAGNOSIS. Live in prod from ZIP D to this ZIP.');
{
  const { mutationLines, conflictLines, advisoryLines } = require(path.join(ROOT, 'src/api/vendor-engine/chat.js'));
  const SINGLE = /didn't find a single match/;

  const refusal = { action: 'edit', ok: false, conflict: { kind: 'capacity', message: 'Your evening on 19 July is full — that\'s 1 of 1.' }, error: null, reason: null };
  ok(!SINGLE.test(mutationLines([refusal])), 'a REFUSAL no longer claims "I didn\'t find a single match" — Victor stops misdiagnosing his own deliberate act');
  ok(mutationLines([refusal]) === refusal.conflict.message, '   it speaks the checker\'s sentence VERBATIM (spec P2) — no wrapper, no re-authoring');

  const failClosed = { action: 'edit', ok: false, conflict: null, error: VERIFY_FAILED, reason: null };
  ok(mutationLines([failClosed]) === VERIFY_FAILED, 'a FAIL-CLOSED error speaks its own honest string, not a search failure');

  const unresolved = { action: 'edit', ok: false, reason: 'unresolved' };
  ok(SINGLE.test(mutationLines([unresolved])), 'THE SENTENCE SURVIVES WHERE IT WAS ALWAYS TRUE — !ev, and only !ev');
  ok(SINGLE.test(mutationLines([{ action: 'cancel', ok: false, reason: 'unresolved' }])), '   both verbs');

  const landed = { action: 'edit', ok: true, event: { title: 'Meera - shoot', event_date: '2026-11-22', event_time: '09:00' }, conflict: null };
  ok(/Updated: Meera - shoot/.test(mutationLines([landed])), 'a write that LANDED still says so — existing behaviour is sacred (Protocol §8)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('16. Q-B4-5(b) — ADVISORIES ride BESIDE the success line, never instead of it.');
{
  const { mutationLines, advisoryLines } = require(path.join(ROOT, 'src/api/vendor-engine/chat.js'));
  const advised = { action: 'edit', ok: true, event: { title: 'Kaaya - trial', event_date: '2026-11-22', event_time: '09:00' },
                    conflict: { kind: 'appointment_overlap', message: 'Heads up — that\'s the same morning as Meera - shoot on 22 November.' } };
  ok(/Updated: Kaaya - trial/.test(mutationLines([advised])), 'the ADVISED write still reports as done — C9\'s "never blocks", one layer up from the gate');
  ok(advisoryLines([advised]) === advised.conflict.message, '   and the heads-up is spoken beside it, verbatim');
  ok(!/Heads up/.test(mutationLines([advised])), '   an advisory NEVER arrives dressed as a refusal ("the same lie facing the other way")');
}

// ─────────────────────────────────────────────────────────────────────────
sec('17. THE INVITATION CLAUSES ARE STRUCK — and this section is the forcing function.');
{
  const occ = fs.readFileSync(OCC, 'utf8');
  const body = occ.slice(occ.indexOf('function capacityMessage'));
  const fn   = body.slice(0, body.indexOf('\nfunction '));
  ok(!/Say the word/.test(fn), 'capacityMessage does not invite a force that has no hand (CE catch, founder-blessed subject to it)');
  ok(!/double it up|put it in anyway/.test(fn), '   neither clause survives, at the ONE home — both doors inherit the strike');

  // §2.3 SURVIVES. The posture is the substance; the invitation was the defect.
  ok(/capacity is 0/.test(occ), '   §2.3 survives: the posture is still made visible — the bench asserts it at §6 by RUNNING the checker');

  // The three-layer proof, asserted so it cannot rot silently.
  const rp  = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/tools/recordPrimitives.ts'), 'utf8');
  const bookTool = rp.slice(rp.indexOf('DONNA_BOOK_EVENT_TOOL'), rp.indexOf('DONNA_EDIT_EVENT_TOOL'));
  ok(!/force/.test(bookTool), 'LAYER 1: DONNA_BOOK_EVENT_TOOL\'s schema cannot express `force` — the model cannot utter the word');
  const chat = fs.readFileSync(path.join(ROOT, 'src/api/vendor-engine/chat.js'), 'utf8');
  const be   = chat.slice(chat.indexOf('async function bookEvents'), chat.indexOf('function bookingLines'));
  ok(!/force/.test(be), 'LAYER 2+3: bookEvents neither reads `force` off the tool input nor passes it to writeEvent');
  // ⚠ COUNT THE CODE, NOT THE PROSE. The first cut of this line matched /force: true/
  //   across the whole file and asserted 1. It is 3 — two of them are B3's own COMMENTS
  //   warning about the third ("Do not port `force: true` to another caller without
  //   it."). The bench failed, the code was right, and the assertion was a number I had
  //   authored rather than derived. §0.1, inside the section I wrote to enforce §0.1.
  const codeLines = chat.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l));
  const forces = codeLines.filter((l) => /force:\s*true/.test(l)).length;
  ok(forces === 1, 'THE ONLY force:true in this door\'s CODE is lockstep leg 2 — an INTERNAL drag no vendor utterance reaches');

  // ⚠ WHEN THE AFFORDANCE LANDS, THIS SECTION IS WHAT YOU DELETE. Until then it is
  //   the difference between "we struck them" and "they cannot quietly come back."
  //   An agreement is only a guarantee once something breaks when it stops being true.
}

// ══════════════════════════════════════════════════════════════════════════
console.log('\n══ ' + pass + '/' + (pass + fail) + (fail ? ' — ' + fail + ' FAILED ══' : ' PASS ══'));

console.log(`
── §5's INHERITED UNPROVEN LEDGER. NOT PROVEN HERE. NAMED, THREE SITTINGS RUNNING. ──

  F-04.42 (add-and-strike)  shipped, NO production witness. Move an event off a date
                            via Victor; no donna_unblock_date may appear in the turn.
                            The row will not tell you — only the log will.
  F-04.44 (both selects)    shipped, NO production witness. Create a lead with a
                            budget; edit a field on one that has a budget. The figure
                            must appear BOTH times.
  T12    (retroLink)        inherited, NEVER proven, three blocks running. Calendar
                            event for a brand-new couple name -> file a lead for that
                            name via chat -> the event must gain linked_binder_id.
  ERROR gate                BENCH-ONLY by deliberate restraint, CE-accepted.
  T1                        Twilio-blocked.

  This bench inherits all five and proves none of them. Each needs a live turn.
`);
process.exit(fail ? 1 : 0);
})();
