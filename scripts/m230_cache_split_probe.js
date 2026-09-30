#!/usr/bin/env node
'use strict';
// scripts/m230_cache_split_probe.js · CE-46 ELZ-3 · F-44.230 · THE PROMPT CACHE SPLIT, PROVEN BY PROBE (the chair, 29 September 2026), with
// e-159's fix. ELZ-2's m135c (kept as its record) counted the returning branch on a fixture's shape WITH the user message, which sits after
// the breakpoint (e-159). This probe counts, per branch, BOTH numbers on the live shapes: the PREFIX (tools + the cached system block(s)
// + a one-token message: what the cache can hold) and the FULL request (tools + every system block + the real message).
// READ-ONLY on the estate (the store is a double and can write nothing). The MODEL is the real one under --live, through the REAL
// runCoupleAgenticTurn, so the request on the wire is the turn's own.
//
//   bare     no key, no call, exit 0 (A-46.1): the stable text's sameness across a thread's turns and across lanes, sizes by estimate,
//            and the PROJECTED cost of --live
//   --live   the paid run, A-45.15: cost first; --budget=<USD> REQUIRED; a FRESH record under scripts/out/ (A-46.3); STOP at the first
//            credit, quota or auth error
//     step 1  the API's own counts (messages.count_tokens; an estimate, not billed as a message): PREFIX and FULL per branch
//             (Instagram first contact, Instagram in conversation, the shared line in conversation, Sarah's returning shape, prior 100),
//             each against the model's minimum; and the COST PER TURN BEFORE (the whole system cached as one block, a write every turn:
//             the founder's walk of 29 Sept) and AFTER (turn 1 writes the stable block, every later turn reads it), priced from those counts
//     step 2  ONE three-turn Instagram thread through the real turn (a first message, then two in conversation): the API's own usage per
//             iteration. The proof the chair set: cache_read > 0 from the thread's SECOND turn.
//   --dry    the loop over a stub model (no key): proves the record, the budget stop and the credit stop
//
// Usage: node scripts/m230_cache_split_probe.js [--live --budget=0.10 | --dry] [--model=claude-haiku-4-5-20251001] [--min=4096]
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
function store({ lead = null, rows = [] } = {}) {
  return {
    from(table) {
      const q = { eqs: {} };
      const api = {
        select: () => api, eq: (c, v) => { q.eqs[c] = v; return api; }, gte: () => api, order: () => api, in: () => api, is: () => api, update: () => api,
        insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'probe-lead' } }) }), then: (r) => r({ error: null }) }),
        limit(n) { const p = api._limit(n); p.maybeSingle = () => api.maybeSingle(); return p; },
        async _limit() { return { data: table === 'messages' ? rows.map((r) => ({ ...r })) : [] }; }, // a fresh array per read (the history read reverses its copy)
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


const THREAD = ['Hi, are you free on 25 March 2027 for my wedding?', 'Single day', 'Both'];
const IGSID = 'probe-igsid-230';
const IG = { channel: 'instagram', phone: null, igsid: IGSID, enquireLink: 'https://wa.me/910000000000' };
const SHARED = { channel: 'whatsapp_shared', phone: '919999900001' };
const est = (chars) => Math.round(chars / 3.7);
const shell = () => { delete require.cache[require.resolve(P('src/agent/coupleSystemPrompt.js'))]; return require(P('src/agent/coupleSystemPrompt.js')); };
const blocksOf = (b) => (b.thread ? [{ type: 'text', text: b.stable, cache_control: { type: 'ephemeral' } }, { type: 'text', text: b.thread }] : [{ type: 'text', text: b.stable, cache_control: { type: 'ephemeral' } }]);
const oneBlock = (b) => [{ type: 'text', text: b.thread ? `${b.stable}\n\n${b.thread}` : b.stable, cache_control: { type: 'ephemeral' } }];
function shapes() {
  const { buildCoupleSystemBlocks } = shell();
  const base = { vendor: DEV440, vendorUser: DEVUSER, weddingShape: null, useEliza: true };
  return {
    'instagram first contact': buildCoupleSystemBlocks({ ...base, isReturningBride: false, leadName: null, knownBrideName: null, channel: 'instagram', enquireLink: IG.enquireLink, conversation: { inConversation: false, priorCount: 0 } }),
    'instagram in conversation': buildCoupleSystemBlocks({ ...base, isReturningBride: false, leadName: null, knownBrideName: null, channel: 'instagram', enquireLink: IG.enquireLink, conversation: { inConversation: true, priorCount: 4, since: '29 Sep', lastAsked: 'Is it one day, or spread across functions like mehendi, sangeet and reception?', shapeAsked: true, shapeAskedOn: '29 Sep' } }),
    'shared line in conversation': buildCoupleSystemBlocks({ ...base, isReturningBride: false, leadName: null, knownBrideName: null, channel: 'whatsapp_shared', conversation: { inConversation: true, priorCount: 2, since: '29 Sep', lastAsked: 'When is it?' } }),
    // e-159: Sarah's live thread (the founder's W2 of 27 Sept): a named lead, prior 100, no planning-app name block
    'returning (Sarah, prior 100)': buildCoupleSystemBlocks({ ...base, isReturningBride: true, leadName: 'Sarah', knownBrideName: null, channel: 'whatsapp_shared', conversation: { inConversation: true, priorCount: 100, since: '12 Sep', lastAsked: 'Anything specific you wanted to know?' } }),
  };
}

