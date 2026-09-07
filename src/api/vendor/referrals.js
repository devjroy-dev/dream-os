// src/api/vendor/referrals.js
// BLOCK 19 G5.1 — REFERRALS & PARTNERS. The room's read doors.
//
//   GET /api/v2/vendor/referrals            — the balance: sent, received, per peer
//   GET /api/v2/vendor/referrals/peers?q=   — the forward sheet's SEARCH (R-40.104)
//
// Auth: vendor JWT, resolveVendor mode A (no param — the room is always the
// caller's own). Neither path carries a `:vendorId`, deliberately: a room about
// who you exchange work with has no legitimate shape in which one vendor asks
// for another's.
//
// ⚠ THE WRITE DOOR IS NOT HERE. The forward is
// `POST /api/v2/vendor/leads/:leadId/forward`, on the leads router, because it
// is a thing done TO A LEAD and mode-C `resolveVendor` is what proves the lead
// is the caller's. That door's own header carries the full reasoning; this note
// exists so a reader looking for the writer does not conclude it is missing.
//
// ⚠ MONEY NEVER APPEARS ON THIS PLANE (master §7, R-G51.6). The unit is
// FORWARDS — not weddings, which `lead_referrals` cannot answer for, and not
// rupees, which this estate refuses to put on an exchange between vendors.

'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { getReferralRoom, searchPeers, MIN_PEER_QUERY } = require('../../lib/vendor/referrals');

// ── GET / — the room ─────────────────────────────────────────────────────────
router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result = await getReferralRoom(supabase, req.vendor.id);
  if (!result.ok) return errRes(res, 500, result.error);
  return okRes(res, {
    sent_count:     result.sent_count,
    received_count: result.received_count,
    peers:          result.peers,
  });
}));

// ── GET /peers — the forward sheet's SEARCH  (R-40.104) ──────────────────────
// ⚠ THIS DOOR USED TO BE A PICKER AND THE ADDRESS DID NOT CHANGE. It listed the
// roster and nothing else, because R-G51.1 made a linked roster edge the
// boundary of the exchange. The founder repealed that: the roster is now the
// SUGGESTION (`worked_with`), never the edge of the world. The address stays
// `/referrals/peers` because it still answers one question — who may I forward
// to — and a rename would have cost `API.referralPeers()` a byte for nothing.
//
// ⚠ THE SELECTION LOGIC IS NOT HERE. `searchPeers` lives in
// `src/lib/vendor/referrals.js` beside `forwardLead`, because the two share one
// three-clause predicate — `status='active' AND discover_paused=false AND
// peer_discoverable=true` — and a predicate with two homes is a sheet that
// offers a peer the door refuses. This router does address, auth and envelope.
//
// ⚠ STILL NO WAY IN FROM HERE (B8, and R-40.104 did not touch it). A vendor who
// is not on TDW gets one honest sentence on the sheet and no control: the
// invite is its own arc, and a control pointing at a door this sheet cannot
// open is worse than none.
//
// ⚠ AND NO PHONE KEY (c-40.45). `?q=` matches business name and routing handle
// only. Both are on the public storefront card; a phone is on `public.users`
// and is published nowhere, in either direction.
router.get('/peers', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const result = await searchPeers(supabase, req.vendor.id, {
    q:     typeof req.query.q === 'string' ? req.query.q : '',
    limit: req.query.limit,
  });
  if (!result.ok) return errRes(res, 500, result.error);

  // GROUPS, IN RULED ORDER, EMPTY ONES ALREADY ABSENT. The lib omits an empty
  // group so the surface can suppress its head without inspecting lengths —
  // the rule is decided once, at the door, and not again on glass.
  //
  // `min_query` travels so the sheet's own debounce cannot disagree with the
  // server's minimum. One home for the number, read rather than re-typed.
  return okRes(res, {
    groups:    result.groups,
    searching: result.searching,
    min_query: MIN_PEER_QUERY,
  });
}));

module.exports = router;
