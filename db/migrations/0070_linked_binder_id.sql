-- 0070_linked_binder_id.sql — link a calendar event back to its client binder.
--
-- A booking and the engagement it belongs to are two rows: the calendar event
-- (events) and the client binder (engine.records). They each carry their own date,
-- and nothing tied them — so an edit to one could leave the other stale (a shoot's
-- date moved on the calendar while the binder still read the old date). This soft
-- reference lets Donna keep the two in lockstep: when a linked event moves, the
-- binder follows, and when the binder's date moves, the event follows.
--
-- Soft ref (no cross-schema FK to engine.records) — the binder lives in the engine
-- schema; we store the id and reconcile in Donna's hand, not via a DB constraint.
-- Additive, safe, idempotent.

alter table events add column if not exists linked_binder_id uuid;

create index if not exists events_linked_binder_idx
  on events (linked_binder_id)
  where linked_binder_id is not null;
