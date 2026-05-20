-- 0036_lead_vendor_summary.sql
-- Adds vendor_summary to leads for fast denormalised access in lead detail view.
-- Set at lead creation time in index.js after couple agent runs.
-- Safe to re-run.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vendor_summary text;
