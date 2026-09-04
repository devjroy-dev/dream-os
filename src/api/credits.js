// src/api/credits.js
// BLOCK 19 · G1.1 — THE CLAIM PAIR. Public, capability-token.
// Mounted at /api/v2/credits by src/api/router.js. NEVER under /vendor.
//
//   GET  /:token          — what the claim page renders
//   POST /:token/claim    — Add my name
//   POST /:token/decline  — No thanks
//
// ═══════════════════════════════════════════════════════════════════════════
// THIS INHERITS `src/api/crew.js`'s CONSTITUTION, WHICH IS THE ESTATE'S ONE
// PUBLIC CAPABILITY-TOKEN POSTURE (R-G11.14, and the mock's W4-claim frame):
//   · The token in the URL is the WHOLE credential. No session, no cookie, no
//     header, nothing to remember and nothing to leak on a shared phone.
//   · A dead token is 404, information-free, and NEVER-EXISTED ≡ SETTLED ≡
//     ROTATED byte-identically. `crew.js:160`'s `dead()` is the shape and the
//     reason: a body that distinguishes them tells a prober which tokens once
//     existed. The pwa leaf renders the founder's 2026-07-22 byte,
//     "This link isn't active." — reused, never re-authored.
//   · No localStorage, no sessionStorage anywhere in this lane.
//
// ⚠ ONE ACTION, THEN TERMINAL — R-G11.14, amending the charter's "single use".
// `settleCredit` moves `tagged` and nothing else, and the predicate lives in the
// UPDATE rather than in a read-then-write here: two taps arriving together both
// pass a JS status check, but only one matches `.eq('status','tagged')`. A
// re-open shows the terminal state and offers no toggle this sitting.
'use strict';

const express = require('express');
const router  = express.Router();
const asyncHandler = require('../lib/asyncHandler');
const W = require('../lib/vendor/weddings');

function dead(res) { return res.status(404).json({ ok: false, code: 'not_found' }); }

/**
 * What the claim page is allowed to know. The credit's own `phone` is NOT here
 * — the holder of the link already knows their number and a page that prints it
 * back turns a capability URL into a personal-data leak if the link is
 * forwarded. `claim_token` is not echoed either: it is already in the address
 * bar, and putting a credential in a response body is how it reaches a log.
 */
async function view(supabase, token) {
  const credit = await W.findCreditByToken(supabase, token);
  if (!credit) return null;

  const { data: wedding, error: wErr } = await supabase
    .from('weddings')
    .select('id, owner_vendor_id, title')
    .eq('id', credit.wedding_id)
    .maybeSingle();
  if (wErr) throw wErr;
  if (!wedding) return null;

  const { data: owner, error: oErr } = await supabase
    .from('vendors')
    .select('business_name')
    .eq('id', wedding.owner_vendor_id)
    .maybeSingle();
  if (oErr) throw oErr;

  return {
    role:    credit.role,
    label:   W.ROLE_LABEL[credit.role] || null,
    status:  credit.status,
    wedding: wedding.title,
    owner:   owner ? owner.business_name : null,
  };
}

router.get('/:token', asyncHandler(async (req, res) => {
  const token = String(req.params.token || '').trim();
  if (!token) return dead(res);
  const v = await view(req.app.locals.supabase, token);
  if (!v) return dead(res);
  return res.status(200).json({ ok: true, credit: v });
}));

/**
 * ⚠ CLAIMING DOES NOT ATTACH A VENDOR ROW, AND THAT IS NOT AN OMISSION.
 * The person opening this link is usually NOT on the platform — that is the
 * whole acquisition loop. There is no session here to identify them, so
 * `settleCredit` is called with no `vendorId` and the credit becomes `claimed`
 * with the name the owner typed. The roll then renders role + name and NO link,
 * which is exactly what the ratified W1-roll frame draws for an unlinked
 * credit. Attaching a storefront to a claim would require an identity this door
 * deliberately does not have; that is G1.2's onboarding arm, not this sitting's.
 */
router.post('/:token/claim', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const token = String(req.params.token || '').trim();
  if (!token) return dead(res);

  const settled = await W.settleCredit(supabase, { token, status: 'claimed' });
  if (settled) return res.status(200).json({ ok: true, status: settled.status });

  // Either the token never existed, or it is already settled. Both answer the
  // same way to a stranger; a holder who taps twice is shown the terminal state
  // rather than an error, because the second tap is not a mistake.
  const v = await view(supabase, token);
  if (!v) return dead(res);
  return res.status(200).json({ ok: true, status: v.status, terminal: true });
}));

router.post('/:token/decline', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const token = String(req.params.token || '').trim();
  if (!token) return dead(res);

  const settled = await W.settleCredit(supabase, { token, status: 'declined' });
  if (settled) return res.status(200).json({ ok: true, status: settled.status });

  const v = await view(supabase, token);
  if (!v) return dead(res);
  return res.status(200).json({ ok: true, status: v.status, terminal: true });
}));

module.exports = router;
