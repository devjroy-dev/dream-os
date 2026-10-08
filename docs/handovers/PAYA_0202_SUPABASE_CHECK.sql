-- PAY-A · 0202 · THE FOUNDER'S DATABASE CHECK (paste into the Supabase SQL editor AFTER 0201 and 0202 are applied and
-- PAYA_0201_SUPABASE_CHECK.sql has read eight t). Everything happens inside BEGIN ... ROLLBACK, on rows it makes itself
-- for the first vendor it finds, so it leaves NOTHING behind. It prints ONE row of eight true/false columns: every column
-- should read true. Each right is asked one per call (F-44.366: a comma list answers true if ANY is held).
BEGIN;
-- GUARD (the chair, turn 56; F-44.420 adds the two live names): a rollback undoes rows, not an outside call. The repo's bytes show exactly two triggers on
-- the tables this check writes: invoices_set_updated_at (sets updated_at, calls nothing) and the vendors triggers, which
-- this check never fires (it writes no vendor row). A trigger made outside the repo (a Supabase "Database Webhook" is a
-- trigger calling supabase_functions.http_request) cannot be seen in the bytes, so the check looks for itself and STOPS
-- before writing anything if any other trigger sits on these tables. invoices is in supabase_realtime; Realtime sends
-- only COMMITTED changes, and this transaction never commits.
DO $$
DECLARE extra text;
BEGIN
  SELECT string_agg(c.relname || '.' || t.tgname, ', ') INTO extra
    FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE NOT t.tgisinternal AND n.nspname = 'public'
     AND c.relname IN ('invoices', 'payment_schedules', 'vendor_pay_accounts', 'vendor_pay_links', 'vendor_pay_events', 'vendor_pay_settings', 'vendor_pay_oauth_states', 'vendor_pay_event_answers')
     AND t.tgname NOT IN ('invoices_set_updated_at', 'invoices_updated_at', 'payment_schedules_set_updated_at');   -- F-44.420: the two live names, read by the chair (set_updated_at only)
  IF extra IS NOT NULL THEN RAISE EXCEPTION 'The check stopped before writing anything, because it found a trigger it did not expect: %. Copy this line and send it to the chair.', extra;  END IF;
END $$;
CREATE TEMP TABLE _r (k text, v jsonb) ON COMMIT DROP;
DO $$
DECLARE v uuid; inv uuid := gen_random_uuid(); l1 uuid := gen_random_uuid(); l2 uuid := gen_random_uuid(); cinv uuid := gen_random_uuid();
        n1 text; n2 text; nx text; ap boolean;
BEGIN
  SELECT id INTO v FROM public.vendors LIMIT 1;
  -- single-use states
  INSERT INTO public.vendor_pay_oauth_states (nonce, vendor_id, session_id, expires_at) VALUES ('PAYA-CHECK-NONCE-1', v, 's', now() + interval '10 minutes'), ('PAYA-CHECK-NONCE-2', v, 's', now() - interval '1 minute');
  UPDATE public.vendor_pay_oauth_states SET spent_at = now() WHERE nonce = 'PAYA-CHECK-NONCE-1' AND spent_at IS NULL AND expires_at > now() RETURNING nonce INTO n1;
  INSERT INTO _r VALUES ('spend1', jsonb_build_object('nonce', n1));
  UPDATE public.vendor_pay_oauth_states SET spent_at = now() WHERE nonce = 'PAYA-CHECK-NONCE-1' AND spent_at IS NULL AND expires_at > now() RETURNING nonce INTO n2;
  INSERT INTO _r VALUES ('spend2', jsonb_build_object('nonce', n2));
  UPDATE public.vendor_pay_oauth_states SET spent_at = now() WHERE nonce = 'PAYA-CHECK-NONCE-2' AND spent_at IS NULL AND expires_at > now() RETURNING nonce INTO nx;
  INSERT INTO _r VALUES ('spendx', jsonb_build_object('nonce', nx));
  -- an invoice with two lines, both paid in through 0201; a line refund and an over-large whole refund taken off
  INSERT INTO public.invoices (id, vendor_id, invoice_number, client_name, amount_total, amount_paid, state, due_date)
  VALUES (inv, v, 'PAYA-CHECK-2', 'Check', 60000, 0, 'unpaid', '2026-12-01'), (cinv, v, 'PAYA-CHECK-2C', 'Check', 10000, 0, 'cancelled', NULL);
  INSERT INTO public.payment_schedules (id, invoice_id, vendor_id, milestone_label, pct, amount_due, due_date, state, ordinal)
  VALUES (l1, inv, v, 'First', 50, 30000, '2026-12-01', 'pending', 1), (l2, inv, v, 'Second', 50, 30000, '2027-01-01', 'pending', 2);
  PERFORM public.pay_record_milestone(v, l1, 30000, current_date, 'razorpay', 'PAYA-CHECK-P1');
  PERFORM public.pay_record_milestone(v, l2, 20000, current_date, 'razorpay', 'PAYA-CHECK-P2');
  INSERT INTO public.vendor_pay_events (vendor_id, provider, provider_payment_id, kind, milestone_id, invoice_id, amount, applied)
  VALUES (v, 'razorpay', 'PAYA-CHECK-R1', 'refunded', l1, inv, 5000, false), (v, 'razorpay', 'PAYA-CHECK-R2', 'refunded', NULL, inv, 60000, false),
         (v, 'razorpay', 'PAYA-CHECK-RC', 'refunded', NULL, cinv, 100, false);
  INSERT INTO _r VALUES ('t1', public.pay_take_off_refund(v, 'razorpay', 'PAYA-CHECK-R1'));
  INSERT INTO _r VALUES ('t1b', public.pay_take_off_refund(v, 'razorpay', 'PAYA-CHECK-R1'));
  INSERT INTO _r VALUES ('line1', (SELECT to_jsonb(s) FROM public.payment_schedules s WHERE id = l1));
  INSERT INTO _r VALUES ('t2', public.pay_take_off_refund(v, 'razorpay', 'PAYA-CHECK-R2'));
  INSERT INTO _r VALUES ('inv', (SELECT to_jsonb(i) FROM public.invoices i WHERE id = inv));
  INSERT INTO _r VALUES ('tc', public.pay_take_off_refund(v, 'razorpay', 'PAYA-CHECK-RC'));
  INSERT INTO _r VALUES ('cinv', (SELECT to_jsonb(i) FROM public.invoices i WHERE id = cinv));
  DELETE FROM public.vendor_pay_settings WHERE vendor_id = v;   -- inside the ROLLBACK: her real row, if any, comes back
  INSERT INTO public.vendor_pay_settings (vendor_id) VALUES (v) RETURNING accept_partial INTO ap;
  INSERT INTO _r VALUES ('set', jsonb_build_object('accept_partial', ap));
