// src/lib/coerceBudget.js
// ─────────────────────────────────────────────────────────────────────────────
// THE SINGLE SEAT FOR BUDGET INGESTION — BOTH DOORS COME HERE.
//
// ── F-06.85 MECHANISM COMMENT (required by CE ruling R-26.5 §B) ──────────────
// couples.budget_total has TWO writers, and this function is the only place
// either of them decides what a budget IS:
//
//   1. src/agent/brideEngine.js  · save_wedding_detail — reached from WhatsApp
//      AND from the in-app Dream room, because src/api/couple/chat.js runs the
//      same runBrideAgenticTurn over one shared couple_self conversation.
//   2. src/api/couple/me.js      · PATCH /:coupleId — the Settings sheet.
//
// The founder ruled 「 both can write if theres no clash 」. A clash is not two
// writers; a clash is two DEFINITIONS. There is one definition and it lives
// here, so the doors cannot drift apart. IF YOU ARE ABOUT TO CHANGE EITHER
// WRITER'S IDEA OF A VALID BUDGET, CHANGE IT HERE — a second copy is how the
// two doors diverge, and scripts/tdw09_rider2_budget.proof.mjs executes both
// writers against one input table specifically to catch that.
//
// ── WHY THIS EXISTS AT ALL: F-09.165 + F-09.167 ──────────────────────────────
// What stood here was `parseInt(value, 10)` inside each writer. parseInt stops
// at the first non-digit, so the formats an Indian bride actually types were
// exactly the formats that broke, silently:
//
//     "12,50,000" -> Rs 12      "4.5L"    -> Rs 4
//     "4,50,000"  -> Rs 4       "1 crore" -> Rs 1      "2Cr" -> Rs 2
//
// That is F-09.165, a PARSING defect. F-09.167 is a different animal found in
// the same breath and cured here too: "50" and "45" parse perfectly and are
// still silently wrong, because a bride who means fifty lakh and types 50 gets
// a fifty-rupee wedding. No arithmetic is at fault; the AMBIGUITY is. Expansion
// cannot touch it — only a conversation can, which is what `confirm` is for.
//
// ── THE WRITE-DOOR LAW (standing, promoted from F-09.165) ────────────────────
// The estate's money register has always governed RENDERING — Rs X,XX,XXX,
// grouped, never compacted. It had never governed INGESTION. formatRs showed
// "Rs 12" impeccably; nothing asked whether 12 was meant. Every couple-lane
// numeric ingest inherits this law. The Expenses and Vendors sheets still take
// free text through the old parseInt shape and are this cure's natural next
// scope — NOT chartered here, named so the next sitting finds it.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { formatRs } = require('./format');

// Founder-ruled, verbatim. Mint nothing here; reword nothing here.
// The read-back and the query are Dream Ai's voice and they carry the money
// register on OUTPUT: grouped, whole, never compacted, and ZERO rupee glyphs.
// The ₹ glyph is accepted on INPUT only (below) and is never rendered back.
const SAY = {
  readBack: (n) => `Noted — Rs ${formatRs(n)}.`,
  query:    (n, suggestion) =>
    `Rs ${formatRs(n)} — is that the full wedding budget, or did you mean Rs ${formatRs(suggestion)}?`,
};

// Founder-ruled floor. Below this the figure is QUERIED — never refused, never
// silently accepted. Her answer settles it.
const PLAUSIBILITY_FLOOR = 100000;

// The alternative Dream Ai offers when the floor trips. Derived from the
// founder's own specimen byte: 50,000 suggests 50,00,000, i.e. the same spoken
// figure re-read as lakhs. Two regimes, because "50,000" and "50" are the same
// slip said at different scales:
//   >= 1000 : she wrote thousands and meant lakhs        -> x100
//   <  1000 : she said the bare figure and meant lakhs   -> x100000
// 50000 -> 50,00,000 (matches the ruled byte exactly) · 50 -> 50,00,000.
function lakhAlternative(n) {
  return n >= 1000 ? n * 100 : n * 100000;
}

/**
 * Coerce a raw budget input into whole rupees.
 *
 * Returns one of:
 *   { ok: false, reason }                      — refused, nothing is written
 *   { ok: true, value }                        — accepted, say SAY.readBack(value)
 *   { ok: true, value, confirm: true, suggestion, say }
 *                                              — accepted-but-ambiguous; the
 *                                                caller must ask before it stands
 *
 * ACCEPTS (founder ruling: arm (b) — EXPAND):
 *   plain integers · comma grouping · L / lakh / lakhs · Cr / crore / crores
 *   · a leading ₹ glyph · surrounding whitespace · mixed case
 * REFUSES:
 *   bare decimals ("45.5"), exponent notation ("1e6"), anything non-numeric,
 *   zero and negatives. A decimal is only meaningful WITH a unit — "4.5" alone
 *   is not a budget, "4.5L" is.
 */
function coerceBudget(raw) {
  if (raw === null || raw === undefined) return { ok: false, reason: 'empty' };

  // A number arriving already-integer skips parsing entirely.
  if (typeof raw === 'number') {
    if (!Number.isInteger(raw) || raw <= 0) {
      return { ok: false, reason: 'must be a positive whole number of rupees' };
    }
    return withFloor(raw);
  }

  if (typeof raw !== 'string') return { ok: false, reason: 'unreadable' };

  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[\u20B9,\s]/g, '');   // ₹ glyph, comma grouping, all whitespace

  if (!cleaned) return { ok: false, reason: 'empty' };

  // digits, optional single decimal, optional unit — and NOTHING else. The
  // anchors are the whole point: a trailing "e6" or a stray letter must fail
  // the match rather than be silently discarded the way parseInt discarded it.
  const m = cleaned.match(/^([0-9]+(?:\.[0-9]+)?)(l|lakh|lakhs|cr|crore|crores)?$/);
  if (!m) return { ok: false, reason: 'must be a plain figure, or one with lakh / crore' };

  const magnitude = parseFloat(m[1]);
  const unit = m[2];
  if (!isFinite(magnitude)) return { ok: false, reason: 'unreadable' };

  let rupees;
  if (unit && /^(l|lakh|lakhs)$/.test(unit))       rupees = magnitude * 100000;
  else if (unit && /^(cr|crore|crores)$/.test(unit)) rupees = magnitude * 10000000;
  else {
    // No unit: a decimal is not a budget. "45.5" is refused rather than rounded,
    // because rounding it is another silent guess and silent guesses are the
    // entire disease.
    if (!Number.isInteger(magnitude)) {
      return { ok: false, reason: 'must be a whole number of rupees, or use lakh / crore' };
    }
    rupees = magnitude;
  }

  rupees = Math.round(rupees);
  if (!Number.isInteger(rupees) || rupees <= 0) {
    return { ok: false, reason: 'must be a positive whole number of rupees' };
  }
  return withFloor(rupees);
}

function withFloor(rupees) {
  if (rupees < PLAUSIBILITY_FLOOR) {
    const suggestion = lakhAlternative(rupees);
    return {
      ok: true,
      value: rupees,
      confirm: true,
      suggestion,
      say: SAY.query(rupees, suggestion),
    };
  }
  return { ok: true, value: rupees, say: SAY.readBack(rupees) };
}

module.exports = {
  coerceBudget,
  PLAUSIBILITY_FLOOR,
  SAY,
  lakhAlternative,
};
