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
// F-40.196 — clause 16.2's promise. Dark until CONTRACT_COPY_SEND_ENABLED and
// Meta's Active both move; never throws, so a failed notification cannot turn a
// completed signature into a 500.
const { sendSealedCopy, recordOtpSend } = require('../lib/vendor/contractSend');
const { sendOtpCode } = require('../lib/otpSend');
// ⚠ ONE HOME, IMPORTED — NEVER A LOCAL NORMALISER (F-40.185). `src/lib/phone.js`'s
// own header says it was MOVED rather than rewritten, byte-identical to the three
// copies it replaced, precisely so no seat would author a fourth. Six files import
// it; this door did not, and handed Meta ten digits.
const { toE164 } = require('../lib/phone');

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
      // `clients.phone` is stored as a vendor typed it — often bare ten digits.
      // `normalizeTo` strips and never adds, so without this the country code was
      // simply absent and Meta answered 200 to a message that reached nobody.
      const to = toE164(v.signing.signer_phone);
      let r;
      try {
        r = await sendOtpCode({
          to, code: issued.code, lane: 'vendor', templateKey: 'contract_sign_otp',
        });
      } catch (e) {
        // F-40.258 — the refusal gets its row too, before it is rethrown to `reason`.
        await recordOtpSend(supabase, { contractId: v.contract.id, vendorId: v.contract.vendor_id, toPhone: to, wamid: null, status: (e && e.code) || 'send_failed', error: e });
        throw e;
      }
      // F-40.258: the row the receipt router matches on — `home=none matched=0` ends here.
      await recordOtpSend(supabase, { contractId: v.contract.id, vendorId: v.contract.vendor_id, toPhone: to, wamid: (r && r.result && r.result.wamid) || null, status: 'sent' });

      // ⚠ **R-40.92 — THE SEND LOGS ITSELF, AND F-40.184 IS WHY.** Not one of the
      // four layers on this path logged a success: not `postMessage`, not
      // `sendMetaTemplate`, not `sendOtpCode`, not this door. Filtering the deploy
      // log on `otp` returned only another lane's lines, so a walk could not tell
      // a send that failed from a send that never happened. `vendor/auth.js:226`
      // and `couple/auth.js:232` each carry their own line; this one was missing.
      //
      // THE RECIPIENT AND THE WAMID, NEVER THE CODE. `otpSend`'s own header marks
      // the code NEVER LOGGED HERE, and that holds.
      console.log(`[sign:send-otp] sent to ${to} wamid=${(r && r.result && r.result.wamid) || 'none'}`);
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

  // ── THE SEAL · R-G32.19 · RENDER → HASH → STORE → SEAL ────────────────────
  // ⚠ **F-40.195 — THE FIRST CUT'S ORDER MADE ITS OWN PROMISE UNKEEPABLE.**
  // It rendered once, hashed that render, stored it as the sealed copy, and only
  // THEN wrote `document_sha256`. So the sealed PDF was produced while the column
  // was null and printed `__________` where clause 12 promises a fingerprint —
  // and the hash, printed from inside the document it claimed to describe, could
  // not have described it anyway.
  //
  // Now: **the agreement as she read it** is rendered WITHOUT the seal page and
  // hashed. Those bytes are stored at `.agreed.pdf` so the hash has something to
  // be checked against — `sha256sum` on that file must equal the column, and that
  // is a check that CAN FAIL, which the old one could not (R-40.93).
  //
  // Then the sealed copy: the same pages plus a seal that prints the hash of the
  // pages before it. A hash inside a document can never be of the document
  // containing it; a hash of the pages she READ can, and it is the one a couple
  // would want checked.
  const vendorId = v.contract.vendor_id;

  const agreed = await renderContract(supabase, vendorId, v.contract.id, { sealed: false });
  if (!agreed.ok) return res.status(500).json({ ok: false, error: 'Could not seal the agreement.' });

  const sha = crypto.createHash('sha256').update(agreed.buffer).digest('hex');

  // ⚠ THE HASHED BYTES ARE STORED, NOT DISCARDED. A digest with nothing to check
  // it against is a number, not a fingerprint.
  const agreedPath = `${vendorId}/${v.contract.id}.agreed.pdf`;
  const upA = await supabase.storage.from(C.BUCKET)
    .upload(agreedPath, agreed.buffer, { contentType: 'application/pdf', upsert: true });
  if (upA.error) return res.status(500).json({ ok: false, error: 'Could not store the agreement.' });

  // ⚠ THE COLUMN IS WRITTEN **BEFORE** THE SEALED RENDER, so the seal page has a
  // fingerprint to print. That single ordering is the whole of F-40.195's cure.
  const sealedPath = `${vendorId}/${v.contract.id}.signed.pdf`;
  await C.setSealedPath(supabase, v.signing.id,
    { sha256: sha, path: sealedPath, signedAt: new Date().toISOString() });

  const sealedDoc = await renderContract(supabase, vendorId, v.contract.id, { sealed: true });
  if (!sealedDoc.ok) return res.status(500).json({ ok: false, error: 'Could not seal the agreement.' });
  const upS = await supabase.storage.from(C.BUCKET)
    .upload(sealedPath, sealedDoc.buffer, { contentType: 'application/pdf', upsert: true });
  if (upS.error) return res.status(500).json({ ok: false, error: 'Could not store the agreement.' });

  await supabase.from('contracts')
    .update({ state: 'signed', signed_at: new Date().toISOString() })
    .eq('id', v.contract.id).eq('vendor_id', vendorId);

  // ── F-40.194 · THE DONE SCREEN'S BUTTON MUST OUTLIVE THE TOKEN ────────────
  // ⚠ `verifySignCode` NULLS `sign_token` — spending it IS the security model,
  // and the leaf is terminal by ruling. So `/document` 404s the instant she signs,
  // and the done screen's `Save a copy` pointed exactly there: `{"ok":false,
  // "code":"not_found"}`, correct behaviour producing a broken control, under a
  // vetoed sentence that PROMISES the copy is ready below.
  //
  // A short-lived signed URL to the sealed copy, returned once, in the response
  // that made the signature. The token stays spent; nothing is weakened. Third
  // time in this arc a browser needed a private object and this was the answer.
  //
  // ⚠ TEN MINUTES, AND THEN SHE HAS NO COPY — F-40.196, unbuilt. Clause 12
  // promises `both of us get that PDF on WhatsApp` and this sitting does not
  // build that. The vendor's `Download the signed copy` is her permanent path;
  // the couple's is this link. The gap is the instrument's own sentence running
  // ahead of the product, and it is stated rather than hidden.
  const SIGNED_URL_TTL = 600;
  let pdfUrl = null;
  const signedUrl = await supabase.storage.from(C.BUCKET)
    .createSignedUrl(sealedPath, SIGNED_URL_TTL);
  if (!signedUrl.error) pdfUrl = signedUrl.data.signedUrl;

  // ── F-40.196 · CLAUSE 16.2'S PROMISE, NOW BUILT ───────────────────────────
  // The comment above used to end "this sitting does not build that". It does
  // now: `contractSend.js` sends the sealed PDF to BOTH parties as a document
  // header on `tdw_contract_copy`. The couple's ten-minute link above STAYS —
  // it is her copy in the seconds before WhatsApp arrives, and it costs nothing.
  //
  // ⚠ AFTER THE UPLOAD AND AFTER THE STATE FLIP, DELIBERATELY. The signature is
  // complete and recorded before any notification is attempted, so a send that
  // fails cannot leave a signed agreement looking unsigned. `sendSealedCopy`
  // NEVER THROWS for the same reason — a bookkeeping or delivery failure must
  // not turn a successful signature into a 500 for the couple who just signed.
  //
  // ⚠ DARK. `CONTRACT_COPY_SEND_ENABLED` is unset in every environment and
  // `tdw_contract_copy` is `pending` at Meta, so today this writes one log line
  // and returns. TWO GATES, and both must move.
  //
  // ⚠ DO NOT ARM THE FLAG BEFORE G3.2 PACKET 2 LANDS. `contracts.number` is
  // added by `0143` but is not ALLOCATED until packet 2's compose writer, so
  // `reference` is null here today and the filename would fall back to the
  // contract's uuid — a legally correct document with a meaningless name in
  // someone's chat. Packet 2 fills the column and the fallback goes unused.
  const rows = await supabase.from('contracts')
    .select('number').eq('id', v.contract.id).eq('vendor_id', vendorId).maybeSingle();
  await sendSealedCopy(supabase, {
    contractId:  v.contract.id,
    vendorId,
    sealedPath,
    reference:   (rows && rows.data && rows.data.number) || null,
    vendorName:  agreed.source && agreed.source.vendor  ? agreed.source.vendor.business_name : null,
    vendorPhone: agreed.source && agreed.source.vendor  ? agreed.source.vendor.phone         : null,
    clientName:  agreed.source && agreed.source.client  ? agreed.source.client.name          : null,
    clientPhone: agreed.source && agreed.source.client  ? agreed.source.client.phone         : null,
  });

  return res.status(200).json({ ok: true, signed: true, pdf_url: pdfUrl, expires_in: SIGNED_URL_TTL });
}));

module.exports = router;
