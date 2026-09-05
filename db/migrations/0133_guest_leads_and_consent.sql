-- db/migrations/0133_guest_leads_and_consent.sql
-- TDW · BLOCK 19 · G1.2 — THE GUEST LEAD AND THE OFF-PLATFORM COUPLE
-- (R-G12.3, R-G12.4, R-G12.5, R-G12.11 · F-40.49, F-40.79)
--
-- Append-only, founder-run, idempotent. Ladder tip before this file: 0132.
-- Derived by `ls db/migrations/ | sort | tail`, not recalled. This sits AT the
-- tip, so it takes NO record in db/migrations/OUT_OF_ORDER.json — that register
-- is for numbers BELOW the tip, and the formatter aborts on anything else.
--
-- ⚠ FOUNDER-RUN IN THE SUPABASE EDITOR, BEFORE THE pwa ZIP IS APPLIED.
--
-- ═══ SQL-PROVENANCE · R-40.27 — CONSTRAINTS FOR EVERY TABLE WRITTEN ═════════
-- This file WRITES three tables. The snapshot was regenerated at ladder 0132 on
-- 2026-09-05 (dream-os d91ec6e), so `weddings`, `wedding_credits` and
-- `wedding_photos` are described there for the first time and this file cites
-- the SNAPSHOT rather than 0131/0132 — the debt those two carried is paid.
--
-- public.leads — columns :675 (27), constraints :1666-1672, verbatim:
--     [CHECK]       leads_wedding_date_precision_check
--         CHECK ((wedding_date_precision = ANY (ARRAY['day','month','year'])))
--     [PRIMARY KEY] leads_pkey  PRIMARY KEY (id)
--   NEITHER touches the column added below. `wedding_id` is a new nullable uuid
--   with no default, so no existing row can violate anything and the ALTER
--   cannot fail on data.
--
--   ⚠ AND THE PRECISION CHECK IS WHY THERE IS NO `intent_month` COLUMN.
--   R-G12.11 ruled FORK 10 = (b): a guest's month rides the columns that already
--   exist — `wedding_date` (ordinal 6) plus `wedding_date_precision` (ordinal 24)
--   set to 'month', which that CHECK already permits. A new `intent_month` would
--   have had exactly one writer and one reader, forever, beside a column pair
--   that already means the same thing and that the whole lead lifecycle reads.
--
-- public.weddings — columns :1224 (13), constraints :1998-2006, verbatim:
--     [CHECK]       weddings_visibility_check
--         CHECK ((visibility = ANY (ARRAY['draft','published'])))
--     [PRIMARY KEY] weddings_pkey             PRIMARY KEY (id)
--     [UNIQUE]      weddings_owner_slug_key   UNIQUE (owner_vendor_id, slug)
--   NEITHER CHECK mentions the column added below, and `consent_token` is
--   nullable with no default, so the ALTER cannot fail on existing rows.
--   `idx_weddings_live` (0131:69-70) is NOT touched, NOT dropped and NOT
--   redefined: the public door keeps reading the page's own `couple_consent`
--   exactly as it does today.
--
-- public.couples — columns :362 (24), read ONLY, never written by this file.
--   `couple_set_publish()` (0132:113) remains the writer of her standing answer.
--   Named here so nobody looks for a second one below.
--
-- public.wedding_credits — columns :1198 (10), constraints :1978-1990.
--   NOT WRITTEN by this file. Cited because the function below deliberately does
--   NOT touch it: a consent decision is about the PAGE, never about a credit.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1 · THE GUEST LEAD'S PAGE  (R-G12.3 / F-40.79) ──────────────────────────
-- A guest downloads photographs from ONE wedding page, and the lead she becomes
-- should be able to say which. Without it a `source='wedding_guest'` row is a
-- phone number with no provenance: the vendor cannot tell which wedding earned
-- it, and G1.3's "book the same team" has nothing to join on.
--
-- NULLABLE, and that is not laziness. `leads` predates this block by a year and
-- carries rows from six other sources; every one of them has no wedding and
-- never will. A NOT NULL here would be a lie about the table's own history.
--
-- ON DELETE SET NULL: a vendor deleting a wedding page must not delete the leads
-- it earned her. The lead is hers; the page was only where it came from.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS wedding_id uuid NULL REFERENCES public.weddings (id) ON DELETE SET NULL;

-- Partial: the overwhelming majority of leads carry NULL and always will, and
-- the only query that uses this column asks for ONE page's leads. Indexing the
-- NULLs would be paying for rows nobody looks up — 0132:89's own reasoning.
CREATE INDEX IF NOT EXISTS idx_leads_wedding ON public.leads USING btree (wedding_id)
  WHERE wedding_id IS NOT NULL;

COMMENT ON COLUMN public.leads.wedding_id IS
  'The wedding page a guest downloaded from, when source=''wedding_guest''. NULL for every other source. Written only by createLead via the guest download door.';

