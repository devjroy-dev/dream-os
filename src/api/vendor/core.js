// src/api/vendor/core.js
// Vendor core sub-router. Mounted at /api/v2/vendor in src/api/router.js.
//
// Phase 2 endpoints built in order during P2-6a:
//   GET    /me                        ✅ P2-6a #1
//   GET    /today/:vendorId           ✅ P2-6a #2
//   GET    /leads/:vendorId           ✅ P2-6a #3
//   PATCH  /leads/:leadId/state       ✅ P2-6a #4
//   GET    /clients/:vendorId         ✅ P2-6a #5 this writer
//   GET    /clients/:vendorId/:clientId ✅ P2-6a #6 this writer
//   GET    /invoices/:vendorId        ⏳
//   GET    /expenses/:vendorId        ⏳
//   GET    /events/:vendorId          ⏳
//   GET    /context/:vendorId         ⏳
//   POST   /chat                      ⏳
//
// Note: /auth/* is mounted directly under /vendor in router.js, not here.
// This sub-router only owns the non-auth vendor endpoints.

'use strict';

const express = require('express');
const router  = express.Router();

router.use('/me',      require('./me'));
router.use('/today',   require('./today'));
router.use('/leads',   require('./leads'));
router.use('/clients', require('./clients'));

module.exports = router;
