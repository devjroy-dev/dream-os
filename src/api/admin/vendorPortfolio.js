// src/api/admin/vendorPortfolio.js
// Admin-side vendor portfolio management.
// Allows admin to upload photos directly to any vendor's portfolio (a person placed them, so they are 'passed').
//
// GET  /api/v2/admin/vendors/:vendorId/portfolio       — list photos (with held and hidden-from-Discover)
// POST /api/v2/admin/vendors/:vendorId/portfolio/upload-url — get signed Cloudinary params
// POST /api/v2/admin/vendors/:vendorId/portfolio       — register uploaded photo
// CE-47 WEB-4 cut 30 (R-47.2, the founder's rule of 8 October 2026): the DELETE door is GONE. The admin's only power
// over a picture is "hide from Discover"; a removal for a legal reason goes through admin/photos.js /:id/legal-removal,
// which is logged and tells the vendor.
'use strict';

const express      = require('express');
const router       = express.Router({ mergeParams: true });
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
// F-07.12 (TDW_07 P3): this import line is UNCHANGED — it was always correct.
// What was wrong was the other side: `deleteFromCloudinary` was not on
// src/lib/vendor/portfolio.js's export list, so this destructure yielded
// `undefined`, the call at the DELETE handler threw, and the row survived the
// 500. The cure is that file's export, not a swap to src/lib/admin/cloudinary.js
// (which takes a public_id this table does not store). Chair correction №13.
const { generateUploadParams, deleteFromCloudinary, canAcceptMore, currentOrder, writeOrder } = require('../../lib/vendor/portfolio');

// ── GET /:vendorId/portfolio ──────────────────────────────────────────────────
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const vendorId  = req.params.vendorId;

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('id', vendorId).maybeSingle();
  if (!vendor) return errRes(res, 404, 'Vendor not found.');

  const { data, error } = await supabase
    .from('vendor_portfolio')
    .select('id, image_url, caption, aesthetic_tags, is_hero, in_carousel, safety_state, discover_hidden_at, created_at, position')
    .eq('vendor_id', vendorId)
    .order('position',   { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return errRes(res, 500, error.message);
  // R-47.2: the state as the admin reads it: held (by the safety check) and hidden from Discover
  return okRes(res, { photos: (data || []).map((p) => ({ ...p, held: p.safety_state === 'held', hidden_from_discover: Boolean(p.discover_hidden_at) })) });
}));

// ── POST /:vendorId/portfolio/upload-url ──────────────────────────────────────
router.post('/upload-url', requireAdmin, asyncHandler(async (req, res) => {
  const vendorId = req.params.vendorId;
  const filename = req.body.filename || 'photo.jpg';

  // CAP SITE 3, admin half — refuse before the bytes move, same reason and the
  // same sentence as the vendor door (the constant and the copy have one home).
  const room = await canAcceptMore(req.app.locals.supabase, vendorId, 1);
  if (!room.ok) return errRes(res, 409, room.error);

  const { upload_url, params } = generateUploadParams(vendorId, filename);
  return okRes(res, { upload_url, params });
}));

// ── POST /:vendorId/portfolio ─────────────────────────────────────────────────
// Register a photo. Admin uploads are auto-approved.
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendorId = req.params.vendorId;
  const { image_url, caption, aesthetic_tags, is_hero } = req.body;

  if (!image_url) return errRes(res, 400, 'image_url is required.');

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('id', vendorId).maybeSingle();
  if (!vendor) return errRes(res, 404, 'Vendor not found.');

  // CAP SITE 2 (Fork 6) — the admin register door. The admin path is capped for
  // the same reason the vendor path is: the cap is a property of the portfolio,
  // not a property of who is typing.
  const room = await canAcceptMore(supabase, vendorId, 1);
  if (!room.ok) return errRes(res, 409, room.error);

  const { data, error } = await supabase
    .from('vendor_portfolio')
    .insert({
      vendor_id:      vendorId,
      image_url,
      caption:        caption || null,
      aesthetic_tags: aesthetic_tags || [],
      is_hero:        false,        // written by writeOrder alone — the one hand
      in_carousel:    true,
      safety_state:   'passed',     // R-47.2: a person placed it (the chair's ruling on (d) item 2)
      position:       room.count,   // append, as the vendor door does
    })
    .select()
    .single();

  if (error) return errRes(res, 500, error.message);

  // TDW_07 P3 · Fork 2(b): an admin setting the cover routes through the SAME
  // one hand as the vendor's star, so position 0 and is_hero cannot disagree
  // just because the write came from the cockpit.
  if (is_hero) {
    const cur = await currentOrder(supabase, vendorId);
    if (cur.ok) await writeOrder(supabase, vendorId, [data.id, ...cur.ids.filter(id => id !== data.id)]);
  }
  return okRes(res, { photo: data });
}));

// ── DELETE /:vendorId/portfolio/:imageId ──────────────────────────────────────
// R-47.2: no DELETE door here (see the header).

module.exports = router;
