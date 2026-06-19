'use strict';
// src/api/vendor-engine/index.js
// Vendor Suit, Phase 3 — the engine-backed vendor doors, mounted in PARALLEL to
// the live Myra routes under /api/v2/vendor-e. Phase 4 flips the real
// /api/v2/vendor paths onto these handlers; until then the pwa is untouched and
// Myra keeps serving. Pieces are added here as they are built (3-A whoami first).
const express = require('express');
const router  = express.Router();

router.use('/', require('./whoami'));   // 3-A: the identity-bridge proof

module.exports = router;
