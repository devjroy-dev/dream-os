#!/usr/bin/env python3
"""
CE-44 · SEC-1 · ROLLBACK GENERATOR FOR 0170. r2.

  python3 gen_rollback_0170_r2.py <snapshot.csv> <census.csv> <out.sql>

r2 adds the chair's OWNERSHIP GATE (check 7) and, with it, the PREDICTED SKIPS the founder
should expect to see in his editor. It requires the r2 snapshot, because the gate cannot be
enforced from the r1 export: ownership in Postgres is decided by membership, not by matching two
role names, and only the database can answer whether this editor may act for a given owner. The
r2 snapshot's section G answers it once per owner and once per defining role.

WHAT IT IS FOR. 0170 closes schema public to anon and authenticated. Its rollback must restore
the STATE of the minute before it ran, not the reading of an instrument. The F-44.55 census sees
four privileges per role; the estate holds seven, and the census cannot see TRUNCATE, REFERENCES
or TRIGGER at all (F-44.74). So the rollback is generated from the founder's own pre-cure
snapshot (F-44.74_pre_cure_snapshot.sql), which reads the ACLs themselves and therefore sees the
SOURCE of every privilege, PUBLIC included (F-44.75). The census stays as the before-and-after
instrument and this program cross-checks the two against each other.

WHAT IT REFUSES TO DO. It emits nothing at all unless every check below passes. A generator that
produces a plausible rollback from a bad export is worse than no generator, because the rollback
is the thing reached for in the minute something has broken.

  1  Both files parse and carry the sections they must.
  2  The snapshot's seven controls equal the census's seven controls, value for value:
     public base tables, public RLS off, public danger count, engine base tables, engine RLS off,
     engine danger count, roles present. If the founder exported the two at different moments and
     the estate moved between them, they disagree and this stops.
  3  Roles present is exactly 2.
  4  ACL grant rows on relations is above zero. An export that returned no grants at all reads
     like a clean estate and is not one.
  5  The count of B rls rows equals the public base table count, and every census public table
     name appears in the snapshot. A truncated export stops here.
  7  THE OWNERSHIP GATE. ALTER TABLE ... ENABLE ROW LEVEL SECURITY requires ownership, and
     inside 0170's single transaction one table this editor cannot own cancels the whole
     migration. Every one of the public base tables must be owned by current_user or by a role
     current_user is a member of, which section G of the snapshot reports per owner. If any
     fails, this program stops and names the tables and their owners, and the cure does not get
     pasted. Routine owners are reported as a WARNING and not a refusal, because REVOKE ... ON
     ALL ROUTINES warns and carries on rather than failing.
  6  THE PUBLIC GATE. 0170 revokes relation privileges from anon and authenticated only; it
     revokes from PUBLIC on routines alone. If the snapshot shows PUBLIC holding any privilege on
     a relation in public, 0170 as written would leave that door open, because anon inherits
     whatever PUBLIC holds and the census would still read clean (F-44.75). This program stops,
     names the objects, and the cure goes back to the chair for a re-cut before it runs.

WHAT IT EMITS. One transaction that, for the grantees 0170 touched and no others, restores each
object's own recorded privileges, each table's own recorded relrowsecurity and
relforcerowsecurity, and each defining role's own recorded default privileges. Grantees the cure
never named are never named here either. A routine whose ACL was NULL is restored by an explicit
GRANT EXECUTE TO PUBLIC, which is the same effective state as Postgres's built-in default; that
is recorded in the file's header rather than passed off as identical bytes.
"""

import csv
import sys
import hashlib
from collections import defaultdict, OrderedDict

TOUCHED_RELATION = ["PUBLIC", "anon", "authenticated"]
TOUCHED_ROUTINE = ["PUBLIC", "anon", "authenticated", "service_role"]
KIND = {"r": "TABLE", "p": "TABLE", "v": "TABLE", "m": "TABLE", "f": "TABLE", "S": "SEQUENCE"}
DEFACL_OBJ = {"r": "TABLES", "S": "SEQUENCES", "f": "FUNCTIONS", "T": "TYPES", "n": "SCHEMAS"}
CONTROLS = [
    "public base tables",
    "public: RLS off",
    "public: RLS off AND anon or authenticated holds a privilege",
    "engine base tables",
    "engine: RLS off",
    "engine: RLS off AND anon or authenticated holds a privilege",
    "roles present (anon, authenticated; expect 2)",
]


