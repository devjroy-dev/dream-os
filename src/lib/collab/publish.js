'use strict';
// src/lib/collab/publish.js · CE-47 · CLB-1 · POSTING A CALL ON TDW'S OWN INSTAGRAM AND THREADS.
// The house account is its own connection, apart from DEV440's (ruling 10): four Railway values, read at call time,
// never logged, never returned. Instagram uses Instagram Login's content publishing (App-LIVE,
// instagram_business_content_publish); Threads uses the Threads API (threads_content_publish). Under development
// access both work for TDW's own accounts only, which is all CLB-1 posts to: the house account (thedreamwedding_in) holds
// a role on App-LIVE, so its own posting needs no App Review.
// Every publish passes social.refuse() first (Rule 2). `fetchImpl` and `sleep` are injected so a bench never calls Meta.
const social = require('./social');
const { publicIdOf, CARD_FONTS, CARD_INK } = require('../vendor/postCards');

const IG_GRAPH = 'https://graph.instagram.com';
const THREADS_GRAPH = 'https://graph.threads.net/v1.0';
const igVersion = (env) => env.IG_GRAPH_VERSION || 'v26.0';

function houseOf(platform, env = process.env) {
  const id = platform === 'instagram' ? env.TDW_HOUSE_IG_USER_ID : env.TDW_HOUSE_THREADS_USER_ID;
  const token = platform === 'instagram' ? env.TDW_HOUSE_IG_TOKEN : env.TDW_HOUSE_THREADS_TOKEN;
  return id && token ? { id: String(id), token: String(token) } : null;
}

// ── CE-47 · CLB-2a · THE HOUSE TOKEN'S REFRESH, BESIDE houseOf ────────────────────────────────────────────────────
// A long-lived Instagram or Threads token lasts about 60 days. houseFor() reads collab_house_tokens (0197) first and the
// Railway value second, and refreshes a token older than REFRESH_AFTER_DAYS through Meta's own refresh call, storing
// the answer. A failed refresh is logged and the current token is used. The token is never logged or returned to a door.
// Refresh happens on use (every publish, and PTN's reads through houseFor); refreshHouseTokens() is the same work for
// a scheduled caller. Nothing schedules it in this package.
const REFRESH_AFTER_DAYS = 50;
const REFRESH_URL = {
  instagram: (t) => `${IG_GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(t)}`,
  threads: (t) => `https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${encodeURIComponent(t)}`,
};

async function houseFor(platform, supabase, deps = {}) {
  const env = deps.env || process.env; const fetchImpl = deps.fetch || fetch; const now = deps.now ? deps.now() : new Date();
  const base = houseOf(platform, env); if (!base) return null;
  let row = null;
  if (supabase) {
    try { const r = await supabase.from('collab_house_tokens').select('platform, token, refreshed_at').eq('platform', platform).maybeSingle(); row = r && !r.error ? r.data : null; } catch (_e) { row = null; }
  }
  let token = row && row.token ? row.token : base.token;
  const age = row && row.refreshed_at ? (now - new Date(row.refreshed_at)) / 86400000 : Infinity;
  if (supabase && age > REFRESH_AFTER_DAYS) {
    try {
      const r = await fetchImpl(REFRESH_URL[platform](token), { method: 'GET' });
      const body = await r.json().catch(() => null);
      if (r.ok && body && body.access_token) {
        token = String(body.access_token);
        const expires = Number(body.expires_in) > 0 ? new Date(now.getTime() + Number(body.expires_in) * 1000).toISOString() : null;
        await supabase.from('collab_house_tokens').upsert({ platform, token, refreshed_at: now.toISOString(), expires_at: expires }, { onConflict: 'platform' });
      } else {
        console.warn(`[collab:house] ${platform} token refresh refused: HTTP ${r.status}`);
      }
    } catch (e) { console.warn(`[collab:house] ${platform} token refresh failed: ${e && e.message}`); }
  }
  return { id: base.id, token };
}

async function refreshHouseTokens(supabase, deps = {}) {
  const out = {};
  for (const p of ['instagram', 'threads']) out[p] = !!(await houseFor(p, supabase, deps));
  return out;
}

