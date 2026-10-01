'use strict';
// src/lib/ads/meta.js · CE-46 · ADS-1 · cut 1 · THE CONNECT'S GRAPH CALLS AND THE THREE GAPS, ONE HOME.
// Server to server only. `fetchImpl` is injected so rung b144 never reaches Meta. Her token is an argument; the only
// hand that stores it is src/lib/ads/connection.js.
//
// Read from Meta's pages (dated in ADS-1's read-first, 27 and 28 September 2026):
//   code exchange  GET /<v>/oauth/access_token?client_id&redirect_uri&client_secret&code
//   long-lived     GET /<v>/oauth/access_token?grant_type=fb_exchange_token&client_id&client_secret&fb_exchange_token
//   her scopes     GET /<v>/me/permissions                       (what she actually granted on Meta's screen)
//   her Pages      GET /<v>/me/accounts?fields=id,name,instagram_business_account{id,username}
//   her accounts   GET /<v>/me/adaccounts?fields=id,name,account_status,currency
//
// THE THREE GAPS (R-46.11, the founder's ruling of 28 September): a vendor may lack (1) a Facebook Page, (2) that Page
// linked to her Instagram professional account, (3) an ad account. gapsFrom() is PURE: it takes what Meta answered and
// says which is missing first, in that order, with Meta's own names for the room's sentence. Nothing is created here;
// Meta allows Page creation by API only to test users or allowlisted apps (User Accounts reference, read 28 September).
const GRAPH = 'https://graph.facebook.com';
const { graphVersion } = require('./oauth');

class MetaError extends Error {
  constructor(step, status, body) {
    const e = body && body.error && typeof body.error === 'object' ? body.error : null;
    const m = e && typeof e.message === 'string' ? e.message : `HTTP ${status}`;
    super(`${step}: ${m.slice(0, 300).replace(/[A-Za-z0-9_\-|.]{40,}/g, '[masked]')}`);
    this.step = step; this.status = status;
    this.code = e && e.code !== undefined ? e.code : null;
    this.subcode = e && e.error_subcode !== undefined ? e.error_subcode : null;
    // 190 is Meta's invalid or expired token: the room says "connect again", never a raw error.
    this.tokenDead = this.code === 190;
  }
}

async function call(fetchImpl, step, url, token) {
  const init = token ? { method: 'GET', headers: { Authorization: `Bearer ${token}` } } : { method: 'GET' };
  const res = await fetchImpl(url, init);
  let body = null;
  try { body = await res.json(); } catch (_e) { body = null; }
  if (!res.ok || (body && body.error)) {
    const err = new MetaError(step, res.status, body);
    console.warn(`[ads:meta] ${step} refused (${res.status}${err.code !== null ? `, ${err.code}` : ''}): ${err.message}`);
    throw err;
  }
  return body;
}

const v = (env) => `${GRAPH}/${graphVersion(env)}`;

async function exchangeCode({ code, env = process.env, fetchImpl }) {
  const q = new URLSearchParams({
    client_id: env.ADS_APP_ID || '', redirect_uri: env.ADS_REDIRECT_URI || '',
    client_secret: env.ADS_APP_SECRET || '', code,
  });
  const b = await call(fetchImpl, 'exchange', `${v(env)}/oauth/access_token?${q}`);
  if (!b || typeof b.access_token !== 'string') throw new MetaError('exchange', 200, { error: { message: 'no access_token in the answer' } });
  return b.access_token;
}

async function longLived({ token, env = process.env, fetchImpl, now = Date.now() }) {
  const q = new URLSearchParams({
    grant_type: 'fb_exchange_token', client_id: env.ADS_APP_ID || '',
    client_secret: env.ADS_APP_SECRET || '', fb_exchange_token: token,
  });
  const b = await call(fetchImpl, 'long_lived', `${v(env)}/oauth/access_token?${q}`);
  if (!b || typeof b.access_token !== 'string') throw new MetaError('long_lived', 200, { error: { message: 'no access_token in the answer' } });
  const secs = Number(b.expires_in);
  return { token: b.access_token, expiresAt: Number.isFinite(secs) && secs > 0 ? new Date(now + secs * 1000).toISOString() : null };
}

async function me({ token, env = process.env, fetchImpl }) {
  const b = await call(fetchImpl, 'me', `${v(env)}/me?fields=id`, token);
  return b && b.id ? String(b.id) : null;
}

