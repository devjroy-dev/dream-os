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
const igSigned = require('../../lib/vendor/igSignedRequest');

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
    // The vendor's own public handle. This is the value the App Review
    // submission promises is visible in the Import section (F-07.24).
    ig_username:      conn?.ig_username      || null,
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

  // F-07.24 — read the handle so the surface can show WHICH account is linked.
  // Deliberately NOT fatal: a profile read that fails leaves a working
  // connection with no display name, which is strictly better than refusing a
  // valid token over a cosmetic string.
  const profile = await igOAuth.fetchProfile(long.accessToken);
  if (!profile.ok) console.warn('[ig:callback] profile read failed, continuing:', profile.error);

  const saved = await igConn.saveToken(supabase, v.vendorId, {
    igUserId:    short.igUserId,
    igUsername:  profile.ok ? profile.username : null,
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

// ═══════════════════════════════════════════════════════════════════════════
// META'S TWO CALLBACKS — registered in Business login settings, 2026-07-30.
//
// Both are UNAUTHENTICATED BY NECESSITY, for the same reason /callback is:
// Meta's servers call them, and Meta's servers hold no vendor session. The
// `signed_request` is the authentication — HMAC-SHA256 under the Instagram app
// secret, verified in igSignedRequest.js before one byte is trusted.
//
// THE PATHS ARE REGISTERED WITH META AND ARE THEREFORE FROZEN. Renaming either
// one silently breaks a compliance obligation, which is the worst kind of break:
// nothing errors, and nobody finds out until an audit.
// ═══════════════════════════════════════════════════════════════════════════

// ── POST /deauthorize ────────────────────────────────────────────────────────
// Fired when a vendor removes our app from THEIR Instagram settings. Their
// intent is unambiguous: stop having access. So the connection dies here — the
// token is not merely marked dead, the row is deleted, because a revoked token
// is a secret with no remaining purpose.
//
// The mirrored PHOTOS ARE NOT TOUCHED, and that is the addendum's own law:
// Instagram is a SOURCE, never a dependency. A vendor disconnecting Instagram
// must not wake up to an empty storefront.
router.post('/deauthorize', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const parsed = igSigned.parseSignedRequest((req.body || {}).signed_request);
  if (!parsed.ok) {
    console.warn('[ig:deauthorize] refused:', parsed.error);
    // 200 to a bad signature would tell a prober its guess was accepted.
    return res.status(parsed.error === 'not_configured' ? 503 : 403).json({ ok: false });
  }

  const found = await igConn.findByIgUserId(supabase, parsed.userId);
  if (!found.ok) {
    // Already gone, or never ours. Meta does not need our bookkeeping, and
    // "no such user" and "deleted" are the same outcome from here.
    console.log('[ig:deauthorize] nothing to disconnect for ig_user', parsed.userId);
    return res.json({ ok: true });
  }

  const d = await igConn.disconnect(supabase, found.vendorId);
  if (!d.ok) {
    console.error('[ig:deauthorize] disconnect failed for vendor', found.vendorId, d.error);
    return res.status(500).json({ ok: false });
  }
  console.log('[ig:deauthorize] disconnected vendor', found.vendorId);
  return res.json({ ok: true });
}));

