// src/api/vendor/discover.js
// Vendor Discover submission endpoints.
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { requestDiscover, getDiscoverStatus, getDiscoverPreview, withdrawRequest } = require('../../lib/vendor/discover');

// GET /status
router.get('/status', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result   = await getDiscoverStatus(supabase, req.vendor.id);
  return okRes(res, result);
}));

// ── GET /preview — TDW_07 P4b · F5 ────────────────────────────────────────────────────
// The vendor's own card, shaped by the FEED'S function. Reachable pre-approval by design:
// the spec's F5 calls that "the strongest self-serve motivation to hit the 6-photo floor",
// so there is deliberately NO eligibility guard here. Auth + ownership only — a vendor may
// always look at his own profile, in any state it is in.
//
// resolveVendor() attaches the FULL vendors row (select('*')), so the shaper receives the
// same columns the public feed query selects without a second read.
router.get('/preview', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result   = await getDiscoverPreview(supabase, req.vendor);
  if (!result.ok) return errRes(res, 500, result.error);
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
