// src/api/admin/discover.js
// Admin Discover queue — grant/deny/revoke, and the deck's preview door.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// ── TDW_10 P3 · R-P3.2 — the audit wrapper replaces this file's local logAction ─
// THIS FILE READ:
//     async function logAction(supabase, action, targetId, metadata = {}) {
//       await supabase.from('admin_activity_log').insert({
//         admin_email: 'admin@thedreamwedding.in', action,
//         target_type: 'vendor', target_id: targetId, metadata });
//     }
// It was the estate's only admin-audit writer and it was LOCAL to this file — so
// the mint, born this sitting, would have had to either copy it or invent a
// second. `src/lib/admin/auditLog.js` is that function promoted to the sole
// writer, with three properties the local one lacked: secret redaction, a
// non-uuid target_id refusal (the column is uuid, not text), and a RETURNED
// result so a bench can assert the write instead of inferring it from silence.
// The actor literal is preserved byte-for-byte so rows written before and after
// this commit remain one series.
const { writeAudit } = require('../../lib/admin/auditLog');

const { portfolioSummary } = require('../../lib/vendor/portfolio');
const { getDiscoverPreview, MIN_PORTFOLIO_IMAGES, setDiscoverState } = require('../../lib/vendor/discover');

// GET /requests
// ── F-07.91 CURED — THE UNSATISFIABLE GUARD STACK ────────────────────────────
// EVERY ROUTE BELOW READ: `requireAuth, requireAdmin`.
// `requireAuth` (src/api/middleware/requireAuth.js:13) verifies a SUPABASE USER
// JWT. It stood FIRST, so it answered 401 before `requireAdmin` was ever
// reached — and an admin holds no user JWT. The whole Discover approval queue
// was therefore unreachable from the panel: not just the list, but grant, deny
// and revoke. Founder-captured on the wire; PRE-EXISTING, older than the panel
// fold that made it visible.
//
// A guard nobody can satisfy is a LOCK WITH NO KEY, not a second factor.
// Removing it is not a weakening: `requireAdmin` alone is the identical
// protection every other /api/v2/admin/* route in this estate carries. The
// second factor it gestured at is real and wanted — it is chartered as F-07.92
// so the want survives the cure rather than dying with the broken lock.
//
// REFUSED IN INK (CE, on the LE's own grounds): teaching the panel to hold a
// user JWT would re-cross the lane geometry F-07.65 closed. Never proposed again.
//
// ── F-10.45 CURED · THE OTHER HALF OF THE WIRE ───────────────────────────────
// F-07.91 made this route REACHABLE. It was still unusable, for two reasons that
// only appear when both sides are read together:
//   (1) THE STATES NEVER MATCHED. Vendors' requests are inserted `state:
//       'requested'` (src/lib/vendor/discover.js, symbol requestDiscover) and
//       this route defaults to and filters `state='requested'` — while the admin
//       screen bucketed its actionable rows on `'under_review'`. Nothing could
//       ever land in that bucket, so Approve/Deny never rendered for a real
//       request.
//   (2) THE PAYLOAD WAS NOT THE TYPED PAYLOAD. This route returned
//       `{id, vendor_id, state, reason, decided_at, created_at, vendor:{…}}`
//       while the client's `DiscoverRequest` type declared `vendor_name`,
//       `vendor_category`, `vendor_city`, `discover_request_state` and
//       `portfolio_count`. `adminGet<T>` casts, so tsc could not see it; at
//       render `st.replace('_',' ')` ran on `undefined` and THREW.
// Neither had ever fired, because `public.vendor_discover_requests` is empty in
// production — founder-run SELECT, 2026-08-06, `group by state` returned zero
// rows. An empty queue renders "No requests"; that is the only reason this
// survived to be found by reading rather than by a broken screen.
//
// THE FIX IS ON THE SERVER, DELIBERATELY. The shape the deck needs — name,
// category, city, and the photo counts — is derivable here in one place. Teaching
// the client to reshape would have put the contract in the repo that cannot
// enforce it. `state` is echoed under BOTH names during the transition so a
// client deployed either side of this push renders rather than throws; the
// duplicate is named here so P6 can retire `discover_request_state` once the
// pwa is known to be past it.
router.get('/requests', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const state    = req.query.state || 'requested';
  let q = supabase.from('vendor_discover_requests')
    .select('id, vendor_id, state, reason, decided_at, created_at, vendor:vendors(id, business_name, routing_handle, category, city, discover_eligible, user:users(name, phone))')
    .order('created_at', { ascending: true });
  if (state !== 'all') q = q.eq('state', state);
  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);

  const rows = data || [];

  // ── FORK 5, AS RULED · TWO LABELLED COUNTS, NEVER ONE BLENDED NUMBER ────────
  // F-07.4 is a DECLARED divergence, not a bug: the request gate counts every
  // portfolio row (`total`), the completeness score and the public feed count
  // approved rows only. `src/lib/vendor/profileScore.js`'s header states both
  // readings and why each is right for its job. The deck therefore renders BOTH,
  // each labelled for what it measures:
  //   · photos_total    — the number the FLOOR is enforced against, here and at
  //                       the request gate. This is the one that gates approval.
  //   · photos_approved — the number a couple will actually see on the card.
  // Collapsing them would make one of the two lie on every screen.
  const enriched = await Promise.all(rows.map(async r => {
    const summary = await portfolioSummary(supabase, r.vendor_id);
    const v = r.vendor || {};
    return {
      id:         r.id,
      vendor_id:  r.vendor_id,
      state:      r.state,
      // F-10.45 (2): the name the client type has always declared. Echoed, not
      // renamed, so neither side of a push renders `undefined`.
      discover_request_state: r.state,
      vendor_name:     v.business_name || (v.user && v.user.name) || 'Unnamed',
      vendor_category: v.category || null,
      vendor_city:     v.city || null,
      vendor_phone:    (v.user && v.user.phone) || null,
      routing_handle:  v.routing_handle || null,
      discover_eligible: v.discover_eligible || false,
      photos_total:    summary.total,
      photos_approved: summary.approved,
      // The floor travels WITH the counts, from the enforcing constant itself, so
      // the deck cannot hold a second opinion about it. Same shape
      // `min_portfolio_images` already uses on the vendor side.
      photo_floor:     MIN_PORTFOLIO_IMAGES,
      meets_floor:     summary.total >= MIN_PORTFOLIO_IMAGES,
      // ── F-10.44 · `reason` IS DOUBLE-DUTY AND THE READER MUST KNOW WHICH ────
      // The column holds the VENDOR'S PITCH while the request is open, and the
      // ADMIN'S DECISION once one is made. Two different authors, one column. The
      // deck must never render a vendor's own pitch back to him as the reason he
      // was refused, so the split is made HERE, on state, rather than left to a
      // screen to guess.
      pitch:           r.state === 'requested' || r.state === 'under_review' ? (r.reason || null) : null,
      decision_reason: r.state === 'denied' || r.state === 'revoked' ? (r.reason || null) : null,
      decided_at:      r.decided_at,
      created_at:      r.created_at,
    };
  }));

  return okRes(res, { requests: enriched, total: enriched.length });
}));

