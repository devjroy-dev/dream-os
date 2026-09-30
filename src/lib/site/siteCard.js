// src/lib/site/siteCard.js · TDW · CE-47 · WEB-4 cut 3 · WHAT THE PUBLIC CARD CARRIES FOR HER SITE.
//
// The field list is CE-47's, accepted 30 September 2026 (A to E, and the gaps 3, 5 to 9). This module SHAPES; the
// route (src/api/public/vendorCard.js) reads. Every output field is built by name from named inputs: a stored row is
// never spread, so no column reaches the wire by accident (the card's own law). Nothing here returns her tier, the
// `can` map, rate_min or rate_max, rate_display, approval_state, or any id of a row.
//
// THE RULES IT HOLDS:
//  · Basic keeps today's one-page site: `site` is today's four fields plus `v: 'classic'` (b148 3.1 by label), and the
//    new top-level fields are empty. The classic `packages` is today's, byte for byte (Q4 does not touch it).
//  · Essential and up: `site` is the six-style site from siteModel.resolveSite, shaped here.
//  · A published look appears only once it has an approved photograph (gap 6); pending and rejected ones never show.
//  · A picture she did not have approved never reaches a public page: cover slides and band photos are kept only when
//    their address is one of her approved photographs (portfolio or look).
//  · Prices follow rate_display (the founder's ruling). On the styles site a package row shows its figure only at or
//    above her starting price (Q4); the room is told which rows are below it (packagesBelowStart).
//  · Testimonials: approved only; a row with no request_id and no submitted_at is never shown (not the client's own
//    words, ruling 2); a video only where her plan opens video testimonials.
//  · eliza: strings, never a guess (gap 9). site.seo carries the home page's own search fields (gap 8).
// TOTAL: every export answers for any input and never throws.
'use strict';

const siteModel = require('./siteModel');
const limits = require('./limits');

