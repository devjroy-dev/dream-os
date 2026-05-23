// src/api/vendor/collab.js
// Collab endpoints — vendor-to-vendor requirement board
// Mounted at /api/v2/vendor/collab via core.js
//
// Routes:
//   GET    /feed                          — posts this vendor is eligible for
//   GET    /my-posts                      — this vendor's own posted requirements
//   GET    /:post_id/responses            — responses to a post (poster only)
//   POST   /                              — create a new requirement post
//   POST   /:post_id/respond              — express interest or pass
//   POST   /:post_id/connect/:response_id — poster accepts a responder
//   PATCH  /:post_id                      — mark post as filled or cancelled

'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { sendWhatsApp } = require('../../lib/whatsapp');

// ── GET /feed ────────────────────────────────────────────────────────────────
// Returns collab posts this vendor is eligible to see.
// Eligibility: requirement_type matches vendor.category AND
//   (post.city matches vendor.city OR vendor.open_to_travel OR post.open_to_other_cities)
//   AND vendor is not the poster
//   AND post.state = 'open' AND not yet expired
//   AND vendor has not already responded (interested OR passed)

router.get('/feed', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const vendorId  = req.vendor.id;

  // Fetch this vendor's profile for matching
  const { data: me, error: meErr } = await supabase
    .from('vendors')
    .select('category, city, open_to_travel')
    .eq('id', vendorId)
    .single();

  if (meErr || !me) return errRes(res, 404, 'Vendor not found');

  const now = new Date().toISOString();

  // Fetch open, non-expired posts matching this vendor's category
  const { data: posts, error: postsErr } = await supabase
    .from('collab_posts')
    .select(`
      id,
      requirement_type,
      event_date,
      city,
      open_to_other_cities,
      budget_inr,
      payment_period,
      event_type,
      details,
      state,
      created_at,
      vendors!collab_posts_vendor_id_fkey ( category, city )
    `)
    .eq('state', 'open')
    .gt('expires_at', now)
    .neq('vendor_id', vendorId)
    .eq('requirement_type', me.category)
    .order('created_at', { ascending: false });

  if (postsErr) return errRes(res, 500, postsErr.message);

  // Filter by city match OR open_to_travel OR open_to_other_cities
  const eligible = (posts || []).filter(p =>
    p.city === me.city ||
    me.open_to_travel ||
    p.open_to_other_cities
  );

  // Filter out posts this vendor already responded to
  const postIds = eligible.map(p => p.id);
  let respondedIds = new Set();

  if (postIds.length > 0) {
    const { data: responses } = await supabase
      .from('collab_responses')
      .select('post_id')
      .eq('responder_vendor_id', vendorId)
      .in('post_id', postIds);

    respondedIds = new Set((responses || []).map(r => r.post_id));
  }

  const feed = eligible
    .filter(p => !respondedIds.has(p.id))
    .map(p => ({
      id:               p.id,
      requirement_type: p.requirement_type,
      event_date:       p.event_date,
      city:             p.city,
      budget_inr:       p.budget_inr,
      payment_period:   p.payment_period,
      event_type:       p.event_type,
      details:          p.details,
      // Anonymised poster — category only, no name or handle
      poster_category:  p.vendors?.category || 'vendor',
      posted_ago:       p.created_at,
    }));

  return okRes(res, { feed, count: feed.length });
}));


// ── GET /my-posts ────────────────────────────────────────────────────────────
// Returns this vendor's own posted requirements with response counts.

router.get('/my-posts', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendorId = req.vendor.id;

  const { data: posts, error } = await supabase
    .from('collab_posts')
    .select('id, requirement_type, event_date, city, budget_inr, payment_period, event_type, details, state, expires_at, created_at')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) return errRes(res, 500, error.message);

  // Enrich with response counts
  const enriched = await Promise.all((posts || []).map(async (p) => {
    const { data: responses } = await supabase
      .from('collab_responses')
      .select('id, state')
      .eq('post_id', p.id)
      .in('state', ['interested', 'accepted']);

    const interested_count = (responses || []).filter(r => r.state === 'interested').length;
    const accepted_count   = (responses || []).filter(r => r.state === 'accepted').length;

    return { ...p, interested_count, accepted_count, total_responses: interested_count + accepted_count };
  }));

  return okRes(res, { posts: enriched });
}));


// ── GET /:post_id/responses ──────────────────────────────────────────────────
// Returns interested vendors for a post the requester owns.
// Identity revealed because poster owns the post.

