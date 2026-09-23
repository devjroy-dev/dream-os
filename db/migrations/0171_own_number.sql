-- db/migrations/0171_own_number.sql
-- CE-45 · G6-1 · cut 2a · YOUR OWN NUMBER (Block 19 G6, spec §7b and §7c). Number 0171 allocated by the kickoff
-- ("migration 0171, yours if vendor_wabas lands first; LCV-15 claims none"). Ladder tail at authoring: 0170
-- (0170_public_schema_lockdown.sql, applied 2026-09-20).
--
-- WHAT IT HOLDS, ONE PURPOSE EACH:
--   vendor_wabas      her own WhatsApp number under TDW's Tech Provider portfolio: one row per vendor. The
--                     candidate DDL of spec §7b as amended by read-first F6 (business_id, connect_way,
--                     paused_reason, sync_started_at), ruled 2026-09-24.
--   vendor_wa_events  what arrives on her number and about it: a couple's message (receipt only in 2a), the
--                     shared way's once-only history and contacts sync, her own app's echoes, and Meta's
--                     account and quality events. PRIVATE TO HER (FQ5; Tech Provider terms §3.2): no reader
--                     across vendors exists or may be written.
--   vendors.enquiry_routing / enquiry_phone   spec §7c's switch, her one home for where "Enquire on
--                     WhatsApp" points; default 'tdw' is today's link exactly.
--   capabilities      five switch rows, all 'off': flag.own_number (the master; 2a opens only on 'armed' for
--                     the walk vendor) and one per tier (FQ3: every tier, a switch each).
--
-- RLS ON BOTH NEW TABLES IN THIS TRANSACTION (SEC-1 law, protocol §13). Reads and writes go through dream-os's
-- service-role client (app.locals.supabase; the receiver's own client in src/marketingIndex.js), which bypasses
-- RLS; with RLS on and no policy, anon and authenticated reach no row.
--
-- WITNESS (docs/db/PUBLIC_SCHEMA.md re-witnessed at the base 46af98d, e-31; the doc is unchanged from 89e3a6e):
--   public.vendors.id uuid (:1562 section, col 1); vendors.tier text NOT NULL default 'basic' (:1574, col 10);
--   public.capabilities (key, kind, status, ...; :199), CHECKs at :1821-1832: key grammar
--   '^(template|perm|scope|flag)\.[a-z0-9_.]+$', kind 'flag', status 'off', auto_on default false.
--   gen_random_uuid() as 0168/0169 use it.
BEGIN;

CREATE TABLE public.vendor_wabas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        uuid NOT NULL UNIQUE REFERENCES public.vendors(id) ON DELETE CASCADE,
  business_id      text NOT NULL,
  waba_id          text NOT NULL UNIQUE,
  phone_number_id  text NOT NULL UNIQUE,
  display_number   text NOT NULL,
  connect_way      text NOT NULL CHECK (connect_way IN ('shared', 'moved')),
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'migrated_out')),
  quality_rating   text,
  tier             text,
  paused_reason    text,
  sync_started_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_wabas ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.vendor_wa_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id    uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  kind         text NOT NULL CHECK (kind IN ('inbound', 'history', 'contacts', 'echo', 'account_update', 'quality_update')),
  payload      jsonb NOT NULL,
  received_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_wa_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX vendor_wa_events_vendor_kind_idx ON public.vendor_wa_events (vendor_id, kind, received_at);

ALTER TABLE public.vendors
  ADD COLUMN enquiry_routing text NOT NULL DEFAULT 'tdw' CHECK (enquiry_routing IN ('tdw', 'own_number', 'own_waba')),
  ADD COLUMN enquiry_phone   text;

INSERT INTO public.capabilities (key, kind, status) VALUES
  ('flag.own_number',           'flag', 'off'),
  ('flag.own_number.basic',     'flag', 'off'),
  ('flag.own_number.essential', 'flag', 'off'),
  ('flag.own_number.signature', 'flag', 'off'),
  ('flag.own_number.prestige',  'flag', 'off');

COMMIT;

-- THE REPORT IS STATE, NOT A NOTICE (F-44.83). After COMMIT the founder runs the read-only SELECT on the card;
-- it must show both tables with RLS true, the two vendors columns, and five 'off' rows.
