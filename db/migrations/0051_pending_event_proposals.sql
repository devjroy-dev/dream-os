-- 0051_pending_event_proposals.sql
-- Patch 8 — vendor calendar bulk-import via image OCR.
--
-- Workflow:
--   1. Vendor sends a calendar screenshot to WhatsApp.
--   2. index.js calls Haiku Vision → extracts structured events.
--   3. We INSERT a row in pending_event_proposals with the array of
--      proposed events as JSONB, mark it unresolved.
--   4. We send the vendor the list via WhatsApp and ask
--      "Save all? Skip any?".
--   5. Vendor's next message runs through the agent. The agent reads
--      active proposals from dynamic context and calls
--      commit_event_proposals with the chosen action.
--   6. commit_event_proposals inserts the chosen rows into events table
--      and marks the proposal resolved.
--
-- A proposal stays "active" for 30 minutes. After that we ignore it
-- (vendor's message moved on). No background cleanup required — the
-- agent's read query filters by created_at, stale rows just sit.

create table if not exists pending_event_proposals (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references vendors(id) on delete cascade,
  proposals    jsonb not null,                   -- array of {title, event_date, event_time?, kind, notes?}
  source_image_url text,                         -- Twilio media URL (audit, not persisted long-term)
  caption      text,                             -- vendor caption alongside the image, if any
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz,                      -- set when commit_event_proposals fires
  resolution   text check (resolution in ('save_all', 'save_selected', 'cancel'))
);

create index if not exists idx_pending_event_proposals_vendor_open
  on pending_event_proposals (vendor_id, created_at desc)
  where resolved_at is null;

comment on table pending_event_proposals is
  'Staging table for events extracted from vendor calendar screenshots via Haiku Vision. Vendor confirms via next WhatsApp message; agent commits to events table.';
