-- ════════════════════════════════════════════════════════════════════
-- Migration 0021 — Add label column to couple_receipts
-- Date:    2026-05-17
-- Session: B3 (Step 6 prep)
-- Author:  Dev
-- ════════════════════════════════════════════════════════════════════
--
-- WHAT THIS ADDS
--   couple_receipts.label  — free-text bride-supplied tag for a receipt
--                            (e.g. "Anvaya advance", "hairdresser",
--                            "florist booking fee"). Used for retrieval
--                            via list_receipts(label_search).
--   couple_receipts_couple_label_idx — partial index on (couple_id,
--                            lower(label)) for case-insensitive search,
--                            skipping rows where label is null.
--
-- WHY THIS, NOT vendor_name
--   couple_receipts already has vendor_name (text, nullable). But the
--   bride product (B3) uses receipts as a SAFEKEEPING VAULT — visual
--   storage with bride-supplied free text — not as a vendor-linked
--   expense ledger. Putting "hairdresser" or "florist booking fee" into
--   vendor_name would pollute that column for future PWA/Discover work
--   that wants vendor_name to mean a real vendor entity.
--
--   `label` keeps the semantics honest. vendor_name stays empty in B3
--   and remains available for structured vendor linkage later.
--
-- DESIGN PRINCIPLES THIS RESPECTS
--   - Receipts are NOT linked to bookings in B3 tools (booking_id stays
--     null). Receipt vault is decoupled from expense reconciliation.
--   - No OCR extraction. The bride says what the receipt is and how
--     much; that's the entire data we capture.
--   - No update_receipt tool. PWA-era handles edits.
--
-- IMMUTABILITY: never edit this file. Changes go in 0022+.
-- ════════════════════════════════════════════════════════════════════

alter table couple_receipts add column if not exists label text;

create index if not exists couple_receipts_couple_label_idx
  on couple_receipts(couple_id, lower(label))
  where label is not null;

-- ════════════════════════════════════════════════════════════════════
-- End of 0021_couple_receipts_label.sql
-- ════════════════════════════════════════════════════════════════════
