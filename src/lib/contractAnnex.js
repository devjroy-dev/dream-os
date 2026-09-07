// src/lib/contractAnnex.js
// BLOCK 19 · G3.2 sitting 2 — THE SEVEN ANNEX HEADINGS AND THE CATEGORY MAP.
// ONE HOME (register §9 law 3, chair ruling F4 of 2026-09-07).
//
// ═══ WHY THIS IS A FILE AND NOT A CONSTANT IN `contracts.js` ═══════════════
// Two readers need it and they are on opposite sides of a constitutional line:
//
//   `src/lib/contractPdf.js`         — the PURE renderer, which opens no DB
//                                      handle and takes none
//   `src/api/vendor/contracts.js`    — the door that serves the map to the room
//
// `src/lib/vendor/contracts.js` is the WRITER module. Putting the map there and
// importing it into the renderer would hand the renderer a path to the write
// half it is constitutionally forbidden to have (`contractPdf.js` header:
// "a renderer that could read is a renderer that will"). So the map sits below
// both and knows about neither.
//
// ⚠ IT TAKES NO `supabase` AND MUST NEVER TAKE ONE. Everything here is a fact
// about the ESTATE — which annexes exist, which trade usually attaches which —
// and not a fact about a contract or a vendor row. That is also why the door
// that serves it is its own read (`GET .../annex-map`) and not a field on
// compose or fill's response: a map that arrived attached to a contract would
// read as a property OF that contract.
//
// ═══ THE HEADINGS ARE THE INSTRUMENT'S, NOT THIS FILE'S ════════════════════
// Each is the annex title out of `docs/specs/TDW_19_CONTRACT_GENERIC_v4.md`
// (lawyer-passed, R-40.106), transcribed. They were authored TWICE before this
// file existed — `contractPdf.js:535` and `dreamos-pwa` `screen.tsx:60` — in a
// file whose own comment said a name typed twice would be two homes for one
// heading. Both literals collapse into this one.
//
// ⚠ THE `label` AND THE `title` ARE TWO DIFFERENT BYTES AND BOTH ARE RATIFIED.
// `label` is what a VENDOR reads on the tailoring surface — 「Photography and
// film」, veto sheet §3. `title` is what prints on the annex's own page —
// 「Annex A — Photography and film」, v4's heading and veto row 13's eyebrow
// context. They differ by the prefix and nothing else, and the prefix is built
// here rather than typed into either, so a letter can never disagree with its
// heading.
'use strict';

// The seven, in the instrument's own order. `key` is the letter `contracts.annexes`
// is keyed by; it is the same letter v4 titles the page with.
const ANNEXES = Object.freeze([
  Object.freeze({ key: 'a', label: 'Photography and film' }),
  Object.freeze({ key: 'b', label: 'Makeup and hair' }),
  Object.freeze({ key: 'c', label: 'Décor and production' }),
  Object.freeze({ key: 'd', label: 'Planning and coordination' }),
  Object.freeze({ key: 'e', label: 'Mehendi' }),
  Object.freeze({ key: 'f', label: 'Venue' }),
  Object.freeze({ key: 'g', label: 'Other services' }),
]);

const ANNEX_KEYS = Object.freeze(ANNEXES.map((a) => a.key));

/** 「Annex A — Photography and film」 — built, never typed. */
function annexTitle(key) {
  const a = ANNEXES.find((x) => x.key === key);
  return a ? `Annex ${String(key).toUpperCase()} \u2014 ${a.label}` : null;
}

/** The titles of the annexes actually attached, in the instrument's order. */
function attachedTitles(annexes) {
  const on = ANNEX_KEYS.filter((k) => annexes && annexes[k]);
  return on.map(annexTitle);
}

/** The letters actually attached, in the instrument's order. */
function attachedKeys(annexes) {
  return ANNEX_KEYS.filter((k) => annexes && annexes[k]);
}

