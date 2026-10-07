'use strict';
// src/lib/bills/parse.js · CE-47 · PRO · P2 · WHAT A PURCHASE BILL SAYS, AND WHETHER ITS NUMBERS HOLD.
//
// PURE: no network, no database, no clock. Two jobs, kept apart on purpose:
//   fromText(text, opts)  best-effort fields from a bill's printed text (any reader's text: the reader is the founder's
//                         call, still open; this file does not care which one wrote the text).
//   check(draft, opts)    the gate. Whatever proposed the fields (fromText, a reader that returns fields, or her own
//                         typing), nothing becomes an expense until check() says the numbers hold and she confirms.
//                         check() never invents a figure: what it cannot prove it leaves for her, with a plain line.
// Field names are 0208's columns on expenses: amount (the bill's total), taxable_value, gst_rate, gst_amount,
// supplier_name, supplier_gstin, bill_number, expense_date (YYYY-MM-DD).
// Money is rupees as a Number with at most two decimals; words to her say "Rs 2,000" (standing rule).

// GST slabs a bill can carry (12 and 28 stay for bills dated before the 2025 change). 40% is NOT here: 0208's CHECK on
// expenses.gst_rate is 0 to 28, so a 40% bill is said to her plainly (below) rather than refused by the database.
const RATES = [0, 0.25, 3, 5, 12, 18, 28];
const TOLERANCE = 1;                             // Rs: printed bills round each tax line
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const GSTIN_SHAPE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const GSTIN_ANY = /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/g;
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** The GSTIN's 15th character is a check digit over the first 14 (base 36, weights 1 and 2 alternating). */
function gstinCheckChar(first14) {
  let sum = 0;
  for (let i = 0; i < 14; i += 1) {
    const v = CHARS.indexOf(first14[i]); if (v < 0) return null;
    const p = v * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(p / 36) + (p % 36);
  }
  return CHARS[(36 - (sum % 36)) % 36];
}
function gstinValid(s) {
  const g = String(s || '').trim().toUpperCase();
  return GSTIN_SHAPE.test(g) && gstinCheckChar(g.slice(0, 14)) === g[14];
}

const round2 = (n) => Math.round(n * 100) / 100;

/** "₹ 1,23,456.50", "Rs. 1,234", "INR 12,000.00", "1234.5" → 123456.5; anything else → null. */
function money(s) {
  const m = String(s == null ? '' : s).replace(/₹|rs\.?|inr/gi, ' ').match(/-?\d[\d,]*(?:\.\d{1,2})?/);
  if (!m) return null;
  const n = Number(m[0].replace(/,/g, ''));
  return Number.isFinite(n) ? round2(n) : null;
}
const moneysIn = (line) => (String(line).replace(/₹|rs\.?|inr/gi, ' ').match(/\d[\d,]*\.\d{2}\b|\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\b\d{2,9}\b/g) || [])
  .map((x) => Number(x.replace(/,/g, ''))).filter((n) => Number.isFinite(n));

/** dd/mm/yyyy, dd-mm-yy, dd.mm.yyyy, "4 October 2026", "04-Oct-2026" → '2026-10-04'; anything else → null.
 *  Indian bills write the day first; a date that cannot be a real day is refused, never guessed. */
