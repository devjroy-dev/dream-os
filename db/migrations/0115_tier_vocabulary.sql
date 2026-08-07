-- 0115_tier_vocabulary.sql
-- TDW_10 · THE TIER & MONEY SITTING · F-10.23's cure — the rename, made a constraint.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHY THIS NUMBER
-- ═══════════════════════════════════════════════════════════════════════════
-- Re-derived at THIS seat's tip (dream-os 1e4fd7e), not carried from the
-- charter: db/migrations/ tail is 0114_billing_rails.sql; 0113 is
-- RESERVED-UNWRITTEN for 0113_admin_control.sql (TDW_10_ADMIN_FINAL §2, re-homed
-- by R-A6, amended at R-P3.2/CE-201). LD-8 forbids reuse, so this file takes
-- 0115 and leaves 0113's hole intact.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- THE FOUNDER'S RULING, VERBATIM
-- ═══════════════════════════════════════════════════════════════════════════
--   「 trial tier renamed basic 」
--   「 basic is free without ai and without any time bound problem 」
--
-- Read precisely, and this file is written to that reading: `basic` IS the
-- canon's no-AI floor. Permanent. No clock. No AI. The word `free` therefore
-- RETIRES rather than surviving beside it — the canon's Free row is RENAMED,
-- not duplicated. 「 drops to free 」 henceforth reads drops-to-basic.
--
-- The vocabulary is FOUR words: basic · essential · signature · prestige.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHY THE STATEMENT ORDER IS THE STATEMENT ORDER
-- ═══════════════════════════════════════════════════════════════════════════
-- A CHECK is free on a VIRGIN column (0114's `billing_status` took one that
-- way). `vendors.tier` is NOT virgin: it is NOT NULL, defaulted, and carries
-- six live rows across four distinct words. The order below is forced, and each
-- step exists because skipping it breaks something specific:
--
--   1. BACKFILL BOTH SOURCE WORDS. `trial` is the rename's subject. `free` is
--      the second source word, and it is not hypothetical — the cancel flip has
--      ALREADY FIRED on the founder's own account. His SELECT of 2026-08-07
--      returned 9888294440 as tier='free', billing_status='cancelled',
--      razorpay_subscription_id='sub_TMeuDLooXudasB'. A CHECK of the four ruled
--      words would ABORT AT `ADD CONSTRAINT` on that one row — not on the next
--      cancellation, but immediately, in the Supabase editor, on statement four.
--      Both words land in `basic` before the constraint.
--
--   2. THEN THE DEFAULT. `tier` defaults to 'trial' (founder-run
--      information_schema: column_default 'trial'::text, is_nullable NO). A
--      row-level UPDATE does not touch a DEFAULT. Leave it and the CHECK lands
--      on a column whose own default violates it, so the NEXT INSERT that omits
--      `tier` — which is every mint through the P3 provisioning path — fails.
--
--   3. THEN THE CHECK. Only once no live row and no default can violate it.
--      Founder-run pg_constraint confirms no tier CHECK exists to collide with.
--
--   4. THE CAP KEYS. src/api/vendor-engine/chat.js interpolates the stored tier
--      string directly into an admin_config key: `vendor_pwa_daily_${tier}`.
--      Rename the word without seeding the keys and every renamed vendor's
--      lookup misses, falling silently to the in-code default. The seed copies
--      the `_trial` values EXACTLY, so no vendor's entitlement moves by one turn
--      on rename night. That the resulting ladder is inverted (basic 500/day vs
--      prestige 100/day, inherited from `_trial`) is FILED as F-10.86 and is a
--      founder ruling about what people get for their money — not a rename's
--      business to decide silently. The cost is on the record, not smuggled.
--
--   5. THE LINK COLUMN. R-BILL.1's Subscription Links are founder-issued per
--      vendor from the Razorpay dashboard. 0114 birthed no home for the issued
--      link (verified: it adds only billing_events, billing_status,
--      razorpay_subscription_id). One nullable column, written by a founder-run
--      UPDATE at this scale, read by the vendor's own subscription surface.
--      Wire-or-delete satisfied: this sitting ships its reader.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- COLUMN PROVENANCE (SQL-provenance law — every column, its witness)
-- ═══════════════════════════════════════════════════════════════════════════
--   public.vendors.tier          — founder-run information_schema, 2026-08-07:
--                                  text · NOT NULL · default 'trial'::text.
--                                  (docs/db/PUBLIC_SCHEMA.md:989 agrees; the doc
--                                  predates 0114 so the live read governs.)
--   public.vendors CHECKs        — founder-run pg_constraint on
--                                  'public.vendors'::regclass: exactly three —
--                                  vendors_billing_status_check,
--                                  vendors_discover_request_state_check,
--                                  vendors_rate_range_check. NO tier CHECK.
--   public.vendors.razorpay_subscription_id
--                                — db/migrations/0114_billing_rails.sql; the
--                                  founder's information_schema confirms text,
--                                  nullable, no default.
--   public.admin_config          — docs/db/PUBLIC_SCHEMA.md:33-40 —
--                                  key text NOT NULL (PK) · value text NOT NULL
--                                  · description text · updated_at timestamptz
--                                  NOT NULL default now().
--   the tier-keyed cap keys      — founder-run SELECT, 2026-08-07, pasted whole:
--                                  eighteen rows, minimum value 3, NO key stores
--                                  0, no `_free` keys exist (so none are seeded
--                                  below), and `vendor_pwa_*_bench` exists with
--                                  no vendor row behind it (F-10.88, filed,
--                                  untouched).
--   the tier distribution        — founder-run GROUP BY, 2026-08-07:
--                                  prestige 2 · trial 2 · signature 1 · free 1.
--                                  After this file: prestige 2 · basic 3 ·
--                                  signature 1. Every word inside the CHECK.

