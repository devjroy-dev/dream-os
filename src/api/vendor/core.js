// src/api/vendor/core.js
// Vendor core sub-router. Mounted at /api/v2/vendor in src/api/router.js.
//
// Phase 2 endpoints built in order during P2-6a:
//   GET    /me                        ✅ P2-6a #1
//   GET    /today/:vendorId           ✅ P2-6a #2
//   GET    /leads/:vendorId           ✅ P2-6a #3
//   PATCH  /leads/:leadId/state       ✅ P2-6a #4
//   GET    /clients/:vendorId         ✅ P2-6a #5
//   GET    /clients/:vendorId/:clientId ✅ P2-6a #6
//   GET    /invoices/:vendorId        ✅ P2-6a #7
//   GET    /expenses/:vendorId        ✅ P2-6a #8
//   GET    /events/:vendorId          ✅ P2-6a #9
//   GET    /context/:vendorId         ✅ P2-6a #10
//   POST   /chat                      ✅ P2-6a #11 this writer
//
// Note: /auth/* is mounted directly under /vendor in router.js, not here.
// This sub-router only owns the non-auth vendor endpoints.

'use strict';

const express = require('express');
const router  = express.Router();

router.use('/me',       require('./me'));
router.use('/today',    require('../vendor-engine/today'));     // Phase 4 flip -> engine
// ── M-WORKLIST PHASE 3 · F-1 arm (b), chair-ruled ──────────────────────────
// ITS OWN SEGMENT, DELIBERATELY. The line ABOVE is the live `/today` route,
// consumed in production by the pwa Storefront's profile score. Phase 3's feed
// could have been mounted bare at '/today' and separated from it only by
// whether a path segment is present — that was refused: the estate deleted
// src/api/vendor/today.js for asserting a liveness it did not have, and a
// second reader at a live reader's address is the next instance of that class.
// §8.9's retirement of the engine reader is a CROSS-REPO seam (the Storefront
// consumer repoints in the same motion) and is chartered, not done here.
router.use('/worklist', require('./worklistToday'));
router.use('/leads',    require('./leads'));
router.use('/clients',  require('./clients'));
router.use('/invoices', require('./invoices'));
router.use('/expenses', require('./expenses'));
router.use('/events',   require('./events'));
router.use('/notes',    require('./notes'));        // note-to-self scratchpad (owner-direct)
router.use('/context',  require('./context'));
router.use('/cabinet',  require('../vendor-engine/cabinet'));   // Phase 4 flip -> engine
router.use('/binders',  require('../vendor-engine/binderWrite')); // Phase 4 flip -> engine
router.use('/binders',  require('../vendor-engine/ledger'));      // Phase 4 flip -> engine (was binderRead)
router.use('/chat',         require('../vendor-engine/chat'));   // Phase 4 flip -> engine (Victor)
router.use('/availability', require('./availability'));
router.use('/day',          require('./day'));      // TDW_04 B6-S2 — the day sheet's one round trip (P5, item 4)
router.use('/bands',        require('./bands'));    // TDW_04.5 P2 — the wedding-band view's one round trip (spec §P2)
router.use('/portfolio',   require('./portfolio'));
router.use('/discover',    require('./discover'));
// TDW_07 P4a — the Instagram connect action. THIS MOUNT IS LOAD-BEARING: it plus
// ig.js's '/callback' produce '/api/v2/vendor/ig/callback', which is the exact
// string igOAuth.IG_CALLBACK_PATH holds and igImport.isConfigured() asserts
// IG_REDIRECT_URI against. Move this line and the config assertion goes false
// and the entry goes dark — which is the intended failure, loudly, rather than a
// silent Instagram error page.
router.use('/ig',          require('./ig'));
router.use('/collab',      require('./collab'));
router.use('/roster',      require('./roster'));   // TDW_04.5 P4 — the roster plane + the bridge-mint door (CE-59 fork 2)
router.use('/referrals',   require('./referrals')); // Block 19 G5.1 — the overflow exchange's READ doors (the forward is on /leads)
router.use('/couture',     require('./couture'));
router.use('/featured',    require('./featured'));
// TDW_10 BILLING v2 — the vendor's own money door (subscribe/cancel/upgrade).
// Behind `billing.selfserve_enabled`, checked inside the file, default OFF.
router.use('/billing',     require('./billing'));
router.use('/studio',      require('./studio/index'));
// TDW_19 P0-B — Business Solutions (R-19.4). GETs live and answering the
// contract's empty shape; POSTs conditional-withheld inside the file. Mounted
// ABOVE the bare '/' below deliberately: `schedules` is mounted at the root and
// a root mount is reached for every path, so a segment router that needs to win
// its own prefix belongs before it, not after.
router.use('/solutions',   require('./solutions/index'));
// ── ROAD STEP 2b · THE TYPED MONEY PLANE (F-39.3, arm (c)) ─────────────────
// GET /money/books/:vendorId and nothing else. Read-only; the router declares
// no non-GET and a cell asserts that against its stack.
//
// MOUNTED ABOVE THE BARE '/' BELOW FOR THE REASON THE '/solutions' COMMENT
// GIVES, and it is worth repeating rather than pointing at: `schedules` is
// mounted at the ROOT and a root mount is reached for every path, so a segment
// router that must win its own prefix belongs before it. `schedules` owns
// `/invoices/:invoiceId/schedule` and `/schedules/:milestoneId` — it would not
// today swallow `/money/books/:vendorId`, so this is not a live collision being
// dodged. It is placement that stays correct when `schedules` grows a segment,
// which is the failure the line below it was written for.
router.use('/money',       require('./money'));
router.use('/',            require('./schedules'));
router.use('/contracts',   require('./contracts'));
router.use('/tds',         require('./tds'));

module.exports = router;
