-- 0059_moments_surface.sql
-- Adds surface column to muse_saves to distinguish personal moments from mood board inspo.
-- surface = 'muse'    → Muse board (default — all existing rows stay muse)
-- surface = 'moments' → Moments room (personal photos, candids, real life)
--
-- No data migration needed. All existing rows default to 'muse'.
-- imageOCRRouter now returns 'muse' | 'receipt' | 'moment' based on Vision labels.
-- museSave.js passes surface through to the insert.

ALTER TABLE muse_saves
  ADD COLUMN IF NOT EXISTS surface text NOT NULL DEFAULT 'muse'
  CHECK (surface IN ('muse', 'moments'));

-- Index for Moments room query (couple_id + surface + created_at)
CREATE INDEX IF NOT EXISTS muse_saves_couple_surface_idx
  ON muse_saves (couple_id, surface, created_at DESC);

COMMENT ON COLUMN muse_saves.surface IS
  'muse = mood board inspo, moments = personal candids/real-life photos';
