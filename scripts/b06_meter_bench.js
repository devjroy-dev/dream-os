#!/usr/bin/env node
// scripts/b06_meter_bench.js — TDW_06 ECONOMICS SITTING, charter item 1: THE
// METER FIX. Runnable from any working directory, clean clone, no npm install
// (Q-SP-5's law):   node scripts/b06_meter_bench.js
//
// THE CONVICTION THIS BENCH REVERSES (convicted twice on the estate's own
// record): harvest routed config-live through the facade (GLM then, DeepSeek
// now per LD-7/F11) and engine.usage recorded NOTHING — resp.usage discarded,
// zero rows, the meter blind exactly where the cheap providers live. No cost
// decision ships on a blind meter.
//
// WHAT THIS BENCH DRIVES, disclosed:
//  §1 THE HARVEST METER — the REAL runHarvest (src/agent/harvest.js), its db and
//     transports doubled at harvest's own require seams (the b6 rig convention:
//     doubles answer ONLY the module under test; models.js/phoneKey/draftContracts/
//     recordCompleteness load REAL — they are pure):
//       A routed DeepSeek call writes ONE engine.usage row — model = the RAW
//         routed string, conversation_id NULL, tokens verbatim from resp.usage,
//         cost_inr from the ONE meter home (calcCostInr).
//       B the rule-6 retry leg (routed junk -> forceHaiku) writes TWO rows,
//         each under its own model — per-CALL attribution, never a blur.
//       C an anthropic-routed run is metered identically (every provider in
//         llm.js's CONF, the charter's own words).
//       D a meter failure NEVER costs the vendor his patches (best-effort law).
//       E the pre-DDL degrade: a cache-columns error re-inserts the bare row
//         (loop.ts's own column-guard convention, applied at the new writer).
//  §2 THE COUNT GUARD — chat.js's two turn-count cap queries filter
//     conversation_id IS NOT NULL (harvest rows are SPEND, never TURNS; CE-6's
//     meter preserved), and loop.ts's turn row still carries its conversation
//     (so the filter is count-neutral on every chat turn).
//  §3 THE ONE-LINE REMOVAL — the dormant prestige escalation_model entry is
//     GONE from DEFAULTS (founder-ruled NO Sonnet), and no other route moved:
//     the whole DEFAULTS map asserted key-for-key.
//  §4 THE CEILING LAW — calcCostInr prices unknown models at HAIKU rates
//     (deliberate-conservative; never invent a price — UNIT_ECONOMICS' own
//     law, asserted as LAW so a silent pricing invention fails here).
//
// Regression-proofed both ways: at uncured origin (pre-sitting harvest.js /
// modelRouter.js / chat.js) this bench FAILS on exactly the cures — zero usage
// rows captured (§1 A/B/C/E), the unguarded count queries (§2), the standing
// escalation_model entry (§3) — while the floors (§1 D patches-applied, §4's
// law, loop.ts's turn row) stay green. An uncured tree reads as FAILS, never a
// crash.
//
// Ruling trail: the sitting charter item 1 (diagnose where usage rows are
// written; extend to every provider in llm.js's CONF; backfill nothing) ·
// Q-R-3's aesthetic (mechanical signals, benched) · CE-6 (caps count on usage
// rows) · the UNIT_ECONOMICS pricing note (never invent a price).
'use strict';

const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

delete process.env.LLM_PROVIDER; // the force switch must not shadow the routed fixture

let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; console.log('  PASS  ' + label); } else { fail++; console.log('  FAIL  ' + label); } };
const sec = (t) => console.log('\n── ' + t + ' ──');

const HAIKU = 'claude-haiku-4-5-20251001';
const AGENT = '44444444-4444-4444-8444-444444444444';
const VENDOR = { id: '55555555-5555-4555-8555-555555555555' };
const LEAD_ID = '66666666-6666-4666-8666-666666666666';

// ── the doubles, injected at harvest's own require seams ─────────────────────
const inj = (rel, exportsObj) => {
  const p = path.join(ROOT, rel);
  require.cache[p] = { id: p, filename: p, loaded: true, exports: exportsObj };
};

