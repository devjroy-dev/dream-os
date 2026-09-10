// src/api/vendor/solutions/google.js
// TDW · BLOCK 19 · G3.1 sitting 2 — THE GOOGLE DOOR (index.js's P1 stub, opened).
//
// Mounted by index.js at '/google', under core.js's '/solutions', so the six
// addresses are /api/v2/vendor/solutions/google/…:
//
//   GET  /connect     → { authorize_url }   mints the state, arms it, hands
//                                           the room Google's page to open
//   GET  /callback    ← Google              F-40.255: a GET (ig.js:107's shape),
//                                           no auth header — the STATE is the
//                                           auth. Redirects back to the room.
//   GET  /status      → GoogleGrant         connected? as whom? which property?
//   GET  /report      → SeoWindows          R-40.123's two named windows, five
//                                           queries, has_data (F-40.138)
//   POST /sync        → { ok, days, queries } pulls Search Console now
//   POST /disconnect  → GoogleGrant         revokes at Google, deletes the row
//
// THE GATE, FIRST LINE OF EVERY HANDLER (the stub's own uncomment step):
// `googleOAuth.isConfigured()` — the three founder keys on Railway plus a
// redirect URI whose path IS the mounted route. Closed → 503, one code, the
// room shows the byte the veto sheet holds for it. Quota (`GBP_QUOTA_APPROVED`)
// is G2's second gate and does not touch Search Console; it is not read here.
//
// NO TOKEN IN ANY RESPONSE. `getStatus` selects SAFE_COLUMNS; the only reader
// of the ciphertext is searchConsole.pull, and it does not answer HTTP.

'use strict';

const express = require('express');
const router  = express.Router();

const requireAuth   = require('../../middleware/requireAuth');
const resolveVendor = require('../../middleware/resolveVendor');
const asyncHandler  = require('../../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../../lib/response');

const gOAuth = require('../../../lib/vendor/googleOAuth');
const gConn  = require('../../../lib/vendor/googleConnection');
const sc     = require('../../../lib/vendor/searchConsole');

// The room's own address. PWA_BASE_URL is ig.js:45's variable — one name.
const PWA_BASE    = process.env.PWA_BASE_URL || 'https://thedreamwedding.in';
const RETURN_PATH = require('../../../lib/pwaPaths').vendorPath('yourWebsite'); // F-42.192 · R-40.132's room; b45 E
function backToRoom(res, params) { return res.redirect(`${PWA_BASE}${RETURN_PATH}?${new URLSearchParams(params).toString()}`); }

const NOT_ON = (res) => errRes(res, 503, 'Google connection is not switched on yet.', 'GOOGLE_NOT_CONFIGURED');

function grantShape(row) {
  return {
    connected:      Boolean(row),
    email:          row ? row.google_email   : null,
    scope:          row ? row.scope          : null,
    connected_at:   row ? row.connected_at   : null,
    last_synced_at: row ? row.last_synced_at : null,
    property:       row ? row.sc_property    : null,
  };
}

// ── GET /connect ─────────────────────────────────────────────────────────────
// `?house=1` mints a HOUSE state (F-40.261). Any signed-in vendor may ask; the
// callback keeps it only if Google says the account is HOUSE_GOOGLE_EMAIL, so
// the gate is Google's sign-in, not a flag a client can set.
router.get('/connect', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  if (!gOAuth.isConfigured()) return NOT_ON(res);
  const supabase = req.app.locals.supabase;
  const house = String(req.query.house || '') === '1';
  const owner = house ? gConn.HOUSE : req.vendor.id;
  const { state, nonce } = gOAuth.mintState(house ? gOAuth.HOUSE_STATE_ID : req.vendor.id);
  const armed = await gConn.armState(supabase, owner, nonce);
  if (!armed.ok) return errRes(res, 500, armed.error);
  return okRes(res, { authorize_url: gOAuth.authorizeUrl(state) });
}));

