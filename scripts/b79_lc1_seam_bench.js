// ══════════════════════════════════════════════════════════════════════════
// b79_lc1_seam_bench — CE-43 · LC-1 · F-43.1(a) · F-43.5(a) · the dream-os half
// (rung b79 allocated by the chair, CE-43 ruling on the LC-1 build relay)
// ══════════════════════════════════════════════════════════════════════════
//
// WHAT IT DRIVES, REAL: src/lib/vendor/bookingEvent.js (the seam), the REAL
// writeEvent / checkOccupancy behind it, the REAL WhatsApp door pass
// calendarSignals.applyCalendarSignals, and the REAL invoice mint
// generateInvoiceForBinder. The only doubles are the network table (the proven
// in-memory double from b0457/b0498, extended by one method, `not`) and, in §4
// alone, the invoices lib's createInvoice, which is captured so the mint's
// arguments can be read without rendering a PDF.
//
// MUTATIONS ARE OF PRODUCTION CODE, NEVER OF THIS FILE: §5 loads each production
// file's source, applies one edit in memory, compiles it under its real path (so
// its relative requires resolve), and requires that the named cell turns RED. No
// production file on disk is written, so a killed run cannot corrupt the tree.
//
// BOTH WAYS: on the base tree (8806acc1) the seam file does not exist and the mint
// passes due_date null, so §1–§4 go RED; on the cured tree every cell is GREEN.
//
// Run it: node scripts/b79_lc1_seam_bench.js
// ══════════════════════════════════════════════════════════════════════════
'use strict';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-dummy-key';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test';
process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'test';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const ROOT = path.resolve(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);

