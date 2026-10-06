-- db/migrations/0209_pro_issued_papers.sql · CE-47 · PRO · P1 · BUSINESS PAPERS AND THEIR CHECK CODES.
-- 0209 is PRO's (PRO 0208-0211). One row per paper issued from her account: the professional certificate, the
-- professional ID, the business statement, or the pack for her CA. The figures are FROZEN at issue (figures jsonb),
-- so a check page always shows exactly what the paper stated, never today's numbers (F7, the founder's words ruled).
-- check_code: 'TDW-XXXX-XXXX' from an alphabet without 0, O, 1, I or L; unique. withdrawn_at set when she withdraws it.
-- Service role only after 0170's lock-down, with the four grants b128 2.1 requires (e-273); the server itself never deletes a
-- paper (withdraw is one way). The public check door reads through the server, never the client.
BEGIN;
CREATE TABLE IF NOT EXISTS public.issued_papers (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id    uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  kind         text        NOT NULL CHECK (kind IN ('certificate', 'id_card', 'statement', 'ca_pack')),
  period_from  date,
  period_to    date,
  purpose      text        CHECK (purpose IS NULL OR purpose IN ('bank', 'landlord', 'visa', 'other')),
  figures      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  check_code   text        NOT NULL UNIQUE CHECK (check_code ~ '^TDW-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$'),
  issued_at    timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  CHECK (period_from IS NULL OR period_to IS NULL OR period_from <= period_to)
);
CREATE INDEX IF NOT EXISTS issued_papers_vendor_idx ON public.issued_papers (vendor_id, issued_at DESC);
ALTER TABLE public.issued_papers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.issued_papers TO service_role;
COMMIT;
