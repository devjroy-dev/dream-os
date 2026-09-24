'use strict';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';
// scripts/b114_lcv15_lsp3b_bench.js · CE-45 LCV-15 · LSP_3b: F-44.152 (R-45.24: a relay's recipient is its client), F-44.153 (a B35 answer read for the heard
// name), F-44.149 (a did-you-mean answered with the offered name is yes). b101's harness carried byte for byte (its lines 11 to 12, and 14 to 225); the REAL preTurn,
// standIn, persistDoorTurn, draftSeat and relaySeat.sendApprovedDraft; every claim replays his 24 September hearings verbatim. Reads no clock (C-44.13).
const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-lcv11-p6b.txt';
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
      // C-44.3 (the chair's ruling on the P6b fix cut, e-77): PostgREST's maybeSingle over MORE THAN ONE row returns NO data and an error
      // (PGRST116), never the first row. The first cut's double returned the first row, which hid F-44.124 in b102 at the base.
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


  // ════ b114 · LSP_3b ════ (b101's harness above, carried byte for byte from its line 14 to its line 225; its world() extended below)
  const SARAH_PHONE = '+919625759926'; // a bench-only number: DEV440's live "Sarah" carries the test couple's, which the bench's Asha already holds
  const W17A = '27978acb-370f-4dc2-9ee6-96f354319539'; // the recorded candidate id of 24 September 11:41:07 (his engine export)
  const THETA = 'ab47e7a0-6454-4a85-a398-5cec2d47001f'; const LAMBDA = 'ef86e1c0-a1d2-4efa-87ee-b51774d0adff';
  let uu = 0;
  const estate = () => {
    const w = world();
    w['public.leads'].push(leadRow({ id: 'l-sarah', name: 'Sarah', phone: SARAH_PHONE }), leadRow({ id: W17A, name: 'Walk Seventeen Alpha', state: 'booked', wedding_date: '2027-11-22', wedding_date_precision: 'day' }));
    w['public.conversations'].push({ id: 'ct-3', vendor_id: V.id, counterparty_phone: SARAH_PHONE, kind: 'couple_thread', state: 'active', last_message_at: new Date(Date.now() - 3600e3).toISOString() });
    w['public.messages'].push({ id: 'pm-in3', conversation_id: 'ct-3', direction: 'inbound', channel: 'whatsapp', body: 'hi', created_at: new Date(Date.now() - 3600e3).toISOString() });
    w['public.events'] = [{ id: '7f9a837b-10b8-4c8b-a86c-05211a3e64e9', vendor_id: V.id, title: 'Walk Seventeen Alpha', event_date: '2027-11-22', event_time: null, kind: 'shoot', linked_lead_id: W17A, state: 'upcoming', notes: null,
      created_at: '2026-09-22T21:12:27Z', updated_at: '2026-09-22T21:12:27Z', couple_id: null, deleted_at: null, linked_binder_id: null, slot: 'full_day', ready_by: null, assigned_member_ids: [THETA, LAMBDA], assigned_circle_member_id: null }];
    w['public.team_members'] = [THETA, LAMBDA].map((id, i) => ({ id, vendor_id: V.id, name: i ? 'Walk Seventeen Lambda' : 'Walk Seventeen Theta', active: true, role: null, phone: null, daily_rate_inr: null, notes: null, created_at: '2026-09-23T10:33:07Z', updated_at: '2026-09-23T10:33:07Z', deleted_at: null }));
    w['public.crew_confirmations'] = []; w['public.hot_dates'] = [];
    return w;
  };
  // team_members take the store's own defaults (a UUID id, active true), disclosed as b112 did (C-44.3)
  const uuidDb = (seed) => { const db = makeDb(seed); const orig = db.from; db.from = (n) => { const b = orig(n); if (n !== 'team_members') return b; const ins = b.insert;
    b.insert = (pl) => ins((Array.isArray(pl) ? pl : [pl]).map((x) => ({ id: `7e000000-0000-4000-8000-${String(++uu).padStart(12, '0')}`, active: true, ...x }))); return b; }; return db; };
  // THE RECORDS, VERBATIM (C-44.12): his engine exports of 24 September 2026
  const REQ_143851 = '{"acts":[{"act":"relay","member_as_spoken":"Sarah"}],"route":"task"}';     // "Tell Sarah hi" (F-44.152)
  const REQ_143919 = '{"acts":[{"act":"relay","member_as_spoken":"Sarah"}],"route":"task"}';     // "Tell Sarah hi", his answer to B35 (F-44.153)
  const NOTE_114107 = '{"acts":[{"act":"assign_crew","client_as_spoken":"Walk Seventeen Alpha","member_as_spoken":"nobody"}],"slot":"client","asked":"B36","tries":0,"candidate_id":"27978acb-370f-4dc2-9ee6-96f354319539"}';
  const REQ_114142 = '{"acts":[],"route":"none"}';                                              // "Walk seventeen alpha" (F-44.149)
  const SARAH_FRAME = () => frame('Sarah', BODY, SARAH_PHONE);
  const seedNote = (d, note) => { d.tables['engine.messages'].push({ id: 'm-seed', conversation_id: 'c-1', role: 'assistant', content: 'seed', tool_calls: null, meta: { listener: { lane: 'whatsapp', door: true, note } }, created_at: '2026-09-21T05:59:00Z' }); };

  sec('1 · F-44.152: "Tell Sarah hi", the 14:38:51 hearing replayed verbatim');
  let d = makeDb(estate()); let r = await turn(d, 'Tell Sarah hi', rec(REQ_143851));
  T('1.1 the relay\'s recipient heard in the member slot is read as the client: B37, the frame for Sarah at her stored phone, AT ONCE (not B35)', r.keys === 'B37' && r.reply === SARAH_FRAME());
  T('1.2 …a draft is stored for Sarah\'s phone, staged, nothing sent', draftsIn(d).length === 1 && d0(d).couple_phone === SARAH_PHONE && d0(d).state === 'staged');
  const before = sent.length;
  r = await turn(d, 'YES', NONE);
  T('1.3 her YES sends the stored bytes to Sarah\'s phone through the seat\'s one send leg (sendApprovedDraft), the row sent', r.reply === `Sent to Sarah (${SARAH_PHONE}).` && sent.length === before + 1 && sent[sent.length - 1].to === SARAH_PHONE && sent[sent.length - 1].text === BODY && d0(d).state === 'sent');
  d = makeDb(estate()); r = await turn(d, 'Tell Sarah hi', req([relay('Sarah')]));
  T('1.4 GUARD: a relay heard WITH its client is untouched (the same frame)', r.keys === 'B37' && r.reply === SARAH_FRAME());
  d = uuidDb(estate()); r = await turn(d, 'Add nobody crew to walk seventeen alpha shoot', req([{ act: 'assign_crew', kind_as_spoken: 'shoot', client_as_spoken: 'walk seventeen alpha', member_as_spoken: 'nobody crew' }]));
  T('1.5 GUARD: assign_crew\'s member slot keeps its meaning (the member is added and assigned, B56 then B58)', r.keys === 'B56,B58');

  sec('2 · F-44.153: his answer to B35, the 14:39:16 hearing replayed verbatim');
  d = makeDb(estate());
  r = await turn(d, 'Tell someone hi', req([relay(null)]));
  T('2.1 [setup] a relay with no name asks B35', r.keys === 'B35');
  r = await turn(d, 'Tell Sarah hi', rec(REQ_143919));
  T('2.2 his whole sentence given in answer is read for the NAME the ear heard: B37 for Sarah, never "No client called Tell Sarah hi"', r.keys === 'B37' && r.reply === SARAH_FRAME() && !/Tell Sarah hi/.test(r.reply));
  d = makeDb(estate()); await turn(d, 'Tell someone hi', req([relay(null)]));
  r = await turn(d, 'Sarah', NONE);
  T('2.3 GUARD: a bare name answered, heard as nothing, is her whole message, as before: B37 for Sarah', r.keys === 'B37' && r.reply === SARAH_FRAME());

  sec('3 · F-44.149: a did-you-mean answered with the offered name, the 11:41:07 note and the 11:41:42 turn replayed verbatim');
  d = uuidDb(estate()); seedNote(d, rec(NOTE_114107));
  r = await turn(d, 'Walk seventeen alpha', rec(REQ_114142));
  T('3.1 "Walk seventeen alpha" (the offered name, exact under key()) is her yes: the assignment runs, B56 then B58 on the 22 November 2027 shoot', r.keys === 'B56,B58' && /Assigned: nobody · Walk Seventeen Alpha · shoot · 22 November 2027\./.test(r.reply));
  d = uuidDb(estate()); seedNote(d, rec(NOTE_114107));
  r = await turn(d, 'Walk seventeen beta', NONE);
  T('3.2 GUARD: any other answer keeps its old path (the question again, tries 1)', r.keys === 'B36' && (noteOf(d) || {}).tries === 1);

  sec('4 · mutations of production code');
  await mut('4.1 M1 relayRecipient not applied in preTurn reddens 1.1 (B35 again)', WDf, [['heard = withoutEchoedEvents(relayRecipient(st.ear.request), nowMs);', 'heard = withoutEchoedEvents(st.ear.request, nowMs);']], [], async (req2) => { const dd = makeDb(estate()); return (await turn(dd, 'Tell Sarah hi', rec(REQ_143851), { M: req2(WDf) })).keys; }, (v) => v === 'B35');
  await mut('4.2 M2 the B35 answer ignoring the heard relay client reddens 2.2 (the sentence as the name)', WDf, [['const name = heardRelay ? spokenText(heardRelay.client_as_spoken) : message.trim();', 'const name = message.trim();']], [], async (req2) => { const dd = makeDb(estate()); const M = req2(WDf); await turn(dd, 'Tell someone hi', req([relay(null)]), { M }); return (await turn(dd, 'Tell Sarah hi', rec(REQ_143919), { M })).reply; }, (v) => /Tell Sarah hi/.test(String(v)));
  await mut('4.3 M3 the offered name no longer read as yes reddens 3.1 (B36 again)', WDf, [["if (PMA.decide(message) === 'yes' || (offeredName && key(message) === key(offeredName))) {", "if (PMA.decide(message) === 'yes') {"]], [], async (req2) => { const dd = uuidDb(estate()); seedNote(dd, rec(NOTE_114107)); return (await turn(dd, 'Walk seventeen alpha', rec(REQ_114142), { M: req2(WDf) })).keys; }, (v) => v === 'B36');

  sec('5 · the held functions and the untouched files (C-44.7)');
  const body = (t, name) => { const i = t.search(new RegExp(`^(async )?function ${name}\\b`, 'm')); if (i < 0) return ''; let dd = 0, st = false; for (let j = t.indexOf('{', i); j < t.length; j += 1) { if (t[j] === '{') { dd += 1; st = true; } else if (t[j] === '}') { dd -= 1; if (st && dd === 0) return t.slice(i, j + 1); } } return ''; };
  const wd = src(WDf);
  const PIN = {"planMoney":"2a7a1c76bf2efeabec03301805e5d5d2bdb38b310940284935496dad8b7f7efb","planPayment":"cddb6c299afe946ddfddf89cebb3a815c13db38cbd17c863a2b23a677244483e","planBooking":"086fbb9debf6a62fa52a8306037adef47cc1ece4e2ce2efd7e2c684a27e6a3fa","applyRow":"01f76e676659e01c3f0dd92b560726fcde136a8be4bcf3a12adf120cc7fc1b4b","reread":"e200a0f720c62637ea617ccacb508c9b7a0b58f49e7848323c5eff5a7bcdc8fc","planAssign":"d91e81ae7e6ccf1dc133fd4955402708c883473699de5a1b692beebb02f5026f","fileAssign":"7fda6dca436372e8d5d2aac8fa9c6d8ce4f8eb7f71fecf6c553948fbb16d0582"};
  for (const [f, h] of Object.entries(PIN)) T(`5.1 ${f} is byte-identical to the LSP_3 tree`, sha(body(wd, f)) === h);
  T('5.2 listenerDoor.js is untouched (the listener is not taught; the door reads the recipient)', sha(src(LDf)) === '293c4e577b43d9bb6f6b2b92b69e43bb3950921ed5d1a74322d13fb8e2b882c1');

  console.log(`\nb114_lcv15_lsp3b_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`   ${f}`)); }
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error('BENCH THREW (unexpected):', e && e.stack || e); process.exit(2); });
