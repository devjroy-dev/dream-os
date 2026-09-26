'use strict';
// src/api/vendor/solutions/quiet.js · CE-45 · IGD-1 · CUT 2a-ii · the quiet time's door (QT1, QT2), mounted at
// /api/v2/vendor/solutions/quiet. vendors.reply_quiet_minutes (0173) is its one home. Dark by the Instagram lane until 2b gives it
// an effect (igRoom.quiet).
const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const resolveVendor = require('../../middleware/resolveVendor');
const asyncHandler = require('../../../lib/asyncHandler');
const igRoom = require('../../../lib/instagram/igRoom');

const deps = (req) => ({ supabase: req.app.locals.supabase, env: process.env });
const send = (res, r) => (r.status === 200 ? res.status(200).json(r.body) : res.status(r.status).json({ ok: false }));
router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => send(res, await igRoom.quiet(req.vendor.id, deps(req)))));
router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) =>
  send(res, await igRoom.quiet(req.vendor.id, deps(req), req.body ? req.body.minutes : null))));

module.exports = router;
