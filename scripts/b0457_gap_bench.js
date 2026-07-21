#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b0457_gap_bench.js — TDW_04.5 P1.3, the STAFFING-GAP snapshot line.
//
//   node scripts/b0457_gap_bench.js
//
// WHAT IT DRIVES: the REAL fetchCalendarSnapshot (chat.js's exported test seam,
// R-B6-1's precedent) and — through it — the REAL normaliseCategory and the REAL
// OCCUPYING_KINDS, against an in-memory events/vendors store. Doubles: transport
// (express), engine dist, ledger, node_modules neighbours. Nothing under test is stubbed.
//
// Sibling of b6_referent_bench (36/36) and checker_bench (101/101) — untouched; their
// counts stay sealed. This bench proves ONLY the gap line the referent bench does not
// exercise (its mkReq carries no category, so the planner gate never fires there).
//
// BOTH-WAYS: the cured tree is GREEN. Comment out the planner gate (the
// `if (normaliseCategory(req.vendor.category) === 'planning')`) OR widen the window,
// and sections 1/2/4/8 flip. The delivery script does the mutation and reverts it.
//
// WHAT IT DOES NOT PROVE, NAMED: that Victor SPEAKS the line in his voice — that's the
// founder smoke's (voice-assign card). This proves the line renders, gated and honest.
// ══════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');

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

const CHAT = path.join(ROOT, 'src/api/vendor-engine/chat.js');
const { fetchCalendarSnapshot } = require(CHAT);

let SEQ = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++SEQ).padStart(12, '0')}`;
const V = '11111111-1111-1111-1111-111111111111';

class Q {
  constructor(db, table) { this.db = db; this.table = table; this.f = []; this.n = null; }
  select() { return this; }
  eq(c, v)  { this.f.push(r => r[c] === v); return this; }
  neq(c, v) { this.f.push(r => r[c] !== v); return this; }
  is(c, v)  { this.f.push(r => (r[c] === undefined ? null : r[c]) === v); return this; }
  in(c, vs) { this.f.push(r => vs.includes(r[c])); return this; }
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
// mkReq carries CATEGORY (the referent bench's does not) — that is the whole gate.
const mkReq = (supabase, category) => ({ app: { locals: { supabase } }, vendor: { id: V, category } });

let pass = 0, fail = 0;
const ok  = (c, m) => { c ? (pass++, console.log('  PASS  ' + m)) : (fail++, console.log('  FAIL  ' + m)); };
const sec = (t) => console.log('\n── ' + t + ' ──');

const today = new Date().toISOString().slice(0, 10);
const plus  = (n) => { const d = new Date(`${today}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const ev = (o) => ({ id: uuid(), vendor_id: V, event_time: null, state: 'upcoming', deleted_at: null, assigned_member_ids: [], ...o });
const GAP_RE = /(\d+) functions? in the next 3 weeks (?:has|have) no one on (?:it|them) \(([^—]+) — (\d+) days?\)/;

(async () => {

// ─────────────────────────────────────────────────────────────────────────
sec('1. PLANNER + two unstaffed occupying ≤21d -> the gap line, counted, soonest named');
{
  const { supabase } = makeDb({
    vendors: [{ id: V, category: 'planner' }],
    events: [
      ev({ title: 'Kapoor mehendi', event_date: plus(9),  kind: 'ceremony' }),   // gap, soonest
      ev({ title: 'Rao sangeet',    event_date: plus(14), kind: 'ceremony' }),   // gap
      ev({ title: 'Iyer wedding',   event_date: plus(6),  kind: 'ceremony', assigned_member_ids: [uuid()] }), // STAFFED
    ],
  });
  const snap = await fetchCalendarSnapshot(mkReq(supabase, 'planner'));
  const m = snap.match(GAP_RE);
  ok(!!m, 'the gap line renders for a planner');
  ok(m && m[1] === '2', 'counts exactly the two UNSTAFFED functions (staffed one excluded)');
  ok(m && m[2].trim() === 'Kapoor mehendi', 'names the SOONEST unstaffed function');
  ok(m && m[3] === '9', 'days-out is correct (9)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('2. NON-PLANNER (photographer) -> silent. The gate holds.');
{
  const { supabase } = makeDb({
    vendors: [{ id: V, category: 'photographer' }],
    events: [ ev({ title: 'Kapoor mehendi', event_date: plus(9), kind: 'ceremony' }) ],
  });
  const snap = await fetchCalendarSnapshot(mkReq(supabase, 'photographer'));
  ok(!GAP_RE.test(snap), 'no gap line for a non-planner craft');
}

// ─────────────────────────────────────────────────────────────────────────
sec('3. ALL STAFFED -> no gap line (a staffed function is not a gap)');
{
  const { supabase } = makeDb({
    vendors: [{ id: V, category: 'planner' }],
    events: [ ev({ title: 'Kapoor mehendi', event_date: plus(9), kind: 'ceremony', assigned_member_ids: [uuid()] }) ],
  });
  const snap = await fetchCalendarSnapshot(mkReq(supabase, 'planner'));
  ok(!GAP_RE.test(snap), 'no gap line when every function has crew');
}

// ─────────────────────────────────────────────────────────────────────────
sec('4. WINDOW + OCCUPYING + COVENANT — only live, unstaffed, occupying, ≤21d count');
{
  const { supabase } = makeDb({
    vendors: [{ id: V, category: 'planner' }],
    events: [
      ev({ title: 'Far wedding',   event_date: plus(30), kind: 'ceremony' }),                 // > 21d — out of window
      ev({ title: 'Just a call',   event_date: plus(5),  kind: 'meeting' }),                  // not occupying
      ev({ title: 'Cancelled fn',  event_date: plus(7),  kind: 'ceremony', state: 'cancelled' }), // cancelled
      ev({ title: 'Deleted fn',    event_date: plus(8),  kind: 'ceremony', deleted_at: '2026-07-01T00:00:00Z' }), // deleted
    ],
  });
  const snap = await fetchCalendarSnapshot(mkReq(supabase, 'planner'));
  ok(!GAP_RE.test(snap), 'none of >21d / non-occupying / cancelled / deleted counts -> no line');
}

// ─────────────────────────────────────────────────────────────────────────
sec('5. HONESTY — a failed events read renders NO line, never "0 functions"');
{
  const { supabase } = makeDb({
    vendors: [{ id: V, category: 'planner' }],
    events: [ ev({ title: 'Kapoor mehendi', event_date: plus(9), kind: 'ceremony' }) ],
  }, ['events']);   // force the events read to error
  const snap = await fetchCalendarSnapshot(mkReq(supabase, 'planner'));
  ok(!GAP_RE.test(snap), 'errored read -> no gap line');
  ok(!/0 functions/.test(snap), 'never asserts "0 functions" (absence is only evidence if you looked)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('6. SINGULAR grammar — one gap reads "1 function ... has no one on it"');
{
  const { supabase } = makeDb({
    vendors: [{ id: V, category: 'planner' }],
    events: [ ev({ title: 'Kapoor mehendi', event_date: plus(1), kind: 'ceremony' }) ],
  });
  const snap = await fetchCalendarSnapshot(mkReq(supabase, 'planner'));
  ok(/1 function in the next 3 weeks has no one on it \(Kapoor mehendi — 1 day\)/.test(snap), 'singular noun+verb+object+day all agree');
}

// ─────────────────────────────────────────────────────────────────────────
console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
