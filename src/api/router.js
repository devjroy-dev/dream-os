// src/api/router.js
// Top-level /api/v2 router.
// Mounted in src/index.js as: app.use('/api/v2', require('./api/router'));

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
router.use('/register',           require('./register'));   // public — open phone-OTP signup
router.use('/vendor/auth',        vendorAuthRouter);
router.use('/couple/auth',        coupleAuthRouter);
router.use('/auth/pin-status',    pinStatusRouter);
router.use('/landing-slides',     landingSlidesRouter);
router.use('/exploring-photos',   exploringPhotosRouter);
router.use('/_test/whoami',       testRouter);
router.use('/hot-dates',          require('./public/hotDates'));
router.use('/crew',               require('./crew'));          // TDW_04.5 P3 — the crew page (public, capability-token; NEVER under /vendor)
router.use('/vendor/onboarding',  require('./vendor/onboarding'));
router.use('/vendor',             require('./vendor/core'));
router.use('/vendor-e',           require('./vendor-engine'));   // Vendor Suit Phase 3 (shadow doors)
// F-2 RULED (a): the json login door for Panel B. Mounted FIRST among the
// admin routes so no later '/admin' mount can shadow it.
router.use('/admin/login',           require('./admin/login'));
router.use('/admin/discover',        require('./admin/discover'));
router.use('/admin/photos',          require('./admin/photos'));
router.use('/admin/couture',         require('./admin/couture'));
router.use('/admin/featured',        require('./admin/featured'));
router.use('/admin/vendors',         require('./admin/vendors'));
router.use('/admin/couples',         require('./admin/couples'));
router.use('/admin/hot-dates',       require('./admin/hotDates'));
router.use('/admin/invites',         require('./admin/invites'));
router.use('/admin/config',          require('./admin/config'));
router.use('/admin',                 require('./admin/content'));
router.use('/admin/muse-pool',       require('./admin/musePool').adminRouter);
router.use('/admin/surprise-pool',   require('./admin/surprisePool'));
router.use('/admin/spotlight',       require('./admin/spotlight').adminRouter);
router.use('/admin/discover-heroes', require('./admin/discoverHeroes').adminRouter);
router.use('/admin/conversations',   require('./admin/conversations'));
router.use('/admin/failed-turns',    require('./admin/failedTurns'));   // TDW_05 P1b: dead-letter list/replay/discard
router.use('/admin/prospects',       require('./admin/prospects'));     // TDW_05 P3: prospect lane intake/board/cap/actions
router.use('/admin/waitlist',         require('./admin/waitlist'));
router.use('/admin/vendors/:vendorId/portfolio', require('./admin/vendorPortfolio'));
// Public endpoints for content surfaces
router.use('/muse-pool',             require('./admin/musePool').publicRouter);
router.use('/spotlight',             require('./admin/spotlight').publicRouter);
router.use('/discover-heroes',       require('./admin/discoverHeroes').publicRouter);

// Couple routes — profile must be before /couple catch-all
router.use('/discover',       require('./couple/discover'));
router.use('/discover/enquire', require('./couple/enquire'));
const requireCoupleAuth = require('./middleware/requireCoupleAuth');
router.use('/couple/me',      requireCoupleAuth, require('./couple/me'));
router.use('/couple/muse',    requireCoupleAuth, require('./couple/muse'));
router.use('/couple/profile', require('./couple/profile'));          // public, before /couple catch-all
router.use('/couple/onboarding', require('./couple/onboarding'));
router.use('/couple',         require('./couple/core'));

// ── B-3a: circle member / coplanner endpoints ────────────────────────────────
//
// THE CONFESSION THAT STOOD HERE IS DISCHARGED — F-07.72 ZIP 2. It read:
//   "No requireCircleMemberAuth — coplanner sends no JWT. Each endpoint
//    validates via userId/memberUserId/brideId params against circle_members
//    table directly."
// It was true for the life of the lane and it was the finding: seven doors
// trusted an identifier the caller supplied, and the cure sat written and
// unmounted in `./middleware/requireCircleMemberAuth` because nothing called it.
// ZIP 1 minted the lane's own token and taught every client to carry it; this
// ZIP spends it.
//
// TWO CLASSES, AND THE SPLIT IS NOT COSMETIC:
//
//   CLASS A — the co-planner's own doors. Every caller is a circle member and
//   the census proves it (eleven client call sites, all inside app/coplanner
//   plus the join page). These take the GUARD: no token, no answer.
//
//   CLASS B — /frost/circle/feed · /threads · /messages. These are SHARED and
//   their second caller is THE BRIDE, who is not a `circle_members` row. A
//   circle-member guard on them would answer her own circle chat with "Not a
//   circle member." Their enforcement lives INSIDE each handler, on
//   `resolveCircleIdentityIfPresent`'s three answers, and refuses only a caller
//   who proves nothing — see any of those files.
//
// `/auth/verify-pin` and `/circle/join/*` STAY UNGUARDED and must: they are the
// doors that ISSUE the credential. A mint that required a credential could never
// issue the first one, and `/circle/join/set-pin` is the invite token's own leg
// (CE ruling §4, confirmed).
const requireCircleMemberAuth = require('./middleware/requireCircleMemberAuth');
router.use('/auth/verify-pin',       require('./circle/verifyPin'));   // public — THE MINT
router.use('/circle/join',           require('./circle/join'));         // public — invite token validates, THE SECOND MINT
router.use('/circle/session',        requireCircleMemberAuth, require('./circle/session'));   // CLASS A
router.use('/circle/muse',           requireCircleMemberAuth, require('./circle/muse'));      // CLASS A
router.use('/dreamai',               requireCircleMemberAuth, require('./circle/dreamai'));   // CLASS A
router.use('/frost/circle/feed',     require('./circle/feed'));         // CLASS B — dual-lane, refuses in-handler
router.use('/frost/circle/threads',  require('./circle/threads'));      // CLASS B — dual-lane, refuses in-handler
router.use('/frost/circle/messages', require('./circle/messages'));     // CLASS B — dual-lane, refuses in-handler

// Demo admin routes (admin auth enforced inside the file)
router.use('/admin/demo', require('./admin/demoAdmin'));

// Demo public routes — no auth required
router.use('/demo/vendor', require('./demo/vendor'));
router.use('/demo/discover', require('./demo/vendor'));
router.use('/demo/bride',    require('./demo/bride'));



module.exports = router;
