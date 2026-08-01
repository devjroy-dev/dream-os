'use strict';
// scripts/lib/stripComments.js
// ═══════════════════════════════════════════════════════════════════════════════
// THE ESTATE'S ONE COMMENT STRIPPER — F-07.74's cure, CE-ruled F1→(b1)/F2→(a).
// ═══════════════════════════════════════════════════════════════════════════════
//
// WHY THIS FILE EXISTS. Every bench in this repo that asks "does this token appear
// in the CODE" needs comments gone first, because the estate's cure comments quote
// the very bytes they retired — a cell reading raw text convicts on the
// explanation. Eleven sites in ten proofs each carried their own copy of
//
//     .replace(/\/\*[\s\S]*?\*\//g, '')
//
// and that rule is WRONG. It treats the `/*` inside the string literal
// `accept="image/*"` as a comment-open and deletes everything to the next real
// `*/`. At 5535e24 that swallowed 6,519 characters of live sanctuary code across
// two bites, and 8,094 characters across seven files estate-wide — invisible to
// every absence-cell reading those files. F-07.74.
//
// F-07.99 IS WHY THE DEFINITION LIVES HERE AND NOT IN A COMMENT. F-07.52 already
// tried one-home-by-verbatim-port: tdw07_p1_discover.proof.mjs:25-28 carried the
// stripper "ported rather than re-authored so the two proofs cannot drift" — and
// the ported copy was NEVER CALLED. A definition with no call-site fooled this
// estate for a whole block. Hence: one MODULE, imported; and every proof on the
// coverage list carries an INVOCATION cell proving it actually calls this.
//
// ── THE RULE ─────────────────────────────────────────────────────────────────
// Character scan with string-literal tracking. A `/*` opens a comment only when
// the scanner is not inside a string, a template literal, or another comment; and
// (belt-and-braces, from the donor) only where a comment can legally begin — never
// mid-token, so `accept="image/*"` and `${x}/*y*/` cannot open a false block.
//
// NEWLINES INSIDE BLOCK COMMENTS ARE PRESERVED. Stripped output stays line-stable,
// so a cell that reports a line number reports the source's line number. The three
// inline scanners this module replaces (f0784_panel, f0790_dashboard,
// f0789_conversations) did not do this.
//
// THE DONOR IS THIS REPO'S OWN: scripts/b07_f0776_doors_bench.js:53-70 held the
// first correct answer in the estate, canaries and vacuity twin included. It is
// promoted out of that bench and into this module. The cross-repo identity cell
// (scripts/b07_f0774_stripper_bench.js §5, and its twin in dreamos-pwa) pins the
// two definitions together so the class cannot be cured on one repo and left
// standing on the other.
//
// ── THE DECLARED HOLES (CE-ruled: declared + canaried beats undeclared) ──────
// This scanner is a large improvement, not a compiler. Measured against the
// TypeScript lexer over every source file at 5535e24 by
// the pwa census instrument scripts/tdw_stripper_census.mjs: the RETIRED naive rule disagrees with the
// compiler on 134 files; this scanner disagrees on 10. Both holes are named here
// because an undeclared dependency is how F-07.74 lasted a whole block.
//
// H1 · JSX TEXT APOSTROPHES (under-strips). In JSX text an apostrophe is prose,
//      not a quote — `we're` opens a string this scanner never closes where the
//      author meant one. While mis-parked in that state the scanner does not
//      recognise `//` or `/*`, so REAL COMMENTS SURVIVE into the "code" string.
//      Magnitude at 5535e24: 2,543 non-whitespace characters in
//      app/(frost)/frost/canvas/sanctuary/page.tsx, 484 in
//      components/vendor/MessageBubble.tsx, ten files in total.
//      DIRECTION OF HARM: an absence-cell can CONVICT on comment prose, and a
//      presence-cell can PASS on comment prose. It cannot manufacture the
//      F-07.74 hollow green — nothing live is deleted — but it is not nothing.
//
// H2 · REGEX LITERALS (over-strips). The scanner does not know `/` can open a
//      regex. A regex whose tail reads `\//` — e.g.
//      /^https?:\/\/(www\.)?instagram\.com\//i in dreamos-pwa at lib/frost/igLink.ts — trips the
//      line-comment branch and the rest of that line is deleted. ARMED TODAY at
//      that one site, costing 8 non-whitespace characters; the enclosing function
//      survives, which §4 of tdw_f0774_stripper.proof.mjs asserts by cell.
//      The adjacent shape — a regex ending `*/`, e.g. /RS\.?\s*/i at
//      app/(frost)/frost/canvas/onboarding/page.tsx:68 and /^```json\s*/i at
//      dream-os src/engine/src/core/distill.ts:160 — closes an already-open real
//      comment early. Not armed at this tip; canaried so the day it is, a bench
//      reddens.
//
// BOTH HOLES CLOSE ONLY WITH A REAL LEXER. The compiler-based census instrument
// ships beside this module and re-adjudicates the whole class on demand; its
// captured output is scripts/tdw_stripper_census.out.txt. The divergence list is
// a CAPPED, NAMED SET there — a new divergence is a finding, not a surprise.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Remove JS/TS/JSX comments from source text, preserving strings, template
 * literals and line structure.
 * @param {string} src
 * @returns {string}
 */
function stripComments(src) {
  let out = '';
  let i = 0, inBlock = false, inLine = false, inStr = null;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (inLine) { if (c === '\n') { inLine = false; out += c; } i++; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i += 2; } else { if (c === '\n') out += c; i++; } continue; }
    if (inStr) { if (c === '\\') { out += c + (n || ''); i += 2; continue; } if (c === inStr) inStr = null; out += c; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; out += c; i++; continue; }
    if (c === '/' && n === '/') { inLine = true; i += 2; continue; }
    if (c === '/' && n === '*') {
      const prev = out.replace(/[ \t]+$/, '').slice(-1);
      if (prev === '' || '(){};,=:+&|?!\n[<'.includes(prev)) { inBlock = true; i += 2; continue; }
    }
    out += c; i++;
  }
  return out;
}

/** The naive rule this module retired. Exported for VACUITY TWINS only — a §0.Y
 *  cell proves the naive rule WOULD swallow the specimen §0.X proves survives.
 *  Never use this to strip anything. */
const NAIVE_RETIRED = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '');

module.exports = { stripComments, NAIVE_RETIRED };
