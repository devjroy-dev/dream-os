-- db/migrations/0145_contract_sends_comment.sql
-- TDW · BLOCK 19 · G3.2 sitting 2 — THE COMMENT THAT DESCRIBED A ROUTER ARM
-- THAT DID NOT YET EXIST.
--
-- Append-only, founder-run, idempotent. Ladder tip before this file: 0144
-- (G5.1 s2's rider), derived by `ls db/migrations/*.sql | sort | tail` at the
-- cut, not recalled. This sits AT the tip, so it takes NO record in
-- OUT_OF_ORDER.json.
--
-- ⚠ FOUNDER-RUN IN THE SUPABASE EDITOR. Safe at any time: `COMMENT ON` is an
-- absolute assignment, not a delta, so it needs no read-back to be correct and
-- re-running it changes nothing.
--
-- ═══ WHY ═══════════════════════════════════════════════════════════════════
-- `0143` wrote, on `public.contract_sends.wamid`:
--
--     '… UNIQUE where present so the receipt router can never match ambiguously.'
--
-- At the commit that shipped it (`8d4b591`) `relayStatus.js` had NO ARM for this
-- table. The sentence asserted a protection that was not exercised — a comment
-- describing an intention as a fact, which is `0142`'s own defect (F-40.226) and
-- the reason `0144` exists. Caught here by deriving the applied comment against
-- the code at that commit rather than assuming this seat's wording escaped it.
--
-- The TABLE comment was clean and is extended rather than corrected: it claimed
-- only 「Written by contractSend.js and by nothing else」, which was true then and
-- is true now. It gains the router sentence because a wamid-bearing table with no
-- stated route is exactly what `b51` §17 exists to catch.
--
-- ⚠ AND THIS FILE SHIPS IN THE SAME PACKET AS THE ARM. The comment becomes true
-- at the moment the code makes it true, and not one commit before.
--
-- ═══ SQL-PROVENANCE · R-40.27 ══════════════════════════════════════════════
-- public.contract_sends — created by `0143`, which is this table's witness until
--   the next PUBLIC_SCHEMA regen. Constraints: contract_sends_pkey;
--   contract_sends_recipient_check (recipient IN ('vendor','client'));
--   FKs to contracts(id) and vendors(id), both ON DELETE CASCADE;
--   uq_contract_sends_wamid UNIQUE (wamid) WHERE wamid IS NOT NULL.
--   WRITTEN: comments only. `COMMENT ON` touches no row, no column type and no
--   constraint, so no existing row can violate anything and nothing can fail on
--   data.
-- No other table is read or written by this file.

BEGIN;

COMMENT ON TABLE public.contract_sends IS
  'One row per outbound sealed-copy send, one per party (F-40.196, clause 16.2). Written by src/lib/vendor/contractSend.js and by nothing else. Status is advanced by the Meta receipt webhook through relayStatus.js, which reaches this table as its FOURTH home after public.messages, lead_alerts and referral_alerts; a failed receipt clears whatever the room reads as sent. NOT public.lead_alerts: that table is keyed to a vendor and a lead, this one to a contract and a party.';

COMMENT ON COLUMN public.contract_sends.wamid IS
  'Meta message id. NULL when the send failed before Meta saw it (no_phone, opted_out, template_not_approved) — those rows are the evidence a party was skipped for a reason rather than missed, and PARTIAL uniqueness is what keeps a failed send retryable. UNIQUE where present, which is what lets relayStatus.js refuse an ambiguous match rather than trust that every future writer remembered.';

COMMENT ON COLUMN public.contract_sends.recipient IS
  'Which party this row is about: vendor or client. A CHECK rather than free text, because clause 16.2 says there are two parties — unlike lead_alerts.source, which names a door, and doors get added.';

COMMIT;

-- ── VERIFY (run separately — R-40.31, one statement per paste) ──────────────
--   select objsubid, col_description('public.contract_sends'::regclass, objsubid) as comment
--     from generate_series(0, 12) as objsubid
--    where col_description('public.contract_sends'::regclass, objsubid) is not null;
--
--   select obj_description('public.contract_sends'::regclass, 'pg_class') as table_comment;
--
-- EXPECT: the table comment names `relayStatus.js` AND its position in the ladder
-- (FOURTH), and the wamid comment says what PARTIAL uniqueness buys. Read the
-- SENTENCE, not the presence of a comment — a comment that exists and overclaims
-- is what this file is here to fix.
