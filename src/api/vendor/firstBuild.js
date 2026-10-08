'use strict';
// src/api/vendor/firstBuild.js · TDW · CE-47 · WEB-4 cut 19 · THE FIRST-BUILD DOORS (her session; her vendor from it).
//   POST /api/v2/vendor/first-build            -> { ok, build_id, already }   (one at a time: a second POST returns the same id)
//   POST /api/v2/vendor/first-build { step: 'website' }  -> the website step alone, again (cut 26); 409 + code when it will not fill
//   GET  /api/v2/vendor/first-build/:build_id  -> { ok, state, steps, site_ready }
//   GET  /api/v2/vendor/first-build/latest     -> { ok, build: { build_id, state, steps, site_ready, website_can_fill } | null }
// The app polls GET every 2 seconds, bounded (3 minutes, then a plain line). The work is src/lib/vendor/firstBuild.js.
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const FB = require('../../lib/vendor/firstBuild');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// cut 26 (b): POST { step: 'website' } runs the website step alone, again, inside her latest build, and fills only
// TDW's untouched draft from her photos. 409 with a code and a line when it will not; any other step is refused.
//   -> { ok, build_id, already }  |  409 { ok: false, error, code: WEBSITE_HERS | NO_PHOTOS | NO_BUILD }
router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const deps = req.app.locals.firstBuildDeps || FB.liveDeps();
  const step = req.body && typeof req.body === 'object' ? req.body.step : undefined;
  if (step !== undefined && step !== 'website') return errRes(res, 400, 'That step cannot be run on its own.', 'STEP_UNKNOWN');
  const r = step === 'website' ? await FB.rerunWebsite(sb, req.vendor, deps) : await FB.start(sb, req.vendor, deps);
  if (r.refused) return errRes(res, 409, r.line, r.refused);
  if (r.error) return errRes(res, 503, 'TDW could not start building your website. Please try again.');
  return okRes(res, { build_id: r.build_id, already: Boolean(r.already) });
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
