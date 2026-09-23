'use strict';
// scripts/b109_lcv14_lookups_fix_bench.js · TDW CE-45 · LCV-14 · LC-Victor P7 CUT 4 FIX: F-44.136 (a new lead with no name broke the whole answer), Q4 (the five
// newest named, the derived tail "and {n} more."), R-45.12 (newest first, the door's own read; the app's feed unchanged), B81/B83 (the nameless counted), and
// the tally (B80, B82; LEDGER_UNREADABLE REUSED on a failed read) on invoices.js readOutstanding AS IT STANDS. Rung b109. b108's harness and definitions
// carried byte for byte below this header (b107's, b106's and b105's under them; the PGRST116 double, C-44.3). THE EXIT CODE IS THE VERDICT.
// The founder's walk of cut 4 (thread export sha256 prefix 43088a09bade; fixture 31cbb18cbd61: 45 new leads, 11 with NO name) is the record the nameless
// cells replay in shape. Mutations are of PRODUCTION code.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-lcv14-p7-4-fix1.txt';
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

  // ── THE FIX'S ESTATES ──
  // nl(id, name, createdIso): a live new lead; name null or blank is NAMELESS
  const nl = (id, name, created) => leadRow({ id, name, state: 'new', created_at: created });
  const withLeads = (list) => { const w = lookEstate(); w['public.leads'] = w['public.leads'].filter((l) => l.state !== 'new').concat(list); return w; };
  // HIS ESTATE IN SHAPE (the fixture of 23 September): 34 named new leads and 11 nameless, the nameless NOT the newest
  const hisShape = (nameless) => { const l = []; for (let i = 0; i < 34; i += 1) l.push(nl(`l-n${i}`, `Named ${String(i).padStart(2, '0')}`, `2026-08-${String(1 + (i % 28)).padStart(2, '0')}T${String(10 + Math.floor(i / 28)).padStart(2, '0')}:00:00Z`)); for (let i = 0; i < nameless; i += 1) l.push(nl(`l-x${i}`, i % 2 ? '   ' : null, `2026-09-0${5 + (i % 5)}T0${i % 10}:00:00Z`)); return withLeads(l); };
  const newest5 = (w) => w['public.leads'].filter((l) => l.state === 'new' && typeof l.name === 'string' && l.name.trim()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 5).map((l) => l.name);
  const inv = (id, total, paid, state, extra) => Object.assign({ id, vendor_id: V.id, lead_id: null, invoice_number: `TDW/DEV440/${id}`, client_name: `C${id}`, client_phone: null, client_id: null, amount_total: total, amount_paid: paid, due_date: null, state, created_at: `2026-09-0${1 + (id.length % 8)}T00:00:00Z`, deleted_at: null, lead_package_id: null }, extra || {});
  const owedEstate = (list) => { const w = lookEstate(); w['public.invoices'] = list; return w; };
  const FIND = req([{ act: 'find' }], 'search'); const TALLY = req([{ act: 'tally' }], 'search');
  const LEDGER = require(P('src/lib/victorLines.js')).VICTOR_LINES.LEDGER_UNREADABLE;

  sec('1 · THE LAWS OF THE FIX');
  const FOUR = { B80: '08f216a15644ce1b9202096dac24349c2d8cc0e16f022891bb9d87110af61ea2', B81: 'f32090f8bc1ba08c6b14f85182ef9bc3a639c9b50cd790e65313181d0f85d5cd', B82: '70d5189141b9cbd8092834919995f3cb16edadff17d2023989d26cf6ef49435b', B83: 'ec1816251b9cfde6078edb4da2fa4b4499c9b7d68ec38ae17d6e09b17c7497e0' };
  T('1.1 LINES 79: B80 to B83 his, each byte its hash literal; B83 is B81\'s singular, its own key', Object.keys(DL.LINES).length === 79 && Object.keys(FOUR).every((k) => DL.LINE_HASHES[k] === FOUR[k] && sha(DL.LINES[k] || '') === FOUR[k]));
  const LFD = (() => { try { return require(P('src/lib/vendor/leadFeed.js')); } catch (_e) { return {}; } })(); const LFs = (() => { try { return src('src/lib/vendor/leadFeed.js'); } catch (_e) { return ''; } })();
  T('1.2 R-45.12: leadFeed.js exports newestLeads (the same select, created_at DESCENDING, a ceiling of 500) beside newLeads, whose four query lines are still byte-preserved', LFD.NEWEST_CAP === 500 && typeof LFD.newestLeads === 'function' && /order\('created_at', \{ ascending: false \}\)[\s\S]*limit\(NEWEST_CAP\)/.test(LFs) && LFs.includes(QUERY4) && /\.order\('created_at', \{ ascending: true \}\)   \/\/ D-4's tie rule: oldest first/.test(LFs));
  const blob = (rel) => { const b = fs.readFileSync(P(rel)); return crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`), b])).digest('hex'); };
  T('1.3 the books reader is called AS IT STANDS: invoices.js and victorLines.js are their 7687acd blobs (readOutstanding, LEDGER_UNREADABLE in their homes)', blob('src/lib/vendor/invoices.js') === '917c5660ae2bd5df7351ff1aefe9681df0d51064' && blob('src/lib/victorLines.js') === 'cb147326af0739e110cb07405b6c4abd5b137eff');

  sec('2 · F-44.136: A LEAD WITH NO NAME NEVER BREAKS THE ANSWER (the founder\'s estate in shape: 34 named, 11 nameless)');
  {
    const w = hisShape(11); const top = newest5(w);
    const x = await lk(db(w), 'Who are my new leads?', FIND);
    T('2.1 his shape → the FIVE newest named, newest first, "and 29 more.", then B81 "11 new enquiries have no name yet. Add their names in the app." (was the glitch line on his walk)', x.reply === `New leads: ${top.join(' · ')} and 29 more.\n11 new enquiries have no name yet. Add their names in the app.` && x.said.keys[0] === 'B69');
    const y = await lk(db(hisShape(1)), 'Who are my new leads?', FIND);
    T('2.2 exactly one nameless → B83 "1 new enquiry has no name yet. Add its name in the app."', y.reply.endsWith('\n1 new enquiry has no name yet. Add its name in the app.'));
    const z = await lk(db(hisShape(0)), 'Who are my new leads?', FIND);
    T('2.3 THE CLEARED ESTATE (card 5): 34 named, none nameless → five and "and 29 more.", no nameless line', z.reply === `New leads: ${newest5(hisShape(0)).join(' · ')} and 29 more.`);
    const a = await lk(db(withLeads([nl('l-a', null, '2026-09-01T00:00:00Z'), nl('l-b', '', '2026-09-02T00:00:00Z')])), 'Who are my new leads?', FIND);
    T('2.4 only nameless leads → B81 alone (never B70: leads exist)', a.reply === '2 new enquiries have no name yet. Add their names in the app.' && a.said.keys[0] === 'B81');
    const b = await lk(db(withLeads([nl('l-a', 'Only One', '2026-09-01T00:00:00Z')])), 'Who are my new leads?', FIND);
    T('2.5 one named, none more → "New leads: Only One." (no tail)', b.reply === 'New leads: Only One.');
    const c = await lk(db(withLeads([])), 'Who are my new leads?', FIND);
    T('2.6 none at all → B70', c.reply === 'No new leads.');
  }

  sec('3 · R-45.12: NEWEST FIRST, AND THE CEILING');
  {
    const w = withLeads([nl('l-old', 'Oldest', '2026-01-01T00:00:00Z'), nl('l-mid', 'Middle', '2026-05-01T00:00:00Z'), nl('l-new', 'Newest', '2026-09-01T00:00:00Z')]);
    const x = await lk(db(w), 'Who are my new leads?', FIND);
    T('3.1 newest first: "New leads: Newest · Middle · Oldest."', x.reply === 'New leads: Newest · Middle · Oldest.');
    const many = []; for (let i = 0; i < 500; i += 1) many.push({ id: `c${i}`, name: `Cap ${i}`, wedding_date: null, state: 'new', created_at: `2026-09-01T00:00:00Z` });
    const y = await lk(db(lookEstate()), 'Who are my new leads?', FIND, { newestLeads: async () => ({ data: many, error: null }), newLeadsCount: async () => ({ count: 540, error: null }) });
    T('3.2 the 500 ceiling met → the separate head-count: 540 live, five spoken, "and 535 more." (the rows beyond the ceiling counted as named, disclosed)', y.reply === 'New leads: Cap 0 · Cap 1 · Cap 2 · Cap 3 · Cap 4 and 535 more.');
    const f = await lk(db(lookEstate()), 'Who are my new leads?', FIND, { newestLeads: async () => ({ data: many, error: null }), newLeadsCount: async () => ({ count: null, error: { message: 'down' } }) });
    T('3.3 the head-count failing → the glitch line (lookup_unsayable), never a guessed count (C-44.4)', f.out.why === 'lookup_unsayable');
  }

  sec('4 · THE TALLY (readOutstanding, AS IT STANDS)');
  {
    const list = [inv('1', 100000, 30000, 'advance_paid'), inv('2', 50000, 0, 'unpaid'), inv('3', 80000, 80000, 'paid'), inv('4', 20000, 0, 'cancelled'), inv('5', 9000, 0, 'unpaid', { deleted_at: '2026-09-10T00:00:00Z' }), inv('6', 1000, 0, 'unpaid', { vendor_id: 'v-other' })];
    const x = await lk(db(owedEstate(list)), 'Give me my total owed', TALLY);
    T('4.1 tally → B80 "Owed to you: Rs 1,20,000 across 2 open invoices." (unpaid and advance_paid only; paid, cancelled, deleted and another vendor\'s out)', x.reply === 'Owed to you: Rs 1,20,000 across 2 open invoices.' && x.said.keys[0] === 'B80');
    const y = await lk(db(owedEstate([inv('3', 80000, 80000, 'paid')])), 'Give me my total owed', TALLY);
    T('4.2 a zero total → B82 "Nothing is owed to you right now."', y.reply === 'Nothing is owed to you right now.' && y.said.keys[0] === 'B82');
    const z = await lk(db(owedEstate(list)), 'Give me my total owed', TALLY, { readOutstanding: async () => ({ ok: false, error: 'down' }) });
    T('4.3 a FAILED books read → his LEDGER_UNREADABLE REUSED verbatim (the invoice plane\'s fail-closed sentence), never B82 (C-44.4)', z.reply === LEDGER && z.reply !== 'Nothing is owed to you right now.');
    const c = await lk(db(owedEstate(list)), 'What does Rao owe me?', req([{ act: 'tally', client_as_spoken: 'Rao' }], 'search'));
    T('4.4 tally naming a client stays B34 (exit lookup)', c.reply === B34 && c.out.why === 'lookup');
    const d = await lk(db(owedEstate(list)), 'How much is owed to me?', req([{ act: 'tally' }], 'search'));
    T('4.5 "How much is owed to me?" heard as tally (his live walk, 15:26:33 UTC) → B80', d.reply === 'Owed to you: Rs 1,20,000 across 2 open invoices.');
  }

  sec('5 · MUTATIONS OF PRODUCTION CODE, each must redden');
  {
    const M = async (name, rel, pairs, drive, cured) => mut(name, rel, pairs, rel === WDf ? [] : [WDf], async () => drive(require(WDP)), (v) => !cured(v));
    await M('5.1 M1 the order flipped back to oldest first (leadFeed.js newestLeads) → 3.1 reddens', 'src/lib/vendor/leadFeed.js', [["    .order('created_at', { ascending: false })\n    .limit(NEWEST_CAP);", "    .order('created_at', { ascending: true })\n    .limit(NEWEST_CAP);"]],
      async (Mod) => turnX(db(withLeads([nl('l-old', 'Oldest', '2026-01-01T00:00:00Z'), nl('l-new', 'Newest', '2026-09-01T00:00:00Z')])), 'Who are my new leads?', FIND, {}, { M: Mod }), (x) => x.reply === 'New leads: Newest · Oldest.');
    await M('5.2 M2 the nameless split removed (every lead handed to the builder) → his shape reads the glitch line again (F-44.136 undone)', WDf, [["const named = data.filter((l) => l && typeof l.name === 'string' && l.name.trim());", 'const named = data;']],
      async (Mod) => turnX(db(hisShape(11)), 'Who are my new leads?', FIND, {}, { M: Mod }), (x) => x.said.keys[0] === 'B69');
    await M('5.3 M3 the singular dropped (B81 for one) → 2.2 reddens', 'src/lib/vendor/doorLines.js', [["return n === 1 ? LINES.B83 : render('B81', { n });", "return render('B81', { n });"]],
      async (Mod) => turnX(db(hisShape(1)), 'Who are my new leads?', FIND, {}, { M: Mod }), (x) => x.reply.endsWith('\n1 new enquiry has no name yet. Add its name in the app.'));
    await M('5.4 M4 the zero branch removed → "Owed to you: Rs 0 …" in place of B82', WDf, [["      if (total <= 0) return answer(DL.LINES.B82, 'B82', 'lookup_owed');\n", '']],
      async (Mod) => turnX(db(owedEstate([inv('3', 80000, 80000, 'paid')])), 'Give me my total owed', TALLY, {}, { M: Mod }), (x) => x.reply === 'Nothing is owed to you right now.');
    await M('5.5 M5 a failed read read as zero → B82 where LEDGER_UNREADABLE must speak', WDf, [["      if (!r || r.ok !== true || !r.summary) { const ledger = require('../victorLines').VICTOR_LINES.LEDGER_UNREADABLE; return answer(ledger, 'LEDGER_UNREADABLE', 'lookup_owed'); }", "      if (!r || r.ok !== true || !r.summary) return answer(DL.LINES.B82, 'B82', 'lookup_owed');"]],
      async (Mod) => turnX(db(owedEstate([])), 'Give me my total owed', TALLY, { readOutstanding: async () => ({ ok: false }) }, { M: Mod }), (x) => x.reply === LEDGER);
    await M('5.6 M6 the tail dropped (more named leads silently unsaid) → 2.3 reddens', 'src/lib/vendor/doorLines.js', [["return `${head}${parts.join(' · ')}${m ? ` and ${m} more.` : '.'}`;", "return `${head}${parts.join(' · ')}.`;"]],
      async (Mod) => turnX(db(hisShape(0)), 'Who are my new leads?', FIND, {}, { M: Mod }), (x) => x.reply.endsWith(' and 29 more.'));
  }

  sec('6 · THE LAWS');
  {
    const MONEY = { planMoney: '2a7a1c76bf2efeabec03301805e5d5d2bdb38b310940284935496dad8b7f7efb', planPayment: 'cddb6c299afe946ddfddf89cebb3a815c13db38cbd17c863a2b23a677244483e', planBooking: '086fbb9debf6a62fa52a8306037adef47cc1ece4e2ce2efd7e2c684a27e6a3fa', applyRow: '01f76e676659e01c3f0dd92b560726fcde136a8be4bcf3a12adf120cc7fc1b4b', reread: 'e200a0f720c62637ea617ccacb508c9b7a0b58f49e7848323c5eff5a7bcdc8fc' };
    T('6.1 the money functions hash to their f24ffd9 text', Object.keys(MONEY).every((k) => typeof WD[k] === 'function' && sha(WD[k].toString()) === MONEY[k]));
    const cur = src(WDf); const a = cur.indexOf('    // 1 · the pending check, BEFORE the listener'); const b = cur.indexOf('    const liveAtStart');
    T('6.2 the live-row block hashes to its f24ffd9 text', a > 0 && b > a && sha(cur.slice(a, b)) === '5289029740782e70dcfb678590d0f8eebaa363a0c8e806c3496b97714edf2e18');
    T('6.3 worklistToday.js is its 7687acd blob (the app\'s feed untouched by the fix)', blob('src/api/vendor/worklistToday.js') === 'a9b36d192c14d6c2ed6a419d90b6656eb9fa8792');
    const man = (() => { try { return src(MAN).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')); } catch (_e) { return []; } })();
    T('6.4 the manifest names the fix\'s files and neither invoices.js, victorLines.js nor worklistToday.js', man.includes(WDf) && man.includes(DLf) && man.includes('src/lib/vendor/leadFeed.js') && !['src/lib/vendor/invoices.js', 'src/lib/victorLines.js', 'src/api/vendor/worklistToday.js'].some((r) => man.includes(r)));
  }

  sec('7 · CARD 5 IN HIS WORDS, on the CLEARED estate (his nameless leads soft-deleted), steps 1 and 4 re-walked');
  {
    const w = hisShape(0); w['public.invoices'] = w['public.invoices'].filter((i) => i.id === 'i-rao').map((i) => ({ ...i, amount_total: 0, amount_paid: 0, state: 'paid' })).concat([inv('1', 100000, 30000, 'advance_paid'), inv('2', 50000, 0, 'unpaid')]); // Rao's invoice kept for the week's client name, paid so the total is the two open ones
    const d = db(w);
    const x = await turnX(d, 'Who are my new leads?', heardRec(P7['13/C2/slots']));
    T('7.1 STEP 1 "Who are my new leads?" → the five newest named, newest first, "and 29 more."', x.reply === `New leads: ${newest5(w).join(' · ')} and 29 more.`);
    const y = await turnX(d, 'How much is owed to me?', req([{ act: 'tally' }], 'search'));
    T('7.2 STEP 4 "How much is owed to me?" heard as tally (his live ear) → B80 "Owed to you: Rs 1,20,000 across 2 open invoices."', y.reply === 'Owed to you: Rs 1,20,000 across 2 open invoices.');
    const z = await turnX(d, 'How much is owed to me?', heardRec(P7['16/C2/slots']));
    T('7.3 STEP 4 heard as whatsdue (the cold table) → the week\'s lines, as card 4 had them', z.reply === WEEK());
  }

  console.log(`\nb109_lcv14_lookups_fix_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(`FAILED: ${failed.join(' · ')}`); process.exit(1); }
}
main().catch((e) => { console.log(`BENCH CRASHED: ${e && e.stack}`); process.exit(1); });
