-- db/migrations/0144_referral_alerts_comment.sql
-- TDW · BLOCK 19 · G5.1 SITTING 2 RIDER — F-40.227.
--
-- Append-only, founder-run, idempotent. Ladder tip before this file: 0143,
-- derived by `ls db/migrations/*.sql | sort | tail` at the cut. This sits AT the
-- tip, so it takes NO record in OUT_OF_ORDER.json. Number allocated by the chair
-- (R-40.44).
--
-- ═══ WHAT THIS FIXES, AND IT IS A SENTENCE RATHER THAN A SCHEMA ════════════
-- `0142` shipped `public.referral_alerts` with a COMMENT ON TABLE reading:
--
--     "…status is advanced by the Meta receipt webhook via relayStatus.js."
--
-- ⚠ THAT WAS FALSE ON THE DAY IT WAS WRITTEN. `relayStatus.js` searched
-- `public.messages` and `public.lead_alerts` and had no arm for this table at
-- all, so `status` was frozen at `sent` the moment the row was written. On the
-- G5.1 sitting-2 walk of 2026-09-07 Meta reported `sent` and then `delivered`
-- for a real referral alert and both receipts landed on the router's orphan
-- sentence — `home=none matched=0 — NO ROW CARRIES THIS SID`, twice, in the
-- founder's deploy log. The founder's walk found it; no bench did.
--
-- WORSE THAN A COMMENT THAT AGED BADLY. `0142`'s own header, twenty lines above
-- the offending string, states the TRUE version as the reason the table needed to
-- exist: "relayStatus.js looks for a wamid in public.messages and nowhere else".
-- The seat carried F-40.177's lesson into the header and then contradicted it in
-- the one sentence that ships to the database. A comment nobody can grep from a
-- code review, because it lives in `pg_description` and not in the repo.
--
-- ⚠ AND IT COULD NOT BE CURED BY A CODE PUSH. A COMMENT ON is database state.
-- `0142` is applied and append-only (LD-8), so it is not edited — this file
-- corrects the comment forward, which is why it is a migration and not a diff.
--
-- ⚠ IT RIDES WITH THE ARM, NOT AHEAD OF IT. F-40.226's cure lands
-- `referral_alerts` as the router's THIRD home in the same packet as this file.
-- The sentence below therefore becomes TRUE in the same breath the arm lands,
-- rather than being corrected to describe an absence and then corrected again.
-- If this migration is ever run WITHOUT that packet, the comment is once more
-- ahead of the code — so run it at apply, not before.
--
-- ═══ SQL-PROVENANCE · R-40.27 ══════════════════════════════════════════════
-- THIS FILE WRITES NO ROW AND NO COLUMN. `COMMENT ON` touches
-- `pg_catalog.pg_description` only: no key, no constraint, no index, no data.
-- There is no constraint on `public.referral_alerts` this statement can violate
-- and no existing row it can fail on.
--
-- public.referral_alerts — its DDL is `db/migrations/0142_referral_alerts.sql`,
--   cited from THAT FILE by line and never from `docs/db/PUBLIC_SCHEMA.md`: the
--   snapshot's applied ladder tip is 0138 and it describes neither this table nor
--   `peer_discoverable`. Columns 0142:118-140. Constraints and indexes
--   0142:143-176 — referral_alerts_pkey; the two FKs to `public.lead_referrals`
--   and `public.vendors`, both ON DELETE CASCADE; `uq_referral_alerts_wamid` and
--   `uq_referral_alerts_referral_sent`, BOTH UNIQUE and BOTH PARTIAL on
--   `wamid IS NOT NULL`. That partiality is what makes the router's arm safe:
--   the failed sends this table deliberately keeps carry a null wamid, so they
--   cannot collide with each other and cannot be matched by a receipt.

BEGIN;

COMMENT ON TABLE public.referral_alerts IS
  'One row per outbound referral-alert send (R-G51.15). Written by src/lib/vendor/referralAlert.js and by nothing else. Status is advanced by the Meta receipt webhook: src/lib/vendor/relayStatus.js matches on wamid and updates this table as its THIRD home, after public.messages and public.lead_alerts, each tried only on a miss (F-40.226). Rows with a NULL wamid are failed sends kept as evidence — no receipt can ever match them, which is why both unique indexes are PARTIAL. NOT public.messages: conversation messages and outbound notifications are different planes.';

COMMENT ON COLUMN public.referral_alerts.status IS
  'queued at write, then whatever Meta''s webhook last said: sent, delivered, read, failed. Also no_phone, opted_out and template_not_approved — outcomes the ESTATE decided, which Meta never saw and will never send a receipt for. Free text by design (0141''s position): a CHECK over a vocabulary a future door will extend is a refusal written before the question. ⚠ A row reading `failed` STOPS the sender''s lead record saying Told — a wamid whose receipt retracts it is no longer proof of delivery.';

COMMIT;

-- ── VERIFY (run separately — R-40.31, one statement per paste) ──────────────
-- EXPECT two rows. The table comment must name `relayStatus.js` AND the word
-- THIRD; the column comment must name `failed` and `Told`. A row whose comment
-- still reads the 0142 sentence means this file did not run.
--
--   select c.relname as object, 'table' as kind, obj_description(c.oid) as comment
--     from pg_class c join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relname = 'referral_alerts'
--   union all
--   select a.attname, 'column', col_description(a.attrelid, a.attnum)
--     from pg_attribute a
--    where a.attrelid = 'public.referral_alerts'::regclass and a.attname = 'status';
--
-- ⚠ AND THE COMMENT IS NOT THE PROOF THE ARM WORKS. It is a description, and
-- this whole finding exists because a description was trusted as a mechanism.
-- The arm is proven by a WALK: forward once with the flag up, then read the row
-- and watch `status` advance past `sent` as Meta's receipts arrive. The deploy
-- log should read `home=referral_alert matched=1`, never `home=none matched=0`.