// ── POST /data-deletion ──────────────────────────────────────────────────────
// Meta's contract, and it is exact: respond with JSON carrying `url` and
// `confirmation_code`. The url must be reachable and must tell the person the
// status of their request.
//
// ┌─ SCOPE OF DELETION — F-07.20, FOUNDER-RULED 2026-07-30 ───────────────────┐
// │ THE RULING: 「 delete only the connection not the photos 」                 │
// │                                                                           │
// │ DELETED: the connection row — the access token and the Instagram-scoped   │
// │ user id. Unambiguously platform data; its deletion was never a judgment   │
// │ call.                                                                     │
// │                                                                           │
// │ KEPT: the mirrored photos. They are the vendor's own portfolio, copied    │
// │ into the estate's storage with their explicit pick-by-pick consent, and   │
// │ they are load-bearing for a live storefront. This is the addendum's law   │
// │ reaching its logical end — Instagram is a SOURCE, never a dependency —    │
// │ and a deletion callback that emptied a paying vendor's Discover profile   │
// │ would make Instagram a dependency retroactively.                          │
// │                                                                           │
// │ THE TENSION IS REAL AND STAYS NAMED: a strict reading of "delete data     │
// │ obtained through the platform" reaches the photos too. The ruling is that │
// │ consent-copied content becomes the vendor's own, not Meta's. So the       │
// │ status page STATES what was deleted and what was kept and offers a route  │
// │ to remove the photos — the honest posture under a ruling, not a hedge     │
// │ against an absent one. If Meta ever disputes the reading, the argument is │
// │ recorded here rather than reconstructed.                                  │
// └───────────────────────────────────────────────────────────────────────────┘
router.post('/data-deletion', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const parsed = igSigned.parseSignedRequest((req.body || {}).signed_request);
  if (!parsed.ok) {
    console.warn('[ig:data-deletion] refused:', parsed.error);
    return res.status(parsed.error === 'not_configured' ? 503 : 403).json({ ok: false });
  }

  const found = await igConn.findByIgUserId(supabase, parsed.userId);
  if (found.ok) {
    const d = await igConn.disconnect(supabase, found.vendorId);
    if (!d.ok) {
      console.error('[ig:data-deletion] delete failed for vendor', found.vendorId, d.error);
      return res.status(500).json({ ok: false });
    }
    console.log('[ig:data-deletion] connection deleted for vendor', found.vendorId);
  } else {
    console.log('[ig:data-deletion] nothing held for ig_user', parsed.userId);
  }

  // The code is derived from the ig user id and the moment, so the status page
  // can echo the request back without a second store. It carries no secret:
  // the ig user id is Meta's own identifier for a person WE were already told
  // about, and the token is nowhere near it.
  const confirmationCode = `igdel_${parsed.userId}_${Date.now()}`;
  const base = process.env.IG_REDIRECT_URI
    ? new URL(process.env.IG_REDIRECT_URI).origin
    : 'https://dream-os-production.up.railway.app';

  return res.json({
    url: `${base}/api/v2/vendor/ig/deletion-status?code=${encodeURIComponent(confirmationCode)}`,
    confirmation_code: confirmationCode,
  });
}));

// ── GET /deletion-status ─────────────────────────────────────────────────────
// The page the confirmation url points at. Public and unauthenticated by
// design — the person arriving may have no account with us at all, which is
// rather the point of a deletion request.
//
// It states plainly what was removed and what was kept. A status page that says
// only "done" over a partial deletion is the costume class in compliance
// clothing.
router.get('/deletion-status', (req, res) => {
  const code = String(req.query.code || '').slice(0, 120);
  res.type('html').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Data deletion request &middot; The Dream Wedding</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
       max-width:34rem;margin:0 auto;padding:3rem 1.5rem;color:#1c1917;line-height:1.6}
  h1{font-weight:400;font-size:1.5rem;margin:0 0 1.5rem}
  code{background:#f5f5f4;padding:.15rem .4rem;border-radius:3px;font-size:.85em}
  .k{color:#57534e;font-size:.95rem}
</style></head><body>
<h1>Your data deletion request</h1>
<p><strong>Your Instagram connection has been deleted.</strong> The access token
and the Instagram account identifier we held for you are gone from our systems.</p>
<p class="k">Photos you imported into your portfolio were copied into your own
Dream Wedding account at the time you selected them, and they remain part of
your portfolio &mdash; disconnecting Instagram does not take down your profile.
You can remove any of them yourself from your Portfolio page, or write to
<a href="mailto:hello@thedreamwedding.in">hello@thedreamwedding.in</a> and we
will remove them for you.</p>
${code ? `<p class="k">Reference: <code>${code.replace(/[<>&"]/g, '')}</code></p>` : ''}
</body></html>`);
});

module.exports = router;
