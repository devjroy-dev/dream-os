// src/lib/resolveCoupleIfPresent.js
// ─────────────────────────────────────────────────────────────────────────────
// F-07.62's CURE, fork 2(a) as ruled at the auth sitting.
//
// THE DISEASE. `POST /api/v2/discover/enquire` is mounted BARE (router.js:59 —
// no middleware, by design: the logged-out enquiry is a PRODUCT feature and the
// file's own header says so). It hydrates the enquirer's NAME and PHONE from a
// `couple_id` supplied in the request BODY. A forged id therefore put a real
// bride's name and phone into a stranger's vendor ping and into his cabinet.
//
// THE SHAPE OF THE CURE. Not a guard — a guard would kill the logged-out door.
// This helper answers a question no middleware in the estate answers today:
//
//     "Is a couple credential PRESENT on this request, and if so, whose?"
//
// It returns { present, coupleId } and never throws, never writes, never ends
// the response. The caller decides. Three answers, three meanings:
//
//   { present: false, coupleId: null }  — no credential at all. The LOGGED-OUT
//       bride. The caller falls back to the posted id, exactly as before this
//       file existed. Her path is byte-preserved and F-07.56's seal is intact.
//
//   { present: true,  coupleId: '<uuid>' } — an authenticated couple. This id
//       WINS over anything posted. Forgery dies here: a caller may send any
//       couple_id it likes and it is discarded in favour of the one the token
//       proves.
//
//   { present: true,  coupleId: null }  — a credential that resolves to NO
//       couple. The vendor-on-a-couple-surface case, i.e. the founder's own
//       2026-07-31 specimen. Hydration is REFUSED. It deliberately does NOT
//       fall back to the posted id: falling back would mean anyone holding any
//       valid JWT could still forge, which is the disease wearing a token.
//
// WHY THE COOKIE ARM READS ONLY `tdw_couple_token`: F-07.65's edge 1 removed the
// cross-lane read from requireCoupleAuth in this same motion. A helper that kept
// accepting the vendor cookie would re-open, at an unauthenticated door, the very
// crossing the middleware just closed — the four edges are four, not two.
//
// ── TDW_14 D-3 · THE RETURN GAINS `usersId`, ADDITIVELY (R-D3.3) ───────────
// THE VALUE WAS ALREADY COMPUTED HERE AND THROWN AWAY. `resolveUsersId` runs on
// every arm-2 resolution to find the couple, and its answer — the caller's
// `public.users.id` — was discarded one line later. D-3's polls need exactly
// that value: `circle_poll_votes.voter_user_id` is a users.id for the bride and
// every member alike, so "who is voting" has to be answerable for the BRIDE, and
// `resolveCircleIdentityIfPresent`'s arm 2 could only ever answer `userId: null`.
//
// THE CURE IS AT THE GATE, NOT IN THE HANDLER, and the chair ruled it there for
// the reason this file exists: a per-handler `couples` hop would be a SECOND
// IMPLEMENTATION of a resolution the gate already performs, and the second
// implementation is the disease this estate keeps paying to remove.
//
// IT IS ADDITIVE. Every existing key keeps its meaning and its value; `usersId`
// joins them. The three answers above are unchanged — a reader that destructures
// `{ present, coupleId }` is byte-unaffected, and the census of such readers is
// exactly two (`resolveCircleIdentityIfPresent.js` and `couple/enquire.js:139`),
// derived by grep rather than assumed.
//
// `usersId` IS NULL WHEREVER THE COUPLE IS NULL, and never the reverse: the
// value only exists once a credential has resolved to a real public user, so it
// cannot answer "who" for a caller this file has already refused to identify.
'use strict';

const { resolveUsersId } = require('./resolveUsersId');

// Every return below carries all three keys, so no caller has to ask whether a
// field is absent or merely null — a shape that varies by branch is how an
// optional field becomes an undefined nobody checked.
const ABSENT = Object.freeze({ present: false, coupleId: null, usersId: null });

async function resolveCoupleIfPresent(req, supabase) {
  const header = (req && req.headers && req.headers['authorization']) || '';
  const cookieToken = (req && req.cookies && req.cookies.tdw_couple_token) || '';

  let token = '';
  if (header.startsWith('Bearer ')) token = header.slice(7).trim();
  else if (cookieToken) token = cookieToken;

  if (!token) return ABSENT;

  // From here the credential is PRESENT. Every remaining failure — an expired
  // token, a revoked user, a Supabase outage — answers `coupleId: null` and NOT
  // `present: false`, because a broken credential must never silently demote the
  // caller to the logged-out path where the posted id is believed again.
  try {
    const { data, error } = await supabase.auth.getUser(token);
    const user = data && data.user;
    if (error || !user) return { present: true, coupleId: null, usersId: null };

    const usersId = await resolveUsersId(supabase, user.id);
    if (!usersId) return { present: true, coupleId: null, usersId: null };

    const { data: couple } = await supabase
      .from('couples').select('id').eq('user_id', usersId).maybeSingle();

    // `usersId` is returned even when the couple is null: the credential DID
    // resolve to a real public user (a vendor on a couple surface is the
    // founder's own specimen), and that is a true fact about the caller. It is
    // hydration that was refused, not identity.
    return { present: true, coupleId: (couple && couple.id) || null, usersId };
  } catch (err) {
    console.warn('[resolveCoupleIfPresent] lookup failed (hydration refused):', err && err.message);
    return { present: true, coupleId: null, usersId: null };
  }
}

module.exports = { resolveCoupleIfPresent };
