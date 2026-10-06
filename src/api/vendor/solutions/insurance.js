// src/api/vendor/solutions/insurance.js — TDW · CE-47 · INS-A · the Insurance room's doors (Business Solutions ›
// Run the business). Thin: every answer is decided in src/lib/vendor/insuranceRoom.js and only sent here.
'use strict';
const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const resolveVendor = require('../../middleware/resolveVendor');
const asyncHandler = require('../../../lib/asyncHandler');
const room = require('../../../lib/vendor/insuranceRoom');

const deps = (req) => ({ supabase: req.app.locals.supabase, ...(req.app.locals.insuranceDeps || {}) });
const send = (res, r) => res.status(r.status).json(r.body);
const door = (fn) => [requireAuth, resolveVendor(), asyncHandler(async (req, res) => send(res, await fn(req)))];

router.get('/', ...door((req) => room.room(req.vendor.id, deps(req))));
router.post('/kinds', ...door(async (req) => room.kinds(req.body)));
router.post('/quote-brief', ...door((req) => room.quoteBrief(req.vendor.id, req.body, deps(req))));
router.post('/policies/upload-url', ...door((req) => room.uploadUrl(req.vendor.id, req.body, deps(req))));
router.post('/policies/read', ...door((req) => room.read(req.vendor.id, req.body, deps(req))));
router.post('/policies', ...door((req) => room.save(req.vendor.id, req.body, deps(req))));
router.patch('/policies/:id', ...door((req) => room.save(req.vendor.id, req.body, deps(req), req.params.id)));
router.delete('/policies/:id', ...door((req) => room.remove(req.vendor.id, req.params.id, deps(req))));
router.get('/policies/:id/document', ...door((req) => room.documentUrl(req.vendor.id, req.params.id, deps(req))));
router.patch('/settings', ...door((req) => room.settings(req.vendor.id, req.body, deps(req))));

module.exports = router;
