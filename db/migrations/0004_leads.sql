-- ════════════════════════════════════════════════════════════════════
-- Migration 0004 — Leads table
-- Date:    2026-05-15
-- Session: 4
-- Author:  Dev
-- ════════════════════════════════════════════════════════════════════

create table leads (
  id               uuid primary key default uuid_generate_v4(),
  vendor_id        uuid not null references vendors(id) on delete cascade,
  name             text,
  phone            text,
  email            text,
  wedding_date     date,
  wedding_city     text,
  event_types      text[],
  budget_min       integer,
  budget_max       integer,
  source           text default 'whatsapp',
  referrer_name    text,
  state            text not null default 'new',
  raw_message      text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index leads_vendor_id_idx    on leads(vendor_id);
create index leads_state_idx        on leads(state);
create index leads_created_at_idx   on leads(created_at desc);
create index leads_wedding_date_idx on leads(wedding_date);

create trigger leads_updated_at
  before update on leads
  for each row execute function set_updated_at();

alter publication supabase_realtime add table leads;
