mv 0050_pending_lead_pings.sql db/migrations/-- 0050_pending_lead_pings.sql
-- Patch 6 — vendor-side pronoun resolution.
--
-- A "ping" represents a recently-active lead the vendor agent should treat
-- as the default referent for ambiguous pronouns ("tell her", "reply to her").
--
-- A ping is written when:
--   1. A bride sends a message via couple_thread (runCoupleAgenticTurn)
--   2. The vendor agent creates a new lead via create_lead tool
--
-- A ping is "active" when acknowledged_at IS NULL AND created_at >= now() - 10 min.
-- The vendor agent reads active pings at the start of each turn and injects
-- them into dynamic context. Pings are auto-acknowledged when the agent
-- acts on the referenced lead (draft, update, etc.).

create table if not exists pending_lead_pings (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references vendors(id) on delete cascade,
  lead_id         uuid not null references leads(id) on delete cascade,
  lead_name       text,
  bride_message   text,
  intent_summary  text,
  source          text not null check (source in ('bride_message', 'vendor_create_lead')),
  created_at      timestamptz not null default now(),
  acknowledged_at timestamptz
);

create index if not exists idx_pending_pings_vendor_open
  on pending_lead_pings (vendor_id, created_at desc)
  where acknowledged_at is null;

comment on table pending_lead_pings is
  'Recently-active leads per vendor. Used by runAgenticTurn to resolve pronoun references like "tell her" — single active ping = that lead; multiple active pings = agent asks which.';
