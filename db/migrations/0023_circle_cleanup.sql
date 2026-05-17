-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0023: circle cleanup
--
-- CONTEXT
-- Phase 1, Session P1-1. Three things accumulated as known debt by the end of
-- B3 that this migration clears in one pass:
--
--   1. Circle invite tokens never expire. A token issued today is still claimable
--      a year later. This is a security and hygiene issue: brides revoke trust,
--      members change phones, partners change relationship. 7-day expiry mirrors
--      typical magic-link conventions and is short enough to be safe, long enough
--      to be friendly.
--
--   2. circle_sessions.summary_message_id is a bare uuid with no foreign key.
--      It points at messages(id) by convention only. If a message row is deleted
--      (admin cleanup, future GDPR delete), the session row carries a dangling
--      pointer. Add the FK with ON DELETE SET NULL — preserve the session, drop
--      the pointer.
--
--   3. The "M2" race from the B2 audit: two webhook handlers fire concurrently
--      for the same circle member during an idle gap. Both see no alive session,
--      both INSERT a new row, both succeed. Result: two open sessions, the
--      bride's summary pipeline picks one of them, the other's activity rows
--      orphan. Fix: a unique partial index on
--         (circle_member_id) WHERE summarized_to_bride = false
--      that forces the second insert to fail with a unique-violation. The app
--      code (brideIndex.js) is updated separately to catch that violation and
--      re-fetch the existing open session instead of erroring.
--
-- BONUS — M5 fix
-- The existing invite_circle_member() function raises a bare-string exception
-- 'circle_member_limit_reached'. Application code parses this by string-contains
-- which is brittle. This migration replaces the function with a version that
-- raises USING ERRCODE = 'P0001' (a stable PL/pgSQL custom errcode) so the app
-- can match on error.code instead of error.message text.
--
-- The function is also updated to set circle_members.expires_at on insert.
-- claim_circle_invite() is updated to reject expired pending invites with a
-- new structured exception 'circle_invite_expired'.
--
-- IMMUTABILITY: never edit this file. Changes go in 0024+.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. circle_members.expires_at column ─────────────────────────────────
-- Nullable. Populated on insert by invite_circle_member(). Existing rows
-- (already issued before this migration) get null and remain claimable;
-- claim_circle_invite() treats null as "no expiry" for backwards compatibility.
-- All NEW invites from this migration forward will have expires_at set.
alter table circle_members
  add column if not exists expires_at timestamptz;

comment on column circle_members.expires_at is
  '7-day expiry on pending invite tokens. Null for legacy rows (issued before migration 0023) — those remain claimable. claim_circle_invite() rejects expired non-null values.';

-- ── 2. circle_sessions.summary_message_id → FK to messages(id) ──────────
-- Existing column from 0017. Currently bare uuid with no referential integrity.
-- Add the FK with ON DELETE SET NULL. If any orphaned data exists today
-- (summary_message_id pointing to a deleted/nonexistent message), the
-- constraint addition would fail. Pre-clean by nulling those out first.
update circle_sessions cs
   set summary_message_id = null
 where cs.summary_message_id is not null
   and not exists (select 1 from messages m where m.id = cs.summary_message_id);

alter table circle_sessions
  add constraint circle_sessions_summary_message_id_fk
  foreign key (summary_message_id)
  references messages(id)
  on delete set null;

-- ── 3. circle_sessions unique partial index (M2 race fix) ───────────────
-- Ensures at most one unsummarized session per circle_member_id. Two concurrent
-- INSERTs racing through brideIndex.js will resolve as: one succeeds, the other
-- raises 23505 (unique_violation), the app re-queries for the now-existing
-- alive session.
--
-- Pre-clean: if any member already has multiple open sessions in production
-- (the very bug we are fixing), mark all but the most recently active one
-- as summarized so the index can be created. This is safer than failing the
-- migration. The "lost" sessions are not deleted — they remain queryable
-- for diagnosis. They just no longer block new sessions or get re-summarized.
update circle_sessions cs
   set summarized_to_bride = true,
       summarized_at = coalesce(summarized_at, now())
 where cs.summarized_to_bride = false
   and exists (
     select 1
       from circle_sessions cs2
      where cs2.circle_member_id = cs.circle_member_id
        and cs2.summarized_to_bride = false
        and cs2.last_activity_at > cs.last_activity_at
   );

create unique index if not exists circle_sessions_one_open_per_member_unique
  on circle_sessions(circle_member_id)
  where summarized_to_bride = false;

