-- 0039_vendor_discover.sql
-- Block 5 — Vendor Discover submission, photo approval queue,
-- couture appointments, featured promo submissions, admin activity log.
-- vendor_portfolio table created here (Block F only added profile columns to vendors).
-- All statements idempotent. Safe to re-run.

-- ── vendor_portfolio ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_portfolio (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id         uuid        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  image_url         text        NOT NULL,
  caption           text,
  aesthetic_tags    jsonb       NOT NULL DEFAULT '[]'::jsonb,
  is_hero           boolean     NOT NULL DEFAULT false,
  in_carousel       boolean     NOT NULL DEFAULT true,
  approval_state    text        NOT NULL DEFAULT 'pending'
                                CHECK (approval_state IN ('pending','approved','rejected')),
  reviewed_by_admin text,
  reviewed_at       timestamptz,
  rejection_reason  text,
  sort_order        integer     NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendor_portfolio_vendor_idx
  ON vendor_portfolio (vendor_id, approval_state, sort_order);

CREATE INDEX IF NOT EXISTS vendor_portfolio_pending_idx
  ON vendor_portfolio (approval_state, created_at)
  WHERE approval_state = 'pending';

DROP TRIGGER IF EXISTS vendor_portfolio_set_updated_at ON vendor_portfolio;
CREATE TRIGGER vendor_portfolio_set_updated_at BEFORE UPDATE ON vendor_portfolio
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── vendors additions ─────────────────────────────────────────────────────────
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS discover_eligible      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discover_request_state text
    CHECK (discover_request_state IN
      ('not_requested','requested','under_review','approved','denied','revoked')),
  ADD COLUMN IF NOT EXISTS couture_eligible        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_eligible       boolean NOT NULL DEFAULT false;

-- ── vendor_discover_requests ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_discover_requests (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        uuid        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  state            text        NOT NULL CHECK (state IN
                                 ('requested','under_review','approved','denied','revoked')),
  reason           text,
  decided_by_admin text,
  decided_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendor_discover_requests_vendor_idx
  ON vendor_discover_requests (vendor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS vendor_discover_requests_pending_idx
  ON vendor_discover_requests (state, created_at)
  WHERE state IN ('requested', 'under_review');

-- ── couture_appointments ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS couture_appointments (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id            uuid        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  couple_id            uuid        REFERENCES couples(id) ON DELETE SET NULL,
  appointment_at       timestamptz NOT NULL,
  duration_minutes     integer     NOT NULL DEFAULT 60,
  fee_inr              integer     NOT NULL,
  state                text        NOT NULL DEFAULT 'booked'
                                   CHECK (state IN ('booked','confirmed','completed','cancelled','no_show')),
  razorpay_order_id    text,
  paid_at              timestamptz,
  vendor_payout_inr    integer,
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS couture_appointments_vendor_idx
  ON couture_appointments (vendor_id, appointment_at);
CREATE INDEX IF NOT EXISTS couture_appointments_couple_idx
  ON couture_appointments (couple_id, appointment_at);

DROP TRIGGER IF EXISTS couture_appointments_updated_at ON couture_appointments;
CREATE TRIGGER couture_appointments_updated_at BEFORE UPDATE ON couture_appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── couture_availability ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS couture_availability (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id                uuid        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  slot_at                  timestamptz NOT NULL,
  duration_minutes         integer     NOT NULL DEFAULT 60,
  fee_inr                  integer     NOT NULL,
  state                    text        NOT NULL DEFAULT 'open'
                                       CHECK (state IN ('open','booked','blocked')),
  booked_by_appointment_id uuid        REFERENCES couture_appointments(id) ON DELETE SET NULL,
  created_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, slot_at)
);

CREATE INDEX IF NOT EXISTS couture_availability_vendor_state_idx
  ON couture_availability (vendor_id, state, slot_at);

-- ── vendor_featured_submissions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_featured_submissions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id           uuid        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  slot_kind           text        NOT NULL CHECK (slot_kind IN
                                    ('discover_top','spotlight','blind_swipe_priority','newsletter')),
  hero_image_id       uuid        REFERENCES vendor_portfolio(id) ON DELETE SET NULL,
  caption             text,
  proposed_start_date date,
  proposed_end_date   date,
  fee_inr             integer     NOT NULL,
  razorpay_order_id   text,
  paid_at             timestamptz,
  state               text        NOT NULL DEFAULT 'submitted'
                                  CHECK (state IN
                                    ('submitted','under_review','approved','rejected','live','expired','refunded')),
  scheduled_start     timestamptz,
  scheduled_end       timestamptz,
  rejection_reason    text,
  decided_by_admin    text,
  decided_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendor_featured_submissions_vendor_idx
  ON vendor_featured_submissions (vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS vendor_featured_submissions_admin_idx
  ON vendor_featured_submissions (state, created_at)
  WHERE state IN ('submitted', 'under_review');

DROP TRIGGER IF EXISTS vendor_featured_submissions_updated_at ON vendor_featured_submissions;
CREATE TRIGGER vendor_featured_submissions_updated_at BEFORE UPDATE ON vendor_featured_submissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── admin_activity_log ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text        NOT NULL,
  action      text        NOT NULL,
  target_type text,
  target_id   uuid,
  metadata    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_activity_log_target_idx
  ON admin_activity_log (target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_activity_log_admin_idx
  ON admin_activity_log (admin_email, created_at DESC);
