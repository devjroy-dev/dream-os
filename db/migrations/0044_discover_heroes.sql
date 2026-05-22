-- 0044_discover_heroes.sql
-- Vendor hero cards shown at the top of the bride's Frost discover feed.
-- Managed by admin only. Cloudinary-hosted images.

CREATE TABLE IF NOT EXISTS discover_heroes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id     uuid        REFERENCES vendors(id) ON DELETE CASCADE,
  image_url     text        NOT NULL,
  caption       text,
  display_order integer     NOT NULL DEFAULT 0,
  active        boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discover_heroes_active ON discover_heroes(active, display_order);
