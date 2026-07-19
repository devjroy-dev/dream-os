-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Migration 0084 — messages.message_sid (durable inbound dedupe home)       ║
-- ║  TDW_05 Block 05, P1b (Movement B) · RF-1, CE-ruled                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- RULING (CE, Movement-B clearance, RF-1 restated): the durable dedupe backstop
-- gets a real home — a nullable inbound-only messages.message_sid column plus a
-- PARTIAL unique index. Both services now write the inbound MessageSid here on
-- persist (vendor's discard closed; bride moved off the overloaded twilio_sid).
-- The in-process LRU is the fast path; this index is the cross-process/-restart
-- backstop — a duplicate that slips the LRU raises 23505, which the handlers'
-- outer catch classifies as an idempotent drop (never a dead letter).
--
-- Additive, founder-run, no backfill (pre-migration inbound rows keep message_sid
-- NULL and are simply excluded from the partial index). Code graceful-degrades if
-- this column is absent (boot probe → LRU-only + a warn line), so it may deploy on
-- either side of this migration — the "conditional-withheld" rule.

alter table messages add column if not exists message_sid text;

-- Partial: uniqueness applies only to rows that carry a sid (the inbound rows).
-- NOTE: on a large production messages table, the founder may prefer to build this
-- index out-of-band with CREATE UNIQUE INDEX CONCURRENTLY (cannot run inside a txn).
create unique index if not exists messages_message_sid_uidx
  on messages(message_sid) where message_sid is not null;

-- ── verify ───────────────────────────────────────────────────────────────────
-- select column_name, data_type, is_nullable from information_schema.columns
--   where table_name = 'messages' and column_name = 'message_sid';
-- select indexdef from pg_indexes where indexname = 'messages_message_sid_uidx';

-- ── revert (commented) ───────────────────────────────────────────────────────
-- drop index if exists messages_message_sid_uidx;
-- alter table messages drop column if exists message_sid;