-- ── 4. invite_circle_member() — rewritten ───────────────────────────────
-- Changes from 0016:
--   a. Sets expires_at on insert (now() + 7 days)
--   b. Raises EXCEPTION USING ERRCODE = 'P0001' for the cap error
--   c. Keeps the same return shape (id, invite_token, wa_me_link)
--   d. Keeps the same token alphabet and 6-char length
create or replace function invite_circle_member(
  p_couple_id    uuid,
  p_invitee_name text,
  p_role         text
) returns table(id uuid, invite_token text, wa_me_link text) as $$
declare
  v_alphabet    text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_token       text;
  v_collision   boolean;
  v_existing    int;
  v_member_cap  int := 3;
  v_member_id   uuid;
  v_expires_at  timestamptz;
begin
  -- Validate role
  if p_role not in ('partner', 'family', 'inner_circle') then
    raise exception 'role must be partner / family / inner_circle'
      using errcode = 'P0001', hint = 'invalid_circle_role';
  end if;

  -- Validate couple
  if not exists (select 1 from couples where couples.id = p_couple_id) then
    raise exception 'couple % not found', p_couple_id
      using errcode = 'P0001', hint = 'couple_not_found';
  end if;

  -- Enforce member cap (pending + active count)
  select count(*) into v_existing
    from circle_members
   where couple_id = p_couple_id
     and status in ('pending', 'active');

  if v_existing >= v_member_cap then
    raise exception 'circle member cap reached for couple %', p_couple_id
      using errcode = 'P0001', hint = 'circle_member_limit_reached';
  end if;

  -- Generate unique token (loop on collision)
  loop
    v_token := 'CIRCLE-' ||
      substr(v_alphabet, 1 + floor(random() * 32)::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * 32)::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * 32)::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * 32)::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * 32)::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * 32)::int, 1);

    select exists(select 1 from circle_members cm where cm.invite_token = v_token)
      into v_collision;
    exit when not v_collision;
  end loop;

  -- 7-day expiry
  v_expires_at := now() + interval '7 days';

  -- Insert pending row
  insert into circle_members (couple_id, invitee_name, role, invite_token, status, expires_at)
  values (p_couple_id, p_invitee_name, p_role, v_token, 'pending', v_expires_at)
  returning circle_members.id into v_member_id;

  -- Return shape
  id := v_member_id;
  invite_token := v_token;
  wa_me_link := 'https://wa.me/14787788550?text=' || v_token;
  return next;
end;
$$ language plpgsql;

-- ── 5. claim_circle_invite() — rewritten ────────────────────────────────
-- Changes from 0016:
--   a. Rejects expired pending invites (expires_at < now()) with
--      structured exception 'circle_invite_expired'
--   b. NULL expires_at remains claimable (legacy invites pre-0023)
--   c. Existing exception 'invite_invalid_or_used' upgraded to use errcode
--   d. Same return shape
create or replace function claim_circle_invite(
  p_token         text,
  p_invitee_phone text
) returns table(
  member_id      uuid,
  couple_id      uuid,
  invitee_name   text,
  bride_name     text,
  member_role    text
) as $$
declare
  v_member_id   uuid;
  v_couple_id   uuid;
  v_name        text;
  v_role        text;
  v_bride       text;
  v_expires_at  timestamptz;
begin
  -- Lookup pending invite
  select cm.id, cm.couple_id, cm.invitee_name, cm.role, cm.expires_at
    into v_member_id, v_couple_id, v_name, v_role, v_expires_at
    from circle_members cm
   where cm.invite_token = p_token
     and cm.status = 'pending';

  if v_member_id is null then
    raise exception 'invite token % is invalid or already used', p_token
      using errcode = 'P0001', hint = 'invite_invalid_or_used';
  end if;

  -- Reject expired (null expires_at = legacy invite, still claimable)
  if v_expires_at is not null and v_expires_at < now() then
    raise exception 'invite token % expired at %', p_token, v_expires_at
      using errcode = 'P0001', hint = 'circle_invite_expired';
  end if;

  -- Flip to active
  update circle_members
     set status = 'active',
         invitee_phone = p_invitee_phone,
         joined_at = now()
   where id = v_member_id;

  -- Lookup bride's name for greeting context
  select u.name into v_bride
    from couples c
    join users u on u.id = c.user_id
   where c.id = v_couple_id;

  -- Append joined activity
  insert into circle_activity
    (couple_id, actor_user_id, actor_name, actor_role,
     activity_type, subject_type, subject_id, payload)
  values
    (v_couple_id, null, v_name, 'circle_member',
     'joined', 'circle_member', v_member_id,
     jsonb_build_object('role', v_role));

  -- Return shape
  member_id    := v_member_id;
  couple_id    := v_couple_id;
  invitee_name := v_name;
  bride_name   := v_bride;
  member_role  := v_role;
  return next;
end;
$$ language plpgsql;
