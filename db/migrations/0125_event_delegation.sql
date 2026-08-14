-- 0125_event_delegation.sql
-- TDW_14 · D-4 · C-5 — THE BRIDE DELEGATES A JOURNEY ITEM TO A CIRCLE SEAT.
-- Supabase project: nvzkbagqxbysoeszxent (Mumbai)  ·  plane: PUBLIC
-- Applied: 2026-08-14 — founder-run, Supabase SQL editor, PRODUCTION
--          (nvzkbagqxbysoeszxent / main). Both statements and all four verify
--          blocks witnessed green and pasted back:
--            V1  assigned_circle_member_id · uuid · YES · no default
--            V2  events_assigned_circle_member_id_fkey —
--                FOREIGN KEY (assigned_circle_member_id)
--                REFERENCES circle_members(id) ON DELETE SET NULL
--                THE RULING, in the catalogue's own words.
--            V3  events = 18 columns (was 17)
--            V4  assigned 0 · vendor_crewed 6 · circle_members 14
--
--          V4's MIDDLE FIGURE IS THE ONE TO KEEP. Six live rows carry crew in
--          `assigned_member_ids` and ZERO carry a circle seat: the two
--          id-spaces sharing one table and touching nothing of each other's.
--          R-D4.2's claim, witnessed in production rather than argued.
--
--          THE FIRST RUN OF THE VERIFY FOUND NOTHING, and that is worth
--          recording. Block 2 returned 0 rows because statement 1 had not been
--          run — a catalogue read cannot be fooled by an empty table the way a
--          row count can, so the gap announced itself instead of hiding.
--
--          This line is filled by the executor, not the founder (0098's
--          tuition: the session that opened a migration by hand to type a date
--          received a pasted shell command and the file was lost).
--
-- ── THE ADDRESS IS 0125, IN ORDER ──────────────────────────────────────────
-- Ladder tip 0124, this is 0125: the natural next. F-SW.3's out-of-order rule
-- DOES NOT APPLY and this migration owes the schema doc's staleness header NO
-- line — the arithmetic check ("newer than the ladder tip") sees it correctly.
-- Stated because 0098 landed out of order and made the exception look habitual.
--
-- ── WHY THIS COLUMN AND NOT THE ONE ALREADY THERE ─────────────────────────
-- `public.events` ALREADY carries an assignee: `assigned_member_ids uuid[] NOT
-- NULL default '{}'`, GIN-indexed, 04.5-era. IT IS NOT THIS COLUMN AND MUST NOT
-- BE REUSED. Its id-space is `team_members.id` and it is VENDOR-PLANE WHOLE —
-- twelve consumers, every one vendor-side (crew.js calls it the source of truth
-- for crew in its own header; vendor/events.js refuses non-team-member ids in
-- its own words; eventWrite, occupancy, crewSnapshot, calendarSignals, roster,
-- day, bands, studio/payments, Victor's write path, recordPrimitives) and ZERO
-- readers under couple/, circle/ or brideTools.
--
-- A circle member's id in that array would be readable by every crew
-- `.contains` query in the estate: a wedding guest surfacing inside a vendor's
-- crew roster. That is the mixed-key disease D-3's voter key refused, and it is
-- the whole reason this is a NEW column rather than a reuse.
--
-- TWO ASSIGNEE CONCEPTS NOW LIVE ON ONE TABLE. That is a real cost, ruled
-- acceptable at CE-34 because the alternative — one column serving two id-spaces
-- — is worse. The names are deliberately unmistakable and no code may ever read
-- one where it means the other.
--
-- ── SEAT, NOT PERSON: WHY `circle_members.id` AND `ON DELETE SET NULL` ─────
-- The voter key went the other way on purpose (`voter_user_id`, so a re-invited
-- member KEEPS her vote — same person, same poll). This is the opposite ruling
-- for a different reason, and the difference is the point:
--
--   A VOTE is a person's OPINION. It survives her membership because it was
--   never about her seat.
--   A DELEGATION is a RESPONSIBILITY held by a SEAT in the circle. When the
--   bride removes someone, that responsibility must come back to her VISIBLY —
--   not linger attached to a person no longer in the room.
--
-- `ON DELETE SET NULL` is that ruling in the schema: removal returns the task to
-- the pool where she can see it, never a ghost assignment pointing at a deleted
-- row. A CASCADE would have deleted her EVENT, which is catastrophic and wrong —
-- the event is hers, the assignment is merely a fact about it.
--
-- ── SQL-PROVENANCE (protocol §10, absolute) ───────────────────────────────
-- Witnessed at `docs/db/PUBLIC_SCHEMA.md` (snapshot 2026-08-13, ladder tip 0123
-- + 0098 + 0124): `public.events` 17 columns (doc :482) · FK target
-- `circle_members(id)` = `circle_members_pkey` (doc :1218). Read out of the doc
-- before authoring, never from memory.
--
-- ── NO INDEX, AND THE REASON IS STATED ────────────────────────────────────
-- Considered and REFUSED. Every read of this column is already scoped by
-- `couple_id` first (the couple plane's five doors) or by the member's proven
-- couple (the new Class B door), so the planner reaches a handful of rows before
-- this column is consulted at all. An index here would serve no query the estate
-- makes. If a "everything assigned to this member across couples" read is ever
-- wanted, it arrives WITH its index and this paragraph is its evidence.

-- ── STATEMENT 1 · THE COLUMN ─────────────────────────────────── paste alone ──
-- IF NOT EXISTS makes this re-runnable: the editor renders only the LAST
-- statement of a batch, so a founder who cannot see this result may reasonably
-- run it twice and the second run must be a no-op, not an error that looks like
-- a real failure.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS assigned_circle_member_id uuid NULL
    REFERENCES public.circle_members(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.events.assigned_circle_member_id IS
  'TDW_14 D-4 (C-5). The circle SEAT a journey item is delegated to. NOT assigned_member_ids: that array is team_members.id, vendor-plane, twelve vendor consumers and zero couple-side readers, and a circle member id in it would surface a wedding guest inside a vendor crew roster. ON DELETE SET NULL because a delegation belongs to a seat, not a person: removing a member returns the task to the bride visibly rather than leaving a ghost. Deliberately opposite circle_poll_votes.voter_user_id, which keys on the person so a re-invited member keeps her vote.';


-- ══════════════════════════════════════════════════════════════════════════
-- VERIFY — EACH BLOCK PASTED ALONE. The editor renders only the last statement
-- of a batch (F-OB.6's tuition), so a block run beside another is a block whose
-- result you did not see.
-- ══════════════════════════════════════════════════════════════════════════

-- ── BLOCK 1 · THE COLUMN, READ OUT OF THE CATALOGUE ────────── paste alone ──
-- Row-inference cannot substitute: every existing row will read NULL whether the
-- column is nullable-with-an-FK or something else entirely.
-- EXPECT EXACTLY 1 ROW: assigned_circle_member_id · uuid · YES · (no default)
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'events'
   AND column_name  = 'assigned_circle_member_id';

-- ── BLOCK 2 · THE FOREIGN KEY AND ITS DELETE RULE ──────────── paste alone ──
-- THE BLOCK THAT MATTERS. The ruling is not "a column exists", it is "removal
-- returns the task to the pool" — and that lives entirely in the delete rule.
-- EXPECT 1 ROW whose def reads exactly:
--   FOREIGN KEY (assigned_circle_member_id) REFERENCES circle_members(id) ON DELETE SET NULL
-- A def ending in CASCADE would mean removing a member DELETES HER EVENTS.
SELECT conname, pg_get_constraintdef(oid) AS def
  FROM pg_constraint
 WHERE conrelid = 'public.events'::regclass
   AND conname LIKE '%assigned_circle_member%';

-- ── BLOCK 3 · THE TABLE'S NEW WIDTH ────────────────────────── paste alone ──
-- The witnessed snapshot says events is SEVENTEEN columns
-- (docs/db/PUBLIC_SCHEMA.md:482). EXPECT 18. A 17 means statement 1 did not
-- land; a 19 means something else reached this table and the doc is stale for a
-- second reason.
SELECT count(*) AS events_columns
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'events';

-- ── BLOCK 4 · NOTHING WAS DISTURBED ────────────────────────── paste alone ──
-- The claim this migration makes about production, checked rather than asserted.
-- A new nullable column should change nothing that exists.
-- EXPECT: assigned = 0 (nothing is delegated yet) and the other two unmoved —
-- the vendor array still on every row, circle_members still 14 wide from D-1.
SELECT (SELECT count(*) FROM public.events
          WHERE assigned_circle_member_id IS NOT NULL)          AS assigned,
       (SELECT count(*) FROM public.events
          WHERE assigned_member_ids <> '{}'::uuid[])            AS vendor_crewed,
       (SELECT count(*) FROM information_schema.columns
          WHERE table_schema='public' AND table_name='circle_members') AS circle_members_columns;
