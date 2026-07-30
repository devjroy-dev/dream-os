// src/lib/vendor/igImport.js
// TDW_07 P3 — INSTAGRAM IMPORT-AND-MIRROR.
// Governed by docs/specs/TDW_07_IG_IMPORT_ADDENDUM.md (founder-ruled 2026-07-23,
// banked at CE-62) and the fifteenth chair's P3 Fork 4 ruling.
'use strict';

const crypto = require('crypto');
const { canAcceptMore, registerImage, MAX_PORTFOLIO_IMAGES } = require('./portfolio');
// TDW_07 P4a: the wire constants live in igOAuth.js and are IMPORTED, never
// re-declared. GRAPH_HOST in two files would be the F-05.20 class in miniature.
const { GRAPH_HOST, IG_CALLBACK_PATH } = require('./igOAuth');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dccso5ljv';
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

// The estate's own delivery host. THE never-hotlink property is asserted against
// this constant, not against a shape guess: a mirrored row's image_url must be
// served from here or the mirror did not happen.
const ESTATE_IMAGE_HOST = 'res.cloudinary.com';

// ─────────────────────────────────────────────────────────────────────────────
// TDW_07 P4a — THE SEAM IS WIRED. THE UNKNOWNS ARE SETTLED, ONE BY ONE.
//
// P3 left five values DECLARED UNKNOWN rather than guessing them. P4a settles
// them from Meta's own current documentation, derived at authoring:
//   U-1  SETTLED — api.instagram.com/oauth/authorize · scope
//        `instagram_business_basic` ALONE (igOAuth.js, which also carries the
//        chair correction: the charter's host was missing the `api.` subdomain).
//   U-2  SETTLED — POST api.instagram.com/oauth/access_token for the code
//        exchange; GET graph.instagram.com/access_token?grant_type=
//        ig_exchange_token for the 60-day long-lived token.
//   U-3  SETTLED — graph.instagram.com/me/media, `fields` as the constant below,
//        cursor-paged through `paging.next`. Wired at listInstagramMedia().
//   U-4  SETTLED at the packet — `instagram_business_basic` alone is the review
//        ask; the founder files it, and the walkthrough carries the clicks.
//   U-5  STILL SELF-PROVING, DELIBERATELY. Whether Meta's CDN URLs are fetchable
//        server-side by Cloudinary is a NETWORK FACT, and this container cannot
//        witness it. It proves itself at the founder's dev-mode demo: if the
//        mirror works, U-5 is true; if Cloudinary refuses, mirrorOne returns its
//        honest refusal and no row is written. 0102's posture applied to a fact
//        no amount of reading can settle. NOTHING CLAIMS IT UNTIL THE DEMO RUNS.
//
// The P3 header's original text is preserved below, because the reasoning that
// produced a declared unknown is worth more than the unknown was.
//
// ── THE ORIGINAL P3 DECLARATION ─────────────────────────────────────────────
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
// U-3, SETTLED. The fields are a named constant: the `fields` parameter is not
// cosmetic — omit `media_url` and the mirror has nothing to copy, and Meta
// returns a 200 with the field simply absent rather than an error.
//
// `thumbnail_url` is requested because VIDEO items carry no usable `media_url`
// for a still portfolio; the still lives in the thumbnail. `media_type` is what
// lets us choose between them without guessing from the URL's shape.
const IG_MEDIA_FIELDS = 'id,caption,media_type,media_url,thumbnail_url,timestamp';

// Meta's page size. Named because a silent default is a number nobody can find
// when the paging behaviour surprises someone.
const IG_PAGE_SIZE = 25;

// A ceiling on how many pages we will walk. The portfolio cap is 20, so a vendor
// never NEEDS more than one page — this exists so a malformed `paging.next`
// cannot spin the request forever, which is a liveness bug wearing a loop's
// clothes. Named, not magic.
const IG_MAX_PAGES = 8;

/**
 * List the vendor's own Instagram media, cursor-paged.
 *
 * FAIL-LOUD IS PRESERVED FROM P3, and the reason has not changed: an import that
 * silently finds nothing is indistinguishable from a vendor with no posts, and
 * the estate has paid for that class of silence before (F-04.113). A network
 * failure REFUSES; only a genuinely empty account returns an empty list, and the
 * caller can tell the two apart because a refusal carries ok:false.
 */
