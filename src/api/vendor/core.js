// src/api/vendor/core.js
// Vendor core sub-router. Mounted at /api/v2/vendor in src/api/router.js.
//
// Phase 2 endpoints built in order during P2-6a:
//   GET    /me                        ✅ this writer
//   GET    /today/:vendorId           ⏳
//   GET    /leads/:vendorId           ⏳
//   PATCH  /leads/:leadId/state       ⏳
//   GET    /clients/:vendorId         ⏳
//   GET    /clients/:vendorId/:clientId ⏳
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

router.use('/me', require('./me'));

module.exports = router;
