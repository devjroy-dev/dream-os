// src/api/vendor/contracts.js
// POST   /api/v2/vendor/contracts/upload-url           — get signed upload URL
// POST   /api/v2/vendor/contracts/:id/finalize         — finalize after upload
// GET    /api/v2/vendor/contracts                      — list contracts
// GET    /api/v2/vendor/contracts/:id/download         — signed download URL
// PATCH  /api/v2/vendor/contracts/:id                  — update metadata
// POST   /api/v2/vendor/contracts/:id/send             — mark sent
// DELETE /api/v2/vendor/contracts/:id                  — soft delete (cancelled)
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { getUploadUrl, finalizeContract, getDownloadUrl } = require('../../lib/vendor/contracts');

const authMw = [requireAuth, resolveVendor()];

// POST /upload-url — must be before /:id routes
router.post('/upload-url', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { title, client_id, lead_id, invoice_id, filename } = req.body || {};
  const result = await getUploadUrl(supabase, req.vendor.id, { title, clientId: client_id, leadId: lead_id, invoiceId: invoice_id, filename });
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { contract_id: result.contract_id, upload_url: result.upload_url, expires_in: result.expires_in });
}));

// GET / — list
router.get('/', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { client_id, lead_id, state } = req.query;
  let q = supabase.from('contracts').select('*')
    .eq('vendor_id', req.vendor.id)
    .neq('state', 'cancelled')
    .order('created_at', { ascending: false });
  if (client_id) q = q.eq('client_id', client_id);
  if (lead_id)   q = q.eq('lead_id', lead_id);
  if (state)     q = q.eq('state', state);
  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { contracts: data || [], total: (data || []).length });
}));

// POST /:id/finalize
router.post('/:contractId/finalize', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result = await finalizeContract(supabase, req.vendor.id, req.params.contractId);
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { contract: result.contract });
}));

// GET /:id/download
router.get('/:contractId/download', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result = await getDownloadUrl(supabase, req.vendor.id, req.params.contractId);
  if (!result.ok) return errRes(res, 404, result.error);
  return okRes(res, { download_url: result.download_url, expires_in: result.expires_in });
}));

// PATCH /:id
router.patch('/:contractId', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const allowed  = ['title', 'notes', 'state', 'client_id', 'lead_id', 'invoice_id', 'signed_at'];
  const updates  = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  if (!Object.keys(updates).length) return errRes(res, 400, 'No valid fields provided.');
  const { data, error } = await supabase.from('contracts')
    .update(updates).eq('id', req.params.contractId).eq('vendor_id', req.vendor.id)
    .select().single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Contract not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { contract: data });
}));

// POST /:id/send
router.post('/:contractId/send', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result   = await getDownloadUrl(supabase, req.vendor.id, req.params.contractId);
  if (!result.ok) return errRes(res, 404, result.error);

  const { data, error } = await supabase.from('contracts')
    .update({ state: 'sent', sent_at: new Date().toISOString() })
    .eq('id', req.params.contractId).eq('vendor_id', req.vendor.id)
    .select().single();
  if (error) return errRes(res, 500, error.message);

  return okRes(res, { contract: data, download_url: result.download_url });
}));

// DELETE /:id — soft delete
router.delete('/:contractId', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('contracts')
    .update({ state: 'cancelled' })
    .eq('id', req.params.contractId).eq('vendor_id', req.vendor.id)
    .select().single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Contract not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { contract: data });
}));

module.exports = router;
