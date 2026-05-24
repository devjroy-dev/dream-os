// src/api/public/demo.js
// Public demo endpoints — no auth required
// GET /api/v2/demo/session/:handle  — returns vendor session for demo handoff
// GET /api/v2/demo/discover         — returns active demo vendor feed for bride demo
'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');


// ── mintSession — inline to avoid circular deps ──────────────────────────────
// Mints a fresh Supabase JWT for a ghost vendor user.
// Called on every /session/:handle request so token is never stale.
async function mintFreshSession(supabase, userId, internalEmail) {
  // Step 1 — ensure auth.users row exists
  const { error: createErr } = await supabase.auth.admin.createUser({
    id: userId, email: internalEmail, email_confirm: true,
  });
  if (createErr) {
    const msg = createErr.message || '';
    if (!msg.includes('already registered') && createErr.status !== 422) {
      throw new Error(`auth.users create failed: ${msg}`);
    }
  }

  // Step 2 — pin email
  await supabase.auth.admin.updateUserById(userId, {
    email: internalEmail, email_confirm: true,
  });

  // Step 3 — generate magic link
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink', email: internalEmail,
  });
  if (linkErr) throw new Error(`generateLink failed: ${linkErr.message}`);

  // Step 4 — exchange for fresh JWT
  const { data: sessionData, error: sessionErr } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token, type: 'email',
  });
  if (sessionErr) throw new Error(`verifyOtp failed: ${sessionErr.message}`);

  return {
    access_token:  sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  };
}

// ── GET /session/:handle ──────────────────────────────────────────────────────
// Returns a real vendor session object for the demo handle.
// The vendor demo landing page calls this, then encodes the session into
// the redirect URL to thedreamai.in so the full app loads natively.
router.get('/session/:handle', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const handle   = req.params.handle.toLowerCase();

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
      tier,
      routing_handle,
      users!inner(id, name),
      vendor_portfolio(
        id,
        image_url,
        is_hero,
        approval_state,
        caption
      )
    `)
    .ilike('demo_handle', handle)
    .eq('demo_active', true)
    .gt('demo_expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !vendor) {
    return res.status(404).json({ ok: false, error: 'Demo profile not found or expired' });
  }

  // Mint a FRESH JWT on every request — stored token expires after 1hr
  // This ensures the token is always valid regardless of when the link is opened
  let freshTokens = null;
  try {
    const internalEmail = `vendor-${vendor.users?.id}@internal.dreamai.app`;
    freshTokens = await mintFreshSession(supabase, vendor.users?.id, internalEmail);
  } catch (mintErr) {
    console.error('[demo:session] mintFreshSession failed:', mintErr.message);
    // Fall back to stored token if mint fails
    if (!vendor.demo_session_token) {
      return res.status(500).json({ ok: false, error: 'Could not create demo session.' });
    }
  }

  const accessToken  = freshTokens?.access_token  || vendor.demo_session_token;
  const refreshToken = freshTokens?.refresh_token || vendor.demo_session_token;

  // Only approved photos, hero first
  const photos = (vendor.vendor_portfolio || [])
    .filter(p => p.approval_state === 'approved')
    .sort((a, b) => (b.is_hero ? 1 : 0) - (a.is_hero ? 1 : 0));

  const vendorName = vendor.users?.name || vendor.demo_handle;

  return res.json({
    ok: true,
    session: {
      id:             vendor.id,
      user_id:        vendor.users?.id,
      name:           vendorName,
      phone:          null,
      tier:           vendor.tier || 'signature',
      routing_handle: vendor.routing_handle || null,
      access_token:   accessToken,
      refresh_token:  refreshToken,
    },
    // Vendor profile data for landing page display
    vendor: {
      id:        vendor.id,
      name:      vendorName,
      handle:    vendor.demo_handle,
      instagram: vendor.demo_instagram,
      category:  vendor.category,
      city:      vendor.city,
      expires_at: vendor.demo_expires_at,
      photos
    }
  });
}));

// ── GET /discover ─────────────────────────────────────────────────────────────
// Returns all active demo vendors as a DiscoverVendor array.
// Used exclusively by demo.thedreamwedding.in/bride — isolated from real feed.
router.get('/discover', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const now      = new Date().toISOString();

  // Fetch all active demo vendors
  const { data: vendors, error } = await supabase
    .from('vendors')
    .select(`
      id,
      demo_handle,
      demo_instagram,
      category,
      city,
      tier,
      users!inner(name),
      vendor_portfolio(image_url, is_hero, approval_state)
    `)
    .eq('demo_active', true)
    .gt('demo_expires_at', now)
    .not('demo_handle', 'is', null);

  if (error) {
    console.error('[demo:discover] error:', error.message);
    return res.status(500).json({ ok: false, error: 'Feed unavailable' });
  }

  // Shape into DiscoverVendor format — matches real feed shape exactly
  const shaped = (vendors || []).map(v => {
    const photos = (v.vendor_portfolio || [])
      .filter(p => p.approval_state === 'approved')
      .sort((a, b) => (b.is_hero ? 1 : 0) - (a.is_hero ? 1 : 0))
      .map(p => p.image_url);

    return {
      id:             v.id,
      name:           v.users?.name || v.demo_handle,
      category:       v.category   || null,
      city:           v.city       || null,
      routing_handle: v.demo_handle,   // use demo_handle as routing_handle for UI display
      starting_price: null,
      photos,
      vibe_tags:      [],
      about:          null,
      enquire_link:   null,            // no real enquiry in demo
    };
  }).filter(v => v.photos.length > 0); // only vendors with photos

  return res.json({
    ok:       true,
    vendors:  shaped,
    page:     0,
    has_more: false,
    total:    shaped.length
  });
}));

module.exports = router;
