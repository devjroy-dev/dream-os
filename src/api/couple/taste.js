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
const { groundedSearch } = require('../../lib/groundedSearch');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// Curated fallback images — covers all 15 tags.
// Replace with real editorial images (Pinterest/Instagram sourced) via admin portal.
const CURATED_FALLBACK = [
  { image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1080&q=85', caption: 'Grand ballroom ceremony',       tags: ['grand','ott','opulent'],          source_url: null },
  { image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1080&q=85', caption: 'Soft pastel bridal portrait',   tags: ['pastel','minimal','editorial'],    source_url: null },
  { image_url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1080&q=85', caption: 'Moody candlelit mandap',        tags: ['moody','intimate','editorial'],    source_url: null },
  { image_url: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1080&q=85', caption: 'Rustic outdoor ceremony',       tags: ['rustic','natural','candid'],       source_url: null },
  { image_url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1080&q=85', caption: 'Minimal modern decor',          tags: ['minimal','modern','clean'],        source_url: null },
  { image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&q=85', caption: 'Cinematic couple portrait',     tags: ['editorial','cinematic','film'],    source_url: null },
  { image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1080&q=85', caption: 'Grand floral destination wedding', tags: ['grand','floral','destination'], source_url: null },
  { image_url: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1080&q=85', caption: 'Intimate mehndi warm tones',    tags: ['intimate','warm','candid'],        source_url: null },
  { image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1080&q=85', caption: 'Festive vibrant sangeet',      tags: ['festive','vibrant','pastel'],      source_url: null },
  { image_url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1080&q=85', caption: 'Dramatic dark editorial',      tags: ['moody','dramatic','editorial'],    source_url: null },
];

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

  // Pad with Gemini grounded search if < 5 vendor matches
  let results = [...vendorImages];
  if (results.length < 5) {
    try {
      const tagStr  = herTags.slice(0, 4).join(', ');
      const query   = `Indian wedding photography ${tagStr} aesthetic — real wedding images site:pinterest.com OR site:instagram.com OR site:wedmegood.com OR site:shaadisaga.com`;
      const { answer, sources } = await groundedSearch(query, {
        maxResults: 10,
        context: `Find real Indian wedding images matching these aesthetics: ${tagStr}. Return direct image URLs only.`,
      });

      // Extract image URLs from sources
      if (sources && sources.length > 0) {
        for (const src of sources) {
          if (results.length >= 20) break;
          if (src.uri && (src.uri.includes('.jpg') || src.uri.includes('.jpeg') || src.uri.includes('.png') || src.uri.includes('.webp'))) {
            results.push({
              image_url:      src.uri,
              caption:        src.title || `${tagStr} wedding`,
              aesthetic_tags: herTags.slice(0, 3),
              source_url:     src.uri,
              source:         'web',
            });
          }
        }
      }
    } catch (searchErr) {
      console.warn('[GET /taste/surprise] grounded search failed:', searchErr.message);
    }

    // Final fallback — curated Unsplash if search returned nothing
    if (results.length < 5) {
      const matching = CURATED_FALLBACK
        .filter(f => f.tags.some(t => herTags.includes(t)))
        .map(f => ({ image_url: f.image_url, caption: f.caption, aesthetic_tags: f.tags, source_url: f.source_url, source: 'curated' }));
      for (const f of matching) {
        if (results.length >= 20) break;
        results.push(f);
      }
      if (results.length < 5) {
        for (const f of CURATED_FALLBACK) {
          if (results.length >= 20) break;
          if (!results.find(r => r.image_url === f.image_url)) {
            results.push({ image_url: f.image_url, caption: f.caption, aesthetic_tags: f.tags, source_url: f.source_url, source: 'curated' });
          }
        }
      }
    }
  }

  // Shuffle
  results = results.sort(() => Math.random() - 0.5);

  return okRes(res, { profile_set: true, images: results.slice(0, 20) });
}));

module.exports = router;