const SITE_BASE = 'https://thedreamwedding.in';
const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const str = (v) => (typeof v === 'string' ? v : '');
const rank = (t) => ({ basic: 0, essential: 1, signature: 2, prestige: 3 }[siteModel.tierOf(t)]);
const text = (key, v) => { const r = limits.field(key, v); return r.ok ? r.value : null; };
const list = (key, v) => { const r = limits.list(key, v); return r.ok ? r.value : []; };
const num = (v) => { if (typeof v !== 'number' && typeof v !== 'string') return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const HTTPS = /^https:\/\//;

/** A Cloudinary address at a given width; any other https address unchanged; anything else null. */
function sized(url, w) {
  const u = str(url);
  if (!HTTPS.test(u)) return null;
  if (!/res\.cloudinary\.com\/.+\/upload\//.test(u) || !(w > 0)) return u;
  return u.replace('/upload/', `/upload/w_${Math.round(w)},c_limit/`);
}

/** A photograph as the renderer reads it. Built by name; the row's ids and states stay behind. */
function photoOf(row) {
  const r = obj(row); const url = str(r.image_url || r.url);
  if (!HTTPS.test(url)) return null;
  const fp = limits.focal({ x: r.focal_portrait_x, y: r.focal_portrait_y });
  const fl = limits.focal({ x: r.focal_landscape_x, y: r.focal_landscape_y });
  return { url, w: num(r.width), h: num(r.height), focal_portrait: fp, focal_landscape: fl, alt: text('photo_alt', r.alt), caption: text('photo_caption', r.caption) };
}

/** Group approved look photos by look, in their own order. */
function photosByLook(photoRows) {
  const m = new Map();
  for (const p of arr(photoRows)) {
    const r = obj(p); if (!r.look_id || r.deleted_at || (r.approval_state && r.approval_state !== 'approved')) continue;
    const ph = photoOf(r); if (!ph) continue;
    if (!m.has(r.look_id)) m.set(r.look_id, []);
    m.get(r.look_id).push({ pos: num(r.position) || 0, ph });
  }
  for (const [k, v] of m) m.set(k, v.sort((a, b) => a.pos - b.pos).map((x) => x.ph));
  return m;
}

/** The looks that may show: published, not deleted, with at least one approved photograph; at most 60, her order. */
function liveLooks(lookRows, photoMap) {
  return arr(lookRows).map(obj)
    .filter((l) => l.id && l.status !== 'draft' && l.published_at && !l.deleted_at && limits.SLUG.test(str(l.slug)) && (photoMap.get(l.id) || []).length > 0)
    .sort((a, b) => (num(a.position) || 0) - (num(b.position) || 0))
    .slice(0, limits.COUNTS.published_looks);
}

function fromPriceOf(look, rateDisplay) {
  if (rateDisplay === false) return null;
  const r = limits.fromPrice(look.from_price_text);
  return r.ok ? r.text : null;
}

/**
 * THE ONE VIDEO-LINK RULE (look videos and client testimonials): https, at most 300 characters, and one of
 * youtube.com, www.youtube.com, m.youtube.com, youtu.be (youtube) or instagram.com, www.instagram.com (instagram).
 * Returns the kind, or null. m.youtube.com is the phone's own address for the same video; accepted (CE-47, r2).
 */
function videoKind(url) {
  const u = typeof url === 'string' ? url.trim() : '';
  if (!u || u.length > 300) return null;
  if (/^https:\/\/((www|m)\.)?youtube\.com\//.test(u) || /^https:\/\/youtu\.be\//.test(u)) return 'youtube';
  if (/^https:\/\/(www\.)?instagram\.com\//.test(u)) return 'instagram';
  return null;
}

/** A YouTube video's still, from its address (watch, youtu.be, shorts, embed; www. or m.); else null. Cut 5. */
function posterOf(url) {
  if (videoKind(url) !== 'youtube') return null;
  const m = /(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{11})(?:[?&#/]|$)/.exec(String(url));
  return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : null;
}

function videosOf(v) {
  return arr(v).map(obj).map((x) => {
    const url = str(x.url);
    const kind = videoKind(url);
    return kind ? { kind, url, duration_s: num(x.duration_s), title: text('video_title', x.title) } : null;
  }).filter(Boolean).slice(0, limits.COUNTS.videos_per_look);
}

/** C · a look's summary for the home page and collections. */
function lookSummary(l, photoMap, rateDisplay, now) {
  const photos = photoMap.get(l.id) || []; const vids = videosOf(l.videos);
  return {
    slug: l.slug, title: text('look_title', l.title), category: text('category', l.category), year_label: text('look_year', l.year_label),
    from_price: fromPriceOf(l, rateDisplay), is_new: siteModel.isNew(l, now),
    // second (cut 5, WEB-5's port): the look's second approved photograph, or null
    cover: photos[0] || null, second: photos[1] || null, photo_count: photos.length, has_video: vids.length > 0, video_duration_s: vids[0] ? vids[0].duration_s : null,
  };
}

/** The addresses of every picture she has had approved (portfolio and looks): the only pictures a page may show. */
function approvedUrls(portfolioRows, photoMap) {
  const s = new Set();
  for (const r of arr(portfolioRows)) { const u = str(obj(r).image_url); if (HTTPS.test(u)) s.add(u); }
  for (const phs of photoMap.values()) for (const p of phs) s.add(p.url);
  return s;
}

function coverOf(stored, okUrls) {
  return arr(stored).map(obj).map((c) => {
    const p = obj(c.photo); const url = str(p.url);
    if (!okUrls.has(url)) return null;
    const t = obj(c.target); const kinds = ['look', 'collection', 'category', 'section'];
    return {
      photo: { url, w: num(p.w), h: num(p.h), focal_portrait: limits.focal(p.focal_portrait), focal_landscape: limits.focal(p.focal_landscape), alt: text('photo_alt', p.alt) },
      eyebrow: text('cover_eyebrow', c.eyebrow), headline: text('cover_headline', c.headline), emphasis: text('cover_headline', c.emphasis),
      button: text('cover_button', c.button),
      target: kinds.includes(t.kind) && typeof t.ref === 'string' && t.ref.length <= 80 ? { kind: t.kind, ref: t.ref } : null,
    };
  }).filter(Boolean).slice(0, limits.COUNTS.cover_slides);
}

function copyOf(stored, okUrls) {
  const c = obj(stored); const sp = obj(c.studio_photo);
  return {
    intro: text('intro', c.intro), announcements: list('announcement', c.announcements), categories: list('category', c.categories),
    studio_heading: text('studio_heading', c.studio_heading), studio_body: text('studio_body', c.studio_body),
    studio_photo: okUrls.has(str(sp.url)) ? { url: sp.url, focal_portrait: limits.focal(sp.focal_portrait), focal_landscape: limits.focal(sp.focal_landscape), alt: text('photo_alt', sp.alt) } : null,
    pricing_note: text('pricing_note', c.pricing_note), enquire_line: text('enquire_line', c.enquire_line), cities: text('cities', c.cities),
    destinations: list('destination', c.destinations), rolling_words: list('rolling_word', c.rolling_words),
  };
}

/** A section's own body, by key; nothing else of the stored object travels. */
function bodyOf(key, body, okUrls) {
  const b = obj(body);
  if (key === 'band') {
    const photos = arr(b.photos).map(obj).filter((p) => okUrls.has(str(p.url))).slice(0, limits.COUNTS.band_photos)
      .map((p) => ({ url: p.url, focal_portrait: limits.focal(p.focal_portrait), focal_landscape: limits.focal(p.focal_landscape), alt: text('photo_alt', p.alt) }));
    // cut 5 (WEB-5's port): the band's one photo and its button, beside the lines, words and destinations it had
    return { lines: list('band_line', b.lines), words: list('rolling_word', b.words), destinations: list('destination', b.destinations),
      photos, photo: photos[0] || null, button: text('cover_button', b.button) };
  }
  if (siteModel.CUSTOM_KEY.test(key)) return { text: text('studio_body', b.text) };
  return {};
}

/** Q4, the styles site only: a figure shows when her page shows prices and the row is at or above her starting price. */
function stylesPackages(classicPackages, rows, rateDisplay, rateMin) {
  const floor = num(rateMin);
  return arr(classicPackages).map((p, i) => {
    const total = p.total;
    const shown = rateDisplay !== false && total != null && !(floor > 0 && total < floor);
    return { name: p.name, description: p.description, total: shown ? total : null, items: p.items };
  });
}

/** For her room ("What to fix"): the packages whose figure is hidden because it is below her starting price. */
function packagesBelowStart(rows, rateDisplay, rateMin) {
  try {
  const floor = num(rateMin);
  if (rateDisplay === false || !(floor > 0)) return [];
  return arr(rows).map(obj).filter((r) => !r.deleted_at && r.name && Number.isFinite(r.total) && r.total < floor)
    .map((r) => ({ package_id: typeof r.id === 'string' ? r.id : null, name: String(r.name) }));
  } catch (_e) { return []; }
}

/** Gap 9 · what Eliza's panel may promise, as words. */
function elizaFor(tier) {
  const r = rank(tier);
  return { live_booking: r >= 2 ? 'coming_soon' : 'not_in_plan', own_voice: r >= 3 ? 'coming_soon' : 'not_in_plan' };
}

/** C · testimonials: approved, the client's own (request_id or submitted_at), video only where her plan opens it. */
function testimonialsOf(tier, rows) {
  const r = rank(tier); if (r < 1) return [];
  const video = r >= 2;
  return arr(rows).map(obj)
    .filter((t) => t.state === 'approved' && !t.deleted_at && (t.request_id || t.submitted_at))
    .sort((a, b) => (num(a.position) || 0) - (num(b.position) || 0))
    .map((t) => {
      const words = text('client_words', t.body);
      const v = video && HTTPS.test(str(t.video_url)) ? { url: t.video_url, duration_s: num(t.video_duration_s), title: text('video_title', t.video_title), poster: posterOf(t.video_url) } : null;
      if (!words && !v) return null;
      const m = /^(\d{4})-(\d{2})/.exec(str(t.event_month));
      return { name: text('client_name', t.author), occasion: text('client_occasion', t.occasion), month: m ? `${m[1]}-${m[2]}` : null,
        place: text('client_place', t.place), words, video: v };
    }).filter(Boolean);
}

function faqOf(rows) {
  return arr(rows).map(obj).filter((q) => !q.deleted_at)
    .sort((a, b) => (num(a.position) || 0) - (num(b.position) || 0))
    .map((q) => ({ question: text('faq_question', q.question), answer: text('faq_answer', q.answer) }))
    .filter((q) => q.question && q.answer).slice(0, limits.COUNTS.faq);
}

function collectionsOf(tier, rows, memberRows, liveById, photoById) {
  if (rank(tier) < 2) return [];
  const members = new Map();
  for (const m of arr(memberRows).map(obj)) {
    if (!liveById.has(m.look_id)) continue;
    if (!members.has(m.collection_id)) members.set(m.collection_id, []);
    members.get(m.collection_id).push({ pos: num(m.position) || 0, slug: liveById.get(m.look_id).slug });
  }
  return arr(rows).map(obj).filter((c) => c.id && !c.deleted_at && limits.SLUG.test(str(c.slug)))
    .sort((a, b) => (num(a.position) || 0) - (num(b.position) || 0))
    .map((c) => {
      const slugs = (members.get(c.id) || []).sort((a, b) => a.pos - b.pos).map((x) => x.slug);
      const cover = photoById.get(c.cover_photo_id) || null;
      return { slug: c.slug, name: text('collection_name', c.name), description: text('collection_text', c.description), cover, look_slugs: slugs };
    }).filter((c) => c.name && c.look_slugs.length);
}

/**
 * THE WHOLE SITE PART OF THE CARD. `input`:
 *   { tier, category, businessName, handle, about, meta, rateDisplay, rateMin, liveDomain, siteRow,
 *     sections, pages, looks, lookPhotos, collections, collectionLooks, testimonials, faq, portfolio, packages, now }
 * Returns { site, looks, collections, testimonials, faq, eliza, packages } where `packages` is the styles rule
 * applied to the classic list passed in (Basic gets that list back untouched).
 */
function siteCard(input) {
  const i = obj(input); const tier = siteModel.tierOf(i.tier); const row = obj(i.siteRow);
  const classicPackages = arr(i.packages);
  try {
    const resolved = siteModel.resolveSite({ tier, category: i.category, businessName: i.businessName, site: row, sections: i.sections, pages: i.pages });
    if (resolved.v === 'classic') {
      return { site: { v: 'classic', look: resolved.look, pages: resolved.pages, credit: resolved.credit, domain: i.liveDomain || null },
        looks: [], collections: [], testimonials: [], faq: [], eliza: elizaFor(tier), packages: classicPackages };
    }
    const photoMap = photosByLook(i.lookPhotos);
    const live = liveLooks(i.looks, photoMap);
    const liveById = new Map(live.map((l) => [l.id, l]));
    const photoById = new Map();
    for (const p of arr(i.lookPhotos).map(obj)) { if (p.id && p.approval_state === 'approved' && !p.deleted_at) { const ph = photoOf(p); if (ph) photoById.set(p.id, ph); } }
    const okUrls = approvedUrls(i.portfolio, photoMap);
    const looks = live.map((l) => lookSummary(l, photoMap, i.rateDisplay, i.now));
    const cover = coverOf(row.cover, okUrls);
    const handle = str(i.handle).toLowerCase();
    const canonical = resolved.can.own_domain && i.liveDomain ? `https://${i.liveDomain}` : `${SITE_BASE}/v/${handle}`;
    const meta = obj(i.meta);
    const seoImage = cover[0] ? sized(cover[0].photo.url, 1200) : (looks[0] && looks[0].cover ? sized(looks[0].cover.url, 1200) : null);
    const site = {
      v: 'styles', style: resolved.style, site_name: resolved.site_name, monogram: resolved.monogram, credit: resolved.credit, domain: i.liveDomain || null,
      palette: resolved.palette ? { id: resolved.palette.id, roles: resolved.palette.roles, extras: resolved.palette.extras } : null,
      fonts: resolved.font_pair ? { id: resolved.font_pair.id, display: resolved.font_pair.display, text: resolved.font_pair.text } : null,
      motion: resolved.motion, corners: resolved.corners, buttons: resolved.buttons, texture: resolved.texture,
      cover_mode: resolved.cover_mode, cover,
      sections: resolved.sections.filter((s) => s.shown).map((s) => ({ key: s.key, variant: s.variant, eyebrow: s.eyebrow, heading: s.heading, body: bodyOf(s.key, obj(arr(i.sections).find((x) => obj(x).key === s.key && !obj(x).page_id)).body, okUrls) })),
      pages: resolved.pages, trade: resolved.trade, copy: copyOf(row.copy, okUrls),
      seo: { title: str(meta.title) || resolved.site_name || null, description: str(meta.description) || null, image: seoImage, canonical },
    };
    return { site, looks, collections: collectionsOf(tier, i.collections, i.collectionLooks, liveById, photoById),
      testimonials: testimonialsOf(tier, i.testimonials), faq: faqOf(i.faq), eliza: elizaFor(tier),
      packages: stylesPackages(classicPackages, null, i.rateDisplay, i.rateMin) };
  } catch (_e) {
    return { site: { v: 'classic', look: 'quiet', pages: siteModel.pagesFor('basic', null), credit: true, domain: null },
      looks: [], collections: [], testimonials: [], faq: [], eliza: elizaFor('basic'), packages: classicPackages };
  }
}

/**
 * D · A LOOK'S OWN PAGE. `input` as siteCard's plus { slug, lookRow, creditVendors (rows: id, business_name,
 * routing_handle, status, discover_paused), packageRows (id, name) }. Returns the look, or null for every miss.
 */
function lookPage(input) {
  try {
    const i = obj(input); const tier = siteModel.tierOf(i.tier);
    if (rank(tier) < 1) return null;
    const photoMap = photosByLook(i.lookPhotos);
    const live = liveLooks(i.looks, photoMap);
    const l = live.find((x) => x.slug === i.slug);
    if (!l) return null;
    const photos = (photoMap.get(l.id) || []).slice(0, limits.COUNTS.photos_per_look);
    const vendors = new Map(arr(i.creditVendors).map(obj).map((v) => [v.id, v]));
    const credits = arr(l.credits).map(obj).map((c) => {
      const role = text('credit_role', c.role); if (!role) return null;
      const v = c.vendor_id ? vendors.get(c.vendor_id) : null;
      if (v && v.status === 'active' && v.discover_paused !== true && v.routing_handle) return { role, name: text('credit_text', v.business_name) || null, handle: String(v.routing_handle).toLowerCase() };
      const name = text('credit_text', c.text); return name ? { role, name, handle: null } : null;
    }).filter(Boolean).slice(0, limits.COUNTS.credits_per_look);
    const pkg = l.package_id ? arr(i.packageRows).map(obj).find((p) => p.id === l.package_id && !p.deleted_at) : null;
    const liveById = new Map(live.map((x) => [x.id, x]));
    let related = arr(l.related_ids).map((id) => liveById.get(id)).filter((x) => x && x.id !== l.id);
    if (!related.length) related = live.filter((x) => x.id !== l.id && x.category && x.category === l.category);
    related = related.slice(0, limits.COUNTS.related_per_look).map((x) => lookSummary(x, photoMap, i.rateDisplay, i.now));
    const share = photos.find((p, k) => arr(i.lookPhotos).map(obj).find((r) => r.id === l.share_photo_id && photoOf(r) && photoOf(r).url === p.url)) || photos[0];
    const description = text('look_description', l.description);
    return {
      slug: l.slug, title: text('look_title', l.title), category: text('category', l.category), year_label: text('look_year', l.year_label),
      description, included: list('look_included', l.included), from_price: fromPriceOf(l, i.rateDisplay),
      package: pkg ? { name: String(pkg.name) } : null, credits, videos: videosOf(l.videos), photos, related,
      seo: { title: text('seo_title', l.seo_title) || text('look_title', l.title), description: text('seo_description', l.seo_description) || (description ? Array.from(description).slice(0, 160).join('') : null), image: share ? sized(share.url, 1200) : null },
    };
  } catch (_e) { return null; }
}

module.exports = { posterOf, videoKind, siteCard, lookPage, packagesBelowStart, elizaFor, testimonialsOf, faqOf, photoOf, sized, SITE_BASE };
