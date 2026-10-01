'use strict';
// scripts/b142b_elz3_relay_rule_bench.js · TDW CE-46 · ELZ-3 · CUT 2 · F-44.181's CURE: THE DOOR-SIDE RELAY RULE (rung b142b, the b142 package).
// The chair's ruling of 27 September 2026 on ELZ-3's read-first (iii), "send" dropped (c5): a message OPENING with tell, bata, batao or
// message, followed by a name matching her live leads, is a relay by construction: the relay act carries the lead's own
// name (longest run first, exact fold; then the first word, one lead; two or more, B8 numbered with a pick note; none, the ear as today).
// SHAPE (b'') (the chair, 29 September 2026; (a), the hear skipped, WITHDRAWN): the ear hears as today; the rule ADDS relay(the lead) only when
// no relay act was heard, keeping every other act; a heard relay of any name stays as heard. §2 pins it, ruling 1's multi-act turn included.
// THE HARNESS IS b103's (LCV-12), carried byte for byte up to its first section: its makeDb (C-44.3's PGRST116 double), world, doubles, the REAL
// preTurn, standIn and persistDoorTurn, the REAL relay seat over a fake transport; only the two models are doubles, and the ear double COUNTS its calls.
// C-44.12: the recorded misses replayed are LCV-11's seat close §4 (TDW_CE45_LCV11_SEAT_CLOSE_HANDOVER.md), verbatim as b103 carries them:
// 16:12:58 "Tell Sarah thank you" heard {"acts":[],"route":"none"}, and 16:01:48 "Tell Sarah we are free on 22nd" heard the same. m181's per-call
// jsonl lived in the founder's /tmp (ELZ-2's M181 handover §3) and is not in the tree: its two classes (none/none; booking_confirmed on
// "tell walk twin we're confirmed") are replayed BY SHAPE and labelled so. THE EXIT CODE IS THE VERDICT; mutations are of production code.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-ce46-elz3-cut2.txt';
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

