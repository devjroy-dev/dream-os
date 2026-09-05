-- db/migrations/0134_reviews_and_seal.sql
-- TDW · BLOCK 19 · G2 SITTING 1 — THE REVIEW ASK, THE SEAL, THE COUPLE'S STOP
-- (R-G2.2 · R-G2.4 · R-G2.5 · R-G2.7 · R-G2.10)
--
-- Append-only, founder-run, idempotent. FOUNDER-RUN in the Supabase SQL editor
-- against nvzkbagqxbysoeszxent (main / PRODUCTION) BEFORE the ZIP is applied.
--
-- ═══ THE LADDER NUMBER, DERIVED AT THE CUT AND NOT CARRIED ══════════════════
-- `ls db/migrations/*.sql | sort | tail` at dream-os 012374c returns 0132 as the
-- highest numbered file in the tree. The chair's relay states G1.2 HOLDS 0133 —
-- that seat's file is authored and not yet pushed, so the number is spoken for
-- even though the directory does not show it. This file therefore takes 0134.
--
-- 0134 is ABOVE the applied tip (0132), so it takes NO record in
-- db/migrations/OUT_OF_ORDER.json — that register is for numbers BELOW the tip
-- and its formatter aborts on any number that is not. If G1.2's 0133 is ever
-- withdrawn, 0133 becomes a reserved-but-empty hole like the sixteen the schema
-- header already lists, and a hole is not an unapplied migration.
--
-- ⚠ ORDER OF APPLICATION IS NOT LOAD-BEARING BETWEEN 0133 AND 0134. Nothing here
-- reads or writes anything 0133 touches, and nothing here depends on it existing.
--
-- ═══ SQL-PROVENANCE · COLUMNS *AND* CONSTRAINTS, per R-40.27 ════════════════
-- R-40.27: a statement that WRITES cites the constraints section for every table
-- it writes, not the column block alone. Read at docs/db/PUBLIC_SCHEMA.md,
-- snapshot 2026-09-05, ladder tip 0132, repo tip 286cdb4 — the staleness
-- arithmetic was run: the newest file in db/migrations/ is 0132, EQUAL to the
-- header's tip, so the document is current; and OUT_OF_ORDER.json's register is
-- empty, so the blind spot is clear too.
--
--   public.vendors    columns :1131 block — id (ordinal 1) uuid NOT NULL
--                     constraints — vendors_pkey PRIMARY KEY (id). No CHECK on
--                     this plane touches anything added below.
--   public.couples    columns :364 block — id (1), user_id (2),
--                     publish_weddings (24, added by 0132)
--                     constraints :1430-1438 — couples_tier_check (tier only),
--                     couples_pkey (id), couples_user_id_unique (user_id).
--                     NEITHER CHECK touches a column added below.
--   public.weddings   NOT IN THE SNAPSHOT's body as of 0131; described by the
--                     2026-09-05 regen at :1224 (13 columns incl. delivered_at
--                     (8), couple_consent (9), visibility (10), couple_id (13)).
--                     constraints — weddings_visibility_check,
--                     weddings_owner_slug_key, idx_weddings_live. NOT TOUCHED
--                     BY THIS FILE: nothing here alters weddings.
--   public.nudge_optout  columns :778 block — phone (2), lane (3), state (4),
--                     source (5). constraints, verbatim and LOAD-BEARING:
--                       [CHECK] nudge_optout_lane_check
--                         CHECK ((lane = ANY (ARRAY['bride','vendor'])))
--                       [CHECK] nudge_optout_source_check
--                         CHECK ((source = ANY (ARRAY['inbound_stop_mornings',
--                                                     'admin','other'])))
--                       [UNIQUE] nudge_optout_phone_lane_key (phone, lane)
--
-- ═══ WHY §3 EXISTS AT ALL — READ THIS BEFORE READING §3 ═════════════════════
-- R-G2.7 widens `nudgeOptout.LANES` with 'couple'. That is a JS constant, and on
-- its own it is a change the DATABASE REFUSES: `nudge_optout_lane_check` admits
-- exactly two values. A LANES widening with no CHECK widening is F-40.45's exact
-- class — a derivation that looks right in the tree and is refused at the write.
-- The constant and the constraint move together, in this file, or neither moves.

