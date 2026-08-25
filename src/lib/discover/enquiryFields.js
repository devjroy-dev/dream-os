// ─────────────────────────────────────────────────────────────────────────────
// src/lib/discover/enquiryFields.js
// TDW_07 P5 — the sheet's four fields, parsed at ONE home.
//
// ── WHY THIS FILE EXISTS, AND IT IS THE BENCH'S FAULT ────────────────────────
// These two functions began as inline expressions inside couple/enquire.js. The
// bench cells written for them (§6.6, §6.7) rebuilt the same logic inside the
// test with `new Function` and asserted it against itself — a tautology that
// passed at the UNCURED tree, and would have passed against an empty repository.
// The both-ways run caught it: eight cells added, five went red.
//
// A cell that cannot fail is not evidence, and the honest cure is not a better
// assertion — it is production code the bench can actually call. So the parsing
// moved here, and §6.6/§6.7 now drive these exact functions.
'use strict';

/**
 * The budget band's ceiling, in whole rupees.
 *
 * The band `value` is an UPPER BOUND (lib/frost/budgetBands.ts). The top band
 * ships `''`, meaning "no ceiling".
 *
 * THE TRAP THIS FUNCTION EXISTS TO AVOID: `Number('')` is `0`. A naive parse
 * turns "Rs 10,00,000+" — the richest band on the sheet — into a lead with
 * `budget_max: 0`, i.e. the poorest possible enquiry. The vendor would read the
 * most valuable bride on the feed as having no budget at all, and the enrichment
 * would compute a fee comparison against zero. Absent is not the same as zero,
 * and this is the one place the difference is decided.
 */
function bandCeiling(bandValue) {
  if (bandValue == null) return null;
  const s = String(bandValue).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * The budget band's FLOOR, in whole rupees.
 *
 * ── WHY A SECOND PARSER AND NOT A REUSE OF `bandCeiling` ────────────────────
 * They are the same arithmetic and DIFFERENT FACTS, and that is the whole
 * reason this function exists with its own name. `bandCeiling('')` returns null
 * meaning "no upper bound"; `bandFloor('')` returns null meaning "no lower
 * bound". A single function called twice would read correctly today and would
 * make the next reader ask which sense a given call site meant. The estate has
 * paid for that ambiguity once already — see the `budget_total` alias, which is
 * `budget_max` wearing a third name on the list wire.
 *
 * ── WHAT THIS CURES · F-16.25 (R-37.21, Fork A) ─────────────────────────────
 * The sheet's top band is `Rs 10,00,000+` — a FLOOR WITH NO CEILING. Its
 * `value` is `''`, so `bandCeiling` correctly returns null and `budget_max`
 * correctly stays empty: there is no ceiling to record. The defect was never
 * that null; it was that the floor she DID give had nowhere to land, so the
 * richest enquiry on the board was stored identically to a bride who answered
 * nothing, and rendered `Rs —`.
 *
 * `public.leads.budget_min` (witnessed, ordinal 9) is exactly that column, and
 * the Discover door has never written it. This function is the parse that lets
 * it.
 *
 * THE MARK: a row with `budget_min` present and `budget_max` null IS the
 * top-band answer, distinguishable from silence (both null) without any token
 * machinery. R-37.21's shape, stated where it is implemented.
 */
function bandFloor(bandValue) {
  if (bandValue == null) return null;
  const s = String(bandValue).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Did she answer the budget question at all?
 *
 * ── RECORDED BECAUSE THE WIRE ALREADY KNEW, AND THE PARSE THREW IT AWAY ─────
 * The sheet posts `budget_band: band ?? undefined` (EnquirySheet.tsx, symbol
 * `submit`), and its `band` state initialises to null. So the two answers ARE
 * distinguishable on the wire and always have been:
 *
 *     she answered nothing  ->  the key is OMITTED   (undefined)
 *     she chose the top band ->  the key is PRESENT and ''  (empty string)
 *
 * `bandCeiling` maps both to null, and that — not the wire — is where the two
 * became one. Derived at read-first this sitting, correcting an earlier seat
 * sentence of mine that put the collapse at the wire.
 *
 * THIS FUNCTION IS NOT THE CURE AND MUST NOT BECOME IT. The floor is the
 * carrier (R-37.21); this is the corroborating fact, exported so the door can
 * say out loud that it now reads a distinction it used to discard, and so a
 * future reader does not rediscover it as news. Building the top-band inference
 * on `''` alone would put the band table's meaning in two repos.
 */
function bandAnswered(bandValue) {
  return bandValue !== undefined;
}

/**
 * Her wedding functions, or null.
 *
 * `leads.event_types` is an ARRAY column. An empty array is a WRITE — it says
 * "she told us she has no functions", which is not what an untouched field
 * means. Null says "she did not tell us", which is true. Entries are trimmed and
 * blanks dropped so a stray empty option cannot become a phantom function in the
 * vendor's brief.
 */
function normalizeFunctions(functions) {
  if (!Array.isArray(functions)) return null;
  const clean = functions
    .map((f) => String(f == null ? '' : f).trim())
    .filter(Boolean);
  return clean.length ? clean : null;
}

module.exports = { bandCeiling, bandFloor, bandAnswered, normalizeFunctions };
