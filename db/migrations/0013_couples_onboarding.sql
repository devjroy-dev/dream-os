-- 0013_couples_onboarding.sql
-- Session B1: bride onboarding foundation
-- Pattern: mirrors vendor onboarding (0003) for couples; extends events + notes
--          to serve both vendors and couples via XOR ownership.
--
-- WHAT THIS ADDS
--   couples.onboarding_state — tracks bride conversational onboarding (no CHECK, mirrors vendor)
--   couples.nudge_sent_at    — added now to avoid later ALTER; Session 9 silent onboarding nudge
--   couple_state             — bride agent working memory (mirrors vendor_state)
--   events.couple_id         — events can now be owned by a couple
--   notes.couple_id          — notes can now be owned by a couple
--   events.kind widened      — adds fitting, trial, family, ceremony, social
--   events.vendor_id nullable + XOR — exactly one of vendor_id / couple_id is set
--   notes.vendor_id nullable + XOR  — exactly one of vendor_id / couple_id is set
--   invite_couple()          — admin invite function, mirrors invite_vendor()
--
-- IMMUTABILITY: never edit this file. Changes go in 0014+.

-- ── couples: onboarding columns ─────────────────────────────────────
alter table couples
  add column if not exists onboarding_state text default 'new',
  add column if not exists nudge_sent_at    timestamptz;

comment on column couples.onboarding_state is
  'Tracks conversational onboarding progress. new/asked_date/asked_partner/asked_city/asked_budget = in progress. complete = active bride.';

comment on column couples.nudge_sent_at is
  'Session 9: stamped once when the vendor agent appends the bride-product nudge. One nudge per bride, lifetime.';

-- ── couple_state: bride agent working memory (mirrors vendor_state) ─
create table if not exists couple_state (
  couple_id          uuid primary key references couples(id) on delete cascade,
  summary            text,
  vendor_shortlist   jsonb not null default '[]',
  taste_notes        text,
  updated_at         timestamptz not null default now()
);

create trigger couple_state_updated_at
  before update on couple_state
  for each row execute function set_updated_at();

alter publication supabase_realtime add table couple_state;

-- ── events: widen kind, add couple_id, enforce XOR ──────────────────
alter table events drop constraint if exists events_kind_check;
alter table events add constraint events_kind_check
  check (kind in ('shoot','call','meeting','task','reminder','recce','fitting','trial','family','ceremony','social','other'));

alter table events alter column vendor_id drop not null;

alter table events
  add column if not exists couple_id uuid references couples(id) on delete cascade;

alter table events add constraint events_owner_xor
  check ((vendor_id is null) <> (couple_id is null));

create index if not exists events_couple_id_idx on events(couple_id);

-- ── notes: add couple_id, enforce XOR ───────────────────────────────
alter table notes alter column vendor_id drop not null;

alter table notes
  add column if not exists couple_id uuid references couples(id) on delete cascade;

alter table notes add constraint notes_owner_xor
  check ((vendor_id is null) <> (couple_id is null));

create index if not exists notes_couple_id_idx on notes(couple_id);

-- ── invite_couple(): admin invite function (mirrors invite_vendor) ──
create or replace function invite_couple(p_phone text, p_name text)
returns uuid as $$
declare
  v_user_id   uuid;
  v_couple_id uuid;
begin
  insert into users (phone, name)
  values (p_phone, p_name)
  on conflict (phone) do update
    set name = excluded.name,
        updated_at = now()
  returning id into v_user_id;

  insert into couples (user_id, onboarding_state)
  values (v_user_id, 'new')
  on conflict do nothing
  returning id into v_couple_id;

  if v_couple_id is null then
    select id into v_couple_id
    from couples
    where user_id = v_user_id;
  end if;

  insert into couple_state (couple_id)
  values (v_couple_id)
  on conflict (couple_id) do nothing;

  return v_couple_id;
end;
$$ language plpgsql;
