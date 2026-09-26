#!/usr/bin/env node
'use strict';
// scripts/m181_ear_short_relay_measure.js · CE-45/46 ELZ-1, extended by ELZ-2 (the chair's F7 ruling, 27 September 2026) · F-44.181 MEASURE
// (c-44.44: measure before any cure). READ-ONLY: it calls the LIVE listener (listenerDoor.hear, untouched) and writes nothing to the estate.
// For each short relay phrasing and client it asks N times and counts how often the ear hears a RELAY naming that client
// (acts[0].act === 'relay'), versus none or another act.
//
//   default     no thread history (ELZ-1's measure of 27 September: 44/160 heard as a relay)
//   --history   WITH thread history: the supabase double answers the listener's own read (listenerDoor.readThread: engine.messages, role
//               user|assistant, newest first) with the walk-twin thread's shape from the 2c walk (26 September) in the estate's own bytes
//               (doorLines B8, B37; relaySeat's "Not sent."), so the measure is of the ear in a thread that has just relayed, not of the ear
//               alone. listenerDoor.js is untouched: the double is handed to hear() as its `supabase` argument.
//   --dry       the loop, the record, the budget stop and the credit stop driven over a stub model; no key, no spend
//   --live      the paid run. A-45.15: the projected cost is printed FIRST; --budget=<USD> is REQUIRED (refused without it, nothing called);
//               every call is RECORDED as it goes (one JSON line per call, /tmp/m181/<mode>.jsonl); the run STOPS at the first credit,
//               quota or auth error and when the spend reaches the budget; --resume runs only what did not run.
//   A-46.1: bare (no --live, no --dry) it calls no model, prints what it would send, exits 0, so the floor reads it green (e-156).
//
// Usage: node scripts/m181_ear_short_relay_measure.js [--history] [--live --budget=1 | --dry] [--n=10] [--resume]
//        [--provider=anthropic] [--model=claude-haiku-4-5-20251001]
// Cost: phrases x clients x N listener calls (8 x 2 x 10 = 160 by default); the projection line prints the dollars before any call.
const fs = require('fs');
const os = require('os');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const has = (k) => argv.includes(`--${k}`);
const arg = (k, d) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=').slice(1).join('=') : d; };
const N = Math.max(1, Number(arg('n', '10')));
const HISTORY = has('history');
const MODE = has('live') ? 'live' : has('dry') ? 'dry' : 'bare';
const route = { provider: arg('provider', 'anthropic'), model: arg('model', 'claude-haiku-4-5-20251001'), listener_provider: arg('provider', 'anthropic'), listener_model: arg('model', 'claude-haiku-4-5-20251001') };
const { hear, SYSTEM, EAR_TOOL } = require(path.join(ROOT, 'src/lib/vendor/listenerDoor.js'));
const PHRASES = ['tell {c} hello', 'tell {c} hi', 'tell {c} good morning', 'tell {c} thank you', "tell {c} we're confirmed", 'tell {c} see you soon', 'tell {c} happy diwali', 'tell {c} congratulations'];
const CLIENTS = ['walk twin', 'Sarah'];

// ── THE THREAD SHAPE (--history): the 2c walk of 26 September on DEV440, the estate's own fixed bytes ─────────────────────────────────
// The vendor asked for a relay to a twin, picked "2", read the frame, said no. doorLines.js B8 and B37 (their bytes at 7e03e32), relaySeat.js
// "Not sent." The clients and dates are the walk's (Walk twin 5 March 2027 / 12 June 2027; Sarah 5 March 2028). Newest first, as Postgres
// returns them to readThread (order created_at desc); readThread reverses after filtering and drops the row equal to the new message.
const T0 = Date.parse('2026-09-26T04:30:00Z');
const row = (i, role, content) => ({ id: `m181-${i}`, role, content, meta: null, created_at: new Date(T0 + i * 60000).toISOString() });
const THREAD_BY_CLIENT = {
  'walk twin': [
    row(1, 'user', 'tell walk twin hi'),
    row(2, 'assistant', 'Two clients are called Walk twin: 1. Walk twin (5 March 2027) 2. Walk twin (12 June 2027). Reply with the number.'),
    row(3, 'user', '2'),
    row(4, 'assistant', 'Here is the draft:\n\n"Hi Walk twin, hope you are well!"\n\nSend this to Walk twin (+918000000000)? Reply YES or NO.'),
    row(5, 'user', 'no'),
    row(6, 'assistant', 'Not sent.'),
  ],
  Sarah: [
    row(1, 'user', 'tell Sarah hi'),
    row(2, 'assistant', 'Here is the draft:\n\n"Hi Sarah, hope you are well!"\n\nSend this to Sarah (+919625759924)? Reply YES or NO.'),
    row(3, 'user', 'no'),
    row(4, 'assistant', 'Not sent.'),
  ],
};
// The double answers ONLY the listener's read: schema('engine').from('messages')...select().eq().in().order().limit() awaited -> { data, error }.
// Every other query answers empty. It writes nothing and can write nothing (no insert/update/delete).
function stubFor(rows) {
  const answer = { data: rows.slice().reverse(), error: null };   // newest first, as readThread orders it
  const q = { select: () => q, eq: () => q, neq: () => q, order: () => q, limit: () => q, is: () => q, in: () => q, gte: () => q, lte: () => q,
    maybeSingle: async () => ({ data: null, error: null }), then: (r) => r(answer) };
  return { from() { return q; }, schema() { return this; } };
}
const EMPTY = stubFor([]);

