#!/usr/bin/env python3
# Vendor Suit -- runtime fix: provide a global WebSocket on Node < 22.
# supabase-js's createClient builds a realtime client that needs a global
# WebSocket; Node 20 (Railway) has none, so the engine's db.js throws at boot.
# 'ws' is already a dependency and already imported in src/index.js -- we just
# install it as globalThis.WebSocket as the FIRST line, before any require()
# pulls in db.js. The engine never uses realtime; this only satisfies the
# constructor. One guarded, idempotent prepend to src/index.js.
#   unzip -o vendor-suit-wsfix-v1.zip && python3 writer.py
import os, sys, json
ROOT = os.getcwd()
def die(m): print("ABORT: " + m); sys.exit(1)
if not os.path.isfile("package.json") or json.load(open("package.json")).get("name") != "dream-os-backend":
    die("run from the dream-os repo root.")
if "ws" not in (json.load(open("package.json")).get("dependencies") or {}):
    die("'ws' is not a dependency -- unexpected; tell Claude before proceeding.")
F = os.path.join(ROOT, "src", "index.js")
if not os.path.isfile(F): die("src/index.js not found.")
txt = open(F, encoding="utf-8").read()

MARK = "global WebSocket on Node"
if MARK in txt:
    print("= already shimmed (idempotent)."); sys.exit(0)

SHIM = (
    "// Provide a global WebSocket on Node < 22 (Railway runs 20). supabase-js's\n"
    "// createClient builds a realtime client that requires one; without it the\n"
    "// engine's db.js throws at boot. 'ws' is already a dependency. The engine\n"
    "// never uses realtime -- this only satisfies the constructor.\n"
    "if (!globalThis.WebSocket) globalThis.WebSocket = require('ws');\n\n"
)
open(F, "w", encoding="utf-8").write(SHIM + txt)
print("+ prepended ws WebSocket shim to src/index.js (first line)")
print("\\nNo rebuild needed for this file (dream-os JS). Restart / redeploy.")
print("On Railway: just push -- the shim lets it boot on Node 20.")
