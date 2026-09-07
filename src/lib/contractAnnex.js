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

// ═══ THE TRADE DEFAULTS · R-40.114, R-40.117 as amended by R-G32.21 ════════
//
// What `Your policies` opens PRE-FILLED with. It lives beside the annex map and
// is served by the same door for one reason: both are facts about a TRADE and
// neither is a fact about a contract, so a second home would be a second answer
// to 「what does this vendor's trade usually do」.
//
// ⚠ EVERY VALUE HERE IS STORABLE, AND THAT IS THE WHOLE POINT OF THIS TABLE.
// F-40.237: the ratified frame's value column was drawn as RENDERED OUTPUT —
// 「Rs 4,000」, 「7 days」, 「1.5% a month」 — and a vendor typing what she saw
// would have printed `Rs Rs 4,000` and `7 days days` on a signed agreement,
// because `rs()` supplies the currency, `pct()` supplies the sign, and clause
// 4.7 supplies the literal ` days`. Sixteen rows were affected. So the numbers
// below are BARE. The unit is carried on the LABEL, where a vendor reads it and
// the instrument never does.
//
// ⚠ AND A DEFAULT IS A SUGGESTION SHE OVERWRITES, NEVER A VALUE TDW ASSERTS.
// The sheet marks every row `Default` · `Needed` · `Yours` precisely so a
// pre-filled sheet cannot be mistaken for one she has answered. Nothing here is
// written to `contract_profiles.fields` until she presses Save.
//
// ⚠ THE FOUR `Needed` ROWS ARE ABSENT FROM EVERY TRADE ROW, DELIBERATELY.
// `vendor_signatory_name`, `deposit_refundable`, `gst_treatment` and `gst_pct`
// carry no default in any trade: a signatory cannot be guessed (ruling F7 — a
// seal naming only the Client is half a witness), and the other three are hers
// to declare and wrong for this file to assume. They get PLACEHOLDERS instead,
// below, which vanish on focus and are never stored (R-40.116).
const TRADE_BASE = Object.freeze({
  meals_provision:        'one hot meal per person',
  travel_terms:           'at actual cost, agreed first',
  overtime_unit:          'hour',
  late_grace_days:        '7',
  late_interest_pct:      '1.5',
  postpone_notice_days:   '30',
  postpone_window_months: '12',
  cancel_tier_1_pct:      '30',
  cancel_tier_2_pct:      '50',
  cancel_tier_3_pct:      '75',
  cancel_tier_4_pct:      '100',
  refund_days:            '15',
  takedown_days:          '7',
  fm_window_months:       '6',
});

// The delivery family, for a trade that hands over LATER.
const DELIVERS_LATER = Object.freeze({
  delivery_days:   '45',
  delivery_method: 'a private online gallery',
  link_live_days:  '60',
  revision_rounds: '1',
  revision_rate:   '5000',
  archive_months:  '12',
});