// ── COST, FIRST (A-45.15). The request the listener sends is SYSTEM + EAR_TOOL + the thread text + the message; tokens estimated at
// 3.7 characters a token (the API's usage settles it per call, and the record carries the API's own numbers). Haiku 4.5's prices from
// Anthropic's page, read 27 September 2026: $1.00 in, $5.00 out per million; a listener answer is one tool_use, assumed 150 tokens out.
const PRICE = { in: 1.0, out: 5.0, src: "Anthropic's pricing page, read 27 September 2026 (claude-haiku-4-5)" };
function threadChars(client) { return HISTORY ? (THREAD_BY_CLIENT[client] || []).reduce((a, r) => a + r.content.length + 20, 0) : 0; }
function projectedPerCall(client, msg) {
  const chars = (Array.isArray(SYSTEM) ? SYSTEM.join('\n') : String(SYSTEM)).length + JSON.stringify(EAR_TOOL).length + threadChars(client) + msg.length + 40;
  const tokIn = chars / 3.7;
  return (tokIn * PRICE.in + 150 * PRICE.out) / 1e6;
}
function costOf(u) { if (!u) return 0; const n = (k) => Number(u[k] || 0); return ((n('input_tokens') + n('cache_creation_input_tokens') + n('cache_read_input_tokens')) * PRICE.in + n('output_tokens') * PRICE.out) / 1e6; }
// A-45.15 as standing (b130m's regex): the run STOPS at the first credit, quota OR AUTH error.
const CREDIT = /credit balance|insufficient|billing|payment required|quota|402|exceeded your current|balance is too low|401|403|authentication|unauthori[sz]ed|invalid x-api-key|invalid api key|permission denied/i;

// ── THE PLAN: one key per (phrase, client, repetition) ──────────────────────────────────────────────────────────────────────────────
const PLAN = [];
for (const p of PHRASES) for (const c of CLIENTS) for (let i = 0; i < N; i += 1) PLAN.push({ key: `${p}|${c}|${i}`, phrase: p, client: c, i, msg: p.replace('{c}', c) });

