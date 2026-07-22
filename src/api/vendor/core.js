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
router.use('/collab',      require('./collab'));
router.use('/roster',      require('./roster'));   // TDW_04.5 P4 — the roster plane + the bridge-mint door (CE-59 fork 2)
router.use('/couture',     require('./couture'));
router.use('/featured',    require('./featured'));
router.use('/studio',      require('./studio/index'));
router.use('/',            require('./schedules'));
router.use('/contracts',   require('./contracts'));
router.use('/tds',         require('./tds'));

module.exports = router;
