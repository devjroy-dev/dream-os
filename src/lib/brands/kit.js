'use strict';
// src/lib/brands/kit.js · CE-47 · PRO · P3 · HER MEDIA KIT, the public read behind thedreamwedding.in/v/<code>/kit.
// THE RESPONSE SHAPE IS THE SECURITY BOUNDARY (vendorCard.js's law): every field is named here and nothing is spread
// from a row. The kit shows her name, trade, city, approved photographs, the weddings TDW verified, her Instagram
// follower count as TDW last read it (with the date), client words she has approved, and how a brand can reach her
// (the email she chose in the room, and her Instagram). No phone number, no money, no client's name beyond what a
// client approved for her website.
// Google reviews are NOT on the kit: TDW does not read Google reviews yet (the Google Business gate). The footer reads
// "Followers as of <date>.", the founder's line (8 October 2026) until TDW reads Google reviews; then his approved
// "Followers and reviews as of <date>." returns.
const { verifiedWeddings, todayIST } = require('../papers/verifiedWeddings');
const { tradeOf, WEDDINGS_NOTE, fullDate } = require('../papers/words');

const VENDOR_SELECT = 'id, business_name, category, city, routing_handle, instagram_handle, status, discover_paused';
const PHOTO_SELECT = 'image_url, caption, is_hero, position';
const WORDS_SELECT = 'author, body, place, position';
const MAX_PHOTOS = 8, MAX_WORDS = 3;
const IG = /^[A-Za-z0-9._]{1,30}$/;

/** The follower count, read again at most once an India day, through her own Instagram connection. Never throws. */
async function followers({ supabase, vendorId, kit, today, deps = {} }) {
  if (kit && kit.followers_on === today) return { count: kit.followers, on: kit.followers_on };
  const read = deps.readFollowers || (async () => {
    const t = await require('../vendor/igConnection').tokenForCall(supabase, vendorId);
    if (!t.ok) return null;
    const r = await Promise.race([require('../vendor/igOAuth').fetchFollowersCount(t.accessToken), new Promise((res) => setTimeout(() => res({ ok: false }), 4000))]);
    return r && r.ok && Number.isInteger(r.followers_count) ? r.followers_count : null;
  });
  let n = null; try { n = await read(); } catch (_e) { n = null; }
  if (n == null) return { count: kit ? kit.followers : null, on: kit ? kit.followers_on : null };
  try { await supabase.from('pro_kits').upsert({ vendor_id: vendorId, followers: n, followers_on: today, updated_at: new Date().toISOString() }, { onConflict: 'vendor_id' }); } catch (_e) { /* the page still shows */ }
  return { count: n, on: today };
}

/** The footer sentences under the figures. */
function footer(f) {
  return [WEDDINGS_NOTE, f && f.count != null && f.on ? `Followers as of ${fullDate(f.on)}.` : null].filter(Boolean);
}

/** The kit for a public code, or null when there is no such active vendor. */
async function kitFor({ supabase, code, now = Date.now(), deps = {} }) {
  const raw = String(code || '').trim();
  if (!/^[A-Za-z0-9_-]{2,32}$/.test(raw)) return null;
  const v = await supabase.from('vendors').select(VENDOR_SELECT).eq('routing_handle', raw.toUpperCase()).maybeSingle();
  if (v.error) throw new Error('vendors');
  if (!v.data || v.data.status !== 'active' || v.data.discover_paused === true) return null;
  const vendor = v.data; const today = todayIST(now);
  const [photos, words, kit, w] = await Promise.all([
    supabase.from('vendor_portfolio').select(PHOTO_SELECT).eq('vendor_id', vendor.id).neq('safety_state', 'held').order('position', { ascending: true })   /* CE-47 WEB-4 cut 30 (R-47.2): her kit shows what her own pages show, pictureRules.herPagesFilter */.order('created_at', { ascending: false }).limit(MAX_PHOTOS),
    supabase.from('vendor_testimonials').select(WORDS_SELECT).eq('vendor_id', vendor.id).eq('state', 'approved').is('deleted_at', null).order('position', { ascending: true }).limit(MAX_WORDS),
    supabase.from('pro_kits').select('contact_email, followers, followers_on').eq('vendor_id', vendor.id).maybeSingle(),
    verifiedWeddings({ supabase, vendorId: vendor.id, now }),
  ]);
  const f = await followers({ supabase, vendorId: vendor.id, kit: kit.data || null, today, deps });
  const handle = vendor.instagram_handle && IG.test(String(vendor.instagram_handle).replace(/^@/, '')) ? String(vendor.instagram_handle).replace(/^@/, '') : null;
  const email = kit.data && kit.data.contact_email ? kit.data.contact_email : null;
  return {
    name: (vendor.business_name || '').trim() || 'A TDW vendor',
    trade: tradeOf(vendor.category),
    city: (vendor.city || '').trim() || null,
    code: String(vendor.routing_handle).toLowerCase(),
    photos: (photos.data || []).map((p) => ({ image_url: p.image_url, caption: p.caption || null })),
    weddings: w.count == null ? null : w.count,
    followers: f.count, followers_on: f.on,
    words: (words.data || []).map((t) => ({ body: t.body, author: t.author, place: t.place || null })),
    contact: { email, email_link: email ? `mailto:${email}?subject=${encodeURIComponent('Collaboration enquiry')}` : null, instagram_url: handle ? `https://www.instagram.com/${handle}/` : null },
    footer: footer(f),
  };
}

module.exports = { kitFor, followers, footer, VENDOR_SELECT, PHOTO_SELECT, WORDS_SELECT };