// The stub model (--dry): --dry-behaviour=relay (default) hears a relay for every "tell" message, so the loop, the record and the totals
// are exercised; =none hears no task (the otherwise column); =credit throws the credit error on the first call, so the stop is exercised.
const DRY = { calls: 0, threadSeen: 0 };   // --dry proof that the history double reaches the listener's own request text
function dryModel(behaviour = 'relay') {
  return async (_provider, params) => {
    const text = String(params.messages[0].content);
    DRY.calls += 1; if (/Not sent\./.test(text)) DRY.threadSeen += 1;
    if (behaviour === 'credit') throw new Error('400 invalid_request_error: Your credit balance is too low to access the Anthropic API');
    const m = text.match(/New message: tell (.+?) (hello|hi|good morning|thank you|we're confirmed|see you soon|happy diwali|congratulations)$/);
    const client = m ? m[1] : 'someone';
    const acts = behaviour === 'relay' ? [{ act: 'relay', client_as_spoken: client }] : [];
    return { usage: { input_tokens: 2500, output_tokens: 150 }, content: [{ type: 'tool_use', name: 'ear_request', input: { route: acts.length ? 'task' : 'none', acts } }] };
  };
}

async function main() {
  const modeLabel = `${MODE}${HISTORY ? ' with history' : ' without history'}`;
  const per = PLAN.reduce((a, r) => a + projectedPerCall(r.client, r.msg), 0) / PLAN.length;
  console.log(`m181 (${modeLabel}): ${PHRASES.length} phrasings x ${CLIENTS.length} clients x ${N} = ${PLAN.length} listener calls on ${route.listener_provider}/${route.listener_model}`);
  console.log(`PROJECTED: about $${(per * PLAN.length).toFixed(2)} for the run, about $${per.toFixed(5)} a call (${PRICE.src}; no cache credit assumed); the API's own usage decides the spend printed at the end`);
  if (HISTORY) for (const c of CLIENTS) console.log(`  thread for ${JSON.stringify(c)}: ${THREAD_BY_CLIENT[c].length} rows, the last "${THREAD_BY_CLIENT[c][THREAD_BY_CLIENT[c].length - 1].content}"`);
  if (MODE === 'bare') {
    console.log('not live, no model called: the phrasings it would send; run with --live --budget=<USD> to measure, --dry to drive the loop over a stub');
    for (const p of PHRASES) for (const c of CLIENTS) console.log(`  ${JSON.stringify(p.replace('{c}', c))}`);
    return 0;
  }
  const budget = Number(arg('budget', MODE === 'dry' ? '1' : 'NaN'));
  if (!Number.isFinite(budget) || budget <= 0) { console.log('REFUSED: --live needs --budget=<USD> (A-45.15). Nothing was called.'); return 2; }
  if (MODE === 'live' && !process.env.ANTHROPIC_API_KEY && route.listener_provider === 'anthropic') { console.log('REFUSED: ANTHROPIC_API_KEY is not set. Nothing was called.'); return 2; }
  const deps = MODE === 'dry' ? { llmCreate: dryModel(arg('dry-behaviour', 'relay')) } : {};
  const dir = path.join(os.tmpdir(), 'm181'); fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${MODE}-${HISTORY ? 'with' : 'without'}-history.jsonl`);
  const done = new Map();
  if (has('resume') && fs.existsSync(file)) fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).forEach((l) => { try { const r = JSON.parse(l); if (r.key && r.final) done.set(r.key, r); } catch (_e) { /* a torn line */ } });
  if (!has('resume') && fs.existsSync(file)) fs.renameSync(file, `${file}.${Date.now()}.old`);
  const todo = PLAN.filter((r) => !done.has(r.key));
  console.log(`record: ${file}; ${todo.length} calls to go of ${PLAN.length} (${done.size} already recorded); budget $${budget}`);
  let spent = 0; let stop = null;
  for (const r of todo) {
    if (spent >= budget) { stop = `the budget $${budget} is reached ($${spent.toFixed(4)} spent)`; break; }
    const supabase = HISTORY ? stubFor(THREAD_BY_CLIENT[r.client] || []) : EMPTY;
    const out = await hear({ supabase, route, message: r.msg, conversationId: HISTORY ? `m181-${r.client}` : null, excludeId: null }, deps);
    const err = out && out.error ? String(out.error) : null;
    if (err && CREDIT.test(err)) { stop = `a credit, quota or auth error: ${err.slice(0, 160)}`; fs.appendFileSync(file, `${JSON.stringify({ key: r.key, final: false, error: err })}\n`); break; }
    const acts = out && out.request && Array.isArray(out.request.acts) ? out.request.acts : null;
    const a0 = acts && acts[0];
    const heard = err || !out.request ? 'error' : (a0 && a0.act === 'relay') ? 'relay' : (a0 ? a0.act : `none/${out.request.route}`);
    const cost = costOf(out && out.usage);
    spent += cost;
    const rec = { key: r.key, phrase: r.phrase, client: r.client, i: r.i, final: true, heard, error: err || null, usage: out && out.usage, cost };
    fs.appendFileSync(file, `${JSON.stringify(rec)}\n`);
    done.set(r.key, rec);
    process.stdout.write(`\r  ${done.size}/${PLAN.length} recorded, $${spent.toFixed(4)} spent`);
  }
  process.stdout.write('\n');
  if (stop) console.log(`STOPPED: ${stop}. ${PLAN.length - done.size} calls did not run; --resume runs only those.`);
  // THE VERDICT, over everything recorded for this plan.
  let tot = 0; let rel = 0; let errs = 0; let total = 0;
  for (const p of PHRASES) {
    for (const c of CLIENTS) {
      const recs = PLAN.filter((x) => x.phrase === p && x.client === c).map((x) => done.get(x.key)).filter(Boolean);
      const r = recs.filter((x) => x.heard === 'relay').length; const other = {};
      for (const x of recs) { if (x.heard !== 'relay') other[x.heard] = (other[x.heard] || 0) + 1; if (x.heard === 'error') errs += 1; total += x.cost || 0; }
      tot += recs.length; rel += r;
      console.log(`  ${JSON.stringify(p.replace('{c}', c)).padEnd(38)} relay ${r}/${recs.length}${Object.keys(other).length ? `   otherwise ${JSON.stringify(other)}` : ''}`);
    }
  }
  console.log(`m181 TOTAL (${modeLabel}): heard as a relay ${rel}/${tot} (${tot ? (100 * rel / tot).toFixed(1) : '0.0'}%), errors ${errs}, spent $${total.toFixed(4)} by the API's own usage`);
  if (MODE === 'dry') console.log(`dry proof: the thread's last line reached the listener's request in ${DRY.threadSeen}/${DRY.calls} calls (expected ${HISTORY ? 'all' : 'none'})`);
  return stop ? 3 : 0;
}

main().then((code) => process.exit(code)).catch((e) => { console.log(`m181 CRASHED: ${e && e.stack}`); process.exit(1); });
