#!/usr/bin/env node
'use strict';
// scripts/b117a_elz1_couple_bench.js  RUNG b117a · CE-45 ELZ-1 cut 1 · THE FLOOR HALF (deterministic; reads no model).
//
// WHAT IT PROVES (R-45.26, the chair's ruling on read-first r2): code supplies FACTS to Eliza and never words.
//   §1 FACT 1  whether the client is already in conversation, from the thread's WHOLE record (F-44.125; BS-1 §11 rule 1), replayed
//              from the founder's 24 September thread: the 15:00:30 UTC "Hi" and the 18:17:37 UTC date question
//   §2 FACT 2  the vendor's trade as written, raw and folded, with the trade's questions; profileFor() untouched for other readers
//   §3 FACT 3  a date's state from the /v page's one reader: four states, no sentence, no write (R-45.25; F1-r2 ruled)
//   §4 FACT 4  the studio's name at every reader (F-44.157)
//   §5 F-44.145 the bride lane's opt-out reads the whole message
//   §6 the register: no em dash, no "assistant" self-description, never the owner's name, in every composed branch
//   §7 the money functions byte-identical to b115's pins
//   §8 mutations of production code, each reddening its cell
// THE REPLAY'S ROWS: his walk export (sha256 9dd7e3f2bd72, 6 rows, 15:00:20 to 18:17:42 UTC) and, for 14:40 UTC (20:10 IST), the
// three rows his screenshots show (0bfe907a4d40 / 0d3d067f1a3c: the relayed template, his "Reply" tap, Eliza's question), marked
// as transcribed. The card's first SELECT reads the true rows; the walk closes it.
// CLOCK (C-44.13): it reads no real clock. Date.now is pinned inside each replay to the recorded moment, and every date_state call
// passes nowMs, so the rung returns the same on any machine clock.
// Run: node scripts/b117a_elz1_couple_bench.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
const sha = (t) => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

let pass = 0; let fail = 0; const failed = [];
function T(n, c) { if (c) { pass += 1; console.log(`  PASS  ${n}`); } else { fail += 1; failed.push(n); console.log(`  FAIL  ${n}`); } }
const sec = (t) => console.log(`\n${t}`);

// ── the model double: records what the model was handed; answers as scripted ──
const CAPTURED = [];
let SCRIPT = [];
const llmPath = require.resolve(P('src/lib/llm.js'));
const realLlm = require(llmPath);
require.cache[llmPath].exports = {
  ...realLlm,
  llmCreate: async (provider, params) => {
    CAPTURED.push({ provider, params: JSON.parse(JSON.stringify(params)) });
    const step = SCRIPT.shift() || { name: 'respond_to_couple', input: { message: 'ok' } };
    return { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: `t${CAPTURED.length}`, ...step }], usage: { input_tokens: 1, output_tokens: 1 } };
  },
};

// ── the occupancy double for FACT 3 (describeDate is the reader; its own benches prove it) ──
let DESCRIBE = null;
const occPath = require.resolve(P('src/lib/vendor/occupancy.js'));
const realOcc = require(occPath);
require.cache[occPath].exports = { ...realOcc, describeDate: async (ctx) => (typeof DESCRIBE === 'function' ? DESCRIBE(ctx) : DESCRIBE) };

// ── the store double (C-44.3: rows shaped as Postgres returns them; timestamps as text) ──
function store({ rows = [], lead = null, vendorRow = null } = {}) {
  return {
    from(table) {
      const q = { eqs: {}, gte: null };
      const api = {
        select: () => api,
        eq: (c, v) => { q.eqs[c] = v; return api; },
        gte: (c, v) => { q.gte = v; return api; },
        order: () => api,
        in: () => api,
        insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'x' } }) }) }),
        update: () => api,
        async limit(n) {
          if (table !== 'messages') return { data: [] };
          const mine = rows.filter((r) => r.conversation_id === q.eqs.conversation_id)
            .filter((r) => (q.gte ? Date.parse(r.created_at) >= Date.parse(q.gte) : true))
            .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
          return { data: mine.slice(0, n) };
        },
        async maybeSingle() {
          if (table === 'leads') return { data: lead };
          if (table === 'vendors') return { data: vendorRow };
          return { data: null };
        },
      };
      return api;
    },
  };
}

