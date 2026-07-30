// src/lib/vendor/igOAuth.js
// TDW_07 P4a — THE INSTAGRAM OAUTH LEG.
//
// Governed by docs/specs/TDW_07_IG_IMPORT_ADDENDUM.md (founder-ruled 2026-07-23,
// banked at CE-62) and the fifteenth chair's P4 ruling (F2 · F3, 2026-07-29).
//
// ── WHAT THIS FILE IS FOR ────────────────────────────────────────────────────
// P3 shipped the mirror with its Meta leg DECLARED UNKNOWN (U-1..U-5 in
// igImport.js). This file settles U-1, U-2 and part of U-3 with values derived
// from Meta's own current documentation at authoring rather than recalled, and
// it is the ONE home for every Instagram network call that carries a secret.
//
// ── F-07.23 · MY CORRECTION WAS THE ERROR. RECORDED IN FULL. ────────────────
// The P4 charter's §D gave the authorize host as `instagram.com/oauth/authorize`.
// At read-first I "corrected" it to `api.instagram.com/oauth/authorize`, filed
// that as chair correction №5, benched it at §7.2, and wrote a mutation (N-9)
// that reddened if anyone changed it back. THE CHARTER WAS CLOSER TO RIGHT THAN
// I WAS: it was missing only `www.`.
//
// META'S OWN DOCUMENTATION: `https://www.instagram.com/oauth/authorize` is the
// authorize endpoint. `api.instagram.com` serves the TOKEN EXCHANGE only.
//
// WHY THE WRONG VALUE LOOKED RIGHT FOR A WHOLE SITTING: api.instagram.com/oauth/
// authorize does not 404 — it 302s onward to www.instagram.com/consent/. So the
// desktop walk passed, the consent screen rendered, and the app id in the URL
// matched. A wrong value that WORKS is far more dangerous than one that fails,
// because nothing in the bench could see it: every cell asserted the constant
// against itself, which is the tautology class this sitting found three times
// elsewhere and did not think to look for HERE.
//
// WHAT IT COST: the founder's iOS walk failed with the Instagram app opening to
// a blank error. Apple suppresses Universal Links on JavaScript-initiated
// navigation — so `window.location.href` to Instagram is safe — but the SERVER
// 302 that our wrong host forced is a fresh navigation, unsuppressed, and the
// Instagram app claims www.instagram.com. The extra hop WAS the bug. Removing it
// removes the interception point.
//
// STATED AS A HYPOTHESIS, NOT A CURE: the mechanism is coherent and the value is
// correct by documentation either way, so this ships regardless of whether it
// fixes iOS. If the founder's next iOS walk still fails, the diagnosis is wrong
// and the next suspect is the consent page itself — and this comment should be
// amended rather than quietly left standing.
//
// ── THE SECRETS LAW, AT FULL WEIGHT ─────────────────────────────────────────
// IG_APP_SECRET and every access token are secrets. NOTHING in this file writes
// either into a log line, an error message, or a response body. Errors carry the
// HTTP status and Meta's own error CODE, never the request that produced them —
// because a request URL for the token exchange contains the secret as a query or
// body parameter, and "log the failing request" is how secrets reach log
// aggregators. If a secret is ever pasted anywhere, ROTATE AT ONCE; the founder
// walkthrough states this in his own words.
'use strict';

const crypto = require('crypto');

// ── THE CANONICAL CALLBACK PATH (F3, CE-ruled) ───────────────────────────────
// ONE home. src/api/vendor/core.js mounts the router at '/ig' under
// '/api/v2/vendor', and src/api/vendor/ig.js serves '/callback' — so the path
// below is the mount's arithmetic, not a second opinion about it. igImport's
// isConfigured() ASSERTS that IG_REDIRECT_URI ends with exactly this string.
//
// WHY THE ASSERTION EXISTS (the dead-control law applied to configuration):
// Meta matches the redirect_uri byte-for-byte against the value registered in
// the App Dashboard. A trailing slash, an http/https swap, or a stale path is a
// SILENT failure — Meta shows the vendor an error page and the estate never
// learns. Without the assertion, isConfigured() would return true on a config
// that cannot possibly work, arm the connect entry, and ship exactly the dead
// control F-07.13 was filed for.
const IG_CALLBACK_PATH = '/api/v2/vendor/ig/callback';

// ── THE WIRE VALUES (U-1, U-2 — settled) ─────────────────────────────────────
// Hosts are named constants and not inlined because the Instagram platform has
// moved them once already (Basic Display is dead), and the next reader must find
// one place to change rather than eleven — the F-05.20 class, which this estate
// has paid for.
const AUTHORIZE_URL   = 'https://www.instagram.com/oauth/authorize';
const TOKEN_URL       = 'https://api.instagram.com/oauth/access_token';
const GRAPH_HOST      = 'https://graph.instagram.com';

