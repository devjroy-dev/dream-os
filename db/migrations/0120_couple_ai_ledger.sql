-- 0120_couple_ai_ledger.sql
-- TDW_10.C · DELIVERY 1 — THE COUPLE LANE GETS A METER. IT REFUSES NOTHING.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHY THIS NUMBER
-- ═══════════════════════════════════════════════════════════════════════════
-- Re-derived at THIS seat's tip (dream-os e926756), not carried from the
-- charter: `ls db/migrations/` tail is 0119_prospect_discard.sql. 0113 remains
-- RESERVED-UNWRITTEN (0113_admin_control.sql, TDW_10_ADMIN_FINAL §2) and its
-- hole is left intact — LD-8 forbids reuse and forbids filling it. This file
-- takes 0120.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHAT THIS CURES
-- ═══════════════════════════════════════════════════════════════════════════
-- F-10.105 / F-10.107 / F-10.112. The couple lane spends at TEN sites and
-- writes NO ledger row anywhere. Two of those sites tally tokens into local
-- variables and console.log them (brideEngine.js:238-239, circleEngine.js:
-- 134-135); the fan-out (brideEngine.js:2118) tallies nothing at all; the
-- remaining seven were never counted by anyone. Circle members spend from the
-- bride's allowance with no ceiling of any kind.
--
-- THIS DELIVERY BUILDS THE LEDGER AND THE METER ONLY. Nothing is refused.
-- Per the banked ruling ⑨'s sequence — 「 ledger → meter → refuse at three
-- doors, never in one act 」 — the dials (delivery 2) and the gate (delivery 3)
-- are separate acts, each founder-applied and witnessed before the next ships.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHY A PUBLIC-PLANE TABLE AND NOT engine.usage — THE PLANE ARGUMENT
-- ═══════════════════════════════════════════════════════════════════════════
-- Fork (c), RULED, on LD-1's Plane Doctrine: engine.usage is engine-plane and
-- works for vendors because agents are engine-plane. Couples are public-plane.
--
-- AND THE SCHEMA PROVES IT MECHANICALLY, not merely doctrinally:
--   docs/db/ENGINE_SCHEMA.md `## engine.usage · 12 columns`, column 2:
--     agent_id uuid NOT NULL
-- The couple lane holds NO agent_id anywhere — grep for agent_id/agentId
-- across src/api/couple/, brideInbound.js, brideIndex.js, brideEngine.js and
-- circleEngine.js returns ZERO hits, and engine.agents rows are minted only in
-- src/engine/src/core/signup.ts (the vendor signup path). Writing couple spend
-- into engine.usage would require minting sham agent rows for brides.
--
-- ⟶ MUTUAL POINTER, per F-06.85. The sibling ledger is `engine.usage`, read by
--   src/api/vendor-engine/chat.js `buildMeta`. It carries the same fact for the
--   VENDOR lane. THE TWO ARE DELIBERATELY NOT ONE TABLE, for the plane reason
--   above. A sitting tempted to fuse them must read this comment and the twin
--   pointer at src/lib/coupleAiCap.js before it moves. Fusing them means giving
--   couples engine identities, which is the crossing F-10.107 files.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- COLUMN PROVENANCE (SQL-provenance law — every column, its witness)
-- ═══════════════════════════════════════════════════════════════════════════
--   public.couples(id)          — FOUNDER-RUN information_schema, 2026-08-12,
--                                 pasted to this seat: `id uuid NO
--                                 uuid_generate_v4()`, ordinal 1, 23 columns
--                                 total. (docs/db/PUBLIC_SCHEMA.md is snapshot
--                                 0099 and lists 21 — twenty migrations stale;
--                                 the live information_schema is the settling
--                                 witness and it is what this FK is drawn on.)
--   public.circle_members(id)   — TWO independent witnesses, different failure
--                                 modes: docs/db/PUBLIC_SCHEMA.md
--                                 `## public.circle_members · 13 columns`
--                                 column 1 `id uuid NOT NULL default
--                                 uuid_generate_v4()`, AND live code at
--                                 src/agent/brideEngine.js:2039 querying
--                                 `.eq('id', session.circle_member_id)`.
--   public.admin_config         — docs/db/PUBLIC_SCHEMA.md
--                                 `## public.admin_config · 4 columns`:
--                                   key text NOT NULL / value text NOT NULL /
--                                   description text / updated_at timestamptz
--                                 and `[PRIMARY KEY] admin_config_pkey (key)`,
--                                 which is what makes ON CONFLICT (key) legal.
--   gen_random_uuid()           — 0117_pending_couple_drafts.sql:46, this
--                                 ladder's own public-plane default.
--   timestamptz / CREATE INDEX  — 0117:100, 0117:118 house style.
--
--   NO OTHER TABLE IS TOUCHED. public.couples.tier is READ BY NOTHING in this
--   file: the tier CHECK and the vocabulary work PARK with Platinum (R-30.35).
--
-- ═══════════════════════════════════════════════════════════════════════════
-- ⚠ LABELLED AMENDMENT — `cost_basis`. RATIFY-OR-REVERT. DISCLOSED, NOT SLID IN.
-- ═══════════════════════════════════════════════════════════════════════════
-- R-30.27 ruled `cost_inr NOT NULL` as the one universal cell. Authoring the
-- writer proved that ruling cannot be honestly satisfied at every site:
--
--   · ANTHROPIC (8 sites) — real tokens, real price. calcCostInr. Honest.
--   · GOOGLE GEMINI (groundedSearch, gemini-2.0-flash-lite) — tokens ARE
--     recoverable (the SDK's own type declarations, @google/genai@^2.2.0,
--     witnessed mechanically: GenerateContentResponse.usageMetadata with
--     promptTokenCount / candidatesTokenCount), but NO GEMINI PRICE EXISTS in
--     this estate. calcCostInr falls back to HAIKU rates by its own documented
--     law (src/engine/src/core/models.ts:76) — a deliberate conservative
--     ceiling that OVER-states, exactly as harvest.js:73-77 declares for
--     deepseek/glm. That is an estimate, not a measurement.
--   · GOOGLE VISION (imagePipeline.js:204, images:annotate) — bills PER IMAGE,
--     carries no tokens at all, and no Vision rate exists anywhere in the
--     estate. There is no honest number to write.
--
-- Writing 0 for Vision without a marker is F-10.85's disease one abstraction
-- up: the reader cannot tell 「 free 」 from 「 we do not know 」, which is the
-- precise ambiguity a stored zero caused on the vendor cap dial.
--
-- `cost_basis` is F4's own ratified reasoning applied one column over — a
-- semantic NULL needs a comment at every reader; a named column needs none.
-- It is ADDITIVE and REVERSIBLE. The revert direction is withheld-commented at
-- the foot of this file per the conditional-withheld rule.
--
-- THE ASYMMETRY IS STATED SO THE CHAIR RULES WITH THE PRICE IN VIEW: a code
-- revert is free; dropping this column after the table exists is a DESTRUCTIVE
-- DB ACTION under protocol §4 and needs the founder's signature and an export
-- first. Founder granted the labelled route explicitly (2026-08-12).

