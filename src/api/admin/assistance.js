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
    // F-41.100: the override is the CALLER's, sent only on a deliberate retry.
    confirm: b.confirm === true,
  });
  if (!out.ok) {
    const status = out.code === REFUSE.NOT_FOUND ? 404
      // ── F-41.102 · A REFUSAL IS NOT A SERVER FAULT ──────────────────────────
      // This list is the door's whole idea of "the caller is at fault"; anything
      // absent from it falls to 500. D3a added REFUSE.NO_CONSENT_RECORD to the
      // WRITER and not to this list, so Meta's Messaging Policy §1 refusal — the
      // most expected refusal on this door, since the plane is shut until the paste
      // box ships — answered 500 Internal Server Error. The founder's console read
      // it as the app breaking rather than as the estate declining to send.
      // The body was already correct (`code` + the sentence); only the status lied.
      //
      // THE SHAPE THAT CAUSED IT: a hand-maintained allow-list beside a REFUSE
      // roster that grows independently. Adding a code to the writer cannot make
      // this line notice. The cell below asserts the two stay in step — every
      // REFUSE value is either mapped here or named as deliberately a 500.
      : [REFUSE.CLOSED, REFUSE.VENDOR_UNAVAILABLE, REFUSE.ALREADY_HAS, REFUSE.BAD_TARGET, REFUSE.NO_PHONE, REFUSE.NO_CONSENT_RECORD, REFUSE.ALREADY_A_VENDOR, REFUSE.FANOUT_REACHED, 'ambiguous_prospect'].includes(out.code) ? 409
      : 500;
    // F-41.151: the refusal CARRIES THE VENDOR. The sentence names a handle and the
    // queue offers the TDW forward beside it; without this the founder reads "@DEV440"
    // and has to go find her himself, which is the second search the redirect exists
    // to save. F-41.102's lesson one field over: the body was right and the status
    // lied; here the status is right and the body must not be thin.
    return res.status(status).json({ ok: false, code: out.code, error: out.error, vendor: out.vendor || undefined, forwarded_count: out.forwarded_count, fanout_default: out.fanout_default });
  }
  return res.status(201).json(out);
}));

router.post('/:id/close', asyncHandler(async (req, res) => {
  const out = await closeAssistanceRequest(req.app.locals.supabase, req.params.id);
  if (!out.ok) return res.status(500).json({ ok: false, error: out.error });
  return res.json(out);
}));

module.exports = router;
