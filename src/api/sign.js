// src/api/sign.js
// BLOCK 19 · G3.2 — THE COUPLE SIGNS, BY TOKEN. Public, capability-token.
// Mounted at /api/v2/sign by src/api/router.js. NEVER under /vendor.
//
//   GET  /:token          — what the sign leaf renders before she agrees
//   GET  /:token/document — the PDF she is agreeing to
//   POST /:token/code     — she tapped "I agree"; send the one-time password
//   POST /:token/sign     — the code; writes the signature and seals the PDF
//
// ═══════════════════════════════════════════════════════════════════════════
// IT INHERITS `src/api/consent.js`'s CONSTITUTION — R-G12.9, THREE LEAVES, ONE LAW
// ═══════════════════════════════════════════════════════════════════════════
// The token is the whole credential, nothing is persisted on her device, the HTTP
// STATUS is the verdict, and a dead token reads identically to one that never existed.
//
// ⚠ THREE DECLARED DEPARTURES FROM THE CONSENT LANE, EACH A DIFFERENCE IN POWER.
//
//   1. IT IS **TERMINAL**. `/consent/`'s own header says a couple who can say yes and
//      never no has been given a trapdoor, and it is right — about a publication
//      switch. A SIGNATURE IS NOT A SWITCH. Clause 5 is how an agreement is undone,
//      in writing, with a slab; a button that un-signed it would be this product
//      inventing a remedy the instrument does not have. `S3-sign-done` offers no way
//      back and that is the ruled behaviour, not an omission.
//
//   2. IT CARRIES A **REAL ONE-TIME PASSWORD**, not the last-four friction check.
//      R-G32.2: clause 12's bytes are frozen and lawyer-passed (R-40.46) and they say
//      a password is SENT to her number and ENTERED. `/consent/`'s check is explicitly
//      *a friction check, not an OTP — nothing is sent, nothing is stored*, which is
//      right for a switch and false for a signature. The last-four check is NOT
//      layered on top: the OTP subsumes it, and asking for both would be two frictions
//      for one act.
//
//   3. THE OTP DOES NOT RIDE `public.otp_sessions` — R-G32.10, on F-40.114. That
//      table's PRIMARY
//      KEY is `phone` (PUBLIC_SCHEMA.md:1741), so a couple mid-login on her own
//      account and mid-signing on a vendor's contract would overwrite one code with
//      the other, silently. The witness lives on the `contract_signatures` row, bound
//      to ONE contract — which is what clause 12 describes anyway.
//
// ⚠ THE CODE IS SENT ONLY AFTER SHE TAPS I AGREE. `POST /:token/code` is that tap.
// Minting at send-time would put a live code on her number ten minutes before she had
// opened anything, and expire it while she was still reading.
'use strict';

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const asyncHandler = require('../lib/asyncHandler');
const C = require('../lib/vendor/contracts');
const { renderContract } = require('../lib/vendor/contractSource');
const { sendOtpCode } = require('../lib/otpSend');

function dead(res) { return res.status(404).json({ ok: false, code: 'not_found' }); }

/**
 * What the sign leaf is allowed to know.
 *
 * ⚠ THE ROW IS NEVER SPREAD. `sign_token` is already in her address bar, `otp_hash` is
 * a secret, and `otp_attempts` would tell a guesser how many tries remain. F-04.106 is
 * the precedent — a spread once shipped `page_token`, a capability secret, to a client.
 */
async function view(supabase, token) {
  const signing = await C.findSigningByToken(supabase, token);
  if (!signing) return null;

  const { data: contract } = await supabase.from('contracts')
    .select('id, vendor_id, title, state, terms').eq('id', signing.contract_id).maybeSingle();
  if (!contract) return null;

  const { data: vendor } = await supabase.from('vendors')
    .select('business_name').eq('id', contract.vendor_id).maybeSingle();

  return { signing, contract, owner: vendor ? vendor.business_name : null };
}

// ── GET /:token ─────────────────────────────────────────────────────────────
router.get('/:token', asyncHandler(async (req, res) => {
  const v = await view(req.app.locals.supabase, req.params.token);
  if (!v) return dead(res);
  // `id` is not echoed: the leaf needs none, the token addresses the signing, and an
  // id on the wire is one more thing to guess with.
  return res.status(200).json({
    ok: true,
    sign: {
      owner:  v.owner,
      signed: Boolean(v.signing.verified_at),
      // ⚠ NEITHER HER NUMBER NOR ANY PART OF IT IS RETURNED. She knows her own
      // number; a masked one on the wire is a hint for anyone else holding the link.
      code_sent: Boolean(v.signing.otp_hash),
    },
  });
}));

