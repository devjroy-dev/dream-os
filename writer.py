#!/usr/bin/env python3
# Hotfix — chat.js imported runMyraTurn aliased to runPWAAgenticTurn, but the
# 1c-stream-A SSE path calls the bare name runMyraTurn → "runMyraTurn is not
# defined". Fix: import BOTH names — runMyraTurn (for the SSE path) AND the
# runPWAAgenticTurn alias (for the unchanged JSON path). One line.
#
# Anchor-guarded + idempotent.

import os, sys
ROOT = os.getcwd()
TARGET = os.path.join(ROOT, "src", "api", "vendor", "chat.js")

OLD = "const { runMyraTurn: runPWAAgenticTurn } = require('../../agent/myraLoop');  // Piece 1b: dual-soul engine (alias keeps both call sites unchanged)"
NEW = "const { runMyraTurn } = require('../../agent/myraLoop');\nconst runPWAAgenticTurn = runMyraTurn;  // alias kept so the JSON path call site is unchanged"

def main():
    if not os.path.isfile(TARGET):
        print("ERROR: chat.js not found — run from dream-os repo root."); sys.exit(1)
    s = open(TARGET, encoding="utf-8").read()
    if "const { runMyraTurn } = require('../../agent/myraLoop');" in s:
        print("SKIP: runMyraTurn already imported under its own name."); return
    if OLD not in s:
        print("SKIP: import anchor not found. Fix by hand — import runMyraTurn under its own name:")
        print("      const { runMyraTurn } = require('../../agent/myraLoop');")
        print("      const runPWAAgenticTurn = runMyraTurn;")
        return
    open(TARGET, "w", encoding="utf-8").write(s.replace(OLD, NEW, 1))
    print("OK: runMyraTurn now imported under its own name (alias kept for the JSON path).")

if __name__ == "__main__":
    main()
