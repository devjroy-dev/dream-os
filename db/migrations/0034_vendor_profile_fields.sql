-- 0034_vendor_profile_fields.sql
-- Block F — vendor profile columns for Discover and rate display.
-- Applied directly to prod during Block F session (2026-05-19).
-- This file is a retrospective record for migration history completeness.
-- Safe to re-run — all statements are idempotent.

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS aesthetic_tags   jsonb    NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rate_min         integer;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rate_max         integer;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS discover_preview boolean  NOT NULL DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS style_notes      text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS travel_notes     text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS briefing_enabled boolean  NOT NULL DEFAULT true;

COMMENT ON COLUMN vendors.aesthetic_tags   IS 'Discover aesthetic profile. Array of string tags (moody, editorial, film, etc). Populated via vendor PWA settings.';
COMMENT ON COLUMN vendors.rate_min         IS 'Minimum rate in Rs. Displayed on Discover profile.';
COMMENT ON COLUMN vendors.rate_max         IS 'Maximum rate in Rs. Displayed on Discover profile.';
COMMENT ON COLUMN vendors.discover_preview IS 'When true, vendor appears in bride Discover FEED preview. Admin-managed toggle.';
COMMENT ON COLUMN vendors.style_notes      IS 'Free-text style description. Shown on Discover profile.';
COMMENT ON COLUMN vendors.travel_notes     IS 'Travel preferences and notes. Used by PWA agent context.';
COMMENT ON COLUMN vendors.briefing_enabled IS 'Kill switch for morning WhatsApp briefing. Default true.';
