// src/lib/vendor/discover.js
// Discover request business logic.
'use strict';

const { portfolioSummary } = require('./portfolio');
const MIN_PORTFOLIO_IMAGES = 5;

async function requestDiscover(supabase, vendorId, body) {
  const { rate_min, rate_max, aesthetic_tags, pitch, instagram_handle, sample_image_ids } = body;

  if (rate_min == null || rate_max == null) return { ok: false, error: 'rate_min and rate_max are required.' };
  if (Number(rate_min) > Number(rate_max))  return { ok: false, error: 'rate_min cannot exceed rate_max.' };
  if (!aesthetic_tags?.length)              return { ok: false, error: 'At least one aesthetic tag required.' };
  if (aesthetic_tags.length > 10)           return { ok: false, error: 'Maximum 10 aesthetic tags.' };

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

  return {
    ok: true,
    discover_request_state: vendor?.discover_request_state || 'not_requested',
    discover_eligible:      vendor?.discover_eligible || false,
    portfolio_summary:      summary,
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

module.exports = { requestDiscover, getDiscoverStatus, withdrawRequest };
