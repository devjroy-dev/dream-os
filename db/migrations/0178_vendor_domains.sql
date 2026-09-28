-- db/migrations/0178_vendor_domains.sql
-- TDW · CE-46 · WEB-1 cut 2 · THE VENDOR'S OWN DOMAIN, ONE ROW PER NAME.
-- Base 0ac1a01. Number allocated by the chair (0177 is ADS-1's).
--
-- The founder's rulings, 24 and 27 September 2026: the name is registered in
-- HER name; she pays first, through a Razorpay payment link, and only then does
-- the register call run; the price is ten percent over the registrar's price
-- after its GST; TDW never pays for a vendor's domain.
--
-- WHAT: one table, `vendor_domains`, the sole home of a domain's life:
--   paying → registering → wiring → live; error (retried for a day), then
--   refund_due → refunded; expired. `status` uses the contract's DomainStatus vocabulary (contract.js
--   :78) plus `paying`, the state she is in between the pay link and the buy.
-- WRITER: src/lib/domains/service.js is this table's only writer (the sole-writer
--   law). The Razorpay webhook calls it; the doors call it; nothing else does.
-- A-45.8: a migration that creates a table grants service_role the four
--   privileges it needs, in the same file, rehearsed as service_role.
-- SEC-1: RLS is enabled on the new table in the same transaction; no policy.
--
-- ROLLBACK (by hand, with a witness): DROP TABLE public.vendor_domains;

BEGIN;

CREATE TABLE public.vendor_domains (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id              uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  domain                 text NOT NULL UNIQUE,
  registrar              text NOT NULL DEFAULT 'resellerclub' CHECK (registrar IN ('resellerclub', 'vercel')),
  status                 text NOT NULL DEFAULT 'paying'
                         CHECK (status IN ('paying', 'registering', 'wiring', 'live', 'expired', 'error', 'refund_due', 'refunded')),
  -- the money, in paise, both sides of the ten percent (F-19.15: paise on the rail, rupees only at the invoice)
  cost_paise             integer NOT NULL CHECK (cost_paise > 0),
  gst_pct                integer NOT NULL DEFAULT 18 CHECK (gst_pct >= 0 AND gst_pct <= 100),
  price_paise            integer NOT NULL CHECK (price_paise >= cost_paise),
  years                  integer NOT NULL DEFAULT 1 CHECK (years >= 1 AND years <= 10),
  -- the pay-first leg
  razorpay_link_id       text UNIQUE,
  razorpay_link_url      text,
  razorpay_payment_id    text UNIQUE,
  paid_at                timestamptz,
  -- the registrar leg (her name on the record; TDW is technical contact only)
  registrant             jsonb NOT NULL DEFAULT '{}'::jsonb,
  registrar_customer_id  text,
  registrar_contact_id   text,
  registrar_order_id     text UNIQUE,
  registered_at          timestamptz,
  expires_at             timestamptz,
  auto_renew             boolean NOT NULL DEFAULT false,
  -- the wiring leg
  vercel_domain_added_at timestamptz,
  dns_verified_at        timestamptz,
  ssl_issued_at          timestamptz,
  live_at                timestamptz,
  forward_email          text,
  last_error             text,
  -- S8 policy (the chair for the founder, 28 September): a paid order that fails is tried again for one day;
  -- after a day it becomes refund_due, the founder's task (Razorpay refunds are his hand until a refund door exists),
  -- and refunded once he has refunded her card in full.
  retries                integer NOT NULL DEFAULT 0 CHECK (retries >= 0),
  refund_due_at          timestamptz,
  refunded_at            timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  deleted_at             timestamptz
);
-- SEC-1 (§13) · RLS on in the same transaction, as 0171 :46 and :55 do. service_role bypasses it
-- (BYPASSRLS); no policy is written, so anon and authenticated read nothing even if a grant ever leaked.
ALTER TABLE public.vendor_domains ENABLE ROW LEVEL SECURITY;

CREATE INDEX vendor_domains_vendor_idx ON public.vendor_domains (vendor_id) WHERE deleted_at IS NULL;
CREATE INDEX vendor_domains_status_idx ON public.vendor_domains (status) WHERE deleted_at IS NULL;

-- A-45.8 · the grants service_role lacks by the estate's default ACL (F-44.169).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_domains TO service_role;

COMMIT;
