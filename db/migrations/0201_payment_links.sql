-- db/migrations/0201_payment_links.sql — TDW · CE-47 · INS · PAY-A · PAYMENT LINKS (Business Solutions › Get paid).
-- The founder's rulings (4 to 7 October 2026): the vendor connects HER OWN Razorpay account; money goes from her client
-- straight to her and never passes through TDW; TDW takes no fee and records no commission (none is read, stored or
-- worded anywhere). New tables only; no existing table is altered. OUT_OF_ORDER.json record 201 is WEB-4's to write.
--
-- THE CHAIR'S TWO OWED CURES (turn 34), carried by one function, pay_record_milestone():
--   ONCE ONLY · a link payment is recorded by its payment id. vendor_pay_events.(provider, provider_payment_id) is
--     unique; a second arrival of the same id inserts nothing, so the function changes nothing and says `duplicate`.
--   ONE STEP · the add happens IN the database: one UPDATE adds to paid_amount and decides 'paid' from the total it
--     returns. Two payments at once each wait for the row lock and add to what the other left; neither is lost.
-- The hand path calls it with no payment id: add only, as today.
BEGIN;

CREATE TABLE public.vendor_pay_accounts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  provider         text NOT NULL CHECK (provider IN ('razorpay', 'cashfree')),
  account_id       text NOT NULL,                 -- her account at the provider (Razorpay acc_…)
  token_ref        text,                          -- a tokenVault reference; the token itself is never stored here
  status           text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'needs_attention', 'revoked')),
  connected_at     timestamptz NOT NULL DEFAULT now(),
  revoked_at       timestamptz
);
CREATE UNIQUE INDEX vendor_pay_accounts_one_live ON public.vendor_pay_accounts (vendor_id) WHERE status <> 'revoked';
CREATE UNIQUE INDEX vendor_pay_accounts_provider_account ON public.vendor_pay_accounts (provider, account_id) WHERE status <> 'revoked';
ALTER TABLE public.vendor_pay_accounts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_pay_accounts TO service_role;

