-- db/migrations/0129_agents_user_id_unique.sql
-- R-36.5 F1 · the arbiter engine.agents has never had. Ruled CE-225. Founder-run.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- AT THE LADDER TIP. NO REGISTER ROW, AND THAT IS DERIVED, NOT ASSUMED.
-- ═════════════════════════════════════════════════════════════════════════════
-- The applied tip is 0128; this is 0129, the next number. A record in
-- db/migrations/OUT_OF_ORDER.json would ABORT the formatter, which refuses any
-- record whose number is not BELOW the tip — that is what out-of-order MEANS
-- (that file's own _README). 0128's header derives this identically; this file
-- re-derived it rather than inheriting it.
--
-- SCHEMA PLANE: engine, NOT public. ENGINE_SCHEMA.md's own header states that
-- engine-plane constraints have NEVER been witnessed anywhere (F-SW.1) — so the
-- absence of a UNIQUE on agents(user_id) is not read off that document. It is
-- proven by the estate itself: eleven duplicate (user_id) pairs existed on
-- 2026-08-23 (CE-224). A unique index cannot coexist with eleven duplicate
-- pairs, so the census IS the existence proof of the gap this file closes.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ⚠ PRECONDITION — NAMED, BECAUSE THIS FILE FAILS LOUDLY WITHOUT IT
-- ═════════════════════════════════════════════════════════════════════════════
-- CREATE UNIQUE INDEX ABORTS ON A DUPLICATED ESTATE. It does not repair, it does
-- not skip; it errors and rolls back the whole block.
--
-- The repair already ran. R-36.4 / CE-224: the founder executed the dedupe SQL
-- and his own witness query returned `0 · 0` — zero duplicate user_ids, zero
-- orphaned agent_owner rows. THAT WITNESS IS THIS FILE'S PRECONDITION, named
-- here so a future reader knows the order and does not run this against a fresh
-- duplication.
--
-- IF THIS BLOCK ERRORS with "could not create unique index", the estate has
-- re-duplicated since that witness — which would mean the race fired again
-- between the dedupe and this run. DO NOT force it. Re-run the CE-224 census,
-- dedupe again, then return here. The error is the guard working.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- WHY AN INDEX AND NOT A TABLE CONSTRAINT
-- ═════════════════════════════════════════════════════════════════════════════
-- supabase-js `.upsert(..., { onConflict: 'user_id' })` compiles to PostgREST's
-- `on_conflict=user_id`, which becomes `ON CONFLICT (user_id)`. That is an
-- INFERENCE clause, and Postgres resolves an inference clause against a UNIQUE
-- INDEX. A unique index satisfies it; so would a UNIQUE constraint (which is a
-- unique index underneath). The index is the smaller statement and the one the
-- inference names directly, so it is what this file creates.
--
-- NOT CONCURRENTLY, deliberately: CREATE INDEX CONCURRENTLY cannot run inside a
-- transaction block, and this table is small enough that the brief write lock is
-- cheaper than giving up the BEGIN/COMMIT wrapper. A CONCURRENTLY build that
-- fails leaves an INVALID index behind that still blocks nothing while looking
-- present — the worst shape for an arbiter the application code now depends on.
--
-- ⚠ APPLY ORDER IS LAW FOR THIS DELIVERY (R-36.5, chair):
--   THIS FILE RUNS BEFORE THE CODE DEPLOYS. `onConflict: 'user_id'` has no
--   arbiter until this index exists, and Postgres ERRORS on an inference clause
--   that matches no index. Deploying the code first would convert the silent
--   duplicate into a loud failure on every first touch — trading the disease for
--   a worse one. Founder steps are numbered in the handover.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS agents_user_id_unique
  ON engine.agents USING btree (user_id);

COMMIT;

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFY. TWO BLOCKS, EACH ITS OWN PASTE.
-- 0123's law: the editor renders only the last statement's result set, so a
-- batched verify is not a verify.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── BLOCK 1 · THE INDEX EXISTS AND IS UNIQUE ──────────────────── paste alone ───
-- Expect exactly one row, and `indexdef` must contain the word UNIQUE. An index
-- row WITHOUT it means the uniqueness was lost between here and the database and
-- the arbiter is decorative — the upsert would then silently insert duplicates
-- again, which is the original disease wearing this file as a costume.
--
-- select indexname, indexdef
--   from pg_indexes
--  where schemaname = 'engine' and tablename = 'agents'
--    and indexname = 'agents_user_id_unique';

-- ── BLOCK 2 · THE ESTATE IS STILL SINGULAR ────────────────────── paste alone ───
-- THE ONE THAT PROVES THE PRECONDITION HELD. Expect ZERO rows. Any row here
-- means a duplicate survives, which also means BLOCK 1 returned nothing, because
-- the CREATE would have aborted. Run this second so its emptiness is read
-- against an index that already exists.
--
-- select user_id, count(*) as n
--   from engine.agents
--  group by user_id
-- having count(*) > 1;
