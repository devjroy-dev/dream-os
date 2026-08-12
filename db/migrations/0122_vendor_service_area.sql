-- ════════════════════════════════════════════════════════════════════
-- Migration 0122 -- Vendor service area (arc OB · CE-31 ruling ①)
-- Date:    2026-08-12
-- Arc:     OB (THE ONBOARDING OS) · charter OB-D · D-2
-- Author:  LE under CE-31
-- ════════════════════════════════════════════════════════════════════
--
-- WHAT THIS ADDS
--   vendors.service_area    -- text, CHECK over three canonical machine tokens
--   vendors.service_cities  -- text[], populated when and only when the token
--                              is 'select_cities'
--
-- PROVENANCE (G-1, declared not silent): every column named below was
-- witnessed in THIS LADDER at 3373244, not in docs/db/PUBLIC_SCHEMA.md.
-- The doc is stale (no marker for 0101/0119/0120/0121) and its regen is
-- banded hygiene, not this arc's. The chair accepted the substitution at
-- ruling OB/№3 ⑦. Ladder witnesses relied on:
--   vendors.city            0001_init.sql:22
--   vendors.category        0001_init.sql:20
--   vendors.open_to_travel  0006_travel_preference.sql:17
--   vendors.travel_notes    0006_travel_preference.sql:18
--   vendors.rate_min        0034_vendor_profile_fields.sql:8
--   vendors.rate_display    0101_profile_controls.sql:65
--
-- WHY TOKENS AND NOT LABELS (CE-31 ruling ①): the three options' SEMANTICS
-- are fixed — all of India / anywhere in the world / a named list of cities
-- — while their WORDS are copy under founder veto. Copy never enters DDL.
-- The founder-vetoed display labels (2026-08-12, SET A) live in the PWA
-- form and map 1:1:
--     'pan_india'      -> 「 Across India 」
--     'worldwide'      -> 「 Worldwide 」
--     'select_cities'  -> 「 Select cities 」   (opens the city picker)
-- That mapping is carried in the OB-D -> OB-P handover so it is ONE
-- document. A future sitting that renames a label must not touch this file.
--
-- IMMUTABILITY: never edit this file. New changes go in 0123+.
-- ════════════════════════════════════════════════════════════════════


-- ── 1 · The columns ───────────────────────────────────────────────────────
-- NULLABLE, deliberately. A vendor who has never answered the question has
-- no service area, and that is a different fact from any of the three
-- answers. The ARC'S PREDICATE (src/lib/onboardingPredicate.js) is what
-- makes the absence matter: a NULL here is an incomplete vendor, and the
-- form will demand it. A NOT NULL DEFAULT would have made "never asked"
-- and "said pan-India" the same row — the exact collapse 0101:59-63
-- refused for rate_display, one column over.

alter table public.vendors
  add column if not exists service_area   text,
  add column if not exists service_cities text[];

comment on column public.vendors.service_area is
  'Canonical service-area token: pan_india | worldwide | select_cities. Set by the PWA onboarding form (arc OB). Display labels live in the PWA, never here.';

comment on column public.vendors.service_cities is
  'Named cities, populated when and only when service_area = select_cities. Paired by constraint vendors_service_cities_pairing.';


-- ── 2 · THE BACKFILL (CE-31 ruling ①, two arms) ───────────────────────────
-- Runs BEFORE the constraints below, so no existing row can be caught by a
-- pairing rule it predates.
--
-- ARM 1 · open_to_travel IS TRUE -> 'pan_india'. The conversational question
-- that set this boolean asked, in its own words, "are your services available
-- pan-India, or mostly within {city}?" (src/agent/onboarding.js:47-51). A
-- vendor who answered yes to THAT sentence said pan-India, so the token is a
-- faithful reading of what she was actually asked, not an inference.
--
-- ARM 2 · open_to_travel IS NOT TRUE, city present -> 'select_cities' with
-- her own city as the single named city. The same question's other half was
-- "mostly within {city}", so the honest translation of a no is: this one city.
--
-- ARM 3 (implicit) · not true, city absent -> service_area stays NULL. There
-- is nothing to name, and the row is incomplete on city as well. The form
-- will demand both.
--
-- 'worldwide' BACKFILLS NOWHERE, and that is not an oversight: the boolean
-- had two values and neither of them could express it. No vendor in this
-- estate has ever been able to say worldwide, so no row may be assigned it
-- by a migration. Only the form can produce that token.
--
-- DECLARED READING (surfaced to the chair at D-2, not buried): open_to_travel
-- is `boolean default false` and therefore NULLABLE. This backfill treats
-- NULL and false alike via `IS NOT TRUE`, because a NULL boolean and a false
-- boolean both mean the vendor never said yes, and arm 2's sentence is true
-- of both. If the chair reads NULL as "never asked" rather than "said no",
-- arm 2 must be narrowed to `= false` and the NULLs left to the form; that is
-- a one-predicate amendment in a later migration, not a rewrite.

