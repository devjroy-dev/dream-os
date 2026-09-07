-- db/migrations/0142_referral_alerts.sql
-- TDW · BLOCK 19 · G5.1 SITTING 2 — R-G51.15 (the peer is told) and R-40.107
-- (the peer is found, and may withdraw from being findable).
--
-- Append-only, founder-run, idempotent. Ladder tip before this file: 0141,
-- derived by `ls db/migrations/*.sql | sort | tail` at the cut, not recalled.
-- This sits AT the tip, so it takes NO record in OUT_OF_ORDER.json — that
-- register is for numbers BELOW the tip. Number allocated by the chair
-- (R-40.44) while more than one seat cuts.
--
-- ⚠ FOUNDER-RUN IN THE SUPABASE EDITOR, BEFORE THE dream-os ZIP IS APPLIED.
-- The search door names `peer_discoverable` in a predicate. Deployed ahead of
-- this migration, PostgREST 400s and the peer search goes dark. Stated, never
-- worked around: a retry-without-the-predicate would be a search quietly
-- serving vendors who have withdrawn, which is the failure the column exists to
-- prevent (`discover.js:60`'s own warning, one plane over).
--
-- ═══ SECTION 1 · public.referral_alerts — THE PEER WAS TOLD, AND WE WROTE IT
-- DOWN ══════════════════════════════════════════════════════════════════════
-- 0141's lesson, one plane over and taken the first time rather than after a
-- walk: `relayStatus.js` looks for a wamid in `public.messages` and nowhere
-- else, a referral alert is not a conversation message, and a room can never
-- say 「told」 about a thing it did not write down. The `Told` state on the
-- sender's lead record reads THIS TABLE and nothing else.
--
-- ⚠ FAILURES GET ROWS TOO, and they are the ones most worth having: an
-- `opted_out` row is the only durable evidence that a peer was skipped lawfully
-- rather than missed. `wamid` is null there — which is why both unique indexes
-- below are PARTIAL.
--
-- ═══ SECTION 2 · public.vendors.peer_discoverable — R-40.107 ════════════════
-- ⚠ DEFAULT true, AND 0140 DEFAULTED ITS SIBLING false. Read this paragraph
-- before changing either, because the two columns look like they contradict and
-- do not.
--
-- `0140` added `date_check_enabled` with `default false` and said why: "every
-- vendor alive today has consented to nothing." That switch exposed a NEW FACT
-- about her — whether she is free on a named day — to ANYONE with her handle.
-- Silence never means yes, so it defaulted off.
--
-- This column governs a different act. The peer search returns exactly four
-- fields — `business_name`, `routing_handle`, `category`, `city` — and every
-- one of them is already on the PUBLIC storefront card's own select
-- (`src/api/public/vendorCard.js:213`, `VENDOR_SELECT`), served to any stranger
-- who knows a handle. So this is not a new exposure that needs consent; it is a
-- DIRECTORY BUILT FROM FACTS SHE ALREADY PUBLISHES, and the switch is her way
-- to WITHDRAW from it. Defaulting it off would hide vendors from each other on
-- the strength of a permission they had already given the public.
--
-- Same table, opposite default, one law. Written here so the two columns never
-- contradict in silence and so the next reader does not "fix" one to match the
-- other.
--
-- ⚠ AND THE CONSENT IS ONLY TRUE OF ROWS THE DOOR CAN RETURN. The reason above
-- holds for a vendor whose storefront is actually public — `vendorCard.js:417`
-- gates on `status = 'active' AND discover_paused IS NOT true`. A vendor who
-- PAUSED her storefront published nothing, so the door's predicate is all three
-- clauses together:
--     status = 'active' AND discover_paused = false AND peer_discoverable = true
-- and the Settings line says the middle clause out loud to the vendor.
--
-- ⚠ `_discoverable` AND NOT `_hidden`, AND THE DEFAULT IS THE REASON.
-- 0140's own warning: "a column whose safe state is `true` is one careless
-- `coalesce` away from opening a door nobody opened." Spelled positively, the
-- SAFE state is `false`, so no reader ever inverts and a stray `coalesce(...,
-- true)` cannot expose a vendor who withdrew. The door reads
-- `.eq('peer_discoverable', true)` and never `.not('peer_discoverable','is',
-- false)` — a NULL passes the second and not the first — and a bench cell holds
-- exactly that.
--
-- ═══ SQL-PROVENANCE · R-40.27 ══════════════════════════════════════════════
-- THIS FILE WRITES TWO TABLES. Both are cited, column block AND constraints
-- section, per the amended law (protocol §10).
--
-- public.referral_alerts — NEW. No existing row can violate anything and no
--   ALTER can fail on data.
--
-- public.lead_referrals — READ ONLY here. Columns docs/db/PUBLIC_SCHEMA.md:709
--   -717 (7 columns); constraints :1760-1764 (lead_referrals_pkey, PRIMARY KEY
--   (id)); foreign keys :2440-2450 (from_vendor_id/to_vendor_id -> vendors ON
--   DELETE CASCADE, lead_id -> leads ON DELETE SET NULL, new_lead_id -> leads ON
--   DELETE CASCADE); indexes :3248-3260, including idx_lead_referrals_new_lead,
--   a UNIQUE INDEX on new_lead_id. `referral_id` references it ON DELETE
--   CASCADE: an alert is a record OF a forward, and a forward that no longer
--   exists has no alert to describe.
--
-- public.vendors — WRITTEN by section 2 (ADD COLUMN), read by section 1's FK.
--   Columns :1198+ (49 columns; NOTE: no `phone` column and no `deleted_at` —
--   a vendor is reachable through public.users.phone via user_id, which
--   weddingLeadAlert.js:231-237 also relies on, and is retired through
--   `status`). Constraints :2078-2086: vendors_pkey PRIMARY KEY (id);
--   vendors_tier_check CHECK (tier IN ('basic','essential','signature',
--   'prestige')); vendors_routing_handle_key UNIQUE (routing_handle);
--   vendors_service_cities_pairing CHECK (the service_area/service_cities
--   pairing). THIS STATEMENT ADDS A COLUMN AND TOUCHES NONE OF THEM: no key, no
--   FK, no CHECK is created, dropped or re-pointed, and no existing row's
--   constrained columns are read or written. A NOT NULL column with a DEFAULT
--   backfills every existing row in one pass — to `true` here, which is the
--   intended state for the reason SECTION 2 gives at length.
--
-- public.messages — NOT TOUCHED. Named because the receipt router updates it and
--   this table is deliberately NOT it: conversation messages and outbound
--   notifications are different planes, and 0141 made the same refusal.
--
-- ⚠ SNAPSHOT STALENESS, CHECKED RATHER THAN ASSUMED. PUBLIC_SCHEMA.md's header
-- names its applied ladder tip as 0138. 0139, 0140 and 0141 are newer, so the
-- snapshot is STALE for the tables THOSE touch and `lead_alerts` is not in it at
-- all. It is NOT stale for `lead_referrals` (0135) or `vendors`, so the two
-- citations above stand. `vendors.date_check_enabled` is 0140's and is cited
-- from that file, never from the snapshot.

BEGIN;

-- ── SECTION 1 ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referral_alerts (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- WHICH FORWARD. Not the lead: a lead can be forwarded, and the peer's copy
  -- can itself be forwarded onward later, so keying on a lead would make two
  -- different alerts collide. The forward is the event being announced.
  referral_id   uuid NOT NULL REFERENCES public.lead_referrals(id) ON DELETE CASCADE,
  -- WHO WAS TOLD. Denormalised from lead_referrals.to_vendor_id deliberately:
  -- R-40.92 requires the send to log its recipient, and a row that can only
  -- name its recipient through a join is a row that stops naming it the moment
  -- the join is unavailable. Written from the referral row, never from a
  -- request body.
  to_vendor_id  uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  -- The template actually sent, stored PER ROW rather than inferred. 0141's
  -- reasoning, and it has already paid once: R-40.72 re-pointed from
  -- `lead_alert_basic` to `lead_alert_utility` and every historic row stayed
  -- readable because the key was on the row.
  template_key  text NOT NULL,
  -- ⚠ THE WAMID IS THE JOIN TO META, and it is the ONLY thing the 「Told」 state
  -- reads. Nullable because a send can fail before one exists — an opted-out
  -- peer, a peer with no phone on public.users — and those rows are the ones
  -- most worth keeping.
  wamid         text     NULL,
  -- `queued` at write, then whatever Meta's webhook last said: sent, delivered,
  -- read, failed. Also `no_phone` and `opted_out`, which are outcomes the
  -- ESTATE decided and Meta never saw. Free text, not a CHECK: 0141 took the
  -- same position for the same reason — a CHECK over a vocabulary a future door
  -- will extend is a refusal written before the question.
  status        text NOT NULL DEFAULT 'queued',
  error_code    text     NULL,
  error_title   text     NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- The receipt's lookup path. PARTIAL: a null wamid is a row no receipt will
-- ever name, and indexing those wastes the write on every failed send.
CREATE INDEX IF NOT EXISTS idx_referral_alerts_wamid
  ON public.referral_alerts (wamid) WHERE wamid IS NOT NULL;

-- ⚠ UNIQUE ON THE WAMID, PARTIAL. `relayStatus` refuses to speak on an
-- ambiguous match, and that refusal only protects the estate if the table
-- cannot hold one sid twice. The database enforces it so no future writer has
-- to be trusted to remember.
CREATE UNIQUE INDEX IF NOT EXISTS uq_referral_alerts_wamid
  ON public.referral_alerts (wamid) WHERE wamid IS NOT NULL;

-- ⚠ ONE SUCCESSFUL ALERT PER FORWARD — AND THE `WHERE` IS THE WHOLE RULING.
-- A bare UNIQUE (referral_id) was the obvious shape and it is wrong: 0141
-- establishes that failures get rows too, so a single `opted_out` row would
-- then PERMANENTLY BLOCK the retry that would have reached her. The peer would
-- be un-tellable forever because we once failed to tell her.
--
-- Partial on `wamid IS NOT NULL`, so: any number of failure rows may accumulate
-- (each is evidence), and the first SUCCESS closes the forward to further
-- sends. That is exactly the cap the ruling asked for, expressed so that the
-- cap counts deliveries rather than attempts.
CREATE UNIQUE INDEX IF NOT EXISTS uq_referral_alerts_referral_sent
  ON public.referral_alerts (referral_id) WHERE wamid IS NOT NULL;

-- The 「Told」 read: given a page of forwards, which of them landed. Covers the
-- lookup the lead record performs once per page, never once per row.
CREATE INDEX IF NOT EXISTS idx_referral_alerts_referral
  ON public.referral_alerts (referral_id);

COMMENT ON TABLE public.referral_alerts IS
  'One row per outbound referral-alert send (R-G51.15). Written by src/lib/vendor/referralAlert.js and by nothing else; status is advanced by the Meta receipt webhook via relayStatus.js. NOT public.messages: conversation messages and outbound notifications are different planes.';
COMMENT ON COLUMN public.referral_alerts.wamid IS
  'Meta message id. NULL when the send failed before Meta saw it (no_phone, opted_out). UNIQUE where present, so the receipt router can never match ambiguously, and it is the ONLY field the sender-side 「Told」 state reads.';
COMMENT ON COLUMN public.referral_alerts.referral_id IS
  'The forward this alert announces. UNIQUE where wamid IS NOT NULL: one SUCCESSFUL alert per forward, while failed attempts may accumulate as evidence and never block a retry.';

-- ── SECTION 2 ──────────────────────────────────────────────────────────────
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS peer_discoverable boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.vendors.peer_discoverable IS
  'TDW_19 G5.1 / R-40.107. Whether this vendor appears in another vendor''s peer search. ON by default, and deliberately the opposite of 0140''s date_check_enabled: the peer search returns only business_name, routing_handle, category and city — every one already on the PUBLIC storefront card (vendorCard.js:213) — so this is a withdrawal from a directory built from facts she already publishes, not consent to a new exposure. Written only through PATCH /api/v2/vendor/me; read by the peer-search door, which requires all three of status=active, discover_paused=false and this column true.';

COMMIT;

-- ── VERIFY (run separately — R-40.31, one statement per paste) ──────────────
-- Its EXPECT names the constraints that must be present, never a count
-- (R-40.49). Section 1 EXPECT: nine columns; referral_alerts_pkey on (id); the
-- two FKs to lead_referrals and vendors, both ON DELETE CASCADE; and THREE
-- indexes beyond the pkey, of which uq_referral_alerts_wamid and
-- uq_referral_alerts_referral_sent are UNIQUE and BOTH carry
-- `WHERE (wamid IS NOT NULL)`. A unique index here without its WHERE clause is
-- the un-retryable-failure defect and must be treated as a failed migration.
--
--   select indexname, indexdef
--     from pg_indexes
--    where schemaname = 'public' and tablename = 'referral_alerts'
--    order by indexname;
--
-- Section 2 EXPECT: one row, is_nullable NO, column_default true.
--
--   select column_name, data_type, is_nullable, column_default
--     from information_schema.columns
--    where table_schema = 'public' and table_name = 'vendors'
--      and column_name = 'peer_discoverable';
--
-- OWED AFTER THIS RUNS: the PAIR snapshot gains a table and a column.
-- `docs/db/PUBLIC_SCHEMA.md` is regenerated at ladder 0138 and describes
-- neither; this file is their witness until the next regen, and anything about
-- them is cited from HERE by line, never from the snapshot.
--
-- ⚠ AND THE PLANE IS NOT LIVE UNTIL THE TWO SELECTS ABOVE RETURN THEIR SHAPE.
-- A bench cannot witness a migration it cannot reach — the G5.1 sitting-1
-- handover §9.2 banked that law after `lead_referrals` returned zero rows with
-- b51 fully green.
