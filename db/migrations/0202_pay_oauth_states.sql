-- db/migrations/0202_pay_oauth_states.sql — TDW · CE-47 · INS · PAY-A · SINGLE-USE CONNECT STATES, AND THE REFUND TAKE-OFF.
-- The chair's go (turn 48). New table and two functions only; no existing table altered; no search_path set (b91);
-- every name written public.<name>; EXECUTE for service_role only. OUT_OF_ORDER.json record 202 is WEB-4's to write.
BEGIN;

-- ── SINGLE-USE `state` FOR "CONNECT RAZORPAY". One row per state issued (payRazorpay.makeState). Spending is one UPDATE
-- ... WHERE spent_at IS NULL AND expires_at > now() RETURNING (the caller, payLinks.js); a replay, a late return or
-- another vendor's state finds nothing and is refused.
CREATE TABLE public.vendor_pay_oauth_states (
  nonce        text PRIMARY KEY CHECK (length(nonce) BETWEEN 16 AND 128),
  vendor_id    uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  session_id   text NOT NULL,
  expires_at   timestamptz NOT NULL,
  spent_at     timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vendor_pay_oauth_states_old ON public.vendor_pay_oauth_states (expires_at);
ALTER TABLE public.vendor_pay_oauth_states ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_pay_oauth_states TO service_role;

-- The old-row sweep: spent or expired states older than a day are removed. Returns how many.
CREATE FUNCTION public.pay_sweep_oauth_states()
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.vendor_pay_oauth_states
   WHERE (spent_at IS NOT NULL AND spent_at < now() - interval '1 day')
      OR (expires_at < now() - interval '1 day');
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- ── THE REFUND TAKE-OFF (the founder's ruling 6; the chair, turn 48). HER TAP, never automatic. A refund already
-- recorded as a 'refunded' event (applied = false until taken off) is taken off her invoice ONCE, in one step:
--   the invoice row FOR UPDATE first (0201's lock order), then the event flipped applied = true (once per refund id),
--   then the line(s): a line refund comes off its own line; a whole-invoice refund comes off the paid lines from the
--   LAST backwards; never below zero; a line no longer covered goes back to pending (paid_at cleared);
--   then the invoice: amount_paid reduced, never below zero; its state re-decided by pay_settle_invoice's rules run
--   backwards (total still met → paid; above zero → advance_paid; zero → unpaid); the due date the next pending line.
-- Answers: { ok:true, invoice, lines } · { ok:false, code: NO_REFUND | ALREADY_TAKEN_OFF | NO_INVOICE | INVOICE_CANCELLED }.
-- The binder is mirrored after, by the caller, through the same executeAndPatch('donna_money_edit') call the payments
-- door makes (schedules.js mirrorToBinder); invoices.js is not edited.
CREATE FUNCTION public.pay_take_off_refund(p_vendor uuid, p_provider text, p_refund_id text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE ev public.vendor_pay_events%ROWTYPE; st text; tot integer; paid integer; left_over integer; take integer;
        ln public.payment_schedules%ROWTYPE; inv public.invoices%ROWTYPE; lines jsonb := '[]'::jsonb; inv_id uuid;
BEGIN
  SELECT * INTO ev FROM public.vendor_pay_events
   WHERE vendor_id = p_vendor AND provider = p_provider AND provider_payment_id = p_refund_id AND kind = 'refunded';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'NO_REFUND'); END IF;
  inv_id := COALESCE(ev.invoice_id, (SELECT s.invoice_id FROM public.payment_schedules s WHERE s.id = ev.milestone_id AND s.vendor_id = p_vendor));
  SELECT state, amount_total INTO st, tot FROM public.invoices WHERE id = inv_id AND vendor_id = p_vendor FOR UPDATE;   -- the invoice FIRST
  IF st IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'NO_INVOICE'); END IF;
  IF st = 'cancelled' THEN RETURN jsonb_build_object('ok', false, 'code', 'INVOICE_CANCELLED'); END IF;
  UPDATE public.vendor_pay_events SET applied = true WHERE id = ev.id AND applied = false;   -- ONCE per refund id
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'ALREADY_TAKEN_OFF'); END IF;
  left_over := ev.amount;
  FOR ln IN SELECT * FROM public.payment_schedules
             WHERE invoice_id = inv_id AND vendor_id = p_vendor AND COALESCE(paid_amount, 0) > 0
               AND (ev.milestone_id IS NULL OR id = ev.milestone_id)
             ORDER BY ordinal DESC FOR UPDATE LOOP
    EXIT WHEN left_over <= 0;
    take := LEAST(left_over, COALESCE(ln.paid_amount, 0));
    UPDATE public.payment_schedules
       SET paid_amount = COALESCE(paid_amount, 0) - take,
           state       = CASE WHEN state = 'paid' AND COALESCE(paid_amount, 0) - take < amount_due THEN 'pending' ELSE state END,
           paid_at     = CASE WHEN state = 'paid' AND COALESCE(paid_amount, 0) - take < amount_due THEN NULL ELSE paid_at END,
           updated_at  = now()
     WHERE id = ln.id;
    lines := lines || jsonb_build_object('milestone_id', ln.id, 'amount', take);
    left_over := left_over - take;
  END LOOP;
  UPDATE public.invoices
     SET amount_paid = GREATEST(0, amount_paid - ev.amount),
         state       = CASE WHEN GREATEST(0, amount_paid - ev.amount) >= amount_total THEN 'paid'
                            WHEN GREATEST(0, amount_paid - ev.amount) > 0 THEN 'advance_paid' ELSE 'unpaid' END,
         due_date    = (SELECT s.due_date FROM public.payment_schedules s
                         WHERE s.invoice_id = inv_id AND s.vendor_id = p_vendor AND s.state = 'pending'
                         ORDER BY s.ordinal LIMIT 1),
         updated_at  = now()
   WHERE id = inv_id AND vendor_id = p_vendor
  RETURNING * INTO inv;
  RETURN jsonb_build_object('ok', true, 'invoice', to_jsonb(inv), 'lines', lines);
END $$;

-- RULING 7 (the chair, turn 51): part payment on WHOLE-INVOICE links is her setting, default off. The server reads it;
-- false means a whole-invoice link asks for the whole amount still owed. A link for one line is always whole.
ALTER TABLE public.vendor_pay_settings ADD COLUMN accept_partial boolean NOT NULL DEFAULT false;

-- ── (b) A PAYMENT ON A BINDER-ONLY INVOICE (the chair, turns 48 to 50). An ordinary invoice may live only as an engine
-- binder (engine.records), with no public.invoices row. Its money is written by the payments door's own call
-- (executeAndPatch 'donna_money_edit', in JS), which cannot share a transaction with this table. So:
--   1 HOLD    · the event is stored first, once only by payment id, applied = false, reason BINDER_PENDING;
--   2 CLAIM   · one apply per BINDER at a time, decided here under an advisory lock on the binder (never by timing);
--   3 BASE    · under the claim the binder's amount_received is read once and kept (binder_base_received); a stale
--               claim that already holds a base is a RETRY and the base is never re-read;
--   4 WRITE   · base + amount, through the payments door's call (JS);
--   5 FLIP    · applied = true, claim released, only on the engine's success.
-- A retry compares: base + amount → flip only; base → write then flip; anything else → BINDER_UNCERTAIN, shown to her
-- with two actions, each once only and recorded with who and when; no sweep ever resolves it.
ALTER TABLE public.vendor_pay_links ADD COLUMN binder_id uuid;
ALTER TABLE public.vendor_pay_links ALTER COLUMN invoice_id DROP NOT NULL;
ALTER TABLE public.vendor_pay_links ADD CONSTRAINT vendor_pay_links_one_home CHECK (num_nonnulls(invoice_id, binder_id) = 1);
ALTER TABLE public.vendor_pay_events ADD COLUMN binder_id uuid;
ALTER TABLE public.vendor_pay_events ADD COLUMN claimed_at timestamptz;
ALTER TABLE public.vendor_pay_events ADD COLUMN binder_base_received integer;
ALTER TABLE public.vendor_pay_events DROP CONSTRAINT vendor_pay_events_not_applied_reason_check;
ALTER TABLE public.vendor_pay_events ADD CONSTRAINT vendor_pay_events_not_applied_reason_check CHECK (not_applied_reason IS NULL OR
  not_applied_reason IN ('NOT_PENDING', 'INVOICE_CANCELLED', 'NO_INVOICE', 'NO_LINE', 'BINDER_PENDING', 'BINDER_UNCERTAIN'));
CREATE INDEX vendor_pay_events_binder_pending ON public.vendor_pay_events (binder_id) WHERE applied = false;

-- HER ANSWERS, ONE ROW PER ROUND (the chair, turn 59): an 'added' that ends uncertain again is a NEW question to her,
-- answered in a new round; the first round's row is never overwritten.
CREATE TABLE public.vendor_pay_event_answers (
  event_id     uuid NOT NULL REFERENCES public.vendor_pay_events(id) ON DELETE CASCADE,
  round        integer NOT NULL CHECK (round >= 1),
  action       text NOT NULL CHECK (action IN ('already_on', 'added')),
  answered_by  uuid NOT NULL,
  answered_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, round)
);
ALTER TABLE public.vendor_pay_event_answers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_pay_event_answers TO service_role;

