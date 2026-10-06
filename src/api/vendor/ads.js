// src/api/vendor/ads.js · CE-46 · ADS-1 · cut 1 · THE ADS SECTION'S DOORS (Posts & ads room, R-46.10, R-46.11).
//
//   GET  /api/v2/vendor/ads             the section's answer: gate, whether switched on, her connection (no token), the
//                                        gap Meta's answer shows (page | link | ad_account | scopes | null)
//   GET  /api/v2/vendor/ads/authorize   arms the one live state and returns the address; the pwa PRE-MINTS it and
//                                        renders a real <a href>, no await at the tap (F-44.235), H19 in iOS standalone
//   GET  /api/v2/vendor/ads/callback    Meta's redirect. NO JWT: the signed, single-use state authenticates it, exactly
//                                        as /ig/callback's header argues (src/api/vendor/ig.js :12 to :28)
//   POST /api/v2/vendor/ads/check       the re-read when she returns from Meta's screen (R-46.11: TDW re-reads by
//                                        itself on focus or visibility and advances; "Check again" is the quiet fallback)
//   POST /api/v2/vendor/ads/disconnect  the row goes; her ads on Meta are hers and untouched
//
// Every door but /callback is behind flag.ads (lib/ads/door.js). The boost doors below: /posts, /prepare (creates
// nothing, returns Meta's minimum and the total first), /run (her confirm tap), /pause, /results.
'use strict';
const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const cap   = require('../../lib/capabilities');
const door  = require('../../lib/ads/door');
const oauth = require('../../lib/ads/oauth');
const meta  = require('../../lib/ads/meta');
const conn  = require('../../lib/ads/connection');

const PWA_BASE = process.env.PWA_BASE_URL || 'https://thedreamwedding.in';
const RETURN_PATH = require('../../lib/pwaPaths').vendorPath('posts');

// Seams for rung b144: the network and the clock are swappable; production uses the real ones.
let _fetch = (...a) => fetch(...a);
function _setFetch(f) { _fetch = f || ((...a) => fetch(...a)); }

async function gate(req) {
  const row = await cap.get(door.MASTER, { supabase: req.app.locals.supabase });
  const d = door.openFor({ row, vendorId: req.vendor.id });
  if (!d.open || !row || row.status !== 'on') return d;
  // CE-47 ADS-2: once ads are on, her own choice decides (no stored choice means on; a connected vendor stays on).
  const g = await require('../../lib/featureGate').openFor({ supabase: req.app.locals.supabase, vendorId: req.vendor.id, key: door.MASTER, row });
  return g.open ? d : { open: false, reason: g.reason, choseOff: true };
}

/** The three-gap read against Meta, stored so the room can speak Meta's names. Refusals travel as a code. */
async function readGaps(supabase, vendorId) {
  const t = await conn.readToken(supabase, vendorId);
  if (!t.ok) return { gap: t.error === 'expired' ? 'expired' : 'not_connected' };
  try {
    const [scopes, pageList, accounts] = await Promise.all([
      meta.grantedScopes({ token: t.token, fetchImpl: _fetch }),
      meta.pages({ token: t.token, fetchImpl: _fetch }),
      meta.adAccounts({ token: t.token, fetchImpl: _fetch }),
    ]);
    // Her stored pick (cut1e 2): honoured while it is still among what Meta lists; never overwritten by a 'choose'.
    const c = await conn.getConnection(supabase, vendorId);
    const pick = c.ok && c.connection ? { page_id: c.connection.page_id, ad_account_id: c.connection.ad_account_id } : {};
    const g = meta.gapsFrom({ scopes, pageList, accounts, pick });
    if (g.gap !== 'choose') {
      await conn.saveAssets(supabase, vendorId, {
        page: g.page || null, ig: g.ig || null, account: g.gap === null ? g.account : null,
      });
    }
    return g;
  } catch (e) {
    if (e && e.tokenDead) return { gap: 'expired' };
    return { gap: 'meta_unavailable' };
  }
}

