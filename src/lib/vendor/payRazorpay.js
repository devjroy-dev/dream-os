// src/lib/vendor/payRazorpay.js — TDW · CE-47 · INS · PAY-A · THE RAZORPAY PARTNER CALLS, ONE HOME.
//
// A vendor connects HER OWN Razorpay account to TDW (Technology Partner OAuth). Money goes from her client straight to
// her; TDW takes no fee and no commission (the founder, 7 October 2026). This file holds only the partner's calls:
// the authorise address with a signed `state`, the code exchange and refresh, payment links in HER account, and the
// webhook's signature check with PAY-A's OWN secret. It never reads, requires or edits src/lib/billing/* (TDW's own
// subscriptions), and RAZORPAY_WEBHOOK_SECRET (TDW's billing door) is never read here.
//
// BUILT TO THE DOOR, NOT SWITCHED ON: until all four RAZORPAY_PARTNER_* values are set (after Razorpay approves the
// Technology Partner switch, ticket 21269027), configured() is false and every call below refuses without a network
// call. No token, secret or state is ever logged or returned in a body.
'use strict';

const crypto = require('crypto');

const KEYS = ['RAZORPAY_PARTNER_CLIENT_ID', 'RAZORPAY_PARTNER_CLIENT_SECRET', 'RAZORPAY_PARTNER_WEBHOOK_SECRET', 'RAZORPAY_PARTNER_REDIRECT_URI'];
const AUTH = 'https://auth.razorpay.com';
const API = 'https://api.razorpay.com/v1';
const STATE_TTL_MS = 10 * 60 * 1000;   // ten minutes to finish Razorpay's own screen

function config(env = process.env) {
  const c = { clientId: env.RAZORPAY_PARTNER_CLIENT_ID, clientSecret: env.RAZORPAY_PARTNER_CLIENT_SECRET,
    webhookSecret: env.RAZORPAY_PARTNER_WEBHOOK_SECRET, redirectUri: env.RAZORPAY_PARTNER_REDIRECT_URI };
  return { ...c, configured: KEYS.every((k) => typeof env[k] === 'string' && env[k].trim().length > 0) };
}
const NOT_ON = { ok: false, code: 'NOT_CONFIGURED', error: 'Coming soon' };

// ── THE SIGNED STATE: bound to the vendor and her session, expiring, single use (the nonce is spent in 0202's table by
// the caller, through deps.spendNonce, BEFORE the code is exchanged; a second spend of the same nonce is refused).
const b64u = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
function sign(payload, key) { return b64u(crypto.createHmac('sha256', key).update(payload).digest()); }

function makeState({ vendorId, sessionId, now = Date.now(), nonce = crypto.randomBytes(16).toString('hex') }, env = process.env) {
  const c = config(env); if (!c.configured) return NOT_ON;
  const body = b64u(JSON.stringify({ v: vendorId, s: sessionId, n: nonce, e: now + STATE_TTL_MS }));
  return { ok: true, state: `${body}.${sign(body, c.clientSecret)}`, nonce };
}
/** Checks signature, expiry and binding. Single use is the caller's spend of `nonce` (0202), never skipped. */
function readState(state, { vendorId, sessionId, now = Date.now() }, env = process.env) {
  const c = config(env); if (!c.configured) return NOT_ON;
  const [body, mac] = String(state || '').split('.');
  if (!body || !mac) return { ok: false, code: 'BAD_STATE' };
  const want = sign(body, c.clientSecret);
  const a = Buffer.from(mac), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, code: 'BAD_STATE' };
  let p; try { p = JSON.parse(unb64u(body).toString('utf8')); } catch { return { ok: false, code: 'BAD_STATE' }; }
  if (!p || typeof p.e !== 'number' || now > p.e) return { ok: false, code: 'STATE_EXPIRED' };
  if (p.v !== vendorId || p.s !== sessionId) return { ok: false, code: 'STATE_NOT_YOURS' };
  return { ok: true, nonce: p.n };
}

function authorizeUrl(state, env = process.env) {
  const c = config(env); if (!c.configured) return NOT_ON;
  const q = new URLSearchParams({ response_type: 'code', client_id: c.clientId, redirect_uri: c.redirectUri, scope: 'read_write', state });
  return { ok: true, url: `${AUTH}/authorize?${q.toString()}` };
}

async function exchangeCode(code, deps = {}) {
  const c = config(deps.env || process.env); if (!c.configured) return NOT_ON;
  const r = await (deps.fetch || fetch)(`${AUTH}/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'authorization_code', code, redirect_uri: c.redirectUri, client_id: c.clientId, client_secret: c.clientSecret }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token || !j.razorpay_account_id) return { ok: false, code: 'EXCHANGE_FAILED' };
  return { ok: true, accessToken: j.access_token, refreshToken: j.refresh_token || null, accountId: j.razorpay_account_id, expiresIn: j.expires_in || null };
}

/** A payment link in HER account. amountRupees is whole rupees (0201 records whole rupees); Razorpay takes paise. */
async function createLink(accessToken, { amountRupees, description, referenceId, acceptPartial, notes }, deps = {}) {
  const c = config(deps.env || process.env); if (!c.configured) return NOT_ON;
  if (!Number.isInteger(amountRupees) || amountRupees <= 0) return { ok: false, code: 'BAD_AMOUNT' };
  const r = await (deps.fetch || fetch)(`${API}/payment_links`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ amount: amountRupees * 100, currency: 'INR', accept_partial: !!acceptPartial, description,
      reference_id: referenceId, notes: notes || {} }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.id || !j.short_url) return { ok: false, code: 'LINK_FAILED' };
  return { ok: true, linkId: j.id, shortUrl: j.short_url };
}

/** The door's own signature check: HMAC-SHA256 of the exact raw body with PAY-A's OWN webhook secret only. */
function verifyWebhook(rawBody, signature, env = process.env) {
  const c = config(env); if (!c.configured) return false;
  if (!rawBody || !signature) return false;
  const want = crypto.createHmac('sha256', c.webhookSecret).update(rawBody).digest('hex');
  const a = Buffer.from(String(signature)), b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { KEYS, config, NOT_ON, STATE_TTL_MS, makeState, readState, authorizeUrl, exchangeCode, createLink, verifyWebhook };
