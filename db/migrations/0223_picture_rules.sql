-- db/migrations/0223_picture_rules.sql · TDW · CE-47 · WEB-4 cut 30 · R-47.2, THE FOUNDER'S RULE OF 8 OCTOBER 2026.
-- A vendor's pictures belong to her: an upload is live at once on her own pages; Google's safety check holds only what
-- it flags; the admin's one power is "hide from Discover"; a Dreamer's report goes to the admin and hides nothing.
-- The rules are read in one place, src/lib/vendor/pictureRules.js. This file adds the state they read:
--   vendor_portfolio    + safety_state, safety_checked_at, safety_scores, discover_hidden_at, discover_hidden_by
--   vendor_look_photos  + safety_state, safety_checked_at, safety_scores  (no look reaches Discover)
--   picture_reports     one report per Dreamer per picture (UNIQUE), for the admin; it never hides anything
--   picture_notices     what she is told on her portfolio (a removal for a legal reason), with when she saw it
-- approval_state, reviewed_at, reviewed_by_admin and rejection_reason stay as HISTORY, read by nothing; a later
-- migration drops them once a full train has run with no reader.
-- SWITCH DAY (the founder's Choice 1, 8 October 2026, 21:12), in this transaction:
--   approved -> 'passed' (a person already looked); pending and rejected -> 'unchecked' (the safety pass checks them
--   minutes later; the gap is ruled); rejected -> also hidden from Discover, by 'switch day: was rejected'.
--   After-check on the live counts of 8 October: passed 59, unchecked 19, hidden 14.
-- RLS on and the four service_role grants for each new table, in this transaction (e-273). Additive otherwise.
-- REVERT (by hand, with a witness):
--   DROP TABLE IF EXISTS public.picture_notices; DROP TABLE IF EXISTS public.picture_reports;
--   ALTER TABLE public.vendor_look_photos DROP COLUMN IF EXISTS safety_scores, DROP COLUMN IF EXISTS safety_checked_at,
--     DROP COLUMN IF EXISTS safety_state;
--   ALTER TABLE public.vendor_portfolio DROP COLUMN IF EXISTS discover_hidden_by, DROP COLUMN IF EXISTS discover_hidden_at,
--     DROP COLUMN IF EXISTS safety_scores, DROP COLUMN IF EXISTS safety_checked_at, DROP COLUMN IF EXISTS safety_state;

BEGIN;

ALTER TABLE public.vendor_portfolio
  ADD COLUMN IF NOT EXISTS safety_state       text        NOT NULL DEFAULT 'unchecked' CHECK (safety_state IN ('unchecked', 'passed', 'held')),
  ADD COLUMN IF NOT EXISTS safety_checked_at  timestamptz,
  ADD COLUMN IF NOT EXISTS safety_scores      jsonb,
  ADD COLUMN IF NOT EXISTS discover_hidden_at timestamptz,
  ADD COLUMN IF NOT EXISTS discover_hidden_by text        CHECK (discover_hidden_by IS NULL OR char_length(discover_hidden_by) <= 120);

ALTER TABLE public.vendor_look_photos
  ADD COLUMN IF NOT EXISTS safety_state       text        NOT NULL DEFAULT 'unchecked' CHECK (safety_state IN ('unchecked', 'passed', 'held')),
  ADD COLUMN IF NOT EXISTS safety_checked_at  timestamptz,
  ADD COLUMN IF NOT EXISTS safety_scores      jsonb;

-- the sweep's read: the few pictures still to check
CREATE INDEX IF NOT EXISTS vendor_portfolio_unchecked_idx   ON public.vendor_portfolio (created_at)   WHERE safety_state = 'unchecked';
CREATE INDEX IF NOT EXISTS vendor_look_photos_unchecked_idx ON public.vendor_look_photos (created_at) WHERE safety_state = 'unchecked';
-- the admin queue's read: what is held
CREATE INDEX IF NOT EXISTS vendor_portfolio_held_idx        ON public.vendor_portfolio (created_at)   WHERE safety_state = 'held';

CREATE TABLE IF NOT EXISTS public.picture_reports (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  picture_id       uuid        NOT NULL REFERENCES public.vendor_portfolio(id) ON DELETE CASCADE,
  vendor_id        uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  reporter_user_id uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason           text        NOT NULL CHECK (reason IN ('not_wedding_work', 'not_their_work', 'offensive', 'other')),
  note             text        CHECK (note IS NULL OR char_length(note) <= 300),
  created_at       timestamptz NOT NULL DEFAULT now(),
  handled_at       timestamptz,
  handled_by       text        CHECK (handled_by IS NULL OR char_length(handled_by) <= 120),
  outcome          text        CHECK (outcome IS NULL OR outcome IN ('hidden_from_discover', 'no_change')),
  UNIQUE (picture_id, reporter_user_id)
);
CREATE INDEX IF NOT EXISTS picture_reports_open_idx ON public.picture_reports (created_at) WHERE handled_at IS NULL;

CREATE TABLE IF NOT EXISTS public.picture_notices (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id  uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  line       text        NOT NULL CHECK (char_length(line) BETWEEN 1 AND 400),
  created_at timestamptz NOT NULL DEFAULT now(),
  seen_at    timestamptz
);
CREATE INDEX IF NOT EXISTS picture_notices_vendor_idx ON public.picture_notices (vendor_id, created_at DESC);

ALTER TABLE public.picture_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.picture_notices ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.picture_reports TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.picture_notices TO service_role;

-- SWITCH DAY, Choice 1
UPDATE public.vendor_portfolio   SET safety_state = 'passed' WHERE approval_state = 'approved';
UPDATE public.vendor_look_photos SET safety_state = 'passed' WHERE approval_state = 'approved';
UPDATE public.vendor_portfolio   SET discover_hidden_at = now(), discover_hidden_by = 'switch day: was rejected'
  WHERE approval_state = 'rejected' AND discover_hidden_at IS NULL;

COMMIT;
