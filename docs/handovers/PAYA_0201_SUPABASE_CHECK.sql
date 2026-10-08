-- PAY-A · 0201 · THE FOUNDER'S DATABASE CHECK (paste into the Supabase SQL editor AFTER 0201 is applied; run once).
-- Everything happens inside BEGIN ... ROLLBACK, on rows it makes itself for the first vendor it finds, so it leaves
-- NOTHING behind. It prints ONE row of eight true/false columns: every column should read true.
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
DECLARE v uuid; inv uuid := gen_random_uuid(); l1 uuid := gen_random_uuid(); l2 uuid := gen_random_uuid(); r jsonb;
        cinv uuid := gen_random_uuid(); cl uuid := gen_random_uuid();
BEGIN
  SELECT id INTO v FROM public.vendors LIMIT 1;
  INSERT INTO public.invoices (id, vendor_id, invoice_number, client_name, amount_total, amount_paid, state, due_date)
  VALUES (inv, v, 'PAYA-CHECK', 'Check', 60000, 0, 'unpaid', '2026-12-01');
  INSERT INTO public.payment_schedules (id, invoice_id, vendor_id, milestone_label, pct, amount_due, due_date, state, ordinal)
  VALUES (l1, inv, v, 'First', 50, 30000, '2026-12-01', 'pending', 1), (l2, inv, v, 'Second', 50, 30000, '2027-01-01', 'pending', 2);
  INSERT INTO _r VALUES ('part',  public.pay_record_milestone(v, l1, 10000, current_date, 'razorpay', 'CHECK_A'));
  INSERT INTO _r VALUES ('dup',   public.pay_record_milestone(v, l1, 10000, current_date, 'razorpay', 'CHECK_A'));
  INSERT INTO _r VALUES ('rest',  public.pay_record_milestone(v, l1, 20000, current_date, 'razorpay', 'CHECK_B'));
  INSERT INTO _r VALUES ('late',  public.pay_record_milestone(v, l1,  5000, current_date, 'razorpay', 'CHECK_C'));
  INSERT INTO _r VALUES ('hand',  public.pay_record_milestone(v, l1,  5000, current_date));
  INSERT INTO _r VALUES ('line1', (SELECT to_jsonb(s) FROM public.payment_schedules s WHERE id = l1));
  INSERT INTO _r VALUES ('inv',   (SELECT to_jsonb(i) FROM public.invoices i WHERE id = inv));
  INSERT INTO _r VALUES ('kept',  (SELECT to_jsonb(e) FROM public.vendor_pay_events e WHERE provider_payment_id = 'CHECK_C'));
  -- a cancelled invoice with a line still pending: a link payment is kept, and nothing moves
  INSERT INTO public.invoices (id, vendor_id, invoice_number, client_name, amount_total, amount_paid, state, due_date)
  VALUES (cinv, v, 'PAYA-CHECK-C', 'Check', 10000, 0, 'cancelled', '2026-12-01');
  INSERT INTO public.payment_schedules (id, invoice_id, vendor_id, milestone_label, pct, amount_due, due_date, state, ordinal)
  VALUES (cl, cinv, v, 'Only', 100, 10000, '2026-12-01', 'pending', 1);
  INSERT INTO _r VALUES ('canc',  public.pay_record_milestone(v, cl, 10000, current_date, 'razorpay', 'CHECK_D'));
  INSERT INTO _r VALUES ('cinv',  (SELECT to_jsonb(i) FROM public.invoices i WHERE id = cinv));
  INSERT INTO _r VALUES ('cline', (SELECT to_jsonb(s) FROM public.payment_schedules s WHERE id = cl));
  INSERT INTO _r VALUES ('cev',   (SELECT to_jsonb(e) FROM public.vendor_pay_events e WHERE provider_payment_id = 'CHECK_D'));
END $$;
SELECT
  (SELECT v->>'applied' FROM _r WHERE k='part') = 'true' AND (SELECT v->'milestone'->>'state' FROM _r WHERE k='part') = 'pending'  AS part_leaves_line_pending,
  (SELECT v->>'duplicate' FROM _r WHERE k='dup') = 'true'                                                                          AS same_id_counted_once,
  (SELECT (v->>'paid_amount')::int FROM _r WHERE k='line1') = 30000 AND (SELECT v->>'state' FROM _r WHERE k='line1') = 'paid'      AS add_reaches_paid,
  (SELECT (v->>'amount_paid')::int FROM _r WHERE k='inv') = 30000 AND (SELECT v->>'due_date' FROM _r WHERE k='inv') = '2027-01-01' AS invoice_moved_with_it,
  (SELECT v->>'applied' FROM _r WHERE k='late') = 'false' AND (SELECT v->>'not_applied_reason' FROM _r WHERE k='kept') = 'NOT_PENDING' AS late_money_kept_not_dropped,
  (SELECT v->>'ok' FROM _r WHERE k='hand') = 'false' AND (SELECT v->>'code' FROM _r WHERE k='hand') = 'NOT_PENDING'               AS hand_path_refused,
  NOT has_function_privilege('anon', 'public.pay_record_milestone(uuid,uuid,integer,date,text,text,uuid,text)', 'execute')
    AND NOT has_function_privilege('authenticated', 'public.pay_record_invoice(uuid,uuid,integer,date,text,text,uuid,text)', 'execute') AS only_the_server_may_call,
  (SELECT v->>'applied' FROM _r WHERE k='canc') = 'false' AND (SELECT v->>'not_applied_reason' FROM _r WHERE k='cev') = 'INVOICE_CANCELLED'
    AND (SELECT v->>'state' FROM _r WHERE k='cinv') = 'cancelled' AND (SELECT (v->>'amount_paid')::int FROM _r WHERE k='cinv') = 0
    AND (SELECT v->>'state' FROM _r WHERE k='cline') = 'pending'                                                                     AS cancelled_invoice_kept_still;
ROLLBACK;
