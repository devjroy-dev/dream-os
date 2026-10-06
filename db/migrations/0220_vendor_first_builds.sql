-- db/migrations/0220_vendor_first_builds.sql
-- TDW · CE-47 · WEB-4 cut 19 · THE FIRST-BUILD DOOR'S PROGRESS (the chair's ruling, 6 October 2026: 0220; PTN holds
-- 0216-0219). One row per first build: which of the five steps are waiting, running, done, skipped or failed, so the
-- app can poll it and a restart resumes from the last finished step. At most one RUNNING build per vendor.
-- RLS on and the grants in the same transaction (e-273). Additive; nothing else changes.
-- REVERT (by hand, with a witness): DROP TABLE IF EXISTS public.vendor_first_builds;

BEGIN;

CREATE TABLE public.vendor_first_builds (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id   uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  state       text        NOT NULL DEFAULT 'running' CHECK (state IN ('running', 'done', 'failed')),
  steps       jsonb       NOT NULL DEFAULT '[]'::jsonb,
  started_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE UNIQUE INDEX vendor_first_builds_one_running ON public.vendor_first_builds (vendor_id) WHERE state = 'running';
CREATE INDEX vendor_first_builds_vendor ON public.vendor_first_builds (vendor_id, started_at DESC);
ALTER TABLE public.vendor_first_builds ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_first_builds TO service_role;

COMMIT;
