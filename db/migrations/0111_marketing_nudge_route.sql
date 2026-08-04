-- 0111_marketing_nudge_route.sql — TDW_08 P5: THE WAKE ROLE'S LANE (F-08.69).
--
-- WHY THIS ROW MOVES. Haiku wake-turns have failed in every build of this arc:
-- 9/9 narration, then 7/9 self-reintroduction, then 4/9 in-model refusals, then
-- 4/9 costume breaks at 881a084 — one of them a markdown-headed briefing
-- addressed to an imagined operator, `source=closer`, on the wire. DeepSeek
-- wake-turns were 0/9 that night and are effectively clean across the arc.
-- The CE ruling stops treating this as a cure and calls it an ASSIGNMENT:
-- reply turns stay on the seeded lane, wake turns ride the lane that has never
-- broken one.
--
-- THE MECHANISM IS NOT NEW. `donna_provider` / `donna_model` (TDW_02 P7,
-- Amendment Two) already route one ROLE separately from the surface's base
-- route; `nudge_provider` / `nudge_model` are that geometry, one role over.
-- `modelRouter.parseRoute` validates them identically and DROPS the split
-- rather than guessing; `guardKeys` drops it loudly if the key is absent.
--
-- ⚠ ORDER MATTERS — RUN THIS BEFORE THE APPLY. The seed row WINS over the
-- DEFAULTS matrix, so a tree deployed against the OLD row routes wakes to Haiku
-- and the ruling is defeated silently. 0109's discipline exactly.
--
-- COLUMN PROVENANCE (protocol §9, THE SQL-PROVENANCE LAW): public.admin_config
-- is 4 columns — key text NOT NULL, value text NOT NULL, description text,
-- updated_at timestamptz NOT NULL default now() — witnessed at
-- docs/db/PUBLIC_SCHEMA.md:33-40. `value` is TEXT carrying JSON, which is why
-- parseRoute parses it defensively.
--
-- FORM: 0110's own shape, but an UPDATE-on-conflict rather than DO NOTHING,
-- because 0110's row already exists and is exactly what must change.

insert into public.admin_config (key, value, description) values
  ('model.wa_marketing.default',
   '{"provider":"anthropic","model":"claude-haiku-4-5-20251001","nudge_provider":"deepseek","nudge_model":"deepseek-v4-flash"}',
   'Marketing lane (Mira, the Closer) model route — TDW_08 P5. Replies ride provider/model; WAKE turns ride nudge_provider/nudge_model (F-08.69). Flip either here; no deploy.')
on conflict (key) do update
  set value = excluded.value, description = excluded.description, updated_at = now();

-- Confirmation (run it and paste the row back):
-- select key, value from public.admin_config where key = 'model.wa_marketing.default';

-- Revert (COMMENTED — run only on a CE ruling. Restores 0110's row exactly;
-- wakes then follow replies, which is the pre-F-08.69 behaviour):
-- update public.admin_config
--    set value = '{"provider":"anthropic","model":"claude-haiku-4-5-20251001"}',
--        updated_at = now()
--  where key = 'model.wa_marketing.default';