// ── GET /callback ← Google ───────────────────────────────────────────────────
router.get('/callback', asyncHandler(async (req, res) => {
  if (!gOAuth.isConfigured()) return backToRoom(res, { google: 'failed', reason: 'off' });
  const supabase = req.app.locals.supabase;
  const { code, state, error: gErr } = req.query;

  if (gErr) { console.warn('[google:callback] declined:', String(gErr)); return backToRoom(res, { google: 'cancelled' }); }
  if (!code || !state) return backToRoom(res, { google: 'failed', reason: 'incomplete' });

  const v = gOAuth.verifyState(String(state));
  if (!v.ok) { console.warn('[google:callback] state rejected:', v.error); return backToRoom(res, { google: 'failed', reason: 'expired' }); }

  const house = v.vendorId === gOAuth.HOUSE_STATE_ID;
  const owner = house ? gConn.HOUSE : v.vendorId;
  const spent = await gConn.spendState(supabase, owner, v.nonce);
  if (!spent.ok) { console.warn('[google:callback] state not spendable for vendor', v.vendorId); return backToRoom(res, { google: 'failed', reason: 'replay' }); }

  const ex = await gOAuth.exchangeCode(String(code));
  if (!ex.ok) { console.warn('[google:callback] exchange refused:', ex.error); return backToRoom(res, { google: 'failed', reason: 'exchange' }); }

  const who = await gOAuth.fetchIdentity(ex.accessToken);
  if (!who.ok) console.warn('[google:callback] identity read failed, continuing:', who.error);
  if (house && !(who.ok && String(who.email || '').toLowerCase() === gOAuth.HOUSE_GOOGLE_EMAIL)) {
    // A house state completed by any other account is refused — nothing stored.
    console.warn('[google:callback] house grant refused: account is not the house account');
    return backToRoom(res, { google: 'failed', reason: 'not_house' });
  }

  let saved;
  try {
    saved = await gConn.saveGrant(supabase, owner, { sub: who.ok ? who.sub : null, email: who.ok ? who.email : null, scope: ex.scope, refreshToken: ex.refreshToken });
  } catch (e) {
    // vault.seal threw: INTEGRATION_TOKEN_KEY absent or malformed. The grant is
    // NOT stored in clear; the vendor sees "failed" and the log names the key.
    console.error('[google:callback] grant not stored — INTEGRATION_TOKEN_KEY:', e.message);
    return backToRoom(res, { google: 'failed', reason: 'vault' });
  }
  if (!saved.ok) { console.error('[google:callback] save failed:', saved.error); return backToRoom(res, { google: 'failed', reason: 'save' }); }
  if (house) { const p = await gConn.setProperty(supabase, gConn.HOUSE, gOAuth.HOUSE_SC_PROPERTY); if (!p.ok) console.warn('[google:callback] house property not set:', p.error); }
  return backToRoom(res, { google: house ? 'house_connected' : 'connected' });
}));

// ── GET /status ──────────────────────────────────────────────────────────────
router.get('/status', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const st = await gConn.getStatus(req.app.locals.supabase, req.vendor.id);
  if (!st.ok) return errRes(res, 500, st.error);
  const h = await gConn.houseId(req.app.locals.supabase);
  return okRes(res, { configured: gOAuth.isConfigured(), house_connected: Boolean(h.ok && h.id), ...grantShape(st.row) });
}));

// ── GET /report ──────────────────────────────────────────────────────────────
// Reads 0147's rows only. `has_data:false` while connected is the
// "Google reports in a few days — come back after the weekend" state.
router.get('/report', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const st = await gConn.getStatus(supabase, req.vendor.id);
  if (!st.ok) return errRes(res, 500, st.error);
  const rep = await sc.report(supabase, req.vendor.id);
  if (!rep.ok) return errRes(res, 500, rep.error);
  return okRes(res, { connected: Boolean(st.row), ...rep });
}));

// ── POST /sync ───────────────────────────────────────────────────────────────
router.post('/sync', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  if (!gOAuth.isConfigured()) return NOT_ON(res);
  // `arm=own` reads her own domain through her grant (P2); default is the house arm for /v/.
  const arm = String(req.query.arm || '') === 'own' ? 'own' : 'house';
  const out = await sc.pull(req.app.locals.supabase, req.vendor.id, { arm, handle: req.vendor.routing_handle });
  if (!out.ok) {
    if (out.reason === 'no_house')      return errRes(res, 409, 'The house Google connection is not made yet.', 'GOOGLE_NO_HOUSE');
    if (out.reason === 'not_connected') return errRes(res, 409, 'Google is not connected.', 'GOOGLE_NOT_CONNECTED');
    if (out.reason === 'no_property')   return errRes(res, 409, 'No Search Console property is set for this domain yet.', 'GOOGLE_NO_PROPERTY');
    return errRes(res, 502, out.error || 'The pull failed.', 'GOOGLE_PULL_FAILED');
  }
  return okRes(res, out);
}));

// ── POST /disconnect ─────────────────────────────────────────────────────────
router.post('/disconnect', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const tok = await gConn.openRefreshToken(supabase, req.vendor.id);
  if (tok.ok) { const r = await gOAuth.revoke(tok.refreshToken); if (!r.ok) console.warn('[google:disconnect] revoke did not succeed; deleting anyway'); }
  const gone = await gConn.disconnect(supabase, req.vendor.id);
  if (!gone.ok) return errRes(res, 500, gone.error);
  return okRes(res, { configured: gOAuth.isConfigured(), ...grantShape(null) });
}));

module.exports = router;
