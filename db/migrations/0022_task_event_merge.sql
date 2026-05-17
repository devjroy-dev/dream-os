-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0022: task → event merge
--
-- CONTEXT
-- B3 phone test revealed that having two separate surfaces (couple_tasks and
-- events) confused both the agent and the bride. "Call Chevron at 2pm Tuesday"
-- was created as an event; "what's on my to-do list" queried tasks and returned
-- nothing. The product decision (2026-05-17): everything is a calendar event.
-- The words "to-do", "reminder", "task", and "calendar" are interchangeable.
-- All entries live in events. list_events answers everything.
--
-- WHAT THIS MIGRATION DOES
-- 1. Copies all couple_tasks rows into events:
--      title       → title
--      due_date    → event_date (if null: today IST, so the row surfaces
--                    immediately rather than being lost to history)
--      status      → state ('pending' → 'upcoming', 'done' → 'done')
--      couple_id   → couple_id
--      notes       → notes
--      created_at  → created_at
--      kind        = 'reminder' (all migrated tasks become reminder-kind events)
--      event_time  = null (tasks had no time component)
-- 2. Empties couple_tasks (DELETE all rows). Table stays in schema — no DROP.
--    Keeps migration history clean; the table is simply retired in place.
--
-- COLUMNS DROPPED IN TRANSLATION
--      priority    — dropped at migration 0020. Already gone.
--      event_name  — no equivalent column on events. Context lived in title
--                    or notes; those are preserved.
--
-- NULL due_date HANDLING
-- couple_tasks.due_date is nullable (tasks without a deadline). events.event_date
-- is NOT NULL. For tasks with null due_date: set event_date to today IST using
-- (now() at time zone 'Asia/Kolkata')::date. These become "due today" and
-- surface immediately in list_events — bride can reschedule or delete them.
--
-- IDEMPOTENCY
-- The copy uses INSERT … ON CONFLICT DO NOTHING with events.id = couple_tasks.id
-- so re-running the migration is safe. The DELETE at step 2 is also safe to
-- re-run (deletes 0 rows if already empty).
--
-- IMMUTABILITY: never edit this file. Changes go in 0023+.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Step 1: copy couple_tasks → events ───────────────────────────────────────
insert into events (
  id,
  couple_id,
  title,
  event_date,
  event_time,
  kind,
  state,
  notes,
  created_at,
  updated_at
)
select
  ct.id,
  ct.couple_id,
  ct.title,
  -- null due_date → today IST so the row is immediately visible
  coalesce(ct.due_date, (now() at time zone 'Asia/Kolkata')::date),
  null::time,                        -- tasks had no time component
  'reminder',                        -- all migrated tasks become reminder-kind
  case ct.status
    when 'pending' then 'upcoming'
    when 'done'    then 'done'
    else                'upcoming'   -- defensive default
  end,
  ct.notes,
  ct.created_at,
  now()
from couple_tasks ct
on conflict (id) do nothing;        -- idempotent: re-run is safe

-- ── Step 2: empty couple_tasks ────────────────────────────────────────────────
-- Table is retired in place. No DROP — keeps migration history clean.
-- The 5 task tools (create_task, list_tasks, complete_task, update_task,
-- delete_task) remain in the DB schema as deprecated stubs. Their tool
-- descriptions in brideTools.js are already marked DEPRECATED — do not call.
delete from couple_tasks;

-- ── Verification (informational — runs without error either way) ──────────────
do $$
declare
  tasks_remaining int;
  events_added    int;
begin
  select count(*) into tasks_remaining from couple_tasks;
  if tasks_remaining > 0 then
    raise warning '0022: couple_tasks still has % rows after DELETE — check for FK constraints blocking deletion', tasks_remaining;
  else
    raise notice '0022: couple_tasks is empty. Migration complete.';
  end if;
end $$;
