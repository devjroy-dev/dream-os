'use strict';
// scripts/tdw15_p3_daystogo_bench.js
// ─────────────────────────────────────────────────────────────────────────────
// TDW_15 · P3 · R-35.23 — THE DAYS-TO-GO CURE, dream-os side (F-15.17).
//
//   node scripts/tdw15_p3_daystogo_bench.js [TREE_ROOT]
//
// TREE_ROOT defaults to this file's own repo root, so the bench runs from any
// working directory. Pass an UNCURED tree root to see the reds — that is the
// both-ways proof, and every red is a mutation of PRODUCTION code (the absent
// `src/lib/istDay.js`, or `today.js`'s host-local basis), never of test setup.
//
// EVERY CLOCK IN THIS FILE IS A FIXTURE CLOCK. Not one cell reads the wall.
// `withClock` swaps `global.Date` for a fixed-instant stand-in around the call
// and restores it in a `finally`, so the run gives the same answer at 03:00 IST
// as it does at noon. A bench for a midnight bug that can only fail at midnight
// is not a bench.
//
// THE FIXTURE FIGURES ARE DERIVED, NOT DRAFTED. Wedding 2027-02-14:
//     from 2026-08-20 → 178 days      from 2026-08-21 → 177 days
// and 2026-08-20T20:00:00Z is 2026-08-21T01:30 IST — inside the 5.5-hour
// window where the UTC basis and the IST basis disagree by exactly one day.
// That instant is the whole finding, so it is the instant the cure is measured
// at, and §3.2 asserts the DISAGREEMENT as well as the value so the cell cannot
// pass by coincidence against a hard-coded constant.
//
// WHAT THIS BENCH DOES NOT ASSERT: `today.js`'s `todayStr` still rides a
// server-UTC day key and the events queries still ride it. That is an adjacent,
// UNRULED fault reported in the handover. No cell pins it — a cell that pinned
// today's defect would be a tripwire against tomorrow's cure (F-15.12).
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
const fs   = require('fs');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));

let pass = 0, fail = 0;
const fails = [];

function cell(name, fn) {
  let ok = false, why = '';
  try { const r = fn(); ok = (r === true); if (!ok) why = String(r); }
  catch (e) { ok = false; why = e && e.message ? e.message : String(e); }
  if (ok) { pass++; console.log('  PASS  ' + name); }
  else { fail++; fails.push(name + '  —  ' + why); console.log('  FAIL  ' + name + '  —  ' + why); }
}

async function acell(name, fn) {
  let ok = false, why = '';
  try { const r = await fn(); ok = (r === true); if (!ok) why = String(r); }
  catch (e) { ok = false; why = e && e.message ? e.message : String(e); }
  if (ok) { pass++; console.log('  PASS  ' + name); }
  else { fail++; fails.push(name + '  —  ' + why); console.log('  FAIL  ' + name + '  —  ' + why); }
}

const P    = (rel) => path.join(ROOT, rel);
const has  = (rel) => fs.existsSync(P(rel));
const read = (rel) => fs.readFileSync(P(rel), 'utf8');

function fresh(rel) {
  const p = P(rel);
  delete require.cache[require.resolve(p)];
  return require(p);
}

// ── THE FIXTURE CLOCK ────────────────────────────────────────────────────────
// A no-arg `new Date()` and `Date.now()` return the fixed instant; every other
// form delegates to the real constructor, so date-string parsing (the whole
// subject of this bench) is untouched by the fake.
async function withClock(iso, fn) {
  const Real  = Date;
  const fixed = new Real(iso).getTime();
  function FakeDate(...args) {
    if (args.length === 0) return new Real(fixed);
    return new Real(...args);
  }
  FakeDate.prototype = Real.prototype;
  FakeDate.now   = () => fixed;
  FakeDate.parse = Real.parse;
  FakeDate.UTC   = Real.UTC;
  global.Date = FakeDate;
  try { return await fn(); } finally { global.Date = Real; }
}

// ── the mock supabase: only the shapes this door actually calls ──────────────
function makeSupabase(tables) {
  function builder(table) {
    const eqs = [], gts = [], ltes = [];
    const rows = () => (tables[table] || []).filter((r) =>
      eqs.every(([c, v]) => r[c] === v) &&
      gts.every(([c, v]) => r[c] > v) &&
      ltes.every(([c, v]) => r[c] <= v));
    const api = {
      select() { return api; },
      eq(c, v)  { eqs.push([c, v]);  return api; },
      gt(c, v)  { gts.push([c, v]);  return api; },
      lte(c, v) { ltes.push([c, v]); return api; },
      order()   { return api; },
      limit()   { return api; },
      maybeSingle() { return Promise.resolve({ data: rows()[0] || null, error: null }); },
      then(res) { return Promise.resolve({ data: rows(), error: null }).then(res); },
    };
    return api;
  }
  return { from: (t) => builder(t) };
}

