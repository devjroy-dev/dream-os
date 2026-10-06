'use strict';
// src/lib/partners/reports.js · CE-47 · PTN-A1 · three reports from DIFFERENT vendors hide an UNCHECKED partner until the
// admin looks (ruled 6 Oct 2026). Handled reports no longer count. A checked partner is not hidden by reports.
const HIDE_AT = 3;
function hiddenByReports(org, reports) {
  if (!org || org.check_state !== 'unchecked') return false;
  const vendors = new Set((reports || []).filter((r) => r.partner_id === org.id && !r.handled_at).map((r) => r.vendor_id));
  return vendors.size >= HIDE_AT;
}
module.exports = { HIDE_AT, hiddenByReports };
