// src/api/vendor/solutions/paylinks.js — TDW · CE-47 · INS · PAY-A · the Payment links room's doors (Business Solutions ›
// Get paid). Thin: every answer is decided in src/lib/vendor/payLinks.js. Built to the door, not switched on.
'use strict';
const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const resolveVendor = require('../../middleware/resolveVendor');
const asyncHandler = require('../../../lib/asyncHandler');
const pl = require('../../../lib/vendor/payLinks');

const deps = (req) => ({ supabase: req.app.locals.supabase, ...(req.app.locals.payLinksDeps || {}) });
const bearer = (req) => String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
const send = (res, r) => res.status(r.status).json(r.body);
const door = (fn) => [requireAuth, resolveVendor(), asyncHandler(async (req, res) => send(res, await fn(req)))];

router.get('/', ...door((req) => pl.room(req.vendor.id, deps(req))));
router.post('/connect', ...door((req) => pl.connectStart(req.vendor.id, bearer(req), deps(req))));
router.post('/connect/finish', ...door((req) => pl.connectFinish(req.vendor.id, bearer(req), req.body || {}, deps(req))));
router.post('/disconnect', ...door((req) => pl.disconnect(req.vendor.id, deps(req))));
router.post('/links', ...door((req) => pl.makeLink(req.vendor.id, req.body || {}, deps(req))));
router.post('/refunds/:refundId/take-off', ...door((req) => pl.takeOffRefund(req.vendor.id, req.params.refundId, deps(req))));
// Her two answers to "Received, check this invoice's paid amount" (BINDER_UNCERTAIN): each once per round, with who and when.
router.post('/payments/:eventId/already-on', ...door((req) => pl.resolveUncertain(req.vendor.id, req.auth.user_id, req.params.eventId, 'already_on', deps(req))));
router.post('/payments/:eventId/add', ...door((req) => pl.resolveUncertain(req.vendor.id, req.auth.user_id, req.params.eventId, 'add', deps(req))));

module.exports = router;
