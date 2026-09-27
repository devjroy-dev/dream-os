#!/usr/bin/env node
'use strict';
// scripts/m135c_couple_cache_probe.js · CE-46 ELZ-2 cut 2 · THE CACHE PROBE (F-44.182: a cache proven by probe before any live run; the
// chair's F5 (b), 27 September 2026). READ-ONLY on the estate: the store is a double (it writes nothing and can write nothing); the
// MODEL is the real one under --live, driven through the REAL runCoupleAgenticTurn so the request on the wire is byte for byte the
// turn's (tools + the one cached system block + messages), not a copy of it.
//
//   bare           no key, no call, exit 0: prints the three branches' sizes by estimate and what --live would send (A-46.1)
//   --live         the paid run, A-45.15: PROJECTED cost first; --budget=<USD> REQUIRED; the record written to a FRESH per-run file
//                  under scripts/out/ (A-46.3: never /tmp, never over an existing file); STOP at the first credit, quota or auth error
//     step 1  the API's own count per branch (messages.count_tokens: tools + system + one message; an estimate, not billed as a message;
//             Anthropic's token-counting page, 27 September 2026), against the model's cache minimum
//     step 2  ONE first-contact pair: the same turn twice within seconds; prints cache_creation_input_tokens then cache_read_input_tokens
//             from the API's own usage, per iteration. A prefix under the minimum prints 0 and 0 both times: that is BELOW, the honest
//             record, not a failure.
//   --dry          the loop over a stub model (no key): proves the record, the budget stop and the credit stop
//
// Usage: node scripts/m135c_couple_cache_probe.js [--live --budget=0.25 | --dry] [--model=claude-haiku-4-5-20251001] [--min=4096]
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const argv = process.argv.slice(2);
const has = (k) => argv.includes(`--${k}`);
const arg = (k, d) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=').slice(1).join('=') : d; };
const MODE = has('live') ? 'live' : has('dry') ? 'dry' : 'bare';
const MODEL = arg('model', 'claude-haiku-4-5-20251001');
const MIN = Number(arg('min', '4096'));   // Claude Haiku 4.5's minimum cacheable prompt length, Anthropic's prompt-caching page, 27 September 2026
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

// ── PRICES (Anthropic's pricing page, 27 September 2026; Haiku 4.5): $1 in, $5 out, cache write 1.25x, cache read 0.1x per MTok ──
const PRICE = { in: 1.0, out: 5.0, write: 1.25, read: 0.1 };
const costOf = (u) => { if (!u) return 0; const n = (k) => Number(u[k] || 0); return (n('input_tokens') * PRICE.in + n('cache_creation_input_tokens') * PRICE.write + n('cache_read_input_tokens') * PRICE.read + n('output_tokens') * PRICE.out) / 1e6; };
const CREDIT = /credit balance|insufficient|billing|payment required|quota|402|exceeded your current|balance is too low|401|403|authentication|unauthori[sz]ed|invalid x-api-key|invalid api key|permission denied/i;

