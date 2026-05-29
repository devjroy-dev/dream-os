-- 0064_vendor_base_fee.sql
-- Phase 2.1 — vendor's typical fee range, used to compute the budget delta
-- shown in enquiry notifications ("her budget is 7% below your base fee").
--
-- Both nullable: a vendor who hasn't set a fee simply gets no budget line in
-- the enrichment — the notification degrades gracefully, never shows a blank.
-- Whole rupees, same convention as leads.budget_min / couples.budget_total.

alter table vendors
  add column if not exists base_fee_min integer,
  add column if not exists base_fee_max integer;

comment on column vendors.base_fee_min is
  'Phase 2.1 — lower bound of vendor''s typical fee in whole rupees. NULL = not set; budget-delta line is omitted from enquiry enrichment.';
comment on column vendors.base_fee_max is
  'Phase 2.1 — upper bound of vendor''s typical fee in whole rupees. NULL = not set.';

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
