// src/lib/domains/pricing.js — TDW · CE-46 · WEB-1 cut 2 · THE TEN PERCENT, IN ONE PLACE.
//
// The founder's rule (24 September, amended 27 September): the vendor pays ten
// percent over the registrar's price AFTER its GST. The registrar quotes before
// tax; the tax and the margin are applied here and nowhere else. Paise in,
// paise out (F-19.15). Rounded UP to the whole rupee so a line never reads
// "Rs 687.94".
'use strict';

const GST_PCT_DEFAULT = 18;
const MARGIN_PCT = 10;

/** The registrar's pre-tax paise → what she pays, in paise, a whole rupee. */
function sellPaise(costPaise, gstPct = GST_PCT_DEFAULT) {
  const c = Number(costPaise);
  if (!Number.isFinite(c) || c <= 0) throw new Error('sellPaise: cost must be positive paise');
  const withGst = c * (1 + gstPct / 100);
  const withMargin = withGst * (1 + MARGIN_PCT / 100);
  return Math.ceil(withMargin / 100) * 100;
}

/** Rupees from a registrar figure: ResellerClub quotes rupees as a decimal string or number. */
function rupeesToPaise(rupees) {
  const r = Number(rupees);
  if (!Number.isFinite(r) || r <= 0) throw new Error('rupeesToPaise: not a positive rupee figure');
  return Math.round(r * 100);
}

/** The line the room prints: "Rs 688 a year". Indian grouping, no decimals. */
function rupeeLine(paise, perYear = true) {
  const n = Math.round(Number(paise) / 100);
  const s = String(n);
  const last3 = s.slice(-3); const rest = s.slice(0, -3);
  const grouped = (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + last3;
  return `Rs ${grouped}${perYear ? ' a year' : ''}`;
}

module.exports = { sellPaise, rupeesToPaise, rupeeLine, GST_PCT_DEFAULT, MARGIN_PCT };
