#!/usr/bin/env node
'use strict';
// scripts/b06_wa_words_bench.js — TDW_06 P7b: THE WA MODE-WORDS + CONFIG-WIRE BENCH.
// Runnable from any working directory, clean clone, no network, no keys:
//   node scripts/b06_wa_words_bench.js
//
// WHAT IT PROVES (behaviour, LD-5 — never wording), driving the REAL exported helpers:
//   §1 THE MATCHER (matchModeWord): exact WHOLE-MESSAGE "advisor mode"/"business mode",
//      trimmed + case-insensitive; a message that merely CONTAINS the words is NOT a flip
//      (it falls through to a real Victor turn). The negative cases are the both-ways guard —
//      an over-eager contains() would convict here.
//   §2 THE FLIP (applyModeFlip, + the REAL abandonActiveThread): a real change writes
//      victor_mode AND chains the fresh thread (F-06.8) so the flipped room opens clean; a
//      NO-OP flip (texting your current mode) writes NOTHING and abandons NOTHING — the guard
//      the absolute WA word needs and the always-flips chip does not.
//   §3 THE CONFIG WIRE (buildLlmForTurn, plain-args — F-06.1 second limb): the WA door
//      resolves the SAME route the PWA door does. advisor@signature -> deepseek (+transport
//      +modelOverride); business@signature -> anthropic-haiku, NO transport (byte-identical).
//      Both surfaces route IDENTICALLY because they call this one function with the same ctx.
//
// BOTH-WAYS / UNCURED TREE: before P7b the WA lane (index.js) had NO matcher and passed NO
// overrides into runTurn — every WA turn ran the engine's native-anthropic hard path, so
// §3's "advisor@signature -> deepseek" was FALSE on WhatsApp (it was anthropic-haiku), and
// §1/§2 did not exist. And buildLlmForTurn took an Express req, so a plain-args ctx call
// (the WA door's only shape) threw on `req.app` — the CE's named correction; §3 calling it
// with { supabase, vendor, agentId } and getting a real route is that fix, proven.
//
// DISCLOSED RIG: a mock supabase modelling engine.agents (victor_mode per id) +
// engine.conversations (for the fresh-thread seam) + an empty public.admin_config (-> the
// modelRouter DEFAULTS matrix). Inert DEEPSEEK key so guardKeys does not fall back. Every
// write op is witnessed so a stray abandon on a no-op convicts. No live model call, no DB.

process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'bench-inert';
delete process.env.LLM_PROVIDER;
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { matchModeWord, applyModeFlip } = require(path.join(ROOT, 'src/api/vendor-engine/vendorMode.js'));
const { buildLlmForTurn } = require(path.join(ROOT, 'src/api/vendor-engine/chat.js'));

let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; console.log('    PASS  ' + label); } else { fail++; console.log('    FAIL  ' + label); } };

