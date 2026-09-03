// src/lib/invoiceMessage.js — compose WhatsApp invoice message

const { formatRs, formatPercent, formatDate } = require('./format');

function buildInvoiceMessage({ clientName, vendorDisplayName, invoiceNumber, description, amountTotal, amountAdvance, dueDate, upiId }) {
  // S2 · THE LOCAL COPY IS RETIRED. This message is ABOUT the document the PDF draws,
  // and it reaches the same couple in the same thread — so a due date spelled `3 Sept`
  // here and `3 Sep` there is one fact in two spellings, feet apart. One home:
  // `formatDate` in ./format, which renders the short month by table.
  // Behaviour change beyond the month: the shared home tolerates a null or unparseable
  // date and returns null, where the local copy would have produced `Invalid Date`.
  const parts = [
    `Hi ${clientName} — sharing your invoice from ${vendorDisplayName}.`,
    '',
    `Invoice No: ${invoiceNumber}`,
  ];
  if (description) parts.push(`For: ${description.charAt(0).toUpperCase() + description.slice(1)}`);
  parts.push(`Total: Rs ${formatRs(amountTotal)}`);

  if (amountAdvance && amountAdvance > 0) {
    parts.push(`Booking amount: Rs ${formatRs(amountAdvance)} (${formatPercent(amountAdvance, amountTotal)})`);
    parts.push('');
    parts.push('To confirm the booking, please pay the booking amount.');

    const optionals = [];
    if (upiId) optionals.push(`UPI: ${upiId}`);
    if (dueDate) optionals.push(`Balance due by ${formatDate(dueDate)}`);
    if (optionals.length > 0) {
      parts.push('');
      parts.push(...optionals);
    }
  } else {
    const optionals = [];
    if (upiId) optionals.push(`UPI: ${upiId}`);
    if (dueDate) optionals.push(`Amount due by ${formatDate(dueDate)}`);
    if (optionals.length > 0) {
      parts.push('');
      parts.push(...optionals);
    }
  }

  parts.push('');
  parts.push('Thanks.');
  return parts.join('\n');
}

module.exports = { buildInvoiceMessage };
