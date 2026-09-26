'use strict';
// LABELED AMENDMENT · CE-45 ELZ-1 cut 2a (R-45.23, the founder's V1 to V8, 25 September 2026): B4, B5, B25, B32, B33, B39, B60 and B76
// re-pinned to his new bytes (templates, rendered forms and hashes); what each cell proves is unchanged (LSP_2's precedent; e-136's re-cut).
// scripts/b132_elz1_cut2c_bench.js · TDW CE-45 · ELZ-1 · CUT 2c · RUNG b132. Its harness (to "const NONE") is b106's, taken verbatim; the cells after "RUNG b132" are 2c's:
// the five same-named picks (B8, B24, B10, B61, B53 at both sites), each "2" binding the SECOND SHOWN record by id, a vanished or renamed record
// re-asking, out of range once then B3, the money pins, planAssign's three-site lift, the five stable orders, and seven mutations.
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
  // ═══ CE-45 ELZ-1 cut 2c · RUNG b132 (b106's harness above, taken verbatim; its cells are b106's own) ═══════════════════════════════
  const PS1 = '+919000000001'; const PS2 = '+919000000002'; const PS3 = '+919000000003';
  const sarahs = (w) => { w['public.leads'].push(
    leadRow({ id: 'l-s1', name: 'Sarah Walk', phone: PS1, wedding_date: '2027-06-12' }),
    leadRow({ id: 'l-s2', name: 'Sarah Walk', phone: PS2, wedding_date: '2027-03-05' }),
    leadRow({ id: 'l-s3', name: 'Sarah Walk', phone: PS3, wedding_date: '2027-09-01' }));
    for (const [id, ph] of [['ct-s1', PS1], ['ct-s2', PS2], ['ct-s3', PS3]]) { w['public.conversations'].push({ id, vendor_id: V.id, counterparty_phone: ph, kind: 'couple_thread', state: 'active', last_message_at: new Date(Date.now() - 3600e3).toISOString() }); w['public.messages'].push({ id: `in-${id}`, conversation_id: id, direction: 'inbound', channel: 'whatsapp', body: 'hi', created_at: new Date(Date.now() - 3600e3).toISOString() }); }
    return w; };
  const B8_3 = '3 clients are called Sarah Walk: 1. Sarah Walk (5 March 2027) 2. Sarah Walk (12 June 2027) 3. Sarah Walk (1 September 2027). Reply with the number.';
  const TELL = req([relay('Sarah Walk')]);
  let db; let r;

  sec('1 B8, the client pick (V9; F1; F3; F-44.178)');
  db = makeDb(sarahs(world()));
  r = await turn(db, 'Tell Sarah Walk hello', TELL);
  T('1.1 three same-named clients: his B8, numbered in ONE order (wedding date ascending), and a note carrying the lead ids in that order', r.reply === B8_3 && noteIn(db).asked === 'B8' && JSON.stringify(noteIn(db).lead_ids) === JSON.stringify(['l-s2', 'l-s1', 'l-s3']));
  r = await turn(db, '2', NONE);
  T('1.2 "2" binds the SECOND SHOWN lead: the relay is framed and stored to l-s1\'s own phone (the pin through L\'s resolveLead)', r.keys === 'B37' && draftsIn(db).length === 1 && d0(db).couple_phone === PS1);
  db = makeDb(sarahs(world()));
  await turn(db, 'Tell Sarah Walk hello', TELL);
  db.tables['public.leads'].find((l) => l.id === 'l-s1').deleted_at = '2026-09-21T05:59:00Z';
  r = await turn(db, '2', NONE);
  T('1.3 the picked lead VANISHED between the ask and the answer: asked again from the CURRENT records (two left, new ids), nothing staged', r.keys === 'B8' && r.reply === 'Two clients are called Sarah Walk: 1. Sarah Walk (5 March 2027) 2. Sarah Walk (1 September 2027). Reply with the number.' && draftsIn(db).length === 0 && JSON.stringify(noteIn(db).lead_ids) === JSON.stringify(['l-s2', 'l-s3']));
  db = makeDb(sarahs(world()));
  await turn(db, 'Tell Sarah Walk hello', TELL);
  db.tables['public.leads'].find((l) => l.id === 'l-s1').name = 'Sarah Walker';
  r = await turn(db, '2', NONE);
  T('1.4 the picked lead was RENAMED: it never binds; asked again from the current records', r.keys === 'B8' && draftsIn(db).length === 0);
  db = makeDb(sarahs(world()));
  await turn(db, 'Tell Sarah Walk hello', TELL);
  r = await turn(db, '9', NONE); const r9 = r.keys;
  r = await turn(db, '9', NONE);
  T('1.5 out of range: asked again ONCE, then B3; nothing staged', r9 === 'B8' && r.keys === 'B3' && draftsIn(db).length === 0);
  const wds = src(WDf);
  T('1.6 F1: every B8 site reaches resolveLead THROUGH L, which the pick replaces for the replay only (pinLifecycle)', (wds.match(/await L\.lifecycle\.resolveLead\(/g) || []).length >= 8 && /L\.lifecycle = pinLifecycle\(L\.lifecycle, note\.pick_name, lead\);/.test(wds));

  sec('2 B24, the package pick (V12)');
  const golds = () => { const w = world(); w['public.vendor_packages'].push(pkgRow({ id: 'p-g1', name: 'Gold', total: 80000, delivery_basis: 'days', delivery_days: 30 }), pkgRow({ id: 'p-g2', name: 'Gold', total: 95000, delivery_basis: 'days', delivery_days: 30 })); return w; };
  const ATTG = req([{ act: 'attach_package', client_as_spoken: 'Asha Walk Fifteen', package_as_spoken: 'Gold' }]);
  db = makeDb(golds());
  r = await turn(db, 'Attach Gold to Asha Walk Fifteen', ATTG);
  T('2.1 two same-named packages: his B24, numbered in ONE order (name, then id), the note carrying the package ids', r.reply === 'Two packages are called Gold: 1. Gold (Rs 80,000) 2. Gold (Rs 95,000). Reply with the number.' && JSON.stringify(noteIn(db).package_ids) === JSON.stringify(['p-g1', 'p-g2']));
  r = await turn(db, '2', NONE);
  const lpG = db.tables['public.lead_packages'].find((x) => x.lead_id === 'l-asha' && !x.deleted_at);
  T('2.2 "2" attaches the SECOND SHOWN package (p-g2)', !!lpG && lpG.package_id === 'p-g2');

  sec('3 B10, the invoice pick (V10), served by id');
  const invw = () => { const w = world();
    w['engine.records'].push({ id: 'b-a', agent_id: AG, client: 'Asha Walk Fifteen', phone: PHONE, amount: 100000, amount_received: 0, note: null, date: '2027-03-05', hidden: false });
    w['public.invoices'].push({ id: 'i-2', vendor_id: V.id, binder_id: 'b-a', invoice_number: 'INV-002', state: 'issued', pdf_url: 'https://x/2.pdf', created_at: '2026-09-10T00:00:00Z', deleted_at: null, lead_package_id: null },
      { id: 'i-1', vendor_id: V.id, binder_id: 'b-a', invoice_number: 'INV-001', state: 'issued', pdf_url: 'https://x/1.pdf', created_at: '2026-09-01T00:00:00Z', deleted_at: null, lead_package_id: null });
    return w; };
  const INV = req([{ act: 'invoice', client_as_spoken: 'Asha Walk Fifteen' }]);
  db = makeDb(invw());
  r = await turn(db, 'Invoice for Asha Walk Fifteen', INV);
  T('3.1 two live invoices: his B10, numbered oldest first (created_at, then id), the note carrying the invoice ids', r.reply === 'Which invoice for Asha Walk Fifteen? 1. INV-001 2. INV-002. Reply with the number.' && JSON.stringify(noteIn(db).invoice_ids) === JSON.stringify(['i-1', 'i-2']));
  r = await turn(db, '2', NONE);
  const docs = (r.said && r.said.documents) || [];
  T('3.2 "2" serves INV-002 ITSELF, by id (its own PDF), recorded with its invoice_id; the generator is not asked', docs.length === 1 && docs[0].invoice_number === 'INV-002' && docs[0].pdf_url === 'https://x/2.pdf' && tc(r).some((c) => c.input && c.input.invoice_id === 'i-2'));

  sec('4 the crew picks under F2\'s lift (V14, V15)');
  const crew = (twoRahuls, twoShoots) => { const w = world();
    w['public.team_members'].push({ id: '00000000-0000-4000-8000-0000000000a1', vendor_id: V.id, name: 'Rahul', role: 'photographer', phone: null, active: true, deleted_at: null, created_at: '2026-09-01T00:00:00Z' });
    if (twoRahuls) w['public.team_members'].push({ id: '00000000-0000-4000-8000-0000000000a2', vendor_id: V.id, name: 'Rahul', role: 'editor', phone: null, active: true, deleted_at: null, created_at: '2026-09-01T00:00:00Z' });
    w['public.events'].push({ id: 'e-1', vendor_id: V.id, kind: 'shoot', state: 'upcoming', title: 'Asha Walk Fifteen', event_date: '2027-03-05', linked_lead_id: 'l-asha', assigned_member_ids: [], deleted_at: null });
    if (twoShoots) w['public.events'].push({ id: 'e-2', vendor_id: V.id, kind: 'shoot', state: 'upcoming', title: 'Asha Walk Fifteen', event_date: '2027-03-06', linked_lead_id: 'l-asha', assigned_member_ids: [], deleted_at: null });
    return w; };
  const ASSIGN = req([{ act: 'assign_crew', member_as_spoken: 'Rahul', client_as_spoken: 'Asha Walk Fifteen' }]);
  db = makeDb(crew(true, false));
  r = await turn(db, 'Put Rahul on Asha Walk Fifteen', ASSIGN);
  T('4.1 two members of one name: his B61, numbered (name, then id), a B61 note with their ids', r.reply === 'Two on your team are called Rahul: 1. Rahul (photographer) 2. Rahul (editor). Reply with the number.' && noteIn(db).asked === 'B61' && JSON.stringify(noteIn(db).pick_ids) === JSON.stringify(['00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a2']));
  r = await turn(db, '2', NONE);
  const e1 = db.tables['public.events'].find((e) => e.id === 'e-1');
  T('4.2 "2" assigns the SECOND SHOWN member (the editor) to the shoot', (e1.assigned_member_ids || []).map(String).includes('00000000-0000-4000-8000-0000000000a2') && !(e1.assigned_member_ids || []).map(String).includes('00000000-0000-4000-8000-0000000000a1'));
  db = makeDb(crew(false, true));
  r = await turn(db, 'Put Rahul on Asha Walk Fifteen', ASSIGN);
  T('4.3 two shoots for the client: his B53, numbered by date, a B53C note (apart from the move-and-cancel note) with the event ids', r.reply === 'Which shoot for Asha Walk Fifteen? 1. 5 March 2027 2. 6 March 2027. Reply with the number.' && noteIn(db).asked === 'B53C' && JSON.stringify(noteIn(db).pick_ids) === JSON.stringify(['e-1', 'e-2']));
  r = await turn(db, '2', NONE);
  const e2 = db.tables['public.events'].find((e) => e.id === 'e-2');
  T('4.4 "2" assigns Rahul to the SECOND SHOWN shoot (e-2) and not the first', (e2.assigned_member_ids || []).map(String).includes('00000000-0000-4000-8000-0000000000a1') && !(db.tables['public.events'].find((e) => e.id === 'e-1').assigned_member_ids || []).length);
  db = makeDb(crew(false, true));
  r = await turn(db, 'Cancel Asha Walk Fifteen\'s shoot', req([{ act: 'cancel_event', client_as_spoken: 'Asha Walk Fifteen' }]));
  const r53 = r.reply;
  r = await turn(db, '2', NONE);
  T('4.5 the move-and-cancel pick: his B53 numbered, and "2" asks the cancel of the SECOND SHOWN shoot (6 March 2027)', r53 === 'Which shoot for Asha Walk Fifteen? 1. 5 March 2027 2. 6 March 2027. Reply with the number.' && /6 March 2027/.test(r.reply) && r.keys === 'B50');

  sec('5 the money functions and planAssign');
  const PIN = JSON.parse(src('scripts/b115_lcv15_lsp4_bench.js').match(/const PIN = (\{[^\n]*\});/)[1]);
  const body = (t, name) => { const i = t.search(new RegExp(`^(async )?function ${name}\\b`, 'm')); if (i < 0) return ''; let j = t.indexOf('(', i); let dd = 0; for (; j < t.length; j += 1) { if (t[j] === '(') dd += 1; else if (t[j] === ')') { dd -= 1; if (dd === 0) break; } } const k = t.indexOf('{', j); dd = 0; for (let m = k; m < t.length; m += 1) { if (t[m] === '{') dd += 1; else if (t[m] === '}') { dd -= 1; if (dd === 0) return t.slice(i, m + 1); } } return ''; };
  const shaB = (x) => require('crypto').createHash('sha256').update(x, 'utf8').digest('hex');
  T('5.1 F1: planMoney, planPayment, planBooking, applyRow and reread BYTE-IDENTICAL to b115\'s pins', ['planMoney', 'planPayment', 'planBooking', 'applyRow', 'reread'].every((f) => shaB(body(wds, f)) === PIN[f]));
  const baseWD = require('child_process').execSync('git show 7505ff2:src/lib/vendor/workingDoor.js', { cwd: P('.'), encoding: 'utf8', maxBuffer: 1 << 26 });
  const undo = (t) => t
    .replace("    // CE-45 ELZ-1 cut 2c, F2's lift (V15): a picked member (act.member_id) is honoured only while active and still carrying the spoken name\n    const pinM = typeof act.member_id === 'string' ? rows.filter((m) => String(m.id) === act.member_id && key(m.name) === key(member)) : [];\n    const exact = pinM.length === 1 ? pinM : rows.filter((m) => key(m.name) === key(member));", "    const exact = rows.filter((m) => key(m.name) === key(member));")
    .replace("      // cut 2c, F2's lift (V14): a picked shoot (act.event_id) is honoured only while it is still one of hers\n      if (typeof act.event_id === 'string') { const ps = shoots.filter((r) => String(r.id) === act.event_id); if (ps.length === 1) shoots = ps; }\n", '')
    .replace(", pickIds: shoots.map((r) => String(r.id)), pickKind: 'event' }", ' }')
    .replace(", pickIds: exact.map((m) => String(m.id)), pickKind: 'member' }", ' }');
  T('5.2 F2\'s lift: planAssign differs from 7505ff2 at EXACTLY its three sites (the member pin, the shoot pin, the two ids handed out); undone, it is byte-identical', undo(body(wds, 'planAssign')) === body(baseWD, 'planAssign') && body(wds, 'planAssign') !== body(baseWD, 'planAssign'));

  sec('6 mutations of production code: each reddens its cell');
  await mut('6.1 M1 the pin dropped (the replay\'s lifecycle unpinned): "2" never binds, the pick is asked again (reddens 1.2)', WDf, [['        L.lifecycle = pinLifecycle(L.lifecycle, note.pick_name, lead);', '        void pinLifecycle;']], [],
    async (rq) => { const d = makeDb(sarahs(world())); await turn(d, 'Tell Sarah Walk hello', TELL, { M: rq(WDf) }); const x = await turn(d, '2', NONE, { M: rq(WDf) }); return x.keys === 'B37' && d0(d).couple_phone === PS1; }, (v) => v === false);
  await mut('6.2 M2 the vanished check removed: a DELETED lead is bound (reddens 1.3)', WDf, [[".eq('vendor_id', vendorId).eq('id', id).is('deleted_at', null).maybeSingle();", ".eq('vendor_id', vendorId).eq('id', id).maybeSingle();"]], [],
    async (rq) => { const d = makeDb(sarahs(world())); await turn(d, 'Tell Sarah Walk hello', TELL, { M: rq(WDf) }); d.tables['public.leads'].find((l) => l.id === 'l-s1').deleted_at = '2026-09-21T05:59:00Z'; const x = await turn(d, '2', NONE, { M: rq(WDf) }); return x.keys; }, (v) => v !== 'B8');
  await mut('6.3 M3 leadsNamed\'s order REVERSED: B8 no longer lists by date (reddens 1.1)', WDf, [['  return hits.sort(byDateThenId((l) => l.wedding_date));', '  return hits.sort(byDateThenId((l) => l.wedding_date)).reverse();']], [],
    async (rq) => (await turn(makeDb(sarahs(world())), 'Tell Sarah Walk hello', TELL, { M: rq(WDf) })).reply, (v) => v !== B8_3);
  await mut('6.4 M4 packagesOf\'s order REVERSED: B24 lists p-g2 first (reddens 2.1)', WDf, [['const ia = String(a && a.id); const ib = String(b && b.id); return ia < ib ? -1 : ia > ib ? 1 : 0; });\n}\nasync function planAttach(', 'const ia = String(a && a.id); const ib = String(b && b.id); return ia < ib ? 1 : ia > ib ? -1 : 0; });\n}\nasync function planAttach(']], [],
    async (rq) => (await turn(makeDb(golds()), 'Attach Gold to Asha Walk Fifteen', ATTG, { M: rq(WDf) })).reply, (v) => v === 'Two packages are called Gold: 1. Gold (Rs 95,000) 2. Gold (Rs 80,000). Reply with the number.');
  await mut('6.5 M5 the invoices\' order REVERSED: B10 lists INV-002 first (reddens 3.1)', WDf, [['.sort(byDateThenId((i) => i.created_at));', '.sort(byDateThenId((i) => i.created_at)).reverse();']], [],
    async (rq) => (await turn(makeDb(invw()), 'Invoice for Asha Walk Fifteen', INV, { M: rq(WDf) })).reply, (v) => v === 'Which invoice for Asha Walk Fifteen? 1. INV-002 2. INV-001. Reply with the number.');
  await mut('6.6 M6 membersOf\'s order REVERSED: B61 lists the editor first (reddens 4.1)', WDf, [["return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });", "return a.id < b.id ? 1 : a.id > b.id ? -1 : 0; });"]], [],
    async (rq) => (await turn(makeDb(crew(true, false)), 'Put Rahul on Asha Walk Fifteen', ASSIGN, { M: rq(WDf) })).reply, (v) => v === 'Two on your team are called Rahul: 1. Rahul (editor) 2. Rahul (photographer). Reply with the number.');
  await mut('6.7 M7 shootsOf\'s order REVERSED: B53 lists 6 March first (reddens 4.3)', WDf, [['      .sort(byDateThenId((e) => e.event_date));', '      .sort(byDateThenId((e) => e.event_date)).reverse();']], [],
    async (rq) => (await turn(makeDb(crew(false, true)), 'Put Rahul on Asha Walk Fifteen', ASSIGN, { M: rq(WDf) })).reply, (v) => v === 'Which shoot for Asha Walk Fifteen? 1. 6 March 2027 2. 5 March 2027. Reply with the number.');

  console.log(`\nb132_elz1_cut2c_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(`FAILED: ${failed.join(' · ')}`); process.exit(1); }
}
main().catch((e) => { console.log(`BENCH CRASHED: ${e && e.stack}`); process.exit(1); });
