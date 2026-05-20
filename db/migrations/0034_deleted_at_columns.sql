-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0034: deleted_at columns on five vendor-owned tables
--
-- CONTEXT
-- Phase 2, Session P2-6b-alpha2. Unlocks soft-delete on the rows the agent
-- can mutate. Adds new edit/delete tools available on the PWA web channel
-- (web-only, gated inside src/agent/engine.js). WhatsApp is untouched.
--
-- WHY SOFT DELETE
-- - Recoverable. Vendor says "delete the Priya invoice", agent matches the
--   wrong Priya, vendor notices. We can restore by setting deleted_at = NULL.
--   Hard delete would be irreversible.
-- - Matches the pattern used in the tdw-2 reference codebase
--   (dream-wedding/backend/agentic/wedding/vendor/toolHandlers/delete*.js).
-- - Cheap. One column per table, no triggers, no indexes for now.
--
-- AFFECTED TABLES
--   invoices, expenses, clients, events, leads
-- All five are vendor-owned write surfaces the agent can list/edit/delete.
-- "notes" is intentionally excluded — deletes on the note_to_self surface
-- are out of scope for tonight (decided in session).
--
-- COLUMN SHAPE
--   deleted_at TIMESTAMPTZ — nullable, no default
-- NULL = row is live. Non-NULL = row is soft-deleted (timestamp of deletion).
--
-- READ-SIDE CONTRACT (enforced in application code, not the database)
-- Every existing list/read query must add  .is('deleted_at', null)  so
-- soft-deleted rows stop appearing in lists, snapshots, and tool outputs.
-- That audit happens in Writer 2 of this session.
--
-- ROLLBACK
-- This migration is purely additive. Rolling back is:
--   ALTER TABLE invoices DROP COLUMN deleted_at;
--   ALTER TABLE expenses DROP COLUMN deleted_at;
--   ALTER TABLE clients  DROP COLUMN deleted_at;
--   ALTER TABLE events   DROP COLUMN deleted_at;
--   ALTER TABLE leads    DROP COLUMN deleted_at;
-- No data is lost on rollback because deleted_at is the only thing being
-- removed and it starts NULL for every existing row.
--
-- NO INDEX FOR NOW
-- A partial index  WHERE deleted_at IS NULL  could speed up filtered reads
-- once the live row count grows. At founding-cohort scale this is premature.
-- Slot for a follow-up performance pass.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION
-- After running the migration, run the query below in the Supabase SQL Editor.
-- Expected output: five rows, one per table, all showing deleted_at as a
-- nullable timestamptz column.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- SELECT table_name, column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND column_name = 'deleted_at'
--   AND table_name IN ('invoices', 'expenses', 'clients', 'events', 'leads')
-- ORDER BY table_name;
