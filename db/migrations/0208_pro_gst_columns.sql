-- db/migrations/0208_pro_gst_columns.sql · CE-47 · PRO · P1 · GST ON EXPENSES AND INVOICES.
-- 0208 is PRO's (the chair's ranges, 4 Oct 2026: PRO 0208-0211). PRO alone alters expenses and invoices in its trains (CE-47).
-- Columns checked against the founder's live read (6 Oct 2026): expenses has 12 columns and invoices 22, neither with GST.
-- Every column is nullable and new: no existing row changes and no existing reader sees a difference.
--   expenses: a purchase bill's GST, so the CA pack can list input GST (P2 fills them from a read bill; she may type them).
--   invoices: the GST she charged on a sale, for the CA pack's output GST.
-- source: how an expense row was made ('manual' when she typed it, 'bill' when it came from a read purchase bill).
BEGIN;
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS taxable_value  integer CHECK (taxable_value IS NULL OR taxable_value >= 0),
  ADD COLUMN IF NOT EXISTS gst_rate       numeric(5,2) CHECK (gst_rate IS NULL OR (gst_rate >= 0 AND gst_rate <= 28)),
  ADD COLUMN IF NOT EXISTS gst_amount     integer CHECK (gst_amount IS NULL OR gst_amount >= 0),
  ADD COLUMN IF NOT EXISTS supplier_name  text,
  ADD COLUMN IF NOT EXISTS supplier_gstin text CHECK (supplier_gstin IS NULL OR supplier_gstin ~ '^[0-9]{2}[A-Z0-9]{13}$'),
  ADD COLUMN IF NOT EXISTS bill_number    text,
  ADD COLUMN IF NOT EXISTS bill_file_url  text,
  ADD COLUMN IF NOT EXISTS source         text CHECK (source IS NULL OR source IN ('manual', 'bill'));
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS gst_rate   numeric(5,2) CHECK (gst_rate IS NULL OR (gst_rate >= 0 AND gst_rate <= 28)),
  ADD COLUMN IF NOT EXISTS gst_amount integer CHECK (gst_amount IS NULL OR gst_amount >= 0);
COMMIT;
