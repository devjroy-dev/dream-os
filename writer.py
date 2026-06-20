#!/usr/bin/env python3
# Auth Step 1a: users.auth_user_id link column (+ backfill = id) + SCHEMA.md row.
# Pure schema; nothing reads it yet (resolvers change in 1b). Parallel-safe.
#   unzip -o auth-1a-users-auth-user-id-v1.zip && python3 writer.py
#   then apply db/migrations/0063_users_auth_user_id.sql in the Supabase SQL editor.
import os, sys, base64, json
ROOT = os.getcwd()
def die(m): print("ABORT: " + m); sys.exit(1)
if not os.path.isfile("package.json") or json.load(open("package.json")).get("name") != "dream-os-backend":
    die("run from the dream-os repo root.")
P = {'sql': 'LS0gMDA2M191c2Vyc19hdXRoX3VzZXJfaWQuc3FsCi0tIEF1dGggbWlncmF0aW9uIFN0ZXAgMWEgKHNlZSBBVVRIX1NVUEFCQVNFX1BIT05FX01JR1JBVElPTi5tZCkuCi0tCi0tIFRoZSBsaW5rIGNvbHVtbiBmb3IgU3VwYWJhc2UgUGhvbmUtT1RQIGxvZ2luLiBVbnRpbCBub3cgZHJlYW0tb3MgcGlubmVkIHRoZQotLSBTdXBhYmFzZSBhdXRoIHVzZXIgaWQgRVFVQUwgdG8gcHVibGljLnVzZXJzLmlkIChtaW50U2Vzc2lvbidzIGNyZWF0ZVVzZXIoe2lkfSkpLAotLSBzbyByZXNvbHZlVmVuZG9yL3JlcXVpcmVDb3VwbGVBdXRoIGNvdWxkIG1hdGNoIHZlbmRvcnMudXNlcl9pZCA9IEpXVCBzdWIgZGlyZWN0bHkuCi0tIFN1cGFiYXNlIHNpZ25JbldpdGhPdHAgZ2VuZXJhdGVzIGl0cyBPV04gYXV0aCBpZCAoY2Fubm90IGJlIHBpbm5lZCksIHNvIGlkZW50aXR5Ci0tIG11c3QgcmVzb2x2ZSB0aHJvdWdoIGEgbGluayBjb2x1bW4gaW5zdGVhZDogdXNlcnMuYXV0aF91c2VyX2lkID0gPHN1cGFiYXNlIGF1dGggaWQ+LgotLSBNaXJyb3JzIGVuZ2luZS51c2Vycy5hdXRoX3VzZXJfaWQgKHRoZSBlbmdpbmUgYWxyZWFkeSByZXNvbHZlcyB0aGlzIHdheSkuCi0tCi0tIEJBQ0tGSUxMOiBldmVyeSBleGlzdGluZyB1c2VyIGhhZCBhdXRoLnVzZXJzLmlkID09PSB1c2Vycy5pZCAodGhlIG9sZCBwaW5uaW5nKSwKLS0gc28gc2VlZCBhdXRoX3VzZXJfaWQgPSBpZC4gVGhpcyBrZWVwcyBPTEQtZmxvdyBsb2dpbnMgKEpXVCBzdWIgPSB1c2Vycy5pZCkgcmVzb2x2aW5nCi0tIHRocm91Z2ggdGhlIFNBTUUgYXV0aF91c2VyX2lkIHBhdGggYXMgbmV3IHBob25lLU9UUCBsb2dpbnMg4oCUIG5vIHBhcmFsbGVsIGJyZWFrLgotLSAoQSByZXR1cm5pbmcgdXNlciB3aG8gbGF0ZXIgc2lnbnMgaW4gdmlhIHBob25lLU9UUCBnZXRzIGEgTkVXIHN1cGFiYXNlIGlkOyB0aGUKLS0gIHByb3Zpc2lvbiBlbmRwb2ludCdzIHBob25lLWZhbGxiYWNrIHJlLWJpbmRzIGF1dGhfdXNlcl9pZCB0byBpdCB0aGVuIOKAlCBTdGVwIDFjLikKLS0KLS0gSWRlbXBvdGVudDogc2FmZSB0byByZS1ydW4uCgphbHRlciB0YWJsZSB1c2VycyBhZGQgY29sdW1uIGlmIG5vdCBleGlzdHMgYXV0aF91c2VyX2lkIHV1aWQ7CgotLSBiYWNrZmlsbCBleGlzdGluZyByb3dzOiBhdXRoX3VzZXJfaWQgPSBpZCAob2xkIHBpbm5lZCBpZGVudGl0eSkKdXBkYXRlIHVzZXJzIHNldCBhdXRoX3VzZXJfaWQgPSBpZCB3aGVyZSBhdXRoX3VzZXJfaWQgaXMgbnVsbDsKCi0tIHVuaXF1ZSwgYnV0IGFsbG93IE5VTEwgKGEgYnJhbmQtbmV3IHJvdyBpcyBjcmVhdGVkIGJlZm9yZSBpdHMgYXV0aCBpZCBpcyBrbm93biBpbgotLSBzb21lIHBhdGhzKTsgYSBwYXJ0aWFsIHVuaXF1ZSBpbmRleCBlbmZvcmNlcyBvbmUgdXNlciBwZXIgc3VwYWJhc2UgYXV0aCBpZGVudGl0eS4KY3JlYXRlIHVuaXF1ZSBpbmRleCBpZiBub3QgZXhpc3RzIHVzZXJzX2F1dGhfdXNlcl9pZF9rZXkKICBvbiB1c2VycyAoYXV0aF91c2VyX2lkKSB3aGVyZSBhdXRoX3VzZXJfaWQgaXMgbm90IG51bGw7Cg==', 'row': 'fCBhdXRoX3VzZXJfaWQgfCB1dWlkIFVOSVFVRSB8IFN1cGFiYXNlIEF1dGggdXNlciBpZCAodGhlIEpXVCBgc3ViYCkuIFRoZSBpZGVudGl0eSBsaW5rIGZvciBwaG9uZS1PVFAgbG9naW46IHJlc29sdmVycyBtYXRjaCBgdXNlcnMuYXV0aF91c2VyX2lkID0gcmVxLmF1dGgudXNlcl9pZGAsIHRoZW4gdGhlIHJvbGUgcm93IGJ5IGB1c2Vycy5pZGAuIEJhY2tmaWxsZWQgPSBgaWRgIGZvciBsZWdhY3kgcGlubmVkIGFjY291bnRzICgwMDYzKTsgcmUtYm91bmQgYnkgdGhlIHByb3Zpc2lvbiBlbmRwb2ludCdzIHBob25lLWZhbGxiYWNrIHdoZW4gYSByZXR1cm5pbmcgdXNlciBmaXJzdCBzaWducyBpbiB2aWEgcGhvbmUtT1RQLiBNaXJyb3JzIGBlbmdpbmUudXNlcnMuYXV0aF91c2VyX2lkYC4gfAo='}

