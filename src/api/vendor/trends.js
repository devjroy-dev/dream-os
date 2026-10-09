// src/api/vendor/trends.js · CE-47 · PRO · P3 · THE TREND ROOM, her doors (mounted at /api/v2/vendor/trends).
//   GET /:vendorId                     the newest brief for her trade in her city that she may see, and past weeks
//   GET /:vendorId/weeks/:briefId      one past week's brief (her own trade and city only)
// Counts only: no client or vendor is named (src/lib/trends/build.js).
'use strict';
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const T = require('../../lib/trends/trends');

const auth = [requireAuth, resolveVendor({ paramName: 'vendorId' })];
const send = (res, r, key) => (r.ok ? okRes(res, { [key]: r[key] }) : errRes(res, r.status, r.error));

router.get('/:vendorId', ...auth, asyncHandler(async (req, res) => send(res, await T.room({ supabase: req.app.locals.supabase, vendor: req.vendor }), 'room')));
router.get('/:vendorId/weeks/:briefId', ...auth, asyncHandler(async (req, res) =>
  send(res, await T.week({ supabase: req.app.locals.supabase, vendor: req.vendor, briefId: req.params.briefId }), 'brief')));
module.exports = router;
