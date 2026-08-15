// src/api/couple/receiptColumns.js
// ─────────────────────────────────────────────────────────────────────────────
// TDW_15 · P2 — THE RECEIPT ROW SHAPE, ONE HOME. (F-15.11, cured under R-34.35;
// this module's address ruled at R-34.37.)
//
// ── THE DISEASE ──────────────────────────────────────────────────────────────
// This list lived as THREE byte-identical copies under a comment asserting one:
//   src/api/couple/receipts.js:17  const RECEIPT_COLUMNS   — one reader (:192)
//   src/api/couple/receipts.js:84  inline .select(...)
//   src/api/couple/expenses.js:27  inline .select(...)
// The constant's own header claimed "one literal, three readers". It had one
// reader and the literal had three homes, and it was false the day it was
// written — a comment describing an intention rather than the tree, which is
// the class this estate keeps paying for. The three responses agreed only
// because nobody had yet edited one of them. P2 is that edit: `envelope_id`
// has to reach the bride's list or the unfiled tray reads empty on a plane
// where receipts are filed.
//
// ── WHY A NEUTRAL MODULE AND NOT AN EXPORT FROM `receipts.js` ───────────────
// Because `expenses.js` importing from `receipts.js` makes a route file into a
// library for its sibling, and the next hand editing `receipts.js` would have
// no signal that a second route's response shape rides on their constant. The
// estate has cured this exact disease twice by homing the shared thing in a
// module owned by neither consumer — `src/lib/vendor/categoryFraming.js` for
// the alias table, `lib/frost/budgetBands.ts` in the pwa for three inline copies
// of the budget bands. Consistency with a twice-walked path is worth one file.
//
// ── WHAT `envelope_id` MEANS HERE ───────────────────────────────────────────
// NULL = unfiled: the receipt is in the tray, awaiting a home. Non-null = filed
// into that `budget_envelopes` row. R-34.22: this is NOT the same emptiness as
// `amount` being NULL, which means untyped (a photo receipt, F-15.9). A receipt
// can be FILED and still contribute zero to its envelope's spend. No reader may
// conflate the two.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

// The columns every receipt read returns. One literal, three readers — the
// image door's response must be shape-identical to the two that predate it or
// the client would have to know which door made a row. That sentence is now
// true; it was not before this module existed.
const RECEIPT_COLUMNS =
  'id, booking_id, amount, vendor_name, description, receipt_date, image_url, tags, created_at, envelope_id';

module.exports = { RECEIPT_COLUMNS };
