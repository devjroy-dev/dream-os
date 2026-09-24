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
const ROOT = path.resolve(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const argv = process.argv.slice(2);
const arg = (k, d) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d; };
const MODE = argv.includes('--live') ? 'live' : argv.includes('--dry') ? 'dry' : 'readers';

// ── THE READERS: each returns true when the reply KEEPS the rule ─────────────────────────────────────────────────────────────
const STUDIO = 'Dev Roy Photography';
const R = {
  // r1's second pattern is case-SENSITIVE on purpose: "I'm Eliza," / "I'm Roshni." is a name, "I'm glad, ..." is not.
  r1: (t, c) => !c.inConversation || !(/you'?ve reached|\bwelcome to\b|\bI'?m (the )?(assistant|front desk)\b|\bI'?m [^.?!]{0,40}'s (assistant|front desk)\b|\bthis is [^.?!]{0,40}(assistant|front desk)\b/i.test(t) || /\bI'?m [A-Z][a-z]+(,|\.|!| (from|at|with|here)\b)/.test(t)),
  r2: (t) => !/\b(access|calendar|my tools|tools|system|systems|limitations?|I (can'?t|cannot|am not able to|am unable to|don'?t have) (see|check|confirm|access|view|look))\b/i.test(t),
  r3: (t) => !/\bDev Roy\b(?! Photography)/.test(t),
  r4: (t, c) => {
    if (!c.dateState) return true;
    const says = { free: /\bfree\b|\bavailable\b/i.test(t), check: /\bcheck\b[^.?!]*\bget back\b|\bget back\b[^.?!]*\bcheck\b/i.test(t), refused: /\b(booked|taken|unavailable|not available|not free|already (committed|engaged))\b/i.test(t) };
    if (c.dateState === 'free') return says.free && !says.refused;
    return says.check && !says.refused && !says.free;
  },
  r5: (t, c) => {
    if (c.inConversation) return !/mehend|sangeet|single day|one day|spread across|functions/i.test(t) || /\b(mehendi|sangeet)\b/i.test(c.inbound || '');
    return /occasion|what'?s it for|when is it|by when/i.test(t) && !/mehend|sangeet/i.test(t);
  },
  r6: (t) => !/\u2014|\bassistant\b|\bEliza\b/i.test(t),
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
  { t: 'Let me check with Dev Roy Photography and get back to you.', c: D('taken'), breaks: [] },
  { t: "Let me check with Dev Roy Photography about 5 March 2028 and I'll get back to you today.", c: D('check_off'), breaks: [] },
  { t: "Hi! You've reached Dev Roy Photography. What's the occasion, and when is it?", c: NEW, breaks: [] },
  { t: "Hi! You've reached Dev Roy Photography. What's the occasion, and by when do you need the outfit?", c: NEW, breaks: [] },
  { t: 'Lovely, a sangeet on the 12th. Photos, video, or both?', c: { inConversation: true, inbound: 'its for my sangeet on the 12th' }, breaks: [] },
  { t: "I'm an AI, yes, answering for Dev Roy Photography. They read every enquiry themselves; I just make sure yours reaches them.", c: { inConversation: true, inbound: 'are you a bot?' }, breaks: [] },
  // single-rule breaks, one each
  { t: "Hi again! You've reached Dev Roy Photography. How can I help?", c: IN, breaks: ['r1'] },
  // her own limits in other words ("the diary"): a break of r2. First labelled kept by the seat; the reader was right (C-44.4's point).
  { t: "I can't see the diary from here, but Dev Roy Photography will confirm. Let me check and get back to you.", c: D('taken'), breaks: ['r2'] },
  { t: "I'm glad you asked! Let me check with Dev Roy Photography and get back to you.", c: D('taken'), breaks: [] },
  { t: 'Let me check the calendar and get back to you.', c: D('taken'), breaks: ['r2'] },
  { t: 'Dev Roy will get back to you shortly.', c: IN, breaks: ['r3'] },
  { t: 'Sorry, 5 March 2028 is already booked.', c: D('taken'), breaks: ['r4'] },
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
const upTo = (at) => SARAH.filter((r) => Date.parse(r.created_at) <= Date.parse(at));
const DATEQ = 'Hi, are you available on 5 march 2028 for our wedding in delhi?';
const VERDICT = { free: { blocked: false, slots: [] }, taken: { blocked: true, slots: [] }, check_off: null };
const TRADES = ['Photographer', 'Makeup artist', 'Bridal designer', 'Jeweller', 'Decorator', 'Banquet venue', 'Caterer', 'Wedding planner', 'DJ', 'Choreographer', 'Hairstylist', 'Content creator', 'Mehendi artist', 'Wedding invitations'];
const TURNS = [
  { id: 'sarah_hi_2030', at: '2026-09-24 15:00:34+00', inbound: 'Hi', rows: upTo('2026-09-24 15:00:30.512624+00'), ctx: { inConversation: true, inbound: 'Hi' } },
  ...['free', 'taken', 'check_off'].map((s) => ({ id: `date_${s}_1817`, at: '2026-09-24 18:17:40+00', inbound: DATEQ, rows: upTo('2026-09-24 18:17:37.16968+00'), dateState: s, ctx: { inConversation: true, inbound: DATEQ, dateState: s } })),
  { id: 'cancel_first_word', at: '2026-09-24 18:30:00+00', inbound: 'Cancel the enquiry for now, we changed plans', rows: [...upTo('2026-09-24 18:17:37.16968+00'), row('2026-09-24 18:29:55+00', 'inbound', 'couple', 'Cancel the enquiry for now, we changed plans')], ctx: { inConversation: true, inbound: 'Cancel the enquiry for now' } },
  ...TRADES.map((trade) => ({ id: `new_${trade.toLowerCase().replace(/\s+/g, '_')}`, at: '2026-09-25 10:00:05+00', inbound: 'Hi', trade, rows: [row('2026-09-25 10:00:00+00', 'inbound', 'couple', 'Hi')], ctx: { inConversation: false, inbound: 'Hi' } })),
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

async function measure({ n, lane, models }) {
  const quiet = console.log; const results = {};
  for (const m of models) {
    MODEL_ROW = { 'model.wa_couple.default': JSON.stringify(m.route) };
    const miss = Object.fromEntries(RULES.map((r) => [r, 0])); let replies = 0; let errors = 0;
    for (const turn of TURNS) {
      for (let i = 0; i < n; i += 1) {
        let reply = '';
        console.log = () => {}; console.warn = () => {};
        try { reply = await replayOnce(turn, lane); } catch (_e) { errors += 1; } finally { console.log = quiet; }
        if (!reply) { errors += 1; continue; }
        replies += 1;
        for (const r of RULES) if (!R[r](reply, turn.ctx)) miss[r] += 1;
      }
    }
    results[m.name] = { miss, replies, errors, perTurn: n, turns: TURNS.length };
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
    if (r.errors) ok = false;
    console.log(`${name}: ${line}  errors ${r.errors}`);
  }
  return ok;
}

(async () => {
  const readersOk = readersCheck();
  if (MODE === 'readers') process.exit(readersOk ? 0 : 1);
  if (!readersOk) { console.log('the readers are not trusted: nothing measured'); process.exit(1); }
  const n = Math.max(1, parseInt(arg('n', MODE === 'dry' ? '1' : '20'), 10) || 20);
  const lane = arg('lane', 'eliza') === 'legacy' ? 'legacy' : 'eliza';
  const which = arg('model', 'both');
  const ALL = [{ name: 'claude-haiku-4-5-20251001', key: 'haiku', route: { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' } },
    { name: 'deepseek-v4-flash', key: 'deepseek', route: { provider: 'deepseek', model: 'deepseek-v4-flash' } }];
  const models = ALL.filter((m) => which === 'both' || m.key === which);
  console.log(`b117m ${MODE}: ${TURNS.length} recorded turns x ${n} x ${models.length} model(s), lane ${lane}`);
  const results = await measure({ n, lane, models });
  const ok = verdict(results, n);
  console.log(ok ? 'WITHIN TOLERANCE' : 'OVER TOLERANCE: tighten the prompt and re-measure; no guard');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e && e.message); process.exit(2); });
