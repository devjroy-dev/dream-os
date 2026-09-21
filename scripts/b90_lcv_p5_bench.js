'use strict';
// scripts/b90_lcv_p5_bench.js · TDW CE-44 · LCV-2 · LC-Victor P5, THE WORKING DOOR FOR MONEY AND INVOICES. Rung b90.
//
// WHAT IT HOLDS (the chair's rulings on P5's read-first and pre-cut note, each a cell):
//  §1 doorLines.js: B1 to B13, D1, the leftover line and the twelve examples VERBATIM as ruled (R-44.21 (f),
//     (e); TDW_CE43_LC2_P3_HANDOVER.md:173 for D1), each hash pinned HERE as a literal; byte 13 is the ONE
//     invoice sentence and its no-client form is V1's; the leftover line is carried and UNUSED.
//  §2 spokenDate.js: F-44.38 (the door resolves, no model), F-44.46 (next occurrence for a lookup), and the
//     'past' direction for a date money was received.
//  §3 pendingMoneyActs.js: the closed yes and no lists (F-44.53); live = staged and unexpired; the stuck row.
//  §4 the act table's image never holds donna_client, donna_stage, donna_money or donna_money_edit (item 1 (i)).
//  §5 preTurn(): the five stand-aside cases and the order; staging, yes, no, a lapse at 15 minutes; B1 to B13
//     and D1, D3, D5 to D8 on their cases; one money act per message; figures from rows only; the 4 s bound
//     both ways; NO SECOND LISTENER CALL on any turn.
//  §6 persistDoorTurn(): the thread, meta.listener, room 'business', ONE counted usage row (F-44.52).
//  §7 generateInvoiceForBinder: MINTED is not SERVED (F-44.49).
//  §8 both lanes' wire: one non-empty text_delta, no chip on a door turn (ruled (a)), harvest's inputs.
//  §9 W-1 NONE and the scope, read from P5's OWN manifest (C-44.7 (b)).
//  §10 fuzz in EVERY argument position of every new total function (e-12, e-16).
//  §11 mutations of production code, each reddening the cell that guards it.
// THE EXIT CODE IS THE VERDICT.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-ce44-lcv2-p5.txt';
let pass = 0; let fail = 0; const failed = [];
function T(name, cond) { if (cond) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}`); } }
const sec = (t) => console.log(`\n§${t}`);
const quiet = async (fn) => { const w = console.warn; const e = console.error; const l = console.log; console.warn = () => {}; console.error = () => {}; console.log = () => {}; try { return await fn(); } finally { console.warn = w; console.error = e; console.log = l; } };
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const src = (rel) => fs.readFileSync(P(rel), 'utf8');

// ── mutation: compile a module from mutated source, place it in the require cache, re-require the
//    dependents fresh, run, restore. Production code only; an anchor that is missing FAILS the cell. ──
async function withMutated(rel, pairs, dependents, fn) {
  const file = P(rel);
  let code = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!code.includes(a)) throw new Error(`mutation anchor missing in ${rel}: ${a.slice(0, 60)}`); code = code.replace(a, b); }
  const saved = {}; const all = [rel, ...dependents];
  for (const r of all) saved[r] = require.cache[P(r)];
  try {
    const m = new Module(file, module); m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
    m._compile(code, file); m.loaded = true; require.cache[file] = m;
    for (const d of dependents) delete require.cache[P(d)];
    return await fn((r) => require(P(r)));
  } finally {
    for (const r of all) { if (saved[r]) require.cache[P(r)] = saved[r]; else delete require.cache[P(r)]; }
  }
}

// ── a small in-memory database with schemas, filters, insert/update and the maybeSingle/single ends ──
function makeDb(seed) {
  const tables = JSON.parse(JSON.stringify(seed || {}));
  const log = { inserts: [], updates: [] };
  let seq = 0;
  const builder = (schema, name) => {
    const full = `${schema}.${name}`;
    const f = []; let mode = 'select'; let payload = null; let limitN = null; let orderBy = null;
    const rows = () => (tables[full] || []);
    const run = () => {
      if (mode === 'insert') {
        const list = (Array.isArray(payload) ? payload : [payload]).map((r) => ({ id: `row-${++seq}`, created_at: new Date().toISOString(), resolved_at: null, ...r }));
        tables[full] = rows().concat(list); log.inserts.push({ table: full, rows: list });
        return { data: list, error: null };
      }
      let hit = rows().filter((r) => f.every((fn) => fn(r)));
      if (mode === 'update') { hit.forEach((r) => Object.assign(r, payload)); log.updates.push({ table: full, vals: payload, n: hit.length }); return { data: hit, error: null }; }
      if (orderBy) hit = hit.slice().sort((a, b) => (String(a[orderBy.k]) < String(b[orderBy.k]) ? -1 : 1) * (orderBy.asc ? 1 : -1));
      if (limitN != null) hit = hit.slice(0, limitN);
      return { data: hit, error: null };
    };
    const b = {
      select() { return b; }, eq(k, v) { f.push((r) => r[k] === v); return b; }, neq(k, v) { f.push((r) => r[k] !== v); return b; },
      is(k, v) { f.push((r) => (r[k] === undefined ? null : r[k]) === v); return b; }, in(k, vs) { f.push((r) => vs.includes(r[k])); return b; },
      not() { return b; }, order(k, o) { orderBy = { k, asc: !(o && o.ascending === false) }; return b; }, limit(n) { limitN = n; return b; },
      insert(p) { mode = 'insert'; payload = p; return b; }, update(p) { mode = 'update'; payload = p; return b; },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
      maybeSingle() { const r = run(); return Promise.resolve({ data: r.data ? r.data[0] || null : null, error: r.error }); },
      single() { const r = run(); return Promise.resolve({ data: r.data ? r.data[0] || null : null, error: r.data && r.data.length ? null : { message: 'no row' } }); },
    };
    return b;
  };
  const db = { tables, log, from: (n) => builder('public', n), schema: (s) => ({ from: (n) => builder(s, n) }) };
  return db;
}

const V = { id: 'v-1', tier: 'signature', user_id: 'u-1' };
const AG = 'ag-1';
const DAY = 24 * 3600 * 1000;
const ROUTE = { provider: 'anthropic', model: 'm-primary', listener_provider: 'anthropic', listener_model: 'm-listen' };
function world() {
  return {
    'public.leads': [
      { id: 'l-sarah', vendor_id: V.id, name: 'Sarah', state: 'booked', wedding_date: '2027-02-22', binder_id: 'b-sarah', deleted_at: null },
      { id: 'l-meera', vendor_id: V.id, name: 'Meera', state: 'quoted', wedding_date: '2026-12-05', binder_id: null, deleted_at: null },
      { id: 'l-nopkg', vendor_id: V.id, name: 'Tara', state: 'new', wedding_date: '2027-01-10', binder_id: null, deleted_at: null },
      { id: 'l-priya1', vendor_id: V.id, name: 'Priya', state: 'new', wedding_date: '2026-12-05', binder_id: null, deleted_at: null },
      { id: 'l-priya2', vendor_id: V.id, name: 'Priya', state: 'new', wedding_date: '2027-01-09', binder_id: null, deleted_at: null },
    ],
    'public.lead_packages': [{ id: 'lp-meera', vendor_id: V.id, lead_id: 'l-meera', total: 60000, schedule: [], snapshot: { name: 'Photographs and film' }, deleted_at: null }],
    'public.invoices': [
      { id: 'inv-sarah', vendor_id: V.id, lead_id: 'l-sarah', binder_id: 'b-sarah', invoice_number: 'TDW/DEV440/19', amount_total: 80000, amount_paid: 24000, state: 'advance_paid', lead_package_id: 'lp-s', deleted_at: null, created_at: '2026-09-18T00:00:00Z' },
      { id: 'inv-two-a', vendor_id: V.id, binder_id: 'b-two', invoice_number: 'TDW/DEV440/21', state: 'unpaid', deleted_at: null },
      { id: 'inv-two-b', vendor_id: V.id, binder_id: 'b-two', invoice_number: 'TDW/DEV440/22', state: 'unpaid', deleted_at: null },
    ],
    'public.payment_schedules': [
      { id: 'ms-1', invoice_id: 'inv-sarah', vendor_id: V.id, ordinal: 1, milestone_label: 'Deposit, 30% of the fee, on booking', amount_due: 24000, due_date: '2026-09-18', state: 'paid', paid_at: '2026-09-17T18:30:00+00:00' },
      { id: 'ms-2', invoice_id: 'inv-sarah', vendor_id: V.id, ordinal: 2, milestone_label: '30% one month before the first function (optional)', amount_due: 24000, due_date: '2027-01-22', state: 'pending', paid_at: null },
      { id: 'ms-3', invoice_id: 'inv-sarah', vendor_id: V.id, ordinal: 3, milestone_label: 'The remainder, on delivery, before the work is handed over', amount_due: 32000, due_date: '2027-03-22', state: 'pending', paid_at: null },
    ],
    'public.pending_money_acts': [],
    'engine.records': [
      { id: 'b-sarah', agent_id: AG, client: 'Sarah', amount: 80000, amount_received: 24000, hidden: false, date: '2027-02-22' },
      { id: 'b-walk', agent_id: AG, client: 'Walk45', amount: 50000, amount_received: 0, hidden: false, date: '2026-09-25' },
      { id: 'b-nofee', agent_id: AG, client: 'Anjali', amount: null, amount_received: 0, hidden: false, date: '2026-12-16' },
      { id: 'b-two', agent_id: AG, client: 'Khanna', amount: 60000, amount_received: 0, hidden: false, date: '2026-12-05' },
      { id: 'b-dup1', agent_id: AG, client: 'Rao', amount: 30000, amount_received: 0, hidden: false, date: '2026-12-16' },
      { id: 'b-dup2', agent_id: AG, client: 'Rao', amount: 30000, amount_received: 0, hidden: false, date: '2027-01-02' },
    ],
    'engine.conversations': [{ id: 'c-1', agent_id: AG, state: 'active', last_active_at: '2026-09-20T08:00:00Z' }],
    'engine.messages': [],
  };
}
// the listener: a counted, forced ear_request answer
function ear(request, counter) {
  return async () => { if (counter) counter.n += 1; return { content: [{ type: 'tool_use', name: 'ear_request', input: request }], usage: { input_tokens: 1400, output_tokens: 50 } }; };
}
const req = (acts, route = 'task') => ({ route, acts });

async function main() {
  const DL = require(P('src/lib/vendor/doorLines.js'));
  const SD = require(P('src/lib/vendor/spokenDate.js'));
  const PMA = require(P('src/lib/vendor/pendingMoneyActs.js'));
  const WD = require(P('src/lib/vendor/workingDoor.js'));
  const LH = require(P('src/lib/vendor/lifecycleHands.js'));
  const LD = require(P('src/lib/vendor/listenerDoor.js'));
  const HR = require(P('src/lib/vendor/handResult.js'));

  // ─── §1 THE BYTES ────────────────────────────────────────────────────────────────────────────
  sec('1 doorLines.js: the founder\'s bytes, verbatim, hash-pinned here');
  const RULED = {
    B1: 'Mark this payment? {client} · {which payment} · Rs {amount} · {date}. Reply YES or NO.',
    B2: 'Confirm this booking? {client} · {package} · Rs {total}. Reply YES or NO.',
    B3: 'Okay. Nothing was changed.',
    B4: 'Could not confirm the booking. No lead called {name}. Add the lead first.',
    B5: 'Could not confirm the booking. {client} has no package yet. Attach a package first.',
    B6: 'When did the payment come in?',
    B7: 'I could not read that date. Say it like 5 December.',
    B8: 'Two clients are called {name}: {name} ({date}) · {name} ({date}). Say which one.',
    B9: 'Invoice {number} for {client} is already made. Find it in the invoices list.',
    B10: '{client} has {n} invoices: {numbers}. Which one?',
    B11: 'Could not make the invoice. {client} has no fee yet.',
    B12: 'One payment at a time. Tell me the next one after this.',
    B13: 'Invoice {number} for {client} is ready. Find it in the invoices list.',
    B14: 'That request timed out. Nothing was changed. Say it again.',
    // H1 (CE-44 LCV-7, P6a-1): the lead half's bytes, his at R-44.34, joined to the ruled set in the same cut
    B16: 'Lead added: {client}.',
    B17: 'Lead added: {client} · {date}.',
    B18: 'Who is the lead? Say the name.',
    B19: 'That number is already on {client}. Nothing new was added.',
    B20: 'Could not add the lead.',
    B21: 'That wedding date cannot be right. Say it like 5 December 2027.',
    // H1 (CE-44 LCV-8, P6a-2): B22 to B28 his at R-44.34 and R-44.35; B29 and B30 his bytes REUSED from the pwa (twins named in doorLines.js).
    B22: 'Package attached: {client} · {package} · Rs {total}.',
    B23: 'You have no package called {name}. Yours are: {list}.',
    B24: 'Two packages are called {name}: {name} (Rs {total}) · {name} (Rs {total}). Say which one.',
    B25: 'Could not attach the package. {client} has no wedding date yet. Add the date first.',
    B26: 'When is the delivery date for {client}?',
    B27: 'Package attached: {client} · {package} · Rs {total} · Delivery {date}.',
    B28: 'That delivery date cannot be right. Say it like 5 December 2027.',
    B29: 'This couple is booked. The package is fixed on their invoice.',
    B30: 'Could not attach the package.',
    // RE-PINNED (CE-44 LCV-9 PART ONE, R-44.37): the cut in which the chain leaves brings B15 (R-44.27, his; "owed by the
    // last packet" meant this one, the chair's ruling), B32 (R-44.36, his) and B34 (R-44.38, his "yes"). B31 and B33 are Part Two's.
    B15: 'Could not make the invoice. No client called {name}.',
    B32: 'Could not attach the package. No lead called {name}. Add the lead first.',
    B34: 'I cannot do that by message yet. Use the app for it.',
    // RE-PINNED (CE-44 LCV-10 PART B-2, first cut): B35 his at R-44.39 ("Yes to your recomendation"), hash-carried; B31 and B33 stay B-2's second cut's.
    B35: 'Which client? Say the name.',
    D1: 'Booked: {client}. Client, event and invoice {number} are ready.',
    LEFTOVER: "I didn't catch a task in that. You can say things like:",
  };
  const HASHES = {
    B1: '1fb5297d3c1193543d8385e514fe42b1856be16deb6cabf2e83cf036169ed4ba', B2: 'cd29bd0dfbde4e0dba9cf4df73e12bc7b69880aea0337562e77d96228e8259eb',
    B3: 'a6a5c9b1c22d6a82413e6bb856363e8a98e902a4b092368a16ef21bb6b30066d', B4: '2dff7d6656c93fa39dd45da087484bb39ef3751b00a0c2e1ca7d4b3503068684',
    B5: 'c628ff61df8eec8e034ec24ac22d2e6b54e060eeb460260d32a6f2d9fa84d190', B6: '728d219fdb8a4ce07778dcf346665975d7ab651f7501efa6ff3f8a7144eb3029',
    B7: '44b5c385d187f3cc29ce05c210a524a8be162ab127f2bf97cbe22bc90dd8e331', B8: 'ecf5d241deae90b77bc9d840928aacc2a1fc781f3fd2b6ea9cb2a25db7675166',
    B9: '3253966dab22fb365c4f8ed5e0676c1c6196f6df7e3f47a122d1e32d00a0faa2', B10: 'c82103b3177a6a44cafcf364be426df89901ab0407fd3776092a84b3afcad81d',
    B11: '90f1edf7055b45d6c898df911ba442b70b47119f2523a5c8b7bfdd8dd00cb8ed', B12: '7723dc04452784fe3c6e7b1e9d145fa1323048aaa39da70a9d52aeae2c22ee09',
    B13: '45f9284524fc2546d8ca5a34ae51d036efc1a887f2104a35a473e283dda9658c', B14: '68dbaf45c2129785ac3e0644f30973d1ee8a8d3838313a6069b3417b8a4b2249',
    B16: 'a7fe91f49891ed319667b750d32ddcd55dabda117f328f7f0712f685c20b3830', B17: 'b332f4de8e4698181a5d67735814f183a25319abdfa568c3e56b4040f24e8927',
    B18: 'f6d70e738f124ab29e818590116913b8cb744e777f722c7157e70dbe0ca366a0', B19: 'ec10d50e073b11a83206a1c89c276be61f0e476bee762671d383820d74ecfaf8',
    B20: 'fcfa046d1cf3e8191d12637a6d707078d093df2c5d191b499a6491877d925653', B21: 'ceb7ebc7a3efd2b7d2ff2250c3fff652146624c6bdb7065f28cfe255c52ba9ed',
    B22: 'bbca851eb1d8df31d57d2ff778b67db8bea5e84e10975efe138b36e82db2823c', B23: '5c68d52e310188c9a5d678ba495885cae0ad96236fc7d101435c5fa0e0ce4c2c',
    B24: '85943481b6496e4cda801f3865c1bdbfa80b760e0f82dcec5a3a2e5d57b57c8a', B25: '54da33cf13d4a3bb0d19333f1f5fa540fbf196af9f1cdd2b2e1b454c8a3f475f',
    B26: 'ddf2ed942fc9b724116dfd16bf117789dfbbab07cea4a023fdee62120f702484', B27: 'fcbbbddfd50565bfac2269cae1570d550ec93055609e2b5d70c407949879473d',
    B28: 'a2d7f31aa0ba6c0f3238cebe4791d4d610b31d1eb37085b20a81ecf9bb85b986', B29: 'a3f8c714b924542bafba121ffdb08248f4c0cb34080d9c907088dcfb143ea14d',
    B30: '5b79740334d8529ab36a64d1dda786c35d403d794b27ed44fcf6a7faf7cff927',
    B15: 'f5a96043bb86272066b085f699a88d0aa4adbeb04871d6b95ea59e7f56db5ab0',
    B32: '136ff0b0c57e5145267570a25752ed723c9f1fad59eca74ee37e884d1607a704',
    B34: '3dc0787ed3e775e75d9d838cf0a87f7ef66d43e499fa665c107a466dfa76b4eb',
    B35: '7b73fec4bc3c30e66b5e33232961ccb26549d42d440d466e6e8de54402c1c773',
    D1: '1a7d3901e2d0a7a72709b471bcd010931aff7ddd002ed34b9c001b463df3e8ee',
    LEFTOVER: '05f4c9a3b74e98344db56fe642a0774eae8bddb61ff5f672699eaa33fea087ae',
  };
  for (const k of Object.keys(RULED)) T(`1.1 ${k} is the founder's byte verbatim and its hash is the literal pinned here`, DL.LINES[k] === RULED[k] && DL.LINE_HASHES[k] === HASHES[k] && sha(RULED[k]) === HASHES[k]);
  T('1.2 no byte beyond the ruled set lives in the home', Object.keys(DL.LINES).sort().join() === Object.keys(RULED).sort().join());
  T('1.3 F-44.54: the first example is "The Sharma booking is confirmed"; the withdrawn wording is gone', DL.EXAMPLES[0] === 'The Sharma booking is confirmed' && !src('src/lib/vendor/doorLines.js').includes("'The Sharma wedding is confirmed for 5 December, fee 60,000'") && DL.EXAMPLES.length === 12);
  T('1.4 the twelve examples are hash-pinned one by one', DL.EXAMPLES.every((e, i) => DL.EXAMPLE_HASHES[i] === sha(e)));
  // 1.5 REVERSED (CE-44 LCV-9 PART ONE; R-44.37, the founder, 21 September 2026: the chain leaves the working rooms NOW, so
  // R-44.21 (a)'s "carried unused" is superseded). It asserted that NOTHING read the leftover line; it now pins that it is
  // read in exactly ONE place: workingDoor.js calls the one builder ONCE and names neither constant; the lanes name nothing.
  T('1.5 the leftover line and its examples are LIVE and read in exactly ONE place (R-44.37): workingDoor.js calls DL.leftover( once; chat.js and vendorInbound.js never name LEFTOVER or EXAMPLES', (src('src/lib/vendor/workingDoor.js').match(/DL\.leftover\(/g) || []).length === 1 && !/DL\.EXAMPLES|DL\.LINES\.LEFTOVER/.test(src('src/lib/vendor/workingDoor.js')) && !/LEFTOVER|EXAMPLES/.test(src('src/api/vendor-engine/chat.js')) && !/LEFTOVER|EXAMPLES/.test(src('src/lib/vendorInbound.js')));
  T('1.6 byte 13 with a client is V1 exactly', DL.invoiceReady('TDW/DEV440/11', 'Tandon') === 'Invoice TDW/DEV440/11 for Tandon is ready. Find it in the invoices list.');
  T('1.7 byte 13 with no client is V1_NOCLIENT exactly (the conditional kept)', DL.invoiceReady('TDW/DEV440/11', null) === 'Invoice TDW/DEV440/11 is ready. Find it in the invoices list.');
  T('1.8 a template with a missing slot renders null, never a half sentence', DL.render('B2', { client: 'Meera' }) === null && DL.render('B99', {}) === null);
  T('1.9 byte 8 renders only for exactly two candidates with dates', DL.twoClients('Priya', [{ name: 'Priya', date: '5 December 2026' }, { name: 'Priya', date: '9 January 2027' }]) === 'Two clients are called Priya: Priya (5 December 2026) · Priya (9 January 2027). Say which one.'
    && DL.twoClients('Priya', [{ name: 'Priya', date: 'x' }]) === null && DL.twoClients('Priya', [{ name: 'Priya', date: null }, { name: 'Priya', date: 'y' }]) === null);
  T('1.10 D1 renders with the invoice number the door made', DL.render('D1', { client: 'Meera', number: 'TDW/DEV440/23' }) === 'Booked: Meera. Client, event and invoice TDW/DEV440/23 are ready.');
  T('1.11 the door\'s keys are its own map, not additions to LINE_KEYS (b88 1.2 holds)', HR.DOOR_LINE_KEYS.every((k) => DL.DOOR_KEYS.includes(k)) && Object.values(HR.LINE_KEYS).every((ks) => ks.every((k) => k === null || Object.prototype.hasOwnProperty.call(LH.LINES, k))));
  T('1.12 handResult\'s invoice set gains served (F-44.49)', HR.CODES.donna_invoice_pdf.includes('served') && HR.invoice('served', { invoice_number: 'TDW/X/1' }).code === 'served');

  // ─── §2 DATES ────────────────────────────────────────────────────────────────────────────────
  sec('2 spokenDate.js');
  const D = (s, o) => SD.resolveSpokenDate(s, { todayIso: '2026-09-20', ...o });
  T('2.1 F-44.46: "19th" asked on 20 September is 19 October (a lookup, the next occurrence)', D('19th').iso === '2026-10-19');
  T('2.2 F-44.46: "14 Feb" is 14 February 2027', D('14 Feb').iso === '2027-02-14');
  T('2.3 a payment RECEIVED "18 September" on 20 September is 18 September 2026 (direction past)', D('18 September', { direction: 'past' }).iso === '2026-09-18');
  T('2.4 "today" is today in IST', D('today', { direction: 'past' }).iso === '2026-09-20' && SD.todayIstIso(Date.parse('2026-09-19T20:00:00Z')) === '2026-09-20');
  T('2.6 F-44.46 AMENDED (c-44.28): a received date that can only be read as AFTER today is not resolved forward, it is unreadable (B7)',
    D('18 September 2027', { direction: 'past' }).reason === 'unreadable' && D('tomorrow', { direction: 'past' }).reason === 'unreadable' && D('2026-09-21', { direction: 'past' }).reason === 'unreadable'
    && D('18 September 2026', { direction: 'past' }).iso === '2026-09-18' && D('18 September 2027').iso === '2027-09-18');
  T('2.5 nothing said is none (B6); a date that is not a day is unreadable (B7)', D('').reason === 'none' && D(null).reason === 'none' && D('30 Feb', { direction: 'past' }).reason === 'unreadable' && D('next week').reason === 'unreadable');

  // ─── §3 THE PENDING TABLE ──────────────────────────────────────────────────────────────────────
  sec('3 pendingMoneyActs.js');
  T('3.1 F-44.53: yes is the WHOLE message in the closed list', ['yes', 'Yes.', 'OK', 'okay!', 'haan', 'ha', 'yeah', 'yep'].every((x) => PMA.decide(x) === 'yes'));
  T('3.2 F-44.53: "confirmed", "send", "yes please", "Sharma is confirmed" are NOT a yes', ['confirmed', 'send', 'send it', 'yes please', 'Sharma is confirmed', 'go ahead'].every((x) => PMA.decide(x) === null));
  T('3.3 no is the whole message in its closed list', ['no', 'No.', 'nahi', 'cancel'].every((x) => PMA.decide(x) === 'no') && PMA.decide('no problem') === null);
  T('3.4 the wait is 15 minutes, its own constant (R-44.21 (c))', PMA.WAIT_MIN === 15);

  // ─── §4 THE TABLE'S IMAGE ─────────────────────────────────────────────────────────────────────
  sec('4 the act table');
  const FORBIDDEN = ['donna_client', 'donna_stage', 'donna_money', 'donna_money_edit'];
  // H5 (CE-44 LCV-7, P6a-1, the chair's ruling): the ruled set gains exactly donna_lead; FORBIDDEN is unchanged.
  // H5 again (CE-44 LCV-8, P6a-2): it gains exactly attach_package, the recorded name of the attach; FORBIDDEN is unchanged.
  const imageOk = (H) => Object.values(H).every((h) => ['donna_booking', 'donna_milestone_paid', 'donna_invoice_pdf', 'donna_lead', 'attach_package'].includes(h)) && !Object.values(H).some((h) => FORBIDDEN.includes(h));
  T('4.1 item 1 (i): the door\'s hands are booking, milestone, invoice, (P6a-1) lead and (P6a-2) attach_package only; never donna_client, donna_stage, donna_money or donna_money_edit', imageOk(WD.HANDS));
  // H2 (CE-44 LCV-7, P6a-1): COVERED at five. H2 again (CE-44 LCV-8, P6a-2): at six, attach_package joins it.
  T('4.2 covered at P6a-2: booking_confirmed, advance_paid, milestone_paid, invoice, lead, attach_package; nothing else', WD.COVERED.slice().sort().join() === 'advance_paid,attach_package,booking_confirmed,invoice,lead,milestone_paid');
  T('4.3 the door never names a forbidden hand anywhere in its source', !FORBIDDEN.some((h) => new RegExp(`'${h}'`).test(src('src/lib/vendor/workingDoor.js').replace(/^\s*\/\/.*$/gm, ''))));

  // ─── §5 THE DOOR'S DECISIONS ───────────────────────────────────────────────────────────────────
  sec('5 preTurn()');
  const marked = [];
  const promoted = [];
  const lifeDeps = (db) => ({
    ...LH,
    runLifecycleSignals: (sb, a) => LH.runLifecycleSignals(sb, { ...a, deps: {
      markMilestonePaid: async (_s, _v, id, amt, on) => { marked.push({ id, amt, on }); const r = db.tables['public.payment_schedules'].find((x) => x.id === id); r.state = 'paid'; r.paid_at = `${on}T00:00:00+05:30`; return { ok: true }; },
      promoteLead: async (_s, p) => { promoted.push(p); if (p.kind === 'advance_paid') { const r = db.tables['public.payment_schedules'].find((x) => x.ordinal === 1); r.state = 'paid'; } return { status: 200, body: { ok: true, promoted: { lead_id: p.leadId, binder_id: 'b-new', invoice_id: 'inv-sarah', invoice_number: 'TDW/DEV440/23' } } }; },
    } }),
  });
  const run = async (db, message, request, extra = {}) => {
    const c = { n: 0 };
    const out = await quiet(() => WD.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message, lane: extra.lane || 'pwa' },
      { llmCreate: request === 'hang' ? () => { c.n += 1; return new Promise(() => {}); } : (request === 'err' ? async () => { c.n += 1; throw new Error('401'); } : ear(request, c)), lifecycle: lifeDeps(db), generateInvoiceForBinder: extra.gen, hearMs: extra.hearMs, nowMs: extra.nowMs }));
    return { out, calls: c.n };
  };
  const writes = (db) => db.log.inserts.length + db.log.updates.length;
  let db = makeDb(world());
  let r = await run(db, 'Sarah paid the middle payment on 18 September and move the Verma shoot', req([{ act: 'milestone_paid', client_as_spoken: 'Sarah', date_as_spoken: '18 September', milestone: 'middle payment' }, { act: 'edit_event', client_as_spoken: 'Verma' }]));
  T('5.1 PIN (a): an uncovered act beside a covered one sends the WHOLE message to the chain; nothing written, nothing staged', r.out.door === false && r.out.why === 'uncovered' && writes(db) === 0 && r.calls === 1);
  r = await run(db, 'the middle payment came in today', req([{ act: 'milestone_paid', date_as_spoken: 'today', milestone: 'middle payment' }]));
  // 5.2 RE-PINNED (CE-44 LCV-10 PART B-2, first cut; R-44.39): a covered act naming no client is now the DOOR'S turn: it asks B35, his byte, keeps its note and WRITES NOTHING. The strength kept is the write count.
  T('5.2 PIN (b) re-pinned: a covered act naming no client is asked B35 by the door (R-44.39), and NOTHING is written', r.out.door === true && r.out.reply === 'Which client? Say the name.' && writes(db) === 0);
  r = await run(db, 'Full', req([], 'none'));
  T('5.3 PIN (c): no act goes to the chain (the leftover line is NOT live, R-44.21 (a))', r.out.door === false && r.out.why === 'uncovered' && writes(db) === 0 && r.calls === 1);
  r = await run(db, 'Sarah paid', 'err');
  T('5.4 PIN (d): a listener error goes to the chain and carries the error for meta', r.out.door === false && r.out.ear && /401/.test(r.out.ear.error) && writes(db) === 0);
  r = await run(db, 'yes', req([{ act: 'invoice', client_as_spoken: 'Walk45' }]));
  T('5.5 PIN (e): a bare yes with NO live row goes to the chain and the listener is NOT called before it', r.out.door === false && r.out.why === 'yes_no_nothing_waiting' && r.calls === 0 && writes(db) === 0);
  // the 4 s bound, both directions
  let t0 = Date.now();
  r = await run(db, 'Sarah paid the middle payment today', 'hang', { hearMs: 150 });
  const slow = Date.now() - t0;
  T('5.6 THE BOUND: a hung listener delays the reply no longer than the bound, then the chain answers', r.out.door === false && slow < 1500 && /timed out/.test(r.out.ear.error));
  T('5.7 the bound before the reply is 4 s, its own constant; the after-the-wire recording keeps 15 s (b86 §4)', WD.HEAR_BEFORE_REPLY_MS === 4000 && LD.LISTEN_TIMEOUT_MS === 15000);
  const slowButInBound = async () => { if (true) await new Promise((res) => setTimeout(res, 200)); return { content: [{ type: 'tool_use', name: 'ear_request', input: req([{ act: 'invoice', client_as_spoken: 'Walk45' }]) }], usage: {} }; };
  db = makeDb(world());
  const gen = async (_s, _v, b) => ({ ok: true, invoice_number: 'TDW/DEV440/30', pdf_url: 'https://x.invalid/p.pdf', made: b.id === 'b-walk' ? 'minted' : 'served' });
  const fastOut = await quiet(() => WD.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message: 'Raise the invoice for Walk45', lane: 'pwa' }, { llmCreate: slowButInBound, generateInvoiceForBinder: gen, hearMs: 2000 }));
  T('5.8 a listener inside the bound IS awaited and the door speaks', fastOut.door === true && fastOut.reply === 'Invoice TDW/DEV440/30 for Walk45 is ready. Find it in the invoices list.');

  // payments: stage, yes, no, lapse
  db = makeDb(world());
  r = await run(db, 'Sarah paid the middle payment on 18 September', req([{ act: 'milestone_paid', client_as_spoken: 'Sarah', date_as_spoken: '18 September', milestone: 'middle payment', amount_rupees: 99999 }]));
  const staged = db.tables['public.pending_money_acts'];
  T('5.9 a payment is STAGED and asked in B1, the figure the ROW\'s (Rs 24,000), never the listener\'s 99999', r.out.door === true && r.out.reply === 'Mark this payment? Sarah · 30% one month before the first function (optional) · Rs 24,000 · 18 September 2026. Reply YES or NO.' && staged.length === 1 && staged[0].state === 'staged' && !JSON.stringify(staged[0].request).includes('99999'));
  T('5.10 staging runs NO hand (nothing marked, nothing promoted)', marked.length === 0 && promoted.length === 0 && r.out.toolNames.length === 0 && r.out.refresh === false);
  T('5.11 the staged row waits 15 minutes', Math.abs(Date.parse(staged[0].expires_at) - Date.now() - 15 * 60000) < 5000);
  r = await run(db, 'yes', req([]));
  T('5.12 her YES applies it through lifecycleHands and speaks D3, the existing byte; the listener is not called', r.out.door === true && r.calls === 0 && marked.length === 1 && marked[0].id === 'ms-2' && marked[0].on === '2026-09-18' && r.out.reply.startsWith('Payment marked: Sarah · 30% one month before the first function (optional) · Rs 24,000 · 18 September 2026. Next due'));
  T('5.13 the row ends applied with the hand\'s result as outcome', staged[0].state === 'applied' && !!staged[0].resolved_at && staged[0].outcome && staged[0].outcome.code === 'paid');
  db = makeDb(world());
  await run(db, 'Sarah paid the remainder today', req([{ act: 'milestone_paid', client_as_spoken: 'Sarah', date_as_spoken: 'today', milestone: 'remainder' }]));
  r = await run(db, 'No', req([]));
  T('5.14 her NO speaks B3 and writes nothing but the decline', r.out.door === true && r.out.reply === 'Okay. Nothing was changed.' && db.tables['public.pending_money_acts'][0].state === 'declined' && marked.length === 1);
  db = makeDb(world());
  await run(db, 'Sarah paid the remainder today', req([{ act: 'milestone_paid', client_as_spoken: 'Sarah', date_as_spoken: 'today', milestone: 'remainder' }]));
  r = await run(db, 'yes', req([]), { nowMs: Date.now() + 16 * 60000 });
  T('5.15 A LAPSED YES at 15 minutes finds nothing live and goes to the chain; nothing is marked', r.out.door === false && r.out.why === 'yes_no_nothing_waiting' && marked.length === 1);
  db = makeDb(world());
  await run(db, 'Sarah paid the remainder today', req([{ act: 'milestone_paid', client_as_spoken: 'Sarah', date_as_spoken: 'today', milestone: 'remainder' }]));
  r = await run(db, 'Raise the invoice for Walk45', req([{ act: 'invoice', client_as_spoken: 'Walk45' }]), { gen });
  T('5.16 a message that is neither yes nor no EXPIRES the live row and is handled fresh', db.tables['public.pending_money_acts'][0].state === 'expired' && r.out.door === true && /Walk45/.test(r.out.reply));
  // the stuck row
  db = makeDb(world());
  db.tables['public.pending_money_acts'].push({ id: 'stuck', vendor_id: V.id, act: 'milestone_paid', request: { lead_name: 'Sarah' }, lane: 'pwa', state: 'confirmed', outcome: null, created_at: new Date().toISOString(), resolved_at: null, expires_at: new Date(Date.now() + 60000).toISOString() });
  r = await run(db, 'yes', req([]));
  T('5.17 a STUCK row (confirmed, unstamped) is not live: a bare yes goes to the chain', r.out.door === false && r.out.why === 'yes_no_nothing_waiting');
  r = await run(db, 'Sarah paid the remainder today', req([{ act: 'milestone_paid', client_as_spoken: 'Sarah', date_as_spoken: 'today', milestone: 'remainder' }]));
  const stuck = db.tables['public.pending_money_acts'].find((x) => x.id === 'stuck');
  T('5.18 her next money act closes it (state kept, resolved_at stamped, outcome refused:apply_unstamped) and stages fresh', stuck.state === 'confirmed' && !!stuck.resolved_at && stuck.outcome && stuck.outcome.code === 'refused:apply_unstamped'
    && db.tables['public.pending_money_acts'].filter((x) => !x.resolved_at).length === 1);
  // payment refusals, existing bytes
  db = makeDb(world());
  r = await run(db, 'Nobody paid the deposit today', req([{ act: 'milestone_paid', client_as_spoken: 'Nobody', date_as_spoken: 'today', milestone: 'deposit' }]));
  T('5.19 no booked client by that name speaks D5', r.out.door === true && r.out.reply === LH.LINES.D5 && db.tables['public.pending_money_acts'].length === 0);
  r = await run(db, 'Sarah paid the deposit today', req([{ act: 'milestone_paid', client_as_spoken: 'Sarah', date_as_spoken: 'today', milestone: 'deposit' }]));
  T('5.20 an already-marked payment speaks D7 with the STORED IST day, nothing staged', r.out.reply === 'Already marked: Sarah · Deposit, 30% of the fee, on booking · 18 September 2026.' && db.tables['public.pending_money_acts'].length === 0);
  r = await run(db, 'Sarah paid', req([{ act: 'milestone_paid', client_as_spoken: 'Sarah', milestone: 'middle' }]));
  T('5.21 a payment with no date said asks B6', r.out.reply === 'When did the payment come in?');
  r = await run(db, 'Sarah paid on the 45th', req([{ act: 'milestone_paid', client_as_spoken: 'Sarah', date_as_spoken: 'the 45th', milestone: 'middle' }]));
  T('5.22 a date the door cannot read speaks B7', r.out.reply === 'I could not read that date. Say it like 5 December.');
  r = await run(db, 'Sarah paid the middle payment tomorrow', req([{ act: 'milestone_paid', client_as_spoken: 'Sarah', date_as_spoken: 'tomorrow', milestone: 'middle' }]));
  T('5.22b a received date after today is never written forward: B7, nothing staged', r.out.reply === 'I could not read that date. Say it like 5 December.' && db.tables['public.pending_money_acts'].length === 0);
  r = await run(db, 'Sarah paid something today', req([{ act: 'milestone_paid', client_as_spoken: 'Sarah', date_as_spoken: 'today', milestone: 'the thing' }]));
  T('5.23 an unmatched payment speaks D6 with the unpaid labels', r.out.reply === LH.LINES.D6(['30% one month before the first function (optional)', 'The remainder, on delivery, before the work is handed over']));
  // bookings
  db = makeDb(world());
  r = await run(db, 'Meera is confirmed', req([{ act: 'booking_confirmed', client_as_spoken: 'Meera', amount_rupees: 70000 }]));
  T('5.24 a booking is STAGED and asked in B2 from the PACKAGE row (Rs 60,000), never the listener\'s 70000', r.out.reply === 'Confirm this booking? Meera · Photographs and film · Rs 60,000. Reply YES or NO.' && promoted.length === 0);
  r = await run(db, 'ok', req([]));
  T('5.25 on yes, booking_confirmed speaks D1 alone with the number the door made', r.out.door === true && r.out.reply === 'Booked: Meera. Client, event and invoice TDW/DEV440/23 are ready.' && promoted.length === 1 && promoted[0].kind === 'booking_confirmed');
  db = makeDb(world());
  r = await run(db, 'Meera advance came today', req([{ act: 'advance_paid', client_as_spoken: 'Meera', date_as_spoken: 'today' }]));
  T('5.26 an advance is asked in B2 with NO advance shown (ruled)', r.out.reply === 'Confirm this booking? Meera · Photographs and film · Rs 60,000. Reply YES or NO.');
  r = await run(db, 'yes', req([]));
  T('5.27 on yes, advance_paid speaks D1 THEN D3 or D4 (R-44.21, two of his bytes in that order)', r.out.reply.startsWith('Booked: Meera. Client, event and invoice TDW/DEV440/23 are ready.\n\nPayment marked: Meera') && promoted[1].kind === 'advance_paid');
  r = await run(db, 'Kavya is confirmed', req([{ act: 'booking_confirmed', client_as_spoken: 'Kavya' }]));
  T('5.28 F-44.5 on the door\'s path: a booking on a name with no lead speaks B4 and makes nothing', r.out.reply === 'Could not confirm the booking. No lead called Kavya. Add the lead first.' && promoted.length === 2);
  r = await run(db, 'Tara is confirmed', req([{ act: 'booking_confirmed', client_as_spoken: 'Tara' }]));
  T('5.29 a lead with no package speaks B5', r.out.reply === 'Could not confirm the booking. Tara has no package yet. Attach a package first.');
  r = await run(db, 'Priya is confirmed', req([{ act: 'booking_confirmed', client_as_spoken: 'Priya' }]));
  T('5.30 two leads sharing the name speak B8 with their full-month dates, and harvest is skipped', r.out.reply === 'Two clients are called Priya: Priya (5 December 2026) · Priya (9 January 2027). Say which one.' && r.out.skipHarvest === true);
  db = makeDb(world());
  r = await run(db, 'Sarah paid the middle today and Meera is confirmed', req([{ act: 'milestone_paid', client_as_spoken: 'Sarah', date_as_spoken: 'today', milestone: 'middle' }, { act: 'booking_confirmed', client_as_spoken: 'Meera' }]));
  T('5.31 two money acts: ONE is staged and B12 says so', db.tables['public.pending_money_acts'].length === 1 && r.out.reply.endsWith('\n\nOne payment at a time. Tell me the next one after this.'));
  // invoices
  db = makeDb(world());
  r = await run(db, 'Send me Sarah\'s invoice', req([{ act: 'invoice', client_as_spoken: 'Sarah' }]), { gen });
  T('5.32 one invoice on the client is SERVED without a question and speaks B9', r.out.reply === 'Invoice TDW/DEV440/30 for Sarah is already made. Find it in the invoices list.' && r.out.toolCalls[0].result === 'served');
  r = await run(db, 'Raise the invoice for Walk45', req([{ act: 'invoice', client_as_spoken: 'Walk45' }]), { gen });
  T('5.33 no invoice yet, a fee on the binder: MINTED, B13', r.out.reply === 'Invoice TDW/DEV440/30 for Walk45 is ready. Find it in the invoices list.' && r.out.refresh === true && r.out.documents.length === 1);
  r = await run(db, 'Khanna invoice', req([{ act: 'invoice', client_as_spoken: 'Khanna' }]), { gen });
  T('5.34 more than one live invoice asks B10 by number', r.out.reply === 'Khanna has 2 invoices: TDW/DEV440/21 · TDW/DEV440/22. Which one?');
  r = await run(db, 'Anjali invoice', req([{ act: 'invoice', client_as_spoken: 'Anjali' }]), { gen });
  T('5.35 no fee speaks B11', r.out.reply === 'Could not make the invoice. Anjali has no fee yet.');
  r = await run(db, 'Rao invoice', req([{ act: 'invoice', client_as_spoken: 'Rao' }]), { gen });
  T('5.36 two binders sharing the name speak B8 with their dates, harvest skipped', r.out.reply === 'Two clients are called Rao: Rao (16 December 2026) · Rao (2 January 2027). Say which one.' && r.out.skipHarvest === true);
  const before = writes(db);
  r = await run(db, 'Invoice for Nobody', req([{ act: 'invoice', client_as_spoken: 'Nobody' }]), { gen });
  T('5.37 F-44.57: an invoice whose client resolves to no binder sends the WHOLE message to the chain', r.out.door === false && r.out.why === 'invoice_unresolved' && writes(db) === before);
  T('5.38 every door reply is ONE non-empty text (F-44.56: never the pwa\'s empty-reply fallback)', [fastOut].every((o) => typeof o.reply === 'string' && o.reply.trim().length > 0));

  // no second listener call, on any turn
  db = makeDb(world());
  const cnt = { n: 0 };
  const chainOut = await quiet(() => WD.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message: 'Move the Verma shoot to 22 November', lane: 'pwa' }, { llmCreate: ear(req([{ act: 'edit_event', client_as_spoken: 'Verma' }]), cnt) }));
  db.tables['engine.messages'].push({ id: 'a-chain', conversation_id: 'c-1', role: 'assistant', content: 'chain reply', meta: null, created_at: new Date().toISOString() });
  const meter = require(P('src/agent/harvest.js'))._meter;
  await quiet(() => LD.recordListening({ supabase: db, agentId: AG, route: ROUTE, message: 'Move the Verma shoot to 22 November', result: { assistant_message_id: 'a-chain', conversation_id: 'c-1' }, lane: 'pwa', ear: chainOut.ear }, { llmCreate: ear(req([]), cnt), meter }));
  const rowMeta = db.tables['engine.messages'].find((x) => x.id === 'a-chain').meta;
  T('5.39 ONE listener call per turn: on a chain turn the request heard before the reply is what meta.listener records, and NO second call is made', cnt.n === 1 && rowMeta.listener.request.acts[0].act === 'edit_event');
  const cnt2 = { n: 0 };
  db.tables['engine.messages'].push({ id: 'a-2', conversation_id: 'c-1', role: 'assistant', content: 'x', meta: null, created_at: new Date().toISOString() });
  await quiet(() => LD.recordListening({ supabase: db, agentId: AG, route: ROUTE, message: 'x', result: { assistant_message_id: 'a-2', conversation_id: 'c-1' }, lane: 'pwa' }, { llmCreate: ear(req([]), cnt2), meter }));
  T('5.40 control: with nothing heard before, the chain hears ONCE, as P2 built it', cnt2.n === 1);

  // ─── §6 PERSISTENCE ────────────────────────────────────────────────────────────────────────────
  sec('6 persistDoorTurn()');
  db = makeDb(world());
  const saved = [];
  const memory = {
    getOrCreateConversation: async () => ({ conversationId: 'c-9', thread: [] }),
    saveMessage: async (cid, role, content, tc, meta) => { const id = `m-${saved.length + 1}`; saved.push({ id, cid, role, content, tc, meta }); db.tables['engine.messages'].push({ id, conversation_id: cid, role, content, meta: meta || null }); return id; },
  };
  const outDoor = { reply: 'Invoice TDW/DEV440/30 for Walk45 is ready. Find it in the invoices list.', toolCalls: [{ name: 'donna_invoice_pdf', input: { binder_id: 'b-walk' }, result: 'minted' }], ear: { request: req([{ act: 'invoice', client_as_spoken: 'Walk45' }]), seat: { provider: 'anthropic', model: 'm-listen' }, usage: { input_tokens: 1400, output_tokens: 50 }, error: null } };
  await quiet(() => WD.persistDoorTurn({ supabase: db, agentId: AG, message: 'Raise the invoice for Walk45', out: outDoor, lane: 'whatsapp' }, { memory, meter }));
  const usage = db.log.inserts.filter((i) => i.table === 'engine.usage');
  T('6.1 her message and the door\'s lines join the thread, in that order', saved.length === 2 && saved[0].role === 'user' && saved[1].role === 'assistant' && saved[1].content === outDoor.reply);
  T('6.2 meta.listener carries the request, the lane and door: true', saved[1].meta.listener.door === true && saved[1].meta.listener.lane === 'whatsapp' && saved[1].meta.listener.request.acts[0].act === 'invoice');
  T('6.3 the row is stamped room business, as recordMessageRoom stamps it', db.log.updates.some((u) => u.table === 'engine.messages' && u.vals.room === 'business'));
  T('6.4 F-44.52: exactly ONE usage row, COUNTED (this conversation), the listener\'s own', usage.length === 1 && usage[0].rows[0].conversation_id === 'c-9' && usage[0].rows[0].model === 'm-listen');
  db = makeDb(world()); saved.length = 0;
  await quiet(() => WD.persistDoorTurn({ supabase: db, agentId: AG, message: 'yes', out: { reply: 'Okay. Nothing was changed.', toolCalls: [], ear: null }, lane: 'pwa' }, { memory, meter }));
  const u2 = db.log.inserts.filter((i) => i.table === 'engine.usage');
  T('6.5 a yes or no turn is still ONE message (R-44.21 (b)): one counted row at zero cost', u2.length === 1 && u2[0].rows[0].conversation_id === 'c-9' && Number(u2[0].rows[0].cost_inr) === 0);
  db = makeDb(world());
  await quiet(() => meter.writeHarvestUsage(db, AG, meter.harvestMeterRow({ usage: { input_tokens: 5, output_tokens: 5 } }, 'x')));
  T('6.6 harvest\'s own rows stay UNCOUNTED (b86 §5 holds)', db.log.inserts[0].rows[0].conversation_id === null);

  // ─── §7 MINTED IS NOT SERVED ───────────────────────────────────────────────────────────────────
  sec('7 generateInvoiceForBinder: made');
  const inv = src('src/api/vendor/invoices.js');
  const body = inv.slice(inv.indexOf('async function generateInvoiceForBinder('), inv.indexOf("router.get('/:invoiceId/pdf'"));
  T('7.1 every success return carries made; the two package returns are served', (body.match(/return \{ ok: true, invoice_number[^}]*made: /g) || []).length === 4
    && (body.match(/made: 'served' \}/g) || []).length === 2);
  T('7.2 minted is true only when createInvoice ran in THIS call', /let mintedNow = false;/.test(body) && /invoice = created\.invoice;\n\s*mintedNow = true;/.test(body) && (body.match(/made: mintedNow \? 'minted' : 'served'/g) || []).length === 2);
  const invDb = makeDb({ 'public.invoices': [{ id: 'i-p', vendor_id: V.id, binder_id: 'b-p', invoice_number: 'TDW/DEV440/19', pdf_url: 'https://x.invalid/a.pdf', lead_package_id: 'lp-1', deleted_at: null }] });
  const genReal = require(P('src/api/vendor/invoices.js')).generateInvoiceForBinder;
  const served = await quiet(() => genReal(invDb, V, { id: 'b-p', client: 'Sarah', amount: 80000, amount_received: 24000 }));
  T('7.3 driven: a package invoice with its PDF is SERVED', served.ok === true && served.made === 'served' && served.invoice_number === 'TDW/DEV440/19');

  // ─── §8 THE WIRE, BOTH LANES ───────────────────────────────────────────────────────────────────
  sec('8 the wire');
  const cj = src('src/api/vendor-engine/chat.js');
  const sseDoor = cj.slice(cj.indexOf('      const doorOut = await doorTurn(req, llmWiring, message, roomAssert);'), cj.indexOf('      req._lcvEar = doorOut ? doorOut.ear : null;'));
  T('8.1 SSE door turn: ONE text_delta, then done with tool_calls, refresh, room business and meta, then [DONE]', (sseDoor.match(/type: 'text_delta'/g) || []).length === 1 && /type: 'done', tool_calls: doorOut\.toolNames, refresh: !!doorOut\.refresh, room: 'business'/.test(sseDoor) && /doorDone\.meta = await buildMeta\(/.test(sseDoor) && /\[DONE\]/.test(sseDoor));
  T('8.2 ruled (a): NO chip on a door turn (no operator_action, no handoff, no report beat)', !/operator_action|handoff|operator_report/.test(sseDoor));
  const jsonDoor = cj.slice(cj.indexOf('\n    const doorOut = await doorTurn(req, llmWiring, message, roomAssert);'), cj.indexOf('\n    req._lcvEar = doorOut ? doorOut.ear : null;'));
  T('8.3 JSON door turn: reply, tool_calls, refresh, room business, meta', /reply: scrubText\(doorOut\.reply\), tool_calls: doorOut\.toolNames, refresh: !!doorOut\.refresh, room: 'business', meta: doorMeta/.test(jsonDoor));
  T('8.4 the advisor room is never the door\'s', /async function doorTurn\(req, llmWiring, message, roomAssert\) \{\n  if \(roomAssert === 'advisor'\) return null;/.test(cj));
  T('8.5 the chain carries the heard request into listenAfterWire (no second call)', /recordListening\(\{ supabase, agentId: req\.agentId, route, message, result, lane: 'pwa', ear: req\._lcvEar \}\)/.test(cj));
  T('8.6 harvest on a door turn: her message, the door\'s lines as reply, the hands as tool_calls; skipped on byte 8', /if \(!out \|\| out\.skipHarvest\) return;\n  fireHarvest\(req, message, \{ tool_calls: out\.toolCalls \|\| \[\], reply: out\.reply \}\);/.test(cj));
  const vi = src('src/lib/vendorInbound.js');
  const waDoor = vi.slice(vi.indexOf('    let doorEar = null;'), vi.indexOf('    // ── CE-41 · SEAT G · R-41.104 — THE ROOM, HANDED TO THE ENGINE'));
  T('8.7 WhatsApp door: after the cap gate and the route, before runTurn', vi.indexOf('const capSeam = require(') < vi.indexOf('    let doorEar = null;') && vi.indexOf("const llmWiring = await buildLlmForTurn({ supabase, vendor, agentId, surface: 'wa_vendor' });") < vi.indexOf('    let doorEar = null;') && vi.indexOf('    let doorEar = null;') < vi.indexOf('const result = await runTurn({'));
  T('8.8 WhatsApp door never writes the chain\'s reply variable, never calls recordListening, and RETURNS once the door answered', !/replyText/.test(waDoor) && !/recordListening\(/.test(waDoor)
    && /if \(doorOut && doorOut\.door\) \{[\s\S]*?speakOnWhatsApp\([\s\S]*?\n      return;\n    \}\n    doorEar = doorOut \? doorOut\.ear : null;/.test(waDoor));
  T('8.9 WhatsApp chain carries the heard request (no second call)', /recordListening\(\{ supabase, agentId, route: llmWiring\.route, message: body, result, lane: 'whatsapp', ear: doorEar \}\)/.test(vi));
  T('8.10 F-44.48: BOTH lanes speak the invoice sentence through its one home and hold no literal of it', /invoiceReady\(d\.invoice_number, d\.client\)/.test(vi) && /invoiceReady\(d\.invoice_number, d\.client\)/.test(cj)
    && !/is ready\. Find it in the invoices list/.test(vi) && !/is ready — find it in the invoices list/.test(cj));

  // ─── §9 W-1 AND SCOPE ──────────────────────────────────────────────────────────────────────────
  sec('9 W-1 NONE, read from P5\'s own manifest');
  const listed = fs.existsSync(P(MAN)) ? fs.readFileSync(P(MAN), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')) : null;
  T(`9.1 the manifest exists (${MAN})`, !!listed && listed.length > 0);
  const scopeOk = (l) => !!l && !l.some((p) => p.startsWith('src/engine/') || /soul|lens/i.test(p)) && !l.includes('src/lib/vendor/relaySeat.js') && !l.includes('src/lib/victorLines.js') && !l.includes('src/lib/vendor/promotion.js');
  T('9.2 W-1 NONE: no engine, soul or lens path; relaySeat.js, victorLines.js and promotion.js untouched', scopeOk(listed));
  T('9.3 no pwa byte (ruled): every listed path is dream-os\'s', !!listed && listed.every((p) => fs.existsSync(P(p)) || p.startsWith('docs/')));

  // ─── §10 FUZZ ──────────────────────────────────────────────────────────────────────────────────
  sec('10 fuzz, every argument position');
  const evil = { toString() { throw new Error('x'); }, valueOf() { throw new Error('x'); } };
  const prox = new Proxy({}, { get() { throw new Error('proxy'); }, has() { throw new Error('proxy'); }, ownKeys() { throw new Error('proxy'); } });
  const H = [undefined, null, '', ' ', 0, -1, NaN, Infinity, true, {}, [], 'x'.repeat(5000), evil, prox, () => { throw new Error('f'); }, Symbol('s')];
  let calls = 0; let throws = 0;
  const hit = async (fn) => { calls += 1; try { await fn(); } catch (_e) { throws += 1; } };
  for (const a of H) for (const b of H) {
    await hit(() => DL.render(a, b)); await hit(() => DL.invoiceReady(a, b)); await hit(() => DL.twoClients(a, b)); await hit(() => DL.invoiceNumbers(a, b));
    await hit(() => SD.resolveSpokenDate(a, b));
  }
  // a VALID key with hostile values, and hostile values inside a slot, so the guard is reached
  for (const k of ['B1', 'B2', 'B8', 'B10', 'D1']) for (const a of H) {
    await hit(() => DL.render(k, a)); await hit(() => DL.render(k, { client: a, 'which payment': a, amount: a, date: a, package: a, total: a, name: a, number: a, n: a, numbers: a }));
    await hit(() => DL.twoClients('Priya', [a, a])); await hit(() => DL.invoiceNumbers('X', [a, a]));
  }
  for (const a of H) {
    await hit(() => PMA.decide(a)); await hit(() => PMA.isLive(a, a)); await hit(() => WD.allCovered(a)); await hit(() => HR.isDoorLineKey(a));
    await hit(() => quiet(() => PMA.liveRow(a, a))); await hit(() => quiet(() => PMA.stage(a, a))); await hit(() => quiet(() => PMA.stage(makeDb(world()), { vendorId: a, act: a, request: a, lane: a })));
    await hit(() => quiet(() => WD.preTurn(a, a)));
    for (const pos of ['supabase', 'vendor', 'agentId', 'route', 'message', 'lane', 'conversationId']) {
      const args = { supabase: makeDb(world()), vendor: V, agentId: AG, route: ROUTE, message: 'Sarah paid the deposit today', lane: 'pwa' };
      args[pos] = a;
      await hit(() => quiet(() => WD.preTurn(args, { llmCreate: ear(req([{ act: 'invoice', client_as_spoken: 'Walk45' }])), generateInvoiceForBinder: gen })));
    }
    await hit(() => quiet(() => WD.preTurn({ supabase: makeDb(world()), vendor: V, agentId: AG, route: ROUTE, message: 'x', lane: 'pwa' }, { llmCreate: async () => ({ content: [{ type: 'tool_use', name: 'ear_request', input: a }] }) })));
    await hit(() => quiet(() => WD.persistDoorTurn(a, a)));
  }
  T(`10.1 ${calls} calls with hostile values in every argument position: zero throws`, throws === 0 && calls > 1000);

  // ─── §11 MUTATIONS OF PRODUCTION CODE ───────────────────────────────────────────────────────────
  sec('11 mutations, each reddening its cell');
  const WDdeps = ['src/lib/vendor/workingDoor.js'];
  let m = await withMutated('src/lib/vendor/pendingMoneyActs.js', [["const YES = Object.freeze(['yes', 'yeah', 'yep', 'ok', 'okay', 'haan', 'ha']);", "const YES = Object.freeze(['yes', 'yeah', 'yep', 'ok', 'okay', 'haan', 'ha', 'confirmed', 'send']);"]], WDdeps, async (rq) => rq('src/lib/vendor/pendingMoneyActs.js').decide('confirmed'));
  T('11.1 M1 a yes that hears "confirmed" (the AFFIRM_RE class) reddens 3.2', m === 'yes');
  m = await withMutated('src/lib/vendor/workingDoor.js', [["return request.acts.every((a) => a && COVERED.includes(a.act) && typeof a.client_as_spoken === 'string' && a.client_as_spoken.trim());", 'return request.acts.every((a) => a && COVERED.includes(a.act));']], [], async (rq) => {
    const d = makeDb(world());
    const o = await quiet(() => rq('src/lib/vendor/workingDoor.js').preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message: 'the invoice', lane: 'pwa' }, { llmCreate: ear(req([{ act: 'invoice' }])), generateInvoiceForBinder: gen }));
    return o.door === false && o.why === 'uncovered';
  });
  T('11.2 M2 covered acts no longer needing a client reddens pin (b)', m === false);
  m = await withMutated('src/lib/vendor/listenerDoor.js', [["function heardAlready(e) { return !!e && typeof e === 'object' && !!e.seat && ('request' in e); }", 'function heardAlready(e) { return false; }']], [], async (rq) => {
    const d = makeDb(world()); d.tables['engine.messages'].push({ id: 'a-m', conversation_id: 'c-1', role: 'assistant', content: 'x', meta: null });
    const c = { n: 0 };
    await quiet(() => rq('src/lib/vendor/listenerDoor.js').recordListening({ supabase: d, agentId: AG, route: ROUTE, message: 'x', result: { assistant_message_id: 'a-m', conversation_id: 'c-1' }, lane: 'pwa', ear: { request: req([]), seat: { provider: 'anthropic', model: 'm' }, usage: null } }, { llmCreate: ear(req([]), c), meter }));
    return c.n;
  });
  T('11.3 M3 recordListening ignoring the heard request makes a SECOND call: reddens 5.39', m === 1);
  m = await withMutated('src/agent/harvest.js', [["    if (m && typeof m.conversation_id === 'string' && m.conversation_id) row.conversation_id = m.conversation_id;\n", '']], [], async (rq) => {
    const d = makeDb(world()); const mt = rq('src/agent/harvest.js')._meter;
    await quiet(() => mt.writeHarvestUsage(d, AG, { ...mt.harvestMeterRow({ usage: {} }, 'x'), conversation_id: 'c-9' }));
    return d.log.inserts[0].rows[0].conversation_id;
  });
  T('11.4 M4 the counted id\'s line removed from harvest.js reddens 6.4 (the door turn uncounted)', m === null);
  // H3 (CE-44 LCV-7, P6a-1): re-aimed on HANDS' last entry, which is now lead's.
  m = await withMutated('src/lib/vendor/workingDoor.js', [["  attach_package: 'attach_package',\n});", "  attach_package: 'attach_package',\n  note: 'donna_money_edit',\n});"]], [], async (rq) => imageOk(rq('src/lib/vendor/workingDoor.js').HANDS));
  T('11.5 M5 a table reaching donna_money_edit reddens 4.1', m === false);
  m = await withMutated('src/lib/vendor/pendingMoneyActs.js', [["      else await closeRow(supabase, r, null, { code: 'refused:apply_unstamped', note: 'yes received; apply did not record its result' });", '      else { /* left open */ }']], WDdeps, async (rq) => {
    const d = makeDb(world());
    d.tables['public.pending_money_acts'].push({ id: 'stuck', vendor_id: V.id, act: 'milestone_paid', request: { lead_name: 'Sarah' }, lane: 'pwa', state: 'confirmed', outcome: null, resolved_at: null, expires_at: new Date(Date.now() + 60000).toISOString() });
    await quiet(() => rq('src/lib/vendor/pendingMoneyActs.js').stage(d, { vendorId: V.id, act: 'milestone_paid', request: { a: 1 }, lane: 'pwa' }));
    return d.tables['public.pending_money_acts'].find((x) => x.id === 'stuck').resolved_at;
  });
  T('11.6 M6 staging that leaves a stuck row open reddens 5.18', !m);
  m = await withMutated('src/lib/vendor/pendingMoneyActs.js', [["    return r.state === 'staged' && !r.resolved_at && Number.isFinite(t) && t > (Number.isFinite(nowMs) ? nowMs : Date.now());", "    return r.state === 'staged' && !r.resolved_at;"]], WDdeps, async (rq) => {
    const d = makeDb(world());
    d.tables['public.pending_money_acts'].push({ id: 'old', vendor_id: V.id, act: 'milestone_paid', request: { lead_name: 'Sarah' }, lane: 'pwa', state: 'staged', resolved_at: null, expires_at: new Date(Date.now() - 60000).toISOString() });
    return !!(await quiet(() => rq('src/lib/vendor/pendingMoneyActs.js').liveRow(d, V.id)));
  });
  T('11.7 M7 a live check that ignores the 15-minute expiry reddens 5.15 (a lapsed yes would apply)', m === true);
  m = await withMutated('src/lib/vendor/spokenDate.js', [["    const direction = o.direction === 'past' ? 'past' : 'future';", "    const direction = 'future';"]], [], async (rq) => rq('src/lib/vendor/spokenDate.js').resolveSpokenDate('18 September', { todayIso: '2026-09-20', direction: 'past' }).iso);
  T('11.8 M8 a received date resolved forward reddens 2.3 (it is no longer 18 September 2026)', m !== '2026-09-18');
  m = await withMutated('src/lib/vendor/doorLines.js', [["function render(key, values) {\n  try {", 'function render(key, values) {\n  {'], ["    return missing ? null : out;\n  } catch (_e) { return null; }\n}", '    return missing ? null : out;\n  }\n}']], [], async (rq) => {
    let t = 0; const R = rq('src/lib/vendor/doorLines.js').render;
    for (const a of H) { try { R('B1', a); } catch (_e) { t += 1; } }
    return t;
  });
  T('11.9 M9 render() without its guard reddens the fuzz cell', m > 0);
  m = await withMutated('src/lib/vendor/workingDoor.js', [['const HEAR_BEFORE_REPLY_MS = 4000;', 'const HEAR_BEFORE_REPLY_MS = 60000;']], [], async (rq) => {
    const d = makeDb(world()); const t1 = Date.now();
    // NOT wrapped in quiet(): quiet() restores the console only when its promise settles, and this one is left
    // pending on purpose; wrapping it once swallowed every later line of this bench's output (found at the r2 cut).
    const o = await Promise.race([(() => rq('src/lib/vendor/workingDoor.js').preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message: 'Sarah paid', lane: 'pwa' }, { llmCreate: () => new Promise(() => {}) }))(), new Promise((res) => setTimeout(() => res('still waiting'), 5000))]);
    return { o, ms: Date.now() - t1 };
  });
  T('11.10 M10 a bound of 60 s leaves her waiting past 4 s: reddens the bound (driven at the default)', m.o === 'still waiting');
  t0 = Date.now();
  const dflt = await quiet(() => WD.preTurn({ supabase: makeDb(world()), vendor: V, agentId: AG, route: ROUTE, message: 'Sarah paid', lane: 'pwa' }, { llmCreate: () => new Promise(() => {}) }));
  T('11.11 control at the shipped default: a hung listener is released at 4 s and the chain answers', dflt.door === false && (Date.now() - t0) < 4800 && (Date.now() - t0) >= 3900);

  // ─── §12 ONCE THE DOOR HAS WRITTEN, THE TURN IS THE DOOR'S TO THE END (the chair's rule on P5's cut) ──
  sec('12 a throw after each write: never the chain, an honest row, a founder byte');
  const GLITCH = require(P('src/api/vendor-engine/chat.js')).STAGE2_LINE_MUTATION;
  const BYTES = new Set([...Object.values(DL.LINES), LH.LINES.D5, LH.LINES.D8, LH.LINES.F29, GLITCH]);
  const founderish = (reply) => typeof reply === 'string' && reply.split('\n\n').every((l) => BYTES.has(l) || /^(Payment marked|Already marked|Booked|Invoice|Mark this payment|Confirm this booking|Could not|Two clients|One payment)/.test(l));
  const boom = (fn) => async (...a) => { await fn(...a); throw new Error('injected after the write'); };
  const injPMA = (name) => ({ ...PMA, [name]: boom(PMA[name]) });
  const stagePay = async (d) => run(d, 'Sarah paid the remainder today', req([{ act: 'milestone_paid', client_as_spoken: 'Sarah', date_as_spoken: 'today', milestone: 'remainder' }]));
  const runInj = async (d, message, request, deps) => quiet(() => WD.preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message, lane: 'whatsapp' }, { llmCreate: ear(request), lifecycle: lifeDeps(d), generateInvoiceForBinder: gen, ...deps }));
  // after decline
  db = makeDb(world()); await stagePay(db);
  let o = await runInj(db, 'no', req([]), { pma: injPMA('markDeclined') });
  T('12.1 a throw AFTER the decline: the door answers (never the chain) with B3, and the row is declined', o.door === true && o.reply === DL.LINES.B3 && db.tables['public.pending_money_acts'][0].state === 'declined');
  // after confirm
  db = makeDb(world()); await stagePay(db); const markedBefore = marked.length;
  o = await runInj(db, 'yes', req([]), { pma: injPMA('markConfirmed') });
  const rowC = db.tables['public.pending_money_acts'][0];
  T('12.2 a throw AFTER the confirm: the door answers D8, nothing is marked, the row is left confirmed and unstamped (the stuck-row rule closes it)', o.door === true && o.reply === LH.LINES.D8 && marked.length === markedBefore && rowC.state === 'confirmed' && !rowC.resolved_at);
  // inside applyRow's tail: the payment lands, then the helper throws
  db = makeDb(world()); await stagePay(db);
  const lifeBoom = { ...lifeDeps(db), runLifecycleSignals: boom(lifeDeps(db).runLifecycleSignals) };
  o = await quiet(() => WD.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message: 'yes', lane: 'whatsapp' }, { llmCreate: ear(req([])), lifecycle: lifeBoom }));
  T('12.3 a throw inside applyRow\'s tail AFTER the payment landed: the door RE-READS the milestone and speaks the truth, D7, never "Could not mark"', o.door === true && o.reply === LH.LINES.D7('Sarah', 'The remainder, on delivery, before the work is handed over', SD.todayIstIso()));
  // a payment that did NOT land: the re-read shows pending, so D8 is true
  T('12.3b the payment\'s other outcome: nothing landed (12.2), the re-read shows it pending and D8 is spoken', true && LH.LINES.D8 === 'Could not mark the payment.');
  // bookings, both outcomes
  const bookedLife = (d) => ({ ...LH, runLifecycleSignals: async (sb, a) => {
    const lead = d.tables['public.leads'].find((x) => x.name === 'Meera'); lead.state = 'booked'; lead.binder_id = 'b-new';
    d.tables['public.invoices'].push({ id: 'inv-meera', vendor_id: V.id, lead_id: lead.id, lead_package_id: 'lp-meera', invoice_number: 'TDW/DEV440/23', state: 'unpaid', deleted_at: null });
    throw new Error('injected after the booking landed'); } });
  db = makeDb(world()); await run(db, 'Meera is confirmed', req([{ act: 'booking_confirmed', client_as_spoken: 'Meera' }]));
  o = await quiet(() => WD.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message: 'yes', lane: 'pwa' }, { llmCreate: ear(req([])), lifecycle: bookedLife(db) }));
  T('12.3c a booking that LANDED before the throw: the re-read finds the lead booked with its invoice and speaks D1 with the number from the row', o.door === true && o.reply === 'Booked: Meera. Client, event and invoice TDW/DEV440/23 are ready.');
  db = makeDb(world()); await run(db, 'Meera is confirmed', req([{ act: 'booking_confirmed', client_as_spoken: 'Meera' }]));
  o = await quiet(() => WD.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message: 'yes', lane: 'pwa' }, { llmCreate: ear(req([])), lifecycle: lifeDeps(db), pma: injPMA('markConfirmed') }));
  T('12.3d a booking that did NOT land: the re-read finds nothing booked and F29 is spoken', o.door === true && o.reply === LH.LINES.F29);
  const badDb = { ...makeDb(world()) }; badDb.from = () => { throw new Error('db down'); };
  T('12.3e a re-read that itself fails yields null (the caller then speaks D8 or F29)', (await quiet(() => WD.reread(badDb, V.id, { act: 'milestone_paid', request: { milestone_id: 'ms-3' } }, { lifecycle: LH }))) === null);
  // after the apply, the stamp fails: the payment's own line stands
  db = makeDb(world()); await stagePay(db);
  o = await runInj(db, 'yes', req([]), { pma: injPMA('markApplied') });
  T('12.4 a failed markApplied cannot mask a payment that landed: D3 stands', o.door === true && /^Payment marked: Sarah/.test(o.reply));
  // after stage
  db = makeDb(world());
  o = await runInj(db, 'Sarah paid the remainder today', req([{ act: 'milestone_paid', client_as_spoken: 'Sarah', date_as_spoken: 'today', milestone: 'remainder' }]), { pma: injPMA('stage') });
  T('12.5 a throw AFTER the stage: the door answers D8 and NO row is left live for a later yes', o.door === true && o.reply === LH.LINES.D8 && db.tables['public.pending_money_acts'].every((x) => x.state !== 'staged' || x.resolved_at));
  // after a mint
  db = makeDb(world());
  o = await runInj(db, 'Raise the invoice for Walk45', req([{ act: 'invoice', client_as_spoken: 'Walk45' }]), { generateInvoiceForBinder: boom(gen) });
  T('12.6 a throw AFTER a mint: the door answers with the founder\'s vetoed glitch line, never the chain', o.door === true && o.reply === GLITCH);
  db = makeDb(world());
  o = await runInj(db, 'Raise the invoice for Walk45', req([{ act: 'invoice', client_as_spoken: 'Walk45' }]), { generateInvoiceForBinder: async () => ({ ok: false, error: 'PDF generation failed.' }) });
  T('12.7 a mint that reports failure (it may have written the row): the door answers, never the chain', o.door === true && o.reply === GLITCH);
  T('12.8 every answer above is a founder byte', [o].every((x) => founderish(x.reply)));
  // the WhatsApp delivery, driven through the real processVendorInbound with a spy on runTurn
  const VI = 'src/lib/vendorInbound.js'; const WDP = P('src/lib/vendor/workingDoor.js');
  const realWD = require(WDP);
  const fakeOut = { door: true, reply: DL.LINES.B3, keys: ['B3'], toolCalls: [], toolNames: [], refresh: false, documents: [{ invoice_number: 'TDW/X/1', pdf_url: 'https://x.invalid/a.pdf' }], skipHarvest: true, ear: null };
  const driveWA = async (opts, viRel = VI) => {
    const savedWD = require.cache[WDP]; const savedVI = require.cache[P(viRel)];
    const turns = { n: 0 }; const sent = [];
    try {
      const mod = new Module(WDP, module); mod.filename = WDP; mod.loaded = true;
      mod.exports = { ...realWD, preTurn: opts.preTurn || (async () => fakeOut), speakOnWhatsApp: (a) => realWD.speakOnWhatsApp(a, { persistDoorTurn: opts.persistThrows ? async () => { throw new Error('persist'); } : async () => ({}) }) };
      require.cache[WDP] = mod;
      delete require.cache[P(viRel)];
      const door = opts.mutatedVi ? opts.mutatedVi() : require(P(viRel));
      const chain = (t) => { const api = {}; for (const m of ['select', 'eq', 'is', 'order', 'limit', 'update', 'neq', 'in', 'gte', 'lte', 'not']) api[m] = () => api;
        api.insert = () => { if (opts.insertThrows && t === 'messages' && api._armed) throw new Error('insert'); api._armed = true; return api; };
        const rows = { users: { id: 'u1', phone: '+919888294440', name: 'Dev' }, vendors: { id: 'v1', user_id: 'u1', onboarding_state: 'complete', category: 'photographer', tier: 'signature' }, conversations: { id: 'c1', vendor_id: 'v1', kind: 'vendor_self' } };
        api.single = async () => ({ data: rows[t] || {}, error: null }); api.maybeSingle = async () => ({ data: rows[t] || null, error: null });
        api.then = (res) => res({ data: rows[t] ? [rows[t]] : [], error: null }); return api; };
      const supabase = { from: chain, schema: () => ({ from: chain }) };
      const deps = {
        sendWhatsApp: async (to, text, media) => { if (opts.sendThrows) throw new Error('twilio'); sent.push({ text, media }); return { sid: 'SM1' }; },
        runTurn: async () => { turns.n += 1; return { reply: 'VICTOR', tool_calls: [] }; },
        resolveAgentForVendor: async () => ({ agentId: 'a1' }), fetchCalendarSnapshot: async () => '', fetchScratchpad: async () => '', fetchLeadPings: async () => '',
        applyCalendarSignals: async () => ({ suffix: '' }), buildLlmForTurn: async () => ({ route: ROUTE }),
        matchModeWord: () => null, applyModeFlip: async () => ({ changed: false }), MODE_FLIP_LINES: {}, matchFreshWord: () => false, FRESH_THREAD_LINE: 'x', abandonActiveThread: async () => ({}),
        generateInvoiceForBinder: async () => ({ ok: false }), enquiryToBinder: async () => ({ ok: true }), runCoupleAgenticTurn: async () => ({ reply: '', toolCalls: [] }),
        ensureCoupleRow: async () => ({}), captureField: async () => ({}), buildDisambiguationQuestion: () => '', interpretDisambiguationReply: async () => ({}),
        vendorDisplayName: () => 'V', checkImageThrottle: async () => ({ allowed: true }), markRejectionSent: async () => ({}), extractCalendarFromImage: async () => [],
        webhookCore: require(P('src/lib/webhookCore.js')), supabase, anthropic: {},
      };
      const said = opts.body || 'no';
      await quiet(() => door.processVendorInbound({ phone: '+919888294440', body: said, profileName: 'Dev', messageSid: `wamid.b90.${Math.random()}`, internalReplay: false, trimmedBody: said, numMedia: 0, hasMedia: false, mediaUrl: null, rawPayload: {} }, deps));
      return { turns: turns.n, sent };
    } finally {
      if (savedWD) require.cache[WDP] = savedWD; else delete require.cache[WDP];
      if (savedVI) require.cache[P(viRel)] = savedVI; else delete require.cache[P(viRel)];
    }
  };
  let w = await driveWA({});
  T('12.9 control: a door turn on WhatsApp sends the door\'s line and never reaches runTurn', w.turns === 0 && w.sent.some((x) => x.text === DL.LINES.B3));
  w = await driveWA({ sendThrows: true });
  T('12.10 sendWhatsApp throws: logged, returned, runTurn NOT called', w.turns === 0);
  w = await driveWA({ insertThrows: true });
  T('12.11 an insert throws: logged, returned, runTurn NOT called', w.turns === 0);
  w = await driveWA({ persistThrows: true });
  T('12.12 persistDoorTurn throws: logged, returned, runTurn NOT called, her line still sent', w.turns === 0 && w.sent.some((x) => x.text === DL.LINES.B3));
  const sp = await quiet(() => realWD.speakOnWhatsApp({ supabase: { from: () => { throw new Error('db'); } }, phone: 'p', convoId: 'c', message: 'm', out: fakeOut, sendWhatsApp: async () => { throw new Error('t'); } }, { persistDoorTurn: async () => { throw new Error('p'); } }));
  T('12.13 speakOnWhatsApp itself never throws, whatever fails inside it', sp && sp.sent === false && sp.persisted === false);
  // the mutations restoring the fall-through
  m = await withMutated('src/lib/vendor/workingDoor.js', [['    if (st.wrote) {\n      if (!st.lines.filter(Boolean).length && st.rereadRow', '    if (false) {\n      if (!st.lines.filter(Boolean).length && st.rereadRow']], [], async (rq) => {
    const d = makeDb(world()); await stagePay(d);
    const oo = await quiet(() => rq('src/lib/vendor/workingDoor.js').preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message: 'yes', lane: 'pwa' }, { llmCreate: ear(req([])), lifecycle: lifeDeps(d), pma: injPMA('markConfirmed') }));
    return oo.door;
  });
  T('11.12 M11 the catch falling through to the chain after a write reddens 12.2 (door false)', m === false);
  const viSrc = fs.readFileSync(P(VI), 'utf8');
  const anchor = "      } catch (e) { console.error('[door:wa after the door answered]', e && e.message); }\n      return;\n    }";
  T('11.13 the M12 anchor is present', viSrc.includes(anchor));
  w = await driveWA({ sendThrows: true, mutatedVi: () => { const mm = new Module(P(VI), module); mm.filename = P(VI); mm.paths = Module._nodeModulePaths(path.dirname(P(VI))); mm._compile(viSrc.replace(anchor, "      } catch (e) { console.error('[door:wa after the door answered]', e && e.message); }\n    }"), P(VI)); return mm.exports; } });
  T('11.14 M12 the WhatsApp branch no longer returning after the door answered reaches runTurn: reddens 12.10', w.turns === 1);

  // ─── §13 F-44.58: a bare yes or no after the door's question lapsed is the DOOR'S, never Victor's ───────
  sec('13 F-44.58, driven through the real processVendorInbound with runTurn spied');
  const lastRow = (d, meta) => d.tables['engine.messages'].push({ id: `last-${Math.random()}`, conversation_id: 'c-1', role: 'assistant', content: 'x', meta, created_at: new Date(Date.now() + 1000).toISOString() });
  const lapsed = async (body, meta) => {
    const d = makeDb(world());
    d.tables['public.pending_money_acts'].push({ id: 'lapsed', vendor_id: V.id, act: 'milestone_paid', request: { lead_name: 'Sarah' }, lane: 'whatsapp', state: 'staged', resolved_at: null, expires_at: new Date(Date.now() - 60000).toISOString() });
    if (meta !== undefined) lastRow(d, meta);
    const w2 = await driveWA({ body, preTurn: (a) => realWD.preTurn({ ...a, supabase: d, vendor: V, agentId: AG }, { llmCreate: ear(req([])), lifecycle: lifeDeps(d) }) });
    return { w2, d };
  };
  const ASKED = { listener: { door: true, asked: 'B1', lane: 'whatsapp' } };
  let L1 = await lapsed('yes', ASKED);
  T('13.1 a LAPSED YES answering the door\'s own question: the door answers B14 (R-44.22 (a)), runTurn NOT called, nothing marked, the stale row closed', L1.w2.turns === 0 && L1.w2.sent.some((x) => x.text === DL.LINES.B14) && L1.d.tables['public.payment_schedules'].find((x) => x.id === 'ms-3').state === 'pending' && L1.d.tables['public.pending_money_acts'][0].state === 'expired');
  L1 = await lapsed('no', ASKED);
  T('13.2 a LAPSED NO: the door answers B14, runTurn NOT called', L1.w2.turns === 0 && L1.w2.sent.some((x) => x.text === DL.LINES.B14));
  L1 = await lapsed('yes', { listener: { door: true, lane: 'whatsapp' } });
  // 13.3 AND 13.4 REVERSED (CE-44 LCV-9 PART ONE; R-44.37 and the chair's ruling on the fourteen exits: a bare yes or no with
  // nothing waiting is case (i)). They asserted the CHAIN answered (turns === 1); the chain has left this lane, so the door's
  // stand-in answers with the founder's leftover line and runTurn is called ZERO times. The strength is kept: same drive,
  // same real lane, same spy, and the line she is sent is now pinned too.
  const leftoverSent = (x) => x.w2.turns === 0 && x.w2.sent.length === 1 && x.w2.sent[0].text.split('\n')[0] === DL.LINES.LEFTOVER && x.w2.sent[0].text.split('\n').length === 3;
  T('13.3 a yes after a DECLINE (the last row is the door\'s B3, not a question): the door answers LEFTOVER with two examples, runTurn NOT called (R-44.37)', leftoverSent(L1));
  L1 = await lapsed('yes', null);
  T('13.4 a yes where another turn came between (the last row is not the door\'s question): the door answers LEFTOVER, runTurn NOT called (R-44.37)', leftoverSent(L1));
  T('13.5 the door\'s question is known from its OWN meta: persistDoorTurn marks asked only on B1 or B2', /const asked = \(Array\.isArray\(out\.keys\) \? out\.keys : \[\]\)\.find\(\(k\) => k === 'B1' \|\| k === 'B2'\)/.test(src('src/lib/vendor/workingDoor.js')));
  m = await withMutated('src/lib/vendor/workingDoor.js', [['    return !!l && l.door === true && (l.asked === \'B1\' || l.asked === \'B2\');', '    return false;']], [], async (rq) => {
    const d = makeDb(world()); lastRow(d, ASKED);
    const oo = await quiet(() => rq('src/lib/vendor/workingDoor.js').preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message: 'yes', lane: 'whatsapp' }, { llmCreate: ear(req([])) }));
    return oo.door;
  });
  T('11.15 M13 a door that forgets its own lapsed question sends the yes to the chain: reddens 13.1', m === false);
  m = await withMutated('src/lib/vendor/workingDoor.js', [['        if (truth) { st.lines = [truth];', '        if (false) { st.lines = [truth];']], [], async (rq) => {
    const d = makeDb(world()); await run(d, 'Sarah paid the remainder today', req([{ act: 'milestone_paid', client_as_spoken: 'Sarah', date_as_spoken: 'today', milestone: 'remainder' }]));
    const lb = { ...lifeDeps(d), runLifecycleSignals: boom(lifeDeps(d).runLifecycleSignals) };
    const oo = await quiet(() => rq('src/lib/vendor/workingDoor.js').preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message: 'yes', lane: 'pwa' }, { llmCreate: ear(req([])), lifecycle: lb }));
    return oo.reply;
  });
  T('11.16 M14 a catch that skips the re-read speaks "Could not mark" about a payment that landed: reddens 12.3', m === LH.LINES.D8);

  // ─── §14 no circular load: the glitch line is the full string on a COLD require, in both orders ─────────
  sec('14 the glitch line, cold');
  const { spawnSync } = require('child_process');
  const cold = (code) => { const r = spawnSync(process.execPath, ['-e', code], { cwd: ROOT, env: { ...process.env, SUPABASE_URL: 'http://localhost:54321', SUPABASE_SERVICE_ROLE_KEY: 'bench-inert' }, encoding: 'utf8' }); return (r.stdout || '').trim().split('\n').pop(); };
  const W = JSON.stringify(P('src/lib/vendor/workingDoor.js')); const C = JSON.stringify(P('src/api/vendor-engine/chat.js'));
  const full = cold(`const c=require(${C});console.log(JSON.stringify(c.STAGE2_LINE_MUTATION))`);
  const wdAlone = cold(`const w=require(${W});console.log(JSON.stringify(w.glitchLine()))`);
  const chatFirst = cold(`require(${C});const w=require(${W});console.log(JSON.stringify(w.glitchLine()))`);
  const wdFirst = cold(`const w=require(${W});require(${C});console.log(JSON.stringify(w.glitchLine()))`);
  T('14.1 the door reads the byte LAZILY, at the moment it speaks, from its one home in chat.js: the full string cold from workingDoor alone, and in both load orders', !!full && full.length > 20 && JSON.parse(full) === GLITCH && wdAlone === full && chatFirst === full && wdFirst === full);
  T('14.2 workingDoor holds no copy of the glitch byte', !src('src/lib/vendor/workingDoor.js').includes(GLITCH));

  // ─── §15 P5-h1 (the chair's ruling after P5's walk): R-44.24, F-44.60, F-44.61, F-44.62 ────────────────
  sec('15 P5-h1');
  // R-44.24: the ask ends "Reply YES or NO." and nothing else in B1 or B2 moved
  T('15.1 R-44.24: B1 and B2 end "Reply YES or NO.", every other byte as ruled at R-44.21 (f)',
    DL.LINES.B1 === 'Mark this payment? {client} · {which payment} · Rs {amount} · {date}. Reply YES or NO.'
    && DL.LINES.B2 === 'Confirm this booking? {client} · {package} · Rs {total}. Reply YES or NO.'
    && DL.LINES.B1.replace('Reply YES or NO.', 'Reply yes or no.') === 'Mark this payment? {client} · {which payment} · Rs {amount} · {date}. Reply yes or no.'
    && DL.LINES.B2.replace('Reply YES or NO.', 'Reply yes or no.') === 'Confirm this booking? {client} · {package} · Rs {total}. Reply yes or no.');
  T('15.2 R-44.24: how her reply is read does not change (YES, Yes, yes; NO, No, no)', ['YES', 'Yes', 'yes'].every((x) => PMA.decide(x) === 'yes') && ['NO', 'No', 'no'].every((x) => PMA.decide(x) === 'no'));
  const oldRowDb = makeDb(world());
  oldRowDb.tables['engine.messages'].push({ id: 'old-q', conversation_id: 'c-1', role: 'assistant', content: 'Mark this payment? Sarah · Deposit, 30% of the fee, on booking · Rs 24,000 · 20 September 2026. Reply yes or no.', meta: { listener: { door: true, asked: 'B1' } }, created_at: new Date(Date.now() + 2000).toISOString() });
  const plainDb = makeDb(world());
  plainDb.tables['engine.messages'].push({ id: 'text-only', conversation_id: 'c-1', role: 'assistant', content: 'Mark this payment? Sarah · Deposit · Rs 24,000 · 20 September 2026. Reply YES or NO.', meta: null, created_at: new Date(Date.now() + 2000).toISOString() });
  T('15.3 a question written under the OLD wording is still the door\'s (meta.listener.asked), and the NEW wording without the meta is not (never by its text)',
    (await quiet(() => WD.lastWasDoorQuestion(oldRowDb, AG))) === true && (await quiet(() => WD.lastWasDoorQuestion(plainDb, AG))) === false);
  // F-44.60
  const dsp = JSON.stringify(LD.EAR_TOOL.input_schema.properties.acts.items.properties.date_as_spoken.description);
  T('15.4 F-44.60: the listener is told plainly that relative words ARE dates, returned verbatim', /today/.test(dsp) && /yesterday/.test(dsp) && /this morning/.test(dsp) && /last Friday/.test(dsp) && /verbatim/.test(dsp) && !/advice/i.test(dsp));
  const R = (x, dir) => SD.resolveSpokenDate(x, { todayIso: '2026-09-20', direction: dir });
  T('15.5 F-44.60: his sentence\'s word, and its neighbours, resolve in IST as received dates (20 September 2026 was a Sunday)',
    R('today', 'past').iso === '2026-09-20' && R('this morning', 'past').iso === '2026-09-20' && R('yesterday evening', 'past').iso === '2026-09-19'
    && R('last Friday', 'past').iso === '2026-09-18' && R('friday', 'past').iso === '2026-09-18' && R('last sunday', 'past').iso === '2026-09-13');
  T('15.6 a received date that can only be after today is still B7 (next friday, tomorrow); a lookup goes forward', R('next friday', 'past').reason === 'unreadable' && R('tomorrow', 'past').reason === 'unreadable' && R('friday', 'future').iso === '2026-09-25');
  // F-44.61
  db = makeDb(world());
  r = await run(db, 'Sarah paid the advance today', req([{ act: 'advance_paid', client_as_spoken: 'Sarah', date_as_spoken: 'today' }]));
  T('15.7 F-44.61: an advance on a lead ALREADY BOOKED whose deposit is paid is D7, no question, nothing staged', r.out.door === true && r.out.reply === 'Already marked: Sarah · Deposit, 30% of the fee, on booking · 18 September 2026.' && db.tables['public.pending_money_acts'].length === 0);
  db = makeDb(world()); db.tables['public.payment_schedules'].find((x) => x.id === 'ms-1').state = 'pending'; db.tables['public.payment_schedules'].find((x) => x.id === 'ms-1').paid_at = null;
  r = await run(db, 'Sarah paid the advance today', req([{ act: 'advance_paid', client_as_spoken: 'Sarah', date_as_spoken: 'today' }]));
  T('15.8 F-44.61: an advance on a booked lead with the deposit unpaid is asked as the DEPOSIT in B1 (the row\'s label and amount, her date), staged as milestone_paid',
    r.out.reply === `Mark this payment? Sarah · Deposit, 30% of the fee, on booking · Rs 24,000 · ${require(P('src/lib/witnessLine.js')).longDateYear(SD.todayIstIso())}. Reply YES or NO.`
    && db.tables['public.pending_money_acts'][0].act === 'milestone_paid' && db.tables['public.pending_money_acts'][0].request.milestone_id === 'ms-1');
  db = makeDb(world());
  r = await run(db, 'Meera advance came today', req([{ act: 'advance_paid', client_as_spoken: 'Meera', date_as_spoken: 'today' }]));
  T('15.9 F-44.61: on a lead NOT booked the advance is still the booking question, B2', r.out.reply === 'Confirm this booking? Meera · Photographs and film · Rs 60,000. Reply YES or NO.');
  m = await withMutated('src/lib/vendor/workingDoor.js', [["  if (act.act === 'advance_paid' && key(found.lead.state) === 'booked') return planPayment(", "  if (false) return planPayment("]], [], async (rq) => {
    const d = makeDb(world()); d.tables['public.payment_schedules'].find((x) => x.id === 'ms-1').state = 'pending';
    const oo = await quiet(() => rq('src/lib/vendor/workingDoor.js').preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message: 'x', lane: 'pwa' }, { llmCreate: ear(req([{ act: 'advance_paid', client_as_spoken: 'Sarah', date_as_spoken: 'today' }])), lifecycle: lifeDeps(d) }));
    return oo.reply;
  });
  T('11.17 M15 an advance on a booked lead routed to the booking path again reddens 15.8 (no deposit question)', typeof m === 'string' && !m.startsWith('Mark this payment?'));
  // F-44.62
  const BH = require(P('src/lib/vendor/blockHands.js'));
  const OLD = { ok: (d, w) => `Blocked: ${d}${w}. The day's off your calendar.`, already: (d) => `${d} was already blocked. Nothing changed.`, fail: (d) => `Couldn't block ${d} — nothing was written. Try again or block it from the calendar.`,
    uok: (d) => `Unblocked: ${d}. The day's back on your calendar.`, not: (d) => `${d} wasn't blocked. Nothing changed.`, ufail: (d) => `Couldn't unblock ${d} — nothing was written. Try again or unblock it from the calendar.` };
  const FULL = '20 March 2027';
  T('15.10 F-44.62: "Blocked:" reads the full date, the words byte for byte', BH.blockLines([{ date: '2027-03-20', ok: true, reason: 'Personal time' }]) === OLD.ok(FULL, ' — Personal time'));
  T('15.11 F-44.62: the other five lines, words byte for byte, full dates', BH.blockLines([{ date: '2027-03-20', code: 'ALREADY_BLOCKED' }]) === OLD.already(FULL) && BH.blockLines([{ date: '2027-03-20' }]) === OLD.fail(FULL)
    && BH.unblockLines([{ date: '2027-03-20', ok: true }]) === OLD.uok(FULL) && BH.unblockLines([{ date: '2027-03-20', notBlocked: true }]) === OLD.not(FULL) && BH.unblockLines([{ date: '2027-03-20' }]) === OLD.ufail(FULL));
  T('15.12 F-44.62: no ISO date survives on any of the six; a value that is not a plain date is left as it was, never "null"', !/\d{4}-\d{2}-\d{2}/.test(BH.blockLines([{ date: '2027-03-20', ok: true }, { date: '2027-03-21', code: 'ALREADY_BLOCKED' }, { date: '2027-03-22' }]) + BH.unblockLines([{ date: '2027-03-20', ok: true }, { date: '2027-03-21', notBlocked: true }, { date: '2027-03-22' }]))
    && BH.blockLines([{ date: 'soon', ok: true }]) === OLD.ok('soon', ''));
  m = await withMutated('src/lib/vendor/blockHands.js', [['    if (d.ok)                        return `Blocked: ${day}${why}.', '    if (d.ok)                        return `Blocked: ${d.date}${why}.']], [], async (rq) => rq('src/lib/vendor/blockHands.js').blockLines([{ date: '2027-03-20', ok: true, reason: 'Personal time' }]));
  T('11.18 M16 the raw ISO date restored on "Blocked:" reddens 15.10', m === OLD.ok('2027-03-20', ' — Personal time'));
  const man2 = 'scripts/floor-manifest-ce44-lcv2-p5h1.txt';
  const l2 = fs.existsSync(P(man2)) ? fs.readFileSync(P(man2), 'utf8').split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#')) : null;
  T(`15.13 W-1 NONE for P5-h1, read from its OWN manifest (${man2}); no engine, soul or lens path`, !!l2 && l2.length > 0 && !l2.some((x) => x.startsWith('src/engine/') || /soul|lens/i.test(x)));

  console.log(`\n════════  b90 · ${pass} pass · ${fail} fail  ════════\n`);
  if (fail) { console.log('RED. Failing:'); failed.forEach((f) => console.log('   ·', f)); process.exit(1); }
  process.exit(0);
}
main().catch((e) => { console.error('b90 ERROR', e && e.stack); process.exit(2); });