// ⚠ `delivery_basis` IS THE FIELD R-G32.21 ADDED, AND IT GOVERNS THREE PLACES.
// `on_the_day` means: the sheet omits the 「Delivered within」 row, clause 7.2
// prints its on-the-day arm, and `delivery_days` is NOT required at Send.
//
// ⚠ IT IS WHY `delivery_days` COULD NOT SIMPLY BE OMITTED FOR MAKEUP. Register
// `:189` marks it REQUIRED at v4 because clauses 4.7 and 11 both add days *to
// the period stated in clause 7.2*; `f` returns null when any value is absent,
// so an unset `delivery_days` omits 7.2 WHOLE and leaves two clauses pointing
// at a clause that is not in the document. The basis gives 7.2 a sentence for
// both trades, so the referent always exists.
//
// ⚠ THE ASSIGNMENT OF EACH TRADE TO A BASIS IS A JUDGEMENT, NOT A DERIVATION.
// Nothing in the estate records whether a trade hands over on the day; these
// fourteen were assigned by what the trade does and are the chair's to correct
// by row. The seven `on_the_day` trades are the ones whose work IS the function.
const TRADE_DEFAULTS = Object.freeze({
  makeup:          Object.freeze({ delivery_basis: 'on_the_day', vendor_category_words: 'makeup and hair',        vendor_credit_role: 'makeup',    exclusions: 'false lashes, hair extensions',        overtime_rate: '4000' }),
  hairstylist:     Object.freeze({ delivery_basis: 'on_the_day', vendor_category_words: 'hair',                   vendor_credit_role: 'hair',      exclusions: 'hair extensions',                      overtime_rate: '4000' }),
  photography:     Object.freeze({ delivery_basis: 'days',       vendor_category_words: 'wedding photography',    vendor_credit_role: 'shot_by',   exclusions: 'printed albums, drone footage',        overtime_rate: '4000', ...DELIVERS_LATER }),
  content_creator: Object.freeze({ delivery_basis: 'days',       vendor_category_words: 'wedding content',        vendor_credit_role: 'shot_by',   exclusions: 'printed albums, drone footage',        overtime_rate: '3000', ...DELIVERS_LATER }),
  decor:           Object.freeze({ delivery_basis: 'on_the_day', vendor_category_words: 'décor and production',   vendor_credit_role: 'decor',     exclusions: 'fresh flowers beyond the agreed list', overtime_rate: '6000' }),
  planning:        Object.freeze({ delivery_basis: 'on_the_day', vendor_category_words: 'planning and coordination', vendor_credit_role: 'planner', exclusions: 'vendor payments made on your behalf', overtime_rate: '5000' }),
  mehendi:         Object.freeze({ delivery_basis: 'on_the_day', vendor_category_words: 'mehendi',                vendor_credit_role: 'mehendi',   exclusions: 'cones for guests to take away',        overtime_rate: '2500' }),
  venue_catering:  Object.freeze({ delivery_basis: 'on_the_day', vendor_category_words: 'venue and catering',     vendor_credit_role: 'venue',     exclusions: 'alcohol and its licences',             overtime_rate: '8000' }),
  jewellery:       Object.freeze({ delivery_basis: 'days',       vendor_category_words: 'jewellery',              vendor_credit_role: 'styled_by', exclusions: 'insurance while in your keeping',      overtime_rate: '3000', ...DELIVERS_LATER, delivery_days: '21', delivery_method: 'handed over in person', link_live_days: '', revision_rounds: '', revision_rate: '', archive_months: '' }),
  designer:        Object.freeze({ delivery_basis: 'days',       vendor_category_words: 'outfits',                vendor_credit_role: 'wearing',   exclusions: 'alterations after the final fitting',   overtime_rate: '3000', ...DELIVERS_LATER, delivery_days: '30', delivery_method: 'handed over in person', link_live_days: '', revision_rounds: '2', revision_rate: '3000', archive_months: '' }),
  performer:       Object.freeze({ delivery_basis: 'on_the_day', vendor_category_words: 'live performance',       vendor_credit_role: 'styled_by', exclusions: 'sound and stage equipment',            overtime_rate: '6000' }),
  choreographer:   Object.freeze({ delivery_basis: 'on_the_day', vendor_category_words: 'choreography',           vendor_credit_role: 'styled_by', exclusions: 'rehearsal space hire',                 overtime_rate: '3000' }),
  invitations:     Object.freeze({ delivery_basis: 'days',       vendor_category_words: 'invitations',            vendor_credit_role: 'styled_by', exclusions: 'postage and courier',                  overtime_rate: '2000', ...DELIVERS_LATER, delivery_days: '21', delivery_method: 'handed over in person', link_live_days: '', revision_rounds: '2', revision_rate: '2000', archive_months: '' }),
  cake:            Object.freeze({ delivery_basis: 'on_the_day', vendor_category_words: 'cake and desserts',      vendor_credit_role: 'styled_by', exclusions: 'cake stands and serving ware',         overtime_rate: '2500' }),
});

// ⚠ AN UNMAPPED OR NULL CATEGORY SEEDS THE BASE AND NOTHING TRADE-SHAPED, and
// its basis is `days` — the SAFE direction. A `days` trade wrongly seeded shows
// one extra row she can clear; an `on_the_day` trade wrongly seeded HIDES a row
// clause 7.2 needs. Fail toward the question being asked.
const UNMAPPED_DEFAULTS = Object.freeze({ delivery_basis: 'days', ...DELIVERS_LATER });

