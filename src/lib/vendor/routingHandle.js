// src/lib/vendor/routingHandle.js
//
// THE ONE HOME FOR `vendors.routing_handle` — F-19.50 · F-19.49 · CE-39 step 2a.
//
// WHY THIS FILE EXISTS. The column does two jobs — the public `/v/<handle>`
// address and the `TDW-<handle>` WhatsApp routing code — and until this seat it
// had FOUR writers on THREE rules: both onboarding mints sliced at 20 after
// feeding a pasted Instagram URL in raw (so `https://www.instagram.com/…` minted
// `HTTPSWWWINSTAGRAMCOM`), the /me edit door capped at 12, and the agent tool
// admitted a hyphen the inbound lane (`src/lib/vendorInbound.js`, the `TDW-`
// parser's `/^[A-Z0-9]+$/`) can never route. One column, one rule, one file.
//
// THE RULE (ruled CE-39, read-first B-1/B-2/B-3): `^[A-Z0-9]{1,30}$` and nothing
// else. Instagram's own username ceiling is 30, so a normalised username always
// fits; the old 20 and 12 both retire, and so does the door's `<3` floor. No DB
// constraint bears on length — `vendors_routing_handle_key` is UNIQUE only
// (docs/db/PUBLIC_SCHEMA.md constraints addendum, `public.vendors`).
//
// NORMALISE BEFORE MINT. `mintRoutingHandle` runs the raw value through
// `normalizeIgHandle` (src/lib/discover/shapeVendor.js) FIRST — the username,
// never the URL — then upper-cases and strips to the alphabet. A candidate the
// rule refuses (empty, or longer than 30 after the strip) returns null and the
// caller SKIPS it; nothing here truncates, because a handle cut mid-word is the
// disease this file was written to end.
//
// ONE ADDRESS SPACE (F-19.49). `vendors.routing_handle` (minted UPPER) and
// `demo_vendors.ig_handle` (inserted lower) are read by the same public door
// (src/api/public/vendorCard.js) with the real vendor first, so the two tables
// collide silently in both directions. `handleIsFree` is the one guard: it
// folds case both ways and treats a demo row as LIVE when `active = true` —
// the door's own predicate for the fallback. Both mints, the edit door and the
// demo inserts call it. The "retired on claim" half of F-19.49 is OPEN by
// ruling and belongs to the Phase 7 demo-in-shell charter, where the claim
// moment is designed; this file invents no claim rule.
'use strict';

const { normalizeIgHandle } = require('../discover/shapeVendor');

const ROUTING_HANDLE_RE = /^[A-Z0-9]{1,30}$/;

// Vendor-facing strings, founder-vetoed 2026-08-29 (CE-39 read-first veto slot).
const HANDLE_TOO_LONG = 'Handle must be 30 characters or fewer.';
const HANDLE_TAKEN    = 'That address is taken. Try another.';

/**
 * Validate an ALREADY-shaped candidate: upper-case alphanumeric, 1–30.
 * Returns the candidate or null. Never truncates.
 */
function validateRoutingHandle(candidate) {
  if (typeof candidate !== 'string') return null;
  return ROUTING_HANDLE_RE.test(candidate) ? candidate : null;
}

/**
 * Mint from a raw Instagram-ish value (username, `@username`, or a pasted URL).
 * Normalise first, then upper-case and strip to [A-Z0-9], then validate.
 * `https://www.instagram.com/makeupbyviaraa?igsh=…` → `MAKEUPBYVIARAA`
 * `preetikhandelwalmakeup` → `PREETIKHANDELWALMAKEUP` (22 chars, whole)
 * A value that normalises to nothing, or strips to nothing, returns null.
 */
function mintRoutingHandle(raw) {
  const username = normalizeIgHandle(raw);
  if (!username) return null;
  return validateRoutingHandle(username.toUpperCase().replace(/[^A-Z0-9]/g, ''));
}

/**
 * Shape a vendor-typed or machine-built candidate (the /me door, the agent
 * tool, the `${firstName}${phone3}` fallbacks): upper-case, strip to the
 * alphabet, validate. No normalisation — these are not Instagram values.
 */
function shapeRoutingHandle(raw) {
  if (typeof raw !== 'string') return null;
  return validateRoutingHandle(raw.toUpperCase().replace(/[^A-Z0-9]/g, ''));
}

/**
 * THE ONE CROSS-TABLE GUARD. True when neither a `vendors` row (any status —
 * the column is UNIQUE and the real vendor always wins) nor a LIVE
 * `demo_vendors` row (`active = true`) holds this address.
 *
 * @param supabase   client
 * @param handle     the candidate, any case
 * @param opts.excludeVendorId  the vendor editing her own handle (the door)
 */
async function handleIsFree(supabase, handle, opts) {
  if (typeof handle !== 'string' || handle.trim() === '') return false;
  const upper = handle.toUpperCase();
  const lower = handle.toLowerCase();
  const excludeVendorId = opts && opts.excludeVendorId;

  let q = supabase.from('vendors').select('id').eq('routing_handle', upper);
  if (excludeVendorId) q = q.neq('id', excludeVendorId);
  const { data: realRow, error: realErr } = await q.maybeSingle();
  if (realErr) throw realErr;
  if (realRow) return false;

  const { data: demoRow, error: demoErr } = await supabase
    .from('demo_vendors').select('id').eq('ig_handle', lower).eq('active', true).maybeSingle();
  if (demoErr) throw demoErr;
  if (demoRow) return false;

  return true;
}

module.exports = {
  ROUTING_HANDLE_RE,
  HANDLE_TOO_LONG,
  HANDLE_TAKEN,
  validateRoutingHandle,
  mintRoutingHandle,
  shapeRoutingHandle,
  handleIsFree,
};