BEGIN;

-- ── 1. BACKFILL. BOTH source words, before anything constrains the column. ──
-- Expected 2 rows here, 1 row below, 3 rows in `basic` after.
UPDATE public.vendors SET tier = 'basic' WHERE tier = 'trial';
UPDATE public.vendors SET tier = 'basic' WHERE tier = 'free';

-- ── 2. THE DEFAULT, before the constraint that would otherwise outlaw it. ────
ALTER TABLE public.vendors ALTER COLUMN tier SET DEFAULT 'basic';

-- ── 3. THE CHECK. Four words. `free` is retired, not admitted. ──────────────
-- Guarded so a re-run is a no-op rather than an error (0114's own pattern).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vendors_tier_check'
  ) THEN
    ALTER TABLE public.vendors
      ADD CONSTRAINT vendors_tier_check
      CHECK (tier IN ('basic', 'essential', 'signature', 'prestige'));
  END IF;
END $$;

COMMENT ON COLUMN public.vendors.tier IS
  'Canon tier vocabulary, CHECKed: basic | essential | signature | prestige. '
  '``basic`` is the permanent no-AI floor (founder, 2026-08-07: no AI, no time bound) '
  'and is what a lapsed subscription drops to — src/lib/billing/razorpay.js BASE_TIER. '
  'The word ``free`` retired at 0115; ``trial`` retired with it (F-10.23). '
  'NOTE: basic''s no-AI semantic is RECORDED here and ENFORCED BY NOBODY — per-tier AI '
  'enforcement is F-10.41''s own W-1-gated sitting. The interim lever is the cap keys.';

-- ── 4. THE CAP KEYS. Seeded from `_trial`, value-for-value. ─────────────────
-- Each seed reads its own source row rather than carrying a literal, so a value
-- the founder tuned between his SELECT and this run still copies correctly.
-- ON CONFLICT DO NOTHING so a re-run cannot clobber a hand-tuned value.
INSERT INTO public.admin_config (key, value, description)
SELECT 'vendor_pwa_daily_basic', value,
       'PWA chat turns/day for the basic tier. Seeded from vendor_pwa_daily_trial at 0115 (F-10.23). 0 = denied.'