function isoDate(s) {
  const t = String(s || '').trim().toLowerCase();
  let d; let mo; let y;
  let m = t.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})\b/);
  if (m) { d = +m[1]; mo = +m[2]; y = +m[3]; } else {
    m = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?[\s-]+([a-z]{3,9})[\s,-]+(\d{2}|\d{4})\b/);
    if (!m) return null;
    const i = MONTHS.findIndex((n) => n.startsWith(m[2].slice(0, 3)) && (m[2].length === 3 || n === m[2] || n.startsWith(m[2])));
    if (i < 0) return null; d = +m[1]; mo = i + 1; y = +m[3];
  }
  if (y < 100) y += 2000;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const LABEL = {
  total: /\b(grand\s*total|total\s*amount|invoice\s*total|net\s*amount|amount\s*payable|total\s*payable|bill\s*amount|total)\b/i,
  taxable: /\b(taxable\s*(value|amount|amt)|sub\s*-?\s*total|assessable\s*value)\b/i,
  cgst: /\bcgst\b/i, sgst: /\b(sgst|utgst)\b/i, igst: /\bigst\b/i,
  number: /\b(invoice|inv|bill|receipt)\s*(no|number|#)\.?\s*[:\-]?\s*([A-Z0-9][A-Z0-9/\-]{0,29})/i,
  date: /\b(invoice|inv|bill)?\s*date\b/i,
};

/** Best-effort fields from a bill's text. Every field may come back null; check() and she decide. */
function fromText(text, { ownGstin = null } = {}) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const own = ownGstin ? String(ownGstin).trim().toUpperCase() : null;
  const gstins = [...new Set((String(text || '').toUpperCase().match(GSTIN_ANY) || []))].filter((g) => g !== own);
  const supplierGstin = gstins.find(gstinValid) || gstins[0] || null;
  const last = (re) => { for (let i = lines.length - 1; i >= 0; i -= 1) if (re.test(lines[i])) { const ns = moneysIn(lines[i]); if (ns.length) return { line: lines[i], n: ns[ns.length - 1] }; } return null; };
  const taxLine = (re) => { const h = last(re); if (!h) return null; const r = h.line.match(/(\d{1,2}(?:\.\d{1,2})?)\s*%/); return { amount: h.n, rate: r ? Number(r[1]) : null }; };
  const total = last(LABEL.total); const taxable = last(LABEL.taxable);
  const cgst = taxLine(LABEL.cgst); const sgst = taxLine(LABEL.sgst); const igst = taxLine(LABEL.igst);
  const numM = lines.map((l) => l.match(LABEL.number)).find(Boolean);
  const dateLine = lines.find((l) => LABEL.date.test(l) && isoDate(l)) || lines.find((l) => isoDate(l));
  const nameLine = lines.find((l) => !/\d{3,}|gstin|invoice|bill|tax|date|phone|mobile|email|@|www\.|address/i.test(l) && /[a-z]{3,}/i.test(l));
  return {
    supplier_name: nameLine || null,
    supplier_gstin: supplierGstin,
    bill_number: numM ? numM[3] : null,
    expense_date: dateLine ? isoDate(dateLine) : null,
    amount: total ? total.n : null,
    taxable_value: taxable ? taxable.n : null,
    cgst: cgst ? cgst.amount : null, sgst: sgst ? sgst.amount : null, igst: igst ? igst.amount : null,
    printed_rate: (igst && igst.rate) != null ? igst.rate : (cgst && cgst.rate != null ? cgst.rate * 2 : null),
  };
}

const rs = (n) => 'Rs ' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });

