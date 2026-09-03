-- db/migrations/0130_vendor_payment_rails.sql
-- S2 · THE INVOICE DOCUMENT · F-2c.w8
--
-- ALREADY APPLIED. The founder ran this statement in the Supabase SQL editor on
-- 2026-09-03 against project nvzkbagqxbysoeszxent (main / PRODUCTION); the editor
-- returned "Success. No rows returned". This file is the LADDER'S RECORD of a
-- migration that is already live, filed so the ladder is not missing a rung that
-- production has — never renumber, never re-derive (LD-8, append-only).
--
-- Re-running it is safe and is a no-op: every clause is IF NOT EXISTS.
--
-- WHAT THESE FOUR COLUMNS ARE FOR. The invoice document prints the vendor's own
-- payment rails and her postal identity. Before S2 the PDF could offer a couple a
-- UPI QR and nothing else — no bank transfer, and no address on a document that is
-- a commercial record. `gstin` and `city` already existed (ordinals 8 and 6) and
-- needed no migration; these four did not exist at all.
--
-- LADDER: tip at authoring was 0129_agents_user_id_unique.sql. This sits AT the tip,
-- not in a reserved hole, so it takes NO record in db/migrations/OUT_OF_ORDER.json —
-- that register's formatter aborts on any number not strictly below the tip.
--
-- OWED: a PAIR regen (db/queries/public_schema_dump.sql, founder-run, piped through
-- db/queries/format_public_schema.js). Until it runs, docs/db/PUBLIC_SCHEMA.md
-- describes public.vendors as 45 columns and does not know these four. The
-- SQL-provenance law is satisfied for them BY THIS FILE and by nothing else, which
-- is exactly why the note is here and not only in a handover.

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS account_name   text,
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS ifsc           text,
  ADD COLUMN IF NOT EXISTS address        text;
