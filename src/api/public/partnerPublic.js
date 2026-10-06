'use strict';
// src/api/public/partnerPublic.js · CE-47 · PTN-A1 · two public reads, no sign-in:
//   GET /api/public/partner/p/:handle    -> the partner's public page (null for a blocked partner: it vanishes at once)
//   GET /api/public/partner/request/:token -> the request link page. NEVER the vendor's phone or email (rule K).
const express = require('express');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const orgs = require('../../lib/partners/orgs');
const fwd = require('../../lib/partners/forward');
const { normalizeIgHandle } = require('../../lib/partners/links');

const router = express.Router();

router.get('/p/:handle', asyncHandler(async (req, res) => {
  const h = normalizeIgHandle(req.params.handle);
  if (!h) return errRes(res, 404, 'This partner page does not exist.');
  const { data: o } = await req.app.locals.supabase.from('partner_orgs').select(orgs.ORG_COLS).eq('instagram_handle', h.toLowerCase()).maybeSingle();
  const page = orgs.publicShape(o);
  if (!page) return errRes(res, 404, 'This partner page does not exist.');
  return okRes(res, { partner: page });
}));

router.get('/request/:token', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const t = String(req.params.token || '');
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(t)) return errRes(res, 404, 'This link does not work. Ask the person who sent it for a new one.');
  const { data: r } = await supabase.from('forward_recipients').select('request_id').eq('token_hash', fwd.tokenHash(t)).maybeSingle();
  if (!r) return errRes(res, 404, 'This link does not work. Ask the person who sent it for a new one.');
  const { data: q } = await supabase.from('forward_requests').select('id, vendor_id, outside_handle, role, city, event_date, budget_from, budget_to, pay_kind, note').eq('id', r.request_id).maybeSingle();
  if (!q) return errRes(res, 404, 'This request has ended.');
  const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  if (q.event_date < today) return okRes(res, { ended: true, line: 'This request has ended. Its date has passed.' });
  const { data: v } = q.vendor_id ? await supabase.from('vendors').select('business_name, category, instagram_handle').eq('id', q.vendor_id).maybeSingle() : { data: null };
  return okRes(res, { ended: false, request: fwd.requestPage({ face: fwd.vendorFace(v, q), request: q }) });
}));

module.exports = router;
