-- db/migrations/0200_insurance_room.sql — TDW · CE-47 · INS-A · THE INSURANCE ROOM (Business Solutions › Run the business).
-- The founder's rulings (CE-47, 4 October 2026): TDW educates, links, stores and shows. It never compares, recommends,
-- or takes money from an insurer. A vendor keeps her policies here; she confirms every field; the public "Insured"
-- mark shows only while her switch is on and a confirmed policy is in date (decided by the server, lib/vendor/insurance.js).
-- New tables only. No existing table is altered. The document lives in the private bucket 'policies' (signed URLs only).
BEGIN;

CREATE TABLE public.vendor_policies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  kind            text NOT NULL CHECK (kind IN ('equipment', 'public_liability', 'professional_indemnity', 'goods_in_transit',
                                                'shop_and_stock', 'jewellers_block', 'personal_accident', 'event_cancellation', 'other')),
  insurer         text NOT NULL CHECK (length(btrim(insurer)) BETWEEN 1 AND 120),
  cover_amount    integer NOT NULL CHECK (cover_amount > 0),   -- whole rupees
  ends_on         date NOT NULL,
  doc_path        text,                                          -- object path in the private 'policies' bucket
  doc_mime        text CHECK (doc_mime IS NULL OR doc_mime IN ('application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic')),
  confirmed_at    timestamptz,                                   -- NULL until she confirms the fields; only a confirmed policy counts
  reminded_30_on  date,                                          -- one reminder each, stamped so a sweep never sends twice
  reminded_7_on   date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);
ALTER TABLE public.vendor_policies ENABLE ROW LEVEL SECURITY;
CREATE INDEX vendor_policies_vendor_idx ON public.vendor_policies (vendor_id) WHERE deleted_at IS NULL;
CREATE INDEX vendor_policies_ends_idx   ON public.vendor_policies (ends_on)   WHERE deleted_at IS NULL AND confirmed_at IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_policies TO service_role;

CREATE TABLE public.vendor_insurance_settings (
  vendor_id   uuid PRIMARY KEY REFERENCES public.vendors(id) ON DELETE CASCADE,
  show_mark   boolean NOT NULL DEFAULT false,                 -- her choice; off until she turns it on
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_insurance_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_insurance_settings TO service_role;

COMMIT;
