-- 0108_demo_lead_budget.sql
-- TDW_08 · P3 — G-4 as amended by its author, 2026-08-03: 「 budget should be visible. contact blurred 」.
-- Ladder: follows 0107_demo_sunset_marker.sql. Spec §2's reserved 0082 was superseded at CE-131.
--
-- ╔══════════════════════════════════════════════════════════════════════════════════════╗
-- ║ APPLIED TO PRODUCTION 2026-08-03 — DO NOT RE-RUN.                                    ║
-- ║                                                                                      ║
-- ║ THIS TEXT IS WHAT PRODUCTION RAN. Statements 1-2 below are byte-identical to the      ║
-- ║ block the founder pasted into the Supabase SQL editor (0106:11's precedent — a        ║
-- ║ migration file that does not match the DDL that hit the database is worse than no     ║
-- ║ file). The readback that followed is preserved at the foot as the witness.            ║
-- ║                                                                                      ║
-- ║ AUTHORSHIP, NAMED BECAUSE A STEP WAS SKIPPED AND THE CHAIR NAMED IT (CE, §5 of the    ║
-- ║ census ruling): this DDL was authored by the EXECUTOR from the founder's pasted       ║
-- ║ information_schema rows, and it ran before it reached the chair's desk. CE-126's      ║
-- ║ four-message sequence is witness → paste → author-from-paste → run + readback; the    ║
-- ║ third step went one desk short. The outcome is witnessed clean and was not unwound.   ║
-- ║ Recorded rather than smoothed, so a skipped step is never read as a completed one.    ║
-- ╚══════════════════════════════════════════════════════════════════════════════════════╝
--
-- AUTHORED FROM THE FOUNDER'S PASTED information_schema ROWS, 2026-08-03, and from nothing
-- else (SQL-PROVENANCE, CE-56). The witness returned in ONE result set:
--    public.demo_leads = FOURTEEN columns, ordinals 1..14, ending converted_lead_id uuid YES
--    NO budget column of any name · NO function/event-type column · NO raw_message
--    existing_rows = 19 (table-wide)
-- docs/db/PUBLIC_SCHEMA.md prints its own ladder tip as 0099 (header :4) and reports this
-- table at THIRTEEN columns (:360); 0106:68-69 added the fourteenth (converted_lead_id).
-- It was the STARTING witness only — information_schema is the settling one. 0107:12-13
-- said so first, one migration earlier, and both the chair and the executor read the doc
-- anyway. That is F-08.33 and this header is where it is paid for.
--
-- WHAT THIS TOUCHES: public.demo_leads. One column. Nothing else. No CHECK, no index,
-- no default, no backfill, and no existing row's value changes.
--
-- ATOMIC: statements 1-2 run inside one transaction. The readback runs AFTER commit.

begin;

-- ── 1 · THE COLUMN ────────────────────────────────────────────────────────────
-- SAME NAME, SAME MEANING, SAME TYPE AS THE REAL PLANE. public.leads.budget_max is
-- `integer` (PUBLIC_SCHEMA.md:571 — verified current: no migration in 0100..0107 alters
-- public.leads), and src/api/couple/enquire.js:106 already produces exactly that integer
-- via bandCeiling(). A different name here would mint F-08.28's disease on purpose:
-- one meaning, two planes, two names.
--
-- NULLABLE AND DEFAULTLESS. The 19 existing leads genuinely have no budget — they were
-- captured before this column existed. A default would fabricate one, and CE-133 already
-- paid for that lesson: a value assigned without its stamp is a fabricated history in a
-- column built to record history.
alter table public.demo_leads
  add column if not exists budget_max integer;

-- ── 2 · WHAT IT MEANS, IN THE DATABASE ────────────────────────────────────────
comment on column public.demo_leads.budget_max is
  'The CEILING of the band the couple chose, in whole rupees - NOT a figure she named (src/api/couple/enquire.js:100 and :106, bandCeiling). NULL means no budget was captured, which is true of every row created before 2026-08-03. NULL renders as an OMITTED line on the tease - never a blank, a dash, or a shimmer over nothing. Mirrors public.leads.budget_max in name, meaning and type deliberately: the demo plane and the real plane must not disagree about what this word means. This is a captured value, not a reference - it carries no foreign key and has nothing to do with demo_leads.converted_lead_id.';

commit;

-- ── READBACK — after commit, and the block's ONLY result set ───────────────────
-- One statement, because the Supabase editor renders the final result set only (F-08.16).
select * from (
  select 1 as pos, 'budget_max landed (expect: integer | YES | ~no default~)'::text as fact,
         coalesce(
           (select c.data_type || ' | ' || c.is_nullable || ' | '
                   || coalesce(c.column_default, '~no default~')
              from information_schema.columns c
             where c.table_schema = 'public' and c.table_name = 'demo_leads'
               and c.column_name = 'budget_max'),
           '~COLUMN ABSENT - THE ALTER DID NOT LAND~') as value
  union all
  select 2, 'demo_leads column count (expect 15 = the witness''s 14 + this one)',
         (select count(*)::text from information_schema.columns
           where table_schema = 'public' and table_name = 'demo_leads')
  union all
  select 3, 'rows unchanged (expect 19 - this migration moves no row)',
         (select count(*)::text from public.demo_leads)
  union all
  select 4, 'rows carrying a budget (expect 0 - nothing was backfilled)',
         (select count(*)::text from public.demo_leads where budget_max is not null)
  union all
  select 5, 'the comment is on the column',
         coalesce(left(col_description('public.demo_leads'::regclass,
                  (select ordinal_position::int from information_schema.columns
                    where table_schema = 'public' and table_name = 'demo_leads'
                      and column_name = 'budget_max')), 60), '~NO COMMENT~')
) s order by s.pos;

-- ── THE READBACK AS PRODUCTION ANSWERED IT, 2026-08-03 (founder's own paste) ───
--   pos | fact                                                    | value
--     1 | budget_max landed (expect: integer | YES | ~no default~) | integer | YES | ~no default~
--     2 | demo_leads column count (expect 15)                      | 15
--     3 | rows unchanged (expect 19)                               | 19
--     4 | rows carrying a budget (expect 0)                        | 0
--     5 | the comment is on the column                             | "The CEILING of the band the couple chose, in whole rupees - "
--
-- Line 4 is the ruling proven at the data: nineteen rows exist, none was backfilled, and
-- the render rule (NULL ⇒ omit) is therefore the rule that governs EVERY lead in the
-- estate today. The first row that shows a budget line will be one enquired after this ran.
--
-- ── ROLLBACK ──────────────────────────────────────────────────────────────────
-- Additive and exactly reversible; no data existed in the column to lose. It ships
-- fully commented (conditional-withheld) and runs only on an explicit founder ruling:
--
-- alter table public.demo_leads drop column if exists budget_max;
--
-- A code revert alone is safe without it: the column is nullable with no reader that
-- requires it, and an unused nullable column breaks nothing.