// ── LEAST PRIVILEGE IS LOAD-BEARING, NOT TIDINESS (P3 §9) ───────────────────
// ONE scope. Requesting a permission the App Review screencast does not visibly
// exercise is a documented rejection axis, and every extra scope is another
// use-case paragraph the founder must write and Meta must believe. The
// pre-2025 names (`business_basic`) were deprecated 2025-01-27; the current
// names are mandatory and this is the current name.
const IG_SCOPE = 'instagram_business_basic';

// ── TOKEN LIFECYCLE, DERIVED AND WRITTEN DOWN ───────────────────────────────
// short-lived  ≈ 1 hour, issued by the code exchange
// long-lived   = 60 days, issued by ig_exchange_token
// refresh      = ig_refresh_token, resets 60 days from the refresh
//
// TWO CONSTRAINTS Meta states that the F2 ruling did not price, recorded so the
// next reader inherits them rather than discovering them:
//   (1) a long-lived token can be refreshed only if it is AT LEAST 24 HOURS OLD
//       and has not yet expired.
//   (2) a token not refreshed within its 60 days EXPIRES and can never be
//       refreshed again — re-authorisation is the only path. That is H11's
//       state, and it is why H11 is a real screen and not decoration.
//
// The ruled refresh-on-use window is 7 days. DERIVATION, so nobody re-runs it:
// a token inside 7 days of expiry is ~53 days old, so constraint (1) is never
// binding on the ruled path. It is asserted anyway — a guard that only matters
// in a case you argued away is exactly the guard that catches the case you
// argued away wrongly.
const REFRESH_WINDOW_DAYS = 7;
const MIN_REFRESH_AGE_MS  = 24 * 60 * 60 * 1000;

// ── STATE: SIGNED · SINGLE-USE · VENDOR-BOUND · SHORT-TTL (F3, as proposed) ──
// The callback CANNOT carry the vendor JWT: it is a top-level browser navigation
// arriving from Instagram, not an XHR the pwa controls, so no Authorization
// header exists. THE STATE IS THE AUTHENTICATION. Each property earns its place:
//   signed      — an attacker cannot mint one; the HMAC key is the app secret
//   vendor-bound— the payload names the vendor, so a stolen code cannot be
//                 redeemed against a different portfolio
//   short-TTL   — a leaked state (browser history, referrer) dies in 10 minutes
//   single-use  — enforced in the DATABASE, not here: the nonce below is written
//                 to vendor_ig_connections at /authorize and NULLed at /callback,
//                 so a replayed state finds no nonce and is refused. Signature
//                 checks alone cannot make a token single-use; only a store can.
const STATE_TTL_MS = 10 * 60 * 1000;

function stateSecret() {
  // The app secret doubles as the HMAC key deliberately. A dedicated
  // IG_STATE_SECRET would be a FOURTH founder-set variable, and the self-arming
  // property (CE §B: the founder sets the vars and the entry appears with no
  // redeploy) is worth more than the separation here — the two secrets share a
  // blast radius already, since holding IG_APP_SECRET lets you mint tokens
  // outright and forging a state is strictly the lesser power.
  return process.env.IG_APP_SECRET || '';
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unb64url(s) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8');
}

function sign(payloadB64) {
  return b64url(crypto.createHmac('sha256', stateSecret()).update(payloadB64).digest());
}

/**
 * Mint a state. Returns { state, nonce, issuedAt } — the CALLER persists the
 * nonce against the vendor, which is what makes the state single-use.
 */
function mintState(vendorId) {
  const nonce    = crypto.randomBytes(16).toString('hex');
  const issuedAt = Date.now();
  const payload  = b64url(JSON.stringify({ v: vendorId, n: nonce, t: issuedAt }));
  return { state: `${payload}.${sign(payload)}`, nonce, issuedAt };
}

/**
 * Verify a state's SIGNATURE and TTL. Returns { ok, vendorId, nonce } or
 * { ok:false, error }. Single-use is NOT checked here — it cannot be, because
 * this function touches no database. The caller matches the nonce.
 */
function verifyState(state) {
  if (typeof state !== 'string' || !state.includes('.')) {
    return { ok: false, error: 'Malformed state.' };
  }
  const [payload, mac] = state.split('.');
  const expected = sign(payload);
  // Length-guard before timingSafeEqual: it THROWS on unequal lengths, and a
  // throw here would be a 500 where a 400 is the truth.
  if (mac.length !== expected.length) return { ok: false, error: 'Bad state signature.' };
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) {
    return { ok: false, error: 'Bad state signature.' };
  }
  let parsed;
  try { parsed = JSON.parse(unb64url(payload)); }
  catch { return { ok: false, error: 'Unreadable state payload.' }; }

  if (!parsed || !parsed.v || !parsed.n || !parsed.t) {
    return { ok: false, error: 'Incomplete state payload.' };
  }
  if (Date.now() - Number(parsed.t) > STATE_TTL_MS) {
    return { ok: false, error: 'This connection link expired. Please start again.' };
  }
  return { ok: true, vendorId: parsed.v, nonce: parsed.n };
}

