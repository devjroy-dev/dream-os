'use strict';
// LABELED AMENDMENT · CE-45 ELZ-1 cut 2a (R-45.23, the founder's V1 to V8, 25 September 2026): B4, B5, B25, B32, B33, B39, B60 and B76
// re-pinned to his new bytes (templates, rendered forms and hashes); what each cell proves is unchanged (LSP_2's precedent; e-136's re-cut).
// scripts/b107_lcv14_kind_client_bench.js · TDW CE-45 · LCV-14 · LC-Victor P7 CUT 3 FIX 1: F-44.133, THE DOOR READS THE CLIENT OUT OF THE KIND (the chair's ruling (i),
// 23 September 2026). On an assign_crew with no client_as_spoken, a kind_as_spoken that is not one of eventWrite's CALENDAR_KINDS, minus one trailing
// calendar kind word, is the client, resolved through the ONE home. Rung b107. b106's harness and definitions carried byte for byte below this header
// (b105's harness under them: makeDb, world, doubles, withMutated; the PGRST116 double, C-44.3). THE EXIT CODE IS THE VERDICT.
// EVERY CELL THAT CLAIMS A SENTENCE REPLAYS A RECORDED HEARING VERBATIM (C-44.12): the five F-44.133 turns of the cut 3 walk (the founder's thread export of
// 23 September 2026, sha256 prefix b02566fba96b), through the REAL normaliseRequest, on the estate that walk stood on. Mutations are of PRODUCTION code.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-lcv14-p7-3-fix1.txt';
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

  // F-44.133 · THE FIVE HEARD RECORDS OF THE CUT 3 WALK, VERBATIM (thread export Supabase_Snippet_Untitled_query__17_.csv, sha256 prefix b02566fba96b; times UTC), extracted by script
  const WALK = [
    { at: "10:34:00", said: "Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot", heard: "{\"acts\":[{\"act\":\"assign_crew\",\"kind_as_spoken\":\"Walk Seventeen Alpha shoot\",\"member_as_spoken\":\"Walk Seventeen Theta\"}],\"route\":\"task\"}" },
    { at: "10:34:12", said: "Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot", heard: "{\"acts\":[{\"act\":\"assign_crew\",\"kind_as_spoken\":\"Walk Seventeen Alpha shoot\",\"member_as_spoken\":\"Walk Seventeen Theta\"}],\"route\":\"task\"}" },
    { at: "10:34:30", said: "Assign Walk Seventeen Kappa to the Walk Seventeen Alpha shoot", heard: "{\"acts\":[{\"act\":\"assign_crew\",\"kind_as_spoken\":\"Walk Seventeen Alpha shoot\",\"member_as_spoken\":\"Walk Seventeen Kappa\"}],\"route\":\"task\"}" },
    { at: "10:35:08", said: "Assign to the Walk Seventeen Alpha shoot", heard: "{\"acts\":[{\"act\":\"assign_crew\",\"kind_as_spoken\":\"Walk Seventeen Alpha shoot\"}],\"route\":\"task\"}" },
    { at: "10:35:22", said: "Walk Seventeen Theta", heard: "{\"acts\":[{\"act\":\"assign_crew\",\"kind_as_spoken\":\"Walk Seventeen Alpha shoot\",\"member_as_spoken\":\"Walk Seventeen Theta\"}],\"route\":\"task\"}" },
  ];
  const LK = { calendarKinds: require(P('src/lib/vendor/eventWrite.js')).CALENDAR_KINDS };
  const walkHeard = (i) => LD.normaliseRequest(JSON.parse(WALK[i].heard));
  // THE ESTATE THE CUT 3 WALK STOOD ON AT 10:34:00 UTC (its thread and exports): Theta on the team (added at step 1), NOT on the crew; Kappa not on the team; the
  // Walk Seventeen Alpha shoot on 22 November 2027, crew empty.
  const THETA = 'ab47e7a0-6454-4a85-a398-5cec2d47001f'; const KAPPA = '223f3dc3-84e6-4ec6-9a79-b6491f5c91c9';
  const atStep5 = () => { const w = estate(); w['public.team_members'] = [tmRow({ id: THETA, name: 'Walk Seventeen Theta', created_at: '2026-09-23T10:33:07Z' })]; return w; };
  // THE ESTATE THE WALK LEFT (the founder's exports): Theta and Kappa on the team; the shoot's crew [Kappa]
  const leftByWalk = () => { const w = atStep5(); w['public.team_members'].push(tmRow({ id: KAPPA, name: 'Walk Seventeen Kappa', created_at: '2026-09-23T10:34:30Z' })); w['public.events'][0].assigned_member_ids = [KAPPA]; return w; };

  sec('1 · kindClient (the door\'s own read), and its controls');
  T('1.1 "Walk Seventeen Alpha shoot" (the walk\'s kind) → "Walk Seventeen Alpha": ONE trailing calendar kind word dropped', typeof WD.kindClient === 'function' && WD.kindClient({ kind_as_spoken: 'Walk Seventeen Alpha shoot' }, LK) === 'Walk Seventeen Alpha');
  T('1.2 CONTROL: "shoot" alone (any case) is the KIND and never a client; so is every CALENDAR_KIND', typeof WD.kindClient === 'function' && WD.kindClient({ kind_as_spoken: 'shoot' }, LK) === null && WD.kindClient({ kind_as_spoken: 'Shoot' }, LK) === null && LK.calendarKinds.every((k) => WD.kindClient({ kind_as_spoken: k }, LK) === null));
  T('1.3 another calendar kind word trails too ("Verma recce" → "Verma"); a kind of no calendar word is read whole', typeof WD.kindClient === 'function' && WD.kindClient({ kind_as_spoken: 'Verma recce' }, LK) === 'Verma' && WD.kindClient({ kind_as_spoken: 'Verma wedding' }, LK) === 'Verma wedding');
  const HOST = [undefined, null, 0, '', '   ', [], {}, { kind_as_spoken: 7 }, { kind_as_spoken: {} }, { get kind_as_spoken() { throw new Error('x'); } }];
  let thrown = 0; for (const h of HOST) for (const l of [undefined, null, {}, LK, { calendarKinds: 'x' }]) { try { if (typeof WD.kindClient === 'function' && WD.kindClient(h, l) !== null) thrown += 1; } catch (_e) { thrown += 1; } }
  T('1.4 TOTAL: hostile acts and hostile L (fifty pairs) read null and never throw', typeof WD.kindClient === 'function' && thrown === 0);

  sec('2 · THE FIVE WALK TURNS, REPLAYED VERBATIM on the estate they met (F-44.133)');
  {
    const d = db(atStep5());
    let x = await turnX(d, WALK[0].said, walkHeard(0));
    T(`2.1 ${WALK[0].at} "${WALK[0].said}" as heard → "Assigned: Walk Seventeen Theta · Walk Seventeen Alpha · shoot · 22 November 2027." (was B57 on the walk); the crew holds Theta`, x.reply === 'Assigned: Walk Seventeen Theta · Walk Seventeen Alpha · shoot · 22 November 2027.' && J(crewOf(d, SHOOT)) === THETA);
    x = await turnX(d, WALK[1].said, walkHeard(1));
    T(`2.2 ${WALK[1].at} the same, as heard → "Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot." (was B57)`, x.reply === "Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot.");
    x = await turnX(d, WALK[2].said, walkHeard(2));
    T(`2.3 ${WALK[2].at} "${WALK[2].said}" as heard → B56 then B58 on two lines (was B56 alone); the crew holds Theta and Kappa`, x.reply === 'Added to the team: Walk Seventeen Kappa.\n\nAssigned: Walk Seventeen Kappa · Walk Seventeen Alpha · shoot · 22 November 2027.' && crewOf(d, SHOOT).length === 2);
    x = await turnX(d, WALK[3].said, walkHeard(3));
    T(`2.4 ${WALK[3].at} "${WALK[3].said}" as heard → B62 with a MEMBER note that carries the kind (the client inside it)`, x.reply === 'Who? Say the name.' && noteIn(d).asked === 'B62' && noteIn(d).acts[0].kind_as_spoken === 'Walk Seventeen Alpha shoot');
    x = await turnX(d, WALK[4].said, walkHeard(4));
    T(`2.5 ${WALK[4].at} (door row; her message 10:35:21) "${WALK[4].said}" as heard → "Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot." (was B57)`, x.reply === "Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot." && x.said.answered === 'B62');
    T('2.6 THE RECORD IS UNTOUCHED: the door\'s row keeps what was HEARD (kind_as_spoken, no client_as_spoken)', (() => { const r = lastDoor(d); const q = r && r.meta && r.meta.listener && r.meta.listener.request; return !!q && q.acts[0].kind_as_spoken === 'Walk Seventeen Alpha shoot' && !('client_as_spoken' in q.acts[0]); })());
  }
  {
    const d = db(atStep5());
    const x = await turnX(d, 'Assign Walk Seventeen Theta to the Walk Seventeen Zeta shoot', req([{ act: 'assign_crew', member_as_spoken: 'Walk Seventeen Theta', kind_as_spoken: 'Walk Seventeen Zeta shoot' }]));
    T('2.7 the client read from the kind goes through the ONE home: a name that is no lead → B76', x.reply === 'No lead called Walk Seventeen Zeta. Add Walk Seventeen Zeta as a lead first, here or in the app.');
    const y = await turnX(d, 'Assign Walk Seventeen Theta to the Walk Seventeen Alpa shoot', req([{ act: 'assign_crew', member_as_spoken: 'Walk Seventeen Theta', kind_as_spoken: 'Walk Seventeen Alpa shoot' }]));
    T('2.8 … and a near name → B36 (slot client), nothing written', y.reply === B36('Walk Seventeen Alpha') && noteIn(d).slot === 'client' && crewOf(d, SHOOT).length === 0);
    const z = await turnX(db(atStep5()), 'Add Walk Seventeen Theta to the team', /* a fresh estate: 2.8 left an offer note on d */ req([{ act: 'assign_crew', member_as_spoken: 'Walk Seventeen Theta', kind_as_spoken: 'shoot' }]));
    T('2.9 CONTROL: kind "shoot" alone with no client and no day is still a TEAM ADD (B57), never B76', z.reply === 'Walk Seventeen Theta is already on your team.');
    const w = await turnX(db(atStep5()), 'Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot', req([{ act: 'assign_crew', member_as_spoken: 'Walk Seventeen Theta', client_as_spoken: 'Walk Seventeen Alpha', kind_as_spoken: 'Walk Seventeen Zeta shoot' }]));
    T('2.10 a heard client_as_spoken WINS over the kind (the read fires only when no client was heard)', w.reply === 'Assigned: Walk Seventeen Theta · Walk Seventeen Alpha · shoot · 22 November 2027.');
  }

  sec('3 · MUTATIONS OF PRODUCTION CODE (workingDoor.js), each must redden');
  {
    const M = async (name, pairs, drive, cured) => mut(name, WDf, pairs, [], async () => drive(require(WDP)), (v) => !cured(v));
    await M('3.1 M1 the read removed (F-44.133 undone) → the walk\'s 10:34:00 turn reads B57 again, not B58', [['    const said = spotless(act.client_as_spoken) || kindClient(act, L);', '    const said = spotless(act.client_as_spoken);']],
      async (Mod) => turnX(db(atStep5()), WALK[0].said, walkHeard(0), {}, { M: Mod }), (x) => x.reply === 'Assigned: Walk Seventeen Theta · Walk Seventeen Alpha · shoot · 22 November 2027.');
    await M('3.2 M2 the trailing kind word NOT dropped → "Walk Seventeen Alpha shoot" is no lead, the 10:34:12 turn cannot read B59', [['    if (words.length > 1 && kinds.includes(key(words[words.length - 1]))) words.pop();\n', '']],
      async (Mod) => { const d = db(leftByWalk()); d.tables['public.events'][0].assigned_member_ids = [THETA]; return turnX(d, WALK[1].said, walkHeard(1), {}, { M: Mod }); }, (x) => x.reply === "Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot.");
    await M('3.3 M3 the calendar-kind guard removed → kind "shoot" alone is read as a client (2.9\'s control reddens: B76, not B57)', [['    if (!k || kinds.includes(key(k))) return null;', '    if (!k) return null;']],
      async (Mod) => turnX(db(atStep5()), 'Add Walk Seventeen Theta to the team', req([{ act: 'assign_crew', member_as_spoken: 'Walk Seventeen Theta', kind_as_spoken: 'shoot' }]), {}, { M: Mod }), (x) => x.reply === 'Walk Seventeen Theta is already on your team.');
  }

  sec('4 · THE LAWS');
  {
    const blob = (rel) => { const b = fs.readFileSync(P(rel)); return crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`), b])).digest('hex'); };
    const MONEY = { planMoney: '2a7a1c76bf2efeabec03301805e5d5d2bdb38b310940284935496dad8b7f7efb', planPayment: 'cddb6c299afe946ddfddf89cebb3a815c13db38cbd17c863a2b23a677244483e', planBooking: '086fbb9debf6a62fa52a8306037adef47cc1ece4e2ce2efd7e2c684a27e6a3fa', applyRow: '01f76e676659e01c3f0dd92b560726fcde136a8be4bcf3a12adf120cc7fc1b4b', reread: 'e200a0f720c62637ea617ccacb508c9b7a0b58f49e7848323c5eff5a7bcdc8fc' };
    T('4.1 the money functions hash to their f24ffd9 (and 69f4b99) text', Object.keys(MONEY).every((k) => typeof WD[k] === 'function' && sha(WD[k].toString()) === MONEY[k]));
    const cur = src(WDf); const a = cur.indexOf('    // 1 · the pending check, BEFORE the listener'); const b = cur.indexOf('    const liveAtStart');
    T('4.2 the live-row block hashes to its f24ffd9 text', a > 0 && b > a && sha(cur.slice(a, b)) === '5289029740782e70dcfb678590d0f8eebaa363a0c8e806c3496b97714edf2e18');
    T('4.3 doorLines.js is 69f4b99\'s blob: no byte moved (LINES 67); listenerDoor.js is f24ffd9\'s: no listener byte (the ruling)', blob(DLf) === '4581df9e9b7556d700ca7818600961a0003cfbb8' /* RE-PINNED AGAIN (CE-45 ELZ-1 cut 2c: his five numbered picks and numberedPick) */ /* RE-PINNED AGAIN (CE-45 ELZ-1 cut 2b, labelled: V11 and V13, and sortedNames given one home) */ /* RE-PINNED (CE-45 ELZ-1 cut 2a, labelled: R-45.23's V1 to V8 moved eight bytes; b107's own cut moved none, which the rest of the cell still proves by the LINES count) */ /* RE-PINNED (CE-45 LCV-15, LSP_2, labelled): B84 and B85, his (b112 3.5); at e813d3f b2d15fd5ea6b */ /* RE-PINNED (CE-45 LCV-14, P7 cut 4 fix, labelled): B80 to B83 (b109 1.1); at 7687acd d8ba5ab4ed4a */ /* RE-PINNED (CE-45 LCV-14, P7 cut 4, labelled): doorLines.js moved by the eight lookup bytes (b108 1.1); at 69f4b99 it was f41dd59d314d */ && blob(LDf) === '6d86a8ffd2e15d865e66d65023b4b902fea93693' && Object.keys(DL.LINES).length === 83 /* RE-PINNED (CE-45 ELZ-1 cut 2b, labelled): B86 and B87 his (F-44.175's stopgap), LINES 83 */ /* RE-PINNED (CE-45 LCV-15, LSP_2, labelled): 79 to 81, B84 and B85, his; b112 holds them */ /* RE-PINNED (CE-45 LCV-14, P7 cut 4 fix, labelled) */ /* RE-PINNED (CE-45 LCV-14, P7 cut 4, labelled) */);
    const man = (() => { try { return src(MAN).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')); } catch (_e) { return []; } })();
    T('4.4 the manifest names workingDoor.js and b107, and neither doorLines.js nor listenerDoor.js', man.includes(WDf) && man.includes('scripts/b107_lcv14_kind_client_bench.js') && !man.includes(DLf) && !man.includes(LDf));
  }

  sec('5 · THE FIX CARD IN HIS WORDS: steps 5 to 8b re-walked with a FRESH member (Walk Seventeen Lambda), on the estate the cut 3 walk left (Theta on the team, not on the crew; Kappa on the crew), the ear as the walk recorded it (the client inside the kind)');
  {
    const d = db(leftByWalk());
    const ear = (member) => req([{ act: 'assign_crew', ...(member ? { member_as_spoken: member } : {}), kind_as_spoken: 'Walk Seventeen Alpha shoot' }]);
    let x = await turnX(d, 'Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot', ear('Walk Seventeen Theta'));
    T('5.5 STEP 5 "Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot" → "Assigned: Walk Seventeen Theta · Walk Seventeen Alpha · shoot · 22 November 2027."', x.reply === 'Assigned: Walk Seventeen Theta · Walk Seventeen Alpha · shoot · 22 November 2027.');
    x = await turnX(d, 'Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot', ear('Walk Seventeen Theta'));
    T('5.6 STEP 6 the same → "Walk Seventeen Theta\'s already on the Walk Seventeen Alpha shoot."', x.reply === "Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot.");
    x = await turnX(d, 'Assign Walk Seventeen Lambda to the Walk Seventeen Alpha shoot', ear('Walk Seventeen Lambda'));
    T('5.7 STEP 7 "Assign Walk Seventeen Lambda to the Walk Seventeen Alpha shoot" → "Added to the team: Walk Seventeen Lambda." then, on its own line, "Assigned: Walk Seventeen Lambda · Walk Seventeen Alpha · shoot · 22 November 2027."', x.reply === 'Added to the team: Walk Seventeen Lambda.\n\nAssigned: Walk Seventeen Lambda · Walk Seventeen Alpha · shoot · 22 November 2027.');
    x = await turnX(d, 'Assign to the Walk Seventeen Alpha shoot', ear(null));
    T('5.8a STEP 8a "Assign to the Walk Seventeen Alpha shoot" → "Who? Say the name."', x.reply === 'Who? Say the name.');
    x = await turnX(d, 'Walk Seventeen Theta', ear('Walk Seventeen Theta'));
    T('5.8b STEP 8b "Walk Seventeen Theta" → "Walk Seventeen Theta\'s already on the Walk Seventeen Alpha shoot."', x.reply === "Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot.");
    T('5.9 END STATE: the crew is Kappa, Theta and Lambda; the team holds three Walk Seventeen members (Theta, Kappa, Lambda)', crewOf(d, SHOOT).length === 3 && team(d).length === 3);
  }

  console.log(`\nb107_lcv14_kind_client_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(`FAILED: ${failed.join(' · ')}`); process.exit(1); }
}
main().catch((e) => { console.log(`BENCH CRASHED: ${e && e.stack}`); process.exit(1); });
