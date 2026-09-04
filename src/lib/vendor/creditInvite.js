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

const { isApproved, buildTemplatePayload } = require('../templates');

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
 * ⚠ `sendMetaTemplate` IS REQUIRED LAZILY, INSIDE THE OPEN BRANCH. Requiring it
 * at module load would pull the Meta client into every process that touches a
 * wedding page — including the public door, which is unauthenticated and has no
 * business holding a messaging client. It also means this module can be
 * required by a bench with no Meta configuration at all.
 */
async function sendCreditInvite({ to, owner, role, wedding, token }) {
  const gate = sendGate();
  if (!gate.open) return { ok: false, sent: false, skipped: true, reason: gate.reason };

  const payload = buildTemplatePayload('wedding_credit', {
    owner,
    role,
    wedding,
    link: claimUrl(token),
  });

  const { sendMetaTemplate } = require('../metaCloud');
  const result = await sendMetaTemplate({ to, payload });
  return { ok: true, sent: true, result };
}

module.exports = { claimUrl, sendGate, sendCreditInvite, siteBase };
