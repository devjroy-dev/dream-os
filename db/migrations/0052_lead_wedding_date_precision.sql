-- 0052_lead_wedding_date_precision.sql
-- Patch 8d — explicit precision column for wedding_date.
--
-- Background: vendors phrase wedding dates with varying precision:
--   "Dec 14"       → day-level
--   "July 2026"    → month-level
--   "next year"    → year-level (rare)
--   (no date)      → unknown
--
-- Pre-8c behaviour: the LLM filled missing days with "01", creating
-- fake-precise data. 8c nulled those out — but then we lost the month
-- entirely from the calendar view. 8d restores it via an explicit column.
--
-- Semantics:
--   precision='day'   → wedding_date is the exact day. Display "14 Jul 2026".
--   precision='month' → wedding_date is the FIRST of that month, treated as
--                       a sentinel. Display "July 2026 (month TBD)".
--   precision='year'  → wedding_date is Jan 1 of that year, sentinel. Display
--                       "2027 (date TBD)".
--   NULL              → wedding_date IS NULL. No date known.
--
-- The PWA + admin UI read this column to format the date display.

alter table leads
  add column if not exists wedding_date_precision text
  check (wedding_date_precision in ('day', 'month', 'year'));

comment on column leads.wedding_date_precision is
  'How precisely the wedding_date is known. day = exact, month = sentinel 1st-of-month, year = sentinel Jan 1. NULL when wedding_date is also NULL.';

-- Backfill: any existing wedding_date row gets precision=day by default.
-- This is correct for the vast majority — historical leads were created
-- back when only day-level dates were stored anyway.
update leads
set wedding_date_precision = 'day'
where wedding_date is not null and wedding_date_precision is null;
