// src/lib/papers/words.js · CE-47 · PRO · P1 · every word, date and sum the papers print, in one home.
// Standing rules: money as "Rs 2,000"; full months ("6 October 2026"); plain literal words (R-45.30).
const { formatRs } = require('../format');
const { profileFor } = require('../vendor/categoryProfiles');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const IST_MS = 5.5 * 3600 * 1000;
/** "6 October 2026" from 'YYYY-MM-DD' or a timestamp (read in India's time). */
function fullDate(v) {
  if (!v) return '';
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : new Date(new Date(v).getTime() + IST_MS).toISOString().slice(0, 10);
  const [y, m, d] = iso.split('-').map(Number);
  return m >= 1 && m <= 12 ? `${d} ${MONTHS[m - 1]} ${y}` : '';
}
/** "October 2026" from 'YYYY-MM'. */
const monthName = (ym) => { const [y, m] = String(ym).split('-').map(Number); return m >= 1 && m <= 12 ? `${MONTHS[m - 1]} ${y}` : ''; };
const rs = (n) => `Rs ${formatRs(Math.round(Number(n) || 0))}`;
/** Her trade in plain words, first letter capital; a category TDW has no word for reads "Wedding professional". */
function tradeOf(category) {
  const l = profileFor(category).label;
  if (!l || l === 'vendor') return 'Wedding professional';
  return l[0].toUpperCase() + l.slice(1);
}
const KIND_TITLE = Object.freeze({ certificate: 'Professional certificate', id_card: 'Professional ID', statement: 'Business statement', ca_pack: 'Ready for your CA' });
const PURPOSE = Object.freeze({ bank: 'For a bank', landlord: 'For a landlord', visa: 'For a visa office', other: 'For other use' });
const WEDDINGS_NOTE = 'Weddings are counted by TDW from bookings with an invoice and a payment recorded in TDW.';
/** The founder's words for the statement (ruled through the chair, CE-47). Carried verbatim on the PDF and the check page. */
const statementNote = (name, issuedIso) => `Figures as recorded by ${name} in TDW. TDW confirms this statement was issued from her TDW account on ${fullDate(issuedIso)}. TDW has not audited or verified these figures.`;
const SITE = process.env.PWA_BASE_URL || 'https://thedreamwedding.in';
const checkUrl = (code) => `${SITE.replace(/\/+$/, '')}/check/${code}`;

module.exports = { fullDate, monthName, rs, tradeOf, KIND_TITLE, PURPOSE, WEDDINGS_NOTE, statementNote, checkUrl, MONTHS };
