'use strict';
// src/lib/partners/calls.js · CE-47 · PTN-A2-1 · one call as a partner sees it, and the link that opens it.
// The link token is DERIVED (HMAC of the send's id under PARTNER_SESSION_SECRET, label 'call:'), so the vendor's
// "Contact <partner>" and the partner's area can show the same link again; only its sha256 is stored (partner_sends).
// What a partner sees of the vendor: business name, trade, city and her Instagram link. NEVER her phone or email
// (rule K); a note she wrote is masked for numbers and emails before it leaves (words.maskNote).
const crypto = require('crypto');
const { instagramUrl, normalizeIgHandle } = require('./links');
const { roleWord, needsLine, payLine, maskNote, formatDateLong } = require('./words');
const { rolesLine } = require('../collab/social');
const BASE = 'https://thedreamwedding.in';
const tokenFor = (sendId, env = process.env) => (env.PARTNER_SESSION_SECRET && sendId
  ? crypto.createHmac('sha256', env.PARTNER_SESSION_SECRET).update(`call:${sendId}`).digest('base64url').slice(0, 32) : null);
const tokenHash = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
const callUrl = (token) => `${BASE}/partner/call/${token}`;
const stopUrl = (token) => `${BASE}/partner/call/${token}?do=stop`;
const pauseUrl = (token) => `${BASE}/partner/call/${token}?do=pause`;
const todayIST = (now = new Date()) => new Date(now.getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);

/** Load what a call needs: the post, its roles, the vendor's face. null if the post is gone. */
async function loadCall(sb, postId) {
  const { data: post } = await sb.from('collab_posts').select('id, vendor_id, requirement_type, event_date, city, pay_kind, budget_from, budget_to, details, state, first_look_until').eq('id', postId).maybeSingle();
  if (!post) return null;
  const { data: items } = await sb.from('collab_post_items').select('requirement_type, needed').eq('post_id', postId);
  const roles = (items && items.length ? items : [{ requirement_type: post.requirement_type, needed: 1 }]).map((i) => ({ role: i.requirement_type, needed: i.needed || 1 }));
  const { data: v } = await sb.from('vendors').select('business_name, category, instagram_handle').eq('id', post.vendor_id).maybeSingle();
  const ig = v ? normalizeIgHandle(v.instagram_handle) : null;
  const face = { name: (v && v.business_name) || 'A wedding vendor', trade: (v && rolesLine([{ requirement_type: v.category }])) || 'wedding vendor',
    instagram_handle: ig, instagram_url: ig ? instagramUrl(ig) : null };
  return { post, roles, face };
}
const isOpen = (post, now = new Date()) => !!post && post.state === 'open' && String(post.event_date) >= todayIST(now);

/** The call as words. No phone, no email, by construction. */
function callShape({ post, roles, face }, now = new Date()) {
  return { open: isOpen(post, now), vendor: face, needs: needsLine(roles), roles: roles.map((r) => ({ role: r.role, word: roleWord(r.role), needed: r.needed })),
    city: post.city, date_words: formatDateLong(post.event_date), pay_words: payLine(post.pay_kind, post.budget_from, post.budget_to),
    note: maskNote(post.details) };
}
module.exports = { BASE, tokenFor, tokenHash, callUrl, stopUrl, pauseUrl, todayIST, loadCall, isOpen, callShape };
