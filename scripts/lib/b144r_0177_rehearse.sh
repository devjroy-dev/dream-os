#!/bin/bash
# scripts/lib/b144r_0177_rehearse.sh · CE-46 · ADS-1 · the rehearsal of 0177 on a throwaway Postgres 16 (A-45.8). Usage: sudo-less root: bash scripts/lib/b144r_0177_rehearse.sh db/migrations/0177_ads.sql
set -u
PG=/usr/lib/postgresql/16/bin; D=/tmp/pg0177; rm -rf $D; mkdir -p $D; chown postgres $D
su postgres -c "$PG/initdb -D $D -A trust -U postgres" >/dev/null
su postgres -c "$PG/pg_ctl -D $D -o '-p 5499 -k /tmp' -l $D/log start -w" >/dev/null
Q(){ su postgres -c "psql -h /tmp -p 5499 -U postgres -v ON_ERROR_STOP=1 -qAt -c \"$1\""; }
# the estate's shape, minimal: three roles, the narrowed default 0172 witnessed, vendors, capabilities with its real CHECKs
su postgres -c "psql -h /tmp -p 5499 -U postgres -v ON_ERROR_STOP=1 -q" <<'SQL'
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT TRUNCATE, REFERENCES, TRIGGER ON TABLES TO service_role;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE public.vendors (id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY, user_id uuid NOT NULL);
CREATE TABLE public.capabilities (key text PRIMARY KEY, kind text NOT NULL, status text NOT NULL, evidence text,
  checked_at timestamptz, flipped_at timestamptz, flipped_by text, auto_on boolean NOT NULL DEFAULT false, walk_ref text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capabilities_auto_on_needs_walk CHECK ((auto_on = false) OR (walk_ref IS NOT NULL)),
  CONSTRAINT capabilities_key_grammar_check CHECK (key ~ '^(template|perm|scope|flag)\.[a-z0-9_.]+$'),
  CONSTRAINT capabilities_kind_check CHECK (kind IN ('template','permission','scope','flag')),
  CONSTRAINT capabilities_status_check CHECK (status IN ('pending','approved','rejected','paused','armed','on','off')));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors, public.capabilities TO service_role;
INSERT INTO public.vendors (user_id) VALUES (gen_random_uuid());
SQL
echo "== apply 0177"; su postgres -c "psql -h /tmp -p 5499 -U postgres -v ON_ERROR_STOP=1 -q -f $1" && echo "applied exit 0"
echo "== state (the card's read-only SELECT)"
Q "SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('vendor_ad_connections','vendor_ads') ORDER BY 1"
Q "SELECT table_name, string_agg(privilege_type, ',' ORDER BY privilege_type) FROM information_schema.role_table_grants WHERE grantee='service_role' AND table_name IN ('vendor_ad_connections','vendor_ads') AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE') GROUP BY 1 ORDER BY 1"
Q "SELECT key, kind, status FROM public.capabilities WHERE key='flag.ads'"
echo "== as service_role: write and read"
V=$(Q "SELECT id FROM vendors LIMIT 1")
Q "SET ROLE service_role; INSERT INTO vendor_ad_connections (vendor_id, pending_state_nonce, pending_state_at) VALUES ('$V','n1',now()); UPDATE vendor_ad_connections SET ad_account_id='act_123', access_token='t' WHERE vendor_id='$V'; INSERT INTO vendor_ads (vendor_id, kind, ad_account_id, daily_budget_minor, currency, days) VALUES ('$V','boost','act_123',20000,'INR',3); SELECT count(*) FROM vendor_ads;" && echo "service_role ok"
echo "== as anon and authenticated: no row (expect errors or 0)"
for R in anon authenticated; do Q "SET ROLE $R; SELECT count(*) FROM vendor_ad_connections" 2>&1 | tail -1; done
echo "== refusals the CHECKs must make"
Q "INSERT INTO vendor_ad_connections (vendor_id) VALUES ('$V')" 2>&1 | grep -o 'duplicate key[^"]*' | head -1
Q "UPDATE vendor_ad_connections SET ad_account_id='4417'" 2>&1 | grep -o 'violates check constraint "[^"]*"'
Q "INSERT INTO vendor_ads (vendor_id, kind, ad_account_id, daily_budget_minor, currency, days) VALUES ('$V','video','act_1',1,'INR',1)" 2>&1 | grep -o 'violates check constraint "[^"]*"'
Q "INSERT INTO vendor_ads (vendor_id, kind, ad_account_id, daily_budget_minor, currency, days) VALUES ('$V','boost','act_1',0,'INR',1)" 2>&1 | grep -o 'violates check constraint "[^"]*"'
Q "INSERT INTO vendor_ads (vendor_id, kind, ad_account_id, daily_budget_minor, currency, days) VALUES ('$V','boost','act_1',100,'INR',31)" 2>&1 | grep -o 'violates check constraint "[^"]*"'
Q "INSERT INTO capabilities (key, kind, status) VALUES ('flag.ads','flag','off')" 2>&1 | grep -o 'duplicate key[^"]*' | head -1
echo "== the revert, then re-apply (idempotence of the pair)"
Q "BEGIN; DELETE FROM public.capabilities WHERE key = 'flag.ads'; DROP TABLE public.vendor_ads; DROP TABLE public.vendor_ad_connections; COMMIT;" && su postgres -c "psql -h /tmp -p 5499 -U postgres -v ON_ERROR_STOP=1 -q -f $1" && echo "revert and re-apply exit 0"
su postgres -c "$PG/pg_ctl -D $D stop -m fast" >/dev/null; rm -rf $D; echo "== throwaway destroyed"
