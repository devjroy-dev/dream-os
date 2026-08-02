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
// ── [F-06.85] F-07.115 IS CLOSED, BY DELETION — AND THIS IS THE RE-READ ─────
//
// THE PARAGRAPH THAT STOOD HERE said: `dreamai_access_granted` is a HARDCODED
// `false`, no column backs it, `public.circle_members` has THIRTEEN columns at
// the witness (`docs/db/PUBLIC_SCHEMA.md:74-89`) and none is a permission, so
// THE FLAG CANNOT BE TRUE FOR ANYONE, EVER. It then instructed the next reader:
// *"F-07.115's CURE IS THE NEXT SITTING'S. When it lands it lands HERE, once,
// and both readers move together. RE-READ THIS PARAGRAPH THEN."*
//
// THIS IS THAT SITTING, AND THIS IS THAT RE-READ. The claim was re-derived at
// the executor's own tip before a byte moved — thirteen columns, still none a
// permission — and every consequence it predicted was checked rather than
// inherited. The law worked exactly as designed: a soul-adjacent sentence
// conditioned on a mechanical fact named its mechanism, and the mechanism's next
// sitting was forced to read the sentence before touching it.
//
// AND THE CURE WAS NOT THE ONE THE PARAGRAPH IMPLIED. It reads as though the
// missing column were the defect and the fix were to add one. The founder ruled
// otherwise: THE LOCK WAS RIGHT AND THE FEATURE DID NOT BELONG THERE. Circle
// members reach Mira on WhatsApp — they always could, and that is the intended
// shape — so the flag dies with the surface it gated rather than gaining a key.
//
// WHAT WENT, all five sites, in one arc:
//   · this literal
//   · `dreamos-pwa app/coplanner/CircleSessionContext.tsx` — the type field
//   · `dreamos-pwa app/coplanner/TabBar.tsx:25`             — the tab gate
//   · `dreamos-pwa app/coplanner/dreamai/page.tsx`          — the page, whole
//   · `docs/SCHEMA.md`                                      — the sample payload
// The two readers of THIS file (`requireCircleMemberAuth.js:142`,
// `session.js:98`) reach the block by CALL, never by field name, and both took a
// zero-line diff — which is Fork E's one home paying for itself the first time
// it was asked to.
//
// THE BENCH CELL IS INVERTED, DELIBERATELY. `§13.13` asserted that this file
// CARRIED the flag; it now asserts the flag is ABSENT. A cell that merely stops
// being run cannot catch a re-introduction; a cell that watches for the field's
// return can. If a real Dream-AI permission is ever wanted here it will arrive
// as a COLUMN with a migration behind it, and it will have to red this cell on
// its way in — which is the conversation we want it to force.
//
// ── WHY FROZEN, AND WHY A FACTORY ────────────────────────────────────────────
// `Object.freeze` so no handler can mutate the shared block and change what a
// later handler in the same process sees. `circlePermissions()` returns a fresh
// shallow copy for the response body, because a frozen object serialised into
// JSON is fine but a frozen object handed to a caller that expects to extend it
// is a trap for the next reader.
'use strict';

const CIRCLE_PERMISSIONS = Object.freeze({
  // F-07.115 — `dreamai_access_granted: false` stood here. Deleted, not keyed.
  // See the declaration above before adding anything to this block.
  can_see_budget:         false,
  can_see_guests:         false,
  can_see_vendors:        false,
  can_contribute_muse:    true,
});

function circlePermissions() {
  return { ...CIRCLE_PERMISSIONS };
}

module.exports = { CIRCLE_PERMISSIONS, circlePermissions };
