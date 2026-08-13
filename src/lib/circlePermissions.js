// src/lib/circlePermissions.js
// THE ONE HOME for a circle member's permission block — F-07.72 ZIP 2, CE
// ruling §2 FORK E ("ONE HOME, cited both ways"), widened to PER-MEMBER at
// TDW_14 D-1 (C-3, the visibility resolver).
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
// The two readers of THIS file (`requireCircleMemberAuth.js`, `session.js`)
// reach the block by CALL, never by field name, and both took a
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
// ═════════════════════════════════════════════════════════════════════════════
// TDW_14 D-1 — THE BLOCK BECOMES PER-MEMBER, AND THE PARAGRAPH ABOVE IS WHY
// THIS IS THE SHAPE IT TOOK.
// ═════════════════════════════════════════════════════════════════════════════
//
// C-3 wants a per-member visibility matrix through ONE choke point; the spec's
// own guardrail calls a second filter implementation anywhere a failed session.
// The seat was always here. What arrives is `circle_members.visibility jsonb`
// (migration `0098_circle_visibility.sql`) — and it arrives EXACTLY the way the
// declaration above prescribed a permission must: as a column with a migration
// behind it, reddening the inverted cell's siblings on its way in.
//
// ── THE COLUMN CARRIES OVERRIDES, NEVER DEFAULTS, AND THAT IS THE WHOLE DESIGN
// `visibility` defaults to `'{}'::jsonb`. The DEFAULTS stay in `CIRCLE_PERMISSIONS`
// below, in code, unmoved and byte-identical to what shipped at F-07.72.
//
// Putting the default block in the DDL as well — which the 14 spec's reservation
// proposed (`default '{"budget":false,"vendors":true,"moments":true}'`) — would
// have given one question TWO answers again, one in Postgres and one in this
// file, drifting the moment either moved. That is the precise disease this file
// was extracted to end, and it does not become healthy by changing planes.
//
// THE CONSEQUENCE IS THE REGRESSION GUARANTEE: every one of the estate's
// existing rows carries `{}`, resolves through the loop below to zero overrides,
// and receives CHARACTER-IDENTICAL answers to the ones it received yesterday.
// D-1 changes what is POSSIBLE, not what is TRUE for anybody today.
//
// ── WHY AN ALLOWLIST AND NOT A SPREAD ───────────────────────────────────────
// The loop walks the KEYS OF THE DEFAULT BLOCK and reads the override for each.
// It never walks the stored object's own keys. A `{...defaults, ...stored}`
// spread would let anything ever written into that jsonb — a typo, a retired
// flag, a field from a future sitting, a hostile write — appear in the guard's
// `req.circleMember.permissions` and in the session response body, which is a
// serialised payload the co-planner reads. The allowlist means the response
// shape is decided HERE and by nothing else, and `dreamai_access_granted` cannot
// return through the column any more than it can through a literal.
//
// ── WHY STRICT BOOLEANS ─────────────────────────────────────────────────────
// `=== true` / `=== false`, never truthiness. jsonb will happily hold the STRING
// `"false"`, which is truthy in JavaScript; a permission that opens because
// somebody wrote a quoted word is a hole with no error message. Anything that is
// not a real boolean is not an override, and the default stands.
//
// ── WHY FROZEN, AND WHY A FACTORY ────────────────────────────────────────────
// `Object.freeze` so no handler can mutate the shared block and change what a
// later handler in the same process sees. `circlePermissions()` returns a fresh
// shallow copy for the response body, because a frozen object serialised into
// JSON is fine but a frozen object handed to a caller that expects to extend it
// is a trap for the next reader.
//
// ── [F-06.85] THIS FILE'S KEY SET IS FOUR, AND THE SPEC'S IS NOT — DECLARED ──
// THIS SENTENCE IS CONDITIONED ON A RULING THAT HAS NOT BEEN TAKEN AND NAMES IT.
// TDW_14 C-3 describes the matrix as `budget / vendors / moments`. The block
// below is `budget / guests / vendors / muse`. D-1 did NOT reconcile them,
// deliberately: renaming a key or adding `moments` is a product decision about
// what a member may see, not a mechanism, and the UNRULED-ARM LAW says an arm
// the executor can derive is still not an arm the executor may build. D-1 ships
// the MECHANISM over the key set that already exists and has readers.
//
// WHEN THE KEY SET IS RULED, IT LANDS HERE, ONCE, and every reader moves with
// it — that is what the one home buys. A new key is not free: at the moment of
// writing, `can_see_budget`, `can_see_guests` and `can_see_vendors` are declared
// in `dreamos-pwa app/coplanner/CircleSessionContext.tsx:55-57` and READ BY
// NOTHING, while `can_contribute_muse` has one live reader
// (`app/coplanner/muse/page.tsx:22`). A key with no reader is a promise the
// estate has not made. RE-READ THIS PARAGRAPH when the key set is ruled: it is a
// claim about a decision that had not been taken when it was written.
'use strict';

