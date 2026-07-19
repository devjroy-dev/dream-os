#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b5_wa_door_bench.js — TDW_05 Block 05, Sitting 1 (F-04.65).
//
// Sibling to scripts/checker_bench.js (101/101) and scripts/b6_referent_bench.js
// (36/36). It does not touch either; both are standing gates.
//
// WHAT IT DRIVES: the REAL calendarSignals.js WA-door functions (bookEvents,
// mutateEvents, lockstepBinderToEvent, resolveEvent, fetchCalendarSnapshot) against
// the REAL writeEvent / checkOccupancy / deriveSlot, over an in-memory events+records
// table. The only doubles are the network, the ledger, and executeAndPatch (the
// engine binder hop) — nothing under test is stubbed. Same harness as checker_bench.
//
// WHY IT IS NON-VACUOUS — THE FAIL-AT-UNCURED PROOF: run this bench from the UNCURED
// tree (calendarSignals.js at HEAD, which writes public.events raw and resolves events
// UUID-only) and it goes RED; run it from the cured tree and it goes GREEN. Same file,
// two trees. Each red line names a bypass the cure closes:
//   §A  a WA book onto a blocked date must WRITE NOTHING and surface the refusal
//   §B  a binder date-move must NOT drag a linked shoot onto a blocked date
//   §C  the snapshot must carry no raw id and not the word "handle"; edit-by-name works
//   §D  the happy paths (free-date book, cancel, drag onto a free date) still land
//   §E  capacity (verdict 2/4) — a REFUSAL — surfaces at the WA book door
//   §F  appointment_overlap (verdict 3/4) — an ADVISORY — the write lands, heads-up rides beside
//
// ── S1b ADDENDUM: all four write-path verdicts witnessed at the WA door ─────
// The checker (occupancy.js, read at HEAD) emits FOUR write-path conflict kinds,
// not five — confirmed by command, `grep "kind:"`: date_blocked (§A/§B), capacity
// (§E), appointment_overlap (§F), cluster. Two of the addendum's named kinds do
// not exist as write-path verdicts and are NOT forced into a case (each a disclosed
// finding with code evidence, per the addendum's own escape clause):
//   · `client`  — NOT a checker verdict at all. It is the resolve-side reference kind
//                 in resolveClientReference.js:82 ({kind:'client'|'lead'|'invoice'}).
//                 No conflict payload carries it; nothing to witness at the write door.
//   · `cluster` — a real verdict, but UNREACHABLE from any conversational door on
//                 EITHER surface (faithful parity, NOT an F-04.65 defect). It keys off
//                 `ready_by`; the donna_book_event/donna_edit_event tool schemas carry
//                 NO ready_by field (recordPrimitives.ts), and neither the WA door nor
//                 chat.js ever forwards one — the only `ready_by` writer in src is
//                 eventWrite.js:610's patch passthrough, which no chat caller feeds.
//                 So cluster cannot be provoked by a WA write; forcing a case would be
//                 a fabrication. Witnessed as unreachable, with the lines above.
//
// Run it: node scripts/b5_wa_door_bench.js
// ══════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CAL  = path.join(ROOT, 'src/lib/vendor/calendarSignals.js');

// ── doubles: the ledger (fire-and-forget by contract) and executeAndPatch (engine) ──
const snapPath = path.join(ROOT, 'src/lib/vendor/snapshot.js');
require.cache[snapPath] = { id: snapPath, filename: snapPath, loaded: true,
  exports: { logActivity: async () => {}, fetchRecentActivity: async () => [], formatActivityBlock: () => '' } };
const eapPath = path.join(ROOT, 'src/lib/executeAndPatch.js');
require.cache[eapPath] = { id: eapPath, filename: eapPath, loaded: true,
  exports: { executeAndPatch: async () => ({ ok: true }) } };

const cal = require(CAL);
const resolveEvent  = cal.resolveEvent  || (async () => ({ none: true })); // uncured door doesn't export the gate
const conflictLines = cal.conflictLines || (() => '');                     // uncured door doesn't export it either
const advisoryLines = cal.advisoryLines || (() => '');                     // ditto — the advisory surface is cure-only
// scrub.js is 0-line and shared by both trees (ruled NOT the seam); scrubText is a pure
// string fn (reaches no DB). We use it to assert the door surfaces the checker's own
// conflict.message THROUGH the ruled F-04.33 seam — the honest form of "verbatim".
const { scrubText } = require(path.join(ROOT, 'src/lib/vendor/scrub.js'));

