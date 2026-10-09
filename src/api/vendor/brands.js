// src/api/vendor/brands.js · CE-47 · PRO · P3 · BRAND COLLABORATIONS, her doors (mounted at /api/v2/vendor/brands).
//   GET  /:vendorId                              the room: her kit, this week's pitch count, brands that fit her, her pitches
//   GET  /:vendorId/brands/:brandId              one brand, with the pitch TDW wrote for her and where to send it
//   POST /:vendorId/brands/:brandId/sent         she says she sent it: { channel } (0210's pro_pitch_record decides)
//   POST /:vendorId/pitches/:pitchId             she moves a pitch to its next step: { to?, post_due? }
//   POST /:vendorId/kit                          her kit settings: { contact_email }
// TDW never sends a pitch and takes nothing from a collaboration.
'use strict';
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const B = require('../../lib/brands/brands');
const { todayIST } = require('../../lib/papers/verifiedWeddings');

const auth = [requireAuth, resolveVendor({ paramName: 'vendorId' })];
const send = (res, r, key) => (r.ok ? okRes(res, key ? { [key]: r[key] } : { done: true }) : errRes(res, r.status, r.error));

router.get('/:vendorId', ...auth, asyncHandler(async (req, res) => send(res, await B.room({ supabase: req.app.locals.supabase, vendor: req.vendor }), 'room')));
router.get('/:vendorId/brands/:brandId', ...auth, asyncHandler(async (req, res) =>
  send(res, await B.brand({ supabase: req.app.locals.supabase, vendor: req.vendor, brandId: req.params.brandId }), 'brand')));
router.post('/:vendorId/brands/:brandId/sent', ...auth, express.json(), asyncHandler(async (req, res) =>
  send(res, await B.record({ supabase: req.app.locals.supabase, vendor: req.vendor, brandId: req.params.brandId, body: req.body || {} }), 'counts')));
router.post('/:vendorId/pitches/:pitchId', ...auth, express.json(), asyncHandler(async (req, res) =>
  send(res, await B.move({ supabase: req.app.locals.supabase, vendor: req.vendor, pitchId: req.params.pitchId, body: req.body || {}, today: todayIST() }), 'pitch')));
router.post('/:vendorId/kit', ...auth, express.json(), asyncHandler(async (req, res) =>
  send(res, await B.saveKit({ supabase: req.app.locals.supabase, vendor: req.vendor, body: req.body || {} }), 'kit')));
module.exports = router;
