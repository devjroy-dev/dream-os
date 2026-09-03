// src/lib/format.js — number and date formatting utilities

// ── THE MONTH TABLE · S2 · founder-vetoed 2026-09-03 ────────────────────────
// `Intl.DateTimeFormat('en-IN', { month: 'short' })` renders September as `Sept` —
// FOUR letters, alone among the twelve. That is a correct locale rendering and it is
// the wrong byte: the ratified frame reads `3 Sep 2026`, the founder vetoed the word,
// and a document that spells one month wider than the other eleven has a column that
// jogs. So the estate renders the short month BY TABLE.
//
// This is not distrust of Intl. It is that the month name on a vendor's document is a
// VETOED BYTE and vetoed bytes do not get to change under us when a runtime updates
// its CLDR data. Twelve strings, one home, no dependency.
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── formatDate ──────────────────────────────────────────────────────────────
// `3 Sep 2026`. Accepts a DATE string (`2026-09-30`), a TIMESTAMPTZ string, or a Date.
//
// A bare `YYYY-MM-DD` is given an explicit midnight so it is not walked backwards a
// day by a runtime whose zone is behind UTC — `new Date('2026-09-30')` parses as UTC
// midnight and prints as the 29th anywhere west of Greenwich. A timestamp is already
// an instant and is parsed as one.
//
// Returns null on anything unparseable, so a caller can decide between a dash and an
// absent row. It never returns `Invalid Date`, which is the shape that reaches a
// couple's document unnoticed.
//
// ── ONE HOME, AND WHERE IT IS NOT YET ADOPTED ───────────────────────────────
// Two callers cross with this sitting, and they cross together because they are the
// two halves of ONE fact reaching ONE couple: `invoicePdf.js` draws the document and
// `invoiceMessage.js` writes the WhatsApp message ABOUT that document. Those two
// spelling the same due date `3 Sep` and `3 Sept` is one fact in two spellings in the
// same thread.
//
// FIVE SITES ARE NOT CROSSED AND THIS IS A DECLARED GAP, not an oversight:
//   src/agent/engine.js:1128 · src/api/vendor-engine/chat.js:2420
//   src/admin/views/coupleDetail.js:23 · src/admin/views/inviteMint.js:87
//   src/lib/vendor/resolveClientReference.js:237
// Each rolls its own Intl call. They are agent and admin surfaces, not the document,
// and sweeping them is a subject this ZIP does not have. Filed as F-39.64.
function formatDate(input) {
  if (!input) return null;
  const d = (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input))
    ? new Date(input + 'T00:00:00')
    : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function formatRs(n) {
  const s = String(n);
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const groups = [];
  let i = rest.length;
  while (i > 0) {
    groups.unshift(rest.slice(Math.max(0, i - 2), i));
    i -= 2;
  }
  return groups.join(',') + ',' + last3;
}

function formatPercent(part, whole) {
  if (!whole) return null;
  return `${Math.round((part / whole) * 100)}%`;
}

module.exports = { formatRs, formatPercent, formatDate, MONTHS_SHORT };
