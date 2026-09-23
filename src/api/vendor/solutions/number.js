'use strict';
// src/api/vendor/solutions/number.js · CE-45 · G6-1 · 2a · THE OWN-NUMBER DOORS (FK1, ruled 2026-09-24).
// Mounted at /api/v2/vendor/solutions/number by ./index.js, beside /google and /storefront.
//   GET  /         the room's answer (./../../../lib/ownNumber/door.js), fields beside `ok`
//   POST /connect  Meta's code in, her row out (./../../../lib/ownNumber/connect.js)
// Both are her own: requireAuth then resolveVendor() (mode A), so a door can never be handed another
// vendor's id. FE_1 (dreamos-pwa 24923aa) is the only reader and validates every field.
const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const resolveVendor = require('../../middleware/resolveVendor');
const asyncHandler = require('../../../lib/asyncHandler');
const { ok: okRes } = require('../../../lib/response');
const door = require('../../../lib/ownNumber/door');
const { connect } = require('../../../lib/ownNumber/connect');

router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const a = await door.answer({ vendor: req.vendor, supabase: req.app.locals.supabase });
  return okRes(res, a);
}));

router.post('/connect', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const r = await connect({ vendor: req.vendor, body: req.body, supabase: req.app.locals.supabase });
  if (!r.ok) console.warn(`[own-number] connect refused for ${req.vendor.id}: ${r.reason}`);
  return res.status(200).json(r);
}));

module.exports = router;
