-- 0068_binders.sql — Piece 1a — the free-form binder ledger (Kriya's cabinet).
--
-- Ported from dreamai's `records` model, adapted to dream-os:
--   * keyed by vendor_id -> vendors(id)   (dreamai used agent_id -> agents)
--   * audit trail -> binder_events         (dream-os `events` is the CALENDAR;
--                                            never reuse it for audit)
-- Stands BESIDE the old typed ledger (leads/clients/invoices/...). Nothing is
-- dropped here — the old ledger and the bride weld stay live until the 1c cutover.

create table if not exists binders (
  id                 uuid primary key default gen_random_uuid(),
  vendor_id          uuid not null references vendors(id) on delete cascade,
  amount             numeric,                                   -- money: rupee value
  client             text,
  "date"             date,
  direction          text check (direction in ('in','out')),   -- money: in/out
  doc_ref            text,                                      -- storage ref for a document
  note               text,                                     -- current truth (replaced unless _append)
  phone              text,
  stage              text,                                      -- free-text; lead/client stage in Kriya's word
  amount_received    numeric,
  amount_pending     numeric,
  payment_status     text,
  reason_for_action  text,                                     -- Kriya's diary; ALWAYS appends, never erased
  followup_on        date,
  followup_note      text,
  repeat_every       text,
  hidden             boolean not null default false,            -- archive, not delete
  hidden_at          timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists binders_vendor_idx        on binders(vendor_id) where hidden = false;
create index if not exists binders_vendor_client_idx on binders(vendor_id, client) where hidden = false;
create index if not exists binders_vendor_date_idx   on binders(vendor_id, "date") where hidden = false;

-- The binder's spine: one dated line per confirmed write. kriya_history reads this back.
-- Best-effort at the write site; the write is the truth and never fails because the log hiccuped.
create table if not exists binder_events (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references vendors(id) on delete cascade,
  actor        text not null default 'agent',
  action       text not null,                                   -- create | update | money_replace | ...
  binder_id    uuid,
  summary      text,
  created_at   timestamptz not null default now()
);
create index if not exists binder_events_binder_idx on binder_events(binder_id);
create index if not exists binder_events_vendor_idx on binder_events(vendor_id);
