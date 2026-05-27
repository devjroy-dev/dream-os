
// src/api/admin/demoMgr.js
// Admin demo management endpoints.
// Mounted at /api/v2/admin/demo via router.js
// All routes require admin auth via requireAdmin middleware.
//
// ENDPOINTS
//   POST   /vendors              — create demo vendor
//   GET    /vendors              — list all demo vendors
//   DELETE /vendors/:id          — deactivate demo vendor
//   GET    /leads                — list all demo leads (unnotified first)
//   POST   /leads/:id/relay      — mark lead as manually relayed
//   POST   /cloudinary-sign      — get signed upload params for vendor photos
//   GET    /muse-pool            — list muse pool images
//   POST   /muse-pool            — add image to muse pool
//   DELETE /muse-pool/:id        — remove image from muse pool

'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { generateUploadParams, deleteFromCloudinary } = require('../../lib/admin/cloudinary');
const { sendWhatsApp } = require('../../lib/whatsapp');

const ADMIN_PHONE = process.env.ADMIN_WHATSAPP || '+918757788550';

router.use(requireAdmin);

// ── POST /vendors — create demo vendor ───────────────────────────────────────
router.post('/vendors', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const {
    ig_handle, display_name, category, city,
    whatsapp_phone, about, rate_display, photos,
  } = req.body;

  if (!ig_handle?.trim() || !display_name?.trim() || !category || !city) {
    return res.status(400).json({ ok: false, error: 'ig_handle, display_name, category, city required.' });
  }
  if (!photos || !Array.isArray(photos) || photos.length < 3) {
    return res.status(400).json({ ok: false, error: 'Minimum 3 photos required.' });
  }
  if (photos.length > 20) {
    return res.status(400).json({ ok: false, error: 'Maximum 20 photos allowed.' });
  }

  const handle = ig_handle.trim().toLowerCase().replace(/^@/, '');

  // Check handle not already active
  const { data: existing } = await supabase
    .from('demo_vendors')
    .select('id')
    .eq('ig_handle', handle)
    .eq('active', true)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ ok: false, error: 'Demo profile already exists for this handle.' });
  }

  const { data: vendor, error } = await supabase
    .from('demo_vendors')
    .insert({
      ig_handle:     handle,
      display_name:  display_name.trim(),
      category,
      city,
      whatsapp_phone: whatsapp_phone?.trim() || null,
      about:         about?.trim() || null,
      rate_display:  rate_display?.trim() || null,
      photos:        photos,
      active:        true,
    })
    .select('id, ig_handle')
    .single();

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to create demo vendor.', detail: error.message });
  }

  // Seed aspirational demo data for this vendor
  await seedDemoData(supabase, vendor.id, category);

  console.log(`[admin:demo] created demo vendor handle=${handle} id=${vendor.id}`);

  return res.json({
    ok:       true,
    id:       vendor.id,
    handle:   vendor.ig_handle,
    demo_url: `https://thedreamwedding.in/demo/${handle}`,
  });
}));

// ── Seed aspirational demo data ───────────────────────────────────────────────
// Creates realistic leads, clients, invoices, events for the demo vendor.
// All scoped to demo_vendor_id — no FK to real tables.
// We use the demo vendor's ID as a namespace key stored in demo_vendors.photos
// metadata. The actual data lives in leads/clients/invoices/events tables
// scoped to a dedicated DEMO_SEEDED_VENDOR_UUID so DreamAi can read them.
//
// IMPORTANT: We use a single shared seeded vendor UUID for DreamAi context.
// The demo vendor's own UUID is used only for photo display and lead receipt.
// DreamAi session points to DEMO_SEEDED_VENDOR_UUID which has rich pre-seeded data.
//
// This UUID must exist in the DB as a real vendor row with onboarding_state=complete.
// Run the seed SQL manually once: see db/seed/demo_vendor_seed.sql

