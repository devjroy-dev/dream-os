'use strict';
// src/lib/ownNumber/meta.js · CE-45 · G6-1 · 2a · EVERY GRAPH CALL OF THE OWN-NUMBER ONBOARDING, ONE HOME.
// Read on 2026-09-24 from Meta's Embedded Signup pages (read-first (iii); FE_1 read-first M1 to M5):
//   code exchange   GET  /<v>/oauth/access_token?client_id&client_secret&code   (the code lives 30 seconds)
//   her number      GET  /<v>/<WABA_ID>/phone_numbers
//   subscribe       POST /<v>/<WABA_ID>/subscribed_apps
//   register        POST /<v>/<PNID>/register { messaging_product:'whatsapp', pin }    (MOVED way only)
//   sync            POST /<v>/<PNID>/smb_app_data { messaging_product:'whatsapp', sync_type } (SHARED way,
//                   within 24 hours, once each: 'smb_app_state_sync' then 'history')
// Server to server only, as Meta requires. `fetch` is injected so the rung never reaches Meta.
// Her token is an ARGUMENT, never stored: it lives for the one connect call (read-first F3, FK5).
const crypto = require('crypto');

const GRAPH = 'https://graph.facebook.com';
const graphVersion = (env = process.env) => env.META_GRAPH_VERSION || 'v25.0';

/** A Graph failure carried as a value. `expired` is set when Meta says the code is spent or stale. */
class MetaError extends Error {
  constructor(step, status, body) {
    const m = body && body.error && body.error.message ? body.error.message : `HTTP ${status}`;
    super(`${step}: ${m}`);
    this.step = step; this.status = status; this.body = body;
    this.expired = step === 'exchange' && /expire|already been used|invalid verification code/i.test(m);
  }
}

async function call(fetchImpl, step, url, init) {
  const res = await fetchImpl(url, init);
  let body = null;
  try { body = await res.json(); } catch (_e) { body = null; }
  if (!res.ok || (body && body.error)) throw new MetaError(step, res.status, body);
  return body;
}

function exchangeCode({ code, appId, appSecret, env, fetchImpl }) {
  const q = new URLSearchParams({ client_id: appId, client_secret: appSecret, code });
  return call(fetchImpl, 'exchange', `${GRAPH}/${graphVersion(env)}/oauth/access_token?${q}`, { method: 'GET' })
    .then((b) => {
      const t = b && typeof b.access_token === 'string' ? b.access_token : null;
      if (!t) throw new MetaError('exchange', 200, { error: { message: 'no access_token in the answer' } });
      return t;
    });
}

function phoneNumbers({ wabaId, token, env, fetchImpl }) {
  return call(fetchImpl, 'phone_numbers', `${GRAPH}/${graphVersion(env)}/${encodeURIComponent(wabaId)}/phone_numbers`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    .then((b) => (b && Array.isArray(b.data) ? b.data : []));
}

function subscribe({ wabaId, token, env, fetchImpl }) {
  return call(fetchImpl, 'subscribe', `${GRAPH}/${graphVersion(env)}/${encodeURIComponent(wabaId)}/subscribed_apps`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
}

function register({ phoneNumberId, token, pin, env, fetchImpl }) {
  return call(fetchImpl, 'register', `${GRAPH}/${graphVersion(env)}/${encodeURIComponent(phoneNumberId)}/register`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', pin }) });
}

function smbSync({ phoneNumberId, token, syncType, env, fetchImpl }) {
  return call(fetchImpl, `sync:${syncType}`, `${GRAPH}/${graphVersion(env)}/${encodeURIComponent(phoneNumberId)}/smb_app_data`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', sync_type: syncType }) });
}

/**
 * THE TWO-STEP PIN, DERIVED AND NEVER STORED (read-first F3, ruled). Six digits from
 * HMAC-SHA256(app secret, PNID): the same number re-derives the same PIN for a re-register, and
 * nothing secret sits in a table. No secret -> null, and the caller refuses rather than guessing.
 */
function pinFor(phoneNumberId, appSecret) {
  if (!appSecret || !phoneNumberId) return null;
  const h = crypto.createHmac('sha256', String(appSecret)).update(String(phoneNumberId)).digest();
  return String(h.readUInt32BE(0) % 1000000).padStart(6, '0');
}

module.exports = { MetaError, exchangeCode, phoneNumbers, subscribe, register, smbSync, pinFor, graphVersion };
