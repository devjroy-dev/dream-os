'use strict';
// scripts/b96_lcv10_fix_bench.js · TDW CE-44 · LCV-10 · PART B-1's FIX FORWARD: F-44.114 and F-44.115 (F-44.113 folded in). Rung b96.
//
// WITNESSED, the founder's walk of 22 September 2026, step 1, on WhatsApp, his own words with his own full stops: "Add a new lead. Tara
// walk ten. Wedding on 5th March 27." sent three times; the door answered B7, B7, B3 (his Railway log, 20:03:19, 20:03:51, 20:04:22 UTC).
// F-44.114: a date wrapped in stray punctuation was unreadable ("5th March 27."). F-44.115, A REGRESSION OF PART B-1: refused a date, he
// RETYPED THE WHOLE SENTENCE; the listener heard the noted act for the same client, the note stood, and his sentence was read as a date.
// At 6456690 the same retype FILED (Part A's walk, turn 6).
//
// C-44.12, SHARPENED BY e-68: CELLS COME FROM WHAT HE DID ON THE LAST WALK, NOT ONLY FROM THE DESIGN'S CASES. Part A's turns 4 and 6 are
// replayed from TDW_CE44_LCV10_PARTB1_HANDOVER.md §3, which holds them by script from his export. HIS EXPORT OF THE 22 SEPTEMBER WALK HAD
// NOT ARRIVED WHEN THIS RUNG WAS CUT: the hearing of his three messages is INFERRED (the one hearing that reproduces his log reply for
// reply through the real door) and LABELLED INFERRED at its cells; it is replaced verbatim when the export arrives.
//
//  §1 THE TABLE: how a vendor types a date. His exact words first, then the chair's specimens of 22 September, each labelled reads or
//     refused. Every row is clock-proof (C-44.13): a row with a year pins its day; a row without one must read AS ITS BARE FORM READS.
//  §2 F-44.115: the restated job, the different client (F-44.113), and what still does NOT lapse the note.
//  §3 THE REGRESSION'S CELLS: Part A's turns 4 and 6 replayed; his three messages of 22 September in one thread.
//  §4 EVERY SAY LINE ON THE FIX's WALK CARD, one thread, one database, the real lanes' own door, createLead, attachPackage and staging.
//  §5 W-1 and the scope. §6 fuzz. §7 mutations, each reddening its cell.
// THE EXIT CODE IS THE VERDICT.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-ce44-lcv10-partb1fix.txt';
const RECORD = 'docs/handovers/TDW_CE44_LCV9_PART1_WALK_RECORD.md';
let pass = 0; let fail = 0; const failed = [];
function T(name, cond) { if (cond) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}`); } }
const sec = (t) => console.log(`\n§${t}`);
const quiet = async (fn) => { const w = console.warn; const e = console.error; const l = console.log; console.warn = () => {}; console.error = () => {}; console.log = () => {}; try { return await fn(); } finally { console.warn = w; console.error = e; console.log = l; } };
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const src = (rel) => fs.readFileSync(P(rel), 'utf8');

const WDf = 'src/lib/vendor/workingDoor.js';
const LDf = 'src/lib/vendor/listenerDoor.js';
const WDP = P(WDf);
const VIP = P('src/lib/vendorInbound.js');
const LFP = P('src/lib/laneFlags.js');

// THE RECORD'S BYTES (turn 8, HEARD), never retyped from memory: 1.0 asserts the record holds this exact line.
const TURN8_JSON = '{"acts":[{"act":"lead","date_as_spoken":"20 February 2027","client_as_spoken":"Walk P8 Fresh"},{"act":"book_event","date_as_spoken":"20 February 2027","client_as_spoken":"Walk P8 Fresh"}],"route":"task"}';
const TURN8_SAID = 'Add a new lead Walk P8 Fresh, wedding on 20 February 2027';
const turn8 = () => JSON.parse(TURN8_JSON);
// Deep equality with keys sorted: normaliseRequest writes each act's keys in ITS order, so the record is compared by value, never by key order.
const canon = (v) => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, k) => { o[k] = x[k]; return o; }, {}) : x));
// e-62 (accepted by the chair): with the drop removed, 2.3 dereferenced a field a refused turn does not carry and the bench CRASHED,
// listing no later cell. J() joins what is there, so a missing helper or a refused turn reads as a named FAIL and every later cell still lists.
const J = (a) => (Array.isArray(a) ? a.join() : '');
const isTurn8 = (v) => canon(v) === canon(JSON.parse(TURN8_JSON));
const B34 = 'I cannot do that by message yet. Use the app for it.';
const SENTENCE = "A wedding date said with a new lead belongs to that lead: put it in the lead's date and record no book_event for it.";

// ── an in-memory database (b93's shape, which the REAL createLead and the REAL attachPackage already run on in b92) ──
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
      gte() { return b; }, lte() { return b; }, gt() { return b; }, lt() { return b; }, or() { return b; }, ilike() { return b; },
      not() { return b; }, order(k, oo) { orderBy = { k, asc: !(oo && oo.ascending === false) }; return b; }, limit(n) { limitN = n; return b; },
      insert(p) { mode = 'insert'; payload = p; return b; }, update(p) { mode = 'update'; payload = p; return b; }, upsert(p) { mode = 'insert'; payload = p; return b; },
      then(res, rej) { return Promise.resolve().then(run).then(res, rej); },
      maybeSingle() { const r = run(); return Promise.resolve({ data: r.data ? r.data[0] || null : null, error: r.error }); },
      single() { const r = run(); return Promise.resolve({ data: r.data ? r.data[0] || null : null, error: r.data && r.data.length ? null : { message: 'no row' } }); },
    };
    return b;
  };
  return { tables, log, from: (n) => builder('public', n), schema: (s) => ({ from: (n) => builder(s, n) }), rpc: async () => ({ data: null, error: null }) };
}

const V = { id: 'v-1', tier: 'signature', user_id: 'u-1', onboarding_state: 'complete', category: 'photographer' };
const AG = 'ag-1';
const NOW = Date.parse('2026-09-21T06:00:00Z'); // 11:30 IST, 21 September 2026
const ROUTE = { provider: 'anthropic', model: 'm-primary', listener_provider: 'anthropic', listener_model: 'm-listen' };
// public.leads, ALL 29 columns, and public.vendor_packages, ALL 16 (docs/db/PUBLIC_SCHEMA.md; b92's whole-row shapes, C-44.3).
function leadRow(o) {
  return Object.assign({
    id: null, vendor_id: V.id, name: null, phone: null, email: null, wedding_date: null, wedding_city: null, event_types: null,
    budget_min: null, budget_max: null, source: 'self', referrer_name: null, state: 'new', raw_message: null, notes: null,
    created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', client_id: null, deleted_at: null, vendor_summary: null,
    intent_summary: null, intent_summary_at: null, wedding_date_precision: null, function_count: null, wedding_days: null,
    functions: null, draft_meta: null, wedding_id: null, binder_id: null,
  }, o);
}
function pkgRow(o) {
  return Object.assign({ id: null, vendor_id: V.id, name: null, description: '', line_items: [], total: null, deposit_pct: 30, middle_pct: 30,
    middle_enabled: true, delivery_basis: 'on_the_day', delivery_days: null, is_default: false, seeded_from: null,
    created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', deleted_at: null }, o);
}
// His three packages as his fixture SELECT of 21 September returned them (the walk record §2), in the order it returned them.
function world() {
  return {
    'public.admin_config': [],
    'public.leads': [leadRow({ id: 'l-old', name: 'Walk P6 Dated', wedding_date: '2027-02-14', wedding_date_precision: 'day' })],
    'public.vendor_packages': [
      pkgRow({ id: 'p-pre', name: 'Pre wedding shoot', total: 50000, delivery_basis: 'on_the_day' }),
      pkgRow({ id: 'p-album', name: 'Walk P7 Album', total: 25000, delivery_basis: 'handover' }),
      pkgRow({ id: 'p-film', name: 'Photographs and film', total: 80000, delivery_basis: 'days', delivery_days: 30 }),
    ],
    'public.clients': [], 'public.lead_packages': [], 'public.invoices': [], 'public.pending_money_acts': [], 'public.payment_schedules': [],
    'engine.records': [],
    'engine.conversations': [{ id: 'c-1', agent_id: AG, state: 'active', last_active_at: '2026-09-21T05:00:00Z' }],
    'engine.messages': [],
  };
}
const req = (acts, route = 'task') => ({ route, acts });
const earOf = (request) => async () => ({ content: [{ type: 'tool_use', name: 'ear_request', input: request }], usage: { input_tokens: 1400, output_tokens: 50 } });
const leadsIn = (db) => db.log.inserts.filter((i) => i.table === 'public.leads').flatMap((i) => i.rows);
const lpsIn = (db) => db.log.inserts.filter((i) => i.table === 'public.lead_packages').flatMap((i) => i.rows);
const lead = (client, date) => ({ act: 'lead', client_as_spoken: client, ...(date ? { date_as_spoken: date } : {}) });
const event = (client, date) => ({ act: 'book_event', ...(client ? { client_as_spoken: client } : {}), ...(date ? { date_as_spoken: date } : {}) });

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

const WALK_A = 'docs/handovers/TDW_CE44_LCV10_PARTB1_HANDOVER.md';
const SDf = 'src/lib/vendor/spokenDate.js';
const T4_SAID = 'Add a new lead kabir walk 9, wedding on 5th March 27';
const T4_JSON = '{"acts":[{"act":"lead","date_as_spoken":"5th March 27","client_as_spoken":"kabir walk 9"}],"route":"task"}';
const T6_SAID = 'Add a new lead kabir walk 9, wedding on 5 March 2027';
const T6_JSON = '{"acts":[{"act":"lead","date_as_spoken":"5 March 2027","client_as_spoken":"kabir walk 9"}],"route":"task"}';
const NONE_JSON = '{"acts":[],"route":"none"}';
// 22 SEPTEMBER, step 1, HIS WORDS as his app's thread shows them. THE HEARING IS INFERRED (no export yet): the date with his full stop kept.
const S1_SAID = 'Add a new lead. Tara walk ten. Wedding on 5th March 27.';
const S1_INFERRED = { route: 'task', acts: [{ act: 'lead', client_as_spoken: 'Tara walk ten', date_as_spoken: '5th March 27.' }] };
const B3 = 'Okay. Nothing was changed.';
const B6 = 'When did the payment come in?';
const B7 = 'I could not read that date. Say it like 5 December.';
const att = (client, pkg, date) => ({ act: 'attach_package', client_as_spoken: client, package_as_spoken: pkg, ...(date ? { date_as_spoken: date } : {}) });
const staged = (d) => (d.tables['public.pending_money_acts'] || []);
const lastDoor = (d) => d.tables['engine.messages'].filter((m) => m.role === 'assistant').slice(-1)[0];
const noteOf = (d) => { const r = lastDoor(d); return r && r.meta && r.meta.listener ? r.meta.listener.note : undefined; };
const noteIn = (d) => noteOf(d) || { acts: [{}] };

// THE TABLE. [what she typed, the day it must read or null for REFUSED, its BARE form where it has no year, whose specimen]
const D = '2027-03-05';
const TABLE = [
  ['5th March 27.', D, null, 'HIS, 22 September, the date of his own sentence with his own full stop'],
  ['5 March 2027.', D, null, 'chair'], ['5 june 2027.', '2027-06-05', null, 'chair'], ['5 March 2027!', D, null, 'chair'], ['5 March 2027?', D, null, 'chair'],
  ['tomorrow.', 'BARE', 'tomorrow', 'chair'], ['today.', 'BARE', 'today', 'chair'], ["5 march'27", D, null, 'chair'], ["5th Mar '27", D, null, 'chair'], ['5th Mar \u201927', D, null, 'seat: the curly apostrophe a phone types'],
  ['5th March 27', D, null, 'chair'], ['5 March, 2027', D, null, 'chair'], ['March 5, 2027', D, null, 'chair'], ['on 5 March 2027', D, null, 'chair'], ['on 5th March 27', D, null, 'chair'],
  ['5-3-27', D, null, 'chair'], ['5-3-2027', D, null, 'chair'], ['5.3.27', D, null, 'chair'], ['5.3.2027', D, null, 'chair'], ['05/03/2027', D, null, 'chair'],
  ['5 March 2027 ', D, null, 'chair'], ['  5 March 2027', D, null, 'chair'], ['5 March 2027,', D, null, 'chair'], ['the 5th of March 2027', D, null, 'chair'],
  ['5th', 'BARE', '5th', 'chair'], ['Sunday', 'BARE', 'Sunday', 'chair'], ['next Sunday', 'BARE', 'next Sunday', 'chair'], ['5th.', 'BARE', '5th', 'seat'], ['(next Sunday)', 'BARE', 'next Sunday', 'seat'],
  ['5 March next year', null, null, 'chair: REFUSED and STAYS refused; the chair does not ask for it'],
  // THE FOUNDER'S QUESTION, verbatim: "what if its with a comma??" Commas ALREADY READ at 14bc61d, in every position; pinned so the cure cannot break them.
  ['5th March 27,', D, null, 'founder\'s comma'], ['5th March, 27', D, null, 'founder\'s comma'], ['5 March 2027,', D, null, 'founder\'s comma'], ['March 5, 2027', D, null, 'founder\'s comma'],
  ['5, March 2027', D, null, 'founder\'s comma'], ['5th, March, 2027', D, null, 'founder\'s comma'], ['5 March 2027,,', D, null, 'founder\'s comma'], ['5 March 2027, ', D, null, 'founder\'s comma'],
  ['today,', 'BARE', 'today', 'founder\'s comma'], ['tomorrow,', 'BARE', 'tomorrow', 'founder\'s comma'],
  // and what his question found: REFUSED at 14bc61d, READ now
  ['5 March 2027;', D, null, 'chair, found by his question'], ['5 March 2027:', D, null, 'chair'], ['5 March 2027 -', D, null, 'chair'], ['(5 March 2027)', D, null, 'chair'], ['5 March 2027)', D, null, 'chair'],
  ['"5 March 2027"', D, null, 'chair'], ['5 March 2027...', D, null, 'chair'], ['5 March 2027 .', D, null, 'chair'], ['\u201C5 March 2027\u201D', D, null, 'seat: curly quotes'], ['[5 March 2027] \u2014', D, null, 'seat: brackets and an em dash'],
];
const READ_AT_BASE = ['5th March 27', '5 March, 2027', 'March 5, 2027', 'on 5 March 2027', 'on 5th March 27', '5-3-27', '5-3-2027', '5.3.27', '5.3.2027', '05/03/2027', '5 March 2027 ', '  5 March 2027', '5 March 2027,', 'the 5th of March 2027', '5th', 'Sunday', 'next Sunday'];

async function main() {
  const WD = require(WDP);
  const SD = require(P(SDf));
  const LH = require(P('src/lib/vendor/lifecycleHands.js'));
  const LF = require(LFP);
  const meter = require(P('src/agent/harvest.js'))._meter;
  const memoryOf = (db) => ({
    getOrCreateConversation: async () => ({ conversationId: 'c-1', thread: [] }),
    saveMessage: async (cid, role, content, tc, meta) => { const id = `m-${db.tables['engine.messages'].length + 1}`; db.tables['engine.messages'].push({ id, conversation_id: cid, role, content, tool_calls: tc || null, meta: meta || null, created_at: new Date(clock += 1000).toISOString() }); return id; },
  });
  const gen = async () => ({ ok: true, invoice_number: 'TDW/DEV440/31', pdf_url: 'https://x.invalid/p.pdf', made: 'minted' });
  const turn = async (db, message, request, lane, M) => {
    const mod = M || WD;
    LF._resetLaneFlagCache();
    const out = await quiet(() => mod.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message, lane: lane || 'pwa' }, { llmCreate: earOf(request), nowMs: NOW, generateInvoiceForBinder: gen }));
    const said = out && out.door === true ? out : await quiet(() => mod.standIn({ supabase: db, out }, { nowMs: NOW }));
    await quiet(() => mod.persistDoorTurn({ supabase: db, agentId: AG, message, out: said, lane: lane || 'pwa' }, { memory: memoryOf(db), meter }));
    return { out, said, reply: said.reply, keys: J(said.keys) };
  };
  const seeded = () => { const d = makeDb(world()); d.tables['public.leads'].push(leadRow({ id: 'l-nisha', name: 'Nisha Walk Eleven', wedding_date: '2027-03-05', wedding_date_precision: 'day' }), leadRow({ id: 'l-rohan', name: 'Rohan Walk Eleven', wedding_date: '2027-03-05', wedding_date_precision: 'day' })); d.tables['engine.records'].push({ id: 'b-walk', agent_id: AG, client: 'Walk45', amount: 50000, amount_received: 0, hidden: false, date: '2026-09-25' }); return d; };
  const ASK = ['Attach Walk P7 Album to Nisha Walk Eleven', req([att('Nisha Walk Eleven', 'Walk P7 Album')])];

  // ─── §1 THE TABLE ──────────────────────────────────────────────────────────────────────────
  sec('1 F-44.114: how a vendor types a date. His words first; every row on the REAL clock of this process (C-44.13: run me on shifted clocks)');
  // NO nowMs is passed in this section: the process clock decides, as in production. A row with a year pins its day on any clock; a row
  // without one (BARE) must read EXACTLY as its bare form reads on the same clock, so no row can drift with the day.
  const R = (s, direction) => SD.resolveSpokenDate(s, { direction: direction || 'future' });
  for (const [typed, want, bare, whose] of TABLE) {
    const v = R(typed);
    if (want === null) T(`1.1 REFUSED and stays refused: ${JSON.stringify(typed)} (${whose})`, v.ok === false);
    else if (want === 'BARE') { const b = R(bare); T(`1.1 reads, as its bare form ${JSON.stringify(bare)} reads: ${JSON.stringify(typed)} (${whose})`, v.ok === true && b.ok === true && v.iso === b.iso); }
    else T(`1.1 reads ${want}: ${JSON.stringify(typed)} (${whose})`, v.ok === true && v.iso === want);
  }
  T('1.2 A WORD IS NOT PUNCTUATION: "5th march 27, evening" STAYS REFUSED (dropping a word would be guessing, and the door never guesses); so does "5 March 27 evening"', R('5th march 27, evening').ok === false && R('5th march 27, evening').reason === 'unreadable' && R('5 March 27 evening').ok === false);
  const day0 = SD.todayIstIso(); const pastToday = [R('today.', 'past'), R('today;', 'past'), R('today,', 'past'), R('"today"', 'past')]; const day1 = SD.todayIstIso();
  T('1.3 THE MONEY PATH, direction past: "today." and "today;" (and "today," and quoted) read today in IST as production reads it, taken on both sides (C-44.13)', pastToday.every((v) => v.ok === true && [day0, day1].includes(v.iso)));
  // e-69: this cell first named "18 September 27." as a future day. It is one only until 18 September 2027; the 2028 clocks of C-44.13 reddened
  // it before it was ever cut. The future year is now DERIVED from the clock: next year's two digits, as she would type them.
  const nextYY = String((Number(SD.todayIstIso().slice(0, 4)) + 1) % 100).padStart(2, '0');
  T(`1.4 the strip opens nothing that was shut on the money path: "tomorrow." said of money received is still refused; "18 September ${nextYY}." (next year, derived from the clock) too`, R('tomorrow.', 'past').ok === false && R(`18 September ${nextYY}.`, 'past').ok === false && R(`18 September ${nextYY}.`, 'future').ok === true);
  T('1.5 the strip names A CLOSED SET in one constant, and it is exactly the marks ruled: . ! ? ; : , the dashes, brackets of every kind, straight and curly quotes', SD.STRAY_MARKS === '.!?;:,-\u2013\u2014()[]{}<>"\'\u201C\u201D\u2018\u2019' && !/[a-z0-9/]/i.test(SD.STRAY_MARKS));
  T('1.6 NOTHING IS STRIPPED FROM INSIDE: the separators that ARE the date still read, and marks inside a date that are not its separators still refuse', R('5.3.27').iso === D && R('5-3-27').iso === D && R('5/3/27').iso === D && R('5 (March) 2027').ok === false && R('5 March; 2027').ok === false && R('5!3!27').ok === false);
  T('1.7 punctuation alone is NO date said (reason none, so money asks B6 and never B7), as an empty string always was', R('...').reason === 'none' && R(' - ').reason === 'none' && R('').reason === 'none' && R('?!').reason === 'none');
  T('1.8 the apostrophe reads only before a CLOSING two-digit year: "\'27" ALONE is a year and no date and is refused (unwrapped it would be a guess at the 27th), while a bare or quoted "27" reads as it always did; "5 march \'2027" and "5 march \'7" stay refused; F-44.98 holds ("15 March 0227." is reason year)', R("'27").ok === false && R("\u201927 ").ok === false && R('27').ok === R('"27"').ok && R("5 march '2027").ok === false && R("5 march '7").ok === false && R('15 March 0227.').reason === 'year');
  T('1.9 every row of the chair\'s READS list that read at 14bc61d is in the table (the cure cannot have broken one unseen)', READ_AT_BASE.every((s) => TABLE.some((r) => r[0] === s && r[1] !== null)));
  { const t0 = Date.now(); const big = R(`5 March 2027${'.'.repeat(5000)}`); const ms = Date.now() - t0;
  T(`1.10 (b), ratified by the chair: a value over 200 characters is refused AT ONCE, never scanned: a 5,000-character string refused in ${ms} ms (a fact about this machine, bounded here at 50); 200 is the bound, 150 stray marks still read`, SD.SPOKEN_MAX === 200 && R(`${' '.repeat(250)}'27`).ok === false && R(`5 March 2027${'.'.repeat(150)}`).iso === D && big.ok === false && ms < 50); }

  // ─── §2 F-44.115 ───────────────────────────────────────────────────────────────────────────
  sec('2 F-44.115 (F-44.113 folded in): when the door cannot read her message as the answer, what lapses the note and what does not');
  let db = seeded(); let r;
  await turn(db, 'Add a new lead Kiran Walk Eleven, wedding on 31 February 2027', req([lead('Kiran Walk Eleven', '31 February 2027')]));
  r = await turn(db, 'Add a new lead Kiran Walk Eleven, wedding on 5 March 2027', req([lead('Kiran Walk Eleven', '5 March 2027')]));
  T('2.1 INVENTED (the card\'s step): refused a date, she RETYPES THE WHOLE SENTENCE; the noted act is heard WITH A DATE OF ITS OWN, so the note lapses and the job is handled fresh IN THE SAME TURN: the lead is FILED', r.reply === 'Lead added: Kiran Walk Eleven · 5 March 2027.' && leadsIn(db).length === 1 && noteOf(db) === undefined && !('answered' in lastDoor(db).meta.listener));
  db = seeded();
  const again = [];
  for (let i = 0; i < 4; i += 1) { const t = await turn(db, 'Add a new lead Kiran Walk Eleven, wedding on 31 February 2027', req([lead('Kiran Walk Eleven', '31 February 2027')])); again.push(`${t.reply === B7}:${noteIn(db).tries}`); }
  T('2.2 a job handled fresh that is refused AGAIN writes a NEW note at tries 0, every time: she may retype as often as she likes and is NEVER told "Nothing was changed" for it (four refusals, four B7, tries 0 each)', again.join() === 'true:0,true:0,true:0,true:0' && leadsIn(db).length === 0);
  db = seeded();
  await turn(db, 'Add a new lead Kiran Walk Eleven, wedding on 31 February 2027', req([lead('Kiran Walk Eleven', '31 February 2027')]));
  r = await turn(db, 'Add a new lead Meher Walk Eleven', req([lead('Meher Walk Eleven')]));
  T('2.3 F-44.113, INVENTED: a same-kind job for a DIFFERENT client (no date of its own) lapses the note and is handled fresh in the SAME turn: that lead is filed, the waiting one is not', r.reply === 'Lead added: Meher Walk Eleven.' && leadsIn(db).map((l) => l.name).join() === 'Meher Walk Eleven' && noteOf(db) === undefined);
  db = seeded();
  await turn(db, ASK[0], ASK[1]);
  r = await turn(db, 'whenever', req([att('nisha walk eleven', 'Walk P7 Album')]));
  T('2.4 THE SAME client (under key(): case differs) and NO date heard does NOT lapse the note: answered as an unreadable date, once (B7, tries 1)', r.reply === B7 && noteIn(db).tries === 1 && lpsIn(db).length === 0);
  db = seeded();
  await turn(db, ASK[0], ASK[1]);
  r = await turn(db, 'whenever', JSON.parse(NONE_JSON));
  const r3 = await turn(db, 'whenever', JSON.parse(NONE_JSON));
  T('2.5 NO ACT HEARD does not lapse it: B7 once, then B3: the re-ask stands exactly where the ruling left it', r.reply === B7 && r3.reply === B3);
  db = seeded();
  await turn(db, ASK[0], ASK[1]);
  r = await turn(db, 'Please deliver it by the 5th of June 2027, thank you', req([att('Nisha Walk Eleven', 'Walk P7 Album', '5 June 2027')]));
  T('2.6 INVENTED: an answer wrapped in WORDS the door cannot read, which the listener heard as the noted act WITH its date: handled fresh from what was heard, and it attaches (B27). Before this cut it read B7', r.keys === 'B27' && lpsIn(db).length === 1 && lpsIn(db)[0].delivery_on === '2027-06-05');
  db = seeded();
  await turn(db, ASK[0], ASK[1]);
  r = await turn(db, '5 June 2027.', req([att('Rohan Walk Eleven', 'Walk P7 Album', '9 September 2029')]));
  T('2.7 THE DOOR\'S OWN READ STILL COMES FIRST: "5 June 2027." (her full stop kept) IS the answer whatever was heard, even a restated job for another client: it attaches to THE NOTED lead with THE TYPED date', r.keys === 'B27' && lpsIn(db).length === 1 && lpsIn(db)[0].lead_id === 'l-nisha' && lpsIn(db)[0].delivery_on === '2027-06-05');
  db = seeded();
  await turn(db, ASK[0], ASK[1]);
  r = await turn(db, 'Raise the invoice for Walk45', req([{ act: 'invoice', client_as_spoken: 'Walk45' }]));
  T('2.8 an act OTHER than the noted one still lapses it, as b95 3.6 holds: the invoice is made, nothing attached', r.keys === 'B13' && lpsIn(db).length === 0);
  db = seeded(); db.tables['public.lead_packages'].push({ id: 'lp-n', vendor_id: V.id, lead_id: 'l-nisha', package_id: 'p-film', snapshot: { name: 'Photographs and film', delivery_basis: 'days' }, total: 80000, schedule: [], delivery_on: null, quoted_at: null, quote_draft_id: null, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', deleted_at: null });
  await turn(db, 'The advance came in for Nisha Walk Eleven', req([{ act: 'advance_paid', client_as_spoken: 'Nisha Walk Eleven' }]));
  r = await turn(db, 'today.', JSON.parse(NONE_JSON));
  T('2.9 THE CARD: "today." WITH ITS FULL STOP answered to B6: B2 from the row, ONE row STAGED, NOTHING applied', r.reply === 'Confirm this booking? Nisha Walk Eleven · Photographs and film · Rs 80,000. Reply YES or NO.' && staged(db).length === 1 && staged(db)[0].state === 'staged' && db.tables['public.leads'].find((l) => l.id === 'l-nisha').state === 'new' && db.tables['public.invoices'].length === 0);
  db = seeded(); db.tables['public.lead_packages'].push({ id: 'lp-n', vendor_id: V.id, lead_id: 'l-nisha', package_id: 'p-film', snapshot: { name: 'Photographs and film', delivery_basis: 'days' }, total: 80000, schedule: [], delivery_on: null, quoted_at: null, quote_draft_id: null, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', deleted_at: null });
  await turn(db, 'The advance came in for Nisha Walk Eleven', req([{ act: 'advance_paid', client_as_spoken: 'Nisha Walk Eleven' }]));
  r = await turn(db, 'The advance came in yesterday for Nisha Walk Eleven', req([{ act: 'advance_paid', client_as_spoken: 'Nisha Walk Eleven', date_as_spoken: 'yesterday' }]));
  T('2.10 a RESTATED MONEY JOB after B6 is handled fresh and STILL ONLY STAGED: B2 asked, one staged row, nothing applied (the lapse never writes money either)', r.keys === 'B2' && staged(db).length === 1 && staged(db)[0].state === 'staged' && db.tables['public.leads'].find((l) => l.id === 'l-nisha').state === 'new');

  // ─── §3 THE REGRESSION'S CELLS ─────────────────────────────────────────────────────────────
  sec('3 the regression, from the records');
  const rec = src(WALK_A);
  T(`3.0 C-44.12: the literals replayed below are byte for byte the HEARD lines of Part A's walk, turns 4 and 6, as ${WALK_A} §3 holds them from his export`, rec.includes(`HE: ${T4_SAID}\n`) && rec.includes(`    HEARD: ${T4_JSON}\n`) && rec.includes(`HE: ${T6_SAID}\n`) && rec.includes(`    HEARD: ${T6_JSON}\n`));
  // PART A's WALK: turn 4 was refused (B7), turn 6 was HIS WHOLE SENTENCE RETYPED, and it FILED at 6456690. Turn 4 reads today (F-44.111), so to
  // stand where he stood spokenDate.js's year form is put back to 6456690's bytes for this ONE cell (b95 3.2's method): turn 4 reads B7 and keeps
  // its note; then TURN 6 VERBATIM. Turn 5 ("5 march", heard as no act) is LEFT OUT on purpose: since Part B-1 the note reads it and files the
  // lead, which b95 3.2 holds; the regression is what happens to the RETYPE. RED on 14bc61d (B7), green with the cure (filed).
  let reg = { a: {}, b: {}, leads: [] };
  try { reg = await withMutated(SDf, [['${DAY}(?: of)? ([a-z.]+)(?: (\\\\d{2}|\\\\d{4}))?', '${DAY}(?: of)? ([a-z.]+)(?: (\\\\d{4}))?']], [WDf], async (rq) => {
    const M = rq(WDf); const d = makeDb(world());
    const a = await turn(d, T4_SAID, JSON.parse(T4_JSON), 'whatsapp', M);
    const b = await turn(d, T6_SAID, JSON.parse(T6_JSON), 'whatsapp', M);
    return { a, b, leads: leadsIn(d) };
  }); } catch (e) { console.log(`        (${e.message})`); }
  T('3.1 PART A\'s WALK, TURN 4 THEN TURN 6, his words and the heard requests VERBATIM: refused (B7), he retypes the whole sentence, and IT FILES, as it did at 6456690: "Lead added: kabir walk 9 · 5 March 2027."', reg.a.reply === B7 && reg.b.reply === 'Lead added: kabir walk 9 · 5 March 2027.' && reg.leads.length === 1);
  db = makeDb(world());
  const s1 = []; for (let i = 0; i < 3; i += 1) s1.push((await turn(db, S1_SAID, JSON.parse(JSON.stringify(S1_INFERRED)), 'whatsapp')).reply);
  T('3.2 22 SEPTEMBER, STEP 1, his words three times in one thread, THE HEARING INFERRED (his full stop kept in the date; no export yet): after the cure THE FIRST FILES THE LEAD, and no message is answered B7 or B3', s1[0] === 'Lead added: Tara walk ten · 5 March 2027.' && s1.every((x) => x !== B7 && x !== B3) && leadsIn(db)[0].wedding_date === '2027-03-05');
  // F-44.115 ALONE, with F-44.114 held back: the strip is removed for this one cell so his first message is refused as it was live; his SECOND, the same
  // sentence retyped, must then be handled fresh (refused again with a NEW note at tries 0), and his THIRD must NOT be "Nothing was changed".
  let alone = { replies: [], tries: [] };
  try { alone = await withMutated(SDf, [['    const s = unwrapSpoken(spoken.toLowerCase())', '    const s = (spoken.toLowerCase())']], [WDf], async (rq) => {
    const M = rq(WDf); const d = makeDb(world()); const replies = []; const tries = [];
    for (let i = 0; i < 3; i += 1) { replies.push((await turn(d, S1_SAID, JSON.parse(JSON.stringify(S1_INFERRED)), 'whatsapp', M)).reply); tries.push(noteIn(d).tries); }
    return { replies, tries };
  }); } catch (e) { console.log(`        (${e.message})`); }
  T('3.3 THE SAME THREE with the strip held back, so F-44.115 is seen ALONE: his log read B7, B7, B3; now it reads B7, B7, B7, each a fresh refusal with a note at tries 0, and he is never told "Nothing was changed"', alone.replies.join('|') === [B7, B7, B7].join('|') && alone.tries.join() === '0,0,0');

  // ─── §4 THE CARD ───────────────────────────────────────────────────────────────────────────
  sec('4 every SAY line on the fix\'s walk card, in ONE thread and one database');
  const driveWA = async (o) => {
    const savedWD = require.cache[WDP]; const savedVI = require.cache[VIP];
    const turns = { n: 0 }; const sent = [];
    LF._resetLaneFlagCache();
    try {
      const d = o.db;
      const real = o.M || WD;
      const mod = new Module(WDP, module); mod.filename = WDP; mod.loaded = true;
      mod.exports = { ...real,
        preTurn: (a) => real.preTurn({ ...a, supabase: d, vendor: V, agentId: AG, route: ROUTE }, { llmCreate: earOf(o.request), nowMs: NOW }),
        standIn: (a) => real.standIn({ ...a, supabase: d }, { nowMs: NOW }),
        speakOnWhatsApp: (a) => real.speakOnWhatsApp({ ...a, supabase: d, agentId: AG }, { persistDoorTurn: (p) => real.persistDoorTurn({ ...p, supabase: d, agentId: AG }, { memory: memoryOf(d), meter }) }) };
      require.cache[WDP] = mod;
      delete require.cache[VIP];
      const lane = require(VIP);
      const chain = (t) => { const api = {}; for (const m of ['select', 'eq', 'is', 'order', 'limit', 'update', 'neq', 'in', 'gte', 'lte', 'not', 'insert']) api[m] = () => api;
        const rows = { users: { id: 'u1', phone: '+919888294440', name: 'Dev' }, vendors: { id: 'v1', user_id: 'u1', onboarding_state: 'complete', category: 'photographer', tier: 'signature' }, conversations: { id: 'c1', vendor_id: 'v1', kind: 'vendor_self' } };
        api.single = async () => ({ data: rows[t] || {}, error: null }); api.maybeSingle = async () => ({ data: rows[t] || null, error: null });
        api.then = (res) => res({ data: rows[t] ? [rows[t]] : [], error: null }); return api; };
      const supabase = { from: chain, schema: () => ({ from: chain }) };
      const deps = {
        sendWhatsApp: async (to, text, media) => { sent.push({ text, media }); return { sid: 'SM1' }; },
        runTurn: async () => { turns.n += 1; return { reply: 'VICTOR', tool_calls: [] }; },
        resolveAgentForVendor: async () => ({ agentId: 'a1' }), fetchCalendarSnapshot: async () => '', fetchScratchpad: async () => '', fetchLeadPings: async () => '',
        applyCalendarSignals: async () => ({ suffix: '' }), buildLlmForTurn: async () => ({ route: ROUTE }),
        matchModeWord: () => null, applyModeFlip: async () => ({ changed: false }), MODE_FLIP_LINES: {}, matchFreshWord: () => false, FRESH_THREAD_LINE: 'x', abandonActiveThread: async () => ({}),
        generateInvoiceForBinder: async () => ({ ok: false }), enquiryToBinder: async () => ({ ok: true }), runCoupleAgenticTurn: async () => ({ reply: '', toolCalls: [] }),
        ensureCoupleRow: async () => ({}), captureField: async () => ({}), buildDisambiguationQuestion: () => '', interpretDisambiguationReply: async () => ({}),
        vendorDisplayName: () => 'V', checkImageThrottle: async () => ({ allowed: true }), markRejectionSent: async () => ({}), extractCalendarFromImage: async () => [],
        webhookCore: require(P('src/lib/webhookCore.js')), supabase, anthropic: {},
      };
      await quiet(() => lane.processVendorInbound({ phone: '+919888294440', body: o.message, profileName: 'Dev', messageSid: `wamid.b96.${Math.random()}`, internalReplay: false, trimmedBody: o.message.trim(), numMedia: 0, hasMedia: false, mediaUrl: null, rawPayload: {} }, deps));
      return { turns: turns.n, sent };
    } finally {
      if (savedWD) require.cache[WDP] = savedWD; else delete require.cache[WDP];
      if (savedVI) require.cache[VIP] = savedVI; else delete require.cache[VIP];
      LF._resetLaneFlagCache();
    }
  };
  const one = (w) => (w.turns === 0 && w.sent.length === 1 && Array.isArray(w.sent[0].media) && w.sent[0].media.length === 0 ? w.sent[0].text : `turns=${w.turns} sent=${w.sent.length}`);
  {
    const d = makeDb(world()); d.tables['engine.records'].push({ id: 'b-walk', agent_id: AG, client: 'Walk45', amount: 50000, amount_received: 0, hidden: false, date: '2026-09-25' });
    const c1 = await driveWA({ db: d, message: 'Add a new lead. Nisha Walk Eleven. Wedding on 5th March 27.', request: req([lead('Nisha Walk Eleven', '5th March 27.')]) });
    T('4.1 ON WHATSAPP, SAY "Add a new lead. Nisha Walk Eleven. Wedding on 5th March 27." (HIS OWN PUNCTUATION; hearing in the INFERRED shape of 22 September): "Lead added: Nisha Walk Eleven · 5 March 2027."', one(c1) === 'Lead added: Nisha Walk Eleven · 5 March 2027.');
    const c2 = await turn(d, 'Add a new lead Rohan Walk Eleven, wedding on 31 February 2027', req([lead('Rohan Walk Eleven', '31 February 2027')]));
    const c3 = await turn(d, '5 march', JSON.parse(NONE_JSON));
    T('4.2 SAY "Add a new lead Rohan Walk Eleven, wedding on 31 February 2027", then "5 march" (heard as Part A\'s turn 5 was: NO ACT): B7, then "Lead added: Rohan Walk Eleven · 5 March 2027."', c2.reply === B7 && c3.reply === 'Lead added: Rohan Walk Eleven · 5 March 2027.');
    const c4 = await turn(d, 'Add a new lead Kiran Walk Eleven, wedding on 31 February 2027', req([lead('Kiran Walk Eleven', '31 February 2027')]));
    const c5 = await turn(d, 'Add a new lead Kiran Walk Eleven, wedding on 5 March 2027', req([lead('Kiran Walk Eleven', '5 March 2027')]));
    T('4.3 THE NEW STEP: SAY "Add a new lead Kiran Walk Eleven, wedding on 31 February 2027", then RETYPE THE WHOLE SENTENCE with 5 March 2027 (heard in the shape of Part A\'s turn 6): B7, then "Lead added: Kiran Walk Eleven · 5 March 2027."', c4.reply === B7 && c5.reply === 'Lead added: Kiran Walk Eleven · 5 March 2027.' && leadsIn(d).length === 3);
    const c6 = await turn(d, 'Attach Walk P7 Album to Nisha Walk Eleven', req([att('Nisha Walk Eleven', 'Walk P7 Album')]));
    const c7 = await turn(d, '5 June 2027.', JSON.parse(NONE_JSON));
    T('4.4 SAY "Attach Walk P7 Album to Nisha Walk Eleven", then "5 June 2027." WITH A FULL STOP: the question, then "Package attached: Nisha Walk Eleven · Walk P7 Album · Rs 25,000 · Delivery 5 June 2027."', c6.reply === 'When is the delivery date for Nisha Walk Eleven?' && c7.reply === 'Package attached: Nisha Walk Eleven · Walk P7 Album · Rs 25,000 · Delivery 5 June 2027.');
    const c8 = await turn(d, 'Attach Walk P7 Album to Rohan Walk Eleven', req([att('Rohan Walk Eleven', 'Walk P7 Album')]));
    const c9 = await turn(d, 'No', JSON.parse(NONE_JSON));
    T('4.5 SAY "Attach Walk P7 Album to Rohan Walk Eleven", then "No": the question, then "Okay. Nothing was changed."', c8.reply === 'When is the delivery date for Rohan Walk Eleven?' && c9.reply === B3 && lpsIn(d).length === 1);
    const c10 = await turn(d, 'Attach Walk P7 Album to Rohan Walk Eleven', req([att('Rohan Walk Eleven', 'Walk P7 Album')]));
    const c11 = await turn(d, 'whenever', JSON.parse(NONE_JSON)); const c12 = await turn(d, 'whenever', JSON.parse(NONE_JSON));
    T('4.6 SAY the attach again, then "whenever" twice (INVENTED hearing: no act): the question; B7; then "Okay. Nothing was changed."', c10.keys === 'B26' && c11.reply === B7 && c12.reply === B3 && lpsIn(d).length === 1);
    const c13 = await turn(d, 'The advance came in for Nisha Walk Eleven', req([{ act: 'advance_paid', client_as_spoken: 'Nisha Walk Eleven' }]));
    const c14 = await turn(d, 'today.', JSON.parse(NONE_JSON)); const c15 = await turn(d, 'No', JSON.parse(NONE_JSON));
    T('4.7 SAY "The advance came in for Nisha Walk Eleven", "today." WITH ITS FULL STOP, "No": B6; "Confirm this booking? Nisha Walk Eleven · Walk P7 Album · Rs 25,000. Reply YES or NO."; B3; ONE money row, DECLINED, every Walk Eleven lead still new, no invoice', c13.reply === B6 && c14.reply === 'Confirm this booking? Nisha Walk Eleven · Walk P7 Album · Rs 25,000. Reply YES or NO.' && c15.reply === B3 && staged(d).length === 1 && staged(d)[0].state === 'declined' && d.tables['public.leads'].filter((l) => /Walk Eleven/.test(l.name)).every((l) => l.state === 'new') && d.tables['public.invoices'].length === 0);
    const rows = d.tables['engine.messages'].filter((m) => m.role === 'assistant');
    T('4.8 the thread holds the card: fifteen turns, EVERY ONE answered by code, the first on whatsapp and the rest pwa', rows.length === 15 && rows.every((m) => m.meta.listener.door === true) && rows.map((m) => m.meta.listener.lane).join() === ['whatsapp', ...Array(14).fill('pwa')].join());
  }

  // ─── §5 W-1 AND THE SCOPE ──────────────────────────────────────────────────────────────────
  sec('5 W-1 NONE, read from this packet\'s own manifest');
  const man = fs.existsSync(P(MAN)) ? src(MAN).split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#')) : [];
  T('5.1 W-1 NONE: no path under src/engine, no soul, lens or prompt file, no migration; doorLines.js not in the cut, so no byte a vendor reads moved', man.length > 0 && man.every((p) => !/^src\/engine\/|soul|lens|^db\/migrations\//.test(p)) && !man.includes('src/lib/vendor/doorLines.js'));
  T('5.2 the manifest names exactly the five paths this packet touches (C-44.7)', JSON.stringify(man.slice().sort()) === JSON.stringify(['docs/handovers/TDW_CE44_LCV10_PARTB1_FIX_HANDOVER.md', MAN, 'scripts/b96_lcv10_fix_bench.js', SDf, WDf].sort()));
  const sdS = src(SDf).replace(/^\s*\/\/.*$/gm, '');
  T('5.3 the strip has ONE home and ONE call, inside resolveRaw, before the forms; no \\W sweep anywhere in spokenDate.js', (sdS.match(/unwrapSpoken\(/g) || []).length === 2 && !/\\W/.test(sdS));

  // ─── §6 FUZZ ───────────────────────────────────────────────────────────────────────────────
  sec('6 fuzz');
  const boom = () => { throw new Error('hostile'); };
  const trap = new Proxy({}, { get: boom, has: boom, ownKeys: boom, getOwnPropertyDescriptor: boom });
  const HS = [undefined, null, 0, NaN, '', ' ', '.', '....', "'", "''27", "'27'", '\u2019', '(((', ')))', '-', '\u2014\u2014', '5 March 2027'.padEnd(199, '.'), 'x'.repeat(100000), `${' '.repeat(100000)}'27`, '.'.repeat(100000), trap, {}, [], () => {}, 10n, Symbol('s'), { toString: boom }, '5\u0000March', '\uD800', '٥ مارس ٢٠٢٧', '5 मार्च 2027'];
  let t6 = 0; let c6n = 0; const t0 = Date.now();
  for (const a of HS) for (const b of HS) { c6n += 1; try { const v = SD.resolveSpokenDate(a, { direction: b, nowMs: b, todayIso: b }); if (!v || typeof v.ok !== 'boolean') t6 += 1; } catch (_e) { t6 += 1; } try { SD.resolveSpokenDate(a, b); } catch (_e) { t6 += 1; } }
  T(`6.1 resolveSpokenDate: ${c6n} hostile pairs, the spoken value and the options both hostile, 100,000-character strings among them: ZERO throws, always a verdict, under two seconds (${Date.now() - t0} ms is a fact about this machine)`, t6 === 0 && (Date.now() - t0) < 2000);
  let t7 = 0; let c7n = 0;
  const hostileActs = [null, 7, 'x', trap, {}, { act: 7 }, { act: 'lead', client_as_spoken: trap }, { act: 'lead', date_as_spoken: { toString: boom } }, { act: 'attach_package', client_as_spoken: 7, date_as_spoken: [] }];
  for (const a of hostileActs) { c7n += 1; const d = seeded(); await turn(d, ASK[0], ASK[1]); try { const o = await quiet(() => WD.preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message: 'whenever', lane: 'pwa' }, { llmCreate: async () => ({ content: [{ type: 'tool_use', name: 'ear_request', input: { route: 'task', acts: [a] } }], usage: {} }), nowMs: NOW })); if (!o || typeof o.door !== 'boolean') t7 += 1; if (lpsIn(d).length) t7 += 1; } catch (_e) { t7 += 1; } }
  T(`6.2 the lapse test with the EAR'S OWN ACTS hostile on a note turn (${c7n} shapes through the real normaliseRequest): ZERO throws, always a verdict, nothing written`, t7 === 0);

  // ─── §7 MUTATIONS ──────────────────────────────────────────────────────────────────────────
  sec('7 mutations of production code, each reddening its cell');
  const flow = async (rq, steps, seedFn) => { const M = rq(WDf); const d = seedFn ? seedFn() : seeded(); const out = []; for (const [m, q] of steps) out.push(await turn(d, m, q, 'pwa', M)); return { out, d }; };
  await mut('7.1 M1 THE STRIP REMOVED: his sentence\'s date, "5th March 27.", is unreadable again (reddens 1.1\'s first row, 3.2, 4.1)', SDf,
    [['    const s = unwrapSpoken(spoken.toLowerCase())', '    const s = (spoken.toLowerCase())']], [],
    async (rq) => rq(SDf).resolveSpokenDate('5th March 27.', { direction: 'future' }), (v) => v.ok === false);
  await mut('7.2 M2 THE STRIP WIDENED TO EAT A WORD: "5th march 27, evening" reads, a guess (reddens 1.2)', SDf,
    [["const STRAY_MARKS = '.!?;:,-", "const STRAY_MARKS = 'eving.!?;:,-"]], [],
    async (rq) => rq(SDf).resolveSpokenDate('5th march 27, evening', { direction: 'future' }), (v) => v.ok === true);
  await mut('7.3 M3 the strip reaching INSIDE the date: "5 March; 2027" reads (reddens 1.6)', SDf,
    [["replace(/[,]/g, ' ')", "replace(/[,;()!]/g, ' ')"]], [],
    async (rq) => rq(SDf).resolveSpokenDate('5 March; 2027', { direction: 'future' }), (v) => v.ok === true);
  await mut('7.4 M4 the apostrophe rule removed: "5 march\'27" is refused again (reddens 1.1)', SDf,
    [[".replace(/ ?['\\u2019](\\d{2})$/, ' $1')", '']], [],
    async (rq) => rq(SDf).resolveSpokenDate("5 march'27", { direction: 'future' }), (v) => v.ok === false);
  await mut('7.5 M5 the trailing strip ALONE removed (the leading kept): "5 March 2027." refused, "(5 March 2027" still read (reddens 1.1)', SDf,
    [['  while (b > a && stray(str[b - 1])) b -= 1;\n', '']], [],
    async (rq) => [rq(SDf).resolveSpokenDate('5 March 2027.', {}).ok, rq(SDf).resolveSpokenDate('(5 March 2027', {}).ok].join(), (v) => v === 'false,true');
  await mut('7.6 M6 THE RESTATED JOB no longer lapsing the note: his retyped sentence is read as a date again, B7 (reddens 2.1, 3.1, 4.3): 14bc61d exactly', WDf,
    [["const restated = (a) => a.act === noted.act && (!!spokenText(a.date_as_spoken)\n        || (", 'const restated = (a) => a.act === noted.act && ((']], [],
    async (rq) => flow(rq, [['Add a new lead Kiran Walk Eleven, wedding on 31 February 2027', req([lead('Kiran Walk Eleven', '31 February 2027')])], ['Add a new lead Kiran Walk Eleven, wedding on 5 March 2027', req([lead('Kiran Walk Eleven', '5 March 2027')])]]), (x) => x.out[1].reply === B7 && leadsIn(x.d).length === 0);
  await mut('7.7 M7 F-44.113\'s half removed: a same-kind job for a DIFFERENT client is read as a date (reddens 2.3)', WDf,
    [["key(a.client_as_spoken) !== key(noted.client_as_spoken)));", 'false));']], [],
    async (rq) => flow(rq, [['x', req([lead('Kiran Walk Eleven', '31 February 2027')])], ['Add a new lead Meher Walk Eleven', req([lead('Meher Walk Eleven')])]]), (x) => x.out[1].reply === B7);
  await mut('7.8 M8 the client compared WITHOUT key(): the same client in another case lapses the note, and her garbled answer is handled as a new job (reddens 2.4)', WDf,
    [["key(a.client_as_spoken) !== key(noted.client_as_spoken)));", 'a.client_as_spoken !== noted.client_as_spoken));']], [],
    async (rq) => flow(rq, [ASK, ['whenever', req([att('nisha walk eleven', 'Walk P7 Album')])]]), (x) => x.out[1].keys === 'B26');
  await mut('7.9 M9 THE LISTENER DECIDING BEFORE THE DOOR\'S OWN READ: a readable answer beside an over-heard restated job is thrown away (reddens 2.7)', WDf,
    [['      if (own.ok || !movedOn) fromNote =', '      if (!movedOn) fromNote =']], [],
    async (rq) => flow(rq, [ASK, ['5 June 2027.', req([att('Rohan Walk Eleven', 'Walk P7 Album', '9 September 2029')])]]), (x) => !(lpsIn(x.d).length === 1 && lpsIn(x.d)[0].lead_id === 'l-nisha'));
  await mut('7.10 M10 THE CAP REMOVED (the chair\'s pin on (b)): the 5,000-character string is now SCANNED and read, so the strip walked every one of its marks (reddens 1.10)', SDf,
    [["    if (spoken.length > SPOKEN_MAX) return { ok: false, reason: spoken.trim() ? 'unreadable' : 'none' };\n", '']], [],
    async (rq) => rq(SDf).resolveSpokenDate(`5 March 2027${'.'.repeat(5000)}`, {}).ok, (v) => v === true);

  console.log(`\n════════  b96 · ${pass} pass · ${fail} fail  ════════`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`  · ${f}`)); }
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('b96 CRASHED:', (e && e.stack) || e); process.exit(2); });
