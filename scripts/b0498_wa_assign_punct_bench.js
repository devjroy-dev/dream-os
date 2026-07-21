// ══════════════════════════════════════════════════════════════════════════
// b0498_wa_assign_punct_bench — TDW_04.5 F-04.98 — ONE RESOLUTION, EVERY DOOR
// ══════════════════════════════════════════════════════════════════════════
//
// WHAT IT DRIVES: the REAL library WA-door apparatus in
// src/lib/vendor/calendarSignals.js — applyCalendarSignals (the WA door's own
// post-turn pass, invoked from vendorInbound.js:803), its mutateEvents leg, its
// mutationLines renderer, its resolveEvent gate — and the REAL shared refinement
// matcher nameMatches (src/lib/vendor/resolveClientReference.js), all over the
// PROVEN in-memory events/vendors/team_members double reused VERBATIM from the
// SEALED b0457_assign_bench (its Q + makeDb + uuid). The REAL writeEvent /
// checkOccupancy / memberClashCheck sit behind mutateEvents. Nothing under test is
// stubbed; the only double is the network table.
//
// THE DISEASE (F-04.98, chair-convicted + founder-forensics):
//   1. The #4 crew-assign resolution landed in chat.js's copy only (CE-53). The
//      library copy calendarSignals.js — the ONE the WA door actually runs via
//      applyCalendarSignals — never received the donna_assign_crew leg. A WA
//      voice-assign therefore fired the signal, resolved NOTHING, rendered NO
//      line: the model's prose shipped alone. §1 witnesses that end-to-end.
//   2. resolveEvent's %raw% ilike prefilter + nameMatches cannot cross
//      punctuation: 'Ananya recce' never found the true title 'Ananya - recce'.
//      §2 witnesses that end-to-end; §3 holds the R-B6 negative (riya ≠ Priya).
//
// WHY IT IS NON-VACUOUS — THE BOTH-WAYS PROOF: run from the UNCURED tree
// (6161682) and §1 + §2 + the §3 hyphen-unit go RED while the §3 riya/Priya
// negative stays GREEN (proving the bench is not vacuously red); run from the
// cured tree and every line goes GREEN. Same file, two trees.
//
// Run it: node scripts/b0498_wa_assign_punct_bench.js
// ══════════════════════════════════════════════════════════════════════════
'use strict';

// LOAD NOTE (mirrors b0457_assign_bench): the require chain touches the engine's lazy
// Supabase client (recordPrimitives → db). The door path never uses that client — it
// uses the in-memory double below — so placeholder env only satisfies construction
// (supabase-js makes no network call at construct). Set BEFORE the require.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-dummy-key';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test';
process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'test';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const cal  = require(path.join(ROOT, 'src/lib/vendor/calendarSignals.js'));
const { nameMatches } = require(path.join(ROOT, 'src/lib/vendor/resolveClientReference'));

// ── the PROVEN double, reused verbatim from b0457_assign_bench (its Q + makeDb) ──
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
    crew_confirmations: [], hot_dates: [],
  } };
  return { api: { from: (t) => new Q(db, t), schema() { return this; } }, db };
}

// ══════════════════════════════════════════════════════════════════════════
let pass = 0, fail = 0; const fails = [];
const ok = (c, m) => { c ? (pass++, console.log('  PASS  ' + m)) : (fail++, fails.push(m), console.log('  FAIL  ' + m)); };
const sec = (t) => console.log('\n── ' + t + ' ──');

const V     = uuid('1');
const AG    = uuid('e');
const RAHUL = uuid('a');
const SWATI = uuid('c');
const EVID  = uuid('d');
const VEND  = { id: V };

// A crew hand nests in tool_calls[].donna_calls[] in production; drive it the same way
// (the shape the library mutateEvents' collect() reads on BOTH tool_calls and donna_calls).
const crewResult = (input) => ({ tool_calls: [ { name: 'dear_donna_talk', donna_calls: [ { name: 'donna_assign_crew', input } ] } ] });