/** The gate. Returns { ok, fields, problems }: fields only ever holds what the numbers prove or she typed. */
function check(draft, { ownGstin = null, today = null } = {}) {
  const d = draft || {}; const problems = []; const f = {};
  const num = (k) => (d[k] == null || d[k] === '' ? null : (typeof d[k] === 'number' ? round2(d[k]) : money(d[k])));
  const amount = num('amount'); const taxable = num('taxable_value');
  const cgst = num('cgst'); const sgst = num('sgst'); const igst = num('igst');
  let gst = num('gst_amount');

  if (amount == null || amount <= 0) problems.push('Type the bill’s total.'); else f.amount = amount;

  const g = d.supplier_gstin ? String(d.supplier_gstin).trim().toUpperCase() : '';
  if (g) {
    if (!gstinValid(g)) problems.push('The seller’s GSTIN does not check out. Look at the bill again and fix it, or leave it empty.');
    else if (ownGstin && g === String(ownGstin).trim().toUpperCase()) problems.push('That GSTIN is yours. Type the seller’s GSTIN.');
    else f.supplier_gstin = g;
  }
  if (d.supplier_name && String(d.supplier_name).trim()) f.supplier_name = String(d.supplier_name).trim().slice(0, 120);
  if (d.bill_number && String(d.bill_number).trim()) f.bill_number = String(d.bill_number).trim().slice(0, 30);

  if (d.expense_date) {
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(String(d.expense_date)) ? isoDate(String(d.expense_date).split('-').reverse().join('-')) : isoDate(d.expense_date);
    if (!iso) problems.push('The bill’s date is not a real date.');
    else if (today && iso > today) problems.push('The bill’s date is after today.');
    else f.expense_date = iso;
  }

  if (igst != null && (cgst != null || sgst != null) && igst > 0 && (cgst > 0 || sgst > 0)) {
    problems.push('A bill charges IGST, or CGST and SGST, not both. Check the tax lines.');
  } else {
    if (gst == null) {
      if (igst != null) gst = igst;
      else if (cgst != null && sgst != null) gst = round2(cgst + sgst);
      else if (cgst != null || sgst != null) problems.push('Only one of CGST and SGST was found. Type both, or the total GST.');
    }
    if (cgst != null && sgst != null && Math.abs(cgst - sgst) > TOLERANCE) problems.push('CGST and SGST should be equal. Check the tax lines.');
  }

  if (taxable != null && taxable > 0 && gst != null && gst >= 0) {
    const sum = round2(taxable + gst);
    if (amount != null && Math.abs(sum - amount) > TOLERANCE) {
      problems.push(`Taxable value ${rs(taxable)} and GST ${rs(gst)} make ${rs(sum)}, not the total ${rs(amount)}. Check the three figures.`);
    } else {
      const raw = (gst / taxable) * 100;
      if (Math.abs(round2(taxable * 0.40) - gst) <= TOLERANCE) { problems.push('This bill charges GST at 40%. TDW cannot record a 40% bill yet; add it in Expenses without the GST.'); return { ok: false, fields: f, problems }; }
      const rate = RATES.reduce((a, r) => (Math.abs(r - raw) < Math.abs(a - raw) ? r : a), RATES[0]);
      if (Math.abs(round2(taxable * rate / 100) - gst) > TOLERANCE) problems.push(`GST of ${rs(gst)} on ${rs(taxable)} is not one of the GST rates. Check the tax lines.`);
      else if (d.printed_rate != null && Number(d.printed_rate) !== rate) problems.push(`The bill prints ${d.printed_rate}% but its figures make ${rate}%. Check the tax lines.`);
      else { f.taxable_value = taxable; f.gst_amount = gst; f.gst_rate = rate; }
    }
  } else if (gst != null || taxable != null) {
    problems.push('Type both the taxable value and the GST, or leave both empty.');
  }

  if (f.supplier_gstin && ownGstin && gstinValid(ownGstin) && f.gst_amount > 0) {
    const sameState = f.supplier_gstin.slice(0, 2) === String(ownGstin).trim().toUpperCase().slice(0, 2);
    if (sameState && igst > 0) problems.push('The seller is in your state, so the bill should charge CGST and SGST, not IGST. Ask the seller to correct the bill.');
    if (!sameState && (cgst > 0 || sgst > 0)) problems.push('The seller is in another state, so the bill should charge IGST, not CGST and SGST. Ask the seller to correct the bill.');
  }
  // expenses.amount (0010), taxable_value and gst_amount (0208) are whole rupees: the proven figures are rounded LAST,
  // after the checks ran on the printed paise, so a bill that holds still holds within the Rs 1 tolerance.
  for (const k of ['amount', 'taxable_value', 'gst_amount']) if (f[k] != null) f[k] = Math.round(f[k]);
  return { ok: problems.length === 0 && f.amount != null && f.amount > 0, fields: f, problems };
}

module.exports = { fromText, check, gstinValid, gstinCheckChar, money, isoDate, RATES };
