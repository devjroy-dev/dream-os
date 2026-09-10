// src/api/vendor/exchange.js
// CE-42 · SEAT R7 · 4c-3b-1s — G5.3 THE INFLUENCER EXCHANGE, THE DOORS.
//
//   GET  /api/v2/vendor/exchange                       — the role: which glass opens
//   GET  /api/v2/vendor/exchange/creators              — the browse list (S2(b))
//   GET  /api/v2/vendor/exchange/creators/:id          — the reach card (S3)
//   POST /api/v2/vendor/exchange/creators/:id/requests — send (S4(b))
//   GET  /api/v2/vendor/exchange/requests              — Your requests (S5)
//   POST /api/v2/vendor/exchange/requests/:id/withdraw — sent → withdrawn
//   POST /api/v2/vendor/exchange/requests/:id/complete — accepted → completed
//   GET  /api/v2/vendor/exchange/inbox                 — Requests to you (Y1)
//   POST /api/v2/vendor/exchange/inbox/:id/accept      — sent → accepted
//   POST /api/v2/vendor/exchange/inbox/:id/decline     — sent → declined
//
// ⚠ THESE TEN ADDRESSES AND THEIR PAYLOADS WERE FIXED BY THE PWA HALF, WHICH
// LANDED FIRST (4c-3b-1p, dreamos-pwa 1327f434, `lib/vendor/api/exchange.ts`).
// That file called itself a contract offered rather than a read of a live door,
// and this file is the answer to it. The shapes were compared field by field at
// this cut; b78 C10 asserts the ten paths and the empty verb bodies against the
// client's own source is NOT possible from this repo, so the comparison is
// recorded in the handover instead of pretended at in a cell.
//
// Auth: vendor JWT, `resolveVendor` mode A — every path is the caller's own side.
// THE DOOR DECIDES THE ROLE (shape ruling, 2026-09-10): a content_creator opens on
// her inbox and the sender's doors refuse her; a vendor calling the inbox is
// refused the other way. The pwa reads `role` from `GET /` and never guesses.
//
// ⚠ THIS FILE HOLDS NO POSTGREST CHAIN. Every read and every write is a call into
// `src/lib/vendor/exchange.js` (the one-writer law, ruling (iii)).
//
// ⚠ THE OPT-IN IS NOT WRITTEN HERE. `exchange_discoverable` rides `PATCH /me`'s
// BOOLEAN_FIELDS (ruling (i)) — one writer for the vendor's own posture. This file
// only reads it back, and only through the browse predicate.

'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const X = require('../../lib/vendor/exchange');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// One status per refusal code, decided once. A lib error with NO code is a
// database failure and is the 500 it is — never flattened into a 400 that would
// tell the caller their request was wrong when it was not.
const STATUS = {
  [X.REFUSE.NOT_A_SENDER]:  403,
  [X.REFUSE.NOT_A_CREATOR]: 403,
  [X.REFUSE.NOT_FOUND]:     404,
  [X.REFUSE.NOT_IN_STATE]:  409,
  [X.REFUSE.INVALID]:       400,
};

function refuse(res, result) {
  if (!result.code) return errRes(res, 500, result.error || 'Something went wrong.');
  return errRes(res, STATUS[result.code] || 400, result.error, result.code);
}

/** A malformed id is answered by the door, not carried into a query. Returns null
 *  AND has already responded when it refuses. */
function idOr400(req, res) {
  const id = req.params.id;
  if (typeof id === 'string' && UUID.test(id)) return id;
  errRes(res, 400, 'Not a request id.');
  return null;
}

// ── GET / — the role ─────────────────────────────────────────────────────────
// One read, from the row the middleware already has. `opted_in` is null for a
// sender rather than false: she has no opt-in, and false would be a fact about a
// switch she does not own.
router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const role = X.roleOf(req.vendor);
  return okRes(res, {
    role,
    opted_in: role === 'creator' ? req.vendor.exchange_discoverable === true : null,
  });
}));

// ── GET /creators — the browse list ──────────────────────────────────────────
router.get('/creators', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  // ⚠ `craft` IS ACCEPTED AND NOT USED AS A FILTER, and that is stated rather
  // than quietly dropped. On the shell's sheet `craft` is what the SENDER offers,
  // not a property of the creator — every row in this list is a content_creator
  // by predicate. Treating it as a category filter would return an empty list for
  // every value and look like a broken door.
  const result = await X.browseCreators(supabase, req.vendor, {
    city:  typeof req.query.city  === 'string' ? req.query.city  : undefined,
    craft: typeof req.query.craft === 'string' ? req.query.craft : undefined,
  });
  if (!result.ok) return refuse(res, result);
  return okRes(res, { creators: result.creators });
}));

// ── GET /creators/:id — the reach card ───────────────────────────────────────
router.get('/creators/:id', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const id = idOr400(req, res); if (!id) return;
  const result = await X.getCreatorCard(req.app.locals.supabase, req.vendor, id);
  if (!result.ok) return refuse(res, result);
  return okRes(res, { creator: result.creator });
}));

// ── POST /creators/:id/requests — send ───────────────────────────────────────
router.post('/creators/:id/requests', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const id = idOr400(req, res); if (!id) return;
  const result = await X.createRequest(req.app.locals.supabase, req.vendor, id, req.body);
  if (!result.ok) return refuse(res, result);
  return okRes(res, { request: result.request });
}));

// ── GET /requests — her sent requests ────────────────────────────────────────
router.get('/requests', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const result = await X.listMine(req.app.locals.supabase, req.vendor);
  if (!result.ok) return refuse(res, result);
  return okRes(res, { requests: result.requests });
}));

// ── GET /inbox — the creator's seat ──────────────────────────────────────────
router.get('/inbox', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const result = await X.listInbox(req.app.locals.supabase, req.vendor);
  if (!result.ok) return refuse(res, result);
  return okRes(res, { requests: result.requests });
}));

// ── THE FOUR VERBS ───────────────────────────────────────────────────────────
// Each posts an EMPTY body. A door that accepted `{state:'accepted'}` would be a
// door that accepts `{state:'completed'}` on someone else's row; the verb is in
// the path and the machine is in the lib.
function verbDoor(path, verb) {
  router.post(path, requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
    const id = idOr400(req, res); if (!id) return;
    const result = await X.transition(req.app.locals.supabase, req.vendor, id, verb);
    if (!result.ok) return refuse(res, result);
    return okRes(res, { request: result.request });
  }));
}

verbDoor('/requests/:id/withdraw', 'withdraw');
verbDoor('/requests/:id/complete', 'complete');
verbDoor('/inbox/:id/accept',      'accept');
verbDoor('/inbox/:id/decline',     'decline');

module.exports = router;
