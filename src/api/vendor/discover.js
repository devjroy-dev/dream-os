// src/api/vendor/discover.js
// Vendor Discover submission endpoints.
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { requestDiscover, getDiscoverStatus, withdrawRequest } = require('../../lib/vendor/discover');

// GET /status
router.get('/status', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result   = await getDiscoverStatus(supabase, req.vendor.id);
  return okRes(res, result);
}));

// POST /request
router.post('/request', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result   = await requestDiscover(supabase, req.vendor.id, req.body || {});
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { request_id: result.request_id });
}));

// POST /withdraw
router.post('/withdraw', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result   = await withdrawRequest(supabase, req.vendor.id);
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, {});
}));

module.exports = router;
