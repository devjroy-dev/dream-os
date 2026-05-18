// src/api/waitlist.js
// POST /api/v2/waitlist/signup
//
// Public endpoint — no auth required. Called by the landing page waitlist
// forms (Dreamers + Makers). Validates input, normalises phone + IG handle,
// inserts into waitlist_signups.
//
// Phone contract: E.164 with leading + (e.g. +918757788550).
//   Frontend sends the joined string from the country-code dropdown + digits.
//   This endpoint validates regex ^\+[0-9]{8,15}$ and rejects anything else
//   with a clean 400.
//
// IG handle contract: strip leading @ and trim whitespace. Store raw.
//   Mirrors vendors.instagram_handle convention (migration 0005).
//
// Error responses are JSON { error: 'message' } with appropriate HTTP status.
// Success response is JSON { ok: true } — the frontend shows the
// confirmation copy client-side:
//   "We are onboarding in small batches and shall be getting in touch with you soon."

'use strict';

const express = require('express');
const router  = express.Router();

const PHONE_RE = /^\+[0-9]{8,15}$/;

router.post('/signup', async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { kind, name, phone, instagram_handle } = req.body;

  // ── 1. Validate kind ───────────────────────────────────────────────
  if (!kind || !['dreamer', 'maker'].includes(kind)) {
    return res.status(400).json({ error: 'kind must be dreamer or maker.' });
  }

  // ── 2. Validate name ───────────────────────────────────────────────
  const cleanName = (name || '').trim();
  if (!cleanName) {
    return res.status(400).json({ error: 'name is required.' });
  }

  // ── 3. Validate + normalise phone ──────────────────────────────────
  // Frontend sends complete E.164 (country-code dropdown + digits joined).
  // We validate the format; we do NOT attempt country-code guessing here.
  const cleanPhone = (phone || '').trim().replace(/\s+/g, '');
  if (!PHONE_RE.test(cleanPhone)) {
    return res.status(400).json({
      error: 'Please enter a valid phone number with country code, e.g. +91 98882 94440 or +1 415 555 1234.',
    });
  }

  // ── 4. Normalise IG handle ─────────────────────────────────────────
  // Strip leading @ and trim whitespace. Store raw without @.
  // Mirrors vendors.instagram_handle (migration 0005).
  const cleanIg = (instagram_handle || '').trim().replace(/^@/, '');
  if (!cleanIg) {
    return res.status(400).json({ error: 'instagram_handle is required.' });
  }

  // ── 5. Insert ──────────────────────────────────────────────────────
  const { error } = await supabase
    .from('waitlist_signups')
    .insert({
      kind,
      name:             cleanName,
      phone:            cleanPhone,
      instagram_handle: cleanIg,
      status:           'new',
    });

  if (error) {
    console.error('[waitlist:signup] insert error:', error.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  console.log(`[waitlist:signup] kind=${kind} phone=${cleanPhone} ig=${cleanIg}`);
  return res.json({ ok: true });
});

module.exports = router;
