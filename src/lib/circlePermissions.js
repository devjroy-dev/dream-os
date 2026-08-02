// src/lib/circlePermissions.js
// THE ONE HOME for a circle member's permission block — F-07.72 ZIP 2, CE
// ruling §2 FORK E ("ONE HOME, cited both ways").
//
// ── WHY THIS FILE EXISTS ─────────────────────────────────────────────────────
// The same seven lines lived twice: `src/api/circle/session.js:94-100` (what the
// co-planner client is told) and `src/api/middleware/requireCircleMemberAuth.js`
// `:53-59` (what the guard attaches to the request). Two answers to one
// question, byte-identical by luck rather than by construction — the
// second-implementation disease that `src/lib/signedSession.js` was extracted to
// end one plane over, reproduced inside the same lane.
//
// It matters NOW rather than eventually because ZIP 2 mounts the guard: from
// this delivery the guard's copy is the one that decides and session.js's copy
// is the one that renders, so a drift between them would be a screen and a door
// disagreeing about the same member's rights, silently.
//
// ── [F-06.85] THIS BLOCK IS CONDITIONED ON A MECHANISM AND NAMES IT ─────────
// `dreamai_access_granted` is a HARDCODED `false` and no column backs it.
// `public.circle_members` has THIRTEEN columns at the witness
// (`docs/db/PUBLIC_SCHEMA.md:74-89`) and none of them is a permission;
// `dreamai_access` appears zero times in that document. THE FLAG CANNOT BE TRUE
// FOR ANYONE, EVER — that is F-07.115, minted at CE-127, and it gates the Dream
// AI surface twice on the client (`TabBar.tsx:25` removes the tab,
// `dreamai/page.tsx:43,:73` blanks the page) while the doors behind it are fully
// alive. F-07.72 was doors with no lock; F-07.115 is a lock with no key.
//
// F-07.115's CURE IS THE NEXT SITTING'S, NOT THIS ONE'S. When it lands it lands
// HERE, once, and both readers move together. RE-READ THIS PARAGRAPH THEN: the
// sentence above is a claim about a column that does not exist yet.
//
// ── WHY FROZEN, AND WHY A FACTORY ────────────────────────────────────────────
// `Object.freeze` so no handler can mutate the shared block and change what a
// later handler in the same process sees. `circlePermissions()` returns a fresh
// shallow copy for the response body, because a frozen object serialised into
// JSON is fine but a frozen object handed to a caller that expects to extend it
// is a trap for the next reader.
'use strict';

const CIRCLE_PERMISSIONS = Object.freeze({
  dreamai_access_granted: false,   // F-07.115 — no column backs this. See above.
  can_see_budget:         false,
  can_see_guests:         false,
  can_see_vendors:        false,
  can_contribute_muse:    true,
});

function circlePermissions() {
  return { ...CIRCLE_PERMISSIONS };
}

module.exports = { CIRCLE_PERMISSIONS, circlePermissions };
