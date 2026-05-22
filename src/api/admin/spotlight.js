// src/api/admin/spotlight.js
// Admin spotlight — "Vendors of the week" editorial cards on discover landing.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { generateUploadParams, deleteFromCloudinary } = require('../../lib/admin/cloudinary');

router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('spotlight')
    .select('id, vendor_id, image_url, cloudinary_public_id, caption, week_label, sort_order, active, created_at, vendors(business_name, category, city)')
    .order('sort_order', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  const items = (data || []).map(r => ({
    id: r.id, vendor_id: r.vendor_id,
    vendor_name: r.vendors?.business_name || null,
    vendor_category: r.vendors?.category || null,
    vendor_city: r.vendors?.city || null,
    image_url: r.image_url, cloudinary_public_id: r.cloudinary_public_id,
    caption: r.caption, week_label: r.week_label,
    sort_order: r.sort_order, active: r.active, created_at: r.created_at,
  }));
  return okRes(res, { spotlight: items, total: items.length });
}));

router.post('/upload-url', requireAdmin, asyncHandler(async (req, res) => {
  const { filename } = req.body;
  if (!filename) return errRes(res, 400, 'filename is required.');
  return okRes(res, generateUploadParams('spotlight', filename));
}));

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { image_url, cloudinary_public_id, vendor_id, caption, week_label, sort_order } = req.body;
  if (!image_url) return errRes(res, 400, 'image_url is required.');
  const { data, error } = await supabase.from('spotlight')
    .insert({ image_url, cloudinary_public_id: cloudinary_public_id || null, vendor_id: vendor_id || null, caption: caption || null, week_label: week_label || null, sort_order: sort_order ?? 0, active: true })
    .select('id, vendor_id, image_url, caption, week_label, sort_order, active, created_at').single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { item: data });
}));

router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { caption, week_label, active, sort_order, vendor_id } = req.body;
  const patch = {};
  if (caption    !== undefined) patch.caption    = caption;
  if (week_label !== undefined) patch.week_label = week_label;
  if (active     !== undefined) patch.active     = active;
  if (sort_order !== undefined) patch.sort_order = sort_order;
  if (vendor_id  !== undefined) patch.vendor_id  = vendor_id;
  if (!Object.keys(patch).length) return errRes(res, 400, 'No fields to update.');
  const { error } = await supabase.from('spotlight').update(patch).eq('id', req.params.id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { updated: true });
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: row } = await supabase.from('spotlight').select('cloudinary_public_id').eq('id', req.params.id).single();
  if (row?.cloudinary_public_id) await deleteFromCloudinary(row.cloudinary_public_id);
  const { error } = await supabase.from('spotlight').delete().eq('id', req.params.id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { deleted: true });
}));

const publicRouter = express.Router();
publicRouter.get('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('spotlight')
    .select('id, vendor_id, image_url, caption, week_label, sort_order, vendors(business_name, category, city)')
    .eq('active', true).order('sort_order', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { spotlight: data || [], total: (data || []).length });
}));

module.exports = { adminRouter: router, publicRouter };
