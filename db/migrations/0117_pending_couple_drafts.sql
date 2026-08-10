-- 0117_pending_couple_drafts.sql
-- TDW_06 · THE RELAY SEAM · SITTING ONE (W-D) — THE PENDING-DRAFT STORE
--
-- WHY THIS TABLE EXISTS, IN ONE SENTENCE: it makes 2026-08-08 IMPOSSIBLE rather
-- than unlikely. On that date the vendor agent composed a bride-facing message,
-- reported it sent, and no row on her thread ever carried it. With a staged
-- draft, "the bytes I showed you are the bytes I sent" is provable by EQUALITY
-- against a stored row, and "no send without an affirmative" is a foreign-key
-- fact rather than a prompt instruction.
--
-- ORDER, RULED: THE STORE BEFORE THE HAND. A send hand without this store
-- recreates 08-08 with a real organ — the message actually goes and the founder
-- still never saw it — which is strictly worse than the fabrication.
--
-- STRUCTURAL MIRROR: `public.pending_event_proposals` (8 columns, witnessed at
-- docs/db/PUBLIC_SCHEMA.md:713-720), the only staging table in the estate that
-- CONSTRAINS ITS REGISTER. Its `resolution` CHECK is witnessed at
-- PUBLIC_SCHEMA.md:1496, its FK at :1726, its partial index at :2663 — note the
-- live index name carries an `idx_` prefix, which this file copies.
--
-- NOT A MIRROR: `public.pending_actions`. Its 0002-era CREATE
-- (db/migrations/0002_agent_substrate.sql) has a `state` column with NO CHECK,
-- zero readers in src/, and it is absent from the witnessed schema dump.
-- FOUNDER-WITNESSED 2026-08-11 on his own Supabase screen: an
-- information_schema.tables query for the pair returns pending_event_proposals
-- ALONE. **The table does not exist in production.** It contributed column SHAPE
-- (expires_at, conversation_id) to the design below and nothing on vocabulary.
--
-- THE `approved`-BEFORE-`sent` STATE IS DELIBERATE (the F-08 two-phase class). A
-- crash between the founder's affirmative and the transport's acknowledgement
-- must be VISIBLE as `approved`-and-stale, never invisible. A store that flipped
-- straight to `sent` would tell us a message went out that never left.
--
-- THIS SITTING WRITES NO ROWS. The staging writer and the send hand are the NEXT
-- sitting. This migration is the store alone.
--
-- ── SQL-PROVENANCE (protocol §10): every column carries its witness ──────────
-- Run this in the Supabase SQL editor. Verify with the information_schema
-- SELECT at the foot of this file.

BEGIN;

