-- F-44.55 · ROW LEVEL SECURITY CENSUS, schemas public and engine. READ-ONLY. ONE statement.
-- Reads the catalog itself (pg_class, pg_namespace, pg_policies, pg_roles), so nothing is
-- witnessed against docs/db: the catalog IS the witness.
-- A base table here is relkind 'r' (ordinary) or 'p' (partitioned); views are left out.
-- Privileges are has_table_privilege for the roles anon and authenticated, found by name in
-- pg_roles; if a role does not exist its columns read NULL (never an error), and the control
-- row "roles present" says so.
-- NOT READABLE FROM SQL: whether schema engine is EXPOSED through the API. That is the
-- dashboard's API settings (the "Exposed schemas" list). A table in engine with RLS off and
-- grants to anon is reachable only if engine is exposed there. Read it off the dashboard.
-- CONTROLS: "public base tables" must be above zero (an empty answer cannot pass); the danger
-- count is tables where RLS is OFF and anon or authenticated holds any of the four privileges.
with roles as (
  select (select oid from pg_roles where rolname = 'anon') as anon_oid,
         (select oid from pg_roles where rolname = 'authenticated') as auth_oid),
t as (
  select n.nspname::text as schema_name, c.relname::text as table_name, c.oid,
         c.relrowsecurity as rls_on, c.relforcerowsecurity as rls_forced,
         (select count(*) from pg_policies p where p.schemaname = n.nspname and p.tablename = c.relname) as policies,
         has_table_privilege(r.anon_oid, c.oid, 'SELECT') as anon_select,
         has_table_privilege(r.anon_oid, c.oid, 'INSERT') as anon_insert,
         has_table_privilege(r.anon_oid, c.oid, 'UPDATE') as anon_update,
         has_table_privilege(r.anon_oid, c.oid, 'DELETE') as anon_delete,
         has_table_privilege(r.auth_oid, c.oid, 'SELECT') as auth_select,
         has_table_privilege(r.auth_oid, c.oid, 'INSERT') as auth_insert,
         has_table_privilege(r.auth_oid, c.oid, 'UPDATE') as auth_update,
         has_table_privilege(r.auth_oid, c.oid, 'DELETE') as auth_delete
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  cross join roles r
  where n.nspname in ('public', 'engine') and c.relkind in ('r', 'p')),
d as (
  select t.*, (not t.rls_on) and (coalesce(anon_select or anon_insert or anon_update or anon_delete, false)
              or coalesce(auth_select or auth_insert or auth_update or auth_delete, false)) as open_to_public_roles
  from t)
select 'A table' as section, schema_name, table_name, rls_on, rls_forced, policies,
       anon_select, anon_insert, anon_update, anon_delete,
       auth_select, auth_insert, auth_update, auth_delete, open_to_public_roles, null::bigint as n
from d
union all
select 'B control', 'public', 'public base tables', null, null, null, null, null, null, null, null, null, null, null, null,
       count(*) filter (where schema_name = 'public') from d
union all
select 'B control', 'public', 'public: RLS off', null, null, null, null, null, null, null, null, null, null, null, null,
       count(*) filter (where schema_name = 'public' and not rls_on) from d
union all
select 'B control', 'public', 'public: RLS off AND anon or authenticated holds a privilege', null, null, null, null, null, null, null, null, null, null, null, null,
       count(*) filter (where schema_name = 'public' and open_to_public_roles) from d
union all
select 'B control', 'engine', 'engine base tables', null, null, null, null, null, null, null, null, null, null, null, null,
       count(*) filter (where schema_name = 'engine') from d
union all
select 'B control', 'engine', 'engine: RLS off', null, null, null, null, null, null, null, null, null, null, null, null,
       count(*) filter (where schema_name = 'engine' and not rls_on) from d
union all
select 'B control', 'engine', 'engine: RLS off AND anon or authenticated holds a privilege', null, null, null, null, null, null, null, null, null, null, null, null,
       count(*) filter (where schema_name = 'engine' and open_to_public_roles) from d
union all
select 'B control', null, 'roles present (anon, authenticated; expect 2)', null, null, null, null, null, null, null, null, null, null, null, null,
       ((select count(*) from pg_roles where rolname in ('anon', 'authenticated')))::bigint
union all
select 'C note', 'engine', 'whether engine is EXPOSED: not in SQL, read the dashboard API settings', null, null, null, null, null, null, null, null, null, null, null, null, null
order by 1, 2, 3;
