'use strict';
// scripts/b104_lcv12_calendar_bench.js · TDW CE-45 · LCV-12 · LC-Victor P7 CUT 2a: THE SLOTS, BLOCK, UNBLOCK, BOOK, NEEDS_CLIENT, F-44.128, F-44.63, F-44.109, on b103's harness verbatim (its
// makeDb, world, doubles and withMutated carried byte for byte; the PGRST116 double, C-44.3). b101's header follows for its conventions:
//   THE FIRST CUT: a message to a client routed from the door on the
// WhatsApp lane; phone_as_spoken (F-44.96); B37, B38 spoken and B39 carried; the composer on the listener's seat (R-45.1). Rung b101.
//
// EVERY CELL THAT CLAIMS A SENTENCE REPLAYS A RECORDED HEARING VERBATIM AND NAMES ITS RECORD AND ROW (C-44.12): the listening check of
// 22 September 2026 (LCT, sha256 311fda220b8f…, ten sentences × two seats × two variants), the re-hear of the same day (RHT, sha256
// 017999e53766…, one sentence × Haiku × twenty) and TDW_CE44_LCV9_PART1_WALK_RECORD.md turn 11. Every driver is the REAL preTurn,
// standIn and persistDoorTurn on b93's in-memory database with the REAL createLead, the REAL coupleDrafts store and the REAL relay seat's
// send leg (relayToCouple over a fake transport); only the two models are doubles. THE EXIT CODE IS THE VERDICT.
// Mutations are of PRODUCTION code, never of test setup; a mutation honestly labelled as not reddening is a control.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-lcv12-p7-2a.txt';
const RECORD = 'docs/handovers/TDW_CE44_LCV9_PART1_WALK_RECORD.md';
let pass = 0; let fail = 0; const failed = [];
function T(name, cond) { if (cond) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}`); } }
const sec = (t) => console.log(`\n§${t}`);
const quiet = async (fn) => { const w = console.warn; const e = console.error; const l = console.log; console.warn = () => {}; console.error = () => {}; console.log = () => {}; try { return await fn(); } finally { console.warn = w; console.error = e; console.log = l; } };
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const src = (rel) => fs.readFileSync(P(rel), 'utf8');
const J = (a) => (Array.isArray(a) ? a.join() : '');
const canon = (v) => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, k) => { o[k] = x[k]; return o; }, {}) : x));

const WDf = 'src/lib/vendor/workingDoor.js';
const LDf = 'src/lib/vendor/listenerDoor.js';
const DSf = 'src/lib/vendor/draftSeat.js';
const DLf = 'src/lib/vendor/doorLines.js';
const RSf = 'src/lib/vendor/relaySeat.js';
const VIf = 'src/lib/vendorInbound.js';
const WDP = P(WDf);

// ── THE RECORDS, VERBATIM (RAW as the ear returned it; never retyped from memory) ─────────────────────────────────────
// LCT = the listening check table, row #/seat/variant. RHT = the re-hear table, row #/variant (C2 only). WR11 = the walk record, turn 11.
const LCT = {
  '1/C1/asis': '{"route":"task","acts":[{"act":"relay","client_as_spoken":"","missing":["client","message content"]}]}',
  '1/C1/phone': '{"route":"task","acts":[{"act":"relay","client_as_spoken":"","milestone":"advance"}]}',
  '1/C2/asis': '{"route":"task","acts":[{"act":"relay"}]}',
  '2/C1/phone': '{"route":"task","acts":[{"act":"relay","client_as_spoken":"Priya","date_as_spoken":"the 22nd"}]}',
  '2/C2/asis': '{"route":"none","acts":[]}',
  '2/C2/phone': '{"route":"task","acts":[{"act":"relay","client_as_spoken":"Priya","date_as_spoken":"the 22nd"}]}',
  '4/C1/phone': '{"route":"task","acts":[{"act":"lead","client_as_spoken":"Asha Walk Fifteen","phone_as_spoken":"98765 43210"}]}',
  '4/C2/phone': '{"route":"task","acts":[{"act":"lead","client_as_spoken":"Asha Walk Fifteen","phone_as_spoken":"98765 43210"}]}',
  '4/C2/asis': '{"route":"task","acts":[{"act":"lead","client_as_spoken":"Asha Walk Fifteen"}]}',
  '5/C1/asis': '{"route":"task","acts":[{"act":"relay","client_as_spoken":"walk test"}]}',
  '7/C2/asis': '{"route":"task","acts":[{"act":"attach_package","client_as_spoken":"Asha Walk Fifteen","package_as_spoken":"Photographs and film"}]}',
};
const RHT = { '6/phone': '{"route":"task","acts":[{"act":"relay","client_as_spoken":"Priya","date_as_spoken":"22nd"}]}' };
const WR11_SAID = 'Send a message to walk test asking for the advance';
const WR11_JSON = '{"acts":[{"act":"relay","client_as_spoken":"walk test"}],"route":"task"}';
const S1 = 'Send a message to my client asking for the advance';
const S2 = "Tell Priya we're free on the 22nd";
const S4 = 'Add a new lead Asha Walk Fifteen, 98765 43210';
const S7 = 'Add Photographs and film to Asha Walk Fifteen';
const rec = (j) => JSON.parse(j);

const B3 = 'Okay. Nothing was changed.';
const B34 = 'I cannot do that by message yet. Use the app for it.';
const B35 = 'Which client? Say the name.';
const B14 = 'That request timed out. Nothing was changed. Say it again.';
const PHONE = '+919625759924'; // the test couple, the only bride a walk may message, stored as the seat records it (relaySeat.js:43)
const PHONE2 = '+919625759925'; // a second bench-only number for the record's own lead; no walk step messages it
const FROM = '+911111111111';
const ENV = { VENDOR_WHATSAPP_NUMBER: FROM };

// ── an in-memory database (b93's shape) ──────────────────────────────────────────────────────────────────────────
let clock = Date.parse('2026-09-21T05:00:00Z');
function makeDb(seed, opts = {}) {
  const tables = JSON.parse(JSON.stringify(seed || {}));
  const log = { inserts: [], updates: [] };
  let seq = 0;
  const builder = (schema, name) => {
    const full = `${schema}.${name}`;
    const f = []; let mode = 'select'; let payload = null; let limitN = null; let orderBy = null;
    const rows = () => (tables[full] || []);
    const run = () => {
      if (mode === 'insert') {
        if (opts.failInsert === full) return { data: null, error: { message: 'insert refused' } };
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
      like(k, pat) { const re = new RegExp(`^${String(pat).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*')}$`); f.push((r) => re.test(String(r[k] || ''))); return b; },
      gte() { return b; }, lte() { return b; }, gt() { return b; }, lt() { return b; }, or() { return b; }, ilike() { return b; },
      not() { return b; }, order(k, oo) { orderBy = { k, asc: !(oo && oo.ascending === false) }; return b; }, limit(n) { limitN = n; return b; },
      insert(p) { mode = 'insert'; payload = p; return b; }, update(p) { mode = 'update'; payload = p; return b; }, upsert(p) { mode = 'insert'; payload = p; return b; },
      then(res, rej) { return Promise.resolve().then(run).then(res, rej); },
      // C-44.3 (b102, the chair's law, found red at the base only after this line was fixed): PostgREST's maybeSingle over MORE THAN ONE row
      // returns NO data and an error (PGRST116), never the first row. b101's double returned the first row, which hid F-44.124 at the base.
      maybeSingle() { const r = run(); if (r.data && r.data.length > 1) return Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } }); return Promise.resolve({ data: r.data ? r.data[0] || null : null, error: r.error }); },
      single() { const r = run(); return Promise.resolve({ data: r.data ? r.data[0] || null : null, error: r.error || (r.data && r.data.length ? null : { message: 'no row' }) }); },
    };
    return b;
  };
  return { tables, log, from: (n) => builder('public', n), schema: (s) => ({ from: (n) => builder(s, n) }), rpc: async () => ({ data: null, error: null }) };
}

