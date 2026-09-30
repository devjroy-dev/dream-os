-- db/migrations/0188_look_photo_review.sql
-- TDW · CE-47 · WEB-4 cut 4 · A LOOK PHOTO'S REVIEW: the reason the admin gives when a photo is not approved, and when.
-- Number derived at origin at the cut (main 995496d; 0186 reserved by the chair for G6-6).
-- The ruling: CE-47 accepted the look-photo reason riding cut 4 (30 September 2026), so her room can say WHY a photo was
-- not approved, as her portfolio already does (vendor_portfolio.rejection_reason, PUBLIC_SCHEMA.md).
-- ALTERS public.vendor_look_photos (0187): + rejection_reason, + reviewed_at. Nothing dropped; no data touched; the
-- table's RLS and its four grants to service_role (0187) carry to the new columns.
-- Witness: public.vendor_look_photos, db/migrations/0187_site_content_model.sql.
-- REVERT (by hand, with a witness; never run as part of this file):
--   ALTER TABLE public.vendor_look_photos DROP COLUMN rejection_reason, DROP COLUMN reviewed_at;

BEGIN;

ALTER TABLE public.vendor_look_photos
  ADD COLUMN rejection_reason text CHECK (rejection_reason IS NULL OR char_length(rejection_reason) BETWEEN 1 AND 200),
  ADD COLUMN reviewed_at      timestamptz;

COMMIT;
