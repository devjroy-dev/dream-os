-- 0065_couple_wedding_shape.sql
-- Phase 3.5 Layer 0 — capture that an Indian wedding is a SPAN, not one date.
-- Asked once at bride onboarding (new state: asked_functions, after the date).
-- Every category profile (Layer 1) reads from this instead of re-asking
-- "which functions" per enquiry.
--
-- Applied: <fill date when run in Supabase>

ALTER TABLE couples
  ADD COLUMN IF NOT EXISTS function_count integer,          -- how many functions (e.g. 3)
  ADD COLUMN IF NOT EXISTS wedding_days   integer,          -- how many days it spans (e.g. 3)
  ADD COLUMN IF NOT EXISTS functions      text;             -- free-text list, e.g. "mehendi, sangeet, wedding, reception"

COMMENT ON COLUMN couples.function_count IS 'Phase 3.5: number of wedding functions (mehendi/sangeet/wedding/reception). Captured at onboarding.';
COMMENT ON COLUMN couples.wedding_days   IS 'Phase 3.5: number of days the wedding spans.';
COMMENT ON COLUMN couples.functions      IS 'Phase 3.5: free-text list of the functions, as the bride described them. Read by category profiles instead of re-asking.';
