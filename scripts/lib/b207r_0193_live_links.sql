-- scripts/lib/b207r_0193_live_links.sql · CE-47 WEB-4 cut 12 (b207): the 22 links exactly as the live catalogue gives them
-- (the founder's read-only pg_constraint read, 3 October 2026), constraint names and pg_get_constraintdef text verbatim.
ALTER TABLE public.contracts ADD CONSTRAINT contracts_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_lead_package_id_fkey FOREIGN KEY (lead_package_id) REFERENCES lead_packages(id) ON DELETE SET NULL;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public.payment_schedules ADD CONSTRAINT payment_schedules_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
ALTER TABLE public.payment_schedules ADD CONSTRAINT payment_schedules_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public.tds_ledger ADD CONSTRAINT tds_ledger_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE public.tds_ledger ADD CONSTRAINT tds_ledger_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
ALTER TABLE public.tds_ledger ADD CONSTRAINT tds_ledger_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public.team_members ADD CONSTRAINT team_members_roster_vendor_id_fkey FOREIGN KEY (roster_vendor_id) REFERENCES vendor_roster(id) ON DELETE SET NULL;
ALTER TABLE public.team_members ADD CONSTRAINT team_members_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public.team_messages ADD CONSTRAINT team_messages_linked_event_id_fkey FOREIGN KEY (linked_event_id) REFERENCES events(id) ON DELETE SET NULL;
ALTER TABLE public.team_messages ADD CONSTRAINT team_messages_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public.team_payments ADD CONSTRAINT team_payments_linked_event_id_fkey FOREIGN KEY (linked_event_id) REFERENCES events(id) ON DELETE SET NULL;
ALTER TABLE public.team_payments ADD CONSTRAINT team_payments_linked_task_id_fkey FOREIGN KEY (linked_task_id) REFERENCES team_tasks(id) ON DELETE SET NULL;
ALTER TABLE public.team_payments ADD CONSTRAINT team_payments_team_member_id_fkey FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE;
ALTER TABLE public.team_payments ADD CONSTRAINT team_payments_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE public.team_tasks ADD CONSTRAINT team_tasks_assigned_to_member_id_fkey FOREIGN KEY (assigned_to_member_id) REFERENCES team_members(id) ON DELETE SET NULL;
ALTER TABLE public.team_tasks ADD CONSTRAINT team_tasks_linked_event_id_fkey FOREIGN KEY (linked_event_id) REFERENCES events(id) ON DELETE SET NULL;
ALTER TABLE public.team_tasks ADD CONSTRAINT team_tasks_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
