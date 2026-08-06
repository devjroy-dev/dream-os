-- 0114_billing_rails.sql
-- TDW_10 · THE BILLING SITTING · F-10.22's cure, first half.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHY THIS NUMBER
-- ═══════════════════════════════════════════════════════════════════════════
-- Derived at the tip, not carried: db/migrations/ tail is 0112_couple_route_and_flag.sql;
-- 0113 is RESERVED-UNWRITTEN for 0113_admin_control.sql (TDW_10_ADMIN_FINAL §2,
-- re-homed by R-A6, amended at R-P3.2/CE-201). LD-8 forbids reuse, so this file
-- takes 0114 and leaves 0113's hole intact.
--
-- The 09 spec's §2 row called this DDL "0084". That number was consumed by
-- 0084_message_sid_dedupe.sql at CE-27 (F-10.21). The spec row's COLUMN INTENT
-- is honoured below; its NUMBER is dead and stays dead.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHAT THIS TABLE IS, AND WHAT IT IS NOT
-- ═══════════════════════════════════════════════════════════════════════════
-- billing_events is the FIRST AND ONLY row in this estate that represents money
-- received BY TDW. Every other money-shaped table in `public` — invoices,
-- payment_schedules, couple_receipts, team_payments, expenses, tds_ledger — is
-- the VENDOR'S OWN CLIENT MONEY, and summing any of it as revenue is the single
-- most available wrong answer in this tree (see src/api/admin/bridge.js's
-- invoices-family exclusion, CE-200).
--
-- ONE WRITER: src/lib/billing/ledger.js, called only from the signature-verified
-- webhook. No route, no cron, no admin form, and no hand-insert may write here.
-- A row in this table asserts "Razorpay signed this and we checked" — a
-- hand-inserted row makes that assertion false and the Bridge's number a lie.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WIRE-OR-DELETE — WHAT THE SPEC ASKED FOR AND IS NOT GETTING (ruled R-BILL.9)
-- ═══════════════════════════════════════════════════════════════════════════
--   vendors.razorpay_customer_id  — F-10.66. No reader. Razorpay creates the
--       customer itself under Subscription Links; the subscription id is the
--       join key the flip actually uses. Birthed by the sitting that reads it.
--   vendors.loop_discount_pct     — F-10.67. Its writer is U-5's nightly
--       entitlement job (TDW_09_UIUX_FINAL §"The loop"), which this sitting
--       does not build. A default-0 integer nobody writes is a dead column.
--   vendors.entitlement_source    — TDW_11:59's amendment. Its second feeder
--       (RevenueCat) does not exist yet; with one feeder the column has one
--       value forever.
-- `billing_events.provider` IS birthed, because this sitting's webhook writes
-- it, and it is what makes TDW_11:59's one-flip-path-two-feeders real rather
-- than aspirational.

BEGIN;

