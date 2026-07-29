// src/lib/discover/ranking.js — THE DISCOVER FEED'S ORDER.
//
// TDW_07 P1 · D-5: "Ranking = Spotlight + freshness + profile completeness; weights
// live in admin_config (hand-tunable)". The formula, as specced:
//
//   score = w_spotlight·spotlight_norm + w_freshness·decay(last_active) + w_completeness·completeness
//
// All three terms normalised 0–1; weights read from admin_config and cached 60s.
//
// ── WHAT THIS FILE IS NOT ─────────────────────────────────────────────────────────
// It does not query. Every term arrives as data from the caller (couple/discover.js),
// so every function here is PURE and benchable without a database. The one impure
// function, loadWeights(), is the admin_config read and is kept at the bottom behind
// its own cache.
//
// ── TERM 1 · spotlight_norm — CE ruling §C/F2, OPTION (a) SIMPLIFIED ───────────────
// 1.0 where an `active=true` row in public.spotlight carries this vendor_id, else 0.
// NO time decay. The chair's reason, recorded so the next reader does not "improve" it:
// the `active` flag IS the editorial decay — the team retires a card by flipping it
// (src/api/admin/spotlight.js:57 is that flip) — and a clock stacked on top would
// double-count one signal and add a horizon nobody ruled.
// Provenance: docs/db/PUBLIC_SCHEMA.md · public.spotlight · 9 columns —
//   2. vendor_id uuid   (NULLABLE — an editorial card need not name a vendor)
//   7. active boolean NOT NULL default true
// Null-vendor_id cards contribute nothing BY CONSTRUCTION: they never enter the id set.
// Census at this tip: src/api/admin/spotlight.js is the table's ONLY reader/writer
// (six sites, surfaced by the pwa's app/admin/content/spotlight/page.tsx). The feed's
// read, born in this sitting, is the SECOND reader. Recorded because the next change
// to that table now has two consumers, not one.
//
// ── TERM 2 · decay(last_active) — THE FRESHNESS CENSUS, RESOLVED ──────────────────
// The census the CE ruling owed at F4 was run by command at fea5e4d. Result:
//   · public.vendors carries NO last_active / last_seen / last_login column — the
//     witnessed 38-column list has none. The spec's field name has no home.
//   · public.vendors.updated_at (col 13) EXISTS but is NOT a recency signal: zero code
//     writes it explicitly (grepped across src/**; 29 `from('vendors').update(...)`
//     sites, none sets it) and there is no trigger in the ladder. It is default-now()
//     at insert and then frozen. Using it would rank by SIGNUP DATE wearing the word
//     "active" — the F-05.20 class in a ranking.
//   · public.vendor_activity_log IS an honest carrier and is LIVE. Witnessed columns:
//     2. vendor_id uuid NOT NULL · 8. created_at timestamptz NOT NULL default now().
//     It is written by src/lib/vendor/snapshot.js's fail-safe logActivity, called from
//     24 sites across BOTH surfaces (the WA engine, harvest, the binder doors, the PWA
//     chat) — `surface` is 'whatsapp' | 'pwa' by its own contract. MAX(created_at) per
//     vendor is a true "when did this vendor last do real work".
// THE CARRIER IS WIRED. The term is not zero, and the in-file comment naming a missing
// carrier — the ruling's other limb — is deliberately absent because the limb did not
// fire. If the log is ever retired, THIS is the paragraph to re-open.
//
// Decay shape: LINEAR to zero over FRESHNESS_HORIZON_DAYS. Linear, not exponential,
// because a half-life is a second tunable nobody ruled and the weights already give
// the founder the dial he asked for. A vendor with no row in the horizon reads 0.0 —
// the honest bottom, not a penalty invented on top of one.
//
// ── TERM 3 · completeness — src/lib/vendor/profileScore.js, the one home ───────────
//
// ── THE ORDER OF OPERATIONS, ruled at §C/F4 and asserted by the bench ──────────────
// Ranking orders the REAL leg ONLY, and runs BEFORE couple/discover.js's existing
// every-5th demo interleave (:126-:141 at fea5e4d). The interleave's position law is
// untouched — rank first, interleave after. FEATURED marking rides the shaped card and
// is independent of slot: a featured vendor is marked wherever ranking puts it.

'use strict';

// ── Weights ───────────────────────────────────────────────────────────────────────
// The three admin_config keys, spelled once. Seeded by 0101's second statement —
// admin_config's PATCH route 404s on a key with no row (src/api/admin/config.js:31-32)
// and there is no insert route, so seeding is a PRECONDITION of any flip, not a nicety.
const WEIGHT_KEYS = Object.freeze({
  spotlight:    'discover.rank.w_spotlight',
  freshness:    'discover.rank.w_freshness',
  completeness: 'discover.rank.w_completeness',
});

// The spec's seeds. These are the FALLBACK when a row is missing or unparseable — the
// feed must order itself even against an empty admin_config, because a feed that 500s
// on a missing config row is a worse failure than a feed ordered by the defaults.
const DEFAULT_WEIGHTS = Object.freeze({
  spotlight:    0.5,
  freshness:    0.25,
  completeness: 0.25,
});

