// src/api/admin/photos.js
// Photo approval queue.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// CE-47 WEB-4 cut 3 · ?kind=look (or body.kind 'look') runs the same queue and doors over her LOOK photos
// (vendor_look_photos). WEB-4 cut 4 (0188): a rejection keeps its reason (up to 200 characters) and every review its
// time, so her room can say why a photo was not approved. Default: portfolio.
const isLook = (req) => req.query.kind === 'look' || ((req.body || {}).kind === 'look');
const LOOK_Q_SELECT = 'id, vendor_id, look_id, image_url, caption, approval_state, rejection_reason, reviewed_at, created_at, vendor:vendors(id, business_name, category, routing_handle, user:users(name))';

// GET /queue — supports ?category=photographer&state=pending|approved|rejected|all&vendor_id=
router.get('/queue', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendorId = req.query.vendor_id || null;
  const category = req.query.category  || null;
  const state    = req.query.state     || 'pending';
  const validStates = ['pending', 'approved', 'rejected', 'all'];
  if (!validStates.includes(state)) return errRes(res, 400, `state must be one of: ${validStates.join(', ')}.`);

  if (isLook(req)) {
    let lq = supabase.from('vendor_look_photos').select(LOOK_Q_SELECT).is('deleted_at', null).order('created_at', { ascending: true });
    if (state !== 'all') lq = lq.eq('approval_state', state);
    if (vendorId) lq = lq.eq('vendor_id', vendorId);
    const { data: ld, error: lErr } = await lq;
    if (lErr) return errRes(res, 500, lErr.message);
    return okRes(res, { photos: ld || [], total: (ld || []).length, kind: 'look' });
  }
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
  if (isLook(req)) {
    const { error: le } = await supabase.from('vendor_look_photos').update({ approval_state: 'approved', rejection_reason: null, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', req.params.imageId);
    if (le) return errRes(res, 500, le.message);
    return okRes(res, {});
  }
  const { error } = await supabase.from('vendor_portfolio')
    .update({ approval_state: 'approved', reviewed_by_admin: 'admin', reviewed_at: new Date().toISOString() })
    .eq('id', req.params.imageId);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, {});
}));

// POST /:imageId/reject
router.post('/:imageId/reject', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  if (isLook(req)) {
    const why = String((req.body || {}).reason || '').trim().slice(0, 200) || null;
    const { error: le } = await supabase.from('vendor_look_photos').update({ approval_state: 'rejected', rejection_reason: why, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', req.params.imageId);
    if (le) return errRes(res, 500, le.message);
    return okRes(res, {});
  }
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
  if (isLook(req)) {
    const { error: le } = await supabase.from('vendor_look_photos').update({ approval_state: 'approved', rejection_reason: null, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).in('id', imageIds);
    if (le) return errRes(res, 500, le.message);
    return okRes(res, { approved: imageIds.length, kind: 'look' });
  }
  const { error } = await supabase.from('vendor_portfolio')
    .update({ approval_state: 'approved', reviewed_by_admin: 'admin', reviewed_at: new Date().toISOString() })
    .in('id', imageIds);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { approved: imageIds.length });
}));

module.exports = router;