const CIRCLE_PERMISSIONS = Object.freeze({
  // F-07.115 — `dreamai_access_granted: false` stood here. Deleted, not keyed.
  // See the declaration above before adding anything to this block.
  can_see_budget:         false,
  can_see_guests:         false,
  can_see_vendors:        false,
  can_contribute_muse:    true,
});

// The stored jsonb speaks the SHORT names the bride's switches speak; this file
// speaks the `can_*` names its two readers and the pwa type already speak. The
// map is the seam between those two vocabularies and it lives HERE, beside the
// block, so a reader never has to hold two files in mind to answer "which key is
// this". It is derived FROM the block at load time, never hand-kept: a hand-kept
// parallel list is how the next key gets a column nobody reads.
const VISIBILITY_KEYS = Object.freeze(
  Object.keys(CIRCLE_PERMISSIONS).map(k => k.replace(/^can_see_/, '').replace(/^can_/, ''))
);

// permissionKeyFor('budget') -> 'can_see_budget'. Built by inverting the derivation
// above rather than by a second literal list, so the two can never disagree.
const KEY_BY_SHORT = Object.freeze(
  Object.keys(CIRCLE_PERMISSIONS).reduce((acc, full) => {
    acc[full.replace(/^can_see_/, '').replace(/^can_/, '')] = full;
    return acc;
  }, {})
);

// LOAD-TIME INVARIANT. The two derivations above are mechanical, which is
// exactly why they can rot silently: a future key named `can_see_budget_total`
// and a key named `can_budget_total` both shorten to the same word, and the
// second would overwrite the first in KEY_BY_SHORT with no error anywhere. The
// estate has one home; it does not also get to have one collision.
if (VISIBILITY_KEYS.length !== Object.keys(CIRCLE_PERMISSIONS).length) {
  throw new Error(
    '[circlePermissions] two permission keys shorten to the same visibility key — ' +
    'the short-name derivation is ambiguous and the block must be renamed'
  );
}

/**
 * Resolve a member's permission block.
 *
 * @param {object|null|undefined} visibility  the row's `circle_members.visibility`
 *        jsonb, as Supabase returns it. Absent, null, non-object and malformed
 *        all mean THE SAME THING — no overrides — and that is deliberate: a
 *        member whose column could not be read must not thereby gain rights.
 * @returns {object} a fresh, extensible copy of the block.
 */
function circlePermissions(visibility) {
  const out = { ...CIRCLE_PERMISSIONS };

  // Arrays are objects in JavaScript and `typeof null` is 'object'; both are
  // refused here rather than at the `in` check below, where an array would
  // quietly contribute nothing and read as a legitimate empty override.
  if (!visibility || typeof visibility !== 'object' || Array.isArray(visibility)) {
    return out;
  }

  for (const short of VISIBILITY_KEYS) {
    const stored = visibility[short];
    if (stored === true || stored === false) {
      out[KEY_BY_SHORT[short]] = stored;
    }
  }

  return out;
}

/**
 * Narrow a caller-supplied object to the writable visibility shape.
 * The WRITE side's one home, so the bride's PATCH and any later writer cannot
 * disagree with the read side about which keys exist or what a value may be.
 *
 * @returns {{ ok: true, value: object } | { ok: false, invalid: string[] }}
 *          `invalid` carries the offending keys IN THE ORDER SUPPLIED, so a
 *          caller can say which one it was without re-deriving it.
 */
function normaliseVisibility(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return { ok: false, invalid: [] };
  }

  const value   = {};
  const invalid = [];

  for (const [k, v] of Object.entries(patch)) {
    if (!Object.prototype.hasOwnProperty.call(KEY_BY_SHORT, k) || (v !== true && v !== false)) {
      invalid.push(k);
      continue;
    }
    value[k] = v;
  }

  return invalid.length ? { ok: false, invalid } : { ok: true, value };
}

module.exports = {
  CIRCLE_PERMISSIONS,
  VISIBILITY_KEYS,
  circlePermissions,
  normaliseVisibility,
};
