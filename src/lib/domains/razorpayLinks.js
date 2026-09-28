// src/lib/domains/razorpayLinks.js — TDW · CE-46 · WEB-1 cut 2 · SHE PAYS FIRST.
//
// One Razorpay Payment Link per domain order (POST /v1/payment_links, basic auth
// RAZORPAY_KEY_ID:RAZORPAY_KEY_SECRET, the keys billing already holds). The
// link's notes carry vendor_id and tdw_kind='domain' and its reference_id is
// the vendor_domains row id, so the webhook (index.js, the estate's one money
// door) can name the row it paid for. Injectable fetch.
'use strict';

const API = () => (process.env.RAZORPAY_API_BASE || 'https://api.razorpay.com').replace(/\/$/, '');

async function createLink({ rowId, vendorId, amountPaise, description, customer }, deps = {}) {
  const f = deps.fetch || globalThis.fetch;
  const id = (process.env.RAZORPAY_KEY_ID || '').trim(); const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!id || !secret) throw new Error('razorpay: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required');
  const body = {
    amount: amountPaise, currency: 'INR', accept_partial: false, description,
    reference_id: rowId, notes: { vendor_id: vendorId, tdw_kind: 'domain', row_id: rowId },
    customer: customer ? { name: customer.name, contact: customer.phone, email: customer.email } : undefined,
    notify: { sms: false, email: false }, reminder_enable: false,
  };
  const r = await f(`${API()}/v1/payment_links`, { method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = {}; }
  if (!r.ok || !json.id || !json.short_url) throw new Error(`razorpay payment_links ${r.status}: ${String(text).slice(0, 200)}`);
  return { linkId: String(json.id), url: String(json.short_url) };
}

module.exports = { createLink };
