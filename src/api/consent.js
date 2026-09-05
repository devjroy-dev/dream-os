// src/api/consent.js
// BLOCK 19 · G1.2 — THE COUPLE'S CONSENT, BY TOKEN. Public, capability-token.
// Mounted at /api/v2/consent by src/api/router.js. NEVER under /vendor.
//
//   GET  /:token          — what the consent page renders BEFORE the check
//   POST /:token/verify   — the last four digits; returns a signed pass
//   POST /:token/publish  — "Publish our wedding"      (pass required)
//   POST /:token/withdraw — "Not now" / "Take it down"  (pass required)
//
// ═══════════════════════════════════════════════════════════════════════════
// IT INHERITS `src/api/credits.js`'s CONSTITUTION — R-G12.9, TWO LEAVES, ONE LAW
// ═══════════════════════════════════════════════════════════════════════════
// The token is the whole credential, nothing is persisted on her device, the
// HTTP STATUS is the verdict, and a dead token reads identically to one that
// never existed.
//
// ⚠ TWO DECLARED DEPARTURES FROM THE CREDIT LANE, BOTH DIFFERENCES IN POWER.
//
//   1. IT EXPIRES at 30 days (R-G12.4). A credit token claims one name on one
//      page; this flips `couple_consent` on published material and can flip it
//      back — a standing grant.
//
//   2. IT ASKS FOR THE LAST FOUR DIGITS BEFORE IT SHOWS THE SWITCH
//      (R-G12.18.4, curing F-40.105). THE FOUNDER FOUND THE HOLE ON GLASS: the
//      vendor was handed the couple's link BY DESIGN, so the COUNTERPARTY could
//      say yes — and master §2.4 is that silence never means yes and neither
//      does the counterparty. The link no longer reaches her at all; this is the
//      second half, for a link forwarded on by someone who did receive it.
//
//      A FRICTION CHECK, NOT AN OTP. Nothing is sent, nothing is stored, and the
//      digits are compared SERVER-SIDE against the number the ask went to —
//      which this estate never returns, not even masked, anywhere in this lane.
//
// ⚠ AND IT IS NOT TERMINAL. `Take it down` stands after a yes. A couple who can
// say yes and never no has not been given a switch, she has been given a
// trapdoor. Decay was REFUSED for the same reason: a consent that expires on its
// own forces real couples to re-answer, and withdrawal is the honest reversal.
'use strict';

const express = require('express');
const router  = express.Router();
const asyncHandler = require('../lib/asyncHandler');
const { mintSigned, verifySigned } = require('../lib/signedSession');
const W = require('../lib/vendor/weddings');
const { siteBase } = require('../lib/vendor/creditInvite');

function dead(res) { return res.status(404).json({ ok: false, code: 'not_found' }); }

// ── THE PASS ────────────────────────────────────────────────────────────────
// The check is enforced by the SERVER, never by a leaf that remembers it
// answered. A client-side "verified" boolean is a suggestion: anyone who can
// open a console sets it, and the check becomes theatre.
//
// `verify` mints a short signed pass bound to the wedding, and both writing
// doors refuse without it. No new crypto and no table — `signedSession.js` is
// the estate's signed-token home, verification returns NULL for expired, forged
// and malformed alike, and a missing secret FAILS CLOSED.
//
// FIFTEEN MINUTES: long enough to read the page and decide, short enough that a
// pass left in a borrowed browser is worth nothing by the time anyone finds it.
const PASS_TTL_MS = 15 * 60 * 1000;

function passSecret() {
  return process.env.WEDDING_DOWNLOAD_SECRET || process.env.ADMIN_SESSION_SECRET;
}
function mintPass(weddingId) {
  return mintSigned({ secret: passSecret(), subject: [String(weddingId || '')], ttlMs: PASS_TTL_MS });
}
function passHolds(pass, weddingId) {
  const v = verifySigned({ token: pass, secret: passSecret(), subjectCount: 1 });
  return Boolean(v && v.subject && v.subject[0] === String(weddingId));
}

