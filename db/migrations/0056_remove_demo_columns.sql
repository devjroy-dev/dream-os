-- 0056_remove_demo_columns.sql
-- Remove vendor demo system columns.
-- Demo feature deleted: used real JWTs + phone numbers causing session contamination.
-- Bride demo (tdw_bride_demo_session in localStorage) is unaffected.

ALTER TABLE vendors
  DROP COLUMN IF EXISTS demo_handle,
  DROP COLUMN IF EXISTS demo_active,
  DROP COLUMN IF EXISTS demo_expires_at,
  DROP COLUMN IF EXISTS demo_created_at,
  DROP COLUMN IF EXISTS demo_session_token,
  DROP COLUMN IF EXISTS demo_session_expires_at,
  DROP COLUMN IF EXISTS demo_notes,
  DROP COLUMN IF EXISTS demo_instagram;

-- Also remove the demo_profile_views table if it exists
DROP TABLE IF EXISTS demo_profile_views;