async function main() {
  // ════════════════════════════════════════════════════════════════════════
  // §1 — CURE 1: the WA door's OWN pass (applyCalendarSignals) resolves a crew
  //      assign AND renders the witness line INTO THE OUTBOUND SUFFIX.
  //      Uncured: calendarSignals.mutateEvents has no donna_assign_crew leg →
  //      no write, no line, empty suffix. RED.
  // ════════════════════════════════════════════════════════════════════════
  sec('§1 — WA-door end-to-end assign (applyCalendarSignals → suffix)');
  {
    const { api, db } = makeDb({
      vendor: { id: V },
      team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
      events: [{ id: EVID, vendor_id: V, title: 'Verma reception', event_date: '2026-07-24', event_time: '19:00', slot: 'evening', kind: 'shoot', assigned_member_ids: [] }],
    });
    const out = await cal.applyCalendarSignals(api, VEND, AG, crewResult({ event_id: 'Verma', member: 'Rahul', action: 'assign' }));
    const row = db.t.events.find(e => e.id === EVID);
    ok(Array.isArray(row.assigned_member_ids) && row.assigned_member_ids.includes(RAHUL), '§1.1 WA assign WRITES the crew to the row (resolution reached writeEvent)');
    ok(Array.isArray(out.mutated) && out.mutated.some(m => m.action === 'assign' && m.ok), '§1.2 applyCalendarSignals reports the assign in `mutated`');
    ok(typeof out.suffix === 'string' && /Rahul's on the Verma reception/.test(out.suffix), '§1.3 the witness line rides the OUTBOUND SUFFIX (the WA reply text)');
  }
  {
    const { api, db } = makeDb({
      vendor: { id: V },
      team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
      events: [{ id: EVID, vendor_id: V, title: 'Verma reception', event_date: '2026-07-24', event_time: '19:00', slot: 'evening', kind: 'shoot', assigned_member_ids: [RAHUL] }],
    });
    const out = await cal.applyCalendarSignals(api, VEND, AG, crewResult({ event_id: 'Verma', member: 'Rahul', action: 'unassign' }));
    const row = db.t.events.find(e => e.id === EVID);
    ok(Array.isArray(row.assigned_member_ids) && !row.assigned_member_ids.includes(RAHUL), '§1.4 WA unassign REMOVES the crew from the row');
    ok(typeof out.suffix === 'string' && /Rahul's off the Verma reception/.test(out.suffix), '§1.5 the off-witness line rides the OUTBOUND SUFFIX');
  }
  {
    // member not on the team — the honest echo must render (not silence, not prose-alone)
    const { api } = makeDb({
      vendor: { id: V },
      team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
      events: [{ id: EVID, vendor_id: V, title: 'Verma reception', event_date: '2026-07-24', kind: 'shoot', assigned_member_ids: [] }],
    });
    const out = await cal.applyCalendarSignals(api, VEND, AG, crewResult({ event_id: 'Verma', member: 'Nobody', action: 'assign' }));
    ok(typeof out.suffix === 'string' && /couldn't find anyone called Nobody/i.test(out.suffix), '§1.6 an unresolved member surfaces the honest echo on the WA reply');
  }

  // ════════════════════════════════════════════════════════════════════════
  // §2 — CURE 2: the punctuation-blind matcher, end-to-end through the REAL
  //      library resolveEvent AND the WA assign wire. 'Ananya recce' MUST find
  //      the true title 'Ananya - recce'. Uncured: the %raw% prefilter never
  //      fetches the hyphenated row and nameMatches would reject it anyway. RED.
  // ════════════════════════════════════════════════════════════════════════
  sec('§2 — punctuation-blind resolveEvent (the P1 pair, on the cured wire)');
  {
    const AID = uuid('f');
    const { api } = makeDb({
      vendor: { id: V },
      events: [{ id: AID, vendor_id: V, title: 'Ananya - recce', event_date: '2026-08-02', kind: 'recce' }],
    });
    const res = await cal.resolveEvent(api, VEND, 'Ananya recce');
    ok(res && res.ev && res.ev.id === AID, "§2.1 resolveEvent('Ananya recce') finds 'Ananya - recce' across the hyphen");
  }
  {
    // the founder LIVE WITNESS, in bench form: "Put Swati on the Ananya recce"
    const AID = uuid('f');
    const { api, db } = makeDb({
      vendor: { id: V },
      team: [{ id: SWATI, vendor_id: V, name: 'Swati' }],
      events: [{ id: AID, vendor_id: V, title: 'Ananya - recce', event_date: '2026-08-02', event_time: '11:00', kind: 'recce', assigned_member_ids: [] }],
    });
    const out = await cal.applyCalendarSignals(api, VEND, AG, crewResult({ event_id: 'Ananya recce', member: 'Swati', action: 'assign' }));
    const row = db.t.events.find(e => e.id === AID);
    ok(Array.isArray(row.assigned_member_ids) && row.assigned_member_ids.includes(SWATI), '§2.2 "Put Swati on the Ananya recce" WRITES Swati to the hyphenated booking');
    ok(typeof out.suffix === 'string' && /Swati's on the Ananya - recce/.test(out.suffix), '§2.3 the witness line names the TRUE title — "Swati\'s on the Ananya - recce"');
  }
  {
    // "Take Swati off the Ananya recce" → the off-line, on the hyphenated title
    const AID = uuid('f');
    const { api, db } = makeDb({
      vendor: { id: V },
      team: [{ id: SWATI, vendor_id: V, name: 'Swati' }],
      events: [{ id: AID, vendor_id: V, title: 'Ananya - recce', event_date: '2026-08-02', event_time: '11:00', kind: 'recce', assigned_member_ids: [SWATI] }],
    });
    const out = await cal.applyCalendarSignals(api, VEND, AG, crewResult({ event_id: 'Ananya recce', member: 'Swati', action: 'unassign' }));
    const row = db.t.events.find(e => e.id === AID);
    ok(Array.isArray(row.assigned_member_ids) && !row.assigned_member_ids.includes(SWATI), '§2.4 "Take Swati off the Ananya recce" REMOVES Swati from the hyphenated booking');
    ok(typeof out.suffix === 'string' && /Swati's off the Ananya - recce/.test(out.suffix), '§2.5 the off-witness names the TRUE title');
  }

  // ════════════════════════════════════════════════════════════════════════
  // §3 — the refinement layer directly, and the R-B6 negative HELD.
  //      The hyphen-unit is RED at origin; the riya/Priya negative is GREEN at
  //      origin AND cured (extend the discipline, never replace it).
  // ════════════════════════════════════════════════════════════════════════
  sec('§3 — nameMatches: punctuation-blind but token-disciplined');
  ok(nameMatches('Ananya - recce', 'Ananya recce') === true,  "§3.1 nameMatches('Ananya - recce','Ananya recce') === true (hyphen crossed, full prefix)");
  ok(nameMatches('Ananya - recce', 'recce') === true,         "§3.2 nameMatches('Ananya - recce','recce') === true (2nd token still resolves post-fold)");
  ok(nameMatches('Priya', 'riya') === false,                  "§3.3 nameMatches('Priya','riya') === false — R-B6 HELD");
  ok(nameMatches('Priya Mehta', 'riya') === false,            "§3.4 nameMatches('Priya Mehta','riya') === false — R-B6 HELD across tokens");
  ok(nameMatches('Riya Bose', 'riya') === true,               "§3.5 nameMatches('Riya Bose','riya') === true — the real Riya still resolves");
  {
    // end-to-end: 'riya' against a 'Priya …' booking must resolve to NONE, never Priya
    const PID = uuid('f');
    const { api } = makeDb({
      vendor: { id: V },
      events: [{ id: PID, vendor_id: V, title: 'Priya Loop Probe', event_date: '2026-08-05', kind: 'shoot' }],
    });
    const res = await cal.resolveEvent(api, VEND, 'riya');
    ok(res && res.none === true && !res.ev, "§3.6 resolveEvent('riya') does NOT resolve to 'Priya Loop Probe' (none)");
  }

  console.log(`\n════════  ${pass} passed, ${fail} failed  ════════\n`);
  if (fail) {
    console.log('RED — the uncured tree strands the WA crew-assign and cannot cross punctuation. Failing checks:');
    fails.forEach(f => console.log('   ·', f));
    process.exit(1);
  }
}

main().catch((e) => { console.error('BENCH ERROR', e); process.exit(2); });
