'use strict';
// src/lib/ownNumber/token.js · CE-46 · G6-2 · 2b · HER BUSINESS TOKEN, FETCHED WHEN NEEDED, NEVER STORED (F2, T-c, ruled).
//
// THE READ (27 September 2026 IST), quoted in this cut's handover with its date:
//   · Access Tokens Guide: a Tech Provider uses a Business Integration System User token ("business token"),
//     scoped to one onboarded customer. So TDW does not send on her number with its own system token (T-a refused).
//   · Hosted Embedded Signup, Step 5: her business token is fetched server to server by
//       POST /<version>/<HER business portfolio id>/system_user_access_tokens
//       Authorization: Bearer <TDW's system token>
//       appsecret_proof=<HMAC-SHA256 of TDW's system token, keyed by the app secret>, fetch_only=true
//     and the answer carries { access_token }.
//
// HER PORTFOLIO ID is vendor_wabas.business_id (NOT NULL since 0171; connect.js: "it is how 2b re-fetches her token").
// TDW'S SYSTEM TOKEN is META_WABA_TOKEN, the estate's one Meta token (src/lib/metaCloud.js resolveConfig). Whether it is
// a system-user token of TDW's portfolio with business_management is the founder's debugger read, owed before the walk.
//
// NEVER STORED: the token lives in this process's memory for CACHE_MS, keyed by vendor, and is written to no table and
// no log line. A failed fetch throws a TokenError carrying Meta's message (R-40.92); the caller records and stays silent.
const crypto = require('crypto');
const { graphVersion } = require('./meta');

const GRAPH = 'https://graph.facebook.com';
const CACHE_MS = 60_000; // wabaMap.js's doctrine; the token itself is long-lived, the cache only saves a Graph call
const cache = new Map(); // vendor_id -> { at, token }

class TokenError extends Error {
  constructor(message, status) { super(message); this.name = 'TokenError'; this.status = status || null; }
}

function _reset() { cache.clear(); }

/** Pure: Meta's appsecret_proof, HMAC-SHA256 keyed by the app secret over the system token, hex. */
function appsecretProof(systemToken, appSecret) {
  return crypto.createHmac('sha256', String(appSecret)).update(String(systemToken)).digest('hex');
}

async function businessTokenFor(row, { env = process.env, fetchImpl = fetch, now = Date.now } = {}) {
  const vendorId = row && row.vendor_id;
  const businessId = row && row.business_id;
  if (!vendorId || !businessId) throw new TokenError('no business id on her number');
  const hit = cache.get(vendorId);
  if (hit && now() - hit.at < CACHE_MS) return hit.token;
  const systemToken = env.META_WABA_TOKEN;
  const appSecret = env.META_APP_SECRET;
  if (!systemToken || !appSecret) throw new TokenError('META_WABA_TOKEN or META_APP_SECRET is not set on this service');
  const body = new URLSearchParams({ appsecret_proof: appsecretProof(systemToken, appSecret), fetch_only: 'true' });
  const res = await fetchImpl(`${GRAPH}/${graphVersion(env)}/${encodeURIComponent(businessId)}/system_user_access_tokens`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${systemToken}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  let parsed = null;
  try { parsed = await res.json(); } catch (_e) { parsed = null; }
  if (!res || !res.ok || !parsed || typeof parsed.access_token !== 'string' || !parsed.access_token) {
    const m = parsed && parsed.error && parsed.error.message ? parsed.error.message : `HTTP ${res && res.status}`;
    throw new TokenError(`business token fetch: ${m}`, res && res.status);
  }
  cache.set(vendorId, { at: now(), token: parsed.access_token });
  return parsed.access_token;
}

module.exports = { businessTokenFor, appsecretProof, TokenError, CACHE_MS, _reset };
