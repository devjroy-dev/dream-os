// src/lib/domains/resellerclub.js — TDW · CE-46 · WEB-1 cut 2 · THE REGISTRAR, BEHIND ONE CLIENT.
//
// ResellerClub's HTTP API (https://httpapi.com/api; https://test.httpapi.com/api
// for its sandbox), auth by query on every call: auth-userid and api-key
// (RESELLERCLUB_USER_ID, RESELLERCLUB_API_KEY, env.js :54 to :55). NOTHING here
// spends money on its own: `register` is called by service.js only after the
// Razorpay webhook has said PAID for this exact domain. Every call is injectable
// (`deps.fetch`) so b146 drives the client with a fake that refuses unknown
// fields and never touches the network.
//
// The endpoints, as ResellerClub documents them (read 28 September 2026):
//   GET  domains/available.json          domain-name= tlds=          → { "name.in": { status: "available"|"regthroughus"|"regthroughothers"|"unknown", classkey } }
//   GET  products/reseller-price.json    → { <productkey>: { addnewdomain: { "1": "<rupees>" }, renewdomain: {...} } }
//   POST customers/v2/signup.json        the vendor as a customer, her details  → customer-id (number)
//   POST contacts/add.json               her registrant contact under that customer → contact-id (number)
//   POST domains/register.json           domain-name years ns customer-id reg/admin/tech/billing-contact-id invoice-option protect-privacy → { entityid, actionstatus, ... }
//   GET  domains/details-by-name.json    domain-name= options=OrderDetails → { orderid, endtime, ... }
//   POST domains/modify-ns.json          order-id ns → actionstatus
'use strict';

const BASE = () => (process.env.RESELLERCLUB_BASE || 'https://httpapi.com/api').replace(/\/$/, '');
const PRODUCT_KEYS = Object.freeze({ in: 'dotin', com: 'domcno', net: 'dotnet', 'co.in': 'thirdleveldotin' });
const TLDS = Object.freeze(['in', 'com', 'co.in']);

function creds() {
  const id = (process.env.RESELLERCLUB_USER_ID || '').trim();
  const key = (process.env.RESELLERCLUB_API_KEY || '').trim();
  if (!id || !key) throw new Error('resellerclub: RESELLERCLUB_USER_ID and RESELLERCLUB_API_KEY are required');
  return { 'auth-userid': id, 'api-key': key };
}

function qs(params) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((x) => u.append(k, String(x)));
    else u.append(k, String(v));
  }
  return u.toString();
}

async function call(deps, method, pathname, params) {
  const f = deps.fetch || globalThis.fetch;
  const url = `${BASE()}/${pathname}?${qs({ ...creds(), ...params })}`;
  const r = await f(url, { method });
  const text = await r.text();
  let body; try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!r.ok) throw new Error(`resellerclub ${pathname} ${r.status}: ${String(text).slice(0, 200)}`);
  if (body && body.status === 'ERROR') throw new Error(`resellerclub ${pathname}: ${body.message || 'error'}`);
  return body;
}

/** "priya" → [{ domain: "priya.in", available: true }, ...] for the ruled TLDs, at most five. */
async function available(label, deps = {}) {
  const name = String(label || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!name) return [];
  const body = await call(deps, 'GET', 'domains/available.json', { 'domain-name': name, tlds: TLDS });
  const out = [];
  for (const tld of TLDS) {
    const k = `${name}.${tld}`;
    const entry = body[k];
    if (!entry) continue;
    out.push({ domain: k, available: entry.status === 'available' });
  }
  return out.slice(0, 5);
}

/** Pre-tax rupees for one year of a TLD, from the reseller price list; null when unlisted. */
async function yearOneRupees(tld, deps = {}) {
  const key = PRODUCT_KEYS[tld];
  if (!key) return null;
  const prices = deps.priceList || await call(deps, 'GET', 'products/reseller-price.json', {});
  const p = prices && prices[key] && prices[key].addnewdomain && prices[key].addnewdomain['1'];
  return p == null ? null : Number(p);
}

/** Her customer record at the registrar. `registrant` is service.js's shape. Returns the customer-id. */
async function customerSignup(registrant, deps = {}) {
  const body = await call(deps, 'POST', 'customers/v2/signup.json', {
    username: registrant.email, passwd: registrant.password, name: registrant.name, company: registrant.company,
    'address-line-1': registrant.address1, city: registrant.city, state: registrant.state, country: registrant.country || 'IN',
    zipcode: registrant.zipcode, 'phone-cc': registrant.phoneCc || '91', phone: registrant.phone, 'lang-pref': 'en',
  });
  const id = typeof body === 'number' ? body : Number(body && (body.customerid || body['customer-id'] || body));
  if (!Number.isFinite(id)) throw new Error('resellerclub: customer signup returned no id');
  return String(id);
}

/** Her registrant contact under her customer. Returns the contact-id. */
async function contactAdd(customerId, registrant, deps = {}) {
  const body = await call(deps, 'POST', 'contacts/add.json', {
    name: registrant.name, company: registrant.company, email: registrant.email, 'address-line-1': registrant.address1,
    city: registrant.city, state: registrant.state, country: registrant.country || 'IN', zipcode: registrant.zipcode,
    'phone-cc': registrant.phoneCc || '91', phone: registrant.phone, 'customer-id': customerId, type: 'Contact',
  });
  const id = typeof body === 'number' ? body : Number(body);
  if (!Number.isFinite(id)) throw new Error('resellerclub: contact add returned no id');
  return String(id);
}

/** THE BUY. Only service.js calls this, only after the webhook said paid. Returns { orderId, status }. */
async function register({ domain, years, customerId, contactId, nameservers }, deps = {}) {
  const body = await call(deps, 'POST', 'domains/register.json', {
    'domain-name': domain, years: years || 1, ns: nameservers, 'customer-id': customerId,
    'reg-contact-id': contactId, 'admin-contact-id': contactId, 'tech-contact-id': contactId, 'billing-contact-id': contactId,
    'invoice-option': 'NoInvoice', 'protect-privacy': 'true',
  });
  const orderId = body && (body.entityid || body.orderid);
  if (!orderId) throw new Error('resellerclub: register returned no order id');
  return { orderId: String(orderId), status: String(body.actionstatus || body.status || 'Success') };
}

/** The expiry, from the order's details. */
async function details(domain, deps = {}) {
  const body = await call(deps, 'GET', 'domains/details-by-name.json', { 'domain-name': domain, options: 'OrderDetails' });
  const end = body && body.endtime ? new Date(Number(body.endtime) * 1000) : null;
  return { orderId: body && body.orderid ? String(body.orderid) : null, expiresAt: end && !Number.isNaN(end.getTime()) ? end.toISOString() : null };
}

module.exports = { available, yearOneRupees, customerSignup, contactAdd, register, details, TLDS, PRODUCT_KEYS };
