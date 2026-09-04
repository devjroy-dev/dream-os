// src/lib/cloudinarySign.js
// THE ONE HOME FOR CLOUDINARY UPLOAD SIGNING — R-G11.13 as amended by R-G11.22.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS FILE EXISTS — F-40.34
// ═══════════════════════════════════════════════════════════════════════════
// The same six lines were written three times, byte-identically, and G1.1 was
// about to write them a fourth:
//   src/lib/vendor/igImport.js:247  (the Instagram mirror)
//   src/lib/vendor/portfolio.js:37  (the vendor's portfolio upload)
//   src/lib/admin/cloudinary.js:19  (five admin routers + demoLifecycle)
// Same `folder=…&public_id=…&timestamp=…`, same sha256 over that string plus
// the secret, same upload URL, same returned param bag. Three homes for one
// fact is how a fact drifts: the day Cloudinary changes a signing rule, two of
// the three get fixed and nobody can tell which.
//
// R-G11.22 (founder-ruled 2026-09-04) makes this the sole signer for all four
// sites. The three existing functions KEEP THEIR SIGNATURES and delegate here,
// so not one of the eight call sites across the tree changes — the cure is a
// body swap, not a contract change.
//
// ⚠ WHAT THIS FILE DELIBERATELY DOES NOT OWN — R-G11.13's line, which holds.
// The DESTROY signing is a different endpoint with different params
// (`public_id=…&timestamp=…`, no folder) and it stays where it lives:
// `src/lib/vendor/portfolio.js:84` and `src/lib/admin/cloudinary.js`'s
// `deleteFromCloudinary` / `destroyVerified`. Two endpoints do not share one
// name. Folding destroy in here would give this module two behaviours and one
// title, which is the disease it was written to cure wearing a new hat.
//
// ── ENV IS READ AT CALL TIME, NOT AT MODULE LOAD ───────────────────────────
// All three donor sites read `process.env` at load. Reading at call time is
// strictly more permissive — anything that works today still works, because
// env set before the require is also env set before the call — and it removes
// a latent ordering trap where a require hoisted above a config step captures
// undefined and fails at a signature nobody can explain.
'use strict';

const crypto = require('crypto');

function cloudName() { return process.env.CLOUDINARY_CLOUD_NAME || 'dccso5ljv'; }
function apiKey()    { return process.env.CLOUDINARY_API_KEY; }
function apiSecret() { return process.env.CLOUDINARY_API_SECRET; }

// The message is byte-for-byte the donors' — the same three params in the same
// order. Cloudinary signs the ALPHABETICALLY SORTED param string, and
// folder < public_id < timestamp already holds, which is why all three donors
// were correct by construction rather than by care. Stated here so the next
// person to add a param knows the order is load-bearing and not cosmetic.
function ensureCloudinary() {
  if (!apiKey() || !apiSecret()) {
    throw new Error('CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not set.');
  }
}

/** The upload endpoint. One spelling, so the cloud name has one home too. */
function uploadUrl() {
  return `https://api.cloudinary.com/v1_1/${cloudName()}/image/upload`;
}

/** A unix-seconds timestamp in the donors' own arithmetic. */
function nowTimestamp() {
  return Math.round(Date.now() / 1000);
}

/**
 * THE SIGNER. Returns the exact param bag all four callers send — no more, no
 * less — so a caller never assembles one by hand and never omits `api_key`.
 *
 * `timestamp` is taken rather than computed so the caller can prove the value
 * it signed is the value it sent; a signer that minted its own would hand back
 * a signature over a number the caller never sees.
 */
function signUpload({ folder, publicId, timestamp }) {
  ensureCloudinary();
  if (!folder)   throw new Error('signUpload: folder is required.');
  if (!publicId) throw new Error('signUpload: publicId is required.');
  const ts = Number.isFinite(timestamp) ? timestamp : nowTimestamp();

  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${ts}`;
  const signature = crypto.createHash('sha256')
    .update(paramsToSign + apiSecret())
    .digest('hex');

  return { api_key: apiKey(), timestamp: ts, signature, folder, public_id: publicId };
}

module.exports = { signUpload, uploadUrl, ensureCloudinary, nowTimestamp, cloudName };
