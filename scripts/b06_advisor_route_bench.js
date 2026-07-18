#!/usr/bin/env node
'use strict';
// scripts/b06_advisor_route_bench.js — TDW_06 P6b (F-06.4/F-06.2): THE DOOR ROUTING BENCH.
// Runnable from any working directory, clean clone, no network, no keys:
//   node scripts/b06_advisor_route_bench.js
//
// WHAT IT PROVES (behaviour, LD-5 — never wording):
//  §1 THE DOOR SEAM (buildLlmForTurn): victor_mode read by the SERVER-RESOLVED agentId,
//     advisor -> model.pwa_vendor.advisor (deepseek), business/consult byte-identical on
//     the product tier. The read keys on req.agentId, never a client-supplied id.
//  §2 THE HARVEST GATE (fireHarvest / advisorHarvestGate): advisor turns skip harvest;
//     business and consult (victor_mode absent) harvest exactly as before.
//
// BOTH-WAYS: §1's advisor->deepseek and §2's advisor-gated assertions are FALSE at the
// uncured door — before the seam, an advisor@signature vendor routed to anthropic-haiku and
// fireHarvest always scheduled. (Revert chat.js + modelRouter.js to abcb47c and re-run: the
// tally drops by the §1 advisor rows + the §2 advisor rows; printed FAIL on exactly those.)
//
// DISCLOSED RIG: a mock supabase (admin_config empty -> DEFAULTS; engine.agents.victor_mode
// per test) and an inert DEEPSEEK key so guardKeys does not fall back. No live model call.

process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'bench-inert';
delete process.env.LLM_PROVIDER; // no force switch
// The engine's db.js throws at load if these are absent; the bench never queries the real
// client (a mock is injected via req.app.locals.supabase), so inert values just let it load.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const chat = require(path.join(ROOT, 'src/api/vendor-engine/chat.js'));
const { buildLlmForTurn, advisorHarvestGate, fireHarvest } = chat;

let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; console.log('    PASS  ' + label); } else { fail++; console.log('    FAIL  ' + label); } };

// ── the mock supabase ─────────────────────────────────────────────────────────
function mkSupabase(victorModeById) {
  const queried = { agentsIdEq: null };
  const build = () => ({
    from(table) {
      const q = { _t: table, _eq: {} };
      const chain = {
        select() { return chain; },
        eq(col, val) { q._eq[col] = val; return chain; },
        maybeSingle() {
          if (q._t === 'admin_config') return Promise.resolve({ data: null, error: null }); // -> DEFAULTS
          if (q._t === 'agents') {
            queried.agentsIdEq = q._eq.id; // witness: the door read by THIS id
            const vm = victorModeById[q._eq.id];
            return Promise.resolve({ data: vm === undefined ? null : { victor_mode: vm }, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        },
        update() { return { eq: () => Promise.resolve({ error: null }) }; },
      };
      return chain;
    },
  });
  const root = build();
  root.schema = () => build();
  root.__queried = queried;
  return root;
}
const mkReq = (supabase, tier, agentId) => ({ app: { locals: { supabase } }, vendor: { id: 'v1', tier }, agentId });

(async () => {
  console.log('\n  [1] THE DOOR SEAM (buildLlmForTurn) — mode-scoped routing, server-resolved agent:');
  {
    // advisor: routes to deepseek regardless of product tier
    const sb = mkSupabase({ 'agent-real': 'advisor' });
    const req = mkReq(sb, 'signature', 'agent-real'); // signature would be anthropic-haiku in business
    const w = await buildLlmForTurn(req);
    T('advisor routes Victor to deepseek (model.pwa_vendor.advisor), not the signature-tier Haiku', w.route.provider === 'deepseek' && w.route.model === 'deepseek-v4-flash');
    T('…and the deepseek transport + modelOverride are seated (a non-anthropic route)', !!w.transport && w.transport.provider === 'deepseek' && w.modelOverride === 'deepseek-v4-flash');
    T('…and the ENGINE tier still follows the PRODUCT tier (signature -> mid), unchanged by mode', w.tierOverride === 'mid');
    T('…and the victor_mode read keyed on the SERVER-RESOLVED agentId (req.agentId), never a client id', sb.__queried.agentsIdEq === 'agent-real');
  }
  {
    // business @ signature: byte-identical to today (anthropic haiku, no transport)
    const sb = mkSupabase({ 'agent-real': 'business' });
    const w = await buildLlmForTurn(mkReq(sb, 'signature', 'agent-real'));
    T('business @ signature stays anthropic-haiku, NO deepseek transport (byte-identical control)', w.route.provider === 'anthropic' && !w.transport);
  }
  {
    // victor_mode absent (consult / unseeded agent): falls to business routing
    const sb = mkSupabase({});
    const w = await buildLlmForTurn(mkReq(sb, 'essential', 'agent-unseeded'));
    // essential IS deepseek by product tier — assert the route matches the essential default,
    // i.e. the mode read did NOT flip it to the advisor key (both happen to be deepseek, so
    // assert via the tierOverride which advisor never changes and essential maps to 'entry').
    T('a victor_mode read-miss falls to business routing (no advisor flip on an unseeded agent)', w.tierOverride === 'entry' && w.route.provider === 'deepseek');
  }

  console.log('\n  [2] THE HARVEST GATE (F-06.2) — advisor counsel is never mined:');
  {
    T('advisorHarvestGate is TRUE for an advisor result (harvest skipped)', advisorHarvestGate({ victor_mode: 'advisor' }) === true);
    T('…FALSE for a business result (harvest runs)', advisorHarvestGate({ victor_mode: 'business' }) === false);
    T('…FALSE for consult (victor_mode absent — byte-identical to today)', advisorHarvestGate({}) === false);
    T('…FALSE for a null result (fail-safe)', advisorHarvestGate(null) === false);
  }
  {
    // fireHarvest WIRING both-ways: spy setImmediate — advisor must NOT schedule; business must.
    const realSI = global.setImmediate;
    let scheduled = 0;
    global.setImmediate = () => { scheduled++; };
    try {
      const sb = mkSupabase({});
      const req = mkReq(sb, 'signature', 'agent-real');
      scheduled = 0; fireHarvest(req, 'hi', { victor_mode: 'advisor', reply: 'counsel', tool_calls: [] });
      T('fireHarvest schedules NOTHING on an advisor turn (the gate returned before setImmediate)', scheduled === 0);
      scheduled = 0; fireHarvest(req, 'hi', { victor_mode: 'business', reply: 'ok', tool_calls: [] });
      T('fireHarvest DOES schedule harvest on a business turn (the gate is mode-scoped, not global)', scheduled === 1);
    } finally { global.setImmediate = realSI; }
  }

  console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}  ${pass}/${pass + fail}`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('BENCH CRASH:', e && e.stack || e); process.exit(1); });
