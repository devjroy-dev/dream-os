-- db/migrations/0163_broadcast_fee_and_probe_config.sql — CE-42 seat R6, packet 4b-2.
-- 0163 ALLOCATED BY THE CHAIR (R-40.44). Three founder-editable config rows, one statement.
--
-- SQL PROVENANCE (protocol §10 · R-40.27 — a statement that WRITES cites the constraints
-- section of the table it writes):
--   columns     docs/db/PUBLIC_SCHEMA.md @0154  public.admin_config :43–:48
--               (1 key text NOT NULL · 2 value text NOT NULL · 3 description text ·
--                4 updated_at timestamptz NOT NULL default now())
--   constraints docs/db/PUBLIC_SCHEMA.md @0154  :1538–:1543  [PRIMARY KEY] admin_config_pkey (key)
--   No migration 0155–0162 touches admin_config (derived by grep at the cut).
-- Editable afterwards from admin via PATCH /api/v2/admin/config/:key (src/api/admin/config.js).
--
-- THE VALUES (chair-ruled 2026-09-10, STORAGE):
--   meta.marketing_paise_ex_gst = '86.31'  Meta's India MARKETING rate per delivered template,
--                                          in paise, EX-GST; a decimal string (86.31 paise is not
--                                          an integer). The founder re-reads it at every quarterly
--                                          pricing check (F-41.9).
--   meta.gst_percent            = '18'     GST on Meta's messaging charges.
--   ig_probe_vendor             = 'DEV440' the routing handle whose Instagram token the insights
--                                          probe reads (F-42.168, ruling 15a).
-- on conflict do nothing: a re-run never overwrites a value the founder has since edited.
insert into public.admin_config (key, value, description) values
  ('meta.marketing_paise_ex_gst', '86.31',  'Meta India MARKETING rate per delivered template, paise, ex-GST. Shown to vendors as the broadcast fee upper bound. Re-read quarterly (F-41.9).'),
  ('meta.gst_percent',            '18',     'GST percent on Meta messaging charges; added to the broadcast fee shown before send.'),
  ('ig_probe_vendor',             'DEV440', 'Routing handle whose Instagram token the insights permission probe reads (F-42.168).')
on conflict (key) do nothing;
