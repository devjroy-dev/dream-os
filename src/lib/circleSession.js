// src/lib/circleSession.js
// The circle / co-planner lane's session material — CALLER #2 of
// src/lib/signedSession.js (F-07.72, CE ruling §3(1): F1-b, the lane-native
// signed token, via ONE home).
//
// ── THE DISEASE THIS ENDS ────────────────────────────────────────────────────
// `src/api/router.js:70-72` carried the estate's confession in-comment for the
// life of the lane: "No requireCircleMemberAuth — coplanner sends no JWT. Each
// endpoint validates via userId/memberUserId/brideId params against
// circle_members table directly." Seven doors trusted an identifier the caller
// supplied. `GET /circle/session/:userId` returned, for ANY supplied id, a
// member's name and phone, her couple_id and role, and the bride's name,
// wedding date and partner name.
//
// The cure was written and never mounted — `requireCircleMemberAuth.js`, 63
// lines, referenced nowhere but in its own file and in the comment explaining
// its absence. It could not be mounted as written for TWO independent reasons,
// both derived at the read-first and both load-bearing:
//   (1) its first act is `supabase.auth.getUser(token)` off a Bearer header,
//       and this lane mints no Supabase JWT — `verifyPin.js:85` returned a bare
//       userId string and nothing on the lane issued a session token at all.
//       Mounting it would have 401'd the entire live lane.
//   (2) it resolves the user row with `.eq('id', user.id)` — the AUTH-plane id
//       used directly as a `public.users.id`. Migration 0063 split those planes
//       (`src/lib/resolveUsersId.js:23-40` carries the founder-run probe: the
//       two "never coincide", three-for-three), which is why the couple lane's
//       guard goes through `resolveUsersId` and this one does not. The one live
//       circle member's row is PLANE-SPLIT (`auth_user_id` present,
//       `auth_user_id != id`), so defect (2) was armed on the only live row.
//
// ── WHY A LANE-NATIVE TOKEN AND NOT A SUPABASE JWT ───────────────────────────
// Fork F1-a (mint a real Supabase session at verify-pin) was REFUSED for this
// sitting on three grounds, recorded so a later sitting can re-open it knowing
// what was weighed: `circle/join.js` provisions no auth identity at all for a
// new member (it inserts a bare `public.users` row), so F1-a needs
// `ensureAuthIdentity` in front of it for every future joiner; a Supabase JWT
// proves a USER and this lane's membership key is a phone, not a user id; and
// it would still not have answered the dual-lane doors below. F1-a remains the
// estate-coherent END state and is the NAMED SUCCESSOR if this lane ever needs
// full Supabase identities.
//
// ── WHAT THIS TOKEN BINDS, AND WHY BOTH FIELDS ───────────────────────────────
// `user_id` AND `couple_id`. Not user_id alone. `public.circle_members` has NO
// `user_id` column (13 columns, witnessed at docs/db/PUBLIC_SCHEMA.md:76-88);
// every door hops `users.phone -> circle_members.invitee_phone`, and
// `circle_members_phone_idx` is a PLAIN index, not unique. One phone could be
// active in two circles, and every door's `.maybeSingle()` on that shape is
// 1:1 by luck rather than by constraint. A token proving only WHO cannot answer
// WHOSE CIRCLE. Binding the couple makes the answer structural.
//
// The founder has since ruled the product half — one phone co-plans exactly ONE
// wedding — and `circle/join.js` now refuses a phone active in another circle.
// THE BINDING STAYS REGARDLESS: the join refusal is a policy at one door, and a
// policy at one door is not a guarantee at seven.
//
// ── SECRET, TTL, REVOCATION ──────────────────────────────────────────────────
// CIRCLE_SESSION_SECRET arrives via env and is REFERENCED, NEVER PRINTED. With
// it absent both functions fail closed (F-07.77's law, inherited through
// signedSession).
//
// TTL is 90 DAYS, founder-ruled 2026-08-02. Stated with its reason so a future
// sitting does not "harden" it by reflex: THE TOKEN IS CONVENIENCE, NOT
// AUTHORITY. Revocation is live on every single request — the guard re-reads
// `circle_members.status = 'active'` at the door, so removing a member takes
// effect on her next call whatever her token's expiry says. A seven-day
// lifetime would buy no security and would put a PIN screen in front of the
// co-planner every week. The token is re-minted on every verify-pin and every
// join/accept, so an active member's session rolls forward and never expires
// out from under her.
'use strict';

const { mintSigned, verifySigned, bearerFrom } = require('./signedSession');

// 90 days, founder-ruled. See the TTL paragraph above before changing this.
const CIRCLE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

// Both bound fields are uuids on the public plane (`users.id`, `couples.id`).
// A structural gate only — the mac is what proves them.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function circleSecret() {
  return process.env.CIRCLE_SESSION_SECRET;
}

// mintCircleSession({ userId, coupleId }) -> token | NULL (fail-closed).
// NULL when the secret is absent or either id is unusable. Callers treat null as
// "no token this turn" and MUST NOT invent one; the lane still returns its bare
// userId during the mint-and-teach phase, so a null degrades to today's
// behaviour rather than to a broken door.
function mintCircleSession({ userId, coupleId }) {
  return mintSigned({
    secret:  circleSecret(),
    subject: [String(userId || ''), String(coupleId || '')],
    ttlMs:   CIRCLE_TTL_MS,
  });
}

// verifyCircleSession(token) -> { user_id, couple_id } | NULL.
//
// A Supabase JWT CANNOT pass this gate and that is mechanical, not hopeful: a
// JWT is three dot-separated parts, this token is five. The format gate refuses
// it before any HMAC is computed. That disjointness is one leg of the three-lane
// crossover triangle (`b07_auth_crossover_bench.js` §6) — a couple's or vendor's
// credential can never be mistaken for a circle member's, in either direction.
function verifyCircleSession(token) {
  const ok = verifySigned({
    token,
    secret:       circleSecret(),
    subjectCount: 2,
    subjectRe:    UUID_RE,
  });
  if (!ok) return null;
  return { user_id: ok.subject[0], couple_id: ok.subject[1] };
}

// Reads the circle token off a request. Bearer only — the co-planner is a
// first-party client we are teaching in the same delivery, so there is no legacy
// carrier to honour and no cookie arm to defend.
function circleTokenFrom(req) {
  return bearerFrom(req);
}

module.exports = {
  CIRCLE_TTL_MS,
  UUID_RE,
  mintCircleSession,
  verifyCircleSession,
  circleTokenFrom,
};