// The SDK class double (harvest's module-level `new Anthropic(...)` + the
// forceHaiku direct leg). Scripted per scenario through this mutable holder.
const sdk = { nextCreate: async () => { throw new Error('sdk.create unscripted'); } };
const Module = require('module');
const _load = Module._load;
Module._load = function (req) {
  if (req === '@anthropic-ai/sdk') {
    function Anthropic() { this.messages = { create: (...a) => sdk.nextCreate(...a) }; }
    Anthropic.default = Anthropic;
    return Anthropic;
  }
  return _load.apply(this, arguments);
};

// The llm facade double: llmCreate scripted; CONF + providerKeyPresent real
// enough for the REAL modelRouter to route (the router is under test in §3).
const llm = { nextCreate: async () => { throw new Error('llmCreate unscripted'); } };
inj('src/lib/llm.js', {
  CONF: { anthropic: {}, deepseek: {}, glm: {} },
  providerKeyPresent: () => true,
  llmCreate: (...a) => llm.nextCreate(...a),
  llmStream: () => { throw new Error('llmStream not used by harvest'); },
});

// Capture sinks.
const captured = { usage: [], usageBare: [], leadPatches: [], activity: [] };
inj('src/lib/vendor/leads.js', { updateLead: async (pub, vendorId, id, patch) => { captured.leadPatches.push({ id, patch }); return { ok: true }; } });
inj('src/lib/vendor/snapshot.js', { logActivity: async (...a) => { captured.activity.push(a); }, fetchRecentActivity: async () => [], formatActivityBlock: () => '' });
inj('src/lib/executeAndPatch.js', { executeAndPatch: async () => ({ ok: true }) });
inj('src/engine/dist/core/donna.js', { patchNote: async () => {} });
inj('src/engine/dist/core/recordsView.js', { loadRecords: async () => [] });
// models.js + phoneKey.js load REAL (pure — the ONE cost home must be the real one).

// ── the supabase double (thenable proxy chain; scripted per table) ───────────
const state = {
  harvestRoute: JSON.stringify({ provider: 'deepseek', model: 'deepseek-v4-flash' }),
  usageInsert: 'ok', // 'ok' | 'throw' | 'cache-columns-once'
};
function mkDb() {
  const answer = (q) => {
    const t = q._t, op = q._op, mode = q._mode, schema = q._schema;
    if (op === 'insert' && t === 'usage' && schema === 'engine') {
      if (state.usageInsert === 'throw') return { data: null, error: { message: 'relation vanished (bench-scripted failure)' } };
      if (state.usageInsert === 'cache-columns-once' && !q._body.__seen) {
        // first attempt errors on the cache columns; harvest must re-insert bare
        if ('cache_read_tokens' in q._body) return { data: null, error: { message: 'column "cache_read_tokens" of relation "usage" does not exist' } };
        captured.usageBare.push(q._body);
        return { data: null, error: null };
      }
      captured.usage.push(q._body);
      return { data: null, error: null };
    }
    if (op === 'select') {
      if (t === 'leads') return { data: [{ id: LEAD_ID, name: 'Meter Fixture', phone: null, wedding_date: null, wedding_city: null, budget_max: null, state: 'new', draft_meta: { missing: ['wedding_date'] } }], error: null };
      if (t === 'admin_config') return { data: mode ? { value: state.harvestRoute } : [{ key: 'model.harvest.default', value: state.harvestRoute }], error: null };
      return { data: mode ? null : [], error: null };
    }
    return { data: null, error: null };
  };
  const mkq = (t, schema) => {
    const q = { _t: t, _op: 'select', _mode: null, _schema: schema };
    const self = new Proxy(q, { get(target, prop) {
      if (prop === 'then') { const r = answer(target); return (res) => res(r); }
      if (prop === 'insert' || prop === 'update' || prop === 'upsert') return (body) => { target._op = String(prop); target._body = body; return self; };
      if (prop === 'maybeSingle' || prop === 'single') return () => { target._mode = String(prop); return Promise.resolve(answer(target)); };
      if (prop in target) return target[prop];
      return () => self;
    } });
    return self;
  };
  const scoped = (schema) => ({ from: (t) => mkq(t, schema), schema: (s2) => scoped(s2) });
  return scoped('public');
}

