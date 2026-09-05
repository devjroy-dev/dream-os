-- db/migrations/0136_consent_attempts.sql
-- TDW · BLOCK 19 · G1.2 — THE LAST-FOUR CHECK'S COUNTER (R-G12.18.4, F-40.105)
--
-- Append-only, founder-run, idempotent. Ladder tip before this file: 0135.
-- Derived by `ls db/migrations/ | sort | tail`, not recalled — 0134 is the G2
-- seat's (reviews and seal) and 0135 is G5.1's (lead referrals), both applied.
-- This sits AT the tip, so it takes NO record in OUT_OF_ORDER.json.
--
-- ⚠ FOUNDER-RUN IN THE SUPABASE EDITOR, BEFORE THE dream-os ZIP IS APPLIED.
--
-- ═══ WHY A COLUMN AND NOT A COUNTER IN MEMORY ══════════════════════════════
-- "Three wrong tries and the token is spent" is a promise about a TOKEN, not
-- about a process. An in-memory counter resets on every deploy and is not shared
-- between replicas, so a patient guesser gets three tries per restart and three
-- more per instance — which is not three. The count belongs beside the thing it
-- protects.
--
-- ═══ SQL-PROVENANCE · R-40.27 ══════════════════════════════════════════════
-- public.weddings — columns :1224 (13 at the 2026-09-05 regen) plus 0133's three
--   (`consent_token`, `consent_sent_at`, `consent_phone` at 0133:102-104), which
--   no snapshot yet describes. Constraints :1998-2006, verbatim:
--     [CHECK]       weddings_visibility_check
--         CHECK ((visibility = ANY (ARRAY['draft','published'])))
--     [PRIMARY KEY] weddings_pkey             PRIMARY KEY (id)
--     [UNIQUE]      weddings_owner_slug_key   UNIQUE (owner_vendor_id, slug)
--   NEITHER CHECK mentions the column added below. It is NOT NULL with a
--   DEFAULT, so no existing row can violate anything and the ALTER cannot fail
--   on data. `idx_weddings_live` and `idx_weddings_consent_token` are NOT
--   touched, NOT dropped and NOT redefined.

BEGIN;

-- ── THE ATTEMPT COUNTER ─────────────────────────────────────────────────────
-- Counts WRONG answers only. A correct one does not reset it either: a token
-- that has already survived two guesses is a token someone has been working on,
-- and forgiving that on a lucky third would hand the guesser an unlimited budget.
--
-- SPENDING IS `consent_token = NULL`, not a flag. A NULL token cannot be found
-- by `findWeddingByConsentToken`, so a spent token, a forged one, an expired one
-- and one that never existed all reach the same miss — the crew constitution's
-- own law, enforced by the lookup rather than by a branch that could be reordered.
ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS consent_attempts integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.weddings.consent_attempts IS
  'Wrong last-four answers against this consent token (R-G12.18.4). At 3 the token is SPENT by setting consent_token NULL, so a spent token is indistinguishable from an absent one. Reset only by minting a new token.';

COMMIT;

-- OWED AFTER THIS RUNS: nothing beyond the standing pair-regen debt. This file
-- and 0133 are the sole witnesses for the four consent columns until the next
-- regen; cite them by line, never the snapshot, for anything about them.
