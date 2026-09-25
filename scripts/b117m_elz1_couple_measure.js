#!/usr/bin/env node
'use strict';
// scripts/b117m_elz1_couple_measure.js  RUNG b117m · CE-45 ELZ-1 cut 1 · THE MEASURED HALF (R-45.26(3); the chair's ruling on r2).
//
// NOT A FLOOR BENCH. It calls live models, so it is never in the floor and never on a floor clock. The file name carries no
// "_bench" and its default mode is --readers, which calls nothing; the floor runner runs every scripts/*.js, so a bare run must be
// safe and quick, and it is: the readers' check alone, exit 0 or 1.
//
// THREE MODES
//   --readers   (default) the six rule readers against HAND-LABELLED replies, first (C-44.4: a reader whose empty and broken
//               answers look alike is not evidence). Every labelled reply must be read as labelled: false positives 0, misses 0.
//   --dry       the whole harness over a stub model that answers well, to prove the replay drives the real couple turn.
//   --live      the founder's run in his Codespace: each recorded turn replayed N = 20 times on each couple-lane model the route
//               admits (claude-haiku-4-5-20251001, deepseek-v4-flash), read by the six readers. PRINTS RATES ONLY (the chair: "nothing
//               printed or written but the rates"). Keys are read by src/lib/llm.js from the environment and never printed.
//               Options: --n=20 (default), --lane=eliza|legacy (default eliza; the card's SELECT says which is live), --model=haiku|
//               deepseek|both (default both).
// TOLERANCE (the chair): r2, r3 and r6 at ZERO misses; r1, r4 and r5 at most ONE in twenty, per rule per model. Above it, the prompt
// is tightened and re-measured before the cut lands; never a guard. Exit 0 only when every rule on every model is within tolerance.
//
// THE RULES
//   r1 no introduction to someone already in conversation        r4 the house form: "free" said only for a free date; for taken,
//   r2 no word about her own access, calendar, tools or limits      check-off or unreadable a check-and-get-back, never booked/taken
//   r3 the studio's name and never the owner's alone              r5 the trade's questions: the occasion first for a new client, and
//   r6 no em dash, no "assistant", no persona name                   for someone in conversation, the functions question not asked again
const path = require('path');
// CE-45 ELZ-1 cut 1b: the file finds the tree from scripts/ (its home) OR from the repo root, so the diagnostic can run as a
// dropped-in copy in the root and be deleted by the same block, leaving the tree untouched.
const ROOT = require('fs').existsSync(path.join(__dirname, 'src', 'agent')) ? __dirname : path.resolve(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const argv = process.argv.slice(2);
const arg = (k, d) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d; };
const MODE = argv.includes('--live') ? 'live' : argv.includes('--dry') ? 'dry' : 'readers';
// CE-45 ELZ-1 cut 1b (the chair's grant): --show-misses prints each missed reply's TEXT with its turn and rules (model output only;
// never a key, never written to disk); the per-turn table is always printed under the rate lines.
const SHOW = argv.includes('--show-misses');

