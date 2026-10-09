// src/lib/vendor/portfolio.js
// Portfolio image business logic. Cloudinary signing + Supabase CRUD.
'use strict';

const crypto = require('crypto');
const { signUpload, uploadUrl, nowTimestamp } = require('../cloudinarySign');
// CE-47 WEB-4 cut 30 (R-47.2): a picture's state is read and written through these two, nowhere else.
const PR = require('./pictureRules');
const safety = require('./safetyCheck');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dccso5ljv';
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

// ── TDW_07 P3 · D-2's CAP, BORN HERE (Fork 6 as ruled) ───────────────────────
// The cap is a BIRTH, not a raise: at the P3 read-first no cap literal existed in
// either repo (the only 20 was src/api/admin/musePool.js:13's MAX_ACTIVE, a
// different surface). This is the ONE constant. It moves four consumers:
//   1. registerImage below — the vendor register door
//   2. src/api/admin/vendorPortfolio.js — the admin register door
//   3. both /upload-url routes, through canAcceptMore() — the doors that mint
//      Cloudinary signing params. Site 3 is the difference between a cap and a
//      suggestion: without it a full vendor still pushes bytes to Cloudinary that
//      no row will ever reference, and the estate pays storage for orphans forever.
//   4. getDiscoverStatus's `max_portfolio_images` (src/lib/vendor/discover.js) —
//      the surface reads the server's number, exactly as P2 did for the floor, so
//      no second copy of "20" exists anywhere in digits or in words.
const MAX_PORTFOLIO_IMAGES = 20;

function ensureCloudinary() {
  if (!API_KEY || !API_SECRET) throw new Error('CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not set.');
}

// Generate signed upload params for direct browser → Cloudinary upload.
// ── R-G11.22 · THE SIGNING MOVED OUT; THE SIGNATURE DID NOT ─────────────────
// F-40.34: the second of three byte-identical copies. The body delegates to
// `src/lib/cloudinarySign.js`; the arguments, the return shape and the name are
// untouched, so both call sites — `src/api/vendor/portfolio.js:27` and
// `src/api/admin/vendorPortfolio.js:55` — are byte-unchanged.
//
// THE FOLDER STAYS THE CALLER'S. `vendor_portfolio/${vendorId}` is this
// module's policy and it is stated HERE, not in the signer: the signer holds
// the one fact that is the same everywhere (how to sign) and each caller keeps
// the one fact that is its own (where its bytes live). The wedding plane's
// `weddings/${vendorId}/${weddingId}` is the same arrangement seen from the
// other side.
function generateUploadParams(vendorId, filename) {
  const publicId = `${filename.replace(/\.[^.]+$/, '')}-${crypto.randomBytes(4).toString('hex')}`;
  const folder   = `vendor_portfolio/${vendorId}`;
  return {
    upload_url: uploadUrl(),
    params: signUpload({ folder, publicId, timestamp: nowTimestamp() }),
  };
}

