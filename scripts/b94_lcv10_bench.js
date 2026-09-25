'use strict';
// scripts/b94_lcv10_bench.js · TDW CE-44 · LCV-10 · PART A: AN OVER-HEARD ACT NO LONGER REFUSES A COVERED JOB (F-44.110). Rung b94.
//
// WITNESSED, TDW_CE44_LCV9_PART1_WALK_RECORD.md §3 turn 8: the founder sent "Add a new lead Walk P8 Fresh, wedding on 20 February
// 2027"; the live listener returned `lead` AND `book_event`, both for Walk P8 Fresh on 20 February 2027; book_event is not covered,
// the message read MIXED, the door spoke B34 and THE LEAD WAS NOT FILED. The cure has two halves (the chair's ruling): the
// listener's prompt sentence, and THE MECHANISM, workingDoor.withoutEchoedEvents, because a prose instruction is not a mechanism.
//
// C-44.12 (the chair, standing, born of this finding): WHERE A WALK RECORD HOLDS WHAT THE LIVE LISTENER HEARD FOR A SENTENCE, THE
// CELL FOR THAT SENTENCE REPLAYS THAT HEARD REQUEST VERBATIM and says which record and turn it came from. TURN8 below is that
// record's bytes; 1.0 proves it by reading the record itself. Requests with no recorded hearing are labelled INVENTED.
//
//  §1 the helper alone: turn 8's exact heard request loses its book_event and nothing else; every genuine second job stays.
//  §2 the REAL preTurn and the REAL createLead: turn 8 as heard FILES THE LEAD (B17); what is RECORDED keeps both acts; every
//     genuine second job beside a lead is still uncovered and the stand-in still speaks B34, nothing filed.
//  §3 the stand-in reads the request as the door decided on it; the phone guard still stands over an echoed event.
//  §4 the listener's prompt byte: the accepted sentence, verbatim, the last sentence of SYSTEM, hash-pinned here.
//  §5 THE REAL WhatsApp lane (processVendorInbound), runTurn SPIED: turn 8 as heard files the lead, zero chain turns.
//  §6 EVERY SAY LINE ON PART A's WALK CARD, in ONE thread and one database, the door's own persisted rows between turns, the REAL
//     createLead, resolveLead and attachPackage: the covered job END TO END that Part One's walk could not show.
//  §7 W-1 NONE and the scope, from this packet's own manifest (C-44.7).
//  §8 fuzz in EVERY argument position, the request and its acts themselves hostile. Zero throws.
//  §9 mutations of production code, each reddening its cell; one honest CONTROL that must not redden alone. A missing anchor FAILS.
// THE EXIT CODE IS THE VERDICT.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-ce44-lcv10-parta.txt';
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

