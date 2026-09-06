-- db/migrations/0139_payment_reminders.sql
-- TDW · BLOCK 19 · G3.4 — THE POLITE COLLECTOR'S OWN PLANE
-- (R-G34.3 · .4 · .5 · .6 · .8 · .11 · F-40.142 · F-40.144)
--
-- Append-only, founder-run, idempotent. Number assigned by the chair (R-40.44).
--
-- ⚠ FOUNDER-RUN IN THE SUPABASE EDITOR, BEFORE THE dream-os ZIP IS APPLIED.
--   ONE STATEMENT PER PASTE IS *NOT* REQUIRED HERE — R-40.31 is about the editor
--   showing only the last RESULT, and this file returns no result sets. It runs
--   whole and either lands or does not.
--
-- ═══ THE LADDER, DERIVED AT THE CUT ════════════════════════════════════════
-- `ls db/migrations/*.sql | sort | tail` at dream-os 9988614 returns 0138 as the
-- highest numbered file. This sits AT the tip, not in a reserved hole, so it
-- takes NO record in db/migrations/OUT_OF_ORDER.json — that register's formatter
-- aborts on any number not strictly below the tip.
--
-- ═══ SQL-PROVENANCE · R-40.27 · CONSTRAINTS, NOT COLUMN LISTS ══════════════
-- Two tables are WRITTEN here and both are NEW, so neither has prior constraints
-- to cite. What this file DEPENDS ON is three foreign-key targets, and each is
-- cited to the constraints section of docs/db/PUBLIC_SCHEMA.md at 5b3f61f — the
-- PAIR regen that landed 2026-09-06 and is the first snapshot to describe the
-- G2 planes. Not one is carried from memory:
--   public.payment_schedules  [PRIMARY KEY] payment_schedules_pkey  PRIMARY KEY (id)   :1853 block
--   public.invoices           [PRIMARY KEY] invoices_pkey           PRIMARY KEY (id)   :1736 block
--   public.vendors            [PRIMARY KEY] vendors_pkey            PRIMARY KEY (id)   :2067 block
--
-- Read, never written, by everything this migration serves:
--   public.payment_schedules  state CHECK admits ('pending','paid','waived') ONLY
--                             — payment_schedules_state_check, :1853 block. The
--                             sweep's predicate is state = 'pending'. There is no
--                             'unpaid' on this table; that value is invoices.state's
--                             default and reading it here would select zero rows
--                             forever, silently.
--   public.payment_schedules  payment_schedules_vendor_pending_idx
--                             ON (vendor_id, due_date) WHERE state = 'pending'
--                             — the partial index the nightly sweep needs ALREADY
--                             EXISTS (:3375 block). No index is added for it here.
--
-- ⚠ `src/lib/vendor/schedules.js` REMAINS THE SOLE WRITER OF payment_schedules
-- AND IS NOT TOUCHED BY THIS ARC. This plane only ever reads it.


-- ═══════════════════════════════════════════════════════════════════════════
-- 1 · public.payment_reminders — ONE ROW PER REMINDER, AND IT OUTLIVES ITS
--     MILESTONE ON PURPOSE
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── WHY milestone_id IS NULLABLE AND SET NULL, NOT CASCADE (R-G34.6) ───────
-- `schedules.js:88` HARD-DELETES every milestone row for an invoice whenever no
-- milestone on it is paid, and payment_schedules itself CASCADES from invoices.
-- A cascading FK here would mean a vendor editing a schedule silently destroys
-- the record of every reminder she ever sent against it — and the room's whole
-- job is to be that record. So: ON DELETE SET NULL, and the three facts a reader
-- needs are DENORMALISED onto this row rather than joined for.
--
-- This is 0134's own reasoning for reviews_asked.wedding_id, applied to a
-- sharper case: there the parent was unlikely to be deleted, here the parent has
-- a delete verb wired to a live control.
--
-- ── milestone_label · amount_due · invoice_id ARE COPIES, AND THAT IS THE ────
-- ── POINT, NOT A NORMALISATION SLIP ─────────────────────────────────────────
-- They record what was TRUE AT THE MOMENT OF THE ASK. If a vendor later rewrites
-- a milestone from Rs 60,000 to Rs 40,000, the reminder that went out still said
-- 60,000, and a ledger that re-derived the figure by join would retroactively
-- rewrite history to something the client never received. The ask happened; these
-- columns are what it said.
--
-- ── UNIQUE (milestone_id, kind) IS THE ONCE-PER-MILESTONE GUARANTEE ─────────
-- Not the code. `reviewsNightly.js:88` is the pattern: INSERT FIRST, and send
-- only if the insert won the row; 23505 is counted as SUCCESS of the guarantee,
-- never swallowed with real errors. A SELECT-then-INSERT is two statements with a
-- gap, and the gap is where the second message to the same client comes from.
--
-- ⚠ AND A PROPERTY OF THAT KEY THAT MUST BE SAID OUT LOUD, because it looks like
-- a bug and is a requirement: Postgres treats NULLs as DISTINCT in a unique
-- index, so once a schedule is deleted and milestone_id goes NULL, those historical
-- rows STOP participating in the constraint and many may coexist. That is correct.
-- The constraint exists to stop a SECOND LIVE ASK against a LIVE milestone; a
-- detached historical row has no milestone left to protect.
--
-- ── kind, AND WHY THE COLUMN EXISTS WHILE ONLY ONE VALUE DOES ──────────────
-- R-G34.4 ruled ONE window, three days. `kind` carries 'due_3d' and the CHECK
-- admits exactly that today. A 7-day window later is one CHECK widening and one
-- row per milestone more — not a second table, and not a schema migration under
-- pressure. The column is the cheap half of a decision already anticipated.
--
-- ── source, AND WHY IT IS NOT INFERRED ────────────────────────────────────
-- 'vendor_tap' is her own first reminder on an invoice; 'nightly' is the sweep
-- acting under her armed switch. The room needs to tell them apart, and inferring
-- it from created_at's hour would be a guess dressed as a fact.
--
-- ── wamid NULL IS THE RECORD THAT A SEND NEVER REACHED META (R-G34.8) ──────
-- The row is written BEFORE the send, deliberately, so a failed send still leaves
-- a row and that client is never asked twice. `wamid IS NOT NULL` is the room's
-- band 2 — the word on the surface is **Sent**, not Landed, because a wamid means
-- WhatsApp ACCEPTED the message and never that it reached her phone (the founder's
-- amendment at the veto, G34_VETO_SHEET §A).

