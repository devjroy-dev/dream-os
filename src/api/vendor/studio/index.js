// src/api/vendor/studio/index.js
// Studio Suite sub-router. Mounted at /api/v2/vendor/studio in core.js.
// All routes inside each file apply requireAuth + resolveVendor. No tier gate:
// R-39.7 (founder, 2026-08-29) opened the Studio Suite to every tier and
// retired requirePrestige with its readers — Prestige names no exclusive.
'use strict';

const express = require('express');
const router  = express.Router();

router.use('/briefing',      require('./briefing'));
router.use('/team',          require('./team'));
router.use('/tasks',         require('./tasks'));
router.use('/messages',      require('./messages'));
router.use('/team-payments', require('./payments'));
// BLOCK 19 · G1.1 — the wedding-pages room's doors (R-G11.12's sibling: the room
// is reached from Business Solutions, but its DOORS are Studio Suite doors like
// every other owner-scoped write surface).
router.use('/weddings',      require('./weddings'));

module.exports = router;
