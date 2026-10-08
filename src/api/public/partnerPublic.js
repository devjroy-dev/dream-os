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
const calls = require('../../lib/partners/calls');
const answers = require('../../lib/partners/answers');

const router = express.Router();

router.get('/p/:handle', asyncHandler(async (req, res) => {
  const h = normalizeIgHandle(req.params.handle);
  if (!h) return errRes(res, 404, 'This partner page does not exist.');
  const { data: o } = await req.app.locals.supabase.from('partner_orgs').select(orgs.ORG_COLS).eq('instagram_handle', h.toLowerCase()).maybeSingle();
  const page = orgs.publicShape(o, await orgs.markOn(req.app.locals.supabase));
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
  if (!q) return errRes(res, 404, 'This request is closed.');
  const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  if (q.event_date < today) return okRes(res, { ended: true, line: 'This request is closed, because its date has passed.' });
  const { data: v } = q.vendor_id ? await supabase.from('vendors').select('business_name, category, instagram_handle').eq('id', q.vendor_id).maybeSingle() : { data: null };
  return okRes(res, { ended: false, request: fwd.requestPage({ face: fwd.vendorFace(v, q), request: q }) });
}));

// ── The booker's link (PTN-A2-1): /api/v2/public/partner/call/:token ────────────────────────────────────────────
// Opens the call a partner was sent, with no sign-in; suggests people; stops or pauses calls. No phone or email of the
// vendor or of anyone suggested in any answer. One answer for every wrong token.
const NO_LINK = 'This link does not work. Ask The Dream Wedding for a new one.';
async function sendOr404(req, res) {
  const send = await answers.sendForToken(req.app.locals.supabase, req.params.token);
  if (!send) { errRes(res, 404, NO_LINK); return null; }
  return send;
}
router.get('/call/:token', asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const send = await sendOr404(req, res); if (!send) return;
  const { data: o } = await sb.from('partner_orgs').select('name, check_state').eq('id', send.partner_id).maybeSingle();
  if (!o || o.check_state === 'blocked') return errRes(res, 404, NO_LINK);
  const c = await calls.loadCall(sb, send.post_id); if (!c) return errRes(res, 404, NO_LINK);
  const { data: ans } = await sb.from('partner_answers').select('talent_name').eq('send_id', send.id);
  return okRes(res, { partner: o.name, call: calls.callShape(c), suggested: (ans || []).map((a) => a.talent_name), max: answers.MAX });
}));
router.post('/call/:token/suggest', asyncHandler(async (req, res) => {
  const send = await sendOr404(req, res); if (!send) return;
  const out = await answers.suggest(req.app.locals.supabase, send, (req.body || {}).people, { agreed: (req.body || {}).agreed });
  return out.ok ? okRes(res, out) : errRes(res, out.status || 400, out.error);
}));
router.post('/call/:token/:what(stop|pause)', asyncHandler(async (req, res) => {
  const send = await sendOr404(req, res); if (!send) return;
  return okRes(res, { line: await answers.stopOrPause(req.app.locals.supabase, send, req.params.what) });
}));

module.exports = router;
