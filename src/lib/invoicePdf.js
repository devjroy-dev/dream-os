// src/lib/invoicePdf.js — generate booking confirmation PDF
// Session 8.3 — Stage 2 of the three-stage invoice flow
//
// Layout:
//   - Vendor business name as header (top left, large)
//   - "TDW" watermark (top right, small grey)
//   - Invoice details (number, client, description, amounts)
//   - UPI QR code (dynamic, amount = balance due)
//   - Footer: thank you line
//
// Returns: Buffer (PDF bytes) ready to upload to Supabase storage

const PDFDocument = require('pdfkit');
const QRCode     = require('qrcode');
const { formatRs, formatPercent } = require('./format');

// ── Colours & typography ──────────────────────────────────────────────────────
const COLOUR_BLACK      = '#1A1A1A';
const COLOUR_GREY_DARK  = '#555555';
const COLOUR_GREY_LIGHT = '#999999';
const COLOUR_ACCENT     = '#B08D6A';  // warm gold — matches admin UI
const COLOUR_DIVIDER    = '#E5E5E5';

// ── generateInvoicePdf ────────────────────────────────────────────────────────
// invoice         : object — invoice row from Supabase (all columns)
// vendor          : object — vendor row (business_name, upi_id, routing_handle)
// vendorName      : string — display name fallback (user.name)
//
// Returns: Promise<Buffer>

async function generateInvoicePdf({ invoice, vendor, vendorName }) {
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

      const pageWidth  = doc.page.width  - doc.page.margins.left - doc.page.margins.right;
      const startX     = doc.page.margins.left;

      // ── Header ──────────────────────────────────────────────────────
      const businessName = vendor.business_name || vendorName || 'Your Vendor';

      // Vendor name (large, top left)
      doc.fontSize(22)
         .fillColor(COLOUR_BLACK)
         .font('Helvetica-Bold')
         .text(businessName, startX, 50, { lineBreak: false });

      // TDW watermark (small grey, top right)
      doc.fontSize(9)
         .fillColor(COLOUR_GREY_LIGHT)
         .font('Helvetica')
         .text('TDW', startX, 58, {
           width:  pageWidth,
           align:  'right',
           lineBreak: false,
         });

      // Divider under header
      doc.moveTo(startX, 85)
         .lineTo(startX + pageWidth, 85)
         .strokeColor(COLOUR_DIVIDER)
         .lineWidth(1)
         .stroke();

      // ── "Booking Confirmed" status badge ────────────────────────────
      doc.fontSize(10)
         .fillColor(COLOUR_ACCENT)
         .font('Helvetica-Bold')
         .text('BOOKING CONFIRMED', startX, 100);

      // ── Invoice meta ─────────────────────────────────────────────────
      let y = 125;

      const row = (label, value) => {
        doc.fontSize(9)
           .fillColor(COLOUR_GREY_DARK)
           .font('Helvetica')
           .text(label, startX, y, { width: 130, lineBreak: false });
        doc.fontSize(9)
           .fillColor(COLOUR_BLACK)
           .font('Helvetica-Bold')
           .text(value, startX + 140, y, { width: pageWidth - 140, lineBreak: false });
        y += 18;
      };

      row('Invoice No',   invoice.invoice_number);
      row('Client',       invoice.client_name);
      if (invoice.description) {
        row('For',        invoice.description.charAt(0).toUpperCase() + invoice.description.slice(1));
      }
      if (invoice.due_date) {
        const formatted = new Intl.DateTimeFormat('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric'
        }).format(new Date(invoice.due_date + 'T00:00:00'));
        row('Balance due by', formatted);
      }

      y += 10;

      // ── Divider ──────────────────────────────────────────────────────
      doc.moveTo(startX, y)
         .lineTo(startX + pageWidth, y)
         .strokeColor(COLOUR_DIVIDER)
         .lineWidth(0.5)
         .stroke();

      y += 18;

      // ── Amount breakdown ─────────────────────────────────────────────
      const amountRow = (label, value, bold = false) => {
        doc.fontSize(10)
           .fillColor(bold ? COLOUR_BLACK : COLOUR_GREY_DARK)
           .font(bold ? 'Helvetica-Bold' : 'Helvetica')
           .text(label, startX, y, { width: 200, lineBreak: false });
        doc.fontSize(10)
           .fillColor(bold ? COLOUR_BLACK : COLOUR_GREY_DARK)
           .font(bold ? 'Helvetica-Bold' : 'Helvetica')
           .text(`Rs ${formatRs(value)}`, startX + 200, y, {
             width: pageWidth - 200,
             align: 'right',
             lineBreak: false,
           });
        y += 22;
      };

      amountRow('Total amount', invoice.amount_total, true);

      if (invoice.amount_advance && invoice.amount_advance > 0) {
        const pct = formatPercent(invoice.amount_advance, invoice.amount_total);
        amountRow(`Booking amount received (${pct})`, invoice.amount_advance);
        const balance = invoice.amount_total - invoice.amount_paid;
        amountRow('Balance due', balance, true);
      }

      y += 10;

      // ── UPI QR code ──────────────────────────────────────────────────
      if (vendor.upi_id) {
        const balanceDue = invoice.amount_total - invoice.amount_paid;

        // UPI deep link format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR
        const upiString = `upi://pay?pa=${encodeURIComponent(vendor.upi_id)}&pn=${encodeURIComponent(businessName)}&am=${balanceDue}&cu=INR`;

        // Generate QR as PNG buffer
        const qrBuffer = await QRCode.toBuffer(upiString, {
          type:              'png',
          width:             120,
          margin:            1,
          color: {
            dark:  '#1A1A1A',
            light: '#FFFFFF',
          },
        });

        // Divider before QR section
        doc.moveTo(startX, y)
           .lineTo(startX + pageWidth, y)
           .strokeColor(COLOUR_DIVIDER)
           .lineWidth(0.5)
           .stroke();

        y += 15;

        doc.fontSize(9)
           .fillColor(COLOUR_GREY_DARK)
           .font('Helvetica')
           .text('Scan to pay balance', startX, y);

        y += 14;

        doc.image(qrBuffer, startX, y, { width: 100 });

        // UPI ID text next to QR
        doc.fontSize(9)
           .fillColor(COLOUR_GREY_DARK)
           .font('Helvetica')
           .text(`UPI: ${vendor.upi_id}`, startX + 115, y + 40);

        doc.fontSize(8)
           .fillColor(COLOUR_GREY_LIGHT)
           .text(`Amount: Rs ${formatRs(balanceDue)}`, startX + 115, y + 57);

        y += 115;
      }

      // ── Footer ───────────────────────────────────────────────────────
      doc.moveTo(startX, y)
         .lineTo(startX + pageWidth, y)
         .strokeColor(COLOUR_DIVIDER)
         .lineWidth(0.5)
         .stroke();

      y += 15;

      doc.fontSize(9)
         .fillColor(COLOUR_GREY_LIGHT)
         .font('Helvetica')
         .text('Thank you for your booking. We look forward to being part of your celebration.', startX, y, {
           width: pageWidth,
           align: 'center',
         });

      doc.end();

    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePdf };
