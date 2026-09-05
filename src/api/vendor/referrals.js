// src/api/vendor/referrals.js
// BLOCK 19 G5.1 — REFERRALS & PARTNERS. The room's read doors.
//
//   GET /api/v2/vendor/referrals        — the balance: sent, received, per peer
//   GET /api/v2/vendor/referrals/peers  — the forward sheet's picker
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
const { getReferralRoom } = require('../../lib/vendor/referrals');

// ── THE PICKER'S COLUMNS. Nothing else travels. ─────────────────────────────
// `business_name` and `category` are what make a peer the RIGHT peer for an
// enquiry, and they are the two the ratified frame draws. NOT the peer's phone:
// the roster holds one, the sender does not need it to forward, and a picker
// that shipped it would be handing one vendor another's number for a list she
// only meant to choose from. Explicit list, never `select('*')` — F-04.106.
const PEER_COLS = 'id, business_name, category, city';

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

// ── GET /peers — the forward sheet's picker  (R-G51.1) ───────────────────────
// LINKED PEERS ONLY: `member_vendor_id IS NOT NULL`. A roster row with a NULL
// member is a manual phone-only entry — a name and a number the vendor typed —
// and it has no vendor behind it, so it has no Victor to take the enquiry from
// there. The same predicate `src/api/vendor/collab.js:528` uses for its linked
// audience, and the same one `forwardLead` re-checks server-side before writing:
// this door SHAPES the choice, it does not authorise it.
//
// ⚠ NO WAY IN FROM HERE (B8, ruled relay 3). This door lists peers and offers no
// means of adding one; peers are added where the roster is written today. A
// picker that grew an add-a-peer door would be a second home for the roster's
// own mint.
router.get('/peers', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: edges, error } = await supabase
    .from('vendor_roster')
    .select('member_vendor_id, created_at')
    .eq('owner_vendor_id', req.vendor.id)
    .not('member_vendor_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) return errRes(res, 500, `Could not read your roster: ${error.message}`);

  const ids = [...new Set((edges || []).map(e => e.member_vendor_id))];
  if (ids.length === 0) return okRes(res, { peers: [] });

  const { data: peers, error: peerErr } = await supabase
    .from('vendors').select(PEER_COLS).in('id', ids);
  if (peerErr) return errRes(res, 500, `Could not read your peers: ${peerErr.message}`);

  // Ordered by the ROSTER's recency, not the vendors table's. `in()` returns
  // rows in whatever order the database likes, and a picker whose order changed
  // between two openings is a picker the vendor cannot build muscle memory on.
  const byId = new Map((peers || []).map(p => [p.id, p]));
  const ordered = ids.map(id => byId.get(id)).filter(Boolean);

  return okRes(res, { peers: ordered });
}));

module.exports = router;
