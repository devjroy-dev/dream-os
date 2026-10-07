// src/api/webhooks/razorpayPartner.js — TDW · CE-47 · INS · PAY-A · POST /webhook/razorpay-partner.
// PAY-A's OWN door, beside TDW's billing door (/webhook/razorpay, not edited, not read). It verifies the exact raw
// bytes (req.rawBody, captured estate-wide at src/index.js :80) with PAY-A's OWN secret, RAZORPAY_PARTNER_WEBHOOK_SECRET;
// TDW's billing secret is never read here. With the secret unset it accepts nothing. Order: verify, then record (one
// call to 0201, store and apply together, once only by payment id), then 200; a database failure answers 500 so
// Razorpay retries, and the retry is a duplicate that changes nothing. Nothing in a body or a log carries a token,
// a secret or a signature.
'use strict';
const rp = require('../../lib/vendor/payRazorpay');
const pl = require('../../lib/vendor/payLinks');

module.exports = async function razorpayPartnerWebhook(req, res) {
  const deps = { supabase: req.app.locals.supabase, ...(req.app.locals.payLinksDeps || {}) };
  const env = deps.env || process.env;
  if (!rp.config(env).configured) return res.status(404).json({ ok: false });
  if (!rp.verifyWebhook(req.rawBody, req.headers['x-razorpay-signature'], env)) return res.status(400).json({ ok: false });
  let evt; try { evt = JSON.parse(req.rawBody.toString('utf8')); } catch { return res.status(400).json({ ok: false }); }
  const r = await pl.recordEvent(evt, deps);
  if (r.retry) return res.status(500).json({ ok: false });
  res.status(200).json({ ok: true });
  // (b) a held binder payment is applied AFTER the 200; if this fails or the process dies, the sweep retries it.
  if (r.applyAfter) setImmediate(() => { pl.applyBinderEvent(r.applyAfter.vendorId, r.applyAfter.eventId, deps).catch(() => {}); });
  return undefined;
};
