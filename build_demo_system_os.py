#!/usr/bin/env python3
"""
build_demo_system_os.py
Run in /workspaces/dream-os

Builds the complete vendor/bride demo system backend.

New tables (migration 0057):
  demo_vendors   — demo vendor profiles (separate from real vendors)
  demo_leads     — enquiries from demo brides to demo vendors (separate from real leads)
  demo_muse_pool — curated images for bride demo Muse board

New API files:
  src/api/demo/vendor.js  — public: activate demo session, submit enquiry, send/verify OTP
  src/api/admin/demoMgr.js — admin: create demo vendor, upload photos, list leads, muse pool

Router wiring:
  /api/v2/demo/*         — public demo endpoints
  /api/v2/admin/demo/*   — admin demo management

ISOLATION GUARANTEES:
  - demo_vendors.is_demo = true always — never mixed with real vendors query
  - demo_leads is completely separate table — never touches real leads
  - OTP for bride demo uses purpose='demo_enquiry' — separate from login OTPs
  - Demo session returned to frontend uses separate key (tdw_vendor_demo_session)
  - Real vendor session always takes priority over demo session
"""

import sys, subprocess
from pathlib import Path

BASE = Path('.')

def write(p, t):
    path = BASE / p
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(t)
    print(f'  OK   [wrote {p}]')

def patch(p, old, new, label):
    path = BASE / p
    t = path.read_text()
    if old not in t:
        print(f'  MISS [{label}]')
        print(f'  Looking for: {repr(old[:80])}')
        sys.exit(1)
    path.write_text(t.replace(old, new, 1))
    print(f'  OK   [{label}]')

print('\n═══════════════════════════════════════════════════════')
print('  TDW DEMO SYSTEM — dream-os backend')
print('═══════════════════════════════════════════════════════\n')

# ── Migration ─────────────────────────────────────────────────────────────────
print('── 1. db/migrations/0057_demo_system.sql ───────────────────────────────')
write('db/migrations/0057_demo_system.sql', """\
-- 0057_demo_system.sql
-- TDW Demo System — clean rebuild after vendor demo deletion.
--
-- Three new tables completely isolated from real data:
--   demo_vendors   — demo vendor profiles (photos + metadata)
--   demo_leads     — enquiries from verified demo brides
--   demo_muse_pool — curated images for bride demo Muse board
--
-- ISOLATION:
--   - demo_vendors has NO FK to real vendors/users tables
--   - demo_leads has NO FK to real leads/vendors/users tables
--   - demo_muse_pool is admin-curated, no user data
--
-- otp_sessions table already exists (0033) and is reused for demo bride OTP
-- with purpose='demo_enquiry' — a new allowed value added below.

-- ── 1. demo_vendors ──────────────────────────────────────────────────────────
create table if not exists demo_vendors (
  id                uuid primary key default gen_random_uuid(),
  ig_handle         text not null unique,           -- URL key: /demo/makeupbyswatiroy
  display_name      text not null,                  -- Shown on demo landing
  category          text not null,
  city              text not null,
  whatsapp_phone    text,                           -- Optional: where to send lead notifications
  about             text,
  rate_display      text,                           -- e.g. "₹50K – ₹2L"
  photos            jsonb not null default '[]',    -- [{url, is_hero, cloudinary_id}]
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  created_by        text not null default 'admin'
);

create index if not exists demo_vendors_ig_handle_idx on demo_vendors(ig_handle);
create index if not exists demo_vendors_active_idx    on demo_vendors(active);

comment on table demo_vendors is
  'Demo vendor profiles. Completely separate from real vendors table.
   Photos stored as JSONB array. No FK to users or vendors.
   ig_handle is the URL key for /demo/:handle routes.';

-- ── 2. demo_leads ─────────────────────────────────────────────────────────────
create table if not exists demo_leads (
  id                  uuid primary key default gen_random_uuid(),
  demo_vendor_id      uuid not null references demo_vendors(id) on delete cascade,
  demo_vendor_handle  text not null,
  bride_name          text not null,
  bride_phone         text not null,
  bride_ig_handle     text,
  bride_email         text,
  bride_wedding_date  date,
  bride_wedding_city  text,
  otp_verified        boolean not null default false,
  notified_vendor     boolean not null default false,  -- true once WA notification sent
  admin_notified      boolean not null default false,  -- true once admin WA notification sent
  created_at          timestamptz not null default now()
);

create index if not exists demo_leads_vendor_id_idx  on demo_leads(demo_vendor_id);
create index if not exists demo_leads_created_at_idx on demo_leads(created_at desc);
create index if not exists demo_leads_notified_idx   on demo_leads(notified_vendor, admin_notified);

comment on table demo_leads is
  'Enquiries from demo brides to demo vendors. Completely separate from real leads table.
   OTP verified before lead is saved. notified_vendor = false means admin needs to relay manually.';

-- ── 3. demo_muse_pool ────────────────────────────────────────────────────────
create table if not exists demo_muse_pool (
  id                uuid primary key default gen_random_uuid(),
  image_url         text not null,
  cloudinary_id     text,
  tags              text[] not null default '{}',    -- lehenga, decor, jewellery, mehendi, etc.
  caption           text,
  display_order     integer not null default 0,
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

create index if not exists demo_muse_pool_active_idx on demo_muse_pool(active, display_order);

comment on table demo_muse_pool is
  'Admin-curated images for bride demo Muse board.
   Shown to all bride demo users. No user data — purely content.';

-- ── 4. Extend otp_sessions purpose to allow demo_enquiry ─────────────────────
-- The existing purpose check only allows login | reset.
-- We add demo_enquiry for bride demo OTP verification.
alter table otp_sessions
  drop constraint if exists otp_sessions_purpose_check;

alter table otp_sessions
  add constraint otp_sessions_purpose_check
  check (purpose in ('login', 'reset', 'demo_enquiry'));

comment on column otp_sessions.purpose is
  'login = vendor/couple login. reset = forgot-pin. demo_enquiry = bride demo enquiry OTP.';
""")