const V = { id: 'v-1', tier: 'signature', user_id: 'u-1', onboarding_state: 'complete', category: 'photographer', business_name: 'Walk Studio' };
const AG = 'ag-1';
const NOW = Date.parse('2026-09-21T06:00:00Z'); // 11:30 IST, 21 September 2026 (the door's nowMs; the store keeps its own clock, Date.now())
const ROUTE = { provider: 'anthropic', model: 'm-primary', listener_provider: 'deepseek', listener_model: 'm-listen' };
// public.leads, ALL 29 columns (docs/db/PUBLIC_SCHEMA.md :974; C-44.3)
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
// the bride's window: her couple_thread with an inbound an hour ago, derived from the clock the store reads (C-44.13: never a literal)
function world() {
  return {
    'public.admin_config': [],
    'public.leads': [
      leadRow({ id: 'l-asha', name: 'Asha Walk Fifteen', phone: PHONE, wedding_date: '2027-03-05', wedding_date_precision: 'day' }),
      leadRow({ id: 'l-walktest', name: 'Walk Test', phone: PHONE2 }), // one phone per lead, as createLead's dedupe keeps it
      leadRow({ id: 'l-nonum', name: 'Kiran Walk Fifteen', phone: null }),
    ],
    'public.vendor_packages': [pkgRow({ id: 'p-film', name: 'Photographs and film', total: 80000, delivery_basis: 'days', delivery_days: 30 })],
    'public.clients': [], 'public.lead_packages': [], 'public.invoices': [], 'public.pending_money_acts': [], 'public.payment_schedules': [],
    'public.pending_couple_drafts': [],
    'public.conversations': [
      { id: 'ct-1', vendor_id: V.id, counterparty_phone: PHONE, kind: 'couple_thread', state: 'active', last_message_at: new Date(Date.now() - 3600e3).toISOString() },
      { id: 'ct-2', vendor_id: V.id, counterparty_phone: PHONE2, kind: 'couple_thread', state: 'active', last_message_at: new Date(Date.now() - 3600e3).toISOString() },
    ],
    'public.messages': [
      { id: 'pm-in', conversation_id: 'ct-1', direction: 'inbound', channel: 'whatsapp', body: 'hi', created_at: new Date(Date.now() - 3600e3).toISOString() },
      { id: 'pm-in2', conversation_id: 'ct-2', direction: 'inbound', channel: 'whatsapp', body: 'hi', created_at: new Date(Date.now() - 3600e3).toISOString() },
    ],
    'engine.records': [],
    'engine.conversations': [{ id: 'c-1', agent_id: AG, state: 'active', last_active_at: '2026-09-21T05:00:00Z' }],
    'engine.messages': [],
    'public.events': [], 'public.team_members': [], 'public.crew_confirmations': [], 'public.vendors': [{ id: V.id, slot_capacity: null, category: 'photographer', business_name: 'Walk Studio' }], 'public.vendor_activity_log': [],
  };
}
const req = (acts, route = 'task') => ({ route, acts });
const earOf = (request) => async () => ({ content: [{ type: 'tool_use', name: 'ear_request', input: request }], usage: { input_tokens: 1400, output_tokens: 50 } });
const relay = (client, extra) => ({ act: 'relay', ...(client ? { client_as_spoken: client } : {}), ...(extra || {}) });
const money = (act, client) => ({ act, client_as_spoken: client });
const draftsIn = (d) => d.tables['public.pending_couple_drafts'];
const leadsIn = (d) => d.log.inserts.filter((i) => i.table === 'public.leads').flatMap((i) => i.rows);
const lastDoor = (d) => d.tables['engine.messages'].filter((m) => m.role === 'assistant').slice(-1)[0];
const noteOf = (d) => { const r = lastDoor(d); return r && r.meta && r.meta.listener ? r.meta.listener.note : undefined; };
const noteIn = (d) => noteOf(d) || { acts: [{}] }; // e-62: a missing note reads as a named FAIL, never a crash
const tc = (r) => (r && r.out && Array.isArray(r.out.toolCalls) ? r.out.toolCalls : []);
const tc0 = (r) => tc(r)[0] || { input: {} };
const d0 = (d) => draftsIn(d)[0] || {};
const BODY = 'Hi Asha, this is Walk Studio. Could you please send the advance for your wedding? Thank you.';

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
  try { v = await withMutated(rel, pairs, dependents, fn); ok = expect(v); } catch (e) { console.log(`        (${e.message})`); if (process.env.MUT_STACK) console.log(e.stack); ok = false; }
  T(name, ok);
}

