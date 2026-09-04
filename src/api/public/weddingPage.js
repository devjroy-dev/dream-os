// src/api/public/weddingPage.js
// BLOCK 19 · G1.1 — THE PUBLIC WEDDING PAGE DOOR.
// Mounted at /api/v2/public/wedding by src/api/router.js.
//
//   GET /:code/:slug   — unauthenticated; the page a guest opens from a phone.
//
// ═══════════════════════════════════════════════════════════════════════════
// THIS DOOR IS A MIRROR OF `src/api/public/vendorCard.js:296`, DELIBERATELY
// ═══════════════════════════════════════════════════════════════════════════
// R-G11.5: the same miss law. Three properties are carried across, and each one
// is carried because that file already paid for it:
//
//  1. ONE INDISTINGUISHABLE MISS. Absent ≡ unpublished ≡ consent-off ≡ the
//     vendor is inactive or paused. All of them return `notFound(res)` — the
//     same status, the same body, the same bytes. `vendorCard.js`'s own comment
//     is the reasoning: both conditions are checked HERE and not in the query,
//     "so the reason for a miss never differs by code path either."
//
//  2. THE RETURN COMES BEFORE THE ASSET READ. An unpublished wedding's photos
//     are not merely withheld — they are NEVER ASKED FOR. Written as a filter on
//     the photo query, that ruling would survive only as long as nobody moved
//     the filter; written as an early return, it cannot be moved without being
//     deleted.
//
//  3. NO STATUS CODE IS VISIBLE TO A HUMAN. The pwa leaf renders one sentence
//     on the same ground as a real page. `404` tells a guest nothing and tells a
//     curious stranger that the slug space is worth probing.
//
// ⚠ AND ONE PROPERTY OF ITS OWN: NO PHONE IS ON THIS WIRE (R-G11.6). Not the
// vendor's — `public.vendors` has no phone column and `vendorCard.js` already
// refuses to join `users.phone` onto an unauthenticated URL — and not a
// credit's. `wedding_credits.phone` is the reach for an invite and it is the
// one column a guest must never see. The shape is assembled by `publicRoll` in
// the lib, field by field from an explicit list, with nothing spread.
'use strict';

const express = require('express');
const router  = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const W = require('../../lib/vendor/weddings');

// Byte-identical to `vendorCard.js:213`. One miss, one body, no reason leaked.
function notFound(res) {
  return res.status(404).json({ ok: false, error: 'Not found.' });
}

router.get('/:code/:slug', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const code = String(req.params.code || '').trim();
  const slug = String(req.params.slug || '').trim().toLowerCase();
  if (!code || !slug) return notFound(res);

  try {
    // `routing_handle` is minted UPPERCASE and the public URL is lowercase, so
    // the code is upper-cased for the lookup — the same reasoning, and the same
    // one canonical form, as the card door.
    const { data: owner, error: oErr } = await supabase
      .from('vendors')
      .select('id, business_name, routing_handle, status, discover_paused')
      .eq('routing_handle', code.toUpperCase())
      .maybeSingle();
    if (oErr) throw oErr;
    if (!owner) return notFound(res);

    // THE OWNER'S OWN SWITCHES KILL THE PAGE FIRST. A paused photographer's
    // wedding pages go with her card; the page is her surface and it does not
    // outlive her own withdrawal.
    if (owner.status !== 'active' || owner.discover_paused === true) return notFound(res);

    // ── THE THREE MISSES, ONE BRANCH ──────────────────────────────────────────
    // Absent, unpublished, and consent-off are checked in JS off one row rather
    // than expressed as three query predicates, so a future reader can SEE that
    // they share an outcome. The partial index `idx_weddings_live` makes the
    // narrow read cheap; correctness does not depend on it.
    const { data: wedding, error: wErr } = await supabase
      .from('weddings')
      .select(W.WEDDING_COLS)
      .eq('owner_vendor_id', owner.id)
      .eq('slug', slug)
      .maybeSingle();
    if (wErr) throw wErr;
    if (!wedding) return notFound(res);
    if (wedding.visibility !== 'published') return notFound(res);
    if (wedding.couple_consent !== true) return notFound(res);

    // ⚠ EVERYTHING BELOW THIS LINE RUNS ONLY FOR A LIVE PAGE. The credits and
    // the photographs are not read until the three gates above have passed.
    const [credits, photos] = await Promise.all([
      W.creditsFor(supabase, wedding.id),
      W.photosFor(supabase, wedding.id),
    ]);

    // The season needs the event's date, and the event may be gone: `event_id`
    // is `ON DELETE SET NULL`, so a deleted calendar row leaves a published page
    // standing with no date behind it. The meta line then carries venue and city
    // and no season, which is the honest render — never a guessed date.
    let eventDate = null;
    if (wedding.event_id) {
      const { data: ev, error: eErr } = await supabase
        .from('events')
        .select('event_date')
        .eq('id', wedding.event_id)
        .maybeSingle();
      if (eErr) throw eErr;
      eventDate = ev ? ev.event_date : null;
    }

    // Only CLAIMED credits carry a vendor to resolve, and only active, unpaused
    // vendors become links — printing an address that would itself 404 is an
    // invitation to a dead page.
    const vendorIds = [...new Set(credits.filter((c) => c.vendor_id).map((c) => c.vendor_id))];
    let vendorsById = {};
    if (vendorIds.length) {
      const { data: vs, error: vErr } = await supabase
        .from('vendors')
        .select('id, business_name, routing_handle, status, discover_paused')
        .in('id', vendorIds);
      if (vErr) throw vErr;
      vendorsById = (vs || []).reduce((acc, v) => { acc[v.id] = v; return acc; }, {});
    }

    return res.status(200).json({
      ok: true,
      wedding: W.publicWedding(wedding, eventDate),
      owner: {
        business_name: owner.business_name,
        handle: String(owner.routing_handle || '').toLowerCase(),
      },
      roll:   W.publicRoll(credits, vendorsById),
      photos: photos.map((p) => ({ url: p.url, position: p.position })),
    });
  } catch (e) {
    // A thrown error must not become a DIFFERENT observable answer from a miss
    // for a stranger probing slugs; it is logged as a 500 because an operator
    // needs to see it, and it carries no detail about what was or was not there.
    req.app.locals.logger?.error?.('weddingPage', e);
    return res.status(500).json({ ok: false, error: 'Something went wrong.' });
  }
}));

module.exports = router;