const WEIGHTS_TTL_MS = 60 * 1000;               // "60s cached", the spec's own number
const FRESHNESS_HORIZON_DAYS = 30;
const FRESHNESS_HORIZON_MS   = FRESHNESS_HORIZON_DAYS * 24 * 60 * 60 * 1000;

let _weightsCache = null;   // { at: epochMs, weights: {...} }

function clamp01(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return 0;
  return n < 0 ? 0 : (n > 1 ? 1 : n);
}

/**
 * spotlight_norm — 1.0 if this vendor holds an active spotlight card, else 0.
 * @param {string} vendorId
 * @param {Set<string>} activeSpotlightVendorIds
 */
function spotlightNorm(vendorId, activeSpotlightVendorIds) {
  if (!vendorId || !activeSpotlightVendorIds) return 0;
  return activeSpotlightVendorIds.has(vendorId) ? 1 : 0;
}

/**
 * decay(last_active) — linear 1.0 → 0.0 across the horizon.
 * A null/absent/unparseable timestamp reads 0.0. A FUTURE timestamp reads 1.0 rather
 * than >1: clock skew must not out-rank a real vendor.
 * @param {string|Date|null} lastActive  ISO string or Date
 * @param {number} [nowMs]  injectable for the bench — never Date.now() inside the math
 */
function freshnessNorm(lastActive, nowMs = Date.now(), horizonMs = FRESHNESS_HORIZON_MS) {
  if (!lastActive) return 0;
  const t = lastActive instanceof Date ? lastActive.getTime() : Date.parse(lastActive);
  if (!Number.isFinite(t)) return 0;
  const age = nowMs - t;
  if (age <= 0) return 1;
  if (horizonMs <= 0) return 0;
  return clamp01(1 - (age / horizonMs));
}

/**
 * The weighted sum. Terms are clamped on the way in, so a caller that hands a raw
 * count instead of a fraction cannot silently dominate the order.
 */
function rankScore(terms, weights) {
  const w = normalizeWeights(weights);
  const s = clamp01(terms && terms.spotlight);
  const f = clamp01(terms && terms.freshness);
  const c = clamp01(terms && terms.completeness);
  return (w.spotlight * s) + (w.freshness * f) + (w.completeness * c);
}

/**
 * Coerce whatever came out of admin_config into three finite non-negative numbers.
 * admin_config.value is TEXT (PUBLIC_SCHEMA · public.admin_config · col 2 `value text
 * NOT NULL`), so every read is a string until proven otherwise. An unparseable or
 * negative value falls back to that term's DEFAULT — never to zero, because a typo in
 * one field should not silently delete a whole ranking term.
 */
function normalizeWeights(raw) {
  const out = {};
  for (const term of ['spotlight', 'freshness', 'completeness']) {
    const n = Number(raw && raw[term]);
    out[term] = (Number.isFinite(n) && n >= 0) ? n : DEFAULT_WEIGHTS[term];
  }
  return out;
}

/**
 * Order the REAL leg. Returns a NEW array; the input is not mutated.
 * Ties break on the caller's incoming order (Array.prototype.sort is stable in Node
 * ≥11), which is the existing created_at-desc order — so an all-zero-score feed comes
 * out exactly as it does today. That is the both-ways property the bench asserts.
 */
function rankVendors(scored) {
  return [...(scored || [])].sort((a, b) => (b._rank_score || 0) - (a._rank_score || 0));
}

/**
 * Read the three weights from admin_config, cached WEIGHTS_TTL_MS.
 * NEVER throws: a failed read serves the defaults and logs. The feed is a public
 * surface; it does not 500 because a config table hiccuped.
 */
async function loadWeights(supabase, nowMs = Date.now()) {
  if (_weightsCache && (nowMs - _weightsCache.at) < WEIGHTS_TTL_MS) {
    return _weightsCache.weights;
  }
  let weights = { ...DEFAULT_WEIGHTS };
  try {
    const { data, error } = await supabase
      .from('admin_config')
      .select('key, value')
      .in('key', [WEIGHT_KEYS.spotlight, WEIGHT_KEYS.freshness, WEIGHT_KEYS.completeness]);
    if (error) {
      console.warn('[discover/ranking] admin_config read failed, serving defaults:', error.message);
    } else {
      const byKey = {};
      for (const row of (data || [])) byKey[row.key] = row.value;
      weights = normalizeWeights({
        spotlight:    byKey[WEIGHT_KEYS.spotlight],
        freshness:    byKey[WEIGHT_KEYS.freshness],
        completeness: byKey[WEIGHT_KEYS.completeness],
      });
    }
  } catch (err) {
    console.warn('[discover/ranking] admin_config threw, serving defaults:', err.message);
  }
  _weightsCache = { at: nowMs, weights };
  return weights;
}

// Test seam only — the bench drives the cache's own clock rather than sleeping 60s.
function _resetWeightsCache() { _weightsCache = null; }

module.exports = {
  WEIGHT_KEYS,
  DEFAULT_WEIGHTS,
  WEIGHTS_TTL_MS,
  FRESHNESS_HORIZON_DAYS,
  FRESHNESS_HORIZON_MS,
  spotlightNorm,
  freshnessNorm,
  rankScore,
  rankVendors,
  normalizeWeights,
  loadWeights,
  _resetWeightsCache,
};
