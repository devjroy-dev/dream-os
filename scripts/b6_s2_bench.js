#!/usr/bin/env node
// scripts/b6_s2_bench.js — TDW_04 B6, surfaces sitting S2 (the migration sitting).
// Runnable from any working directory (Q-SP-5's law):  node scripts/b6_s2_bench.js
//
// WHAT THIS BENCH IS: §1–§3 drive the REAL writeEvent / checkOccupancy /
// blockDate against checker_bench's in-memory supabase (the mock is the only
// double; nothing under test is stubbed — its class is carried verbatim from
// scripts/checker_bench.js, the ratified pattern). §4–§6 are source assertions
// (the R-B6-12 precedent: prove the words and the shapes; the engine gates and
// node --check prove compile). Sealed benches are untouched siblings except
// b5_describe_bench's ONE whole-shape line, amended under the R-B6-15
// convention with the ruling named in its label (disclosed in the ZIP).
//
// Ruling trail: R-B6-17 (0078's semantics: one live block per (vendor_id,
// event_date, slot); full_day EXCLUSIVE both directions, refused at the write
// path naming the existing block) · R-B6-25 (the census batch: the wire filter
// + the generic-door guards, 404-shaped like LOCK 2) · R-B6-26 (the ruled DROP
// inside 0078) · R-B6-16/P5 (item 4: the day endpoint).

'use strict';

const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// ── the ledger double (fire-and-forget by contract) — checker_bench's own ──
const snapPath = path.join(ROOT, 'src/lib/vendor/snapshot.js');
require.cache[snapPath] = { id: snapPath, filename: snapPath, loaded: true,
  exports: { logActivity: async () => {}, fetchRecentActivity: async () => [], formatActivityBlock: () => '' } };

const { writeEvent }    = require(path.join(ROOT, 'src/lib/vendor/eventWrite.js'));
const { checkOccupancy } = require(path.join(ROOT, 'src/lib/vendor/occupancy.js'));
const { blockDate }     = require(path.join(ROOT, 'src/lib/vendor/availability.js'));

// ── the in-memory supabase, carried verbatim from checker_bench.js ─────────
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

let pass = 0, fail = 0;
const ok  = (c, m) => { c ? (pass++, console.log('  PASS  ' + m)) : (fail++, console.log('  FAIL  ' + m)); };
const sec = (t) => console.log('\n── ' + t + ' ──');
const block = (api, date, slot, title) =>
  writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', kind: 'blocked',
    title: title || 'Blocked', event_date: date, slot, state: 'upcoming' });

