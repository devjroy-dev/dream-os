'use strict';
// src/lib/brands/pitched.js · CE-47 · PRO · P3 · THE "PITCHED BRAND" DOOR, for ELZ-4's reply path.
// The chair's ruling (6 October 2026): Eliza never replies in a thread whose sender is a brand the vendor pitched. The
// thread is marked "Brand" and waits for her. ELZ-4 changes the reply path; PRO supplies this door and nothing else.
//
//   isPitchedBrand({ supabase, vendorId, sender: { ig_username?, email? }, now? })
//     → { brand: true, brand_id, brand_name, label: 'Brand' } when the sender is a brand she pitched in the last
//       365 days: its Instagram handle equals the sender's Instagram username, or its role email equals the sender's
//       email (both compared in lower case);
//     → { brand: false } otherwise, and also when the store cannot be read: a failed read never blocks a client's
//       reply, and the door says so in `error` for the caller's log.
// It never throws. It reads only pro_pitches and pro_brands, and returns nothing about the pitch itself.
const WINDOW_DAYS = 365;
const LABEL = 'Brand';
const norm = (s) => String(s || '').trim().replace(/^@/, '').toLowerCase();

async function isPitchedBrand({ supabase, vendorId, sender, now = Date.now() }) {
  const ig = norm(sender && sender.ig_username);
  const email = norm(sender && sender.email);
  if (!vendorId || (!ig && !email)) return { brand: false };
  try {
    const since = new Date(now - WINDOW_DAYS * 86400000).toISOString();
    const p = await supabase.from('pro_pitches').select('brand_id').eq('vendor_id', vendorId).gte('pitched_at', since).limit(500);
    if (p.error) return { brand: false, error: 'pro_pitches' };
    const ids = [...new Set((p.data || []).map((r) => r.brand_id))];
    if (!ids.length) return { brand: false };
    const b = await supabase.from('pro_brands').select('id, name, instagram_handle, role_email').in('id', ids);
    if (b.error) return { brand: false, error: 'pro_brands' };
    const hit = (b.data || []).find((x) => (ig && norm(x.instagram_handle) === ig) || (email && x.role_email && norm(x.role_email) === email));
    return hit ? { brand: true, brand_id: hit.id, brand_name: hit.name, label: LABEL } : { brand: false };
  } catch (_e) {
    return { brand: false, error: 'read' };
  }
}

module.exports = { isPitchedBrand, WINDOW_DAYS, LABEL };
