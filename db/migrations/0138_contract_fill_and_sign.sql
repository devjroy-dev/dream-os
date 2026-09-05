-- db/migrations/0138_contract_fill_and_sign.sql
-- TDW · BLOCK 19 · G3.2 — THE INSTRUMENT BECOMES A PRODUCT
-- (R-G32.1 · .3 · .4 · .5 · .6 · .7 · .8 · .10 · .12 · .13 · F-40.94)
--
-- Append-only, founder-run, idempotent. Number assigned by the chair (R-40.44).
--
-- ⚠ FOUNDER-RUN IN THE SUPABASE EDITOR, BEFORE THE dream-os ZIP IS APPLIED.
--   ONE STATEMENT PER PASTE BLOCK IS *NOT* REQUIRED HERE — R-40.31 is about the
--   editor showing only the last RESULT, and this file returns no result sets.
--   It runs whole, inside one transaction, and either lands or does not.
--
-- ═══ THE LADDER, DERIVED AT THE CUT ════════════════════════════════════════
-- `ls db/migrations/ | sort | tail` at dream-os 3efa47c returns 0136 as the
-- highest numbered file. **0137 CARRIES NO FILE.** It is G1.3's, reserved by the
-- chair and not yet landed.
--
-- SO THIS FILE SITS ONE NUMBER ABOVE THE TIP, WITH A HOLE BENEATH IT, AND OWES
-- **NO** RECORD IN `db/migrations/OUT_OF_ORDER.json`. That register is for a
-- number BELOW the applied tip, which 0138 is not — its own _README says the
-- formatter aborts on a record whose number is not below the tip.
--
-- ⚠ THE OBLIGATION MOVES TO G1.3, AND IS NAMED HERE SO IT IS NOT ORPHANED.
--   If 0137 lands AFTER this file, it will be filling a hole beneath the tip and
--   **that delivery owes the OUT_OF_ORDER record**, not this one. If 0137 lands
--   first, the ladder is contiguous and nobody owes anything. Neither outcome is
--   this seat's to choose; both are stated so whichever happens is met as a known
--   item rather than a surprise (0135's own header is the precedent).
--
-- ═══ SQL-PROVENANCE · R-40.27 — CONSTRAINTS FOR EVERY TABLE THIS FILE TOUCHES ═
-- Snapshot: docs/db/PUBLIC_SCHEMA.md at dream-os d91ec6e, ladder 0132.
--
-- ⚠ THE SNAPSHOT IS STALE BY FOUR MIGRATIONS AND THAT IS STATED, NOT GLOSSED.
--   F-40.99 was filed against 0133 alone; the chair widened it to 0133–0136 on
--   2026-09-06. `0134_reviews_and_seal.sql` added `public.reviews_asked` and
--   `public.vendor_seal`; `0135_lead_referrals.sql` added `public.lead_referrals`;
--   `0136_consent_attempts.sql` added `weddings.consent_attempts`. **This file
--   touches none of those four tables and reads none of them**, so every citation
--   below still reads what it read. The cure is the PAIR regen, not an edit here.
--
-- public.contracts — columns :232 (15), constraints :1402-1406, verbatim:
--     [CHECK]       contracts_state_check
--         CHECK ((state = ANY (ARRAY['draft','sent','signed','cancelled'])))
--     [PRIMARY KEY] contracts_pkey            PRIMARY KEY (id)
--   FKs :2126-2133 — client_id, invoice_id, lead_id (all SET NULL), vendor_id
--   (CASCADE). Indexes :2695 — contracts_client_idx, contracts_invoice_idx.
--   ⚠ THE CHECK IS **NOT WIDENED**. `draft | sent | signed | cancelled` carries
--   this whole sitting: a contract awaiting its deposit is `signed` with
--   `deposit_received_at` NULL, and a fifth state would be a second home for a
--   fact one column already holds. Every column added below is NULLable or has a
--   DEFAULT, so no existing row can violate anything and no ALTER can fail on
--   data. Neither index is touched, dropped or redefined.
--
-- public.events — columns :534 (18), constraints :1573-1587, verbatim:
--     [CHECK] events_blocked_slot_check
--         CHECK (((kind <> 'blocked') OR (slot IS NOT NULL)))
--     [CHECK] events_kind_check
--         CHECK ((kind = ANY (ARRAY['shoot','call','meeting','task','reminder',
--                 'recce','fitting','trial','family','ceremony','social',
--                 'blocked','other'])))
--     [CHECK] events_owner_xor
--         CHECK (((vendor_id IS NULL) <> (couple_id IS NULL)))
--     [CHECK] events_slot_check
--         CHECK ((slot = ANY (ARRAY['morning','noon','evening','full_day'])))
--     [CHECK] events_state_check
--         CHECK ((state = ANY (ARRAY['upcoming','done','cancelled'])))
--     [PRIMARY KEY] events_pkey               PRIMARY KEY (id)
--   ⚠ `events_state_check` IS NOT WIDENED AND `public.events` GAINS NO COLUMN.
--   R-G32.1: `'booked'` is a fact about a CONTRACT, not a calendar row. This file
--   adds an FK *from* contracts *to* events and writes nothing on events, ever.
--   `events_owner_xor` is the reason the FK points that way and not the other:
--   an event is owned by a vendor XOR a couple, and a contract is neither.
--
-- public.clients — columns :169 (12), constraints :1355-1357, verbatim:
--     [PRIMARY KEY] clients_pkey              PRIMARY KEY (id)
--   No CHECK. Read-only to this file; `partner_2_name` gets no column here and
--   lives in `contracts.terms` (R-G32.3, R-G32.8).
--
-- public.invoices — columns :640, constraints :1642-1655, verbatim:
--     [CHECK] invoices_amount_advance_check
--         CHECK (((amount_advance IS NULL) OR (amount_advance >= 0)))
--     [CHECK] invoices_amount_paid_check      CHECK ((amount_paid >= 0))
--     [CHECK] invoices_amount_total_check     CHECK ((amount_total >= 0))
--     [CHECK] invoices_state_check
--         CHECK ((state = ANY (ARRAY['unpaid','advance_paid','paid','cancelled'])))
--     [PRIMARY KEY] invoices_pkey             PRIMARY KEY (id)
--     [UNIQUE] invoices_vendor_number_unique  UNIQUE (vendor_id, invoice_number)
--   Read-only. `contracts.invoice_id` already exists and is unchanged.
--
-- public.payment_schedules — columns :811, constraints :1752-1765, verbatim:
--     [CHECK] payment_schedules_amount_due_check   CHECK ((amount_due > 0))
--     [CHECK] payment_schedules_pct_check
--         CHECK (((pct > 0) AND (pct <= 100)))
--     [CHECK] payment_schedules_state_check
--         CHECK ((state = ANY (ARRAY['pending','paid','waived'])))
--     [PRIMARY KEY] payment_schedules_pkey    PRIMARY KEY (id)
--     [UNIQUE] payment_schedules_invoice_id_ordinal_key UNIQUE (invoice_id, ordinal)
--   ⚠ READ-ONLY, AND THE DIRECTION MATTERS. R-G32.6 makes
--   `contracts.deposit_pct` the ONE home; milestone 1 is DERIVED from it when an
--   invoice exists. This file therefore writes no schedule row and adds no column
--   here. `payment_schedules_pct_check` is why `contracts_deposit_pct_check`
--   below is written to the SAME bounds — two homes for one number would be the
--   defect R-G32.6 exists to prevent, and matching bounds is the least this file
--   can do while they are one number in two tables' worth of arithmetic.
--
-- public.vendors — columns :1130, constraints :1946+. Read-only. `gstin` :1140,
--   `upi_id` :1139, `account_name` :1178, `account_number` :1179, `ifsc` :1180,
--   `city` :1138, `address` :1181 all print on the instrument and none moves.
--   ⚠ `vendors.category` :1136 CARRIES NO CHECK. R-G32.13's annex map is a
--   constant in one home and the code does not pretend the database enforces it.
--
-- public.otp_sessions — columns :790 (5), constraints :1736-1742, verbatim:
--     [CHECK] otp_sessions_purpose_check
--         CHECK ((purpose = ANY (ARRAY['login','reset','demo_enquiry',
--                 'circle_join','demo_claim'])))
--     [PRIMARY KEY] otp_sessions_pkey         PRIMARY KEY (phone)
--   ⚠ **NOT WIDENED, AND NOT USED** — R-G32.10, on **F-40.114**. Its PK is `phone`, so a
--   couple mid-login on her own account and mid-signing on a vendor's contract
--   would overwrite one OTP with the other, silently. The sign OTP's witness
--   lives on the `contract_signatures` row below, bound to ONE contract, which is
--   what clause 12 describes anyway.

BEGIN;

-- ══════════════════════════════════════════════════════════════════════════
-- 1 · public.contract_profiles — HER STANDING POLICY, ASKED ONCE (R-G32.3 a)
-- ══════════════════════════════════════════════════════════════════════════
-- ONE ROW PER VENDOR. `fields` is jsonb and not ninety columns, and the reason
-- is F-40.94's own shape: the PROFILE set is a function of the INSTRUMENT, and
-- the instrument is a spec file that will be edited. Ninety columns would make
-- every future edit of v3 a migration; a jsonb makes it a mock and a veto.
--
-- ⚠ NOTHING IN `fields` IS AUTHORED BY TDW. Not a price, not a percentage, not
-- a day-count. The register's one law. A DEFAULT here would be TDW choosing a
-- vendor's cancellation slab, so the default is an EMPTY OBJECT and a blank
-- prints as a blank (veto sheet rows 20, 22, 27, 38 and their sentence, row 23).
CREATE TABLE IF NOT EXISTS public.contract_profiles (
  vendor_id  uuid PRIMARY KEY REFERENCES public.vendors(id) ON DELETE CASCADE,
  fields     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.contract_profiles IS
  'G3.2 R-G32.3(a). One row per vendor: the PROFILE class of TDW_19_CONTRACT_FIELD_REGISTER_v1.md — her prices and policies, asked once, reused on every contract. jsonb because the key set is the instrument''s and the instrument is a spec file. No key is authored by TDW.';

-- ══════════════════════════════════════════════════════════════════════════
-- 2 · public.contract_signatures — ONE ROW PER SIGNING (R-G32.4)
-- ══════════════════════════════════════════════════════════════════════════
-- A SIGNING IS AN EVENT, NOT A PROPERTY OF A CONTRACT. Clause 12 promises three
-- things `contracts` has no room for — who signed, on what witness, over what
-- digest — and a paper signing (clause 12's last line) writes a row here with a
-- NULL OTP witness rather than half-filling four columns on the contract.
--
-- ⚠ THE OTP LIVES HERE AND NOT IN `otp_sessions` — R-G32.10, see the header.
-- `otp_hash` is a hash, never the code. `otp_attempts` counts WRONG answers only
-- and a correct one does not reset it, for the reason 0136 states about the
-- last-four check: a token someone has been working on is not forgiven by a
-- lucky third guess.
CREATE TABLE IF NOT EXISTS public.contract_signatures (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  vendor_id     uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  signer_phone  text,
  channel       text NOT NULL DEFAULT 'otp',
  -- THE CAPABILITY TOKEN. `weddings.consent_token` is the precedent and so is its
  -- constitution: the token in the URL is the WHOLE credential, and SPENDING IT IS
  -- SETTING IT NULL rather than raising a flag. A NULL token cannot be found by the
  -- lookup, so a spent token, a forged one, an expired one and one that never
  -- existed all reach the SAME miss — enforced by the read, never by a branch that
  -- a later edit could reorder.
  sign_token    text UNIQUE,
  token_expires_at timestamp with time zone,
  otp_hash      text,
  otp_expires_at timestamp with time zone,
  otp_attempts  integer NOT NULL DEFAULT 0,
  verified_at   timestamp with time zone,
  document_sha256 text,
  sealed_path   text,
  signed_at     timestamp with time zone,
  created_at    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contract_signatures_channel_check
    CHECK ((channel = ANY (ARRAY['otp'::text, 'paper'::text])))
);

-- ONE OPEN SIGNING PER CONTRACT. Not one row per contract — a contract sent,
-- expired and re-sent has a history worth keeping — but only one row may be
-- UNVERIFIED at a time, so a second send cannot leave two live codes for one
-- document. Enforced by the database, never by a branch in a door.
CREATE UNIQUE INDEX IF NOT EXISTS contract_signatures_open_key
  ON public.contract_signatures (contract_id)
  WHERE (verified_at IS NULL);

CREATE INDEX IF NOT EXISTS contract_signatures_contract_idx
  ON public.contract_signatures (contract_id);

CREATE INDEX IF NOT EXISTS contract_signatures_token_idx
  ON public.contract_signatures (sign_token) WHERE (sign_token IS NOT NULL);

COMMENT ON TABLE public.contract_signatures IS
  'G3.2 R-G32.4. One row per signing of one contract. Clause 12''s record: signer, OTP witness, SHA-256 digest, sealed copy, timestamp. A paper signing writes a row with channel=paper and a NULL OTP witness. The OTP lives here and NOT on public.otp_sessions, whose PK is phone (R-G32.10).';

-- ══════════════════════════════════════════════════════════════════════════
-- 3 · public.contracts — THE FIVE COLUMNS (R-G32.1 · .3 · .6 · .7)
-- ══════════════════════════════════════════════════════════════════════════
-- ⚠ `event_id` IS THE ANCHOR AND NOT THE FUNCTION LIST — R-G32.7. Clause 3's
-- table is one row per function and is READ AT RENDER from the couple's own
-- events; this single FK is the ONE date the deposit lock applies to. A join
-- table would be a second home for a set the calendar already holds.
--
-- ON DELETE SET NULL, deliberately: a contract that has been SIGNED must survive
-- the deletion of a calendar row. The paper is the agreement; the event is a
-- convenience that points at it.
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;

-- THE PER-CONTRACT AND ANNEX FILLS (R-G32.3 b and c, R-G32.8).
-- `terms` holds what she types for THIS couple — partner 2's name, each
-- function's venue and city (which `public.events` does not have and does not
-- gain), the named professional. `annexes` is keyed by annex letter.
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS terms jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS annexes jsonb NOT NULL DEFAULT '{}'::jsonb;

-- THE DEPOSIT, WITH ONE HOME — R-G32.6, amending the register's §4 rule 1.
-- `deposit_pct` is the source; milestone 1 of `payment_schedules` is DERIVED
-- from it when an invoice exists, never the reverse. NULL means "not set", which
-- is what the record prints (veto row 27) — it does NOT mean zero, and the CHECK
-- forbids zero so the two can never be confused.
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS deposit_pct numeric(5,2);

-- THE LOCK. R-G32.1: `events.state` stays `upcoming | done | cancelled` and a
-- locked date is an UPCOMING event whose contract carries this timestamp. The
-- derivation is exported ONCE (src/lib/vendor/dateLock.js) and every calendar
-- reader calls it — occupancy.js's own header warns that unifying two of the
-- five lists in that neighbourhood is the F-04.36 regression, and re-deriving
-- this at each reader would be the same mistake wearing a new name.
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS deposit_received_at timestamp with time zone;

-- ⚠ NAMED, NOT ANONYMOUS, so a later reader can cite it the way this file cites
-- `payment_schedules_pct_check` — and written to the SAME bounds as that CHECK,
-- because R-G32.6 makes them one number.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contracts_deposit_pct_check'
  ) THEN
    ALTER TABLE public.contracts
      ADD CONSTRAINT contracts_deposit_pct_check
      CHECK ((deposit_pct IS NULL) OR ((deposit_pct > 0) AND (deposit_pct <= 100)));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS contracts_event_idx
  ON public.contracts (event_id) WHERE (event_id IS NOT NULL);

COMMENT ON COLUMN public.contracts.event_id IS
  'G3.2 R-G32.7. THE ANCHOR — the one date the deposit lock applies to. Clause 3''s function table is read at render from the couple''s events and is never stored here.';
COMMENT ON COLUMN public.contracts.deposit_pct IS
  'G3.2 R-G32.6. THE ONE HOME for the deposit percentage. payment_schedules milestone 1 is derived from it when an invoice exists, never the reverse. NULL = not set; the CHECK forbids 0 so the two cannot be confused. Default 30 is offered by the composer (R-40.37) and is not a database default: TDW authors no number in this instrument.';
COMMENT ON COLUMN public.contracts.deposit_received_at IS
  'G3.2 R-G32.1. THE DATE LOCK. events.state is NOT widened; a locked date is an upcoming event whose contract carries this timestamp. Derived once in src/lib/vendor/dateLock.js.';

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- WITNESS — run after COMMIT, in its own paste block (R-40.31: the editor shows
-- only the last result, and this returns one).
-- ══════════════════════════════════════════════════════════════════════════
-- SELECT column_name, data_type, is_nullable, column_default
--   FROM information_schema.columns
--  WHERE table_schema='public' AND table_name='contracts'
--    AND column_name IN ('event_id','terms','annexes','deposit_pct','deposit_received_at')
--  ORDER BY column_name;