/** The picture card: her first reference picture, filled to 4:5, the roles and the date on it in Graphite ink. */
function cardUrl(post, items, deps = {}) {
  const env = deps.env || process.env;
  const first = (post.reference_urls || [])[0];
  const pid = first ? publicIdOf({ url: first }) : '';
  if (!pid || !env.CLOUDINARY_CLOUD_NAME) return null;
  const cloudinary = deps.cloudinary || require('cloudinary').v2;
  const text = (s, size, hex) => ({ overlay: { font_family: CARD_FONTS.body, font_size: size, text: s }, color: `#${hex}`, width: 908, crop: 'fit' });
  return cloudinary.url(pid, {
    cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET,
    secure: true, sign_url: true, urlAnalytics: false, type: 'upload', format: 'jpg',
    transformation: [
      { width: 1080, height: 1350, crop: 'fill', gravity: 'auto' },
      { effect: 'gradient_fade', y: -0.5, background: `rgb:${CARD_INK['overlay-bg']}` },
      text(social.clean(`${social.dateWords(post.event_date)} · ${post.city || ''}`), 34, CARD_INK.metal), { flags: 'layer_apply', gravity: 'south_west', x: 86, y: 170 },
      text(social.clean(`Looking for: ${social.rolesLine(items)}`), 54, CARD_INK.ink), { flags: 'layer_apply', gravity: 'south_west', x: 86, y: 90 },
    ],
  });
}

async function call(fetchImpl, url, method = 'POST') {
  const r = await fetchImpl(url, { method });
  let body = null; try { body = await r.json(); } catch (_e) { body = null; }
  if (!r.ok || !body || body.error) {
    const msg = body && body.error && body.error.message ? String(body.error.message).slice(0, 200) : `HTTP ${r.status}`;
    const e = new Error(msg); e.meta = true; throw e;
  }
  return body;
}

/** Publish one share. Returns { media_id, permalink } or throws with a plain message. */
async function publishShare(share, deps = {}) {
  const env = deps.env || process.env; const fetchImpl = deps.fetch || fetch; const sleep = deps.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  const why = social.refuse(share.caption); if (why) throw new Error(why);
  if (share.account !== 'house') throw new Error('only TDW\u2019s own accounts post in this cut');
  const house = deps.supabase ? await houseFor(share.platform, deps.supabase, deps) : houseOf(share.platform, env); if (!house) throw new Error(`TDW's ${share.platform === 'instagram' ? 'Instagram' : 'Threads'} account is not connected on this service`);
  if (!share.image_url) throw new Error('the call has no picture to post');
  const q = (o) => new URLSearchParams({ ...o, access_token: house.token }).toString();
  if (share.platform === 'instagram') {
    const base = `${IG_GRAPH}/${igVersion(env)}`;
    const c = await call(fetchImpl, `${base}/${house.id}/media?${q({ image_url: share.image_url, caption: share.caption })}`);
    for (let i = 0; i < 10; i += 1) {
      const st = await call(fetchImpl, `${base}/${c.id}?${q({ fields: 'status_code' })}`, 'GET');
      if (st.status_code === 'FINISHED') break;
      if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') throw new Error(`Instagram could not take the picture (${st.status_code})`);
      await sleep(3000);
    }
    const p = await call(fetchImpl, `${base}/${house.id}/media_publish?${q({ creation_id: c.id })}`);
    const l = await call(fetchImpl, `${base}/${p.id}?${q({ fields: 'permalink' })}`, 'GET').catch(() => ({}));
    return { media_id: String(p.id), permalink: l.permalink || null };
  }
  if (share.platform === 'threads') {
    const c = await call(fetchImpl, `${THREADS_GRAPH}/${house.id}/threads?${q({ media_type: 'IMAGE', image_url: share.image_url, text: share.caption })}`);
    await sleep(30000);   // Threads asks for about 30 seconds between creating and publishing
    const p = await call(fetchImpl, `${THREADS_GRAPH}/${house.id}/threads_publish?${q({ creation_id: c.id })}`);
    const l = await call(fetchImpl, `${THREADS_GRAPH}/${p.id}?${q({ fields: 'permalink' })}`, 'GET').catch(() => ({}));
    return { media_id: String(p.id), permalink: l.permalink || null };
  }
  throw new Error('unknown platform');
}

module.exports = { houseOf, houseFor, refreshHouseTokens, REFRESH_AFTER_DAYS, cardUrl, publishShare, IG_GRAPH, THREADS_GRAPH };
