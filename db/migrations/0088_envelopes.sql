-- db/migrations/0088_envelopes.sql
-- TDW_15 P2 — BUDGET ENVELOPES. Authored 2026-08-15 under CE-34.
-- EXECUTED BY THE FOUNDER on PRODUCTION (nvzkbagqxbysoeszxent) 2026-08-15 and
-- WITNESSED off the catalogue, not inferred from a green CREATE.
--
-- OUT-OF-ORDER FILL (F-SW.3, R-34.18(i) / R-34.21). This migration redeems a
-- reservation minted 2026-07-14, when 0087 genuinely was the ladder tip. It
-- lands AFTER the tip (0125) in time and BEFORE it in number, so it does not
-- trip the arithmetic staleness check in docs/db/PUBLIC_SCHEMA.md. It names
-- itself and public.couple_receipts in that document's out-of-order table, in
-- this same delivery. THAT LINE IS KNOWN-EPHEMERAL: the header lives above the
-- generator's sentinel and does not survive a regen (F-SW.7, chartered).
--
-- TWO STRIKES CARRIED, both ruled at CE-34:
--   R-34.14 — the spec reserved envelope refs on couple_receipts AND "the
--     bride-expense table". They are ONE table: expenses.js:24 records
--     couple_receipts as the expense vault per 0019_bride_planner.sql, and
--     public.expenses is vendor_id NOT NULL, vendor-plane. Second ref STRUCK.
--   F-a — the spec's `amount_inr numeric` is STRUCK for `integer`. Every money
--     column witnessed on either plane is integer (couple_receipts.amount,
--     expenses.amount NOT NULL). One money type per plane.

CREATE TABLE IF NOT EXISTS public.budget_envelopes (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id   uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  name        text NOT NULL,
  amount_inr  integer NOT NULL DEFAULT 0 CHECK (amount_inr >= 0),
  sort        integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS budget_envelopes_couple_sort_idx
  ON public.budget_envelopes (couple_id, sort, created_at);

-- F-b. ON DELETE SET NULL, matching this table's own booking_id rule: deleting
-- an envelope UNFILES its receipts into the tray rather than destroying her
-- records. On a plane with real brides that distinction is the whole ruling.
ALTER TABLE public.couple_receipts
  ADD COLUMN IF NOT EXISTS envelope_id uuid NULL
  REFERENCES public.budget_envelopes(id) ON DELETE SET NULL;

-- F-c. The tray's only read: WHERE couple_id = $1 AND envelope_id IS NULL.
-- Served by GET /api/v2/couple/envelopes/:coupleId/unfiled.
CREATE INDEX IF NOT EXISTS couple_receipts_unfiled_idx
  ON public.couple_receipts (couple_id) WHERE envelope_id IS NULL;

COMMENT ON TABLE public.budget_envelopes IS
  'TDW_15 P2 (R-4). Her named budget envelopes. amount_inr is the envelope''s
   ceiling in whole rupees; spend is COALESCE(SUM(couple_receipts.amount),0) over
   receipts whose envelope_id is this row. R-34.22: couple_receipts.amount is
   NULLABLE and its CHECK permits NULL, so a FILED receipt can contribute zero —
   "unfiled" (envelope_id IS NULL) and "untyped" (amount IS NULL) are two
   different emptinesses and no reader may conflate them. No seed rows exist by
   ruling (R-34.30): the room opens empty and she names her own.';
