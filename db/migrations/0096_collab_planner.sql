-- 0096_collab_planner.sql — TDW_04.5 P4. COMMITTED BYTE-AS-RUN (founder-run
-- 2026-07-22 from the chair's relay; seam-authored vs the founder's own
-- information_schema paste; §F item_id added by CE ruling PRE-apply).
-- ⚠ NOT RE-RUNNABLE: ADD CONSTRAINT has no IF NOT EXISTS — a double-run hits
-- 42710 and the implicit transaction absorbs it (witnessed at apply). Never
-- edit; corrections go in 0099+ (0097/0098 re-homed to TDW_13/14 at CE-59).
CREATE TABLE IF NOT EXISTS collab_post_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES collab_posts(id) ON DELETE CASCADE,
  position SMALLINT NOT NULL DEFAULT 0,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN (
    'photography','videography','makeup','mehendi','decor','catering',
    'venue','music_dj','music_live','choreography','planning','transport',
    'invitations','jewellery','attire','other')),
  note TEXT,
  filled_by_response_id UUID REFERENCES collab_responses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS collab_post_items_order_idx
  ON collab_post_items (post_id, position);
CREATE INDEX IF NOT EXISTS collab_post_items_type_idx
  ON collab_post_items (requirement_type, post_id);
CREATE TABLE IF NOT EXISTS vendor_roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  member_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  name TEXT NOT NULL, phone TEXT, category TEXT,
  source TEXT NOT NULL CHECK (source IN ('collab_accepted','manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS vendor_roster_member_idx
  ON vendor_roster (owner_vendor_id, member_vendor_id) WHERE member_vendor_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS vendor_roster_phone_idx
  ON vendor_roster (owner_vendor_id, phone) WHERE member_vendor_id IS NULL;
ALTER TABLE collab_posts ADD COLUMN IF NOT EXISTS first_look_until TIMESTAMPTZ;
ALTER TABLE team_members
  ADD CONSTRAINT team_members_roster_vendor_id_fkey
  FOREIGN KEY (roster_vendor_id) REFERENCES vendor_roster(id) ON DELETE SET NULL;
INSERT INTO admin_config (key, value, description)
VALUES ('collab.first_look_hours','12',
  'Hours a new collab post stays visible only to the poster''s roster.')
ON CONFLICT (key) DO NOTHING;
ALTER TABLE collab_responses
  ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES collab_post_items(id) ON DELETE SET NULL;