async function main() {
  const S = shapes();
  console.log(`m230 (${MODE}): the couple turn's prompt cache split on ${MODEL}, minimum ${MIN} tokens (Anthropic's page)`);
  const ig1 = S['instagram first contact']; const ig2 = S['instagram in conversation'];
  const same = ig1.stable === ig2.stable && ig1.stable === shell().buildCoupleSystemBlocks({ vendor: DEV440, vendorUser: DEVUSER, useEliza: true, channel: 'instagram', enquireLink: IG.enquireLink, conversation: { inConversation: true, priorCount: 40, lastAsked: 'x' }, knownBrideName: 'Riya' }).stable;
  console.log(`  the stable text is ONE text across a thread's turns and facts (Instagram): ${same ? 'yes' : 'NO'}`);
  for (const [name, b] of Object.entries(S)) console.log(`  ${name.padEnd(30)} stable ${String(b.stable.length).padStart(6)} chars (about ${est(b.stable.length)} tokens before tools), thread ${String(b.thread.length).padStart(5)} chars`);
  const perTurn = (est(ig1.stable.length + ig1.thread.length) + 1200) * 2;
  const projected = (perTurn * 3 * PRICE.write + 9 * 120 * PRICE.out) / 1e6;
  console.log(`PROJECTED for --live: about $${projected.toFixed(3)} at most (a three-turn thread, up to two iterations a turn, every prefix priced as a cache WRITE, the worst case); the count step is not billed as a message`);
  if (!same) { console.log('m230: the stable text differs across turns: the split is broken; nothing to probe'); return 1; }
  if (MODE === 'bare') { console.log('not live, no model called; --live --budget=0.10 for the paid probe, --dry to drive the loop over a stub'); return 0; }
  const budget = Number(arg('budget', MODE === 'dry' ? '1' : 'NaN'));
  if (!Number.isFinite(budget) || budget <= 0) { console.log('REFUSED: --live needs --budget=<USD> (A-45.15). Nothing was called.'); return 2; }
  if (MODE === 'live' && !process.env.ANTHROPIC_API_KEY) { console.log('REFUSED: ANTHROPIC_API_KEY is not set. Nothing was called.'); return 2; }
  const dir = P('scripts/out'); fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  let file = path.join(dir, `m230-${MODE}-${stamp}.jsonl`); let k = 0;
  while (fs.existsSync(file)) { k += 1; file = path.join(dir, `m230-${MODE}-${stamp}-${k}.jsonl`); }
  fs.writeFileSync(file, `${JSON.stringify({ probe: 'm230', mode: MODE, model: MODEL, min: MIN, at: new Date().toISOString() })}\n`, { flag: 'wx' });
  const record = (o) => fs.appendFileSync(file, `${JSON.stringify(o)}\n`);
  console.log(`record: ${file}; budget $${budget}`);

  // step 1 · the tools are captured from the turn's own request (engine.js exports one name, b115), then counted in each shape
  CAPTURE = {};
  try { const { runCoupleAgenticTurn } = engine(); await runCoupleAgenticTurn({ vendor: DEV440, vendorUser: DEVUSER, conversation: { id: 'probe-conv' }, couplePhone: null, coupleId: null, inboundMessage: THREAD[0], supabase: store({ rows: [{ direction: 'inbound', body: THREAD[0], sent_by: 'couple', created_at: new Date().toISOString() }] }), anthropic: null, counterparty: IG }); } catch (e) { if (!(e instanceof Captured)) throw e; }
  const captured = CAPTURE.params; CAPTURE = null;
  if (!captured) { console.log('the capture leg recorded no request; nothing counted'); return 1; }
  const tools = captured.tools;
  console.log(`  captured the turn's own request: ${tools.length} tools, ${captured.system.length} system block(s), cached on block ${captured.system.findIndex((b) => b.cache_control) + 1}`);
  const COUNTS = {};
  if (MODE === 'live') {
    const { default: Anthropic } = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const count = async (system, messages) => (await client.messages.countTokens({ model: MODEL, system, tools, messages })).input_tokens;
    const ONE = [{ role: 'user', content: '.' }];
    for (const [name, b] of Object.entries(S)) {
      try {
        const prefix = await count([{ type: 'text', text: b.stable }], ONE);           // what the breakpoint can hold (+ one token)
        const full = await count(blocksOf(b), [{ role: 'user', content: THREAD[0] }]); // the whole request
        const whole = await count(oneBlock(b), ONE);                                    // BEFORE: the whole system as the cached prefix
        COUNTS[name] = { prefix, full, whole };
        console.log(`  COUNT ${name.padEnd(30)} PREFIX ${String(prefix).padStart(6)} (${prefix >= MIN ? 'cacheable' : 'BELOW the minimum'})  FULL ${String(full).padStart(6)}  BEFORE-prefix ${String(whole).padStart(6)}`);
        record({ step: 'count', branch: name, prefix, full, whole, min: MIN, cacheable: prefix >= MIN });
      } catch (e) {
        const msg = String(e && e.message || e);
        record({ step: 'count', branch: name, error: msg });
        if (CREDIT.test(msg)) { console.log(`STOPPED at the count step on a credit, quota or auth error: ${msg.slice(0, 160)}`); return 3; }
        console.log(`  COUNT ${name.padEnd(30)} failed: ${msg.slice(0, 120)}`);
      }
    }
    // cost per turn, input side only, from the counts (Haiku 4.5: $1/MTok in, 1.25x write, 0.1x read); a turn's first iteration
    for (const [name, c] of Object.entries(COUNTS)) {
      const thread = Math.max(0, c.full - c.prefix);
      const before = c.whole >= MIN ? c.whole * PRICE.write : c.whole * PRICE.in;              // before: a write every turn (never read)
      const after1 = c.prefix >= MIN ? c.prefix * PRICE.write + thread * PRICE.in : (c.prefix + thread) * PRICE.in;
      const afterN = c.prefix >= MIN ? c.prefix * PRICE.read + thread * PRICE.in : (c.prefix + thread) * PRICE.in;
      console.log(`  COST ${name.padEnd(30)} per turn BEFORE $${(before / 1e6).toFixed(5)}  AFTER turn 1 $${(after1 / 1e6).toFixed(5)}, later turns $${(afterN / 1e6).toFixed(5)}`);
      record({ step: 'cost', branch: name, before: before / 1e6, after_first: after1 / 1e6, after_later: afterN / 1e6 });
    }
  } else {
    console.log('  (dry: the count step calls the API and is skipped; the thread below runs over the stub)');
  }

  // step 2 · one three-turn Instagram thread through the real turn; the rows grow with each turn as the store would hold them
  let spent = 0; const rows = [];
  const at = (s) => new Date(Date.now() - s * 1000).toISOString();
  for (let t = 0; t < THREAD.length; t += 1) {
    if (spent >= budget) { console.log(`STOPPED: the budget $${budget} is reached ($${spent.toFixed(4)} spent) before turn ${t + 1}`); return 3; }
    rows.unshift({ direction: 'inbound', body: THREAD[t], sent_by: 'couple', created_at: at(0) });
    const before = CALLS.length; let err = null; let out = null;
    try { const { runCoupleAgenticTurn } = engine(); out = await runCoupleAgenticTurn({ vendor: DEV440, vendorUser: DEVUSER, conversation: { id: 'probe-conv' }, couplePhone: null, coupleId: null, inboundMessage: THREAD[t], supabase: store({ rows }), anthropic: null, counterparty: IG }); }
    catch (e) { err = String(e && e.message || e); }
    const turnCalls = CALLS.slice(before);
    for (let i = 0; i < turnCalls.length; i += 1) {
      const c = turnCalls[i]; const u = c.usage || {};
      spent += c.cost || 0;
      console.log(`  turn ${t + 1} iteration ${i + 1}: blocks=${c.systemBlocks} in=${u.input_tokens} cache_creation=${u.cache_creation_input_tokens || 0} cache_read=${u.cache_read_input_tokens || 0} out=${u.output_tokens} $${(c.cost || 0).toFixed(5)}`);
      record({ step: 'thread', turn: t + 1, iteration: i + 1, ...c });
    }
    if (err) { record({ step: 'thread', turn: t + 1, error: err }); if (CREDIT.test(err)) { console.log(`STOPPED on a credit, quota or auth error: ${err.slice(0, 160)}`); return 3; } console.log(`  turn ${t + 1} threw: ${err.slice(0, 160)}`); }
    rows.unshift({ direction: 'outbound', body: (out && out.reply) || 'ok', sent_by: 'agent', created_at: at(0) });
  }
  const readsFromTurn2 = CALLS.slice(1).filter((c) => Number((c.usage || {}).cache_read_input_tokens || 0) > 0).length;
  const verdict = readsFromTurn2 > 0 ? `SPLIT PROVEN: cache_read > 0 on ${readsFromTurn2} call(s) after the thread's first` : 'NO READ after the first call (below the minimum, or the stable text moved)';
  console.log(`m230 VERDICT: ${verdict}; ${CALLS.length} model calls; spent $${spent.toFixed(4)} by the API's own usage`);
  record({ step: 'verdict', verdict, calls: CALLS.length, spent });
  return 0;
}

main().then((c) => process.exit(c)).catch((e) => { console.log(`m230 CRASHED: ${e && e.stack}`); process.exit(1); });
