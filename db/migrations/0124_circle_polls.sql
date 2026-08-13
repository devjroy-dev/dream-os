-- 0124_circle_polls.sql
-- TDW_14 · D-3 · C-4 — DECISION POLLS IN THE CIRCLE.
-- Supabase project: nvzkbagqxbysoeszxent (Mumbai)  ·  plane: PUBLIC
-- Applied: 2026-08-13 — founder-run, Supabase SQL editor, PRODUCTION
--          (nvzkbagqxbysoeszxent / main). All three statements and all four
--          verify blocks witnessed green and pasted back:
--            V1  13 column rows (9 + 4); thread_id / linked_event_id /
--                closes_at nullable, every other column NOT NULL
--            V2  9 constraints — 2 PK, 6 FK, 1 CHECK. Postgres normalised the
--                CHECK's BETWEEN into `>= 2 AND <= 4`, which is the same
--                predicate rendered in the catalogue's own grammar, and
--                circle_poll_votes_pkey reads PRIMARY KEY (poll_id,
--                voter_user_id) — the one-vote rule, at the plane.
--            V3  4 indexes (2 PK + the 2 authored here)
--            V4  polls 0, votes 0, circle_members 14 — D-1's width unmoved
--          THIS LINE IS FILLED BY THE EXECUTOR, NOT THE FOUNDER (0098's
--          tuition: the session that opened a migration by hand to type a date
--          received a pasted shell command instead and the whole file was lost).
--
--          THE COUNT IN V2's EXPECT LINE WAS WRONG WHEN IT SHIPPED, AND IT IS
--          CORRECTED BELOW. It read "8 rows: 2 PK, 5 FK, 1 CHECK"; there are
--          SIX foreign keys, not five — couple_id, thread_id, linked_event_id,
--          created_by_user_id on circle_polls, plus poll_id and voter_user_id
--          on circle_poll_votes. The DDL was right and the prediction was
--          short by one. "Assert the artifact, never a predicted count" is a
--          standing law and this is its specimen: a wrong expectation can make
--          a correct result look like a failure just as easily as the reverse,
--          and the founder is the one holding it. Cell §7.7 of
--          scripts/b14_d3_polls_bench.js now counts the DDL's own constraint
--          declarations and reds if this file's stated expectation disagrees
--          with them, so the next such line cannot be wrong quietly.
--
-- ── THE ADDRESS IS 0124, IN ORDER, AND THAT IS WORTH SAYING ────────────────
-- The ladder tip is 0123 and this is 0124: the natural next. **F-SW.3's
-- out-of-order rule DOES NOT APPLY and this migration owes the schema doc's
-- staleness header NO line** — the arithmetic check ("newer than the ladder
-- tip") sees it correctly. That is stated because 0098 landed out of order five
-- deliveries ago and made the exception look like this block's habit.
--
-- Row 14 held exactly ONE reserved address and D-1 spent it. Every remaining
-- hole belongs to another block (0088/0089 → 15 · 0090/0091 → 16 · 0092/0093 →
-- 17 · 0097 → 13), so there was nothing to fill and nothing to seize.
--
-- THE SPEC'S OWN ADDRESS LINE IS DEAD INK TWICE OVER (CE-33's supplement):
-- TDW_14 §P5.1 says "two tables per 0087". 0087 was SEIZED from this block by
-- applied code (F-04.108, 0087_crew_assignment.sql is live), the founder
-- re-homed 14 to 0098, and D-1 then spent 0098 on the visibility column. The
-- number in the spec has been wrong through two separate events; 0124 is the
-- live answer.
--
-- ── SQL-PROVENANCE (protocol §10, absolute) ───────────────────────────────
-- Every column below is witnessed at `docs/db/PUBLIC_SCHEMA.md` (snapshot
-- 2026-08-13, 67 tables / 774 columns, ladder tip 0123 — current by its own
-- staleness rule, no migration newer than the tip). FK targets read out of the
-- doc before authoring, never from memory:
--   couples(id)        couples_pkey        · doc :1356
--   users(id)          users_pkey          · doc :1736
--   events(id)         events_pkey         · doc :1445
--   conversations(id)  conversations_pkey  · doc :1289
-- `couples.user_id uuid NOT NULL` is the fact R-D3.2 stands on — see below.
--
-- ── WHY `voter_user_id uuid` AND NOT THE SPEC'S `member_ref text` (R-D3.2) ──
-- The spec reserved `member_ref text not null /*'bride'|member_id*/` — a text
-- column mixing a magic sentinel with a uuid. THIS LANE ALREADY CARRIES THAT
-- SCAR: the `dm:` thread prefix and the `counterparty_user_id` discriminator are
-- what a sentinel-in-a-text-column costs when it is read by four selectors.
--
-- It is not needed, and the reason is one witnessed column: `couples.user_id`
-- is `uuid NOT NULL`, so THE BRIDE HAS A `users.id` TOO. Both actor classes on
-- this lane are already identified that way — `messages.sender_user_id` is that
-- column, `byMemberUsersId` resolves a member to it and `byCoupleId`
-- (messages.js:141) resolves the bride to it. So one uuid column answers
-- "who voted" for everybody, and
--
--     PRIMARY KEY (poll_id, voter_user_id)
--
-- enforces "one vote per participant, the bride included" MECHANICALLY. The
-- spec's sentence becomes a constraint instead of a convention.
--
-- THE SEMANTIC THIS CHOOSES, named rather than smuggled: keying on `users.id`
-- means a member REMOVED AND RE-INVITED KEEPS her vote — same person, same poll,
-- her vote stands. Keying on `circle_members.id` would have dropped it. The
-- founder's word is recommended KEEP and rides the veto sheet; if it ever
-- reverses, this PK is the site.
--
-- ── WHY NO FK ON `voter_user_id` → users(id) ──────────────────────────────
-- Considered and TAKEN — see the constraint. It is named here only because the
-- adjacent choice went the other way: `created_by_user_id` also references
-- users(id) and both are ON DELETE CASCADE, so a user row's removal takes her
-- votes and her polls with it rather than leaving orphans that every tally
-- query would then have to defend against.
--
-- ── WHY `options jsonb` AND NOT AN OPTIONS TABLE ──────────────────────────
-- A third table would buy referential integrity on `option_id` and cost a join
-- on every read of a 2–4 element list that is written ONCE at creation and never
-- edited. The 2–4 bound and the option-id membership are enforced in code at the
-- one write path (`src/api/circle/polls.js`) and asserted by cells, and a CHECK
-- below holds the cardinality at the plane so a hand-written INSERT cannot
-- create a one-option poll. Stated so the trade is a decision on the record.
--
-- ── ORDER ─────────────────────────────────────────────────────────────────
--   1. circle_polls   2. circle_poll_votes (FKs the first)   3. indexes
--   4. verify blocks at the foot, each pasted ALONE
-- No backfill leg: both tables are new, so no row can hold a retired shape.