// ── THE READERS: each returns true when the reply KEEPS the rule ─────────────────────────────────────────────────────────────
const STUDIO = 'Dev Roy Photography';
const R = {
  // r1's second pattern is case-SENSITIVE on purpose: "I'm Eliza," / "I'm Roshni." is a name, "I'm glad, ..." is not.
  r1: (t, c) => !c.inConversation || !(/you'?ve reached|\bwelcome to\b|\bI'?m (the )?(assistant|front desk)\b|\bI'?m [^.?!]{0,40}'s (assistant|front desk)\b|\bthis is [^.?!]{0,40}(assistant|front desk)\b/i.test(t) || /\bI'?m [A-Z][a-z]+(,|\.|!| (from|at|with|here)\b)/.test(t)),
  r2: (t) => !/\b(access|calendar|my tools|tools|system|systems|limitations?|I (can'?t|cannot|am not able to|am unable to|don'?t have) (see|check|confirm|access|view|look))\b/i.test(t),
  r3: (t) => !/\bDev Roy\b(?! Photography)/.test(t),
  // cut 1c (R-45.25 as the founder amended it): "booked" is RIGHT on a booked day when the house form follows; wrong on a free,
  // unsure, check-off or unreadable day. "taken", "unavailable", "not free" are wrong on every day.
  r4: (t, c) => {
    if (!c.dateState) return true;
    const refused = /\b(taken|unavailable|not available|not free|already (committed|engaged))\b/i.test(t);
    const booked = /\bbooked\b/i.test(t);
    const free = /\bfree\b|\bavailable\b/i.test(t) && !refused;
    const house = /\b(check|confirm)\b[^.?!]*\bget back\b|\bget back\b[^.?!]*\b(check|confirm)\b/i.test(t);
    if (refused) return false;
    if (c.dateState === 'free') return free && !booked;
    if (c.dateState === 'booked') return house && !free;
    return house && !booked && !free;
  },
  r5: (t, c) => {
    if (c.inConversation) return !/mehend|sangeet|single day|one day|spread across|functions/i.test(t) || /\b(mehendi|sangeet)\b/i.test(c.inbound || '');
    return /occasion|what'?s it for|when is it|by when/i.test(t) && !/mehend|sangeet/i.test(t);
  },
  // cut 1b: the EN dash too (U+2013), seen live on 25 Sept in "clearer – we're here"; a hyphen (U+002D) inside a word is not a dash.
  r6: (t) => !/[\u2013\u2014]|\bassistant\b|\bEliza\b/i.test(t),
};
const RULES = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'];

// ── HAND-LABELLED REPLIES (C-44.4): each with the rules it keeps and breaks, written by the seat to span the failure shapes seen on
// 24 September and the near misses a lazy reader would confuse. ───────────────────────────────────────────────────────────────
const IN = { inConversation: true, inbound: 'Hi' };
const NEW = { inConversation: false, inbound: 'Hi' };
const D = (s) => ({ inConversation: true, inbound: 'are you free on 5 march 2028?', dateState: s });
const LABELLED = [
  // the 24 September failures, verbatim
  { t: "Hi Sarah! I'm Dev Roy's assistant — is your event spread across functions like mehendi, sangeet, wedding, reception, or is it a single day?", c: IN, breaks: ['r1', 'r3', 'r5', 'r6'] },
  { t: "I don't have access to Dev Roy's calendar, so I can't confirm availability — that's something they'll need to check with you directly.", c: D('free'), breaks: ['r2', 'r3', 'r4', 'r6'] },
  // good replies that a lazy reader might flag
  { t: 'Hi Sarah! How can I help?', c: IN, breaks: [] },
  { t: 'Dev Roy Photography is free on 5 March 2028; shall I pass your details on?', c: D('free'), breaks: [] },
  { t: 'Good news, Dev Roy Photography is available on 5 March 2028. Shall I pass your details on?', c: D('free'), breaks: [] },
  { t: 'Let me check with Dev Roy Photography and get back to you.', c: D('unsure'), breaks: [] },
  { t: "Let me check with Dev Roy Photography about 5 March 2028 and I'll get back to you today.", c: D('check_off'), breaks: [] },
  { t: "Hi! You've reached Dev Roy Photography. What's the occasion, and when is it?", c: NEW, breaks: [] },
  { t: "Hi! You've reached Dev Roy Photography. What's the occasion, and by when do you need the outfit?", c: NEW, breaks: [] },
  { t: 'Lovely, a sangeet on the 12th. Photos, video, or both?', c: { inConversation: true, inbound: 'its for my sangeet on the 12th' }, breaks: [] },
  { t: "I'm an AI, yes, answering for Dev Roy Photography. They read every enquiry themselves; I just make sure yours reaches them.", c: { inConversation: true, inbound: 'are you a bot?' }, breaks: [] },
  // single-rule breaks, one each
  { t: "Hi again! You've reached Dev Roy Photography. How can I help?", c: IN, breaks: ['r1'] },
  // her own limits in other words ("the diary"): a break of r2. First labelled kept by the seat; the reader was right (C-44.4's point).
  { t: "I can't see the diary from here, but Dev Roy Photography will confirm. Let me check and get back to you.", c: D('unsure'), breaks: ['r2'] },
  { t: "I'm glad you asked! Let me check with Dev Roy Photography and get back to you.", c: D('unsure'), breaks: [] },
  { t: 'Let me check the calendar and get back to you.', c: D('unsure'), breaks: ['r2'] },
  { t: 'Dev Roy will get back to you shortly.', c: IN, breaks: ['r3'] },
  { t: 'Sorry, 5 March 2028 is already booked.', c: D('booked'), breaks: ['r4'] },
  // cut 1c: the walk's own 12:49:14 reply is RIGHT on a booked day (the founder: "booked reads fine"); the same words on an unsure day
  // are wrong; "booked" with no house form, or "taken" on any day, is wrong
  { t: 'Dev Roy Photography is booked on 5 March 2028, but let me confirm with them and get back to you.', c: D('booked'), breaks: [] },
  { t: 'Dev Roy Photography is booked on 5 March 2028, but let me confirm with them and get back to you.', c: D('unsure'), breaks: ['r4'] },
  { t: 'Dev Roy Photography is booked on 5 March 2028.', c: D('booked'), breaks: ['r4'] },
  { t: '5 March 2028 is taken, but let me check with Dev Roy Photography and get back to you.', c: D('booked'), breaks: ['r4'] },
  { t: 'Let me check with Dev Roy Photography and get back to you.', c: D('booked'), breaks: [] },
  { t: 'Dev Roy Photography is free on 5 March 2028!', c: D('check_off'), breaks: ['r4'] },
  { t: 'Let me check with Dev Roy Photography and get back to you.', c: D('free'), breaks: ['r4'] },
  { t: 'Is it a single day, or spread across functions like mehendi and sangeet?', c: IN, breaks: ['r5'] },
  { t: 'Hi! Photos, video, or both?', c: NEW, breaks: ['r5'] },
  { t: 'Hi! Is your wedding one day, or spread across mehendi, sangeet and reception?', c: NEW, breaks: ['r5'] },
  { t: 'Of course, happy to help with that.', c: IN, breaks: [] },
  { t: 'Noted, passing that on to Dev Roy Photography now.', c: IN, breaks: [] },
  { t: "Of course — I'll pass that on.", c: IN, breaks: ['r6'] },
  { t: "I'm Eliza, and I'll pass this on to Dev Roy Photography.", c: IN, breaks: ['r1', 'r6'] },
  { t: "Our assistant will pass this on.", c: IN, breaks: ['r6'] },
  // cut 1b: the live en dash (his W6 export, 25 Sept 08:20:40), and a hyphenated word that must pass
  { t: "No problem at all, Sarah. Reach out whenever your plans are clearer – we're here whenever you need us.", c: IN, breaks: ['r6'] },
  { t: 'Noted, a pre-wedding shoot. Photos, video, or both?', c: { inConversation: true, inbound: 'its a pre-wedding shoot' }, breaks: [] },
];

function readersCheck() {
  let fp = 0; let fn = 0; const bad = [];
  for (const [i, x] of LABELLED.entries()) {
    for (const r of RULES) {
      const keeps = R[r](x.t, x.c);
      const shouldKeep = !x.breaks.includes(r);
      if (keeps && !shouldKeep) { fn += 1; bad.push(`L${i + 1} ${r}: read as kept, labelled broken`); }
      if (!keeps && shouldKeep) { fp += 1; bad.push(`L${i + 1} ${r}: read as broken, labelled kept`); }
    }
  }
  console.log(`b117m readers: ${LABELLED.length} labelled replies x ${RULES.length} rules; false positives ${fp}, misses ${fn}`);
  bad.forEach((b) => console.log(`  ${b}`));
  return fp === 0 && fn === 0;
}

// ── THE RECORDED TURNS ────────────────────────────────────────────────────────────────────────────────────────────────────────
const C = 'conv-measure';
const row = (created_at, direction, sent_by, body) => ({ conversation_id: C, created_at, direction, sent_by, body });
const SARAH = [ // his screenshots (14:40 UTC, transcribed) and his export (9dd7e3f2bd72)
  row('2026-09-24 14:40:00+00', 'outbound', 'vendor_relay', 'Hi Sarah!'),
  row('2026-09-24 14:40:20+00', 'inbound', 'couple', 'Reply'),
  row('2026-09-24 14:40:30+00', 'outbound', 'agent', "I'm Dev Roy's assistant — are you planning a single wedding day or functions spread across multiple days like mehendi, sangeet, wedding, reception?"),
  row('2026-09-24 15:00:20.817248+00', 'outbound', 'vendor_relay', 'Hi Sarah!'),
  row('2026-09-24 15:00:30.512624+00', 'inbound', 'couple', 'Hi'),
  row('2026-09-24 15:00:34.5493+00', 'outbound', 'agent', "Hi Sarah! I'm Dev Roy's assistant — is your event spread across functions like mehendi, sangeet, wedding, reception, or is it a single day?"),
  row('2026-09-24 16:35:01.291319+00', 'outbound', 'vendor_relay', 'Hi Sarah!'),
  row('2026-09-24 18:17:37.16968+00', 'inbound', 'couple', 'Hi, are you available on 5 march 2028 for our wedding in delhi?'),
];
const WALK = [ // his 1b r2 walk export (25 Sept, UTC)
  row('2026-09-25 12:46:57.759523+00', 'inbound', 'couple', 'Are you free on 5th March 2028?'),
  row('2026-09-25 12:47:03.989225+00', 'outbound', 'agent', 'Dev Roy Photography is free on 5 March 2028. Shall I pass your details on?'),
  row('2026-09-25 12:47:41.493003+00', 'inbound', 'couple', 'Are you free on 5th March 2028?'),
  row('2026-09-25 12:47:44.696154+00', 'outbound', 'agent', 'Yes, Dev Roy Photography is free on 5 March 2028. Shall I pass your details on?'),
  row('2026-09-25 12:48:37.364729+00', 'inbound', 'couple', 'Are you free on 5th March 2028?'),
  row('2026-09-25 12:48:40.9077+00', 'outbound', 'agent', 'Dev Roy Photography is free on 5 March 2028. Shall I pass your details on?'),
  row('2026-09-25 12:49:00.183959+00', 'inbound', 'couple', 'Hi'),
  row('2026-09-25 12:49:03.408614+00', 'outbound', 'agent', 'Hi Sarah! How can I help?'),
  row('2026-09-25 12:49:09.699431+00', 'inbound', 'couple', 'Are you free on 5 march 2028'),
];
const upTo = (at) => SARAH.filter((r) => Date.parse(r.created_at) <= Date.parse(at));
const DATEQ = 'Hi, are you available on 5 march 2028 for our wedding in delhi?';
const VERDICT = { free: { blocked: false, slots: [] }, booked: { blocked: true, slots: [] }, check_off: null };
const TRADES = ['Photographer', 'Makeup artist', 'Bridal designer', 'Jeweller', 'Decorator', 'Banquet venue', 'Caterer', 'Wedding planner', 'DJ', 'Choreographer', 'Hairstylist', 'Content creator', 'Mehendi artist', 'Wedding invitations'];
const TURNS = [
  { id: 'sarah_hi_2030', at: '2026-09-24 15:00:34+00', inbound: 'Hi', rows: upTo('2026-09-24 15:00:30.512624+00'), ctx: { inConversation: true, inbound: 'Hi' } },
  ...['free', 'booked', 'check_off'].map((s) => ({ id: `date_${s}_1817`, at: '2026-09-24 18:17:40+00', inbound: DATEQ, rows: upTo('2026-09-24 18:17:37.16968+00'), dateState: s, ctx: { inConversation: true, inbound: DATEQ, dateState: s } })),
  { id: 'cancel_first_word', at: '2026-09-24 18:30:00+00', inbound: 'Cancel the enquiry for now, we changed plans', rows: [...upTo('2026-09-24 18:17:37.16968+00'), row('2026-09-24 18:29:55+00', 'inbound', 'couple', 'Cancel the enquiry for now, we changed plans')], ctx: { inConversation: true, inbound: 'Cancel the enquiry for now' } },
  ...TRADES.map((trade) => ({ id: `new_${trade.toLowerCase().replace(/\s+/g, '_')}`, at: '2026-09-25 10:00:05+00', inbound: 'Hi', trade, rows: [row('2026-09-25 10:00:00+00', 'inbound', 'couple', 'Hi')], ctx: { inConversation: false, inbound: 'Hi' } })),
  // cut 1c: the 1b r2 walk's own rows (his export, 25 Sept 12:46:57 to 12:49:09 UTC), the date blocked at 12:47:28
  { id: 'walk_booked_1249', at: '2026-09-25 12:49:12+00', inbound: 'Are you free on 5 march 2028', dateState: 'booked',
    rows: [...SARAH, ...WALK], ctx: { inConversation: true, inbound: 'Are you free on 5 march 2028', dateState: 'booked' } },
];

function store(rows, dateState) {
  return {
    from(table) {
      const q = { eqs: {}, gte: null };
      const api = {
        select: () => api, eq: (k, v) => { q.eqs[k] = v; return api; }, gte: (k, v) => { q.gte = v; return api; }, order: () => api, in: () => api,
        insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'x' } }) }) }), update: () => api,
        async limit(n) {
          if (table !== 'messages') return { data: [] };
          return { data: rows.filter((r) => (q.gte ? Date.parse(r.created_at) >= Date.parse(q.gte) : true)).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, n) };
        },
        async maybeSingle() {
          if (table === 'admin_config') return { data: MODEL_ROW[q.eqs.key] != null ? { value: MODEL_ROW[q.eqs.key] } : null };
          if (table === 'vendors') return { data: { id: 'v-dev440', status: 'active', discover_paused: false, date_check_enabled: dateState !== 'check_off' } };
          return { data: null };
        },
      };
      return api;
    },
  };
}
let MODEL_ROW = {};
let DESCRIBE = null;
const occPath = require.resolve(P('src/lib/vendor/occupancy.js'));
require.cache[occPath] = require.cache[occPath] || { id: occPath, filename: occPath, loaded: true, exports: require(occPath) };
require.cache[occPath].exports = { ...require.cache[occPath].exports, describeDate: async () => (DESCRIBE ? { date: '2028-03-05', blocked_slots: [], occupancy: 'on', ...DESCRIBE } : null) };