-- ── THE MONEY TRUTH-TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.billing_events (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- IDEMPOTENCY. Razorpay's x-razorpay-event-id header, unique per event and
  -- STABLE ACROSS RETRIES — which is the whole point: a webhook retried after a
  -- timeout must not become a second payment. NOT the payment id: one payment
  -- fans out into several events (authorized, captured, subscription.charged),
  -- and keying on it would collapse three true events into one.
  event_id                 text NOT NULL UNIQUE,

  -- TDW_11:59's amendment, birthed wired. RevenueCat is the chartered second
  -- feeder; when it lands it writes 'revenuecat' here and calls the SAME flip.
  provider                 text NOT NULL DEFAULT 'razorpay'
                             CHECK (provider IN ('razorpay', 'revenuecat')),

  -- The provider's own event name, verbatim, un-normalised. 'subscription.charged',
  -- 'subscription.halted', 'payment_link.paid'. Stored raw so an event this
  -- estate has never heard of is still legible a year from now.
  event                    text NOT NULL,

  -- NULLABLE ON PURPOSE. An event whose notes carry no resolvable vendor still
  -- gets its row (R-BILL.7): the sole writer writes everything it verifies. A
  -- lost event is strictly worse than an orphan row — the orphan is visible and
  -- reconcilable, the lost one is money that silently never happened.
  vendor_id                uuid REFERENCES public.vendors(id) ON DELETE SET NULL,

  provider_subscription_id text,
  provider_payment_id      text,

  -- PAISE, integer. Razorpay's own unit. Rupees-as-float would introduce
  -- rounding into the one table whose entire job is to be exactly right.
  amount_paise             integer,
  currency                 text,

  -- ═══ R-BILL.4 — THE AUTHORISATION-REFUND TRAP, MADE STRUCTURAL ═══════════
  -- Razorpay's subscription lifecycle charges a nominal authorisation to
  -- validate the mandate and AUTO-REFUNDS it. A ledger that summed every row
  -- carrying an amount would have made TDW's first-ever revenue figure a number
  -- that came straight back — F-10.22 cured with a lie in the same commit.
  --
  -- So the count is a COLUMN, not a query's opinion. It is set true by exactly
  -- one rule in src/lib/billing/razorpay.js (a captured payment on a
  -- subscription.charged event, amount > 0) and false everywhere else, INCLUDING
  -- on every row this estate is merely unsure about. Under-counting is a
  -- reconcilable gap; over-counting is a lie with a font.
  counts_as_revenue        boolean NOT NULL DEFAULT false,

  -- The verified payload, whole. When a future sitting disagrees with how this
  -- one read an event, the original is still here to re-read.
  payload                  jsonb NOT NULL,

  created_at               timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.billing_events IS
  'TDW revenue ledger. Sole writer: src/lib/billing/ledger.js, called only from the signature-verified Razorpay webhook. Never hand-insert: a row here asserts a verified provider signature. F-10.22.';
COMMENT ON COLUMN public.billing_events.counts_as_revenue IS
  'True only for captured subscription.charged payments. Authorisation payments are auto-refunded by Razorpay and are recorded here with false — R-BILL.4.';

CREATE INDEX IF NOT EXISTS billing_events_created_at_idx
  ON public.billing_events (created_at DESC);
CREATE INDEX IF NOT EXISTS billing_events_vendor_idx
  ON public.billing_events (vendor_id, created_at DESC);
-- The Bridge's revenue predicate, indexed as it is actually queried.
CREATE INDEX IF NOT EXISTS billing_events_revenue_idx
  ON public.billing_events (created_at DESC) WHERE counts_as_revenue;

-- ── THE VENDOR SIDE ─────────────────────────────────────────────────────────
-- Two columns. Not three: see the wire-or-delete note above.
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS billing_status           text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id text;

-- ═══ R-BILL.6 — THE CHECK LANDS HERE AND NOWHERE ELSE ══════════════════════
-- A CHECK is free on a VIRGIN column: every existing row takes the default, so
-- nothing can be rejected. `vendors.tier` gets NO CHECK in this file — it is
-- free-text with live 'trial' rows (F-10.23), and constraining it is the rename
-- sitting's job after a backfill, on the founder's semantic ruling.
--
-- The default is 'none', NOT the 09 spec's 'trial'. 'trial' in a brand-new
-- column would re-mint F-10.23's held semantic in fresh concrete on the very
-- night the founder is still deciding it. 'none' asserts one narrow, true thing:
-- no subscription rail is attached to this vendor. It prejudges nothing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vendors_billing_status_check'
  ) THEN
    ALTER TABLE public.vendors
      ADD CONSTRAINT vendors_billing_status_check
      CHECK (billing_status IN ('none', 'active', 'pending', 'halted', 'cancelled'));
  END IF;
END $$;

COMMENT ON COLUMN public.vendors.billing_status IS
  'Subscription rail state. Written ONLY by src/lib/billing/tierFlip.js from a verified provider event. ''none'' = no rail attached; it is not a trial and does not imply one (F-10.23 held open).';

-- The webhook's fast path: after first sight, an event finds its vendor by
-- subscription id rather than by re-reading notes.
CREATE INDEX IF NOT EXISTS vendors_razorpay_subscription_idx
  ON public.vendors (razorpay_subscription_id)
  WHERE razorpay_subscription_id IS NOT NULL;

COMMIT;
