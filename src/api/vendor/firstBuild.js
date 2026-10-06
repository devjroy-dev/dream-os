'use strict';
// src/api/vendor/firstBuild.js · TDW · CE-47 · WEB-4 cut 19 · THE FIRST-BUILD DOORS (her session; her vendor from it).
//   POST /api/v2/vendor/first-build            -> { ok, build_id }   (one at a time: a second POST returns the same id)
//   GET  /api/v2/vendor/first-build/:build_id  -> { ok, state, steps, site_ready }
//   GET  /api/v2/vendor/first-build/latest     -> { ok, build: { build_id, state, steps, site_ready } | null }
// The app polls GET every 2 seconds, bounded (3 minutes, then a plain line). The work is src/lib/vendor/firstBuild.js.
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const FB = require('../../lib/vendor/firstBuild');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const r = await FB.start(req.app.locals.supabase, req.vendor, req.app.locals.firstBuildDeps || FB.liveDeps());
  if (r.error) return errRes(res, 503, 'Your website could not start building. Please try again.');
  return okRes(res, { build_id: r.build_id });
}));

//  GET /latest  her most recent build and its state (Home shows "Your business is ready to check"); null if none
router.get('/latest', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  return okRes(res, { build: await FB.latest(req.app.locals.supabase, req.vendor.id) });
}));

router.get('/:id', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  if (!UUID.test(String(req.params.id))) return errRes(res, 404, 'That was not found.');
  const r = await FB.read(req.app.locals.supabase, req.vendor.id, req.params.id);
  if (!r) return errRes(res, 404, 'That was not found.');
  return okRes(res, r);
}));

module.exports = router;
