// src/lib/vendor/tds.js
// Shared write logic for TDS ledger.
'use strict';

function currentFinancialYear() {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  if (month >= 4) return `FY${year}-${String(year + 1).slice(2)}`;
  return `FY${year - 1}-${String(year).slice(2)}`;
}

// ── createEntry ───────────────────────────────────────────────────────────
async function createEntry(supabase, vendorId, params) {
  const {
    invoice_id, client_id, client_name, client_pan, client_tan,
    gross_amount, tds_rate, section, deduction_date,
    financial_year, certificate_no, notes,
  } = params;

  if (!client_name || !client_name.trim()) return { ok: false, error: 'client_name is required.' };
  if (!gross_amount || gross_amount <= 0)  return { ok: false, error: 'gross_amount must be greater than zero.' };
  if (tds_rate == null || tds_rate < 0)    return { ok: false, error: 'tds_rate is required and must be >= 0.' };
  if (!deduction_date)                      return { ok: false, error: 'deduction_date is required (YYYY-MM-DD).' };

  const tds_amount  = Math.round(gross_amount * tds_rate / 100);
  const net_received = gross_amount - tds_amount;
  if (net_received <= 0) return { ok: false, error: 'net_received must be greater than zero.' };

  const fy = financial_year || currentFinancialYear();

  const { data, error } = await supabase.from('tds_ledger').insert({
    vendor_id:      vendorId,
    invoice_id:     invoice_id     || null,
    client_id:      client_id      || null,
    client_name:    client_name.trim(),
    client_pan:     client_pan     || null,
    client_tan:     client_tan     || null,
    gross_amount,
    tds_rate,
    tds_amount,
    net_received,
    section:        section        || null,
    deduction_date,
    financial_year: fy,
    certificate_no: certificate_no || null,
    notes:          notes          || null,
  }).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, entry: data };
}

// ── getSummary ────────────────────────────────────────────────────────────
async function getSummary(supabase, vendorId, financialYear) {
  const fy = financialYear || currentFinancialYear();
  const { data, error } = await supabase.from('tds_ledger')
    .select('gross_amount, tds_amount, net_received, section')
    .eq('vendor_id', vendorId).eq('financial_year', fy);
  if (error) return { ok: false, error: error.message };

  const rows = data || [];
  const bySection = {};
  let totalGross = 0, totalTds = 0, totalNet = 0;
  for (const r of rows) {
    totalGross += r.gross_amount;
    totalTds   += r.tds_amount;
    totalNet   += r.net_received;
    const sec = r.section || 'Unknown';
    if (!bySection[sec]) bySection[sec] = { section: sec, gross: 0, tds: 0, count: 0 };
    bySection[sec].gross += r.gross_amount;
    bySection[sec].tds   += r.tds_amount;
    bySection[sec].count += 1;
  }

  return {
    ok: true,
    financial_year: fy,
    total_gross:    totalGross,
    total_tds:      totalTds,
    total_net:      totalNet,
    entry_count:    rows.length,
    by_section:     Object.values(bySection),
  };
}

module.exports = { createEntry, getSummary, currentFinancialYear };
