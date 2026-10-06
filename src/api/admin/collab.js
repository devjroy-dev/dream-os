'use strict';
// src/api/admin/collab.js · CE-47 · CLB-1 · THE ADMIN'S COLLAB ROOM: the queue for TDW's own accounts, the prospects,
// and "share this call". Cures F-44.300 (the admin collab page called this door when nothing served it).
//
//   GET   /api/v2/admin/collab                      the queue (queued shares) and the last 30 decided, each with its call
//   POST  /api/v2/admin/collab/shares/:id/approve   approve; the publish runs after the reply and writes its own result
//   POST  /api/v2/admin/collab/shares/:id/reject
//   GET   /api/v2/admin/collab/posts/:id/share-text  the words the admin copies to send a call personally
//   GET   /api/v2/admin/collab/prospects             POST /prospects   PATCH /prospects/:id
//
// RULE 2: the prospects list is NEVER read by a publish path (src/lib/collab never names collab_prospects; b210 pins it).
const crypto       = require('crypto');
const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const social  = require('../../lib/collab/social');
const publish = require('../../lib/collab/publish');
const { COOKIE_NAME, bearerFrom } = require('../../lib/adminSession');

function who(req) {
  const tok = bearerFrom(req) || (req.cookies && req.cookies[COOKIE_NAME]) || '';
  return `admin:${crypto.createHash('sha256').update(String(tok)).digest('hex').slice(0, 8)}`;
}
const SHARE_COLS = 'id, post_id, vendor_id, account, platform, state, caption, hashtags, image_url, permalink, error, decided_by, decided_at, published_at, created_at';
const POST_COLS = 'id, vendor_id, requirement_type, event_date, city, event_type, details, state';

async function withPosts(sb, shares) {
  const ids = [...new Set(shares.map((s) => s.post_id))]; const vids = [...new Set(shares.map((s) => s.vendor_id))];
  const posts = ids.length ? ((await sb.from('collab_posts').select(POST_COLS).in('id', ids)).data || []) : [];
  const vendors = vids.length ? ((await sb.from('vendors').select('id, business_name').in('id', vids)).data || []) : [];   // vendors has business_name, not name (F-0789 floor, SRV_4)
  const P = new Map(posts.map((p) => [p.id, p])); const V = new Map(vendors.map((v) => [v.id, v.business_name]));
  return shares.map((s) => ({ ...s, post: P.get(s.post_id) || null, vendor_name: V.get(s.vendor_id) || null }));
}

router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase;
  const q = await sb.from('collab_shares').select(SHARE_COLS).eq('state', 'queued').order('created_at', { ascending: true });
  if (q.error) return errRes(res, 503, q.error.message);
  const d = await sb.from('collab_shares').select(SHARE_COLS).neq('state', 'queued').order('created_at', { ascending: false }).limit(30);
  return okRes(res, { queue: await withPosts(sb, q.data || []), decided: await withPosts(sb, d.data || []) });
}));

async function shareOf(sb, id) {
  const { data } = await sb.from('collab_shares').select(SHARE_COLS).eq('id', id).maybeSingle();
  return data || null;
}

/** The publish, after the reply. Exported so a bench drives it with a fake Meta. */
async function runPublish(sb, share, deps = {}) {
  try {
    const r = await publish.publishShare(share, deps);
    await sb.from('collab_shares').update({ state: 'published', media_id: r.media_id, permalink: r.permalink, published_at: new Date().toISOString(), error: null }).eq('id', share.id);
    return { ok: true };
  } catch (e) {
    await sb.from('collab_shares').update({ state: 'failed', error: String((e && e.message) || 'failed').slice(0, 300) }).eq('id', share.id);
    return { ok: false, error: e && e.message };
  }
}

router.post('/shares/:id/approve', requireAdmin, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase;
  const s = await shareOf(sb, req.params.id); if (!s) return errRes(res, 404, 'No such share');
  if (s.state !== 'queued' && s.state !== 'failed') return errRes(res, 409, `This share is already ${s.state}`);
  const why = social.refuse(s.caption); if (why) return errRes(res, 400, why);
  const { error } = await sb.from('collab_shares').update({ state: 'approved', decided_by: who(req), decided_at: new Date().toISOString(), error: null }).eq('id', s.id);
  if (error) return errRes(res, 503, error.message);
  setImmediate(() => { runPublish(sb, { ...s, state: 'approved' }).catch(() => {}); });
  return okRes(res, { share: { id: s.id, state: 'approved' } });
}));

