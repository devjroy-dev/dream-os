'use strict';
// scripts/b93_lcv9_chain_out_bench.js · TDW CE-44 · LCV-9 · PART ONE: THE CHAIN LEAVES THE WORKING ROOMS. Rung b93.
//
// R-44.37 (the founder, 21 September 2026): "listen- theres no point in waiting for victor ( stop gap arrangement)---why
// dont we shift victor out and then allow the code to work. faster and more efficient that way". R-44.38: B34 is his.
// The chair's ruling on the FOURTEEN exits of workingDoor.preTurn, exit by exit, is what §3 holds.
//
//  §1 the bytes: B15 (R-44.27), B32 (R-44.36), B34 (R-44.38) VERBATIM, each hash a literal HERE; B31, B33, B35 free.
//  §2 the example table and the ONE builder: only examples whose act is COVERED are ever shown, over many draws.
//  §3 standIn(), exit by exit, through the REAL preTurn: each of the fourteen exits speaks the byte ruled for it;
//     B34 is never spoken when no act was heard and LEFTOVER never when an uncovered one was.
//  §4 THE SWITCH: absent, junk, and a FAILED READ are all CHAIN OUT; only JSON true is chain in (standIn null).
//  §5 THE WHATSAPP LANE, the REAL processVendorInbound with runTurn SPIED: zero turns on every exit in every
//     chain-out position; chain in, exactly one turn; the line she is sent is the ruled byte.
//  §6 THE PWA ROUTES, the REAL chat.js POST handler (JSON and SSE) with engine/dist/core/loop's runTurn SPIED: the
//     same, and THE ADVISOR ROOM REACHES THE CHAIN IN EITHER POSITION.
//  §7 a stand-in turn writes nothing, carries no chip, skips harvest, and is persisted as ONE door turn.
//  §8 the one-read pins (b90 1.5's reversal, held here too) and W-1 from this packet's own manifest.
//  5.6 and 6.7: the leftover reply's EXACT bytes under a fixed seed, on both lanes (the layout cannot drift).
//  §9 fuzz: standIn, standKey and leftover in EVERY argument position, the verdict itself hostile. Zero throws.
//  §10 mutations of production code, each reddening its cell. A missing anchor FAILS the cell.
// EVERY SAY LINE ON PART ONE'S WALK CARD IS A CELL (§11), driven in one thread on the real lane.
// THE EXIT CODE IS THE VERDICT.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const MAN = 'scripts/floor-manifest-ce44-lcv9-part1.txt';
let pass = 0; let fail = 0; const failed = [];
function T(name, cond) { if (cond) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}`); } }
const sec = (t) => console.log(`\n§${t}`);
const quiet = async (fn) => { const w = console.warn; const e = console.error; const l = console.log; console.warn = () => {}; console.error = () => {}; console.log = () => {}; try { return await fn(); } finally { console.warn = w; console.error = e; console.log = l; } };
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const src = (rel) => fs.readFileSync(P(rel), 'utf8');

const WDP = P('src/lib/vendor/workingDoor.js');
const VIP = P('src/lib/vendorInbound.js');
const CJP = P('src/api/vendor-engine/chat.js');
const LFP = P('src/lib/laneFlags.js');
const LOOP = P('src/engine/dist/core/loop.js');

// ── an in-memory database (b92's shape). admin_config is a real table of it, so the switch is read as production reads it.
let clock = Date.parse('2026-09-21T05:00:00Z');
function makeDb(seed, opts) {
  const tables = JSON.parse(JSON.stringify(seed || {}));
  const log = { inserts: [], updates: [] };
  let seq = 0;
  const o = opts || {};
  const builder = (schema, name) => {
    const full = `${schema}.${name}`;
    if (o.failRead && o.failRead.includes(full)) throw new Error(`read of ${full} failed`);
    const f = []; let mode = 'select'; let payload = null; let limitN = null; let orderBy = null;
    const rows = () => (tables[full] || []);
    const run = () => {
      if (o.errorRead && o.errorRead.includes(full) && mode === 'select') return { data: null, error: { message: 'down' } };
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
const NOW = Date.parse('2026-09-21T06:00:00Z');
const ROUTE = { provider: 'anthropic', model: 'm-primary', listener_provider: 'anthropic', listener_model: 'm-listen' };
const FLAG = 'vendor.working_chain_enabled';
// public.admin_config, ALL 4 columns (docs/db/PUBLIC_SCHEMA.md, "public.admin_config · 4 columns"): value is TEXT with JSON inside.
const flagRow = (value) => ({ key: FLAG, value, description: null, updated_at: '2026-09-21T00:00:00Z' });
function leadRow(o) {
  return Object.assign({
    id: null, vendor_id: V.id, name: null, phone: null, email: null, wedding_date: null, wedding_city: null, event_types: null,
    budget_min: null, budget_max: null, source: 'self', referrer_name: null, state: 'new', raw_message: null, notes: null,
    created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', client_id: null, deleted_at: null, vendor_summary: null,
    intent_summary: null, intent_summary_at: null, wedding_date_precision: null, function_count: null, wedding_days: null,
    functions: null, draft_meta: null, wedding_id: null, binder_id: null,
  }, o);
}
const pkg = (o) => Object.assign({ id: null, vendor_id: V.id, name: null, total: 80000, delivery_basis: 'days', deleted_at: null }, o);
function world(flagValue) {
  return {
    'public.admin_config': flagValue === undefined ? [] : [flagRow(flagValue)],
    'public.leads': [leadRow({ id: 'l-dated', name: 'Walk P8 Dated', wedding_date: '2027-02-20', wedding_date_precision: 'day' }),
      leadRow({ id: 'l-t1', name: 'Triple' }), leadRow({ id: 'l-t2', name: 'Triple' }), leadRow({ id: 'l-t3', name: 'Triple' })],
    'public.vendor_packages': [pkg({ id: 'p-film', name: 'Photographs and film' }), pkg({ id: 'p-3a', name: 'Tri' }), pkg({ id: 'p-3b', name: 'Tri' }), pkg({ id: 'p-3c', name: 'Tri' })],
    'public.clients': [], 'public.lead_packages': [], 'public.invoices': [], 'public.pending_money_acts': [], 'public.payment_schedules': [],
    'engine.records': [{ id: 'b-walk', agent_id: AG, client: 'Walk45', amount: 50000, amount_received: 0, hidden: false, date: '2026-09-25' }],
    'engine.conversations': [{ id: 'c-1', agent_id: AG, state: 'active', last_active_at: '2026-09-21T05:00:00Z' }],
    'engine.messages': [],
  };
}
const req = (acts, route = 'task') => ({ route, acts });
const earOf = (request) => async () => ({ content: [{ type: 'tool_use', name: 'ear_request', input: request }], usage: { input_tokens: 1400, output_tokens: 50 } });
const earFails = async () => { throw new Error('provider down'); };
const earNoCall = async () => ({ content: [{ type: 'text', text: 'hello' }], usage: { input_tokens: 1, output_tokens: 1 } });
const writes = (db) => db.log.inserts.filter((i) => !/^public\.admin_config$/.test(i.table)).length + db.log.updates.length;

// THE FOURTEEN EXITS, each with the message, what the listener hears, the byte the chair ruled, and how the exit is reached.
// `expect` is a function of the modules so the byte is read from its ONE home.
function exits(DL, LH, GLITCH) {
  const isLeft = (r) => typeof r === 'string' && r.split('\n')[0] === DL.LINES.LEFTOVER;
  return [
    { why: 'no_input', message: '   ', ear: earOf(req([])), is: (r) => r === GLITCH, byte: 'GLITCH' },
    { why: 'no_lane', message: 'hello', lane: 'sms', ear: earOf(req([])), is: (r) => r === GLITCH, byte: 'GLITCH', directOnly: true },
    { why: 'yes_no_nothing_waiting', message: 'yes', ear: earOf(req([])), is: isLeft, byte: 'LEFTOVER' },
    { why: 'no_seat', message: 'hello', route: {}, ear: earOf(req([])), is: (r) => r === GLITCH, byte: 'GLITCH' },
    { why: 'no_request', message: 'Block 20 March, personal', ear: earFails, is: (r) => r === GLITCH, byte: 'GLITCH', label: 'the listener FAILED' },
    { why: 'no_request', message: 'Block 20 March, personal', ear: earNoCall, is: (r) => r === GLITCH, byte: 'GLITCH', label: 'the listener returned no tool call' },
    { why: 'uncovered', message: 'Hello', ear: earOf(req([], 'none')), is: isLeft, byte: 'LEFTOVER', label: 'NO ACT heard (a greeting)' },
    // ROWS RE-AIMED (CE-45 LCV-12, P7 cut 2a): block_date is the DOOR'S since 2a (b104 holds it); the act the door has not learnt is assign_crew, cut three's;
    // a lookup on route 'search' now exits 'lookup' (F-44.128) and reads B34 until cut four; two exits join: book_no_lead (B76, his) and calendar_unsayable (GLITCH).
    // ROWS RE-AIMED AGAIN (CE-45 LCV-14, P7 cut 3, labelled): assign_crew is the DOOR'S since cut 3 (b106 holds it); the act no cut covers is `note`. Two exits join:
    // team_unsayable (GLITCH: the team rows unreadable) and assign_many (B34: a day holding two shoots and no client names no one shoot; directOnly, its rows seeded).
    { why: 'uncovered', message: 'Note that Walk P8 Crew needs a van on 20 March', ear: earOf(req([{ act: 'note', date_as_spoken: '20 March' }])), is: (r) => r === DL.LINES.B34, byte: 'B34', label: 'an act the door does not cover' },
    { why: 'team_unsayable', message: 'Add Walk P8 Crew to the team', ear: earOf(req([{ act: 'assign_crew', member_as_spoken: 'Walk P8 Crew' }])), is: (r) => r === GLITCH, byte: 'GLITCH', label: 'the team rows unreadable', dbOpts: { errorRead: ['public.team_members'] } },
    { why: 'assign_many', message: 'Assign Walk P8 Crew to the 20 March 2027 shoot', ear: earOf(req([{ act: 'assign_crew', member_as_spoken: 'Walk P8 Crew', date_as_spoken: '20 March 2027' }])), is: (r) => r === DL.LINES.B34, byte: 'B34', label: 'two shoots that day, no client', directOnly: true,
      seed: (w) => { w['public.events'] = [1, 2].map((i) => ({ id: `e0000000-0000-4000-8000-00000000000${i}`, vendor_id: V.id, title: `Walk P8 Shoot ${i}`, event_date: '2027-03-20', kind: 'shoot', state: 'upcoming', deleted_at: null, assigned_member_ids: [], linked_lead_id: null })); return w; } },
    // ROW RE-AIMED (CE-45 LCV-14, P7 cut 4, labelled): whatsdue on route search is ANSWERED since cut 4 (b108 holds it); 'lookup' now exits only for a lookup
    // the door does not answer: tally (R-45.11's table, 8 of 8 whatsdue), history, a client named. And one exit joins: lookup_unsayable, a lookup's read failing.
    // ROW RE-AIMED AGAIN (CE-45 LCV-14, P7 cut 4 fix, labelled): tally with no client is ANSWERED since the fix (B80, b109); the lookup the door does not answer is history.
    { why: 'lookup', message: 'What happened with the Walk P8 Dated booking?', ear: earOf(req([{ act: 'history', client_as_spoken: 'Walk P8 Dated' }], 'search')), is: (r) => r === DL.LINES.B34, byte: 'B34', label: 'a lookup the door does not answer (history), since cut four' },
    { why: 'lookup_unsayable', message: 'Who are my new leads?', ear: earOf(req([{ act: 'find' }], 'search')), is: (r) => r === GLITCH, byte: 'GLITCH', label: 'the new leads unreadable (a failed read is never "No new leads.")', dbOpts: { errorRead: ['public.leads'] } },
    { why: 'book_no_lead', message: 'Book the Walk P8 Nolead shoot on 20 March 2027', ear: earOf(req([{ act: 'book_event', client_as_spoken: 'Walk P8 Nolead', date_as_spoken: '20 March 2027' }])), is: (r) => r === 'No lead called Walk P8 Nolead. Add the lead first.', byte: 'B76', label: 'a booking for a name that is no lead (B76, his)' },
    { why: 'calendar_unsayable', message: 'Book the Walk P8 Dated shoot on 20 March 2027', ear: earOf(req([{ act: 'book_event', client_as_spoken: 'Walk P8 Dated', date_as_spoken: '20 March 2027' }])), deps: { lifecycle: { ...LH, resolveLead: async () => { throw new Error('read failed'); } } }, is: (r) => r === GLITCH, byte: 'GLITCH', label: 'a calendar act the door cannot read (the leads read throws)' },
    // ADDED (CE-45 LCV-13, P7 cut 2b, labelled): a move asked beside another act is one question too many; B34, nothing written
    { why: 'cal_mixed', message: 'Block 20 March 2027 and move the Walk P8 Dated shoot to 22 November 2027', ear: earOf(req([{ act: 'block_date', date_as_spoken: '20 March 2027' }, { act: 'edit_event', client_as_spoken: 'Walk P8 Dated', date_as_spoken: '22 November 2027' }])), is: (r) => r === DL.LINES.B34, byte: 'B34', label: 'a move beside another act (P7 2b, one question at a time)' },
    // ROW RE-AIMED (CE-45 LCV-11, P6b first cut): relay is the DOOR'S since P6b (b101 holds it); the act the door has not learnt is quote_send, the second cut's.
    { why: 'uncovered', message: 'Send Walk P8 Dated a quote', ear: earOf(req([{ act: 'quote_send', client_as_spoken: 'Walk P8 Dated' }])), is: (r) => r === DL.LINES.B34, byte: 'B34', label: 'quote_send (the second P6b cut; relay is covered since the first)' },
    { why: 'uncovered', message: 'Add a lead Walk P8 Mixed and note that Walk P8 Crew needs a van', ear: earOf(req([{ act: 'lead', client_as_spoken: 'Walk P8 Mixed' }, { act: 'note' }])), is: (r) => r === DL.LINES.B34, byte: 'B34', label: 'a MIXED message: a covered act beside an uncovered one' },
    // ROW REMOVED (CE-44 LCV-10 PART B-2, first cut): a covered act naming NO client is now the DOOR'S turn (B35, R-44.39), not an exit; b97 §2 holds it, on this lane too.
    // ROW RE-AIMED (CE-45 LCV-11, P6b first cut; F-44.96's second half): one phone-shaped run is read by the door itself and filed; the exit survives ONLY for TWO runs with no slot.
    { why: 'lead_phone', message: 'Add a new lead Walk P8 Phone, 9876543210 or 9876543211', ear: earOf(req([{ act: 'lead', client_as_spoken: 'Walk P8 Phone' }])), is: (r) => r === DL.LINES.B34, byte: 'B34', label: 'TWO phone-shaped runs, no slot: the door does not guess' },
    // ROW ADDED (CE-45 LCV-11, P6b): relay_unsayable, a relay whose lead rows cannot be read; the glitch line, nothing written.
    // ROW ADDED (CE-45 LCV-11, P6b first cut): relay_pwa, a relay on the pwa lane, the second cut's; B34 as before, nothing written.
    // Both relay rows are directOnly: each exists on ONE lane only (relay_pwa on the pwa lane, relay_unsayable on the WhatsApp lane), so §5/§6's both-lanes drive would read a different exit on the other lane.
    { why: 'relay_pwa', message: 'Tell Walk P8 Dated hello', lane: 'pwa', ear: earOf(req([{ act: 'relay', client_as_spoken: 'Walk P8 Dated' }])), is: (r) => r === DL.LINES.B34, byte: 'B34', label: 'the pwa lane, the second cut\'s', directOnly: true },
    { why: 'relay_unsayable', message: 'Tell Walk P8 Dated hello', lane: 'whatsapp', ear: earOf(req([{ act: 'relay', client_as_spoken: 'Walk P8 Dated' }])), is: (r) => r === GLITCH, byte: 'GLITCH', label: 'the lead rows unreadable', dbOpts: { errorRead: ['public.leads'] }, directOnly: true },
    { why: 'attach_unsayable', message: 'Attach Tri to Walk P8 Dated', ear: earOf(req([{ act: 'attach_package', client_as_spoken: 'Walk P8 Dated', package_as_spoken: 'Tri' }])), is: (r) => r === DL.LINES.B30, byte: 'B30', label: 'three packages of one name' },
    // ROW RE-AIMED (CE-44 LCV-10 PART B-2, second cut): no package named is now the door's B31; this exit is driven by a lead the door cannot resolve with NO package in the rows at all (packagesOf null), still attach_unsayable.
    { why: 'attach_unsayable', message: 'Attach a package to Walk P8 Dated', ear: earOf(req([{ act: 'attach_package', client_as_spoken: 'Walk P8 Dated', package_as_spoken: 'Gold' }])), is: (r) => r === DL.LINES.B30, byte: 'B30', label: 'the package rows unreadable (the resolver returns nothing)', dbOpts: { errorRead: ['public.vendor_packages'] } },
    // ROW RE-AIMED (the third B-2 cut): 'Walk P8 Datd' is one letter from 'Walk P8 Dated' and now draws R-44.40's offer; this exit is driven by a name near nothing.
    { why: 'attach_no_lead', message: 'Attach Photographs and film to Walk P8 Nobody Here', ear: earOf(req([{ act: 'attach_package', client_as_spoken: 'Walk P8 Nobody Here', package_as_spoken: 'Photographs and film' }])), is: (r) => r === 'Could not attach the package. No lead called Walk P8 Nobody Here. Add the lead first.', byte: 'B32' },
    { why: 'invoice_unresolved', message: 'Raise the invoice for Nobody Here', ear: earOf(req([{ act: 'invoice', client_as_spoken: 'Nobody Here' }])), is: (r) => r === 'Could not make the invoice. No client called Nobody Here.', byte: 'B15', label: 'no binder: B15' },
    { why: 'invoice_unresolved', message: 'Raise the invoice for Walk45', ear: earOf(req([{ act: 'invoice', client_as_spoken: 'Walk45' }])), dbOpts: { errorRead: ['engine.records'] }, is: (r) => r === GLITCH, byte: 'GLITCH', label: 'a FAILED read is not a name that does not exist' },
    { why: 'money_unsayable', message: 'Triple is confirmed', ear: earOf(req([{ act: 'booking_confirmed', client_as_spoken: 'Triple' }])), is: (r) => r === LH.LINES.F29, byte: 'F29', label: 'three leads of one name, a booking' },
    { why: 'exception', message: 'Add a lead Walk P8 Boom', ear: earOf(req([{ act: 'lead', client_as_spoken: 'Walk P8 Boom' }])), deps: { pma: { liveRow: async () => { throw new Error('pma down'); } } }, is: (r) => r === GLITCH, byte: 'GLITCH' },
  ];
}

// ── mutation (b90's harness): an anchor that is missing THROWS, and the cell that ran it FAILS ──
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
  const DL = require(P('src/lib/vendor/doorLines.js'));
  const WD = require(WDP);
  const LH = require(P('src/lib/vendor/lifecycleHands.js'));
  const LF = require(LFP);
  const GLITCH = require(CJP).STAGE2_LINE_MUTATION;
  const EX = exits(DL, LH, GLITCH);

  // ─── §1 ───────────────────────────────────────────────────────────────────────────────────
  sec('1 the bytes, verbatim, each hash a literal here');
  const RULED = {
    B15: ['Could not make the invoice. No client called {name}.', 'f5a96043bb86272066b085f699a88d0aa4adbeb04871d6b95ea59e7f56db5ab0'],
    B32: ['Could not attach the package. No lead called {name}. Add the lead first.', '136ff0b0c57e5145267570a25752ed723c9f1fad59eca74ee37e884d1607a704'],
    B34: ['I cannot do that by message yet. Use the app for it.', '3dc0787ed3e775e75d9d838cf0a87f7ef66d43e499fa665c107a466dfa76b4eb'],
  };
  for (const k of Object.keys(RULED)) T(`1.1 ${k} is the founder's byte verbatim and its hash is the literal pinned here`, DL.LINES[k] === RULED[k][0] && sha(RULED[k][0]) === RULED[k][1] && DL.LINE_HASHES[k] === RULED[k][1]);
  T('1.1b B15 is R-44.27\'s byte as TDW_CE44_LCV3_SEAT_CLOSE.md :77 records it', /`Could not make the invoice\. No client called \{name\}\.`/.test(src('docs/handovers/TDW_CE44_LCV3_SEAT_CLOSE.md')));
  // 1.2 RE-PINNED (CE-44 LCV-10 PART B-2, first cut): B35 is his (R-44.39) and present; B31 and B33 are still free until B-2's second cut.
  // 1.2 RE-PINNED AGAIN (CE-44 LCV-10 PART B-2, second cut): B31 and B33 are his too now; all three present and hash-carried.
  T('1.2 B31, B33 and B35 are HIS, present and hash-carried', DL.LINES.B31 === 'Which package? Yours are: {list}.' && DL.LINES.B33 === 'Set the fee first.' && DL.LINES.B35 === 'Which client? Say the name.' && DL.LINE_HASHES.B35 === '7b73fec4bc3c30e66b5e33232961ccb26549d42d440d466e6e8de54402c1c773' && DL.LINE_HASHES.B31 === 'b84530f75e2567ea8b74b1b4901fa9a2f67ba70c3707e8135d4b4a539e612a75' && DL.LINE_HASHES.B33 === '7f0c3cc354957b993bbf52493a43434f9c0795ef44491ed1605c3a060ec69f34');
  T('1.3 the glitch line is read from its ONE home and is the founder\'s vetoed byte', GLITCH === 'There was a small glitch, please try again or use the app screens for this action');

  // ─── §2 ───────────────────────────────────────────────────────────────────────────────────
  sec('2 the example table and the one builder');
  T('2.1 EXAMPLE_ACTS is one act per example, by position', DL.EXAMPLE_ACTS.length === DL.EXAMPLES.length && DL.EXAMPLE_ACTS.every((a) => typeof a === 'string' && a));
  const coveredEx = DL.EXAMPLES.filter((_e, i) => WD.COVERED.includes(DL.EXAMPLE_ACTS[i]));
  // RE-PINNED (CE-45 LCV-11, P6b first cut): example 10 switched on by covering relay (doorLines.js EXAMPLE_ACTS); five, in the table's order.
  // RE-PINNED (CE-45 LCV-12, P7 cut 2a): example 4 switched on by covering block_date; six, in the table's order.
  // RE-PINNED (CE-45 LCV-13, P7 cut 2b, labelled): example 5 switched on by covering edit_event; seven, in the table's order.
  // RE-PINNED (CE-45 LCV-14, P7 cut 3, labelled): examples 11 and 12 switched on by covering assign_crew; nine, in the table's order.
  T('2.2 the examples the door may show TODAY are exactly the nine: the chair\'s four, example 10 since P6b, example 4 since P7 2a, example 5 since P7 2b, examples 11 and 12 since P7 cut 3', JSON.stringify(coveredEx) === JSON.stringify(['The Sharma booking is confirmed', 'The advance came in today for the Kapoor booking', 'Block 20 March, personal', 'Move the Verma shoot to 22 November', 'Raise the invoice for the Bose wedding', 'Add a new lead, haldi shoot on 3 January', 'Send a message to my client asking for the advance', 'Add Priya to the team for the 5 December wedding', 'Assign Harsh to the 14 February shoot']));
  let okDraws = true; const seenPairs = new Set();
  for (let i = 0; i < 2000; i += 1) {
    const parts = DL.leftover(WD.COVERED).split('\n');
    if (parts.length !== 3 || parts[0] !== DL.LINES.LEFTOVER || parts[1] === parts[2] || !coveredEx.includes(parts[1]) || !coveredEx.includes(parts[2])) { okDraws = false; break; }
    seenPairs.add(parts.slice(1).sort().join('|'));
  }
  T('2.3 over 2000 draws: the founder\'s line, then TWO DIFFERENT examples, each from a COVERED act, never another', okDraws);
  T('2.4 the draw is random: all thirty-six pairs of the nine appear (twenty-one of seven until P7 cut 3, fifteen of six until P7 2b, ten of five until P7 2a; re-pinned CE-45 LCV-14, labelled)', seenPairs.size === 36);
  // 2.5 RE-AIMED (CE-45 LCV-14, P7 cut 3, labelled): assign_crew is covered now; the act not yet covered is whatsdue (cut four's); the strength kept.
  T('2.5 covering an act switches its example on: with whatsdue covered, "What\'s due this week?" can appear; today it cannot (P7 cut 3 re-aim: assign_crew is covered now)', (() => { let seen = false; let today = false; for (let i = 0; i < 400; i += 1) { if (DL.leftover([...WD.COVERED, 'whatsdue']).includes("What's due this week?")) seen = true; if (DL.leftover(WD.COVERED).includes("What's due")) today = true; } return seen && !today; })());
  T('2.6 one covered example shows one; none shows the line alone', DL.leftover(['lead']) === `${DL.LINES.LEFTOVER}\nAdd a new lead, haldi shoot on 3 January` && DL.leftover([]) === DL.LINES.LEFTOVER);
  T('2.7 no example for attach_package exists until he approves one', !DL.EXAMPLE_ACTS.includes('attach_package'));

  // ─── §3 ───────────────────────────────────────────────────────────────────────────────────
  sec('3 standIn(), exit by exit, through the REAL preTurn (chain out: the key absent)');
  const decide = (db, x) => quiet(() => WD.preTurn({ supabase: db, vendor: V, agentId: AG, route: x.route || ROUTE, message: x.message, lane: x.lane || 'pwa' }, { llmCreate: x.ear, nowMs: NOW, ...(x.deps || {}) }));
  const whys = new Set();
  for (const x of EX) {
    const db = makeDb(x.seed ? x.seed(world()) : world(), x.dbOpts); // P7 cut 3 (LCV-14, labelled): a row may seed its own world (assign_many)
    const out = await decide(db, x);
    const before = writes(db);
    const stood = await quiet(() => WD.standIn({ supabase: db, out }));
    whys.add(out.why);
    T(`3.1 ${x.why}${x.label ? ` (${x.label})` : ''}: preTurn still answers door false with that reason; the stand-in speaks ${x.byte} and writes NOTHING`,
      out.door === false && out.why === x.why && stood && stood.door === true && stood.stood === true && x.is(stood.reply) && stood.keys[0] === x.byte && writes(db) === before && stood.skipHarvest === true && stood.toolCalls.length === 0 && stood.documents.length === 0 && stood.refresh === false);
  }
  const srcWhys = new Set((src('src/lib/vendor/workingDoor.js').match(/CHAIN\([^,]+, '([a-z_]+)'/g) || []).map((m) => /'([a-z_]+)'/.exec(m)[1]));
  T('3.2 the exits driven above are EVERY reason preTurn can return but `empty` (3.3), read from the source', [...srcWhys].filter((w) => w !== 'empty').every((w) => whys.has(w)) && srcWhys.size === 22 && (src('src/lib/vendor/workingDoor.js').match(/return CHAIN\(/g) || []).length === 34); // RE-PINNED (CE-45 LCV-14, P7 cut 4 fix, labelled): the new-leads branch gains the head-count's refusal and the tally branch its render refusal (34 returns; no new reason); // RE-PINNED (CE-45 LCV-14, P7 cut 4, labelled): lookup_unsayable joins (22 reasons); the gate's own `return CHAIN(` became `return (await lookupDoor(...)) || CHAIN(` (one fewer), lookupDoor adds four (32 returns); // RE-PINNED (CE-45 LCV-14, P7 cut 3, labelled): team_unsayable and assign_many join; four returns added (team_unsayable, assign_many and book_no_lead in the team probe; the team rebuild's one): 21 reasons, 29 returns; // RE-PINNED (CE-45 LCV-13, P7 2b, labelled): cal_mixed joins; five returns added (cal_mixed, book_no_lead and calendar_unsayable from the move/cancel hook, calendar_unsayable twice from the B53 answer): 19 reasons / 25 returns // RE-PINNED (CE-45 LCV-12, P7 2a): lookup, book_no_lead, calendar_unsayable join (18 reasons / 20 returns) // RE-PINNED (CE-45 LCV-11, P6b): two lead_phone returns left, ONE came back for the two-runs case, relay_unsayable and relay_pwa came: 16 returns, 15 reasons; // 15 since LCV-10 B-2 (first cut): the phone guard is also applied at the name question, same reason lead_phone
  T('3.3 `empty` (nothing to say and nothing written) and an UNKNOWN reason are the glitch line', WD.standKey({ door: false, why: 'empty', ear: { request: req([{ act: 'lead' }]) } }, { lifecycle: LH }).key === 'GLITCH' && WD.standKey({ door: false, why: 'something_new' }, { lifecycle: LH }).key === 'GLITCH' && WD.standKey(null, { lifecycle: LH }).key === 'GLITCH');
  T('3.4 money_unsayable for a payment is D8, for a booking F29: the byte the rebuild already speaks', WD.standKey({ why: 'money_unsayable', say: { act: 'milestone_paid' } }, { lifecycle: LH }).line === LH.LINES.D8 && WD.standKey({ why: 'money_unsayable', say: { act: 'advance_paid' } }, { lifecycle: LH }).line === LH.LINES.F29);
  // B34 never when no act was heard; LEFTOVER never when an uncovered one was: over every act the listener can name.
  const ACTS = /description: '([^']+)'/.exec(src('src/lib/vendor/listenerDoor.js').split("act: { type: 'string'")[1])[1].split(', ');
  let never = ACTS.length === 21; // P7 2a: payment_reminder joins the description (measured, the rig's bytes)
  for (const a of ACTS) {
    const k = WD.standKey({ why: 'uncovered', ear: { request: req([{ act: a, client_as_spoken: 'X' }]) } }, { lifecycle: LH }).key;
    if (WD.COVERED.includes(a) ? k !== 'LEFTOVER' : k !== 'B34') never = false;
    const mixed = WD.standKey({ why: 'uncovered', ear: { request: req([{ act: 'lead', client_as_spoken: 'X' }, { act: a }]) } }, { lifecycle: LH }).key;
    if (!WD.COVERED.includes(a) && mixed !== 'B34') never = false;
  }
  T('3.5 over all 21 acts the listener can name: an uncovered act, alone or beside a covered one, is ALWAYS B34 and never LEFTOVER', never);
  T('3.6 B34 is NEVER spoken when no act was heard: no acts, route none, a bare yes', ['uncovered'].every((w) => WD.standKey({ why: w, ear: { request: req([], 'none') } }, { lifecycle: LH }).key === 'LEFTOVER') && WD.standKey({ why: 'yes_no_nothing_waiting' }, { lifecycle: LH }).key === 'LEFTOVER');
  T('3.7 a B32 or B15 whose name cannot be rendered never speaks a broken sentence: B30, the glitch line', WD.standKey({ why: 'attach_no_lead', say: { name: '   ' } }, { lifecycle: LH }).key === 'B30' && WD.standKey({ why: 'invoice_unresolved', say: { name: '  ' } }, { lifecycle: LH }).key === 'GLITCH');
  T('3.8 a verdict that IS the door\'s passes through untouched', await (async () => { const o = { door: true, reply: 'x', keys: ['B3'] }; return (await WD.standIn({ supabase: makeDb(world()), out: o })) === o; })());

  // ─── §4 ───────────────────────────────────────────────────────────────────────────────────
  sec('4 the switch: only JSON true is chain in');
  const verdict = { door: false, ear: null, why: 'yes_no_nothing_waiting' };
  const position = async (db) => { LF._resetLaneFlagCache(); return quiet(() => WD.standIn({ supabase: db, out: verdict })); };
  T('4.1 the key ABSENT: chain out', (await position(makeDb(world()))) !== null);
  for (const junk of ['false', '"true"', '1', 'yes', 'TRUE', '{"on":true}', '', 'not json', 'null']) T(`4.2 the key holding ${JSON.stringify(junk)}: chain out`, (await position(makeDb(world(junk)))) !== null);
  T('4.3 the key\'s read FAILING (the table throws): chain out', (await position(makeDb(world('true'), { failRead: ['public.admin_config'] }))) !== null);
  T('4.4 the key\'s read returning an ERROR: chain out', (await position(makeDb(world('true'), { errorRead: ['public.admin_config'] }))) !== null);
  T('4.5 no database handle at all: chain out', (LF._resetLaneFlagCache(), (await quiet(() => WD.standIn({ supabase: null, out: verdict }))) !== null));
  T('4.6 the key holding JSON true: CHAIN IN, standIn answers null and the lane falls to the chain', (await position(makeDb(world('true')))) === null);
  T('4.7 the reader itself throwing: chain out', (await quiet(() => WD.standIn({ supabase: makeDb(world('true')), out: verdict }, { readLaneFlag: async () => { throw new Error('x'); } }))) !== null);
  T('4.8 the key is in the LANE_FLAGS census, default OFF, and the door names the same key', LF.LANE_FLAGS[FLAG] === false && WD.CHAIN_FLAG === FLAG);
  LF._resetLaneFlagCache();
  let reads = 0; const counting = makeDb(world()); const realFrom = counting.from; counting.from = (n) => { if (n === 'admin_config') reads += 1; return realFrom(n); };
  for (let i = 0; i < 50; i += 1) await quiet(() => WD.standIn({ supabase: counting, out: verdict }));
  T('4.9 fifty turns inside one cache window cost ONE read of admin_config, not fifty', reads === 1);
  LF._resetLaneFlagCache();

  // ─── §5 THE WHATSAPP LANE ──────────────────────────────────────────────────────────────────
  sec('5 the WhatsApp lane: the REAL processVendorInbound, the REAL preTurn and standIn, runTurn SPIED');
  const realWD = require(WDP);
  // The lane's own supabase is b90's chain double PLUS a real admin_config, so the switch is read through the lane.
  const driveWA = async (o) => {
    const savedWD = require.cache[WDP]; const savedVI = require.cache[VIP];
    const turns = { n: 0 }; const sent = []; const persisted = [];
    LF._resetLaneFlagCache();
    try {
      const d = o.db || makeDb(world(o.flag), o.dbOpts);
      const mod = new Module(WDP, module); mod.filename = WDP; mod.loaded = true;
      mod.exports = { ...realWD,
        preTurn: o.preTurnThrows ? (async () => { throw new Error('preTurn unreachable'); }) : ((a) => realWD.preTurn({ ...a, supabase: d, vendor: V, agentId: AG, route: o.route || ROUTE, ...(o.lane ? { lane: o.lane } : {}) }, { llmCreate: o.ear, nowMs: NOW, ...(o.deps || {}) })),
        standIn: o.standInThrows ? (async () => { throw new Error('standIn unreachable'); }) : ((a) => realWD.standIn({ ...a, supabase: o.flagDb || d }, o.rand ? { rand: o.rand } : undefined)),
        speakOnWhatsApp: (a) => realWD.speakOnWhatsApp(a, { persistDoorTurn: async (p) => { persisted.push(p); return {}; } }) };
      require.cache[WDP] = mod;
      delete require.cache[VIP];
      const lane = o.mutatedVi ? o.mutatedVi() : require(VIP);
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
      const said = o.message;
      await quiet(() => lane.processVendorInbound({ phone: '+919888294440', body: said, profileName: 'Dev', messageSid: `wamid.b93.${Math.random()}`, internalReplay: false, trimmedBody: said.trim(), numMedia: 0, hasMedia: false, mediaUrl: null, rawPayload: {} }, deps));
      return { turns: turns.n, sent, persisted, d };
    } finally {
      if (savedWD) require.cache[WDP] = savedWD; else delete require.cache[WDP];
      if (savedVI) require.cache[VIP] = savedVI; else delete require.cache[VIP];
      LF._resetLaneFlagCache();
    }
  };
  const POS = [['the key absent', {}], ['the key junk', { flag: '"true"' }], ['the key\'s read failing', { flag: 'true', flagFail: true }]];
  const laneExits = EX.filter((x) => !x.directOnly && x.message.trim());
  for (const [label, p] of POS) {
    let ok = true; const bad = [];
    for (const x of laneExits) {
      const flagDb = p.flagFail ? makeDb(world('true'), { failRead: ['public.admin_config'] }) : undefined;
      const w = await driveWA({ message: x.message, ear: x.ear, route: x.route, deps: x.deps, dbOpts: x.dbOpts, flag: p.flag, flagDb });
      const last = w.sent[w.sent.length - 1];
      if (!(w.turns === 0 && w.sent.length === 1 && x.is(last.text) && Array.isArray(last.media) && last.media.length === 0 && w.persisted.length === 1 && w.persisted[0].lane === 'whatsapp' && w.persisted[0].out.stood === true)) { ok = false; bad.push(`${x.why}/${x.label || ''}`); }
    }
    T(`5.1 WhatsApp, ${label}: on EVERY exit (${laneExits.length} specimens) runTurn is called ZERO times, ONE line is sent, it is the ruled byte, no media, persisted once as a door turn${bad.length ? ` · RED ON ${bad.join(', ')}` : ''}`, ok);
  }
  // CHAIN IN IS MEASURED AGAINST THE LANE AS IT STOOD: the same lane with its stand-in lines REMOVED is 10d5d99's shape
  // (the stage-2 retry at :2000 may call the chain a second time on an imperative; that is the old lane's own behaviour).
  const viSrc0 = fs.readFileSync(VIP, 'utf8');
  const standBlock = viSrc0.slice(viSrc0.indexOf('    // LCV-9 PART ONE (R-44.37): THE CHAIN HAS LEFT THIS LANE.'), viSrc0.indexOf('    if (doorOut && doorOut.door) {'));
  const oldLane = () => { const mm = new Module(VIP, module); mm.filename = VIP; mm.paths = Module._nodeModulePaths(path.dirname(VIP)); mm._compile(viSrc0.replace(standBlock, ''), VIP); return mm.exports; };
  let okIn = standBlock.length > 200; const badIn = [];
  for (const x of laneExits) {
    const a = await driveWA({ message: x.message, ear: x.ear, route: x.route, deps: x.deps, dbOpts: x.dbOpts, flag: 'true' });
    const b = await driveWA({ message: x.message, ear: x.ear, route: x.route, deps: x.deps, dbOpts: x.dbOpts, mutatedVi: oldLane });
    if (!(a.turns >= 1 && a.turns === b.turns && a.persisted.length === 0 && JSON.stringify(a.sent) === JSON.stringify(b.sent))) { okIn = false; badIn.push(x.why); }
  }
  T(`5.2 WhatsApp, the key JSON true: on every exit the chain IS called, and turn for turn and line for line the lane does what the lane WITHOUT this cut's block does (10d5d99's shape); the door persists nothing${badIn.length ? ` · RED ON ${badIn.join(', ')}` : ''}`, okIn);
  let w = await driveWA({ message: 'Hello', ear: earOf(req([], 'none')), preTurnThrows: true });
  T('5.3 WhatsApp, preTurn itself unreachable, chain out: the glitch line, runTurn ZERO', w.turns === 0 && w.sent.length === 1 && w.sent[0].text === GLITCH);
  w = await driveWA({ message: 'Hello', ear: earOf(req([], 'none')), standInThrows: true });
  T('5.4 WhatsApp, the stand-in itself unreachable: the glitch line from its one home, runTurn ZERO', w.turns === 0 && w.sent.length === 1 && w.sent[0].text === GLITCH);
  // THE LAYOUT, PINNED (the chair's ruling of 21 September: his line, then the two examples, each on its own line, nothing else,
  // no bullets, dashes or quotation marks). A FIXED SEED (rand always 0) draws the first covered example and then the next.
  const FIXED = "I didn't catch a task in that. You can say things like:\nThe Sharma booking is confirmed\nThe advance came in today for the Kapoor booking";
  w = await driveWA({ message: 'Hello', ear: earOf(req([], 'none')), rand: () => 0 });
  T('5.6 WhatsApp, a fixed seed: the EXACT bytes of the leftover reply as she is sent them', w.turns === 0 && w.sent.length === 1 && w.sent[0].text === FIXED && sha(w.sent[0].text) === '4e0ecb5cceed764b29e3b21bdbe2d72a63e0d97a7d98965c4164e024339eb8fa');
  w = await driveWA({ message: 'Add a new lead Walk P8 Door', ear: earOf(req([{ act: 'lead', client_as_spoken: 'Walk P8 Door' }])), deps: { createLead: async (_s, _v, input) => ({ ok: true, lead: { id: 'x', name: input.name } }) } });
  T('5.5 control: a turn the door TAKES is untouched by this cut: "Lead added: Walk P8 Door.", runTurn ZERO, not a stand-in', w.turns === 0 && w.sent[0].text === 'Lead added: Walk P8 Door.' && w.persisted[0].out.stood === undefined);

  // ─── §6 THE PWA ROUTES ─────────────────────────────────────────────────────────────────────
  sec('6 the pwa: the REAL chat.js POST handler, JSON and SSE, with the engine\'s runTurn SPIED');
  const drivePwa = async (o) => {
    const saved = { loop: require.cache[LOOP], cj: require.cache[CJP], wd: require.cache[WDP] };
    const turns = { n: 0, rooms: [] };
    LF._resetLaneFlagCache();
    try {
      const d = makeDb(world(o.flag), o.dbOpts);
      const flagDb = o.flagFail ? makeDb(world('true'), { failRead: ['public.admin_config'] }) : d;
      require.cache[LOOP] = { id: LOOP, filename: LOOP, loaded: true, exports: { ...(saved.loop ? saved.loop.exports : {}), runTurn: async (a) => { turns.n += 1; turns.rooms.push(a && a.roomAssert); return { reply: 'VICTOR', tool_calls: [], conversation_id: 'c-1', assistant_message_id: null }; } } };
      const mod = new Module(WDP, module); mod.filename = WDP; mod.loaded = true; const persisted = [];
      mod.exports = { ...realWD,
        preTurn: o.preTurnThrows ? (async () => { throw new Error('preTurn unreachable'); }) : ((a) => realWD.preTurn({ ...a, supabase: d, vendor: V, agentId: AG, route: o.route || ROUTE }, { llmCreate: o.ear, nowMs: NOW, ...(o.deps || {}) })),
        standIn: o.standInThrows ? (async () => { throw new Error('standIn unreachable'); }) : ((a) => realWD.standIn({ ...a, supabase: flagDb }, o.rand ? { rand: o.rand } : undefined)),
        persistDoorTurn: async (p) => { persisted.push(p); return {}; } };
      require.cache[WDP] = mod;
      delete require.cache[CJP];
      const router = o.mutatedCj ? o.mutatedCj() : require(CJP);
      const layer = router.stack.find((l) => l.route && l.route.path === '/' && l.route.methods.post);
      const handler = layer.route.stack[layer.route.stack.length - 1].handle;
      const out = { json: null, chunks: [], ended: false };
      const res = { setHeader() {}, flushHeaders() {}, on() {}, writableEnded: false, status() { return res; },
        json(b) { out.json = b; return res; }, write(c) { out.chunks.push(String(c)); return true; }, end() { out.ended = true; res.writableEnded = true; } };
      const reqq = { body: { message: o.message, ...(o.room ? { room: o.room } : {}) }, headers: o.sse ? { accept: 'text/event-stream' } : {}, vendor: V, agentId: AG, app: { locals: { supabase: d } }, on() {}, get() { return undefined; } };
      await quiet(async () => { try { await handler(reqq, res); } catch (_e) { /* a chain turn over a double may fail AFTER runTurn; the count is the cell */ } });
      await new Promise((r) => setTimeout(r, 5));
      const text = o.sse ? out.chunks.filter((c) => c.startsWith('data: {')).map((c) => JSON.parse(c.slice(6))).filter((e) => e.type === 'text_delta').map((e) => e.text).join('') : (out.json && out.json.reply);
      const done = o.sse ? out.chunks.filter((c) => c.startsWith('data: {')).map((c) => JSON.parse(c.slice(6))).find((e) => e.type === 'done') : out.json;
      return { turns: turns.n, rooms: turns.rooms, text, done, persisted, raw: out };
    } finally {
      for (const [k, p] of [['loop', LOOP], ['cj', CJP], ['wd', WDP]]) { if (saved[k]) require.cache[p] = saved[k]; else delete require.cache[p]; }
      LF._resetLaneFlagCache();
    }
  };
  for (const sse of [false, true]) {
    for (const [label, p] of POS) {
      let ok = true; const bad = [];
      for (const x of laneExits) {
        const r = await drivePwa({ message: x.message, ear: x.ear, route: x.route, deps: x.deps, dbOpts: x.dbOpts, flag: p.flag, flagFail: p.flagFail, sse });
        if (!(r.turns === 0 && x.is(r.text) && r.done && r.done.room === 'business' && Array.isArray(r.done.tool_calls) && r.done.tool_calls.length === 0 && r.done.refresh === false && r.persisted.length === 1 && r.persisted[0].lane === 'pwa')) { ok = false; bad.push(`${x.why}/${x.label || ''}`); }
      }
      T(`6.1 pwa ${sse ? 'SSE' : 'JSON'}, ${label}: on EVERY exit runTurn is called ZERO times, the reply is the ruled byte, room business, no tool name (no chip), no refresh, persisted once${bad.length ? ` · RED ON ${bad.join(', ')}` : ''}`, ok);
    }
    let okIn2 = true;
    for (const x of laneExits) { const r = await drivePwa({ message: x.message, ear: x.ear, route: x.route, deps: x.deps, dbOpts: x.dbOpts, flag: 'true', sse }); if (!(r.turns === 1 && r.persisted.length === 0)) okIn2 = false; }
    T(`6.2 pwa ${sse ? 'SSE' : 'JSON'}, the key JSON true: on every exit the chain is called EXACTLY ONCE and the door persists nothing, as at 10d5d99`, okIn2);
    let r = await drivePwa({ message: 'How should I price my package?', room: 'advisor', ear: earOf(req([], 'none')), sse });
    T(`6.3 pwa ${sse ? 'SSE' : 'JSON'}: THE ADVISOR ROOM REACHES THE CHAIN with the chain OUT of the working rooms, asserted advisor, and the door is never asked`, r.turns === 1 && r.rooms[0] === 'advisor' && r.persisted.length === 0);
    r = await drivePwa({ message: 'How should I price my package?', room: 'advisor', ear: earOf(req([], 'none')), flag: 'true', sse });
    T(`6.4 pwa ${sse ? 'SSE' : 'JSON'}: the Advisor room reaches the chain in the switch's OTHER position too`, r.turns === 1 && r.rooms[0] === 'advisor');
    r = await drivePwa({ message: 'Hello', ear: earOf(req([], 'none')), rand: () => 0, sse });
    T(`6.7 pwa ${sse ? 'SSE' : 'JSON'}, a fixed seed: the EXACT bytes of the leftover reply on the wire, the same bytes WhatsApp sends (5.6)`, r.turns === 0 && r.text === FIXED);
    r = await drivePwa({ message: 'Hello', ear: earOf(req([], 'none')), preTurnThrows: true, sse });
    T(`6.5 pwa ${sse ? 'SSE' : 'JSON'}: preTurn unreachable, chain out: the glitch line, runTurn ZERO`, r.turns === 0 && r.text === GLITCH);
    r = await drivePwa({ message: 'Hello', ear: earOf(req([], 'none')), standInThrows: true, sse });
    T(`6.6 pwa ${sse ? 'SSE' : 'JSON'}: the stand-in unreachable: the glitch line, runTurn ZERO`, r.turns === 0 && r.text === GLITCH);
  }

  // ─── §7 ───────────────────────────────────────────────────────────────────────────────────
  sec('7 a stand-in turn is persisted as ONE door turn, counted once, the lane in the door\'s own note');
  {
    const db = makeDb(world());
    const out = await decide(db, EX.find((x) => x.byte === 'B34'));
    const stood = await quiet(() => WD.standIn({ supabase: db, out }));
    const saved = []; const usage = [];
    const memory = { getOrCreateConversation: async () => ({ conversationId: 'c-1' }), saveMessage: async (c, role, content, tc, meta) => { saved.push({ role, content, tc, meta }); return `m-${saved.length}`; } };
    const meter = { harvestMeterRow: (r, model) => ({ model, ...r.usage }), writeHarvestUsage: async (_s, _a, row) => { usage.push(row); } };
    await quiet(() => WD.persistDoorTurn({ supabase: db, agentId: AG, message: 'Block 20 March, personal', out: stood, lane: 'whatsapp' }, { memory, meter }));
    const l = saved[1] && saved[1].meta && saved[1].meta.listener;
    T('7.1 her row and the door\'s row join the thread; the door\'s row carries door true, the LANE (e-55: a message-level fact lives here), and what the listener HEARD', saved.length === 2 && saved[1].content === DL.LINES.B34 && l && l.door === true && l.lane === 'whatsapp' && l.request.acts[0].act === 'note' && saved[1].tc === undefined); // P7 2a: the B34 specimen is assign_crew now // RE-PINNED (CE-45 LCV-14, P7 cut 3, labelled): the B34 specimen is `note` now
    T('7.2 ONE counted usage row, carrying the conversation id: a stand-in turn counts once toward her limit, as door turns do', usage.length === 1 && usage[0].conversation_id === 'c-1');
    T('7.3 the stand-in carries no mark of a question: asked and asked_name are absent', l && !('asked' in l) && !('asked_name' in l));
    const cj = src('src/api/vendor-engine/chat.js');
    T('7.4 harvest is skipped on a stand-in turn by the door\'s own flag, read by the route\'s one harvest seam', stood.skipHarvest === true && /if \(!out \|\| out\.skipHarvest\) return;/.test(cj));
  }

  // ─── §8 ───────────────────────────────────────────────────────────────────────────────────
  sec('8 the one-read pins and W-1');
  const wdS = src('src/lib/vendor/workingDoor.js'); const cjS = src('src/api/vendor-engine/chat.js'); const viS = src('src/lib/vendorInbound.js');
  T('8.1 the leftover builder is called in exactly ONE place in the estate, inside workingDoor.js; chat.js and vendorInbound.js never name LEFTOVER or EXAMPLES', (wdS.match(/DL\.leftover\(/g) || []).length === 1 && !/DL\.EXAMPLES|DL\.LINES\.LEFTOVER|EXAMPLE_ACTS/.test(wdS) && !/LEFTOVER|EXAMPLES/.test(cjS) && !/LEFTOVER|EXAMPLES/.test(viS));
  T('8.2 the switch is read in exactly ONE place: workingDoor.js standIn; neither lane names the key outside a comment or reads laneFlags for it', (wdS.match(/readLaneFlag\)\(supabase, CHAIN_FLAG\)/g) || []).length === 1 && !/readLaneFlag\([^)]*working_chain/.test(cjS) && !/readLaneFlag\([^)]*working_chain/.test(viS));
  T('8.3 each lane hands the verdict to standIn ONCE, before its door branch; the Advisor return stays the first line of doorTurn', (cjS.match(/\.standIn\(/g) || []).length === 1 && (viS.match(/\.standIn\(/g) || []).length === 1 && /async function doorTurn\(req, llmWiring, message, roomAssert\) \{\n {2}if \(roomAssert === 'advisor'\) return null;/.test(cjS) && viS.indexOf('.standIn(') < viS.indexOf('    if (doorOut && doorOut.door) {'));
  const man = fs.existsSync(P(MAN)) ? src(MAN).split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#')) : [];
  T('8.4 W-1 NONE, from this packet\'s own manifest: no path under src/engine, no soul, lens or prompt file, no migration', man.length > 0 && man.every((p) => !/^src\/engine\/|soul|lens|^db\/migrations\//.test(p)));
  T('8.5 the manifest names exactly the sixteen paths this packet touches (C-44.7: its own committed manifest)', JSON.stringify(man.slice().sort()) === JSON.stringify([
    'docs/handovers/TDW_CE44_LCV9_PART1_HANDOVER.md', MAN, 'scripts/b93_lcv9_chain_out_bench.js', 'scripts/b90_lcv_p5_bench.js', 'scripts/b92_lcv_p6a_bench.js',
    'scripts/b0498_fresh_crew_rider_bench.js', 'scripts/b05_f0555_media_dedupe_bench.js', 'scripts/b05_m2_vendor_inbound_bench.js', 'scripts/b06_m3_bench.js',
    'scripts/b06_relay_hand_bench.js', 'scripts/b80_lc1b_door_strings_bench.js',
    'src/api/vendor-engine/chat.js', 'src/lib/laneFlags.js', 'src/lib/vendor/doorLines.js', 'src/lib/vendor/workingDoor.js', 'src/lib/vendorInbound.js'].sort()));

  // ─── §9 ───────────────────────────────────────────────────────────────────────────────────
  sec('9 fuzz, every argument position, the verdict itself hostile');
  const thrower = new Proxy({}, { get() { throw new Error('hostile'); }, has() { throw new Error('hostile'); }, ownKeys() { throw new Error('hostile'); } });
  const getter = {}; Object.defineProperty(getter, 'why', { get() { throw new Error('hostile'); } }); Object.defineProperty(getter, 'door', { get() { throw new Error('hostile'); } });
  const HOST = [undefined, null, 0, 1, NaN, '', 'x', [], {}, () => {}, Symbol('s'), thrower, getter, { door: false, why: thrower }, { door: false, why: 'uncovered', ear: thrower }, { door: false, why: 'uncovered', ear: { request: thrower } }, { door: false, why: 'uncovered', ear: { request: { acts: [thrower, null, 1] } } }, { door: false, why: 'attach_no_lead', say: thrower }, { door: false, why: 'money_unsayable', say: { act: thrower } }, { door: false, why: 'invoice_unresolved', say: { name: { toString() { throw new Error('h'); } } } }];
  let throws = 0; let calls = 0; let shapes = true;
  for (const a of HOST) for (const b of HOST) {
    for (const args of [{ supabase: a, out: b }, a]) {
      for (const deps of [undefined, b, { readLaneFlag: a }, { rand: a }, { lifecycle: a }]) {
        calls += 1;
        try { LF._resetLaneFlagCache(); const r = await quiet(() => WD.standIn(args, deps)); if (!(r === null || (r && r.door === true && typeof r.reply === 'string' && r.reply))) shapes = false; } catch (_e) { throws += 1; }
      }
    }
    calls += 2;
    try { WD.standKey(a, b); } catch (_e) { throws += 1; }
    try { const s = DL.leftover(a, b); if (typeof s !== 'string' || s.split('\n')[0] !== DL.LINES.LEFTOVER) shapes = false; } catch (_e) { throws += 1; }
  }
  T(`9.1 ${calls} hostile calls of standIn, standKey and leftover: ZERO throws`, throws === 0 && calls === HOST.length * HOST.length * 12);
  T('9.2 every standIn answer under fuzz is null or a door answer with a non-empty line; every leftover opens with the founder\'s line', shapes);
  LF._resetLaneFlagCache();

  // ─── §10 ──────────────────────────────────────────────────────────────────────────────────
  sec('10 mutations of production code, each reddening its cell');
  const greet = { message: 'Hello', ear: earOf(req([], 'none')) };
  const compileVi = (code) => () => { const mm = new Module(VIP, module); mm.filename = VIP; mm.paths = Module._nodeModulePaths(path.dirname(VIP)); mm._compile(code, VIP); return mm.exports; };
  const compileCj = (code) => () => { const mm = new Module(CJP, module); mm.filename = CJP; mm.paths = Module._nodeModulePaths(path.dirname(CJP)); mm._compile(code, CJP); return mm.exports; };
  const viA = "      try { const stood = await require('./vendor/workingDoor').standIn({ supabase, out: doorOut }); if (stood) doorOut = stood; }";
  T('10.1 the WhatsApp anchor is present', viS.includes(viA));
  w = await driveWA({ ...greet, mutatedVi: compileVi(viS.replace(viA, '      try { /* mutated: the chain call restored */ }')) });
  T('10.2 M1 the WhatsApp lane with its stand-in removed reaches runTurn: reddens 5.1', w.turns === 1);
  const cjA = "    try { const stood = await require('../../lib/vendor/workingDoor').standIn({ supabase: req.app.locals.supabase, out }); if (stood) out = stood; }";
  T('10.3 the pwa anchor is present', cjS.includes(cjA));
  for (const sse of [false, true]) { const r = await drivePwa({ ...greet, sse, mutatedCj: compileCj(cjS.replace(cjA, '    try { /* mutated: the chain call restored */ }')) }); T(`10.4 M2 the pwa ${sse ? 'SSE' : 'JSON'} route with doorTurn's stand-in removed reaches runTurn: reddens 6.1`, r.turns === 1); }
  const cjB = "  if (roomAssert === 'advisor') return null;\n  let out = null;";
  { const r = await drivePwa({ message: 'How should I price my package?', room: 'advisor', ear: earOf(req([], 'none')), mutatedCj: compileCj(cjS.replace(cjB, '  let out = null;')) }); T('10.5 M3 doorTurn without its Advisor return takes the Advisor room from the chain: reddens 6.3', cjS.includes(cjB) && r.turns === 0); }
  const viB = "        if (!glitch) { console.error('[door:wa stand-in] no line could be loaded; nothing sent, the chain NOT called (R-44.37)'); return; }\n        doorOut = {";
  w = await driveWA({ ...greet, standInThrows: true, mutatedVi: compileVi(viS.replace(viB, '        if (false) doorOut = {')) });
  T('10.6 M4 the WhatsApp catch no longer speaking the glitch line falls to the chain: reddens 5.4', viS.includes(viB) && w.turns === 1);
  const cjC = "catch (e) { console.error('[door:pwa stand-in]', e && e.message); out = { door: true,";
  { const r = await drivePwa({ ...greet, standInThrows: true, mutatedCj: compileCj(cjS.replace(cjC, "catch (e) { console.error('[door:pwa stand-in]', e && e.message); const _x = { door: true,")) }); T('10.7 M5 the pwa catch no longer speaking the glitch line falls to the chain: reddens 6.6', cjS.includes(cjC) && r.turns === 1); }
  await mut('10.8 M6 a switch that reads a FAILED read as chain in: reddens 4.7', 'src/lib/vendor/workingDoor.js', [['=== true; } catch (_e) { chainIn = false; }', '=== true; } catch (_e) { chainIn = true; }']], [],
    async (rq) => quiet(() => rq('src/lib/vendor/workingDoor.js').standIn({ supabase: makeDb(world()), out: verdict }, { readLaneFlag: async () => { throw new Error('x'); } })), (v) => v === null);
  await mut('10.9 M7 a switch that takes any truthy value as chain in: reddens 4.2', 'src/lib/vendor/workingDoor.js', [['(supabase, CHAIN_FLAG)) === true;', '(supabase, CHAIN_FLAG)) != null;']], [],
    async (rq) => { LF._resetLaneFlagCache(); return quiet(() => rq('src/lib/vendor/workingDoor.js').standIn({ supabase: makeDb(world()), out: verdict })); }, (v) => v === null);
  await mut('10.10 M8 laneFlags parsing the STRING "true" as on: reddens 4.2', 'src/lib/laneFlags.js', [['val = parsed === true;', "val = parsed === true || parsed === 'true';"]], ['src/lib/vendor/workingDoor.js'],
    async (rq) => quiet(() => rq('src/lib/vendor/workingDoor.js').standIn({ supabase: makeDb(world('"true"')), out: verdict })), (v) => v === null);
  await mut('10.11 M9 the census defaulting the key ON: reddens 4.1', 'src/lib/laneFlags.js', [["'vendor.working_chain_enabled': false,", "'vendor.working_chain_enabled': true,"]], ['src/lib/vendor/workingDoor.js'],
    async (rq) => quiet(() => rq('src/lib/vendor/workingDoor.js').standIn({ supabase: makeDb(world()), out: verdict })), (v) => v === null);
  await mut('10.12 M10 an uncovered act answered with LEFTOVER: reddens 3.5', 'src/lib/vendor/workingDoor.js', [["    if (acts.some((a) => !a || !COVERED.includes(a.act))) return { key: 'B34' };\n", '']], [],
    async (rq) => rq('src/lib/vendor/workingDoor.js').standKey({ why: 'uncovered', ear: { request: req([{ act: 'block_date' }]) } }, { lifecycle: LH }).key, (v) => v === 'LEFTOVER');
  await mut('10.13 M11 no act heard answered with B34: reddens 3.6', 'src/lib/vendor/workingDoor.js', [["    if (!acts.length) return { key: 'LEFTOVER' };", "    if (!acts.length) return { key: 'B34' };"]], [],
    async (rq) => rq('src/lib/vendor/workingDoor.js').standKey({ why: 'uncovered', ear: { request: req([], 'none') } }, { lifecycle: LH }).key, (v) => v === 'B34');
  await mut('10.14 M12 a builder drawing from ALL twelve examples shows one the door cannot do: reddens 2.3', 'src/lib/vendor/doorLines.js', [['const pool = EXAMPLES.filter((_e, i) => cov.includes(EXAMPLE_ACTS[i]));', 'const pool = EXAMPLES.slice();']], [],
    async (rq) => { const D = rq('src/lib/vendor/doorLines.js'); for (let i = 0; i < 400; i += 1) if (D.leftover(WD.COVERED).split('\n').slice(1).some((e) => !coveredEx.includes(e))) return true; return false; }, (v) => v === true);
  await mut('10.15 M13 planInvoice telling a FAILED read from no binder no longer: a failed read would speak B15: reddens 3.1', 'src/lib/vendor/workingDoor.js', [['  if (error || !Array.isArray(data)) return null;\n  const hits = data.filter((b) => key(b.client) === key(name));', '  if (error || !Array.isArray(data)) return { noBinder: true, name };\n  const hits = data.filter((b) => key(b.client) === key(name));']], [],
    async (rq) => { const M = rq('src/lib/vendor/workingDoor.js'); const db = makeDb(world(), { errorRead: ['engine.records'] }); const out = await quiet(() => M.preTurn({ supabase: db, vendor: V, agentId: AG, route: ROUTE, message: 'Raise the invoice for Walk45', lane: 'pwa' }, { llmCreate: earOf(req([{ act: 'invoice', client_as_spoken: 'Walk45' }])), nowMs: NOW })); return (await quiet(() => M.standIn({ supabase: db, out }))).keys[0]; }, (v) => v === 'B15');
  await mut('10.16 M14 a stand-in that does not skip harvest: reddens 3.1', 'src/lib/vendor/workingDoor.js', [['documents: [], skipHarvest: true, ear: (out && out.ear) || null', 'documents: [], skipHarvest: false, ear: (out && out.ear) || null']], [],
    async (rq) => (await quiet(() => rq('src/lib/vendor/workingDoor.js').standIn({ supabase: makeDb(world()), out: verdict }))).skipHarvest, (v) => v === false);
  await mut('10.17 M15 a builder that bullets its examples: reddens 5.6 and 6.7', 'src/lib/vendor/doorLines.js', [["return [LINES.LEFTOVER, ...picked].join('\\n');", "return [LINES.LEFTOVER, ...picked.map((e) => `- ${e}`)].join('\\n');"]], [],
    async (rq) => rq('src/lib/vendor/doorLines.js').leftover(WD.COVERED, () => 0), (v) => v !== FIXED && v.includes('- The Sharma booking is confirmed'));

  // ─── §11 THE CARD'S OWN WORDS ──────────────────────────────────────────────────────────────
  sec('11 every SAY line on Part One\'s walk card, on the real WhatsApp lane, in one thread (one database)');
  {
    const db = makeDb(world());
    // C-44.3 (amended CE-45 LCV-11, P6b): the double keeps the phone the door passes, as createLead's own row would.
    const createLead = async (_s, _v, input) => { const row = leadRow({ id: `l-${input.name}`, name: input.name, phone: input.phone || null, wedding_date: input.wedding_date || null, wedding_date_precision: input.wedding_date_precision || null }); db.tables['public.leads'].push(row); return { ok: true, lead: row }; };
    const say = async (message, request, extra) => driveWA({ db, message, ear: request === 'FAIL' ? earFails : earOf(request), deps: { createLead, ...(extra || {}) } });
    const one = (r) => (r.turns === 0 && r.sent.length === 1 ? r.sent[0].text : `turns=${r.turns} sent=${r.sent.length}`);
    let r = await say('Hello', req([], 'none'));
    const parts = one(r).split('\n');
    // 11.1 RE-PINNED (CE-45 LCV-14, P7 cut 4, labelled): the stand-in's pool is COVERED plus LOOKUP_ACTS since cut 4 (examples 3, 7, 8 on; b108 6.2 holds them).
    const standInEx = DL.EXAMPLES.filter((_e, i) => [...WD.COVERED, ...(WD.LOOKUP_ACTS || [])].includes(DL.EXAMPLE_ACTS[i]));
    T('11.1 SAY "Hello": "I didn\'t catch a task in that. You can say things like:" and two of the four examples', parts.length === 3 && parts[0] === DL.LINES.LEFTOVER && parts.slice(1).every((e) => standInEx.includes(e)));
    // C-44.12 (CE-44 LCV-10 PART A, the chair's standing rule born of F-44.110): WHERE A WALK RECORD HOLDS WHAT THE LIVE LISTENER
    // HEARD FOR A SENTENCE, ITS CELL REPLAYS THAT HEARD REQUEST VERBATIM. The doubles of 11.2, 11.3, 11.4, 11.6 and 11.9 were tidier
    // than the live ear and are CORRECTED here to TDW_CE44_LCV9_PART1_WALK_RECORD.md §3, turns 3, 4, 5, 8 and 6, byte for byte. What
    // each cell asserts is unchanged, except 11.6, which was GREEN ON A DOUBLE THAT HID F-44.110 and now holds its cure.
    const HEARD = (json) => JSON.parse(json);
    // RE-PINNED (CE-45 LCV-12, P7 cut 2a): block_date is the door's. Turn 3's recorded hearing (the reason in client_as_spoken, no reason slot, no year) now
    // BLOCKS the day: the yearless date resolves future by the door's own read, client_as_spoken is ignored on a block, and with no reason_as_spoken the read-back
    // is B40's no-reason form from the row. The old B34 was the chain-out estate's; b104 §4 holds the block's own cells.
    { const r112 = one(await say('Block 20 March, personal', HEARD('{"acts":[{"act":"block_date","missing":["year"],"date_as_spoken":"20 March","client_as_spoken":"personal"}],"route":"task"}')));
      console.log('        (11.2 said: ' + JSON.stringify(r112) + ')');
      T('11.2 SAY "Block 20 March, personal" (heard as turn 3): the door blocks the day and reads B40 from the row, "Blocked: 20 March 2027." (P7 2a)', r112 === 'Blocked: 20 March 2027.'); }
    // 11.3 RE-PINNED (CE-45 LCV-14, P7 cut 4, labelled): turn 4's hearing is ANSWERED since cut 4, the week's lines or B74 (b108 §4 holds the lines), never B34.
    { const r113 = one(await say("What's due this week?", HEARD('{"acts":[{"act":"whatsdue","date_as_spoken":"this week"}],"route":"search"}')));
      T('11.3 SAY "What\'s due this week?" (heard as turn 4): the week, answered by the door (B73/B79 lines or B74), never B34 (P7 cut 4)', r113 === DL.LINES.B74 || /^(Due this week|This week): /.test(r113)); }
    const leadsBefore = db.tables['public.leads'].length;
    // RE-PINNED (CE-45 LCV-11, P6b first cut; F-44.96 closed): the guard is gone, so on turn 5's RECORDED hearing (the OLD ear: "Phone" dropped, the number
    // in amount_rupees, no phone slot) the door now FILES the lead as heard, "Walk P8", with NO number; the number never reaches the row because that ear
    // never returned it. The shipped ear returns phone_as_spoken (b101 3.1 replays that record); the shortened name is F-44.119, closed by R-44.41.
    // RE-PINNED AGAIN (the chair's ruling of 22 September, F-44.96's second half): the door reads her message itself; the ONE phone-shaped run is the phone.
    T('11.4 SAY "Add a new lead Walk P8 Phone, 9876543210" on turn 5\'s hearing (the number misfiled into amount_rupees): the door reads the run itself and files Walk P8 WITH +919876543210, B16', one(await say('Add a new lead Walk P8 Phone, 9876543210', HEARD('{"acts":[{"act":"lead","amount_rupees":9876543210,"client_as_spoken":"Walk P8"}],"route":"task"}'))) === 'Lead added: Walk P8.' && db.tables['public.leads'].length === leadsBefore + 1 && db.tables['public.leads'][leadsBefore].phone === '+919876543210');
    // RE-PINNED (CE-45 LCV-11, P6b first cut): relay is the door's; a nameless relay asks B35 (R-44.39). b101 4.11 to 4.14 replay the check's own rows for it.
    T('11.5 SAY "Send a message to my client asking for the advance": B35, the door\'s own question (relay covered at P6b)', one(await say('Send a message to my client asking for the advance', req([{ act: 'relay' }]))) === 'Which client? Say the name.');
    // 11.6 RE-PINNED (accepted by the chair before the build): its double returned `lead` ALONE; the live ear returned `lead` AND
    // `book_event` (turn 8), the door spoke B34 and filed nothing. Replayed verbatim, it is RED on 627323b and green with the drop.
    T('11.6 SAY "Add a new lead Walk P8 Fresh, wedding on 20 February 2027", HEARD AS TURN 8 (lead AND book_event): the lead is FILED, B17 (F-44.110)', one(await say('Add a new lead Walk P8 Fresh, wedding on 20 February 2027', HEARD('{"acts":[{"act":"lead","date_as_spoken":"20 February 2027","client_as_spoken":"Walk P8 Fresh"},{"act":"book_event","date_as_spoken":"20 February 2027","client_as_spoken":"Walk P8 Fresh"}],"route":"task"}'))) === 'Lead added: Walk P8 Fresh · 20 February 2027.');
    // 11.7 RE-PINNED (the third B-2 cut; R-44.40): one letter off a lead of hers now ASKS "Did you mean Walk P8 Fresh? Reply YES or NO.", and attaches nothing.
  T('11.7 SAY "Attach Photographs and film to Walk P8 Frsh" (misspelt by one letter): "Did you mean Walk P8 Fresh? Reply YES or NO." (R-44.40), nothing attached', one(await say('Attach Photographs and film to Walk P8 Frsh', req([{ act: 'attach_package', client_as_spoken: 'Walk P8 Frsh', package_as_spoken: 'Photographs and film' }]))) === 'Did you mean Walk P8 Fresh? Reply YES or NO.');
    T('11.8 SAY "Raise the invoice for Walk P8 Nobody": B15', one(await say('Raise the invoice for Walk P8 Nobody', req([{ act: 'invoice', client_as_spoken: 'Walk P8 Nobody' }]))) === 'Could not make the invoice. No client called Walk P8 Nobody.');
    // 11.9 RE-PINNED (CE-44 LCV-10 PART B-2, first cut): heard as NO ACT (turn 6, verbatim) it is still LEFTOVER; heard as booking_confirmed with no client it is now B35, his.
  T('11.9 SAY "The booking is confirmed": HEARD AS TURN 6 (no act at all) is LEFTOVER; heard as booking_confirmed with NO client it is B35 (R-44.39)', one(await say('The booking is confirmed', HEARD('{"acts":[],"route":"none"}'))).split('\n')[0] === DL.LINES.LEFTOVER && one(await say('The booking is confirmed', req([{ act: 'booking_confirmed' }]))) === 'Which client? Say the name.');
    T('11.10 SAY "No" with nothing waiting (21 September\'s turn 13, which Victor answered): LEFTOVER, by code', one(await say('No', req([], 'none'))).split('\n')[0] === DL.LINES.LEFTOVER);
    T('11.11 SAY "5 June 2027" heard as NO ACT (21 September\'s turns 10 and 21, which Victor answered in the door\'s sentences): LEFTOVER, by code, and nothing claims an attach', one(await say('5 June 2027', req([], 'none'))).split('\n')[0] === DL.LINES.LEFTOVER && db.tables['public.lead_packages'].length === 0);
    T('11.13 SAY "Yes" with nothing waiting: LEFTOVER, by code (decided by the closed yes/no list, before the listener)', one(await say('Yes', req([], 'none'))).split('\n')[0] === DL.LINES.LEFTOVER);
    // The card's one covered job end to end, in the SAME thread: the lead 11.6 filed is resolved by the REAL resolveLead and the package by the
    // door's own fold. attachPackage here is a double returning the row's shape; the REAL attachPackage holds this sentence at b92 14.3.
    const attachPackage = async (_s, _v, leadId, body) => { const row = { id: 'lp-1', lead_id: leadId, vendor_id: V.id, package_id: body.package_id, total: 80000, delivery_on: null, deleted_at: null, snapshot: { name: 'Photographs and film', delivery_basis: 'days' } }; db.tables['public.lead_packages'].push(row); return { status: 200, body: { ok: true, lead_package: row } }; };
    T('11.14 SAY "Attach Photographs and film to Walk P8 Fresh": the door still works end to end: "Package attached: Walk P8 Fresh · Photographs and film · Rs 80,000."', one(await say('Attach Photographs and film to Walk P8 Fresh', req([{ act: 'attach_package', client_as_spoken: 'Walk P8 Fresh', package_as_spoken: 'Photographs and film' }]), { attachPackage })) === 'Package attached: Walk P8 Fresh · Photographs and film · Rs 80,000.');
    T('11.12 the listener down: the glitch line', one(await say('Block 20 March, personal', 'FAIL')) === GLITCH);
  }

  console.log(`\n════════  b93 · ${pass} pass · ${fail} fail  ════════`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`  · ${f}`)); }
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('BENCH THREW (unexpected):', (e && e.stack) || e); process.exit(2); });
