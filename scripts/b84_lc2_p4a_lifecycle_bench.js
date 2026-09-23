#!/usr/bin/env node
'use strict';
// scripts/b84_lc2_p4a_lifecycle_bench.js — TDW CE-44 · LC-2 · packet 4a (dream-os).
// The booked-client fact, its carrier, V12 in the arms, the two lifecycle signals and the
// one helper that acts on them, and F-43.82. Rung b84, chair-allocated. Runnable from any
// directory. Exit 0 green, 1 red, 2 bench error.
//
//   §1  bookedFacts.js: the set, the block in every state, the bound, the fail-safe null.
//   §2  bookedLeads.js: the additive widening — names beside ids, the predicate untouched,
//       and the three packet 3 callers' shape (.ok/.error/.ids) unchanged.
//   §3  the carrier: loop.ts's arg and the block's SITING, donna.ts's trailing parameter and
//       the fourth argument, and the two names in DONNA_TOOLS rather than RECORD_TOOLS.
//   §4  V12 in donna_client and donna_stage, driven on the compiled engine: refused, passed,
//       and the pre-cure world with no fact.
//   §5  the two signals: V9 and V11 verbatim, nothing written, and their own refusals.
//   §6  lifecycleHands.js over doubles of both lanes: D3, D4, F29, and D5 to D8 each reached.
//   §7  F-43.82: the chat lane reads through invoicePdfSource and the schedule reaches the PDF.
//   §8  both doors build the fact and pass it (source seams, one per lane plus the two routes).
//   §9  the gate: binderIds arrive with estateInRoom closed; the block does not.
//   §10 column existence against docs/db/PUBLIC_SCHEMA.md (R-40.80).
//   §11 mutations of production code, each turning its named cell RED.
//
// NOT PROVEN HERE (declared): the real database, the real engine client, and the model. The
// doubles model the reads and writes these acts lean on; the founder's walk and his SELECTs
// are the database witness. The double is this bench's own, as b83's is b83's — a shared
// double would make one bench's fixture another bench's silent dependency.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-dummy-key';
delete process.env.PACKAGE_MONEY_MIRROR;
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ROOT = path.resolve(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const readIf = (rel) => (fs.existsSync(P(rel)) ? fs.readFileSync(P(rel), 'utf8') : '');

let pass = 0, fail = 0;
const fails = [];
const sec = (s) => console.log(`\n── ${s} ──`);
// ── CE-45 LCV-15 LSP_1 · LABELLED AMENDMENT: THE RETIRED CELLS OF THIS BENCH, AT SITE ─────────────────────────────
// Each row names a cell by its id and the reason it retires: the cell read code LSP_1 deleted (the WhatsApp chain's tail,
// the switch `vendor.working_chain_enabled`, listenAfterWire, the imperative family, calendarSignals.js, leadPings.js,
// introductionSeat.js). A retired cell is NOT counted as a pass; it prints RETIRED with its reason. CONTROL: at exit every
// row must have matched exactly ONE cell that this run reached, or the bench fails, so the table can never retire a cell
// by accident or outlive the cell it names.
const __RETIRE = new Map([
  [
    "§8.4 ",
    "LSP_1: the vendor lane's fact build fed only the chain's runTurn, deleted (K8)"
  ]
]);
const __seen = new Map();
function __retired(name) {
  const n = String(name);
  for (const [k, why] of __RETIRE) if (n.startsWith(k)) { __seen.set(k, (__seen.get(k) || 0) + 1); console.log(`  RETIRED  ${n}  (${why})`); return true; }
  return false;
}
process.on('exit', () => {
  const bad = [...__RETIRE.keys()].filter((k) => __seen.get(k) !== 1);
  if (bad.length) { console.log(`  FAIL  the retired-cell table does not match exactly one reached cell per row: ${bad.join(' | ')}`); process.exitCode = 1; }
});
function ok(c, n) { if (__retired(n)) return; if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; fails.push(n); console.log(`  FAIL ${n}`); } }
const tryRequire = (rel) => { try { return require(P(rel)); } catch (e) { console.log(`  (require ${rel} failed: ${e.message.split('\n')[0]})`); return null; } };
const safe = async (fn) => { try { return (await fn()) || {}; } catch (e) { console.log(`  (driver threw: ${String(e && e.message).split('\n')[0]})`); return {}; } };
const quiet = async (fn) => { const w = console.warn, e = console.error; console.warn = () => {}; console.error = () => {}; try { return await fn(); } finally { console.warn = w; console.error = e; } };

// `from`/`to` may be a single pair or a LIST of pairs. A list is used only where a cell
// is defended in more than one place and no single byte can break it — the bench says so
// at the mutation's own name rather than pretending one byte did the work.
function loadMutated(rel, from, to, overrides = {}) {
  const file = P(rel);
  if (!fs.existsSync(file)) return { missing: true };
  let src = fs.readFileSync(file, 'utf8');
  const pairs = Array.isArray(from) ? from : [[from, to]];
  for (const [f] of pairs) if (!src.includes(f)) return { missing: true };
  for (const [f, t] of pairs) src = src.replace(f, t);
  const m = new Module(file, module);
  m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
  const origReq = m.require.bind(m);
  m.require = (spec) => {
    const resolved = Module._resolveFilename(spec, m);
    return Object.prototype.hasOwnProperty.call(overrides, resolved) ? overrides[resolved] : origReq(spec);
  };
  try { m._compile(src, file); return { mod: m.exports }; }
  catch (e) { console.log(`  (mutated ${rel} did not load: ${e.message.split('\n')[0]})`); return { failed: true }; }
}

// ── the double ───────────────────────────────────────────────────────────────
function makeDb(seed = {}, opts = {}) {
  const tables = {};
  for (const [k, v] of Object.entries(seed)) tables[k] = v.map((r) => ({ ...r }));
  let nextId = 1;
  const calls = [];
  function from(table) {
    const st = { op: 'select', filters: [], rows: null, patch: null, single: false, maybe: false, returning: false, order: null, cols: null, limit: null };
    const b = {
      select(cols) { if (st.op !== 'select') st.returning = true; else if (typeof cols === 'string' && cols.trim() && cols.trim() !== '*') st.cols = cols.split(',').map((c) => c.trim()); return b; },
      eq(c, v) { st.filters.push([c, 'eq', v, (r) => r[c] === v]); return b; },
      neq(c, v) { st.filters.push([c, 'neq', v, (r) => r[c] !== v]); return b; },
      is(c, v) { st.filters.push([c, 'is', v, (r) => (v === null ? r[c] == null : r[c] === v)]); return b; },
      not(c, o, v) { if (o === 'is' && v === null) st.filters.push([c, 'not', v, (r) => r[c] != null]); return b; },
      in(c, vs) { st.filters.push([c, 'in', vs, (r) => vs.includes(r[c])]); return b; },
      order(c, o = {}) { if (!st.order) st.order = [c, o.ascending !== false]; return b; },
      limit(n) { st.limit = n; return b; },
      insert(rows) { st.op = 'insert'; st.rows = Array.isArray(rows) ? rows : [rows]; return b; },
      update(patch) { st.op = 'update'; st.patch = patch; return b; },
      single() { st.single = true; return b; },
      maybeSingle() { st.maybe = true; return b; },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    };
    // THE PROJECTION BITES. A double that hands back whole rows lets a narrowed
    // select pass a bench it should fail — which is exactly what M3 is for.
    const proj = (r) => { if (!st.cols) return { ...r }; const o = {}; for (const c of st.cols) o[c] = r[c]; return o; };
    function shape(rows) {
      if (st.single) return rows.length === 1 ? { data: proj(rows[0]), error: null } : { data: null, error: { message: 'not one row' } };
      if (st.maybe) return { data: rows[0] ? proj(rows[0]) : null, error: null };
      return { data: rows.map(proj), error: null };
    }
    function run() {
      const call = { table, op: st.op, patch: st.patch, rows: st.rows, filters: st.filters.map(([c, o, v]) => [c, o, v]) };
      calls.push(call);
      const t = tables[table] || (tables[table] = []);
      const hook = opts.fail && opts.fail(call);
      if (hook) return { data: null, error: hook };
      if (st.op === 'insert') {
        const made = st.rows.map((r) => ({ id: `${table}-${nextId++}`, deleted_at: null, ...r }));
        t.push(...made); return st.returning ? shape(made) : { data: null, error: null };
      }
      let rows = t.filter((r) => st.filters.every((f) => f[3](r)));
      if (st.op === 'update') {
        rows.forEach((r) => Object.assign(r, st.patch));
        return st.returning ? shape(rows) : { data: null, error: null };
      }
      rows = rows.slice();
      if (st.order) { const [c, asc] = st.order; rows.sort((a, b2) => (a[c] < b2[c] ? -1 : a[c] > b2[c] ? 1 : 0) * (asc ? 1 : -1)); }
      if (st.limit != null) rows = rows.slice(0, st.limit);
      return shape(rows);
    }
    return b;
  }
  return { from, tables, calls, schema: (s) => ({ from: (t) => from(s === 'engine' ? `engine.${t}` : t) }) };
}

