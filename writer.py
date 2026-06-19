#!/usr/bin/env python3
# Piece 5-B.2 (backend) - stop the raw operator dump leaking to the owner.
# kriya_action carries the tool's owner-facing `summary`; the firewall sends that
# (never the raw `display` with its UUIDs) as operator_action.detail. No summaries
# exist yet -> detail empty -> the trace shows the bare action line (no leak, no fake).
# dream-os = JavaScript; gate is `node --check`. Anchored, idempotent.
import base64, sys, os
def d(s): return base64.b64decode(s).decode("utf-8")
EDITS = [
    ("src/agent/kriyaTurn.js", "emit carries summary", "ICAgICAgaWYgKG9uRXZlbnQpIG9uRXZlbnQoeyB0eXBlOiAna3JpeWFfYWN0aW9uJywgbmFtZTogdHUubmFtZSwgaW5wdXQsIHJlc3VsdDogb3V0Y29tZS5kaXNwbGF5IH0pOw==", "ICAgICAgaWYgKG9uRXZlbnQpIG9uRXZlbnQoeyB0eXBlOiAna3JpeWFfYWN0aW9uJywgbmFtZTogdHUubmFtZSwgaW5wdXQsIHJlc3VsdDogb3V0Y29tZS5kaXNwbGF5LCBzdW1tYXJ5OiBvdXRjb21lLnN1bW1hcnkgfSk7"),
    ("src/agent/displayFirewall.js", "firewall sends summary not raw", "ICAgICAgcmV0dXJuIHsgdHlwZTogJ29wZXJhdG9yX2FjdGlvbicsIGtpbmQ6IGtpbmRPZihlLm5hbWUpLCBkZXRhaWw6IHNjcnViKGUucmVzdWx0KSB9Ow==", "ICAgICAgLy8gZGV0YWlsIGlzIHRoZSB0b29sJ3MgT1dORVItRkFDSU5HIHN1bW1hcnkgKGF1dGhvcmVkIGF0IHRoZSBzb3VyY2UpLCBuZXZlcgogICAgICAvLyB0aGUgcmF3IGRpc3BsYXkgZHVtcCAod2hpY2ggY2FycmllcyBVVUlEcy9JRHMgZm9yIHRoZSBvcGVyYXRvcidzIG93biBtZW1vcnkpLgogICAgICAvLyBObyBzdW1tYXJ5IHlldCAtPiBlbXB0eSBkZXRhaWw7IHRoZSB0cmFjZSB0aGVuIHNob3dzIHRoZSBiYXJlIGFjdGlvbiBsaW5lLgogICAgICByZXR1cm4geyB0eXBlOiAnb3BlcmF0b3JfYWN0aW9uJywga2luZDoga2luZE9mKGUubmFtZSksIGRldGFpbDogc2NydWIoZS5zdW1tYXJ5IHx8ICcnKSB9Ow==")
]
applied = skipped = 0
for path, label, o_b64, n_b64 in EDITS:
    if not os.path.exists(path):
        print("SKIP  [%s] %s not found." % (label, path)); skipped += 1; continue
    text = open(path, encoding="utf-8").read()
    old, new = d(o_b64), d(n_b64)
    if new in text:
        print("SKIP  [%s] already applied." % label); skipped += 1; continue
    c = text.count(old)
    if c == 1:
        open(path, "w", encoding="utf-8").write(text.replace(old, new)); applied += 1; print("OK    [%s]" % label)
    elif c == 0: print("SKIP  [%s] anchor NOT FOUND." % label); skipped += 1
    else: print("SKIP  [%s] anchor x%d." % (label, c)); skipped += 1
kt = open("src/agent/kriyaTurn.js", encoding="utf-8").read()
fw = open("src/agent/displayFirewall.js", encoding="utf-8").read()
checks = [
  ("emit passes summary",        "result: outcome.display, summary: outcome.summary" in kt),
  ("firewall uses summary",      "detail: scrub(e.summary || '')" in fw),
  ("raw result no longer in detail","detail: scrub(e.result)" not in fw),
]
print(chr(10) + "-- verification --")
allok = True
for n,p in checks: print("  %s %s" % ("PASS" if p else "FAIL", n)); allok = allok and p
print(chr(10) + "(%d applied, %d skipped)" % (applied, skipped))
print("ALL CHECKS PASSED" if allok else "SOME CHECKS FAILED")
sys.exit(0 if allok else 2)