# 1 — drop the migration file
MIG = os.path.join(ROOT, "db", "migrations", "0063_users_auth_user_id.sql")
if os.path.isfile(MIG):
    print("= migration 0063 already present (idempotent).")
else:
    os.makedirs(os.path.dirname(MIG), exist_ok=True)
    open(MIG, "w", encoding="utf-8").write(base64.b64decode(P["sql"]).decode())
    print("+ db/migrations/0063_users_auth_user_id.sql")

# 2 — update docs/SCHEMA.md: insert the auth_user_id row into the ### users table
SCH = os.path.join(ROOT, "docs", "SCHEMA.md")
s = open(SCH, encoding="utf-8").read()
if "| auth_user_id | uuid UNIQUE |" in s:
    print("= SCHEMA.md already has auth_user_id row (idempotent).")
else:
    # insert right after the users.phone row (stable anchor inside the users table)
    anchor = "| phone | text UNIQUE NOT NULL | always E.164 e.g. +918757788550 |"
    if anchor not in s: die("SCHEMA.md users.phone anchor not found.")
    row = base64.b64decode(P["row"]).decode().strip()
    s = s.replace(anchor, anchor + "\n" + row, 1)
    open(SCH, "w", encoding="utf-8").write(s)
    print("+ docs/SCHEMA.md: users.auth_user_id row added")

print("\nDone. Apply 0063 in the Supabase SQL editor, then verify with the gate SQL.")
