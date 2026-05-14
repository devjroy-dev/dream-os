// src/lib/invoiceMessage.js — compose WhatsApp invoice message

const { formatRs, formatPercent } = require('./format');

function buildInvoiceMessage({ clientName, vendorDisplayName, invoiceNumber, description, amountTotal, amountAdvance, dueDate, upiId }) {
  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  };

  const parts = [
    `Hi ${clientName} — sharing your invoice from ${vendorDisplayName}.`,
    '',
    `Invoice No: ${invoiceNumber}`,
  ];
  if (description) parts.push(description.charAt(0).toUpperCase() + description.slice(1));
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
