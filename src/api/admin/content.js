// src/api/admin/content.js
// Admin content — landing_slides + exploring_photos CRUD + upload.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { generateUploadParams, deleteFromCloudinary } = require('../../lib/admin/cloudinary');

function makeContentRouter(tableName, folder) {
  const r = express.Router();

  r.get('/', requireAdmin, asyncHandler(async (req, res) => {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from(tableName)
      .select('id, image_url, cloudinary_public_id, caption, display_order, active, created_at')
      .order('display_order', { ascending: true });
    if (error) return errRes(res, 500, error.message);
    return okRes(res, { photos: data || [], total: (data || []).length });
  }));

  r.post('/upload-url', requireAdmin, asyncHandler(async (req, res) => {
    const { filename } = req.body;
    if (!filename) return errRes(res, 400, 'filename is required.');
    return okRes(res, generateUploadParams(folder, filename));
  }));

  r.post('/', requireAdmin, asyncHandler(async (req, res) => {
    const supabase = req.app.locals.supabase;
    const { image_url, cloudinary_public_id, caption, display_order } = req.body;
    if (!image_url) return errRes(res, 400, 'image_url is required.');
    const { data, error } = await supabase.from(tableName)
      .insert({ image_url, cloudinary_public_id: cloudinary_public_id || null, caption: caption || null, display_order: display_order ?? 0, active: true })
      .select('id, image_url, cloudinary_public_id, caption, display_order, active, created_at')
      .single();
    if (error) return errRes(res, 500, error.message);
    return okRes(res, { photo: data });
  }));

  r.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
    const supabase = req.app.locals.supabase;
    const { caption, active, display_order } = req.body;
    const patch = {};
    if (caption       !== undefined) patch.caption       = caption;
    if (active        !== undefined) patch.active        = active;
    if (display_order !== undefined) patch.display_order = display_order;
    if (!Object.keys(patch).length) return errRes(res, 400, 'No fields to update.');
    const { error } = await supabase.from(tableName).update(patch).eq('id', req.params.id);
    if (error) return errRes(res, 500, error.message);
    return okRes(res, { updated: true });
  }));

  r.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
    const supabase = req.app.locals.supabase;
    const { data: row } = await supabase.from(tableName).select('cloudinary_public_id').eq('id', req.params.id).single();
    if (row?.cloudinary_public_id) await deleteFromCloudinary(row.cloudinary_public_id);
    const { error } = await supabase.from(tableName).delete().eq('id', req.params.id);
    if (error) return errRes(res, 500, error.message);
    return okRes(res, { deleted: true });
  }));

  return r;
}

router.use('/landing-photos',   makeContentRouter('landing_slides',   'landing_photos'));
router.use('/exploring-photos', makeContentRouter('exploring_photos', 'exploring_photos'));

module.exports = router;
