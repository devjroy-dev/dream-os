// src/api/vendor/me.js
// GET /api/v2/vendor/me
// Auth: vendor JWT.
// Purpose: Vendor profile — used by settings screen and session hydration.
// Contract: docs/API_CONTRACTS.md (Vendor endpoints, /vendor/me).
//
// Joins vendors + users (for users.name as vendor.name).
// Returns the four P2-9 fields (aesthetic_tags, rate_min, rate_max, discover_preview)
// as nulls/false. Migrations 0024 (vendor_portfolio + rate cols + aesthetic_tags)
// and 0029 (discover_preview) are scheduled for P2-9.

'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');

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
      // P2-9 fields — stubbed null/false until migrations 0024 + 0029 applied.
      aesthetic_tags:    null,
      rate_min:          null,
      rate_max:          null,
      discover_preview:  false,
    },
  });
});

module.exports = router;
