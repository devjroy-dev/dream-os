// src/api/couple/discover.js
// Public discover endpoints — no auth required.
//   GET /api/v2/discover/feed
//   GET /api/v2/discover/featured
//   GET /api/v2/discover/heroes

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

const { waNumberFor } = require('../../lib/waNumbers');
const ENQUIRE_BASE = `https://wa.me/${waNumberFor('vendor')}?text=TDW-`;

// ── GET /feed ─────────────────────────────────────────────────────────────────
// Returns real vendors (discover_eligible=true) UNION demo vendors
// (discover_eligible=true AND active=true). Fully filtered on both sides —
// no cross-leakage possible. Demo vendors are identified by is_demo:true in
// the response so the client can render them identically.
router.get('/feed', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const category = req.query.category || null;
  const city     = req.query.city     || null;
  const budget   = req.query.budget   || null;
  const vibes    = req.query.vibes    || null;
  const page     = Math.max(0, parseInt(req.query.page,  10) || 0);
  const limit    = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset   = page * limit;

  // ── 1. Real vendors ────────────────────────────────────────────────────────
  let realQuery = supabase
    .from('vendors')
    .select('id, business_name, category, city, routing_handle, rate_min, aesthetic_tags, about', { count: 'exact' })
    .eq('discover_eligible', true);

  if (category) realQuery = realQuery.eq('category', category);
  if (city)     realQuery = realQuery.ilike('city', `%${city}%`);
  if (budget)   realQuery = realQuery.lte('rate_min', parseInt(budget, 10));
  if (vibes)    realQuery = realQuery.overlaps('aesthetic_tags', vibes.split(','));

  realQuery = realQuery.order('created_at', { ascending: false });

  const { data: realVendors, error: realError, count: realCount } = await realQuery;
  if (realError) {
    console.error('[GET /discover/feed] real vendors error:', realError.message);
    return errRes(res, 500, 'Feed unavailable.');
  }

  // Fetch approved portfolio photos for real vendors
  const realIds = (realVendors || []).map(v => v.id);
  let photoMap = {};
  if (realIds.length > 0) {
    const { data: photos } = await supabase
      .from('vendor_portfolio')
      .select('vendor_id, image_url')
      .in('vendor_id', realIds)
      .eq('approval_state', 'approved')
      .order('is_hero', { ascending: false })
      .order('created_at', { ascending: false });

    (photos || []).forEach(p => {
      if (!photoMap[p.vendor_id]) photoMap[p.vendor_id] = [];
      if (photoMap[p.vendor_id].length < 5) photoMap[p.vendor_id].push(p.image_url);
    });
  }

  const shapedReal = (realVendors || []).map(v => ({
    id:             v.id,
    name:           v.business_name  || null,
    category:       v.category       || null,
    city:           v.city           || null,
    routing_handle: v.routing_handle || null,
    starting_price: v.rate_min       || null,
    photos:         photoMap[v.id]   || [],
    vibe_tags:      v.aesthetic_tags || [],
    about:          v.about          || null,
    enquire_link:   v.routing_handle ? `${ENQUIRE_BASE}${v.routing_handle}` : null,
    is_demo:        false,
  }));

  // ── 2. Demo vendors (discover_eligible=true AND active=true only) ──────────
  let demoQuery = supabase
    .from('demo_vendors')
    .select('id, display_name, category, city, ig_handle, rate_display, photos, about')
    .eq('discover_eligible', true)
    .eq('active', true);

  if (category) demoQuery = demoQuery.eq('category', category);
  if (city)     demoQuery = demoQuery.ilike('city', `%${city}%`);
  // budget filter not applied to demo vendors — rate_display is a string not int
  // vibes filter not applied — demo vendors don't have aesthetic_tags yet

  demoQuery = demoQuery.order('created_at', { ascending: false });

  const { data: demoVendors, error: demoError } = await demoQuery;
  if (demoError) {
    // Non-fatal — if demo table query fails, still return real vendors
    console.error('[GET /discover/feed] demo vendors error:', demoError.message);
  }

  const shapedDemo = (demoVendors || []).map(v => {
    // photos is a JSONB array of {url, is_hero, cloudinary_id}
    const photoUrls = (Array.isArray(v.photos) ? v.photos : [])
      .slice(0, 5)
      .map(p => (typeof p === 'string' ? p : p?.url))
      .filter(Boolean);

    return {
      id:             v.id,
      name:           v.display_name || null,
      category:       v.category     || null,
      city:           v.city         || null,
      routing_handle: v.ig_handle    || null,
      starting_price: null,           // rate_display is a string; client shows it via about
      photos:         photoUrls,
      vibe_tags:      [],
      about:          v.about        || null,
      enquire_link:   v.ig_handle ? `${ENQUIRE_BASE}${v.ig_handle}` : null,
      is_demo:        true,
    };
  });

  // ── 3. Merge, shuffle slightly so demos don't always cluster, paginate ─────
  const combined = [...shapedReal, ...shapedDemo];
  // Stable interleave: insert demo vendors at every ~5th position so they
  // feel natural in the feed rather than all appearing at the end.
  const interleaved = [];
  let di = 0;
  const demoOnly  = combined.filter(v => v.is_demo);
  const realOnly  = combined.filter(v => !v.is_demo);
  realOnly.forEach((v, i) => {
    interleaved.push(v);
    if ((i + 1) % 5 === 0 && di < demoOnly.length) {
      interleaved.push(demoOnly[di++]);
    }
  });
  // Append any remaining demo vendors
  while (di < demoOnly.length) interleaved.push(demoOnly[di++]);

  const total    = interleaved.length;
  const paginated = interleaved.slice(offset, offset + limit);

  return okRes(res, {
    vendors:  paginated,
    page,
    has_more: total > offset + limit,
    total,
  });
}));

