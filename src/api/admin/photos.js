// src/api/admin/photos.js
// Photo approval queue.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// GET /queue — supports ?category=photographer&state=pending|approved|rejected|all&vendor_id=
router.get('/queue', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendorId = req.query.vendor_id || null;
  const category = req.query.category  || null;
  const state    = req.query.state     || 'pending';
  const validStates = ['pending', 'approved', 'rejected', 'all'];
  if (!validStates.includes(state)) return errRes(res, 400, `state must be one of: ${validStates.join(', ')}.`);

  let q = supabase.from('vendor_portfolio')
    .select('id, vendor_id, image_url, caption, aesthetic_tags, approval_state, created_at, vendor:vendors(id, business_name, category, routing_handle, user:users(name))')
    .order('created_at', { ascending: true });

  if (state !== 'all') q = q.eq('approval_state', state);
  if (vendorId) q = q.eq('vendor_id', vendorId);
  if (category) q = q.eq('vendor.category', category);

  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { photos: data || [], total: (data || []).length });
}));

// POST /:imageId/approve
router.post('/:imageId/approve', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { error } = await supabase.from('vendor_portfolio')
    .update({ approval_state: 'approved', reviewed_by_admin: 'admin', reviewed_at: new Date().toISOString() })
    .eq('id', req.params.imageId);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, {});
}));

// POST /:imageId/reject
router.post('/:imageId/reject', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const reason   = (req.body || {}).reason || null;
  const { error } = await supabase.from('vendor_portfolio')
    .update({ approval_state: 'rejected', reviewed_by_admin: 'admin', reviewed_at: new Date().toISOString(), rejection_reason: reason })
    .eq('id', req.params.imageId);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, {});
}));

// POST /bulk-approve
router.post('/bulk-approve', requireAdmin, asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const imageIds  = (req.body || {}).image_ids || [];
  if (!imageIds.length) return errRes(res, 400, 'image_ids required.');
  const { error } = await supabase.from('vendor_portfolio')
    .update({ approval_state: 'approved', reviewed_by_admin: 'admin', reviewed_at: new Date().toISOString() })
    .in('id', imageIds);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { approved: imageIds.length });
}));

module.exports = router;