async function main() {
  const WD = require(WDP);
  const DL = require(P(DLf));
  const LD = require(P(LDf));
  // e-62's guard: on the source BEFORE the cut draftSeat.js does not exist; the cells that read it FAIL by name and every later cell still lists.
  const DS = (() => { try { return require(P(DSf)); } catch (_e) { return { DRAFT_TOOL: { name: null, input_schema: { properties: {} } }, composerSeat: () => undefined }; } })();
  const srcOr = (rel) => { try { return src(rel); } catch (_e) { return ''; } };
  const RS = require(P(RSf));
  const LF = require(P('src/lib/laneFlags.js'));
  const meter = require(P('src/agent/harvest.js'))._meter;
  const memoryOf = (db) => ({
    getOrCreateConversation: async () => ({ conversationId: 'c-1', thread: [] }),
    saveMessage: async (cid, role, content, tc, meta) => { const id = `m-${db.tables['engine.messages'].length + 1}`; db.tables['engine.messages'].push({ id, conversation_id: cid, role, content, tool_calls: tc || null, meta: meta || null, created_at: new Date(clock += 1000).toISOString() }); return id; },
  });
  // the composer double: records every call (provider, model, tools) and answers the fixed body
  const composed = [];
  const composerOf = (body) => async (provider, params) => { composed.push({ provider, model: params.model, tools: (params.tools || []).map((t) => t.name), choice: params.tool_choice && params.tool_choice.name, user: params.messages && params.messages[0] && params.messages[0].content }); return { content: [{ type: 'tool_use', name: 'draft_message', input: { message: body } }], usage: { input_tokens: 300, output_tokens: 40 } }; };
  const sent = [];
  const transport = async (to, text, media, from) => { sent.push({ to, text, media, from }); return { sid: `wamid.${sent.length}`, sent: true }; };
  const turn = async (db, message, request, o = {}) => {
    const mod = o.M || WD;
    LF._resetLaneFlagCache();
    const out = await quiet(() => mod.preTurn({ supabase: db, vendor: V, agentId: AG, route: o.route || ROUTE, message, lane: o.lane || 'whatsapp' },
      { llmCreate: earOf(request), nowMs: NOW, composerCreate: o.composer || composerOf(BODY), sendWhatsApp: transport, env: ENV }));
    const said = out && out.door === true ? out : await quiet(() => mod.standIn({ supabase: db, out }, { nowMs: NOW }));
    await quiet(() => mod.persistDoorTurn({ supabase: db, agentId: AG, message, out: said, lane: o.lane || 'whatsapp' }, { memory: memoryOf(db), meter }));
    return { out, said, reply: said.reply, keys: J(said.keys) };
  };
  const showFrame = (...a) => (typeof DL.showFrame === 'function' ? DL.showFrame(...a) : null); // absent before the cut: every frame cell then FAILS by name
  const frame = (client, body, phone) => showFrame(body || BODY, client, phone || (client === 'Walk Test' ? PHONE2 : PHONE));
  const FRAME_ASHA = frame('Asha Walk Fifteen');
  const NONE = req([], 'none');
  // the ear double that answers a SEQUENCE of requests, one per call, and records every call's messages (so the thread's presence is witnessed)
  const calls = [];
  const earSeq = (...reqs) => async (provider, params) => { calls.push({ provider, model: params.model, user: params.messages && params.messages[0] && params.messages[0].content, tools: (params.tools || []).map((t) => t.name), choice: params.tool_choice && params.tool_choice.name, max_tokens: params.max_tokens, system: params.system }); const rq = reqs[Math.min(calls.length - 1, reqs.length - 1)]; if (rq === 'error') throw new Error('listener timed out after 4000 ms'); return { content: [{ type: 'tool_use', name: 'ear_request', input: rq }], usage: { input_tokens: 1400, output_tokens: 50 } }; };
  const turnSeq = async (db, message, reqs, o = {}) => {
    const mod = o.M || WD; calls.length = 0;
    LF._resetLaneFlagCache();
    const out = await quiet(() => mod.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message, lane: o.lane || 'whatsapp' },
      { llmCreate: earSeq(...reqs), nowMs: NOW, composerCreate: composerOf(BODY), sendWhatsApp: transport, env: ENV, ...(Number.isFinite(o.hearMs) ? { hearMs: o.hearMs } : {}) }));
    const said = out && out.door === true ? out : await quiet(() => mod.standIn({ supabase: db, out }, { nowMs: NOW }));
    await quiet(() => mod.persistDoorTurn({ supabase: db, agentId: AG, message, out: said, lane: o.lane || 'whatsapp' }, { memory: memoryOf(db), meter }));
    return { out, said, reply: said.reply, keys: J(said.keys), calls: calls.slice() };
  };

  // ── THE RECORD (C-44.12): the P7 listening table of 23 September 2026, scripts/out/p7_ear_check.csv, sha256 f563b33daa3705403153a8769c0baafafd29d2d380f6730483c2dfc1f82b168e,
  // 72 rows, and TDW_CE44_LCV9_PART1_WALK_RECORD.md turn 3. Each cell that claims a sentence replays the RAW return verbatim through the REAL normaliseRequest.
  const RAW = {
    '3/C1/asis': '{"route":"task","acts":[{"act":"block_date","date_as_spoken":"20 March","client_as_spoken":"","note":"personal"}]}',
    '3/C1/slots': '{"route":"task","acts":[{"act":"block_date","date_as_spoken":"20 March","reason_as_spoken":"personal","client_as_spoken":"","package_as_spoken":"","phone_as_spoken":"","milestone":"","member_as_spoken":"","kind_as_spoken":""}]}',
    '3/C2/slots': '{"route":"task","acts":[{"act":"block_date","date_as_spoken":"20 March","reason_as_spoken":"personal"}]}',
    '4/C2/asis': '{"route":"task","acts":[{"act":"block_date","date_as_spoken":"20 March"}]}',
    '5/C1/asis': '{"route":"task","acts":[{"act":"unblock_date","date_as_spoken":"20 March","client_as_spoken":""}]}',
    '2/C2/asis': '{"route":"task","acts":[{"act":"book_event","client_as_spoken":"Mehta","date_as_spoken":"8 January 2027"}]}',
    '2/C1/slots': '{"route":"task","acts":[{"act":"book_event","client_as_spoken":"Mehta","kind_as_spoken":"shoot","date_as_spoken":"8 January 2027"}]}',
    '10/C1/slots': '{"route":"task","acts":[{"act":"assign_crew","member_as_spoken":"Harsh","kind_as_spoken":"shoot","date_as_spoken":"14 February"}]}',
    '13/C1/asis': '{"route":"search","acts":[{"act":"lead","client_as_spoken":"","date_as_spoken":"","missing":[]}]}',
    '13/C2/asis': '{"route":"search","acts":[{"act":"find"}]}',
    'WR-turn3': '{"acts":[{"act":"block_date","missing":["year"],"date_as_spoken":"20 March","client_as_spoken":"personal"}],"route":"task"}',
  };
  const S = { 3: 'Block 20 March, personal', 4: 'Block 20 March', 5: 'Unblock 20 March', 2: 'Book the Mehta shoot on 8 January 2027', 13: 'Who are my new leads?' };
  const raw = (k) => JSON.parse(RAW[k]);                       // the raw tool input, as the model returned it
  const heard = (k) => LD.normaliseRequest(raw(k));           // through the REAL normaliseRequest, as production hears it
  const calWorld = () => { const w = world(); w['public.leads'] = [leadRow({ id: '11111111-1111-4111-8111-111111111111', name: 'Mehta', phone: PHONE, wedding_date: '2027-01-08', wedding_date_precision: 'day' }), leadRow({ id: 'l-sarah', name: 'Sarah', phone: PHONE2, state: 'booked' })]; return w; };
  const events = (d) => d.tables['public.events'];
  const blocks = (d) => events(d).filter((e) => e.kind === 'blocked' && !e.deleted_at);
  const shoots = (d) => events(d).filter((e) => e.kind !== 'blocked' && !e.deleted_at);
  const B34 = 'I cannot do that by message yet. Use the app for it.';
  const B35 = 'Which client? Say the name.';
  const turnC = async (db, message, request, o = {}) => turnSeq(db, message, [request], o);
  // turnSeq is b103's driver with a SEQUENCE ear; here every turn hears once. Deps for the writers ride o.deps through a wrapped module call below.
  const turnD = async (db, message, request, deps, o = {}) => {
    const mod = o.M || WD; calls.length = 0; LF._resetLaneFlagCache();
    const out = await quiet(() => mod.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message, lane: o.lane || 'whatsapp' }, { llmCreate: earSeq(request), nowMs: NOW, composerCreate: composerOf(BODY), sendWhatsApp: transport, env: ENV, ...(deps || {}) }));
    const said = out && out.door === true ? out : await quiet(() => mod.standIn({ supabase: db, out }, { nowMs: NOW }));
    await quiet(() => mod.persistDoorTurn({ supabase: db, agentId: AG, message, out: said, lane: o.lane || 'whatsapp' }, { memory: memoryOf(db), meter }));
    return { out, said, reply: said.reply, keys: J(said.keys) };
  };
  const tcOf = (r, name) => (r.out && Array.isArray(r.out.toolCalls) ? r.out.toolCalls.find((t) => t.name === name) : null) || {};
  const RIG_TOOL_SHA = '4a8cfbeb20de523240ec68012c4f383bec56282e515fed50f0df78ae85aecd6d'; // sha256(JSON.stringify(slotsTool())) of scripts/lib/p7_ear_check.js at 70fdeda, derived by rebuilding it from that tip

  sec('1 THE SLOTS, byte for byte the rig\'s (ruling 2)');
  T('1.1 EAR_TOOL is the rig\'s slots tool byte for byte (member_as_spoken, reason_as_spoken, kind_as_spoken last, payment_reminder in the act description)', sha(JSON.stringify(LD.EAR_TOOL)) === RIG_TOOL_SHA && /relay, quote_send, payment_reminder, find/.test(LD.EAR_TOOL.input_schema.properties.acts.items.properties.act.description) && Object.keys(LD.EAR_TOOL.input_schema.properties.acts.items.properties).slice(-3).join() === 'member_as_spoken,reason_as_spoken,kind_as_spoken');
  T('1.2 row 3 C1 slots AS RECORDED: normaliseRequest keeps reason_as_spoken "personal" and DROPS every empty string the seat leaked', canon(heard('3/C1/slots')) === canon({ route: 'task', acts: [{ act: 'block_date', date_as_spoken: '20 March', reason_as_spoken: 'personal' }] }));
  T('1.3 row 10 C1 slots AS RECORDED: member_as_spoken and kind_as_spoken kept', canon(heard('10/C1/slots').acts[0]) === canon({ act: 'assign_crew', member_as_spoken: 'Harsh', kind_as_spoken: 'shoot', date_as_spoken: '14 February' }));
  T('1.4 row 3 C1 asis AS RECORDED: the invented key "note" is dropped, so the reason is LOST without the slot (why the slot ships)', canon(heard('3/C1/asis')) === canon({ route: 'task', acts: [{ act: 'block_date', date_as_spoken: '20 March' }] }));
  T('1.5 SYSTEM unmoved (no prompt byte): sha as at 541f145', sha(LD.SYSTEM) === '90163dbe1889ee33f4b505b3b4e1aecfe1f853a2ee19376ebb894bb6aff75fb2');
  T('1.6 a note carries the three slots (NOTE_SLOTS)', (() => { const n = WD.validNote({ asked: 'B54', acts: [{ act: 'book_event', client_as_spoken: 'Mehta', kind_as_spoken: 'meeting', member_as_spoken: 'x', reason_as_spoken: 'y' }], tries: 0 }); return !!n && n.acts[0].kind_as_spoken === 'meeting' && n.acts[0].member_as_spoken === 'x' && n.acts[0].reason_as_spoken === 'y'; })());

  sec('2 NEEDS_CLIENT beside COVERED (ruling (g))');
  T('2.1 COVERED is ten; NEEDS_CLIENT names the acts that must name a client, and block_date and unblock_date are not among them', WD.COVERED.length === 12 /* RE-PINNED (CE-45 LCV-13, P7 2b, labelled): edit_event and cancel_event joined; b105 holds them */ && ['block_date', 'unblock_date', 'book_event'].every((a) => WD.COVERED.includes(a)) && !WD.NEEDS_CLIENT.includes('block_date') && !WD.NEEDS_CLIENT.includes('unblock_date') && WD.NEEDS_CLIENT.includes('book_event') && WD.NEEDS_CLIENT.includes('lead'));
  T('2.2 allCovered: a block with no client is covered; a book_event with no client is not', WD.allCovered(req([{ act: 'block_date', date_as_spoken: '20 March' }])) === true && WD.allCovered(req([{ act: 'book_event', date_as_spoken: '20 March' }])) === false);
  let db = makeDb(calWorld()); let r = await turnC(db, 'Book a shoot on 8 January 2027', req([{ act: 'book_event', date_as_spoken: '8 January 2027' }]));
  T('2.3 a nameless booking asks B35 with a name note; nothing written', r.keys === 'B35' && noteIn(db).asked === 'B35' && events(db).length === 0);
  r = await turnC(db, 'Mehta', req([{ act: 'find', client_as_spoken: 'Mehta' }], 'search'));
  T('2.4 her answer "Mehta" (heard as find on route search, F-44.117\'s class) fills the note and the shoot is booked: B46', r.keys === 'B46' && shoots(db).length === 1);

  sec('3 F-44.128: a request on route search is never a job');
  db = makeDb(calWorld()); r = await turnC(db, S[13], heard('13/C1/asis'));
  T('3.1 row 13 C1 asis AS RECORDED ("lead", no client, route search): B34 (exit lookup), NEVER B18, no note, nothing written', r.keys === 'B34' && r.out.why === 'lookup' && noteOf(db) === undefined && db.log.inserts.filter((i) => i.table === 'public.leads').length === 0);
  db = makeDb(calWorld()); r = await turnC(db, S[13], heard('13/C2/asis'));
  T('3.2 row 13 C2 asis AS RECORDED (find, route search): B34, exit lookup', r.keys === 'B34' && r.out.why === 'lookup');

  sec('4 BLOCK (blockDate as it stands; every read-back from the returned row)');
  db = makeDb(calWorld()); r = await turnC(db, S[3], heard('3/C2/slots'));
  T('4.1 row 3 C2 slots AS RECORDED: "Blocked: 20 March 2027 · personal." from the row; kind blocked, slot full_day, title and notes the reason', r.reply === 'Blocked: 20 March 2027 · personal.' && r.keys === 'B40' && blocks(db).length === 1 && blocks(db)[0].event_date === '2027-03-20' && blocks(db)[0].slot === 'full_day' && blocks(db)[0].notes === 'personal' && blocks(db)[0].title === 'personal' && tcOf(r, 'donna_block_date').result === 'blocked');
  r = await turnC(db, S[3], heard('3/C2/slots'));
  T('4.2 the same day again: B41 "20 March 2027 was already blocked. Nothing changed." on the writer\'s exact refusal; one block still', r.reply === '20 March 2027 was already blocked. Nothing changed.' && r.keys === 'B41' && blocks(db).length === 1 && tcOf(r, 'donna_block_date').result === 'refused:already_blocked');
  db = makeDb(calWorld()); r = await turnC(db, S[4], heard('4/C2/asis'));
  T('4.3 row 4 C2 asis AS RECORDED (no reason): B40\'s no-reason form "Blocked: 20 March 2027."; title Blocked, notes null', r.reply === 'Blocked: 20 March 2027.' && (blocks(db)[0] || {}).title === 'Blocked' && ((blocks(db)[0] || {}).notes == null)); // e-62: guarded reads at the base
  db = makeDb(calWorld()); r = await turnC(db, S[3], JSON.parse(RAW['WR-turn3']));
  T('4.4 LCV9 walk turn 3 AS RECORDED (the reason in client_as_spoken, no slot, no year): client_as_spoken IGNORED, the yearless day resolved future, B40 with no reason (the record held no reason slot)', r.reply === 'Blocked: 20 March 2027.' && blocks(db).length === 1);
  db = makeDb(calWorld()); db.tables['public.events'].push({ id: 'e-morning', vendor_id: V.id, title: 'Blocked', event_date: '2027-03-20', kind: 'blocked', slot: 'morning', state: 'upcoming', notes: null, deleted_at: null, assigned_member_ids: [] });
  r = await turnC(db, S[4], heard('4/C2/asis'));
  T('4.5 a full-day block over a held morning: B42 speaks findExistingBlock\'s OWN sentence verbatim (the writer\'s), nothing written', r.keys === 'B42' && /^Already blocked — the morning is held\. A full-day block can't sit over it; unblock it first\.$/.test(r.reply) && blocks(db).length === 1);
  db = makeDb(calWorld()); r = await turnD(db, S[4], heard('4/C2/asis'), { blockDate: async () => { throw new Error('boom'); } });
  T('4.6 the writer THROWS: B42 his :157 line with the date, recorded refused:exception, nothing written', r.reply === "Couldn't block 20 March 2027 — nothing was written. Try again or block it from the calendar." && r.keys === 'B42' && tcOf(r, 'donna_block_date').result === 'refused:exception' && blocks(db).length === 0);
  db = makeDb(calWorld()); r = await turnC(db, 'Block', req([{ act: 'block_date' }]));
  T('4.7 no date: B54 "Which day? Say it like 5 December." with a DATE note carrying the block', r.reply === 'Which day? Say it like 5 December.' && r.keys === 'B54' && noteIn(db).asked === 'B54' && noteIn(db).acts[0].act === 'block_date');
  r = await turnC(db, '20 March 2027', NONE);
  T('4.8 her answer "20 March 2027" (the ear heard none) runs the noted block: B40', r.reply === 'Blocked: 20 March 2027.' && blocks(db).length === 1);
  db = makeDb(calWorld()); r = await turnC(db, 'Block 5 match', req([{ act: 'block_date', date_as_spoken: '5 match' }]));
  T('4.9 an unreadable date: B7 (his), nothing written', r.keys === 'B7' && blocks(db).length === 0);

  sec('5 UNBLOCK (unblockDate as it stands)');
  db = makeDb(calWorld()); await turnC(db, S[4], heard('4/C2/asis')); r = await turnC(db, S[5], heard('5/C1/asis'));
  T('5.1 row 5 C1 asis AS RECORDED: "Unblocked: 20 March 2027. The day\'s back on your calendar."; the row soft-deleted (deleted_at set, never dropped)', r.reply === "Unblocked: 20 March 2027. The day's back on your calendar." && r.keys === 'B43' && blocks(db).length === 0 && events(db).length === 1 && !!events(db)[0].deleted_at);
  r = await turnC(db, S[5], heard('5/C1/asis'));
  T('5.2 no live block on the day: B44 "20 March 2027 wasn\'t blocked. Nothing changed." ONLY on the writer\'s exact "Block not found."; recorded not_blocked (F-44.65, F-44.72 close here)', r.reply === "20 March 2027 wasn't blocked. Nothing changed." && r.keys === 'B44' && tcOf(r, 'donna_unblock_date').result === 'not_blocked');
  db = makeDb(calWorld()); r = await turnD(db, S[5], heard('5/C1/asis'), { unblockDate: async () => { throw new Error('boom'); } });
  T('5.3 the writer THROWS: B45 his :167 line, refused:exception', r.keys === 'B45' && /^Couldn't unblock 20 March 2027/.test(r.reply) && tcOf(r, 'donna_unblock_date').result === 'refused:exception');
  db = makeDb(calWorld()); r = await turnD(db, S[5], heard('5/C1/asis'), { unblockDate: async () => ({ ok: false, error: 'Could not unblock.' }) });
  T('5.4 any OTHER refusal is never read as "wasn\'t blocked": B45', r.keys === 'B45');

  sec('6 BOOK (writeEvent as it stands)');
  db = makeDb(calWorld()); r = await turnC(db, S[2], heard('2/C2/asis'));
  T('6.1 row 2 C2 asis AS RECORDED: "Booked: Mehta · shoot · 8 January 2027." from the events row; kind shoot (the default), linked to the lead, state upcoming', r.reply === 'Booked: Mehta · shoot · 8 January 2027.' && r.keys === 'B46' && shoots(db).length === 1 && shoots(db)[0].kind === 'shoot' && shoots(db)[0].linked_lead_id === '11111111-1111-4111-8111-111111111111' && shoots(db)[0].state === 'upcoming' && tcOf(r, 'donna_book_event').result === 'booked');
  r = await turnC(db, S[2], heard('2/C2/asis'));
  T('6.2 the same shoot again: writeEvent dedupes onto the SAME row (one row still; findExistingEvent :214), B46 from that row; the writer re-patches it, so the call records booked (unchanged only when the writer says deduped)', r.keys === 'B46' && shoots(db).length === 1 && ['booked', 'unchanged'].includes(tcOf(r, 'donna_book_event').result));
  db = makeDb(calWorld()); r = await turnC(db, S[2], heard('2/C1/slots'));
  T('6.3 row 2 C1 slots AS RECORDED (kind_as_spoken shoot): the same line', r.reply === 'Booked: Mehta · shoot · 8 January 2027.');
  db = makeDb(calWorld()); r = await turnC(db, 'Book a meeting with Mehta on 8 January 2027', req([{ act: 'book_event', client_as_spoken: 'Mehta', date_as_spoken: '8 January 2027', kind_as_spoken: 'Meeting' }]));
  T('6.4 a kind the calendar knows (meeting) is written as said and the line places the row\'s own kind word (derived, disclosed): "Booked: Mehta · meeting · 8 January 2027."', r.reply === 'Booked: Mehta · meeting · 8 January 2027.' && (shoots(db)[0] || {}).kind === 'meeting');
  db = makeDb(calWorld()); r = await turnC(db, S[2], req([{ act: 'book_event', client_as_spoken: 'Mehta', date_as_spoken: '8 January 2027', kind_as_spoken: 'haldi' }]));
  T('6.5 a kind the calendar does not know (haldi) defaults to shoot (ruling 2)', (shoots(db)[0] || {}).kind === 'shoot');
  db = makeDb(calWorld()); r = await turnD(db, S[2], heard('2/C2/asis'), { writeEvent: async () => ({ ok: false, conflict: { kind: 'capacity', message: "You're already booked that day — Sarah, the whole day. Force it if you mean it." } }) });
  T('6.6 the checker refuses: B47 = conflict.message VERBATIM, nothing written', r.reply === "You're already booked that day — Sarah, the whole day. Force it if you mean it." && r.keys === 'B47' && shoots(db).length === 0 && tcOf(r, 'donna_book_event').result === 'refused:capacity');
  db = makeDb(calWorld()); r = await turnD(db, S[2], heard('2/C2/asis'), { writeEvent: async () => { throw new Error('boom'); } });
  T('6.7 the writer throws: B75 "Couldn\'t put that on the calendar — nothing was changed." (his, REUSED)', r.reply === "Couldn't put that on the calendar — nothing was changed." && r.keys === 'B75');
  db = makeDb(calWorld()); r = await turnC(db, 'Book the Verma shoot on 8 January 2027', req([{ act: 'book_event', client_as_spoken: 'Verma', date_as_spoken: '8 January 2027' }]));
  T('6.8 a name that is no lead of hers: B76 "No lead called Verma. Add the lead first." (his), exit book_no_lead, nothing written', r.reply === 'No lead called Verma. Add the lead first.' && r.keys === 'B76' && r.out.why === 'book_no_lead' && shoots(db).length === 0);
  db = makeDb(calWorld()); r = await turnC(db, 'Book the Metha shoot on 8 January 2027', req([{ act: 'book_event', client_as_spoken: 'Metha', date_as_spoken: '8 January 2027' }]));
  T('6.9 a near name: B36 "Did you mean Mehta? Reply YES or NO." offered, nothing written', r.reply === 'Did you mean Mehta? Reply YES or NO.' && shoots(db).length === 0);
  r = await turnC(db, 'Yes', NONE);
  T('6.10 her YES books it: B46', r.keys === 'B46' && shoots(db).length === 1);
  db = makeDb(calWorld()); r = await turnC(db, 'Book the Mehta shoot', req([{ act: 'book_event', client_as_spoken: 'Mehta' }]));
  T('6.11 no date: B54 with a DATE note carrying the booking and the ROW\'s name', r.keys === 'B54' && noteIn(db).asked === 'B54' && noteIn(db).acts[0].act === 'book_event' && noteIn(db).acts[0].client_as_spoken === 'Mehta');
  r = await turnC(db, '8 January 2027', NONE);
  T('6.12 her day books it: B46', r.keys === 'B46');
  db = makeDb(calWorld()); r = await turnC(db, 'Add a new lead Walk Seventeen Alpha, wedding on 8 January 2027 and book the shoot on 9 January 2027', req([{ act: 'lead', client_as_spoken: 'Walk Seventeen Alpha', date_as_spoken: '8 January 2027' }, { act: 'book_event', client_as_spoken: 'Walk Seventeen Alpha', date_as_spoken: '9 January 2027' }]));
  T('6.13 ORDER (ruling (b)): the lead is filed FIRST, then the shoot booked on the lead this message filed (a genuine second job, not an echo): B17 then B46', r.keys === 'B17,B46' && shoots(db).length === 1 && (shoots(db)[0] || {}).event_date === '2027-01-09');
  db = makeDb(calWorld()); r = await turnC(db, 'Block 20 March 2027 and book the Mehta shoot on 8 January 2027 and the booking is confirmed', req([{ act: 'block_date', date_as_spoken: '20 March 2027' }, { act: 'book_event', client_as_spoken: 'Mehta', date_as_spoken: '8 January 2027' }, { act: 'booking_confirmed', client_as_spoken: 'Mehta' }]));
  T('6.14 ORDER: the calendar runs BEFORE the one money act, which is only STAGED and asked (B5: Mehta has no package)', r.keys === 'B40,B46,B5' && blocks(db).length === 1 && shoots(db).length === 1 && db.tables['public.pending_money_acts'].length === 0);
  T('6.15 LEFTOVER: example 4 "Block 20 March, personal" is switched on by covering block_date', (() => { let seen = false; for (let i = 0; i < 400; i += 1) if (DL.leftover(WD.COVERED).includes('Block 20 March, personal')) seen = true; return seen; })());

  sec('7 F-44.63: the brief\'s dates in full month');
  const BR = require(P('src/agent/briefing.js'));
  const briefDb = () => { const d = makeDb(calWorld()); d.tables['public.conversations'].push({ id: 'vs-1', vendor_id: V.id, kind: 'vendor_self', state: 'active' }); d.tables['public.messages'].push({ id: 'vs-in', conversation_id: 'vs-1', direction: 'inbound', channel: 'whatsapp', body: 'hi', created_at: new Date(Date.now() - 600e3).toISOString() }); d.tables['public.events'].push({ id: 'e-w', vendor_id: V.id, title: 'Walk Seventeen Alpha', event_date: '2027-01-08', kind: 'shoot', state: 'upcoming', deleted_at: null }); d.tables['public.invoices'].push({ id: 'i-1', vendor_id: V.id, invoice_number: 'TDW/DEV440/24', client_name: 'Mehta', state: 'unpaid', due_date: '2025-02-01', amount_total: 120000, amount_paid: 20000, deleted_at: null }); return d; };
  // the fake's gt/lte/lt are pass-through, so every seeded row is "this week": the cell reads the LINES, not the window (b05_p4_crons keeps the window)
  const brief = await quiet(() => BR.buildBriefing({ vendor: V, user: { name: 'Dev' }, supabase: briefDb() }));
  T('7.1 the week\'s shoot and the overdue invoice render "8 January 2027" and "due 1 February 2025", never the ISO date', !!brief && brief.send === true && /Walk Seventeen Alpha \(8 January 2027\)/.test(brief.message) && /due 1 February 2025\)/.test(brief.message) && !/2027-01-08|2025-02-01/.test(brief.message));

  sec('8 F-44.109: the preview no longer asks her to reply "save all"');
  T('8.1 vendorInbound.js holds no "save all" sentence and the preview ends after its list', !/Reply "save all"/.test(src(VIf)) && /lines\.join\('\\n'\);\n\s+\/\/ F-44\.109/.test(src(VIf)));

  sec('9 MUTATIONS OF PRODUCTION CODE');
  await mut('9.1 MUTATION: normaliseRequest dropping reason_as_spoken reddens 1.2 and 4.1', LDf, [["      if (typeof a.reason_as_spoken === 'string' && a.reason_as_spoken.trim()) out.reason_as_spoken = a.reason_as_spoken.trim();\n", '']], [], async (rq) => canon(rq(LDf).normaliseRequest(raw('3/C1/slots')).acts[0]), (v) => !/reason_as_spoken/.test(v));
  await mut('9.2 MUTATION: ALREADY_BLOCKED read as a block landed reddens 4.2 (B40 twice)', WDf, [["if (r && r.code === 'ALREADY_BLOCKED' && r.error === 'Already blocked.') return", "if (false) return"]], [], async (rq) => { const d = makeDb(calWorld()); await turnC(d, S[4], heard('4/C2/asis'), { M: rq(WDf) }); const x = await turnC(d, S[4], heard('4/C2/asis'), { M: rq(WDf) }); return x.keys; }, (k) => k !== 'B41');
  await mut('9.3 MUTATION: "Block not found." read as unblocked reddens 5.2', WDf, [["if (r && r.error === 'Block not found.') return", "if (r && r.error === 'Block not found.') return { line: DL.render('B43', { date: day }), key: 'B43', call: { name: HANDS.unblock_date, input, result: 'unblocked' }, landed: true }; if (false) return"]], [], async (rq) => { const d = makeDb(calWorld()); const x = await turnC(d, S[5], heard('5/C1/asis'), { M: rq(WDf) }); return x.keys; }, (k) => k === 'B43');
  await mut('9.4 MUTATION: the route-search gate removed reddens 3.1: row 13 C1 asks B18 for a lookup', WDf, [["    if (heard && heard.route === 'search') return CHAIN(st.ear, 'lookup');\n", '']], [], async (rq) => { const d = makeDb(calWorld()); const x = await turnC(d, S[13], heard('13/C1/asis'), { M: rq(WDf) }); return x.keys; }, (k) => k === 'B18');
  await mut('9.5 MUTATION: B46 rendered from the plan, not the row, reddens 6.4 (the row\'s kind word lost)', WDf, [['      const line = bookedLine(r.event);', "      const line = bookedLine({ title: b.client, event_date: b.iso, kind: 'shoot' });"]], [], async (rq) => { const d = makeDb(calWorld()); const x = await turnC(d, 'Book a meeting with Mehta on 8 January 2027', req([{ act: 'book_event', client_as_spoken: 'Mehta', date_as_spoken: '8 January 2027', kind_as_spoken: 'meeting' }]), { M: rq(WDf) }); return x.reply; }, (v) => v === 'Booked: Mehta · shoot · 8 January 2027.');
  await mut('9.6 MUTATION: NEEDS_CLIENT ignored by allCovered reddens 2.2 (a block needs a client again)', WDf, [["(!NEEDS_CLIENT.includes(a.act) || (typeof a.client_as_spoken === 'string' && !!a.client_as_spoken.trim())));", "(typeof a.client_as_spoken === 'string' && !!a.client_as_spoken.trim()));"]], [], async (rq) => rq(WDf).allCovered(req([{ act: 'block_date', date_as_spoken: '20 March' }])), (v) => v === false);
  await mut('9.7 MUTATION: F-44.63\'s helper removed from the brief reddens 7.1 (the ISO date returns)', 'src/agent/briefing.js', [['`${s.title} (${longDateYear(s.event_date)})`', '`${s.title} (${s.event_date})`']], [], async (rq) => { const b = await quiet(() => rq('src/agent/briefing.js').buildBriefing({ vendor: V, user: { name: 'Dev' }, supabase: briefDb() })); return b.message; }, (m) => /2027-01-08/.test(m));
  await mut('9.8 MUTATION: the calendar written BEFORE the leads (order broken) reddens 6.13: the shoot for a lead filed this message reads B76', WDf, [['    for (const lp of leadPlans) {\n      if (lp.speak)', '    for (const lp of []) {\n      if (lp.speak)']], [], async (rq) => { const d = makeDb(calWorld()); const x = await turnC(d, 'Add a new lead Walk Seventeen Alpha, wedding on 8 January 2027 and book the shoot on 9 January 2027', req([{ act: 'lead', client_as_spoken: 'Walk Seventeen Alpha', date_as_spoken: '8 January 2027' }, { act: 'book_event', client_as_spoken: 'Walk Seventeen Alpha', date_as_spoken: '9 January 2027' }]), { M: rq(WDf) }); return x.keys; }, (k) => k !== 'B17,B46');

  sec('10 THE LAWS');
  const man = fs.existsSync(P(MAN)) ? src(MAN).split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#')) : [];
  T('10.1 W-1 NONE and the manifest names exactly this cut\'s paths', man.every((p) => !/^src\/engine\/|soul|lens|^db\/migrations\//.test(p)) && JSON.stringify(man.slice().sort()) === JSON.stringify([MAN, 'scripts/b104_lcv12_calendar_bench.js', WDf, LDf, DLf, 'src/agent/briefing.js', VIf, 'docs/handovers/TDW_CE45_LCV12_P7_2A_HANDOVER.md', 'scripts/b90_lcv_p5_bench.js', 'scripts/b92_lcv_p6a_bench.js', 'scripts/b93_lcv9_chain_out_bench.js', 'scripts/b94_lcv10_bench.js', 'scripts/b95_lcv10_note_bench.js', 'scripts/b97_lcv10_name_bench.js', 'scripts/b98_lcv10_package_bench.js', 'scripts/b99_lcv10_didyoumean_bench.js', 'scripts/b101_lcv11_relay_bench.js', 'scripts/b102_lcv11_fix1_bench.js', 'scripts/b103_lcv12_rehear_bench.js'].sort()));
  const ELEVEN = { B40: '1bec09f1e5d35c0c197a9229bba817744e1f995133bce2fcae722c5093e5eee3', B41: '6d882045d5fca760cce1f3dd1393bc6b6f3b23cea11f59a810dc910a51ea0b03', B42: 'a41ef8b9fe7281b7cd06c2ad7e99cac57ac6c6a5f85e611915b543560247b651', B43: 'b78f22148ed8f80aa71e2ba0e5311fb8f7d1d8798fd5b8631befb263924db0ad', B44: '2e8457a7173407d2b6166c895ad03188a19a174e3307a008e084996354ede0e5', B45: 'b4363bbbfc3f29c23b913cc26c88f1586c5a8b2b040e15da9b42cd00c8abcf6e', B46: 'e06955310af567757977dc641dd8231d410bc582014e0ea62d4cb67ffbd820f1', B54: 'fc952e30b355667df5891a96d09a99894f5f1100c026af515a41a5dbf69cc6ab', B75: '1d87cfb5ba7b1c70fd81fa3d0019f4acfe0bbdb7642a047802577ae9e182b209', B76: '24806f0f4b20434cfa74fab706e5d2c4be7f238202ecb483ae58c6daef31c0ab', B77: '756908b48584d5cfbedc716eb21307d3c7a50fd7d3ad3210677e6f3bfe8a3a6c' };
  T('10.2 LINES holds 52: the eleven of his, hash-carried, each byte its literal; B41 to B45 byte-identical to blockHands.js\'s six-line register words; B75 to calendarSignals.js :134', Object.keys(DL.LINES).length === 58 /* RE-PINNED (CE-45 LCV-13, P7 2b, labelled): B48 to B53 joined, his; b105 holds them */ && Object.keys(ELEVEN).every((k) => DL.LINE_HASHES[k] === ELEVEN[k] && sha(DL.LINES[k]) === ELEVEN[k]) && src('src/lib/vendor/blockHands.js').includes("was already blocked. Nothing changed.") && src('src/lib/vendor/calendarSignals.js').includes("Couldn't put that on the calendar — nothing was changed."));
  T('10.3 the money functions are untouched: planMoney, planPayment, planBooking, applyRow, reread as at 541f145', sha(src(WDf).slice(src(WDf).indexOf('async function planMoney'), src(WDf).indexOf('async function planInvoice'))) === '3e0abcc8a6f2fb0431a425a5e26336c80ead283d2f56d2b70cd927821d3ea530' && sha(src(WDf).slice(src(WDf).indexOf('async function applyRow'), src(WDf).indexOf('// The agent\'s current thread'))) === '8987e9f617aacdc6744d5ef590c5a6f44aebf2cc3d4c4f036e482fd6d2d1dfad');
  T('10.4 the writers are called AS THEY STAND: availability.js and eventWrite.js are not in the manifest', !man.includes('src/lib/vendor/availability.js') && !man.includes('src/lib/vendor/eventWrite.js'));

  sec('11 THE CARD, IN ITS EXACT WORDS (C-44.12, c-44.48): each step a cell named to its step, driven in the card\'s order on one estate');
  { const d = makeDb(calWorld()); let x;
    const blk = (date, reason) => req([{ act: 'block_date', date_as_spoken: date, ...(reason ? { reason_as_spoken: reason } : {}) }]);
    const unb = (date) => req([{ act: 'unblock_date', date_as_spoken: date }]);
    const bk = (client, date) => req([{ act: 'book_event', client_as_spoken: client, date_as_spoken: date, kind_as_spoken: 'shoot' }]);
    x = await turnC(d, 'Block 20 March 2027, personal', blk('20 March 2027', 'personal'));
    T('11.1 THE CARD, STEP 1: "Block 20 March 2027, personal" → "Blocked: 20 March 2027 · personal."', x.reply === 'Blocked: 20 March 2027 · personal.' && blocks(d).length === 1);
    x = await turnC(d, 'Block 20 March 2027', blk('20 March 2027'));
    T('11.2 THE CARD, STEP 2: "Block 20 March 2027" → "20 March 2027 was already blocked. Nothing changed."', x.reply === '20 March 2027 was already blocked. Nothing changed.' && blocks(d).length === 1);
    x = await turnC(d, 'Unblock 20 March 2027', unb('20 March 2027'));
    T('11.3 THE CARD, STEP 3: "Unblock 20 March 2027" → "Unblocked: 20 March 2027. The day\'s back on your calendar."', x.reply === "Unblocked: 20 March 2027. The day's back on your calendar." && blocks(d).length === 0);
    x = await turnC(d, 'Unblock 20 March 2027', unb('20 March 2027'));
    T('11.4 THE CARD, STEP 4: "Unblock 20 March 2027" → "20 March 2027 wasn\'t blocked. Nothing changed."', x.reply === "20 March 2027 wasn't blocked. Nothing changed.");
    x = await turnC(d, 'Add a new lead Walk Seventeen Alpha, wedding on 8 January 2027', req([{ act: 'lead', client_as_spoken: 'Walk Seventeen Alpha', date_as_spoken: '8 January 2027' }]));
    T('11.7 THE CARD, STEP 7: the lead filed → "Lead added: Walk Seventeen Alpha · 8 January 2027."', x.reply === 'Lead added: Walk Seventeen Alpha · 8 January 2027.');
    x = await turnC(d, 'Book the Walk Seventeen Alpha shoot on 8 January 2027', bk('Walk Seventeen Alpha', '8 January 2027'));
    T('11.8 THE CARD, STEP 8: "Book the Walk Seventeen Alpha shoot on 8 January 2027" → "Booked: Walk Seventeen Alpha · shoot · 8 January 2027."', x.reply === 'Booked: Walk Seventeen Alpha · shoot · 8 January 2027.' && shoots(d).length === 1);
    x = await turnC(d, 'Block 8 January 2027', blk('8 January 2027'));
    T('11.9 THE CARD, STEP 9: "Block 8 January 2027" beside the booked shoot → "Blocked: 8 January 2027." (a block lands beside a shoot; Q-S-4\'s shape)', x.reply === 'Blocked: 8 January 2027.' && blocks(d).length === 1 && shoots(d).length === 1);
    x = await turnC(d, 'Unblock 8 January 2027', unb('8 January 2027'));
    T('11.10 THE CARD, STEP 10: "Unblock 8 January 2027" → B43', x.reply === "Unblocked: 8 January 2027. The day's back on your calendar." && blocks(d).length === 0);
    x = await turnC(d, 'Book the Walk Seventeen Alpha shoot on 8 January 2027', bk('Walk Seventeen Alpha', '8 January 2027'));
    T('11.11 THE CARD, STEP 11: the same booking again → B46 again and ONE row on that day', x.keys === 'B46' && shoots(d).filter((e) => e.event_date === '2027-01-08').length === 1);
    x = await turnC(d, 'Block', req([{ act: 'block_date' }]));
    T('11.12a THE CARD, STEP 12: "Block" → "Which day? Say it like 5 December."', x.reply === 'Which day? Say it like 5 December.');
    x = await turnC(d, '20 March 2027', NONE);
    T('11.12b THE CARD, STEP 12: then "20 March 2027" → "Blocked: 20 March 2027."', x.reply === 'Blocked: 20 March 2027.');
    x = await turnC(d, 'Book the Walk Seventeen Zeta shoot on 9 January 2027', bk('Walk Seventeen Zeta', '9 January 2027'));
    T('11.13 THE CARD, STEP 13: "Book the Walk Seventeen Zeta shoot on 9 January 2027" → "No lead called Walk Seventeen Zeta. Add the lead first."', x.reply === 'No lead called Walk Seventeen Zeta. Add the lead first.' && shoots(d).filter((e) => e.event_date === '2027-01-09').length === 0);
    x = await turnC(d, 'Book the Walk Seventeen Alpa shoot on 9 January 2027', bk('Walk Seventeen Alpa', '9 January 2027'));
    T('11.14a THE CARD, STEP 14: "Book the Walk Seventeen Alpa shoot on 9 January 2027" → "Did you mean Walk Seventeen Alpha? Reply YES or NO."', x.reply === 'Did you mean Walk Seventeen Alpha? Reply YES or NO.');
    x = await turnC(d, 'Yes', NONE);
    T('11.14b THE CARD, STEP 14: "Yes" → "Booked: Walk Seventeen Alpha · shoot · 9 January 2027."', x.reply === 'Booked: Walk Seventeen Alpha · shoot · 9 January 2027.' && shoots(d).filter((e) => e.event_date === '2027-01-09').length === 1);
    x = await turnC(d, 'Block 5 match', blk('5 match'));
    T('11.16 THE CARD, STEP 16: "Block 5 match" → "I could not read that date. Say it like 5 December."', x.reply === 'I could not read that date. Say it like 5 December.');
    x = await turnC(d, 'Block 21 March 2027', blk('21 March 2027'), { lane: 'pwa' });
    T('11.17 THE CARD, STEP 17, on the app lane: "Block 21 March 2027" → "Blocked: 21 March 2027." (one door, both lanes)', x.reply === 'Blocked: 21 March 2027.' && blocks(d).some((e) => e.event_date === '2027-03-21'));
  }

  console.log(`\nb104_lcv12_calendar_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(`FAILED: ${failed.join(' · ')}`); process.exit(1); }
}
main().catch((e) => { console.log(`BENCH CRASHED: ${e && e.stack}`); process.exit(1); });
