// src/api/admin/demo.js
// Admin endpoints for demo profile management
// All routes (except /view) require admin password via x-admin-password header
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
// Inline mintSession — avoids circular dependency with vendor/auth.js
async function mintSession(supabase, userId) {
  const internalEmail = `vendor-${userId}@internal.dreamai.app`;

  // Step 1 — create or find auth.users row
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    id: userId, email: internalEmail, email_confirm: true,
  });

  let authId = userId;
  if (createErr) {
    const msg = createErr.message || '';
    if (!msg.includes('already registered') && createErr.status !== 422) {
      throw new Error(`auth.users create failed: ${msg}`);
    }
    const { data: existing, error: lookupErr } = await supabase.auth.admin.getUserById(userId);
    if (lookupErr || !existing?.user) throw new Error(`auth.users lookup failed`);
    authId = existing.user.id;
  } else {
    authId = created.user.id;
  }

  // Step 2 — pin stable internal email
  const { error: updateErr } = await supabase.auth.admin.updateUserById(authId, {
    email: internalEmail, email_confirm: true,
  });
  if (updateErr) throw new Error(`email pin failed: ${updateErr.message}`);

  // Step 3 — generate magic-link token server-side (no email dispatched)
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink', email: internalEmail,
  });
  if (linkErr) throw new Error(`generateLink failed: ${linkErr.message}`);

  // Step 4 — exchange for real JWT session
  const { data: sessionData, error: sessionErr } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token, type: 'email',
  });
  if (sessionErr) throw new Error(`verifyOtp failed: ${sessionErr.message}`);

  return {
    access_token:  sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  };
}

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

// ── GET /api/v2/demo/activate/:handle — Public. Returns real session for demo vendor ──
// Called by demo.thedreamwedding.in/[handle] landing page.
// Returns full vendor session JSON so DreamAi app loads without login.
router.get('/activate/:handle', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const handle   = req.params.handle.toLowerCase();
  const now      = new Date().toISOString();

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select(`
      id,
      demo_handle,
      demo_session_token,
      demo_session_expires_at,
      demo_expires_at,
      demo_active,
      demo_instagram,
      category,
      city,
      routing_handle,
      tier,
      users!inner(id, name, phone),
      vendor_portfolio(id, image_url, caption, is_hero, approval_state)
    `)
    .ilike('demo_handle', handle)
    .eq('demo_active', true)
    .gt('demo_expires_at', now)
    .maybeSingle();

  if (error || !vendor) {
    return res.status(404).json({ ok: false, error: 'Demo profile not found or expired' });
  }

  if (!vendor.demo_session_token) {
    return res.status(404).json({ ok: false, error: 'Demo session not available for this profile' });
  }

  // Only return approved photos
  const photos = (vendor.vendor_portfolio || [])
    .filter(p => p.approval_state === 'approved')
    .sort((a, b) => (b.is_hero ? 1 : 0) - (a.is_hero ? 1 : 0));

  // Shape the vendor session exactly as DreamAi expects
  const session = {
    id:            vendor.id,
    user_id:       vendor.users?.id,
    name:          vendor.users?.name,
    phone:         vendor.users?.phone,
    tier:          vendor.tier || 'signature',
    access_token:  vendor.demo_session_token,
    refresh_token: vendor.demo_session_token, // same token — demo only
    routing_handle: vendor.routing_handle,
    category:      vendor.category,
    city:          vendor.city,
    instagram:     vendor.demo_instagram,
    photos,
    demo:          true,
    demo_handle:   vendor.demo_handle,
    expires_at:    vendor.demo_expires_at,
  };

  return res.json({ ok: true, session });
}));

