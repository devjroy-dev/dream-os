'use strict';
// scripts/b98_lcv10_package_bench.js · TDW CE-44 · LCV-10 · PART B-2, SECOND CUT: B31, B33; the note for B24 and B31; F-44.107; F-44.108; F-44.117. Rung b98.
//
// B31 "Which package? Yours are: {list}." (R-44.36): an attach naming a client and no package, the door never guesses even when she holds one.
// B33 "Set the fee first." (F-44.102, REUSE of dreamos-pwa lib/worklist/packages.ts:116) in place of B30 for no_fee. F-44.107: THE LEAD IS
// RESOLVED BEFORE THE PACKAGE, so a misspelt client meets B32 and B23 is never reached for a lead that does not exist. F-44.108: every {list}
// sorted by name case-folded. THE PACKAGE NOTE (asked B24 or B31): her answer is a package by the door's own key() fold FIRST; a heard act
// echoing her message is her answer heard twice; a different kind or the attach restated with another package lapses; else B31 once more
// then B3. F-44.117: a bare name answered to a NAME question, heard as a lookup (`find`, route search) or with her message as its client, is
// her answer and does not lapse (the B-2 walk of 22 September, 06:32:39 and 06:33:29, RECORDED in this packet's handover §3).
// F-44.118 IS NOT IN THIS CUT (see the handover). C-44.12: recorded hearings verbatim. C-44.13: run me on shifted clocks. THE EXIT CODE IS THE VERDICT.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-ce44-lcv10-partb2b.txt';
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

const WALK_B = 'docs/handovers/TDW_CE44_LCV10_PARTB2B_HANDOVER.md';
const NONE_JSON = '{"acts":[],"route":"none"}';
// RECORDED, the B-2 first-cut walk of 22 September (his export, sha256 0da887b00cce41f3…; WALK_B §3): his bare name answered to B35 heard as `find` on route search.
const F1_SAID = 'Asha walk twelve';
const F1_JSON = '{"acts":[{"act":"find","client_as_spoken":"Asha walk twelve"}],"route":"search"}';
const F2_SAID = 'Asha Walk Twelve';
const F2_JSON = '{"acts":[{"act":"find","client_as_spoken":"Asha Walk Twelve"}],"route":"search"}';
const B3 = 'Okay. Nothing was changed.'; const B31 = 'Which package? Yours are: {list}.'; const B33 = 'Set the fee first.'; const B35 = 'Which client? Say the name.';
const SORTED = 'Photographs and film · Pre wedding shoot · Walk P7 Album';
const B31L = `Which package? Yours are: ${SORTED}.`;
const att = (client, pkg, date) => ({ act: 'attach_package', ...(client ? { client_as_spoken: client } : {}), ...(pkg ? { package_as_spoken: pkg } : {}), ...(date ? { date_as_spoken: date } : {}) });
const money = (act, client, date) => ({ act, ...(client ? { client_as_spoken: client } : {}), ...(date ? { date_as_spoken: date } : {}) });
const staged = (d) => (d.tables['public.pending_money_acts'] || []);
const lastDoor = (d) => d.tables['engine.messages'].filter((m) => m.role === 'assistant').slice(-1)[0];
const noteOf = (d) => { const r = lastDoor(d); return r && r.meta && r.meta.listener ? r.meta.listener.note : undefined; };
const noteIn = (d) => noteOf(d) || { acts: [{}] };

