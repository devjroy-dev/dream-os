// src/api/consent.js
// BLOCK 19 · G1.2 — THE COUPLE'S CONSENT, BY TOKEN. Public, capability-token.
// Mounted at /api/v2/consent by src/api/router.js. NEVER under /vendor.
//
//   GET  /:token          — what the consent page renders
//   POST /:token/publish  — "Publish our wedding"
//   POST /:token/withdraw — "Not now" / "Take it down"
//
// ═══════════════════════════════════════════════════════════════════════════
// IT INHERITS `src/api/credits.js`'s CONSTITUTION — R-G12.9, TWO LEAVES, ONE LAW
// ═══════════════════════════════════════════════════════════════════════════
// Everything that file states is true here and is not re-decided:
//   · The token in the URL is the WHOLE credential. No session, no cookie, no
//     header, nothing to remember and nothing to leak on a borrowed phone.
//   · A dead token is 404, information-free, and NEVER-EXISTED ≡ EXPIRED ≡
//     ROTATED byte-identically. A body that distinguished them would tell a
//     prober which tokens once existed.
//   · No localStorage, no sessionStorage anywhere in this lane.
//
// ⚠ ONE DECLARED DEPARTURE, AND IT IS A DIFFERENCE IN POWER — R-G12.4.
// A credit token claims ONE name on ONE page and never expires. This token flips
// `couple_consent` and can be used again to flip it back: a STANDING GRANT over
// published material. One posture per power — name-claim tokens live forever,
// consent tokens expire at 30 days. The expiry is enforced in TWO places on
// purpose: `findWeddingByConsentToken` evaluates it so the page renders the same
// dead sentence, and `wedding_set_consent` (0133) re-checks it INSIDE its UPDATE
// so a caller that skipped the read cannot write anyway.
//
// ⚠ AND UNLIKE A CREDIT, THIS IS NOT ONE ACTION THEN TERMINAL.
// R-G11.14's single-action rule was written for a claim, where changing your mind
// needs a surface and a ruling. Consent is the opposite: a couple who can say yes
// and can never say no again has not been given a switch, she has been given a
// trapdoor. `withdraw` is the same token and the same function.
'use strict';

const express = require('express');
const router  = express.Router();
const asyncHandler = require('../lib/asyncHandler');
const W = require('../lib/vendor/weddings');

function dead(res) { return res.status(404).json({ ok: false, code: 'not_found' }); }

/**
 * What the consent page is allowed to know. The row is NEVER spread:
 * `consent_phone` is her own number and `consent_token` is already in her
 * address bar. F-04.106 is the precedent — a spread once shipped `page_token`,
 * a capability secret, to a client.
 */
async function view(supabase, token) {
  const wedding = await W.findWeddingByConsentToken(supabase, token);
  if (!wedding) return null;

  const { data: owner, error: oErr } = await supabase
    .from('vendors')
    .select('business_name')
    .eq('id', wedding.owner_vendor_id)
    .maybeSingle();
  if (oErr) throw oErr;

  return {
    id:      wedding.id,
    wedding: wedding.title,
    owner:   owner ? owner.business_name : null,
    published: wedding.couple_consent === true,
  };
}

router.get('/:token', asyncHandler(async (req, res) => {
  const token = String(req.params.token || '').trim();
  if (!token) return dead(res);
  const v = await view(req.app.locals.supabase, token);
  if (!v) return dead(res);
  // `id` is not echoed to the client: the leaf needs no id, the token addresses
  // the page, and an id on the wire is one more thing to guess with.
  return res.status(200).json({
    ok: true,
    consent: { wedding: v.wedding, owner: v.owner, published: v.published },
  });
}));

/**
 * Both verbs are ONE function with one argument, deliberately. Two handlers with
 * two bodies is how the yes path and the no path drift — and the no path is the
 * one nobody walks twice.
 */
function settle(consent) {
  return asyncHandler(async (req, res) => {
    const supabase = req.app.locals.supabase;
    const token = String(req.params.token || '').trim();
    if (!token) return dead(res);

    const v = await view(supabase, token);
    if (!v) return dead(res);

    const row = await W.setConsentByToken(supabase, {
      weddingId: v.id, token, consent,
    });
    // ZERO ROWS TOUCHED IS A MISS, NOT A SUCCESS. The read above passed and the
    // write still moved nothing — the token expired between the two, or it was
    // rotated. Reporting `ok` here would be a false done at the one control this
    // whole lane exists for.
    if (!row || !(row.rows_touched > 0)) return dead(res);

    return res.status(200).json({ ok: true, published: row.couple_consent === true });
  });
}

router.post('/:token/publish',  settle(true));
router.post('/:token/withdraw', settle(false));

module.exports = router;
