-- ═══════════════════════════════════════════════════════════════════════════════════
-- 0102_vendor_portfolio_position.sql  —  TDW_07 · Block 07 P3
--
--        ⚠  ALREADY APPLIED IN PRODUCTION, 2026-07-30. THIS FILE IS A RECORD.  ⚠
--
-- ── WHY IT IS BEING WRITTEN A DAY AFTER IT RAN (F-07.19, founder-ruled) ──────────
-- P3 shipped 0102 as a chat paste-block rather than a repo file. The founder ran it,
-- the readbacks came back green (P3 handover §6.5: "column readable, index present,
-- contiguity true"), and `vendor_portfolio.position` has been the single ordering
-- authority ever since — read at src/lib/vendor/portfolio.js:146/:202,
-- src/api/admin/vendorPortfolio.js:38 and src/api/couple/discover.js:122.
--
-- But the FILE was never committed. So `ls db/migrations/` read …0100, 0101, 0103 —
-- with a hole where an applied migration should be. A future hand deriving "the next
-- number" from the directory would author 0102 and collide with live production.
-- Filed at 0103, ruled by the founder 2026-07-30: close the hole.
--
-- ── THIS IS A RECONSTRUCTION, NOT THE ORIGINAL BYTES. SAID PLAINLY. ─────────────
-- The verbatim SQL the founder pasted is not recoverable from either repository. It
-- survives only as its EFFECTS, and those are what this file reproduces, derived by
-- command rather than recalled:
--   · the column           — read by name at the four sites listed above
--   · position 0 ⟺ cover   — portfolio.js:134 writes `{ position: i, is_hero: i === 0 }`
--   · contiguous 0..n-1    — the acceptance property the founder witnessed as
--                            readback C, and the invariant writeOrder() maintains
--   · the backfill was INVISIBLE — handover §6.5: "Swati's Frost card order identical
--                            pre/post-0102", which is what made appending safe
--
-- A later reader must not mistake this for the original paste. If the two ever
-- differ, PRODUCTION IS RIGHT AND THIS FILE IS WRONG — §3 below is how you find out.
--
-- ── SAFE TO RUN, AND THAT IS THE POINT ──────────────────────────────────────────
-- Every statement is idempotent. Running it against production changes NOTHING:
-- the column exists, the index exists, and the backfill is scoped to rows whose
-- position is still null — of which there are none. A recorded migration that would
-- damage production if executed is worse than the gap it closes, so this one cannot.
-- ═══════════════════════════════════════════════════════════════════════════════════


-- ── 1 · the column ────────────────────────────────────────────────────────────────
-- The single ordering authority for a vendor's portfolio. Nullable by design: the
-- backfill fills it, and writeOrder() is thereafter the ONE hand that writes it.
alter table public.vendor_portfolio
  add column if not exists position integer;


-- ── 2 · the index ─────────────────────────────────────────────────────────────────
-- Every read orders by (vendor_id, position). Named explicitly so this file and the
-- database agree on the identifier rather than leaving it to PostgreSQL's generator.
create index if not exists vendor_portfolio_vendor_position_idx
  on public.vendor_portfolio (vendor_id, position);


-- ── 3 · the backfill — INERT ON AN ALREADY-MIGRATED DATABASE ────────────────────
-- Scoped to rows where position IS NULL. In production that set is empty, so this
-- statement touches zero rows. It is retained because the file must be able to
-- reproduce the migration on a fresh database, not merely describe it.
--
-- The original ordering rule, from the handover's invisible-migration property:
-- the pre-0102 read sorted newest-first, so the backfill had to preserve exactly
-- that sequence or a curated grid would have reshuffled at apply.
with ranked as (
  select id,
         row_number() over (partition by vendor_id order by created_at desc) - 1 as new_position
    from public.vendor_portfolio
   where position is null
)
update public.vendor_portfolio p
   set position = r.new_position
  from ranked r
 where p.id = r.id;


-- ── 4 · VERIFY THIS FILE AGAINST THE LIVE SCHEMA ────────────────────────────────
-- Because §0 declares this a reconstruction, it owes a way to be checked. Run these;
-- paste the output. If either disagrees with what this file describes, PRODUCTION IS
-- RIGHT — amend the file, never the database.

-- 4a · expect ONE row: position, integer, YES (nullable).
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public'
   and table_name   = 'vendor_portfolio'
   and column_name  = 'position';

-- 4b · the index. Expect at least one row whose definition covers (vendor_id, position).
-- The NAME may differ from §2 if the original paste chose another — that is exactly
-- the kind of divergence this query exists to surface, and it is harmless.
select indexname, indexdef
  from pg_indexes
 where schemaname = 'public'
   and tablename  = 'vendor_portfolio'
   and indexdef ilike '%position%';

-- 4c · the acceptance property, unchanged from the founder's own readback C:
-- contiguous 0..n-1 per vendor, cover at 0. Any `false` is a STOP.
select v.vendor_id,
       count(*)                                                        as rows,
       bool_and(v.position is not null)                                as ok_not_null,
       (count(*) - 1) = max(v.position)                                as ok_contiguous,
       coalesce(bool_and((v.position = 0) = v.is_hero) filter
                (where v.is_hero or v.position = 0), true)             as ok_cover
  from public.vendor_portfolio v
 group by v.vendor_id
 order by v.vendor_id;