BEGIN;

-- ── 1. THE LEDGER. One row per MODEL CALL. Never one row per turn. ──────────
--
-- THE UNIT DISTINCTION IS LOAD-BEARING AND IS WHY turn_id EXISTS (G1, R-30.37).
-- The vendor meter counts engine.usage ROWS and that equals counting TURNS only
-- because src/engine/src/core/loop.ts:922-931 writes ONE row per turn carrying
-- pre-aggregated totalIn/totalOut. The couple lane has no such aggregation: a
-- single bride message can produce up to FIVE calls (brideEngine.js:43
-- MAX_ITERATIONS), a circle message up to THREE (circleEngine.js:35), one
-- forwarded image TWO, plus N fan-out rows. Counting rows would price the
-- founder's 20 messages/day at as few as 4 actual messages.
--
--   ⟶ SPEND sums cost_inr over ALL rows, always.
--   ⟶ TURNS count DISTINCT turn_id WHERE kind = 'turn'.
--
-- That split is the harvest precedent (a spend row is not a turn row) carried
-- onto a plane that can name it in a column instead of overloading a NULL.
CREATE TABLE IF NOT EXISTS public.couple_ai_usage (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The allowance this spend comes out of. ALWAYS the couple's, including when
  -- a circle member is the one spending — that is F-10.107's whole complaint.
  couple_id         uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,

  -- F1, RULED: one ceiling per couple, per-member VISIBILITY. Attribution is
  -- free at the call site — circleEngine.js:151-152 already passes `couple` and
  -- `circleUser` separately, and brideIndex.js:536 already stamps
  -- saved_by_role:'circle_member'. NULL = the bride herself.
  circle_member_id  uuid REFERENCES public.circle_members(id) ON DELETE SET NULL,

  -- G1 (R-30.37). Minted at the DOOR, once per inbound message, and stamped on
  -- every row that inbound causes.
  --
  -- NULLABLE BY MEANING, NOT BY LAZINESS — R-30.37's third consequence, written
  -- here so no future reader "tightens" it: a system-born row (an in-app Muse
  -- upload at src/api/couple/muse.js, which is not a message; a cron-side path
  -- if one is ever added) has no inbound to belong to. It counts NOTHING toward
  -- turns and costs TRULY. A NOT NULL here would force a fake id and the fake
  -- would be counted.
  turn_id           uuid,

  -- F4, RULED. The five reachable shapes, CHECK-constrained.
  --   turn       — a bride or circle message answered by an agent loop
  --                (brideEngine.js:220 · circleEngine.js:102). THE ONLY kind
  --                that consumes the cap.
  --   fanout     — brideEngine.js:2118 summarizeOneSession, one call PER
  --                pending circle session. Spend, never a turn (F-10.112).
  --   onboarding — brideOnboarding.js's five sites. R-30.37 consequence 1:
  --                a bride's setup messages never burn her day-one allowance.
  --   search     — the Gemini retrieval behind factual_search.
  --   tagging    — the image path: Vision + the Haiku aesthetic tagger.
  --                R-30.37 consequence 2: forwarding a photo is not a message
  --                spent, but it is fully priced.
  kind              text NOT NULL
                      CHECK (kind IN ('turn','fanout','onboarding','search','tagging')),

  -- R-30.27: settles Gemini-vs-Anthropic-at-the-same-kind in one stroke.
  provider          text NOT NULL,

  -- The raw routed model/endpoint string — the provider's own fingerprint,
  -- loop.ts's convention on routed providers. NULL where the call has no model
  -- (the Vision endpoint).
  model             text,

  -- NULLABLE BY MEANING: a per-image API has no tokens. See cost_basis.
  input_tokens      integer,
  output_tokens     integer,

  -- The one universal cell (R-30.27). Always present, always summable.
  cost_inr          numeric NOT NULL DEFAULT 0,

  -- ⚠ THE LABELLED AMENDMENT. How cost_inr was arrived at:
  --   metered   — real tokens through a real price for that model.
  --   estimated — real usage, borrowed price (Gemini through calcCostInr's
  --               documented Haiku fallback). OVER-states, deliberately.
  --   unpriced  — no rate exists for this provider yet. cost_inr is 0 and that
  --               0 MEANS UNKNOWN. Backfill is one UPDATE when a rate arrives.
  cost_basis        text NOT NULL DEFAULT 'metered'
                      CHECK (cost_basis IN ('metered','estimated','unpriced')),

  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ── 2. THE INDEXES. Shaped for the reads delivery 3 will actually run. ──────
-- The meter's daily/monthly question is: for THIS couple, since THIS instant,
-- how many DISTINCT turn_id rows of kind 'turn'. Leading couple_id + created_at
-- serves the window; kind and turn_id ride along so the count is answered from
-- the index without touching the heap.
CREATE INDEX IF NOT EXISTS idx_couple_ai_usage_meter
  ON public.couple_ai_usage (couple_id, created_at DESC, kind, turn_id);

-- The spend question — total money for a couple over a window — deliberately
-- does NOT filter kind (harvest's precedent: spend counts everything).
CREATE INDEX IF NOT EXISTS idx_couple_ai_usage_spend
  ON public.couple_ai_usage (couple_id, created_at DESC);

-- F1's visibility read: which circle member is spending the bride's allowance.
-- Partial — the overwhelming majority of rows are the bride's own (NULL).
CREATE INDEX IF NOT EXISTS idx_couple_ai_usage_member
  ON public.couple_ai_usage (circle_member_id, created_at DESC)
  WHERE circle_member_id IS NOT NULL;

COMMENT ON TABLE public.couple_ai_usage IS
  'Couple-lane AI spend ledger, public plane (Fork (c), LD-1). One row per MODEL '
  'CALL. Spend = SUM(cost_inr) over all rows; TURNS = COUNT(DISTINCT turn_id) '
  'WHERE kind=''turn''. Sibling ledger: engine.usage (engine plane, vendor lane, '
  'keyed on agent_id NOT NULL) — deliberately NOT the same table; see this '
  'migration''s plane argument and src/lib/coupleAiCap.js before fusing them.';

-- ── 3. THE DIALS. Two rows. Seed-from-declared-value. ───────────────────────
--
-- NOT seed-from-source-row, and the difference is evidence-based rather than
-- stylistic. 0116 seeded the vendor family FROM the live vendor_pwa_* rows
-- because those keys had a live reader and therefore carried the founder's
-- real, exercised numbers. The couple families have NEITHER property: the
-- founder's own SELECT (2026-08-12) returned twelve couple_pwa_*/couple_wa_*
-- rows ALL carrying updated_at 2026-05-22 10:37:09.235774+00 — identical to
-- the microsecond, one seed INSERT, never once tuned, never once read. There is
-- no source row worth preserving. Seeding from them would import numbers no
-- bride has ever been governed by AND a dead three-word tier vocabulary.
--
-- THE SOURCE IS THE FOUNDER'S OWN WORD, 2026-08-12, recorded by the chair at
-- R-30.30 and narrowed to one tier at R-30.35:
--     couple_ai_daily_basic    20
--     couple_ai_monthly_basic  600
--
-- ONE TIER SHIPS (R-30.35). Platinum (₹999/mo · 50 daily / 1000 monthly · 6
-- circle seats) is PARKED BY NAME with a trigger — revisited after ~6 months of
-- real usage, or the founder's earlier word. The 50/1000 are recorded in the
-- park entry and seeded NOWHERE.
--
-- THE KEYS STAY TIER-SUFFIXED DELIBERATELY. The gate resolves
-- `couple_ai_daily_${couples.tier}`; every live couple row is 'basic' (founder-
-- run SELECT, 2026-08-12: 23 rows, one group, all basic). Unparking Platinum is
-- then two INSERTs and one column value — ZERO code.
--
-- NO READER EXISTS YET. These two rows are INERT on this delivery: the gate is
-- delivery 3. They are seeded here so delivery 2's console read has something
-- true to show, and because an inert config row arms nothing.
--
-- ON CONFLICT DO NOTHING, 0115/0116's pattern and their reason: a re-run must be
-- a no-op and must never clobber a value the founder tuned after the first run.
--
-- ⚠ THE DEAD DIALS ARE NOT TOUCHED HERE. couple_pwa_* and couple_wa_* retire
-- BY NAME in delivery 2, never by prefix sweep — `key LIKE 'couple%'` also
-- catches `couple.eliza_enabled`, a LIVE lane-enable flag (updated 2026-08-04)
-- that is not a cap at all. Named here so the retirement sitting cannot miss it.
INSERT INTO public.admin_config (key, value, description) VALUES
  ('couple_ai_daily_basic',   '20',
   'AI turns/day for a couple, COMBINED across every couple-lane door (bride WhatsApp, in-app chat, circle members). Founder-declared 2026-08-12 (R-30.30/R-30.35). Counts DISTINCT turn_id WHERE kind=''turn'' in public.couple_ai_usage — onboarding, image tagging, search and fan-out spend money but do not consume turns. 0 = denied (F-10.85). NO READER until TDW_10.C delivery 3.'),
  ('couple_ai_monthly_basic', '600',
   'AI turns/month for a couple, COMBINED across every couple-lane door. Founder-declared 2026-08-12. Note recorded at ruling time: 20x30=600, so the DAILY dial is this tier''s real ceiling and the monthly binds only on 31-day months. 0 = denied (F-10.85). NO READER until TDW_10.C delivery 3.')
ON CONFLICT (key) DO NOTHING;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- THE VERIFY. Read-only, runs INSIDE the same paste, after COMMIT.
-- ═══════════════════════════════════════════════════════════════════════════
-- Expect: (a) 14 columns with the shapes below, (b) 3 indexes, (c) 2 CHECKs
-- plus 2 FKs plus the PK, (d) 2 dial rows, (e) 0 ledger rows (nothing has run
-- yet — the writers ship in the ZIP, after this).
-- This ASSERTS SHAPES, not merely existence: a count alone would pass over a
-- table with the right name and the wrong columns.

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'couple_ai_usage'
ORDER BY ordinal_position;

SELECT indexname FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'couple_ai_usage'
ORDER BY indexname;

SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.couple_ai_usage'::regclass
ORDER BY conname;

SELECT key, value, updated_at
FROM public.admin_config
WHERE key IN ('couple_ai_daily_basic','couple_ai_monthly_basic')
ORDER BY key;

SELECT count(*) AS ledger_rows_expected_zero FROM public.couple_ai_usage;

-- ═══════════════════════════════════════════════════════════════════════════
-- THE REVERT DIRECTION — COMMENTED, NEVER RUNNABLE BESIDE THE BLOCK IT REVERSES
-- ═══════════════════════════════════════════════════════════════════════════
-- Per the conditional-withheld rule: this exists so the direction is not
-- reconstructed under pressure, and it is commented so a paste cannot run it
-- seconds after the block above. To use it, uncomment the body and run it alone.
--
-- ⚠ DROP TABLE IS DESTRUCTIVE AND IS NOT LOSSLESS ONCE ROWS EXIST. Protocol §4
-- binds: founder sign-off recorded, a CSV export of the object taken FIRST, the
-- action logged in the handover. After the first hour of live traffic this
-- table holds product intelligence that exists nowhere else — that is the whole
-- point of delivery 1 — and no backup restores a meter's history.
--
-- THE CODE DOES NOT REVERT WITH IT. A tree carrying this sitting's
-- src/lib/coupleAiCap.js will attempt writes against a table that no longer
-- exists. Those writes are FAIL-OPEN by construction (try/catch, warn, the
-- bride still gets her reply), so the product survives — but it survives blind.
-- Stated, not discovered.
--
-- ── (a) THE LABELLED AMENDMENT ALONE, if the chair reverts cost_basis and
--        ratifies the rest. Destructive on that column only.
-- BEGIN;
--   ALTER TABLE public.couple_ai_usage DROP COLUMN IF EXISTS cost_basis;
-- COMMIT;
--
-- ── (b) THE WHOLE DELIVERY.
-- BEGIN;
--   DROP TABLE IF EXISTS public.couple_ai_usage;
--   DELETE FROM public.admin_config
--    WHERE key IN ('couple_ai_daily_basic','couple_ai_monthly_basic');
-- COMMIT;
