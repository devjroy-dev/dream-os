-- db/migrations/0132_couple_switch.sql
-- TDW · BLOCK 19 · G1.1c — THE COUPLE'S SWITCH (R-40.9, R-G11c.2 re-ruled, R-G11c.8)
-- Append-only, founder-run, idempotent. Ladder tip before this file: 0131.
--
-- ═══ WHAT THIS FILE EXISTS TO FIX ═══════════════════════════════════════════
-- 0131 gave `weddings.couple_consent` (:58) a DEFAULT and a public-door gate
-- (idx_weddings_live, :69-70) and NO WRITER. R-G11.10 then ruled that no vendor
-- door may ever write it. So the column was true-by-nobody: the founder flipped
-- it by hand and the couple it belongs to had no way to answer at all (F-40.11).
--
-- The first cure tried to reach the couple through `weddings.event_id ->
-- events.couple_id` and was REFUSED BY THE DATABASE: `events_owner_xor`
-- (0013:55, witnessed at docs/db/PUBLIC_SCHEMA.md:1533) enforces
-- ((vendor_id IS NULL) <> (couple_id IS NULL)), and every wedding's event is
-- vendor-owned because the create door scopes its picker
-- `.eq('vendor_id', req.vendor.id)` (src/api/vendor/studio/weddings.js:84).
-- That join is therefore NULL by construction, forever — F-40.45.
--
-- The estate already had the couple<->vendor spine: `public.engagements`
-- (:510, Block 16), keyed (couple_id, vendor_id), carrying lead_id. The wedding's
-- couple is the engagement's couple, reached through the event's OWN lead.
-- Nothing in this file touches `events`; the XOR is never approached.
--
-- ═══ SQL-PROVENANCE · CONSTRAINTS, per R-40.27 ══════════════════════════════
-- R-40.27: a statement that WRITES cites the constraints section for every table
-- it writes, not the column block alone. This file writes TWO tables.
--
-- public.couples — docs/db/PUBLIC_SCHEMA.md, columns :364 (23), constraints
--   :1430-1438, verbatim:
--     [CHECK]       couples_tier_check      CHECK (tier = ANY (ARRAY['basic','gold','platinum']))
--     [PRIMARY KEY] couples_pkey            PRIMARY KEY (id)
--     [UNIQUE]      couples_user_id_unique  UNIQUE (user_id)
--   NEITHER constraint touches the column added below. `publish_weddings` is a
--   new boolean with a DEFAULT, so no existing row can violate anything and the
--   ALTER cannot fail on data.
--
-- public.weddings — NOT IN THE SNAPSHOT. 0131 is its SOLE witness until the pair
--   regen (the snapshot header's own OUT_OF_ORDER discipline; the register's
--   staleness on `engagements` is F-40.58). Cited by line, 0131:49-70:
--     CONSTRAINT weddings_visibility_check  CHECK (visibility = ANY (ARRAY['draft','published']))
--     CONSTRAINT weddings_owner_slug_key    UNIQUE (owner_vendor_id, slug)
--     idx_weddings_live  (owner_vendor_id, slug) WHERE visibility='published' AND couple_consent=true
--   NEITHER CHECK mentions the column added below, and `couple_id` is nullable
--   with no default, so the ALTER cannot fail on existing rows. idx_weddings_live
--   is NOT touched, NOT dropped and NOT redefined: the public door keeps reading
--   the page's own `couple_consent` column exactly as it does today.
--
-- public.engagements — READ ONLY from this file's function? NO. This file does
--   not read engagements at all. The spine derivation lives in application code
--   (src/lib/vendor/weddings.js, createWedding), because it must run once at
--   create and never again. Named here so nobody looks for it below.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1 · HER STANDING ANSWER ─────────────────────────────────────────────────
-- One home for the fact "this couple permits her vendors to publish". It lives
-- on HER row, not on any vendor's, and it survives having no wedding page yet.
--
-- R-G11c.6 (the switch is greyed until a page exists) was SUPERSEDED by
-- R-G11c.8 precisely because of this column: a switch with nowhere to store an
-- answer is a lying control, and the cure is a home for the fact rather than a
-- disabled affordance. DEFAULT false — consent is never assumed, silence is not
-- yes, and neither is the counterparty (master §2.4).
ALTER TABLE public.couples
  ADD COLUMN IF NOT EXISTS publish_weddings boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.couples.publish_weddings IS
  'The couple''s standing answer to "publish our wedding". Written ONLY by couple_set_publish(), called ONLY by PATCH /api/v2/couple/me/:coupleId. No vendor door writes it (R-G11.10, R-G11c.8).';

