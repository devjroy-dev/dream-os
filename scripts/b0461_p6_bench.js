#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b0461_p6_bench.js — TDW_04.5 P6: Victor the production manager.
//
//   node scripts/b0461_p6_bench.js        (engine sections need src/engine/dist — CE-53)
//
// WHAT IT DRIVES — nothing under test is stubbed:
//   §1  the REAL fetchCrewState (lib/vendor/crewSnapshot.js) over an in-memory store,
//       through the REAL normaliseCategory and the REAL OCCUPYING_KINDS.
//   §2  BOTH REAL SNAPSHOTS — chat.js's fetchCalendarSnapshot (PWA) and
//       calendarSignals.js's (handset) — over ONE fixture, and compares the crew-state
//       lines byte-for-byte. This is C4's both-homes claim PROVEN, not asserted.
//   §3  the REAL compiled runTurn with the Anthropic SDK fenced to a spy, so the
//       assertion is on the system prompt Victor is ACTUALLY handed.
//
// LD-5 BENCH LAW, HELD ABSOLUTE: §3 asserts that the weave is PRESENT or ABSENT and
// that the non-planner prefix is UNCHANGED. It never asserts a sentence of Victor's
// speech, and no transcript string appears in this file as a fixture. The three founder
// transcripts are read on a handset by a human; a bench cannot and must not stand in.
//
// BOTH-WAYS (production mutation, never test setup):
//   · §1/§2 flip when the crewSnapshot gate or the decline's assigned_member_ids filter
//     is broken in the module itself.
//   · §3 flips when loop.ts's isPlannerVoice gate is neutered.
//
// WHAT THIS DOES NOT PROVE, NAMED HONESTLY: that Victor SPEAKS well — that he raises the
// gap once and plainly rather than as a checklist, that the decline lands in his voice.
// That is the founder's read on his own handset, and it is the acceptance.
// ══════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const fs   = require('fs');
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
const ok  = (c, m) => { c ? (pass++, console.log('  PASS  ' + m)) : (fail++, console.log('  FAIL  ' + m)); };
const sec = (t) => console.log('\n── ' + t + ' ──');

// ── module fencing (b0457_gap_bench's rig, reused verbatim in shape) ────────
const snapPath = path.join(ROOT, 'src/lib/vendor/snapshot.js');
require.cache[snapPath] = { id: snapPath, filename: snapPath, loaded: true,
  exports: { logActivity: async () => {}, fetchRecentActivity: async () => [], formatActivityBlock: () => '' } };

const Module  = require('module');
const _load   = Module._load;
const BUILTIN = new Set(Module.builtinModules);
const noop    = () => new Proxy(function () {}, { get: () => noop() });
Module._load = function (req) {
  if (req === 'express') { const e = () => {}; e.Router = () => ({ get(){}, post(){}, patch(){}, put(){}, delete(){}, use(){} }); return e; }
  if (/engine\/dist\//.test(req)) return noop();
  if (!req.startsWith('.') && !req.startsWith('/') && !req.startsWith('node:') && !BUILTIN.has(req)) return noop();
  return _load.apply(this, arguments);
};

const { fetchCrewState } = require(path.join(ROOT, 'src/lib/vendor/crewSnapshot.js'));
const { fetchCalendarSnapshot: pwaSnapshot } = require(path.join(ROOT, 'src/api/vendor-engine/chat.js'));
const { fetchCalendarSnapshot: waSnapshot }  = require(path.join(ROOT, 'src/lib/vendor/calendarSignals.js'));

let SEQ = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++SEQ).padStart(12, '0')}`;
const V = '11111111-1111-1111-1111-111111111111';

class Q {
  constructor(db, table) { this.db = db; this.table = table; this.f = []; this.n = null; }
  select() { return this; }
  eq(c, v)  { this.f.push(r => r[c] === v); return this; }
  neq(c, v) { this.f.push(r => r[c] !== v); return this; }
  is(c, v)  { this.f.push(r => (r[c] === undefined ? null : r[c]) === v); return this; }
  in(c, vs) { this.f.push(r => vs.map(String).includes(String(r[c]))); return this; }
  gte(c, v) { this.f.push(r => r[c] != null && r[c] >= v); return this; }
  lte(c, v) { this.f.push(r => r[c] != null && r[c] <= v); return this; }
  not(c, op, v) { if (op === 'is') this.f.push(r => (r[c] === undefined ? null : r[c]) !== v); return this; }
  limit(n)  { this.n = n; return this; }
  order()   { return this; }
  _rows()   { const t = this.db.t[this.table] || []; let out = t.filter(r => this.f.every(fn => fn(r))); if (this.n != null) out = out.slice(0, this.n); return out; }
  maybeSingle() { const r = this._rows(); return Promise.resolve({ data: r[0] || null, error: null }); }
  then(res) { if (this.db.fail && this.db.fail.has(this.table)) return res({ data: null, error: { message: `bench: ${this.table} forced to fail` } });
              return res({ data: this._rows(), error: null }); }
}
function makeDb(tables, failTables) {
  const db = { t: tables, fail: failTables ? new Set(failTables) : null };
  return { db, supabase: { from: (t) => new Q(db, t), schema() { return this; } } };
}

const today = new Date().toISOString().slice(0, 10);
const plus  = (n) => { const d = new Date(`${today}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const ev = (o) => ({ id: uuid(), vendor_id: V, event_time: null, state: 'upcoming', deleted_at: null, assigned_member_ids: [], ...o });

