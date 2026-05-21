// src/api/vendor/studio/index.js
// Studio Suite sub-router. Mounted at /api/v2/vendor/studio in core.js.
// All routes inside each file apply requireAuth + resolveVendor + requirePrestige.
'use strict';

const express = require('express');
const router  = express.Router();

router.use('/briefing',      require('./briefing'));
router.use('/team',          require('./team'));
router.use('/tasks',         require('./tasks'));
router.use('/messages',      require('./messages'));
router.use('/team-payments', require('./payments'));

module.exports = router;
