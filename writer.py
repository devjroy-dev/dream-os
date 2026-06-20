#!/usr/bin/env python3
# Vendor Suit -- snapshot coherence: REST writes patch Donna's snapshot like chat does.
# 1) engine: export patchNote from donna.ts (proven in-loop fn, now reachable).
# 2) dream-os: new src/lib/executeAndPatch.js = executeRecordTool + patchNote.
# 3) swap binderWrite.js + invoices.js door writes onto executeAndPatch.
# Forward coherence only. REQUIRES build:engine after.
#   unzip -o vendor-suit-snapshot-coherence-v1.zip && python3 writer.py
import os, sys, base64, json
ROOT = os.getcwd()
def die(m): print("ABORT: " + m); sys.exit(1)
if not os.path.isfile("package.json") or json.load(open("package.json")).get("name") != "dream-os-backend":
    die("run from the dream-os repo root.")

# 1 — engine: export patchNote
DN = os.path.join(ROOT, "src", "engine", "src", "core", "donna.ts")
d = open(DN, encoding="utf-8").read()
if "export async function patchNote" in d:
    print("= patchNote already exported (idempotent).")
else:
    a = "async function patchNote(agentId: string, outcome: ToolOutcome): Promise<void> {"
    if a not in d: die("patchNote declaration not found.")
    d = d.replace(a, "export " + a, 1)
    open(DN, "w", encoding="utf-8").write(d)
    print("+ donna.ts: patchNote exported")

# 2 — the shared helper
LIB = os.path.join(ROOT, "src", "lib", "executeAndPatch.js")
if os.path.isfile(LIB) and "executeAndPatch" in open(LIB).read():
    print("= executeAndPatch.js already present (idempotent).")
else:
    open(LIB, "w", encoding="utf-8").write(base64.b64decode('Ly8gc3JjL2xpYi9leGVjdXRlQW5kUGF0Y2guanMKLy8gIlRoZSBzY3JlZW4gaXMganVzdCBhbm90aGVyIGNhbGxlci4iIEEgUkVTVC9DUlVEIHdyaXRlIG11c3QgYmVoYXZlIEVYQUNUTFkgYXMgaWYKLy8gRG9ubmEgZGlkIGl0IGluIGNoYXQ6IHRoZSBoYW5kIGZpcmVzIEFORCBoZXIgZHVyYWJsZSBzbmFwc2hvdCBpcyBwYXRjaGVkIGZyb20gdGhlCi8vIGNvbmZpcm1lZCBvdXRjb21lLiBUaGUgY2hhdCBsb29wIGRvZXMgZXhlY3V0ZVJlY29yZFRvb2wgLT4gcGF0Y2hOb3RlOyB0aGUgZG9vcnMsCi8vIHdoaWNoIHByZXZpb3VzbHkgY2FsbGVkIGV4ZWN1dGVSZWNvcmRUb29sIGFuZCBkaXNjYXJkZWQgaXRzIHNuYXBzaG90IGhhbGYsIG5vdyBnbwovLyB0aHJvdWdoIGhlcmUgc28gdGhlIHNuYXBzaG90IHN0YXlzIGNvaGVyZW50IG9uIGV2ZXJ5IHBhdGggKGZvcndhcmQgY29oZXJlbmNlKS4KJ3VzZSBzdHJpY3QnOwpjb25zdCB7IGV4ZWN1dGVSZWNvcmRUb29sIH0gPSByZXF1aXJlKCcuLi9lbmdpbmUvZGlzdC9jb3JlL3Rvb2xzL3JlY29yZFByaW1pdGl2ZXMnKTsKY29uc3QgeyBwYXRjaE5vdGUgfSAgICAgICAgID0gcmVxdWlyZSgnLi4vZW5naW5lL2Rpc3QvY29yZS9kb25uYScpOwoKYXN5bmMgZnVuY3Rpb24gZXhlY3V0ZUFuZFBhdGNoKGFnZW50SWQsIG5hbWUsIGlucHV0KSB7CiAgY29uc3Qgb3V0Y29tZSA9IGF3YWl0IGV4ZWN1dGVSZWNvcmRUb29sKGFnZW50SWQsIG5hbWUsIGlucHV0KTsKICB0cnkgewogICAgLy8gcGF0Y2ggZnJvbSB0aGUgQ09ORklSTUVEIHdyaXRlIChvdXRjb21lLml0ZW0gLyBvdXRjb21lLnJlbW92ZSksIGV4YWN0bHkgYXMgdGhlIGxvb3AgZG9lcy4KICAgIGF3YWl0IHBhdGNoTm90ZShhZ2VudElkLCBvdXRjb21lKTsKICB9IGNhdGNoIChlKSB7CiAgICAvLyBhIHNuYXBzaG90LXBhdGNoIGZhaWx1cmUgbXVzdCBuZXZlciBmYWlsIHRoZSB3cml0ZSDigJQgdGhlIGNlbGxzIGFscmVhZHkgbGFuZGVkLgogICAgY29uc29sZS5lcnJvcignW2V4ZWN1dGVBbmRQYXRjaF0gc25hcHNob3QgcGF0Y2ggZmFpbGVkICh3cml0ZSBzdGlsbCBsYW5kZWQpOicsIGUubWVzc2FnZSk7CiAgfQogIHJldHVybiBvdXRjb21lOwp9Cgptb2R1bGUuZXhwb3J0cyA9IHsgZXhlY3V0ZUFuZFBhdGNoIH07Cg==').decode())
    print("+ created src/lib/executeAndPatch.js")

# 3 — swap the doors
def swap(rel, old_require):
    F = os.path.join(ROOT, *rel)
    t = open(F, encoding="utf-8").read()
    name = rel[-1]
    if "executeAndPatch" in t:
        print(f"= {name} already on executeAndPatch (idempotent)."); return
    if old_require not in t: die(f"{name}: executeRecordTool require not found.")
    t = t.replace(old_require, "const { executeAndPatch } = require('../../lib/executeAndPatch');", 1)
    n = t.count("executeRecordTool(agentId,")
    t = t.replace("executeRecordTool(agentId,", "executeAndPatch(agentId,")
    open(F, "w", encoding="utf-8").write(t)
    print(f"+ {name}: require swapped + {n} call site(s) -> executeAndPatch")

swap(["src","api","vendor-engine","binderWrite.js"],
     "const { executeRecordTool } = require('../../engine/dist/core/tools/recordPrimitives');")
swap(["src","api","vendor","invoices.js"],
     "const { executeRecordTool } = require('../../engine/dist/core/tools/recordPrimitives');")

print("\nDone. npm run build:engine, then restart.")