async function seedDemoData(supabase, demoVendorId, category) {
  // We store seed metadata on the demo vendor row for reference
  // Actual DreamAi data is pre-seeded against DEMO_SEEDED_VENDOR_UUID
  // (set up once via db/seed/demo_vendor_seed.sql)
  // No additional seeding needed per demo vendor creation
  console.log(`[admin:demo] demo data pre-seeded via shared UUID for demo_vendor=${demoVendorId} category=${category}`);
}

// ── GET /vendors — list all demo vendors ─────────────────────────────────────
router.get('/vendors', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: vendors, error } = await supabase
    .from('demo_vendors')
    .select('id, ig_handle, display_name, category, city, whatsapp_phone, active, photos, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  // Attach lead counts
  const ids = (vendors || []).map(v => v.id);
  let leadCounts = {};
  if (ids.length > 0) {
    const { data: counts } = await supabase
      .from('demo_leads')
      .select('demo_vendor_id')
      .in('demo_vendor_id', ids);
    (counts || []).forEach(r => {
      leadCounts[r.demo_vendor_id] = (leadCounts[r.demo_vendor_id] || 0) + 1;
    });
  }

  const shaped = (vendors || []).map(v => ({
    ...v,
    lead_count: leadCounts[v.id] || 0,
    demo_url:   `https://thedreamwedding.in/demo/${v.ig_handle}`,
    photo_count: (v.photos || []).length,
  }));

  return res.json({ ok: true, vendors: shaped });
}));

// ── DELETE /vendors/:id — deactivate demo vendor ─────────────────────────────
router.delete('/vendors/:id', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { error } = await supabase
    .from('demo_vendors')
    .update({ active: false })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.json({ ok: true });
}));

// ── GET /leads — list all demo leads ─────────────────────────────────────────
router.get('/leads', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: leads, error } = await supabase
    .from('demo_leads')
    .select(`
      id, demo_vendor_handle, bride_name, bride_phone,
      bride_ig_handle, bride_email,
      bride_wedding_date, bride_wedding_city,
      otp_verified, notified_vendor, admin_notified, created_at
    `)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ ok: false, error: error.message });

  return res.json({ ok: true, leads: leads || [] });
}));

// ── POST /leads/:id/relay — mark lead as manually relayed ────────────────────
router.post('/leads/:id/relay', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { error } = await supabase
    .from('demo_leads')
    .update({ notified_vendor: true })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.json({ ok: true });
}));

// ── POST /cloudinary-sign — signed upload params for vendor photos ────────────
router.post('/cloudinary-sign', asyncHandler(async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ ok: false, error: 'filename required.' });
    const params = generateUploadParams('demo-vendors', filename);
    return res.json({ ok: true, ...params });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}));

// ── GET /muse-pool — list muse pool images ────────────────────────────────────
router.get('/muse-pool', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data, error } = await supabase
    .from('demo_muse_pool')
    .select('id, image_url, cloudinary_id, tags, caption, display_order, active, created_at')
    .order('display_order', { ascending: true });

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.json({ ok: true, images: data || [] });
}));

// ── POST /muse-pool — add image to muse pool ─────────────────────────────────
router.post('/muse-pool', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { image_url, cloudinary_id, tags, caption, display_order } = req.body;

  if (!image_url) return res.status(400).json({ ok: false, error: 'image_url required.' });

  const { data, error } = await supabase
    .from('demo_muse_pool')
    .insert({
      image_url,
      cloudinary_id: cloudinary_id || null,
      tags:          tags || [],
      caption:       caption?.trim() || null,
      display_order: display_order ?? 0,
      active:        true,
    })
    .select('id')
    .single();

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.json({ ok: true, id: data.id });
}));

// ── DELETE /muse-pool/:id — remove image from muse pool ──────────────────────
router.delete('/muse-pool/:id', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: row } = await supabase
    .from('demo_muse_pool')
    .select('cloudinary_id')
    .eq('id', req.params.id)
    .maybeSingle();

  if (row?.cloudinary_id) await deleteFromCloudinary(row.cloudinary_id);

  const { error } = await supabase
    .from('demo_muse_pool')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.json({ ok: true });
}));

module.exports = router;
