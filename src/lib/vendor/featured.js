// src/lib/vendor/featured.js
// Featured promo submission business logic.
// Razorpay payment deferred until Block 4 KYC clears (RAZORPAY_LIVE flag).
'use strict';

const FEATURED_FEES = {
  discover_top:         5000,
  spotlight:            3000,
  blind_swipe_priority: 2000,
  newsletter:           1500,
};

// Calculate fee: week count × rate (newsletter = flat per inclusion).
function calculateFee(slotKind, startDate, endDate) {
  const base = FEATURED_FEES[slotKind];
  if (!base) return null;
  if (slotKind === 'newsletter') return base;
  if (!startDate || !endDate) return base; // default 1 week
  const days  = Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000);
  const weeks = Math.max(1, Math.ceil(days / 7));
  return base * weeks;
}

async function submitFeatured(supabase, vendorId, body) {
  const { slot_kind, hero_image_id, caption, proposed_start_date, proposed_end_date } = body;

  if (!slot_kind || !FEATURED_FEES[slot_kind]) {
    return { ok: false, error: `Invalid slot_kind. Allowed: ${Object.keys(FEATURED_FEES).join(', ')}.` };
  }

  // Validate hero image belongs to vendor
  if (hero_image_id) {
    const { data: img } = await supabase.from('vendor_portfolio')
      .select('id').eq('id', hero_image_id).eq('vendor_id', vendorId).maybeSingle();
    if (!img) return { ok: false, error: 'hero_image_id does not belong to your portfolio.' };
  }

  const fee_inr = calculateFee(slot_kind, proposed_start_date, proposed_end_date);

  // Razorpay stub — RAZORPAY_LIVE=false skips payment, records submission
  const razorpay_order_id = process.env.RAZORPAY_LIVE === 'true'
    ? null // TODO: create Razorpay order when Block 4 ships
    : `stub_${Date.now()}`;

  const { data, error } = await supabase.from('vendor_featured_submissions').insert({
    vendor_id:           vendorId,
    slot_kind,
    hero_image_id:       hero_image_id || null,
    caption:             caption || null,
    proposed_start_date: proposed_start_date || null,
    proposed_end_date:   proposed_end_date   || null,
    fee_inr,
    razorpay_order_id,
    state: 'submitted',
  }).select().single();

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    submission_id:     data.id,
    razorpay_order_id: data.razorpay_order_id,
    amount_inr:        fee_inr,
    checkout_url:      process.env.RAZORPAY_LIVE === 'true' ? null : null, // stub
  };
}

async function listSubmissions(supabase, vendorId) {
  const { data, error } = await supabase.from('vendor_featured_submissions')
    .select('id, slot_kind, caption, proposed_start_date, proposed_end_date, fee_inr, state, scheduled_start, scheduled_end, rejection_reason, created_at')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, submissions: data || [], total: (data || []).length };
}

module.exports = { submitFeatured, listSubmissions, FEATURED_FEES };
