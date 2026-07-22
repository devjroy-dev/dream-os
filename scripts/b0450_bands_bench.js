#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b0450_bands_bench.js — TDW_04.5 P2, THE WEDDING-BAND VIEW bench.
//
//   node scripts/b0450_bands_bench.js
//
// WHAT IT DRIVES: the REAL `buildBands` exported from src/api/vendor/bands.js, over an
// in-memory supabase whose filters run for real (the b0457_crew_bench pattern, same Q
// class, extended with `.schema('engine')` so the one enumerated engine hop is exercised
// rather than mocked away). The REAL `isOccupying` decides every gap. The REAL
// `normaliseCategory` decides every default_view. NOTHING UNDER TEST IS STUBBED — the
// only doubles are the network and the auth middleware, neither of which this builder
// touches.
//
// BOTH-WAYS (the law), by MUTATION OF PRODUCTION CODE, never of test setup:
//   (i)  In src/api/vendor/bands.js, change the gap line
//          gap: isOccupying(ev.kind) && crew.length === 0,
//        to
//          gap: crew.length === 0,
//        (i.e. drop the occupancy predicate — the "every empty function is a gap" bug).
//        RE-RUN: section 4 goes RED on exactly the recce/meeting cases; every other
//        section stays GREEN.
//   (ii) Change the default_view line's comparison from === 'planning' to === 'planner'
//        (the plausible-looking wrong token). RE-RUN: section 6 goes RED on exactly the
//        planner rows; the photographer row stays GREEN because it was never planning.
//  (iii) Delete the `.neq('kind', 'blocked')` clause from the spine query.
//        RE-RUN: section 1 goes RED on exactly the block-exclusion assert.
// Each mutation is reverted after witnessing. The disclosed red sets are in the handover.
//
// ⚠ WHAT IT DOES NOT PROVE, NAMED: that the PWA renders these rings, or that a live
//   founder's account is planner-category (no DB reach from an LE container — that is
//   precisely why the payload carries `category` beside `default_view`, so the founder's
//   smoke step 1 witnesses it). The wire contract is what this bench owns.
// ══════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { buildBands, initialsOf } = require(path.join(ROOT, 'src/api/vendor/bands.js'));

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  PASS  ' + m); } else { fail++; console.log('  FAIL  ' + m); } };
const section = (t) => console.log('\n── ' + t + ' ──');

// ── an in-memory supabase; filters run for real ──────────────────────────
class Q {
  constructor(db, table) { this.db = db; this.table = table; this.f = []; this.n = null; }
  select() { return this; }
  eq(c, v)  { this.f.push(r => r[c] === v); return this; }
  neq(c, v) { this.f.push(r => r[c] !== v); return this; }
  is(c, v)  { this.f.push(r => (r[c] === undefined ? null : r[c]) === v); return this; }
  in(c, vs) { this.f.push(r => vs.includes(r[c])); return this; }
  gte(c, v) { this.f.push(r => r[c] != null && r[c] >= v); return this; }
  lte(c, v) { this.f.push(r => r[c] != null && r[c] <= v); return this; }
  order()   { return this; }
  limit(n)  { this.n = n; return this; }
  _rows() {
    if (this.db.fail[this.table]) return null;
    let rs = this.db.t[this.table] || [];
    for (const fn of this.f) rs = rs.filter(fn);
    return this.n ? rs.slice(0, this.n) : rs;
  }
  run() {
    const rs = this._rows();
    if (rs === null) return { data: null, error: { message: `${this.table} exploded` } };
    return { data: rs, error: null };
  }
  then(res, rej) { try { res(this.run()); } catch (e) { rej(e); } }
}
function makeDb({ events = [], team = [], confirmations = [], records = [], fail = {} } = {}) {
  const db = {
    fail,
    t: {
      // vendor_id defaults to v1: without it the spine's own eq() emptied the board and
      // every exclusion assert below passed VACUOUSLY — caught on this bench's first run
      // and recorded, because a green over an empty set is the disease the law names.
      events: events.map(e => ({ vendor_id: 'v1', state: 'upcoming', deleted_at: null, slot: null,
                                 event_time: null, linked_binder_id: null, assigned_member_ids: [], ...e })),
      team_members:       team.map(m => ({ active: true, deleted_at: null, role: null, ...m })),
      crew_confirmations: confirmations.slice(),
      records:            records.slice(),
    },
  };
  const client = {
    from: (t) => new Q(db, t),
    schema: () => ({ from: (t) => new Q(db, t) }),
  };
  return { db, client };
}
const V = { id: 'v1', category: 'wedding planner' };
const run = (fx, over = {}) => {
  const { client } = makeDb(fx);
  return buildBands({ supabase: client, vendor: V, from: '2026-07-01', to: '2026-07-31', agentId: 'a1', ...over });
};

