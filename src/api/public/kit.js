'use strict';
// src/api/public/kit.js · CE-47 · PRO · P3 · HER MEDIA KIT, the public read (mounted at /api/v2/public/kit).
//   GET /:code    the kit behind thedreamwedding.in/v/<code>/kit, or 404 for no active vendor
// No session by design, mounted beside the public routers in router.js, never under vendor/core.js. The shape is built
// field by field in src/lib/brands/kit.js; nothing is spread from a row.
const express = require('express');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { kitFor } = require('../../lib/brands/kit');

const router = express.Router();
router.get('/:code', asyncHandler(async (req, res) => {
  const kit = await kitFor({ supabase: req.app.locals.supabase, code: req.params.code });
  if (!kit) return errRes(res, 404, 'This media kit is not available.');
  res.set('Cache-Control', 'public, max-age=300');
  return okRes(res, { kit });
}));
module.exports = router;
