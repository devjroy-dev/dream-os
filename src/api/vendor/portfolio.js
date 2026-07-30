// src/api/vendor/portfolio.js
// Portfolio image endpoints.
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { generateUploadParams, registerImage, listImages, updateImage, setHeroImage, reorderImages, deleteImage, canAcceptMore } = require('../../lib/vendor/portfolio');

// POST /upload-url — signed Cloudinary params for direct browser upload
router.post('/upload-url', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const vendor   = req.vendor;
  const filename = ((req.body || {}).filename || 'image').replace(/[^a-zA-Z0-9._-]/g, '-');

  // ── CAP SITE 3 (Fork 6) — refuse BEFORE the bytes move. ────────────────────
  // The chair's word: this is the difference between a cap and a suggestion.
  // Without it a full vendor still uploads to Cloudinary and only learns at
  // register, leaving an asset no row will ever reference and no delete path will
  // ever reach — a paid orphan per attempt, forever.
  const room = await canAcceptMore(req.app.locals.supabase, vendor.id, 1);
  if (!room.ok) return errRes(res, 409, room.error);

  try {
    const params = generateUploadParams(vendor.id, filename);
    return okRes(res, params);
  } catch (e) {
    return errRes(res, 500, e.message);
  }
}));

// POST / — register uploaded image
router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result   = await registerImage(supabase, req.vendor.id, req.body || {});
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { image: result.image });
}));

// GET /:vendorId — list portfolio
router.get('/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const state    = (req.query.state || 'all').trim();
  const result   = await listImages(supabase, req.vendor.id, state);
  if (!result.ok) return errRes(res, 500, result.error);
  return okRes(res, { images: result.images, total: result.total });
}));

// PATCH /reorder — the manager's drag (TDW_07 P3).
// SITED ABOVE `/:imageId` DELIBERATELY: Express matches in declaration order, and
// a literal registered after a parameterised sibling is unreachable — `/reorder`
// would arrive as imageId="reorder" and fail as a not-found image. The route is
// vendor-scoped by resolveVendor() with no paramName, so the body's ids are
// checked against this vendor's own rows inside reorderImages, fail-closed.
router.patch('/reorder', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const ids      = (req.body || {}).ordered_ids;
  const result   = await reorderImages(supabase, req.vendor.id, ids);
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { images: result.images, total: result.total });
}));

// PATCH /:imageId/hero — set as cover image
router.patch('/:imageId/hero', requireAuth, resolveVendor({ paramName: 'imageId', via: 'vendor_portfolio' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result   = await setHeroImage(supabase, req.vendor.id, req.params.imageId);
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { image: result.image });
}));

// PATCH /:imageId — update caption/tags/carousel
router.patch('/:imageId', requireAuth, resolveVendor({ paramName: 'imageId', via: 'vendor_portfolio' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result   = await updateImage(supabase, req.vendor.id, req.params.imageId, req.body || {});
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { image: result.image });
}));

// DELETE /:imageId
router.delete('/:imageId', requireAuth, resolveVendor({ paramName: 'imageId', via: 'vendor_portfolio' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result   = await deleteImage(supabase, req.vendor.id, req.params.imageId);
  if (!result.ok) return errRes(res, 404, result.error);
  return okRes(res, { deleted: true });
}));

module.exports = router;
