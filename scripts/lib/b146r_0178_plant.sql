-- scripts/lib/b146r_0178_plant.sql · CE-46 · WEB-1 · cut 2 · A-45.8's rehearsal PLANT for 0178 (a stand-in, not production).
-- The three Supabase roles (service_role BYPASSRLS), a vendors table with the columns 0178 references, the default ACL as
-- witnessed on 25 September (tables created by postgres give service_role nothing but REFERENCES, TRIGGER, TRUNCATE), so the
-- rehearsal proves the GRANT inside 0178 is what lets service_role read and write. Run by scripts/lib/b146r_0178_rehearse.sh.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE TABLE public.vendors (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_name text, routing_handle text);
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO service_role;
REVOKE ALL ON public.vendors FROM anon, authenticated, PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLES TO service_role;
INSERT INTO public.vendors (id, business_name, routing_handle) VALUES ('11111111-1111-1111-1111-111111111111', 'Aarohi Sen Photography', 'DEV440');
