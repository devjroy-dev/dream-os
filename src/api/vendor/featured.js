// src/api/vendor/featured.js
// Featured promo submission endpoints.
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { submitFeatured, listSubmissions } = require('../../lib/vendor/featured');

// GET / — list submissions
router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result   = await listSubmissions(supabase, req.vendor.id);
  if (!result.ok) return errRes(res, 500, result.error);
  return okRes(res, { submissions: result.submissions, total: result.total });
}));

// POST /submit — requires featured_eligible
router.post('/submit', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const vendor = req.vendor;
  if (!vendor.featured_eligible) return errRes(res, 403, 'Featured promos available to approved Discover vendors. Get approved for Discover first.', 'FEATURED_GATED');
  const supabase = req.app.locals.supabase;
  const result   = await submitFeatured(supabase, vendor.id, req.body || {});
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, result);
}));

module.exports = router;
