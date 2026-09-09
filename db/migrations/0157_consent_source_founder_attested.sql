-- ─────────────────────────────────────────────────────────────────────────────
-- 0157 · BLOCK 20 · R-41.133 — THE FOUNDER'S ATTESTATION IS ITS OWN SOURCE
-- CE-41 seat D, D3a4. Cut at dream-os 187c410cffdf331fd4219544f3f14019bb782ef6.
-- Ladder tail derived by command immediately before allocation:
--   `ls db/migrations | grep -E '^[0-9]{4}' | sort | tail -1` → 0156.
--
-- ── WHY, AND THE CHECK THAT MADE IT NECESSARY ────────────────────────────────
-- 0156 constrained consent_source to three values with this reasoning, verbatim:
-- "an unbounded source string is how a later seat writes 'phone call' and nobody
-- notices the evidence is unverifiable." R-41.133 then ruled a FOURTH value, and
-- the CHECK caught it the same day — a tick writing 'founder_attested' would have
-- been rejected by Postgres and the founder would have got a 500 on a control that
-- looked like it worked. The constraint did exactly what it was for.
--
-- ── WHAT founder_attested MEANS, AND WHY IT IS NOT A FOURTH KIND OF HER ──────
-- The other three sources answer "WHERE SHE SAID IT". This one answers "WHO IS
-- SPEAKING", and the answer is TDW, not her. It is the founder's habit made a tap
-- and labelled honestly: he asked her in the DM, she said yes, and he is attesting
-- to that here. It is NEVER her voice from a tick — that was the boolean 0156
-- refused, and writing her words from a checkbox would be that boolean wearing her
-- name. The queue therefore shows THREE states, not two, and "Her words on file"
-- is STRICTLY STRONGER evidence than "Founder attested".
--
-- ⚠ THE STORED LINE IS TDW'S SENTENCE, IN THE THIRD PERSON, ON PURPOSE:
--   "Founder asked her for this number and she gave it and agreed to be messaged."
-- It names both limbs of Meta's Messaging Policy §1 — (a) she gave the number,
-- (b) she consented — because the control's label promises both and the record must
-- not claim less than the label. Chair-vetoed under R-41.98, 2026-09-09.
--
-- PROVENANCE: prospects_consent_source_check ← db/migrations/0156, line 55.
-- Read by command at the cut, not recalled.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.prospects
  drop constraint if exists prospects_consent_source_check;

alter table public.prospects
  add constraint prospects_consent_source_check
  check (consent_source is null or consent_source in ('instagram_dm', 'whatsapp', 'other', 'founder_attested'));

comment on column public.prospects.consent_source is
  'R-41.122 / R-41.133: where she said it — instagram_dm, whatsapp, other — or founder_attested, which means TDW is speaking rather than her. founder_attested pairs with a consent_text that is TDW''s own sentence in the third person, never her words. "Her words on file" is strictly stronger evidence than "Founder attested".';