(async () => {

// ─────────────────────────────────────────────────────────────────────────
sec('§1 — R-B6-17 at the write path (the REAL writeEvent). full_day EXCLUSIVE both directions.');
{
  const { api, db } = makeDb();
  const m = await block(api, '2026-11-22', 'morning', 'Blocked');
  ok(m.ok, 'a morning block lands');
  const e = await block(api, '2026-11-22', 'evening', 'Blocked');
  ok(e.ok, 'an evening block COEXISTS on the same date (the feature 0078 exists for)');
  ok(db.t.events.filter(r => r.kind === 'blocked').length === 2, '   two live blocks, one date, different slots');

  const m2 = await block(api, '2026-11-22', 'morning');
  ok(!m2.ok && m2.code === 'ALREADY_BLOCKED' && m2.error === 'Already blocked.',
     'same-slot re-block -> the byte-identical B1 wire (Already blocked. / ALREADY_BLOCKED)');

  const fd = await block(api, '2026-11-22', 'full_day');
  ok(!fd.ok && fd.code === 'ALREADY_BLOCKED', 'full_day over slot blocks -> REFUSED (exclusive, direction 1)');
  // AMENDED under Q-S2-1 (F-04.77's sentence half, founder-approved "fine as
  // is") — R-B6-15's convention, the ruling in the label. Pre-rider shape was
  // `Blocked — the morning, Blocked — the evening` + `can't sit over it`.
  ok(fd.error && /the morning and the evening are held/.test(fd.error) && /full-day block can't sit over them; unblock them first/.test(fd.error),
     '   ...and the refusal NAMES the held slots (R-B6-17 + Q-S2-1: the tightened sentence, byte-exact for the default-title pair)');
  ok(db.t.events.filter(r => r.kind === 'blocked').length === 2, '   refused = wrote nothing');
}
{
  const { api, db } = makeDb();
  await block(api, '2026-11-22', 'full_day', 'Out of town');
  const s = await block(api, '2026-11-22', 'evening');
  ok(!s.ok && s.code === 'ALREADY_BLOCKED', 'slot over a full_day block -> REFUSED (exclusive, direction 2)');
  ok(s.error && /whole day is held \(Out of town\)/.test(s.error),
     '   ...naming the existing block by title');
  const re = await block(api, '2026-11-22', 'full_day');
  ok(!re.ok && re.error === 'Already blocked.', 'full_day over full_day -> the pre-0078 case, wire byte-identical');
  ok(db.t.events.filter(r => r.kind === 'blocked').length === 1, '   still one block');
}
{
  const { api } = makeDb();
  const bad = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', kind: 'blocked',
    title: 'Blocked', event_date: '2026-11-22', state: 'upcoming' });  // NO slot, NO time
  ok(!bad.ok && /must name its slot/.test(bad.error || ''),
     'a slotless block reads as a sentence (0078\'s CHECK mirrored), not a raw constraint error');
  const badSlot = await writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', kind: 'blocked',
    title: 'Blocked', event_date: '2026-11-22', slot: 'brunch', state: 'upcoming' });
  ok(!badSlot.ok && /Invalid slot/.test(badSlot.error || ''), 'a bad slot value reads as the mirrored-CHECK sentence');
}
{
  // fail-closed survives the widening: the guard read erroring is not the guard finding nothing.
  const { api } = makeDb({ fail: ['events'] });
  const r = await block(api, '2026-11-22', 'morning');
  ok(!r.ok && /Could not check existing blocks/.test(r.error || ''), 'guard-read error -> FAIL-CLOSED, nothing written (F15)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('§2 — the slot-aware checker (the REAL checkOccupancy). A block refuses the slots it HOLDS.');
{
  const seed = [{ id: uuid(), vendor_id: V, title: 'Blocked', event_date: '2026-11-22', slot: 'morning', kind: 'blocked' }];
  const { api } = makeDb({ events: seed });
  const morning = await checkOccupancy({ supabase: api, vendorId: V, kind: 'shoot', event_date: '2026-11-22', slot: 'morning' });
  ok(morning && morning.kind === 'date_blocked', 'booking the MORNING against a morning block -> date_blocked');
  ok(morning && /the morning of/.test(morning.message), '   partial-block sentence names the slot, never claims the day');
  const evening = await checkOccupancy({ supabase: api, vendorId: V, kind: 'shoot', event_date: '2026-11-22', slot: 'evening' });
  ok(evening === null, 'booking the EVENING against a morning block -> null. The evening still sells.');
  const fullDay = await checkOccupancy({ supabase: api, vendorId: V, kind: 'shoot', event_date: '2026-11-22', slot: 'full_day' });
  ok(fullDay && fullDay.kind === 'date_blocked', 'a full_day booking cannot dodge a morning block');
  const slotless = await checkOccupancy({ supabase: api, vendorId: V, kind: 'other', event_date: '2026-11-22' });
  ok(slotless && slotless.kind === 'date_blocked',
     'a SLOTLESS entry cannot dodge a stated refusal it might land inside (targets mirror capacityCheck :654)');
}
{
  const seed = [{ id: uuid(), vendor_id: V, title: 'Blocked', event_date: '2026-11-22', slot: 'full_day', kind: 'blocked' }];
  const { api } = makeDb({ events: seed });
  const r = await checkOccupancy({ supabase: api, vendorId: V, kind: 'shoot', event_date: '2026-11-22', slot: 'evening' });
  ok(r && r.kind === 'date_blocked' && /You've blocked 22 November 2026\./.test(r.message.replace(/\u00a0/g, ' ')) === false
     ? /You've blocked/.test(r.message) : /You've blocked/.test(r.message),
     'full_day block refuses everything — pre-0078 behaviour byte-preserved (the 101/101 green is the co-witness)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('§3 — blockDate (the REAL lib): the slot param, defaulted; the additive wire field.');
{
  const { api, db } = makeDb();
  const r = await blockDate(api, V, '2026-11-22', 'Out of town');            // NO slot arg — every existing caller
  ok(r.ok && r.block && r.block.slot === 'full_day', 'slotless blockDate call -> full_day (existing callers byte-identical)');
  ok(r.block.blocked_date === '2026-11-22' && r.block.reason === 'Out of town',
     '   frozen wire fields intact beside the additive slot');
  const s = await blockDate(api, V, '2026-11-23', null, 'evening');
  ok(s.ok && s.block.slot === 'evening', 'slot rides through to the wire');
  ok(db.t.events.find(x => x.event_date === '2026-11-23').slot === 'evening', '   ...and to the row');
  const bad = await blockDate(api, V, '2026-11-24', null, 'brunch');
  ok(!bad.ok && /slot must be one of/.test(bad.error), 'a bad slot at the availability door reads as a sentence');
}

// ─────────────────────────────────────────────────────────────────────────
sec('§4 — R-B6-25 at the doors (source assertions, the R-B6-12 precedent).');
{
  const ev = read('src/api/vendor/events.js');
  ok(/\.neq\('kind', 'blocked'\)[\s\S]*?\.is\('deleted_at', null\)[\s\S]*?countQuery/.test(ev) &&
     (ev.match(/\.neq\('kind', 'blocked'\)/g) || []).length >= 2,
     'the WIRE FILTER: GET excludes kind=blocked on BOTH the list and the count query (the tell stays honest)');
  ok(/const BLOCK_ROW_SENTENCE\s*=/.test(ev) && /function refuseBlockedRow\(res, row\)/.test(ev) &&
     /errRes\(res, 404, BLOCK_ROW_SENTENCE\)/.test(ev),
     'ONE rule, one home: refuseBlockedRow, 404-shaped like the unblock door\'s LOCK 2');
  ok((ev.match(/if \(refuseBlockedRow\(res, /g) || []).length === 2,
     'applied at exactly TWO call sites — cancel + the generic PATCH (state-update travels the PATCH; DELETE deliberately unguarded, named)');
  ok(/select\('id, title, state, kind'\)/.test(ev), 'the cancel read gained `kind` for the guard — zero extra trips');
  ok(/calendar block, not an engagement/.test(ev), 'the sentence names the block machinery (F-04.37\'s class: teach the door)');
  ok(/slot:\s+body\.slot,/.test(ev), 'the Move picker\'s slot rides the generic PATCH into writeEvent');
}

// ─────────────────────────────────────────────────────────────────────────
sec('§5 — 0078, the file (its DDL asserted at the source; the founder runs it).');
{
  const mig = read('db/migrations/0078_slot_blocks.sql');
  ok(/create unique index if not exists events_vendor_date_slot_blocked_unique_idx\s*\n?\s*on public\.events \(vendor_id, event_date, slot\)/.test(mig),
     'the widened unique guarantee: (vendor_id, event_date, slot), live blocks only');
  ok(/where kind = 'blocked' and deleted_at is null/.test(mig), '   ...with the load-bearing predicate (soft-deleted rows never poison)');
  const createIdx = mig.indexOf('create unique index if not exists events_vendor_date_slot_blocked_unique_idx');
  const dropOld   = mig.indexOf("drop index if exists public.events_vendor_date_blocked_unique_idx");
  ok(createIdx > -1 && dropOld > -1 && createIdx < dropOld,
     'the widened index is CREATED BEFORE the narrow one drops — no window with no guarantee');
  ok(/drop index if exists public\.events_vendor_date_blocked_idx;/.test(mig),
     'R-B6-26\'s ruled DROP rides inside 0078');
  ok(/TDW_04_B6_S1_READER_CENSUS\.md/.test(mig) && /create index events_vendor_date_blocked_idx on public\.events \(vendor_id, event_date\) where kind = 'blocked';/.test(mig),
     '   ...census §2 cited in the header, the one-line recreate stated as the revert path');
  ok(/events_blocked_slot_check/.test(mig) && /kind <> 'blocked' or slot is not null/.test(mig),
     'the null-slot hole is closed by CHECK — no block can ever escape the per-slot guarantee');
  ok(/n_dupe/.test(mig) && /n_null/.test(mig) && /raise exception/.test(mig),
     'pre-flight asserts run AT RUN TIME and abort having changed nothing (0075/0077\'s method)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('§6 — the day endpoint (item 4\'s backend, source assertions) + the mount.');
{
  const day  = read('src/api/vendor/day.js');
  const core = read('src/api/vendor/core.js');
  ok(/router\.get\('\/:vendorId\/:date'/.test(day), 'GET /day/:vendorId/:date exists');
  ok(/router\.use\('\/day',\s+require\('\.\/day'\)\)/.test(core), '   ...and is mounted (core.js)');
  ok(/DATE_RE\.test\(date\)/.test(day), 'the date is validated before any read');
  ok(/\.is\('deleted_at', null\)\s*\n?\s*\.neq\('state', 'cancelled'\)/.test(day),
     'the spine read carries BOTH covenants (deleted_at + cancelled)');
  ok(/kind !== 'blocked'/.test(day) && /kind === 'blocked'/.test(day),
     'blocks and engagements split from ONE read — the day sheet renders both truths (Q-S-4)');
  ok(/return res\.status\(500\)\.json\(\{ ok: false, error: 'Lookup failed\.' \}\)/.test(day),
     'the SPINE fails hard — a broken calendar read is never a silently empty day');
  ok((day.match(/console\.warn\('\[GET \/vendor\/day\]/g) || []).length === 3,
     'the three decoration legs (hot, milestones, engine) fail SOFT with a warn each');
  ok(/resolveAgentForVendor\(supabase, vendor, uid\)/.test(day),
     'the engine hop resolves in-handler, never blocking (the events.js PATCH precedent)');
  ok(/\.eq\('followup_on', date\)/.test(day) && !/interval|addDays|expandRepeat/.test(day),
     'C7\'s projection is EXACT-date; free-text repeat_every is rendered, never expanded (declared gap, stated)');
  ok(/'pending'/.test(day) && /due_date', date/.test(day.replace(/\.eq\('/g, "'")) || /\.eq\('due_date', date\)/.test(day),
     'milestones: pending rows due THIS date (C8), mark-paid stays the existing door');
}

// ─────────────────────────────────────────────────────────────────────────
console.log('');
if (fail === 0) console.log('   ══ ' + pass + '/' + pass + ' PASS ══');
else { console.log('   ══ ' + pass + '/' + (pass + fail) + ' — ' + fail + ' FAILED ══'); process.exit(1); }
})();
