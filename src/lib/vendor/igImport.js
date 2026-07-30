// src/lib/vendor/igImport.js
// TDW_07 P3 — INSTAGRAM IMPORT-AND-MIRROR.
// Governed by docs/specs/TDW_07_IG_IMPORT_ADDENDUM.md (founder-ruled 2026-07-23,
// banked at CE-62) and the fifteenth chair's P3 Fork 4 ruling.
'use strict';

const crypto = require('crypto');
const { canAcceptMore, registerImage, MAX_PORTFOLIO_IMAGES } = require('./portfolio');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dccso5ljv';
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

// The estate's own delivery host. THE never-hotlink property is asserted against
// this constant, not against a shape guess: a mirrored row's image_url must be
// served from here or the mirror did not happen.
const ESTATE_IMAGE_HOST = 'res.cloudinary.com';

// ─────────────────────────────────────────────────────────────────────────────
// THE META LEG IS DECLARED UNKNOWN — READ THIS BEFORE WIRING IT.
//
// The P3 charter is explicit: "Meta's IG-API surface as documented in the
// addendum only (no invented API claims — anything the addendum doesn't state
// about Meta's current API is DECLARED UNKNOWN for the founder/chair to settle,
// never guessed)." This session had no authority to reach Meta's documentation
// and did not invent it.
//
// WHAT THE ADDENDUM DOES STATE, and is therefore law here:
//   · Basic Display is DEAD (deprecated end-2024).
//   · The path is the Instagram API with Instagram Login.
//   · Vendors need PROFESSIONAL (business/creator) accounts. Some won't have one.
//   · Content import needs App Review and therefore App-LIVE; it rides the MAIN
//     Meta app's review beside Embedded Signup / Tech Provider. The parked 06.5
//     second app stays never-App-LIVE and this is NOT it.
//   · Manual upload is the PERMANENT fallback, never a wall.
//
// WHAT IS UNKNOWN AND MUST BE SETTLED BY THE FOUNDER/CHAIR BEFORE GO-LIVE — each
// one is a value, not a design decision, and none of them changes a byte below:
//   U-1  the authorize URL and the exact scope strings to request
//   U-2  the token-exchange endpoint and whether a long-lived exchange is needed
//   U-3  the media-list endpoint, its fields parameter and its paging contract
//   U-4  the App Review permission names and the evidence Meta currently demands
//   U-5  whether Meta's media URLs are fetchable server-side without a token
//        (they are short-lived either way — that is WHY this file mirrors)
//
// listInstagramMedia() below is the ONE seam those five values land in. It
// REFUSES LOUDLY rather than returning a plausible empty list, because an import
// that silently finds nothing is indistinguishable from a vendor with no posts,
// and the estate has paid for that class of silence before (F-04.113).
// Everything downstream of the seam — the mirror, the cap, the ordering, the
// approval state, the never-hotlink property — is real, wired and benched now.
// ─────────────────────────────────────────────────────────────────────────────
async function listInstagramMedia(/* accessToken, opts */) {
  const e = new Error(
    'Instagram media listing is not wired: U-1..U-5 in src/lib/vendor/igImport.js ' +
    'are DECLARED UNKNOWN pending the founder/chair settling Meta\'s current API surface. ' +
    'The mirror pipeline below is built and benched; only this seam is open.'
  );
  e.code = 'IG_SEAM_UNSET';
  throw e;
}

// ── THE CONFIG GATE (CE §B) ──────────────────────────────────────────────────
// A connect button that throws is a dead control shown to vendors — F-07.13's
// class, minted three rulings ago. We do not ship the defect we just named. The
// pwa renders the IG entry ONLY when this returns true, so until the seam is
// configured the Portfolio surface shows the upload path alone and the manual
// route is not merely the fallback, it is the whole surface — which is exactly
// what the addendum's "permanent fallback, never a wall" asks for anyway.
//
// SELF-ARMING BY DESIGN: this reads the environment at call time, and the status
// route is not cached, so the founder wiring these variables post-App-Review
// makes the entry appear with NO redeploy of either repo.
//
// THE VARIABLE NAMES ARE THE ESTATE'S TO MINT AND ARE MINTED HERE; their VALUES
// and the scopes they authorize are U-1..U-5 above — still declared unknown, and
// nothing in this file guesses them.
function isConfigured() {
  return Boolean(process.env.IG_APP_ID && process.env.IG_APP_SECRET && process.env.IG_REDIRECT_URI);
}

function ensureCloudinary() {
  if (!API_KEY || !API_SECRET) throw new Error('CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not set.');
}

