-- ════════════════════════════════════════════════════════════════════
-- Migration 0002 — Agent substrate
-- Date:    2026-05-14
-- Session: 2
-- Author:  Dev
-- ════════════════════════════════════════════════════════════════════
--
-- WHAT THIS CREATES
--   - vendor_state:    the agent's working memory per vendor
--   - pending_actions: drafts awaiting vendor approval (used in draft mode)
--   - notes:           free-form facts the agent has noted about a vendor
--
-- IMMUTABILITY: never edit this file. New changes go in 0003+.
-- ════════════════════════════════════════════════════════════════════

create table vendor_state (
  vendor_id          uuid primary key references vendors(id) on delete cascade,
  summary            text,
  pricing_policy     jsonb default '{}'::jsonb,
  recent_notes       jsonb default '[]'::jsonb,
  open_threads       integer default 0,
  pending_actions    integer default 0,
  updated_at         timestamptz not null default now()
);

create trigger vendor_state_updated_at 
  before update on vendor_state 
  for each row execute function set_updated_at();

create table notes (
  id              uuid primary key default uuid_generate_v4(),
  vendor_id       uuid not null references vendors(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  content         text not null,
  tags            text[],
  created_at      timestamptz not null default now()
);

create index notes_vendor_id_idx on notes(vendor_id);
create index notes_created_at_idx on notes(created_at desc);
create index notes_conversation_id_idx on notes(conversation_id);

create table pending_actions (
  id                uuid primary key default uuid_generate_v4(),
  vendor_id         uuid not null references vendors(id) on delete cascade,
  conversation_id   uuid references conversations(id) on delete cascade,
  action_type       text not null,
  payload           jsonb not null,
  state             text not null default 'pending',
  summary           text,
  expires_at        timestamptz,
  resolved_at       timestamptz,
  created_at        timestamptz not null default now()
);

create index pending_actions_vendor_id_idx on pending_actions(vendor_id);
create index pending_actions_state_idx on pending_actions(state);
create index pending_actions_created_at_idx on pending_actions(created_at desc);

alter publication supabase_realtime add table pending_actions;
alter publication supabase_realtime add table notes;

insert into vendor_state (vendor_id, summary)
select 
  v.id, 
  'Test vendor: Dev, photography, Delhi. Founding cohort.'
from vendors v 
where v.id = '2eb5d3fb-31eb-4b26-859a-cf10ae477d53'
on conflict (vendor_id) do nothing;
