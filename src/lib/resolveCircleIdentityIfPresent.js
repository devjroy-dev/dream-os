// src/lib/resolveCircleIdentityIfPresent.js
// F-07.72 · CE ruling §3(2) — the CLASS B doors' identity resolver.
//
// ── WHY THIS IS A RESOLVER AND NOT A GUARD ───────────────────────────────────
// The charter's census named seven doors trusting a supplied identifier and
// proposed mounting `requireCircleMemberAuth` in front of them. Reading the
// CLIENT census showed that three of those doors are not the co-planner's at
// all — they are SHARED, and their second caller is the BRIDE:
//
//   GET  /frost/circle/threads/:brideId                  coplanner (+ journey.ts)
//   GET  /frost/circle/threads/:brideId/:threadId/messages
//                                                        coplanner (+ journey.ts)
//   POST /frost/circle/messages                          coplanner + sanctuary:2901
//   GET  /frost/circle/messages/:coupleId                sanctuary:2585 (bride only)
//
// ── CITATION CORRECTED, F-07.107's read-first (one comment, zero behaviour) ──
// The first cut of this list cited `journey.ts:438/:448/:458` as the bride's live
// second caller and `sanctuary:2895` for the POST. Two drifts, both derived:
// the POST's fetch is at sanctuary:2901, not :2895; and journey.ts's three circle
// helpers — fetchCircleThreads, fetchThreadMessages, sendThreadMessage — have
// ZERO consumers anywhere in the pwa tree (F-07.97's class, second direction).
// THE RULING THIS FILE RESTS ON IS UNHARMED: sanctuary:2585 and :2901 are live,
// they are the bride's, and they are why a circle-member guard would lock her out
// of her own conversation. Only the breadth of the citation was wrong, and a
// dead call site cited as a live one is how a reader inherits a false census.
//
// `src/api/circle/messages.js:27-46` was built for exactly that: "The bride
// passes her couple_id directly; a circle member passes their users.id." A BRIDE
// IS NOT A `circle_members` ROW. Mounting a circle-member guard on these doors
// would answer her own circle chat with "Not a circle member." — locking her out
// of her own conversation. The CE ruled the resolver for precisely this reason.
//
// ── THE PATTERN, AND ITS DONOR ───────────────────────────────────────────────
// `src/lib/resolveCoupleIfPresent.js` (F-07.62's cure) already answers a
// question no middleware in the estate answers: "is a credential PRESENT on this
// request, and if so, whose?" It returns, never throws, never writes, never ends
// the response — the caller decides. This file is that contract widened to two
// credential classes, and it CALLS that helper rather than re-implementing its
// couple arm, so the four acceptance edges F-07.65 closed stay closed here too.
//
// ── THE THREE ANSWERS ────────────────────────────────────────────────────────
//   { present:false, coupleId:null, source:null }
//       No credential at all. Today's caller. During the mint-and-teach phase
//       this is the ANSWER MOST REQUESTS GIVE and the doors serve them exactly
//       as before — that is what "enforce nothing" means. The enforcement ZIP
//       turns this answer into a refusal; nothing else about the shape changes.
//
//   { present:true, coupleId:'<uuid>', source:'circle'|'couple', userId }
//       A proven caller. The circle member's token binds her couple; the bride's
//       Supabase JWT resolves to hers. EITHER WAY THE PROVEN COUPLE WINS over
//       anything the request supplied in a param or a body.
//
//   { present:true, coupleId:null, source:'circle'|'couple' }
//       A credential that proves nothing usable — expired, forged, revoked, or
//       an authenticated identity that owns no couple. It deliberately does NOT
//       demote to `present:false`. Falling back would mean anyone holding any
//       valid credential could still forge, which is the disease wearing a
//       token — `resolveCoupleIfPresent.js:28-32` refused that fallback for the
//       same reason and this file refuses it in the same words.
//
// ── ORDER, AND WHY IT CANNOT COLLIDE ─────────────────────────────────────────
// Both classes arrive as `Authorization: Bearer …`. They are told apart
// MECHANICALLY, not by guessing: a circle token is five dot-separated parts, a
// Supabase JWT is three, and `verifyCircleSession`'s format gate refuses the JWT
// before any HMAC runs. The circle arm is tried first; a JWT falls straight
// through to the couple arm untouched. Neither class can ever be read as the
// other, in either direction.
//
// ── COST, DISCLOSED ──────────────────────────────────────────────────────────
// The circle arm is pure crypto — zero database round trips. The couple arm
// costs the two queries `resolveCoupleIfPresent` has always cost, and
// `sanctuary:2585` polls its door every ten seconds, so a signed-in bride adds
// two lookups per poll. Named rather than discovered: at the present population
// (one live circle member, one couple) this is not a load question, but it is a
// real cost and a future sitting reading a query-count graph should find it
// written down here rather than infer it.
'use strict';

const { verifyCircleSession, circleTokenFrom } = require('./circleSession');
const { resolveCoupleIfPresent }               = require('./resolveCoupleIfPresent');

const ABSENT = Object.freeze({ present: false, coupleId: null, source: null, userId: null });

async function resolveCircleIdentityIfPresent(req, supabase) {
  // ── ARM 1: the circle member's own lane-native token ──────────────────────
  const circleToken = circleTokenFrom(req);
  if (circleToken) {
    const claim = verifyCircleSession(circleToken);
    if (claim) {
      return {
        present:  true,
        coupleId: claim.couple_id,
        source:   'circle',
        userId:   claim.user_id,
      };
    }
    // A Bearer that is not a valid circle token may still be a Supabase JWT —
    // the bride's. Fall through to arm 2 rather than answering here, because
    // answering here would refuse her on a header she is entitled to send.
  }

  // ── ARM 2: the bride's couple credential ─────────────────────────────────
  // `sanctuary:2585` has been sending this Bearer since it was written and the
  // server has been ignoring it. It becomes an honoured input here with zero
  // bytes changed on that call site.
  const couple = await resolveCoupleIfPresent(req, supabase);
  if (couple.present) {
    return {
      present:  true,
      coupleId: couple.coupleId,   // may be null — the third answer, preserved
      source:   'couple',
      userId:   null,
    };
  }

  // ── THE THIRD ANSWER ARRIVES FROM ARM 2, AND A DEAD BRANCH WAS REMOVED HERE ─
  // The first cut of this file ended with a trailing `if (circleToken) return
  // { present:true, coupleId:null }` — belt-and-braces for a Bearer that parsed
  // as neither class. The bench proved that branch UNREACHABLE and it was
  // deleted rather than left in as reassurance: `resolveCoupleIfPresent` answers
  // `present:true, coupleId:null` for ANY bearer it cannot resolve
  // (resolveCoupleIfPresent.js:54-57 — "a broken credential must never silently
  // demote the caller to the logged-out path"), so arm 2 has already returned by
  // the time control could reach here. A guard that cannot execute is not a
  // safety margin; it is a reader's false comfort and the next sitting's
  // unexplained line.
  //
  // WHAT THAT MEANS FOR THE CONTRACT: this returns ABSENT if and only if there
  // was no credential of any kind. Every present-but-unusable credential —
  // forged, expired, revoked, wrong lane — leaves through arm 2 as the third
  // answer. §4.4 and §4.5 of the bench drive exactly that path, and §9 INVERSE 4
  // proves they are not vacuous by making arm 2 demote.
  return ABSENT;
}

module.exports = { resolveCircleIdentityIfPresent };
