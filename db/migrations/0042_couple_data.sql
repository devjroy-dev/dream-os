-- 0042_couple_data.sql
-- B-3: circle comment count triggers + subject_id index on circle_activity.
--
-- WHAT THIS ADDS
--   Index: circle_activity_subject_idx — fast lookup of activity by subject_id
--   Trigger: trg_circle_comment_inc    — increment muse_saves.circle_comment_count on comment insert
--   Trigger: trg_circle_comment_dec    — decrement muse_saves.circle_comment_count on comment delete
--
-- NOTE: 0041 is vendor_about.sql (already applied). This is the correct next sequence number.
-- NOTE: muse_saves.circle_comment_count column was added in 0040_couple_core.sql.
-- NOTE: circle_activity.subject_id was made nullable in 0040_couple_core.sql.
--
-- IMMUTABILITY: never edit this file. Changes go in 0043+.

CREATE INDEX IF NOT EXISTS circle_activity_subject_idx
  ON circle_activity(subject_id) WHERE subject_id IS NOT NULL;

CREATE OR REPLACE FUNCTION increment_circle_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.subject_type = 'muse_save' AND NEW.activity_type = 'comment' AND NEW.subject_id IS NOT NULL THEN
    UPDATE muse_saves SET circle_comment_count = circle_comment_count + 1
    WHERE id = NEW.subject_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_circle_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.subject_type = 'muse_save' AND OLD.activity_type = 'comment' AND OLD.subject_id IS NOT NULL THEN
    UPDATE muse_saves SET circle_comment_count = GREATEST(0, circle_comment_count - 1)
    WHERE id = OLD.subject_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_circle_comment_inc ON circle_activity;
CREATE TRIGGER trg_circle_comment_inc
  AFTER INSERT ON circle_activity
  FOR EACH ROW EXECUTE FUNCTION increment_circle_comment_count();

DROP TRIGGER IF EXISTS trg_circle_comment_dec ON circle_activity;
CREATE TRIGGER trg_circle_comment_dec
  AFTER DELETE ON circle_activity
  FOR EACH ROW EXECUTE FUNCTION decrement_circle_comment_count();