const C = 'conv-sarah';
const row = (created_at, direction, sent_by, body) => ({ conversation_id: C, created_at, direction, sent_by, body });
// his export, verbatim bodies (sha256 9dd7e3f2bd72)
const EXPORT = [
  row('2026-09-24 15:00:20.817248+00', 'outbound', 'vendor_relay', 'Hi Sarah!'),
  row('2026-09-24 15:00:30.512624+00', 'inbound', 'couple', 'Hi'),
  row('2026-09-24 15:00:34.5493+00', 'outbound', 'agent', "Hi Sarah! I'm Dev Roy's assistant — is your event spread across functions like mehendi, sangeet, wedding, reception, or is it a single day?"),
  row('2026-09-24 16:35:01.291319+00', 'outbound', 'vendor_relay', 'Hi Sarah!'),
  row('2026-09-24 18:17:37.16968+00', 'inbound', 'couple', 'Hi, are you available on 5 march 2028 for our wedding in delhi?'),
];
// transcribed from his screenshots (20:10 IST = 14:40 UTC; seconds unknown, minute as shown)
const SCREENSHOT_1440 = [
  row('2026-09-24 14:40:00+00', 'outbound', 'vendor_relay', 'Hi Sarah!'),
  row('2026-09-24 14:40:20+00', 'inbound', 'couple', 'Reply'),
  row('2026-09-24 14:40:30+00', 'outbound', 'agent', "I'm Dev Roy's assistant — are you planning a single wedding day or functions spread across multiple days like mehendi, sangeet, wedding, reception?"),
];
const DEV440 = { id: 'v-dev440', business_name: 'Dev Roy Photography', category: 'Photographer', city: 'Delhi', open_to_travel: true };
const DEVUSER = { name: 'Dev Roy', phone: '+910000000000' };

const MINE = ['src/agent/engine.js', 'src/agent/coupleSystemPrompt.js', 'src/agent/coupleThreadFacts.js', 'src/agent/studioName.js', 'src/lib/vendor/coupleDateState.js', 'src/lib/vendor/categoryProfiles.js'];
function purge() { for (const r of MINE) delete require.cache[require.resolve(P(r))]; }
function fresh(rel) { purge(); return require(P(rel)); }
function engine() { return fresh('src/agent/engine.js'); }
async function replay({ at, inbound, rows, vendor = DEV440, lead = null, script = [], vendorRow = null }) {
  const realNow = Date.now;
  Date.now = () => Date.parse(at);
  CAPTURED.length = 0; SCRIPT = script.slice();
  try {
    const { runCoupleAgenticTurn } = engine();
    const out = await runCoupleAgenticTurn({ vendor, vendorUser: DEVUSER, conversation: { id: C }, couplePhone: '919625759924', coupleId: null, inboundMessage: inbound, supabase: store({ rows, lead, vendorRow }), anthropic: null });
    return { out, calls: CAPTURED.slice() };
  } finally { Date.now = realNow; }
}
const upTo = (rows, at) => rows.filter((r) => Date.parse(r.created_at) <= Date.parse(at));

// ── mutations: write the file, run the cell, restore (a stale anchor exits 2: a mutation that applies to nothing proves nothing) ──
async function mutated(rel, from, to, fn) {
  const f = P(rel); const before = fs.readFileSync(f, 'utf8');
  if (!before.includes(from)) { console.error(`MUTATION ANCHOR STALE in ${rel}: ${from.slice(0, 60)}`); process.exit(2); }
  fs.writeFileSync(f, before.replace(from, to)); purge();
  try { return await fn(); } finally { fs.writeFileSync(f, before); purge(); }
}

