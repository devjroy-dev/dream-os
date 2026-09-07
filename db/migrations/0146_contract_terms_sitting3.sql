-- db/migrations/0146_contract_terms_sitting3.sql
-- TDW · BLOCK 19 · G3.2 sitting 3 — THE ROOM AS A VENDOR USES IT (R-40.120 / R-40.121).
--
-- Append-only, founder-run, idempotent. Ladder tip before this file: 0145
-- (G3.2 s2's comment rider), derived by `ls db/migrations/*.sql | sort | tail` at
-- the cut, not recalled. This sits AT the tip, so it takes NO record in
-- OUT_OF_ORDER.json. Number allocated by the chair (R-40.44) at R-40.120.
--
-- ⚠ NO DDL. `contracts.terms` and `contract_profiles.fields` are jsonb (0138), so
-- the two keys sitting 3 adds to `terms` — `functions_manual`, `policy_overrides` —
-- and the one key it renames on `fields` need no column. What this file does:
--   1 · renames `travel_terms` → `travel_and_stay_terms` on every stored profile,
--       and drops `same_venue` / `rooms` where a row ever carried them (register v3 §5);
--   2 · restates the two column COMMENTs so the next PUBLIC_SCHEMA regen names the
--       new keys — a comment describing keys the code reads, shipped in the same
--       packet as the code (0145's own rule).
--
-- ⚠ ONE STATEMENT PER PASTE (R-40.31). Four statements below; the founder runs the
-- census SELECT in the packet BEFORE §1, and its verify SELECT after.
--
-- ═══ CONSTRAINTS WRITTEN AGAINST (R-40.27) ══════════════════════════════════
-- public.contract_profiles — 0138 §1:
--   vendor_id  uuid PRIMARY KEY REFERENCES public.vendors(id) ON DELETE CASCADE
--   fields     jsonb NOT NULL DEFAULT '{}'::jsonb
--   updated_at timestamptz NOT NULL DEFAULT now()
-- The UPDATE writes `fields` and `updated_at` only: `fields` stays a non-null
-- jsonb object (the `-`/`||` operators on an object return an object), and no
-- key or FK is touched. It is scoped by `fields ? 'travel_terms'`, so a second run
-- matches zero rows.
-- public.contracts — `terms jsonb NOT NULL DEFAULT '{}'` (0138): only a COMMENT.

-- ═══ 1 · RENAME THE CLAUSE 5 TOKEN ON STORED PROFILES ═══════════════════════
UPDATE public.contract_profiles
   SET fields = ((fields - 'travel_terms' - 'same_venue' - 'rooms')
                 || jsonb_build_object('travel_and_stay_terms', fields->>'travel_terms')),
       updated_at = now()
 WHERE fields ? 'travel_terms'
   AND NOT (fields ? 'travel_and_stay_terms');

-- ═══ 2 · A ROW THAT HAS THE NEW KEY AND STILL CARRIES THE OLD ONES ══════════
-- (a profile saved by a room at the new tip while an old key lingered): drop
-- the retired keys without touching her sentence.
UPDATE public.contract_profiles
   SET fields = fields - 'travel_terms' - 'same_venue' - 'rooms',
       updated_at = now()
 WHERE fields ? 'travel_and_stay_terms'
   AND (fields ? 'travel_terms' OR fields ? 'same_venue' OR fields ? 'rooms');

-- ═══ 3 · THE COMMENTS NAME THE KEYS THE CODE READS ═════════════════════════
COMMENT ON COLUMN public.contracts.terms IS
  'G3.2 R-G32.3/R-G32.8: the CONTRACT class of the field register, jsonb, one agreement''s own values. Nested: `clauses` (six booleans, absent = printed); `functions` keyed by event id with venue and city; from 0146 (R-40.120): `functions_manual` — [{title,date,time,venue,city}], the composer''s own rows, read only where the contract reaches no events (contractSource.functionsForContract); `policy_overrides` — PROFILE keys for THIS couple only, merged over contract_profiles.fields by contractSource.effectiveProfile. Written by saveContractFill and nothing else.';

COMMENT ON COLUMN public.contract_profiles.fields IS
  'G3.2 R-G32.3(a): the PROFILE class of TDW_19_CONTRACT_FIELD_REGISTER_v3.md — her prices and policies, asked once, reused on every contract. jsonb because the key set is the instrument''s. From 0146 (register v3 §5, R-40.121): clause 5 is one free-text key `travel_and_stay_terms`, the Vendor''s own words printed as written; `travel_terms`, `same_venue`, `rooms` are retired and renamed/dropped by 0146. No key is authored by TDW.';
