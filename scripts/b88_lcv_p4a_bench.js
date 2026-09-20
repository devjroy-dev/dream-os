'use strict';
// scripts/b88_lcv_p4a_bench.js · TDW CE-44 · LCV-1 · LC-Victor P4a, THE STRUCTURED RESULT OF A HAND. Rung b88.
//
// WHAT IT HOLDS (the chair's conditions on P4a, each a cell):
//  §1 handResult.js: every hand's code set is CLOSED; every line_key a hand may name is a key of
//     lifecycleHands' LINES today (P4 mints nothing) or null; make() never throws; validate() refuses
//     a key that names no byte, an unknown code, a spoken date, a zero amount.
//  §2 lifecycleHands: per scenario, the lines spoken are the lines' one home (the live LINES)
//     rendered with that scenario's own facts (C-44.7 (c)), and one valid result rides beside each
//     signal with the expected code and line_key.
//  §3 invoices: buildInvoicesWithResults returns one result per binder asked for; buildInvoices'
//     documents are what they were.
//  §4 F-44.30: the chip and the stored line name the door's own number (TDW/DEV440/17's shape), never
//     "Invoice"; no undo is claimed on a binder id. The WhatsApp invoice sentence is unchanged.
//  §5 W-1 NONE and the spine untouched, read from P4a's OWN manifest (C-44.7 (b)); b83, b84, b85 green.
//  §6 mutations, each reddening the cell that guards it.
// THE EXIT CODE IS THE VERDICT.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const { execSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BASE = '704950243522c4b788ad8d6bc898be3d21e1e245';
const P = (rel) => path.join(ROOT, rel);
let pass = 0; let fail = 0; const failed = [];
function T(name, cond) { if (cond) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}`); } }
const sec = (t) => console.log(`\n§${t}`);
const quietSync = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };
const quiet = async (fn) => { const w = console.warn; const e = console.error; console.warn = () => {}; console.error = () => {}; try { return await fn(); } finally { console.warn = w; console.error = e; } };

// C-44.7: a read of 7049502 is fixed history (class a). If the commit is absent it is NAMED and the cells
// that read it fail; there is no fallback to HEAD (C-44.4).
const base = BASE;
let baseMissing = false;
try { execSync(`git cat-file -e ${BASE}^{commit}`, { cwd: ROOT, stdio: 'ignore' }); } catch (_e) { baseMissing = true; }
function compile(rel, code) {
  const file = P(rel);
  const m = new Module(file, null);
  m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
  m._compile(code, file);
  return m.exports;
}
const atBase = (rel) => (baseMissing ? null : compile(rel, execSync(`git show ${base}:${rel}`, { cwd: ROOT }).toString()));
const mutatedMany = (rel, pairs) => {
  let code = fs.readFileSync(P(rel), 'utf8');
  for (const [from, to] of pairs) { if (!code.includes(from)) throw new Error(`mutation anchor missing in ${rel}: ${from.slice(0, 70)}`); code = code.replace(from, to); }
  return compile(rel, code);
};
const mutated = (rel, from, to) => {
  const code = fs.readFileSync(P(rel), 'utf8');
  if (!code.includes(from)) throw new Error(`mutation anchor missing in ${rel}: ${from.slice(0, 70)}`);
  return compile(rel, code.replace(from, to));
};

// ── a small in-memory database: leads, invoices, payment_schedules ─────────────────────────────
function makeDb(world, errs = {}) {
  const tables = JSON.parse(JSON.stringify(world));
  const from = (name) => {
    const f = [];
    const run = () => (errs[name] ? { data: null, error: { message: errs[name] } } : { data: (tables[name] || []).filter((r) => f.every((fn) => fn(r))), error: null });
    const b = {
      select() { return b; }, order() { return b; }, not() { return b; },
      eq(k, v) { f.push((r) => r[k] === v); return b; },
      is(k, v) { f.push((r) => (r[k] === undefined ? null : r[k]) === v); return b; },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
      maybeSingle() { const r = run(); return Promise.resolve({ data: r.data ? r.data[0] || null : null, error: r.error }); },
    };
    return b;
  };
  return { tables, from };
}
const V = { id: 'v-1' }; const AGENT = 'agent-1';
const PAID_AT = (d) => `${d}T18:30:00+00:00`; // midnight IST
function payWorld(opts = {}) {
  const inv = 'inv-1';
  return {
    leads: [{ id: 'lead-1', vendor_id: V.id, name: 'Meera', state: opts.leadState || 'booked', binder_id: 'b-1', deleted_at: null }]
      .concat(opts.twin ? [{ id: 'lead-2', vendor_id: V.id, name: 'Meera', state: 'booked', binder_id: 'b-2', deleted_at: null }] : []),
    invoices: opts.noInvoice ? [] : [{ id: inv, lead_id: 'lead-1', vendor_id: V.id, invoice_number: 'TDW/DEV440/17', state: 'issued', deleted_at: null }],
    payment_schedules: [
      { id: 'ms-1', invoice_id: inv, vendor_id: V.id, ordinal: 1, milestone_label: 'Deposit, 30% of the fee, on booking', amount_due: 24000, due_date: '2026-09-18', state: opts.depositPaid ? 'paid' : 'pending', paid_at: opts.depositPaid ? (opts.badPaidAt ? 'not-a-date' : PAID_AT('2026-09-17')) : null },
      { id: 'ms-2', invoice_id: inv, vendor_id: V.id, ordinal: 2, milestone_label: '30% one month before the first function', amount_due: 24000, due_date: '2026-11-05', state: opts.allPaid ? 'paid' : 'pending', paid_at: opts.allPaid ? PAID_AT('2026-09-01') : null },
      { id: 'ms-3', invoice_id: inv, vendor_id: V.id, ordinal: 3, milestone_label: 'The remainder, on delivery', amount_due: 32000, due_date: opts.lastNoDue ? null : '2026-12-20', state: opts.allPaid ? 'paid' : 'pending', paid_at: opts.allPaid ? PAID_AT('2026-09-02') : null },
    ],
  };
}
const turn = (...calls) => ({ tool_calls: [{ name: 'dear_donna_talk', input: {}, result: '', donna_calls: calls.map(([name, input]) => ({ name, input, result: '' })) }] });
const markWrites = (db) => async (_s, _v, id, _a, on) => { const r = db.tables.payment_schedules.find((m) => m.id === id); r.state = 'paid'; r.paid_at = PAID_AT(on); return { ok: true }; };
const promoteOk = (db, depositToo) => async () => {
  if (depositToo) { const d = db.tables.payment_schedules.find((m) => m.ordinal === 1); d.state = 'paid'; d.paid_at = PAID_AT('2026-09-18'); }
  return { status: 200, body: { ok: true, promoted: { lead_id: 'lead-1', binder_id: 'b-1', invoice_id: 'inv-1', invoice_number: 'TDW/DEV440/17' } } };
};

// Each scenario: a fresh world, the turn, the deps; then what the NEW module must return.
const SCEN = [
  ['booking · kind not recognised', () => [payWorld(), turn(['donna_booking', { lead: 'Meera', kind: 'hmm' }]), {}], [['donna_booking', 'refused:invalid_kind', 'F29']], (L) => [L.F29]],
  ['booking · advance on 30 February', () => [payWorld(), turn(['donna_booking', { lead: 'Meera', kind: 'advance_paid', advance_received_on: '2026-02-30' }]), {}], [['donna_booking', 'refused:invalid_date', 'F29']], (L) => [L.F29]],
  ['booking · no such lead', () => [payWorld(), turn(['donna_booking', { lead: 'Nobody', kind: 'booking_confirmed' }]), {}], [['donna_booking', 'refused:not_found', 'F29']], (L) => [L.F29]],
  ['booking · two leads by that name', () => [payWorld({ twin: true }), turn(['donna_booking', { lead: 'Meera', kind: 'booking_confirmed' }]), {}], [['donna_booking', 'refused:ambiguous', 'F29']], (L) => [L.F29]],
  ['booking · promotion refuses no_package', () => [payWorld({ leadState: 'lead' }), turn(['donna_booking', { lead: 'Meera', kind: 'booking_confirmed' }]), { promoteLead: async () => ({ status: 422, body: { ok: false, error: 'refused', code: 'no_package' } }) }], [['donna_booking', 'refused:no_package', 'F29']], (L) => [L.F29]],
  ['booking · promotion fails a step', () => [payWorld({ leadState: 'lead' }), turn(['donna_booking', { lead: 'Meera', kind: 'booking_confirmed' }]), { promoteLead: async () => ({ status: 500, body: { ok: false, error: 'promotion_failed', step: 'invoice' } }) }], [['donna_booking', 'refused:not_promoted', 'F29']], (L) => [L.F29]],
  ['booking · confirmed, no line of its own', (db) => [payWorld({ leadState: 'lead' }), turn(['donna_booking', { lead: 'Meera', kind: 'booking_confirmed' }]), 'promoteOk'], [['donna_booking', 'booked', null]], (L) => []],
  ['booking · advance with the booking, D3', () => [payWorld({ leadState: 'lead' }), turn(['donna_booking', { lead: 'Meera', kind: 'advance_paid', advance_received_on: '2026-09-18' }]), 'promoteDeposit'], [['donna_booking', 'advance_recorded', 'D3']], (L) => [L.D3('Meera', 'Deposit, 30% of the fee, on booking', 24000, '2026-09-18', '2026-11-05')]],
  ['booking · promotion throws', () => [payWorld({ leadState: 'lead' }), turn(['donna_booking', { lead: 'Meera', kind: 'booking_confirmed' }]), { promoteLead: async () => { throw new Error('boom'); } }], [['donna_booking', 'refused:exception', 'F29']], (L) => [L.F29]],
  ['payment · 31 September', () => [payWorld(), turn(['donna_milestone_paid', { lead: 'Meera', milestone: 'the deposit', received_on: '2026-09-31' }]), {}], [['donna_milestone_paid', 'refused:invalid_date', 'D8']], (L) => [L.D8]],
  ['payment · no booked client by that name, D5', () => [payWorld(), turn(['donna_milestone_paid', { lead: 'Nobody', milestone: 'the deposit', received_on: '2026-09-18' }]), {}], [['donna_milestone_paid', 'refused:not_found', 'D5']], (L) => [L.D5]],
  ['payment · no invoice', () => [payWorld({ noInvoice: true }), turn(['donna_milestone_paid', { lead: 'Meera', milestone: 'the deposit', received_on: '2026-09-18' }]), {}], [['donna_milestone_paid', 'refused:no_invoice', 'D8']], (L) => [L.D8]],
  ['payment · already marked, D7 from the stored day', () => [payWorld({ depositPaid: true }), turn(['donna_milestone_paid', { lead: 'Meera', milestone: 'the deposit', received_on: '2026-09-18' }]), {}], [['donna_milestone_paid', 'already_marked', 'D7']], (L) => [L.D7('Meera', 'Deposit, 30% of the fee, on booking', '2026-09-18')]],
  ['payment · stored day unreadable', () => [payWorld({ depositPaid: true, badPaidAt: true }), turn(['donna_milestone_paid', { lead: 'Meera', milestone: 'the deposit', received_on: '2026-09-18' }]), {}], [['donna_milestone_paid', 'refused:unreadable_paid_at', 'D8']], (L) => [L.D8]],
  ['payment · which one, D6', () => [payWorld(), turn(['donna_milestone_paid', { lead: 'Meera', milestone: 'the thing', received_on: '2026-09-18' }]), {}], [['donna_milestone_paid', 'refused:unmatched', 'D6']], (L) => [L.D6(['Deposit, 30% of the fee, on booking', '30% one month before the first function', 'The remainder, on delivery'])]],
  ['payment · marked, D3', () => [payWorld(), turn(['donna_milestone_paid', { lead: 'Meera', milestone: 'the deposit', received_on: '2026-09-18' }]), 'markWrites'], [['donna_milestone_paid', 'paid', 'D3']], (L) => [L.D3('Meera', 'Deposit, 30% of the fee, on booking', 24000, '2026-09-18', '2026-11-05')]],
  ['payment · the last one, D4', () => [payWorld({ depositPaid: true, lastNoDue: true }), turn(['donna_milestone_paid', { lead: 'Meera', milestone: 'the middle payment', received_on: '2026-09-18' }]), 'markWrites'], [['donna_milestone_paid', 'paid_in_full', 'D4']], (L) => [L.D4('Meera')]],
  ['payment · the writer says ALREADY_PAID, D7', () => [payWorld(), turn(['donna_milestone_paid', { lead: 'Meera', milestone: 'the deposit', received_on: '2026-09-18' }]), { markMilestonePaid: async () => ({ ok: false, code: 'ALREADY_PAID' }) }], [['donna_milestone_paid', 'already_marked', 'D7']], (L) => [L.D7('Meera', 'Deposit, 30% of the fee, on booking', '2026-09-18')]],
  ['payment · the writer refuses, D8', () => [payWorld(), turn(['donna_milestone_paid', { lead: 'Meera', milestone: 'the deposit', received_on: '2026-09-18' }]), { markMilestonePaid: async () => ({ ok: false, error: 'nope' }) }], [['donna_milestone_paid', 'refused:not_marked', 'D8']], (L) => [L.D8]],
  ['booking and payment in one turn, D7 absorbed (F-44.8)', () => [payWorld({ leadState: 'lead' }), turn(['donna_booking', { lead: 'Meera', kind: 'advance_paid', advance_received_on: '2026-09-18' }], ['donna_milestone_paid', { lead: 'Meera', milestone: 'the deposit', received_on: '2026-09-18' }]), 'promoteDepositNoMark'],
    [['donna_booking', 'advance_recorded', 'D3'], ['donna_milestone_paid', 'absorbed', null]], (L) => [L.D3('Meera', 'Deposit, 30% of the fee, on booking', 24000, '2026-09-18', '2026-11-05')]],
];
function depsFor(spec, db) {
  if (spec === 'promoteOk') return { promoteLead: promoteOk(db, false) };
  if (spec === 'promoteDeposit') return { promoteLead: promoteOk(db, true) };
  if (spec === 'promoteDepositNoMark') {
    return { promoteLead: async () => { const d = db.tables.payment_schedules.find((m) => m.ordinal === 1); d.state = 'paid'; d.paid_at = PAID_AT('2026-09-18'); db.tables.leads[0].state = 'booked'; return { status: 200, body: { ok: true, promoted: { lead_id: 'lead-1', binder_id: 'b-1', invoice_id: 'inv-1', invoice_number: 'TDW/DEV440/17' } } }; },
      markMilestonePaid: async () => { throw new Error('the absorbed branch must not write'); } };
  }
  if (spec === 'markWrites') return { markMilestonePaid: markWrites(db) };
  return spec;
}
async function runScen(mod, build) {
  const [world, t, spec] = build();
  const db = makeDb(world);
  return quiet(() => mod.runLifecycleSignals(db, { vendor: V, agentId: AGENT, result: t, deps: depsFor(spec, db) }));
}
async function lifecycleCell(mod) {
  let allOk = true;
  for (const [, build, want] of SCEN) {
    const r = await runScen(mod, build);
    const got = (r.results || []).map((x) => [x.hand, x.code, x.line_key]);
    if (JSON.stringify(got) !== JSON.stringify(want)) allOk = false;
  }
  return allOk;
}

(async () => {
  const HR = require(P('src/lib/vendor/handResult.js'));
  const LH = require(P('src/lib/vendor/lifecycleHands.js'));

  sec('1  the shape: closed, and naming only bytes that exist');
  const lineKeys = new Set(Object.keys(LH.LINES));
  T('1.1 three hands, each with a closed, frozen code set', Object.keys(HR.CODES).join() === 'donna_booking,donna_milestone_paid,donna_invoice_pdf'
    && Object.values(HR.CODES).every((c) => Object.isFrozen(c) && c.length > 0));
  const keysExist = (hr) => Object.values(hr.LINE_KEYS).every((ks) => ks.every((k) => k === null || lineKeys.has(k)));
  T("1.2 every line_key a hand may name is a key of lifecycleHands' LINES today, or null (P4 mints nothing)", keysExist(HR));
  T('1.3 an invoice names no line yet (F-44.48 and F-43.34 carry its one home to P5)', JSON.stringify(HR.LINE_KEYS.donna_invoice_pdf) === '[null]');
  T('1.4 validate refuses a key that names no byte', HR.validate({ hand: 'donna_milestone_paid', ok: true, code: 'paid', ids: {}, line_key: 'D9' }).length > 0);
  T('1.5 validate refuses a code outside the closed set', HR.validate({ hand: 'donna_booking', ok: true, code: 'booked_twice', ids: {}, line_key: null }).length > 0);
  T('1.6 validate refuses a spoken date and a zero amount', HR.validate({ hand: 'donna_milestone_paid', ok: true, code: 'paid', ids: {}, line_key: 'D3', on: '14 Feb' }).length > 0
    && HR.validate({ hand: 'donna_milestone_paid', ok: true, code: 'paid', ids: {}, line_key: 'D3', amount_rupees: 0 }).length > 0);
  let threw = false; try { await quiet(() => HR.make('donna_booking', 'nonsense', { line_key: 'D9' })); } catch (_e) { threw = true; }
  T('1.7 make() never throws, even on a bad result', threw === false);
  T('1.8 ok follows the code: refusals and already_marked are not ok; absorbed is', HR.make('donna_booking', 'booked').ok === true
    && HR.make('donna_booking', 'refused:not_found').ok === false && HR.make('donna_milestone_paid', 'already_marked').ok === false && HR.make('donna_milestone_paid', 'absorbed').ok === true);
  T("1.9 promoteLead's answers map to the closed set", HR.bookingRefusalCode({ status: 422, body: { error: 'refused', code: 'no_fee' } }) === 'refused:no_fee'
    && HR.bookingRefusalCode({ status: 422, body: { error: 'invalid', field: 'kind' } }) === 'refused:invalid'
    && HR.bookingRefusalCode({ status: 404, body: {} }) === 'refused:not_found' && HR.bookingRefusalCode({ status: 500, body: {} }) === 'refused:not_promoted');

  // ─── §1b TOTAL: the builders never throw, whatever they are handed (e-12) ─────────────────────────
  sec('1b  total: zero throws over hostile input');
  const BAD = { toString() { throw new Error('toString refused'); }, valueOf() { throw new Error('valueOf refused'); } };
  const CODES_IN = [undefined, null, '', 0, NaN, {}, [], 'x'.repeat(50), BAD];
  const FIELDS_IN = [undefined, null, {}, { ids: null }, { ids: { lead_id: {} } }, { client: {} }, { amount_rupees: 'abc' }, { on: {} }, { line_key: {} }, { invoice_number: {} }, BAD];
  const fuzz = (hr) => {
    let throws = 0; let bad = 0; let calls = 0;
    const w = console.warn; console.warn = () => {};
    try {
      for (const b of [hr.booking, hr.milestone, hr.invoice]) for (const c of CODES_IN) for (const f of FIELDS_IN) {
        calls += 1;
        try { const r = b(c, f); if (!Object.isFrozen(r) || (hr.validate(r).length && r.code !== 'refused:result_unbuildable')) bad += 1; } catch (_e) { throws += 1; }
      }
      for (const x of CODES_IN.concat(FIELDS_IN)) {
        calls += 2;
        try { hr.bookingRefusalCode(x); hr.bookingRefusalCode({ status: 422, body: { error: 'refused', code: x } }); } catch (_e) { throws += 1; }
      }
    } finally { console.warn = w; }
    return { throws, bad, calls };
  };
  const fz = fuzz(HR);
  T(`1b.1 ${fz.calls} hostile calls: zero throws, every result frozen and valid or minimal`, fz.throws === 0 && fz.bad === 0);
  T("1b.2 the minimal result is ok false, 'refused:result_unbuildable', line_key null, valid", (() => { const r = quietSync(() => HR.milestone(null, null)); return r.ok === false && r.code === 'refused:result_unbuildable' && r.line_key === null && HR.validate(r).length === 0; })());
  const unguarded = mutatedMany('src/lib/vendor/handResult.js', [
    ["const f = (fields && typeof fields === 'object' && !Array.isArray(fields)) ? fields : {};", 'const f = fields;'],
    ['try { return build(hand, code, fields); } catch (e) { return minimal(hand, e && e.message); }', 'return build(hand, code, fields);'],
  ]);
  T('1b.3 M5 removing the guard turns the fuzz cell red', fuzz(unguarded).throws > 0);

  sec('2  lifecycle: every line identical to base, one valid result per signal');
  for (const [name, build, want, lines] of SCEN) {
    const n = await runScen(LH, build);
    T(`2 ${name}: the lines are the one home's bytes with this scenario's facts`, JSON.stringify(n.lines) === JSON.stringify(lines(LH.LINES)));
    const got = (n.results || []).map((x) => [x.hand, x.code, x.line_key]);
    T(`2 ${name}: ${want.map((w) => `${w[1]} / ${w[2]}`).join(', ')}`, JSON.stringify(got) === JSON.stringify(want)
      && n.results.every((x) => HR.validate(x).length === 0));
  }
  {
    const n = await runScen(LH, SCEN.find((s) => /marked, D3/.test(s[0]))[1]);
    const r = n.results[0];
    T('2 a marked payment carries the figure, the ISO day, the ids and the client', r.amount_rupees === 24000 && r.on === '2026-09-18'
      && r.ids.lead_id === 'lead-1' && r.ids.invoice_id === 'inv-1' && r.client === 'Meera');
    const b = await runScen(LH, SCEN.find((s) => /advance with the booking/.test(s[0]))[1]);
    T('2 an advance with the booking carries the invoice number the door holds', b.results[0].invoice_number === 'TDW/DEV440/17' && b.results[0].ids.record_id === 'b-1');
  }
  T('2 no vendor, no agent: no lines and no results, as before', JSON.stringify(await LH.runLifecycleSignals(makeDb(payWorld()), { vendor: null, agentId: AGENT, result: turn() })) === '{"lines":[],"results":[]}');

  // ─── §2b THE LINE FIRST, THE RESULT BEST-EFFORT (e-12) ─────────────────────────────────────────────
  sec('2b  a result that cannot be built never costs the line');
  const lineSafe = async (mod) => {
    const keep = { milestone: HR.milestone, booking: HR.booking };
    HR.milestone = () => { throw new Error('forced'); }; HR.booking = () => { throw new Error('forced'); };
    try {
      const paid = SCEN.find((x) => /marked, D3/.test(x[0]));
      const refused = SCEN.find((x) => /no such lead/.test(x[0]));
      let a; let b;
      try { a = await runScen(mod, paid[1]); b = await runScen(mod, refused[1]); } catch (_e) { return false; }
      return JSON.stringify(a.lines) === JSON.stringify(paid[3](LH.LINES)) && JSON.stringify(b.lines) === JSON.stringify(refused[3](LH.LINES));
    } finally { HR.milestone = keep.milestone; HR.booking = keep.booking; }
  };
  T('2b.1 with the builder made to throw, "Payment marked" stands alone and a refusal speaks once; no error', await lineSafe(LH));
  const rethrows = mutated('src/lib/vendor/lifecycleHands.js', "catch (e) { try { console.warn('[lifecycle:result]'", "catch (e) { throw e; try { console.warn('[lifecycle:result]'");
  T('2b.2 M6 a note() that lets the failure through turns 2b.1 red (a second line, or an error)', (await lineSafe(rethrows)) === false);

  sec('3  invoices: one result per binder asked for');
  const invoices = require(P('src/api/vendor/invoices.js'));
  invoices.generateInvoiceForBinder = async (_s, _v, binder) => (binder.id === 'b-fail' ? { ok: false, error: 'PDF generation failed.' } : { ok: true, invoice_number: 'TDW/DEV440/17', pdf_url: 'https://x/p.pdf' });
  const chat = require(P('src/api/vendor-engine/chat.js'));
  const records = [{ id: 'b-1', agent_id: AGENT, client: 'Meera', amount: 80000 }, { id: 'b-0', agent_id: AGENT, client: 'Zero', amount: 0 }, { id: 'b-fail', agent_id: AGENT, client: 'Fail', amount: 5000 }];
  const req = { agentId: AGENT, vendor: V, app: { locals: { supabase: { schema: () => ({ from: () => {
    const f = []; const b = { select() { return b; }, eq(k, v) { f.push((r) => r[k] === v); return b; }, maybeSingle() { return Promise.resolve({ data: records.find((r) => f.every((fn) => fn(r))) || null, error: null }); } }; return b; } }) } } } };
  const invTurn = turn(['donna_invoice_pdf', { binder_id: 'b-1' }], ['donna_invoice_pdf', { binder_id: 'b-0' }], ['donna_invoice_pdf', { binder_id: 'b-fail' }], ['donna_invoice_pdf', { binder_id: 'b-gone' }]);
  const out = await quiet(() => chat.buildInvoicesWithResults(req, invTurn));
  T('3.1 minted / no amount / not minted / no binder, in order', JSON.stringify(out.results.map((r) => r.code)) === '["minted","refused:no_amount","refused:not_minted","refused:no_binder"]'
    && out.results.every((r) => HR.validate(r).length === 0));
  T('3.2 the minted result carries the door\'s own number and the binder', out.results[0].invoice_number === 'TDW/DEV440/17' && out.results[0].ids.record_id === 'b-1');
  const docs = await quiet(() => chat.buildInvoices(req, invTurn));
  T('3.3 buildInvoices still answers with the documents alone, as before', Array.isArray(docs) && docs.length === 1 && docs[0].invoice_number === 'TDW/DEV440/17' && docs[0].pdf_url === 'https://x/p.pdf');

  sec('4  F-44.30: the door\'s own number, never "Invoice"');
  const invCall = { name: 'dear_donna_talk', donna_calls: [{ name: 'donna_invoice_pdf', input: { binder_id: 'b-1' }, result: 'Invoice document requested for record 11111111-2222-3333-4444-555555555555 it is being prepared and will appear in the invoices list.' }] };
  const witnessCell = (w) => { const lines = w(V.id, { tool_calls: [invCall] }, [{ invoice_number: 'TDW/DEV440/17', binder_id: 'b-1', client: 'Meera' }]); return lines.length === 1 && lines[0] === 'Invoice minted: TDW/DEV440/17'; };
  T('4.1 the stored line names TDW/DEV440/17', witnessCell(chat.donnaWitnessLines));
  const UC = require(P('src/lib/undoContract.js'));
  const beat = UC.deriveFiling(V.id, 'donna_invoice_pdf', { binder_id: 'b-1' }, invCall.donna_calls[0].result);
  T('4.2 a live beat, before the door has made it, names no number and never the word "Invoice"', beat.summary === 'Invoice minted');
  T('4.3 and claims no undo on a binder id (it pointed at /invoices/<binder id>/cancel)', !beat.undo && beat.record_ref && beat.record_ref.id === 'b-1');
  const baseUC = atBase('src/lib/undoContract.js');
  T(`4.4 (fixed history: ${BASE.slice(0, 7)} printed "Invoice minted: Invoice")${baseMissing ? ' MISSING ' + BASE : ''}`, !!baseUC
    && baseUC.deriveFiling(V.id, 'donna_invoice_pdf', { binder_id: 'b-1' }, invCall.donna_calls[0].result).summary === 'Invoice minted: Invoice');
  const nonInv = { tool_calls: [{ name: 'dear_donna_talk', donna_calls: [{ name: 'donna_note', input: { binder_id: 'b-1' }, result: 'Note saved.' }, { name: 'donna_money', input: { binder_id: 'b-1' }, result: 'Money filed Rs 5,000.' }] }] };
  const OWN_LINES = nonInv.tool_calls[0].donna_calls.map((d) => UC.deriveFiling(V.id, d.name, d.input, d.result).summary);
  T('4.5 every other hand\'s line is the undo contract\'s own, untouched by the door\'s documents', JSON.stringify(chat.donnaWitnessLines(V.id, nonInv, [{ invoice_number: 'TDW/DEV440/17', binder_id: 'b-1' }])) === JSON.stringify(OWN_LINES));
  const vi = fs.readFileSync(P('src/lib/vendorInbound.js'), 'utf8');
  T('4.6 WhatsApp: the invoice sentence is unchanged', vi.includes("`Invoice ${d.invoice_number}${d.client ? ' for ' + d.client : ''} is ready. Find it in the invoices list.`"));

  sec('5  W-1 and the untouched spine');
  // C-44.7 (b): what P4a changed is its OWN manifest, which run-floor.sh --delivery proves equals the dirt.
  const MAN = 'scripts/floor-manifest-ce44-lcv1-p4a.txt';
  const listed = fs.existsSync(P(MAN)) ? fs.readFileSync(P(MAN), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')) : null;
  T(`5.0 P4a's manifest is present (${MAN})`, !!listed && listed.length > 0);
  T('5.1 W-1: P4a\'s manifest lists no path under src/engine/src/', !!listed && !listed.some((p) => p.startsWith('src/engine/src/')));
  T('5.2 W-1: P4a\'s manifest lists no soul or lens file', !!listed && !listed.some((p) => /soul|lens/i.test(p)));
  T('5.3 P4a\'s manifest does not list promotion.js (its callers cannot behave differently)', !!listed && !listed.includes('src/lib/vendor/promotion.js'));
  const spine = ['scripts/b83_lc2_p3_promotion_bench.js', 'scripts/b84_lc2_p4a_lifecycle_bench.js', 'scripts/b85_lc2_p5_bench.js'];
  T('5.4 P4a\'s manifest does not list b83, b84 or b85 (LC-2\'s spine unamended)', !!listed && !spine.some((p) => listed.includes(p)));
  for (const s of spine) {
    const r = spawnSync('node', [P(s)], { cwd: ROOT, encoding: 'utf8', timeout: 240000 });
    T(`5.5 ${path.basename(s)} is green on this tree`, r.status === 0);
  }

  sec('6  mutations');
  T('6.1 M1 a booking that records no result reddens the lifecycle cell', (await lifecycleCell(mutated('src/lib/vendor/lifecycleHands.js',
    "note(results, () => HR.booking('booked', { ids: bookedIds, client: bookedClient, invoice_number: promoted.invoice_number, line_key: null }));", ''))) === false);
  T('6.2 M2 a payment naming the wrong byte (D4 for D3) reddens the lifecycle cell', (await lifecycleCell(mutated('src/lib/vendor/lifecycleHands.js',
    "line_key: full ? 'D4' : 'D3'", "line_key: full ? 'D3' : 'D4'"))) === false);
  const regexBack = mutated('src/lib/undoContract.js', "const num = door && door.invoice_number ? String(door.invoice_number) : '';",
    "const num = (String(result || '').match(/INV[-\\w]+/i) || [])[0] || '';");
  T('6.3 M3 the regex restored reddens F-44.30\'s cell', regexBack.deriveFiling(V.id, 'donna_invoice_pdf', { binder_id: 'b-1' }, invCall.donna_calls[0].result).summary !== 'Invoice minted');
  const m4 = mutated('src/lib/vendor/handResult.js', "donna_milestone_paid: Object.freeze(['D3',", "donna_milestone_paid: Object.freeze(['D9', 'D3',");
  T('6.4 M4 a hand allowed a key that names no byte reddens 1.2', keysExist(m4) === false);

  console.log(`\nb88 · ${pass} pass · ${fail} fail`);
  if (fail) { console.log('FAILED: ' + failed.join(' | ')); process.exit(1); }
  process.exit(0);
})().catch((e) => { console.log(`b88 CRASHED: ${(e && e.stack) || e}`); process.exit(1); });
