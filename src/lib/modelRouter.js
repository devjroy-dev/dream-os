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

// The default matrix == 0073 seeds (spec P5; tier names are PRODUCT tiers, CE-7).
const DEFAULTS = {
  // BENCH VERDICT 2026-07-14 (acceptance 6, live): glm-4.7-flash FAILED the advisory
  // tool-turn bench — false dones (C2/C3) + a fabricated-entity write (C4/Nena
  // Bansal). GLM stays PROVEN for harvest (strict-JSON extraction lane). Trial
  // routes anthropic until block 06 revisits with caching + a re-bench.
  'model.pwa_vendor.trial':     { provider: 'anthropic', model: HAIKU },
  'model.pwa_vendor.essential': { provider: 'deepseek',  model: 'deepseek-v4-flash' },
  'model.pwa_vendor.signature': { provider: 'anthropic', model: HAIKU },
  // TDW_06 economics sitting (founder-ruled NO Sonnet): the dormant escalation_model
  // entry removed — nothing in the estate ever read the field (grep-verified at
  // delivery). The LIVE Sonnet paths (tier-map top start, mid-tier escalate) are a
  // separate finding, filed not touched — see F-04.85 in FINDINGS_LOG.
  'model.pwa_vendor.prestige':  { provider: 'anthropic', model: HAIKU },
  // TDW_06 P6b (F-06.4, CE-ratified): the advisor room routes to deepseek at the door.
  // Keyed by victor_mode='advisor' (not a product tier) — resolved via the tier slot so
  // resolveModel is untouched. Mirrors 0082_advisor_route_seed.sql; a pre-seed deploy
  // routes advisor identically here rather than silently falling to Haiku.
  'model.pwa_vendor.advisor':   { provider: 'deepseek',  model: 'deepseek-v4-flash' },
  // TDW_08 P5 Phase 3 — THE MARKETING LANE'S ROUTE (Maya, the Closer).
  // A PROSPECT HAS NO TIER: they are not vendors and hold no `vendors` row, so
  // the tier slot is `default` and `model.harvest.default` is the structural
  // precedent here, not `pwa_vendor`. Seeded haiku per E-4's unified
  // architecture — every outward Victor-class mouth starts Haiku, cached.
  // Mirrors 0110_marketing_route_seed.sql so a pre-seed deploy routes
  // IDENTICALLY; the seed row exists to make the route admin-editable, because
  // the PATCH door 404s on a key with no row (D7). The founder's flip to
  // DeepSeek and back is that row, 60 seconds, no deploy.
  //
  // F-08.69 — THE WAKE ROLE RIDES A DIFFERENT LANE, AND IT IS AN ASSIGNMENT
  // RATHER THAN A CURE. Haiku wake-turns failed in EVERY build of this arc:
  // 9/9 narration → 7/9 self-reintroduction → 4/9 refusals → 4/9 costume breaks
  // at 881a084, including a markdown-headed briefing to an imagined operator,
  // on the wire. DeepSeek wake-turns: 0/9 that night and effectively clean
  // across the arc's whole history. The frame now works so well that a careful
  // model reads the wake as a brief — and the careful model in this house is
  // Haiku. So: replies stay on the seeded lane; wakes ride the lane that has
  // never broken one. Amendment Two's own geometry, one role over.
  // MIRRORS 0111_marketing_nudge_route.sql. ⚠ THE SEED ROW WINS OVER THIS
  // MATRIX, so 0111 must be run or wakes silently follow replies.
  'model.wa_marketing.default':  { provider: 'anthropic', model: HAIKU,
                                   nudge_provider: 'deepseek', nudge_model: 'deepseek-v4-flash' },
  // TDW_08 P5 Phase 4 — THE COUPLE LANE'S ROUTE (Eliza, the concierge on a
  // vendor's line). A COUPLE HAS NO TIER: she is not a vendor and holds no
  // `vendors` row, so the tier slot is `default` — `wa_marketing` is the
  // structural precedent here, not `pwa_vendor`. Seeded anthropic/haiku, which
  // is the literal this lane carried at `engine.js` since Session 5.5, so the
  // facade join changed the MECHANISM and not one routed byte. MIRRORS
  // `0112_couple_route_and_flag.sql` so a pre-seed deploy routes IDENTICALLY;
  // the seed row exists to make the route admin-editable (the PATCH door 404s
  // on a key with no row, D7).
  'model.wa_couple.default':    { provider: 'anthropic', model: HAIKU },
  'model.harvest.default':      { provider: 'glm',       model: 'glm-4.7-flash' },
};