function terminalHandler(routerModule) {
  const layer = routerModule.stack.find((l) => l.route);
  if (!layer) throw new Error('no route layer on this router');
  const stack = layer.route.stack;
  return stack[stack.length - 1].handle;
}

// `asyncHandler` returns BEFORE its inner promise settles (it is a
// fire-and-catch wrapper, `src/lib/asyncHandler.js`), so awaiting the handler
// itself proves nothing. The mock resolves when the door actually answers, and
// `next` rejects, so a thrown route error surfaces as a red instead of a hang.
function mockRes() {
  const out = { statusCode: 200, body: null };
  let settle, reject;
  const done = new Promise((s, r) => { settle = s; reject = r; });
  const res = {
    status(c) { out.statusCode = c; return res; },
    json(b)   { out.body = b; settle(out); return res; },
  };
  return { res, out, done, next: (e) => reject(e instanceof Error ? e : new Error(String(e))) };
}

const WEDDING = '2027-02-14';

// The two derivations, spelled out here so the cells can compare them rather
// than compare a cured value against a literal. UTC_BASIS is the shape that
// STOOD in `today.js` and is reproduced ONLY as the thing being disagreed with.
function utcBasisDays(weddingDate, nowMs) {
  const w = new Date(weddingDate).getTime();
  const t = new Date(nowMs); t.setHours(0, 0, 0, 0);
  const d = Math.ceil((w - t.getTime()) / 86400000);
  return d > 0 ? d : 0;
}

async function runToday(nowIso, coupleRow) {
  return withClock(nowIso, async () => {
    const mod = fresh('src/api/couple/today.js');
    const handler = terminalHandler(mod);
    const supabase = makeSupabase({
      couples:         coupleRow ? [{ id: 'c1', ...coupleRow }] : [],
      events:          [],
      couple_bookings: [],
    });
    const { res, out, done, next } = mockRes();
    handler({
      app: { locals: { supabase } },
      params: { coupleId: 'c1' },
      coupleUser: { couple_id: 'c1' },
    }, res, next);
    await Promise.race([
      done,
      new Promise((_, r) => setTimeout(() => r(new Error('door never answered')), 5000)),
    ]);
    return out;
  });
}

