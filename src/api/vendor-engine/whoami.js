'use strict';
// src/api/vendor-engine/whoami.js
// Vendor Suit, Phase 3-A proof route.
//   GET /api/v2/vendor-e/whoami/:vendorId
// Confirms the vendor JWT resolves to a stable engine agent with the right
// preset. Provisions on first call; returns the SAME agentId on every call
// thereafter. Shadow-mounted (parallel to Myra); the pwa never calls it.
const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const resolveAgent  = require('../middleware/resolveAgent');

router.get('/whoami/:vendorId',
  requireAuth,
  resolveVendor({ paramName: 'vendorId' }),
  resolveAgent(),
  (req, res) => {
    res.json({
      ok:       true,
      vendorId: req.vendor.id,
      category: req.vendor.category || null,
      agentId:  req.agentId,
      preset:   req.agentPreset || null,
    });
  });

module.exports = router;
