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
//
// ── F-07.72 ZIP 2 · THE GUARD IS MOUNTED AND THIS BODY IS ITS CONSEQUENCE ────
// The sentence four paragraphs up — "The enforcement ZIP puts a guard in front
// of it" — is TRUE as of this delivery. `requireCircleMemberAuth` runs at
// `router.js`'s mount for `/circle/session`, and everything this handler used to
// compute for itself now arrives on `req.circleMember`, proven rather than
// supplied. The hand-rolled block that stood here (user by the SUPPLIED id →
// member by phone → the permission literal) is gone: three of its four steps
// were the guard's job and the fourth is below.
//
// `:userId` IS NOW IGNORED, AND THAT IS THE FIX, NOT A REGRESSION. The route
// keeps its shape so no client changes and no bookmark breaks, but the id in the
// path decides nothing. `resolveCircleIdentityIfPresent.js:50-51` states the law
// this obeys — THE PROVEN IDENTITY WINS over anything the request supplied in a
// param or a body — and this door is the reason that law needed writing: it
// returned, for ANY supplied id and with no credential at all, a member's name
// and phone, her couple and role, and the bride's name, wedding date and partner
// name. A member who calls it with a stranger's id in the path now receives her
// OWN session, because that is the only session she can prove.
'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');

router.get('/:userId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const me       = req.circleMember;

  // The bride's name — and only the bride's name. `pin_hash`, `wedding_date`
  // and `partner_name` are not read (see the minimisation header above). This
  // is the ONE query the guard does not already answer, which is why it is the
  // only query left in this file.
  const { data: couple } = await supabase
    .from('couples')
    .select('id, users(name)')
    .eq('id', me.couple_id)
    .maybeSingle();

  return res.json({
    success: true,
    data: {
      user_id:   me.user_id,
      name:      me.name,
      couple_id: me.couple_id,
      role:      me.role,
      // FORK E — the permission literal that stood here is now
      // `src/lib/circlePermissions.js`, written once and read by the guard and
      // by this response. F-07.115's declaration lives in that file's header.
      permissions: me.permissions,
      bride: {
        name: couple?.users?.name || null,
      },
    },
  });
}));

module.exports = router;
