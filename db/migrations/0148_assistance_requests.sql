-- ═══════════════════════════════════════════════════════════════════════════
-- 0148 · BLOCK 20 · CONCIERGE s1 — the assistance plane (three tables, one writer)
-- CE-41 seat A, packet A2. Cut at dream-os 57d12d493e1719feb95b3186c9d9ec0a6ce84f29.
-- Ladder tail derived: `ls db/migrations | grep -E '^[0-9]{4}' | sort | tail -1`
-- → 0147 (c-41.3). This file is 0148. New tables only; no existing table moves.
--
-- ⚠ SOLE-WRITER NOTE (one-home law). Every INSERT into these three tables is
-- authored in ONE file: src/lib/couple/assistance.js —
--   createAssistanceRequest()  writes assistance_requests + assistance_request_items
--   forwardAssistanceItem()    writes assistance_forwards (and bumps forwarded_count)
--   recordForwardOutcome()     updates assistance_forwards.status/error_* (R-41.30)
-- The receipt router (src/lib/vendor/relayStatus.js, witnessStatusMatch) UPDATES
-- assistance_forwards by wamid and nothing else. The three doors (bride, admin,
-- the s2 public link) CALL the writer; none of them names these tables.
-- A bench asserts `.from('assistance_` appears in the writer, relayStatus and
-- nowhere else in src/.
--
-- PROVENANCE (SQL-provenance law, §10). Every FK target is witnessed at the
-- 0138 snapshot, docs/db/PUBLIC_SCHEMA.md (2026-09-06):
--   couples.id    :399  `1. id uuid NOT NULL default uuid_generate_v4()` · :1576-:1577 couples_pkey PRIMARY KEY (id)
--   vendors.id    :1201 · :2082-:2083 vendors_pkey PRIMARY KEY (id)
--   prospects.id  :921  · :1902 prospects_pkey PRIMARY KEY (id)
--   leads.id      :724  · :1772 leads_pkey PRIMARY KEY (id)
-- No column of an existing table is read by this file.
--
-- RULINGS THIS FILE EXECUTES:
--   R-41.15  assistance_forwards carries wamid + status/updated_at/error_code/error_title
--            on 0142's shape, with the partial INDEX and partial UNIQUE (R-40.110 in full).
--   R-41.23  assistance_requests.status is a CHECK: open | forwarded | closed.
--   R-41.29  couple_id uuid NULL (FK couples) · phone text NOT NULL (last ten digits,
--            the one home normalizePhone in the writer) · name text NULL. The bride
--            door fills couple_id + phone from the session; the admin door writes
--            phone + name; seat D backfills couple_id by last-ten on join.
--            (c-41.5: the kickoff's NOT NULL was wrong.)
--   R-41.30  a synchronous Meta refusal (e.g. 131049) lands as status='failed' with
--            error_code/error_title on the forwards row; the write path ships now, dark.
--
-- Free-text vocabularies (assistance_forwards.status, assistance_request_items.category)
-- take 0141/0142's position: no CHECK over a vocabulary a later seat extends.
-- category holds the canonical token from src/agent/categories.js; the CHECK that
-- binds it lives in code (categoryFraming.js asserts membership), because widening
-- the DB list is F-41.3's (seat D) and not this file's (R-41.27).
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══ SECTION 1 · public.assistance_requests ════════════════════════════════
CREATE TABLE IF NOT EXISTS public.assistance_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULL for an admin-typed request until seat D backfills it by last-ten (R-41.29).
  couple_id     uuid        NULL REFERENCES public.couples(id) ON DELETE SET NULL,
  -- The last ten digits, always. The writer normalises; the DB refuses the empty
  -- string so a door that forgot to normalise cannot write a blank and call it a phone.
  phone         text        NOT NULL CHECK (phone ~ '^[0-9]{10}$'),
  name          text        NULL,
  -- open → forwarded (first forward lands) → closed (the founder's hand). R-41.23.
  status        text        NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open', 'forwarded', 'closed')),
  city          text        NULL,
  area          text        NULL,
  wedding_date  date        NULL,
  -- "The look" — her words, verbatim. Never coalesced with anything (R-37.37's spirit).
  brief         text        NULL,
  -- Which door wrote it: bride | admin | public (public is s2's; reserved here so
  -- the vocabulary is on record before the door exists).
  origin        text        NOT NULL DEFAULT 'bride'
                            CHECK (origin IN ('bride', 'admin', 'public')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.assistance_requests IS
  'Block 20 Concierge: a couple''s request for TDW to find and book vendors. One writer: src/lib/couple/assistance.js createAssistanceRequest. Not a lead until TDW forwards it (0148).';

CREATE INDEX IF NOT EXISTS idx_assistance_requests_status_created
  ON public.assistance_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assistance_requests_phone
  ON public.assistance_requests (phone);

-- ═══ SECTION 2 · public.assistance_request_items ═══════════════════════════
CREATE TABLE IF NOT EXISTS public.assistance_request_items (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id       uuid        NOT NULL REFERENCES public.assistance_requests(id) ON DELETE CASCADE,
  -- The canonical trade token (src/agent/categories.js). Mehendi rides `other`
  -- in s1 (R-41.27, F-41.3 to seat D).
  category         text        NOT NULL,
  -- Whole rupees, her number (R-41.26). Rendered as `Rs X,XX,XXX`; stored as an integer.
  budget_rs        integer     NULL CHECK (budget_rs IS NULL OR budget_rs >= 0),
  forwarded_count  integer     NOT NULL DEFAULT 0 CHECK (forwarded_count >= 0),
  created_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.assistance_request_items IS
  'Block 20 Concierge: one row per category on the couple''s sheet, with her budget for it. Written only by createAssistanceRequest; forwarded_count bumped only by forwardAssistanceItem (0148).';

CREATE INDEX IF NOT EXISTS idx_assistance_request_items_request
  ON public.assistance_request_items (request_id);

-- ═══ SECTION 3 · public.assistance_forwards ════════════════════════════════
CREATE TABLE IF NOT EXISTS public.assistance_forwards (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id       uuid        NOT NULL REFERENCES public.assistance_request_items(id) ON DELETE CASCADE,
  target_kind   text        NOT NULL CHECK (target_kind IN ('vendor', 'prospect')),
  -- Exactly one of the two targets is set, and it matches target_kind.
  vendor_id     uuid        NULL REFERENCES public.vendors(id)   ON DELETE SET NULL,
  prospect_id   uuid        NULL REFERENCES public.prospects(id) ON DELETE SET NULL,
  -- The lead createLead wrote for an on-platform forward (source='tdw_assist').
  -- NULL for an outsider until she joins and seat D materialises it.
  lead_id       uuid        NULL REFERENCES public.leads(id)     ON DELETE SET NULL,
  -- ⚠ THE WAMID IS THE JOIN TO META (0142's paragraph, verbatim in spirit). NULL
  -- until a send exists; in s1 every send arm is dark, so every row is NULL here.
  wamid         text        NULL,
  -- `recorded` at write for an on-platform forward (no template rides it in s1);
  -- `dark` at write for an outsider forward while cap.on() is false (the log line
  -- says why); then whatever Meta's webhook last said once a send exists: sent,
  -- delivered, read, failed. `failed` also lands synchronously (R-41.30).
  status        text        NOT NULL DEFAULT 'recorded',
  error_code    text        NULL,
  error_title   text        NULL,
  sent_at       timestamptz NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assistance_forwards_target_matches CHECK (
    (target_kind = 'vendor'   AND vendor_id IS NOT NULL AND prospect_id IS NULL) OR
    (target_kind = 'prospect' AND prospect_id IS NOT NULL AND vendor_id IS NULL)
  )
);

COMMENT ON TABLE public.assistance_forwards IS
  'Block 20 Concierge: what TDW forwarded where, per category item. One writer: forwardAssistanceItem. Receipt router updates by wamid (R-40.110). Send arms dark behind cap.on() until seat C (0148).';

CREATE INDEX IF NOT EXISTS idx_assistance_forwards_item
  ON public.assistance_forwards (item_id);

-- The receipt's lookup path. PARTIAL: a null wamid is a row no receipt will ever
-- name (0142's reasoning, carried).
CREATE INDEX IF NOT EXISTS idx_assistance_forwards_wamid
  ON public.assistance_forwards (wamid) WHERE wamid IS NOT NULL;

-- ⚠ UNIQUE ON THE WAMID, PARTIAL. relayStatus refuses to speak on an ambiguous
-- match; the database enforces the uniqueness so no future writer is trusted to
-- remember (R-40.110, 0142's clause).
CREATE UNIQUE INDEX IF NOT EXISTS uq_assistance_forwards_wamid
  ON public.assistance_forwards (wamid) WHERE wamid IS NOT NULL;