if (MODE === 'dry') {
  const llmPath = require.resolve(P('src/lib/llm.js'));
  const real = require(llmPath);
  require.cache[llmPath].exports = { ...real, llmCreate: async (provider, params) => {
    const sys = params.system; const last = params.messages[params.messages.length - 1];
    const lastTxt = JSON.stringify(last).replace(/\\"/g, '"'); // the tool result arrives as an escaped string inside the message
    const wantsDate = /5 march 2028/i.test(JSON.stringify(params.messages)) && !lastTxt.includes('"state"');
    if (wantsDate) return { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 'd1', name: 'date_state', input: { date_as_spoken: '5 march 2028' } }] };
    let msg = 'Hi Sarah! How can I help?';
    const st = (lastTxt.match(/"state":"(\w+)"/) || [])[1];
    if (st === 'free') msg = 'Dev Roy Photography is free on 5 March 2028; shall I pass your details on?';
    else if (st === 'booked') msg = 'Dev Roy Photography is booked on 5 March 2028, but let me confirm with them and get back to you.';
    else if (st) msg = 'Let me check with Dev Roy Photography and get back to you.';
    else if (/THIS IS THE CLIENT'S FIRST MESSAGE/.test(sys)) msg = (sys.match(/Good \(first message\): "([^"]+)"/) || [])[1] || 'x';
    else if (/Cancel/.test(JSON.stringify(last))) msg = 'No problem at all. We are here whenever you need anything.';
    return { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 'r1', name: 'respond_to_couple', input: { message: msg } }] };
  } };
}

