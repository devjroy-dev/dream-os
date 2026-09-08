// src/api/admin/assistance.js — BLOCK 20 · CONCIERGE · THE ADMIN DOORS.
// Mounted at /api/v2/admin/assistance (src/api/router.js), every route behind
// `requireAdmin` (src/api/admin/requireAdmin.js:38 — the same session material
// every admin door verifies; F-07.85's end-state).
//
//   GET  /                         the queue   ?status=open|forwarded|closed
//   GET  /vendors                  on-platform forward targets ?category=&city=&q=
//   GET  /:id                      one request with items + forwards
//   POST /                         admin-typed intake (R-41.29: phone + name, no couple yet)
//   POST /items/:itemId/forward    { kind:'vendor', vendor_id } | { kind:'prospect', phone, ig_handle?, name? }
//   POST /:id/close                the founder's hand
//
// No route here names an assistance_* table; every read and write goes through
// src/lib/couple/assistance.js (one home). The forward's send arm is dark there;
// this door only reports `dark.reason` back so the queue can show why.
//
// The 'Typed by admin' rows the mock draws are requests with origin='admin' and
// couple_id NULL; seat D backfills couple_id by last-ten on join.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const requireAdmin = require('./requireAdmin');
const {
  createAssistanceRequest, forwardAssistanceItem, closeAssistanceRequest,
  listAssistanceRequests, getAssistanceRequest, searchForwardTargets, REFUSE,
} = require('../../lib/couple/assistance');

router.use(requireAdmin);

router.get('/', asyncHandler(async (req, res) => {
  const out = await listAssistanceRequests(req.app.locals.supabase, { status: req.query.status, limit: req.query.limit });
  if (!out.ok) return res.status(500).json({ ok: false, error: out.error });
  return res.json(out);
}));

// Declared before `/:id` so the literal wins the match.
router.get('/vendors', asyncHandler(async (req, res) => {
  const { category, city, q, limit } = req.query || {};
  const out = await searchForwardTargets(req.app.locals.supabase, { category, city, q, limit });
  if (!out.ok) return res.status(500).json({ ok: false, error: out.error });
  return res.json(out);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const out = await getAssistanceRequest(req.app.locals.supabase, req.params.id);
  if (!out.ok) return res.status(out.code === REFUSE.NOT_FOUND ? 404 : 500).json({ ok: false, code: out.code, error: out.error });
  return res.json(out);
}));

router.post('/', asyncHandler(async (req, res) => {
  const b = req.body || {};
  const out = await createAssistanceRequest(req.app.locals.supabase, {
    couple_id:    null,
    phone:        b.phone,
    name:         b.name,
    city:         b.city,
    area:         b.area,
    wedding_date: b.wedding_date,
    brief:        b.brief,
    origin:       'admin',
    items:        b.items,
  });
  if (!out.ok) return res.status(out.code === 'insert_failed' || out.code === 'items_failed' ? 500 : 400).json({ ok: false, code: out.code, error: out.error });
  return res.status(201).json({ ok: true, request: out.request, items: out.items, admin_notified: !!(out.notify && out.notify.sent) });
}));

router.post('/items/:itemId/forward', asyncHandler(async (req, res) => {
  const b = req.body || {};
  const target = b.kind === 'vendor'
    ? { kind: 'vendor', vendor_id: b.vendor_id }
    : b.kind === 'prospect'
      ? { kind: 'prospect', phone: b.phone, ig_handle: b.ig_handle, name: b.name }
      : null;
  if (!target) return res.status(400).json({ ok: false, code: REFUSE.BAD_TARGET, error: 'kind must be vendor or prospect.' });
  const out = await forwardAssistanceItem(req.app.locals.supabase, {
    itemId: req.params.itemId, target, actor: req.admin && req.admin.email ? req.admin.email : 'admin',
  });
  if (!out.ok) {
    const status = out.code === REFUSE.NOT_FOUND ? 404
      : [REFUSE.CLOSED, REFUSE.VENDOR_UNAVAILABLE, REFUSE.ALREADY_HAS, REFUSE.BAD_TARGET, REFUSE.NO_PHONE, 'ambiguous_prospect'].includes(out.code) ? 409
      : 500;
    return res.status(status).json({ ok: false, code: out.code, error: out.error });
  }
  return res.status(201).json(out);
}));

router.post('/:id/close', asyncHandler(async (req, res) => {
  const out = await closeAssistanceRequest(req.app.locals.supabase, req.params.id);
  if (!out.ok) return res.status(500).json({ ok: false, error: out.error });
  return res.json(out);
}));

module.exports = router;
