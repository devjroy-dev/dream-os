-- 0073_llm_config_seed.sql — TDW_02 P5: model routing seeds (Amendment One CE-6/CE-23-ii).
--
-- TWO KEY FAMILIES live in admin_config, deliberately (CE-23 ii):
--   • FLAT caps keys (vendor_pwa_daily_<tier> / vendor_pwa_monthly_<tier>) — the
--     pre-existing family, ADOPTED as the cap truth per CE-6; both windows enforced.
--   • DOTTED model.* keys (below) — NEW vocabulary with no prod precedent, so the
--     spec's dotted naming binds. Values are JSON-IN-TEXT (the value column is text,
--     D7); modelRouter parses defensively and junk falls to the default matrix.
--
-- Seeds == modelRouter's DEFAULTS, so a pre-seed deploy routes identically; these
-- rows exist to make routes ADMIN-EDITABLE (the PATCH door 404s on unknown keys, D7).
-- Idempotent: ON CONFLICT DO NOTHING. Apply via Supabase SQL editor.

insert into public.admin_config (key, value, description) values
  ('model.pwa_vendor.trial',
   '{"provider":"glm","model":"glm-4.7-flash"}',
   'PWA Victor model route — trial tier (TDW_02 P5)'),
  ('model.pwa_vendor.essential',
   '{"provider":"deepseek","model":"deepseek-v4-flash"}',
   'PWA Victor model route — essential tier (TDW_02 P5)'),
  ('model.pwa_vendor.signature',
   '{"provider":"anthropic","model":"claude-haiku-4-5-20251001"}',
   'PWA Victor model route — signature tier (TDW_02 P5)'),
  ('model.pwa_vendor.prestige',
   '{"provider":"anthropic","model":"claude-haiku-4-5-20251001","escalation_model":"claude-sonnet-4-6"}',
   'PWA Victor model route — prestige tier; escalation via the engine''s escalate tool (TDW_02 P5)'),
  ('model.harvest.default',
   '{"provider":"glm","model":"glm-4.7-flash"}',
   'Harvest extraction model route (TDW_02 P4 seam -> P5 facade)')
on conflict (key) do nothing;

-- Confirmation:
-- select key, value from public.admin_config where key like 'model.%' order by key;