router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const g = await gate(req);
  if (!g.open) return okRes(res, { open: false });
  if (!oauth.configured()) return okRes(res, { open: true, configured: false });
  const supabase = req.app.locals.supabase;
  const c = await conn.getConnection(supabase, req.vendor.id);
  if (!c.ok) return errRes(res, 500, c.error);
  if (!c.connection || !c.connection.connected_at) return okRes(res, { open: true, configured: true, connected: false });
  const gaps = await readGaps(supabase, req.vendor.id);
  const fresh = await conn.getConnection(supabase, req.vendor.id);
  return okRes(res, { open: true, configured: true, connected: true, gaps, connection: fresh.ok ? fresh.connection : c.connection });
}));

router.get('/authorize', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const g = await gate(req);
  if (!g.open) return errRes(res, 403, 'Ads are not switched on for this account yet.', 'ADS_CLOSED');
  if (!oauth.configured()) return errRes(res, 503, 'Ads are not switched on yet.', 'ADS_NOT_CONFIGURED');
  const { state, nonce } = oauth.mintState(req.vendor.id);
  const armed = await conn.armState(req.app.locals.supabase, req.vendor.id, nonce);
  if (!armed.ok) return errRes(res, 500, armed.error);
  return okRes(res, { authorize_url: oauth.authorizeUrl(state) });
}));

function back(res, params) {
  return res.redirect(`${PWA_BASE}${RETURN_PATH}?${new URLSearchParams(params).toString()}`);
}

router.get('/callback', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  if (req.query.error) {
    console.warn('[ads:callback] Meta declined:', String(req.query.error), String(req.query.error_reason || ''));
    return back(res, { ads: 'declined' });
  }
  const v = oauth.verifyState(String(req.query.state || ''));
  if (!v.ok) { console.warn('[ads:callback] state rejected:', v.error); return back(res, { ads: 'expired' }); }
  const spent = await conn.spendState(supabase, v.vendorId, v.nonce);
  if (!spent.ok) { console.warn('[ads:callback] state not spendable for vendor', v.vendorId); return back(res, { ads: 'expired' }); }
  try {
    const short = await meta.exchangeCode({ code: String(req.query.code || ''), fetchImpl: _fetch });
    const long = await meta.longLived({ token: short, fetchImpl: _fetch });
    const [fbUserId, scopes] = await Promise.all([
      meta.me({ token: long.token, fetchImpl: _fetch }),
      meta.grantedScopes({ token: long.token, fetchImpl: _fetch }),
    ]);
    const saved = await conn.saveToken(supabase, v.vendorId, { fbUserId, accessToken: long.token, expiresAt: long.expiresAt, scopes });
    if (!saved.ok) return back(res, { ads: 'error' });
    // THE SUCCESS LINE (CE-46): read once, purely, with no write; a refusal here never undoes the connect.
    try {
      const trace = [];
      const [pageList, accounts] = await Promise.all([
        meta.pages({ token: long.token, fetchImpl: _fetch, trace }),
        meta.adAccounts({ token: long.token, fetchImpl: _fetch }),
      ]);
      console.log(meta.connectedLine({ scopes, g: meta.gapsFrom({ scopes, pageList, accounts }), trace }));
    } catch (_e) { console.log(meta.connectedLine({ scopes, g: null })); }
  } catch (_e) {
    return back(res, { ads: 'error' });
  }
  return back(res, { ads: 'connected' });
}));

router.post('/check', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const g = await gate(req);
  if (!g.open) return errRes(res, 403, 'Ads are not switched on for this account yet.', 'ADS_CLOSED');
  const gaps = await readGaps(req.app.locals.supabase, req.vendor.id);
  return okRes(res, { gaps });
}));

router.post('/disconnect', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const g = await gate(req);
  if (!g.open) return errRes(res, 403, 'Ads are not switched on for this account yet.', 'ADS_CLOSED');
  const d = await conn.disconnect(req.app.locals.supabase, req.vendor.id);
  if (!d.ok) return errRes(res, 500, d.error);
  return okRes(res, { connected: false });
}));


// ── THE CONTROL PANEL (R-46.12): her settings, every Meta option list read at run time, the echo, and management.
// Two taps before any money: /prepare creates NOTHING and returns her settings normalised, the total and Meta's minimum
// first (A-45.15) with `confirm`, a hash of every setting and the total; /run and every management change must send
// that echo back, and are refused on any mismatch, so what she saw is exactly what is sent to Meta.
const target = require('../../lib/ads/targeting');
const ads = require('../../lib/ads/runs');

