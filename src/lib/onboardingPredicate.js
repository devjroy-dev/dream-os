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
// SIX, as of CE-32 ruling ⓵ (OB-D D-3). `business_name` JOINED this list as the
// sixth mandatory vendor field: the founder-frozen vendor form is SIX fields —
// PERSON NAME AND BUSINESS NAME ARE BOTH MANDATORY — and this array carried five
// with one 'name', which would have let OB-P's form render five boxes for a
// six-box ruling. The order below is the order `missing[]` reports in, and OB-P
// keys off these strings; changing one is an interface change, not a rename.
const VENDOR_FIELDS = ['name', 'business_name', 'category', 'city', 'starting_price', 'service_area'];

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
 * VENDOR-COMPLETE — COMMON: name, business name, category, city, starting
 * price, service area all present. SIX fields (CE-32 ruling ⓵).
 *
 * ✔ THE D-2 DECLARED READING IS RULED, AND THE QUESTION IT ASKED IS DEAD.
 * D-2 carried "name" to the chair as an either/or — `users.name` or
 * `vendors.business_name` — and CE-32 answered BOTH, which the either/or could
 * not: 'name' STAYS `users.name` (ratified on D-2's own two grounds — symmetry
 * with brideComplete, which names users.name explicitly, so one predicate never
 * means two tables by one word; and precedent at src/api/vendor/onboarding.js,
 * which reads users.name as the vendor's signup-captured name), AND
 * `vendors.business_name` JOINS as a SIXTH mandatory field in its own right.
 * The fork was a false one: the founder-frozen form asks for the person and the
 * studio separately, so a predicate carrying one 'name' was always going to
 * refuse one of the two answers she gave. src/agent/coupleSystemPrompt.js falls
 * back from users.name to business_name for DISPLAY — that fallback is a
 * courtesy on a read path and was never evidence that one field substitutes for
 * the other on the write path.
 *
 * WHY THE TIGHTENING IS SAFE TO LAND TODAY: the gate is DARK (R-OB.9), so no
 * live turn is refused by it, and OB-P has not seated — so this interface
 * changes before its only consumer exists rather than after. Blast radius on
 * live rows is the founder's census SELECT, run before any walk.
 *
 * @param {{name?: string}} user
 * @param {{business_name?: string, category?: string, city?: string,
 *          rate_min?: number, service_area?: string,
 *          service_cities?: string[]}} vendor
 * @returns {{complete: boolean, missing: string[]}}
 */
function vendorComplete(user, vendor) {
  const v = vendor || {};
  const missing = [];
  if (!textPresent(user && user.name)) missing.push('name');
  // vendors.business_name — witnessed at docs/db/PUBLIC_SCHEMA.md, public.vendors
  // column 3, `business_name text` (nullable, which is exactly why the predicate
  // and not the column is what makes it mandatory).
  if (!textPresent(v.business_name))   missing.push('business_name');
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

/**
 * THE API-EDGE SERVICE-AREA RULE, in one place, for every write door.
 *
 * `serviceAreaPresent` above answers "are the facts on file?" for the predicate.
 * THIS answers a different question — "is what this caller just sent LEGAL?" —
 * and it answers it in sentences a vendor can read, above the DDL floor that
 * would otherwise return an opaque 500. Two questions, two functions,
 * deliberately not merged: a field can be legally absent (predicate: missing)
 * and it can be illegally shaped (this: refused), and collapsing them would make
 * "you haven't told us yet" and "that isn't a real answer" the same reply.
 *
 * ⚠ BOUND MIRROR — THE PARITY ARBITER IS THIS FILE.
 * src/api/vendor/me.js carries its own `validateServiceArea` with these exact
 * four sentences, shipped at D-2 and byte-frozen there. It is NOT re-pointed at
 * this function this sitting: me.js's radius is additive-only under the D-3
 * charter, and cell 2.10 of the bench pins those bytes inside me.js. So the rule
 * lives at two altitudes with IDENTICAL WORDS, and the drift that arrangement
 * invites is caught mechanically rather than trusted: the bench's parity cell
 * reddens the day either copy's sentence moves a character. The tagVocabulary
 * precedent, same shape, same reason. A later sitting that re-homes me.js's
 * validator onto this one retires the parity cell WITH it.
 *
 * @param {{service_area?: string, service_cities?: string[]}} body
 * @returns {string|null} the refusal sentence, or null when legal
 */
function validateServiceAreaPair(body) {
  const hasArea   = body.service_area   !== undefined;
  const hasCities = body.service_cities !== undefined;
  if (!hasArea && !hasCities) return null;

  // Refused as a PAIR — one without the other would land a row the pairing
  // CHECK (0122 §4) forbids, and the database would answer with a 500 the
  // vendor cannot act on.
  if (hasArea !== hasCities) {
    return 'service_area and service_cities must be sent together.';
  }
  if (!SERVICE_AREA_TOKENS.includes(body.service_area)) {
    return "service_area must be one of: " + SERVICE_AREA_TOKENS.join(', ') + '.';
  }
  const cities = body.service_cities;
  if (body.service_area === 'select_cities') {
    if (!Array.isArray(cities) || cities.filter(c => typeof c === 'string' && c.trim()).length === 0) {
      return 'service_cities must name at least one city when service_area is select_cities.';
    }
  } else if (cities !== null) {
    // Not an empty array: NULL. The pairing CHECK reads `is null`, and [] would
    // be a value that satisfies neither arm.
    return 'service_cities must be null unless service_area is select_cities.';
  }
  return null;
}

module.exports = {
  brideComplete,
  vendorComplete,
  serviceAreaPresent,
  validateServiceAreaPair,
  SERVICE_AREA_TOKENS,
  BRIDE_FIELDS,
  VENDOR_FIELDS,
};
