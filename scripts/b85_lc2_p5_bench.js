#!/usr/bin/env node
'use strict';
// scripts/b85_lc2_p5_bench.js — TDW CE-44 · LC-2 · PACKET 5 (dream-os).
// The attach route's five per-couple fields, F-44.31's already_booked refusal, the promote
// route's unknown-key filter, F-44.29's measured schedule row, and F-43.26's merge hand.
// Rung b85, chair-allocated. Runnable from any directory. Exit 0 green, 1 red, 2 bench error.
//
//   §1  F-44.6: EDITABLE and the overlay carry the five; a couple's shares reach lp.schedule.
//   §2  F-44.31: a booked lead's re-attach is refused, writes nothing, and carries a token.
//   §3  (b): the promote route refuses an unknown key, 422 invalid, the field named.
//   §4  F-44.29: the schedule row advances by the label's measured height; no line overruns.
//   §5  F-43.26: donna_merge reaches both collectors on survivor_id; donna_split reaches neither.
//   §6  column existence against docs/db/PUBLIC_SCHEMA.md (R-40.80, C-44.4).
//   §7  mutations of production code, each turning its named cell RED.
//
// NOT PROVEN HERE (declared): the real database, and a rendered page on glass. The double
// models the reads and writes these routes lean on and returns a timestamptz the way Postgres
// returns it (C-44.3); the founder's walk and his SELECTs are the database witness, and the
// PDF is judged by opening it.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-dummy-key';
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
    "§5.1 ",
    "LSP_1: calendarSignals.js is deleted (A11); chat.js's collector (5.2, 5.3, 5.4) is the one surviving home"
  ],
  [
    "§5.5 ",
    "hollow green: it asserts no isErr in calendarSignals.js, which is now the empty string"
  ],
  [
    "§5.6 ",
    "LSP_1: calendarSignals.js is deleted (A11); chat.js's collector (5.2, 5.3, 5.4) is the one surviving home"
  ],
  [
    "§5.7 ",
    "LSP_1: calendarSignals.js is deleted (A11); chat.js's collector (5.2, 5.3, 5.4) is the one surviving home"
  ],
  [
    "§5.8 ",
    "hollow green: with calendarSignals.js deleted the lockstep is undefined, so no call is recorded and the cell passes over nothing"
  ],
  [
    "§5.9 ",
    "hollow green: with calendarSignals.js deleted the lockstep is undefined, so no call is recorded and the cell passes over nothing"
  ],
  [
    "M6 ",
    "LSP_1: its mutation targets calendarSignals.js, deleted"
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

// ── the double · C-44.3: a timestamptz comes back in UTC with its offset ─────
const STAMP = '2026-09-18 07:30:00+00';
function makeDb(seed = {}, opts = {}) {
  const tables = {};
  for (const [k, v] of Object.entries(seed)) tables[k] = v.map((r) => ({ ...r }));
  let nextId = 1;
  const calls = [];
  function from(table) {
    const st = { op: 'select', filters: [], rows: null, patch: null, single: false, maybe: false, returning: false, cols: null };
    const b = {
      select(cols) { if (st.op !== 'select') st.returning = true; else if (typeof cols === 'string' && cols.trim() && cols.trim() !== '*') st.cols = cols.split(',').map((c) => c.trim()); return b; },
      eq(c, v) { st.filters.push((r) => r[c] === v); return b; },
      neq(c, v) { st.filters.push((r) => r[c] !== v); return b; },
      is(c, v) { st.filters.push((r) => (v === null ? r[c] == null : r[c] === v)); return b; },
      not(c, o, v) { if (o === 'is' && v === null) st.filters.push((r) => r[c] != null); return b; },
      in(c, vs) { st.filters.push((r) => vs.includes(r[c])); return b; },
      order() { return b; }, limit() { return b; },
      insert(rows) { st.op = 'insert'; st.rows = Array.isArray(rows) ? rows : [rows]; return b; },
      update(patch) { st.op = 'update'; st.patch = patch; return b; },
      single() { st.single = true; return b; },
      maybeSingle() { st.maybe = true; return b; },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    };
    const proj = (r) => { if (!st.cols) return { ...r }; const o = {}; for (const c of st.cols) o[c] = r[c]; return o; };
    function shape(rows) {
      if (st.single) return rows.length === 1 ? { data: proj(rows[0]), error: null } : { data: null, error: { message: 'not one row' } };
      if (st.maybe) return { data: rows[0] ? proj(rows[0]) : null, error: null };
      return { data: rows.map(proj), error: null };
    }
    function run() {
      const call = { table, op: st.op, patch: st.patch, rows: st.rows };
      calls.push(call);
      const t = tables[table] || (tables[table] = []);
      const hook = opts.fail && opts.fail(call);
      if (hook) return { data: null, error: hook };
      if (st.op === 'insert') {
        const made = st.rows.map((r) => ({ id: `${table}-${nextId++}`, created_at: STAMP, updated_at: STAMP, deleted_at: null, ...r }));
        t.push(...made); return st.returning ? shape(made) : { data: null, error: null };
      }
      const rows = t.filter((r) => st.filters.every((f) => f(r)));
      if (st.op === 'update') { rows.forEach((r) => Object.assign(r, st.patch)); return st.returning ? shape(rows) : { data: null, error: null }; }
      return shape(rows);
    }
    return b;
  }
  return { from, tables, calls, schema: (s) => ({ from: (t) => from(s === 'engine' ? `engine.${t}` : t) }) };
}

const V = { id: 'v-dev440', user_id: 'u-dev' };
const PKG = {
  id: 'pk-2', vendor_id: V.id, name: 'Photographs and film', description: 'd',
  line_items: [{ label: 'Coverage', detail: 'Full day' }], total: 80000,
  deposit_pct: 30, middle_pct: 30, middle_enabled: true,
  delivery_basis: 'days', delivery_days: 45, seeded_from: 'photography:2', deleted_at: null,
};
const LEAD = (over = {}) => ({
  id: 'l-sarah', vendor_id: V.id, name: 'Sarah', wedding_date: '2027-02-22',
  wedding_date_precision: 'day', state: 'quoted', binder_id: null, deleted_at: null, ...over,
});
const world = (leadOver = {}) => ({ leads: [LEAD(leadOver)], vendor_packages: [{ ...PKG }], lead_packages: [] });

(async () => {
  const LP = tryRequire('src/api/vendor/leadPackages.js');
  const attach = LP && LP.attachPackage;

  // ══ §1 · F-44.6 · the five per-couple fields ═══════════════════════════════
  sec('§1 · F-44.6 — the attach route takes the five, for this couple only');
  ok(typeof attach === 'function', '§1.0 attachPackage is exported and callable');

  {
    const db = makeDb(world());
    const r = await safe(() => attach(db, V, 'l-sarah', {
      package_id: 'pk-2', deposit_pct: 50, middle_enabled: false, delivery_basis: 'on_the_day',
    }));
    ok(r.status === 200, '§1.1 a re-shaped schedule is accepted, not refused as an unknown key');
    const lp = db.tables.lead_packages && db.tables.lead_packages[0];
    ok(!!lp && lp.snapshot.deposit_pct === 50, '§1.2 the couple\'s own deposit share reaches the snapshot');
    ok(!!lp && lp.snapshot.middle_enabled === false, '§1.3 and the middle toggle');
    ok(!!lp && lp.snapshot.delivery_basis === 'on_the_day', '§1.4 and the delivery basis');
    ok(!!lp && Array.isArray(lp.schedule) && lp.schedule.length === 2,
      '§1.5 computeSchedule rebuilds lp.schedule from the couple\'s shares — two parts, the middle off');
    ok(!!lp && Number(lp.schedule[0].amount) === 40000,
      '§1.6 and the deposit is 50% of the fee, the couple\'s share and not the package\'s');
    ok(db.tables.vendor_packages[0].deposit_pct === 30,
      '§1.7 THE VENDOR\'S OWN PACKAGE IS UNTOUCHED — per couple means per couple');
  }
  {
    const db = makeDb(world());
    const r = await safe(() => attach(db, V, 'l-sarah', { package_id: 'pk-2', deposit_pct: 70, middle_pct: 40 }));
    ok(r.status === 422 && r.body.field === 'remainder',
      '§1.8 validatePackage is still the one home: shares reaching 100 are refused on the copy too');
  }
  {
    const src = readIf('src/api/vendor/leadPackages.js');
    ok(/const EDITABLE = \[[^\]]*'deposit_pct', 'middle_pct', 'middle_enabled', 'delivery_basis', 'delivery_days'\]/s.test(src),
      '§1.9 the accept-list carries the five');
    ok(/const OVERLAY_KEYS = \[[^\]]*'delivery_days'\]/s.test(src) && !/OVERLAY_KEYS[^\n]*delivery_on/.test(src),
      '§1.10 the overlay carries them too, and NOT delivery_on, which is not a package column');
    ok(!/router\.(patch|put)\(/.test(src), '§1.11 there is still no PATCH route: Change package is a re-attach, one door');
  }

  // ══ §2 · F-44.31 ═══════════════════════════════════════════════════════════
  sec('§2 · F-44.31 — a booked couple\'s package is fixed on their invoice');
  {
    const db = makeDb(world({ state: 'booked', binder_id: 'b-sarah' }));
    const r = await safe(() => attach(db, V, 'l-sarah', { package_id: 'pk-2', total: 90000 }));
    ok(r.status === 422 && r.body.error === 'refused' && r.body.code === 'already_booked',
      '§2.1 a re-attach on a booked lead is refused with the token already_booked');
    ok(!/[A-Za-z]{4,}\s+[A-Za-z]{4,}/.test(String(r.body.code || '')) && !r.body.message && !r.body.sentence,
      '§2.2 the refusal carries a code and NO prose (F-43.86 (b1)) — the PWA owns the line');
    ok(!db.calls.some((c) => c.table === 'lead_packages' && (c.op === 'insert' || c.op === 'update')),
      '§2.3 and it writes nothing: no soft-delete, no insert');
    ok(!db.calls.some((c) => c.table === 'vendor_packages'),
      '§2.4 raised BEFORE the package is read — no wasted query');
  }
  {
    // THE TEST IS PROMOTION, NOT PAYMENT. A lead booked with no advance is locked too.
    const db = makeDb(world({ state: 'booked', binder_id: null }));
    const r = await safe(() => attach(db, V, 'l-sarah', { package_id: 'pk-2', total: 90000 }));
    ok(r.status === 422 && r.body.code === 'already_booked',
      '§2.5 booked with NO advance and no binder is refused too — invoices.js:341\'s gap is not repeated');
  }
  {
    const db = makeDb(world({ state: 'quoted', binder_id: null }));
    const r = await safe(() => attach(db, V, 'l-sarah', { package_id: 'pk-2', deposit_pct: 40 }));
    ok(r.status === 200 && db.tables.lead_packages.length === 1,
      '§2.6 an UNBOOKED lead\'s re-attach still works, with all nine keys');
  }

  // ══ §3 · the promote route's unknown-key filter ════════════════════════════
  sec('§3 · the promote route refuses an unknown key');
  {
    const src = readIf('src/api/vendor/leadPackages.js');
    ok(/const PROMOTE_KEYS = \['kind', 'advance_received_on'\];/.test(src), '§3.1 the promote route declares its keys');
    ok(/const unknown = Object\.keys\(body\)\.filter\(\(k\) => !PROMOTE_KEYS\.includes\(k\)\);/.test(src),
      '§3.2 and filters on them');
    ok(/error: 'invalid', field: unknown\[0\]/.test(src),
      '§3.3 with the refusal its own contract documents — 422 invalid, the field named, no new byte');
    ok((src.match(/field: unknown\[0\]/g) || []).length === 2,
      '§3.4 both routes now speak the same refusal for an unknown key');
  }

  // ══ §4 · F-44.29 ═══════════════════════════════════════════════════════════
  sec('§4 · F-44.29 — the schedule row advances by the label\'s measured height');
  const LONG = 'The remainder, on delivery, before the work is handed over';
  const MID = '30% one month before the first function (optional)';
  const THREE = 'A deliberately long synthetic milestone label written to wrap onto a third rendered line so the cure is proven a measurement';
  {
    const src = readIf('src/lib/invoicePdf.js');
    ok(/doc\.heightOfString\(label, \{ width: cellWidth\(LABEL_COL\) \}\)/.test(src),
      '§4.1 the row height is MEASURED from the label at the column\'s own width');
    ok(/const rowH = Math\.max\(ROW_MIN_H, Math\.ceil\(labelH\)\);/.test(src),
      '§4.2 and the row takes the taller of that and the table\'s own 14pt');
    ok(/y \+= rowH;/.test(src) && !/y \+= 14;\n\s*rule\(y\);/.test(src),
      '§4.3 the flat advance is gone');
  }
  {
    // Driven through the real renderer: the placements are read out of the PDF itself.
    const { generateInvoicePdf } = tryRequire('src/lib/invoicePdf.js') || {};
    const rows = [
      { milestone_label: 'Deposit, 30% of the fee, on booking', pct: 30, amount_due: 24000, due_date: '2026-09-18', state: 'paid' },
      { milestone_label: MID, pct: 30, amount_due: 24000, due_date: '2027-01-22', state: 'paid' },
      { milestone_label: LONG, pct: 40, amount_due: 32000, due_date: '2027-04-08', state: 'paid' },
      { milestone_label: THREE, pct: 0, amount_due: 1, due_date: '2027-05-01', state: 'pending' },
    ];
    const placements = async (schedule) => {
      if (!generateInvoicePdf) return [];
      const buf = await generateInvoicePdf({
        invoice: { id: 'i', invoice_number: 'TDW/DEV440/17', client_name: 'Swati Test', amount_total: 80000, amount_paid: 80000, has_schedule: true, state: 'paid', created_at: '2026-09-18' },
        vendor: { business_name: 'Dev Roy Photography' }, vendorName: 'Dev Roy', schedule, seal: null,
      });
      const zlib = require('zlib');
      let txt = '';
      const re = /stream\r?\n([\s\S]*?)endstream/g;
      let m;
      while ((m = re.exec(buf.toString('latin1'))) !== null) {
        try { txt += zlib.inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1'); } catch (_e) { /* not a deflate stream */ }
      }
      const out = [];
      const tm = /1 0 0 1 ([\d.]+) ([\d.]+) Tm/g;
      let t;
      while ((t = tm.exec(txt)) !== null) out.push({ x: Number(t[1]), y: Number(t[2]) });
      return out;
    };
    const ys = await safe(() => placements(rows));
    const list = Array.isArray(ys) ? ys : [];
    ok(list.length > 20, '§4.4 the document renders and its text placements are readable');
    // THE LABEL COLUMN IS READ ON ITS OWN x. Elsewhere on the page two texts sit at
    // almost the same y because they are side by side in different columns, and a
    // y-only test cannot tell that from an overlap. The milestone label is the only
    // cell drawn at the table's left edge, so its own lines are what is measured.
    const PDFDoc = (() => { try { return require(P('node_modules/pdfkit')); } catch (_e) { return null; } })();
    let found = 0, detail = '';
    if (PDFDoc && list.length) {
      const d = new PDFDoc({ size: 'A4', margins: { top: 50, bottom: 50, left: 60, right: 60 } });
      d.fontSize(9).font('Helvetica');
      const w = (d.page.width - 120) * 0.32 - 6;
      const LINE = 10.4;
      const wanted = rows.map((r) => {
        const h = d.heightOfString(r.milestone_label, { width: w });
        return { lines: Math.max(1, Math.round(h / LINE)), rowH: Math.max(14, Math.ceil(h)) };
      });
      const want = wanted.reduce((n, r) => n + r.lines, 0);
      const leftX = Math.min(...list.map((pl) => pl.x));
      const col = [...new Set(list.filter((pl) => Math.abs(pl.x - leftX) < 0.5).map((pl) => Math.round(pl.y * 10) / 10))]
        .sort((a, b) => b - a);
      // THE BLOCK IS FOUND BY ITS SHAPE, NOT BY ITS POSITION. The PAYMENT block draws
      // at the same left edge, so "the last N placements" picks up its lines too. The
      // schedule is the one run whose internal geometry matches the measurement: each
      // row's own lines exactly one LINE apart, and each row's first line exactly
      // rowH + 8 above the next row's first, which is the table's own rule gap.
      const matches = (at) => {
        let i = at;
        for (let r = 0; r < wanted.length; r += 1) {
          const first = col[i];
          for (let l = 1; l < wanted[r].lines; l += 1) {
            if (Math.abs((col[i + l - 1] - col[i + l]) - LINE) > 0.6) return false;
          }
          i += wanted[r].lines;
          if (r < wanted.length - 1) {
            if (col[i] === undefined) return false;
            if (Math.abs((first - col[i]) - (wanted[r].rowH + 8)) > 0.6) return false;
            if (col[i] > first - LINE * wanted[r].lines) return false; // the overlap itself
          }
        }
        return true;
      };
      for (let at = 0; at + want <= col.length; at += 1) if (matches(at)) found += 1;
      detail = `${want} label lines expected, ${col.length} placements in the column, ${found} run(s) matched`;
    }
    ok(found === 1, `§4.5 the schedule's label lines are found exactly where the MEASUREMENT puts them (${detail})`);
    ok(found >= 1, '§4.6 and each row clears the one before it, so no line lands on another');
  }
  {
    // The measurement itself, independent of the render: a one-line label keeps 14pt.
    const PDFDocument = (() => { try { return require(P('node_modules/pdfkit')); } catch (_e) { return null; } })();
    if (PDFDocument) {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 60, right: 60 } });
      doc.fontSize(9).font('Helvetica');
      const w = (doc.page.width - 120) * 0.32 - 6;
      const h1 = doc.heightOfString('Deposit, 30% of the fee, on booking', { width: w });
      const h2 = doc.heightOfString(MID, { width: w });
      const h3 = doc.heightOfString(THREE, { width: w });
      ok(Math.ceil(h1) <= 14, '§4.7 a one-line label needs no more than the table\'s own 14pt — that row is unchanged');
      ok(Math.ceil(h2) > 14, '§4.8 the middle label wraps and needs more, which is what overran the row beneath');
      ok(Math.ceil(h3) > Math.ceil(h2), '§4.9 the synthetic label needs more still — the cure is a measurement, not a fit to two strings');
    } else { ok(false, '§4.7 pdfkit is loadable for the independent measurement'); }
  }

  // ══ §5 · F-43.26 ═══════════════════════════════════════════════════════════
  sec('§5 · F-43.26 — the merge hand reaches both collectors; the split half is struck');
  {
    const cs = readIf('src/lib/vendor/calendarSignals.js');
    const ch = readIf('src/api/vendor-engine/chat.js');
    const mergeIn = (s) => /call\.name === 'donna_merge' && call\.input\.survivor_id[\s\S]{0,200}moves\.set\(String\(call\.input\.survivor_id\)/.test(s);
    ok(mergeIn(cs), '§5.1 calendarSignals\' collector admits donna_merge, keyed on survivor_id');
    ok(mergeIn(ch), '§5.2 chat.js\'s collector does too');
    // Comments are stripped first: this file's own comment EXPLAINS why the split half
    // is struck, and a cell that greps raw text would convict the explanation.
    const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
    const collectorOf = (src, marker) => { const i = src.indexOf(marker); return i < 0 ? '' : code(src.slice(i, i + 1800)); };
    // SPLIT (CE-45 LCV-15 LSP_1, labelled): calendarSignals.js is DELETED (A11), so its half would read '' and pass
    // vacuously; only chat.js's collector is asserted.
    ok(!/donna_split/.test(collectorOf(ch, 'const moves = new Map(); // binder_id')),
      '§5.3 NEITHER COLLECTOR names donna_split in its own code (SPLIT, LSP_1: chat.js; the calendarSignals twin is deleted)');
    ok(/if \(isErr\(call\.result\)\) return;/.test(ch),
      '§5.4 chat.js guards the merge with isErr, as it guards its other two hands');
    ok(!/isErr/.test(cs),
      '§5.5 and calendarSignals gains no guard it never had — a sibling is not widened while curing a finding');
  }
  {
    // The collector's behaviour, driven through the REAL exported function with a
    // double, never a re-implementation of it.
    const CS = tryRequire('src/lib/vendor/calendarSignals.js');
    const lockstep = CS && CS.lockstepBinderToEvent;
    const drive = async (call) => {
      const db = makeDb({ events: [{ id: 'ev-1', vendor_id: V.id, linked_binder_id: 'b-1', event_date: '2026-12-01', deleted_at: null, state: 'upcoming' }] });
      await quiet(() => safe(() => lockstep(db, V, { tool_calls: [call] })));
      // The move itself goes through `writeEvent`, the one writer home. What this
      // double witnesses is that the collector REACHED the binder at all: the
      // lockstep queries `events` for it only when a move was collected.
      return db.calls.filter((c) => c.table === 'events' && c.op === 'select');
    };
    ok(typeof lockstep === 'function', '§5.6 lockstepBinderToEvent is exported and drivable');
    const moved = await drive({ name: 'donna_merge', input: { survivor_id: 'b-1', date: '2027-03-14' } });
    ok(moved.length > 0, '§5.7 a merge naming a new date reaches the survivor\'s linked event');
    const nodate = await drive({ name: 'donna_merge', input: { survivor_id: 'b-1' } });
    ok(nodate.length === 0, '§5.8 a merge naming no date moves nothing');
    const split = await drive({ name: 'donna_split', input: { source_id: 'b-1', date: '2027-03-14' } });
    ok(split.length === 0, '§5.9 donna_split moves nothing — the struck half, pinned so no seat goes looking');
  }

  // ══ §6 · columns ═══════════════════════════════════════════════════════════
  sec('§6 · column existence against docs/db/PUBLIC_SCHEMA.md (R-40.80, C-44.4)');
  {
    const schema = readIf('docs/db/PUBLIC_SCHEMA.md');
    const block = (t) => { const i = schema.indexOf(`## public.${t}`); if (i < 0) return ''; return schema.slice(i, schema.indexOf('```', schema.indexOf('```', i) + 3)); };
    const leads = block('leads'), vp = block('vendor_packages'), lp = block('lead_packages');
    ok(/\bstate text\b/.test(leads) && /binder_id uuid/.test(leads),
      '§6.1 public.leads carries state and binder_id — F-44.31\'s new read is witnessed');
    ok(/deposit_pct/.test(vp) && /middle_pct/.test(vp) && /middle_enabled/.test(vp) && /delivery_basis/.test(vp) && /delivery_days/.test(vp),
      '§6.2 public.vendor_packages carries the five the overlay now reads');
    ok(/snapshot jsonb/.test(lp) && /schedule/.test(lp), '§6.3 public.lead_packages carries snapshot and schedule');
  }

  // ══ §7 · mutations ═════════════════════════════════════════════════════════
  sec('§7 · mutations of production code — each must turn its named cell RED');
  let mPass = 0, mFail = 0;
  const mut = (n, c) => { if (__retired(n)) return; if (c) { mPass++; console.log(`  ok   ${n}`); } else { mFail++; fails.push(n); console.log(`  FAIL ${n}`); } };

  {
    const m = loadMutated('src/api/vendor/leadPackages.js',
      "  if (String(lead.state || '').trim().toLowerCase() === 'booked' || lead.binder_id) {",
      '  if (false) {');
    const db = makeDb(world({ state: 'booked', binder_id: 'b-sarah' }));
    const r = m.mod ? await quiet(() => safe(() => m.mod.attachPackage(db, V, 'l-sarah', { package_id: 'pk-2', total: 90000 }))) : {};
    mut('M1 · removing the state test breaks §2.1 (a booked lead\'s re-attach lands)', r.status === 200);
  }
  {
    const m = loadMutated('src/api/vendor/leadPackages.js', "'deposit_pct', 'middle_pct', 'middle_enabled', 'delivery_basis', 'delivery_days'];\n// The overlay's own keys", "];\n// The overlay's own keys");
    const db = makeDb(world());
    const r = m.mod ? await quiet(() => safe(() => m.mod.attachPackage(db, V, 'l-sarah', { package_id: 'pk-2', deposit_pct: 50 }))) : {};
    mut('M2 · narrowing the accept-list breaks §1.1 (the five are refused as unknown)', r.status === 422 && r.body.field === 'deposit_pct');
  }
  {
    const m = loadMutated('src/api/vendor/leadPackages.js', 'for (const k of OVERLAY_KEYS) {', "for (const k of ['name', 'description', 'line_items', 'total']) {");
    const db = makeDb(world());
    const r = m.mod ? await quiet(() => safe(() => m.mod.attachPackage(db, V, 'l-sarah', { package_id: 'pk-2', deposit_pct: 50 }))) : {};
    const lp = db.tables.lead_packages && db.tables.lead_packages[0];
    mut('M3 · narrowing the overlay breaks §1.2 (accepted and then ignored, the silent shape)', r.status === 200 && !!lp && lp.snapshot.deposit_pct === 30);
  }
  {
    const m = loadMutated('src/api/vendor/leadPackages.js', 'const unknown = Object.keys(body).filter((k) => !PROMOTE_KEYS.includes(k));', 'const unknown = [];');
    const src = m.mod ? readIf('src/api/vendor/leadPackages.js') : '';
    mut('M4 · emptying the promote filter breaks §3.2', !!m.mod && !/const unknown = \[\];/.test(src));
  }
  {
    const m = loadMutated('src/lib/invoicePdf.js', 'y += rowH;', 'y += 14;');
    let overlap = false;
    if (m.mod && m.mod.generateInvoicePdf) {
      const buf = await quiet(() => safe(() => m.mod.generateInvoicePdf({
        invoice: { id: 'i', invoice_number: 'TDW/DEV440/17', client_name: 'S', amount_total: 80000, amount_paid: 80000, has_schedule: true, state: 'paid', created_at: '2026-09-18' },
        vendor: { business_name: 'D' }, vendorName: 'D', seal: null,
        schedule: [
          { milestone_label: MID, pct: 30, amount_due: 24000, due_date: '2027-01-22', state: 'paid' },
          { milestone_label: LONG, pct: 40, amount_due: 32000, due_date: '2027-04-08', state: 'paid' },
        ],
      })));
      if (buf && buf.length) {
        const zlib = require('zlib');
        let txt = '';
        const re = /stream\r?\n([\s\S]*?)endstream/g;
        let mm;
        while ((mm = re.exec(buf.toString('latin1'))) !== null) {
          try { txt += zlib.inflateSync(Buffer.from(mm[1], 'latin1')).toString('latin1'); } catch (_e) { /* skip */ }
        }
        const ys = [];
        const tm = /1 0 0 1 [\d.]+ ([\d.]+) Tm/g;
        let t;
        while ((t = tm.exec(txt)) !== null) ys.push(Number(t[1]));
        const desc = [...new Set(ys.map((y) => Math.round(y * 10) / 10))].sort((a, b) => b - a);
        overlap = desc.slice(0, -1).some((y, i) => (y - desc[i + 1]) < 10);
      }
    }
    mut('M5 · restoring the flat 14pt advance breaks §4.5 (the lines overlap again)', overlap);
  }
  {
    const m = loadMutated('src/lib/vendor/calendarSignals.js', "call.name === 'donna_merge' && call.input.survivor_id", 'false && call.input.survivor_id');
    const src = m.mod ? fs.readFileSync(P('src/lib/vendor/calendarSignals.js'), 'utf8') : '';
    mut('M6 · dropping donna_merge from calendarSignals breaks §5.1', !!m.mod && /call\.name === 'donna_merge'/.test(src));
  }
  {
    const m = loadMutated('src/api/vendor-engine/chat.js', "call.name === 'donna_merge' && call.input.survivor_id", 'false && call.input.survivor_id');
    const src = m.mod ? fs.readFileSync(P('src/api/vendor-engine/chat.js'), 'utf8') : '';
    mut('M7 · dropping donna_merge from chat.js breaks §5.2', !!m.mod && /call\.name === 'donna_merge'/.test(src));
  }

  console.log(`\n  mutations: ${mPass} bit, ${mFail} did not`);
  pass += mPass; fail += mFail;

  console.log(`\n══ b85 · ${pass} ok, ${fail} failed ══`);
  if (fails.length) { console.log('\nRED:'); fails.forEach((f) => console.log(`  · ${f}`)); }
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('BENCH ERROR:', e); process.exit(2); });
