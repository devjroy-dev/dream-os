-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0033: otp_sessions
--
-- CONTEXT
-- Phase 2, Session P2-3. Transient OTP state store for PWA login flow.
--
-- When a user requests a WhatsApp OTP (send-otp endpoint), the API generates
-- a 6-digit code, sends it via Twilio, and needs to verify it 30-120 seconds
-- later when the user types it back (verify-otp endpoint). This table holds
-- the bcrypt-hashed OTP between those two calls.
--
-- Design decisions:
--
--   BCRYPT HASH, NOT PLAINTEXT
--   The OTP is hashed before storage. Even if the DB is compromised, raw
--   OTPs are not exposed. Same pattern as PIN storage in 0028. The 6-digit
--   code space (000000-999999) is small enough that a leaked hash is
--   technically brute-forceable, but the 5-minute TTL and single-use
--   deletion make this a non-issue in practice.
--
--   PHONE AS KEY, NOT user_id
--   OTPs are requested before the user is fully authenticated. On the
--   "Sign in" path (existing WhatsApp user, first PWA login), we know the
--   phone but the user may not have a session yet. Using phone as the
--   lookup key keeps the flow symmetric across all paths.
--   One row per phone — upsert on send-otp overwrites any prior pending OTP.
--
--   PURPOSE COLUMN
--   Distinguishes login OTPs from forgot-pin OTPs at the verify step.
--   The API matches purpose at verify time to prevent a login OTP from
--   being accepted as a pin-reset OTP or vice versa.
--   Values: 'login' | 'reset'
--
--   TTL — 5 MINUTES
--   expires_at set to now() + 5 minutes on insert/upsert. The verify-otp
--   endpoint rejects expired rows. A cron cleanup is not needed at
--   founding-cohort scale — the verify endpoint deletes the row on success,
--   and expired rows are harmless (just ignored on next lookup). If volume
--   grows, add a pg_cron job to delete WHERE expires_at < now().
--
--   SINGLE-USE
--   The verify-otp endpoint deletes the row immediately on successful
--   verification. A second verify call for the same phone finds no row
--   and returns 'otp_invalid'.
--
--   NO FK TO users
--   Intentional. On the invite-code path, the users row is created by
--   /invite/consume BEFORE send-otp is called. On the sign-in path,
--   the users row already exists. Either way, the FK would be valid.
--   But on any error path, we want to be able to insert an otp_sessions
--   row even if the users row doesn't exist yet (defensive). Keeping it
--   FK-free avoids a class of ordering bugs.
--
-- IMMUTABILITY: never edit this file. Changes go in 0034+.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. otp_sessions table ───────────────────────────────────────────────
create table if not exists otp_sessions (
  phone       text primary key,
  otp_hash    text not null,
  purpose     text not null check (purpose in ('login','reset')),
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

comment on table otp_sessions is
  'Transient OTP state for PWA login. One row per phone. Upserted on send-otp, deleted on successful verify-otp. Rows expire after 5 minutes. No FK to users — intentional, see migration header.';

comment on column otp_sessions.phone is
  'E.164 phone number. Primary key — one pending OTP per phone at any time. A new send-otp request overwrites the prior row via upsert.';

comment on column otp_sessions.otp_hash is
  'bcrypt hash of the 6-digit OTP. Never store plaintext. verify-otp compares candidate against this hash.';

comment on column otp_sessions.purpose is
  'login = new user first PIN setup or existing user sign-in. reset = forgot-pin flow. Matched at verify time to prevent cross-purpose reuse.';

comment on column otp_sessions.expires_at is
  '5 minutes from created_at. verify-otp rejects rows where expires_at < now(). No automatic cleanup needed at founding-cohort scale.';

-- ── 2. Index ────────────────────────────────────────────────────────────
-- phone is already the PK (implicit index). Add an index on expires_at
-- for future cleanup queries (SELECT WHERE expires_at < now()).
create index if not exists otp_sessions_expires_at_idx
  on otp_sessions(expires_at);
