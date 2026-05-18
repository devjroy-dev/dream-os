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
// Body:    { phone, role }    role in { 'vendor', 'couple' }
// Phone format: E.164 with leading + (e.g. +918757788550).
//
// Response:
//   200 OK { ok: true, exists: boolean, pin_set: boolean }
//   400    { ok: false, error: 'message' }
//
// All lookup outcomes return 200 + ok:true. Whether the user exists is
// information the caller already inferred by typing the phone — there is
// no information leak to defend against here. Errors are reserved for
// malformed input.

'use strict';

const express = require('express');
const router  = express.Router();

const PHONE_RE = /^\+[0-9]{8,15}$/;

router.post('/', async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { phone, role } = req.body || {};

  // ── 1. Validate role ────────────────────────────────────────────────
  if (!role || !['vendor', 'couple'].includes(role)) {
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
      return res.json({ ok: true, exists: false, pin_set: false });
    }

    // ── 4. Look up role-specific row ──────────────────────────────────
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
      // vice versa — the XOR trigger from 0028 prevents both, so this
      // is a clean "not in this role" signal).
      return res.json({ ok: true, exists: false, pin_set: false });
    }

    return res.json({
      ok:      true,
      exists:  true,
      pin_set: !!roleRow.pin_hash,
    });
  } catch (err) {
    console.error('[pin-status] unexpected error:', err);
    return res.status(500).json({ ok: false, error: 'internal_error' });
  }
});

module.exports = router;
