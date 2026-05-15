-- 0011_clients.sql
-- Session 8.5: clients table + promotion links from leads and invoices
-- Pattern: vendor-scoped, mirrors leads. One phone per vendor max.

-- ── clients table ───────────────────────────────────────────
create table if not exists clients (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references vendors(id) on delete cascade,
  user_id         uuid references users(id) on delete set null,
  name            text not null,
  phone           text,
  email           text,
  source          text not null default 'lead_promotion',
  referrer_name   text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- One phone per vendor (partial index: nulls allowed multiple times)
create unique index if not exists clients_vendor_phone_unique
  on clients(vendor_id, phone)
  where phone is not null;

-- Lookup indexes
create index if not exists clients_vendor_id_idx on clients(vendor_id);
create index if not exists clients_created_at_idx on clients(created_at desc);

-- updated_at trigger
create trigger clients_set_updated_at
  before update on clients
  for each row execute function set_updated_at();

-- Realtime
alter publication supabase_realtime add table clients;

-- ── leads.client_id ─────────────────────────────────────────
alter table leads
  add column if not exists client_id uuid references clients(id) on delete set null;

create index if not exists leads_client_id_idx on leads(client_id);

-- ── invoices.client_id ──────────────────────────────────────
alter table invoices
  add column if not exists client_id uuid references clients(id) on delete set null;

create index if not exists invoices_client_id_idx on invoices(client_id);