update public.vendors
   set service_area = 'pan_india'
 where open_to_travel is true
   and service_area is null;

update public.vendors
   set service_area   = 'select_cities',
       service_cities = array[city]
 where open_to_travel is not true
   and city is not null
   and btrim(city) <> ''
   and service_area is null;


-- ── 3 · The token CHECK ───────────────────────────────────────────────────
-- NULL passes: the constraint governs what a value may BE, not whether one
-- must exist. Presence is the predicate's job, in code, where the form and
-- the gate can read the same sentence.

alter table public.vendors
  drop constraint if exists vendors_service_area_token;

alter table public.vendors
  add constraint vendors_service_area_token
  check (service_area is null
         or service_area in ('pan_india', 'worldwide', 'select_cities'));


-- ── 4 · The pairing CHECK, both directions ────────────────────────────────
-- BOTH WAYS is the point. One direction alone would let the database hold a
-- half-truth: cities named under 'worldwide' (a list nobody will ever read),
-- or 'select_cities' with nothing selected (a token that promises a list the
-- machine does not hold — and a byte never promises a state the machine does
-- not hold; this is that law expressed in DDL).

alter table public.vendors
  drop constraint if exists vendors_service_cities_pairing;

alter table public.vendors
  add constraint vendors_service_cities_pairing
  check (
    (service_area = 'select_cities'
       and service_cities is not null
       and array_length(service_cities, 1) >= 1)
    or
    (service_area is distinct from 'select_cities'
       and service_cities is null)
  );


-- ── 5 · STALE-STAMP: open_to_travel + travel_notes (CE-31 ruling ①) ────────
-- F-06.85 FORM — a sentence conditioned on a mechanical fact names the
-- mechanism in-comment, so the mechanism's next sitting is forced to re-read
-- the sentence. The mechanism here is R-OB (arc OB, CE-31 ruling ①) and the
-- mechanical fact is arithmetic: THE BOOLEAN CANNOT SAY WORLDWIDE. Two values
-- cannot carry three states, so open_to_travel is not a narrower spelling of
-- service_area — it is a strictly lossier one, and no mirror between them can
-- be written that is not a known lie. That is why ruling ① refused the mirror
-- arm outright rather than shipping it with a caveat.
--
-- THE COLUMNS REMAIN. The ladder is append-only (LD-8) and a drop is a
-- separate act with its own readers; ruling ① parked it as later hygiene.
-- travel_notes in particular STAYS as the raw historical record — it holds
-- what each vendor said in her own words, which service_area's three tokens
-- cannot reconstruct and must not pretend to.
--
-- THE ARC OWNS THE READERS (RETIRE-WITH-THE-READER). At arc close, zero live
-- readers of open_to_travel remain; the completion cell reddens on any
-- survivor. The census as derived at D-1, so the next sitting does not
-- re-derive it:
--   src/agent/systemPrompt.js:416        (W-1, D-3 under ruling ⑤'s lift)
--   src/agent/coupleSystemPrompt.js:80   (W-1, D-3 under ruling ⑤'s lift)
--   src/api/vendor/me.js  :75 :150 :178 :215 :286 :297 :310 :324
--   src/api/vendor/onboarding.js:51 :71  (endpoint cure, later delivery)
--   src/agent/onboarding.js:352-354 :381-383  (retires under ruling ③)

comment on column public.vendors.open_to_travel is
  'STALE as of migration 0122 (arc OB, CE-31 ruling (1)). SUPERSEDED BY vendors.service_area: a boolean cannot express worldwide. Retained because the ladder is append-only; the drop is later hygiene. Do not add readers. Do not write from new code.';

comment on column public.vendors.travel_notes is
  'HISTORICAL RECORD, retained deliberately past 0122 (arc OB). Raw travel preference in the vendor own words, from the retired conversational onboarding. service_area three tokens cannot reconstruct this text and must not pretend to. Read-only from 0122 forward.';


-- ── 6 · VERIFY (paste the results back) ───────────────────────────────────
-- Founder-run in the Supabase SQL editor, per the migration ladder's law.
-- Expected: columns present; both constraints present; the backfill census
-- shows every vendor with open_to_travel=true on 'pan_india', every
-- not-true-with-city on 'select_cities' with exactly one city, and zero rows
-- on 'worldwide'.

select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'vendors'
   and column_name in ('service_area', 'service_cities', 'open_to_travel', 'travel_notes')
 order by column_name;

select conname
  from pg_constraint
 where conrelid = 'public.vendors'::regclass
   and conname in ('vendors_service_area_token', 'vendors_service_cities_pairing')
 order by conname;

select coalesce(service_area, '(null)') as service_area,
       count(*)                          as vendors,
       count(service_cities)             as with_cities,
       min(coalesce(array_length(service_cities, 1), 0)) as min_cities,
       max(coalesce(array_length(service_cities, 1), 0)) as max_cities
  from public.vendors
 group by 1
 order by 1;
