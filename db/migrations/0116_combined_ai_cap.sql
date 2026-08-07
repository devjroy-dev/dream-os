-- 0116_combined_ai_cap.sql
-- TDW_10 · F-10.100 — ONE ALLOWANCE, TWO DOORS. The key family follows the fact.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHY THIS NUMBER
-- ═══════════════════════════════════════════════════════════════════════════
-- Re-derived at THIS seat's tip (dream-os 556e164), not carried from the
-- charter: `ls db/migrations/` tail is 0115_tier_vocabulary.sql; 0114 before it;
-- 0113 remains RESERVED-UNWRITTEN for 0113_admin_control.sql (TDW_10_ADMIN_FINAL
-- §2, re-homed by R-A6, amended at R-P3.2/CE-201); no 0116 exists. LD-8 forbids
-- reuse and forbids filling 0113's hole, so this file takes 0116 and leaves the
-- hole intact.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHAT THIS CURES, AND WHY IT IS A CONFIG CHANGE RATHER THAN A SCHEMA ONE
-- ═══════════════════════════════════════════════════════════════════════════
-- The turn counter was ALREADY combined. src/engine/src/core/loop.ts writes one
-- engine.usage row per turn carrying agent_id and conversation_id and no lane
-- column; both the PWA door and the WhatsApp door run that same runTurn against
-- the same agent (one helper, src/api/middleware/agentBridge.js). So the meter
-- in src/api/vendor-engine/chat.js has been counting BOTH lanes since it was
-- written. Only the refusal was missing on one of them.
--
-- The keys, however, still spoke as if there were two allowances:
--   vendor_pwa_daily_*  / vendor_pwa_monthly_*  — read, by the meter
--   vendor_wa_daily_*   / vendor_wa_monthly_*   — read by NOBODY (F-10.87,
--                                                 proven by two independent
--                                                 methods: literal grep across
--                                                 src/, and an interpolation
--                                                 sweep that finds exactly two
--                                                 config keys in the whole tree)
--
-- Founder-ruled 2026-08-07: ONE family, `vendor_ai_*`, because there is one
-- allowance and it is spent from two doors. Both old families retire from the
-- admin console in the same delivery that gives the new one its reader.
--
-- NO DDL. No table, no column, no constraint. Eight rows in an existing
-- key/value store. The cure is a rename of a fact, and the fact already existed.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- COLUMN PROVENANCE (SQL-provenance law — every column, its witness)
-- ═══════════════════════════════════════════════════════════════════════════
--   public.admin_config — docs/db/PUBLIC_SCHEMA.md, section
--                         `## public.admin_config · 4 columns`:
--                           key         text NOT NULL
--                           value       text NOT NULL
--                           description text
--                           updated_at  timestamptz NOT NULL default now()
--                         and, from the same document's constraint section
--                         `### public.admin_config`:
--                           [PRIMARY KEY] admin_config_pkey PRIMARY KEY (key)
--                         The PK is what makes `ON CONFLICT (key)` legal below;
--                         it is cited rather than assumed.
--
--   NO OTHER TABLE IS TOUCHED. `public.vendors` is read by neither statement in
--   this file — the tier words below are the four the 0115 CHECK admits
--   (basic · essential · signature · prestige), written as literals in the key
--   names, not selected from any row.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHY SEED-FROM-SOURCE-ROW, AND NOT LITERALS — 0115's pattern, its reason
-- ═══════════════════════════════════════════════════════════════════════════
-- Each INSERT reads its own source row rather than carrying a number, so a value
-- the founder tunes between authoring and running still copies correctly. The
-- alternative — transcribing his current values into this file — would freeze a
-- reading taken at a moment nobody can reconstruct, which is the class of defect
-- the verify-never-trust law exists for.
--
-- ON CONFLICT DO NOTHING, also 0115's, also for its reason: a re-run must be a
-- no-op and must never clobber a value tuned after the first run.
--
-- THE SOURCE IS `vendor_pwa_*`, NOT `vendor_wa_*`. The PWA keys are the ones
-- with a live reader and therefore the ones carrying the founder's real,
-- exercised numbers. The WA keys have never been read by anything, so their
-- values are decoration; seeding from them would import a number no vendor has
-- ever been governed by.
--
-- IF A SOURCE ROW IS ABSENT, ITS SEED SIMPLY DOES NOT LAND. `INSERT … SELECT`
-- over an empty source inserts zero rows — no error, no NULL row. That is the
-- honest failure: the reader then falls to its in-code defaults (25/day,
-- 250/month, src/api/vendor-engine/chat.js), which is the same posture that
-- reader has always had for a missing key. The verify block at the foot of this
-- file COUNTS what landed, so an absent source is visible rather than silent.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHAT THIS FILE DELIBERATELY DOES NOT DO
-- ═══════════════════════════════════════════════════════════════════════════
--   1. It does not DELETE the `vendor_pwa_*` or `vendor_wa_*` rows. Deleting
--      config is destructive and reversible only from a backup; 0115 made the
--      same call for `_trial` and `_bench` and said so. The rows stop being
--      OFFERED (the admin console's Vendor AI group replaces both old groups in
--      this same delivery) and stop being READ (the meter now interpolates
--      vendor_ai_*). An orphan key costs nothing; a deleted one costs a restore.
--      Their retirement is a separate, ruled act.
--
--   2. It does not touch `couple_wa_*` or `couple_pwa_*`. Those two families
--      also have zero readers, and their console groups also promise 「 changes
--      take effect immediately 」 while moving nothing. That is a live finding and
--      it is with the founder for a ruling. An executor does not widen a ruling
--      to cover what the ruling did not name.
--
--   3. It does not set any cap to zero. Zero is a lawful, expressible value
--      (F-10.85) and setting it is a FOUNDER act on his own console, per vendor
--      tier, whenever he chooses. A migration that quietly denied a tier its AI
--      would be enforcing a policy under cover of a rename — 0115 refused that
--      same temptation in its own comment and this file refuses it too.

