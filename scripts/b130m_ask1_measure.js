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
const MODE = argv.includes('--live') ? 'live' : argv.includes('--dry') ? 'dry' : 'readers';
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
  console.log(`COST LINE: haiku about $${haiku.toFixed(4)} a question; --live runs ${runs} questions a model: haiku about $${(haiku * runs).toFixed(2)}; deepseek ${ds === null ? 'price unknown (set DEEPSEEK_USD_PER_M_IN and _OUT from its page)' : `about $${(ds * runs).toFixed(2)}`}`);
  return ok === n;
}

async function live() {
  const { llmCreate } = require(P('src/lib/llm.js'));
  const models = { haiku: { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' }, deepseek: { provider: 'deepseek', model: 'deepseek-v4-flash' } };
  const which = arg('model', 'both'); const use = which === 'both' ? ['haiku', 'deepseek'] : [which];
  const limit = Number(arg('limit', 0)); let qs = agentQuestions(); if (limit > 0) qs = qs.slice(0, limit);
  let allOk = true;
  for (const m of use) {
    const tally = { m1: [0, 0], m2: [0, 0], m3: [0, 0], m4: [0, 0], m5: [0, 0] }; let errors = 0; let runs = 0;
    for (const q of qs) {
      const N = q.strat === 'missed' ? Number(arg('n-missed', 10)) : Number(arg('n-rest', 1));
      for (let i = 0; i < N; i += 1) {
        runs += 1;
        const { r, writes } = await runOne(q, models[m], llmCreate);
        if (!r.ok) { errors += 1; continue; }
        const c = { ...q, calls: r.calls, writes };
        for (const k of Object.keys(R)) { const kept = R[k](r.reply, c); tally[k][0] += kept ? 1 : 0; tally[k][1] += 1; if (!kept && SHOW) console.log(`  MISS ${m} ${k} ${q.id} "${q.text}" -> ${r.reply.replace(/\n/g, ' / ')}`); }
      }
      process.stdout.write(`\r  ${m}: ${runs} runs`);
    }
    console.log('');
    for (const k of Object.keys(tally)) {
      const [kept, all] = tally[k]; const missN = all - kept; const zero = k === 'm2' || k === 'm3';
      const ok = zero ? missN === 0 : missN * 20 <= all; if (!ok) allOk = false;
      console.log(`  ${m} ${k}: ${kept}/${all} kept (${missN} missed) ${ok ? 'within' : 'OVER'} tolerance`);
    }
    console.log(`  ${m} errors (the glitch line would speak): ${errors} of ${runs}`);
  }
  return allOk;
}

(async () => {
  const readersOk = readersCheck();
  if (MODE === 'readers') process.exit(readersOk ? 0 : 1);
  if (!readersOk) { console.log('the readers are not proven; nothing else runs'); process.exit(1); }
  const ok = MODE === 'dry' ? await dry() : await live();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.log(`b130m ERROR ${e && e.message}`); process.exit(2); });
