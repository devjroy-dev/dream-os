-- ─────────────────────────────────────────────────────────────────────────────
-- 0158 · BLOCK 20 · CONCIERGE s2 · R-41.4(b)/(c) — THE "WE FOUND YOU" RECEIPTS
-- CE-41 seat D, D3b. Cut at dream-os b66b99b3d1293708d6a046f8538c6b2d9932865f.
-- Ladder tail derived by command immediately before allocation:
--   `ls db/migrations | grep -E '^[0-9]{4}' | sort | tail -1` → 0157.
--
-- ── WHY ITS OWN TABLE, AND NOT A SECOND WAMID ON assistance_forwards ─────────
-- 0150's own comment anticipated this: "this row will one day carry the
-- couple-facing 'we found you' send too… two sends on one row need two named
-- homes." That day is now. The forward's wamid belongs to the message sent to
-- THE VENDOR OR THE OUTSIDER; this one belongs to the message sent to THE COUPLE
-- about that forward. Same event, two directions, two recipients — and a single
-- wamid column cannot hold both without one send silently overwriting the other's
-- receipt. R-40.110's partial UNIQUE would then be actively harmful: it would make
-- the collision look like a correctly-matched row.
--
-- ── ONE EVENT, ONE ROW (the chair's ruling) ──────────────────────────────────
-- Keyed on forward_id, because the notice fires PER FORWARD, not per request: a
-- couple whose photography item reaches three vendors is told three times, once
-- each. `uq_assistance_found_notices_forward` makes that structural rather than a
-- convention, so a double-send is a constraint violation and not a second row the
-- couple never sees.
--
-- ── THE RECEIPT COLUMNS ARE 0148's OWN VOCABULARY ────────────────────────────
-- status/error_code/error_title/sent_at/updated_at, so the eighth router arm in
-- src/lib/vendor/relayStatus.js is the seventh's shape with one table name
-- changed. A new vocabulary here would have been a second dialect for one fact.
--
-- PROVENANCE: assistance_forwards ← db/migrations/0148_assistance_requests.sql
-- (id uuid PK). Read by command at the cut, not recalled.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.assistance_found_notices (
  id           uuid primary key default gen_random_uuid(),
  forward_id   uuid not null references public.assistance_forwards(id) on delete cascade,
  -- Which arm spoke: the TDW-vendor notice or the outsider notice. Constrained,
  -- for 0156's reason — an unbounded kind string is how a fifth arm appears
  -- without anyone deciding it should.
  kind         text not null check (kind in ('found_vendor', 'found_outside')),
  wamid        text,
  status       text not null default 'queued'
               check (status in ('queued', 'dark', 'sent', 'sent_no_wamid', 'delivered', 'read', 'failed')),
  error_code   text,
  error_title  text,
  sent_at      timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ONE NOTICE PER FORWARD. The couple is told once about each vendor found for her.
create unique index if not exists uq_assistance_found_notices_forward
  on public.assistance_found_notices (forward_id);

-- R-40.110: the router matches by wamid, so it must be UNIQUE where it exists and
-- absent where it does not. PARTIAL on both counts — a dark or queued notice has
-- no wamid, and a NULL is not a collision.
create index if not exists assistance_found_notices_wamid_idx
  on public.assistance_found_notices (wamid) where wamid is not null;
create unique index if not exists uq_assistance_found_notices_wamid
  on public.assistance_found_notices (wamid) where wamid is not null;

comment on table public.assistance_found_notices is
  'R-41.4(b)/(c): the couple-facing "we found you" send, one row per assistance_forwards row. Its own table because the forward''s own wamid belongs to the message sent TO the vendor or outsider; this one belongs to the message sent to HER about it (0150 named the need). Receipts land here through the eighth arm of src/lib/vendor/relayStatus.js.';
