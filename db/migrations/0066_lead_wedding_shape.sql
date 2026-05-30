-- 0066_lead_wedding_shape.sql
-- Phase 3.5 — store the wedding SHAPE on the lead for unregistered (wa.me)
-- brides who never did TDW onboarding. A registered bride has this on her
-- couples record (0065); an enquiry-only bride needs it on the lead so the
-- vendor still gets the scope (functions/days) with their qualified lead.
--
-- Applied: <fill date when run in Supabase>

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS function_count integer,
  ADD COLUMN IF NOT EXISTS wedding_days   integer,
  ADD COLUMN IF NOT EXISTS functions      text;

COMMENT ON COLUMN leads.function_count IS 'Phase 3.5: number of wedding functions, captured at enquiry for brides without a couples record.';
COMMENT ON COLUMN leads.wedding_days   IS 'Phase 3.5: number of days the wedding spans.';
COMMENT ON COLUMN leads.functions      IS 'Phase 3.5: free-text function list (mehendi, sangeet, wedding, reception) captured at enquiry.';
