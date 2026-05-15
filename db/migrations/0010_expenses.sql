-- ════════════════════════════════════════════════════════════════════
-- Migration 0010 — Expenses table
-- Date:    2026-05-15
-- Session: 8.3
-- Author:  Dev
-- ════════════════════════════════════════════════════════════════════

-- expenses table — vendor-logged business expenses
create table if not exists expenses (
  id              uuid primary key default uuid_generate_v4(),
  vendor_id       uuid not null references vendors(id) on delete cascade,
  amount          integer not null check (amount > 0),
  category        text not null check (category in (
                    'travel', 'equipment', 'assistant', 'studio',
                    'marketing', 'software', 'food', 'printing',
                    'commission', 'shoot', 'inventory', 'other'
                  )),
  description     text,
  expense_date    date default current_date,
  client_name     text,
  linked_lead_id  uuid references leads(id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- expense_date: nullable, defaults to current_date if not specified.
-- client_name: free text fallback for unlinked expenses.
--   When linked_lead_id is set, lead name takes precedence.
--   When linked_lead_id is null, client_name gives attribution context.
--   Same pattern as invoices table (lead_id + client_name).

-- ── Indexes ──────────────────────────────────────────────────────────
create index if not exists expenses_vendor_id_idx    on expenses(vendor_id);
create index if not exists expenses_expense_date_idx on expenses(expense_date);
create index if not exists expenses_category_idx     on expenses(category);
create index if not exists expenses_created_at_idx   on expenses(created_at desc);

-- ── Trigger ──────────────────────────────────────────────────────────
drop trigger if exists expenses_set_updated_at on expenses;
create trigger expenses_set_updated_at
  before update on expenses
  for each row execute function set_updated_at();

-- ── Realtime ─────────────────────────────────────────────────────────
alter publication supabase_realtime add table expenses;