-- ── STATEMENT 1 · circle_polls ───────────────────────────────── paste alone ──
-- IF NOT EXISTS makes this re-runnable: the editor renders only the LAST
-- statement of a batch, so a founder who cannot see this result may reasonably
-- run it twice and the second run must be a no-op rather than an error that
-- looks like a real failure.
CREATE TABLE IF NOT EXISTS public.circle_polls (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id           uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  thread_id           uuid     NULL REFERENCES public.conversations(id) ON DELETE SET NULL,
  question            text NOT NULL,
  options             jsonb NOT NULL,
  linked_event_id     uuid     NULL REFERENCES public.events(id) ON DELETE SET NULL,
  closes_at           timestamptz NULL,
  created_by_user_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT circle_polls_options_cardinality
    CHECK (jsonb_typeof(options) = 'array'
           AND jsonb_array_length(options) BETWEEN 2 AND 4)
);

COMMENT ON TABLE public.circle_polls IS
  'TDW_14 D-3 (C-4). Decision polls in the circle. thread_id NULL = a standalone poll (R-D3.5) — it renders at the circle bloom and the coplanner polls strip, never at a third surface. options is a 2-4 element jsonb array of {id,label,image_url?}; the cardinality is held by CHECK at the plane and the option-id membership in code at the one write path (src/api/circle/polls.js). created_by_user_id is a users.id for BOTH actor classes - the bride has one via couples.user_id - so no bride sentinel exists anywhere in this design.';


-- ── STATEMENT 2 · circle_poll_votes ──────────────────────────── paste alone ──
-- THE PRIMARY KEY IS THE FEATURE. "One vote per participant (bride included)"
-- is the spec's sentence; here it is a constraint, so a double-vote is refused
-- by Postgres and not merely by a handler that could be bypassed or rewritten.
CREATE TABLE IF NOT EXISTS public.circle_poll_votes (
  poll_id        uuid NOT NULL REFERENCES public.circle_polls(id) ON DELETE CASCADE,
  voter_user_id  uuid NOT NULL REFERENCES public.users(id)        ON DELETE CASCADE,
  option_id      text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, voter_user_id)
);

