-- db/migrations/0131_wedding_pages.sql
-- BLOCK 19 · G1.1 · WEDDING PAGES — the data plane (R-G11.10/.16/.20/.21)
--
-- LADDER: tip at authoring was 0130_vendor_payment_rails.sql, derived by
-- `ls db/migrations/ | sort | tail`. This sits AT the tip, not in a reserved
-- hole, so it takes NO record in db/migrations/OUT_OF_ORDER.json — that
-- register's formatter aborts on any number not strictly below the tip.
-- Append-only; never renumber, never re-derive.
--
-- FOUNDER-RUN. Applied by the founder in the Supabase SQL editor against
-- nvzkbagqxbysoeszxent (main / PRODUCTION) BEFORE the pwa ZIP is applied.
--
-- ── SQL-PROVENANCE ─────────────────────────────────────────────────────────
-- Every referenced column is witnessed by ordinal at docs/db/PUBLIC_SCHEMA.md
-- @ dream-os d58648e:
--   public.vendors.id  :1134 (ordinal 1) uuid NOT NULL default uuid_generate_v4()
--   public.events.id   :538  (ordinal 1) uuid NOT NULL default uuid_generate_v4()
-- Both re-confirmed live by information_schema in the G1.1 fixture SELECT
-- (2026-09-04): public.vendors carries 49 columns live against the snapshot's
-- 45 — 0130's four are applied — and public.events.couple_id (ordinal 12) is
-- present. The snapshot is STALE for `vendors` and 0130 is its witness; no
-- column 0130 added is referenced here.
--
-- ── THE PRE-CONDITION, WITNESSED, NOT ASSUMED ──────────────────────────────
-- The same SELECT proved all three tables below ABSENT from the live schema
-- before this file was authored. If any of them now exists, STOP: a half-built
-- table is the one condition under which this migration must not run.
--
-- ── WHAT IS DELIBERATELY NOT HERE ──────────────────────────────────────────
-- No `season` column (R-G11.16): season is DERIVED at read from
-- events.event_date by a four-season map in one home. A stored season is a
-- second home for a fact the date already determines, and it drifts the first
-- time a date moves.
-- No `gallery_ref` (R-40.12): the gallery is its own plane, `wedding_photos`.
-- Nothing on `public.events` moves (R-40.11): `delivered_at` lives here.

