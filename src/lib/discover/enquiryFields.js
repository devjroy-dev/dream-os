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

module.exports = { bandCeiling, normalizeFunctions };
