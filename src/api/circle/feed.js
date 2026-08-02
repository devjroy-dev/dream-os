// src/api/circle/feed.js
// GET /api/v2/frost/circle/feed/:brideId
//
// CLASS B — dual-lane. Enforced in-handler on the resolver's three answers, NOT
// by `requireCircleMemberAuth`; see the note at the refusal below.
// Response: { success, data: [...] } · 401 { success:false, error } on neither.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { resolveCircleIdentityIfPresent } = require('../../lib/resolveCircleIdentityIfPresent');

router.get('/:brideId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  // ── F-07.72 ZIP 2 · CLASS B · REFUSE-ON-NEITHER, AND THE PROVEN COUPLE WINS ─
  // ZIP 1 mounted this resolver and read nothing from it. The line ZIP 1 wrote
  // as a comment — "if (!req.circleIdentity.coupleId) return res.status(401)" —
  // is now code, three lines down.
  //
  // THIS DOOR IS NOT GUARDED BY `requireCircleMemberAuth` AND MUST NOT BE. It is
  // SHARED: the co-planner reads it and so does THE BRIDE, who is not a
  // `circle_members` row. A circle-member guard would answer her own circle chat
  // with "Not a circle member." The resolver admits both — her Supabase JWT
  // through arm 2, the member's lane-native token through arm 1 — and refuses
  // only a caller who proves NEITHER.
  //
  // THE THIRD ANSWER IS REFUSED TOO, AND DELIBERATELY. A present-but-unusable
  // credential (expired, forged, revoked, or an identity owning no couple)
  // returns `{present:true, coupleId:null}` and does NOT demote to the
  // logged-out path — `resolveCoupleIfPresent.js:54-57` refused that fallback
  // because falling back means anyone holding any valid credential could still
  // forge. So `coupleId` is the whole gate: null is null however it got there.
  req.circleIdentity = await resolveCircleIdentityIfPresent(req, supabase);
  if (!req.circleIdentity.coupleId) {
    return res.status(401).json({ success: false, error: 'Unauthorised.' });
  }

  // `:brideId` IS NO LONGER READ. It used to select whose activity feed was
  // returned, to an unauthenticated caller, on the caller's own word. The feed
  // served is now the feed of the couple the credential PROVED
  // (`resolveCircleIdentityIfPresent.js:50-51`). The route keeps its shape so no
  // client byte moves and no bookmark breaks.
  const brideId = req.circleIdentity.coupleId;

  // The couple-exists check is KEPT even though a proven coupleId came from a
  // couples row: the circle arm proves a couple id out of a SIGNATURE, never out
  // of a live lookup, so a couple deleted after the token was minted would
  // otherwise reach the query below unnoticed.
  const { data: couple } = await supabase
    .from('couples').select('id').eq('id', brideId).maybeSingle();
  if (!couple) {
    return res.json({ success: false, error: 'Couple not found.' });
  }

  const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit,  10) || 20));
  const offset = Math.max(0,              parseInt(req.query.offset, 10) || 0);

  const { data: activity, error } = await supabase
    .from('circle_activity')
    .select('id, activity_type, actor_name, actor_role, subject_type, subject_id, payload, created_at')
    .eq('couple_id', brideId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[GET /frost/circle/feed] query error:', error.message);
    return res.json({ success: false, error: 'Could not fetch feed.' });
  }

  const shaped = (activity || []).map(a => ({
    id:         a.id,
    event_type: a.activity_type,
    payload: {
      member_name: a.actor_name           || null,
      subject:     a.payload?.vendor_name || a.payload?.content || null,
      vendor_name: a.payload?.vendor_name || null,
      content:     a.payload?.content     || null,
    },
    created_at: a.created_at,
  }));

  return res.json({ success: true, data: shaped });
}));

module.exports = router;
