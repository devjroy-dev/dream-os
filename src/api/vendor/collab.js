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

// TDW_04.5 · P4 — the item + roster layer. WIRING ONLY: every seam below is a
// call into these two libs, which shipped and benched at the seam (b0452 52/52).
// No discovery, dedup, wrap or auto-close logic is authored in this file.
const {
  itemsForPost,
  groupItemsByPost,
  postMatchesCategory,
  allItemsFilled,
  normaliseItemsInput,
} = require('../../lib/vendor/collabItems');
const { addEdgesOnAccept } = require('../../lib/vendor/roster');

// ── THE DORMANCY SEAM (CE-59, ruling (ii)A/(ii)B) ────────────────────────────
// 0096_collab_planner.sql is WITHHELD and founder-run. This code deploys BEFORE
// its tables and columns exist at prod, and /feed is a LIVE surface. Every read
// that touches a 0096 object therefore goes through `tolerate`, which converts
// "relation does not exist" / "column does not exist" into an ABSENCE rather
// than a 500.
//
// Absence is not a special case here — it is the legacy case. `itemsForPost`
// turns zero item rows into the post's own requirement_type (F3's wrap), so a
// tolerated miss makes this file behave EXACTLY as it did before this sitting.
// The wrap is the gate; there is no feature flag and none is owed.
//
// This is deliberately NOT a general error swallow: it returns the fallback and
// logs once, so a genuine post-0096 outage is visible in the log rather than
// silently serving a degraded feed forever.
async function tolerate(label, fallback, fn) {
  try {
    const { data, error } = await fn();
    if (error) {
      console.warn(`[collab:pre-0096] ${label} unavailable: ${error.message}`);
      return fallback;
    }
    return data ?? fallback;
  } catch (err) {
    console.warn(`[collab:pre-0096] ${label} threw: ${err.message}`);
    return fallback;
  }
}

/** Read the item rows for a set of posts, grouped by post_id. Empty pre-0096. */
async function itemsByPost(supabase, postIds) {
  if (!postIds || postIds.length === 0) return new Map();
  const rows = await tolerate('collab_post_items', [], () =>
    supabase
      .from('collab_post_items')
      .select('id, post_id, position, requirement_type, note, filled_by_response_id')
      .in('post_id', postIds)
  );
  return groupItemsByPost(rows);
}

/**
 * THE FIRST-LOOK READ — ONE HOME (F-04.111).
 *
 * `first_look_until` is never named in a primary select. PostgREST fails the
 * WHOLE query on an unknown column, so before 0096 that would have 500'd the
 * feed and, on the create path, lost the post entirely. It rides here instead,
 * tolerated, and absence means "no window exists" — the open feed, which is
 * exactly how posts behaved before this sitting.
 *
 * TWO readers now: the feed's visibility gate, and my-posts, which needs the
 * value itself so the poster can be TOLD their post is roster-only. The second
 * reader is why this is a function rather than four lines inside the filter —
 * the first cut had the read welded into the gate, my-posts never got the
 * column, and the two state lines built for it could not render. Founder-caught
 * on a screenshot showing two windowed posts saying nothing about it.
 */
async function firstLookMeta(supabase, postIds) {
  if (!postIds || postIds.length === 0) return new Map();
  const rows = await tolerate('collab_posts.first_look_until', [], () =>
    supabase
      .from('collab_posts')
      .select('id, vendor_id, first_look_until')
      .in('id', postIds)
  );
  return new Map(rows.map(r => [r.id, r]));
}

/**
 * FIRST LOOK (CE-59 fork 5: the POSTER'S roster contains the VIEWER).
 * Returns a predicate `(post) => boolean` — true when this viewer may see it.
 *
 * Absent pre-0096, and absence means the open feed — today's behaviour exactly.
 */
