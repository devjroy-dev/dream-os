-- db/migrations/0141_lead_alerts.sql
-- TDW · BLOCK 19 · G1.3 rider 5 — F-40.177: THE ALERT THAT WAS RECORDED NOWHERE.
--
-- Append-only, founder-run, idempotent. Ladder tip before this file: 0140,
-- derived by `ls db/migrations/*.sql | sort | tail` at the cut, not recalled.
-- This sits AT the tip, so it takes NO record in OUT_OF_ORDER.json — that
-- register is for numbers BELOW the tip, and 0137's header records what happens
-- when a file assumes otherwise.
--
-- ⚠ FOUNDER-RUN IN THE SUPABASE EDITOR, BEFORE THE dream-os ZIP IS APPLIED.
--
-- ═══ WHAT THE WALK SHOWED ══════════════════════════════════════════════════
-- R-40.72 sent two alerts and Railway answered both with:
--     [wa:receipt] webhook:meta wamid=… status=sent  home=none matched=0
--                                          — NO ROW CARRIES THIS SID
-- `relayStatus.js` looks for a wamid in `public.messages` and nowhere else. A
-- lead alert is not a conversation message, so it was never going to be there.
-- The send happened, Meta accepted it, Meta reported delivered / failed — and
-- the estate persisted none of it. The room can never say 「told」 about a thing
-- it did not write down.
--
-- That is F-06.143's own disease one plane over, and the reason `relayStatus`
-- says `matched=0` OUT LOUD rather than silently: the sentence was already
-- there, correctly, and it was telling us the truth every time.
--
-- ═══ SQL-PROVENANCE · R-40.27 ══════════════════════════════════════════════
-- This file WRITES ONE TABLE, and it is new — so no existing row can violate
-- anything and no ALTER can fail on data.
--
-- public.leads   — columns :675, constraints :1666-1672 (leads_pkey;
--   leads_wedding_date_precision_check). READ ONLY here. `lead_id` references
--   it ON DELETE SET NULL: an alert is a record of something the estate DID, and
--   it stays true after the lead it was about is deleted.
-- public.vendors — columns :1130, constraints :1946-1966 (vendors_pkey;
--   UNIQUE routing_handle). READ ONLY. `vendor_id` is NOT NULL and CASCADEs:
--   an alert with no vendor is a row about nobody.
-- public.messages — NOT TOUCHED. Named because the receipt router updates it and
--   this table is deliberately NOT it: conversation messages and outbound
--   notifications are different planes and a shared table would make
--   `delivery_status` mean two things.

BEGIN;

CREATE TABLE IF NOT EXISTS public.lead_alerts (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id    uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  lead_id      uuid     NULL REFERENCES public.leads(id)   ON DELETE SET NULL,
  -- Which door spoke. Free text and deliberately not a CHECK: `leads.source`
  -- carries the same vocabulary without one (R-40.13), and F-40.18's
  -- distinct-values census is still owed there. A CHECK here on two values that
  -- a future door will extend is a refusal written before the question.
  source       text     NULL,
  -- The template actually sent. NOT assumed from `source`: R-40.72 is amended
  -- to re-point at a Utility template once Meta approves it (F-40.176), and a
  -- row that recorded the template by inference would rewrite its own history
  -- on the day the pointer moves.
  template_key text NOT NULL,
  -- ⚠ THE WAMID IS THE JOIN TO META. Nullable because a send can FAIL before
  -- one exists — an opted-out vendor, a missing phone — and those rows are the
  -- ones most worth keeping.
  wamid        text     NULL,
  -- `queued` at write, then whatever Meta's webhook last said: sent, delivered,
  -- read, failed. Also `no_phone` and `opted_out`, which are outcomes the
  -- ESTATE decided and Meta never saw.
  status       text NOT NULL DEFAULT 'queued',
  -- Meta's own code and short title when it refuses. `131049` is the specimen:
  -- the MARKETING throttle that dropped Swati's alert on the walk (F-40.176).
  error_code   text     NULL,
  error_title  text     NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ── THE RECEIPT'S LOOKUP PATH ──────────────────────────────────────────────
-- The webhook arrives with a wamid and nothing else. PARTIAL, because a null
-- wamid is a row that no receipt will ever name and indexing those wastes the
-- write on every failed send.
CREATE INDEX IF NOT EXISTS idx_lead_alerts_wamid
  ON public.lead_alerts (wamid) WHERE wamid IS NOT NULL;

-- ⚠ UNIQUE ON THE WAMID, and this is load-bearing rather than tidy.
-- `relayStatus` refuses to speak on an ambiguous match — `home=ambiguous …
-- SID IS NOT UNIQUE` — because a sid is Meta's own identifier and unique by
-- construction. That refusal only protects the estate if the table cannot hold
-- the same sid twice. The database enforces it so the reader does not have to
-- trust that every future writer remembered.
CREATE UNIQUE INDEX IF NOT EXISTS uq_lead_alerts_wamid
  ON public.lead_alerts (wamid) WHERE wamid IS NOT NULL;

-- The room's read: "what did we tell this vendor, most recent first."
CREATE INDEX IF NOT EXISTS idx_lead_alerts_vendor_created
  ON public.lead_alerts (vendor_id, created_at DESC);

COMMENT ON TABLE public.lead_alerts IS
  'One row per outbound lead-alert send (R-40.72, F-40.177). Written by src/lib/vendor/weddingLeadAlert.js and by nothing else; status is advanced by the Meta receipt webhook via relayStatus.js. NOT public.messages: conversation messages and outbound notifications are different planes.';
COMMENT ON COLUMN public.lead_alerts.wamid IS
  'Meta message id. NULL when the send failed before Meta saw it (no_phone, opted_out). UNIQUE where present so the receipt router can never match ambiguously.';
COMMENT ON COLUMN public.lead_alerts.status IS
  'queued at write; then Meta''s own sent/delivered/read/failed, or the estate''s own no_phone/opted_out for sends Meta never saw.';

COMMIT;

-- ── VERIFY (run separately — R-40.31, one statement per paste) ──────────────
--   select column_name, data_type, is_nullable
--     from information_schema.columns
--    where table_schema = 'public' and table_name = 'lead_alerts'
--    order by ordinal_position;
--
-- OWED AFTER THIS RUNS: the PAIR snapshot gains a table. `docs/db/
-- PUBLIC_SCHEMA.md` is regenerated at ladder 0140 and does not describe
-- `lead_alerts`; this file is its witness until the next regen, and anything
-- about these columns is cited from HERE by line, never from the snapshot.
