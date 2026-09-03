// src/lib/invoicePdf.js — THE INVOICE DOCUMENT
//
// S2 · F-2c.w8 · built to shape (ii), ratified by the founder 2026-09-03 against
// `dreamos-pwa/docs/mocks/invoice-document-mock.html`, frames `S2-addr` (primary)
// and `S2-city` (the no-address case). Every string here is a RULED row on
// `dreamos-pwa/docs/mocks/S2_VETO_SHEET.md`; none may be edited without a veto pass.
//
// ── WHAT THIS FILE USED TO BE, AND WHY THAT IS WORTH WRITING DOWN ───────────
// It was called "generate booking confirmation PDF" and it printed the literal
// `BOOKING CONFIRMED` at the top of every invoice — unpaid, paid, cancelled alike —
// while `state` was selected from the database on the line above and thrown away. The
// fork this sitting settled was NOT "a longer invoice". It was A CORRECT ONE. Four
// things the old document told a couple that were not true, each now cured and each
// with a cell:
//
//   F-39.49    · paid and balance printed ONLY when `amount_advance > 0`, so an invoice
//                paid in full through the balance door showed a total and nothing else.
//                The gate is now `amount_paid`/`state`; `amount_advance` gates nothing.
//   F-39.49(b) · the received line read `amount_advance` while the balance subtracted
//                `amount_paid`. On a scheduled invoice those two diverge the moment the
//                first milestone is marked, so the page contradicted itself. THE
//                PRINTED PAID FIGURE IS `amount_paid`, ALWAYS — it is the one the
//                balance is computed from, and one fact may not have two sources.
//   F-39.58    · the UPI QR gated on `upi_id` alone, so a CANCELLED invoice rendered a
//                live payment link asking a couple for money, and a PAID one rendered
//                a link for zero. The block is now gated on payable state.
//   B1         · `BOOKING CONFIRMED` retired for the table's own vocabulary.
//
// ── THE STATE WORD IS THE DATABASE'S, TITLE-CASED ───────────────────────────
// `invoices_state_check` allows exactly {unpaid, advance_paid, paid, cancelled}, so the
// document can never print a fifth word. The map below is a POSITIVE LIST for the same
// reason `PAYABLE_STATES` is one: an unknown state must fall through to something
// honest rather than be captioned by a default that assumes.
//
// ── GEOMETRY ────────────────────────────────────────────────────────────────
// A4, margins {top:50, bottom:50, left:60, right:60} pt — unchanged from the old file,
// and the mock is drawn at exactly these numbers so a size here is a size there.
//
// Returns: Buffer (PDF bytes) ready to upload to Supabase storage

const PDFDocument = require('pdfkit');
const QRCode     = require('qrcode');
const { formatRs } = require('./format');

// ── Colours & typography ──────────────────────────────────────────────────────
// FIVE COLOURS, unchanged from the old document. I2 was ruled NO: meaning is carried
// by position and weight, not hue, so `Cancelled` is set in the same warm gold as
// `Paid`. A red and a green would be two new colours in a palette that has neither.
const COLOUR_BLACK      = '#1A1A1A';
const COLOUR_GREY_DARK  = '#555555';
const COLOUR_GREY_LIGHT = '#999999';
const COLOUR_ACCENT     = '#B08D6A';  // warm gold — matches admin UI
const COLOUR_DIVIDER    = '#E5E5E5';

// ── THE STATE VOCABULARY · veto sheet rows B2–B5, RULED 2026-09-03 ───────────
const STATE_WORD = {
  unpaid:       'Unpaid',
  advance_paid: 'Advance paid',
  paid:         'Paid',
  cancelled:    'Cancelled',
};
// The payable set, duplicated in MEANING from `PAYABLE_STATES` in
// src/lib/vendor/invoices.js but not imported from it, because the two answer different
// questions: that one asks whether a PAYMENT MAY BE RECORDED, this one asks whether a
// DOCUMENT MAY ASK FOR MONEY. They agree today and a future state could make them
// diverge — a hidden import would make that divergence a silent bug instead of an edit.
const SHOWS_RAILS = ['unpaid', 'advance_paid'];

