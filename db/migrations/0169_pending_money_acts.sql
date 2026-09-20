-- db/migrations/0169_pending_money_acts.sql
-- CE-44 · LC-Victor P5 · the confirmation table (read-first item 6; B item 3; R-44.21 (c); F-44.53).
-- Number 0169 allocated by the chair (C-43.8). Ladder tail at authoring: 0168_vendor_packages.sql.
--
-- WHAT IT HOLDS: one money act the door has STAGED and asked her to confirm, and nothing else.
-- The door stages before any act that moves money (a booking, an advance, a payment), speaks the
-- founder's confirmation byte, and applies only on her whole-message yes. Keyed by vendor, so a
-- yes on either lane finds it.
--
-- WHY NOT 0117 (pending_couple_drafts): its couple_phone and body are NOT NULL and describe a
-- message to a bride. This is not a message; it is an act waiting for a yes.
--
-- ROW LEVEL SECURITY, ENABLED WITH NO POLICY (chair's addition, CE-44; F-44.55's reason). Every
-- P5 read and write of this table goes through dream-os's service-role client (src/index.js:51
-- builds it from SUPABASE_SERVICE_ROLE_KEY; :83 hands it to the app lane as app.locals.supabase;
-- :149 to :156 hand the same client to the WhatsApp lane in vendorInboundDeps), and the service
-- role bypasses RLS, so the door is unchanged. With RLS on and no policy, the anon and
-- authenticated roles reach no row of this table through PostgREST, whatever the estate's other
-- tables do. F-44.55 (RLS on the estate unwitnessed) is not this migration's to cure; this table
-- simply does not join that exposure.
--
-- WITNESS: public.vendors.id uuid, docs/db/PUBLIC_SCHEMA.md:1553 section (col 1). Discipline and
-- CHECK form copied from 0117 (PUBLIC_SCHEMA.md:1150 section; its CHECK at :2422).
BEGIN;

CREATE TABLE IF NOT EXISTS public.pending_money_acts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- whose act this is. NOT NULL + CASCADE, as 0117.
  vendor_id    uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  -- the act, closed to the three money acts P5 covers (R-44.21 (a)). A later packet that stages
  -- another act widens this CHECK in its own migration.
  act          text NOT NULL
               CHECK (act = ANY (ARRAY['booking_confirmed'::text, 'advance_paid'::text, 'milestone_paid'::text])),
  -- the resolved request the door will run on yes: the listener's act plus what the DOOR resolved
  -- (lead id, milestone id, ISO date). Never a figure the listener returned (B item 2).
  request      jsonb NOT NULL,
  -- the lane she was asked on; the result speaks on the lane of her yes.
  lane         text NOT NULL CHECK (lane = ANY (ARRAY['pwa'::text, 'whatsapp'::text])),
  -- the lifecycle, the five words ruled in read-first item 6.
  state        text NOT NULL DEFAULT 'staged'
               CHECK (state = ANY (ARRAY['staged'::text, 'confirmed'::text, 'declined'::text,
                                         'expired'::text, 'applied'::text])),
  -- the hand's structured result once run (handResult.js shape), so a yes that the writer then
  -- refused is on the record as what happened, never inferred from a line.
  outcome      jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  -- stamped at EVERY terminal transition (declined, expired, applied), as 0117 does.
  resolved_at  timestamptz,
  -- R-44.21 (c), the founder's number: 15 minutes. Its own constant, not read from the engine's
  -- CONVERSATION_TIMEOUT_MIN. The door also checks expires_at on read; the default is the backstop.
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '15 minutes')
);

-- ONE OPEN ROW PER VENDOR, structurally (item 3, ruled). The door expires the old row before it
-- stages a new one; a race that skipped that step is refused by the database, not by luck.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_money_acts_vendor_open
  ON public.pending_money_acts USING btree (vendor_id)
  WHERE (resolved_at IS NULL);

-- F-44.55's reason, stated in the header: RLS on, no policy; the service role bypasses it.
ALTER TABLE public.pending_money_acts ENABLE ROW LEVEL SECURITY;

COMMIT;
