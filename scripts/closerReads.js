// scripts/closerReads.js — THE SELLING READ (F-08.83, limb 5).
//
// ONE HOME, shared by the bench and the scenarios harness, and sited under
// `scripts/` because it is a MEASUREMENT and production never calls it. Putting
// it in `src/` would put a bench-side reader on the wire's own shelf.
//
// ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
// Eleven scenarios gated this lane's deploy and NINE of their READ_FOR lines are
// negative specs — no glyph, no invented discount, no defensiveness, honest NO,
// she must say so rather than guess. Not one asked whether a photographer
// reading the message would want to know more. The estate measured honesty for
// an entire arc and called its greens acceptance; the founder's first live
// evening produced three questions, zero claims, and a perfectly honest agent
// who sold nothing.
//
// ── WHAT IT MEASURES, AND WHAT IT DELIBERATELY DOES NOT ─────────────────────
// It asks ONE mechanical question: does this message put a concrete thing the
// product DOES in front of the reader, or is it only an enquiry? It does not
// judge persuasion, warmth, or length — those are the founder's read and always
// will be. A cell cannot score charm; it can notice an empty hand.
//
// THE TERMS ARE THE MANUAL'S OWN NOUNS, not adjectives. "Stunning portfolio"
// scores nothing and should. "Your work is not on the marketplace" scores,
// because a marketplace is a thing that exists.
'use strict';

const PRODUCT_CLAIM_TERMS = [
  /\bmarketplace\b/i,
  /\bstorefront\b/i,
  /\bdemo (?:studio|page)\b/i,
  /\bwhatsapp\b/i,
  /\bVictor\b/,
  /\bcalendar\b/i,
  /\bdouble-?book/i,
  /\blead(?:s)? (?:land|lands|on your board)\b/i,
  /\binvoice(?:s)?\b/i,
  /\benquir(?:y|ies) (?:that )?land/i,
  /\bfiles? it\b/i,
  /\byour (?:own )?(?:work|gallery|photographs) (?:is|are|already)\b/i,
];

// A trailing question with nothing given is the shape convicted at the founder's
// own evening: "What brings you here?" · "What was the message about?"
function hasProductClaim(text) {
  const t = String(text || '');
  return PRODUCT_CLAIM_TERMS.some(re => re.test(t));
}

function isEnquiryOnly(text) {
  const t = String(text || '').trim();
  return /\?\s*$/.test(t) && !hasProductClaim(t);
}

module.exports = { PRODUCT_CLAIM_TERMS, hasProductClaim, isEnquiryOnly };