router.post('/shares/:id/reject', requireAdmin, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase;
  const s = await shareOf(sb, req.params.id); if (!s) return errRes(res, 404, 'No such share');
  if (s.state !== 'queued' && s.state !== 'failed') return errRes(res, 409, `This share is already ${s.state}`);
  const { error } = await sb.from('collab_shares').update({ state: 'rejected', decided_by: who(req), decided_at: new Date().toISOString() }).eq('id', s.id);
  if (error) return errRes(res, 503, error.message);
  return okRes(res, { share: { id: s.id, state: 'rejected' } });
}));

/** The words the admin copies. No account names (Rule 2 holds for what TDW sends, too). */
function shareText(post, items, permalink) {
  const lines = [`A TDW member is looking for: ${social.rolesLine(items)}`, `${social.dateWords(post.event_date)} · ${social.clean(post.city)}`];
  if (post.pay_kind) lines.push(social.PAY_WORD[post.pay_kind]);
  if (post.details) lines.push(social.clean(post.details));
  lines.push(permalink ? `See the call: ${permalink}` : 'Join TDW to answer: https://thedreamwedding.in');
  return lines.join('\n');
}

router.get('/posts/:id/share-text', requireAdmin, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase;
  const { data: post } = await sb.from('collab_posts').select('*').eq('id', req.params.id).maybeSingle();
  if (!post) return errRes(res, 404, 'No such call');
  const items = ((await sb.from('collab_post_items').select('requirement_type, note, position').eq('post_id', post.id).order('position')).data || []);
  const live = ((await sb.from('collab_shares').select('permalink').eq('post_id', post.id).eq('state', 'published').eq('platform', 'instagram').limit(1)).data || [])[0];
  return okRes(res, { text: shareText(post, items.length ? items : [{ requirement_type: post.requirement_type }], live && live.permalink) });
}));

const handle = (h) => (h == null ? null : String(h).replace(/^@+/, '').trim().slice(0, 60) || null);
const PROSPECT_COLS = 'id, name, craft, city, instagram_handle, threads_handle, source, opted_out, created_at';

router.get('/prospects', requireAdmin, asyncHandler(async (req, res) => {
  const { data, error } = await req.app.locals.supabase.from('collab_prospects').select(PROSPECT_COLS).order('created_at', { ascending: false });
  if (error) return errRes(res, 503, error.message);
  return okRes(res, { prospects: data || [] });
}));

router.post('/prospects', requireAdmin, asyncHandler(async (req, res) => {
  const b = req.body || {}; const name = String(b.name || '').trim();
  if (!name) return errRes(res, 400, 'A name is needed');
  const row = { name: name.slice(0, 120), craft: b.craft ? String(b.craft).slice(0, 60) : null, city: b.city ? String(b.city).slice(0, 60) : null,
    instagram_handle: handle(b.instagram_handle), threads_handle: handle(b.threads_handle), source: b.source ? String(b.source).slice(0, 120) : null };
  const { data, error } = await req.app.locals.supabase.from('collab_prospects').insert(row).select(PROSPECT_COLS).single();
  if (error) return errRes(res, 503, error.message);
  return okRes(res, { prospect: data });
}));

router.patch('/prospects/:id', requireAdmin, asyncHandler(async (req, res) => {
  const b = req.body || {}; const patch = {};
  if (b.opted_out !== undefined) patch.opted_out = b.opted_out === true;
  for (const k of ['name', 'craft', 'city', 'source']) if (b[k] !== undefined) patch[k] = b[k] == null ? null : String(b[k]).slice(0, 120);
  for (const k of ['instagram_handle', 'threads_handle']) if (b[k] !== undefined) patch[k] = handle(b[k]);
  if (!Object.keys(patch).length) return errRes(res, 400, 'Nothing to change');
  const { data, error } = await req.app.locals.supabase.from('collab_prospects').update(patch).eq('id', req.params.id).select(PROSPECT_COLS).maybeSingle();
  if (error) return errRes(res, 503, error.message);
  if (!data) return errRes(res, 404, 'No such prospect');
  return okRes(res, { prospect: data });
}));

module.exports = router;
module.exports.runPublish = runPublish;
module.exports.shareText = shareText;