// ── F-08.84 — THE PER-SURFACE ALLOW-SET ─────────────────────────────────────
// THE FINDING. `guardKeys` below guards PROVIDERS and KEYS. It has never
// guarded MODELS, and nothing else does either. Every wa-lane that joins this
// facade therefore trades a COMPILE-TIME model ceiling for an admin_config row:
// one UPDATE puts Sonnet on a customer-facing wire, with no deploy, no review,
// and no bench able to see it. That is F-05.32 — Sonnet convicted on live bride
// turns at 3x Haiku's rate — re-enabled by the transport of its own cure.
//
// THE HOLE WAS ALREADY LIVE. `model.wa_marketing.default` joined this facade at
// Phase 3 and has been open ever since; the couple lane's join would have been
// the second door, not the first. Minted at F-08.84 — the ledger's next free
// address DERIVED BY COMMAND at bfcb88e (F-08 runs to .83 and stops), never
// taken from a count. The chair's own ".86" was loose arithmetic; opening two
// silent holes on it would have been F-08.56 repeated.
//
// THE CURE, CE-RULED. Each customer-facing surface declares the model FAMILIES
// it admits. A resolved model outside its surface's set is REFUSED LOUDLY and
// the surface falls to its own DEFAULTS entry. The 60-second DeepSeek flip
// survives untouched, because DeepSeek is in the set. Sonnet on a customer wire
// goes back to requiring a code change AND a bench amendment, which is exactly
// the guarantee F-05.32 bought and this facade would otherwise have spent.
//
// A surface with NO entry here is UNCONSTRAINED, deliberately: `pwa_vendor`
// carries Victor's own haiku<->sonnet self-escalation mechanics (S-8), which are
// ruled behaviour and not this finding's business. Silence here means "not
// governed", never "governed by an empty set" — a distinction stated because an
// empty set would refuse every route and fail this lane closed by accident.
const HAIKU_CLASS    = ['claude-haiku-4-5-20251001'];
const DEEPSEEK_CLASS = ['deepseek-v4-flash'];
const SURFACE_ALLOW = {
  wa_couple:    new Set([...HAIKU_CLASS, ...DEEPSEEK_CLASS]),
  wa_marketing: new Set([...HAIKU_CLASS, ...DEEPSEEK_CLASS]),
};

// Applied to the PRIMARY model and to any role-split model on the same route
// (`nudge_model`, `donna_model`), because a split is a second model reaching the
// same wire and a guard that covers one is F-04.38's class: a cure landing on
// one door while its twin sits one field away.
function enforceAllowSet(surface, route) {
  const allow = SURFACE_ALLOW[surface];
  if (!allow) return route;
  const fallback = DEFAULTS[`model.${surface}.default`] || { provider: 'anthropic', model: HAIKU };
  let out = route;
  for (const field of ['model', 'nudge_model', 'donna_model']) {
    const m = out[field];
    if (m == null) continue;
    if (allow.has(m)) continue;
    console.warn(`[model_refused] ${surface}.${field}="${m}" is outside this surface's allow-set `
      + `(F-08.84) — falling back to ${fallback.model}`);
    out = { ...out, [field]: fallback.model, refused: true };
    if (field === 'model') out.provider = fallback.provider;
  }
  return out;
}

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
      // TDW_08 P5 (F-08.69): the SAME per-role geometry, one role over — a wake
      // turn may ride a different lane from a reply turn. Identical validation,
      // identical drop-rather-than-guess discipline. Read by
      // `src/agent/closerEngine.js`; nothing else has wake turns.
      if (v.nudge_provider && !CONF[v.nudge_provider]) { delete v.nudge_provider; delete v.nudge_model; }
      if (v.nudge_provider && !v.nudge_model) delete v.nudge_provider;
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
  // F-08.69: the nudge split follows donna's exact failure mode — a keyless
  // provider DROPS the split rather than routing at a key that is not there.
  // The wake then rides the reply lane, which is the pre-ruling behaviour and
  // is loudly logged rather than silently correct.
  if (route.nudge_provider && route.nudge_provider !== 'anthropic' && !providerKeyPresent(route.nudge_provider)) {
    console.warn(`[provider_misconfigured] nudge route ${route.nudge_provider} keyless — the wake split dropped, wakes follow replies`);
    const { nudge_provider, nudge_model, ...rest } = route;
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
    return enforceAllowSet(surface, guardKeys({ provider: forced, model: forced === 'anthropic' ? (base.provider === 'anthropic' ? base.model : HAIKU) : CONF[forced].model(''), forced: true }));
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

  const val = enforceAllowSet(surface, guardKeys({ ...route }));
  cache.set(key, { at: Date.now(), val });
  return val;
}

// ── F-08.72's SECOND LIMB (CE-ruled) — A TEST SEAM, NAMED ────────────────────
// The 60s cache above is correct for production: a zero-deploy flip lands within
// one window and the read is cheap. It is WRONG for a two-lane bench run, where
// the second lane inherits the first lane's route until the window expires and
// its transcripts wear the other lane's name. `turnLock._reset()` is the
// estate's own precedent for this shape. Production never calls it.
function _resetRouteCache() { cache.clear(); }

module.exports = { resolveModel, DEFAULTS, SURFACE_ALLOW, _resetRouteCache };
