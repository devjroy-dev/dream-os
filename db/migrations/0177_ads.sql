-- db/migrations/0177_ads.sql
-- CE-46 · ADS-1 · cut 1 · POSTS AND ADS FROM HER OWN ACCOUNT. Number 0177 allocated by the chair's ruling of
-- 27 September 2026 ("migration 0177 allocated: vendor_ad_connections and vendor_ads as proposed, RLS on in the same
-- transaction, service_role grants per A-45.8"). Ladder tail at authoring: 0176 (0176_ig_account_id.sql), dream-os 0ac1a01.
--
-- WHAT IT HOLDS, ONE PURPOSE EACH:
--   vendor_ad_connections  her Facebook login to the second Meta app (TDW ADS, 4570863996490339), one row per vendor:
--                          her user token (Facebook Login for Business, configuration 1863002924861430, User access
--                          token, ruled F3), the ad account and Page she picked from what she shared on Meta's own
--                          screen, and the connect's one-time state. ad_account_id is NULL while she has none: the
--                          room's first state ("No ad account yet?", the founder's Q1 of 28 September).
--   vendor_ads             each ad she ran from the room, its Meta ids, EVERY SETTING she confirmed (settings, the
--                          normalised echo of R-46.12's control panel, so 'duplicate as a new draft' and the echo are
--                          exact) with the total she was shown, and the last results read from Meta. kind 'lead' is declared for cut 2 and nothing writes it.
--   capabilities           one switch row, 'off': flag.ads. Armed for DEV440 only, by a witnessed SQL UPDATE
--                          (F-44.223: the switchboard flips only on|off).
--
-- WHAT IT DOES NOT HOLD: her card (Meta holds it; TDW never sees it), and no lead-ad table (vendor_ad_leads with its
-- UNIQUE on leadgen_id is cut 2's, the chair's ruling).
--
-- RLS ON BOTH NEW TABLES IN THIS TRANSACTION (SEC-1, protocol §13). dream-os reads and writes with the service role;
-- with RLS on and no policy, anon and authenticated reach no row. The GRANT to service_role is in this file (A-45.8,
-- pinned by b128): tables created by postgres give service_role no SELECT, INSERT, UPDATE or DELETE by default (0172).
--
-- access_token is a secret column, like vendor_ig_connections.access_token (0103): the one hand that reads it is
-- src/lib/vendor/ads/connection.js, and no SAFE_COLUMNS list there carries it.
--
-- WITNESS (docs/db/PUBLIC_SCHEMA.md at 0ac1a01): public.vendors.id uuid NOT NULL default uuid_generate_v4() (:1594);
--   public.capabilities (10 columns, :199); CHECKs :1853 to :1862: key grammar '^(template|perm|scope|flag)\.[a-z0-9_.]+$',
--   kind in (template, permission, scope, flag), status in (pending, approved, rejected, paused, armed, on, off),
--   auto_on false unless walk_ref. gen_random_uuid() as 0171 uses it.
BEGIN;

CREATE TABLE public.vendor_ad_connections (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id            uuid NOT NULL UNIQUE REFERENCES public.vendors(id) ON DELETE CASCADE,
  fb_user_id           text,
  access_token         text,
  token_expires_at     timestamptz,
  granted_scopes       text[] NOT NULL DEFAULT '{}',
  ad_account_id        text CHECK (ad_account_id IS NULL OR ad_account_id ~ '^act_[0-9]+$'),
  ad_account_name      text,
  currency             text,
  page_id              text,
  page_name            text,
  ig_user_id           text,
  pending_state_nonce  text,
  pending_state_at     timestamptz,
  consented_at         timestamptz,
  connected_at         timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_ad_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.vendor_ads (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id            uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  kind                 text NOT NULL CHECK (kind IN ('boost', 'lead')),
  ad_account_id        text NOT NULL CHECK (ad_account_id ~ '^act_[0-9]+$'),
  source_media_id      text,
  campaign_id          text,
  adset_id             text,
  creative_id          text,
  ad_id                text UNIQUE,
  daily_budget_minor   bigint NOT NULL CHECK (daily_budget_minor > 0),
  currency             text NOT NULL,
  days                 integer NOT NULL CHECK (days BETWEEN 1 AND 30),
  settings             jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_minor          bigint CHECK (total_minor IS NULL OR total_minor > 0),
  status               text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'ended', 'refused')),
  refused_reason       text,
  started_at           timestamptz,
  ends_at              timestamptz,
  ended_at             timestamptz,
  last_insights        jsonb,
  last_insights_at     timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_ads ENABLE ROW LEVEL SECURITY;
CREATE INDEX vendor_ads_vendor_created_idx ON public.vendor_ads (vendor_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_ad_connections TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_ads            TO service_role;

INSERT INTO public.capabilities (key, kind, status) VALUES
  ('flag.ads', 'flag', 'off');

COMMIT;

-- REVERT (commented, never run by this file):
--   BEGIN; DELETE FROM public.capabilities WHERE key = 'flag.ads';
--   DROP TABLE public.vendor_ads; DROP TABLE public.vendor_ad_connections; COMMIT;
--
-- THE REPORT IS STATE, NOT A NOTICE (F-44.83). After COMMIT the founder runs the read-only SELECT on the card; it
-- must show both tables with relrowsecurity true, service_role holding SELECT, INSERT, UPDATE, DELETE on each, and
-- one row flag.ads 'off'.
