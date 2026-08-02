-- 0107_demo_sunset_marker.sql
-- TDW_08 · Sitting A — F-08.7's cure (the sunset marker) and G-2's dial (the seed).
-- Ladder: follows 0106_demo_lifecycle.sql. Spec §2's reserved 0082 was superseded at CE-131.
--
-- AUTHORED FROM THE FOUNDER'S PASTED information_schema ROWS, 2026-08-02, and from
-- nothing else (SQL-PROVENANCE, CE-56). The witness returned in ONE result set:
--   · demo_vendors  = 24 columns, ordinals 1..24, and NO sunset_at        (arm A line 1: false)
--   · admin_config  = key text NOT NULL · value text NOT NULL · description text ·
--                     updated_at timestamptz NOT NULL default now()      (arm C, ordinals 1..4)
--   · demo.sunset_days is ABSENT                                          (arm D line 1: present=false)
--   · 12 rows, arm E listed 12 — the self-computing guard matched, so the grid was not capped.
-- docs/db/PUBLIC_SCHEMA.md is EIGHT migrations behind at this writing and was the
-- STARTING witness only; information_schema is the settling one.
--
-- WHAT THIS TOUCHES: public.demo_vendors and public.admin_config. Nothing else.
-- The two PARKED partial unique indexes are absent from this file in every form, by charter.
-- No CHECK is altered, no index is created, no row's state is changed.
--
-- ATOMIC: statements 1-3 run inside one transaction. Either all land or none do.
-- The readback at the foot runs AFTER commit and witnesses committed state.


begin;

-- ── 1 · THE SUNSET MARKER (F-08.7) ───────────────────────────────────────────
-- WHY IT EXISTS. runSunsetSweep rotates an unclaimed demo out of Discover by
-- flipping discover_eligible false and clearing discover_eligible_at
-- (src/lib/demoLifecycle.js:506-511). Afterwards a swept row is byte-identical to
-- a row an admin revoked by hand, and to one revoked eight weeks ago: no marker,
-- no timestamp, no WHEN. Spec P6 is "demo rows purged after the 7-day resurrect
-- window" and P6 cannot compute that window from a row that does not say when it
-- was rotated. This column is that fact and nothing more.
--
-- IT SHIPS WITH ITS WRITER, NEVER AHEAD OF IT. A column nobody writes is exactly
-- the phantom class this sitting is deleting nineteen lines of one file over, so
-- the sweep's own stamp lands in the same delivery. Ruled together at CE-147 §4.
--
-- THE STAMP IDIOM, DECLARED AT BIRTH RATHER THAN CONFESSED LATER. This is a
-- HISTORY stamp, removed_at's family: it is SET on a sunset and NEVER CLEARED
-- when an admin grants the row back into the feed, because it records that a
-- rotation happened and the rotation being undone does not un-happen it. It is
-- deliberately NOT discover_eligible_at's family, which is a STATE stamp meaning
-- "eligible since" and IS nulled the moment eligibility goes false. The next hand
-- reading those two columns side by side will reach for consistency. DO NOT --
-- src/lib/demoLifecycle.js:40-52 carries the whole argument, and 0067_demo_vendor_
-- discover.sql:24-25 is the committed evidence of what harmonising them cost.
--
-- The form below is 0106's exact ADD COLUMN shape, deliberately: the estate's
-- phantom-column bench derives "was this column added by the ladder" by matching
-- ALTER TABLE ... ADD COLUMN against the migration text (scripts/b07_f0789_
-- phantom_columns_bench.js:74-76). A DO block or a different phrasing would leave
-- the bench unable to see this column's provenance and it would be reported as a
-- phantom -- correct machinery reaching a false verdict.
alter table public.demo_vendors
  add column if not exists sunset_at timestamptz;