// ── THE MIRROR ───────────────────────────────────────────────────────────────
// IMPORT-AND-MIRROR, NEVER HOTLINK (the addendum's own capitals). Cloudinary
// fetches the source URL server-side and stores the bytes as an estate asset; the
// URL we persist is the estate's. The vendor's Instagram becomes a SOURCE, never
// a dependency — when their token lapses, their account changes hands, or Meta
// expires the CDN link, the storefront is untouched.
//
// The browser never holds these bytes, which is why this does not reuse the pwa's
// two-phase adminUploadFile shape: there is no browser in this path. The SIGNING
// is the same signing (src/lib/vendor/portfolio.js's, sha256 over the sorted
// params plus the secret) — the estate's existing upload posture is signed, and
// the P3 read-first corrected the charter's "unsigned" on exactly this point.
async function mirrorOne(vendorId, sourceUrl) {
  ensureCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const publicId  = `ig-${crypto.randomBytes(6).toString('hex')}`;
  const folder    = `vendor_portfolio/${vendorId}`;

  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha256').update(paramsToSign + API_SECRET).digest('hex');

  const form = new URLSearchParams({
    file: sourceUrl,          // Cloudinary fetches and STORES it — this is the copy
    api_key: API_KEY,
    timestamp: String(timestamp),
    signature,
    folder,
    public_id: publicId,
  });

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!res.ok) return { ok: false, error: `Cloudinary refused the mirror (${res.status}).` };

  const data = await res.json().catch(() => null);
  const url  = data && data.secure_url;
  if (!url) return { ok: false, error: 'Cloudinary returned no secure_url.' };

  // THE NEVER-HOTLINK ASSERTION, at the write path rather than in a comment.
  // If this ever fails we refuse the row outright: a portfolio row pointing at
  // someone else's CDN is the rot the addendum forbids, and half-importing is
  // better than persisting one.
  if (!isEstateUrl(url)) return { ok: false, error: 'Mirror produced a non-estate URL; refused.' };

  return { ok: true, image_url: url };
}

function isEstateUrl(url) {
  return typeof url === 'string' && url.includes(ESTATE_IMAGE_HOST);
}

// ── THE IMPORT ───────────────────────────────────────────────────────────────
// Takes source URLs the vendor picked and lands them as portfolio rows.
// Partial success is a FIRST-CLASS outcome, not an error: nine of twelve landing
// is nine photos the vendor did not have to upload, and copy H9 tells them the
// truth about the other three.
async function importSelected(supabase, vendorId, sourceUrls) {
  if (!Array.isArray(sourceUrls) || sourceUrls.length === 0) {
    return { ok: false, error: 'No photos selected.' };
  }

  // The cap governs the import exactly as it governs an upload. We do not refuse
  // the whole batch for being too large — we take what fits, in the vendor's own
  // pick order, and report the rest. Refusing twelve because two won't fit would
  // be the wall the addendum forbids, wearing a cap's uniform.
  const room = await canAcceptMore(supabase, vendorId, 1);
  if (!room.ok) return { ok: false, error: room.error, cap_reached: true };

  const slots    = Math.min(room.remaining, sourceUrls.length);
  const accepted = sourceUrls.slice(0, slots);
  const noRoom   = sourceUrls.length - slots;

  const imported = [];
  const failed   = [];

  for (const src of accepted) {
    const m = await mirrorOne(vendorId, src);
    if (!m.ok) { failed.push({ source: src, error: m.error }); continue; }

    // FORK 4, FOUNDER-RULED (b): imported rows land APPROVED.
    // His words: 「 b. its an incentive to finish profile fast. 」 The vendor's
    // photos are live on Discover the moment the import finishes, which is the
    // whole promise of "connect IG, pick your 20".
    //
    // THE ASYMMETRY WITH THE MANUAL PATH IS INTENDED, NOT DRIFT. A photo the
    // vendor uploads from their phone still lands 'pending' and waits for the
    // admin queue; the same photo arriving from Instagram is live immediately.
    // Copy B2 and copy H8 say both of those things out loud, and the founder
    // confirmed he wants the difference VISIBLE 「 3. visible 」. Equalizing the
    // two doors needs its own future ruling — nothing here may quietly close it.
    const reg = await registerImage(supabase, vendorId, {
      image_url: m.image_url,
      approval_state: 'approved',
    });
    if (!reg.ok) { failed.push({ source: src, error: reg.error }); continue; }
    imported.push(reg.image);
  }

  return {
    ok: true,
    imported_count: imported.length,
    requested_count: sourceUrls.length,
    failed_count: failed.length,
    no_room_count: noRoom,
    images: imported,
    failures: failed,
  };
}

module.exports = {
  isConfigured,
  listInstagramMedia,
  importSelected,
  mirrorOne,
  isEstateUrl,
  ESTATE_IMAGE_HOST,
  MAX_PORTFOLIO_IMAGES,
};
