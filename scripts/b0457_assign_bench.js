// ══════════════════════════════════════════════════════════════════════════
// b0457_assign_bench — TDW_04.5 P1 #4 — the crew ASSIGN/UNASSIGN door
// ══════════════════════════════════════════════════════════════════════════
//
// WHAT IT DRIVES: the REAL mutateEvents (the resolving door leg), the REAL
// resolveEvent, the REAL writeEvent + checkOccupancy + memberClashCheck + scrub
// behind it, and the REAL mutationLines / advisoryLines renderers — against an
// in-memory events / vendors / team_members / crew_confirmations. A bench that
// re-implemented the resolve→delta→write path or the render branches would prove
// its own copy and nothing else (checker_bench.js's crown-proof law, one door over).
//
// THE DOUBLE: reused VERBATIM from the SEALED b0457_crew_bench (its Q + makeDb + uuid).
// It speaks the PG array reads the crew reader needs; per the estate's per-bench
// self-contained convention (crew bench header: "The ONLY doubles are the ledger")
// it is copied, not shared — copying the PROVEN artifact is not "hand-rolling a new
// one," which was the ruled prohibition (kickoff). The ONLY behavioural double here
// too is the ledger (fire-and-forget by contract); mutateEvents never calls it.
//
// LOAD NOTE: chat.js constructs a Supabase client at module load (needs env). The door
// path never touches that client — it uses req.app.locals.supabase (this double) — so
// placeholder env only satisfies the lazy createClient (supabase-js makes no network
// call at construction). Set BEFORE the require.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-dummy-key';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test';
process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'test';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { mutateEvents, mutationLines, advisoryLines } = require(path.join(ROOT, 'src/api/vendor-engine/chat.js'));
const { writeEvent } = require(path.join(ROOT, 'src/lib/vendor/eventWrite'));
const { memberClashCheck } = require(path.join(ROOT, 'src/lib/vendor/occupancy'));

// ── the PROVEN double, reused verbatim from b0457_crew_bench (lines 44-95) ──
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

const V     = uuid('1');
const AG    = uuid('e');
const RAHUL = uuid('a');
const PRIYA = uuid('b');
const EVID  = uuid('d');

// the door reads req.app.locals.supabase / req.vendor.id; crew leg needs nothing else.
const fakeReq = (api) => ({ app: { locals: { supabase: api } }, vendor: { id: V }, agentId: AG });
// a crew hand nests in tool_calls[].donna_calls[] in production; drive it the same way.
const crewResult = (input) => ({ tool_calls: [ { name: 'dear_donna_talk', donna_calls: [ { name: 'donna_assign_crew', input } ] } ] });

