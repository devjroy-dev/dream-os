// src/api/circle/session.js
// GET /api/v2/circle/session/:userId
//
// Returns the CircleSession shape the coplanner expects.
// Called after verify-pin and on background hydration refresh.
// users.phone and circle_members.invitee_phone are both E.164 — direct match.
//
// ── F-07.72 · THE RESPONSE IS MINIMISED TO WHAT ITS CALLER ACTUALLY READS ────
// CE ruling §3(5). This door returned, for ANY supplied userId and with no
// credential of any kind, the member's name and PHONE, her couple_id, role and
// co_planner_id, whether the shared PIN was set, and the BRIDE's name, wedding
// date and partner name. The enforcement ZIP puts a guard in front of it; this
// change reduces what there is to guard.
//
// THE KEPT SET IS DERIVED, NOT CHOSEN — by command over the whole pwa tree at
// dreamos-pwa 2d277f4:
//   user_id      7 read sites   (layout:34/:46, dreamai, muse, threads, join)
//   couple_id    6 sites        (via brideId(), CircleSessionContext.tsx:76)
//   name         4 sites        (via memberName(), :88)
//   role         1 site         (settings/page.tsx:19)
//   permissions  3 sites        (dreamai:43, muse:23, TabBar:25)
//   bride.name   7 sites        (via brideName(), :82)
//
// THE DROPPED SET, each with the reason it could go:
//   phone                  ZERO readers anywhere in app/coplanner or app/circle.
//   pin_set                ZERO readers OF THIS RESPONSE. The two sites that
//                          look like readers are not: layout.tsx:141 read
//                          pin-status's pin_set (that call is deleted this same
//                          delivery, F-07.104) and join:117 reads /accept's.
//   co_planner_id          Declared in the client type at
//                          CircleSessionContext.tsx:50 and read by nothing —
//                          a field the type promised and no screen wanted.
//   bride.wedding_date     Read off a DIFFERENT fetch: coplanner/page.tsx:78
//                          takes it from GET /couple/profile/:brideId.
//   bride.partner_name     ZERO readers.
//
// Dropping pin_set also lets the couples SELECT stop reading `pin_hash` at all.
// A door that does not fetch a password hash cannot leak one.
//
// ── DECLARED PARTIAL — F-07.106, and this comment is the declaration ─────────
// [F-06.85] THIS SENTENCE IS CONDITIONED ON A MECHANISM ONE LANE OVER AND NAMES
// IT: `GET /api/v2/couple/profile/:brideId` (`src/api/couple/profile.js:41-50`,
// mounted BARE at `router.js:66`) returns `bride_name`, `groom_name` and
// `wedding_date` for any supplied couple id with no credential — character for
// character the bride payload this file just stopped sending. MINIMISING THIS
// DOOR MOVED THAT LEAK; IT DID NOT CLOSE IT. Filed as F-07.106 and homed to the
// auth backlog beside F-07.105, because that door is the couple lane's and
// pulling it into F-07.72 would re-open the logged-out-enquiry ground F-07.62
// settled. If F-07.106 is ever cured, or if that door is guarded, RE-READ THIS
// PARAGRAPH: it is a claim about a file that is not this one.
'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');

router.get('/:userId', asyncHandler(async (req, res) => {
  const supabase   = req.app.locals.supabase;
  const { userId } = req.params;

  // 1. Get user row
  const { data: userRow } = await supabase
    .from('users')
    .select('id, name, phone')
    .eq('id', userId)
    .maybeSingle();

  if (!userRow) {
    return res.json({ success: false, error: 'User not found.' });
  }

  // 2. Find active circle_member by E.164 phone (same format in both tables)
  //    `phone` is still SELECTed above because it is the join key to this row —
  //    it is read here and never returned.
  const { data: member } = await supabase
    .from('circle_members')
    .select('id, couple_id, role, status, invitee_name')
    .eq('invitee_phone', userRow.phone)
    .eq('status', 'active')
    .maybeSingle();

  if (!member) {
    return res.json({ success: false, error: 'Not an active circle member.' });
  }

  // 3. Get the bride's name — and only the bride's name. `pin_hash`,
  //    `wedding_date` and `partner_name` are no longer read (see the header).
  const { data: couple } = await supabase
    .from('couples')
    .select('id, users(name)')
    .eq('id', member.couple_id)
    .maybeSingle();

  const permissions = {
    dreamai_access_granted: false,
    can_see_budget:         false,
    can_see_guests:         false,
    can_see_vendors:        false,
    can_contribute_muse:    true,
  };

  return res.json({
    success: true,
    data: {
      user_id:   userRow.id,
      name:      userRow.name || member.invitee_name || null,
      couple_id: member.couple_id,
      role:      member.role,
      permissions,
      bride: {
        name: couple?.users?.name || null,
      },
    },
  });
}));

module.exports = router;
