// src/api/admin/couture.js
// Couture admin — eligibility toggle + pending payouts.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const requireAuth  = require('../middleware/requireAuth');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// GET / — list couture-eligible vendors with slot + appointment counts
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('vendors')
    .select(`
      id, business_name, category, city, couture_eligible,
      users!inner(name, phone),
      couture_slots:couture_availability(count),
      couture_appointments(count)
    `)
    .order('created_at', { ascending: false });
  if (error) return errRes(res, 500, error.message);

  const vendors = (data || []).map(v => ({
    id:                v.id,
    name:              v.business_name || v.users?.name || 'Unnamed',
    phone:             v.users?.phone,
    category:          v.category,
    city:              v.city,
    couture_eligible:  v.couture_eligible || false,
    slot_count:        v.couture_slots?.[0]?.count ?? 0,
    appointment_count: v.couture_appointments?.[0]?.count ?? 0,
  }));

  return okRes(res, { vendors, total: vendors.length });
}));

// POST /eligible/:vendorId
router.post('/eligible/:vendorId', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const eligible  = (req.body || {}).eligible === true;
  const { error } = await supabase.from('vendors').update({ couture_eligible: eligible }).eq('id', req.params.vendorId);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { couture_eligible: eligible });
}));

// GET /payouts/pending — per-vendor unpaid payout totals
router.get('/payouts/pending', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('couture_appointments')
    .select('vendor_id, vendor_payout_inr, vendor:vendors(business_name, routing_handle, user:users(name, phone))')
    .eq('state', 'completed')
    .not('vendor_payout_inr', 'is', null)
    .is('paid_at', null); // paid_at on appointment = payout sent, null = pending
  if (error) return errRes(res, 500, error.message);

  // Aggregate by vendor
  const byVendor = {};
  for (const row of (data || [])) {
    const vid = row.vendor_id;
    if (!byVendor[vid]) byVendor[vid] = { vendor_id: vid, vendor: row.vendor, total_pending_inr: 0 };
    byVendor[vid].total_pending_inr += (row.vendor_payout_inr || 0);
  }
  const payouts = Object.values(byVendor);
  return okRes(res, { payouts, total_vendors: payouts.length });
}));

module.exports = router;
