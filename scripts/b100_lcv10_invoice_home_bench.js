'use strict';
// scripts/b100_lcv10_invoice_home_bench.js · TDW CE-44 · LCV-10 · THE INVOICES CUT: engine.records' binder names join the "Did you mean" home. Rung b100.
//
// R-44.40 is system-wide (the founder). planInvoice's binder lookup is exact by key(); where it finds NO binder, the home (nearestName, the same
// pinned distance, the same refusals) is asked over the binder names of engine.records for this agent, live rows only; ONE candidate is offered as
// B36 with a note; YES runs the invoice act with the candidate's own binder name through planInvoice as any turn; NO is B3; never while a money
// row is live; a name near nothing is B15 as today. e-74's correction of the B-1 FIX handover rides here. THE EXIT CODE IS THE VERDICT.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-ce44-lcv10-invoices.txt';
const RECORD = 'docs/handovers/TDW_CE44_LCV9_PART1_WALK_RECORD.md';
let pass = 0; let fail = 0; const failed = [];
function T(name, cond) { if (cond) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}`); } }
const sec = (t) => console.log(`\n§${t}`);
const quiet = async (fn) => { const w = console.warn; const e = console.error; const l = console.log; console.warn = () => {}; console.error = () => {}; console.log = () => {}; try { return await fn(); } finally { console.warn = w; console.error = e; console.log = l; } };
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const src = (rel) => fs.readFileSync(P(rel), 'utf8');

const WDf = 'src/lib/vendor/workingDoor.js';
const LDf = 'src/lib/vendor/listenerDoor.js';
const WDP = P(WDf);
const VIP = P('src/lib/vendorInbound.js');
const LFP = P('src/lib/laneFlags.js');

// THE RECORD'S BYTES (turn 8, HEARD), never retyped from memory: 1.0 asserts the record holds this exact line.
const TURN8_JSON = '{"acts":[{"act":"lead","date_as_spoken":"20 February 2027","client_as_spoken":"Walk P8 Fresh"},{"act":"book_event","date_as_spoken":"20 February 2027","client_as_spoken":"Walk P8 Fresh"}],"route":"task"}';
const TURN8_SAID = 'Add a new lead Walk P8 Fresh, wedding on 20 February 2027';
const turn8 = () => JSON.parse(TURN8_JSON);
// Deep equality with keys sorted: normaliseRequest writes each act's keys in ITS order, so the record is compared by value, never by key order.
const canon = (v) => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, k) => { o[k] = x[k]; return o; }, {}) : x));
// e-62 (accepted by the chair): with the drop removed, 2.3 dereferenced a field a refused turn does not carry and the bench CRASHED,
// listing no later cell. J() joins what is there, so a missing helper or a refused turn reads as a named FAIL and every later cell still lists.
const J = (a) => (Array.isArray(a) ? a.join() : '');
const isTurn8 = (v) => canon(v) === canon(JSON.parse(TURN8_JSON));
const B34 = 'I cannot do that by message yet. Use the app for it.';
const SENTENCE = "A wedding date said with a new lead belongs to that lead: put it in the lead's date and record no book_event for it.";

// ── an in-memory database (b93's shape, which the REAL createLead and the REAL attachPackage already run on in b92) ──
let clock = Date.parse('2026-09-21T05:00:00Z');
function makeDb(seed) {
  const tables = JSON.parse(JSON.stringify(seed || {}));
  const log = { inserts: [], updates: [] };
  let seq = 0;
  const builder = (schema, name) => {
    const full = `${schema}.${name}`;
    const f = []; let mode = 'select'; let payload = null; let limitN = null; let orderBy = null;
    const rows = () => (tables[full] || []);
    const run = () => {
      if (mode === 'insert') {
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
      gte() { return b; }, lte() { return b; }, gt() { return b; }, lt() { return b; }, or() { return b; }, ilike() { return b; },
      not() { return b; }, order(k, oo) { orderBy = { k, asc: !(oo && oo.ascending === false) }; return b; }, limit(n) { limitN = n; return b; },
      insert(p) { mode = 'insert'; payload = p; return b; }, update(p) { mode = 'update'; payload = p; return b; }, upsert(p) { mode = 'insert'; payload = p; return b; },
      then(res, rej) { return Promise.resolve().then(run).then(res, rej); },
      maybeSingle() { const r = run(); return Promise.resolve({ data: r.data ? r.data[0] || null : null, error: r.error }); },
      single() { const r = run(); return Promise.resolve({ data: r.data ? r.data[0] || null : null, error: r.data && r.data.length ? null : { message: 'no row' } }); },
    };
    return b;
  };
  return { tables, log, from: (n) => builder('public', n), schema: (s) => ({ from: (n) => builder(s, n) }), rpc: async () => ({ data: null, error: null }) };
}

const V = { id: 'v-1', tier: 'signature', user_id: 'u-1', onboarding_state: 'complete', category: 'photographer' };
const AG = 'ag-1';
const NOW = Date.parse('2026-09-21T06:00:00Z'); // 11:30 IST, 21 September 2026
const ROUTE = { provider: 'anthropic', model: 'm-primary', listener_provider: 'anthropic', listener_model: 'm-listen' };
// public.leads, ALL 29 columns, and public.vendor_packages, ALL 16 (docs/db/PUBLIC_SCHEMA.md; b92's whole-row shapes, C-44.3).
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
// His three packages as his fixture SELECT of 21 September returned them (the walk record §2), in the order it returned them.
function world() {
  return {
    'public.admin_config': [],
    'public.leads': [leadRow({ id: 'l-old', name: 'Walk P6 Dated', wedding_date: '2027-02-14', wedding_date_precision: 'day' })],
    'public.vendor_packages': [
      pkgRow({ id: 'p-pre', name: 'Pre wedding shoot', total: 50000, delivery_basis: 'on_the_day' }),
      pkgRow({ id: 'p-album', name: 'Walk P7 Album', total: 25000, delivery_basis: 'handover' }),
      pkgRow({ id: 'p-film', name: 'Photographs and film', total: 80000, delivery_basis: 'days', delivery_days: 30 }),
    ],
    'public.clients': [], 'public.lead_packages': [], 'public.invoices': [], 'public.pending_money_acts': [], 'public.payment_schedules': [],
    'engine.records': [],
    'engine.conversations': [{ id: 'c-1', agent_id: AG, state: 'active', last_active_at: '2026-09-21T05:00:00Z' }],
    'engine.messages': [],
  };
}
const req = (acts, route = 'task') => ({ route, acts });
const earOf = (request) => async () => ({ content: [{ type: 'tool_use', name: 'ear_request', input: request }], usage: { input_tokens: 1400, output_tokens: 50 } });
const leadsIn = (db) => db.log.inserts.filter((i) => i.table === 'public.leads').flatMap((i) => i.rows);
const lpsIn = (db) => db.log.inserts.filter((i) => i.table === 'public.lead_packages').flatMap((i) => i.rows);
const lead = (client, date) => ({ act: 'lead', client_as_spoken: client, ...(date ? { date_as_spoken: date } : {}) });
const event = (client, date) => ({ act: 'book_event', ...(client ? { client_as_spoken: client } : {}), ...(date ? { date_as_spoken: date } : {}) });

// ── mutation (b90's harness, unchanged): an anchor that is missing THROWS, and the cell that ran it FAILS ──
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

const FIXH = 'docs/handovers/TDW_CE44_LCV10_PARTB1_FIX_HANDOVER.md';
const NONE_JSON = '{"acts":[],"route":"none"}';
const B3 = 'Okay. Nothing was changed.';
const DYM = (n) => `Did you mean ${n}? Reply YES or NO.`;
const inv = (client) => ({ act: 'invoice', client_as_spoken: client });
const money = (act, client, date) => ({ act, ...(client ? { client_as_spoken: client } : {}), ...(date ? { date_as_spoken: date } : {}) });
const staged = (d) => (d.tables['public.pending_money_acts'] || []);
const lastDoor = (d) => d.tables['engine.messages'].filter((m) => m.role === 'assistant').slice(-1)[0];
const noteOf = (d) => { const r = lastDoor(d); return r && r.meta && r.meta.listener ? r.meta.listener.note : undefined; };
const noteIn = (d) => noteOf(d) || { acts: [{}] };

async function main() {
  const WD = require(WDP);
  const DL = require(P('src/lib/vendor/doorLines.js'));
  const LF = require(LFP);
  const meter = require(P('src/agent/harvest.js'))._meter;
  const memoryOf = (db) => ({
    getOrCreateConversation: async () => ({ conversationId: 'c-1', thread: [] }),
    saveMessage: async (cid, role, content, tc, meta) => { const id = `m-${db.tables['engine.messages'].length + 1}`; db.tables['engine.messages'].push({ id, conversation_id: cid, role, content, tool_calls: tc || null, meta: meta || null, created_at: new Date(clock += 1000).toISOString() }); return id; },
  });
  const minted = [];
  const gen = async (sb, v, binderId) => { minted.push(binderId && binderId.id ? binderId.id : binderId); return { ok: true, invoice_number: `TDW/DEV440/${40 + minted.length}`, pdf_url: 'https://x.invalid/p.pdf', made: 'minted' }; };
  const turn = async (db, message, request, lane, M) => {
    const mod = M || WD;
    LF._resetLaneFlagCache();
    const out = await quiet(() => mod.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message, lane: lane || 'pwa' }, { llmCreate: earOf(request), nowMs: NOW, generateInvoiceForBinder: gen }));
    const said = out && out.door === true ? out : await quiet(() => mod.standIn({ supabase: db, out }, { nowMs: NOW }));
    await quiet(() => mod.persistDoorTurn({ supabase: db, agentId: AG, message, out: said, lane: lane || 'pwa' }, { memory: memoryOf(db), meter }));
    return { out, said, reply: said.reply, keys: J(said.keys) };
  };
  const binder = (id, client) => ({ id, agent_id: AG, client, amount: 50000, amount_received: 0, hidden: false, date: '2026-09-25' });
  const seeded = () => { const d = makeDb(world()); d.tables['engine.records'].push(binder('b-walk45', 'Walk45'), binder('b-meera', 'Meera Walk Fifteen'), binder('b-kabir', 'Kabir Walk Fifteen')); d.tables['public.leads'].push(leadRow({ id: 'l-meera', name: 'Meera Walk Fifteen', wedding_date: '2027-03-05', wedding_date_precision: 'day' })); d.tables['public.lead_packages'].push({ id: 'lp-meera', vendor_id: V.id, lead_id: 'l-meera', package_id: 'p-film', snapshot: { name: 'Photographs and film', delivery_basis: 'days' }, total: 80000, schedule: [], delivery_on: null, quoted_at: null, quote_draft_id: null, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', deleted_at: null }); return d; };

  sec('1 the home over binder names');
  let db = seeded(); let r = await turn(db, 'Raise the invoice for Meera Walk Fiften', req([inv('Meera Walk Fiften')]));
  T('1.1 THE CARD: a misspelt client on an invoice: B36 with the binder\'s own name, a note carrying the act with THAT name and the binder\'s id; NOTHING minted', r.reply === DYM('Meera Walk Fifteen') && r.out.why === 'offer_asked' && noteIn(db).candidate_id === 'b-meera' && noteIn(db).acts[0].client_as_spoken === 'Meera Walk Fifteen' && minted.length === 0);
  r = await turn(db, 'Yes', JSON.parse(NONE_JSON));
  T('1.2 THE CARD: YES runs planInvoice with the candidate\'s binder: minted for b-meera, B13', r.keys === 'B13' && minted.join() === 'b-meera');
  db = seeded(); r = await turn(db, 'Raise the invoice for Walk54', req([inv('Walk54')]));
  T('1.3 a transposition on a binder name offers', r.reply === DYM('Walk45'));
  r = await turn(db, 'No', JSON.parse(NONE_JSON));
  T('1.4 THE CARD: NO is B3, nothing minted, no note', r.reply === B3 && r.out.why === 'note_declined' && minted.length === 1 && noteOf(db) === undefined);
  db = seeded(); r = await turn(db, 'Raise the invoice for Nobody Walk Fifteen', req([inv('Nobody Walk Fifteen')]));
  T('1.5 THE CARD: a name near nothing is B15 as today, no offer', r.keys === 'B15' && r.reply === 'Could not make the invoice. No client called Nobody Walk Fifteen.');
  db = seeded(); r = await turn(db, 'Raise the invoice for Walk45', req([inv('Walk45')]));
  T('1.6 an exact match never enters the home: minted as always', r.keys === 'B13');
  db = seeded(); db.tables['engine.records'].push(binder('b-kbir', 'Kbirr Walk Fifteen'));
  r = await turn(db, 'x', req([inv('Kbir Walk Fifteen')]));
  T('1.7 two binders equally close: no offer, B15', r.keys === 'B15');
  db = seeded(); db.tables['engine.records'].push({ id: 'b-hidden', agent_id: AG, client: 'Meera Walk Fiften', amount: 1, amount_received: 0, hidden: true, date: '2026-09-25' });
  r = await turn(db, 'x', req([inv('Meera Walk Fiften')]));
  T('1.8 HIDDEN binders are not in the home (the same rows planInvoice reads): the hidden exact row is ignored, the live near one is offered', r.reply === DYM('Meera Walk Fifteen'));
  db = seeded(); db.tables['public.pending_money_acts'].push({ id: 'pm-1', vendor_id: V.id, act: 'booking_confirmed', request: { lead_id: 'l-meera', lead_name: 'Meera Walk Fifteen', kind: 'booking_confirmed' }, lane: 'pwa', state: 'staged', outcome: null, created_at: new Date(NOW - 60000).toISOString(), resolved_at: null, expires_at: new Date(NOW + 600000).toISOString() });
  r = await turn(db, 'Raise the invoice for Meera Walk Fiften', req([inv('Meera Walk Fiften')]));
  T('1.9 never while a money row is live: B15 as today', r.keys === 'B15');
  db = seeded(); await turn(db, 'x', req([inv('Meera Walk Fiften')]));
  r = await turn(db, 'The booking is confirmed for Meera Walk Fifteen', req([money('booking_confirmed', 'Meera Walk Fifteen')]));
  T('1.10 another job typed after the question lapses it; the booking is planned fresh and STAGED, nothing minted', r.keys === 'B2' && staged(db).length === 1);

  sec('2 e-74\'s correction, from the record');
  const t = src(FIXH);
  T('2.1 the B-1 FIX handover now carries the 21st\'s record by script and withdraws its inference: turn 1 garbled upstream, turns 2 and 3 heard clean as "5th March 27"', /CORRECTION \(e-74/.test(t) && t.includes('HE: Add new lead. Tara walk tension. E reing on 5th March 371') && t.includes('"date_as_spoken":"5th March 27","client_as_spoken":"Tara walk ten"') && /inference is\nwithdrawn/.test(t));

  sec('3 the card, one thread');
  const driveWA = async (o) => {
    const savedWD = require.cache[WDP]; const savedVI = require.cache[VIP];
    const turns = { n: 0 }; const sent = [];
    LF._resetLaneFlagCache();
    try {
      const d = o.db;
      const real = o.M || WD;
      const mod = new Module(WDP, module); mod.filename = WDP; mod.loaded = true;
      mod.exports = { ...real,
        preTurn: (a) => real.preTurn({ ...a, supabase: d, vendor: V, agentId: AG, route: ROUTE }, { llmCreate: earOf(o.request), nowMs: NOW }),
        standIn: (a) => real.standIn({ ...a, supabase: d }, { nowMs: NOW }),
        speakOnWhatsApp: (a) => real.speakOnWhatsApp({ ...a, supabase: d, agentId: AG }, { persistDoorTurn: (p) => real.persistDoorTurn({ ...p, supabase: d, agentId: AG }, { memory: memoryOf(d), meter }) }) };
      require.cache[WDP] = mod;
      delete require.cache[VIP];
      const lane = require(VIP);
      const chain = (t) => { const api = {}; for (const m of ['select', 'eq', 'is', 'order', 'limit', 'update', 'neq', 'in', 'gte', 'lte', 'not', 'insert']) api[m] = () => api;
        const rows = { users: { id: 'u1', phone: '+919888294440', name: 'Dev' }, vendors: { id: 'v1', user_id: 'u1', onboarding_state: 'complete', category: 'photographer', tier: 'signature' }, conversations: { id: 'c1', vendor_id: 'v1', kind: 'vendor_self' } };
        api.single = async () => ({ data: rows[t] || {}, error: null }); api.maybeSingle = async () => ({ data: rows[t] || null, error: null });
        api.then = (res) => res({ data: rows[t] ? [rows[t]] : [], error: null }); return api; };
      const supabase = { from: chain, schema: () => ({ from: chain }) };
      const deps = {
        sendWhatsApp: async (to, text, media) => { sent.push({ text, media }); return { sid: 'SM1' }; },
        runTurn: async () => { turns.n += 1; return { reply: 'VICTOR', tool_calls: [] }; },
        resolveAgentForVendor: async () => ({ agentId: 'a1' }), fetchCalendarSnapshot: async () => '', fetchScratchpad: async () => '', fetchLeadPings: async () => '',
        applyCalendarSignals: async () => ({ suffix: '' }), buildLlmForTurn: async () => ({ route: ROUTE }),
        matchModeWord: () => null, applyModeFlip: async () => ({ changed: false }), MODE_FLIP_LINES: {}, matchFreshWord: () => false, FRESH_THREAD_LINE: 'x', abandonActiveThread: async () => ({}),
        generateInvoiceForBinder: async () => ({ ok: false }), enquiryToBinder: async () => ({ ok: true }), runCoupleAgenticTurn: async () => ({ reply: '', toolCalls: [] }),
        ensureCoupleRow: async () => ({}), captureField: async () => ({}), buildDisambiguationQuestion: () => '', interpretDisambiguationReply: async () => ({}),
        vendorDisplayName: () => 'V', checkImageThrottle: async () => ({ allowed: true }), markRejectionSent: async () => ({}), extractCalendarFromImage: async () => [],
        webhookCore: require(P('src/lib/webhookCore.js')), supabase, anthropic: {},
      };
      await quiet(() => lane.processVendorInbound({ phone: '+919888294440', body: o.message, profileName: 'Dev', messageSid: `wamid.b100.${Math.random()}`, internalReplay: false, trimmedBody: o.message.trim(), numMedia: 0, hasMedia: false, mediaUrl: null, rawPayload: {} }, deps));
      return { turns: turns.n, sent };
    } finally {
      if (savedWD) require.cache[WDP] = savedWD; else delete require.cache[WDP];
      if (savedVI) require.cache[VIP] = savedVI; else delete require.cache[VIP];
      LF._resetLaneFlagCache();
    }
  };
  const one = (w) => (w.turns === 0 && w.sent.length === 1 && Array.isArray(w.sent[0].media) && w.sent[0].media.length === 0 ? w.sent[0].text : `turns=${w.turns} sent=${w.sent.length}`);
  { const d = seeded(); const mintedBefore = minted.length;
    const c1 = await turn(d, 'Raise the invoice for Walk P8 Nobody', req([inv('Walk P8 Nobody')]));
    const c2 = await turn(d, 'Raise the invoice for Meera Walk Fiften', req([inv('Meera Walk Fiften')]));
    const c3 = await turn(d, 'No', JSON.parse(NONE_JSON));
    const c4 = await driveWA({ db: d, message: 'Raise the invoice for Walk54', request: req([inv('Walk54')]) });
    const c5 = await driveWA({ db: d, message: 'No', request: JSON.parse(NONE_JSON) });
    T('3.1 SAY "Raise the invoice for Walk P8 Nobody": B15; "Raise the invoice for Meera Walk Fiften": "Did you mean Meera Walk Fifteen? Reply YES or NO."; "No": B3; ON WHATSAPP "Raise the invoice for Walk54": "Did you mean Walk45? Reply YES or NO."; "No": B3. NOTHING minted on the card', c1.keys === 'B15' && c2.reply === DYM('Meera Walk Fifteen') && c3.reply === B3 && one(c4) === DYM('Walk45') && one(c5) === B3 && minted.length === mintedBefore && d.tables['public.invoices'].length === 0);
  }

  sec('4 W-1, fuzz, mutations');
  const man = fs.existsSync(P(MAN)) ? src(MAN).split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#')) : [];
  T('4.1 W-1 NONE and the manifest names exactly the five paths', man.every((p) => !/^src\/engine\/|soul|lens|^db\/migrations\//.test(p)) && JSON.stringify(man.slice().sort()) === JSON.stringify(['docs/handovers/TDW_CE44_LCV10_INVOICES_HANDOVER.md', FIXH, MAN, 'scripts/b100_lcv10_invoice_home_bench.js', WDf].sort()));
  let t4 = 0; const boom = () => { throw new Error('hostile'); }; const trap = new Proxy({}, { get: boom, has: boom, ownKeys: boom, getOwnPropertyDescriptor: boom });
  for (const rowsH of [null, undefined, [], [trap], [{ client: 7 }], [{ id: 1 }], { data: 'x' }]) { const d = seeded(); d.tables['engine.records'] = Array.isArray(rowsH) ? rowsH : []; try { const o = await quiet(() => WD.preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message: 'Raise the invoice for Meera Walk Fiften', lane: 'pwa' }, { llmCreate: earOf(req([inv('Meera Walk Fiften')])), nowMs: NOW })); if (!o || typeof o.door !== 'boolean') t4 += 1; } catch (_e) { t4 += 1; } }
  T('4.2 hostile binder rows: zero throws, a verdict always', t4 === 0);
  const flow = async (rq, steps, seedFn) => { const M = rq(WDf); const d = seedFn ? seedFn() : seeded(); const out = []; for (const [m, q] of steps) out.push(await turn(d, m, q, 'pwa', M)); return { out, d }; };
  await mut('4.3 M1 the invoices offer removed: a misspelt client is B15 again (reddens 1.1, 3.1)', WDf,
    [["        if (p && p.noBinder && !liveAtStart && !fromNote) { const offer = await offerFor(a, 'client', p.name, await bindersOf(supabase, agentId)); if (offer) return offer; }\n", '']], [],
    async (rq) => flow(rq, [['x', req([inv('Meera Walk Fiften')])]]), (x) => x.out[0].keys === 'B15');
  await mut('4.4 M2 hidden binders admitted to the home (reddens 1.8)', WDf,
    [[".eq('agent_id', agentId).eq('hidden', false);\n    return (error || !Array.isArray(data)) ? null : data.filter((b) => b && typeof b.client === 'string').map((b) => ({ id: b.id, name: b.client }));", ".eq('agent_id', agentId);\n    return (error || !Array.isArray(data)) ? null : data.filter((b) => b && typeof b.client === 'string').map((b) => ({ id: b.id, name: b.client }));"]], [],
    async (rq) => flow(rq, [['x', req([inv('Meera Walk Fiftn')])]], () => { const d = seeded(); d.tables['engine.records'].push({ id: 'b-hidden', agent_id: AG, client: 'Meera Walk Fiftnn', amount: 1, amount_received: 0, hidden: true, date: '2026-09-25' }); return d; }), (x) => x.out[0].keys === 'B36');

  console.log(`\n════════  b100 · ${pass} pass · ${fail} fail  ════════`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`  · ${f}`)); }
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('b100 CRASHED:', (e && e.stack) || e); process.exit(2); });
