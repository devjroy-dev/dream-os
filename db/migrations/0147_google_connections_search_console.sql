-- db/migrations/0147_google_connections_search_console.sql
-- TDW · BLOCK 19 · G3.1 sitting 2 — YOUR WEBSITE & SEO (R-40.122 / R-40.123).
--
-- Append-only, founder-run, idempotent. Ladder tip before this file: 0146
-- (G3.2 s3's data rename), derived by `ls db/migrations/*.sql | sort | tail` at
-- the cut (dream-os 52f0b2f), not recalled. This sits AT the tip, so it takes
-- NO record in OUT_OF_ORDER.json. Number allocated by the chair (R-40.44) at the
-- R-40.123 relay.
--
-- FOUR STATEMENTS, FOUR CONSTRAINT SECTIONS (R-40.27):
--   1 · public.vendor_google_connections — the grant. Mirrors 0103's
--       vendor_ig_connections shape (one row per vendor, UNIQUE(vendor_id),
--       pending state nonce for the single-use OAuth state). The refresh token is
--       stored ENCRYPTED under INTEGRATION_TOKEN_KEY (spec §8, env.js:52) — the
--       column holds ciphertext, never the token, and no door selects it into a
--       response (googleConnection.js SAFE_COLUMNS).
--   2 · public.search_console_daily — one row per vendor per day: how many times
--       her page was shown and opened. Spec §5 P3 names this table; the room's
--       two windows (R-40.123: `the last 28 days` and `the 28 before`) are SUMS
--       over it, never stored — a stored total drifts, a summed one cannot.
--   3 · public.search_console_queries — what people typed, per vendor per pull
--       window. Five rows are read; more may be stored.
--   4 · vendors.seo_title / seo_description — what Google shows (prototype
--       W3-google). NULL means "derive from the profile" (vendorCard.js does),
--       so an untouched vendor loses nothing. CHECKed at Google's own display
--       limits so a byte that would be truncated on the wire cannot be saved.
--
-- F-40.261 ruled (a): THE HOUSE ROW. `vendor_id` is NULLABLE, and exactly one
-- row may carry NULL — the founder's own grant of dev@thedreamwedding.in, owner
-- of `sc-domain:thedreamwedding.in`. `pull()` reads every vendor's /v/ page
-- through that row with `page contains /v/<handle>`; a vendor's own row serves
-- P2's own domain only. The partial unique index is what makes "one house row"
-- a fact the database holds rather than a rule the code remembers.
--
-- FOUR PASTES, ONE STATEMENT EACH (R-40.31). Column notes live in this header,
-- not in COMMENT ON statements, so each paste is one statement:
--   vendor_google_connections.refresh_token_enc — AES-256-GCM ciphertext
--     (tokenVault.js) under INTEGRATION_TOKEN_KEY; never plaintext; no door
--     selects it outward (googleConnection.js SAFE_COLUMNS).
--   vendors.seo_title — NULL = "<name> · <category> · <city>" at the card door.
--   vendors.seo_description — NULL = first 200 chars of `about` at the card door.
--
-- ⚠ NO ROW IN THIS FILE IS A NUMBER A VENDOR SEES. Rows arrive from the pull.

-- ── 1 · THE GRANT ─────────────────────────────────────────────────────────────
-- CONSTRAINTS (this statement): vendor_google_connections_pkey PRIMARY KEY (id);
-- vendor_google_connections_vendor_id_key UNIQUE (vendor_id) — NULLs distinct,
-- so the house row does not collide with it; vendor_google_connections_vendor_id_fkey
-- FOREIGN KEY (vendor_id) → vendors(id) ON DELETE CASCADE. The house row's
-- one-ness is paste 4's partial unique index.
create table if not exists public.vendor_google_connections (
  id                    uuid primary key default gen_random_uuid(),
  vendor_id             uuid unique references public.vendors(id) on delete cascade,   -- NULL = the house row (F-40.261)

  google_sub            text,                       -- Google's stable account id (OIDC `sub`)
  google_email          text,                       -- shown back to her as "connected as …"
  scope                 text,                       -- the scope string Google actually granted

  refresh_token_enc     text,                       -- AES-256-GCM ciphertext (tokenVault.js), NEVER plaintext
  connected_at          timestamptz,
  last_synced_at        timestamptz,

  sc_property           text,                       -- the Search Console property this grant reads (house: sc-domain, F-40.261)

  pending_state_nonce   text,
  pending_state_at      timestamptz,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── 2 · THE DAILY ROWS ────────────────────────────────────────────────────────
-- CONSTRAINTS (this statement): search_console_daily_pkey PRIMARY KEY
-- (vendor_id, day); search_console_daily_vendor_id_fkey FOREIGN KEY (vendor_id)
-- → vendors(id) ON DELETE CASCADE; search_console_daily_impressions_check
-- CHECK (impressions >= 0); search_console_daily_clicks_check CHECK (clicks >= 0).
create table if not exists public.search_console_daily (
  vendor_id     uuid not null references public.vendors(id) on delete cascade,
  day           date not null,
  impressions   integer not null default 0 check (impressions >= 0),
  clicks        integer not null default 0 check (clicks >= 0),
  pulled_at     timestamptz not null default now(),
  primary key (vendor_id, day)
);

-- ── 3 · WHAT PEOPLE TYPED ─────────────────────────────────────────────────────
-- CONSTRAINTS (this statement): search_console_queries_pkey PRIMARY KEY
-- (vendor_id, window_end, query); search_console_queries_vendor_id_fkey FOREIGN
-- KEY (vendor_id) → vendors(id) ON DELETE CASCADE;
-- search_console_queries_impressions_check CHECK (impressions >= 0);
-- search_console_queries_clicks_check CHECK (clicks >= 0).
create table if not exists public.search_console_queries (
  vendor_id     uuid not null references public.vendors(id) on delete cascade,
  window_end    date not null,                     -- last day of the 28-day window the row describes
  query         text not null,
  impressions   integer not null default 0 check (impressions >= 0),
  clicks        integer not null default 0 check (clicks >= 0),
  pulled_at     timestamptz not null default now(),
  primary key (vendor_id, window_end, query)
);


-- ── 4 · WHAT GOOGLE SHOWS, AND THE HOUSE ROW'S ONE-NESS ─────────────────────
-- CONSTRAINTS (this statement): vendors_seo_title_len_check CHECK (seo_title is
-- null or char_length(seo_title) between 1 and 70);
-- vendors_seo_description_len_check CHECK (seo_description is null or
-- char_length(seo_description) between 1 and 200);
-- vendor_google_connections_house_key UNIQUE INDEX on ((vendor_id is null))
-- WHERE vendor_id is null — at most one row with a NULL vendor_id (F-40.261).
-- One DO block so the paste is one statement (R-40.31); every step is
-- idempotent so a re-run is a no-op.
do $$
begin
  alter table public.vendors add column if not exists seo_title       text;
  alter table public.vendors add column if not exists seo_description text;
  if not exists (select 1 from pg_constraint where conname = 'vendors_seo_title_len_check') then
    alter table public.vendors add constraint vendors_seo_title_len_check
      check (seo_title is null or char_length(seo_title) between 1 and 70);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'vendors_seo_description_len_check') then
    alter table public.vendors add constraint vendors_seo_description_len_check
      check (seo_description is null or char_length(seo_description) between 1 and 200);
  end if;
  if not exists (select 1 from pg_indexes where indexname = 'vendor_google_connections_house_key') then
    create unique index vendor_google_connections_house_key
      on public.vendor_google_connections ((vendor_id is null)) where vendor_id is null;
  end if;
end $$;