async function readyOrRefuse(req, res) {
  const g = await gate(req);
  if (!g.open) { errRes(res, 403, 'Ads are not switched on for this account yet.', 'ADS_CLOSED'); return null; }
  const supabase = req.app.locals.supabase;
  const gaps = await readGaps(supabase, req.vendor.id);
  if (gaps.gap !== null) { okRes(res, { gaps }); return null; }
  const t = await conn.readToken(supabase, req.vendor.id);
  if (!t.ok) { okRes(res, { gaps: { gap: t.error === 'expired' ? 'expired' : 'not_connected' } }); return null; }
  return { supabase, gaps, token: t.token };
}
const metaDown = (res, e) => okRes(res, { gaps: { gap: e && e.tokenDead ? 'expired' : 'meta_unavailable' } });
// THE RUPEE LOCK, server half (CE-47's ruling, 1 Oct 2026): every money word in the room is rupees, so an ad is never
// prepared, created or resumed on an account whose currency is not INR. Refused here, before any call to Meta.
const NOT_INR = 'TDW runs ads on rupee accounts for now.';
const notInr = (currency) => !!currency && currency !== 'INR';

// Her posts, both kinds (G4): Instagram posts and reels with their insights, then her Facebook Page's latest posts read
// with the Page token. The suggestion is drawn from Instagram only (saves and reach, then likes, then newest). A Page
// token that cannot be had leaves Facebook posts out; it never blocks the Instagram ones.
async function herPosts(r) {
  const media = await meta.igMedia({ token: r.token, igUserId: r.gaps.ig.id, fetchImpl: _fetch });
  const eligible = media.filter((m) => m.eligible).slice(0, 12);
  for (const m of eligible) {
    try { m.insights = await meta.mediaInsights({ token: r.token, mediaId: m.id, fetchImpl: _fetch }); } catch (e) { if (e && e.tokenDead) throw e; m.insights = null; }
  }
  let fb = [];
  try {
    const pt = await meta.pageToken({ token: r.token, pageId: r.gaps.page.id, fetchImpl: _fetch });
    fb = await meta.pagePosts({ token: pt, pageId: r.gaps.page.id, fetchImpl: _fetch });
  } catch (e) { if (e && e.tokenDead) throw e; fb = []; }
  const ig = media.map((m) => eligible.find((x) => x.id === m.id) || m);
  return { posts: ig.concat(fb), suggestion: meta.suggest(eligible) };
}

// THE CHOOSER (cut1e 2): her tap, never the first found. Each id must be one Meta lists for her login right now.
router.post('/choose', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const g = await gate(req);
  if (!g.open) return errRes(res, 403, 'Ads are not switched on for this account yet.', 'ADS_CLOSED');
  const supabase = req.app.locals.supabase;
  const t = await conn.readToken(supabase, req.vendor.id);
  if (!t.ok) return okRes(res, { gaps: { gap: t.error === 'expired' ? 'expired' : 'not_connected' } });
  const b = req.body || {};
  try {
    const [pageList, accounts] = await Promise.all([
      meta.pages({ token: t.token, fetchImpl: _fetch }), meta.adAccounts({ token: t.token, fetchImpl: _fetch }),
    ]);
    const c = await conn.getConnection(supabase, req.vendor.id);
    const cur = c.ok && c.connection ? c.connection : {};
    const page = b.page_id ? pageList.find((p) => p.id === String(b.page_id) && p.ig) : pageList.find((p) => p.id === cur.page_id);
    const account = b.ad_account_id ? accounts.find((a) => a.id === String(b.ad_account_id) && a.status === meta.ACTIVE) : accounts.find((a) => a.id === cur.ad_account_id);
    if ((b.page_id && !page) || (b.ad_account_id && !account)) return errRes(res, 400, 'That is not one of yours on Meta.', 'ADS_CHOOSE');
    await conn.saveAssets(supabase, req.vendor.id, { page: page ? { id: page.id, name: page.name } : null, ig: page ? page.ig : null, account: account || null });
    return okRes(res, { gaps: await readGaps(supabase, req.vendor.id) });
  } catch (e) { return okRes(res, { gaps: { gap: e && e.tokenDead ? 'expired' : 'meta_unavailable' } }); }
}));

