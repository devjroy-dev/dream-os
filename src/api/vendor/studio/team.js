// src/api/vendor/studio/team.js
// GET    /api/v2/vendor/studio/team           — list active members
// POST   /api/v2/vendor/studio/team           — add member
// PATCH  /api/v2/vendor/studio/team/:memberId — update
// DELETE /api/v2/vendor/studio/team/:memberId — soft delete
'use strict';

const express         = require('express');
const router          = express.Router();
const requireAuth     = require('../../middleware/requireAuth');
const resolveVendor   = require('../../middleware/resolveVendor');
const requirePrestige  = require('../../middleware/requirePrestige');
const asyncHandler    = require('../../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../../lib/response');

const mw = [requireAuth, resolveVendor(), requirePrestige];

// GET — list
router.get('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('vendor_id', req.vendor.id)
    .eq('active', true)
    .is('deleted_at', null)
    .order('name', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { members: data || [] });
}));

// POST — add
router.post('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, role, phone, daily_rate_inr, notes } = req.body || {};
  if (!name || !name.trim()) return errRes(res, 400, 'name is required.');
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      vendor_id:      req.vendor.id,
      name:           name.trim(),
      role:           role           || null,
      phone:          phone          || null,
      daily_rate_inr: daily_rate_inr || null,
      notes:          notes          || null,
    })
    .select()
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { member: data });
}));

// PATCH — update
router.patch('/:memberId', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const allowed  = ['name', 'role', 'phone', 'daily_rate_inr', 'notes', 'active'];
  const updates  = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  if (!Object.keys(updates).length) return errRes(res, 400, 'No valid fields provided.');
  const { data, error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', req.params.memberId)
    .eq('vendor_id', req.vendor.id)
    .is('deleted_at', null)
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Team member not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { member: data });
}));

// DELETE — soft delete
router.delete('/:memberId', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('team_members')
    .update({ deleted_at: new Date().toISOString(), active: false })
    .eq('id', req.params.memberId)
    .eq('vendor_id', req.vendor.id)
    .is('deleted_at', null)
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Team member not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { member: data });
}));

module.exports = router;