async function firstLookFilter(supabase, postIds, viewerVendorId) {
  if (!postIds || postIds.length === 0) return () => true;

  const meta = await firstLookMeta(supabase, postIds);
  if (meta.size === 0) return () => true;

  const now = Date.now();
  // Only posts still inside their window gate anything.
  const gated = [...meta.values()].filter(m => m.first_look_until && new Date(m.first_look_until).getTime() > now);
  if (gated.length === 0) return () => true;

  const posterIds = [...new Set(gated.map(m => m.vendor_id).filter(Boolean))];
  const edges = await tolerate('vendor_roster (first-look)', [], () =>
    supabase
      .from('vendor_roster')
      .select('owner_vendor_id, member_vendor_id')
      .in('owner_vendor_id', posterIds)
      .eq('member_vendor_id', viewerVendorId)
  );
  const invitedBy = new Set(edges.map(e => e.owner_vendor_id));

  const gatedById = new Map(gated.map(m => [m.id, m]));
  return (post) => {
    const m = gatedById.get(post.id);
    if (!m) return true;                 // window absent or already elapsed
    return invitedBy.has(m.vendor_id);   // inside the window: roster only
  };
}

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
    .order('created_at', { ascending: false });

  if (postsErr) return errRes(res, 500, postsErr.message);

  // ── THE CATEGORY LEG (CE-59 ruling on fork 1, option 1(a); F6 AMENDED) ─────
  // `.eq('requirement_type', me.category)` is GONE from the query above. It
  // filtered the POST column, which would have made items 2..8 invisible to
  // their own categories — the census catch that produced F4-amended.
  //
  // It does NOT become an in-query embed. F6 asked for predicates in-query, but
  // an inner-join embed on collab_post_items excludes every post with no item
  // rows, which kills F3's fall-through and hides every legacy post from the
  // feed. Reported under §0.2 rather than adapted; the chair amended F6 for
  // this leg specifically.
  //
  // So the category match runs here, over the bounded open-post window, through
  // the one home. With zero item rows `postMatchesCategory` reads the post's own
  // column — byte-identical to the `.eq` it replaces. That identity is also what
  // closes the pre-0096 leak: a missing items table cannot widen the feed,
  // because absence degrades to the old predicate rather than to "no predicate".
  const openWindow = posts || [];
  const itemsMap   = await itemsByPost(supabase, openWindow.map(p => p.id));

  const matched = openWindow.filter(p =>
    postMatchesCategory(p, itemsMap.get(p.id) || [], me.category)
  );

  // Filter by city match OR open_to_travel OR open_to_other_cities
  const cityEligible = matched.filter(p =>
    p.city === me.city ||
    me.open_to_travel ||
    p.open_to_other_cities
  );

  // First look — before first_look_until, only the poster's roster sees it.
  const visible = await firstLookFilter(supabase, cityEligible.map(p => p.id), vendorId);
  const eligible = cityEligible.filter(visible);

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
      // Items ALWAYS serialize (spec §P4.1). A legacy post wraps to exactly one
      // item carrying its own requirement_type, so this array is never empty and
      // the client needs no legacy branch. `requirement_type` above stays for
      // back-compat with clients that have not yet learned about items.
      items:            itemsForPost(p, itemsMap.get(p.id) || []),
      event_date:       p.event_date,
      city:             p.city,
      budget_inr:       p.budget_inr,
      payment_period:   p.payment_period,
      event_type:       p.event_type,
      details:          p.details,
      // Anonymised poster — category only, no name or handle. ANONYMITY IS
      // BYTE-PRESERVED: it lives here, in what the serializer chooses to emit.
      // First look is a VISIBILITY predicate upstream — it changes WHO reaches
      // this map, never WHAT the map reveals. The two compose; neither weakens
      // the other, and the bench asserts both halves.
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

  // Items for the whole page in ONE tolerated read, not one per post.
  const myPostIds = (posts || []).map(p => p.id);
  const myItems   = await itemsByPost(supabase, myPostIds);
  // F-04.111: and the first-look value, so the poster can be TOLD their post is
  // roster-only rather than left to infer it from an empty response count.
  const myWindows = await firstLookMeta(supabase, myPostIds);

  // Enrich with response counts
  const enriched = await Promise.all((posts || []).map(async (p) => {
    const { data: responses } = await supabase
      .from('collab_responses')
      .select('id, state')
      .eq('post_id', p.id)
      .in('state', ['interested', 'accepted']);

    const interested_count = (responses || []).filter(r => r.state === 'interested').length;
    const accepted_count   = (responses || []).filter(r => r.state === 'accepted').length;

    // The poster sees their own items — including which are already filled, so
    // the client can render "All filled. This post is closed." from state alone.
    const items = itemsForPost(p, myItems.get(p.id) || []);

    // Undefined pre-0096 (tolerated miss) — the client's `inFirstLook` reads
    // that as "no window", which is the truthful answer when the column is not
    // there. Explicitly null when the post predates the column.
    const first_look_until = myWindows.get(p.id)?.first_look_until ?? null;

    return { ...p, items, first_look_until, interested_count, accepted_count, total_responses: interested_count + accepted_count };
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
    event_date,
    city,
    open_to_other_cities = false,
    budget_inr,
    payment_period,
    event_type,
    details,
  } = req.body;

  // ── ITEMS (spec §P4.1) ────────────────────────────────────────────────────
  // One home validates and orders them. A body with no `items` key takes the
  // legacy single-`requirement_type` path and comes back as a one-entry list —
  // so everything below has exactly one shape to reason about.
  const parsed = normaliseItemsInput(req.body);
  if (!parsed.ok) return errRes(res, 400, parsed.error);
  const items = parsed.items;
  const multi = Array.isArray(req.body?.items);

  if (!event_date || !city) {
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
      // STORAGE (F4): the post column mirrors items[0]. NOT NULL is satisfied,
      // legacy semantics are preserved, and `position` (assigned in
      // normaliseItemsInput and only there) is what makes items[0] deterministic.
      requirement_type:     items[0].requirement_type,
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

  // Item rows are written whenever the caller supplies `items`. Post-0096 that
  // is every post; pre-0096 the insert fails and what happens next depends on
  // WHETHER ANYTHING CAN BE LOST.
  if (multi) {
    const { error: itemErr } = await supabase
      .from('collab_post_items')
      .insert(items.map(i => ({
        post_id:          post.id,
        position:         i.position,
        requirement_type: i.requirement_type,
        note:             i.note,
      })));

    // ── F-04.110 (live regression, founder-caught at the dormancy walk) ─────
    // The first cut rolled back on ANY item-insert failure. But the PWA's
    // composer always sends `items` — even for one requirement — so every post
    // from the live surface took the rollback branch and the vendor could not
    // post at all until 0096 ran. My bench drove the pre-P4 payload shape,
    // which no live caller produces any more: a green over an unreachable path.
    //
    // The rule the first cut should have stated: REFUSE LOUDLY ONLY WHERE
    // REFUSING PREVENTS ACTUAL LOSS.
    //   · 2+ items — items 2..n exist nowhere else. Losing them is silent data
    //     loss, so roll the post back and say so.
    //   · 1 item — collab_posts.requirement_type ALREADY carries it (it is
    //     items[0] by F4's storage rule). Nothing can be lost. The post stands
    //     and the wrap serves it, byte-identically to every legacy post.
    if (itemErr) {
      if (items.length > 1) {
        await supabase.from('collab_posts').delete().eq('id', post.id).eq('vendor_id', vendorId);
        console.error('[collab] multi-item create rolled back:', itemErr.message);
        return errRes(res, 503, 'Multi-item posts are not available yet. Post one requirement at a time.');
      }
      console.warn('[collab:pre-0096] single item not persisted; the post column carries it:', itemErr.message);
    }
  }

  // FIRST LOOK — set as its own tolerated UPDATE, never as a column in the
  // insert above. Same reason as the feed's second query: naming an unknown
  // column would fail the whole statement, and here that would mean no post at
  // all. Pre-0096 this is a no-op and the post simply has no window: open feed,
  // exactly as posts behave today.
  const hours = await tolerate('admin_config collab.first_look_hours', null, () =>
    supabase.from('admin_config').select('value').eq('key', 'collab.first_look_hours').maybeSingle()
  );
  const windowHours = Number(hours?.value ?? 12);
  if (Number.isFinite(windowHours) && windowHours > 0) {
    // ── F-04.112 — A WINDOW WITH NO POSSIBLE AUDIENCE PROTECTS NOBODY ───────
    // Founder-witnessed live at the P4 smoke: a post from a vendor with an
    // empty roster is not "roster-first", it is INVISIBLE TO EVERYONE for the
    // full window. The 9:34 post reached nobody, and the walk only continued
    // because first_look_hours was set to 0.
    //
    // That penalty lands hardest on NEW vendors — no roster yet, most dependent
    // on the open board, and their first-ever post silently reaches no one.
    // They would reasonably conclude the feature is broken. They would be right.
    //
    // THE PREDICATE IS `member_vendor_id IS NOT NULL`, not "roster is empty",
    // and the sharper form is derived from the shipped gate rather than guessed:
    // firstLookFilter matches roster edges on `member_vendor_id` (:112), so a
    // MANUAL phone-only entry cannot see an in-window post no matter what. A
    // roster of nothing but manual rows is an empty audience wearing a full
    // list, and it would have reproduced the same silent-invisibility bug.
    //
    // NAMED, NOT CURED: linked members who exist but whose categories match no
    // item on this post are still an audience of zero for this post
    // specifically. Narrow, honest, and a one-predicate upgrade if the founder
    // ever wants it — recorded rather than quietly built.
    const audience = await tolerate('vendor_roster (linked audience)', [], () =>
      supabase
        .from('vendor_roster')
        .select('id')
        .eq('owner_vendor_id', vendorId)
        .not('member_vendor_id', 'is', null)
        .limit(1)
    );

    if (audience.length > 0) {
      await tolerate('collab_posts.first_look_until (set)', null, () =>
        supabase
          .from('collab_posts')
          .update({ first_look_until: new Date(Date.now() + windowHours * 3600000).toISOString() })
          .eq('id', post.id)
          .select('id')
          .maybeSingle()
      );
    }
  }

  return okRes(res, {
    post,
    items,
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
  const { action, item_id }  = req.body; // 'interested' or 'passed'

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

  // ── item_id ON RESPOND — DECLARED GAP, NOT AN ASSUMPTION ──────────────────
  // Spec §P4.1 says "respond gains item_id". Which column carries it lives in
  // 0096, which is WITHHELD and which I have neither read nor authored; under
  // the SQL-provenance law a column with no witness is an assumption, so this
  // write is TOLERATED rather than asserted. If 0096 names the column, the
  // responder's choice persists and connect prefers it. If it does not, this is
  // a no-op and connect still works — the poster chooses the item at connect
  // time, which is the path the auto-close actually depends on. Either way the
  // feature stands up; only the convenience varies. Named in the handover.
  if (action === 'interested' && item_id) {
    await tolerate('collab_responses.item_id', null, () =>
      supabase
        .from('collab_responses')
        .update({ item_id })
        .eq('post_id', post_id)
        .eq('responder_vendor_id', vendorId)
        .select('id')
        .maybeSingle()
    );
  }

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
          // VETO LEDGER (founder YES, CE-59): "Open DreamAi…" → the line below.
          // Product copy, changed only because the founder ruled the exact bytes.
          `A ${responderCategory} on The Dream Wedding is interested in your ${post.requirement_type} collab for ${dateStr}.\n\nOpen The Dream Wedding to view their profile and connect.`
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
    .select('id, vendor_id, requirement_type, event_date, state')
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

  // ── THE ROSTER EDGE (spec §P4.2) ──────────────────────────────────────────
  // Born HERE, in the same breath that sets contact_shared_at above and hands
  // out phone numbers below. That siting is the anonymity proof: an edge cannot
  // exist before anonymity lifts, because this is the line where it lifts.
  // Never fatal — the connection is the product, the edge the convenience.
  const edges = await addEdgesOnAccept(supabase, {
    poster: {
      vendor_id: vendorId,
      name:      poster?.users?.name,
      phone:     poster?.users?.phone,
      category:  poster?.category,
    },
    responder: {
      vendor_id: response.responder_vendor_id,
      name:      response.vendors?.users?.name,
      phone:     response.vendors?.users?.phone,
      category:  response.vendors?.category,
    },
  });
  if (edges.error) console.error('[collab] roster edge failed:', edges.error);

  // ── FILL THE ITEM, THEN AUTO-CLOSE (spec §P4.1) ───────────────────────────
  // Which item this connection fills: the poster may name it, else the
  // responder's declared choice, else items[0] — which is deterministic because
  // `position` is assigned in one place.
  const currentItems = itemsForPost(post, (await itemsByPost(supabase, [post.id])).get(post.id) || []);

  // The responder's declared choice is read HERE, tolerated, for the same
  // reason it was written tolerated: the response select above cannot safely
  // name a column whose existence lives in the withheld 0096.
  const declared = await tolerate('collab_responses.item_id (read)', null, () =>
    supabase.from('collab_responses').select('item_id').eq('id', response_id).maybeSingle()
  );

  const targetId = req.body?.item_id
    || declared?.item_id
    || currentItems.find(i => !i.filled_by_response_id && i.id)?.id
    || null;

  let autoClosed = false;
  if (targetId) {
    await tolerate('collab_post_items.filled_by_response_id', null, () =>
      supabase
        .from('collab_post_items')
        .update({ filled_by_response_id: response_id })
        .eq('id', targetId)
        .eq('post_id', post.id)
        .select('id')
        .maybeSingle()
    );
  }

  // Re-read after the fill — never predict the state, assert it.
  const afterItems = (await itemsByPost(supabase, [post.id])).get(post.id) || [];
  if (afterItems.length > 0 && allItemsFilled(post, afterItems)) {
    // THE EXISTING TERMINAL STATE. 0048's CHECK list carries no 'accepted' post
    // state — the spec's "current open/accepted semantics" is drift, filed at
    // the seam and confirmed by command here. Nothing is widened; this is the
    // same flip the poster's own "Mark Filled" performs.
    const { error: closeErr } = await supabase
      .from('collab_posts')
      .update({ state: 'filled' })
      .eq('id', post.id)
      .eq('vendor_id', vendorId);
    if (closeErr) console.error('[collab] auto-close failed:', closeErr.message);
    else autoClosed = true;
  }

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
    // ── P5 · A3's ENABLING CHANGE (CE-ruled) ────────────────────────────────
    // The Settle stub offers itself HERE, and `team_payments.team_member_id` is
    // NOT NULL — so a payout needs the counterparty to be a team_members row.
    // P4's bridge door (`POST /vendor/roster/:roster_id/bridge`) mints exactly
    // that, and it is keyed on the ROSTER ROW's id, which this response used to
    // reduce to a boolean before the client ever saw it. The id now rides too.
    //
    // ADDITIVE BY RULING: `roster_edge` STAYS for readers that already read it.
    // `roster_id` is the poster-side edge (owner = this vendor, member = the
    // responder) — the only direction the poster can act on. Null when the edge
    // failed, which is lawful: the edge is the convenience, the connection is
    // the product (the seam handover's §4.4 disclosure, unchanged).
    roster_edge: !!edges.poster_edge,
    roster_id: (edges.poster_edge && edges.poster_edge.id) || null,
    filled_item_id: targetId,
    auto_closed: autoClosed,
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
