-- 0016_muse_and_circle.sql
-- Session B2: Muse mood board + Circle members + circle activity feed
-- Pattern: muse_saves is couple-scoped (mirrors leads' vendor-scoping pattern).
--          circle_members is couple-scoped, token-gated invite.
--          circle_activity is append-only, polymorphic-subject (subject_id has
--          no FK, subject_type is the discriminator).
--
-- WHAT THIS ADDS
--   muse_saves         — bride's mood board, one row per saved image/link/vendor.
--                        save_number is monotonic per couple_id (UNIQUE).
--                        source_type discriminates image / link / vendor saves.
--                        aesthetic_tags jsonb stores values from brideAesthetics.js.
--                        vendor_id nullable, populated at Session 9 for Discover saves.
--   circle_members     — bride's circle. Token-gated invite. Max 3 per bride at B2.
--   circle_activity    — append-only feed of joins, saves, comments, reactions.
--                        surfaced_to_bride boolean tracks BFF-voice summary state.
--   conversations.kind widened to include 'circle_thread' for circle member threads.
--   invite_circle_member()  — generates CIRCLE-XXXXXX token, enforces 3-member cap.
--   claim_circle_invite()   — flips invite to active on first message, writes activity.
--
-- BILLING NOTE
--   Circle member messages live in conversations with kind='circle_thread' and
--   couple_id = bride's. messages.cost_inr therefore aggregates to the bride's
--   couple_id automatically. No new billing infrastructure needed.
--
-- DAILY MESSAGE CAP
--   B2 enforces 5 inbound messages per circle member per day (IST). Enforced in
--   brideIndex.js via a COUNT query on messages, not at the DB level. Cap value
--   lives in code as a constant; tier-aware caps will replace it when tiers ship.
--
-- IMMUTABILITY: never edit this file. Changes go in 0017+.

-- ── muse_saves: bride's mood board ──────────────────────────────────
-- Three save types coexist in one table:
--   source_type='image'  — bride/member forwarded an image to WhatsApp
--                          image_url = Cloudinary URL (the image itself)
--                          source_url = null
--                          vendor_id = null
--                          tap-to-open: image_url
--   source_type='link'   — bride/member forwarded a Pinterest/Instagram URL
--                          image_url = Cloudinary URL (mirrored preview)
--                          source_url = original Pinterest/IG URL
--                          vendor_id = null
--                          tap-to-open: source_url
--   source_type='vendor' — bride saved a vendor from Discover (Session 9+)
--                          image_url = Cloudinary URL (vendor's hero photo)
--                          source_url = null
--                          vendor_id = the vendor's uuid
--                          tap-to-open: vendor profile (resolved at runtime via vendor_id)
create table if not exists muse_saves (
  id                   uuid primary key default uuid_generate_v4(),
  couple_id            uuid not null references couples(id) on delete cascade,
  save_number          int not null,
  source_type          text not null,
  source_url           text,
  image_url            text,
  vendor_id            uuid references vendors(id) on delete set null,
  caption              text,
  aesthetic_tags       jsonb not null default '[]'::jsonb,
  vision_raw           jsonb,
  saved_by_user_id     uuid not null references users(id) on delete restrict,
  saved_by_role        text not null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- save_number is monotonic per couple_id
create unique index if not exists muse_saves_couple_save_number_unique
  on muse_saves(couple_id, save_number);

-- source_type discriminator
alter table muse_saves add constraint muse_saves_source_type_check
  check (source_type in ('image', 'link', 'vendor'));

-- saved_by_role discriminator
alter table muse_saves add constraint muse_saves_saved_by_role_check
  check (saved_by_role in ('bride', 'circle_member'));

-- Vendor saves must reference a vendor. Image/link saves don't need to.
alter table muse_saves add constraint muse_saves_vendor_required_for_vendor_type
  check (source_type <> 'vendor' or vendor_id is not null);

-- Lookup indexes
create index if not exists muse_saves_couple_id_idx on muse_saves(couple_id);
create index if not exists muse_saves_couple_created_idx on muse_saves(couple_id, created_at desc);
create index if not exists muse_saves_couple_saved_by_idx on muse_saves(couple_id, saved_by_user_id);
create index if not exists muse_saves_couple_vendor_idx on muse_saves(couple_id, vendor_id) where vendor_id is not null;

-- updated_at trigger
create trigger muse_saves_set_updated_at
  before update on muse_saves
  for each row execute function set_updated_at();

-- Realtime (PWA at 11-12 will subscribe)
alter publication supabase_realtime add table muse_saves;

-- ── circle_members: bride's people ──────────────────────────────────
create table if not exists circle_members (
  id                   uuid primary key default uuid_generate_v4(),
  couple_id            uuid not null references couples(id) on delete cascade,
  invitee_name         text not null,
  invitee_phone        text,
  role                 text not null,
  invite_token         text not null,
  status               text not null default 'pending',
  sticky_couple_until  timestamptz,
  invited_at           timestamptz not null default now(),
  joined_at            timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Token is globally unique (uniqueness is the security property)
create unique index if not exists circle_members_invite_token_unique
  on circle_members(invite_token);

-- role discriminator
alter table circle_members add constraint circle_members_role_check
  check (role in ('partner', 'family', 'inner_circle'));

-- status discriminator
alter table circle_members add constraint circle_members_status_check
  check (status in ('pending', 'active', 'removed'));

-- Phone lookup (active+pending members only — needed for routing)
create index if not exists circle_members_phone_idx
  on circle_members(invitee_phone)
  where invitee_phone is not null;

-- Couple-scoped status lookups
create index if not exists circle_members_couple_status_idx
  on circle_members(couple_id, status);

-- updated_at trigger
create trigger circle_members_set_updated_at
  before update on circle_members
  for each row execute function set_updated_at();

-- Realtime
alter publication supabase_realtime add table circle_members;

-- ── circle_activity: append-only feed ───────────────────────────────
create table if not exists circle_activity (
  id                    uuid primary key default uuid_generate_v4(),
  couple_id             uuid not null references couples(id) on delete cascade,
  actor_user_id         uuid references users(id) on delete set null,
  actor_name            text not null,
  actor_role            text not null,
  activity_type         text not null,
  subject_type          text,
  subject_id            uuid,
  payload               jsonb not null default '{}'::jsonb,
  surfaced_to_bride     boolean not null default false,
  surfaced_at           timestamptz,
  created_at            timestamptz not null default now()
);

-- actor_role discriminator
alter table circle_activity add constraint circle_activity_actor_role_check
  check (actor_role in ('bride', 'circle_member', 'agent'));

-- activity_type discriminator
alter table circle_activity add constraint circle_activity_type_check
  check (activity_type in ('joined', 'save_added', 'comment', 'reaction', 'removed'));

-- subject_type discriminator (nullable for activities with no subject like 'joined')
alter table circle_activity add constraint circle_activity_subject_type_check
  check (subject_type is null or subject_type in ('muse_save', 'circle_member'));

-- Couple-scoped feed lookup
create index if not exists circle_activity_couple_created_idx
  on circle_activity(couple_id, created_at desc);

-- Unsurfaced lookup (the BFF-summary query path)
create index if not exists circle_activity_couple_unsurfaced_idx
  on circle_activity(couple_id, created_at)
  where surfaced_to_bride = false;

-- Realtime
alter publication supabase_realtime add table circle_activity;

-- ── conversations.kind: add 'circle_thread' ─────────────────────────
-- conversations.kind currently allows: vendor_self, couple_thread, couple_self, network
-- B2: add circle_thread for circle member ↔ bride agent conversations.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'conversations_kind_check'
      and conrelid = 'conversations'::regclass
  ) then
    alter table conversations drop constraint conversations_kind_check;
  end if;
end$$;

alter table conversations add constraint conversations_kind_check
  check (kind in ('vendor_self', 'couple_thread', 'couple_self', 'circle_thread', 'network'));

-- ── invite_circle_member(): bride generates an invite ───────────────
-- Enforces:
--   - couples must exist
--   - role must be one of partner/family/inner_circle
--   - 3-member cap at B2 (pending + active count combined)
-- Generates a CIRCLE-XXXXXX token using a 32-char alphabet (24 letters minus
-- I/O + digits 2-9). 32^6 = ~1.07 billion combinations.
-- Loops on rare collision. Returns id, token, and wa.me link.
--
-- Cap is hardcoded at 3 in B2. When tier system ships, this function will
-- read couples.tier (or a future tier table) to determine the limit.
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
begin
  -- Validate role
  if p_role not in ('partner', 'family', 'inner_circle') then
    raise exception 'role must be partner / family / inner_circle';
  end if;

  -- Validate couple
  if not exists (select 1 from couples where couples.id = p_couple_id) then
    raise exception 'couple % not found', p_couple_id;
  end if;

  -- Enforce member cap (pending + active count)
  select count(*) into v_existing
  from circle_members
  where couple_id = p_couple_id
    and status in ('pending', 'active');

  if v_existing >= v_member_cap then
    raise exception 'circle_member_limit_reached';
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

  -- Insert pending row
  insert into circle_members (couple_id, invitee_name, role, invite_token, status)
  values (p_couple_id, p_invitee_name, p_role, v_token, 'pending')
  returning circle_members.id into v_member_id;

  -- Return shape
  id := v_member_id;
  invite_token := v_token;
  wa_me_link := 'https://wa.me/14787788550?text=' || v_token;
  return next;
end;
$$ language plpgsql;

-- ── claim_circle_invite(): member claims invite on first message ────
-- Called by brideIndex.js when a first-message regex match comes in.
-- Looks up the token. If valid+pending, flips to active, sets phone +
-- joined_at, writes a circle_activity 'joined' row, returns context the
-- agent needs to greet the member.
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
begin
  -- Lookup pending invite
  select cm.id, cm.couple_id, cm.invitee_name, cm.role
    into v_member_id, v_couple_id, v_name, v_role
    from circle_members cm
    where cm.invite_token = p_token
      and cm.status = 'pending';

  if v_member_id is null then
    raise exception 'invite_invalid_or_used';
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
