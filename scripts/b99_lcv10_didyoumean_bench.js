'use strict';
// scripts/b99_lcv10_didyoumean_bench.js · TDW CE-44 · LCV-10 · THE THIRD B-2 CUT: B36 "Did you mean" (R-44.40) in ONE HOME; F-44.118's floor under R-44.41. Rung b99.
//
// R-44.40 (the founder, 22 September): "Did you mean {name}? Reply YES or NO." is HIS. ONE HOME, nearestName, for every name lookup the door
// does: leads (the money acts, the attach) and packages; NEVER dates or amounts. THE PINNED DISTANCE over key()-folded strings: a Damerau
// distance of exactly 1 (one character inserted, deleted or replaced, or two adjacent swapped), or the same words reordered; never across
// a whole different name; two equally close is none; no row close is none, and today's line speaks unchanged (B4, B32, B23). The candidate
// comes from HER rows only. It is a QUESTION with a note carrying the act and the candidate's id; YES runs the act with the candidate's own
// name through the same plans, money still STAGED and only her YES to B1 or B2 applying it; NO is B3; never while a money row is live; the
// candidate appears nowhere but the question.
// F-44.118 (the chair; kept by the founder's R-44.41 as a safety floor under money, the reduced standard): a heard client not present in
// her message under key(), on a turn not answering a note, is UNSAID and B18 or B35 is asked; scoped to fire only when her message holds
// two or more words, so the rungs' placeholder drivers ('x') are untouched. Its two recorded turns are replayed VERBATIM from the handovers.
// e-72's cure rides in b96. C-44.12 and C-44.13 as always. THE EXIT CODE IS THE VERDICT.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-ce44-lcv10-partb2c.txt';
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

const WALK_B = 'docs/handovers/TDW_CE44_LCV10_PARTB2B_HANDOVER.md';
const WALK_C = 'docs/handovers/TDW_CE44_LCV10_PARTB2C_HANDOVER.md';
const NONE_JSON = '{"acts":[],"route":"none"}';
// RECORDED: "The booking is confirmed" HEARD with the thread's last name pasted on, 22 September, 06:32:24 (WALK_B §3, turn 6) and 08:01:09 (WALK_C §3, turn 8).
const BC_SAID = 'The booking is confirmed';
const BC1_JSON = '{"acts":[{"act":"booking_confirmed","client_as_spoken":"Vikram Walk Twelve"}],"route":"task"}';
const BC2_JSON = '{"acts":[{"act":"booking_confirmed","client_as_spoken":"Ravi Walk Thirteen"}],"route":"task"}';
const B3 = 'Okay. Nothing was changed.'; const B35 = 'Which client? Say the name.'; const B18 = 'Who is the lead? Say the name.';
const DYM = (n) => `Did you mean ${n}? Reply YES or NO.`;
const att = (client, pkg, date) => ({ act: 'attach_package', ...(client ? { client_as_spoken: client } : {}), ...(pkg ? { package_as_spoken: pkg } : {}), ...(date ? { date_as_spoken: date } : {}) });
const money = (act, client, date) => ({ act, ...(client ? { client_as_spoken: client } : {}), ...(date ? { date_as_spoken: date } : {}) });
const staged = (d) => (d.tables['public.pending_money_acts'] || []);
const lastDoor = (d) => d.tables['engine.messages'].filter((m) => m.role === 'assistant').slice(-1)[0];
const noteOf = (d) => { const r = lastDoor(d); return r && r.meta && r.meta.listener ? r.meta.listener.note : undefined; };
const noteIn = (d) => noteOf(d) || { acts: [{}] };

