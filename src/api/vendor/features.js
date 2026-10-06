'use strict';
// src/api/vendor/features.js · CE-47 · ADS-2 · THE DOOR for a vendor's Meta feature switches (mounted at /features).
//   GET  -> { features: [{ key, feature, live, choice }] }      (no stored choice means 'on')
//   PUT  { key, choice: 'on'|'off' } -> { saved: true }         (only keys in metaGates.FEATURES; never own_number)
const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const featureGate   = require('../../lib/featureGate');

router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  okRes(res, { features: await featureGate.choicesFor({ supabase: req.app.locals.supabase, vendorId: req.vendor.id }) });
}));
router.put('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const b = req.body || {};
  const r = await featureGate.setChoice({ supabase: req.app.locals.supabase, vendorId: req.vendor.id, key: b.key, choice: b.choice });
  if (!r.ok) return errRes(res, 400, r.error === 'choice is on or off' ? 'Choose On or Off.' : 'That is not a feature you can switch.', 'FEATURE_CHOICE_REFUSED');
  okRes(res, { saved: true });
}));
module.exports = router;