def stop(msg):
    sys.stderr.write("\nREFUSED. No rollback was written.\n  " + msg + "\n\n")
    sys.exit(2)


def tf(v):
    v = (v or "").strip().lower()
    if v in ("t", "true"):
        return True
    if v in ("f", "false"):
        return False
    return None


def q(name):
    return '"' + str(name).replace('"', '""') + '"'


def grantee_sql(g):
    return "PUBLIC" if g == "PUBLIC" else q(g)


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def load(path):
    with open(path, newline="", encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh))


def main():
    if len(sys.argv) != 4:
        stop("usage: gen_rollback_0170_r2.py <snapshot.csv> <census.csv> <out.sql>")
    snap_path, cens_path, out_path = sys.argv[1:4]

    snap = load(snap_path)
    cens = load(cens_path)
    if not snap:
        stop("the snapshot CSV has no rows.")
    if not cens:
        stop("the census CSV has no rows.")

    # ---- check 1: sections present -------------------------------------------------
    sections = set(r.get("section", "") for r in snap)
    for need in ("A acl", "B rls", "C routine", "F control"):
        if need not in sections:
            stop('the snapshot has no "%s" section. It is not the F-44.74 export, or it is truncated.' % need)

    # ---- check 2 and 3: the seven controls, side by side ----------------------------
    sc = {r["obj_name"]: r["n"] for r in snap if r["section"] == "F control"}
    cc = {r["table_name"]: r["n"] for r in cens if r["section"] == "B control"}
    disagreements = []
    for name in CONTROLS:
        a, b = sc.get(name), cc.get(name)
        if a is None:
            stop('the snapshot is missing the control "%s".' % name)
        if b is None:
            stop('the census is missing the control "%s".' % name)
        if str(a).strip() != str(b).strip():
            disagreements.append((name, b, a))
    if disagreements:
        lines = ["the snapshot and the census disagree. They were taken at different moments,",
                 "or against different estates. The cure does not run on this pair.", ""]
        for name, b, a in disagreements:
            lines.append("    %-60s census %s   snapshot %s" % (name, b, a))
        stop("\n  ".join(lines))
    if str(sc["roles present (anon, authenticated; expect 2)"]).strip() != "2":
        stop("roles present is %s, not 2. The privilege columns do not mean what they say."
             % sc["roles present (anon, authenticated; expect 2)"])

    editor_rows = [r for r in snap if r["section"] == "F control"
                   and r["obj_name"] == "THIS EDITOR: current_user"]
    if not editor_rows:
        stop("the snapshot does not record current_user. It is not the F-44.74 export.")
    editor_name = editor_rows[0]["owner"]
    editor_line = editor_name + " (" + (editor_rows[0]["note"] or "") + ")"

    # ---- check 4: the export is not empty -------------------------------------------
    acl_rows = [r for r in snap if r["section"] == "A acl"]
    if len(acl_rows) == 0:
        stop("the snapshot captured zero ACL grant rows on relations. An export that returned no "
             "grants reads like a clean estate and is not one.")

    # ---- check 5: completeness against the census -----------------------------------
    rls_rows = [r for r in snap if r["section"] == "B rls"]
    want = int(str(sc["public base tables"]).strip())
    if len(rls_rows) != want:
        stop("the snapshot carries %d B rls rows for %s public base tables. It is truncated."
             % (len(rls_rows), want))
    snap_tables = set(r["obj_name"] for r in rls_rows)
    cens_tables = set(r["table_name"] for r in cens
                      if r["section"] == "A table" and r["schema_name"] == "public")
    missing = sorted(cens_tables - snap_tables)
    if missing:
        stop("these public tables are in the census and not in the snapshot: " + ", ".join(missing[:20]))

    # ---- check 6: THE PUBLIC GATE ---------------------------------------------------
    public_on_relations = sorted(set((r["obj_type"], r["obj_name"], r["privilege"])
                                     for r in acl_rows if r["grantee"] == "PUBLIC"))
    if public_on_relations:
        lines = ["the snapshot shows the PUBLIC pseudo-role holding privileges on relations in",
                 "schema public. 0170 revokes relation privileges from anon and authenticated only,",
                 "so anon would keep these through PUBLIC and the census would still read clean",
                 "(F-44.75). The cure goes back to the chair for a re-cut before it runs.", ""]
        for k, n, p in public_on_relations[:30]:
            lines.append("    %s %s: %s" % (KIND.get(k, k), n, p))
        stop("\n  ".join(lines))

    # ---- check 7: THE OWNERSHIP GATE, and the predicted skips ------------------------
    g_rows = [r for r in snap if r["section"] == "G editor"]
    if not g_rows:
        stop("this snapshot has no \"G editor\" section, so it is the r1 export. The ownership gate\n"
             "  the chair ruled cannot be enforced from it: ownership in Postgres is decided by role\n"
             "  MEMBERSHIP, which two matching names do not prove and which only the database can\n"
             "  answer. Re-export with F-44.74_pre_cure_snapshot_r2.sql and run this again.")

    def can_act(role):
        for r in g_rows:
            if r["obj_name"] == role and (r["note"] or "").strip().endswith("true"):
                return True
        return False

    owners_known = set(r["obj_name"] for r in g_rows)
    table_owner = {r["obj_name"]: r["owner"] for r in snap if r["section"] == "B rls"}
    unowned = sorted((t, o) for t, o in table_owner.items()
                     if o not in owners_known or not can_act(o))
    if unowned:
        lines = ["these public tables are owned by a role this editor may not act for, so",
                 "ALTER TABLE ... ENABLE ROW LEVEL SECURITY would raise insufficient_privilege and,",
                 "inside 0170's single transaction, cancel the whole migration. Nothing would be",
                 "applied, but the sitting would be spent. Do not paste 0170.", ""]
        for t, o in unowned[:30]:
            lines.append("    public.%-40s owned by %s" % (t, o))
        lines.append("")
        lines.append("  The editor is %s. Either the ownership is fixed first, or 0170 is re-cut to leave")
        lines.append("  these tables to a second statement run by a role that owns them. Chair's call.")
        stop("\n  ".join(lines) % editor_name)

    routine_owner_warnings = sorted(set(
        r["owner"] for r in snap if r["section"] == "C routine" and not can_act(r["owner"])))

    predicted_skips = sorted(r["obj_name"] for r in g_rows
                             if r["obj_type"] == "default-privilege defining role" and not can_act(r["obj_name"]))
    predicted_handled = sorted(r["obj_name"] for r in g_rows
                               if r["obj_type"] == "default-privilege defining role" and can_act(r["obj_name"]))

    # ---- gather ---------------------------------------------------------------------
    rel_kind = {}
    rel_grants = defaultdict(list)          # name -> [(grantee, privilege)]
    for r in acl_rows:
        rel_kind[r["obj_name"]] = r["obj_type"]
        if r["grantee"] in TOUCHED_RELATION:
            rel_grants[r["obj_name"]].append((r["grantee"], r["privilege"]))

    rls = OrderedDict()
    for r in sorted(rls_rows, key=lambda x: x["obj_name"]):
        rls[r["obj_name"]] = (tf(r["rls_on"]), tf(r["rls_forced"]))
        rel_kind.setdefault(r["obj_name"], r["obj_type"])

    routines = OrderedDict()
    for r in snap:
        if r["section"] == "C routine":
            key = (r["obj_name"], r["obj_ident"] or "")
            routines[key] = {"acl_null": tf(r["acl_is_null"]), "grants": []}
    for r in snap:
        if r["section"] == "C routine acl" and r["grantee"] in TOUCHED_ROUTINE:
            key = (r["obj_name"], r["obj_ident"] or "")
            if key in routines:
                routines[key]["grants"].append((r["grantee"], r["privilege"]))

    defacl = defaultdict(list)              # (defrole, objtype) -> [(grantee, privilege)]
    for r in snap:
        if r["section"] == "D defacl":
            defacl[(r["note"], r["obj_type"])].append((r["grantee"], r["privilege"]))
    defacl_roles = sorted(set(k[0] for k in defacl))

    # ---- emit -----------------------------------------------------------------------
    o = []
    w = o.append
    w("-- ROLLBACK OF db/migrations/0170_public_schema_lockdown.sql")
    w("-- GENERATED, not written by hand. Source of every line below:")
    w("--   snapshot  %s" % snap_path.split("/")[-1])
    w("--             sha256 %s" % sha(snap_path))
    w("--   census    %s" % cens_path.split("/")[-1])
    w("--             sha256 %s" % sha(cens_path))
    w("--   generator gen_rollback_0170_r2.py, CE-44 SEC-1")
    w("--")
    w("-- The two exports agreed on all seven controls before a line of this was written:")
    for name in CONTROLS:
        w("--   %-60s %s" % (name, str(sc[name]).strip()))
    w("--   the editor that took the snapshot: %s" % editor_line)
    w("--")
    w("-- THE OWNERSHIP GATE PASSED: every one of the %d public base tables is owned by a role this"
      % len(table_owner))
    w("-- editor may act for, so 0170 cannot be cancelled by an ownership refusal.")
    if routine_owner_warnings:
        w("-- ROUTINE OWNERS THIS EDITOR MAY NOT ACT FOR: %s. 0170's routine line will emit"
          % ", ".join(routine_owner_warnings))
        w("-- WARNING: no privileges could be revoked for those routines and will CARRY ON. Their")
        w("-- grants are unchanged; note the names and bring them to the chair.")
    else:
        w("-- Every routine in public is owned by a role this editor may act for, so 0170's routine")
        w("-- line will emit no \"no privileges could be revoked\" warning.")
    w("--")
    w("-- WHAT 0170 WILL REPORT WHEN IT RUNS, predicted from this snapshot, not from hope:")
    w("--   default privileges HANDLED for: %s" % (", ".join(predicted_handled) or "none"))
    w("--   default privileges SKIPPED for: %s" % (", ".join(predicted_skips) or "none"))
    if predicted_skips:
        w("--   A SKIP IS NOT A FAILURE, and it is not nothing either: a table created IN FUTURE BY")
        w("--   a skipped role would still arrive granted to anon and authenticated. Proven on the")
        w("--   plant. What closes that: the dashboard switch going off, and section 6's law that")
        w("--   every future migration enables RLS on the table it creates, in the same")
        w("--   transaction. This estate's ladder is run by the editor's own role.")
    w("--")
    w("-- WHAT IT RESTORES: for the grantees 0170 touched and no others, each object's own")
    w("-- recorded privileges; each table's own recorded relrowsecurity and relforcerowsecurity;")
    w("-- each defining role's own recorded default privileges. Grantees the cure never named are")
    w("-- never named here. A routine whose ACL was NULL before the cure is restored by an")
    w("-- explicit GRANT EXECUTE TO PUBLIC: the same effective state as Postgres's built-in")
    w("-- default, not the same catalog bytes, and said plainly rather than passed off.")
    w("--")
    w("-- WHAT IT DOES NOT TOUCH: schema engine, schema auth, schema storage, schema")
    w("-- graphql_public, USAGE on schema public, publication supabase_realtime, and any row of")
    w("-- data. It is privileges and RLS flags only.")
    w("--")
    w("-- COUNTS THE FOUNDER CAN READ BEFORE HE RUNS IT:")
    w("--   tables whose RLS flag is restored        %d" % len(rls))
    w("--     of those, back to RLS OFF              %d" % sum(1 for v in rls.values() if v[0] is False))
    w("--     of those, left RLS ON                  %d" % sum(1 for v in rls.values() if v[0] is True))
    w("--   relations whose grants are restored      %d" % len(rel_kind))
    w("--   grant rows restored on relations         %d" % sum(len(v) for v in rel_grants.values()))
    w("--   routines whose grants are restored       %d" % len(routines))
    w("--   defining roles for default privileges    %d (%s)"
      % (len(defacl_roles), ", ".join(defacl_roles) if defacl_roles else "none"))
    w("--")
    w("-- AFTER RUNNING IT: re-run the F-44.55 census. Its seven controls must read")
    w("--   %s / %s / %s / %s / %s / %s / %s"
      % tuple(str(sc[n]).strip() for n in CONTROLS))
    w("-- which is what they read before the cure. If they do not, stop and paste what you saw.")
    w("")
    w("BEGIN;")
    w("")
    w("-- ── 1 · ROW LEVEL SECURITY, each table's own flag, from its own snapshot row ──")
    for name, (on, forced) in rls.items():
        w("ALTER TABLE public.%s %s ROW LEVEL SECURITY;" % (q(name), "ENABLE" if on else "DISABLE"))
        if forced is not None:
            w("ALTER TABLE public.%s %s ROW LEVEL SECURITY;" % (q(name), "FORCE" if forced else "NO FORCE"))
    w("")
    w("-- ── 2 · RELATION PRIVILEGES: clear what the cure left, restore what was recorded ──")
    for name in sorted(rel_kind):
        kw = KIND.get(rel_kind[name], "TABLE")
        w("REVOKE ALL ON %s public.%s FROM %s;"
          % (kw, q(name), ", ".join(grantee_sql(g) for g in TOUCHED_RELATION)))
        by_grantee = defaultdict(list)
        for g, p in rel_grants.get(name, []):
            by_grantee[g].append(p)
        for g in sorted(by_grantee):
            w("GRANT %s ON %s public.%s TO %s;"
              % (", ".join(sorted(set(by_grantee[g]))), kw, q(name), grantee_sql(g)))
    w("")
    w("-- ── 3 · ROUTINE PRIVILEGES, including the GRANT EXECUTE TO service_role the cure added ──")
    for (name, args) in sorted(routines):
        info = routines[(name, args)]
        sig = "public.%s(%s)" % (q(name), args)
        w("REVOKE ALL ON ROUTINE %s FROM %s;"
          % (sig, ", ".join(grantee_sql(g) for g in TOUCHED_ROUTINE)))
        if info["acl_null"]:
            w("GRANT EXECUTE ON ROUTINE %s TO PUBLIC;   -- ACL was NULL: Postgres's built-in default" % sig)
        else:
            by_grantee = defaultdict(list)
            for g, p in info["grants"]:
                by_grantee[g].append(p)
            for g in sorted(by_grantee):
                w("GRANT %s ON ROUTINE %s TO %s;"
                  % (", ".join(sorted(set(by_grantee[g]))), sig, grantee_sql(g)))
    w("")
    w("-- ── 4 · DEFAULT PRIVILEGES, written FOR each defining role the snapshot names ──")
    if not defacl_roles:
        w("-- the snapshot recorded no pg_default_acl row for schema public, so there is nothing")
        w("-- here to restore. 0170's leg (d) loop will have done nothing either.")
    for role in predicted_skips:
        w("-- %s is NOT restored here, and must not be: 0170 skipped it, so its default" % role)
        w("-- privileges were never changed and there is nothing to put back. Writing ALTER DEFAULT")
        w("-- PRIVILEGES FOR ROLE %s here would raise insufficient_privilege and cancel the whole" % role)
        w("-- rollback in the one minute it is needed.")
    for role in defacl_roles:
        if role in predicted_skips:
            continue
        for objtype in ("r", "S", "f", "T", "n"):
            key = (role, objtype)
            if key not in defacl:
                continue
            obj = DEFACL_OBJ[objtype]
            revoke_from = TOUCHED_ROUTINE if objtype == "f" else TOUCHED_RELATION
            w("ALTER DEFAULT PRIVILEGES FOR ROLE %s IN SCHEMA public REVOKE ALL ON %s FROM %s;"
              % (q(role), obj, ", ".join(grantee_sql(g) for g in revoke_from)))
            by_grantee = defaultdict(list)
            for g, p in defacl[key]:
                if g in revoke_from:
                    by_grantee[g].append(p)
            for g in sorted(by_grantee):
                w("ALTER DEFAULT PRIVILEGES FOR ROLE %s IN SCHEMA public GRANT %s ON %s TO %s;"
                  % (q(role), ", ".join(sorted(set(by_grantee[g]))), obj, grantee_sql(g)))
    w("")
    w("COMMIT;")

    with open(out_path, "w") as fh:
        fh.write("\n".join(o) + "\n")

    sys.stderr.write(
        "\nROLLBACK WRITTEN: %s\n"
        "  controls agreed, all seven.\n"
        "  tables restored            %d (RLS off %d, RLS on %d)\n"
        "  relations restored         %d, carrying %d grant rows\n"
        "  routines restored          %d\n"
        "  defining roles             %d (%s)\n"
        "  ownership gate             PASSED, all %d public tables ownable by %s\n"
        "  0170 will report handled   %s\n"
        "  0170 will report skipped   %s\n"
        "  routine-owner warnings     %s\n"
        "  sha256                     %s\n\n"
        % (out_path, len(rls),
           sum(1 for v in rls.values() if v[0] is False),
           sum(1 for v in rls.values() if v[0] is True),
           len(rel_kind), sum(len(v) for v in rel_grants.values()),
           len(routines), len(defacl_roles), ", ".join(defacl_roles) if defacl_roles else "none",
           len(table_owner), editor_name,
           ", ".join(predicted_handled) or "none",
           ", ".join(predicted_skips) or "none",
           ", ".join(routine_owner_warnings) or "none",
           sha(out_path)))


if __name__ == "__main__":
    main()