-- ── 2 · THE WEDDING'S COUPLE ────────────────────────────────────────────────
-- Resolved ONCE, at create, from the engagements spine, and never vendor-
-- supplied. Nullable because a back-catalogue page has no event to resolve
-- through (R-G11.21 made event_id nullable for exactly that case) and because an
-- engagement can carry a NULL lead_id, which the lead-mediated derivation cannot
-- see — a real miss with a named specimen, filed as F-40.60 rather than papered
-- over here.
--
-- ON DELETE SET NULL, matching 0131:52's treatment of event_id: a couple's row
-- going away must never take a vendor's published page with it. The page then
-- has no couple, so no switch governs it, so it stops serving — which is the
-- safe direction.
ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS couple_id uuid NULL REFERENCES public.couples (id) ON DELETE SET NULL;

-- Partial: the vast majority of rows will carry NULL until the couple lane is
-- populated, and the only query that uses this column asks for ONE couple's
-- weddings. Indexing the NULLs would be paying for rows nobody looks up.
CREATE INDEX IF NOT EXISTS idx_weddings_couple ON public.weddings USING btree (couple_id)
  WHERE couple_id IS NOT NULL;

COMMENT ON COLUMN public.weddings.couple_id IS
  'Resolved at create from events.linked_lead_id -> engagements(lead_id, vendor_id=owner) -> couple_id. NEVER supplied by a vendor. NULL for back-catalogue pages and for engagements with no lead (F-40.60).';

-- ── 3 · THE ONE WRITER, IN ONE TRANSACTION ──────────────────────────────────
-- R-G11c.8 requires her standing answer and every page of hers to move TOGETHER.
-- Two supabase.update() calls from the door would be two statements and two
-- chances to half-apply, leaving her answer and her pages disagreeing. A plpgsql
-- function body runs in ONE transaction, so this is the ruling executed as
-- worded rather than approximated.
--
-- House shape adopted, not invented: `returns table`, plain `language plpgsql`,
-- no SECURITY DEFINER, no explicit grants — 0016:276's claim_circle_invite is
-- the pattern, and the estate has eleven such functions and ten rpc call sites.
--
-- WHY IT RETURNS weddings_touched: so the caller can report what actually moved
-- instead of assuming. A couple with no page yet legitimately touches ZERO rows,
-- and that is not a failure — it is exactly the state string 5 describes.
--
-- SCOPED BY HER couple_id AND NOTHING ELSE. There is deliberately no wedding-id
-- parameter: a door that accepted one would let a caller name a page that is not
-- hers, and consent is not a thing you can grant on someone else's behalf.
CREATE OR REPLACE FUNCTION couple_set_publish(
  p_couple_id uuid,
  p_publish   boolean
) RETURNS TABLE(
  publish_weddings boolean,
  weddings_touched integer
) AS $$
DECLARE
  v_touched integer;
BEGIN
  IF p_couple_id IS NULL OR p_publish IS NULL THEN
    RAISE EXCEPTION 'couple_set_publish_bad_args';
  END IF;

  UPDATE public.couples c
     SET publish_weddings = p_publish
   WHERE c.id = p_couple_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'couple_not_found';
  END IF;

  UPDATE public.weddings w
     SET couple_consent = p_publish,
         updated_at     = now()
   WHERE w.couple_id = p_couple_id;
  GET DIAGNOSTICS v_touched = ROW_COUNT;

  publish_weddings := p_publish;
  weddings_touched := v_touched;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION couple_set_publish(uuid, boolean) IS
  'The SOLE writer of couples.publish_weddings and of weddings.couple_consent. Both move in one transaction. Called only by PATCH /api/v2/couple/me/:coupleId.';

COMMIT;
