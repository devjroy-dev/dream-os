// src/lib/moneyRegisterGate.js — the register law applied to money a HUMAN TYPES
//
// ── WHY THIS FILE EXISTS (F-08.44) ───────────────────────────────────────────
// `formatRs` (src/lib/format.js, symbol formatRs) governs money the estate
// COMPUTES. Nothing governed money a human TYPED. `demo_vendors.rate_display`
// is free text and `demo_vendors.about` is free prose, and both are handed to a
// model as grounded context (src/api/demo/vendor.js, symbols carrying
// `context_text` and `dynamicContext`) — so whatever is typed becomes a fact the
// model speaks. This gate is the door that was missing.
//
// ── THE ASYMMETRY, AND WHY IT IS DELIBERATE (F-08.47) ────────────────────────
// FOUNDER RULING, 2026-08-03, verbatim: 「 demo plane only 」.
//
// This helper has EXACTLY ONE WIRED CALLER: src/api/admin/demoAdmin.js, the
// demo plane's two create doors. It is NOT wired to the real-vendor plane, and
// that is a ruling rather than an oversight:
//
//   · demo `about`/`rate_display` are typed by THE ESTATE — the founder in the
//     admin console, or the bulk paste. Gating them constrains the estate's own
//     typing, which the estate may do to itself.
//   · real `about` is written by THE VENDOR ABOUT THEMSELVES. It sits in the
//     vendor's own editable allowlist —
//       src/api/vendor/me.js, symbol ALLOWED_FIELDS
//     — and it is a SCORED profile field, weight 0.135 (F-07.8's cure) —
//       src/lib/vendor/profileScore.js, symbol TERM_WEIGHTS
//     Filtering it would silently rewrite a vendor's saved self-description
//     after they wrote it, and would move a number they are scored on.
//     [Both symbols were authored from memory in this file's first draft and
//      were WRONG — `EDITABLE_FIELDS` and `WEIGHTS` do not exist. §4.7 of
//      scripts/b08_console_bench.js caught them. The cell stays because that
//      is what it is for.]
//
// That is a consent question wearing an engineering question's clothes, and it
// is not a console sitting's to grant. F-08.47 is a DECLARED GAP with its own
// charter when the founder sequences it.
//
// ── THE MECHANISM THAT GUARDS THE GAP ────────────────────────────────────────
// Per NOTE_19 §6(g), the asymmetry is NOT asserted as a negative ("no filter
// over there") — an absence-cell passes honestly while something one layer up
// breaks it. It is asserted against THIS FILE, which is a positive artifact:
//   1. this module's wired caller list is exactly ONE and the bench names which;
//   2. this paragraph names the ruling, so a future sitting that wires the
//      second caller cannot do it by accident;
//   3. the bench asserts (2) as well as (1) — F-06.85's shape extended to a
//      declared gap. A cell guarding the caller count without guarding the
//      REASON is satisfied by a sitting that adds the caller and deletes the
//      comment.
// Guarded by scripts/b08_console_bench.js §4.
//
// ── WHAT THIS GATE DOES AND DOES NOT DO ──────────────────────────────────────
// IT REFUSES MALFORMED MONEY. IT NEVER REQUIRES MONEY.
// A null, undefined, empty or whitespace-only value is LAWFUL and PASSES. This
// is load-bearing, not incidental: nine of twelve production demo rows carry no
// rate at all, and scripts/b08_p4_factory_bench.js §3.2/§3.5 drive fixtures that
// supply neither column. A gate that refused emptiness would redden a sealed
// bench and would be wrong about the estate. Celled both ways at §1.1/§M.1.
//
// ── TWO MODES, AND THE REASON IS A REAL WORD (F-06.85: name the mechanism) ────
// `rate_display` is a money field BY ITS COLUMN'S PURPOSE — every byte in it is
// money, so shorthand is refused unconditionally.
// `about` is PROSE. "We shoot in 4K" is a wedding videographer's ordinary
// sentence and `4K` is a resolution, not four thousand rupees. Refusing it would
// be a false refusal on a vendor-facing surface. So in prose mode the shorthand
// and grouping rules fire only when the text carries a money marker (`Rs`,
// `INR`, or the glyph) somewhere in it.
// The glyph and a bare ungrouped five-digit run are refused in BOTH modes: the
// glyph is forbidden everywhere by the register law, and a five-plus digit run
// is not ordinary prose (a year is four).
//
// NAMED LIMITS, declared rather than discovered:
//   · a ten-digit phone number typed into `about` trips the ungrouped rule and
//     is reported as a money defect. The row is refused either way and the
//     estate would rather it were; the REASON is imprecise and is named here.
//   · the money-marker test scans the WHOLE value rather than a window around
//     the number. Deliberate simplification: prose that mentions Rs at all is
//     prose whose numbers are money-adjacent.
//   · this gate reads bytes. It has no opinion about whether a number is a
//     plausible price.

