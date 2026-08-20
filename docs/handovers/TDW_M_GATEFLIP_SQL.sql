-- TDW · M-GATEFLIP · BLOCK 1 of 3 — THE POPULATION. READ-ONLY.
-- Run this FIRST. Both counts must be on your glass BEFORE the git line and
-- before the arming row (D-10's shape, R-35.17 ③).
--
-- WHAT IT COUNTS: exactly who the armed gate redirects, per lane, using the
-- SHIPPED predicates as their own definition — src/lib/onboardingPredicate.js.
--   brideComplete  = users.name present AND couples.budget_total > 0      (2 fields)
--   vendorComplete = users.name, business_name, category, city,
--                    rate_min > 0, service_area                           (6 fields)
-- ONE FLAG ARMS BOTH DOORS: onboardingGate() has exactly two callers,
-- src/lib/brideInbound.js:418 and src/lib/vendorInbound.js:292.
--
-- MIRRORED, NOT APPROXIMATED:
--   · btrim(x) <> ''  mirrors textPresent  (onboardingPredicate.js:48-51) —
--     a one-space name is not a name.
--   · > 0 mirrors moneyPresent (:54-62) — ZERO IS REFUSED DELIBERATELY, because
--     0 is what an empty numeric input coerces to.
--   · the service_area clause mirrors serviceAreaPresent (:70-74) including its
--     select_cities pairing: an unknown token fails, and select_cities with no
--     non-whitespace city fails.
--
-- SQL-PROVENANCE (docs/db/PUBLIC_SCHEMA.md @ dream-os 0704c6a):
--   public.users   :990  — col 1 id (:993) · col 3 name (:995)
--   public.couples :362  — col 2 user_id (:366) · col 6 budget_total (:370)
--   public.vendors :1113 — col 2 user_id (:1117) · col 3 business_name (:1118)
--                          col 4 category (:1119) · col 6 city (:1121)
--                          col 27 rate_min (:1142) · col 52 service_area (:1159)
--                          col 53 service_cities (:1160)
--     ⚠ F-SW.9 · the HEADER COUNT AT public.vendors IS KNOWN-BAD (it says 45;
--       the body enumerates 53). THE COLUMN LINE IS THE WITNESS — the count is
--       not load-bearing for a column reference. Ruled arm (a), CE-35.
--       public.users, public.couples and public.admin_config are NOT among
--       F-SW.9's eight affected tables; their headers and bodies agree.
--
-- LEFT JOIN on both lanes deliberately: an inner join would silently DROP a row
-- whose users row is absent, and a dropped row is a WHERE clause wearing a
-- different word. A missing users row reads as a missing name, which is what
-- the gate would do with it too.
WITH bride AS (
  SELECT
    CASE WHEN u.name IS NULL OR btrim(u.name) = '' THEN 1 ELSE 0 END AS miss_name,
    CASE WHEN c.budget_total IS NULL OR c.budget_total <= 0 THEN 1 ELSE 0 END AS miss_budget
  FROM public.couples c
  LEFT JOIN public.users u ON u.id = c.user_id
),
vend AS (
  SELECT
    CASE WHEN u.name IS NULL OR btrim(u.name) = '' THEN 1 ELSE 0 END AS miss_name,
    CASE WHEN v.business_name IS NULL OR btrim(v.business_name) = '' THEN 1 ELSE 0 END AS miss_business_name,
    CASE WHEN v.category IS NULL OR btrim(v.category) = '' THEN 1 ELSE 0 END AS miss_category,
    CASE WHEN v.city IS NULL OR btrim(v.city) = '' THEN 1 ELSE 0 END AS miss_city,
    CASE WHEN v.rate_min IS NULL OR v.rate_min <= 0 THEN 1 ELSE 0 END AS miss_price,
    CASE WHEN v.service_area IS NULL
           OR v.service_area NOT IN ('pan_india','worldwide','select_cities')
           OR (v.service_area = 'select_cities'
               AND (SELECT count(*) FROM unnest(COALESCE(v.service_cities, '{}'::text[])) AS sc
                    WHERE btrim(sc) <> '') = 0)
         THEN 1 ELSE 0 END AS miss_area
  FROM public.vendors v
  LEFT JOIN public.users u ON u.id = v.user_id
)
SELECT 'BRIDE  · total on file'        AS lane_figure, count(*)::text AS n FROM bride
UNION ALL SELECT 'BRIDE  · WILL BE REDIRECTED', count(*)::text FROM bride WHERE miss_name + miss_budget > 0
UNION ALL SELECT 'BRIDE  ·   .. missing name',   count(*)::text FROM bride WHERE miss_name = 1
UNION ALL SELECT 'BRIDE  ·   .. missing budget', count(*)::text FROM bride WHERE miss_budget = 1
UNION ALL SELECT 'VENDOR · total on file',       count(*)::text FROM vend
UNION ALL SELECT 'VENDOR · WILL BE REDIRECTED',  count(*)::text FROM vend
   WHERE miss_name + miss_business_name + miss_category + miss_city + miss_price + miss_area > 0
UNION ALL SELECT 'VENDOR ·   .. missing name',          count(*)::text FROM vend WHERE miss_name = 1
UNION ALL SELECT 'VENDOR ·   .. missing business_name', count(*)::text FROM vend WHERE miss_business_name = 1
UNION ALL SELECT 'VENDOR ·   .. missing category',      count(*)::text FROM vend WHERE miss_category = 1
UNION ALL SELECT 'VENDOR ·   .. missing city',          count(*)::text FROM vend WHERE miss_city = 1
UNION ALL SELECT 'VENDOR ·   .. missing starting_price',count(*)::text FROM vend WHERE miss_price = 1
UNION ALL SELECT 'VENDOR ·   .. missing service_area',  count(*)::text FROM vend WHERE miss_area = 1;


-- ═══════════════════════════════════════════════════════════════════════════
-- TDW · M-GATEFLIP · BLOCK 2 of 3 — THE ARMING ROW. THE FOUNDER'S HAND.
-- Run AFTER the push and AFTER reading Block 1's two counts.
--
-- WHY THIS IS A ROW AND NOT A CODE EDIT [R-35.17]. laneFlags.js:117-125 reads
-- admin_config FIRST and falls back to the in-code default only when the key is
-- absent or unreadable. Editing that default would arm BOTH DOORS the instant
-- Railway finished a build — making the build queue the arming hand. That is
-- F-08.56, the inversion laneFlags.js:3-9 exists to prevent. The default stays
-- `false`; this row is the switch, and your hand is the last one on it.
--
-- IT LANDS WITHIN 60 SECONDS AND NEEDS NO DEPLOY (laneFlags.js:32-34, 60s cache).
-- Estate doctrine at three committed sites: src/agent/engine.js:280,
-- src/lib/billing/tierFlip.js:22, src/api/vendor-engine/chat.js:2757.
--
-- THE LITERAL IS THE JSON STRING 'true' AND NOTHING LOOSER. laneFlags.js:123-124
-- JSON-parses the value and accepts only boolean true — 'yes', '1' and 'on' are
-- treated as typos in a safety switch and leave the lane SHUT.
--
-- SQL-PROVENANCE (docs/db/PUBLIC_SCHEMA.md @ 0704c6a):
--   public.admin_config :43 — col 1 key (:46) · col 2 value (:47)
--                             col 3 description (:48) · col 4 updated_at (:49)
--   NOT among F-SW.9's eight: this table's header and body agree.
--   ON CONFLICT (key) is valid — admin_config_pkey PRIMARY KEY (key), witnessed
--   at db/migrations/0112_couple_route_and_flag.sql:23.
-- UPSERT, not INSERT: the key may or may not already exist, and one statement
-- that handles both is safer than asking you to check first and pick.
INSERT INTO public.admin_config (key, value, description)
VALUES (
  'onboarding.gate_enabled',
  'true',
  'ARC OB onboarding gate. Armed by founder 2026-08-20 after the M-GATEFLIP population SELECT. Arms BOTH WhatsApp doors: brideInbound.js:418 and vendorInbound.js:292.'
)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      description = EXCLUDED.description,
      updated_at = now()
RETURNING key, value, updated_at;


-- ═══════════════════════════════════════════════════════════════════════════
-- TDW · M-GATEFLIP · BLOCK 3 of 3 — THE DISARM ROW. RUN ONLY IF NEEDED.
-- Ships beside the arming row by ruling (R-35.17 ③): conditional-withheld
-- governs runnable code alternates, not an emergency off-switch for a live gate.
-- A founder arming two doors holds the off-switch in the same hand.
--
-- Takes effect within the same 60-second cache window. UPDATE and not DELETE:
-- deleting the row would fall back to the in-code default, which is also
-- `false` and would also disarm — but it would leave no record that the gate
-- was ever armed, and the audit trail is worth one column.
UPDATE public.admin_config
SET value = 'false', updated_at = now()
WHERE key = 'onboarding.gate_enabled'
RETURNING key, value, updated_at;