/**
 * The authorize URL the vendor's browser is sent to (U-1, settled).
 */
function authorizeUrl(state) {
  const q = new URLSearchParams({
    client_id:     process.env.IG_APP_ID || '',
    redirect_uri:  process.env.IG_REDIRECT_URI || '',
    scope:         IG_SCOPE,
    response_type: 'code',
    state,
  });
  return `${AUTHORIZE_URL}?${q.toString()}`;
}

// A refusal shape shared by every network leg. Meta's error CODE travels; the
// request never does, because the request carries the secret.
function metaRefusal(where, res, body) {
  const code = body && body.error && (body.error.code || body.error.type);
  return {
    ok: false,
    error: `Instagram refused the ${where} (${res.status}${code ? `, ${code}` : ''}).`,
    http_status: res.status,
  };
}

/**
 * U-2, leg 1: the authorization code → a SHORT-LIVED token + the IG user id.
 * POST, form-urlencoded — the secret rides the body, never a query string, so it
 * does not land in any intermediary's access log.
 */
async function exchangeCode(code) {
  const form = new URLSearchParams({
    client_id:     process.env.IG_APP_ID || '',
    client_secret: process.env.IG_APP_SECRET || '',
    grant_type:    'authorization_code',
    code,
    redirect_uri:  process.env.IG_REDIRECT_URI || '',
  });

  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    form.toString(),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) return metaRefusal('sign-in', res, body);

  // `user_id` is the Instagram-SCOPED user id: stable for this app and this
  // vendor, and NOT the public @handle. Named so nobody later renders it.
  const token  = body && body.access_token;
  const userId = body && (body.user_id != null ? String(body.user_id) : null);
  if (!token || !userId) return { ok: false, error: 'Instagram returned an incomplete sign-in.' };
  return { ok: true, shortLivedToken: token, igUserId: userId };
}

/**
 * U-2, leg 2: SHORT-LIVED → LONG-LIVED (60 days).
 */
async function exchangeForLongLived(shortLivedToken) {
  const q = new URLSearchParams({
    grant_type:    'ig_exchange_token',
    client_secret: process.env.IG_APP_SECRET || '',
    access_token:  shortLivedToken,
  });
  const res  = await fetch(`${GRAPH_HOST}/access_token?${q.toString()}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) return metaRefusal('token exchange', res, body);

  const token     = body && body.access_token;
  const expiresIn = body && Number(body.expires_in);
  if (!token || !Number.isFinite(expiresIn)) {
    return { ok: false, error: 'Instagram returned an incomplete token.' };
  }
  return { ok: true, accessToken: token, expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString() };
}

/**
 * Refresh a long-lived token. Resets 60 days from the moment of the refresh.
 */
async function refreshLongLived(accessToken) {
  const q = new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: accessToken });
  const res  = await fetch(`${GRAPH_HOST}/refresh_access_token?${q.toString()}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) return metaRefusal('token refresh', res, body);

  const token     = body && body.access_token;
  const expiresIn = body && Number(body.expires_in);
  if (!token || !Number.isFinite(expiresIn)) {
    return { ok: false, error: 'Instagram returned an incomplete refreshed token.' };
  }
  return { ok: true, accessToken: token, expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString() };
}

/**
 * REFRESH-ON-USE (F2, CE-ruled). Pure decision, no I/O — so the bench can prove
 * every branch by execution rather than by reading the caller.
 *
 * Returns 'expired' | 'refresh' | 'ok'. 'expired' is H11's state and is
 * DELIBERATELY not 'refresh': Meta cannot refresh a dead token, and trying would
 * turn an honest "connect again" into a confusing failure.
 */
function refreshDecision({ expiresAt, connectedAt, now = Date.now() }) {
  const exp = expiresAt ? Date.parse(expiresAt) : NaN;
  if (!Number.isFinite(exp)) return 'expired';
  if (exp <= now) return 'expired';

  const daysLeft = (exp - now) / (24 * 60 * 60 * 1000);
  if (daysLeft > REFRESH_WINDOW_DAYS) return 'ok';

  // Constraint (1): at least 24 hours old. Unreachable on the ruled window by
  // the derivation in the header — asserted regardless.
  const born = connectedAt ? Date.parse(connectedAt) : NaN;
  if (Number.isFinite(born) && (now - born) < MIN_REFRESH_AGE_MS) return 'ok';

  return 'refresh';
}

module.exports = {
  IG_CALLBACK_PATH,
  IG_SCOPE,
  AUTHORIZE_URL,
  TOKEN_URL,
  GRAPH_HOST,
  STATE_TTL_MS,
  REFRESH_WINDOW_DAYS,
  mintState,
  verifyState,
  authorizeUrl,
  exchangeCode,
  exchangeForLongLived,
  refreshLongLived,
  refreshDecision,
};
