// src/api/pin-status.js
// POST /api/v2/auth/pin-status
//
// Public endpoint — no auth required. Called by the landing page
// (app/page.tsx) when a returning user enters their phone on the
// "Sign in" path. The response tells the frontend which screen to
// route to next:
//
//   exists=false           → "No account found. Request an invite."
//   exists=true, pin_set=true   → /vendor/pin-login or /couple/pin-login
//                                 (returning user — phone → PIN, no OTP)
//   exists=true, pin_set=false  → /vendor/login then /vendor/pin
//                                 (existing WhatsApp user, first PWA login —
//                                 phone → OTP → PIN setup)
//
// This endpoint makes the locked PWA login sequence work:
//   "Returning user: phone → PIN → enter app (no OTP)"
//
// Not in the original P2-3 / P2-4 endpoint list — discovered during P2-5
// frontend inventory as a required dependency of the locked login flow.
// See HANDOVER_FINAL P2-5 session notes.
//
// POST not GET: phone numbers in URLs/query strings end up in access logs.
// Body keeps them out.
//
// Schema lookup:
//   users.phone is unique (migration 0001).
//   vendors.user_id → users.id; vendors.pin_hash from migration 0028.
//   couples.user_id → users.id; couples.pin_hash from migration 0028.
//   pin_set = (pin_hash IS NOT NULL).
//
// ── F-09.48 · THE BOTH-ROLES ANSWER (TDW_09 dream-os micro, FORK A(a)) ─────
//
// TWO CONTRACTS LIVE HERE. Which one you get is decided by ONE THING: whether
// the body carries `role`.
//
//   role PRESENT  → the SINGLE-ROLE contract, unchanged to the byte. Every
//                   line of that path below is the code that shipped before
//                   this comment existed. Its live caller is the landing
//                   page's sign-in fetch (dreamos-pwa app/(landing)/page.tsx,
//                   symbol: the pin-status fetch in the sign-in handler).
//
//   role ABSENT   → the BOTH-ROLES contract, strictly additive. The server
//                   answers for vendor AND couple in one call, so a returning
//                   member is never asked which they are when the server can
//                   simply say.
//
// WHY IT DOES NOT ASSUME EXCLUSIVITY. Migration 0028 installs role-XOR
// triggers, and it is tempting to conclude at most one of the two rows can
// exist. 0028's own header refuses that reading: the triggers fire on INSERT
// only, and it says in as many words that an UPDATE violating the XOR would
// NOT be caught. So both-populated is REPRESENTABLE, and this endpoint's job
// is to report both rows truthfully — never to throw, never to silently pick
// a winner. WHICH DOOR a both-populated member is offered is the consumer's
// presentation question, and it is not answered here.
//
// Body:    { phone, role? }   role, when present, in { 'vendor', 'couple' }
// Phone format: E.164 with leading + (e.g. +918757788550).
//
// Response — single-role (role present), unchanged:
//   200 OK { ok: true, exists: boolean, pin_set: boolean,
//            user_id?, role_id? }
//   400    { ok: false, error: 'message' }
//
// Response — both-roles (role absent):
//   200 OK { ok: true, user_id: uuid|null,
//            vendor: { exists, pin_set, role_id },
//            couple: { exists, pin_set, role_id } }
//   400    { ok: false, error: 'message' }   (phone errors only)
//
// All lookup outcomes return 200 + ok:true. Whether the user exists is
// information the caller already inferred by typing the phone — there is
// no information leak to defend against here. Errors are reserved for
// malformed input.

'use strict';

const express = require('express');
const router  = express.Router();

const PHONE_RE = /^\+[0-9]{8,15}$/;

const ABSENT_ROLE = { exists: false, pin_set: false, role_id: null };

// One shaper, both role tables. `row` is the vendors/couples row or null.
function shapeRole(row) {
  if (!row) return { ...ABSENT_ROLE };
  return { exists: true, pin_set: !!row.pin_hash, role_id: row.id };
}

router.post('/', async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { phone, role } = req.body || {};

  // ── 1. Validate role ────────────────────────────────────────────────
  // An ABSENT role is not an error — it selects the both-roles contract.
  // A PRESENT but unrecognised role is the same 400, byte-identical.
  const bothRoles = (role === undefined || role === null || role === '');

  if (!bothRoles && !['vendor', 'couple'].includes(role)) {
    return res.status(400).json({ ok: false, error: 'role must be vendor or couple.' });
  }

  // ── 2. Validate phone ───────────────────────────────────────────────
  const cleanPhone = (phone || '').trim();
  if (!PHONE_RE.test(cleanPhone)) {
    return res.status(400).json({ ok: false, error: 'phone must be E.164 with leading + (e.g. +918757788550).' });
  }

  try {
    // ── 3. Look up users row by phone ─────────────────────────────────
    const { data: userRow, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (userErr) {
      console.error('[pin-status] users lookup error:', userErr);
      return res.status(500).json({ ok: false, error: 'database_error' });
    }

    if (!userRow) {
      // No users row → no vendor and no couple either.
      if (bothRoles) {
        return res.json({
          ok:      true,
          user_id: null,
          vendor:  { ...ABSENT_ROLE },
          couple:  { ...ABSENT_ROLE },
        });
      }
      return res.json({ ok: true, exists: false, pin_set: false });
    }

    // ── 4a. BOTH-ROLES: one users row, both role tables, one answer ────
    if (bothRoles) {
      const [
        { data: vendorRow, error: vendorErr },
        { data: coupleRow, error: coupleErr },
      ] = await Promise.all([
        supabase.from('vendors').select('id, pin_hash').eq('user_id', userRow.id).maybeSingle(),
        supabase.from('couples').select('id, pin_hash').eq('user_id', userRow.id).maybeSingle(),
      ]);

      if (vendorErr || coupleErr) {
        console.error('[pin-status] both-roles lookup error:', vendorErr || coupleErr);
        return res.status(500).json({ ok: false, error: 'database_error' });
      }

      // Both rows reported as found. 0028's XOR does not make this
      // impossible (INSERT-only, per its own header), so it is REPORTED,
      // never resolved here.
      if (vendorRow && coupleRow) {
        console.warn('[pin-status] both-roles: user_id ' + userRow.id + ' carries BOTH a vendors and a couples row');
      }

      return res.json({
        ok:      true,
        user_id: userRow.id,
        vendor:  shapeRole(vendorRow),
        couple:  shapeRole(coupleRow),
      });
    }

    // ── 4b. SINGLE-ROLE: unchanged from here to the end of the handler ──
    const roleTable = role === 'vendor' ? 'vendors' : 'couples';

    const { data: roleRow, error: roleErr } = await supabase
      .from(roleTable)
      .select('id, pin_hash')
      .eq('user_id', userRow.id)
      .maybeSingle();

    if (roleErr) {
      console.error('[pin-status] ' + roleTable + ' lookup error:', roleErr);
      return res.status(500).json({ ok: false, error: 'database_error' });
    }

    if (!roleRow) {
      // users row exists but no matching role row. Treat as not-found
      // for this role (could be a vendor checking the couple table or
      // vice versa — the XOR trigger from 0028 prevents both on INSERT,
      // so this is a clean "not in this role" signal).
      return res.json({ ok: true, exists: false, pin_set: false });
    }

    return res.json({
      ok:      true,
      exists:  true,
      pin_set: !!roleRow.pin_hash,
      user_id: userRow.id,
      role_id: roleRow.id,
    });
  } catch (err) {
    console.error('[pin-status] unexpected error:', err);
    return res.status(500).json({ ok: false, error: 'internal_error' });
  }
});

module.exports = router;