// ── GET /:token/document ────────────────────────────────────────────────────
// The bytes she is agreeing to, rendered fresh from the row through the ONE call site.
// Never a stored draft PDF: a document served from storage could have been rendered
// before the last edit, and she would agree to a page the record no longer says.
router.get('/:token/document', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const v = await view(supabase, req.params.token);
  if (!v) return dead(res);

  const r = await renderContract(supabase, v.contract.vendor_id, v.contract.id);
  if (!r.ok) return dead(res);
  res.setHeader('Content-Type', 'application/pdf');
  // INLINE, not an attachment: `S3-sign-read` shows her the document in the page, and
  // `Save a copy` (veto row 58) is the separate act. A browser that downloaded on open
  // would have answered the tap she has not made yet.
  res.setHeader('Content-Disposition', 'inline; filename="agreement.pdf"');
  return res.status(200).send(r.buffer);
}));

// ── POST /:token/code — she tapped "I agree" ────────────────────────────────
router.post('/:token/code', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const v = await view(supabase, req.params.token);
  if (!v) return dead(res);
  if (v.signing.verified_at) return dead(res);   // terminal; a second sign is a miss

  const issued = await C.issueSignCode(supabase, v.signing.id);
  if (!issued.ok) return dead(res);

  // ⚠ THE SEND IS DARK AND SAYS SO — never a false done.
  // `sendOtpCode` rides the VENDOR lane's own PNID, because the signer is a
  // `clients` row and has no bride-lane relationship with this estate; `wedding_consent`
  // is the precedent for a couple-facing message on the vendor line.
  //
  // R-G32.9: the registry key `contract_sign_otp` points at the ALREADY-APPROVED
  // `tdw_vendor_login_otp`, whose body is Meta's preset `{{1}} is your verification
  // code.` — a code and nothing else, naming no account. `tdw_contract_sign_otp` is
  // submitted in parallel and the key re-points on approval.
  const flagOn = String(process.env.CONTRACT_SIGN_SEND_ENABLED || '') === '1';
  let sent = false;
  let reason = flagOn ? null : 'CONTRACT_SIGN_SEND_ENABLED is not set';
  if (flagOn) {
    try {
      await sendOtpCode({
        to: v.signing.signer_phone, code: issued.code,
        lane: 'vendor', templateKey: 'contract_sign_otp',
      });
      sent = true;
    } catch (e) {
      // The throw is `otpSend`'s own loud failure. It is REPORTED, never swallowed
      // into a success — R-40.29: a person who has just tapped a button needs to be
      // told the tap did not land.
      reason = e.message;
    }
  }
  return res.status(sent ? 200 : 503).json({ ok: sent, sent, reason });
}));

// ── POST /:token/sign — the code ────────────────────────────────────────────
//
// ⚠ ONE ANSWER FOR EVERY FAILURE. A wrong code, a spent token, an expired one and one
// that never existed all return the SAME 404. A body that told them apart would tell a
// guesser how close he was and how many tries remained. The ONE thing the leaf does
// distinguish is a wrong code from a dead link — because she holds a live token and has
// simply mistyped, and veto row 62 is that sentence.
router.post('/:token/sign', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const v = await view(supabase, req.params.token);
  if (!v) return dead(res);
  if (v.signing.verified_at) return dead(res);

  const check = await C.verifySignCode(supabase, v.signing, (req.body || {}).code);
  if (!check.ok) {
    // `spent` means the token is now NULL and the next request will 404 anyway. She is
    // told the code was wrong, once, and the link dies quietly behind that.
    return res.status(422).json({ ok: false, code: 'bad_code' });
  }

  // ── THE SEAL. Render, digest, store, stamp, flip. IN THAT ORDER. ──────────
  // The digest is taken over the bytes that were actually rendered AFTER the
  // signature row was verified — so the seal on the page and the hash in the record
  // describe the same document. Digesting an earlier render would be a fingerprint of
  // a document nobody signed.
  const vendorId = v.contract.vendor_id;
  const r = await renderContract(supabase, vendorId, v.contract.id);
  if (!r.ok) return res.status(500).json({ ok: false, error: 'Could not seal the agreement.' });

  const sha  = crypto.createHash('sha256').update(r.buffer).digest('hex');
  const path = `${vendorId}/${v.contract.id}.signed.pdf`;
  const up = await supabase.storage.from(C.BUCKET)
    .upload(path, r.buffer, { contentType: 'application/pdf', upsert: true });
  if (up.error) return res.status(500).json({ ok: false, error: 'Could not store the agreement.' });

  await C.setSealedPath(supabase, v.signing.id,
    { sha256: sha, path, signedAt: new Date().toISOString() });

  await supabase.from('contracts')
    .update({ state: 'signed', signed_at: new Date().toISOString() })
    .eq('id', v.contract.id).eq('vendor_id', vendorId);

  return res.status(200).json({ ok: true, signed: true });
}));

module.exports = router;
