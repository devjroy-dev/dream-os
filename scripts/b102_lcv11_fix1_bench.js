'use strict';
// scripts/b102_lcv11_fix1_bench.js · TDW CE-45 · LCV-11 · LC-Victor P6b, THE FIX CUT (F-44.123, F-44.124), on b101's harness verbatim; b101's header follows for its conventions:
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
const MAN = 'scripts/floor-manifest-lcv11-p6b-fix1.txt';
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


  // ── THE RECORD (C-44.12): the founder's thread export of 22 September 2026 (60 rows, engine.messages with meta.listener), written into
  // docs/handovers/TDW_CE45_LCV11_P6B_HANDOVER.md §9 by script in this cut. Each cell below replays a turn VERBATIM and names its timestamp.
  const RX = {
    '16:07:45': { said: 'Send a message to my client asking for the advance', heard: '{"acts":[{"act":"relay"}],"route":"task"}' },
    '16:07:54': { said: 'Sarah', heard: '{"acts":[],"route":"none"}' },
    '16:08:49': { said: 'Tell Sara hi', heard: '{"acts":[{"act":"relay","client_as_spoken":"Sara"}],"route":"task"}' },
    '16:09:00': { said: 'Yes', heard: '{"acts":[],"route":"none"}' },
  };
  const hj = (k) => JSON.parse(RX[k].heard);
  const sarahWorld = () => {
    const w = world();
    // F-44.124's shape, the founder's fixture as his SELECT returned it on 22 September: SEVEN leads on the test couple's number, SIX deleted
    // (Sarah x3, Priya, Bandtest, Bandtest2), ONE live (Sarah, booked). C-44.3: whole rows, as Postgres returns them.
    w['public.leads'] = [
      leadRow({ id: 'l-s1', name: 'Sarah', phone: PHONE, state: 'booked', deleted_at: '2026-08-25T21:50:13Z' }),
      leadRow({ id: 'l-s2', name: 'Sarah', phone: PHONE, deleted_at: '2026-08-26T10:18:48Z' }),
      leadRow({ id: 'l-p', name: 'Priya', phone: PHONE, deleted_at: '2026-08-24T20:47:23Z' }),
      leadRow({ id: 'l-b1', name: 'Bandtest', phone: PHONE, deleted_at: '2026-08-26T12:38:18Z' }),
      leadRow({ id: 'l-s3', name: 'Sarah', phone: PHONE, deleted_at: '2026-08-26T16:26:27Z' }),
      leadRow({ id: 'l-b2', name: 'Bandtest2', phone: PHONE, deleted_at: '2026-08-26T17:05:00Z' }),
      leadRow({ id: 'l-sarah', name: 'Sarah', phone: PHONE, state: 'booked' }),
    ];
    return w;
  };
  const instr = (i) => { const u = composed[i] && composed[i].user; const m = /Her instruction: ([\s\S]*)$/.exec(u || ''); return m ? m[1] : null; };
  const sentName = (d) => DL.showFrame(BODY, 'Sarah', PHONE);

  sec('1 F-44.123: an answered question drafts from the message that ASKED');
  T('1.0 the record is in the handover §9 as this rung replays it', (() => { try { const h = src('docs/handovers/TDW_CE45_LCV11_P6B_HANDOVER.md'); return Object.keys(RX).every((k) => h.includes(RX[k].said) && h.includes(RX[k].heard)); } catch (_e) { return false; } })());
  let db = makeDb(sarahWorld()); let n0 = composed.length;
  let r = await turn(db, RX['16:07:45'].said, hj('16:07:45'));
  T('1.1 16:07:45 AS RECORDED: the nameless relay asks B35, and the note carries HER MESSAGE', r.reply === B35 && noteIn(db).asked === 'B35' && noteIn(db).said === RX['16:07:45'].said);
  r = await turn(db, RX['16:07:54'].said, hj('16:07:54'));
  T('1.2 THE CARD, 16:07:54 AS RECORDED: "Sarah" answers B35: the frame for Sarah, and the composer was handed "Send a message to my client asking for the advance", never "Sarah"', r.keys === 'B37' && instr(n0) === RX['16:07:45'].said && composed.length === n0 + 1);
  r = await turn(db, 'No', NONE);
  T('1.3 [green at the base too: the No path is the first cut\'s] THE CARD: his No refuses that draft; nothing sent', /Not sent/.test(r.reply) && d0(db).state === 'refused');
  db = makeDb(sarahWorld()); n0 = composed.length;
  r = await turn(db, RX['16:08:49'].said, hj('16:08:49'));
  T('1.4 16:08:49 AS RECORDED: "Tell Sara hi" is offered B36 and the offer note carries HER MESSAGE', r.reply === 'Did you mean Sarah? Reply YES or NO.' && noteIn(db).asked === 'B36' && noteIn(db).said === RX['16:08:49'].said);
  r = await turn(db, RX['16:09:00'].said, hj('16:09:00'));
  T('1.5 THE CARD, 16:09:00 AS RECORDED: "Yes" answers B36: the frame, and the composer was handed "Tell Sara hi", never "Yes"', r.keys === 'B37' && instr(n0) === RX['16:08:49'].said);
  r = await turn(db, 'No', NONE);
  T('1.6 [green at the base too] THE CARD: his No refuses it', /Not sent/.test(r.reply));
  db = makeDb(sarahWorld()); n0 = composed.length;
  r = await turn(db, 'Tell Sarah hello', req([relay('Sarah')]));
  T('1.7 [boundary, green at the base: a named relay always drafted from its own turn] a relay that names its client drafts from THIS turn\'s message, as before', r.keys === 'B37' && instr(n0) === 'Tell Sarah hello');
  db = makeDb(sarahWorld());
  r = await turn(db, RX['16:07:45'].said, hj('16:07:45'));
  r = await turn(db, 'yes', NONE); // a closed YES is the one answer B35 cannot read: it is asked once more (the name note's own rule)
  T('1.8 a re-asked B35 (her "yes" to "Which client?") keeps her message on the note (tries 1)', noteIn(db).asked === 'B35' && noteIn(db).tries === 1 && noteIn(db).said === RX['16:07:45'].said);
  n0 = composed.length; r = await turn(db, 'Sarah', hj('16:07:54'));
  T('1.9 and the answer after the re-ask still drafts from the original', instr(n0) === RX['16:07:45'].said);
  db = makeDb(sarahWorld()); r = await turn(db, 'The booking is confirmed', req([money('booking_confirmed')]));
  T('1.10 [boundary, green at the base: no note carried a message] a name note with NO relay carries no message (the money acts never need one)', noteIn(db).asked === 'B35' && noteIn(db).said === undefined);
  T('1.11 [boundary, green at the base: validNote ignored said] validNote: a note without said is still valid (an older note), a said over 2000 characters is absent, a non-string said is absent', !!WD.validNote({ asked: 'B35', acts: [relay()], tries: 0 }) && WD.validNote({ asked: 'B35', acts: [relay()], tries: 0, said: 'x'.repeat(2001) }).said === undefined && WD.validNote({ asked: 'B35', acts: [relay()], tries: 0, said: { a: 1 } }).said === undefined);
  await mut('1.12 MUTATION: the composer reading the ANSWER turn again (F-44.123 uncured) reddens 1.2', WDf, [['message: st.said || message, client:', 'message, client:']], [], async (rq) => { const d = makeDb(sarahWorld()); const k = composed.length; await turn(d, RX['16:07:45'].said, hj('16:07:45'), { M: rq(WDf) }); await turn(d, RX['16:07:54'].said, hj('16:07:54'), { M: rq(WDf) }); return instr(k); }, (v) => v === 'Sarah');
  await mut('1.13 MUTATION: the offer note not carrying her message reddens 1.5', WDf, [["...(original ? { said: original } : {}) }, why: 'offer_asked' };", "}, why: 'offer_asked' };"]], [], async (rq) => { const d = makeDb(sarahWorld()); const k = composed.length; await turn(d, RX['16:08:49'].said, hj('16:08:49'), { M: rq(WDf) }); await turn(d, RX['16:09:00'].said, hj('16:09:00'), { M: rq(WDf) }); return instr(k); }, (v) => v === 'Yes');

  sec('2 F-44.124: the name comes back');
  const RT = require(P('src/lib/vendor/relayToCouple.js'));
  db = makeDb(sarahWorld());
  T('2.1 THE FOUNDER\'S FIXTURE (six deleted, one live): coupleDisplayName is "Sarah"', (await RT.coupleDisplayName(db, V.id, PHONE)) === 'Sarah');
  r = await turn(db, 'Send a message to Sarah asking for the advance', req([relay('Sarah')]));
  n0 = sent.length; r = await turn(db, 'YES', NONE);
  T('2.2 THE CARD: YES reads "Sent to Sarah (+919625759924)." with the name back (the walk read "Sent to +919625759924.")', r.reply === `Sent to Sarah (${PHONE}).` && sent.length === n0 + 1);
  db = makeDb(sarahWorld()); r = await turn(db, 'Tell Sarah hello', req([relay('Sarah')])); r = await turn(db, 'No', NONE);
  T('2.3 the declined line names her too (the walk read "Nothing went to her.")', r.reply === "Not sent — I've dropped it. Nothing went to Sarah. Tell me when you want to write to her again.");
  db = makeDb(sarahWorld()); db.tables['public.leads'] = db.tables['public.leads'].filter((l) => l.deleted_at);
  T('2.4 [boundary, green at the base: six rows errored there too] only deleted leads on the number: no name (a deleted lead is not who she is)', (await RT.coupleDisplayName(db, V.id, PHONE)) === null);
  db = makeDb(sarahWorld()); db.tables['public.leads'].push(leadRow({ id: 'l-other', name: 'Meena', phone: PHONE }));
  T('2.5 [boundary, green at the base: many rows errored there too] two LIVE leads with different names on one number: no name, never a guess', (await RT.coupleDisplayName(db, V.id, PHONE)) === null);
  db = makeDb(sarahWorld()); db.tables['public.leads'].push(leadRow({ id: 'l-dup', name: 'Sarah ', phone: PHONE }));
  T('2.6 two live leads with the SAME name: that name', (await RT.coupleDisplayName(db, V.id, PHONE)) === 'Sarah');
  T('2.7 [boundary, green at the base: the old read was total too] total: no supabase, no vendor, no phone, a throwing client: null, never a throw', (await RT.coupleDisplayName(null, V.id, PHONE)) === null && (await RT.coupleDisplayName(db, null, PHONE)) === null && (await RT.coupleDisplayName({ from: () => { throw new Error('x'); } }, V.id, PHONE)) === null);
  await mut('2.8 MUTATION: the deleted_at filter removed reddens 2.1 (the six deleted Sarahs and Priyas make it two names, null)', 'src/lib/vendor/relayToCouple.js', [[".eq('phone', couplePhone)\n      .is('deleted_at', null);", ".eq('phone', couplePhone);"]], [], async (rq) => rq('src/lib/vendor/relayToCouple.js').coupleDisplayName(makeDb(sarahWorld()), V.id, PHONE), (v) => v === null);

  sec('3 the laws');
  const man = fs.existsSync(P(MAN)) ? src(MAN).split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#')) : [];
  T('3.1 W-1 NONE and the manifest names exactly this cut\'s paths', man.every((p) => !/^src\/engine\/|soul|lens|^db\/migrations\//.test(p)) && JSON.stringify(man.slice().sort()) === JSON.stringify([MAN, 'scripts/b102_lcv11_fix1_bench.js', WDf, 'src/lib/vendor/relayToCouple.js', 'docs/handovers/TDW_CE45_LCV11_P6B_HANDOVER.md', 'docs/handovers/TDW_CE45_LCV11_P6B_FIX1_HANDOVER.md', 'scripts/b95_lcv10_note_bench.js', 'scripts/b99_lcv10_didyoumean_bench.js', 'scripts/b101_lcv11_relay_bench.js'].sort()));
  T('3.2 no founder byte moved: doorLines.js is not in this cut and LINES still holds 41', !man.includes(DLf) && Object.keys(DL.LINES).length === 81 /* RE-PINNED (CE-45 LCV-15, LSP_2, labelled): 79 to 81, B84 and B85, his (R-45.16, the screenshot save); b112 holds them */ /* RE-PINNED (CE-45 LCV-14, P7 cut 4 fix, labelled): 79 since B80 to B83, his; b109 holds them */ /* RE-PINNED (CE-45 LCV-14, P7 cut 4, labelled): 75 since B69 to B74, B78, B79, his (ASK 7: each form its own key); b108 holds them */ /* RE-PINNED (CE-45 LCV-14, P7 cut 3, labelled): 67 since B56 to B62, B67, B68, his (B60 carried, unspoken); b106 holds them */); // RE-PINNED (CE-45 LCV-13, P7 2b, labelled): LINES 58 // RE-PINNED (CE-45 LCV-12, P7 2a): LINES 52

  console.log(`\nb102_lcv11_fix1_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(`FAILED: ${failed.join(' · ')}`); process.exit(1); }
}
main().catch((e) => { console.log(`BENCH CRASHED: ${e && e.stack}`); process.exit(1); });
