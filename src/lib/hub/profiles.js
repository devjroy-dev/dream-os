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

// ── HUB-2e · HER PAGE FOLLOWS HER TDW PROFILE (the chair's ruling, 8 Oct 2026: read through) ─────────────────
// A vendor's page is made once (ensureVendorProfile) and keeps a copy of her name, city and Instagram. Those three are
// read THROUGH from her vendors row wherever pages are loaded, so the page always says what her TDW profile says; the
// stored copy is only a fallback when her row cannot be read. The handle (her page's address, /c/<handle>) never follows:
// it stays fixed so links she has shared keep working. Roles, open to, website and pictures are hers to set on her page.
//
// R-47.2 (the founder, 8 Oct 2026): her pictures are hers. Any picture of hers in vendor_portfolio may go on her page,
// in any approval state, EXCEPT one the image safety check holds. WEB-4's contract will name the held state; it is added
// in HELD_STATES and nowhere else. Pictures in looks (vendor_look_photos) are never offered: only vendor_portfolio is read.
const HELD_STATES = Object.freeze(['held']);   // CE-47 WEB-4 cut 30 (R-47.2): pictureRules.SAFETY.HELD, read from safety_state
const PICTURE = /^https:\/\/res\.cloudinary\.com\/[^\s]+$/;
/** One home for "may this portfolio picture be on her page?" */
function pictureOnPage(row) {
  // If WEB-4's contract puts the held state in a column of its own, that column is read here and only here.
  return !!row && typeof row.image_url === 'string' && PICTURE.test(row.image_url) && !HELD_STATES.includes(row.safety_state);
}
const IG = /^[A-Za-z0-9._]{1,30}$/;
const igHandle = (h) => { const x = String(h || '').replace(/^@+/, ''); return IG.test(x) ? x : null; };

/** Her portfolio pictures that may go on her page, in her portfolio's order. */
async function pagePictures(sb, vendorId) {
  const { data, error } = await sb.from('vendor_portfolio').select('id, vendor_id, image_url, safety_state, position, created_at').eq('vendor_id', vendorId);
  if (error) throw new Error('Your portfolio could not be read. Please try again.');
  return (data || []).filter(pictureOnPage)
    .sort((x, y) => ((x.position ?? 1e9) - (y.position ?? 1e9)) || String(x.created_at || '').localeCompare(String(y.created_at || '')));
}

/** Pages as loaded, with each vendor's name, city and Instagram read through from her vendors row, and her pictures
 *  kept only while they are still in her portfolio. Pages of organisations and people are returned as they are. */
async function livePages(sb, rows) {
  const list = (rows || []).filter(Boolean);
  const vids = [...new Set(list.filter((p) => p.owner_kind === 'vendor' && p.vendor_id).map((p) => p.vendor_id))];
  if (!vids.length) return list;
  const [vr, pr] = await Promise.all([
    sb.from('vendors').select('id, business_name, city, instagram_handle').in('id', vids),
    sb.from('vendor_portfolio').select('vendor_id, image_url, safety_state').in('vendor_id', vids),
  ]);
  const byV = new Map(((vr && vr.data) || []).map((v) => [v.id, v]));
  const pics = new Map();
  for (const r of ((pr && pr.data) || [])) if (pictureOnPage(r)) { if (!pics.has(r.vendor_id)) pics.set(r.vendor_id, new Set()); pics.get(r.vendor_id).add(r.image_url); }
  const picsRead = !!(pr && !pr.error);
  return list.map((p) => {
    if (p.owner_kind !== 'vendor' || !p.vendor_id) return p;
    const v = byV.get(p.vendor_id);
    const out = { ...p };
    if (v) {
      if (v.business_name && String(v.business_name).trim()) out.display_name = String(v.business_name).trim().slice(0, 120);
      out.city = v.city || null;
      out.instagram_handle = igHandle(v.instagram_handle);
    }
    if (picsRead) { const ok = pics.get(p.vendor_id) || new Set(); out.work_urls = (p.work_urls || []).filter((u) => ok.has(u)); }
    return out;
  });
}

/** What a page shows to anyone: links built here, never plain handles. No check label (HUB-2). */
function publicCard(p) {
  return { handle: p.handle, name: p.display_name, kind: p.owner_kind, roles: p.roles || [], city: p.city || null,
    open_to: (p.open_to || []).filter((x) => OPEN_TO.includes(x)), open_to_words: (p.open_to || []).map((x) => OPEN_WORD[x]).filter(Boolean),
    // HUB-2 (CE-47, 7 Oct 2026): no check label. Nothing sets hub_profiles.check_state and no rule says what is checked,
    // so no check mark (neither "Verified" nor "Unverified", the founder's words of 7 Oct 2026) is returned until a
    // written rule and a setter exist.
    instagram: p.instagram_handle ? { handle: p.instagram_handle, url: instagramUrl(p.instagram_handle) } : null,
    website: p.website ? { url: websiteUrl(p.website) } : null,
    page_url: `https://thedreamwedding.in/c/${p.handle}`,
    work: Array.isArray(p.work_urls) ? p.work_urls.filter((u) => typeof u === 'string' && /^https:\/\/res\.cloudinary\.com\//.test(u)).slice(0, 12) : [] };
}

module.exports = { HANDLE, OPEN_TO, OPEN_WORD, COLS, toHandle, freeHandle, ensureVendorProfile, publicCard, livePages, pagePictures, pictureOnPage, HELD_STATES };
