-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0028: pin_auth
--
-- CONTEXT
-- Phase 2, Session P2-3. Foundation for the PWA login sequence locked in
-- ROADMAP_FINAL.md. Two concerns covered in one pass:
--
--   1. 4-digit PIN auth for PWA login. Both vendors and couples need a PIN
--      that gates daily re-entry into the PWA. New users set a PIN once
--      after WhatsApp OTP verification. Returning users sign in with
--      phone + PIN — no OTP. PIN is bcrypt-hashed, never stored plaintext.
--      pin_hash nullable: NULL means PIN not yet set (new WhatsApp-onboarded
--      user who has not yet entered the PWA).
--
--   2. Lockout protection. A 4-digit PIN has 10000 combinations — trivial
--      to brute-force without rate limiting. pin_failed_attempts tracks
--      consecutive failures, pin_locked_until stamps a lockout window.
--      Policy locked in P2-3: 5 failed attempts in rolling 15 minutes →
--      locked for 15 minutes. Lockout reset by successful PIN OR by
--      successful OTP reset (Forgot PIN flow).
--
--   3. Hard role XOR. A given phone (and therefore a given users.id) can
--      be EITHER a vendor OR a couple, never both. Login flow needs this
--      guarantee end-to-end: a Dreamer invite code presented with a phone
--      already in vendors must be rejected, and vice versa. users.phone is
--      already UNIQUE (0001); vendors.user_id and couples.user_id are each
--      individually UNIQUE (0001 + 0015). But nothing today prevents a
--      user_id from appearing in BOTH tables. This migration installs a
--      BEFORE INSERT trigger on each table that rejects the insert if the
--      same user_id already exists in the opposite role.
--
-- PRE-CONDITION VERIFIED (2026-05-18 18:35 IST)
--   SELECT v.user_id FROM vendors v JOIN couples c ON c.user_id = v.user_id
--   returned 0 rows. No existing violations. Safe to install trigger.
--
-- ROLLOUT
--   - All three new columns are additive and backwards-compatible.
--     pin_hash and pin_locked_until are nullable.
--     pin_failed_attempts defaults to 0.
--   - Existing vendors + couples rows: pin_hash = NULL, pin_failed_attempts = 0,
--     pin_locked_until = NULL. They go through "first PIN setup" the first
--     time they open the PWA (Sign in path → OTP → set PIN).
--   - XOR triggers fire only on INSERT, not on existing rows. UPDATE of
--     user_id is not a real path (FK + UNIQUE makes it pointless) but a
--     malicious or accidental UPDATE that violates XOR would NOT be caught
--     by these triggers — only INSERTs are gated. This is acceptable: all
--     legitimate role assignment goes through INSERT.
--
-- ERROR CONTRACT
--   XOR violations raise EXCEPTION USING ERRCODE = 'P0001' and one of two
--   hints, matched verbatim by the API layer (/api/v2/invite/consume +
--   /api/v2/{vendor|couple}/auth/send-otp):
--     phone_already_registered_as_couple   (vendors INSERT blocked)
--     phone_already_registered_as_vendor   (couples INSERT blocked)
--   App code matches on hint, never on message text. Mirrors 0023 pattern
--   (circle_member_limit_reached, circle_invite_expired, etc).
--
-- IMMUTABILITY: never edit this file. Changes go in 0029+.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. vendors: PIN auth columns ────────────────────────────────────────
alter table vendors
  add column if not exists pin_hash text;

alter table vendors
  add column if not exists pin_failed_attempts integer not null default 0;

alter table vendors
  add column if not exists pin_locked_until timestamptz;

comment on column vendors.pin_hash is
  'bcrypt hash of vendor PWA 4-digit PIN. NULL = PIN not yet set (set after WhatsApp OTP on first PWA login). Plaintext PIN never stored.';

comment on column vendors.pin_failed_attempts is
  'Consecutive failed PIN attempts. Resets to 0 on successful PIN or successful OTP reset. Counter for lockout policy: 5 failures in rolling 15 min triggers lock.';

comment on column vendors.pin_locked_until is
  'Lockout window end. NULL = not locked. Set by API after 5 failed attempts to now() + 15 min. Cleared on OTP-based PIN reset or successful PIN entry after window passes.';

-- ── 2. couples: PIN auth columns ────────────────────────────────────────
alter table couples
  add column if not exists pin_hash text;

alter table couples
  add column if not exists pin_failed_attempts integer not null default 0;

alter table couples
  add column if not exists pin_locked_until timestamptz;

comment on column couples.pin_hash is
  'bcrypt hash of couple PWA 4-digit PIN. NULL = PIN not yet set (set after WhatsApp OTP on first PWA login). Plaintext PIN never stored.';

comment on column couples.pin_failed_attempts is
  'Consecutive failed PIN attempts. Resets to 0 on successful PIN or successful OTP reset. Counter for lockout policy: 5 failures in rolling 15 min triggers lock.';

comment on column couples.pin_locked_until is
  'Lockout window end. NULL = not locked. Set by API after 5 failed attempts to now() + 15 min. Cleared on OTP-based PIN reset or successful PIN entry after window passes.';

-- ── 3. enforce_role_xor() — guards INSERT on vendors and couples ────────
-- Single function, dispatched via TG_TABLE_NAME. Raises structured exception
-- (errcode P0001 + hint) so the API layer can produce a clean user-facing
-- error: "This number is already registered as a [Dreamer|Maker]. Reach out
-- if you think this is wrong."
create or replace function enforce_role_xor() returns trigger as $$
begin
  if TG_TABLE_NAME = 'vendors' then
    if exists (select 1 from couples where couples.user_id = NEW.user_id) then
      raise exception 'user_id % already registered as couple', NEW.user_id
        using errcode = 'P0001', hint = 'phone_already_registered_as_couple';
    end if;
  elsif TG_TABLE_NAME = 'couples' then
    if exists (select 1 from vendors where vendors.user_id = NEW.user_id) then
      raise exception 'user_id % already registered as vendor', NEW.user_id
        using errcode = 'P0001', hint = 'phone_already_registered_as_vendor';
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- ── 4. Triggers ─────────────────────────────────────────────────────────
-- Idempotent: drop-if-exists then create. Safe to re-run the migration.
drop trigger if exists vendors_enforce_role_xor on vendors;
create trigger vendors_enforce_role_xor
  before insert on vendors
  for each row execute function enforce_role_xor();

drop trigger if exists couples_enforce_role_xor on couples;
create trigger couples_enforce_role_xor
  before insert on couples
  for each row execute function enforce_role_xor();
