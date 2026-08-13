-- 0098_circle_visibility.sql
-- TDW_14 · D-1 · C-3 — THE PER-MEMBER VISIBILITY COLUMN.
-- Supabase project: nvzkbagqxbysoeszxent (Mumbai)  ·  plane: PUBLIC
-- Applied: 2026-08-13 — founder-run, Supabase SQL editor, PRODUCTION
--          (nvzkbagqxbysoeszxent / main). All three verify blocks witnessed
--          green and pasted back: block 1 = visibility / jsonb / NO /
--          '{}'::jsonb · block 2 = 14 columns · block 3 = total_members 1,
--          non_empty_visibility 0. THE MIGRATION IS APPLIED AND CORRECT IN
--          PRODUCTION; only this file's copy in the repo was lost, and this
--          delivery restores it.
--
--          THIS LINE IS FILLED BY THE EXECUTOR, NOT THE FOUNDER, AND THAT IS
--          THE CHANGE. The first cut shipped a bracket for the founder to edit
--          by hand after applying. That hand-edit is how this file was
--          destroyed: the session that opened it to type a date received a
--          pasted shell command instead, and the whole migration was replaced
--          by one line of bash and pushed. A delivery that asks the founder to
--          open a file is a delivery that can lose the file. The apply date is
--          witnessable from his pasted verify results, so the executor writes
--          it and the file is never opened by hand.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- THIS FILE IS OUT OF ORDER ON PURPOSE, AND F-SW.3 IS WHY IT SAYS SO HERE
-- ═══════════════════════════════════════════════════════════════════════════
-- THE LADDER TIP IS 0123. THIS FILE IS 0098. It is not a mistake and it is not
-- a replay: 0098 has been a RESERVED, EMPTY address held for block 14 since
-- CE-59 (LD-8), and `docs/db/PUBLIC_SCHEMA.md`'s header lists it among the
-- nineteen numbers that carry no file. This is the file that fills it.
--
-- F-SW.3, minted at CE-32 with this migration named as its first obeyer: the
-- schema doc's staleness rule reads "if `db/migrations/` holds any file NEWER
-- than the ladder tip named above, this document is stale for the tables those
-- migrations touch." A file numbered 0098 landing after 0123 IS NOT NEWER BY
-- THAT TEST. It would not trip the rule, and the doc would go on answering
-- confidently about `circle_members` while a column it had never heard of
-- existed — which is exactly F-09.185's disease with the arithmetic reversed.
--
-- THE STANDING CURE, ruled at CE-32 and discharged by this delivery: an
-- out-of-order migration SHIPS ITS OWN LINE INTO THE DOC'S STALENESS HEADER,
-- naming itself. That edit rides this ZIP. This comment is the other half —
-- the doc points here, and this file points back, so neither can be read alone
-- and be misled.
--
-- ── WHAT THIS ADDS, AND WHAT IT DELIBERATELY DOES NOT ──────────────────────
-- ONE COLUMN: `circle_members.visibility jsonb NOT NULL DEFAULT '{}'::jsonb`.
--
-- NO DEFAULT BLOCK IN THE DDL. The 14 spec's reservation proposed
-- `default '{"budget":false,"vendors":true,"moments":true}'`. That arm is
-- REFUSED, and the refusal is the design: `src/lib/circlePermissions.js` is the
-- one home for what a permission DEFAULTS to, and a default written here as
-- well would be a second answer to that question, in a second language, drifting
-- the moment either moved. The column carries OVERRIDES; the code carries
-- DEFAULTS. `'{}'` therefore means "this member is answered exactly as every
-- member was answered yesterday" — which is what makes this migration
-- behaviour-inert on every existing row by construction rather than by care.
--
-- NO CHECK CONSTRAINT ON THE JSONB'S SHAPE. Considered and refused with the
-- reason attached: the allowlist is enforced on both sides in code
-- (`normaliseVisibility` on the write, `circlePermissions` on the read, one
-- home, neither able to disagree with the other), and a CHECK duplicating it
-- would be a THIRD statement of the same key set — the very disease this
-- delivery exists to end — that additionally could not be changed without a
-- migration when the key set is ruled. The read side is allowlist-shaped, so an
-- unexpected key in the column cannot reach a response body: it is ignored, not
-- served. A constraint here would buy tidiness in the table and cost the estate
-- its single home.
--
-- ── WHY `NOT NULL DEFAULT '{}'` AND NOT NULLABLE ───────────────────────────
-- The resolver treats null, absent and malformed identically (no overrides), so
-- a nullable column would be CORRECT. It is still refused: a nullable column
-- invites a reader to ask "is null different from empty here?", and the honest
-- answer being "no" is not something a schema can say. NOT NULL means the
-- question never arises and every row has the same shape.
--
-- ── WHAT MOVES IN THIS SAME DELIVERY (so this file is never read alone) ─────
--   · `src/lib/circlePermissions.js`                — the resolver + the write
--                                                     normaliser, one home
--   · `src/api/middleware/requireCircleMemberAuth.js` — reads the column, hands
--                                                     it to the resolver
--   · `src/api/couple/circle.js`                    — PATCH, the bride's writer
--   · `docs/db/PUBLIC_SCHEMA.md`                    — the F-SW.3 staleness line
--   · `scripts/b14_d1_visibility_bench.js`          — both-ways proof
--
-- ── ORDER ──────────────────────────────────────────────────────────────────
--   1. add the column   2. verify blocks at the foot, each pasted ALONE
-- There is no backfill leg. `DEFAULT '{}'` populates every existing row in the
-- same statement, and there is no old value to remap — the column has never
-- existed, so no row can hold a retired shape.

