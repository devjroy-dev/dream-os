'use strict';
// src/lib/ads/oauth.js · CE-46 · ADS-1 · cut 1 · THE ADS CONNECT'S ADDRESS AND ITS STATE, ONE HOME.
//
// The second Meta app (TDW ADS, 4570863996490339, portfolio 995204059832918), Facebook Login for Business with the
// configuration TDW Ads Vendor (1863002924861430): General, User access token, permissions ads_management, ads_read,
// pages_read_engagement, pages_show_list (created by the founder, 28 September 2026, witnessed in his chat). With a
// user token the configuration carries NO assets (Meta's words on the form; c-46.15): she chooses her Pages and ad
// accounts on Meta's own screen, and the room reads them after.
//
// The authorize address: https://www.facebook.com/<v>/dialog/oauth?client_id&redirect_uri&config_id&state
//   &response_type=code&override_default_response_type=true   (Facebook Login for Business, read 27 September).
// The redirect is the vendor service's own domain, read from ADS_REDIRECT_URI as IG_REDIRECT_URI is (the chair's
// correction of 28 September; F-44.209's class: never a Railway default).
//
// THE STATE, as igOAuth.js mints it (HMAC over a base64url payload, 10-minute TTL, the NONCE persisted by the caller
// on vendor_ad_connections.pending_state_nonce, which is what makes it single-use). The key is ADS_APP_SECRET, the
// same reasoning igOAuth.js gives for IG_APP_SECRET: a separate state secret would be one more founder-set variable,
// and holding the app secret is already the greater power.
//
// iPHONE (F-44.235, the founder's "ok to the line", 28 September): the room renders this address as a PRE-MINTED
// <a href> with no await between the tap and the navigation, and in iOS standalone the H19-shaped line tells her to
// press and hold. Nothing here navigates; it only mints.
const crypto = require('crypto');

const ADS_CALLBACK_PATH = '/api/v2/vendor/ads/callback';
const STATE_TTL_MS = 10 * 60 * 1000;
const graphVersion = (env = process.env) => env.ADS_GRAPH_VERSION || 'v25.0';

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(s) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8');
}
function sign(payloadB64, env = process.env) {
  return b64url(crypto.createHmac('sha256', env.ADS_APP_SECRET || '').update(payloadB64).digest());
}

/** Every variable the connect needs; the door says "not switched on" rather than mint a broken address. */
function configured(env = process.env) {
  return Boolean(env.ADS_APP_ID && env.ADS_APP_SECRET && env.ADS_CONFIG_ID && env.ADS_REDIRECT_URI);
}

/** Mint a state. The CALLER persists `nonce` on her connection row; the callback matches it once. */
function mintState(vendorId, env = process.env, now = Date.now()) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = b64url(JSON.stringify({ v: vendorId, n: nonce, t: now, k: 'ads' }));
  return { state: `${payload}.${sign(payload, env)}`, nonce, issuedAt: now };
}

/** Signature, kind and TTL only; the single-use match is the caller's (it needs the database). */
function verifyState(state, env = process.env, now = Date.now()) {
  if (typeof state !== 'string' || !state.includes('.')) return { ok: false, error: 'Malformed state.' };
  const [payload, mac] = state.split('.');
  const expected = sign(payload, env);
  if (!mac || mac.length !== expected.length) return { ok: false, error: 'Bad state signature.' };
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return { ok: false, error: 'Bad state signature.' };
  let p;
  try { p = JSON.parse(unb64url(payload)); } catch (_e) { return { ok: false, error: 'Unreadable state payload.' }; }
  if (!p || !p.v || !p.n || !p.t || p.k !== 'ads') return { ok: false, error: 'Incomplete state payload.' };
  if (now - Number(p.t) > STATE_TTL_MS) return { ok: false, error: 'This connection link expired. Please start again.' };
  return { ok: true, vendorId: p.v, nonce: p.n };
}

function authorizeUrl(state, env = process.env) {
  const q = new URLSearchParams({
    client_id: env.ADS_APP_ID || '',
    redirect_uri: env.ADS_REDIRECT_URI || '',
    config_id: env.ADS_CONFIG_ID || '',
    state,
    response_type: 'code',
    override_default_response_type: 'true',
  });
  return `https://www.facebook.com/${graphVersion(env)}/dialog/oauth?${q.toString()}`;
}

module.exports = { ADS_CALLBACK_PATH, STATE_TTL_MS, graphVersion, configured, mintState, verifyState, authorizeUrl };
