-- 0109_demo_invite_sent_marker.sql
-- TDW_08 · P5 · PHASE 1 — FORK C(i): the SPENT MARKER for demo_invite.
-- Ladder: follows 0108_demo_lead_budget.sql. Derived by `ls db/migrations/ | tail`
-- at dream-os 3917f87; 0109 is the next free address and no reserved number is filled.
--
-- ── SQL-PROVENANCE (CE-56), STATED HONESTLY ─────────────────────────────────
-- STARTING WITNESS: docs/db/PUBLIC_SCHEMA.md:378-395 — public.demo_vendors, columns
--   1..14 as of the 2026-07-23 snapshot at ladder tip 0099.
-- THE SNAPSHOT IS TEN MIGRATIONS BEHIND at this writing and does NOT carry the
--   lifecycle columns. Those are witnessed at the LADDER instead, which is the
--   witness-checker's own alternative ("table to its section-bounded snapshot OR
--   migration"):
--     · 0106_demo_lifecycle.sql:47-58 — state, invited_at, opened_at, engaged_at,
--       claimed_at, removed_at, expires_at, extension_used, claim_token,
--       claimed_vendor_id  (+10)
--     · 0107_demo_sunset_marker.sql:54-55 — sunset_at  (+1)
--   0107's own readback asserted demo_vendors reached 25 columns; 0108 touched
--   demo_leads ONLY (0108:50-51), so 25 is the count this file expects to find and
--   26 the count it expects to leave. The readback at the foot PROVES both rather
--   than trusting this paragraph.
-- `invite_sent_at` is ABSENT from every one of those witnesses — that absence is
--   the reason this file exists, and the readback's arm 1 settles it at run time.
-- information_schema is the SETTLING witness and it runs below, in the founder's
--   editor, on production. Nothing here was authored from memory.
--
-- WHAT THIS TOUCHES: public.demo_vendors, one new nullable column. Nothing else.
-- No CHECK is altered, no index is created, no row's data is changed, no other
-- table is named. The PARKED partial unique indexes are absent in every form.
--
-- ── WHY THIS COLUMN EXISTS (the disease, in the schema's own words) ──────────
-- `_inviteOne` (src/api/admin/demoAdmin.js) spends a real WhatsApp template and
-- THEN writes state through demoLifecycle.onInvited. The two acts are sequential
-- and they can come apart: onInvited can return not-ok, or throw, AFTER the
-- template has reached a real handset. When that happens the row still reads
-- `built`, INVITE_STATES still admits it, and NOTHING IN THE DATABASE RECORDS
-- THAT A TEMPLATE WAS SPENT — so the founder can send the same vendor a second
-- one. The state machine could not carry this fact: `state` answers "where is
-- this demo in its life", and the answer stayed `built` precisely because the
-- transition failed. A second question needs a second column.
--
-- THIS COLUMN IS THAT FACT AND NOTHING MORE: "a demo_invite template was
-- despatched to this row's handset, at this moment." It is not a state, it is not
-- a presence field, and no feed or board predicate ranks on it.
--
-- ── THE STAMP IDIOM, DECLARED AT BIRTH (0107's discipline, followed) ─────────
-- HISTORY stamp — removed_at's and sunset_at's family. Set once when a template
-- is despatched; NEVER cleared. A send having happened is not undone by anything
-- that happens afterwards, which is the entire point: if it were clearable the
-- column could not refuse the second send it exists to refuse. It is deliberately
-- NOT discover_eligible_at's family (a STATE stamp, nulled when its condition
-- ends). The argument is at src/lib/demoLifecycle.js:40-52 and the cost of
-- harmonising the two idioms is recorded at 0067_demo_vendor_discover.sql:24-25.
--
-- IT SHIPS WITH ITS WRITER, NEVER AHEAD OF IT (CE-147 §4, followed): the sole
-- writer `demoLifecycle.markInviteSent()` and the pre-check that reads it are in
-- the same delivery as this file. A column nobody writes is the phantom class.
--
-- ── ORDER OF OPERATIONS, AND IT IS NOT OPTIONAL ─────────────────────────────
-- RUN THIS FILE FIRST, IN THE SUPABASE SQL EDITOR, BEFORE APPLYING THE ZIP.
-- The cured `_inviteOne` SELECTs `invite_sent_at` by name; against a database
-- without the column PostgREST answers an error and the invite route refuses
-- every row. The delivery's handover states this as step 1 for that reason.
--
-- ATOMIC: statements 1-2 run inside one transaction. Either both land or neither
-- does. The readback at the foot runs AFTER commit and witnesses committed state.


begin;

-- ── 1 · THE SPENT MARKER ─────────────────────────────────────────────────────
-- The form below is 0106/0107's exact ADD COLUMN shape, deliberately: the
-- phantom-column bench derives "was this column added by the ladder" by matching
-- ALTER TABLE ... ADD COLUMN against the migration text
-- (scripts/b07_f0789_phantom_columns_bench.js:75). A DO block or a different
-- phrasing would leave that bench unable to see this column's provenance and it
-- would be reported as a phantom -- correct machinery reaching a false verdict.
alter table public.demo_vendors
  add column if not exists invite_sent_at timestamptz;

-- ── 2 · THE F-06.85 HEADER, IN THE DATABASE ──────────────────────────────────
-- It lives here as well as in the source so the next schema snapshot carries it,
-- and so the next hand reading three *_at stamps side by side is forced to read
-- why this one is not the state machine's.
comment on column public.demo_vendors.invite_sent_at is
  'When a demo_invite WhatsApp template was DESPATCHED to this row''s handset, TDW_08 P5 Phase 1 (FORK C(i)). Written ONLY by markInviteSent() in src/lib/demoLifecycle.js, called only from _inviteOne in src/api/admin/demoAdmin.js immediately after a successful send and before the invited transition. IT IS A HISTORY STAMP AND IS NEVER CLEARED - the same idiom as removed_at and sunset_at, and DELIBERATELY NOT the idiom of discover_eligible_at, which means "eligible since" and IS nulled when its condition ends; if this stamp were clearable it could not refuse the second send it exists to refuse. WHY IT IS NOT state: the send and the invited transition are two acts, and when the second fails the row correctly stays built while a real template has already reached a real handset - state cannot carry that fact because state is the fact that did not get written. The pre-check in _inviteOne refuses any row whose invite_sent_at is set (invite_already_sent) BEFORE spending a template, so a row carrying this stamp with state=built is a visible recovery case and not a re-send. Recovery is founder-SQL by ruling (FORK D(ii)); no route clears this column.';

commit;


-- ── 3 · READBACK — the settling witness. It runs after the commit above and is
--        the ONLY grid the editor renders, because statements 1-2 return no
--        result set (F-08.16: the Supabase editor shows the FINAL result set
--        only -- a hazard for a witness block and an asset for this one).
--        Hand the whole grid back. FIVE rows; every `answer` must read `true`.
select * from (
  select 1 as pos, 'invite_sent_at exists on demo_vendors'::text as check_,
         (exists (select 1 from information_schema.columns
                   where table_schema='public' and table_name='demo_vendors'
                     and column_name='invite_sent_at'))::text as answer
  union all
  select 2, 'invite_sent_at is nullable and timestamptz (never NOT NULL)',
         (exists (select 1 from information_schema.columns
                   where table_schema='public' and table_name='demo_vendors'
                     and column_name='invite_sent_at'
                     and is_nullable='YES'
                     and data_type='timestamp with time zone'))::text
  union all
  select 3, 'invite_sent_at carries NO default (a stamp is written, never defaulted)',
         ((select column_default from information_schema.columns
            where table_schema='public' and table_name='demo_vendors'
              and column_name='invite_sent_at') is null)::text
  union all
  select 4, 'demo_vendors column count is now 26 (was 25 after 0107)',
         ((select count(*) from information_schema.columns
            where table_schema='public' and table_name='demo_vendors') = 26)::text
  union all
  select 5, 'EVERY EXISTING ROW READS NULL — this file stamped nothing',
         ((select count(*) from public.demo_vendors where invite_sent_at is not null) = 0)::text
) r
order by r.pos;


-- ── THE REVERSE DIRECTION, FULLY COMMENTED (the conditional-withheld rule) ───
-- It is NOT runnable as delivered and must not be uncommented in the same paste
-- as the block above. If the founder rules a revert, the step is: delete the two
-- leading dashes on the single ALTER line below and run THAT LINE ALONE, in its
-- own paste, after the cured code has been reverted at the tree -- because the
-- live `_inviteOne` SELECTs this column by name and dropping it under running
-- code makes every invite refuse.
-- DESTRUCTIVE: this discards the record that templates were spent. Per protocol
-- §4's destructive-action law it requires the founder's sign-off recorded in the
-- handover and an export of the column taken first:
--   select id, ig_handle, invite_sent_at from public.demo_vendors
--    where invite_sent_at is not null;
--
-- alter table public.demo_vendors drop column if exists invite_sent_at;
