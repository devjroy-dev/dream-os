#!/usr/bin/env python3
# Vendor Suit -- Phase 6-A: delete the dead Kriya/Myra cluster.
# Removes 9 dead agent files + 2 Phase-4-orphaned vendor handlers (vendor/chat.js,
# vendor/binderWrite.js), and trims the unused runAgenticTurn import from index.js
# (runCoupleAgenticTurn — the live couple agent — is kept). NO table drops, NO
# touch to live routes. Guarded by a PATH-RESOLVING boot-crash check + idempotent.
#   unzip -o vendor-suit-phase6a-del-kriya-v1.zip && python3 writer.py
import os, sys, json
ROOT = os.getcwd()
def die(m): print("ABORT: " + m); sys.exit(1)
if not os.path.isfile("package.json") or json.load(open("package.json")).get("name") != "dream-os-backend":
    die("run from the dream-os repo root.")

CLUSTER = [
    "src/agent/myraLoop.js", "src/agent/myraSoul.js", "src/agent/managerLoop.js",
    "src/agent/kriyaTurn.js", "src/agent/kriyaSoul.js", "src/agent/kriyaPrimitives.js",
    "src/agent/kriyaRead.js", "src/agent/kriyaCalendar.js", "src/agent/displayFirewall.js",
    "src/api/vendor/chat.js", "src/api/vendor/binderWrite.js",
]
cluster_abs = set(os.path.normpath(os.path.join(ROOT, p)) for p in CLUSTER)

# --- SAFETY GUARD (path-resolving): for every NON-cluster .js, resolve each
#     relative require() to an actual file path; flag only if it lands on a
#     cluster member. This is the boot-crash guard, done correctly (a bare
#     filename like './chat' in another dir resolves to THAT dir, not ours). ---
import re
REQ = re.compile(r"require\(\s*['\"](\.[^'\"]+)['\"]\s*\)")
def resolve(req_str, from_file):
    base = os.path.dirname(from_file)
    cand = os.path.normpath(os.path.join(base, req_str))
    for p in (cand, cand + ".js", os.path.join(cand, "index.js")):
        if os.path.isfile(p): return os.path.normpath(p)
    return os.path.normpath(cand + ".js")  # best-effort for a deleted target

offenders = []
for dirpath,_,files in os.walk(os.path.join(ROOT, "src")):
    for fn in files:
        if not fn.endswith(".js"): continue
        fp = os.path.normpath(os.path.join(dirpath, fn))
        if fp in cluster_abs: continue              # cluster members may reference each other
        txt = open(fp, encoding="utf-8", errors="ignore").read()
        for m in REQ.finditer(txt):
            if resolve(m.group(1), fp) in cluster_abs:
                offenders.append((os.path.relpath(fp, ROOT), m.group(1)))
if offenders:
    print("ABORT: live files still require cluster members — deleting would crash boot:")
    for f, req in sorted(set(offenders)): print("   %s  ->  require('%s')" % (f, req))
    sys.exit(1)
print("  guard ✓ no live file resolves a require() onto any cluster member")

# --- delete the cluster (idempotent) ---
deleted, already = [], []
for rel in CLUSTER:
    p = os.path.join(ROOT, rel)
    if os.path.isfile(p): os.remove(p); deleted.append(rel)
    else: already.append(rel)
for rel in deleted: print("+ deleted: " + rel)
for rel in already: print("= already gone: " + rel)

# --- trim runAgenticTurn from index.js (keep runCoupleAgenticTurn) ---
IDX = os.path.join(ROOT, "src", "index.js"); txt = open(IDX, encoding="utf-8").read()
OLD = "const { runAgenticTurn, runCoupleAgenticTurn } = require('./agent/engine');"
NEW = "const { runCoupleAgenticTurn } = require('./agent/engine');"
if OLD in txt:
    open(IDX,"w",encoding="utf-8").write(txt.replace(OLD, NEW, 1))
    print("+ index.js: trimmed unused runAgenticTurn import (couple agent kept)")
elif NEW in txt:
    print("= index.js import already trimmed (idempotent).")
else:
    print("! index.js import line not in expected form — left untouched; inspect.")

print("\\nPhase 6-A done. Restart; couple agent + all live routes untouched.")
