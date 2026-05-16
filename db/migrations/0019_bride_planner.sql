-- ════════════════════════════════════════════════════════════════════
-- Migration 0019 — Bride planner: tasks, bookings, receipts
-- Date:    2026-05-16
-- Session: B3
-- Author:  Dev
-- ════════════════════════════════════════════════════════════════════
--
-- WHAT THIS ADDS
--   couple_tasks         — bride's to-do list (undated or due-dated tasks)
--   couple_bookings      — per-vendor commitment tracking (advance / paid / due)
--   couple_receipts      — receipt vault, optionally linked to a booking
--   record_payment()     — transactional SQL function: single source of truth
--                          for couple_bookings.amount_paid and state. The
--                          agent NEVER updates these fields directly — only
--                          through this function.
--
-- ARCHITECTURAL PRINCIPLES (from ROADMAP_BRIDE.md, B3 lock)
--   1. No agent arithmetic. All booking math lives in this SQL.
--   2. Intent maps to tool. Tools call functions, functions own state.
--   3. Delete replaces cancellation. No 'cancelled' state on bookings/receipts.
--   4. No per-payer attribution. Every receipt is the bride's.
--   5. Bookings are flat. One row per commitment. No multi-event splits.
--   6. Receipts link to bookings optionally, never silently.
--   7. Destructive actions confirm. Enforced at tool layer.
--
-- DELIBERATE OMISSIONS
--   No CHECK (amount_paid >= 0). Negative is allowed so delete_receipt can
--     reverse a contribution by calling record_payment with a negative amount.
--     Agent surfaces negatives as warnings ("something's off") at tool layer.
--   No CHECK (amount_paid <= amount_total). Overpayment is real (shagun tips,
--     UPI typos). Mirrors vendor invoices (0008). Agent soft-warns if seen.
--   No couple_id column added to events. events.couple_id already exists from
--     migration 0013 (B1). This migration does NOT touch the events table.
--   No 'cancelled' state on bookings. Cancellation = delete_booking() at tool
--     layer. Mirrors locked architectural principle #3.
--
-- IMMUTABILITY: never edit this file. Changes go in 0020+.
-- ════════════════════════════════════════════════════════════════════