CREATE TABLE IF NOT EXISTS public.pending_couple_drafts (
  -- id: gen_random_uuid() copied from the mirror's own default.
  -- WITNESS: docs/db/PUBLIC_SCHEMA.md:713 (pending_event_proposals col 1).
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- vendor_id: whose words these are. NOT NULL + CASCADE, mirror-verbatim.
  -- WITNESS: PUBLIC_SCHEMA.md:714 (col 2, `vendor_id uuid NOT NULL`) and
  --          PUBLIC_SCHEMA.md:1726 (the FK, ON DELETE CASCADE).
  --          Target column `public.vendors.id` witnessed at PUBLIC_SCHEMA.md:980.
  vendor_id         uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,

  -- conversation_id: the couple_thread the draft is destined for. NULLABLE, and
  -- deliberately so: a draft may be staged BEFORE the thread exists (the vendor
  -- can name a bride the estate has no row for yet), which is the same order
  -- `replyToCouple` already handles with find-or-create.
  -- WITNESS: PUBLIC_SCHEMA.md:193 (`public.conversations` col 1, `id uuid`).
  --          Shape precedent: pending_actions' own conversation_id FK.
  conversation_id   uuid REFERENCES public.conversations(id) ON DELETE CASCADE,

  -- couple_phone: the OTHER half of F-06.147's (business PNID, user MSISDN)
  -- pair. Stored so the draft can be re-keyed to a window check without a join,
  -- and so a draft survives the thread being created later.
  -- WITNESS: PUBLIC_SCHEMA.md:196 (`public.conversations` col 4,
  --          `counterparty_phone text`) — the same value, same format (+E164 on
  --          the couple lane, per the founder's 2026-08-11 paste).
  couple_phone      text NOT NULL,

  -- body: THE BYTES. This column is the equality subject — what the vendor was
  -- shown must equal what the transport was handed, and both must equal this.
  -- WITNESS: PUBLIC_SCHEMA.md:598 (`public.messages` col 5, `body text`).
  -- NOT NULL here where messages.body is nullable: an empty draft is not a draft.
  body              text NOT NULL,

  -- state: the lifecycle, CONSTRAINED. `pending_event_proposals` is the only
  -- staging table in the estate that constrains its register and this one
  -- constrains its own. `staged` -> `approved` -> `sent`, with `refused` and
  -- `expired` as the other two terminals.
  -- WITNESS for the CHECK form: PUBLIC_SCHEMA.md:1496-1497
  --   CHECK ((resolution = ANY (ARRAY['save_all'::text, ...])))
  state             text NOT NULL DEFAULT 'staged'
                    CHECK (state = ANY (ARRAY['staged'::text, 'approved'::text,
                                              'sent'::text, 'refused'::text,
                                              'expired'::text])),

  -- twilio_sid: the sid discipline, INSIDE the new organ from birth. F-06.143 is
  -- the estate's majority condition — twelve files send and persist no sid, so an
  -- asynchronous Meta failure updates zero rows and the failure to record is
  -- itself unrecorded. The bride lane is one of only two places that does this
  -- right (src/lib/brideInbound.js, symbol `handleBrideInbound`), and this column
  -- is that discipline copied forward rather than re-learned.
  -- WITNESS: PUBLIC_SCHEMA.md:603 (`public.messages` col 10, `twilio_sid text`).
  twilio_sid        text,

  -- created_at / resolved_at: mirror-verbatim. `resolved_at IS NULL` is the OPEN
  -- predicate and it is stamped at EVERY terminal transition (sent, refused,
  -- expired), never only at success.
  -- WITNESS: PUBLIC_SCHEMA.md:718 and :719 (cols 6 and 7).
  created_at        timestamptz NOT NULL DEFAULT now(),
  resolved_at       timestamptz,

  -- expires_at: FOUNDER-RULED 2026-08-11 at 24 hours. A staged bride-facing
  -- draft nobody answered must not be sendable later — and 24h is not an
  -- arbitrary number here, it is the WhatsApp customer-service window's own
  -- span, so a draft cannot outlive the window that would have carried it.
  -- Shape precedent: pending_actions' `expires_at timestamptz`
  -- (db/migrations/0002_agent_substrate.sql) — shape only; that table does not
  -- exist in production.
  expires_at        timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

-- The OPEN index, mirror-verbatim in form and in its `idx_` prefix.
-- WITNESS: PUBLIC_SCHEMA.md:2663
--   CREATE INDEX idx_pending_event_proposals_vendor_open
--     ON public.pending_event_proposals USING btree (vendor_id, created_at DESC)
--     WHERE (resolved_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_pending_couple_drafts_vendor_open
  ON public.pending_couple_drafts USING btree (vendor_id, created_at DESC)
  WHERE (resolved_at IS NULL);

-- The pair lookup: "is there an open draft for this bride?" The window predicate
-- keys on the phone across the lane (src/lib/vendor/coupleWaWindow.js, symbol
-- `coupleWindowOpen`) and the draft lookup must be able to key the same way.
CREATE INDEX IF NOT EXISTS idx_pending_couple_drafts_phone_open
  ON public.pending_couple_drafts USING btree (couple_phone, created_at DESC)
  WHERE (resolved_at IS NULL);

COMMIT;

-- ── VERIFY (read-only; run after the block above) ────────────────────────────
-- Expect 10 rows for the columns, 1 row for the CHECK, 2 rows for the indexes.
--
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'pending_couple_drafts'
-- ORDER BY ordinal_position;
--
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.pending_couple_drafts'::regclass AND contype = 'c';
--
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename = 'pending_couple_drafts'
-- ORDER BY indexname;

-- ── REVERT — FULLY COMMENTED, NEVER A SECOND RUNNABLE BLOCK ──────────────────
-- (the conditional-withheld rule, protocol §9: a conditional block is withheld
-- until its condition arrives; anything runnable left in a transcript will be
-- run. To use this, uncomment the four lines and paste them alone.)
--
-- THIS REVERT IS LOSSY BY CONSTRUCTION and that is stated, not discovered: the
-- table holds bride-facing bytes a vendor may have approved. Dropping it destroys
-- the only proof of what was shown and what was sent. Under the house
-- destructive-action law this needs founder sign-off recorded, an export taken
-- FIRST, and the action logged in the handover. As of this migration the table is
-- empty and has no writer, so a revert run TODAY is lossless — that ceases to be
-- true the moment the hand sitting ships.
--
-- BEGIN;
--   DROP INDEX IF EXISTS public.idx_pending_couple_drafts_phone_open;
--   DROP INDEX IF EXISTS public.idx_pending_couple_drafts_vendor_open;
--   DROP TABLE IF EXISTS public.pending_couple_drafts;
-- COMMIT;
