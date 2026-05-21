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

const ENQUIRE_BASE = 'https://wa.me/917982159047?text=TDW-';

// ── GET /feed ─────────────────────────────────────────────────────────────────
router.get('/feed', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const category = req.query.category || null;
  const city     = req.query.city     || null;
  const page     = Math.max(0, parseInt(req.query.page,  10) || 0);
  const limit    = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset   = page * limit;

  let query = supabase
    .from('vendors')
    .select('id, business_name, category, city, routing_handle, rate_min, aesthetic_tags, about, discover_preview', { count: 'exact' })
    .eq('discover_eligible', true);

  if (category) query = query.eq('category', category);
  if (city)     query = query.ilike('city', `%${city}%`);

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: vendors, error, count } = await query;
  if (error) {
    console.error('[GET /discover/feed] query error:', error.message);
    return errRes(res, 500, 'Feed unavailable.');
  }

  // Fetch up to 5 approved portfolio images per vendor in one query
  const vendorIds = (vendors || []).map(v => v.id);
  let photoMap = {};
  if (vendorIds.length > 0) {
    const { data: photos } = await supabase
      .from('vendor_portfolio')
      .select('vendor_id, image_url')
      .in('vendor_id', vendorIds)
      .eq('approval_state', 'approved')
      .order('is_hero', { ascending: false })
      .order('created_at', { ascending: false });

    (photos || []).forEach(p => {
      if (!photoMap[p.vendor_id]) photoMap[p.vendor_id] = [];
      if (photoMap[p.vendor_id].length < 5) photoMap[p.vendor_id].push(p.image_url);
    });
  }

  const shaped = (vendors || []).map(v => ({
    id:             v.id,
    name:           v.business_name || null,
    category:       v.category      || null,
    city:           v.city          || null,
    routing_handle: v.routing_handle || null,
    starting_price: v.rate_min      || null,
    photos:         photoMap[v.id]  || [],
    vibe_tags:      v.aesthetic_tags || [],
    about:          v.about           || null,
    enquire_link:   v.routing_handle ? `${ENQUIRE_BASE}${v.routing_handle}` : null,
  }));

  return okRes(res, {
    vendors:  shaped,
    page,
    has_more: (count || 0) > offset + limit,
    total:    count || 0,
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