BEGIN;

-- ── 1. THE DAILY FAMILY. Four tiers, seeded from the live PWA rows. ─────────
INSERT INTO public.admin_config (key, value, description)
SELECT 'vendor_ai_daily_basic', value,
       'AI turns/day for the basic tier, COMBINED across the vendor PWA chat and WhatsApp. Seeded from vendor_pwa_daily_basic at 0116 (F-10.100). 0 = denied, and the vendor is told so truthfully on both lanes.'
FROM public.admin_config WHERE key = 'vendor_pwa_daily_basic'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_config (key, value, description)
SELECT 'vendor_ai_daily_essential', value,
       'AI turns/day for the essential tier, COMBINED across the vendor PWA chat and WhatsApp. Seeded from vendor_pwa_daily_essential at 0116 (F-10.100).'
FROM public.admin_config WHERE key = 'vendor_pwa_daily_essential'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_config (key, value, description)
SELECT 'vendor_ai_daily_signature', value,
       'AI turns/day for the signature tier, COMBINED across the vendor PWA chat and WhatsApp. Seeded from vendor_pwa_daily_signature at 0116 (F-10.100).'
FROM public.admin_config WHERE key = 'vendor_pwa_daily_signature'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_config (key, value, description)
SELECT 'vendor_ai_daily_prestige', value,
       'AI turns/day for the prestige tier, COMBINED across the vendor PWA chat and WhatsApp. Seeded from vendor_pwa_daily_prestige at 0116 (F-10.100).'
FROM public.admin_config WHERE key = 'vendor_pwa_daily_prestige'
ON CONFLICT (key) DO NOTHING;

