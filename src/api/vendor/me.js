// src/api/vendor/me.js
// Vendor profile endpoints.
//   GET   /api/v2/vendor/me                   — profile read
//   PATCH /api/v2/vendor/me                   — profile update
//   PATCH /api/v2/vendor/me/routing-handle    — handle update (sensitive)
//   PATCH /api/v2/vendor/me/invoice-prefix    — invoice prefix update
// Auth: vendor JWT.

'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');
const asyncHandler   = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

router.get('/', requireAuth, resolveVendor(), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;

  // Fetch users.name for the vendor.
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('name')
    .eq('id', vendor.user_id)
    .maybeSingle();

  if (userErr) {
    console.error('[GET /vendor/me] user lookup error:', userErr.message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  return res.json({
    ok: true,
    vendor: {
      id:                vendor.id,
      name:              user?.name || null,
      business_name:     vendor.business_name || null,
      category:          vendor.category || null,
      city:              vendor.city || null,
      handle:            vendor.routing_handle || null,
      upi_id:            vendor.upi_id || null,
      gstin:             vendor.gstin || null,
      open_to_travel:    vendor.open_to_travel === true,
      tier:              vendor.tier || null,
      founding_cohort:   vendor.founding_cohort === true,
      // Block F (migration 0034) applied these columns — real values now.
      aesthetic_tags:    vendor.aesthetic_tags    || [],
      rate_min:          vendor.rate_min          || null,
      rate_max:          vendor.rate_max          || null,
      discover_preview:        vendor.discover_preview        === true,
      discover_eligible:       vendor.discover_eligible       === true,
      discover_request_state:  vendor.discover_request_state  || 'not_requested',
      couture_eligible:        vendor.couture_eligible        === true,
      featured_eligible:       vendor.featured_eligible       === true,
    },
  });
});


// ─── PATCH /api/v2/vendor/me ───────────────────────────────────────────
//
// Update vendor profile fields. Locked fields rejected with 400.
// Auth: requireAuth. resolveVendor mode A.

const LOCKED_FIELDS  = ['phone', 'routing_handle', 'tier', 'founding_cohort', 'onboarding_state', 'category'];
const ALLOWED_FIELDS = ['business_name', 'style_notes', 'city', 'open_to_travel', 'travel_notes',
                        'instagram_handle', 'upi_id', 'gstin', 'briefing_enabled',
                        'aesthetic_tags', 'rate_min', 'rate_max'];

router.patch('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const body     = req.body || {};

  // Reject locked fields
  for (const field of LOCKED_FIELDS) {
    if (body[field] !== undefined) {
      return errRes(res, 400, 'Field \'' + field + '\' is locked.', 'FIELD_LOCKED');
    }
  }

  const update = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) return errRes(res, 400, 'No editable fields provided.');

  // rate_min <= rate_max guard
  const rMin = update.rate_min !== undefined ? update.rate_min : vendor.rate_min;
  const rMax = update.rate_max !== undefined ? update.rate_max : vendor.rate_max;
  if (rMin != null && rMax != null && rMin > rMax) {
    return errRes(res, 400, 'rate_min cannot exceed rate_max.');
  }

  const { data: updated, error } = await supabase
    .from('vendors').update(update).eq('id', vendor.id)
    .select('id, business_name, city, open_to_travel, upi_id, gstin, aesthetic_tags, rate_min, rate_max, discover_preview, discover_eligible, discover_request_state, couture_eligible, featured_eligible')
    .maybeSingle();

  if (error) return errRes(res, 500, error.message);

  const { data: user } = await supabase.from('users').select('name').eq('id', vendor.user_id).maybeSingle();

  return okRes(res, {
    vendor: {
      id:               updated.id,
      name:             user?.name || null,
      business_name:    updated.business_name    || null,
      city:             updated.city             || null,
      open_to_travel:   updated.open_to_travel   === true,
      upi_id:           updated.upi_id           || null,
      gstin:            updated.gstin            || null,
      aesthetic_tags:   updated.aesthetic_tags   || [],
      rate_min:         updated.rate_min         || null,
      rate_max:         updated.rate_max         || null,
      discover_preview: updated.discover_preview === true,
    },
  });
}));

// ─── PATCH /api/v2/vendor/me/routing-handle ────────────────────────────
//
// Handle changes are sensitive — separate endpoint.
// Alphanumeric, 3-12 chars, uppercased. Globally unique.
// Auth: requireAuth. resolveVendor mode A.

router.patch('/routing-handle', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const raw      = (req.body || {}).routing_handle || '';
  const cleaned  = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (cleaned.length < 3)  return errRes(res, 400, 'Handle must be at least 3 characters.');
  if (cleaned.length > 12) return errRes(res, 400, 'Handle must be 12 characters or fewer.');

  const { data: collision } = await supabase
    .from('vendors').select('id').eq('routing_handle', cleaned).neq('id', vendor.id).maybeSingle();
  if (collision) return errRes(res, 409, 'Handle already taken.', 'HANDLE_TAKEN');

  const { error } = await supabase
    .from('vendors').update({ routing_handle: cleaned }).eq('id', vendor.id);
  if (error) return errRes(res, 500, error.message);

  const tdwNumber = process.env.TDW_WA_NUMBER || '14787788550';
  const wa_link   = 'https://wa.me/' + tdwNumber + '?text=TDW-' + cleaned;
  console.log('[me:routing-handle] ' + vendor.id + ' -> ' + cleaned);
  return okRes(res, { routing_handle: cleaned, wa_link });
}));

// ─── PATCH /api/v2/vendor/me/invoice-prefix ────────────────────────────
//
// Update invoice prefix. Counter never resets on prefix change.
// Auth: requireAuth. resolveVendor mode A.

router.patch('/invoice-prefix', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const raw      = (req.body || {}).prefix || '';
  const cleaned  = raw.toUpperCase().trim().replace(/[^A-Z0-9\-\/]/g, '');

  if (!cleaned || cleaned.length < 2)  return errRes(res, 400, 'Prefix must be at least 2 characters.');
  if (cleaned.length > 20) return errRes(res, 400, 'Prefix must be 20 characters or fewer.');

  const { data: v } = await supabase
    .from('vendors').select('invoice_counter').eq('id', vendor.id).single();

  const { error } = await supabase
    .from('vendors').update({ invoice_prefix: cleaned }).eq('id', vendor.id);
  if (error) return errRes(res, 500, error.message);

  console.log('[me:invoice-prefix] ' + vendor.id + ' -> ' + cleaned);
  return okRes(res, { prefix: cleaned, current_counter: v?.invoice_counter || 0 });
}));
module.exports = router;
