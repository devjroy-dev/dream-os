// src/api/couple/quiz.js
// GET  /api/v2/couple/quiz/images  — returns active taste quiz images
// POST /api/v2/couple/quiz/done    — marks quiz complete + saves liked images to muse_saves
//
// Auth: requireCoupleAuth (couple JWT).
// Called by Surprise Me canvas on first open.
// If taste_quiz_images table is empty, returns hardcoded fallback set.

'use strict';

const express  = require('express');
const router   = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// Hardcoded fallback — used when table is empty (e.g. before admin seeds it)
const FALLBACK_IMAGES = [
  { id: 'f1', image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1080&q=85', caption: 'Grand ballroom, OTT florals',        aesthetic_tags: ['grand','ott','opulent'],        sort_order: 1 },
  { id: 'f2', image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1080&q=85', caption: 'Soft pastel lehenga, natural light',  aesthetic_tags: ['pastel','minimal','editorial'], sort_order: 2 },
  { id: 'f3', image_url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1080&q=85', caption: 'Moody candlelit mandap',              aesthetic_tags: ['moody','intimate','editorial'], sort_order: 3 },
  { id: 'f4', image_url: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1080&q=85', caption: 'Rustic outdoor ceremony',             aesthetic_tags: ['rustic','natural','candid'],    sort_order: 4 },
  { id: 'f5', image_url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1080&q=85', caption: 'Minimal modern decor',               aesthetic_tags: ['minimal','modern','clean'],     sort_order: 5 },
  { id: 'f6', image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&q=85', caption: 'Editorial couple portrait',           aesthetic_tags: ['editorial','moody','cinematic'],sort_order: 6 },
  { id: 'f7', image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1080&q=85', caption: 'Grand floral arch, destination',      aesthetic_tags: ['grand','floral','destination'], sort_order: 7 },
  { id: 'f8', image_url: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1080&q=85', caption: 'Intimate mehndi, warm tones',         aesthetic_tags: ['intimate','warm','candid'],     sort_order: 8 },
  { id: 'f9', image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1080&q=85', caption: 'Pastel sangeet, festive',             aesthetic_tags: ['festive','pastel','vibrant'],   sort_order: 9 },
  { id: 'f10',image_url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1080&q=85', caption: 'Dramatic dark editorial',            aesthetic_tags: ['moody','dramatic','editorial'], sort_order: 10 },
];

// ── GET /images ───────────────────────────────────────────────────────────────
router.get('/images', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  // Check if quiz already done
  const { data: couple } = await supabase
    .from('couples')
    .select('taste_quiz_done')
    .eq('id', couple_id)
    .maybeSingle();

  const quizDone = couple?.taste_quiz_done || false;

  // Fetch quiz images from DB
  const { data: images, error } = await supabase
    .from('taste_quiz_images')
    .select('id, image_url, caption, aesthetic_tags, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[GET /couple/quiz/images] db error:', error.message);
  }

  const quizImages = (images && images.length > 0) ? images : FALLBACK_IMAGES;

  return okRes(res, {
    quiz_done:   quizDone,
    images:      quizImages,
  });
}));

// ── POST /done ────────────────────────────────────────────────────────────────
// Body: { liked_ids: string[] }  — IDs of quiz images the bride liked
// Saves liked images to muse_saves, marks taste_quiz_done = true on couples row.
router.post('/done', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id, id: user_id } = req.coupleUser;

  const { liked_ids } = req.body || {};
  if (!Array.isArray(liked_ids)) {
    return errRes(res, 400, 'liked_ids must be an array.');
  }

  // Fetch liked images to get their URLs + tags
  let likedImages = [];
  if (liked_ids.length > 0) {
    const { data: dbImages } = await supabase
      .from('taste_quiz_images')
      .select('id, image_url, caption, aesthetic_tags')
      .in('id', liked_ids);

    // Also check fallback (liked_ids might reference fallback IDs starting with 'f')
    const fallbackLiked = FALLBACK_IMAGES.filter(f => liked_ids.includes(f.id));
    likedImages = [...(dbImages || []), ...fallbackLiked];
  }

  // Get next save_number for this couple
  const { data: lastSave } = await supabase
    .from('muse_saves')
    .select('save_number')
    .eq('couple_id', couple_id)
    .order('save_number', { ascending: false })
    .limit(1);

  let nextNum = (lastSave?.[0]?.save_number || 0) + 1;

  // Insert liked images as muse_saves
  const saveRows = likedImages.map((img, i) => ({
    couple_id,
    save_number:       nextNum + i,
    source_type:       'image',
    source_url:        img.image_url,
    image_url:         img.image_url,
    caption:           img.caption || null,
    aesthetic_tags:    img.aesthetic_tags || [],
    saved_by_user_id:  user_id,
    saved_by_role:     'bride',
  }));

  if (saveRows.length > 0) {
    const { error: saveErr } = await supabase
      .from('muse_saves')
      .insert(saveRows);
    if (saveErr) {
      console.error('[POST /couple/quiz/done] muse_saves insert error:', saveErr.message);
    }
  }

  // Mark quiz done
  const { error: quizErr } = await supabase
    .from('couples')
    .update({ taste_quiz_done: true, updated_at: new Date().toISOString() })
    .eq('id', couple_id);

  if (quizErr) {
    console.error('[POST /couple/quiz/done] quiz done update error:', quizErr.message);
  }

  return okRes(res, {
    saved:     saveRows.length,
    quiz_done: true,
  });
}));

module.exports = router;
