-- db/migrations/0090_engagements.sql
-- TDW_16 · P1 — THE SPINE: ONE ROW PER RELATIONSHIP, ONE READER
-- Chartered CE-35, ruled R-35.30 (amended by R-35.31). Founder-run.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- THIS IS A BELOW-TIP REDEMPTION. READ THIS BEFORE YOU READ THE DDL.
-- ═════════════════════════════════════════════════════════════════════════════
-- The applied ladder tip is 0126. This file is 0090 — a number RESERVED in
-- TDW_16_BRIDGE_FINAL.md §3 (2026-07-14) and standing empty since, listed among
-- the seventeen holes named in PUBLIC_SCHEMA.md's own header. It therefore lands
-- AFTER the tip in time and BEFORE it in number, which is exactly the blind spot
-- F-SW.3 names: a reader who checks only the arithmetic ("is there a file newer
-- than the tip?") will be told no, and will go on citing a snapshot that does
-- not describe this table.
--
-- THE CURE TRAVELS IN THIS SAME DELIVERY: a record in
-- db/migrations/OUT_OF_ORDER.json, per that file's own _README (ruled
-- M-SCHEMA-REG R-34.41/.42/.43). It is NOT a hand-edited line in
-- PUBLIC_SCHEMA.md's header. The 0088 precedent (85a652a, 2026-08-15) DID write
-- such a line — one commit before the register existed — and that line is
-- F-SW.7's named fiction: the header is regenerated, so the line deleted itself.
-- The SHAPE of 0088 governs here; its ARTIFACT does not. (F-16.12.)
--
-- ═════════════════════════════════════════════════════════════════════════════
-- WHAT THIS FILE MAY AND MAY NOT ASSERT ABOUT couple_bookings
-- ═════════════════════════════════════════════════════════════════════════════
-- PUBLIC_SCHEMA.md's snapshot is 2026-08-15 at ladder tip 0125. Migration 0126
-- landed 2026-08-21 and RECREATED couple_bookings_category_check over the
-- canonical eleven. By PUBLIC_SCHEMA.md's own rule, THE MIGRATION IS THE WITNESS
-- until regen — so every claim below about couple_bookings' category vocabulary
-- cites 0126, not the snapshot. (F-16.8, granted by the chair.)
-- Everything else here is witnessed at PUBLIC_SCHEMA.md's column lines:
--   couple_bookings  :291-305   couple_enquiries :310-319
--   PK index witnesses: couples_pkey :2648 · vendors_pkey :3206 ·
--   leads_pkey :2892 · couple_enquiries_pkey :2610 · couple_bookings_pkey :2595
--
-- ═════════════════════════════════════════════════════════════════════════════
-- THE THREE DEPARTURES FROM THE SPEC'S 2026-07-14 INK, EACH WITH ITS REASON
-- ═════════════════════════════════════════════════════════════════════════════
-- ① `vendor_id` is NOT NULL (spec left it a bare fk). R-35.30: an engagement is
--    a bride↔PLATFORM-VENDOR relationship by definition. The off-platform vendor
--    she types by hand into couple_bookings has no engagement, and that is
--    correct, not a gap.
-- ② `category` carries a CHECK on the canonical eleven (spec had bare `text`).
--    R-35.30 fork 2. `src/agent/categories.js` is the vocabulary's ONE HOME and
--    this constraint's trigger: THE NEXT PERSON WHO EDITS THAT ARRAY OWES A
--    MIGRATION HERE. 0123 and 0126 are the two that already paid that debt.
-- ③ `signal_response_id` is NOT CREATED. The spec lists it, but its referent
--    (`signal_responses`) does not exist until 0091, so the column would land
--    with no FK, no writer and no reader — dead ink for a whole phase. 0091
--    creates the column AND its FK in the migration that creates its target.
--    Declared, not silently dropped (protocol §8).
--
-- THE ONE DDL CHOICE THE CHAIR MADE THAT NO RULING COVERS, NAMED SO IT CAN BE
-- OVERRULED: couple_id and vendor_id carry real FKs with ON DELETE CASCADE.
-- The couple plane's own habit is FK-less (couple_bookings and couple_enquiries
-- carry NO foreign keys at all — PUBLIC_SCHEMA.md's constraint addendum lists
-- only their primary keys). This table departs from that habit because R-35.30
-- made vendor_id the row's IDENTITY, and "FK-validated at the door" is a promise
-- the door cannot keep alone. An engagement whose vendor is gone is not a
-- relationship; it is a ghost with a unique key.