-- ── 2. THE MONTHLY FAMILY. Same four tiers, same source shape. ──────────────
INSERT INTO public.admin_config (key, value, description)
SELECT 'vendor_ai_monthly_basic', value,
       'AI turns/month for the basic tier, COMBINED across the vendor PWA chat and WhatsApp. Seeded from vendor_pwa_monthly_basic at 0116 (F-10.100). 0 = denied.'
FROM public.admin_config WHERE key = 'vendor_pwa_monthly_basic'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_config (key, value, description)
SELECT 'vendor_ai_monthly_essential', value,
       'AI turns/month for the essential tier, COMBINED across the vendor PWA chat and WhatsApp. Seeded from vendor_pwa_monthly_essential at 0116 (F-10.100).'
FROM public.admin_config WHERE key = 'vendor_pwa_monthly_essential'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_config (key, value, description)
SELECT 'vendor_ai_monthly_signature', value,
       'AI turns/month for the signature tier, COMBINED across the vendor PWA chat and WhatsApp. Seeded from vendor_pwa_monthly_signature at 0116 (F-10.100).'
FROM public.admin_config WHERE key = 'vendor_pwa_monthly_signature'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_config (key, value, description)
SELECT 'vendor_ai_monthly_prestige', value,
       'AI turns/month for the prestige tier, COMBINED across the vendor PWA chat and WhatsApp. Seeded from vendor_pwa_monthly_prestige at 0116 (F-10.100).'
FROM public.admin_config WHERE key = 'vendor_pwa_monthly_prestige'
ON CONFLICT (key) DO NOTHING;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- THE VERIFY. Runs INSIDE the same paste, after COMMIT, and is read-only.
-- ═══════════════════════════════════════════════════════════════════════════
-- Expect EIGHT rows, each `vendor_ai_*` value equal to its `vendor_pwa_*` twin.
-- A row missing here means its source key was absent — see the note above; the
-- reader falls to its in-code default and the founder can seed it by hand from
-- the console. A COUNT is not enough on its own, so the twin's value rides
-- beside it: this compares, it does not merely count.
SELECT ai.key           AS ai_key,
       ai.value         AS ai_value,
       src.key          AS seeded_from,
       src.value        AS source_value,
       (ai.value = src.value) AS values_match
FROM public.admin_config ai
JOIN public.admin_config src
  ON src.key = replace(ai.key, 'vendor_ai_', 'vendor_pwa_')
WHERE ai.key LIKE 'vendor_ai_%'
ORDER BY ai.key;

-- ═══════════════════════════════════════════════════════════════════════════
-- THE REVERT DIRECTION — COMMENTED, NEVER RUNNABLE BESIDE THE BLOCK IT REVERSES
-- ═══════════════════════════════════════════════════════════════════════════
-- Per the conditional-withheld rule: this exists so the direction is not
-- reconstructed under pressure, and it is commented so a paste cannot run it
-- seconds after the block above. To use it, uncomment the body and run it alone.
--
-- This revert IS lossless, unlike 0115's — nothing is backfilled, no source word
-- is destroyed, and the `vendor_pwa_*` rows this seeded from are left untouched
-- and still hold their own values. Deleting the eight new rows returns the store
-- to its pre-0116 state exactly. The CODE, however, does not revert with it: a
-- tree carrying this sitting's chat.js will read vendor_ai_* keys that no longer
-- exist and fall to its in-code defaults (25/day, 250/month) on every tier. So
-- this block is the SECOND half of a revert whose first half is a code revert,
-- and running it alone silently un-caps every vendor. Stated, not discovered.
--
-- BEGIN;
--   DELETE FROM public.admin_config WHERE key IN (
--     'vendor_ai_daily_basic',   'vendor_ai_daily_essential',
--     'vendor_ai_daily_signature','vendor_ai_daily_prestige',
--     'vendor_ai_monthly_basic', 'vendor_ai_monthly_essential',
--     'vendor_ai_monthly_signature','vendor_ai_monthly_prestige'
--   );
-- COMMIT;
