// src/api/admin/demo.js
// Admin endpoints for demo profile management
// All routes (except /view) require admin password via x-admin-password header
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');

// ── Helper — Generate DM message ─────────────────────────────────────────────
function generateDMMessage(name, studioLink, brideLink) {
  return `Hi ${name} —\n\nI built India's first curated wedding discovery platform and thought you deserved to see it.\n\nYour studio: ${studioLink}\nWhat your brides see: ${brideLink}\n\nNo signup. No card. Just tap and explore.\n\nIf you want to keep it — reply and I'll set up your real account. First month on us.\n\n— Dev`;
}

// ── POST /api/v2/demo/view — Log a demo profile view event (PUBLIC) ───────────
// Mounted BEFORE adminAuth so no auth needed
router.post('/view', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { handle, event, user_agent, referrer } = req.body;

  if (!handle || !event) {
    return res.status(400).json({ ok: false, error: 'handle and event required' });
  }

  // Find vendor_id for this handle
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .ilike('demo_handle', handle)
    .maybeSingle();

  await supabase.from('demo_profile_views').insert({
    vendor_id: vendor?.id || null,
    handle: handle.toLowerCase(),
    event,
    user_agent: user_agent || null,
    referrer: referrer || null
  });

  return res.json({ ok: true });
}));

// ── All routes below require admin auth ──────────────────────────────────────
router.use(requireAdmin);

// ── POST /api/v2/admin/demo — Create demo profile ────────────────────────────
router.post('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const {
    name,
    demo_handle,
    instagram_handle,
    category,
    city,
    about,
    photo_urls = [],
    expires_hours = 48,
    notes
  } = req.body;

  if (!name || !demo_handle || !category || !city) {
    return res.status(400).json({ ok: false, error: 'name, demo_handle, category, city required' });
  }
  if (photo_urls.length < 3) {
    return res.status(400).json({ ok: false, error: 'Minimum 3 photos required' });
  }
  if (photo_urls.length > 6) {
    return res.status(400).json({ ok: false, error: 'Maximum 6 photos allowed' });
  }

  // Check handle not already active
  const { data: existing } = await supabase
    .from('vendors')
    .select('id')
    .ilike('demo_handle', demo_handle)
    .eq('demo_active', true)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ ok: false, error: 'Demo handle already active. Deactivate it first.' });
  }

  // Create ghost user row
  const ghostPhone = `+10000${Date.now().toString().slice(-7)}`;

  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({ phone: ghostPhone, name })
    .select('id')
    .single();

  if (userErr) {
    return res.status(500).json({ ok: false, error: 'Failed to create ghost user', detail: userErr.message });
  }

  const expiresAt = new Date(Date.now() + expires_hours * 60 * 60 * 1000).toISOString();

  const { data: vendor, error: vendorErr } = await supabase
    .from('vendors')
    .insert({
      user_id: user.id,
      category,
      city,
      status: 'active',
      tier: 'signature',
      demo_active: true,
      demo_expires_at: expiresAt,
      demo_created_at: new Date().toISOString(),
      demo_handle: demo_handle.toLowerCase(),
      demo_instagram: instagram_handle ? instagram_handle.replace('@', '') : null,
      demo_notes: notes || null,
      discover_eligible: true,
      onboarding_state: 'complete',
      briefing_enabled: false
    })
    .select('id')
    .single();

  if (vendorErr) {
    await supabase.from('users').delete().eq('id', user.id);
    return res.status(500).json({ ok: false, error: 'Failed to create vendor', detail: vendorErr.message });
  }

  // Insert portfolio rows
  const portfolioRows = photo_urls.map((url, i) => ({
    vendor_id: vendor.id,
    image_url: url,
    approval_state: 'approved',
    is_hero: i === 0,
    in_carousel: true,
    reviewed_by_admin: 'demo_system',
    reviewed_at: new Date().toISOString()
  }));

  const { error: portfolioErr } = await supabase
    .from('vendor_portfolio')
    .insert(portfolioRows);

  if (portfolioErr) {
    return res.status(500).json({ ok: false, error: 'Failed to insert portfolio', detail: portfolioErr.message });
  }

  const studioLink = `https://demo.thedreamwedding.in/${demo_handle.toLowerCase()}`;
  const brideLink  = `https://demo.thedreamwedding.in/bride`;
  const dmMessage  = generateDMMessage(name, studioLink, brideLink);

  return res.json({
    ok: true,
    vendor_id: vendor.id,
    demo_handle: demo_handle.toLowerCase(),
    studio_link: studioLink,
    bride_link: brideLink,
    expires_at: expiresAt,
    dm_message: dmMessage
  });
}));

