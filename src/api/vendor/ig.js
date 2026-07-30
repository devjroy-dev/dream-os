// src/api/vendor/ig.js
// TDW_07 P4a — THE INSTAGRAM CONNECT ACTION.
// Mounted at /api/v2/vendor/ig by src/api/vendor/core.js.
//
//   GET    /api/v2/vendor/ig/status      — connection state (auth: vendor JWT)
//   GET    /api/v2/vendor/ig/authorize   — mint state, return the Instagram URL
//   GET    /api/v2/vendor/ig/callback    — Meta's redirect  ** NO JWT — see below **
//   GET    /api/v2/vendor/ig/media       — the vendor's Instagram photos
//   POST   /api/v2/vendor/ig/import      — mirror the picked photos
//   DELETE /api/v2/vendor/ig/disconnect  — drop the connection
//
// ── WHY /callback CARRIES NO requireAuth, AND WHY THAT IS NOT A HOLE ────────
// The callback is a TOP-LEVEL BROWSER NAVIGATION issued by Instagram. It is not
// an XHR the pwa controls, so there is no Authorization header to send and no
// cookie the estate can rely on across a cross-site redirect. Bolting
// requireAuth on would not make it safer — it would make it not work, and the
// cure would be some worse thing involving a token in a query string.
//
// THE STATE IS THE AUTHENTICATION, and it is stronger here than a session would
// be, because it is bound to ONE vendor, ONE attempt, and TEN MINUTES:
//   · signed with the app secret        → cannot be minted by an attacker
//   · vendor-bound in the payload       → a stolen code cannot be redeemed
//                                          against a different vendor's portfolio
//   · single-use via the stored nonce   → a replay finds a null nonce
//   · 10-minute TTL                     → a leaked state dies quickly
// F3's ruling, built as ruled.
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

const igImport = require('../../lib/vendor/igImport');
const igOAuth  = require('../../lib/vendor/igOAuth');
const igConn   = require('../../lib/vendor/igConnection');

// The pwa lives on a different origin from the API, so the callback cannot
// simply render — it must hand the browser back to the app. One home for that
// address, and a safe default so a missing variable lands the vendor somewhere
// real rather than on a blank page.
const PWA_BASE = process.env.PWA_BASE_URL || 'https://thedreamwedding.in';
const RETURN_PATH = '/vendor/portfolio';

function backToPortfolio(res, params) {
  const q = new URLSearchParams(params);
  return res.redirect(`${PWA_BASE}${RETURN_PATH}?${q.toString()}`);
}

// ── GET /status ──────────────────────────────────────────────────────────────
// The surface asks the server what is true. `ig_import_enabled` already flows
// through getDiscoverStatus; this door adds the per-vendor half.
router.get('/status', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const configured = igImport.isConfigured();
  if (!configured) {
    return okRes(res, { ig_import_enabled: false, connected: false });
  }
  const c = await igConn.getConnection(supabase, req.vendor.id);
  if (!c.ok) return errRes(res, 500, c.error);

  const conn = c.connection;
  // A row can exist with only a pending nonce (an abandoned connect). That is
  // NOT connected, and saying otherwise would render a "connected" chip over a
  // vendor who never finished — the estate's own costume class.
  const connected = Boolean(conn && conn.ig_user_id && conn.token_expires_at);
  const decision = connected
    ? igOAuth.refreshDecision({ expiresAt: conn.token_expires_at, connectedAt: conn.connected_at })
    : null;

  return okRes(res, {
    ig_import_enabled: true,
    connected,
    // `expired` is H11's state and travels as its own word so the pwa renders
    // "connect again" rather than a generic failure.
    connection_state: connected ? (decision === 'expired' ? 'expired' : 'live') : 'none',
    connected_at:     conn?.connected_at     || null,
    expires_at:       conn?.token_expires_at || null,
  });
}));

// ── GET /authorize ───────────────────────────────────────────────────────────
router.get('/authorize', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  if (!igImport.isConfigured()) {
    // The gate speaks the same refusal the surface's darkness already implies.
    return errRes(res, 503, 'Instagram import is not switched on yet.', 'IG_NOT_CONFIGURED');
  }
  const { state, nonce } = igOAuth.mintState(req.vendor.id);
  const armed = await igConn.armState(supabase, req.vendor.id, nonce);
  if (!armed.ok) return errRes(res, 500, armed.error);

  // The URL is returned rather than redirected: the pwa owns the navigation, so
  // it can show its own "taking you to Instagram" state and so this door stays
  // callable from a fetch with a Bearer header.
  return okRes(res, { authorize_url: igOAuth.authorizeUrl(state) });
}));