async function main() {
  const WD = require(WDP);
  const DL = require(P('src/lib/vendor/doorLines.js'));
  const LH = require(P('src/lib/vendor/lifecycleHands.js'));
  const LF = require(LFP);
  const meter = require(P('src/agent/harvest.js'))._meter;
  const memoryOf = (db) => ({
    getOrCreateConversation: async () => ({ conversationId: 'c-1', thread: [] }),
    saveMessage: async (cid, role, content, tc, meta) => { const id = `m-${db.tables['engine.messages'].length + 1}`; db.tables['engine.messages'].push({ id, conversation_id: cid, role, content, tool_calls: tc || null, meta: meta || null, created_at: new Date(clock += 1000).toISOString() }); return id; },
  });
  const gen = async () => ({ ok: true, invoice_number: 'TDW/DEV440/34', pdf_url: 'https://x.invalid/p.pdf', made: 'minted' });
  const turn = async (db, message, request, lane, M) => {
    const mod = M || WD;
    LF._resetLaneFlagCache();
    const out = await quiet(() => mod.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message, lane: lane || 'pwa' }, { llmCreate: earOf(request), nowMs: NOW, generateInvoiceForBinder: gen }));
    const said = out && out.door === true ? out : await quiet(() => mod.standIn({ supabase: db, out }, { nowMs: NOW }));
    await quiet(() => mod.persistDoorTurn({ supabase: db, agentId: AG, message, out: said, lane: lane || 'pwa' }, { memory: memoryOf(db), meter }));
    return { out, said, reply: said.reply, keys: J(said.keys) };
  };
  const lp = (leadId) => ({ id: `lp-${leadId}`, vendor_id: V.id, lead_id: leadId, package_id: 'p-film', snapshot: { name: 'Photographs and film', delivery_basis: 'days' }, total: 80000, schedule: [], delivery_on: null, quoted_at: null, quote_draft_id: null, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', deleted_at: null });
  const seeded = () => { const d = makeDb(world()); d.tables['public.leads'].push(leadRow({ id: 'l-isha', name: 'Isha Walk Fourteen', wedding_date: '2027-03-05', wedding_date_precision: 'day' }), leadRow({ id: 'l-kabir', name: 'Kabir Walk Fourteen', wedding_date: '2027-03-05', wedding_date_precision: 'day' })); d.tables['public.lead_packages'].push(lp('l-isha')); d.tables['engine.records'].push({ id: 'b-walk', agent_id: AG, client: 'Walk45', amount: 50000, amount_received: 0, hidden: false, date: '2026-09-25' }); return d; };
  const B2ISHA = 'Confirm this booking? Isha Walk Fourteen · Photographs and film · Rs 80,000. Reply YES or NO.';

  // ─── §1 THE BYTE AND THE HOME ──────────────────────────────────────────────────────────────
  sec('1 B36, his byte; the pinned distance, one home');
  T('1.1 B36 is HIS byte verbatim (R-44.40), its hash the literal pinned here and equal to sha256 of the bytes', DL.LINES.B36 === 'Did you mean {name}? Reply YES or NO.' && DL.LINE_HASHES.B36 === '43b514de672ba94fbd24698a7fe9d18389958812a6d7344b0efab074bacd75d2' && sha(DL.LINES.B36) === DL.LINE_HASHES.B36 && DL.render('B36', { name: 'X' }) === DYM('X'));
  const rows = [{ id: 'a', name: 'Isha Walk Fourteen' }, { id: 'b', name: 'Kabir Walk Fourteen' }, { id: 'c', name: 'Walk P7 Album' }, { id: 'd', name: 'Photographs and film' }];
  // e-62's lesson: a missing helper reads as a named FAIL, never a crash
  const NN = WD.nearestName || (() => { throw new Error('no nearestName'); });
  const N = (s, r) => { try { const c = NN(s, r || rows); return c ? c.name : null; } catch (_e) { return 'NO HELPER'; } };
  T('1.2 ONE character slipped offers: a letter dropped, added, replaced', N('Isha Walk Fourten') === 'Isha Walk Fourteen' && N('Isha Walk Fourteens') === 'Isha Walk Fourteen' && N('Isha Walk Fourteem') === 'Isha Walk Fourteen' && N('Photograph and film') === 'Photographs and film');
  T('1.3 a TRANSPOSITION offers', N('Isah Walk Fourteen') === 'Isha Walk Fourteen' && N('Photographs and flim') === 'Photographs and film');
  T('1.4 the SAME WORDS reordered offer', N('Walk Fourteen Isha') === 'Isha Walk Fourteen' && N('Album Walk P7') === 'Walk P7 Album');
  T('1.5 a DIFFERENT name does NOT offer: two letters off, a whole other name, a one-word name near nothing', N('Isha Walk Fourtn') === null && N('Isha Walk Fourtaan') === null && N('Nobody Walk Fourteen') === null && N('Gold') === null && N('Sharma') === null);
  T('1.6 TWO equally close offers NOTHING: "Kbir Walk Fourteen" against "Kabir Walk Fourteen" AND "Kbirr Walk Fourteen" both one edit away', N('Kbir Walk Fourteen', [...rows, { id: 'e', name: 'Kbirr Walk Fourteen' }]) === null && N('Kabr Walk Fourteen', [...rows, { id: 'e', name: 'Kabur Walk Fourteen' }]) === null);
  T('1.7 an EXACT match (any case) is never a candidate: the resolver already has it', N('isha walk fourteen') === null && N('Isha Walk Fourteen') === null);
  T('1.8 the distance is over key()-folded strings: case and outer spaces never count as an edit', N('  isha walk fourten ') === 'Isha Walk Fourteen');
  T('1.9 short names never offer (under three characters), so "Bo" cannot become "Bose"', N('Bo', [{ id: 'z', name: 'Bose' }]) === null && N('Bse', [{ id: 'z', name: 'Bose' }]) === 'Bose');
  T('1.10 the home is total: hostile rows and names return null, never throw', [undefined, null, 7, 'x', {}, [], [null], [{}], [{ name: 7 }], [{ name: null }]].every((r) => { try { return NN('Isha', r) === null && NN(r, rows) === null; } catch (_e) { return false; } }));

  // ─── §2 THE OFFER AT EACH LOOKUP ───────────────────────────────────────────────────────────
  sec('2 the offer: a lead for the money acts and the attach, a package for the attach; a note, nothing run');
  let db = seeded(); let r = await turn(db, 'The booking is confirmed for Isha Walk Fourten', req([money('booking_confirmed', 'Isha Walk Fourten')]));
  T('2.1 THE CARD: a misspelt LEAD on a booking: B36 with the row\'s own name, a note carrying the act with THAT name and the candidate\'s id, NOTHING staged, nothing written', r.reply === DYM('Isha Walk Fourteen') && r.out.why === 'offer_asked' && noteIn(db).asked === 'B36' && noteIn(db).acts[0].client_as_spoken === 'Isha Walk Fourteen' && noteIn(db).candidate_id === 'l-isha' && staged(db).length === 0 && lpsIn(db).length === 0);
  r = await turn(db, 'Yes', JSON.parse(NONE_JSON));
  T('2.2 THE CARD: YES runs the booking WITH THE CANDIDATE through the same plans: B2 from the row, ONE row STAGED, nothing applied; the note is gone', r.reply === B2ISHA && staged(db).length === 1 && staged(db)[0].state === 'staged' && staged(db)[0].request.lead_id === 'l-isha' && db.tables['public.leads'].find((l) => l.id === 'l-isha').state === 'new' && lastDoor(db).meta.listener.asked === 'B2' && noteOf(db) === undefined);
  r = await turn(db, 'No', JSON.parse(NONE_JSON));
  T('2.3 and her No to B2 declines it as today; money moved only by her second YES, never the first', r.reply === B3 && staged(db)[0].state === 'declined');
  db = seeded(); r = await turn(db, 'Attach Walk P7 Album to Isah Walk Fourteen', req([att('Isah Walk Fourteen', 'Walk P7 Album')]));
  T('2.4 a misspelt lead on an ATTACH: B36 (never B32), nothing attached', r.reply === DYM('Isha Walk Fourteen') && lpsIn(db).length === 0);
  r = await turn(db, 'YES', JSON.parse(NONE_JSON));
  T('2.5 YES then asks B26 for the handover package, the candidate\'s name from the row: one question leads to the next, still nothing written', r.reply === 'When is the delivery date for Isha Walk Fourteen?' && lpsIn(db).length === 0);
  db = seeded(); r = await turn(db, 'Attach Photograph and film to Kabir Walk Fourteen', req([att('Kabir Walk Fourteen', 'Photograph and film')]));
  T('2.6 THE CARD: a misspelt PACKAGE: B36 with the package\'s own name (never B23), nothing attached', r.reply === DYM('Photographs and film') && noteIn(db).slot === 'package' && lpsIn(db).length === 0);
  r = await turn(db, 'yes', JSON.parse(NONE_JSON));
  T('2.7 THE CARD: YES attaches THAT package: B22 from the row', r.reply === 'Package attached: Kabir Walk Fourteen · Photographs and film · Rs 80,000.' && lpsIn(db)[0].package_id === 'p-film');
  db = seeded(); r = await turn(db, 'The advance came in today for Isha Walk Fourteen', req([money('advance_paid', 'Isha Walk Fourteen', 'today')]));
  T('2.8 a name she DID say exactly passes the home untouched: no offer, B2 as always', r.keys === 'B2');
  db = seeded(); r = await turn(db, 'The booking is confirmed for Nobody Walk Fourteen', req([money('booking_confirmed', 'Nobody Walk Fourteen')]));
  T('2.9 THE CARD: a name near nothing: today\'s line unchanged, B4, no offer', r.keys === 'B4' && noteOf(db) === undefined);
  db = seeded(); r = await turn(db, 'Attach Gold to Kabir Walk Fourteen', req([att('Kabir Walk Fourteen', 'Gold')]));
  T('2.10 a package near nothing: B23 unchanged, the sorted list', r.keys === 'B23');
  db = seeded(); db.tables['public.leads'].push(leadRow({ id: 'l-isha2', name: 'Isha Walk Fourtee', wedding_date: '2027-03-05', wedding_date_precision: 'day' }));
  r = await turn(db, 'x', req([money('booking_confirmed', 'Isha Walk Fourtees')]));
  T('2.11 TWO of her rows equally close: NO offer, B4 as today', r.keys === 'B4');
  db = seeded(); r = await turn(db, 'The booking is confirmed for Isha Walk Fourten', req([money('booking_confirmed', 'Isha Walk Fourten')]));
  r = await turn(db, 'No', JSON.parse(NONE_JSON));
  T('2.12 THE CARD: NO is B3, decided before the listener; nothing staged, no note left', r.reply === B3 && r.out.why === 'note_declined' && staged(db).length === 0 && noteOf(db) === undefined);
  db = seeded(); await turn(db, 'x', req([money('booking_confirmed', 'Isha Walk Fourten')]));
  r = await turn(db, 'Raise the invoice for Walk45', req([{ act: 'invoice', client_as_spoken: 'Walk45' }]));
  T('2.13 another job typed after the question lapses it: the invoice made, nothing staged', r.keys === 'B13' && staged(db).length === 0);
  db = seeded(); await turn(db, 'x', req([money('booking_confirmed', 'Isha Walk Fourten')]));
  r = await turn(db, 'hmm', JSON.parse(NONE_JSON)); const t1 = noteIn(db).tries;
  const r2 = await turn(db, 'hmm', JSON.parse(NONE_JSON));
  T('2.14 an answer that is neither yes nor no: the question ONCE more (tries 1), then B3', r.reply === DYM('Isha Walk Fourteen') && t1 === 1 && r2.reply === B3);
  db = seeded(); db.tables['public.pending_money_acts'].push({ id: 'pm-1', vendor_id: V.id, act: 'booking_confirmed', request: { lead_id: 'l-isha', lead_name: 'Isha Walk Fourteen', kind: 'booking_confirmed' }, lane: 'pwa', state: 'staged', outcome: null, created_at: new Date(NOW - 60000).toISOString(), resolved_at: null, expires_at: new Date(NOW + 600000).toISOString() });
  r = await turn(db, 'The advance came in today for Isha Walk Fourten', req([money('advance_paid', 'Isha Walk Fourten', 'today')]));
  T('2.15 NEVER WHILE A MONEY ROW IS LIVE: with a staged booking waiting, a misspelt advance draws no offer (B4 as today); the row is stamped expired by her new message as F-44.58 always did, never applied', r.keys === 'B4' && staged(db)[0].state === 'expired' && db.tables['public.leads'].find((l) => l.id === 'l-isha').state === 'new');
  { const d = seeded(); await turn(d, 'x', req([money('booking_confirmed', 'Isha Walk Fourten')])); const row = lastDoor(d); T('2.16b (awaited): the row reads the question alone; the id lives in meta', row.content === DYM('Isha Walk Fourteen') && row.meta.listener.note.candidate_id === 'l-isha'); }

  // ─── §3 F-44.118 FROM THE RECORDS ──────────────────────────────────────────────────────────
  sec('3 F-44.118, the floor under money, scoped by R-44.41');
  T(`3.0 C-44.12: ${WALK_B} §3 and ${WALK_C} §3 hold both hearings verbatim`, src(WALK_B).includes(`    HEARD: ${BC1_JSON}\n`) && fs.existsSync(P(WALK_C)) && src(WALK_C).includes(`    HEARD: ${BC2_JSON}\n`));
  db = seeded(); db.tables['public.leads'].push(leadRow({ id: 'l-vik', name: 'Vikram Walk Twelve', wedding_date: '2027-01-03', wedding_date_precision: 'day' }));
  r = await turn(db, BC_SAID, JSON.parse(BC1_JSON));
  T('3.1 06:32:24 AS RECORDED: "The booking is confirmed" heard with "Vikram Walk Twelve" pasted on, a name he did not say: UNSAID, B35 asked (his walk read B5 about the wrong lead); nothing staged', r.reply === B35 && staged(db).length === 0 && noteIn(db).asked === 'B35');
  db = seeded(); db.tables['public.leads'].push(leadRow({ id: 'l-ravi', name: 'Ravi Walk Thirteen', wedding_date: '2027-03-05', wedding_date_precision: 'day' }));
  r = await turn(db, BC_SAID, JSON.parse(BC2_JSON));
  T('3.2 08:01:09 AS RECORDED: the same with "Ravi Walk Thirteen": B35', r.reply === B35 && staged(db).length === 0);
  db = seeded(); r = await turn(db, 'The booking is confirmed for Isha Walk Fourteen', req([money('booking_confirmed', 'Isha Walk Fourteen')]));
  T('3.3 a name she DID say, in her words, passes unchanged: B2 staged', r.keys === 'B2' && staged(db).length === 1);
  db = seeded(); r = await turn(db, 'confirmed for isha walk fourteen please', req([money('booking_confirmed', 'Isha Walk Fourteen')]));
  T('3.4 presence is under key(): her lower case against the ear\'s case still passes', r.keys === 'B2');
  db = seeded(); r = await turn(db, 'x', req([money('booking_confirmed', 'Isha Walk Fourteen')]));
  T('3.5 THE SCOPING, said plainly as the founder ruled it: a ONE-WORD message (the rungs\' placeholder shape) does not fire the floor; the name pasted on passes and B2 is staged', r.keys === 'B2');
  db = seeded(); r = await turn(db, 'Add a new lead, wedding on 5 March 2027', req([lead('Kabir Walk Fourteen', '5 March 2027')]));
  T('3.6 a LEAD with a pasted-on name is asked B18, and nothing is filed', r.reply === B18 && leadsIn(db).length === 0);
  db = seeded(); await turn(db, 'Attach Walk P7 Album to Isha Walk Fourteen', req([att('Isha Walk Fourteen', 'Walk P7 Album')]));
  r = await turn(db, '5 June 2027', req([att('Isha Walk Fourteen', 'Walk P7 Album', '5 June 2027')]));
  T('3.7 a turn ANSWERING A NOTE is never floored: the thread-carried name on her bare date is fine, the attach lands with the date', r.keys === 'B27');

  // ─── §4 THE CARD ───────────────────────────────────────────────────────────────────────────
  sec('4 every SAY line on the third B-2 cut\'s walk card, in ONE thread and one database');
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
      await quiet(() => lane.processVendorInbound({ phone: '+919888294440', body: o.message, profileName: 'Dev', messageSid: `wamid.b99.${Math.random()}`, internalReplay: false, trimmedBody: o.message.trim(), numMedia: 0, hasMedia: false, mediaUrl: null, rawPayload: {} }, deps));
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
    const c1 = await turn(d, 'Add a new lead Isha Walk Fourteen, wedding on 5 March 2027', req([lead('Isha Walk Fourteen', '5 March 2027')]));
    const c2 = await turn(d, 'Attach Photograph and film to Isha Walk Fourteen', req([att('Isha Walk Fourteen', 'Photograph and film')]));
    const c3 = await turn(d, 'Yes', JSON.parse(NONE_JSON));
    T('4.1 SAY "Add a new lead Isha Walk Fourteen, wedding on 5 March 2027"; "Attach Photograph and film to Isha Walk Fourteen" (one letter off); "Yes": filed; "Did you mean Photographs and film? Reply YES or NO."; "Package attached: Isha Walk Fourteen · Photographs and film · Rs 80,000."', c1.keys === 'B17' && c2.reply === DYM('Photographs and film') && c3.reply === 'Package attached: Isha Walk Fourteen · Photographs and film · Rs 80,000.');
    const c4 = await turn(d, 'The booking is confirmed for Isha Walk Fourten', req([money('booking_confirmed', 'Isha Walk Fourten')]));
    const c5 = await turn(d, 'Yes', JSON.parse(NONE_JSON));
    const c6 = await turn(d, 'No', JSON.parse(NONE_JSON));
    T('4.2 SAY "The booking is confirmed for Isha Walk Fourten" (one letter off); "Yes"; "No": "Did you mean Isha Walk Fourteen? Reply YES or NO."; "Confirm this booking? Isha Walk Fourteen · Photographs and film · Rs 80,000. Reply YES or NO."; B3; the row declined, Isha still new', c4.reply === DYM('Isha Walk Fourteen') && c5.reply === B2ISHA && c6.reply === B3 && staged(d)[0].state === 'declined' && d.tables['public.leads'][0].state === 'new');
    const c7 = await turn(d, 'The booking is confirmed for Nobody Walk Fourteen', req([money('booking_confirmed', 'Nobody Walk Fourteen')]));
    T('4.3 SAY "The booking is confirmed for Nobody Walk Fourteen" (near nothing): "Could not confirm the booking. No lead called Nobody Walk Fourteen. Add the lead first." and NO offer', c7.reply === 'Could not confirm the booking. No lead called Nobody Walk Fourteen. Add the lead first.');
    const c8 = await turn(d, 'Attach Walk P7 Album to Isah Walk Fourteen', req([att('Isah Walk Fourteen', 'Walk P7 Album')]));
    const c9 = await turn(d, 'No', JSON.parse(NONE_JSON));
    T('4.4 SAY "Attach Walk P7 Album to Isah Walk Fourteen" (two letters swapped); "No": "Did you mean Isha Walk Fourteen? Reply YES or NO."; B3; nothing attached', c8.reply === DYM('Isha Walk Fourteen') && c9.reply === B3 && lpsIn(d).length === 1);
    const c10 = await turn(d, BC_SAID, req([money('booking_confirmed', 'Isha Walk Fourteen')]));
    const c11 = await turn(d, 'No', JSON.parse(NONE_JSON));
    T('4.5 SAY "The booking is confirmed" (whatever name the ear pastes on: here Isha, from the thread): the floor asks B35; "No": B3', c10.reply === B35 && c11.reply === B3 && staged(d).length === 1);
    const c12 = await driveWA({ db: d, message: 'The advance came in today for Isha Walk Fourten', request: req([money('advance_paid', 'Isha Walk Fourten', 'today')]) });
    const c13 = await driveWA({ db: d, message: 'No', request: JSON.parse(NONE_JSON) });
    T('4.6 ON WHATSAPP, SAY "The advance came in today for Isha Walk Fourten"; "No": the question, then B3; the chain never called; still one money row', one(c12) === DYM('Isha Walk Fourteen') && one(c13) === B3 && staged(d).length === 1);
    const rows2 = d.tables['engine.messages'].filter((m) => m.role === 'assistant');
    T('4.7 the thread holds the card: thirteen turns, every one answered by code, the last two on whatsapp', rows2.length === 13 && rows2.every((m) => m.meta.listener.door === true) && rows2.slice(-2).every((m) => m.meta.listener.lane === 'whatsapp'));
  }

  // ─── §5 W-1 ───────────────────────────────────────────────────────────────────────────────
  sec('5 W-1 NONE, read from this packet\'s own manifest');
  const man = fs.existsSync(P(MAN)) ? src(MAN).split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#')) : [];
  T('5.1 W-1 NONE: no path under src/engine, no soul, lens or prompt file, no migration', man.length > 0 && man.every((p) => !/^src\/engine\/|soul|lens|^db\/migrations\//.test(p)));
  T('5.2 the manifest names exactly the eleven paths this packet touches (C-44.7)', JSON.stringify(man.slice().sort()) === JSON.stringify([WALK_C, MAN, 'scripts/b99_lcv10_didyoumean_bench.js', 'scripts/b98_lcv10_package_bench.js', 'scripts/b97_lcv10_name_bench.js', 'scripts/b96_lcv10_fix_bench.js', 'scripts/b95_lcv10_note_bench.js', 'scripts/b93_lcv9_chain_out_bench.js', 'scripts/b92_lcv_p6a_bench.js', 'scripts/b90_lcv_p5_bench.js', 'src/lib/vendor/doorLines.js', WDf].sort()));
  T('5.3 ONE vendor byte added, B36, his; LINES holds 41 (38 then; B37 to B39 since P6b, CE-45 LCV-11); the home is nearestName, called from exactly one offer helper', Object.keys(DL.LINES).length === 75 /* RE-PINNED (CE-45 LCV-14, P7 cut 4, labelled): 75 since B69 to B74, B78, B79, his (ASK 7: each form its own key); b108 holds them */ /* RE-PINNED (CE-45 LCV-14, P7 cut 3, labelled): 67 since B56 to B62, B67, B68, his (B60 carried, unspoken); b106 holds them */ /* P7 2b (CE-45 LCV-13, labelled): six of his joined, b105 */ /* P7 2a: eleven of his joined, b104 */ && (src(WDf).replace(/^\s*\/\/.*$/gm, '').match(/nearestName\(/g) || []).length === 2);
  T('5.4 e-72\'s cure rides here: b96 1.10 and 6.1 no longer print a reading in a cell\'s name', !/\$\{ms\} ms/.test(src('scripts/b96_lcv10_fix_bench.js')) && !/\$\{Date\.now\(\) - t0\} ms/.test(src('scripts/b96_lcv10_fix_bench.js')));

  // ─── §6 FUZZ ───────────────────────────────────────────────────────────────────────────────
  sec('6 fuzz');
  const boom = () => { throw new Error('hostile'); };
  const trap = new Proxy({}, { get: boom, has: boom, ownKeys: boom, getOwnPropertyDescriptor: boom });
  const HS = [undefined, null, 0, '', 'x', [], {}, trap, { asked: 'B36' }, { asked: 'B36', acts: [money('booking_confirmed', 'A')] }, { asked: 'B36', acts: [money('booking_confirmed', 'A')], candidate_id: 7 }, { asked: 'B36', acts: [money('booking_confirmed')], candidate_id: 'l-isha' }, { asked: 'B36', acts: [{ act: 'edit_event' }], candidate_id: 'l-isha' } /* P7 2a re-aim: edit_event is the uncovered act now (block_date is covered) */, { asked: 'B36', acts: [money('booking_confirmed', 'Isha Walk Fourteen')], candidate_id: 'l-isha' }, { asked: 'B36', acts: [trap], candidate_id: 'l-isha' }];
  let t6 = 0; let ok6 = 0;
  for (const a of HS) { try { const v = WD.validNote(a); if (v) { ok6 += 1; if (typeof v.candidate_id !== 'string') t6 += 1; } } catch (_e) { t6 += 1; } }
  T(`6.1 validNote on ${HS.length} hostile offer notes: ZERO throws; it accepts only a B36 note over named covered acts with a candidate id (${ok6} accepted)`, t6 === 0 && ok6 === 1);
  let t7 = 0;
  for (const a of HS) { const d = seeded(); let m = a; if (a === trap) m = undefined; d.tables['engine.messages'].push({ id: 'h', conversation_id: 'c-1', role: 'assistant', content: 'q', meta: { listener: { door: true, note: m } }, created_at: new Date(clock += 1000).toISOString() });
    try { const o = await quiet(() => WD.preTurn({ supabase: d, vendor: V, agentId: AG, route: ROUTE, message: 'Yes', lane: 'pwa' }, { llmCreate: earOf(JSON.parse(NONE_JSON)), nowMs: NOW })); if (!o || typeof o.door !== 'boolean') t7 += 1; if (staged(d).length && !WD.validNote(m)) t7 += 1; } catch (_e) { t7 += 1; } }
  T(`6.2 "Yes" over a hostile offer note (${HS.length} shapes): ZERO throws, a verdict always, an ill-formed note never stages`, t7 === 0);
  let t8 = 0; const HN = ['', ' ', 'x'.repeat(5000), '\u0000', '٥', trap, null, undefined, 7, [], {}];
  for (const a of HN) for (const b of [rows, [{ id: 1, name: 'x'.repeat(5000) }], [trap], null]) { try { NN(a, b); if (typeof a === 'string') (WD.damerau1 || (() => { throw new Error('no damerau1'); }))(a, 'abc'); } catch (_e) { t8 += 1; } }
  T(`6.3 nearestName and damerau1 on ${HN.length * 4} hostile pairs, 5,000-character strings among them: ZERO throws`, t8 === 0);

  // ─── §7 MUTATIONS ──────────────────────────────────────────────────────────────────────────
  sec('7 mutations of production code, each reddening its cell');
  const flow = async (rq, steps, seedFn) => { const M = rq(WDf); const d = seedFn ? seedFn() : seeded(); const out = []; for (const [m, q] of steps) out.push(await turn(d, m, q, 'pwa', M)); return { out, d }; };
  await mut('7.1 M1 the distance widened to TWO edits: a whole other name is offered (reddens 1.5)', WDf,
    [['  if (Math.abs(la - lb) > 1 || Math.max(la, lb) < 3) return false;\n  if (la === lb) {\n    const diff = []; for (let i = 0; i < la; i += 1) if (a[i] !== b[i]) diff.push(i);\n    if (diff.length === 1) return true;', '  if (Math.abs(la - lb) > 1 || Math.max(la, lb) < 3) return false;\n  if (la === lb) {\n    const diff = []; for (let i = 0; i < la; i += 1) if (a[i] !== b[i]) diff.push(i);\n    if (diff.length <= 2) return true;']], [],
    async (rq) => (rq(WDf).nearestName || (() => null))('Isha Walk Fourtaan', rows), (c) => c !== null);
  await mut('7.2 M2 two equally close no longer NONE: the first is offered (reddens 1.6, 2.11)', WDf,
    [['    return close.length === 1 ? close[0] : null;', '    return close.length >= 1 ? close[0] : null;']], [],
    async (rq) => (rq(WDf).nearestName || (() => null))('Kbir Walk Fourteen', [...rows, { id: 'e', name: 'Kbir Walk Fourteen' }]), (c) => c !== null);
  await mut('7.3 M3 THE OFFER ACTING INSTEAD OF ASKING: the misspelt booking is staged at once with the candidate (reddens 2.1)', WDf,
    // ANCHOR RE-AIMED (CE-45 LCV-11, the P6b fix cut, F-44.123): the offer's return line gained her original message; what M3 proves is unchanged.
    [["        return { door: true, reply: line, keys: ['B36'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, note: { asked: 'B36', acts: [filled], tries: 0, candidate_id: String(c.id), slot, ...(original ? { said: original } : {}) }, why: 'offer_asked' };", '        fromNote = { route: "task", acts: [filled] }; return null;']], [],
    async (rq) => flow(rq, [['x', req([money('booking_confirmed', 'Isha Walk Fourten')])]]), (x) => x.out[0].keys !== 'B36');
  await mut('7.4 M4 YES applying the money instead of staging it (the chair\'s pin, as b95 9.9): reddens 2.2', WDf,
    [['        try { row = await pma.stage(supabase, { vendorId: vendor.id, act: moneyPlan.stage.act, request: moneyPlan.stage.request, lane }); }', "        try { (supabase.tables['public.leads'].find((l) => l.id === moneyPlan.stage.request.lead_id) || {}).state = 'booked'; row = { id: 'applied' }; }"]], [],
    async (rq) => flow(rq, [['x', req([money('booking_confirmed', 'Isha Walk Fourten')])], ['Yes', JSON.parse(NONE_JSON)]]), (x) => staged(x.d).length === 0 && x.d.tables['public.leads'].find((l) => l.id === 'l-isha').state === 'booked');
  await mut('7.5 M5 the offer spoken while a money row is LIVE (reddens 2.15)', WDf,
    [["      if (moneyPlan.key === 'B4' && !liveAtStart && !fromNote)", "      if (moneyPlan.key === 'B4' && !fromNote)"]], [],
    async (rq) => flow(rq, [['x', req([money('advance_paid', 'Isha Walk Fourten', 'today')])]], () => { const d = seeded(); d.tables['public.pending_money_acts'].push({ id: 'pm-1', vendor_id: V.id, act: 'booking_confirmed', request: { lead_id: 'l-isha', lead_name: 'Isha Walk Fourteen', kind: 'booking_confirmed' }, lane: 'pwa', state: 'staged', outcome: null, created_at: new Date(NOW - 60000).toISOString(), resolved_at: null, expires_at: new Date(NOW + 600000).toISOString() }); return d; }), (x) => x.out[0].keys === 'B36');
  await mut('7.6 M6 the floor removed: 06:32:24 as recorded reads B5 about the wrong lead again (reddens 3.1, 3.2, 4.5)', WDf,
    [['    if (saidKey.split(/\\s+/).filter(Boolean).length >= 2) {', '    if (false) {']], [],
    async (rq) => flow(rq, [[BC_SAID, JSON.parse(BC1_JSON)]], () => { const d = seeded(); d.tables['public.leads'].push(leadRow({ id: 'l-vik', name: 'Vikram Walk Twelve', wedding_date: '2027-01-03', wedding_date_precision: 'day' })); return d; }), (x) => x.out[0].keys === 'B5');
  await mut('7.7 M7 the floor fired on a NOTE turn too: her bare date after B26 loses its thread-carried name and the attach never lands (reddens 3.7)', WDf,
    [['    { const ask = askName(heard, 0); if (ask) return ask; }\n    if (!allCovered(heard))', "    { const ask = askName(heard, 0); if (ask) return ask; }\n    if (fromNote) { heard = { ...heard, acts: heard.acts.map((a) => (({ client_as_spoken: _c, ...rest }) => rest)(a)) }; }\n    if (!allCovered(heard))"]], [],
    async (rq) => flow(rq, [['Attach Walk P7 Album to Isha Walk Fourteen', req([att('Isha Walk Fourteen', 'Walk P7 Album')])], ['5 June 2027', req([att('Isha Walk Fourteen', 'Walk P7 Album', '5 June 2027')])]]), (x) => x.out[1].keys === 'B27');
  await mut('7.8 M8 the note carrying HER misspelling instead of the candidate\'s row name: YES then reads B4 (reddens 2.2)', WDf,
    [["        const filled = { ...act, [slotField(slot)]: String(c.name).trim() };", '        const filled = { ...act };']] /* anchor RE-AIMED (CE-45 LCV-14, P7 cut 3, labelled): the slot is three-way through slotField; the mutation is the same (the candidate's name not placed) */, [],
    async (rq) => flow(rq, [['x', req([money('booking_confirmed', 'Isha Walk Fourten')])], ['Yes', JSON.parse(NONE_JSON)]]), (x) => x.out[1].keys === 'B4');

  console.log(`\n════════  b99 · ${pass} pass · ${fail} fail  ════════`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`  · ${f}`)); }
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('b99 CRASHED:', (e && e.stack) || e); process.exit(2); });
