#!/usr/bin/env python3
# Vendor Suit -- Cleanup-1: delete two dead Myra-era vendor handlers.
#   src/api/vendor/binderRead.js  -- replaced by vendor-engine/ledger (Phase 4)
#   src/api/vendor/cabinet.js     -- replaced by vendor-engine/cabinet (Phase 4)
# Both required NOWHERE (verified: zero imports in src). They are the only two
# readers of public.binders; removing them frees that table for the drop.
# SAFETY: aborts if core.js still mounts the OLD files (it must mount only
# vendor-engine/*). Idempotent: skips files already gone.
#   unzip -o vendor-suit-cleanup1-dead-handlers-v1.zip && python3 writer.py
import os, sys, json
ROOT = os.getcwd()
def die(m): print("ABORT: " + m); sys.exit(1)
if not os.path.isfile("package.json") or json.load(open("package.json")).get("name") != "dream-os-backend":
    die("run from the dream-os repo root.")

core = os.path.join(ROOT, "src", "api", "vendor", "core.js")
if not os.path.isfile(core): die("core.js not found.")
core_txt = open(core, encoding="utf-8").read()
# Guard: the OLD files must NOT be mounted. Live mounts are vendor-engine/*.
import re
bad = []
if re.search(r"require\(\s*['\"]\./binderRead['\"]", core_txt): bad.append("binderRead")
if re.search(r"require\(\s*['\"]\./cabinet['\"]",    core_txt): bad.append("cabinet")
if bad:
    die("core.js still mounts OLD " + ",".join(bad) + " -- NOT dead. Aborting (no deletion).")

targets = [
    os.path.join(ROOT, "src", "api", "vendor", "binderRead.js"),
    os.path.join(ROOT, "src", "api", "vendor", "cabinet.js"),
]
deleted = []
for f in targets:
    if os.path.isfile(f):
        # final paranoia: only delete if it actually reads public.binders (the Myra signature)
        if "from('binders')" not in open(f, encoding="utf-8").read():
            print("= SKIP (no binders read, not the expected dead file): " + os.path.relpath(f, ROOT)); continue
        os.remove(f); deleted.append(os.path.relpath(f, ROOT)); print("- deleted " + os.path.relpath(f, ROOT))
    else:
        print("= already gone: " + os.path.relpath(f, ROOT))

if not deleted: print("\nNothing to delete (idempotent).")
else: print("\nDeleted " + str(len(deleted)) + " dead file(s). Restart; /cabinet + /binders unaffected (they mount vendor-engine/*).")
