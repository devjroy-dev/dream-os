// src/api/vendor/gear.js · CE-47 · PRO · P2 · GEAR SHARING, her doors (mounted at /api/v2/vendor/gear).
//   GET  /:vendorId                                  the Gear room: her items, items listed in her city, requests both ways
//   POST /:vendorId/items                            list one: { item, value_rs, price_per_day_rs, city, note }
//   POST /:vendorId/items/:itemId/withdraw           withdraw her item (one way)
//   POST /:vendorId/items/:itemId/ask                ask for another vendor's item: { date_from, date_to, note }
//   POST /:vendorId/requests/:requestId/accept       the owner accepts (0211's pro_gear_accept refuses an overlap)
//   POST /:vendorId/requests/:requestId/decline      the owner declines a request still asked
//   POST /:vendorId/requests/:requestId/cancel       the borrower cancels; or the owner cancels an accepted loan
// Nothing here touches Calendar, and no money passes through TDW (P2-F4, P2-F5).
'use strict';
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const G = require('../../lib/gear/gear');
const { todayIST } = require('../../lib/papers/verifiedWeddings');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const auth = [requireAuth, resolveVendor({ paramName: 'vendorId' })];
const send = (res, r, key) => (r.ok ? okRes(res, key ? { [key]: r[key] } : { done: true }) : errRes(res, r.status, r.error));
const idOr404 = (id, res, what) => (UUID.test(id) ? true : (errRes(res, 404, `That ${what} is not in your account.`), false));

router.get('/:vendorId', ...auth, asyncHandler(async (req, res) => send(res, await G.room({ supabase: req.app.locals.supabase, vendor: req.vendor }), 'room')));
router.post('/:vendorId/items', ...auth, express.json(), asyncHandler(async (req, res) =>
  send(res, await G.listItem({ supabase: req.app.locals.supabase, vendor: req.vendor, body: req.body || {} }), 'item')));
router.post('/:vendorId/items/:itemId/withdraw', ...auth, asyncHandler(async (req, res) => {
  if (!idOr404(req.params.itemId, res, 'item')) return undefined;
  return send(res, await G.withdrawItem({ supabase: req.app.locals.supabase, vendor: req.vendor, itemId: req.params.itemId }));
}));
router.post('/:vendorId/items/:itemId/ask', ...auth, express.json(), asyncHandler(async (req, res) => {
  if (!UUID.test(req.params.itemId)) return errRes(res, 404, 'This item is no longer listed.');
  return send(res, await G.ask({ supabase: req.app.locals.supabase, vendor: req.vendor, itemId: req.params.itemId, body: req.body || {}, today: todayIST() }), 'request');
}));
router.post('/:vendorId/requests/:requestId/accept', ...auth, asyncHandler(async (req, res) => {
  if (!idOr404(req.params.requestId, res, 'request')) return undefined;
  return send(res, await G.accept({ supabase: req.app.locals.supabase, vendor: req.vendor, requestId: req.params.requestId }), 'request');
}));
for (const [verb, to] of [['decline', 'declined'], ['cancel', 'cancelled']]) {
  router.post(`/:vendorId/requests/:requestId/${verb}`, ...auth, asyncHandler(async (req, res) => {
    if (!idOr404(req.params.requestId, res, 'request')) return undefined;
    return send(res, await G.decide({ supabase: req.app.locals.supabase, vendor: req.vendor, requestId: req.params.requestId, to }), 'request');
  }));
}
module.exports = router;
