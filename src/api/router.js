// src/api/router.js
// Top-level /api/v2 router.
// Mounted in src/index.js as: app.use('/api/v2', require('./api/router'));
//
// Route map:
//   POST /api/v2/waitlist/signup         — landing page waitlist capture (P2-3) ✅
//   POST /api/v2/invite/validate         — check code valid + unconsumed (P2-3) ✅
//   POST /api/v2/invite/consume          — consume code + create user (P2-3) ✅
//   POST /api/v2/vendor/auth/send-otp    — vendor auth (P2-3) ✅
//   POST /api/v2/vendor/auth/verify-otp  — vendor auth (P2-3) ✅
//   POST /api/v2/vendor/auth/set-pin     — vendor auth (P2-3) ✅
//   POST /api/v2/vendor/auth/pin-login   — vendor auth (P2-3) ✅
//   POST /api/v2/vendor/auth/forgot-pin  — vendor auth (P2-3) ✅
//   POST /api/v2/couple/auth/send-otp    — couple auth (P2-3) ✅
//   POST /api/v2/couple/auth/verify-otp  — couple auth (P2-3) ✅
//   POST /api/v2/couple/auth/set-pin     — couple auth (P2-3) ✅
//   POST /api/v2/couple/auth/pin-login   — couple auth (P2-3) ✅
//   POST /api/v2/couple/auth/forgot-pin  — couple auth (P2-3) ✅
//   GET  /api/v2/vendor/today/:id        — vendor PWA today view (P2-4 Block 2)
//   GET  /api/v2/discover/preview        — bride FEED preview (P2-4 Block 2)

'use strict';

const express          = require('express');
const router           = express.Router();

const waitlistRouter   = require('./waitlist');
const inviteRouter     = require('./invite');
const vendorAuthRouter = require('./vendor/auth');

router.use('/waitlist',      waitlistRouter);
router.use('/invite',        inviteRouter);
router.use('/vendor/auth',   vendorAuthRouter);

// Subsequent routers mounted here as they are built:
const coupleAuthRouter = require('./couple/auth');
router.use('/couple/auth',   coupleAuthRouter);

module.exports = router;