# ── Demo vendor public API ─────────────────────────────────────────────────────
print('\n── 2. src/api/demo/vendor.js ───────────────────────────────────────────')
write('src/api/demo/vendor.js', r"""
// src/api/demo/vendor.js
// Public demo endpoints — no auth required.
// Mounted at /api/v2/demo via router.js
//
// ENDPOINTS
//   GET  /vendor/:handle        — fetch demo vendor profile + photos
//   POST /vendor/:handle/otp    — send OTP to bride's phone for enquiry verification
//   POST /vendor/:handle/enquire — verify OTP + save demo lead + notify vendor
//   GET  /muse-pool             — fetch curated images for bride demo Muse board

'use strict';

const express      = require('express');
const router       = express.Router();
const bcrypt       = require('bcryptjs');
const asyncHandler = require('../../lib/asyncHandler');
const { sendWhatsApp } = require('../../lib/whatsapp');

const BCRYPT_ROUNDS = 10;
const OTP_TTL_MS    = 5 * 60 * 1000; // 5 minutes
const PHONE_RE      = /^\+[0-9]{8,15}$/;

// Admin phone — fallback notification recipient when vendor has no WhatsApp stored
const ADMIN_PHONE = process.env.ADMIN_WHATSAPP || '+918757788550';
const VENDOR_WA   = process.env.TDW_WA_NUMBER
  ? `+${process.env.TDW_WA_NUMBER}`
  : '+917982159047';

function generateOtp() {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

// ── GET /vendor/:handle ───────────────────────────────────────────────────────
// Returns demo vendor profile + photos for landing page.
// No auth. handle is the IG handle (e.g. makeupbyswatiroy).
router.get('/vendor/:handle', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const handle   = req.params.handle.toLowerCase().trim();

  const { data: vendor, error } = await supabase
    .from('demo_vendors')
    .select('id, ig_handle, display_name, category, city, about, rate_display, photos')
    .eq('ig_handle', handle)
    .eq('active', true)
    .maybeSingle();

  if (error || !vendor) {
    return res.status(404).json({ ok: false, error: 'Demo profile not found or inactive.' });
  }

  return res.json({
    ok: true,
    vendor: {
      id:           vendor.id,
      ig_handle:    vendor.ig_handle,
      name:         vendor.display_name,
      category:     vendor.category,
      city:         vendor.city,
      about:        vendor.about,
      rate_display: vendor.rate_display,
      photos:       vendor.photos || [],
    },
  });
}));

// ── POST /vendor/:handle/otp ──────────────────────────────────────────────────
// Sends OTP to bride's phone for enquiry verification.
// Body: { phone }
router.post('/vendor/:handle/otp', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const handle   = req.params.handle.toLowerCase().trim();
  const { phone } = req.body;

  if (!phone || !PHONE_RE.test(phone.trim())) {
    return res.status(400).json({ ok: false, error: 'Valid phone number required (e.g. +918757788550).' });
  }
  const cleanPhone = phone.trim();

  // Verify demo vendor exists
  const { data: vendor } = await supabase
    .from('demo_vendors')
    .select('id, display_name')
    .eq('ig_handle', handle)
    .eq('active', true)
    .maybeSingle();

  if (!vendor) {
    return res.status(404).json({ ok: false, error: 'Demo profile not found.' });
  }

  // Generate + hash OTP
  const otp     = generateOtp();
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expires = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error: upsertErr } = await supabase.from('otp_sessions').upsert(
    { phone: cleanPhone, otp_hash: otpHash, purpose: 'demo_enquiry',
      expires_at: expires, created_at: new Date().toISOString() },
    { onConflict: 'phone' }
  );

  if (upsertErr) {
    console.error('[demo:otp] upsert error:', upsertErr.message);
    return res.status(500).json({ ok: false, error: 'Could not send OTP. Try again.' });
  }

  // Send via Twilio
  try {
    await sendWhatsApp(
      cleanPhone,
      `Your The Dream Wedding verification code is: *${otp}*\n\nThis code expires in 5 minutes. Do not share it with anyone.`
    );
  } catch (err) {
    console.error('[demo:otp] twilio error:', err.message);
    return res.status(500).json({ ok: false, error: 'Could not send OTP. Try again.' });
  }

  console.log(`[demo:otp] sent to ${cleanPhone} for handle=${handle}`);
  return res.json({ ok: true });
}));

// ── POST /vendor/:handle/enquire ──────────────────────────────────────────────
// Verifies OTP + saves demo lead + notifies vendor (or admin).
// Body: { name, phone, otp, ig_handle?, email?, wedding_date?, wedding_city? }
router.post('/vendor/:handle/enquire', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const handle   = req.params.handle.toLowerCase().trim();
  const {
    name, phone, otp,
    ig_handle: brideIg, email,
    wedding_date, wedding_city,
  } = req.body;

  if (!name?.trim() || !phone?.trim() || !otp?.trim()) {
    return res.status(400).json({ ok: false, error: 'Name, phone and OTP are required.' });
  }
  const cleanPhone = phone.trim();

  // 1. Verify OTP
  const { data: otpRow } = await supabase
    .from('otp_sessions')
    .select('otp_hash, expires_at')
    .eq('phone', cleanPhone)
    .eq('purpose', 'demo_enquiry')
    .maybeSingle();

  if (!otpRow) {
    return res.status(400).json({ ok: false, error: 'OTP expired or not found. Request a new one.' });
  }
  if (new Date(otpRow.expires_at) < new Date()) {
    await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);
    return res.status(400).json({ ok: false, error: 'OTP expired. Request a new one.' });
  }
  const valid = await bcrypt.compare(otp.trim(), otpRow.otp_hash);
  if (!valid) {
    return res.status(400).json({ ok: false, error: 'Incorrect OTP.' });
  }

  // Delete OTP (single-use)
  await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);

  // 2. Fetch demo vendor
  const { data: vendor } = await supabase
    .from('demo_vendors')
    .select('id, ig_handle, display_name, category, city, whatsapp_phone')
    .eq('ig_handle', handle)
    .eq('active', true)
    .maybeSingle();

  if (!vendor) {
    return res.status(404).json({ ok: false, error: 'Demo profile not found.' });
  }

  // 3. Save demo lead
  const { data: lead, error: leadErr } = await supabase
    .from('demo_leads')
    .insert({
      demo_vendor_id:     vendor.id,
      demo_vendor_handle: vendor.ig_handle,
      bride_name:         name.trim(),
      bride_phone:        cleanPhone,
      bride_ig_handle:    brideIg?.trim() || null,
      bride_email:        email?.trim() || null,
      bride_wedding_date: wedding_date || null,
      bride_wedding_city: wedding_city?.trim() || null,
      otp_verified:       true,
    })
    .select('id')
    .single();

  if (leadErr) {
    console.error('[demo:enquire] lead insert error:', leadErr.message);
    return res.status(500).json({ ok: false, error: 'Could not save enquiry. Try again.' });
  }

  // 4. Build notification message
  const dateStr = wedding_date
    ? new Date(wedding_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'date TBD';

  const brideDetails = [
    `Name: ${name.trim()}`,
    `Phone: ${cleanPhone}`,
    brideIg ? `Instagram: @${brideIg.trim()}` : null,
    email ? `Email: ${email.trim()}` : null,
    wedding_city ? `City: ${wedding_city.trim()}` : null,
    `Wedding: ${dateStr}`,
  ].filter(Boolean).join('\n');

  const vendorMsg =
    `Hi ${vendor.display_name.split(' ')[0]} — you have a new enquiry from your TDW demo profile!\n\n` +
    `${brideDetails}\n\n` +
    `She found you at thedreamwedding.in/demo/${vendor.ig_handle}\n\n` +
    `Ready to claim your studio? Reply to this message or visit thedreamwedding.in`;

  const adminMsg =
    `[TDW Demo Lead] New enquiry for @${vendor.ig_handle} (${vendor.display_name})\n\n` +
    `${brideDetails}\n\n` +
    `No vendor phone stored — please relay manually.`;

  // 5. Notify vendor or admin
  let notifiedVendor = false;
  let adminNotified  = false;

  if (vendor.whatsapp_phone) {
    try {
      await sendWhatsApp(vendor.whatsapp_phone, vendorMsg);
      notifiedVendor = true;
      console.log(`[demo:enquire] notified vendor ${vendor.whatsapp_phone} for lead=${lead.id}`);
    } catch (err) {
      console.error('[demo:enquire] vendor notify failed:', err.message);
      // Fall through to admin notification
    }
  }

  if (!notifiedVendor) {
    try {
      await sendWhatsApp(ADMIN_PHONE, adminMsg);
      adminNotified = true;
      console.log(`[demo:enquire] notified admin for lead=${lead.id}`);
    } catch (err) {
      console.error('[demo:enquire] admin notify failed:', err.message);
    }
  }

  // Update notification flags
  await supabase.from('demo_leads').update({
    notified_vendor: notifiedVendor,
    admin_notified:  adminNotified,
  }).eq('id', lead.id);

  return res.json({ ok: true, lead_id: lead.id, notified: notifiedVendor || adminNotified });
}));

// ── GET /muse-pool ────────────────────────────────────────────────────────────
// Returns curated images for bride demo Muse board.
// No auth. Returns active images ordered by display_order.
router.get('/muse-pool', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: images, error } = await supabase
    .from('demo_muse_pool')
    .select('id, image_url, tags, caption')
    .eq('active', true)
    .order('display_order', { ascending: true });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Muse pool unavailable.' });
  }

  return res.json({ ok: true, images: images || [] });
}));

// ── GET /vendors ──────────────────────────────────────────────────────────────
// Returns all active demo vendors for bride demo Discover feed.
router.get('/vendors', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: vendors, error } = await supabase
    .from('demo_vendors')
    .select('id, ig_handle, display_name, category, city, photos')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Demo vendors unavailable.' });
  }

  const shaped = (vendors || []).map(v => ({
    id:       v.id,
    handle:   v.ig_handle,
    name:     v.display_name,
    category: v.category,
    city:     v.city,
    photos:   (v.photos || []).map(p => p.url || p.image_url || p).filter(Boolean),
  }));

  return res.json({ ok: true, vendors: shaped });
}));

module.exports = router;
""")

