// src/lib/contractPdf.js — THE WEDDING SERVICES AGREEMENT
//
// G3.2 sitting 2 · built to `docs/specs/TDW_19_CONTRACT_GENERIC_v4.md` (R-40.106,
// the lawyer's yes) at the geometry of `dreamos-pwa/docs/mocks/contract-document-mock.html`
// (pwa `a2e7fe32`), frames P1-first · P2-money · P3-annex · P4-sign · P4-sign-unsigned.
//
// ═══ WHAT IS AND IS NOT AUTHORED HERE ══════════════════════════════════════
// Almost none of this file's prose is this file's. Every clause sentence is v4
// VERBATIM, and the sixteen clauses and seven annexes are transcribed, never
// re-voiced.
//
// ⚠ v4 RE-VOICED EVERY CLAUSE. v3 said "we" and "you"; v4 says **the Vendor** and
// **the Client**, and the Client is ONE PARTY COMPRISING TWO PERSONS (1.2). Not one
// sentence of the v3 renderer survived — it was re-transcribed whole rather than
// restyled. A paper that is v4-voiced in clauses 1-6 and v3-voiced in 7-12 is worse
// than a paper that is late, and it reads as fine on a preview.
//
// EIGHT STRINGS *ARE* THIS FILE'S, all veto rows: the eyebrow, the identity line,
// the reference line, the annex eyebrow, the seal label, the digest label, the two
// execution labels and the folio. They are CHROME, which v4 does not specify.
//
// ═══ IT IS PURE ════════════════════════════════════════════════════════════
//     the typed source   src/lib/vendor/contractSource.js   — reads, never renders
//     the renderer       THIS FILE                          — renders, never reads
//     the url writer     contracts.js `setSealedPath`       — the only writer of it
// `supabase` is not a parameter and must never become one. `contractAnnex.js` is
// importable here for the same reason: it takes no supabase either.
//
// ⚠ ONE CALL SITE — `renderContract`. `b56` asserts the count by grep, reds at two.
//
// ═══ NOTHING LEAVES AS AN UNDERSCORE — R-40.88 ═════════════════════════════
// `BLANK` is RETIRED. It printed `__________` for an unset field, which put the
// product's plumbing into a couple's hand and made a legal instrument look like a
// form somebody forgot to finish.
//
// Three classes, off the register's Omission column, each stated in v4's own margin
// note under the clause:
//   REQUIRED   — always prints; the field is required at Send (the surface hides
//                Send AND `send-to-couple` refuses — a hidden control is not a gate)
//   OMIT       — the sentence is absent when its field is unset
//   OMIT-ROW   — the row is absent; the table is NOT padded
//
// ⚠ THE MECHANISM IS STRUCTURAL, NOT 168 CONDITIONALS. `f` returns `null` when ANY
// interpolated value is missing and `sub(null)` draws nothing — so a sentence with
// an unset field CANNOT print a blank, because no code path renders it at all.
//
// ═══ GATE, THEN SWITCH — AND THE ORDER IS THE RULING ═══════════════════════
// A clause is printed when its GATE is open, its SWITCH is not off, and its fields
// are present. The gate is a FACT (is a function outside her city?); the switch is
// the vendor's. **A switch may close an open gate and can never open a shut one.**
// Clause 5 is the specimen: an in-city wedding prints no accommodation clause
// whatever the switch says, and an outstation one prints it unless she waives it.
//
// ⚠ AND CLAUSE 10 HAS NO SWITCH AND MUST NEVER GAIN ONE. v4: "10.5 is the consent
// construction and is not a clause a Vendor may switch off: a Vendor's toggle
// governs whether a clause is PRINTED, never whether the Client's consent is ON."
// The T1 frame says the same to the vendor in her own words. `b56` reds on a
// mutation that adds `publication` to `CLAUSE_SWITCHES`.
//
// ═══ GEOMETRY — READ OFF THE MOCK'S STYLESHEET, IN pt ══════════════════════
// A4 595.28 x 841.89, padding 50pt / 60pt -> content box 475.28pt. Body DM Sans
// 9.5pt/1.55. Every number below is `.pg`'s own.
//
// ⚠ `tnum` WAS NEVER IN THE RATIFIED LOOK. `.pg` sets `font-variant-numeric:
// lining-nums tabular-nums` and DM Sans HAS NEITHER FEATURE — not in the subset and
// not upstream (GSUB census run). Chrome does not synthesise them, so the frames the
// founder approved were shot with proportional DM Sans figures. The features are
// passed only to Cormorant, where they measurably bite.
//
// Returns: Buffer (PDF bytes) ready to upload to Supabase storage.
'use strict';

const path = require('path');
const PDFDocument = require('pdfkit');
const { formatRs, formatDate } = require('./format');
const { annexTitle, attachedKeys } = require('./contractAnnex');

// ── Colours · the mock's five, and not a sixth ─────────────────────────────
const INK = '#1A1A1A', SEC = '#555555', MUT = '#999999', GOLD = '#B08D6A', HAIR = '#E5E5E5';

// ── THE FACES ──────────────────────────────────────────────────────────────
// ⚠ F-40.232 AND F-40.233 HAD ONE ROOT CAUSE — fontkit's woff2 transform — AND TWO
// SYMPTOMS. The mock embeds its faces as woff2; fontkit reads woff2's transformed
// `glyf`/`loca` and pdfkit's subsetter re-encodes from that in-memory table, and
// that path produces both failures. In DM Sans it threw at `doc.end()` on forty
// codepoints — a hyphen, a semicolon, every accented letter. In Cormorant it threw
// nothing, embedded cleanly, and DREW NOTHING: two rasterisers found zero dark
// pixels, so the letterhead of every agreement would have been invisible.
//
// The first cure decomposed DM Sans's 75 composite glyphs. That treated a SYMPTOM —
// composites are what the transform mangles worst — and left the disease in the face
// that was not decomposed. The census that certified it asserted a non-empty buffer,
// and a PDF whose glyphs are blank still has bytes.
//
// ALL THREE NOW SHIP AS PLAIN DECOMPRESSED `.ttf` (`TTFont(woff2); flavor = None`),
// composites intact, no decomposition: the fewest transformations between the face
// the founder ratified and the file that ships. Metrics identical to the mock's own
// blocks to the unit — 761 520 332 489 234 (Cormorant) · 681 574 312 608 266 (DM
// Sans 400) · 691 587 328 616 256 (DM Sans 500), advances of H n 1 8 space.
//
// `scripts/b60_fonts_bench.js` is R-40.112's cell: for every codepoint of every face
// in this directory it asserts OUTLINES from the embedded `FontFile2` and INK from a
// rasteriser, and its green names which of the two it measured.
const FONT_DIR = path.join(__dirname, '..', 'assets', 'fonts');
const FACE = {
  head:  path.join(FONT_DIR, 'CormorantGaramond-500.ttf'),
  body:  path.join(FONT_DIR, 'DMSans-400.ttf'),
  bodyM: path.join(FONT_DIR, 'DMSans-500.ttf'),
};

// ── THE FILL MARK IS THE MOCK'S AND NOT THE DOCUMENT'S ────────────────────
// The mock underlines a filled field in gold so the founder can SEE which words came
// out of a row; its own caption says it is never printed. A couple reading her
// agreement has no use for the distinction, and underlining half a sentence would
// make a plain document look like a form.
const MARK_FILLS = false;

// ── T1's SWITCHES, BY THEIR OWN KEYS ──────────────────────────────────────
// The four the frame draws plus the two the chair added when the list gained a
// scroll. Each decides whether a clause is PRINTED. `publication` IS NOT HERE and
// must not be added — see the header.
const CLAUSE_SWITCHES = Object.freeze([
  'accommodation',        // clause 5   — gated on an outstation function
  'late_payment',         // clause 4.7
  'extra_hours',          // clause 4.6
  'tax_block',            // clause 4.2
  'named_professional',   // clause 12.2
  'portfolio_use',        // clause 10.4
]);

// ⚠ DEFAULT ON. An absent switch is a vendor who has not touched it, not a vendor
// who turned it off; only an explicit `false` closes. A default of off would make a
// contract quietly thinner than the one she reviewed.
function switchOn(T, key) {
  const s = (T && T.clauses) || {};
  return s[key] !== false;
}

