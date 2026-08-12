-- 0121_couple_ai_usage_cache_columns.sql
-- TDW_10.C · DELIVERY 2 — F-10.117. THE LEDGER LEARNS TO PROVE ITS OWN NUMBER.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHY THIS NUMBER
-- ═══════════════════════════════════════════════════════════════════════════
-- Re-derived at THIS seat's tip (dream-os 850973e), not carried: `ls
-- db/migrations/` tail is 0120_couple_ai_ledger.sql (this sitting's delivery 1,
-- applied and sealed). 0113 remains RESERVED-UNWRITTEN and its hole is left
-- intact — LD-8 forbids reuse and forbids filling it. This file takes 0121.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHAT THIS CURES — F-10.117, FOUND BY PRICING A LIVE ROW
-- ═══════════════════════════════════════════════════════════════════════════
-- The first production row the meter ever wrote (2026-08-11 22:04:28 UTC):
--
--     input_tokens 707 · output_tokens 54 · cost_inr 1.66
--
-- Priced against the ONE cost home (src/engine/src/core/models.ts: Haiku
-- $1.00/M in, $5.00/M out, USD→INR pinned at 100), those two columns yield:
--
--     (707/1e6 × 1.00) + (54/1e6 × 5.00) = $0.000977 × 100 = ₹0.10
--
-- ₹0.10, against a stored ₹1.66. THE STORED NUMBER IS CORRECT — the gap is the
-- prompt cache. brideEngine.js:227 caches STATIC_SYSTEM_PROMPT as ephemeral; a
-- cache WRITE bills at 1.25× input (CACHE_WRITE_MULT), so ~₹1.56 ≈ 12.5k
-- cache-write tokens, the first turn of the hour priming Mira's static prefix.
-- `calcCostInr` received those tokens and priced them. THE LEDGER SIMPLY DID
-- NOT KEEP THEM.
--
-- Three consequences, all real:
--   1. SPEND TOTALS ARE CORRECT. Nothing is under-counted. This is not a money
--      bug and no row is wrong.
--   2. THE AUDIT TRAIL IS NOT REPRODUCIBLE. No reader can derive ₹1.66 from the
--      stored token columns. The next person to check the arithmetic gets ₹0.10
--      and has to reconstruct the cache theory from scratch — which is exactly
--      what this seat did, and the reason the finding exists.
--   3. CACHE-HIT ECONOMICS ARE INVISIBLE. Whether Mira's prefix caches well is a
--      live cost question — the difference between ₹1.66 and ₹0.24 on otherwise
--      similar turns — and this table could not answer it.
--
-- THE LESSON WAS ALREADY PAID FOR ONE PLANE OVER. docs/db/ENGINE_SCHEMA.md
-- `## engine.usage · 12 columns` carries them as columns 11 and 12:
--     11. cache_read_tokens integer
--     12. cache_write_tokens integer
-- added by the 02-HOTFIX F12 DDL. Delivery 1 mirrored engine.usage's SHAPE and
-- did not mirror its HISTORY. Named plainly: that was this seat's omission, and
-- it was caught by pricing a production row rather than by any bench.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- NO BACKFILL IS POSSIBLE. THE GAP IS THE GAP. (0116's own precedent.)
-- ═══════════════════════════════════════════════════════════════════════════
-- The cache token counts for rows already written are GONE — they lived in an
-- Anthropic response object that was read for cost and then discarded. Nothing
-- reconstructs them: cost_inr cannot be inverted (four unknowns, one equation),
-- and re-running the turns would price different traffic on a different day.
--
-- So every row written between 2026-08-11 22:04 UTC and this migration carries
-- NULL cache columns and a cost_inr that its own tokens cannot explain. That is
-- stated here, in the migration, exactly as 0116 stated its own: 「 BACKFILL:
-- NONE. The pre-fix gap is the gap 」 (src/agent/harvest.js:78, the TDW_06 meter
-- fix's identical situation).
--
-- NULL therefore MEANS TWO DIFFERENT THINGS on this column, and a reader must
-- know which: (a) written before this migration — unknown, unrecoverable;
-- (b) written after, on a call that used no cache — genuinely zero. The
-- discriminator is `created_at` against this migration's run time, and the
-- COMMENT ON COLUMN below carries that sentence into the database itself so no
-- future reader has to find this file.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- COLUMN PROVENANCE (SQL-provenance law — every column, its witness)
-- ═══════════════════════════════════════════════════════════════════════════
--   public.couple_ai_usage — FOUNDER-RUN information_schema, 2026-08-12, pasted
--     to this seat after 0120 applied; twelve columns, in order:
--       id · couple_id · circle_member_id · turn_id · kind · provider · model ·
--       input_tokens · output_tokens · cost_inr · cost_basis · created_at
--     `input_tokens integer` and `output_tokens integer` are the shape the two
--     columns below match — integer, nullable — chosen to mirror them rather
--     than invented.
--
--   engine.usage cols 11-12 — docs/db/ENGINE_SCHEMA.md `## engine.usage · 12
--     columns`: `11. cache_read_tokens integer` / `12. cache_write_tokens
--     integer`. The NAMES ARE COPIED DELIBERATELY, not re-coined: the two
--     ledgers are separate by the Plane Doctrine (0120's plane argument) but a
--     reader moving between them should not have to translate a column name.
--
--   NO OTHER TABLE IS TOUCHED. No CHECK, no FK, no default, no index change.
--
-- ADDITIVE AND NON-BREAKING BY CONSTRUCTION: two nullable columns on a table
-- whose only writer is src/lib/coupleAiCap.js. A tree carrying the OLD writer
-- against this schema writes NULLs and keeps working; a tree carrying the NEW
-- writer against the OLD schema fails its insert, warns, and the bride still
-- gets her reply (fail-open, combined_cap §3.4). Neither order breaks the
-- product — but the SQL runs FIRST, as ever, so the grace is never spent.

BEGIN;

ALTER TABLE public.couple_ai_usage
  ADD COLUMN IF NOT EXISTS cache_read_tokens  integer,
  ADD COLUMN IF NOT EXISTS cache_write_tokens integer;

COMMENT ON COLUMN public.couple_ai_usage.cache_read_tokens IS
  'Anthropic cache_read_input_tokens for this call, billed at 0.1x the input rate. '
  'NULL means UNKNOWN for any row created before migration 0121 (no backfill was '
  'possible — the counts were discarded after pricing, F-10.117); NULL on a later '
  'row means the call used no cache. Discriminate by created_at.';

COMMENT ON COLUMN public.couple_ai_usage.cache_write_tokens IS
  'Anthropic cache_creation_input_tokens for this call, billed at 1.25x the input '
  'rate. Same NULL semantics as cache_read_tokens: unknown before 0121, genuine '
  'zero after. Together with input_tokens and output_tokens these four columns '
  'reproduce cost_inr through calcCostInr — which is the whole point of F-10.117.';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- THE VERIFY. ONE STATEMENT, ONE RESULT SET — and that is a fix, not a style.
-- ═══════════════════════════════════════════════════════════════════════════
-- 0120's verify shipped as FIVE separate SELECTs. The Supabase editor renders
-- only the LAST statement's rows, so four of its five assertions were invisible
-- to the founder who ran it — a verify whose output nobody can read is not a
-- verify. Self-caught when his screenshot showed one result pane. Every verify
-- from this file forward returns a single result set.
--
-- Expect FIVE rows:
--   columns          → 14, ending ... cost_basis, created_at, cache_read_tokens,
--                      cache_write_tokens
--   column_count     → 14
--   pre_0121_rows    → the rows whose cache columns are permanently unknown
--   post_0121_rows   → 0 at this moment (the writer ships in the ZIP, after this)
--   ledger_rows      → the total so far

SELECT 'columns' AS check_name,
       string_agg(column_name || ' ' || data_type, ' | ' ORDER BY ordinal_position) AS result
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'couple_ai_usage'
UNION ALL
SELECT 'column_count', count(*)::text
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'couple_ai_usage'
UNION ALL
SELECT 'pre_0121_rows_cache_unknown', count(*)::text
FROM public.couple_ai_usage
WHERE cache_read_tokens IS NULL AND cache_write_tokens IS NULL
UNION ALL
SELECT 'post_0121_rows_with_cache', count(*)::text
FROM public.couple_ai_usage
WHERE cache_read_tokens IS NOT NULL OR cache_write_tokens IS NOT NULL
UNION ALL
SELECT 'ledger_rows_total', count(*)::text
FROM public.couple_ai_usage;

-- ═══════════════════════════════════════════════════════════════════════════
-- THE REVERT DIRECTION — COMMENTED, NEVER RUNNABLE BESIDE THE BLOCK IT REVERSES
-- ═══════════════════════════════════════════════════════════════════════════
-- Per the conditional-withheld rule: this exists so the direction is not
-- reconstructed under pressure, and it is commented so a paste cannot run it
-- seconds after the block above. To use it, uncomment the body and run it alone.
--
-- ⚠ DROP COLUMN IS DESTRUCTIVE under protocol §4 — founder sign-off recorded, a
-- CSV export of the object taken FIRST, the action logged in the handover. And
-- unlike 0116's revert this one IS lossy the moment any row has been written
-- with the new writer: those cache counts exist nowhere else and dropping the
-- columns destroys them exactly as the pre-0121 gap destroyed the earlier ones.
--
-- THE CODE DOES NOT REVERT WITH IT. A tree carrying delivery 2's
-- src/lib/coupleAiCap.js will send two columns that no longer exist; the insert
-- fails, warns, and the row is LOST — fail-open keeps the bride's reply but the
-- meter goes blind. Revert the code in the same act or not at all.
--
-- BEGIN;
--   ALTER TABLE public.couple_ai_usage
--     DROP COLUMN IF EXISTS cache_read_tokens,
--     DROP COLUMN IF EXISTS cache_write_tokens;
-- COMMIT;
