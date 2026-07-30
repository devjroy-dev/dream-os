// src/api/admin/vendorPortfolio.js
// Admin-side vendor portfolio management.
// Allows admin to upload photos directly to any vendor's portfolio,
// bypassing the approval queue (admin uploads are auto-approved).
//
// GET  /api/v2/admin/vendors/:vendorId/portfolio       — list photos
// POST /api/v2/admin/vendors/:vendorId/portfolio/upload-url — get signed Cloudinary params
// POST /api/v2/admin/vendors/:vendorId/portfolio       — register uploaded photo
// DELETE /api/v2/admin/vendors/:vendorId/portfolio/:imageId — delete photo
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
    .select('id, image_url, caption, aesthetic_tags, is_hero, in_carousel, approval_state, created_at, position')
    .eq('vendor_id', vendorId)
    .order('position',   { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { photos: data || [] });
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
      approval_state: 'approved',   // admin uploads skip the queue
      reviewed_by_admin: 'admin',
      reviewed_at:    new Date().toISOString(),
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
router.delete('/:imageId', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { vendorId, imageId } = req.params;

  const { data: photo } = await supabase
    .from('vendor_portfolio')
    .select('id, image_url, vendor_id')
    .eq('id', imageId)
    .eq('vendor_id', vendorId)
    .maybeSingle();

  if (!photo) return errRes(res, 404, 'Photo not found.');

  await deleteFromCloudinary(photo.image_url);

  const { error } = await supabase
    .from('vendor_portfolio').delete().eq('id', imageId);

  if (error) return errRes(res, 500, error.message);

  // Close the ordering gap, exactly as the vendor delete path does — contiguity
  // is an invariant, and the admin cockpit must not be the door that breaks it.
  const cur = await currentOrder(supabase, vendorId);
  if (cur.ok && cur.ids.length > 0) await writeOrder(supabase, vendorId, cur.ids);
  return okRes(res, { deleted: true });
}));

module.exports = router;
