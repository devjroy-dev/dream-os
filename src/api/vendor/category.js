'use strict';
// src/api/vendor/category.js
// Mounted at /api/v2/vendor/category in src/api/router.js.
//
// One-time field/category capture, taken in the signup flow BEFORE the agent is
// created (the dedicated field step: OTP -> field -> PIN -> /vendor). Setting the
// category here means resolvePreset() has it in hand at agent-birth, so the agent
// is born knowing its craft and profession_preset lands correctly. No resolveAgent
// in this route — setting the field must NOT itself birth the agent.
//
// Set-once: refuses to change an already-set category (category is a locked field
// everywhere else, e.g. PATCH /me). Constrained to the six categories that map to
// an authored Codex/preset in categoryPreset.js; the stored value IS the preset-map
// key, lowercased.
const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');
const asyncHandler   = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// Exactly the keys categoryPreset.js maps to a preset. Anything else would pass
// through as a raw string and resolve to no preset — which is the bug this fixes.
const ALLOWED_CATEGORIES = ['makeup', 'planning', 'photography', 'designer', 'venue & decor', 'jewellery'];

// POST /  — set the vendor's category, once.
router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;

  const raw = (req.body && req.body.category != null)
    ? String(req.body.category).trim().toLowerCase()
    : '';
  if (!raw) return errRes(res, 400, 'category is required.');
  if (!ALLOWED_CATEGORIES.includes(raw)) {
    return errRes(res, 400, 'Unrecognised category.', 'CATEGORY_INVALID');
  }

  // Set-once: never overwrite an existing category (it is a locked field).
  if (vendor.category && String(vendor.category).trim()) {
    return errRes(res, 409, 'Category already set.', 'CATEGORY_LOCKED');
  }

  const { error } = await supabase
    .from('vendors').update({ category: raw }).eq('id', vendor.id);
  if (error) return errRes(res, 500, error.message);

  return okRes(res, { category: raw });
}));

module.exports = router;
