#!/usr/bin/env python3
# Piece 0 — dream-os — Open phone-OTP registration (invite gate removed).
#
# WHAT THIS DOES (backend only; Twilio/OTP untouched; bride side untouched):
#   1. Writes src/api/register.js — a PUBLIC POST /api/v2/register that creates
#      the users row + the role row (vendors|couples, onboarding_state:'new')
#      WITHOUT an invite code. The existing send-otp -> verify-otp flow then
#      carries the user in exactly as before.
#   2. Mounts it in src/api/router.js (anchor-guarded, idempotent).
#   3. Drops db/clean_piece0.sql — a GUARDED, DRY-RUN-FIRST data clean
#      (wipes invite_codes + your own phone's rows). It does NOT run itself;
#      you run it explicitly in Supabase SQL editor after reading it.
#
# /invite (validate, consume) and consume_invite_code are left DORMANT, untouched.
# No schema change. No ledger change. No bride change.
#
# Idempotent: re-running is safe (skips already-applied edits, overwrites generated files).

import base64, os, sys

ROOT = os.getcwd()

def expect_root():
    if not os.path.isdir(os.path.join(ROOT, "src", "api")):
        print("ERROR: run this from the dream-os repo root (src/api not found). Aborting.")
        sys.exit(1)

# ---------------------------------------------------------------------------
# File 1 (NEW): src/api/register.js
# ---------------------------------------------------------------------------
REGISTER_JS = r"""// src/api/register.js
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
"""

# ---------------------------------------------------------------------------
# File 2 (NEW): db/clean_piece0.sql  (guarded, dry-run first, you run it)
# ---------------------------------------------------------------------------
CLEAN_SQL = r"""-- db/clean_piece0.sql
-- Piece 0 data clean. RUN THIS YOURSELF in the Supabase SQL editor.
-- It does NOT run automatically and the writer never executes it.
--
-- WHAT IT DOES:
--   A. DRY RUN (default): SELECTs the rows it WOULD delete. Deletes nothing.
--   B. APPLY: uncomment the COMMIT block at the bottom to actually delete.
--
-- WHAT IT TOUCHES:
--   * invite_codes        -> wiped (invite system retired)
--   * YOUR OWN phone rows  -> users + vendors/couples + otp_sessions for the
--                             test numbers, so you re-register fresh.
-- WHAT IT NEVER TOUCHES:
--   * demo_* tables, hot_dates, landing_slides, bride/couple data of real users,
--     schema (no DROP/ALTER). Data only.
--
-- >>> EDIT THIS LIST: put your own test phone numbers here (E.164, with +). <<<
--     (Leave it as-is to dry-run nothing on the phone side.)

-- ============================ A. DRY RUN ============================
-- Shows what would go. Safe to run anytime.

with my_phones as (
  select unnest(array[
    -- '+919888294440',   -- <-- uncomment / add your test numbers
    '+0'  -- placeholder so the array is never empty; matches nothing real
  ]) as phone
),
my_users as (
  select u.id, u.phone from users u join my_phones m on u.phone = m.phone
)
select 'invite_codes (all)' as what, count(*) as rows_affected from invite_codes
union all
select 'users (mine)',       count(*) from my_users
union all
select 'vendors (mine)',     count(*) from vendors  where user_id in (select id from my_users)
union all
select 'couples (mine)',     count(*) from couples  where user_id in (select id from my_users)
union all
select 'otp_sessions (mine)',count(*) from otp_sessions where phone in (select phone from my_phones);

-- ============================ B. APPLY ==============================
-- Re-read the dry-run output above. When the counts look right, uncomment
-- the block below and run again to actually delete.
--
-- begin;
--   with my_phones as (
--     select unnest(array[
--       '+919888294440'   -- <-- your test numbers
--     ]) as phone
--   ),
--   my_users as ( select u.id from users u join my_phones m on u.phone = m.phone )
--   -- order matters: child rows first (FKs cascade from users, but be explicit)
--   , del_otp  as ( delete from otp_sessions where phone in (select phone from my_phones) returning 1 )
--   , del_vend as ( delete from vendors where user_id in (select id from my_users) returning 1 )
--   , del_coup as ( delete from couples where user_id in (select id from my_users) returning 1 )
--   , del_user as ( delete from users where id in (select id from my_users) returning 1 )
--   delete from invite_codes returning 1;
-- commit;
"""

# ---------------------------------------------------------------------------
# Edit: mount /register in src/api/router.js (anchor-guarded, idempotent)
# ---------------------------------------------------------------------------
def edit_router():
    path = os.path.join(ROOT, "src", "api", "router.js")
    if not os.path.isfile(path):
        print("SKIP: src/api/router.js not found — cannot mount /register.")
        return
    with open(path, "r", encoding="utf-8") as f:
        src = f.read()

    if "router.use('/register'" in src:
        print("SKIP: /register already mounted in router.js.")
        return

    anchor = "router.use('/invite',             inviteRouter);"
    if anchor not in src:
        print("SKIP: mount anchor (/invite line) not found in router.js — mount /register by hand:")
        print("      router.use('/register', require('./register'));")
        return

    addition = anchor + "\n" + "router.use('/register',           require('./register'));   // public — open phone-OTP signup"
    src = src.replace(anchor, addition, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(src)
    print("OK: mounted /register in src/api/router.js (after /invite).")

def write_file(relpath, content):
    full = os.path.join(ROOT, relpath)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"OK: wrote {relpath}")

def main():
    expect_root()
    write_file(os.path.join("src", "api", "register.js"), REGISTER_JS)
    write_file(os.path.join("db", "clean_piece0.sql"), CLEAN_SQL)
    edit_router()
    print("\nPiece 0 (dream-os) written.")
    print("NOTE: db/clean_piece0.sql is DRY-RUN only until you edit phones + uncomment the APPLY block, then run it in Supabase.")

if __name__ == "__main__":
    main()
