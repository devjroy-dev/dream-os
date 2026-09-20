-- F-44.74 · PRE-CURE GRANT AND STATE SNAPSHOT, schema public. READ-ONLY. ONE statement. r2.
--
-- r2, and WHY, because it is a correction to the chair rather than a tidy-up. The chair's
-- ruling orders an ownership gate: the generator refuses unless every one of the 102 tables is
-- owned by current_user OR BY A ROLE CURRENT_USER IS A MEMBER OF, and it says the snapshot
-- already carries what that needs. It carries the owners and it carries current_user, but it
-- does NOT carry the membership, and membership cannot be derived from a name. Postgres decides
-- ownership by has_privs_of_role, which is pg_has_role(current_user, owner, 'USAGE'), and only
-- the database can answer that. Section G below answers it, once per distinct owner and once per
-- defining role, so the gate is exact and so the skips that 0170 r2's loop will report are
-- PREDICTED BEFORE THE CURE RUNS rather than discovered in his editor. Without section G the
-- gate could only compare two strings and would refuse a perfectly ownable estate.
-- CE-44 · SEC-1 · the chair's ruling of 20 September: the rollback for 0170 is generated from
-- THIS export, not from the F-44.55 census. The census sees four privileges per role and the
-- estate holds seven; a census-generated rollback restores the READING and not the STATE
-- (F-44.74). This reads the ACLs themselves, so the SOURCE of every privilege is seen,
-- PUBLIC included, and not only has_*_privilege's verdict (F-44.75).
--
-- WHAT IT READS, all from the catalog, nothing from docs/db:
--   A acl      every privilege of every grantee on every relation in schema public, from
--              aclexplode(relacl): ordinary and partitioned tables, views, materialized views,
--              foreign tables and SEQUENCES. These are exactly the objects REVOKE ... ON ALL
--              TABLES and ON ALL SEQUENCES reach, so the rollback can restore each one.
--   B rls      every base table in public with its OWNER, its relrowsecurity and its
--              relforcerowsecurity, and whether its ACL is NULL (no explicit grant at all).
--   C routine  every function and procedure in public with its owner, its prokind, its
--              SECURITY DEFINER flag, whether its ACL is NULL, and every grantee of every
--              privilege on it. A NULL proacl is Postgres's built-in default, which is EXECUTE
--              to PUBLIC and all to the owner; the rollback restores that as an explicit grant,
--              which is the same effective state and is recorded as such.
--   D defacl   every row of pg_default_acl touching schema public, with its DEFINING ROLE, so
--              leg (d) of 0170 is written for each defining role and not for a guess.
--   E pub      the members of publication supabase_realtime that live in schema public
--              (F-44.77).
--   G editor   for every distinct owner of a relation or routine in public, and for every
--              defining role in pg_default_acl for public, whether THIS EDITOR may act for it.
--              This is the ownership gate's only honest source and it is also what says, before
--              the cure runs, which of 0170 r2's default-privilege roles will be SKIPPED.
--   F control  counts, the roles present, and WHO THIS EDITOR IS: current_user with its
--              rolsuper and rolbypassrls, because ALTER DEFAULT PRIVILEGES without FOR ROLE
--              binds objects created by the role that runs it.
--
-- CONTROLS, so an empty answer cannot pass and cannot look like a clean one: the three public
-- counts must equal the census's (102 / 101 / 101), engine's must equal 25 / 18 / 0, roles
-- present must be 2, and "acl grant rows, relations" must be above zero. The generator REFUSES
-- to emit a rollback if any of these is absent or disagrees with the census CSV of the same
-- sitting.
--
-- EXPORT IT THE SAME WAY THE CENSUS WAS EXPORTED, as CSV, whole.
with
roles as (
  select (select oid from pg_roles where rolname = 'anon') as anon_oid,
         (select oid from pg_roles where rolname = 'authenticated') as auth_oid),
