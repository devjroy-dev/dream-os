-- db/migrations/0143_contract_number_and_sends.sql
-- TDW · BLOCK 19 · G3.2 sitting 2 — THE AGREEMENT'S REFERENCE, THE SEND RECORD,
-- AND THE DEDUPE KEY'S MISSING PREDICATE.
--
-- Append-only, founder-run, idempotent. Ladder tip before this file: derived by
-- `ls db/migrations/*.sql | sort | tail` at the cut, not recalled. `0142` is
-- G5.1 sitting 2's under R-40.44; this file is `0143` by the chair's allocation.
--
-- ⚠ SEQUENCING, NAMED RATHER THAN ASSUMED. If this runs BEFORE `0142` is
-- applied, `0142` then fills a number BELOW the applied tip and takes a record
-- in `db/migrations/OUT_OF_ORDER.json` — which is G5.1 sitting 2's to write, not
-- this file's. `0137`'s header is the specimen of what happens when a file
-- assumes otherwise. Run this AFTER `0142` and neither register moves.
--
-- ⚠ FOUNDER-RUN IN THE SUPABASE EDITOR, BEFORE THE dream-os ZIP IS APPLIED.
--
-- ═══ WHAT THIS FILE IS FOR ═════════════════════════════════════════════════
-- (a) R-40.106 / register §9A — the agreement's reference, `DEV440/2026/0001`,
--     on the invoice's mechanism with its own per-vendor pair. Padding 4, no
--     yearly reset (chair, 2026-09-07).
-- (b) F-40.196 — clause 16.2 promises each party receives the sealed copy by
--     WhatsApp. A send the estate cannot point at a row for is a send it cannot
--     say it made (F-40.177's law, one plane over).
-- (c) F-40.222 — the client dedupe matches soft-deleted rows as live, and the
--     index that backs it still reserves their phone numbers.
--
-- ═══ F-40.221 · THE PRECEDENT COPIED WITH ITS LESSON ═══════════════════════
-- `src/lib/vendor/invoices.js:83-91` increments `invoice_counter` IN the UPDATE
-- and reads the number from Postgres's answer. Register §9A and
-- `G32V4_VETO_SHEET.md` §7 both call that read-after-write "the whole of the
-- guarantee". **IT IS NOT.** The incremented value is computed locally
-- (`v.invoice_counter + 1`), so two concurrent composers both read 5, both write
-- 6, and both read 6 back. Reading the answer guarantees the process PRINTS what
-- landed; it does not stop two documents landing on one number.
--
-- What actually stops it is `invoices_vendor_number_unique` — `UNIQUE
-- (vendor_id, invoice_number)`, snapshot `:1750`, index `:3236` — under which
-- the second INSERT FAILS. Copying the counter without the index would have
-- given contracts silently duplicated references. The UNIQUE below is that
-- lesson, and it is PARTIAL because every existing `contracts` row has a NULL
-- number and a total unique would refuse them all.
--
-- ═══ SQL-PROVENANCE · R-40.27 — CONSTRAINTS CITED FOR EVERY TABLE WRITTEN ══
-- Witness: `docs/db/PUBLIC_SCHEMA.md`, regenerated at `5b3f61f`, ladder `0138`.
-- Staleness tested by arithmetic rather than assumed: `0139` creates two new
-- tables, `0140` ADDs `vendors.date_check_enabled`, `0141` creates one new
-- table. No column this file touches was altered by any of the three, and every
-- `:nnnn` below was READ at `40fe6a3`, never computed (register §0's trap:
-- Postgres does not renumber after DROP COLUMN, and `vendors`, `clients`,
-- `invoices` and `events` all carry ordinal gaps).
--
-- public.contracts  — columns :261-284, constraints :1491-1499
--     [CHECK] contracts_deposit_pct_check :1494
--     [CHECK] contracts_state_check       :1496
--     [PRIMARY KEY] contracts_pkey        :1498
--   WRITTEN: gains `number text` NULL. Violates no CHECK — neither predicate
--   names it — and an ADD COLUMN of a nullable text cannot fail on data.
--
-- public.vendors    — columns :1198-1250, constraints :2067-2085
--     [CHECK] vendors_billing_status_check · vendors_discover_request_state_check
--             vendors_rate_range_check · vendors_service_area_token
--             vendors_service_cities_pairing · vendors_tier_check
--     [PRIMARY KEY] vendors_pkey :2082 · [UNIQUE] vendors_routing_handle_key :2084
--   WRITTEN: gains `contract_prefix text` NULL and `contract_counter integer
--   NOT NULL DEFAULT 0`. Not one of the six CHECKs names either column. The
--   NOT NULL DEFAULT backfills the existing rows with 0, exactly the shape
--   `invoice_counter` :1221 already has.
--
-- public.clients    — columns :169-184, constraints :1429-1435
--     [PRIMARY KEY] clients_pkey :1432 — AND NOTHING ELSE.
--   ⚠ `clients_vendor_phone_unique` is a BARE UNIQUE INDEX (:2826), not a table
--   constraint: it appears in the snapshot's §3 INDEXES and NOT in its §1. So it
--   is dropped with DROP INDEX and never with ALTER TABLE DROP CONSTRAINT — a
--   distinction that decides whether the statement runs at all.
--   WRITTEN: the index is dropped and recreated with a NARROWER predicate. A
--   narrower partial unique indexes strictly fewer rows, so it cannot fail on
--   data that the wider one already permitted.
--
-- public.contract_sends — NEW. No existing row can violate it.
-- public.contract_signatures, public.invoices, public.users, public.events —
--   NOT TOUCHED. Named so the reader can see the boundary rather than infer it.

BEGIN;

-- ── (a) THE REFERENCE ──────────────────────────────────────────────────────
-- Register §9A: chrome, not an instrument field. It appears in the paper's
-- title block and never in v4's clause text, which is why it is not among the
-- 168 tokens.
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS number text;

-- ⚠ THEIR OWN PAIR, NOT THE INVOICE'S. A shared counter would make invoice 7
-- and contract 7 impossible to hold at once, and one number would carry two
-- meanings (veto sheet §7).
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS contract_prefix  text,
  ADD COLUMN IF NOT EXISTS contract_counter integer NOT NULL DEFAULT 0;

-- ⚠ F-40.221's cure. PARTIAL on `number IS NOT NULL`: every contract written
-- before this migration has none, and they are not being renumbered.
CREATE UNIQUE INDEX IF NOT EXISTS contracts_vendor_number_unique
  ON public.contracts (vendor_id, number) WHERE number IS NOT NULL;

-- ── (b) THE SEND RECORD — F-40.196 ─────────────────────────────────────────
-- `0141_lead_alerts.sql` is the shape and deliberately NOT the home:
-- `lead_alerts` is `vendor_id NOT NULL` + `lead_id`, and a contract copy goes to
-- a CLIENT's handset about a CONTRACT. Widening that table would make one table
-- mean two things, which is the reason `0141`'s own header refused to reuse
-- `public.messages`.
CREATE TABLE IF NOT EXISTS public.contract_sends (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id  uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  -- Denormalised from the contract so a send can be read per vendor without a
  -- join, exactly as `lead_alerts.vendor_id` is. CASCADE: a send with no vendor
  -- is a row about nobody.
  vendor_id    uuid NOT NULL REFERENCES public.vendors(id)   ON DELETE CASCADE,
  -- ⚠ A CHECK HERE, AND `lead_alerts.source` DELIBERATELY HAS NONE — the
  -- difference is who owns the vocabulary. `source` names a door and doors get
  -- added; this names a PARTY, and clause 16.2 says there are two of them. The
  -- precedent for a closed set on this family is
  -- `contract_signatures_channel_check` (:1483), which is two values for the
  -- same reason.
  recipient    text NOT NULL CHECK (recipient = ANY (ARRAY['vendor'::text, 'client'::text])),
  -- Nullable: a row is written for the outcome where there was no number to
  -- send to, and that row is the evidence the party was skipped rather than
  -- missed.
  to_phone     text     NULL,
  -- The template actually sent, never inferred from `recipient` — R-40.72's
  -- lesson at `0141`: a row that recorded its template by inference rewrites its
  -- own history the day the pointer moves.
  template_key text NOT NULL,
  -- ⚠ THE JOIN TO META. Nullable because a send can fail before one exists.
  wamid        text     NULL,
  -- `queued` at write, then Meta's own sent/delivered/read/failed, plus the
  -- estate's own outcomes Meta never saw.
  status       text NOT NULL DEFAULT 'queued',
  error_code   text     NULL,
  error_title  text     NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- The receipt arrives with a wamid and nothing else. PARTIAL — a null wamid is
-- a row no receipt will ever name.
CREATE INDEX IF NOT EXISTS idx_contract_sends_wamid
  ON public.contract_sends (wamid) WHERE wamid IS NOT NULL;

-- ⚠ UNIQUE ON THE WAMID, for `0141`'s reason: `relayStatus` refuses to speak on
-- an ambiguous match, and that refusal only protects the estate if the table
-- cannot hold the same sid twice.
CREATE UNIQUE INDEX IF NOT EXISTS uq_contract_sends_wamid
  ON public.contract_sends (wamid) WHERE wamid IS NOT NULL;

-- The record's read: "what did we send about this agreement, most recent first."
CREATE INDEX IF NOT EXISTS idx_contract_sends_contract_created
  ON public.contract_sends (contract_id, created_at DESC);

COMMENT ON TABLE public.contract_sends IS
  'One row per outbound sealed-copy send, one per party (F-40.196, clause 16.2). Written by src/lib/vendor/contractSend.js and by nothing else. NOT public.lead_alerts: that table is keyed to a vendor and a lead, this one to a contract and a party.';
COMMENT ON COLUMN public.contract_sends.wamid IS
  'Meta message id. NULL when the send failed before Meta saw it. UNIQUE where present so the receipt router can never match ambiguously.';
COMMENT ON COLUMN public.contracts.number IS
  'The agreement''s reference in the paper''s title block, <PREFIX>/<YYYY>/<NNNN> (register 9A). Chrome, not an instrument field. Allocated from vendors.contract_counter, and UNIQUE per vendor where present.';

-- ── (c) F-40.222 · THE DEDUPE KEY'S MISSING PREDICATE ──────────────────────
-- `src/lib/clients.js:21-38` matches on `(vendor_id, phone)` with NO
-- `deleted_at` filter, so a soft-deleted client is returned as live. The index
-- below had the same blind spot from the other direction: a deleted row still
-- RESERVED its phone number, which is the `PHONE_COLLISION` 409 the 2026-09-06
-- walk hit after `resolveOrCreateClient` minted a second `Slide Test 1`.
--
-- ⚠ THE CODE HALF OF THIS CURE IS IN THE SAME DELIVERY. An index that stops
-- reserving a deleted row's number, without a lookup that stops MATCHING one,
-- would let a vendor be handed a client she had already deleted. Neither half
-- is a cure alone, and they ship together.
DROP INDEX IF EXISTS public.clients_vendor_phone_unique;

CREATE UNIQUE INDEX IF NOT EXISTS clients_vendor_phone_unique
  ON public.clients (vendor_id, phone)
  WHERE phone IS NOT NULL AND deleted_at IS NULL;

COMMIT;

-- ═══ VERIFY — run each separately (R-40.31: the editor renders only the last
-- result). Each names the CONSTRAINTS that must be present, never a count
-- (R-40.49).
--
-- 1 · the three new columns
--   select table_name, column_name, data_type, is_nullable, column_default
--     from information_schema.columns
--    where table_schema = 'public'
--      and ((table_name = 'contracts' and column_name = 'number')
--        or (table_name = 'vendors'   and column_name in ('contract_prefix','contract_counter')))
--    order by table_name, column_name;
--   EXPECT: contracts.number text YES null · vendors.contract_counter integer NO 0
--           · vendors.contract_prefix text YES null
--
-- 2 · contract_sends' shape
--   select column_name, data_type, is_nullable, column_default
--     from information_schema.columns
--    where table_schema = 'public' and table_name = 'contract_sends'
--    order by ordinal_position;
--   EXPECT: eleven columns; recipient NOT NULL; wamid nullable; status default 'queued'.
--
-- 3 · the three indexes that carry the rulings, with their predicates
--   select indexname, indexdef from pg_indexes
--    where schemaname = 'public'
--      and indexname in ('contracts_vendor_number_unique',
--                        'uq_contract_sends_wamid',
--                        'clients_vendor_phone_unique')
--    order by indexname;
--   EXPECT: contracts_vendor_number_unique UNIQUE (vendor_id, number)
--             WHERE (number IS NOT NULL)
--           uq_contract_sends_wamid UNIQUE (wamid) WHERE (wamid IS NOT NULL)
--           clients_vendor_phone_unique UNIQUE (vendor_id, phone)
--             WHERE ((phone IS NOT NULL) AND (deleted_at IS NULL))
--   ⚠ READ THE PREDICATE, NOT THE NAME. The snapshot's own warning: a
--   constraint read without its predicate is a constraint misread, and
--   `clients_vendor_phone_unique` keeps its NAME across this change — the
--   `deleted_at` clause in `indexdef` is the only evidence it moved.
--
-- 4 · the recipient CHECK
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'public.contract_sends'::regclass and contype = 'c';
--   EXPECT: recipient = ANY (ARRAY['vendor'::text, 'client'::text])
--
-- OWED AFTER THIS RUNS: the PAIR snapshot gains a table and three columns.
-- `docs/db/PUBLIC_SCHEMA.md` is regenerated at ladder `0138` and describes
-- neither `0139`'s, `0141`'s nor this file's tables; THIS FILE is their witness
-- until the next regen, and anything about these columns is cited from HERE by
-- line, never from the snapshot.
