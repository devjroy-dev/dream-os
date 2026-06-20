#!/usr/bin/env python3
# Vendor Suit -- invoice PDF staleness fix: generateInvoiceForBinder reuses a stored
# invoice ONLY while its figures still match the binder. If money moved, mint a fresh
# numbered invoice at current figures (no stale PDF). Steps 2/3/4 unchanged.
#   unzip -o vendor-suit-geninvoice-stale-fix-v1.zip && python3 writer.py
import os, sys, base64, json
ROOT = os.getcwd()
def die(m): print("ABORT: " + m); sys.exit(1)
if not os.path.isfile("package.json") or json.load(open("package.json")).get("name") != "dream-os-backend":
    die("run from the dream-os repo root.")
F = os.path.join(ROOT, "src", "api", "vendor", "invoices.js")
P = {'old': 'ICAvLyAxIOKAlCBpZGVtcG90ZW50OiBhbHJlYWR5IGdlbmVyYXRlZCBmb3IgdGhpcyBiaW5kZXI/CiAgY29uc3QgeyBkYXRhOiBleGlzdGluZyB9ID0gYXdhaXQgc3VwYWJhc2UKICAgIC5mcm9tKCdpbnZvaWNlcycpCiAgICAuc2VsZWN0KCdpZCwgaW52b2ljZV9udW1iZXIsIHBkZl91cmwsIGNsaWVudF9uYW1lLCBhbW91bnRfdG90YWwsIGFtb3VudF9hZHZhbmNlLCBhbW91bnRfcGFpZCwgZHVlX2RhdGUnKQogICAgLmVxKCdiaW5kZXJfaWQnLCBiaW5kZXIuaWQpLmVxKCd2ZW5kb3JfaWQnLCB2ZW5kb3IuaWQpCiAgICAubWF5YmVTaW5nbGUoKTsKCiAgbGV0IGludm9pY2UgPSBleGlzdGluZyB8fCBudWxsOwo=', 'new': 'ICAvLyAxIOKAlCBpZGVtcG90ZW50IE9OTFkgd2hpbGUgdGhlIGZpZ3VyZXMgYXJlIHVuY2hhbmdlZC4gQSBiaW5kZXIgYWNjcnVlcyBzZXZlcmFsCiAgLy8gaW52b2ljZXMgYWNyb3NzIGl0cyBsaWZlIChhZHZhbmNlLCB0aGVuIGJhbGFuY2UgdXBkYXRlcykg4oCUIHZlbmRvcnMgcnVuIH4zLTQKICAvLyBwYXltZW50cyBwZXIgYm9va2luZy4gRmV0Y2ggdGhlIExBVEVTVCBpbnZvaWNlIGZvciB0aGlzIGJpbmRlciBhbmQgcmV1c2UgaXQKICAvLyBvbmx5IGlmIGl0cyBhbW91bnRfcGFpZCArIGFtb3VudF90b3RhbCBzdGlsbCBtYXRjaCB0aGUgYmluZGVyJ3MgbGl2ZSBtb25leS4KICAvLyBJZiB0aGUgbW9uZXkgaGFzIG1vdmVkIHNpbmNlLCB0aGF0IHN0b3JlZCBQREYgaXMgU1RBTEUg4oCUIGZhbGwgdGhyb3VnaCB0byBtaW50CiAgLy8gYSBGUkVTSCBudW1iZXJlZCBpbnZvaWNlIChURFcvLi4uLzAzKSBhdCBjdXJyZW50IGZpZ3VyZXMuIE51bWJlcnMgbWF5IGluZmxhdGUKICAvLyBwZXIgYm9va2luZzsgdGhhdCdzIGFjY2VwdGVkLiBXaGF0IG11c3QgbmV2ZXIgaGFwcGVuIGlzIHNlcnZpbmcgYSBzdGFsZQogIC8vIGRvY3VtZW50IHdob3NlIGJhbGFuY2Ugbm8gbG9uZ2VyIG1hdGNoZXMgdGhlIGFjY291bnQuCiAgY29uc3QgeyBkYXRhOiBleGlzdGluZ1Jvd3MgfSA9IGF3YWl0IHN1cGFiYXNlCiAgICAuZnJvbSgnaW52b2ljZXMnKQogICAgLnNlbGVjdCgnaWQsIGludm9pY2VfbnVtYmVyLCBwZGZfdXJsLCBjbGllbnRfbmFtZSwgYW1vdW50X3RvdGFsLCBhbW91bnRfYWR2YW5jZSwgYW1vdW50X3BhaWQsIGR1ZV9kYXRlJykKICAgIC5lcSgnYmluZGVyX2lkJywgYmluZGVyLmlkKS5lcSgndmVuZG9yX2lkJywgdmVuZG9yLmlkKQogICAgLm9yZGVyKCdjcmVhdGVkX2F0JywgeyBhc2NlbmRpbmc6IGZhbHNlIH0pCiAgICAubGltaXQoMSk7CiAgY29uc3QgbGF0ZXN0ID0gKGV4aXN0aW5nUm93cyAmJiBleGlzdGluZ1Jvd3NbMF0pIHx8IG51bGw7CiAgY29uc3Qgc3RpbGxDdXJyZW50ID0gbGF0ZXN0CiAgICAmJiBOdW1iZXIobGF0ZXN0LmFtb3VudF9wYWlkKSAgPT09IChOdW1iZXIoYmluZGVyLmFtb3VudF9yZWNlaXZlZCkgfHwgMCkKICAgICYmIE51bWJlcihsYXRlc3QuYW1vdW50X3RvdGFsKSA9PT0gKE51bWJlcihiaW5kZXIuYW1vdW50KSB8fCAwKTsKCiAgbGV0IGludm9pY2UgPSBzdGlsbEN1cnJlbnQgPyBsYXRlc3QgOiBudWxsOwo='}
old = base64.b64decode(P["old"]).decode(); new = base64.b64decode(P["new"]).decode()
t = open(F, encoding="utf-8").read()
if "idempotent ONLY while the figures are unchanged" in t:
    print("= already applied (idempotent)."); sys.exit(0)
if old not in t: die("step-1 idempotency block not found verbatim -- inspect invoices.js.")
t = t.replace(old, new, 1)
open(F, "w", encoding="utf-8").write(t)
print("+ invoices.js: generateInvoiceForBinder reuses stored PDF only when figures match; else mints fresh number at current figures")
print("\nDone. Restart (no engine change).")