// ── GET /api/v2/admin/demo — List all demo profiles ──────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: vendors } = await supabase
    .from('vendors')
    .select(`
      id,
      demo_handle,
      demo_instagram,
      demo_active,
      demo_expires_at,
      demo_created_at,
      demo_notes,
      category,
      city,
      users!inner(name),
      vendor_portfolio(image_url, is_hero, approval_state)
    `)
    .not('demo_handle', 'is', null)
    .order('demo_created_at', { ascending: false });

  const now = new Date().toISOString();

  const enriched = await Promise.all((vendors || []).map(async (v) => {
    const { data: views } = await supabase
      .from('demo_profile_views')
      .select('event, viewed_at')
      .eq('vendor_id', v.id)
      .order('viewed_at', { ascending: false });

    const viewsByEvent = (views || []).reduce((acc, row) => {
      acc[row.event] = (acc[row.event] || 0) + 1;
      return acc;
    }, {});

    const lastViewed = views?.[0]?.viewed_at || null;
    const hasViewed  = (viewsByEvent['landing_viewed'] || 0) > 0;
    const hasEntered = (viewsByEvent['studio_entered'] || 0) > 0;
    const hasChatted = (viewsByEvent['chat_started'] || 0) > 0;

    const name = v.users?.name || v.demo_handle;

    return {
      ...v,
      name,
      views: viewsByEvent,
      last_viewed_at: lastViewed,
      status_label: !hasViewed  ? 'not_opened'
        : !hasEntered           ? 'opened_landing'
        : !hasChatted           ? 'entered_studio'
        : 'used_dreamai',
      demo_link: `https://demo.thedreamwedding.in/${v.demo_handle}`,
      dm_message: generateDMMessage(
        name,
        `https://demo.thedreamwedding.in/${v.demo_handle}`,
        'https://demo.thedreamwedding.in/bride'
      )
    };
  }));

  const active  = enriched.filter(v => v.demo_active && v.demo_expires_at > now);
  const expired = enriched.filter(v => !v.demo_active || v.demo_expires_at <= now);

  return res.json({ ok: true, active, expired });
}));

// ── DELETE /api/v2/admin/demo/:vendor_id — Deactivate ────────────────────────
router.delete('/:vendor_id', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { vendor_id } = req.params;

  const { error } = await supabase
    .from('vendors')
    .update({ demo_active: false })
    .eq('id', vendor_id)
    .not('demo_handle', 'is', null);

  if (error) return res.status(500).json({ ok: false, error: error.message });

  return res.json({ ok: true });
}));

// ── POST /api/v2/admin/demo/:vendor_id/extend — Extend expiry ────────────────
router.post('/:vendor_id/extend', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { vendor_id } = req.params;
  const { hours = 48 } = req.body;

  const newExpiry = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('vendors')
    .update({ demo_active: true, demo_expires_at: newExpiry })
    .eq('id', vendor_id)
    .not('demo_handle', 'is', null);

  if (error) return res.status(500).json({ ok: false, error: error.message });

  return res.json({ ok: true, expires_at: newExpiry });
}));

module.exports = router;