async function replayOnce(turn, lane) {
  const realNow = Date.now; Date.now = () => Date.parse(turn.at);
  DESCRIBE = turn.dateState ? VERDICT[turn.dateState] : null;
  try {
    for (const r of ['src/agent/engine.js', 'src/agent/coupleSystemPrompt.js', 'src/lib/laneFlags.js', 'src/lib/modelRouter.js']) delete require.cache[require.resolve(P(r))];
    MODEL_ROW['couple.eliza_enabled'] = JSON.stringify(lane === 'eliza');
    const { runCoupleAgenticTurn } = require(P('src/agent/engine.js'));
    const vendor = { id: 'v-dev440', business_name: STUDIO, category: turn.trade || 'Photographer', city: 'Delhi', open_to_travel: true };
    const out = await runCoupleAgenticTurn({ vendor, vendorUser: { name: 'Dev Roy' }, conversation: { id: C }, couplePhone: '919625759924', coupleId: null, inboundMessage: turn.inbound, supabase: store(turn.rows, turn.dateState), anthropic: null });
    return String((out && out.reply) || '');
  } finally { Date.now = realNow; }
}

// cut 1b r2 (the chair's approval, the founder's cost): the turns that have EVER missed run at nHot, the rest at n; a cold turn that
// misses at n is re-run alone at nHot before the verdict (its first counts are replaced, not added). A progress line per turn per
// model shows a long run is alive. Only counts and turn ids are printed as it goes; reply text only under --show-misses.
// cut 1c: date_taken_1817 renamed date_booked_1817 (the same blocked day, now the booked state); walk_booked_1249 added (the chair's
// ruling: the booked-date hot turn from the 1b r2 walk's own rows).
const HOT = new Set(['date_free_1817', 'date_booked_1817', 'date_check_off_1817', 'walk_booked_1249']);
async function measureTurn(turn, reps, lane) {
  const quiet = console.log;
  const out = { miss: Object.fromEntries(RULES.map((r) => [r, 0])), replies: 0, errors: 0, errKinds: {}, seen: {} };
  for (let i = 0; i < reps; i += 1) {
    // a failed reply is counted ONCE, retried twice after a pause, its KIND kept (never a key)
    let reply = ''; let kind = null;
    for (let attempt = 0; attempt < 3 && !reply; attempt += 1) {
      if (attempt) await new Promise((res) => setTimeout(res, 3000 * attempt));
      console.log = () => {}; console.warn = () => {}; const quietErr = console.error; console.error = () => {};
      try { reply = await replayOnce(turn, lane); kind = reply ? null : 'empty reply'; }
      catch (e) { kind = String((e && e.message) || e).replace(/(sk-|key)[\w-]{6,}/gi, '[redacted]').slice(0, 120); }
      finally { console.log = quiet; console.error = quietErr; }
    }
    if (!reply) { out.errors += 1; out.errKinds[kind || 'unknown'] = (out.errKinds[kind || 'unknown'] || 0) + 1; continue; }
    out.replies += 1;
    const broke = RULES.filter((r) => !R[r](reply, turn.ctx));
    for (const r of broke) out.miss[r] += 1;
    if (SHOW && broke.length) { const k = `${turn.id} [${broke.join(',')}] ${reply.replace(/\s+/g, ' ')}`; out.seen[k] = (out.seen[k] || 0) + 1; }
  }
  return out;
}
async function measure({ n, nHot, lane, models }) {
  const results = {};
  for (const m of models) {
    MODEL_ROW = { 'model.wa_couple.default': JSON.stringify(m.route) };
    const perTurn = {};
    for (const [i, turn] of TURNS.entries()) {
      const reps = HOT.has(turn.id) ? nHot : n;
      perTurn[turn.id] = { reps, ...(await measureTurn(turn, reps, lane)) };
      const t = perTurn[turn.id]; const missed = RULES.filter((r) => t.miss[r]).map((r) => `${r} ${t.miss[r]}`).join(' ');
      console.log(`  [${m.key}] ${i + 1}/${TURNS.length} ${turn.id} x${reps}: ${missed || 'clean'}${t.errors ? `, errors ${t.errors}` : ''}`);
      if (!HOT.has(turn.id) && reps < nHot && RULES.some((r) => t.miss[r])) {
        perTurn[turn.id] = { reps: nHot, rerun: true, ...(await measureTurn(turn, nHot, lane)) };
        const u = perTurn[turn.id]; const again = RULES.filter((r) => u.miss[r]).map((r) => `${r} ${u.miss[r]}`).join(' ');
        console.log(`  [${m.key}] ${turn.id} missed at x${reps}, re-run alone at x${nHot}: ${again || 'clean'}${u.errors ? `, errors ${u.errors}` : ''}`);
      }
    }
    const miss = Object.fromEntries(RULES.map((r) => [r, 0])); let replies = 0; let errors = 0; const byTurn = {}; const seen = {}; const errKinds = {};
    for (const [tid, t] of Object.entries(perTurn)) {
      replies += t.replies; errors += t.errors;
      for (const r of RULES) if (t.miss[r]) { miss[r] += t.miss[r]; byTurn[tid] = byTurn[tid] || { reps: t.reps }; byTurn[tid][r] = t.miss[r]; }
      for (const [k, v] of Object.entries(t.seen)) seen[k] = (seen[k] || 0) + v;
      for (const [k, v] of Object.entries(t.errKinds)) errKinds[k] = (errKinds[k] || 0) + v;
    }
    results[m.name] = { miss, replies, errors, byTurn, seen, errKinds };
  }
  return results;
}