// ⚠ THE PLACEHOLDERS ARE BYTES AND THEY ARE LISTED HERE BECAUSE THEY SHIP.
// R-40.116: a `Needed` row carries a greyed suggestion that vanishes on focus
// and is NEVER stored. They live beside the defaults because a reader asking
// 「what does this row start as」 must find one answer, whether the row starts
// filled or empty.
//
// ⚠ `vendor_signatory_name` INTERPOLATES HER OWN NAME. The ratified frame reads
// 「e.g. Swati Roy, proprietor」 because it was drawn on Swati's sheet; shipping
// that literal would put one vendor's name on every vendor's screen — the
// costume class wearing a proper noun, and the same mistake `clientFirstName`
// cures for 「Priya」. `{name}` is substituted by the room from the session.
const PROFILE_PLACEHOLDERS = Object.freeze({
  vendor_signatory_name: 'e.g. {name}, proprietor',
  gst_pct:               '18',
});

/**
 * What `Your policies` opens with, for one vendor's category.
 *
 * ⚠ NULL FIRST, BEFORE ANY LOOKUP — the map's law 2, and for the same reason:
 * `TRADE_DEFAULTS[category]` on `null` reads a property of nothing rather than
 * falling through a default.
 *
 * @returns {{ seeded: boolean, delivery_basis: 'days'|'on_the_day', fields: Object }}
 *   `seeded` is returned rather than inferred from `Object.keys(fields).length`,
 *   which is F-40.138's class one plane over: the unmapped row has fields too.
 */
function tradeDefaultsFor(category) {
  const raw = (category === null || category === undefined) ? null : String(category).trim();
  const row = (raw && Object.prototype.hasOwnProperty.call(TRADE_DEFAULTS, raw))
    ? TRADE_DEFAULTS[raw]
    : null;
  const merged = { ...TRADE_BASE, ...(row || UNMAPPED_DEFAULTS) };
  const basis = merged.delivery_basis;
  delete merged.delivery_basis;
  // ⚠ AN EMPTY STRING IS NOT A DEFAULT. The `days` trades that hand over in
  // person carry `link_live_days: ''` to CLEAR the gallery row they inherit
  // from `DELIVERS_LATER`; shipping it would draw a blank marked `Default`,
  // which is a suggestion of nothing.
  for (const k of Object.keys(merged)) if (merged[k] === '') delete merged[k];
  return { seeded: row !== null, delivery_basis: basis, fields: Object.freeze(merged) };
}

// The six rows of clause 7, which is the only clause whose rows vary by trade.
// Every other row on the sheet is asked of everyone.
const DELIVERY_FAMILY = Object.freeze([
  'delivery_days', 'delivery_method', 'link_live_days',
  'revision_rounds', 'revision_rate', 'archive_months',
]);

/**
 * The rows a trade never asks.
 *
 * ⚠ DERIVED FROM THE SEED, NOT FROM THE BASIS, and the difference is a real
 * one rather than a tidiness. Keying this on `delivery_basis === 'on_the_day'`
 * returned `[]` for jewellery — a `days` trade that hands over in person and
 * therefore seeds no gallery link, no revision rounds and no archive period.
 * Those four rows would then have been DRAWN, empty, with no default and no
 * `Needed` mark: a row with no answer, no suggestion and no reason to be there.
 *
 * So a trade omits exactly the clause-7 rows its own seed does not carry. The
 * basis governs three other things — 7.2's arm, whether `delivery_days` is
 * required at Send, and whether the hint line stands — and it does not govern
 * this. One question, one source.
 */
function omittedFor(category) {
  const { fields } = tradeDefaultsFor(category);
  return Object.freeze(DELIVERY_FAMILY.filter((k) => !(k in fields)));
}

module.exports = {
  ANNEXES,
  ANNEX_KEYS,
  CATEGORY_ANNEXES,
  TRADE_DEFAULTS,
  TRADE_BASE,
  DELIVERY_FAMILY,
  PROFILE_PLACEHOLDERS,
  annexTitle,
  attachedTitles,
  attachedKeys,
  annexesFor,
  tradeDefaultsFor,
  omittedFor,
};