// ── generateInvoicePdf ────────────────────────────────────────────────────────
// invoice    : object — invoice row from `invoicePdfSource`
// vendor     : object — vendor row (identity, UPI, bank rails, address)
// vendorName : string — display name fallback (user.name)
// schedule   : array  — payment_schedules rows, ordinal-ordered; [] when none
//
// Returns: Promise<Buffer>

async function generateInvoicePdf({ invoice, vendor, vendorName, schedule }) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size:    'A4',
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end',  ()    => resolve(Buffer.concat(chunks)));
      doc.on('error', err  => reject(err));

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const startX    = doc.page.margins.left;
      const rightX    = startX + pageWidth;

      const rows = Array.isArray(schedule) ? schedule : [];
      const state       = invoice.state;
      const stateWord   = STATE_WORD[state] || null;
      const isCancelled = state === 'cancelled';
      const isPaid      = state === 'paid';
      const showsRails  = SHOWS_RAILS.includes(state);

      const businessName = vendor.business_name || vendorName || 'Your Vendor';
      const money        = (n) => `Rs ${formatRs(n || 0)}`;

      // ── helpers ───────────────────────────────────────────────────────────
      const rule = (y, weight = 0.5) => {
        doc.moveTo(startX, y).lineTo(rightX, y)
           .strokeColor(COLOUR_DIVIDER).lineWidth(weight).stroke();
      };
      // THE EYEBROW TAKES AN X. It used to default to `startX` and the parties block
      // has TWO columns, so `For` printed on top of `Billed to` and the page read
      // `BOLRED TO`. A helper that hard-codes a position is a helper that can only be
      // used once — caught on the render, not in the source.
      const eyebrow = (label, y, x = startX) => {
        doc.fontSize(7.5).fillColor(COLOUR_GREY_LIGHT).font('Helvetica')
           .text(label.toUpperCase(), x, y, { characterSpacing: 1, lineBreak: false });
      };
      const fmtDate = (d) => {
        if (!d) return null;
        // `due_date` is a DATE and `created_at` a TIMESTAMPTZ. The date gets an explicit
        // midnight so it is not walked backwards a day by the runtime's zone; the
        // timestamp is already an instant and is parsed as one.
        const dt = /^\d{4}-\d{2}-\d{2}$/.test(String(d)) ? new Date(d + 'T00:00:00') : new Date(d);
        if (Number.isNaN(dt.getTime())) return null;
        return new Intl.DateTimeFormat('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
        }).format(dt);
      };

      // ═══ HEADER ══════════════════════════════════════════════════════════
      doc.fontSize(22).fillColor(COLOUR_BLACK).font('Helvetica-Bold')
         .text(businessName, startX, 50, { width: pageWidth - 60, lineBreak: false });

      doc.fontSize(9).fillColor(COLOUR_GREY_LIGHT).font('Helvetica')
         .text('TDW', startX, 55, { width: pageWidth, align: 'right', lineBreak: false });

      let y = 80;

      // A3 — `<city> · GSTIN <gstin>`. Either half may be absent; the separator belongs
      // to the JOIN and not to either part, so an absent gstin does not leave a dangling
      // middle dot. When both are absent the line is not printed at all.
      const idBits = [];
      if (vendor.city)  idBits.push(vendor.city);
      if (vendor.gstin) idBits.push(`GSTIN ${vendor.gstin}`);
      if (idBits.length) {
        doc.fontSize(8.5).fillColor(COLOUR_GREY_DARK).font('Helvetica')
           .text(idBits.join('  \u00b7  '), startX, y, { width: pageWidth, lineBreak: false });
        y += 13;
      }
      // A4 — the address line, printed only when the column is filled. An empty column
      // prints nothing; it does not print a gap.
      if (vendor.address) {
        doc.fontSize(8.5).fillColor(COLOUR_GREY_LIGHT).font('Helvetica')
           .text(vendor.address, startX, y, { width: pageWidth - 120 });
        y = doc.y + 2;
      }

      y += 10;
      rule(y, 1);
      y += 18;

      // ═══ META · number left, dates centre, STAMP right ═══════════════════
      // SHAPE (ii): the state is a STAMP AND NOT A LINE. It sits in its own reserved
      // column — the mock's first draw had it absolutely positioned and the box struck
      // through the due date, and a stamp that hides a fact is worse than no stamp.
      const metaTop  = y;
      const STAMP_W  = 128;
      const DATES_W  = 150;

      doc.fontSize(8).fillColor(COLOUR_GREY_LIGHT).font('Helvetica')
         .text('INVOICE', startX, metaTop, { characterSpacing: 1, lineBreak: false });
      doc.fontSize(13).fillColor(COLOUR_BLACK).font('Helvetica-Bold')
         .text(invoice.invoice_number, startX, metaTop + 13, { lineBreak: false });

      const datesX = rightX - STAMP_W - DATES_W;
      let dy = metaTop;
      const dateRow = (label, value) => {
        if (!value) return;
        doc.fontSize(9).fillColor(COLOUR_GREY_DARK).font('Helvetica')
           .text(label, datesX, dy, { width: 60, lineBreak: false });
        doc.fontSize(9).fillColor(COLOUR_BLACK).font('Helvetica-Bold')
           .text(value, datesX + 60, dy, { width: DATES_W - 60, align: 'right', lineBreak: false });
        dy += 15;
      };
      // H4 IS OPEN AND UNRULED: the due date prints on every state, `paid` and
      // `cancelled` included, exactly as the ratified frame draws it. The question of
      // whether a released or settled invoice should still show a due date was raised
      // with the founder and not answered; it is NOT decided here by omission.
      dateRow('Issued', fmtDate(invoice.created_at));
      dateRow('Due',    fmtDate(invoice.due_date));

      if (stateWord) {
        // The cant is applied to the ink, not to the layout: rotate about the stamp's
        // own centre, draw, restore. The reserved column means nothing else is here to
        // be overlapped whatever the angle.
        const sw = doc.fontSize(12).font('Helvetica-Bold').widthOfString(stateWord, { characterSpacing: 1.6 });
        const boxW = sw + 22;
        const boxH = 26;
        const boxX = rightX - boxW;
        const boxY = metaTop - 2;
        doc.save();
        doc.rotate(-7, { origin: [boxX + boxW / 2, boxY + boxH / 2] });
        doc.roundedRect(boxX, boxY, boxW, boxH, 1)
           .strokeColor(COLOUR_ACCENT).lineWidth(1.5).stroke();
        doc.fontSize(12).fillColor(COLOUR_ACCENT).font('Helvetica-Bold')
           .text(stateWord.toUpperCase(), boxX, boxY + 8, {
             width: boxW, align: 'center', characterSpacing: 1.6, lineBreak: false,
           });
        doc.restore();
      }

      y = metaTop + 44;
      rule(y);
      y += 18;

      // ═══ PARTIES ═════════════════════════════════════════════════════════
      const colW = (pageWidth - 30) / 2;
      const colR = startX + colW + 30;
      const partiesTop = y;

      eyebrow('Billed to', partiesTop);
      doc.fontSize(10).fillColor(COLOUR_BLACK).font('Helvetica-Bold')
         .text(invoice.client_name, startX, partiesTop + 14, { width: colW });
      let leftBottom = doc.y;
      if (invoice.client_phone) {
        doc.fontSize(9).fillColor(COLOUR_GREY_DARK).font('Helvetica')
           .text(invoice.client_phone, startX, leftBottom + 2, { width: colW });
        leftBottom = doc.y;
      }

      let rightBottom = partiesTop + 14;
      if (invoice.description) {
        eyebrow('For', partiesTop, colR);
        const line = invoice.description.charAt(0).toUpperCase() + invoice.description.slice(1);
        doc.fontSize(10).fillColor(COLOUR_BLACK).font('Helvetica-Bold')
           .text(line, colR, partiesTop + 14, { width: colW });
        rightBottom = doc.y;
      }

      y = Math.max(leftBottom, rightBottom) + 16;
      rule(y);
      y += 16;

      // ═══ MONEY ═══════════════════════════════════════════════════════════
      // E5, RULED: a CANCELLED document prints the amount as HISTORY and has no paid
      // row and no balance row. "Balance due" on a released date is false — nothing is
      // owed and nothing will be — and `Rs 0` paid under a cancelled amount is noise.
      const paid    = invoice.amount_paid || 0;
      const balance = (invoice.amount_total || 0) - paid;

      const amountRow = (label, value, bold = false) => {
        doc.fontSize(bold ? 11 : 10).fillColor(bold ? COLOUR_BLACK : COLOUR_GREY_DARK)
           .font(bold ? 'Helvetica-Bold' : 'Helvetica')
           .text(label, startX, y, { width: 240, lineBreak: false });
        doc.fontSize(bold ? 11 : 10).fillColor(COLOUR_BLACK)
           .font(bold ? 'Helvetica-Bold' : 'Helvetica')
           .text(money(value), startX + 240, y, {
             width: pageWidth - 240, align: 'right', lineBreak: false,
           });
        y += 20;
      };

      if (isCancelled) {
        amountRow('Amount', invoice.amount_total);
      } else {
        amountRow('Total amount', invoice.amount_total);
        // F-39.49 · UNGATED. F-39.49(b) · THE FIGURE IS `amount_paid`.
        // `amount_advance` is read NOWHERE in this file and that is the cure, not an
        // oversight: it is a creation-time intention, and a document that reports on
        // money must report what was RECEIVED.
        amountRow('Paid', paid);
        y += 2;
        rule(y - 6);
        amountRow('Balance due', balance, true);
      }

      y += 4;

      // ═══ SCHEDULE · shape (ii)'s ruled table, gated on has_schedule ═══════
      if (invoice.has_schedule && rows.length) {
        rule(y);
        y += 16;
        eyebrow('Payment schedule', y);
        y += 18;

        // Declared column widths. The mock's first draw used equal columns and printed
        // `40%30 Sep 2026` with a run-together `SHAREDUE` head, because a right-aligned
        // cell butted into a left-aligned one. A column gap is not decoration on a money
        // table — it is what keeps two figures from reading as one.
        const W = [0.32, 0.12, 0.22, 0.19, 0.15].map(f => pageWidth * f);
        const X = W.reduce((acc, w, i) => (acc.push(i === 0 ? startX : acc[i - 1] + W[i - 1]), acc), []);
        const ALIGN = ['left', 'right', 'left', 'right', 'right'];
        const PAD = 6;

        const cell = (i, text, opts) => {
          const isFirst = i === 0, isLast = i === W.length - 1;
          const x = X[i] + (isFirst ? 0 : PAD);
          const w = W[i] - (isFirst ? PAD : isLast ? PAD : PAD * 2);
          doc.text(text, x, opts.y, { width: w, align: ALIGN[i], lineBreak: false });
        };

        doc.fontSize(7.5).fillColor(COLOUR_GREY_LIGHT).font('Helvetica');
        ['Milestone', 'Share', 'Due', 'Amount', 'Status'].forEach((h, i) => {
          doc.fontSize(7.5).fillColor(COLOUR_GREY_LIGHT).font('Helvetica');
          cell(i, h.toUpperCase(), { y });
        });
        y += 12;
        rule(y);
        y += 8;

        for (const m of rows) {
          const pct = m.pct == null ? '' : `${Number(m.pct)}%`;
          // F3 — the milestone state is `payment_schedules.state`'s own vocabulary
          // {pending, paid, waived}, title-cased by the same law as the invoice state.
          const st = m.state ? m.state.charAt(0).toUpperCase() + m.state.slice(1) : '';
          doc.fontSize(9).font('Helvetica');
          doc.fillColor(COLOUR_BLACK);     cell(0, m.milestone_label || '', { y });
          doc.fillColor(COLOUR_GREY_DARK); cell(1, pct, { y });
          doc.fillColor(COLOUR_GREY_DARK); cell(2, fmtDate(m.due_date) || '\u2014', { y });
          doc.fillColor(COLOUR_GREY_DARK); cell(3, money(m.amount_due), { y });
          doc.fillColor(COLOUR_GREY_DARK); cell(4, st, { y });
          y += 14;
          rule(y);
          y += 8;
        }
        y += 4;
      }

      // ═══ PAYMENT · F-39.58's gate ════════════════════════════════════════
      rule(y);
      y += 16;
      eyebrow('Payment', y);
      y += 18;

      if (isCancelled) {
        // G7, RULED: on `cancelled` the block is STRIPPED. No UPI string, no QR, no
        // account number anywhere in the bytes.
        doc.fontSize(10).fillColor(COLOUR_GREY_DARK).font('Helvetica')
           .text('This invoice has been cancelled. Nothing is payable on it.', startX, y,
                 { width: pageWidth });
        y = doc.y + 12;
      } else if (isPaid) {
        doc.fontSize(10).fillColor(COLOUR_BLACK).font('Helvetica-Bold')
           .text('Paid in full \u2014 nothing further is due.', startX, y, { width: pageWidth });
        y = doc.y + 12;
      } else if (showsRails) {
        const railsX = startX + (vendor.upi_id ? 125 : 0);
        let ry = y;

        if (vendor.upi_id) {
          const upiString = `upi://pay?pa=${encodeURIComponent(vendor.upi_id)}` +
            `&pn=${encodeURIComponent(businessName)}&am=${balance}&cu=INR`;
          const qrBuffer = await QRCode.toBuffer(upiString, {
            type: 'png', width: 120, margin: 1,
            color: { dark: COLOUR_BLACK, light: '#FFFFFF' },
          });
          doc.image(qrBuffer, startX, y, { width: 100 });
          doc.fontSize(7.5).fillColor(COLOUR_GREY_LIGHT).font('Helvetica')
             .text('SCAN TO PAY', startX, y + 106, {
               width: 100, align: 'center', characterSpacing: 1, lineBreak: false,
             });
        }

        const rail = (label, value) => {
          doc.fontSize(9).fillColor(COLOUR_GREY_DARK).font('Helvetica')
             .text(label, railsX, ry, { width: 95, lineBreak: false });
          doc.fontSize(9).fillColor(COLOUR_BLACK).font('Helvetica-Bold')
             .text(value, railsX + 95, ry, { width: rightX - railsX - 95, lineBreak: false });
          ry += 16;
        };

        if (vendor.upi_id) {
          rail('UPI', vendor.upi_id);
          rail('Amount', money(balance));
          ry += 8;
        }
        // G4/G5 — the bank block, gated on `account_number` alone. A name or an IFSC
        // without a number is not a rail anybody can pay into, so the number is the
        // gate and the other two ride it.
        if (vendor.account_number) {
          doc.fontSize(7.5).fillColor(COLOUR_GREY_LIGHT).font('Helvetica')
             .text('BANK TRANSFER', railsX, ry, { characterSpacing: 1, lineBreak: false });
          ry += 14;
          if (vendor.account_name) rail('Account name', vendor.account_name);
          rail('Account no.', vendor.account_number);
          if (vendor.ifsc) rail('IFSC', vendor.ifsc);
        }

        y = Math.max(ry, vendor.upi_id ? y + 120 : ry) + 8;
      }

      // ═══ NOTES ═══════════════════════════════════════════════════════════
      if (invoice.notes) {
        rule(y);
        y += 16;
        eyebrow('Notes', y);
        y += 16;
        doc.fontSize(9).fillColor(COLOUR_GREY_DARK).font('Helvetica')
           .text(invoice.notes, startX, y, { width: pageWidth - 80 });
        y = doc.y;
      }

      // ═══ FOOT ════════════════════════════════════════════════════════════
      // H3, VETOED BY DELEGATION: the celebration line is STRUCK on a cancelled
      // document — a released date is not a celebration anyone is looking forward to.
      // The rule and the footer's position do not move, so the page keeps its shape.
      // THE FOOTER SAT TOO LOW AND PDFKIT PAGINATED IT. At 24pt above the bottom
      // margin the 9pt line's descent crossed the content boundary, so `doc.text`
      // opened a SECOND PAGE and put the thank-you on it alone — on every state, in
      // every render of this sitting. Found by counting pages on the real buffer;
      // nothing in the source says "this will paginate". 40pt clears it with room.
      const footY = doc.page.height - doc.page.margins.bottom - 40;
      rule(footY);
      doc.fontSize(9).fillColor(COLOUR_GREY_LIGHT).font('Helvetica')
         .text(isCancelled
                 ? businessName
                 : 'Thank you \u2014 we look forward to being part of your celebration.',
               startX, footY + 14, { width: pageWidth, align: 'center', lineBreak: false });

      doc.end();

    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePdf, STATE_WORD, SHOWS_RAILS };
