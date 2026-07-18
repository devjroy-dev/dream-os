'use strict';
// src/api/vendor-engine/index.js
// Vendor Suit, Phase 3 — the engine-backed vendor doors, mounted in PARALLEL to
// the live Myra routes under /api/v2/vendor-e. Phase 4 flips the real
// /api/v2/vendor paths onto these handlers; until then the pwa is untouched and
// Myra keeps serving. Pieces are added here as they are built (3-A whoami first).
const express = require('express');
const router  = express.Router();

router.use('/', require('./whoami'));   // 3-A: the identity-bridge proof
router.use('/cabinet', require('./cabinet'));   // 3-B: cabinet read
router.use('/binders', require('./ledger'));    // 3-B: flat ledger read
router.use('/binders', require('./binderWrite')); // 3-C: binder write doors
router.use('/chat', require('./chat')); // 3-D: chat door (Victor)
router.use('/mode', require('./vendorMode')); // TDW_06 P6b (R-1): victor_mode Business·Advisor flip
router.use('/today',   require('./today'));     // 3-B: today dashboard

module.exports = router;
