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
// a blank error. CONJECTURE, and now known to be at best incomplete: the extra
// hop was read at the time as the interception point. The 2026-07-30 walk shows
// a plain tap is claimed with NO extra hop at all, so the hop was never the
// whole disease and may have been no part of it. The host correction stands on
// Meta's documentation, which is why it survives this being wrong.
//
// ══ NO DEVICE IN THE LOOP — THE FILE'S STANDING HEADER (CE-ruled, P4b) ══════
// EVERY NAVIGATION-PHYSICS CLAIM IN THIS FILE CITES A FOUNDER-WITNESSED
// SCREENSHOT BY DATE, OR CARRIES THE WORD CONJECTURE.
//
// This header exists because the paragraph below has now been wrong THREE
// TIMES, written by THREE DIFFERENT AUTHORS — the retired seat, the chair, and
// the P4b executor — and every one of those was a confident sentence about how
// iOS behaves, authored by someone with no iPhone in front of them. The class is
// not carelessness. It is that nobody in this loop can run the experiment, and
// deviceless reasoning about Universal Links has a perfect record of being
// inverted. Correction №21 is jointly the executor's and the chair's.
//
// ── THE PHYSICS, AS THE SCREENSHOTS PROVE IT (founder walk, 2026-07-30) ─────
// TWO facts, and NOTHING ELSE IS KNOWN:
//
//   1. A PLAIN ANCHOR TAP on https://www.instagram.com/oauth/authorize IS
//      CLAIMED by the Instagram app, which opens to a blank error and cannot
//      render an OAuth consent screen.
//      WITNESS: founder screenshot, 2026-07-30 22:41.
//
//   2. LONG-PRESS → "Open in New Tab" ESCAPES the claim. Safari keeps the
//      navigation, the consent screen renders, Allow works, and the import
//      completes end to end.
//      WITNESS: founder screenshot, 2026-07-30 22:41 — Safari address bar
//      reading instagram.com with the Smart App Banner offering the app.
//
// EVERY OTHER NAVIGATION FORM IS UNKNOWN. Whether target="_blank", window.open,
// or a bare window.location.href assignment escapes the claim is CONJECTURE
// until the ?igprobe=1 ladder returns from the founder's handset. No sentence
// in this file may assume any of them.
//
// F-07.7 STAYS CITED AS THE FAMILY, with its status corrected: the IG chip's web
// fallback fires inside a 300ms timer, outside the tap's transient activation,
// and collects a popup prompt for it. It is the same SUBJECT — iOS deciding what
// to do with a navigation toward Instagram — and it remains the nearest prior
// evidence this estate owns. What it is NOT is a proof of direction: it was read
// at slice 1 as supporting the inverted model, and that reading was wrong. It is
// a neighbouring datum, not a lemma.
//
// WHERE THE CURE LIVES, AND WHERE THE PROBE LIVES: both in the pwa, at
// app/vendor/portfolio/page.tsx. This file mints the URL and nothing else
// decides how a browser is sent to it.
//
// WHAT THE SAME WALK EXONERATED, and this matters as much as the conviction:
// the request, the config, the signed state, the scope, the redirect_uri and
// the vendor's account are ALL CLEAN. The identical URL succeeds when only the
// navigation form changes. The values below are correct.
//
// A SERVER START ROUTE THAT 302s TO INSTAGRAM WAS PROPOSED AND REFUSED, and the
// refusal stands after the walk: it is the hop F-07.23 deleted, and a server
// redirect is not among the two forms now known to escape.
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

