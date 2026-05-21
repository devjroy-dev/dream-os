-- 0041_vendor_about.sql
-- Vendor bio/about field for discover feed and profile.
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS about text;
