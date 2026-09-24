'use strict';
// scripts/b112_lcv15_lsp2_bench.js · CE-45 LCV-15 · LSP_2: R-45.16 (the screenshot save, B84 and B85), F-44.147 (the possessive fold), F-44.148 (the lost client).
// b106's harness carried byte for byte below (its lines 11 to 194: the Postgres-shaped double with PGRST116, world(), withMutated, mut).
// The drivers are the REAL preTurn, standIn and persistDoorTurn; the REAL writeEvent over the in-memory events table; the ear a recorded request.
// Every cell that claims a sentence replays a recorded hearing VERBATIM (C-44.12): his engine export of 24 September 2026, 07:26:00 and 07:42:43 UTC.
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


// ════ b112 · LSP_2 · CE-45 LCV-15 ════ (the harness above is b106's, carried byte for byte from its line 11 to its line 194; its world() is extended below)
const WALK_ALPHA = 'l-w17a';
const THETA = 'ab47e7a0-6454-4a85-a398-5cec2d47001f'; const LAMBDA = 'ef86e1c0-a1d2-4efa-87ee-b51774d0adff';
let evSeq = 0;
const evRow = (o) => Object.assign({ id: `e0000000-0000-4000-8000-${String(++evSeq).padStart(12, '0')}`, vendor_id: V.id, title: null, event_date: null, event_time: null, kind: 'shoot',
  linked_lead_id: null, state: 'upcoming', notes: null, created_at: '2026-09-22T21:12:27Z', updated_at: '2026-09-22T21:12:27Z', couple_id: null, deleted_at: null,
  linked_binder_id: null, slot: 'full_day', ready_by: null, assigned_member_ids: [], assigned_circle_member_id: null }, o);
const tmRow = (o) => Object.assign({ id: null, vendor_id: V.id, name: null, active: true, role: null, phone: null, daily_rate_inr: null, notes: null, created_at: '2026-09-23T10:33:07Z', updated_at: '2026-09-23T10:33:07Z', deleted_at: null }, o);
// THE RECORDS, VERBATIM (C-44.12): his engine export of 24 September 2026 (the corrected SELECT, e-104), the assistant rows' meta.listener.request
const REQ_0726 = '{"acts":[{"act":"cancel_event","kind_as_spoken":"shoot","client_as_spoken":"walk seventeen alpha\'s"}],"route":"task"}';
const SAID_0726 = "Cancel walk seventeen alpha's shoot";
const REQ_0742 = '{"acts":[{"act":"assign_crew","kind_as_spoken":"shoot","client_as_spoken":"walk seventeen alpha","member_as_spoken":"nobody crew"}],"route":"task"}';
const SAID_0742 = 'Add nobody crew to talk seventeen alpha shoot';
function estate(o = {}) {
  const w = world();
  w['public.leads'] = [leadRow({ id: WALK_ALPHA, name: 'Walk Seventeen Alpha', state: 'booked', wedding_date: '2027-11-22', wedding_date_precision: 'day' }),
    leadRow({ id: 'l-studio', name: "Alpha's Studio" }), leadRow({ id: 'l-plain', name: 'Alpha Studio' })];
  w['public.events'] = [evRow({ id: 'e-w17a', title: 'Walk Seventeen Alpha', event_date: '2027-11-22', linked_lead_id: WALK_ALPHA, assigned_member_ids: [THETA, LAMBDA] })];
  w['public.team_members'] = [tmRow({ id: THETA, name: 'Walk Seventeen Theta' }), tmRow({ id: LAMBDA, name: 'Walk Seventeen Lambda', created_at: '2026-09-23T13:10:44Z' })];
  w['public.pending_event_proposals'] = o.proposals || [];
  w['public.hot_dates'] = [];
  if (o.note) w['engine.messages'] = [{ id: 'm-img', conversation_id: 'c-1', role: 'assistant', content: 'preview', tool_calls: null, meta: { listener: { lane: 'whatsapp', door: true, note: o.note } }, created_at: '2026-09-24T06:59:00Z' }];
  return w;
}
const THREE = [
  { event_date: '2027-12-01', kind: 'shoot', title: 'Walk Twenty Alpha' },
  { event_date: '2027-12-02', kind: 'meeting', title: 'Walk Twenty Beta', event_time: '11:00' },
  { event_date: '2027-12-03', kind: 'shoot', title: 'Walk Twenty Gamma' },
];
const propRow = (o) => Object.assign({ id: 'pr-1', vendor_id: V.id, proposals: THREE, source_image_url: 'https://x/y.jpg', caption: null, created_at: null, resolved_at: null, resolution: null }, o);
const IMG_NOTE = { asked: 'IMG', acts: [], proposal_id: 'pr-1', count: 3 };

