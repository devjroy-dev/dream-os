-- ════════════════════════════════════════════════════════════════════
-- Migration 0003 — Vendor onboarding
-- Date:    2026-05-14
-- Session: 3
-- Author:  Dev
-- ════════════════════════════════════════════════════════════════════
--
-- WHAT THIS ADDS
--   vendors.onboarding_state — tracks onboarding progress
--   invite_vendor() — creates user + vendor rows for invited vendors
--
-- NOTE: This was applied to Supabase during Session 3 but the file
-- was not committed to the repo at the time. Added retroactively.
-- IMMUTABILITY: never edit this file. Changes go in 0004+.
-- ════════════════════════════════════════════════════════════════════

alter table vendors
  add column if not exists onboarding_state text default null;

update vendors
set onboarding_state = 'complete'
where id = '2eb5d3fb-31eb-4b26-859a-cf10ae477d53';

comment on column vendors.onboarding_state is
  'Tracks conversational onboarding progress. NULL or complete = active vendor. new/asked_name/asked_ig/asked_category/asked_city/asked_travel/asked_rate = onboarding in progress.';

create or replace function invite_vendor(p_phone text, p_name text)
returns uuid as $$
declare
  v_user_id uuid;
  v_vendor_id uuid;
begin
  insert into users (phone, name)
  values (p_phone, p_name)
  on conflict (phone) do update
    set name = excluded.name,
        updated_at = now()
  returning id into v_user_id;

  insert into vendors (user_id, onboarding_state)
  values (v_user_id, 'new')
  on conflict do nothing
  returning id into v_vendor_id;

  if v_vendor_id is null then
    select id into v_vendor_id
    from vendors
    where user_id = v_user_id;
  end if;

  return v_vendor_id;
end;
$$ language plpgsql;