/**
 * What the consent page is allowed to know.
 *
 * The row is NEVER spread. `consent_phone` is her own number, `consent_token` is
 * already in her address bar, and `consent_attempts` would tell a guesser how
 * many tries remain. F-04.106 is the precedent — a spread once shipped
 * `page_token`, a capability secret, to a client.
 */
async function view(supabase, token) {
  const wedding = await W.findWeddingByConsentToken(supabase, token);
  if (!wedding) return null;

  const { data: owner, error: oErr } = await supabase
    .from('vendors')
    .select('business_name, routing_handle')
    .eq('id', wedding.owner_vendor_id)
    .maybeSingle();
  if (oErr) throw oErr;

  const { data: w2, error: wErr } = await supabase
    .from('weddings').select('slug').eq('id', wedding.id).maybeSingle();
  if (wErr) throw wErr;

  // ── THE PAGE'S OWN ADDRESS — the founder's ask, 2026-09-05 ────────────────
  // A couple who says yes should be able to SEE what she just published. It is
  // not a secret: once `couple_consent` is true this URL serves to anyone, and
  // that is precisely the thing she was asked to agree to.
  //
  // ⚠ IT IS RESOLVED HERE AND RENDERED ONLY AFTER A YES. Withholding it from the
  // payload would cost a second round trip at the exact moment she has tapped,
  // and the address of a page that does not serve is not a leak — it is a miss.
  const handle = owner ? String(owner.routing_handle || '').toLowerCase() : '';
  const pageUrl = handle && w2 && w2.slug ? `${siteBase()}/v/${handle}/w/${w2.slug}` : null;

  return {
    id:        wedding.id,
    wedding:   wedding.title,
    owner:     owner ? owner.business_name : null,
    published: wedding.couple_consent === true,
    pageUrl,
  };
}

router.get('/:token', asyncHandler(async (req, res) => {
  const token = String(req.params.token || '').trim();
  if (!token) return dead(res);
  const v = await view(req.app.locals.supabase, token);
  if (!v) return dead(res);
  // `id` is not echoed: the leaf needs none, the token addresses the page, and
  // an id on the wire is one more thing to guess with.
  return res.status(200).json({
    ok: true,
    consent: { wedding: v.wedding, owner: v.owner, published: v.published, page_url: v.pageUrl },
  });
}));

// ── POST /:token/verify — the last four digits ──────────────────────────────
//
// ⚠ ONE ANSWER FOR EVERY FAILURE. A wrong guess, a spent token, an expired one
// and one that never existed all return the SAME 404. A body that told them
// apart would tell a guesser how close he was and how many tries remained.
router.post('/:token/verify', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const token  = String(req.params.token || '').trim();
  const digits = String((req.body || {}).last4 || '').trim();
  if (!token || !digits) return dead(res);

  const v = await view(supabase, token);
  if (!v) return dead(res);

  const okDigits = await W.checkConsentLastFour(supabase, { weddingId: v.id, token, digits });
  if (!okDigits) return dead(res);

  const pass = mintPass(v.id);
  // Fail-closed and legible: `mintSigned` returns null only when the secret is
  // absent, and a pass minted from nothing would prove nothing.
  if (!pass) return res.status(503).json({ ok: false, error: 'Not ready.' });
  return res.status(200).json({ ok: true, pass });
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
    const pass  = String((req.body || {}).pass || '').trim();
    if (!token || !pass) return dead(res);

    const v = await view(supabase, token);
    if (!v) return dead(res);
    if (!passHolds(pass, v.id)) return dead(res);

    const row = await W.setConsentByToken(supabase, { weddingId: v.id, token, consent });
    // ZERO ROWS TOUCHED IS A MISS, NOT A SUCCESS. The read passed and the write
    // still moved nothing — the token expired between the two, or was rotated.
    if (!row || !(row.rows_touched > 0)) return dead(res);

    return res.status(200).json({
      ok: true,
      published: row.couple_consent === true,
      page_url: v.pageUrl,
    });
  });
}

router.post('/:token/publish',  settle(true));
router.post('/:token/withdraw', settle(false));

module.exports = router;
