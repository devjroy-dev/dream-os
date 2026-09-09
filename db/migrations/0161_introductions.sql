-- ─────────────────────────────────────────────────────────────────────────────
-- 0161 · R9-J1 · INTRODUCTIONS — THE VENDOR'S OWN OUTBOUND, BUILT DARK
-- CE-42 seat E2, packet 4a. Cut at dream-os fd9d0da45d4020699a033047eb2821f223fe7de9.
-- Number ALLOCATED BY THE CHAIR (R-40.44 / LD-8), never claimed. Ladder tail derived
-- by command immediately before writing:
--   `ls db/migrations | grep -E '^[0-9]{4}' | sort | tail -1` → 0159.
--
-- 0160 LANDED FIRST AND THE LADDER IS CONTIGUOUS. The first cut of this file was
-- written at fd9d0da4, where 0160 did not yet exist, and it carried a paragraph
-- about the OUT_OF_ORDER.json record R8-1 would owe if 4a reached origin first.
-- R8-1 landed at 09317d6 with 0160_date_checks.sql, so that record is NOT owed and
-- the paragraph is struck rather than left to read as a live condition. Derived by
-- command at the re-cut: `ls db/migrations | grep -E '^[0-9]{4}' | sort | tail -1`
-- → 0160. A migration header that describes a contingency which did not happen is
-- a header a later reader has to disprove.
--
-- ── WHY ITS OWN TABLE ────────────────────────────────────────────────────────
-- An introduction is not a lead and not a forward. `leads` holds people who wrote
-- IN; this holds one message the estate sent OUT on a vendor's behalf, to someone
-- who has never contacted the WABA. The reply — if one comes — becomes a lead
-- through `createLead` (`source='introduction'`), which stays the sole writer for
-- that plane (roadmap §7). Two facts, two homes.
--
-- ── THE RECEIPT COLUMNS ARE 0148/0158's VOCABULARY, DELIBERATELY ─────────────
-- status/wamid/error_code/error_title/sent_at/updated_at, so the NINTH router arm
-- in src/lib/vendor/relayStatus.js is the eighth's shape with one table name
-- changed. A new vocabulary here would be a second dialect for one fact.
--
-- ── R-40.110, HONOURED IN THIS DELIVERY AND NOT THE NEXT ─────────────────────
-- The partial index, the partial UNIQUE and the router arm ship together. Three
-- tables (lead_alerts F-40.177, referral_alerts F-40.190, payment_reminders
-- F-40.229) each shipped a wamid with no arm and every receipt fell to `home=none`
-- until someone noticed. 0158 was the first not to. This is the second.
--
-- ── PROVENANCE (protocol §10, SQL-provenance law) ────────────────────────────
--   public.introductions  — a NEW table; its witness is this statement.
--   public.vendors(id)    — docs/db/PUBLIC_SCHEMA.md:1385 (column block, `1. id uuid
--                           NOT NULL default uuid_generate_v4()`), constraint
--                           `vendors_pkey PRIMARY KEY (id)` at :2402-2403.
--   vendors.routing_handle — :1399, `vendors_routing_handle_key UNIQUE
--                           (routing_handle)` at :2404-2405. It is what `page_code`
--                           copies and what /v/<code> resolves on
--                           (src/api/public/vendorCard.js:447, uppercased at lookup).
--   Snapshot ladder tip 0154; 0155-0159 do not touch public.vendors — derived by
--   command at fd9d0da4, so the snapshot is the settling witness for that column.
--
-- ── ONE DISCLOSED ADDITION TO THE CHAIR'S COLUMN LIST ────────────────────────
-- The ruling named: vendor, recipient phone, where met, page code, status, wamid,
-- error code, error title, timestamps. `recipient_name` is added because
-- docs/TEMPLATES.md §2 entry 13 makes {{1}} the recipient's name — the body opens
-- `Hi {{1}}, this is {{2}}` and cannot be built without it. Declared, not slipped in.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.introductions (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references public.vendors(id) on delete cascade,

  -- The person she met. NOT a prospect row and never one: the chair's Fork A
  -- ruling. `prospects.source` refuses 'introduction' by CHECK, `prospects.phone`
  -- is UNIQUE, and `prospects.state='opted_out'` is cross-line and terminal
  -- (src/lib/prospects.js:4) — so a stranger's STOP here would have silenced TDW's
  -- own marketing lane, and anyone who ever STOPped it would have silently refused
  -- her introduction. One register with two owners. Kept apart.
  recipient_phone text not null,
  recipient_name  text not null,            -- {{1}}; NOT NULL because the body opens with it

  -- R-41.11: names the place they met or it does not send. NOT NULL is that law
  -- made structural rather than left to a caller's discipline. {{3}}.
  where_met       text not null,

  -- The URL button's dynamic suffix — a COPY of vendors.routing_handle at send
  -- time, not a join. The message is a durable record of what a stranger received;
  -- if her handle is ever re-minted, this row must still say what the button said.
  page_code       text not null,

  -- 0158's set, plus the two states this lane has and that one does not:
  --   `staged`   — drafted and shown to her, awaiting the E3 affirmative
  --   `declined` — she said no; the row stays, because a decline is a fact
  -- `dark` is the switchboard's off state and is FILED, never skipped: the row is
  -- written before the gate refuses, so a walk never finds a send that left no
  -- trace (the notifyCoupleOfFound shape, src/lib/couple/assistance.js:685-706).
  status          text not null default 'staged'
                  check (status in ('staged','declined','queued','dark','sent','sent_no_wamid','delivered','read','failed')),

  wamid           text,
  error_code      text,
  error_title     text,
  approved_at     timestamptz,              -- when her affirmative named the recipient (E3)
  sent_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── R-41.11 MADE STRUCTURAL · NO SECOND INTRODUCTION, EVER ───────────────────
-- "no follow-up to an unanswered introduction" and "no cold numbers" are the two
-- halves of one law, and a convention cannot hold them: the vendor asks again next
-- month and nothing objects. A declined draft never reached anyone, so it does not
-- consume the one chance — hence the partial predicate.
-- ⚠ THE REFUSAL THIS INDEX ENFORCES HAS NO VETOED VENDOR-FACING SENTENCE. The arm
-- refuses first and returns a TYPED code (`ALREADY_INTRODUCED`) with a log line, so
-- the database never has to; but on her glass the refusal is silent. W-1 caps 4a's
-- soul radius at four strings and this is not one of them. NAMED IN THE HANDOVER,
-- owed from the chair. R-41.146 holds either way: the double refuses what the
-- database refuses.
create unique index if not exists uq_introductions_vendor_recipient
  on public.introductions (vendor_id, recipient_phone)
  where status <> 'declined';

-- R-40.110: the router matches by wamid, so it is UNIQUE where it exists and absent
-- where it does not. PARTIAL on both counts — a staged, declined or dark row has no
-- wamid, and a NULL is not a collision.
create index if not exists introductions_wamid_idx
  on public.introductions (wamid) where wamid is not null;
create unique index if not exists uq_introductions_wamid
  on public.introductions (wamid) where wamid is not null;

-- Her own list, newest first, without a sort over the whole table.
create index if not exists introductions_vendor_created_idx
  on public.introductions (vendor_id, created_at desc);

comment on table public.introductions is
  'R-41.11 / roadmap row J1: one message sent OUT on a vendor''s behalf to a person she met, on the marketing line until R9 gives her her own WABA. Not a lead and not a prospect — a reply becomes a lead through createLead (source=''introduction''), which stays the sole writer. Dark behind cap.on(''template.tdw_introduction''). Receipts land here through the ninth arm of src/lib/vendor/relayStatus.js. uq_introductions_vendor_recipient is R-41.11''s no-follow-up law made structural.';

comment on column public.introductions.page_code is
  'A COPY of vendors.routing_handle taken at send time, not a join: this row records what a stranger actually received, and a re-minted handle must not rewrite history. It is the URL button''s dynamic suffix — https://thedreamwedding.in/v/<page_code> — resolved by src/api/public/vendorCard.js:447, uppercased at lookup.';

comment on column public.introductions.where_met is
  'R-41.11: Introductions names the place they met or it does not send. NOT NULL is that law made structural.';
