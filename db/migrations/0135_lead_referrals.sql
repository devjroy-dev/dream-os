-- db/migrations/0135_lead_referrals.sql
-- TDW · BLOCK 19 · G5.1 — THE OVERFLOW EXCHANGE
-- (R-G51.2, R-G51.3, R-G51.4, R-G51.6, R-G51.9 · F-40.84, F-40.87)
--
-- Append-only, founder-run, idempotent. Number assigned by the chair (R-40.44)
-- because a sibling seat held 0134 while this was written.
--
-- ⚠ THE HOLE THIS FILE WAS WRITTEN ABOVE HAS SINCE BEEN FILLED, AND THE
--   OBLIGATION IT CARRIED IS DISCHARGED. At authoring (dream-os 0a43d09) the
--   ladder tip was 0133 and 0134 was empty, so this file sat one number clear of
--   the tip and named the register obligation that WOULD have fallen to 0134's
--   delivery had it landed afterwards. It landed FIRST: G2 sitting 1 banked
--   `0134_reviews_and_seal.sql` at 4d7a341, before this file runs.
--
--   So the ladder is CONTIGUOUS — 0133, 0134, 0135 — this file sits AT the tip,
--   and NEITHER delivery owes a record in db/migrations/OUT_OF_ORDER.json: that
--   register is for a number BELOW the tip, which neither of us is. Re-derived
--   by `ls db/migrations/ | sort | tail` at 4d7a341 at the moment of the cut, not
--   recalled and not carried from the paragraph this one replaced.
--
-- ⚠ FOUNDER-RUN IN THE SUPABASE EDITOR, BEFORE THE dream-os ZIP IS APPLIED.
--
-- ═══ SQL-PROVENANCE · R-40.27 — CONSTRAINTS FOR EVERY TABLE THIS FILE READS ══
-- Snapshot: docs/db/PUBLIC_SCHEMA.md, regenerated 2026-09-05 at ladder 0132
-- (dream-os d91ec6e). 0133 has landed since and this file's reads are unaffected
-- by it; 0133's own `leads.wedding_id` is cited below where it matters.
--
-- public.leads — columns :675 (27), constraints :1666-1672, verbatim:
--     [CHECK]       leads_wedding_date_precision_check
--         CHECK ((wedding_date_precision = ANY (ARRAY['day','month','year'])))
--     [PRIMARY KEY] leads_pkey  PRIMARY KEY (id)
--
--   ⚠ AND THE ABSENCE ABOVE IS THIS SITTING'S LOAD-BEARING FACT.
--   THERE IS NO CHECK ON `leads.state`. The kickoff supposed one at :1619+ and
--   there is none — the only CHECK on this table governs wedding_date_precision.
--   The state gate is APPLICATION-LEVEL: `ALLOWED_STATES` at
--   src/api/vendor/leads.js:90. So a `forwarded` state would have needed no DDL
--   at all — and would still have been wrong, because that vocabulary lives in
--   EIGHT homes across two planes (F-40.87), three of them under src/engine/
--   where W-1 forbids this sitting from writing. R-G51.3 ruled the state does
--   not move; the row below is the record instead. NO COLUMN IS ADDED TO
--   `leads` BY THIS FILE.
--
--   `leads.source` (ordinal 11) carries a database-level DEFAULT 'whatsapp' and
--   NO CHECK — free text, R-40.13, census on record at F-40.18. This file adds
--   no constraint to it: the new value 'peer_referral' (R-G51.4) is written by
--   `createLead` from ONE exported constant, and a CHECK here would be a second
--   home for a vocabulary the census showed is already open (ten values live).
--
-- public.vendors — columns :1130 (49), constraints :1938-1946, verbatim:
--     [CHECK]       vendors_vertical_check
--         CHECK ((vertical = ANY (ARRAY['wedding','couture'])))
--     [PRIMARY KEY] vendors_pkey  PRIMARY KEY (id)
--     [UNIQUE]      vendors_routing_handle_key  UNIQUE (routing_handle)
--   Neither CHECK touches anything below; both FKs added here are to `id`.
--
-- public.vendor_roster — columns :1105 (8), constraints: PRIMARY KEY only.
--   READ ONLY, never written by this file. It is the peer edge the forward door
--   authorises against (R-G51.1, `member_vendor_id IS NOT NULL`) — the same
--   predicate src/api/vendor/collab.js:528 already uses for its linked audience.
--   Named here so nobody looks for a peer table this file did not create: THERE
--   IS NO NEW PEER PLANE. The roster is the peer relationship's one home.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1 · THE PLANE  (R-G51.9) ────────────────────────────────────────────────
-- The shape the chair ruled: the master's §4 G5.1 sketch plus `new_lead_id`,
-- minus `outcome`.
--
-- ⚠ WHY THERE IS NO `outcome` COLUMN, ruled and recorded so it is not re-proposed.
-- An outcome is the PEER'S LEAD'S STATE, and that already exists on
-- `leads.state` of the row `new_lead_id` points at. A copy here would be a
-- second home for one fact, and the two would disagree the first time the peer
-- moved her lead to `booked` — which is precisely the moment the number matters.
-- The room reads through the FK when it ever needs an outcome.
--
-- ⚠ AND WHY `new_lead_id` IS NOT NULL.
-- R-G51.2: a refused forward files NO ROW. There is no such thing as a
-- lead_referrals record whose forward did not land — that state would be the
-- false-done wearing a table. If the insert has no new lead to point at, the
-- forward did not happen and nothing is written.
CREATE TABLE IF NOT EXISTS public.lead_referrals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The two vendors. CASCADE on both: a deleted vendor takes her side of the
  -- exchange with her, and a half-row naming a vendor who no longer exists
  -- would render as a blank peer in the other vendor's room forever.
  from_vendor_id  uuid NOT NULL REFERENCES public.vendors (id) ON DELETE CASCADE,
  to_vendor_id    uuid NOT NULL REFERENCES public.vendors (id) ON DELETE CASCADE,

  -- The original, and the peer's copy.
  --
  -- ⚠ THE TWO FKs CARRY DIFFERENT DELETE RULES ON PURPOSE.
  -- `lead_id` SET NULL: the sender may soft-delete or hard-delete her own lead
  -- later, and that must not erase the fact that she passed work to a peer —
  -- the balance is the peer's evidence as much as hers.
  -- `new_lead_id` CASCADE: if the peer's copy is gone, the forward has no
  -- landing place and the row is describing a delivery that no longer exists.
  -- Paired with the NOT NULL above, that means the row dies with it.
  lead_id         uuid NULL     REFERENCES public.leads (id) ON DELETE SET NULL,
  new_lead_id     uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,

  -- The sender's sentence to the peer. Nullable: R-G51's sheet does not require
  -- a note to send, and an empty string masquerading as a note is worse than a
  -- null (F-16.25's lesson one table over).
  note            text NULL,

  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 2 · THE ROOM'S TWO READS  (R-G51.6) ─────────────────────────────────────
-- The room asks exactly two questions and they are symmetric: what have I sent,
-- and what have I received. Two indexes, one per direction, each ordered so the
-- room's "last" column comes off the index rather than a sort.
--
-- NOT partial, unlike 0133:idx_leads_wedding. The reasoning there was that the
-- overwhelming majority of rows carry NULL; here EVERY row has both vendors by
-- NOT NULL, so there are no NULLs to decline to index.
CREATE INDEX IF NOT EXISTS idx_lead_referrals_from
  ON public.lead_referrals USING btree (from_vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_referrals_to
  ON public.lead_referrals USING btree (to_vendor_id, created_at DESC);

-- The sender's own lead record reads "Forwarded to …" off this column, one row
-- at a time, so it gets its own lookup rather than riding the from_vendor scan.
CREATE INDEX IF NOT EXISTS idx_lead_referrals_lead
  ON public.lead_referrals USING btree (lead_id)
  WHERE lead_id IS NOT NULL;

-- The peer's lead record reads "Forwarded by …" the same way, and this one is
-- UNIQUE: a lead is the landing place of at most one forward. Two rows pointing
-- at one `new_lead_id` would mean two vendors each believing they sent it, and
-- the peer's record would have to choose a referrer to render.
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_referrals_new_lead
  ON public.lead_referrals USING btree (new_lead_id);

-- ── 3 · WHAT IS DELIBERATELY NOT HERE ───────────────────────────────────────
-- NO UNIQUE (from_vendor_id, lead_id). A vendor may forward one enquiry to more
-- than one peer over time — she asks A, A goes quiet, she asks B. Forbidding
-- that in the schema would make the room's own count wrong (two forwards, one
-- row) and would refuse a thing the product exists to allow.
--
-- NO self-referral guard in SQL. `from_vendor_id <> to_vendor_id` is enforced at
-- the door, where the vendor can be TOLD why, rather than by a constraint whose
-- violation reaches her as a 500. The door is the only writer; see the bench
-- cell that proves a self-forward is refused before any insert.
--
-- NO money column, and there never is one on this plane. Master §7: no
-- commission, ever, on anything. The balance is counts (R-G51.6).

COMMENT ON TABLE public.lead_referrals IS
  'The overflow exchange (Block 19 G5.1). One row per forward that LANDED: a vendor passed an enquiry to a peer on her vendor_roster and createLead minted the peer''s copy. A refused forward — R-G51.2, the peer already holds that phone — writes NOTHING, so a row here is always a delivery that happened. The original lead''s state is UNTOUCHED by a forward (R-G51.3): this row is the record, not leads.state.';

COMMENT ON COLUMN public.lead_referrals.new_lead_id IS
  'The peer''s copy, minted by createLead with source=''peer_referral'' (PEER_REFERRAL_SOURCE, src/lib/vendor/leads.js). NOT NULL and UNIQUE: no row exists without a landed lead, and a lead is the landing place of at most one forward.';

COMMENT ON COLUMN public.lead_referrals.note IS
  'The sender''s sentence to the peer, rendered beneath "Forwarded by" on the peer''s lead record. Vendor-authored free text; never model-voiced, never shown to the couple (R-G51.7).';

COMMIT;

-- OWED AFTER THIS RUNS: the next pair regen describes `lead_referrals` for the
-- first time. Until then THIS FILE IS ITS SOLE WITNESS — cite it by line, never
-- the snapshot, for anything about this table. The snapshot's header will read
-- ladder 0133 (or 0134) and say nothing about this plane; that silence is
-- staleness, not absence.
