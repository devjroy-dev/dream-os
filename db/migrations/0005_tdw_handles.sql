-- ════════════════════════════════════════════════════════════════════
-- Migration 0005 — TDW routing handles
-- Date:    2026-05-14
-- Session: 5
-- Author:  Dev
-- ════════════════════════════════════════════════════════════════════
--
-- WHAT THIS ADDS
--   vendors.routing_handle  — unique TDW code suffix e.g. RAHULCLICKS
--                             stored UPPERCASE, alphanumeric + hyphen only
--                             couples send "TDW-RAHULCLICKS" to reach vendor
--   vendors.instagram_handle — raw IG handle as vendor provided e.g. rahulclicks
--   users.email              — collected naturally in conversation
--
-- IMMUTABILITY: never edit this file. New changes go in 0006+.
-- ════════════════════════════════════════════════════════════════════

alter table vendors
  add column if not exists routing_handle  text unique,
  add column if not exists instagram_handle text;

alter table users
  add column if not exists email text;

-- Index for fast routing lookups on every inbound message
create index if not exists vendors_routing_handle_idx on vendors(routing_handle);

comment on column vendors.routing_handle is
  'TDW code suffix. Stored uppercase, e.g. RAHULCLICKS. Couples send TDW-RAHULCLICKS to reach this vendor. UNIQUE across all vendors.';

comment on column vendors.instagram_handle is
  'Raw Instagram handle as provided by vendor during onboarding, e.g. rahulclicks (without @). NULL if vendor skipped.';

comment on column users.email is
  'Email collected naturally in conversation — no dedicated onboarding step.';
