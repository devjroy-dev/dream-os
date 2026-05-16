-- 0014_conversations_xor.sql
-- Session B1 fix: conversations table did not allow couple-owned rows.
-- Discovered during first live bride message test: insert failed with
-- "null value in column 'vendor_id' of relation 'conversations'".
--
-- This migration is the mirror of what 0013 did for events + notes,
-- applied to the conversations table.
--
-- WHAT THIS ADDS
--   conversations.vendor_id  — now nullable (was NOT NULL since 0001)
--   conversations.couple_id  — new column referencing couples(id)
--   XOR constraint           — exactly one of vendor_id / couple_id is set
--   conversations_couple_id_idx — query index
--
-- BRIDE SIDE BEHAVIOR
--   Bride conversations have kind='couple_self', couple_id set, vendor_id null.
--
-- VENDOR SIDE BEHAVIOR — unchanged
--   All existing rows have vendor_id set, so XOR passes for them automatically.
--   New vendor inserts still set vendor_id; couple_id stays null.
--
-- IMMUTABILITY: never edit this file. Changes go in 0015+.

-- ── conversations: nullable vendor_id, add couple_id, enforce XOR ───
alter table conversations alter column vendor_id drop not null;

alter table conversations
  add column if not exists couple_id uuid references couples(id) on delete cascade;

alter table conversations add constraint conversations_owner_xor
  check ((vendor_id is null) <> (couple_id is null));

create index if not exists conversations_couple_id_idx on conversations(couple_id);
