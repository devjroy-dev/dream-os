// src/api/couple/enquiries.js
// GET /api/v2/couple/enquiries — the bride's "Enquired" list (vendors she reached
// out to from the Discover feed). Mounted under requireCoupleAuth via core.js.
//
// Each row carries the snapshot vendor fields + routing_handle so the frontend can
// build a pre-filled wa.me link to the TDW couple-facing agent without a join.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

router.get('/', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  const { data, error } = await supabase
    .from('couple_enquiries')
    .select('id, vendor_id, vendor_name, vendor_category, vendor_city, routing_handle, created_at')
    .eq('couple_id', couple_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[GET /couple/enquiries] query error:', error.message);
    return errRes(res, 500, 'Could not load enquiries.');
  }

  const enquiries = (data || []).map(e => ({
    id:             e.id,
    vendor_id:      e.vendor_id,
    vendor_name:    e.vendor_name     || null,
    category:       e.vendor_category || null,
    city:           e.vendor_city     || null,
    routing_handle: e.routing_handle  || null,
    created_at:     e.created_at,
  }));

  return okRes(res, { enquiries });
}));

module.exports = router;