(async () => {

// ─────────────────────────────────────────────────────────────────────────
sec('1. ASSIGN by voice — row matches the eventWrite path, witness VERBATIM');
{
  const { api, db } = makeDb({
    vendor: { id: V, category: 'photographer', slot_capacity: 9 },
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
    events: [{ id: EVID, vendor_id: V, title: 'Verma reception', event_date: '2026-07-24', event_time: '19:00', slot: 'evening', kind: 'shoot', assigned_member_ids: [] }],
  });
  const done = await mutateEvents(fakeReq(api), crewResult({ event_id: 'Verma', member: 'Rahul', action: 'assign' }));
  const row = db.t.events.find(e => e.id === EVID);
  ok(done.length === 1 && done[0].ok === true && done[0].action === 'assign', 'one ok:true assign outcome');
  ok(Array.isArray(row.assigned_member_ids) && row.assigned_member_ids.includes(RAHUL), 'RAHUL written to the row (the column eventWrite writes)');

  // PARITY: a direct writeEvent with the same SET produces the same assigned_member_ids
  const { api: api2, db: db2 } = makeDb({
    vendor: { id: V, category: 'photographer', slot_capacity: 9 },
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
    events: [{ id: EVID, vendor_id: V, title: 'Verma reception', event_date: '2026-07-24', event_time: '19:00', slot: 'evening', kind: 'shoot', assigned_member_ids: [] }],
  });
  await writeEvent(api2, { vendorId: V, surface: 'pwa', source: 'crud', event_id: EVID, assigned_member_ids: [RAHUL] });
  const row2 = db2.t.events.find(e => e.id === EVID);
  ok(JSON.stringify(row.assigned_member_ids) === JSON.stringify(row2.assigned_member_ids), 'door row === direct eventWrite row (SET parity)');

  const line = mutationLines(done);
  ok(line === "Rahul's on the Verma reception — 2026-07-24 at 19:00.", 'witness VERBATIM  ·  got: ' + JSON.stringify(line));
  ok(/Rahul assigned — \d+ \w{3}/.test(row.notes || ''), 'note-trail "Rahul assigned — DD Mon" (FREE from the sealed core)');
  ok((db.t.crew_confirmations || []).some(r => r.event_id === EVID && r.member_id === RAHUL), 'crew_confirmations upserted (FREE from the sealed core)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('2. UNASSIGN — member removed, off-line VERBATIM');
{
  const { api, db } = makeDb({
    vendor: { id: V, category: 'photographer', slot_capacity: 9 },
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
    events: [{ id: EVID, vendor_id: V, title: 'Verma reception', event_date: '2026-07-24', event_time: '19:00', slot: 'evening', kind: 'shoot', assigned_member_ids: [RAHUL] }],
  });
  const done = await mutateEvents(fakeReq(api), crewResult({ event_id: 'Verma', member: 'Rahul', action: 'unassign' }));
  const row = db.t.events.find(e => e.id === EVID);
  ok(done[0] && done[0].ok === true && done[0].action === 'unassign', 'ok:true unassign outcome');
  ok(!row.assigned_member_ids.includes(RAHUL), 'RAHUL removed from the row');
  ok(mutationLines(done) === "Rahul's off the Verma reception.", 'off-line VERBATIM  ·  got: ' + JSON.stringify(mutationLines(done)));
}

// ─────────────────────────────────────────────────────────────────────────
sec('3. idempotent-add · remove-guard · member-unresolved — each names itself, no write');
{
  // idempotent add
  const { api: a1, db: d1 } = makeDb({
    vendor: { id: V, category: 'photographer', slot_capacity: 9 },
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
    events: [{ id: EVID, vendor_id: V, title: 'Verma reception', event_date: '2026-07-24', event_time: '19:00', slot: 'evening', kind: 'shoot', assigned_member_ids: [RAHUL] }],
  });
  const notesBefore = (d1.t.events.find(e => e.id === EVID).notes) || null;
  const done1 = await mutateEvents(fakeReq(a1), crewResult({ event_id: 'Verma', member: 'Rahul', action: 'assign' }));
  ok(done1[0].ok === false && done1[0].reason === 'idempotent', 'idempotent-add is ok:false, reason=idempotent');
  ok(mutationLines(done1) === "Rahul's already on the Verma reception.", 'idempotent line VERBATIM  ·  got: ' + JSON.stringify(mutationLines(done1)));
  ok(((d1.t.events.find(e => e.id === EVID).notes) || null) === notesBefore, 'no write fired (notes unchanged)');

  // remove-guard
  const { api: a2 } = makeDb({
    vendor: { id: V, category: 'photographer', slot_capacity: 9 },
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
    events: [{ id: EVID, vendor_id: V, title: 'Verma reception', event_date: '2026-07-24', event_time: '19:00', slot: 'evening', kind: 'shoot', assigned_member_ids: [] }],
  });
  const done2 = await mutateEvents(fakeReq(a2), crewResult({ event_id: 'Verma', member: 'Rahul', action: 'unassign' }));
  ok(done2[0].ok === false && done2[0].reason === 'guard', 'remove-guard is ok:false, reason=guard');
  ok(mutationLines(done2) === "Rahul isn't on the Verma reception.", 'remove-guard line VERBATIM  ·  got: ' + JSON.stringify(mutationLines(done2)));

  // member-unresolved (no Rahul on the team)
  const { api: a3, db: d3 } = makeDb({
    vendor: { id: V, category: 'photographer', slot_capacity: 9 },
    team: [{ id: PRIYA, vendor_id: V, name: 'Priya' }],
    events: [{ id: EVID, vendor_id: V, title: 'Verma reception', event_date: '2026-07-24', event_time: '19:00', slot: 'evening', kind: 'shoot', assigned_member_ids: [] }],
  });
  const done3 = await mutateEvents(fakeReq(a3), crewResult({ event_id: 'Verma', member: 'Rahul', action: 'assign' }));
  ok(done3[0].ok === false && done3[0].reason === 'member_unresolved', 'member-unresolved is ok:false, reason=member_unresolved');
  ok(mutationLines(done3) === "I couldn't find anyone called Rahul on your team.", 'member-unresolved line VERBATIM  ·  got: ' + JSON.stringify(mutationLines(done3)));
  ok((d3.t.events.find(e => e.id === EVID).assigned_member_ids || []).length === 0, 'no write fired (row crew still empty)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('4. member AMBIGUITY → clarify-once (two Rahuls)');
{
  const RAHUL_M = uuid('a'), RAHUL_S = uuid('a');
  const { api, db } = makeDb({
    vendor: { id: V, category: 'photographer', slot_capacity: 9 },
    team: [{ id: RAHUL_M, vendor_id: V, name: 'Rahul Mehra' }, { id: RAHUL_S, vendor_id: V, name: 'Rahul Singh' }],
    events: [{ id: EVID, vendor_id: V, title: 'Verma reception', event_date: '2026-07-24', event_time: '19:00', slot: 'evening', kind: 'shoot', assigned_member_ids: [] }],
  });
  const done = await mutateEvents(fakeReq(api), crewResult({ event_id: 'Verma', member: 'Rahul', action: 'assign' }));
  ok(done[0].ok === false && done[0].reason === 'member_ambiguous', 'ambiguity is ok:false, reason=member_ambiguous');
  ok(mutationLines(done) === "I have two Rahuls — Rahul Mehra or Rahul Singh?", 'clarify-once VERBATIM  ·  got: ' + JSON.stringify(mutationLines(done)));
  ok((db.t.events.find(e => e.id === EVID).assigned_member_ids || []).length === 0, 'no write fired on ambiguity');
}

// ─────────────────────────────────────────────────────────────────────────
sec('5. witness VERBATIM — date-only event (time-optional slot mirrors the sibling exactly)');
{
  const { api } = makeDb({
    vendor: { id: V, category: 'photographer', slot_capacity: 9 },
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
    events: [{ id: EVID, vendor_id: V, title: 'Verma reception', event_date: '2026-07-24', event_time: null, slot: 'full_day', kind: 'shoot', assigned_member_ids: [] }],
  });
  const done = await mutateEvents(fakeReq(api), crewResult({ event_id: 'Verma', member: 'Rahul', action: 'assign' }));
  ok(done[0].ok === true, 'date-only assign lands');
  ok(mutationLines(done) === "Rahul's on the Verma reception — 2026-07-24.", 'date-only witness VERBATIM  ·  got: ' + JSON.stringify(mutationLines(done)));
}

// ─────────────────────────────────────────────────────────────────────────
sec('6. RENDERING — clash BESIDE success (constructed done[], REAL member_clash payload)');
{
  // A real payload from the real checker (spatial ctx so it fires): RAHUL already on an
  // evening booking that day. The RENDERING test proves the advised filter carries it to
  // advisoryLines BESIDE the witness — independent of F-04.88's end-to-end suppression.
  const OTHER = uuid();
  const { api } = makeDb({
    vendor: { id: V, category: 'photographer', slot_capacity: 9 },
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
    events: [{ id: OTHER, vendor_id: V, title: 'Sharma sangeet', event_date: '2026-07-24', event_time: '18:00', slot: 'evening', kind: 'shoot', assigned_member_ids: [RAHUL] }],
  });
  const clash = await memberClashCheck(api, V, { event_date: '2026-07-24', slot: 'evening', kind: 'shoot' }, EVID, [{ id: RAHUL, name: 'Rahul' }]);
  ok(clash && clash.kind === 'member_clash' && typeof clash.message === 'string', 'real member_clash payload produced by the checker');

  const done = [{ action: 'assign', ok: true, member: { id: RAHUL, name: 'Rahul' },
    event: { title: 'Verma reception', event_date: '2026-07-24', event_time: '19:00' }, conflict: clash }];
  const line = mutationLines(done);
  const advised = done.filter((m) => m.ok && m.conflict && m.conflict.message);
  const adv = advisoryLines(advised);
  ok(line === "Rahul's on the Verma reception — 2026-07-24 at 19:00.", 'the witness still renders on the ok:true item');
  ok(advised.length === 1, 'the advised filter carries the clash (ok:true + conflict.message)');
  ok(adv === clash.message, 'advisoryLines renders the clash BESIDE, verbatim  ·  got: ' + JSON.stringify(adv));
}

// ─────────────────────────────────────────────────────────────────────────
sec('7. LIVE (F-04.88 CURED) — end-to-end crew-only assign onto a clashing member: the advisory SURFACES');
{
  // ═══ AMENDED 04.5 P6 (CE-61) — RULING №1's CLASS, SIXTH INSTANCE. ═══════════════
  // ATTRIBUTION: F-04.88's core cure landed this sitting (occupancy.js touchesSpatial
  // learns members are spatial). This section was authored at CE-50 as a DORMANT case
  // asserting conflict==null, with its own header ordering the next hand to UPDATE it
  // rather than weaken it when the cure shipped. That day is this one, so the four
  // assertions below are INVERTED to the cured contract. The assertions moved; the
  // fixture, the section's shape, and the count (4) did not. Nothing was weakened —
  // each assertion is STRICTLY STRONGER than the null it replaced.
  //
  // This is the bench following the law, never the law following the bench: the case
  // was a tripwire by design and it fired exactly as its author intended. Its RED was
  // the pair's own acceptance oracle.
  // ════════════════════════════════════════════════════════════════════════════════
  //
  // RAHUL already on an EVENING shoot that day; assigning him (crew-only, no spatial patch)
  // to ANOTHER evening booking the same day IS a clash for RAHUL — a person cannot be in two
  // places at once — and the door now hears it. The write still LANDS: member_clash is
  // ADVISORY by Ruling №2 (one artist across two adjacent functions is a legitimate choice;
  // the machine warns, the vendor decides), so the advisory rides out BESIDE the success.
  const OTHER = uuid();
  const { api, db } = makeDb({
    vendor: { id: V, category: 'photographer', slot_capacity: 9 },
    team: [{ id: RAHUL, vendor_id: V, name: 'Rahul' }],
    events: [
      { id: OTHER, vendor_id: V, title: 'Sharma sangeet', event_date: '2026-08-01', event_time: '18:00', slot: 'evening', kind: 'shoot', assigned_member_ids: [RAHUL] },
      { id: EVID,  vendor_id: V, title: 'Verma reception', event_date: '2026-08-01', event_time: '19:00', slot: 'evening', kind: 'shoot', assigned_member_ids: [] },
    ],
  });
  const done = await mutateEvents(fakeReq(api), crewResult({ event_id: 'Verma', member: 'Rahul', action: 'assign' }));
  ok(done[0].ok === true, 'the crew-only write LANDS (advisory never refuses — Ruling №2)');
  ok(done[0].conflict && done[0].conflict.kind === 'member_clash',
     'F-04.88 CURED: a crew-only write now reaches the member_clash block (was null at :551)');
  ok((db.t.events.find(e => e.id === EVID).assigned_member_ids || []).includes(RAHUL), 'RAHUL is now on the Verma reception');
  ok(done.filter(m => m.ok && m.conflict && m.conflict.message).length === 1,
     'the advised line surfaces end-to-end (the advisory rides BESIDE the success)');
}

// ─────────────────────────────────────────────────────────────────────────
console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
