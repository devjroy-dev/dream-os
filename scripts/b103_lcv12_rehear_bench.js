'use strict';
// scripts/b103_lcv12_rehear_bench.js · TDW CE-45 · LCV-12 · LC-Victor P7 CUT ONE: R-45.3, THE COLD SECOND HEARING, on b102's harness verbatim (its
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
const MAN = 'scripts/floor-manifest-lcv12-r453.txt';
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
  try { v = await withMutated(rel, pairs, dependents, fn); ok = expect(v); } catch (e) { console.log(`        (${e.message})`); ok = false; }
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


  // ── THE RECORD (C-44.12): the seat close §4, verbatim from the founder's export of 22 September 2026 (the first P6b walk, WhatsApp lane,
  // answering no note, no money row live). Each MISS is replayed as the FIRST hearing; each HEARD shape of the same sentence is the SECOND.
  const R = {
    '16:01:48': { said: 'Tell Sarah we are free on 22nd', heard: '{"acts":[],"route":"none"}' },
    '16:02:25': { said: 'Tell Sarah we are free on 22nd', heard: '{"acts":[],"route":"none"}' },
    '16:12:58': { said: 'Tell Sarah thank you', heard: '{"acts":[],"route":"none"}' },
    '16:04:19': { said: 'Tell Sarah we are free on 22nd', heard: '{"acts":[{"act":"relay","date_as_spoken":"22nd","client_as_spoken":"Sarah"}],"route":"task"}' },
    '16:13:30': { said: 'Tell Sarah thank you', heard: '{"acts":[{"act":"relay","client_as_spoken":"Sarah"}],"route":"task"}' },
  };
  const hj = (k) => JSON.parse(R[k].heard);
  const sarahWorld = () => { const w = world(); w['public.leads'] = [leadRow({ id: 'l-sarah', name: 'Sarah', phone: PHONE, state: 'booked' }), leadRow({ id: 'l-ab', name: 'Ab', phone: PHONE2 }), leadRow({ id: 'l-gone', name: 'Meena', phone: null, deleted_at: '2026-08-26T10:18:48Z' })]; return w; };
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
  const meta = (d) => { const r = lastDoor(d); return r && r.meta && r.meta.listener ? r.meta.listener : {}; };
  // a long thread, as the record's misses sat inside one: eight rows on the working thread before the sentence
  const longThread = (db) => { for (let i = 0; i < 4; i += 1) { db.tables['engine.messages'].push({ id: `u-${i}`, conversation_id: 'c-1', role: 'user', content: `Who are my new leads? ${i}`, meta: null, created_at: new Date(clock += 1000).toISOString() }); db.tables['engine.messages'].push({ id: `a-${i}`, conversation_id: 'c-1', role: 'assistant', content: B34, meta: { listener: { door: true, request: { acts: [{ act: 'find' }], route: 'search' } } }, created_at: new Date(clock += 1000).toISOString() }); } return db; };
  const threadIn = (c) => /Recent conversation, oldest first:/.test(String(c && c.user || ''));

  sec('1 THE RECORD, REPLAYED: a miss inside the thread, heard on the cold second hearing');
  T('1.0 the record is in the seat close §4 as this rung replays it', (() => { try { const h = src('docs/handovers/TDW_CE45_LCV11_SEAT_CLOSE_HANDOVER.md'); return Object.keys(R).every((k) => h.includes(k) && h.includes(R[k].said) && h.includes(R[k].heard)); } catch (_e) { return false; } })());
  let db = longThread(makeDb(sarahWorld()));
  let r = await turnSeq(db, R['16:01:48'].said, [hj('16:01:48'), hj('16:04:19')]);
  T('1.1 16:01:48 AS RECORDED (none, in a long thread), 16:04:19 as the second hearing: the frame B37 is asked for Sarah', r.keys === 'B37' && /Sarah/.test(r.reply));
  T('1.2 exactly two calls; the first carried the thread, the second carried NONE (conversationId null)', r.calls.length === 2 && threadIn(r.calls[0]) && !threadIn(r.calls[1]) && /^New message: /.test(r.calls[1].user));
  { const c0 = r.calls[0] || {}; const c1 = r.calls[1] || {}; // e-62/e-79: guarded reads, so the base reads FAIL and never crashes
  T('1.3 the same seat, tool, choice, bound and system on both calls', r.calls.length === 2 && c0.model === c1.model && c0.provider === c1.provider && J(c0.tools) === J(c1.tools) && c0.choice === c1.choice && c0.max_tokens === c1.max_tokens && c0.system === c1.system); }
  T('1.4 meta.listener records BOTH: request = the second, heard = the first, reheard true', canon(meta(db).request) === canon(hj('16:04:19')) && canon(meta(db).heard) === canon(hj('16:01:48')) && meta(db).reheard === true);
  T('1.5 ONE message: one user row, one assistant row, and the usage carried is the SUM of both calls (2800 in, 100 out)', db.tables['engine.messages'].filter((m) => m.role === 'user' && m.content === R['16:01:48'].said).length === 1 && db.tables['engine.messages'].filter((m) => m.role === 'assistant').length === 5 && ((r.out && r.out.ear && r.out.ear.usage) || {}).input_tokens === 2800 && ((r.out && r.out.ear && r.out.ear.usage) || {}).output_tokens === 100);
  db = longThread(makeDb(sarahWorld())); r = await turnSeq(db, R['16:02:25'].said, [hj('16:02:25'), hj('16:04:19')]);
  T('1.6 16:02:25 AS RECORDED, the second hearing 16:04:19: B37', r.keys === 'B37' && r.calls.length === 2);
  db = longThread(makeDb(sarahWorld())); r = await turnSeq(db, R['16:12:58'].said, [hj('16:12:58'), hj('16:13:30')]);
  T('1.7 16:12:58 AS RECORDED, the second hearing the pwa lane\'s 16:13:30 shape (relay, Sarah, no date): B37', r.keys === 'B37' && r.calls.length === 2 && meta(db).reheard === true);
  db = longThread(makeDb(sarahWorld())); r = await turnSeq(db, 'Tell Sarah hi', [NONE, req([relay('Sarah')])]);
  T('1.7a THE CARD, STEP 4: "Tell Sarah hi" (the fix walk\'s 17:26:09 shape) heard as none in the thread, then relay/Sarah cold: B37, two calls, reheard true', r.keys === 'B37' && r.calls.length === 2 && meta(db).reheard === true);
  db = longThread(makeDb(sarahWorld())); r = await turnSeq(db, R['16:12:58'].said, [hj('16:12:58'), hj('16:13:30')], { lane: 'pwa' });
  T('1.8 on the pwa lane the second hearing runs the same and the relay meets the second cut\'s gate as before (B34, exit relay_pwa)', r.keys === 'B34' && r.calls.length === 2 && meta(db).reheard === true && r.out.why === 'relay_pwa');

  sec('2 NEVER A THIRD, AND A SECOND THAT HEARS NOTHING READS LEFTOVER');
  db = longThread(makeDb(sarahWorld())); r = await turnSeq(db, R['16:12:58'].said, [NONE, NONE, hj('16:13:30')]);
  T('2.1 a second hearing returning nothing: LEFTOVER, exactly two calls, never a third', r.keys === 'LEFTOVER' && r.calls.length === 2);
  T('2.2 and the record still shows both: request none, heard none, reheard true', meta(db).reheard === true && canon(meta(db).request) === canon(NONE) && canon(meta(db).heard) === canon(NONE));
  db = longThread(makeDb(sarahWorld())); r = await turnSeq(db, R['16:12:58'].said, [NONE, 'error', hj('16:13:30')]);
  T('2.3 a second hearing that errors (its own 4 s bound): the first request stands, LEFTOVER, rehear_error on the record, never a third', r.keys === 'LEFTOVER' && r.calls.length === 2 && meta(db).reheard === true && /timed out/.test(String(meta(db).rehear_error)) && canon(meta(db).request) === canon(NONE));
  db = longThread(makeDb(sarahWorld())); r = await turnSeq(db, R['16:04:19'].said, [hj('16:04:19'), NONE]);
  T('2.4 [boundary, green at the base: one hearing is today\'s] heard the FIRST time: ONE call, no rehear mark', r.keys === 'B37' && r.calls.length === 1 && meta(db).reheard === undefined && meta(db).heard === undefined);

  sec('3 THE GATE: WHEN THE SECOND HEARING DOES NOT RUN');
  db = longThread(makeDb(sarahWorld())); r = await turnSeq(db, 'tell me who owes me money', [NONE, hj('16:13:30')]);
  T('3.1 THE FOUNDER\'S CONTROL: "tell me who owes me money" holds no lead name: one call, LEFTOVER, no rehear', r.keys === 'LEFTOVER' && r.calls.length === 1 && meta(db).reheard === undefined);
  db = longThread(makeDb(sarahWorld())); r = await turnSeq(db, 'Tell Ab hello', [NONE, hj('16:13:30')]);
  T('3.2 a live lead named "Ab" (two characters) is never a trigger: one call', r.calls.length === 1 && r.keys === 'LEFTOVER');
  db = longThread(makeDb(sarahWorld())); r = await turnSeq(db, 'Tell Walk Sixteen Nobody hello', [NONE, req([relay('Walk Sixteen Nobody')])]);
  T('3.2a THE CARD, STEP 6: "Tell Walk Sixteen Nobody hello", no lead of hers by that name, heard as none: ONE call, LEFTOVER, reheard ABSENT (the gate fires only on HER live leads)', r.calls.length === 1 && r.keys === 'LEFTOVER' && meta(db).reheard === undefined && meta(db).heard === undefined);
  db = longThread(makeDb(sarahWorld())); r = await turnSeq(db, 'Tell Meena hello', [NONE, hj('16:13:30')]);
  T('3.3 a DELETED lead\'s name is no trigger: one call', r.calls.length === 1 && r.keys === 'LEFTOVER');
  db = longThread(makeDb(sarahWorld())); r = await turnSeq(db, 'Tell sarah thanks', [NONE, hj('16:13:30')]);
  T('3.4 the name is matched under key(): "sarah" in lower case triggers', r.calls.length === 2 && r.keys === 'B37');
  db = longThread(makeDb(sarahWorld())); r = await turnSeq(db, 'Tell Sarah hello', [req([{ act: 'find' }], 'search'), hj('16:13:30')]);
  T('3.5 an act heard (find) is not "nothing": one call, no rehear (the ear\'s record decides such a turn as before)', r.calls.length === 1 && meta(db).reheard === undefined);
  // A NOTE TURN: the door asked B35 last turn; her answer "Sarah" was heard as none (the record's own 16:07:54). The note branch decides; no second hearing.
  db = makeDb(sarahWorld()); r = await turnSeq(db, 'Send a message to my client asking for the advance', [req([{ act: 'relay' }])]);
  T('3.6 (setup) B35 asked with a name note', r.keys === 'B35' && noteIn(db).asked === 'B35');
  r = await turnSeq(db, 'Sarah', [NONE, hj('16:13:30')]);
  T('3.7 a turn answering a NOTE is never re-heard, even when the ear returned none and her message names a live lead: one call, the note decides (B37)', r.calls.length === 1 && r.keys === 'B37' && meta(db).reheard === undefined);
  db = makeDb(sarahWorld()); db.tables['public.pending_money_acts'].push({ id: 'pma-1', vendor_id: V.id, act: 'booking_confirmed', request: { lead_id: 'l-sarah', lead_name: 'Sarah', kind: 'booking_confirmed' }, state: 'staged', lane: 'whatsapp', created_at: new Date(NOW - 60e3).toISOString(), expires_at: new Date(NOW + 3600e3).toISOString() });
  r = await turnSeq(db, 'Yes', [NONE, hj('16:13:30')]);
  T('3.8 a live money row\'s YES returns before the ear: zero calls, no rehear', r.calls.length === 0 && meta(db).reheard === undefined);
  db = longThread(makeDb(sarahWorld())); db.tables['public.leads'] = null;
  r = await turnSeq(db, R['16:12:58'].said, [NONE, hj('16:13:30')]);
  T('3.9 a FAILED read of her leads is not a name found: one call, LEFTOVER (C-44.4: an empty answer and a broken answer differ)', r.calls.length === 1 && r.keys === 'LEFTOVER');

  sec('4 TOTALITY AND THE HELPERS');
  // e-62: on the source BEFORE the cut the helpers do not exist; the cells FAIL by name and every later cell still lists.
  const has = ['heardNothing', 'namesLiveLead', 'rehear', 'sumUsage'].every((k) => typeof WD[k] === 'function');
  if (!has) { for (const k of Object.keys(WD)) { /* nothing */ } WD.heardNothing = WD.heardNothing || (() => 'absent'); WD.namesLiveLead = WD.namesLiveLead || (async () => 'absent'); WD.rehear = WD.rehear || (() => ({})); WD.sumUsage = WD.sumUsage || (() => ({})); }
  T('4.1 heardNothing: none/[] true; task, search, missing request, non-object, acts absent: false', WD.heardNothing({ request: { route: 'none', acts: [] } }) === true && WD.heardNothing({ request: { route: 'task', acts: [] } }) === false && WD.heardNothing({ request: { route: 'none', acts: [{ act: 'find' }] } }) === false && WD.heardNothing(null) === false && WD.heardNothing({ request: null }) === false && WD.heardNothing({ request: { route: 'none' } }) === false && WD.heardNothing(7) === false);
  T('4.2 namesLiveLead is total: no supabase, no message, a throwing client, a non-string message: false', (await WD.namesLiveLead(null, V.id, 'Tell Sarah')) === false && (await WD.namesLiveLead(makeDb(sarahWorld()), V.id, '')) === false && (await WD.namesLiveLead({ from: () => { throw new Error('x'); } }, V.id, 'Tell Sarah')) === false && (await WD.namesLiveLead(makeDb(sarahWorld()), V.id, { a: 1 })) === false);
  T('4.3 rehear: a second with a request replaces; a second with none keeps the first; a second with an error keeps the first and records it; hostile seconds keep the first', canon(WD.rehear({ request: NONE, usage: { input_tokens: 1 } }, { request: hj('16:13:30'), usage: { input_tokens: 2 } }).request) === canon(hj('16:13:30')) && canon(WD.rehear({ request: NONE }, { request: NONE }).request) === canon(NONE) && WD.rehear({ request: NONE }, { request: null, error: 'boom' }).rehear_error === 'boom' && WD.rehear({ request: NONE }, null).reheard === true && WD.rehear(null, { request: NONE }) === null && has);
  T('4.4 sumUsage sums the counted fields and tolerates nulls', WD.sumUsage({ input_tokens: 1400, output_tokens: 50, cache_read_input_tokens: 3 }, { input_tokens: 1400, output_tokens: 50 }).input_tokens === 2800 && WD.sumUsage({ input_tokens: 1 }, null).input_tokens === 1 && WD.sumUsage(null, null) === null);
  T('4.5 REHEAR_MIN_NAME is 3, exported', WD.REHEAR_MIN_NAME === 3);
  T('4.6 the pinned image: the rehear call passes conversationId null and reads the second hearing before the note branches', /conversationId: null, excludeId: null \}/.test(src(WDf)) && src(WDf).indexOf('st.ear = rehear(first, second)') < src(WDf).indexOf("if (note && NAME_ASKS.includes(note.asked))"));
  T('4.7 listenerDoor.recordListening (chain in) records heard/reheard too', /reheard === true \? \{ heard:/.test(src(LDf)));

  sec('5 MUTATIONS OF PRODUCTION CODE');
  const oneMiss = async (rq, message, db) => { const d = db || longThread(makeDb(sarahWorld())); const x = await turnSeq(d, message || R['16:01:48'].said, [hj('16:01:48'), hj('16:04:19')], { M: rq(WDf) }); return { keys: x.keys, n: x.calls.length, m: meta(d) }; };
  await mut('5.1 MUTATION: the second hearing removed (the gate never true) reddens 1.1: LEFTOVER, one call', WDf, [['if (!note && heardNothing(st.ear) && await namesLiveLead(supabase, vendor.id, message)) {', 'if (false) {']], [], async (rq) => oneMiss(rq), (v) => v.keys === 'LEFTOVER' && v.n === 1);
  await mut('5.2 MUTATION: the name gate removed reddens 3.1: the control is re-heard', WDf, [['if (!note && heardNothing(st.ear) && await namesLiveLead(supabase, vendor.id, message)) {', 'if (!note && heardNothing(st.ear)) {']], [], async (rq) => { const d = longThread(makeDb(sarahWorld())); const x = await turnSeq(d, 'tell me who owes me money', [NONE, hj('16:13:30')], { M: rq(WDf) }); return x.calls.length; }, (v) => v === 2);
  await mut('5.3 MUTATION: the note guard removed reddens 3.7: a note answer is re-heard', WDf, [['if (!note && heardNothing(st.ear) && await namesLiveLead(supabase, vendor.id, message)) {', 'if (heardNothing(st.ear) && await namesLiveLead(supabase, vendor.id, message)) {']], [], async (rq) => { const d = makeDb(sarahWorld()); await turnSeq(d, 'Send a message to my client asking for the advance', [req([{ act: 'relay' }])], { M: rq(WDf) }); const x = await turnSeq(d, 'Sarah', [NONE, hj('16:13:30')], { M: rq(WDf) }); return x.calls.length; }, (v) => v === 2);
  await mut('5.4 MUTATION: the thread NOT stripped on the second call reddens 1.2', WDf, [['conversationId: null, excludeId: null }', 'conversationId: threadId, excludeId: null }']], [], async (rq) => { const d = longThread(makeDb(sarahWorld())); const x = await turnSeq(d, R['16:01:48'].said, [hj('16:01:48'), hj('16:04:19')], { M: rq(WDf) }); return threadIn(x.calls[1]); }, (v) => v === true);
  await mut('5.5 MUTATION: the record not carrying heard/reheard reddens 1.4', WDf, [['st.ear = rehear(first, second);', 'st.ear = { ...first, request: second && second.request && !second.error ? second.request : first.request };']], [], async (rq) => oneMiss(rq), (v) => v.keys === 'B37' && v.m.reheard === undefined);
  await mut('5.6 MUTATION: the minimum name length dropped to 1 reddens 3.2', WDf, [['const REHEAR_MIN_NAME = 3;', 'const REHEAR_MIN_NAME = 1;']], [], async (rq) => { const d = longThread(makeDb(sarahWorld())); const x = await turnSeq(d, 'Tell Ab hello', [NONE, hj('16:13:30')], { M: rq(WDf) }); return x.calls.length; }, (v) => v === 2);
  await mut('5.7 MUTATION: usage not summed reddens 1.5', WDf, [['usage: sumUsage(first.usage, s.usage),', 'usage: s.usage || first.usage,']], [], async (rq) => { const d = longThread(makeDb(sarahWorld())); const x = await turnSeq(d, R['16:01:48'].said, [hj('16:01:48'), hj('16:04:19')], { M: rq(WDf) }); return ((x.out && x.out.ear && x.out.ear.usage) || {}).input_tokens; }, (v) => v === 1400);
  await mut('5.8 MUTATION: a THIRD hearing added is what 2.1\'s call count catches (three calls)', WDf, [['st.ear = rehear(first, second);', 'st.ear = rehear(first, second); if (heardNothing(st.ear)) st.ear = rehear(st.ear, await L.listener.hear({ supabase, route, message, conversationId: null, excludeId: null }, { ...(deps.llmCreate ? { llmCreate: deps.llmCreate } : {}) }));']], [], async (rq) => { const d = longThread(makeDb(sarahWorld())); const x = await turnSeq(d, R['16:12:58'].said, [NONE, NONE, hj('16:13:30')], { M: rq(WDf) }); return x.calls.length; }, (v) => v === 3);

  sec('6 THE LAWS');
  const man = fs.existsSync(P(MAN)) ? src(MAN).split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#')) : [];
  T('6.1 W-1 NONE and the manifest names exactly this cut\'s paths', man.every((p) => !/^src\/engine\/|soul|lens|^db\/migrations\//.test(p)) && JSON.stringify(man.slice().sort()) === JSON.stringify([MAN, 'scripts/b103_lcv12_rehear_bench.js', WDf, LDf, 'docs/handovers/TDW_CE45_LCV12_R453_HANDOVER.md'].sort()));
  // RE-PINNED (CE-45 LCV-12, P7 2a): LINES 52 and EAR_TOOL's hash moved by 2a's measured slots (b104 pins both); what this cell pins for cut one is that cut one's OWN paths hold no byte: doorLines.js not in its manifest, SYSTEM unmoved.
  T('6.2 no founder byte moved by cut one: doorLines.js is not in its manifest; SYSTEM as at 541f145; LINES 52 and EAR_TOOL as 2a shipped them', !man.includes(DLf) && Object.keys(DL.LINES).length === 75 /* RE-PINNED (CE-45 LCV-14, P7 cut 4, labelled): 75 since B69 to B74, B78, B79, his (ASK 7: each form its own key); b108 holds them */ /* RE-PINNED (CE-45 LCV-14, P7 cut 3, labelled): 67 since B56 to B62, B67, B68, his (B60 carried, unspoken); b106 holds them */ /* RE-PINNED (CE-45 LCV-13, P7 2b, labelled): LINES 58, B48 to B53 his; EAR_TOOL untouched by 2b */ && sha(LD.SYSTEM) === '90163dbe1889ee33f4b505b3b4e1aecfe1f853a2ee19376ebb894bb6aff75fb2' && sha(JSON.stringify(LD.EAR_TOOL)) === '4a8cfbeb20de523240ec68012c4f383bec56282e515fed50f0df78ae85aecd6d');
  T('6.3 the money functions are untouched: planMoney, planPayment, planBooking, applyRow, reread as at 541f145', sha(src(WDf).slice(src(WDf).indexOf('async function planMoney'), src(WDf).indexOf('async function planInvoice'))) === '3e0abcc8a6f2fb0431a425a5e26336c80ead283d2f56d2b70cd927821d3ea530' && sha(src(WDf).slice(src(WDf).indexOf('async function applyRow'), src(WDf).indexOf('// The agent\'s current thread'))) === '8987e9f617aacdc6744d5ef590c5a6f44aebf2cc3d4c4f036e482fd6d2d1dfad');

  console.log(`\nb103_lcv12_rehear_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(`FAILED: ${failed.join(' · ')}`); process.exit(1); }
}
main().catch((e) => { console.log(`BENCH CRASHED: ${e && e.stack}`); process.exit(1); });
