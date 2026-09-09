-- ─────────────────────────────────────────────────────────────────────────────
-- 0156 · BLOCK 20 · CONCIERGE s2 · R-41.122 (amended) · THE CONSENT RECORD
-- CE-41 seat D, D3a. Cut at dream-os e1dae2b94800029771b05d4b924e8a4c43c03725.
-- Ladder tail derived by command immediately before allocation:
--   `ls db/migrations | grep -E '^[0-9]{4}' | sort | tail -1` → 0155. Number
--   allocated by the chair, never claimed (LD-8).
--
-- ── WHY · META'S MESSAGING POLICY §1 HAS TWO LIMBS AND THE ESTATE HAD NEITHER ─
-- Read at docs/filings/META_MESSAGING_POLICY_READ.md. A business may message a
-- person only if (a) SHE GAVE THE NUMBER and (b) SHE CONSENTED to be messaged.
-- Until this migration the estate recorded no evidence of either: the founder
-- asked in an Instagram DM by hand and the DM thread was the whole record.
-- R-41.125 ruled that acceptable as EVIDENCE while D3 gave it a home; this is
-- the home, and D3a's writer change makes it a PRECONDITION rather than a habit.
--
-- ── WHY HER WORDS, AND NOT A BOOLEAN (the chair's ruling, and it is the point) ─
-- A `consent_given boolean` would record OUR CLAIM about her answer. Her words
-- record HER ANSWER. Those are different artefacts and only the second is
-- evidence: a tick can be set by anyone at any time for any reason and carries no
-- trace of what was actually said. There is deliberately NO BOOLEAN COLUMN here,
-- and a later seat tempted to add one should read this paragraph first.
--
-- ── HOW EACH LIMB IS EVIDENCED ───────────────────────────────────────────────
--   limb (b), consent  — `consent_text` EXISTS. She replied; the reply is stored.
--   limb (a), she gave the number — THE NUMBER APPEARS IN HER OWN WORDS. The DM
--     asks her to supply it, so a reply that contains it is the evidence that TDW
--     did not obtain it elsewhere. `src/lib/couple/assistance.js` enforces this by
--     extracting every digit run from `consent_text` and requiring one whose LAST
--     TEN match the row's phone (the estate's join law, R-41.29). The check lives
--     in the writer, not in a CHECK constraint, because it is a comparison BETWEEN
--     two columns of a row that may be written in either order, and because its
--     refusal must carry a sentence the founder can act on.
--
-- ⚠ THESE COLUMNS ARE PLATFORM DATA. `consent_text` is a message a person outside
-- TDW wrote. It is stored because Meta requires the evidence, is shown only to the
-- founder in the queue, and rides no template body ever — the outsider alert
-- carries the couple's request, never another person's words about herself.
--
-- PROVENANCE: public.prospects ← db/migrations/0083_prospects.sql
--   (phone text UNIQUE, ig_handle, name, category, city, source, state, notes).
--   Verified by command at the cut; every column added below is NEW and nothing
--   existing is altered or dropped.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.prospects
  -- Her reply, verbatim. NOT trimmed, NOT normalised, NOT summarised — the value
  -- of evidence is that it is what she wrote. Nullable, because every prospect row
  -- that predates this migration has no record and must not be back-filled with a
  -- guess; the writer refuses to send for those rather than inventing consent.
  add column if not exists consent_text        text,
  -- Where she said it. Constrained, because an unbounded source string is how a
  -- later seat writes 'phone call' and nobody notices the evidence is unverifiable.
  add column if not exists consent_source      text
    constraint prospects_consent_source_check
    check (consent_source is null or consent_source in ('instagram_dm', 'whatsapp', 'other')),
  -- When she said it. Meta's policy has no expiry, but a consent from two years
  -- ago on a number that has since changed hands is a question someone will ask.
  add column if not exists consent_at          timestamptz,
  -- Who pasted it in. The founder today; a teammate later. Not who consented —
  -- SHE consented, and `consent_text` is her voice. This column is the chain of
  -- custody for the paste, and the two must never be confused.
  add column if not exists consent_recorded_by text;

comment on column public.prospects.consent_text is
  'R-41.122: the outsider''s own words consenting to be messaged, verbatim. Evidences Meta Messaging Policy limb (b) by existing, and limb (a) by containing the number whose last ten match prospects.phone (enforced in src/lib/couple/assistance.js, not by a CHECK). Platform Data. Never rides a template body.';
comment on column public.prospects.consent_source is
  'R-41.122: where she said it. instagram_dm today (the founder asks by hand); whatsapp and other reserved.';
comment on column public.prospects.consent_at is
  'R-41.122: when she said it, not when it was pasted.';
comment on column public.prospects.consent_recorded_by is
  'R-41.122: who pasted the record. Chain of custody for the PASTE, never the consent itself.';

-- A partial index on the rows that HAVE a record: the queue reads "which
-- outsiders can be forwarded" far more often than it reads any single row, and
-- the rows without a record are the majority today and shrink over time.
create index if not exists prospects_consent_recorded_idx
  on public.prospects (phone)
  where consent_text is not null;