END $$;
SELECT
  (SELECT v->>'nonce' FROM _r WHERE k='spend1') = 'PAYA-CHECK-NONCE-1' AND (SELECT v->>'nonce' FROM _r WHERE k='spend2') IS NULL      AS state_spent_once,
  (SELECT v->>'nonce' FROM _r WHERE k='spendx') IS NULL                                                                              AS expired_state_refused,
  (SELECT v->>'ok' FROM _r WHERE k='t1') = 'true' AND (SELECT v->>'code' FROM _r WHERE k='t1b') = 'ALREADY_TAKEN_OFF'
    AND (SELECT v->>'state' FROM _r WHERE k='line1') = 'pending' AND (SELECT (v->>'paid_amount')::int FROM _r WHERE k='line1') = 25000 AS refund_taken_off_once,
  (SELECT (v->>'amount_paid')::int FROM _r WHERE k='inv') = 0 AND (SELECT v->>'state' FROM _r WHERE k='inv') = 'unpaid'      AS never_below_zero,
  (SELECT v->>'code' FROM _r WHERE k='tc') = 'INVOICE_CANCELLED' AND (SELECT v->>'state' FROM _r WHERE k='cinv') = 'cancelled' AS cancelled_invoice_untouched,
  (SELECT v->>'accept_partial' FROM _r WHERE k='set') = 'false'                                                            AS part_payment_off_by_default,
  NOT has_function_privilege('anon', 'public.pay_take_off_refund(uuid,text,text)', 'execute')
    AND NOT has_function_privilege('authenticated', 'public.pay_take_off_refund(uuid,text,text)', 'execute')
    AND NOT has_function_privilege('anon', 'public.pay_sweep_oauth_states()', 'execute')
    AND NOT has_function_privilege('authenticated', 'public.pay_sweep_oauth_states()', 'execute')                          AS only_the_server_may_call,
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.vendor_pay_oauth_states'::regclass)
    AND has_table_privilege('service_role', 'public.vendor_pay_oauth_states', 'SELECT')
    AND has_table_privilege('service_role', 'public.vendor_pay_oauth_states', 'INSERT')
    AND has_table_privilege('service_role', 'public.vendor_pay_oauth_states', 'UPDATE')
    AND has_table_privilege('service_role', 'public.vendor_pay_oauth_states', 'DELETE')
    AND (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.vendor_pay_event_answers'::regclass)
    AND has_table_privilege('service_role', 'public.vendor_pay_event_answers', 'SELECT')
    AND has_table_privilege('service_role', 'public.vendor_pay_event_answers', 'INSERT')
    AND has_table_privilege('service_role', 'public.vendor_pay_event_answers', 'UPDATE')
    AND has_table_privilege('service_role', 'public.vendor_pay_event_answers', 'DELETE')                                    AS both_tables_locked_and_granted;
ROLLBACK;