router.get('/posts', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const r = await readyOrRefuse(req, res); if (!r) return;
  try { return okRes(res, await herPosts(r)); } catch (e) { return metaDown(res, e); }
}));

// Meta's option lists: places, languages, interests, life_events. The list is Meta's; TDW adds and removes nothing.
router.get('/search', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const r = await readyOrRefuse(req, res); if (!r) return;
  const kind = String(req.query.kind || '');
  if (!meta.SEARCH_TYPES[kind]) return errRes(res, 400, 'Unknown list.', 'ADS_SEARCH_KIND');
  try { return okRes(res, { kind, options: await meta.search({ token: r.token, kind, q: req.query.q, fetchImpl: _fetch }) }); }
  catch (e) { return metaDown(res, e); }
}));

// The three-tap path's first draft: her suggested post, her profile city (found in Meta's list by name) at 25 km,
// ages 22 to 40, Instagram placements, Meta's minimum for 3 days. A draft, never a limit.
router.get('/start', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const r = await readyOrRefuse(req, res); if (!r) return;
  try {
    const facts = await meta.accountFacts({ token: r.token, adAccountId: r.gaps.account.id, fetchImpl: _fetch });
    let cityPlace = null;
    if (req.vendor.city) {
      const found = await meta.search({ token: r.token, kind: 'places', q: req.vendor.city, fetchImpl: _fetch });
      cityPlace = found.find((p) => p.type === 'city') || null;
    }
    const hp = await herPosts(r);
    const pick = hp.suggestion;
    return okRes(res, { facts, posts: hp.posts, settings: target.startingValues({ cityPlace, minDailyMinor: facts.minDailyMinor, mediaId: pick ? pick.id : null }), suggestion: pick });
  } catch (e) { return metaDown(res, e); }
}));

function checkAgainstAccount(v, facts) {
  if (!facts.minDailyMinor) return null;
  const perDay = v.settings.budget.kind === 'lifetime' ? Math.floor(v.settings.budget.minor / v.days) : v.settings.budget.minor;
  return perDay < facts.minDailyMinor ? 'That is below Meta\'s minimum for your account.' : null;
}

router.post('/prepare', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const r = await readyOrRefuse(req, res); if (!r) return;
  if (notInr(r.gaps.account && r.gaps.account.currency)) return errRes(res, 400, NOT_INR, 'ADS_NOT_INR');
  const v = target.validate((req.body || {}).settings);
  if (!v.ok) return okRes(res, { errors: v.errors });
  try {
    const facts = await meta.accountFacts({ token: r.token, adAccountId: r.gaps.account.id, fetchImpl: _fetch });
    const low = checkAgainstAccount(v, facts);
    if (low) return okRes(res, { errors: [low], facts });
    return okRes(res, { facts, settings: v.settings, days: v.days, total_minor: v.total_minor, currency: facts.currency, confirm: v.confirm });
  } catch (e) { return metaDown(res, e); }
}));