async function grantedScopes({ token, env = process.env, fetchImpl }) {
  const b = await call(fetchImpl, 'permissions', `${v(env)}/me/permissions`, token);
  return (b && Array.isArray(b.data) ? b.data : [])
    .filter((p) => p && p.status === 'granted' && typeof p.permission === 'string')
    .map((p) => p.permission).sort();
}

const PAGE_FIELDS = 'id,name,instagram_business_account{id,username}';
const shapePage = (p) => ({
  id: String(p.id), name: typeof p.name === 'string' ? p.name : '',
  ig: p.instagram_business_account && p.instagram_business_account.id
    ? { id: String(p.instagram_business_account.id), username: p.instagram_business_account.username || null } : null,
});
/**
 * Her Pages. me/accounts first; then, because me/accounts does NOT list a Page she reaches through a business
 * portfolio (the ads walk of 29 September: "data": [] while the token held the Page, read on Meta's own tools), every
 * portfolio's owned_pages and client_pages (needs business_management, cut1e 1). One list, no repeats, me/accounts first.
 */
async function pages({ token, env = process.env, fetchImpl, trace = null }) {
  const b = await call(fetchImpl, 'pages', `${v(env)}/me/accounts?fields=${encodeURIComponent(PAGE_FIELDS)}&limit=50`, token);
  const out = (b && Array.isArray(b.data) ? b.data : []).filter((p) => p && p.id).map(shapePage);
  // trace (the success line, CE-46): where each Page was found. It never changes what is returned.
  if (trace) for (const p of out) trace.push({ id: String(p.id), via: 'me/accounts' });
  let biz = null;
  try {
    biz = await call(fetchImpl, 'businesses',
      `${v(env)}/me/businesses?fields=${encodeURIComponent(`id,name,owned_pages.limit(50){${PAGE_FIELDS}},client_pages.limit(50){${PAGE_FIELDS}}`)}&limit=25`, token);
  } catch (e) { if (e && e.tokenDead) throw e; biz = null; }   // without business_management: me/accounts alone, as before
  for (const bz of (biz && Array.isArray(biz.data) ? biz.data : [])) {
    for (const edge of ['owned_pages', 'client_pages']) {
      for (const p of (bz && bz[edge] && Array.isArray(bz[edge].data) ? bz[edge].data : [])) {
        if (p && p.id && !out.some((o) => o.id === String(p.id))) { out.push(shapePage(p)); if (trace) trace.push({ id: String(p.id), via: edge }); }
      }
    }
  }
  return out;
}

/** The Page's own token: Meta's click-to-Instagram guide needs a Page token from a person with the ADVERTISE task. */
async function pageToken({ token, pageId, env = process.env, fetchImpl }) {
  const b = await call(fetchImpl, 'page_token', `${v(env)}/${encodeURIComponent(pageId)}?fields=access_token`, token);
  if (!b || typeof b.access_token !== 'string' || !b.access_token) throw new MetaError('page_token', 'no page token', null);
  return b.access_token;
}

async function adAccounts({ token, env = process.env, fetchImpl }) {
  const b = await call(fetchImpl, 'adaccounts', `${v(env)}/me/adaccounts?fields=id,name,account_status,currency&limit=50`, token);
  return (b && Array.isArray(b.data) ? b.data : [])
    .filter((a) => a && /^act_[0-9]+$/.test(String(a.id)))
    .map((a) => ({ id: String(a.id), name: typeof a.name === 'string' ? a.name : '', status: Number(a.account_status), currency: a.currency || null }));
}

// Meta's account_status: 1 is ACTIVE. Any other value is an account she cannot run an ad on today.
const ACTIVE = 1;
// The configuration's seven (1863002924861430, the founder's clicks of 28 September): business_management is not among them.
const NEEDED_SCOPES = Object.freeze(['ads_management', 'ads_read', 'instagram_basic', 'instagram_manage_insights', 'pages_manage_ads', 'pages_read_engagement', 'pages_show_list']);

/**
 * Which gap is missing first. PURE. Order is the founder's: Page, then the Instagram link, then the ad account.
 *   { gap: 'scopes', missing: [...] }        she declined a permission on Meta's screen
 *   { gap: 'page' }                          no Page on her Facebook account
 *   { gap: 'link', page: {id,name} }         a Page, none linked to an Instagram professional account
 *   { gap: 'ad_account', page, ig }          Page and Instagram ready, no active ad account
 *   { gap: null, page, ig, account }         ready: the room's S3
 * When several Pages or accounts qualify, the first in Meta's order is taken for the sentence; choosing among them is
 * the room's control, not this function's.
 */
