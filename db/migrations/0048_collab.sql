-- 0048_collab.sql
-- Collab feature — vendor-to-vendor requirement board
-- Two new tables: collab_posts, collab_responses
-- Supabase project: nvzkbagqxbysoeszxent (Mumbai)
-- Applied: [date to be filled on application]

-- ── 1. collab_posts ──────────────────────────────────────────────────────────
-- A vendor's posted requirement for a collaborator on a specific date.
-- Anonymised to responders: poster identity hidden until connection accepted.

CREATE TABLE collab_posts (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id            UUID        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- What they need (maps to VENDOR_CATEGORIES in src/agent/categories.js)
  requirement_type     TEXT        NOT NULL
    CHECK (requirement_type IN (
      'photography', 'videography', 'makeup', 'mehendi',
      'decor', 'catering', 'venue', 'music_dj', 'music_live',
      'choreography', 'planning', 'transport', 'invitations',
      'jewellery', 'attire', 'other'
    )),

  -- When and where
  event_date           DATE        NOT NULL,
  city                 TEXT        NOT NULL,
  open_to_other_cities BOOLEAN     NOT NULL DEFAULT false,

  -- Compensation (nullable — some collabs are equity/credit, not cash)
  budget_inr           INTEGER,
  payment_period       TEXT
    CHECK (payment_period IN ('per_day', 'per_shoot', 'total', 'tbd')),

  -- Context
  event_type           TEXT
    CHECK (event_type IN (
      'wedding', 'pre_wedding', 'engagement', 'editorial',
      'brand_shoot', 'portrait', 'other'
    )),
  details              TEXT        CHECK (char_length(details) <= 200),

  -- State machine: open → filled | expired | cancelled
  state                TEXT        NOT NULL DEFAULT 'open'
    CHECK (state IN ('open', 'filled', 'expired', 'cancelled')),

  -- Auto-expire after 30 days
  expires_at           TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '30 days',

  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for vendor's own post list
CREATE INDEX collab_posts_vendor_id_idx
  ON collab_posts (vendor_id, created_at DESC);

-- Index for feed queries: category + city + open state
CREATE INDEX collab_posts_feed_idx
  ON collab_posts (requirement_type, city, state, event_date)
  WHERE state = 'open';

-- Index for cron expiry job
CREATE INDEX collab_posts_expires_idx
  ON collab_posts (expires_at)
  WHERE state = 'open';

-- updated_at trigger (reuses set_updated_at from migration 0001)
CREATE TRIGGER collab_posts_updated_at
  BEFORE UPDATE ON collab_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── 2. collab_responses ───────────────────────────────────────────────────────
-- A vendor's response to a collab post.
-- 'passed' responses are invisible to the poster — they just stop seeing the post.
-- 'interested' responses are visible to the poster (anonymised until accepted).
-- 'accepted' = poster connected — contact shared with both parties.

CREATE TABLE collab_responses (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id              UUID        NOT NULL REFERENCES collab_posts(id) ON DELETE CASCADE,
  responder_vendor_id  UUID        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  state                TEXT        NOT NULL DEFAULT 'interested'
    CHECK (state IN (
      'interested',   -- responder tapped Interested
      'accepted',     -- poster tapped Connect — contact shared with both
      'declined',     -- poster declined this responder
      'withdrawn',    -- responder withdrew their interest
      'passed'        -- responder tapped Pass — hidden from poster
    )),

  -- Notification tracking
  poster_notified_at   TIMESTAMPTZ,  -- when poster received WhatsApp about this response
  contact_shared_at    TIMESTAMPTZ,  -- when poster accepted and contact was shared

  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One response per vendor per post (enforced at DB level)
  UNIQUE (post_id, responder_vendor_id)
);

-- Index for fetching all responses to a post (poster's view)
CREATE INDEX collab_responses_post_id_idx
  ON collab_responses (post_id, state, created_at DESC);

-- Index for fetching this vendor's own responses (filtering already-responded posts)
CREATE INDEX collab_responses_responder_idx
  ON collab_responses (responder_vendor_id, created_at DESC);

-- updated_at trigger
CREATE TRIGGER collab_responses_updated_at
  BEFORE UPDATE ON collab_responses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