// ── the mock supabase (engine.agents + engine.conversations + public.admin_config) ─────────
function mkSupabase(agents, convos) {
  const ops = { agentUpdates: [], convoUpdates: [], deletes: [] };
  const engineTable = (table) => {
    const q = { _t: table, _eq: {} };
    const chain = {
      select() { return chain; },
      eq(col, val) { q._eq[col] = val; return chain; },
      order() { return chain; },
      limit() { return chain; },
      maybeSingle() {
        if (q._t === 'agents') {
          const vm = agents[q._eq.id];
          return Promise.resolve({ data: vm === undefined ? null : { victor_mode: vm }, error: null });
        }
        if (q._t === 'conversations') {
          const latest = convos.filter(c => c.agent_id === q._eq.agent_id)[0] || null;
          return Promise.resolve({ data: latest ? { id: latest.id, state: latest.state } : null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
      update(patch) {
        return { eq: (col, val) => {
          if (q._t === 'agents') { ops.agentUpdates.push({ id: val, patch }); agents[val] = patch.victor_mode; }
          if (q._t === 'conversations') {
            ops.convoUpdates.push({ id: val, patch });
            const c = convos.find(x => x.id === val); if (c) Object.assign(c, patch);
          }
          return Promise.resolve({ error: null });
        } };
      },
      delete() { return { eq: (col, val) => { ops.deletes.push({ id: val }); return Promise.resolve({ error: null }); } }; },
    };
    return chain;
  };
  const publicTable = (table) => {
    const q = { _t: table, _eq: {} };
    const chain = {
      select() { return chain; },
      eq(col, val) { q._eq[col] = val; return chain; },
      maybeSingle() { return Promise.resolve({ data: null, error: null }); }, // admin_config empty -> DEFAULTS
    };
    return chain;
  };
  return { from: publicTable, schema: () => ({ from: engineTable }), __ops: ops, __agents: agents, __convos: convos };
}

(async () => {
  console.log('\n  [1] THE MATCHER (whole-message, trimmed, case-insensitive):');
  T('"advisor mode" -> advisor',                    matchModeWord('advisor mode') === 'advisor');
  T('"business mode" -> business',                  matchModeWord('business mode') === 'business');
  T('"  Advisor Mode  " -> advisor (trim + case)',  matchModeWord('  Advisor Mode  ') === 'advisor');
  T('"BUSINESS MODE" -> business (case)',           matchModeWord('BUSINESS MODE') === 'business');
  T('"advisor" alone -> null (not the whole word)', matchModeWord('advisor') === null);
  T('"switch to advisor mode pls" -> null (contains, not equals — a real turn)', matchModeWord('switch to advisor mode pls') === null);
  T('"" -> null',                                   matchModeWord('') === null);
  T('null -> null (no throw)',                      matchModeWord(null) === null);

  console.log('\n  [2] THE FLIP (write + fresh thread on a change; nothing on a no-op):');
  {
    // business -> advisor, with a live thread: writes victor_mode AND abandons the thread.
    const sb = mkSupabase({ 'a1': 'business' }, [{ id: 'c1', agent_id: 'a1', state: 'active' }]);
    const r = await applyModeFlip(sb, 'a1', 'advisor');
    T('business -> advisor reports changed', r.changed === true && r.mode === 'advisor');
    T('victor_mode written to advisor (server-resolved agent)', sb.__agents['a1'] === 'advisor' && sb.__ops.agentUpdates.length === 1);
    T('the live thread was abandoned (F-06.8 fresh thread chained)', sb.__convos[0].state === 'abandoned' && sb.__ops.convoUpdates.length === 1);
    T('NEVER a delete (D-4 no-clear)', sb.__ops.deletes.length === 0);
  }
  {
    // advisor -> business (the other direction): also a real change.
    const sb = mkSupabase({ 'a1': 'advisor' }, [{ id: 'c1', agent_id: 'a1', state: 'active' }]);
    const r = await applyModeFlip(sb, 'a1', 'business');
    T('advisor -> business reports changed + writes + abandons (both directions)', r.changed === true && sb.__agents['a1'] === 'business' && sb.__convos[0].state === 'abandoned');
  }
  {
    // NO-OP: already advisor, text "advisor mode" — no write, no abandon (the live thread survives).
    const sb = mkSupabase({ 'a1': 'advisor' }, [{ id: 'c1', agent_id: 'a1', state: 'active' }]);
    const r = await applyModeFlip(sb, 'a1', 'advisor');
    T('a no-op flip reports NOT changed', r.changed === false && r.mode === 'advisor');
    T('§2 no-op writes NOTHING and abandons NOTHING (a live thread is not nuked by re-texting your mode)',
      sb.__ops.agentUpdates.length === 0 && sb.__ops.convoUpdates.length === 0 && sb.__convos[0].state === 'active');
  }

  console.log('\n  [3] THE CONFIG WIRE (F-06.1) — the WA door routes IDENTICALLY to the PWA door:');
  {
    // advisor @ signature -> deepseek (the advisor room's model), NOT the signature-tier Haiku.
    const sb = mkSupabase({ 'a1': 'advisor' }, []);
    const w = await buildLlmForTurn({ supabase: sb, vendor: { id: 'v1', tier: 'signature' }, agentId: 'a1' });
    T('advisor@signature -> deepseek (+transport +modelOverride), the same the PWA door yields',
      w.route.provider === 'deepseek' && w.route.model === 'deepseek-v4-flash' && !!w.transport && w.modelOverride === 'deepseek-v4-flash');
    T('…engine tier still follows the PRODUCT tier (signature -> mid)', w.tierOverride === 'mid');
  }
  {
    // business @ signature -> anthropic-haiku, NO transport — byte-identical to the PWA control.
    const sb = mkSupabase({ 'a1': 'business' }, []);
    const w = await buildLlmForTurn({ supabase: sb, vendor: { id: 'v1', tier: 'signature' }, agentId: 'a1' });
    T('business@signature stays anthropic-haiku, NO deepseek transport (byte-identical control)',
      w.route.provider === 'anthropic' && !w.transport);
  }
  {
    // callable with PLAIN ARGS (the WA door's only shape) — the CE-named lockstep fix.
    const sb = mkSupabase({}, []);
    const w = await buildLlmForTurn({ supabase: sb, vendor: { id: 'v1', tier: 'essential' }, agentId: 'unseeded' });
    T('§3 plain-args ctx routes with no Express req (read-miss falls to business/essential)',
      w.tierOverride === 'entry' && w.route.provider === 'deepseek');
  }

  console.log(`\n  ── ${pass}/${pass + fail} PASS ──\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