(async () => {

// ═══════════════════════════════════════════════════════════════════════════
sec('1. THE GAP LINE — planner-gated, carried through the extraction unchanged');
{
  const { supabase } = makeDb({
    events: [
      ev({ title: 'Kapoor mehendi', event_date: plus(9),  kind: 'ceremony' }),
      ev({ title: 'Rao sangeet',    event_date: plus(14), kind: 'ceremony' }),
      ev({ title: 'Iyer wedding',   event_date: plus(6),  kind: 'ceremony', assigned_member_ids: [uuid()] }),
    ],
  });
  const planner = await fetchCrewState(supabase, V, 'planner', today);
  ok(/2 functions in the next 3 weeks have no one on them \(Kapoor mehendi — 9 days\)/.test(planner.gap),
     'planner: two gaps counted, soonest named, plural grammar agrees');
  const shooter = await fetchCrewState(supabase, V, 'photographer', today);
  ok(shooter.gap === '', 'photographer: the gate holds — NO gap line (the negative branch)');
  ok(planner.gap.startsWith('\n['), 'the line keeps its bracket-block shape (the snapshot register)');
}

// ═══════════════════════════════════════════════════════════════════════════
sec('2. THE GAP LINE — the honesty law survived the move');
{
  const { supabase } = makeDb({
    events: [ev({ title: 'Kapoor mehendi', event_date: plus(9), kind: 'ceremony' })],
  }, ['events']);                                   // the read FAILS
  const r = await fetchCrewState(supabase, V, 'planner', today);
  ok(r.gap === '' && r.decline === '',
     'a failed events read renders NOTHING — never "0 functions", never "no declines"');
}

// ═══════════════════════════════════════════════════════════════════════════
sec('3. THE DECLINE LINE — state, never event');
{
  const SWATI = uuid(), RAHUL = uuid();
  const E1 = uuid(), E2 = uuid();
  const { supabase } = makeDb({
    events: [
      { id: E1, vendor_id: V, title: 'Ananya recce', event_date: plus(4), kind: 'ceremony', state: 'upcoming', deleted_at: null, event_time: null, assigned_member_ids: [SWATI] },
      { id: E2, vendor_id: V, title: 'Kapoor mehendi', event_date: plus(9), kind: 'ceremony', state: 'upcoming', deleted_at: null, event_time: null, assigned_member_ids: [RAHUL] },
    ],
    crew_confirmations: [
      { event_id: E1, member_id: SWATI, status: 'declined' },
      { event_id: E2, member_id: RAHUL, status: 'confirmed' },
    ],
    team_members: [
      { id: SWATI, vendor_id: V, name: 'Swati' },
      { id: RAHUL, vendor_id: V, name: 'Rahul' },
    ],
  });
  const r = await fetchCrewState(supabase, V, 'planner', today);
  ok(/Crew declined, still assigned: Swati on the Ananya recce\./.test(r.decline),
     'the declined member is named with her function');
  ok(!/Rahul/.test(r.decline), 'a CONFIRMED member does not appear (only declines)');
  ok(!/\bnew\b|\bsince\b|\bjust\b/i.test(r.decline),
     'the line carries NO arrival grammar — no "new", no "since" (Fork C: state, not event)');
}

// ═══════════════════════════════════════════════════════════════════════════
sec('4. THE DECLINE LINE — the gate is assigned_member_ids, not the confirmation row');
{
  // TWO PATHS REACH THIS RULE AND THE BENCH MUST WALK BOTH — the first cut of this
  // section walked only path (a) and a production mutation of the filter stayed GREEN,
  // because the empty-crew early return answered before the filter was ever reached.
  // The hole was found by mutation, not by eye. Disclosed, and closed here.
  const SWATI = uuid(), RAHUL = uuid();
  const E1 = uuid(), E2 = uuid();
  const { supabase } = makeDb({
    // (a) Swati declined, THEN the vendor emptied the crew. crew_confirmations is NOT
    //     pruned on unassign (CE-48, accepted as design) — the row survives her removal.
    // (b) THE PATH THAT EXERCISES THE FILTER: Swati declined the Kapoor mehendi, was
    //     taken off, and RAHUL was put on in her place. The function still has crew, so
    //     the early return does not fire and the still-assigned filter must do the work.
    events: [
      { id: E1, vendor_id: V, title: 'Ananya recce',   event_date: plus(4), kind: 'ceremony', state: 'upcoming', deleted_at: null, event_time: null, assigned_member_ids: [] },
      { id: E2, vendor_id: V, title: 'Kapoor mehendi', event_date: plus(9), kind: 'ceremony', state: 'upcoming', deleted_at: null, event_time: null, assigned_member_ids: [RAHUL] },
    ],
    crew_confirmations: [
      { event_id: E1, member_id: SWATI, status: 'declined' },
      { event_id: E2, member_id: SWATI, status: 'declined' },
    ],
    team_members: [{ id: SWATI, vendor_id: V, name: 'Swati' }, { id: RAHUL, vendor_id: V, name: 'Rahul' }],
  });
  const r = await fetchCrewState(supabase, V, 'planner', today);
  ok(r.decline === '',
     'a decline whose assignment was withdrawn is SILENT — true of a row, false of the world');
  ok(!/Swati/.test(r.decline),
     'and silent even when the function still HAS crew — the filter, not the early return');
}

// ═══════════════════════════════════════════════════════════════════════════
sec('5. THE DECLINE LINE — never a bare id, and never category-gated');
{
  const GHOST = uuid(), E1 = uuid(), SWATI = uuid(), E2 = uuid();
  const { supabase } = makeDb({
    events: [
      { id: E1, vendor_id: V, title: 'Ananya recce', event_date: plus(4), kind: 'ceremony', state: 'upcoming', deleted_at: null, event_time: null, assigned_member_ids: [GHOST] },
      { id: E2, vendor_id: V, title: 'Verma shoot', event_date: plus(5), kind: 'shoot', state: 'upcoming', deleted_at: null, event_time: null, assigned_member_ids: [SWATI] },
    ],
    crew_confirmations: [
      { event_id: E1, member_id: GHOST, status: 'declined' },
      { event_id: E2, member_id: SWATI, status: 'declined' },
    ],
    team_members: [{ id: SWATI, vendor_id: V, name: 'Swati' }],   // GHOST has no row
  });
  const r = await fetchCrewState(supabase, V, 'photographer', today);
  ok(!r.decline.includes(GHOST), 'an unresolvable member is DROPPED, never rendered as a uuid (F-04.66)');
  ok(/Swati on the Verma shoot/.test(r.decline),
     'the decline line fires for a PHOTOGRAPHER — declines are all-vendor (the crew page is)');
  ok(r.gap === '', 'and the gap line stays planner-only in the same call — the two gates differ by design');
}

// ═══════════════════════════════════════════════════════════════════════════
sec('6. BOTH HOMES — C4 PROVEN, not claimed: one fixture, two doors, byte-identical lines');
{
  const SWATI = uuid(), E1 = uuid(), E2 = uuid();
  const tables = () => ({
    events: [
      { id: E1, vendor_id: V, title: 'Ananya recce', event_date: plus(4), kind: 'ceremony', state: 'upcoming', deleted_at: null, event_time: null, assigned_member_ids: [SWATI] },
      { id: E2, vendor_id: V, title: 'Kapoor mehendi', event_date: plus(9), kind: 'ceremony', state: 'upcoming', deleted_at: null, event_time: null, assigned_member_ids: [] },
    ],
    crew_confirmations: [{ event_id: E1, member_id: SWATI, status: 'declined' }],
    team_members: [{ id: SWATI, vendor_id: V, name: 'Swati' }],
    hot_dates: [], leads: [],
  });
  const a = makeDb(tables()), b = makeDb(tables());
  const pwa = await pwaSnapshot({ app: { locals: { supabase: a.supabase } }, vendor: { id: V, category: 'planner' } });
  const wa  = await waSnapshot(b.supabase, V, 'planner');

  const crewLines = (s) => (s.match(/\n\[(?:\d+ functions?|Crew declined)[^\]]*\]/g) || []).join('');
  const pc = crewLines(pwa), wc = crewLines(wa);
  ok(pc.length > 0, 'the PWA door renders crew-state lines');
  ok(wc.length > 0, 'the HANDSET door renders crew-state lines (Fork A: the port landed)');
  ok(pc === wc, 'THE TWO DOORS RENDER BYTE-IDENTICAL CREW-STATE — one home, so they cannot drift');
  ok(/Next 30 days:/.test(pwa) && !/Next 30 days:/.test(wa),
     'the PRESSURE line stayed PWA-only — the unasked sibling did not travel');
}

// ═══════════════════════════════════════════════════════════════════════════
sec('7. THE HANDSET SIGNATURE — the both-sides clause, proven on the old shape');
{
  const { supabase } = makeDb({
    events: [{ id: uuid(), vendor_id: V, title: 'Kapoor mehendi', event_date: plus(9), kind: 'ceremony', state: 'upcoming', deleted_at: null, event_time: null, assigned_member_ids: [] }],
    crew_confirmations: [], team_members: [],
  });
  const twoArg = await waSnapshot(supabase, V);                 // the PRE-P6 call shape
  ok(!/no one on/.test(twoArg),
     'a 2-arg caller (b5_wa_door_bench:181 is one) gets NO crew line — byte-identical to pre-P6');
}

// ═══════════════════════════════════════════════════════════════════════════
sec('8. THE VOICE GATE — the weave reaches Victor, and only a planner');
{
  const soulSrc = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/harveySoul.ts'), 'utf8');
  const loopSrc = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/loop.ts'), 'utf8');
  ok(/export const PRODUCTION_WEAVE/.test(soulSrc),
     'the weave is its OWN constant — HARVEY_SOUL is byte-untouched for the other 24 fields');
  ok(/isPlannerVoice = !isConsult && args\.vendorCategory === 'planning'/.test(loopSrc),
     'the gate reads the DOOR-NORMALISED category (one home for the predicate)');
  ok(/\+ \(isPlannerVoice \? PRODUCTION_WEAVE : ''\)/.test(loopSrc),
     'the weave is APPENDED conditionally — a non-planner prefix is byte-identical (E-1)');
  ok(!/PRODUCTION_WEAVE/.test(loopSrc.slice(loopSrc.indexOf('CONSULTANT_HARVEY_SOUL :'), loopSrc.indexOf('+ (isAdvisor'))) ||
     /!isConsult/.test(loopSrc.slice(loopSrc.indexOf('isPlannerVoice'), loopSrc.indexOf('isPlannerVoice') + 80)),
     'consult is excluded — he has no roster to read and no door to signal');

  // The weave must survive the persona firewall: every vendor-speakable string pre-reads
  // through scrubText before shipping (guardrail 4). The soul can be echoed, so it counts.
  const { scrubText } = require(path.join(ROOT, 'src/lib/vendor/scrub.js'));
  const weave = soulSrc.match(/export const PRODUCTION_WEAVE = `([\s\S]*?)`;/)[1];
  ok(scrubText(weave) === weave, 'the weave passes scrubText BYTE-IDENTICAL — no machinery leaks');
  ok(weave.length <= 600, `the weave is within spec §P6's 600-char cap (${weave.length})`);
  ok(!/\bDone\b/.test(weave) && !/\bfiled\b/i.test(weave),
     'the weave teaches no completion vocabulary — F-04.100/F-04.102 as anti-spec');
}

// ─────────────────────────────────────────────────────────────────────────
console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