const V = { id: 'v-dev440', user_id: 'u-dev' };
const AGENT = 'a-dev440';

function leadsWorld(extra = []) {
  return {
    leads: [
      { id: 'l-sarah', vendor_id: V.id, name: 'Sarah', state: 'booked', binder_id: 'b-sarah', deleted_at: null },
      { id: 'l-riya', vendor_id: V.id, name: 'Riya Test', state: 'booked', binder_id: 'b-riya', deleted_at: null },
      { id: 'l-meera', vendor_id: V.id, name: 'Meera', state: 'quoted', binder_id: null, deleted_at: null },
      { id: 'l-nobinder', vendor_id: V.id, name: 'Nobinder', state: 'booked', binder_id: null, deleted_at: null },
      { id: 'l-gone', vendor_id: V.id, name: 'Gone', state: 'booked', binder_id: 'b-gone', deleted_at: '2026-09-01' },
      { id: 'l-other', vendor_id: 'v-other', name: 'Nope', state: 'booked', binder_id: 'b-nope', deleted_at: null },
      ...extra,
    ],
  };
}

// C-44.3 (chair, CE-44): a double returns a timestamptz THE WAY POSTGRES RETURNS IT
// — UTC with a two-digit offset. The first cut of this bench stored `paid_at` in the
// shape the code assumed, so §6.8 went green over e-44.5's off-by-one day. A double
// shaped to agree with the code under test proves nothing.
const PAID_AT = (day) => `${day} 18:30:00+00`; // midnight IST on the NEXT day
const SCHED = (invoiceId) => ([
  { id: 'ms-1', invoice_id: invoiceId, vendor_id: V.id, ordinal: 1, milestone_label: 'Deposit, 30% of the fee, on booking', amount_due: 24000, due_date: '2026-09-17', state: 'pending', paid_at: null },
  { id: 'ms-2', invoice_id: invoiceId, vendor_id: V.id, ordinal: 2, milestone_label: '30% one month before the first function (optional)', amount_due: 24000, due_date: '2026-11-22', state: 'pending', paid_at: null },
  { id: 'ms-3', invoice_id: invoiceId, vendor_id: V.id, ordinal: 3, milestone_label: 'The remainder, on delivery, before the work is handed over', amount_due: 32000, due_date: '2027-02-05', state: 'pending', paid_at: null },
]);

function payWorld(over = {}) {
  return {
    leads: leadsWorld().leads,
    invoices: [{ id: 'inv-1', vendor_id: V.id, lead_id: 'l-sarah', invoice_number: 'TDW/DEV440/12', amount_total: 80000, amount_paid: 0, state: 'unpaid', lead_package_id: 'lp-1', deleted_at: null }],
    payment_schedules: SCHED('inv-1'),
    ...over,
  };
}

