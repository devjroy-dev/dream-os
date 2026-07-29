// src/lib/vendor/discover.js
// Discover request business logic.
'use strict';

const { portfolioSummary } = require('./portfolio');
// TDW_07 P2 · D-2's floor RAISED 5 -> 6 at the ONE constant, CE-ruled at the P2 charter.
// This single byte moves BOTH consumers by construction: the server-side approval gate at
// :17 below, and src/lib/vendor/profileScore.js's photo term, which imports this name
// rather than minting a second copy. The pwa's own display of the number reads it from
// getDiscoverStatus's `min_portfolio_images` (added this sitting) — so no third copy of
// the number exists anywhere, in digits or in words.
const MIN_PORTFOLIO_IMAGES = 6;

async function requestDiscover(supabase, vendorId, body) {
  const { rate_min, rate_max, aesthetic_tags, pitch, instagram_handle, sample_image_ids } = body;

  if (rate_min == null || rate_max == null) return { ok: false, error: 'rate_min and rate_max are required.' };
  if (Number(rate_min) > Number(rate_max))  return { ok: false, error: 'rate_min cannot exceed rate_max.' };
  if (!aesthetic_tags?.length)              return { ok: false, error: 'At least one aesthetic tag required.' };
  if (aesthetic_tags.length > 10)           return { ok: false, error: 'Maximum 10 aesthetic tags.' };

  // F-07.4 RECONCILED (CE ruling, Fork 2(b)): the GATE counts every row (summary.total),
  // the SCORE and the FEED count approved rows only. Both readings are kept, deliberately:
  //   · total at the gate keeps requesting Discover SELF-SERVE. Photo approval is a
  //     standalone admin queue (src/api/admin/photos.js:37/48/60) with zero coupling to the
  //     discover request (src/api/admin/discover.js names no portfolio), so gating on
  //     `approved` would turn "upload six and ask" into "upload six and wait for an admin".
  //   · approved in the score/feed because a couple sees approved rows only, and a score
  //     crediting invisible photos would rank a card above what it renders.
  // The two numbers never contradict on screen because the Studio's gate line SHOWS BOTH.
  const summary = await portfolioSummary(supabase, vendorId);
  if (summary.total < MIN_PORTFOLIO_IMAGES) {
    return { ok: false, error: `Need at least ${MIN_PORTFOLIO_IMAGES} portfolio images. You have ${summary.total}.` };
  }

  // Validate sample_image_ids belong to this vendor
  if (sample_image_ids?.length) {
    const { data: imgs } = await supabase.from('vendor_portfolio')
      .select('id').eq('vendor_id', vendorId).in('id', sample_image_ids);
    if ((imgs || []).length !== sample_image_ids.length) {
      return { ok: false, error: 'One or more sample_image_ids do not belong to your portfolio.' };
    }
  }

  // Update vendor profile fields
  const vendorUpdate = { rate_min: Number(rate_min), rate_max: Number(rate_max), aesthetic_tags, discover_request_state: 'requested' };
  if (instagram_handle) vendorUpdate.instagram_handle = instagram_handle;
  await supabase.from('vendors').update(vendorUpdate).eq('id', vendorId);

  // Insert request row
  const { data: req, error } = await supabase.from('vendor_discover_requests')
    .insert({ vendor_id: vendorId, state: 'requested', reason: pitch || null })
    .select().single();
  if (error) return { ok: false, error: error.message };

  return { ok: true, request_id: req.id };
}

async function getDiscoverStatus(supabase, vendorId) {
  const [vendorRes, requestRes] = await Promise.all([
    supabase.from('vendors').select('discover_request_state, discover_eligible').eq('id', vendorId).maybeSingle(),
    supabase.from('vendor_discover_requests')
      .select('id, state, decided_at, reason')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const vendor  = vendorRes.data;
  const request = requestRes.data;
  const summary = await portfolioSummary(supabase, vendorId);

  // Saves: how many times brides have saved this vendor to their Muse board.
  const { count: savesCount } = await supabase
    .from('muse_saves')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendorId);

  return {
    ok: true,
    // TDW_07 P2 · CE ruling §F: the SERVER carries the floor, so the pwa's rendering of it
    // is display-only truth rather than a second authority. Before this, the pwa held the
    // number twice on its own (a branch gate `< 5` and the WORD "five" in vendor copy) and
    // the raise would have left both lying while the server rejected. Comment-binding ships
    // as the fallback layer; THIS field is the mechanism.
    min_portfolio_images:   MIN_PORTFOLIO_IMAGES,
    discover_request_state: vendor?.discover_request_state || 'not_requested',
    discover_eligible:      vendor?.discover_eligible || false,
    portfolio_summary:      summary,
    saves_count:            savesCount || 0,
    current_request:        request || null,
    last_decision_reason:   request?.reason || null,
  };
}

async function withdrawRequest(supabase, vendorId) {
  const { data: req } = await supabase.from('vendor_discover_requests')
    .select('id, state').eq('vendor_id', vendorId)
    .in('state', ['requested', 'under_review'])
    .order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (!req) return { ok: false, error: 'No pending request to withdraw.' };

  await supabase.from('vendor_discover_requests').update({ state: 'revoked' }).eq('id', req.id);
  await supabase.from('vendors').update({ discover_request_state: 'not_requested' }).eq('id', vendorId);
  return { ok: true };
}

// MIN_PORTFOLIO_IMAGES is EXPORTED (TDW_07 P1) so src/lib/vendor/profileScore.js reads
// the enforced floor rather than minting a second copy of the number. Behaviour here is
// unchanged — this line adds a name to the export object and nothing else. P2 raises the
// constant at :6 from 5 to 6 and BOTH the gate and the completeness score move together.
module.exports = { requestDiscover, getDiscoverStatus, withdrawRequest, MIN_PORTFOLIO_IMAGES };
