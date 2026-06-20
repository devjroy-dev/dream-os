#!/usr/bin/env python3
# Vendor Suit -- generate-invoice (i) FIX v2: balance due was wrong on the PDF.
# Cause: amount_paid stayed 0 (createInvoice default), but the PDF balance =
# amount_total - amount_paid. Fix: set amount_paid = binder.amount_received.
#   unzip -o vendor-suit-geninvoice-i-fix-v2.zip && python3 writer.py
import os, sys, base64, json
ROOT = os.getcwd()
def die(m): print("ABORT: " + m); sys.exit(1)
if not os.path.isfile("package.json") or json.load(open("package.json")).get("name") != "dream-os-backend":
    die("run from the dream-os repo root.")
F = os.path.join(ROOT, "src", "api", "vendor", "invoices.js")
P = {'old': 'ICAgIGludm9pY2UgPSBjcmVhdGVkLmludm9pY2U7CiAgICAvLyBsaW5rIHRoZSBmb3JtYWwgaW52b2ljZSBiYWNrIHRvIGl0cyBtb25leS1yZWNvcmQgYmluZGVyCiAgICBhd2FpdCBzdXBhYmFzZS5mcm9tKCdpbnZvaWNlcycpLnVwZGF0ZSh7IGJpbmRlcl9pZDogYmluZGVyLmlkIH0pLmVxKCdpZCcsIGludm9pY2UuaWQpOwogIH0K', 'new': 'ICAgIGludm9pY2UgPSBjcmVhdGVkLmludm9pY2U7CiAgICAvLyBMaW5rIHRvIHRoZSBtb25leS1yZWNvcmQgYmluZGVyIEFORCBzZXQgYW1vdW50X3BhaWQgZnJvbSB3aGF0J3MgYWN0dWFsbHkKICAgIC8vIGJlZW4gcmVjZWl2ZWQuIGNyZWF0ZUludm9pY2UgaGFyZGNvZGVzIGFtb3VudF9wYWlkOjAsIGJ1dCB0aGUgUERGIGNvbXB1dGVzCiAgICAvLyBiYWxhbmNlID0gYW1vdW50X3RvdGFsIC0gYW1vdW50X3BhaWQsIHNvIHRoZSByZWNlaXZlZCBtb25leSBtdXN0IGxhbmQgaGVyZQogICAgLy8gKGVsc2UgIkJhbGFuY2UgZHVlIiBzaG93cyB0aGUgZnVsbCB0b3RhbCkuIGFtb3VudF9hZHZhbmNlIGRyaXZlcyB0aGUKICAgIC8vICJyZWNlaXZlZCIgbGluZTsgYW1vdW50X3BhaWQgZHJpdmVzIHRoZSBiYWxhbmNlICsgVVBJIFFSLgogICAgY29uc3QgcmVjZWl2ZWQgPSBOdW1iZXIoYmluZGVyLmFtb3VudF9yZWNlaXZlZCkgfHwgMDsKICAgIGF3YWl0IHN1cGFiYXNlLmZyb20oJ2ludm9pY2VzJykKICAgICAgLnVwZGF0ZSh7IGJpbmRlcl9pZDogYmluZGVyLmlkLCBhbW91bnRfcGFpZDogcmVjZWl2ZWQgfSkKICAgICAgLmVxKCdpZCcsIGludm9pY2UuaWQpOwogICAgaW52b2ljZS5hbW91bnRfcGFpZCA9IHJlY2VpdmVkOyAgIC8vIGtlZXAgdGhlIGluLW1lbW9yeSBvYmplY3QgdHJ1dGhmdWwgZm9yIHRoZSByZW5kZXIKICB9Cg=='}
old = base64.b64decode(P["old"]).decode(); new = base64.b64decode(P["new"]).decode()
txt = open(F, encoding="utf-8").read()
if "keep the in-memory object truthful" in txt:
    print("= already fixed (idempotent)."); sys.exit(0)
if "generateInvoiceForBinder" not in txt: die("piece (i) not applied -- apply it first.")
if old not in txt: die("link-binder block not found verbatim -- inspect.")
open(F,"w",encoding="utf-8").write(txt.replace(old, new, 1))
print("+ amount_paid now set from binder.amount_received (balance due correct).")
