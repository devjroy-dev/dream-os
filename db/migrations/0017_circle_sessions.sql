-- 0017_circle_sessions.sql
-- Session B2 Step 5+6: circle_sessions table for session-based summarization.
--
-- WHAT THIS ADDS
--   circle_sessions  — one row per circle-member-session-window.
--                      Opens on first message in a quiet period, closes after
--                      10 minutes of inactivity (derived, not stored).
--                      Tracks whether the bride has been summarized yet.
--   circle_activity.session_id — links each activity row back to the session
--                                that produced it. Enables session-scoped
--                                summary composition and list_muse filtering.
--
-- WHY SESSIONS
--   Mom sends 3 images + a note over 5 minutes. Bride should not get 4 separate
--   "Mom just added an image" notifications. Sessions batch Mom's activity into
--   one coherent burst. When the bride next messages, she sees one summary
--   covering the whole burst.
--
--   Session boundaries are activity-based: 10 min of silence ends a session.
--   No background cron — surfacing is triggered by the bride's next message
--   (synchronous check in brideIndex.js). PWA at Sessions 11-12 may add push
--   notifications via a real cron, but B2 ships without them.
--
-- DERIVED "ENDED" — no ended_at column
--   A session is "ended and pending summary" when:
--     last_activity_at < (now - 10 minutes) AND summarized_to_bride = false
--   This is intentionally derived rather than stored. Reasons:
--     1. No cron job is needed to flip an ended flag.
--     2. Late-arriving circle activity can re-open a window cleanly (we just
--        update last_activity_at; the session is "alive" again until 10 min pass).
--     3. The bride-side surfacing query is a simple WHERE clause.
--
-- LINK TO circle_activity
--   Every circle activity row gets a session_id. saveToMuse will accept the
--   session_id and pass it on the circle_activity insert. Bride-side activity
--   (her own saves, notes) has session_id = NULL — sessions are a circle concept.
--
-- IMMUTABILITY: never edit this file. Changes go in 0018+.

-- ── circle_sessions ─────────────────────────────────────────────────
create table if not exists circle_sessions (
  id                   uuid primary key default uuid_generate_v4(),
  couple_id            uuid not null references couples(id) on delete cascade,
  circle_member_id     uuid not null references circle_members(id) on delete cascade,
  started_at           timestamptz not null default now(),
  last_activity_at     timestamptz not null default now(),
  summarized_to_bride  boolean not null default false,
  summarized_at        timestamptz,
  summary_message_id   uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Member's open-session lookup: brideIndex needs to find the latest session
-- for a given circle member to decide "should we open a new session, or
-- bump the existing one?"
create index if not exists circle_sessions_member_activity_idx
  on circle_sessions(circle_member_id, last_activity_at desc);

-- Bride-side surfacing: find all couples sessions that have ended (10 min
-- inactive) and are still unsummarized. Partial index keeps this fast even
-- as old summarized sessions accumulate.
create index if not exists circle_sessions_couple_pending_idx
  on circle_sessions(couple_id, last_activity_at)
  where summarized_to_bride = false;

-- updated_at trigger
create trigger circle_sessions_set_updated_at
  before update on circle_sessions
  for each row execute function set_updated_at();

-- Realtime (PWA at 11-12 will subscribe for push notifications)
alter publication supabase_realtime add table circle_sessions;

-- ── circle_activity.session_id ───────────────────────────────────────
-- Add session_id to circle_activity so we can group all activity from one
-- session-burst together. ON DELETE SET NULL because we don't want to lose
-- the activity row if a session is somehow deleted later (e.g. data cleanup).
-- Bride-side activity rows have session_id = NULL by design.
alter table circle_activity
  add column if not exists session_id uuid references circle_sessions(id) on delete set null;

-- Session-scoped activity lookup: when composing a summary, we need all
-- activity rows for one session in chronological order. Partial index
-- excludes the null-session bride-side rows.
create index if not exists circle_activity_session_chrono_idx
  on circle_activity(session_id, created_at)
  where session_id is not null;