function gapsFrom({ scopes = [], pageList = [], accounts = [], pick = {} }) {
  const missing = NEEDED_SCOPES.filter((s) => !scopes.includes(s));
  if (missing.length) return { gap: 'scopes', missing };
  if (!pageList.length) return { gap: 'page' };
  const linkedAll = pageList.filter((p) => p.ig);
  if (!linkedAll.length) return { gap: 'link', page: { id: pageList[0].id, name: pageList[0].name } };
  // NEVER THE FIRST FOUND (cut1e 2): one of each is chosen silently; two or more wait for her tap, unless her stored
  // pick is still among them.
  let linked = linkedAll.length === 1 ? linkedAll[0] : linkedAll.find((p) => p.id === pick.page_id);
  const active = accounts.filter((a) => a.status === ACTIVE);
  let account = active.length === 1 ? active[0] : active.find((a) => a.id === pick.ad_account_id);
  const choose = {};
  if (!linked) choose.pages = linkedAll.map((p) => ({ id: p.id, name: p.name, ig: p.ig }));
  if (!account && active.length > 1) choose.accounts = active.map((a) => ({ id: a.id, name: a.name, currency: a.currency }));
  if (choose.pages || choose.accounts) return { gap: 'choose', choose };
  const page = { id: linked.id, name: linked.name };
  const ig = { id: linked.ig.id, username: linked.ig.username };
  if (!account) return { gap: 'ad_account', page, ig, inactive: accounts.length > 0 };
  return { gap: null, page, ig, account };
}

/**
 * THE SUCCESS LINE (the chair's yes, CE-46, 30 Sept 2026, after e-242 closed unanswerable). PURE.
 * The scopes granted and how the Page was found (me/accounts, a portfolio's owned_pages or client_pages; chooser or
 * not). It carries no token and no id but the Page's own: never her Facebook user id, an ad account, or a vendor.
 */
function connectedLine({ scopes = [], g = null, trace = [] }) {
  const via = (id) => { const t = trace.find((x) => x.id === String(id)); return t ? t.via : 'unknown'; };
  const parts = [`scopes=${scopes.slice().sort().join(',') || 'none'}`];
  if (!g) parts.push('pages=unread');
  else if (g.gap === 'scopes') parts.push(`missing=${(g.missing || []).join(',')}`);
  else if (g.gap === 'page') parts.push('page=none');
  else if (g.gap === 'choose') {
    if (g.choose.pages) parts.push(`chooser=pages (${g.choose.pages.length}: ${g.choose.pages.map((p) => `${p.id} via ${via(p.id)}`).join('; ')})`);
    if (g.choose.accounts) parts.push(`chooser=accounts (${g.choose.accounts.length})`);
  } else if (g.page) {
    parts.push(`page=${g.page.id} "${g.page.name}" via ${via(g.page.id)}`);
    parts.push(g.gap === 'link' ? 'no Instagram link' : 'chooser=no');
    if (g.gap === 'ad_account') parts.push('no active ad account');
  }
  return `[ads:callback] connected: ${parts.join('; ')}`;
}

module.exports = { MetaError, exchangeCode, longLived, me, grantedScopes, pages, pageToken, adAccounts, gapsFrom, connectedLine, NEEDED_SCOPES, ACTIVE };

// ── THE BOOST (cut 1: a MESSAGES ad from one of her Instagram posts into her Instagram Direct) ─────────────────────
// Field names quoted from Meta's "Ads that Click to Instagram" (read 28 September 2026): campaign objective
// OUTCOME_ENGAGEMENT with special_ad_categories []; ad set destination_type INSTAGRAM_DIRECT, optimization_goal
// CONVERSATIONS, billing_event IMPRESSIONS, daily_budget in the account currency's minor units, promoted_object
// { page_id }; creative from her post: object_id <PAGE_ID>, instagram_user_id, source_instagram_media_id,
// call_to_action { type INSTAGRAM_MESSAGE, value { link 'https://www.instagram.com' } }; ad created PAUSED, set ACTIVE
// only on her Run tap, then Meta reviews it (effective_status PENDING_REVIEW). Every POST below is created PAUSED;
// nothing here spends until activate() runs, and activate() is called only from the door's second tap.

