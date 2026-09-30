-- ═══════════════════════════════════════════════════════════════════════════
-- 0185 · DESIGN-1 · THE LAYOUT SWITCH, seeded OFF (the founder, 29 Sept 2026)
-- Ladder tail derived: `ls db/migrations | grep -E '^[0-9]{4}' | sort | tail -1` → 0182; 0183 is reserved (the price
-- switch, price_share_enabled) and 0185 was named by the founder for this cut, so this file takes it. WRITTEN, NOT
-- APPLIED: it lands through the chair's queue like every other cut.
--
-- WHY: the redesigned vendor layout (DESIGN-1 stages 1 to 5) lives in the pwa behind a per-vendor setting with a global
-- default, both on the admin panel's Switchboard. So:
--   · this row is the GLOBAL DEFAULT. Off: every vendor sees today's layout. The founder flips it on the Switchboard
--     card (C2) when the new layout goes to everyone; flipping it back is the standby, no deploy.
--   · vendors.layout_v2 (section 3 below; CE-46 F3, ONE HOME, 30 Sept 2026) turns the new layout on for one vendor
--     while the default is off. Added and removed on the same Switchboard card (find a vendor, Add; Remove on each
--     listed vendor), no deploy. The Railway variable LAYOUT_V2_VENDOR_IDS of the first cut is retired, read nowhere.
--     This file was never applied and never on main, so it is amended, not renumbered (LD-8 untouched).
-- The one predicate home is src/lib/vendorLayout.js; GET /api/v2/vendor/me carries its answer as `layout`.
--
-- THE 30 DAYS (the founder and the chair, second row): the date the master was FIRST turned on is recorded once and
-- shown beside it ("Classic layout kept until <date + 30 days>"). It lives in its own switchboard row,
-- flag.vendor_layout_v2.first_on, seeded off: the first time the master turns on, vendorLayout.setMaster turns this
-- row on, and its flipped_at is that date. It never moves again (turning the master off and on keeps the first date),
-- nothing reads it as a gate, and the admin's flip door refuses it by hand. The classic layout's removal is a separate
-- later cut, never automatic.
--
-- PROVENANCE: public.capabilities — db/migrations/0149_capabilities.sql (key PK, kind CHECK 'flag', status 'off').
-- public.vendors exists since the ladder's start; layout_v2 is a new column (no column of that name in
-- docs/db/PUBLIC_SCHEMA.md; this file is its witness until the snapshot is regenerated). Alters only, creates no table,
-- so A-45.8 grants nothing (service_role's grants on vendors stand). Additive, default false, NO backfill.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.capabilities (key, kind, status, evidence, flipped_at, flipped_by) values
  ('flag.vendor_layout_v2', 'flag', 'off',
   'seed: DESIGN-1 — off until the founder switches the new vendor layout on for everyone on the Switchboard card; per vendor meanwhile by vendors.layout_v2, on the same card',
   now(), 'seed')
on conflict (key) do nothing;

insert into public.capabilities (key, kind, status, evidence, flipped_at, flipped_by) values
  ('flag.vendor_layout_v2.first_on', 'flag', 'off',
   'seed: DESIGN-1 — the date flag.vendor_layout_v2 was first turned on (flipped_at, once); read by the admin panel, never a gate',
   null, 'seed')
on conflict (key) do nothing;

-- ── 3 · THE PER-VENDOR SWITCH (CE-46 F3, ONE HOME) ─────────────────────────────────────────────────────────────
alter table public.vendors
  add column if not exists layout_v2 boolean not null default false;

-- ──────────────────────────────────────────────────────────────────────────
-- VERIFY (each SELECT mutates nothing):
-- 1) the two switchboard rows, both off:
-- select key, kind, status from public.capabilities where key like 'flag.vendor_layout_v2%' order by key;
-- expect: flag.vendor_layout_v2 | flag | off ; flag.vendor_layout_v2.first_on | flag | off
-- 2) the column, boolean, not null, default false:
-- select column_name, data_type, is_nullable, column_default from information_schema.columns
--  where table_schema = 'public' and table_name = 'vendors' and column_name = 'layout_v2';
-- expect: layout_v2 | boolean | NO | false
-- 3) nobody is on the new layout yet:
-- select count(*) as on_v2 from public.vendors where layout_v2;
-- expect: 0
-- REVERT (never run unless ruled):
-- alter table public.vendors drop column if exists layout_v2;
-- delete from public.capabilities where key in ('flag.vendor_layout_v2', 'flag.vendor_layout_v2.first_on');
-- ──────────────────────────────────────────────────────────────────────────