rel as (
  select c.oid, c.relname::text as name, c.relkind, c.relacl, c.relrowsecurity, c.relforcerowsecurity,
         pg_get_userbyid(c.relowner) as owner
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r','p','v','m','f','S')),
base as (
  select r.*, ro.anon_oid, ro.auth_oid from rel r cross join roles ro where r.relkind in ('r','p')),
danger as (
  select b.name,
         (not b.relrowsecurity) and (
            coalesce(has_table_privilege(b.anon_oid, b.oid, 'SELECT') or has_table_privilege(b.anon_oid, b.oid, 'INSERT')
                  or has_table_privilege(b.anon_oid, b.oid, 'UPDATE') or has_table_privilege(b.anon_oid, b.oid, 'DELETE'), false)
         or coalesce(has_table_privilege(b.auth_oid, b.oid, 'SELECT') or has_table_privilege(b.auth_oid, b.oid, 'INSERT')
                  or has_table_privilege(b.auth_oid, b.oid, 'UPDATE') or has_table_privilege(b.auth_oid, b.oid, 'DELETE'), false)) as open_to_public_roles
  from base b),
eng as (
  select c.oid, c.relrowsecurity, ro.anon_oid, ro.auth_oid
  from pg_class c join pg_namespace n on n.oid = c.relnamespace cross join roles ro
  where n.nspname = 'engine' and c.relkind in ('r','p')),
eng_d as (
  select e.*, (not e.relrowsecurity) and (
            coalesce(has_table_privilege(e.anon_oid, e.oid, 'SELECT') or has_table_privilege(e.anon_oid, e.oid, 'INSERT')
                  or has_table_privilege(e.anon_oid, e.oid, 'UPDATE') or has_table_privilege(e.anon_oid, e.oid, 'DELETE'), false)
         or coalesce(has_table_privilege(e.auth_oid, e.oid, 'SELECT') or has_table_privilege(e.auth_oid, e.oid, 'INSERT')
                  or has_table_privilege(e.auth_oid, e.oid, 'UPDATE') or has_table_privilege(e.auth_oid, e.oid, 'DELETE'), false)) as open_to_public_roles
  from eng e),
pro as (
  select p.oid, p.proname::text as name,
         pg_get_function_identity_arguments(p.oid) as args,
         p.prokind::text as kind, p.prosecdef, p.proacl,
         pg_get_userbyid(p.proowner) as owner
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'),
acl_rel as (
  select r.name, r.relkind, r.owner, a.grantee, a.privilege_type, a.is_grantable
  from rel r, lateral aclexplode(r.relacl) a),
acl_pro as (
  select p.name, p.args, p.kind, p.owner, a.grantee, a.privilege_type, a.is_grantable
  from pro p, lateral aclexplode(p.proacl) a),
defacl as (
  select pg_get_userbyid(d.defaclrole) as defrole, d.defaclobjtype::text as objtype,
         a.grantee, a.privilege_type, a.is_grantable
  from pg_default_acl d join pg_namespace n on n.oid = d.defaclnamespace,
       lateral aclexplode(d.defaclacl) a
  where n.nspname = 'public')
select 'A acl' as section, relkind::text as obj_type, 'public' as obj_schema, name as obj_name,
       null::text as obj_ident, owner,
       case when grantee = 0 then 'PUBLIC' else pg_get_userbyid(grantee) end as grantee,
       privilege_type as privilege, is_grantable as grantable,
       null::boolean as rls_on, null::boolean as rls_forced, null::boolean as acl_is_null,
       null::bigint as n, null::text as note
from acl_rel
union all
select 'B rls', relkind::text, 'public', name, null, owner, null, null, null,
       relrowsecurity, relforcerowsecurity, (relacl is null), null, null
from rel where relkind in ('r','p')
union all
select 'C routine', 'routine ' || kind, 'public', name, args, owner,
       null, null, null, null, null, (proacl is null), null,
       case when prosecdef then 'SECURITY DEFINER' else 'SECURITY INVOKER' end
from pro
union all
select 'C routine acl', 'routine ' || kind, 'public', name, args, owner,
       case when grantee = 0 then 'PUBLIC' else pg_get_userbyid(grantee) end,
       privilege_type, is_grantable, null, null, null, null, null
from acl_pro
union all
select 'D defacl', objtype, 'public', null, null, null,
       case when grantee = 0 then 'PUBLIC' else pg_get_userbyid(grantee) end,
       privilege_type, is_grantable, null, null, null, null, defrole
from defacl
union all
select 'E pub', 'table', schemaname, tablename, null, null, null, null, null, null, null, null, null, pubname
from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public'
union all
select 'F control', null, 'public', 'public base tables', null, null, null, null, null, null, null, null,
       (select count(*) from base), null
union all
select 'F control', null, 'public', 'public: RLS off', null, null, null, null, null, null, null, null,
       (select count(*) from base where not relrowsecurity), null
union all
select 'F control', null, 'public', 'public: RLS off AND anon or authenticated holds a privilege', null, null, null, null, null, null, null, null,
       (select count(*) from danger where open_to_public_roles), null
union all
select 'F control', null, 'engine', 'engine base tables', null, null, null, null, null, null, null, null,
       (select count(*) from eng), null
union all
select 'F control', null, 'engine', 'engine: RLS off', null, null, null, null, null, null, null, null,
       (select count(*) from eng where not relrowsecurity), null
union all
select 'F control', null, 'engine', 'engine: RLS off AND anon or authenticated holds a privilege', null, null, null, null, null, null, null, null,
       (select count(*) from eng_d where open_to_public_roles), null
union all
select 'F control', null, null, 'roles present (anon, authenticated; expect 2)', null, null, null, null, null, null, null, null,
       (select count(*) from pg_roles where rolname in ('anon','authenticated'))::bigint, null
union all
select 'F control', null, 'public', 'acl grant rows, relations (must be above zero)', null, null, null, null, null, null, null, null,
       (select count(*) from acl_rel), null
union all
select 'F control', null, 'public', 'relations with NULL acl (no explicit grant)', null, null, null, null, null, null, null, null,
       (select count(*) from rel where relacl is null), null
union all
select 'F control', null, 'public', 'routines in public', null, null, null, null, null, null, null, null,
       (select count(*) from pro), null
union all
select 'F control', null, 'public', 'routines with NULL acl (Postgres default: EXECUTE to PUBLIC)', null, null, null, null, null, null, null, null,
       (select count(*) from pro where proacl is null), null
union all
select 'F control', null, 'public', 'procedures in public (ALL FUNCTIONS would miss these)', null, null, null, null, null, null, null, null,
       (select count(*) from pro where kind = 'p'), null
union all
select 'F control', null, 'public', 'SECURITY DEFINER routines in public', null, null, null, null, null, null, null, null,
       (select count(*) from pro where prosecdef), null
union all
select 'F control', null, 'public', 'pg_default_acl grant rows for schema public', null, null, null, null, null, null, null, null,
       (select count(*) from defacl), null
union all
select 'F control', null, 'public', 'distinct defining roles in pg_default_acl for public', null, null, null, null, null, null, null, null,
       (select count(distinct defrole) from defacl), null
union all
select 'F control', null, 'public', 'supabase_realtime members in public', null, null, null, null, null, null, null, null,
       (select count(*) from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public'), null
union all
select 'F control', null, null, 'distinct owners of relations in public', null, null, null, null, null, null, null, null,
       (select count(distinct owner) from rel), null
union all
select 'F control', null, null, 'THIS EDITOR: current_user', null, current_user::text, null, null, null, null, null, null, null,
       'rolsuper=' || (select rolsuper from pg_roles where rolname = current_user)::text ||
       ' rolbypassrls=' || (select rolbypassrls from pg_roles where rolname = current_user)::text
union all
select 'G editor', 'relation owner', 'public', owner, null, current_user::text, null, null, null, null, null, null, null,
       'this editor may act for it: ' || pg_has_role(current_user, owner, 'USAGE')::text
from (select distinct owner from rel) o
union all
select 'G editor', 'routine owner', 'public', owner, null, current_user::text, null, null, null, null, null, null, null,
       'this editor may act for it: ' || pg_has_role(current_user, owner, 'USAGE')::text
from (select distinct owner from pro) o
union all
select 'G editor', 'default-privilege defining role', 'public', defrole, null, current_user::text, null, null, null, null, null, null, null,
       'this editor may act for it: ' || pg_has_role(current_user, defrole, 'USAGE')::text
from (select distinct defrole from defacl) o
order by 1, 2, 4, 5, 7, 8;
