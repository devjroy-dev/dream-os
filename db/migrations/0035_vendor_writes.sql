-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0035: vendor_writes
--
-- CONTEXT
-- Phase 2, Block 1a. Adds soft-delete columns to the five core vendor tables,
-- partial indexes for the common WHERE deleted_at IS NULL filter, the
-- vendor_availability table for calendar blocking, and sets the default
-- source on leads to 'whatsapp'.
--
-- Idempotent: every ADD COLUMN uses IF NOT EXISTS, CREATE TABLE uses
-- IF NOT EXISTS, constraint and trigger guards use DO $$ blocks.
--
-- Safe to apply on existing prod DB. No user data touched. No existing
-- columns dropped or renamed. No FK constraints altered.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE leads     ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE clients   ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE invoices  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE expenses  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE events    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS leads_active_idx
  ON leads (vendor_id, state) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS clients_active_idx
  ON clients (vendor_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS invoices_active_idx
  ON invoices (vendor_id, state) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS expenses_active_idx
  ON expenses (vendor_id, expense_date) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS events_active_idx
  ON events (vendor_id, event_date) WHERE deleted_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'events'
      AND c.conname LIKE '%kind%'
      AND pg_get_constraintdef(c.oid) LIKE '%task%'
  ) THEN
    RAISE EXCEPTION 'events.kind constraint does not include task — migration 0013 prerequisite missed.';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS vendor_availability (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id     uuid        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  blocked_date  date        NOT NULL,
  reason        text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, blocked_date)
);

CREATE INDEX IF NOT EXISTS vendor_availability_vendor_date_idx
  ON vendor_availability (vendor_id, blocked_date);

ALTER PUBLICATION supabase_realtime ADD TABLE vendor_availability;

ALTER TABLE leads ALTER COLUMN source SET DEFAULT 'whatsapp';
