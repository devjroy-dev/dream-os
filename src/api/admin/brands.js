'use strict';
// src/api/admin/brands.js · CE-47 · PRO · P3 · More > Brands (mounted at /api/v2/admin/brands via router.js, above the
// broad '/admin' mount). The brand list vendors see in Brand collaborations. A row leads with the Instagram handle the
// brand's own website shows; an email is kept only if it is a role address on the brand's own domain (rules.js).
//   GET  /?state=listed|hidden      the list, with how many pitches each brand has had
//   POST /                          add a brand
//   PATCH /:id                      change a brand
//   POST /:id/state                 { state: 'listed' | 'hidden' }
const express = require('express');
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const B = require('../../lib/brands/brands');
const { TRADES, TRADE_WORD } = require('../../lib/brands/rules');
const { todayIST } = require('../../lib/papers/verifiedWeddings');

const router = express.Router();
router.use(requireAdmin);
router.use(express.json());
const who = (req) => (req.admin && (req.admin.name || req.admin.id)) || 'admin';
const send = (res, r, key) => (r.ok ? okRes(res, { [key]: r[key] }) : errRes(res, r.status, r.error));

router.get('/', asyncHandler(async (req, res) => {
  const r = await B.adminList({ supabase: req.app.locals.supabase, state: String(req.query.state || '') });
  return r.ok ? okRes(res, { brands: r.brands, trades: TRADES.map((k) => ({ key: k, word: TRADE_WORD[k] })) }) : errRes(res, r.status, r.error);
}));
router.post('/', asyncHandler(async (req, res) => send(res, await B.adminSave({ supabase: req.app.locals.supabase, body: req.body || {}, today: todayIST(), who: who(req) }), 'brand')));
router.patch('/:id', asyncHandler(async (req, res) => send(res, await B.adminSave({ supabase: req.app.locals.supabase, id: req.params.id, body: req.body || {}, today: todayIST(), who: who(req) }), 'brand')));
router.post('/:id/state', asyncHandler(async (req, res) => send(res, await B.adminState({ supabase: req.app.locals.supabase, id: req.params.id, state: String((req.body || {}).state || '') }), 'brand')));
module.exports = router;