// ── GET /callback — Meta's redirect. NO JWT. The state authenticates. ───────
router.get('/callback', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { code, state, error: metaError, error_description: metaDesc } = req.query;

  // The vendor tapped Cancel on Instagram's consent screen. That is a CHOICE,
  // not a fault, and it must not read like a crash.
  if (metaError) {
    console.warn('[ig:callback] Instagram declined:', String(metaError), String(metaDesc || ''));
    return backToPortfolio(res, { ig: 'cancelled' });
  }
  if (!code || !state) return backToPortfolio(res, { ig: 'failed', reason: 'incomplete' });

  const v = igOAuth.verifyState(String(state));
  if (!v.ok) {
    console.warn('[ig:callback] state rejected:', v.error);
    return backToPortfolio(res, { ig: 'failed', reason: 'expired' });
  }

  // SINGLE-USE, SPENT BEFORE ANY TOKEN IS REQUESTED. If the exchange below then
  // fails, the state is already dead — so a failed attempt cannot be replayed,
  // which is the ordering that matters and the reason this is not one line lower.
  const spent = await igConn.spendState(supabase, v.vendorId, v.nonce);
  if (!spent.ok) {
    console.warn('[ig:callback] state not spendable for vendor', v.vendorId);
    return backToPortfolio(res, { ig: 'failed', reason: 'replay' });
  }

  const short = await igOAuth.exchangeCode(String(code));
  if (!short.ok) {
    console.warn('[ig:callback] code exchange refused:', short.error);
    return backToPortfolio(res, { ig: 'failed', reason: 'exchange' });
  }

  const long = await igOAuth.exchangeForLongLived(short.shortLivedToken);
  if (!long.ok) {
    console.warn('[ig:callback] long-lived exchange refused:', long.error);
    return backToPortfolio(res, { ig: 'failed', reason: 'exchange' });
  }

  const saved = await igConn.saveToken(supabase, v.vendorId, {
    igUserId:    short.igUserId,
    accessToken: long.accessToken,
    expiresAt:   long.expiresAt,
  });
  if (!saved.ok) {
    console.error('[ig:callback] could not persist connection for vendor', v.vendorId, saved.error);
    return backToPortfolio(res, { ig: 'failed', reason: 'store' });
  }

  // Not one token byte in this line. The vendor id and the fact of success.
  console.log('[ig:callback] connected vendor', v.vendorId, 'ig_user', short.igUserId);
  return backToPortfolio(res, { ig: 'connected' });
}));

/**
 * REFRESH-ON-USE (F2, CE-ruled). Every door that needs a token comes through
 * here, so the refresh has ONE home and no cron exists this block.
 */
async function tokenForCall(supabase, vendorId) {
  const t = await igConn.readToken(supabase, vendorId);
  if (!t.ok) return t;

  const decision = igOAuth.refreshDecision({ expiresAt: t.expiresAt, connectedAt: t.connectedAt });
  if (decision === 'expired') return { ok: false, error: 'expired' };
  if (decision === 'ok')      return { ok: true, accessToken: t.accessToken };

  const r = await igOAuth.refreshLongLived(t.accessToken);
  if (!r.ok) {
    // A REFUSED REFRESH IS NOT A DEAD CONNECTION. The old token has days left by
    // construction — that is what the 7-day window bought. Proceed on it and let
    // the next call try again, rather than converting a transient Meta blip into
    // a vendor-visible disconnection.
    console.warn('[ig:refresh] refresh refused, proceeding on the current token:', r.error);
    return { ok: true, accessToken: t.accessToken, refresh_deferred: true };
  }
  await igConn.updateToken(supabase, vendorId, { accessToken: r.accessToken, expiresAt: r.expiresAt });
  return { ok: true, accessToken: r.accessToken, refreshed: true };
}

// ── GET /media ───────────────────────────────────────────────────────────────
router.get('/media', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const t = await tokenForCall(supabase, req.vendor.id);
  if (!t.ok) {
    if (t.error === 'not_connected') return errRes(res, 409, 'Instagram is not connected.', 'IG_NOT_CONNECTED');
    if (t.error === 'expired')       return errRes(res, 409, 'Your Instagram connection has expired.', 'IG_EXPIRED');
    return errRes(res, 500, t.error);
  }
  const list = await igImport.listInstagramMedia(t.accessToken);
  if (!list.ok) return errRes(res, 502, list.error, 'IG_REFUSED');

  return okRes(res, { items: list.items, truncated: list.truncated === true });
}));

// ── POST /import ─────────────────────────────────────────────────────────────
// Body: { source_urls: string[] } — the vendor's own pick order is preserved,
// because importSelected takes what fits IN THAT ORDER.
router.post('/import', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const urls = (req.body || {}).source_urls;
  if (!Array.isArray(urls) || urls.length === 0) {
    return errRes(res, 400, 'No photos selected.');
  }

  // The connection is asserted even though importSelected only needs URLs. A
  // vendor who is not connected has no business handing this door a list of
  // arbitrary URLs to mirror into their portfolio — without this check the
  // endpoint is a server-side fetch of anything, authenticated as a favour.
  const t = await tokenForCall(supabase, req.vendor.id);
  if (!t.ok) {
    if (t.error === 'not_connected') return errRes(res, 409, 'Instagram is not connected.', 'IG_NOT_CONNECTED');
    if (t.error === 'expired')       return errRes(res, 409, 'Your Instagram connection has expired.', 'IG_EXPIRED');
    return errRes(res, 500, t.error);
  }

  const result = await igImport.importSelected(supabase, req.vendor.id, urls);
  if (!result.ok) return errRes(res, result.cap_reached ? 409 : 400, result.error);
  return okRes(res, result);
}));

// ── DELETE /disconnect ───────────────────────────────────────────────────────
router.delete('/disconnect', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const d = await igConn.disconnect(supabase, req.vendor.id);
  if (!d.ok) return errRes(res, 500, d.error);
  // The photos stay. The addendum's law: Instagram is a source, never a
  // dependency — mirrored bytes are the estate's own and outlive the connection.
  return okRes(res, { disconnected: true });
}));

module.exports = router;