// ── PRESENCE ───────────────────────────────────────────────────────────────
// One definition of "set", used by every omission decision. `0` and `false` are
// PRESENT: a zero-percent cancellation tier is a number somebody chose, and treating
// it as absent would silently drop a term.
function present(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

/**
 * The omission tag. Returns the sentence, or `null` when ANY value is unset.
 *     f`Delivery is within ${days} days of the last function.`
 * ⚠ THIS IS WHY NO UNDERSCORE CAN LEAVE: there is no branch that renders a sentence
 * with a missing field; the sentence does not exist.
 */
function f(strings, ...vals) {
  if (vals.some((v) => !present(v))) return null;
  return strings.reduce((a, s, i) => a + s + (i < vals.length ? String(vals[i]) : ''), '');
}
// ── A PLACEHOLDER PASSES THROUGH UNFORMATTED — R-40.120 (C5) ─────────────────
// `GET /contracts/standard` renders v4 before a single value exists, so `M.fee_total`
// arrives as `[your fee]` and `contract.deposit_pct` as `[the deposit %]`. `formatRs`
// on a bracketed string would print `Rs [yo,ur fee]`; `pct` would print `[…]%`. A
// value shaped `[…]` is a LABEL, never a number, and the renderer hands it on as
// written. Nothing outside the placeholder source can produce this shape: fee and
// deposit are numeric at the fill door and the money home, so a vendor's real
// agreement never meets this branch.
const isPlaceholder = (v) => typeof v === 'string' && /^\[[^\]]+\]$/.test(v.trim());
function rs(n)  { return isPlaceholder(n) ? n : (present(n) ? `Rs ${formatRs(n)}` : null); }
function pct(n) { return isPlaceholder(n) ? n : (present(n) ? `${n}%` : null); }
// A vendor's own sentence prints as written, and the clause supplies its full stop
// only when she did not: `…two rooms.` must not become `…two rooms..`.
function ownWords(v) {
  if (!present(v)) return null;
  const t = String(v).trim();
  return /[.!?]$/.test(t) ? t.slice(0, -1) : t;
}
function joinSentences(...parts) {
  const kept = parts.filter(present);
  return kept.length ? kept.join(' ') : null;
}