const ZERO = ['r2', 'r3', 'r6'];
function verdict(results, n) {
  let ok = true;
  for (const [name, r] of Object.entries(results)) {
    const line = RULES.map((k) => {
      const limit = ZERO.includes(k) ? 0 : Math.floor((r.replies / n) * 1 * (n / 20)); // one in twenty, scaled to the replies read
      const within = r.miss[k] <= limit; if (!within) ok = false;
      return `${k} ${r.miss[k]}/${r.replies}${within ? '' : ' OVER'}`;
    }).join('  ');
    // cut 1b: errors are replies that never came back after three tries; they are not rule breaks, so they are REPORTED with their
    // kind and do not decide the verdict unless more than one in twenty failed (a measurement that mostly failed measured nothing).
    if (r.errors * 20 > r.replies + r.errors) ok = false;
    console.log(`${name}: ${line}  errors ${r.errors}`);
    for (const [k, v] of Object.entries(r.errKinds || {})) console.log(`  ERROR x${v} ${k}`);
    // cut 1b: the per-turn table, misses per rule, out of n replies per turn (turns with no miss are omitted)
    for (const [tid, rs] of Object.entries(r.byTurn || {})) console.log(`  ${tid}: ${Object.entries(rs).filter(([k]) => k !== 'reps').map(([k, v]) => `${k} ${v}/${rs.reps}`).join('  ')}`);
    if (SHOW) for (const [k, v] of Object.entries(r.seen || {})) console.log(`  MISS x${v} ${k}`);
  }
  return ok;
}

