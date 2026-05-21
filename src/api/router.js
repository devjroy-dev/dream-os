// src/api/router.js
// Top-level /api/v2 router.
// Mounted in src/index.js as: app.use('/api/v2', require('./api/router'));
//
// Route map:
//   POST /api/v2/waitlist/signup              — landing page waitlist capture (P2-3) ✅
//   POST /api/v2/invite/validate              — check code valid + unconsumed (P2-3) ✅
//   POST /api/v2/invite/consume               — consume code + create user (P2-3) ✅
//   POST /api/v2/vendor/auth/send-otp         — vendor auth (P2-3) ✅
//   POST /api/v2/vendor/auth/verify-otp       — vendor auth + JWT (P2-4) ✅
//   POST /api/v2/vendor/auth/set-pin          — vendor auth (P2-3) ✅
//   POST /api/v2/vendor/auth/pin-login        — vendor auth + JWT (P2-4) ✅
//   POST /api/v2/vendor/auth/forgot-pin       — vendor auth (P2-3) ✅
//   POST /api/v2/couple/auth/send-otp         — couple auth (P2-3) ✅
//   POST /api/v2/couple/auth/verify-otp       — couple auth + JWT (P2-4) ✅
//   POST /api/v2/couple/auth/set-pin          — couple auth (P2-3) ✅
//   POST /api/v2/couple/auth/pin-login        — couple auth + JWT (P2-4) ✅
//   POST /api/v2/couple/auth/forgot-pin       — couple auth (P2-3) ✅
//   POST /api/v2/auth/pin-status              — pre-login PIN status lookup (P2-5) ✅
//   GET  /api/v2/landing-slides               — landing slideshow source (P2-5) ✅
//   GET  /api/v2/exploring-photos             — "Just Exploring" gallery (P2-5) ✅
//   GET  /api/v2/_test/whoami                 — JWT smoke test (P2-4, delete after Block 2) ✅
//   GET  /api/v2/vendor/me                    — vendor profile (P2-6a) ✅
//   GET  /api/v2/vendor/today/:vendorId       — TODAY dashboard (P2-6a) ✅
//   GET  /api/v2/vendor/leads/:vendorId       — leads pipeline list (P2-6a) ✅
//   PATCH /api/v2/vendor/leads/:leadId/state  — move lead through pipeline (P2-6a) ✅
//   GET  /api/v2/vendor/clients/:vendorId            — client roster (P2-6a) ✅
//   GET  /api/v2/vendor/clients/:vendorId/:clientId  — client detail (P2-6a) ✅
//   GET  /api/v2/vendor/invoices/:vendorId           — invoice list + summary (P2-6a) ✅
//   GET  /api/v2/vendor/expenses/:vendorId           — expense list + total_spent (P2-6a) ✅
//   GET  /api/v2/vendor/events/:vendorId             — calendar list (P2-6a) ✅
//   GET  /api/v2/vendor/context/:vendorId            — DreamAI PWA chat context (P2-6a) ✅
//   POST /api/v2/vendor/chat                         — DreamAI PWA chat turn (P2-6a) ✅
//
// Auth middleware: src/api/middleware/requireAuth.js
// Vendor ownership middleware: src/api/middleware/resolveVendor.js
//   Apply per-route on all Block 2+ protected endpoints.

'use strict';

const express          = require('express');
const router           = express.Router();

const waitlistRouter        = require('./waitlist');
const inviteRouter          = require('./invite');
const vendorAuthRouter      = require('./vendor/auth');
const coupleAuthRouter      = require('./couple/auth');
const pinStatusRouter       = require('./pin-status');
const landingSlidesRouter   = require('./landing-slides');
const exploringPhotosRouter = require('./exploring-photos');
const testRouter            = require('./_test/whoami');

router.use('/waitlist',           waitlistRouter);
router.use('/invite',             inviteRouter);
router.use('/vendor/auth',        vendorAuthRouter);
router.use('/couple/auth',        coupleAuthRouter);
router.use('/auth/pin-status',    pinStatusRouter);
router.use('/landing-slides',     landingSlidesRouter);
router.use('/exploring-photos',   exploringPhotosRouter);
router.use('/_test/whoami',       testRouter);
router.use('/hot-dates',          require('./public/hotDates'));
router.use('/vendor',             require('./vendor/core'));
router.use('/admin/discover',     require('./admin/discover'));
router.use('/admin/photos',       require('./admin/photos'));
router.use('/admin/couture',      require('./admin/couture'));
router.use('/admin/featured',     require('./admin/featured'));

// Block 2+ routers mounted here as they are built:
router.use('/discover',    require('./couple/discover'));                          // B-1: public, no auth
const requireCoupleAuth = require('./middleware/requireCoupleAuth');
router.use('/couple/muse', requireCoupleAuth, require('./couple/muse'));           // B-1: muse, auth required
router.use('/couple',      require('./couple/core'));                              // B-1/B-3: couple data

// B-3a: circle member / coplanner endpoints
const requireCircleMemberAuth = require('./middleware/requireCircleMemberAuth');
router.use('/auth/verify-pin',     require('./circle/verifyPin'));                // public — verify circle member PIN
router.use('/circle/session',      require('./circle/session'));                  // public — load circle session
router.use('/couple/profile',      require('./couple/profile'));                  // public — couple profile for coplanner
router.use('/frost/circle/feed',   requireCircleMemberAuth, require('./circle/feed'));      // activity feed
router.use('/circle/muse',         requireCircleMemberAuth, require('./circle/muse'));      // muse board + save + comment
router.use('/frost/circle/threads',requireCircleMemberAuth, require('./circle/threads'));   // thread list + messages
router.use('/frost/circle/messages',requireCircleMemberAuth, require('./circle/messages')); // send message
router.use('/dreamai',             requireCircleMemberAuth, require('./circle/dreamai'));   // DreamAi history + chat

module.exports = router;
