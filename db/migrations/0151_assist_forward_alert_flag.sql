-- ═══════════════════════════════════════════════════════════════════════════
-- 0151 · BLOCK 20 · CONCIERGE s1 — F-41.37 · the forward's vendor alert, seeded OFF
-- CE-41 seat A, rider under R-41.68. Cut at dream-os fad5e68. Ladder tail derived:
-- `ls db/migrations | grep -E '^[0-9]{4}' | sort | tail -1` → 0150.
--
-- WHY: the concierge forward creates the vendor's lead (createLead, source
-- tdw_assist) and never told the vendor — createLead sends nothing by design and
-- every other lead door fires its own alert. The founder's glass, 2026-09-08
-- (DROY550 held the lead, heard nothing). forwardToVendor now sends
-- tdw_lead_alert_utility (Utility, Active, registry key lead_alert_utility)
-- behind THIS flag. Seeded OFF: a new send to real vendors walks before it is on;
-- the founder flips it on the Switchboard card (C2), not in code (R-41.68).
--
-- PROVENANCE: public.capabilities — db/migrations/0149_capabilities.sql (key PK,
-- kind CHECK 'flag', status CHECK 'off', evidence, flipped_at, flipped_by).
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.capabilities (key, kind, status, evidence, flipped_at, flipped_by) values
  ('flag.assist_forward_alert', 'flag', 'off',
   'seed: R-41.68 — off until the founder walks one live forward alert to a test vendor and flips it on the Switchboard card',
   now(), 'seed')
on conflict (key) do nothing;