// ── GET /featured ─────────────────────────────────────────────────────────────
router.get('/featured', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  // Try featured_boards table — may not exist yet; fall back to editorial seed.
  const { data: boards, error } = await supabase
    .from('featured_boards')
    .select('id, title, subtitle, cover_image, vendor_ids')
    .eq('active', true)
    .order('display_order', { ascending: true })
    .limit(10);

  if (!error && boards && boards.length > 0) {
    return okRes(res, { collections: boards });
  }

  // Editorial seed fallback — group discover-eligible vendors by category
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, category')
    .eq('discover_eligible', true)
    .limit(50);

  const grouped = {};
  (vendors || []).forEach(v => {
    const cat = v.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(v.id);
  });

  const collections = Object.entries(grouped).map(([cat, ids]) => ({
    id:          `editorial-${cat}`,
    title:       cat.charAt(0).toUpperCase() + cat.slice(1) + 's',
    subtitle:    'Curated by TDW',
    cover_image: null,
    vendor_ids:  ids,
  }));

  return okRes(res, { collections });
}));

// ── GET /heroes ───────────────────────────────────────────────────────────────
router.get('/heroes', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  // Try discover_heroes table — may not exist yet; fall back to top 3 by created_at.
  const { data: heroes, error } = await supabase
    .from('discover_heroes')
    .select('id, name, image_url, caption, routing_handle')
    .eq('active', true)
    .order('display_order', { ascending: true })
    .limit(3);

  if (!error && heroes && heroes.length > 0) {
    const shaped = heroes.map(h => ({
      ...h,
      enquire_link: h.routing_handle ? `${ENQUIRE_BASE}${h.routing_handle}` : null,
    }));
    return okRes(res, { heroes: shaped });
  }

  // Fallback — top 3 discover-eligible vendors
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, business_name, routing_handle')
    .eq('discover_eligible', true)
    .order('created_at', { ascending: false })
    .limit(3);

  // Grab first hero portfolio image for each
  const vendorIds = (vendors || []).map(v => v.id);
  let heroPhotoMap = {};
  if (vendorIds.length > 0) {
    const { data: photos } = await supabase
      .from('vendor_portfolio')
      .select('vendor_id, image_url')
      .in('vendor_id', vendorIds)
      .eq('approval_state', 'approved')
      .eq('is_hero', true)
      .limit(vendorIds.length);

    (photos || []).forEach(p => { heroPhotoMap[p.vendor_id] = p.image_url; });
  }

  const shaped = (vendors || []).map(v => ({
    id:             v.id,
    name:           v.business_name    || null,
    image_url:      heroPhotoMap[v.id] || null,
    caption:        null,
    routing_handle: v.routing_handle   || null,
    enquire_link:   v.routing_handle   ? `${ENQUIRE_BASE}${v.routing_handle}` : null,
  }));

  return okRes(res, { heroes: shaped });
}));

module.exports = router;
