-- 0040_couple_core.sql
-- Bride Block F: couple core columns

ALTER TABLE couples ADD COLUMN IF NOT EXISTS wedding_date   date;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS wedding_city   text;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS bride_name     text;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS groom_name     text;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS budget_total   integer;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS notes          text;

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS discover_eligible boolean NOT NULL DEFAULT false;

ALTER TABLE muse_saves ADD COLUMN IF NOT EXISTS circle_comment_count integer NOT NULL DEFAULT 0;

ALTER TABLE circle_activity ALTER COLUMN subject_id DROP NOT NULL;