(async () => {
  const ALL = [...SCREENSHOT_1440, ...EXPORT];
  const facts = require(P('src/agent/coupleThreadFacts.js'));

  sec('1 FACT 1 · in conversation, from the thread\'s whole record (F-44.125)');
  const f1 = facts.factsFromRows(upTo(EXPORT, '2026-09-24 15:00:30.512624+00').reverse(), 'Hi');
  T('1.1 his export at 15:00:30: the relay 10 s earlier puts her IN conversation (a relayed message counts: §11 rule 1)', f1.inConversation === true && f1.priorCount === 1 && f1.lastAsked === null);
  const r12 = await replay({ at: '2026-09-24 15:00:34+00', inbound: 'Hi', rows: upTo(ALL, '2026-09-24 15:00:30.512624+00') });
  const p12 = r12.calls[0] && r12.calls[0].params.system;
  T('1.2 the 20:30 IST "Hi" replayed: the model is told she is already in conversation, with the 20:10 question as the one not to ask again', !!p12 && p12.includes('THIS CLIENT IS ALREADY IN CONVERSATION WITH DEV ROY PHOTOGRAPHY') && p12.includes('are you planning a single wedding day or functions spread across multiple days') && /Do not ask that question again/.test(p12));
  T('1.3 the same replay: no first-message greeting is offered to her (the prompt shape, R-45.26(2)); her ten-minute history is unchanged (the relay row, then her message)', !!p12 && !p12.includes('Good (first message)') && !/THIS IS THE CLIENT'S FIRST MESSAGE/.test(p12) && r12.calls[0].params.messages.length === 2);
  const r14 = await replay({ at: '2026-09-24 18:17:40+00', inbound: 'Hi, are you available on 5 march 2028 for our wedding in delhi?', rows: upTo(ALL, '2026-09-24 18:17:37.16968+00') });
  const p14 = r14.calls[0] && r14.calls[0].params.system;
  T('1.4 the 18:17:37 UTC date question replayed: in conversation (it met an empty ten-minute window and the first-contact branch before this cut)', !!p14 && p14.includes('THIS CLIENT IS ALREADY IN CONVERSATION WITH') && r14.calls[0].params.messages.length === 1 && p14.includes("is your event spread across functions like mehendi"));
  const r15 = await replay({ at: '2026-09-25 10:00:05+00', inbound: 'Hi', rows: [row('2026-09-25 10:00:00+00', 'inbound', 'couple', 'Hi')] });
  const p15 = r15.calls[0] && r15.calls[0].params.system;
  T('1.5 a new number\'s first "Hi": the one greeting, as the studio, with the occasion first', !!p15 && p15.includes("THIS IS THE CLIENT'S FIRST MESSAGE TO DEV ROY PHOTOGRAPHY") && p15.includes("You've reached Dev Roy Photography. What's the occasion, and when is it?"));
  const two = facts.factsFromRows([row('2026-09-25 10:05:00+00', 'inbound', 'couple', 'Hi'), row('2026-09-25 10:00:00+00', 'inbound', 'couple', 'Hi')], 'Hi');
  T('1.6 the message in hand is dropped ONCE: an earlier identical "Hi" still counts', two.inConversation === true && two.priorCount === 1);
  const dead = await facts.threadFacts({ supabase: { from() { throw new Error('down'); } }, conversationId: C, inboundBodyAsStored: 'Hi', historyLength: 2 });
  const deadNone = await facts.threadFacts({ supabase: null, conversationId: C, inboundBodyAsStored: 'Hi', historyLength: 0 });
  T('1.7 TOTAL: a failed read falls back to the turn\'s own history (2 rows: in conversation; none: not)', dead.inConversation === true && deadNone.inConversation === false);
  T('1.8 since reads the first row\'s day in IST (14:40 UTC on 24 September is 24 September 2026)', facts.factsFromRows(upTo(ALL, '2026-09-24 15:00:30.512624+00').reverse(), 'Hi').since === '24 September 2026');

  sec('2 FACT 2 · the trade, raw and folded; the occasion first');
  const build = () => fresh('src/agent/coupleSystemPrompt.js').buildCoupleSystemPrompt;
  const trade = (cat) => build()({ vendor: { business_name: 'Studio X', category: cat, city: 'Delhi' }, vendorUser: { name: 'Owner Y' }, isReturningBride: false, conversation: { inConversation: false } });
  const ch = trade('Choreographer'); const ca = trade('Caterer'); const ph = trade('Photographer');
  T('2.1 the vendor\'s own words reach the prompt raw ("Choreographer") beside the performer material, with the choreographer\'s questions', ch.includes('describes its work as "Choreographer"') && ch.includes('A CHOREOGRAPHER') && ch.includes('how many people are dancing'));
  T('2.2 a caterer is told apart from a venue by its own words and never offered a visit to "the space"', ca.includes('describes its work as "Caterer"') && ca.includes('A CATERER') && ca.includes('veg, non-veg or both'));
  T('2.3 the occasion is asked first, wedding questions only for a wedding, a general list otherwise', ph.includes("1. The occasion, and when it is.") && ph.includes('IF IT IS A WEDDING:') && ph.includes('IF IT IS ANYTHING ELSE') && ph.indexOf('The occasion') < ph.indexOf('IF IT IS A WEDDING'));
  T('2.4 delivery trades open "by when do you need the outfit / the jewellery" (the founder\'s cure for "it")', trade('Bridal designer').includes('by when do you need the outfit?') && trade('Jeweller').includes('by when do you need the jewellery?') && !trade('Jeweller').includes('by when do you need it'));
  const cp = require(P('src/lib/vendor/categoryProfiles.js'));
  T('2.5 profileFor() is untouched for its other readers (occupancy, /v, settings): the same six PROFILES keys, and the new trades still fold to other there', JSON.stringify(Object.keys(cp.PROFILES)) === '["makeup","photography","designer","jewellery","decor","venue_catering"]' && cp.profileFor('choreographer').key === 'other' && cp.profileFor('hairstylist').key === 'other');
  T('2.6 TOTAL: coupleAsksFor over hostile input reads the other material', [null, undefined, 5, {}, [], '   '].every((v) => cp.coupleAsksFor(v).key === 'other'));

  sec('3 FACT 3 · a date\'s state, the /v page\'s reader, no sentence, no write (R-45.25)');
  const ds = fresh('src/lib/vendor/coupleDateState.js');
  const NOW = Date.parse('2026-09-24T18:17:37Z');
  const ON = { id: 'v-dev440', status: 'active', discover_paused: false, date_check_enabled: true };
  const verdictRow = (o) => ({ date: '2028-03-05', blocked_slots: [], occupancy: 'on', ...o });
  const run = async (vendorRow, d, words = '5 march 2028', nowMs = NOW) => { DESCRIBE = d; const writes = []; const sb = store({ vendorRow }); const orig = sb.from; sb.from = (t) => { const a = orig(t); a.insert = () => { writes.push(t); return { select: () => ({ single: async () => ({}) }) }; }; return a; }; const r = await fresh('src/lib/vendor/coupleDateState.js').dateState({ supabase: sb, vendor: { id: 'v-dev440' }, dateAsSpoken: words, nowMs }); return { r, writes }; };
  const free = await run(ON, verdictRow({ blocked: false, slots: [{ capacity: 1, held: 0 }] }));
  const blocked = await run(ON, verdictRow({ blocked: true, slots: [] }));
  const part = await run(ON, verdictRow({ blocked: false, slots: [{ capacity: 2, held: 1 }] }));
  const sold = await run(ON, verdictRow({ blocked: false, slots: [{ capacity: 1, held: 1 }] }));
  const unknown = await run(ON, verdictRow({ blocked: null, slots: [], occupancy: 'off' }));
  const off = await run({ ...ON, date_check_enabled: false }, verdictRow({ blocked: false, slots: [] }));
  const paused = await run({ ...ON, discover_paused: true }, verdictRow({ blocked: false, slots: [] }));
  const occOff = await run(ON, verdictRow({ blocked: false, slots: [], occupancy: 'off' }));
  const unread = await run(ON, null, 'sometime next year maybe');
  T('3.1 check on and the day open: free, for 5 March 2028 as she wrote it', free.r.state === 'free' && free.r.date === '2028-03-05');
  T('3.2 blocked, sold out, part of the day held, or could not check: taken (she never says booked)', [blocked, part, sold, unknown].every((x) => x.r.state === 'taken'));
  T('3.3 the switch off, or the vendor paused: check_off', off.r.state === 'check_off' && paused.r.state === 'check_off');
  T('3.4 an occupancy-off trade with a known answer: check_off, as the /v route refuses it', occOff.r.state === 'check_off');
  T('3.5 words that are not a date: unreadable, and the reader is never called', unread.r.state === 'unreadable' && unread.r.date === null);
  T('3.6 NO WRITE: public.date_checks is never touched', [free, blocked, part, off, unread].every((x) => x.writes.length === 0));
  const fact = JSON.parse(ds.dateStateFact(free.r));
  T('3.7 the fact handed to her is a date and a state, never a sentence', JSON.stringify(Object.keys(fact)) === '["date","state"]' && fact.date === '5 March 2028' && fact.state === 'free');
  const later = await run(ON, verdictRow({ blocked: false, slots: [] }), '5 march', Date.parse('2027-06-01T00:00:00Z'));
  T('3.8 the clock is passed, not read: "5 march" resolves to the next 5 March from the given moment', later.r.date === '2028-03-05');
  let threw = false; const hostile = [undefined, null, 5, {}, [], 'x'.repeat(5000), '\u0000'];
  for (const a of hostile) for (const b of hostile) { try { const r = await ds.dateState({ supabase: a, vendor: b, dateAsSpoken: a, nowMs: b }); if (!ds.STATES.includes(r.state)) threw = true; } catch (_e) { threw = true; } }
  try { await ds.dateState(); ds.dateStateFact(undefined); ds.stateOfVerdict(undefined); } catch (_e) { threw = true; }
  T('3.9 TOTAL: hostile values in every argument position return one of the four states and never throw', !threw);
  const r310 = await replay({ at: '2026-09-24 18:17:40+00', inbound: 'Hi, are you available on 5 march 2028 for our wedding in delhi?', rows: upTo(ALL, '2026-09-24 18:17:37.16968+00'), vendorRow: ON,
    script: [{ name: 'date_state', input: { date_as_spoken: '5 march 2028' } }, { name: 'respond_to_couple', input: { message: 'x' } }] });
  DESCRIBE = verdictRow({ blocked: false, slots: [] });
  const second = r310.calls[1] && r310.calls[1].params.messages.slice(-1)[0];
  T('3.10 driven: the turn offers date_state beside its two tools, and the tool result reaching the model is the fact alone', r310.calls[0].params.tools.map((t) => t.name).join(',') === 'capture_couple_lead,date_state,respond_to_couple' && !!second && Array.isArray(second.content) && /^\{"date":"5 March 2028","state":"(free|taken|check_off)"\}$/.test(second.content[0].content));

  sec('4 FACT 4 · the studio\'s name at every reader (F-44.157)');
  const { studioName } = fresh('src/agent/studioName.js');
  T('4.1 studioName: the studio first, the person only when the studio has none, then the fallback', studioName(DEV440, DEVUSER) === 'Dev Roy Photography' && studioName({ business_name: '  ' }, DEVUSER) === 'Dev Roy' && studioName(null, null) === 'this vendor');
  const shapes = [];
  for (const useEliza of [true, false]) for (const isReturningBride of [true, false]) for (const inConversation of [true, false]) shapes.push(build()({ vendor: DEV440, vendorUser: DEVUSER, isReturningBride, leadName: isReturningBride ? 'Sarah' : null, useEliza, conversation: { inConversation, priorCount: 1 } }));
  T('4.2 all eight composed branches speak "Dev Roy Photography" and never "Dev Roy\'s"', shapes.every((s) => s.includes('Dev Roy Photography') && !/Dev Roy's/.test(s)));
  T('4.3 the admission line reaches her with the studio: "answering for Dev Roy Photography"', shapes[0].includes("I'm an AI, yes, answering for Dev Roy Photography."));
  const pre = r12.calls[0].params.messages.find((m) => m.role === 'assistant');
  T('4.4 a relayed row in her history reads "From Dev Roy Photography: " (relayAttributionPrefix)', !!pre && /^From Dev Roy Photography: Hi Sarah!/.test(pre.content));
  T('4.5 the capture close is built from the studio\'s name, no em dash', /I\\'ve passed this to ' \+ studioName\(vendor, vendorUser, 'the studio'\) \+ '\. They\\'ll be in touch soon!/.test(read('src/agent/engine.js')));

  sec('5 F-44.145 · the bride lane reads the whole message');
  const fsMod = require(P('src/lib/fullStop.js'));
  const bi = read('src/lib/brideInbound.js');
  T('5.1 brideInbound calls matchOptOutExact on the whole message and never the first-token matcher', /const fullStopWord = matchOptOutExact\(trimmedBody\);/.test(bi) && !/matchFullStopWord\(/.test(bi));
  T('5.2 "Cancel the mehendi booking" and "End of day works" are not opt-outs; "Cancel." and "STOP" are', fsMod.matchOptOutExact('Cancel the mehendi booking') === null && fsMod.matchOptOutExact('End of day works') === null && fsMod.matchOptOutExact('Cancel.') === 'stop' && fsMod.matchOptOutExact('STOP') === 'stop');

  sec('6 the register, every branch (the founder: no em dash, no "assistant", never the owner)');
  const trades = ['Photographer', 'Makeup artist', 'Choreographer', 'Caterer', 'Bridal designer', 'Jeweller', 'Mehendi artist', 'Event planner'];
  const every = [...shapes, ...trades.map((c) => build()({ vendor: { ...DEV440, category: c }, vendorUser: DEVUSER, isReturningBride: false, useEliza: true, conversation: { inConversation: false } }))];
  T('6.1 no em dash in any composed prompt (her register is learned from it)', every.every((s) => !s.includes('\u2014')));
  T('6.2 no line tells her to call herself an assistant ("I\'m ...\'s assistant" is gone)', every.every((s) => !/I'm [^"\n]{0,40}'s assistant/.test(s) && !/the assistant for/.test(s)));
  T('6.4 the couple turn\'s own fallback sentence (sent when the model never replies) carries no em dash (found by b117m --dry)', !/'Thanks \u2014 we/.test(read('src/agent/engine.js')) && (read('src/agent/engine.js').match(/'Thanks, we\\'ll be in touch soon!'/g) || []).length === 2);
  T('6.3 the soul carries no em dash and no calendar-access claim', !require(P('src/agent/souls/elizaSoul.js')).ELIZA_SOUL.includes('\u2014') && !/cannot see their calendar/.test(require(P('src/agent/souls/elizaSoul.js')).ELIZA_SOUL));

  sec('7 the money functions byte-identical to b115\'s pins');
  const b115 = read('scripts/b115_lcv15_lsp4_bench.js');
  const PIN = JSON.parse(b115.match(/const PIN = (\{[^\n]*\});/)[1]);
  function body(t, name) {
    const i = t.search(new RegExp(`^(async )?function ${name}\\b`, 'm')); if (i < 0) return '';
    let j = t.indexOf('(', i); let d = 0;
    for (; j < t.length; j += 1) { if (t[j] === '(') d += 1; else if (t[j] === ')') { d -= 1; if (d === 0) break; } }
    const k = t.indexOf('{', j); d = 0;
    for (let m = k; m < t.length; m += 1) { if (t[m] === '{') d += 1; else if (t[m] === '}') { d -= 1; if (d === 0) return t.slice(i, m + 1); } }
    return '';
  }
  const wd = read('src/lib/vendor/workingDoor.js');
  T('7.1 planMoney, planPayment, planBooking, applyRow and reread are byte-identical', ['planMoney', 'planPayment', 'planBooking', 'applyRow', 'reread'].every((f) => sha(body(wd, f)) === PIN[f]));

  sec('8 mutations of production code, each reddening its cell');
  const m1 = await mutated('src/agent/coupleThreadFacts.js', 'inConversation: prior.length > 0,', 'inConversation: false,', async () => {
    const r = await replay({ at: '2026-09-24 15:00:34+00', inbound: 'Hi', rows: upTo(ALL, '2026-09-24 15:00:30.512624+00') });
    return r.calls[0].params.system.includes('THIS CLIENT IS ALREADY IN CONVERSATION WITH');
  });
  T('8.1 M1 the thread\'s record ignored (inConversation false) reddens 1.2: the 20:30 "Hi" is a first contact again', m1 === false);
  const m2 = await mutated('src/agent/coupleSystemPrompt.js', "const tradeRaw       = (typeof vendor?.category === 'string' && vendor.category.trim()) ? vendor.category.trim() : '';", "const tradeRaw       = '';", async () => trade('Choreographer').includes('describes its work as "Choreographer"'));
  T('8.2 M2 the raw trade text dropped reddens 2.1', m2 === false);
  const m3 = await mutated('src/lib/vendor/coupleDateState.js', "if (v.blocked === true || v.sold === true || v.any_held === true) return 'taken';", "if (v.blocked === true || v.sold === true) return 'taken';", async () => (await run(ON, verdictRow({ blocked: false, slots: [{ capacity: 2, held: 1 }] }))).r.state);
  T('8.3 M3 part of the day held read as free reddens 3.2 (a couple told a held day is free)', m3 === 'free');
  const m4 = await mutated('src/agent/studioName.js', "return clean(vendor && vendor.business_name) || clean(vendorUser && vendorUser.name) || fallback;", "return clean(vendorUser && vendorUser.name) || clean(vendor && vendor.business_name) || fallback;", async () => build()({ vendor: DEV440, vendorUser: DEVUSER, conversation: {} }).includes("Dev Roy's"));
  T('8.4 M4 the person first again reddens 4.2 ("Dev Roy\'s" returns)', m4 === true);
  const m5 = await mutated('src/lib/brideInbound.js', 'const fullStopWord = matchOptOutExact(trimmedBody);', 'const fullStopWord = matchFullStopWord(trimmedBody);', async () => /const fullStopWord = matchOptOutExact\(trimmedBody\);/.test(read('src/lib/brideInbound.js')));
  T('8.5 M5 the first-token matcher restored in the bride lane reddens 5.1', m5 === false);
  const m6 = await mutated('src/lib/vendor/coupleDateState.js', "if (row.status !== 'active' || row.discover_paused === true || row.date_check_enabled !== true) return { date: iso, state: 'check_off' };", "if (row.status !== 'active' || row.discover_paused === true) return { date: iso, state: 'check_off' };", async () => (await run({ ...ON, date_check_enabled: false }, verdictRow({ blocked: false, slots: [] }))).r.state);
  T('8.6 M6 the vendor\'s switch ignored reddens 3.3 (a date told free with the check off)', m6 === 'free');
  T('8.7 every mutated file is restored byte for byte', !read('src/agent/coupleThreadFacts.js').includes('inConversation: false,') && read('src/lib/brideInbound.js').includes('matchOptOutExact(trimmedBody)'));

  console.log(`\nb117a_elz1_couple_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`  ${f}`)); process.exit(1); }
})().catch((e) => { console.error(e); process.exit(1); });