-- 1 HOLD. Answers { ok, duplicate } or { ok, held, event_id }.
CREATE FUNCTION public.pay_hold_binder_payment(p_vendor uuid, p_binder uuid, p_amount integer, p_provider text, p_payment_id text,
                                               p_link uuid DEFAULT NULL, p_method text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE ev uuid;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN RETURN jsonb_build_object('ok', false, 'code', 'BAD_AMOUNT'); END IF;
  IF p_provider IS NULL OR p_payment_id IS NULL OR p_binder IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'NO_PROVIDER'); END IF;
  INSERT INTO public.vendor_pay_events (vendor_id, provider, provider_payment_id, kind, link_id, binder_id, amount, method, applied, not_applied_reason)
  VALUES (p_vendor, p_provider, p_payment_id, 'paid', p_link, p_binder, p_amount, p_method, false, 'BINDER_PENDING')
  ON CONFLICT (provider, provider_payment_id, kind) DO NOTHING
  RETURNING id INTO ev;
  IF ev IS NULL THEN RETURN jsonb_build_object('ok', true, 'duplicate', true); END IF;
  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'held', true, 'event_id', ev);
END $$;

-- 2 CLAIM. One apply per binder at a time: the advisory lock on the binder serialises every claim for it, so two
-- claims can never both see "no live claim". A claim is live for 5 minutes. Answers the claimed event (with any base
-- already kept) or { ok:false, code: NOT_CLAIMED }.
CREATE FUNCTION public.pay_claim_binder_event(p_vendor uuid, p_event uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE b uuid; e public.vendor_pay_events%ROWTYPE;
BEGIN
  SELECT binder_id INTO b FROM public.vendor_pay_events WHERE id = p_event AND vendor_id = p_vendor;
  IF b IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'NOT_CLAIMED'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('pay_binder:' || b::text, 0));
  UPDATE public.vendor_pay_events x SET claimed_at = now()
   WHERE x.id = p_event AND x.vendor_id = p_vendor AND x.applied = false AND x.not_applied_reason = 'BINDER_PENDING'
     AND (x.claimed_at IS NULL OR x.claimed_at < now() - interval '5 minutes')
     AND NOT EXISTS (SELECT 1 FROM public.vendor_pay_events o WHERE o.binder_id = b AND o.id <> p_event AND o.applied = false
                      AND o.claimed_at IS NOT NULL AND o.claimed_at >= now() - interval '5 minutes')
  RETURNING * INTO e;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'NOT_CLAIMED'); END IF;
  RETURN jsonb_build_object('ok', true, 'event_id', e.id, 'binder_id', e.binder_id, 'amount', e.amount, 'base', e.binder_base_received);
