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
router.use('/vendor/auth',        vendorAuthRouter);
router.use('/couple/auth',        coupleAuthRouter);
router.use('/auth/pin-status',    pinStatusRouter);
router.use('/landing-slides',     landingSlidesRouter);
router.use('/exploring-photos',   exploringPhotosRouter);
router.use('/_test/whoami',       testRouter);
router.use('/hot-dates',          require('./public/hotDates'));
router.use('/vendor/onboarding',  require('./vendor/onboarding'));
router.use('/vendor',             require('./vendor/core'));
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
router.use('/couple/muse',    requireCoupleAuth, require('./couple/muse'));
router.use('/couple/profile', require('./couple/profile'));          // public, before /couple catch-all
router.use('/couple/onboarding', require('./couple/onboarding'));
router.use('/couple',         require('./couple/core'));

// B-3a: circle member / coplanner endpoints
// No requireCircleMemberAuth — coplanner sends no JWT. Each endpoint validates
// via userId/memberUserId/brideId params against circle_members table directly.
router.use('/auth/verify-pin',       require('./circle/verifyPin'));   // public
router.use('/circle/join',           require('./circle/join'));         // public — invite token validates
router.use('/circle/session',        require('./circle/session'));      // public
router.use('/frost/circle/feed',     require('./circle/feed'));         // brideId validates couple exists
router.use('/circle/muse',           require('./circle/muse'));         // memberUserId validates circle_member
router.use('/frost/circle/threads',  require('./circle/threads'));      // brideId scopes conversations
router.use('/frost/circle/messages', require('./circle/messages'));     // no per-user auth
router.use('/dreamai',               require('./circle/dreamai'));      // user_id + primary_user_id validate

// Demo admin routes (admin auth enforced inside the file)
router.use('/admin/demo', require('./admin/demoAdmin'));

// Demo public routes — no auth required
router.use('/demo/vendor', require('./demo/vendor'));
router.use('/demo/discover', require('./demo/vendor'));
router.use('/demo/bride',    require('./demo/bride'));



module.exports = router;
