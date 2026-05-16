-- 0015_pronouns_and_dedup.sql
-- Session B1 follow-up: add pronouns to users + fix duplicate-invite bug.
--
-- WHAT THIS ADDS
--   users.pronouns                     — text column, CHECK ('she','he'), nullable
--   couples.user_id unique constraint  — prevents duplicate invites for same user
--   invite_couple()                    — updated signature: now takes p_pronouns text
--
-- BRIDE SIDE BEHAVIOR
--   Admin invite form requires pronouns. Stored on the users row.
--   Bride agent reads it from dynamic context. Replaces gendered defaults
--   (e.g. "her wedding") with pronoun-aware phrasing.
--
-- VENDOR SIDE — UNCHANGED
--   The pronouns column exists on users but vendor admin and vendor agent
--   don't read or write it yet. Vendor parity is a Session 9 convergence
--   item — see HANDOVER_BRIDE.md.
--
-- IMMUTABILITY: never edit this file. Changes go in 0016+.

-- ── users: pronouns column ──────────────────────────────────────────
alter table users
  add column if not exists pronouns text;

-- CHECK as separate alter so the "if not exists" on column add is safe
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'users_pronouns_check'
      and conrelid = 'users'::regclass
  ) then
    alter table users
      add constraint users_pronouns_check check (pronouns in ('she','he'));
  end if;
end$$;

comment on column users.pronouns is
  'Pronouns: she or he. Set at invite time. Bride agent reads this to address the user correctly. Vendor side reads to be added at Session 9 convergence.';

-- ── couples: prevent duplicate invites for same user ────────────────
-- Bug discovered B1: invite_couple() could create multiple couples rows
-- for the same user_id because there was no unique constraint.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'couples_user_id_unique'
      and conrelid = 'couples'::regclass
  ) then
    alter table couples
      add constraint couples_user_id_unique unique (user_id);
  end if;
end$$;

-- ── invite_couple(): updated signature ──────────────────────────────
-- Old signature (will be dropped):  invite_couple(p_phone text, p_name text)
-- New signature:                    invite_couple(p_phone text, p_name text, p_pronouns text)
--
-- The function now upserts the user with the pronouns value, then ensures
-- exactly one couples row exists for that user (idempotent — repeated calls
-- with the same phone return the existing couple_id, never duplicate).

drop function if exists invite_couple(text, text);

create or replace function invite_couple(p_phone text, p_name text, p_pronouns text)
returns uuid as $$
declare
  v_user_id   uuid;
  v_couple_id uuid;
begin
  -- Validate pronouns
  if p_pronouns is null or p_pronouns not in ('she','he') then
    raise exception 'pronouns must be she or he';
  end if;

  -- Upsert user (creates if new, updates name+pronouns if existing)
  insert into users (phone, name, pronouns)
  values (p_phone, p_name, p_pronouns)
  on conflict (phone) do update
    set name       = excluded.name,
        pronouns   = excluded.pronouns,
        updated_at = now()
  returning id into v_user_id;

  -- Idempotent couples row — relies on couples_user_id_unique constraint
  insert into couples (user_id, onboarding_state)
  values (v_user_id, 'new')
  on conflict (user_id) do nothing
  returning id into v_couple_id;

  -- If the insert was skipped (couple already exists), look it up
  if v_couple_id is null then
    select id into v_couple_id from couples where user_id = v_user_id;
  end if;

  -- Ensure couple_state row exists
  insert into couple_state (couple_id)
  values (v_couple_id)
  on conflict (couple_id) do nothing;

  return v_couple_id;
end;
$$ language plpgsql;
