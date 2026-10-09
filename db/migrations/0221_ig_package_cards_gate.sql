-- db/migrations/0221_ig_package_cards_gate.sql · CE-47 · CLB part C · PACKAGE CARDS IN HER INSTAGRAM MESSAGES.
-- The next number above main's 0220 (the chair's ruling, 8 Oct 2026; no out-of-order record).
-- ROWS ONLY: one flag row for the Meta-gated feature "Package cards in Instagram messages". The feature-to-permissions map
-- lives in ONE home, src/lib/metaGates.js (instagram_business_basic and instagram_business_manage_messages, the same pair as
-- Instagram messages). Under the founder's standing rule for Meta-gated features (4 Oct 2026), the row turns on by itself
-- when Meta grants those permissions (auto_on, with its walk_ref), and her own choice is ON unless she turns it off
-- (vendor_feature_choices, 0214: no row means on). Until the grant, the feature opens only for clb.testers vendors who are
-- also on the Instagram lane's walk list (src/lib/instagram/igCards.js). No table, no column, no CHECK, no grant change.
BEGIN;
INSERT INTO public.capabilities (key, kind, status, auto_on, walk_ref) VALUES
  ('flag.ig_package_cards', 'flag', 'pending', true, 'ruled:CE-47 8 Oct 2026, live by itself on approval')
ON CONFLICT (key) DO NOTHING;
COMMIT;
-- ROLLBACK (run by hand only):
--   BEGIN; DELETE FROM public.vendor_feature_choices WHERE feature_key = 'flag.ig_package_cards';
--   DELETE FROM public.capabilities WHERE key = 'flag.ig_package_cards'; COMMIT;
