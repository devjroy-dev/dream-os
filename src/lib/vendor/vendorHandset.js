// src/lib/vendor/vendorHandset.js
// ── TDW_06 · F-06.180 — WHERE A VENDOR'S PHONE ACTUALLY LIVES ───────────────
//
// THE DISEASE, DERIVED AND FOUNDER-WITNESSED ON PRODUCTION (walk nine,
// 2026-08-11 12:34:33): `[relay:wa] arrival outcome undeliverable to vendor —
// no transport, lane or phone`, on a walk where everything else worked.
//
// **`public.vendors` HAS NO `phone` COLUMN.** Thirty-eight columns, witnessed at
// `docs/db/PUBLIC_SCHEMA.md` under `## public.vendors`, and not one of them is a
// phone. The vendor's handset lives at `public.users.phone` (column 2, NOT NULL,
// witnessed at `## public.users`), reached through `public.vendors.user_id`
// (column 2, uuid NOT NULL).
//
// WHAT THAT COST, AND FOR HOW LONG. Two sites selected `phone` from `vendors`
// and refused to send when it came back undefined — which it always did:
//   · `relaySeat.js`, symbol `relayReceipt` — №14 and №15. The receipt chain was
//     recorded in the hand sitting's handover as "seated but unreachable",
//     meaning no `vendor_relay` row had ever carried a wamid. Walk nine produced
//     one and matched it — `status=read matched=1 sent_by=vendor_relay` — and
//     STILL no byte left the estate. It was never merely unreachable; it was
//     seated, reachable, and STRUCTURALLY MUTE.
//   · `coupleArrival.js`, symbol `tellVendor` — ③ and ⑥, shipped in the same
//     sitting that found this, with the identical defect copied forward.
//
// WHY NO BENCH SAW IT (F-06.181). Both benches handed their doubles
// `vendors: [{ id: 'v1', phone: '+919888294440' }]` — a fixture asserting a
// column that does not exist. The fixture-shaped-cell law and F-06.172's
// "a double speaking a contract its subject does not speak" converging inside a
// SEALED bench. The doubles are re-derived from the schema in the same delivery
// as this file, and a grep-class cell now forbids the shape estate-wide.
//
// WHY A LIB. The estate already resolves the vendor's handset correctly — ONCE,
// inline and unreusably, at `src/lib/vendorInbound.js` (the vendor-notification
// path, symbol `processVendorInbound`, `vendorUser?.phone` off a `users` lookup).
// That inline precedent is this file's warrant: the knowledge existed and had no
// home, so two sites re-derived it wrongly. It has a home now.

'use strict';

/**
 * The vendor's WhatsApp handset, resolved the only way the schema permits.
 *
 * @param {object} supabase
 * @param {string} vendorId  `public.vendors.id`
 * @returns {Promise<{phone: string|null, userId: string|null, name: string|null, reason: string}>}
 *
 * NEVER THROWS. Every failure is a typed reason travelling back to a caller that
 * can log it — the posture `waWindow.js` and `coupleWaWindow.js` both hold, and
 * the opposite of the silence that hid this defect for the life of the chain.
 * A missing handset is a REFUSAL WITH A NAME, never an undefined that a
 * truthiness check swallows.
 */
async function vendorHandset(supabase, vendorId) {
  if (!supabase || !vendorId) return { phone: null, userId: null, name: null, reason: 'no_supabase_or_vendor' };

  try {
    // WITNESS: `docs/db/PUBLIC_SCHEMA.md`, `## public.vendors` — `user_id` is
    // column 2, `uuid NOT NULL`. `phone` is DELIBERATELY NOT SELECTED HERE and
    // must never be added: the column does not exist, and asking for it is how
    // both mute sites came to believe it did.
    const { data: vendor, error: vErr } = await supabase
      .from('vendors').select('id, user_id, business_name')
      .eq('id', vendorId).maybeSingle();

    if (vErr) return { phone: null, userId: null, name: null, reason: 'vendor_query_failed' };
    if (!vendor) return { phone: null, userId: null, name: null, reason: 'no_such_vendor' };
    if (!vendor.user_id) return { phone: null, userId: null, name: null, reason: 'vendor_has_no_user' };

    // WITNESS: `## public.users` — `phone` is column 2, `text NOT NULL`;
    // `name` is column 3, nullable.
    const { data: user, error: uErr } = await supabase
      .from('users').select('id, phone, name')
      .eq('id', vendor.user_id).maybeSingle();

    if (uErr) return { phone: null, userId: vendor.user_id, name: null, reason: 'user_query_failed' };
    if (!user) return { phone: null, userId: vendor.user_id, name: null, reason: 'no_user_row' };
    if (!user.phone) return { phone: null, userId: user.id, name: user.name || null, reason: 'user_has_no_phone' };

    // R-29.34 MEMBER (b) — THE NAMED WITNESS. The founder can read this line and
    // know the handset was found; its absence beside a relay outcome is now
    // itself readable, which is exactly what walk nine lacked.
    console.log(`[relay:wa] vendor_handset_resolved vendor=${vendor.id} user=${user.id}`);
    return {
      phone: user.phone,
      userId: user.id,
      // The bride-facing display register is NOT this function's business
      // (F-06.155 is open and unruled); this name is for logs and for callers
      // that already choose their own register.
      name: user.name || vendor.business_name || null,
      reason: 'resolved',
    };
  } catch (err) {
    return { phone: null, userId: null, name: null, reason: `handset_lookup_threw:${err && err.message}` };
  }
}

module.exports = { vendorHandset };
