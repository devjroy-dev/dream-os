// src/api/couple/taste.js
// POST /api/v2/couple/taste         — save bride's aesthetic tag profile
// GET  /api/v2/couple/taste/profile — returns her tags + taste_quiz_done flag
// GET  /api/v2/couple/surprise      — returns curated images matching her tags
//
// Auth: requireCoupleAuth (couple JWT).
//
// Tag vocabulary (15 tags) — must match vendor.aesthetic_tags values:
//   moody, editorial, cinematic, film, candid, intimate,
//   grand, ott, opulent, destination,
//   pastel, minimal, clean, modern,
//   festive, vibrant, warm, rustic, natural
//
// Surprise Me matching:
//   1. Query vendor_portfolio WHERE aesthetic_tags overlap her tags + approved
//   2. If < 5 results → pad with curated fallback images (Pinterest/Google sourced)
//   3. Shuffle and return up to 20

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');


// ── POST /taste — save her tags ───────────────────────────────────────────────
router.post('/', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  const { tags } = req.body || {};
  if (!Array.isArray(tags) || tags.length === 0) {
    return errRes(res, 400, 'tags must be a non-empty array.');
  }

  // Normalise — lowercase, trim, dedupe
  const clean = [...new Set(tags.map(t => String(t).toLowerCase().trim()).filter(Boolean))];

  const { error } = await supabase
    .from('couples')
    .update({
      aesthetic_tags:  clean,
      taste_quiz_done: true,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', couple_id);

  if (error) {
    console.error('[POST /couple/taste] update error:', error.message);
    return errRes(res, 500, 'Could not save taste profile.');
  }

  return okRes(res, { saved: true, tags: clean });
}));

// ── GET /taste/profile — her current tags + flag ──────────────────────────────
router.get('/profile', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  const { data, error } = await supabase
    .from('couples')
    .select('aesthetic_tags, taste_quiz_done')
    .eq('id', couple_id)
    .maybeSingle();

  if (error) {
    console.error('[GET /couple/taste/profile] error:', error.message);
    return errRes(res, 500, 'Could not fetch taste profile.');
  }

  return okRes(res, {
    tags:            data?.aesthetic_tags   || [],
    taste_quiz_done: data?.taste_quiz_done  || false,
  });
}));

// ── GET /taste/surprise — curated images matching her tags ────────────────────
router.get('/surprise', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  // Get her tags
  const { data: couple } = await supabase
    .from('couples')
    .select('aesthetic_tags, taste_quiz_done')
    .eq('id', couple_id)
    .maybeSingle();

  const herTags     = couple?.aesthetic_tags || [];
  const profileSet  = couple?.taste_quiz_done || false;

  if (!profileSet || herTags.length === 0) {
    return okRes(res, { profile_set: false, images: [] });
  }

  // Query vendor_portfolio for matching images
  // aesthetic_tags is jsonb array — use @> overlap operator
  // Cast her tags to jsonb for the overlap query
  let vendorImages = [];
  if (herTags.length > 0) {
    const { data: portfolio } = await supabase
      .from('vendor_portfolio')
      .select('id, image_url, caption, aesthetic_tags, vendor_id')
      .eq('approval_state', 'approved')
      .not('image_url', 'is', null)
      .limit(50);

    if (portfolio && portfolio.length > 0) {
      // Score each image by tag overlap
      vendorImages = portfolio
        .map(p => {
          const imgTags = Array.isArray(p.aesthetic_tags) ? p.aesthetic_tags : (p.aesthetic_tags || []);
          const overlap = imgTags.filter((t) => herTags.includes(t)).length;
          return { ...p, overlap };
        })
        .filter(p => p.overlap > 0)
        .sort((a, b) => b.overlap - a.overlap)
        .slice(0, 15)
        .map(p => ({
          image_url:      p.image_url,
          caption:        p.caption || null,
          aesthetic_tags: p.aesthetic_tags || [],
          source_url:     null,
          source:         'vendor',
          vendor_id:      p.vendor_id,
        }));
    }
  }

  // Vendor portfolio images only. Admin image pool added in B-Admin.
  // Return what we have — frontend shows "coming soon" if empty.
  const results = vendorImages.sort(() => Math.random() - 0.5);

  return okRes(res, { profile_set: true, images: results.slice(0, 20) });
}));

module.exports = router;
