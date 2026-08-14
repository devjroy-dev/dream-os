// src/api/circle/assigned.js
// GET   /api/v2/frost/circle/assigned/:brideId       — what this member holds
// PATCH /api/v2/frost/circle/assigned/:eventId/state — she marks it done
//
// TDW_14 · D-4 · C-5 — THE MEMBER'S "YOURS".
//
// ═════════════════════════════════════════════════════════════════════════════
// CLASS B, AND THE SHAPE IS POLLS' EXACTLY
// ═════════════════════════════════════════════════════════════════════════════
// Mounted BARE beside feed/threads/messages/polls, refusing in-handler on the
// resolver's three answers. `:brideId` is not read — `resolveCircleIdentityIfPresent`
// states the law (THE PROVEN IDENTITY WINS over anything the request supplied),
// and the route keeps its shape so it reads like its four siblings.
//
// ── WHY CLASS B AND NOT THE CLASS A GUARD ─────────────────────────────────
// The same reason polls took it: the bride reaches these doors too. Her events
// bloom shows who holds what, and a `requireCircleMemberAuth` in front would
// answer her "Not a circle member." on her own journey. The resolver admits both
// lanes and refuses only a caller who proves neither.
//
// ── THE MEMBER→SEAT HOP, AND WHY IT IS HERE AND NOT IN THE GATE ───────────
// The gate answers WHO (a `users.id`) and WHOSE CIRCLE (a `couple_id`). It does
// not answer WHICH SEAT, because no other door has needed that: polls key votes
// on the person, and R-D3.2's whole point was that the person is enough. This is
// the first door where the SEAT is the subject — a delegation belongs to a chair
// in the circle, not to a human being — so the hop from her users.id to her
// `circle_members.id` lives here, at the one door that needs it.
//
// IF A SECOND DOOR EVER NEEDS THE SAME HOP IT MOVES TO THE GATE, exactly as
// R-D3.3 moved the bride's users.id there when polls made a second caller need
// it. RE-READ THIS PARAGRAPH THEN: one consumer is a local resolution, two is a
// second implementation.
//
// ── THE BRIDE HAS NO SEAT, AND THAT IS NOT AN ERROR ───────────────────────
// She is not a `circle_members` row. On the GET she therefore holds nothing and
// receives an empty list — correct, and not a refusal: "Yours" is a member's
// tray, and her own view of who-holds-what is the events bloom's, served by the
// couple plane. She is admitted here and simply has nothing.
'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { resolveCircleIdentityIfPresent } = require('../../lib/resolveCircleIdentityIfPresent');

// The Class B door, one home for the refusal — polls' own helper, same shape.
async function classB(req, res, supabase) {
  req.circleIdentity = await resolveCircleIdentityIfPresent(req, supabase);
  if (!req.circleIdentity.coupleId) {
    res.status(401).json({ success: false, error: 'Unauthorised.' });
    return null;
  }
  return req.circleIdentity;
}

// users.id -> her ACTIVE seat in THIS couple's circle, or null.
// `status: 'active'` is load-bearing: a removed member holds nothing, and the
// column's ON DELETE SET NULL only fires when the row is deleted outright — a
// row soft-deleted to 'removed' still exists and would otherwise still match.
async function seatFor(supabase, identity) {
  if (identity.source !== 'circle' || !identity.userId) return null;
  const { data: user } = await supabase
    .from('users').select('phone').eq('id', identity.userId).maybeSingle();
  if (!user) return null;
  const { data: member } = await supabase
    .from('circle_members')
    .select('id')
    .eq('invitee_phone', user.phone)
    .eq('couple_id', identity.coupleId)
    .eq('status', 'active')
    .maybeSingle();
  return member ? member.id : null;
}

// ── GET /:brideId — what this member holds ─────────────────────────────────
router.get('/:brideId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const me = await classB(req, res, supabase);
  if (!me) return;

  const seat = await seatFor(supabase, me);
  // The bride, or a member whose seat is gone: nothing is hers to hold.
  if (!seat) return res.json({ success: true, data: [] });

  // Scoped by the PROVEN couple AND the seat. The couple predicate is not
  // redundant with the seat: a seat id is a uuid a caller could hold from
  // anywhere, and belt-and-braces here costs one indexed predicate.
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, event_date, event_time, kind, state, notes')
    .eq('couple_id', me.coupleId)
    .eq('assigned_circle_member_id', seat)
    .is('deleted_at', null)
    .order('event_date', { ascending: true })
    .limit(100);

  if (error) {
    console.error('[GET /frost/circle/assigned] query error:', error.message);
    return res.status(500).json({ success: false, error: 'Could not fetch your items.' });
  }

  // NO MONEY AND NO VENDOR REACHES THIS PAYLOAD. `vendor_id`,
  // `assigned_member_ids`, `linked_lead_id` and `linked_binder_id` are all
  // absent from the projection by construction — a member's tray is her own
  // to-dos, not a window onto the couple's vendor plane. The absence is
  // payload-level, never a CSS opinion.
  return res.json({ success: true, data: events || [] });
}));

// ── PATCH /:eventId/state — she marks her own item done ────────────────────
// Founder's word: a member may mark her own item done. She acts within the
// circle; she does not convene it. The scope is what makes that safe.
router.patch('/:eventId/state', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const me = await classB(req, res, supabase);
  if (!me) return;

  const seat = await seatFor(supabase, me);
  if (!seat) return res.status(403).json({ success: false, error: 'Not a circle member.' });

  const { state } = req.body || {};
  // DELIBERATELY NARROWER THAN THE COUPLE PLANE'S. That door allows
  // upcoming|done|cancelled; a member may finish a thing and un-finish it, and
  // she may not CANCEL the bride's journey item. Cancelling is a decision about
  // the wedding, not about the doing.
  if (state !== 'done' && state !== 'upcoming') {
    return res.status(400).json({ success: false, error: 'state must be done or upcoming.' });
  }

  // THREE PREDICATES, AND EACH REFUSES A DIFFERENT LIE: the event is this
  // couple's, it is assigned to HER seat, and it is not deleted. A member cannot
  // touch an item that is not hers even holding a correct event id, and the 404
  // is deliberately the same answer an unknown id gets.
  const { data: updated, error } = await supabase
    .from('events')
    .update({ state })
    .eq('id', req.params.eventId)
    .eq('couple_id', me.coupleId)
    .eq('assigned_circle_member_id', seat)
    .select('id, title, event_date, event_time, kind, state, notes')
    .maybeSingle();

  if (error) {
    console.error('[PATCH /frost/circle/assigned/state] error:', error.message);
    return res.status(500).json({ success: false, error: 'Could not update.' });
  }
  if (!updated) return res.status(404).json({ success: false, error: 'Not found.' });

  // No title, no member name in the line — a record that a state moved.
  console.log(`[PATCH /frost/circle/assigned/state] event=${updated.id} couple=${me.coupleId} state=${state}`);
  return res.json({ success: true, data: updated });
}));

module.exports = router;