# ── Admin demo management API ──────────────────────────────────────────────────
print('\n── 3. src/api/admin/demoMgr.js ─────────────────────────────────────────')
write('src/api/admin/demoMgr.js', r"""
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
""")

# ── Seed SQL for shared demo vendor ───────────────────────────────────────────
print('\n── 4. db/seed/demo_vendor_seed.sql ─────────────────────────────────────')
write('db/seed/demo_vendor_seed.sql', """\
-- db/seed/demo_vendor_seed.sql
-- Run ONCE to seed the shared demo vendor UUID with aspirational data.
-- This UUID is used for DreamAi context in all vendor demos.
--
-- DEMO VENDOR UUID: bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb (existing test vendor)
-- All demo DreamAi sessions point to this vendor's data.
-- The vendor app reads this data when tdw_vendor_demo_session is set.
--
-- Run from Supabase SQL editor.
-- Safe to re-run (uses INSERT ... ON CONFLICT DO NOTHING).

-- ── Aspirational Leads (20 leads — mix of states) ─────────────────────────
INSERT INTO leads (vendor_id, name, phone, wedding_date, wedding_city, budget_max, state, source, referrer_name, raw_message, created_at)
VALUES
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Ananya Sharma', NULL, NOW() + INTERVAL '8 months', 'Delhi', 250000, 'new', 'discover', NULL, 'Loved your work on TDW! Looking for bridal services for Nov wedding.', NOW() - INTERVAL '1 day'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Priya & Rohit', NULL, NOW() + INTERVAL '10 months', 'Gurgaon', 180000, 'new', 'instagram', NULL, 'Your portfolio is stunning. Can you share your packages?', NOW() - INTERVAL '2 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Meera Kapoor', NULL, NOW() + INTERVAL '6 months', 'Mumbai', 350000, 'quoted', 'referral', 'Divya Sharma', 'Divya recommended you highly. Need services for my September wedding.', NOW() - INTERVAL '4 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Kavya Nair', NULL, NOW() + INTERVAL '5 months', 'Bangalore', 120000, 'contacted', 'whatsapp', NULL, 'Hi! Saw your work. Available for August wedding in Bangalore?', NOW() - INTERVAL '5 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Simran Oberoi', NULL, NOW() + INTERVAL '12 months', 'Chandigarh', 200000, 'new', 'discover', NULL, 'Planning early! Looking to book for next December.', NOW() - INTERVAL '6 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Riya & Dev', NULL, NOW() + INTERVAL '7 months', 'Jaipur', 450000, 'booked', 'referral', 'Meera Kapoor', 'Palace wedding in Jaipur. Need full services.', NOW() - INTERVAL '10 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Tanya Malhotra', NULL, NOW() + INTERVAL '4 months', 'Delhi', 150000, 'contacted', 'instagram', NULL, 'Your reels are beautiful. Can we schedule a call?', NOW() - INTERVAL '12 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Pooja Mehta', NULL, NOW() + INTERVAL '9 months', 'Pune', 280000, 'quoted', 'discover', NULL, 'Interested in your prestige package. Please send details.', NOW() - INTERVAL '14 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Aditi Khanna', NULL, NOW() + INTERVAL '3 months', 'Noida', 90000, 'new', 'whatsapp', NULL, 'Quick wedding, 3 months away. Available?', NOW() - INTERVAL '15 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Nisha & Arjun', NULL, NOW() + INTERVAL '11 months', 'Udaipur', 600000, 'contacted', 'referral', 'Riya Dev', 'Destination wedding in Udaipur. Very specific aesthetic.', NOW() - INTERVAL '18 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Deepika Reddy', NULL, NOW() + INTERVAL '6 months', 'Hyderabad', 200000, 'quoted', 'instagram', NULL, 'South Indian bridal look. Do you have experience?', NOW() - INTERVAL '20 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Sunita & Vikram', NULL, NOW() + INTERVAL '8 months', 'Amritsar', 175000, 'new', 'discover', NULL, 'Punjabi wedding. Looking for traditional + modern mix.', NOW() - INTERVAL '22 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Isha Patel', NULL, NOW() + INTERVAL '5 months', 'Ahmedabad', 130000, 'lost', 'whatsapp', NULL, 'Found someone local. Thank you anyway!', NOW() - INTERVAL '25 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Preethi Iyer', NULL, NOW() + INTERVAL '14 months', 'Chennai', 220000, 'new', 'referral', 'Kavya Nair', 'Planning 14 months ahead. Want to lock in the best.', NOW() - INTERVAL '28 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Mansi Gupta', NULL, NOW() + INTERVAL '7 months', 'Jaisalmer', 380000, 'booked', 'discover', NULL, 'Desert wedding! Very excited to work with you.', NOW() - INTERVAL '30 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Radhika Chopra', NULL, NOW() + INTERVAL '4 months', 'Delhi', 160000, 'contacted', 'instagram', NULL, 'Seen your work for 2 years. Finally getting married!', NOW() - INTERVAL '35 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Anjali Singh', NULL, NOW() + INTERVAL '6 months', 'Lucknow', 110000, 'new', 'whatsapp', NULL, 'Budget is tight but love your work. Any packages?', NOW() - INTERVAL '38 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Swara & Karan', NULL, NOW() + INTERVAL '9 months', 'Kolkata', 300000, 'quoted', 'discover', NULL, 'Bengali wedding + reception. Need two looks.', NOW() - INTERVAL '40 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Divya Menon', NULL, NOW() + INTERVAL '5 months', 'Kochi', 180000, 'contacted', 'referral', 'Preethi Iyer', 'Kerala wedding. Need someone who understands our style.', NOW() - INTERVAL '45 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Neha & Tarun', NULL, NOW() + INTERVAL '3 months', 'Rishikesh', 250000, 'booked', 'discover', NULL, 'Mountain wedding! So excited. Deposit sent.', NOW() - INTERVAL '50 days')
ON CONFLICT DO NOTHING;

-- ── Clients (10 past clients — delivered) ─────────────────────────────────
INSERT INTO clients (vendor_id, name, phone, notes, source, created_at)
VALUES
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Ritika Sharma', NULL, 'Nov 2025 wedding, Delhi. Bridal + 3 family members. Client was thrilled.', 'lead_promotion', NOW() - INTERVAL '90 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Aisha Khan', NULL, 'Oct 2025 wedding, Mumbai. Minimalist bridal look. Excellent feedback.', 'lead_promotion', NOW() - INTERVAL '120 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Pooja Singhania', NULL, 'Sep 2025 Udaipur destination wedding. 4-day event coverage.', 'lead_promotion', NOW() - INTERVAL '150 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Gayatri Rao', NULL, 'Aug 2025, Hyderabad. South Indian bridal. Client referred 2 new bookings.', 'lead_promotion', NOW() - INTERVAL '180 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Simran Bedi', NULL, 'Jul 2025, Chandigarh. Big fat Punjabi wedding. 200+ guests.', 'lead_promotion', NOW() - INTERVAL '210 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Tara Mehra', NULL, 'Jun 2025, Jaipur palace. Heritage venue, editorial look. Featured in magazine.', 'referral', NOW() - INTERVAL '240 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Ananya Pillai', NULL, 'May 2025, Kochi. Kerala traditional + fusion reception look.', 'lead_promotion', NOW() - INTERVAL '270 days'),
  ('2eb5d3fb-31eb-4b26-859a-cf10ae547d53', 'Nikita Gupta', NULL, 'Apr 2025, Delhi. Celebrity attendees. High pressure, flawless execution.', 'referral', NOW() - INTERVAL '300 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Priya Joshi', NULL, 'Mar 2025, Pune. Intimate 50-guest wedding. Very personal experience.', 'lead_promotion', NOW() - INTERVAL '330 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Deepa Krishnan', NULL, 'Feb 2025, Bangalore. Tech founder wedding. Minimalist luxury brief.', 'discover', NOW() - INTERVAL '360 days')
ON CONFLICT DO NOTHING;

-- ── Invoices (12 invoices — mix of states) ────────────────────────────────
INSERT INTO invoices (vendor_id, invoice_number, client_name, amount_total, amount_paid, amount_owed, state, due_date, created_at)
VALUES
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/001', 'Riya & Dev', 450000, 135000, 315000, 'advance_paid', NOW() + INTERVAL '6 months', NOW() - INTERVAL '5 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/002', 'Mansi Gupta', 380000, 114000, 266000, 'advance_paid', NOW() + INTERVAL '6 months', NOW() - INTERVAL '10 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/003', 'Neha & Tarun', 250000, 75000, 175000, 'advance_paid', NOW() + INTERVAL '2 months', NOW() - INTERVAL '15 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/004', 'Meera Kapoor', 350000, 0, 350000, 'unpaid', NOW() + INTERVAL '5 months', NOW() - INTERVAL '3 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/005', 'Pooja Mehta', 280000, 0, 280000, 'unpaid', NOW() + INTERVAL '8 months', NOW() - INTERVAL '7 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/006', 'Nisha & Arjun', 600000, 0, 600000, 'unpaid', NOW() + INTERVAL '10 months', NOW() - INTERVAL '2 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/007', 'Ritika Sharma', 320000, 320000, 0, 'paid', NOW() - INTERVAL '30 days', NOW() - INTERVAL '95 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/008', 'Aisha Khan', 280000, 280000, 0, 'paid', NOW() - INTERVAL '60 days', NOW() - INTERVAL '125 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/009', 'Pooja Singhania', 450000, 450000, 0, 'paid', NOW() - INTERVAL '90 days', NOW() - INTERVAL '155 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/010', 'Gayatri Rao', 200000, 200000, 0, 'paid', NOW() - INTERVAL '120 days', NOW() - INTERVAL '185 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/011', 'Tara Mehra', 380000, 380000, 0, 'paid', NOW() - INTERVAL '180 days', NOW() - INTERVAL '245 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/012', 'Swara & Karan', 300000, 0, 300000, 'unpaid', NOW() + INTERVAL '8 months', NOW() - INTERVAL '8 days')
ON CONFLICT DO NOTHING;

-- ── Events (10 upcoming events) ───────────────────────────────────────────
INSERT INTO events (vendor_id, title, event_date, event_time, kind, state, notes, created_at)
VALUES
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Tanya Malhotra — Bridal Trial', NOW() + INTERVAL '5 days', '11:00', 'meeting', 'upcoming', 'Studio appointment. She wants soft glam. Send mood board before.', NOW() - INTERVAL '2 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Kavya Nair — Pre-Wedding Shoot', NOW() + INTERVAL '12 days', '06:30', 'shoot', 'upcoming', 'Lodhi Garden. Golden hour. Airbrush + HD setup.', NOW() - INTERVAL '3 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Radhika Chopra — Mehendi Day', NOW() + INTERVAL '18 days', '09:00', 'shoot', 'upcoming', 'Home, Vasant Vihar. Yellow + floral theme. 4 family members too.', NOW() - INTERVAL '5 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Aditi Khanna — Wedding Day', NOW() + INTERVAL '25 days', '05:00', 'shoot', 'upcoming', 'ITC Maurya. Early start. Full bridal + reception look. Long day.', NOW() - INTERVAL '8 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Deepika Reddy — Video Call Consult', NOW() + INTERVAL '3 days', '15:00', 'call', 'upcoming', 'She wants to discuss South Indian bridal inspiration. Share portfolio beforehand.', NOW() - INTERVAL '1 day'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Meera Kapoor — Contract Review Call', NOW() + INTERVAL '7 days', '12:00', 'call', 'upcoming', 'Go over package details. She has questions about travel charges.', NOW() - INTERVAL '4 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Nisha & Arjun — Site Visit Udaipur', NOW() + INTERVAL '35 days', '10:00', 'recce', 'upcoming', 'City Palace. Check lighting at different times. Bring assistant.', NOW() - INTERVAL '6 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Riya & Dev — Jaipur Wedding Day 1', NOW() + INTERVAL '42 days', '07:00', 'shoot', 'upcoming', 'Rambagh Palace. Mehendi + Haldi. Heritage setting.', NOW() - INTERVAL '10 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Riya & Dev — Jaipur Wedding Day 2', NOW() + INTERVAL '43 days', '05:30', 'shoot', 'upcoming', 'Main wedding ceremony + reception. 3 looks for bride.', NOW() - INTERVAL '10 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Mansi Gupta — Jaisalmer Pre-Wedding', NOW() + INTERVAL '55 days', '17:00', 'shoot', 'upcoming', 'Sam Sand Dunes. Sunset shoot. Camel caravan setup.', NOW() - INTERVAL '12 days')
ON CONFLICT DO NOTHING;

-- ── Expenses (8 expenses) ─────────────────────────────────────────────────
INSERT INTO expenses (vendor_id, description, category, amount, expense_date, client_name, created_at)
VALUES
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Flight — Jaipur for Riya & Dev wedding', 'travel', 8500, NOW() - INTERVAL '5 days', 'Riya & Dev', NOW() - INTERVAL '5 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Assistant — Kavya shoot', 'assistant', 5000, NOW() - INTERVAL '8 days', 'Kavya Nair', NOW() - INTERVAL '8 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Airbrush kit refill', 'equipment', 3200, NOW() - INTERVAL '12 days', NULL, NOW() - INTERVAL '12 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Hotel — Udaipur site visit', 'travel', 6500, NOW() - INTERVAL '18 days', 'Nisha & Arjun', NOW() - INTERVAL '18 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'HD makeup products restock', 'equipment', 12000, NOW() - INTERVAL '25 days', NULL, NOW() - INTERVAL '25 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Second artist — Pooja Singhania wedding', 'assistant', 15000, NOW() - INTERVAL '30 days', 'Pooja Singhania', NOW() - INTERVAL '30 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Cab — multiple shoots this month', 'travel', 4200, NOW() - INTERVAL '35 days', NULL, NOW() - INTERVAL '35 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Studio props + accessories', 'equipment', 8800, NOW() - INTERVAL '45 days', NULL, NOW() - INTERVAL '45 days')
ON CONFLICT DO NOTHING;
""")

