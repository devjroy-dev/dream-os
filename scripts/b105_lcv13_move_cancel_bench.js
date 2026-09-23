'use strict';
// scripts/b105_lcv13_move_cancel_bench.js · TDW CE-45 · LCV-13 · LC-Victor P7 CUT 2b: MOVE AND CANCEL A SHOOT (asked YES or NO), CAL_ASKS and SHOOT_ASKS, the shoot resolver, B48 to B53 and B76, THE DAY-SHEET RELOCATION (daySheet.js readDaySpine), on b104's harness verbatim (lines 3 to 275 of b104 carried byte for byte; the PGRST116 double, C-44.3). b104's own header follows:
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
const MAN = 'scripts/floor-manifest-lcv13-p7-2b.txt';
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

  // ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
  // b105 BEGINS HERE. THE RECORD (C-44.12): the P7 listening table of 23 September 2026, scripts/out/p7_ear_check.csv, sha256
  // f563b33daa3705403153a8769c0baafafd29d2d380f6730483c2dfc1f82b168e (verified by the seat before any cell replays it), rows 6, 7, 8, 9: the move and
  // cancel sentences on both seats, RAW as the model returned them, replayed through the REAL normaliseRequest.
  const RAW2B = {
    '6/C1/asis': '{"route":"task","acts":[{"act":"edit_event","client_as_spoken":"Verma","date_as_spoken":"22 November"}]}',
    '6/C1/slots': '{"route":"task","acts":[{"act":"edit_event","client_as_spoken":"Verma","kind_as_spoken":"shoot","date_as_spoken":"22 November"}]}',
    '6/C2/asis': '{"route":"task","acts":[{"act":"edit_event","client_as_spoken":"Verma","date_as_spoken":"22 November"}]}',
    '7/C1/asis': '{"route":"task","acts":[{"act":"edit_event","client_as_spoken":"Verma","date_as_spoken":"20 November to 22 November"}]}',
    '7/C2/asis': '{"route":"task","acts":[{"act":"edit_event","client_as_spoken":"Verma","date_as_spoken":"22 November"}]}',
    '8/C2/asis': '{"route":"task","acts":[{"act":"cancel_event","client_as_spoken":"Rao","date_as_spoken":"3 January"}]}',
    '8/C1/slots': '{"route":"task","acts":[{"act":"cancel_event","client_as_spoken":"Rao","date_as_spoken":"3 January","kind_as_spoken":"shoot"}]}',
    '9/C2/asis': '{"route":"task","acts":[{"act":"cancel_event","client_as_spoken":"Rao"}]}',
  };
  const S2B = { 6: 'Move the Verma shoot to 22 November', 7: 'Move the Verma shoot from 20 November to 22 November', 8: 'Cancel the Rao shoot on 3 January', 9: 'Cancel the Rao shoot' };
  const heard2 = (k) => LD.normaliseRequest(JSON.parse(RAW2B[k]));
  const ALPHA = '27978acb-0000-4000-8000-000000000001'; // the 2a walk's linked_lead_id prefix (§8.2), a bench id
  const VERMA = '11111111-2222-4333-8444-555555555555'; const RAO = '11111111-2222-4333-8444-666666666666';
  // public.events, ALL 18 columns (docs/db/PUBLIC_SCHEMA.md :716; C-44.3)
  let evSeq = 0;
  const evRow = (o) => Object.assign({ id: `e0000000-0000-4000-8000-${String(++evSeq).padStart(12, '0')}`, vendor_id: V.id, title: null, event_date: null, event_time: null, kind: 'shoot',
    linked_lead_id: null, state: 'upcoming', notes: null, created_at: '2026-09-22T21:12:27Z', updated_at: '2026-09-22T21:12:27Z', couple_id: null, deleted_at: null,
    linked_binder_id: null, slot: 'full_day', ready_by: null, assigned_member_ids: [], assigned_circle_member_id: null }, o);
  // THE ESTATE 2a's WALK LEFT (K6; TDW_CE45_LCV12_P7_2A_HANDOVER.md §8.2): Walk Seventeen Alpha, wedding 8 January 2027, with TWO live shoots, 8 and 9 January 2027
  const estate = () => {
    const w = world();
    w['public.leads'] = [
      leadRow({ id: ALPHA, name: 'Walk Seventeen Alpha', wedding_date: '2027-01-08', wedding_date_precision: 'day' }),
      leadRow({ id: VERMA, name: 'Verma', wedding_date: '2026-11-20', wedding_date_precision: 'day' }),
      leadRow({ id: RAO, name: 'Rao', wedding_date: '2027-01-03', wedding_date_precision: 'day' }),
      leadRow({ id: 'l-sarah', name: 'Sarah', phone: PHONE2, state: 'booked' }),
      leadRow({ id: 'l-noshoot', name: 'Meera Walk Nine' }),
    ];
    w['public.events'] = [
      evRow({ id: 'e-alpha-8', title: 'Walk Seventeen Alpha', event_date: '2027-01-08', linked_lead_id: ALPHA }),
      evRow({ id: 'e-alpha-9', title: 'Walk Seventeen Alpha', event_date: '2027-01-09', linked_lead_id: ALPHA, created_at: '2026-09-22T21:14:19Z' }),
      evRow({ id: 'e-verma', title: 'Verma', event_date: '2026-11-20', linked_lead_id: VERMA }),
      evRow({ id: 'e-rao', title: 'Rao', event_date: '2027-01-03', linked_lead_id: null }), // linked by title alone: the resolver's second arm
      evRow({ id: 'e-rao-old', title: 'Rao', event_date: '2027-02-10', state: 'cancelled', linked_lead_id: RAO }), // a cancelled shoot is never a candidate
    ];
    w['public.hot_dates'] = [];
    return w;
  };
  const ev = (d, id) => d.tables['public.events'].find((e) => e.id === id) || {};
  const writesOf = (d) => [...d.log.inserts, ...d.log.updates].filter((w) => /^public\./.test(w.table) && w.table !== 'public.vendor_activity_log').length; // the estate's own rows; the thread, the meter and the writer's ledger are not calendar writes
  const lead = (d, id) => d.tables['public.leads'].find((l) => l.id === id) || {};
  const mv = (client, date) => req([{ act: 'edit_event', ...(client ? { client_as_spoken: client } : {}), ...(date ? { date_as_spoken: date } : {}) }]);
  const cx = (client, date) => req([{ act: 'cancel_event', ...(client ? { client_as_spoken: client } : {}), ...(date ? { date_as_spoken: date } : {}) }]);
  const B48 = (c, dt) => `Move ${c}'s shoot to ${dt}? Reply YES or NO.`;
  const B50 = (c, dt) => `Cancel ${c}'s shoot on ${dt}? Reply YES or NO.`;
  const B53A = 'Two shoots for Walk Seventeen Alpha: 8 January 2027 · 9 January 2027. Say the date.';
  const B7 = 'I could not read that date. Say it like 5 December.';
  let x; let d;

  sec('1 THE CALENDAR NOTES (CAL_ASKS, SHOOT_ASKS; the chair\'s K4)');
  T('1.1 CAL_ASKS is B48 and B50; SHOOT_ASKS is B53 alone; B53 is NOT a date note (K4); both join ASKS', J(WD.CAL_ASKS) === 'B48,B50' && J(WD.SHOOT_ASKS) === 'B53' && !WD.DATE_ASKS.includes('B53'));
  T('1.2 COVERED gains edit_event and cancel_event, each recorded under its signal\'s own name', WD.COVERED.includes('edit_event') && WD.COVERED.includes('cancel_event') && WD.HANDS.edit_event === 'donna_edit_event' && WD.HANDS.cancel_event === 'donna_cancel_event');
  const good48 = { asked: 'B48', acts: [{ act: 'edit_event', client_as_spoken: 'Verma', date_as_spoken: '22 November' }], tries: 0, event_id: 'e-verma', iso: '2026-11-22' };
  T('1.3 validNote admits a B48 note and carries its shoot and its new day', (() => { const n = WD.validNote(good48); return !!n && n.event_id === 'e-verma' && n.iso === '2026-11-22'; })());
  T('1.4 validNote refuses a B48 note with no shoot, a move with no new day, a cancel under B48, and two acts', WD.validNote({ ...good48, event_id: undefined }) === null && WD.validNote({ ...good48, acts: [{ act: 'edit_event', client_as_spoken: 'Verma' }] }) === null
    && WD.validNote({ ...good48, acts: [{ act: 'cancel_event', client_as_spoken: 'Verma' }] }) === null && WD.validNote({ ...good48, acts: [good48.acts[0], { act: 'lead', client_as_spoken: 'x' }] }) === null);
  T('1.5 validNote admits a B53 note over two candidates and refuses one candidate', !!WD.validNote({ asked: 'B53', acts: [{ act: 'cancel_event', client_as_spoken: 'Rao' }], tries: 0, event_ids: ['a', 'b'] }) && WD.validNote({ asked: 'B53', acts: [{ act: 'cancel_event', client_as_spoken: 'Rao' }], tries: 0, event_ids: ['a'] }) === null);
  T('1.6 TOTAL: hostile notes are null and never throw', (() => { try { return [null, 7, 'x', [], { asked: 'B48' }, { asked: 'B53', acts: 'x' }, { asked: 'B48', acts: [null], event_id: 1 }, { asked: 'B53', acts: [{ act: 'edit_event', client_as_spoken: 'X', date_as_spoken: 'y' }], event_ids: [1, 2] }].every((n) => WD.validNote(n) === null); } catch (_e) { return false; } })());
  T('1.7 B53 renders by position: exactly two is his byte verbatim; three carry the count as a numeral and extend by " · " (R-45.9, derived); one is null', typeof DL.shootsLine === 'function' && DL.shootsLine('Rao', ['3 January 2027', '4 January 2027']) === 'Two shoots for Rao: 3 January 2027 · 4 January 2027. Say the date.' && DL.shootsLine('Rao', ['a', 'b', 'c']) === '3 shoots for Rao: a · b · c. Say the date.' && DL.shootsLine('Rao', ['a', 'b', 'c', 'd']) === '4 shoots for Rao: a · b · c · d. Say the date.' && DL.shootsLine('Rao', ['a']) === null);

  sec('2 MOVE, asked YES or NO (the records\' rows 6 and 7; ruling 3)');
  d = makeDb(estate());
  x = await turnC(d, S2B[6], heard2('6/C2/asis'));
  T('2.1 row 6 C2 asis AS RECORDED: "Move the Verma shoot to 22 November" asks B48 with the NEW day, and NOTHING is written', x.reply === B48('Verma', '22 November 2026') && writesOf(d) === 0 && noteIn(d).asked === 'B48' && noteIn(d).event_id === 'e-verma');
  x = await turnC(d, 'No', NONE);
  T('2.2 her NO → B3, nothing moved', x.reply === B3 && ev(d, 'e-verma').event_date === '2026-11-20' && writesOf(d) === 0);
  x = await turnC(d, S2B[6], heard2('6/C1/slots'));
  T('2.3 row 6 C1 slots AS RECORDED: the same question', x.reply === B48('Verma', '22 November 2026'));
  x = await turnC(d, 'Yes', NONE);
  const logged = d.tables['public.vendor_activity_log'].slice(-1)[0] || {};
  T('2.4 her YES → B49 from the RETURNED row; the shoot moved; the lead\'s wedding date UNTOUCHED (ruling 3); recorded donna_edit_event moved; the writer\'s ledger says "via chat" (K8)',
    x.reply === 'Moved: Verma · shoot · 22 November 2026.' && ev(d, 'e-verma').event_date === '2026-11-22' && lead(d, VERMA).wedding_date === '2026-11-20' && tcOf(x, 'donna_edit_event').result === 'moved' && /via chat/.test(String(logged.summary || '')));
  d = makeDb(estate());
  x = await turnC(d, S2B[7], heard2('7/C1/asis'));
  T('2.5 row 7 C1 asis AS RECORDED ("20 November to 22 November" in the one slot): unreadable to the door\'s own read → B7, nothing written, the old day never read', x.reply === B7 && writesOf(d) === 0);
  x = await turnC(d, S2B[7], heard2('7/C2/asis'));
  T('2.6 row 7 C2 asis AS RECORDED: the ONE slot is the NEW day → B48 for 22 November', x.reply === B48('Verma', '22 November 2026'));
  d = makeDb(estate());
  x = await turnC(d, 'Move the Meera Walk Nine shoot to 5 May 2027', mv('Meera Walk Nine', '5 May 2027'));
  T('2.7 a lead with no shoot → B52 "No shoot for Meera Walk Nine on the calendar."', x.reply === 'No shoot for Meera Walk Nine on the calendar.' && writesOf(d) === 0);
  x = await turnC(d, 'Move the Walk Seventeen Alpha shoot to 22 November 2027', mv('Walk Seventeen Alpha', '22 November 2027'));
  T('2.8 two shoots → B53 with both rows\' days, a SHOOT note holding both ids and the NEW day untouched', x.reply === B53A && noteIn(d).asked === 'B53' && J(noteIn(d).event_ids) === 'e-alpha-8,e-alpha-9' && noteIn(d).acts[0].date_as_spoken === '22 November 2027');
  x = await turnC(d, '8 January 2027', NONE);
  T('2.9 K4, THE CATCH: her "8 January 2027" PICKS the shoot and NEVER becomes the destination → B48 for 22 November 2027 on the 8 January row', x.reply === B48('Walk Seventeen Alpha', '22 November 2027') && noteIn(d).event_id === 'e-alpha-8' && noteIn(d).iso === '2027-11-22');
  x = await turnC(d, 'Yes', NONE);
  T('2.10 her YES moves the 8 January shoot to 22 November 2027; the 9 January shoot and the wedding date unmoved', x.reply === 'Moved: Walk Seventeen Alpha · shoot · 22 November 2027.' && ev(d, 'e-alpha-8').event_date === '2027-11-22' && ev(d, 'e-alpha-9').event_date === '2027-01-09' && lead(d, ALPHA).wedding_date === '2027-01-08');
  d = makeDb(estate());
  await turnC(d, 'Move the Walk Seventeen Alpha shoot to 22 November 2027', mv('Walk Seventeen Alpha', '22 November 2027'));
  x = await turnC(d, '8 jnuary', NONE);
  const t11 = x.reply === B7 && noteIn(d).asked === 'B53' && noteIn(d).tries === 1;
  x = await turnC(d, '8 jnuary', NONE);
  T('2.11 an unreadable answer to B53 → B7 once (the note kept, tries 1), then B3', t11 && x.reply === B3 && writesOf(d) === 0);
  d = makeDb(estate());
  await turnC(d, 'Move the Walk Seventeen Alpha shoot to 22 November 2027', mv('Walk Seventeen Alpha', '22 November 2027'));
  x = await turnC(d, '10 January 2027', req([{ act: 'find', date_as_spoken: '10 January 2027' }], 'search'));
  const t12 = x.reply === B53A && noteIn(d).tries === 1;
  x = await turnC(d, '10 January 2027', NONE);
  T('2.12 a readable day naming no candidate (heard as a lookup, F-44.117\'s class: her answer, not a new job) → B53 once, then B3', t12 && x.reply === B3 && writesOf(d) === 0);
  d = makeDb(estate());
  d.tables['public.events'].push(evRow({ id: 'e-block', title: 'Blocked', kind: 'blocked', event_date: '2026-11-25', linked_lead_id: null }));
  await turnC(d, 'Move the Verma shoot to 25 November', mv('Verma', '25 November'));
  x = await turnC(d, 'Yes', NONE);
  T('2.13 a move onto a BLOCKED day: her YES → the checker\'s own sentence VERBATIM (B47), nothing moved', x.keys === 'B47' && /block/i.test(x.reply) && ev(d, 'e-verma').event_date === '2026-11-20');
  d = makeDb(estate());
  await turnC(d, S2B[6], heard2('6/C2/asis'));
  x = await turnD(d, 'Yes', NONE, { writeEvent: async () => ({ ok: false, error: 'db down' }) });
  const t14 = x.reply === "Couldn't put that on the calendar — nothing was changed." && tcOf(x, 'donna_edit_event').result === 'refused:write_failed';
  d = makeDb(estate());
  await turnC(d, S2B[6], heard2('6/C2/asis'));
  x = await turnD(d, 'Yes', NONE, { writeEvent: async () => { throw new Error('boom'); } });
  T('2.14 a refusal with no sentence, or a throw, → B75 (his), recorded; nothing claimed', t14 && x.reply === "Couldn't put that on the calendar — nothing was changed." && tcOf(x, 'donna_edit_event').result === 'refused:exception');
  d = makeDb(estate());
  await turnC(d, S2B[6], heard2('6/C2/asis'));
  d.tables['public.events'].find((e) => e.id === 'e-verma').deleted_at = '2026-09-21T06:00:00Z';
  x = await turnC(d, 'Yes', NONE);
  T('2.15 the shoot deleted between the question and her YES → B75 (the writer\'s "Event not found."), nothing claimed', x.reply === "Couldn't put that on the calendar — nothing was changed.");
  d = makeDb(estate());
  x = await turnC(d, 'Move the Walk Seventeen Zeta shoot to 1 June 2027', mv('Walk Seventeen Zeta', '1 June 2027'));
  T('2.16 a name that is no lead → B76 "No lead called Walk Seventeen Zeta. Add the lead first." (his one line), nothing written', x.reply === 'No lead called Walk Seventeen Zeta. Add the lead first.' && writesOf(d) === 0);
  x = await turnC(d, 'Move the Walk Seventeen Alpa shoot to 22 November 2027', mv('Walk Seventeen Alpa', '22 November 2027'));
  const t17 = x.reply === 'Did you mean Walk Seventeen Alpha? Reply YES or NO.';
  x = await turnC(d, 'Yes', NONE);
  T('2.17 a near name → the ONE home\'s B36; her YES → B53 (two shoots), never a write', t17 && x.reply === B53A && writesOf(d) === 0);
  d = makeDb(estate());
  x = await turnC(d, 'Move the shoot to 22 November', mv(null, '22 November'));
  const t18 = x.reply === B35;
  x = await turnC(d, 'Verma', NONE);
  T('2.18 a nameless move → B35; her name → B48', t18 && x.reply === B48('Verma', '22 November 2026'));
  d = makeDb(estate());
  x = await turnC(d, 'Move the Verma shoot', mv('Verma'));
  const t19 = x.reply === 'Which day? Say it like 5 December.' && noteIn(d).asked === 'B54';
  x = await turnC(d, '22 November 2027', NONE);
  T('2.19 a move with no new day → B54 with a DATE note; her day → B48 for that day', t19 && x.reply === B48('Verma', '22 November 2027'));
  d = makeDb(estate());
  x = await turnC(d, 'Block 20 March 2027 and move the Verma shoot to 22 November', req([{ act: 'block_date', date_as_spoken: '20 March 2027' }, { act: 'edit_event', client_as_spoken: 'Verma', date_as_spoken: '22 November' }]));
  T('2.20 a move beside another act → B34 (one question at a time), NOTHING written, not even the block', x.reply === B34 && writesOf(d) === 0);
  d = makeDb(estate());
  await turnC(d, S2B[6], heard2('6/C2/asis'));
  x = await turnC(d, 'Block 20 March 2027', req([{ act: 'block_date', date_as_spoken: '20 March 2027' }]));
  T('2.21 another act heard after B48 LAPSES the note (F-44.115): the block runs fresh, the shoot is not moved', x.reply === 'Blocked: 20 March 2027.' && ev(d, 'e-verma').event_date === '2026-11-20');
  d = makeDb(estate());
  await turnC(d, S2B[6], heard2('6/C2/asis'));
  x = await turnC(d, 'hmm', NONE);
  const t22 = x.reply === B48('Verma', '22 November 2026') && noteIn(d).tries === 1;
  x = await turnC(d, 'hmm', NONE);
  T('2.22 nothing heard after B48 re-asks ONCE, then B3; nothing moved', t22 && x.reply === B3 && ev(d, 'e-verma').event_date === '2026-11-20');

  d = makeDb(estate());
  d.tables['public.events'].push(evRow({ id: 'e-alpha-11', title: 'Walk Seventeen Alpha', event_date: '2027-11-22', linked_lead_id: ALPHA }));
  x = await turnC(d, 'Move the Walk Seventeen Alpha shoot to 5 May 2027', mv('Walk Seventeen Alpha', '5 May 2027'));
  const t23 = x.reply === '3 shoots for Walk Seventeen Alpha: 8 January 2027 · 9 January 2027 · 22 November 2027. Say the date.' && J(noteIn(d).event_ids) === 'e-alpha-8,e-alpha-9,e-alpha-11';
  x = await turnC(d, '22 November 2027', NONE);
  T('2.23 R-45.9, THE THREE-ROW PLANT: three shoots → "3 shoots for Walk Seventeen Alpha: 8 January 2027 · 9 January 2027 · 22 November 2027. Say the date."; her day picks the row → B48 for 5 May 2027', t23 && x.reply === B48('Walk Seventeen Alpha', '5 May 2027') && noteIn(d).event_id === 'e-alpha-11');

  sec('3 CANCEL, asked YES or NO (the records\' rows 8 and 9)');
  d = makeDb(estate());
  x = await turnC(d, S2B[8], heard2('8/C2/asis'));
  T('3.1 row 8 C2 asis AS RECORDED: B50 with the ROW\'s day (the title-linked Rao shoot; the cancelled one never a candidate)', x.reply === B50('Rao', '3 January 2027') && noteIn(d).event_id === 'e-rao' && writesOf(d) === 0);
  x = await turnC(d, 'Yes', NONE);
  T('3.2 her YES → B51 from the RETURNED row; the row cancelled, never deleted', x.reply === 'Cancelled: Rao · shoot · 3 January 2027.' && ev(d, 'e-rao').state === 'cancelled' && !ev(d, 'e-rao').deleted_at && tcOf(x, 'donna_cancel_event').result === 'cancelled');
  x = await turnC(d, S2B[9], heard2('9/C2/asis'));
  T('3.3 row 9 C2 asis AS RECORDED after the cancel: the resolver reads upcoming shoots only → B52 "No shoot for Rao on the calendar."', x.reply === 'No shoot for Rao on the calendar.');
  d = makeDb(estate());
  x = await turnC(d, S2B[8], heard2('8/C1/slots'));
  T('3.4 row 8 C1 slots AS RECORDED: the same question', x.reply === B50('Rao', '3 January 2027'));
  d = makeDb(estate());
  x = await turnC(d, 'Cancel the Walk Seventeen Alpha shoot on 9 January 2027', cx('Walk Seventeen Alpha', '9 January 2027'));
  T('3.5 a said day NARROWS two shoots to one → B50 on that row, no B53', x.reply === B50('Walk Seventeen Alpha', '9 January 2027') && noteIn(d).event_id === 'e-alpha-9');
  x = await turnC(d, 'Cancel the Walk Seventeen Alpha shoot on 10 January 2027', cx('Walk Seventeen Alpha', '10 January 2027'));
  T('3.6 a said day with no shoot → B52', x.reply === 'No shoot for Walk Seventeen Alpha on the calendar.');
  d = makeDb(estate());
  x = await turnC(d, 'Cancel the Walk Seventeen Alpha shoot', cx('Walk Seventeen Alpha'));
  const t7 = x.reply === B53A;
  x = await turnC(d, '9 January 2027', NONE);
  const t7b = x.reply === B50('Walk Seventeen Alpha', '9 January 2027');
  x = await turnC(d, 'No', NONE);
  T('3.7 two shoots, no day → B53; her day → B50 on that row; her NO → B3, nothing cancelled', t7 && t7b && x.reply === B3 && ev(d, 'e-alpha-9').state === 'upcoming');

  sec('4 THE DAY-SHEET RELOCATION (ruling (d)): day.js driven BEFORE (3af9a01, git show) and AFTER on the same fake rows');
  const { execSync } = require('child_process');
  const BASE = '3af9a01a3070b7cb3abb8f9441c450deb49ae97d';
  const baseDay = (() => { try { return execSync(`git show ${BASE}:src/api/vendor/day.js`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8'); } catch (_e) { return null; } })();
  const loadRouter = (code) => { const file = P('src/api/vendor/day.js'); const m = new Module(file, module); m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file)); m._compile(code, file); return m.exports; };
  const drive = async (router, db, date) => {
    const layer = router.stack.find((l) => l.route && l.route.path === '/:vendorId/:date');
    const handle = layer.route.stack[layer.route.stack.length - 1].handle;
    return quiet(() => new Promise((resolve) => {
      let status = 200;
      const res = { status(c) { status = c; return res; }, json(b) { resolve({ status, body: JSON.parse(JSON.stringify(b)) }); } };
      handle({ params: { vendorId: V.id, date }, app: { locals: { supabase: db } }, vendor: V, auth: null }, res, (e) => resolve({ status: 'next', body: String(e && e.message) }));
    }));
  };
  const dayWorld = () => { const w = estate(); w['public.events'].push(evRow({ id: 'e-b8', title: 'Personal', kind: 'blocked', event_date: '2027-01-08', notes: 'Personal', slot: 'full_day' }), evRow({ id: 'e-meet', title: 'Recce', kind: 'recce', event_date: '2027-01-08', event_time: '09:00:00', slot: 'morning' }), evRow({ id: 'e-gone', title: 'Old', event_date: '2027-01-08', state: 'cancelled' }), evRow({ id: 'e-del', title: 'Del', event_date: '2027-01-08', deleted_at: '2026-09-01T00:00:00Z' })); return w; };
  let same = !!baseDay; let saw = false;
  if (baseDay) for (const date of ['2027-01-08', '2027-01-09', '2027-05-05']) {
    const a = await drive(loadRouter(baseDay), makeDb(dayWorld()), date); const b = await drive(loadRouter(src('src/api/vendor/day.js')), makeDb(dayWorld()), date);
    if (canon(a) !== canon(b)) same = false; if (date === '2027-01-08' && b.body.events && b.body.events.length === 2 && b.body.blocks.length === 1) saw = true;
  }
  T('4.1 the day sheet\'s payload is BYTE-IDENTICAL before and after on the same rows (three days; a block, a timed recce, a cancelled and a deleted row present)', same && saw);
  const failDb = makeDb(dayWorld()); const fb = failDb.from; failDb.from = (n) => { const q = fb(n); if (n !== 'events') return q; const o = q.order; q.order = () => ({ then: (r) => Promise.resolve({ data: null, error: { message: 'read failed' } }).then(r) }); return q; };
  let fail500 = false;
  if (baseDay) { const a = await drive(loadRouter(baseDay), failDb, '2027-01-08'); const b = await drive(loadRouter(src('src/api/vendor/day.js')), failDb, '2027-01-08'); fail500 = a.status === 500 && canon(a) === canon(b) && b.body.error === 'Lookup failed.'; }
  T('4.2 a failed spine read is the router\'s 500 "Lookup failed." at both trees', fail500);
  // e-62's guard: at the base daySheet.js does not exist; 4.3 then FAILS by name and every later cell still lists
  const DS2 = (() => { try { return require(P('src/lib/vendor/daySheet.js')); } catch (_e) { return { readDaySpine: async () => ({}) }; } })();
  const sp = await DS2.readDaySpine(makeDb(dayWorld()), V.id, '2027-01-08');
  const spf = await DS2.readDaySpine(failDb, V.id, '2027-01-08');
  T('4.3 readDaySpine returns the split (events without blocks; blocks with slot, reason from notes, title) and { ok:false, error } on a failed read', sp.ok === true && Array.isArray(sp.events) && Array.isArray(sp.blocks) && J(sp.events.map((e) => e.id).sort()) === 'e-alpha-8,e-meet' /* the set: the double's order is not Postgres's nullsFirst, and 4.1 compares order across trees */ && sp.blocks.length === 1 && sp.blocks[0].reason === 'Personal' && spf.ok === false && spf.error === 'read failed');
  const moved = baseDay ? baseDay.slice(baseDay.indexOf('  const { data: dayRows'), baseDay.indexOf('    }));\n', baseDay.indexOf('  const { data: dayRows')) + 9) : '';
  const adapted = moved.replace(".eq('vendor_id', vendor.id)", ".eq('vendor_id', vendorId)").replace("    console.error('[GET /vendor/day] events read failed:', dayErr.message);\n    return res.status(500).json({ ok: false, error: 'Lookup failed.' });\n", '    return { ok: false, error: dayErr.message };\n');
  T('4.4 RELOCATION, NOT REWRITE: daySheet.js holds day.js :60 to :82 at 3af9a01 byte for byte but for the two disclosed adaptations inside it (vendorId; the return)', !!moved && srcOr('src/lib/vendor/daySheet.js').includes(adapted) && !src('src/api/vendor/day.js').includes('const { data: dayRows'));

  sec('5 MUTATIONS OF PRODUCTION CODE');
  const k4 = async (rq) => { const M = rq(WDf); const dd = makeDb(estate()); await turnC(dd, 'Move the Walk Seventeen Alpha shoot to 22 November 2027', mv('Walk Seventeen Alpha', '22 November 2027'), { M }); return turnC(dd, '8 January 2027', NONE, { M }); };
  await mut('5.1 M1 K4 REVERSED: B53 folded into DATE_ASKS (SHOOT_ASKS emptied): her "8 January 2027" becomes the DESTINATION (reddens 2.9)', WDf,
    [["const DATE_ASKS = Object.freeze(['B6', 'B7', 'B21', 'B26', 'B28', 'B54']);", "const DATE_ASKS = Object.freeze(['B6', 'B7', 'B21', 'B26', 'B28', 'B54', 'B53']);"], ["const SHOOT_ASKS = Object.freeze(['B53']);", 'const SHOOT_ASKS = Object.freeze([]);']], [], k4, (r) => r.reply !== B48('Walk Seventeen Alpha', '22 November 2027'));
  await mut('5.2 M2 B50\'s day from the ear instead of the ROW: a cancel with no day says no question (reddens 3.1\'s shape on row 9)', WDf,
    [["const line = DL.render('B50', { client, date: longDateYear(row.event_date) });", "const line = DL.render('B50', { client, date: act.date_as_spoken });"]], [],
    async (rq) => turnC(makeDb(estate()), S2B[9], heard2('9/C2/asis'), { M: rq(WDf) }), (r) => r.reply !== B50('Rao', '3 January 2027'));
  await mut('5.3 M3 the resolver reads cancelled shoots too (reddens 3.3)', WDf,
    [[".is('deleted_at', null).eq('state', 'upcoming').eq('kind', 'shoot');\n    if (error || !Array.isArray(data)) return null;\n    const name", ".is('deleted_at', null).eq('kind', 'shoot');\n    if (error || !Array.isArray(data)) return null;\n    const name"]], [],
    async (rq) => { const M = rq(WDf); const dd = makeDb(estate()); await turnC(dd, S2B[8], heard2('8/C2/asis'), { M }); await turnC(dd, 'Yes', NONE, { M }); return turnC(dd, S2B[9], heard2('9/C2/asis'), { M }); }, (r) => r.reply !== 'No shoot for Rao on the calendar.');
  await mut('5.4 M4 the question not waited for: anything but NO writes (reddens 2.22)', WDf,
    [["      if (PMA.decide(message) === 'yes') {\n        st.wrote = true; st.skipHarvest = true; st.answered = note.asked; st.fallback = DL.LINES.B75;", "      if (true) {\n        st.wrote = true; st.skipHarvest = true; st.answered = note.asked; st.fallback = DL.LINES.B75;"]], [],
    async (rq) => { const M = rq(WDf); const dd = makeDb(estate()); await turnC(dd, S2B[6], heard2('6/C2/asis'), { M }); await turnC(dd, 'hmm', NONE, { M }); return ev(dd, 'e-verma').event_date; }, (v) => v !== '2026-11-20');
  await mut('5.5 M5 the checker\'s sentence replaced by B75 (reddens 2.13)', WDf,
    [["{ line: r.conflict.message.trim(), key: 'B47', call: { name: hand,", "{ line: DL.LINES.B75, key: 'B47', call: { name: hand,"]], [],
    async (rq) => { const M = rq(WDf); const dd = makeDb(estate()); dd.tables['public.events'].push(evRow({ id: 'e-block', title: 'Blocked', kind: 'blocked', event_date: '2026-11-25' })); await turnC(dd, 'Move the Verma shoot to 25 November', mv('Verma', '25 November'), { M }); return turnC(dd, 'Yes', NONE, { M }); }, (r) => !/block/i.test(r.reply));
  await mut('5.6 M6 the one-question guard removed: a move beside a block (reddens 2.20)', WDf,
    [["      if (heard.acts.length !== 1) return CHAIN(st.ear, 'cal_mixed');\n", '']], [],
    async (rq) => turnC(makeDb(estate()), 'Block 20 March 2027 and move the Verma shoot to 22 November', req([{ act: 'block_date', date_as_spoken: '20 March 2027' }, { act: 'edit_event', client_as_spoken: 'Verma', date_as_spoken: '22 November' }]), { M: rq(WDf) }), (r) => r.reply !== B34);
  await mut('5.7 M7 a lookup heard after B53 read as moving on (reddens 2.12)', WDf,
    [["const movedOn = route !== 'search' && heardActs.some((a) => a && typeof a === 'object' && typeof a.act === 'string' && a.act !== 'date' &&", "const movedOn = heardActs.some((a) => a && typeof a === 'object' && typeof a.act === 'string' &&"]], [],
    async (rq) => { const M = rq(WDf); const dd = makeDb(estate()); await turnC(dd, 'Move the Walk Seventeen Alpha shoot to 22 November 2027', mv('Walk Seventeen Alpha', '22 November 2027'), { M }); return turnC(dd, '10 January 2027', req([{ act: 'find', date_as_spoken: '10 January 2027' }], 'search'), { M }); }, (r) => r.reply !== B53A);
  await mut('5.8 M8 K8 undone: source not passed, the ledger says "via calendar" (reddens 2.4)', WDf,
    [["surface: lane === 'pwa' ? 'pwa' : 'whatsapp', source: 'victor', event_id: note.event_id,", "surface: lane === 'pwa' ? 'pwa' : 'whatsapp', event_id: note.event_id,"]], [],
    async (rq) => { const M = rq(WDf); const dd = makeDb(estate()); await turnC(dd, S2B[6], heard2('6/C2/asis'), { M }); await turnC(dd, 'Yes', NONE, { M }); return String((dd.tables['public.vendor_activity_log'].slice(-1)[0] || {}).summary || ''); }, (s) => !/via chat/.test(s));
  let m9 = false;
  try { m9 = await withMutated('src/lib/vendor/daySheet.js', [["    .neq('state', 'cancelled')\n", '']], [], async (rq) => { const r = await rq('src/lib/vendor/daySheet.js').readDaySpine(makeDb(dayWorld()), V.id, '2027-01-08'); return r.events.some((e) => e.id === 'e-gone'); }); } catch (e) { console.log(`        (${e.message})`); }
  T('5.9 M9 the relocated spine loses the cancelled filter: a cancelled row reaches the sheet (reddens 4.1\'s rows)', m9 === true);

  sec('6 THE LAWS');
  const man = fs.existsSync(P(MAN)) ? src(MAN).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')) : [];
  T('6.1 W-1 NONE and the manifest names exactly this cut\'s paths', man.every((p) => !/^src\/engine\/|soul|lens|^db\/migrations\//.test(p)) && JSON.stringify(man.slice().sort()) === JSON.stringify([MAN, 'scripts/b105_lcv13_move_cancel_bench.js', WDf, DLf, 'src/lib/vendor/daySheet.js', 'src/api/vendor/day.js', 'docs/handovers/TDW_CE45_LCV13_P7_2B_HANDOVER.md', 'scripts/b90_lcv_p5_bench.js', 'scripts/b92_lcv_p6a_bench.js', 'scripts/b93_lcv9_chain_out_bench.js', 'scripts/b94_lcv10_bench.js', 'scripts/b95_lcv10_note_bench.js', 'scripts/b97_lcv10_name_bench.js', 'scripts/b98_lcv10_package_bench.js', 'scripts/b99_lcv10_didyoumean_bench.js', 'scripts/b102_lcv11_fix1_bench.js', 'scripts/b103_lcv12_rehear_bench.js', 'scripts/b104_lcv12_calendar_bench.js', 'scripts/b0457_crud_crew_bench.js', 'scripts/b6_s2_bench.js'].sort()));
  const SIX = { B48: 'fb8734312f58ff98f2061be1e6559996f7ac7d7ae0c05910094d72257b39239e', B49: '420a5f16d6dd179e663e5f64e2cae71499cbd3114034b533ed4c033f24b935a1', B50: '11ff0598c04b4779886e7d4555eb3a7e8827643ec2191236da9b78b501e86dc4', B51: '6e87ed6e362b53c41a0feedceb97a5460e88ee8cc836026ba7ed67bf8ad02216', B52: '6b8b4700bc8bae40c3a656339c756092791c393d34fb927ec7c9618017e6b1eb', B53: 'fd391aa7f9c88cfb1a5bdc18a3544be87c514728adc6caacf883b1c2cf9651e3' };
  T('6.2 LINES holds 58: the six 2b bytes his, each its hash literal; nothing else minted', Object.keys(DL.LINES).length === 79 /* RE-PINNED (CE-45 LCV-14, P7 cut 4 fix, labelled): 79 since B80 to B83, his; b109 holds them */ /* RE-PINNED (CE-45 LCV-14, P7 cut 4, labelled): 75 since B69 to B74, B78, B79, his (ASK 7: each form its own key); b108 holds them */ /* RE-PINNED (CE-45 LCV-14, P7 cut 3, labelled): 67 since B56 to B62, B67, B68, his (B60 carried, unspoken); b106 holds them */ && Object.keys(SIX).every((k) => DL.LINE_HASHES[k] === SIX[k] && sha(DL.LINES[k]) === SIX[k]));
  T('6.3 the money functions and the live-row block are untouched (planMoney, planPayment, planBooking, applyRow, reread; as at 541f145 and 3af9a01)', sha(src(WDf).slice(src(WDf).indexOf('async function planMoney'), src(WDf).indexOf('async function planInvoice'))) === '3e0abcc8a6f2fb0431a425a5e26336c80ead283d2f56d2b70cd927821d3ea530' && sha(src(WDf).slice(src(WDf).indexOf('async function applyRow'), src(WDf).indexOf('// The agent\'s current thread'))) === '8987e9f617aacdc6744d5ef590c5a6f44aebf2cc3d4c4f036e482fd6d2d1dfad'
    && sha(src(WDf).slice(src(WDf).indexOf('async function reread'), src(WDf).indexOf('function doorAnswer'))) === '380844e17a9fce4c392e05a320a7a29549a4674dbaccd6d3779c131ca69e6db8' && sha(src(WDf).slice(src(WDf).indexOf('    // 1 · the pending check'), src(WDf).indexOf('    const liveAtStart'))) === '5289029740782e70dcfb678590d0f8eebaa363a0c8e806c3496b97714edf2e18');
  const blob = (rel) => { try { return execSync(`git hash-object ${rel}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (_e) { return null; } };
  T('6.4 called AS THEY STAND, byte for byte the 3af9a01 blobs: eventWrite.js, availability.js, lifecycleHands.js, paymentReminders.js, pendingMoneyActs.js, listenerDoor.js', blob('src/lib/vendor/eventWrite.js') === 'c425bd543756a73fdb4d44ebae56f44436b4c638' && blob('src/lib/vendor/availability.js') === '259772903012b0a46c852ce6a4ad4c8cfdaf3b70' && blob('src/lib/vendor/lifecycleHands.js') === '30259a6a66cc44ca3455b152465338f31a3771b4' && blob('src/lib/vendor/paymentReminders.js') === '60ff12d09aa17cc2e03e1cbcf4e0eac0682e3eea' && blob('src/lib/vendor/pendingMoneyActs.js') === 'd88f70e5b4166657feb4f4306588c056e3683cc2' && blob(LDf) === '6d86a8ffd2e15d865e66d65023b4b902fea93693');

  sec('7 THE CARD, IN ITS EXACT WORDS (C-44.8, c-44.48): each step a cell named to its step, driven in order on ONE estate, the estate 2a\'s walk left (K6)');
  {
    d = makeDb(estate());
    const P2 = { lane: 'pwa' };
    x = await turnC(d, 'Move the Walk Seventeen Alpha shoot to 22 November 2027', mv('Walk Seventeen Alpha', '22 November 2027'), P2);
    T('7.1 THE CARD, STEP 1: "Move the Walk Seventeen Alpha shoot to 22 November 2027" → "Two shoots for Walk Seventeen Alpha: 8 January 2027 · 9 January 2027. Say the date."', x.reply === B53A);
    x = await turnC(d, '8 January 2027', NONE, P2);
    T('7.2 THE CARD, STEP 2: "8 January 2027" → "Move Walk Seventeen Alpha\'s shoot to 22 November 2027? Reply YES or NO."', x.reply === "Move Walk Seventeen Alpha's shoot to 22 November 2027? Reply YES or NO.");
    x = await turnC(d, 'No', NONE, P2);
    T('7.3 THE CARD, STEP 3: "No" → "Okay. Nothing was changed."', x.reply === 'Okay. Nothing was changed.' && ev(d, 'e-alpha-8').event_date === '2027-01-08');
    x = await turnC(d, 'Move the Walk Seventeen Alpha shoot to 22 November 2027', mv('Walk Seventeen Alpha', '22 November 2027'), P2);
    T('7.4 THE CARD, STEP 4: the same sentence again → the two-shoots question again', x.reply === B53A);
    x = await turnC(d, '8 January 2027', NONE, P2);
    T('7.5 THE CARD, STEP 5: "8 January 2027" → the move question again', x.reply === "Move Walk Seventeen Alpha's shoot to 22 November 2027? Reply YES or NO.");
    x = await turnC(d, 'Yes', NONE, P2);
    T('7.6 THE CARD, STEP 6: "Yes" → "Moved: Walk Seventeen Alpha · shoot · 22 November 2027."', x.reply === 'Moved: Walk Seventeen Alpha · shoot · 22 November 2027.' && ev(d, 'e-alpha-8').event_date === '2027-11-22');
    x = await turnC(d, 'Cancel the Walk Seventeen Alpha shoot on 9 January 2027', cx('Walk Seventeen Alpha', '9 January 2027'), P2);
    T('7.7 THE CARD, STEP 7: "Cancel the Walk Seventeen Alpha shoot on 9 January 2027" → "Cancel Walk Seventeen Alpha\'s shoot on 9 January 2027? Reply YES or NO."', x.reply === "Cancel Walk Seventeen Alpha's shoot on 9 January 2027? Reply YES or NO.");
    x = await turnC(d, 'Yes', NONE, P2);
    T('7.8 THE CARD, STEP 8: "Yes" → "Cancelled: Walk Seventeen Alpha · shoot · 9 January 2027."', x.reply === 'Cancelled: Walk Seventeen Alpha · shoot · 9 January 2027.' && ev(d, 'e-alpha-9').state === 'cancelled');
    x = await turnC(d, 'Cancel the Walk Seventeen Alpha shoot', cx('Walk Seventeen Alpha'), P2);
    T('7.9 THE CARD, STEP 9: "Cancel the Walk Seventeen Alpha shoot" (one left) → "Cancel Walk Seventeen Alpha\'s shoot on 22 November 2027? Reply YES or NO."', x.reply === "Cancel Walk Seventeen Alpha's shoot on 22 November 2027? Reply YES or NO.");
    x = await turnC(d, 'No', NONE, P2);
    T('7.10 THE CARD, STEP 10: "No" → "Okay. Nothing was changed." and the 22 November shoot stands', x.reply === 'Okay. Nothing was changed.' && ev(d, 'e-alpha-8').state === 'upcoming');
    x = await turnC(d, 'Move the Walk Seventeen Zeta shoot to 1 June 2027', mv('Walk Seventeen Zeta', '1 June 2027'), P2);
    T('7.11 THE CARD, STEP 11: "Move the Walk Seventeen Zeta shoot to 1 June 2027" → "No lead called Walk Seventeen Zeta. Add the lead first."', x.reply === 'No lead called Walk Seventeen Zeta. Add the lead first.');
    let sheet = null; try { sheet = await drive(loadRouter(src('src/api/vendor/day.js')), d, '2027-11-22'); } catch (_e) { sheet = null; }
    T('7.12 THE CARD, STEP 12 (the app): the day sheet for 22 November 2027 shows the Walk Seventeen Alpha shoot, and the lead\'s wedding date still reads 8 January 2027', !!sheet && sheet.body.events.some((e) => e.title === 'Walk Seventeen Alpha' && e.kind === 'shoot') && lead(d, ALPHA).wedding_date === '2027-01-08');
    x = await turnC(d, 'Block 24 March 2027, personal', req([{ act: 'block_date', date_as_spoken: '24 March 2027', reason_as_spoken: 'personal' }]), { lane: 'whatsapp' });
    const wa1 = x.reply === 'Blocked: 24 March 2027 · personal.';
    const d2 = makeDb(estate());
    const y = await turnC(d2, 'Block 24 March 2027, personal', req([{ act: 'block_date', date_as_spoken: '24 March 2027' }]), { lane: 'whatsapp' });
    T('7.13 THE CARD, STEP 13 (WhatsApp, 2a\'s B40 on that lane): "Block 24 March 2027, personal" → "Blocked: 24 March 2027 · personal." or, the reason dropped by the ear as 2a\'s walk saw, "Blocked: 24 March 2027."', wa1 && y.reply === 'Blocked: 24 March 2027.');
  }

  console.log(`\nb105_lcv13_move_cancel_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(`FAILED: ${failed.join(' · ')}`); process.exit(1); }
}
main().catch((e) => { console.log(`BENCH CRASHED: ${e && e.stack}`); process.exit(1); });
