-- 0112_couple_route_and_flag.sql — TDW_08 P5 Phase 4 (ELIZA): the couple lane's
-- model route, and the lane-enable flag that keeps her silent until the founder
-- says otherwise.
--
-- LADDER: derived by command at bfcb88e — `ls db/migrations/ | tail` ends at
-- 0111_marketing_nudge_route.sql. 0112 is the next free address. Numbers are
-- law: holes are harmless, renumbering is forbidden, none is ever reused
-- (protocol §3).
--
-- PATTERN: 0082_advisor_route_seed.sql, as ruled. Both statements are idempotent
-- (`on conflict (key) do nothing`) and both seed values EQUAL their in-process
-- defaults, so a pre-seed deploy behaves IDENTICALLY. The rows exist to make
-- these admin-editable: the PATCH door 404s on a key with no row (D7).
--
-- SQL-PROVENANCE (protocol §9). Every column below is witnessed at
-- docs/db/PUBLIC_SCHEMA.md — snapshot 2026-07-23, founder-run, applied ladder
-- tip 0099 at snapshot. The witness, verbatim from that file:
--     ## public.admin_config  ·  4 columns
--     1. key text NOT NULL
--     2. value text NOT NULL
--     3. description text
--     4. updated_at timestamp with time zone NOT NULL default now()
--     [PRIMARY KEY] admin_config_pkey  PRIMARY KEY (key)
-- `value` is TEXT, which is why both values below are JSON-IN-TEXT and why both
-- readers parse defensively (modelRouter.js:119-124, laneFlags.js:70-83).
-- Staleness named: the snapshot predates the applied tip by twelve migrations;
-- admin_config is untouched by all twelve (derived by grep across 0100-0111).
--
-- FOUNDER-RUN, Supabase SQL editor. Nothing to fill in.

-- ── STATEMENT 1 — the couple lane's model route ─────────────────────────────
-- Mirrors modelRouter.DEFAULTS['model.wa_couple.default']. A couple holds no
-- `vendors` row and therefore no tier, so the tier slot is `default` —
-- `model.wa_marketing.default` is the structural precedent, not `pwa_vendor`.
-- The value equals the literal `engine.js` carried since Session 5.5: the
-- facade join changed the mechanism, not one routed byte.
insert into public.admin_config (key, value, description) values
  ('model.wa_couple.default',
   '{"provider":"anthropic","model":"claude-haiku-4-5-20251001"}',
   'Couple-concierge model route (Eliza, vendor line). Haiku-seeded; DeepSeek flip is one row, 60s. Constrained by the F-08.84 allow-set.')
on conflict (key) do nothing;

-- ── STATEMENT 2 — the lane-enable flag, OFF ─────────────────────────────────
-- F-08.56: on push-deploy infrastructure a gate sequenced after the git line is
-- not a gate. This row is what makes PUSH stop meaning SPEAK. OFF means the
-- couple lane keeps yesterday's behaviour byte for byte (proven identical across
-- 112 permutations at build). Turning Eliza on is the founder's hand, and
-- turning her back off is the same row and sixty seconds.
insert into public.admin_config (key, value, description) values
  ('couple.eliza_enabled',
   'false',
   'Lane-enable flag for Eliza, the couple concierge (TDW_08 P5 Phase 4, F-08.56). false = the pre-Eliza prompt. Flip to true is the founder''s act.')
on conflict (key) do nothing;

-- ── CONFIRMATION (run after; expect exactly 2 rows) ─────────────────────────
-- select key, value from public.admin_config
--  where key in ('model.wa_couple.default', 'couple.eliza_enabled')
--  order by key;

-- ── THE FLIP — WITHHELD, and this is the conditional-withheld rule, not a
-- formatting choice. It ships COMMENTED with its uncomment step stated, because
-- anything runnable left in a transcript will be run and this one row is the
-- difference between a dark lane and a live persona. TO RUN IT: delete the two
-- leading dashes on the `update` line only, after the ×3 is green and the chair
-- and founder have read it.
--   update public.admin_config set value = 'true', updated_at = now()
--    where key = 'couple.eliza_enabled';
--
-- ── AND THE REVERSE, equally withheld, equally one row and sixty seconds:
--   update public.admin_config set value = 'false', updated_at = now()
--    where key = 'couple.eliza_enabled';

-- ── REVERT (commented — run only to un-seed; DEFAULTS still routes and the flag
-- still reads false in-process, so this changes no behaviour):
--   delete from public.admin_config where key in ('model.wa_couple.default', 'couple.eliza_enabled');
