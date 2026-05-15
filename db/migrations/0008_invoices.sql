-- ════════════════════════════════════════════════════════════════════
-- Migration 0008 — Invoices, invoice_prefix, invoice_counter
-- Date:    2026-05-15
-- Session: 7
-- Author:  Dev
-- ════════════════════════════════════════════════════════════════════
-- NOTE: This file was backfilled in Session 8.1 to record schema
-- that was applied directly to Supabase during Session 7.
-- The schema is already live — this file makes the repo the source
-- of truth, per the rule: every schema change goes through a
-- numbered migration file. Do not re-apply.
-- ════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- vendors: invoice prefix + counter
-- ───────────────────────────────────────────────────────────────────
alter table vendors
  add column if not exists invoice_prefix  text,
  add column if not exists invoice_counter integer not null default 0;

-- ───────────────────────────────────────────────────────────────────
-- invoices table — vendor-issued client invoices
-- ───────────────────────────────────────────────────────────────────
create table if not exists invoices (
  id              uuid primary key default uuid_generate_v4(),
  vendor_id       uuid not null references vendors(id) on delete cascade,
  lead_id         uuid references leads(id) on delete set null,
  invoice_number  text not null,
  client_name     text not null,
  client_phone    text,
  description     text,
  amount_total    integer not null check (amount_total >= 0),
  amount_advance  integer check (amount_advance is null or amount_advance >= 0),
  amount_paid     integer not null default 0 check (amount_paid >= 0),
  due_date        date,
  state           text not null default 'unpaid'
                  check (state in ('unpaid','advance_paid','paid','cancelled')),
  pdf_url         text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Deliberate omission: amount_paid <= amount_total is NOT enforced.
-- Overpayment (shagun tips, UPI typos) is a legitimate vendor reality.
-- Handled as a soft prompt at the tool layer in record_payment (Session 7.5).

-- ───────────────────────────────────────────────────────────────────
-- Unique constraint: one invoice_number per vendor
-- ───────────────────────────────────────────────────────────────────
create unique index if not exists invoices_vendor_number_unique
  on invoices(vendor_id, invoice_number);

-- ───────────────────────────────────────────────────────────────────
-- Indexes
-- ───────────────────────────────────────────────────────────────────
create index if not exists invoices_vendor_id_idx     on invoices(vendor_id);
create index if not exists invoices_state_idx         on invoices(state);
create index if not exists invoices_due_date_idx      on invoices(due_date);
create index if not exists invoices_lead_id_idx       on invoices(lead_id);
create index if not exists invoices_created_at_idx    on invoices(created_at desc);

-- ───────────────────────────────────────────────────────────────────
-- updated_at trigger
-- ───────────────────────────────────────────────────────────────────
drop trigger if exists invoices_set_updated_at on invoices;
create trigger invoices_set_updated_at
  before update on invoices
  for each row execute function set_updated_at();

-- ───────────────────────────────────────────────────────────────────
-- Realtime
-- ───────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table invoices;

-- ───────────────────────────────────────────────────────────────────
-- Supabase storage bucket: invoices (private, 5MB, PDF only)
-- ───────────────────────────────────────────────────────────────────
-- Note: bucket creation was done via Supabase Dashboard in Session 7.
-- Recorded here for reference. service_role has full INSERT/SELECT/UPDATE/DELETE.
-- Used in Session 7.5 when PDF generation ships.
