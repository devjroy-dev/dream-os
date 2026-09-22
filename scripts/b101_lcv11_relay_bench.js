'use strict';
// scripts/b101_lcv11_relay_bench.js · TDW CE-45 · LCV-11 · LC-Victor P6b, THE FIRST CUT: a message to a client routed from the door on the
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

  sec('0 the records are what the tables hold');
  const wr = src(RECORD);
  T('0.1 [record cell, green at the base too] the walk record holds turn 11 as this bench replays it', wr.includes(`HE: ${WR11_SAID}`) && wr.includes(`HEARD: ${WR11_JSON}`));
  T('0.2 [record cell, green at the base too] LCT row 4 (phone, both seats) is the phone sentence with phone_as_spoken "98765 43210" verbatim', rec(LCT['4/C1/phone']).acts[0].phone_as_spoken === '98765 43210' && canon(rec(LCT['4/C1/phone'])) === canon(rec(LCT['4/C2/phone'])));
  T('0.3 [record cell, green at the base too] LCT rows 5 equal the walk record\'s hearing (the record and the live ear agree)', canon(rec(LCT['5/C1/asis'])) === canon(rec(WR11_JSON)));

  sec('1 the bytes, his, hash-carried');
  T('1.1 B37 is the frame with "Reply YES or NO." and its hash literal is the sha256 of its bytes', DL.LINES.B37 === 'Here is the draft:\n\n"{body}"\n\nSend this to {client} ({phone})? Reply YES or NO.' && DL.LINE_HASHES.B37 === sha(DL.LINES.B37));
  T('1.2 B38 and B39 are his bytes and their hashes hold', DL.LINES.B38 === 'Could not send the message. No client called {name}.' && DL.LINES.B39 === 'Could not send the quote. {client} has no package yet. Attach a package first.' && DL.LINE_HASHES.B38 === sha(DL.LINES.B38) && DL.LINE_HASHES.B39 === sha(DL.LINES.B39));
  T('1.3 showFrame renders the row: name and stored phone verbatim, the body untouched', FRAME_ASHA === `Here is the draft:\n\n"${BODY}"\n\nSend this to Asha Walk Fifteen (${PHONE})? Reply YES or NO.`);
  T('1.4 a name that IS the phone (F-06.186) and no name at all render the phone alone, one sentence', showFrame('b', '+918595986978', '+918595986978') === 'Here is the draft:\n\n"b"\n\nSend this to +918595986978? Reply YES or NO.' && showFrame('b', null, '+918595986978') === showFrame('b', '+918595986978', '+918595986978') && showFrame('b', null, '+918595986978') !== null);
  T('1.5 ONE HOME: relaySeat.showBlock speaks B37 byte for byte, and the August frame is gone from the tree (mismatchBlock ⑨, unreached, keeps its own bytes)', RS.showBlock(BODY, 'Asha Walk Fifteen', PHONE) === FRAME_ASHA && !src(RSf).includes('Here is the draft:\\n\\n"${body}"') && /function showBlock\(body, name, phone\) \{[\s\S]*?return require\('\.\/doorLines'\)\.showFrame\(body, name, phone\);\n\}/.test(src(RSf)));
  T('1.6 showFrame is total: no body, no phone, hostile values yield null and never throw', typeof DL.showFrame === 'function' && showFrame('', 'x', PHONE) === null && showFrame('b', 'x', '') === null && showFrame(null, null, null) === null && showFrame({}, [], 7) === null);
  T('1.7 [boundary, green at the base too: B39 is absent there] B39 is carried and SPOKEN NOWHERE in the door yet (quote_send is the second cut\'s)', !src(WDf).includes("'B39'") && !WD.COVERED.includes('quote_send'));
  T('1.8 example 10 switches on: covering relay puts "Send a message to my client asking for the advance" in the leftover pool', DL.leftover(WD.COVERED, () => 0.999).includes('Send a message to my client asking for the advance') && !DL.leftover(WD.COVERED.filter((a) => a !== 'relay'), () => 0.999).includes('Send a message to my client asking for the advance'));

  sec('2 the ear hears a phone (F-44.96): the measured bytes ship');
  const slot = LD.EAR_TOOL.input_schema.properties.acts.items.properties.phone_as_spoken;
  T('2.1 EAR_TOOL carries phone_as_spoken with the description the check measured, byte for byte', !!slot && slot.type === 'string' && slot.description === 'A phone number she gave, exactly as she typed it, digits and spaces and all. Empty if none.');
  T('2.2 SYSTEM ends with the one measured sentence', LD.SYSTEM.endsWith('A phone number said with a lead is recorded in phone_as_spoken exactly as she typed it.'));
  T('2.3 normaliseRequest KEEPS the phone (LCT 4/C1/phone and 4/C2/phone replayed: RAW in, the slot out)', LD.normaliseRequest(rec(LCT['4/C1/phone'])).acts[0].phone_as_spoken === '98765 43210' && LD.normaliseRequest(rec(LCT['4/C2/phone'])).acts[0].phone_as_spoken === '98765 43210');
  await mut('2.4 MUTATION: normaliseRequest dropping the slot reddens 2.3', LDf, [["      if (typeof a.phone_as_spoken === 'string' && a.phone_as_spoken.trim()) out.phone_as_spoken = a.phone_as_spoken.trim();\n", '']], [], async (r) => r(LDf).normaliseRequest(rec(LCT['4/C1/phone'])).acts[0].phone_as_spoken, (v) => v === undefined);

  sec('3 a lead with a number files by message again (the card, step 1)');
  let db = makeDb(world()); let r = await turn(db, S4, LD.normaliseRequest(rec(LCT['4/C1/phone'])));
  T('3.1 THE CARD (LCT 4/C1/phone replayed): the lead files with phone +919876543210 (asPhone), B16, the guard gone', r.keys === 'B16' && r.reply === 'Lead added: Asha Walk Fifteen.' && leadsIn(db).length === 1 && leadsIn(db)[0].phone === '+919876543210' && leadsIn(db)[0].name === 'Asha Walk Fifteen');
  db = makeDb(world()); r = await turn(db, S4, LD.normaliseRequest(rec(LCT['4/C2/asis'])));
  T('3.2 LCT 4/C2/asis (the old ear, no slot): the same message files the lead WITH the number the door read itself (F-44.96\'s second half), never B34', r.keys === 'B16' && leadsIn(db).length === 1 && (leadsIn(db)[0] || {}).phone === '+919876543210' && r.out.why !== 'lead_phone');
  db = makeDb(world()); r = await turn(db, 'Add a new lead Asha Walk Fifteen, 96257 59924', req([{ act: 'lead', client_as_spoken: 'Asha Walk Fifteen', phone_as_spoken: '96257 59924' }]));
  T('3.3 THE CARD: the test couple\'s number on a lead already carrying it is createLead\'s own dedupe, B19 naming the ROW', r.keys === 'B19' && r.reply === 'That number is already on Asha Walk Fifteen. Nothing new was added.' && leadsIn(db).length === 0);
  db = makeDb(world()); r = await turn(db, 'x', req([{ act: 'lead', client_as_spoken: 'Meena Walk Fifteen', phone_as_spoken: 'call me' }]));
  T('3.4 [boundary, green at the base too: it never read the slot] a phone_as_spoken that is not phone-shaped is no phone: the lead files without one', r.keys === 'B16' && (leadsIn(db)[0] || {}).phone === null);
  // F-44.96's SECOND HALF (the chair's ruling of 22 September on b93 11.4): the door reads her message itself for the phone.
  const T5_SAID = 'Add a new lead Walk P8 Phone, 9876543210';
  const T5_JSON = '{"acts":[{"act":"lead","amount_rupees":9876543210,"client_as_spoken":"Walk P8"}],"route":"task"}';
  T('3.5a the walk record holds turn 5 as replayed below', src(RECORD).includes(`HE: ${T5_SAID}`) && src(RECORD).includes(`HEARD: ${T5_JSON}`));
  db = makeDb(world()); r = await turn(db, T5_SAID, rec(T5_JSON));
  T('3.5b THE RECORD (walk turn 5 replayed verbatim: "Phone" dropped, the number misfiled into amount_rupees, no slot): the door reads the ONE run itself and files Walk P8 WITH +919876543210, B16 (the shortened name is F-44.119, closed)', r.keys === 'B16' && r.reply === 'Lead added: Walk P8.' && leadsIn(db).length === 1 && leadsIn(db)[0].phone === '+919876543210');
  db = makeDb(world()); r = await turn(db, 'Add a new lead Meena Walk Fifteen, 98765 43210 or 98765 43211', req([{ act: 'lead', client_as_spoken: 'Meena Walk Fifteen' }]));
  T('3.5c TWO phone-shaped runs and no slot: the door does not guess; B34 (the one place the guard\'s reply survives), nothing filed', r.reply === B34 && r.out.why === 'lead_phone' && leadsIn(db).length === 0);
  db = makeDb(world()); r = await turn(db, 'Add a new lead Meena Walk Fifteen, 98765 43210 or 98765 43211', req([{ act: 'lead', client_as_spoken: 'Meena Walk Fifteen', phone_as_spoken: '98765 43211' }]));
  T('3.5d two runs but the slot heard one: the SLOT decides, the lead files with it', r.keys === 'B16' && leadsIn(db)[0].phone === '+919876543211');
  T('3.5e the slot and the floor are two paths to one row: row 4\'s RAW (3.1) and turn 5\'s record (3.5b) both file +919876543210', true);
  await mut('3.5f MUTATION: the floor removed, turn 5\'s record files Walk P8 WITHOUT its number (3.5b red)', WDf, [["      if (runs.length === 1) phone = foldPhone(runs[0]);\n", '']], [], async (rq) => { const d = makeDb(world()); await turn(d, T5_SAID, rec(T5_JSON), { M: rq(WDf) }); return leadsIn(d)[0] && leadsIn(d)[0].phone; }, (v) => v === null);
  T('3.5 the guard\'s exit survives in ONE place only: the two-runs case', (src(WDf).match(/CHAIN\(st\.ear, 'lead_phone'\)/g) || []).length === 1);
  await mut('3.6 MUTATION: the slot\'s fold removed, a phone heard in the slot with no run in the text never reaches createLead (3.1\'s path red)', WDf, [["    if (heardPhone) phone = foldPhone(act.phone_as_spoken);\n", '']], [], async (r) => { const d = makeDb(world()); const o = await turn(d, 'x', LD.normaliseRequest(rec(LCT['4/C1/phone'])), { M: r(WDf) }); return leadsIn(d)[0] && leadsIn(d)[0].phone; }, (v) => v === null);
  db = makeDb(world()); r = await turn(db, 'x', LD.normaliseRequest(rec(LCT['4/C1/phone'])));
  T('3.6a (its green twin) the slot alone, no run in the text, files the number', (leadsIn(db)[0] || {}).phone === '+919876543210');

  sec('4 a message to a client, routed from the door (the WhatsApp lane)');
  db = makeDb(world()); r = await turn(db, WR11_SAID, rec(WR11_JSON));
  T('4.1 THE RECORD (walk turn 11 replayed verbatim): the frame for Walk Test, the draft STORED, the note keeps the row\'s id, nothing sent', r.keys === 'B37' && r.reply === frame('Walk Test') && draftsIn(db).length === 1 && d0(db).state === 'staged' && d0(db).body === BODY && d0(db).couple_phone === PHONE2 && noteOf(db) && noteIn(db).asked === 'B37' && noteIn(db).draft_id === d0(db).id && sent.length === 0);
  // e-62's guard (the fix cut): at the base no compose runs, so every read of composed[0] is guarded and reads as a named FAIL, never a crash.
  T('4.2 the composer ran ONCE on the LISTENER\'S seat (R-45.1), with ONE tool, draft_message, forced', composed.length === 1 && (composed[0] || {}).provider === 'deepseek' && (composed[0] || {}).model === 'm-listen' && J((composed[0] || {}).tools) === 'draft_message' && (composed[0] || {}).choice === 'draft_message');
  T('4.2a (r2) the composer is handed the vendor\'s business name from the vendors row, then the client\'s name, then her whole message, as three lines', (composed[0] || {}).user === `The vendor's business: Walk Studio\nThe client's name: Walk Test\nHer instruction: ${WR11_SAID}`);
  T('4.3 the recorded call is donna_relay_stage carrying the STORED body and the seat', tc(r).length === 1 && tc0(r).name === 'donna_relay_stage' && tc0(r).input.message === BODY && tc0(r).input.seat === 'deepseek/m-listen' && tc0(r).result === 'staged');
  r = await turn(db, 'YES', NONE);
  T('4.4 THE CARD: her YES sends the STORED bytes to the stored phone from the vendor lane, the row is sent, the seat\'s own ③ speaks', r.reply === `Sent to Walk Test (${PHONE2}).` && sent.length === 1 && sent[0].to === PHONE2 && sent[0].text === BODY && sent[0].from === FROM && d0(db).state === 'sent' && d0(db).twilio_sid === 'wamid.1' && tc0(r).name === 'donna_relay_send' && r.out.answered === 'B37');
  T('4.5 [boundary, green at the base too: no note ever existed there] the note is spent: no note rides the sent turn', noteOf(db) === undefined);
  db = makeDb(world()); r = await turn(db, 'Send a message to Asha Walk Fifteen asking for the advance', req([relay('Asha Walk Fifteen')]));
  T('4.6 THE CARD (the fresh name): the frame for Asha Walk Fifteen', r.reply === FRAME_ASHA && r.keys === 'B37');
  r = await turn(db, 'No', NONE);
  T('4.7 THE CARD: her NO refuses the row (vendor_declined) and reads the seat\'s declined byte; nothing sent', r.reply === "Not sent — I've dropped it. Nothing went to Asha Walk Fifteen. Tell me when you want to write to her again." && d0(db).state === 'refused' && d0(db).refusal_reason === 'vendor_declined' && sent.length === 1 && r.out.why === 'draft_declined');
  db = makeDb(world()); r = await turn(db, 'Tell Priya Walk Fifteen hello', req([relay('Priya Walk Fifteen')]));
  T('4.8 THE CARD: a client who is no client of hers is B38, HIS byte; nothing stored, nothing composed', r.keys === 'B38' && r.reply === 'Could not send the message. No client called Priya Walk Fifteen.' && draftsIn(db).length === 0 && composed.length === 2);
  db = makeDb(world()); r = await turn(db, 'Tell Asha Walk Fiften hello', req([relay('Asha Walk Fiften')]));
  T('4.9 a one-letter slip is offered through the ONE home (B36), nothing stored', r.reply === 'Did you mean Asha Walk Fifteen? Reply YES or NO.' && draftsIn(db).length === 0);
  r = await turn(db, 'yes', NONE);
  T('4.10 her YES to the offer runs the relay with the row\'s own name: the frame', r.reply === FRAME_ASHA && draftsIn(db).length === 1);
  db = makeDb(world()); r = await turn(db, S1, LD.normaliseRequest(rec(LCT['1/C1/asis'])));
  T('4.11 LCT 1/C1/asis replayed: a nameless relay asks B35 with a note; nothing stored', r.reply === B35 && noteOf(db) && noteIn(db).asked === 'B35' && draftsIn(db).length === 0);
  r = await turn(db, 'Asha Walk Fifteen', req([{ act: 'find', client_as_spoken: 'Asha Walk Fifteen' }], 'search'));
  T('4.12 THE CARD: her name answers B35 and the frame follows', r.reply === FRAME_ASHA);
  db = makeDb(world()); r = await turn(db, S1, LD.normaliseRequest(rec(LCT['1/C2/asis'])));
  T('4.13 LCT 1/C2/asis replayed (Haiku, no slots at all): B35', r.reply === B35);
  db = makeDb(world()); r = await turn(db, S1, LD.normaliseRequest(rec(LCT['1/C1/phone'])));
  T('4.14 LCT 1/C1/phone replayed: the stray milestone "advance" on a relay is ignored; B35', r.reply === B35);
  db = makeDb(world()); db.tables['public.leads'].push(leadRow({ id: 'l-priya', name: 'Priya', phone: PHONE }));
  r = await turn(db, S2, LD.normaliseRequest(rec(LCT['2/C1/phone'])));
  T('4.15 LCT 2/C1/phone replayed: a relay carrying date_as_spoken "the 22nd" is a MESSAGE, not a date job: the frame, no B7, no B21, no date note', r.keys === 'B37' && r.reply === frame('Priya') && noteIn(db).asked === 'B37');
  db = makeDb(world()); db.tables['public.leads'].push(leadRow({ id: 'l-priya', name: 'Priya', phone: PHONE }));
  r = await turn(db, S2, LD.normaliseRequest(rec(RHT['6/phone'])));
  T('4.16 RHT 6/phone replayed ("22nd" without "the"): the same', r.keys === 'B37' && r.reply === frame('Priya'));
  db = makeDb(world()); r = await turn(db, 'Tell Asha Walk Fifteen we are free on the 22nd', req([relay('Asha Walk Fifteen', { date_as_spoken: 'the 22nd' })]));
  T('4.16a THE CARD (step 2), its own words: no record holds this sentence; its hearing is the shape RHT gave "Tell Priya we\'re free on the 22nd" 19 of 20 times (relay, the client, the date on the act): the frame, the date ignored', r.keys === 'B37' && r.reply === FRAME_ASHA);
  db = makeDb(world()); r = await turn(db, S2, LD.normaliseRequest(rec(LCT['2/C2/asis'])));
  T('4.17 [record cell, green at the base too: a none hearing was LEFTOVER before] LCT 2/C2/asis replayed (Haiku heard NOTHING, F-44.122): LEFTOVER speaks, nothing stored, nothing composed', r.keys === 'LEFTOVER' && r.reply.startsWith("I didn't catch a task in that.") && draftsIn(db).length === 0);
  await mut('4.18 MUTATION: the door READING a relay\'s date as a date job (B7 from it) reddens 4.15', WDf, [["    const name = spokenText(act && act.client_as_spoken);\n    if (!name) return null; // a nameless relay is B35's", "    if (spokenText(act && act.date_as_spoken)) return { speak: DL.LINES.B7, key: 'B7' };\n    const name = spokenText(act && act.client_as_spoken);\n    if (!name) return null; // a nameless relay is B35's"]], [], async (rq) => { const d = makeDb(world()); d.tables['public.leads'].push(leadRow({ id: 'l-priya', name: 'Priya', phone: PHONE })); const o = await turn(d, S2, LD.normaliseRequest(rec(LCT['2/C1/phone'])), { M: rq(WDf) }); return o.reply; }, (v) => v === 'I could not read that date. Say it like 5 December.');
  db = makeDb(world()); r = await turn(db, 'Send Asha Walk Fifteen a quote', LD.normaliseRequest(rec('{"route":"task","acts":[{"act":"quote_send","client_as_spoken":"Asha Walk Fifteen"}]}')));
  T('4.16b [boundary, green at the base: quote_send was uncovered there too] THE CARD (step 7, LCT row 6 replayed, quote_send on every row): the second cut\'s act reads B34, nothing composed, nothing stored, B39 unspoken', r.reply === B34 && draftsIn(db).length === 0);
  db = makeDb(world()); r = await turn(db, 'Tell Kiran Walk Fifteen hello', req([relay('Kiran Walk Fifteen')]));
  T('4.19 a lead with no number: the seat\'s own ⑧a speaks, nothing staged, nothing composed', r.keys === 'RELAY_NO_NUMBER' && r.reply.startsWith("I don't have a number on file for Kiran Walk Fifteen") && draftsIn(db).length === 0);
  db = makeDb(world()); const before = composed.length; r = await turn(db, 'Tell Asha Walk Fifteen: "We are free on the 22nd, see you then"', req([relay('Asha Walk Fifteen')]));
  T('4.20 VERBATIM: her own quoted words are the body and the composer is NOT called', r.keys === 'B37' && d0(db).body === 'We are free on the 22nd, see you then' && composed.length === before && tc0(r).input.verbatim === true);

  sec('5 the frame\'s note against the other questions');
  db = makeDb(world()); r = await turn(db, 'Send a message to Asha Walk Fifteen asking for the advance', req([relay('Asha Walk Fifteen')]));
  r = await turn(db, 'Is she booked?', req([{ act: 'find', client_as_spoken: 'Asha Walk Fifteen' }], 'search'));
  T('5.1 another act heard lapses the note: handled fresh (B34 for a lookup the door does not cover), the row stays open', r.reply === B34 && d0(db).state === 'staged');
  r = await turn(db, 'yes', NONE);
  T('5.2 a bare YES with an open row and NO note re-shows the frame ONCE with a note at tries 1 (the chair\'s ruling on fork (b))', r.reply === FRAME_ASHA && r.out.why === 'draft_reshown' && noteIn(db).tries === 1 && sent.length === 1);
  r = await turn(db, 'yes', NONE);
  T('5.3 and the next YES sends', r.reply === `Sent to Asha Walk Fifteen (${PHONE}).` && sent.length === 2);
  db = makeDb(world()); r = await turn(db, 'Send a message to Asha Walk Fifteen asking for the advance', req([relay('Asha Walk Fifteen')]));
  r = await turn(db, 'hmm', NONE);
  T('5.4 nothing heard after the frame: re-asked once (tries 1)', r.reply === FRAME_ASHA && noteIn(db).tries === 1);
  r = await turn(db, 'hmm', NONE);
  T('5.5 and then B3; the row lives on (its own 24 hours)', r.reply === B3 && d0(db).state === 'staged' && r.out.why === 'note_exhausted');
  db = makeDb(world()); r = await turn(db, 'Send a message to Asha Walk Fifteen asking for the advance', req([relay('Asha Walk Fifteen')]));
  r = await turn(db, 'Tell Walk Test hello', req([relay('Walk Test')]));
  T('5.6 a NEW relay after the frame supersedes the row at stage time (the store\'s own law) and shows the new frame', r.reply === frame('Walk Test') && draftsIn(db).length === 2 && d0(db).state === 'expired' && String(d0(db).refusal_reason).startsWith('superseded') && (draftsIn(db)[1] || {}).state === 'staged');
  db = makeDb(world());
  db.tables['public.pending_money_acts'].push({ id: 'pma-1', vendor_id: V.id, act: 'booking_confirmed', request: { lead_id: 'l-asha', lead_name: 'Asha Walk Fifteen', kind: 'booking_confirmed' }, lane: 'whatsapp', state: 'staged', created_at: new Date(NOW - 60e3).toISOString(), expires_at: new Date(NOW + 14 * 60e3).toISOString(), resolved_at: null });
  db.tables['public.pending_couple_drafts'].push({ id: 'd-open', vendor_id: V.id, conversation_id: null, couple_phone: PHONE, body: BODY, state: 'staged', twilio_sid: null, created_at: new Date(Date.now() - 60e3).toISOString(), resolved_at: null, expires_at: new Date(Date.now() + 23 * 3600e3).toISOString(), refusal_reason: null });
  const sentBefore = sent.length;
  r = await turn(db, 'yes', NONE);
  T('5.7 CONTROL (green at the base too: the money path is untouched code): A LIVE MONEY ROW WINS FIRST: with a money row and a draft both open her YES answers the MONEY question; the draft is untouched and nothing is sent', tc(r).length === 1 && tc0(r).name === 'donna_booking' && (db.tables['public.pending_money_acts'][0] || {}).state !== 'staged' && d0(db).state === 'staged' && sent.length === sentBefore);
  db = makeDb(world()); r = await turn(db, 'Tell Asha Walk Fifteen the booking is confirmed', req([relay('Asha Walk Fifteen'), money('booking_confirmed', 'Asha Walk Fifteen')]));
  T('5.8 a relay beside a money act: the FRAME is asked, the money act is NOT staged this turn and rides the note (one question at a time)', r.reply === FRAME_ASHA && db.tables['public.pending_money_acts'].length === 0 && noteIn(db).acts.length === 2 && noteIn(db).acts[1].act === 'booking_confirmed');
  await mut('5.8m MUTATION (the chair\'s ruling 1): staging the money act on the frame\'s turn anyway reddens 5.8', WDf, [['    if (relayAsked) moneyPlan = null; // the money act waits behind the frame\'s question, on its note\n', '']], [], async (rq) => { const d = makeDb(world()); d.tables['public.lead_packages'].push({ id: 'lp-m', lead_id: 'l-asha', vendor_id: V.id, total: 80000, schedule: [], snapshot: { name: 'Photographs and film' }, deleted_at: null }); await turn(d, 'Tell Asha Walk Fifteen the booking is confirmed', req([relay('Asha Walk Fifteen'), money('booking_confirmed', 'Asha Walk Fifteen')]), { M: rq(WDf) }); return d.tables['public.pending_money_acts'].length; }, (v) => v === 1);
  db.tables['public.lead_packages'].push({ id: 'lp-1', lead_id: 'l-asha', vendor_id: V.id, total: 80000, schedule: [], snapshot: { name: 'Photographs and film' }, deleted_at: null });
  r = await turn(db, 'YES', NONE);
  T('5.9 (the chair\'s ruling 1) her YES sends, THEN the money act is planned afresh and only STAGED (B2) in the same turn, never applied; a live money row now wins on the very next message', r.out.lines === undefined && r.reply.startsWith(`Sent to Asha Walk Fifteen (${PHONE}).`) && r.reply.includes('Confirm this booking? Asha Walk Fifteen · Photographs and film · Rs 80,000. Reply YES or NO.') && db.tables['public.pending_money_acts'].length === 1 && (db.tables['public.pending_money_acts'][0] || {}).state === 'staged');
  db = makeDb(world());
  db.tables['public.pending_couple_drafts'].push({ id: 'd-old', vendor_id: V.id, conversation_id: null, couple_phone: PHONE, body: BODY, state: 'staged', twilio_sid: null, created_at: new Date(Date.now() - 25 * 3600e3).toISOString(), resolved_at: null, expires_at: new Date(Date.now() - 3600e3).toISOString(), refusal_reason: null });
  db.tables['engine.messages'].push({ id: 'm-old', conversation_id: 'c-1', role: 'assistant', content: FRAME_ASHA, created_at: new Date(clock += 1000).toISOString(), meta: { listener: { door: true, note: { asked: 'B37', acts: [relay('Asha Walk Fifteen')], tries: 0, draft_id: 'd-old' } } } });
  let n0 = sent.length; r = await turn(db, 'yes', NONE);
  T('5.10 a YES after the row\'s 24 hours: the seat\'s own ⑥, the row expired, nothing sent', r.reply === "That draft is more than 24 hours old, so I haven't sent it. Tell me again and I'll write it fresh." && d0(db).state === 'expired' && sent.length === n0);
  db = makeDb(world());
  db.tables['engine.messages'].push({ id: 'm-gone', conversation_id: 'c-1', role: 'assistant', content: FRAME_ASHA, created_at: new Date(clock += 1000).toISOString(), meta: { listener: { door: true, note: { asked: 'B37', acts: [relay('Asha Walk Fifteen')], tries: 0, draft_id: 'd-missing' } } } });
  n0 = sent.length; r = await turn(db, 'yes', NONE);
  T('5.11 a YES to a note whose row is gone: B14, nothing sent', r.reply === B14 && sent.length === n0);
  db = makeDb(world()); r = await turn(db, 'Tell Asha Walk Fifteen hello', req([relay('Asha Walk Fifteen')]), { composer: async () => ({ content: [], usage: {} }) });
  T('5.12 the composer answers nothing: the founder\'s glitch line, nothing stored, no note', r.keys === 'GLITCH' && draftsIn(db).length === 0 && noteOf(db) === undefined);
  db = makeDb(world(), { failInsert: 'public.pending_couple_drafts' }); r = await turn(db, 'Tell Asha Walk Fifteen hello', req([relay('Asha Walk Fifteen')]));
  T('5.13 the store refuses the row: the frame is NOT shown for bytes that were never stored (glitch line, no note)', r.keys === 'GLITCH' && noteOf(db) === undefined);

  sec('6 the seams and the laws, as code');
  T('6.1 W-1: draftSeat requires nothing under src/engine and calls no runDonnaTurn; workingDoor calls neither runRelaySeat nor doorStage (code, not comments)', srcOr(DSf).length > 0 && !/require\(['"][^'"]*engine/.test(srcOr(DSf)) && !/runDonnaTurn\(/.test(srcOr(DSf)) && !/\brunRelaySeat\(|\bdoorStage\(/.test(src(WDf)));
  T('6.2 the composer offers exactly ONE tool and it has one field', DS.DRAFT_TOOL.name === 'draft_message' && Object.keys(DS.DRAFT_TOOL.input_schema.properties).join() === 'message');
  T('6.3 composerSeat is the listener\'s seat, exactly, on a split route and on an unsplit one', canon(DS.composerSeat(ROUTE)) === canon({ provider: 'deepseek', model: 'm-listen' }) && canon(DS.composerSeat({ provider: 'anthropic', model: 'haiku-x' })) === canon({ provider: 'anthropic', model: 'haiku-x' }) && DS.composerSeat({}) === null);
  T('6.4 the WhatsApp lane hands its own transport into the door (vendorInbound.js, one anchored line)', src(VIf).includes("lane: 'whatsapp' }, { sendWhatsApp, env: process.env });"));
  T('6.5 relay is COVERED and its hand is the signal\'s own name; RELAY_ASKS is B37 and validNote admits the note with its draft id', WD.COVERED.includes('relay') && WD.HANDS.relay === 'donna_relay_stage' && J(WD.RELAY_ASKS) === 'B37' && !!WD.validNote({ asked: 'B37', acts: [relay('Asha Walk Fifteen')], tries: 0, draft_id: 'd-1' }) && WD.validNote({ asked: 'B37', acts: [relay('Asha Walk Fifteen')], tries: 0 }) === null);
  await mut('6.6 MUTATION: relay struck from COVERED, the record\'s sentence reads B34 (4.1 red)', WDf, [["'lead', 'attach_package', 'relay']", "'lead', 'attach_package']"]], [], async (rq) => { const d = makeDb(world()); const o = await turn(d, WR11_SAID, rec(WR11_JSON), { M: rq(WDf) }); return o.reply; }, (v) => v === B34);
  await mut('6.7 MUTATION: the note not kept after the frame, her YES sends nothing (4.4 red)', WDf, [['    if (st.relayNote && !st.dateAsks.length && !st.pkgAsks.length && !st.note) st.note = st.relayNote;\n', '']], [], async (rq) => { const d = makeDb(world()); const n = sent.length; await turn(d, WR11_SAID, rec(WR11_JSON), { M: rq(WDf) }); const o = await turn(d, 'YES', NONE, { M: rq(WDf) }); return sent.length === n && o.reply !== `Sent to Walk Test (${PHONE2}).`; }, (v) => v === true);
  await mut('6.8 MUTATION: the composer given every hand\'s name would be caught: tools other than draft_message make 4.2 red', DSf, [["      tools: [DRAFT_TOOL],", "      tools: [DRAFT_TOOL, { name: 'donna_booking', description: 'x', input_schema: { type: 'object', properties: {} } }],"]], [WDf], async (rq) => { const d = makeDb(world()); const n = composed.length; await turn(d, WR11_SAID, rec(WR11_JSON), { M: rq(WDf) }); return J(composed[n].tools); }, (v) => v !== 'draft_message');
  await mut('6.9 CONTROL (does not redden, labelled): the composer\'s prompt reworded changes no cell of this rung', DSf, [["'You write one short WhatsApp message", "'You write one WhatsApp message"]], [WDf], async (rq) => { const d = makeDb(world()); const o = await turn(d, WR11_SAID, rec(WR11_JSON), { M: rq(WDf) }); return o.keys; }, (v) => v === 'B37');
  const man = fs.existsSync(P(MAN)) ? src(MAN).split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#')) : [];
  T('6.10 W-1 NONE and the manifest names exactly the cut\'s paths', man.every((p) => !/^src\/engine\/|soul|lens|^db\/migrations\//.test(p)) && JSON.stringify(man.slice().sort()) === JSON.stringify(['docs/handovers/TDW_CE45_LCV11_P6B_HANDOVER.md', MAN, 'scripts/b101_lcv11_relay_bench.js', WDf, LDf, DSf, DLf, RSf, VIf, 'scripts/b90_lcv_p5_bench.js', 'scripts/b92_lcv_p6a_bench.js', 'scripts/b93_lcv9_chain_out_bench.js', 'scripts/b94_lcv10_bench.js', 'scripts/b95_lcv10_note_bench.js', 'scripts/b97_lcv10_name_bench.js', 'scripts/b98_lcv10_package_bench.js', 'scripts/b99_lcv10_didyoumean_bench.js', 'scripts/b06_relay_hand_bench.js', 'scripts/b06_bride_arrival_bench.js', 'scripts/b68_introductions_bench.js'].sort()));
  db = makeDb(world()); r = await turn(db, 'Tell Asha Walk Fifteen thank you', req([relay('Asha Walk Fifteen')]), { lane: 'pwa' });
  T('6.12 THE CARD (step 12): the pwa lane is the SECOND cut\'s: a relay there reads B34, nothing composed, nothing stored', r.reply === B34 && r.out.why === 'relay_pwa' && draftsIn(db).length === 0);
  db = makeDb(world()); db.tables['public.pending_couple_drafts'].push({ id: 'd-wa', vendor_id: V.id, conversation_id: null, couple_phone: PHONE, body: BODY, state: 'staged', twilio_sid: null, created_at: new Date(Date.now() - 60e3).toISOString(), resolved_at: null, expires_at: new Date(Date.now() + 23 * 3600e3).toISOString(), refusal_reason: null });
  n0 = sent.length; r = await turn(db, 'yes', NONE, { lane: 'pwa' });
  T('6.13 a bare yes on the pwa lane with a WhatsApp draft open: LEFTOVER as today, the row untouched, nothing sent', r.keys === 'LEFTOVER' && d0(db).state === 'staged' && sent.length === n0);
  T('6.11 nothing under src/ names pending_couple_drafts as a writer but the store (b06 §7.3\'s law holds through this cut)', srcOr(DSf).length > 0 && !srcOr(DSf).includes("from('pending_couple_drafts')") && !src(WDf).includes('pending_couple_drafts'));

  console.log(`\nb101_lcv11_relay_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(`FAILED: ${failed.join(' · ')}`); process.exit(1); }
}
main().catch((e) => { console.log(`BENCH CRASHED: ${e && e.stack}`); process.exit(1); });
