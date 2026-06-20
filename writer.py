#!/usr/bin/env python3
# Auth Step 1b: resolvers map Supabase auth id -> public.users.id via auth_user_id
# (legacy id fallback), then the role row. Parallel-safe: 0063 backfill means current
# tokens (sub = users.id) match auth_user_id directly, so the live login keeps working.
#   unzip -o auth-1b-resolvers-v1.zip && python3 writer.py
import os, sys, base64, json
ROOT = os.getcwd()
def die(m): print("ABORT: " + m); sys.exit(1)
if not os.path.isfile("package.json") or json.load(open("package.json")).get("name") != "dream-os-backend":
    die("run from the dream-os repo root.")
P = {'helper': 'Ly8gc3JjL2xpYi9yZXNvbHZlVXNlcnNJZC5qcwovLyBNYXAgYSBTdXBhYmFzZSBhdXRoIGlkZW50aXR5ICh0aGUgSldUIGBzdWJgLCBpLmUuIHJlcS5hdXRoLnVzZXJfaWQpIHRvIHRoZQovLyBwdWJsaWMudXNlcnMuaWQg4oCUIHRoZSBpZGVudGl0eSBzZWFtIGZvciBTdXBhYmFzZSBQaG9uZS1PVFAgbG9naW4uCi8vCi8vICAgUHJpbWFyeTogIHVzZXJzLmF1dGhfdXNlcl9pZCA9IDxzdXBhYmFzZSBhdXRoIGlkPiAgIChwaG9uZS1PVFAgKyBiYWNrZmlsbGVkIGxlZ2FjeSkKLy8gICBGYWxsYmFjazogdXNlcnMuaWQgICAgICAgICAgPSA8c3VwYWJhc2UgYXV0aCBpZD4gICAgIChwcmUtMDA2My1iYWNrZmlsbCBwaW5uZWQgaWQpCi8vCi8vIFRoZSBmYWxsYmFjayBpcyBiZWx0LWFuZC1zdXNwZW5kZXJzOiAwMDYzIGJhY2tmaWxsZWQgYXV0aF91c2VyX2lkID0gaWQgZm9yIGV2ZXJ5Ci8vIGV4aXN0aW5nIHVzZXIsIHNvIHRoZSBwcmltYXJ5IGFscmVhZHkgY292ZXJzIGxlZ2FjeSBhY2NvdW50cy4gUmV0dXJucyBudWxsIGlmIHRoZQovLyBpZGVudGl0eSBtYXBzIHRvIG5vIHVzZXIgKGNhbGxlciBkZWNpZGVzIHRoZSA0MDEvNDAzKS4KJ3VzZSBzdHJpY3QnOwoKYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZVVzZXJzSWQoc3VwYWJhc2UsIGF1dGhVc2VySWQpIHsKICBpZiAoIWF1dGhVc2VySWQpIHJldHVybiBudWxsOwogIGNvbnN0IHsgZGF0YSB9ID0gYXdhaXQgc3VwYWJhc2UKICAgIC5mcm9tKCd1c2VycycpLnNlbGVjdCgnaWQnKS5lcSgnYXV0aF91c2VyX2lkJywgYXV0aFVzZXJJZCkubWF5YmVTaW5nbGUoKTsKICBpZiAoZGF0YSkgcmV0dXJuIGRhdGEuaWQ7CiAgY29uc3QgeyBkYXRhOiBsZWdhY3kgfSA9IGF3YWl0IHN1cGFiYXNlCiAgICAuZnJvbSgndXNlcnMnKS5zZWxlY3QoJ2lkJykuZXEoJ2lkJywgYXV0aFVzZXJJZCkubWF5YmVTaW5nbGUoKTsKICByZXR1cm4gbGVnYWN5ID8gbGVnYWN5LmlkIDogbnVsbDsKfQoKbW9kdWxlLmV4cG9ydHMgPSB7IHJlc29sdmVVc2Vyc0lkIH07Cg==', 'rv_old': 'ICAgIC8vIFN0ZXAgMSDigJQgcmVzb2x2ZSB2ZW5kb3IgYnkgSldUIHVzZXJfaWQuCiAgICBjb25zdCB7IGRhdGE6IHZlbmRvciwgZXJyb3I6IHZlbmRvckVyciB9ID0gYXdhaXQgc3VwYWJhc2UKICAgICAgLmZyb20oJ3ZlbmRvcnMnKQogICAgICAuc2VsZWN0KCcqJykKICAgICAgLmVxKCd1c2VyX2lkJywgdXNlcklkKQogICAgICAubWF5YmVTaW5nbGUoKTsK', 'rv_new': 'ICAgIC8vIFN0ZXAgMSDigJQgbWFwIHRoZSBTdXBhYmFzZSBhdXRoIGlkZW50aXR5IHRvIHB1YmxpYy51c2Vycy5pZCwgdGhlbiByZXNvbHZlIHRoZSB2ZW5kb3IuCiAgICBjb25zdCB1c2Vyc0lkID0gYXdhaXQgcmVzb2x2ZVVzZXJzSWQoc3VwYWJhc2UsIHVzZXJJZCk7CiAgICBjb25zdCB7IGRhdGE6IHZlbmRvciwgZXJyb3I6IHZlbmRvckVyciB9ID0gdXNlcnNJZAogICAgICA/IGF3YWl0IHN1cGFiYXNlLmZyb20oJ3ZlbmRvcnMnKS5zZWxlY3QoJyonKS5lcSgndXNlcl9pZCcsIHVzZXJzSWQpLm1heWJlU2luZ2xlKCkKICAgICAgOiB7IGRhdGE6IG51bGwsIGVycm9yOiBudWxsIH07Cg==', 'rc_old': 'ICBjb25zdCB7IGRhdGE6IGNvdXBsZSB9ID0gYXdhaXQgc3VwYWJhc2UKICAgIC5mcm9tKCdjb3VwbGVzJykKICAgIC5zZWxlY3QoJ2lkJykKICAgIC5lcSgndXNlcl9pZCcsIHVzZXIuaWQpCiAgICAubWF5YmVTaW5nbGUoKTsKCiAgaWYgKCFjb3VwbGUpIHsKICAgIHJldHVybiByZXMuc3RhdHVzKDQwMykuanNvbih7IG9rOiBmYWxzZSwgZXJyb3I6ICdObyBjb3VwbGUgcHJvZmlsZSBmb3VuZC4nIH0pOwogIH0KCiAgcmVxLmNvdXBsZVVzZXIgPSB7IGlkOiB1c2VyLmlkLCB1c2VyX2lkOiB1c2VyLmlkLCBjb3VwbGVfaWQ6IGNvdXBsZS5pZCB9Owo=', 'rc_new': 'ICBjb25zdCB1c2Vyc0lkID0gYXdhaXQgcmVzb2x2ZVVzZXJzSWQoc3VwYWJhc2UsIHVzZXIuaWQpOwogIGNvbnN0IHsgZGF0YTogY291cGxlIH0gPSB1c2Vyc0lkCiAgICA/IGF3YWl0IHN1cGFiYXNlLmZyb20oJ2NvdXBsZXMnKS5zZWxlY3QoJ2lkJykuZXEoJ3VzZXJfaWQnLCB1c2Vyc0lkKS5tYXliZVNpbmdsZSgpCiAgICA6IHsgZGF0YTogbnVsbCB9OwoKICBpZiAoIWNvdXBsZSkgewogICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgb2s6IGZhbHNlLCBlcnJvcjogJ05vIGNvdXBsZSBwcm9maWxlIGZvdW5kLicgfSk7CiAgfQoKICByZXEuY291cGxlVXNlciA9IHsgaWQ6IHVzZXJzSWQsIHVzZXJfaWQ6IHVzZXJzSWQsIGNvdXBsZV9pZDogY291cGxlLmlkIH07Cg=='}
def b64(k): return base64.b64decode(P[k]).decode()

