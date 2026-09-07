// src/lib/vendor/googleOAuth.js
// TDW · BLOCK 19 · G3.1 sitting 2 — THE GOOGLE GRANT, ONE PROJECT, TWO ROOMS.
//
// The founder ruled one Google project for the estate: this door grants
// `siteverification` + `webmasters.readonly` today (Your website & SEO), and
// G2 s2 adds its Business Profile scope to the SAME row on 10-27 — the vendor
// taps Connect Google once, in whichever room she reaches first.
//
// PRECEDENT: igOAuth.js. Same shape, same laws —
//   · the callback path is a CONSTANT here and `isConfigured()` asserts the
//     founder's GOOGLE_OAUTH_REDIRECT_URI ends with it (F-40.255's cure — a URI
//     that drifts from the mounted route fails at config, not at Google);
//   · the state is signed + short-TTL + single-use. The mint/verify kit is
//     igOAuth's, REQUIRED, not copied (one home). Its HMAC key is IG_APP_SECRET
//     by igOAuth's own reasoning (stateSecret()); that is a shared blast radius
//     the estate already carries, recorded here rather than hidden;
//   · the secret never appears in a log line.
//
// ⚠ THE CALLBACK IS A GET. The stub at solutions/index.js:439 said POST; a
// browser redirect from Google is a GET with `code` and `state` in the query,
// exactly as ig.js:107 receives Meta's. F-40.255.

'use strict';

const igOAuth = require('./igOAuth');

// ── THE CANONICAL CALLBACK PATH ──────────────────────────────────────────────
// core.js:89 mounts solutions at '/solutions'; solutions/index.js mounts this
// router at '/google'; the route below is '/callback'. Change any one and
// `isConfigured()` goes false — that is the assertion doing its job.
const GOOGLE_CALLBACK_PATH = '/api/v2/vendor/solutions/google/callback';

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL     = 'https://oauth2.googleapis.com/token';
const USERINFO_URL  = 'https://openidconnect.googleapis.com/v1/userinfo';
const REVOKE_URL    = 'https://oauth2.googleapis.com/revoke';

// openid + email so the room can say "connected as …"; the two Search Console
// scopes are the founder's ruling. G2 s2 APPENDS its scope here — one string,
// one home — and re-consent is Google's own `include_granted_scopes` behaviour.
// F-40.261 (a): the house grant is the founder's own account, owner of the
// domain property. The callback stores a grant as the HOUSE row only when
// Google itself says the signed-in account is this one — the email is the
// gate, and only the founder can sign in as it. One constant, one home.
const HOUSE_GOOGLE_EMAIL = 'dev@thedreamwedding.in';
const HOUSE_SC_PROPERTY  = 'sc-domain:thedreamwedding.in';
// The vendorId a house state is minted for; never a vendor's id.
const HOUSE_STATE_ID = 'house';

const GOOGLE_SCOPE = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',   // infra note item 13: the consent screen names it in full
  'https://www.googleapis.com/auth/siteverification',
  'https://www.googleapis.com/auth/webmasters.readonly',
].join(' ');

function redirectUri() { return process.env.GOOGLE_OAUTH_REDIRECT_URI || ''; }

let _pathWarnedFor = null;
function isConfigured() {
  const haveKeys = Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
  const uri = redirectUri();
  if (!haveKeys || !uri) return false;
  let ok = false;
  try { ok = new URL(uri).pathname === GOOGLE_CALLBACK_PATH; } catch { ok = false; }
  if (!ok && _pathWarnedFor !== uri) {
    _pathWarnedFor = uri;
    console.warn(`[googleOAuth] GOOGLE_OAUTH_REDIRECT_URI path is not ${GOOGLE_CALLBACK_PATH}; the door stays closed.`);
  }
  return ok;
}

function authorizeUrl(state) {
  const q = new URLSearchParams({
    client_id:              process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    redirect_uri:           redirectUri(),
    response_type:          'code',
    scope:                  GOOGLE_SCOPE,
    access_type:            'offline',       // a refresh token, so the nightly pull needs no vendor
    prompt:                 'consent',       // Google only returns a refresh token on consent
    include_granted_scopes: 'true',          // G2 s2's scope joins without revoking this one
    state,
  });
  return `${AUTHORIZE_URL}?${q.toString()}`;
}

function googleRefusal(where, res, body) {
  const code = body && (body.error_description || body.error);
  return { ok: false, error: `Google refused the ${where} (${res.status}${code ? `, ${String(code).slice(0, 80)}` : ''}).`, http_status: res.status };
}

/** code → { access_token, refresh_token, scope, id_token }. */
async function exchangeCode(code) {
  const form = new URLSearchParams({
    client_id:     process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    grant_type:    'authorization_code',
    code,
    redirect_uri:  redirectUri(),
  });
  const res  = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() });
  const body = await res.json().catch(() => null);
  if (!res.ok) return googleRefusal('sign-in', res, body);
  if (!body || !body.access_token) return { ok: false, error: 'Google returned an incomplete sign-in.' };
  // No refresh token means Google reused a prior consent; the grant cannot
  // outlive this hour and must not be stored as if it could.
  if (!body.refresh_token) return { ok: false, error: 'Google did not return a refresh token; the vendor must re-consent.' };
  return { ok: true, accessToken: body.access_token, refreshToken: body.refresh_token, scope: body.scope || GOOGLE_SCOPE };
}

/** refresh_token → a fresh access token, or a refusal. */
async function refreshAccess(refreshToken) {
  const form = new URLSearchParams({
    client_id:     process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    grant_type:    'refresh_token',
    refresh_token: refreshToken,
  });
  const res  = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() });
  const body = await res.json().catch(() => null);
  if (!res.ok) return googleRefusal('refresh', res, body);
  if (!body || !body.access_token) return { ok: false, error: 'Google returned no access token on refresh.' };
  return { ok: true, accessToken: body.access_token, expiresIn: body.expires_in || 3600 };
}

/** Who granted — `sub` and `email`, for the room's "connected as" line. */
async function fetchIdentity(accessToken) {
  const res  = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || !body.sub) return { ok: false, error: `Google identity read failed (${res.status}).` };
  return { ok: true, sub: String(body.sub), email: body.email || null };
}

/** Best-effort revoke; a refusal is logged by the caller, never surfaced as a failure to disconnect. */
async function revoke(token) {
  try {
    const res = await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: 'POST' });
    return { ok: res.ok, http_status: res.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

module.exports = {
  GOOGLE_CALLBACK_PATH, GOOGLE_SCOPE, HOUSE_GOOGLE_EMAIL, HOUSE_SC_PROPERTY, HOUSE_STATE_ID,
  isConfigured, authorizeUrl, exchangeCode, refreshAccess, fetchIdentity, revoke,
  // igOAuth's kit, re-exported so the router has one require and the state
  // stays one home.
  mintState: igOAuth.mintState, verifyState: igOAuth.verifyState,
};