-- ── weddings ───────────────────────────────────────────────────────────────
-- event_id is NULLABLE by R-G11.21. The schema decision is the one that cannot
-- be revisited without a second migration, and the fixture already proves the
-- shape: a photographer's first wedding pages are her back catalogue, shot
-- before she joined, with no calendar row behind them. THIS SITTING'S CREATE
-- DOOR STILL REQUIRES ONE — the ratified create sheet has "Which event" and no
-- date/venue-entry path, so the no-event create is chartered to G1.2 with its
-- own mock and its own strings. The column allows NULL; the door does not.
--
-- ON DELETE SET NULL so a deleted event never takes a published page with it.
-- UNIQUE (owner_vendor_id, slug) per R-G11.4 — the master's global slug UNIQUE
-- is superseded, so two studios may each hold `priya-arjun`.
CREATE TABLE IF NOT EXISTS public.weddings (
  id               uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_vendor_id  uuid        NOT NULL REFERENCES public.vendors (id) ON DELETE CASCADE,
  event_id         uuid        NULL     REFERENCES public.events  (id) ON DELETE SET NULL,
  slug             text        NOT NULL,
  title            text        NOT NULL,
  venue            text        NULL,
  city             text        NULL,
  delivered_at     timestamptz NULL,
  couple_consent   boolean     NOT NULL DEFAULT false,
  visibility       text        NOT NULL DEFAULT 'draft',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT weddings_visibility_check CHECK (visibility = ANY (ARRAY['draft'::text, 'published'::text])),
  CONSTRAINT weddings_owner_slug_key   UNIQUE (owner_vendor_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_weddings_owner    ON public.weddings USING btree (owner_vendor_id);
CREATE INDEX IF NOT EXISTS idx_weddings_event    ON public.weddings USING btree (event_id);
-- The public door's exact read: one owner, one slug, published AND consented.
CREATE INDEX IF NOT EXISTS idx_weddings_live     ON public.weddings USING btree (owner_vendor_id, slug)
  WHERE (visibility = 'published'::text AND couple_consent = true);

-- ── wedding_credits ────────────────────────────────────────────────────────
-- role CHECK carries R-40.7's TEN, in R-40.7's order. The keys are ascii and
-- stable; the vendor-facing labels live in one JS home and a bench asserts the
-- two agree by parsing THIS FILE — so the CHECK is the witness and the labels
-- cite it, rather than two lists drifting apart.
--
-- vendor_id is NULL until the credit is claimed: a credit target is by
-- definition someone not yet on the platform, which is the whole acquisition
-- loop. `phone` is the reach and NEVER leaves the estate on a public wire
-- (R-G11.6) — the public door's column list is the enforcement, this comment
-- is only the reason.
--
-- claim_token is the WHOLE credential (the crew page's constitution,
-- app/crew/[token]): no session, no cookie. uuid_generate_v4 is 122 bits, the
-- same posture crew.js:156 reasons about. No expiry (R-G11.14); the token is
-- ONE ACTION, then terminal — claim or decline sets status and re-opening
-- shows the terminal state with no toggle this sitting.
CREATE TABLE IF NOT EXISTS public.wedding_credits (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id   uuid        NOT NULL REFERENCES public.weddings (id) ON DELETE CASCADE,
  role         text        NOT NULL,
  vendor_id    uuid        NULL     REFERENCES public.vendors (id) ON DELETE SET NULL,
  phone        text        NULL,
  name         text        NULL,
  status       text        NOT NULL DEFAULT 'tagged',
  claim_token  uuid        NOT NULL DEFAULT uuid_generate_v4(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wedding_credits_role_check CHECK (role = ANY (ARRAY[
    'shot_by'::text, 'makeup'::text, 'hair'::text, 'decor'::text, 'mehendi'::text,
    'planner'::text, 'styled_by'::text, 'wearing'::text, 'model'::text, 'venue'::text
  ])),
  CONSTRAINT wedding_credits_status_check CHECK (status = ANY (ARRAY[
    'tagged'::text, 'claimed'::text, 'declined'::text
  ])),
  CONSTRAINT wedding_credits_claim_token_key UNIQUE (claim_token)
);

CREATE INDEX IF NOT EXISTS idx_wedding_credits_wedding ON public.wedding_credits USING btree (wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_credits_vendor  ON public.wedding_credits USING btree (vendor_id);

-- ── wedding_photos ─────────────────────────────────────────────────────────
-- The new asset plane (R-40.12 / FORK B arm (c)). Deliberately NOT
-- vendor_portfolio: every row on that table passes a human admin approval gate
-- and a delivered client gallery is not marketing material.
--
-- `public_id` is stored because the estate has been burned once by not storing
-- it: vendor_portfolio has no cloudinary_public_id column, so its delete path
-- must parse a URL and a URL with no /v<digits>/ segment orphans the asset
-- silently (F-07.14, src/lib/vendor/portfolio.js). This plane does not inherit
-- that defect.
CREATE TABLE IF NOT EXISTS public.wedding_photos (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id  uuid        NOT NULL REFERENCES public.weddings (id) ON DELETE CASCADE,
  url         text        NOT NULL,
  public_id   text        NOT NULL,
  position    integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wedding_photos_wedding ON public.wedding_photos USING btree (wedding_id, position);

-- OWED after this runs: a PAIR regen (db/queries/public_schema_dump.sql,
-- founder-run, piped through db/queries/format_public_schema.js). Until it
-- runs, docs/db/PUBLIC_SCHEMA.md knows none of these three tables and this
-- file is their sole witness under the SQL-provenance law.
