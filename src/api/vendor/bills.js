// src/api/vendor/bills.js · CE-47 · PRO · P2 · BILLS INTO EXPENSES, her doors (mounted at /api/v2/vendor/bills).
//   GET    /:vendorId                          her bills not yet added, each with the days before TDW deletes it
//   POST   /:vendorId/upload-url               { mime } a one-time address to upload one bill into her private folder
//   POST   /:vendorId/drafts/:draftId/read     read it (Haiku, the bytes, one call); the fields and what does not hold
//   POST   /:vendorId/drafts/:draftId/confirm  her fields and category; check() is the gate; the expense is written
//   DELETE /:vendorId/drafts/:draftId          throw a bill away before adding it
//   GET    /:vendorId/expenses/:expenseId/file a ten-minute address to the bill kept with an expense
// The work is in src/lib/bills/bills.js; this file only sends its { status, body }.
'use strict';
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler = require('../../lib/asyncHandler');
const B = require('../../lib/bills/bills');

const auth = [requireAuth, resolveVendor({ paramName: 'vendorId' })];
const deps = (req) => ({ supabase: req.app.locals.supabase });
const send = (res, r) => res.status(r.status).json(r.body);

router.get('/:vendorId', ...auth, asyncHandler(async (req, res) => send(res, await B.drafts(req.vendor.id, deps(req)))));
router.post('/:vendorId/upload-url', ...auth, express.json(), asyncHandler(async (req, res) => send(res, await B.uploadUrl(req.vendor.id, req.body || {}, deps(req)))));
router.post('/:vendorId/drafts/:draftId/read', ...auth, asyncHandler(async (req, res) => send(res, await B.read(req.vendor.id, req.params.draftId, req.vendor, deps(req)))));
router.post('/:vendorId/drafts/:draftId/confirm', ...auth, express.json(), asyncHandler(async (req, res) => send(res, await B.confirm(req.vendor.id, req.params.draftId, req.body || {}, req.vendor, deps(req)))));
router.delete('/:vendorId/drafts/:draftId', ...auth, asyncHandler(async (req, res) => send(res, await B.discard(req.vendor.id, req.params.draftId, deps(req)))));
router.get('/:vendorId/expenses/:expenseId/file', ...auth, asyncHandler(async (req, res) => send(res, await B.fileUrl(req.vendor.id, req.params.expenseId, deps(req)))));
module.exports = router;
