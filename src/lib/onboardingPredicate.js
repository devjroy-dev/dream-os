// src/lib/onboardingPredicate.js — THE ONBOARDING PREDICATE. One home, one
// definition, three readers. Arc OB · CE-31 · charter OB-D · D-2.
//
// ═══ THE LAW THIS FILE EXISTS FOR ═══════════════════════════════════════════
// COMMON (CE-31 kickoff, §WHAT 「 ONBOARDED 」 MEANS): the gate, the form and
// the backfill all read the SAME predicate — three readers, one definition,
// and a bench that reddens if any reader re-derives it locally. This file IS
// that one definition for dream-os. dreamos-pwa gets its own single home,
// served BY this file's API endpoints — OB-P renders, the API is the truth,
// and no client-only validation may claim completeness.
//
// R-OB.8 (arc law, ratified from D-1 §4) — `onboarding_state` IS A
// FLOW-POSITION MARKER AND IS NEVER THE PREDICATE. The two are not synonyms
// and the estate has already paid for the confusion: src/api/vendor/onboarding.js:72
// writes onboarding_state='complete' having validated `city` alone, against
// R-OB.6's five mandatory vendor fields (F-OB.2, the structural twin of
// F-05.18). A marker says where a flow stopped. A predicate says whether the
// facts are on file. Nothing in this file reads onboarding_state, and nothing
// that reads onboarding_state may claim to be reading this.
//
// ═══ THE SHAPE ══════════════════════════════════════════════════════════════
// Pure and dependency-free, on prospectExit.js's precedent: no supabase, no
// clock, no env. Callers hand it rows; it returns a verdict. That is what lets
// the bench assert it against fixtures without a database, and what lets the
// gate call it on a live turn without a round trip.
//
// The verdict is a SHAPE, not a boolean: { complete, missing[] }. The missing
// list is what the form needs in order to ask only for what is absent, and
// what the bench pins so a silently-loosened field reddens a cell instead of
// passing as `false === false`.
'use strict';

// ── The field vocabulary. These strings cross the repo boundary: OB-P's form
// keys off them, so they are an interface, not labels. They are NOT copy —
// they never reach a human eye. Founder-vetoed display strings live in the
// PWA form and map to these keys there.
const BRIDE_FIELDS  = ['name', 'budget'];
const VENDOR_FIELDS = ['name', 'category', 'city', 'starting_price', 'service_area'];

const SERVICE_AREA_TOKENS = ['pan_india', 'worldwide', 'select_cities'];

// A text field is present when it holds a non-empty, non-whitespace string.
// A vendor whose name is a single space has not told us her name.
function textPresent(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

// A money field is present when it is a number strictly greater than zero.
// Zero is refused deliberately: `budget_total` and `rate_min` are integers, and
// 0 is what an empty numeric input coerces to. Treating 0 as an answer would
// let a blank box satisfy a mandatory field — the precise class F-OB.2 is.
// (coerceBudget.js holds the server-side floor for the bride's number; this
// predicate asks only whether SOMETHING is on file, never what it should be.)
function moneyPresent(v) {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

// service_area is present when it is one of the three canonical tokens AND,
// for 'select_cities', at least one city is actually named. The database says
// the same thing in constraint vendors_service_cities_pairing (0122 §4); this
// is the same sentence in code because the form must be able to ask before a
// row exists to constrain. TWO EXPRESSIONS OF ONE RULE, deliberately paired —
// if a future sitting loosens one, the bench's pairing cell reddens.
function serviceAreaPresent(area, cities) {
  if (!SERVICE_AREA_TOKENS.includes(area)) return false;
  if (area !== 'select_cities') return true;
  return Array.isArray(cities) && cities.filter(textPresent).length > 0;
}

/**
 * BRIDE-COMPLETE — COMMON, verbatim: users.name present AND
 * couples.budget_total present. City and date NEVER gate (R-OB.6 marks them
 * optional, and an optional field that blocks the door is a mandatory field
 * wearing a different word).
 *
 * @param {{name?: string}}          user
 * @param {{budget_total?: number}}  couple
 * @returns {{complete: boolean, missing: string[]}}
 */
function brideComplete(user, couple) {
  const missing = [];
  if (!textPresent(user && user.name))            missing.push('name');
  if (!moneyPresent(couple && couple.budget_total)) missing.push('budget');
  return { complete: missing.length === 0, missing };
}

/**
 * VENDOR-COMPLETE — COMMON, verbatim: name, category, city, starting price,
 * service area all present.
 *
 * ⚠ DECLARED READING, carried to the chair at D-2 and NOT silently resolved:
 * "name" is read here as `users.name` — the person's own name — for two
 * reasons. (1) SYMMETRY: COMMON's bride half names users.name explicitly, and
 * one predicate should not mean two tables by the same word. (2) PRECEDENT:
 * src/api/vendor/onboarding.js:56-57 already treats users.name as the vendor's
 * name captured at signup. The alternative reading is `vendors.business_name`,
 * which is what src/agent/coupleSystemPrompt.js:77 prefers when users.name is
 * absent. THIS MUST BE RULED BEFORE THE GATE ARMS, because OB-P's form will
 * validate whichever field this file names, and a wrong choice makes every
 * vendor incomplete on a field she has already filled. The gate ships DARK
 * (R-OB.9), so nothing is refused on this reading in the meantime.
 *
 * @param {{name?: string}} user
 * @param {{category?: string, city?: string, rate_min?: number,
 *          service_area?: string, service_cities?: string[]}} vendor
 * @returns {{complete: boolean, missing: string[]}}
 */
function vendorComplete(user, vendor) {
  const v = vendor || {};
  const missing = [];
  if (!textPresent(user && user.name)) missing.push('name');
  if (!textPresent(v.category))        missing.push('category');
  if (!textPresent(v.city))            missing.push('city');
  // starting price = vendors.rate_min (0034:8). The column already existed at
  // D-1; 0122 adds no price column. rate_display (0101:65) is a SHOW/HIDE
  // switch over this number for the Discover feed — a vendor who hides her
  // price has still told us her price, so display state cannot gate the door.
  if (!moneyPresent(v.rate_min))       missing.push('starting_price');
  if (!serviceAreaPresent(v.service_area, v.service_cities)) missing.push('service_area');
  return { complete: missing.length === 0, missing };
}

module.exports = {
  brideComplete,
  vendorComplete,
  serviceAreaPresent,
  SERVICE_AREA_TOKENS,
  BRIDE_FIELDS,
  VENDOR_FIELDS,
};
