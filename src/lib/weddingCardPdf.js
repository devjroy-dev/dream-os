// src/lib/weddingCardPdf.js — THE PRINTED UNIT
//
// G1.3 · R-G13.7/.8/.9, drawn against `dreamos-pwa/docs/mocks/wedding-team-mock.html`
// frames `P1-tent` (A6 portrait) and `P2-insert` (4×6 portrait), banked at pwa
// `3d13d65`. Every string here is a RULED row on
// `dreamos-pwa/docs/mocks/G13_VETO_SHEET.md` (rows 18–24, answered under R-40.42);
// none may be edited without a veto pass.
//
// ═══════════════════════════════════════════════════════════════════════════
// PURE. NO DATABASE, NO NETWORK, NO STORAGE. `invoicePdf.js`'s precedent, and
// it is a property worth stating rather than a coincidence: the renderer is
// handed everything it needs and decides nothing it was not handed. The door
// above it reads the row, resolves the address and uploads the bytes.
// ═══════════════════════════════════════════════════════════════════════════
//
// ── WHAT IS DELIBERATELY NOT DECIDED HERE ──────────────────────────────────
// Not whether the page is live. Not what the address is. Not whether the couple
// consented. `invoicePdf.js` reasons identically about the seal — "THE VISIBILITY
// DECISION IS ALREADY MADE WHEN IT ARRIVES" — because a renderer that re-decided
// would be a second home for a rule that has one. A card for an unpublished page
// prints a QR to a 404; the door is what refuses to call this function.
//
// ── GEOMETRY: TWO SIZES, DECLARED IN POINTS, MATCHING THE MOCK ─────────────
// A6 portrait  = 297.64 × 420.94 pt  (A4 halved twice) = 397 × 561 css px @96dpi
// 4×6 portrait = 288    × 432    pt                    = 384 × 576 css px @96dpi
// The mock's frames declare `data-shot-width/height` at exactly those pixel
// numbers, so a size here is a size there and the founder's veto was cast at
// true reading size.
//
// ── THE QR IS THE PAGE'S OWN ADDRESS, DIRECT (R-G13.9) ────────────────────
// No `/r/`, no short code, no redirect. A printed object is permanent and must
// depend on nothing but the page it names; a redirect inserts an availability
// dependency between a card on a table and the photographs it promises.
//
// Returns: Promise<{ tent: Buffer, insert: Buffer }>

const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');

// ── Colours ────────────────────────────────────────────────────────────────
// The public leaf's own values, not the invoice's: this card is the paper twin
// of `/v/<code>/w/<slug>` and a guest may hold both in one evening. Cream ground
// `#F8F7F5`, ink `#0C0A09`, and ONE gold `#C9A84C` spent once on the rule —
// which is the leaf's own rule and stricter than the house 3× cap.
const COLOUR_INK    = '#0C0A09';
const COLOUR_CREAM  = '#F8F7F5';
const COLOUR_GOLD   = '#C9A84C';
const COLOUR_MUTE   = '#6B6560';
const COLOUR_FAINT  = '#8C8681';

// ── THE RULED BYTES · G13_VETO_SHEET rows 18, 20, 22, 23, 24 ───────────────
// Frozen and named, so a bench asserts the sheet's rows against the renderer's
// own constants rather than against a string buried in a draw call.
const CARD_COPY = Object.freeze({
  /** row 18 */ tentEyebrow:   'Photographs from',
  /** row 20 */ tentSay:       'Scan for every photograph, and for everyone who worked the day.',
  /** row 23 */ insertEyebrow: 'With thanks',
  /**
   * row 24 · CHOSEN; 24b (the studio speaking in its own voice) REFUSED by the
   * chair under R-40.42. The card sits on the couple's table and leaves in a
   * guest's hand, so the day thanks the guest and nobody is quoted — TDW never
   * puts words in a couple's mouth, and the neutral register is how it avoids
   * both that and a studio advertisement on a thank-you card.
   */
  insertSay:     'Thank you for being part of the day. The photographs are here whenever you would like them.',
  /** row 22 · REUSE, byte-identical to `lib/public/copy.ts`'s PUBLIC_COLOPHON. */
  colophon:      'Created and managed by The Dream Wedding \u00b7 thedreamwedding.in',
});

/**
 * ⚠ THE QR IS RENDERED AT A FIXED MODULE COUNT AND SCALED BY pdfkit, NOT
 * re-encoded per size. `toBuffer` at width 512 gives a PNG whose modules land on
 * whole pixels; letting pdfkit scale that down to 112pt is sharper on a printer
 * than asking the encoder for a small bitmap. `margin: 0` because the card's own
 * whitespace is the quiet zone and a doubled margin shrinks the modules for
 * nothing.
 *
 * Error correction M: the card will be handled, and a card is not a screen.
 */
async function qrPng(url) {
  return QRCode.toBuffer(url, {
    margin: 0,
    width: 512,
    errorCorrectionLevel: 'M',
    color: { dark: COLOUR_INK, light: COLOUR_CREAM },
  });
}

