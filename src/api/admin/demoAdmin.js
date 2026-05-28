// src/api/admin/demoAdmin.js
// Admin endpoints for managing demo vendor profiles.
// Protected by x-admin-password header.
//
//   GET    /api/v2/admin/demo/vendors         — list all demo vendors
//   POST   /api/v2/admin/demo/vendors         — create demo vendor
//   DELETE /api/v2/admin/demo/vendors/:id     — deactivate demo vendor
//   GET    /api/v2/admin/demo/leads           — list all demo leads
//   POST   /api/v2/admin/demo/leads           — seed a mock lead
//   POST   /api/v2/admin/demo/cloudinary-sign — sign a Cloudinary upload

'use strict';

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Liza@2551354';

function requireAdminPassword(req, res, next) {
  const pw = req.headers['x-admin-password'];
  if (!pw || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false, error: 'Unauthorized.' });
  next();
}

// GET /admin/demo/vendors
router.get('/vendors', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const { data, error } = await supabase
      .from('demo_vendors').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ ok: true, vendors: data || [] });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// POST /admin/demo/vendors
router.post('/vendors', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { ig_handle, display_name, category, city, whatsapp_phone, about, rate_display, photos } = req.body || {};
  if (!ig_handle || !display_name || !category || !city) {
    return res.status(400).json({ ok: false, error: 'ig_handle, display_name, category, city are required.' });
  }
  if (!Array.isArray(photos) || photos.length < 3) {
    return res.status(400).json({ ok: false, error: 'Minimum 3 photos required.' });
  }
  try {
    const { data, error } = await supabase
      .from('demo_vendors')
      .insert({ ig_handle: ig_handle.toLowerCase().trim(), display_name: display_name.trim(), category, city, whatsapp_phone: whatsapp_phone || null, about: about || null, rate_display: rate_display || null, photos, active: true, created_by: 'admin' })
      .select().single();
    if (error) throw error;
    return res.json({ ok: true, vendor: data, demo_url: `https://demo.thedreamwedding.in/vendor/${data.ig_handle}` });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ ok: false, error: 'A demo vendor with this IG handle already exists.' });
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /admin/demo/vendors/:id
router.delete('/vendors/:id', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const { error } = await supabase.from('demo_vendors').update({ active: false }).eq('id', req.params.id);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// GET /admin/demo/leads
router.get('/leads', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const { data, error } = await supabase
      .from('demo_leads').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ ok: true, leads: data || [] });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// POST /admin/demo/leads — seed a mock lead
router.post('/leads', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { demo_vendor_id, demo_vendor_handle, bride_name, bride_phone, bride_wedding_city, bride_wedding_date, state, raw_message, otp_verified } = req.body || {};
  if (!demo_vendor_id || !demo_vendor_handle || !bride_name || !bride_phone) {
    return res.status(400).json({ ok: false, error: 'demo_vendor_id, demo_vendor_handle, bride_name, bride_phone required.' });
  }
  try {
    const { data, error } = await supabase
      .from('demo_leads')
      .insert({ demo_vendor_id, demo_vendor_handle, bride_name, bride_phone, bride_wedding_city: bride_wedding_city || null, bride_wedding_date: bride_wedding_date || null, state: state || 'new', raw_message: raw_message || null, otp_verified: otp_verified || false, notified_vendor: false, admin_notified: false })
      .select().single();
    if (error) throw error;
    return res.json({ ok: true, lead: data });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// POST /admin/demo/cloudinary-sign
router.post('/cloudinary-sign', requireAdminPassword, async (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const preset    = process.env.CLOUDINARY_UPLOAD_PRESET || 'dream_wedding_uploads';
  if (!cloudName || !apiKey || !apiSecret) return res.status(500).json({ ok: false, error: 'Cloudinary not configured.' });
  const timestamp = Math.floor(Date.now() / 1000);
  const folder    = 'demo_vendors';
  const toSign    = `folder=${folder}&timestamp=${timestamp}&upload_preset=${preset}${apiSecret}`;
  const signature = crypto.createHash('sha256').update(toSign).digest('hex');
  return res.json({
    ok: true,
    params: { timestamp, folder, upload_preset: preset, api_key: apiKey, signature },
    upload_url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  });
});

module.exports = router;