END $$;

-- 3 BASE, kept once, only under her own live claim; never overwritten.
CREATE FUNCTION public.pay_keep_binder_base(p_vendor uuid, p_event uuid, p_base integer)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.vendor_pay_events SET binder_base_received = p_base
   WHERE id = p_event AND vendor_id = p_vendor AND applied = false AND binder_base_received IS NULL
     AND claimed_at IS NOT NULL AND claimed_at >= now() - interval '5 minutes';
  RETURN FOUND;
END $$;

-- 5 FLIP (and the uncertain hold). Each once only.
CREATE FUNCTION public.pay_finish_binder_event(p_vendor uuid, p_event uuid, p_outcome text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  IF p_outcome = 'applied' THEN
    UPDATE public.vendor_pay_events SET applied = true, not_applied_reason = NULL, claimed_at = NULL
     WHERE id = p_event AND vendor_id = p_vendor AND applied = false AND not_applied_reason = 'BINDER_PENDING';
  ELSIF p_outcome = 'uncertain' THEN
    UPDATE public.vendor_pay_events SET not_applied_reason = 'BINDER_UNCERTAIN', claimed_at = NULL
     WHERE id = p_event AND vendor_id = p_vendor AND applied = false AND not_applied_reason = 'BINDER_PENDING';
  ELSIF p_outcome = 'release' THEN
    UPDATE public.vendor_pay_events SET claimed_at = NULL
     WHERE id = p_event AND vendor_id = p_vendor AND applied = false AND not_applied_reason = 'BINDER_PENDING';
  ELSE RETURN false; END IF;
  RETURN FOUND;
END $$;

-- HER TWO ACTIONS on BINDER_UNCERTAIN: one answer per ROUND, each recorded with who and when in its own row. 'already_on'
-- flips with no write; 'added' returns the event to BINDER_PENDING with the base cleared, so the next apply takes a fresh
-- claim and a fresh base. If that apply ends uncertain AGAIN, the event is a new question: the next answer is round 2,
-- and so on. A second answer to the SAME round finds the event no longer uncertain and is refused. No sweep answers.
CREATE FUNCTION public.pay_resolve_binder_event(p_vendor uuid, p_event uuid, p_action text, p_user uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE r integer;
BEGIN
  IF p_action NOT IN ('already_on', 'added') OR p_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'BAD_ACTION'); END IF;
  UPDATE public.vendor_pay_events
     SET applied = (p_action = 'already_on'),
         not_applied_reason = CASE WHEN p_action = 'already_on' THEN NULL ELSE 'BINDER_PENDING' END,
         binder_base_received = CASE WHEN p_action = 'added' THEN NULL ELSE binder_base_received END,
         claimed_at = NULL
   WHERE id = p_event AND vendor_id = p_vendor AND not_applied_reason = 'BINDER_UNCERTAIN';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'NOT_UNCERTAIN'); END IF;
  SELECT COALESCE(max(round), 0) + 1 INTO r FROM public.vendor_pay_event_answers WHERE event_id = p_event;
  INSERT INTO public.vendor_pay_event_answers (event_id, round, action, answered_by) VALUES (p_event, r, p_action, p_user);
  RETURN jsonb_build_object('ok', true, 'action', p_action, 'round', r);
END $$;

REVOKE ALL ON FUNCTION public.pay_hold_binder_payment(uuid, uuid, integer, text, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pay_claim_binder_event(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pay_keep_binder_base(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pay_finish_binder_event(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pay_resolve_binder_event(uuid, uuid, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pay_hold_binder_payment(uuid, uuid, integer, text, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.pay_claim_binder_event(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.pay_keep_binder_base(uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.pay_finish_binder_event(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.pay_resolve_binder_event(uuid, uuid, text, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.pay_sweep_oauth_states() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pay_take_off_refund(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pay_sweep_oauth_states() TO service_role;
GRANT EXECUTE ON FUNCTION public.pay_take_off_refund(uuid, text, text) TO service_role;

COMMIT;