# 1 — helper
LIB = os.path.join(ROOT, "src", "lib", "resolveUsersId.js")
if os.path.isfile(LIB) and "resolveUsersId" in open(LIB).read():
    print("= resolveUsersId.js already present (idempotent).")
else:
    open(LIB, "w", encoding="utf-8").write(b64("helper")); print("+ src/lib/resolveUsersId.js")

def patch(rel, requireLine, old_key, new_key, name):
    F = os.path.join(ROOT, *rel)
    t = open(F, encoding="utf-8").read()
    if "resolveUsersId" in t:
        print(f"= {name} already on resolveUsersId (idempotent)."); return
    old = b64(old_key); new = b64(new_key)
    if old not in t: die(f"{name}: target block not found verbatim.")
    # add require at top (after 'use strict';)
    if "require('../../lib/resolveUsersId')" not in t:
        anchor = "'use strict';"
        if anchor not in t: die(f"{name}: 'use strict' anchor not found.")
        t = t.replace(anchor, anchor + "\nconst { resolveUsersId } = require('../../lib/resolveUsersId');", 1)
    t = t.replace(old, new, 1)
    open(F, "w", encoding="utf-8").write(t)
    print(f"+ {name}: resolves via auth_user_id (legacy fallback)")

patch(["src","api","middleware","resolveVendor.js"], True, "rv_old", "rv_new", "resolveVendor.js")
patch(["src","api","middleware","requireCoupleAuth.js"], True, "rc_old", "rc_new", "requireCoupleAuth.js")
print("\nDone. Restart (no engine change).")