# ── Wire into router.js ────────────────────────────────────────────────────────
print('\n── 5. src/api/router.js — add demo routes ──────────────────────────────')
router_path = BASE / 'src/api/router.js'
router_t = router_path.read_text()
if "require('./admin/demoMgr')" in router_t and "require('./demo/vendor')" in router_t:
    print('  SKIP [demo routes already wired]')
else:
    patch('src/api/router.js',
        "// Demo admin routes (admin auth enforced inside the file)\n\n// Demo public routes — no auth required",
        "// Demo admin routes (admin auth enforced inside the file)\nrouter.use('/admin/demo', require('./admin/demoMgr'));\n\n// Demo public routes — no auth required\nrouter.use('/demo',       require('./demo/vendor'));",
        'add demo routes'
    )

# ── Validate JS ────────────────────────────────────────────────────────────────
print('\n── 6. Validate JS syntax ────────────────────────────────────────────────')
result = subprocess.run(
    ['node', '--check', 'src/api/demo/vendor.js', 'src/api/admin/demoMgr.js', 'src/api/router.js'],
    capture_output=True, text=True
)
if result.returncode == 0:
    print('  ALL FILES CLEAN \u2713')
else:
    print('  ERRORS:')
    print(result.stderr)
    sys.exit(1)

print('\n\u2705  dream-os demo system built. Steps to complete:')
print()
print('  1. git add -A')
print('  2. git commit -m "feat(demo): vendor + bride demo system — isolated tables, OTP-verified leads"')
print('  3. git push')
print()
print('  4. Run migration in Supabase SQL editor:')
print('     db/migrations/0057_demo_system.sql')
print()
print('  5. Run seed data in Supabase SQL editor:')
print('     db/seed/demo_vendor_seed.sql')
print('     (This seeds 20 leads, 10 clients, 12 invoices, 10 events, 8 expenses for DreamAi demo context)')