async function listInstagramMedia(accessToken, opts = {}) {
  if (!accessToken) return { ok: false, error: 'No Instagram connection.' };

  const limit = Number(opts.limit) > 0 ? Number(opts.limit) : IG_PAGE_SIZE;
  const q = new URLSearchParams({
    fields:       IG_MEDIA_FIELDS,
    limit:        String(limit),
    access_token: accessToken,
  });
  let url = `${GRAPH_HOST}/me/media?${q.toString()}`;

  const items = [];
  for (let page = 0; page < IG_MAX_PAGES; page++) {
    const res = await fetch(url);
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const code = body && body.error && (body.error.code || body.error.type);
      // THE SECRETS LAW: the URL carries the access token, so the URL never
      // travels into the error. Status and Meta's own code, nothing more.
      return {
        ok: false,
        error: `Instagram refused the photo list (${res.status}${code ? `, ${code}` : ''}).`,
        http_status: res.status,
      };
    }
    for (const m of (body && Array.isArray(body.data) ? body.data : [])) {
      // VIDEO and CAROUSEL_ALBUM entries can carry a null media_url for our
      // purposes; the still is the thumbnail. An item with neither is skipped
      // rather than mirrored as a broken row.
      const src = m.media_type === 'VIDEO' ? (m.thumbnail_url || null) : (m.media_url || m.thumbnail_url || null);
      if (!src) continue;
      items.push({
        id:         m.id,
        caption:    typeof m.caption === 'string' ? m.caption : null,
        media_type: m.media_type || null,
        source_url: src,
        timestamp:  m.timestamp || null,
      });
    }
    const next = body && body.paging && body.paging.next;
    if (!next) return { ok: true, items, pages: page + 1, truncated: false };
    url = next;
  }
  // Ceiling hit. TRUNCATION IS ANNOUNCED, never silent — the same law the batch
  // upload learned at P3 (F2-3): take what fits and SAY SO.
  return { ok: true, items, pages: IG_MAX_PAGES, truncated: true };
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
//
// ── TDW_07 P4a · F3's RULED ADDITION: THE PATH ASSERTION ────────────────────
// Presence of the three variables is NOT sufficient. Meta matches redirect_uri
// byte-for-byte against the App Dashboard registration, so a redirect pointing
// anywhere but this estate's canonical callback path is a config that CANNOT
// work — and arming the entry on it ships the vendor a button whose only
// possible outcome is Instagram's own error page. That is F-07.13's dead control
// with an extra step. The chair ruled the dead-control law applies to
// configuration too: mismatch ⇒ false, and say so loudly.
let _pathWarnedFor = null;
function redirectMatchesCanonicalPath(uri) {
  if (typeof uri !== 'string' || uri === '') return false;
  let parsed;
  // A URL that will not parse cannot be byte-matched by Meta either.
  try { parsed = new URL(uri); } catch { return false; }
  // Compared on the PARSED PATHNAME, not with endsWith on the raw string: a raw
  // suffix test passes on a query string that merely ends in the right letters,
  // and fails on a legitimate trailing '?'. The pathname is the thing Meta
  // matches, so the pathname is the thing asserted.
  return parsed.pathname === IG_CALLBACK_PATH;
}

function isConfigured() {
  const haveKeys = Boolean(process.env.IG_APP_ID && process.env.IG_APP_SECRET);
  const uri      = process.env.IG_REDIRECT_URI || '';
  if (!haveKeys || !uri) return false;

  if (!redirectMatchesCanonicalPath(uri)) {
    // Warn ONCE per distinct value. getDiscoverStatus calls isConfigured on
    // every status read, and a per-request warning would bury itself. The
    // secrets law holds: the redirect URI is not a secret and travels; the app
    // id and secret do not appear.
    if (_pathWarnedFor !== uri) {
      _pathWarnedFor = uri;
      console.warn(
        `[igImport] IG_REDIRECT_URI does not end at the canonical callback path. ` +
        `Expected pathname "${IG_CALLBACK_PATH}", got "${uri}". ` +
        `Instagram matches this value byte-for-byte, so the connect flow would fail ` +
        `silently — the entry stays DARK until this is corrected.`
      );
    }
    return false;
  }
  return true;
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
  redirectMatchesCanonicalPath,
  listInstagramMedia,
  IG_MEDIA_FIELDS,
  IG_PAGE_SIZE,
  IG_MAX_PAGES,
  importSelected,
  mirrorOne,
  isEstateUrl,
  ESTATE_IMAGE_HOST,
  MAX_PORTFOLIO_IMAGES,
};
