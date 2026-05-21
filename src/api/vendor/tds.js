// src/api/vendor/tds.js
// GET  /api/v2/vendor/tds/:vendorId          — list entries
// POST /api/v2/vendor/tds                    — create entry
// PATCH /api/v2/vendor/tds/:entryId          — update
// DELETE /api/v2/vendor/tds/:entryId         — hard delete
// GET  /api/v2/vendor/tds/:vendorId/summary  — FY aggregate
// GET  /api/v2/vendor/tds/:vendorId/export   — CSV download
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { createEntry, getSummary, currentFinancialYear } = require('../../lib/vendor/tds');

// GET /:vendorId/summary — must be before /:vendorId
router.get('/:vendorId/summary', requireAuth, resolveVendor({ paramName: 'vendorId' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const fy = req.query.financial_year || currentFinancialYear();
  const result = await getSummary(supabase, req.vendor.id, fy);
  if (!result.ok) return errRes(res, 500, result.error);
  return okRes(res, result);
}));

// GET /:vendorId/export — CSV
router.get('/:vendorId/export', requireAuth, resolveVendor({ paramName: 'vendorId' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const fy = req.query.financial_year;
  if (!fy) return errRes(res, 400, 'financial_year query param is required.');

  const { data, error } = await supabase.from('tds_ledger')
    .select('*').eq('vendor_id', req.vendor.id).eq('financial_year', fy)
    .order('deduction_date', { ascending: true });
  if (error) return errRes(res, 500, error.message);

  const handle = req.vendor.routing_handle || 'VENDOR';
  const cols   = ['Deduction Date','Financial Year','Client Name','PAN','TAN','Section','Gross Amount','TDS Rate','TDS Amount','Net Received','Certificate No','Notes'];
  const rows   = (data || []).map(r => [
    r.deduction_date, r.financial_year, r.client_name, r.client_pan || '', r.client_tan || '',
    r.section || '', r.gross_amount, r.tds_rate, r.tds_amount, r.net_received,
    r.certificate_no || '', r.notes || '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

  const csv = [cols.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="tds-${fy}-${handle}.csv"`);
  return res.send(csv);
}));

// GET /:vendorId — list
router.get('/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { financial_year, client_id, from, to } = req.query;
  let q = supabase.from('tds_ledger').select('*')
    .eq('vendor_id', req.vendor.id)
    .order('deduction_date', { ascending: false });
  if (financial_year) q = q.eq('financial_year', financial_year);
  if (client_id)      q = q.eq('client_id', client_id);
  if (from)           q = q.gte('deduction_date', from);
  if (to)             q = q.lte('deduction_date', to);
  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { entries: data || [], total: (data || []).length });
}));

// POST / — create
router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result = await createEntry(supabase, req.vendor.id, req.body || {});
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { entry: result.entry });
}));

// PATCH /:entryId — update
router.patch('/:entryId', requireAuth, resolveVendor({ paramName: 'entryId', via: 'tds_ledger' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const allowed  = ['client_name','client_pan','client_tan','gross_amount','tds_rate',
                    'section','deduction_date','financial_year','certificate_no','notes'];
  const updates  = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  if (!Object.keys(updates).length) return errRes(res, 400, 'No valid fields provided.');

  // Recompute tds_amount + net_received if rate or gross changes
  const gross = updates.gross_amount;
  const rate  = updates.tds_rate;
  if (gross !== undefined || rate !== undefined) {
    const { data: cur } = await supabase.from('tds_ledger').select('gross_amount, tds_rate')
      .eq('id', req.params.entryId).single();
    if (cur) {
      const g = gross !== undefined ? gross : cur.gross_amount;
      const r = rate  !== undefined ? rate  : cur.tds_rate;
      updates.tds_amount   = Math.round(g * r / 100);
      updates.net_received = g - updates.tds_amount;
    }
  }

  const { data, error } = await supabase.from('tds_ledger')
    .update(updates).eq('id', req.params.entryId).eq('vendor_id', req.vendor.id)
    .select().single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'TDS entry not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { entry: data });
}));

// DELETE /:entryId — hard delete
router.delete('/:entryId', requireAuth, resolveVendor({ paramName: 'entryId', via: 'tds_ledger' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { error } = await supabase.from('tds_ledger')
    .delete().eq('id', req.params.entryId).eq('vendor_id', req.vendor.id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { deleted: true });
}));

module.exports = router;