// ⚠ `deliveryBasis` IS A PARAMETER AND NOT A LOOKUP — R-G32.21, and the reason
// is this file's own constitution. `contractAnnex.js` is below the renderer and
// could be required here without touching the write half, but the basis is a
// fact about the VENDOR'S TRADE and this function already takes `vendor`. Two
// ways to learn one fact is the shape `contractAnnex.js` was created to end.
// `contractSource.js` resolves it once, from the vendor row it has already
// read, and hands it in with everything else.
//
// It defaults to `'days'` for the same fail-safe reason the unmapped seed does:
// a caller that forgets it prints the clause v4 shipped with, never a shorter one.
function generateContractPdf({ contract, vendor, client, functions, profile, money, signature, deliveryBasis = 'days', sealed = true }) {
  return new Promise((resolve, reject) => {
    try {
      // ⚠ `bufferPages` IS NOT DECORATION. The folio reads `Page 2 of 9` and the 9
      // is not known until the last annex is set.
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
        bufferPages: true,
      });
      doc.registerFont('Head',  FACE.head);
      doc.registerFont('Body',  FACE.body);
      doc.registerFont('BodyM', FACE.bodyM);

      const chunks = [];
      doc.on('data',  (c) => chunks.push(c));
      doc.on('end',   ()  => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W      = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const X      = doc.page.margins.left;
      const RIGHT  = X + W;
      const BOTTOM = doc.page.height - doc.page.margins.bottom;

      const P   = profile || {};
      const T   = (contract && contract.terms)   || {};
      const AX  = (contract && contract.annexes) || {};
      const M   = money || {};
      const fns = Array.isArray(functions) ? functions : [];
      // ── WHERE A FUNCTION IS HELD — ONE LOOKUP, TWO ARMS (R-40.118, C1) ─────
      // An events-linked function carries its venue and city at `T.functions[id]`
      // (the room's per-event writer). A MANUAL function — `terms.functions_manual`,
      // normalised by `contractSource.functionsForContract` into the same row shape
      // — carries them ON THE ROW. F-40.243: a client made from a phone number reaches
      // no events, so before this arm the clause 3 table and the clause 5 gate read
      // nothing and Send was unreachable. Both readers now go through here.
      const placeOf = (e) => (T.functions && T.functions[e.id]) || { venue: e.venue, city: e.city };
      const business = vendor.business_name || 'Your Vendor';
      const attached = attachedKeys(AX);
      const annexNames = attached.map(annexTitle);

      // ═══ PRIMITIVES — THE CSS BOX MODEL, NOT ACCUMULATED `doc.y` ══════════
      // ⚠ THE FIRST BUILD DRIFTED 70pt DOWN THE PAGE BY THE GOLD RULE, and the
      // cause was treating two different coordinates as one. CSS `margin-top: 7pt`
      // is measured between BOX EDGES; pdfkit's `doc.y` sits at the top of the next
      // LINE BOX, which for a 24pt Cormorant contains a great deal of empty space
      // above the cap. Adding 7 to `doc.y` is not the same instruction.
      //
      // The model, derived rather than tuned:
      //   · pdfkit's natural line height is `(ascent - descent) * size / upm`. For
      //     DM Sans that is 1.302 x size; CSS asks for 1.55. So the gap the caller
      //     must supply is `cssLineHeight * size - natural` — NOT `size * 0.55`,
      //     which is what the first build passed and why every line was ~3pt tall
      //     too much, compounding down the page.
      //   · CSS puts HALF the leading above the glyph box and half below; pdfkit
      //     puts all of it below. So the y passed in is `boxTop + gap/2`, and after
      //     the call `doc.y` is pulled back by the same half so it lands on the
      //     true box bottom.
      // One home: `block()` does both, every text run goes through it, and no
      // caller ever adds a bare number to `doc.y` again.
      function lineGapFor(font, size, cssLineHeight) {
        doc.font(font).fontSize(size);
        const natural = doc.currentLineHeight(false);
        return (cssLineHeight * size) - natural;
      }
      /**
       * Draw a text block at a CSS box top and leave `doc.y` at its box bottom.
       * @param {number|null} boxTop — absolute y of the CSS box edge; null continues
       *   from `doc.y`, which is always a box edge because every block ends on one.
       */
      function block(font, size, cssLH, colour, text, boxTop, opts) {
        const o = opts || {};
        const gap = lineGapFor(font, size, cssLH);
        const top = (boxTop === null || boxTop === undefined) ? doc.y : boxTop;
        doc.fillColor(colour).text(text, o.x === undefined ? X : o.x, top + gap / 2,
          Object.assign({ width: o.width === undefined ? W : o.width, lineGap: gap }, o.textOpts));
        doc.y -= gap / 2;
        return doc.y;
      }
      function need(h) {
        if (doc.y + h > BOTTOM - 26) { doc.addPage(); doc.y = doc.page.margins.top; }
      }
      // `.pg-eyebrow` DM Sans 500 7.5/1, .18em, uppercase, muted. pdfkit's
      // characterSpacing is absolute pt, so .18em at 7.5pt = 1.35.
      function eyebrow(text, boxTop) {
        block('BodyM', 7.5, 1, MUT, String(text).toUpperCase(), boxTop,
              { textOpts: { characterSpacing: 7.5 * 0.18 } });
      }
      // `.pg-rule` .5pt/#E5E5E5 margin 14 0 · `.pg-rule.gold` 1pt/#B08D6A 13 0 16.
      // A rule is a zero-height box, so its margins are simply added.
      function rule(gold) {
        const y = doc.y + (gold ? 13 : 14);
        doc.moveTo(X, y).lineTo(RIGHT, y)
           .strokeColor(gold ? GOLD : HAIR).lineWidth(gold ? 1 : 0.5).stroke();
        doc.y = y + (gold ? 16 : 14);
      }
      // `.pg-h2` Cormorant 500 14/1.2, margin 15 0 7, lnum+tnum
      function h2(text) {
        need(56);                    // a heading alone at the foot loses a clause
        block('Head', 14, 1.2, INK, text, doc.y + 15,
              { textOpts: { features: ['lnum', 'tnum'] } });
        doc.y += 7;
      }
      // `.pg-sub` — `.pg-n` is 22pt wide with a 9pt gap, and the two are BASELINE
      // aligned. Both runs are 9.5/1.55, so one box top serves both.
      const GUTTER = 22, GAP = 9;
      function sub(n, text, grey) {
        if (!present(text)) return;                    // <- the omission rule
        need(30);
        const top = doc.y;
        if (present(n)) {
          block('BodyM', 9.5, 1.55, MUT, String(n), top,
                { width: GUTTER, textOpts: { features: ['lnum', 'tnum'], lineBreak: false } });
        }
        block('Body', 9.5, 1.55, grey ? SEC : INK, text, top,
              { x: X + GUTTER + GAP, width: W - GUTTER - GAP });
        doc.y += 7;                                    // `.pg-sub` margin-bottom
      }
      // `.pg-tbl` — th 7.5/1 .14em uppercase muted, padding 0 7 6; td 9.5/1.55,
      // padding 6 7; .5pt hairline under every row; margin 4 0 9.
      function tRow(cells, widths, opts) {
        const o = opts || {};
        need(26);
        let x = X; const y = doc.y; let bottom = y;
        cells.forEach((cell, i) => {
          const w = W * widths[i];
          const size = o.head ? 7.5 : 9.5;
          const lh   = o.head ? 1 : 1.55;
          const gap  = lineGapFor(o.head ? 'BodyM' : 'Body', size, lh);
          const align = (o.right && o.right.indexOf(i) >= 0) ? 'right' : 'left';
          doc.fillColor(o.head ? MUT : INK)
             .text(o.head ? String(cell).toUpperCase() : String(cell), x + 7, y + 6 + gap / 2,
                   { width: w - 14, align, lineGap: gap,
                     characterSpacing: o.head ? 7.5 * 0.14 : 0 });
          bottom = Math.max(bottom, doc.y - gap / 2);
          x += w;
        });
        doc.y = bottom + 6;
        doc.moveTo(X, doc.y).lineTo(RIGHT, doc.y).strokeColor(HAIR).lineWidth(0.5).stroke();
      }
      // eyebrow -> Cormorant 24/1.05 at margin-top 7 -> ident 8.5/1.5 at 5 ->
      // reference 8.5/1.5 at 2 -> gold rule. Every margin is `.pg`'s own and every
      // one is applied to a BOX EDGE.
      function letterhead(eyebrowText, title, identLine, refLine) {
        eyebrow(eyebrowText, doc.page.margins.top);
        block('Head', 24, 1.05, INK, title, doc.y + 7);
        if (present(identLine)) block('Body', 8.5, 1.5, SEC, identLine, doc.y + 5);
        if (present(refLine))   block('Body', 8.5, 1.5, MUT, refLine,   doc.y + 2);
        rule(true);
      }

      const identity = [vendor.address, vendor.city].filter(present).join(', ');
      const gstLine  = present(vendor.gstin) ? `GSTIN ${vendor.gstin}` : null;
      // ⚠ PROFILE TOKENS READ FROM `P`, NEVER `T` — register v2 :87 :106 :130 :131.
      // `vendor_category_words`, `exclusions`, `gst_treatment` and `gst_pct` are
      // PROFILE (the room's sheet stores them in `contract_profiles.fields`; the
      // annex map seeds them there) and this file read all four off TERMS, which
      // nothing writes them to. So 2.2's "in particular" sentence, the tax block
      // and the trade word never came from her sheet. Same class as the signatory
      // read above; found by the standard render; candidate finding.
      const category = P.vendor_category_words || vendor.category;
      const clientNames = [T.partner_1_name || (client && client.name), T.partner_2_name]
        .filter(present);
      // ⚠ THE REFERENCE IS CHROME, NOT AN INSTRUMENT FIELD (register §9A). It is not
      // among v4's 168 tokens and appears in no clause. An unnumbered contract — a
      // preview before compose allocated one — prints the date alone rather than the
      // word "Agreement" with nothing after it.
      const dateWord = formatDate(T.agreement_date || (contract && contract.created_at)) || '';
      const refLine  = present(contract && contract.number)
        ? [`Agreement ${contract.number}`, dateWord].filter(present).join(' \u00b7 ')
        : dateWord;

      letterhead('Wedding services agreement', business,
                 [identity, gstLine].filter(present).join(' \u00b7 ') || null, refLine);

      // ═══ 1 · PARTIES — REQUIRED ═══════════════════════════════════════════
      h2('1 \u00b7 Parties');
      sub('1.1', f`This Agreement is made on ${dateWord} between:`);
      // ⚠ THE SIGNATORY IS A PROFILE TOKEN — register v2 :90 — and this file read it
      // off TERMS at five sites while the room stored it in `contract_profiles`. The
      // Vendor line of 1.1 and the seal's vendor name were therefore omitted on every
      // composed agreement; b56's fixture carried the name in `terms` and never saw
      // it. Found by the standard-agreement render (R-40.120 C5); every read now
      // goes to `P`. Candidate finding, chair to allocate.
      sub('', f`${business}, a ${category} business at ${identity}, acting through ${P.vendor_signatory_name}, telephone ${vendor.phone} (\u201cthe Vendor\u201d);`);
      sub('', 'and');
      sub('', f`${clientNames.join(' and ')}, telephone ${client && client.phone} (together \u201cthe Client\u201d).`);
      sub('1.2', 'The Client comprises the two persons named in clause 1.1. They are jointly and severally bound by this Agreement.', true);
      sub('1.3', 'Either person named as the Client may give instructions to the Vendor, and either may be held to what is agreed under this Agreement, unless the Client notifies the Vendor in writing that only one named person may give instructions.', true);

      // ═══ 2 · SERVICES AND ANNEXES — REQUIRED ══════════════════════════════
      // ⚠ THE ANNEX NAMES COME FROM `contractAnnex.js` AND ARE NOT TYPED HERE. They
      // were authored twice before that file existed — here and in the pwa's room —
      // in a file whose own comment said a name typed twice would be two homes.
      h2('2 \u00b7 Services and annexes');
      sub('2.1', annexNames.length
        ? `The Vendor shall provide the services described in the annexes attached to this Agreement: ${annexNames.join(', ')}. Each attached annex forms part of this Agreement.`
        : 'The Vendor shall provide the services described in the annexes attached to this Agreement. Each attached annex forms part of this Agreement.');
      // ⚠ 2.2 PRINTS WITHOUT ITS LIST where `exclusions` is unset. The sentence is
      // the RULE and survives; only the list is omitted. v4 says so explicitly, and
      // it is the difference between omitting a parameter and omitting a term.
      sub('2.2', present(P.exclusions)
        ? `A service which is not described in this Agreement or in an attached annex is not included. In particular, the following are not included: ${P.exclusions}.`
        : 'A service which is not described in this Agreement or in an attached annex is not included.', true);
      sub('2.3', f`The Vendor shall perform the services with the skill and care reasonably to be expected of a ${category} business, whether through its own personnel or through its team.`, true);
      sub('2.4', 'Either party may propose a variation of the services. A variation takes effect only when both parties have agreed it in writing and the Client has accepted the price stated by the Vendor for it.', true);
      sub('2.5', 'The Vendor may decline to perform any act which would be unsafe, unlawful, or contrary to the rules of the venue. Such a refusal is not a breach of this Agreement.', true);

      // ═══ 3 · FUNCTIONS AND DATES — REQUIRED ═══════════════════════════════
      h2('3 \u00b7 Functions and dates');
      sub('3.1', 'The Vendor shall attend the following functions:');
      dateTable();
      sub('3.2', 'The dates stated in clause 3.1 are the principal subject of this Agreement. From receipt of the deposit the Vendor shall reserve those dates and shall not accept a booking which prevents the Vendor from attending. Before receipt of the deposit no date is reserved.', true);
      sub('3.3', 'The Vendor shall attend and be ready at the time stated. Where a function begins late for a reason not attributable to the Vendor, the Vendor shall remain for the hours agreed, counted from the agreed start time; any period beyond those hours is charged under clause 4.6.', true);
      sub('3.4', 'A change of date is a postponement under clause 6. A change of venue within the same city is a variation under clause 2.4. A change of city is a postponement.', true);

      // ═══ 4 · FEES AND PAYMENT ═════════════════════════════════════════════
      h2('4 \u00b7 Fees and payment');
      sub('4.1', present(T.fee_breakdown)
        ? f`The fee is ${rs(M.fee_total)}, comprising ${T.fee_breakdown}.`
        : f`The fee is ${rs(M.fee_total)}.`);
      // ⚠ 4.2 IS OMITTED WHOLE where the Vendor is not registered for GST — not a
      // zero rate and not a struck line. The T1 frame says the same to her:
      // "Absent — add your GSTIN in Settings".
      if (switchOn(T, 'tax_block')) {
        sub('4.2', f`The fee is ${P.gst_treatment} of goods and services tax. Tax at ${pct(P.gst_pct)} amounts to ${rs(M.gst_amount)}, and the sum payable is ${rs(M.fee_payable_with_gst)}. The Vendor's GSTIN is ${vendor.gstin} and the Vendor shall issue a tax invoice for each payment received. Where the rate changes by operation of law before the first function, the sum payable changes accordingly.`, true);
      }
      sub('4.3', f`The deposit is ${pct(contract.deposit_pct)} of the fee, being ${rs(M.deposit_amount)}, payable on signature of this Agreement. The deposit is what reserves the dates under clause 3.2. No separate booking amount, retainer or advance is payable; this Agreement recognises one such sum, under one name.`);
      sub('4.4', 'The fee is payable as follows:');
      moneyTable();
      sub('4.5', railsSentence(), true);
      if (switchOn(T, 'extra_hours')) {
        sub('4.6', f`Hours beyond those stated in an attached annex are charged at ${rs(P.overtime_rate)} per ${P.overtime_unit}. The Vendor shall notify the Client before such hours begin wherever it is practicable to do so.`, true);
      }
      if (switchOn(T, 'late_payment')) {
        sub('4.7', f`Where a sum remains unpaid more than ${P.late_grace_days} days after its due date, the Vendor may charge interest at ${pct(P.late_interest_pct)} per month on the sum overdue, and may suspend work until the sum is paid. The Vendor shall not suspend work in the week preceding a function, and shall notify the Client before suspending work. Time lost to a suspension is added to the period stated in clause 7.2.`, true);
      }
      sub('4.8', 'The Vendor shall deliver the completed work upon receipt of the full fee.', true);

      // ═══ 5 · ACCOMMODATION AND TRAVEL — GATE, THEN SWITCH ═════════════════
      // ⚠ THE GATE IS A FACT ABOUT THE FUNCTIONS AND THE SWITCH CANNOT OPEN IT.
      // v4: omitted whole "where no function is outside the Vendor's city". So an
      // in-city wedding prints NO clause 5 whatever `clauses.accommodation` says —
      // the switch is only ever a way to CLOSE an open gate, which is a vendor
      // waiving accommodation she is entitled to (she lives near the venue, or has
      // family there). The T1 row renders only when the gate is open, and its
      // caption is auto: "On — a function is outside New Delhi".
      const outstation = fns.some((e) => {
        const k = placeOf(e);
        return present(k.city) && present(vendor.city)
          && String(k.city).trim().toLowerCase() !== String(vendor.city).trim().toLowerCase();
      });
      if (outstation && switchOn(T, 'accommodation')) {
        h2('5 \u00b7 Accommodation and travel');
        sub('5.1', f`This clause applies to each function held outside ${vendor.city}.`);
        // ⚠ 5.2 IS THE VENDOR'S OWN SENTENCE, PRINTED AS WRITTEN — register v3
        // (R-40.120 C2; the lawyer's yes, R-40.121). v2 carried three tokens here
        // — `same_venue`, `rooms`, `travel_terms` — and the profile sheet never asked
        // the first two, so 5.2 was omitted on every agreement ever rendered
        // (F-40.244). One free-text token now, seeded per trade in
        // `contractAnnex.js TRADE_BASE`, and the clause is still OMITTED WHOLE when
        // it is unset (R-40.88): `f` has no branch for a missing value.
        sub('5.2', f`Travel and accommodation are provided on the following terms: ${ownWords(P.travel_and_stay_terms)}.`, true);
        sub('5.3', 'Accommodation and travel provided under this clause are in addition to the fee stated in clause 4.1.', true);
      }

      // ═══ 6 · POSTPONEMENT AND CANCELLATION — prints ═══════════════════════
      h2('6 \u00b7 Postponement and cancellation');
      sub('6.1', f`Where the Client gives written notice not less than ${P.postpone_notice_days} days before the first function, the Vendor shall transfer all sums paid to new dates falling within ${P.postpone_window_months} months, if the Vendor is available on those dates. This right may be exercised once.`);
      sub('6.2', 'Where the Vendor is not available on the dates proposed, the Client may either retain the sums paid on account for the period stated in clause 6.1, or treat this Agreement as cancelled under clause 6.4, at the tier applicable to the date on which the postponement was requested and not to the date of the function.', true);
      sub('6.3', "Where the new dates fall in a period at which the Vendor's rates are higher, the Client shall pay the difference. Where they fall in a period at which the rates are lower, no reduction is made.", true);
      sub('6.4', 'The Client may cancel this Agreement by written notice. The date of that notice is the date of cancellation, and the sum payable is:');
      cancelTable();
      sub('6.5', f`Sums already paid are set against the sum payable under clause 6.4. Where the Client has paid more than that sum, the Vendor shall refund the difference within ${P.refund_days} days. Where the Client has paid less, the Client shall pay the difference within the same period.`, true);
      sub('6.6', f`Whether the deposit is refundable: ${P.deposit_refundable}`, true);
      sub('6.7', f`The Vendor may cancel this Agreement only for a reason stated in clause 11, for non-payment by the Client, or where performance would be unsafe or unlawful. In that event the Vendor shall refund all sums paid within ${P.refund_days} days, and shall use reasonable endeavours to identify a supplier of comparable standing for the same dates, without warranting that the Vendor will succeed in doing so.`, true);
      sub('6.8', 'A postponement caused by an event stated in clause 11 is governed by that clause and not by clause 6.1.', true);

      // ═══ 7 · DELIVERABLES AND DELIVERY ════════════════════════════════════
      h2('7 \u00b7 Deliverables and delivery');
      sub('7.1', 'The Vendor shall deliver the items listed in the attached annexes.');
      // ⚠ 7.2 HAS TWO ARMS AND EXACTLY ONE OF THEM ALWAYS PRINTS — R-G32.21,
      // and it is the reason `delivery_basis` exists at all.
      //
      // Clause 4.7 and clause 11 both end 「…is added to the period stated in
      // clause 7.2」. `f` returns null when any interpolated value is absent
      // (:157), so on the single-arm version an unset `delivery_days` omitted
      // 7.2 WHOLE while 4.7 and 11 printed intact — two clauses pointing at a
      // clause not in the document. Register `:196` names that exact failure as
      // the reason `delivery_days` was made REQUIRED at v4.
      //
      // Making it required was right while every trade delivered later. It is
      // wrong for a trade whose work IS the function: a makeup artist has no
      // delivery period, and forcing a number made her print 「within 0 days」.
      // The basis gives 7.2 a sentence for both trades, so the referent exists
      // either way and neither vendor states a period she does not mean.
      //
      // ⚠ THE ON-THE-DAY ARM CARRIES NO INTERPOLATION, so it cannot be omitted
      // by an absent value — which is the property that makes 4.7 and 11 safe.
      // R-40.88 still governs everything else in this clause: 7.3, 7.4 and 7.5
      // omit as before, because a trade that hands over on the day has no
      // gallery link, no revision rounds and no archive period to state.
      //
      // ⚠ AND 「the period stated in clause 7.2」 STILL READS CORRECTLY against
      // it. The period named is a day; time lost to a suspension is added to it
      // and the day moves. The chair's ruling says so and the sentence bears it.
      sub('7.2', deliveryBasis === 'on_the_day'
        ? 'Delivery is on the day of the last function. Time lost to a suspension under clause 4.7, or to an event stated in clause 11, moves that day accordingly.'
        : f`Delivery is within ${P.delivery_days} days of the last function, unless an attached annex states a different period for a particular item. Days lost to a suspension under clause 4.7, or to an event stated in clause 11, are added to that period.`);
      // 7.3's LINK sentence is absent where delivery is not by link; the method
      // sentence is not.
      sub('7.3', joinSentences(
        f`Delivery is by ${P.delivery_method}.`,
        f`Where delivery is by a download link, the link remains available for ${P.link_live_days} days and the Vendor shall state the date on which it expires.`), true);
      sub('7.4', f`${P.revision_rounds} round(s) of changes are included. Each further round is charged at ${rs(P.revision_rate)}.`, true);
      sub('7.5', f`The Vendor shall retain the original files for ${P.archive_months} months and may delete them thereafter. The Client should obtain and retain a copy. The Vendor does not provide an archiving or backup service.`, true);

      // ═══ 8 · THE CLIENT'S OBLIGATIONS — prints ════════════════════════════
      h2("8 \u00b7 The Client's obligations");
      sub('8.1', 'The Client shall name one person whom the Vendor may contact at each function, and shall give that person\u2019s telephone number.');
      sub('8.2', 'The Client shall give decisions and approvals when the Vendor requests them. Where a delay attributable to the Client causes a deadline to pass, the period stated in clause 7.2 is extended by the same period.', true);
      // ⚠ 8.3's TERMS are absent where `meals_provision` is unset; THE OBLIGATION IS
      // NOT. v4 says so explicitly — omitting a parameter is not omitting a duty.
      sub('8.3', present(P.meals_provision)
        ? `The Client shall provide meals and water for the Vendor's team on a long day: ${P.meals_provision}.`
        : "The Client shall provide meals and water for the Vendor's team on a long day.", true);
      sub('8.4', 'The Client shall inform the Vendor of anything affecting the safety of the team or the performance of the services, and of any person who is not to be photographed.', true);
      sub('8.5', "The Vendor shall be courteous to the Client and to the Client's guests, and the Client shall procure the same in return. Where a member of the Vendor's team is threatened or harassed, the Vendor may withdraw from that function and shall inform the Client's named contact of the reason at the time.", true);

      // ═══ 9 · VENUE AND LOCATION — prints, carries no fields ═══════════════
      h2('9 \u00b7 Venue and location');
      sub('9.1', "The Client shall obtain the venue's permission for the Vendor to work, including permission for the Vendor's equipment, lighting and power supply, and for a drone where an attached annex provides for one.");
      sub('9.2', 'The Client shall inform the Vendor of any restriction imposed by the venue as soon as the Client becomes aware of it.', true);
      sub('9.3', "The Client shall procure safe access to the spaces the Vendor requires, at the times agreed, and a secure place in which the Vendor's equipment may be kept.", true);
      sub('9.4', 'Where the venue refuses a permission, or where conditions at the venue make an act unsafe, the Vendor shall not perform that act. Such non-performance is not a breach of this Agreement and is not a ground for a reduction of the fee.', true);
      if (attached.indexOf('f') >= 0) {
        sub('9.5', 'Licences and permissions held by the venue, and those required from the Client, are stated in Annex F where that annex is attached.', true);
      }

      // ═══ 10 · IP AND PUBLICATION — PRINTS ALWAYS, NO SWITCH ═══════════════
      // See the header. `publication` is not in CLAUSE_SWITCHES and must not be.
      h2('10 \u00b7 Intellectual property and publication');
      sub('10.1', 'The Vendor owns the copyright in the material the Vendor creates under this Agreement.');
      sub('10.2', "Upon payment of the fee in full, the Client has a perpetual, worldwide licence to use that material for the personal purposes of the Client and the Client's family, at no further cost. A guest to whom the Client gives the material receives it on the same personal-use terms.");
      sub('10.3', "The Client shall not sell that material, licence it to any other person, enter it in a competition as the Client's own work, or permit it to be used in advertising, without the Vendor's written permission.", true);
      if (switchOn(T, 'portfolio_use')) {
        sub('10.4', f`The Vendor may display the material in the Vendor's portfolio, on the Vendor's website and social media, and to persons considering engaging the Vendor. The Client may refuse now, or withdraw permission later, and the Vendor shall cease within ${P.takedown_days} days, save in respect of material already printed or already shared by another person.`, true);
      }
      sub('10.5', f`A page for the Client's wedding may be published, carrying photographs and a credit to each person who worked on the wedding. Signature of this Agreement does not enable that publication. It is enabled only by the Client, in the Client's own account, by the setting named \u201cPublish our wedding\u201d, which is off unless the Client turns it on, and which the Client may turn off at any time, for any reason, and without asking any person. When the setting is off, the page is removed within ${P.takedown_days} days. Nothing in this Agreement overrides that setting.`, true);
      sub('10.6', f`Where that page is published, each person who worked on the wedding is credited by role. The Vendor is credited as ${P.vendor_credit_role}, and the Vendor shall name the others so that they are credited also. No person pays to be credited, and no credit is placed or ranked by payment.`, true);
      sub('10.7', f`No person is named in published material without that person's own consent, and a guest who asks to be removed from a published photograph is removed within ${P.takedown_days} days.`, true);
      sub('10.8', 'In respect of material the Client supplies to the Vendor \u2014 photographs, music, artwork or text \u2014 the Client warrants that the Client has the right to permit its use.', true);

      // ═══ 11 · FORCE MAJEURE — prints ══════════════════════════════════════
      h2('11 \u00b7 Force majeure');
      sub('11.1', 'Where a flood, fire, earthquake, epidemic or public-health restriction, order of government or curfew, riot or civil unrest, strike or failure of transport or power which could not reasonably be worked around, serious illness or injury to the Vendor or to a key member of the Vendor\u2019s team, or a death in the family of either party, prevents a function from taking place, neither party is in breach of this Agreement and neither owes the other damages.');
      sub('11.2', 'The parties shall first seek to move the wedding rather than to cancel it. The limit in clause 6.1 does not apply to a postponement under this clause, and all sums paid are transferred with it.', true);
      sub('11.3', f`Where, after genuine endeavours, the parties cannot agree new dates within ${P.fm_window_months} months, either party may end this Agreement by notice in writing. The Vendor shall retain the value of work already done and of costs committed and not recoverable, itemised for the Client, shall refund the balance within ${P.refund_days} days, and neither party owes the other anything further.`, true);
      sub('11.4', 'This clause is not available to a party who was able to perform and chose not to, and it does not extend to a change of plan, a change of mind, or a shortage of funds.', true);
      sub('11.5', 'A party relying on this clause shall inform the other as soon as it is reasonably able to do so, and shall state what it is doing in consequence.', true);

      // ═══ 12 · PERSONNEL AND SUBSTITUTION ══════════════════════════════════
      h2('12 \u00b7 Personnel and substitution');
      sub('12.1', 'The Vendor may perform the services through employees, assistants and freelancers, and remains responsible to the Client for their work and their conduct as if it were the Vendor\u2019s own.');
      if (switchOn(T, 'named_professional')) {
        sub('12.2', f`${T.named_professional} shall attend personally. Where illness, injury or an event stated in clause 11 prevents that attendance, the Vendor shall provide a person of comparable skill at no additional cost, and shall inform the Client as soon as the Vendor knows. Where the Client does not accept the substitute, the Client may cancel that function, and the Vendor shall refund the value attributable to it; the tiers in clause 6.4 do not apply to that refund.`, true);
      }
      sub('12.3', 'Where no individual is named, the Vendor shall allocate the team as the Vendor judges best, providing the number of persons stated in the attached annex.', true);

      // ═══ 13 · LIABILITY — prints ══════════════════════════════════════════
      h2('13 \u00b7 Liability');
      sub('13.1', 'The Vendor shall perform the services with reasonable skill and care.');
      sub('13.2', 'The total liability of the Vendor under this Agreement, for all causes, is limited to the fee actually received by the Vendor.');
      sub('13.3', 'Neither party is liable to the other for indirect or consequential loss.', true);
      sub('13.4', "Cameras, lights and memory cards may fail. The Vendor uses professional equipment and takes backups as the attached annex states. Where material is nevertheless lost by such a failure and not through the Vendor's carelessness, the Vendor shall refund a fair proportion of the fee attributable to what was lost.", true);
      sub('13.5', 'Nothing in this clause limits liability for death or personal injury caused by negligence, for fraud, or for any other liability which the law does not permit to be limited.', true);

      // ═══ 14 · CONFIDENTIALITY AND PERSONAL DATA — prints ══════════════════
      h2('14 \u00b7 Confidentiality and personal data');
      sub('14.1', "The Vendor shall keep the Client's information, the guest list and the affairs of the Client's family confidential, shall use them only to perform this Agreement, shall retain them no longer than clause 7 and the law require, and shall not sell them or share them for marketing.");
      sub('14.2', 'The Client may ask the Vendor what information the Vendor holds, may ask the Vendor to correct it, and may ask the Vendor to erase it, save in respect of what clause 10 licenses, what the Vendor is required to retain, and what is already published with the Client\u2019s consent.', true);

      // ═══ 15 · GOVERNING LAW — REQUIRED ════════════════════════════════════
      // ⚠ ONE HOME FOR THE JURISDICTION. `vendor.city` prints at 1.1 and again here,
      // from the same read. It is never typed a second time.
      h2('15 \u00b7 Governing law and jurisdiction');
      sub('15.1', 'This Agreement is governed by the law of India.');
      sub('15.2', f`The courts at ${vendor.city} have jurisdiction over any matter the parties cannot settle between themselves, which the parties shall first attempt to do.`);

      // ═══ 16 · EXECUTION — REQUIRED ════════════════════════════════════════
      h2('16 \u00b7 Execution');
      sub('16.1', f`The Vendor sends this Agreement to the Client by WhatsApp. The Client reads it, the Vendor sends a one-time password to ${client && client.phone}, and the Client enters that password and selects \u201cI agree\u201d. That constitutes the Client's signature.`);
      sub('16.2', 'The Vendor then seals a copy of this Agreement in portable document format, carrying the date, the time, the telephone number of each party, and a digest of the document. Each party receives that copy by WhatsApp. The sealed copy is the signed Agreement.');
      sub('16.3', 'This is a contract concluded electronically under section 10A of the Information Technology Act, 2000, and neither party shall contend that it is of no effect by reason of the manner in which it was signed.', true);
      sub('16.4', 'Where the Client prefers to sign on paper, the Vendor shall provide a paper copy, and a signed paper copy has the same effect as a copy sealed under clause 16.2.', true);

      // ⚠ THE LAST PAGE IS THE FRAME'S PAGE. `P4-sign` shows the execution block
      // and the seal together on a page of their own, and the rhythm rebuild made
      // the document compact enough that clause 16 could end mid-page and let them
      // share it with earlier prose. The break is FORCED so the page the founder
      // ratified is the page that prints — the frame governs, not whatever the flow
      // happens to produce.
      //
      // Only when there is something above them: a forced break on an already-empty
      // page would leave a blank sheet in the middle of a legal instrument.
      if (doc.y > doc.page.margins.top + 1) { doc.addPage(); doc.y = doc.page.margins.top; }
      executionBlock();
      sealBlock();

      // ═══ THE ANNEX PAGES — F-40.190 ═══════════════════════════════════════
      // ⚠ THE PAGE THAT HAS NEVER EXISTED. The old renderer NAMED its annexes at
      // clause 2.1 and printed none of them, so a couple could not find what was
      // included in her own agreement.
      attached.forEach((k, i) => annexPage(k, i === attached.length - 1));

      stampFolios(doc, business, client, X, W);
      doc.end();

      // ── locals ────────────────────────────────────────────────────────────
      // ⚠ ONE ROW PER FUNCTION, AND WHEN THERE ARE NONE THE TABLE IS NOT DRAWN.
      // An empty five-column grid says "we forgot"; a sentence says what is true. A
      // cell with no value is EMPTY — never a dash, never an underscore.
      function dateTable() {
        if (!fns.length) {
          sub('', 'The functions and their venues are set out in the annexes attached to this Agreement.', true);
          return;
        }
        const COLS = [0.22, 0.16, 0.14, 0.28, 0.20];
        tRow(['Function', 'Date', 'Time', 'Venue', 'City'], COLS, { head: true });
        fns.forEach((e) => {
          const k = placeOf(e);
          tRow([
            present(e.title) ? e.title : '',
            formatDate(e.event_date) || '',
            e.event_time ? hhmm(e.event_time) : (present(e.slot) ? e.slot : ''),
            present(k.venue) ? k.venue : '',
            present(k.city) ? k.city : '',
          ], COLS);
        });
      }
      // ⚠ THE DEPOSIT IS INSTALMENT 1 AND IS NOT PRINTED TWICE. One number, one home
      // — `deposit_amount` is computed once, in the source. A milestone row whose
      // fields are unset is ABSENT; the table is not padded.
      function moneyTable() {
        const COLS = [0.42, 0.16, 0.22, 0.20];
        tRow(['Instalment', 'Share', 'Amount', 'Due'], COLS, { head: true, right: [1, 2, 3] });
        const dep = [pct(contract.deposit_pct), rs(M.deposit_amount)];
        if (dep.every(present)) tRow(['Deposit, on signature', dep[0], dep[1], 'on signature'], COLS, { right: [1, 2, 3] });
        (M.milestones || []).forEach((m) => {
          const cells = [m.label, pct(m.pct), rs(m.amount), m.due ? formatDate(m.due) : null];
          if (cells.every(present)) tRow(cells, COLS, { right: [1, 2, 3] });
        });
      }
      // A tier row whose fields are unset is absent from the table.
      function cancelTable() {
        const COLS = [0.62, 0.38];
        const rows = [
          [f`more than ${P.cancel_tier_1_days} days before the first function`, pct(P.cancel_tier_1_pct)],
          [f`${P.cancel_tier_2_days}\u2013${P.cancel_tier_1_days} days before`,  pct(P.cancel_tier_2_pct)],
          [f`${P.cancel_tier_3_days}\u2013${P.cancel_tier_2_days} days before`,  pct(P.cancel_tier_3_pct)],
          [f`fewer than ${P.cancel_tier_3_days} days before`,                    pct(P.cancel_tier_4_pct)],
        ].filter((r) => r.every(present));
        if (!rows.length) return;
        tRow(['Notice given', 'Sum payable'], COLS, { head: true, right: [1] });
        rows.forEach((r) => tRow(r, COLS, { right: [1] }));
      }
      // ⚠ THE RAILS SENTENCE OMITS THE RAILS SHE HAS NOT SET and never prints an
      // empty one. The platform sentence is v4's and always survives: it is the
      // promise that no money passes through TDW.
      function railsSentence() {
        const ways = [
          f`by UPI at ${vendor.upi_id}`,
          f`by transfer to ${vendor.account_name}, account ${vendor.account_number}, IFSC ${vendor.ifsc}`,
          'or in cash against a receipt',
        ].filter(present);
        const head = ways.length > 1
          ? `Payment is made directly to the Vendor, ${ways.join(', ')}.`
          : 'Payment is made directly to the Vendor.';
        return `${head} No sum payable under this Agreement passes through any platform, and no commission is taken upon it.`;
      }
      // `.pg-exec` two columns, gap 34pt, margin-top 6pt. Labels 7.5/1 .14em
      // uppercase muted with 6pt beneath; values 9.5/1.55.
      function executionBlock() {
        need(130);
        const colW = (W - 34) / 2;
        const y0 = doc.y + 6;
        const col = (x, label, lines) => {
          doc.font('BodyM').fontSize(7.5).fillColor(MUT)
             .text(label.toUpperCase(), x, y0, { width: colW, characterSpacing: 7.5 * 0.14 });
          doc.font('Body').fontSize(9.5).fillColor(INK)
             .text(lines.filter(present).join('\n'), x, doc.y + 6, { width: colW, lineGap: 9.5 * 0.55 });
          return doc.y;
        };
        const yA = col(X, 'For the Vendor', [
          P.vendor_signatory_name,
          present(P.vendor_signatory_name) ? `for ${business}` : business,
          vendor.phone,
        ]);
        doc.y = y0;
        const yB = col(X + colW + 34, 'The Client', [clientNames.join(' and '), client && client.phone]);
        doc.y = Math.max(yA, yB);
        if (annexNames.length) {
          doc.font('Body').fontSize(9.5).fillColor(SEC)
             .text(`Attached: ${annexNames.join(', ')}`, X, doc.y + 14, { width: W, lineGap: 9.5 * 0.55 });
        }
      }
      // `.pg-seal` .5pt gold box, padding 13 15, margin-top 16; the fingerprint
      // label takes a further 11pt.
      //
      // ⚠ THREE STATES, NOT TWO.
      //   sealed:false                → NO BLOCK AT ALL. These are the bytes
      //                                 `document_sha256` hashes; a seal inside them
      //                                 could not describe them.
      //   sealed:true, signature null → P4-sign-unsigned: LABELS print, values are
      //                                 em-dashes. Clause 16.4's paper path is real
      //                                 and nothing here reads as signed from across
      //                                 a room.
      //   sealed:true, signature set  → P4-sign: the values print.
      function sealBlock() {
        if (!sealed) return;
        need(160);
        const boxTop = doc.y + 16;
        let y = boxTop + 13;
        const label = (t, extra) => {
          doc.font('BodyM').fontSize(7.5).fillColor(GOLD)
             .text(t.toUpperCase(), X + 15, y + (extra || 0), { width: W - 30, characterSpacing: 7.5 * 0.18 });
          y = doc.y;
        };
        const value = (t) => {
          doc.font('Body').fontSize(9.5).fillColor(INK).text(t, X + 15, y + 4, { width: W - 30 });
          y = doc.y;
        };
        const S = signature || null;
        const DASH = '\u2014';
        // ⚠ F-40.234 — THE FOUR LINES ARE THE FRAME'S, NOT THIS FILE'S.
        // The first cut authored them from memory — `On {date} at {time}`, `By the
        // Client, from {phone}`, `One-time password, clause 16.1` — after sixteen
        // clauses and seven annexes had been transcribed verbatim. The copy law
        // broken at the END of a long faithful pass, in the one block the founder
        // read most closely. Transcribed here from `P4-sign`:
        //   Signed electronically
        //   <Client> · <number> · <date>, <time> IST
        //   Confirmed by one-time password sent to that number.
        //   <signatory>, for <business> · <vendor number>
        //   Document fingerprint · SHA-256
        // The label stands ALONE (c-40.49). Which bytes are hashed is a fact for the
        // register and the handover — the digest is over `.agreed.pdf`, R-G32.19 —
        // and not for the paper: the couple reads a fingerprint, the estate reads a
        // definition.
        const signedLine = S && S.verified_at
          ? [clientNames.join(' and '), S.signer_phone,
             `${formatDate(S.verified_at)}, ${istClock(S.verified_at)}`].filter(present).join(' \u00b7 ')
          : DASH;
        const confirmLine = S && S.verified_at
          ? (S.channel === 'paper'
              ? 'Signed on paper under clause 16.4.'
              : 'Confirmed by one-time password sent to that number.')
          : DASH;
        // Ruling F7 — the Vendor's signatory, from the profile's `Who signs`.
        const vendorLine = present(P.vendor_signatory_name)
          ? [`${P.vendor_signatory_name}, for ${business}`, vendor.phone].filter(present).join(' \u00b7 ')
          : DASH;

        label('Signed electronically');
        value(signedLine);
        value(confirmLine);
        // ⚠ ON AN UNSIGNED COPY THIS IS AN EM-DASH TOO. `P4-sign-unsigned` prints
        // the seal's LABELS AND NO VALUES; a populated vendor line beside two
        // dashes would read as half-signed from across a room, which is the exact
        // thing that frame exists to prevent.
        value(S && S.verified_at ? vendorLine : DASH);
        label('Document fingerprint \u00b7 SHA-256', 11);
        // ⚠ COURIER, AND IT NEEDS NO FILE. `.pg-hash` is Courier New 8pt in the mock
        // — a THIRD face the two embedded families do not cover. pdfkit carries
        // Courier as a standard font, so a fingerprint costs no third font file.
        // A monospaced digest is one a reader can compare by eye.
        doc.font('Courier').fontSize(8).fillColor(SEC)
           .text(S && S.document_sha256 ? S.document_sha256 : DASH, X + 15, y + 4, { width: W - 30 });
        const boxBottom = doc.y + 13;
        doc.rect(X, boxTop, W, boxBottom - boxTop).strokeColor(GOLD).lineWidth(0.5).stroke();
        doc.y = boxBottom + 6;
      }
      // Each annex is a TITLED PAGE with its own letterhead and its own lettered
      // numbering. The eyebrow names the agreement, `.pg-letter` is the annex's own
      // name, the ident line carries vendor · client · reference.
      function annexPage(k, isLast) {
        doc.addPage();
        doc.y = doc.page.margins.top;
        const name = String(annexTitle(k) || '').replace(/^Annex [A-G] \u2014 /, '');
        const who  = [business, clientNames.join(' & ')].filter(present).join(' \u00b7 ');
        letterhead(`Annex ${k.toUpperCase()} to the wedding services agreement`, name,
          [who, present(contract && contract.number) ? `Agreement ${contract.number}` : null]
            .filter(present).join(' \u00b7 '), null);
        (annexBody()[k] || []).forEach(([n, text]) => sub(n, text, false));
        // Veto row 15 — the muted line naming what is NOT attached, on the last
        // annex page only. Founder kept it: a couple should be able to see that the
        // absence was chosen rather than lost.
        const absent = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].filter((x) => attached.indexOf(x) < 0);
        if (isLast && absent.length) {
          rule(false);
          sub('', `Annexes ${absent.map((x) => x.toUpperCase()).join(', ')} are not attached to this Agreement and are not part of it.`, true);
        }
      }
      // ── THE ANNEX BODIES — v4 verbatim ────────────────────────────────────
      // A function rather than a constant because every sentence interpolates `P`
      // through `f`, and a module-level table would have to be a function of it.
      function annexBody() {
        return {
          a: [
            ['A.1', joinSentences(
              f`Scope. ${P.a_team} shall attend each function, covering ${P.a_coverage_hours} hours, with professional cameras and a second camera body on site.`,
              f`Drone: ${P.a_drone}.`,
              'Where a drone is engaged it shall fly only where the law and the venue permit; where permission is refused, or where flight is unsafe, it shall not fly, and that is neither a breach nor a ground for a refund.')],
            ['A.2', joinSentences(
              f`Deliverables. ${P.a_edited_count} edited and colour-corrected photographs, delivered ${P.a_photo_format}.`,
              f`Film: ${P.a_film}.`, f`Album: ${P.a_album}.`)],
            ['A.3', joinSentences(
              f`Timing. A teaser within ${P.a_teaser_days} days; all other items within the period stated in clause 7.2.`,
              f`Where the Client is to select images for an album, the Client shall select within ${P.a_selection_days} days of the Vendor sending the gallery.`)],
            ['A.4', joinSentences(f`Additional charges. ${P.a_extras}.`, f`Raw and unedited files: ${P.a_raw_files}.`)],
            ['A.5', joinSentences(
              f`Backups and music. The Vendor shall back up every card to ${P.a_backup_scheme} on the same night.`,
              'The Vendor uses licensed music in films; where the Client requires a particular commercial track, the licence is the Client\u2019s to obtain and the Vendor may decline to use it.')],
          ],
          b: [
            ['B.1', joinSentences(
              f`Scope. ${P.b_looks} look(s) each for ${P.b_persons} \u2014 ${P.b_persons_named} \u2014 by ${P.b_artist_name}, with ${P.b_assistants} assistant(s).`,
              f`Trial: ${P.b_trial}.`,
              f`The Vendor uses professional products, ${P.b_product_brands}, sanitised brushes, and disposable applicators for lips and eyes.`)],
            ['B.2', f`Deliverables. Included: ${P.b_included}.`],
            ['B.3', joinSentences(
              f`Timing and conditions. ${P.b_time_per_person} per person.`,
              f`The Vendor shall arrive ${P.b_arrival_before} before the Client is required to be ready.`,
              'The Client shall provide a clean and well-lit place, a power point, and a chair at a workable height.')],
            ['B.4', joinSentences(
              f`Additional charges. ${P.b_extras}, which may include extensions, hairpieces, draping, nails, and lashes beyond the first pair.`,
              'Travel is governed by clause 5.')],
            ['B.5', joinSentences(
              f`Disclosure. The Client shall inform the Vendor of any allergy, skin condition, recent treatment or medication not less than ${P.b_disclosure_days} days before the first function.`,
              'A patch test is available free on request and the Vendor recommends one. The Vendor is not responsible for a reaction to a condition the Client knew of and did not disclose, or to a test the Client declined.')],
          ],
          c: [
            ['C.1', joinSentences(
              f`Scope. D\u00e9cor for ${P.c_areas}.`,
              f`The Vendor shall survey the venue and send the Client ${P.c_drawings} drawings by ${P.c_drawings_date}; the Client shall approve them in writing by ${P.c_approval_date}.`,
              'After approval, a change is a variation under clause 2.4 and shall be priced before it is made.')],
            ['C.2', joinSentences(
              f`Inventory. All items listed in ${P.c_inventory}.`,
              'Items marked hired return to the Vendor; items marked purchased belong to the Client. Nothing not listed becomes the Client\u2019s property.')],
            ['C.3', joinSentences(
              f`Timing. The Vendor shall set up over ${P.c_setup_hours} hours before the function and shall clear within ${P.c_strike_hours} hours after it.`,
              'The Client shall procure that access from the venue.')],
            ['C.4', joinSentences(
              'Additional charges and damage. Anything the venue will not permit and which must be solved by another means is charged additionally.',
              f`Security deposit on hired items: ${P.c_security_deposit}, returnable within ${P.refund_days} days where the items are returned undamaged.`,
              f`Damage caused by the Client, the Client's guests or the Client's other suppliers is charged on the basis of ${P.c_damage_basis}.`,
              'Ordinary wear is not damage, and damage caused by the Vendor to the venue is the Vendor\u2019s.')],
            ['C.5', 'Flowers. Flowers are grown and not manufactured. Colour, size and availability vary with the season, the market and the day. The Vendor may substitute a flower of equivalent quality and value without asking, and shall inform the Client where the substitution is substantial. A substitution is not a fault and is not a ground for a reduction.'],
          ],
          d: [
            ['D.1', f`Scope. ${P.d_service_level} \u2014 ${P.d_scope}.`],
            ['D.2', joinSentences(
              f`Authority. The Vendor may commit up to ${rs(P.d_authority_limit)} on the Client's behalf without seeking approval on each occasion.`,
              'Above that sum the Vendor shall obtain the Client\u2019s approval in writing first.')],
            ['D.3', joinSentences(
              f`Timing. ${P.d_onday_team} coordinator(s) from ${P.d_onday_start} to ${P.d_onday_end} at each function.`,
              f`The run-sheet is sent to the Client by ${P.d_runsheet_date} and approved by the Client by ${P.d_runsheet_approval_date}; the approved run-sheet is what the Vendor works to.`)],
            ['D.4', f`Other suppliers' charges. The Client pays the Client's other suppliers directly, save for ${P.d_pass_through}, which the Vendor pays and the Client reimburses at actual cost.`],
            ['D.5', joinSentences(
              'Agency. The Vendor engages other suppliers as the Client\u2019s agent, in the Client\u2019s name, and the Client contracts with each of them.',
              f`The Vendor is not liable for another supplier's default or poor work unless the Vendor contracted with that supplier on the Vendor's own account; where the Vendor has done so, those suppliers are named here: ${P.d_own_account_suppliers}.`,
              'Where a decision cannot wait on the day and the Vendor cannot reach the Client\u2019s named contact, the Vendor shall decide in the Client\u2019s best interests.')],
          ],
          e: [
            ['E.1', joinSentences(
              f`Scope. ${P.e_design_complexity} for ${P.e_bride}, covering ${P.e_bride_coverage}, and ${P.e_guest_design} for ${P.e_guests} guest(s).`,
              f`${P.e_artist_count} artist(s): ${P.e_artist_names}.`)],
            ['E.2', 'Materials. Cones are natural henna, made fresh \u2014 henna, essential oil, sugar and lemon, and nothing else. No black henna and no PPD, and the Vendor shall say so to any guest who asks.'],
            ['E.3', joinSentences(
              f`Timing and conditions. Approximately ${P.e_bride_hours} hours for the bride and ${P.e_guest_minutes} minutes per guest, within ${P.e_guest_total_hours} hours in total.`,
              f`The paste should remain on the skin for not less than ${P.e_paste_hours} hours.`,
              'The Client shall provide good light and a seat at a workable height.')],
            ['E.4', f`Additional charges. Guests beyond ${P.e_guests}, or time beyond ${P.e_guest_total_hours} hours, are charged at the rate stated in clause 4.6.`],
            ['E.5', joinSentences(
              'Stain. Henna stains differently on every person. Colour depends on body heat, skin, the time the paste remains, aftercare and the weather. The Vendor shall give written aftercare and shall say what to expect, but cannot promise a particular shade, and a lighter stain is not a fault and is not a ground for a refund.',
              f`A patch test is available free on request ${P.e_patch_days} days in advance.`)],
          ],
          f: [
            ['F.1', joinSentences(
              f`Scope. ${P.f_spaces}, from ${P.f_hours_from} to ${P.f_hours_to}, for up to ${P.f_capacity} guests.`,
              f`Included: ${P.f_inclusions}.`, f`Not included: ${P.f_exclusions}.`,
              f`Parking for ${P.f_parking} cars.`)],
            ['F.2', joinSentences(
              f`Numbers and catering. The Client shall give numbers by ${P.f_headcount_date} and final numbers by ${P.f_final_headcount_date}.`,
              f`Where the Vendor caters: ${P.f_catering}, the menu agreed by ${P.f_menu_date}, at ${rs(P.f_per_plate)} per plate, charged on ${P.f_guaranteed_minimum} or on the final number, whichever is the higher.`)],
            ['F.3', joinSentences('Timing. The hours stated in F.1.', f`Beyond those hours, ${rs(P.f_overstay_rate)} per hour.`)],
            ['F.4', joinSentences(
              f`Other suppliers and deposit. The Client's other suppliers may work at the venue subject to ${P.f_outside_vendor_policy}, and any access charge is ${P.f_outside_vendor_charges}, stated now and not raised later.`,
              f`Security deposit ${rs(P.f_security_deposit)} by ${P.f_deposit_date}, returnable within ${P.refund_days} days less damage, overstay and any cleaning beyond the ordinary.`)],
            ['F.5', joinSentences(
              f`Licences and curfew. The Vendor holds ${P.f_venue_licences}.`,
              f`The Client shall obtain ${P.f_couple_licences}, which may include music rights, a liquor permit, and permission for fireworks or open flame.`,
              'Without such a permission the Vendor shall stop that activity, and that is not a breach by either party.',
              f`Amplified music stops at ${P.f_music_curfew}, and the Vendor shall hold that time.`)],
          ],
          g: [
            ['G.1', joinSentences(
              f`Scope. ${P.g_service_name} \u2014 ${P.g_service_description} \u2014 at ${P.g_functions}, by ${P.g_team_count} person(s): ${P.g_team_named}.`,
              f`The Vendor provides ${P.g_vendor_provides}; the Client provides ${P.g_couple_provides}.`)],
            ['G.2', f`Deliverables. ${P.g_deliverables}, delivered ${P.g_delivery_method}.`],
            ['G.3', joinSentences(
              f`Timing. ${P.g_hours} hours from ${P.g_start_time} at each function.`,
              f`Delivery within ${P.g_delivery_days} days of ${P.g_delivery_trigger}.`,
              f`Fittings or rehearsals: ${P.g_fittings}, ${P.g_fittings_count} session(s) at ${P.g_fittings_location}.`)],
            ['G.4', joinSentences(
              f`Additional charges. Alterations after the final fitting are charged at ${rs(P.g_alteration_rate)}.`,
              f`Items hired rather than sold \u2014 ${P.g_hired_items} \u2014 return to the Vendor, and Annex C.4's damage terms apply.`)],
            ['G.5', f`Special terms. ${P.g_special_terms}`],
          ],
        };
      }
      function hhmm(t) {
        const m = /^(\d{2}):(\d{2})/.exec(String(t));
        if (!m) return t;
        let h = Number(m[1]); const ap = h >= 12 ? 'pm' : 'am';
        h = h % 12; if (h === 0) h = 12;
        return `${h}:${m[2]} ${ap}`;
      }
    } catch (err) { reject(err); }
  });
}