// ── THE INSIGHTS SCOPE — INCREMENTAL, NEVER GLOBAL (CE-42 4b-3b, ruling 13(b)) ──
// The Sunday brief (G4.1) needs `instagram_business_manage_insights`. It is NOT
// added to IG_SCOPE: that would move every vendor's consent screen and every
// App Review paragraph for a feature most vendors have not asked for. Instead the
// brief's own "Connect Instagram" mints a SECOND authorize carrying both scopes,
// tagged `insights` in the state (below), and the callback records the grant on
// the connection (vendor_ig_connections.insights_granted_at, 0165) only after
// one account read proves the token carries it. Meta's reference for the
// Instagram-Login path names exactly this pair on graph.instagram.com.
const INSIGHTS_SCOPE = 'instagram_business_manage_insights';
// CE-45 IGD-1 cut 2a-ii · THE MESSAGES SCOPE, INCREMENTAL on the insights precedent (read-first E4 and F8, ruled): the room
// "WhatsApp and Instagram" mints a third authorize carrying basic + messages, tagged `messages` in the signed state; the callback
// records the grant (vendor_ig_connections.messages_granted_at, 0174) only after one read proves the token carries it.
const MESSAGES_SCOPE = 'instagram_business_manage_messages';
const FLAVOURS = Object.freeze({ basic: 'basic', insights: 'insights', messages: 'messages' });
const SIGNED_FLAVOURS = [FLAVOURS.insights, FLAVOURS.messages];

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
function mintState(vendorId, opts = {}) {
  const nonce    = crypto.randomBytes(16).toString('hex');
  const issuedAt = Date.now();
  // `s` — the FLAVOUR (4b-3b). Absent for the portfolio's connect, 'insights' for
  // the brief's, so the callback knows which room to return to and whether the
  // grant is to be proven and stored. Signed with the rest: a flavour cannot be
  // edited in flight any more than the vendor id can.
  const flavour  = SIGNED_FLAVOURS.includes(opts.flavour) ? opts.flavour : null;
  const body     = { v: vendorId, n: nonce, t: issuedAt };
  if (flavour) body.s = flavour;
  const payload  = b64url(JSON.stringify(body));
  return { state: `${payload}.${sign(payload)}`, nonce, issuedAt, flavour: flavour || FLAVOURS.basic };
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
  return { ok: true, vendorId: parsed.v, nonce: parsed.n, flavour: SIGNED_FLAVOURS.includes(parsed.s) ? parsed.s : FLAVOURS.basic };
}

/**
 * The authorize URL the vendor's browser is sent to (U-1, settled).
 */
