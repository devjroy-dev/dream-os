// src/lib/vendor/reviewAsk.js — BLOCK 19 · G2 · THE REVIEW ASK, BUILT DARK.
//
// ═══════════════════════════════════════════════════════════════════════════
// THIS FILE SENDS NOTHING TODAY, AND THAT IS THE DESIGN
// ═══════════════════════════════════════════════════════════════════════════
// Master §2.2's build-dark law: built whole, benched, behind ONE NAMED FLAG with
// the go-live step in the code and the charter. The grant flips the flag and
// nothing else moves.
//
// TWO GATES, BOTH CLOSED, AND DELIBERATELY NOT ONE — creditInvite.js's shape,
// which is the estate's precedent for exactly this:
//   1. `REVIEW_ASK_SEND_ENABLED` — the named flag. Unset everywhere today. The
//      founder's switch, and the thing 2026-10-27 flips.
//   2. `isApproved('review_request')` — the registry's status.
// They fail for DIFFERENT REASONS: the flag says "we have not decided to send
// yet", the status says "Meta has not approved the words". A careless edit to
// either alone still cannot start traffic, and the caller can tell which is shut.
//
// ⚠ AND HERE THE SECOND GATE IS ALREADY OPEN, WHICH IS WHY THE FIRST MATTERS
// MORE THAN IT DID FOR G1.1. `tdw_review_request` is APPROVED on Direct and has
// been since 2026-08-28, so `isApproved` returns TRUE. `wedding_credit`'s
// registry status is `pending` and does half the work of holding that send dark;
// nothing here does. THE FLAG IS THE ONLY THING BETWEEN THIS CODE AND A REAL
// COUPLE'S HANDSET. Said plainly so nobody sets it to try something out.
//
// ── WHY THIS ROUTES THROUGH sendWa AND creditInvite.js DOES NOT ────────────
// F-40.90, filed by the read-first: `creditInvite.js` requires `../metaCloud`
// directly, which bypasses the cross-line opt-out gate, the nudge-class gate and
// `phoneNumberIdFor(line)` — and `metaCloud.resolveConfig` DEFAULTS the phone
// number id to MARKETING_PHONE_NUMBER_ID, so a `line: 'vendor'` entry would leave
// from the marketing number. That is G1.2's cure to make, not this seat's.
//
// THIS FILE MUST NOT INHERIT IT, AND FOR A HARDER REASON THAN TIDINESS. The
// review ask is a MARKETING template, and the P0-A ledger's inheritance table
// makes opt-out gating a CONDITION on any send of it. `sendWa` is where that
// condition is mechanically paid:
//   · `isOptedOut` — the cross-line full stop, on every line, before dispatch
//   · `nudgeClass: true` + lane 'couple' — her marketing pause (R-G2.7)
//   · `phoneNumberIdFor('bride')` — the couple's own number, not marketing's
// A send that reached `sendMetaTemplate` directly would clear none of them.
'use strict';

const { isApproved } = require('../templates');
const { sendWa } = require('../sendWa');

/** The registry key and the lane, each named once. */
const TEMPLATE_KEY = 'review_request';
const LANE = 'bride';

/**
 * WHY THE SEND IS DARK RIGHT NOW, in words a handover can quote.
 * Returned rather than logged so the caller reports the reason instead of
 * inventing one.
 */
function sendGate() {
  const flagOn   = String(process.env.REVIEW_ASK_SEND_ENABLED || '') === '1';
  const approved = isApproved(TEMPLATE_KEY);
  return {
    open: flagOn && approved,
    flagOn,
    approved,
    reason: flagOn
      ? (approved ? null : `template ${TEMPLATE_KEY} is not approved on the sending WABA`)
      : 'REVIEW_ASK_SEND_ENABLED is not set',
  };
}

/**
 * THE SUFFIX, AND ONLY THE SUFFIX.
 *
 * The approved button is `base + {{1}}` where base is `https://thedreamwedding.in/r/`.
 * The API parameter is the suffix ALONE; handing it the full URL produces
 * `https://thedreamwedding.in/r/https://thedreamwedding.in/r/dev440` (ledger
 * AMENDMENT 1's send-shape note).
 *
 * The code has ONE HOME and it is `vendors.routing_handle` — minted UPPERCASE at
 * `src/agent/onboarding.js:174-192`, lowercased in the public URL, and matched
 * `.eq('routing_handle', raw.toUpperCase())` at `src/api/public/vendorCard.js`.
 * This is R-19.1's "single-home per-vendor short code", already paid for; no
 * second code is minted here.
 */
function reviewCode(routingHandle) {
  return String(routingHandle || '').trim().toLowerCase();
}

/**
 * SEND ONE ASK. Refuses unless both gates are open and NEVER pretends otherwise
 * — the never-a-false-done law: a skipped send is reported as skipped, with the
 * reason, and no caller may read the result as "sent".
 *
 * IT DOES NOT WRITE `reviews_asked`. The witness is the caller's, because the
 * caller is what holds the once-ever key and must write it in the same breath it
 * decides to send. Splitting the decision from the record is how a second send
 * gets made.
 */
async function sendReviewAsk({ to, couple, vendor, code }, deps = {}) {
  const gate = sendGate();
  if (!gate.open) return { ok: false, sent: false, skipped: true, reason: gate.reason };

  const suffix = reviewCode(code);
  if (!suffix) {
    // A vendor mid-onboarding has no routing_handle, and a button pointing at
    // `https://thedreamwedding.in/r/` bare is a link to nothing. Refused loudly
    // rather than sent hopefully.
    return { ok: false, sent: false, skipped: true, reason: 'vendor has no routing_handle; the review link would have no target' };
  }

  const _sendWa = deps.sendWa || sendWa;
  const res = await _sendWa({
    line: LANE,
    to,
    templateKey: TEMPLATE_KEY,
    // The body's two variables by their semantic names, plus the BUTTON's own
    // variable. `buildTemplatePayload` reads the button's value by name and never
    // off the body's positional list — the button's {{1}} and the body's {{1}}
    // are different variables that share a number.
    vars: { couple, vendor, code: suffix },
    // R-G2.7 · THE CONDITION, PAID. Declaring nudge-class is what makes sendWa
    // consult the 'couple' lane pause before it dispatches. Without this flag the
    // gate is skipped silently — it is opt-in by design (F-05.22).
    nudgeClass: true,
    supabase: deps.supabase,
  });

  return { ok: true, sent: true, result: res };
}

module.exports = { sendGate, sendReviewAsk, reviewCode, TEMPLATE_KEY, LANE };
