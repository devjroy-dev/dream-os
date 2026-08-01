// src/api/admin/discover.js
// Admin Discover queue — grant/deny/revoke access.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

async function logAction(supabase, action, targetId, metadata = {}) {
  await supabase.from('admin_activity_log').insert({
    admin_email: 'admin@thedreamwedding.in', action,
    target_type: 'vendor', target_id: targetId, metadata,
  });
}

// GET /requests
// ── F-07.91 CURED — THE UNSATISFIABLE GUARD STACK ────────────────────────────
// EVERY ROUTE BELOW READ: `requireAuth, requireAdmin`.
// `requireAuth` (src/api/middleware/requireAuth.js:13) verifies a SUPABASE USER
// JWT. It stood FIRST, so it answered 401 before `requireAdmin` was ever
// reached — and an admin holds no user JWT. The whole Discover approval queue
// was therefore unreachable from the panel: not just the list, but grant, deny
// and revoke. Founder-captured on the wire; PRE-EXISTING, older than the panel
// fold that made it visible.
//
// A guard nobody can satisfy is a LOCK WITH NO KEY, not a second factor.
// Removing it is not a weakening: `requireAdmin` alone is the identical
// protection every other /api/v2/admin/* route in this estate carries. The
// second factor it gestured at is real and wanted — it is chartered as F-07.92
// so the want survives the cure rather than dying with the broken lock.
//
// REFUSED IN INK (CE, on the LE's own grounds): teaching the panel to hold a
// user JWT would re-cross the lane geometry F-07.65 closed. Never proposed again.
router.get('/requests', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const state    = req.query.state || 'requested';
  let q = supabase.from('vendor_discover_requests')
    .select('id, vendor_id, state, reason, decided_at, created_at, vendor:vendors(id, business_name, routing_handle, category, city, user:users(name, phone))')
    .order('created_at', { ascending: true });
  if (state !== 'all') q = q.eq('state', state);
  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { requests: data || [], total: (data || []).length });
}));

// POST /grant/:vendorId
router.post('/grant/:vendorId', requireAdmin, asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const vendorId  = req.params.vendorId;
  await supabase.from('vendors').update({ discover_eligible: true, discover_request_state: 'approved' }).eq('id', vendorId);
  await supabase.from('vendor_discover_requests')
    .update({ state: 'approved', decided_by_admin: 'admin', decided_at: new Date().toISOString() })
    .eq('vendor_id', vendorId).in('state', ['requested', 'under_review']);
  await logAction(supabase, 'discover_grant', vendorId);
  return okRes(res, {});
}));

// POST /deny/:vendorId
router.post('/deny/:vendorId', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendorId = req.params.vendorId;
  const reason   = (req.body || {}).reason || null;
  await supabase.from('vendors').update({ discover_request_state: 'denied' }).eq('id', vendorId);
  await supabase.from('vendor_discover_requests')
    .update({ state: 'denied', reason, decided_by_admin: 'admin', decided_at: new Date().toISOString() })
    .eq('vendor_id', vendorId).in('state', ['requested', 'under_review']);
  await logAction(supabase, 'discover_deny', vendorId, { reason });
  return okRes(res, {});
}));

// POST /revoke/:vendorId
router.post('/revoke/:vendorId', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendorId = req.params.vendorId;
  const reason   = (req.body || {}).reason || null;
  await supabase.from('vendors').update({ discover_eligible: false, discover_request_state: 'revoked' }).eq('id', vendorId);
  await logAction(supabase, 'discover_revoke', vendorId, { reason });
  return okRes(res, {});
}));

module.exports = router;
