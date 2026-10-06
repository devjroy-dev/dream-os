-- db/migrations/0204_off_season_shop.sql
-- TDW · CE-47 · OFF-A1 · THE OFF-SEASON SHOP (the OFF charter, Part A; the chair's rulings Q1 to Q12, 4 October 2026).
-- Number: the chair's reserved range for OFF (0204-0207), first of the four.
-- WHAT (additive; no row changed, nothing dropped but two CHECKs that are re-added wider):
--   CREATES public.shop_items: what she sells off the wedding day: a gift voucher (a value, or a named service), a workshop
--     (date, place or online, seats), an online class (dates, or on request), a booking (party, engagement, pre-wedding,
--     other). Each: name, picture, price in rupees, up to six "included" lines, shown on the website or not, its order.
--   CREATES public.shop_orders: one row per purchase or question. 'asked' until she marks it paid (or, once INS lands, her
--     payment link does); 'paid'; 'cancelled'. A workshop seat on an asked order is held until hold_until.
--   CREATES public.shop_vouchers: the code a paid voucher gets (XXXX-XXXX from 32 letters and digits with no 0, O, 1 or I),
--     valid until a date, redeemed once.
--   WIDENS vendor_site_sections.key CHECK by 'shop' (the section of her website that shows the shop), and
--     events.kind CHECK by 'shop' (a paid booking or workshop on her Calendar: Q3).
--   SEEDS flag.off_shop 'off' (the 0177 shape). The founder flips it on the switchboard.
-- RLS on every created table, no policy; the four privileges to service_role (A-45.8); 0170's defaults keep anon and
-- authenticated off.
-- Witnesses: public.vendors, public.leads, public.events (events_kind_check, 13 values), public.capabilities
--   (capabilities_kind_check 'flag', capabilities_status_check 'off') in docs/db/PUBLIC_SCHEMA.md; public.vendor_site_sections
--   (0187: key CHECK as an inline column check, not renamed by 0189 or 0190).
-- REVERT (by hand, with a witness; never run as part of this file):
--   DELETE FROM public.capabilities WHERE key = 'flag.off_shop';
--   DROP TABLE public.shop_vouchers, public.shop_orders, public.shop_items;
--   (then put back the two CHECKs without 'shop', after removing any row that uses it)

BEGIN;

CREATE TABLE public.shop_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id      uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  kind           text NOT NULL CHECK (kind IN ('voucher', 'workshop', 'class', 'booking')),
  name           text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  slug           text NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{0,59}$'),
  photo_url      text CHECK (photo_url IS NULL OR photo_url ~ '^https://'),
  price          integer NOT NULL CHECK (price BETWEEN 1 AND 10000000),
  includes       text[] NOT NULL DEFAULT '{}' CHECK (cardinality(includes) <= 6),
  shown          boolean NOT NULL DEFAULT true,
  position       integer NOT NULL DEFAULT 0,
  voucher_for    text CHECK (voucher_for IS NULL OR char_length(voucher_for) BETWEEN 1 AND 60),
  valid_months   integer CHECK (valid_months IS NULL OR valid_months BETWEEN 1 AND 60),
  starts_at      timestamptz,
  ends_at        timestamptz,
  place          text CHECK (place IS NULL OR char_length(place) BETWEEN 1 AND 80),
  online         boolean NOT NULL DEFAULT false,
  seats_total    integer CHECK (seats_total IS NULL OR seats_total BETWEEN 1 AND 1000),
  class_dates    date[] NOT NULL DEFAULT '{}' CHECK (cardinality(class_dates) <= 12),
  occasion       text CHECK (occasion IS NULL OR occasion IN ('party', 'engagement', 'pre_wedding', 'other')),
  hours          integer CHECK (hours IS NULL OR hours BETWEEN 1 AND 24),
  lead_days      integer CHECK (lead_days IS NULL OR lead_days BETWEEN 0 AND 365),
  event_id       uuid REFERENCES public.events(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz,
  CHECK (kind <> 'voucher' OR valid_months IS NOT NULL),
  CHECK (kind <> 'workshop' OR (starts_at IS NOT NULL AND seats_total IS NOT NULL AND (online OR place IS NOT NULL))),
  CHECK (kind <> 'booking' OR occasion IS NOT NULL),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE UNIQUE INDEX shop_items_slug_uidx ON public.shop_items (vendor_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX shop_items_vendor_idx ON public.shop_items (vendor_id, position) WHERE deleted_at IS NULL;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.shop_orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id      uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  item_id        uuid NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  buyer_name     text NOT NULL CHECK (char_length(buyer_name) BETWEEN 1 AND 40),
  buyer_phone    text NOT NULL CHECK (buyer_phone ~ '^\+[0-9]{8,16}$'),
  qty            integer NOT NULL DEFAULT 1 CHECK (qty BETWEEN 1 AND 20),
  amount         integer NOT NULL CHECK (amount BETWEEN 1 AND 200000000),
  wanted_date    date,
  state          text NOT NULL DEFAULT 'asked' CHECK (state IN ('asked', 'paid', 'cancelled')),
  hold_until     timestamptz,
  paid_at        timestamptz,
  paid_by        text CHECK (paid_by IS NULL OR paid_by IN ('vendor', 'link')),
  payment_ref    text CHECK (payment_ref IS NULL OR char_length(payment_ref) BETWEEN 1 AND 80),
  lead_id        uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  event_id       uuid REFERENCES public.events(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (state <> 'paid' OR (paid_at IS NOT NULL AND paid_by IS NOT NULL))
);
CREATE INDEX shop_orders_vendor_idx ON public.shop_orders (vendor_id, created_at DESC);
CREATE INDEX shop_orders_item_idx ON public.shop_orders (item_id, state);
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.shop_vouchers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id      uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  order_id       uuid NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  item_id        uuid NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  code           text NOT NULL CHECK (code ~ '^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$'),
  valid_until    date NOT NULL,
  redeemed_at    timestamptz,
  redeemed_note  text CHECK (redeemed_note IS NULL OR char_length(redeemed_note) BETWEEN 1 AND 120),
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX shop_vouchers_code_uidx ON public.shop_vouchers (vendor_id, code);
CREATE UNIQUE INDEX shop_vouchers_order_uidx ON public.shop_vouchers (order_id);
ALTER TABLE public.shop_vouchers ENABLE ROW LEVEL SECURITY;

-- ── the two CHECKs, each found by what it says rather than by a name the live database may spell differently ──────────
DO $$
DECLARE c record;
BEGIN
  FOR c IN SELECT conname FROM pg_constraint
           WHERE conrelid = 'public.vendor_site_sections'::regclass AND contype = 'c'
             AND pg_get_constraintdef(oid) LIKE '%cover|looks|collections%'
  LOOP
    EXECUTE format('ALTER TABLE public.vendor_site_sections DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;
ALTER TABLE public.vendor_site_sections ADD CONSTRAINT vendor_site_sections_key_check
  CHECK (key ~ '^(cover|looks|collections|band|reviews|pricing|studio|journal|faq|enquire|shop|custom-[a-z0-9-]{1,40})$');

ALTER TABLE public.events DROP CONSTRAINT events_kind_check;
ALTER TABLE public.events ADD CONSTRAINT events_kind_check
  CHECK (kind = ANY (ARRAY['shoot', 'call', 'meeting', 'task', 'reminder', 'recce', 'fitting', 'trial', 'family', 'ceremony',
                           'social', 'blocked', 'other', 'shop']));

INSERT INTO public.capabilities (key, kind, status) VALUES ('flag.off_shop', 'flag', 'off');

-- ── A-45.8 ───────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_vouchers TO service_role;

COMMIT;
