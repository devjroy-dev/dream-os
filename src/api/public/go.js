// src/api/public/go.js
// go.thedreamwedding.in/[handle] — branded WhatsApp enquiry redirect
// Logs every tap for Discover Returns analytics
'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { waNumberFor } = require('../../lib/waNumbers');   // F5 rider

// GET /go/:handle — public, no auth
router.get('/:handle', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const handle   = req.params.handle.toUpperCase();

  await supabase.from('enquiry_taps').insert({
    handle,
    source: req.headers.referer || 'direct',
    tapped_at: new Date().toISOString()
  });

  const text = encodeURIComponent(`TDW-${handle}`);
  return res.redirect(302, `https://wa.me/${waNumberFor('vendor')}?text=${text}`);
}));

module.exports = router;
