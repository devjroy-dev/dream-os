// src/api/exploring-photos.js
// GET /api/v2/exploring-photos
//
// Public endpoint — no auth required. Called by the landing page
// (app/page.tsx) when an anonymous visitor taps the "Just Exploring"
// entry. Returns the editorial mood gallery used for the swipe-tap
// preview.
//
// Distinct from Discover preview, which serves real vendor profiles
// inside the PWA FEED tab post-login. That endpoint
// (/api/v2/discover/preview) ships in Phase 2 Block 5 and depends on
// migrations 0024 + 0029.
//
// Returns active rows from exploring_photos ordered by display_order ASC.
//
// Response shape:
//   200 OK { ok: true, photos: [{ id, image_url, caption, display_order }, ...] }
//   500    { ok: false, error: 'message' }
//
// Migration 0030 backs this table. Seeded with 3 Cloudinary URLs at P2-5
// (same images as landing_slides for launch — Swati expands separately
// once the admin panel ships in the post-Phase 2 admin session).

'use strict';

const express = require('express');
const router  = express.Router();

router.get('/', async (req, res) => {
  const supabase = req.app.locals.supabase;

  try {
    const { data, error } = await supabase
      .from('exploring_photos')
      .select('id, image_url, caption, display_order')
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[exploring-photos] supabase error:', error);
      return res.status(500).json({ ok: false, error: 'database_error' });
    }

    return res.json({ ok: true, photos: data || [] });
  } catch (err) {
    console.error('[exploring-photos] unexpected error:', err);
    return res.status(500).json({ ok: false, error: 'internal_error' });
  }
});

module.exports = router;
