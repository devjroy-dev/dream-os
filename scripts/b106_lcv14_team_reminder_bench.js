'use strict';
// scripts/b106_lcv14_team_reminder_bench.js · TDW CE-45 · LCV-14 · LC-Victor P7 CUT 3: THE TEAM AND THE PAYMENT REMINDER. assign_crew and payment_reminder join
// COVERED; MEMBER_ASKS ['B62']; the offer's slot three-way (member); planAssign's three shapes; add-then-assign on two lines; planReminder's own invoice read
// and the room's window-first-else-earliest pick; sendOneReminder AS IT STANDS with source 'vendor_tap' (ASK 5); B56 to B62, B67, B68 his, B60 carried and
// unspoken (ASK 2); F-44.132 (the offer's slot never survived validNote). Rung b106.
// b105's harness carried byte for byte below its header (makeDb, world, doubles, withMutated; the PGRST116 double, C-44.3). THE EXIT CODE IS THE VERDICT.
// EVERY CELL THAT CLAIMS A SENTENCE REPLAYS A RECORDED HEARING VERBATIM AND NAMES ITS ROW (C-44.12): the P7 listening table of 23 September 2026,
// scripts/out/p7_ear_check.csv, sha256 f563b33daa3705403153a8769c0baafafd29d2d380f6730483c2dfc1f82b168e (72 rows), rows 10, 11, 12, 17, 18, through the REAL
// normaliseRequest. The drivers are the REAL preTurn, standIn and persistDoorTurn; the REAL writeEvent over the in-memory events table; the REAL
// sendOneReminder over a FAKE transport (sendWa) with the switchboard primed (capabilities._prime). Mutations are of PRODUCTION code.
// Mutations are of PRODUCTION code, never of test setup; a mutation honestly labelled as not reddening is a control.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-lcv14-p7-3.txt';
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

  // ── THE RECORD (C-44.12), rows extracted by script from the CSV (sha256 verified before extraction), never retyped ─────────────────────────────
  const REC = {
    "10/C1/slots": { said: "Assign Harsh to the 14 February shoot", raw: "{\"route\":\"task\",\"acts\":[{\"act\":\"assign_crew\",\"member_as_spoken\":\"Harsh\",\"kind_as_spoken\":\"shoot\",\"date_as_spoken\":\"14 February\"}]}" },
    "10/C2/slots": { said: "Assign Harsh to the 14 February shoot", raw: "{\"route\":\"task\",\"acts\":[{\"act\":\"assign_crew\",\"member_as_spoken\":\"Harsh\",\"kind_as_spoken\":\"shoot\",\"date_as_spoken\":\"14 February\"}]}" },
    "11/C1/slots": { said: "Add Priya to the team for the 5 December wedding", raw: "{\"route\":\"task\",\"acts\":[{\"act\":\"assign_crew\",\"client_as_spoken\":\"Priya\",\"date_as_spoken\":\"5 December\",\"member_as_spoken\":\"Priya\"}]}" },
    "11/C2/slots": { said: "Add Priya to the team for the 5 December wedding", raw: "{\"route\":\"task\",\"acts\":[{\"act\":\"assign_crew\",\"member_as_spoken\":\"Priya\",\"date_as_spoken\":\"5 December\"}]}" },
    "12/C1/slots": { said: "Add Priya to the team", raw: "{\"route\":\"task\",\"acts\":[{\"act\":\"assign_crew\",\"member_as_spoken\":\"Priya\",\"client_as_spoken\":\"\"}]}" },
    "12/C2/slots": { said: "Add Priya to the team", raw: "{\"route\":\"task\",\"acts\":[{\"act\":\"assign_crew\",\"member_as_spoken\":\"Priya\"}]}" },
    "17/C1/slots": { said: "Send Sarah a reminder for the payment", raw: "{\"route\":\"task\",\"acts\":[{\"act\":\"payment_reminder\",\"client_as_spoken\":\"Sarah\"}]}" },
    "17/C2/slots": { said: "Send Sarah a reminder for the payment", raw: "{\"route\":\"task\",\"acts\":[{\"act\":\"payment_reminder\",\"client_as_spoken\":\"Sarah\"}]}" },
    "18/C1/slots": { said: "Remind Sarah about the advance", raw: "{\"route\":\"task\",\"acts\":[{\"act\":\"payment_reminder\",\"client_as_spoken\":\"Sarah\",\"milestone\":\"advance\",\"date_as_spoken\":\"\",\"missing\":[]}]}" },
    "18/C2/slots": { said: "Remind Sarah about the advance", raw: "{\"route\":\"task\",\"acts\":[{\"act\":\"payment_reminder\",\"client_as_spoken\":\"Sarah\"}]}" },
    "17/C1/asis": { said: "Send Sarah a reminder for the payment", raw: "{\"route\":\"task\",\"acts\":[{\"act\":\"relay\",\"client_as_spoken\":\"Sarah\"}]}" },
  };
  const heardOf = (k) => LD.normaliseRequest(JSON.parse(REC[k].raw));
  const PR = require(P('src/lib/vendor/paymentReminders.js'));
  const CAP = require(P('src/lib/capabilities.js'));
  const capOn = () => { CAP._resetCapabilitiesCache(); CAP._prime([{ key: 'flag.payment_reminder_send', kind: 'flag', status: 'on' }]); };
  const capOff = () => { CAP._resetCapabilitiesCache(); CAP._prime([{ key: 'flag.payment_reminder_send', kind: 'flag', status: 'off' }]); };
  const capNone = () => { CAP._resetCapabilitiesCache(); CAP._prime([]); };
  const waSent = [];
  const fakeWa = async (a) => { waSent.push(a); return { sent: true, result: { wamid: `wamid.b106.${waSent.length}` } }; };
  // the REAL sendOneReminder, its transport a fake (the sent path stands on the rung, never on a walk: R-43.17)
  const realReminder = (over) => (supabase, args) => PR.sendOneReminder(supabase, args, { sendWa: over || fakeWa });
  // a team insert gets what Postgres gives it (C-44.3): a UUID id (writeEvent validates UUIDs) and the column DEFAULTS of PUBLIC_SCHEMA.md :1324 (active true,
  // deleted_at null, page_token); the harness's makeDb is untouched, wrapped here
  const tmDefaults = (r) => ({ id: crypto.randomUUID(), active: true, deleted_at: null, roster_vendor_id: null, page_token: crypto.randomUUID(), updated_at: new Date().toISOString(), ...r });
  const withUuids = (db) => { const orig = db.from; db.from = (n) => { const b = orig(n); if (n === 'team_members') { const ins = b.insert; b.insert = (p) => ins(Array.isArray(p) ? p.map(tmDefaults) : tmDefaults(p)); } return b; }; return db; };
  // a claim that Postgres answers with the unique violation (23505), for the "already" path
  const with23505 = (db) => { const orig = db.from; db.from = (n) => { const b = orig(n); if (n === 'payment_reminders') { b.insert = () => ({ select: () => ({ maybeSingle: async () => ({ data: null, error: { code: '23505', message: 'duplicate key' } }) }) }); } return b; }; return db; };
  const turnX = async (db, message, request, deps, o = {}) => {
    const mod = o.M || WD; calls.length = 0; LF._resetLaneFlagCache();
    const out = await quiet(() => mod.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message, lane: o.lane || 'pwa' },
      { llmCreate: earSeq(request), nowMs: NOW, composerCreate: composerOf(BODY), sendWhatsApp: transport, env: ENV, sendOneReminder: realReminder(), ...(deps || {}) }));
    const said = out && out.door === true ? out : await quiet(() => mod.standIn({ supabase: db, out }, { nowMs: NOW }));
    await quiet(() => mod.persistDoorTurn({ supabase: db, agentId: AG, message, out: said, lane: o.lane || 'pwa' }, { memory: memoryOf(db), meter }));
    return { out, said, reply: said.reply, keys: J(said.keys) };
  };
  let evSeq = 0;
  const evRow = (o) => Object.assign({ id: `e0000000-0000-4000-8000-${String(++evSeq).padStart(12, '0')}`, vendor_id: V.id, title: null, event_date: null, event_time: null, kind: 'shoot',
    linked_lead_id: null, state: 'upcoming', notes: null, created_at: '2026-09-22T21:12:27Z', updated_at: '2026-09-22T21:12:27Z', couple_id: null, deleted_at: null,
    linked_binder_id: null, slot: 'full_day', ready_by: null, assigned_member_ids: [], assigned_circle_member_id: null }, o);
  // public.team_members, ALL 13 columns (PUBLIC_SCHEMA.md :1324)
  const tmRow = (o) => Object.assign({ id: crypto.randomUUID(), vendor_id: V.id, name: null, role: null, phone: null, daily_rate_inr: null, notes: null, active: true, deleted_at: null,
    created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', page_token: crypto.randomUUID(), roster_vendor_id: null }, o);
  const ALPHA = 'l-alpha';
  // THE ESTATE 2b's WALK LEFT, as the founder's fixture read of 23 September returned it (K6): Walk Seventeen Alpha, ONE upcoming shoot on 22 November 2027, crew 0;
  // no team member named Walk Seventeen%; Sarah's live invoice PAID with no pending milestone; Alpha no invoice; no payment_reminders row.
  const estate = () => {
    const w = world();
    w['public.leads'] = [
      leadRow({ id: ALPHA, name: 'Walk Seventeen Alpha', wedding_date: '2027-01-08', wedding_date_precision: 'day' }),
      leadRow({ id: 'l-sarah', name: 'Sarah', state: 'booked' }),
    ];
    w['public.events'] = [evRow({ id: 'e-alpha-22n'.replace('e-alpha-22n', 'e0000000-0000-4000-8000-00000000a22b'), title: 'Walk Seventeen Alpha', event_date: '2027-11-22', linked_lead_id: ALPHA })];
    w['public.invoices'] = [{ id: 'i-sarah', vendor_id: V.id, lead_id: 'l-sarah', invoice_number: 'TDW/DEV440/12', client_name: 'Sarah', client_phone: PHONE, client_id: null, state: 'paid', deleted_at: null }];
    w['public.payment_schedules'] = [{ id: 'ms-sarah-1', invoice_id: 'i-sarah', vendor_id: V.id, milestone_label: 'Advance', amount_due: 30000, due_date: '2026-09-01', state: 'paid' }];
    w['public.payment_reminders'] = [];
    return w;
  };
  // a reminder estate: Sarah's live invoice with two PENDING milestones, derived from the store's clock (C-44.13: never a literal): one outside the window
  // (earliest), one inside it; and Rao with one pending OUTSIDE the window only
  const dues = () => ({ early: PR.istDayISO(-5), inside: PR.istDayISO(2), later: PR.istDayISO(40) });
  const remindEstate = () => {
    const w = estate(); const d = dues();
    w['public.leads'].push(leadRow({ id: 'l-rao', name: 'Rao', state: 'booked' }));
    w['public.invoices'] = [
      { id: 'i-sarah', vendor_id: V.id, lead_id: 'l-sarah', invoice_number: 'TDW/DEV440/12', client_name: 'Sarah', client_phone: PHONE, client_id: null, state: 'issued', deleted_at: null },
      { id: 'i-rao', vendor_id: V.id, lead_id: 'l-rao', invoice_number: 'TDW/DEV440/13', client_name: 'Rao', client_phone: PHONE, client_id: null, state: 'issued', deleted_at: null },
    ];
    w['public.payment_schedules'] = [
      { id: 'ms-early', invoice_id: 'i-sarah', vendor_id: V.id, milestone_label: 'Advance', amount_due: 30000, due_date: d.early, state: 'pending' },
      { id: 'ms-inside', invoice_id: 'i-sarah', vendor_id: V.id, milestone_label: 'Second instalment', amount_due: 45000, due_date: d.inside, state: 'pending' },
      { id: 'ms-rao', invoice_id: 'i-rao', vendor_id: V.id, milestone_label: 'Final', amount_due: 20000, due_date: d.later, state: 'pending' },
    ];
    return w;
  };
  const db = (w) => withUuids(makeDb(w));
  const team = (d) => d.tables['public.team_members'].filter((m) => !m.deleted_at);
  const crewOf = (d, id) => ((d.tables['public.events'].find((e) => e.id === id) || {}).assigned_member_ids || []).map(String);
  const reminders = (d) => d.tables['public.payment_reminders'] || [];
  const SHOOT = 'e0000000-0000-4000-8000-00000000a22b';
  const assign = (member, client, date) => ({ act: 'assign_crew', ...(member ? { member_as_spoken: member } : {}), ...(client ? { client_as_spoken: client } : {}), ...(date ? { date_as_spoken: date } : {}) });
  const remind = (client, extra) => ({ act: 'payment_reminder', ...(client ? { client_as_spoken: client } : {}), ...(extra || {}) });
  const B36 = (n) => `Did you mean ${n}? Reply YES or NO.`;
  const SWITCHED_OFF = 'Reminders are switched off for now.';
  const APPROVAL = 'This message is waiting on WhatsApp approval.';

  sec('1 · THE LAWS OF THE CUT (COVERED, HANDS, MEMBER_ASKS, the bytes, the offer\'s slot)');
  T('1.1 COVERED holds assign_crew and payment_reminder (fourteen kinds); NEEDS_CLIENT holds payment_reminder and not assign_crew', WD.COVERED.includes('assign_crew') && WD.COVERED.includes('payment_reminder') && WD.COVERED.length === 14 && WD.NEEDS_CLIENT.includes('payment_reminder') && !WD.NEEDS_CLIENT.includes('assign_crew'));
  T('1.2 HANDS names them assign_crew and payment_reminder_send (the kickoff)', WD.HANDS && WD.HANDS.assign_crew === 'assign_crew' && WD.HANDS.payment_reminder === 'payment_reminder_send');
  T('1.3 MEMBER_ASKS is [B62], its own list beside NAME_ASKS (ASK 1); NAME_ASKS unmoved', J(WD.MEMBER_ASKS) === 'B62' && J(WD.NAME_ASKS) === 'B18,B35');
  const NINE = { B56: 'd434900fe046a14f2bc58dec7d35f367f4fac70d99b08a849b7cf2be1b064b5a', B57: '992956ec3f4de01d0a5de21e3703a4c3d0cf3e1f6e9b627aac4e14329639a9e4', B58: '73b92a93a9b8c1fb51dad5aff7d87309bbca7909b86fe9402f26b8d2c250fc20', B59: '306e713bae4ef8766639d333200a49e3149fe7c1c2a7e47a3b45336b01485a03', B60: '95a4dfa8101a8f0af4b9db1c173d41ce1fc72392746dd175c3dbfb5236276f4a', B61: '646620f66e3229cbd4d7bf322d8a6a0ec211531822c0a4af6b9d6e2c31b2627e', B62: '13adf3035c94c14c96159d2c831ee3d37d8d8996c391252c1b4a808c1ca90265', B67: '3a7aeb7f1301e6f4a80b6e3f0ec2b5e0405fe916ace395f6e3eb3b4fe0589cbc', B68: '60ad19c5dfdfc5e50b4a72bb470f722649049554cfb64ea2ab6866f82585e415' };
  T('1.4 LINES 67; the nine hashes literal (B56 to B62, B67, B68); each byte hashes to its literal', DL.LINES && Object.keys(DL.LINES).length === 81 /* RE-PINNED (CE-45 LCV-15, LSP_2, labelled): 79 to 81, B84 and B85, his (R-45.16, the screenshot save); b112 holds them */ /* RE-PINNED (CE-45 LCV-14, P7 cut 4 fix, labelled): 75 → 79, B80 to B83; b109 holds them */ /* RE-PINNED (CE-45 LCV-14, P7 cut 4, labelled): 67 → 75, the eight lookup bytes; b108 holds them */ && Object.keys(NINE).every((k) => DL.LINE_HASHES[k] === NINE[k] && sha(DL.LINES[k] || '') === NINE[k]));
  T('1.5 B60 is CARRIED and UNSPOKEN: the byte is his from the chair\'s sheet ("No one called {name} on your team. Add them first."), and the door never names it', DL.LINES.B60 === 'No one called {name} on your team. Add them first.' && !/B60/.test(src(WDf)));
  const R202 = (src('src/api/vendor/reminders.js').split('\n')[201] || '');
  T('1.6 the "already" line REUSED byte for byte from reminders.js :202 (the room\'s own)', typeof WD.ALREADY_LINE === 'string' && R202.includes(`'${WD.ALREADY_LINE}'`));
  T('1.7 the offer\'s slot is THREE-WAY in ONE table (package, member, else client), read by offerFor and the B36 re-ask (RE-PINNED, LSP_3b: and F-44.149\'s offered-name yes)', WD.slotField && WD.slotField('member') === 'member_as_spoken' && WD.slotField('package') === 'package_as_spoken' && WD.slotField('x') === 'client_as_spoken' && (src(WDf).match(/slotField\(/g) || []).length === 3 /* RE-PINNED (CE-45 LCV-15, LSP_3b, labelled): 2 to 3, F-44.149 reads the offered name through the same table; b114 3.1 holds it */);
  T('1.8 F-44.132: an OFFER note\'s slot SURVIVES validNote (it did not at f24ffd9, so a package offer\'s re-ask named the client); an unknown slot is dropped', (WD.validNote({ asked: 'B36', acts: [assign('Walk Seventeen Theta')], tries: 0, candidate_id: 'x', slot: 'member' }) || {}).slot === 'member' && !('slot' in (WD.validNote({ asked: 'B36', acts: [assign('Walk Seventeen Theta')], tries: 0, candidate_id: 'x', slot: 'constructor' }) || { slot: 1 })));
  T('1.9 a MEMBER note is well-formed only on an assign_crew act with NO member', !!WD.validNote({ asked: 'B62', acts: [assign(null, 'Walk Seventeen Alpha')], tries: 0 }) && !WD.validNote({ asked: 'B62', acts: [assign('X', 'Walk Seventeen Alpha')], tries: 0 }) && !WD.validNote({ asked: 'B62', acts: [remind('Sarah')], tries: 0 }));
  T('1.10 membersLine: two is his B61 verbatim by position; three is R-45.9\'s derived form', typeof DL.membersLine === 'function' && DL.membersLine('Harsh', [{ name: 'Harsh', role: 'editor' }, { name: 'Harsh', role: '4410' }]) === 'Two on your team are called Harsh: Harsh (editor) · Harsh (4410). Say which one.' && DL.membersLine('Harsh', [{ name: 'Harsh', role: 'a' }, { name: 'Harsh', role: 'b' }, { name: 'Harsh', role: 'c' }]) === '3 on your team are called Harsh: Harsh (a) · Harsh (b) · Harsh (c). Say which one.' && DL.membersLine('Harsh', [{ name: 'Harsh', role: 'a' }]) === null);

  sec('2 · A TEAM ADD (B56 from the row, B57 exact, B36 near, rows 12)');
  {
    for (const k of ['12/C1/slots', '12/C2/slots']) {
      const d = db(estate());
      const x = await turnX(d, REC[k].said, heardOf(k));
      T(`2.1 row ${k} replayed: "${REC[k].said}" → "Added to the team: Priya." from the ROW; one active member row, role and phone null`, x.reply === 'Added to the team: Priya.' && team(d).length === 1 && team(d)[0].name === 'Priya' && team(d)[0].role === null && team(d)[0].phone === null && tc(x)[0].name === 'assign_crew' && tc(x)[0].result === 'member_added');
    }
    const d = db(estate()); d.tables['public.team_members'].push(tmRow({ name: 'Walk Seventeen Theta' }));
    const x = await turnX(d, 'Add walk seventeen theta to the team', req([assign('walk seventeen theta')]));
    T('2.2 exact under key() → B57 in the ROW\'s own name; nothing inserted', x.reply === 'Walk Seventeen Theta is already on your team.' && team(d).length === 1);
    const y = await turnX(d, 'Add Walk Seventeen Thta to the team', req([assign('Walk Seventeen Thta')]));
    T('2.3 a near name → B36 with an OFFER note, slot member; nothing inserted', y.reply === B36('Walk Seventeen Theta') && noteIn(d).asked === 'B36' && noteIn(d).slot === 'member' && noteIn(d).acts[0].member_as_spoken === 'Walk Seventeen Theta' && team(d).length === 1);
    const z = await turnX(d, 'Sure', req([]));
    T('2.4 F-44.132 CURED: a nothing-heard answer re-asks B36 naming the MEMBER candidate (the slot survived the note)', z.reply === B36('Walk Seventeen Theta'));
    const n = await turnX(d, 'No', req([]));
    T('2.5 her NO → B3; nothing inserted', n.reply === B3 && team(d).length === 1);
    const d2 = db(estate()); d2.tables['public.team_members'].push(tmRow({ name: 'Walk Seventeen Theta' }), tmRow({ name: 'Old Hand', active: false }), tmRow({ name: 'Gone Hand', deleted_at: '2026-09-01T00:00:00Z' }));
    const g = await turnX(d2, 'Add Old Hand to the team', req([assign('Old Hand')]));
    T('2.6 the team read is studio/team.js\'s predicate: an INACTIVE member is not on the team, so B56 adds a live row', g.reply === 'Added to the team: Old Hand.');
  }

  sec('3 · AN ASSIGNMENT (B58 from the returned row, B59, add-then-assign, B61, B62 and its note, B77, the dropped double, rows 10 and 11)');
  {
    const d = db(estate()); d.tables['public.team_members'].push(tmRow({ id: crypto.randomUUID(), name: 'Walk Seventeen Theta' }));
    const x = await turnX(d, 'Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot', req([assign('Walk Seventeen Theta', 'Walk Seventeen Alpha')]));
    const theta = team(d).find((m) => m.name === 'Walk Seventeen Theta');
    T('3.1 → B58 "Assigned: Walk Seventeen Theta · Walk Seventeen Alpha · shoot · 22 November 2027." through the REAL writeEvent; the crew holds her id', x.reply === 'Assigned: Walk Seventeen Theta · Walk Seventeen Alpha · shoot · 22 November 2027.' && J(crewOf(d, SHOOT)) === theta.id && tc(x)[0].result === 'assigned');
    T('3.2 the writer\'s own crew_confirmations row is upserted by writeEvent itself (called AS IT STANDS)', (d.tables['public.crew_confirmations'] || []).some((c) => String(c.team_member_id || c.member_id || '') === theta.id || JSON.stringify(c).includes(theta.id)));
    const y = await turnX(d, 'Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot', req([assign('Walk Seventeen Theta', 'Walk Seventeen Alpha')]));
    T('3.3 again → B59 "Walk Seventeen Theta\'s already on the Walk Seventeen Alpha shoot."; the crew unchanged', y.reply === "Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot." && crewOf(d, SHOOT).length === 1);
    const z = await turnX(d, 'Assign Walk Seventeen Kappa to the Walk Seventeen Alpha shoot', req([assign('Walk Seventeen Kappa', 'Walk Seventeen Alpha')]));
    T('3.4 ADD THEN ASSIGN on two lines (the founder\'s own example): B56, then B58; two members on the crew', z.reply === 'Added to the team: Walk Seventeen Kappa.\n\nAssigned: Walk Seventeen Kappa · Walk Seventeen Alpha · shoot · 22 November 2027.' && crewOf(d, SHOOT).length === 2 && J(tc(z).map((c) => c.result)) === 'member_added,assigned');
    const a = await turnX(d, 'Assign to the Walk Seventeen Alpha shoot', req([assign(null, 'Walk Seventeen Alpha')]));
    T('3.5 no member → B62 "Who? Say the name." with a MEMBER note; nothing written', a.reply === 'Who? Say the name.' && noteIn(d).asked === 'B62' && noteIn(d).acts[0].client_as_spoken === 'Walk Seventeen Alpha' && !noteIn(d).acts[0].member_as_spoken);
    const b = await turnX(d, 'Walk Seventeen Theta', req([{ act: 'lead', client_as_spoken: 'Walk Seventeen Theta' }]));
    T('3.6 her answer IS the member (heard as a lead naming her whole message: her answer, not a new job) → B59; member_as_spoken, never client_as_spoken', b.reply === "Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot." && b.said.answered === 'B62');
    const c = await turnX(d, 'Add Walk Seventeen Kappa to the team for the 22 November 2027 wedding', req([assign('Walk Seventeen Kappa', null, '22 November 2027')]));
    T('3.7 by the day alone → the one shoot that day → B59 (Kappa already on it)', c.reply === "Walk Seventeen Kappa's already on the Walk Seventeen Alpha shoot.");
    const e = await turnX(d, 'Add Walk Seventeen Kappa to the team for the 8 January 2027 wedding', req([assign('Walk Seventeen Kappa', null, '8 January 2027')]));
    T('3.8 a day with no shoot → B77 "No shoot on 8 January 2027."; nothing written', e.reply === 'No shoot on 8 January 2027.' && crewOf(d, SHOOT).length === 2);
    const f = await turnX(d, 'Assign Walk Seventeen Theta to the Walk Seventeen Zeta shoot', req([assign('Walk Seventeen Theta', 'Walk Seventeen Zeta')]));
    T('3.9 a client that is no lead → B76 (his one line for book, move, cancel and remind)', f.reply === 'No lead called Walk Seventeen Zeta. Add the lead first.');
    const g = await turnX(d, 'Assign to the Walk Seventeen Alpha shoot', req([assign(null, 'Walk Seventeen Alpha')]));
    const h = await turnX(d, 'Yes', req([]));
    const i = await turnX(d, 'Yes', req([]));
    T('3.10 a closed YES to B62 is no name: re-asked ONCE, then B3', g.reply === 'Who? Say the name.' && h.reply === 'Who? Say the name.' && i.reply === B3);
    const j = await turnX(d, 'Assign to the Walk Seventeen Alpha shoot', req([assign(null, 'Walk Seventeen Alpha')]));
    const k = await turnX(d, 'Block 24 March 2027', req([{ act: 'block_date', date_as_spoken: '24 March 2027' }]));
    T('3.11 another act heard LAPSES the member note (F-44.115): the block runs fresh', j.reply === 'Who? Say the name.' && k.reply === 'Blocked: 24 March 2027.');
  }
  {
    const d = db(estate()); d.tables['public.events'].push(evRow({ title: 'Rao', event_date: '2027-02-14', linked_lead_id: null }));
    for (const k of ['10/C1/slots', '10/C2/slots']) {
      const x = await turnX(d, REC[k].said, heardOf(k));
      const harsh = team(d).filter((m) => m.name === 'Harsh');
      const ev = d.tables['public.events'].find((e) => e.event_date === '2027-02-14');
      T(`3.12 row ${k} replayed: "${REC[k].said}" → ${k.startsWith('10/C1') ? 'B56 then B58 (Harsh not on the team)' : 'B59 (added by the row before)'}`, harsh.length === 1 && (k.startsWith('10/C1') ? x.reply === 'Added to the team: Harsh.\n\nAssigned: Harsh · Rao · shoot · 14 February 2027.' : x.reply === "Harsh's already on the Rao shoot.") && J(ev.assigned_member_ids) === harsh[0].id);
    }
    const w = estate(); w['public.events'].push(evRow({ title: 'Priya Walk', event_date: '2026-12-05' }));
    const d2 = db(w);
    const x = await turnX(d2, REC['11/C1/slots'].said, heardOf('11/C1/slots'));
    T('3.13 row 11/C1/slots replayed (client "Priya" equal to the member): the double is DROPPED (ruling 4), the day decides → B56 then B58 on the 5 December shoot', x.reply === 'Added to the team: Priya.\n\nAssigned: Priya · Priya Walk · shoot · 5 December 2026.');
    const y = await turnX(d2, REC['11/C2/slots'].said, heardOf('11/C2/slots'));
    T('3.14 row 11/C2/slots replayed → B59 (Priya on it from the row before)', y.reply === "Priya's already on the Priya Walk shoot.");
  }
  {
    const d = db(estate()); d.tables['public.team_members'].push(tmRow({ name: 'Harsh', role: 'editor' }), tmRow({ name: 'Harsh', phone: '+919876544410' }));
    const x = await turnX(d, 'Assign Harsh to the Walk Seventeen Alpha shoot', req([assign('Harsh', 'Walk Seventeen Alpha')]));
    T('3.15 two members of one name → B61 by position, {role} the row\'s role, else the phone\'s last four; nothing written', x.reply === 'Two on your team are called Harsh: Harsh (editor) · Harsh (4410). Say which one.' && crewOf(d, SHOOT).length === 0);
    d.tables['public.team_members'].push(tmRow({ name: 'Harsh', created_at: '2026-08-15T10:00:00Z' }));
    const y = await turnX(d, 'Assign Harsh to the Walk Seventeen Alpha shoot', req([assign('Harsh', 'Walk Seventeen Alpha')]));
    T('3.16 three → R-45.9\'s derived form; no role and no phone → the day added, full month', y.reply === '3 on your team are called Harsh: Harsh (editor) · Harsh (4410) · Harsh (15 August 2026). Say which one.');
    const w = estate(); w['public.events'].push(evRow({ title: 'Rao', event_date: '2027-11-22' }));
    const d2 = db(w);
    const z = await turnX(d2, 'Assign Harsh to the 22 November 2027 shoot', req([assign('Harsh', null, '22 November 2027')]));
    T('3.17 a day holding two shoots and no client names no one shoot → B34 (exit assign_many); nothing written', z.reply === B34 && z.out.why === 'assign_many' && team(d2).length === 0);
    const d3 = db(estate()); d3.tables['public.team_members'].push(tmRow({ name: 'Walk Seventeen Theta' }));
    const u = await turnX(d3, 'Assign Walk Seventeen Thta to the Walk Seventeen Alpha shoot', req([assign('Walk Seventeen Thta', 'Walk Seventeen Alpha')]));
    const v = await turnX(d3, 'Yes', req([]));
    T('3.18 a near member on an assignment → B36 slot member; her YES assigns the CANDIDATE → B58', u.reply === B36('Walk Seventeen Theta') && v.reply === 'Assigned: Walk Seventeen Theta · Walk Seventeen Alpha · shoot · 22 November 2027.' && team(d3).length === 1);
    const d4 = db(estate());
    const q = await turnX(d4, 'Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot on 8 January 2027', req([assign('Walk Seventeen Theta', 'Walk Seventeen Alpha', '8 January 2027')]));
    T('3.19 a client and a day with no shoot that day → B52; nothing written, nobody added', q.reply === 'No shoot for Walk Seventeen Alpha on the calendar.' && team(d4).length === 0);
  }

  sec('4 · THE PAYMENT REMINDER (rows 17 and 18; the pick; B67 over a fake transport; already; the dark gate; B68; B76; vendor_tap)');
  {
    for (const k of ['17/C1/slots', '17/C2/slots', '18/C1/slots', '18/C2/slots']) {
      capOn(); waSent.length = 0;
      const d = db(remindEstate()); const du = dues();
      const x = await turnX(d, REC[k].said, heardOf(k));
      const r = reminders(d)[0] || {};
      T(`4.1 row ${k} replayed, gate open: B67 from the milestone INSIDE the window (not the earlier one); one row claimed for it, source vendor_tap; one template to the invoice phone`, x.reply === `Reminder sent to Sarah: Second instalment · Rs 45,000 · due ${require(P('src/lib/witnessLine.js')).longDateYear(du.inside)}.` && reminders(d).length === 1 && r.milestone_id === 'ms-inside' && r.source === 'vendor_tap' && waSent.length === 1 && waSent[0].to === PHONE && tc(x)[0].name === 'payment_reminder_send' && tc(x)[0].result === 'sent');
    }
    capOn(); waSent.length = 0;
    const d = db(remindEstate());
    const x = await turnX(d, 'Remind Rao about the payment', req([remind('Rao')]));
    T('4.2 nothing inside the window → the EARLIEST pending (the room\'s window first, else earliest)', /^Reminder sent to Rao: Final · Rs 20,000 · due /.test(x.reply) && (reminders(d)[0] || {}).milestone_id === 'ms-rao');
    capOn();
    const d2 = with23505(db(remindEstate()));
    const y = await turnX(d2, 'Send Sarah a reminder for the payment', req([remind('Sarah')]));
    T('4.3 the claim answered 23505 → the room\'s own byte REUSED "A reminder has already been sent for this milestone."', y.reply === 'A reminder has already been sent for this milestone.' && tc(y)[0].result === 'already');
    for (const [label, gate] of [['off', capOff], ['no row', capNone]]) {
      gate(); waSent.length = 0;
      const d3 = db(remindEstate());
      const z = await turnX(d3, 'Send Sarah a reminder for the payment', req([remind('Sarah')]));
      T(`4.4 the gate DARK (flag ${label}) → "Reminders are switched off for now." verbatim; NO payment_reminders row; nothing sent`, z.reply === SWITCHED_OFF && reminders(d3).length === 0 && waSent.length === 0 && tc(z)[0].result === 'refused:gate');
    }
    capOn();
    const d4 = db(remindEstate());
    const failWa = async () => { const e = new Error('template not approved'); e.code = 'refused'; throw e; };
    const f = await turnX(d4, 'Send Sarah a reminder for the payment', req([remind('Sarah')]), { sendOneReminder: realReminder(failWa) });
    T('4.5 a transport failure → the feature\'s own "The reminder didn\'t go — try again." (:425); the row kept as failed', f.reply === "The reminder didn't go — try again." && (reminders(d4)[0] || {}).status === 'failed');
    capOn();
    const d5 = db(estate());
    const g = await turnX(d5, 'Remind Walk Seventeen Alpha about the advance', req([remind('Walk Seventeen Alpha', { milestone: 'advance' })]));
    T('4.6 a lead with no live invoice → B68 "Nothing is due from Walk Seventeen Alpha."; nothing claimed', g.reply === 'Nothing is due from Walk Seventeen Alpha.' && reminders(d5).length === 0);
    const h = await turnX(d5, 'Send Sarah a reminder for the payment', req([remind('Sarah')]));
    T('4.7 THE ESTATE AS THE FIXTURE READ IT (Sarah\'s invoice paid, no pending milestone) → B68 "Nothing is due from Sarah." before any gate; nothing claimed or sent', h.reply === 'Nothing is due from Sarah.' && reminders(d5).length === 0);
    const i = await turnX(d5, 'Remind Walk Seventeen Zeta about the payment', req([remind('Walk Seventeen Zeta')]));
    T('4.8 a name that is no lead → B76', i.reply === 'No lead called Walk Seventeen Zeta. Add the lead first.');
    const j = await turnX(d5, 'Send a reminder for the payment', req([remind(null)]));
    T('4.9 a reminder naming no client → B35 (NEEDS_CLIENT since 2a)', j.reply === B35);
    capOn(); waSent.length = 0;
    const d6 = db(remindEstate());
    await turnX(d6, 'Send Sarah a reminder for the payment', req([remind('Sarah')]));
    T('4.10 ASK 5 PINNED: the claimed row is source vendor_tap on Sarah\'s invoice, the row invoiceHasVendorTap (paymentReminders.js :228) reads as her consent for the nightly sweep', reminders(d6).some((r) => r.invoice_id === 'i-sarah' && r.source === 'vendor_tap'));
    const e17 = heardOf('17/C1/asis');
    T('4.11 CONTROL, labelled: row 17/C1/asis (the unshipped variant) hears relay, not payment_reminder; the slots variant is what ships', e17.acts[0].act === 'relay');
  }

  sec('5 · MUTATIONS OF PRODUCTION CODE (workingDoor.js), each must redden');
  {
    // each mutation passes when the CURED expectation FAILS under it (it reddens); the expectation is the cured cell's own
    const M = async (name, pairs, drive, cured) => mut(name, WDf, pairs, [], async () => drive(require(WDP)), (v) => !cured(v));
    await M('5.1 M1 COVERED loses the team acts → "Add Priya to the team" reads B34, not B56', [["...CALENDAR_ACTS, ...TEAM_ACTS]);", '...CALENDAR_ACTS]);']],
      async (Mod) => turnX(db(estate()), REC['12/C2/slots'].said, heardOf('12/C2/slots'), {}, { M: Mod }), (x) => x.reply === 'Added to the team: Priya.');
    await M('5.2 M2 the client double NOT dropped (ruling 4 undone) → row 11/C1/slots reads B76, not B56 then B58', [['const client = said && key(said) !== key(member) ? said : null;', 'const client = said;']],
      async (Mod) => { const w = estate(); w['public.events'].push(evRow({ title: 'Priya Walk', event_date: '2026-12-05' })); return turnX(db(w), REC['11/C1/slots'].said, heardOf('11/C1/slots'), {}, { M: Mod }); },
      (x) => x.reply === 'Added to the team: Priya.\n\nAssigned: Priya · Priya Walk · shoot · 5 December 2026.');
    await M('5.3 M3 the offer\'s slot back to TWO-way → her YES to a member offer does not assign the candidate', [["const slotField = (slot) => OFFER_SLOTS[slot === 'package' || slot === 'member' ? slot : 'client'];", "const slotField = (slot) => OFFER_SLOTS[slot === 'package' ? slot : 'client'];"]],
      async (Mod) => { const d = db(estate()); d.tables['public.team_members'].push(tmRow({ name: 'Walk Seventeen Theta' })); await turnX(d, 'Assign Walk Seventeen Thta to the Walk Seventeen Alpha shoot', req([assign('Walk Seventeen Thta', 'Walk Seventeen Alpha')]), {}, { M: Mod }); return turnX(d, 'Yes', req([]), {}, { M: Mod }); },
      (x) => x.reply === 'Assigned: Walk Seventeen Theta · Walk Seventeen Alpha · shoot · 22 November 2027.');
    await M('5.4 M4 the window pick removed (earliest always) → the reminder claims the milestone OUTSIDE the window', [['pending.find((m) => m.due_date >= from && m.due_date <= to) || pending[0]', 'pending[0]']],
      async (Mod) => { capOn(); const d = db(remindEstate()); await turnX(d, 'Send Sarah a reminder for the payment', req([remind('Sarah')]), {}, { M: Mod }); return d; },
      (d) => (reminders(d)[0] || {}).milestone_id === 'ms-inside');
    await M('5.5 M5 the source is nightly (ASK 5 undone) → the claimed row is not her tap', [["vendorName, source: 'vendor_tap' });", "vendorName, source: 'nightly' });"]],
      async (Mod) => { capOn(); const d = db(remindEstate()); await turnX(d, 'Send Sarah a reminder for the payment', req([remind('Sarah')]), {}, { M: Mod }); return d; },
      (d) => (reminders(d)[0] || {}).source === 'vendor_tap');
    await M('5.6 M6 the member note fills client_as_spoken (ASK 1 undone) → her answer to B62 is not the member', [['(i === 0 ? { ...a, member_as_spoken: name } : { ...a })', '(i === 0 ? { ...a, client_as_spoken: name } : { ...a })']],
      async (Mod) => { const d = db(estate()); d.tables['public.team_members'].push(tmRow({ name: 'Walk Seventeen Theta' })); await turnX(d, 'Assign to the Walk Seventeen Alpha shoot', req([assign(null, 'Walk Seventeen Alpha')]), {}, { M: Mod }); return turnX(d, 'Walk Seventeen Theta', req([]), {}, { M: Mod }); },
      (x) => x.reply === 'Assigned: Walk Seventeen Theta · Walk Seventeen Alpha · shoot · 22 November 2027.');
    await M('5.7 M7 B58 spoken with NO write (writeEvent skipped) → the crew is empty', [["const r = await L.writeEvent(supabase, { vendorId: vendor.id, surface: lane === 'pwa' ? 'pwa' : 'whatsapp', source: 'victor', event_id: String(ev.id), assigned_member_ids: [...crew, member.id] });", 'const r = { ok: true, event: ev };']],
      async (Mod) => { const d = db(estate()); d.tables['public.team_members'].push(tmRow({ name: 'Walk Seventeen Theta' })); await turnX(d, 'Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot', req([assign('Walk Seventeen Theta', 'Walk Seventeen Alpha')]), {}, { M: Mod }); return d; },
      (d) => crewOf(d, SHOOT).length === 1);
    await M('5.8 M8 the exact-member check removed → a second add inserts a duplicate, never B57', [["if (exact.length) { const line = DL.render('B57'", "if (false) { const line = DL.render('B57'"]],
      async (Mod) => { const d = db(estate()); d.tables['public.team_members'].push(tmRow({ name: 'Walk Seventeen Theta' })); return turnX(d, 'Add Walk Seventeen Theta to the team', req([assign('Walk Seventeen Theta')]), {}, { M: Mod }); },
      (x) => x.reply === 'Walk Seventeen Theta is already on your team.');
    await M('5.9 M9 F-44.132 undone (the slot dropped by validNote) → the member offer\'s re-ask names no member', [["...(OFFER_ASKS.includes(n.asked) && Object.prototype.hasOwnProperty.call(OFFER_SLOTS, n.slot) ? { slot: n.slot } : {}), ", '']],
      async (Mod) => { const d = db(estate()); d.tables['public.team_members'].push(tmRow({ name: 'Walk Seventeen Theta' })); await turnX(d, 'Add Walk Seventeen Thta to the team', req([assign('Walk Seventeen Thta')]), {}, { M: Mod }); return turnX(d, 'Sure', req([]), {}, { M: Mod }); },
      (x) => x.reply === B36('Walk Seventeen Theta'));
  }

  sec('6 · THE LAWS (the money code byte for byte; the hands AS THEY STAND; the manifest)');
  {
    const blob = (rel) => { const b = fs.readFileSync(P(rel)); return crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`), b])).digest('hex'); };
    const MONEY = { planMoney: '2a7a1c76bf2efeabec03301805e5d5d2bdb38b310940284935496dad8b7f7efb', planPayment: 'cddb6c299afe946ddfddf89cebb3a815c13db38cbd17c863a2b23a677244483e', planBooking: '086fbb9debf6a62fa52a8306037adef47cc1ece4e2ce2efd7e2c684a27e6a3fa', applyRow: '01f76e676659e01c3f0dd92b560726fcde136a8be4bcf3a12adf120cc7fc1b4b', reread: 'e200a0f720c62637ea617ccacb508c9b7a0b58f49e7848323c5eff5a7bcdc8fc' };
    T('6.1 planMoney, planPayment, planBooking, applyRow, reread hash to their f24ffd9 text', Object.keys(MONEY).every((k) => typeof WD[k] === 'function' && sha(WD[k].toString()) === MONEY[k]));
    const cur = src(WDf); const a = cur.indexOf('    // 1 · the pending check, BEFORE the listener'); const b = cur.indexOf('    const liveAtStart');
    T('6.2 the live-row block hashes to its f24ffd9 text', a > 0 && b > a && sha(cur.slice(a, b)) === '5289029740782e70dcfb678590d0f8eebaa363a0c8e806c3496b97714edf2e18');
    const HANDS_BLOBS = { 'src/lib/vendor/eventWrite.js': 'c425bd543756a73fdb4d44ebae56f44436b4c638', 'src/lib/vendor/availability.js': '259772903012b0a46c852ce6a4ad4c8cfdaf3b70', 'src/lib/vendor/lifecycleHands.js': '30259a6a66cc44ca3455b152465338f31a3771b4', 'src/lib/vendor/paymentReminders.js': '60ff12d09aa17cc2e03e1cbcf4e0eac0682e3eea', 'src/lib/vendor/pendingMoneyActs.js': 'd88f70e5b4166657feb4f4306588c056e3683cc2', 'src/lib/vendor/listenerDoor.js': '6d86a8ffd2e15d865e66d65023b4b902fea93693', 'src/lib/vendor/daySheet.js': '212d3a0047d3840622f7696456cbe7390b3d6685', 'src/api/vendor/worklistToday.js': 'a9b36d192c14d6c2ed6a419d90b6656eb9fa8792' /* RE-PINNED (CE-45 LCV-14, P7 cut 4, labelled): moved by K3's relocation alone (the kickoff's one allowed change to it); b108 1.3 and 1.4 hold the relocation */, 'src/api/vendor/reminders.js': '909398ac3f6fe9257077d72778cc3f93dccce1fe', 'src/api/vendor/studio/team.js': 'db8068f167884053948a4e59cb5b2660d86ae7b3' };
    T('6.3 eventWrite, availability, lifecycleHands, paymentReminders, pendingMoneyActs, listenerDoor, daySheet, worklistToday, reminders.js and studio/team.js are byte for byte their f24ffd9 blobs', Object.keys(HANDS_BLOBS).every((r) => blob(r) === HANDS_BLOBS[r]));
    const man = (() => { try { return src(MAN).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')); } catch (_e) { return []; } })();
    T('6.4 the manifest names the cut\'s production files and none of the hands above', man.includes(WDf) && man.includes(DLf) && !Object.keys(HANDS_BLOBS).some((r) => man.includes(r)));
  }

  // THE CARD'S ESTATE (step 10b, the founder's choice, taken 23 September): estate() plus invoice TDW/DEV440/25 for Walk Seventeen Alpha, made in the app,
  // Rs 80,000 unpaid, three PENDING milestones (the deposit due TODAY in IST, derived from the store's clock, C-44.13; the rest later), and the lead's phone,
  // his own line. The invoice's client_phone as the app copied it is read from the fixture on walk day; here it is null, and 7.10b drives it present too.
  const cardEstate = (invPhone) => {
    const w = estate();
    w['public.leads'].find((l) => l.id === ALPHA).phone = '+918757788550';
    w['public.invoices'].push({ id: 'i-alpha', vendor_id: V.id, lead_id: ALPHA, invoice_number: 'TDW/DEV440/25', client_name: 'Walk Seventeen Alpha', client_phone: invPhone || null, client_id: null, state: 'unpaid', deleted_at: null });
    w['public.payment_schedules'].push(
      { id: 'ms-alpha-dep', invoice_id: 'i-alpha', vendor_id: V.id, milestone_label: 'Deposit', amount_due: 24000, due_date: PR.istDayISO(0), state: 'pending' },
      { id: 'ms-alpha-30', invoice_id: 'i-alpha', vendor_id: V.id, milestone_label: '30%', amount_due: 24000, due_date: PR.istDayISO(76), state: 'pending' },
      { id: 'ms-alpha-rest', invoice_id: 'i-alpha', vendor_id: V.id, milestone_label: 'Remainder', amount_due: 32000, due_date: PR.istDayISO(152), state: 'pending' });
    return w;
  };

  sec('7 · THE CARD IN HIS WORDS, steps 1 to 12, driven in order on ONE estate (the fixture of 23 September: flag off; Alpha\'s one shoot 22 November 2027, crew 0; Sarah\'s invoice paid, nothing pending; step 10b\'s invoice TDW/DEV440/25 on Alpha)');
  {
    capOff();
    const d = db(cardEstate());
    const s = async (said, request) => turnX(d, said, request);
    let x = await s('Add Walk Seventeen Theta to the team', req([assign('Walk Seventeen Theta')]));
    T('7.1 STEP 1 "Add Walk Seventeen Theta to the team" → "Added to the team: Walk Seventeen Theta."', x.reply === 'Added to the team: Walk Seventeen Theta.');
    x = await s('Add Walk Seventeen Theta to the team', req([assign('Walk Seventeen Theta')]));
    T('7.2 STEP 2 the same → "Walk Seventeen Theta is already on your team."', x.reply === 'Walk Seventeen Theta is already on your team.');
    x = await s('Add Walk Seventeen Thta to the team', req([assign('Walk Seventeen Thta')]));
    T('7.3 STEP 3 "Add Walk Seventeen Thta to the team" → "Did you mean Walk Seventeen Theta? Reply YES or NO."', x.reply === 'Did you mean Walk Seventeen Theta? Reply YES or NO.');
    x = await s('No', req([]));
    T('7.4 STEP 4 "No" → "Okay. Nothing was changed."', x.reply === 'Okay. Nothing was changed.' && team(d).length === 1);
    x = await s('Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot', req([assign('Walk Seventeen Theta', 'Walk Seventeen Alpha')]));
    T('7.5 STEP 5 → "Assigned: Walk Seventeen Theta · Walk Seventeen Alpha · shoot · 22 November 2027."', x.reply === 'Assigned: Walk Seventeen Theta · Walk Seventeen Alpha · shoot · 22 November 2027.');
    x = await s('Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot', req([assign('Walk Seventeen Theta', 'Walk Seventeen Alpha')]));
    T('7.6 STEP 6 the same → "Walk Seventeen Theta\'s already on the Walk Seventeen Alpha shoot."', x.reply === "Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot.");
    x = await s('Assign Walk Seventeen Kappa to the Walk Seventeen Alpha shoot', req([assign('Walk Seventeen Kappa', 'Walk Seventeen Alpha')]));
    T('7.7 STEP 7 → "Added to the team: Walk Seventeen Kappa." then, on its own line, "Assigned: Walk Seventeen Kappa · Walk Seventeen Alpha · shoot · 22 November 2027."', x.reply === 'Added to the team: Walk Seventeen Kappa.\n\nAssigned: Walk Seventeen Kappa · Walk Seventeen Alpha · shoot · 22 November 2027.');
    x = await s('Assign to the Walk Seventeen Alpha shoot', req([assign(null, 'Walk Seventeen Alpha')]));
    T('7.8a STEP 8a "Assign to the Walk Seventeen Alpha shoot" → "Who? Say the name."', x.reply === 'Who? Say the name.');
    x = await s('Walk Seventeen Theta', req([]));
    T('7.8b STEP 8b "Walk Seventeen Theta" → "Walk Seventeen Theta\'s already on the Walk Seventeen Alpha shoot."', x.reply === "Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot.");
    x = await s('Add Walk Seventeen Kappa to the team for the 22 November 2027 wedding', req([assign('Walk Seventeen Kappa', null, '22 November 2027')]));
    T('7.9a STEP 9a → "Walk Seventeen Kappa\'s already on the Walk Seventeen Alpha shoot."', x.reply === "Walk Seventeen Kappa's already on the Walk Seventeen Alpha shoot.");
    x = await s('Add Walk Seventeen Kappa to the team for the 8 January 2027 wedding', req([assign('Walk Seventeen Kappa', null, '8 January 2027')]));
    T('7.9b STEP 9b → "No shoot on 8 January 2027."', x.reply === 'No shoot on 8 January 2027.');
    x = await s('Send Sarah a reminder for the payment', req([remind('Sarah')]));
    T('7.10 STEP 10 (runs: the flag is off, R-43.17) → "Nothing is due from Sarah." (THE TREE: her one invoice is paid and nothing is pending, so the gate is never reached); no payment_reminders row', x.reply === 'Nothing is due from Sarah.' && reminders(d).length === 0);
    waSent.length = 0;
    x = await s('Send Walk Seventeen Alpha a reminder for the payment', req([remind('Walk Seventeen Alpha')]));
    const d2 = db(cardEstate('+918757788550')); capOff();
    const x2 = await turnX(d2, 'Send Walk Seventeen Alpha a reminder for the payment', req([remind('Walk Seventeen Alpha')]));
    T('7.10b STEP 10b "Send Walk Seventeen Alpha a reminder for the payment" → "Reminders are switched off for now." (the deposit, due today, inside the window; the switch refused at paymentReminders.js :360 BEFORE the phone at :361, so the same sentence with the invoice phone absent and present); NO payment_reminders row; nothing sent',
      x.reply === SWITCHED_OFF && tc(x)[0].result === 'refused:gate' && tc(x)[0].input.milestone_id === 'ms-alpha-dep' && x2.reply === SWITCHED_OFF && reminders(d).length === 0 && reminders(d2).length === 0 && waSent.length === 0);
    x = await s('Remind Walk Seventeen Alpha about the advance', req([remind('Walk Seventeen Alpha', { milestone: 'advance' })]));
    T('7.11 STEP 11 "Remind Walk Seventeen Alpha about the advance" → "Reminders are switched off for now." (the same deposit picked, the same refusal); still NO payment_reminders row', x.reply === SWITCHED_OFF && reminders(d).length === 0 && waSent.length === 0);
    const { readDaySpine } = require(P('src/lib/vendor/daySheet.js'));
    const sheet = await readDaySpine(d, V.id, '2027-11-22');
    const ids = team(d).filter((m) => m.active).map((m) => m.id).sort();
    T('7.12 STEP 12 (the app): Studio → Team holds Walk Seventeen Theta and Walk Seventeen Kappa (studio/team.js\'s predicate); the day sheet for 22 November 2027 shows both on the Walk Seventeen Alpha shoot', J(team(d).filter((m) => m.active).map((m) => m.name).sort()) === 'Walk Seventeen Kappa,Walk Seventeen Theta' && !!sheet && sheet.ok === true && sheet.events.some((e) => e.title === 'Walk Seventeen Alpha' && J((e.assigned_member_ids || []).map(String).sort()) === J(ids)));
  }

  console.log(`\nb106_lcv14_team_reminder_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(`FAILED: ${failed.join(' · ')}`); process.exit(1); }
}
main().catch((e) => { console.log(`BENCH CRASHED: ${e && e.stack}`); process.exit(1); });
