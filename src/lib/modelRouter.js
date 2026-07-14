// src/lib/modelRouter.js — TDW_02 P5: resolveModel(surface, tier) -> {provider, model, escalation_model?}.
// Precedence (spec P5): LLM_PROVIDER env (the force switch, all surfaces) ->
// admin_config `model.<surface>.<tier>` (JSON-in-text — value column is text, D7;
// parsed defensively, junk falls through) -> the DEFAULT matrix below (which equals
// 0073's seeds, so a pre-seed deploy routes identically; the seeds exist to make the
// routes ADMIN-EDITABLE — PATCH cannot create keys, D7).
// Missing provider key -> anthropic fallback + `[provider_misconfigured]` log (spec P5).
// 60s in-process cache. Zero-deploy flips: the admin PATCH lands within one cache window.
'use strict';

const { providerKeyPresent, CONF } = require('./llm');

const HAIKU = 'claude-haiku-4-5-20251001';
const SONNET = 'claude-sonnet-4-6';

// The default matrix == 0073 seeds (spec P5; tier names are PRODUCT tiers, CE-7).
const DEFAULTS = {
  // BENCH VERDICT 2026-07-14 (acceptance 6, live): glm-4.7-flash FAILED the advisory
  // tool-turn bench — false dones (C2/C3) + a fabricated-entity write (C4/Nena
  // Bansal). GLM stays PROVEN for harvest (strict-JSON extraction lane). Trial
  // routes anthropic until block 06 revisits with caching + a re-bench.
  'model.pwa_vendor.trial':     { provider: 'anthropic', model: HAIKU },
  'model.pwa_vendor.essential': { provider: 'deepseek',  model: 'deepseek-v4-flash' },
  'model.pwa_vendor.signature': { provider: 'anthropic', model: HAIKU },
  'model.pwa_vendor.prestige':  { provider: 'anthropic', model: HAIKU, escalation_model: SONNET },
  'model.harvest.default':      { provider: 'glm',       model: 'glm-4.7-flash' },
};

const CACHE_MS = 60_000;
const cache = new Map(); // key -> { at, val }

function parseRoute(text) {
  try {
    const v = JSON.parse(String(text));
    if (v && typeof v === 'object' && v.provider && v.model && CONF[v.provider]) {
      // TDW_02 P7 (Amendment Two): optional per-role split — donna_provider/donna_model
      // route HER hand separately (LD-7: e.g. mid = Victor haiku / Donna deepseek).
      // Invalid split values are dropped, never guessed.
      if (v.donna_provider && !CONF[v.donna_provider]) { delete v.donna_provider; delete v.donna_model; }
      if (v.donna_provider && !v.donna_model) delete v.donna_provider;
      return v;
    }
  } catch (_e) { /* junk falls through to defaults */ }
  return null;
}

function guardKeys(route) {
  if (route.provider !== 'anthropic' && !providerKeyPresent(route.provider)) {
    console.warn(`[provider_misconfigured] ${route.provider} routed but its key is absent — anthropic fallback`);
    return { provider: 'anthropic', model: HAIKU, misconfigured: true };
  }
  if (route.donna_provider && route.donna_provider !== 'anthropic' && !providerKeyPresent(route.donna_provider)) {
    console.warn(`[provider_misconfigured] donna route ${route.donna_provider} keyless — her split dropped, she follows Victor`);
    const { donna_provider, donna_model, ...rest } = route;
    return rest;
  }
  return route;
}

async function resolveModel(supabase, surface, tier) {
  const key = `model.${surface}.${tier || 'default'}`;

  // 1 — the force switch overrides everything (spec precedence).
  const forced = String(process.env.LLM_PROVIDER || '').trim();
  if (forced && CONF[forced]) {
    const base = DEFAULTS[key] || { model: HAIKU };
    return guardKeys({ provider: forced, model: forced === 'anthropic' ? (base.provider === 'anthropic' ? base.model : HAIKU) : CONF[forced].model(''), forced: true });
  }

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.val;

  // 2 — admin_config (JSON-in-text, defensive).
  let route = null;
  try {
    const { data } = await supabase.from('admin_config').select('value').eq('key', key).maybeSingle();
    if (data && data.value != null) route = parseRoute(data.value);
  } catch (e) { console.warn('[modelRouter] admin_config read failed (defaults apply):', e.message); }

  // 3 — the default matrix.
  if (!route) route = DEFAULTS[key] || { provider: 'anthropic', model: HAIKU };

  const val = guardKeys({ ...route });
  cache.set(key, { at: Date.now(), val });
  return val;
}

module.exports = { resolveModel, DEFAULTS };
