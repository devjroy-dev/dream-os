-- 0071_owner_notes.sql — the owner's scratchpad ("note to self").
--
-- A wedding-vendor CRM is also a planner. Sometimes the owner wants to log a raw,
-- unprocessed thought — a thread to pick up later ("take Priya to doctor Tuesday",
-- "Shweta called, need discussion", "new lead, follow up"). These are NOT engagements:
-- no money, no firm date. They are notes to self. The owner writes them by his own hand,
-- bypassing both agents — a direct write, no Harvey reading intent, no Donna filing.
--
-- This is the one place the agents never write. Donna has VISION of it (the door surfaces
-- open notes into her read context, and donna_find covers it) and surfaces what's relevant
-- to Harvey by her own judgment — but she never writes here, not body, not state. Only the
-- owner creates a note (the "just do it" toggle) and only the owner deletes one. A note
-- exists until the owner removes it (no folded/handled state — delete is the only exit).
--
-- binder_id is optional: set only when the owner jotted the note against a client (a soft
-- ref to engine.records.id — cross-schema, no DB FK). Most notes float free.
--
-- Additive, safe, idempotent.

create table if not exists owner_notes (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references vendors(id) on delete cascade,
  body        text not null,
  binder_id   uuid,                   -- optional soft ref -> engine.records.id (client the note was jotted against)
  created_at  timestamptz not null default now()
);

create index if not exists owner_notes_vendor_recent_idx
  on owner_notes (vendor_id, created_at desc);