FROM public.admin_config WHERE key = 'vendor_pwa_daily_trial'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_config (key, value, description)
SELECT 'vendor_pwa_monthly_basic', value,
       'PWA chat turns/month for the basic tier. Seeded from vendor_pwa_monthly_trial at 0115 (F-10.23). 0 = denied.'
FROM public.admin_config WHERE key = 'vendor_pwa_monthly_trial'
ON CONFLICT (key) DO NOTHING;

-- The two WA keys are seeded for VOCABULARY PARITY, not because anything reads
-- them. Two independent greps — literal, and template-interpolation — found ZERO
-- readers of vendor_wa_daily_* / vendor_wa_monthly_* anywhere in src/. They
-- render as editable knobs at app/admin/config/page.tsx and move nothing.
-- Filed as F-10.87. Seeded so a future reader does not find `basic` missing;
-- NOT relied upon by any cure in this sitting.
INSERT INTO public.admin_config (key, value, description)
SELECT 'vendor_wa_daily_basic', value,
       'WhatsApp turns/day for the basic tier. Seeded from vendor_wa_daily_trial at 0115. NO READER AS OF 0115 — F-10.87.'
FROM public.admin_config WHERE key = 'vendor_wa_daily_trial'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_config (key, value, description)
SELECT 'vendor_wa_monthly_basic', value,
       'WhatsApp turns/month for the basic tier. Seeded from vendor_wa_monthly_trial at 0115. NO READER AS OF 0115 — F-10.87.'
FROM public.admin_config WHERE key = 'vendor_wa_monthly_trial'
ON CONFLICT (key) DO NOTHING;

-- The `_trial` and `_bench` keys are LEFT IN PLACE, deliberately. Deleting a
-- config row is destructive and reversible only from a backup; leaving an orphan
-- key costs nothing and keeps the founder's pre-rename values readable beside
-- the new ones for as long as he wants them. Their retirement is a separate,
-- ruled act.

-- ── 5. THE SUBSCRIPTION LINK'S HOME (Fork G, arm (a)). ──────────────────────
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS razorpay_subscription_link text;

COMMENT ON COLUMN public.vendors.razorpay_subscription_link IS
  'The founder-issued Razorpay Subscription Link URL for this vendor (R-BILL.1, v1). '
  'Written by a founder-run UPDATE at this scale; read by GET /api/v2/vendor/me and '
  'rendered on the vendor''s own subscription surface. NULL = no link issued yet, which '
  'the surface states plainly rather than hiding behind a button that goes nowhere.';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- THE REVERT DIRECTION — COMMENTED, NEVER RUNNABLE BESIDE THE BLOCK IT REVERSES
-- ═══════════════════════════════════════════════════════════════════════════
-- Per the conditional-withheld rule: this exists so the direction is not
-- reconstructed under pressure, and it is commented so a paste cannot run it
-- seconds after the block above. To use it, uncomment the body and run it alone.
--
-- NOTE THE ASYMMETRY, stated rather than discovered: the backfill is not
-- losslessly reversible. Once trial→basic and free→basic have both run, the
-- three rows sitting in `basic` cannot be told apart — which row was which is
-- gone. The revert restores the SHAPE (no CHECK, old default) but cannot restore
-- the two source words. If that distinction may ever be needed, take a CSV of
-- (id, tier) BEFORE running the block above.
--
-- BEGIN;
--   ALTER TABLE public.vendors DROP CONSTRAINT IF EXISTS vendors_tier_check;
--   ALTER TABLE public.vendors ALTER COLUMN tier SET DEFAULT 'trial';
--   ALTER TABLE public.vendors DROP COLUMN IF EXISTS razorpay_subscription_link;
--   DELETE FROM public.admin_config WHERE key IN (
--     'vendor_pwa_daily_basic', 'vendor_pwa_monthly_basic',
--     'vendor_wa_daily_basic',  'vendor_wa_monthly_basic'
--   );
-- COMMIT;