function authorizeUrl(state, opts = {}) {
  // The insights flavour asks for BOTH scopes: Meta's incremental consent shows
  // the vendor only what is new, and a token minted here carries the union.
  const scope = opts.flavour === FLAVOURS.insights ? `${IG_SCOPE},${INSIGHTS_SCOPE}`
    : opts.flavour === FLAVOURS.messages ? `${IG_SCOPE},${MESSAGES_SCOPE}` : IG_SCOPE;
  const q = new URLSearchParams({
    client_id:     process.env.IG_APP_ID || '',
    redirect_uri:  process.env.IG_REDIRECT_URI || '',
    scope,
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
 * Read the connected account's own profile.
 *
 * WHY THIS EXISTS — F-07.24, and it is a correction to a claim I made to META.
 * The App Review submission states, twice, that the connected Instagram username
 * is shown to the vendor in the "Import from Instagram" section. IT WAS NOT. I
 * wrote that paragraph from Meta's screencast requirement ("show profile
 * information like username") without checking the surface against it, and the
 * founder submitted it in good faith. A written claim that the app does not
 * match is a rejection with no argument available.
 *
 * It is also simply better: a vendor about to copy photographs into their public
 * storefront should be able to see WHICH account is linked. The claim was wrong;
 * the feature it described was right.
 *
 * `username` is inside instagram_business_basic's allowed usage — Meta's own
 * text names "basic metadata ... for example username and ID" — so this adds no
 * scope and changes nothing about the submission's least-privilege posture.
 */
async function fetchProfile(accessToken) {
  const q = new URLSearchParams({ fields: 'user_id,username', access_token: accessToken });
  const res  = await fetch(`${GRAPH_HOST}/me?${q.toString()}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) return metaRefusal('profile read', res, body);

  const username = body && body.username ? String(body.username) : null;
  // A MISSING USERNAME IS NOT A FAILED CONNECT. The token is valid, the media
  // will list, and refusing the whole connection over a display string would
  // trade a working import for a cosmetic one. The caller stores null and the
  // surface simply omits the line.
  return { ok: true, username, igUserId: body && body.user_id ? String(body.user_id) : null };
}

// ═══ THE MEDIA LIST — MOVED HERE FROM igImport.js (F-42.174, ruled: move now) ═══
// It carried the access token in a query on GRAPH_HOST from igImport.js:126 —
// a second home for a token-bearing call, which this header calls the disease.
// The Sunday job is its second caller. BEHAVIOUR UNCHANGED, byte for byte in
// what it returns; igImport.js re-exports it so every existing caller and
// b07_p4a's cells read the same function through the same name.
//
// U-3 (settled at P4a): `fields` as below; `paging.next` is followed up to a
// ceiling. `thumbnail_url` is requested because VIDEO items carry no usable
// `media_url` for a still; `media_type` is what tells the two apart.
// `permalink` joined the list at 4b-3b — the brief's best-post row opens it.
const IG_MEDIA_FIELDS = 'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink';
const IG_PAGE_SIZE = 25;
// A ceiling on how many pages we will walk. The portfolio cap is 20, so a vendor
// never NEEDS more than one page — this exists so a malformed `paging.next`
// cannot spin the request forever, which is a liveness bug wearing a loop's
// clothes. Named, not magic.
const IG_MAX_PAGES = 8;

/**
 * List the vendor's own Instagram media, cursor-paged.
 *
 * FAIL-LOUD IS PRESERVED FROM P3, and the reason has not changed: an import that
 * silently finds nothing is indistinguishable from a vendor with no posts, and
 * the estate has paid for that class of silence before (F-04.113). A network
 * failure REFUSES; only a genuinely empty account returns an empty list, and the
 * caller can tell the two apart because a refusal carries ok:false.
 */
async function listInstagramMedia(accessToken, opts = {}) {
  if (!accessToken) return { ok: false, error: 'No Instagram connection.' };

  const limit = Number(opts.limit) > 0 ? Number(opts.limit) : IG_PAGE_SIZE;
  const q = new URLSearchParams({
    fields:       IG_MEDIA_FIELDS,
    limit:        String(limit),
    access_token: accessToken,
  });
  let url = `${GRAPH_HOST}/me/media?${q.toString()}`;

  const items = [];
  for (let page = 0; page < IG_MAX_PAGES; page++) {
    const res = await fetch(url);
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const code = body && body.error && (body.error.code || body.error.type);
      // THE SECRETS LAW: the URL carries the access token, so the URL never
      // travels into the error. Status and Meta's own code, nothing more.
      return {
        ok: false,
        error: `Instagram refused the photo list (${res.status}${code ? `, ${code}` : ''}).`,
        http_status: res.status,
      };
    }
    for (const m of (body && Array.isArray(body.data) ? body.data : [])) {
      // VIDEO and CAROUSEL_ALBUM entries can carry a null media_url for our
      // purposes; the still is the thumbnail. An item with neither is skipped
      // rather than mirrored as a broken row.
      const src = m.media_type === 'VIDEO' ? (m.thumbnail_url || null) : (m.media_url || m.thumbnail_url || null);
      if (!src) continue;
      items.push({
        id:         m.id,
        caption:    typeof m.caption === 'string' ? m.caption : null,
        media_type: m.media_type || null,
        source_url: src,
        timestamp:  m.timestamp || null,
        permalink:  typeof m.permalink === 'string' ? m.permalink : null,
      });
    }
    const next = body && body.paging && body.paging.next;
    if (!next) return { ok: true, items, pages: page + 1, truncated: false };
    url = next;
  }
  // Ceiling hit. TRUNCATION IS ANNOUNCED, never silent — the same law the batch
  // import applies to its own cap (P3 §7).
  return { ok: true, items, pages: IG_MAX_PAGES, truncated: true };
}

// ═══ INSIGHTS (G4.1, CE-42 4b-3b) — the Instagram-Login path, cited ═══════════
// Meta's account-insights reference (Instagram API with Instagram Login): host
// graph.instagram.com · Instagram User access token · permissions
// instagram_business_basic + instagram_business_manage_insights. Metric names as
// the reference spells them:
//   account  reach · follows_and_unfollows · saves · shares   (period=day,
//            metric_type=total_value, since/until as Unix seconds — "the API
//            will only include data created within this range (inclusive)")
//   media    saved · shares   (period is lifetime; note the wire name is
//            `saved`, the stored shape keeps `saves` — the map is in the brief arm)
// Two behaviours the reference states, read as CODES by the arm rather than
// re-derived: `follows_and_unfollows` is "not returned if the IG User has less
// than 100 followers", and "if insights data you are requesting does not exist
// or is currently unavailable, the API will return an empty data set instead of
// 0". So an ABSENT metric is `null`, never zero. `online_followers` is not in the
// Instagram-Login table at all — HELD (F-42.164's second half). Data may lag up
// to 48 hours (reference) — declared on the row, not cured.
const ACCOUNT_METRICS = 'reach,follows_and_unfollows,saves,shares';
const MEDIA_METRICS   = 'saved,shares';

function totalOf(entry) {
  // total_value shape first (metric_type=total_value); the values[] shape as the
  // fallback the media endpoint uses. Absent → null (the reference's empty set).
  if (!entry) return null;
  if (entry.total_value && Number.isFinite(Number(entry.total_value.value))) return Number(entry.total_value.value);
  if (Array.isArray(entry.values) && entry.values.length) {
    const v = entry.values[entry.values.length - 1];
    if (v && Number.isFinite(Number(v.value))) return Number(v.value);
  }
  return null;
}

function byName(body) {
  const out = {};
  for (const d of (body && Array.isArray(body.data) ? body.data : [])) if (d && d.name) out[d.name] = totalOf(d);
  return out;
}

/**
 * The account totals for one window. `since`/`until` are Unix SECONDS.
 * Returns { ok, metrics: { reach, follows_and_unfollows, saves, shares } } with
 * null for any metric Meta withheld. A refusal carries the status and Meta's
 * code — never the URL, which carries the token.
 */
async function fetchAccountInsights(accessToken, igUserId, { since, until } = {}) {
  if (!accessToken) return { ok: false, error: 'No Instagram connection.' };
  if (!igUserId)    return { ok: false, error: 'No Instagram user id on the connection.' };
  const q = new URLSearchParams({
    metric: ACCOUNT_METRICS, period: 'day', metric_type: 'total_value', access_token: accessToken,
  });
  if (Number.isFinite(Number(since))) q.set('since', String(Math.floor(Number(since))));
  if (Number.isFinite(Number(until))) q.set('until', String(Math.floor(Number(until))));
  const res  = await fetch(`${GRAPH_HOST}/${encodeURIComponent(String(igUserId))}/insights?${q.toString()}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) return metaRefusal('account insights read', res, body);
  // Every requested metric is present in the answer — as null when Meta's data
  // set was empty for it — so a reader never confuses "withheld" with "not asked".
  const got = byName(body);
  const metrics = {};
  for (const name of ACCOUNT_METRICS.split(',')) metrics[name] = got[name] == null ? null : got[name];
  return { ok: true, metrics };
}

/** One media object's saved/shares. Album children carry no insights (reference) — the arm never asks for them. */
async function fetchMediaInsights(accessToken, mediaId) {
  if (!accessToken) return { ok: false, error: 'No Instagram connection.' };
  if (!mediaId)     return { ok: false, error: 'No media id.' };
  const q = new URLSearchParams({ metric: MEDIA_METRICS, access_token: accessToken });
  const res  = await fetch(`${GRAPH_HOST}/${encodeURIComponent(String(mediaId))}/insights?${q.toString()}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) return metaRefusal('media insights read', res, body);
  const m = byName(body);
  return { ok: true, saves: m.saved == null ? null : m.saved, shares: m.shares == null ? null : m.shares };
}

/**
 * Her follower count. NOT an insights metric on the Instagram-Login table (the
 * reference names `follower_count` only inside the under-100 limitation), so it
 * is read as a User field. `followers_count` on /me is the chair's "witness at
 * the cut" (F-42.176 if absent): a missing field lands as null and the brief
 * still renders — the count is a caption, not a gate.
 */
async function fetchFollowersCount(accessToken) {
  if (!accessToken) return { ok: false, error: 'No Instagram connection.' };
  const q = new URLSearchParams({ fields: 'followers_count', access_token: accessToken });
  const res  = await fetch(`${GRAPH_HOST}/me?${q.toString()}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) return metaRefusal('follower count read', res, body);
  // `Number(null)` is 0 — the bench caught it (b77 1.7); a missing field is null.
  const raw = body ? body.followers_count : undefined;
  const n = raw === null || raw === undefined || raw === '' ? NaN : Number(raw);
  return { ok: true, followers_count: Number.isFinite(n) ? n : null };
}

/**
 * THE INSIGHTS PROBE — one account read, no window, used twice: by the callback
 * of the insights flavour (to prove the grant before storing it) and by the
 * sweep (15a) on the probe vendor's token. `granted:false` is Meta's own refusal
 * with a permission-class code; a network failure is `ok:false` and says nothing
 * about the scope.
 */
async function probeInsightsScope(accessToken, igUserId) {
  const r = await fetchAccountInsights(accessToken, igUserId, {});
  if (r.ok) return { ok: true, granted: true, evidence: `reach total_value ${r.metrics.reach == null ? 'absent (empty set)' : 'present'}` };
  // Meta's permission refusals ride 400/403 with codes 10 (permission denied),
  // 200-class (permissions), 190 (token). Any 4xx from the insights edge on a
  // token that lists media is read as "the scope is not on this token".
  if (r.http_status && r.http_status >= 400 && r.http_status < 500) return { ok: true, granted: false, evidence: r.error };
  return { ok: false, error: r.error };
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
  INSIGHTS_SCOPE,
  FLAVOURS,
  IG_MEDIA_FIELDS, IG_PAGE_SIZE, IG_MAX_PAGES,
  ACCOUNT_METRICS, MEDIA_METRICS,
  listInstagramMedia,
  fetchAccountInsights,
  fetchMediaInsights,
  fetchFollowersCount,
  probeInsightsScope,
  MESSAGES_SCOPE,
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
  fetchProfile,
};