/** The gold rule — a hairline that dies at both margins, with its diamond. */
function drawRule(doc, x, y, w) {
  const mid = x + w / 2;
  doc.save();
  doc.lineWidth(0.5).strokeColor(COLOUR_GOLD).opacity(0.55);
  doc.moveTo(x, y).lineTo(mid - 7, y).stroke();
  doc.moveTo(mid + 7, y).lineTo(x + w, y).stroke();
  doc.opacity(1);
  doc.fillColor(COLOUR_GOLD);
  // A rotated square is the diamond; pdfkit has no glyph for it in a core font
  // and embedding one for four points of ink would be a font for a lozenge.
  doc.translate(mid, y).rotate(45).rect(-2.6, -2.6, 5.2, 5.2).fill();
  doc.restore();
}

/**
 * One card. Both sizes are the same document with different numbers, because
 * they ARE the same design — the alternative was two draw functions that drift
 * the first time a margin changes.
 */
async function renderCard(doc, { width, height, eyebrow, title, say, studioName, qr, qrSize, titleSize }) {
  const pad  = width < 300 ? 28 : 26;      // 4×6 is narrower; its gutter is wider
  const inner = width - pad * 2;

  doc.rect(0, 0, width, height).fill(COLOUR_CREAM);

  let y = 30;
  doc.font('Helvetica').fontSize(7).fillColor(COLOUR_MUTE)
     .text(eyebrow.toUpperCase(), pad, y, { width: inner, align: 'center', characterSpacing: 1.7 });

  y += 22;
  // Times-Italic is a core font — no embedding, no network, and the closest core
  // face to the leaf's Cormorant italic. The mock draws Cormorant; this is the
  // declared substitution and the founder vetoed the LAYOUT at true size knowing
  // the shipped face is the printer's serif.
  doc.font('Times-Italic').fontSize(titleSize).fillColor(COLOUR_INK)
     .text(title, pad, y, { width: inner, align: 'center' });

  y = doc.y + 16;
  drawRule(doc, pad, y, inner);

  y += 20;
  doc.image(qr, (width - qrSize) / 2, y, { width: qrSize, height: qrSize });

  y += qrSize + 16;
  doc.font('Helvetica').fontSize(9.5).fillColor(COLOUR_MUTE)
     .text(say, pad, y, { width: inner, align: 'center', lineGap: 2.5 });

  // ── THE FOOT, PINNED TO THE BOTTOM ────────────────────────────────────────
  // Measured from the page edge rather than flowed, so a long studio name or a
  // two-line thank-you cannot push the colophon off the card. A card that loses
  // its foot to a long name is a card that fails on exactly the vendors whose
  // names are longest.
  const footTop = height - 58;
  doc.save().lineWidth(0.5).strokeColor(COLOUR_INK).opacity(0.14)
     .moveTo(pad, footTop).lineTo(width - pad, footTop).stroke().restore();

  doc.font('Helvetica').fontSize(8).fillColor(COLOUR_MUTE)
     .text(String(studioName || '').toUpperCase(), pad, footTop + 12,
           { width: inner, align: 'center', characterSpacing: 1.4, ellipsis: true, height: 12 });

  doc.font('Helvetica').fontSize(7).fillColor(COLOUR_FAINT)
     .text(CARD_COPY.colophon, pad, footTop + 30, { width: inner, align: 'center' });
}

/** One document, one size, returned as a Buffer. */
function renderToBuffer(size, draw) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size, margin: 0 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      Promise.resolve(draw(doc)).then(() => doc.end()).catch(reject);
    } catch (e) { reject(e); }
  });
}

/**
 * generateWeddingCards
 *
 * title      : string — the page's own title, verbatim. NOT a name anyone typed
 *              into a credit and NOT a couple's name the estate inferred: the
 *              page names itself and the card prints that (veto sheet row 19).
 * studioName : string — the owner's REGISTERED `business_name` (row 21). F-40.54
 *              is why it is never the typed one.
 * pageUrl    : string — the public address the QR resolves to, built by the
 *              caller. This function does not know the site base and must not
 *              learn it; `siteBase()` has one home.
 *
 * Returns: Promise<{ tent: Buffer, insert: Buffer }>
 */
async function generateWeddingCards({ title, studioName, pageUrl }) {
  const qr = await qrPng(pageUrl);

  const tent = await renderToBuffer([297.64, 420.94], (doc) => renderCard(doc, {
    width: 297.64, height: 420.94,
    eyebrow: CARD_COPY.tentEyebrow,
    title, say: CARD_COPY.tentSay,
    studioName, qr, qrSize: 112, titleSize: 30,
  }));

  const insert = await renderToBuffer([288, 432], (doc) => renderCard(doc, {
    width: 288, height: 432,
    eyebrow: CARD_COPY.insertEyebrow,
    title, say: CARD_COPY.insertSay,
    studioName, qr, qrSize: 98, titleSize: 24,
  }));

  return { tent, insert };
}

module.exports = { generateWeddingCards, CARD_COPY, qrPng };   // G3.1 s2: qrPng is the estate's one QR home; the storefront door calls it
