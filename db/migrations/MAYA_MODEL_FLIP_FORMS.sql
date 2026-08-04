-- ═══════════════════════════════════════════════════════════════════════════
-- MAYA'S MODEL FLIP — BOTH FORMS · TDW_08 P5 Phase 3
-- ═══════════════════════════════════════════════════════════════════════════
--
-- THIS FILE IS NOT A MIGRATION AND MUST NOT BE RUN AS ONE. It has no ladder
-- number and nothing applies it. It is the founder's flip card, kept beside the
-- seed so the two never drift apart.
--
-- ⚠ EVERY STATEMENT BELOW SHIPS COMMENTED. This is the CONDITIONAL-WITHHELD
-- RULE: a block that should only run once a condition is ruled ships fully
-- commented or withheld, with the uncomment step stated — never as a runnable
-- block sitting alongside its opposite. Both directions live here, and exactly
-- one of them can be correct at a time, so neither runs by accident.
--
-- THE UNCOMMENT STEP: strip the leading `-- ` from the four lines of ONE form
-- only. Run it. Read the confirmation. Nothing else in this file moves.
--
-- ⚠ CE-GATED. Every model flip in this estate since E-1 has been CE-gated, and
-- this one is no different. The route is the founder's by config — that is the
-- whole point of 「 the option should be there 」 — but the FLIP IS A DECISION
-- and it goes to the chair with the evidence, which is the per-lane scenario
-- transcripts from `scripts/b08_p5_closer_scenarios.js`. A flip without a
-- transcript read behind it is a coin toss wearing a ruling's clothes.
--
-- NO DEPLOY. NO CODE CHANGE. `resolveModel` reads this row on every turn, so
-- the next inbound message rides the new architecture. Reversal is the other
-- form, and it is 60 seconds.
--
-- THE Z-LAW MAKES BOTH DIRECTIONS SAFE WITHOUT A SOUL BYTE MOVING.
-- `translateFor` (src/lib/llm.js) strips every `cache_control` annotation on
-- non-anthropic providers and disables silent reasoning on DeepSeek. So Maya's
-- two cache breakpoints are honoured on Haiku and stripped harmlessly on
-- DeepSeek — whose context caching is AUTOMATIC and untouched by the strip
-- (E7's discovery, 30k-121k live cache reads on the founder's own ledger). The
-- soul and the Manual are byte-identical on both lanes; only the annotation
-- differs. `b08_p5_closer_bench.js` §4 proves this through the REAL
-- translateFor, both directions, rather than asserting it here.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- FORM A — HAIKU → DEEPSEEK
-- ═══════════════════════════════════════════════════════════════════════════
-- update public.admin_config
--    set value = '{"provider":"deepseek","model":"deepseek-v4-flash"}',
--        updated_at = now()
--  where key = 'model.wa_marketing.default';

-- ═══════════════════════════════════════════════════════════════════════════
-- FORM B — DEEPSEEK → HAIKU  (the seeded state; this is the reversal)
-- ═══════════════════════════════════════════════════════════════════════════
-- update public.admin_config
--    set value = '{"provider":"anthropic","model":"claude-haiku-4-5-20251001"}',
--        updated_at = now()
--  where key = 'model.wa_marketing.default';

-- ═══════════════════════════════════════════════════════════════════════════
-- CONFIRMATION — run after EITHER form. Uncommented, because reading state is
-- never the thing that needs withholding.
-- ═══════════════════════════════════════════════════════════════════════════

select key, value, updated_at
from public.admin_config
where key = 'model.wa_marketing.default';

-- IF THIS RETURNS ZERO ROWS: 0110 has not been run. Maya still routes correctly
-- — `modelRouter.DEFAULTS` carries an identical entry and that is exactly why it
-- exists — but she is NOT flippable until the seed lands, because the admin
-- PATCH door 404s on a key with no row (D7). Run 0110 first.
