#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b6_referent_bench.js — TDW_04 Part B, sitting B6 (R-B6-1).
//
// Sibling to checker_bench (101/101), b3_rider_bench (20/20) and
// b5_describe_bench (18/18) — none of which this file touches: their counts are
// sealed gates. R-B6-1's bench clause says "extends b5_describe_bench or a
// sibling"; a sibling keeps the three sealed banners byte-stable in the
// founder's verify string. Q-SP-5's law: run it from anywhere —
//     node scripts/b6_referent_bench.js
//
// WHAT IT DRIVES: the REAL fetchCalendarSnapshot and the REAL resolveEvent
// (chat.js's exported test seams, B4's ratified precedent), the REAL
// mutationLines, the REAL describeWindow/windowWords and — through them — the
// REAL describeDate, against an in-memory events/vendors/hot_dates/leads store.
// The only doubles are the transport (express), the engine dist, the ledger,
// and node_modules neighbours — never a function under test (B2 §3: a bench
// that re-implements the branch order proves its own copy).
//
// WHAT IT PROVES, by R-B6-1's own three clauses:
//   (a) no UUID pattern appears in any snapshot string — asserted BY REGEX
//       against the BUILT output, and the word "handle" left with the ids;
//   (b) the resolution leg: exact match · prefix · ambiguity ("tell me which
//       one", both listed by title + date) · zero-match — plus the covenant
//       (deleted/cancelled rows never resolve) and the untouched UUID leg;
//   (c) the date-pressure line renders OFF-honest for a RULED_OFF category —
//       and unknown-honest when the finder fails (never null-as-free).
// Plus the TOOL LAYER (R-B6-4, veto = YES): the softened :650/:660 strings are
// present VERBATIM, the optimistic originals are gone, and the schemas teach
// the sayable referent — asserted at SOURCE (recordPrimitives.ts), disclosed as
// a source assertion: the engine gates (tsc + build + smoke + tombstone 15/15)
// prove the file compiles and behaves; this section proves the words shipped.
//
// WHAT IT DOES NOT PROVE, NAMED: that a live model turn passes a sayable
// referent, or that Victor speaks the pressure line in his voice — those are
// the founder smoke card's (§3 steps 1 and 5).
// ══════════════════════════════════════════════════════════════════════════
'use strict';

const path   = require('path');
const fs     = require('fs');
const assert = require('assert');
const ROOT   = path.resolve(__dirname, '..');   // runs from its home AND from anywhere

// ── the ratified doubles: the ledger, and (for chat.js's neighbours) the shim ──
const snapPath = path.join(ROOT, 'src/lib/vendor/snapshot.js');
require.cache[snapPath] = { id: snapPath, filename: snapPath, loaded: true,
  exports: { logActivity: async () => {}, fetchRecentActivity: async () => [], formatActivityBlock: () => '' } };

const Module  = require('module');
const _load   = Module._load;
const BUILTIN = new Set(Module.builtinModules);
const noop    = () => new Proxy(function () {}, { get: () => noop() });
Module._load = function (req) {
  // Router() returns a PLAIN OBJECT — checker_bench's own lesson: a catch-all
  // Proxy swallowed the door's test-seam export once. Not repeated here.
  if (req === 'express') { const e = () => {}; e.Router = () => ({ get(){}, post(){}, patch(){}, put(){}, delete(){}, use(){} }); return e; }
  if (/engine\/dist\//.test(req)) return noop();
  if (!req.startsWith('.') && !req.startsWith('/') && !req.startsWith('node:') && !BUILTIN.has(req)) return noop();
  return _load.apply(this, arguments);
};

const CHAT = path.join(ROOT, 'src/api/vendor-engine/chat.js');
const OCC  = path.join(ROOT, 'src/lib/vendor/occupancy.js');
const RP   = path.join(ROOT, 'src/engine/src/core/tools/recordPrimitives.ts');
const { fetchCalendarSnapshot, resolveEvent, mutationLines } = require(CHAT);
const { describeWindow, windowWords } = require(OCC);

// ══ an in-memory supabase — filters applied for real, nothing faked past the wire ══
let SEQ = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++SEQ).padStart(12, '0')}`;
const V = '11111111-1111-1111-1111-111111111111';

class Q {
  constructor(db, table) { this.db = db; this.table = table; this.f = []; this.n = null; }
  select() { return this; }
  eq(c, v)   { this.f.push(r => r[c] === v); return this; }
  neq(c, v)  { this.f.push(r => r[c] !== v); return this; }
  is(c, v)   { this.f.push(r => (r[c] === undefined ? null : r[c]) === v); return this; }
  in(c, vs)  { this.f.push(r => vs.includes(r[c])); return this; }
  gte(c, v)  { this.f.push(r => r[c] != null && r[c] >= v); return this; }
  lte(c, v)  { this.f.push(r => r[c] != null && r[c] <= v); return this; }
  not(c, op, v) { if (op === 'is') this.f.push(r => (r[c] === undefined ? null : r[c]) !== v); return this; }
  ilike(c, p){ const re = new RegExp(String(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*'), 'i');
               this.f.push(r => re.test(String(r[c] == null ? '' : r[c]))); return this; }
  limit(n)   { this.n = n; return this; }
  order()    { return this; }
  _rows()    { const t = this.db.t[this.table] || [];
               let out = t.filter(r => this.f.every(fn => fn(r)));
               if (this.n != null) out = out.slice(0, this.n);
               return out; }
  maybeSingle() { const r = this._rows(); return Promise.resolve({ data: r[0] || null, error: r.length > 1 ? { message: 'many' } : null }); }
  then(res)  { if (this.db.fail && this.db.fail.has(this.table)) return res({ data: null, error: { message: `bench: ${this.table} read forced to fail` } });
               return res({ data: this._rows(), error: null }); }
}
function makeDb(tables, failTables) {
  const db = { t: tables, fail: failTables ? new Set(failTables) : null };
  return { db, supabase: { from: (t) => new Q(db, t), schema() { return this; } } };
}
const mkReq = (supabase) => ({ app: { locals: { supabase } }, vendor: { id: V } });

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else      { fail++; console.log(`  FAIL  ${label}`); }
}
function sec(t) { console.log(`\n── ${t} ──`); }

const today = new Date().toISOString().slice(0, 10);
const plus = (n) => { const d = new Date(`${today}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const UUID_ANY = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

