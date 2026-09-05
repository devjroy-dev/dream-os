// src/lib/vendor/creditInvite.js
// BLOCK 19 · G1.1 — THE CLAIM INVITE, BUILT DARK (master §2.2's build-dark law).
//
// ═══════════════════════════════════════════════════════════════════════════
// THIS FILE SENDS NOTHING TODAY, AND THAT IS THE DESIGN
// ═══════════════════════════════════════════════════════════════════════════
// The build-dark law: a feature whose runtime needs a permission or an approval
// not yet granted is built whole, benched, and ships behind ONE NAMED FLAG with
// its go-live step stated in the code and the charter. The grant flips the flag
// and nothing else moves.
//
// TWO GATES, BOTH CLOSED, AND DELIBERATELY NOT ONE:
//   1. `WEDDING_CREDIT_SEND_ENABLED` — the named flag. Unset in every
//      environment today. This is the founder's switch.
//   2. `isApproved('wedding_credit')` — the registry's own status, which reads
//      `pending` because F-40.21's template does not exist on either WABA.
// One gate would be enough to stop a send. Two are here because they fail for
// DIFFERENT REASONS: the flag says "we have not decided to send yet" and the
// status says "Meta has not approved the words yet". A careless edit to either
// one alone still cannot start traffic, and the caller can tell WHICH is shut.
//
// UNTIL BOTH OPEN, the claim path is walked by the founder pasting the claim URL
// himself. `claimUrl()` below is therefore live and useful today — it is the
// thing the studio door returns and the thing he pastes — while `sendCreditInvite`
// refuses. The URL builder is not gated; only the send is.
'use strict';

const { isApproved } = require('../templates');

/** The public base. One home; the same default the public card door uses. */
function siteBase() {
  return process.env.PUBLIC_SITE_BASE || 'https://thedreamwedding.in';
}

/**
 * The claim address. `/credits/<token>` — the token is the whole credential
 * (the crew page's constitution), so there is no id and no query string to
 * lose. The mock's W4-wa frame draws exactly this shape.
 */
function claimUrl(token) {
  return `${siteBase()}/credits/${token}`;
}

/**
 * The consent address. `/consent/<token>` — the same constitution as
 * `/credits/`, a token and nothing else, so there is no id and no query string
 * to lose. Two leaves, one constitution (R-G12.9); the shared bytes and the
 * shared fetch posture live in `lib/public/token.ts` on the pwa side.
 */
function consentUrl(token) {
  return `${siteBase()}/consent/${token}`;
}

/** Why the send is dark right now, in words a handover can quote. */
function sendGate() {
  const flagOn   = String(process.env.WEDDING_CREDIT_SEND_ENABLED || '') === '1';
  const approved = isApproved('wedding_credit');
  return {
    open: flagOn && approved,
    flagOn,
    approved,
    reason: flagOn
      ? (approved ? null : 'template tdw_wedding_credit is not approved on the sending WABA')
      : 'WEDDING_CREDIT_SEND_ENABLED is not set',
  };
}

/**
 * THE SEND. Refuses unless both gates are open, and NEVER pretends otherwise —
 * the never-a-false-done law: a failed or skipped send is reported as skipped,
 * with the reason, and no caller may read this as "sent".
 *
 * ⚠ ROUTED THROUGH `sendWa`, NOT `sendMetaTemplate` — F-40.90, cured here.
 * The first cut called the transport directly, and a direct call bypasses three
 * things the estate's single outbound gate exists to hold:
 *
 *   1. `resolveFrom(line)` — the FROM number. A template dispatched without it
 *      does not ride the VENDOR line's own PNID, so a credited stranger would be
 *      messaged from whichever number the transport defaults to. The lane's PNID
 *      is the lane's identity (F-05.6's whole subject on the OTP lanes).
 *   2. THE CROSS-LINE OPT-OUT GATE (`sendWa.js:212`). A person who has opted out
 *      of this estate would have received a credit invite anyway. That is the
 *      one failure in this file that reaches a human who never asked for us, and
 *      it was one function call away the entire time.
 *   3. The `[sendWa:template]` dispatch line (`sendWa.js:252`). F-07.55 exists
 *      because template sends were invisible; a direct call re-opens exactly
 *      that hole for this send alone.
 *
 * `sendWa` also checks `isApproved` itself. The registry gate above is KEPT
 * rather than deleted, and the redundancy is deliberate: `sendGate()` answers
 * WHICH gate is shut BEFORE any network call, in words a handover can quote,
 * and the two gates fail for different reasons. sendWa's throw is the belt
 * behind that brace.
 *
 * ⚠ THE TYPED ERRORS ARE CAUGHT AND MAPPED, NOT SWALLOWED. `sendWa` throws on
 * refusal; this function's contract is a `{ sent, skipped, reason }` object its
 * callers already branch on. An uncaught throw here would fail the whole
 * `POST /:id/credits` request over a message that was never the point of it —
 * the credit is written either way, and the room reports the send honestly.
 */
async function sendCreditInvite({ to, owner, role, wedding, token, supabase }) {
  const gate = sendGate();
  if (!gate.open) return { ok: false, sent: false, skipped: true, reason: gate.reason };

  const { sendWa } = require('../sendWa');
  try {
    const res = await sendWa({
      line: 'vendor',
      to,
      templateKey: 'wedding_credit',
      vars: { owner, role, wedding, link: claimUrl(token) },
      supabase,
    });
    return { ok: true, sent: true, result: res };
  } catch (e) {
    // The typed code is carried through so the caller can tell an opt-out from
    // an unapproved template from a bad number, rather than reading one word.
    return { ok: false, sent: false, skipped: true, reason: e.code || e.message };
  }
}

/**
 * THE CONSENT ASK — G1.2's send, dark behind its OWN flag.
 *
 * A SECOND FLAG AND NOT A SHARED ONE. `WEDDING_CREDIT_SEND_ENABLED` opens
 * messages to VENDORS who were credited; this opens messages to COUPLES who are
 * not on the platform. They are different audiences, different templates and
 * different review outcomes — Meta may approve one and reclassify the other —
 * so one switch governing both would mean the founder cannot open the safer one
 * without opening the other.
 */
function consentSendGate() {
  const flagOn   = String(process.env.WEDDING_CONSENT_SEND_ENABLED || '') === '1';
  const approved = isApproved('wedding_consent');
  return {
    open: flagOn && approved,
    flagOn,
    approved,
    reason: flagOn
      ? (approved ? null : 'template tdw_wedding_consent is not approved on the sending WABA')
      : 'WEDDING_CONSENT_SEND_ENABLED is not set',
  };
}

async function sendConsentInvite({ to, owner, wedding, token, supabase }) {
  const gate = consentSendGate();
  if (!gate.open) return { ok: false, sent: false, skipped: true, reason: gate.reason };

  const { sendWa } = require('../sendWa');
  try {
    const res = await sendWa({
      line: 'vendor',
      to,
      templateKey: 'wedding_consent',
      vars: { owner, wedding, link: consentUrl(token) },
      supabase,
    });
    return { ok: true, sent: true, result: res };
  } catch (e) {
    return { ok: false, sent: false, skipped: true, reason: e.code || e.message };
  }
}

module.exports = {
  claimUrl, consentUrl, sendGate, sendCreditInvite,
  consentSendGate, sendConsentInvite, siteBase,
};
