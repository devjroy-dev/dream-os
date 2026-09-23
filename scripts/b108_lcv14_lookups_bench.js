'use strict';
// scripts/b108_lcv14_lookups_bench.js · TDW CE-45 · LCV-14 · LC-Victor P7 CUT 4: THE LOOKUPS. A request on route 'search' is answered READ ONLY behind the
// route-search gate (workingDoor.js lookupDoor): the new leads (leadFeed.js newLeads, K3's relocation of worklistToday's query, byte-preserved), a day's
// availability (daySheet.js readDaySpine), what's due this week (dueWeek.js); B69 to B74, B78, B79 his (ASK 7: each form its own key); tally, history and a
// lookup naming a client stay B34 (R-45.11's table, sha256 19167fb8789d…: 8 of 8 whatsdue). Rung b108. b107's harness and definitions carried byte for
// byte below this header (b106's and b105's under them: makeDb, world, doubles, withMutated; the PGRST116 double, C-44.3). THE EXIT CODE IS THE VERDICT.
// EVERY CELL THAT CLAIMS A SENTENCE REPLAYS A RECORDED HEARING VERBATIM (C-44.12): the P7 table (sha256 f563b33daa37…) rows 1, 13, 14, 15, 16 and
// R-45.11's table (19167fb8789d…) rows 1 to 4, through the REAL normaliseRequest. Mutations are of PRODUCTION code.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-lcv14-p7-4.txt';
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

  const QUERY4 = "          .select(LEAD_FEED_SELECT)\n          .eq('vendor_id', vendorId).is('deleted_at', null)\n          .eq('state', 'new')\n          .order('created_at', { ascending: true })   // D-4's tie rule: oldest first"; // worklistToday.js :255 to :258 at 23780ed, verbatim
  // ── THE RECORDS, VERBATIM (C-44.12): the P7 table (f563b33daa37…) and R-45.11's table (19167fb8789d…), extracted from the verified CSVs ──
  const P7 = {
    '1/C1/asis': { said: 'Am I free on 14 February?', raw: '{"route":"search","acts":[{"act":"find","date_as_spoken":"14 February","client_as_spoken":""}]}' },
    '1/C2/slots': { said: 'Am I free on 14 February?', raw: '{"route":"search","acts":[{"act":"find","date_as_spoken":"14 February"}]}' },
    '13/C1/asis': { said: 'Who are my new leads?', raw: '{"route":"search","acts":[{"act":"lead","client_as_spoken":"","date_as_spoken":"","missing":[]}]}' },
    '13/C1/slots': { said: 'Who are my new leads?', raw: '{"route":"search","acts":[{"act":"lead"}]}' },
    '13/C2/slots': { said: 'Who are my new leads?', raw: '{"route":"search","acts":[{"act":"find"}]}' },
    '14/C1/slots': { said: "What's due this week?", raw: '{"route":"search","acts":[{"act":"whatsdue","date_as_spoken":"this week","client_as_spoken":"","package_as_spoken":"","phone_as_spoken":"","milestone":"","missing":[],"member_as_spoken":"","reason_as_spoken":"","kind_as_spoken":""}]}' },
    '14/C2/slots': { said: "What's due this week?", raw: '{"route":"search","acts":[{"act":"whatsdue"}]}' },
    '15/C1/slots': { said: 'What happened with the Sharma booking?', raw: '{"route":"search","acts":[{"act":"history","client_as_spoken":"Sharma"}]}' },
    '16/C2/slots': { said: 'How much is owed to me?', raw: '{"route":"search","acts":[{"act":"whatsdue"}]}' },
  };
  const T45 = {
    '2/C1': { said: 'How much do my clients owe me?', raw: '{"route":"search","acts":[{"act":"whatsdue"}]}' },
    '3/C2': { said: "What's my total outstanding?", raw: '{"route":"search","acts":[{"act":"whatsdue"}]}' },
    '4/C1': { said: 'Total owed to me', raw: '{"route":"search","acts":[{"act":"whatsdue","client_as_spoken":"","date_as_spoken":"","missing":[]}]}' },
  };
  const heardRec = (r) => LD.normaliseRequest(JSON.parse(r.raw));
  const LY = (iso) => require(P('src/lib/witnessLine.js')).longDateYear(iso);
  const IC = require(P('src/lib/vendor/istClock.js'));
  // THE LOOKUP ESTATE: two new leads (one dated), a booked lead; on 14 February 2027 a personal block, a reasonless evening block and a shoot, and a
  // CANCELLED shoot that must not show; milestones due in the week of the door's clock and outside it; a shoot in the week and one after it.
  const lookEstate = (nowMs) => {
    const w = estate(); const t = (n) => IC.istPlusDaysISO(n, nowMs || NOW);
    w['public.leads'].find((l) => l.id === ALPHA).state = 'booked'; // as the estate holds it (his fixture: Alpha booked)
    w['public.leads'].push(
      leadRow({ id: 'l-new1', name: 'Walk Eighteen Nu', wedding_date: '2027-05-01', state: 'new', created_at: '2026-09-20T00:00:00Z' }),
      leadRow({ id: 'l-new2', name: 'Walk Eighteen Xi', wedding_date: null, state: 'new', created_at: '2026-09-21T00:00:00Z' }));
    w['public.events'].push(
      evRow({ id: 'e0000000-0000-4000-8000-0000000b0001', kind: 'blocked', title: 'Blocked', event_date: '2027-02-14', notes: 'personal', slot: 'full_day' }),
      evRow({ id: 'e0000000-0000-4000-8000-0000000b0002', kind: 'blocked', title: 'Blocked', event_date: '2027-02-14', notes: null, slot: 'evening' }),
      evRow({ id: 'e0000000-0000-4000-8000-0000000b0003', kind: 'shoot', title: 'Rao', event_date: '2027-02-14' }),
      evRow({ id: 'e0000000-0000-4000-8000-0000000b0004', kind: 'shoot', title: 'Gone', event_date: '2027-02-14', state: 'cancelled' }),
      evRow({ id: 'e0000000-0000-4000-8000-0000000b0005', kind: 'shoot', title: 'Rao', event_date: t(3) }),
      evRow({ id: 'e0000000-0000-4000-8000-0000000b0006', kind: 'shoot', title: 'Later', event_date: t(7) }));
    w['public.invoices'].push({ id: 'i-rao', vendor_id: V.id, lead_id: null, invoice_number: 'TDW/DEV440/30', client_name: 'Rao', client_phone: null, client_id: null, state: 'issued', deleted_at: null });
    w['public.payment_schedules'].push(
      { id: 'ms-w0', invoice_id: 'i-rao', vendor_id: V.id, milestone_label: 'Advance', amount_due: 30000, due_date: t(0), state: 'pending' },
      { id: 'ms-w6', invoice_id: 'i-rao', vendor_id: V.id, milestone_label: 'Second', amount_due: 45000, due_date: t(6), state: 'pending' },
      { id: 'ms-past', invoice_id: 'i-rao', vendor_id: V.id, milestone_label: 'Past', amount_due: 1000, due_date: t(-1), state: 'pending' },
      { id: 'ms-late', invoice_id: 'i-rao', vendor_id: V.id, milestone_label: 'Late', amount_due: 2000, due_date: t(7), state: 'pending' },
      { id: 'ms-paid', invoice_id: 'i-rao', vendor_id: V.id, milestone_label: 'Paid', amount_due: 3000, due_date: t(2), state: 'paid' });
    return w;
  };
  const WEEK = (nowMs) => { const t = (n) => IC.istPlusDaysISO(n, nowMs || NOW); return [`Due this week: Rao · Advance · Rs 30,000 · ${LY(t(0))}.`, `Due this week: Rao · Second · Rs 45,000 · ${LY(t(6))}.`, `This week: Rao · shoot · ${LY(t(3))}.`].join('\n'); };
  const DAY14 = '14 February 2027: blocked — personal.\n14 February 2027: blocked.\n14 February 2027: Rao · shoot';
  const LEADS2 = 'New leads: Walk Eighteen Xi · Walk Eighteen Nu (1 May 2027).'; // RE-PINNED (CE-45 LCV-14, P7 cut 4 fix, R-45.12, labelled): NEWEST first, the door's own read
  const lk = (d, said, h, deps) => turnX(d, said, h, deps || {});

  sec('1 · THE LAWS OF THE CUT (the bytes, the lookups\' door, K3\'s relocation)');
  const EIGHT = { B69: '2529a488e7bc47337286f6737fae1b6fc061cc23c736495266546a307cbda459', B70: '1eb19e7ff80596105866e91a70f1c38ae50991c426035af5ad1d423395d64b31', B71: 'b2a93cd4ed88977434dc30f6dafe1fba387a867a6dccb5bef56b5add43022cdb', B72: 'caae4be489ef24c9743d11dba40370bd211ed83b8a1859a1a6f04b445273baae', B73: '56afe8b641accbc202b22462b85326cdd6c92255e50f00b49dc6bf5b9a00ff0a', B74: '047bd5c99a6e6c5a58fd6ea168a30fdf9d7fa34d0e184f55580937da31ecfdd5', B78: '575f97d619bae91397ffdd31267bc10dfea25b5ae8c12bf83b5e6d498b6d1d4a', B79: '6f951e48eb5ff2bb7e3a2af443de08a1f2bc7aad7aa6ef82a0f372441e6d3e74' };
  T('1.1 LINES 75: the eight of his (B69 to B74, B78, B79), each byte its hash literal; B78 has NO full stop', Object.keys(DL.LINES).length === 79 /* RE-PINNED (CE-45 LCV-14, P7 cut 4 fix, labelled): 79 since B80 to B83, his; b109 holds them */ && Object.keys(EIGHT).every((k) => DL.LINE_HASHES[k] === EIGHT[k] && sha(DL.LINES[k] || '') === EIGHT[k]) && !DL.LINES.B78.endsWith('.'));
  T('1.2 LOOKUP_ACTS is find, whatsdue, date and is NOT in COVERED (a lookup is never a job); COVERED still fourteen', J(WD.LOOKUP_ACTS) === 'find,whatsdue,date' && WD.COVERED.length === 14 && !WD.LOOKUP_ACTS.some((a) => WD.COVERED.includes(a)));
  const LFD = (() => { try { return require(P('src/lib/vendor/leadFeed.js')); } catch (_e) { return {}; } })();
  const WLs = src('src/api/vendor/worklistToday.js'); const LFs = (() => { try { return src('src/lib/vendor/leadFeed.js'); } catch (_e) { return ''; } })();
  T('1.3 K3: leadFeed.js holds KIND_CAP 20 and LEAD_FEED_SELECT; worklistToday requires them back and re-exports the SAME constant', LFD.KIND_CAP === 20 && typeof LFD.LEAD_FEED_SELECT === 'string' && require(P('src/api/vendor/worklistToday.js')).LEAD_FEED_SELECT === LFD.LEAD_FEED_SELECT && /require\('\.\.\/\.\.\/lib\/vendor\/leadFeed'\)/.test(WLs) && !/^const KIND_CAP = 20;/m.test(WLs) && !/^const LEAD_FEED_SELECT\s+=/m.test(WLs));
  T('1.4 K3: the query\'s four middle lines are BYTE-PRESERVED in leadFeed.js (their 23780ed text, sha256 literal) and gone from worklistToday; newLeads RETURNS the unawaited builder', LFs.includes(QUERY4) && sha(QUERY4) === '975914f7a672b90061b1d27047c70b77d0a24f13a560b2eb601fab676ab729a0' && !WLs.includes(QUERY4) && /newLeads\(supabase, vendorId\),/.test(WLs) && (() => { const b = typeof LFD.newLeads === 'function' ? LFD.newLeads(makeDb(lookEstate()), V.id) : null; return !!b && typeof b.then === 'function' && typeof b.select === 'function'; })());
  T('1.5 a lib never imports from a router: leadFeed.js and dueWeek.js require nothing under src/api', !/require\([^)]*api\//.test(LFs) && !/require\([^)]*api\//.test((() => { try { return src('src/lib/vendor/dueWeek.js'); } catch (_e) { return 'require(\'api/\')'; } })()));

  sec('2 · THE RECORDS REPLAYED (the P7 table and R-45.11\'s)');
  {
    for (const k of ['1/C1/asis', '1/C2/slots']) { const x = await lk(db(lookEstate()), P7[k].said, heardRec(P7[k])); T(`2.1 P7 ${k} "${P7[k].said}" → the day's lines, blocks first then the booking; the cancelled shoot never shows`, x.reply === DAY14 && x.said.keys[0] === 'B72'); }
    for (const k of ['13/C1/asis', '13/C1/slots', '13/C2/slots']) { const x = await lk(db(lookEstate()), P7[k].said, heardRec(P7[k])); T(`2.2 P7 ${k} "${P7[k].said}" → B69, newest first (R-45.12), the undated lead by name alone (row 13 C1's lead-on-search is the lookup, F-44.128; never B18)`, x.reply === LEADS2 && x.said.keys[0] === 'B69'); }
    for (const k of ['14/C1/slots', '14/C2/slots']) { const x = await lk(db(lookEstate()), P7[k].said, heardRec(P7[k])); T(`2.3 P7 ${k} "${P7[k].said}" → the week: B73 per milestone due today through today plus six, then B79 per shoot`, x.reply === WEEK()); }
    const s = await lk(db(lookEstate()), P7['15/C1/slots'].said, heardRec(P7['15/C1/slots']));
    T('2.4 P7 15/C1/slots "What happened with the Sharma booking?" (history, a client) → B34, exit lookup (P8\'s)', s.reply === B34 && s.out.why === 'lookup');
    const o = await lk(db(lookEstate()), P7['16/C2/slots'].said, heardRec(P7['16/C2/slots']));
    T('2.5 P7 16/C2/slots "How much is owed to me?" (whatsdue, no day) → the SAME week lines (F-44.129; R-45.11: tally stays B34)', o.reply === WEEK());
    for (const k of Object.keys(T45)) { const x = await lk(db(lookEstate()), T45[k].said, heardRec(T45[k])); T(`2.6 R-45.11 ${k} "${T45[k].said}" → the week lines`, x.reply === WEEK()); }
  }

  sec('3 · AVAILABILITY');
  {
    const x = await lk(db(lookEstate()), 'Am I free on 15 February 2027?', req([{ act: 'find', date_as_spoken: '15 February 2027' }], 'search'));
    T('3.1 a day with no live row → B71 "15 February 2027 is free."', x.reply === '15 February 2027 is free.' && x.said.keys[0] === 'B71');
    const w = lookEstate(); w['public.events'].push(evRow({ kind: 'meeting', title: 'Venue recce call', event_date: '2027-03-01' }));
    const y = await lk(db(w), 'Am I free on 1 March 2027?', req([{ act: 'date', date_as_spoken: '1 March 2027' }], 'search'));
    T('3.2 a non-shoot booking places its own kind word (derived, as B46\'s is); act date is a lookup too', y.reply === '1 March 2027: Venue recce call · meeting');
    const z = await lk(db(lookEstate()), 'Am I free on the blue moon?', req([{ act: 'find', date_as_spoken: 'the blue moon' }], 'search'));
    T('3.3 an unreadable day → B7, and NO note is kept (a lookup keeps no question)', z.reply === DL.LINES.B7 && !z.said.note);
    const f = await lk(db(lookEstate()), 'Am I free on 14 February 2027?', req([{ act: 'find', date_as_spoken: '14 February 2027' }], 'search'), { readDaySpine: async () => ({ ok: false, error: 'down' }) });
    T('3.4 a FAILED read is the glitch line (lookup_unsayable), never "is free" (C-44.4)', f.out.why === 'lookup_unsayable' && f.reply !== '14 February 2027 is free.');
    const n = await lk(db(lookEstate()), 'Is 14 February 2027 free for Rao?', req([{ act: 'find', date_as_spoken: '14 February 2027', client_as_spoken: 'Rao' }], 'search'));
    T('3.5 a lookup naming a CLIENT stays B34 (exit lookup)', n.reply === B34 && n.out.why === 'lookup');
  }

  sec('4 · WHAT\'S DUE THIS WEEK (the window: today through today plus six, IST)');
  {
    const x = await lk(db(lookEstate()), "What's due this week?", req([{ act: 'whatsdue', date_as_spoken: 'this week' }], 'search'));
    T('4.1 today and today plus six are IN; yesterday and today plus seven are OUT; a paid milestone is out; the cancelled and the later shoot are out', x.reply === WEEK() && !/Past|Late|Paid|Later/.test(x.reply));
    const e = lookEstate(); e['public.payment_schedules'] = e['public.payment_schedules'].filter((m) => !/^ms-w/.test(m.id)); e['public.events'] = e['public.events'].filter((v) => v.id !== 'e0000000-0000-4000-8000-0000000b0005');
    const y = await lk(db(e), "What's due this week?", req([{ act: 'whatsdue' }], 'search'));
    T('4.2 nothing in the week → B74 "Nothing due this week."', y.reply === 'Nothing due this week.' && y.said.keys[0] === 'B74');
    const f = await lk(db(lookEstate()), "What's due this week?", req([{ act: 'whatsdue' }], 'search'), { dueThisWeek: async () => ({ ok: false }) });
    T('4.3 a FAILED read is the glitch line, never B74 (C-44.4)', f.out.why === 'lookup_unsayable' && f.reply !== 'Nothing due this week.');
    for (const [label, at] of [['a year\'s end (29 December 2027 IST, the week runs into 2028)', Date.parse('2027-12-29T06:00:00Z')], ['a leap day (26 February 2028 IST, the week holds 29 February)', Date.parse('2028-02-26T06:00:00Z')]]) {
      const z = await lk(db(lookEstate(at)), "What's due this week?", req([{ act: 'whatsdue' }], 'search'), { nowMs: at });
      const t6 = IC.istPlusDaysISO(6, at);
      T(`4.4 the window on ${label}: B73 on today and on ${t6}, B79 on today plus three, nothing from today plus seven`, z.reply === WEEK(at) && (at < Date.parse('2028-01-01') ? t6.startsWith('2028-01') : ['2028-02-29', '2028-03-01', '2028-03-02', '2028-03-03'].includes(t6)));
    }
  }

  sec('5 · THE NEW LEADS');
  {
    const w = lookEstate(); w['public.leads'] = w['public.leads'].filter((l) => l.state !== 'new');
    const x = await lk(db(w), 'Who are my new leads?', req([{ act: 'find' }], 'search'));
    T('5.1 none → B70 "No new leads."', x.reply === 'No new leads.' && x.said.keys[0] === 'B70');
    const v = lookEstate(); v['public.leads'] = v['public.leads'].filter((l) => l.id !== 'l-new2');
    const y = await lk(db(v), 'Who are my new leads?', req([{ act: 'find' }], 'search'));
    T('5.2 one dated lead → "New leads: Walk Eighteen Nu (1 May 2027)." (one, derived and disclosed)', y.reply === 'New leads: Walk Eighteen Nu (1 May 2027).');
    const u = lookEstate(); u['public.leads'] = u['public.leads'].filter((l) => l.state !== 'new');
    for (let i = 0; i < 21; i += 1) u['public.leads'].push(leadRow({ id: `l-c${i}`, name: `Cap ${String(i).padStart(2, '0')}`, state: 'new', created_at: `2026-09-01T00:${String(i).padStart(2, '0')}:00Z` }));
    const z = await lk(db(u), 'Who are my new leads?', req([{ act: 'find' }], 'search'));
    // 5.3 RE-PINNED (CE-45 LCV-14, P7 cut 4 fix, Q4 and R-45.12, labelled): the FIVE newest named, newest first, then the derived tail
    T('5.3 twenty-one new leads → the five NEWEST named, newest first, and "and 16 more." (Q4, R-45.12)', z.reply === 'New leads: Cap 20 · Cap 19 · Cap 18 · Cap 17 · Cap 16 and 16 more.');
    const f = await lk(db(lookEstate()), 'Who are my new leads?', req([{ act: 'find' }], 'search'), { newestLeads: async () => ({ data: null, error: { message: 'down' } }) } /* RE-AIMED (P7 cut 4 fix): the door's own reader */);
    T('5.4 a FAILED read is the glitch line, never B70 (C-44.4)', f.out.why === 'lookup_unsayable' && f.reply !== 'No new leads.');
  }

  sec('6 · WHAT STAYS B34, AND THE LEFTOVER');
  {
    for (const [label, rq] of [['tally naming a client (RE-AIMED, P7 cut 4 fix: tally with no client is answered, b109)', req([{ act: 'tally', client_as_spoken: 'Rao' }], 'search')], ['history with a client', req([{ act: 'history', client_as_spoken: 'Walk Seventeen Alpha' }], 'search')], ['two lookups in one message', req([{ act: 'find' }, { act: 'whatsdue' }], 'search')], ['date with no day', req([{ act: 'date' }], 'search')]]) {
      const x = await lk(db(lookEstate()), 'x y', rq);
      T(`6.1 ${label} → B34, exit lookup; nothing read, nothing written`, x.reply === B34 && x.out.why === 'lookup');
    }
    const draws = new Set(); for (let i = 0; i < 600; i += 1) { const l = await quiet(() => WD.standIn({ supabase: db(estate()), out: { door: false, why: 'uncovered', ear: { request: req([], 'none') } } }, {})); draws.add(l.reply); }
    const all = [...draws].join('\n');
    T('6.2 LEFTOVER examples 3, 7 and 8 switch on ("Am I free on 14 February?", "Who are my new leads?", "What\'s due this week?"): each appears in the stand-in\'s draws', ['Am I free on 14 February?', 'Who are my new leads?', "What's due this week?"].every((e) => all.includes(e)));
  }

  sec('7 · MUTATIONS OF PRODUCTION CODE, each must redden');
  {
    const M = async (name, rel, pairs, drive, cured) => mut(name, rel, pairs, rel === WDf ? [] : [WDf], async () => drive(require(WDP)), (v) => !cured(v));
    await M('7.1 M1 the lookups\' door removed (the gate back to B34 alone) → row 13 C2 reads B34, not B69', WDf, [['return (await lookupDoor(supabase, vendor, heard, nowMs, L, st)) || CHAIN(st.ear, \'lookup\');', 'return CHAIN(st.ear, \'lookup\');']],
      async (Mod) => turnX(db(lookEstate()), P7['13/C2/slots'].said, heardRec(P7['13/C2/slots']), {}, { M: Mod }), (x) => x.reply === LEADS2);
    await M('7.2 M2 the client guard removed → a lookup naming a client is answered (3.5 reddens)', WDf, [['    if (spokenText(a.client_as_spoken)) return null; // a lookup WITH a client stays B34\n', '']],
      async (Mod) => turnX(db(lookEstate()), 'Is 14 February 2027 free for Rao?', req([{ act: 'find', date_as_spoken: '14 February 2027', client_as_spoken: 'Rao' }], 'search'), {}, { M: Mod }), (x) => x.reply === B34);
    await M('7.3 M3 the week read from yesterday (window off by one) → the past milestone shows', 'src/lib/vendor/dueWeek.js', [['const from = istTodayISO(now);', 'const from = istPlusDaysISO(-1, now);']],
      async (Mod) => turnX(db(lookEstate()), "What's due this week?", req([{ act: 'whatsdue' }], 'search'), {}, { M: Mod }), (x) => x.reply === WEEK());
    await M('7.4 M4 the cancelled filter removed from the day\'s spine → the cancelled shoot shows on 14 February', 'src/lib/vendor/daySheet.js', [["    .neq('state', 'cancelled')\n", '']],
      async (Mod) => turnX(db(lookEstate()), P7['1/C2/slots'].said, heardRec(P7['1/C2/slots']), {}, { M: Mod }), (x) => x.reply === DAY14);
    await M('7.5 M5 the failed-read guard removed from dueWeek → a failed read reads as an empty week (B74)', 'src/lib/vendor/dueWeek.js', [["    if (mErr || !Array.isArray(ms)) return { ok: false };", "    if (mErr) return { ok: true, payments: [], shoots: [] };"]],
      async (Mod) => { const d = db(lookEstate()); const o = d.from; d.from = (n) => { const b = o(n); if (n === 'payment_schedules') { b.then = (res) => Promise.resolve({ data: null, error: { message: 'down' } }).then(res); } return b; }; return turnX(d, "What's due this week?", req([{ act: 'whatsdue' }], 'search'), {}, { M: Mod }); },
      (x) => x.out.why === 'lookup_unsayable');
    // 7.6 RE-AIMED (CE-45 LCV-14, P7 cut 4 fix, labelled): the cap is now Q4's five; the mutation removes the five
    await M('7.6 M6 the five removed → twenty-one names spoken', WDf, [['const shown = named.slice(0, 5);', 'const shown = named;']],
      async (Mod) => { const u = lookEstate(); u['public.leads'] = u['public.leads'].filter((l) => l.state !== 'new'); for (let i = 0; i < 21; i += 1) u['public.leads'].push(leadRow({ id: `l-c${i}`, name: `Cap ${String(i).padStart(2, '0')}`, state: 'new', created_at: `2026-09-01T00:${String(i).padStart(2, '0')}:00Z` })); return turnX(db(u), 'Who are my new leads?', req([{ act: 'find' }], 'search'), {}, { M: Mod }); },
      (x) => !x.reply.includes('Cap 00'));
  }

  sec('8 · THE LAWS');
  {
    const blob = (rel) => { const b = fs.readFileSync(P(rel)); return crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`), b])).digest('hex'); };
    const MONEY = { planMoney: '2a7a1c76bf2efeabec03301805e5d5d2bdb38b310940284935496dad8b7f7efb', planPayment: 'cddb6c299afe946ddfddf89cebb3a815c13db38cbd17c863a2b23a677244483e', planBooking: '086fbb9debf6a62fa52a8306037adef47cc1ece4e2ce2efd7e2c684a27e6a3fa', applyRow: '01f76e676659e01c3f0dd92b560726fcde136a8be4bcf3a12adf120cc7fc1b4b', reread: 'e200a0f720c62637ea617ccacb508c9b7a0b58f49e7848323c5eff5a7bcdc8fc' };
    T('8.1 the money functions hash to their f24ffd9 text', Object.keys(MONEY).every((k) => typeof WD[k] === 'function' && sha(WD[k].toString()) === MONEY[k]));
    const cur = src(WDf); const a = cur.indexOf('    // 1 · the pending check, BEFORE the listener'); const b = cur.indexOf('    const liveAtStart');
    T('8.2 the live-row block hashes to its f24ffd9 text', a > 0 && b > a && sha(cur.slice(a, b)) === '5289029740782e70dcfb678590d0f8eebaa363a0c8e806c3496b97714edf2e18');
    const HANDS_BLOBS = { 'src/lib/vendor/eventWrite.js': 'c425bd543756a73fdb4d44ebae56f44436b4c638', 'src/lib/vendor/availability.js': '259772903012b0a46c852ce6a4ad4c8cfdaf3b70', 'src/lib/vendor/lifecycleHands.js': '30259a6a66cc44ca3455b152465338f31a3771b4', 'src/lib/vendor/paymentReminders.js': '60ff12d09aa17cc2e03e1cbcf4e0eac0682e3eea', 'src/lib/vendor/pendingMoneyActs.js': 'd88f70e5b4166657feb4f4306588c056e3683cc2', 'src/lib/vendor/listenerDoor.js': '6d86a8ffd2e15d865e66d65023b4b902fea93693', 'src/lib/vendor/daySheet.js': '212d3a0047d3840622f7696456cbe7390b3d6685', 'src/api/vendor/reminders.js': '909398ac3f6fe9257077d72778cc3f93dccce1fe', 'src/lib/vendor/istClock.js': 'b8cf2b8b9b07418cefe27cdac38d7d421fa967a1' };
    T('8.3 eventWrite, availability, lifecycleHands, paymentReminders, pendingMoneyActs, listenerDoor, daySheet, reminders.js and istClock.js are byte for byte their 23780ed blobs (no listener byte; the spine called as it stands)', Object.keys(HANDS_BLOBS).every((r) => blob(r) === HANDS_BLOBS[r]));
    const man = (() => { try { return src(MAN).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')); } catch (_e) { return []; } })();
    T('8.4 the manifest names the cut\'s files and none of the hands above', man.includes(WDf) && man.includes(DLf) && man.includes('src/lib/vendor/leadFeed.js') && man.includes('src/lib/vendor/dueWeek.js') && man.includes('src/api/vendor/worklistToday.js') && !Object.keys(HANDS_BLOBS).some((r) => man.includes(r)));
  }

  sec('9 · CARD 4 IN HIS WORDS, on the lookup estate, the ear as the P7 table recorded it');
  {
    const d = db(lookEstate());
    let x = await turnX(d, 'Who are my new leads?', heardRec(P7['13/C2/slots']));
    T('9.1 STEP 1 "Who are my new leads?" → B69 naming exactly the new leads, newest first (R-45.12)', x.reply === LEADS2);
    x = await turnX(d, 'Am I free on 14 February 2027?', req([{ act: 'find', date_as_spoken: '14 February 2027' }], 'search'));
    T('9.2 STEP 2 "Am I free on 14 February 2027?" → the day\'s lines (B72, B72 derived, B78)', x.reply === DAY14);
    x = await turnX(d, "What's due this week?", heardRec(P7['14/C1/slots']));
    T('9.3 STEP 3 "What\'s due this week?" → the week\'s lines (B73, B73, B79)', x.reply === WEEK());
    const y = await turnX(d, 'How much is owed to me?', heardRec(P7['16/C2/slots']));
    T('9.4 STEP 4 "How much is owed to me?" → the SAME answer as step 3 (8 of 8 whatsdue on R-45.11\'s table; F-44.129)', y.reply === x.reply);
    x = await turnX(d, 'What happened with the Walk Seventeen Alpha booking?', req([{ act: 'history', client_as_spoken: 'Walk Seventeen Alpha' }], 'search'));
    T('9.5 STEP 5 "What happened with the Walk Seventeen Alpha booking?" → "I cannot do that by message yet. Use the app for it." (P8\'s)', x.reply === 'I cannot do that by message yet. Use the app for it.');
  }

  console.log(`\nb108_lcv14_lookups_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(`FAILED: ${failed.join(' · ')}`); process.exit(1); }
}
main().catch((e) => { console.log(`BENCH CRASHED: ${e && e.stack}`); process.exit(1); });
