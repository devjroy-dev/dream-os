'use strict';
// scripts/b130a_ask1_floor_bench.js  RUNG b130a · CE-45 ASK-1 cut 1 · THE FLOOR HALF (no model). THE EXIT CODE IS THE VERDICT.
// R-45.33: the question agent, READ-ONLY by construction. The read-first as ruled (sha256 8842dab2cda3...), K8 as ruled (the require
// graph PINNED, not claimed writer-free; read-only proven at runtime), d1 to d6 as ruled.
//   §1  every query a tool makes is scoped to the vendor CODE resolved (recorded filters), the one pinned exception named (d6)
//   §2  no look-alike studio B row ever reaches a result            §3  a model-supplied vendor_id is dropped
//   §4  empty records answer empty; a failed read answers 'unreadable', never an empty list (C-44.4)
//   §5  totals equal hand sums of the fixture                       §6  the caps (92 days, 40 rows) are said, not silent
//   §7  K8: the symbols pinned, the require graph pinned, no write token in the three files
//   §8  zero writes and zero sends over the WHOLE bank through the agent (a scripted model) and every tool
//   §9  the hand-off through the REAL preTurn and standIn: switch off byte-identical, switch on per (iv), notes first (E2)
//   §10 the money functions byte-identical to the base 1b37c26 by hash      §11 d4: the local matcher agrees with nearestName
//   §12 spokenRange                                                 §13 the agent's folds, persona guard, bounds
//   §14 seven mutations of PRODUCTION code, each reddening a named cell; a dirt check restores and gates (A-45.4)
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const src = (r) => fs.readFileSync(P(r), 'utf8');
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1')).join('\n');
let pass = 0; let fail = 0; const failed = [];
function T(name, cond, detail) { if (cond) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${detail ? `  (${detail})` : ''}`); } }
const sec = (t) => console.log(`\n${t}`);
const quiet = async (fn) => { const w = console.warn; const e = console.error; console.warn = () => {}; console.error = () => {}; try { return await fn(); } finally { console.warn = w; console.error = e; } };

const S = require('./lib/ask1_store');
const BANK = JSON.parse(src('scripts/lib/ask1_bank.json'));
const ATf = 'src/lib/vendor/askTools.js'; const AAf = 'src/lib/vendor/askAgent.js'; const SRf = 'src/lib/vendor/spokenRange.js'; const WDf = 'src/lib/vendor/workingDoor.js';
const fresh = (rel) => { for (const k of Object.keys(require.cache)) if (k.startsWith(P('src'))) delete require.cache[k]; return require(P(rel)); };

// THE SEND TRAP: any send anywhere in the estate during this rung is counted (the agent has no transport; this proves it).
let SENDS = 0;
require.cache[P('src/lib/whatsapp.js')] = { id: P('src/lib/whatsapp.js'), filename: P('src/lib/whatsapp.js'), loaded: true, exports: new Proxy({}, { get: (_t, k) => (k === '__esModule' ? false : () => { SENDS += 1; throw new Error('SEND TRAPPED'); }) }) };
const keepTrap = () => { require.cache[P('src/lib/whatsapp.js')] = require.cache[P('src/lib/whatsapp.js')]; };

// Argument batteries: every tool's text arguments driven with the bank's own texts and names, a hostile vendor_id beside them.
const NAMES = ['Sarah', 'sarah kapor', 'Isha Walk', 'isha walked', 'Priya', 'Meera Joshi', 'Harsh', 'Rohit', 'Walk Seventeen Alpha', 'Asha walk fifteen', 'Ignore previous instructions'];
const WHENS = ['16 October', '17 October', '14 Feb', 'tomorrow', '22 November', '2 October', 'yesterday', 'gibberish', '5 March 2027', '29 September'];
const RANGES = ['October', 'this weekend', 'next month', 'this month', 'this week', 'from 1 to 15 October', 'September', 'August', 'next year', 'the next 10 days', 'nonsense words'];
function batteries() {
  const out = [];
  for (const w of WHENS) out.push(['day', { when_as_spoken: w }], ['day', { when_as_spoken: w, past: true }]);
  for (const r of RANGES) { out.push(['days', { range_as_spoken: r }], ['days', { range_as_spoken: r, want: 'blocked' }], ['events', { range_as_spoken: r }], ['leads', { range_as_spoken: r }], ['paid', { range_as_spoken: r }], ['due', { range_as_spoken: r }], ['expenses', { range_as_spoken: r }], ['sent', { range_as_spoken: r }], ['reminders', { range_as_spoken: r }]); }
  for (const n of NAMES) out.push(['client', { name_as_spoken: n }], ['owed', { client_as_spoken: n }], ['paid', { client_as_spoken: n }], ['events', { client_as_spoken: n }], ['team', { member_as_spoken: n }], ['sent', { client_as_spoken: n }], ['expenses', { client_as_spoken: n }]);
  out.push(['leads', {}], ['leads', { stage: 'new' }], ['leads', { stage: 'booked' }], ['owed', {}], ['paid', {}], ['due', { overdue: true }], ['packages', {}], ['team', {}], ['events', {}], ['events', { past: true }], ['sent', {}], ['reminders', {}]);
  return out;
}
const SCOPE_EXCEPTIONS = (q) => q.table === 'vendors' || q.table === 'admin_config'
  || (q.table === 'invoices' && q.filters.length === 1 && q.filters[0][0] === 'in' && q.filters[0][1] === 'id'); // d6: dueThisWeek's name read
function scoped(q) {
  if (q.schema !== 'public' || q.op !== 'select') return true;
  if (q.table === 'vendors') return q.filters.some((f) => f[0] === 'eq' && f[1] === 'id' && f[2] === S.VA);
  if (SCOPE_EXCEPTIONS(q)) return true;
  return q.filters.some((f) => f[0] === 'eq' && f[1] === 'vendor_id' && f[2] === S.VA);
}

async function main() {
  const AT = fresh(ATf);
  sec('§1 §2 §3 scoping, leaks, hostile arguments, over the argument batteries');
  const store = S.makeStore();
  const ctx = { supabase: store.client, vendorId: S.VA, nowMs: S.NOW_MS };
  const bat = batteries();
  let unscoped = []; let leaks = []; let hostile = [];
  for (const [n, a] of bat) {
    store.reset();
    const r = await quiet(() => AT.runTool(ctx, n, a));
    const bad = store.calls.filter((q) => !scoped(q)); if (bad.length) unscoped.push(`${n} ${JSON.stringify(a)} ${bad[0].table}`);
    const j = JSON.stringify(r); if (S.LEAK_MARKS.some((m) => j.includes(m))) leaks.push(`${n} ${JSON.stringify(a)}`);
    const h = await quiet(() => AT.runTool(ctx, n, { ...a, vendor_id: S.VB, vendorId: S.VB }));
    if (JSON.stringify(h) !== j) hostile.push(`${n} ${JSON.stringify(a)}`);
  }
  T(`1.1 every query over ${bat.length} tool calls is scoped to the vendor code resolved (filters recorded), d6 the one exception`, unscoped.length === 0, unscoped.slice(0, 3).join(' | '));
  T('1.2 CONTROL: the batteries reached all 13 tools', new Set(bat.map((b) => b[0])).size === 13);
  { const t = new Set(); store.reset(); for (const [n, a] of bat.slice(0, 400)) await quiet(() => AT.runTool(ctx, n, a)); store.calls.forEach((q) => t.add(q.table)); T(`1.3 CONTROL: tables read ${t.size}`, t.size >= 12); }
  T('2.1 no studio B mark reaches any result', leaks.length === 0, leaks.slice(0, 3).join(' | '));
  { store.reset(); const r = await AT.runTool(ctx, 'client', { name_as_spoken: 'Sarah Kapoor' }); T('2.2 CONTROL: studio B holds a same-named client, and she is not returned', r.ok && r.matches === 1 && r.city === 'Udaipur' && S.fixture().leads.some((l) => l.vendor_id === S.VB && l.name === 'Sarah Kapoor')); }
  T('3.1 a model-supplied vendor_id or vendorId changes no result', hostile.length === 0, hostile.slice(0, 3).join(' | '));
  { const r = await AT.runTool({ supabase: store.client, vendorId: '', nowMs: S.NOW_MS }, 'packages', { vendor_id: S.VA }); T('3.2 no vendor in the context: refused, whatever the model says', r.ok === false && r.error === 'no_context'); }
  T('3.3 no tool schema names a vendor field', AT.TOOL_SCHEMAS.every((t) => !Object.keys(t.input_schema.properties).some((k) => /vendor/i.test(k)) && t.input_schema.additionalProperties === false) && AT.TOOL_SCHEMAS.length === 13);

  sec('§4 empty and failed reads');
  const empty = S.makeStore({ tables: { vendors: S.fixture().vendors } });
  const eCtx = { supabase: empty.client, vendorId: S.VA, nowMs: S.NOW_MS };
  const plain = [['day', { when_as_spoken: '16 October' }], ['days', { range_as_spoken: 'October' }], ['events', {}], ['client', { name_as_spoken: 'Sarah' }], ['leads', {}], ['leads', { stage: 'new' }], ['owed', {}], ['paid', {}], ['due', { range_as_spoken: 'this week' }], ['due', { range_as_spoken: 'October' }], ['expenses', {}], ['packages', {}], ['team', {}], ['sent', {}], ['reminders', {}]];
  const eo = []; for (const [n, a] of plain) eo.push([n, await quiet(() => AT.runTool(eCtx, n, a))]);
  T('4.1 empty records: every tool answers ok with nothing in it (never an error, never an invented row)', eo.every(([, r]) => r.ok === true), JSON.stringify(eo.filter(([, r]) => r.ok !== true).map(([n]) => n)));
  { const d = eo.find(([n]) => n === 'client')[1]; const o = eo.find(([n]) => n === 'owed')[1]; T('4.2 empty: no client matches, nothing owed (Rs 0 said as a figure)', d.matches === 0 && o.owed_total === 'Rs 0' && o.open_invoices === 0); }
  const TABLES = ['events', 'leads', 'clients', 'invoices', 'payment_schedules', 'expenses', 'vendor_packages', 'team_members', 'pending_couple_drafts', 'payment_reminders', 'contract_sends', 'tds_ledger', 'team_tasks', 'team_payments', 'lead_packages', 'vendors', 'payment_reminder_settings'];
  const failing = S.makeStore({ failTables: TABLES });
  const fo = []; for (const [n, a] of plain) fo.push([n, await quiet(() => AT.runTool({ supabase: failing.client, vendorId: S.VA, nowMs: S.NOW_MS }, n, a))]);
  T('4.3 every table failing: every tool answers unreadable, never an empty list', fo.every(([, r]) => r.ok === false && r.error === 'unreadable'), JSON.stringify(fo.filter(([, r]) => !(r.ok === false && r.error === 'unreadable')).map(([n, r]) => [n, r.error || 'ok'])));
  { const one = S.makeStore({ failTables: ['team_members'] }); const r = await quiet(() => AT.runTool({ supabase: one.client, vendorId: S.VA, nowMs: S.NOW_MS }, 'day', { when_as_spoken: '16 October' })); T('4.4 a JOINED read failing (the crew) fails the whole answer, never a crewless one', r.ok === false && r.error === 'unreadable'); }

  sec('§5 totals equal hand sums of the fixture');
  const R = async (n, a) => AT.runTool(ctx, n, a);
  { const f = S.fixture(); const hand = f.invoices.filter((i) => i.vendor_id === S.VA && ['unpaid', 'advance_paid'].includes(i.state)).reduce((s, i) => s + i.amount_total - i.amount_paid, 0); const r = await R('owed', {}); T(`5.1 owed total ${r.owed_total} equals the hand sum Rs ${hand}`, hand === 213000 && r.owed_total === 'Rs 2,13,000' && r.open_invoices === 2); }
  { const r = await R('paid', { range_as_spoken: 'this month' }); T('5.2 September received Rs 25,000, TDS Rs 2,500 (studio B\'s Rs 7,77,777 on the same day excluded)', r.received_total === 'Rs 25,000' && r.tds_total === 'Rs 2,500'); }
  { const r = await R('expenses', { range_as_spoken: 'September' }); T('5.3 September spent Rs 15,500 across 2', r.spent_total === 'Rs 15,500' && r.count === 2 && r.by_category.travel === 'Rs 12,000'); }
  { const r = await R('due', { range_as_spoken: 'this week' }); T('5.4 this week due Rs 76,000 (the door\'s own week reader)', r.due_total === 'Rs 76,000' && r.count === 1 && r.from === '26 September 2026' && r.to === '2 October 2026'); }
  { const r = await R('team', { member_as_spoken: 'harsh' }); T('5.5 Harsh: owed Rs 6,000, paid Rs 12,000, two shoots', r.owed_to_them === 'Rs 6,000' && r.paid_to_them === 'Rs 12,000' && r.shoots_count === 2); }
  { const r = await R('days', { range_as_spoken: 'October', want: 'blocked' }); T('5.6 October\'s blocks are 2 and 24 October', JSON.stringify(r.blocked) === JSON.stringify(['2 October 2026', '24 October 2026'])); }
  { const r = await R('day', { when_as_spoken: '14 Feb' }); T('5.7 d3: a day she blocked is "blocked" to her, with its reason', r.state === 'blocked' && r.blocks[0].reason === 'Personal'); }
  { const r = await R('day', { when_as_spoken: '22 November' }); T('5.8 a day: the time, client, city are the rows\'', r.events[0].time === '11:00 am' && r.events[0].client === 'Priya Mehta' && r.events[0].city === 'Gurgaon'); }

  sec('§6 the caps are said');
  { const r = await R('days', { range_as_spoken: 'next year' }); T('6.1 a range over 92 days is refused with the cap named', r.ok === false && r.error === 'range_too_long' && r.max_days === 92); }
  { const f = S.fixture(); for (let i = 0; i < 60; i += 1) f.leads.push({ ...f.leads[1], id: `lx-${i}`, name: `Extra Lead ${i}`, state: 'quoted' }); const big = S.makeStore({ tables: f }); const r = await AT.runTool({ supabase: big.client, vendorId: S.VA, nowMs: S.NOW_MS }, 'leads', { stage: 'quoted' }); T('6.2 a long list is cut at 40 and the rest counted, never silently', r.leads.length === 40 && r.more === 21 && r.count === 61); }

  sec('§7 K8: symbols pinned, graph pinned, no write token');
  const reqsOf = (rel) => [...code(src(rel)).matchAll(/(?:const\s+(\{[^}]*\}|\w+)\s*=\s*)?require\('([^']+)'\)(\.\w+)?/g)].map((m) => `${m[2]} ${m[1] ? m[1].replace(/\s+/g, '') : ''}${m[3] || ''}`).sort();
  const PIN = {
    [ATf]: ["../../api/public/availability {verdictOf}", "../witnessLine {longDateYear,rupees}", "./availability {listBlocks}", "./coupleDrafts {sentFor}", "./daySheet {readDaySpine}", "./dueWeek {dueThisWeek}", "./invoices {readOutstanding,OUTSTANDING_STATES}", "./istClock {istTodayISO}", "./leadFeed {newestLeads,newLeadsCount,NEWEST_CAP}", "./occupancy {describeDate}", "./spokenDate {resolveSpokenDate}", "./spokenRange {resolveSpokenRange,addDays}"],
    [AAf]: ["../llm {llmCreate}", "./askTools tools"],
    [SRf]: ["./spokenDate {resolveSpokenDate,todayIstIso}"],
  };
  for (const [f, want] of Object.entries(PIN)) T(`7.1 ${path.basename(f)} names exactly its pinned symbols`, JSON.stringify(reqsOf(f)) === JSON.stringify(want.slice().sort()), JSON.stringify(reqsOf(f)));
  const WRITE_TOKENS = /\.(insert|update|upsert|delete|rpc)\s*\(|sendWhatsApp|blockDate|unblockDate|writeEvent|createLead|recordPayment|markSent|stage\(/;
  T('7.2 no write, send or writer name in the code of the three files', [ATf, AAf, SRf].every((f) => !WRITE_TOKENS.test(code(src(f)))));
  // THE GRAPH, PINNED: every module under src/ that loading the agent and running every tool brings in, in a fresh process.
  const graph = execSync(`node -e "${[
    "process.env.SUPABASE_URL='http://x';process.env.SUPABASE_SERVICE_ROLE_KEY='x';",
    "const S=require('./scripts/lib/ask1_store');const A=require('./src/lib/vendor/askAgent');const AT=require('./src/lib/vendor/askTools');",
    "(async()=>{const s=S.makeStore();for(const n of AT.TOOL_NAMES){await AT.runTool({supabase:s.client,vendorId:S.VA,nowMs:S.NOW_MS},n,{when_as_spoken:'16 October',range_as_spoken:'this week',name_as_spoken:'Sarah'});}",
    "const R=process.cwd()+'/src/';console.log(JSON.stringify(Object.keys(require.cache).filter(k=>k.startsWith(R)).map(k=>'src/'+k.slice(R.length)).sort()))})()",
  ].join('')}"`, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n').pop();
  const GRAPH_PIN = ["src/agent/categories.js", "src/api/crew.js", "src/api/public/availability.js", "src/lib/asyncHandler.js", "src/lib/llm.js", "src/lib/response.js", "src/lib/vendor/askAgent.js", "src/lib/vendor/askTools.js", "src/lib/vendor/availability.js", "src/lib/vendor/categoryFraming.js", "src/lib/vendor/categoryProfiles.js", "src/lib/vendor/coupleDrafts.js", "src/lib/vendor/daySheet.js", "src/lib/vendor/dueWeek.js", "src/lib/vendor/eventWrite.js", "src/lib/vendor/invoices.js", "src/lib/vendor/istClock.js", "src/lib/vendor/occupancy.js", "src/lib/vendor/scrub.js", "src/lib/vendor/seal.js", "src/lib/vendor/snapshot.js", "src/lib/vendor/spokenDate.js", "src/lib/vendor/spokenRange.js", "src/lib/witnessLine.js"];
  const got = (() => { try { return JSON.parse(graph); } catch (_e) { return null; } })();
  const extra = got ? got.filter((g) => !GRAPH_PIN.includes(g)) : ['unparsed'];
  T(`7.3 the require graph is the PINNED graph (${got ? got.length : '?'} modules; writer-bearing: availability, eventWrite, invoices, coupleDrafts named and taken for readers only)`, got && extra.length === 0 && GRAPH_PIN.every((g) => got.includes(g)), `new: ${extra.join(', ')} missing: ${got ? GRAPH_PIN.filter((g) => !got.includes(g)).join(', ') : ''}`);

  sec('§8 zero writes, zero sends: the whole bank through the agent, a scripted model calling tools with her words');
  const A = fresh(AAf); keepTrap();
  const ATs = require(P(ATf));
  const bstore = S.makeStore();
  let asked = 0; let okAnswers = 0;
  const scripted = (q) => { let round = 0; return async () => { round += 1; if (round === 1) return { usage: { input_tokens: 10, output_tokens: 5 }, content: [{ type: 'tool_use', id: 't1', name: 'client', input: { name_as_spoken: q.text, vendor_id: S.VB } }, { type: 'tool_use', id: 't2', name: 'days', input: { range_as_spoken: q.text } }, { type: 'tool_use', id: 't3', name: 'owed', input: { client_as_spoken: q.text } }] }; if (round === 2) return { usage: { input_tokens: 10, output_tokens: 5 }, content: [{ type: 'tool_use', id: 't4', name: 'day', input: { when_as_spoken: q.text } }, { type: 'tool_use', id: 't5', name: 'sent', input: {} }] }; return { usage: { input_tokens: 10, output_tokens: 5 }, content: [{ type: 'text', text: 'From your records.' }] }; }; };
  for (const q of BANK.questions) {
    asked += 1;
    const r = await quiet(() => A.answerQuestion({ supabase: bstore.client, vendorId: S.VA, agentId: 'ag', lane: 'pwa', message: q.text, threadId: null, seat: { provider: 'anthropic', model: 'm' } }, { llmCreate: scripted(q), nowMs: S.NOW_MS }));
    if (r.ok) okAnswers += 1;
  }
  for (const [n, a] of bat) await quiet(() => ATs.runTool({ supabase: bstore.client, vendorId: S.VA, nowMs: S.NOW_MS }, n, a));
  T(`8.1 ${asked} bank questions and ${bat.length} tool calls: ZERO writes of any kind`, bstore.writes().length === 0 && bstore.calls.length > 1000, `writes ${bstore.writes().length}, calls ${bstore.calls.length}`);
  T('8.2 ZERO sends (the estate\'s transport is trapped for the whole rung)', SENDS === 0);
  T(`8.3 CONTROL: the scripted model answered through the loop (${okAnswers} of ${asked})`, okAnswers === asked);

  sec('§9 the hand-off through the REAL preTurn and standIn');
  const WD = fresh(WDf); keepTrap();
  const AG = 'ag-1';
  const V = { id: S.VA, business_name: 'Dev Roy Photography' };
  const ROUTE = { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' };
  const earOf = (request) => async () => ({ usage: { input_tokens: 3, output_tokens: 2 }, content: [{ type: 'tool_use', id: 'e', name: 'ear_request', input: request }] });
  const world = () => { const f = S.fixture(); f.pending_money_acts = []; return S.makeStore({ tables: f, engine: { conversations: [{ id: 'cv-1', agent_id: AG, state: 'active', last_active_at: '2026-09-26T06:00:00Z' }], messages: [] } }); };
  const decide = async (message, request, askOn, lane = 'pwa', db = world()) => ({ db, out: await quiet(() => WD.preTurn({ supabase: db.client, vendor: V, agentId: AG, route: ROUTE, message, lane }, { llmCreate: earOf(request), nowMs: S.NOW_MS, ...(askOn === undefined ? {} : { askOn: async () => askOn }) })) });
  const RQ = {
    find: { route: 'search', acts: [{ act: 'find' }] },
    tally: { route: 'search', acts: [{ act: 'tally' }] },
    none: { route: 'none', acts: [] },
    note: { route: 'task', acts: [{ act: 'note', client_as_spoken: 'Isha Walk Fourteen' }] },
    mixed: { route: 'task', acts: [{ act: 'tally' }, { act: 'payment_reminder', client_as_spoken: 'Sarah Kapoor' }] },
  };
  const strip = (o) => JSON.stringify(o, (k, v) => (k === 'usage' ? undefined : v));
  for (const [k, rq] of Object.entries(RQ)) {
    const a = await decide('What are my blocked days', rq, undefined); const b = await decide('What are my blocked days', rq, false);
    T(`9.1 ${k}: switch OFF (the flag unread, then read false) preTurn's answer is the same and carries no ask`, strip(a.out) === strip(b.out) && !('ask' in a.out) && !('ask' in b.out));
  }
  { const { out } = await decide('What are my blocked days', RQ.find, true); T('9.2 route search, switch ON: not door, why question, the context is code\'s (vendor, lane, her words, the primary seat)', out.door === false && out.why === 'question' && out.ask && out.ask.vendorId === S.VA && out.ask.lane === 'pwa' && out.ask.message === 'What are my blocked days' && out.ask.seat.model === ROUTE.model && out.ask.agentId === AG); }
  { const { out } = await decide('hello there', RQ.none, true); T('9.3 no act heard, switch ON: the agent\'s (uncovered, with ask)', out.door === false && out.why === 'uncovered' && !!out.ask); }
  { const { out } = await decide('Add a note to Isha Walk Fourteen', RQ.note, true); T('9.4 an action-only uncovered turn stays the door\'s B34, switch ON', out.door === false && out.why === 'uncovered' && !out.ask); }
  { const { out } = await decide('Who owes me, and remind Sarah Kapoor', RQ.mixed, true); T('9.5 a question beside an action, switch ON: the agent\'s', out.door === false && !!out.ask); }
  { const { out } = await decide('What are my blocked days', RQ.find, true, 'whatsapp'); T('9.6 the WhatsApp lane carries its own lane in the context', out.ask && out.ask.lane === 'whatsapp'); }
  { const f = S.fixture(); f.admin_config = [{ key: 'vendor.ask_agent.pwa', value: 'true' }]; require(P('src/lib/laneFlags.js'))._resetLaneFlagCache(); const db = S.makeStore({ tables: f, engine: { conversations: [], messages: [] } }); const { out } = await decide('What are my blocked days', RQ.find, undefined, 'pwa', db); const w = await decide('What are my blocked days', RQ.find, undefined, 'whatsapp', db); require(P('src/lib/laneFlags.js'))._resetLaneFlagCache(); T('9.7 the REAL switch: the pwa key ON reaches the agent on pwa only; the whatsapp key absent leaves WhatsApp as it was', !!out.ask && !w.out.ask); }
  // E2 BY CONSTRUCTION: every note branch precedes the two exits that set `ask`, and both exits sit inside `if (!fromNote) {`.
  { const s = code(src(WDf)); const pre = s.slice(s.indexOf('async function preTurn'), s.indexOf('async function preTurn') + 80000); const nf = pre.indexOf('if (!fromNote) {'); const a1 = pre.indexOf('await askContext('); const a2 = pre.indexOf('await uncoveredAsk('); const lastNote = Math.max(pre.lastIndexOf('note_declined', nf), pre.lastIndexOf('fromNote = {', nf), pre.lastIndexOf('answerProposals(', nf), pre.lastIndexOf('if (fromNote) { const ask = askName(fromNote, 0)', nf)); const close = pre.indexOf('} else st.answered = note.asked;'); T('9.8 E2: every note branch comes before the hand-off, and both hand-offs sit inside the no-note block', nf > 0 && lastNote > 0 && lastNote < nf && a1 > nf && a2 > nf && a1 < close && a2 < close && (pre.slice(0, close).match(/askContext\(/g) || []).length === 1 && (pre.slice(0, close).match(/uncoveredAsk\(/g) || []).length === 1); }
  // E2 AT RUNTIME, one cell per pick note ELZ-1's cut 2c added (B8, B10, B24, B61, B53C): her bare "2" after the door's numbered
  // list, heard by the ear at its WORST (route 'search', no act), with the switch ON, is the NOTE's, never the agent's. The note
  // rides the last door row exactly as persistDoorTurn writes it (meta.listener.door true, meta.listener.note).
  const PICKS = {
    B8: { asked: 'B8', acts: [{ act: 'invoice', client_as_spoken: 'Priya' }], tries: 0, lead_ids: ['la-priya', 'la-priya2'], pick_name: 'Priya' },
    B10: { asked: 'B10', acts: [{ act: 'invoice', client_as_spoken: 'Sarah Kapoor' }], tries: 0, invoice_ids: ['ia-sarah', 'ia-priya'] },
    B24: { asked: 'B24', acts: [{ act: 'attach_package', client_as_spoken: 'Isha Walk Fourteen', package_as_spoken: 'Classic' }], tries: 0, package_ids: ['pa-classic', 'pa-haldi'] },
    B61: { asked: 'B61', acts: [{ act: 'assign_crew', client_as_spoken: 'Sarah Kapoor', member_as_spoken: 'Harsh' }], tries: 0, pick_ids: ['ma-harsh', 'ma-kavya'] },
    B53C: { asked: 'B53C', acts: [{ act: 'assign_crew', client_as_spoken: 'Sarah Kapoor', member_as_spoken: 'Harsh' }], tries: 0, pick_ids: ['ea-sarah-sangeet', 'ea-sarah-wed'] },
  };
  const noted = (note) => { const f = S.fixture(); f.pending_money_acts = []; return S.makeStore({ tables: f, engine: { conversations: [{ id: 'cv-1', agent_id: AG, state: 'active', last_active_at: '2026-09-26T06:00:00Z' }], messages: [{ id: 'm-1', conversation_id: 'cv-1', role: 'assistant', content: 'Which one? 1 or 2', created_at: '2026-09-26T06:25:00Z', meta: { listener: { door: true, note } } }] } }); };
  for (const [k, note] of Object.entries(PICKS)) {
    T(`9.14 CONTROL ${k}: the seeded note is one the door reads as live (validNote keeps it)`, !!WD.validNote && !!WD.validNote(note) || (() => { try { return !!require(P(WDf)).validNote(note); } catch (_e) { return false; } })());
    const { out } = await decide('2', { route: 'search', acts: [] }, true, 'pwa', noted(note));
    T(`9.15 E2 ${k}: her bare "2" after the pick list, heard as a search, switch ON, is the note's (no ask; answered ${out && (out.answered || out.why)})`, !!out && !out.ask && out.why !== 'question');
  }
  { const { out } = await decide('2', { route: 'search', acts: [] }, true); T('9.16 CONTROL: the same "2" with NO note, switch ON, is the agent\'s (so 9.15 is not vacuous)', !!out.ask && out.why === 'question'); }
  // standIn
  const OK_AGENT = { answerQuestion: async (c) => ({ ok: true, reply: `Your blocked days: 2 October 2026 (${c.vendorId})`, usage: { input_tokens: 100, output_tokens: 20 }, model: c.seat.model, calls: [{ name: 'days', input: {}, result: { ok: true } }] }) };
  const BAD_AGENT = { answerQuestion: async () => ({ ok: false, error: 'ask timed out', usage: { input_tokens: 50, output_tokens: 0 }, calls: [] }) };
  { const { db, out } = await decide('What are my blocked days', RQ.find, true); const st = await quiet(() => WD.standIn({ supabase: db.client, out }, { ask: OK_AGENT })); T('9.9 standIn hands the question to the agent: door, key ASK, its words, its spend carried', st.door === true && st.keys[0] === 'ASK' && st.reply.includes(S.VA) && st.askUsage.input_tokens === 100 && st.askRecord.calls.length === 1 && st.skipHarvest === true && Array.isArray(st.toolCalls) && st.toolCalls.length === 0); }
  { const { db, out } = await decide('What are my blocked days', RQ.find, true); const st = await quiet(() => WD.standIn({ supabase: db.client, out }, { ask: BAD_AGENT })); const g = (() => { try { return require(P('src/api/vendor-engine/chat.js')).STAGE2_LINE_MUTATION; } catch (_e) { return null; } })(); T('9.10 the agent failing: the founder\'s glitch line, the failure recorded, never a guess', st.door === true && st.keys[0] === 'GLITCH' && (!g || st.reply === g) && st.askRecord.error === 'ask timed out'); }
  { const { db, out } = await decide('What are my blocked days', RQ.find, false); const a = await quiet(() => WD.standIn({ supabase: db.client, out })); T('9.11 no ask on the turn: standIn exactly as before (B34 on lookup, or the lookups\' own door)', a.door === true && a.keys[0] !== 'ASK'); }
  { const rows = []; const meter = { harvestMeterRow: (r, m) => ({ model: m, input_tokens: (r.usage || {}).input_tokens || 0 }), writeHarvestUsage: async (_s, _a, m) => { rows.push(m); } }; const memory = { getOrCreateConversation: async () => ({ conversationId: 'cv-1' }), saveMessage: async () => 'msg-1' }; const db = world(); const out = { door: true, reply: 'x', keys: ['ASK'], toolCalls: [], ear: { seat: { provider: 'anthropic', model: 'ear-model' }, request: RQ.find, usage: { input_tokens: 3 } }, askUsage: { input_tokens: 100 }, askModel: 'agent-model', askRecord: { calls: [] } }; await quiet(() => WD.persistDoorTurn({ supabase: db.client, agentId: AG, message: 'q', out, lane: 'pwa' }, { memory, meter })); T('9.12 d2: the ear\'s row counted (conversation id), the agent\'s its own UNCOUNTED row on its own model', rows.length === 2 && rows[0].conversation_id === 'cv-1' && rows[0].model === 'ear-model' && !rows[1].conversation_id && rows[1].model === 'agent-model' && rows[1].input_tokens === 100); const rows2 = rows.length; rows.length = 0; await quiet(() => WD.persistDoorTurn({ supabase: db.client, agentId: AG, message: 'q', out: { ...out, askUsage: null }, lane: 'pwa' }, { memory, meter })); T('9.13 no agent spend: one row, as before', rows.length === 1 && rows2 === 2); }

  sec('§10 the money functions, byte-identical to the base 1b37c26');
  const base = execSync('git show 1b37c26:src/lib/vendor/workingDoor.js', { cwd: ROOT, encoding: 'utf8' });
  const fnText = (s, name) => { const i = s.indexOf(`async function ${name}(`); if (i < 0) return null; let d = 0; let j = s.indexOf('{', i); for (let k = j; k < s.length; k += 1) { if (s[k] === '{') d += 1; else if (s[k] === '}') { d -= 1; if (!d) return s.slice(i, k + 1); } } return null; };
  for (const fn of ['planMoney', 'planPayment', 'planBooking', 'applyRow']) { const a = fnText(base, fn); const b = fnText(src(WDf), fn); T(`10.1 ${fn} byte-identical (sha256 ${a ? sha(a).slice(0, 12) : '?'})`, !!a && a === b); }
  T('10.2 lifecycleHands.js byte-identical to the base 1b37c26', execSync('git rev-parse 1b37c26:src/lib/vendor/lifecycleHands.js', { cwd: ROOT, encoding: 'utf8' }).trim() === execSync('git hash-object src/lib/vendor/lifecycleHands.js', { cwd: ROOT, encoding: 'utf8' }).trim());

  sec('§11 d4: the local matcher and the door\'s nearestName agree on the bank\'s names');
  { const people = S.fixture().leads.filter((l) => l.vendor_id === S.VA && !l.deleted_at).map((l) => ({ id: l.id, name: l.name })); const said = [...new Set([...NAMES, 'Isha Walk Fourten', 'Sarah Kapor', 'Asha Walk Fiftteen', 'Priya Mehtaa', 'Ravi Walk Thirten', 'Meera Josh'])]; const dis = []; for (const w of said) { const near = WD.nearestName(w, people); const mine = AT.matchNames(w, people); if (near && !mine.some((m) => m.id === near.id)) dis.push(`${w} -> door ${near.name}, mine ${mine.map((m) => m.name).join('/') || 'none'}`); } dis.forEach((d) => console.log(`        disagreement: ${d}`)); T(`11.1 wherever the door would offer "Did you mean", the local matcher finds the same person (${said.length} names)`, dis.length === 0); }

  sec('§12 spokenRange');
  const SR = require(P(SRf));
  const r = (w, o = {}) => { const x = SR.resolveSpokenRange(w, { todayIso: S.TODAY, ...o }); return x.ok ? `${x.from}..${x.to}` : `x:${x.reason}`; };
  const cases = [['October', '2026-10-01..2026-10-31'], ['january', '2027-01-01..2027-01-31'], ['September', '2026-09-01..2026-09-30'], ['August', '2027-08-01..2027-08-31'], ['this weekend', '2026-09-26..2026-09-27'], ['next month', '2026-10-01..2026-10-31'], ['this week', '2026-09-26..2026-10-02'], ['from 3 to 9 March', '2027-03-03..2027-03-09'], ['the next 10 days', '2026-09-26..2026-10-05'], ['Feb 2028', '2028-02-01..2028-02-29'], ['bananas', 'x:unreadable'], ['', 'x:none'], ['9 to 3 March', 'x:unreadable']];
  for (const [w, want] of cases) T(`12.1 "${w}" reads ${want}`, r(w) === want, r(w));
  T('12.2 a past month, asked about the past, is last year\'s or this', r('November', { direction: 'past' }) === '2025-11-01..2025-11-30' && r('August', { direction: 'past' }) === '2026-08-01..2026-08-31');

  sec('§13 the agent: folds, persona guard, bounds');
  T('13.1 markdown removed, a list kept one per line', A.plain('**Blocked:**\n- 2 October 2026\n- 24 October 2026') === 'Blocked:\n2 October 2026\n24 October 2026');
  T('13.2 dashes folded: a range reads "to", any other dash a comma', A.undash('Free 3\u20139 March \u2014 and 12') === 'Free 3 to 9 March, and 12');
  T('13.3 the persona guard fails a self-naming reply and passes a client named Victor', A.PERSONA.test("I'm your assistant.") && A.PERSONA.test('I am Victor.') && !A.PERSONA.test('Victor Das paid Rs 20,000 on 5 August 2026.') && !A.PERSONA.test('Harsh is your second assistant on the shoot.'));
  { const st = S.makeStore(); const loop = async () => ({ content: [{ type: 'tool_use', id: 'x', name: 'packages', input: {} }] }); const x = await A.answerQuestion({ supabase: st.client, vendorId: S.VA, message: 'q', seat: { provider: 'anthropic', model: 'm' } }, { llmCreate: loop, nowMs: S.NOW_MS }); T('13.4 a model that never stops calling tools is stopped at 4 rounds, not answered', x.ok === false && x.error === 'too_many_rounds'); }
  { const st = S.makeStore(); const slow = () => new Promise((res) => setTimeout(() => res({ content: [{ type: 'text', text: 'late' }] }), 300)); const x = await A.answerQuestion({ supabase: st.client, vendorId: S.VA, message: 'q', seat: { provider: 'anthropic', model: 'm' } }, { llmCreate: slow, turnMs: 50 }); T('13.5 the deadline: a slow model is a failure, never a late answer', x.ok === false && /timed out/.test(x.error)); }
  { const x = await A.answerQuestion({ supabase: S.makeStore().client, vendorId: S.VA, message: 'q', seat: {} }); T('13.6 no seat: refused before any call', x.ok === false && x.error === 'no_seat'); }
  { const st = S.makeStore(); const said = async () => ({ content: [{ type: 'text', text: "I'm your assistant. You have 2 packages." }] }); const x = await A.answerQuestion({ supabase: st.client, vendorId: S.VA, message: 'q', seat: { provider: 'anthropic', model: 'm' } }, { llmCreate: said }); T('13.7 a self-naming reply fails closed', x.ok === false && x.error === 'persona'); }
  { const st = S.makeStore(); let n = 0; const many = async () => { n += 1; return n === 1 ? { content: Array.from({ length: 6 }, (_v, i) => ({ type: 'tool_use', id: `u${i}`, name: 'packages', input: {} })) } : { content: [{ type: 'text', text: 'ok' }] }; }; st.reset(); const x = await A.answerQuestion({ supabase: st.client, vendorId: S.VA, message: 'q', seat: { provider: 'anthropic', model: 'm' } }, { llmCreate: many, nowMs: S.NOW_MS }); T('13.8 at most 4 tool calls run per round; the rest are refused, not run', x.ok && x.calls.filter((c) => c.result.ok).length === 4 && x.calls.filter((c) => c.result.error === 'too_many_calls').length === 2); }

  sec('§14 mutations of production code (each must redden its cell)');
  const before = Object.fromEntries([ATf, WDf].map((f) => [f, sha(src(f))]));
  const muts = [
    ['M1 a tool\'s vendor filter removed (packages): reddens 1.1', ATf, ".from('vendor_packages').select('name, description, line_items, total, deposit_pct, middle_pct, middle_enabled, delivery_basis, delivery_days, is_default').eq('vendor_id', ctx.vendorId)", ".from('vendor_packages').select('name, description, line_items, total, deposit_pct, middle_pct, middle_enabled, delivery_basis, delivery_days, is_default')",
      async (M) => { const st = S.makeStore(); await M.runTool({ supabase: st.client, vendorId: S.VA, nowMs: S.NOW_MS }, 'packages', {}); return st.calls.every(scoped); }],
    ['M2 a write added to a tool (packages): reddens 8.1', ATf, "  async run(ctx) {\n    const { data, error } = await ctx.supabase.from('vendor_packages')", "  async run(ctx) {\n    await ctx.supabase.from('vendor_packages').update({ is_default: false });\n    const { data, error } = await ctx.supabase.from('vendor_packages')",
      async (M) => { const st = S.makeStore(); await M.runTool({ supabase: st.client, vendorId: S.VA, nowMs: S.NOW_MS }, 'packages', {}); return st.writes().length === 0; }],
    ['M3 the vendor taken from the model\'s arguments: reddens 3.1', ATf, 'return await t.run({ supabase: ctx.supabase, vendorId: ctx.vendorId, nowMs: ctx.nowMs }, args);', 'return await t.run({ supabase: ctx.supabase, vendorId: (input && input.vendor_id) || ctx.vendorId, nowMs: ctx.nowMs }, args);',
      async (M) => { const st = S.makeStore(); const a = JSON.stringify(await M.runTool({ supabase: st.client, vendorId: S.VA, nowMs: S.NOW_MS }, 'packages', {})); const b = JSON.stringify(await M.runTool({ supabase: st.client, vendorId: S.VA, nowMs: S.NOW_MS }, 'packages', { vendor_id: S.VB })); return a === b; }],
    ['M4 an action-only turn handed to the agent: reddens 9.4', WDf, 'return (questionTurn(heard) && await uncoveredAsk(', 'return (true && await uncoveredAsk(',
      async (M) => { const db = world(); const out = await quiet(() => M.preTurn({ supabase: db.client, vendor: V, agentId: AG, route: ROUTE, message: 'Add a note to Isha Walk Fourteen', lane: 'pwa' }, { llmCreate: earOf(RQ.note), nowMs: S.NOW_MS, askOn: async () => true })); return !out.ask; }],
    ['M5 the switch read inverted: reddens 9.1', WDf, '    if (on !== true) return null;', '    if (on === true) return null;',
      async (M) => { const db = world(); const out = await quiet(() => M.preTurn({ supabase: db.client, vendor: V, agentId: AG, route: ROUTE, message: 'What are my blocked days', lane: 'pwa' }, { llmCreate: earOf(RQ.find), nowMs: S.NOW_MS, askOn: async () => false })); return !out.ask; }],
    ['M6 a total wrong (owed summed over the first invoice only): reddens 5.1', ATf, 'const total = rows.reduce((s, x) => s + x.amount_owed, 0);', 'const total = rows.slice(0, 1).reduce((s, x) => s + x.amount_owed, 0);',
      async (M) => { const st = S.makeStore(); const x = await M.runTool({ supabase: st.client, vendorId: S.VA, nowMs: S.NOW_MS }, 'owed', {}); return x.owed_total === 'Rs 2,13,000'; }],
    ['M7 a writer imported by the tools: reddens 7.1 and 7.2', ATf, "const { istTodayISO } = require('./istClock');", "const { istTodayISO } = require('./istClock');\nconst { blockDate } = require('./availability');",
      async () => JSON.stringify(reqsOf(ATf)) === JSON.stringify(PIN[ATf].slice().sort()) && !WRITE_TOKENS.test(code(src(ATf)))],
  ];
  for (const [name, rel, from, to, check] of muts) {
    const orig = src(rel);
    let reddened = false; let note = '';
    try {
      if (orig.split(from).length !== 2) { note = 'anchor not unique or absent'; }
      else {
        fs.writeFileSync(P(rel), orig.replace(from, to));
        const M = fresh(rel); keepTrap();
        const held = await quiet(() => check(M));
        reddened = held === false;
      }
    } catch (e) { note = e.message; reddened = true; }
    finally { fs.writeFileSync(P(rel), orig); fresh(rel); keepTrap(); }
    T(`14 ${name}`, reddened, note);
  }
  const dirt = execSync('git status --porcelain -- src/lib/vendor/askTools.js src/lib/vendor/workingDoor.js', { cwd: ROOT, encoding: 'utf8' });
  const restored = [ATf, WDf].every((f) => sha(src(f)) === before[f]);
  T('14.8 every mutated file restored to its pre-mutation sha256 (A-45.4\'s dirt check gates the verdict)', restored, dirt.trim());

  console.log(`\nb130a_ask1_floor_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`  ${f}`)); }
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.log(`b130a ERROR ${e && e.stack}`); process.exit(2); });
