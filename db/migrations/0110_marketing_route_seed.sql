-- 0110_marketing_route_seed.sql — TDW_08 P5 Phase 3: MAYA'S MODEL ROUTE.
--
-- The marketing lane's first AI needs a route. This is FORK 2 as ruled: BOTH a
-- DEFAULTS entry in src/lib/modelRouter.js AND this seed row.
--
-- WHY BOTH, and it is not belt-and-braces. The DEFAULTS entry means a pre-seed
-- or config-read-failure deploy routes IDENTICALLY rather than falling to a
-- generic fallback that happens to be right — an accidentally-correct route is
-- the drift class. The SEED ROW exists because the admin PATCH door 404s on a
-- key with no row (D7), so without it the route is not admin-editable and the
-- estate's 60-second config-reversal doctrine does not apply to this lane.
--
-- A PROSPECT HAS NO TIER. They are not vendors and hold no `vendors` row, so
-- the tier slot is `default`. `model.harvest.default` is the structural
-- precedent for a single-mouth surface; `model.pwa_vendor.<tier>` is not.
--
-- SEEDED HAIKU per E-4's unified architecture (every outward Victor-class mouth
-- starts Haiku, cached) and per the 06 spec's own word for this lane.
--
-- THE FOUNDER'S MODEL OPTION 「 the option should be there 」 IS THIS ROW.
-- Flipping Maya between Haiku and DeepSeek is an UPDATE here — no deploy, no
-- code change, 60 seconds, reversible. Both flip forms ship COMMENTED in the
-- delivery per the conditional-withheld rule and are CE-gated, exactly as every
-- flip has been since E-1.
--
-- COLUMN PROVENANCE (protocol §9, THE SQL-PROVENANCE LAW): public.admin_config
-- is 4 columns — key text NOT NULL, value text NOT NULL, description text,
-- updated_at timestamptz NOT NULL default now() — witnessed at
-- docs/db/PUBLIC_SCHEMA.md:33-40 and re-confirmed against the founder's own
-- information_schema paste of 2026-08-04. `value` is TEXT and carries JSON,
-- which is why modelRouter.parseRoute parses it defensively.
--
-- FORM: 0082_advisor_route_seed.sql's exact shape, deliberately. Idempotent.
-- Founder-run in the Supabase SQL editor.

insert into public.admin_config (key, value, description) values
  ('model.wa_marketing.default',
   '{"provider":"anthropic","model":"claude-haiku-4-5-20251001"}',
   'Marketing lane (Maya, the Closer) model route — TDW_08 P5 Phase 3. Flip provider/model here to move her between architectures; no deploy.')
on conflict (key) do nothing;

-- Confirmation:
-- select key, value from public.admin_config where key = 'model.wa_marketing.default';

-- Revert (commented — run only to un-seed; DEFAULTS still routes Maya to haiku
-- in-process, so un-seeding removes ADMIN-EDITABILITY and changes no behaviour):
-- delete from public.admin_config where key = 'model.wa_marketing.default';