// ═══ THE MAP · register §9, completed against the founder's production census
// of 2026-09-07 (`makeup` 21 · `photography` 4 · NULL 2 · `jewellery` 1 ·
// `planning` 1 — 29 rows, 5 distinct values) ═══════════════════════════════
//
// ⚠ THREE LAWS ON THIS MAP, AND THE CODE OBEYS ALL THREE RATHER THAN CITING
// THEM.
//
// 1 · IT IS A SUGGESTION THE ROOM OFFERS AND NEVER A RULE IT APPLIES.
//     `vendors.category` :1204 carries NO CHECK at this base — census run, not
//     recalled — so it is not database-enforced and this file will not pretend
//     it is. She may attach any annex in any combination whatever her trade.
//     The map decides which list is shown FIRST and nothing else, which is why
//     `annexesFor` returns `{ offered, others }` and never a permission.
//
// 2 · AN UNMAPPED OR NULL CATEGORY OFFERS ALL SEVEN AND NEVER AN EMPTY LIST.
//     ⚠ `NULL` IS A LIVE VALUE AND IT IS NOT "UNMAPPED". Two vendor rows carry
//     no category at all. An unmapped category is a value the map does not
//     name; NULL is the ABSENCE of a value, and `MAP[category]` on `null` reads
//     a property of nothing rather than falling through a default. So NULL is
//     tested FIRST, explicitly, before any lookup — the same fail-closed shape
//     G3.1 gave its hook defaults. An unreadable answer is ANSWERED, never
//     assumed.
//
// 3 · ONE HOME. This constant and the seven headings above are the only copies.
//
// ⚠ SEVEN OF THESE KEYS HAVE ZERO ROWS TODAY and they stay: a map built only
// from today's census breaks on tomorrow's first signup, and the cost of naming
// a category with no rows is one line while the cost of missing one is a vendor
// meeting a screen with nothing to attach (F-40.138's shape).
//
// ⚠ `planning` KEYS TO D DIRECTLY. It normalises to `planning` and keys to
// `other` in `capacityVerdict`'s ladder — F-40.172's own load-bearing branch
// order. This map does not reuse that ladder, and the divergence is deliberate
// rather than an oversight to be reconciled later.
const CATEGORY_ANNEXES = Object.freeze({
  makeup:          Object.freeze(['b']),
  hairstylist:     Object.freeze(['b']),
  photography:     Object.freeze(['a']),
  content_creator: Object.freeze(['a']),
  decor:           Object.freeze(['c']),
  planning:        Object.freeze(['d']),
  mehendi:         Object.freeze(['e']),
  venue_catering:  Object.freeze(['f']),
  jewellery:       Object.freeze(['g']),
  designer:        Object.freeze(['g']),
  performer:       Object.freeze(['g']),
  choreographer:   Object.freeze(['g']),
  invitations:     Object.freeze(['g']),
  cake:            Object.freeze(['g']),
});

// `all seven, G first` — the register's own wording for the NULL and unmapped
// rows. G leads because it is the annex for a trade the other six do not name,
// which is exactly the situation a vendor with no category is in.
const ALL_G_FIRST = Object.freeze(['g', 'a', 'b', 'c', 'd', 'e', 'f']);

/**
 * What the room offers, for one vendor's category.
 *
 * @param {string|null|undefined} category — `vendors.category`, raw.
 * @returns {{ mapped: boolean, offered: Array, others: Array }}
 *
 * `mapped` is what the SURFACE branches on, and it is returned rather than
 * inferred from `offered.length` — F-40.138's whole class is a surface reading
 * a length and getting three different states back as one. When `mapped` is
 * false the room draws `T2-unmapped`: ONE list under 「All annexes」, with no
 * first section to stand empty. The shape changes, not just the contents.
 */
function annexesFor(category) {
  // ⚠ NULL FIRST, BEFORE ANY LOOKUP — law 2 above.
  const raw = (category === null || category === undefined) ? null : String(category).trim();
  const keys = (raw && Object.prototype.hasOwnProperty.call(CATEGORY_ANNEXES, raw))
    ? CATEGORY_ANNEXES[raw]
    : null;

  if (!keys) {
    return {
      mapped:  false,
      offered: ALL_G_FIRST.map((k) => ANNEXES.find((a) => a.key === k)),
      others:  [],
    };
  }
  return {
    mapped:  true,
    offered: keys.map((k) => ANNEXES.find((a) => a.key === k)),
    others:  ANNEXES.filter((a) => keys.indexOf(a.key) === -1),
  };
}

module.exports = {
  ANNEXES,
  ANNEX_KEYS,
  CATEGORY_ANNEXES,
  annexTitle,
  attachedTitles,
  attachedKeys,
  annexesFor,
};
