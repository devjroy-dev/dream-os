-- db/migrations/0192_meta_gate_rows.sql · CE-47 ADS-2 cut 2 item 3 · R-46.15, the approval sweep.
-- The next free number derived at the cut: main holds 0185, 0187 to 0190; 0186 is G6-6's and 0191 WEB-4 cut 7's; 0181 was never used.
-- ROWS ONLY: the perm.* rows the TDW ADS app's features need that the register did not yet hold, and one flag row per
-- Meta-gated feature that had none (the Instagram photo import). The feature-to-permissions map lives in ONE home,
-- src/lib/metaGates.js, not in this table. No CHECK is added (none was ruled). Every row is born 'pending', auto_on
-- false: a feature turns on by itself only when a walk card's witnessed UPDATE sets auto_on and walk_ref.
BEGIN;
INSERT INTO public.capabilities (key, kind, status) VALUES
  ('perm.ads_management',            'permission', 'pending'),
  ('perm.pages_read_engagement',     'permission', 'pending'),
  ('perm.pages_show_list',           'permission', 'pending'),
  ('perm.pages_manage_ads',          'permission', 'pending'),
  ('perm.instagram_basic',           'permission', 'pending'),
  ('perm.instagram_manage_insights', 'permission', 'pending'),
  ('flag.ig_photo_import',           'flag',       'pending')
ON CONFLICT (key) DO NOTHING;
COMMIT;
-- ROLLBACK (run by hand only):
--   BEGIN; DELETE FROM public.capabilities WHERE key IN ('perm.ads_management','perm.pages_read_engagement',
--     'perm.pages_show_list','perm.pages_manage_ads','perm.instagram_basic','perm.instagram_manage_insights',
--     'flag.ig_photo_import'); COMMIT;