CREATE TABLE public.vendor_pay_links (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id         uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  provider          text NOT NULL CHECK (provider IN ('razorpay', 'cashfree')),
  provider_link_id  text,
  short_url         text,
  invoice_id        uuid NOT NULL,
  milestone_id      uuid,                         -- null: a link for the whole invoice
  amount            integer NOT NULL CHECK (amount > 0),
  state             text NOT NULL DEFAULT 'created' CHECK (state IN ('created', 'sent', 'part_paid', 'paid', 'failed', 'expired', 'cancelled')),
  sent_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vendor_pay_links_vendor_idx ON public.vendor_pay_links (vendor_id, created_at DESC);
ALTER TABLE public.vendor_pay_links ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_pay_links TO service_role;

CREATE TABLE public.vendor_pay_events (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id            uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  provider             text NOT NULL CHECK (provider IN ('razorpay', 'cashfree')),
  provider_payment_id  text NOT NULL,             -- ONCE ONLY: the key a retried webhook repeats
  kind                 text NOT NULL CHECK (kind IN ('paid', 'part_paid', 'failed', 'refunded')),
  link_id              uuid,
  milestone_id         uuid,
  invoice_id           uuid,
  amount               integer NOT NULL CHECK (amount >= 0),
  method               text,
  at                   timestamptz NOT NULL DEFAULT now(),
  -- RULING (the chair, turn 36): money that arrived is never dropped. A link payment that cannot be applied (the line is
  -- already paid) is KEPT here with applied = false and its reason, and the room tells the vendor in plain words.
  applied              boolean NOT NULL DEFAULT true,
  not_applied_reason   text CHECK (not_applied_reason IS NULL OR not_applied_reason IN ('NOT_PENDING', 'INVOICE_CANCELLED', 'NO_INVOICE', 'NO_LINE')),
  UNIQUE (provider, provider_payment_id, kind)
);
CREATE INDEX vendor_pay_events_vendor_idx ON public.vendor_pay_events (vendor_id, at DESC);
ALTER TABLE public.vendor_pay_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_pay_events TO service_role;

CREATE TABLE public.vendor_pay_settings (
  vendor_id    uuid PRIMARY KEY REFERENCES public.vendors(id) ON DELETE CASCADE,
  auto_link    boolean NOT NULL DEFAULT false,
  thank_you    boolean NOT NULL DEFAULT false,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_pay_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_pay_settings TO service_role;

-- ONE STEP and ONCE ONLY, in one transaction. Answers (jsonb):
--   { ok:true,  duplicate:true }                                    the same payment id again: nothing changed
--   { ok:true,  applied:false, code }                               a LINK payment that cannot be applied: KEPT as an
--                                                                   event, nothing else moves (code: NO_LINE, NO_INVOICE,
--                                                                   INVOICE_CANCELLED, NOT_PENDING)
--   { ok:false, code }                                              the hand path (same codes), or BAD_AMOUNT, NO_PROVIDER
--   { ok:true,  applied:true, settled, milestone:{…}, invoice:{…} }   recorded
-- ONE LOCK ORDER (the chair, turn 37): every recorder takes the INVOICE row first (FOR UPDATE, after the once-only
-- insert), then its lines in ordinal order, so a line payment and a whole-invoice payment on one invoice can never wait
-- on each other in a circle.
CREATE FUNCTION public.pay_record_milestone(p_vendor uuid, p_milestone uuid, p_amount integer, p_received date,
                                            p_provider text DEFAULT NULL, p_payment_id text DEFAULT NULL,
                                            p_link uuid DEFAULT NULL, p_method text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE ms public.payment_schedules%ROWTYPE; inv public.invoices%ROWTYPE; paid_on timestamptz; ev uuid; line_inv uuid; st text; why text;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN RETURN jsonb_build_object('ok', false, 'code', 'BAD_AMOUNT'); END IF;
  IF p_payment_id IS NOT NULL AND p_provider IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'NO_PROVIDER'); END IF;
  paid_on := CASE WHEN p_received IS NULL THEN now() ELSE (p_received::timestamp AT TIME ZONE 'Asia/Kolkata') END;
  SELECT invoice_id INTO line_inv FROM public.payment_schedules WHERE id = p_milestone AND vendor_id = p_vendor;   -- hers, or null
  IF p_payment_id IS NOT NULL THEN
    INSERT INTO public.vendor_pay_events (vendor_id, provider, provider_payment_id, kind, link_id, milestone_id, invoice_id, amount, method)
    VALUES (p_vendor, p_provider, p_payment_id, 'paid', p_link, CASE WHEN line_inv IS NULL THEN NULL ELSE p_milestone END, line_inv, p_amount, p_method)
    ON CONFLICT (provider, provider_payment_id, kind) DO NOTHING
    RETURNING id INTO ev;
    IF ev IS NULL THEN RETURN jsonb_build_object('ok', true, 'duplicate', true); END IF;
  END IF;
  IF line_inv IS NULL THEN why := 'NO_LINE';
  ELSE
    SELECT state INTO st FROM public.invoices WHERE id = line_inv AND vendor_id = p_vendor FOR UPDATE;   -- the invoice FIRST
    IF st IS NULL THEN why := 'NO_INVOICE'; ELSIF st = 'cancelled' THEN why := 'INVOICE_CANCELLED'; END IF;
  END IF;
  IF why IS NULL THEN
    UPDATE public.payment_schedules
       SET paid_amount = COALESCE(paid_amount, 0) + p_amount,
           state       = CASE WHEN COALESCE(paid_amount, 0) + p_amount >= amount_due THEN 'paid' ELSE state END,
           paid_at     = CASE WHEN COALESCE(paid_amount, 0) + p_amount >= amount_due THEN paid_on ELSE paid_at END,
           updated_at  = now()
     WHERE id = p_milestone AND vendor_id = p_vendor AND state = 'pending'
    RETURNING * INTO ms;
    IF NOT FOUND THEN why := 'NOT_PENDING'; END IF;
  END IF;
  IF why IS NOT NULL THEN
    IF ev IS NOT NULL THEN   -- money arrived: never dropped. Kept, marked, and said.
      UPDATE public.vendor_pay_events SET applied = false, not_applied_reason = why WHERE id = ev;
      RETURN jsonb_build_object('ok', true, 'duplicate', false, 'applied', false, 'code', why);
    END IF;
    RETURN jsonb_build_object('ok', false, 'code', why);
  END IF;
  inv := public.pay_settle_invoice(p_vendor, ms.invoice_id, p_amount);
  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'applied', true, 'settled', ms.state = 'paid', 'milestone', to_jsonb(ms), 'invoice', to_jsonb(inv));
END $$;

-- The invoice's side of a payment, ONE home for both recorders: amount_paid rises by what came in; the state is decided
-- exactly as markMilestonePaid decided it in JS (>= total → paid; unpaid → advance_paid; else unchanged); the due date
-- is the next pending line's, or null when none is left. A CANCELLED invoice is never moved, whoever calls this.
CREATE FUNCTION public.pay_settle_invoice(p_vendor uuid, p_invoice uuid, p_amount integer)
RETURNS public.invoices LANGUAGE plpgsql AS $$
DECLARE inv public.invoices%ROWTYPE;
BEGIN
  UPDATE public.invoices
     SET amount_paid = amount_paid + p_amount,
         state       = CASE WHEN amount_paid + p_amount >= amount_total THEN 'paid' WHEN state = 'unpaid' THEN 'advance_paid' ELSE state END,
         due_date    = (SELECT s.due_date FROM public.payment_schedules s
                         WHERE s.invoice_id = p_invoice AND s.vendor_id = p_vendor AND s.state = 'pending'
                         ORDER BY s.ordinal LIMIT 1),
         updated_at  = now()
   WHERE id = p_invoice AND vendor_id = p_vendor AND state <> 'cancelled'
  RETURNING * INTO inv;
  RETURN inv;
END $$;

-- A LINK FOR THE WHOLE INVOICE (the chair's default, turn 36): the money fills the pending lines in ordinal order, each
-- to its amount_due before the next, IN THIS ONE CALL; anything left over is recorded as received on the invoice. An
-- invoice with no schedule lines simply receives it. Once only by payment id. ONE LOCK ORDER: the invoice first, then
-- its lines in ordinal order. Not hers or no such invoice: kept, NO_INVOICE, invoice_id null. Cancelled: kept,
-- INVOICE_CANCELLED.
CREATE FUNCTION public.pay_record_invoice(p_vendor uuid, p_invoice uuid, p_amount integer, p_received date,
                                          p_provider text, p_payment_id text, p_link uuid DEFAULT NULL, p_method text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE ln public.payment_schedules%ROWTYPE; inv public.invoices%ROWTYPE; paid_on timestamptz; ev uuid; owned uuid;
        left_over integer := p_amount; take integer; filled jsonb := '[]'::jsonb; st text; why text;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN RETURN jsonb_build_object('ok', false, 'code', 'BAD_AMOUNT'); END IF;
  IF p_provider IS NULL OR p_payment_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'NO_PROVIDER'); END IF;
  paid_on := CASE WHEN p_received IS NULL THEN now() ELSE (p_received::timestamp AT TIME ZONE 'Asia/Kolkata') END;
  SELECT id INTO owned FROM public.invoices WHERE id = p_invoice AND vendor_id = p_vendor;   -- hers, or null: never another's id
  INSERT INTO public.vendor_pay_events (vendor_id, provider, provider_payment_id, kind, link_id, invoice_id, amount, method)
  VALUES (p_vendor, p_provider, p_payment_id, 'paid', p_link, owned, p_amount, p_method)
  ON CONFLICT (provider, provider_payment_id, kind) DO NOTHING
  RETURNING id INTO ev;
  IF ev IS NULL THEN RETURN jsonb_build_object('ok', true, 'duplicate', true); END IF;
  SELECT state INTO st FROM public.invoices WHERE id = p_invoice AND vendor_id = p_vendor FOR UPDATE;   -- the invoice FIRST
  IF st IS NULL THEN why := 'NO_INVOICE'; ELSIF st = 'cancelled' THEN why := 'INVOICE_CANCELLED'; END IF;
  IF why IS NOT NULL THEN
    UPDATE public.vendor_pay_events SET applied = false, not_applied_reason = why WHERE id = ev;
    RETURN jsonb_build_object('ok', true, 'duplicate', false, 'applied', false, 'code', why);
  END IF;
  FOR ln IN SELECT * FROM public.payment_schedules
             WHERE invoice_id = p_invoice AND vendor_id = p_vendor AND state = 'pending'
             ORDER BY ordinal FOR UPDATE LOOP
    EXIT WHEN left_over <= 0;
    take := LEAST(left_over, ln.amount_due - COALESCE(ln.paid_amount, 0));
    CONTINUE WHEN take <= 0;
    UPDATE public.payment_schedules
       SET paid_amount = COALESCE(paid_amount, 0) + take,
           state       = CASE WHEN COALESCE(paid_amount, 0) + take >= amount_due THEN 'paid' ELSE state END,
           paid_at     = CASE WHEN COALESCE(paid_amount, 0) + take >= amount_due THEN paid_on ELSE paid_at END,
           updated_at  = now()
     WHERE id = ln.id;
    filled := filled || jsonb_build_object('milestone_id', ln.id, 'amount', take);
    left_over := left_over - take;
  END LOOP;
  inv := public.pay_settle_invoice(p_vendor, p_invoice, p_amount);
  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'applied', true, 'lines', filled, 'over', left_over, 'invoice', to_jsonb(inv));
END $$;

-- NO search_path IS SET (b91 7.17, the estate's RLS ladder: a checker cannot judge unqualified names under a set path).
-- Every table, type and function above is written public.<name>; only built-ins (now, coalesce, jsonb_build_object,
-- to_jsonb, least, pg_catalog) are unqualified.

-- EXECUTE BY NAME (the chair, turn 36): Supabase's default privileges grant new functions to anon and authenticated, so
-- PUBLIC alone is not enough. Only the server's role may call these.
REVOKE ALL ON FUNCTION public.pay_record_milestone(uuid, uuid, integer, date, text, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pay_settle_invoice(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pay_record_invoice(uuid, uuid, integer, date, text, text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pay_record_milestone(uuid, uuid, integer, date, text, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.pay_settle_invoice(uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.pay_record_invoice(uuid, uuid, integer, date, text, text, uuid, text) TO service_role;

COMMIT;
