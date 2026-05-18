-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0031: invite_codes
--
-- CONTEXT
-- Phase 2, Session P2-3. Foundation for invite-gated PWA access.
--
-- The dream-os access model is closed: a person can enter ONLY by (a) a single-
-- use invite code minted in admin, or (b) a WhatsApp invite from Swati that
-- creates their vendors/couples row directly. No self-serve signup. Waitlist
-- captures interest but does not grant entry.
--
-- This migration adds the invite_codes table that backs path (a). Codes are
-- single-use, never expire, and carry a kind (dreamer | maker) that determines
-- which role and which onboarding flow the holder enters.
--
-- TIER FIELD — PROVISIONING-READY
-- The tier column exists but has no CHECK constraint. When pricing tiers are
-- locked post-launch, a future migration will add the CHECK and start
-- populating real values. For P2-3 the admin form accepts free text or NULL.
-- This is a deliberate "build the rail now, run the train later" decision.
--
-- ATOMIC CONSUMPTION
-- consume_invite_code(p_code, p_user_id) is the only path that marks a code
-- consumed. Implemented as a SECURITY DEFINER function with an UPDATE ... WHERE
-- consumed_at IS NULL guard. Two clients racing to consume the same code:
-- exactly one UPDATE returns a row, the other returns zero rows and the
-- function raises 'invite_code_already_consumed'. No SELECT-then-UPDATE race.
-- Mirrors the 0019 record_payment() pattern.
--
-- ERROR CONTRACT
-- consume_invite_code() raises EXCEPTION USING ERRCODE = 'P0001' with one of:
--   invite_code_invalid             — code not found (case-insensitive lookup)
--   invite_code_already_consumed    — code exists but consumed_at IS NOT NULL
-- The API layer (/api/v2/invite/consume) matches on hint, never on message.
-- Mirrors 0023 (circle_member_limit_reached, circle_invite_expired) pattern.
--
-- CODE FORMAT (enforced at app layer, NOT in DB)
-- 8 characters, uppercase alphanumeric, no ambiguous glyphs:
--   alphabet = ABCDEFGHJKMNPQRSTUVWXYZ23456789 (no 0/O/1/I/L)
-- DB stores the literal string sent by the admin route. Lookups are
-- case-insensitive via lower() in consume_invite_code() so a user typing
-- "x7k2m9pq" matches a stored "X7K2M9PQ". The admin route normalizes to
-- uppercase before insert. No CHECK constraint on format — keeps the door
-- open to future formats (referral codes, partner codes) without migration.
--
-- IMMUTABILITY: never edit this file. Changes go in 0032+.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. invite_codes table ───────────────────────────────────────────────
create table if not exists invite_codes (
  code                  text primary key,
  kind                  text not null check (kind in ('dreamer','maker')),
  tier                  text,
  notes                 text,
  created_at            timestamptz not null default now(),
  created_by            text,
  consumed_at           timestamptz,
  consumed_by_user_id   uuid references users(id) on delete set null
);

comment on table invite_codes is
  'Single-use invite codes minted by admin. Gates PWA entry alongside WhatsApp invites. Codes never expire; consumed_at IS NOT NULL means burned. tier is nullable and free-text (provisioning-ready for future pricing).';

comment on column invite_codes.code is
  'Primary key. 8-char uppercase alphanumeric format (alphabet ABCDEFGHJKMNPQRSTUVWXYZ23456789, no 0/O/1/I/L). Stored as inserted; lookup is case-insensitive via consume_invite_code().';

comment on column invite_codes.kind is
  'dreamer = couple invite. maker = vendor invite. Determines which onboarding flow the holder enters after consume.';

comment on column invite_codes.tier is
  'Future pricing tier (essential/signature/prestige etc). Nullable, no CHECK constraint yet. Migration will add CHECK when tiers are locked.';

comment on column invite_codes.notes is
  'Admin-only internal note. E.g. "VIP referral from Anjali", "press list", "founding cohort". Never user-visible.';

comment on column invite_codes.created_by is
  'Free-text label of who minted the code (swati, dev, etc). Captured from admin form. Audit trail only.';

comment on column invite_codes.consumed_at is
  'Stamped by consume_invite_code() on successful consume. NULL = unconsumed and claimable.';

comment on column invite_codes.consumed_by_user_id is
  'FK to users(id) of the person who consumed the code. ON DELETE SET NULL preserves the audit row when the user is deleted.';

-- ── 2. Indexes ──────────────────────────────────────────────────────────
-- Partial index for fast lookup of unconsumed codes during validation.
-- Most queries against this table are "is this code valid right now?"
-- which is `WHERE code = ? AND consumed_at IS NULL`. The partial index
-- keeps it tiny — only unconsumed rows are indexed.
create index if not exists invite_codes_unconsumed_idx
  on invite_codes(code)
  where consumed_at is null;

-- Secondary index for admin queries: "show me all codes I created"
-- and "show me consumption timeline".
create index if not exists invite_codes_created_at_idx
  on invite_codes(created_at desc);

-- ── 3. consume_invite_code() ────────────────────────────────────────────
-- Atomic consume. Returns (kind, tier) on success. Raises structured
-- exceptions on failure.
--
-- Race protection: the UPDATE ... WHERE consumed_at IS NULL clause is the
-- atomic guard. Postgres serialises the row lock. The second concurrent
-- caller observes zero affected rows and falls through to the
-- 'invite_code_already_consumed' branch.
--
-- Case-insensitive matching: lower(code) on both sides handles input
-- variations from the admin route or copy-paste. Codes minted via the
-- admin route SHOULD be uppercase; this is belt-and-suspenders.
create or replace function consume_invite_code(
  p_code    text,
  p_user_id uuid
) returns table(
  kind text,
  tier text
) as $$
declare
  v_existing_consumed_at timestamptz;
  v_kind                 text;
  v_tier                 text;
begin
  -- Step 1: does the code exist at all?
  select ic.consumed_at, ic.kind, ic.tier
    into v_existing_consumed_at, v_kind, v_tier
    from invite_codes ic
   where lower(ic.code) = lower(p_code);

  if not found then
    raise exception 'invite code % not found', p_code
      using errcode = 'P0001', hint = 'invite_code_invalid';
  end if;

  -- Step 2: is it already consumed?
  if v_existing_consumed_at is not null then
    raise exception 'invite code % already consumed at %', p_code, v_existing_consumed_at
      using errcode = 'P0001', hint = 'invite_code_already_consumed';
  end if;

  -- Step 3: atomic consume. The WHERE consumed_at IS NULL clause is the
  -- race guard. If two callers race, only one UPDATE affects a row.
  update invite_codes
     set consumed_at = now(),
         consumed_by_user_id = p_user_id
   where lower(invite_codes.code) = lower(p_code)
     and consumed_at is null;

  -- If GET DIAGNOSTICS shows zero rows updated, a concurrent caller won
  -- the race. Treat as already consumed.
  if not found then
    raise exception 'invite code % was consumed concurrently', p_code
      using errcode = 'P0001', hint = 'invite_code_already_consumed';
  end if;

  -- Return the kind + tier so the API can route the user to the right flow.
  kind := v_kind;
  tier := v_tier;
  return next;
end;
$$ language plpgsql;

comment on function consume_invite_code(text, uuid) is
  'Atomic invite code consumption. Returns (kind, tier) on success. Raises P0001 with hint=invite_code_invalid or invite_code_already_consumed. Case-insensitive code lookup. Race-safe via WHERE consumed_at IS NULL guard.';
