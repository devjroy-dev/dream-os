'use strict';
// src/api/vendor/partnerContact.js · CE-47 · PTN-A2-1 · the vendor's two taps on a partner's suggestion (mounted at
// /api/v2/vendor via router.js, one line):
//   POST /partner-contact/:interest_id  "Contact <partner>". Records the connection (one per partner per call; A1's
//        connections.record, COUNTED, NEVER CHARGED) and answers how to reach the partner: its own email for calls, or
//        its WhatsApp if it chose WhatsApp, with the call's link already written in. A VENDOR IS NEVER BLOCKED HERE
//        (the founder, 7 Oct 2026, point 5): no count, plan or gate is read before the answer. This is the ONLY body in
//        PTN that carries an address, and it is the partner's own, given for calls, answered only on her tap.
//   POST /partner-report  { interest_id, reason, note? }  Report: partner_reports, item 'call_answer'.
// Either refuses a row that is not on one of HER calls (404, the same words, whatever the reason).
const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const conns = require('../../lib/partners/connections');
const calls = require('../../lib/partners/calls');
const router = express.Router();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REASONS = ['fake', 'asked_for_money', 'unsafe_or_rude', 'other'];
const MISS = 'This suggestion is not on one of your calls.';

async function rowOnHerCall(sb, vendorId, interestId) {
  if (!UUID.test(String(interestId || ''))) return null;
  const { data: r } = await sb.from('collab_interest').select('id, post_id, source, partner_id, send_id, display_name').eq('id', interestId).maybeSingle();
  if (!r || r.source !== 'partner' || !r.partner_id) return null;
  const { data: p } = await sb.from('collab_posts').select('id, vendor_id').eq('id', r.post_id).maybeSingle();
  return p && p.vendor_id === vendorId ? r : null;
}

router.post('/partner-contact/:interest_id', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase;
  const r = await rowOnHerCall(sb, req.vendor.id, req.params.interest_id);
  if (!r) return errRes(res, 404, MISS);
  const { data: o } = await sb.from('partner_orgs').select('id, name, check_state, calls_email, whatsapp_opt, whatsapp_phone').eq('id', r.partner_id).maybeSingle();
  if (!o || o.check_state === 'blocked') return errRes(res, 404, MISS);
  await conns.record(sb, { partnerId: o.id, kind: 'contact', refId: r.post_id, vendorId: req.vendor.id });
  const token = calls.tokenFor(r.send_id); const link = token ? calls.callUrl(token) : null;
  const text = `Hello ${o.name}. I am writing about ${r.display_name}, whom you suggested for my collab call on The Dream Wedding.${link ? ` You can see the call here: ${link}` : ''}`;
  if (o.whatsapp_opt && o.whatsapp_phone && /^\+[0-9]{8,15}$/.test(o.whatsapp_phone)) {
    return okRes(res, { kind: 'whatsapp', href: `https://wa.me/${o.whatsapp_phone.slice(1)}?text=${encodeURIComponent(text)}`, partner: o.name });
  }
  if (o.calls_email) return okRes(res, { kind: 'email', href: `mailto:${o.calls_email}?subject=${encodeURIComponent(`About ${r.display_name}, for my collab call`)}&body=${encodeURIComponent(text)}`, partner: o.name });
  return okRes(res, { kind: 'none', href: null, partner: o.name, line: `${o.name} has not yet given TDW a way to contact it. TDW has not shared your request with anyone else.` });
}));

router.post('/partner-report', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const b = req.body || {};
  const r = await rowOnHerCall(sb, req.vendor.id, b.interest_id);
  if (!r) return errRes(res, 404, MISS);
  if (!REASONS.includes(b.reason)) return errRes(res, 400, 'Choose why you are reporting this.');
  const note = typeof b.note === 'string' && b.note.trim() ? b.note.trim().slice(0, 500) : null;
  const { error } = await sb.from('partner_reports').insert({ partner_id: r.partner_id, item_kind: 'call_answer', item_id: r.id, vendor_id: req.vendor.id, reason: b.reason, note });
  if (error) return errRes(res, 500, 'Something went wrong. Please try again.');
  return okRes(res, { line: 'Thank you. An admin at TDW will look at your report.' });
}));
module.exports = router;
