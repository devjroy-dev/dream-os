-- db/migrations/0166_influencer_exchange.sql — G5.3 · THE INFLUENCER EXCHANGE. CE-42 seat R7, packet 4c-3b-1.
-- 0166 ALLOCATED BY THE CHAIR (kickoff 4c-3b §1). Append-only (LD-8). Ladder tail at c5de470: 0164
-- (`ls db/migrations/*.sql | sort | tail -1`); 0165 is 4b-3b's by allocation and may land after this file —
-- neither touches the other's shape.
--
-- SQL PROVENANCE (protocol §10):
--   Statement 1 ALTERS public.vendors — witness PUBLIC_SCHEMA.md @0154 :1382 ("public.vendors · 55 columns").
--     The column it ADDS is new; its precedent is :1437 (61. peer_discoverable boolean NOT NULL default true).
--     It defaults FALSE on 0140's reasoning, not 0142's: the opt-in EXPOSES a new fact about her (her audience,
--     her open-ness to requests) to any vendor on the platform. Silence never means yes.
--   Statements 2 and 3 CREATE tables — their witness is these statements.
--     FK target public.vendors(id): PUBLIC_SCHEMA.md @0154 :1385 (1. id uuid NOT NULL default uuid_generate_v4()).
--
-- RULINGS CARRIED (4c-3b read-first rulings, 2026-09-10):
--   (i)   vendors.exchange_discoverable boolean NOT NULL DEFAULT false; writer = me.js BOOLEAN_FIELDS, no second.
--   (ii)  influencer_reach_snapshots as its own table — NOT a column on vendor_ig_connections, because that row
--         is deleted on disconnect (igConnection.js:136) and carries the access token. AGGREGATES ONLY: no column
--         can hold a follower identity (§7). "Verified via Instagram" = a row with verified_at within 30 days.
--   (iii) exchange_requests state machine: sent → accepted | declined | withdrawn; accepted → completed.
--         Every transition is a guarded UPDATE (WHERE state = <from>) in src/lib/vendor/exchange.js, the ONE writer.
--         Not a lead; accepted mints nothing on events.
--   §7    NO MONEY COLUMN in either table. A cell greps this file and the form.
--
-- ⚠ FOUNDER-RUN IN THE SUPABASE EDITOR, BEFORE THE dream-os ZIP IS APPLIED. The browse door names
-- `exchange_discoverable` in a predicate; deployed ahead of this file, PostgREST 400s and the room goes dark.
-- Every statement is its own paste block (R-40.31). Idempotent: re-running is a no-op.

-- ═══ STATEMENT 1 · the opt-in ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS exchange_discoverable boolean NOT NULL DEFAULT false;

-- ═══ STATEMENT 2 · the requests ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.exchange_requests (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id             uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  influencer_vendor_id  uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  offer_kind            text        NOT NULL,
  offer_note            text        NOT NULL DEFAULT '',
  ask_kind              text        NOT NULL CHECK (ask_kind IN ('post', 'reel', 'story')),
  ask_count             integer     NOT NULL CHECK (ask_count BETWEEN 1 AND 20),
  date_from             date        NOT NULL,
  date_to               date        NOT NULL,
  state                 text        NOT NULL DEFAULT 'sent'
                                    CHECK (state IN ('sent', 'accepted', 'declined', 'withdrawn', 'completed')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  accepted_at           timestamptz,
  declined_at           timestamptz,
  withdrawn_at          timestamptz,
  completed_at          timestamptz,
  CONSTRAINT exchange_requests_not_self  CHECK (vendor_id <> influencer_vendor_id),
  CONSTRAINT exchange_requests_dates     CHECK (date_to >= date_from)
);

-- ═══ STATEMENT 3 · the reach snapshot (aggregates only — no identity column exists to fill) ═══════════════
CREATE TABLE IF NOT EXISTS public.influencer_reach_snapshots (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  follower_count   integer     NOT NULL CHECK (follower_count >= 0),
  engagement_rate  numeric(5,2) NOT NULL CHECK (engagement_rate >= 0),
  audience_city    jsonb       NOT NULL DEFAULT '[]'::jsonb,
  audience_age     jsonb       NOT NULL DEFAULT '[]'::jsonb,
  audience_gender  jsonb       NOT NULL DEFAULT '[]'::jsonb,
  verified_at      timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ═══ STATEMENT 4 · the two doors' reads — LIFTED at 4c-3b-1s (chair's word, 2026-09-10) ═══
-- Withheld at the read-first because the ruling allocated three statements and a fourth
-- was a proposal. The doors now exist and each of these three indexes serves a read one of
-- them makes on every call: the inbox (influencer side, newest first), her sent list, and
-- the snapshot's newest-per-vendor lookup. Run as ONE further paste block, AFTER 1-3.
CREATE INDEX IF NOT EXISTS exchange_requests_influencer_state_idx
  ON public.exchange_requests (influencer_vendor_id, state, created_at DESC);
CREATE INDEX IF NOT EXISTS exchange_requests_vendor_idx
  ON public.exchange_requests (vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS influencer_reach_snapshots_vendor_verified_idx
  ON public.influencer_reach_snapshots (vendor_id, verified_at DESC);

-- ═══ VERIFY (one block) — expected: 3 rows, one per name, is_ok = true for each ═══════════════════════════
-- SELECT n.name,
--        CASE n.name
--          WHEN 'vendors.exchange_discoverable' THEN EXISTS (SELECT 1 FROM information_schema.columns
--               WHERE table_schema='public' AND table_name='vendors' AND column_name='exchange_discoverable'
--                 AND column_default='false' AND is_nullable='NO')
--          WHEN 'exchange_requests' THEN (SELECT count(*)=16 FROM information_schema.columns
--               WHERE table_schema='public' AND table_name='exchange_requests')
--          WHEN 'influencer_reach_snapshots' THEN (SELECT count(*)=9 FROM information_schema.columns
--               WHERE table_schema='public' AND table_name='influencer_reach_snapshots')
--        END AS is_ok
-- FROM (VALUES ('vendors.exchange_discoverable'),('exchange_requests'),('influencer_reach_snapshots')) AS n(name);
