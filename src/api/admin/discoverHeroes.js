// src/api/admin/discoverHeroes.js
// Admin discover heroes — hero images at top of bride's frost discover feed.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { generateUploadParams, deleteFromCloudinary } = require('../../lib/admin/cloudinary');

router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('discover_heroes')
    .select('id, image_url, cloudinary_public_id, caption, display_order, active, created_at')
    .order('display_order', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { heroes: data || [], total: (data || []).length });
}));

router.post('/upload-url', requireAdmin, asyncHandler(async (req, res) => {
  const { filename } = req.body;
  if (!filename) return errRes(res, 400, 'filename is required.');
  return okRes(res, generateUploadParams('discover_heroes', filename));
}));

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { image_url, cloudinary_public_id, caption, display_order } = req.body;
  if (!image_url) return errRes(res, 400, 'image_url is required.');
  const { data, error } = await supabase.from('discover_heroes')
    .insert({ image_url, cloudinary_public_id: cloudinary_public_id || null, caption: caption || null, display_order: display_order ?? 0, active: true })
    .select('id, image_url, caption, display_order, active, created_at').single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { hero: data });
}));

router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { caption, active, display_order } = req.body;
  const patch = {};
  if (caption       !== undefined) patch.caption       = caption;
  if (active        !== undefined) patch.active        = active;
  if (display_order !== undefined) patch.display_order = display_order;
  if (!Object.keys(patch).length) return errRes(res, 400, 'No fields to update.');
  const { error } = await supabase.from('discover_heroes').update(patch).eq('id', req.params.id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { updated: true });
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: row } = await supabase.from('discover_heroes').select('cloudinary_public_id').eq('id', req.params.id).single();
  if (row?.cloudinary_public_id) await deleteFromCloudinary(row.cloudinary_public_id);
  const { error } = await supabase.from('discover_heroes').delete().eq('id', req.params.id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { deleted: true });
}));

const publicRouter = express.Router();
publicRouter.get('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('discover_heroes')
    .select('id, image_url, caption, display_order')
    .eq('active', true).order('display_order', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { heroes: data || [], total: (data || []).length });
}));

module.exports = { adminRouter: router, publicRouter };
