-- ═══════════════════════════════════════════════════════════════════════════
-- 0185 · DESIGN-1 · THE LAYOUT SWITCH, seeded OFF (the founder, 29 Sept 2026)
-- Ladder tail derived: `ls db/migrations | grep -E '^[0-9]{4}' | sort | tail -1` → 0182; 0183 is reserved (the price
-- switch, price_share_enabled) and 0185 was named by the founder for this cut, so this file takes it. WRITTEN, NOT
-- APPLIED: it lands through the chair's queue like every other cut.
--
-- WHY: the redesigned vendor layout (DESIGN-1 stages 1 to 5) lives in the pwa behind a per-vendor setting with a global
-- default. The founder's word: prefer the estate's switchboard over a new column. So:
--   · this row is the GLOBAL DEFAULT. Off: every vendor sees today's layout. The founder flips it on the Switchboard
--     card (C2) when the new layout goes to everyone; flipping it back is the standby, no deploy.
--   · LAYOUT_V2_VENDOR_IDS (a Railway variable, a comma list of vendor ids, the IG_DM_WALK_VENDOR_IDS way) turns the
--     new layout on for the vendors named there while the default is off.
-- The one predicate home is src/lib/vendorLayout.js; GET /api/v2/vendor/me carries its answer as `layout`.
--
-- PROVENANCE: public.capabilities — db/migrations/0149_capabilities.sql (key PK, kind CHECK 'flag', status 'off').
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.capabilities (key, kind, status, evidence, flipped_at, flipped_by) values
  ('flag.vendor_layout_v2', 'flag', 'off',
   'seed: DESIGN-1 — off until the founder switches the new vendor layout on for everyone on the Switchboard card; per vendor meanwhile by LAYOUT_V2_VENDOR_IDS',
   now(), 'seed')
on conflict (key) do nothing;
