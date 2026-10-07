-- db/migrations/0211_pro_gear_bills.sql · CE-47 · PRO · P2 · GEAR SHARING AND BILL DRAFTS.
-- 0211 is PRO's (PRO 0208-0211). It lands below the applied ladder tip, so WEB-4 writes its OUT_OF_ORDER record.
--
-- gear_items: gear a vendor lends to other TDW vendors (item, its value, price per day, city). Withdrawn, never deleted.
-- gear_requests: one vendor asks for one item for a date range; the owner accepts or declines; either may cancel. Dates
--   live HERE only: nothing is added to Calendar (the founder's rule; P2-F4 confirmed 7 October 2026).
-- pro_gear_accept(request, owner): the ONLY way a request becomes 'accepted'. It locks the item's row, then refuses a
--   range that overlaps another accepted loan of that item, so two accepts at the same moment cannot both pass. This
--   closes the race 0078 left open without the btree_gist extension (0078's header proposed gist and did not take it).
-- bill_drafts: what a read bill said, before she confirms it; deleted with its stored file after 7 days unconfirmed
--   (P2-F2 (a), the founder's ruling). The file sits in a private storage bucket, opened only by a signed link.
-- Money between vendors never passes through TDW: a loan says "Settle with <owner> directly. TDW takes nothing." (P2-F5)
--
-- Every name in the function is schema-qualified and it sets no search_path (b91 §2.1 must be able to judge the file);
-- it runs as its caller (SECURITY INVOKER), and only service_role may call it.
-- Service role only after 0170's lock-down: RLS on, the four grants b128 2.1 requires (e-273), and EXECUTE on the one
-- function to service_role alone.
-- REVERT (commented, for the founder):
--   DROP FUNCTION IF EXISTS public.pro_gear_accept(uuid, uuid);
--   DROP TABLE IF EXISTS public.bill_drafts; DROP TABLE IF EXISTS public.gear_requests; DROP TABLE IF EXISTS public.gear_items;
BEGIN;

CREATE TABLE IF NOT EXISTS public.gear_items (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id         uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  item              text        NOT NULL CHECK (char_length(btrim(item)) BETWEEN 2 AND 80),
  value_rs          integer     NOT NULL CHECK (value_rs > 0 AND value_rs <= 100000000),
  price_per_day_rs  integer     NOT NULL CHECK (price_per_day_rs >= 0 AND price_per_day_rs <= 10000000),
  city              text        NOT NULL CHECK (char_length(btrim(city)) BETWEEN 2 AND 60),
  note              text        CHECK (note IS NULL OR char_length(note) <= 300),
  state             text        NOT NULL DEFAULT 'listed' CHECK (state IN ('listed', 'withdrawn')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gear_items_city_idx ON public.gear_items (lower(city), state);
CREATE INDEX IF NOT EXISTS gear_items_vendor_idx ON public.gear_items (vendor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.gear_requests (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id             uuid        NOT NULL REFERENCES public.gear_items(id) ON DELETE CASCADE,
  owner_vendor_id     uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  borrower_vendor_id  uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  date_from           date        NOT NULL,
  date_to             date        NOT NULL,
  note                text        CHECK (note IS NULL OR char_length(note) <= 300),
  state               text        NOT NULL DEFAULT 'requested' CHECK (state IN ('requested', 'accepted', 'declined', 'cancelled')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  decided_at          timestamptz,
  CHECK (date_to >= date_from),
  CHECK (date_to - date_from <= 60),
  CHECK (owner_vendor_id <> borrower_vendor_id)
);
CREATE INDEX IF NOT EXISTS gear_requests_item_idx ON public.gear_requests (item_id, state, date_from);
CREATE INDEX IF NOT EXISTS gear_requests_owner_idx ON public.gear_requests (owner_vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS gear_requests_borrower_idx ON public.gear_requests (borrower_vendor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.bill_drafts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id     uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  file_path     text        NOT NULL CHECK (file_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$'),
  fields        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  expense_id    uuid        REFERENCES public.expenses(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  confirmed_at  timestamptz
);
CREATE INDEX IF NOT EXISTS bill_drafts_unconfirmed_idx ON public.bill_drafts (created_at) WHERE confirmed_at IS NULL;
CREATE INDEX IF NOT EXISTS bill_drafts_vendor_idx ON public.bill_drafts (vendor_id, created_at DESC);

ALTER TABLE public.gear_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gear_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_drafts   ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gear_items    TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gear_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bill_drafts   TO service_role;

CREATE OR REPLACE FUNCTION public.pro_gear_accept(p_request uuid, p_owner uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE r public.gear_requests%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.gear_requests WHERE id = p_request AND owner_vendor_id = p_owner;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  -- one accept at a time per item: the item's row is the lock
  PERFORM 1 FROM public.gear_items WHERE id = r.item_id FOR UPDATE;
  SELECT * INTO r FROM public.gear_requests WHERE id = p_request;
  IF r.state <> 'requested' THEN RETURN 'not_requested'; END IF;
  IF EXISTS (SELECT 1 FROM public.gear_items WHERE id = r.item_id AND state <> 'listed') THEN RETURN 'withdrawn'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.gear_requests o
    WHERE o.item_id = r.item_id AND o.state = 'accepted' AND o.id <> r.id
      AND o.date_from <= r.date_to AND r.date_from <= o.date_to
  ) THEN RETURN 'overlap'; END IF;
  UPDATE public.gear_requests SET state = 'accepted', decided_at = now() WHERE id = r.id;
  RETURN 'accepted';
END;
$$;
REVOKE ALL ON FUNCTION public.pro_gear_accept(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pro_gear_accept(uuid, uuid) TO service_role;

COMMIT;
