-- scripts/lib/b207r_0193_rows.sql · CE-47 WEB-4 cut 12 (b207): planted rows (a vendor; two rows per table), so the rehearsal
-- proves every row unchanged by 0193 (counts and a hash per table).
INSERT INTO public.vendors (id) VALUES ('11111111-1111-4111-8111-111111111111');
INSERT INTO public.invoices (id) VALUES ('22222222-2222-4222-8222-222222222222');
INSERT INTO public.team_members (id, vendor_id, name) VALUES ('10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 't');
INSERT INTO public.team_members (id, vendor_id, name) VALUES ('20000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 't');
INSERT INTO public.team_tasks (id, vendor_id, title) VALUES ('11000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 't');
INSERT INTO public.team_tasks (id, vendor_id, title) VALUES ('21000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 't');
INSERT INTO public.contracts (id, vendor_id, title) VALUES ('12000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 't');
INSERT INTO public.contracts (id, vendor_id, title) VALUES ('22000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 't');
INSERT INTO public.payment_schedules (id, invoice_id, vendor_id, milestone_label, pct, amount_due, ordinal) VALUES ('13000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 't', 1, 1, 1);
INSERT INTO public.payment_schedules (id, invoice_id, vendor_id, milestone_label, pct, amount_due, ordinal) VALUES ('23000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 't', 1, 1, 1);
INSERT INTO public.tds_ledger (id, vendor_id, client_name, gross_amount, tds_rate, tds_amount, net_received, deduction_date, financial_year) VALUES ('14000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 't', 1, 1, 1, 1, '2026-10-03', 't');
INSERT INTO public.tds_ledger (id, vendor_id, client_name, gross_amount, tds_rate, tds_amount, net_received, deduction_date, financial_year) VALUES ('24000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 't', 1, 1, 1, 1, '2026-10-03', 't');
INSERT INTO public.team_messages (id, vendor_id, body) VALUES ('15000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 't');
INSERT INTO public.team_messages (id, vendor_id, body) VALUES ('25000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 't');
INSERT INTO public.team_payments (id, team_member_id, vendor_id, amount_inr) VALUES ('16000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 1);
INSERT INTO public.team_payments (id, team_member_id, vendor_id, amount_inr) VALUES ('26000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 1);
INSERT INTO public.discover_heroes (id, image_url) VALUES ('17000000-0000-4000-8000-000000000001', 't');
INSERT INTO public.discover_heroes (id, image_url) VALUES ('27000000-0000-4000-8000-000000000002', 't');