router.post('/run', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const r = await readyOrRefuse(req, res); if (!r) return;
  if (notInr(r.gaps.account && r.gaps.account.currency)) return errRes(res, 400, NOT_INR, 'ADS_NOT_INR');
  const body = req.body || {};
  const v = target.validate(body.settings);
  if (!v.ok || body.confirm !== v.confirm) return errRes(res, 400, 'Something changed. Look at the settings again and tap Run.', 'ADS_CONFIRM');
  const facts = await meta.accountFacts({ token: r.token, adAccountId: r.gaps.account.id, fetchImpl: _fetch });
  const low = checkAgainstAccount(v, facts);
  if (low) return errRes(res, 400, low, 'ADS_BELOW_MIN');
  // Gap (1), the chair's yes: the chosen post's picture and the first line of its caption ride in the stored settings
  // (jsonb, no migration) so the Posts card and Your ads can show them. Read from Meta, never from the client. The echo
  // is over v.settings alone; `post` is added after the echo and validate() ignores it on a duplicate.
  // R-46.16: only a post that is HERS on Meta can reach a create call; an example never can (it has no id Meta lists).
  let post = null; let source = null;
  try {
    const hp = await herPosts(r);
    const m = hp.posts.find((x) => x.id === v.settings.media_id && x.eligible);
    if (m) { source = m.source; post = { url: m.url || null, caption_line: String(m.caption || '').split(/[\n.]/)[0].trim().slice(0, 60) || null, source }; }
  } catch (_e) { post = null; }
  if (!source) return errRes(res, 400, 'Choose one of your own posts.', 'ADS_NOT_HER_POST');
  const row = await ads.draft(r.supabase, req.vendor.id, { adAccountId: r.gaps.account.id, settings: { ...v.settings, post }, days: v.days, totalMinor: v.total_minor, currency: facts.currency });
  if (!row.ok) return errRes(res, 500, row.error);
  try {
    // Meta's click-to-Instagram guide (read 29 September 2026): the calls need a Page token from a person with the
    // ADVERTISE task. It is fetched here, used for the four objects, and never stored.
    const pt = await meta.pageToken({ token: r.token, pageId: r.gaps.page.id, fetchImpl: _fetch });
    const ids = await meta.createPaused({ token: pt, adAccountId: r.gaps.account.id, pageId: r.gaps.page.id, igUserId: r.gaps.ig.id,
      mediaId: v.settings.media_id, source, adset: v.adset, welcome: v.settings.welcome, fetchImpl: _fetch });
    await ads.saveIds(r.supabase, row.id, ids);
    await meta.setRunning({ token: r.token, ids, active: true, fetchImpl: _fetch });
    await ads.mark(r.supabase, row.id, 'running');
    return okRes(res, { ad: { id: row.id, status: 'running', ends_at: ids.endsAt } });
  } catch (e) {
    await ads.refuse(r.supabase, row.id, e && e.step ? `${e.step}${e.code !== null && e.code !== undefined ? ` ${e.code}` : ''}` : 'unknown');
    return okRes(res, { ad: { id: row.id, status: 'refused', step: e && e.step ? e.step : null } });
  }
}));

// ── "YOUR ADS" (R-46.12 management): the list, and per ad pause, resume, change the amount or the end, end now,
// duplicate as a new draft, results by day. Every change is echoed: the room sends back the ad's id, the action and
// the new values it showed her, hashed; the door recomputes and refuses on a mismatch before anything goes to Meta.
router.get('/list', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const g = await gate(req);
  if (!g.open) return errRes(res, 403, 'Ads are not switched on for this account yet.', 'ADS_CLOSED');
  return okRes(res, { ads: await ads.list(req.app.locals.supabase, req.vendor.id) });
}));

const ACTIONS = ['pause', 'resume', 'budget', 'end_date', 'end_now', 'duplicate'];
function changeEcho(id, action, values) { return target.confirmOf({ id, action, values: values || {} }, 0); }

router.post('/manage/prepare', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const b = req.body || {};
  const g = await gate(req);
  if (!g.open) return errRes(res, 403, 'Ads are not switched on for this account yet.', 'ADS_CLOSED');
  if (!ACTIONS.includes(b.action)) return errRes(res, 400, 'Unknown change.', 'ADS_ACTION');
  const one = await ads.mine(req.app.locals.supabase, req.vendor.id, String(b.id || ''));
  if (!one) return errRes(res, 404, 'No such ad.', 'ADS_NONE');
  const vals = {};
  if (b.action === 'budget') { const n = Number((b.values || {}).minor); if (!Number.isInteger(n) || n <= 0) return okRes(res, { errors: ['Choose an amount.'] }); vals.minor = n; vals.kind = (one.settings && one.settings.budget && one.settings.budget.kind) || 'daily'; }
  if (b.action === 'end_date') { const t = Date.parse((b.values || {}).end); if (!Number.isFinite(t) || t < Date.now() + 3600000) return okRes(res, { errors: ['Choose an end at least an hour from now.'] }); vals.end = new Date(t).toISOString(); }
  return okRes(res, { id: one.id, action: b.action, values: vals, confirm: changeEcho(one.id, b.action, vals) });
}));

