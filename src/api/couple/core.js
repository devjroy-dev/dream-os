// src/api/couple/core.js
// Couple data router — mounted at /api/v2/couple
// Sub-routers are added per block and uncommented as each block ships.

'use strict';
const express = require('express');
const router  = express.Router();

const requireCoupleAuth = require('../middleware/requireCoupleAuth');

// Auth gate — all couple data routes require a valid couple JWT.
// Sub-routers added per block mount below this line so they inherit the gate.
router.use(requireCoupleAuth);

// B-1: discover + muse
// router.use('/discover', require('./discover'));  // public — mounted on main router directly
// Muse upload endpoints accept base64 images — default 100kb body limit is too small.
// Bump to 12mb (covers a 9mb image after 33% base64 inflation, with headroom).
router.use('/muse',     express.json({ limit: '12mb' }), require('./muse'));

// B-3: couple data
router.use('/me',       require('./me'));
router.use('/today',    require('./today'));
router.use('/events',   require('./events'));
router.use('/expenses', require('./expenses'));
router.use('/circle',   require('./circle'));
router.use('/bookings', require('./bookings'));
router.use('/receipts', require('./receipts'));

// B-5: chat
router.use('/chat',     require('./chat'));

// B-6: taste profile + Surprise Me
router.use('/taste',    require('./taste'));

module.exports = router;
