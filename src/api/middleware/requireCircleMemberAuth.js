// src/api/middleware/requireCircleMemberAuth.js
//
// THE CIRCLE / CO-PLANNER LANE'S GUARD. Mounted at `src/api/router.js` in front
// of the three Class A route files (session · muse · dreamai — six doors).
//
// ═════════════════════════════════════════════════════════════════════════════
// RE-AUTHORED AT F-07.72 ZIP 2. IT WAS NOT MOUNTABLE AS WRITTEN, AND THE TWO
// REASONS ARE WHY IT SAT HERE UNCALLED FOR A BLOCK.
// ═════════════════════════════════════════════════════════════════════════════
//
// WHAT STOOD HERE, and both defects were re-derived at `a63f1ae` before a byte
// moved (F-07.72 ZIP 1's handover §2 carried them forward so this ZIP would not
// have to rediscover them):
//
//   AXIS 1 — `supabase.auth.getUser(token)` off a Bearer header. THIS LANE
//   MINTS NO SUPABASE JWT. Before ZIP 1 `verifyPin.js` returned a bare userId
//   string and nothing on the lane issued a session token at all; after ZIP 1 it
//   issues a LANE-NATIVE signed token — five dot-separated parts, not three.
//   `getUser` fails on it. Mounted unchanged, this guard would have 401'd the
//   entire live lane, including the only real member.
//
//   AXIS 2 — `.eq('id', user.id)`, the AUTH-plane id used directly as a
//   `public.users.id`. Migration 0063 split those planes;
//   `src/lib/resolveUsersId.js:29-34` carries the founder-run probe stating they
//   "never coincide", three-for-three, which is why `requireCoupleAuth.js:52`
//   goes through `resolveUsersId` and this file did not. Mehek's row is
//   PLANE-SPLIT (`auth_user_id` present and != `id`), so axis 2 was ARMED on the
//   only live row: even in a world where this lane issued Supabase JWTs, this
//   guard would have refused the one real member.
//
// ── WHY `resolveUsersId` IS NOT CALLED BELOW, REPORTED NOT ADAPTED (§0.2) ────
// The charter and the CE ruling both describe this guard as "re-authored,
// `resolveUsersId`'d". Re-authored it is; the hop turns out to be UNNECESSARY,
// and saying so is cheaper than carrying a call that does nothing.
//
// The reason is structural, not a shortcut. The circle token's first bound field
// IS a `public.users.id`: `verifyPin.js:112` mints from `userRow.id` (selected
// out of `public.users`) and `join.js:289` mints from the `userId` it has just
// provisioned in that same table. There is no auth-plane identity anywhere in
// this credential's provenance, so there is no plane to hop FROM. Calling
// `resolveUsersId` here would ask "which public user owns this auth identity?"
// of a value that is already a public user id — it would take the fallback leg
// (`users.id = <the same id>`), return the input, and cost a round trip while
// implying to every future reader that this lane carries auth-plane ids. It does
// not.
//
// AXIS 2 IS THEREFORE CURED BY THE CREDENTIAL, NOT BY A HELPER. If this lane
// ever migrates to Supabase identities — fork F1-a, named as the estate-coherent
// successor in `src/lib/circleSession.js:36-40` — the hop becomes mandatory in
// the same motion, and `b07_f0772_circle_auth_bench.js` §13.3 is the cell that
// reddens if a bound field ever stops being a public users id.
//
// ── WHAT THE GUARD PROVES, IN ORDER ─────────────────────────────────────────
//   1. a Bearer is present and verifies against CIRCLE_SESSION_SECRET;
//   2. the bound `user_id` is a live `public.users` row;
//   3. that row's phone is an ACTIVE `circle_members` row — REVOCATION IS LIVE
//      ON EVERY REQUEST, which is the whole reason the token may carry a 90-day
//      TTL (`circleSession.js:61-69`);
//   4. the membership found is the couple the TOKEN BOUND. Step 4 is not
//      belt-and-braces: `circle_members_phone_idx` is a PLAIN index, one phone
//      could be active in two circles, and `.maybeSingle()` on that shape is 1:1
//      by luck. The binding is what makes "whose circle" structural.
//
// ── 401 AND 403 MEAN DIFFERENT THINGS AND THE DIFFERENCE IS DELIBERATE ──────
// 401 = no usable credential (absent, malformed, expired, forged, or bound to a
// user who no longer exists). 403 = a VALID credential whose membership is gone
// or whose bound couple no longer matches. The client acts on that difference:
// a 401 sends the member back to the PIN screen through the one home the pwa
// half of this delivery installs; a 403 must NOT, because re-entering a PIN
// cannot restore a membership the bride revoked.
//
// NO TOKEN VALUE, NO PREFIX AND NO LENGTH IS EVER LOGGED HERE. F-07.108 exists
// because one value reached a screenshot, and a length is a value.
'use strict';

const { verifyCircleSession, circleTokenFrom } = require('../../lib/circleSession');
const { circlePermissions }                    = require('../../lib/circlePermissions');

module.exports = async function requireCircleMemberAuth(req, res, next) {
  const supabase = req.app.locals.supabase;

  // 1 — the credential. `circleTokenFrom` is Bearer-only by design
  // (`circleSession.js:116-121`): the co-planner is a first-party client this
  // estate taught in ZIP 1, so there is no legacy carrier to honour and no
  // cookie arm to defend.
  const token = circleTokenFrom(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorised.' });
  }

  // `verifySigned` answers NULL for expired, forged and malformed alike, and
  // that is its own ruling (`signedSession.js:132-136`): a door that could tell
  // those apart would tell an attacker apart too.
  const claim = verifyCircleSession(token);
  if (!claim) {
    return res.status(401).json({ success: false, error: 'Unauthorised.' });
  }

  // 2 — the bound user. `.eq('id', ...)` is CORRECT here and axis 2 is why the
  // sentence above this line exists: the bound field is a public users id by
  // construction, never an auth id.
  const { data: userRow } = await supabase
    .from('users')
    .select('id, phone, name')
    .eq('id', claim.user_id)
    .maybeSingle();

  if (!userRow) {
    return res.status(401).json({ success: false, error: 'Unauthorised.' });
  }

  // 3 — live membership. `users.phone` and `circle_members.invitee_phone` are
  // both E.164; direct match, the same hop every door on this lane has always
  // made.
  const { data: member } = await supabase
    .from('circle_members')
    .select('id, couple_id, role, invitee_name, status')
    .eq('invitee_phone', userRow.phone)
    .eq('status', 'active')
    .maybeSingle();

  if (!member) {
    return res.status(403).json({ success: false, error: 'Not a circle member.' });
  }

  // 4 — the binding holds. See the numbered note above: a token that proves WHO
  // but not WHOSE CIRCLE cannot answer this lane's question.
  if (member.couple_id !== claim.couple_id) {
    return res.status(403).json({ success: false, error: 'Not a circle member.' });
  }

  req.circleMember = {
    user_id:       userRow.id,
    co_planner_id: member.id,
    couple_id:     member.couple_id,
    role:          member.role,
    name:          userRow.name || member.invitee_name || null,
    // FORK E — one home, cited both ways. The block used to be seven literal
    // lines here and seven identical literal lines at `src/api/circle/session.js`.
    // `src/lib/circlePermissions.js` is now the only place it is written, and
    // that file's header carries F-07.115's declaration.
    permissions:   circlePermissions(),
  };

  next();
};