// Best-effort delete from Cloudinary.
//
// ── F-07.12 (TDW_07 P3): THIS FUNCTION IS NOW EXPORTED. ──────────────────────
// It was not, and src/api/admin/vendorPortfolio.js:17 destructured it from here
// anyway — so `deleteFromCloudinary` was `undefined` on the admin path, the call
// threw TypeError, the handler 500'd, AND THE ROW SURVIVED (the delete sits
// downstream of the throw). Admin photo delete had never worked.
//
// The cure is the export, deliberately NOT an import swap to
// src/lib/admin/cloudinary.js as the five sibling routers do. Those routers can
// use that helper because it takes a PUBLIC ID and their tables store one;
// vendor_portfolio has no cloudinary_public_id column (witnessed: 13 columns,
// docs/db/PUBLIC_SCHEMA.md). Feeding it a URL would have turned a loud 500 into a
// silent permanent orphan — F-04.113's class, the very class F-07.14 below closes.
// Chair correction №13. Both delete paths now run this one function.
async function deleteFromCloudinary(imageUrl) {
  try {
    // ORDER IS LOAD-BEARING, and the bench caught it: the parse check runs BEFORE
    // ensureCloudinary(). Sited after it, the credential throw is swallowed by
    // this function's own bare catch and F-07.14's warning never fires on any
    // machine missing the keys — the silent skip cured into a silent skip one
    // line lower. A url either parses or it does not, and that fact does not
    // depend on whether the estate holds Cloudinary credentials.
    const match = imageUrl && imageUrl.match(/\/v\d+\/(.+)\.[a-z]+$/i);
    if (!match) {
      // ── F-07.14 (TDW_07 P3): THE SILENT SKIP GETS A VOICE. ─────────────────
      // This return used to be bare. A stored URL with no /v<digits>/ version
      // segment orphaned its Cloudinary asset and said nothing — the row went,
      // the bytes stayed, forever, invisibly. It still returns (deleting the row
      // matters more than reclaiming the asset) but it no longer returns quietly.
      console.warn('[portfolio] cloudinary destroy SKIPPED — url does not parse to a public_id:', imageUrl);
      return;
    }
    ensureCloudinary();
    const publicId  = match[1];
    const timestamp = Math.round(Date.now() / 1000);
    const signature = crypto.createHash('sha256')
      .update(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`)
      .digest('hex');
    await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id: publicId, api_key: API_KEY, timestamp, signature }),
    });
  } catch { /* best effort */ }
}

// ── THE CAP'S SHARED READ ────────────────────────────────────────────────────
// One count, three doors. `ok:false` carries the founder-vetoed refusal (copy A3),
// which is therefore the same sentence at every door rather than three drafts.
async function canAcceptMore(supabase, vendorId, adding = 1) {
  const { count, error } = await supabase
    .from('vendor_portfolio')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendorId);
  if (error) return { ok: false, count: null, remaining: null, error: error.message };

  const held      = Number(count || 0);
  const remaining = Math.max(0, MAX_PORTFOLIO_IMAGES - held);
  if (held + adding > MAX_PORTFOLIO_IMAGES) {
    return {
      ok: false, count: held, remaining, cap_reached: true,
      error: `Your portfolio holds ${MAX_PORTFOLIO_IMAGES} photos, the maximum. Remove one to add another.`,
    };
  }
  return { ok: true, count: held, remaining };
}

// ── ORDERING: THE ONE HAND (TDW_07 P3 · Fork 1(a) + Fork 2(b)) ───────────────
// `position` (0102) is the single ordering authority. writeOrder() is the ONLY
// function in the estate that assigns it, and it is where Fork 2(b) lives:
// whichever row lands at position 0 is the COVER, and this function sets is_hero
// on exactly that row and clears it from every other row of the vendor. The star
// and a drag both route through here, so the cover badge can never sit on a photo
// that is not first — divergence is impossible by construction rather than by two
// call sites agreeing to behave.
//
// DECLARED CONSEQUENCE, disclosed not smuggled: a vendor holding no is_hero row
// today (the Swati fixture — 2 photos, 0 hero rows) GAINS the hero term (0.135)
// the first time they order their photos. That is honest — they now have a stated
// cover — and it is bounded: it fires on an ordering act, never on an upload, so
// the hero term does NOT collapse into "has any photo". That collapse was Fork
// 2(a)'s price and the chair's stated reason for refusing it; this is not it.
async function writeOrder(supabase, vendorId, orderedIds) {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase.from('vendor_portfolio')
      .update({ position: i, is_hero: i === 0 })
      .eq('id', orderedIds[i]).eq('vendor_id', vendorId);
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}

// The vendor's ids in current display order. One read, reused by reorder + cover.
async function currentOrder(supabase, vendorId) {
  const { data, error } = await supabase.from('vendor_portfolio')
    .select('id')
    .eq('vendor_id', vendorId)
    .order('position',   { ascending: true })
    .order('created_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, ids: (data || []).map(r => r.id) };
}

// Register a newly uploaded image.
// CE-47 WEB-4 cut 30 (R-47.2; the chair's ruling 5 of 8 October): the body carries ONLY the picture's own fields
// (image_url, caption, aesthetic_tags, is_hero, in_carousel). Its source and its state are NEVER taken from the body:
// `source` is set by the path the picture came by ('upload' unless the Instagram import says so through `internal`,
// which no door can reach), and its state by Google's safety check, run here before the answer (pictureRules.js).
async function registerImage(supabase, vendorId, body, internal) {
  const { image_url, caption, aesthetic_tags, is_hero, in_carousel } = body || {};
  if (!image_url) return { ok: false, error: 'image_url is required.' };
  const it = internal || {};
  const source = it.source === 'instagram' ? 'instagram' : 'upload';

  // Cap site 1 — the vendor register door.
  const room = await canAcceptMore(supabase, vendorId, 1);
  if (!room.ok) return { ok: false, error: room.error, cap_reached: room.cap_reached === true };

  // TDW_07 P3: new photos APPEND. Before 0102 the newest row sorted first, so an
  // upload silently became the cover; with an explicit order that would reshuffle
  // a curated grid on every upload. Appending is the behaviour change 0102's
  // invisible backfill was designed to make safe — nothing moves at apply, and
  // from then on the vendor's order is the vendor's.
  const position = room.count;

  // R-47.2 (b): the safety check, inside the door, before the answer (4 seconds at most). The Instagram import checks
  // in batches of 16 and hands each picture's answer in `internal.safety`. A picture it cannot check is 'unchecked':
  // live on her own pages, not on Discover, checked again by the sweep.
  const checked = it.safety || (await safety.check([image_url], it.safetyDeps))[0];
  const f = safety.fieldsOf(checked) || { safety_state: PR.SAFETY.UNCHECKED };

  const { data: image, error } = await supabase.from('vendor_portfolio').insert({
    vendor_id:     vendorId,
    image_url,
    caption:       caption || null,
    aesthetic_tags: aesthetic_tags || [],
    is_hero:       false,   // is_hero is written by writeOrder alone — see above
    in_carousel:   in_carousel !== false,
    // R-47.2 closed the old asymmetry (Instagram live on arrival, the phone in review): every picture is live on
    // her own pages at once, whichever way it came. approval_state is no longer written (history, read by nothing).
    ...f,
    source,
    position,
  }).select(PR.VENDOR_PORTFOLIO_COLS).single();

  if (error) return { ok: false, error: error.message };

  // An explicit hero on the register call still works — it routes through the one hand.
  if (is_hero === true) {
    const cur = await currentOrder(supabase, vendorId);
    if (cur.ok) await writeOrder(supabase, vendorId, [image.id, ...cur.ids.filter(id => id !== image.id)]);
  }
  return { ok: true, image: PR.vendorPicture(image) };
}

// List portfolio images.
// CE-47 WEB-4 cut 30 (R-47.2): her list carries each picture's state in her words (pictureRules.vendorPicture):
// shown_on_her_pages, shown_on_discover and one `notice` line, never approval_state or the old rejection reason.
// `state` filters: 'all', 'held', 'hidden' (hidden from Discover), 'shown'.
async function listImages(supabase, vendorId, state = 'all') {
  let q = supabase.from('vendor_portfolio')
    .select(PR.VENDOR_PORTFOLIO_COLS)
    .eq('vendor_id', vendorId)
    // TDW_07 P3: position is the order. created_at is the deterministic tie-break
    // for rows that share one (a hand-written row, a race) — never the authority.
    .order('position',   { ascending: true })
    .order('created_at', { ascending: false });

  if (state === 'held') q = q.eq('safety_state', PR.SAFETY.HELD);
  else if (state === 'hidden') q = q.not('discover_hidden_at', 'is', null);
  else if (state === 'shown') q = PR.herPagesFilter(q);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  const images = (data || []).map(PR.vendorPicture);
  return { ok: true, images, total: images.length };
}

/** R-47.2 (e): what she is told on her portfolio (a removal for a legal reason), newest first, the unseen ones. */
async function listNotices(supabase, vendorId) {
  const { data, error } = await supabase.from('picture_notices').select('id, line, created_at')
    .eq('vendor_id', vendorId).is('seen_at', null).order('created_at', { ascending: false }).limit(20);
  return error ? [] : (data || []);
}
async function markNoticeSeen(supabase, vendorId, noticeId) {
  const { data, error } = await supabase.from('picture_notices').update({ seen_at: new Date().toISOString() })
    .eq('id', noticeId).eq('vendor_id', vendorId).is('seen_at', null).select('id');
  return !error && Array.isArray(data) && data.length > 0;
}

// Update image metadata (caption, tags, hero, carousel). Its state is never changed here.
async function updateImage(supabase, vendorId, imageId, body) {
  const allowed = {};
  if (body.caption      !== undefined) allowed.caption       = body.caption;
  if (body.aesthetic_tags !== undefined) allowed.aesthetic_tags = body.aesthetic_tags;
  // F-07.13: in_carousel is accepted here as it always was (the admin surface
  // writes it), but NO query in either repo filters on it — three writers, zero
  // filter-readers. The P3 manager deliberately does NOT surface it: showing a
  // vendor a control that does nothing is the same defect at a bigger audience.
  // Retire-or-wire is its own founder-sequenced micro.
  if (body.in_carousel  !== undefined) allowed.in_carousel   = body.in_carousel;
  if (Object.keys(allowed).length === 0) return { ok: false, error: 'No editable fields provided.' };

  const { data, error } = await supabase.from('vendor_portfolio')
    .update(allowed)
    .eq('id', imageId).eq('vendor_id', vendorId)
    .select(PR.VENDOR_PORTFOLIO_COLS).single();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'Image not found.' };
  return { ok: true, image: PR.vendorPicture(data) };
}

// Set as cover — moves the row to position 0 through the one hand, which also
// sets is_hero there and clears it everywhere else. The exported name is kept so
// its four existing callers are untouched.
async function setHeroImage(supabase, vendorId, imageId) {
  const { data: owned } = await supabase.from('vendor_portfolio')
    .select('id').eq('id', imageId).eq('vendor_id', vendorId).maybeSingle();
  if (!owned) return { ok: false, error: 'Image not found.' };

  const cur = await currentOrder(supabase, vendorId);
  if (!cur.ok) return { ok: false, error: cur.error };

  const wrote = await writeOrder(supabase, vendorId, [imageId, ...cur.ids.filter(id => id !== imageId)]);
  if (!wrote.ok) return { ok: false, error: wrote.error };

  const { data } = await supabase.from('vendor_portfolio')
    .select(PR.VENDOR_PORTFOLIO_COLS)
    .eq('id', imageId).eq('vendor_id', vendorId).maybeSingle();
  return { ok: true, image: PR.vendorPicture(data) };
}

// Reorder — the manager's drag. Takes the vendor's FULL id list in the order they
// want it. Fail-closed: an id that is not theirs, a duplicate, or an incomplete
// set is refused outright rather than partially applied, because a half-written
// permutation leaves the grid in a state no vendor asked for.
async function reorderImages(supabase, vendorId, orderedIds) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { ok: false, error: 'ordered_ids must be a non-empty array.' };
  }
  const cur = await currentOrder(supabase, vendorId);
  if (!cur.ok) return { ok: false, error: cur.error };

  const mine = new Set(cur.ids);
  if (new Set(orderedIds).size !== orderedIds.length) {
    return { ok: false, error: 'ordered_ids contains duplicates.' };
  }
  if (orderedIds.length !== cur.ids.length || orderedIds.some(id => !mine.has(id))) {
    return { ok: false, error: 'ordered_ids must list every photo in this portfolio exactly once.' };
  }

  const wrote = await writeOrder(supabase, vendorId, orderedIds);
  if (!wrote.ok) return { ok: false, error: wrote.error };
  return await listImages(supabase, vendorId, 'all');
}

// Delete image — removes from DB and best-effort from Cloudinary.
async function deleteImage(supabase, vendorId, imageId) {
  const { data: img } = await supabase.from('vendor_portfolio')
    .select('image_url').eq('id', imageId).eq('vendor_id', vendorId).maybeSingle();
  if (!img) return { ok: false, error: 'Image not found.' };

  const { error } = await supabase.from('vendor_portfolio')
    .delete().eq('id', imageId).eq('vendor_id', vendorId);
  if (error) return { ok: false, error: error.message };

  await deleteFromCloudinary(img.image_url);

  // Close the gap the delete left. 0102's readback C proves 0..n-1 contiguity at
  // apply; contiguity is an INVARIANT, not a one-time migration fact, and delete
  // is the operation that would break it. Re-writing the surviving order also
  // re-seats the cover when the deleted row was position 0.
  const cur = await currentOrder(supabase, vendorId);
  if (cur.ok && cur.ids.length > 0) await writeOrder(supabase, vendorId, cur.ids);
  return { ok: true };
}

// Portfolio summary counts — used by discover request validation.
// CE-47 WEB-4 cut 30 (R-47.2): `approved` now counts the pictures DISCOVER shows (passed, not hidden), the number the
// admin's Discover screen has always shown beside the total; `held` and `hidden` replace pending and rejected.
async function portfolioSummary(supabase, vendorId) {
  const { data } = await supabase.from('vendor_portfolio')
    .select('safety_state, discover_hidden_at').eq('vendor_id', vendorId);
  const rows = data || [];
  return {
    total:    rows.length,
    approved: rows.filter(PR.onDiscover).length,
    held:     rows.filter(r => r.safety_state === PR.SAFETY.HELD).length,
    hidden:   rows.filter(r => Boolean(r.discover_hidden_at)).length,
  };
}

module.exports = {
  generateUploadParams,
  deleteFromCloudinary,   // F-07.12 — the export that was missing
  registerImage,
  listImages,
  listNotices,
  markNoticeSeen,
  updateImage,
  setHeroImage,
  reorderImages,
  deleteImage,
  portfolioSummary,
  canAcceptMore,
  currentOrder,
  writeOrder,
  MAX_PORTFOLIO_IMAGES,
};
