// src/api/invite.js
// POST /api/v2/invite/validate  — check code valid + unconsumed, kind matches
// POST /api/v2/invite/consume   — atomic consume + users row creation
//
// Both endpoints are public (no auth). Called from the landing page before
// the user has any session.
//
// VALIDATE
//   Receives { code, kind }. Looks up invite_codes case-insensitively.
//   Does NOT consume. Returns { valid: true, kind } or { valid: false, reason }.
//   All lookup results return HTTP 200 — returning 404 for a missing code
//   leaks information to a brute-force attacker. 200 + valid:false is enough
//   signal for the frontend.
//
//   Reasons:
//     invite_code_invalid           — code not found
//     invite_code_already_consumed  — found but consumed_at IS NOT NULL
//     invite_code_wrong_kind        — found, unconsumed, but kind mismatch
//
// CONSUME
//   Receives { code, kind, name, phone }.
//   Calls consume_invite_code(code, user_id) DB function (0031) which is
//   atomic and race-safe. Before calling it, creates the users row so we
//   have a user_id. If consume fails (race), the users row is rolled back
//   via delete (best-effort — see note below).
//
//   On success returns { ok: true, user_id, kind } so the PWA login flow
//   can continue to send-otp with the phone it already has.
//
//   Phone contract: E.164 with leading +. Same as waitlist endpoint.
//   name: raw, as typed. Trimmed before insert.
//
//   Note on rollback: Postgres does not give us cross-request transactions
//   here. If consume_invite_code() fails after users INSERT, we delete the
//   users row manually. This is best-effort — a crash between the two calls
//   would leave an orphan users row with no vendors/couples row. Orphan rows
//   are harmless (no FK dependents yet) and can be cleaned by admin. The XOR
//   trigger on vendors/couples prevents any functional damage.

'use strict';

const express = require('express');
const router  = express.Router();

const PHONE_RE = /^\+[0-9]{8,15}$/;

// ── POST /validate ───────────────────────────────────────────────────────────
router.post('/validate', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { code, kind } = req.body;

  // 1. Required fields
  if (!code || !kind) {
    return res.status(400).json({ error: 'code and kind are required.' });
  }
  if (!['dreamer', 'maker'].includes(kind)) {
    return res.status(400).json({ error: 'kind must be dreamer or maker.' });
  }

  const cleanCode = (code || '').trim().toUpperCase();

  // 2. Lookup — case-insensitive via lower() both sides
  const { data: row, error } = await supabase
    .from('invite_codes')
    .select('code, kind, consumed_at')
    .ilike('code', cleanCode)
    .maybeSingle();

  if (error) {
    console.error('[invite:validate] lookup error:', error.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  // 3. Not found
  if (!row) {
    console.log(`[invite:validate] not found: ${cleanCode}`);
    return res.json({ valid: false, reason: 'invite_code_invalid' });
  }

  // 4. Already consumed
  if (row.consumed_at) {
    console.log(`[invite:validate] already consumed: ${cleanCode}`);
    return res.json({ valid: false, reason: 'invite_code_already_consumed' });
  }

  // 5. Kind mismatch
  if (row.kind !== kind) {
    console.log(`[invite:validate] kind mismatch: code=${cleanCode} code_kind=${row.kind} requested_kind=${kind}`);
    return res.json({ valid: false, reason: 'invite_code_wrong_kind' });
  }

  // 6. Valid
  console.log(`[invite:validate] valid: ${cleanCode} kind=${kind}`);
  return res.json({ valid: true, kind });
});

// ── POST /consume ────────────────────────────────────────────────────────────
router.post('/consume', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { code, kind, name, phone } = req.body;

  // 1. Required fields
  if (!code || !kind || !phone) {
    return res.status(400).json({ error: 'code, kind and phone are required.' });
  }
  if (!['dreamer', 'maker'].includes(kind)) {
    return res.status(400).json({ error: 'kind must be dreamer or maker.' });
  }

  const cleanCode  = (code || '').trim().toUpperCase();
  const cleanName  = (name || '').trim();
  const cleanPhone = (phone || '').trim().replace(/\s+/g, '');

  if (!PHONE_RE.test(cleanPhone)) {
    return res.status(400).json({
      error: 'Please enter a valid phone number with country code, e.g. +91 98882 94440.',
    });
  }

  // 2. Check if phone already has a users row (WA-onboarded or pre-provisioned by admin).
  //    If so: confirm correct role exists, mark code consumed, return already_provisioned.
  //    This lets WA-onboarded vendors sign in via web invite without friction.
  const { data: existingUser } = await supabase
    .from('users').select('id').eq('phone', cleanPhone).maybeSingle();

  let userId;
  let alreadyProvisioned = false;

  if (existingUser) {
    userId = existingUser.id;
    const roleTable = kind === 'maker' ? 'vendors' : 'couples';
    const { data: roleRow } = await supabase
      .from(roleTable).select('id').eq('user_id', userId).maybeSingle();
    if (!roleRow) {
      return res.status(409).json({
        error: `This number is registered as a ${kind === 'maker' ? 'Dreamer' : 'Maker'} account.`,
        reason: 'wrong_role',
      });
    }
    alreadyProvisioned = true;
    if (cleanName) {
      const { data: uRow } = await supabase.from('users').select('name').eq('id', userId).maybeSingle();
      if (!uRow?.name) await supabase.from('users').update({ name: cleanName }).eq('id', userId);
    }
    console.log(`[invite:consume] ${cleanPhone} already provisioned as ${kind} — consuming code only`);
  } else {
    // 3. Create users row
    const { data: newUser, error: userError } = await supabase
      .from('users').insert({ phone: cleanPhone, name: cleanName }).select('id').single();
    if (userError) {
      console.error('[invite:consume] users insert error:', userError.message);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
    userId = newUser.id;
  }

  // 4. Atomic consume via DB function
  const { data: consumeResult, error: consumeError } = await supabase
    .rpc('consume_invite_code', { p_code: cleanCode, p_user_id: userId });

  if (consumeError) {
    if (!alreadyProvisioned) await supabase.from('users').delete().eq('id', userId);
    const hint = consumeError.hint || '';
    if (hint === 'invite_code_invalid')
      return res.status(400).json({ error: 'Invite code not found.', reason: hint });
    if (hint === 'invite_code_already_consumed') {
      if (alreadyProvisioned)
        return res.json({ ok: true, user_id: userId, kind, already_provisioned: true });
      return res.status(409).json({ error: 'This invite code has already been used.', reason: hint });
    }
    console.error('[invite:consume] unexpected error:', consumeError.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  const result = consumeResult?.[0];
  const resultKind = result?.kind || kind;

  // 5. Kind mismatch guard
  if (result && result.kind !== kind) {
    if (!alreadyProvisioned) {
      await supabase.from('invite_codes').update({ consumed_at: null, consumed_by_user_id: null }).eq('code', cleanCode);
      await supabase.from('users').delete().eq('id', userId);
    }
    return res.status(400).json({ error: 'This invite code is for a different role.', reason: 'invite_code_wrong_kind' });
  }

  console.log(`[invite:consume] ok code=${cleanCode} user=${userId} kind=${resultKind} already_provisioned=${alreadyProvisioned}`);
  return res.json({ ok: true, user_id: userId, kind: resultKind, already_provisioned: alreadyProvisioned });
});

module.exports = router;
