'use strict';
// scripts/b95_lcv10_note_bench.js · TDW CE-44 · LCV-10 · PART B-1: THE DOOR KEEPS ITS OWN NOTE OF A DATE IT ASKED FOR. Rung b95.
//
// F-44.111 (allocated): a two-digit year after a month name was unreadable. WITNESSED, the founder's walk of Part A, 21 September 2026,
// turn 4 on WhatsApp, his own words: "Add a new lead kabir walk 9, wedding on 5th March 27"; the door answered B7.
// F-44.112 (allocated): a door line that asks her to say a date had no reader for her answer. Turn 5, "5 march", was heard as NO ACT
// and met LEFTOVER. It is F-44.104 again ("5 June 2027" answered to B26, heard as NO ACT twice on P6a-2's walk). FIVE lines ask for a
// date: B6, B7, B21, B26, B28. The door now keeps the waiting act on its OWN row (meta.listener.note) and reads her answer itself.
//
// C-44.12: EVERY SENTENCE WITH A RECORDED HEARING IS REPLAYED VERBATIM. Part A's walk is his export (Supabase CSV, 12 rows, sha256
// ec2466543399f4df84c5a9d1ae9ee9f0564ac9887c36f7e61a75f007b09b9ed6), whose HEARD values are the literals below and are written into this
// packet's handover §3 by script; 1.0 reads them back from that handover. P6a-2's hearing of "5 June 2027" is read from
// TDW_CE44_LCV8_P6A2_WALK_RECORD.md §4. Requests with no recorded hearing are labelled INVENTED.
//
//  §1 spokenDate.js, F-44.111: his exact words first; the slash form's century rule and no new one; every guard after it.
//  §2 the note is WRITTEN when a turn ends in exactly one of the five date lines, and only then; the marks beside it untouched.
//  §3 the note is READ: the recorded specimens first; the door's own read decides a typed answer whatever the listener heard; a
//     DIFFERENT heard act lapses it; an unreadable answer once, then B3; a closed NO is B3; a live staged row wins; never by text;
//     the last assistant row only.
//  §4 THE NOTE NEVER WRITES MONEY: B6 then a date ends in B2 with a STAGED row and nothing applied; a future date is refused as today.
//  §5 the REAL WhatsApp lane, runTurn SPIED: his turns 4 and 5.
//  §6 EVERY SAY LINE ON PART B-1's CARD, one thread, one database, the REAL createLead, resolveLead, attachPackage and staging.
//  §7 W-1 NONE and the scope from this packet's own manifest. §8 fuzz, the note itself hostile. §9 mutations, each reddening its cell.
// THE EXIT CODE IS THE VERDICT.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-ce44-lcv10-partb1.txt';
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

const HANDOVER = 'docs/handovers/TDW_CE44_LCV10_PARTB1_HANDOVER.md';
const LCV8 = 'docs/handovers/TDW_CE44_LCV8_P6A2_WALK_RECORD.md';
const SDf = 'src/lib/vendor/spokenDate.js';
// PART A's WALK, turns 4 and 5, HIS OWN WORDS ON WHATSAPP and what the live listener HEARD, from his export (sha256 ec2466543399…).
const T4_SAID = 'Add a new lead kabir walk 9, wedding on 5th March 27';
const T4_JSON = '{"acts":[{"act":"lead","date_as_spoken":"5th March 27","client_as_spoken":"kabir walk 9"}],"route":"task"}';
const T5_SAID = '5 march';
const NONE_JSON = '{"acts":[],"route":"none"}';
const B3 = 'Okay. Nothing was changed.';
const B6 = 'When did the payment come in?';
const B7 = 'I could not read that date. Say it like 5 December.';
const B21 = 'That wedding date cannot be right. Say it like 5 December 2027.';
const B28 = 'That delivery date cannot be right. Say it like 5 December 2027.';
const att = (client, pkg, date) => ({ act: 'attach_package', client_as_spoken: client, package_as_spoken: pkg, ...(date ? { date_as_spoken: date } : {}) });
const staged = (d) => (d.tables['public.pending_money_acts'] || []);
const lastDoor = (d) => d.tables['engine.messages'].filter((m) => m.role === 'assistant').slice(-1)[0];
const noteOf = (d) => { const r = lastDoor(d); return r && r.meta && r.meta.listener ? r.meta.listener.note : undefined; };
// e-62's lesson applied to this rung from its first cut: a note that is not there reads as {} where a cell reads INTO it, so on uncured
// source every cell is a named FAIL and the later cells still list. Cells that assert ABSENCE use noteOf() itself.
const noteIn = (d) => noteOf(d) || { acts: [{}] };