-- ── couple_tasks ─────────────────────────────────────────────────────
-- Undated or due-dated to-dos. Distinct from events (which are anchored
-- to a calendar slot with event_date NOT NULL). Tasks have optional
-- due_date — "call venue Monday" gets a due_date, "research florists"
-- doesn't.
create table if not exists couple_tasks (
  id              uuid primary key default uuid_generate_v4(),
  couple_id       uuid not null references couples(id) on delete cascade,
  title           text not null,
  status          text not null default 'pending'
                  check (status in ('pending','done')),
  priority        text not null default 'medium'
                  check (priority in ('high','medium','low')),
  due_date        date,
  event_name      text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists couple_tasks_couple_id_idx
  on couple_tasks(couple_id);
create index if not exists couple_tasks_open_by_due_idx
  on couple_tasks(couple_id, status, due_date)
  where status = 'pending';

drop trigger if exists couple_tasks_set_updated_at on couple_tasks;
create trigger couple_tasks_set_updated_at
  before update on couple_tasks
  for each row execute function set_updated_at();

alter publication supabase_realtime add table couple_tasks;


-- ── couple_bookings ──────────────────────────────────────────────────
-- Per-vendor commitment tracking. The bride's mirror of the vendor's
-- invoices table — same shape, reversed perspective. Vendor says "client
-- owes me 1.5L by Dec 1"; bride says "I owe photographer 1.5L by Dec 1."
--
-- amount_total and amount_advance are both NULLABLE. Real-world: brides
-- often pay an advance before the final contract value is fixed (designers
-- especially). State stays 'booked' until amount_total is set.
--
-- vendor_id is nullable and points to vendors(id) for B4+ linkage to
-- dream-os vendors. At B3, the bride enters bookings as free text
-- (vendor_name). At B4, when couple_vendor_connections lights up, a
-- booking can link to a real vendor row.
create table if not exists couple_bookings (
  id                  uuid primary key default uuid_generate_v4(),
  couple_id           uuid not null references couples(id) on delete cascade,
  vendor_name         text not null,
  vendor_id           uuid references vendors(id) on delete set null,
  category            text not null check (category in (
                        'photographer','videographer','mua','designer',
                        'venue','caterer','decor','florist','music',
                        'planner','other'
                      )),
  amount_total        integer check (amount_total is null or amount_total >= 0),
  amount_advance      integer check (amount_advance is null or amount_advance >= 0),
  amount_paid         integer not null default 0,
  balance_due_date    date,
  state               text not null default 'booked'
                      check (state in ('booked','advance_paid','paid')),
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists couple_bookings_couple_id_idx
  on couple_bookings(couple_id);
create index if not exists couple_bookings_couple_state_idx
  on couple_bookings(couple_id, state);
create index if not exists couple_bookings_couple_due_idx
  on couple_bookings(couple_id, balance_due_date)
  where balance_due_date is not null;
create index if not exists couple_bookings_couple_vendor_name_idx
  on couple_bookings(couple_id, lower(vendor_name));

drop trigger if exists couple_bookings_set_updated_at on couple_bookings;
create trigger couple_bookings_set_updated_at
  before update on couple_bookings
  for each row execute function set_updated_at();

alter publication supabase_realtime add table couple_bookings;


-- ── couple_receipts ──────────────────────────────────────────────────
-- The receipt vault. Every spend the bride captures, whether linked to
-- a booking or not. Most fields are NULLABLE because OCR may not extract
-- every field cleanly and the agent should not gate on completeness
-- (locked decision: no OCR confidence threshold).
--
-- booking_id is the optional meeting point with couple_bookings. When
-- set, this receipt represents a payment that contributed to the
-- booking's amount_paid. ON DELETE SET NULL: deleting a booking
-- preserves the receipts as standalone records.
--
-- amount is nullable because the bride might capture a receipt by photo
-- where Vision can't read the amount, and confirm it later. The receipt
-- row exists for record-keeping; the amount can be filled in.
create table if not exists couple_receipts (
  id              uuid primary key default uuid_generate_v4(),
  couple_id       uuid not null references couples(id) on delete cascade,
  booking_id      uuid references couple_bookings(id) on delete set null,
  amount          integer check (amount is null or amount >= 0),
  vendor_name     text,
  description     text,
  receipt_date    date,
  image_url       text,
  tags            text[] not null default array[]::text[],
  created_at      timestamptz not null default now()
);

create index if not exists couple_receipts_couple_id_idx
  on couple_receipts(couple_id);
create index if not exists couple_receipts_couple_created_idx
  on couple_receipts(couple_id, created_at desc);
create index if not exists couple_receipts_booking_id_idx
  on couple_receipts(couple_id, booking_id)
  where booking_id is not null;

alter publication supabase_realtime add table couple_receipts;


-- ── record_payment() ─────────────────────────────────────────────────
-- Single source of truth for booking state transitions.
--
-- The agent NEVER updates couple_bookings.amount_paid or .state directly.
-- It calls record_payment(), reads the returned row, and surfaces the
-- numbers verbatim in its reply. All arithmetic happens here.
--
-- Behaviour:
--   1. Lock the booking row (SELECT ... FOR UPDATE).
--   2. Add p_amount to amount_paid. p_amount may be NEGATIVE — this is
--      how delete_receipt reverses a contribution. No CHECK enforces
--      non-negative amount_paid (see deliberate omissions above).
--   3. Recompute state:
--        - 'paid'         if amount_total IS NOT NULL AND amount_paid >= amount_total
--        - 'advance_paid' if amount_paid > 0 AND (amount_advance IS NULL OR amount_paid >= amount_advance)
--        - 'booked'       otherwise
--      Note: when amount_total IS NULL, state can be 'booked' or
--      'advance_paid' but never 'paid' — because we don't know what
--      "fully paid" means until the total is set.
--   4. If p_receipt_id is provided, set that receipt's booking_id to
--      p_booking_id. This is how Branch B/C of the 3-branch receipt
--      flow links a newly-saved receipt to its booking.
--   5. Return the updated booking row.
create or replace function record_payment(
  p_booking_id    uuid,
  p_amount        integer,
  p_receipt_id    uuid default null,
  p_payment_date  date default null  -- accepted but not stored on booking; receipts hold the date
)
returns couple_bookings
language plpgsql
as $$
declare
  v_booking couple_bookings;
begin
  -- Lock the row to prevent concurrent record_payment races.
  select * into v_booking
  from couple_bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'record_payment: booking % not found', p_booking_id
      using errcode = 'no_data_found';
  end if;

  -- Apply the payment delta.
  v_booking.amount_paid := v_booking.amount_paid + p_amount;

  -- Recompute state. Order matters: check 'paid' first (highest), then
  -- 'advance_paid', then default to 'booked'.
  v_booking.state := case
    when v_booking.amount_total is not null
         and v_booking.amount_paid >= v_booking.amount_total
      then 'paid'
    when v_booking.amount_paid > 0
         and (v_booking.amount_advance is null
              or v_booking.amount_paid >= v_booking.amount_advance)
      then 'advance_paid'
    else 'booked'
  end;

  v_booking.updated_at := now();

  update couple_bookings
  set amount_paid = v_booking.amount_paid,
      state       = v_booking.state,
      updated_at  = v_booking.updated_at
  where id = p_booking_id;

  -- Link the receipt to this booking, if a receipt id was provided.
  if p_receipt_id is not null then
    update couple_receipts
    set booking_id = p_booking_id
    where id = p_receipt_id;
  end if;

  return v_booking;
end;
$$;

-- ════════════════════════════════════════════════════════════════════
-- End of 0019_bride_planner.sql
-- ════════════════════════════════════════════════════════════════════
