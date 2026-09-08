-- ═══════════════════════════════════════════════════════════════════════════
-- 0150 · BLOCK 20 · CONCIERGE s1 — F-41.26 · the founder notify gets a wamid home
-- CE-41 seat A, rider under R-41.63. Cut at dream-os 2a0d838. Ladder tail
-- derived: `ls db/migrations | grep -E '^[0-9]{4}' | sort | tail -1` → 0149.
--
-- WHY: the founder's "Assistance request" line was free-form text on the vendor
-- lane and failed at Meta 131047 (re-engagement) outside the 24-hour window
-- (Railway 2026-09-08 18:00:57, the founder's glass). The cure is the founder-
-- filed Utility template `tdw_admin_assist_request` (Meta ID 1106894635324625).
-- A template send returns a wamid, and R-40.110 (in full, R-41.15) says: the
-- table that holds a wamid gains its receipt-router arm and its partial UNIQUE
-- in the same delivery. This file is that delivery's DDL half.
--
-- The column is `notify_wamid`, not `wamid`: this row will one day carry the
-- couple-facing "we found you" send too (seat D, tdw_assist_found_*), and two
-- sends on one row need two named homes. The router arm keys on this column.
--
-- PROVENANCE: public.assistance_requests — db/migrations/0148_assistance_requests.sql §1;
-- docs/db/PUBLIC_SCHEMA.md (0148 snapshot) `## public.assistance_requests`.
-- Sole-writer note (0148 header) stands: notify_* is written by notifyFounder in
-- src/lib/couple/assistance.js and UPDATED by relayStatus.witnessStatusMatch only.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.assistance_requests
  ADD COLUMN IF NOT EXISTS notify_wamid       text        NULL,
  ADD COLUMN IF NOT EXISTS notify_status      text        NULL,
  ADD COLUMN IF NOT EXISTS notify_error_code  text        NULL,
  ADD COLUMN IF NOT EXISTS notify_error_title text        NULL,
  ADD COLUMN IF NOT EXISTS notify_sent_at     timestamptz NULL;

COMMENT ON COLUMN public.assistance_requests.notify_wamid IS
  'Meta wamid of the founder notify (tdw_admin_assist_request, Utility). NULL when the send was refused before Meta answered; see notify_status/notify_error_code. Receipt router updates by this column (0150).';

CREATE INDEX IF NOT EXISTS idx_assistance_requests_notify_wamid
  ON public.assistance_requests (notify_wamid) WHERE notify_wamid IS NOT NULL;

-- R-40.110: partial UNIQUE, so the router never has to guess between two rows.
CREATE UNIQUE INDEX IF NOT EXISTS uq_assistance_requests_notify_wamid
  ON public.assistance_requests (notify_wamid) WHERE notify_wamid IS NOT NULL;