module.exports = { generateContractPdf, MARK_FILLS, CLAUSE_SWITCHES, present };

// ── helpers hoisted out of the promise so the file reads as a document ──────
function istClock(iso) {
  try {
    const d = new Date(iso);
    const s = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
    return `${s.replace(/\s?([AP])M/i, (m, g) => ' ' + g.toLowerCase() + 'm')} IST`;
  } catch (_) { return ''; }
}

// `.pg-foot` — .5pt rule 9pt above, DM Sans 400 7.5/1 muted, name left, folio right.
function stampFolios(doc, business, client, startX, pageWidth) {
  const range = doc.bufferedPageRange ? doc.bufferedPageRange() : null;
  if (!range) return;
  const who = `${business} \u00b7 ${(client && client.name) || ''}`.replace(/ \u00b7 $/, '');
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i);
    // ⚠ THE BOTTOM MARGIN IS ZEROED FOR THE FOLIO AND RESTORED IMMEDIATELY. pdfkit
    // ADDS A PAGE for any text drawn below the margin box — so a footer written at
    // `height - bottom + 14` silently appended one page per page, and a five-page
    // agreement rendered as twelve. Found on the render, not in the source:
    // `pdfinfo` said 12 and the frame said 5.
    const keep = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    // ⚠ THE FOLIO SITS INSIDE THE PADDING BOX, NOT BELOW IT. `.pg-foot` carries
    // `margin-top: auto` in a column flex container, so it lands ON the padding
    // box's bottom edge — 841.89 - 50 = 791.89pt. Measured on `P4-sign` and
    // `P3-annex`, whose footer ink reads 785.25-791.25pt; the first build drew it at
    // 805.89 and its ink ran to 813.75, twenty-two points into the margin.
    //
    // (`P1-first`'s mock footer reads 805.50-811.50 instead — that frame's content
    // OVERFLOWS the page in the browser and pushes the footer past the box, so it is
    // the two frames that fit which state the rule. Named because a reader comparing
    // to P1 alone would think this line wrong.)
    //
    // 8.5 is the measured distance from the box bottom to the text box top for DM
    // Sans at 7.5pt: cap top 785.25 with a 1.84pt box-to-cap offset.
    const y = doc.page.height - keep - 8.5;
    doc.moveTo(startX, y - 9).lineTo(startX + pageWidth, y - 9)
       .strokeColor('#E5E5E5').lineWidth(0.5).stroke();
    doc.font('Body').fontSize(7.5).fillColor('#999999')
       .text(who, startX, y, { width: pageWidth * 0.7, lineBreak: false });
    doc.font('Body').fontSize(7.5).fillColor('#999999')
       .text(`Page ${i + 1} of ${range.count}`, startX, y, { width: pageWidth, align: 'right', lineBreak: false });
    doc.page.margins.bottom = keep;
  }
}
