-- ════════════════════════════════════════════════════════════════════
-- ARC OB · OB-D · D-3 — THE SIX-FIELD COMPLETENESS CENSUS
-- Founder-run in the Supabase SQL editor. READ-ONLY: no UPDATE, no
-- INSERT, no DDL anywhere in this file.
-- ════════════════════════════════════════════════════════════════════
--
-- WHY THIS RUNS BEFORE THE WALK CARD (fixture-state law, F-07.6):
-- the walk card is authored FROM these rows, never before them. Defaults
-- tell you what happens if nobody acted; this tells you what is actually
-- on file. Paste all three result sets back.
--
-- WHAT IT ANSWERS: after CE-32 ruling ⓵ the vendor predicate is SIX
-- fields, not five. This is the blast radius of that tightening on live
-- rows — how many vendors are complete, and exactly what each one is
-- missing. THE GATE IS DARK, so nothing below is refused anything today;
-- this is the census that says what WOULD be refused on arming day.
--
-- SQL-PROVENANCE (every column witnessed before the statement was
-- authored — never from memory):
--   public.users.name              docs/db/PUBLIC_SCHEMA.md, users col 3
--   public.users.id                docs/db/PUBLIC_SCHEMA.md, users col 1
--   public.vendors.user_id         PUBLIC_SCHEMA.md, vendors col 2
--   public.vendors.business_name   PUBLIC_SCHEMA.md, vendors col 3
--   public.vendors.category        PUBLIC_SCHEMA.md, vendors col 4
--   public.vendors.city            PUBLIC_SCHEMA.md, vendors col 6
--   public.vendors.status          PUBLIC_SCHEMA.md, vendors col 9
--   public.vendors.onboarding_state PUBLIC_SCHEMA.md, vendors col 14
--   public.vendors.rate_min        PUBLIC_SCHEMA.md, vendors col 27
--   public.vendors.service_area    db/migrations/0122_vendor_service_area.sql §1
--   public.vendors.service_cities  db/migrations/0122_vendor_service_area.sql §1
-- PUBLIC_SCHEMA.md is a snapshot at ladder tip 0099 and the ladder tail
-- is 0122; the two 0122 columns are therefore witnessed at the MIGRATION,
-- which is the settling witness for anything after 0099.
--
-- The presence tests below are the PREDICATE'S OWN RULES restated in SQL:
-- a text field is present when it is a non-empty, non-whitespace string;
-- starting price is present when it is strictly greater than zero (0 is
-- what an empty numeric box coerces to, never an answer); service area is
-- present when it is a canonical token AND, for select_cities, at least
-- one city is actually named.


-- ── 1 · THE HEADLINE ──────────────────────────────────────────────────
-- One row: how many vendors, how many complete under the SIX-field rule,
-- how many the tightening moves from complete-to-incomplete (i.e. those
-- carrying the other five but no business name).

select
  count(*)                                                        as vendors_total,
  count(*) filter (where btrim(coalesce(u.name, '')) <> '')       as have_person_name,
  count(*) filter (where btrim(coalesce(v.business_name, '')) <> '') as have_business_name,
  count(*) filter (where btrim(coalesce(v.category, '')) <> '')   as have_category,
  count(*) filter (where btrim(coalesce(v.city, '')) <> '')       as have_city,
  count(*) filter (where coalesce(v.rate_min, 0) > 0)             as have_starting_price,
  count(*) filter (where v.service_area in ('pan_india', 'worldwide')
                      or (v.service_area = 'select_cities'
                          and coalesce(array_length(v.service_cities, 1), 0) >= 1))
                                                                  as have_service_area,
  count(*) filter (where btrim(coalesce(u.name, '')) <> ''
                    and btrim(coalesce(v.business_name, '')) <> ''
                    and btrim(coalesce(v.category, '')) <> ''
                    and btrim(coalesce(v.city, '')) <> ''
                    and coalesce(v.rate_min, 0) > 0
                    and (v.service_area in ('pan_india', 'worldwide')
                         or (v.service_area = 'select_cities'
                             and coalesce(array_length(v.service_cities, 1), 0) >= 1)))
                                                                  as complete_six_fields,
  count(*) filter (where v.onboarding_state = 'complete')         as marked_complete_today
from public.vendors v
left join public.users u on u.id = v.user_id;


-- ── 2 · THE MARKER'S HONESTY GAP (F-OB.2, measured) ───────────────────
-- How many rows carry onboarding_state='complete' while failing the
-- predicate. This is the finding's live count: the marker saying complete
-- over a row that is not. Expect this to be non-zero — that is the
-- disease, not a surprise, and the cure stops it growing rather than
-- rewriting history.

select
  count(*) filter (where v.onboarding_state = 'complete')          as marked_complete,
  count(*) filter (where v.onboarding_state = 'complete'
                    and not (btrim(coalesce(u.name, '')) <> ''
                         and btrim(coalesce(v.business_name, '')) <> ''
                         and btrim(coalesce(v.category, '')) <> ''
                         and btrim(coalesce(v.city, '')) <> ''
                         and coalesce(v.rate_min, 0) > 0
                         and (v.service_area in ('pan_india', 'worldwide')
                              or (v.service_area = 'select_cities'
                                  and coalesce(array_length(v.service_cities, 1), 0) >= 1))))
                                                                   as marked_complete_but_not,
  count(*) filter (where v.onboarding_state is null)               as marker_never_set
from public.vendors v
left join public.users u on u.id = v.user_id;


-- ── 3 · ROW BY ROW — what each vendor is missing ──────────────────────
-- The walk card is authored from THIS result set. `missing` uses the
-- predicate's own field vocabulary (the strings OB-P's form keys off), in
-- the same order the API's missing[] reports them, so a row here and a
-- 400 from the endpoint can be read against each other directly.
-- No phone column is selected: it is not needed to answer this question.

select
  v.id                                                as vendor_id,
  coalesce(nullif(btrim(coalesce(v.business_name, '')), ''), '(no business name)') as business,
  coalesce(v.onboarding_state, '(null)')              as marker,
  v.status,
  array_remove(array[
    case when btrim(coalesce(u.name, ''))            = '' then 'name'           end,
    case when btrim(coalesce(v.business_name, ''))   = '' then 'business_name'  end,
    case when btrim(coalesce(v.category, ''))        = '' then 'category'       end,
    case when btrim(coalesce(v.city, ''))            = '' then 'city'           end,
    case when coalesce(v.rate_min, 0)               <= 0  then 'starting_price' end,
    case when not (v.service_area in ('pan_india', 'worldwide')
                   or (v.service_area = 'select_cities'
                       and coalesce(array_length(v.service_cities, 1), 0) >= 1))
         then 'service_area' end
  ], null)                                            as missing,
  coalesce(v.service_area, '(null)')                  as service_area,
  coalesce(array_length(v.service_cities, 1), 0)      as named_cities
from public.vendors v
left join public.users u on u.id = v.user_id
order by cardinality(array_remove(array[
    case when btrim(coalesce(u.name, ''))            = '' then 'name'           end,
    case when btrim(coalesce(v.business_name, ''))   = '' then 'business_name'  end,
    case when btrim(coalesce(v.category, ''))        = '' then 'category'       end,
    case when btrim(coalesce(v.city, ''))            = '' then 'city'           end,
    case when coalesce(v.rate_min, 0)               <= 0  then 'starting_price' end,
    case when not (v.service_area in ('pan_india', 'worldwide')
                   or (v.service_area = 'select_cities'
                       and coalesce(array_length(v.service_cities, 1), 0) >= 1))
         then 'service_area' end
  ], null)) asc,
  v.created_at asc;
