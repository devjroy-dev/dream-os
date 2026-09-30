-- scripts/lib/b160r_0187_plant.sql · CE-46 · WEB-4 · cut 2 · the rehearsal PLANT for 0179 then 0187 (a stand-in, not production).
-- Run by the bootstrap superuser ONLY to create the roles; every table is then created by `editor`, a NON-SUPERUSER
-- that is not a member of any defining role (SEC-1 §13, "a rehearsal plant runs as a non-superuser editor"), and both
-- migrations are applied as `editor`. The three tables the migrations reference carry only the columns they reference.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'editor') THEN CREATE ROLE editor LOGIN NOSUPERUSER NOCREATEROLE NOCREATEDB; END IF;
END $$;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, CREATE ON SCHEMA public TO editor;
-- the default ACL as witnessed on production (F-44.169): a table made by the editor reaches service_role with these only
ALTER DEFAULT PRIVILEGES FOR ROLE editor IN SCHEMA public GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLES TO service_role;
SET ROLE editor;
CREATE TABLE public.vendors (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_name text, routing_handle text);
CREATE TABLE public.vendor_packages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), vendor_id uuid NOT NULL, name text NOT NULL);
CREATE TABLE public.clients (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), vendor_id uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors, public.vendor_packages, public.clients TO service_role;
REVOKE ALL ON public.vendors, public.vendor_packages, public.clients FROM anon, authenticated, PUBLIC;
INSERT INTO public.vendors (id, business_name, routing_handle) VALUES ('11111111-1111-1111-1111-111111111111', 'Studio Ivara', 'DEV440');
INSERT INTO public.vendor_packages (id, vendor_id, name) VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Bridal makeup and hair');
INSERT INTO public.clients (id, vendor_id) VALUES ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111');
RESET ROLE;
