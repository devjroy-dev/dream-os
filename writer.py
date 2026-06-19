#!/usr/bin/env python3
# Vendor Suit -- Phase 3-C FIX (v3): strip undefined-valued keys before calling the
# engine. The engine's money-edit/edit tools test `if (field in input)`, which is
# TRUE for a key whose value is undefined -> parseMoney(undefined) -> ERROR. By
# dropping undefined keys, the engine sees only the cells the caller actually sent.
# One guarded edit to runTool() in src/api/vendor-engine/binderWrite.js. Idempotent.
#   unzip -o vendor-suit-phase3c-moneyfix-v1.zip && python3 writer.py
import os, sys, json
ROOT = os.getcwd()
def die(m): print("ABORT: " + m); sys.exit(1)
if not os.path.isfile("package.json") or json.load(open("package.json")).get("name") != "dream-os-backend":
    die("run from the dream-os repo root.")
F = os.path.join(ROOT, "src", "api", "vendor-engine", "binderWrite.js")
if not os.path.isfile(F): die("binderWrite.js not found -- run Phase 3-C first.")
txt = open(F, encoding="utf-8").read()

MARK = "Drop undefined-valued keys"
if MARK in txt:
    print("= already fixed (idempotent)."); sys.exit(0)

ANCHOR = ("async function runTool(req, res, toolName, input) {\n"
          "  const eng     = req.app.locals.supabase.schema('engine');")
REPLACE = ("async function runTool(req, res, toolName, input) {\n"
           "  // Drop undefined-valued keys so the engine's `field in input` checks see only\n"
           "  // the cells the caller actually sent (money-edit/edit send a partial set).\n"
           "  const clean = {}; for (const k in input) if (input[k] !== undefined) clean[k] = input[k];\n"
           "  input = clean;\n"
           "  const eng     = req.app.locals.supabase.schema('engine');")
if ANCHOR not in txt:
    die("runTool anchor not found (binderWrite.js differs) -- inspect.")
txt = txt.replace(ANCHOR, REPLACE, 1)
open(F, "w", encoding="utf-8").write(txt)
print("+ fixed runTool: strips undefined keys before the engine call")
print("\\nRestart the server (dream-os-side JS, no rebuild).")
