-- db/migrations/0167_leads_binder_link.sql · CE-43 · LC-2 packet 1 · THE LEAD ↔ BINDER LINK.
-- 0167 ALLOCATED BY THE CHAIR (C-43.8). Append-only (LD-8). Ladder tail at 713340a: 0166.
--
-- SQL PROVENANCE (protocol §10):
--   Statement 1 ALTERS public.leads. Column witness: PUBLIC_SCHEMA.md @0154 `## public.leads · 28 columns`
--     (ordinals 1..29, gap at 19); no column named binder_id. Constraints witness (§10 write law):
--     §1 `### public.leads` = leads_pkey, leads_wedding_date_precision_check; §2 = leads_client_id_fkey,
--     leads_vendor_id_fkey, leads_wedding_id_fkey. 0155 to 0166 touch no leads column (statement heads read).
--   Statement 2 CREATES an index on the column statement 1 adds.
--
-- RULINGS CARRIED (CE-43 interim ruling on LC-2 read-first part 1, 2026-09-17):
--   · 0167 RATIFIED as proposed. No foreign key: the link is application-guarded, following the estate's two
--     binder links that carry none (public.invoices.binder_id ordinal 22, public.events.linked_binder_id
--     ordinal 15; neither appears in PUBLIC_SCHEMA.md §2). engine constraints are unwitnessed (F-SW.1), so no
--     primary key on engine.records.id is witnessed for a foreign key to reference.
--   · F1: the unique index INCLUDES soft-deleted leads. One binder, one lead, ever.
--   · F3: the promotion writes this link FIRST (WHERE binder_id IS NULL) and creates the binder under the
--     reserved id after, so a link may briefly name a binder not yet written. "Promoted" is therefore
--     link set AND binder present AND an invoice for the lead_package_id, never the link alone.
--
-- ⚠ FOUNDER-RUN IN THE SUPABASE EDITOR, BEFORE THE dream-os ZIP OF PACKET 1 IS APPLIED.
-- Every statement is its own paste block (R-40.31). Idempotent: re-running is a no-op.

-- ═══ STATEMENT 1 · the link column ═════════════════════════════════════════════════════════════════════
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS binder_id uuid;

-- ═══ STATEMENT 2 · one binder, one lead, ever (F1) ══════════════════════════════════════════════════════
CREATE UNIQUE INDEX IF NOT EXISTS uq_leads_binder_id
  ON public.leads (binder_id)
  WHERE binder_id IS NOT NULL;