CREATE TABLE IF NOT EXISTS public.payment_reminders (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       uuid        NOT NULL REFERENCES public.vendors           (id) ON DELETE CASCADE,
  milestone_id    uuid        NULL     REFERENCES public.payment_schedules (id) ON DELETE SET NULL,
  invoice_id      uuid        NULL     REFERENCES public.invoices          (id) ON DELETE SET NULL,
  kind            text        NOT NULL DEFAULT 'due_3d',
  milestone_label text        NOT NULL,
  amount_due      integer     NOT NULL,
  due_date        date        NULL,
  to_phone        text        NULL,
  template        text        NOT NULL DEFAULT 'tdw_payment_reminder',
  wamid           text        NULL,
  source          text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT payment_reminders_milestone_kind_key UNIQUE (milestone_id, kind),
  CONSTRAINT payment_reminders_kind_check   CHECK (kind   = ANY (ARRAY['due_3d'::text])),
  CONSTRAINT payment_reminders_source_check CHECK (source = ANY (ARRAY['vendor_tap'::text, 'nightly'::text])),
  CONSTRAINT payment_reminders_amount_check CHECK (amount_due > 0)
);

COMMENT ON TABLE public.payment_reminders IS
  'One row per reminder sent, ever. The UNIQUE (milestone_id, kind) key IS the once-per-milestone guarantee (R-G34.3); no code path may rely on checking first. Rows OUTLIVE their milestone by ON DELETE SET NULL with label/amount/invoice denormalised, because schedules.js deletes milestones and the ledger must survive it (R-G34.6). wamid NULL means the send never reached Meta. Sole writer: src/lib/vendor/paymentReminders.js.';

-- The room reads a vendor's reminders newest-first; the record reads one invoice's.
CREATE INDEX IF NOT EXISTS payment_reminders_vendor_idx
  ON public.payment_reminders USING btree (vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_reminders_invoice_idx
  ON public.payment_reminders USING btree (invoice_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- 2 · public.payment_reminder_settings — THE STANDING SWITCH, ONE ROW PER
--     VENDOR, OFF UNTIL SHE SAYS OTHERWISE
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── WHY A ROW PLANE AND NOT A COLUMN ON vendors (R-G34.5) ─────────────────
-- `public.vendors` is already 49 columns and is written by many hands across the
-- estate; a switch column there would have no sole writer and the one-writer law
-- would be broken by construction on the day it shipped. This takes
-- `vendor_seal`'s exact shape (0134): vendor_id as the primary key, no surrogate
-- id, one owner.
--
-- ── ABSENT ROW MEANS OFF, AND THE DEFAULT SAYS SO TWICE ───────────────────
-- A vendor who has never opened this room has no row here. The reader treats a
-- missing row as OFF, and `auto_send` DEFAULTs false so a row created for any
-- other reason is also OFF. Two ways to reach the same answer, and neither is
-- silence being read as consent — which is the whole ruling this table serves.

CREATE TABLE IF NOT EXISTS public.payment_reminder_settings (
  vendor_id  uuid        PRIMARY KEY REFERENCES public.vendors (id) ON DELETE CASCADE,
  auto_send  boolean     NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.payment_reminder_settings IS
  'The standing switch, one row per vendor, OFF by default (R-G34.5). An ABSENT row means OFF. Arming it never sends the FIRST reminder on an invoice -- that is always the vendor''s own tap; the switch only releases the rest. Sole writer: src/lib/vendor/paymentReminders.js.';


-- ═══════════════════════════════════════════════════════════════════════════
-- 3 · OWED AFTER THIS RUNS
-- ═══════════════════════════════════════════════════════════════════════════
-- A PAIR regen (db/queries/public_schema_dump.sql, founder-run, piped through
-- db/queries/format_public_schema.js). Until it runs, docs/db/PUBLIC_SCHEMA.md
-- describes 79 tables and does not know these two. The SQL-provenance law is
-- satisfied for them BY THIS FILE and by nothing else — which is why this note is
-- here and not only in a handover.