router.get('/:post_id/responses', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const vendorId  = req.vendor.id;
  const { post_id } = req.params;

  // Verify ownership
  const { data: post } = await supabase
    .from('collab_posts')
    .select('id, vendor_id')
    .eq('id', post_id)
    .single();

  if (!post || post.vendor_id !== vendorId) return errRes(res, 403, 'Not your post');

  const { data: responses, error } = await supabase
    .from('collab_responses')
    .select(`
      id,
      state,
      created_at,
      contact_shared_at,
      vendors!collab_responses_responder_vendor_id_fkey (
        id,
        category,
        city,
        open_to_travel,
        users!vendors_user_id_fkey ( name ),
        vendor_portfolio ( image_url, is_hero, approval_state )
      )
    `)
    .eq('post_id', post_id)
    .in('state', ['interested', 'accepted'])
    .order('created_at', { ascending: false });

  if (error) return errRes(res, 500, error.message);

  const enriched = (responses || []).map(r => ({
    response_id:       r.id,
    state:             r.state,
    responded_at:      r.created_at,
    contact_shared_at: r.contact_shared_at,
    vendor: {
      id:            r.vendors?.id,
      name:          r.vendors?.users?.name,
      category:      r.vendors?.category,
      city:          r.vendors?.city,
      open_to_travel: r.vendors?.open_to_travel,
      hero_photo:    (r.vendors?.vendor_portfolio || [])
        .filter(p => p.approval_state === 'approved' && p.is_hero)[0]?.image_url || null,
    },
  }));

  return okRes(res, { responses: enriched });
}));


// ── POST / ───────────────────────────────────────────────────────────────────
// Create a new collab requirement post.
// Signature and Prestige only (Essential can view + respond but not post).

router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendorId = req.vendor.id;

  // Fetch tier + city for validation
  const { data: me } = await supabase
    .from('vendors')
    .select('tier, city')
    .eq('id', vendorId)
    .single();

  if (!me) return errRes(res, 404, 'Vendor not found');

  const allowedTiers = ['signature', 'prestige', 'trial'];
  if (!allowedTiers.includes(me.tier)) {
    return res.status(403).json({
      ok: false,
      error: 'upgrade_required',
      message: 'Upgrade to Signature to post collab requirements.',
    });
  }

  const {
    requirement_type,
    event_date,
    city,
    open_to_other_cities = false,
    budget_inr,
    payment_period,
    event_type,
    details,
  } = req.body;

  if (!requirement_type || !event_date || !city) {
    return errRes(res, 400, 'requirement_type, event_date, city required');
  }

  if (details && details.length > 200) {
    return errRes(res, 400, 'Details must be 200 characters or less');
  }

  if (new Date(event_date) < new Date()) {
    return errRes(res, 400, 'Event date must be in the future');
  }

  const { data: post, error } = await supabase
    .from('collab_posts')
    .insert({
      vendor_id:            vendorId,
      requirement_type,
      event_date,
      city:                 city || me.city,
      open_to_other_cities,
      budget_inr:           budget_inr   || null,
      payment_period:       payment_period || null,
      event_type:           event_type   || null,
      details:              details      || null,
      state:                'open',
    })
    .select('id, requirement_type, event_date, city, state, created_at')
    .single();

  if (error) return errRes(res, 500, error.message);

  return okRes(res, {
    post,
    message: `Posted. We'll notify matching vendors in ${city}.`,
  });
}));


// ── POST /:post_id/respond ───────────────────────────────────────────────────
// Express interest in or pass on a collab post.
// All tiers can respond.

router.post('/:post_id/respond', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase   = req.app.locals.supabase;
  const vendorId   = req.vendor.id;
  const { post_id } = req.params;
  const { action }  = req.body; // 'interested' or 'passed'

  if (!['interested', 'passed'].includes(action)) {
    return errRes(res, 400, 'action must be interested or passed');
  }

  // Verify post exists and is open
  const { data: post } = await supabase
    .from('collab_posts')
    .select('id, vendor_id, requirement_type, event_date, city, state')
    .eq('id', post_id)
    .single();

  if (!post)                     return errRes(res, 404, 'Post not found');
  if (post.state !== 'open')     return errRes(res, 409, 'Post is no longer open');
  if (post.vendor_id === vendorId) return errRes(res, 403, 'Cannot respond to your own post');

  // Upsert response
  const { error } = await supabase
    .from('collab_responses')
    .upsert({
      post_id,
      responder_vendor_id: vendorId,
      state:               action === 'interested' ? 'interested' : 'passed',
      updated_at:          new Date().toISOString(),
    }, { onConflict: 'post_id,responder_vendor_id' });

  if (error) return errRes(res, 500, error.message);

  // Notify poster via WhatsApp when interested — non-fatal if it fails
  if (action === 'interested') {
    try {
      const [responderRes, posterRes] = await Promise.all([
        supabase.from('vendors').select('category, city').eq('id', vendorId).single(),
        supabase.from('vendors').select('users!vendors_user_id_fkey ( phone )').eq('id', post.vendor_id).single(),
      ]);

      const responderCategory = responderRes.data?.category || 'vendor';
      const posterPhone       = posterRes.data?.users?.phone;

      if (posterPhone) {
        const dateStr = new Date(post.event_date).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
        });

        await sendWhatsApp(
          posterPhone,
          `A ${responderCategory} on The Dream Wedding is interested in your ${post.requirement_type} collab for ${dateStr}.\n\nOpen DreamAi to view their profile and connect.`
        );

        await supabase
          .from('collab_responses')
          .update({ poster_notified_at: new Date().toISOString() })
          .eq('post_id', post_id)
          .eq('responder_vendor_id', vendorId);
      }
    } catch (notifyErr) {
      console.error('[collab] poster notification failed:', notifyErr.message);
    }
  }

  return okRes(res, { action });
}));


