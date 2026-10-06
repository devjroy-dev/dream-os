// src/lib/papers/figures.js · CE-47 · PRO · P1 · what each paper states, read from her TDW records at the moment of
// issue and FROZEN into issued_papers.figures (0209), so the paper and its check page never drift from each other.
// Reads only the live columns the founder read on 6 Oct 2026. Never throws; a failed read is { ok:false, error }.
const { verifiedWeddings, todayIST } = require('./verifiedWeddings');
const { tradeOf } = require('./words');

const ROW_CAP = 5000;
const EXP = 'amount, category, description, expense_date, created_at, supplier_name, supplier_gstin, bill_number, taxable_value, gst_rate, gst_amount';   // a pack larger than this is refused in words, never silently cut
const IST = '+05:30';
const startOf = (d) => `${d}T00:00:00${IST}`, endOf = (d) => `${d}T23:59:59.999${IST}`;
const istDay = (ts) => new Date(new Date(ts).getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

function who(vendor) {
  return { name: (vendor.business_name || '').trim() || 'Name not set', trade: tradeOf(vendor.category), city: (vendor.city || '').trim() || 'City not set', gstin: vendor.gstin || null };
}

async function professional({ supabase, vendor, now = Date.now() }) {
  const w = await verifiedWeddings({ supabase, vendorId: vendor.id, now });
  if (w.count === null) return { ok: false, error: 'TDW could not count your weddings just now. Please try again.' };
  const p = who(vendor);
  return { ok: true, figures: { name: p.name, trade: p.trade, city: p.city, weddings_verified: w.count, as_of: todayIST(now) } };
}

async function statement({ supabase, vendor, from, to }) {
  const r = await supabase.from('invoices').select('amount_total, amount_paid, created_at').eq('vendor_id', vendor.id).is('deleted_at', null)
    .gte('created_at', startOf(from)).lte('created_at', endOf(to)).limit(ROW_CAP + 1);
  if (r.error) return { ok: false, error: 'TDW could not read your invoices just now. Please try again.' };
  const rows = r.data || [];
  if (rows.length > ROW_CAP) return { ok: false, error: 'This period has too many invoices for one statement. Please choose a shorter period.' };
  const p = who(vendor);
  return { ok: true, figures: { name: p.name, trade: p.trade, city: p.city, from, to,
    invoices_raised: rows.length, invoiced: rows.reduce((s, x) => s + (Number(x.amount_total) || 0), 0), received: rows.reduce((s, x) => s + (Number(x.amount_paid) || 0), 0) } };
}

/** The CA pack: every sale, purchase and TDS entry in the period, month by month. Expenses are dated by the date she
 *  gave, else the day she filed them (expense_date is nullable; the same fallback readRecentExpenses uses). */
async function caPack({ supabase, vendor, from, to }) {
  const [inv, exp, tds] = await Promise.all([
    supabase.from('invoices').select('invoice_number, client_name, amount_total, amount_paid, gst_rate, gst_amount, created_at, state').eq('vendor_id', vendor.id).is('deleted_at', null)
      .gte('created_at', startOf(from)).lte('created_at', endOf(to)).order('created_at', { ascending: true }).limit(ROW_CAP + 1),
    // two reads, exact: rows dated inside the period, and undated rows filed inside it (a September bill logged on
    // 5 October still belongs to September)
    Promise.all([
      supabase.from('expenses').select(EXP).eq('vendor_id', vendor.id).is('deleted_at', null).gte('expense_date', from).lte('expense_date', to).limit(ROW_CAP + 1),
      supabase.from('expenses').select(EXP).eq('vendor_id', vendor.id).is('deleted_at', null).is('expense_date', null).gte('created_at', startOf(from)).lte('created_at', endOf(to)).limit(ROW_CAP + 1),
    ]).then(([a, b]) => (a.error || b.error ? { error: a.error || b.error } : { data: [...(a.data || []), ...(b.data || [])] })),
    supabase.from('tds_ledger').select('deduction_date, client_name, client_pan, section, gross_amount, tds_rate, tds_amount, net_received, certificate_no, financial_year').eq('vendor_id', vendor.id)
      .gte('deduction_date', from).lte('deduction_date', to).order('deduction_date', { ascending: true }).limit(ROW_CAP + 1),
  ]);
  if (inv.error || exp.error || tds.error) return { ok: false, error: 'TDW could not read your records just now. Please try again.' };
  const sales = (inv.data || []).map((x) => ({ date: istDay(x.created_at), number: x.invoice_number, client: x.client_name, total: Number(x.amount_total) || 0, paid: Number(x.amount_paid) || 0, gst_rate: x.gst_rate, gst_amount: x.gst_amount }));
  const purchases = (exp.data || []).map((x) => ({ date: x.expense_date || istDay(x.created_at), category: x.category, description: x.description, supplier: x.supplier_name, supplier_gstin: x.supplier_gstin, bill_number: x.bill_number, taxable: x.taxable_value, gst_rate: x.gst_rate, gst_amount: x.gst_amount, total: Number(x.amount) || 0 }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const deductions = (tds.data || []).map((x) => ({ date: x.deduction_date, client: x.client_name, pan: x.client_pan, section: x.section, gross: x.gross_amount, rate: x.tds_rate, tds: x.tds_amount, net: x.net_received, certificate: x.certificate_no, fy: x.financial_year }));
  if (sales.length > ROW_CAP || purchases.length > ROW_CAP || deductions.length > ROW_CAP) return { ok: false, error: 'This period has too many entries for one pack. Please choose a shorter period.' };
  const months = {};
  const m = (d) => (months[d.slice(0, 7)] = months[d.slice(0, 7)] || { invoiced: 0, gst_charged: 0, received: 0, spent: 0, gst_paid: 0, tds: 0 });
  for (const s of sales) { const t = m(s.date); t.invoiced += s.total; t.gst_charged += Number(s.gst_amount) || 0; t.received += s.paid; }
  for (const p of purchases) { const t = m(p.date); t.spent += p.total; t.gst_paid += Number(p.gst_amount) || 0; }
  for (const d of deductions) { const t = m(d.date); t.tds += Number(d.tds) || 0; }
  const p = who(vendor);
  return { ok: true, figures: { name: p.name, trade: p.trade, city: p.city, gstin: p.gstin, from, to, months, sales, purchases, deductions } };
}

module.exports = { professional, statement, caPack, who, ROW_CAP };
