// src/api/register.js
// POST /api/v2/register  — PUBLIC, open phone-OTP registration (no invite code).
//
// Replaces the invite-gated /invite/consume as the front door. Creates the
// users row + the role row (vendors|couples), then the caller proceeds to
// /api/v2/{vendor|couple}/auth/send-otp with the same phone.
//
// Mirrors /invite/consume's account-creation logic EXACTLY, minus the
// consume_invite_code call. The one addition consume_invite_code used to do
// for us — creating the role row — is done here explicitly, because that DB
// function is being retired from the signup path.
//
//   Body: { kind: 'maker'|'dreamer', name?, phone }
//   - maker  -> users + vendors (onboarding_state:'new')
//   - dreamer-> users + couples  (onboarding_state:'new')
//
//   Phone contract: E.164 with leading +. Same as /invite/consume.
//   Returns { ok:true, user_id, kind, already_provisioned } so the PWA login
//   flow can continue to send-otp with the phone it already has.

'use strict';

const express = require('express');
const router  = express.Router();

const PHONE_RE = /^\+[0-9]{8,15}$/;

router.post('/', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { kind, name, phone } = req.body;

  // 1. Required fields
  if (!kind || !phone) {
    return res.status(400).json({ error: 'kind and phone are required.' });
  }
  if (!['dreamer', 'maker'].includes(kind)) {
    return res.status(400).json({ error: 'kind must be dreamer or maker.' });
  }

  const cleanName  = (name || '').trim();
  const cleanPhone = (phone || '').trim().replace(/\s+/g, '');

  if (!PHONE_RE.test(cleanPhone)) {
    return res.status(400).json({
      error: 'Please enter a valid phone number with country code, e.g. +91 98882 94440.',
    });
  }

  const roleTable = kind === 'maker' ? 'vendors' : 'couples';

  // 2. Existing user? (WA-onboarded, or a returning signer). Confirm the role
  //    row matches; if it exists for the OTHER role, reject.
  const { data: existingUser, error: lookupErr } = await supabase
    .from('users').select('id, name').eq('phone', cleanPhone).maybeSingle();

  if (lookupErr) {
    console.error('[register] users lookup error:', lookupErr.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  let userId;
  let alreadyProvisioned = false;

  if (existingUser) {
    userId = existingUser.id;

    // Does a role row already exist for this user (either kind)?
    const { data: vRow } = await supabase.from('vendors').select('id').eq('user_id', userId).maybeSingle();
    const { data: cRow } = await supabase.from('couples').select('id').eq('user_id', userId).maybeSingle();

    const hasThis  = roleTable === 'vendors' ? vRow : cRow;
    const hasOther = roleTable === 'vendors' ? cRow : vRow;

    if (hasOther && !hasThis) {
      return res.status(409).json({
        error: `This number is already registered as a ${kind === 'maker' ? 'Dreamer' : 'Maker'} account.`,
        reason: 'wrong_role',
      });
    }

    if (hasThis) {
      alreadyProvisioned = true;
    } else {
      // user exists but no role row yet — create it.
      const { error: roleErr } = await supabase
        .from(roleTable).insert({ user_id: userId, onboarding_state: 'new' });
      if (roleErr) {
        console.error(`[register] ${roleTable} insert error:`, roleErr.message);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
      }
    }

    // Backfill name if we have one and the user had none.
    if (cleanName && !existingUser.name) {
      await supabase.from('users').update({ name: cleanName }).eq('id', userId);
    }

    console.log(`[register] ${cleanPhone} existing user — kind=${kind} already_provisioned=${alreadyProvisioned}`);
  } else {
    // 3. Fresh signup: create users row, then the role row.
    const { data: newUser, error: userErr } = await supabase
      .from('users').insert({ phone: cleanPhone, name: cleanName }).select('id').single();
    if (userErr) {
      console.error('[register] users insert error:', userErr.message);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
    userId = newUser.id;

    const { error: roleErr } = await supabase
      .from(roleTable).insert({ user_id: userId, onboarding_state: 'new' });
    if (roleErr) {
      // Best-effort rollback of the orphan users row (no FK dependents yet).
      await supabase.from('users').delete().eq('id', userId);
      console.error(`[register] ${roleTable} insert error:`, roleErr.message);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }

    console.log(`[register] new ${kind} created user=${userId}`);
  }

  return res.json({ ok: true, user_id: userId, kind, already_provisioned: alreadyProvisioned });
});

module.exports = router;