async function main() {
  const WD = require(WDP);
  const DL = require(P(DLf));
  const LF = require(P('src/lib/laneFlags.js'));
  const meter = require(P('src/agent/harvest.js'))._meter;
  const memoryOf = (db) => ({
    getOrCreateConversation: async () => ({ conversationId: 'c-1', thread: [] }),
    saveMessage: async (cid, role, content, tc, meta) => { const id = `m-${db.tables['engine.messages'].length + 1}`; db.tables['engine.messages'].push({ id, conversation_id: cid, role, content, tool_calls: tc || null, meta: meta || null, created_at: new Date(clock += 1000).toISOString() }); return id; },
  });
  let earCalls = 0;
  const earOfCounted = (request) => async () => { earCalls += 1; return { content: [{ type: 'tool_use', name: 'ear_request', input: request }], usage: { input_tokens: 1, output_tokens: 1 } }; };
  const turn = async (db, message, request, o = {}) => {
    const mod = o.M || WD; LF._resetLaneFlagCache(); earCalls = 0;
    const out = await quiet(() => mod.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message, lane: o.lane || 'whatsapp' },
      { llmCreate: earOfCounted(request), nowMs: o.now || NOW, ...(o.writeEvent ? { writeEvent: o.writeEvent } : {}) }));
    const said = out && out.door === true ? out : await quiet(() => mod.standIn({ supabase: db, out }, { nowMs: o.now || NOW }));
    await quiet(() => mod.persistDoorTurn({ supabase: db, agentId: AG, message, out: said, lane: o.lane || 'whatsapp' }, { memory: memoryOf(db), meter }));
    return { out, said, reply: said.reply, keys: J(said.keys), ear: earCalls };
  };
  const evs = (d) => d.tables['public.events'].filter((e) => !e.deleted_at);
  const prop = (d) => d.tables['public.pending_event_proposals'][0] || {};
  const iso = (ms) => new Date(ms).toISOString();

  sec('1 · R-45.16 THE GRAMMAR (proposalChoice, her whole message)');
  const G = (t, n) => JSON.stringify(WD.proposalChoice(t, n));
  T('1.1 "save all", "save", "save them all", "Save." and "SAVE ALL!" keep every row', ['save all', 'save', 'save them all', 'Save.', 'SAVE ALL!'].every((t) => G(t, 3) === '{"keep":[0,1,2]}'));
  T('1.2 "skip 2" keeps 1 and 3; "skip 2 and 3" keeps 1; "skip 1, 3" keeps 2', G('skip 2', 3) === '{"keep":[0,2]}' && G('skip 2 and 3', 3) === '{"keep":[0]}' && G('skip 1, 3', 3) === '{"keep":[1]}');
  T('1.3 "skip 1, 2 and 3" keeps none (B85\'s case)', G('skip 1, 2 and 3', 3) === '{"keep":[]}');
  T('1.4 the edges are NOT answers: 0, count+1, a repeat, words around it, a bare "skip", "ok", "yes", "no"', ['skip 0', 'skip 4', 'skip 2 and 2', 'please skip 2', 'skip 2 please', 'skip', 'ok', 'yes', 'no', 'save 2'].every((t) => WD.proposalChoice(t, 3) === null));

  sec('2 · R-45.16 THE SAVE, THE REAL preTurn over the double (the REAL writeEvent over the in-memory events table)');
  const created = (h) => iso(NOW - h * 3600e3);
  let d = makeDb(estate({ note: IMG_NOTE, proposals: [propRow({ created_at: created(1) })] }));
  let r = await turn(d, 'skip 2', req([], 'none'));
  const added = evs(d).filter((e) => e.id !== 'e-w17a');
  T('2.1 "skip 2" answers before the ear (ZERO ear calls) and writes rows 1 and 3 only', r.ear === 0 && added.length === 2 && added.map((e) => e.title).sort().join() === 'Walk Twenty Alpha,Walk Twenty Gamma');
  T('2.2 …one B46 line per row, in list order, and the proposal resolved save_selected', r.keys === 'B46,B46' && r.reply.split('\n').length === 2 && /Walk Twenty Alpha/.test(r.reply.split('\n')[0]) && prop(d).resolution === 'save_selected' && !!prop(d).resolved_at);
  d = makeDb(estate({ note: IMG_NOTE, proposals: [propRow({ created_at: created(1) })] }));
  r = await turn(d, 'save all', req([], 'none'));
  T('2.3 "save all" writes all three; the meeting keeps its kind (the kind swapped into B46); resolution save_all', evs(d).length === 4 && r.keys === 'B46,B46,B46' && /meeting/.test(r.reply) && prop(d).resolution === 'save_all');
  d = makeDb(estate({ note: IMG_NOTE, proposals: [propRow({ created_at: created(1) })] }));
  r = await turn(d, 'skip 1, 2 and 3', req([], 'none'));
  T('2.4 skipping every row writes nothing, reads B85 "Nothing was saved.", resolution cancel', evs(d).length === 1 && r.reply === 'Nothing was saved.' && r.keys === 'B85' && prop(d).resolution === 'cancel');
  const clash = async (sb, args) => (args.title === 'Walk Twenty Beta' ? { ok: false, conflict: { message: 'You already have Walk Twenty Beta on 2 December 2027.' } } : require(P('src/lib/vendor/eventWrite.js')).writeEvent(sb, args));
  d = makeDb(estate({ note: IMG_NOTE, proposals: [propRow({ created_at: created(1) })] }));
  r = await turn(d, 'save all', req([], 'none'), { writeEvent: clash });
  T('2.5 a clash is the writer\'s own sentence VERBATIM (B47); the others still land; save_all (every row was attempted)', r.keys === 'B46,B47,B46' && r.reply.split('\n')[1] === 'You already have Walk Twenty Beta on 2 December 2027.' && evs(d).length === 3);
  const refuse = async () => ({ ok: false, error: 'invalid kind' });
  d = makeDb(estate({ note: IMG_NOTE, proposals: [propRow({ created_at: created(1) })] }));
  r = await turn(d, 'skip 1 and 2', req([], 'none'), { writeEvent: refuse });
  T('2.6 a refusal with no conflict sentence reads B75', r.keys === 'B75' && r.reply === DL.LINES.B75);
  const LAPSES = [['a row 25 hours old (the store\'s created_at)', propRow({ created_at: created(25) })], ['a resolved row', propRow({ created_at: created(1), resolved_at: created(0.5), resolution: 'cancel' })],
    ['another vendor\'s row', propRow({ created_at: created(1), vendor_id: 'v-other' })], ['a row whose count differs from the note', propRow({ created_at: created(1), proposals: THREE.slice(0, 2) })]];
  for (const [what, row] of LAPSES) {
    d = makeDb(estate({ note: IMG_NOTE, proposals: [row] }));
    r = await turn(d, 'save all', req([], 'none'));
    T(`2.7 ${what}: the note LAPSES (the ear hears her message fresh), nothing is written, the row is untouched`, r.ear === 1 && evs(d).length === 1 && JSON.stringify(prop(d)) === JSON.stringify(row));
  }
  d = makeDb(estate({ note: IMG_NOTE, proposals: [propRow({ created_at: created(1) })] }));
  r = await turn(d, 'ok thanks', req([], 'none'));
  T('2.8 anything outside the grammar lapses the note: the ear hears it, nothing saved, the row open', r.ear === 1 && evs(d).length === 1 && !prop(d).resolved_at);
  // C-44.13: the lapse reads a clock; three more clocks, each with a row 23 hours old (saved) and 25 hours old (lapsed)
  const CLOCKS = [['a day months ahead', Date.parse('2027-03-15T06:00:00Z')], ['across a year\'s end', Date.parse('2027-01-01T04:00:00Z')], ['a leap day', Date.parse('2028-02-29T12:00:00Z')]];
  for (const [what, now] of CLOCKS) {
    d = makeDb(estate({ note: IMG_NOTE, proposals: [propRow({ created_at: iso(now - 23 * 3600e3) })] }));
    const a = await turn(d, 'save', req([], 'none'), { now });
    const d2 = makeDb(estate({ note: IMG_NOTE, proposals: [propRow({ created_at: iso(now - 25 * 3600e3) })] }));
    const b = await turn(d2, 'save', req([], 'none'), { now });
    T(`2.9 ${what}: 23 hours saves, 25 hours lapses`, a.keys === 'B46,B46,B46' && b.ear === 1 && evs(d2).length === 1);
  }

  sec('3 · R-45.16 THE STAGER\'S NOTE (noteProposals) and the preview');
  d = makeDb(estate());
  const before = d.log.inserts.length;
  const w = await quiet(() => WD.noteProposals({ supabase: d, agentId: AG, message: '[image]', reply: 'I found 3 events…', proposalId: 'pr-1', count: 3, lane: 'whatsapp' }, { memory: memoryOf(d) }));
  const rows = d.tables['engine.messages'];
  T('3.1 two thread rows (her image, the preview) and the assistant row carries the IMG note, door true, on the lane', w.written === true && rows.length === 2 && rows[0].role === 'user' && rows[1].meta.listener.door === true && rows[1].meta.listener.note.asked === 'IMG' && rows[1].meta.listener.note.proposal_id === 'pr-1' && rows[1].meta.listener.note.count === 3);
  T('3.2 NO usage row: an image turn counts nothing (no insert beyond the thread\'s own)', !d.log.inserts.slice(before).some((i) => /usage|meter|harvest/i.test(i.table)));
  T('3.3 an invalid note (count 0, 21, no id) is not written', (await quiet(() => WD.noteProposals({ supabase: d, agentId: AG, reply: 'x', proposalId: 'pr-1', count: 0 }, { memory: memoryOf(d) }))).written === false
    && (await quiet(() => WD.noteProposals({ supabase: d, agentId: AG, reply: 'x', proposalId: 'pr-1', count: 21 }, { memory: memoryOf(d) }))).written === false
    && (await quiet(() => WD.noteProposals({ supabase: d, agentId: AG, reply: 'x', proposalId: '', count: 3 }, { memory: memoryOf(d) }))).written === false);
  const vi = src(VIf);
  T('3.4 the stager appends B84 FROM doorLines to the preview and writes the note after the send, never the dropped Victor line', /lines\.join\('\\n'\) \+ '\\n\\n' \+ require\('\.\/vendor\/doorLines'\)\.LINES\.B84/.test(vi) && /noteProposals\(\{ supabase, agentId: imgAgent/.test(vi) && !/Reply "save all" to add them all, or tell me which to skip/.test(vi));
  T('3.5 B84 and B85 are his bytes, hash-carried: LINES 81', DL.LINES.B84 === 'Reply "save all" to add them, or "skip 2" to leave one out.' && DL.LINES.B85 === 'Nothing was saved.' && Object.keys(DL.LINES).length === 81);

  sec('4 · F-44.147 THE POSSESSIVE, the 07:26:00 request replayed verbatim');
  d = makeDb(estate());
  r = await turn(d, SAID_0726, JSON.parse(REQ_0726));
  T('4.1 "Cancel walk seventeen alpha\'s shoot" (heard with the possessive) reaches B50 for Walk Seventeen Alpha\'s shoot of 22 November 2027', r.reply === "Cancel Walk Seventeen Alpha's shoot on 22 November 2027? Reply YES or NO." && r.keys === 'B50');
  const calls = []; const stub = { resolveLead: async (_s, _v, name) => { calls.push(name); return name === "Alpha's Studio" ? { ok: true, lead: { id: 'l-studio', name } } : { ok: false, reason: 'not_found' }; }, LINES: {} };
  const L2 = WD.withPossessiveFallback(stub);
  const got = await L2.resolveLead(null, V.id, "Alpha's Studio", false);
  T('4.2 GUARD: a stored name WITH an apostrophe matches itself FIRST (one call, the name as heard; the fold never asked)', got.ok === true && calls.length === 1 && calls[0] === "Alpha's Studio");
  calls.length = 0; await L2.resolveLead(null, V.id, "walk seventeen alpha's", false);
  T('4.3 only on not_found is the folded name asked, once', calls.length === 2 && calls[1] === 'walk seventeen alpha');
  T('4.4 the fold: "alpha\'s", "alpha’s" → alpha; "sisters\'" → sisters; "Alphas" untouched', WD.possessiveFold("alpha's") === 'alpha' && WD.possessiveFold('alpha’s') === 'alpha' && WD.possessiveFold("sisters'") === 'sisters' && WD.possessiveFold('alphas') === 'alphas');

  sec('5 · F-44.148 THE LOST CLIENT, the 07:42:43 request replayed verbatim with her words');
  // team_members ids are UUIDs in Postgres (gen_random_uuid()) and `active` defaults true (PUBLIC_SCHEMA); the carried double mints 'row-N' and no defaults, which
  // writeEvent rightly refuses as crew. This wrapper gives a team_members insert a UUID id and active true, as the store does (C-44.3); every other table is the carried double untouched.
  let uu = 0; const uuidDb = (seed) => { const db = makeDb(seed); const orig = db.from; db.from = (n) => { const b = orig(n); if (n !== 'team_members') return b; const ins = b.insert;
    b.insert = (pl) => ins((Array.isArray(pl) ? pl : [pl]).map((x) => ({ id: `7e000000-0000-4000-8000-${String(++uu).padStart(12, '0')}`, active: true, ...x }))); return b; }; return db; };
  d = uuidDb(estate());
  r = await turn(d, SAID_0742, JSON.parse(REQ_0742));
  const note = (d.tables['engine.messages'].filter((m) => m.role === 'assistant').slice(-1)[0] || {}).meta;
  const nn = note && note.listener && note.listener.note;
  T('5.1 her words did not hold the heard client (the floor strips it) and the door ASKS: B35, never a lone B56', r.keys === 'B35' && r.reply === B35);
  T('5.2 NOTHING is written that turn: no team_members insert, the crew untouched', !d.log.inserts.some((i) => i.table === 'public.team_members') && JSON.stringify(d.tables['public.events'][0].assigned_member_ids) === JSON.stringify([THETA, LAMBDA]));
  T('5.3 the note carries the assignment and unsaid true (so validNote keeps it)', nn && nn.asked === 'B35' && nn.unsaid === true && nn.acts[0].act === 'assign_crew' && nn.acts[0].member_as_spoken === 'nobody crew' && !nn.acts[0].client_as_spoken);
  r = await turn(d, 'Walk Seventeen Alpha', req([{ act: 'find', client_as_spoken: 'Walk Seventeen Alpha' }], 'search'));
  T('5.4 her answer resumes the assignment: B56 then B58, two lines, the member on the 22 November 2027 shoot', r.keys === 'B56,B58' && /Assigned: nobody crew · Walk Seventeen Alpha · shoot · 22 November 2027\./.test(r.reply) && d.tables['public.events'][0].assigned_member_ids.length === 3);
  d = uuidDb(estate());
  r = await turn(d, 'Add Priya to the team', req([{ act: 'assign_crew', member_as_spoken: 'Priya' }]));
  T('5.5 a genuine team add (no client heard) is untouched: B56 alone', r.keys === 'B56');
  d = uuidDb(estate());
  r = await turn(d, 'Add nobody crew to walk seventeen alpha shoot', JSON.parse(REQ_0742));
  T('5.6 a heard client that IS in her words is untouched: B56 then B58 at once', r.keys === 'B56,B58');

  sec('6 · MUTATIONS OF PRODUCTION CODE (each must redden its cell)');
  const deps = [];
  await mut('6.1 M1 the grammar accepting a repeat reddens 1.4', WDf, [['new Set(nums).size !== nums.length', 'false']], deps, async (req2) => req2(WDf).proposalChoice('skip 2 and 2', 3), (v) => v !== null);
  await mut('6.2 M2 the 24-hour lapse removed reddens 2.7 (a 25-hour row is saved)', WDf, [['|| !Number.isFinite(born) || nowMs - born > PROPOSAL_TTL_MS', '|| !Number.isFinite(born)']], deps, async (req2) => { const dd = makeDb(estate({ note: IMG_NOTE, proposals: [propRow({ created_at: created(25) })] })); const rr = await turn(dd, 'save all', req([], 'none'), { M: req2(WDf) }); return rr.keys; }, (v) => v === 'B46,B46,B46');
  await mut('6.3 M3 key()\'s possessive fold removed reddens 4.1', WDf, [["const key = (s) => possessiveFold(String(s == null ? '' : s).trim().toLowerCase());", "const key = (s) => String(s == null ? '' : s).trim().toLowerCase();"], ['    lifecycle: withPossessiveFallback(deps.lifecycle || require(\'./lifecycleHands\')),', "    lifecycle: deps.lifecycle || require('./lifecycleHands'),"]], deps, async (req2) => { const dd = makeDb(estate()); const rr = await turn(dd, SAID_0726, JSON.parse(REQ_0726), { M: req2(WDf) }); return rr.keys; }, (v) => v !== 'B50');
  await mut('6.4 M4 namelessOf not reading UNSAID restores the lone B56 and reddens 5.1', WDf, [['(NEEDS_CLIENT.includes(a.act) || a[UNSAID] === true)', 'NEEDS_CLIENT.includes(a.act)']], deps, async (req2) => { const dd = uuidDb(estate()); const rr = await turn(dd, SAID_0742, JSON.parse(REQ_0742), { M: req2(WDf) }); return rr.keys; }, (v) => v === 'B56');
  await mut('6.5 M5 the floor no longer marking the act restores the lone B56', WDf, [['(({ client_as_spoken: _c, ...rest }) => ({ ...rest, [UNSAID]: true }))(a)', '(({ client_as_spoken: _c, ...rest }) => rest)(a)']], deps, async (req2) => { const dd = uuidDb(estate()); const rr = await turn(dd, SAID_0742, JSON.parse(REQ_0742), { M: req2(WDf) }); return rr.keys; }, (v) => v === 'B56');

  sec('7 · THE HELD FUNCTIONS (C-44.7: byte-compared to e813d3f by hash)');
  const body = (t, name) => { const i = t.search(new RegExp(`^(async )?function ${name}\\b`, 'm')); if (i < 0) return ''; let dd = 0, st = false; for (let j = t.indexOf('{', i); j < t.length; j += 1) { if (t[j] === '{') { dd += 1; st = true; } else if (t[j] === '}') { dd -= 1; if (st && dd === 0) return t.slice(i, j + 1); } } return ''; };
  const wd = src(WDf);
  const PIN = {"planMoney":"2a7a1c76bf2efeabec03301805e5d5d2bdb38b310940284935496dad8b7f7efb","planPayment":"cddb6c299afe946ddfddf89cebb3a815c13db38cbd17c863a2b23a677244483e","planBooking":"086fbb9debf6a62fa52a8306037adef47cc1ece4e2ce2efd7e2c684a27e6a3fa","applyRow":"01f76e676659e01c3f0dd92b560726fcde136a8be4bcf3a12adf120cc7fc1b4b","reread":"e200a0f720c62637ea617ccacb508c9b7a0b58f49e7848323c5eff5a7bcdc8fc","planAssign":"d91e81ae7e6ccf1dc133fd4955402708c883473699de5a1b692beebb02f5026f","fileAssign":"7fda6dca436372e8d5d2aac8fa9c6d8ce4f8eb7f71fecf6c553948fbb16d0582"};
  for (const [f, h] of Object.entries(PIN)) T(`7.1 ${f} is byte-identical to e813d3f`, sha(body(wd, f)) === h);

  console.log(`\nb112_lcv15_lsp2_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`   ${f}`)); }
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error('BENCH THREW (unexpected):', e && e.stack || e); process.exit(2); });
