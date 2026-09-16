-- db/migrations/0168_vendor_packages.sql · CE-43 · LC-2 packet 1 · THE PACKAGE.
-- 0168 ALLOCATED BY THE CHAIR (C-43.8). Append-only (LD-8). Runs AFTER 0167.
--
-- SQL PROVENANCE (protocol §10):
--   Statements 1 and 5 CREATE tables; their witness is these statements.
--     FK public.vendors(id): PUBLIC_SCHEMA.md @0154 `## public.vendors · 55 columns` 1. id uuid NOT NULL;
--       §1 vendors_pkey PRIMARY KEY (id). 0166 adds exchange_discoverable only.
--     FK public.leads(id): `## public.leads · 28 columns` 1. id; §1 leads_pkey PRIMARY KEY (id).
--     FK public.pending_couple_drafts(id): `## public.pending_couple_drafts · 11 columns` 1. id;
--       §1 pending_couple_drafts_pkey PRIMARY KEY (id).
--   Statement 7 ALTERS public.invoices. Columns: `## public.invoices · 21 columns` (no lead_package_id).
--     Constraints (§10 write law): §1 invoices_amount_advance_check, invoices_amount_paid_check,
--     invoices_amount_total_check, invoices_state_check, invoices_pkey, invoices_vendor_number_unique;
--     §2 invoices_client_id_fkey, invoices_lead_id_fkey, invoices_vendor_id_fkey. The index in statement 8
--     reads deleted_at (ordinal 20).
--   Statement 9 ALTERS public.contracts. Columns: `## public.contracts · 21 columns` (no lead_package_id).
--     Constraints: §1 contracts_deposit_pct_check, contracts_state_check, contracts_pkey;
--     §2 contracts_client_id_fkey, contracts_event_id_fkey, contracts_invoice_id_fkey,
--     contracts_lead_id_fkey, contracts_vendor_id_fkey.
--   0155 to 0166 touch none of vendors' id, leads, pending_couple_drafts, invoices or contracts
--     (statement heads read at 713340a).
--
-- RULINGS CARRIED (CE-43 interim ruling on LC-2 read-first part 1, 2026-09-17):
--   · 0168 RATIFIED as proposed: vendor_id on lead_packages (resolveVendor's `via` reads the row's own
--     vendor_id), updated_at/deleted_at, quote_draft_id in place of a wamid column (the quote rides the
--     relay seat, F9(a), so pending_couple_drafts is its send record and R-40.110 owes nothing new),
--     uq_invoices_lead_package as the one-invoice guard, delivery_basis gaining 'handover'.
--   · F2: the remainder CHECK stands (payment_schedules_amount_due_check forbids a zero milestone), so
--     100% on booking is refused for now. F-43.57 → LC-3.
--   · Whole rupees (R-41.114): every amount is integer. The remainder milestone is computed, never stored
--     on the package (C-43.2).
--   · STATEMENT 3 · uq_vendor_packages_seed · RULED YES by CE-43 (F-43.70, 2026-09-17): one seeded row per
--     (vendor, seed key), ever, so two concurrent first reads cannot seed twice and a deleted seed is never
--     re-seeded (F-43.50 arm (b), "seeded once per vendor ever").
--   · No RLS statement: the estate's recent tables carry none (0158, 0161, 0164, 0166); every reader and
--     writer is the service-role server.
--
-- ⚠ FOUNDER-RUN IN THE SUPABASE EDITOR, AFTER 0167 AND BEFORE THE dream-os ZIP OF PACKET 1 IS APPLIED.
-- Every statement is its own paste block (R-40.31). Idempotent: re-running is a no-op.

-- ═══ STATEMENT 1 · the vendor's packages ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.vendor_packages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name            text        NOT NULL CHECK (char_length(btrim(name)) > 0),
  description     text        NOT NULL DEFAULT '',
  line_items      jsonb       NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(line_items) = 'array'),
  total           integer     CHECK (total IS NULL OR total > 0),
  deposit_pct     integer     NOT NULL DEFAULT 30 CHECK (deposit_pct BETWEEN 1 AND 99),
  middle_pct      integer     NOT NULL DEFAULT 30 CHECK (middle_pct BETWEEN 1 AND 98),
  middle_enabled  boolean     NOT NULL DEFAULT true,
  delivery_basis  text        NOT NULL CHECK (delivery_basis IN ('on_the_day', 'days', 'handover')),
  delivery_days   integer     CHECK (delivery_days IS NULL OR delivery_days BETWEEN 1 AND 365),
  is_default      boolean     NOT NULL DEFAULT false,
  seeded_from     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  CONSTRAINT vendor_packages_remainder_positive
    CHECK (deposit_pct + CASE WHEN middle_enabled THEN middle_pct ELSE 0 END < 100),
  CONSTRAINT vendor_packages_days_pairing
    CHECK ((delivery_basis = 'days') = (delivery_days IS NOT NULL))
);

-- ═══ STATEMENT 2 · one live default per vendor (zero permitted: performer) ═════════════════════════════
CREATE UNIQUE INDEX IF NOT EXISTS uq_vendor_packages_default
  ON public.vendor_packages (vendor_id)
  WHERE is_default AND deleted_at IS NULL;

-- ═══ STATEMENT 3 · seeded once per vendor, ever (F-43.70) ═════════════════════════════════════════════
CREATE UNIQUE INDEX IF NOT EXISTS uq_vendor_packages_seed
  ON public.vendor_packages (vendor_id, seeded_from)
  WHERE seeded_from IS NOT NULL;

-- ═══ STATEMENT 4 · the room's list read ═══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS vendor_packages_vendor_idx
  ON public.vendor_packages (vendor_id)
  WHERE deleted_at IS NULL;

-- ═══ STATEMENT 5 · the package attached to a lead (the quote's copy) ═══════════════════════════════════
CREATE TABLE IF NOT EXISTS public.lead_packages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  lead_id         uuid        NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  package_id      uuid        REFERENCES public.vendor_packages(id) ON DELETE SET NULL,
  snapshot        jsonb       NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  total           integer     CHECK (total IS NULL OR total > 0),
  schedule        jsonb       NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(schedule) = 'array'),
  delivery_on     date,
  quoted_at       timestamptz,
  quote_draft_id  uuid        REFERENCES public.pending_couple_drafts(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

-- ═══ STATEMENT 6 · one live package per lead ═══════════════════════════════════════════════════════════
CREATE UNIQUE INDEX IF NOT EXISTS uq_lead_packages_live
  ON public.lead_packages (lead_id)
  WHERE deleted_at IS NULL;

-- ═══ STATEMENT 7 · the invoice names its package ══════════════════════════════════════════════════════
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS lead_package_id uuid REFERENCES public.lead_packages(id) ON DELETE SET NULL;

-- ═══ STATEMENT 8 · one invoice per attached package (the promotion's retry guard) ═════════════════════
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_lead_package
  ON public.invoices (lead_package_id)
  WHERE lead_package_id IS NOT NULL AND deleted_at IS NULL;

-- ═══ STATEMENT 9 · the contract names its package (LC-3 reads it; nothing writes it in LC-2) ══════════
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS lead_package_id uuid REFERENCES public.lead_packages(id) ON DELETE SET NULL;