BEGIN;

CREATE TABLE IF NOT EXISTS public.engagements (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The two parties. Both required: this row IS the relationship.
  couple_id          uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  vendor_id          uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,

  -- The third leg of the key. R-35.31: the value written here is ALWAYS
  -- normaliseCategory()'s verdict — at backfill (transcribed below) and at every
  -- go-forward write (src/lib/engagements.js calls the function directly).
  category           text NOT NULL,

  status             text NOT NULL DEFAULT 'enquiry',
  source             text NOT NULL DEFAULT 'discover_enquiry',

  -- The artifacts this relationship has produced. ON DELETE SET NULL on both:
  -- the engagement SURVIVES its artifacts as history (R-35.30 fork 6, following
  -- the 0019 precedent that couple_receipts.booking_id already sets —
  -- PUBLIC_SCHEMA.md :2069).
  enquiry_id         uuid REFERENCES public.couple_enquiries(id) ON DELETE SET NULL,
  couple_booking_id  uuid REFERENCES public.couple_bookings(id) ON DELETE SET NULL,
  lead_id            uuid REFERENCES public.leads(id) ON DELETE SET NULL,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  -- F-15.2's COMMITTED CURE, landing here by name (Amendment One §2.15.ii and
  -- its §4 collision register line 7): the milestone mirror's matching key is
  -- THIS, and never a heuristic join. Collision line 7 dies with this line.
  CONSTRAINT engagements_couple_vendor_category_uidx
    UNIQUE (couple_id, vendor_id, category),

  -- The eleven, byte-for-byte as 0126 wrote them and as src/agent/categories.js
  -- holds them. If these two lists ever disagree, the bench reddens.
  CONSTRAINT engagements_category_check CHECK (category = ANY (ARRAY[
    'planning'::text, 'designer'::text, 'photography'::text, 'makeup'::text,
    'hairstylist'::text, 'jewellery'::text, 'decor'::text, 'venue_catering'::text,
    'performer'::text, 'content_creator'::text, 'other'::text
  ])),

  -- ── TWO TABLES, ONE WORD, TWO MEANINGS (F-16.11) ──────────────────────────
  -- `booked` HERE means: she committed to this vendor — the relationship has
  --   reached its destination. Nothing about money.
  -- `booked` in couple_bookings.state means: the commitment exists and NO
  --   ADVANCE HAS BEEN RECORDED YET (its ladder is booked→advance_paid→paid).
  -- The chair ruled NO RENAME. The two words stay, and this comment is the
  -- reason a future reader will not read one as the other.
  CONSTRAINT engagements_status_check CHECK (status = ANY (ARRAY[
    'enquiry'::text, 'proposal'::text, 'thread'::text,
    'booked'::text, 'completed'::text, 'closed'::text
  ])),

  -- F-16.10 CURED HERE, AND ONLY HERE. `leads.source` carries no CHECK and goes
  -- on writing 'discover' (src/api/couple/enquire.js). That column is NOT
  -- touched. The mapping discover → discover_enquiry happens at the engagement
  -- writer, so two planes keep two vocabularies without either lying.
  CONSTRAINT engagements_source_check CHECK (source = ANY (ARRAY[
    'discover_enquiry'::text, 'signal'::text, 'direct'::text
  ]))
);