// ══════════════════════════════════════════════════════════════════════════
// In-memory supabase (the checker_bench harness, extended with a `records` table
// for binder resolution). Filters are applied for real; nothing is faked past the wire.
// ══════════════════════════════════════════════════════════════════════════
let SEQ = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++SEQ).padStart(12, '0')}`;
const V = '11111111-1111-1111-1111-111111111111';
const AG = '22222222-2222-2222-2222-222222222222';

class Q {
  constructor(db, table) { this.db = db; this.table = table; this.f = []; this.n = null; this.mode = 'select'; }
  select() { return this; }
  eq(c, v)   { this.f.push(r => r[c] === v); return this; }
  neq(c, v)  { this.f.push(r => r[c] !== v); return this; }
  is(c, v)   { this.f.push(r => (r[c] === undefined ? null : r[c]) === v); return this; }
  in(c, vs)  { this.f.push(r => vs.includes(r[c])); return this; }
  gte(c, v)  { this.f.push(r => r[c] != null && r[c] >= v); return this; }
  lte(c, v)  { this.f.push(r => r[c] != null && r[c] <= v); return this; }
  ilike(c, p){ const re = new RegExp('^' + String(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*') + '$', 'i');
               this.f.push(r => re.test(String(r[c] == null ? '' : r[c]))); return this; }
  limit(n)   { this.n = n; return this; }
  order()    { return this; }
  update(p)  { this.mode = 'update'; this.patch = p; return this; }
  insert(r)  { this.mode = 'insert'; this.row = r; return this; }
  rows() { let rs = this.db.t[this.table] || []; for (const fn of this.f) rs = rs.filter(fn); return this.n ? rs.slice(0, this.n) : rs; }
  run() {
    if (this.mode === 'update') { const rs = this.rows(); rs.forEach(r => Object.assign(r, this.patch)); return { data: rs, error: null }; }
    if (this.mode === 'insert') { const r = { id: uuid(), state: 'upcoming', deleted_at: null, ...this.row }; (this.db.t[this.table] = this.db.t[this.table] || []).push(r); return { data: [r], error: null }; }
    return { data: this.rows(), error: null };
  }
  async maybeSingle() { const { data, error } = this.run(); return error ? { data: null, error } : { data: data[0] || null, error: null }; }
  async single()      { const { data, error } = this.run(); return error ? { data: null, error } : { data: data[0] || null, error: data[0] ? null : { code: 'PGRST116' } }; }
  then(res, rej) { try { res(this.run()); } catch (e) { rej(e); } }
}
function makeDb({ events = [], records = [], vendor = {} } = {}) {
  const db = { t: {
    events: events.map(e => ({ id: uuid(), state: 'upcoming', deleted_at: null, notes: null, slot: null, event_time: null, ready_by: null, linked_binder_id: null, linked_lead_id: null, ...e })), // every seeded row gets an id (a real DB row always has one) so writeEvent does real UPDATEs
    records: records.map(r => ({ ...r })),
    vendors: [{ id: V, category: 'photographer', slot_capacity: null, ...vendor }],
    owner_notes: [], hot_dates: [],
  } };
  const api = { from: (t) => new Q(db, t), schema: () => api };
  return { api, db };
}

const VEND = { id: V };
const tc = (name, input) => ({ tool_calls: [{ name, input, donna_calls: [] }] });

// ── tiny test runner ─────────────────────────────────────────────────────
let pass = 0, fail = 0; const fails = [];
function ok(cond, label) { if (cond) { pass++; } else { fail++; fails.push(label); console.log('  FAIL ', label); } }

async function main() {
  // ════════════════════════════════════════════════════════════════════════
  // §A — F-04.65: a WA book onto a blocked date. WRITE NOTHING, SURFACE THE REFUSAL.
  //      Uncured: the raw insert bypasses the checker and the row lands. RED.
  // ════════════════════════════════════════════════════════════════════════
  {
    const { api, db } = makeDb({ events: [{ vendor_id: V, title: 'Held', kind: 'blocked', slot: 'full_day', event_date: '2026-11-20' }] });
    const before = db.t.events.length;
    const out = await cal.bookEvents(api, VEND, AG, tc('donna_book_event', { title: 'Meera Kapoor', event_date: '2026-11-20', kind: 'shoot' }));
    ok(out && Array.isArray(out.refused) && out.refused.length === 1, 'A1 book-on-block returns a refusal (not a silent skip)');
    ok(out && Array.isArray(out.booked) && out.booked.length === 0, 'A2 book-on-block books nothing');
    ok(db.t.events.length === before, 'A3 book-on-block WRITES NOTHING to public.events (no bypass)');
    const line = out && out.refused && conflictLines(out.refused);
    ok(typeof line === 'string' && /block/i.test(line) && /20/.test(line), 'A4 the refusal sentence rides out to the vendor (conflict.message verbatim)');
  }
  // §A′ — the happy path the port must not break: book onto a FREE date lands one row.
  {
    const { api, db } = makeDb({});
    const raw = await cal.bookEvents(api, VEND, AG, tc('donna_book_event', { title: 'Riya Bose', event_date: '2026-12-01', kind: 'shoot', event_time: '10:00' }));
    const out = { booked: (raw && raw.booked) || (Array.isArray(raw) ? raw : []), refused: (raw && raw.refused) || [] };
    ok(out.booked.length === 1 && out.refused.length === 0, 'A5 book on a free date succeeds');
    ok(db.t.events.filter(e => e.title === 'Riya Bose' && e.event_date === '2026-12-01').length === 1, 'A6 the free-date booking persisted exactly one row');
    ok(/Booked: Riya Bose/.test(cal.bookingLines(out.booked)), 'A7 bookingLine names the landed booking');
  }

  // ════════════════════════════════════════════════════════════════════════
  // §B — F-04.56: a binder date-move must NOT drag a linked shoot onto a block.
  //      Uncured: raw .update({event_date}) moves it unconditionally. RED.
  // ════════════════════════════════════════════════════════════════════════
  {
    const bid = uuid();
    const { api, db } = makeDb({
      records: [{ id: bid, agent_id: AG, client: 'Tara' }],
      events: [
        { vendor_id: V, title: 'Tara - shoot', kind: 'shoot', event_date: '2026-11-10', linked_binder_id: bid },
        { vendor_id: V, title: 'Held', kind: 'blocked', slot: 'full_day', event_date: '2026-11-15' },
      ],
    });
    await cal.lockstepBinderToEvent(api, VEND, tc('donna_date', { binder_id: bid, date: '2026-11-15' }));
    const shoot = db.t.events.find(e => e.title === 'Tara - shoot');
    ok(shoot.event_date === '2026-11-10', 'B1 drag onto a BLOCKED date is refused — the shoot stays put (date_blocked non-overridable even under force)');
  }
  // §B′ — a drag onto a FREE date still moves the linked shoot (port didn't break it).
  {
    const bid = uuid();
    const { api, db } = makeDb({
      records: [{ id: bid, agent_id: AG, client: 'Nina' }],
      events: [{ vendor_id: V, title: 'Nina - shoot', kind: 'shoot', event_date: '2026-11-10', linked_binder_id: bid }],
    });
    await cal.lockstepBinderToEvent(api, VEND, tc('donna_date', { binder_id: bid, date: '2026-12-05' }));
    const shoot = db.t.events.find(e => e.title === 'Nina - shoot');
    ok(shoot.event_date === '2026-12-05', 'B2 drag onto a FREE date moves the linked shoot');
  }

  // ════════════════════════════════════════════════════════════════════════
  // §C — F-04.66 (folded): the snapshot leaks no id / no "handle"; edit-by-name works.
  //      Uncured: snapshot prints [uuid] under a [handle] header; resolveEvent is
  //      UUID-only, so an edit-by-name strands. RED on both.
  // ════════════════════════════════════════════════════════════════════════
  {
    const { api } = makeDb({ events: [{ id: uuid(), vendor_id: V, title: 'Meera Kapoor - shoot', kind: 'shoot', event_date: '2026-11-22' }] });
    const snap = await cal.fetchCalendarSnapshot(api, V);
    ok(!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(snap), 'C1 snapshot carries NO raw row id');
    ok(!/handle/i.test(snap), 'C2 snapshot never teaches the word "handle"');
    ok(/name as it appears/i.test(snap) && /Meera Kapoor - shoot/.test(snap), 'C3 snapshot teaches the sayable referent');
  }
  {
    const eid = uuid();
    const { api } = makeDb({ events: [{ id: eid, vendor_id: V, title: 'Priya Sharma - wedding', kind: 'shoot', event_date: '2026-11-28' }] });
    const byName = await resolveEvent(api, VEND, 'Priya Sharma');
    ok(byName && byName.ev && byName.ev.id === eid, 'C4 resolveEvent resolves a SAYABLE referent (name) to the row');
    const byUuid = await resolveEvent(api, VEND, eid);
    ok(byUuid && byUuid.ev && byUuid.ev.id === eid, 'C5 resolveEvent still resolves a UUID (leg 1 preserved)');
    const noMatch = await resolveEvent(api, VEND, 'Nobody At All');
    ok(noMatch && noMatch.none, 'C6 an unmatchable referent resolves to none (honest)');
  }
  {
    const eid = uuid();
    const { api, db } = makeDb({ events: [{ id: eid, vendor_id: V, title: 'Sana Verma - shoot', kind: 'shoot', event_date: '2026-11-25' }] });
    const done = await cal.mutateEvents(api, VEND, AG, tc('donna_edit_event', { event_id: 'Sana Verma', event_date: '2026-11-27' }));
    ok(done.length === 1 && done[0].ok === true, 'C7 edit-by-name resolves and lands through writeEvent');
    ok(db.t.events.find(e => e.id === eid).event_date === '2026-11-27', 'C8 the edit-by-name actually moved the row');
    ok(/Updated: Sana Verma - shoot/.test(cal.mutationLines(done)), 'C9 mutationLine reports the update (not a false "no match")');
  }

  // ════════════════════════════════════════════════════════════════════════
  // §D — happy-path mutations the port must preserve: ambiguity, cancel-by-name.
  // ════════════════════════════════════════════════════════════════════════
  {
    const { api } = makeDb({ events: [
      { id: uuid(), vendor_id: V, title: 'Anil Roy - shoot', kind: 'shoot', event_date: '2026-11-10' },
      { id: uuid(), vendor_id: V, title: 'Anil Roy - recce', kind: 'recce', event_date: '2026-11-12' },
    ] });
    const r = await resolveEvent(api, VEND, 'Anil Roy');
    ok(r && Array.isArray(r.ambiguous) && r.ambiguous.length === 2, 'D1 two same-name bookings resolve to ambiguous (honest, never a guess)');
    const done = await cal.mutateEvents(api, VEND, AG, tc('donna_edit_event', { event_id: 'Anil Roy', event_date: '2026-11-30' }));
    ok(done[0].ok === false && done[0].reason === 'ambiguous', 'D2 an ambiguous edit refuses and asks which one');
    ok(/more than one matches/.test(cal.mutationLines(done)), 'D3 the ambiguity is surfaced with the candidates');
  }
  {
    const eid = uuid();
    const { api, db } = makeDb({ events: [{ id: eid, vendor_id: V, title: 'Ravi - shoot', kind: 'shoot', event_date: '2026-11-18' }] });
    const done = await cal.mutateEvents(api, VEND, AG, tc('donna_cancel_event', { event_id: 'Ravi' }));
    ok(done[0].ok === true && done[0].action === 'cancel', 'D4 cancel-by-name resolves and marks cancelled');
    ok(db.t.events.find(e => e.id === eid).state === 'cancelled', 'D5 the row is state=cancelled (not destroyed)');
  }

  // ════════════════════════════════════════════════════════════════════════
  // §E — capacity (the 2nd of four checker verdicts) at the WA BOOK door.
  //      A REFUSAL (REFUSAL_KINDS = ['capacity','date_blocked']). The book door
  //      passes NO force (the schema has no `force`; occupancy.js:820-838), so a
  //      full slot simply refuses. Read-first: bookEvents forwards title/event_date/
  //      event_time/kind — and `shoot` ∈ BOOKED_KINDS, so it is NOT coerced to
  //      'meeting'; it stays OCCUPYING and reaches capacityCheck. A no-time shoot
  //      derives slot='full_day' (deriveSlot branch 3), so it must find room in
  //      every slot; with slot_capacity=1 and one shoot already held, morning is
  //      full → capacity refusal. Uncured: raw insert, no checker → the 2nd shoot
  //      lands, no refusal. RED.
  // ════════════════════════════════════════════════════════════════════════
  {
    const { api, db } = makeDb({
      vendor: { slot_capacity: 1 },
      events: [{ vendor_id: V, title: 'Isha - shoot', kind: 'shoot', event_date: '2026-12-10' }],
    });
    const before = db.t.events.length;
    const out = await cal.bookEvents(api, VEND, AG, tc('donna_book_event', { title: 'Devi', event_date: '2026-12-10', kind: 'shoot' }));
    ok(out && Array.isArray(out.refused) && out.refused.length === 1, 'E1 capacity: a book into a full slot is refused (not a silent skip)');
    ok(out && Array.isArray(out.booked) && out.booked.length === 0, 'E2 capacity: the over-capacity booking books nothing');
    ok(db.t.events.length === before, 'E3 capacity: WRITES NOTHING to public.events (no bypass)');
    const conf = out && out.refused && out.refused[0] && out.refused[0].conflict;
    ok(conf && conf.kind === 'capacity', 'E4 capacity: the verdict the door refused on is the checker\'s `capacity`');
    const line = conflictLines(out && out.refused ? out.refused : []);
    const cmsg = conf ? scrubText(conf.message) : null; // uncured has no conflict → stays null → line !== null → RED
    ok(!!line && line === cmsg && /is full/.test(line) && /1 of 1/.test(line),
       'E5 capacity: the checker\'s conflict.message rides out to the vendor verbatim (through the F-04.33 seam)');
  }

  // ════════════════════════════════════════════════════════════════════════
  // §F — appointment_overlap (the 3rd verdict) at the WA EDIT door.
  //      An ADVISORY, NOT a refusal (occupancy.js:697 — "isRefusal says so; the
  //      gate obeys"). The honest witness is therefore NOT "writes nothing" — it is
  //      the OPPOSITE: the write LANDS and the heads-up rides BESIDE it. bookEvents
  //      drops the ok:true advisory (faithful to chat.js:315-320 — the app book path
  //      does the same), so the surface that carries an advisory is the EDIT path:
  //      mutateEvents keeps `conflict` on ok:true (calendarSignals ok-branch) and
  //      applyCalendarSignals threads advisoryLines. An appointment needs a slot to
  //      overlap, so the edit carries event_time (10:00 → morning). Editing BY UUID
  //      isolates this from the referent gate (§C): the uncured door resolves the
  //      uuid and moves the row too — it just never computes the advisory (no
  //      checkOccupancy on its raw update path). RED on F3/F4 only.
  // ════════════════════════════════════════════════════════════════════════
  {
    const trialId = uuid();
    const { api, db } = makeDb({ events: [
      { vendor_id: V, title: 'Zara - shoot', kind: 'shoot',  event_date: '2026-12-15', event_time: '10:00' },
      { id: trialId, vendor_id: V, title: 'Kiran - trial', kind: 'trial', event_date: '2026-12-14', event_time: '10:00' },
    ] });
    const done = await cal.mutateEvents(api, VEND, AG, tc('donna_edit_event',
      { event_id: trialId, event_date: '2026-12-15', event_time: '10:00' }));
    const m = done && done[0];
    ok(m && m.ok === true, 'F1 overlap: an advisory NEVER blocks — the edit lands (write succeeds)');
    ok(db.t.events.find(e => e.id === trialId).event_date === '2026-12-15', 'F2 overlap: the row actually moved onto the shared date');
    ok(m && m.conflict && m.conflict.kind === 'appointment_overlap', 'F3 overlap: the checker classified it as `appointment_overlap` (advisory)');
    const advised = (done || []).filter(x => x && x.ok && x.conflict);
    const line = advisoryLines(advised);
    const amsg = m && m.conflict ? scrubText(m.conflict.message) : null; // uncured never computes it → RED
    ok(!!line && line === amsg && /Heads up/.test(line) && /morning/.test(line),
       'F4 overlap: the heads-up rides BESIDE the success verbatim (advisoryLines, through the seam)');
  }

  console.log(`\n══ ${pass}/${pass + fail} PASS ══\n`);
  if (fail) { console.log('RED — the uncured WA door bypasses the checker / leaks the handle. Failing checks:'); fails.forEach(f => console.log('   ·', f)); process.exit(1); }
}

main().catch((e) => { console.error('BENCH ERROR', e); process.exit(2); });
