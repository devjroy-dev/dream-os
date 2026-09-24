'use strict';
// scripts/b97_lcv10_name_bench.js · TDW CE-44 · LCV-10 · PART B-2, FIRST CUT: THE DOOR KEEPS ITS OWN NOTE OF A NAME IT ASKED FOR; B35; F-44.116. Rung b97.
//
// R-44.39 (the founder, "Yes to your recomendation"): B35 "Which client? Say the name." for a booking, payment, invoice or attach naming no
// client; `lead` keeps B18. THE NOTE (meta.listener.note, asked B18 or B35): HER WHOLE TRIMMED MESSAGE IS THE NAME, event words and all,
// whatever the listener made of it (F-44.105's live failures: TDW_CE44_LCV8_P6A2_WALK_RECORD.md §4 turn 2, "Walk P7 Haldi" heard as "Walk P7").
// It lapses only on a heard act of another kind, or a noted kind restated with a NEW date (F-44.115; a date equal to her message or to the
// date the note carries is not new, F-44.116). A closed YES is re-asked ONCE, then B3. B18 first, B35 after, where both are owed. THE NOTE
// NEVER WRITES MONEY. F-44.116 in the DATE note: his "whenever" of 22 September (recorded) heard as the attach WITH date "whenever" is her
// answer heard twice, a re-ask, not a restatement. The listener's line that a job said without a name is still a job; F-44.105's wording.
//
// C-44.12: recorded hearings replayed verbatim and named. C-44.13: run me on shifted clocks. THE EXIT CODE IS THE VERDICT.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-ce44-lcv10-partb2a.txt';
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

const LCV8 = 'docs/handovers/TDW_CE44_LCV8_P6A2_WALK_RECORD.md';
const LCV9 = 'docs/handovers/TDW_CE44_LCV9_PART1_WALK_RECORD.md';
const FIXWALK = 'docs/handovers/TDW_CE44_LCV10_PARTB2A_HANDOVER.md';
const NONE_JSON = '{"acts":[],"route":"none"}';
// RECORDED: Part One's walk turn 6 (LCV9 §3): "The booking is confirmed" HEARD as NO ACT.
const T6_SAID = 'The booking is confirmed';
// RECORDED: the fix walk of 22 September, turn 7 (his export, sha256 0e8b3cf7336c6535…, written into FIXWALK §3 by script): "whenever" heard as the attach WITH date "whenever".
const W_SAID = 'whenever';
const W_JSON = '{"acts":[{"act":"attach_package","date_as_spoken":"whenever","client_as_spoken":"Rohan Walk Eleven","package_as_spoken":"Walk P7 Album"}],"route":"task"}';
const B3 = 'Okay. Nothing was changed.'; const B18 = 'Who is the lead? Say the name.'; const B35 = 'Which client? Say the name.'; const B7 = 'I could not read that date. Say it like 5 December.';
const att = (client, pkg, date) => ({ act: 'attach_package', ...(client ? { client_as_spoken: client } : {}), package_as_spoken: pkg, ...(date ? { date_as_spoken: date } : {}) });
const money = (act, client, date) => ({ act, ...(client ? { client_as_spoken: client } : {}), ...(date ? { date_as_spoken: date } : {}) });
const staged = (d) => (d.tables['public.pending_money_acts'] || []);
const lastDoor = (d) => d.tables['engine.messages'].filter((m) => m.role === 'assistant').slice(-1)[0];
const noteOf = (d) => { const r = lastDoor(d); return r && r.meta && r.meta.listener ? r.meta.listener.note : undefined; };
const noteIn = (d) => noteOf(d) || { acts: [{}] };

