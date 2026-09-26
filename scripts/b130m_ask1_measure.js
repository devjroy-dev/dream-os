#!/usr/bin/env node
'use strict';
// scripts/b130m_ask1_measure.js  RUNG b130m · CE-45 ASK-1 cut 1 · THE MEASURED HALF (R-45.33; b117m's three modes, the read-first (vii)).
//
// NOT A FLOOR BENCH. --live calls live models, so it is never in the floor and never on a floor clock. The file name carries no
// "_bench"; its default mode is --readers, which calls nothing, so the floor runner's bare run is safe and quick.
//
// THREE MODES
//   --readers (default) the five rule readers against HAND-LABELLED replies FIRST (C-44.4): every label read as labelled, false
//             positives 0 and misses 0, or the rung is red and --live must not be run.
//   --dry     the REAL agent and the REAL tools over the WHOLE bank on the fixture studio, with a stub model; proves the harness
//             drives the real loop, and MEASURES the size of every request the loop would send, from which the one cost line
//             the founder reads before --live is printed. DeepSeek's price is not in the tree: it is printed as unknown unless
//             DEEPSEEK_USD_PER_M_IN and DEEPSEEK_USD_PER_M_OUT are set from DeepSeek's own page on the day.
//   --live    the founder's run on his keys (src/lib/llm.js reads them from the environment and never prints them): the bank's
//             agent questions, strat 'missed' N = 10 each, the rest N = 1, on claude-haiku-4-5-20251001 and deepseek-v4-flash,
//             each question against a fresh fixture. PRINTS RATES ONLY (and --show-misses prints missed replies' TEXT, model
//             output only). Options: --model=haiku|deepseek|both, --n-missed=10, --n-rest=1, --limit=K (first K questions).
//   --probe   (cut 1b, F-44.182) THE CACHE, PROVEN: the API's own token count of the fixed prefix against the model's minimum
//             (Haiku 4.5: 4,096, Anthropic's page read 26 September 2026), then TWO identical live calls with the usage printed:
//             cache_creation_input_tokens on the first, cache_read_input_tokens on the second, and each call's dollar cost. Two
//             short calls, max_tokens 16. --model=haiku|deepseek.
// A-45.15 FOR --live (as the chair relayed it): the projected cost is printed FIRST and the run REFUSES to start without
//   --budget=<USD>; every run is RECORDED as it goes (one JSON line per run, in /tmp/b130m/<model>.jsonl); the run STOPS at the first
//   credit or billing error and when the spend reaches the budget; --resume runs only what did not run (keyed by question id and
//   repetition), and the verdict is read over everything recorded. Cost per run is computed from the API's own usage fields.
// TOLERANCE (the chair): m2 and m3 at ZERO misses; m1, m4 and m5 at most ONE in twenty, per rule per model. Above it the prompt is
// tightened and re-measured before cut 2 opens; never a guard (F-G).
//
// THE RULES, each a reader that returns true when the reply KEEPS the rule:
//   m1 answers the question asked: the reply's kind matches the bank's expect (a fact, nothing, not in records, a hand-back, a
//      question back, small talk, advice), a tool of the expected family was called, and the expected facts appear
//   m2 every date, amount, time and count in the reply appears in that turn's tool results (or in her own words)
//   m3 no write attempted (the store double records every call)
//   m4 when every tool result held nothing, the reply says the records do not show it (and invents nothing, m2)
//   m5 plain words: no persona, no "assistant", no em or en dash, no markdown
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const P = (r) => path.join(ROOT, r);
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';
const argv = process.argv.slice(2);
const arg = (k, d) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d; };
const MODE = argv.includes('--probe') ? 'probe' : argv.includes('--live') ? 'live' : argv.includes('--dry') ? 'dry' : 'readers';
const SHOW = argv.includes('--show-misses');
const S = require('./lib/ask1_store');
const BANK = JSON.parse(require('fs').readFileSync(P('scripts/lib/ask1_bank.json'), 'utf8'));

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';
const DATE_RE = new RegExp(`\\b\\d{1,2} (?:${MONTHS})(?: \\d{4})?\\b`, 'g');
const AMOUNT_RE = /Rs\.? ?[\d,]+/g;
const TIME_RE = /\b\d{1,2}(?::\d{2})? ?(?:am|pm)\b/gi;
const COUNT_RE = /(?<![\d,:])\b\d{1,4}\b(?![\d,:]| ?(?:am|pm)\b)/gi;
const NOT_IN = /\b(?:do(?:es)? ?n[o']t (?:show|have|hold|list)|not (?:in|on) (?:your|the) records|no record|(?:can(?:'t|not)|could(?:n't| not)) find|nothing (?:on|in|for|booked|recorded|listed)|no (?:\w+ ){0,3}(?:on file|recorded|listed|found|booked|scheduled)|there (?:are|is) no|you have no|none)\b/i;
const PERSONA = /\b(?:I am|I'm|this is|it's)\s+(?:your\s+)?(?:AI\s+)?(?:assistant|victor|donna|eliza|harvey|myra)\b|\bassistant\b/i;

const norm = (t) => String(t || '').replace(/\s+/g, ' ');
function factsIn(reply) {
  const t = norm(reply);
  const dates = (t.match(DATE_RE) || []);
  const amounts = (t.match(AMOUNT_RE) || []).map((a) => a.replace(/^Rs\.? ?/, 'Rs ').replace(/,$/, ''));
  const times = (t.match(TIME_RE) || []).map((x) => x.toLowerCase().replace(/\s/g, ''));
  const noDates = t.replace(DATE_RE, ' ').replace(AMOUNT_RE, ' ').replace(TIME_RE, ' ');
  const counts = (noDates.match(COUNT_RE) || []);
  return { dates, amounts, times, counts };
}
// For --show-misses on m2: the facts in the reply that the turn's tool results (and her own words) do not hold, each named by kind.
function unfound(reply, c) {
  const pool = norm(`${JSON.stringify(c.calls.map((x) => x.result))} ${c.text}`).toLowerCase().replace(/\s/g, '');
  const f = factsIn(reply); const has = (x) => pool.includes(String(x).toLowerCase().replace(/\s/g, ''));
  return [...f.dates.filter((x) => !has(x)).map((x) => `date ${x}`), ...f.amounts.filter((x) => !has(x)).map((x) => `amount ${x}`), ...f.times.filter((x) => !has(x)).map((x) => `time ${x}`), ...f.counts.filter((x) => !has(x)).map((x) => `count ${x}`)];
}
const R = {
  m1: (reply, c) => {
    const k = c.expect.kind; const t = norm(reply);
    const called = !c.expect.tools.length || c.calls.some((x) => c.expect.tools.includes(x.name));
    const facts = (c.expect.facts || []).every((f) => t.toLowerCase().includes(String(f).toLowerCase()));
    if (k === 'fact') return called && facts && t.length > 0;
    if (k === 'none' || k === 'not_in_records') return called && NOT_IN.test(t);
    if (k === 'handback') return /\bsend "/i.test(t) || /send (?:it |that )?as (?:its|a) own message/i.test(t);
    if (k === 'ask_back') return /\?/.test(t);
    if (k === 'advice') return /Advisor/.test(t);
    if (k === 'smalltalk') return t.length > 0 && t.length <= 240;
    return true;
  },
  m2: (reply, c) => {
    const pool = norm(`${JSON.stringify(c.calls.map((x) => x.result))} ${c.text}`).toLowerCase().replace(/\s/g, '');
    const f = factsIn(reply);
    const inPool = (s) => pool.includes(String(s).toLowerCase().replace(/\s/g, ''));
    const datesOk = f.dates.every((d) => inPool(d) || c.calls.some((x) => JSON.stringify(x.result).includes(d)));
    return datesOk && f.amounts.every(inPool) && f.times.every(inPool) && f.counts.every(inPool);
  },
  m3: (_reply, c) => c.writes === 0,
  m4: (reply, c) => {
    const empty = c.calls.length > 0 && c.calls.every((x) => x.result && x.result.ok === true && isEmpty(x.result));
    return !empty || NOT_IN.test(norm(reply));
  },
  m5: (reply) => !/[\u2013\u2014]/.test(reply) && !/\*\*|__|^#{1,6} |^\s*[-*\u2022] /m.test(reply) && !PERSONA.test(reply),
};
function isEmpty(r) {
  const lists = ['blocked', 'free', 'booked', 'part_held', 'not_blocked', 'days_with_events', 'unpaid_milestones', 'milestones', 'events', 'blocks', 'leads', 'invoices', 'payments', 'expenses', 'packages', 'members', 'sent', 'payment_reminders', 'tasks', 'shoots', 'names'];
  if (r.matches === 0) return true;
  const hasList = lists.some((k) => Array.isArray(r[k]) && r[k].length);
  const hasCount = ['count', 'event_count', 'open_invoices', 'payment_count', 'shoots_count'].some((k) => Number(r[k]) > 0);
  return !hasList && !hasCount && r.matches !== 1 && !r.state;
}

// ── --readers: the hand-labelled replies, every rule's verdict stated by hand (C-44.4) ─────────────────────────────────
const RES = (x) => [{ name: x.name || 'days', result: x.result }];
const LABELLED = [
  { reply: 'Your blocked days in October are 2 October 2026 and 24 October 2026.', text: 'What dates are blocked in October?', expect: { kind: 'fact', tools: ['days'] }, calls: RES({ result: { ok: true, blocked: ['2 October 2026', '24 October 2026'], counts: { blocked: 2 } } }), writes: 0, want: { m1: true, m2: true, m3: true, m4: true, m5: true } },
  { reply: 'Your blocked days are 2 October 2026 and 3 October 2026.', text: 'What dates are blocked in October?', expect: { kind: 'fact', tools: ['days'] }, calls: RES({ result: { ok: true, blocked: ['2 October 2026', '24 October 2026'] } }), writes: 0, want: { m1: true, m2: false, m3: true, m4: true, m5: true } },
  { reply: 'You are owed Rs 2,13,000 across 2 open invoices.', text: 'How much is owed to me?', expect: { kind: 'fact', tools: ['owed'], facts: ['Rs 2,13,000'] }, calls: RES({ name: 'owed', result: { ok: true, owed_total: 'Rs 2,13,000', open_invoices: 2, invoices: [{}] } }), writes: 0, want: { m1: true, m2: true, m3: true, m4: true, m5: true } },
  { reply: 'You are owed about Rs 2,20,000.', text: 'How much is owed to me?', expect: { kind: 'fact', tools: ['owed'], facts: ['Rs 2,13,000'] }, calls: RES({ name: 'owed', result: { ok: true, owed_total: 'Rs 2,13,000', open_invoices: 2 } }), writes: 0, want: { m1: false, m2: false, m3: true, m4: true, m5: true } },
  { reply: 'New leads: Asha Walk Fifteen, Ravi Walk Thirteen.', text: 'How much is owed to me?', expect: { kind: 'fact', tools: ['owed'], facts: ['Rs 2,13,000'] }, calls: RES({ name: 'leads', result: { ok: true, count: 2, leads: [{ name: 'Asha Walk Fifteen' }] } }), writes: 0, want: { m1: false, m2: true, m3: true, m4: true, m5: true } },
  { reply: 'Your records do not show a client called Rohit. You can add him in Clients.', text: 'Who is Rohit?', expect: { kind: 'not_in_records', tools: ['client'] }, calls: RES({ name: 'client', result: { ok: true, matches: 0 } }), writes: 0, want: { m1: true, m2: true, m3: true, m4: true, m5: true } },
  { reply: 'Rohit is booked for 5 March 2027.', text: 'Who is Rohit?', expect: { kind: 'not_in_records', tools: ['client'] }, calls: RES({ name: 'client', result: { ok: true, matches: 0 } }), writes: 0, want: { m1: false, m2: false, m3: true, m4: false, m5: true } },
  { reply: 'You have no shoots in January.', text: 'Any shoots in January?', expect: { kind: 'not_in_records', tools: ['events', 'days'] }, calls: RES({ name: 'events', result: { ok: true, count: 0, events: [] } }), writes: 0, want: { m1: true, m2: true, m3: true, m4: true, m5: true } },
  { reply: 'Sarah Kapoor owes Rs 1,33,000. To remind her, send "Remind Sarah Kapoor about the payment" as its own message.', text: 'How much does Sarah owe, and send her a reminder', expect: { kind: 'handback', tools: [] }, calls: RES({ name: 'owed', result: { ok: true, owed_total: 'Rs 1,33,000', open_invoices: 1 } }), writes: 0, want: { m1: true, m2: true, m3: true, m4: true, m5: true } },
  { reply: 'Sarah Kapoor owes Rs 1,33,000. I have sent her a reminder.', text: 'How much does Sarah owe, and send her a reminder', expect: { kind: 'handback', tools: [] }, calls: RES({ name: 'owed', result: { ok: true, owed_total: 'Rs 1,33,000', open_invoices: 1 } }), writes: 0, want: { m1: false, m2: true, m3: true, m4: true, m5: true } },
  { reply: 'I found two: Priya Mehta and Priya Sachdeva. Which one?', text: 'Does Priya have a package?', expect: { kind: 'ask_back', tools: ['client'] }, calls: RES({ name: 'client', result: { ok: true, matches: 2, names: [{ name: 'Priya Mehta' }, { name: 'Priya Sachdeva' }] } }), writes: 0, want: { m1: true, m2: true, m3: true, m4: true, m5: true } },
  { reply: '**Blocked:**\n- 2 October 2026', text: 'What is blocked?', expect: { kind: 'fact', tools: ['days'] }, calls: RES({ result: { ok: true, blocked: ['2 October 2026'] } }), writes: 0, want: { m1: true, m2: true, m3: true, m4: true, m5: false } },
  { reply: 'Free on 3 October 2026 \u2014 nothing booked.', text: 'Am I free on 3 October?', expect: { kind: 'fact', tools: ['day'] }, calls: RES({ name: 'day', result: { ok: true, date: '3 October 2026', state: 'free', events: [] } }), writes: 0, want: { m1: true, m2: true, m3: true, m4: true, m5: false } },
  { reply: "I'm your assistant. You are free on 3 October 2026.", text: 'Am I free on 3 October?', expect: { kind: 'fact', tools: ['day'] }, calls: RES({ name: 'day', result: { ok: true, date: '3 October 2026', state: 'free', events: [] } }), writes: 0, want: { m1: true, m2: true, m3: true, m4: true, m5: false } },
  { reply: 'Your packages: Classic Wedding at Rs 1,50,000.', text: 'What are my packages?', expect: { kind: 'fact', tools: ['packages'] }, calls: RES({ name: 'packages', result: { ok: true, count: 2, packages: [{ name: 'Classic Wedding', total: 'Rs 1,50,000' }] } }), writes: 1, want: { m1: true, m2: true, m3: false, m4: true, m5: true } },
  { reply: 'You have 3 new leads: Asha Walk Fifteen, Ravi Walk Thirteen and one more.', text: 'Who are my new leads?', expect: { kind: 'fact', tools: ['leads'] }, calls: RES({ name: 'leads', result: { ok: true, count: 3, leads: [{ name: 'Asha Walk Fifteen' }, { name: 'Ravi Walk Thirteen' }] } }), writes: 0, want: { m1: true, m2: true, m3: true, m4: true, m5: true } },
  { reply: 'You have 4 new leads.', text: 'Who are my new leads?', expect: { kind: 'fact', tools: ['leads'] }, calls: RES({ name: 'leads', result: { ok: true, count: 3, leads: [{ name: 'Asha Walk Fifteen' }] } }), writes: 0, want: { m1: true, m2: false, m3: true, m4: true, m5: true } },
  { reply: 'Your engagement on 22 November 2026 is at 11:00 am.', text: 'What time is my engagement on 22 November?', expect: { kind: 'fact', tools: ['day'], facts: ['11:00 am'] }, calls: RES({ name: 'day', result: { ok: true, date: '22 November 2026', events: [{ time: '11:00 am' }] } }), writes: 0, want: { m1: true, m2: true, m3: true, m4: true, m5: true } },
  { reply: 'Your engagement on 22 November 2026 is at 10:00 am.', text: 'What time is my engagement on 22 November?', expect: { kind: 'fact', tools: ['day'], facts: ['11:00 am'] }, calls: RES({ name: 'day', result: { ok: true, date: '22 November 2026', events: [{ time: '11:00 am' }] } }), writes: 0, want: { m1: false, m2: false, m3: true, m4: true, m5: true } },
  { reply: 'For pricing advice, open the Advisor room in the app. Your Classic Wedding package is Rs 1,50,000.', text: 'How should I price my package', expect: { kind: 'advice', tools: [] }, calls: RES({ name: 'packages', result: { ok: true, count: 1, packages: [{ total: 'Rs 1,50,000' }] } }), writes: 0, want: { m1: true, m2: true, m3: true, m4: true, m5: true } },
];

function readersCheck() {
  let fp = 0; let miss = 0; const lines = [];
  LABELLED.forEach((c, i) => {
    for (const k of Object.keys(R)) {
      const got = R[k](c.reply, c);
      if (got !== c.want[k]) { if (got === false) fp += 1; else miss += 1; lines.push(`  label ${i + 1} ${k}: labelled ${c.want[k]}, read ${got}  "${c.reply.slice(0, 70)}"`); }
    }
  });
  console.log(`b130m --readers: ${LABELLED.length} hand-labelled replies x 5 rules; false positives ${fp}, misses ${miss}`);
  lines.forEach((l) => console.log(l));
  return fp === 0 && miss === 0;
}

// ── the harness: ONE question through the REAL agent and the REAL tools, on a fresh fixture ────────────────────────────
async function runOne(q, seat, create) {
  const A = require(P('src/lib/vendor/askAgent.js'));
  const store = S.makeStore();
  const sizes = [];
  const wrapped = async (prov, params) => { sizes.push(JSON.stringify(params).length); return create(prov, params); };
  const r = await A.answerQuestion({ supabase: store.client, vendorId: S.VA, agentId: 'ag', lane: 'pwa', message: q.text, threadId: null, seat }, { llmCreate: wrapped, nowMs: S.NOW_MS });
  return { r, writes: store.writes().length, sizes };
}
const agentQuestions = () => BANK.questions.filter((q) => q.expect.kind !== 'door');

async function dry() {
  let ok = 0; let chars = 0; let rounds = 0; let n = 0;
  const stub = (q) => { let k = 0; return async () => { k += 1; if (k === 1) { const tool = q.expect.tools[0] || 'packages'; const input = { when_as_spoken: q.text, range_as_spoken: q.text, name_as_spoken: q.text }; return { usage: {}, content: [{ type: 'tool_use', id: 'd1', name: tool, input }] }; } return { usage: {}, content: [{ type: 'text', text: 'From your records.' }] }; }; };
  for (const q of agentQuestions()) {
    const { r, writes, sizes } = await runOne(q, { provider: 'anthropic', model: 'stub' }, stub(q));
    n += 1; if (r.ok && writes === 0) ok += 1; chars += sizes.reduce((a, b) => a + b, 0); rounds += sizes.length;
  }
  const tokIn = chars / 4 / n; // ~4 characters per token, the request as the loop built it (system, 13 tool schemas, thread, results)
  const tokOut = 250 * (rounds / n);
  const haiku = (tokIn * 1.0 + tokOut * 5.0) / 1e6;
  const dsIn = Number(process.env.DEEPSEEK_USD_PER_M_IN); const dsOut = Number(process.env.DEEPSEEK_USD_PER_M_OUT);
  const ds = Number.isFinite(dsIn) && Number.isFinite(dsOut) ? (tokIn * dsIn + tokOut * dsOut) / 1e6 : null;
  const missed = agentQuestions().filter((q) => q.strat === 'missed').length; const rest = agentQuestions().length - missed;
  const runs = missed * Number(arg('n-missed', 10)) + rest * Number(arg('n-rest', 1));
  console.log(`b130m --dry: ${ok} of ${n} bank questions ran the real loop with zero writes; ${(rounds / n).toFixed(2)} model calls a question with this stub`);
  console.log(`measured request size: about ${Math.round(tokIn)} input tokens a question (no cache credit assumed); output assumed 250 a call`);
  const A = require(P('src/lib/vendor/askAgent.js')); const pre = A.requestParams('m', []); const prefix = (JSON.stringify(pre.tools).length + pre.system[0].text.length) / 4;
  const perCall = tokIn / (rounds / n); const tail = Math.max(0, perCall - prefix); const calls = rounds / n;
  const warm = calls * (prefix * 0.10 + tail * 1.0 + 250 * 5.0) / 1e6; // the prefix READ from the cache on every call (a warm run)
  console.log(`CACHED (F-44.182): prefix about ${Math.round(prefix)} tokens read at 0.1x on every call once warm; haiku about $${warm.toFixed(4)} a question warm, the first call of a cold run paying the 1.25x write once`);
  console.log(`COST LINE (no cache, the ceiling): haiku about $${haiku.toFixed(4)} a question; --live runs ${runs} questions a model: haiku about $${(haiku * runs).toFixed(2)} (warm cache about $${(warm * runs).toFixed(2)}); deepseek ${ds === null ? 'price unknown (set DEEPSEEK_USD_PER_M_IN and _OUT from its page)' : `about $${(ds * runs).toFixed(2)}`}`);
  return ok === n;
}

// ── cost from the API's own usage (prices per million tokens) ──────────────────────────────────────────────────────
const PRICES = {
  haiku: { in: 1.0, write: 1.25, read: 0.10, out: 5.0, src: "Anthropic's pricing table, read 26 September 2026" },
  deepseek: (() => { const i = Number(process.env.DEEPSEEK_USD_PER_M_IN); const o = Number(process.env.DEEPSEEK_USD_PER_M_OUT); return Number.isFinite(i) && Number.isFinite(o) ? { in: i, write: i, read: Number(process.env.DEEPSEEK_USD_PER_M_HIT || i / 50), out: o, src: 'DEEPSEEK_USD_PER_M_IN/_OUT/_HIT from its page on the day' } : null; })(),
};
function costOf(m, u) {
  const p = PRICES[m]; if (!p || !u) return null;
  const n = (k) => Number(u[k]) || 0;
  return (n('input_tokens') * p.in + n('cache_creation_input_tokens') * p.write + n('cache_read_input_tokens') * p.read + n('output_tokens') * p.out) / 1e6;
}
const MODELS = { haiku: { provider: 'anthropic', model: 'claude-haiku-4-5-20251001', min: 4096 }, deepseek: { provider: 'deepseek', model: 'deepseek-v4-flash', min: null } };
// A-45.15 as standing: the run STOPS at the first credit, quota OR AUTH error (a bad or revoked key is never retried 549 times).
const CREDIT = /credit balance|insufficient|billing|payment required|quota|402|exceeded your current|balance is too low|401|403|authentication|unauthori[sz]ed|invalid x-api-key|invalid api key|permission denied/i;

async function probe() {
  const m = arg('model', 'haiku'); const seat = MODELS[m]; if (!seat) { console.log('--model=haiku|deepseek'); return false; }
  const A = require(P('src/lib/vendor/askAgent.js'));
  const { llmCreate } = require(P('src/lib/llm.js'));
  const params = { ...A.requestParams(seat.model, [{ role: 'user', content: 'What are my packages?' }]), max_tokens: 16 };
  let ok = true;
  if (seat.provider === 'anthropic') {
    const Anthropic = require('@anthropic-ai/sdk'); const C = Anthropic.default || Anthropic;
    const counted = await new C().messages.countTokens({ model: seat.model, system: params.system, tools: params.tools, messages: [{ role: 'user', content: 'x' }] });
    const prefix = counted.input_tokens;
    console.log(`prefix (tools + system, by the API's own count, plus a one-token message): ${prefix} tokens; ${m}'s minimum cacheable prefix: ${seat.min}; ${prefix > seat.min ? 'ABOVE' : 'BELOW'} it`);
    if (!(prefix > seat.min)) ok = false;
  } else console.log('DeepSeek caches a repeated prefix on its own; llm.js strips cache_control for it; no minimum is published on its page');
  for (const k of [1, 2]) {
    const r = await llmCreate(seat.provider, params);
    const u = r && r.usage ? r.usage : {};
    const c = costOf(m, u);
    console.log(`call ${k}: input ${u.input_tokens || 0}, cache_creation ${u.cache_creation_input_tokens || 0}, cache_read ${u.cache_read_input_tokens || 0}, output ${u.output_tokens || 0}; cost ${c === null ? 'price unknown' : `$${c.toFixed(6)}`}`);
    if (seat.provider === 'anthropic' && k === 1 && !(u.cache_creation_input_tokens > 0 || u.cache_read_input_tokens > 0)) ok = false;
    if (seat.provider === 'anthropic' && k === 2 && !(u.cache_read_input_tokens > 0)) ok = false;
  }
  console.log(ok ? 'PROBE GREEN: the prefix is above the minimum, written on call 1 (or already warm) and READ on call 2' : 'PROBE RED: the cache is not proven; do not run --live');
  return ok;
}

async function live() {
  const fs = require('fs'); const os = require('os');
  const { llmCreate } = require(P('src/lib/llm.js'));
  const which = arg('model', ''); if (!MODELS[which]) { console.log('--live needs --model=haiku or --model=deepseek (one model a run)'); return false; }
  const budget = Number(arg('budget', 'NaN')); const price = PRICES[which];
  const limit = Number(arg('limit', 0)); let qs = agentQuestions(); if (limit > 0) qs = qs.slice(0, limit);
  const plan = []; for (const q of qs) { const N = q.strat === 'missed' ? Number(arg('n-missed', 10)) : Number(arg('n-rest', 1)); for (let i = 0; i < N; i += 1) plan.push({ q, key: `${q.id}#${i}` }); }
  const dir = path.join(os.tmpdir(), 'b130m'); fs.mkdirSync(dir, { recursive: true }); const file = path.join(dir, `${which}.jsonl`);
  const done = new Map(); if (argv.includes('--resume') && fs.existsSync(file)) fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).forEach((l) => { try { const r = JSON.parse(l); if (r.key && r.final && r.ok === true) done.set(r.key, r); } catch (_e) { /* a torn line */ } }); // --resume runs only what has no KEPT result: an errored run runs again
  if (!argv.includes('--resume') && fs.existsSync(file)) fs.renameSync(file, `${file}.${Date.now()}.old`);
  const todo = plan.filter((p) => !done.has(p.key));
  const per = Number(arg('per-question-usd', which === 'haiku' ? 0.0045 : 0.0012));
  console.log(`PROJECTED: ${todo.length} runs to go of ${plan.length} (${done.size} already recorded), about $${(todo.length * per).toFixed(2)} at about $${per} a question (${price ? price.src : 'price unknown'}); record: ${file}`);
  if (!Number.isFinite(budget) || budget <= 0) { console.log('REFUSED: --live needs --budget=<USD> (A-45.15). Nothing was called.'); return false; }
  if (!price) { console.log('REFUSED: no price for this model (set DEEPSEEK_USD_PER_M_IN and _OUT from its page on the day). Nothing was called.'); return false; }
  let spent = [...done.values()].reduce((a, r) => a + (r.cost || 0), 0); let stop = null;
  for (const { q, key } of todo) {
    if (spent >= budget) { stop = `the budget $${budget} is reached ($${spent.toFixed(4)} spent)`; break; }
    let rec;
    try {
      const { r, writes } = await runOne(q, { provider: MODELS[which].provider, model: MODELS[which].model }, llmCreate);
      const cost = costOf(which, r.usage) || 0; spent += cost;
      if (!r.ok && CREDIT.test(String(r.error))) { stop = `a credit, quota or auth error: ${String(r.error).slice(0, 160)}`; fs.appendFileSync(file, `${JSON.stringify({ key, id: q.id, final: false, error: r.error })}\n`); break; }
      rec = { key, id: q.id, final: true, ok: r.ok, error: r.ok ? null : r.error, reply: r.ok ? r.reply : null, calls: (r.calls || []).map((c) => ({ name: c.name, result: c.result })), writes, usage: r.usage, cost };
    } catch (e) {
      if (CREDIT.test(String(e && e.message))) { stop = `a credit, quota or auth error: ${String(e.message).slice(0, 160)}`; break; }
      rec = { key, id: q.id, final: true, ok: false, error: String(e && e.message).slice(0, 200), cost: 0 };
    }
    fs.appendFileSync(file, `${JSON.stringify(rec)}\n`); done.set(key, rec);
    process.stdout.write(`\r  ${which}: ${done.size}/${plan.length} recorded, $${spent.toFixed(4)} spent`);
  }
  console.log('');
  if (stop) console.log(`STOPPED: ${stop}. ${plan.length - done.size} runs did not run; --resume runs only those.`);
  // THE VERDICT, over everything recorded for this plan.
  const byId = new Map(qs.map((q) => [q.id, q]));
  const tally = { m1: [0, 0], m2: [0, 0], m3: [0, 0], m4: [0, 0], m5: [0, 0] }; let errors = 0; let runs = 0; let cache = 0;
  for (const p of plan) {
    const r = done.get(p.key); if (!r) continue; runs += 1;
    if (r.usage && r.usage.cache_read_input_tokens > 0) cache += 1;
    if (!r.ok) { errors += 1; if (SHOW) console.log(`  ERROR ${which} ${r.id} "${byId.get(r.id).text}" -> ${r.error}`); continue; }
    const q = byId.get(r.id); const c = { ...q, calls: r.calls, writes: r.writes };
    for (const k of Object.keys(R)) { const kept = R[k](r.reply, c); tally[k][0] += kept ? 1 : 0; tally[k][1] += 1; if (!kept && SHOW) console.log(`  MISS ${which} ${k} ${q.id} [${q.family}/${q.expect.kind}${k === 'm1' ? `; wanted ${q.expect.tools.join('|') || 'any tool'}, called ${(c.calls || []).map((x) => x.name).join(',') || 'none'}` : ''}${k === 'm2' ? `; not in the results: ${unfound(r.reply, c).join('; ')}` : ''}] "${q.text}" -> ${String(r.reply).replace(/\n/g, ' / ')}`); }
  }
  let allOk = !stop;
  for (const k of Object.keys(tally)) {
    const [kept, all] = tally[k]; const missN = all - kept; const zero = k === 'm2' || k === 'm3';
    const ok = zero ? missN === 0 : missN * 20 <= all; if (!ok) allOk = false;
    console.log(`  ${which} ${k}: ${kept}/${all} kept (${missN} missed) ${ok ? 'within' : 'OVER'} tolerance`);
  }
  console.log(`  ${which}: ${runs} runs recorded; errors (the glitch line would speak) ${errors}; runs that READ the cache ${cache}; spent $${spent.toFixed(4)}`);
  return allOk;
}

(async () => {
  const readersOk = readersCheck();
  if (MODE === 'readers') process.exit(readersOk ? 0 : 1);
  if (!readersOk) { console.log('the readers are not proven; nothing else runs'); process.exit(1); }
  if (MODE === 'probe') process.exit((await probe()) ? 0 : 1);
  const ok = MODE === 'dry' ? await dry() : MODE === 'probe' ? await probe() : await live();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.log(`b130m ERROR ${e && e.message}`); process.exit(2); });