router.post('/manage', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const b = req.body || {};
  const r = await readyOrRefuse(req, res); if (!r) return;
  const one = await ads.mine(r.supabase, req.vendor.id, String(b.id || ''));
  if (!one) return errRes(res, 404, 'No such ad.', 'ADS_NONE');
  if (!ACTIONS.includes(b.action) || b.confirm !== changeEcho(one.id, b.action, b.values)) return errRes(res, 400, 'Something changed. Look again and confirm.', 'ADS_CONFIRM');
  if (b.action === 'duplicate') return okRes(res, { draft: one.settings });   // a NEW draft: /prepare and /run as ever
  if (b.action === 'resume' && notInr(one.currency)) return errRes(res, 400, NOT_INR, 'ADS_NOT_INR');
  // The echo proves the screen and the request agree; it does not make a value lawful. Re-check here, as /run does.
  const vv = b.values || {};
  if (b.action === 'budget' && (!Number.isInteger(vv.minor) || vv.minor <= 0 || !['daily', 'lifetime'].includes(vv.kind))) return errRes(res, 400, 'Choose an amount.', 'ADS_VALUE');
  if (b.action === 'end_date' && !(Date.parse(vv.end) >= Date.now() + 3600000)) return errRes(res, 400, 'Choose an end at least an hour from now.', 'ADS_VALUE');
  if (b.action === 'budget' && vv.kind === 'daily') {
    const facts = await meta.accountFacts({ token: r.token, adAccountId: one.ad_account_id, fetchImpl: _fetch });
    if (facts.minDailyMinor && vv.minor < facts.minDailyMinor) return errRes(res, 400, 'That is below Meta\'s minimum for your account.', 'ADS_BELOW_MIN');
  }
  if (!one.ad_id) return errRes(res, 409, 'This ad never reached Meta.', 'ADS_NO_META');
  const ids = { campaignId: one.campaign_id, adsetId: one.adset_id, adId: one.ad_id };
  try {
    if (b.action === 'pause' || b.action === 'end_now') { await meta.setRunning({ token: r.token, ids, active: false, fetchImpl: _fetch }); await ads.mark(r.supabase, one.id, b.action === 'pause' ? 'paused' : 'ended'); }
    if (b.action === 'resume') { await meta.setRunning({ token: r.token, ids, active: true, fetchImpl: _fetch }); await ads.mark(r.supabase, one.id, 'running'); }
    if (b.action === 'budget') { await meta.updateAdset({ token: r.token, adsetId: one.adset_id, [b.values.kind === 'lifetime' ? 'lifetimeMinor' : 'dailyMinor']: b.values.minor, fetchImpl: _fetch }); await ads.changed(r.supabase, one.id, { budget: b.values }); }
    if (b.action === 'end_date') { await meta.updateAdset({ token: r.token, adsetId: one.adset_id, endTime: b.values.end, fetchImpl: _fetch }); await ads.changed(r.supabase, one.id, { end: b.values.end }); }
    return okRes(res, { ad: await ads.mine(r.supabase, req.vendor.id, one.id) });
  } catch (e) { return metaDown(res, e); }
}));

router.get('/results', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const r = await readyOrRefuse(req, res); if (!r) return;
  const one = req.query.id ? await ads.mine(r.supabase, req.vendor.id, String(req.query.id)) : await ads.latest(r.supabase, req.vendor.id);
  if (!one || !one.ad_id) return okRes(res, { ad: one ? { id: one.id, status: one.status } : null });
  try {
    const [state, days] = await Promise.all([
      meta.adState({ token: r.token, adId: one.ad_id, fetchImpl: _fetch }),
      meta.insightsByDay({ token: r.token, adId: one.ad_id, fetchImpl: _fetch }),
    ]);
    await ads.saveInsights(r.supabase, one.id, days);
    return okRes(res, { ad: { id: one.id, status: one.status, effective: state.effective, reviewing: state.effective === 'PENDING_REVIEW',
      settings: one.settings, total_minor: one.total_minor, currency: one.currency, started_at: one.started_at, ends_at: one.ends_at, by_day: days } });
  } catch (e) { return metaDown(res, e); }
}));

module.exports = router;
module.exports._setFetch = _setFetch;