async function post(fetchImpl, step, url, token, form) {
  const body = new URLSearchParams();
  for (const [k, val] of Object.entries(form)) body.set(k, typeof val === 'string' ? val : JSON.stringify(val));
  const res = await fetchImpl(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  let b = null;
  try { b = await res.json(); } catch (_e) { b = null; }
  if (!res.ok || (b && b.error)) {
    const err = new MetaError(step, res.status, b);
    console.warn(`[ads:meta] ${step} refused (${res.status}${err.code !== null ? `, ${err.code}` : ''}): ${err.message}`);
    throw err;
  }
  return b;
}

/** Her posts with Meta's boost eligibility (instagram_basic). Saves are NOT readable on this token; see the header. */
async function igMedia({ token, igUserId, env = process.env, fetchImpl, limit = 25 }) {
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,boost_eligibility_info';
  const b = await call(fetchImpl, 'ig_media', `${v(env)}/${encodeURIComponent(igUserId)}/media?fields=${encodeURIComponent(fields)}&limit=${limit}`, token);
  return (b && Array.isArray(b.data) ? b.data : []).filter((m) => m && m.id).map((m) => ({
    // cut1f: a reel's media_url is the video file, which an <img> cannot draw; its cover picture is thumbnail_url.
    id: String(m.id), caption: m.caption || '', type: m.media_type || null,
    url: (m.media_type === 'VIDEO' || m.media_type === 'REELS') ? (m.thumbnail_url || m.media_url || null) : (m.media_url || m.thumbnail_url || null),
    permalink: m.permalink || null, at: m.timestamp || null,
    likes: m.like_count === undefined ? null : Number(m.like_count) || 0, comments: m.comments_count === undefined ? null : Number(m.comments_count) || 0,
    eligible: !!(m.boost_eligibility_info && m.boost_eligibility_info.eligible_to_boost),
    source: 'instagram',
  }));
}

/** G4: her Facebook Page's latest posts, read with the Page token (pages_read_engagement). Each opens in the app. */
async function pagePosts({ token, pageId, env = process.env, fetchImpl, limit = 12 }) {
  const fields = 'id,message,full_picture,created_time,permalink_url';
  const b = await call(fetchImpl, 'page_posts', `${v(env)}/${encodeURIComponent(pageId)}/posts?fields=${encodeURIComponent(fields)}&limit=${limit}`, token);
  return (b && Array.isArray(b.data) ? b.data : []).filter((m) => m && /^[0-9]+_[0-9]+$/.test(String(m.id))).map((m) => ({
    id: String(m.id), caption: m.message || '', type: 'FACEBOOK', url: m.full_picture || null, permalink: m.permalink_url || null,
    at: m.created_time || null, likes: null, comments: null, eligible: !!m.full_picture, source: 'facebook',
  }));
}

/** The account's facts the card prints FIRST (A-45.15): currency and Meta's minimum daily budget, both from Meta. */
async function accountFacts({ token, adAccountId, env = process.env, fetchImpl }) {
  const b = await call(fetchImpl, 'account', `${v(env)}/${encodeURIComponent(adAccountId)}?fields=currency,min_daily_budget,account_status,name`, token);
  const min = Number(b && b.min_daily_budget);
  return { currency: (b && b.currency) || null, minDailyMinor: Number.isFinite(min) && min > 0 ? min : null, status: Number(b && b.account_status), name: (b && b.name) || '' };
}

/**
 * Campaign, ad set, creative, ad: all PAUSED. `adset` is targeting.js's adsetFields() (her settings, validated);
 * `welcome` her greeting and quick questions (page_welcome_message, Meta's VISUAL_EDITOR shape as quoted on the
 * click-to-Instagram page). Returns the four ids; the caller stores them before anything runs.
 */
async function createPaused({ token, adAccountId, pageId, igUserId, mediaId, source = 'instagram', adset, welcome, env = process.env, fetchImpl, now = Date.now() }) {
  const fb = source === 'facebook';
  const base = `${v(env)}/${encodeURIComponent(adAccountId)}`;
  const tag = `TDW ${new Date(now).toISOString().slice(0, 10)}`;
  const campaign = await post(fetchImpl, 'campaign', `${base}/campaigns`, token,
    { name: `${tag} messages`, objective: 'OUTCOME_ENGAGEMENT', status: 'PAUSED', special_ad_categories: [] });
  const set = await post(fetchImpl, 'adset', `${base}/adsets`, token, {
    ...adset, name: `${tag} messages`, campaign_id: String(campaign.id), status: 'PAUSED',
    billing_event: 'IMPRESSIONS', optimization_goal: 'CONVERSATIONS', destination_type: fb ? 'MESSENGER' : 'INSTAGRAM_DIRECT',
    promoted_object: { page_id: pageId },
  });
  const creativeForm = fb
    ? { name: `${tag} page post`, object_story_id: mediaId, instagram_user_id: igUserId,
      call_to_action: { type: 'MESSAGE_PAGE', value: { app_destination: 'MESSENGER' } } }
    : { name: `${tag} post`, object_id: pageId, instagram_user_id: igUserId, source_instagram_media_id: mediaId,
      call_to_action: { type: 'INSTAGRAM_MESSAGE', value: { link: 'https://www.instagram.com' } } };
  if (welcome && (welcome.text || (welcome.icebreakers || []).length)) {
    creativeForm.page_welcome_message = { type: 'VISUAL_EDITOR', version: 2, landing_screen_type: 'welcome_message', media_type: 'text',
      text_format: { customer_action_type: 'ice_breakers', message: { text: welcome.text || 'Hello! Can I get more info on this?',
        ice_breakers: (welcome.icebreakers || []).map((t) => ({ title: t })) } } };
  }
  const creative = await post(fetchImpl, 'creative', `${base}/adcreatives`, token, creativeForm);
  const ad = await post(fetchImpl, 'ad', `${base}/ads`, token,
    { name: `${tag} ad`, adset_id: String(set.id), creative: { creative_id: String(creative.id) }, status: 'PAUSED' });
  return { campaignId: String(campaign.id), adsetId: String(set.id), creativeId: String(creative.id), adId: String(ad.id), endsAt: adset.end_time };
}

// ── MANAGEMENT (R-46.12: every ad she ran, after it runs) ──────────────────────────────────────────────────────────
/** Change the daily or total amount and/or the end, on the ad set. Only the fields she changed are sent. */
async function updateAdset({ token, adsetId, dailyMinor, lifetimeMinor, endTime, env = process.env, fetchImpl }) {
  const form = {};
  if (dailyMinor) form.daily_budget = String(dailyMinor);
  if (lifetimeMinor) form.lifetime_budget = String(lifetimeMinor);
  if (endTime) form.end_time = endTime;
  if (!Object.keys(form).length) return { changed: false };
  await post(fetchImpl, 'adset_update', `${v(env)}/${encodeURIComponent(adsetId)}`, token, form);
  return { changed: true };
}

/** Meta's option lists, read at run time (R-46.12: never hard-coded). type in adgeolocation | adlocale | adinterest |
 *  adTargetingCategory (class life_events). */
const SEARCH_TYPES = Object.freeze({ places: 'adgeolocation', languages: 'adlocale', interests: 'adinterest', life_events: 'adTargetingCategory' });
async function search({ token, kind, q, env = process.env, fetchImpl }) {
  const type = SEARCH_TYPES[kind];
  if (!type) return [];
  const p = new URLSearchParams({ type, limit: '25' });
  if (kind === 'life_events') p.set('class', 'life_events'); else p.set('q', String(q || '').slice(0, 60));
  if (kind === 'places') { p.set('location_types', JSON.stringify(['city', 'region', 'country', 'zip'])); }
  const b = await call(fetchImpl, `search_${kind}`, `${v(env)}/search?${p}`, token);
  const rows = b && Array.isArray(b.data) ? b.data : [];
  if (kind === 'places') return rows.filter((r) => r && r.key).map((r) => ({ type: r.type, key: String(r.key), name: [r.name, r.region, r.country_name].filter(Boolean).join(', ') }));
  if (kind === 'languages') return rows.filter((r) => r && r.key !== undefined).map((r) => ({ id: Number(r.key), name: r.name }));
  const list = rows.filter((r) => r && r.id).map((r) => ({ id: String(r.id), name: r.name, size: r.audience_size_lower_bound || r.audience_size || null }));
  return kind === 'life_events' && q ? list.filter((r) => String(r.name).toLowerCase().includes(String(q).toLowerCase())) : list;
}

/** Her second tap: the three objects go ACTIVE together; Meta then reviews the ad. */
async function setRunning({ token, ids, active, env = process.env, fetchImpl }) {
  const status = active ? 'ACTIVE' : 'PAUSED';
  for (const [step, id] of [['campaign_status', ids.campaignId], ['adset_status', ids.adsetId], ['ad_status', ids.adId]]) {
    await post(fetchImpl, step, `${v(env)}/${encodeURIComponent(id)}`, token, { status });
  }
  return { status };
}

async function adState({ token, adId, env = process.env, fetchImpl }) {
  const b = await call(fetchImpl, 'ad_state', `${v(env)}/${encodeURIComponent(adId)}?fields=status,effective_status`, token);
  return { status: b && b.status, effective: b && b.effective_status };
}

/** Day by day: reach, spend (the account's major units as Meta returns them), and the conversations Meta counts. */
async function insightsByDay({ token, adId, env = process.env, fetchImpl }) {
  const b = await call(fetchImpl, 'insights',
    `${v(env)}/${encodeURIComponent(adId)}/insights?fields=impressions,reach,clicks,spend,actions&time_increment=1&date_preset=maximum`, token);
  return (b && Array.isArray(b.data) ? b.data : []).map((d) => {
    const conv = (Array.isArray(d.actions) ? d.actions : []).find((a) => a && /messaging_conversation_started/.test(String(a.action_type)));
    return { day: d.date_start, impressions: Number(d.impressions) || 0, reach: Number(d.reach) || 0, clicks: Number(d.clicks) || 0,
      spend: d.spend !== undefined ? Number(d.spend) : 0, conversations: conv ? Number(conv.value) || 0 : 0 };
  });
}

/** Saves and reach of one post (instagram_manage_insights, added by the founder 28 September). null when Meta has none. */
async function mediaInsights({ token, mediaId, env = process.env, fetchImpl }) {
  try {
    const b = await call(fetchImpl, 'media_insights', `${v(env)}/${encodeURIComponent(mediaId)}/insights?metric=saved,reach`, token);
    const got = {};
    for (const m of (b && Array.isArray(b.data) ? b.data : [])) {
      const val = m && Array.isArray(m.values) && m.values[0] ? Number(m.values[0].value) : Number(m && m.total_value && m.total_value.value);
      if (m && m.name && Number.isFinite(val)) got[m.name] = val;
    }
    return (got.saved !== undefined || got.reach !== undefined) ? { saves: got.saved || 0, reach: got.reach || 0 } : null;
  } catch (e) {
    if (e && e.tokenDead) throw e;
    return null;   // a new post, or under Meta's thresholds: the fallback speaks likes and comments
  }
}

/**
 * The post to boost first, PURE. Among eligible posts of the last 30 days (all eligible posts if none are that recent):
 *   by SAVES, then reach, when Meta gave insights for at least one of them  -> basis 'saves' (the founder's S3 words);
 *   else by likes plus comments                                              -> basis 'likes' (his fallback words, yes 28 September).
 * Newest wins a tie. None eligible gives null.
 */
function suggest(media, now = Date.now()) {
  const month = now - 30 * 86400 * 1000;
  const pool = media.filter((m) => m.eligible);
  if (!pool.length) return null;
  const recent = pool.filter((m) => m.at && Date.parse(m.at) >= month);
  const from = recent.length ? recent : pool;
  const newer = (a, b) => Date.parse(b.at || 0) - Date.parse(a.at || 0);
  const withIns = from.filter((m) => m.insights);
  if (withIns.length) {
    const pick = withIns.slice().sort((a, b) => (b.insights.saves - a.insights.saves) || (b.insights.reach - a.insights.reach) || newer(a, b))[0];
    return { ...pick, basis: 'saves' };
  }
  const withLikes = from.filter((m) => Number.isFinite(m.likes) && Number.isFinite(m.comments) && (m.likes + m.comments) > 0);
  if (withLikes.length) {
    const pick = withLikes.slice().sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments) || newer(a, b))[0];
    return { ...pick, basis: 'likes' };
  }
  return { ...from.slice().sort(newer)[0], basis: 'newest' };
}

Object.assign(module.exports, { mediaInsights, igMedia, pagePosts, accountFacts, createPaused, updateAdset, search, SEARCH_TYPES, setRunning, adState, insightsByDay, suggest });
