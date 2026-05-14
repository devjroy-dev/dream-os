-- Migration 0001 — Initial schema
-- Date: 2026-05-14, Session: 1, Author: Dev
-- IMMUTABILITY RULE: never edit this file. New changes go in new migrations.

create extension if not exists "uuid-ossp";

create table users (
  id           uuid primary key default uuid_generate_v4(),
  phone        text not null unique,
  name         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index users_phone_idx on users(phone);

create table vendors (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references users(id) on delete cascade,
  business_name      text,
  category           text,
  vertical           text not null default 'wedding',
  city               text,
  upi_id             text,
  gstin              text,
  status             text not null default 'active',
  tier               text not null default 'trial',
  founding_cohort    boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index vendors_user_id_idx on vendors(user_id);
create index vendors_vertical_idx on vendors(vertical);

create table couples (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references users(id) on delete cascade,
  partner_name       text,
  wedding_date       date,
  wedding_city       text,
  budget_total       integer,
  events_planned     jsonb,
  planning_state     text default 'browsing',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index couples_user_id_idx on couples(user_id);

create table conversations (
  id                       uuid primary key default uuid_generate_v4(),
  vendor_id                uuid not null references vendors(id) on delete cascade,
  counterparty_user_id     uuid references users(id) on delete cascade,
  counterparty_phone       text,
  kind                     text not null,
  state                    text not null default 'new',
  mode                     text not null default 'draft',
  last_message_at          timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index conversations_vendor_id_idx on conversations(vendor_id);
create index conversations_counterparty_phone_idx on conversations(counterparty_phone);
create index conversations_state_idx on conversations(state);

create table messages (
  id                uuid primary key default uuid_generate_v4(),
  conversation_id   uuid not null references conversations(id) on delete cascade,
  direction         text not null,
  channel           text not null,
  body              text,
  media_url         text,
  sent_by           text not null,
  tool_calls        jsonb,
  tool_results      jsonb,
  twilio_sid        text,
  created_at        timestamptz not null default now()
);
create index messages_conversation_id_idx on messages(conversation_id);
create index messages_created_at_idx on messages(created_at);

alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table messages;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at         before update on users         for each row execute function set_updated_at();
create trigger vendors_updated_at       before update on vendors       for each row execute function set_updated_at();
create trigger couples_updated_at       before update on couples       for each row execute function set_updated_at();
create trigger conversations_updated_at before update on conversations for each row execute function set_updated_at();