(async () => {
  // ══ §1 · the fact's home ═══════════════════════════════════════════════════
  sec('§1 · bookedFacts.js — the set, the block, the bound, the fail-safe');
  const BF = tryRequire('src/lib/vendor/bookedFacts.js');
  ok(!!(BF && BF.buildBookedFacts), '§1.1 bookedFacts exports buildBookedFacts');

  const f1 = BF ? await safe(() => BF.buildBookedFacts(makeDb(leadsWorld()), V.id)) : {};
  ok(!!f1 && f1.ok === true, '§1.2 the fact is built from the door\'s public client');
  ok(!!f1.binderIds && f1.binderIds.length === 2 && f1.binderIds.includes('b-sarah') && f1.binderIds.includes('b-riya'),
    '§1.3 binderIds is the booked-with-binder set only (null binder, deleted row and another vendor all out)');
  ok(!!f1.block && f1.block.startsWith(BF.HEADER) && f1.block.includes('2 clients stand on your books:')
    && f1.block.includes('- Sarah') && f1.block.includes('- Riya Test') && f1.block.trim().endsWith(BF.CLOSER),
    '§1.4 the block lists the named clients and closes on CLOSER');
  ok(!!f1.block && !/[0-9a-f]{8}-[0-9a-f]{4}/i.test(f1.block) && !f1.block.includes('b-sarah'),
    '§1.5 no binder id reaches the block (F-04.66, the plain clause)');
  ok(!!f1.block && !/\b(must|should|do not|don't|never|always)\b/i.test(f1.block),
    '§1.6 the block tells Victor nothing to do — facts only (chair, CE-44)');

  const fNone = BF ? await safe(() => BF.buildBookedFacts(makeDb({ leads: [] }), V.id)) : {};
  ok(!!fNone.block && fNone.block === `${BF.HEADER}\n${BF.NONE}` && !fNone.block.includes(BF.CLOSER),
    '§1.7 no booked lead: the NONE line, and the closing line is absent');

  const many = (n) => ({ leads: Array.from({ length: n }, (_, i) => ({ id: `l${i}`, vendor_id: V.id, name: `Client ${i + 1}`, state: 'booked', binder_id: `b${i}`, deleted_at: null })) });
  const f30 = BF ? await safe(() => BF.buildBookedFacts(makeDb(many(30)), V.id)) : {};
  const f31 = BF ? await safe(() => BF.buildBookedFacts(makeDb(many(31)), V.id)) : {};
  ok(!!f30.block && f30.block.includes('- Client 30') && f30.block.includes(BF.CLOSER),
    '§1.8 at the bound (30) the list is still named and still closes on CLOSER');
  ok(!!f31.block && f31.block.includes('31 clients stand on your books.') && !f31.block.includes('- Client 1') && !f31.block.includes(BF.CLOSER),
    '§1.9 over the bound (31) the block falls to the count and DROPS the closing line (chair, CE-44)');
  ok(!!f31.binderIds && f31.binderIds.length === 31, '§1.10 the control is unbounded — all 31 ids still reach the arms');

  const fBlank = BF ? await safe(() => BF.buildBookedFacts(makeDb({ leads: [
    { id: 'l1', vendor_id: V.id, name: 'Sarah', state: 'booked', binder_id: 'b1', deleted_at: null },
    { id: 'l2', vendor_id: V.id, name: '   ', state: 'booked', binder_id: 'b2', deleted_at: null },
  ] }), V.id)) : {};
  ok(!!fBlank.block && fBlank.block.includes('2 clients stand on your books.') && !fBlank.block.includes(BF.CLOSER) && fBlank.binderIds.length === 2,
    '§1.11 a blank name cell shortens the list, so the count form is used and CLOSER is dropped');

  const fSame = BF ? await safe(() => BF.buildBookedFacts(makeDb({ leads: [
    { id: 'l1', vendor_id: V.id, name: 'Sharma', state: 'booked', binder_id: 'b1', deleted_at: null },
    { id: 'l2', vendor_id: V.id, name: 'Sharma', state: 'booked', binder_id: 'b2', deleted_at: null },
  ] }), V.id)) : {};
  ok(!!fSame.block && (fSame.block.match(/- Sharma/g) || []).length === 2,
    '§1.12 two booked leads sharing a name give two lines — a name is not an identity (chair, CE-44)');

  const fFail = BF ? await quiet(() => safe(() => BF.buildBookedFacts(makeDb(leadsWorld(), { fail: (c) => (c.table === 'leads' ? { message: 'boom' } : null) }), V.id))) : {};
  ok(fFail === null || (fFail && Object.keys(fFail).length === 0 && fFail.ok === undefined),
    '§1.13 a failed read returns null — FAIL-SAFE, the caller passes undefined (read-first ruled)');
  ok(Array.isArray(BF && BF.FRAME_BYTES) && BF.FRAME_BYTES.includes(BF.HEADER) && BF.FRAME_BYTES.includes(BF.CLOSER),
    '§1.14 the frame bytes are exported, so a cell reads them and never retypes them (R-VS.10(3))');

  // ══ §2 · the additive widening ═════════════════════════════════════════════
  sec('§2 · bookedLeads.js — names beside ids, the predicate untouched');
  const BL = tryRequire('src/lib/vendor/bookedLeads.js');
  const r2 = BL ? await safe(() => BL.readBookedBinderIds(makeDb(leadsWorld()), V.id)) : {};
  ok(r2.ok === true && r2.ids instanceof Set && r2.ids.size === 2, '§2.1 .ok and .ids keep their packet 3 shape for the three callers');
  ok(Array.isArray(r2.names) && r2.names.length === 2 && r2.names.includes('Sarah'), '§2.2 .names rides beside them, additively');
  const r2bad = BL ? await safe(() => BL.readBookedBinderIds(makeDb(leadsWorld(), { fail: () => ({ message: 'nope' }) }), V.id)) : {};
  ok(r2bad.ok === false && typeof r2bad.error === 'string', '§2.3 .error keeps its shape on a failed read');
  {
    // The predicate, proven equal to the `.not()` form it replaced — b83's §1 question,
    // asked again here because this packet touched the select the answer stands on.
    const db = makeDb(leadsWorld());
    const viaNot = await db.from('leads').select('binder_id').eq('vendor_id', V.id).eq('state', 'booked').is('deleted_at', null).not('binder_id', 'is', null);
    const notIds = new Set((viaNot.data || []).map((r) => r.binder_id));
    ok(r2.ids && notIds.size === r2.ids.size && [...notIds].every((i) => r2.ids.has(i)),
      '§2.4 the in-code null drop still equals the .not() form (the widening moved no filter)');
  }
  const blSrc = readIf('src/lib/vendor/bookedLeads.js');
  ok(blSrc.includes(".select('name, binder_id')"), '§2.5 the select carries name, witnessed as public.leads column 3');
  ok(!/\.select\('binder_id'\)/.test(blSrc), '§2.6 the old projection is gone, not left beside the new one');

  // ══ §3 · the carrier ═══════════════════════════════════════════════════════
  sec('§3 · the carrier — loop.ts, donna.ts, and the tool list');
  const loopSrc = readIf('src/engine/src/core/loop.ts');
  const donnaSrc = readIf('src/engine/src/core/donna.ts');
  const rpSrc = readIf('src/engine/src/core/tools/recordPrimitives.ts');
  ok(/bookedFacts\?: \{ block: string; binderIds: string\[\] \}/.test(loopSrc), '§3.1 RunTurnArgs declares the door-built fact');
  ok(/const bookedBlock = \(estateInRoom && args\.bookedFacts && args\.bookedFacts\.block\)/.test(loopSrc), '§3.2 the block is gated on estateInRoom with its siblings');
  {
    const d = loopSrc.match(/const dynamic = [^;]+;/);
    const line = d ? d[0] : '';
    const i = (s) => line.indexOf(s);
    ok(line && i('relayBlock') < i('bookedBlock') && i('bookedBlock') < i('moneyBlock'),
      '§3.3 bookedBlock sits AFTER relayBlock and BEFORE moneyBlock (chair-ruled siting)');
    ok(line && i('expenseBlock') === Math.max(i('moneyBlock'), i('expenseBlock')) && line.trim().endsWith('expenseBlock;'),
      '§3.4 expenseBlock is still the last thing in dynamic');
  }
  ok(/vendorWords, args\.bookedFacts\);/.test(loopSrc), '§3.5 the pass-through carries the WHOLE fact, after vendorWords');
  ok(/bookedFacts\?: BookedFact,/.test(donnaSrc), '§3.6 runDonnaTurn takes it as the trailing parameter');
  ok(/executeRecordTool\(agentId, tu\.name, input, bookedFacts\)/.test(donnaSrc), '§3.7 it reaches executeRecordTool as the fourth argument, at the one call site');
  ok((donnaSrc.match(/executeRecordTool\(/g) || []).length === 1, '§3.8 there is still exactly ONE call site of executeRecordTool');
  ok(/DONNA_TOOLS: Anthropic\.Tool\[\] = \[\.\.\.RECORD_TOOLS, DONNA_BOOKING_TOOL, DONNA_MILESTONE_PAID_TOOL,/.test(donnaSrc),
    '§3.9 the two names are in DONNA_TOOLS');
  {
    const list = rpSrc.match(/export const RECORD_TOOLS: Anthropic\.Tool\[\] = \[[\s\S]*?\];/);
    ok(list && !list[0].includes('DONNA_BOOKING_TOOL') && !list[0].includes('DONNA_MILESTONE_PAID_TOOL'),
      '§3.10 and NOT in RECORD_TOOLS, which is the write-atoms over `records`');
  }

  // ══ §4 · V12 ═══════════════════════════════════════════════════════════════
  sec('§4 · V12 in the arms, driven on the compiled engine');
  const EX = tryRequire('src/engine/dist/core/tools/recordPrimitives.js');
  const V12 = 'ERROR: a booked client needs a lead behind it. Ask which package and whether the advance has arrived, then use donna_booking.';
  const vetoSrc = readIf('docs/handovers/TDW_CE43_LC2_P3_HANDOVER.md');
  ok(vetoSrc.includes(V12), '§4.0 V12 is byte-identical to the veto record');
  const FACT = { block: 'x', binderIds: ['b-sarah'] };
  const run = (name, input, booked) => (EX ? safe(() => EX.executeRecordTool(AGENT, name, input, booked)) : Promise.resolve({}));

  ok((await run('donna_stage', { binder_id: 'b-orphan', stage: 'confirmed booking' }, FACT)).display === V12,
    '§4.1 donna_stage into a booked stage on a binder with no lead behind it is refused with V12');
  ok((await run('donna_stage', { stage: 'confirmed booking' }, FACT)).display === V12,
    '§4.2 the same with no binder_id at all — nothing can stand behind a binder this call would open');
  {
    const r = await run('donna_stage', { binder_id: 'b-sarah', stage: 'confirmed booking' }, FACT);
    ok(r.display !== V12, '§4.3 a binder WITH a booked lead behind it passes');
  }
  {
    const r = await run('donna_stage', { binder_id: 'b-orphan', stage: 'quoted' }, FACT);
    ok(r.display !== V12, '§4.4 a stage that does not mean booked passes');
  }
  {
    const r = await run('donna_stage', { binder_id: 'b-orphan', stage: 'booking cancelled' }, FACT);
    ok(r.display !== V12, '§4.5 an unbooking word is not a booking word');
  }
  {
    const r = await run('donna_stage', { binder_id: 'b-orphan', stage: 'confirmed booking' }, undefined);
    ok(r.display !== V12, '§4.6 WITH NO FACT the arm is the pre-cure world — V12 never fires (fail-safe)');
  }
  ok((await run('donna_stage', { binder_id: 'b-x', stage: '   ' }, FACT)).display.startsWith('ERROR: donna_stage needs the stage word'),
    '§4.7 donna_stage\'s own pre-existing refusal is untouched and still fires first');
  {
    const r = await run('donna_client', { client: 'Meera' }, FACT);
    ok(r.display !== V12, '§4.8 donna_client with no binder_id opens an ordinary unstaged binder — not widened (chair, CE-44 §2)');
  }

  // ══ §5 · the two signals ═══════════════════════════════════════════════════
  sec('§5 · donna_booking and donna_milestone_paid — signal only');
  const V9 = 'Booking requested for Sarah; the client, event and invoice are being prepared.';
  const V11 = 'Payment requested for Khanna: the middle payment, received 2026-09-18.';
  ok(vetoSrc.includes('Booking requested for {lead}; the client, event and invoice are being prepared.'), '§5.0a V9 template is the veto record\'s');
  ok(vetoSrc.includes('Payment requested for {lead}: {milestone label}, received {date}.'), '§5.0b V11 template is the veto record\'s');
  {
    const r = await run('donna_booking', { lead: 'Sarah', kind: 'advance_paid', advance_received_on: '2026-09-18' }, FACT);
    ok(r.display === V9, '§5.1 donna_booking returns V9 verbatim');
    ok(!r.item && !r.remove && !r.found, '§5.2 and writes nothing — no snapshot item, no removal, no rows');
  }
  {
    const r = await run('donna_milestone_paid', { lead: 'Khanna', milestone: 'the middle payment', received_on: '2026-09-18' }, FACT);
    ok(r.display === V11, '§5.3 donna_milestone_paid returns V11 verbatim, echoing the owner\'s own words and date');
    ok(!r.item && !r.remove && !r.found, '§5.4 and writes nothing');
  }
  ok((await run('donna_booking', { lead: 'Sarah', kind: 'advance_paid' }, FACT)).display.includes('advance_received_on'),
    '§5.5 V8\'s own last sentence made mechanical: no date, no filing');
  ok((await run('donna_booking', { kind: 'booking_confirmed' }, FACT)).display.startsWith('ERROR: donna_booking needs the couple'),
    '§5.6 a booking with no couple named is refused');
  ok((await run('donna_milestone_paid', { lead: 'K', milestone: 'deposit', received_on: '18-09-2026' }, FACT)).display.includes('received_on'),
    '§5.7 a non-ISO date is refused at the arm before it is ever staged');
  {
    const schema = (readIf('src/engine/src/core/tools/recordPrimitives.ts').match(/DONNA_MILESTONE_PAID_TOOL[\s\S]*?\n\};/) || [''])[0];
    ok(/YYYY-MM-DD/.test(schema), '§5.8 the schema asks for the date as YYYY-MM-DD (chair\'s condition)');
  }

  // ══ §6 · the helper ════════════════════════════════════════════════════════
  sec('§6 · lifecycleHands.js — one helper, both lanes, every vetoed byte');
  const LH = tryRequire('src/lib/vendor/lifecycleHands.js');
  const L = LH && LH.LINES;
  const turn = (name, input) => ({ tool_calls: [{ name, input }] });
  const nested = (name, input) => ({ tool_calls: [{ name: 'dear_donna_talk', input: {}, donna_calls: [{ name, input }] }] });
  const runHelper = (db, result, deps) => (LH ? quiet(() => safe(() => LH.runLifecycleSignals(db, { vendor: V, agentId: AGENT, result, deps }))) : Promise.resolve({}));

  ok(!!L && vetoSrc.includes(L.D5) && vetoSrc.includes(L.D8) && vetoSrc.includes('Already marked: {client} · {milestone label} · {date}.')
    && vetoSrc.includes('Could not mark the payment. Say which one: {labels}.'),
    '§6.0 D5 to D8 are committed to the veto record in the tree, not held in chat');

  {  // D3 — a middle payment marked, the next one due. The deposit already stands
     // marked, which is card 4a step 2's own order: a middle payment comes after one.
    const wD3 = payWorld();
    wD3.payment_schedules = SCHED('inv-1').map((m) => (m.ordinal === 1 ? { ...m, state: 'paid', paid_at: PAID_AT('2026-09-10') } : m));
    const db = makeDb(wD3);
    const marked = [];
    const deps = { markMilestonePaid: async (_s, _v, id, amt, on) => { marked.push([id, amt, on]); const r = db.tables.payment_schedules.find((m) => m.id === id); r.state = 'paid'; r.paid_at = PAID_AT(on.slice(0,8) + String(Number(on.slice(8,10)) - 1).padStart(2,'0')); return { ok: true }; } };
    const r = await runHelper(db, turn('donna_milestone_paid', { lead: 'Sarah', milestone: 'the middle payment', received_on: '2026-09-18' }), deps);
    ok(marked.length === 1 && marked[0][0] === 'ms-2' && marked[0][1] === 24000 && marked[0][2] === '2026-09-18',
      '§6.1 the owner\'s words pick the middle milestone and its OWN amount is marked');
    ok(r.lines && r.lines[0] === 'Payment marked: Sarah · 30% one month before the first function (optional) · Rs 24,000 · 18 September 2026. Next due 5 February 2027.',
      '§6.2 D3 verbatim: label, Rs in Indian grouping, full month both dates (R-41.114, R-42.13)');
  }
  {  // "Next due" is the FIRST PENDING BY ORDINAL, which is what markMilestonePaid itself
     // writes onto the invoice (schedules.js firstPending). The two must not drift: a line
     // that named a different milestone than the invoice's own due_date would be a second
     // opinion about the same fact.
    const wSkip = payWorld();  // deposit STILL unpaid, the middle one marked out of order
    const db = makeDb(wSkip);
    const deps = { markMilestonePaid: async (_s, _v, id, _a, on) => { const x = db.tables.payment_schedules.find((m) => m.id === id); x.state = 'paid'; x.paid_at = PAID_AT(on.slice(0,8) + String(Number(on.slice(8,10)) - 1).padStart(2,'0')); return { ok: true }; } };
    const r = await runHelper(db, turn('donna_milestone_paid', { lead: 'Sarah', milestone: 'the middle payment', received_on: '2026-09-18' }), deps);
    ok(r.lines && r.lines[0].endsWith('Next due 17 September 2026.'),
      '§6.2b "Next due" is the first pending by ordinal, the same rule the writer stamps on the invoice');
  }
  {  // D4 — the last one
    const w = payWorld();
    w.payment_schedules = SCHED('inv-1').map((m) => (m.ordinal === 3 ? m : { ...m, state: 'paid', paid_at: PAID_AT('2026-08-31') }));
    const db = makeDb(w);
    const deps = { markMilestonePaid: async (_s, _v, id, _a, on) => { const r = db.tables.payment_schedules.find((m) => m.id === id); r.state = 'paid'; r.paid_at = PAID_AT(on.slice(0,8) + String(Number(on.slice(8,10)) - 1).padStart(2,'0')); return { ok: true }; } };
    const r = await runHelper(db, turn('donna_milestone_paid', { lead: 'Sarah', milestone: 'the remainder', received_on: '2026-09-18' }), deps);
    ok(r.lines && r.lines[0] === L.D4('Sarah'), '§6.3 the last pending milestone gives D4, "paid in full."');
    ok(r.lines && !r.lines[0].includes('Next due'), '§6.4 and D4 carries no next-due clause');
  }
  {  // D5 · D6 · D7 · D8
    const db = () => makeDb(payWorld());
    const deps = { markMilestonePaid: async () => ({ ok: true }) };
    const r5 = await runHelper(db(), turn('donna_milestone_paid', { lead: 'Nobody', milestone: 'the deposit', received_on: '2026-09-18' }), deps);
    ok(r5.lines && r5.lines[0] === L.D5, '§6.5 an unknown couple gives D5');
    const r5b = await runHelper(db(), turn('donna_milestone_paid', { lead: 'Meera', milestone: 'the deposit', received_on: '2026-09-18' }), deps);
    ok(r5b.lines && r5b.lines[0] === L.D5, '§6.6 a couple who is NOT booked is also "no booked client by that name"');

    const r6 = await runHelper(db(), turn('donna_milestone_paid', { lead: 'Sarah', milestone: 'the thing', received_on: '2026-09-18' }), deps);
    ok(r6.lines && r6.lines[0] === 'Could not mark the payment. Say which one: Deposit, 30% of the fee, on booking · 30% one month before the first function (optional) · The remainder, on delivery, before the work is handed over.',
      '§6.7 an unmatched payment gives D6 carrying the UNPAID labels, in schedule order, joined with " · " (c-44.5)');

    const wPaid = payWorld();
    wPaid.payment_schedules = SCHED('inv-1').map((m) => (m.ordinal === 1 ? { ...m, state: 'paid', paid_at: PAID_AT('2026-09-10') } : m));
    const r7 = await runHelper(makeDb(wPaid), turn('donna_milestone_paid', { lead: 'Sarah', milestone: 'the deposit', received_on: '2026-09-18' }), deps);
    ok(r7.lines && r7.lines[0] === 'Already marked: Sarah · Deposit, 30% of the fee, on booking · 11 September 2026.',
      '§6.8 an already-marked payment gives D7 with the STORED date as the vendor\'s IST day (e-44.5), not the date just said');

    const dbNoWrite = makeDb(wPaid);
    await runHelper(dbNoWrite, turn('donna_milestone_paid', { lead: 'Sarah', milestone: 'the deposit', received_on: '2026-09-18' }), { markMilestonePaid: async () => { throw new Error('D7 must not write'); } });
    ok(!dbNoWrite.calls.some((c) => c.table === 'payment_schedules' && c.op === 'update'), '§6.9 D7 writes nothing');

    const r8 = await runHelper(db(), turn('donna_milestone_paid', { lead: 'Sarah', milestone: 'the deposit', received_on: '2026-02-30' }), deps);
    ok(r8.lines && r8.lines[0] === L.D8, '§6.10 an invalid calendar date takes the plain refusal D8 (chair, CE-44)');
    ok(LH && LH.isRealDate('2026-09-18') && !LH.isRealDate('2026-02-30') && !LH.isRealDate('2026-13-01'), '§6.11 isRealDate rejects a well-formed non-day');

    const w2 = payWorld();
    w2.leads = [...w2.leads, { id: 'l-s2', vendor_id: V.id, name: 'Sarah', state: 'booked', binder_id: 'b-s2', deleted_at: null }];
    const rDup = await runHelper(makeDb(w2), turn('donna_milestone_paid', { lead: 'Sarah', milestone: 'the deposit', received_on: '2026-09-18' }), deps);
    ok(rDup.lines && rDup.lines[0] === L.D8, '§6.12 two booked leads by one name take D8 — no line minted for it (chair, CE-44)');

    const rNoInv = await runHelper(makeDb({ leads: payWorld().leads, invoices: [], payment_schedules: [] }), turn('donna_milestone_paid', { lead: 'Sarah', milestone: 'the deposit', received_on: '2026-09-18' }), deps);
    ok(rNoInv.lines && rNoInv.lines[0] === L.D8, '§6.13 no invoice behind the couple takes D8');

    const wAll = payWorld();
    wAll.payment_schedules = SCHED('inv-1').map((m) => ({ ...m, state: 'paid', paid_at: PAID_AT('2026-08-31') }));
    const rAll = await runHelper(makeDb(wAll), turn('donna_milestone_paid', { lead: 'Sarah', milestone: 'whatever', received_on: '2026-09-18' }), deps);
    ok(rAll.lines && rAll.lines[0] === L.D8, '§6.14 nothing unpaid and nothing named: D8, never an empty D6');
  }
  {  // F29 and the booking lane
    const db = makeDb(payWorld());
    const rF = await runHelper(db, turn('donna_booking', { lead: 'Nobody', kind: 'booking_confirmed' }), { promoteLead: async () => ({ status: 200, body: { ok: true, promoted: {} } }) });
    ok(rF.lines && rF.lines[0] === L.F29, '§6.15 a booking whose couple does not resolve gives F29');
    const rF2 = await runHelper(db, turn('donna_booking', { lead: 'Meera', kind: 'advance_paid', advance_received_on: '2026-02-30' }), { promoteLead: async () => ({ status: 200, body: { ok: true, promoted: {} } }) });
    ok(rF2.lines && rF2.lines[0] === L.F29, '§6.16 an advance on an invalid calendar date gives F29');
    const seen = [];
    const rOk = await runHelper(makeDb(payWorld()), turn('donna_booking', { lead: 'Meera', kind: 'booking_confirmed' }), { promoteLead: async (_s, p) => { seen.push(p); return { status: 200, body: { ok: true, promoted: { invoice_id: 'inv-1' } } }; } });
    ok(seen.length === 1 && seen[0].leadId === 'l-meera' && seen[0].kind === 'booking_confirmed' && seen[0].agentId === AGENT,
      '§6.17 the act runs through promoteLead, the estate\'s own writer, never a second copy');
    ok(rOk.lines && rOk.lines.length === 0, '§6.18 a booking with no advance says nothing in 4a — D1 belongs to 4b (chair-ruled split)');
    const rRefused = await runHelper(makeDb(payWorld()), turn('donna_booking', { lead: 'Meera', kind: 'booking_confirmed' }), { promoteLead: async () => ({ status: 422, body: { ok: false, error: 'no package' } }) });
    ok(rRefused.lines && rRefused.lines[0] === L.F29, '§6.19 a refused promotion gives F29');
  }
  {  // the nested path
    const db = makeDb(payWorld());
    const deps = { markMilestonePaid: async (_s, _v, id, _a, on) => { const r = db.tables.payment_schedules.find((m) => m.id === id); r.state = 'paid'; r.paid_at = PAID_AT(on.slice(0,8) + String(Number(on.slice(8,10)) - 1).padStart(2,'0')); return { ok: true }; } };
    const r = await runHelper(db, nested('donna_milestone_paid', { lead: 'Sarah', milestone: 'the deposit', received_on: '2026-09-18' }), deps);
    ok(r.lines && r.lines.length === 1 && r.lines[0].startsWith('Payment marked: Sarah'), '§6.20 a signal nested under donna_calls is read too, as buildInvoices reads it');
  }
  ok(LH && typeof LH.LINES === 'object' && Object.keys(LH.LINES).length === 7,
    '§6.21 every vendor-facing byte has ONE home — D3, D4, D5, D6, D7, D8, F29');
  {
    const src = readIf('src/lib/vendor/lifecycleHands.js');
    const body = src.slice(src.indexOf('async function runLifecycleSignals'));
    ok(!/lines\.push\(['"`]/.test(body), '§6.22 no branch composes a string of its own — every push reads from LINES');
  }

  // ══ §7 · F-43.82, RE-AIMED — the cure at the LIVE site ════════════════════
  sec('§7 · F-43.82 — the package invoice\'s chat-served source carries its schedule');
  {
    const INV = tryRequire('src/api/vendor/invoices.js');
    const mkWorld = (has) => ({
      invoices: [{ id: 'inv-1', vendor_id: V.id, invoice_number: 'TDW/DEV440/12', client_name: 'Sarah', amount_total: 80000, amount_paid: 24000, has_schedule: has, lead_package_id: has ? 'lp-1' : null, binder_id: 'b-sarah', pdf_url: null, deleted_at: null }],
      vendors: [{ id: V.id, business_name: 'DEV440', user_id: V.user_id }],
      users: [{ id: V.user_id, name: 'Dev' }],
      payment_schedules: has ? SCHED('inv-1') : [],
      vendor_seal: [{ vendor_id: V.id, weddings: 7, delivery_days: 40 }],
    });
    // The renderer is swapped for a spy under its real path, so what the PDF actually
    // receives is the witness — not what the call site appears to pass.
    const seen = [];
    const spy = { generateInvoicePdf: async (args) => { seen.push(args); return Buffer.from('pdf'); }, STATE_WORD: {}, SHOWS_RAILS: () => true };
    const storage = { from: () => ({ upload: async () => ({ error: null }), createSignedUrl: async () => ({ data: { signedUrl: 'https://x/y.pdf' } }) }) };
    const withStorage = (db) => Object.assign(db, { storage });

    const m = loadMutated('src/api/vendor/invoices.js', 'const { executeAndPatch }', 'const { executeAndPatch }',
      { [require.resolve(P('src/lib/invoicePdf.js'))]: spy });
    const door = m.mod;
    ok(!!(door && door.generateInvoiceForBinder), '§7.0 the door loads with the renderer spied');

    if (door && door.generateInvoiceForBinder) {
      seen.length = 0;
      await quiet(() => safe(() => door.generateInvoiceForBinder(withStorage(makeDb(mkWorld(true))), { id: V.id, user_id: V.user_id, business_name: 'DEV440' }, { id: 'b-sarah' })));
      ok(seen.length === 1 && Array.isArray(seen[0].schedule) && seen[0].schedule.length === 3,
        '§7.1 a PACKAGE invoice reaches the renderer WITH its three milestone rows');
      ok(seen.length === 1 && seen[0].seal && seen[0].seal.weddings === 7,
        '§7.2 and with the G2 seal the money lane\'s copy of the same document shows');

      // THE OTHER CALLER, REACHED THE WAY THE TREE REACHES IT: no package row on the
      // binder, so generateInvoiceForBinder falls past the package branch and mints a
      // fresh invoice, which is rendered at the site the chair cites as :448.
      seen.length = 0;
      const freshDb = withStorage(makeDb({
        invoices: [],
        vendors: [{ id: V.id, business_name: 'DEV440', user_id: V.user_id, routing_handle: 'DEV440', invoice_prefix: 'TDW/DEV440', invoice_counter: 11 }],
        users: [{ id: V.user_id, name: 'Dev' }],
        payment_schedules: [], vendor_seal: [{ vendor_id: V.id, weddings: 7, delivery_days: 40 }],
      }));
      await quiet(() => safe(() => door.generateInvoiceForBinder(freshDb, { id: V.id, user_id: V.user_id, business_name: 'DEV440' }, { id: 'b-fresh', client: 'Fresh', phone: '+919888294440', amount: 50000, amount_received: 10000 })));
      ok(seen.length === 1 && Array.isArray(seen[0].schedule) && seen[0].schedule.length === 0,
        '§7.3 a JUST-CREATED invoice still renders with no schedule — because it has none');
      ok(seen.length === 1 && seen[0].seal === null,
        '§7.4 and with no seal, so the create hot path gains no query (the comment\'s reason, now proven)');
    } else { ok(false, '§7.1 a PACKAGE invoice reaches the renderer WITH its three milestone rows'); ok(false, '§7.2 and with the G2 seal'); ok(false, '§7.3 an invoice with NO milestones renders with none'); ok(false, '§7.4 and with no seal'); }

    const invApi = readIf('src/api/vendor/invoices.js');
    ok(/invoicePdfSource\(supabase, vendor\.id, invoice\.id\)/.test(invApi), '§7.5 the typed source is the ONE home — no second reader, no new formatter');
    ok(/generateAndStoreInvoicePdf\(supabase, vendor, pkgInvoice, \{ typed: true \}\)/.test(invApi), '§7.6 only the package caller asks for it');
    const engSrc = readIf('src/agent/engine.js');
    const banner = engSrc.indexOf('F-05.56 \u2014 EVERYTHING BELOW THIS LINE');
    ok(banner > 0 && !/seal/.test(engSrc.slice(banner)), '§7.7 the defused island is unedited — b55\'s cell and its freeze guard both hold');
  }

  // ══ §8 · both doors ════════════════════════════════════════════════════════
  sec('§8 · both doors build the fact and pass it (C-43.1, never a per-lane cure)');
  const chatSrc = readIf('src/api/vendor-engine/chat.js');
  const waSrc = readIf('src/lib/vendorInbound.js');
  ok(/async function fetchBookedFacts\(req\)/.test(chatSrc), '§8.1 the web door has ONE builder for both its routes');
  ok((chatSrc.match(/fetchBookedFacts\(req\)/g) || []).length === 3, '§8.2 called by the SSE route and the JSON route (plus its definition)');
  ok((chatSrc.match(/bookedFacts: bookedFacts \? \{ block: bookedFacts\.block, binderIds: bookedFacts\.binderIds \} : undefined/g) || []).length === 2,
    '§8.3 both web routes pass the WHOLE fact, block and ids');
  ok(/buildBookedFacts\(supabase, vendor\.id\)/.test(waSrc) && /bookedFacts: bookedFacts \? \{ block: bookedFacts\.block, binderIds: bookedFacts\.binderIds \} : undefined/.test(waSrc),
    '§8.4 the vendor lane builds and passes the same fact from the same module');
  // SPLIT (CE-45 LCV-15 LSP_1, labelled): the vendor lane's half is RETIRED with the chain's tail; on WhatsApp the door
  // runs the lifecycle hands itself (workingDoor.js, b90 holds it). The web half stands.
  ok((chatSrc.match(/runLifecycleSignals\(req\.app\.locals\.supabase/g) || []).length === 2,
    '§8.5 both lanes act on the signals through the ONE helper (SPLIT, LSP_1: the web lane; the chain lane is deleted)');
  ok(/if \(lifecycle && lifecycle\.length\)\s+parts\.push\(scrubText\(lifecycle\.join/.test(chatSrc), '§8.6 the web door\'s lines ride composedTail\'s one ordered list');

  // ══ §9 · the gate ══════════════════════════════════════════════════════════
  sec('§9 · the gate — the control is not gated, the block is');
  {
    const line = (loopSrc.match(/const bookedBlock = [^;]+;/) || [''])[0];
    ok(/estateInRoom/.test(line), '§9.1 the BLOCK is behind estateInRoom');
    const call = (loopSrc.match(/const donna = await runDonnaTurn\([^;]+;/) || [''])[0];
    ok(/args\.bookedFacts\)/.test(call) && !/estateInRoom/.test(call),
      '§9.2 the FACT reaches runDonnaTurn ungated — V12 is a control and runs room or no room (chair, CE-44)');
    ok(/executeRecordTool\(agentId, tu\.name, input, bookedFacts\)/.test(donnaSrc) && !/estateInRoom/.test(donnaSrc),
      '§9.3 and nothing in donna.ts gates it on the way to the arms');
  }

  // ══ §10 · columns ══════════════════════════════════════════════════════════
  sec('§10 · column existence against docs/db/PUBLIC_SCHEMA.md (R-40.80)');
  {
    const schema = readIf('docs/db/PUBLIC_SCHEMA.md');
    const block = (t) => { const i = schema.indexOf(`## public.${t}`); if (i < 0) return ''; const j = schema.indexOf('```', schema.indexOf('```', i) + 3); return schema.slice(i, j); };
    const leads = block('leads'), ps = block('payment_schedules'), inv = block('invoices');
    ok(/\bname text\b/.test(leads), '§10.1 public.leads.name exists (the widening\'s witness)');
    ok(/\bstate text\b/.test(leads) && /binder_id uuid/.test(leads) && /deleted_at/.test(leads), '§10.2 the predicate\'s columns are unchanged');
    ok(/milestone_label text/.test(ps) && /paid_at/.test(ps) && /ordinal integer/.test(ps) && /amount_due integer/.test(ps),
      '§10.3 payment_schedules carries milestone_label, paid_at, ordinal and amount_due (D3, D6, D7)');
    ok(/lead_id/.test(inv) && /amount_total/.test(inv) && /lead_package_id/.test(inv), '§10.4 invoices carries lead_id, amount_total and lead_package_id');
  }

  // ══ §12 · 4a-h1 · e-44.5, F-44.8, F-44.12, V13 ════════════════════════════
  sec('§12 · 4a-h1 — the IST day, the absorbed D7, the instalments, V13');
  {
    const W = tryRequire('src/lib/witnessLine.js');
    ok(W && W.istDay('2026-09-17 18:30:00+00') === '2026-09-18', '§12.1 18:30:00Z rolls to the next IST day');
    ok(W && W.istDay('2026-09-17 18:29:59+00') === '2026-09-17', '§12.2 18:29:59Z does not');
    ok(W && W.istDay('2026-09-18') === '2026-09-18', '§12.3 a plain date string passes through unchanged');
    ok(W && W.istDay('junk') === null && W.istDay(null) === null, '§12.4 junk returns null — it fails loudly, never a wrong day');
    ok(W && W.istDay('2026-09-17T18:30:00Z') === '2026-09-18', '§12.5 and it reads the ISO spelling too');
  }
  {
    // F-44.8: one turn carrying BOTH signals for the SAME milestone.
    const db = makeDb(payWorld());
    const deps = {
      promoteLead: async () => { const d = db.tables.payment_schedules.find((m) => m.ordinal === 1); d.state = 'paid'; d.paid_at = PAID_AT('2026-09-17'); return { status: 200, body: { ok: true, promoted: { invoice_id: 'inv-1' } } }; },
      markMilestonePaid: async () => { throw new Error('the absorbed branch must not write'); },
    };
    const both = { tool_calls: [
      { name: 'donna_booking', input: { lead: 'Meera', kind: 'advance_paid', advance_received_on: '2026-09-18' } },
      { name: 'donna_milestone_paid', input: { lead: 'Sarah', milestone: 'the deposit', received_on: '2026-09-18' } },
    ] };
    const r = await runHelper(db, both, deps);
    ok(r.lines && r.lines.length === 1 && r.lines[0].startsWith('Payment marked: Meera'),
      '§12.6 the booking speaks D3 and the payment naming the SAME milestone is absorbed — one line, not two');
    ok(r.lines && !r.lines.some((l) => l.startsWith('Already marked')), '§12.7 no D7 for what this turn just said');
  }
  {
    // F-44.8's other half: a DIFFERENT milestone in the same turn still runs.
    const db = makeDb(payWorld());
    const deps = {
      promoteLead: async () => { const d = db.tables.payment_schedules.find((m) => m.ordinal === 1); d.state = 'paid'; d.paid_at = PAID_AT('2026-09-17'); return { status: 200, body: { ok: true, promoted: { invoice_id: 'inv-1' } } }; },
      markMilestonePaid: async (_s, _v, id, _a, on) => { const m = db.tables.payment_schedules.find((x) => x.id === id); m.state = 'paid'; m.paid_at = PAID_AT(on.slice(0, 8) + String(Number(on.slice(8, 10)) - 1).padStart(2, '0')); return { ok: true }; },
    };
    const both = { tool_calls: [
      { name: 'donna_booking', input: { lead: 'Meera', kind: 'advance_paid', advance_received_on: '2026-09-18' } },
      { name: 'donna_milestone_paid', input: { lead: 'Sarah', milestone: 'the middle payment', received_on: '2026-09-18' } },
    ] };
    const r = await runHelper(db, both, deps);
    ok(r.lines && r.lines.length === 2 && r.lines[1].includes('30% one month before'),
      '§12.8 a DIFFERENT milestone in the same turn runs and speaks D3 as normal');
  }
  {
    // V13 · F-44.15, driven on the compiled engine.
    const V13 = "ERROR: this client's money lives on the package invoice. Use donna_milestone_paid to mark a payment. Do not edit the record's money.";
    ok(vetoSrc.includes(V13), '§12.9 V13 is byte-identical to the veto record');
    ok((await run('donna_money_edit', { binder_id: 'b-sarah', amount_received: 80000 }, FACT)).display === V13,
      '§12.10 Victor\'s donna_money_edit on a binder with a booked lead is refused with V13');
    const noFact = await run('donna_money_edit', { binder_id: 'b-sarah', amount_received: 80000 }, undefined);
    ok(noFact.display !== V13,
      '§12.11 the DOOR\'s write — executeAndPatch.js:12 passes three arguments, no booked set — is not refused');
    ok((await run('donna_money', { binder_id: 'b-sarah', amount: 15000, direction: 'in' }, FACT)).display !== V13,
      '§12.12 donna_money still writes: it is the vendor\'s only door for a sale outside the package (F-44.17)');
    ok((await run('donna_money_edit', { binder_id: 'b-plain', amount_received: 500 }, FACT)).display !== V13,
      '§12.13 a binder with no booked lead behind it is untouched');
    ok(/executeRecordTool\(agentId, name, input\)/.test(readIf('src/lib/executeAndPatch.js')),
      '§12.14 THE SEPARATOR: executeAndPatch passes THREE arguments — if anyone threads the set through it, this cell reds');
  }
  {
    // F-44.12 · the instalments, and the bound.
    const MF = tryRequire('src/lib/vendor/moneyFacts.js');
    ok(MF && MF.MILESTONE_LINE_CAP === 40, '§12.15 the instalment cap is 40 lines across the block');
    ok(MF && /first 20 invoices only/.test(MF.CUT_LINE(20)) && /not listed here/.test(MF.CUT_LINE(20)),
      '§12.16 the cut line names N and says plainly that the others have instalments (chair, CE-44)');
    const WG = tryRequire('src/lib/wireGuardVictor.js');
    const facts = { ok: true, unreadable: false, rowCount: 1, handles: {
      amounts: ['32,000', '32000', '32,000', '32000'], rowAmounts: [32000],
      numbers: ['TDW/DEV440/17'], names: ['Swati Test'] } };
    ok(WG && WG.moneyGrounded('Swati Test middle payment, Rs 26,667, received 18 September 2026.', facts, null) === false,
      '§12.17 F-44.10\'s own invented figure convicts on a turn that reaches the fence');
    ok(WG && WG.moneyGrounded('Swati Test still owes Rs 32,000 on the remainder.', facts, null) === true,
      '§12.18 a true instalment figure is admitted, because the block now holds it');
    ok(!facts.handles.rowAmounts.includes(24000),
      '§12.19 instalments do NOT enter rowAmounts — ARM B\'s pool is not an invoice\'s own parts plus another\'s whole');
  }

  // ══ §11 · mutations ════════════════════════════════════════════════════════
  sec('§11 · mutations of production code — each must turn its named cell RED');
  let mPass = 0, mFail = 0;
  const mut = (n, c) => { if (c) { mPass++; console.log(`  ok   ${n}`); } else { mFail++; fails.push(n); console.log(`  FAIL ${n}`); } };

  {
    const m = loadMutated('src/lib/vendor/bookedFacts.js', "const NAME_LIMIT = 30;", "const NAME_LIMIT = 100;");
    const r = m.mod ? await safe(() => m.mod.buildBookedFacts(makeDb(many(31)), V.id)) : {};
    mut('M1 · NAME_LIMIT 30 → 100 breaks §1.9 (the bound)', !!r.block && r.block.includes('- Client 1'));
  }
  {
    const m = loadMutated('src/lib/vendor/bookedFacts.js', "const CLOSER = 'A client not named here has no booked lead behind them yet.';", "const CLOSER = 'Do not file a client who is not on this list.';");
    const r = m.mod ? await safe(() => m.mod.buildBookedFacts(makeDb(leadsWorld()), V.id)) : {};
    mut('M2 · an instruction in the closing line breaks §1.6 (facts only)', !!r.block && /\bDo not\b/.test(r.block));
  }
  {
    const m = loadMutated('src/lib/vendor/bookedLeads.js', ".select('name, binder_id')", ".select('binder_id')");
    const r = m.mod ? await safe(() => m.mod.readBookedBinderIds(makeDb(leadsWorld()), V.id)) : {};
    mut('M3 · dropping name from the select breaks §2.2 (names beside ids)', !!r.ok && (!r.names || r.names.length === 0));
  }
  {
    const m = loadMutated('src/lib/vendor/bookedLeads.js', ".eq('state', 'booked')", ".eq('state', 'quoted')");
    const r = m.mod ? await safe(() => m.mod.readBookedBinderIds(makeDb(leadsWorld()), V.id)) : {};
    mut('M4 · changing the predicate\'s state breaks §2.4 (the set)', !!r.ok && r.ids.size !== 2);
  }
  {
    const m = loadMutated('src/lib/vendor/bookedFacts.js', 'if (!read || !read.ok) {', 'if (false) {');
    const r = m.mod ? await quiet(() => safe(() => m.mod.buildBookedFacts(makeDb(leadsWorld(), { fail: () => ({ message: 'boom' }) }), V.id))) : {};
    mut('M5 · swallowing a failed read breaks §1.13 (fail-safe null)', r !== null && Object.keys(r).length > 0);
  }
  {
    const m = loadMutated('src/lib/vendor/lifecycleHands.js', "  D5: 'Could not mark the payment. No booked client by that name.',", "  D5: 'No such client.',");
    const db = makeDb(payWorld());
    const r = m.mod ? await quiet(() => safe(() => m.mod.runLifecycleSignals(db, { vendor: V, agentId: AGENT, result: turn('donna_milestone_paid', { lead: 'Nobody', milestone: 'the deposit', received_on: '2026-09-18' }), deps: { markMilestonePaid: async () => ({ ok: true }) } }))) : {};
    mut('M6 · re-wording D5 breaks §6.5 (the vetoed byte)', !!r.lines && r.lines[0] !== L.D5);
  }
  {
    const m = loadMutated('src/lib/vendor/lifecycleHands.js', '      if (!isRealDate(on)) {', '      if (false) {');
    const db = makeDb(payWorld());
    const r = m.mod ? await quiet(() => safe(() => m.mod.runLifecycleSignals(db, { vendor: V, agentId: AGENT, result: turn('donna_milestone_paid', { lead: 'Sarah', milestone: 'the deposit', received_on: '2026-02-30' }), deps: { markMilestonePaid: async () => ({ ok: true }) } }))) : {};
    mut('M7 · a date test that always passes breaks §6.10 (the invalid day)', !!r.lines && r.lines[0] !== L.D8);
  }
  {
    const m = loadMutated('src/lib/vendor/lifecycleHands.js', "return (rows || []).filter((m) => m.state === 'pending')\n    .slice().sort((a, b) => a.ordinal - b.ordinal)\n    .map((m) => String(m.milestone_label || '').trim())", "return (rows || [])\n    .slice().sort((a, b) => a.ordinal - b.ordinal)\n    .map((m) => String(m.milestone_label || '').trim())");
    const wPaid = payWorld();
    wPaid.payment_schedules = SCHED('inv-1').map((x) => (x.ordinal === 1 ? { ...x, state: 'paid', paid_at: PAID_AT('2026-09-10') } : x));
    const r = m.mod ? await quiet(() => safe(() => m.mod.runLifecycleSignals(makeDb(wPaid), { vendor: V, agentId: AGENT, result: turn('donna_milestone_paid', { lead: 'Sarah', milestone: 'the thing', received_on: '2026-09-18' }), deps: { markMilestonePaid: async () => ({ ok: true }) } }))) : {};
    mut('M8 · offering a PAID label in D6 breaks §6.7 (unpaid labels only)', !!r.lines && /Deposit, 30%/.test(r.lines[0]));
  }
  {
    const m = loadMutated('src/lib/vendor/lifecycleHands.js', 'if (bookedOnly) hits = hits.filter', 'if (false) hits = hits.filter');
    const r = m.mod ? await quiet(() => safe(() => m.mod.runLifecycleSignals(makeDb(payWorld()), { vendor: V, agentId: AGENT, result: turn('donna_milestone_paid', { lead: 'Meera', milestone: 'the deposit', received_on: '2026-09-18' }), deps: { markMilestonePaid: async () => ({ ok: true }) } }))) : {};
    mut('M9 · ignoring bookedOnly breaks §6.6 (an unbooked couple is still D5)', !!r.lines && r.lines[0] !== L.D5);
  }
  {
    const m = loadMutated('src/engine/dist/core/tools/recordPrimitives.js', 'if (booked && meansBooked(input.stage) && !hasLeadBehind(booked, rid))', 'if (false)');
    const r = m.mod ? await safe(() => m.mod.executeRecordTool(AGENT, 'donna_stage', { binder_id: 'b-orphan', stage: 'confirmed booking' }, FACT)) : {};
    mut('M10 · disarming V12 in donna_stage breaks §4.1', !!r.display && r.display !== V12);
  }
  {
    // §4.6 is defended TWICE — the arm's own `booked &&` and hasLeadBehind's escape — so
    // no single byte can break it. Both are removed here, and the name says so.
    const m = loadMutated('src/engine/dist/core/tools/recordPrimitives.js', [
      ['    if (!booked || !Array.isArray(booked.binderIds))\n        return true;', '    if (false)\n        return true;'],
      ['if (booked && meansBooked(input.stage) && !hasLeadBehind(booked, rid))', 'if (meansBooked(input.stage) && !hasLeadBehind(booked, rid))'],
    ]);
    const r = m.mod ? await safe(() => m.mod.executeRecordTool(AGENT, 'donna_stage', { binder_id: 'b-orphan', stage: 'confirmed booking' }, undefined)) : {};
    // Either it refuses with no fact, or it throws reaching into one that is not there.
    // Both break §4.6, which asks for an ordinary outcome and nothing else.
    mut('M11 · removing BOTH absent-fact guards (two bytes, disclosed) breaks §4.6', !(r.display && r.display !== V12));
  }
  {
    const m = loadMutated('src/engine/dist/core/tools/recordPrimitives.js', "return { display: `Booking requested for ${lead}; the client, event and invoice are being prepared.` };", "return writeFields(agentId, rid, { client: lead }, 'booking');");
    const r = m.mod ? await safe(() => m.mod.executeRecordTool(AGENT, 'donna_booking', { lead: 'Sarah', kind: 'booking_confirmed' }, FACT)) : {};
    mut('M12 · a signal that writes breaks §5.1 and §5.2', !r.display || r.display !== V9);
  }

  {
    const seen = [];
    const spy = { generateInvoicePdf: async (a) => { seen.push(a); return Buffer.from('p'); }, STATE_WORD: {}, SHOWS_RAILS: () => true };
    const m = loadMutated('src/api/vendor/invoices.js', 'generateAndStoreInvoicePdf(supabase, vendor, pkgInvoice, { typed: true })', 'generateAndStoreInvoicePdf(supabase, vendor, pkgInvoice)',
      { [require.resolve(P('src/lib/invoicePdf.js'))]: spy });
    const db = makeDb({
      invoices: [{ id: 'inv-1', vendor_id: V.id, invoice_number: 'TDW/DEV440/12', client_name: 'S', amount_total: 80000, amount_paid: 0, has_schedule: true, lead_package_id: 'lp-1', binder_id: 'b-sarah', pdf_url: null, deleted_at: null }],
      vendors: [{ id: V.id, business_name: 'D', user_id: V.user_id }], users: [{ id: V.user_id, name: 'Dev' }],
      payment_schedules: SCHED('inv-1'), vendor_seal: [{ vendor_id: V.id, weddings: 7, delivery_days: 40 }],
    });
    db.storage = { from: () => ({ upload: async () => ({ error: null }), createSignedUrl: async () => ({ data: { signedUrl: 'https://x/y.pdf' } }) }) };
    if (m.mod) await quiet(() => safe(() => m.mod.generateInvoiceForBinder(db, { id: V.id, user_id: V.user_id, business_name: 'D' }, { id: 'b-sarah' })));
    mut('M13 · dropping { typed: true } breaks §7.1 (the schedule stops riding)', seen.length === 1 && (!seen[0].schedule || seen[0].schedule.length === 0));
  }
  {
    const m = loadMutated('src/lib/vendor/lifecycleHands.js', "labels.join(' · ')", "labels.join(', ')");
    const wl = payWorld();
    const r = m.mod ? await quiet(() => safe(() => m.mod.runLifecycleSignals(makeDb(wl), { vendor: V, agentId: AGENT, result: turn('donna_milestone_paid', { lead: 'Sarah', milestone: 'the thing', received_on: '2026-09-18' }), deps: { markMilestonePaid: async () => ({ ok: true }) } }))) : {};
    mut('M14 · a comma joiner in D6 breaks §6.7 (c-44.5)', !!r.lines && !r.lines[0].includes(' · '));
  }

  {
    // THE MUTATION THAT WOULD HAVE CAUGHT e-44.5. Restores the sliced UTC string.
    // It bites only because the double now returns paid_at as Postgres does (C-44.3).
    const m = loadMutated('src/lib/vendor/lifecycleHands.js', 'const day = istDay(pick.row.paid_at);', "const day = String(pick.row.paid_at || '').slice(0, 10);");
    const wPaid = payWorld();
    wPaid.payment_schedules = SCHED('inv-1').map((x) => (x.ordinal === 1 ? { ...x, state: 'paid', paid_at: PAID_AT('2026-09-10') } : x));
    const r = m.mod ? await quiet(() => safe(() => m.mod.runLifecycleSignals(makeDb(wPaid), { vendor: V, agentId: AGENT, result: turn('donna_milestone_paid', { lead: 'Sarah', milestone: 'the deposit', received_on: '2026-09-18' }), deps: { markMilestonePaid: async () => ({ ok: true }) } }))) : {};
    mut('M15 · slicing the UTC string back breaks §6.8 (e-44.5, the off-by-one day)', !!r.lines && r.lines[0].includes('10 September'));
  }
  {
    const m = loadMutated('src/lib/vendor/lifecycleHands.js', "if (pick.reason === 'already_paid' && markedThisTurn.has(pick.row.id))", 'if (false)');
    const db = makeDb(payWorld());
    const deps = {
      promoteLead: async () => { const d = db.tables.payment_schedules.find((x) => x.ordinal === 1); d.state = 'paid'; d.paid_at = PAID_AT('2026-09-17'); return { status: 200, body: { ok: true, promoted: { invoice_id: 'inv-1' } } }; },
      markMilestonePaid: async () => ({ ok: true }),
    };
    const both = { tool_calls: [
      { name: 'donna_booking', input: { lead: 'Meera', kind: 'advance_paid', advance_received_on: '2026-09-18' } },
      { name: 'donna_milestone_paid', input: { lead: 'Sarah', milestone: 'the deposit', received_on: '2026-09-18' } },
    ] };
    const r = m.mod ? await quiet(() => safe(() => m.mod.runLifecycleSignals(db, { vendor: V, agentId: AGENT, result: both, deps }))) : {};
    mut('M16 · dropping the absorb rule breaks §12.6 (D3 then D7 on one milestone)', !!r.lines && r.lines.length === 2);
  }
  {
    const m = loadMutated('src/engine/dist/core/tools/recordPrimitives.js', 'if (booked && hasLeadBehind(booked, rid))\n                return { display: V13 };', 'if (false)\n                return { display: V13 };');
    const r = m.mod ? await safe(() => m.mod.executeRecordTool(AGENT, 'donna_money_edit', { binder_id: 'b-sarah', amount_received: 80000 }, FACT)) : {};
    mut('M17 · disarming V13 breaks §12.10', !!r.display && !r.display.startsWith("ERROR: this client's money"));
  }

  console.log(`\n  mutations: ${mPass} bit, ${mFail} did not`);
  pass += mPass; fail += mFail;

  // ── verdict ────────────────────────────────────────────────────────────────
  console.log(`\n══ b84 · ${pass} ok, ${fail} failed ══`);
  if (fails.length) { console.log('\nRED:'); fails.forEach((f) => console.log(`  · ${f}`)); }
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('BENCH ERROR:', e); process.exit(2); });
