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

/**
 * THE ARCHIVE SIGNER — R-G12.2 (FORK 1 arm (a)).
 *
 * A guest downloads a whole wedding, and Cloudinary builds the zip server-side
 * from a list of `public_id`s. The two arms this beat: (b) buffering hundreds of
 * full-resolution originals in the Railway process, with no declared memory
 * budget; (c) handing a stranger a folder URL whose shape the estate does not
 * control.
 *
 * ⚠ A SECOND PARAMETER SET IN THE SAME HOME, DELIBERATELY — and it is NOT the
 * `destroy` case this file refuses at :22-28. Destroy was kept out because it is
 * a different ENDPOINT reached by different callers for a different purpose.
 * This is the same account, the same secret, the same sha256-over-sorted-params
 * rule, signed for the same reason: so that no caller ever assembles a
 * Cloudinary signature by hand. Two parameter sets, one signing law, one file.
 *
 * ⚠ THE SORT IS EXPLICIT HERE, AND THAT IS THE WHOLE DIFFERENCE FROM `signUpload`.
 * `signUpload`'s three params happen to be alphabetical already
 * (folder < public_id < timestamp), which is why all three donor sites were
 * correct by construction rather than by care — this file says so at :44-48.
 * These are NOT: `expires_at`, `public_ids`, `target_public_id`, `timestamp`,
 * `type` interleave, and `public_ids` is an ARRAY that Cloudinary expects as
 * `public_ids[]=a&public_ids[]=b`. Getting either wrong yields a 401 that looks
 * like a credentials problem and is not. So the sort is performed, not assumed,
 * and the array serialisation is written once here rather than at a call site.
 *
 * `expiresAt` is REQUIRED rather than defaulted. A download link with no expiry
 * is a permanent public URL to a couple's whole wedding, mailed to whoever the
 * guest forwards it to; the caller must state a lifetime out loud.
 */
function signArchive({ publicIds, timestamp, expiresAt, targetPublicId, mode }) {
  ensureCloudinary();
  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    throw new Error('signArchive: publicIds must be a non-empty array.');
  }
  if (!Number.isFinite(expiresAt)) {
    throw new Error('signArchive: expiresAt (unix seconds) is required.');
  }
  const ts = Number.isFinite(timestamp) ? timestamp : nowTimestamp();

  // Built as pairs, then sorted by key — so adding a param later cannot put the
  // signature and the request out of step by one line.
  // ⚠ `mode` IS SIGNED, SO IT CANNOT BE SWAPPED AFTER THE FACT.
  //   'create'   — the POST that builds an archive server-side.
  //   'download' — the GET that streams the zip straight to a browser, which is
  //                the only shape a guest can TAP. R-G12.17's answer render puts
  //                that URL behind one button.
  // It is a parameter and not a constant because the signature covers it: a
  // caller that needed the other mode would otherwise have to re-implement the
  // signing, which is the third-home disease this file exists to cure.
  const params = {
    expires_at:  String(expiresAt),
    mode:        mode === 'download' ? 'download' : 'create',
    public_ids:  publicIds.join(','),
    timestamp:   String(ts),
    type:        'upload',
  };
  if (targetPublicId) params.target_public_id = targetPublicId;

  const paramsToSign = Object.keys(params).sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  const signature = crypto.createHash('sha256')
    .update(paramsToSign + apiSecret())
    .digest('hex');

  return { ...params, api_key: apiKey(), signature };
}

/** The archive endpoint. One spelling, beside `uploadUrl`, same reasoning. */
function archiveUrl() {
  return `https://api.cloudinary.com/v1_1/${cloudName()}/image/generate_archive`;
}

/**
 * THE TAPPABLE ARCHIVE — R-G12.17.
 *
 * `archiveUrl()` is a POST endpoint and a guest cannot tap a POST. Cloudinary
 * serves the same route as a GET when `mode=download`, streaming the zip
 * directly, so the signed params become a query string and the result is a
 * plain link behind a button.
 *
 * ⚠ THE PARAMS ARE THE SIGNER'S OWN AND ARE NOT RE-ORDERED HERE. The signature
 * covers a SORTED param string; a query string may be in any order, but nothing
 * may be added, dropped or edited between signing and sending or the MAC stops
 * matching — which Cloudinary answers with a 401 that reads like a credentials
 * problem and is not. So this function only ENCODES what it was handed.
 *
 * ⚠ AND THIS URL NEVER REACHES AN ADDRESS BAR. It carries its own signature and
 * a guest who screenshots it has handed out a couple's whole wedding. The door
 * resolves it server-side from an opaque token; the browser only ever sees it as
 * an href it follows once.
 */
function archiveDownloadUrl(params) {
  const qs = Object.keys(params)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');
  return `${archiveUrl()}?${qs}`;
}

module.exports = {
  signUpload, uploadUrl, ensureCloudinary, nowTimestamp, cloudName,
  signArchive, archiveUrl, archiveDownloadUrl,
};