BEGIN;

-- ── 1 · reviews_asked · THE WITNESS THAT THE ASK WENT OUT ───────────────────
-- ONCE PER COUPLE, EVER — and the guarantee is the UNIQUE KEY, not the caller's
-- care. The kickoff's words are "once per couple, ever, by unique key not by
-- code": a `SELECT ... IF NOT EXISTS INSERT` in application code is two
-- statements and a race, and the second send is the one a couple notices.
--
-- couple_id IS THE KEY AND IT IS NOT NULL. A wedding page with no couple
-- (back-catalogue, or an engagement with a NULL lead — F-40.60) is a page whose
-- couple we cannot reach, and the honest shape is that no row exists for her at
-- all rather than a row keyed on a phone that may belong to two couples.
--
-- wedding_id records WHICH page triggered the ask. It is NULLABLE and ON DELETE
-- SET NULL: a deleted page must never delete the evidence that we already wrote
-- to this couple, because that evidence is the whole once-ever guarantee. The
-- row outlives the page deliberately.
--
-- vendor_id is the sending studio — whose review link the couple was given. Also
-- ON DELETE SET NULL for the same reason: the ask happened.
--
-- WHAT IS DELIBERATELY NOT HERE: no `status`, no `clicked_at`, no `review_id`.
-- We cannot observe any of them. Google returns nothing to us before 2026-10-27
-- and the redirect at /r/<code> is a 302 with no callback. A column that can only
-- ever hold its default is a promise the schema cannot keep.
CREATE TABLE IF NOT EXISTS public.reviews_asked (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id   uuid        NOT NULL REFERENCES public.couples  (id) ON DELETE CASCADE,
  wedding_id  uuid        NULL     REFERENCES public.weddings (id) ON DELETE SET NULL,
  vendor_id   uuid        NULL     REFERENCES public.vendors  (id) ON DELETE SET NULL,
  asked_at    timestamptz NOT NULL DEFAULT now(),
  template    text        NOT NULL,
  wamid       text        NULL,
  CONSTRAINT reviews_asked_couple_key UNIQUE (couple_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_asked_vendor  ON public.reviews_asked USING btree (vendor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_asked_wedding ON public.reviews_asked USING btree (wedding_id);

COMMENT ON TABLE public.reviews_asked IS
  'One row per couple, ever. The UNIQUE key IS the once-ever guarantee (R-G2.10); no code path may rely on checking first. Sole writer: src/lib/vendor/reviewAsk.js.';

-- ── 2 · vendor_seal · THE COMPUTED FACT, NOT AN EDITABLE ONE ────────────────
-- A TABLE AND NOT A VIEW (R-G2.4). Both schema witnesses are BASE-TABLEs-only by
-- design — the column snapshot says so and the constraints addendum says
-- "matching the column snapshot exactly" — so a view is invisible to both, and
-- every future citation against it would be authored from prose. That is the one
-- thing the SQL-provenance law exists to kill.
--
-- vendor_id IS THE PRIMARY KEY. One seal per studio, so the nightly job's upsert
-- has a natural conflict target and there is no way to hold two.
--
-- ⚠ NO `rating` COLUMN, AND THAT IS R-G2.2 EXECUTED RATHER THAN FORGOTTEN. The
-- master's DDL names one; no source for it exists (Google after 2026-10-27 plus
-- GCP quota, and a TDW-collected 1–5 has no surface anywhere). A nullable rating
-- column would sit at NULL on every row and the first reader to find it would
-- reasonably render an empty star row. The column arrives with its source, in
-- its own migration, and the seal's byte grows a segment in the same breath.
--
-- delivery_days IS NULLABLE and that is R-G2.3's shape. D is measured
-- weddings.delivered_at − events.event_date, so a studio whose delivered pages
-- are ALL back-catalogue (no event) has no measurable D. NULL means "not
-- measurable", never zero — zero would read as same-day delivery.
--
-- weddings IS NOT NULL because it is always countable, even at 0.
CREATE TABLE IF NOT EXISTS public.vendor_seal (
  vendor_id     uuid        PRIMARY KEY REFERENCES public.vendors (id) ON DELETE CASCADE,
  weddings      integer     NOT NULL DEFAULT 0,
  delivery_days integer     NULL,
  computed_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vendor_seal_weddings_nonneg CHECK (weddings >= 0),
  CONSTRAINT vendor_seal_days_nonneg     CHECK (delivery_days IS NULL OR delivery_days >= 0)
);

COMMENT ON TABLE public.vendor_seal IS
  'Computed nightly (R-G2.5) from weddings only. NEVER editable by a vendor door. No rating column until a source exists (R-G2.2). Sole writer: src/lib/vendor/seal.js.';
COMMENT ON COLUMN public.vendor_seal.delivery_days IS
  'Mean of (weddings.delivered_at::date - events.event_date) over delivered pages that HAVE an event. NULL = not measurable, never 0.';

-- ── 3 · THE COUPLE LANE JOINS nudge_optout (R-G2.7 arm (a)) ─────────────────
-- The CHECK is widened, not replaced by a looser one: the new set is the old set
-- plus exactly one value. A CHECK that lists its members is the estate's own
-- idiom (weddings_visibility_check, wedding_credits_role_check) and it is what
-- makes an unknown lane a refused write rather than a silent row.
--
-- `inbound_stop_messages` joins the source vocabulary because the couple's stop
-- arrives from a DIFFERENT button than the vendor's: `Stop messages` is the
-- custom quick reply on tdw_referral_invite (ledger B2, F-19.08), not the
-- "STOP MORNINGS" phrase the existing source value names. Recording both under
-- one source word would make the audit unable to say which control was pressed.
--
-- DROP-then-ADD is the only shape Postgres offers for widening a CHECK, and it
-- is safe here because the new predicate ACCEPTS EVERY ROW THE OLD ONE DID —
-- widening only. The two statements are inside this file's single transaction,
-- so the table is never left unconstrained to any other session.
ALTER TABLE public.nudge_optout DROP CONSTRAINT IF EXISTS nudge_optout_lane_check;
ALTER TABLE public.nudge_optout ADD  CONSTRAINT nudge_optout_lane_check
  CHECK (lane = ANY (ARRAY['bride'::text, 'vendor'::text, 'couple'::text]));

ALTER TABLE public.nudge_optout DROP CONSTRAINT IF EXISTS nudge_optout_source_check;
ALTER TABLE public.nudge_optout ADD  CONSTRAINT nudge_optout_source_check
  CHECK (source = ANY (ARRAY['inbound_stop_mornings'::text, 'inbound_stop_messages'::text,
                             'admin'::text, 'other'::text]));

-- ── 4 · WHAT IS DELIBERATELY NOT HERE — R-G2.7 IS ARM (a) ONLY ──────────────
-- The first cut of this file carried `couples.marketing_opted_out` withheld and
-- fully commented, because the relay had ruled (a)+(c) and those were alternative
-- arms of one fork: two homes for "this couple said stop", which the P0-A ledger
-- names by name — *"Both must write that one flag. TWO FLAGS IS THE DISEASE"*
-- (F-19.08). The chair has since ruled (a) ALONE, so the column is not withheld
-- here, it is GONE: a commented-out corpse is a second home waiting for someone
-- to uncomment it.
--
-- THE ONE HOME IS `nudge_optout(phone, 'couple')`, widened in §3 above, and the
-- reason it is the right one is mechanical rather than aesthetic: sendWa's gates
-- run on `to` — A PHONE — before any dispatch, on every line. They cannot see a
-- couple_id. A boolean on `public.couples` could gate the cron that reads it and
-- nothing else, and the ledger's CONDITION is about the SEND path.

COMMIT;

-- OWED AFTER THIS RUNS: a PAIR regen (db/queries/public_schema_dump.sql,
-- founder-run, piped through db/queries/format_public_schema.js). Until it runs,
-- docs/db/PUBLIC_SCHEMA.md knows neither new table and still carries the OLD
-- two-value lane CHECK — and this file is the sole witness for all three under
-- the SQL-provenance law.