(async () => {

// ─────────────────────────────────────────────────────────────────────────
sec('1. F-04.66 (R-B6-1 clause a) — the ids leave the prose; the word leaves with them.');
{
  const rows = [
    { id: uuid(), vendor_id: V, title: 'Meera Kapoor - wedding shoot', event_date: plus(5), event_time: null, kind: 'shoot', state: 'upcoming', deleted_at: null },
    { id: uuid(), vendor_id: V, title: 'Ananya - recce', event_date: plus(8), event_time: '09:00:00', kind: 'recce', state: 'upcoming', deleted_at: null },
    { id: uuid(), vendor_id: V, title: 'Blocked', event_date: plus(12), event_time: null, kind: 'blocked', state: 'upcoming', deleted_at: null },
  ];
  const { supabase } = makeDb({
    events: rows,
    vendors: [{ id: V, slot_capacity: null, category: 'photography' }],
    hot_dates: [{ date: plus(10), active: true }, { date: plus(40), active: true }, { date: plus(11), active: false }],
    leads: [{ id: uuid(), vendor_id: V, wedding_date: plus(20), state: 'new', deleted_at: null },
            { id: uuid(), vendor_id: V, wedding_date: plus(21), state: 'lost', deleted_at: null },
            { id: uuid(), vendor_id: V, wedding_date: plus(22), state: 'contacted', deleted_at: '2026-07-01T00:00:00Z' }],
  });
  const snap = await fetchCalendarSnapshot(mkReq(supabase));
  ok(snap.length > 0, 'the snapshot builds against the seeded estate');
  ok(!UUID_ANY.test(snap), '*** NO UUID PATTERN ANYWHERE IN THE BUILT OUTPUT *** — the clause, asserted by regex against the real string');
  ok(!/handle/i.test(snap), '   the word "handle" left with the ids — the instruction is gone, not just its payload (F-04.27\'s lesson, right way round)');
  ok(snap.includes(`- ${plus(5)} · Meera Kapoor - wedding shoot (shoot)`), '   a line is a referent Victor can SAY: date · title (kind), the ruled shape verbatim');
  ok(/Refer to a booking by its name/.test(snap), '   the header teaches the sayable referent in place of the handle it used to teach');
  ok(/\[Next 30 days:/.test(snap), 'P4.1\'s date-pressure line rides the same edit — one edit to one function, as ruled');
  ok(/muhurat/.test(snap) && !snap.includes(plus(40)), '   muhurat: in-window active date spoken; out-of-window and inactive dates are not');
  ok(/1 enquiry date in play/.test(snap), '   enquiry dates: open-state, live, in-window ONLY — lost and soft-deleted leads never count');
  const pressureLine = snap.split('\n').filter(l => l.startsWith('[Next')).join('');
  ok(pressureLine.length > 0 && !/\n.*\n.*\|/.test(pressureLine), '   one dense line, words not tables (spec P4.1\'s own constraint)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('2. R-B6-1 clause (b) — the two-leg gate. Exact · prefix · ambiguity · zero · covenant.');
{
  const idA = uuid(), idB = uuid(), idDead = uuid(), idCanc = uuid();
  const rows = [
    { id: idA,    vendor_id: V, title: 'Meera Kapoor - wedding shoot', event_date: plus(5),  kind: 'shoot', state: 'upcoming',  deleted_at: null, linked_binder_id: null },
    { id: idB,    vendor_id: V, title: 'Meera Kapoor - shoot',         event_date: plus(9),  kind: 'shoot', state: 'upcoming',  deleted_at: null, linked_binder_id: null },
    { id: idDead, vendor_id: V, title: 'Kaaya - trial',                event_date: plus(6),  kind: 'trial', state: 'upcoming',  deleted_at: '2026-07-01T00:00:00Z', linked_binder_id: null },
    { id: idCanc, vendor_id: V, title: 'Ritu - fitting',               event_date: plus(7),  kind: 'fitting', state: 'cancelled', deleted_at: null, linked_binder_id: null },
    { id: uuid(), vendor_id: 'other-vendor', title: 'Meera Kapoor - wedding shoot', event_date: plus(5), kind: 'shoot', state: 'upcoming', deleted_at: null, linked_binder_id: null },
  ];
  const { supabase } = makeDb({ events: rows });
  const req = mkReq(supabase);

  const exact = await resolveEvent(req, 'Meera Kapoor - wedding shoot', null);
  ok(exact.ev && exact.ev.id === idA, 'EXACT: the full title resolves to the one row — vendor-scoped (the other vendor\'s twin never surfaces)');

  const prefix = await resolveEvent(req, 'Ananya', null);
  ok(prefix.none === true, 'zero-match: an unknown name returns none (the old "tell me which one" survives where it was always true)');

  const pfx = await resolveEvent(req, 'Ritu', null);
  ok(pfx.none === true, 'COVENANT: a cancelled row never resolves on the referent leg — live rows only, as ruled');
  const dead = await resolveEvent(req, 'Kaaya', null);
  ok(dead.none === true, '   a tombstoned row never resolves either (F-04.25\'s covenant, F-04.58\'s family)');

  const amb = await resolveEvent(req, 'Meera', null);
  ok(amb.ambiguous && amb.ambiguous.length === 2, 'AMBIGUITY: two live candidates -> {ambiguous}, never a guess — "ambiguity resolves to honesty" (the ruling\'s words)');
  const line = mutationLines([{ action: 'edit', ok: false, reason: 'ambiguous', candidates: amb.ambiguous }]);
  ok(/more than one matches/.test(line) && /Tell me which one/.test(line), '   mutationLines speaks "tell me which one" for it');
  ok(line.includes(`Meera Kapoor - wedding shoot (${plus(5)})`) && line.includes(`Meera Kapoor - shoot (${plus(9)})`),
     '   BOTH candidates listed by title + date, verbatim in the sentence');

  const dated = await resolveEvent(req, 'Meera', plus(9));
  ok(dated.ev && dated.ev.id === idB, 'ON_DATE disambiguates: the same ambiguous name + its calendar-line date resolves to exactly that booking');

  const prefixOne = await resolveEvent(req, 'Kapoor', plus(5));
  ok(prefixOne.ev && prefixOne.ev.id === idA, 'PREFIX-TOLERANT: a name TOKEN resolves (nameMatches — resolveClientReference.js\'s one home for the rule; "riya" can never match "Priya")');

  const uu = await resolveEvent(req, idB, null);
  ok(uu.ev && uu.ev.id === idB, 'LEG 1 UNTOUCHED: a full UUID still resolves exactly as before (0-behaviour-change, disclosed)');
  const uuTrunc = await resolveEvent(req, idB.slice(0, 8), null);
  ok(uuTrunc.none === true, '   a truncated UUID falls to the referent leg, matches no title, and reports cleanly — the short-UUID lesson holds');
}

// ─────────────────────────────────────────────────────────────────────────
sec('3. R-B6-1 clause (c) — the pressure feed. OFF is OFF; unknown is unknown; never free.');
{
  // A RULED_OFF planner with a blocked day and a booking in the window.
  const { supabase } = makeDb({
    events: [
      { id: uuid(), vendor_id: V, title: 'Blocked',        event_date: plus(3), kind: 'blocked', state: 'upcoming', deleted_at: null },
      { id: uuid(), vendor_id: V, title: 'Sharma - venue', event_date: plus(4), kind: 'ceremony', state: 'upcoming', deleted_at: null },
    ],
    vendors: [{ id: V, slot_capacity: null, category: 'planning' }],
  });
  const win = await describeWindow({ supabase, vendorId: V, from: today, days: 30, candidateDates: [plus(3), plus(4)] });
  ok(win.occupancy === 'off' && win.reason === 'ruled_off', 'RULED_OFF planner: describeWindow says off/ruled_off — describeDate\'s eleven-null warrant, carried whole');
  ok(win.blockedDates.length === 1 && win.blockedDates[0] === plus(3), '   the block SURVIVES posture — a blocked day is blocked whatever the trade (describeDate\'s own order)');
  const words = windowWords(win);
  ok(/occupancy is off for this trade/.test(words), '*** THE LINE RENDERS OFF-HONEST FOR A RULED_OFF CATEGORY *** — the chartered assertion, on the built words');
  ok(!/free|open/i.test(words) && !/slots? held/.test(words), '   OFF is never dressed as open: no "free", no "open", no held-slot count for an OFF trade');
  ok(/1 day blocked/.test(words), '   the blocked day is spoken');

  // The finder failed -> the window is UNKNOWN, spoken as unknown.
  const unk = await describeWindow({ supabase, vendorId: V, from: today, days: 30, candidateDates: null });
  ok(unk.unknown === true, 'a failed date-finder makes the window UNKNOWN — null is never free (describeDate\'s three-valued contract, aggregated)');
  ok(/could not be read.*unknown, never as free/.test(windowWords(unk)), '   and the words say so before they say anything else');

  // An ON trade: counts flow out of describeDate's slots, never re-derived.
  const { supabase: sb2 } = makeDb({
    events: [
      { id: uuid(), vendor_id: V, title: 'A - shoot', event_date: plus(2), event_time: '10:00:00', kind: 'shoot', state: 'upcoming', deleted_at: null, slot: 'morning' },
      { id: uuid(), vendor_id: V, title: 'B - shoot', event_date: plus(2), event_time: '18:00:00', kind: 'shoot', state: 'upcoming', deleted_at: null, slot: 'evening' },
      { id: uuid(), vendor_id: V, title: 'Blocked',   event_date: plus(6), kind: 'blocked', state: 'upcoming', deleted_at: null, slot: 'full_day' },
    ],
    vendors: [{ id: V, slot_capacity: null, category: 'photography' }],
  });
  const on = await describeWindow({ supabase: sb2, vendorId: V, from: today, days: 30, candidateDates: [plus(2), plus(6)] });
  ok(on.occupancy === 'on' && on.heldSlots === 2 && on.heldDates.length === 1, 'photographer, two slots held one day: heldSlots=2, heldDates=1 — counted from describeDate\'s own slots');
  ok(/2 slots held across 1 day/.test(windowWords(on)) && /1 day blocked/.test(windowWords(on)), '   the words carry the numbers');

  // An empty window is still posture-probed: an OFF trade with nothing booked is OFF.
  const empty = await describeWindow({ supabase, vendorId: V, from: today, days: 30, candidateDates: [] });
  ok(empty.occupancy === 'off' && empty.reason === 'ruled_off' && empty.unknown === false,
     'a WITNESSED empty window still probes posture — an OFF trade with an empty book is OFF, not silently open');
}

// ─────────────────────────────────────────────────────────────────────────
sec('4. R-B6-4 (veto = YES) + the schema re-teach — the tool layer, at source.');
{
  // SOURCE assertions, disclosed as such: the engine gates (tsc + build + smoke +
  // tombstone 15/15) prove the file compiles and behaves; this proves the WORDS.
  const src = fs.readFileSync(RP, 'utf8');
  ok(src.includes('sent to the calendar; it will confirm or refuse.` };'),
     'the softened strings are IN (both use the §4-proposed clause verbatim) — founder veto slot = YES, executed');
  ok(!src.includes('it is being placed on the calendar.`') && !src.includes('the day is being taken off the calendar.`'),
     '   the optimistic originals are GONE from the two signal displays');
  ok((src.match(/sent to the calendar; it will confirm or refuse/g) || []).length === 2,
     '   exactly two: donna_book_event (:650\'s) and donna_block_date (:660\'s) — donna_unblock_date was never on the veto list and is untouched');
  const schemas = src.slice(src.indexOf('DONNA_EDIT_EVENT_TOOL'), src.indexOf('RECORD_TOOLS'));
  ok(!/handle/i.test(schemas), 'ZERO handle-teaching in the edit/cancel schemas — the description was the teacher (F-04.37\'s class), and it now teaches the referent');
  ok((schemas.match(/on_date/g) || []).length >= 2, '   both schemas gained on_date — the disambiguator the gate\'s leg 2 reads');
  ok(/booking's name as shown on the calendar/.test(schemas), '   event_id now asks for the NAME as shown — the sayable referent, taught where the handle was');
}

// ─────────────────────────────────────────────────────────────────────────
console.log('');
if (fail === 0) console.log(`   ══ ${pass}/${pass} PASS ══`);
else            console.log(`   ══ ${pass}/${pass + fail} — ${fail} FAILED ══`);
process.exit(fail === 0 ? 0 : 1);

})().catch((e) => { console.error('BENCH CRASHED:', e); process.exit(1); });
