'use strict';
// src/api/vendor/categoryPreset.js
// Vendor Suit, Phase 3 — maps a vendor's category (public.vendors.category) to
// the engine agent's profession_preset, which resolveField() turns into a domain
// handbook. Only categories with an authored Codex get an override; every other
// category passes through as-is and resolves to NO handbook — i.e. the SMM
// always-on lens only (genuinely useful, not degraded). When the photographer
// and designer Codexes land, add one line each here + one SQL upsert. No other
// change.
const CATEGORY_PRESET = {
  makeup:   'makeup_artist',     // Codex loaded (Phase 2)
  planning: 'wedding_planner',   // Codex loaded (Phase 2)
  // photography: 'photographer', // when the Codex lands
  // designer:    'designer',     // when the Codex lands
};

// category -> preset. Unknown/empty category passes through (SMM-only).
function resolvePreset(category) {
  if (!category) return null;
  const c = String(category).trim().toLowerCase();
  return CATEGORY_PRESET[c] || c;
}

module.exports = { CATEGORY_PRESET, resolvePreset };
