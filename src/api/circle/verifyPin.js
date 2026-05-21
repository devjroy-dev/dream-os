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

'use strict';

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');

const PIN_RE = /^\d{4}$/;

function toE164(raw) {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length > 10)   return `+${digits}`;
  return raw;
}

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
    return res.status(404).json({ success: false, error: 'Phone not registered.' });
  }

  // 2. Find active circle_member by E.164 phone (same format in both tables)
  const { data: member } = await supabase
    .from('circle_members')
    .select('id, couple_id, status')
    .eq('invitee_phone', e164Phone)
    .eq('status', 'active')
    .maybeSingle();

  if (!member) {
    return res.status(403).json({ success: false, error: 'Not an active circle member.' });
  }

  // 3. Verify PIN against couples.pin_hash
  const { data: coupleRow } = await supabase
    .from('couples')
    .select('pin_hash, pin_locked_until')
    .eq('id', member.couple_id)
    .maybeSingle();

  if (!coupleRow || !coupleRow.pin_hash) {
    return res.status(400).json({ success: false, error: 'PIN not set for this circle yet.' });
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

  console.log(`[verify-pin] ok circle member ${e164Phone} couple_id=${member.couple_id}`);
  return res.json({ success: true, userId: userRow.id });
});

module.exports = router;