CREATE INDEX IF NOT EXISTS engagements_couple_idx
  ON public.engagements USING btree (couple_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS engagements_vendor_idx
  ON public.engagements USING btree (vendor_id, updated_at DESC);

-- ═════════════════════════════════════════════════════════════════════════════
-- THE BACKFILL — ENQUIRIES ONLY, AND HERE IS WHY, DERIVED NOT ASSUMED
-- ═════════════════════════════════════════════════════════════════════════════
-- The spec ordered a backfill from "(couple_enquiries × couple_bookings) pairs".
-- The founder-run census of 2026-08-21 measured that join AT THE ROWS:
--
--   ① couple_enquiries = 2      couple_bookings = 6
--   ② bookings_total   = 6      with_vendor_id  = 0     ← F-16.6
--   ③ joinable_pairs   = 0                              ← the spec's backfill
--   ④ enquiry_rows     = 2      distinct_triples = 2    ← zero collapse
--   ⑤ non-conforming vendor_category: 'Event planner' × 1
--   ⑥ name_matchable bookings = 0                       ← the refused arm's price
--
-- NO CODE PATH IN THE ESTATE HAS EVER WRITTEN couple_bookings.vendor_id — not
-- the REST door, not the PATCH, not Mira's add_booking, and the PWA's own
-- fixtures construct every booking with vendor_id: null. So ③ is not a small
-- number; it is a STRUCTURAL zero. A booking-side backfill would mint nothing,
-- and the only way to make it mint something is to guess the vendor from
-- vendor_name — REFUSED BY NAME (R-35.30, Amendment One §2.15.ii: "no heuristic
-- join over money display, ever"). Census ⑥ prices that refusal at ZERO ROWS
-- LOST, and that figure is on this record permanently so nobody reopens the arm
-- by claiming rows went missing.
--
-- ── AND THE BACKFILL DOES NOT TOUCH lead_id. THIS IS NOT AN OVERSIGHT. ───────
-- couple_enquiries.vendor_lead_id LOOKS like the lead this row wants. It is not.
-- src/api/couple/enquire.js fills it from enquiryToBinder()'s return — an
-- ENGINE BINDER id, the other plane entirely — while the public.leads row born
-- three lines above it has its id thrown away with the rest of createLead's
-- result. (F-16.7.) Backfilling vendor_lead_id into engagements.lead_id would
-- put binder uuids behind a foreign key that points at public.leads, and every
-- one of them would fail the FK — or worse, silently match nothing forever.
-- lead_id is therefore NULL for all backfilled rows. It is stamped only by
-- go-forward writes, from the id this delivery teaches that door to keep.

INSERT INTO public.engagements
  (couple_id, vendor_id, category, status, source, enquiry_id, created_at, updated_at)
SELECT
  e.couple_id,
  e.vendor_id,
  -- ── R-35.31 TRANSCRIBED, PER WITNESSED ROW ────────────────────────────────
  -- normaliseCategory() is the ruling authority on category identity. It is
  -- JavaScript and cannot run here, so this CASE carries ITS VERDICT for the
  -- values the census actually witnessed — 0126's own committed shape (a
  -- witnessed row-list, then a guard), not a second mapping table pretending to
  -- be general.
  --
  -- 'Event planner' is free text: not a canonical token, not a pre-0123 token,
  -- and NOT in CATEGORY_ALIASES either. It resolves through normaliseCategory's
  -- pass-3 contains-ladder (`c.includes('plan')`) to 'planning'. Derived by
  -- EXECUTING the function at 86f15d6, not by reading it. 0126's catch-all would
  -- have sent this row to 'other' — the two committed homes disagreed, which is
  -- F-16.15, and R-35.31 settled it for the whole estate: normaliseCategory
  -- wins, at backfill and at every write after.
  CASE
    WHEN e.vendor_category = 'Event planner' THEN 'planning'
    WHEN e.vendor_category IN (
      'planning','designer','photography','makeup','hairstylist','jewellery',
      'decor','venue_catering','performer','content_creator','other'
    ) THEN e.vendor_category
    -- The guard. An unforeseen value keeps its relationship rather than failing
    -- the insert; 'other' is the founder's own fold-everything-else token
    -- (categories.js:47). If this branch fires, the assertion below will show a
    -- count the census did not predict, and THAT is the alarm.
    ELSE 'other'
  END,
  'enquiry',
  'discover_enquiry',
  e.id,
  e.created_at,   -- the relationship is as old as the enquiry, not as old as this migration
  now()
FROM public.couple_enquiries e
ON CONFLICT (couple_id, vendor_id, category) DO NOTHING;

-- ── THE COUNTS ASSERT IN-FILE (the spec's own requirement) ──────────────────
-- Priced against HIS rows, from HIS census. If production has moved between the
-- census and the apply, this migration REFUSES rather than backfills a shape
-- nobody measured.
DO $$
DECLARE
  v_total    integer;
  v_planning integer;
  v_other    integer;
BEGIN
  SELECT count(*) INTO v_total FROM public.engagements;
  SELECT count(*) INTO v_planning
    FROM public.engagements en
    JOIN public.couple_enquiries e ON e.id = en.enquiry_id
   WHERE e.vendor_category = 'Event planner' AND en.category = 'planning';
  SELECT count(*) INTO v_other
    FROM public.engagements en
    JOIN public.couple_enquiries e ON e.id = en.enquiry_id
   WHERE en.category = 'other'
     AND e.vendor_category IS DISTINCT FROM 'other';

  -- census ④: 2 enquiry rows, 2 distinct triples, zero collapse.
  IF v_total <> 2 THEN
    RAISE EXCEPTION 'BACKFILL ASSERTION FAILED: expected 2 engagements from the census, found %. Production moved since 2026-08-21 — re-run the census and re-price this file before applying.', v_total;
  END IF;
  -- census ⑤: exactly one label row, and it must have landed on planning.
  IF v_planning <> 1 THEN
    RAISE EXCEPTION 'BACKFILL ASSERTION FAILED: the Event planner row did not land on planning (found %). R-35.31 is the ruling being violated.', v_planning;
  END IF;
  -- The guard branch must not have fired. If it did, an unwitnessed value
  -- exists and its verdict was never ruled.
  IF v_other <> 0 THEN
    RAISE EXCEPTION 'BACKFILL ASSERTION FAILED: % row(s) fell to the ELSE guard — an unwitnessed vendor_category reached the key column without a ruling.', v_other;
  END IF;

  RAISE NOTICE '0090 backfill: % engagements minted, % via the transcribed label verdict, 0 through the guard.', v_total, v_planning;
END $$;

COMMIT;

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFY. THREE BLOCKS, EACH ITS OWN PASTE.
-- 0123's post-apply amendment (0123:101-111) is law here: the Supabase editor
-- renders ONLY the last statement's result set, so a batched verify is not a
-- verify. And 0123's deeper lesson (0123:112-115): a row-only foot shows green
-- whatever the DDL actually did. BLOCK 3 is the one that proves this migration —
-- it reads the CONSTRAINT, not the rows.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── BLOCK 1 · THE ROWS THAT LANDED ─────────────────────────────── paste alone ───
-- Expect exactly 2 rows: both status 'enquiry', both source 'discover_enquiry',
-- both enquiry_id stamped, ALL THREE other refs null (lead_id null is the
-- F-16.7 discipline, not a miss), and exactly one carrying category 'planning'
-- that came from the free-text label.
--
-- select en.category, en.status, en.source,
--        (en.enquiry_id        is not null) as enquiry_stamped,
--        (en.couple_booking_id is not null) as booking_stamped,
--        (en.lead_id           is not null) as lead_stamped,
--        e.vendor_category as raw_snapshot
--   from public.engagements en
--   join public.couple_enquiries e on e.id = en.enquiry_id
--  order by en.created_at;

-- ── BLOCK 2 · THE KEY REFUSES, PROVEN BY EXECUTION ─────────────── paste alone ───
-- A unique key nobody has tried to violate is a comment. This block TRIES, and
-- the expected result is an ERROR: duplicate key value violates unique
-- constraint "engagements_couple_vendor_category_uidx". If this block SUCCEEDS,
-- the key is not doing its job and the spine is not a spine.
-- It rolls itself back either way — nothing is left behind.
--
-- begin;
-- insert into public.engagements (couple_id, vendor_id, category, status, source)
-- select couple_id, vendor_id, category, 'proposal', 'direct'
--   from public.engagements limit 1;
-- rollback;

-- ── BLOCK 3 · THE CONSTRAINTS THEMSELVES ───────────────────────── paste alone ───
-- THE ONE THAT PROVES THIS FILE. Reads pg_constraint, so it is true about the
-- DATABASE rather than about the rows that happen to be in it. Expect FIVE rows:
-- the unique key, and the three CHECKs, and the primary key — plus the three
-- foreign keys' delete rules, which is where fork 6's ruling either landed or
-- did not.
--
-- select con.conname,
--        con.contype,
--        pg_get_constraintdef(con.oid) as definition
--   from pg_constraint con
--   join pg_class rel on rel.oid = con.conrelid
--   join pg_namespace nsp on nsp.oid = rel.relnamespace
--  where nsp.nspname = 'public' and rel.relname = 'engagements'
--  order by con.contype, con.conname;