let pass = 0, fail = 0; const fails = [];
// ── CE-45 LCV-15 LSP_1 · LABELLED AMENDMENT: THE RETIRED CELLS OF THIS BENCH, AT SITE ─────────────────────────────
// Each row names a cell by its id and the reason it retires: the cell read code LSP_1 deleted (the WhatsApp chain's tail,
// the switch `vendor.working_chain_enabled`, listenAfterWire, the imperative family, calendarSignals.js, leadPings.js,
// introductionSeat.js). A retired cell is NOT counted as a pass; it prints RETIRED with its reason. CONTROL: at exit every
// row must have matched exactly ONE cell that this run reached, or the bench fails, so the table can never retire a cell
// by accident or outlive the cell it names.
const __RETIRE = new Map([
  [
    "§2.1 ",
    "LSP_1: calendarSignals.applyCalendarSignals, the WhatsApp door's pass, is deleted with the chain (A11); the seam itself is proven by §1 and the web door by §3"
  ],
  [
    "§2.2 ",
    "LSP_1: calendarSignals.applyCalendarSignals, the WhatsApp door's pass, is deleted with the chain (A11); the seam itself is proven by §1 and the web door by §3"
  ],
  [
    "§2.3 ",
    "LSP_1: calendarSignals.applyCalendarSignals, the WhatsApp door's pass, is deleted with the chain (A11); the seam itself is proven by §1 and the web door by §3"
  ],
  [
    "§5 M7 ",
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
const ok = (c, m) => { if (__retired(m)) return; c ? (pass++, console.log('  PASS  ' + m)) : (fail++, fails.push(m), console.log('  FAIL  ' + m)); };
const sec = (t) => console.log('\n── ' + t + ' ──');

function tryRequire(rel) {
  try { return require(P(rel)); } catch (e) { console.log(`  (module ${rel} did not load: ${e.message.split('\n')[0]})`); return null; }
}

// ── the proven double (b0457 / b0498), plus `not` ─────────────────────────
let SEQ = 0;
const uuid = (p = '0') => `${p.repeat(8).slice(0, 8)}-0000-4000-8000-${String(++SEQ).padStart(12, '0')}`;
class Q {
  constructor(db, table) { this.db = db; this.table = table; this.f = []; this.n = null; this.mode = 'select'; }
  select() { return this; }
  eq(c, v)  { this.f.push(r => r[c] === v); return this; }
  neq(c, v) { this.f.push(r => r[c] !== v); return this; }
  is(c, v)  { this.f.push(r => (r[c] === undefined ? null : r[c]) === v); return this; }
  not(c, op, v) { if (op === 'is') this.f.push(r => (r[c] === undefined ? null : r[c]) !== v); return this; }
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
    if (this.mode === 'upsert') { return { data: null, error: null }; }
    return { data: this._rows(), error: null };
  }
  async maybeSingle() { const { data, error } = this.run(); return error ? { data: null, error } : { data: data[0] || null, error: null }; }
  async single()      { const { data, error } = this.run(); return error ? { data: null, error } : { data: data[0] || null, error: data[0] ? null : { code: 'PGRST116' } }; }
  then(res, rej) { try { res(this.run()); } catch (e) { rej(e); } }
}
function makeDb({ vendor = {}, events = [], records = [] } = {}) {
  const db = { t: {
    vendors: [{ id: vendor.id, category: 'photographer', slot_capacity: null, ...vendor }],
    events: events.map(e => ({ state: 'upcoming', deleted_at: null, notes: null, slot: null, event_time: null,
                               ready_by: null, assigned_member_ids: [], linked_binder_id: null, ...e })),
    records: records.map(r => ({ hidden: false, followup_on: null, ...r })),
    team_members: [], crew_confirmations: [], hot_dates: [], vendor_activity_log: [],
  } };
  return { api: { from: (t) => new Q(db, t), schema() { return this; } }, db };
}

const V = uuid('1'), AG = uuid('e');
const VEND = { id: V };
const DHOLAKIA = uuid('d');
const dholakia = (over = {}) => ({ id: DHOLAKIA, agent_id: AG, client: 'Dholakia', date: '2026-09-21', stage: 'confirmed booking', followup_on: '2026-09-19', ...over });
// The production shape: Victor's tool call, Donna's nested hands.
const turn = (...dcs) => ({ reply: 'ok', tool_calls: [{ name: 'dear_donna_talk', input: {}, result: '', donna_calls: dcs }] });
const stageHand = (id, stage = 'confirmed booking') => ({ name: 'donna_stage', input: { stage, binder_id: id }, result: `Updated record ${id} — stage ${stage}.` });
const liveEvents = (db) => db.t.events.filter(e => e.deleted_at == null && e.state !== 'cancelled');

async function driveSeam(be, dbArgs, result) {
  const { api, db } = makeDb(dbArgs);
  const out = await be.ensureBookingEvents(api, VEND, AG, result, { surface: 'pwa' });
  return { out, db };
}

async function seamCells(be, tag) {
  const cells = {};
  // C1 — a booking-stage binder with a date and no link gets exactly one ceremony row, linked, titled.
  {
    const { db } = await driveSeam(be, { vendor: VEND, records: [dholakia()] }, turn(stageHand(DHOLAKIA)));
    const evs = liveEvents(db);
    cells.C1 = evs.length === 1 && evs[0].linked_binder_id === DHOLAKIA && evs[0].event_date === '2026-09-21'
      && evs[0].kind === 'ceremony' && evs[0].title === 'Dholakia · wedding' && evs[0].vendor_id === V && !evs[0].couple_id;
  }
  // C2 — F9(a): any live linked event (even a non-occupying trial) means no second row.
  {
    const { db } = await driveSeam(be, { vendor: VEND, records: [dholakia()],
      events: [{ id: uuid('7'), vendor_id: V, title: 'Dholakia - trial', event_date: '2026-09-02', kind: 'trial', linked_binder_id: DHOLAKIA }] },
      turn(stageHand(DHOLAKIA)));
    cells.C2 = liveEvents(db).length === 1;
  }
  // C3 — a cancelled linked event is not live: the booking row is written.
  {
    const { db } = await driveSeam(be, { vendor: VEND, records: [dholakia()],
      events: [{ id: uuid('7'), vendor_id: V, title: 'Old', event_date: '2026-08-01', kind: 'ceremony', linked_binder_id: DHOLAKIA, state: 'cancelled' }] },
      turn(stageHand(DHOLAKIA)));
    cells.C3 = liveEvents(db).length === 1 && liveEvents(db)[0].title === 'Dholakia · wedding';
  }
  // C4 — the ruled predicate: quoted, unbooked, cancelled, lost write nothing; "Booked" does.
  {
    let none = true;
    for (const st of ['quoted', 'unbooked', 'booking cancelled', 'lost', 'unpaid', 'client call']) {
      const { db } = await driveSeam(be, { vendor: VEND, records: [dholakia({ stage: st })] }, turn(stageHand(DHOLAKIA, st)));
      if (liveEvents(db).length) none = false;
    }
    const { db } = await driveSeam(be, { vendor: VEND, records: [dholakia({ stage: 'Booked' })] }, turn(stageHand(DHOLAKIA, 'Booked')));
    cells.C4 = none && liveEvents(db).length === 1;
  }
  // C5 — no date, hidden, or an errored hand: nothing.
  {
    const a = await driveSeam(be, { vendor: VEND, records: [dholakia({ date: null })] }, turn(stageHand(DHOLAKIA)));
    const b = await driveSeam(be, { vendor: VEND, records: [dholakia({ hidden: true })] }, turn(stageHand(DHOLAKIA)));
    const c = await driveSeam(be, { vendor: VEND, records: [dholakia()] },
      turn({ name: 'donna_stage', input: { stage: 'confirmed', binder_id: DHOLAKIA }, result: 'ERROR updating record: boom' }));
    cells.C5 = !liveEvents(a.db).length && !liveEvents(b.db).length && !liveEvents(c.db).length;
  }
  // C6 — a binder a hand OPENED (no binder_id in input) is found from the result.
  {
    const NEW = uuid('9');
    const { db } = await driveSeam(be, { vendor: VEND, records: [dholakia({ id: NEW, client: 'Mehra', stage: 'booked' })] },
      turn({ name: 'donna_client', input: { client: 'Mehra' }, result: `Record ${NEW} created — client Mehra.` }));
    cells.C6 = liveEvents(db).length === 1 && liveEvents(db)[0].linked_binder_id === NEW;
  }
  // C7 — F8(a): a blocked date is a conflict refusal handed back, nothing written.
  {
    const { out, db } = await driveSeam(be, { vendor: VEND, records: [dholakia()],
      events: [{ id: uuid('b'), vendor_id: V, title: 'Personal time', event_date: '2026-09-21', kind: 'blocked', slot: 'full_day' }] },
      turn(stageHand(DHOLAKIA)));
    cells.C7 = out.refused.length === 1 && !!(out.refused[0].conflict && out.refused[0].conflict.message)
      && liveEvents(db).filter(e => e.kind !== 'blocked').length === 0;
  }
  // C8 — idempotence: the same turn twice leaves one row.
  {
    const { api, db } = makeDb({ vendor: VEND, records: [dholakia()] });
    await be.ensureBookingEvents(api, VEND, AG, turn(stageHand(DHOLAKIA)), {});
    await be.ensureBookingEvents(api, VEND, AG, turn(stageHand(DHOLAKIA)), {});
    cells.C8 = liveEvents(db).length === 1;
  }
  return cells;
}

async function main() {
  const be = tryRequire('src/lib/vendor/bookingEvent.js');
  const cal = tryRequire('src/lib/vendor/calendarSignals.js');

  // §1 — the seam, real writeEvent behind it
  sec('§1 — the seam (bookingEvent.ensureBookingEvents over the real writeEvent)');
  const c = be ? await seamCells(be, 'cured') : {};
  ok(c.C1, '§1.1 booking stage + date + no link → one row: ceremony, linked, "Dholakia · wedding", no couple_id');
  ok(c.C2, '§1.2 F9(a) any live linked event → no second row');
  ok(c.C3, '§1.3 a cancelled linked event is not live → the booking row is written');
  ok(c.C4, '§1.4 predicate: quoted/unbooked/cancelled/lost/unpaid/client call → nothing; "Booked" → one row');
  ok(c.C5, '§1.5 no date, hidden, or an ERROR hand → nothing');
  ok(c.C6, '§1.6 a binder opened this turn (id only in the result) is found');
  ok(c.C7, '§1.7 F8(a) blocked date → conflict refusal returned with its message, nothing written');
  ok(c.C8, '§1.8 idempotent across two identical turns');

  // §2 — the WhatsApp lane, end to end through the real door pass
  sec('§2 — WA door: applyCalendarSignals reaches the seam');
  {
    let wrote = false, spoke = false;
    if (cal) {
      const { api, db } = makeDb({ vendor: VEND, records: [dholakia()] });
      await cal.applyCalendarSignals(api, VEND, AG, turn(stageHand(DHOLAKIA)));
      wrote = liveEvents(db).length === 1 && liveEvents(db)[0].title === 'Dholakia · wedding';
      const blocked = makeDb({ vendor: VEND, records: [dholakia()],
        events: [{ id: uuid('b'), vendor_id: V, title: 'Personal time', event_date: '2026-09-21', kind: 'blocked', slot: 'full_day' }] });
      const r = await cal.applyCalendarSignals(blocked.api, VEND, AG, turn(stageHand(DHOLAKIA)));
      spoke = r.refused.length === 1 && typeof r.suffix === 'string' && r.suffix.includes(r.refused[0].conflict.message);
    }
    ok(wrote, '§2.1 a WA turn that confirms Dholakia writes her calendar row');
    ok(spoke, '§2.2 a refused booking row is spoken in the WA suffix via conflictLines, verbatim');
  }
  // §2b — F5(a) as it exists: the lockstep drags the seam's row on a date move (kind is occupying)
  {
    let dragged = false;
    if (cal && be) {
      const { api, db } = makeDb({ vendor: VEND, records: [dholakia()] });
      await cal.applyCalendarSignals(api, VEND, AG, turn(stageHand(DHOLAKIA)));
      db.t.records[0].date = '2026-09-22';
      await cal.applyCalendarSignals(api, VEND, AG, turn({ name: 'donna_date', input: { date: '2026-09-22', binder_id: DHOLAKIA }, result: `Updated record ${DHOLAKIA} — date 2026-09-22.` }));
      const evs = liveEvents(db);
      dragged = evs.length === 1 && evs[0].event_date === '2026-09-22';
    }
    ok(dragged, '§2.3 moving the date moves the same row; no second row (card step b)');
  }

  // §3 — the web door: both routes call the one home after the lockstep (comment-stripped read)
  sec('§3 — web door wiring (chat.js, comment-stripped)');
  {
    const src = fs.readFileSync(P('src/api/vendor-engine/chat.js'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
    ok(/require\('\.\.\/\.\.\/lib\/vendor\/bookingEvent'\)/.test(src), '§3.1 chat.js requires the one home');
    const seq = src.match(/lockstepBinderToEvent\(req, result\);\s*const seam\w*\s*=\s*await ensureBookingEvents\(req\.app\.locals\.supabase, req\.vendor, req\.agentId, result/g) || [];
    ok(seq.length === 2, `§3.2 both routes call ensureBookingEvents straight after the lockstep (found ${seq.length})`);
    ok((src.match(/refused\.push\(\.\.\.seam\w*\.refused\)/g) || []).length === 2, '§3.3 both routes fold the seam refusals into `refused`');
    ok(!/function\s+ensureBookingEvents/.test(src), '§3.4 no second home of the seam in chat.js');
    // RE-AIMED (CE-45 LCV-15 LSP_1, labelled): calendarSignals.js is DELETED (A11), so it can hold no second home; the
    // cell now pins its absence, and chat.js stays the one home's only caller (3.1 to 3.4).
    ok(!fs.existsSync(P('src/lib/vendor/calendarSignals.js')), '§3.5 no second home of the seam in calendarSignals.js (RE-AIMED, LSP_1: the file is deleted)');
  }

  // §4 — the mint: due_date = the binder's followup_on (F2(a)), captured at createInvoice
  sec('§4 — invoice mint carries due_date');
  {
    // invoices.js destructures createInvoice at load, so it must load AFTER the capture is installed.
    const libPath = require.resolve(P('src/lib/vendor/invoices.js'));
    const lib = require(libPath);
    const orig = lib.createInvoice;
    const seen = [];
    lib.createInvoice = async (_s, _v, params) => { seen.push(params); return { ok: false, error: 'captured' }; };
    let mint = null;
    try {
      delete require.cache[require.resolve(P('src/api/vendor/invoices.js'))];
      mint = tryRequire('src/api/vendor/invoices.js');
      if (mint && mint.generateInvoiceForBinder) {
        const a = makeDb({ vendor: VEND, records: [dholakia()] });
        await mint.generateInvoiceForBinder(a.api, VEND, { id: DHOLAKIA, client: 'Dholakia', phone: null, amount: 50000, amount_received: 0, note: null });
        const b = makeDb({ vendor: VEND, records: [dholakia({ followup_on: null })] });
        await mint.generateInvoiceForBinder(b.api, VEND, { id: DHOLAKIA, client: 'Dholakia', phone: null, amount: 50000, amount_received: 0, note: null });
      }
    } finally { lib.createInvoice = orig; }
    ok(!!(seen[0] && seen[0].due_date === '2026-09-19'), '§4.1 a binder with followup_on 2026-09-19 mints due_date 2026-09-19');
    ok(!!(seen[1] && seen[1].due_date === null && seen[1].amount_total === 50000), '§4.2 no followup_on → due_date null, the mint still proceeds');
  }

  // §5 — mutations of production code (in memory, real paths)
  sec('§5 — mutations of production code');
  const loadMutated = (rel, from, to) => {
    const file = P(rel);
    const srcText = fs.readFileSync(file, 'utf8');
    if (!srcText.includes(from)) return { missing: true };
    try {
      const m = new Module(file, module);
      m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
      m._compile(srcText.replace(from, to), file);
      return { mod: m.exports };
    } catch (e) { console.log(`  (mutated ${rel} did not load: ${e.message.split('\n')[0]})`); return { failed: true }; }
  };
  if (be) {
    const muts = [
      ['M1 kind occupying → meeting', "const BOOKING_EVENT_KIND   = 'ceremony';", "const BOOKING_EVENT_KIND   = 'meeting';", 'C1'],
      ['M2 skip-on-link removed', "if (hasLive.has(b.id)) {", "if (false) {", 'C2'],
      ['M3 negative predicate removed', "&& !NOT_BOOKING_STAGE_RE.test(s)", "", 'C4'],
      ['M4 opened-binder parse removed', "if (created) take(created[1]);", "", 'C6'],
      ['M5 conflict not returned', "out.refused.push({ title, conflict: r.conflict, error: null });", "", 'C7'],
      ['M6 ERROR hands not skipped', "if (r.startsWith('ERROR')) return;", "", 'C5'],
    ];
    for (const [name, from, to, cell] of muts) {
      const { mod, missing } = loadMutated('src/lib/vendor/bookingEvent.js', from, to);
      if (missing) { ok(false, `§5 ${name}: anchor not found`); continue; }
      const cells = await seamCells(mod, name);
      ok(cells[cell] === false, `§5 ${name} → ${cell} RED`);
    }
  } else {
    ok(false, '§5 seam mutations: the seam module does not exist');
  }
  {
    // M7 — the WA call removed: §2.1 must go red.
    const r = { mod: null }; // LSP_1 (labelled): calendarSignals.js is deleted; M7 is retired by this bench's table and never mutates
    let red = false;
    if (r.mod) {
      const { api, db } = makeDb({ vendor: VEND, records: [dholakia()] });
      await r.mod.applyCalendarSignals(api, VEND, AG, turn(stageHand(DHOLAKIA)));
      red = liveEvents(db).length === 0;
    }
    ok(red, '§5 M7 calendarSignals seam call removed → §2.1 RED');
  }
  {
    // M8 — the mint's due date reverted to null: §4.1 must go red.
    const libPath = require.resolve(P('src/lib/vendor/invoices.js'));
    const lib = require(libPath);
    const orig = lib.createInvoice;
    const seen = [];
    lib.createInvoice = async (_s, _v, params) => { seen.push(params); return { ok: false, error: 'captured' }; };
    let red = false;
    try {
      const r = loadMutated('src/api/vendor/invoices.js',
        'due_date:       await binderDueDate(supabase, binder),', 'due_date:       null,');
      if (r.mod) {
        const a = makeDb({ vendor: VEND, records: [dholakia()] });
        await r.mod.generateInvoiceForBinder(a.api, VEND, { id: DHOLAKIA, client: 'Dholakia', phone: null, amount: 50000, amount_received: 0, note: null });
        red = !!seen[0] && seen[0].due_date === null;
      }
    } finally { lib.createInvoice = orig; }
    ok(red, '§5 M8 mint due_date reverted to null → §4.1 RED');
  }

  // §6 — column existence against the witnessed schema docs (R-40.80)
  sec('§6 — columns this bench drives exist in the witnessed docs');
  {
    const pub = fs.readFileSync(P('docs/db/PUBLIC_SCHEMA.md'), 'utf8');
    const eng = fs.readFileSync(P('docs/db/ENGINE_SCHEMA.md'), 'utf8');
    const section = (doc, head) => { const i = doc.indexOf(head); if (i < 0) return ''; const j = doc.indexOf('\n## ', i + head.length); return doc.slice(i, j < 0 ? undefined : j); };
    const has = (sec, col) => new RegExp(`^\\d+\\. ${col} `, 'm').test(sec);
    const ev = section(pub, '## public.events ');
    const inv = section(pub, '## public.invoices ');
    const rec = section(eng, '## engine.records ');
    ok(['vendor_id', 'title', 'event_date', 'kind', 'state', 'linked_binder_id', 'deleted_at', 'couple_id'].every(c => has(ev, c)), '§6.1 public.events columns witnessed');
    ok(['vendor_id', 'binder_id', 'due_date', 'invoice_number', 'amount_paid', 'state', 'deleted_at'].every(c => has(inv, c)), '§6.2 public.invoices columns witnessed');
    ok(['id', 'agent_id', 'client', 'date', 'stage', 'hidden', 'followup_on'].every(c => has(rec, c)), '§6.3 engine.records columns witnessed');
    ok(/events_owner_xor\s*\n\s*CHECK \(\(\(vendor_id IS NULL\) <> \(couple_id IS NULL\)\)\)/.test(pub), '§6.4 events_owner_xor witnessed (F-43.19: no couple_id on a vendor row)');
    ok(/\[CHECK\] events_kind_check[\s\S]{0,200}'ceremony'::text/.test(pub), "§6.5 'ceremony' is a kind the CHECK accepts");
  }

  console.log(`\n════════  ${pass} passed, ${fail} failed  ════════\n`);
  if (fail) { console.log('RED. Failing checks:'); fails.forEach(f => console.log('   ·', f)); process.exit(1); }
}

main().catch((e) => { console.error('BENCH ERROR', e); process.exit(2); });
