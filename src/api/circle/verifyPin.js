// src/api/circle/verifyPin.js
// POST /api/v2/auth/verify-pin
//
// Called by coplanner layout after pin-status confirms pin_set=true.
// Body: { phone, pin, role }
// Returns: { success, userId }
//
// Phone: coplanner sends bare 10-digit "9888294440".
//        users.phone is E.164 "+919888294440".
//        We prepend +91 to match.
//
// PIN verified against couples.pin_hash — circle members share the bride's PIN.
//
// ── F-07.72 · THIS DOOR IS NOW A MINT POINT ─────────────────────────────────
// It returns a SIGNED SESSION alongside the bare userId it has always returned.
// `userId` is preserved byte-for-byte in the response so nothing that reads it
// breaks during the mint-and-teach phase; `token` is additive.
//
// ── F-07.104 · THIS DOOR HAD NO REACHABLE CALLER ────────────────────────────
// Derived at F-07.72's read-first and cured in the same delivery. The returning
// co-planner's sign-in called `GET /api/v2/auth/pin-status?phone=<10 digits>`
// first, and that route is POST-only (`src/api/pin-status.js:51`, one mount at
// `router.js:24`), demands E.164 (`:49`), answers with `exists`/`user_id` where
// the client read `found`/`userId`, and looks up a `couples` row by the MEMBER's
// users.id — which a circle member never owns. Four independent faults in one
// call, so the "Welcome back" screen could only ever say it did not recognise
// her, and this file was never once executed in production.
//
// The cure was a DELETION, not a correction: `toE164` below already accepts the
// bare ten digits the client sends, so the pre-check was structurally moot and
// pin-status left the flow entirely. The consequence for the copy is that the
// two guard sentences that used to live at the client's PHONE step now come
// from THIS FILE at its PIN step — which is why the strings below are the
// founder's, frozen at the byte, and not the terse internal phrasings they
// replaced.

'use strict';

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');

const PIN_RE = /^\d{4}$/;

// TDW_04.5 P4 rider F-04.109 — toE164 hoisted to src/lib/phone.js (one home,
// three importers). Moved byte-identically; behaviour unchanged.
const { toE164 } = require('../../lib/phone');
const { mintCircleSession, CIRCLE_TTL_MS } = require('../../lib/circleSession');

router.post('/', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { phone, pin } = req.body || {};

  if (!phone || !pin) {
    return res.status(400).json({ success: false, error: 'phone and pin are required.' });
  }
  if (!PIN_RE.test(pin)) {
    return res.status(400).json({ success: false, error: 'PIN must be exactly 4 digits.' });
  }

  const e164Phone = toE164(phone);

  // 1. Find user by E.164 phone
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('phone', e164Phone)
    .maybeSingle();

  if (!userRow) {
    return res.status(404).json({ success: false, error: "We don't recognise this number. Use your invite link to join first." });
  }

  // 2. Find active circle_member by E.164 phone (same format in both tables)
  const { data: member } = await supabase
    .from('circle_members')
    .select('id, couple_id, status')
    .eq('invitee_phone', e164Phone)
    .eq('status', 'active')
    .maybeSingle();

  if (!member) {
    return res.status(403).json({ success: false, error: "This number isn't in the Circle. Ask for a new invite link." });
  }

  // 3. Verify PIN against couples.pin_hash
  const { data: coupleRow } = await supabase
    .from('couples')
    .select('pin_hash, pin_locked_until')
    .eq('id', member.couple_id)
    .maybeSingle();

  if (!coupleRow || !coupleRow.pin_hash) {
    return res.status(400).json({ success: false, error: 'No PIN has been set yet. Use your invite link to set one.' });
  }

  if (coupleRow.pin_locked_until && new Date(coupleRow.pin_locked_until) > new Date()) {
    const mins = Math.ceil((new Date(coupleRow.pin_locked_until) - Date.now()) / 60000);
    return res.status(429).json({ success: false, error: `Account locked. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` });
  }

  const valid = await bcrypt.compare(pin, coupleRow.pin_hash);
  if (!valid) {
    console.log(`[verify-pin] wrong PIN for circle member ${e164Phone}`);
    return res.status(400).json({ success: false, error: 'Incorrect PIN.' });
  }

  // F-07.72 — mint the lane's session. Re-minted on EVERY successful verify, so
  // an active member's 90-day window rolls forward and never expires under her.
  // A null token (absent CIRCLE_SESSION_SECRET) degrades to exactly the response
  // this door shipped before: fail-closed at the mint, never a forged stand-in.
  const token = mintCircleSession({ userId: userRow.id, coupleId: member.couple_id });

  console.log(`[verify-pin] ok circle member ${e164Phone} couple_id=${member.couple_id}`);
  return res.json({
    success:    true,
    userId:     userRow.id,
    couple_id:  member.couple_id,
    token:      token || null,
    expires_at: token ? Date.now() + CIRCLE_TTL_MS : null,
  });
});

module.exports = router;