// ── GET /preview/:vendorId — FORK 6(a), AS RULED: ONE SHAPER, TWO DOORS ──────
// The deck renders `VendorProfileView` in preview mode so the founder approves
// exactly what couples will see. That component needs a `DiscoverVendor`, and the
// only honest producer of one is `getDiscoverPreview` (src/lib/vendor/discover.js),
// which assembles the feed's own input and hands it to the feed's own shaper
// (src/lib/discover/shapeVendor.js, symbol shapeVendorForDiscover).
//
// Its existing route is `requireAuth, resolveVendor()` — the vendor's OWN session
// — so an admin cannot reach it. This door calls THE SAME FUNCTION with the target
// vendor's row. Arm (b), shaping admin-side, was refused at derivation on the
// grounds `getDiscoverPreview`'s own header already states: a second builder of
// the shape, in another repo, where nothing can prove the two agree.
router.get('/preview/:vendorId', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: vendor, error } = await supabase
    .from('vendors').select('*').eq('id', req.params.vendorId).maybeSingle();
  if (error) return errRes(res, 500, error.message);
  if (!vendor) return errRes(res, 404, 'Vendor not found.');

  const result = await getDiscoverPreview(supabase, vendor);
  if (!result.ok) return errRes(res, 500, result.error);
  return okRes(res, result);
}));

