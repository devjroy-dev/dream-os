-- 0082_advisor_route_seed.sql — TDW_06 P6b (F-06.4, CE-ratified): the advisor model route.
--
-- Mode-scoped routing: victor_mode='advisor' routes Victor to deepseek at the door
-- (chat.js buildLlmForTurn reads engine.agents.victor_mode by the SERVER-RESOLVED agentId
-- and resolves model.pwa_vendor.advisor). Business/consult are byte-untouched — they keep
-- resolving by the product tier.
--
-- Seed == modelRouter's DEFAULTS entry ('model.pwa_vendor.advisor'), so a pre-seed deploy
-- routes advisor IDENTICALLY (never a silent fall to Haiku — the room deepseek is meant to
-- serve). This row exists to make the route ADMIN-EDITABLE (the PATCH door 404s on unknown
-- keys, D7). Idempotent: ON CONFLICT DO NOTHING. Founder-run via the Supabase SQL editor.

insert into public.admin_config (key, value, description) values
  ('model.pwa_vendor.advisor',
   '{"provider":"deepseek","model":"deepseek-v4-flash"}',
   'PWA Victor model route — advisor room (victor_mode=advisor); routed at the door (TDW_06 P6b, F-06.4)')
on conflict (key) do nothing;

-- Confirmation:
-- select key, value from public.admin_config where key = 'model.pwa_vendor.advisor';

-- Revert (commented — run only to un-seed; DEFAULTS still routes advisor to deepseek in-process):
-- delete from public.admin_config where key = 'model.pwa_vendor.advisor';
