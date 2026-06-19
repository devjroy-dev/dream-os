#!/usr/bin/env python3
# Vendor Suit -- Phase 4: THE FLIP. Re-point the five proven vendor routes from
# Myra to the engine doors, inside src/api/vendor/core.js. The pwa now talks to
# Victor and Donna. Surgical: ONLY cabinet / today / binders(write+read) / chat
# are re-pointed; every other route (me, events, portfolio, contracts, tds, ...)
# stays exactly as-is. Myra's files stay on disk, merely unmounted -- so this is a
# switch, not a leap: reverting is just flipping these requires back. /vendor-e is
# left mounted as a live fallback. Guarded + idempotent.
#   unzip -o vendor-suit-phase4-flip-v1.zip && python3 writer.py
import os, sys, json
ROOT = os.getcwd()
def die(m): print("ABORT: " + m); sys.exit(1)
if not os.path.isfile("package.json") or json.load(open("package.json")).get("name") != "dream-os-backend":
    die("run from the dream-os repo root.")
F = os.path.join(ROOT, "src", "api", "vendor", "core.js")
if not os.path.isfile(F): die("src/api/vendor/core.js not found.")
# the engine doors must exist (Phase 3 applied)
VE = os.path.join(ROOT, "src", "api", "vendor-engine")
for need in ["cabinet.js","ledger.js","today.js","binderWrite.js","chat.js"]:
    if not os.path.isfile(os.path.join(VE, need)):
        die("engine door missing: vendor-engine/%s -- run Phase 3 first." % need)

txt = open(F, encoding="utf-8").read()
if "Phase 4 flip" in txt:
    print("= already flipped (idempotent)."); sys.exit(0)

# Exact-line re-points. Myra require -> engine door require, with a visible marker.
EDITS = [
    ("router.use('/today',    require('./today'));",
     "router.use('/today',    require('../vendor-engine/today'));     // Phase 4 flip -> engine"),
    ("router.use('/cabinet',  require('./cabinet'));",
     "router.use('/cabinet',  require('../vendor-engine/cabinet'));   // Phase 4 flip -> engine"),
    ("router.use('/binders',  require('./binderWrite'));",
     "router.use('/binders',  require('../vendor-engine/binderWrite')); // Phase 4 flip -> engine"),
    ("router.use('/binders',  require('./binderRead'));",
     "router.use('/binders',  require('../vendor-engine/ledger'));      // Phase 4 flip -> engine (was binderRead)"),
    ("router.use('/chat',         require('./chat'));",
     "router.use('/chat',         require('../vendor-engine/chat'));   // Phase 4 flip -> engine (Victor)"),
]
for old, new in EDITS:
    if old not in txt:
        die("anchor not found (core.js differs from expected): " + old)
for old, new in EDITS:
    txt = txt.replace(old, new, 1)
open(F, "w", encoding="utf-8").write(txt)
print("+ flipped 5 vendor routes to the engine in core.js:")
print("    /cabinet /today /binders(write) /binders(ledger) /chat")
print("  Myra's files stay on disk (unmounted). /vendor-e left mounted as fallback.")
print("\\nRebuild + restart, then gate the REAL /api/v2/vendor paths (not -e).")
