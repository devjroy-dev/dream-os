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
  T('1.2 B15 is not minted (owed by the last packet; its key stays free); B22 to B29 are not here yet (P6a-2)', !('B15' in DL.LINES) && ['B22', 'B23', 'B24', 'B25', 'B26', 'B27', 'B28', 'B29'].every((k) => !(k in DL.LINES)));
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
  T('4.5 attach_package is NOT covered at P6a-1', WD.allCovered(req([{ act: 'attach_package', client_as_spoken: 'Sharma' }])) === false);
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
  await mut('10.4 M4 the lead exception removed: a nameless lead goes to the chain, B18 is never said (reddens 5.6 and 4.1)', WDf,
    [["    if (request.acts.some((a) => a && a.act === 'lead')) {", '    if (false) {']], [],
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
    [["    for (const a of acts) if (a.act === 'lead') leadPlans.push(planLead(a, nowMs));", "    for (const a of acts) if (a.act === 'lead') { const q = planLead(a, nowMs); if (q.lead) await fileLead(supabase, vendor, lane, q, L); leadPlans.push({ speak: null }); }"]], [],
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

  console.log(`\n════════  b92 · ${pass} pass · ${fail} fail  ════════`);
  if (fail) { console.log('FAILED:'); for (const f of failed) console.log(`  · ${f}`); }
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('b92 CRASHED:', e && e.stack); process.exit(2); });
