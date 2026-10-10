-- db/migrations/0224_weddings_deleted_at.sql · TDW · CE-47 · UX-S1 P4 (11 October 2026).
-- A vendor can delete a wedding page she owns. The door (src/api/vendor/studio/weddings.js DELETE /:id) sets deleted_at and
-- returns the page to draft in one write; every public reader already requires a published page, so it leaves her site at
-- once. Her photographs, credits and stored pictures are untouched. Additive: one nullable column, no backfill.
-- REVERT (by hand, with a witness): ALTER TABLE public.weddings DROP COLUMN IF EXISTS deleted_at;

BEGIN;

ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

COMMIT;