(async function main() {
  console.log('');
  console.log('TDW_15 P3 · DAYS-TO-GO BENCH (F-15.17 / R-35.23) — tree: ' + ROOT);
  console.log('');

  // ═══ §1 — THE ONE HOME ════════════════════════════════════════════════════
  console.log('§1  the one day-boundary home');

  cell('§1.1 src/lib/istDay.js exists and exports istTodayStr + daysUntilIst', () => {
    if (!has('src/lib/istDay.js')) return 'src/lib/istDay.js absent';
    const m = fresh('src/lib/istDay.js');
    if (typeof m.istTodayStr !== 'function')  return 'istTodayStr not exported';
    if (typeof m.daysUntilIst !== 'function') return 'daysUntilIst not exported';
    return true;
  });

  cell('§1.2 brideNudge.js was MIRRORED, not folded — it keeps its own offset and takes no dependency', () => {
    const src = read('src/agent/brideNudge.js');
    if (!/IST_OFFSET_MS/.test(src)) return 'the reference lost its own IST block';
    if (/require\(['"][^'"]*istDay['"]\)/.test(src)) return 'the reference now depends on the mirror — READ-ONLY breached';
    return true;
  });

  cell('§1.3 [DOCUMENTARY, not mechanism] the mirror cites its reference by path AND symbol', () => {
    const src = read('src/lib/istDay.js');
    if (!/src\/agent\/brideNudge\.js/.test(src)) return 'reference path not cited';
    if (!/buildNudge/.test(src))                return 'reference symbol not cited';
    return true;
  });

  // ═══ §2 — THE IST DAY KEY ═════════════════════════════════════════════════
  console.log('');
  console.log('§2  the IST day key turns at IST midnight, not at UTC midnight');

  cell('§2.1 18:29:59Z on the 20th is still IST 2026-08-20', () => {
    const { istTodayStr } = fresh('src/lib/istDay.js');
    const k = istTodayStr(new Date('2026-08-20T18:29:59Z'));
    return k === '2026-08-20' || `got ${k}`;
  });

  cell('§2.2 18:30:00Z on the 20th has become IST 2026-08-21', () => {
    const { istTodayStr } = fresh('src/lib/istDay.js');
    const k = istTodayStr(new Date('2026-08-20T18:30:00Z'));
    return k === '2026-08-21' || `got ${k}`;
  });

  // ═══ §3 — THE ARITHMETIC ══════════════════════════════════════════════════
  console.log('');
  console.log('§3  daysUntilIst — the ruled semantic');

  cell('§3.1 the number decrements by EXACTLY ONE across the IST midnight instant', () => {
    const { daysUntilIst } = fresh('src/lib/istDay.js');
    const before = daysUntilIst(WEDDING, new Date('2026-08-20T18:29:59Z'));
    const after  = daysUntilIst(WEDDING, new Date('2026-08-20T18:30:00Z'));
    if (before - after !== 1) return `before ${before}, after ${after} — delta ${before - after}`;
    return true;
  });

  cell('§3.2 THE CURE — inside the 5.5h window the answer is IST (177) and DISAGREES with the UTC basis (178)', () => {
    const { daysUntilIst } = fresh('src/lib/istDay.js');
    const at   = new Date('2026-08-20T20:00:00Z');   // 01:30 IST on the 21st
    const ist  = daysUntilIst(WEDDING, at);
    const utc  = utcBasisDays(WEDDING, at.getTime());
    if (ist !== 177) return `IST basis gave ${ist}, expected 177`;
    if (utc !== 178) return `the disagreement vanished — UTC basis gave ${utc}, expected 178; this cell is no longer measuring the mechanism`;
    return true;
  });

  cell('§3.3 NO REGRESSION — outside the window the two bases agree (178) and the number does not move', () => {
    const { daysUntilIst } = fresh('src/lib/istDay.js');
    const at  = new Date('2026-08-20T06:00:00Z');    // 11:30 IST on the 20th
    const ist = daysUntilIst(WEDDING, at);
    const utc = utcBasisDays(WEDDING, at.getTime());
    if (ist !== 178) return `IST basis gave ${ist}, expected 178`;
    if (ist !== utc) return `bases disagree outside the window: ${ist} vs ${utc}`;
    return true;
  });

  cell('§3.4 a wedding already past CLAMPS to 0 (the ruled divergence from the reference)', () => {
    const { daysUntilIst } = fresh('src/lib/istDay.js');
    const v = daysUntilIst('2020-01-01', new Date('2026-08-20T20:00:00Z'));
    return v === 0 || `got ${JSON.stringify(v)}`;
  });

  cell('§3.5 TWO EMPTINESSES — an ABSENT date is null, and null is not 0', () => {
    const { daysUntilIst } = fresh('src/lib/istDay.js');
    const absent = daysUntilIst(null, new Date('2026-08-20T20:00:00Z'));
    const past   = daysUntilIst('2020-01-01', new Date('2026-08-20T20:00:00Z'));
    if (absent !== null) return `absent gave ${JSON.stringify(absent)}, expected null`;
    if (past === absent) return 'past and absent collapsed to one answer';
    return true;
  });

  // ═══ §4 — THE DOOR ════════════════════════════════════════════════════════
  console.log('');
  console.log('§4  GET /couple/today — the real handler, on fixture clocks');

  await acell('§4.1 THE RED SITE — at 01:30 IST the door returns 177, not 178', async () => {
    const out = await runToday('2026-08-20T20:00:00Z', { wedding_date: WEDDING, budget_total: null });
    if (!out.body) return `handler returned no body (status ${out.statusCode})`;
    const d = out.body.today && out.body.today.days_until_wedding;
    return d === 177 || `door returned ${JSON.stringify(d)}, expected 177`;
  });

  await acell('§4.2 NO REGRESSION — at 11:30 IST the door returns 178, exactly as it always did', async () => {
    const out = await runToday('2026-08-20T06:00:00Z', { wedding_date: WEDDING, budget_total: null });
    if (!out.body) return `handler returned no body (status ${out.statusCode})`;
    const d = out.body.today && out.body.today.days_until_wedding;
    return d === 178 || `door returned ${JSON.stringify(d)}, expected 178`;
  });

  await acell('§4.3 a couple with no wedding_date still gets null, not 0', async () => {
    const out = await runToday('2026-08-20T20:00:00Z', { wedding_date: null, budget_total: null });
    if (!out.body) return `handler returned no body (status ${out.statusCode})`;
    const d = out.body.today && out.body.today.days_until_wedding;
    return d === null || `door returned ${JSON.stringify(d)}, expected null`;
  });

  console.log('');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  PASS ${pass}   FAIL ${fail}`);
  if (fails.length) { console.log(''); for (const f of fails) console.log('  ✗ ' + f); }
  console.log('');
  process.exit(fail ? 1 : 0);
})();
