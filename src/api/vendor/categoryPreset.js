'use strict';
// src/api/vendor/categoryPreset.js
// Vendor Suit, Phase 3 — maps a vendor's category (public.vendors.category) to
// the engine agent's profession_preset, which resolveField() turns into a domain
// handbook. Only categories with an authored Codex get an override; every other
// category passes through as-is and resolves to NO handbook — i.e. the SMM
// always-on lens only (genuinely useful, not degraded). When the photographer
// and designer Codexes land, add one line each here + one SQL upsert.
//
// ── ARC OB (CE-32, 2026-08-12) — FORK 2, the second shadow list ──────────────
// This map used to be keyed on RAW category text and carried `'venue & decor'`,
// a token that exists in NEITHER canonical list — it came from the signup door's
// private six (auth.js, F-OB.3). Two defects fell out of that:
//   · the key space could never match what the vendor door writes, so a vendor
//     onboarded through the CRUD door reached the Codex only by coincidence;
//   · raw keying meant 'Photographer' or ' photography ' missed and silently
//     resolved to no handbook.
// It now NORMALISES FIRST through the one home, so every alias the estate knows
// lands on the right Codex, and the keys are canonical tokens only.
//
// `venue_catering` inherits `venue_decorator` ("The Setting") ALONGSIDE `decor`:
// under the old six those two crafts shared one chip and one Codex, and the
// eleven split the chip without splitting the handbook. Both routes are named so
// the split is visible when a caterer's Codex is authored. FOUNDER'S DIAL.
const CATEGORY_PRESET = {
  makeup:         'makeup_artist',    // The Mirror
  planning:       'wedding_planner',  // The Conductor
  photography:    'photographer',     // The Frame
  designer:       'designer',         // The Atelier
  decor:          'venue_decorator',  // The Setting
  venue_catering: 'venue_decorator',  // The Setting — inherited, see header
  jewellery:      'jeweller',         // The Vault
};

// category -> preset. Normalised first; a category with no authored Codex passes
// through as its CANONICAL token (SMM-only), never as raw user text.
function resolvePreset(category) {
  if (!category) return null;
  const { normaliseCategory } = require('../../lib/vendor/categoryFraming');
  const c = normaliseCategory(category);
  return CATEGORY_PRESET[c] || c;
}

module.exports = { CATEGORY_PRESET, resolvePreset };