COMMENT ON TABLE public.circle_poll_votes IS
  'TDW_14 D-3 (C-4). PK (poll_id, voter_user_id) IS the one-vote-per-participant rule, enforced at the plane. voter_user_id is a users.id for the bride and every member alike (R-D3.2). Keying on users.id rather than circle_members.id means a member removed and re-invited KEEPS her vote - same person, same poll - which is the founder-recommended semantic and is recorded here because the alternative is invisible once chosen.';


-- ── STATEMENT 3 · the read indexes ───────────────────────────── paste alone ──
-- Both reads this feature performs, and no others: polls for a couple (newest
-- first, the list), and votes for a poll (the tally). The PK already covers
-- (poll_id, voter_user_id) lookups, so no third index is created for a query
-- nobody makes.
--
-- THESE ARE NOT THE PARKED PAIR. CE-125's and F-07.112's R-b partial unique
-- indexes sit on `conversations`, are sequenced "together or not at all", and
-- remain untouched by this migration in every form — not as SQL, not as comment,
-- not commented-out. Named because a delivery that adds indexes near that lane
-- must not be misread as an unparking.
CREATE INDEX IF NOT EXISTS circle_polls_couple_created_idx
  ON public.circle_polls (couple_id, created_at DESC);

CREATE INDEX IF NOT EXISTS circle_poll_votes_poll_idx
  ON public.circle_poll_votes (poll_id);


-- ══════════════════════════════════════════════════════════════════════════
-- VERIFY — EACH BLOCK PASTED ALONE. The editor renders only the last statement
-- of a batch (F-OB.6's tuition), so a block run beside another is a block whose
-- result you did not see.
-- ══════════════════════════════════════════════════════════════════════════

-- ── BLOCK 1 · BOTH TABLES AND THEIR SHAPE ───────────────────── paste alone ──
-- EXPECT EXACTLY 13 ROWS — 9 for circle_polls, 4 for circle_poll_votes — with
-- circle_polls.thread_id / linked_event_id / closes_at nullable ('YES') and
-- every other column 'NO'.
SELECT table_name, ordinal_position, column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name IN ('circle_polls', 'circle_poll_votes')
 ORDER BY table_name, ordinal_position;

-- ── BLOCK 2 · THE CONSTRAINTS, READ OUT OF THE CATALOGUE ────── paste alone ──
-- The block row-inference cannot substitute for: on empty tables every row
-- passes every CHECK, so only the catalogue can say the rules exist.
-- EXPECT 9 ROWS: 2 PRIMARY KEY · 6 FOREIGN KEY · 1 CHECK.
-- The CHECK's def renders as `jsonb_array_length(options) >= 2 AND <= 4` —
-- Postgres normalises BETWEEN, so the catalogue's grammar differs from this
-- file's while the predicate is identical; that is expected, not a drift.
-- circle_poll_votes_pkey must read `PRIMARY KEY (poll_id, voter_user_id)`.
SELECT conrelid::regclass AS tbl, conname, contype, pg_get_constraintdef(oid) AS def
  FROM pg_constraint
 WHERE conrelid IN ('public.circle_polls'::regclass, 'public.circle_poll_votes'::regclass)
 ORDER BY 1, 3, 2;

-- ── BLOCK 3 · THE INDEXES ───────────────────────────────────── paste alone ──
-- EXPECT 4 ROWS: the two PK indexes plus the two created above.
SELECT tablename, indexname, indexdef
  FROM pg_indexes
 WHERE schemaname = 'public'
   AND tablename IN ('circle_polls', 'circle_poll_votes')
 ORDER BY 1, 2;

-- ── BLOCK 4 · NOTHING WAS DISTURBED ─────────────────────────── paste alone ──
-- The claim this migration makes about the rest of production, checked rather
-- than asserted. Two brand-new empty tables should change nothing else.
-- EXPECT: polls 0, votes 0, and circle_members 14 columns (D-1's width, unmoved).
SELECT (SELECT count(*) FROM public.circle_polls)                     AS polls,
       (SELECT count(*) FROM public.circle_poll_votes)                AS votes,
       (SELECT count(*) FROM information_schema.columns
         WHERE table_schema='public' AND table_name='circle_members') AS circle_members_columns;