-- ── STATEMENT 1 · THE COLUMN ─────────────────────────────── paste alone ────
-- IF NOT EXISTS makes this re-runnable. It is not defensive dressing: the
-- Supabase editor renders only the LAST statement of a batch, so a founder who
-- cannot see statement 1's result may reasonably run it twice, and a second run
-- must be a no-op rather than an error that looks like a real failure.
ALTER TABLE public.circle_members
  ADD COLUMN IF NOT EXISTS visibility jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.circle_members.visibility IS
  'TDW_14 D-1 (C-3). PER-MEMBER OVERRIDES ONLY, short keys (budget, guests, vendors, contribute_muse), boolean values. DEFAULTS LIVE IN CODE at src/lib/circlePermissions.js and are deliberately NOT duplicated here; {} means "resolve to the defaults", which is why every pre-existing row is behaviour-identical after this migration. Written only by PATCH /api/v2/couple/circle/member/:memberId/visibility (the bride); read only by requireCircleMemberAuth via circlePermissions().';


-- ══════════════════════════════════════════════════════════════════════════
-- VERIFY — EACH BLOCK PASTED ALONE. The editor renders only the last statement
-- of a batch (F-OB.6's tuition), so a block run beside another is a block whose
-- result you did not see.
-- ══════════════════════════════════════════════════════════════════════════

-- ── BLOCK 1 · THE COLUMN ITSELF, READ OUT OF THE CATALOGUE ─── paste alone ──
-- Reads the DDL back rather than inferring it from rows. A row-inference here
-- would be worse than useless: every row will render `{}` whether the default
-- is the one authored above or something else entirely.
-- EXPECT EXACTLY 1 ROW:
--   column_name 'visibility' · data_type 'jsonb' · is_nullable 'NO'
--   · column_default '''{}''::jsonb'
SELECT column_name,
       data_type,
       is_nullable,
       column_default
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'circle_members'
   AND column_name  = 'visibility';

-- ── BLOCK 2 · THE TABLE'S NEW WIDTH ────────────────────────── paste alone ──
-- The witnessed snapshot says circle_members is THIRTEEN columns
-- (`docs/db/PUBLIC_SCHEMA.md`, snapshot 2026-08-13 at ladder tip 0123).
-- EXPECT 14. A 13 here means statement 1 did not land; a 15 means something
-- else reached this table and the schema doc is stale for a second reason.
SELECT count(*) AS circle_members_columns
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'circle_members';

-- ── BLOCK 3 · BEHAVIOUR-INERT ON EVERY EXISTING ROW ────────── paste alone ──
-- The claim this migration makes about production, checked against production
-- rather than asserted. Every pre-existing member must carry `{}` — an empty
-- override set — which is what makes "nobody's permissions changed today" a
-- witnessed fact instead of a promise.
-- EXPECT: total = the estate's member count, non_empty = 0.
SELECT count(*)                                        AS total_members,
       count(*) FILTER (WHERE visibility <> '{}'::jsonb) AS non_empty_visibility
  FROM public.circle_members;