// POST /grant/:vendorId
// ── F-10.43 CURED · THE FLOOR WAS ENFORCED AT REQUEST AND NOWHERE ELSE ───────
// THIS ROUTE READ: update `discover_eligible: true` with no reference to the
// photo floor of any kind — the word `portfolio` did not appear in this file.
// The floor (`MIN_PORTFOLIO_IMAGES`, src/lib/vendor/discover.js) was checked ONLY
// inside `requestDiscover`, at the moment the vendor asked.
//
// THE GAP IS REACHABLE BY REAL DOORS, WHICH IS WHY IT IS A DEFECT AND NOT A
// THEORY: `DELETE /api/v2/vendor/portfolio/:imageId` (src/api/vendor/portfolio.js)
// carries no floor guard, so a vendor can request at six and stand at three by the
// time the founder swipes. The spec's own acceptance number 4 — "floor violations
// cannot be approved (server rejects)" — was therefore FALSE at tip.
//
// SERVER-SIDE, NOT UI-SIDE, and the deck's own greying-out is decoration over this
// check. The spec's §3 guardrail says a UI-only guard is a failed session; that
// sentence was written about view-as and it is the same law here.
//
// THE COUNT IS `total`, NOT `approved` — the same reading the request gate uses,
// because a gate and its enforcement disagreeing about what a photo is would be
// F-07.4 turned from a declared divergence into a live contradiction. See the
// Fork 5 note above for why both numbers still travel to the screen.
router.post('/grant/:vendorId', requireAdmin, asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const vendorId  = req.params.vendorId;

  const { data: vendor } = await supabase
    .from('vendors').select('id').eq('id', vendorId).maybeSingle();
  if (!vendor) return errRes(res, 404, 'Vendor not found.');

  const summary = await portfolioSummary(supabase, vendorId);
  if (summary.total < MIN_PORTFOLIO_IMAGES) {
    await writeAudit(supabase, 'discover_grant_refused', 'vendor', vendorId, {
      reason: 'below_photo_floor', photos_total: summary.total, floor: MIN_PORTFOLIO_IMAGES,
    });
    return errRes(res, 422,
      `Below the ${MIN_PORTFOLIO_IMAGES}-photo floor — cannot approve. This vendor has ${summary.total}.`,
      'below_photo_floor');
  }

  // F-10.59 — through the ONE WRITER. This door already wrote both columns
  // correctly; routing it anyway is the point of a sole writer. A door that
  // "happens to be right" is the next door to drift.
  const wroteG = await setDiscoverState(supabase, vendorId, { eligible: true, state: 'approved' });
  if (!wroteG.ok) return errRes(res, 500, wroteG.error);
  await supabase.from('vendor_discover_requests')
    .update({ state: 'approved', decided_by_admin: 'admin', decided_at: new Date().toISOString() })
    .eq('vendor_id', vendorId).in('state', ['requested', 'under_review']);
  await writeAudit(supabase, 'discover_grant', 'vendor', vendorId, {
    photos_total: summary.total, photos_approved: summary.approved, floor: MIN_PORTFOLIO_IMAGES,
  });
  return okRes(res, { photos_total: summary.total, photos_approved: summary.approved });
}));

// POST /deny/:vendorId
// ── F-10.44 · THE PITCH IS PRESERVED IN THE RECORD, AND THE CURE IS PARTIAL ──
// THIS ROUTE READ: `.update({ state: 'denied', reason, … })` — and `reason` is the
// column the VENDOR'S OWN PITCH was written to at request time
// (src/lib/vendor/discover.js, symbol requestDiscover). So a denial OVERWROTE what
// the vendor wrote, and a denial with no reason NULLED it.
//
// WHAT IS CURED HERE, with zero DDL as R-P3.2 ruled:
//   · the pitch is READ before the write and carried into the audit row, so it
//     survives in the estate's record instead of being destroyed;
//   · the vendor-facing split is made on STATE at both read doors (GET /requests
//     above, and getDiscoverStatus on the vendor side), so a pitch can never be
//     rendered back to a vendor as the reason he was refused.
//
// WHAT IS NOT CURED, DECLARED RATHER THAN PAPERED: the column is still one column
// doing two jobs, and the pitch is still gone from `vendor_discover_requests` once
// a decision lands. The full cure is a dedicated `decision_reason` column, which is
// DDL, which is 0113's sitting — not this one. Named so the next reader finds a
// bounded partial cure instead of believing the species is dead.
router.post('/deny/:vendorId', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendorId = req.params.vendorId;
  const reason   = (req.body || {}).reason || null;

  const { data: open } = await supabase
    .from('vendor_discover_requests')
    .select('id, reason')
    .eq('vendor_id', vendorId).in('state', ['requested', 'under_review'])
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  const pitch = open ? open.reason : null;

  // ── F-10.59 · BEHAVIOUR CHANGE, DECLARED NOT SLIPPED IN ────────────────────
  // THIS READ: `.update({ discover_request_state: 'denied' })` — state only,
  // eligibility untouched. So denying an ALREADY-LIVE vendor left her on the
  // couples' feed while her own screen read NOT APPROVED: the exact mirror of
  // the founder's specimen, and reachable today by rejecting a vendor who
  // re-applies after an approval. The pair cannot be written by halves any more,
  // so this door must now DECLARE its eligibility, and the only honest value is
  // false — a refusal that leaves the vendor visible is not a refusal.
  const wroteD = await setDiscoverState(supabase, vendorId, { eligible: false, state: 'denied' });
  if (!wroteD.ok) return errRes(res, 500, wroteD.error);
  await supabase.from('vendor_discover_requests')
    .update({ state: 'denied', reason, decided_by_admin: 'admin', decided_at: new Date().toISOString() })
    .eq('vendor_id', vendorId).in('state', ['requested', 'under_review']);
  await writeAudit(supabase, 'discover_deny', 'vendor', vendorId, {
    reason, vendor_pitch_overwritten: pitch, finding: 'F-10.44',
  });
  return okRes(res, {});
}));

// POST /revoke/:vendorId
router.post('/revoke/:vendorId', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendorId = req.params.vendorId;
  const reason   = (req.body || {}).reason || null;
  const wroteR = await setDiscoverState(supabase, vendorId, { eligible: false, state: 'revoked' });
  if (!wroteR.ok) return errRes(res, 500, wroteR.error);
  await writeAudit(supabase, 'discover_revoke', 'vendor', vendorId, { reason });
  return okRes(res, {});
}));

module.exports = router;