(async () => {
  const readersOk = readersCheck();
  if (MODE === 'readers') process.exit(readersOk ? 0 : 1);
  if (!readersOk) { console.log('the readers are not trusted: nothing measured'); process.exit(1); }
  const n = Math.max(1, parseInt(arg('n', MODE === 'dry' ? '1' : '20'), 10) || 20);
  const nHot = Math.max(n, parseInt(arg('n-hot', String(n)), 10) || n);
  const lane = arg('lane', 'eliza') === 'legacy' ? 'legacy' : 'eliza';
  const which = arg('model', 'both');
  const ALL = [{ name: 'claude-haiku-4-5-20251001', key: 'haiku', route: { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' } },
    { name: 'deepseek-v4-flash', key: 'deepseek', route: { provider: 'deepseek', model: 'deepseek-v4-flash' } }];
  const models = ALL.filter((m) => which === 'both' || m.key === which);
  console.log(`b117m ${MODE}: ${TURNS.length} recorded turns (the ${HOT.size} date turns x ${nHot}, the rest x ${n}) x ${models.length} model(s), lane ${lane}`);
  const results = await measure({ n, nHot, lane, models });
  const ok = verdict(results, n);
  const errorsDecided = Object.values(results).some((r) => r.errors * 20 > r.replies + r.errors);
  console.log(ok ? 'WITHIN TOLERANCE' : errorsDecided ? 'TOO MANY ERRORS: more than one reply in twenty never came back, so nothing was measured; run it again' : 'OVER TOLERANCE: tighten the prompt and re-measure; no guard');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e && e.message); process.exit(2); });
