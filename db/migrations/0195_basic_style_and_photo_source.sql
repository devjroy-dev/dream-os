-- db/migrations/0195_basic_style_and_photo_source.sql
-- TDW · CE-47 · WEB-4 cut 16 (and cut 17's columns, as the chair ruled, 6 October 2026). Additive; no table created;
-- no row rewritten (the new columns take their defaults).
--   vendor_sites.style_changed_at  timestamptz NULL: when a PUBLISHED style last changed. Basic may change its one style
--     once every 30 days; the clock starts at Publish when the published style changes (her first published style is
--     free). Written by POST /api/v2/vendor/solutions/site/publish only.
--   vendor_portfolio.source and vendor_look_photos.source  text NOT NULL DEFAULT 'upload', 'upload' | 'instagram':
--     where each photograph came from (cut 17: her own Instagram photographs show on her own site at once; Discover and
--     the card keep their approval for every source). No code writes 'instagram' until cut 17.
-- REVERT (by hand, with a witness): ALTER TABLE ... DROP COLUMN IF EXISTS on the three columns.

BEGIN;

ALTER TABLE public.vendor_sites       ADD COLUMN style_changed_at timestamptz;
ALTER TABLE public.vendor_portfolio   ADD COLUMN source text NOT NULL DEFAULT 'upload';
ALTER TABLE public.vendor_look_photos ADD COLUMN source text NOT NULL DEFAULT 'upload';

DO $c16$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vendor_portfolio_source_check' AND conrelid = 'public.vendor_portfolio'::regclass) THEN
    ALTER TABLE public.vendor_portfolio ADD CONSTRAINT vendor_portfolio_source_check CHECK (source IN ('upload', 'instagram'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vendor_look_photos_source_check' AND conrelid = 'public.vendor_look_photos'::regclass) THEN
    ALTER TABLE public.vendor_look_photos ADD CONSTRAINT vendor_look_photos_source_check CHECK (source IN ('upload', 'instagram'));
  END IF;
END
$c16$;

COMMIT;