async function main() {
  const WD = require(WDP);
  const DL = require(P('src/lib/vendor/doorLines.js'));
  const LH = require(P('src/lib/vendor/lifecycleHands.js'));
  const LF = require(LFP);
  const meter = require(P('src/agent/harvest.js'))._meter;
  const memoryOf = (db) => ({
    getOrCreateConversation: async () => ({ conversationId: 'c-1', thread: [] }),
    saveMessage: async (cid, role, content, tc, meta) => { const id = `m-${db.tables['engine.messages'].length + 1}`; db.tables['engine.messages'].push({ id, conversation_id: cid, role, content, tool_calls: tc || null, meta: meta || null, created_at: new Date(clock += 1000).toISOString() }); return id; },
  });
  const gen = async () => ({ ok: true, invoice_number: 'TDW/DEV440/33', pdf_url: 'https://x.invalid/p.pdf', made: 'minted' });
  const turn = async (db, message, request, lane, M, extra) => {
    const mod = M || WD;
    LF._resetLaneFlagCache();
    const out = await quiet(() => mod.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message, lane: lane || 'pwa' }, { llmCreate: earOf(request), nowMs: NOW, generateInvoiceForBinder: gen, ...(extra || {}) }));
    const said = out && out.door === true ? out : await quiet(() => mod.standIn({ supabase: db, out }, { nowMs: NOW }));
    await quiet(() => mod.persistDoorTurn({ supabase: db, agentId: AG, message, out: said, lane: lane || 'pwa' }, { memory: memoryOf(db), meter }));
    return { out, said, reply: said.reply, keys: J(said.keys) };
  };
  const lp = (leadId) => ({ id: `lp-${leadId}`, vendor_id: V.id, lead_id: leadId, package_id: 'p-film', snapshot: { name: 'Photographs and film', delivery_basis: 'days' }, total: 80000, schedule: [], delivery_on: null, quoted_at: null, quote_draft_id: null, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', deleted_at: null });
  const seeded = () => { const d = makeDb(world()); d.tables['public.leads'].push(leadRow({ id: 'l-dia', name: 'Dia Walk Thirteen', wedding_date: '2027-03-05', wedding_date_precision: 'day' }), leadRow({ id: 'l-ravi', name: 'Ravi Walk Thirteen', wedding_date: '2027-03-05', wedding_date_precision: 'day' })); d.tables['engine.records'].push({ id: 'b-walk', agent_id: AG, client: 'Walk45', amount: 50000, amount_received: 0, hidden: false, date: '2026-09-25' }); return d; };
  const ASK = ['Attach a package to Dia Walk Thirteen', req([att('Dia Walk Thirteen')])];

  // ─── §1 THE BYTES AND THE LISTS ────────────────────────────────────────────────────────────
  sec('1 B31 and B33, his, hash-carried; every {list} sorted (F-44.108)');
  T('1.1 B31 and B33 are HIS bytes verbatim, their hashes the literals pinned here, equal to sha256 of the bytes', DL.LINES.B31 === B31 && DL.LINES.B33 === B33 && DL.LINE_HASHES.B31 === 'b84530f75e2567ea8b74b1b4901fa9a2f67ba70c3707e8135d4b4a539e612a75' && sha(B31) === DL.LINE_HASHES.B31 && DL.LINE_HASHES.B33 === '7f0c3cc354957b993bbf52493a43434f9c0795ef44491ed1605c3a060ec69f34' && sha(B33) === DL.LINE_HASHES.B33);
  T('1.2 B33 is the REUSE of his pwa byte: dreamos-pwa lib/worklist/packages.ts:116 reads `no_fee: \'Set the fee first.\'` at 320ad7e (witnessed by the seat and the chair; the file is not in this repo, the byte is pinned)', B33 === 'Set the fee first.');
  T('1.3 F-44.108: {list} is sorted by name case-folded in BOTH bytes, the rows\' order forgotten; "Bridal" and "bridal" stay adjacent', (DL.whichPackage || (() => 'NO whichPackage'))(['Walk P7 Album', 'Pre wedding shoot', 'Photographs and film']) === B31L && DL.noSuchPackage('Gold', ['zeta', 'Alpha', 'Bridal', 'bridal']).includes('Yours are: Alpha · Bridal · bridal · zeta.') && (DL.whichPackage || (() => 'NO whichPackage'))([]) === null && (DL.whichPackage || (() => 'NO whichPackage'))([null, ' ']) === null);

  // ─── §2 B31 ASKED, THE LEAD FIRST ──────────────────────────────────────────────────────────
  sec('2 B31 is asked for an attach naming no package; the lead is resolved BEFORE the package (F-44.107)');
  let db = seeded(); let r = await turn(db, ASK[0], ASK[1]);
  T('2.1 THE CARD: an attach naming a client and NO package: B31 with HER OWN names sorted, a note carrying the attach (client from the row, no package), nothing written', r.reply === B31L && r.out.door === true && noteIn(db).asked === 'B31' && canon(noteIn(db).acts) === canon([{ act: 'attach_package', client_as_spoken: 'Dia Walk Thirteen' }]) && lpsIn(db).length === 0);
  db = seeded(); db.tables['public.vendor_packages'] = [db.tables['public.vendor_packages'][1]];
  r = await turn(db, ASK[0], ASK[1]);
  T('2.2 THE DOOR NEVER GUESSES: with exactly ONE package she is still asked B31 listing it', r.reply === 'Which package? Yours are: Walk P7 Album.' && lpsIn(db).length === 0);
  db = seeded(); r = await turn(db, 'Attach Gold to Nobody Walk Thirteen', req([att('Nobody Walk Thirteen', 'Gold')]));
  T('2.3 F-44.107: a misspelt CLIENT with a package that does not exist meets B32 first, never B23', r.keys === 'B32' && /No lead called Nobody Walk Thirteen/.test(r.reply));
  db = seeded(); r = await turn(db, 'Attach a package to Nobody Walk Thirteen', req([att('Nobody Walk Thirteen')]));
  T('2.4 F-44.107: a misspelt client with NO package named meets B32, never B31', r.keys === 'B32');
  db = seeded(); r = await turn(db, 'Attach Gold to Dia Walk Thirteen', req([att('Dia Walk Thirteen', 'Gold')]));
  T('2.5 a real client and no such package is still B23, its list SORTED', r.reply === `You have no package called Gold. Yours are: ${SORTED}.` && r.keys === 'B23' && noteOf(db) === undefined);
  db = seeded(); db.tables['public.vendor_packages'].push(pkgRow({ id: 'p-album2', name: 'walk p7 album', total: 30000, delivery_basis: 'handover' }));
  r = await turn(db, 'Attach Walk P7 Album to Dia Walk Thirteen', req([att('Dia Walk Thirteen', 'Walk P7 Album')]));
  T('2.6 two of one name is B24 as before, and it KEEPS A NOTE now', r.keys === 'B24' && noteIn(db).asked === 'B24' && lpsIn(db).length === 0);
  db = seeded(); r = await turn(db, 'x', req([att(null)]));
  T('2.7 an attach naming NEITHER client nor package is B35 first (the name), the note carrying the attach', r.reply === B35 && noteIn(db).asked === 'B35');
  db = seeded(); db.tables['public.vendor_packages'].push(pkgRow({ id: 'p-nofee', name: 'No fee yet', total: null, delivery_basis: 'on_the_day' }));
  r = await turn(db, 'Attach No fee yet to Dia Walk Thirteen', req([att('Dia Walk Thirteen', 'No fee yet')]));
  T('2.8 THE CARD: a package with no fee: attachPackage refuses no_fee and the door speaks B33, HIS byte, recorded refused:no_fee; nothing written', r.reply === B33 && r.keys === 'B33' && r.said.toolCalls[0].result === 'refused:no_fee' && lpsIn(db).length === 0);

  // ─── §3 THE PACKAGE NOTE IS READ ───────────────────────────────────────────────────────────
  sec('3 the answer to B31 or B24: a package by the door\'s own key() fold first');
  db = seeded(); await turn(db, ASK[0], ASK[1]);
  r = await turn(db, 'Photographs and film', JSON.parse(NONE_JSON));
  T('3.1 THE CARD: the package\'s name, heard as NO ACT: attached at once, B22 from the row', r.reply === 'Package attached: Dia Walk Thirteen · Photographs and film · Rs 80,000.' && lpsIn(db)[0].lead_id === 'l-dia' && lastDoor(db).meta.listener.answered === 'B31');
  db = seeded(); await turn(db, ASK[0], ASK[1]);
  r = await turn(db, 'walk p7 album', req([{ act: 'find', client_as_spoken: 'walk p7 album' }], 'search'));
  T('3.2 THE DOOR\'S OWN READ FIRST: "walk p7 album" in lower case, heard as a `find` lookup, is her package (key() fold): the handover package then asks B26 with its own note', r.keys === 'B26' && noteIn(db).asked === 'B26' && noteIn(db).acts[0].package_as_spoken === 'Walk P7 Album');
  r = await turn(db, '5 June 2027', JSON.parse(NONE_JSON));
  T('3.3 and the date answered attaches with delivery 5 June 2027: TWO questions, TWO notes, ONE write at the end', r.keys === 'B27' && lpsIn(db)[0].delivery_on === '2027-06-05');
  db = seeded(); await turn(db, ASK[0], ASK[1]);
  r = await turn(db, 'Gold', JSON.parse(NONE_JSON)); const t1 = noteIn(db).tries;
  const r2 = await turn(db, 'Gold', JSON.parse(NONE_JSON));
  T('3.4 an answer that is no package of hers: B31 ONCE more (tries 1), then B3; nothing attached', r.reply === B31L && t1 === 1 && r2.reply === B3 && lpsIn(db).length === 0 && noteOf(db) === undefined);
  db = seeded(); await turn(db, ASK[0], ASK[1]);
  r = await turn(db, 'Gold', req([att('Dia Walk Thirteen', 'Gold')]));
  T('3.5 F-44.116\'s class: the listener echoing her word as the attach with package "Gold" is her answer heard twice, a re-ask (B31, tries 1), not a lapse', r.reply === B31L && noteIn(db).tries === 1);
  db = seeded(); await turn(db, ASK[0], ASK[1]);
  r = await turn(db, 'Attach Pre wedding shoot to Ravi Walk Thirteen', req([att('Ravi Walk Thirteen', 'Pre wedding shoot')]));
  T('3.6 the attach RESTATED with another package (and another client): lapses, handled fresh, attached to Ravi', r.keys === 'B22' && lpsIn(db)[0].lead_id === 'l-ravi');
  db = seeded(); await turn(db, ASK[0], ASK[1]);
  r = await turn(db, 'Raise the invoice for Walk45', req([{ act: 'invoice', client_as_spoken: 'Walk45' }]));
  T('3.7 a job of another kind lapses the package note: the invoice made, nothing attached', r.keys === 'B13' && lpsIn(db).length === 0);
  db = seeded(); await turn(db, ASK[0], ASK[1]);
  r = await turn(db, 'No', JSON.parse(NONE_JSON));
  T('3.8 THE CARD: a closed NO is B3, before the listener', r.reply === B3 && r.out.why === 'note_declined' && lpsIn(db).length === 0);
  db = seeded(); db.tables['public.vendor_packages'].push(pkgRow({ id: 'p-album2', name: 'walk p7 album', total: 30000, delivery_basis: 'on_the_day' }));
  await turn(db, 'Attach Walk P7 Album to Dia Walk Thirteen', req([att('Dia Walk Thirteen', 'Walk P7 Album')]));
  r = await turn(db, 'Pre wedding shoot', JSON.parse(NONE_JSON));
  T('3.9 B24 answered with a THIRD package by name: attached (her answer is the package she named, whichever question was asked)', r.keys === 'B22' && lpsIn(db)[0].package_id === 'p-pre');
  db = seeded(); await turn(db, 'x', req([att('Dia Walk Thirteen'), money('advance_paid', 'Dia Walk Thirteen', 'today')]));
  r = await turn(db, 'Photographs and film', JSON.parse(NONE_JSON));
  T('3.10 THE NOTE NEVER WRITES MONEY: the silenced advance rides the package note, and after the package is named it is planned from the row just attached and STAGED (B22 then B2), nothing applied', r.keys === 'B22,B2' && staged(db).length === 1 && staged(db)[0].state === 'staged' && db.tables['public.leads'].find((l) => l.id === 'l-dia').state === 'new');

  // ─── §4 F-44.117 FROM THE RECORD ───────────────────────────────────────────────────────────
  sec('4 F-44.117: a bare name answered to a name question, heard as a lookup, is her answer');
  T(`4.0 C-44.12: ${WALK_B} §3 holds both hearings verbatim`, fs.existsSync(P(WALK_B)) && src(WALK_B).includes(`HE: ${F1_SAID}\n`) && src(WALK_B).includes(`    HEARD: ${F1_JSON}\n`) && src(WALK_B).includes(`    HEARD: ${F2_JSON}\n`));
  const withPkg = () => { const d = seeded(); d.tables['public.leads'].push(leadRow({ id: 'l-asha', name: 'Asha Walk Twelve', wedding_date: '2027-03-05', wedding_date_precision: 'day' })); d.tables['public.lead_packages'].push(lp('l-asha')); return d; };
  db = withPkg(); await turn(db, 'The booking is confirmed', req([money('booking_confirmed')]));
  r = await turn(db, F1_SAID, JSON.parse(F1_JSON));
  T('4.1 06:33:29 AS RECORDED: "Asha walk twelve" heard as `find` on route search, answered to B35: HER ANSWER, the booking planned from the rows and STAGED, B2 from the row (his walk read B34)', r.reply === 'Confirm this booking? Asha Walk Twelve · Photographs and film · Rs 80,000. Reply YES or NO.' && staged(db).length === 1 && staged(db)[0].state === 'staged');
  db = withPkg(); await turn(db, 'The booking is confirmed', req([money('booking_confirmed')]));
  r = await turn(db, F2_SAID, JSON.parse(F2_JSON));
  T('4.2 06:32:39\'s hearing beside it: the same', r.keys === 'B2');
  db = withPkg(); await turn(db, 'The booking is confirmed', req([money('booking_confirmed')]));
  r = await turn(db, 'Asha Walk Twelve', req([{ act: 'note', client_as_spoken: 'Asha Walk Twelve' }]));
  T('4.3 an act of another kind whose client IS her whole message (an uncovered `note` over the name) is still her answer: B2', r.keys === 'B2');
  db = withPkg(); await turn(db, 'The booking is confirmed', req([money('booking_confirmed')]));
  r = await turn(db, 'Raise the invoice for Walk45', req([{ act: 'invoice', client_as_spoken: 'Walk45' }]));
  T('4.4 a GENUINE different job (its client is not her whole message, its route task) still lapses: the invoice made', r.keys === 'B13' && staged(db).length === 0);

  // ─── §5 THE CARD ───────────────────────────────────────────────────────────────────────────
  sec('5 every SAY line on B-2 (second cut)\'s walk card, in ONE thread and one database');
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
      await quiet(() => lane.processVendorInbound({ phone: '+919888294440', body: o.message, profileName: 'Dev', messageSid: `wamid.b98.${Math.random()}`, internalReplay: false, trimmedBody: o.message.trim(), numMedia: 0, hasMedia: false, mediaUrl: null, rawPayload: {} }, deps));
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
    d.tables['public.vendor_packages'].push(pkgRow({ id: 'p-nofee', name: 'Walk Thirteen No Fee', total: null, delivery_basis: 'on_the_day' }));
    const LIST = 'Photographs and film · Pre wedding shoot · Walk P7 Album · Walk Thirteen No Fee';
    const c1 = await turn(d, 'Add a new lead Dia Walk Thirteen, wedding on 5 March 2027', req([lead('Dia Walk Thirteen', '5 March 2027')]));
    T('5.1 SAY "Add a new lead Dia Walk Thirteen, wedding on 5 March 2027": filed', c1.keys === 'B17');
    const c2 = await turn(d, 'Attach a package to Dia Walk Thirteen', req([att('Dia Walk Thirteen')]));
    const c3 = await turn(d, 'Photographs and film', JSON.parse(NONE_JSON));
    T(`5.2 SAY "Attach a package to Dia Walk Thirteen", then "Photographs and film": "Which package? Yours are: ${LIST}."; then "Package attached: Dia Walk Thirteen · Photographs and film · Rs 80,000."`, c2.reply === `Which package? Yours are: ${LIST}.` && c3.reply === 'Package attached: Dia Walk Thirteen · Photographs and film · Rs 80,000.');
    const c4 = await turn(d, 'Attach Gold to Nobody Walk Thirteen', req([att('Nobody Walk Thirteen', 'Gold')]));
    T('5.3 SAY "Attach Gold to Nobody Walk Thirteen": "Could not attach the package. No lead called Nobody Walk Thirteen. Add the lead first." (the lead before the package)', c4.reply === 'Could not attach the package. No lead called Nobody Walk Thirteen. Add the lead first.');
    const c5 = await turn(d, 'Add a new lead Ravi Walk Thirteen, wedding on 5 March 2027', req([lead('Ravi Walk Thirteen', '5 March 2027')]));
    const c6 = await turn(d, 'Attach a package to Ravi Walk Thirteen', req([att('Ravi Walk Thirteen')]));
    const c7 = await turn(d, 'No', JSON.parse(NONE_JSON));
    T('5.4 SAY "Add a new lead Ravi Walk Thirteen, wedding on 5 March 2027", "Attach a package to Ravi Walk Thirteen", "No": filed; the question; "Okay. Nothing was changed."', c5.keys === 'B17' && c6.keys === 'B31' && c7.reply === B3 && lpsIn(d).length === 1);
    const c8 = await turn(d, 'Attach Walk Thirteen No Fee to Ravi Walk Thirteen', req([att('Ravi Walk Thirteen', 'Walk Thirteen No Fee')]));
    T('5.5 SAY "Attach Walk Thirteen No Fee to Ravi Walk Thirteen": "Set the fee first." (his own pwa byte), nothing attached', c8.reply === B33 && lpsIn(d).length === 1);
    const c9 = await turn(d, 'The booking is confirmed', req([money('booking_confirmed')]));
    const c10 = await turn(d, 'Dia walk thirteen', req([{ act: 'find', client_as_spoken: 'Dia walk thirteen' }], 'search'));
    const c11 = await turn(d, 'No', JSON.parse(NONE_JSON));
    T('5.6 SAY "The booking is confirmed" (if the listener hears the job), then "Dia walk thirteen" in lower case (heard as the lookup of 06:33:29), then "No": B35; "Confirm this booking? Dia Walk Thirteen · Photographs and film · Rs 80,000. Reply YES or NO."; B3; the row declined, Dia still new', c9.reply === B35 && c10.reply === 'Confirm this booking? Dia Walk Thirteen · Photographs and film · Rs 80,000. Reply YES or NO.' && c11.reply === B3 && staged(d)[0].state === 'declined' && d.tables['public.leads'].find((l) => l.name === 'Dia Walk Thirteen').state === 'new');
    const c12 = await driveWA({ db: d, message: 'Attach a package to Ravi Walk Thirteen', request: req([att('Ravi Walk Thirteen')]) });
    const c13 = await driveWA({ db: d, message: 'Walk P7 Album', request: JSON.parse(NONE_JSON) });
    const c14 = await driveWA({ db: d, message: '5 June 2027', request: JSON.parse(NONE_JSON) });
    T('5.7 ON WHATSAPP, SAY "Attach a package to Ravi Walk Thirteen", "Walk P7 Album", "5 June 2027": the question; "When is the delivery date for Ravi Walk Thirteen?"; "Package attached: Ravi Walk Thirteen · Walk P7 Album · Rs 25,000 · Delivery 5 June 2027.", the chain never called', one(c12) === `Which package? Yours are: ${LIST}.` && one(c13) === 'When is the delivery date for Ravi Walk Thirteen?' && one(c14) === 'Package attached: Ravi Walk Thirteen · Walk P7 Album · Rs 25,000 · Delivery 5 June 2027.' && lpsIn(d).length === 2);
    const rows = d.tables['engine.messages'].filter((m) => m.role === 'assistant');
    T('5.8 the thread holds the card: fourteen turns, every one answered by code, the last three on whatsapp', rows.length === 14 && rows.every((m) => m.meta.listener.door === true) && rows.slice(-3).every((m) => m.meta.listener.lane === 'whatsapp'));
  }

  // ─── §6 W-1 ───────────────────────────────────────────────────────────────────────────────
  sec('6 W-1 NONE, read from this packet\'s own manifest');
  const man = fs.existsSync(P(MAN)) ? src(MAN).split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#')) : [];
  T('6.1 W-1 NONE: no path under src/engine, no soul, lens or prompt file, no migration', man.length > 0 && man.every((p) => !/^src\/engine\/|soul|lens|^db\/migrations\//.test(p)));
  T('6.2 the manifest names exactly the nine paths this packet touches (C-44.7)', JSON.stringify(man.slice().sort()) === JSON.stringify([WALK_B, MAN, 'scripts/b98_lcv10_package_bench.js', 'scripts/b97_lcv10_name_bench.js', 'scripts/b93_lcv9_chain_out_bench.js', 'scripts/b92_lcv_p6a_bench.js', 'scripts/b90_lcv_p5_bench.js', 'src/lib/vendor/doorLines.js', WDf].sort()));
  // 6.3 RE-PINNED (the third B-2 cut): F-44.118's floor is IN the tree now (R-44.41), and B36 joined LINES; b99 holds both.
  T('6.3 LINES holds 41 (B31, B33 from this cut, B36 from the third; B37 to B39 from P6b, CE-45 LCV-11, his); F-44.118\'s floor is present, scoped by R-44.41 (b99 holds it)', Object.keys(DL.LINES).length === 79 /* RE-PINNED (CE-45 LCV-14, P7 cut 4 fix, labelled): 79 since B80 to B83, his; b109 holds them */ /* RE-PINNED (CE-45 LCV-14, P7 cut 4, labelled): 75 since B69 to B74, B78, B79, his (ASK 7: each form its own key); b108 holds them */ /* RE-PINNED (CE-45 LCV-14, P7 cut 3, labelled): 67 since B56 to B62, B67, B68, his (B60 carried, unspoken); b106 holds them */ /* P7 2b (CE-45 LCV-13, labelled): 58 since B48 to B53 */ /* P7 2a: 52 since B40 to B46, B54, B75 to B77 */ && /saidKey\.includes/.test(src(WDf)));

  // ─── §7 FUZZ ───────────────────────────────────────────────────────────────────────────────
  sec('7 fuzz');
  const boom = () => { throw new Error('hostile'); };
  const trap = new Proxy({}, { get: boom, has: boom, ownKeys: boom, getOwnPropertyDescriptor: boom });
  const HS = [undefined, null, 0, '', 'x', [], {}, trap, { asked: 'B31' }, { asked: 'B31', acts: [] }, { asked: 'B31', acts: [{ act: 'lead' }] }, { asked: 'B31', acts: [att(null)] }, { asked: 'B31', acts: [att('A')] }, { asked: 'B24', acts: [att('A', 'B')] }, { asked: 'B31', acts: [trap] }, { asked: 'B31', acts: [att('A')], tries: 'x' }];
  let t7 = 0; let ok7 = 0;
  for (const a of HS) { try { const v = WD.validNote(a); if (v) { ok7 += 1; if (v.acts[0].act !== 'attach_package' || !v.acts[0].client_as_spoken) t7 += 1; } } catch (_e) { t7 += 1; } }
  T(`7.1 validNote on ${HS.length} hostile package notes: ZERO throws; it accepts only a B24 or B31 note over an attach that names its client (${ok7} accepted)`, t7 === 0 && ok7 === 3);
  let t8 = 0;
  for (const a of HS) { const d = seeded(); let m = a; if (a === trap) m = undefined; d.tables['engine.messages'].push({ id: 'h', conversation_id: 'c-1', role: 'assistant', content: 'q', meta: { listener: { door: true, note: m } }, created_at: new Date(clock += 1000).toISOString() });
    try { const o = await quiet(() => WD.preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message: 'Photographs and film', lane: 'pwa' }, { llmCreate: earOf(JSON.parse(NONE_JSON)), nowMs: NOW })); if (!o || typeof o.door !== 'boolean') t8 += 1; if (lpsIn(d).length && !WD.validNote(m)) t8 += 1; } catch (_e) { t8 += 1; } }
  T(`7.2 preTurn with a hostile package note on the last row (${HS.length} shapes): ZERO throws, a verdict always, an ill-formed note never attaches`, t8 === 0);

  // ─── §8 MUTATIONS ──────────────────────────────────────────────────────────────────────────
  sec('8 mutations of production code, each reddening its cell');
  const flow = async (rq, steps, seedFn) => { const M = rq(WDf); const d = seedFn ? seedFn() : seeded(); const out = []; for (const [m, q] of steps) out.push(await turn(d, m, q, 'pwa', M)); return { out, d }; };
  await mut('8.1 M1 the package resolved BEFORE the lead again: a misspelt client with no such package meets B23, not B32 (reddens 2.3, 5.3)', WDf,
    [["    const client = String(found.lead.name || '').trim();\n    const pkgs = await packagesOf(supabase, vendor.id);\n    if (!pkgs) return null;\n    if (!said)", "    const client = String(found.lead.name || '').trim();\n    const pkgs = await packagesOf(supabase, vendor.id);\n    if (!pkgs) return null;\n    if (false)"],
     ["    const found = await L.lifecycle.resolveLead(supabase, vendor.id, name, false);\n    if (!found || !found.ok) {\n      if (found && found.reason === 'not_found') return { noLead: true, name }; // B32's place (with the founder)", "    const pk0 = await packagesOf(supabase, vendor.id); if (pk0 && said && !pk0.some((p) => p && key(p.name) === key(said))) { const line = DL.noSuchPackage(said, pk0.map((p) => p && p.name)); return line ? { speak: line, key: 'B23' } : null; }\n    const found = await L.lifecycle.resolveLead(supabase, vendor.id, name, false);\n    if (!found || !found.ok) {\n      if (found && found.reason === 'not_found') return { noLead: true, name }; // B32's place (with the founder)"]], [],
    async (rq) => flow(rq, [['Attach Gold to Nobody Walk Thirteen', req([att('Nobody Walk Thirteen', 'Gold')])]]), (x) => x.out[0].keys === 'B23');
  await mut('8.2 M2 the door GUESSING the one package she holds instead of asking B31 (reddens 2.2)', WDf,
    [["    if (!said) { const line = DL.whichPackage(pkgs.map((p) => p && p.name)); return line ? { speak: line, key: 'B31', skipHarvest: true } : null; }\n    const hits = pkgs.filter((p) => p && key(p.name) === key(said));", "    const hits = !said && pkgs.length === 1 ? pkgs : pkgs.filter((p) => p && key(p.name) === key(said));"]], [],
    async (rq) => flow(rq, [ASK], () => { const d = seeded(); d.tables['public.vendor_packages'] = [d.tables['public.vendor_packages'][0]]; return d; }), (x) => x.out[0].keys === 'B22');
  await mut('8.3 M3 the list UNSORTED, the rows\' order back (reddens 1.3, 2.1)', 'src/lib/vendor/doorLines.js',
    [[".sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0));", ';']], [],
    async (rq) => (rq('src/lib/vendor/doorLines.js').whichPackage || (() => 'NO whichPackage'))(['Walk P7 Album', 'Pre wedding shoot', 'Photographs and film']), (v) => v !== B31L);
  await mut('8.4 M4 the package note never persisted: her package name after B31 is LEFTOVER (reddens 3.1, 5.2)', WDf,
    [['      if (tries <= 1) st.note = { asked: w.key, acts:', '      if (false) st.note = { asked: w.key, acts:']], [],
    async (rq) => flow(rq, [ASK, ['Photographs and film', JSON.parse(NONE_JSON)]]), (x) => x.out[1].keys === 'LEFTOVER');
  await mut('8.5 M5 no_fee back to B30 (reddens 2.8, 5.5)', WDf,
    [["    if (code === 'no_fee') return { line: DL.LINES.B33, key: 'B33', call: { name: HANDS.attach_package, input, result: 'refused:no_fee' }, landed: false }; // F-44.102, his own byte\n", '']], [],
    async (rq) => flow(rq, [['x', req([att('Dia Walk Thirteen', 'No fee yet')])]], () => { const d = seeded(); d.tables['public.vendor_packages'].push(pkgRow({ id: 'p-nofee', name: 'No fee yet', total: null, delivery_basis: 'on_the_day' })); return d; }), (x) => x.out[0].keys === 'B30');
  await mut('8.6 M6 F-44.117 removed: his "Asha walk twelve" heard as `find` lapses the note and reads B34 again, 06:33:29 exactly (reddens 4.1, 5.6)', WDf,
    [["      const isAnswer = (a) => route === 'search' || key(a.client_as_spoken) === key(name);", '      const isAnswer = () => false;']], [],
    async (rq) => flow(rq, [['The booking is confirmed', req([money('booking_confirmed')])], [F1_SAID, JSON.parse(F1_JSON)]], withPkg), (x) => x.out[1].keys === 'B34' && staged(x.d).length === 0);
  await mut('8.7 M7 the package re-ask unbounded: a third wrong answer is asked again instead of B3 (reddens 3.4)', WDf,
    [["          if (note.tries > 0) return { door: true, reply: DL.LINES.B3, keys: ['B3'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, answered: note.asked, why: 'note_exhausted' };\n          const line = DL.whichPackage", "          if (note.tries > 9) return { door: true, reply: DL.LINES.B3, keys: ['B3'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, answered: note.asked, why: 'note_exhausted' };\n          const line = DL.whichPackage"]], [],
    async (rq) => flow(rq, [ASK, ['Gold', JSON.parse(NONE_JSON)], ['Gold', JSON.parse(NONE_JSON)]]), (x) => x.out[2].keys === 'B31');
  await mut('8.8 M8 the money act APPLIED on the package\'s turn instead of staged (reddens 3.10)', WDf,
    [['        try { row = await pma.stage(supabase, { vendorId: vendor.id, act: moneyPlan.stage.act, request: moneyPlan.stage.request, lane }); }', "        try { (supabase.tables['public.leads'].find((l) => l.id === moneyPlan.stage.request.lead_id) || {}).state = 'booked'; row = { id: 'applied' }; }"]], [],
    async (rq) => flow(rq, [['x', req([att('Dia Walk Thirteen'), money('advance_paid', 'Dia Walk Thirteen', 'today')])], ['Photographs and film', JSON.parse(NONE_JSON)]]), (x) => staged(x.d).length === 0 && x.d.tables['public.leads'].find((l) => l.id === 'l-dia').state === 'booked');

  console.log(`\n════════  b98 · ${pass} pass · ${fail} fail  ════════`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`  · ${f}`)); }
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('b98 CRASHED:', (e && e.stack) || e); process.exit(2); });