// ── POST /:post_id/connect/:response_id ─────────────────────────────────────
// Poster accepts a responder — shares contact details with both parties.

router.post('/:post_id/connect/:response_id', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase     = req.app.locals.supabase;
  const vendorId     = req.vendor.id;
  const { post_id, response_id } = req.params;

  // Verify poster owns this post
  const { data: post } = await supabase
    .from('collab_posts')
    .select('id, vendor_id, requirement_type, event_date')
    .eq('id', post_id)
    .single();

  if (!post || post.vendor_id !== vendorId) return errRes(res, 403, 'Not your post');

  // Get the response + responder details
  const { data: response } = await supabase
    .from('collab_responses')
    .select(`
      id,
      state,
      responder_vendor_id,
      vendors!collab_responses_responder_vendor_id_fkey (
        category,
        city,
        users!vendors_user_id_fkey ( phone, name )
      )
    `)
    .eq('id', response_id)
    .eq('post_id', post_id)
    .single();

  if (!response)                       return errRes(res, 404, 'Response not found');
  if (response.state !== 'interested') return errRes(res, 409, 'Response is not in interested state');

  // Mark as accepted
  const now = new Date().toISOString();
  await supabase
    .from('collab_responses')
    .update({ state: 'accepted', contact_shared_at: now })
    .eq('id', response_id);

  // Get poster's contact details
  const { data: poster } = await supabase
    .from('vendors')
    .select('category, city, users!vendors_user_id_fkey ( phone, name )')
    .eq('id', vendorId)
    .single();

  const dateStr       = new Date(post.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const responderPhone = response.vendors?.users?.phone;
  const responderName  = response.vendors?.users?.name;
  const posterPhone    = poster?.users?.phone;
  const posterName     = poster?.users?.name;

  // Notify both parties — non-fatal if it fails
  try {
    if (responderPhone && posterPhone) {
      await sendWhatsApp(
        responderPhone,
        `Great news — your collab interest was accepted!\n\n${posterName || 'A vendor'} (${poster?.category}, ${poster?.city}) wants to connect with you for ${post.requirement_type} on ${dateStr}.\n\nTheir WhatsApp: wa.me/${posterPhone.replace('+', '')}\n\nGood luck with the collab!`
      );
      await sendWhatsApp(
        posterPhone,
        `You've connected with ${responderName || 'a vendor'} (${response.vendors?.category}, ${response.vendors?.city}) for your ${post.requirement_type} collab on ${dateStr}.\n\nTheir WhatsApp: wa.me/${responderPhone.replace('+', '')}`
      );
    }
  } catch (notifyErr) {
    console.error('[collab] connect notification failed:', notifyErr.message);
  }

  return okRes(res, {
    connected: true,
    responder: {
      name:     responderName,
      category: response.vendors?.category,
      city:     response.vendors?.city,
      phone:    responderPhone,
    },
  });
}));


// ── PATCH /:post_id ──────────────────────────────────────────────────────────
// Update post state — poster marks as filled or cancelled.

router.patch('/:post_id', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase   = req.app.locals.supabase;
  const vendorId   = req.vendor.id;
  const { post_id } = req.params;
  const { state }   = req.body;

  if (!['filled', 'cancelled'].includes(state)) {
    return errRes(res, 400, 'state must be filled or cancelled');
  }

  const { error } = await supabase
    .from('collab_posts')
    .update({ state })
    .eq('id', post_id)
    .eq('vendor_id', vendorId); // only poster can update their own post

  if (error) return errRes(res, 500, error.message);

  return okRes(res, { state });
}));


module.exports = router;
