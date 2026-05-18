// src/api/landing-slides.js
// GET /api/v2/landing-slides
//
// Public endpoint — no auth required. Called by the landing page
// (app/page.tsx) and every pre-login auth screen (vendor/pin,
// vendor/pin-login, couple/pin, couple/pin-login, vendor/onboarding,
// couple/onboarding, circle/join). All these surfaces show the same
// full-bleed slideshow that persists across navigation until the user
// reaches their home screen.
//
// Returns active rows from landing_slides ordered by display_order ASC.
// The dreamos-pwa frontend reads `image_url` from each row directly.
//
// Response shape:
//   200 OK { ok: true, slides: [{ id, image_url, caption, display_order }, ...] }
//   500    { ok: false, error: 'message' }
//
// Migration 0030 backs this table. Seeded with 3 Cloudinary URLs at P2-5.

'use strict';

const express = require('express');
const router  = express.Router();

router.get('/', async (req, res) => {
  const supabase = req.app.locals.supabase;

  try {
    const { data, error } = await supabase
      .from('landing_slides')
      .select('id, image_url, caption, display_order')
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[landing-slides] supabase error:', error);
      return res.status(500).json({ ok: false, error: 'database_error' });
    }

    return res.json({ ok: true, slides: data || [] });
  } catch (err) {
    console.error('[landing-slides] unexpected error:', err);
    return res.status(500).json({ ok: false, error: 'internal_error' });
  }
});

module.exports = router;
