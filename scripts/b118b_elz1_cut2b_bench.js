'use strict';
// LABELED AMENDMENT · CE-45 ELZ-1 cut 2a (R-45.23, the founder's V1 to V8, 25 September 2026): B4, B5, B25, B32, B33, B39, B60 and B76
// re-pinned to his new bytes (templates, rendered forms and hashes); what each cell proves is unchanged (LSP_2's precedent; e-136's re-cut).
// scripts/b118b_elz1_cut2b_bench.js · TDW CE-45 · ELZ-1 · CUT 2b · RUNG b118b. Its harness (the database double, the turn driver over the REAL preTurn, the composer double,
// the mutation helper) is b101's, taken verbatim; the cells after "RUNG b118b" are 2b's own: quote_send with F2 and F3, the app lane's relay, V11 and V13,
// F-44.175's honesty lines, F-44.173, F-44.174, the dashes, the money pins and five mutations.
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
  // ═══ CE-45 ELZ-1 cut 2b · RUNG b118b (b101's harness above, reused verbatim; its cells are b101's own) ═══════════════════════════
  const seqComposer = (bodies) => { let i = 0; return async (p, params) => { const b = bodies[Math.min(i, bodies.length - 1)]; i += 1; return composerOf(b)(p, params); }; };
  const LP = (o) => Object.assign({ id: 'lp-asha', vendor_id: V.id, lead_id: 'l-asha', package_id: 'p-film', snapshot: { name: 'Photographs and film', delivery_basis: 'handover' }, total: 80000, schedule: [], delivery_on: '2027-04-10', quoted_at: null, quote_draft_id: null, created_at: '2026-09-20T00:00:00Z', updated_at: '2026-09-20T00:00:00Z', deleted_at: null }, o);
  const withPkg = () => { const w = world(); w['public.lead_packages'] = [LP()]; return w; };
  const QUOTE = req([{ act: 'quote_send', client_as_spoken: 'Asha Walk Fifteen' }]);
  const GOOD = 'Hi Asha, your Photographs and film package comes to Rs 80,000, delivered by 10 April 2027.';
  const NOFIG = 'Hi Asha, here is the quote for your Photographs and film package.';
  let db; let r;

  sec('1 quote_send (P6b\'s second half, R-45.17; F2; F3)');
  db = makeDb(withPkg()); composed.length = 0;
  r = await turn(db, 'Send Asha Walk Fifteen a quote', QUOTE, { composer: seqComposer([GOOD]) });
  const qUser = composed.length ? String(composed[composed.length - 1].user) : '';
  T('1.1 a lead with a live package: the facts reach the writer ("This is a QUOTE", package, Rs total, delivery), the draft is STORED and framed B37, nothing sent', r.keys === 'B37' && draftsIn(db).length === 1 && d0(db).body === GOOD && /This is a QUOTE/.test(qUser) && qUser.includes('package: Photographs and film') && qUser.includes('total: Rs 80,000') && qUser.includes('delivery date: 10 April 2027') && sent.length === 0);
  const nSent = sent.length;
  r = await turn(db, 'yes', NONE);
  const lp = db.tables['public.lead_packages'][0];
  T('1.2 F3: her YES sends the STORED bytes, and the package is marked quoted with THIS draft (quoted_at, quote_draft_id)', sent.length === nSent + 1 && sent[sent.length - 1].text === `Walk Studio: ${GOOD}` /* LABELED AMENDMENT · CE-45 ELZ-1 F-44.176 (his (a)): on TDW's shared line the sent and recorded text is "{studio}: " + the approved bytes */ && !!lp.quoted_at && lp.quote_draft_id === String(d0(db).id));
  db = makeDb(withPkg()); composed.length = 0;
  r = await turn(db, 'Send Asha Walk Fifteen a quote', QUOTE, { composer: seqComposer([NOFIG, GOOD]) });
  T('1.3 F2: a body missing the figure is RE-COMPOSED once; the second, carrying both facts, is the one stored', r.keys === 'B37' && composed.length === 2 && d0(db).body === GOOD);
  db = makeDb(withPkg()); composed.length = 0;
  r = await turn(db, 'Send Asha Walk Fifteen a quote', QUOTE, { composer: seqComposer([NOFIG, NOFIG]) });
  T('1.4 F2: two misses: NOTHING is staged and the glitch line speaks (a quote without its figure never reaches her)', r.keys === 'GLITCH' && draftsIn(db).length === 0 && composed.length === 2);
  db = makeDb(world()); composed.length = 0;
  r = await turn(db, 'Send Asha Walk Fifteen a quote', QUOTE, { composer: seqComposer([GOOD]) });
  T('1.5 no package: B39, his V6, rendered for the client; nothing composed, nothing stored', r.reply === 'Could not send the quote. Asha Walk Fifteen has no package yet. Attach a package to Asha Walk Fifteen first.' && composed.length === 0 && draftsIn(db).length === 0);
  // F3's two cells as ruled: a mark that fails is logged with both ids and never undoes the send; a send that did not reach her marks nothing
  db = makeDb(withPkg());
  r = await turn(db, 'Send Asha Walk Fifteen a quote', QUOTE, { composer: seqComposer([GOOD]) });
  const realFrom = db.from; db.from = (n) => { if (n === 'lead_packages') return { update() { throw new Error('write down'); } }; return realFrom(n); };
  const errs = []; const ce = console.error; console.error = (...a) => { errs.push(a.join(' ')); };
  const nS2 = sent.length; let out3;
  try { out3 = await WD.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message: 'yes', lane: 'whatsapp' }, { llmCreate: earOf(NONE), nowMs: NOW, composerCreate: composerOf(GOOD), sendWhatsApp: transport, env: ENV }); } finally { console.error = ce; }
  T('1.6 F3: the quoted mark\'s write FAILS: the quote is still SENT and recorded sent, and the failure is logged at error level with the lead_package and draft ids', sent.length === nS2 + 1 && out3 && out3.door === true && errs.some((e) => e.includes('quoted_at NOT written') && e.includes('lead_package=lp-asha') && e.includes(`draft=${d0(db).id}`)));
  db = makeDb(withPkg());
  r = await turn(db, 'Send Asha Walk Fifteen a quote', QUOTE, { composer: seqComposer([GOOD]) });
  const deadTransport = async () => { throw new Error('provider down'); };
  const out4 = await quiet(() => WD.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message: 'yes', lane: 'whatsapp' }, { llmCreate: earOf(NONE), nowMs: NOW, composerCreate: composerOf(GOOD), sendWhatsApp: deadTransport, env: ENV }));
  T('1.7 F3: a quote that did NOT reach her (the transport failed) writes NO mark', db.tables['public.lead_packages'][0].quoted_at === null && db.tables['public.lead_packages'][0].quote_draft_id === null && out4 && out4.door === true);

  sec('2 the app lane\'s relay (P6b\'s second half); relay_pwa deleted');
  db = makeDb(world()); composed.length = 0;
  r = await turn(db, 'Tell Asha Walk Fifteen hello', req([relay('Asha Walk Fifteen')]), { lane: 'pwa' });
  T('2.1 on the pwa lane a relay is composed, STORED and framed B37, exactly as on WhatsApp', r.keys === 'B37' && draftsIn(db).length === 1 && r.reply === FRAME_ASHA);
  const nS3 = sent.length;
  r = await turn(db, 'yes', NONE, { lane: 'pwa' });
  T('2.2 her YES in the app sends the stored bytes (with the shared line\'s studio prefix, F-44.176)', sent.length === nS3 + 1 && sent[sent.length - 1].text === `Walk Studio: ${BODY}` /* LABELED AMENDMENT · CE-45 ELZ-1 F-44.176 (his (a)): on TDW's shared line the sent and recorded text is "{studio}: " + the approved bytes */);
  T('2.3 relay_pwa is ABSENT from src: no reason, no mapping (a grep of every src file, comments aside)', !require('child_process').execSync("grep -rn --include=*.js \"'relay_pwa'\" src || true", { cwd: P('.'), encoding: 'utf8' }).trim());

  sec('3 V11 and V13, the numbered package picks (V16\'s safe half)');
  const threePk = () => { const w = world(); w['public.vendor_packages'].push(pkgRow({ id: 'p-gold', name: 'Gold', total: 90000, delivery_basis: 'days', delivery_days: 30 }), pkgRow({ id: 'p-silver', name: 'Silver', total: 50000, delivery_basis: 'days', delivery_days: 30 })); return w; };
  const ATT = (pk) => req([{ act: 'attach_package', client_as_spoken: 'Asha Walk Fifteen', ...(pk ? { package_as_spoken: pk } : {}) }]);
  db = makeDb(threePk());
  r = await turn(db, 'Attach a package to Asha Walk Fifteen', ATT());
  T('3.1 B31, his V13: the client named, the options NUMBERED in the one sorted order, "Reply with the number."', r.reply === 'Which package for Asha Walk Fifteen? 1. Gold 2. Photographs and film 3. Silver. Reply with the number.');
  r = await turn(db, '3', NONE);
  const att3 = db.tables['public.lead_packages'].find((x) => x.lead_id === 'l-asha' && !x.deleted_at);
  T('3.2 a bare "3" picks the THIRD shown (Silver) and attaches it', !!att3 && att3.package_id === 'p-silver');
  db = makeDb(threePk()); await turn(db, 'Attach a package to Asha Walk Fifteen', ATT());
  r = await turn(db, 'Gold', NONE);
  const attG = db.tables['public.lead_packages'].find((x) => x.lead_id === 'l-asha' && !x.deleted_at);
  T('3.3 the name is still accepted', !!attG && attG.package_id === 'p-gold');
  db = makeDb(threePk()); await turn(db, 'Attach a package to Asha Walk Fifteen', ATT());
  r = await turn(db, '9', NONE);
  T('3.4 a number outside the list RE-ASKS once (B31), nothing attached', r.keys === 'B31' && !db.tables['public.lead_packages'].some((x) => x.lead_id === 'l-asha'));
  db = makeDb(threePk());
  r = await turn(db, 'Attach Diamond to Asha Walk Fifteen', ATT('Diamond'));
  T('3.5 B23, his V11, numbered; it now LEAVES a package note (F5)', r.reply === 'You have no package called Diamond. Yours are: 1. Gold 2. Photographs and film 3. Silver. Reply with the number.' && noteIn(db) && noteIn(db).asked === 'B23');
  r = await turn(db, '1', NONE);
  const attD = db.tables['public.lead_packages'].find((x) => x.lead_id === 'l-asha' && !x.deleted_at);
  T('3.6 after B23 a bare "1" picks Gold', !!attD && attD.package_id === 'p-gold');
  const twoTri = () => { const w = threePk(); w['public.vendor_packages'].push(pkgRow({ id: 'p-t1', name: 'Tri', total: 10000, delivery_basis: 'days', delivery_days: 30 }), pkgRow({ id: 'p-t2', name: 'Tri', total: 20000, delivery_basis: 'days', delivery_days: 30 })); return w; };
  db = makeDb(twoTri());
  r = await turn(db, 'Attach Tri to Asha Walk Fifteen', ATT('Tri'));
  const r24 = r.keys;
  r = await turn(db, '1', NONE);
  T('3.7 B24 (two packages of one name) is NOT read by number in 2b (cut 2c binds a package id): "1" attaches nothing', r24 === 'B24' && !db.tables['public.lead_packages'].some((x) => x.lead_id === 'l-asha' && !x.deleted_at));

  sec('4 F-44.175: a question the door does not own names where to look (his three messages, his export of 25 September)');
  const FIND = req([{ act: 'find' }], 'search');
  const q = async (m) => (await turn(makeDb(world()), m, FIND)).reply;
  T('4.1 "What are my blocked days" (19:38:48): B86, Calendar and your blocked days; NOT the new leads', (await q('What are my blocked days')) === "I can't look that up yet. Open Calendar in the app to see your blocked days.");
  T('4.2 "What dates are blocked" (19:39:10): the same', (await q('What dates are blocked')) === "I can't look that up yet. Open Calendar in the app to see your blocked days.");
  T('4.3 "Who are my clients" (19:39:46): B86, Clients and your clients', (await q('Who are my clients')) === "I can't look that up yet. Open Clients in the app to see your clients.");
  T('4.4 a find that names no room: B87', (await q('What is going on')) === "I can't look that up yet. Open the app to see it.");
  T('4.5 a leads question still lists the new leads (the one lookup the door owns)', /^New leads: /.test(await q('Who are my new leads')));
  T('4.6 B86 and B87 are his bytes, hash-carried; LINES 83', DL.LINES.B86 === "I can't look that up yet. Open {room} in the app to see {thing}." && DL.LINES.B87 === "I can't look that up yet. Open the app to see it." && DL.assertLineHashes() === true && Object.keys(DL.LINES).length === 83);

  sec('5 F-44.173, F-44.174 and the dashes');
  const DIS = require(P('src/agent/disambiguation.js'));
  const C3 = [{ id: 'a', business_name: 'Dev Roy Photography' }, { id: 'b', business_name: 'Dev Roy Photography 1' }, { id: 'c', business_name: 'Make Up by Swati Roy' }];
  let modelCalls = 0; const noModel = { messages: { create: async () => { modelCalls += 1; return { content: [{ text: '{"matched_vendor_id": null, "confidence": "none"}' }] }; } } };
  const p1 = await quiet(() => DIS.interpretDisambiguationReply({ replyText: 'Dev Roy Photography', candidateVendors: C3, anthropic: noModel }));
  const p2 = await quiet(() => DIS.interpretDisambiguationReply({ replyText: 'Dev Roy Photography 1', candidateVendors: C3, anthropic: noModel }));
  T('5.1 F-44.173, his walk\'s three names: "Dev Roy Photography" picks it, "Dev Roy Photography 1" the other, and the model is NOT called for an exact name', p1.matched_vendor_id === 'a' && p2.matched_vendor_id === 'b' && modelCalls === 0);
  await quiet(() => DIS.interpretDisambiguationReply({ replyText: 'Dev Roy', candidateVendors: C3, anthropic: noModel }));
  T('5.2 a partial name still goes to the model, as before', modelCalls === 1);
  const eng = src('src/agent/engine.js');
  T('5.3 F-44.174: vendor_self is written ONCE, from vendorNotification, the text the send carries (recordVendorNotice after the join; no mid-turn write)', /const vendorNotification = withDateLine\(/.test(eng) && /await recordVendorNotice\(supabase, vendor, vendorUser, vendorNotification\);/.test(eng) && (eng.match(/sent_by: 'system'/g) || []).length === 1 && /vendorNotification,\n/.test(eng));
  const NC = require(P('src/lib/nudgeCopy.js')); const ncs = src('src/lib/nudgeCopy.js'); const pcs = src('src/lib/prospectCopy.js'); const vis = src('src/lib/vendorInbound.js');
  const noDash = (t) => t.split('\n').filter((l) => !/^\s*\/\//.test(l)).every((l) => !l.includes('\u2014') || !/["'`]/.test(l));
  T('5.4 the seven lines are punctuation-only changes: no em dash left in a copy line of nudgeCopy.js or prospectCopy.js; the pick\'s "Sorry, didn\'t catch that." has none', noDash(ncs) && noDash(pcs) && vis.includes("`Sorry, didn't catch that. ${buildDisambiguationQuestion") && !vis.includes("didn't catch that \u2014"));
  T('5.5 their words are unchanged (a sample of the seven)', ncs.includes("You're opted out. I won't message you first about anything.") && ncs.includes("You're back on. I'll message you again when there's something worth saying.") && pcs.includes("You're opted out. You won't hear from us again.") && ncs.includes("Done. No more morning messages.") && ncs.includes("Morning messages are back on. You'll get the next one tomorrow."));

  sec('6 the money functions byte-identical to b115\'s pins');
  const PIN = JSON.parse(src('scripts/b115_lcv15_lsp4_bench.js').match(/const PIN = (\{[^\n]*\});/)[1]);
  const body = (t, name) => { const i = t.search(new RegExp(`^(async )?function ${name}\\b`, 'm')); if (i < 0) return ''; let j = t.indexOf('(', i); let d = 0; for (; j < t.length; j += 1) { if (t[j] === '(') d += 1; else if (t[j] === ')') { d -= 1; if (d === 0) break; } } const k = t.indexOf('{', j); d = 0; for (let m = k; m < t.length; m += 1) { if (t[m] === '{') d += 1; else if (t[m] === '}') { d -= 1; if (d === 0) return t.slice(i, m + 1); } } return ''; };
  const shaB = (x) => require('crypto').createHash('sha256').update(x, 'utf8').digest('hex');
  const wds = src(WDf);
  T('6.1 planMoney, planPayment, planBooking, applyRow, reread byte-identical; planAssign unchanged since 08025d4', ['planMoney', 'planPayment', 'planBooking', 'applyRow', 'reread'].every((f) => shaB(body(wds, f)) === PIN[f]) && body(wds, 'planAssign') === body(require('child_process').execSync('git show 08025d4:src/lib/vendor/workingDoor.js', { cwd: P('.'), encoding: 'utf8', maxBuffer: 1 << 26 }), 'planAssign'));

  sec('7 mutations of production code, each reddening its cell');
  await mut('7.1 M1 the fact check always passing: a figureless quote is staged (reddens 1.4)', WDf, [['  return [facts.package, facts.total].every((f) => typeof f === \'string\' && f && b.includes(f));', '  return true;']], [],
    async (rq) => { const d = makeDb(withPkg()); await turn(d, 'Send Asha Walk Fifteen a quote', QUOTE, { M: rq(WDf), composer: seqComposer([NOFIG, NOFIG]) }); return draftsIn(d).length; }, (v) => v === 1);
  await mut('7.2 M2 the number not read after B31 (reddens 3.2)', WDf, [["const NUMBER_PICK_PKG = Object.freeze(['B23', 'B31']);", 'const NUMBER_PICK_PKG = Object.freeze([]);']], [],
    async (rq) => { const d = makeDb(threePk()); await turn(d, 'Attach a package to Asha Walk Fifteen', ATT(), { M: rq(WDf) }); await turn(d, '3', NONE, { M: rq(WDf) }); return d.tables['public.lead_packages'].some((x) => x.lead_id === 'l-asha' && !x.deleted_at); }, (v) => v === false);
  await mut('7.3 M3 the honesty route removed: "What are my blocked days" lists the new leads again (reddens 4.1)', WDf, [["    if (a.act === 'find' && !said && !LEADS_WORDS.test(String(message || ''))) {", "    if (false) {"]], [],
    async (rq) => (await turn(makeDb(world()), 'What are my blocked days', FIND, { M: rq(WDf) })).reply, (v) => /^New leads: /.test(v));
  await mut('7.4 M4 the quoted mark written on ANY outcome (reddens 1.7)', WDf, [["const QUOTE_REACHED = Object.freeze(['sent', 'window_closed_doorbell']);", "const QUOTE_REACHED = { includes: () => true };"]], [],
    async (rq) => { const d = makeDb(withPkg()); await turn(d, 'Send Asha Walk Fifteen a quote', QUOTE, { M: rq(WDf), composer: seqComposer([GOOD]) }); await quiet(() => rq(WDf).preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message: 'yes', lane: 'whatsapp' }, { llmCreate: earOf(NONE), nowMs: NOW, composerCreate: composerOf(GOOD), sendWhatsApp: deadTransport, env: ENV })); return d.tables['public.lead_packages'][0].quoted_at; }, (v) => !!v);
  await mut('7.5 M5 exactPick disabled: an exact name falls to the model again (reddens 5.1)', 'src/agent/disambiguation.js', [['    return hits.length === 1 ? hits[0] : null;', '    return null;']], [],
    async (rq) => { let n = 0; await quiet(() => rq('src/agent/disambiguation.js').interpretDisambiguationReply({ replyText: 'Dev Roy Photography', candidateVendors: C3, anthropic: { messages: { create: async () => { n += 1; return { content: [{ text: '{"matched_vendor_id": null, "confidence": "none"}' }] }; } } } })); return n; }, (v) => v === 1);

  console.log(`\nb118b_elz1_cut2b_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(`FAILED: ${failed.join(' · ')}`); process.exit(1); }
}
main().catch((e) => { console.log(`BENCH CRASHED: ${e && e.stack}`); process.exit(1); });