async function main() {
  const WD = require(WDP);
  const LD = require(P(LDf));
  const LH = require(P('src/lib/vendor/lifecycleHands.js'));
  const LF = require(LFP);
  const DL = require(P('src/lib/vendor/doorLines.js'));
  const meter = require(P('src/agent/harvest.js'))._meter;
  const memoryOf = (db) => ({
    getOrCreateConversation: async () => ({ conversationId: 'c-1', thread: [] }),
    saveMessage: async (cid, role, content, tc, meta) => { const id = `m-${db.tables['engine.messages'].length + 1}`; db.tables['engine.messages'].push({ id, conversation_id: cid, role, content, tool_calls: tc || null, meta: meta || null, created_at: new Date(clock += 1000).toISOString() }); return id; },
  });
  // One pwa turn as the lane runs it: the REAL preTurn, then the REAL standIn (the key absent: chain out), then the REAL persistDoorTurn.
  // The lanes themselves are NOT edited by this cut (b93 §5 and §6 hold them); §5 below still drives the real WhatsApp lane.
  const turn = async (db, message, request, lane, M) => {
    const mod = M || WD;
    LF._resetLaneFlagCache();
    const out = await quiet(() => mod.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message, lane: lane || 'pwa' }, { llmCreate: earOf(request), nowMs: NOW }));
    const said = out && out.door === true ? out : await quiet(() => mod.standIn({ supabase: db, out }, { nowMs: NOW }));
    await quiet(() => mod.persistDoorTurn({ supabase: db, agentId: AG, message, out: said, lane: lane || 'pwa' }, { memory: memoryOf(db), meter }));
    return { out, said };
  };

  // ─── §1 THE HELPER ALONE ───────────────────────────────────────────────────────────────────
  sec('1 withoutEchoedEvents: turn 8 exactly, and everything that is NOT an echo');
  const W = (r) => WD.withoutEchoedEvents(r, NOW);
  const acts = (r) => W(r).acts.map((a) => a.act).join();
  T(`1.0 C-44.12: TURN8 is byte for byte the HEARD line of ${RECORD} §3 turn 8, read from the record itself, under his exact sentence`, src(RECORD).includes(`HE: ${TURN8_SAID}\n`) && src(RECORD).includes(`    HEARD: ${TURN8_JSON}\n`));
  const t8 = turn8(); const t8Before = JSON.stringify(t8);
  const t8Out = W(t8);
  T('1.1 THE SPECIMEN FIRST: turn 8\'s exact heard request loses its book_event and keeps its lead, whole, the route untouched', JSON.stringify(t8Out) === '{"acts":[{"act":"lead","date_as_spoken":"20 February 2027","client_as_spoken":"Walk P8 Fresh"}],"route":"task"}');
  T('1.2 what was HEARD is never mutated: the request handed in still holds both acts, and a new object is returned', JSON.stringify(t8) === t8Before && t8Out !== t8 && t8.acts.length === 2);
  const plain = req([lead('Meera Walk Nine', '20 February 2027')]);
  T('1.3 nothing to drop returns THE SAME object', W(plain) === plain && W(req([])) !== null && acts(req([])) === '');
  T('1.4 ANOTHER CLIENT is a genuine second job: kept', acts(req([lead('Meera Walk Nine', '20 February 2027'), event('Kabir Walk Nine', '20 February 2027')])) === 'lead,book_event');
  T('1.5 ANOTHER DATE is a genuine second job: kept', acts(req([lead('Meera Walk Nine', '20 February 2027'), event('Meera Walk Nine', '21 February 2027')])) === 'lead,book_event');
  T('1.6 a DATELESS book_event is kept; so is one beside a DATELESS lead', acts(req([lead('Meera Walk Nine', '20 February 2027'), event('Meera Walk Nine')])) === 'lead,book_event' && acts(req([lead('Meera Walk Nine'), event('Meera Walk Nine', '20 February 2027')])) === 'lead,book_event');
  T('1.7 a book_event naming NO client is kept; so is one beside a NAMELESS lead', acts(req([lead('Meera Walk Nine', '20 February 2027'), event(null, '20 February 2027')])) === 'lead,book_event' && acts(req([{ act: 'lead', date_as_spoken: '20 February 2027' }, event('Meera Walk Nine', '20 February 2027')])) === 'lead,book_event');
  T('1.8 NO LEAD BESIDE IT: a book_event alone, or beside any other act, is kept', acts(req([event('Meera Walk Nine', '20 February 2027')])) === 'book_event' && acts(req([{ act: 'invoice', client_as_spoken: 'Meera Walk Nine', date_as_spoken: '20 February 2027' }, event('Meera Walk Nine', '20 February 2027')])) === 'invoice,book_event');
  T('1.9 ONLY book_event is ever dropped: a block_date, a note or an edit_event repeating the lead\'s client and date is kept', ['block_date', 'note', 'edit_event', 'date', 'assign_crew'].every((a) => acts(req([lead('Meera Walk Nine', '20 February 2027'), { act: a, client_as_spoken: 'Meera Walk Nine', date_as_spoken: '20 February 2027' }])) === `lead,${a}`));
  T('1.10 the client is compared under the door\'s key() fold (case and outer spaces), never fuzzily: one letter off is kept', acts(req([lead('Meera Walk Nine', '20 February 2027'), event('  meera walk NINE ', '20 February 2027')])) === 'lead' && acts(req([lead('Meera Walk Nine', '20 February 2027'), event('Meera Walk Nin', '20 February 2027')])) === 'lead,book_event');
  T('1.11 the SAME DAY said two ways is the same day: "20 Feb 2027", "20/2/2027", "20th of February 2027"', ['20 Feb 2027', '20/2/2027', '20th of February 2027', '2027-02-20'].every((d) => acts(req([lead('Meera Walk Nine', '20 February 2027'), event('Meera Walk Nine', d)])) === 'lead'));
  T('1.12 NEITHER date readable: the same words folded is an echo (the lead then answers B7 on its own); different words is kept', acts(req([lead('Meera Walk Nine', 'sometime in spring'), event('Meera Walk Nine', ' Sometime  in SPRING ')])) === 'lead' && acts(req([lead('Meera Walk Nine', 'sometime in spring'), event('Meera Walk Nine', 'around summer')])) === 'lead,book_event');
  T('1.13 ONE date readable and the other not is NOT an echo: kept', acts(req([lead('Meera Walk Nine', '20 February 2027'), event('Meera Walk Nine', 'the wedding day')])) === 'lead,book_event' && acts(req([lead('Meera Walk Nine', 'the wedding day'), event('Meera Walk Nine', '20 February 2027')])) === 'lead,book_event');
  T('1.14 two leads, each with its echo: both echoes dropped, both leads kept, the order she said them in kept', JSON.stringify(W(req([lead('Meera Walk Nine', '20 February 2027'), event('Meera Walk Nine', '20 February 2027'), lead('Kabir Walk Nine', '5 March 2027'), event('Kabir Walk Nine', '5 March 2027'), { act: 'invoice', client_as_spoken: 'Walk45' }])).acts.map((a) => `${a.act}:${a.client_as_spoken}`)) === '["lead:Meera Walk Nine","lead:Kabir Walk Nine","invoice:Walk45"]');
  T('1.15 a year left off both resolves to the same NEXT occurrence and is an echo; a year on one that differs from that occurrence is kept', acts(req([lead('Meera Walk Nine', '20 February'), event('Meera Walk Nine', '20 February')])) === 'lead' && acts(req([lead('Meera Walk Nine', '20 February'), event('Meera Walk Nine', '20 February 2028')])) === 'lead,book_event');

  // ─── §2 THE REAL preTurn ───────────────────────────────────────────────────────────────────
  sec('2 preTurn(), the REAL createLead: turn 8 as HEARD files the lead; every genuine second job is still B34');
  let db = makeDb(world());
  let r = await turn(db, TURN8_SAID, turn8());
  let filed = leadsIn(db);
  T(`2.1 THE SPECIMEN FIRST (${RECORD} §3 turn 8, his exact sentence, the exact heard request): the door takes the turn and THE LEAD IS FILED: "Lead added: Walk P8 Fresh · 20 February 2027."`, r.out.door === true && r.out.reply === 'Lead added: Walk P8 Fresh · 20 February 2027.' && J(r.out.keys) === 'B17' && filed.length === 1 && filed[0].name === 'Walk P8 Fresh' && filed[0].wedding_date === '2027-02-20' && filed[0].wedding_date_precision === 'day' && filed[0].source === 'self');
  T('2.2 WHAT IS RECORDED IS WHAT WAS HEARD: the verdict\'s ear, and meta.listener.request on the door\'s own row, still hold BOTH acts', isTurn8(r.out.ear.request) && (() => { const row = db.tables['engine.messages'].filter((m) => m.role === 'assistant').slice(-1)[0]; return !!row && row.meta.listener.door === true && isTurn8(row.meta.listener.request) && row.meta.listener.lane === 'pwa'; })());
  T('2.3 one hand ran, donna_lead, and nothing else was written: no event, no package, nothing staged', J(r.out.toolNames) === 'donna_lead' && ((r.out.toolCalls || [])[0] || {}).result === 'lead_created' && lpsIn(db).length === 0 && db.tables['public.pending_money_acts'].length === 0 && !db.log.inserts.some((i) => /events|calendar/.test(i.table)));
  // INVENTED requests (no walk record holds a hearing for these sentences): each a GENUINE second job beside a lead.
  const second = [
    ['another client', 'Add a new lead Meera Walk Nine, wedding on 20 February 2027, and book Kabir Walk Nine that day', [lead('Meera Walk Nine', '20 February 2027'), event('Kabir Walk Nine', '20 February 2027')]],
    ['another date', 'Add a new lead Meera Walk Nine, wedding on 20 February 2027, and book her shoot on 21 February 2027', [lead('Meera Walk Nine', '20 February 2027'), event('Meera Walk Nine', '21 February 2027')]],
    ['no date on the event', 'Add a new lead Meera Walk Nine, wedding on 20 February 2027, and book an event for her', [lead('Meera Walk Nine', '20 February 2027'), event('Meera Walk Nine')]],
    ['THE CARD\'S STEP: a blocked date beside a lead', 'Add a new lead Kabir Walk Nine and block 20 March', [lead('Kabir Walk Nine'), { act: 'block_date', date_as_spoken: '20 March' }]],
    ['a block_date repeating the lead\'s client and date', 'x', [lead('Meera Walk Nine', '20 February 2027'), { act: 'block_date', client_as_spoken: 'Meera Walk Nine', date_as_spoken: '20 February 2027' }]],
    ['an echo AND a genuine second job', 'x', [lead('Meera Walk Nine', '20 February 2027'), event('Meera Walk Nine', '20 February 2027'), { act: 'block_date', date_as_spoken: '20 March' }]],
  ];
  // RE-PINNED (CE-45 LCV-12, P7 cut 2a): block_date and book_event are the DOOR'S now, so a genuine second job is no longer B34: it RUNS beside the lead
  // (ruling (b)'s order: the lead first, then the calendar) or, for a booking naming a client that is no lead and not filed this message, the whole
  // message reads B76 (his) before any write. What 2.4 proves is unchanged: the second job is KEPT by withoutEchoedEvents (never dropped as an echo).
  const secondNow = { 'another client': { door: false, why: 'book_no_lead', keys: 'B76', leads: 0 }, 'another date': { door: true, keys: 'B17,B46', leads: 1 }, 'no date on the event': { door: true, keys: 'B17,B54', leads: 1 },
    'THE CARD\'S STEP: a blocked date beside a lead': { door: true, keys: 'B16,B40', leads: 1 }, 'a block_date repeating the lead\'s client and date': { door: true, keys: 'B17,B40', leads: 1 }, 'an echo AND a genuine second job': { door: true, keys: 'B17,B40', leads: 1 } };
  for (const [label, message, a] of second) {
    db = makeDb(world());
    r = await turn(db, message, req(a));
    const want = secondNow[label];
    console.log('        (2.4 ' + label + ': door=' + r.out.door + ' why=' + r.out.why + ' keys=' + J(r.said.keys) + ' leads=' + leadsIn(db).length + ')');
    T(`2.4 INVENTED, a genuine second job (${label}): KEPT beside the lead and, since P7 2a, run by the door (${want.keys}), never dropped as an echo`, r.out.door === want.door && (want.why ? r.out.why === want.why : true) && J(r.said.keys) === want.keys && leadsIn(db).length === want.leads);
  }
  db = makeDb(world());
  r = await turn(db, 'Book Meera Walk Nine on 20 February 2027', req([event('Meera Walk Nine', '20 February 2027')]));
  T('2.5 INVENTED: a book_event with NO lead beside it, for a name that is no lead of hers, reads B76 since P7 2a (his), nothing filed', r.out.door === false && r.out.why === 'book_no_lead' && J(r.said.keys) === 'B76' && leadsIn(db).length === 0);
  db = makeDb(world());
  r = await turn(db, 'Add a new lead Meera Walk Nine, wedding on 20 February 2027', req([lead('Meera Walk Nine', '20 February 2027')]));
  T('2.6 BESIDE the specimen, the tidier hearing (`lead` alone, as the morning of 21 September heard this shape, and as the new prompt sentence asks): filed the same', r.out.reply === 'Lead added: Meera Walk Nine · 20 February 2027.' && leadsIn(db).length === 1);
  db = makeDb(world());
  r = await turn(db, 'x', req([lead('Meera Walk Nine', '15 March 0227'), event('Meera Walk Nine', '15 March 0227')]));
  T('2.7 an echo of a date the door refuses: the echo is dropped (neither resolves, same words) and the lead answers its OWN byte, B21, not B34', r.out.door === true && J(r.out.keys) === 'B21' && leadsIn(db).length === 0);

  // ─── §3 THE STAND-IN AND THE PHONE GUARD ───────────────────────────────────────────────────
  sec('3 the stand-in reads the request as the door decided on it; the phone guard still stands');
  const mixedNameless = req([lead('Meera Walk Nine', '20 February 2027'), event('Meera Walk Nine', '20 February 2027'), { act: 'booking_confirmed' }]);
  db = makeDb(world());
  r = await turn(db, 'x', mixedNameless);
  // 3.1 RE-PINNED (CE-44 LCV-10 PART B-2, first cut; R-44.39): the covered act naming no client is now asked B35 by the DOOR, and the echo is still dropped on the way (the request read as covered, not B34). Nothing filed.
  T('3.1 INVENTED: an echo beside a covered act naming NO client: the echo is dropped, the request reads covered, and the door asks B35 (never B34); nothing filed', r.out.door === true && J(r.said.keys) === 'B35' && leadsIn(db).length === 0);
  T('3.2 standKey alone, turn 8 as heard under the reason `uncovered`: never B34 (every act left is covered and named)', WD.standKey({ door: false, why: 'uncovered', ear: { request: turn8() } }, { lifecycle: LH }, NOW).key === 'LEFTOVER' && WD.standKey({ door: false, why: 'uncovered', ear: { request: req([lead('A', '20 February 2027'), { act: 'note', client_as_spoken: 'B' }]) } }, { lifecycle: LH }, NOW).key === 'B34'); // P7 2a re-aim: the uncovered specimen is assign_crew (book_event is covered now) // RE-AIMED (CE-45 LCV-14, P7 cut 3, labelled): assign_crew is covered; the specimen is `note`
  db = makeDb(world());
  r = await turn(db, 'Add a new lead Meera Walk Nine 9876543210, wedding on 20 February 2027', req([lead('Meera Walk Nine', '20 February 2027'), event('Meera Walk Nine', '20 February 2027')]));
  // RE-PINNED (CE-45 LCV-11, P6b first cut; F-44.96 closed): the guard is gone. The drop still applies (one lead, the echoed event gone) and the lead
  // files with its date; the number reaches the row only through phone_as_spoken, which this hearing does not carry, so the row holds no phone.
  T('3.3 (re-pinned at P6b, F-44.96 both halves) an echoed event beside ONE phone-shaped number: the drop applies, the lead files WITH its date and WITH the number the door read itself', r.out.door === true && r.said.reply === 'Lead added: Meera Walk Nine · 20 February 2027.' && leadsIn(db).length === 1 && leadsIn(db)[0].phone === '+919876543210');

  // ─── §4 THE LISTENER'S PROMPT BYTE ─────────────────────────────────────────────────────────
  sec('4 listenerDoor.js: the accepted sentence, verbatim');
  T('4.1 SYSTEM holds the sentence the chair accepted as worded, ONCE, verbatim, and the sentence\'s own hash is the literal pinned here', LD.SYSTEM.split(SENTENCE).length === 2 && sha(SENTENCE) === 'b8879b14c41e4214f1b5e6337aafc1e7e7fe2a450bc331101ce15f65216ef3ed');
  const seenSys = [];
  await quiet(() => LD.hear({ supabase: makeDb(world()), route: ROUTE, message: TURN8_SAID, conversationId: 'c-1', excludeId: null }, { llmCreate: async (_p, params) => { seenSys.push(params); return { content: [{ type: 'tool_use', name: 'ear_request', input: turn8() }], usage: {} }; } }));
  T('4.2 it is SENT, not only written: the one call hear() makes carries it in `system`, beside the ear_request tool', seenSys.length === 1 && typeof seenSys[0].system === 'string' && seenSys[0].system.includes(SENTENCE) && seenSys[0].tools[0].name === 'ear_request');
  T('4.3 R-44.17 holds: no advice classification entered the prompt or the schema', !/advice/i.test(LD.SYSTEM) && !JSON.stringify(LD.EAR_TOOL).includes('advice'));
  T('4.4 c-44.44, for this act: every slot the drop reads is a slot the listener can fill, and book_event is an act it can name', ['client_as_spoken', 'date_as_spoken', 'act'].every((k) => k in LD.EAR_TOOL.input_schema.properties.acts.items.properties) && /\bbook_event\b/.test(LD.EAR_TOOL.input_schema.properties.acts.items.properties.act.description));
  T('4.5 normaliseRequest carries turn 8 through unchanged, so what the door drops from is what the ear returned', JSON.stringify(LD.normaliseRequest(turn8())) === JSON.stringify({ route: 'task', acts: turn8().acts.map((a) => ({ act: a.act, client_as_spoken: a.client_as_spoken, date_as_spoken: a.date_as_spoken })) }));

  // ─── §5 THE REAL WHATSAPP LANE ─────────────────────────────────────────────────────────────
  sec('5 the WhatsApp lane: the REAL processVendorInbound, the REAL preTurn, standIn and persistDoorTurn, runTurn SPIED');
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
      await quiet(() => lane.processVendorInbound({ phone: '+919888294440', body: o.message, profileName: 'Dev', messageSid: `wamid.b94.${Math.random()}`, internalReplay: false, trimmedBody: o.message.trim(), numMedia: 0, hasMedia: false, mediaUrl: null, rawPayload: {} }, deps));
      return { turns: turns.n, sent };
    } finally {
      if (savedWD) require.cache[WDP] = savedWD; else delete require.cache[WDP];
      if (savedVI) require.cache[VIP] = savedVI; else delete require.cache[VIP];
      LF._resetLaneFlagCache();
    }
  };
  const one = (w) => (w.turns === 0 && w.sent.length === 1 && Array.isArray(w.sent[0].media) && w.sent[0].media.length === 0 ? w.sent[0].text : `turns=${w.turns} sent=${w.sent.length}`);
  db = makeDb(world());
  let w = await driveWA({ db, message: TURN8_SAID, request: turn8() });
  T('5.1 turn 8 as HEARD, on the real WhatsApp lane: the chain is called ZERO times, ONE line is sent, it is B17, and the lead is filed with source whatsapp', one(w) === 'Lead added: Walk P8 Fresh · 20 February 2027.' && leadsIn(db).length === 1 && leadsIn(db)[0].source === 'whatsapp');
  T('5.2 persisted ONCE as a door turn on this lane, the heard request whole (both acts) in the door\'s own note', (() => { const rows = db.tables['engine.messages'].filter((m) => m.role === 'assistant'); return rows.length === 1 && rows[0].meta.listener.lane === 'whatsapp' && rows[0].meta.listener.door === true && isTurn8(rows[0].meta.listener.request); })());
  db = makeDb(world());
  w = await driveWA({ db, message: 'Add a new lead Kabir Walk Nine and block 20 March', request: req([lead('Kabir Walk Nine'), { act: 'block_date', date_as_spoken: '20 March' }]) });
  T('5.3 INVENTED: a genuine second job on the real lane RUNS since P7 2a: the lead filed and the day blocked, two lines, zero chain turns', one(w) === 'Lead added: Kabir Walk Nine.\n\nBlocked: 20 March 2027.' && leadsIn(db).length === 1);

  // ─── §6 THE CARD'S OWN WORDS ───────────────────────────────────────────────────────────────
  sec('6 every SAY line on Part A\'s walk card, in ONE thread and one database, the REAL createLead, resolveLead and attachPackage');
  {
    const d = makeDb(world());
    // Steps 1 to 3 in the app's business chat (lane pwa); step 4 on WhatsApp. No walk record holds a hearing for these fresh names yet, so
    // step 1 is driven TWICE in shape: here as turn 8 was HEARD (both acts, the name and date the card's), and 2.6 holds the tidier hearing.
    const s1 = await turn(d, 'Add a new lead Meera Walk Nine, wedding on 20 February 2027', req([lead('Meera Walk Nine', '20 February 2027'), event('Meera Walk Nine', '20 February 2027')]));
    T('6.1 SAY "Add a new lead Meera Walk Nine, wedding on 20 February 2027", heard in turn 8\'s SHAPE (lead AND book_event): "Lead added: Meera Walk Nine · 20 February 2027."', s1.said.reply === 'Lead added: Meera Walk Nine · 20 February 2027.' && s1.said.stood !== true);
    const s2 = await turn(d, 'Attach Photographs and film to Meera Walk Nine', req([{ act: 'attach_package', client_as_spoken: 'Meera Walk Nine', package_as_spoken: 'Photographs and film' }]));
    const lp = lpsIn(d);
    T('6.2 SAY "Attach Photographs and film to Meera Walk Nine" (heard in the shape of Part One\'s turn 10): "Package attached: Meera Walk Nine · Photographs and film · Rs 80,000.", on THE LEAD STEP 1 FILED, from the row', s2.said.reply === 'Package attached: Meera Walk Nine · Photographs and film · Rs 80,000.' && J(s2.said.keys) === 'B22' && lp.length === 1 && lp[0].lead_id === leadsIn(d)[0].id && lp[0].package_id === 'p-film' && Number(lp[0].total) === 80000);
    const before = leadsIn(d).length;
    const s3 = await turn(d, 'Add a new lead Kabir Walk Nine and block 20 March', req([lead('Kabir Walk Nine'), { act: 'block_date', date_as_spoken: '20 March' }]));
    // RE-PINNED (CE-45 LCV-12, P7 2a): block_date is the door's; the card's step now files the lead AND blocks the day (the same sentence LCV-10 Part B-1's walk turn 3 read B34 on).
    T('6.3 SAY "Add a new lead Kabir Walk Nine and block 20 March" (INVENTED hearing: lead AND block_date): "Lead added: Kabir Walk Nine." then "Blocked: 20 March 2027." (P7 2a), Kabir Walk Nine filed', s3.said.reply === 'Lead added: Kabir Walk Nine.\n\nBlocked: 20 March 2027.' && leadsIn(d).length === before + 1);
    const w4 = await driveWA({ db: d, message: 'Add a new lead Kabir Walk Nine, wedding on 5 March 2027', request: req([lead('Kabir Walk Nine', '5 March 2027'), event('Kabir Walk Nine', '5 March 2027')]) });
    T('6.4 ON WHATSAPP, SAY "Add a new lead Kabir Walk Nine, wedding on 5 March 2027", heard in turn 8\'s shape: "Lead added: Kabir Walk Nine · 5 March 2027.", the chain never called', one(w4) === 'Lead added: Kabir Walk Nine · 5 March 2027.' && leadsIn(d).length === before + 2 && leadsIn(d).slice(-1)[0].source === 'whatsapp'); // P7 2a: 6.3 filed one before this
    const rows = d.tables['engine.messages'];
    const door = rows.filter((m) => m.role === 'assistant');
    T('6.5 the thread holds the card: four of his messages, four door rows, every one answered by code, lanes pwa, pwa, pwa, whatsapp, each from the door\'s own note', rows.filter((m) => m.role === 'user').length === 4 && door.length === 4 && door.every((m) => m.meta.listener.door === true) && door.map((m) => m.meta.listener.lane).join() === 'pwa,pwa,pwa,whatsapp');
    T('6.6 the estate after the card: two leads filed (Meera Walk Nine, Kabir Walk Nine), ONE package attached, nothing staged, no invoice', leadsIn(d).map((l) => l.name).join() === 'Meera Walk Nine,Kabir Walk Nine,Kabir Walk Nine' && lpsIn(d).length === 1 /* P7 2a: 6.3 files a dateless Kabir and 6.4 a dated one (the double has no dedupe); the card's estate is three leads */ && d.tables['public.pending_money_acts'].length === 0 && d.tables['public.invoices'].length === 0);
  }

  // ─── §7 W-1 AND THE SCOPE ──────────────────────────────────────────────────────────────────
  sec('7 W-1 NONE, read from Part A\'s own manifest');
  const man = fs.existsSync(P(MAN)) ? src(MAN).split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#')) : [];
  T('7.1 W-1 NONE: no path under src/engine, no soul, lens or prompt file, no migration', man.length > 0 && man.every((p) => !/^src\/engine\/|soul|lens|^db\/migrations\//.test(p)));
  T('7.2 the manifest names exactly the six paths this packet touches (C-44.7: its own committed manifest)', JSON.stringify(man.slice().sort()) === JSON.stringify([
    'docs/handovers/TDW_CE44_LCV10_PARTA_HANDOVER.md', MAN, 'scripts/b93_lcv9_chain_out_bench.js', 'scripts/b94_lcv10_bench.js', LDf, WDf].sort()));
  const wdS = src(WDf).replace(/^\s*\/\/.*$/gm, ''); // comments stripped: code alone is counted
  // 7.3 RE-PINNED (CE-44 LCV-10 PART B-1): same two places, same order; the first line's bytes changed as M1's note says.
  T('7.3 the drop is applied in exactly TWO places, preTurn before the covered check and standKeyOf (the phone guard\'s line is gone since P6b)', (wdS.match(/withoutEchoedEvents\(/g) || []).length === 3 && wdS.indexOf('    heard = withoutEchoedEvents(relayRecipient(st.ear.request), nowMs);') > 0 /* RE-ANCHORED (CE-45 LCV-15, LSP_3b, labelled): F-44.152's relayRecipient runs first on the same line; the drop's two places unchanged */ && wdS.indexOf('    heard = withoutEchoedEvents(st.ear.request, nowMs);') < wdS.indexOf("if (!allCovered(heard)) return CHAIN(st.ear, 'uncovered');")); // RE-PINNED (CE-45 LCV-11, P6b): the phone guard's line LEFT the door (F-44.96 closed); the clause that pinned its bytes is dropped, the drop's two places still pinned
  // RE-PINNED (CE-45 LCV-11, P6b): COVERED is seven (relay); this packet's own manifest still holds no doorLines.js; book_event is still never covered.
  T('7.4 no byte a vendor reads was added BY THIS PACKET: doorLines.js is not in its manifest; COVERED is the six of 627323b plus relay (P6b); book_event never', !man.includes('src/lib/vendor/doorLines.js') && WD.COVERED.join() === 'booking_confirmed,advance_paid,milestone_paid,invoice,lead,attach_package,relay,quote_send,block_date,unblock_date,book_event,edit_event,cancel_event,assign_crew,payment_reminder' && WD.COVERED.includes('book_event')); // RE-PINNED (CE-45 LCV-14, P7 cut 3, labelled): assign_crew, payment_reminder joined; b106 holds them // RE-PINNED (CE-45 LCV-13, P7 2b, labelled): edit_event, cancel_event joined; b105 holds them // RE-PINNED (CE-45 LCV-12, P7 2a): book_event, block_date, unblock_date joined; b104 holds them  // LABELED AMENDMENT · CE-45 ELZ-1 cut 2b: quote_send joined COVERED (fifteen kinds)

  // ─── §8 FUZZ ───────────────────────────────────────────────────────────────────────────────
  sec('8 fuzz: every argument position, the request and its acts themselves hostile');
  const boom = () => { throw new Error('hostile'); };
  const trap = new Proxy({}, { get: boom, has: boom, ownKeys: boom, getOwnPropertyDescriptor: boom });
  const getter = (k) => { const o = {}; Object.defineProperty(o, k, { get: boom, enumerable: true }); return o; };
  const HOSTILE = [undefined, null, 0, -1, NaN, Infinity, '', '   ', 'x', true, false, [], {}, () => {}, Symbol('s'), 10n, new Date(NaN), trap, getter('acts'), getter('act'), getter('client_as_spoken'), getter('date_as_spoken'),
    { acts: null }, { acts: 'lead' }, { acts: [null, undefined, 7, 'x', [], trap, getter('act'), getter('client_as_spoken'), getter('date_as_spoken')] },
    { acts: [{ act: 'lead', client_as_spoken: 'A', date_as_spoken: '20 February 2027' }, getter('act'), trap] },
    { acts: [{ act: 'lead', client_as_spoken: 'A', date_as_spoken: '20 February 2027' }, { act: 'book_event', client_as_spoken: { toString: boom }, date_as_spoken: '20 February 2027' }] },
    { acts: [{ act: 'lead', client_as_spoken: 'A', date_as_spoken: '20 February 2027' }, { act: 'book_event', client_as_spoken: 'A', date_as_spoken: 7 }] },
    Object.freeze({ acts: Object.freeze([Object.freeze({ act: 'lead', client_as_spoken: 'A', date_as_spoken: 'x' }), Object.freeze({ act: 'book_event', client_as_spoken: 'A', date_as_spoken: 'x' })]) })];
  let throws = 0; let calls = 0; let sameBack = true;
  for (const a of HOSTILE) for (const b of HOSTILE) {
    calls += 3;
    try { const out = WD.withoutEchoedEvents(a, b); if (!(a && typeof a === 'object' && Array.isArray((() => { try { return a.acts; } catch (_e) { return null; } })())) && out !== a && !(Number.isNaN(a) && Number.isNaN(out))) sameBack = false; } catch (_e) { throws += 1; }
    try { if (typeof WD.sameSpokenDay(a, b, NOW) !== 'boolean') throws += 1; } catch (_e) { throws += 1; }
    try { if (typeof WD.sameSpokenDay('20 February 2027', a, b) !== 'boolean') throws += 1; } catch (_e) { throws += 1; }
  }
  T(`8.1 withoutEchoedEvents and sameSpokenDay: ${calls} hostile calls, every position, ZERO throws; a request that is not a request comes back AS IT CAME`, throws === 0 && sameBack);
  let t2 = 0; let c2 = 0;
  for (const a of HOSTILE) for (const b of HOSTILE) {
    c2 += 2;
    try { const k = WD.standKey({ door: false, why: 'uncovered', ear: { request: a } }, { lifecycle: LH }, b); if (!k || typeof k.key !== 'string') t2 += 1; } catch (_e) { t2 += 1; }
    try { const k = WD.standKey(a, b, a); if (!k || typeof k.key !== 'string') t2 += 1; } catch (_e) { t2 += 1; }
  }
  T(`8.2 standKey with its new third argument: ${c2} hostile calls, the verdict, the hands and the clock all hostile, ZERO throws and always a key`, t2 === 0);
  let t3 = 0; let c3 = 0;
  for (const a of HOSTILE) {
    c3 += 1;
    try { const o = await quiet(() => WD.preTurn({ supabase: makeDb(world()), vendor: V, agentId: AG, route: ROUTE, message: 'x', lane: 'pwa' }, { llmCreate: async () => ({ content: [{ type: 'tool_use', name: 'ear_request', input: a }], usage: {} }), nowMs: NOW })); if (!o || typeof o.door !== 'boolean') t3 += 1; } catch (_e) { t3 += 1; }
  }
  T(`8.3 preTurn with the EAR'S OWN RETURN hostile (${c3} shapes through the real normaliseRequest): ZERO throws, always a verdict`, t3 === 0);

  // ─── §9 MUTATIONS ──────────────────────────────────────────────────────────────────────────
  sec('9 mutations of production code, each reddening its cell');
  const driveM = async (rq, message, request) => { const d = makeDb(world()); const M = rq(WDf); LF._resetLaneFlagCache(); const out = await quiet(() => M.preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message, lane: 'pwa' }, { llmCreate: earOf(request), nowMs: NOW })); const said = out && out.door === true ? out : await quiet(() => M.standIn({ supabase: d, out }, { nowMs: NOW })); return { out, said, leads: leadsIn(d) }; };
  await mut('9.1 M1 THE DROP REMOVED from preTurn: turn 8 as heard reads B34 again and the lead is NOT filed, 21 September\'s walk exactly (reddens 2.1, 5.1, 6.1; and b93 11.6)', WDf,
    // ANCHOR RE-AIMED (CE-44 LCV-10 PART B-1): the line lost its `const` when the door's note gained a second source for `heard`; what it proves is unchanged.
    // ANCHOR RE-AIMED AGAIN (CE-45 LCV-15, LSP_3b, labelled): F-44.152's relayRecipient now wraps the request on this line; M1 still removes the drop alone.
    [['    heard = withoutEchoedEvents(relayRecipient(st.ear.request), nowMs);', '    heard = relayRecipient(st.ear.request);']], [],
    async (rq) => driveM(rq, TURN8_SAID, turn8()), (x) => x.out.door === true && J(x.said.keys) === 'B17,B46' && x.leads.length === 1); // RE-PINNED (CE-45 LCV-12, P7 2a): with book_event covered, the undropped echo is BOOKED beside the lead (a second write for one job), which 2.1 forbids (B17 alone)
  await mut('9.2 M2 the drop no longer comparing the CLIENT: another couple\'s event on the same day is swallowed and the message reads covered (reddens 1.4 and 2.4)', WDf,
    [['leads.some((l) => key(l.client_as_spoken) === key(a.client_as_spoken) && sameSpokenDay(', 'leads.some((l) => sameSpokenDay(']], [],
    async (rq) => driveM(rq, 'x', req([lead('Meera Walk Nine', '20 February 2027'), event('Kabir Walk Nine', '20 February 2027')])), (x) => x.out.door === true && x.leads.length === 1);
  await mut('9.3 M3 the drop no longer comparing the DATE: an event for her on another day is swallowed (reddens 1.5 and 2.4)', WDf,
    [[' && sameSpokenDay(l.date_as_spoken, a.date_as_spoken, nowMs));', ');']], [],
    async (rq) => driveM(rq, 'x', req([lead('Meera Walk Nine', '20 February 2027'), event('Meera Walk Nine', '21 February 2027')])), (x) => x.out.door === true && x.leads.length === 1);
  await mut('9.4 M4 one date readable and the other not read as the same day (reddens 1.13)', WDf,
    [["    if (!da.ok && !db.ok) return foldSpoken(a) === foldSpoken(b);\n    return false;\n", "    if (!da.ok && !db.ok) return foldSpoken(a) === foldSpoken(b);\n    return true;\n"]], [],
    async (rq) => rq(WDf).withoutEchoedEvents(req([lead('Meera Walk Nine', '20 February 2027'), event('Meera Walk Nine', 'the wedding day')]), NOW).acts.length, (n) => n === 1);
  await mut('9.5 M5 any act but a lead dropped, not book_event alone: a blocked date is swallowed (reddens 1.9 and 2.4)', WDf,
    [["typeof a === 'object' && a.act === 'book_event' && !!spokenText(a.client_as_spoken)", "typeof a === 'object' && a.act !== 'lead' && !!spokenText(a.client_as_spoken)"]], [],
    async (rq) => driveM(rq, 'x', req([lead('Meera Walk Nine', '20 February 2027'), { act: 'block_date', client_as_spoken: 'Meera Walk Nine', date_as_spoken: '20 February 2027' }])), (x) => x.out.door === true && x.leads.length === 1);
  await mut('9.6 M6 the helper MUTATING what was heard: the record loses the act the listener returned (reddens 1.2 and 2.2)', WDf,
    [['    return acts.length === request.acts.length ? request : { ...request, acts };', '    request.acts = acts; return request;']], [],
    async (rq) => { const x = await driveM(rq, TURN8_SAID, turn8()); return x.out.ear.request.acts.length; }, (n) => n === 1);
  // P7 2a: M7 is a CONTROL now, labelled: with book_event covered, the undropped turn 8 request is all covered either way, so the stand-in reads LEFTOVER on both sides and this mutation reddens nothing here; b93 3.5 keeps the echo's own pin.
  await mut('9.7 M7 CONTROL (P7 2a, does not redden): the stand-in reading the raw request still reads LEFTOVER for turn 8, both acts being covered now', WDf,
    [["typeof out.ear.request === 'object' ? withoutEchoedEvents(out.ear.request, nowMs) : null;", "typeof out.ear.request === 'object' ? out.ear.request : null;"]], [],
    async (rq) => rq(WDf).standKey({ door: false, why: 'uncovered', ear: { request: turn8() } }, { lifecycle: LH }, NOW).key, (k) => k === 'LEFTOVER');
  await mut('9.8 M8 withoutEchoedEvents without its guard throws on a hostile request (reddens 8.1)', WDf,
    [['    return acts.length === request.acts.length ? request : { ...request, acts };\n  } catch (_e) { return request; }', '    return acts.length === request.acts.length ? request : { ...request, acts };\n  } finally { /* guard removed */ }']], [],
    async (rq) => { let t = 0; for (const a of HOSTILE) { try { rq(WDf).withoutEchoedEvents(a, NOW); } catch (_e) { t += 1; } } return t; }, (t) => t > 0);
  await mut('9.9 M9 the prompt sentence removed: the listener is no longer told the date belongs to the lead (reddens 4.1)', LDf,
    [[`  'A wedding date said with a new lead belongs to that lead: put it in the lead\\'s date and record no book_event for it.',\n`, '']], [],
    async (rq) => rq(LDf).SYSTEM, (s) => !s.includes('belongs to that lead'));
  // AN HONEST CONTROL (b92 N15a's kind): the dateless guard is held TWICE, by the echoed() test and by sameSpokenDay's own answer for
  // a missing date. With echoed()'s date test ALONE removed a dateless book_event is STILL kept. It must NOT redden; 9.4 holds the other guard.
  await mut('9.10 CONTROL: echoed()\'s own date test ALONE removed: a dateless book_event is still kept, because sameSpokenDay refuses one date against none', WDf,
    [[" && !!spokenText(a.client_as_spoken) && !!spokenText(a.date_as_spoken)\n", " && !!spokenText(a.client_as_spoken)\n"]], [],
    async (rq) => rq(WDf).withoutEchoedEvents(req([lead('Meera Walk Nine', '20 February 2027'), event('Meera Walk Nine')]), NOW).acts.length, (n) => n === 2);

  console.log(`\n════════  b94 · ${pass} pass · ${fail} fail  ════════`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`  · ${f}`)); }
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('b94 CRASHED:', (e && e.stack) || e); process.exit(2); });