(async () => {
  // ═══ 1. THE SPINE: what a band board is allowed to see ═══════════════════
  section('1. the spine — covenant + the block law');
  {
    const r = await run({
      events: [
        { id: 'e1', title: 'Ananya sangeet', kind: 'ceremony', event_date: '2026-07-25' },
        { id: 'e2', title: 'cancelled thing', kind: 'ceremony', event_date: '2026-07-26', state: 'cancelled' },
        { id: 'e3', title: 'deleted thing',   kind: 'ceremony', event_date: '2026-07-27', deleted_at: '2026-07-01' },
        { id: 'e4', title: 'Out of town',     kind: 'blocked',  event_date: '2026-07-28' },
        { id: 'e5', title: 'out of window',   kind: 'ceremony', event_date: '2026-09-01' },
      ],
    });
    const ids = r.loose.map(f => f.event_id);
    ok(ids.includes('e1'), 'a live function is on the board');
    ok(!ids.includes('e2'), 'the covenant holds: cancelled is not on the board');
    ok(!ids.includes('e3'), 'the covenant holds: soft-deleted is not on the board');
    ok(!ids.includes('e4'), 'A BLOCK IS NOT AN ENGAGEMENT (F-04.36): kind=blocked excluded');
    ok(!ids.includes('e5'), 'the window is respected: out-of-range excluded');
    ok(r.loose.length === 1, 'exactly one function survives the spine');
  }

  // ═══ 2. GROUPING: binder = band, no binder = loose ═══════════════════════
  section('2. grouping — linked_binder_id is the band');
  {
    const r = await run({
      events: [
        { id: 'e1', title: 'Ananya recce',   kind: 'recce',    event_date: '2026-07-25', linked_binder_id: 'b1' },
        { id: 'e2', title: 'Ananya sangeet', kind: 'ceremony', event_date: '2026-07-29', linked_binder_id: 'b1' },
        { id: 'e3', title: 'a stray shoot',  kind: 'shoot',    event_date: '2026-07-10' },
      ],
      records: [{ id: 'b1', agent_id: 'a1', client: 'Ananya Sharma', amount: 125000, direction: 'in', amount_received: 40000, amount_pending: null }],
    });
    ok(r.bands.length === 1 && r.bands[0].binder_id === 'b1', 'one band per binder');
    ok(r.bands[0].functions.length === 2, 'both linked functions ride the band');
    ok(r.loose.length === 1 && r.loose[0].event_id === 'e3', 'the unlinked function is LOOSE, never dropped');
    ok(r.bands[0].title === 'Ananya Sharma', 'the band title is the binder client');
    ok(r.bands[0].span.start === '2026-07-25' && r.bands[0].span.end === '2026-07-29', 'span = min/max linked date in range');
  }

  // ═══ 3. THE MONEY CELLS: raw, four, un-derived (CE ruling F2(b)) ═════════
  section('3. money — the FOUR RAW CELLS, no rule applied here');
  {
    const r = await run({
      events: [{ id: 'e1', title: 'f', kind: 'ceremony', event_date: '2026-07-25', linked_binder_id: 'b1' }],
      records: [{ id: 'b1', agent_id: 'a1', client: 'A', amount: 125000, direction: 'in', amount_received: 40000, amount_pending: null }],
    });
    const m = r.bands[0].money;
    ok(m !== null, 'money rides the band when the binder resolves');
    ok(Object.keys(m).sort().join(',') === 'amount,amount_pending,amount_received,direction',
      'EXACTLY the four witnessed cells — no `pending`, no `received` story, no third copy of the rule');
    ok(m.amount === 125000 && m.amount_received === 40000 && m.amount_pending === null && m.direction === 'in',
      'the cells travel RAW, un-normalised (amount_pending null stays null — the canon reads unfiled)');
  }
  {
    const r = await run({
      events: [{ id: 'e1', title: 'f', kind: 'ceremony', event_date: '2026-07-25', linked_binder_id: 'b9' }],
      records: [],   // the binder does not resolve
    });
    ok(r.bands[0].money === null, 'ABSENT-HONESTY: no binder => money null (the client elides; NEVER ₹0)');
    ok(r.bands[0].title === null, 'no binder => title null (the client renders "Untitled wedding")');
  }

  // ═══ 4. THE GAP FLAG: isOccupying is asked, never re-listed ══════════════
  section('4. gap — occupying && crew empty');
  {
    const r = await run({
      events: [
        { id: 'e1', title: 'sangeet', kind: 'ceremony', event_date: '2026-07-25' },                       // occupying, empty
        { id: 'e2', title: 'shoot',   kind: 'shoot',    event_date: '2026-07-26', assigned_member_ids: ['m1'] }, // occupying, staffed
        { id: 'e3', title: 'recce',   kind: 'recce',    event_date: '2026-07-27' },                       // NOT occupying, empty
        { id: 'e4', title: 'meeting', kind: 'meeting',  event_date: '2026-07-28' },                       // NOT occupying, empty
        { id: 'e5', title: 'family',  kind: 'family',   event_date: '2026-07-29' },                       // occupying, empty
      ],
      team: [{ id: 'm1', vendor_id: 'v1', name: 'Swati Rao' }],
    });
    const g = Object.fromEntries(r.loose.map(f => [f.event_id, f.gap]));
    ok(g.e1 === true,  'ceremony with no crew IS a gap');
    ok(g.e2 === false, 'shoot WITH crew is not a gap');
    ok(g.e3 === false, 'recce with no crew is NOT a gap — recce is not occupying (occupancy.js:103)');
    ok(g.e4 === false, 'meeting with no crew is NOT a gap — an appointment sells nothing');
    ok(g.e5 === true,  'family with no crew IS a gap');
  }

  // ═══ 5. THE CREW + THE RINGS: DB truth, three states ═════════════════════
  section('5. crew circles + the ring vocabulary (0087 §D)');
  {
    const r = await run({
      events: [
        { id: 'e1', title: 'sangeet', kind: 'ceremony', event_date: '2026-07-29', assigned_member_ids: ['m1', 'm2', 'm3'] },
        { id: 'e2', title: 'recce',   kind: 'recce',    event_date: '2026-07-25', assigned_member_ids: [] },
      ],
      team: [
        { id: 'm1', vendor_id: 'v1', name: 'Swati Rao' },
        { id: 'm2', vendor_id: 'v1', name: 'Ishaan' },
        { id: 'm3', vendor_id: 'v1', name: 'Nikita Verma' },
      ],
      confirmations: [
        { event_id: 'e1', member_id: 'm1', status: 'pending' },
        { event_id: 'e1', member_id: 'm2', status: 'confirmed' },
        { event_id: 'e1', member_id: 'm3', status: 'declined' },
      ],
    });
    const f  = r.loose.find(x => x.event_id === 'e1');
    const by = Object.fromEntries(f.crew.map(c => [c.member_id, c]));
    ok(f.crew.length === 3, 'three circles on the sangeet');
    ok(by.m1.confirmation === 'pending',   'HOLLOW ring: pending, straight from crew_confirmations');
    ok(by.m2.confirmation === 'confirmed', 'SOLID BRASS ring: confirmed');
    ok(by.m3.confirmation === 'declined',  'TERRACOTTA ring: declined');
    ok(by.m1.initials === 'SR' && by.m2.initials === 'I' && by.m3.initials === 'NV', 'initials: first+last, single name -> one letter');
    ok(r.loose.find(x => x.event_id === 'e2').crew.length === 0, 'the recce carries NO circle when nobody is on it');
  }
  {
    // A member assigned then deactivated/deleted: absent, never invented.
    const r = await run({
      events: [{ id: 'e1', title: 's', kind: 'ceremony', event_date: '2026-07-29', assigned_member_ids: ['m1', 'mGONE'] }],
      team:   [{ id: 'm1', vendor_id: 'v1', name: 'Swati Rao' },
               { id: 'mGONE', vendor_id: 'v1', name: 'Ghost', deleted_at: '2026-07-01' }],
    });
    const f = r.loose[0];
    ok(f.crew.length === 1 && f.crew[0].member_id === 'm1', 'a deleted member resolves to NO circle (absent, not invented)');
  }
  {
    // No confirmations row at all — assign-time upsert writes 'pending', so absence agrees.
    const r = await run({
      events: [{ id: 'e1', title: 's', kind: 'ceremony', event_date: '2026-07-29', assigned_member_ids: ['m1'] }],
      team:   [{ id: 'm1', vendor_id: 'v1', name: 'Swati Rao' }],
      confirmations: [],
    });
    ok(r.loose[0].crew[0].confirmation === 'pending', 'no confirmations row reads pending — absence and P1.5 agree');
  }

  // ═══ 6. DEFAULT_VIEW: the predicate's one home answers ═══════════════════
  section('6. default_view — normaliseCategory, server-side (CE ruling F1(c))');
  {
    const mk = async (category) => {
      const { client } = makeDb({ events: [] });
      return buildBands({ supabase: client, vendor: { id: 'v1', category }, from: '2026-07-01', to: '2026-07-31', agentId: null });
    };
    ok((await mk('wedding planner')).default_view === 'weddings', 'planner -> weddings');
    ok((await mk('Planning')).default_view       === 'weddings', 'planning (any case) -> weddings');
    ok((await mk('coordinator')).default_view    === 'weddings', 'coordinator -> weddings (the one home says so)');
    ok((await mk('photographer')).default_view   === 'month',    'photographer -> month');
    ok((await mk(null)).default_view             === 'month',    'no category -> month (the ruled fallback)');
    ok((await mk('wedding planner')).category    === 'wedding planner',
      'the payload carries the category it computed FROM — smoke step 1 is self-witnessing');
  }

  // ═══ 7. FAIL POSTURE: spine hard, decoration soft ════════════════════════
  section('7. fail posture — the spine 500s, decoration degrades honestly');
  {
    let threw = null;
    try { await run({ events: [], fail: { events: true } }); } catch (e) { threw = e; }
    ok(threw !== null && threw.__bandsSpine === true, 'a failed events read THROWS the spine marker (route -> 500, never an empty board)');
  }
  {
    const r = await run({
      events: [{ id: 'e1', title: 's', kind: 'ceremony', event_date: '2026-07-29', assigned_member_ids: ['m1'], linked_binder_id: 'b1' }],
      team:   [{ id: 'm1', vendor_id: 'v1', name: 'Swati Rao' }],
      records: [{ id: 'b1', agent_id: 'a1', client: 'A', amount: 1, direction: 'in', amount_received: 0, amount_pending: 1 }],
      fail:   { team_members: true, records: true },
    });
    ok(r.bands.length === 1, 'the board still renders when BOTH decoration legs fail');
    ok(r.bands[0].money === null && r.bands[0].title === null, 'failed engine hop -> no whisper, no title (ST-2 blindness, not a lie)');
    ok(r.bands[0].functions[0].crew.length === 0, 'failed crew read -> no circles (absent, not invented)');
    ok(r.bands[0].functions[0].gap === true, 'and the gap flag still tells the truth it can see');
  }
  {
    const r = await run({
      events: [{ id: 'e1', title: 's', kind: 'ceremony', event_date: '2026-07-29', linked_binder_id: 'b1' }],
      records: [{ id: 'b1', agent_id: 'a1', client: 'A', amount: 5, direction: 'in', amount_received: 0, amount_pending: 5 }],
    }, { agentId: null });
    ok(r.bands[0].money === null, 'no agent resolved -> the engine hop is SKIPPED, whisper elided (never guessed)');
  }

  // ═══ 8. initialsOf, directly ════════════════════════════════════════════
  section('8. initials');
  ok(initialsOf('Swati Rao') === 'SR', 'two names -> first+last');
  ok(initialsOf('Ishaan') === 'I', 'one name -> one letter');
  ok(initialsOf('  Meera   Devi  Nair ') === 'MN', 'whitespace-tolerant, first+LAST');
  ok(initialsOf('') === '?', 'empty name -> ? (never an empty circle)');
  ok(initialsOf(null) === '?', 'null name -> ?');

  console.log(`\n══ b0450_bands_bench: ${pass} passed, ${fail} failed ══\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('BENCH CRASHED:', e); process.exit(1); });
