// src/lib/admin/cloudinary.js
// Shared Cloudinary signing helpers for admin upload endpoints.
'use strict';

const crypto = require('crypto');
const { signUpload, uploadUrl, nowTimestamp } = require('../cloudinarySign');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dccso5ljv';
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

function ensureCloudinary() {
  if (!API_KEY || !API_SECRET) throw new Error('CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not set.');
}

// ── R-G11.22 · THE SIGNING MOVED OUT; THE SIGNATURE DID NOT ─────────────────
// F-40.34: this function held the third of three byte-identical copies of the
// upload signing. The body now delegates to `src/lib/cloudinarySign.js`, the
// one home. Its ARGUMENTS, its RETURN SHAPE and its NAME are untouched, so all
// six requirers of this module — content.js, spotlight.js, surprisePool.js,
// discoverHeroes.js, musePool.js and demoLifecycle.js — are byte-unchanged by
// this delivery. (demoLifecycle takes the namespace and reads only
// `publicIdFromUrl` and `destroyVerified`; neither moves.)
//
// The DESTROY signing below stays here by R-G11.13: different endpoint,
// different params, and two endpoints do not share one name.
function generateUploadParams(folder, filename) {
  const publicId = `${filename.replace(/\.[^.]+$/, '')}-${crypto.randomBytes(4).toString('hex')}`;
  return {
    upload_url: uploadUrl(),
    params: signUpload({ folder, publicId, timestamp: nowTimestamp() }),
  };
}

async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  try {
    ensureCloudinary();
    const timestamp = Math.round(Date.now() / 1000);
    const signature = crypto.createHash('sha256')
      .update(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`)
      .digest('hex');
    await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ public_id: publicId, api_key: API_KEY, timestamp, signature }),
    });
  } catch { /* best effort */ }
}

// ══════════════════════════════════════════════════════════════════════════════
// TDW_08 · P6 · F-08.91's CURE — THE VERIFYING DESTROY.
//
// F-06.85 HEADER: the mechanism, named in-comment, because the next hand that
// reaches for `deleteFromCloudinary` above must be forced to read why this
// second function exists ten lines below it.
//
// WHY A SECOND FUNCTION AND NOT A FIX TO THE FIRST. `deleteFromCloudinary` at
// :30 fires the destroy and reads NOTHING back — no `res.ok`, no body — inside a
// bare `catch { /* best effort */ }`. A 401, a 404, a rate-limit and a success
// are byte-indistinguishable to its four admin callers. That is correct-enough
// for an admin deleting one image off a screen he is looking at, and it is
// unfit for P6, whose whole clause is "day-8 the bytes are GONE from Cloudinary,
// VERIFIABLE". The legacy function therefore ships BYTE-UNTOUCHED under the
// twenty-second chair's R-B3 — its callers are F-08.91's remaining arm,
// recorded, not widened, founder-sequenced. Changing it here would have moved
// four admin surfaces inside a deletion sitting that did not read them.
//
// "NOT FOUND" IS A SUCCESS, and this is the load-bearing decision. Cloudinary's
// destroy answers `{"result":"ok"}` on a destroy and `{"result":"not found"}`
// on an asset that is already gone. P6's caller RETRIES on anything it cannot
// confirm (R-B7 block-and-retry), so a not-found treated as a failure would
// wedge the retry loop forever on exactly the rows that are most finished. The
// question this function answers is not "did I destroy it" — it is "IS IT GONE",
// and both answers mean gone.
//
// IT NEVER THROWS. Absent credentials, a dead network and a malformed body all
// return `ok:false` with a named reason, because the caller's contract is to
// ledger an unconfirmable asset and keep the row rather than crash a nightly
// sweep mid-population. The refusal doctrine demoLifecycle states at its own
// head, applied at the seam it calls.
// ══════════════════════════════════════════════════════════════════════════════
async function destroyVerified(publicId) {
  if (!publicId) return { ok: false, reason: 'no_public_id', detail: null };
  try {
    ensureCloudinary();
  } catch (e) {
    return { ok: false, reason: 'no_credentials', detail: e.message };
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signature = crypto.createHash('sha256')
    .update(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`)
    .digest('hex');

  let res;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ public_id: publicId, api_key: API_KEY, timestamp, signature }),
    });
  } catch (e) {
    return { ok: false, reason: 'network', detail: e.message, public_id: publicId };
  }

  // THE STATUS IS CHECKED BEFORE THE BODY, deliberately: a 401 returns a JSON
  // error body that would otherwise fall through the `result` read below and be
  // reported as a malformed response, hiding a credential fault behind a parse
  // complaint.
  if (!res.ok) {
    return { ok: false, reason: `http_${res.status}`, detail: null, public_id: publicId };
  }

  const body = await res.json().catch(() => null);
  const result = body && typeof body.result === 'string' ? body.result : null;
  if (result === 'ok' || result === 'not found') {
    return { ok: true, result, public_id: publicId };
  }
  return { ok: false, reason: 'result_not_gone', detail: result, public_id: publicId };
}

// ── THE PUBLIC ID, DERIVED FROM A DELIVERY URL ───────────────────────────────
// A DECLARED DUPLICATE, named rather than discovered later. `portfolio.js:78`
// holds a byte-identical regex inside its own `deleteFromCloudinary`, where it
// exists because `vendor_portfolio` stores no public id at all. Unifying the two
// means editing that function — which R-B3 froze byte-for-byte this sitting — so
// the duplication ships DECLARED and joins F-08.91's remaining arm rather than
// being quietly re-typed as if it were new. This is the F-05.20 class held in
// the open with its removal condition stated.
//
// The pattern anchors on Cloudinary's `/v<digits>/` version segment and drops
// the extension, so `.../upload/v1712345678/demo_vendors/abc/x9.jpg` yields
// `demo_vendors/abc/x9` — folder included, which is what destroy wants.
function publicIdFromUrl(url) {
  const match = typeof url === 'string' ? url.match(/\/v\d+\/(.+)\.[a-z]+$/i) : null;
  return match ? match[1] : null;
}

module.exports = { generateUploadParams, deleteFromCloudinary, destroyVerified, publicIdFromUrl };