// ── the model seam: the real llmCreate under --live, a stub under --dry; both RECORD every request's usage ──────────────────────
const llmPath = require.resolve(P('src/lib/llm.js'));
const realLlm = require(llmPath);
const CALLS = [];
let dryBehaviour = arg('dry-behaviour', 'ok');
let CAPTURE = null;   // when set, the seam records the request and throws this sentinel instead of calling any model
class Captured extends Error {}
async function seam(provider, params) {
  if (CAPTURE) { CAPTURE.params = JSON.parse(JSON.stringify(params)); throw new Captured('captured'); }
  const sys = Array.isArray(params.system) ? params.system : [{ type: 'text', text: String(params.system) }];
  const rec = { provider, model: params.model, systemBlocks: sys.length, lastBlockCached: !!(sys[sys.length - 1] && sys[sys.length - 1].cache_control), systemChars: sys.reduce((a, b) => a + String(b.text || '').length, 0), tools: (params.tools || []).length, messages: params.messages.length };
  let resp;
  if (MODE === 'dry') {
    if (dryBehaviour === 'credit') throw new Error('400 invalid_request_error: Your credit balance is too low to access the Anthropic API');
    const second = CALLS.length >= 1;
    resp = { stop_reason: 'tool_use', usage: { input_tokens: 60, cache_creation_input_tokens: second ? 0 : 5000, cache_read_input_tokens: second ? 5000 : 0, output_tokens: 40 }, content: [{ type: 'tool_use', id: `t${CALLS.length}`, name: 'respond_to_couple', input: { message: 'ok' } }] };
  } else {
    resp = await realLlm.llmCreate(provider, params);
  }
  rec.usage = resp.usage; rec.cost = costOf(resp.usage);
  CALLS.push(rec);
  return resp;
}
require.cache[llmPath].exports = { ...realLlm, llmCreate: seam };
// the occupancy double (FACT 3's reader; a probe must not read the calendar): every date reads free
const occPath = require.resolve(P('src/lib/vendor/occupancy.js'));
const realOcc = require(occPath);
require.cache[occPath].exports = { ...realOcc, describeDate: async () => ({ verdict: 'free' }) };
// the intent extractor double (a returning client's notice would call the model again; not this probe's spend)
const intentPath = require.resolve(P('src/lib/intentExtractor.js'));
const realIntent = require(intentPath);
require.cache[intentPath].exports = { ...realIntent, getReturningBrideIntent: async () => null };

// ── the store double (b135's shape): no writes possible; the flag ON as production runs it (lane=eliza, the walk of 27 September) ──
function store({ lead = null } = {}) {
  return {
    from(table) {
      const q = { eqs: {} };
      const api = {
        select: () => api, eq: (c, v) => { q.eqs[c] = v; return api; }, gte: () => api, order: () => api, in: () => api, is: () => api, update: () => api,
        insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'probe-lead' } }) }), then: (r) => r({ error: null }) }),
        limit(n) { const p = api._limit(n); p.maybeSingle = () => api.maybeSingle(); return p; },
        async _limit() { return { data: [] }; },
        async maybeSingle() {
          if (table === 'leads') return { data: lead };
          if (table === 'vendors') return { data: { status: 'active', discover_paused: false, date_check_enabled: true } };
          if (table === 'admin_config') return { data: q.eqs.key === 'couple.eliza_enabled' ? { value: 'true' } : null };
          return { data: null };
        },
      };
      return api;
    },
  };
}
const DEV440 = { id: 'v-dev440', business_name: 'Dev Roy Photography', category: 'Photographer', city: 'Delhi', open_to_travel: true };
const DEVUSER = { name: 'Dev Roy', phone: '+910000000000' };
const MINE = ['src/agent/engine.js', 'src/agent/coupleSystemPrompt.js', 'src/agent/coupleThreadFacts.js', 'src/agent/studioName.js', 'src/lib/vendor/coupleDateState.js', 'src/lib/laneFlags.js'];
function engine() { for (const r of MINE) delete require.cache[require.resolve(P(r))]; return require(P('src/agent/engine.js')); }
function shell() { return require(P('src/agent/coupleSystemPrompt.js')); }

// ── the three branches, composed by the shell exactly as the turn composes them ────────────────────────────────────────────────
function branches() {
  const { buildCoupleSystemPrompt } = shell();
  return {
    'first contact': buildCoupleSystemPrompt({ vendor: DEV440, vendorUser: DEVUSER, isReturningBride: false, leadName: null, weddingShape: null, knownBrideName: null, useEliza: true, conversation: { inConversation: false } }),
    'in conversation': buildCoupleSystemPrompt({ vendor: DEV440, vendorUser: DEVUSER, isReturningBride: false, leadName: null, weddingShape: null, knownBrideName: null, useEliza: true, conversation: { inConversation: true, priorCount: 3, since: '24 September', lastAsked: 'Is your wedding one day or spread across functions?' } }),
    returning: buildCoupleSystemPrompt({ vendor: DEV440, vendorUser: DEVUSER, isReturningBride: true, leadName: 'Sarah', weddingShape: null, knownBrideName: 'Sarah', useEliza: true, conversation: { inConversation: true, priorCount: 3, since: '24 September', lastAsked: 'x' } }),
  };
}
const est = (chars) => Math.round(chars / 3.7);