const DLf7 = 'src/lib/vendor/doorLines.js';
const LD_SHA = '293c4e577b43d9bb6f6b2b92b69e43bb3950921ed5d1a74322d13fb8e2b882c1';
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
      { llmCreate: earSeq(...reqs), nowMs: Number.isFinite(o.nowMs) ? o.nowMs : NOW /* F-44.248's cells set the door's clock beside the store's */, composerCreate: composerOf(BODY), sendWhatsApp: transport, env: ENV, ...(Number.isFinite(o.hearMs) ? { hearMs: o.hearMs } : {}) }));
    const said = out && out.door === true ? out : await quiet(() => mod.standIn({ supabase: db, out }, { nowMs: NOW }));
    await quiet(() => mod.persistDoorTurn({ supabase: db, agentId: AG, message, out: said, lane: o.lane || 'whatsapp' }, { memory: memoryOf(db), meter }));
    return { out, said, reply: said.reply, keys: J(said.keys), calls: calls.slice() };
  };
  const meta = (d) => { const r = lastDoor(d); return r && r.meta && r.meta.listener ? r.meta.listener : {}; };
  // a long thread, as the record's misses sat inside one: eight rows on the working thread before the sentence
  const longThread = (db) => { for (let i = 0; i < 4; i += 1) { db.tables['engine.messages'].push({ id: `u-${i}`, conversation_id: 'c-1', role: 'user', content: `Who are my new leads? ${i}`, meta: null, created_at: new Date(clock += 1000).toISOString() }); db.tables['engine.messages'].push({ id: `a-${i}`, conversation_id: 'c-1', role: 'assistant', content: B34, meta: { listener: { door: true, request: { acts: [{ act: 'find' }], route: 'search' } } }, created_at: new Date(clock += 1000).toISOString() }); } return db; };
  const threadIn = (c) => /Recent conversation, oldest first:/.test(String(c && c.user || ''));


  const rows = (d) => d.tables['public.leads'];
  const ruleWorld = () => {
    const w = world();
    w['public.leads'] = [
      leadRow({ id: 'l-sarah', name: 'Sarah', phone: PHONE, state: 'booked', wedding_date: '2028-03-05' }),
      leadRow({ id: 'l-asha', name: 'Asha Walk Fifteen', phone: PHONE2, wedding_date: '2027-03-05' }),
      leadRow({ id: 'l-tw1', name: 'Walk twin', phone: null, wedding_date: '2027-03-05' }),
      leadRow({ id: 'l-tw2', name: 'Walk twin', phone: null, wedding_date: '2027-06-12' }),
      leadRow({ id: 'l-pk', name: 'Priya Khan', phone: '+919625759926', wedding_date: '2027-01-10' }),
      leadRow({ id: 'l-pd', name: 'Priya Das', phone: PHONE2, wedding_date: '2027-06-01' }),
      leadRow({ id: 'l-ab', name: 'Ab', phone: null }),
      leadRow({ id: 'l-gone', name: 'Meena', phone: null, deleted_at: '2026-08-26T10:18:48Z' }),
    ];
    return w;
  };
  const RM = typeof WD.relayRuleMatch === 'function' ? WD.relayRuleMatch : async () => null; // absent before the cut: its cells FAIL by name
  const match = async (m, db) => RM(db || makeDb(ruleWorld()), V.id, m);

  sec('1 THE MATCH (relayRuleMatch, on her live leads)');
  let x = await match('tell Sarah hi');
  T('1.1 "tell Sarah hi": exact, Sarah', !!x && x.kind === 'exact' && x.name === 'Sarah');
  x = await match('Tell Sarah, we are free');
  T('1.2 an edge comma on the name is folded: exact, Sarah', !!x && x.kind === 'exact' && x.name === 'Sarah');
  x = await match('bata Asha Walk Fifteen ki advance bhej do');
  T('1.3 "bata" and a three-word name, the longest run first: exact, Asha Walk Fifteen', !!x && x.kind === 'exact' && x.name === 'Asha Walk Fifteen');
  x = await match('batao Asha kal aayenge');
  T('1.4 "batao" and a first word naming ONE lead: that lead\'s full name', !!x && x.kind === 'first' && x.name === 'Asha Walk Fifteen');
  x = await match('message Priya thanks');
  T('1.5 "message" and a first word naming TWO leads: a pick, in the date order (F-44.178)', !!x && x.kind === 'pick' && x.spoken === 'priya' && x.rows.map((r) => r.id).join() === 'l-pk,l-pd');
  x = await match("tell walk twin we're confirmed");
  T('1.6 two leads of the SAME full name: exact (planRelay\'s own B8 numbers them)', !!x && x.kind === 'exact' && x.name === 'Walk twin');
  T('1.7 "tell me who owes me money" (his control): no rule', (await match('tell me who owes me money')) === null);
  T('1.8 "tell her we are free" (a pronoun): no rule, the ear as today', (await match('tell her we are free')) === null);
  T('1.9 "send Sarah the invoice": no rule ("send" dropped, c5)', (await match('send Sarah the invoice')) === null);
  T('1.10 the verb not first ("ok tell Sarah hi"): no rule', (await match('ok tell Sarah hi')) === null);
  x = await match('tell sarah');
  T('1.11 a bare "tell sarah" is a relay to Sarah (the composer\'s placeholder refusal guards the body)', !!x && x.kind === 'exact' && x.name === 'Sarah');
  T('1.12 a deleted lead is no match ("tell Meena hi")', (await match('tell Meena hi')) === null);
  x = await match('tell ab hi');
  const abWorld = () => { const w = ruleWorld(); w['public.leads'] = w['public.leads'].filter((l) => l.id !== 'l-ab').concat([leadRow({ id: 'l-abk', name: 'Ab Kumar', phone: null })]); return w; };
  T('1.13 an exact two-letter name matches exactly; the first-word read never goes under three letters', !!x && x.kind === 'exact' && x.name === 'Ab' && (await match('tell ab hi', makeDb(abWorld()))) === null);
  const broken = { from: () => ({ select: () => ({ eq: () => ({ is: async () => ({ data: null, error: { message: 'down' } }) }) }) }) };
  T('1.14 a failed read of her leads is no rule (null), never a throw', (await RM(broken, V.id, 'tell Sarah hi')) === null);

  sec("2 THE DOOR (the REAL preTurn), shape (b''): the ear hears as today; the rule ADDS the relay only where none was heard");
  // C-44.12: LCV-11's seat close §4, verbatim (b103's R, above this rung's harness): the ear heard these as NOTHING inside a long thread
  const MISS = JSON.parse('{"acts":[],"route":"none"}');
  let db = longThread(makeDb(ruleWorld()));
  let r = await turnSeq(db, 'Tell Sarah thank you', [MISS, MISS]);
  T('2.1 16:12:58 AS RECORDED ("Tell Sarah thank you", heard none in a long thread): B37 for Sarah on ONE call (the rule\'s relay, no cold second hearing)', r.keys === 'B37' && /Sarah/.test(r.reply) && r.calls.length === 1);
  T('2.1b the record keeps what the ear heard (heard: none) beside the request the door decided on (relay Sarah), rule: relay', (() => { const m = meta(db); return !!m && m.rule === 'relay' && canon(m.heard) === canon(MISS) && JSON.stringify(m.request && m.request.acts) === JSON.stringify([{ act: 'relay', client_as_spoken: 'Sarah' }]); })());
  db = longThread(makeDb(ruleWorld()));
  r = await turnSeq(db, 'Tell Sarah we are free on 22nd', [MISS, MISS]);
  T('2.2 16:01:48 AS RECORDED: B37 for Sarah, one call', r.keys === 'B37' && r.calls.length === 1);
  db = makeDb(ruleWorld());
  r = await turnSeq(db, 'tell Sarah hi', [MISS]);
  T('2.3 m181\'s weakest case BY SHAPE ("tell Sarah hi", none/none, no thread): B37, one call', r.keys === 'B37' && r.calls.length === 1);
  db = makeDb(ruleWorld());
  r = await turnSeq(db, "tell walk twin we're confirmed", [{ route: 'task', acts: [{ act: 'booking_confirmed', client_as_spoken: 'walk twin' }] }]);
  T('2.4 m181\'s booking_confirmed BY SHAPE ("tell walk twin we\'re confirmed"): the relay is ADDED in front and the booking act KEPT (the door decided on both), the two Walk twins numbered (B8)', canon(meta(db).request && meta(db).request.acts) === canon([{ act: 'relay', client_as_spoken: 'Walk twin' }, { act: 'booking_confirmed', client_as_spoken: 'walk twin' }]) && /^B8/.test(r.keys) && /Walk twin \(5 March 2027\)/.test(r.reply) && /Walk twin \(12 June 2027\)/.test(r.reply));
  // LABELED AMENDMENT · CE-46 ELZ-3 (the price switch's cut): F-44.231, minted by the chair and recorded here as observed ("B8,B8", no note),
  // is CURED in the door: when every line is B8 over the same clients, ONE is spoken and the pick note keeps every act. 2.4f re-pinned to the
  // cure, and her "1" then picks the first Walk twin with both acts replayed.
  T('2.4f F-44.231 CURED: the question asked ONCE, and the pick note keeps both acts (relay, booking_confirmed)', r.keys === 'B8' && !!noteOf(db) && (noteIn(db).acts || []).map((a) => a.act).join() === 'relay,booking_confirmed' && JSON.stringify(noteIn(db).lead_ids) === JSON.stringify(['l-tw1', 'l-tw2']));
  const pick1 = await turnSeq(db, '1', [MISS]);
  T('2.4g her "1" is read: BOTH acts replay on the first Walk twin (the relay finds no number, the booking finds no package), never B3', pick1.keys === 'RELAY_NO_NUMBER,B5' && /Walk twin/.test(pick1.reply));
  db = makeDb(ruleWorld());
  r = await turnSeq(db, 'message Priya thanks', [MISS]);
  T('2.5 a first-word tie: B8 names both Priyas in the date order, one call, a lead_first pick noted', r.keys === 'B8' && /1\. Priya Khan/.test(r.reply) && /2\. Priya Das/.test(r.reply) && r.calls.length === 1 && (noteIn(db).pick_kind === 'lead_first') && JSON.stringify(noteIn(db).lead_ids) === JSON.stringify(['l-pk', 'l-pd']));
  r = await turnSeq(db, '2', [MISS]);
  T('2.6 her "2" picks Priya Das by id: the frame B37 is for Priya Das', r.keys === 'B37' && /Priya Das/.test(r.reply));
  db = makeDb(ruleWorld());
  r = await turnSeq(db, 'tell me who owes me money', [MISS]);
  T('2.7 his control ("tell me who owes me money"): no rule; heard as today (one call, no lead named, no rehear)', r.calls.length === 1 && meta(db).rule === undefined);
  db = makeDb(ruleWorld());
  r = await turnSeq(db, 'send Sarah the invoice', [MISS, MISS]);
  T('2.8 "send Sarah the invoice": no rule ("send" dropped); the none is re-heard cold as today (R-45.3: two calls)', r.calls.length === 2 && meta(db).rule === undefined);
  // RULING 1 (the chair's, pinned in b101 5.8): a relay beside a money act asks the FRAME and the money act rides the note. Under (b'') both are kept.
  const BOOKED = { act: 'booking_confirmed', client_as_spoken: 'Asha Walk Fifteen' };
  db = makeDb(ruleWorld());
  r = await turnSeq(db, 'Tell Asha Walk Fifteen the booking is confirmed', [{ route: 'task', acts: [{ act: 'relay', client_as_spoken: 'Asha Walk Fifteen' }, BOOKED] }]);
  const heardBoth = { keys: r.keys, acts: (noteIn(db).acts || []).map((a) => a.act).join() };
  T('2.9 RULING 1, the ear heard relay + booking_confirmed: untouched (a relay was heard); the frame B37, the booking act rides the note', heardBoth.keys === 'B37' && /booking_confirmed/.test(heardBoth.acts) && meta(db).rule === undefined);
  db = makeDb(ruleWorld());
  r = await turnSeq(db, 'Tell Asha Walk Fifteen the booking is confirmed', [{ route: 'task', acts: [BOOKED] }]);
  T('2.9b RULING 1 under (b\'\'): the ear heard ONLY booking_confirmed; the relay is added and the booking act KEPT: the same frame and note as 2.9', r.keys === heardBoth.keys && (noteIn(db).acts || []).map((a) => a.act).join() === heardBoth.acts && meta(db).rule === 'relay');
  db = makeDb(ruleWorld());
  r = await turnSeq(db, 'Tell Asha Walk Fiften hello', [{ route: 'task', acts: [{ act: 'relay', client_as_spoken: 'Asha Walk Fiften' }] }]);
  T('2.10 a heard relay of ANY name stays as heard: the one-letter slip is still offered through the ONE home (B36, b101 4.9\'s bytes)', r.reply === 'Did you mean Asha Walk Fifteen? Reply YES or NO.' && meta(db).rule === undefined);
  db = makeDb(ruleWorld());
  { const LFm = require(P('src/lib/laneFlags.js')); LFm._resetLaneFlagCache(); }
  const outErr = await quiet(() => WD.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message: 'tell Sarah hi', lane: 'whatsapp' },
    { llmCreate: async () => { throw new Error('listener down'); }, nowMs: NOW, composerCreate: composerOf(BODY), sendWhatsApp: transport, env: ENV }));
  T('2.11 the ear erroring: the rule still hears the relay (B37 for Sarah)', !!outErr && J(outErr.keys) === 'B37' && /Sarah/.test(String(outErr.reply || '')));

  sec('6 F-44.248: a draft follow-up after a door relay is that relay again, through the door (the name from the lead\'s record)');
  // the store keeps its own clock (b103's makeDb); the door's is set one minute after the store's last row, as a follow-up comes
  const soonAfter = (d) => Date.parse(d.tables['engine.messages'].slice(-1)[0].created_at) + 60 * 1000;
  const RELAY_ASHA_LOWER = { route: 'task', acts: [{ act: 'relay', client_as_spoken: 'asha walk fifteen' }] };
  const noPhone = () => { const w = ruleWorld(); w['public.leads'] = w['public.leads'].map((l) => (l.id === 'l-asha' ? { ...l, phone: null } : l)); return w; };
  let d6 = makeDb(noPhone());
  let r6 = await turnSeq(d6, 'Tell asha walk fifteen booking is confirmed but we need to talk once', [RELAY_ASHA_LOWER]);
  const first6 = r6.keys;
  r6 = await turnSeq(d6, 'Just draft the message and give me', [MISS, MISS], { nowMs: soonAfter(d6) });
  // LABELED AMENDMENT · the founder's yes of 29 September 2026 (the no-number draft, two messages): the follow-up for a client with no number is now
  // answered with the draft to copy (RELAY_DRAFT_NO_NUMBER), no longer RELAY_NO_NUMBER. 6.1 and 6.2 re-pinned; 6.8 to 6.10 pin the two messages.
  T('6.1 the founder\'s walk shape (10:05:22): after the no-number relay, "Just draft the message and give me" heard none is the relay again, answered BY THE DOOR with the draft to copy (not the question agent)', first6 === 'RELAY_NO_NUMBER' && r6.keys === 'RELAY_DRAFT_NO_NUMBER' && meta(d6).rule === 'draft_followup' && canon(meta(d6).heard) === canon(MISS));
  T('6.2 the client is the LEAD\'S RECORD name ("Asha Walk Fifteen"), never her words or the ear\'s casing', canon(meta(d6).request && meta(d6).request.acts) === canon([{ act: 'relay', client_as_spoken: 'Asha Walk Fifteen' }]) && /Asha Walk Fifteen/.test(r6.reply) && !/Your Walk Fifteen/.test(r6.reply));
  const two = r6.said && r6.said.replies;
  T('6.8 TWO messages, in order: the founder\'s line naming the lead, then the draft ALONE, byte-equal to the composer\'s body (no quotes, nothing around it)', Array.isArray(two) && two.length === 2 && two[0] === "Here is the message for Asha Walk Fifteen. I don't have her number, so copy the next message and send it yourself." && two[1] === BODY);
  T('6.9 no send question and no phone in either message', Array.isArray(two) && two.every((m) => !/Reply YES or NO|\+91|\d{10}/.test(m)));
  const sentWa = []; await quiet(() => WD.speakOnWhatsApp({ supabase: d6, agentId: AG, phone: '+919000000000', convoId: 'ct-1', message: 'Just draft the message and give me', out: r6.said, sendWhatsApp: async (to, text) => { sentWa.push(text); return { sid: `w${sentWa.length}` }; } }, { persistDoorTurn: async () => ({}) }));
  T('6.10 on WhatsApp they leave as TWO messages, the second exactly the draft (a long press copies it)', sentWa.length === 2 && sentWa[0] === two[0] && sentWa[1] === BODY);
  T('6.11 the record keeps both (content the two a blank line apart; replies kept on the listener)', /Here is the message for Asha Walk Fifteen\./.test(String(lastDoor(d6).content)) && String(lastDoor(d6).content).endsWith(BODY) && Array.isArray(meta(d6).replies) && meta(d6).replies.length === 2);
  const cj6 = src('src/api/vendor-engine/chat.js');
  T('6.12 the app lane: the stream sends each message, a message_break before the second; the JSON route carries replies', /const doorParts = Array\.isArray\(doorOut\.replies\) && doorOut\.replies\.length > 1 \? doorOut\.replies : \[doorOut\.reply\];/.test(cj6) && /if \(i\) send\(\{ type: 'message_break' \}\);/.test(cj6) && /replies: Array\.isArray\(doorOut\.replies\) && doorOut\.replies\.length > 1 \? doorOut\.replies\.map/.test(cj6));
  T('6.3 one hearing: the draft follow-up is not re-heard cold', r6.calls.length === 1);
  // her number arrives between the two turns (the no-number line asked for it): the follow-up then frames the draft, from her PREVIOUS words
  d6 = makeDb(noPhone()); composed.length = 0;
  await turnSeq(d6, 'Tell asha walk fifteen we are free on 22nd', [RELAY_ASHA_LOWER]);
  d6.tables['public.leads'].forEach((l) => { if (l.id === 'l-asha') l.phone = PHONE2; });
  const nBefore = composed.length;
  r6 = await turnSeq(d6, 'Just draft the message and give me', [MISS, MISS], { nowMs: soonAfter(d6) });
  T('6.4 once her number is on file, the follow-up frames the relay to Asha Walk Fifteen (B37), composed from her PREVIOUS words, not "Just draft the message"', r6.keys === 'B37' && /Asha Walk Fifteen/.test(r6.reply) && composed.slice(nBefore).some((c) => /we are free on 22nd/.test(String(c.user || ''))) && !composed.slice(nBefore).some((c) => /Just draft the message/.test(String(c.user || ''))));
  d6 = makeDb(ruleWorld());
  await turnSeq(d6, 'Tell Sarah we are free on 22nd', [{ route: 'task', acts: [{ act: 'relay', client_as_spoken: 'Sarah' }] }]);
  r6 = await turnSeq(d6, 'Just draft the message and give me', [MISS, MISS], { nowMs: soonAfter(d6) });
  T('6.4b a pending frame (B37 note) is answered by the note, never re-read as a follow-up', meta(d6).rule !== 'draft_followup');
  d6 = makeDb(ruleWorld());
  r6 = await turnSeq(d6, 'Just draft the message and give me', [MISS, MISS], { nowMs: Date.now() });
  // LABELED AMENDMENT · R-46.17 audit item 2 (the chair's ruling): with no relay before it, the draft follow-up is no longer left to the question
  // agent: the door asks its own B35 and keeps a note of the relay act and her words
  T('6.5 no relay before it: the door asks B35 ("Which client? Say the name."), the note carrying the relay act and her words (never the question agent\'s free draft)', r6.keys === 'B35' && r6.reply === 'Which client? Say the name.' && noteIn(d6).asked === 'B35' && (noteIn(d6).acts || []).map((a) => a.act).join() === 'relay' && noteIn(d6).said === 'Just draft the message and give me');
  d6 = makeDb(noPhone());
  await turnSeq(d6, 'Tell asha walk fifteen booking is confirmed', [RELAY_ASHA_LOWER]);
  r6 = await turnSeq(d6, 'ok thanks', [MISS, MISS], { nowMs: soonAfter(d6) });
  T('6.6 a message that does not ask for a draft is not taken', meta(d6).rule !== 'draft_followup');
  d6 = makeDb(noPhone());
  await turnSeq(d6, 'Tell asha walk fifteen booking is confirmed', [RELAY_ASHA_LOWER]);
  // CE-46 ELZ-4 (labelled): total at a tree without lastDoorRelay, so the both-ways read at the uncured tip reddens this cell instead of crashing
  const hasLDR = typeof WD.lastDoorRelay === 'function';
  const late = hasLDR ? await WD.lastDoorRelay(d6, AG, 30 * 60 * 1000, soonAfter(d6) + 30 * 60 * 1000) : 'absent';
  const soon = hasLDR ? await WD.lastDoorRelay(d6, AG, 30 * 60 * 1000, soonAfter(d6)) : null;
  T('6.7 the window is the previous assistant turn within 30 minutes: a stale relay is not reached', late === null && !!soon && soon.client === 'asha walk fifteen');

  sec('7 R-46.17: the relay frame B37 is TWO messages, the draft ALONE first (the founder\'s yes, 29 September 2026)');
  const d7 = makeDb(ruleWorld());
  const r7 = await turnSeq(d7, 'Tell Sarah we are free on 22nd', [{ route: 'task', acts: [{ act: 'relay', client_as_spoken: 'Sarah' }] }]);
  const p7 = r7.said && r7.said.replies;
  T('7.1 the frame is two messages: the draft body alone (byte-equal, no quotes, nothing around it), then "Send this to Sarah (…)? Reply YES or NO."', r7.keys === 'B37' && Array.isArray(p7) && p7.length === 2 && p7[0] === BODY && p7[1] === `Send this to Sarah (${PHONE})? Reply YES or NO.`);
  const sent7 = []; await quiet(() => WD.speakOnWhatsApp({ supabase: d7, agentId: AG, phone: '+919000000000', convoId: 'ct-1', message: 'x', out: r7.said, sendWhatsApp: async (to, text) => { sent7.push(text); return { sid: `w${sent7.length}` }; } }, { persistDoorTurn: async () => ({}) }));
  T('7.2 on WhatsApp: two messages, the first exactly the draft, the question last so her YES answers it', sent7.length === 2 && sent7[0] === BODY && /Reply YES or NO\.$/.test(sent7[1]));
  const y7 = await turnSeq(d7, 'YES', [MISS]);
  T('7.3 her YES still sends the stored draft (the note, the answer and the row unchanged)', /^Sent to Sarah/.test(String(y7.reply)));

  sec('3 m181 --rule: the sixteen sentences by construction');
  const PH = ['tell {c} hello', 'tell {c} hi', 'tell {c} good morning', 'tell {c} thank you', "tell {c} we're confirmed", 'tell {c} see you soon', 'tell {c} happy diwali', 'tell {c} congratulations'];
  let n = 0; let relays = 0;
  for (const c of ['walk twin', 'Sarah']) for (const p of PH) for (let k = 0; k < 10; k += 1) { n += 1; const m = await match(p.replace('{c}', c)); if (m && (m.kind === 'exact' || m.kind === 'first')) relays += 1; }
  T(`3.1 m181's eight phrasings x two clients x ten: ${relays}/${n} read as a relay (ELZ-2's ear: 40/160 without the thread, 125/160 with)`, n === 160 && relays === 160);
  const m181 = srcOr('scripts/m181_ear_short_relay_measure.js');
  T('3.2 m181 carries --rule (bare, no key, no model)', /--rule/.test(m181) && /relayRuleMatch/.test(m181));

  sec('4 THE LAWS');
  T('4.1 W-1: listenerDoor.js is not in this cut (its sha as at 1b8789f)', sha(src(LDf)) === LD_SHA);
  const man = fs.existsSync(P(MAN)) ? src(MAN).split('\n').map((q) => q.trim()).filter((q) => q && !q.startsWith('#')) : [];
  T('4.2 the manifest names no soul, lens, engine or migration path', man.length > 0 && man.every((p) => !/soul|lens|^src\/engine\/|^db\/migrations\//.test(p)));

  sec('5 MUTATIONS of production code (each must redden its named cell)');
  const WDdeps = [];
  const GUARD = "    if (relayRule && !(st.ear && st.ear.request && Array.isArray(st.ear.request.acts) && st.ear.request.acts.some((a) => a && a.act === 'relay'))) {";
  // ── §9 CE-47 ELZ-4 · C2 (F-44.265, the chair's go of 30 September 2026): a draft request is taken EVEN WITH a pending item (a note, or the
  // booking question's live money row); the item stays in place, unchanged, proved by its row; a later YES answers it. The walk's exact rows.
  console.log('\n§9 C2: a draft request with a question pending (the walk of 30 September, 16:54:29 and 16:55:24)');
  const pmaRows = (d) => d.tables['public.pending_money_acts'];
  const BOOK_ASHA = { route: 'task', acts: [{ act: 'booking_confirmed', client_as_spoken: 'asha walk fifteen' }] }; // 16:55:11's heard, verbatim
  // the walk's clients each carry the Photographs and film package (the live leads did: Rs 80,000), which is what puts B2 on the thread (e-262)
  const withPkg = (w, leadId) => { w['public.lead_packages'] = [...(w['public.lead_packages'] || []), { id: `lp-${leadId}`, vendor_id: V.id, lead_id: leadId, total: 80000, schedule: [], snapshot: { name: 'Photographs and film' }, deleted_at: null }]; return w; };
  let d9 = makeDb(withPkg(noPhone(), 'l-asha'));
  const a1 = await turnSeq(d9, 'Tell asha walk fifteen her booking is confirmed', [BOOK_ASHA]);
  const staged9 = pmaRows(d9).filter((r) => r.state === 'staged');
  T('9.0 the walk\'s 16:55:11: the no-number line, then the booking question (B2), its money row live', /Confirm this booking\? Asha Walk Fifteen/i.test(a1.reply) && staged9.length === 1);
  const rowBefore = staged9[0] ? JSON.stringify(staged9[0]) : null;
  const a2 = await turnSeq(d9, 'Just draft the message and give me', [MISS], { nowMs: soonAfter(d9) });
  T('9.1 16:55:24 "Just draft the message and give me" with B2 live: the door\'s TWO messages (the line naming Asha Walk Fifteen, then the draft alone)', Array.isArray(a2.said.replies) && a2.said.replies.length === 2 && /^Here is the message for Asha Walk Fifteen\./.test(a2.said.replies[0]) && a2.said.replies[1] === BODY);
  T('9.2 the booking question\'s row survives UNCHANGED (still staged, byte for byte)', !!rowBefore && pmaRows(d9).length === 1 && JSON.stringify(pmaRows(d9)[0]) === rowBefore);
  const a3 = await turnSeq(d9, 'Yes', [MISS], { nowMs: soonAfter(d9) });
  T('9.3 a later YES still answers the booking question (its row confirmed)', pmaRows(d9)[0] && pmaRows(d9)[0].state !== 'staged' && pmaRows(d9)[0].state !== 'expired');
  // Sarah, with a number: the relay framed (B37), YES sends it and asks the booking (B2); then "Just draft a message" (16:54:29)
  let d9s = makeDb(withPkg(ruleWorld(), 'l-sarah'));
  d9s.tables['public.leads'] = d9s.tables['public.leads'].map((l) => (l.id === 'l-sarah' ? { ...l, state: 'new' } : l));
  const s1 = await turnSeq(d9s, 'Tell Sarah her booking is confirmed', [{ route: 'task', acts: [{ act: 'booking_confirmed', client_as_spoken: 'sarah' }] }]);
  const s2 = await turnSeq(d9s, 'Yes', [MISS], { nowMs: soonAfter(d9s) });
  const liveS = pmaRows(d9s).filter((r) => r.state === 'staged');
  const rowS = liveS[0] ? JSON.stringify(liveS[0]) : null;
  T('9.4 the walk\'s 16:51:32 and 16:53:53: the draft framed in two messages, YES sends it and asks the booking (B2 live)', Array.isArray(s1.said.replies) && s1.said.replies.length === 2 && /Confirm this booking\? Sarah/i.test(s2.reply) && liveS.length === 1);
  const s3 = await turnSeq(d9s, 'Just draft a message', [MISS], { nowMs: soonAfter(d9s) });
  T('9.5 16:54:29 "Just draft a message" with B2 live and no relay decided on the previous door turn: B35 ("Which client? Say the name.")', s3.reply === DL.LINES.B35);
  T('9.6 the booking question\'s row survives UNCHANGED under B35', !!rowS && JSON.stringify(pmaRows(d9s).find((r) => r.id === liveS[0].id)) === rowS);
  const s4 = await turnSeq(d9s, 'Yes', [MISS], { nowMs: soonAfter(d9s) });
  T('9.7 a later YES still answers the booking question', !!liveS[0] && !['staged', 'expired'].includes(pmaRows(d9s).find((r) => r.id === liveS[0].id).state)); // (not vacuous: an expired row fails it)
  T('9.8 NEITHER draft request reached the question agent (both answered at the door)', a2.out && a2.out.door === true && s3.out && s3.out.door === true);
  // a NOTE (not a live row) pending: B18 asked, then a draft request: the note is written back unchanged on the draft turn's row
  let d9n = makeDb(noPhone());
  await turnSeq(d9n, 'Tell asha walk fifteen booking is confirmed', [RELAY_ASHA_LOWER]);
  const lastA = d9n.tables['engine.messages'].filter((r) => r.role === 'assistant').slice(-1)[0];
  // the note in the form the door reads it back (validNote's shape), so the comparison is byte for byte
  const heldNote = { asked: 'B18', acts: [{ act: 'lead' }], tries: 0, direction: 'future', lead_id: null, package_id: null };
  lastA.meta.listener.note = heldNote;
  const n1 = await turnSeq(d9n, 'Just draft the message and give me', [MISS], { nowMs: soonAfter(d9n) });
  T('9.9 with a NOTE pending, the draft request is taken and the note is written back on this turn\'s row, unchanged', n1.out && n1.out.door === true && JSON.stringify(meta(d9n).note) === JSON.stringify(heldNote));

  // ── §8 CE-46 ELZ-4 · layer C (the chair, from FE-5's read, 30 September 2026): the history of a two-part reply. GET /chat/history selects meta and
  // each message carries replies (meta.listener.replies, two or more, each scrubbed as the stream scrubs its parts) and NOTHING ELSE of meta.
  console.log('\n§8 layer C: the history of a two-part reply (chat.js)');
  const HIST = () => { const t = src('src/api/vendor-engine/chat.js'); const i = t.indexOf('function historyReplies('); if (i < 0) return null;
    let d = 0; let j = t.indexOf('{', t.indexOf(')', i)); for (; j < t.length; j += 1) { if (t[j] === '{') d += 1; else if (t[j] === '}') { d -= 1; if (!d) break; } }
    const { scrubText } = require(P('src/lib/vendor/scrub')); return new Function('scrubText', `${t.slice(i, j + 1)}; return historyReplies;`)(scrubText); };
  const H8 = HIST(); const { scrubText: SCRUB8 } = require(P('src/lib/vendor/scrub'));
  const TWO = ['Here is the message for Asha Walk Fifteen. I don\'t have her number, so copy the next message and send it yourself.', 'Hi Asha, your booking is confirmed.'];
  const r81 = H8 ? H8({ meta: { listener: { replies: TWO, door: true, request: { acts: [] } } } }) : null;
  T('8.1 a row whose listener record keeps two replies returns them, in order, each scrubbed as the stream does', !!r81 && JSON.stringify(r81) === JSON.stringify({ replies: TWO.map((x) => SCRUB8(x)) }));
  T('8.2 a row without replies (none, one, or not an array) returns no replies key at all', !!H8 && JSON.stringify(H8({ meta: { listener: { door: true } } })) === '{}' && JSON.stringify(H8({ meta: { listener: { replies: ['one'] } } })) === '{}' && JSON.stringify(H8({ meta: null })) === '{}' && JSON.stringify(H8({})) === '{}');
  const cj8 = src('src/api/vendor-engine/chat.js'); const hr = cj8.slice(cj8.indexOf("router.get('/history/:vendorId'"), cj8.indexOf("router.get('/history/:vendorId'") + 4000);
  T('8.3 the history route selects meta and spreads ONLY historyReplies(m) into each message (no meta, no listener, no request leaves)', /\.select\('id, role, content, created_at, room, meta'\)/.test(hr) && /room: m\.room \?\? null, \.\.\.historyReplies\(m\) \}\)\)/.test(hr) && !/meta:\s*m\.meta|\.\.\.m\.meta|listener:/.test(hr.slice(hr.indexOf('const messages'), hr.indexOf('return res.json({ ok: true, messages })'))));

  await mut('M1 the rule never applied: 2.3 red (none re-heard, LEFTOVER)', WDf, [[GUARD, '    if (false) {']], WDdeps,
    async (req2) => (await turnSeq(makeDb(ruleWorld()), 'tell Sarah hi', [MISS, MISS], { M: req2(WDf) })).keys, (v) => v !== 'B37');
  await mut('M2 a heard relay overwritten (the guard ignores it): 2.10 red (B36 lost)', WDf, [[GUARD, '    if (relayRule) {']], WDdeps,
    async (req2) => (await turnSeq(makeDb(ruleWorld()), 'Tell Asha Walk Fiften hello', [{ route: 'task', acts: [{ act: 'relay', client_as_spoken: 'Asha Walk Fiften' }] }], { M: req2(WDf) })).reply, (v) => v !== 'Did you mean Asha Walk Fifteen? Reply YES or NO.');
  await mut('M3 "send" back in the verbs: 1.9 red', WDf, [['(tell|bata|batao|message)\\s+(\\S', '(tell|bata|batao|message|send)\\s+(\\S']], WDdeps,
    async (req2) => req2(WDf).relayRuleMatch(makeDb(ruleWorld()), V.id, 'send Sarah the invoice'), (v) => v !== null);
  await mut('M4 the first-word read removed: 1.4 red', WDf, [['    if (hits.length === 1) return { kind: \'first\', name: hits[0].name.trim() };\n', '']], WDdeps,
    async (req2) => req2(WDf).relayRuleMatch(makeDb(ruleWorld()), V.id, 'batao Asha kal aayenge'), (v) => !(v && v.kind === 'first'));
  await mut('M5 the first-word tie not asked: 2.5 red', WDf, [["    if (hits.length > 1) return { kind: 'pick', spoken: first, rows: hits };\n", '']], WDdeps,
    async (req2) => (await turnSeq(makeDb(ruleWorld()), 'message Priya thanks', [MISS, MISS], { M: req2(WDf) })).keys, (v) => v !== 'B8');
  await mut('M6 edge punctuation not folded: 1.2 red', WDf, [['const said = edgeFold(words.slice(0, n).join(\' \'));', 'const said = key(words.slice(0, n).join(\' \'));'], ['const first = edgeFold(words[0]);', 'const first = key(words[0]);']], WDdeps,
    async (req2) => req2(WDf).relayRuleMatch(makeDb(ruleWorld()), V.id, 'Tell Sarah, we are free'), (v) => !(v && v.kind === 'exact' && v.name === 'Sarah'));
  await mut('M7 the pick not honoured by first word (pinnedLeadFirst reads the full name): 2.6 red', WDf, [["if (error || !data || key(data.name).split(/\\s+/)[0] !== key(first)) return null;", 'if (error || !data || key(data.name) !== key(first)) return null;']], WDdeps,
    async (req2) => { const M = req2(WDf); const d = makeDb(ruleWorld()); await turnSeq(d, 'message Priya thanks', [MISS], { M }); return (await turnSeq(d, '2', [MISS], { M })).keys; }, (v) => v !== 'B37');
  await mut('M8 the min-length guard dropped on the first word: 1.13\'s second half red', WDf, [['if (first.length < REHEAR_MIN_NAME) return null;', '']], WDdeps,
    async (req2) => req2(WDf).relayRuleMatch(makeDb(abWorld()), V.id, 'tell ab hi'), (v) => v !== null);
  await mut('M9 validNote drops lead_first back to lead: 2.6 red', WDf, [["n.pick_kind === 'lead_first' ? 'lead_first' : 'lead'", "'lead'"]], WDdeps,
    async (req2) => { const M = req2(WDf); const d = makeDb(ruleWorld()); await turnSeq(d, 'message Priya thanks', [MISS], { M }); return (await turnSeq(d, '2', [MISS], { M })).keys; }, (v) => v !== 'B37');
  await mut('M10 the other acts dropped when the relay is added (shape (a)\'s loss): 2.9b red', WDf, [["const others = heardReq && Array.isArray(heardReq.acts) ? heardReq.acts.map((a) => ({ ...a })) : [];", 'const others = [];']], WDdeps,
    async (req2) => { const d = makeDb(ruleWorld()); await turnSeq(d, 'Tell Asha Walk Fifteen the booking is confirmed', [{ route: 'task', acts: [BOOKED] }], { M: req2(WDf) }); return (noteIn(d).acts || []).map((a) => a.act).join(); }, (v) => !/booking_confirmed/.test(v));
  // LABELED AMENDMENT · CE-46 ELZ-3 · F-44.248: the record line now also carries rule 'draft_followup'; M11's anchor follows it
  await mut('M11 the record forgets what was heard: 2.1b red', WDf, [["...(ear && (ear.rule === 'relay' || ear.rule === 'draft_followup') ? { heard: ear.heard === undefined ? null : ear.heard, rule: ear.rule } : {})", '...({})']], WDdeps,
    async (req2) => { const d = makeDb(ruleWorld()); await turnSeq(d, 'tell Sarah hi', [MISS], { M: req2(WDf) }); return meta(d).rule; }, (v) => v !== 'relay');
  await mut('M12 F-44.231\'s collapse removed (two B8s, no note): 2.4f red', WDf, [["      if (st.lines.every((l) => listed(l) === listed(st.lines[0]))) { st.lines = [st.lines[0]]; st.keys = ['B8']; }", '']], WDdeps,
    async (req2) => { const d = makeDb(ruleWorld()); return (await turnSeq(d, "tell walk twin we're confirmed", [{ route: 'task', acts: [{ act: 'booking_confirmed', client_as_spoken: 'walk twin' }] }], { M: req2(WDf) })).keys; }, (v) => v !== 'B8');

  // RE-ANCHORED (CE-47 ELZ-4 · C2, labelled): the draft test moved to draftAsk, read once before the live row's expiry; the same mutation.
  await mut('M13 F-44.248 never takes the follow-up (its regex matches nothing): 6.1 red', WDf, [["const draftAsk = said === null && DRAFT_FOLLOWUP.test(String(message || ''));", 'const draftAsk = false;']], WDdeps,
    async (req2) => { const M = req2(WDf); const d = makeDb((() => { const w = ruleWorld(); w['public.leads'] = w['public.leads'].map((l) => (l.id === 'l-asha' ? { ...l, phone: null } : l)); return w; })()); await turnSeq(d, 'Tell asha walk fifteen booking is confirmed', [{ route: 'task', acts: [{ act: 'relay', client_as_spoken: 'asha walk fifteen' }] }], { M }); await turnSeq(d, 'Just draft the message and give me', [MISS, MISS], { M, nowMs: Date.parse(d.tables['engine.messages'].slice(-1)[0].created_at) + 60000 }); return meta(d).rule; }, (v) => v !== 'draft_followup');
  await mut('M14 the name taken from the record as spoken, not the lead\'s row: 6.2 red', WDf, [["const client = found && found.ok && found.lead && typeof found.lead.name === 'string' && found.lead.name.trim() ? found.lead.name.trim() : null;", 'const client = prev.client;']], WDdeps,
    async (req2) => { const M = req2(WDf); const d = makeDb((() => { const w = ruleWorld(); w['public.leads'] = w['public.leads'].map((l) => (l.id === 'l-asha' ? { ...l, phone: null } : l)); return w; })()); await turnSeq(d, 'Tell asha walk fifteen booking is confirmed', [{ route: 'task', acts: [{ act: 'relay', client_as_spoken: 'asha walk fifteen' }] }], { M }); await turnSeq(d, 'Just draft the message and give me', [MISS, MISS], { M, nowMs: Date.parse(d.tables['engine.messages'].slice(-1)[0].created_at) + 60000 }); return canon(meta(d).request && meta(d).request.acts); }, (v) => v !== canon([{ act: 'relay', client_as_spoken: 'Asha Walk Fifteen' }]));
  await mut('M15 her previous words not restored: 6.4 red', WDf, [['          if (prev.said) st.said = prev.said;\n', '']], WDdeps,
    async (req2) => { const M = req2(WDf); const d = makeDb((() => { const w = ruleWorld(); w['public.leads'] = w['public.leads'].map((l) => (l.id === 'l-asha' ? { ...l, phone: null } : l)); return w; })()); composed.length = 0; await turnSeq(d, 'Tell asha walk fifteen we are free on 22nd', [{ route: 'task', acts: [{ act: 'relay', client_as_spoken: 'asha walk fifteen' }] }], { M }); d.tables['public.leads'].forEach((l) => { if (l.id === 'l-asha') l.phone = PHONE2; }); const n0 = composed.length; await turnSeq(d, 'Just draft the message and give me', [MISS, MISS], { M, nowMs: Date.parse(d.tables['engine.messages'].slice(-1)[0].created_at) + 60000 }); return composed.slice(n0).some((c) => /we are free on 22nd/.test(String(c.user || ''))); }, (v) => v !== true);
  // LABELED AMENDMENT · R-46.17: the two messages are now one split line (st.lines.push([first, body])); M16's anchor follows it
  await mut('M16 the two messages joined into one: 6.8 red', WDf, [["        st.lines.push([first, composed.body]); st.keys.push('RELAY_DRAFT_NO_NUMBER');", "        st.lines.push(`${first}\\n\\n${composed.body}`); st.keys.push('RELAY_DRAFT_NO_NUMBER');"]], WDdeps,
    async (req2) => { const M = req2(WDf); const d = makeDb((() => { const w = ruleWorld(); w['public.leads'] = w['public.leads'].map((l) => (l.id === 'l-asha' ? { ...l, phone: null } : l)); return w; })()); await turnSeq(d, 'Tell asha walk fifteen booking is confirmed', [{ route: 'task', acts: [{ act: 'relay', client_as_spoken: 'asha walk fifteen' }] }], { M }); const r = await turnSeq(d, 'Just draft the message and give me', [MISS, MISS], { M, nowMs: Date.parse(d.tables['engine.messages'].slice(-1)[0].created_at) + 60000 }); return (r.said && r.said.replies) || []; }, (v) => !(v.length === 2 && v[1] === BODY));
  await mut('M17 the B35 route removed (the question agent drafts again): 6.5 red', WDf, [['      if (!prev) {\n        const original = saidOf(message);', '      if (false) {\n        const original = saidOf(message);']], WDdeps,
    async (req2) => { const d = makeDb(ruleWorld()); return (await turnSeq(d, 'Just draft the message and give me', [MISS, MISS], { M: req2(WDf), nowMs: Date.now() })).keys; }, (v) => v !== 'B35');
  await mut('M18 the frame joined into one message: 7.1 red', DLf7, [["    return [b, LINES.B37.replace('{client}', c).replace('{phone}', p)];", "    return `${b}\\n\\n${LINES.B37.replace('{client}', c).replace('{phone}', p)}`;"]], [WDf],
    async (req2) => { req2(DLf7); const M = req2(WDf); const d = makeDb(ruleWorld()); const r = await turnSeq(d, 'Tell Sarah we are free on 22nd', [{ route: 'task', acts: [{ act: 'relay', client_as_spoken: 'Sarah' }] }], { M }); return (r.said && r.said.replies) || []; }, (v) => !(v.length === 2 && v[0] === BODY));
  // CE-47 ELZ-4 · C2 (§9): each mutation replays the walk's Asha rows (a package, no number, B2 live) on the mutated door
  const walkAsha = async (M) => { const d = makeDb(withPkg(noPhone(), 'l-asha')); await turnSeq(d, 'Tell asha walk fifteen her booking is confirmed', [BOOK_ASHA], { M });
    const row0 = JSON.stringify(pmaRows(d).find((r) => r.state === 'staged') || null); const t = await turnSeq(d, 'Just draft the message and give me', [MISS], { nowMs: soonAfter(d), M });
    return { door: !!(t.out && t.out.door === true), two: Array.isArray(t.said.replies) && t.said.replies.length === 2, kept: row0 !== 'null' && JSON.stringify(pmaRows(d)[0]) === row0 }; };
  await mut('M22 C2 undone (the gate needs no note and no live row again): 9.1, 9.8 red (the question agent answers)', WDf,
    [["    if (!relayRule && heardNothing(st.ear) && draftAsk && !(note && RELAY_ASKS.includes(note.asked))) {", '    if (!note && !live && !relayRule && heardNothing(st.ear) && draftAsk) {']], WDdeps,
    async (req2) => walkAsha(req2(WDf)), (v) => v.door === false && v.two === false);
  await mut('M23 the live row expired by the draft request anyway: 9.2 red', WDf, [['    const holdLive = !!(live && draftAsk);', '    const holdLive = false;']], WDdeps,
    async (req2) => walkAsha(req2(WDf)), (v) => v.kept === false);
  await mut('M24 the held note not written back: 9.9 red', WDf, [['  if (st.heldNote && !st.note) st.note = st.heldNote;', '']], WDdeps,
    async (req2) => { const M = req2(WDf); const d = makeDb(noPhone()); await turnSeq(d, 'Tell asha walk fifteen booking is confirmed', [RELAY_ASHA_LOWER], { M });
      d.tables['engine.messages'].filter((r) => r.role === 'assistant').slice(-1)[0].meta.listener.note = heldNote;
      await turnSeq(d, 'Just draft the message and give me', [MISS], { nowMs: soonAfter(d), M }); return JSON.stringify(meta(d).note || null); }, (v) => v !== JSON.stringify(heldNote));

  // CE-46 ELZ-4 · layer C's history (§8): chat.js cannot be compiled without the database's keys, so these mutations edit the FILE, re-read the
  // cell's subject from it, and restore it byte for byte (checked by sha256); a missing anchor or an unrestored file fails the mutation
  const CJ = 'src/api/vendor-engine/chat.js';
  const shaF = (t) => require('crypto').createHash('sha256').update(t, 'utf8').digest('hex');
  const mutFile = (name, from, to, probe) => { const orig = src(CJ); let hit = false;
    try { if (!orig.includes(from)) throw new Error(`mutation anchor missing in ${CJ}: ${from.slice(0, 60)}`); fs.writeFileSync(P(CJ), orig.replace(from, to)); hit = probe() === true; }
    catch (e) { console.log(`        (${e.message})`); hit = false; } finally { fs.writeFileSync(P(CJ), orig); }
    T(name, hit && shaF(src(CJ)) === shaF(orig)); };
  const want81 = JSON.stringify({ replies: TWO.map((x) => SCRUB8(x)) });
  mutFile('M19 the history carries no parts (replies never returned): 8.1 red', '    return { replies: r.map((x) => scrubText(x)) };', '    return {};',
    () => { const h = HIST(); return !h || JSON.stringify(h({ meta: { listener: { replies: TWO } } })) !== want81; });
  mutFile('M20 the parts leave unscrubbed: 8.1 red', '    return { replies: r.map((x) => scrubText(x)) };', '    return { replies: r.map((x) => `${x} `) };',
    () => { const h = HIST(); return !h || JSON.stringify(h({ meta: { listener: { replies: TWO } } })) !== want81; });
  mutFile('M21 the whole meta rides out with the message: 8.3 red', 'room: m.room ?? null, ...historyReplies(m) }));', 'room: m.room ?? null, meta: m.meta, ...historyReplies(m) }));',
    () => /meta:\s*m\.meta/.test(src(CJ)));

  console.log(`\nb142b_elz3_relay_rule_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(`FAILED: ${failed.join(' · ')}`); process.exit(1); }
}
main().catch((e) => { console.log(`BENCH CRASHED: ${e && e.stack}`); process.exit(1); });
