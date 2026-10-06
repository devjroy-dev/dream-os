'use strict';
// src/api/vendor/solutions/shop.js · CE-47 · OFF-A1 · her Off-season shop room's doors, mounted at /api/v2/vendor/solutions/shop
// (solutions/index.js). Every read and write carries her vendor id. The room opens when flag.off_shop is 'on', or 'armed' for
// OFF_WALK_VENDOR_ID (the walk); otherwise every door but GET / answers 404 and GET / says { open: false } (Coming soon).
const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const resolveVendor = require('../../middleware/resolveVendor');
const asyncHandler = require('../../../lib/asyncHandler');
const S = require('../../../lib/shop/shop');
const { shopOpen } = require('../../../lib/shop/gate');

const sb = (req) => req.app.locals.supabase;
const now = () => Date.now();
const send = (res, r) => res.status(r.status).json(r.body);
const gate = asyncHandler(async (req, res, next) => ((await shopOpen(req.vendor.id)) ? next() : res.status(404).json({ ok: false, error: S.LINES.notFound })));

router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  if (!(await shopOpen(req.vendor.id))) return res.status(200).json({ ok: true, open: false, items: [], orders: [] });
  try {
    const [items, orders] = await Promise.all([S.listItems(sb(req), req.vendor.id, now()), S.listOrders(sb(req), req.vendor.id)]);
    return res.status(200).json({ ok: true, open: true, items, orders });
  } catch (e) { console.error(`[shop] ${req.vendor.id} room read failed: ${e && e.message}`); return res.status(503).json({ ok: false, error: S.LINES.failed }); }
}));
router.post('/items', requireAuth, resolveVendor(), gate, asyncHandler(async (req, res) => send(res, await S.saveItem(sb(req), req.vendor.id, null, req.body, now()))));
router.put('/items/:id', requireAuth, resolveVendor(), gate, asyncHandler(async (req, res) => send(res, await S.saveItem(sb(req), req.vendor.id, req.params.id, req.body, now()))));
router.delete('/items/:id', requireAuth, resolveVendor(), gate, asyncHandler(async (req, res) => send(res, await S.removeItem(sb(req), req.vendor.id, req.params.id, now()))));
router.post('/orders/:id/paid', requireAuth, resolveVendor(), gate, asyncHandler(async (req, res) => send(res, await S.markPaid(sb(req), req.vendor.id, req.params.id, { by: 'vendor', nowMs: now() }))));
router.post('/orders/:id/cancel', requireAuth, resolveVendor(), gate, asyncHandler(async (req, res) => send(res, await S.cancelOrder(sb(req), req.vendor.id, req.params.id, now()))));
router.post('/vouchers/check', requireAuth, resolveVendor(), gate, asyncHandler(async (req, res) => send(res, await S.checkCode(sb(req), req.vendor.id, req.body && req.body.code, now()))));
router.post('/vouchers/redeem', requireAuth, resolveVendor(), gate, asyncHandler(async (req, res) => send(res, await S.redeem(sb(req), req.vendor.id, req.body && req.body.code, req.body && req.body.note, now()))));

module.exports = router;