async function main() {
  const WD = require(WDP);
  const DL = require(P('src/lib/vendor/doorLines.js'));
  const LD = require(P('src/lib/vendor/listenerDoor.js'));
  const LH = require(P('src/lib/vendor/lifecycleHands.js'));
  const LF = require(LFP);
  const meter = require(P('src/agent/harvest.js'))._meter;
  const memoryOf = (db) => ({
    getOrCreateConversation: async () => ({ conversationId: 'c-1', thread: [] }),
    saveMessage: async (cid, role, content, tc, meta) => { const id = `m-${db.tables['engine.messages'].length + 1}`; db.tables['engine.messages'].push({ id, conversation_id: cid, role, content, tool_calls: tc || null, meta: meta || null, created_at: new Date(clock += 1000).toISOString() }); return id; },
  });
  const gen = async () => ({ ok: true, invoice_number: 'TDW/DEV440/32', pdf_url: 'https://x.invalid/p.pdf', made: 'minted' });
  const turn = async (db, message, request, lane, M) => {
    const mod = M || WD;
    LF._resetLaneFlagCache();
    const out = await quiet(() => mod.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message, lane: lane || 'pwa' }, { llmCreate: earOf(request), nowMs: NOW, generateInvoiceForBinder: gen }));
    const said = out && out.door === true ? out : await quiet(() => mod.standIn({ supabase: db, out }, { nowMs: NOW }));
    await quiet(() => mod.persistDoorTurn({ supabase: db, agentId: AG, message, out: said, lane: lane || 'pwa' }, { memory: memoryOf(db), meter }));
    return { out, said, reply: said.reply, keys: J(said.keys) };
  };
  const lp = (leadId) => ({ id: `lp-${leadId}`, vendor_id: V.id, lead_id: leadId, package_id: 'p-film', snapshot: { name: 'Photographs and film', delivery_basis: 'days' }, total: 80000, schedule: [], delivery_on: null, quoted_at: null, quote_draft_id: null, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', deleted_at: null });
  const seeded = () => { const d = makeDb(world()); d.tables['public.leads'].push(leadRow({ id: 'l-asha', name: 'Asha Walk Twelve', wedding_date: '2027-03-05', wedding_date_precision: 'day' }), leadRow({ id: 'l-vikram', name: 'Vikram Walk Twelve', wedding_date: '2027-03-05', wedding_date_precision: 'day' })); d.tables['public.lead_packages'].push(lp('l-asha')); d.tables['engine.records'].push({ id: 'b-walk', agent_id: AG, client: 'Walk45', amount: 50000, amount_received: 0, hidden: false, date: '2026-09-25' }); return d; };
  const B2ASHA = 'Confirm this booking? Asha Walk Twelve · Photographs and film · Rs 80,000. Reply YES or NO.';

  // ─── §1 THE BYTE AND THE LISTENER'S LINES ──────────────────────────────────────────────────
  sec('1 B35, his byte, hash-carried; the listener\'s no-name line and F-44.105\'s wording');
  T('1.1 B35 is HIS byte verbatim (R-44.39) and its hash is the literal pinned here; B31 and B33 are still free (B-2\'s second cut)', DL.LINES.B35 === B35 && DL.LINE_HASHES.B35 === '7b73fec4bc3c30e66b5e33232961ccb26549d42d440d466e6e8de54402c1c773' && sha(B35) === '7b73fec4bc3c30e66b5e33232961ccb26549d42d440d466e6e8de54402c1c773' && 'B31' in DL.LINES && 'B33' in DL.LINES); // re-pinned in B-2's second cut: B31 and B33 are his now
  const LINE = 'A job said without a name is still a job: record it, with client_as_spoken empty.';
  T('1.2 SYSTEM holds the no-name line ONCE, verbatim, its hash a literal here, after Part A\'s sentence', LD.SYSTEM.split(LINE).length === 2 && sha(LINE) === sha('A job said without a name is still a job: record it, with client_as_spoken empty.') && LD.SYSTEM.indexOf(LINE) > LD.SYSTEM.indexOf('record no book_event'));
  const cd = LD.EAR_TOOL.input_schema.properties.acts.items.properties.client_as_spoken.description;
  T('1.3 F-44.105: client_as_spoken\'s description says a word with a meaning INSIDE a longer name is part of that name, with "Walk P7 Haldi" as its specimen, and copy the name WHOLE; b92 13.1\'s four phrases still hold', /INSIDE a longer name is part of that name/.test(cd) && /"Walk P7 Haldi" is the name Walk P7 Haldi and never Walk P7/.test(cd) && /copy the name WHOLE/.test(cd) && /NAME of a person, a couple or a family/.test(cd) && /is NEVER a client/.test(cd) && /no name was said it is EMPTY/.test(cd) && /her answer IS the name, whatever the word/.test(cd));
  const seen = [];
  await quiet(() => LD.hear({ supabase: makeDb(world()), route: ROUTE, message: T6_SAID, conversationId: 'c-1', excludeId: null }, { llmCreate: async (_p, params) => { seen.push(params); return { content: [{ type: 'tool_use', name: 'ear_request', input: JSON.parse(NONE_JSON) }], usage: {} }; } }));
  T('1.4 both bytes are SENT: the one call hear() makes carries the line in `system` and the wording in the tool', seen.length === 1 && seen[0].system.includes(LINE) && JSON.stringify(seen[0].tools).includes('copy the name WHOLE'));

  // ─── §2 B35 IS ASKED ───────────────────────────────────────────────────────────────────────
  sec('2 the name question: B35 asked by the door for a nameless covered act; B18 first where a lead is nameless too');
  T(`2.0 C-44.12: ${LCV9} §3 turn 6 holds "${T6_SAID}" HEARD as no act`, src(LCV9).includes(`HE: ${T6_SAID}\n`) && src(LCV9).includes('    HEARD: {"acts":[],"route":"none"}\n'));
  let db = seeded(); let r = await turn(db, T6_SAID, JSON.parse(NONE_JSON));
  T('2.1 THE CARD\'S SPECIMEN, Part One\'s turn 6 VERBATIM (heard as NO ACT): still LEFTOVER by code; if it reads so on his walk that is a finding for the chair, not his mistake', r.keys === 'LEFTOVER');
  db = seeded(); r = await turn(db, T6_SAID, req([money('booking_confirmed')]));
  T('2.2 THE SAME SENTENCE heard as the listener\'s new line asks it to hear it (booking_confirmed, client EMPTY): the door asks B35, HIS byte, and keeps a note; nothing staged, nothing written', r.reply === B35 && r.out.door === true && r.out.why === 'name_asked' && noteIn(db).asked === 'B35' && canon(noteIn(db).acts) === canon([{ act: 'booking_confirmed' }]) && staged(db).length === 0 && db.log.inserts.every((i) => i.table === 'engine.usage') && db.log.updates.every((u) => u.table === 'engine.messages'));
  for (const [label, acts] of [['an advance', [money('advance_paid', null, 'today')]], ['a payment', [money('milestone_paid', null, 'yesterday')]], ['an invoice', [{ act: 'invoice' }]], ['an attach', [att(null, 'Photographs and film')]]]) {
    db = seeded(); r = await turn(db, 'x', req(acts));
    T(`2.3 INVENTED: ${label} naming no client is asked B35, the note carrying the act with its other slots`, r.reply === B35 && noteIn(db).asked === 'B35' && canon(noteIn(db).acts[0]) === canon(acts[0]));
  }
  db = seeded(); r = await turn(db, 'Add a new lead and the booking is confirmed', req([{ act: 'lead' }, money('booking_confirmed')]));
  T('2.4 a nameless LEAD beside a nameless money act: B18 is asked FIRST, the note carrying BOTH', r.reply === B18 && noteIn(db).asked === 'B18' && noteIn(db).acts.length === 2);
  db = seeded(); r = await turn(db, 'x', req([{ act: 'lead', client_as_spoken: 'Meera Walk Twelve' }, money('booking_confirmed')]));
  T('2.5 a NAMED lead beside a nameless money act: B35 is asked and NOTHING runs yet, the lead not filed until the name comes (one question, then everything)', r.reply === B35 && leadsIn(db).length === 0 && noteIn(db).acts.length === 2);
  db = seeded(); r = await turn(db, 'x', req([money('booking_confirmed'), { act: 'note' }]));
  T('2.6 a nameless act beside an UNCOVERED act is still B34: the name question is asked only of a request the door covers', r.keys === 'B34');
  db = seeded(); r = await turn(db, 'The booking is confirmed 9876543210', req([{ act: 'lead' }, money('booking_confirmed')]));
  // RE-PINNED (CE-45 LCV-11, P6b first cut; F-44.96 closed): the guard at the name question is gone; a nameless lead beside a money act asks B18 as any.
  T('2.7 (re-pinned at P6b) the guard is gone at the name question too: a nameless lead with a phone-shaped number asks B18', r.keys === 'B18' && r.out.why === 'name_asked');
  { const d1 = seeded(); await turn(d1, 'x', req([money('invoice')])); const a = lastDoor(d1).meta.listener; const d2 = seeded(); await turn(d2, 'x', req([{ act: 'lead' }])); const b = lastDoor(d2).meta.listener;
    T('2.8b (the same, awaited): a B35 row carries no asked_name and no asked; a B18 row carries asked_name B18 beside its note', !('asked_name' in a) && !('asked' in a) && b.asked_name === 'B18' && (b.note || {}).asked === 'B18'); }

  // ─── §3 THE NAME IS READ ───────────────────────────────────────────────────────────────────
  sec('3 the name answer: her whole trimmed message is the name');
  T(`3.0 C-44.12: ${LCV8} §4 holds "Walk P7 Haldi" answered to B18 and HEARD as client "Walk P7"`, src(LCV8).includes('she answered B18 with "Walk P7 Haldi"; HEARD client_as_spoken "Walk P7"'));
  db = seeded(); await turn(db, 'Add a new lead, haldi shoot on 3 January', req([{ act: 'lead', date_as_spoken: '3 January' }]));
  r = await turn(db, 'Walk P7 Haldi', req([{ act: 'lead', client_as_spoken: 'Walk P7', date_as_spoken: '3 January' }]));
  T('3.1 F-44.105, P6a-2\'s TURN 2 as recorded: "Walk P7 Haldi" answered to B18, the listener returning "Walk P7" with the date carried: THE WHOLE NAME IS FILED, event word and all, with the date the note carried: "Lead added: Walk P7 Haldi · 3 January 2027."', r.reply === 'Lead added: Walk P7 Haldi · 3 January 2027.' && leadsIn(db)[0].name === 'Walk P7 Haldi' && lastDoor(db).meta.listener.answered === 'B18');
  db = seeded(); await turn(db, 'Add a new lead', req([{ act: 'lead' }]));
  r = await turn(db, 'Sangeet', JSON.parse(NONE_JSON));
  T('3.2 an event word alone, heard as NO ACT (F-44.101\'s open case): it IS the name: "Lead added: Sangeet."', r.reply === 'Lead added: Sangeet.' && leadsIn(db)[0].name === 'Sangeet');
  db = seeded(); await turn(db, 'Add a new lead', req([{ act: 'lead' }]));
  r = await turn(db, '  Meera  Walk Twelve  ', req([{ act: 'lead', client_as_spoken: 'Meera' }]));
  T('3.3 the name is her message TRIMMED, whatever the listener kept: "Meera  Walk Twelve"', leadsIn(db)[0].name === 'Meera  Walk Twelve' && r.keys === 'B16');
  db = seeded(); await turn(db, T6_SAID, req([money('booking_confirmed')]));
  r = await turn(db, 'Asha Walk Twelve', JSON.parse(NONE_JSON));
  T('3.4 THE CARD: "Asha Walk Twelve" answered to B35, heard as NO ACT: the booking is planned afresh from the rows and STAGED, B2 from the row; NOTHING applied', r.reply === B2ASHA && staged(db).length === 1 && staged(db)[0].state === 'staged' && db.tables['public.leads'].find((l) => l.id === 'l-asha').state === 'new' && lastDoor(db).meta.listener.asked === 'B2' && noteOf(db) === undefined);
  r = await turn(db, 'No', JSON.parse(NONE_JSON));
  T('3.5 and her No declines that money question as today: B3, the row declined', r.reply === B3 && staged(db)[0].state === 'declined');
  db = seeded(); await turn(db, 'x', req([money('booking_confirmed')]));
  r = await turn(db, 'asha walk twelve', req([money('booking_confirmed', 'asha walk twelve')]));
  T('3.6 heard as the noted act with the name (the thread carried it): the same, B2', r.reply === B2ASHA);
  db = seeded(); await turn(db, 'x', req([money('booking_confirmed')]));
  r = await turn(db, 'Nobody Walk Twelve', JSON.parse(NONE_JSON));
  T('3.7 a name that is no lead: the plans answer B4, as they answer any booking on no lead; no note left', r.reply === 'Could not confirm the booking. No lead called Nobody Walk Twelve. Add the lead first.' && noteOf(db) === undefined);
  db = seeded(); await turn(db, 'x', req([{ act: 'lead', client_as_spoken: 'Meera Walk Twelve', date_as_spoken: '5 March 2027' }, money('booking_confirmed')]));
  r = await turn(db, 'Asha Walk Twelve', JSON.parse(NONE_JSON));
  T('3.8 B35 answered fills EVERY nameless act but `lead`: the named lead files and the booking on Asha is staged, in one turn', r.keys === 'B17,B2' && leadsIn(db).length === 1 && staged(db).length === 1);
  db = seeded(); await turn(db, 'x', req([{ act: 'lead' }, money('booking_confirmed')]));
  const n1 = await turn(db, 'Meera Walk Twelve', JSON.parse(NONE_JSON)); const filedAfterN1 = leadsIn(db).length;
  const n2 = await turn(db, 'Asha Walk Twelve', JSON.parse(NONE_JSON));
  T('3.9 B18 THEN B35, one question at a time, the note carrying the rest: the first name is taken and B35 is asked at once, NOTHING running yet; the second name runs everything: the lead filed and the booking staged in one turn', n1.keys === 'B35' && filedAfterN1 === 0 && n2.keys === 'B16,B2' && leadsIn(db)[0].name === 'Meera Walk Twelve' && staged(db).length === 1);
  db = seeded(); await turn(db, 'x', req([att(null, 'Photographs and film')]));
  r = await turn(db, 'Vikram Walk Twelve', JSON.parse(NONE_JSON));
  T('3.10 an attach with no client, then the name: attached at once (R-44.33), B22 from the row', r.reply === 'Package attached: Vikram Walk Twelve · Photographs and film · Rs 80,000.' && lpsIn(db).length === 1);
  db = seeded(); await turn(db, 'x', req([{ act: 'invoice' }]));
  r = await turn(db, 'Walk45', JSON.parse(NONE_JSON));
  T('3.11 an invoice with no client, then the name: the invoice is made', r.keys === 'B13');

  // ─── §4 WHAT LAPSES A NAME NOTE, AND WHAT DOES NOT ─────────────────────────────────────────
  sec('4 the name note lapses on a different heard act or a restated job; a yes is re-asked once; a no is B3');
  db = seeded(); await turn(db, 'x', req([money('booking_confirmed')]));
  r = await turn(db, 'Raise the invoice for Walk45', req([{ act: 'invoice', client_as_spoken: 'Walk45' }]));
  T('4.1 an act of ANOTHER kind lapses the note: handled fresh, the invoice made, nothing staged', r.keys === 'B13' && staged(db).length === 0 && noteOf(db) === undefined);
  // C-44.13: the money plans read the REAL clock for a received date, so yesterday and today are derived on both sides of the turn, never pinned.
  const SD = require(P('src/lib/vendor/spokenDate.js'));
  const yd0 = SD.resolveSpokenDate('yesterday', { direction: 'past' }).iso;
  db = seeded(); await turn(db, 'x', req([money('advance_paid')]));
  r = await turn(db, 'The advance came in yesterday for Asha Walk Twelve', req([money('advance_paid', 'Asha Walk Twelve', 'yesterday')]));
  const yd1 = SD.resolveSpokenDate('yesterday', { direction: 'past' }).iso;
  T('4.2 F-44.115 applied to names: the noted kind RESTATED with a NEW date is handled fresh: the advance planned from what was heard, B2 asked, STAGED with yesterday (derived from the clock), nothing applied', r.reply === B2ASHA && staged(db).length === 1 && [yd0, yd1].includes(staged(db)[0].request.advance_received_on) && db.tables['public.leads'].find((l) => l.id === 'l-asha').state === 'new');
  db = seeded(); await turn(db, 'x', req([money('advance_paid', null, 'today')]));
  r = await turn(db, 'Asha Walk Twelve', req([money('advance_paid', 'Asha Walk Twelve', 'today')]));
  T('4.3 F-44.116 for names: the date the note ALREADY carries, echoed back by the listener, is NOT a new date: her message is the name, B2 with today (derived)', r.reply === B2ASHA && [SD.todayIstIso(), yd1].some((d0) => d0 === staged(db)[0].request.advance_received_on) && lastDoor(db).meta.listener.answered === 'B35');
  db = seeded(); await turn(db, 'x', req([money('booking_confirmed')]));
  const y1 = await turn(db, 'Yes', JSON.parse(NONE_JSON)); const t1 = noteIn(db).tries;
  const y2 = await turn(db, 'okay', JSON.parse(NONE_JSON));
  T('4.4 a closed YES word is an answer the door cannot read: the question ONCE more (tries 1), then B3; nothing staged', y1.reply === B35 && t1 === 1 && y2.reply === B3 && staged(db).length === 0 && noteOf(db) === undefined);
  db = seeded(); await turn(db, 'x', req([{ act: 'lead' }]));
  r = await turn(db, 'No', JSON.parse(NONE_JSON));
  T('4.5 a closed NO word answered to B18 is B3, decided before the listener', r.reply === B3 && r.out.why === 'note_declined' && leadsIn(db).length === 0);
  db = seeded(); await turn(db, 'x', req([money('booking_confirmed')]));
  db.tables['public.pending_money_acts'].push({ id: 'pm-1', vendor_id: V.id, act: 'booking_confirmed', request: { lead_id: 'l-asha', lead_name: 'Asha Walk Twelve', kind: 'booking_confirmed' }, lane: 'pwa', state: 'staged', outcome: null, created_at: new Date(NOW - 60000).toISOString(), resolved_at: null, expires_at: new Date(NOW + 600000).toISOString() });
  r = await turn(db, 'No', JSON.parse(NONE_JSON));
  T('4.6 a live staged money row wins over a name note: her No declines the money question', r.reply === B3 && r.out.why !== 'note_declined' && staged(db)[0].state === 'declined');
  db = seeded(); await turn(db, 'x', req([money('booking_confirmed')]));
  await turn(db, 'Hello', JSON.parse(NONE_JSON));
  T('4.7 SAID PLAINLY, the ruling\'s cost: "Hello" typed after B35 IS the name, so B4 answers about a lead called Hello; no note remains', lastDoor(db).content === 'Could not confirm the booking. No lead called Hello. Add the lead first.' && noteOf(db) === undefined);

  // ─── §5 F-44.116 IN THE DATE NOTE, FROM THE RECORD ─────────────────────────────────────────
  sec('5 F-44.116: his "whenever" of 22 September, heard as the attach with date "whenever", is a re-ask and not a restatement');
  T(`5.0 C-44.12: ${FIXWALK} §3 holds turn 7's HEARD line verbatim`, fs.existsSync(P(FIXWALK)) && src(FIXWALK).includes(`HE: ${W_SAID}\n`) && src(FIXWALK).includes(`    HEARD: ${W_JSON}\n`));
  db = seeded(); db.tables['public.leads'].push(leadRow({ id: 'l-rohan', name: 'Rohan Walk Eleven', wedding_date: '2026-12-05', wedding_date_precision: 'day' }));
  await turn(db, 'Attach Walk P7 Album to Rohan Walk Eleven', req([att('Rohan Walk Eleven', 'Walk P7 Album')]));
  const w1 = await turn(db, W_SAID, JSON.parse(W_JSON)); const tw1 = noteIn(db).tries;
  const w2 = await turn(db, W_SAID, JSON.parse(NONE_JSON));
  T('5.1 TURN 7 AS RECORDED: "whenever" heard as the attach WITH date "whenever" is B7 with the note kept at tries 1 (his walk read a NEW note at tries 0); the next "whenever", no act, is B3. Twice, as the card said, not three times', w1.reply === B7 && tw1 === 1 && w2.reply === B3 && lpsIn(db).length === 0);
  db = seeded(); await turn(db, 'Attach Walk P7 Album to Asha Walk Twelve', req([att('Asha Walk Twelve', 'Walk P7 Album')]));
  r = await turn(db, 'deliver it for Asha Walk Twelve by 5 June 2027 please', req([att('Asha Walk Twelve', 'Walk P7 Album', '5 June 2027')])); // re-pinned for F-44.118: the name in her words
  T('5.2 a GENUINE restatement (the heard date differs from her message) still lapses and is handled fresh: attached with 5 June 2027', r.keys === 'B27' && lpsIn(db)[0].delivery_on === '2027-06-05');

  // ─── §6 THE CARD ───────────────────────────────────────────────────────────────────────────
  sec('6 every SAY line on B-2 (first cut)\'s walk card, in ONE thread and one database');
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
      await quiet(() => lane.processVendorInbound({ phone: '+919888294440', body: o.message, profileName: 'Dev', messageSid: `wamid.b97.${Math.random()}`, internalReplay: false, trimmedBody: o.message.trim(), numMedia: 0, hasMedia: false, mediaUrl: null, rawPayload: {} }, deps));
      return { turns: turns.n, sent };
    } finally {
      if (savedWD) require.cache[WDP] = savedWD; else delete require.cache[WDP];
      if (savedVI) require.cache[VIP] = savedVI; else delete require.cache[VIP];
      LF._resetLaneFlagCache();
    }
  };
  const one = (w) => (w.turns === 0 && w.sent.length === 1 && Array.isArray(w.sent[0].media) && w.sent[0].media.length === 0 ? w.sent[0].text : `turns=${w.turns} sent=${w.sent.length}`);
  {
    const d = makeDb(world()); d.tables['engine.records'].push({ id: 'b-walk', agent_id: AG, client: 'Walk45', amount: 50000, amount_received: 0, hidden: false, date: '2026-09-25' });
    const c1 = await turn(d, 'Add a new lead Asha Walk Twelve, wedding on 31 February 2027', req([lead('Asha Walk Twelve', '31 February 2027')]));
    const c2 = await turn(d, 'Add a new lead Asha Walk Twelve, wedding on 5 March 2027', req([lead('Asha Walk Twelve', '5 March 2027')]));
    T('6.1 THE RETYPE (owed since the 21st): refused, then the whole sentence again: B7, then "Lead added: Asha Walk Twelve · 5 March 2027."', c1.reply === B7 && c2.reply === 'Lead added: Asha Walk Twelve · 5 March 2027.');
    const c3 = await turn(d, 'Attach Photographs and film to Asha Walk Twelve', req([att('Asha Walk Twelve', 'Photographs and film')]));
    T('6.2 SAY "Attach Photographs and film to Asha Walk Twelve": "Package attached: Asha Walk Twelve · Photographs and film · Rs 80,000."', c3.reply === 'Package attached: Asha Walk Twelve · Photographs and film · Rs 80,000.');
    const c4 = await turn(d, 'Add a new lead, haldi shoot on 3 January', req([{ act: 'lead', date_as_spoken: '3 January' }]));
    const c5 = await turn(d, 'Vikram Walk Twelve', req([{ act: 'lead', client_as_spoken: 'Vikram', date_as_spoken: '3 January' }]));
    T('6.3 SAY "Add a new lead, haldi shoot on 3 January" (his own example), then "Vikram Walk Twelve" (heard in the shape of P6a-2\'s turn 2, the name shortened): B18, then "Lead added: Vikram Walk Twelve · 3 January 2027." WHOLE', c4.reply === B18 && c5.reply === 'Lead added: Vikram Walk Twelve · 3 January 2027.' && leadsIn(d)[1].name === 'Vikram Walk Twelve');
    const c6 = await turn(d, T6_SAID, req([money('booking_confirmed')]));
    const c7 = await turn(d, 'Asha Walk Twelve', JSON.parse(NONE_JSON));
    const c8 = await turn(d, 'No', JSON.parse(NONE_JSON));
    T('6.4 SAY "The booking is confirmed" (IF the listener hears the job), then "Asha Walk Twelve", then "No": B35; "Confirm this booking? Asha Walk Twelve · Photographs and film · Rs 80,000. Reply YES or NO."; B3; the row declined, Asha still new', c6.reply === B35 && c7.reply === B2ASHA && c8.reply === B3 && staged(d)[0].state === 'declined' && d.tables['public.leads'].find((l) => l.name === 'Asha Walk Twelve').state === 'new');
    const c9 = await turn(d, 'The advance came in today', req([money('advance_paid', null, 'today')]));
    const c10 = await turn(d, 'Raise the invoice for Walk P8 Nobody', req([{ act: 'invoice', client_as_spoken: 'Walk P8 Nobody' }]));
    T('6.5 SAY "The advance came in today", then "Raise the invoice for Walk P8 Nobody": B35, then B15 (the note lapsed on another job, handled fresh, no client by that name), nothing new staged', c9.reply === B35 && c10.reply === 'Could not make the invoice. No client called Walk P8 Nobody.' && staged(d).length === 1);
    const c11 = await driveWA({ db: d, message: 'Add a new lead', request: req([{ act: 'lead' }]) });
    const c12 = await driveWA({ db: d, message: 'Priya Walk Twelve', request: JSON.parse(NONE_JSON) });
    T('6.6 ON WHATSAPP, SAY "Add a new lead", then "Priya Walk Twelve": B18, then "Lead added: Priya Walk Twelve.", the chain never called', one(c11) === B18 && one(c12) === 'Lead added: Priya Walk Twelve.');
    const rows = d.tables['engine.messages'].filter((m) => m.role === 'assistant');
    T('6.7 the thread holds the card: twelve turns, every one answered by code, the last two on whatsapp', rows.length === 12 && rows.every((m) => m.meta.listener.door === true) && rows.slice(-2).every((m) => m.meta.listener.lane === 'whatsapp'));
  }

  // ─── §7 W-1 ───────────────────────────────────────────────────────────────────────────────
  sec('7 W-1 NONE, read from this packet\'s own manifest');
  const man = fs.existsSync(P(MAN)) ? src(MAN).split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#')) : [];
  T('7.1 W-1 NONE: no path under src/engine, no soul, lens or prompt file, no migration', man.length > 0 && man.every((p) => !/^src\/engine\/|soul|lens|^db\/migrations\//.test(p)));
  T('7.2 the manifest names exactly the eleven paths this packet touches (C-44.7)', JSON.stringify(man.slice().sort()) === JSON.stringify([FIXWALK, MAN, 'scripts/b97_lcv10_name_bench.js', 'scripts/b96_lcv10_fix_bench.js', 'scripts/b94_lcv10_bench.js', 'scripts/b93_lcv9_chain_out_bench.js', 'scripts/b92_lcv_p6a_bench.js', 'scripts/b90_lcv_p5_bench.js', 'src/lib/vendor/doorLines.js', 'src/lib/vendor/listenerDoor.js', WDf].sort()));
  T('7.3 the ONE vendor byte added is B35, his; every other line of doorLines.js LINES is as it was (the hashes of the rest unchanged)', Object.keys(DL.LINES).length === 81 /* RE-PINNED (CE-45 LCV-15, LSP_2, labelled): 79 to 81, B84 and B85, his (R-45.16, the screenshot save); b112 holds them */ /* RE-PINNED (CE-45 LCV-14, P7 cut 4 fix, labelled): 79 since B80 to B83, his; b109 holds them */ /* RE-PINNED (CE-45 LCV-14, P7 cut 4, labelled): 75 since B69 to B74, B78, B79, his (ASK 7: each form its own key); b108 holds them */ /* RE-PINNED (CE-45 LCV-14, P7 cut 3, labelled): 67 since B56 to B62, B67, B68, his (B60 carried, unspoken); b106 holds them */ && /* RE-PINNED (CE-45 LCV-13, P7 2b, labelled): 58 since B48 to B53, his; b105 holds them */ // 38 since the third B-2 cut (B36); 41 since P6b (B37, B38, B39); 52 since P7 2a (B40 to B46, B54, B75 to B77, his; CE-45 LCV-12)
     DL.LINE_HASHES.B34 === '3dc0787ed3e775e75d9d838cf0a87f7ef66d43e499fa665c107a466dfa76b4eb' && DL.LINE_HASHES.B18 === 'f6d70e738f124ab29e818590116913b8cb744e777f722c7157e70dbe0ca366a0');

  // ─── §8 FUZZ ───────────────────────────────────────────────────────────────────────────────
  sec('8 fuzz');
  const boom = () => { throw new Error('hostile'); };
  const trap = new Proxy({}, { get: boom, has: boom, ownKeys: boom, getOwnPropertyDescriptor: boom });
  const HS = [undefined, null, 0, NaN, '', 'x', true, [], {}, () => {}, trap, { asked: 'B35' }, { asked: 'B35', acts: [] }, { asked: 'B35', acts: [{ act: 'lead' }] }, { asked: 'B18', acts: [money('booking_confirmed')] }, { asked: 'B35', acts: [money('booking_confirmed', 'X')] }, { asked: 'B35', acts: [{ act: 'block_date' }] }, { asked: 'B35', acts: [trap] }, { asked: 'B35', acts: [money('booking_confirmed')], tries: -1 }, { asked: 'B18', acts: [{ act: 'lead', date_as_spoken: '5 March 2027' }] }, { asked: 'B18', acts: [{ act: 'lead' }, { act: 'lead' }, { act: 'lead' }, { act: 'lead' }, { act: 'lead' }] }];
  let t8 = 0; let ok8 = 0;
  for (const a of HS) { try { const v = WD.validNote(a); if (v) { ok8 += 1; if (!(v.asked === 'B18' ? v.acts.some((x) => x.act === 'lead' && !x.client_as_spoken) : v.acts.some((x) => x.act !== 'lead' && !x.client_as_spoken))) t8 += 1; } } catch (_e) { t8 += 1; } }
  T(`8.1 validNote on ${HS.length} hostile name notes: ZERO throws; it accepts only a B18 note holding a nameless lead or a B35 note holding a nameless covered act (${ok8} accepted)`, t8 === 0 && ok8 === 2);
  let t9 = 0;
  for (const a of HS) { const d = seeded(); let m = a; try { JSON.stringify(a); } catch (_e) { m = undefined; } if (typeof a === 'function' || a === trap) m = undefined; d.tables['engine.messages'].push({ id: 'h', conversation_id: 'c-1', role: 'assistant', content: 'q', meta: { listener: { door: true, note: m } }, created_at: new Date(clock += 1000).toISOString() });
    try { const o = await quiet(() => WD.preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message: 'Asha Walk Twelve', lane: 'pwa' }, { llmCreate: earOf(JSON.parse(NONE_JSON)), nowMs: NOW })); if (!o || typeof o.door !== 'boolean') t9 += 1; if (staged(d).length && !WD.validNote(m)) t9 += 1; } catch (_e) { t9 += 1; } }
  T(`8.2 preTurn with a hostile name note on the last row (${HS.length} shapes): ZERO throws, a verdict always, and a note that is not well-formed never stages`, t9 === 0);

  // ─── §9 MUTATIONS ──────────────────────────────────────────────────────────────────────────
  sec('9 mutations of production code, each reddening its cell');
  const flow = async (rq, steps, seedFn) => { const M = rq(WDf); const d = seedFn ? seedFn() : seeded(); const out = []; for (const [m, q] of steps) out.push(await turn(d, m, q, 'pwa', M)); return { out, d }; };
  await mut('9.1 M1 the name question removed: a nameless booking is uncovered again and the stand-in speaks LEFTOVER (reddens 2.2, 6.4; b90 5.2, b93 11.9)', WDf,
    [["    { const ask = askName(heard, 0); if (ask) return ask; }\n", '']], [],
    async (rq) => flow(rq, [[T6_SAID, req([money('booking_confirmed')])]]), (x) => x.out[0].keys === 'LEFTOVER');
  await mut('9.2 M2 the name taken from the LISTENER instead of her whole message: "Walk P7 Haldi" files as "Walk P7", 21 September exactly (reddens 3.1, 6.3)', WDf,
    [["? { ...a, client_as_spoken: name } : { ...a }))", "? { ...a, client_as_spoken: (heardActs[0] && heardActs[0].client_as_spoken) || name } : { ...a }))"]], [],
    async (rq) => flow(rq, [['x', req([{ act: 'lead', date_as_spoken: '3 January' }])], ['Walk P7 Haldi', req([{ act: 'lead', client_as_spoken: 'Walk P7', date_as_spoken: '3 January' }])]]), (x) => leadsIn(x.d)[0] && leadsIn(x.d)[0].name === 'Walk P7');
  await mut('9.3 M3 B35 before B18: a nameless lead beside a nameless booking is asked B35 (reddens 2.4)', WDf,
    [["      const k = namelessLead(rq.acts) ? 'B18' : 'B35';", "      const k = 'B35';"]], [],
    async (rq) => flow(rq, [['x', req([{ act: 'lead' }, money('booking_confirmed')])]]), (x) => x.out[0].reply === B35);
  await mut('9.4 M4 the lapse on another kind removed: "Raise the invoice for Walk45" typed after B35 becomes the client\'s name (reddens 4.1)', WDf,
    [["(!kinds.includes(a.act) || newDate(a))", "(newDate(a))"]], [],
    async (rq) => flow(rq, [['x', req([money('booking_confirmed')])], ['Raise the invoice for Walk45', req([{ act: 'invoice', client_as_spoken: 'Walk45' }])]]), (x) => /No lead called Raise the invoice for Walk45/.test(x.out[1].reply));
  await mut('9.5 M5 F-44.116\'s echo test removed from the DATE note: his "whenever" is a restatement again, a new note at tries 0 (reddens 5.1)', WDf,
    [["((!!spokenText(a.date_as_spoken) && key(a.date_as_spoken) !== key(message.trim()))", "((!!spokenText(a.date_as_spoken))"]], [],
    async (rq) => flow(rq, [['Attach Walk P7 Album to Asha Walk Twelve', req([att('Asha Walk Twelve', 'Walk P7 Album')])], ['whenever', req([att('Asha Walk Twelve', 'Walk P7 Album', 'whenever')])]]), (x) => noteIn(x.d).tries === 0 && x.out[1].reply === B7);
  await mut('9.6 M6 the YES re-ask unbounded: a third yes is asked again instead of B3 (reddens 4.4)', WDf,
    [["        if (note.tries > 0) return { door: true, reply: DL.LINES.B3", "        if (note.tries > 9) return { door: true, reply: DL.LINES.B3"]], [],
    async (rq) => flow(rq, [['x', req([money('booking_confirmed')])], ['Yes', JSON.parse(NONE_JSON)], ['Yes', JSON.parse(NONE_JSON)]]), (x) => x.out[2].reply === B35);
  await mut('9.7 M7 a name note accepted over an UNCOVERED act (reddens 8.1)', WDf,
    // TWO guards hold it (noteAct's covered test and allKindsCovered); both removed here, as b95 9.13 says of the date note's pair
    [["if (NAME_ASKS.includes(n.asked)) { if (!allKindsCovered(acts) ||", "if (NAME_ASKS.includes(n.asked)) { if (false ||"], ["typeof a.act !== 'string' || !COVERED.includes(a.act)) return null;", "typeof a.act !== 'string') return null;"]], [],
    async (rq) => rq(WDf).validNote({ asked: 'B35', acts: [{ act: 'edit_event' }] }), (v) => v !== null); // P7 2a re-aim: the uncovered act that NEEDS a client is edit_event (2b's); block_date is covered and needs none, assign_crew needs none
  await mut('9.8 M8 the money act APPLIED on the name\'s turn instead of staged (the chair\'s pin, as b95 9.9): reddens 3.4', WDf,
    [['        try { row = await pma.stage(supabase, { vendorId: vendor.id, act: moneyPlan.stage.act, request: moneyPlan.stage.request, lane }); }', "        try { (supabase.tables['public.leads'].find((l) => l.id === moneyPlan.stage.request.lead_id) || {}).state = 'booked'; row = { id: 'applied' }; }"]], [],
    async (rq) => flow(rq, [['x', req([money('booking_confirmed')])], ['Asha Walk Twelve', JSON.parse(NONE_JSON)]]), (x) => staged(x.d).length === 0 && x.d.tables['public.leads'].find((l) => l.id === 'l-asha').state === 'booked');
  await mut('9.9 M9 the listener\'s no-name line removed (reddens 1.2)', 'src/lib/vendor/listenerDoor.js',
    [["  'A job said without a name is still a job: record it, with client_as_spoken empty.',\n", '']], [],
    async (rq) => rq('src/lib/vendor/listenerDoor.js').SYSTEM, (s) => !s.includes('still a job'));

  console.log(`\n════════  b97 · ${pass} pass · ${fail} fail  ════════`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`  · ${f}`)); }
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('b97 CRASHED:', (e && e.stack) || e); process.exit(2); });