-- ── 2 · THE F-06.85 HEADER, IN THE DATABASE ──────────────────────────────────
-- It lives here and not only in this file, so the next schema snapshot carries it
-- and the next reader of discover_eligible_at is forced to re-read the distinction.
comment on column public.demo_vendors.sunset_at is
  'When this demo was LAST rotated out of Discover by the nightly sunset, TDW_08 (G-2). Written ONLY by runSunsetSweep in src/lib/demoLifecycle.js, which is the sole writer of the four presence fields; nothing else sets it and no predicate reads it in P1. IT IS A HISTORY STAMP AND IS NEVER CLEARED - the same idiom as removed_at, and DELIBERATELY NOT the idiom of discover_eligible_at, which means "eligible since" and IS nulled the moment eligibility goes false. Do not harmonise them: the argument is at src/lib/demoLifecycle.js:40-52 and the cost of getting it wrong is recorded at 0067_demo_vendor_discover.sql:24-25, where a state stamp outliving its condition left four rows carrying a stamp with eligibility false. A sunset is not a takedown: state is unchanged, active stays true, and the content is retained, so P6 deletion queue can still tell a rotation from a removal. This column exists so P6 can compute the resurrect window it was specified to honour (F-08.7).';

-- ── 3 · THE SUNSET DIAL (G-2, founder: 90 days, raiseable and lowerable) ─────
-- PROVENANCE: the founder-run information_schema witness, 2026-08-02 --
--   public.admin_config: 1. key text NOT NULL · 2. value text NOT NULL ·
--   3. description text · 4. updated_at timestamptz NOT NULL default now()
-- `value` is TEXT, so the horizon is stored as a string and read back through
-- readSunsetDays' defensive JSON.parse (src/lib/demoLifecycle.js:446-457), which
-- mirrors the house idiom at src/lib/prospects.js:44-56. NO DDL is needed --
-- admin_config is a KV store and this is a row. The description follows the
-- witnessed convention of the one seeded key production already holds.
--
-- WHY THE SEED SHIPS WITH THE DDL AND NOT LATER, exactly as 0101_profile_controls.
-- sql:95-99 argued for the ranking weights: src/api/admin/config.js:31-32 returns
-- 404 for a key with no row and the router exposes NO insert route, so an unseeded
-- key cannot be created by any founder thumb-path that exists. Seeding is a
-- PRECONDITION of the flip, not a convenience.
--
-- AND THE HONEST HALF, STATED HERE SO NOBODY LEARNS IT BY CLICKING (F-08.9): this
-- row does NOT make a dial appear. The admin config screen renders a hardcoded
-- group list and this key is in none of them, so the seed is necessary and not yet
-- sufficient. The affordance is one byte in a surface this sitting is chartered not
-- to touch, and it belongs with the demo board.
--
-- 90 IS ALSO THE CODE DEFAULT (src/lib/demoLifecycle.js:83), so seeding it changes
-- no behaviour today. That is deliberate: the row's job is to make the value
-- EDITABLE, not to change it. A reader who cannot tell "the seed worked" from "the
-- default held" is reading the right thing -- the proof of the seed is the row's
-- existence in the readback below, never a change in the sweep's arithmetic.
--
-- ON CONFLICT DO NOTHING: re-running this file must never stomp a horizon the
-- founder has since tuned. The seed is a floor, not a reset.
insert into public.admin_config (key, value, description) values
  ('demo.sunset_days', '90', 'Days an unclaimed demo stays in Discover before the nightly sunset rotates it out (TDW_08, G-2; admin-adjustable).')
on conflict (key) do nothing;

commit;


-- ── 4 · READBACK — the settling witness. It runs after the commit above and is
--        the ONLY grid the editor renders, because statements 1-3 return no result
--        set (F-08.16: the Supabase editor shows the FINAL result set only, which
--        is a hazard for a witness block and an asset for this one).
--        Hand the whole grid back. FOUR rows, and every `answer` must read `true`
--        except the last, which must read `90`.
select * from (
  select 1 as pos, 'sunset_at exists on demo_vendors'::text as check_,
         (exists (select 1 from information_schema.columns
                   where table_schema='public' and table_name='demo_vendors'
                     and column_name='sunset_at'))::text as answer
  union all
  select 2, 'sunset_at is nullable and timestamptz (never NOT NULL)',
         (exists (select 1 from information_schema.columns
                   where table_schema='public' and table_name='demo_vendors'
                     and column_name='sunset_at'
                     and is_nullable='YES'
                     and data_type='timestamp with time zone'))::text
  union all
  select 3, 'demo_vendors column count is now 25 (was 24)',
         ((select count(*) from information_schema.columns
            where table_schema='public' and table_name='demo_vendors') = 25)::text
  union all
  select 4, 'admin_config demo.sunset_days value',
         coalesce((select value from public.admin_config
                    where key='demo.sunset_days'), '~STILL ABSENT~')
) r
order by r.pos;