-- ── 2 · THE OFF-PLATFORM COUPLE'S TOKEN  (R-G12.4 / F-40.49) ────────────────
-- F-40.49: a page whose couple has no TDW account CANNOT be published under
-- R-G11c.2, and that is most of a photographer's back catalogue. `couple_id` is
-- NULL on those pages permanently, so `couple_set_publish(p_couple_id, ...)`
-- can never reach them — it is scoped by a couple row that does not exist.
--
-- The token is the whole credential (the crew page's constitution, inherited by
-- app/credits/[token]). uuid_generate_v4 is 122 bits, the same posture
-- crew.js:156 reasons about.
--
-- ⚠ ONE DECLARED DEPARTURE FROM THAT CONSTITUTION: THIS TOKEN EXPIRES.
-- R-G12.4, and the reason is a difference in POWER, not a change of mind. A
-- credit token claims ONE name on ONE page and never expires. This token flips
-- `couple_consent` on a page and can be used again to flip it back — a standing
-- grant over published material. One posture per power: name-claim tokens live
-- forever, consent tokens expire at 30 days.
--
-- NO DEFAULT. A token is minted deliberately, by the door, for a page whose
-- couple is off-platform — never sprayed across every row at ALTER time. A
-- default would mint a live credential for every existing page and for every
-- page created afterwards, including ones whose couple IS on TDW and whose
-- consent is already governed by her switch. Two doors to one decision.
ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS consent_token    uuid        NULL,
  ADD COLUMN IF NOT EXISTS consent_sent_at  timestamptz NULL,
  ADD COLUMN IF NOT EXISTS consent_phone    text        NULL;

-- UNIQUE so a token resolves to at most one page, and PARTIAL so the NULLs —
-- which are the majority and always will be — do not collide with each other.
CREATE UNIQUE INDEX IF NOT EXISTS idx_weddings_consent_token
  ON public.weddings USING btree (consent_token)
  WHERE consent_token IS NOT NULL;

COMMENT ON COLUMN public.weddings.consent_token IS
  'The off-platform couple''s capability token (R-G12.4). NULL unless the vendor has sent a consent ask. Expires 30 days after consent_sent_at, enforced in wedding_set_consent(). Never returned on any public wire.';
COMMENT ON COLUMN public.weddings.consent_phone IS
  'The number the consent ask was sent to. NEVER leaves the estate on a public wire (R-G11.6, same law as wedding_credits.phone).';

-- ── 3 · THE THIRD AND LAST WRITER OF couple_consent  (R-G12.5) ──────────────
-- THE WRITER SET IS NOW CLOSED AT THREE, and the seat names all three so the
-- bench can prove no vendor door is among them:
--   1. couple_set_publish()          (0132:113) — the on-platform couple's switch
--   2. createWedding's consent seed  (src/lib/vendor/weddings.js) — a COPY of her
--      own standing answer, read from her row, never from a request body
--   3. wedding_set_consent()         (this file) — the off-platform couple's token
-- No vendor door writes it. `publishWedding` sets `visibility` and
-- `delivered_at` and nothing else; R-G11.10 holds unchanged.
--
-- ⚠ THE TOKEN IS CHECKED INSIDE THE UPDATE, NOT BEFORE IT.
-- 0131:97's claim pair learned this: a read-then-write lets two taps arriving
-- together both pass a JS check. Here the predicate lives in the WHERE, so the
-- database decides. A wrong token, an expired token and a page that never
-- existed all UPDATE zero rows and all return the same shape — settled ≡
-- never-existed ≡ rotated, the crew constitution's own law, enforced by the
-- statement rather than by the caller's care.
--
-- SCOPED BY ONE WEDDING ID AND ITS OWN TOKEN. There is deliberately no couple
-- parameter and no vendor parameter: this function can only ever move the single
-- page whose token was presented, and consent is not a thing anyone can grant on
-- another page's behalf.
--
-- House shape adopted, not invented: `returns table`, plain `language plpgsql`,
-- no SECURITY DEFINER, no explicit grants — 0016:276's claim_circle_invite is
-- the pattern and 0132:113 is its sibling in this very arc.
CREATE OR REPLACE FUNCTION wedding_set_consent(
  p_wedding_id uuid,
  p_token      uuid,
  p_consent    boolean
) RETURNS TABLE(
  couple_consent boolean,
  rows_touched   integer
) AS $$
DECLARE
  v_touched integer;
BEGIN
  IF p_wedding_id IS NULL OR p_token IS NULL OR p_consent IS NULL THEN
    RAISE EXCEPTION 'wedding_set_consent_bad_args';
  END IF;

  -- The expiry is arithmetic on the row's own `consent_sent_at`, so a token
  -- cannot be revived by re-sending; the door re-mints instead. `NOW()` is the
  -- database's, never the caller's — a caller-supplied clock is a caller-chosen
  -- expiry.
  UPDATE public.weddings w
     SET couple_consent = p_consent,
         updated_at     = now()
   WHERE w.id            = p_wedding_id
     AND w.consent_token = p_token
     AND w.consent_sent_at IS NOT NULL
     AND w.consent_sent_at > (now() - interval '30 days');
  GET DIAGNOSTICS v_touched = ROW_COUNT;

  -- ZERO ROWS IS NOT AN EXCEPTION. It is the indistinguishable miss, and the
  -- caller renders one sentence for all of its causes. Raising here would let a
  -- prober tell a wrong token from an expired one by the error it produced.
  couple_consent := p_consent AND v_touched > 0;
  rows_touched   := v_touched;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION wedding_set_consent(uuid, uuid, boolean) IS
  'The THIRD and last writer of weddings.couple_consent, for a couple with no TDW account (R-G12.5, F-40.49). The other two are couple_set_publish() and createWedding''s seed. No vendor door writes this column. Token and 30-day expiry are checked inside the UPDATE, so a bad token, an expired token and an absent page are one indistinguishable miss.';

COMMIT;

-- OWED AFTER THIS RUNS: nothing. The 2026-09-05 regen already describes
-- `weddings` and `leads`; the two columns and the function added here make this
-- file their sole witness until the NEXT pair regen, exactly as 0131 and 0132
-- were before it. Functions are outside the addendum's declared scope in either
-- case, so `wedding_set_consent` is witnessed HERE permanently — cite this file
-- by line, never the snapshot, for anything about it.