async function main() {
  const B = branches();
  console.log(`m135c (${MODE}): the couple turn's prompt cache on ${MODEL}, minimum ${MIN} tokens (Anthropic's page, 27 September 2026)`);
  for (const [name, text] of Object.entries(B)) console.log(`  ${name.padEnd(16)} system ${String(text.length).padStart(6)} chars, about ${est(text.length)} tokens before tools (estimate; --live prints the API's count)`);
  const perTurn = (est(B['first contact'].length) + 600) * 3;   // up to three iterations of tools + system + messages
  const projected = (perTurn * 2 * PRICE.write + 6 * 80 * PRICE.out) / 1e6;
  console.log(`PROJECTED for --live: about $${projected.toFixed(3)} (a first-contact pair through the real turn, up to three iterations each, cache writes priced at 1.25x); the count step is not billed as a message`);
  if (MODE === 'bare') { console.log('not live, no model called; --live --budget=0.25 for the paid probe, --dry to drive the loop over a stub'); return 0; }
  const budget = Number(arg('budget', MODE === 'dry' ? '1' : 'NaN'));
  if (!Number.isFinite(budget) || budget <= 0) { console.log('REFUSED: --live needs --budget=<USD> (A-45.15). Nothing was called.'); return 2; }
  if (MODE === 'live' && !process.env.ANTHROPIC_API_KEY) { console.log('REFUSED: ANTHROPIC_API_KEY is not set. Nothing was called.'); return 2; }
  // A-46.3: a fresh per-run record under the repo root; never a path that already exists
  const dir = P('scripts/out'); fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  let file = path.join(dir, `m135c-${MODE}-${stamp}.jsonl`); let k = 0;
  while (fs.existsSync(file)) { k += 1; file = path.join(dir, `m135c-${MODE}-${stamp}-${k}.jsonl`); }
  fs.writeFileSync(file, `${JSON.stringify({ probe: 'm135c', mode: MODE, model: MODEL, min: MIN, at: new Date().toISOString() })}\n`, { flag: 'wx' });
  const record = (o) => fs.appendFileSync(file, `${JSON.stringify(o)}\n`);
  console.log(`record: ${file}; budget $${budget}`);

  // step 1 · the API's own count per branch. The tools are not exported by engine.js (b115: one exported name), so the probe CAPTURES
  // the turn's own request once (no model called: the seam records it and throws a sentinel) and counts that exact shape; the other
  // two branches are the shell's text inside the same envelope with the same tools.
  CAPTURE = {};
  try { const { runCoupleAgenticTurn } = engine(); await runCoupleAgenticTurn({ vendor: DEV440, vendorUser: DEVUSER, conversation: { id: 'probe-conv' }, couplePhone: '919999900001', coupleId: null, inboundMessage: 'Hi, are you available for a wedding in Delhi next winter?', supabase: store(), anthropic: null }); } catch (e) { if (!(e instanceof Captured)) throw e; }
  const captured = CAPTURE.params; CAPTURE = null;
  if (!captured) { console.log('the capture leg recorded no request; nothing counted'); return 1; }
  const tools = captured.tools;
  const capturedText = Array.isArray(captured.system) ? captured.system.map((b) => b.text).join('\n') : String(captured.system);
  console.log(`  captured the turn's own request: ${tools.length} tools, ${Array.isArray(captured.system) ? captured.system.length : 'string'} system block(s), last block cached=${!!(Array.isArray(captured.system) && captured.system[captured.system.length - 1].cache_control)}, system ${capturedText.length} chars`);
  const toCount = { 'first contact (the turn\'s own)': captured.system, 'in conversation': [{ type: 'text', text: B['in conversation'], cache_control: { type: 'ephemeral' } }], returning: [{ type: 'text', text: B.returning, cache_control: { type: 'ephemeral' } }] };
  if (MODE === 'live') {
    const { default: Anthropic } = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    for (const [name, system] of Object.entries(toCount)) {
      try {
        const c = await client.messages.countTokens({ model: MODEL, system, tools, messages: captured.messages });
        const n = c.input_tokens;
        console.log(`  COUNT ${name.padEnd(30)} ${String(n).padStart(6)} tokens (tools + system + the message)  ${n >= MIN ? 'AT OR ABOVE the minimum: cacheable' : 'BELOW the minimum: nothing cached on this model'}`);
        record({ step: 'count', branch: name, input_tokens: n, min: MIN, cacheable: n >= MIN });
      } catch (e) {
        const msg = String(e && e.message || e);
        record({ step: 'count', branch: name, error: msg });
        if (CREDIT.test(msg)) { console.log(`STOPPED at the count step on a credit, quota or auth error: ${msg.slice(0, 160)}`); return 3; }
        console.log(`  COUNT ${name.padEnd(30)} failed: ${msg.slice(0, 120)}`);
      }
    }
  } else {
    console.log('  (dry: the count step calls the API and is skipped; the pair below runs over the stub)');
  }

  // step 2 · ONE first-contact pair through the real turn, seconds apart
  let spent = 0;
  for (const leg of ['first', 'second']) {
    if (spent >= budget) { console.log(`STOPPED: the budget $${budget} is reached ($${spent.toFixed(4)} spent) before the ${leg} leg`); return 3; }
    const before = CALLS.length;
    const { runCoupleAgenticTurn } = engine();
    let err = null;
    try {
      await runCoupleAgenticTurn({ vendor: DEV440, vendorUser: DEVUSER, conversation: { id: 'probe-conv' }, couplePhone: '919999900001', coupleId: null, inboundMessage: 'Hi, are you available for a wedding in Delhi next winter?', supabase: store(), anthropic: null });
    } catch (e) { err = String(e && e.message || e); }
    const legCalls = CALLS.slice(before);
    for (let i = 0; i < legCalls.length; i += 1) {
      const c = legCalls[i]; const u = c.usage || {};
      spent += c.cost || 0;
      console.log(`  ${leg.padEnd(6)} iteration ${i + 1}: blocks=${c.systemBlocks} lastBlockCached=${c.lastBlockCached} in=${u.input_tokens} cache_creation=${u.cache_creation_input_tokens || 0} cache_read=${u.cache_read_input_tokens || 0} out=${u.output_tokens} cost=$${(c.cost || 0).toFixed(5)}`);
      record({ step: 'pair', leg, iteration: i + 1, ...c });
    }
    if (err) { record({ step: 'pair', leg, error: err }); if (CREDIT.test(err)) { console.log(`STOPPED on a credit, quota or auth error: ${err.slice(0, 160)}`); return 3; } console.log(`  ${leg} leg threw: ${err.slice(0, 160)}`); }
  }
  // the verdict: the pair's first call writes (or not), the second reads (or not)
  const firstLeg = CALLS.filter((c, i) => i < CALLS.length && c.usage).slice(0, 1)[0];
  const reads = CALLS.filter((c) => c.usage && Number(c.usage.cache_read_input_tokens || 0) > 0);
  const writes = CALLS.filter((c) => c.usage && Number(c.usage.cache_creation_input_tokens || 0) > 0);
  const verdict = writes.length && reads.length ? `CACHE PROVEN: ${writes.length} write(s), ${reads.length} read(s); the first read at call ${CALLS.indexOf(reads[0]) + 1}` : `BELOW or no hit: writes ${writes.length}, reads ${reads.length} (a prefix under ${MIN} tokens on this model caches nothing; the honest record)`;
  console.log(`m135c VERDICT: ${verdict}; ${CALLS.length} model calls; spent $${spent.toFixed(4)} by the API's own usage${firstLeg ? `; first call in=${firstLeg.usage.input_tokens} cache_creation=${firstLeg.usage.cache_creation_input_tokens || 0}` : ''}`);
  record({ step: 'verdict', verdict, calls: CALLS.length, spent });
  return 0;
}

main().then((c) => process.exit(c)).catch((e) => { console.log(`m135c CRASHED: ${e && e.stack}`); process.exit(1); });
