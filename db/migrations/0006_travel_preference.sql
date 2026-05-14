-- ════════════════════════════════════════════════════════════════════
-- Migration 0006 -- Travel preference
-- Date:    2026-05-14
-- Session: 5
-- Author:  Dev
-- ════════════════════════════════════════════════════════════════════
--
-- WHAT THIS ADDS
--   vendors.open_to_travel  -- boolean, set during onboarding asked_travel step
--   vendors.travel_notes    -- raw travel preference as vendor stated it
--
-- IMMUTABILITY: never edit this file. New changes go in 0007+.
-- ════════════════════════════════════════════════════════════════════

alter table vendors
  add column if not exists open_to_travel boolean default false,
  add column if not exists travel_notes   text;

comment on column vendors.open_to_travel is
  'Whether vendor is open to travelling for shoots. Set during onboarding asked_travel step.';

comment on column vendors.travel_notes is
  'Raw travel preference as vendor stated it e.g. Yes pan-India. Set during onboarding.';
