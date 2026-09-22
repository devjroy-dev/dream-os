'use strict';
// scripts/b92_lcv_p6a_bench.js · TDW CE-44 · LCV-7 · LC-Victor P6a-1, THE DOOR LEARNS `lead`. Rung b92.
//
// WHAT IT HOLDS (the design accepted at TDW_CE44_LCV6_SEAT_CLOSE.md §5 and the chair's rulings of 21 September,
// each a cell):
//  §1 doorLines.js: B16 to B21 VERBATIM, his at R-44.34, each hash pinned HERE as a literal; B15's key free.
//  §2 spokenDate.js, F-44.64: a direction is EXACTLY 'past' or 'future'; absent is 'future'; anything else is B7.
//  §3 the phone guard (F-44.96): phone-shaped trips; a date, a year, an Indian-grouped amount, an invoice number
//     do not.
//  §4 allCovered's lead exception: a nameless lead is the door's; every other act beside it still needs a client.
//  §5 preTurn() on a lead, through the REAL createLead: B16, B17, B18, B19 (a planted dedupe row, {client} from
//     the RETURNED row), B20, B21, B7; source by lane; precision 'day' ONLY beside a date; the recorded tool call
//     donna_lead; the guard sending a phone-bearing lead WHOLE to the chain; every act resolved before the first
//     write; leads first; once written, the door's to the end.
//  §6 the nameless lead's carry, the door's half: B18, then "Sharma" heard with the thread carrying the first
//     request (listenerDoor.js threadText). The model's half is ONE walk step on live keys.
//  §7 no chip on a door-filed lead, on BOTH lanes.
//  §8 W-1 NONE and the scope, read from this packet's OWN manifest (C-44.7 (b)).
//  §9 fuzz in EVERY argument position of every new total function (e-12, e-16).
//  §10 mutations of production code, each reddening the cell that guards it. A missing anchor FAILS the cell.
// EXTENDED IN PLACE BY P6a-2 (CE-44 LCV-8; the chair's rulings of 21 September), §11 to §20: B22 to B30; F-44.100's net
// and its one exception; the listener's prompt bytes (what a client IS; package_as_spoken, c-44.44); the attach through
// the REAL attachPackage on whole-column doubles; the delivery date; the order and the one-message flow; no chip;
// W-1 from P6a-2's own manifest; fuzz; twenty mutation cells. Cells 1.2 and 4.5 and M9's anchor are re-pinned, each labelled.
// THE EXIT CODE IS THE VERDICT.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-ce44-lcv7-p6a1.txt';
let pass = 0; let fail = 0; const failed = [];
function T(name, cond) { if (cond) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}`); } }
const sec = (t) => console.log(`\n§${t}`);
const quiet = async (fn) => { const w = console.warn; const e = console.error; const l = console.log; console.warn = () => {}; console.error = () => {}; console.log = () => {}; try { return await fn(); } finally { console.warn = w; console.error = e; console.log = l; } };
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const src = (rel) => fs.readFileSync(P(rel), 'utf8');

// ── mutation (b90's harness, unchanged): an anchor that is missing THROWS, and the cell that ran it FAILS ──
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
async function mut(name, rel, pairs, dependents, fn, expect) {
  let v; let ok = false;
  try { v = await withMutated(rel, pairs, dependents, fn); ok = expect(v); } catch (e) { console.log(`        (${e.message})`); ok = false; }
  T(name, ok);
}

// ── an in-memory database (b90's shape), with created_at strictly increasing so ordering is real ──
let clock = Date.parse('2026-09-21T05:00:00Z');
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
        const list = (Array.isArray(payload) ? payload : [payload]).map((r) => ({ id: `row-${++seq}`, created_at: new Date(clock += 1000).toISOString(), ...r }));
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
  return { tables, log, from: (n) => builder('public', n), schema: (s) => ({ from: (n) => builder(s, n) }) };
}

const V = { id: 'v-1', tier: 'signature', user_id: 'u-1' };
const AG = 'ag-1';
const NOW = Date.parse('2026-09-21T06:00:00Z'); // 11:30 IST, 21 September 2026
const ROUTE = { provider: 'anthropic', model: 'm-primary', listener_provider: 'anthropic', listener_model: 'm-listen' };
// public.leads, ALL 29 columns (docs/db/PUBLIC_SCHEMA.md, "public.leads · 29 columns"), so a planted row is whole.
function leadRow(o) {
  return Object.assign({
    id: null, vendor_id: V.id, name: null, phone: null, email: null, wedding_date: null, wedding_city: null, event_types: null,
    budget_min: null, budget_max: null, source: 'self', referrer_name: null, state: 'new', raw_message: null, notes: null,
    created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', client_id: null, deleted_at: null, vendor_summary: null,
    intent_summary: null, intent_summary_at: null, wedding_date_precision: null, function_count: null, wedding_days: null,
    functions: null, draft_meta: null, wedding_id: null, binder_id: null,
  }, o);
}
function world() {
  return {
    'public.leads': [leadRow({ id: 'l-sharmaji', name: 'Sharma Ji', phone: '9876543210', wedding_date: '2027-02-14', wedding_date_precision: 'day' })],
    'public.clients': [],
    'public.lead_packages': [],
    'public.invoices': [],
    'public.pending_money_acts': [],
    'engine.records': [{ id: 'b-walk', agent_id: AG, client: 'Walk45', amount: 50000, amount_received: 0, hidden: false, date: '2026-09-25' }],
    'engine.conversations': [{ id: 'c-1', agent_id: AG, state: 'active', last_active_at: '2026-09-21T05:00:00Z' }],
    'engine.messages': [],
  };
}
function ear(request, counter, seen) {
  return async (_prov, params) => { if (counter) counter.n += 1; if (seen) seen.push(params); return { content: [{ type: 'tool_use', name: 'ear_request', input: request }], usage: { input_tokens: 1400, output_tokens: 50 } }; };
}
const req = (acts, route = 'task') => ({ route, acts });
const gen = async (_s, _v, b) => ({ ok: true, invoice_number: 'TDW/DEV440/30', pdf_url: 'https://x.invalid/p.pdf', made: b.id === 'b-walk' ? 'minted' : 'served' });
const leadsIn = (db) => db.log.inserts.filter((i) => i.table === 'public.leads').flatMap((i) => i.rows);

async function main() {
  const DL = require(P('src/lib/vendor/doorLines.js'));
  const SD = require(P('src/lib/vendor/spokenDate.js'));
  const WD = require(P('src/lib/vendor/workingDoor.js'));
  const LEADS = require(P('src/lib/vendor/leads.js'));
  const run = (db, message, acts, lane, extra) => quiet(() => WD.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message, lane: lane || 'pwa' }, { llmCreate: ear(req(acts)), generateInvoiceForBinder: gen, nowMs: NOW, ...(extra || {}) }));

  // ─── §1 THE BYTES ────────────────────────────────────────────────────────────────────────────
  sec('1 doorLines.js: B16 to B21, his at R-44.34, verbatim, hash-pinned here');
  const RULED = {
    B16: 'Lead added: {client}.',
    B17: 'Lead added: {client} · {date}.',
    B18: 'Who is the lead? Say the name.',
    B19: 'That number is already on {client}. Nothing new was added.',
    B20: 'Could not add the lead.',
    B21: 'That wedding date cannot be right. Say it like 5 December 2027.',
  };
  const HASHES = {
    B16: 'a7fe91f49891ed319667b750d32ddcd55dabda117f328f7f0712f685c20b3830', B17: 'b332f4de8e4698181a5d67735814f183a25319abdfa568c3e56b4040f24e8927',
    B18: 'f6d70e738f124ab29e818590116913b8cb744e777f722c7157e70dbe0ca366a0', B19: 'ec10d50e073b11a83206a1c89c276be61f0e476bee762671d383820d74ecfaf8',
    B20: 'fcfa046d1cf3e8191d12637a6d707078d093df2c5d191b499a6491877d925653', B21: 'ceb7ebc7a3efd2b7d2ff2250c3fff652146624c6bdb7065f28cfe255c52ba9ed',
  };
  for (const k of Object.keys(RULED)) T(`1.1 ${k} is his byte verbatim and its hash is the literal pinned here`, DL.LINES[k] === RULED[k] && DL.LINE_HASHES[k] === HASHES[k] && sha(RULED[k]) === HASHES[k]);
  // RE-PINNED (CE-44 LCV-8, P6a-2): B22 to B30 have arrived and are pinned in §11. B15 stays free, as it was.
  // 1.2 RE-PINNED (CE-44 LCV-9 PART ONE): it asserted B15's key FREE, "owed by the last packet". The chair ruled that packet is
  // the one in which the chain leaves (R-44.37), and B15 (R-44.27, his) rides it. The cell now pins the byte and its hash.
  T('1.2 B15 IS minted by the cut in which the chain leaves (R-44.27, his, verbatim), hash-carried', DL.LINES.B15 === 'Could not make the invoice. No client called {name}.' && DL.LINE_HASHES.B15 === 'f5a96043bb86272066b085f699a88d0aa4adbeb04871d6b95ea59e7f56db5ab0');
  T('1.3 B17 renders the long date with its year', DL.render('B17', { client: 'Sharma', date: '3 January 2027' }) === 'Lead added: Sharma · 3 January 2027.');
  T('1.4 the door holds no literal of any lead byte: every one is read from its one home', !Object.values(RULED).some((l) => src('src/lib/vendor/workingDoor.js').includes(l.split('{')[0].trim()) && l.split('{')[0].trim().length > 12));

  // ─── §2 F-44.64 ──────────────────────────────────────────────────────────────────────────────
  sec('2 spokenDate.js, F-44.64: the direction is exactly past or future');
  const D = (s, o) => SD.resolveSpokenDate(s, { todayIso: '2026-09-21', ...o });
  T('2.1 absent direction is future (F-44.46\'s default): "3 January" is 3 January 2027', D('3 January').iso === '2027-01-03');
  T('2.2 \'future\' and \'past\' both still resolve as before', D('3 January', { direction: 'future' }).iso === '2027-01-03' && D('18 September', { direction: 'past' }).iso === '2026-09-18');
  const bad = ['Past', 'FUTURE', 'backward', 'forward', '', ' past', null, 0, 1, true, {}, []];
  T(`2.3 every other direction (${bad.length} of them, null included) is refused to byte 7, never resolved forward`, bad.every((dir) => { const r = D('18 September', { direction: dir }); return r.ok === false && r.reason === 'unreadable'; }));

  // F-44.98 (the chair's ruling on r2): HIS OWN MISTAKE from his walk of 20 September, the specimen.
  T('2.4 THE SPECIMEN at the resolver: "15 March 0227" answers reason \'year\' in BOTH directions, never a date', ['future', 'past'].every((dir) => { const r = D('15 March 0227', { direction: dir }); return r.ok === false && r.reason === 'year'; }));
  T('2.5 the year floor\'s edges: 1900-01-01 and 2100-12-31 resolve; 1899-12-31 and 2101-01-01 answer \'year\'', D('1900-01-01').iso === '1900-01-01' && D('2100-12-31').iso === '2100-12-31' && D('1899-12-31').reason === 'year' && D('2101-01-01').reason === 'year');
  let malformed = 0;
  for (let y = 1; y <= 9999; y += 1) for (const dir of ['future', 'past']) { const r = D(`15 March ${String(y).padStart(4, '0')}`, { direction: dir }); if (r.ok && !(/^\d{4}-\d{2}-\d{2}$/.test(r.iso) && Number(r.iso.slice(0, 4)) >= 1900 && Number(r.iso.slice(0, 4)) <= 2100)) malformed += 1; }
  T('2.6 no malformed or out-of-range date leaves the resolver: every four-digit year 0001 to 9999, both directions', malformed === 0);

  // ─── §3 THE PHONE GUARD ──────────────────────────────────────────────────────────────────────
  sec('3 the phone guard (F-44.96)');
  const PHONES = ['9876543210', '98765 43210', '98765-43210', '+91 98765 43210', '+919876543210', '919876543210', '09876543210', '987 654 3210', '9876 543 210', 'Add a lead, Sharma, 98765 43210', 'Sharma 6000000000 wedding 5 Dec', 'number is 7011122233.'];
  const NOTPHONES = ['Rs 1,20,000', 'Rs 80,000', 'TDW/DEV440/24', 'TDW/DEV440/9876543210', '2026-09-21', '21/09/2026', '21-09-2026', '5 December 2027', '2027 2028', 'Add a lead, Sharma, 5 December 2027', '12345 67890', '5876543210', '98765432101', 'x9876543210', 'Add a new lead, haldi shoot on 3 January'];
  T(`3.1 all ${PHONES.length} phone-shaped strings trip it`, PHONES.every((s) => WD.phoneShaped(s) === true));
  T(`3.2 none of ${NOTPHONES.length} dates, years, amounts, invoice numbers or wrong-length digit runs trips it`, NOTPHONES.every((s) => WD.phoneShaped(s) === false));

  // ─── §4 THE LEAD EXCEPTION ───────────────────────────────────────────────────────────────────
  sec('4 allCovered: the lead exception, above the untouched return');
  T('4.1 a lead with no name is covered (the door asks B18)', WD.allCovered(req([{ act: 'lead', date_as_spoken: '3 January' }])) === true);
  T('4.2 a lead beside an invoice naming no client is NOT covered', WD.allCovered(req([{ act: 'lead', client_as_spoken: 'Sharma' }, { act: 'invoice' }])) === false);
  T('4.3 a lead beside an invoice naming its client is covered', WD.allCovered(req([{ act: 'lead', client_as_spoken: 'Sharma' }, { act: 'invoice', client_as_spoken: 'Walk45' }])) === true);
  T('4.4 a lead beside an uncovered act (block_date) is NOT covered', WD.allCovered(req([{ act: 'lead', client_as_spoken: 'Sharma' }, { act: 'block_date', date_as_spoken: '5 December' }])) === false);
  // RE-PINNED (CE-44 LCV-8, P6a-2): attach_package IS covered now (§14); an act the door has not learnt is still not.
  T('4.5 an act the door has not learnt (relay) is NOT covered', WD.allCovered(req([{ act: 'relay', client_as_spoken: 'Sharma' }])) === false);
  T('4.6 the untouched return is byte-identical (b90 11.2\'s anchor)', src('src/lib/vendor/workingDoor.js').includes("    return request.acts.every((a) => a && COVERED.includes(a.act) && typeof a.client_as_spoken === 'string' && a.client_as_spoken.trim());"));

  // ─── §5 preTurn ON A LEAD ─────────────────────────────────────────────────────────────────────
  sec('5 preTurn() on a lead, through the real createLead');
  let db = makeDb(world());
  let o = await run(db, 'Add a new lead, Sharma, wedding 3 January', [{ act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: '3 January' }], 'pwa');
  let ins = leadsIn(db);
  T('5.1 a lead with a date on the pwa: B17 exactly, read from the row', o.door === true && o.reply === 'Lead added: Sharma · 3 January 2027.' && o.keys.join() === 'B17');
  T('5.2 ONE insert: name, wedding_date 2027-01-03, precision \'day\' beside it, source \'self\' (the pwa lane), state new', ins.length === 1 && ins[0].name === 'Sharma' && ins[0].wedding_date === '2027-01-03' && ins[0].wedding_date_precision === 'day' && ins[0].source === 'self' && ins[0].state === 'new');
  T('5.3 the recorded tool call is donna_lead, lead_created; refresh; nothing staged', o.toolCalls.length === 1 && o.toolCalls[0].name === 'donna_lead' && o.toolCalls[0].result === 'lead_created' && o.toolNames.join() === 'donna_lead' && o.refresh === true && db.tables['public.pending_money_acts'].length === 0);
  db = makeDb(world());
  o = await run(db, 'Naya lead Sharma, 3 January ki shaadi', [{ act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: '3 January' }], 'whatsapp');
  T('5.4 the same on WhatsApp: source \'whatsapp\', pinned per lane', o.reply === 'Lead added: Sharma · 3 January 2027.' && leadsIn(db).length === 1 && leadsIn(db)[0].source === 'whatsapp');
  db = makeDb(world());
  o = await run(db, 'Add Kapoor as a lead', [{ act: 'lead', client_as_spoken: 'Kapoor' }], 'pwa');
  ins = leadsIn(db);
  T('5.5 a lead with no date: B16 exactly; wedding_date and its precision BOTH null (leads.js :335 to :339)', o.reply === 'Lead added: Kapoor.' && o.keys.join() === 'B16' && ins.length === 1 && ins[0].wedding_date === null && ins[0].wedding_date_precision === null);
  db = makeDb(world());
  o = await run(db, 'Add a new lead, haldi shoot on 3 January', [{ act: 'lead', date_as_spoken: '3 January' }], 'pwa');
  T('5.6 a lead with no name: B18 exactly, NOTHING written, no tool call, harvest skipped', o.door === true && o.reply === 'Who is the lead? Say the name.' && o.keys.join() === 'B18' && leadsIn(db).length === 0 && o.toolCalls.length === 0 && o.skipHarvest === true);
  for (const [said, why] of [['5 December 2025', 'a past year'], ['20 September 2026', 'yesterday'], ['5 December 2032', 'six years on']]) {
    db = makeDb(world());
    o = await run(db, `Add Sharma, wedding ${said}`, [{ act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: said }], 'pwa');
    T(`5.7 a wedding date ${said} (${why}) is B21 and NOTHING is written`, o.reply === RULED.B21 && o.keys.join() === 'B21' && leadsIn(db).length === 0);
  }
  db = makeDb(world());
  o = await run(db, 'Add Sharma, wedding 5 December 2031', [{ act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: '5 December 2031' }], 'pwa');
  T('5.8 control at the edge: 5 December 2031 (today\'s IST year plus five) is filed, B17', o.reply === 'Lead added: Sharma · 5 December 2031.' && leadsIn(db).length === 1);
  db = makeDb(world());
  o = await run(db, 'Add Sharma, wedding today', [{ act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: 'today' }], 'pwa');
  T('5.9 control: today in IST is not "before today"; filed, B17 with 21 September 2026', o.reply === 'Lead added: Sharma · 21 September 2026.');
  db = makeDb(world());
  o = await run(db, 'Add Sharma, wedding next week sometime', [{ act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: 'next week sometime' }], 'pwa');
  T('5.10 an unreadable wedding date is B7 and NOTHING is written; B21 is not spoken', o.reply === DL.LINES.B7 && o.keys.join() === 'B7' && leadsIn(db).length === 0);
  // B19: the REAL createLead's dedupe, reached by a wrapper that supplies the phone the listener cannot yet hear
  // (F-44.96). The planted row is whole and named "Sharma Ji"; she said "Sharma". {client} is the ROW's.
  db = makeDb(world());
  const withPhone = (sb, vid, params) => LEADS.createLead(sb, vid, { ...params, phone: '9876543210' });
  o = await run(db, 'Add Sharma', [{ act: 'lead', client_as_spoken: 'Sharma' }], 'pwa', { createLead: withPhone });
  T('5.11 B19 on createLead\'s deduped return, {client} FROM THE RETURNED ROW ("Sharma Ji"), never the spoken name; nothing inserted', o.reply === 'That number is already on Sharma Ji. Nothing new was added.' && o.keys.join() === 'B19' && leadsIn(db).length === 0 && o.toolCalls[0].result === 'unchanged' && o.refresh === false);
  db = makeDb(world());
  o = await run(db, 'Add Sharma', [{ act: 'lead', client_as_spoken: 'Sharma' }], 'pwa', { createLead: async () => ({ ok: false, error: 'Could not create lead: x' }) });
  T('5.12 createLead refused: B20, recorded refused:write_failed', o.door === true && o.reply === RULED.B20 && o.toolCalls[0].result === 'refused:write_failed');
  db = makeDb(world());
  o = await run(db, 'Add Sharma', [{ act: 'lead', client_as_spoken: 'Sharma' }], 'pwa', { createLead: async () => { throw new Error('socket hang up'); } });
  T('5.13 createLead THROWS: the turn is the door\'s to the end: door true, B20, recorded refused:exception, never the chain', o.door === true && o.reply === RULED.B20 && o.toolCalls.length === 1 && o.toolCalls[0].result === 'refused:exception');
  db = makeDb(world());
  o = await run(db, 'Add a lead, Sharma, 98765 43210', [{ act: 'lead', client_as_spoken: 'Sharma' }], 'pwa');
  T('5.14 THE GUARD: a lead message carrying a phone goes WHOLE to the chain (lead_phone), nothing written, the heard request carried', o.door === false && o.why === 'lead_phone' && leadsIn(db).length === 0 && !!o.ear && o.ear.request.acts[0].act === 'lead');
  db = makeDb(world());
  o = await run(db, 'Raise the invoice for Walk45, number TDW/DEV440/24, Rs 1,20,000', [{ act: 'invoice', client_as_spoken: 'Walk45' }], 'pwa');
  T('5.15 control: the guard is the LEAD\'s only; an invoice message with numbers still reaches the door', o.door === true && o.keys.join() === 'B13');
  db = makeDb(world());
  o = await run(db, 'Add Sharma for 3 January and raise the invoice for Walk45', [{ act: 'invoice', client_as_spoken: 'Walk45' }, { act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: '3 January' }], 'pwa');
  T('5.16 ORDER: leads first, then invoices, whatever order she said them', o.keys.join() === 'B17,B13' && o.toolNames.join() === 'donna_lead,donna_invoice_pdf');
  db = makeDb(world());
  o = await run(db, 'Add Sharma for 3 January and raise the invoice for Nobody', [{ act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: '3 January' }, { act: 'invoice', client_as_spoken: 'Nobody' }], 'pwa');
  T('5.17 every act resolves BEFORE the first write: an invoice with no binder sends the WHOLE message to the chain and NO lead is filed', o.door === false && o.why === 'invoice_unresolved' && leadsIn(db).length === 0);
  db = makeDb(world());
  o = await run(db, 'Add Sharma and Mehra', [{ act: 'lead', client_as_spoken: 'Sharma' }, { act: 'lead', client_as_spoken: 'Mehra' }], 'pwa');
  // Ruling 3 (the chair, 21 September): harvest never INSERTS a lead, so B18's skipHarvest can only stop a wrong
  // patch, never a second lead. Pinned on harvest.js's source, WITH its control (C-44.4): harvest does touch
  // public.leads (the read, the update), so an empty answer cannot pass for a broken grep.
  const hv = src('src/agent/harvest.js');
  T('5.19 harvest never inserts a lead (no createLead, no insert on leads); control: it does read and update leads', !/createLead/.test(hv) && !/from\('leads'\)\s*\.insert\(/.test(hv) && /\.from\('leads'\)/.test(hv) && /from\('leads'\)\.update\(/.test(hv));
  T('5.18 two leads in one message: both filed, both said, in her order', o.keys.join() === 'B16,B16' && o.reply === 'Lead added: Sharma.\n\nLead added: Mehra.' && leadsIn(db).map((r) => r.name).join() === 'Sharma,Mehra');
  db = makeDb(world());
  o = await run(db, 'Add a new lead, Sharma, wedding on 15 March 0227', [{ act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: '15 March 0227' }], 'pwa');
  T('5.20 THE SPECIMEN at the door, his walk of 20 September: "15 March 0227" speaks B21 and files NOTHING', o.door === true && o.reply === RULED.B21 && o.keys.join() === 'B21' && leadsIn(db).length === 0);
  const moneySaid = [];
  for (const act of [{ act: 'milestone_paid', client_as_spoken: 'Sarah', milestone: 'middle', date_as_spoken: '15 March 0227' }, { act: 'advance_paid', client_as_spoken: 'Sarah', date_as_spoken: '15 March 0227' }]) {
    db = makeDb(world());
    o = await run(db, `Sarah paid on 15 March 0227 (${act.act})`, [act], 'pwa');
    moneySaid.push(o.reply);
  }
  T('5.21 THE MONEY PATHS read the SAME byte as before this cut: "paid on 15 March 0227" is B7 on milestone_paid and advance_paid. Before, B7 came by ACCIDENT ("227-03-15" > "2026-09-21" as strings, so the past-direction check refused it); now by the rule (reason \'year\', every reason but \'none\' to B7)', moneySaid.length === 2 && moneySaid.every((r) => r === DL.LINES.B7));

  // ─── §6 THE NAMELESS LEAD'S CARRY, THE DOOR'S HALF ───────────────────────────────────────────
  sec('6 the carry: B18, then "Sharma", heard with the thread');
  db = makeDb(world());
  const meter = require(P('src/agent/harvest.js'))._meter;
  const memory = {
    getOrCreateConversation: async () => ({ conversationId: 'c-1', thread: [] }),
    saveMessage: async (cid, role, content, _tc, meta) => { const id = `m-${db.tables['engine.messages'].length + 1}`; db.tables['engine.messages'].push({ id, conversation_id: cid, role, content, meta: meta || null, created_at: new Date(clock += 1000).toISOString() }); return id; },
  };
  const first = { act: 'lead', date_as_spoken: '3 January' };
  const o1 = await quiet(() => WD.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message: 'Add a new lead, haldi shoot on 3 January', lane: 'pwa' }, { llmCreate: ear(req([first])), nowMs: NOW }));
  await quiet(() => WD.persistDoorTurn({ supabase: db, agentId: AG, message: 'Add a new lead, haldi shoot on 3 January', out: o1, lane: 'pwa' }, { memory, meter }));
  const filedAfterOne = leadsIn(db).length;
  const seen = [];
  const o2 = await quiet(() => WD.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message: 'Sharma', lane: 'pwa' }, { llmCreate: ear(req([{ act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: '3 January' }]), null, seen), nowMs: NOW }));
  const prompt = seen[0] && seen[0].messages && seen[0].messages[0] ? String(seen[0].messages[0].content) : '';
  T('6.1 turn one: B18, nothing filed', o1.reply === RULED.B18 && filedAfterOne === 0);
  T('6.2 the door\'s row carries the first request in meta.listener.request', db.tables['engine.messages'].some((m) => m.role === 'assistant' && m.meta && m.meta.listener && m.meta.listener.door === true && JSON.stringify(m.meta.listener.request) === JSON.stringify(req([first]))));
  T('6.3 turn two: the listener is handed that request on the thread ("[understood then: …3 January…]") and her B18 question', prompt.includes('[understood then: ') && prompt.includes('"date_as_spoken":"3 January"') && prompt.includes('Who is the lead? Say the name.') && prompt.endsWith('New message: Sharma'));
  T('6.4 turn two (the scripted listener\'s half): Sharma filed with 3 January 2027, B17', o2.reply === 'Lead added: Sharma · 3 January 2027.' && leadsIn(db).length === 1 && leadsIn(db)[0].wedding_date === '2027-01-03');

  // ─── §7 NO CHIP, BOTH LANES ─────────────────────────────────────────────────────────────────
  sec('7 no chip on a door-filed lead, on both lanes (R-44.21 (a))');
  db = makeDb(world());
  o = await run(db, 'Add Sharma', [{ act: 'lead', client_as_spoken: 'Sharma' }], 'pwa');
  T('7.1 the door\'s answer for a lead carries exactly the door\'s fields and no document', Object.keys(o).sort().join() === 'documents,door,ear,keys,refresh,reply,skipHarvest,toolCalls,toolNames' && o.documents.length === 0);
  const cj = src('src/api/vendor-engine/chat.js');
  const sseDoor = cj.slice(cj.indexOf('      const doorOut = await doorTurn(req, llmWiring, message, roomAssert);'), cj.indexOf('      req._lcvEar = doorOut ? doorOut.ear : null;'));
  T('7.2 pwa: the door turn\'s wire holds no chip (no operator_action, handoff, or report beat), for every act, lead included', sseDoor.length > 100 && !/operator_action|handoff|operator_report/.test(sseDoor));
  const sends = [];
  await quiet(() => WD.speakOnWhatsApp({ supabase: db, agentId: AG, phone: '+910000000000', convoId: 'wc-1', message: 'Add Sharma', out: o, sendWhatsApp: async (ph, body, media) => { sends.push({ body, media }); return { sid: 's' }; } }, { persistDoorTurn: async () => ({}) }));
  T('7.3 WhatsApp: ONE send, the reply alone, no media', sends.length === 1 && sends[0].body === 'Lead added: Sharma.' && Array.isArray(sends[0].media) && sends[0].media.length === 0);

  // ─── §8 W-1 AND SCOPE ───────────────────────────────────────────────────────────────────────
  sec('8 W-1 NONE, read from P6a-1\'s own manifest');
  const listed = fs.existsSync(P(MAN)) ? fs.readFileSync(P(MAN), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')) : null;
  T(`8.1 the manifest exists (${MAN})`, !!listed && listed.length > 0);
  const off = ['src/lib/vendor/listenerDoor.js', 'src/lib/vendor/handResult.js', 'src/lib/vendor/leads.js', 'src/api/vendor/leadPackages.js', 'src/api/vendor-engine/chat.js', 'src/lib/vendorInbound.js', 'src/lib/vendor/lifecycleHands.js', 'src/lib/vendor/pendingMoneyActs.js'];
  T('8.2 W-1 NONE: no engine, soul, lens or migration path; createLead, handResult, the listener and both lanes untouched', !!listed && !listed.some((p) => p.startsWith('src/engine/') || p.startsWith('db/') || /soul|lens/i.test(p)) && !listed.some((p) => off.includes(p)));
  T('8.3 every listed path is dream-os\'s and exists', !!listed && listed.every((p) => fs.existsSync(P(p))));

  // ─── §9 FUZZ ─────────────────────────────────────────────────────────────────────────────────
  sec('9 fuzz, every argument position');
  const evil = { get act() { throw new Error('getter'); }, toString() { throw new Error('toString'); } };
  const prox = new Proxy({}, { get() { throw new Error('proxy'); }, has() { throw new Error('proxy'); }, ownKeys() { throw new Error('proxy'); } });
  const H = [undefined, null, '', ' ', 0, -1, NaN, Infinity, true, {}, [], 'x'.repeat(5000), evil, prox, () => { throw new Error('f'); }, Symbol('s')];
  let calls = 0; let throws = 0;
  const CALLS_PINNED = 1280; // derived for THIS fuzz: 800 from the loop above; 480 below (20 hostile acts x (16 planLead + 8 fileLead))
  const hit = async (fn) => { calls += 1; try { await fn(); } catch (_e) { throws += 1; } };
  for (const a of H) {
    await hit(() => WD.phoneShaped(a));
    await hit(() => WD.allCovered(a)); await hit(() => WD.allCovered({ acts: [a] })); await hit(() => WD.allCovered({ acts: [{ act: 'lead', client_as_spoken: a }] }));
    for (const b of H) { await hit(() => SD.resolveSpokenDate(a, b)); await hit(() => SD.resolveSpokenDate('3 January', { direction: a, nowMs: b })); }
    await hit(() => DL.render('B17', { client: a, date: a })); await hit(() => DL.render('B19', a));
    for (const field of ['act', 'client_as_spoken', 'date_as_spoken']) {
      const act = { act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: '3 January' }; act[field] = a;
      await hit(() => quiet(() => WD.preTurn({ supabase: makeDb(world()), vendor: V, agentId: AG, route: ROUTE, message: 'Add Sharma', lane: 'pwa' }, { llmCreate: ear(req([act])), nowMs: NOW })));
    }
    for (const pos of ['supabase', 'vendor', 'agentId', 'route', 'message', 'lane', 'conversationId']) {
      const args = { supabase: makeDb(world()), vendor: V, agentId: AG, route: ROUTE, message: 'Add Sharma, wedding 3 January', lane: 'pwa' };
      args[pos] = a;
      await hit(() => quiet(() => WD.preTurn(args, { llmCreate: ear(req([{ act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: '3 January' }])), nowMs: NOW })));
    }
    await hit(() => quiet(() => WD.preTurn({ supabase: makeDb(world()), vendor: V, agentId: AG, route: ROUTE, message: 'Add Sharma', lane: 'pwa' }, { llmCreate: ear(req([{ act: 'lead', client_as_spoken: 'Sharma' }])), nowMs: NOW, createLead: async () => a })));
    await hit(() => quiet(() => WD.preTurn({ supabase: makeDb(world()), vendor: V, agentId: AG, route: ROUTE, message: 'Add Sharma', lane: 'pwa' }, { llmCreate: ear(req([{ act: 'lead', client_as_spoken: 'Sharma' }])), nowMs: NOW, createLead: async () => ({ ok: true, lead: a, deduped: a }) })));
  }
  // The chair's ruling on r2: planLead and fileLead held hostile in EVERY position, THE ACT ITSELF INCLUDED, with
  // throwing getters and a throwing toString.
  const hostileActs = [...H,
    { act: 'lead', get client_as_spoken() { throw new Error('getter'); } },
    { act: 'lead', client_as_spoken: 'Sharma', get date_as_spoken() { throw new Error('getter'); } },
    { act: 'lead', client_as_spoken: { toString() { throw new Error('toString'); } }, date_as_spoken: { toString() { throw new Error('toString'); } } },
    { act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: { toString() { throw new Error('toString'); } } }];
  const goodPlan = { lead: { name: 'Sharma', wedding_date: '2027-01-03' } };
  const goodL = { createLead: async () => ({ ok: true, deduped: false, lead: { name: 'Sharma', wedding_date: null } }) };
  for (const a of hostileActs) {
    for (const b of H) await hit(() => WD.planLead(a, b));
    await hit(() => WD.fileLead(a, V, 'pwa', goodPlan, goodL)); await hit(() => WD.fileLead(makeDb(world()), a, 'pwa', goodPlan, goodL));
    await hit(() => WD.fileLead(makeDb(world()), V, a, goodPlan, goodL)); await hit(() => WD.fileLead(makeDb(world()), V, 'pwa', a, goodL));
    await hit(() => WD.fileLead(makeDb(world()), V, 'pwa', { lead: a }, goodL)); await hit(() => WD.fileLead(makeDb(world()), V, 'pwa', goodPlan, a));
    await hit(() => WD.fileLead(makeDb(world()), V, 'pwa', goodPlan, { createLead: () => { throw new Error('x'); } }));
    await hit(() => WD.fileLead(makeDb(world()), V, 'pwa', goodPlan, { createLead: async () => a }));
  }
  T(`9.1 ${calls} calls with hostile values in every argument position, the act included: zero throws`, throws === 0 && calls === CALLS_PINNED);
  let shapes = 0;
  for (const a of hostileActs) { const r = WD.planLead(a, NOW); if (r && (r.lead || (typeof r.speak === 'string' && typeof r.key === 'string'))) shapes += 1; }
  T('9.3 planLead answers a plan for every hostile act (a non-object act is B20, never a throw)', shapes === hostileActs.length && WD.planLead(null, NOW).key === 'B20' && WD.planLead(undefined, NOW).key === 'B20');
  let leadOut = 0; let bad2 = 0;
  for (const a of H) {
    const r = await quiet(() => WD.preTurn({ supabase: makeDb(world()), vendor: V, agentId: AG, route: ROUTE, message: 'Add Sharma', lane: 'pwa' }, { llmCreate: ear(req([{ act: 'lead', client_as_spoken: 'Sharma' }])), nowMs: NOW, createLead: async () => ({ ok: true, lead: a, deduped: false }) }));
    leadOut += 1; if (!(r.door === true && [RULED.B20].includes(r.reply))) bad2 += 1;
  }
  T(`9.2 a createLead return whose row is hostile (${leadOut} shapes) always says B20, never a half line`, bad2 === 0);

  // ─── §10 MUTATIONS ──────────────────────────────────────────────────────────────────────────
  sec('10 mutations, each reddening its cell');
  const WDf = 'src/lib/vendor/workingDoor.js';
  const leadCase = async (rq, message, acts, lane, extra) => { const d = makeDb(world()); const r = await quiet(() => rq(WDf).preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message, lane: lane || 'pwa' }, { llmCreate: ear(req(acts)), generateInvoiceForBinder: gen, nowMs: NOW, ...(extra || {}) })); return { r, ins: leadsIn(d) }; };
  await mut('10.1 M1 the phone guard removed: a phone-bearing lead reaches the door and is filed WITHOUT its number (reddens 5.14)', WDf,
    [["    if (st.ear.request.acts.some((a) => a && a.act === 'lead') && phoneShaped(message)) return CHAIN(st.ear, 'lead_phone');\n", '']], [],
    async (rq) => leadCase(rq, 'Add a lead, Sharma, 98765 43210', [{ act: 'lead', client_as_spoken: 'Sharma' }]), (x) => x.r.door === true && x.ins.length === 1 && x.ins[0].phone === null);
  await mut('10.2 M2 F-44.64\'s refusal removed: "Past" resolves (forward) instead of B7 (reddens 2.3)', 'src/lib/vendor/spokenDate.js',
    [["    if (o.direction !== undefined && o.direction !== 'past' && o.direction !== 'future') return { ok: false, reason: 'unreadable' };\n", '']], [],
    async (rq) => rq('src/lib/vendor/spokenDate.js').resolveSpokenDate('18 September', { todayIso: '2026-09-21', direction: 'Past' }), (r) => r.ok === true);
  await mut('10.3 M3 phoneShaped without its guard throws on a hostile value (reddens 9.1)', WDf,
    [['  try { return typeof text === \'string\' && PHONE_RE.test(text); } catch (_e) { return false; }', '  return PHONE_RE.test(text);']], [],
    async (rq) => { let t = 0; for (const a of H) { try { rq(WDf).phoneShaped(a); } catch (_e) { t += 1; } } return t; }, (t) => t > 0);
  // ANCHOR WIDENED (CE-44 LCV-10 PART B-2, first cut): since the name question a nameless lead is also caught by askName BEFORE allCovered, a second
  // guard; M4 now removes BOTH so the cell still proves the exception's own worth. What it proves is unchanged.
  await mut('10.4 M4 the lead exception AND the name question removed: a nameless lead goes to the chain, B18 is never said (reddens 5.6 and 4.1)', WDf,
    [["    if (request.acts.some((a) => a && a.act === 'lead')) {", '    if (false) {'], ["    { const ask = askName(heard, 0); if (ask) return ask; }\n", '']], [],
    async (rq) => leadCase(rq, 'Add a new lead, haldi shoot on 3 January', [{ act: 'lead', date_as_spoken: '3 January' }]), (x) => x.r.door === false && x.r.why === 'uncovered');
  await mut('10.5 M5 precision passed on every lead: a dateless lead is written claiming a day (reddens 5.5)', WDf,
    [["...(p.wedding_date ? { wedding_date: p.wedding_date, wedding_date_precision: 'day' } : {})", "wedding_date_precision: 'day', ...(p.wedding_date ? { wedding_date: p.wedding_date } : {})"]], [],
    async (rq) => leadCase(rq, 'Add Kapoor', [{ act: 'lead', client_as_spoken: 'Kapoor' }]), (x) => x.ins.length === 1 && x.ins[0].wedding_date === null && x.ins[0].wedding_date_precision === 'day');
  await mut('10.6 M6 source not pinned per lane (\'whatsapp\' on the pwa): reddens 5.2', WDf,
    [["source: lane === 'pwa' ? 'self' : 'whatsapp'", "source: 'whatsapp'"]], [],
    async (rq) => leadCase(rq, 'Add Kapoor', [{ act: 'lead', client_as_spoken: 'Kapoor' }], 'pwa'), (x) => x.ins.length === 1 && x.ins[0].source === 'whatsapp');
  await mut('10.7 M7 B19\'s {client} from the spoken name instead of the row: "Sharma", not "Sharma Ji" (reddens 5.11)', WDf,
    [["  const client = row && typeof row.name === 'string' && row.name.trim() ? row.name.trim() : null;", '  const client = p.name;']], [],
    async (rq) => leadCase(rq, 'Add Sharma', [{ act: 'lead', client_as_spoken: 'Sharma' }], 'pwa', { createLead: (sb, vid, params) => LEADS.createLead(sb, vid, { ...params, phone: '9876543210' }) }), (x) => x.r.reply === 'That number is already on Sharma. Nothing new was added.');
  await mut('10.8 M8 F-44.66\'s range removed: a past-year wedding date is filed (reddens 5.7)', WDf,
    [["    if (d.iso < t[0] || y < y0 || y > y0 + 5) return { speak: DL.LINES.B21, key: 'B21' };\n", '']], [],
    async (rq) => leadCase(rq, 'Add Sharma, wedding 5 December 2025', [{ act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: '5 December 2025' }]), (x) => x.ins.length === 1 && x.ins[0].wedding_date === '2025-12-05');
  await mut('10.9 M9 a lead filed DURING resolution, before the invoice resolves: a lead lands and the chain also answers (reddens 5.17)', WDf,
    [["    for (const a of acts) if (a.act === 'lead') leadPlans.push(planLead(a, nowMs, answeringB18));", "    for (const a of acts) if (a.act === 'lead') { const q = planLead(a, nowMs); if (q.lead) await fileLead(supabase, vendor, lane, q, L); leadPlans.push({ speak: null }); }"]], [],
    async (rq) => leadCase(rq, 'x', [{ act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: '3 January' }, { act: 'invoice', client_as_spoken: 'Nobody' }]), (x) => x.r.door === false && x.ins.length === 1);
  await mut('10.10 M10 invoices before leads: the order is lost (reddens 5.16)', WDf,
    [['    for (const lp of leadPlans) {', '    for (const lp of []) {'], ['    if (moneyPlan) {\n      if (moneyPlan.stage) {', "    for (const lp of leadPlans) { if (lp.speak) { st.lines.push(lp.speak); st.keys.push(lp.key); continue; } st.wrote = true; const f = await fileLead(supabase, vendor, lane, lp, L); st.lines.push(f.line); st.keys.push(f.key); st.toolCalls.push(f.call); }\n    if (moneyPlan) {\n      if (moneyPlan.stage) {"]], [],
    async (rq) => leadCase(rq, 'x', [{ act: 'invoice', client_as_spoken: 'Walk45' }, { act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: '3 January' }]), (x) => x.r.keys.join() === 'B13,B17');
  await mut('10.11 M11 the write mark AND fileLead\'s guard removed: a throwing createLead falls to the chain after a possible write (reddens 5.13)', WDf,
    [['      st.wrote = true; // a lead may land inside the call even if the call then throws\n', ''], ["  } catch (_e) { return { line: DL.LINES.B20, key: 'B20', call: { name: HANDS.lead, input, result: 'refused:exception' }, landed: false }; }", '  } finally { /* guard removed */ }']], [],
    async (rq) => leadCase(rq, 'Add Sharma', [{ act: 'lead', client_as_spoken: 'Sharma' }], 'pwa', { createLead: async () => { throw new Error('x'); } }), (x) => x.r.door === false);
  const SDf = 'src/lib/vendor/spokenDate.js';
  await mut('10.12 M12 the resolver\'s year floor removed: the specimen resolves to a date (reddens 2.4)', SDf,
    [["      if (year < YEAR_MIN || year > YEAR_MAX) return { ok: false, reason: 'year' };\n", '']], [],
    async (rq) => rq(SDf).resolveSpokenDate('15 March 0227', { todayIso: '2026-09-21', direction: 'future' }), (r) => r.ok === true && r.iso === '0227-03-15');
  await mut('10.13 M13 the year pad removed with the floor and the resolver\'s strict read: a MALFORMED date leaves the file again (reddens 2.6)', SDf,
    [["function iso(y, m, d) { return `${String(y).padStart(4, '0')}-${pad(m)}-${pad(d)}`; }", 'function iso(y, m, d) { return `${y}-${pad(m)}-${pad(d)}`; }'],
     ["    if (r.ok) {\n      const ym = /^(\\d{4})-\\d{2}-\\d{2}$/.exec(typeof r.iso === 'string' ? r.iso : '');\n      if (!ym) return { ok: false, reason: 'unreadable' };\n      const year = Number(ym[1]);\n      if (year < YEAR_MIN || year > YEAR_MAX) return { ok: false, reason: 'year' };\n    }\n", '']], [],
    async (rq) => rq(SDf).resolveSpokenDate('15 March 0227', { todayIso: '2026-09-21', direction: 'future' }), (r) => r.ok === true && r.iso === '227-03-15');
  // M14: r2 REPRODUCED, the resolver's cure AND the door's strict parse reverted together: the specimen FILES.
  // Removing the resolver's floor ALONE does not make the door file, because the padded year is ALSO caught by the
  // door's own range; the door holds by two independent guards, and this cell proves the pair is what matters.
  let m14; let m14ok = false;
  try {
    m14 = await withMutated(SDf, [["function iso(y, m, d) { return `${String(y).padStart(4, '0')}-${pad(m)}-${pad(d)}`; }", 'function iso(y, m, d) { return `${y}-${pad(m)}-${pad(d)}`; }'],
      ["    if (r.ok) {\n      const ym = /^(\\d{4})-\\d{2}-\\d{2}$/.exec(typeof r.iso === 'string' ? r.iso : '');\n      if (!ym) return { ok: false, reason: 'unreadable' };\n      const year = Number(ym[1]);\n      if (year < YEAR_MIN || year > YEAR_MAX) return { ok: false, reason: 'year' };\n    }\n", '']], [WDf],
    async () => withMutated(WDf, [["    const m = LEAD_ISO.exec(typeof d.iso === 'string' ? d.iso : '');\n    const t = LEAD_ISO.exec(todayIstIso(nowMs));\n    if (!m || !t) return { speak: DL.LINES.B21, key: 'B21' };\n    const y = Number(m[1]); const y0 = Number(t[1]);\n    if (d.iso < t[0] || y < y0 || y > y0 + 5)", "    const today = todayIstIso(nowMs);\n    const y = Number(d.iso.slice(0, 4)); const y0 = Number(today.slice(0, 4));\n    if (d.iso < today || y < y0 || y > y0 + 5)"]], [],
      async (rq) => leadCase(rq, 'Add a new lead, Sharma, wedding on 15 March 0227', [{ act: 'lead', client_as_spoken: 'Sharma', date_as_spoken: '15 March 0227' }])));
    // The door planned "227-03-15"; createLead re-parses it (new Date('227-03-15') is 15 March 227) and stores
    // "0227-03-15": the row his walk of 20 September would have made.
    m14ok = m14.r.door === true && m14.ins.length === 1 && m14.ins[0].wedding_date === '0227-03-15';
  } catch (e) { console.log(`        (${e.message})`); }
  T('10.14 M14 r2 reproduced (the resolver\'s cure and the door\'s strict parse reverted): the specimen FILES a lead dated 0227-03-15 (reddens 5.20)', m14ok);
  await mut('10.15 M15 planLead without its guard throws on a hostile act (reddens 9.1 and 9.3)', WDf,
    [['    if (!act || typeof act !== \'object\') return { speak: DL.LINES.B20, key: \'B20\' };\n', ''], ["  } catch (_e) { return { speak: DL.LINES.B20, key: 'B20' }; }\n}", '  } finally { /* guard removed */ }\n}']], [],
    async (rq) => { let t = 0; for (const a of hostileActs) { try { rq(WDf).planLead(a, NOW); } catch (_e) { t += 1; } } return t; }, (t) => t > 0);
  await mut('10.16 M16 fileLead without its guard throws on a hostile position (reddens 9.1)', WDf,
    [["  } catch (_e) { return { line: DL.LINES.B20, key: 'B20', call: { name: HANDS.lead, input, result: 'refused:exception' }, landed: false }; }", '  } finally { /* guard removed */ }']], [],
    async (rq) => { let t = 0; for (const a of hostileActs) { try { await rq(WDf).fileLead(makeDb(world()), V, 'pwa', a, goodL); } catch (_e) { t += 1; } } return t; }, (t) => t > 0);

  // ═════════════════════════════════════════════════════════════════════════════════════════════
  // P6a-2 (CE-44 LCV-8): THE DOOR LEARNS attach_package, WITH F-44.100 RIDING. Sections 11 to 20.
  // EVERY SENTENCE ON THE WALK CARD IS A CELL HERE, his own "Add a new lead, haldi shoot on 3 January" first.
  // ═════════════════════════════════════════════════════════════════════════════════════════════
  const MAN2 = 'scripts/floor-manifest-ce44-lcv8-p6a2.txt';
  const LP = require(P('src/api/vendor/leadPackages.js'));
  const LD = require(P('src/lib/vendor/listenerDoor.js'));
  // public.vendor_packages, ALL 16 columns, and public.lead_packages, ALL 13 (docs/db/PUBLIC_SCHEMA.md), so a planted row is whole.
  function pkgRow(o) {
    return Object.assign({ id: null, vendor_id: V.id, name: null, description: '', line_items: [], total: null, deposit_pct: 30, middle_pct: 30,
      middle_enabled: true, delivery_basis: 'on_the_day', delivery_days: null, is_default: false, seeded_from: null,
      created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', deleted_at: null }, o);
  }
  function lpRow(o) {
    return Object.assign({ id: null, vendor_id: V.id, lead_id: null, package_id: null, snapshot: {}, total: null, schedule: [], delivery_on: null,
      quoted_at: null, quote_draft_id: null, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', deleted_at: null }, o);
  }
  function world2() {
    const w = world();
    w['public.leads'] = [
      leadRow({ id: 'l-dated', name: 'Walk P7 Dated', wedding_date: '2027-02-20', wedding_date_precision: 'day' }),
      leadRow({ id: 'l-undated', name: 'Walk P6 Undated' }),
      leadRow({ id: 'l-month', name: 'Walk Month', wedding_date: '2027-02-01', wedding_date_precision: 'month' }),
      leadRow({ id: 'l-booked', name: 'Walk P5 Book', state: 'booked', binder_id: 'b-book', wedding_date: '2027-03-01', wedding_date_precision: 'day' }),
      leadRow({ id: 'l-wa', name: 'Walk P6 Dated', wedding_date: '2027-02-14', wedding_date_precision: 'day' }),
      leadRow({ id: 'l-tw1', name: 'Twin', wedding_date: '2027-04-01', wedding_date_precision: 'day' }),
      leadRow({ id: 'l-tw2', name: 'twin', wedding_date: '2027-05-02', wedding_date_precision: 'day' }),
      leadRow({ id: 'l-other', vendor_id: 'v-2', name: 'Walk P7 Dated', wedding_date: '2027-02-20', wedding_date_precision: 'day' }),
    ];
    w['public.vendor_packages'] = [
      pkgRow({ id: 'p-film', name: 'Photographs and film', total: 80000, delivery_basis: 'days', delivery_days: 30, is_default: true }),
      pkgRow({ id: 'p-hand', name: 'Album handover', total: 25000, delivery_basis: 'handover' }),
      pkgRow({ id: 'p-otd', name: 'Photographs only', total: 40000, delivery_basis: 'on_the_day' }),
      pkgRow({ id: 'p-br1', name: 'Bridal', total: 80000, delivery_basis: 'on_the_day' }),
      pkgRow({ id: 'p-br2', name: ' bridal ', total: 120000, delivery_basis: 'on_the_day' }),
      pkgRow({ id: 'p-nofee', name: 'No fee yet', total: null, delivery_basis: 'on_the_day' }),
      pkgRow({ id: 'p-dead', name: 'Retired gold', total: 90000, deleted_at: '2026-09-02T00:00:00Z' }),
      pkgRow({ id: 'p-theirs', vendor_id: 'v-2', name: 'Photographs and film', total: 99999, delivery_basis: 'on_the_day' }),
    ];
    return w;
  }
  const lpsIn = (d) => d.log.inserts.filter((i) => i.table === 'public.lead_packages').flatMap((i) => i.rows);
  const staged = (d) => (d.tables['public.pending_money_acts'] || []);
  // RE-PINNED (CE-44 LCV-10 PART B-2, second cut; F-44.108): {list} is HER OWN names SORTED case-folded, no longer the rows' order.
  const OWN_LIST = 'Album handover · Bridal · bridal · No fee yet · Photographs and film · Photographs only';
  const att = (client, pkg, date) => ({ act: 'attach_package', client_as_spoken: client, package_as_spoken: pkg, ...(date ? { date_as_spoken: date } : {}) });

  // ─── §11 THE BYTES ───────────────────────────────────────────────────────────────────────────
  sec('11 doorLines.js: B22 to B30, verbatim, hash-pinned here');
  const RULED2 = {
    B22: 'Package attached: {client} · {package} · Rs {total}.',
    B23: 'You have no package called {name}. Yours are: {list}.',
    B24: 'Two packages are called {name}: {name} (Rs {total}) · {name} (Rs {total}). Say which one.',
    B25: 'Could not attach the package. {client} has no wedding date yet. Add the date first.',
    B26: 'When is the delivery date for {client}?',
    B27: 'Package attached: {client} · {package} · Rs {total} · Delivery {date}.',
    B28: 'That delivery date cannot be right. Say it like 5 December 2027.',
    B29: 'This couple is booked. The package is fixed on their invoice.',
    B30: 'Could not attach the package.',
  };
  const HASHES2 = {
    B22: 'bbca851eb1d8df31d57d2ff778b67db8bea5e84e10975efe138b36e82db2823c', B23: '5c68d52e310188c9a5d678ba495885cae0ad96236fc7d101435c5fa0e0ce4c2c', B24: '85943481b6496e4cda801f3865c1bdbfa80b760e0f82dcec5a3a2e5d57b57c8a', B25: '54da33cf13d4a3bb0d19333f1f5fa540fbf196af9f1cdd2b2e1b454c8a3f475f', B26: 'ddf2ed942fc9b724116dfd16bf117789dfbbab07cea4a023fdee62120f702484', B27: 'fcbbbddfd50565bfac2269cae1570d550ec93055609e2b5d70c407949879473d', B28: 'a2d7f31aa0ba6c0f3238cebe4791d4d610b31d1eb37085b20a81ecf9bb85b986',
    // B29's twin is dreamos-pwa lib/worklist/packages.ts:126 (refusals.already_booked); B30's is :73 (attachFailed). A dream-os
    // bench cannot read the pwa on his machine, so each pin is the hash literal and the twin is named, not tested.
    B29: 'a3f8c714b924542bafba121ffdb08248f4c0cb34080d9c907088dcfb143ea14d', B30: '5b79740334d8529ab36a64d1dda786c35d403d794b27ed44fcf6a7faf7cff927',
  };
  for (const k of Object.keys(RULED2)) T(`11.1 ${k} is his byte verbatim and its hash is the literal pinned here`, DL.LINES[k] === RULED2[k] && DL.LINE_HASHES[k] === HASHES2[k] && sha(RULED2[k]) === HASHES2[k]);
  const close = src('docs/handovers/TDW_CE44_LCV6_SEAT_CLOSE.md');
  T('11.2 B22 to B28 are byte-identical to the LCV-6 seat close §4, the record of his word', ['B22', 'B23', 'B24', 'B25', 'B26', 'B27', 'B28'].every((k) => close.includes(`  ${k}  ${RULED2[k]}\n`)));
  // 11.3 RE-PINNED (CE-44 LCV-9 PART ONE): it asserted B31 and B32 free while his word was pending. His word came at R-44.36
  // ("yes to your open earlirr questions"). B32 rides Part One (the chair's ruling) and is spoken ONLY by the stand-in, chain
  // out; planAttach still returns noLead and preTurn still answers door false, so 14.16 stands. B31 enters with Part Two.
  // 11.3 RE-PINNED (CE-44 LCV-10 PART B-2, second cut): B31 is HIS now (R-44.36) and b98 holds it; this cell keeps B32's pin.
  T('11.3 B32 is HIS and present, hash-carried, and spoken only through standIn; B31 is present too (b98 holds it)', DL.LINES.B32 === 'Could not attach the package. No lead called {name}. Add the lead first.' && DL.LINE_HASHES.B32 === '136ff0b0c57e5145267570a25752ed723c9f1fad59eca74ee37e884d1607a704' && 'B31' in DL.LINES && (src('src/lib/vendor/workingDoor.js').match(/'B32'/g) || []).length === 2);
  T('11.4 byte 24 renders by position for exactly two, byte 23 lists her own names with " · "', DL.twoPackages('bridal', [{ name: 'Bridal', total: '80,000' }, { name: 'bridal', total: '1,20,000' }]) === 'Two packages are called bridal: Bridal (Rs 80,000) · bridal (Rs 1,20,000). Say which one.'
    && DL.twoPackages('x', [{ name: 'a', total: '1' }]) === null && DL.twoPackages('x', [{ name: 'a', total: null }, { name: 'b', total: '1' }]) === null
    && DL.noSuchPackage('Gold', ['A', ' ', null, 'B']) === 'You have no package called Gold. Yours are: A · B.' && DL.noSuchPackage('Gold', []) === null);

  // ─── §12 F-44.100 ────────────────────────────────────────────────────────────────────────────
  sec('12 F-44.100: an event is not a client (the net), and the one exception');
  const HIS = 'Add a new lead, haldi shoot on 3 January';
  db = makeDb(world());
  o = await run(db, HIS, [{ act: 'lead', client_as_spoken: 'haldi shoot', date_as_spoken: '3 January' }]);
  T('12.1 THE SPECIMEN, his exact sentence with the listener erring as it did on 21 September ("haldi shoot" in the client slot): B18, nothing filed', o.door === true && o.reply === RULED.B18 && o.keys.join() === 'B18' && leadsIn(db).length === 0 && o.skipHarvest === true);
  db = makeDb(world());
  o = await run(db, 'Add a lead for Sangeet Sharma', [{ act: 'lead', client_as_spoken: 'Sangeet Sharma' }]);
  T('12.2 "Sangeet Sharma" is a name: filed', o.reply === 'Lead added: Sangeet Sharma.' && leadsIn(db).length === 1);
  db = makeDb(world());
  o = await run(db, 'Add a lead, Sangeet', [{ act: 'lead', client_as_spoken: 'Sangeet' }]);
  T('12.3 "Sangeet" alone, unasked: B18, nothing filed', o.reply === RULED.B18 && leadsIn(db).length === 0);
  await quiet(() => WD.persistDoorTurn({ supabase: db, agentId: AG, message: 'Add a lead, Sangeet', out: o, lane: 'pwa' }, { memory, meter }));
  const b18Row = db.tables['engine.messages'].filter((m) => m.role === 'assistant').slice(-1)[0];
  T('12.4 the door marks its B18 with its OWN key, meta.listener.asked_name, and never with `asked`', !!b18Row && b18Row.meta.listener.door === true && b18Row.meta.listener.asked_name === 'B18' && !('asked' in b18Row.meta.listener));
  const o12 = await run(db, 'Sangeet', [{ act: 'lead', client_as_spoken: 'Sangeet' }]);
  T('12.5 "Sangeet" ANSWERED TO B18 is the name: filed on her second word, so it cannot loop', o12.reply === 'Lead added: Sangeet.' && leadsIn(db).length === 1 && leadsIn(db)[0].name === 'Sangeet');
  await quiet(() => WD.persistDoorTurn({ supabase: db, agentId: AG, message: 'Sangeet', out: o12, lane: 'pwa' }, { memory, meter }));
  const o13 = await run(db, 'Add a lead, Mehendi', [{ act: 'lead', client_as_spoken: 'Mehendi' }]);
  T('12.6 the exception is the LAST row only: after the door\'s "Lead added" row, an event word is asked again', o13.reply === RULED.B18 && leadsIn(db).length === 1);
  db = makeDb(world());
  db.tables['engine.messages'].push({ id: 'txt', conversation_id: 'c-1', role: 'assistant', content: RULED.B18, meta: { listener: { door: true } }, created_at: new Date(clock += 1000).toISOString() });
  o = await run(db, 'Sangeet', [{ act: 'lead', client_as_spoken: 'Sangeet' }]);
  T('12.7 never by matching text: a row READING B18 without the mark is not the door\'s question', o.reply === RULED.B18 && leadsIn(db).length === 0);
  T('12.8 the net\'s edges: event words and fillers only is no name; any other word makes a name; other scripts are names; not a string is no verdict',
    ['haldi shoot', 'Haldi  Shoot', 'a new lead', 'the pre-wedding shoot', 'Sangeet and Mehendi', 'WEDDING', 'mehndi', 'roka ceremony'].every((n) => WD.eventOnly(n) === true)
    && ['Sangeet Sharma', 'Khanna wedding', 'Haldi for Priya', 'शर्मा', 'haldi शर्मा', 'Personal', '', '   ', '3'].every((n) => WD.eventOnly(n) === false)
    && [null, undefined, 7, {}, []].every((n) => WD.eventOnly(n) === false));
  db = makeDb(world2());
  o = await run(db, 'Attach Photographs and film to haldi shoot', [att('haldi shoot', 'Photographs and film')]);
  T('12.9 the net is for `lead` ONLY: an event word on an attach resolves to no lead, and (B32 pending) the WHOLE message goes to the chain, nothing written', o.door === false && o.why === 'attach_no_lead' && lpsIn(db).length === 0);
  db = makeDb(world());
  o = await run(db, HIS, [{ act: 'lead', date_as_spoken: '3 January' }]);
  await quiet(() => WD.persistDoorTurn({ supabase: db, agentId: AG, message: HIS, out: o, lane: 'pwa' }, { memory, meter }));
  const o14 = await run(db, 'Walk P7 Haldi', [{ act: 'lead', client_as_spoken: 'Walk P7 Haldi', date_as_spoken: '3 January' }]);
  T('12.10 THE CARD\'S TWO STEPS: his sentence heard as the NEW description asks (no name) is B18; then "Walk P7 Haldi" files with the date carried', o.reply === RULED.B18 && o14.reply === 'Lead added: Walk P7 Haldi · 3 January 2027.' && leadsIn(db).length === 1);

  // ─── §13 THE LISTENER'S PROMPT BYTES ─────────────────────────────────────────────────────────
  sec('13 listenerDoor.js: what a client IS, and the package slot (c-44.44)');
  const props = LD.EAR_TOOL.input_schema.properties.acts.items.properties;
  const cd = props.client_as_spoken.description;
  const descCell = (d) => /NAME of a person, a couple or a family/.test(d) && /kind of event or shoot \(haldi, mehendi, sangeet, wedding, reception, engagement, a shoot\) is NEVER a client/.test(d) && /no name was said it is EMPTY/.test(d) && /her answer IS the name, whatever the word/.test(d);
  T('13.1 client_as_spoken says: a person, a couple or a family; a kind of event is NEVER a client; EMPTY when no name was said; her answer to the door\'s question IS the name', descCell(cd));
  T('13.2 package_as_spoken exists, a string, OPTIONAL (required is still act alone), with the ruled description', props.package_as_spoken && props.package_as_spoken.type === 'string' && props.package_as_spoken.description === 'The package exactly as she named it. Empty if none.' && JSON.stringify(LD.EAR_TOOL.input_schema.properties.acts.items.required) === '["act"]');
  const nr = LD.normaliseRequest({ route: 'task', acts: [{ act: 'attach_package', client_as_spoken: ' Sharma ', package_as_spoken: '  Photographs and film ', nonsense: 1 }, { act: 'attach_package', package_as_spoken: 7 }, { act: 'attach_package', package_as_spoken: '   ' }] });
  T('13.3 normaliseRequest carries it trimmed, a string or ABSENT, and still drops what the schema does not hold', nr.acts[0].package_as_spoken === 'Photographs and film' && !('nonsense' in nr.acts[0]) && !('package_as_spoken' in nr.acts[1]) && !('package_as_spoken' in nr.acts[2]));
  T('13.4 every slot the door reads for an act is a slot the listener can fill (the chair\'s standing check from c-44.44)', ['client_as_spoken', 'package_as_spoken', 'date_as_spoken', 'milestone', 'act'].every((k) => k in props));

  // ─── §14 THE ATTACH, THROUGH THE REAL attachPackage ──────────────────────────────────────────
  sec('14 preTurn() on attach_package, through the real attachPackage and the real resolveLead');
  T('14.1 COVERED is six and the recorded hand is attach_package', WD.COVERED.join() === 'booking_confirmed,advance_paid,milestone_paid,invoice,lead,attach_package' && WD.HANDS.attach_package === 'attach_package' && WD.allCovered(req([att('Sharma', 'X')])) === true);
  T('14.2 an attach naming no client is not the door\'s (the untouched return)', WD.allCovered(req([{ act: 'attach_package', package_as_spoken: 'X' }])) === false);
  db = makeDb(world2());
  o = await run(db, 'Attach Photographs and film to Walk P7 Dated', [att('walk p7 dated', 'photographs AND film')]);
  let lp = lpsIn(db);
  T('14.3 THE CARD: B22 with Rs 80,000, and the recorded call', o.door === true && o.reply === 'Package attached: Walk P7 Dated · Photographs and film · Rs 80,000.' && o.keys.join() === 'B22' && o.toolNames.join() === 'attach_package' && o.toolCalls[0].result === 'attached' && o.refresh === true);
  T('14.4 it LANDED AT ONCE (R-44.33): one lead_packages row on HER lead from HER package, nothing staged, no question', lp.length === 1 && lp[0].lead_id === 'l-dated' && lp[0].package_id === 'p-film' && lp[0].vendor_id === V.id && staged(db).length === 0 && !/\?/.test(o.reply));
  T('14.5 the body was EXACTLY { package_id }: the recorded input holds the lead and that one key', JSON.stringify(o.toolCalls[0].input) === JSON.stringify({ lead: 'Walk P7 Dated', package_id: 'p-film' }));
  const bodies = [];
  const spy = async (sb, v, leadId, body) => { bodies.push(JSON.parse(JSON.stringify(body))); return LP.attachPackage(sb, v, leadId, body); };
  db = makeDb(world2());
  o = await run(db, 'x', [att('Walk P7 Dated', 'Photographs and film', '5 June 2027')], 'pwa', { attachPackage: spy });
  T('14.6 on a package that is NOT handover a spoken date is IGNORED: { package_id } alone is sent, and B22 speaks', bodies.length === 1 && JSON.stringify(bodies[0]) === '{"package_id":"p-film"}' && o.keys.join() === 'B22');
  db = makeDb(world2());
  o = await run(db, 'Attach Gold to Walk P7 Dated', [att('Walk P7 Dated', 'Gold')]);
  T('14.7 THE CARD: no package by that name is B23 listing HER OWN live names (not the retired one, not another vendor\'s), nothing written', o.reply === `You have no package called Gold. Yours are: ${OWN_LIST}.` && o.keys.join() === 'B23' && lpsIn(db).length === 0 && o.toolCalls.length === 0);
  o = await run(db, 'x', [att('Walk P7 Dated', 'Photograph and film')]);
  T('14.8 never fuzzy, never nearest: one letter off is B23', o.keys.join() === 'B23' && lpsIn(db).length === 0);
  o = await run(db, 'x', [att('Walk P7 Dated', 'BRIDAL')]);
  T('14.9 two of one name is B24 with each row\'s own name and total; nothing written', o.reply === 'Two packages are called BRIDAL: Bridal (Rs 80,000) · bridal (Rs 1,20,000). Say which one.' && o.skipHarvest === true && lpsIn(db).length === 0);
  o = await run(db, 'Attach Photographs and film to Walk P5 Book', [att('Walk P5 Book', 'Photographs and film')]);
  T('14.10 THE CARD: a BOOKED lead is B29, from attachPackage\'s own 422 already_booked; nothing written', o.reply === RULED2.B29 && o.toolCalls[0].result === 'refused:already_booked' && lpsIn(db).length === 0);
  o = await run(db, 'Attach Photographs and film to Walk P6 Undated', [att('Walk P6 Undated', 'Photographs and film')]);
  T('14.11 THE CARD: an undated lead is B25 with the name from the ROW, from computeSchedule\'s no_wedding_date', o.reply === 'Could not attach the package. Walk P6 Undated has no wedding date yet. Add the date first.' && o.toolCalls[0].result === 'refused:no_wedding_date' && lpsIn(db).length === 0);
  o = await run(db, 'x', [att('Walk Month', 'Photographs and film')]);
  T('14.12 a month-precision date is no wedding date (F24): B25', o.keys.join() === 'B25');
  o = await run(db, 'x', [att('Walk P7 Dated', 'No fee yet')]);
  // 14.13 RE-PINNED (CE-44 LCV-10 PART B-2, second cut; F-44.102): no_fee now speaks HIS OWN byte B33, recorded refused:no_fee; every other refusal is still B30 (14.20, 14.21).
  T('14.13 attachPackage\'s no_fee refusal speaks B33, his own pwa byte, recorded refused:no_fee; nothing written', o.reply === 'Set the fee first.' && o.toolCalls[0].result === 'refused:no_fee' && lpsIn(db).length === 0);
  o = await run(db, 'x', [att('Twin', 'Photographs and film')]);
  T('14.14 two leads of one name reuse B8\'s shape as it stands', o.reply === 'Two clients are called Twin: Twin (1 April 2027) · twin (2 May 2027). Say which one.' && lpsIn(db).length === 0);
  o = await run(db, 'Attach a package to Walk P7 Dated', [{ act: 'attach_package', client_as_spoken: 'Walk P7 Dated' }]);
  // 14.15 RE-PINNED (CE-44 LCV-10 PART B-2, second cut; R-44.36): no package named is now the door's B31 with her sorted names, nothing written.
  T('14.15 NO PACKAGE NAMED is B31, his byte, with HER OWN names sorted; nothing written', o.door === true && o.reply === `Which package? Yours are: ${OWN_LIST}.` && lpsIn(db).length === 0);
  o = await run(db, 'x', [att('Nobody Here', 'Photographs and film')]);
  T('14.16 NO LEAD CALLED {name} (B32 pending): before any write the WHOLE message goes to the chain', o.door === false && o.why === 'attach_no_lead');
  o = await run(db, 'x', [att('Walk P7 Dated', 'Photographs and film'), { act: 'note', client_as_spoken: 'Walk P7 Dated' }]);
  T('14.17 an uncovered act beside it: the WHOLE message to the chain, nothing attached', o.door === false && o.why === 'uncovered' && lpsIn(db).length === 0);
  db = makeDb(world2());
  o = await run(db, 'x', [att('Walk P7 Dated', 'Photographs and film')], 'pwa', { attachPackage: async () => ({ status: 200, body: { ok: true, lead_package: lpRow({ id: 'lp-x', lead_id: 'l-dated', package_id: 'p-film', total: 95000, snapshot: { name: 'The Couple\'s Own Name', delivery_basis: 'days' }, delivery_on: '2027-03-22' }) } }) });
  T('14.18 THE READ-BACK IS FROM THE ROW: the heard name and the package\'s total differ from the returned row, and the ROW is spoken', o.reply === 'Package attached: Walk P7 Dated · The Couple\'s Own Name · Rs 95,000.');
  o = await run(db, 'x', [att('Walk P7 Dated', 'Photographs and film')], 'pwa', { attachPackage: async () => ({ status: 200, body: { ok: true, lead_package: lpRow({ total: 25000, snapshot: { name: 'Album handover', delivery_basis: 'handover' }, delivery_on: '2027-06-05' }) } }) });
  T('14.19 the ROW decides B22 against B27: a returned handover row speaks B27 though a days package was asked', o.reply === 'Package attached: Walk P7 Dated · Album handover · Rs 25,000 · Delivery 5 June 2027.' && o.keys.join() === 'B27');
  o = await run(db, 'x', [att('Walk P7 Dated', 'Photographs and film')], 'pwa', { attachPackage: async () => { throw new Error('boom'); } });
  T('14.20 a throwing attachPackage: the door answers B30 (never the chain), recorded refused:exception', o.door === true && o.reply === RULED2.B30 && o.toolCalls[0].result === 'refused:exception');
  o = await run(db, 'x', [att('Walk P7 Dated', 'Photographs and film')], 'pwa', { attachPackage: async () => ({ status: 500, body: { ok: false, error: 'db down' } }) });
  T('14.21 a 500 is B30', o.reply === RULED2.B30 && o.toolCalls[0].result === 'refused:write_failed');
  db = makeDb(world2());
  await run(db, 'x', [att('Walk P7 Dated', 'Photographs only')]);
  o = await run(db, 'x', [att('Walk P7 Dated', 'Photographs and film')]);
  const liveLp = (db.tables['public.lead_packages'] || []).filter((r) => r.lead_id === 'l-dated' && !r.deleted_at);
  T('14.22 a second attach is the app\'s "Change package": the old row retired, ONE live row, the new one read back', o.keys.join() === 'B22' && liveLp.length === 1 && liveLp[0].package_id === 'p-film' && lpsIn(db).length === 2);
  T('14.23 the door never touches pending_money_acts for an attach', staged(db).length === 0 && !db.log.inserts.some((i) => i.table === 'public.pending_money_acts'));

  // ─── §15 THE DELIVERY DATE ───────────────────────────────────────────────────────────────────
  sec('15 the delivery date (R-44.34 (b), R-44.35, F-44.92)');
  bodies.length = 0;
  db = makeDb(world2());
  o = await run(db, 'Attach Album handover to Walk P7 Dated', [att('Walk P7 Dated', 'Album handover')], 'pwa', { attachPackage: spy });
  T('15.1 THE CARD: a handover package with no date said asks B26; attachPackage is NOT called', o.reply === 'When is the delivery date for Walk P7 Dated?' && o.keys.join() === 'B26' && bodies.length === 0 && lpsIn(db).length === 0 && o.skipHarvest === true);
  await quiet(() => WD.persistDoorTurn({ supabase: db, agentId: AG, message: 'Attach Album handover to Walk P7 Dated', out: o, lane: 'pwa' }, { memory, meter }));
  const seen2 = [];
  o = await quiet(() => WD.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message: '5 June 2027', lane: 'pwa' }, { llmCreate: ear(req([att('Walk P7 Dated', 'Album handover', '5 June 2027')]), null, seen2), nowMs: NOW, attachPackage: spy }));
  const prompt2 = seen2[0] ? String(seen2[0].messages[0].content) : '';
  T('15.2 the carry, the door\'s half: her next message is heard with B26 and the first request on the thread', prompt2.includes('When is the delivery date for Walk P7 Dated?') && prompt2.includes('"package_as_spoken":"Album handover"') && prompt2.endsWith('New message: 5 June 2027'));
  lp = lpsIn(db);
  T('15.3 THE CARD: then the date: { package_id, delivery_on } EXACTLY, and B27 with the date from the ROW', JSON.stringify(bodies[0]) === '{"package_id":"p-hand","delivery_on":"2027-06-05"}' && o.reply === 'Package attached: Walk P7 Dated · Album handover · Rs 25,000 · Delivery 5 June 2027.' && lp.length === 1 && lp[0].delivery_on === '2027-06-05');
  db = makeDb(world2()); bodies.length = 0;
  o = await run(db, 'Attach Album handover to Walk P7 Dated, delivery 5 January 2026', [att('Walk P7 Dated', 'Album handover', '5 January 2026')], 'pwa', { attachPackage: spy });
  T('15.4 THE CARD: a delivery date already past is B28, nothing written, never B21', o.reply === RULED2.B28 && bodies.length === 0 && lpsIn(db).length === 0);
  const dd = async (date) => { const d = makeDb(world2()); const r = await run(d, 'x', [att('Walk P7 Dated', 'Album handover', date)]); return { k: r.keys.join(), n: lpsIn(d).length, on: (lpsIn(d)[0] || {}).delivery_on }; };
  let r1 = await dd('15 March 0227'); let r2 = await dd('20 September 2026'); let r3 = await dd('21 September 2026'); let r4 = await dd('5 June 2032');
  T('15.5 THE SPECIMEN first (his "15 March 0227", reason year) then the edges: yesterday in IST is B28; today is passed; 2032 (plus six) is B28', r1.k === 'B28' && r1.n === 0 && r2.k === 'B28' && r3.k === 'B27' && r3.on === '2026-09-21' && r4.k === 'B28');
  r1 = await dd('5 June 2031'); r2 = await dd('31 February 2027'); r3 = await dd('whenever');
  T('15.6 plus five is passed; an impossible or unreadable date is B7', r1.k === 'B27' && r1.on === '2031-06-05' && r2.k === 'B7' && r2.n === 0 && r3.k === 'B7');
  r1 = await dd('20 February 2027');
  T('15.7 a date EQUAL to the wedding date is treated as misheard: B26, nothing written', r1.k === 'B26' && r1.n === 0);
  r1 = await dd('1 March 2027'); r2 = await dd('1 February 2027');
  T('15.8 a delivery date AFTER the wedding is PASSED, and one before it too: the door enforces nothing the estate does not (F-44.94 is LC-3\'s)', r1.k === 'B27' && r1.on === '2027-03-01' && r2.k === 'B27' && r2.on === '2027-02-01');
  db = makeDb(world2()); bodies.length = 0;
  o = await run(db, 'x', [att('Walk P5 Book', 'Album handover')], 'pwa', { attachPackage: spy });
  const o15 = await run(db, 'x', [att('Walk P6 Undated', 'Album handover')], 'pwa', { attachPackage: spy });
  T('15.9 THE LEAD IS READ BEFORE B26 IS ASKED: a booked lead is B29 and an undated one B25, she is never asked for a date and then refused', o.reply === RULED2.B29 && o15.keys.join() === 'B25' && bodies.length === 0);
  // the mirror, pinned against attachPackage's OWN answer on the same rows (with a date supplied, so only the lead decides)
  const own = async (leadId) => (await LP.attachPackage(makeDb(world2()), V, leadId, { package_id: 'p-hand', delivery_on: '2027-06-05' })).body;
  const ownBooked = await own('l-booked'); const ownUndated = await own('l-undated'); const ownMonth = await own('l-month'); const ownDated = await own('l-dated');
  const mine = async (name) => { const d = makeDb(world2()); return (await run(d, 'x', [att(name, 'Album handover', '5 June 2027')])).keys.join(); };
  T('15.10 the mirror agrees with attachPackage on every lead: booked, undated, month-precision, dated', ownBooked.code === 'already_booked' && (await mine('Walk P5 Book')) === 'B29' && ownUndated.code === 'no_wedding_date' && (await mine('Walk P6 Undated')) === 'B25' && ownMonth.code === 'no_wedding_date' && (await mine('Walk Month')) === 'B25' && ownDated.ok === true && (await mine('Walk P7 Dated')) === 'B27');
  o = await run(makeDb(world2()), 'x', [att('Walk P7 Dated', 'Album handover', '5 June 2027')], 'pwa', { attachPackage: async () => ({ status: 422, body: { ok: false, error: 'refused', code: 'no_handover_date' } }) });
  T('15.11 attachPackage\'s own no_handover_date is answered with the question, B26', o.reply === 'When is the delivery date for Walk P7 Dated?');

  // ─── §16 THE ORDER, AND THE ONE-MESSAGE FLOW ─────────────────────────────────────────────────
  sec('16 leads, then attaches, then invoices, then the ONE money act; the money plan REBUILT after the attach pass');
  const FLOW = 'Add a lead for Walk P7 Flow, wedding 5 December, attach Photographs and film, the advance came in today';
  const flowActs = (pkg) => [{ act: 'lead', client_as_spoken: 'Walk P7 Flow', date_as_spoken: '5 December' }, att('Walk P7 Flow', pkg), { act: 'advance_paid', client_as_spoken: 'Walk P7 Flow', date_as_spoken: 'today' }];
  db = makeDb(world2());
  o = await run(db, FLOW, flowActs('Photographs and film'));
  T('16.1 THE CARD: one message speaks the lead line, the attach line and B2 ONCE, the package and total from the row just attached', o.reply === 'Lead added: Walk P7 Flow · 5 December 2026.\n\nPackage attached: Walk P7 Flow · Photographs and film · Rs 80,000.\n\nConfirm this booking? Walk P7 Flow · Photographs and film · Rs 80,000. Reply YES or NO.' && o.keys.join() === 'B17,B22,B2');
  T('16.2 one lead filed, one package attached to THAT lead, ONE row staged, the hands recorded in order', leadsIn(db).length === 1 && lpsIn(db).length === 1 && lpsIn(db)[0].lead_id === leadsIn(db)[0].id && staged(db).length === 1 && staged(db)[0].act === 'advance_paid' && o.toolNames.join() === 'donna_lead,attach_package');
  db = makeDb(world2());
  o = await run(db, FLOW, flowActs('Gold'));
  T('16.3 when the attach REFUSES the door speaks what landed and what did not, asks NO B2 and stages NO row', o.door === true && o.reply === `Lead added: Walk P7 Flow · 5 December 2026.\n\nYou have no package called Gold. Yours are: ${OWN_LIST}.` && staged(db).length === 0 && leadsIn(db).length === 1 && lpsIn(db).length === 0);
  db = makeDb(world2());
  db.tables['public.lead_packages'].push(lpRow({ id: 'lp-old', lead_id: 'l-dated', package_id: 'p-otd', total: 40000, snapshot: { name: 'Photographs only', delivery_basis: 'on_the_day' }, schedule: [] }));
  o = await run(db, 'x', [att('Walk P7 Dated', 'Gold'), { act: 'booking_confirmed', client_as_spoken: 'Walk P7 Dated' }]);
  T('16.4 a refused attach on a lead that ALREADY holds a package does not ask B2 over the old one', o.keys.join() === 'B23' && staged(db).length === 0);
  db = makeDb(world2());
  o = await run(db, FLOW, flowActs('Photographs and film'), 'pwa', { createLead: async () => ({ ok: false }) });
  T('16.5 the lead failed, so the attach finds no lead AFTER a write: the door keeps the turn and says B20 and B30; no B2, nothing staged', o.door === true && o.keys.join() === 'B20,B30' && staged(db).length === 0 && lpsIn(db).length === 0);
  db = makeDb(world2());
  o = await run(db, 'x', [{ act: 'invoice', client_as_spoken: 'Walk45' }, att('Walk P7 Dated', 'Photographs and film')]);
  T('16.6 attaches before invoices, whatever order she said them in', o.keys.join() === 'B22,B13');
  db = makeDb(world2());
  o = await run(db, 'x', [att('Walk P7 Dated', 'Photographs and film'), { act: 'invoice', client_as_spoken: 'Nobody' }]);
  T('16.7 every act resolved before the first write: an unresolvable invoice sends the WHOLE message to the chain and NOTHING is attached', o.door === false && lpsIn(db).length === 0);
  db = makeDb(world2());
  o = await run(db, 'x', [{ act: 'lead', client_as_spoken: 'Walk P7 Flow' }, { act: 'booking_confirmed', client_as_spoken: 'Walk P7 Flow' }]);
  T('16.8 the rebuilt plan reads the lead just filed: B5 (no package yet), never "No lead called" beside "Lead added"', o.reply === 'Lead added: Walk P7 Flow.\n\nCould not confirm the booking. Walk P7 Flow has no package yet. Attach a package first.');

  // ─── §17 NO CHIP; THE WHATSAPP LANE ──────────────────────────────────────────────────────────
  sec('17 no chip on an attach, on both lanes; the WhatsApp step of the card');
  db = makeDb(world2());
  o = await run(db, 'Attach Photographs and film to Walk P6 Dated', [att('Walk P6 Dated', 'Photographs and film')], 'whatsapp');
  T('17.1 the door\'s answer carries exactly the door\'s fields and no document', Object.keys(o).sort().join() === 'documents,door,ear,keys,refresh,reply,skipHarvest,toolCalls,toolNames' && o.documents.length === 0);
  const sends2 = [];
  await quiet(() => WD.speakOnWhatsApp({ supabase: db, agentId: AG, phone: '+919888294440', convoId: 'wc-1', message: 'x', out: o, sendWhatsApp: async (ph, body, media) => { sends2.push({ body, media }); return { sid: 's' }; } }, { persistDoorTurn: async () => ({}) }));
  T('17.2 THE CARD on WhatsApp: ONE send, B22 alone, no media', sends2.length === 1 && sends2[0].body === 'Package attached: Walk P6 Dated · Photographs and film · Rs 80,000.' && sends2[0].media.length === 0);
  T('17.3 pwa: the door turn\'s wire still holds no chip', sseDoor.length > 100 && !/operator_action|handoff|operator_report/.test(sseDoor));

  // ─── §18 W-1 AND SCOPE, FROM THIS PACKET'S OWN MANIFEST ──────────────────────────────────────
  sec('18 W-1 NONE, read from P6a-2\'s own manifest');
  const listed2 = fs.existsSync(P(MAN2)) ? fs.readFileSync(P(MAN2), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')) : null;
  T(`18.1 the manifest exists (${MAN2})`, !!listed2 && listed2.length > 0);
  T('18.2 no engine, soul or lens path; no migration; no pwa path', !!listed2 && !listed2.some((f) => /^src\/engine\/|soul|lens|^db\/migrations\//.test(f)));
  T('18.3 the manifest is exactly the seven paths of this cut', !!listed2 && listed2.slice().sort().join() === ['docs/handovers/TDW_CE44_LCV8_P6A2_HANDOVER.md', 'scripts/b90_lcv_p5_bench.js', 'scripts/b92_lcv_p6a_bench.js', 'scripts/floor-manifest-ce44-lcv8-p6a2.txt', 'src/lib/vendor/doorLines.js', 'src/lib/vendor/listenerDoor.js', 'src/lib/vendor/workingDoor.js'].sort().join());
  T('18.4 handResult.js is not edited and no donna_ name was invented for the attach', !listed2 || (!listed2.includes('src/lib/vendor/handResult.js') && !/donna_attach/.test(src('src/lib/vendor/workingDoor.js'))));

  // ─── §19 FUZZ ────────────────────────────────────────────────────────────────────────────────
  sec('19 fuzz: planAttach, fileAttach, eventOnly and the new builders, every position, the act itself hostile');
  let calls2 = 0; let throws2 = 0;
  const hit2 = async (fn) => { calls2 += 1; try { await fn(); } catch (_e) { throws2 += 1; } };
  const realL = { lifecycle: require(P('src/lib/vendor/lifecycleHands.js')), attachPackage: LP.attachPackage };
  const goodAttach = { attach: { leadId: 'l-dated', client: 'Walk P7 Dated', body: { package_id: 'p-film' } } };
  for (const a of hostileActs) {
    await hit2(() => WD.eventOnly(a));
    await hit2(() => DL.twoPackages(a, a)); await hit2(() => DL.twoPackages('x', [a, a])); await hit2(() => DL.noSuchPackage(a, a)); await hit2(() => DL.noSuchPackage('x', [a]));
    await hit2(() => quiet(() => WD.planAttach(makeDb(world2()), V, a, NOW, realL)));
    await hit2(() => quiet(() => WD.planAttach(a, V, att('Walk P7 Dated', 'Album handover', '5 June 2027'), NOW, realL)));
    await hit2(() => quiet(() => WD.planAttach(makeDb(world2()), a, att('Walk P7 Dated', 'Album handover', '5 June 2027'), NOW, realL)));
    await hit2(() => quiet(() => WD.planAttach(makeDb(world2()), V, att('Walk P7 Dated', 'Album handover', '5 June 2027'), a, realL)));
    await hit2(() => quiet(() => WD.planAttach(makeDb(world2()), V, att('Walk P7 Dated', 'Album handover', '5 June 2027'), NOW, a)));
    for (const field of ['client_as_spoken', 'package_as_spoken', 'date_as_spoken']) {
      const act = att('Walk P7 Dated', 'Album handover', '5 June 2027'); act[field] = a;
      await hit2(() => quiet(() => WD.planAttach(makeDb(world2()), V, act, NOW, realL)));
      await hit2(() => quiet(() => WD.preTurn({ supabase: makeDb(world2()), vendor: V, agentId: AG, route: ROUTE, message: 'x', lane: 'pwa' }, { llmCreate: ear(req([act])), nowMs: NOW })));
    }
    await hit2(() => quiet(() => WD.fileAttach(makeDb(world2()), V, a, realL)));
    await hit2(() => quiet(() => WD.fileAttach(a, V, goodAttach, realL)));
    await hit2(() => quiet(() => WD.fileAttach(makeDb(world2()), a, goodAttach, realL)));
    await hit2(() => quiet(() => WD.fileAttach(makeDb(world2()), V, goodAttach, a)));
    await hit2(() => quiet(() => WD.fileAttach(makeDb(world2()), V, { attach: a }, realL)));
    await hit2(() => quiet(() => WD.fileAttach(makeDb(world2()), V, goodAttach, { attachPackage: async () => a })));
    await hit2(() => quiet(() => WD.fileAttach(makeDb(world2()), V, goodAttach, { attachPackage: async () => ({ status: 200, body: { ok: true, lead_package: a } }) })));
    await hit2(() => quiet(() => WD.fileAttach(makeDb(world2()), V, goodAttach, { attachPackage: async () => ({ status: 200, body: { ok: true, lead_package: { snapshot: a, total: a, delivery_on: a } } }) })));
    await hit2(() => quiet(() => WD.lastWasDoorNameQuestion(a, a)));
  }
  const CALLS2_PINNED = hostileActs.length * 25; // derived for THIS fuzz: 25 calls for each hostile value (5 + 5 + 3 x 2 + 8 + 1)
  T(`19.1 ${calls2} calls with hostile values in every argument position, the act itself included: zero throws`, throws2 === 0 && calls2 === CALLS2_PINNED && calls2 > 0);
  const lies = await quiet(() => WD.fileAttach(makeDb(world2()), V, goodAttach, { attachPackage: async () => ({ status: 200, body: { ok: true, lead_package: { snapshot: null, total: null } } }) }));
  T('19.2 a row that landed but cannot be read back is never spoken as B30 ("could not attach" would be untrue): no line, landed', lies.landed === true && lies.line === null);

  // ─── §20 MUTATIONS ───────────────────────────────────────────────────────────────────────────
  sec('20 mutations of production code, each reddening its cell');
  const LDf = 'src/lib/vendor/listenerDoor.js';
  const attCase = async (rq, message, acts, extra, seedFn) => { const d = makeDb(world2()); if (seedFn) seedFn(d); const r = await quiet(() => rq(WDf).preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message, lane: 'pwa' }, { llmCreate: ear(req(acts)), generateInvoiceForBinder: gen, nowMs: NOW, ...(extra || {}) })); return { r, d, lps: lpsIn(d), leads: leadsIn(d), staged: staged(d) }; };
  await mut('20.1 N1 the net removed: his sentence files a lead named "haldi shoot" again (reddens 12.1)', WDf,
    [["    if (answeringB18 !== true && eventOnly(name)) return { speak: DL.LINES.B18, key: 'B18', skipHarvest: true }; // F-44.100\n", '']], [],
    async (rq) => attCase(rq, HIS, [{ act: 'lead', client_as_spoken: 'haldi shoot', date_as_spoken: '3 January' }]), (x) => x.leads.length === 1 && x.leads[0].name === 'haldi shoot');
  await mut('20.2 N2 the exception removed: "Sangeet" answered to B18 is asked again, a loop (reddens 12.5)', WDf,
    [['    return !!l && l.door === true && l.asked_name === \'B18\';', '    return false;']], [],
    async (rq) => attCase(rq, 'Sangeet', [{ act: 'lead', client_as_spoken: 'Sangeet' }], null, (d) => d.tables['engine.messages'].push({ id: 'q', conversation_id: 'c-1', role: 'assistant', content: 'q', meta: { listener: { door: true, asked_name: 'B18' } }, created_at: new Date(clock += 1000).toISOString() })), (x) => x.r.reply === RULED.B18 && x.leads.length === 0);
  await mut('20.3 N3 the mark never written: the exception has nothing to read (reddens 12.4)', WDf,
    [["...(askedName ? { asked_name: askedName } : {}), ", '']], [],
    async (rq) => { const d = makeDb(world()); const mem = { getOrCreateConversation: async () => ({ conversationId: 'c-1' }), saveMessage: async (cid, role, content, _tc, meta) => { d.tables['engine.messages'].push({ id: `k-${d.tables['engine.messages'].length}`, conversation_id: cid, role, content, meta: meta || null, created_at: new Date(clock += 1000).toISOString() }); return 'k'; } }; await quiet(() => rq(WDf).persistDoorTurn({ supabase: d, agentId: AG, message: 'x', out: { door: true, reply: RULED.B18, keys: ['B18'], toolCalls: [], ear: null }, lane: 'pwa' }, { memory: mem, meter })); return d.tables['engine.messages'].slice(-1)[0]; }, (m) => !!m && !('asked_name' in m.meta.listener));
  await mut('20.4 N4 today\'s description restored: the listener is no longer told an event is never a client (reddens 13.1)', LDf,
    [["description: 'The NAME of a person, a couple or a family, exactly as she said it.", "description: 'The client exactly as she said it. Empty if none.' }, x_was: { type: 'string', description: '"]], [],
    async (rq) => rq(LDf).EAR_TOOL.input_schema.properties.acts.items.properties.client_as_spoken.description, (d) => d === 'The client exactly as she said it. Empty if none.' && descCell(d) === false);
  await mut('20.5 N5 normaliseRequest dropping the package slot: the door has no name and the attach leaves for the chain (reddens 13.3 and 14.3)', LDf,
    [["      if (typeof a.package_as_spoken === 'string' && a.package_as_spoken.trim()) out.package_as_spoken = a.package_as_spoken.trim();\n", '']], [],
    async (rq) => rq(LDf).normaliseRequest({ route: 'task', acts: [att('S', 'P')] }), (q) => !('package_as_spoken' in q.acts[0]));
  await mut('20.6 N6 a nearest match in the resolver: one letter off attaches (reddens 14.8)', WDf,
    [['    const hits = pkgs.filter((p) => p && key(p.name) === key(said));', "    const hits = pkgs.filter((p) => p && key(p.name).replace(/s/g, '') === key(said).replace(/s/g, ''));"]], [],
    async (rq) => attCase(rq, 'x', [att('Walk P7 Dated', 'Photograph and film')]), (x) => x.lps.length === 1);
  await mut('20.7 N7 the vendor filter dropped from the resolver: another vendor\'s package makes two of one name (reddens 14.3)', WDf,
    [["    .eq('vendor_id', vendorId).is('deleted_at', null);\n  return (error || !Array.isArray(data)) ? null : data;", "    .is('deleted_at', null);\n  return (error || !Array.isArray(data)) ? null : data;"]], [],
    async (rq) => attCase(rq, 'x', [att('Walk P7 Dated', 'Photographs and film')]), (x) => x.r.door !== true || x.r.keys.join() !== 'B22');
  await mut('20.8 N8 the read-back from what was HEARD instead of the row (reddens 14.18)', WDf,
    [['      const vals = { client: a.client, package: snap.name, total: digits(row.total) };', '      const vals = { client: a.client, package: a.heard || \'Photographs and film\', total: digits(80000) };']], [],
    async (rq) => attCase(rq, 'x', [att('Walk P7 Dated', 'Photographs and film')], { attachPackage: async () => ({ status: 200, body: { ok: true, lead_package: lpRow({ total: 95000, snapshot: { name: 'The Couple\'s Own Name', delivery_basis: 'days' } }) } }) }), (x) => x.r.reply === 'Package attached: Walk P7 Dated · Photographs and film · Rs 80,000.');
  await mut('20.9 N9 a spoken date sent on a package that is NOT handover (reddens 14.6)', WDf,
    [["    if (pkg.delivery_basis === 'handover') {", '    if (true) {']], [],
    async (rq) => { const seenB = []; const x = await attCase(rq, 'x', [att('Walk P7 Dated', 'Photographs and film', '5 June 2027')], { attachPackage: async (sb, v, id, body) => { seenB.push(body); return LP.attachPackage(sb, v, id, body); } }); return seenB; }, (b) => b.length === 1 && b[0].delivery_on === '2027-06-05');
  await mut('20.10 N10 the delivery range removed: a past delivery date is attached (reddens 15.4)', WDf,
    [["      if (d.iso < t[0] || y < y0 || y > y0 + 5) return { speak: DL.LINES.B28, key: 'B28' };\n", '']], [],
    async (rq) => attCase(rq, 'x', [att('Walk P7 Dated', 'Album handover', '5 January 2026')]), (x) => x.lps.length === 1 && x.lps[0].delivery_on === '2026-01-05');
  await mut('20.11 N11 the misheard check removed: the wedding date is sent as the delivery date (reddens 15.7)', WDf,
    [['      if (d.iso === lead.wedding_date) return ask(); // the wedding date heard as the delivery date: misheard, ask\n', '']], [],
    async (rq) => attCase(rq, 'x', [att('Walk P7 Dated', 'Album handover', '20 February 2027')]), (x) => x.lps.length === 1 && x.lps[0].delivery_on === '2027-02-20');
  await mut('20.12 N12 the lead\'s own row not read before B26: a booked couple is asked for a delivery date (reddens 15.9)', WDf,
    [["      if (key(lead.state) === 'booked' || lead.binder_id) return { speak: DL.LINES.B29, key: 'B29' };\n", '']], [],
    async (rq) => attCase(rq, 'x', [att('Walk P5 Book', 'Album handover')]), (x) => x.r.keys.join() === 'B26');
  await mut('20.13 N13 THE CHAIR\'S: the money plan NOT rebuilt after the attach pass, the probe spoken instead (reddens 16.1)', WDf,
    [['        moneyPlan = await planMoney(supabase, vendor, money[0], L);\n        if (!moneyPlan) {', '        if (!moneyPlan) {']], [],
    async (rq) => attCase(rq, FLOW, flowActs('Photographs and film')), (x) => x.r.keys.join() === 'B17,B22,B4' && x.staged.length === 0);
  await mut('20.14 N14 a refused attach no longer silencing the money act: B2 is asked over the OLD package and a row is staged (reddens 16.4)', WDf,
    [['      if (attachMissed) moneyPlan = null;\n      else {', '      {']], [],
    async (rq) => attCase(rq, 'x', [att('Walk P7 Dated', 'Gold'), { act: 'booking_confirmed', client_as_spoken: 'Walk P7 Dated' }], null, (d) => d.tables['public.lead_packages'].push(lpRow({ id: 'lp-old', lead_id: 'l-dated', package_id: 'p-otd', total: 40000, snapshot: { name: 'Photographs only', delivery_basis: 'on_the_day' } }))), (x) => x.r.keys.join() === 'B23,B2' && x.staged.length === 1);
  // ANCHORS RE-AIMED (CE-44 LCV-9 PART ONE): the probe's no-lead line gained its `say` ({ name }) so the stand-in can speak B32
  // chain out; the line's verdict is unchanged. N15a and N15 carry the new bytes of the same line; what they prove is unchanged.
  // TWO GUARDS HOLD 14.16, and the cell says so: with the probe's line alone removed the rebuild still sends an unwritten
  // turn to the chain (run here as N15a, which must NOT redden); it takes both removed for the door to answer B30.
  await mut('20.15a N15a the probe\'s no-lead line ALONE removed: the rebuild\'s own guard still sends the unwritten turn to the chain', WDf,
    [["      if (probe.noLead && !willFile.includes(key(probe.name))) return CHAIN(st.ear, 'attach_no_lead', { name: probe.name });\n", '']], [],
    async (rq) => attCase(rq, 'x', [att('Nobody Here', 'Photographs and film')]), (x) => x.r.door === false && x.r.why === 'attach_unsayable');
  await mut('20.15 N15 BOTH guards removed: an attach naming no lead is answered by the door instead of going WHOLE to the chain (reddens 14.16)', WDf,
    [["      if (probe.noLead && !willFile.includes(key(probe.name))) return CHAIN(st.ear, 'attach_no_lead', { name: probe.name });\n", ''], ["        if (!st.wrote) return CHAIN(st.ear, 'attach_unsayable');\n", '']], [],
    async (rq) => attCase(rq, 'x', [att('Nobody Here', 'Photographs and film')]), (x) => x.r.door === true && x.r.keys.join() === 'B30');
  await mut('20.16 N16 the write mark AND fileAttach\'s guard removed: a throwing attachPackage falls to the chain after a possible write (reddens 14.20)', WDf,
    [['      st.wrote = true; // the re-attach retires the live row before it inserts; either may land inside a call that throws\n', ''], ["  } catch (_e) { return B30('refused:exception'); }", '  } finally { /* guard removed */ }']], [],
    async (rq) => attCase(rq, 'x', [att('Walk P7 Dated', 'Photographs and film')], { attachPackage: async () => { throw new Error('boom'); } }), (x) => x.r.door === false);
  await mut('20.17 N17 planAttach without its guard throws on a hostile act (reddens 19.1)', WDf,
    [['    return { attach: { leadId: found.lead.id, client, body } };\n  } catch (_e) { return null; }', '    return { attach: { leadId: found.lead.id, client, body } };\n  } finally { /* guard removed */ }']], [],
    async (rq) => { let t = 0; for (const a of hostileActs) { try { await quiet(() => rq(WDf).planAttach(makeDb(world2()), V, a, NOW, realL)); } catch (_e) { t += 1; } } return t; }, (t) => t > 0);
  await mut('20.18 N18 attach staged into pending_money_acts instead of landing (R-44.33): caught by 14.4 and 14.23', WDf,
    [['      const f = await fileAttach(supabase, vendor, ap, L);', "      await pma.stage(supabase, { vendorId: vendor.id, act: 'advance_paid', request: {}, lane }); const f = await fileAttach(supabase, vendor, ap, L);"]], [],
    async (rq) => attCase(rq, 'x', [att('Walk P7 Dated', 'Photographs and film')]), (x) => x.d.log.inserts.some((i) => i.table === 'public.pending_money_acts'));
  await mut('20.19 N19 b90\'s re-aimed M5 anchor is HANDS\' new last entry, and a forbidden hand after it is still seen', WDf,
    [["  attach_package: 'attach_package',\n});", "  attach_package: 'attach_package',\n  note: 'donna_money_edit',\n});"]], [],
    async (rq) => Object.values(rq(WDf).HANDS), (h) => h.includes('donna_money_edit'));

  console.log(`\n════════  b92 · ${pass} pass · ${fail} fail  ════════`);
  if (fail) { console.log('FAILED:'); for (const f of failed) console.log(`  · ${f}`); }
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('b92 CRASHED:', e && e.stack); process.exit(2); });