async function main() {
  const WD = require(WDP);
  const SD = require(P(SDf));
  const LH = require(P('src/lib/vendor/lifecycleHands.js'));
  const LF = require(LFP);
  const DL = require(P('src/lib/vendor/doorLines.js'));
  const meter = require(P('src/agent/harvest.js'))._meter;
  const memoryOf = (db) => ({
    getOrCreateConversation: async () => ({ conversationId: 'c-1', thread: [] }),
    saveMessage: async (cid, role, content, tc, meta) => { const id = `m-${db.tables['engine.messages'].length + 1}`; db.tables['engine.messages'].push({ id, conversation_id: cid, role, content, tool_calls: tc || null, meta: meta || null, created_at: new Date(clock += 1000).toISOString() }); return id; },
  });
  const gen = async () => ({ ok: true, invoice_number: 'TDW/DEV440/31', pdf_url: 'https://x.invalid/p.pdf', made: 'minted' });
  // One turn as a lane runs it: the REAL preTurn, the REAL standIn (key absent: chain out), the REAL persistDoorTurn. `request` is what the ear returns.
  const turn = async (db, message, request, lane, M, extra) => {
    const mod = M || WD;
    LF._resetLaneFlagCache();
    const out = await quiet(() => mod.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message, lane: lane || 'pwa' }, { llmCreate: earOf(request), nowMs: NOW, generateInvoiceForBinder: gen, ...(extra || {}) }));
    const said = out && out.door === true ? out : await quiet(() => mod.standIn({ supabase: db, out }, { nowMs: NOW }));
    await quiet(() => mod.persistDoorTurn({ supabase: db, agentId: AG, message, out: said, lane: lane || 'pwa' }, { memory: memoryOf(db), meter }));
    return { out, said, reply: said.reply, keys: J(said.keys) };
  };
  const seeded = () => { const d = makeDb(world()); d.tables['public.leads'].push(leadRow({ id: 'l-tara', name: 'Tara Walk Ten', wedding_date: '2027-03-05', wedding_date_precision: 'day' }), leadRow({ id: 'l-arjun', name: 'Arjun Walk Ten', wedding_date: '2027-03-05', wedding_date_precision: 'day' })); d.tables['engine.records'].push({ id: 'b-walk', agent_id: AG, client: 'Walk45', amount: 50000, amount_received: 0, hidden: false, date: '2026-09-25' }); return d; };

  // ─── §1 F-44.111 ───────────────────────────────────────────────────────────────────────────
  sec('1 spokenDate.js, F-44.111: a two-digit year after a month name reads as the slash form reads it');
  const R = (s, direction) => SD.resolveSpokenDate(s, { direction: direction || 'future', nowMs: NOW });
  const ho = fs.existsSync(P(HANDOVER)) ? src(HANDOVER) : '';
  T(`1.0 C-44.12: the literals this bench replays are byte for byte the HEARD lines of Part A's walk as ${HANDOVER} §3 records them from his export, under his exact words; and P6a-2's "5 June 2027" is heard as NO ACT in ${LCV8} §4`, ho.includes(`HE: ${T4_SAID}\n`) && ho.includes(`    HEARD: ${T4_JSON}\n`) && ho.includes(`HE: ${T5_SAID}\n`) && ho.includes(`    HEARD: ${NONE_JSON}\n`) && src(LCV8).includes('"5 June 2027" answered to B26, twice') && src(LCV8).includes(`{"acts":[],"route":"none"} both times`));
  T('1.1 HIS EXACT WORDS FIRST: "5th March 27" is 5 March 2027', R('5th March 27').ok === true && R('5th March 27').iso === '2027-03-05');
  T('1.2 the chair\'s three: "5 March 27" and "5 Mar 27" read as "5/3/27" reads, the SAME century rule; month first too', ['5 March 27', '5 Mar 27', '5/3/27', 'March 5 27', '5th of march 27'].every((s) => R(s).iso === '2027-03-05'));
  T('1.3 four digits read as before; no year reads its next occurrence as before', R('5 March 2027').iso === '2027-03-05' && R('5th March 2027').iso === '2027-03-05' && R('5 march').iso === '2027-03-05' && R('5 December').iso === '2026-12-05');
  T('1.4 one digit or three is still unreadable; "0227" is still reason year (F-44.98); an impossible day is still unreadable', R('5 March 7').ok === false && R('5 March 227').reason === 'unreadable' && R('15 March 0227').reason === 'year' && R('31 February 27').reason === 'unreadable');
  T('1.5 every direction guard applies AFTER it: a received date "18 September 26" is 18 September 2026; "18 September 27" is after today and refused', R('18 September 26', 'past').iso === '2026-09-18' && R('18 September 27', 'past').ok === false);
  T('1.6 a two-digit year in the past is READ (2025), so the lead path answers B21 about it, not B7', R('5 December 25').iso === '2025-12-05' && WD.planLead({ act: 'lead', client_as_spoken: 'X Y', date_as_spoken: '5 December 25' }, NOW).key === 'B21');

  // ─── §2 THE NOTE IS WRITTEN ────────────────────────────────────────────────────────────────
  sec('2 the note is written when a turn ends in exactly ONE date line, and only then');
  let db = seeded();
  let r = await turn(db, 'Add a new lead Arjun Walk Eleven, wedding on 31 February 2027', req([lead('Arjun Walk Eleven', '31 February 2027')]));
  let n = noteIn(db);
  T('2.1 B7 for a lead: the note holds the act WITHOUT its date, asked B7, tries 0, direction future; nothing filed', r.reply === B7 && canon(n) === canon({ asked: 'B7', acts: [{ act: 'lead', client_as_spoken: 'Arjun Walk Eleven' }], tries: 0, direction: 'future' }) && leadsIn(db).length === 0);
  T('2.2 it sits BESIDE the marks and touches neither: no `asked`, no `asked_name` on this row; door true; the heard request recorded whole', (() => { const l = lastDoor(db).meta.listener; return l.door === true && !('asked' in l) && !('asked_name' in l) && l.request.acts[0].date_as_spoken === '31 February 2027'; })());
  db = seeded(); r = await turn(db, 'x', req([lead('Arjun Walk Eleven', '5 March 2021')]));
  T('2.3 B21 for a lead keeps a note too', r.reply === B21 && noteIn(db).asked === 'B21');
  db = seeded(); r = await turn(db, 'Attach Walk P7 Album to tara walk ten', req([att('tara walk ten', 'walk p7 album')]));
  n = noteIn(db);
  T('2.4 B26: the note holds the attach with THE NAMES FROM THE ROWS (she typed both in lower case) and the two ids beside them', r.reply === 'When is the delivery date for Tara Walk Ten?' && canon(n) === canon({ asked: 'B26', acts: [{ act: 'attach_package', client_as_spoken: 'Tara Walk Ten', package_as_spoken: 'Walk P7 Album' }], tries: 0, direction: 'future', lead_id: 'l-tara', package_id: 'p-album' }));
  db = seeded(); r = await turn(db, 'x', req([att('Tara Walk Ten', 'Walk P7 Album', '5 January 2026')]));
  T('2.5 B28 keeps a note', r.reply === B28 && noteIn(db).asked === 'B28' && lpsIn(db).length === 0);
  db = seeded(); r = await turn(db, 'The advance came in for Tara Walk Ten', req([{ act: 'advance_paid', client_as_spoken: 'Tara Walk Ten' }]));
  n = noteIn(db);
  T('2.6 B6 for an advance: the note holds the money act, direction PAST, and NOTHING is staged', r.reply === B6 && n.asked === 'B6' && n.direction === 'past' && canon(n.acts) === canon([{ act: 'advance_paid', client_as_spoken: 'Tara Walk Ten' }]) && n.lead_id === 'l-tara' && staged(db).length === 0);
  db = seeded(); r = await turn(db, 'x', req([att('Tara Walk Ten', 'Walk P7 Album'), { act: 'advance_paid', client_as_spoken: 'Tara Walk Ten', date_as_spoken: 'today' }]));
  n = noteIn(db);
  T('2.7 an attach that asks B26 silences the money act beside it, AND THE NOTE CARRIES THAT ACT so it is not lost: acts are the attach, then the advance with its own date', r.keys === 'B26' && n.acts.length === 2 && (n.acts[1] || {}).act === 'advance_paid' && (n.acts[1] || {}).date_as_spoken === 'today' && staged(db).length === 0);
  db = seeded(); r = await turn(db, 'x', req([lead('A B', '31 February 2027'), lead('C D', '31 February 2027')]));
  T('2.8 TWO date lines in one turn keep NO note: an answer could not say which', r.keys === 'B7,B7' && noteOf(db) === undefined);
  db = seeded(); r = await turn(db, 'x', req([lead('Arjun Walk Eleven', '5 March 2027')]));
  const r2 = await turn(db, 'Hello', JSON.parse(NONE_JSON));
  T('2.9 a turn that asks for no date keeps no note: a lead filed, a stand-in LEFTOVER', r.keys === 'B17' && r2.keys === 'LEFTOVER' && db.tables['engine.messages'].filter((m) => m.role === 'assistant').every((m) => !('note' in m.meta.listener)));

  // ─── §3 THE NOTE IS READ ───────────────────────────────────────────────────────────────────
  sec('3 the note is read: the recorded specimens first');
  db = makeDb(world());
  r = await turn(db, T4_SAID, JSON.parse(T4_JSON), 'whatsapp');
  T('3.1 PART A\'s WALK, TURN 4, his words and the heard request VERBATIM: after this cut THE LEAD IS FILED: "Lead added: kabir walk 9 · 5 March 2027."', r.reply === 'Lead added: kabir walk 9 · 5 March 2027.' && leadsIn(db).length === 1 && leadsIn(db)[0].wedding_date === '2027-03-05' && leadsIn(db)[0].source === 'whatsapp');
  // "WERE IT STILL REFUSED" (the chair's words): spokenDate.js is put back to its bytes at 6456690 for this ONE cell, so turn 4 reads B7 as it
  // did live; then turn 5, "5 march", HEARD AS NO ACT exactly as it was, is read by the door's own note and FILES the lead.
  let refused = { a: {}, b: {}, mid: -1, note4: { acts: [{}] }, leads: [], last: {} };
  try { refused = await withMutated(SDf, [['${DAY}(?: of)? ([a-z.]+)(?: (\\\\d{2}|\\\\d{4}))?', '${DAY}(?: of)? ([a-z.]+)(?: (\\\\d{4}))?']], [WDf], async (rq) => {
    const M = rq(WDf); const d = makeDb(world());
    const a = await turn(d, T4_SAID, JSON.parse(T4_JSON), 'whatsapp', M);
    const mid = leadsIn(d).length; const note4 = noteIn(d);
    const b = await turn(d, T5_SAID, JSON.parse(NONE_JSON), 'whatsapp', M);
    return { a, b, mid, note4, leads: leadsIn(d), last: lastDoor(d).meta.listener };
  }); } catch (e) { console.log(`        (${e.message})`); }
  T('3.2 TURNS 4 AND 5 AS THEY WENT LIVE: turn 4 refused with B7 and nothing filed, the note keeping "kabir walk 9"; THEN "5 march", heard as NO ACT, is read by the note: "Lead added: kabir walk 9 · 5 March 2027."', refused.a.reply === B7 && refused.mid === 0 && refused.note4.acts[0].client_as_spoken === 'kabir walk 9' && refused.b.reply === 'Lead added: kabir walk 9 · 5 March 2027.' && refused.leads.length === 1 && refused.leads[0].wedding_date === '2027-03-05');
  T('3.3 the record of that turn: what was HEARD is kept as heard (no act), `answered` names the question it answered, and no note is left behind', canon(refused.last.request) === canon(JSON.parse(NONE_JSON)) && refused.last.answered === 'B7' && !('note' in refused.last));
  const bodies = [];
  const LP = require(P('src/api/vendor/leadPackages.js'));
  const spy = async (sb, v, leadId, body) => { bodies.push(JSON.parse(JSON.stringify(body))); return LP.attachPackage(sb, v, leadId, body); };
  db = seeded();
  await turn(db, 'Attach Walk P7 Album to Tara Walk Ten', req([att('Tara Walk Ten', 'Walk P7 Album')]));
  r = await turn(db, '5 June 2027', JSON.parse(NONE_JSON), 'pwa', null, { attachPackage: spy });
  T(`3.4 P6a-2's WALK, TURNS 10 AND 21 (${LCV8} §4): "5 June 2027" answered to B26 and heard as NO ACT now ATTACHES: the REAL attachPackage receives EXACTLY { package_id, delivery_on } and B27 speaks the date from the row`, r.reply === 'Package attached: Tara Walk Ten · Walk P7 Album · Rs 25,000 · Delivery 5 June 2027.' && JSON.stringify(bodies) === '[{"package_id":"p-album","delivery_on":"2027-06-05"}]' && lpsIn(db).length === 1 && lpsIn(db)[0].lead_id === 'l-tara' && noteOf(db) === undefined);
  for (const [label, request] of [['as a `date` lookup (INVENTED: the chair\'s worry, a bare date over-heard)', req([{ act: 'date', date_as_spoken: '5 June 2027' }], 'search')], ['as the attach carried by the thread, the happy path of b92 15.3', req([att('Tara Walk Ten', 'Walk P7 Album', '5 June 2027')])], ['with the listener DOWN', 'FAIL']]) {
    db = seeded();
    await turn(db, 'Attach Walk P7 Album to Tara Walk Ten', req([att('Tara Walk Ten', 'Walk P7 Album')]));
    const out = await quiet(() => WD.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message: '5 June 2027', lane: 'pwa' }, { llmCreate: request === 'FAIL' ? (async () => { throw new Error('down'); }) : earOf(request), nowMs: NOW }));
    T(`3.5 THE DOOR'S OWN READ DECIDES A TYPED ANSWER FIRST: "5 June 2027" heard ${label} still attaches, B27`, out.door === true && J(out.keys) === 'B27' && lpsIn(db).length === 1);
  }
  db = seeded();
  await turn(db, 'Attach Walk P7 Album to Tara Walk Ten', req([att('Tara Walk Ten', 'Walk P7 Album')]));
  r = await turn(db, 'Raise the invoice for Walk45', req([{ act: 'invoice', client_as_spoken: 'Walk45' }]));
  T('3.6 INVENTED, a fresh job typed after the question: the door cannot read it as a date AND the listener heard an act OTHER than the noted one, so THE NOTE LAPSES and her message is handled fresh: the invoice is made, nothing is attached, no note remains', r.keys === 'B13' && lpsIn(db).length === 0 && noteOf(db) === undefined && !('answered' in lastDoor(db).meta.listener));
  db = seeded();
  await turn(db, 'Attach Walk P7 Album to Arjun Walk Ten', req([att('Arjun Walk Ten', 'Walk P7 Album')]));
  const u1 = await turn(db, 'whenever', JSON.parse(NONE_JSON)); const n1 = noteIn(db);
  const u2 = await turn(db, 'whenever', JSON.parse(NONE_JSON)); const n2 = noteOf(db);
  const u3 = await turn(db, 'whenever', JSON.parse(NONE_JSON));
  T('3.7 INVENTED, an answer the door cannot read, no act heard: answered ONCE as any unreadable date is (B7), the note kept with tries 1; the next is B3 and keeps no note; the one after is an ordinary message (LEFTOVER). Nothing was ever attached', u1.reply === B7 && n1.tries === 1 && n1.asked === 'B7' && n1.acts[0].package_as_spoken === 'Walk P7 Album' && u2.reply === B3 && u2.said.why === 'note_exhausted' && n2 === undefined && u3.keys === 'LEFTOVER' && lpsIn(db).length === 0);
  db = seeded();
  await turn(db, 'Attach Walk P7 Album to Arjun Walk Ten', req([att('Arjun Walk Ten', 'Walk P7 Album')]));
  u1.x = await turn(db, 'whenever', req([att('Arjun Walk Ten', 'Walk P7 Album')]));
  const okAfter = await turn(db, '5 June 2027', JSON.parse(NONE_JSON));
  T('3.8 the SAME act heard, garbled, does not lapse the note (B7); and a readable date on the second try still attaches', u1.x.reply === B7 && okAfter.keys === 'B27' && lpsIn(db).length === 1);
  for (const word of ['No', 'no.', 'cancel', 'Nahi']) {
    db = seeded();
    await turn(db, 'Attach Walk P7 Album to Arjun Walk Ten', req([att('Arjun Walk Ten', 'Walk P7 Album')]));
    r = await turn(db, word, JSON.parse(NONE_JSON));
    T(`3.9 a closed NO word ("${word}") answered to the door's date question is B3, decided BEFORE the listener, never LEFTOVER; nothing attached, no note left`, r.reply === B3 && r.out.door === true && r.out.why === 'note_declined' && lpsIn(db).length === 0 && noteOf(db) === undefined);
  }
  db = seeded();
  await turn(db, 'Attach Walk P7 Album to Arjun Walk Ten', req([att('Arjun Walk Ten', 'Walk P7 Album')]));
  r = await turn(db, 'Yes', JSON.parse(NONE_JSON));
  T('3.10 a closed YES word is an answer the door cannot read: B7 once (tries 1), never yes_no_nothing_waiting\'s LEFTOVER', r.reply === B7 && noteIn(db).tries === 1 && r.out.door === true);
  db = seeded();
  await turn(db, 'Attach Walk P7 Album to Arjun Walk Ten', req([att('Arjun Walk Ten', 'Walk P7 Album')]));
  db.tables['public.pending_money_acts'].push({ id: 'pm-1', vendor_id: V.id, act: 'booking_confirmed', request: { lead_id: 'l-tara', lead_name: 'Tara Walk Ten', kind: 'booking_confirmed' }, lane: 'pwa', state: 'staged', outcome: null, created_at: new Date(NOW - 60000).toISOString(), resolved_at: null, expires_at: new Date(NOW + 600000).toISOString() });
  r = await turn(db, 'No', JSON.parse(NONE_JSON));
  T('3.11 A LIVE STAGED MONEY ROW WINS OVER ANY NOTE: her No declines THE MONEY QUESTION (the row reads declined), not the date question', r.reply === B3 && r.out.why !== 'note_declined' && staged(db)[0].state === 'declined');
  db = seeded();
  db.tables['engine.messages'].push({ id: 'txt', conversation_id: 'c-1', role: 'assistant', content: 'When is the delivery date for Tara Walk Ten?', meta: { listener: { door: true } }, created_at: new Date(clock += 1000).toISOString() });
  r = await turn(db, '5 June 2027', JSON.parse(NONE_JSON));
  T('3.12 NEVER BY MATCHING TEXT: a row READING B26 with no note on it is not the door\'s question; "5 June 2027" heard as no act is LEFTOVER, as at 6456690', r.keys === 'LEFTOVER' && lpsIn(db).length === 0);
  db = seeded();
  await turn(db, 'Attach Walk P7 Album to Tara Walk Ten', req([att('Tara Walk Ten', 'Walk P7 Album')]));
  const between = await turn(db, 'Raise the invoice for Walk45', req([{ act: 'invoice', client_as_spoken: 'Walk45' }]));
  r = await turn(db, '5 June 2027', JSON.parse(NONE_JSON));
  T('3.13 THE LAST ASSISTANT ROW ONLY: once another job has come between (the note lapsed, the invoice made), a bare date is an ordinary message again', between.keys === 'B13' && r.keys === 'LEFTOVER' && lpsIn(db).length === 0);
  db = seeded();
  await turn(db, 'Attach Walk P7 Album to Tara Walk Ten', req([att('Tara Walk Ten', 'Walk P7 Album')]));
  r = await turn(db, 'Hello', JSON.parse(NONE_JSON));
  T('3.13b SAID PLAINLY, the ruling\'s cost: a message that is no date and in which NO act was heard, typed after a date question, is answered as an unreadable date ONCE ("Hello" reads B7), and the question still stands', r.reply === B7 && noteIn(db).tries === 1);
  db = seeded(); r = await turn(db, 'x', req([lead('Arjun Walk Eleven', '5 March 2021')]));
  r = await turn(db, '5 March 2028', JSON.parse(NONE_JSON));
  T('3.14 B21 answered with a date: the lead is re-planned with it and filed', r.reply === 'Lead added: Arjun Walk Eleven · 5 March 2028.' && leadsIn(db).length === 1);
  db = seeded(); await turn(db, 'x', req([att('Tara Walk Ten', 'Walk P7 Album', '5 January 2026')]));
  r = await turn(db, '5 January 2026', JSON.parse(NONE_JSON)); const again = noteIn(db);
  const third = await turn(db, '5 January 2026', JSON.parse(NONE_JSON));
  T('3.15 a READABLE date the plans refuse (B28) is refused truthfully ONCE more with tries 1, then B3: the door cannot be held in a loop', r.reply === B28 && again.tries === 1 && third.reply === B3 && lpsIn(db).length === 0);
  db = seeded(); db.tables['public.leads'] = db.tables['public.leads'].filter((l) => l.id !== 'l-tara');
  db.tables['engine.messages'].push({ id: 'q', conversation_id: 'c-1', role: 'assistant', content: 'q', meta: { listener: { door: true, note: { asked: 'B26', acts: [att('Tara Walk Ten', 'Walk P7 Album')], tries: 0 } } }, created_at: new Date(clock += 1000).toISOString() });
  r = await turn(db, '5 June 2027', JSON.parse(NONE_JSON));
  T('3.16 the rows are read AS THEY STAND on the answering turn: the lead gone since the question, the door says so with B32 through the stand-in and attaches nothing', r.reply === 'Could not attach the package. No lead called Tara Walk Ten. Add the lead first.' && lpsIn(db).length === 0);

  // ─── §4 THE NOTE NEVER WRITES MONEY ────────────────────────────────────────────────────────
  sec('4 the note never writes money: it plans the money act afresh and STAGES it exactly as today');
  const withPkg = () => { const d = seeded(); d.tables['public.lead_packages'].push({ id: 'lp-t', vendor_id: V.id, lead_id: 'l-tara', package_id: 'p-film', snapshot: { name: 'Photographs and film', delivery_basis: 'days' }, total: 80000, schedule: [], delivery_on: null, quoted_at: null, quote_draft_id: null, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', deleted_at: null }); return d; };
  db = withPkg();
  await turn(db, 'The advance came in for Tara Walk Ten', req([{ act: 'advance_paid', client_as_spoken: 'Tara Walk Ten' }]));
  // e-66 (CE-44 LCV-10, found by the FOUNDER'S FLOOR at 12:08 AM IST on 22 September): this cell pinned the LITERAL '2026-09-21' for "today".
  // planBooking and planMoney read the REAL clock for a received date (workingDoor.js calls resolveSpokenDate with direction 'past' and NO
  // nowMs, as they did before this seat), so the cell was green on 21 September IST and RED from midnight, for ever. C-44.7: a cell pins what
  // cannot move, and the day moves. "today" is now compared with today in IST as production reads it, taken on BOTH sides of the turn so the
  // cell cannot flake at midnight either. The fixed NOW still serves every path that takes nowMs.
  const dayBefore = SD.todayIstIso();
  r = await turn(db, 'today', JSON.parse(NONE_JSON));
  const dayAfter = SD.todayIstIso();
  const tara = () => db.tables['public.leads'].find((l) => l.id === 'l-tara');
  T('4.1 B6, then "today" heard as NO ACT: the door asks B2 from the ROW, ONE row is STAGED with today\'s date in IST, and NOTHING IS APPLIED: the lead is still new, no invoice, no binder, the recorded hands empty', r.reply === 'Confirm this booking? Tara Walk Ten · Photographs and film · Rs 80,000. Reply YES or NO.' && staged(db).length === 1 && staged(db)[0].state === 'staged' && staged(db)[0].act === 'advance_paid' && [dayBefore, dayAfter].includes(staged(db)[0].request.advance_received_on) && /^\d{4}-\d{2}-\d{2}$/.test(dayBefore) && staged(db)[0].request.lead_id === 'l-tara' && tara().state === 'new' && !tara().binder_id && db.tables['public.invoices'].length === 0 && r.said.toolCalls.length === 0);
  T('4.2 the row that asked B2 carries F-44.58\'s mark `asked` as any B2 does, and no note: her YES or NO now belongs to the money question', (lastDoor(db).meta.listener || {}).asked === 'B2' && noteOf(db) === undefined);
  r = await turn(db, 'No', JSON.parse(NONE_JSON));
  T('4.3 and her No declines it as today: B3, the row declined, nothing applied', r.reply === B3 && staged(db)[0].state === 'declined' && tara().state === 'new');
  db = withPkg();
  await turn(db, 'The advance came in for Tara Walk Ten', req([{ act: 'advance_paid', client_as_spoken: 'Tara Walk Ten' }]));
  r = await turn(db, 'tomorrow', JSON.parse(NONE_JSON));
  T('4.4 A FUTURE DATE ANSWERED TO B6 IS REFUSED AS IT IS TODAY (B7, c-44.28: a received date is never resolved forward); nothing staged; tries 1', r.reply === B7 && staged(db).length === 0 && noteIn(db).tries === 1 && noteIn(db).direction === 'past');
  db = withPkg(); db.tables['public.lead_packages'] = [];
  await turn(db, 'x', req([att('Tara Walk Ten', 'Walk P7 Album'), { act: 'advance_paid', client_as_spoken: 'Tara Walk Ten', date_as_spoken: 'today' }]));
  r = await turn(db, '5 June 2027', JSON.parse(NONE_JSON));
  T('4.5 THE SILENCED MONEY ACT IS NOT LOST: the date answered, the attach lands (B27) and the advance the note carried is then planned from the row JUST attached and STAGED (B2 · Walk P7 Album · Rs 25,000); still nothing applied', r.keys === 'B27,B2' && r.reply.endsWith('Confirm this booking? Tara Walk Ten · Walk P7 Album · Rs 25,000. Reply YES or NO.') && staged(db).length === 1 && tara().state === 'new');

  // ─── §5 THE REAL WHATSAPP LANE ─────────────────────────────────────────────────────────────
  sec('5 the WhatsApp lane: the REAL processVendorInbound, preTurn, standIn and persistDoorTurn, runTurn SPIED');
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
      await quiet(() => lane.processVendorInbound({ phone: '+919888294440', body: o.message, profileName: 'Dev', messageSid: `wamid.b95.${Math.random()}`, internalReplay: false, trimmedBody: o.message.trim(), numMedia: 0, hasMedia: false, mediaUrl: null, rawPayload: {} }, deps));
      return { turns: turns.n, sent };
    } finally {
      if (savedWD) require.cache[WDP] = savedWD; else delete require.cache[WDP];
      if (savedVI) require.cache[VIP] = savedVI; else delete require.cache[VIP];
      LF._resetLaneFlagCache();
    }
  };
  const one = (w) => (w.turns === 0 && w.sent.length === 1 && Array.isArray(w.sent[0].media) && w.sent[0].media.length === 0 ? w.sent[0].text : `turns=${w.turns} sent=${w.sent.length}`);
  db = makeDb(world());
  let w = await driveWA({ db, message: T4_SAID, request: JSON.parse(T4_JSON) });
  T('5.1 his turn 4 on the real lane, heard verbatim: zero chain turns, one line: "Lead added: kabir walk 9 · 5 March 2027."', one(w) === 'Lead added: kabir walk 9 · 5 March 2027.' && leadsIn(db)[0].source === 'whatsapp');
  db = makeDb(world());
  w = await driveWA({ db, message: 'Add a new lead kabir walk 9, wedding on 31 February 2027', request: req([lead('kabir walk 9', '31 February 2027')]) });
  const w2 = await driveWA({ db, message: T5_SAID, request: JSON.parse(NONE_JSON) });
  T('5.2 INVENTED refusal, then HIS turn 5 verbatim, both on the real lane: B7, then "5 march" heard as NO ACT files the lead through the note the lane itself persisted; the chain never called', one(w) === B7 && one(w2) === 'Lead added: kabir walk 9 · 5 March 2027.' && leadsIn(db).length === 1);

  // ─── §6 THE CARD ───────────────────────────────────────────────────────────────────────────
  sec('6 every SAY line on Part B-1\'s walk card, in ONE thread and one database');
  {
    const d = makeDb(world());
    const c1 = await driveWA({ db: d, message: 'Add a new lead Tara Walk Ten, wedding on 5th March 27', request: req([lead('Tara Walk Ten', '5th March 27')]) });
    T('6.1 ON WHATSAPP, SAY "Add a new lead Tara Walk Ten, wedding on 5th March 27" (heard in the shape of Part A\'s turn 4): "Lead added: Tara Walk Ten · 5 March 2027."', one(c1) === 'Lead added: Tara Walk Ten · 5 March 2027.');
    const c2 = await turn(d, 'Add a new lead Arjun Walk Ten, wedding on 31 February 2027', req([lead('Arjun Walk Ten', '31 February 2027')]));
    T('6.2 IN THE APP, SAY "Add a new lead Arjun Walk Ten, wedding on 31 February 2027" (INVENTED hearing): "I could not read that date. Say it like 5 December.", nothing filed', c2.reply === B7 && leadsIn(d).length === 1);
    const c3 = await turn(d, '5 march', JSON.parse(NONE_JSON));
    T('6.3 SAY "5 march" (heard as Part A\'s turn 5 was: NO ACT): "Lead added: Arjun Walk Ten · 5 March 2027."', c3.reply === 'Lead added: Arjun Walk Ten · 5 March 2027.' && leadsIn(d).length === 2);
    const c4 = await turn(d, 'Attach Walk P7 Album to Tara Walk Ten', req([att('Tara Walk Ten', 'Walk P7 Album')]));
    T('6.4 SAY "Attach Walk P7 Album to Tara Walk Ten": "When is the delivery date for Tara Walk Ten?"', c4.reply === 'When is the delivery date for Tara Walk Ten?');
    const c5 = await turn(d, '5 June 2027', JSON.parse(NONE_JSON));
    T('6.5 SAY "5 June 2027" (heard as P6a-2\'s turns 10 and 21 were: NO ACT): "Package attached: Tara Walk Ten · Walk P7 Album · Rs 25,000 · Delivery 5 June 2027."', c5.reply === 'Package attached: Tara Walk Ten · Walk P7 Album · Rs 25,000 · Delivery 5 June 2027.' && lpsIn(d).length === 1);
    const c6 = await turn(d, 'Attach Walk P7 Album to Arjun Walk Ten', req([att('Arjun Walk Ten', 'Walk P7 Album')]));
    const c7 = await turn(d, 'No', JSON.parse(NONE_JSON));
    T('6.6 SAY "Attach Walk P7 Album to Arjun Walk Ten" then "No": the question, then "Okay. Nothing was changed."; nothing attached to Arjun Walk Ten', c6.reply === 'When is the delivery date for Arjun Walk Ten?' && c7.reply === B3 && lpsIn(d).length === 1);
    const c8 = await turn(d, 'Attach Walk P7 Album to Arjun Walk Ten', req([att('Arjun Walk Ten', 'Walk P7 Album')]));
    const c9 = await turn(d, 'whenever', JSON.parse(NONE_JSON));
    const c10 = await turn(d, 'whenever', JSON.parse(NONE_JSON));
    T('6.7 SAY the attach again, then "whenever" twice (INVENTED hearing: no act): the question; "I could not read that date. Say it like 5 December."; then "Okay. Nothing was changed."', c8.keys === 'B26' && c9.reply === B7 && c10.reply === B3 && lpsIn(d).length === 1);
    const c11 = await turn(d, 'The advance came in for Tara Walk Ten', req([{ act: 'advance_paid', client_as_spoken: 'Tara Walk Ten' }]));
    const c12 = await turn(d, 'today', JSON.parse(NONE_JSON));
    const c13 = await turn(d, 'No', JSON.parse(NONE_JSON));
    T('6.8 SAY "The advance came in for Tara Walk Ten", "today", "No": "When did the payment come in?"; "Confirm this booking? Tara Walk Ten · Walk P7 Album · Rs 25,000. Reply YES or NO."; "Okay. Nothing was changed."; the lead still new, nothing booked', c11.reply === B6 && c12.reply === 'Confirm this booking? Tara Walk Ten · Walk P7 Album · Rs 25,000. Reply YES or NO.' && c13.reply === B3 && staged(d).length === 1 && staged(d)[0].state === 'declined' && d.tables['public.leads'].filter((l) => /Walk Ten/.test(l.name)).every((l) => l.state === 'new') && d.tables['public.invoices'].length === 0);
    const doorRows = d.tables['engine.messages'].filter((m) => m.role === 'assistant');
    T('6.9 the thread holds the card: thirteen of his messages, thirteen rows, EVERY ONE answered by code, the first on whatsapp and the rest pwa', doorRows.length === 13 && doorRows.every((m) => m.meta.listener.door === true) && doorRows.map((m) => m.meta.listener.lane).join() === ['whatsapp', ...Array(12).fill('pwa')].join());
  }

  // ─── §7 W-1 AND THE SCOPE ──────────────────────────────────────────────────────────────────
  sec('7 W-1 NONE, read from Part B-1\'s own manifest');
  const man = fs.existsSync(P(MAN)) ? src(MAN).split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#')) : [];
  T('7.1 W-1 NONE: no path under src/engine, no soul, lens or prompt file, no migration', man.length > 0 && man.every((p) => !/^src\/engine\/|soul|lens|^db\/migrations\//.test(p)));
  T('7.2 the manifest names exactly the six paths this packet touches (C-44.7)', JSON.stringify(man.slice().sort()) === JSON.stringify([HANDOVER, MAN, 'scripts/b94_lcv10_bench.js', 'scripts/b95_lcv10_note_bench.js', SDf, WDf].sort()));
  const wdS = src(WDf).replace(/^\s*\/\/.*$/gm, '');
  T('7.3 NO MIGRATION AND NO NEW TABLE: the note lives in meta.listener.note, written in ONE place (persistDoorTurn) and read in ONE (lastDoorNote); the marks\' lines are as they were', (wdS.match(/note: out\.note/g) || []).length === 1 && (wdS.match(/validNote\(l\.note\)/g) || []).length === 1 && wdS.includes("const asked = (Array.isArray(out.keys) ? out.keys : []).find((k) => k === 'B1' || k === 'B2') || null;") && wdS.includes("const askedName = (Array.isArray(out.keys) ? out.keys : []).includes('B18') ? 'B18' : null;"));
  T('7.4 no byte a vendor reads was added: doorLines.js is not in this packet, and the five date lines are exactly the five the chair read there', !man.includes('src/lib/vendor/doorLines.js') && J(WD.DATE_ASKS) === 'B6,B7,B21,B26,B28' && (WD.DATE_ASKS || []).every((k) => /date|payment come in/.test(DL.LINES[k])));

  // ─── §8 FUZZ ───────────────────────────────────────────────────────────────────────────────
  sec('8 fuzz: every argument position, the note itself hostile');
  const boom = () => { throw new Error('hostile'); };
  const trap = new Proxy({}, { get: boom, has: boom, ownKeys: boom, getOwnPropertyDescriptor: boom });
  const getter = (k) => { const o = {}; Object.defineProperty(o, k, { get: boom, enumerable: true }); return o; };
  const HOSTILE = [undefined, null, 0, -1, NaN, '', 'x', true, [], {}, () => {}, Symbol('s'), 10n, trap, getter('asked'), getter('acts'), getter('tries'),
    { asked: 'B26' }, { asked: 'B26', acts: [] }, { asked: 'B26', acts: 'x' }, { asked: 'B99', acts: [att('A', 'B')] }, { asked: 'B26', acts: [null] }, { asked: 'B26', acts: [trap] }, { asked: 'B26', acts: [getter('act')] },
    { asked: 'B26', acts: [{ act: 'block_date', client_as_spoken: 'A' }] }, { asked: 'B26', acts: [{ act: 'attach_package' }] }, { asked: 'B26', acts: [att('A', 'B'), att('A', 'B'), att('A', 'B'), att('A', 'B'), att('A', 'B')] },
    { asked: 'B26', acts: [att('A', 'B')], tries: -5 }, { asked: 'B26', acts: [att('A', 'B')], tries: 'many' }, { asked: 'B6', acts: [{ act: 'advance_paid', client_as_spoken: { toString: boom } }] }];
  let t1 = 0; let c1n = 0; let accepted = 0;
  for (const a of HOSTILE) { c1n += 1; try { const v = (WD.validNote || (() => { throw new Error('no validNote'); }))(a); if (v !== null) { accepted += 1; if (!WD.DATE_ASKS.includes(v.asked) || !WD.allCovered({ route: 'task', acts: v.acts })) t1 += 1; } } catch (_e) { t1 += 1; } }
  T(`8.1 validNote: ${c1n} hostile notes, ZERO throws; what it accepts (${accepted}) is a date question over covered, named acts and nothing else`, t1 === 0 && accepted === 2);
  let t2 = 0; let c2n = 0;
  for (const a of HOSTILE) for (const b of HOSTILE) { c2n += 2; try { await quiet(() => (WD.noteFor || (() => { throw new Error('no noteFor'); }))(a, b, a, b, a, b, { lifecycle: LH })); } catch (_e) { t2 += 1; } try { await quiet(() => (WD.lastDoorNote || (() => { throw new Error('no lastDoorNote'); }))(a, b)); } catch (_e) { t2 += 1; } }
  T(`8.2 noteFor and lastDoorNote: ${c2n} hostile calls in every position, ZERO throws`, t2 === 0);
  let t3 = 0; let c3n = 0; let wrote = 0;
  for (const a of HOSTILE) {
    c3n += 1; const d = seeded();
    let metaNote = a; try { JSON.stringify(a); } catch (_e) { metaNote = undefined; } // what a database can hold
    if (typeof a === 'function' || typeof a === 'symbol' || typeof a === 'bigint' || a === trap) metaNote = undefined;
    d.tables['engine.messages'].push({ id: 'h', conversation_id: 'c-1', role: 'assistant', content: 'q', meta: { listener: { door: true, note: metaNote } }, created_at: new Date(clock += 1000).toISOString() });
    try { const o = await quiet(() => WD.preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message: '5 June 2027', lane: 'pwa' }, { llmCreate: earOf(JSON.parse(NONE_JSON)), nowMs: NOW })); if (!o || typeof o.door !== 'boolean') t3 += 1; if (lpsIn(d).length && !((WD.validNote || (() => null))(metaNote))) wrote += 1; } catch (_e) { t3 += 1; }
  }
  T(`8.3 preTurn with a HOSTILE NOTE on the last row (${c3n} shapes): ZERO throws, always a verdict, and a note that is not well-formed never writes`, t3 === 0 && wrote === 0);

  // ─── §9 MUTATIONS ──────────────────────────────────────────────────────────────────────────
  sec('9 mutations of production code, each reddening its cell');
  const flow = async (rq, steps, seedFn) => { const M = rq(WDf); const d = seedFn ? seedFn() : seeded(); const out = []; for (const [m, q] of steps) out.push(await turn(d, m, q, 'pwa', M)); return { out, d }; };
  const ASK = ['Attach Walk P7 Album to Tara Walk Ten', req([att('Tara Walk Ten', 'Walk P7 Album')])];
  await mut('9.1 M1 spokenDate.js put back to four digits only: his "5th March 27" is unreadable again (reddens 1.1, 3.1, 5.1, 6.1)', SDf,
    [['${DAY}(?: of)? ([a-z.]+)(?: (\\\\d{2}|\\\\d{4}))?', '${DAY}(?: of)? ([a-z.]+)(?: (\\\\d{4}))?']], [],
    async (rq) => rq(SDf).resolveSpokenDate('5th March 27', { direction: 'future', nowMs: NOW }), (v) => v.ok === false);
  await mut('9.2 M2 a NEW century rule (19xx) instead of the slash form\'s (reddens 1.2)', SDf, [["const YEAR = (t) => (t.length === 2 ? 2000 + Number(t) : Number(t));", "const YEAR = (t) => (t.length === 2 ? 1900 + Number(t) : Number(t));"]], [],
    async (rq) => rq(SDf).resolveSpokenDate('5 March 27', { direction: 'future', nowMs: NOW }).iso, (v) => v === '1927-03-05');
  await mut('9.3 M3 the note never persisted: "5 June 2027" heard as no act is LEFTOVER again, 21 September exactly (reddens 3.4, 6.5)', WDf,
    [['...(validNote(out.note) ? { note: out.note } : {}), ', '']], [],
    async (rq) => flow(rq, [ASK, ['5 June 2027', JSON.parse(NONE_JSON)]]), (x) => x.out[1].keys === 'LEFTOVER' && lpsIn(x.d).length === 0);
  await mut('9.4 M4 the closed NO no longer read by the note: her "No" to B26 is treated as a date (reddens 3.9, 6.6)', WDf,
    [["    if (note && said === 'no') {", "    if (false) {"]], [],
    async (rq) => flow(rq, [ASK, ['No', JSON.parse(NONE_JSON)]]), (x) => x.out[1].reply !== B3);
  await mut('9.5 M5 the note read BELOW the bare yes-or-no exit: her "Yes" to B26 meets yes_no_nothing_waiting and LEFTOVER (reddens 3.10)', WDf,
    [['    if (!note && !live && said !== null) {', '    if (!live && said !== null) {']], [],
    async (rq) => flow(rq, [ASK, ['Yes', JSON.parse(NONE_JSON)]]), (x) => x.out[1].keys === 'LEFTOVER');
  await mut('9.6 M6 THE LISTENER DECIDING A TYPED ANSWER: a bare date over-heard as a `date` lookup lapses the note and nothing attaches (reddens 3.5)', WDf,
    [['      if (own.ok || !movedOn) fromNote =', '      if (!movedOn) fromNote =']], [],
    async (rq) => flow(rq, [ASK, ['5 June 2027', req([{ act: 'date', date_as_spoken: '5 June 2027' }], 'search')]]), (x) => lpsIn(x.d).length === 0 && x.out[1].reply === 'I cannot do that by message yet. Use the app for it.');
  await mut('9.7 M7 THE LAPSE REMOVED: a fresh invoice job typed after B26 is read as a date and refused (reddens 3.6)', WDf,
    [['      if (own.ok || !movedOn) fromNote =', '      if (true) fromNote =']], [],
    async (rq) => flow(rq, [ASK, ['Raise the invoice for Walk45', req([{ act: 'invoice', client_as_spoken: 'Walk45' }])]]), (x) => x.out[1].reply === B7);
  await mut('9.8 M8 the one re-ask unbounded: a third unreadable answer is refused again instead of B3 (reddens 3.7, 6.7)', WDf,
    [['      if (tries > 1) {', '      if (tries > 99) {']], [],
    async (rq) => flow(rq, [ASK, ['whenever', JSON.parse(NONE_JSON)], ['whenever', JSON.parse(NONE_JSON)]]), (x) => x.out[2].reply === B7);
  await mut('9.9 M9 THE CHAIR\'S: a money act APPLIED WITHOUT STAGING on the note\'s turn: the lead is booked with no question asked (reddens 4.1)', WDf,
    [['        try { row = await pma.stage(supabase, { vendorId: vendor.id, act: moneyPlan.stage.act, request: moneyPlan.stage.request, lane }); }', "        try { await applyRow(supabase, vendor, agentId, { act: moneyPlan.stage.act, request: moneyPlan.stage.request }, { ...L, lifecycle: { ...L.lifecycle, runLifecycleSignals: async () => { (supabase.tables['public.leads'].find((l) => l.id === moneyPlan.stage.request.lead_id) || {}).state = 'booked'; return { results: [{ ok: true, code: 'booked' }], lines: [] }; } } }); row = { id: 'applied' }; }"]], [],
    async (rq) => flow(rq, [['The advance came in for Tara Walk Ten', req([{ act: 'advance_paid', client_as_spoken: 'Tara Walk Ten' }])], ['today', JSON.parse(NONE_JSON)]], withPkg), (x) => staged(x.d).length === 0 && x.d.tables['public.leads'].find((l) => l.id === 'l-tara').state === 'booked');
  await mut('9.10 M10 the silenced money act dropped from the note: after the date the attach lands and the advance is lost (reddens 2.7, 4.5)', WDf,
    [["        const rest = waiting.act && waiting.act.act === 'attach_package' ? silenced : [];", '        const rest = [];']], [],
    async (rq) => flow(rq, [['x', req([att('Tara Walk Ten', 'Walk P7 Album'), { act: 'advance_paid', client_as_spoken: 'Tara Walk Ten', date_as_spoken: 'today' }])], ['5 June 2027', JSON.parse(NONE_JSON)]]), (x) => x.out[1].keys === 'B27' && staged(x.d).length === 0);
  await mut('9.11 M11 a note kept when TWO date lines were spoken (reddens 2.8)', WDf,
    [['    if (st.dateAsks.length === 1) {', '    if (st.dateAsks.length >= 1) {']], [],
    async (rq) => flow(rq, [['x', req([lead('A B', '31 February 2027'), lead('C D', '31 February 2027')])]]), (x) => noteOf(x.d) !== undefined);
  await mut('9.12 M12 validNote without its guard throws on a hostile note (reddens 8.1)', WDf,
    [["    return { asked: n.asked, acts, tries, direction: directionOf(acts[0].act), lead_id: typeof n.lead_id === 'string' ? n.lead_id : null, package_id: typeof n.package_id === 'string' ? n.package_id : null };\n  } catch (_e) { return null; }", "    return { asked: n.asked, acts, tries, direction: directionOf(acts[0].act), lead_id: typeof n.lead_id === 'string' ? n.lead_id : null, package_id: typeof n.package_id === 'string' ? n.package_id : null };\n  } finally { /* guard removed */ }"]], [],
    async (rq) => { let t = 0; for (const a of HOSTILE) { try { rq(WDf).validNote(a); } catch (_e) { t += 1; } } return t; }, (t) => t > 0);
  // AN HONEST CONTROL: a note over an uncovered act is refused TWICE, by noteAct's own covered test and by allCovered inside validNote.
  // With noteAct's test ALONE removed the note is STILL refused. It must NOT redden.
  await mut('9.13 CONTROL: noteAct\'s covered test ALONE removed: a planted note over block_date is still refused, by allCovered', WDf,
    [["typeof a.act !== 'string' || !COVERED.includes(a.act)) return null;", "typeof a.act !== 'string') return null;"]], [],
    async (rq) => rq(WDf).validNote({ asked: 'B26', acts: [{ act: 'block_date', client_as_spoken: 'A' }] }), (v) => v === null);

  console.log(`\n════════  b95 · ${pass} pass · ${fail} fail  ════════`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`  · ${f}`)); }
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('b95 CRASHED:', (e && e.stack) || e); process.exit(2); });