// The register law: grouped Indian digits behind `Rs`. The glyph and the
// k / L / Cr shorthand forms are both forbidden.
const GLYPH = /\u20B9/;

// A digit immediately (or across one space) followed by a shorthand magnitude.
const SHORTHAND = /\d\s*(?:k|l|lakhs?|lacs?|cr|crores?)\b/i;

// `Rs`, `Rs.`, `INR`, or the glyph, anywhere in the value.
const MONEY_MARK = /(?:\u20B9|\bRs\.?|\bINR\b)/i;

// Five or more consecutive digits that are not part of a comma-grouped number.
const UNGROUPED = /(?<![\d,])\d{5,}(?![\d,])/;

// Any comma-containing digit token, and the shape a lawful one must have.
const GROUPED_TOKEN = /(?<![\d,])\d[\d,]*,[\d,]*\d(?![\d,])/g;
const INDIAN_GROUPING = /^\d{1,2}(?:,\d{2})*,\d{3}$/;

const REASONS = Object.freeze({
  GLYPH: 'glyph',
  SHORTHAND: 'shorthand',
  UNGROUPED: 'ungrouped',
  GROUPING: 'grouping',
});

// ── THE FOUNDER'S BYTES ──────────────────────────────────────────────────────
// Vetoed and frozen in chat 2026-08-03, CE Addendum 3 §1 (V2 and V3). Frozen at
// the BYTE, not the glyph (CE-117). These are the ONLY user-facing strings this
// module owns; the two keys beside them are error keys and are never rendered
// as prose by any surface that has a `detail`.
const RATE_REGISTER_KEY = 'rate_register';
const RATE_REGISTER_MESSAGE =
  'Rate must be written in full — Rs 50,000. No symbols, no K or L shorthand.';

const ABOUT_REGISTER_KEY = 'about_register';
const ABOUT_REGISTER_MESSAGE =
  'About must write money in full — Rs 50,000. No symbols, no K or L shorthand.';

/**
 * @param {*} value       the typed bytes, or null/undefined
 * @param {object} opts
 * @param {boolean} opts.prose  true for free prose (`about`), false for a money
 *                              field (`rate_display`). Defaults to false.
 * @returns {{ok: true} | {ok: false, reason: string}}
 */
function checkMoneyRegister(value, opts) {
  const prose = !!(opts && opts.prose);
  const text = String(value == null ? '' : value).trim();

  // ABSENCE IS LAWFUL. See the header — this line is why b08_p4_factory holds.
  if (text === '') return { ok: true };

  if (GLYPH.test(text)) return { ok: false, reason: REASONS.GLYPH };

  const marked = prose === false || MONEY_MARK.test(text);

  if (marked && SHORTHAND.test(text)) {
    return { ok: false, reason: REASONS.SHORTHAND };
  }

  if (UNGROUPED.test(text)) return { ok: false, reason: REASONS.UNGROUPED };

  if (marked) {
    const tokens = text.match(GROUPED_TOKEN) || [];
    for (const t of tokens) {
      if (INDIAN_GROUPING.test(t) === false) {
        return { ok: false, reason: REASONS.GROUPING };
      }
    }
  }

  return { ok: true };
}

/** `rate_display` — the money field. Shorthand refused unconditionally. */
function checkRateDisplay(value) {
  return checkMoneyRegister(value, { prose: false });
}

/** `about` — free prose. Shorthand and grouping judged only when money-marked. */
function checkAbout(value) {
  return checkMoneyRegister(value, { prose: true });
}

module.exports = {
  checkMoneyRegister,
  checkRateDisplay,
  checkAbout,
  REASONS,
  RATE_REGISTER_KEY,
  RATE_REGISTER_MESSAGE,
  ABOUT_REGISTER_KEY,
  ABOUT_REGISTER_MESSAGE,
};
