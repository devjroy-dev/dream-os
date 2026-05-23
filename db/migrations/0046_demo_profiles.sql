-- 0046_demo_profiles.sql
-- Demo profile system for vendor acquisition outreach
-- Adds: demo columns to vendors, demo_profile_views tracking table

-- ── 1. Demo columns on vendors table ─────────────────────────────────────────

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS demo_active       BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_expires_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS demo_created_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS demo_handle       TEXT,
  ADD COLUMN IF NOT EXISTS demo_instagram    TEXT,
  ADD COLUMN IF NOT EXISTS demo_notes        TEXT;

-- Unique constraint on demo_handle (case-insensitive lookup)
CREATE UNIQUE INDEX IF NOT EXISTS vendors_demo_handle_unique
  ON vendors (LOWER(demo_handle))
  WHERE demo_handle IS NOT NULL;

-- Index for cron job — find expired demo profiles efficiently
CREATE INDEX IF NOT EXISTS vendors_demo_expires_idx
  ON vendors (demo_expires_at)
  WHERE demo_active = true;

-- ── 2. Demo profile views tracking ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS demo_profile_views (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id    UUID        REFERENCES vendors(id) ON DELETE CASCADE,
  handle       TEXT        NOT NULL,
  event        TEXT        NOT NULL
    CHECK (event IN (
      'landing_viewed',
      'studio_entered',
      'chat_started',
      'enquiry_tapped',
      'cta_tapped',
      'bride_demo_viewed'
    )),
  viewed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent   TEXT,
  referrer     TEXT
);

CREATE INDEX IF NOT EXISTS demo_views_vendor_id_idx
  ON demo_profile_views (vendor_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS demo_views_handle_idx
  ON demo_profile_views (handle, viewed_at DESC);

CREATE INDEX IF NOT EXISTS demo_views_event_idx
  ON demo_profile_views (event, viewed_at DESC);

-- ── 3. Enquiry taps table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS enquiry_taps (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  handle     TEXT        NOT NULL,
  source     TEXT,
  tapped_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS enquiry_taps_handle_idx
  ON enquiry_taps (handle, tapped_at DESC);

CREATE INDEX IF NOT EXISTS enquiry_taps_tapped_at_idx
  ON enquiry_taps (tapped_at DESC);
