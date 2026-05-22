// src/api/admin/surprisePool.js
// Admin surprise pool — taste_quiz_images. Up to 100 active images.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { generateUploadParams, deleteFromCloudinary } = require('../../lib/admin/cloudinary');

const MAX_ACTIVE = 100;

router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('taste_quiz_images')
    .select('id, image_url, cloudinary_public_id, caption, aesthetic_tags, sort_order, active, created_at')
    .order('sort_order', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  const activeCount = (data || []).filter(r => r.active).length;
  return okRes(res, { images: data || [], total: (data || []).length, active_count: activeCount, max: MAX_ACTIVE });
}));

router.post('/upload-url', requireAdmin, asyncHandler(async (req, res) => {
  const { filename } = req.body;
  if (!filename) return errRes(res, 400, 'filename is required.');
  return okRes(res, generateUploadParams('surprise_pool', filename));
}));

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { image_url, cloudinary_public_id, caption, aesthetic_tags, sort_order } = req.body;
  if (!image_url) return errRes(res, 400, 'image_url is required.');
  const { count } = await supabase.from('taste_quiz_images').select('id', { count: 'exact', head: true }).eq('active', true);
  if ((count || 0) >= MAX_ACTIVE)
    return errRes(res, 409, `Surprise pool already has ${MAX_ACTIVE} active images.`);
  const { data, error } = await supabase.from('taste_quiz_images')
    .insert({ image_url, cloudinary_public_id: cloudinary_public_id || null, caption: caption || null, aesthetic_tags: aesthetic_tags || [], sort_order: sort_order ?? 0, active: true })
    .select('id, image_url, caption, aesthetic_tags, sort_order, active, created_at').single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { image: data });
}));

router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { caption, aesthetic_tags, active, sort_order } = req.body;
  if (active === true) {
    const { count } = await supabase.from('taste_quiz_images').select('id', { count: 'exact', head: true }).eq('active', true).neq('id', req.params.id);
    if ((count || 0) >= MAX_ACTIVE) return errRes(res, 409, `Cannot activate: already at ${MAX_ACTIVE} active images.`);
  }
  const patch = {};
  if (caption        !== undefined) patch.caption        = caption;
  if (aesthetic_tags !== undefined) patch.aesthetic_tags = aesthetic_tags;
  if (active         !== undefined) patch.active         = active;
  if (sort_order     !== undefined) patch.sort_order     = sort_order;
  if (!Object.keys(patch).length) return errRes(res, 400, 'No fields to update.');
  const { error } = await supabase.from('taste_quiz_images').update(patch).eq('id', req.params.id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { updated: true });
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: row } = await supabase.from('taste_quiz_images').select('cloudinary_public_id').eq('id', req.params.id).single();
  if (row?.cloudinary_public_id) await deleteFromCloudinary(row.cloudinary_public_id);
  const { error } = await supabase.from('taste_quiz_images').delete().eq('id', req.params.id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { deleted: true });
}));

module.exports = router;
