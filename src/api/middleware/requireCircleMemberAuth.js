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
    .select('id, couple_id, role, invitee_name, status, visibility')
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
    // ── [F-06.85] Q-d, F-07.125 — THE PRECEDENCE IS THE FOUNDER'S, AND HIS
    // GROUND IS WRITTEN IN SO NO FUTURE HAND "FIXES" IT BACK ─────────────────
    // THIS LINE READ `userRow.name || member.invitee_name`. It was the estate's
    // THIRD answer to one question and it disagreed with the other two: a member
    // whose `users.name` said Droy saw Droy in settings while her own messages,
    // written from `invitee_name`, said Mehek. Same person, same screen session,
    // two names — F-07.125, and it sat on the founder's shelf for a tenure
    // because it is a product question and not a mechanical one.
    //
    // HIS WORD, verbatim, 2026-08-13: 「 bride's name wins. it's her circle 」.
    //
    // THE SECOND SENTENCE IS THE RULING'S GROUND, not decoration. `invitee_name`
    // is the name the BRIDE TYPED when she invited this person; `users.name` is
    // whatever that person happened to register under, in her own lane, for her
    // own reasons. The circle is the bride's room. Inside it, people are called
    // what she calls them — so this is not a tie broken arbitrarily, it is the
    // only precedence that matches whose surface this is.
    //
    // R-OB.7 (circle member names governed by the bride's given name) and
    // F-07.107 (`messages.js:174`, "the name the bride herself typed") are this
    // line's two older siblings. With this flip the estate has ONE answer at all
    // three sites and Q-d closes. A future hand that reverses this is not fixing
    // a fallback order; it is overruling the founder on whose room this is.
    name:          member.invitee_name || userRow.name || null,
    // M-TRUST, founder's trust ruling 2026-08-14 — THE PERMISSION BLOCK IS GONE
    // FROM THE IDENTITY. It used to be seven literal lines here (FORK E), then
    // one call into `src/lib/circlePermissions.js` resolving the row's
    // `visibility` jsonb (TDW_14 D-1). Both are retired: 「 the bride is
    // consciously adding people 」 — membership is the permission, and a guard
    // that computed an empty block on every request would be machinery
    // pretending to be a mechanism (the F-14.12 shape).
    //
    // `visibility` STAYS IN THE SELECT ABOVE ON PURPOSE: 0098's column survives
    // at the plane, append-only and inert (LD-8), and a select that stopped
    // asking would make a future reader's first question 「 was it ever there? 」
    // Nothing reads the value. The row is carried; no opinion is held.
    //
    // ── [F-06.85] F-07.115'S CLOSURE RECORD, RE-HOMED HERE AT M-TRUST ────────
    // THIS PARAGRAPH IS NOT DECORATION. It lived in `circlePermissions.js`, and
    // that module was deleted whole by the 2026-08-14 ruling. F-06.85's law is
    // that a sentence conditioned on a mechanism records what happened to the
    // mechanism — so a record cannot die just because its host file did. It
    // moves to the surviving reader, which is this guard. `b07_f0772` §13.14
    // reads it HERE now, and that cell moved in the same delivery by charter
    // (RETIRE-WITH-THE-READER).
    //
    // WHAT IT SAYS. `dreamai_access_granted` was a HARDCODED `false` at the one
    // home. No column backed it; `public.circle_members` carried THIRTEEN
    // columns at the witness (`docs/db/PUBLIC_SCHEMA.md:74-89`) and none was a
    // permission — so THE FLAG COULD NOT BE TRUE FOR ANYONE, EVER. F-07.115 was
    // CLOSED BY DELETION rather than by adding the column the defect seemed to
    // ask for: the founder ruled THE LOCK WAS RIGHT AND THE FEATURE DID NOT
    // BELONG THERE. Circle members reach Mira on WhatsApp — they always could —
    // so the flag died with the surface it gated. THIS IS THAT RE-READ, carried
    // forward intact.
    //
    // IF A REAL DREAM-AI PERMISSION IS EVER WANTED it arrives as a COLUMN with a
    // migration behind it, never as a literal, and it must red §13.14 on its way
    // in. That is the conversation the cell exists to force, and the retirement
    // of the block it used to watch does not retire the watch.
  };

  next();
};