// ── GET /api/v2/demo/discover — Public. Returns active demo vendors for bride demo feed ──
// Completely isolated from the real discover feed.
// Only returns vendors with demo_active=true, not expired, with approved photos.
router.get('/discover', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const now      = new Date().toISOString();

  const { data: vendors, error } = await supabase
    .from('vendors')
    .select(`
      id,
      demo_handle,
      demo_instagram,
      category,
      city,
      routing_handle,
      users!inner(name),
      vendor_portfolio(image_url, is_hero, approval_state)
    `)
    .eq('demo_active', true)
    .gt('demo_expires_at', now)
    .not('demo_handle', 'is', null);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Demo discover unavailable' });
  }

  const shaped = (vendors || [])
    .map(v => {
      const photos = (v.vendor_portfolio || [])
        .filter(p => p.approval_state === 'approved')
        .sort((a, b) => (b.is_hero ? 1 : 0) - (a.is_hero ? 1 : 0))
        .map(p => p.image_url);

      if (photos.length === 0) return null; // skip vendors with no approved photos

      return {
        id:             v.id,
        name:           v.users?.name || v.demo_handle,
        category:       v.category,
        city:           v.city,
        routing_handle: v.routing_handle,
        handle:         v.demo_handle,
        instagram:      v.demo_instagram,
        photos,
        enquire_link:   v.routing_handle
          ? `https://wa.me/917982159047?text=TDW-${v.routing_handle}`
          : null,
      };
    })
    .filter(Boolean);

  return res.json({ ok: true, vendors: shaped });
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
    vendor_phone,       // optional — real WhatsApp number for notifications
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

  // Use real vendor phone if provided, otherwise generate a ghost number
  // Real phone = vendor receives WhatsApp notification when a bride enquires
  const userPhone = vendor_phone
    ? vendor_phone.replace(/\s/g, '').replace(/^0/, '+91')
    : `+10000${Date.now().toString().slice(-7)}`;

  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({ phone: userPhone, name })
    .select('id')
    .single();

  if (userErr) {
    return res.status(500).json({ ok: false, error: 'Failed to create ghost user', detail: userErr.message });
  }

  const expiresAt = new Date(Date.now() + expires_hours * 60 * 60 * 1000).toISOString();

  // Generate a routing handle from the demo handle (uppercase, max 8 chars)
  // This is what the couple agent uses to route enquiries: TDW-ROHAN
  const baseHandle = demo_handle.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  const { data: existingHandle } = await supabase
    .from('vendors')
    .select('id')
    .eq('routing_handle', baseHandle)
    .maybeSingle();
  const routingHandle = existingHandle
    ? `${baseHandle.slice(0, 5)}${Math.floor(Math.random() * 900) + 100}`
    : baseHandle;

  const { data: vendor, error: vendorErr } = await supabase
    .from('vendors')
    .insert({
      user_id: user.id,
      category,
      city,
      status: 'active',
      tier: 'signature',
      routing_handle: routingHandle,
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

  // Mint a real Supabase JWT for this ghost vendor — 48hr session
  // This lets the full DreamAi app load without any login wall
  let demoSessionToken = null;
  try {
    const tokens = await mintSession(supabase, user.id);
    demoSessionToken = tokens.access_token;
    // Store token on vendor row for activation endpoint to retrieve
    await supabase
      .from('vendors')
      .update({
        demo_session_token:      tokens.access_token,
        demo_session_expires_at: expiresAt
      })
      .eq('id', vendor.id);
  } catch (mintErr) {
    console.error('[demo] mintSession failed:', mintErr.message);
    // Non-fatal — demo still works, just without real session
  }

  const studioLink = `https://demo.thedreamwedding.in/${demo_handle.toLowerCase()}`;
  const brideLink  = `https://demo.thedreamwedding.in/bride`;
  const dmMessage  = generateDMMessage(name, studioLink, brideLink);

  return res.json({
    ok: true,
    vendor_id: vendor.id,
    demo_handle: demo_handle.toLowerCase(),
    routing_handle: routingHandle,
    enquire_link: `https://go.thedreamwedding.in/${routingHandle}`,
    studio_link: studioLink,
    bride_link: brideLink,
    expires_at: expiresAt,
    dm_message: dmMessage,
    has_real_phone: !!vendor_phone
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

// ── DELETE /api/v2/admin/demo/:vendor_id/delete — Hard delete demo profile ───
router.delete('/:vendor_id/delete', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { vendor_id } = req.params;

  // Get the user_id first so we can clean up the ghost user too
  const { data: vendor } = await supabase
    .from('vendors')
    .select('user_id')
    .eq('id', vendor_id)
    .not('demo_handle', 'is', null)
    .maybeSingle();

  // Delete vendor (cascades to portfolio, demo_profile_views)
  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('id', vendor_id)
    .not('demo_handle', 'is', null);

  if (error) return res.status(500).json({ ok: false, error: error.message });

  // Clean up the ghost user row
  if (vendor?.user_id) {
    await supabase.from('users').delete().eq('id', vendor.user_id);
  }

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
