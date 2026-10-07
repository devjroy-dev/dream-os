'use strict';
// src/lib/hub/profiles.js · CE-47 · HUB-1 · ONE PAGE FOR EVERYONE (/c/<handle>).
// A vendor's page is made the first time she opens the Hub, from her own vendors row (name, city, craft, Instagram).
// Its handle is her Instagram handle when it is free, else a handle made from her business name. Every handle and
// website leaves this file as a link (the founder's rule), through PTN's one home for links (src/lib/partners/links.js).
const { instagramUrl, websiteUrl } = require('../partners/links');
const { isCollabRole } = require('../collab/roles');

const HANDLE = /^[a-z0-9._]{1,30}$/;
const OPEN_TO = Object.freeze(['paid', 'barter', 'credit_only']);
const OPEN_WORD = Object.freeze({ paid: 'Paid', barter: 'Barter', credit_only: 'Credit only' });
const COLS = 'id, owner_kind, vendor_id, org_id, user_id, handle, display_name, roles, city, open_to, instagram_handle, website, work_urls, check_state, created_at';

function toHandle(s) {
  const h = String(s || '').toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9._]+/g, '.').replace(/\.{2,}/g, '.').replace(/^\.+|\.+$/g, '').slice(0, 30);
  return HANDLE.test(h) ? h : null;
}

async function handleFree(sb, h) {
  const { data } = await sb.from('hub_profiles').select('id').eq('handle', h).maybeSingle();
  return !data;
}

async function freeHandle(sb, wants) {
  for (const w of wants) {
    const h = toHandle(w); if (!h) continue;
    if (await handleFree(sb, h)) return h;
    for (let i = 2; i <= 9; i += 1) { const t = `${h.slice(0, 28)}.${i}`; if (await handleFree(sb, t)) return t; }
  }
  return null;
}

/** Her page, made on first use. Never changes a page that exists. */
async function ensureVendorProfile(sb, vendorId) {
  const got = await sb.from('hub_profiles').select(COLS).eq('vendor_id', vendorId).maybeSingle();
  if (got.data) return got.data;
  const { data: v } = await sb.from('vendors').select('id, business_name, city, category, instagram_handle').eq('id', vendorId).maybeSingle();
  if (!v) throw new Error('no such vendor');
  const handle = await freeHandle(sb, [v.instagram_handle, v.business_name, `vendor.${String(v.id).slice(0, 8)}`]);
  const ig = v.instagram_handle && /^[A-Za-z0-9._]{1,30}$/.test(String(v.instagram_handle).replace(/^@+/, '')) ? String(v.instagram_handle).replace(/^@+/, '') : null;
  const row = { owner_kind: 'vendor', vendor_id: v.id, handle, display_name: String(v.business_name || 'TDW vendor').slice(0, 120),
    roles: isCollabRole(v.category) ? [v.category] : [], city: v.city || null, open_to: [], instagram_handle: ig };
  const ins = await sb.from('hub_profiles').insert(row).select(COLS).single();
  if (ins.error) { const again = await sb.from('hub_profiles').select(COLS).eq('vendor_id', vendorId).maybeSingle(); if (again.data) return again.data; throw new Error(ins.error.message); }
  return ins.data;
}

/** What a page shows to anyone: links built here, never plain handles. */
function publicCard(p) {
  return { handle: p.handle, name: p.display_name, kind: p.owner_kind, roles: p.roles || [], city: p.city || null,
    open_to: (p.open_to || []).filter((x) => OPEN_TO.includes(x)), open_to_words: (p.open_to || []).map((x) => OPEN_WORD[x]).filter(Boolean),
    checked: p.check_state === 'checked', label: p.check_state === 'checked' ? 'Checked by TDW' : 'Not yet checked by TDW',
    instagram: p.instagram_handle ? { handle: p.instagram_handle, url: instagramUrl(p.instagram_handle) } : null,
    website: p.website ? { url: websiteUrl(p.website) } : null,
    page_url: `https://thedreamwedding.in/c/${p.handle}`,
    work: Array.isArray(p.work_urls) ? p.work_urls.filter((u) => typeof u === 'string' && /^https:\/\/res\.cloudinary\.com\//.test(u)).slice(0, 12) : [] };
}

module.exports = { HANDLE, OPEN_TO, OPEN_WORD, COLS, toHandle, freeHandle, ensureVendorProfile, publicCard };
