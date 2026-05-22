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
const { generateUploadParams, deleteFromCloudinary } = require('../../lib/vendor/portfolio');

// ── GET /:vendorId/portfolio ──────────────────────────────────────────────────
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const vendorId  = req.params.vendorId;

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('id', vendorId).maybeSingle();
  if (!vendor) return errRes(res, 404, 'Vendor not found.');

  const { data, error } = await supabase
    .from('vendor_portfolio')
    .select('id, image_url, caption, aesthetic_tags, is_hero, in_carousel, approval_state, created_at')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { photos: data || [] });
}));

// ── POST /:vendorId/portfolio/upload-url ──────────────────────────────────────
router.post('/upload-url', requireAdmin, asyncHandler(async (req, res) => {
  const vendorId = req.params.vendorId;
  const filename = req.body.filename || 'photo.jpg';

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

  // If setting as hero, unset existing hero first
  if (is_hero) {
    await supabase.from('vendor_portfolio')
      .update({ is_hero: false }).eq('vendor_id', vendorId);
  }

  const { data, error } = await supabase
    .from('vendor_portfolio')
    .insert({
      vendor_id:      vendorId,
      image_url,
      caption:        caption || null,
      aesthetic_tags: aesthetic_tags || [],
      is_hero:        is_hero || false,
      in_carousel:    true,
      approval_state: 'approved',   // admin uploads skip the queue
      reviewed_by_admin: 'admin',
      reviewed_at:    new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return errRes(res, 500, error.message);
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
  return okRes(res, { deleted: true });
}));

module.exports = router;
