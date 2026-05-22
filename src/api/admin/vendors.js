// src/api/admin/vendors.js
// Admin vendor management — list, create, tier, approve, discover-eligible.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

const VALID_TIERS = ['trial', 'essential', 'signature', 'prestige'];

// ─── GET /api/v2/admin/vendors ──────────────────────────────────────────
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data, error } = await supabase
    .from('vendors')
    .select(`
      id, business_name, category, city, tier, status, founding_cohort,
      discover_eligible, discover_request_state, created_at,
      users!inner(name, phone)
    `)
    .order('created_at', { ascending: false });

  if (error) return errRes(res, 500, error.message);

  const vendors = (data || []).map(v => ({
    id:                    v.id,
    name:                  v.business_name || v.users?.name || 'Unnamed',
    category:              v.category,
    city:                  v.city,
    phone:                 v.users?.phone,
    tier:                  v.tier,
    status:                v.status,
    founding_cohort:       v.founding_cohort || false,
    discover_eligible:     v.discover_eligible || false,
    discover_request_state: v.discover_request_state || 'not_requested',
    created_at:            v.created_at,
  }));

  return okRes(res, { vendors, total: vendors.length });
}));

// ─── POST /api/v2/admin/vendors/create ──────────────────────────────────
router.post('/create', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { business_name, phone, category, city, tier } = req.body;

  if (!phone) return errRes(res, 400, 'phone is required.');

  // Create user + vendor via existing RPC (same as HTML admin invite flow).
  const { error: rpcError } = await supabase.rpc('invite_vendor', {
    p_phone: phone.trim(),
    p_name:  business_name?.trim() || 'Vendor',
  });
  if (rpcError) return errRes(res, 400, rpcError.message);

  // Patch additional fields supplied by admin form.
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('phone', phone.trim())
    .single();

  if (user) {
    const patch = {};
    if (business_name) patch.business_name = business_name.trim();
    if (category)      patch.category      = category;
    if (city)          patch.city          = city;
    if (tier && VALID_TIERS.includes(tier)) patch.tier = tier;

    if (Object.keys(patch).length) {
      await supabase.from('vendors').update(patch).eq('user_id', user.id);
    }
  }

  return okRes(res, { created: true });
}));

// ─── PATCH /api/v2/admin/vendors/:id/tier ───────────────────────────────
router.patch('/:vendorId/tier', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { tier } = req.body;

  if (!VALID_TIERS.includes(tier)) return errRes(res, 400, `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}.`);

  const { error } = await supabase
    .from('vendors')
    .update({ tier })
    .eq('id', req.params.vendorId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { tier });
}));

// ─── PATCH /api/v2/admin/vendors/:id/approve ────────────────────────────
router.patch('/:vendorId/approve', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  // Toggle status: active <-> paused. "Approve" sets active, re-approving toggles.
  const { data: vendor, error: fetchErr } = await supabase
    .from('vendors')
    .select('status')
    .eq('id', req.params.vendorId)
    .single();

  if (fetchErr) return errRes(res, 404, 'Vendor not found.');

  const newStatus = vendor.status === 'active' ? 'paused' : 'active';
  const { error } = await supabase
    .from('vendors')
    .update({ status: newStatus })
    .eq('id', req.params.vendorId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { status: newStatus });
}));

// ─── PATCH /api/v2/admin/vendors/:id/discover-eligible ──────────────────
router.patch('/:vendorId/discover-eligible', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: vendor, error: fetchErr } = await supabase
    .from('vendors')
    .select('discover_eligible')
    .eq('id', req.params.vendorId)
    .single();

  if (fetchErr) return errRes(res, 404, 'Vendor not found.');

  const newVal = !vendor.discover_eligible;
  const { error } = await supabase
    .from('vendors')
    .update({ discover_eligible: newVal })
    .eq('id', req.params.vendorId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { discover_eligible: newVal });
}));

// ─── PATCH /api/v2/admin/vendors/:id/dreamai ────────────────────────────
// Toggle a vendor's DreamAi PWA access (briefing_enabled serves as the gate).
router.patch('/:vendorId/dreamai', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { access } = req.body;

  const { error } = await supabase
    .from('vendors')
    .update({ briefing_enabled: !!access })
    .eq('id', req.params.vendorId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { dreamai_access: !!access });
}));

// ─── PATCH /api/v2/admin/vendors/:id/revoke ─────────────────────────────
router.patch('/:vendorId/revoke', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { error } = await supabase
    .from('vendors')
    .update({ status: 'paused', discover_eligible: false })
    .eq('id', req.params.vendorId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { revoked: true });
}));

// ── DELETE /api/v2/admin/vendors/:vendorId ────────────────────────────────────
// Hard delete. Cascades to all vendor data via FK constraints.
// Requires confirmation — caller must pass { confirm: true } in body.
router.delete('/:vendorId', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  if (!req.body?.confirm) return errRes(res, 400, 'Pass { confirm: true } to confirm deletion.');

  // Delete the users row — cascades to vendors + all vendor data
  const { data: vendor } = await supabase
    .from('vendors').select('user_id').eq('id', req.params.vendorId).maybeSingle();
  if (!vendor) return errRes(res, 404, 'Vendor not found.');

  const { error } = await supabase.from('users').delete().eq('id', vendor.user_id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { deleted: true });
}));

module.exports = router;