// A fresh harvest per scenario: modelRouter's 60s route cache and harvest's
// module state are both module-private — re-require, doubles persist in cache.
function loadHarvest() {
  delete require.cache[path.join(ROOT, 'src/agent/harvest.js')];
  delete require.cache[path.join(ROOT, 'src/lib/modelRouter.js')];
  return require(path.join(ROOT, 'src/agent/harvest.js'));
}

const textResp = (json, usage) => ({ content: [{ type: 'text', text: json }], usage });
const GOOD_JSON = JSON.stringify({ patches: [{ plane: 'typed', table: 'leads', id: LEAD_ID, field: 'wedding_date', value: '2027-02-14' }] });

(async () => {
  const MODELS_DIST = path.join(ROOT, 'src/engine/dist/core/models.js');
  const distPresent = fs.existsSync(MODELS_DIST);

  sec('§1 — THE HARVEST METER: the blind lane writes rows, every provider.');
  if (!distPresent) {
    console.log('  … dist absent (clean clone) — harvest.js itself requires engine dist, so §1\'s');
    console.log('    behavioural assertions and §4\'s cost-law assertions SKIP, stated (the b6_door');
    console.log('    precedent); the engine gates (tsc + build + smoke) carry behaviour. §2/§3 run.');
    console.log('    THE FIX, one line: npm run build && node scripts/b06_meter_bench.js');
  }
  const calcCostInr = distPresent ? require(MODELS_DIST).calcCostInr : null;
  if (distPresent) {

  // A — the routed DeepSeek call (the conviction\'s own shape) writes ONE row.
  {
    captured.usage.length = 0; state.usageInsert = 'ok';
    llm.nextCreate = async (provider, params) => {
      T('A0 the routed call went through the facade as deepseek', provider === 'deepseek' && params.model === 'deepseek-v4-flash');
      return textResp(GOOD_JSON, { input_tokens: 2311, output_tokens: 57 });
    };
    const { runHarvest } = loadHarvest();
    await runHarvest({ supabase: mkDb(), vendor: VENDOR, agentId: AGENT, message: 'Meter Fixture called — her wedding is 14 Feb 2027.', toolCalls: [], replyText: 'Noted.' });
    const r = captured.usage[0];
    T('A1 exactly ONE engine.usage row for one routed call', captured.usage.length === 1);
    T('A2 model = the RAW routed string (the provider fingerprint)', !!r && r.model === 'deepseek-v4-flash');
    T('A3 conversation_id NULL — harvest is spend, never a turn', !!r && r.conversation_id === null);
    T('A4 tokens verbatim from resp.usage (2311/57)', !!r && r.input_tokens === 2311 && r.output_tokens === 57);
    T('A5 agent-attributed (spend caps see it)', !!r && r.agent_id === AGENT);
    T('A6 cost from the ONE meter home', !!r && r.cost_inr === calcCostInr('deepseek-v4-flash', 2311, 57, 0, 0) && r.cost_inr > 0);
    T('A7 …and the patch still applied (the meter never eats the work)', captured.leadPatches.length === 1 && captured.leadPatches[0].patch.wedding_date === '2027-02-14');
  }

  // B — the rule-6 retry leg: two calls, two rows, each under its own model.
  {
    captured.usage.length = 0; captured.leadPatches.length = 0;
    llm.nextCreate = async () => textResp('NOT JSON AT ALL', { input_tokens: 1900, output_tokens: 20 });
    sdk.nextCreate = async (params) => { T('B0 the retry leg runs Haiku DIRECT (rule 6\'s floor)', params.model === HAIKU); return textResp(GOOD_JSON, { input_tokens: 2000, output_tokens: 44 }); };
    const { runHarvest } = loadHarvest();
    await runHarvest({ supabase: mkDb(), vendor: VENDOR, agentId: AGENT, message: 'Meter Fixture called — her wedding is 14 Feb 2027.', toolCalls: [], replyText: 'Noted.' });
    T('B1 TWO rows — the routed call AND the retry, per-call attribution', captured.usage.length === 2);
    T('B2 first row under the routed model with ITS tokens', captured.usage[0] && captured.usage[0].model === 'deepseek-v4-flash' && captured.usage[0].input_tokens === 1900);
    T('B3 second row under HAIKU with ITS tokens', captured.usage[1] && captured.usage[1].model === HAIKU && captured.usage[1].input_tokens === 2000);
  }

  // C — an anthropic route is metered identically (every provider in CONF).
  {
    captured.usage.length = 0;
    state.harvestRoute = JSON.stringify({ provider: 'anthropic', model: HAIKU });
    sdk.nextCreate = async (params) => { T('C0 anthropic route runs the direct SDK leg', params.model === HAIKU); return textResp(GOOD_JSON, { input_tokens: 2100, output_tokens: 39, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }); };
    const { runHarvest } = loadHarvest();
    await runHarvest({ supabase: mkDb(), vendor: VENDOR, agentId: AGENT, message: 'Meter Fixture called — her wedding is 14 Feb 2027.', toolCalls: [], replyText: 'Noted.' });
    T('C1 the anthropic call wrote its row too', captured.usage.length === 1 && captured.usage[0].model === HAIKU && captured.usage[0].input_tokens === 2100);
    state.harvestRoute = JSON.stringify({ provider: 'deepseek', model: 'deepseek-v4-flash' });
  }

  // D — the best-effort law: a meter failure never costs the vendor his patches.
  {
    captured.usage.length = 0; captured.leadPatches.length = 0; state.usageInsert = 'throw';
    llm.nextCreate = async () => textResp(GOOD_JSON, { input_tokens: 2311, output_tokens: 57 });
    const { runHarvest } = loadHarvest();
    let threw = false;
    try { await runHarvest({ supabase: mkDb(), vendor: VENDOR, agentId: AGENT, message: 'Meter Fixture called — her wedding is 14 Feb 2027.', toolCalls: [], replyText: 'Noted.' }); } catch (_e) { threw = true; }
    T('D1 a failed ledger write never throws out of harvest', threw === false);
    T('D2 …and the patch still landed (rule 6\'s posture governs)', captured.leadPatches.length === 1);
    state.usageInsert = 'ok';
  }

  // E — the pre-DDL degrade: cache-columns error -> bare re-insert, row NEVER lost.
  {
    captured.usage.length = 0; captured.usageBare.length = 0; state.usageInsert = 'cache-columns-once';
    llm.nextCreate = async () => textResp(GOOD_JSON, { input_tokens: 2311, output_tokens: 57 });
    const { runHarvest } = loadHarvest();
    await runHarvest({ supabase: mkDb(), vendor: VENDOR, agentId: AGENT, message: 'Meter Fixture called — her wedding is 14 Feb 2027.', toolCalls: [], replyText: 'Noted.' });
    const bare = captured.usageBare[0];
    T('E1 the bare row landed after the cache-columns error (never loses the ledger row)', captured.usageBare.length === 1);
    T('E2 …without the bucket keys, with its cost intact', !!bare && !('cache_read_tokens' in bare) && !('cache_write_tokens' in bare) && bare.cost_inr > 0);
    state.usageInsert = 'ok';
  }
  } // distPresent — §1 whole

  sec('§2 — THE COUNT GUARD: harvest rows are spend, never turns (CE-6 preserved).');
  {
    const chat = fs.readFileSync(path.join(ROOT, 'src/api/vendor-engine/chat.js'), 'utf8');
    const guarded = chat.match(/from\('usage'\)[^\n]*\.not\('conversation_id', 'is', null\)[^\n]*gte\('created_at'/g) || [];
    T('§2.1 BOTH turn-count cap queries carry the conversation_id filter', guarded.length === 2);
    const loop = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/loop.ts'), 'utf8');
    T('§2.2 loop.ts\'s turn row still carries its conversation (the filter is count-neutral on chat turns)', /const usageRow[\s\S]{0,200}conversation_id: conversationId,/.test(loop));
    const spend = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/server.ts'), 'utf8');
    T('§2.3 the SPEND cap read stays UNFILTERED — harvest cost is real money and counts', /from\('usage'\)\s*\n?\s*\.select\('cost_inr'\)\s*\n?\s*\.eq\('agent_id'/.test(spend.replace(/\s+/g, ' ')) || /from\('usage'\)[\s\S]{0,80}select\('cost_inr'\)[\s\S]{0,80}eq\('agent_id'/.test(spend));
  }

  sec('§3 — THE ONE-LINE REMOVAL: the dormant prestige escalation_model entry (founder-ruled NO Sonnet).');
  {
    delete require.cache[path.join(ROOT, 'src/lib/modelRouter.js')];
    const { DEFAULTS } = require(path.join(ROOT, 'src/lib/modelRouter.js'));
    T('§3.1 prestige carries NO escalation_model', DEFAULTS['model.pwa_vendor.prestige'] && DEFAULTS['model.pwa_vendor.prestige'].escalation_model === undefined);
    const expected = {
      'model.pwa_vendor.trial':     { provider: 'anthropic', model: HAIKU },
      'model.pwa_vendor.essential': { provider: 'deepseek',  model: 'deepseek-v4-flash' },
      'model.pwa_vendor.signature': { provider: 'anthropic', model: HAIKU },
      'model.pwa_vendor.prestige':  { provider: 'anthropic', model: HAIKU },
      'model.harvest.default':      { provider: 'glm',       model: 'glm-4.7-flash' },
    };
    T('§3.2 no OTHER route moved — the whole DEFAULTS map, key-for-key', JSON.stringify(DEFAULTS) === JSON.stringify(expected));
    const src = fs.readFileSync(path.join(ROOT, 'src/lib/modelRouter.js'), 'utf8');
    T('§3.3 the word escalation_model survives ONLY in prose (header/comment), never as a route field', !/escalation_model:\s/.test(src));
  }

  sec('§4 — THE PRICE LAW: founder-supplied rates are honest; everything else stays at the HAIKU ceiling.');
  // ── LABELED AMENDMENT (TDW_06 economics sitting, ZIP E7; the R-B6-15 convention):
  // §4.1 originally asserted deepseek === the Haiku ceiling — THE LAW'S OWN CONDITION
  // CHANGED when the founder pasted DeepSeek's real per-M page (screenshots on the
  // record 2026-07-18): never-invent-a-price now has a supplied price for exactly one
  // model, so §4.1 flips to assert the HONEST rate and §4.4 is added to hold the
  // ceiling for unknowns. glm (§4.2) stays at the ceiling — no founder number arrived.
  if (!distPresent) {
    console.log('  … skipped with §1 (dist absent) — calcCostInr IS the dist; the law is asserted');
    console.log('    only against the real meter, never a re-implementation.');
  } else {
    const { calcCostInr: c } = require(MODELS_DIST);
    T('§4.1 deepseek-v4-flash prices at the FOUNDER-SUPPLIED rate ($0.14/M in -> ₹14 per M), no longer the ceiling', Math.abs(c('deepseek-v4-flash', 1000000, 0, 0, 0) - 14) < 1e-9 && c('deepseek-v4-flash', 1000000, 0, 0, 0) !== c(HAIKU, 1000000, 0, 0, 0));
    T('§4.1b …and its AUTO-CACHE hit rate is the real $0.0028/M (₹0.28 per M read — the founder\'s ledger showed live hits)', Math.abs(c('deepseek-v4-flash', 0, 0, 1000000, 0) - 0.28) < 1e-9);
    T('§4.2 glm-4.7-flash stays at the Haiku ceiling (no founder number — the law standing)', c('glm-4.7-flash', 1000000, 1000, 0, 0) === c(HAIKU, 1000000, 1000, 0, 0));
    T('§4.3 anthropic cache buckets price at read 0.1x / write 1.25x — BYTE-IDENTICAL to pre-price-line math', Math.abs(c(HAIKU, 0, 0, 1000000, 0) - 10) < 1e-9 && Math.abs(c(HAIKU, 0, 0, 0, 1000000) - 125) < 1e-9);
    T('§4.4 unknown models still price at the Haiku ceiling (never invent a price, unchanged)', c('never-seen-model-x', 1000000, 500, 0, 0) === c(HAIKU, 1000000, 500, 0, 0));
  }

  console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}  ${pass}/${pass + fail}`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('BENCH CRASH:', e && e.stack || e); process.exit(1); });
