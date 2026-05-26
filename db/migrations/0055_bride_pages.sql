-- 0055_bride_pages.sql
-- The diary surface. Every Pages entry is a row in this table.
--
-- The bride writes one or more entries per day. Mood is one of 12 locked
-- values from the bride's interior weather palette (matches FROST_COPY
-- mood vocabulary). Body is plain text. Created_at is canonical timestamp;
-- entry_date is the "wedding-arc day" she wrote on (date-only, used for
-- grouping and for the daily teal idle line).
--
-- DreamAi reads from this table via the read_pages tool to ground the AI
-- in the bride's emotional weather across days. The Sanctuary V Pages
-- row reads the most-recent body to render the preview.

create table if not exists bride_pages (
  id           uuid          primary key default gen_random_uuid(),
  couple_id    uuid          not null references couples(id) on delete cascade,
  user_id      uuid          not null references users(id)   on delete cascade,
  entry_date   date          not null default current_date,
  mood         text          not null,
  mood_color   text          not null,
  body         text          not null,
  created_at   timestamptz   not null default now(),
  updated_at   timestamptz   not null default now()
);

-- Lookups by couple, newest first (Sanctuary preview + history list).
create index if not exists idx_bride_pages_couple_created
  on bride_pages (couple_id, created_at desc);

-- For DreamAi "what did she write on day X" queries.
create index if not exists idx_bride_pages_couple_entry_date
  on bride_pages (couple_id, entry_date desc);
