// src/api/public/vendor.js
// Public read-only vendor data for demo subdomains
// No auth — demo handle IS the access token
'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');

// GET /api/v2/public/vendor/:handle
router.get('/:handle', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const handle   = req.params.handle.toLowerCase();

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select(`
      id,
      demo_handle,
      demo_instagram,
      demo_expires_at,
      demo_active,
      category,
      city,
      users!inner(name),
      vendor_portfolio(
        id,
        image_url,
        caption,
        aesthetic_tags,
        is_hero,
        approval_state
      )
    `)
    .ilike('demo_handle', handle)
    .eq('demo_active', true)
    .gt('demo_expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !vendor) {
    return res.status(404).json({ ok: false, error: 'Demo profile not found or expired' });
  }

  const photos = (vendor.vendor_portfolio || [])
    .filter(p => p.approval_state === 'approved')
    .sort((a, b) => (b.is_hero ? 1 : 0) - (a.is_hero ? 1 : 0));

  return res.json({
    ok: true,
    vendor: {
      id: vendor.id,
      name: vendor.users?.name,
      handle: vendor.demo_handle,
      instagram: vendor.demo_instagram,
      category: vendor.category,
      city: vendor.city,
      expires_at: vendor.demo_expires_at,
      photos
    }
  });
}));

module.exports = router;
