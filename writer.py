#!/usr/bin/env python3
# Auth Step 1d: normalize phone to E.164 (+digits) in provisionRole BEFORE any
# write or phone lookup. Fixes the bug where Supabase's digits-only phone
# ("918757788550") was stored plus-less, mismatching every '+'-keyed lookup
# (pin-status, legacy rows). One feature: phone normalization.
#   unzip -o auth-1d-phone-e164-v1.zip && python3 writer.py
import os, sys, base64, json
ROOT = os.getcwd()
def die(m): print("ABORT: " + m); sys.exit(1)
if not os.path.isfile("package.json") or json.load(open("package.json")).get("name") != "dream-os-backend":
    die("run from the dream-os repo root.")
P = {'old': 'YXN5bmMgZnVuY3Rpb24gcHJvdmlzaW9uUm9sZShzdXBhYmFzZSwgeyBhdXRoVXNlcklkLCBwaG9uZSwgbmFtZSwgcm9sZSB9KSB7CiAgaWYgKCFhdXRoVXNlcklkKSB0aHJvdyBuZXcgRXJyb3IoJ2F1dGhVc2VySWQgcmVxdWlyZWQnKTsKICBjb25zdCByb2xlVGFibGUgPSByb2xlID09PSAnY291cGxlJyA/ICdjb3VwbGVzJyA6ICd2ZW5kb3JzJzsK', 'new': 'YXN5bmMgZnVuY3Rpb24gcHJvdmlzaW9uUm9sZShzdXBhYmFzZSwgeyBhdXRoVXNlcklkLCBwaG9uZSwgbmFtZSwgcm9sZSB9KSB7CiAgaWYgKCFhdXRoVXNlcklkKSB0aHJvdyBuZXcgRXJyb3IoJ2F1dGhVc2VySWQgcmVxdWlyZWQnKTsKICAvLyBTdXBhYmFzZSByZXR1cm5zIHBob25lIGRpZ2l0cy1vbmx5IChlLmcuICI5MTg3NTc3ODg1NTAiKTsgdGhlIHJlc3Qgb2YgdGhlCiAgLy8gc3lzdGVtIHN0b3Jlcy9sb29rcyB1cCBFLjE2NCBXSVRIIHRoZSBsZWFkaW5nICcrJy4gTm9ybWFsaXplIGJlZm9yZSBhbnkKICAvLyB3cml0ZSBvciBwaG9uZSBsb29rdXAgc28gdGhlIG5ldyBmbG93IHN0YXlzIGNvbnNpc3RlbnQgd2l0aCBwaW4tc3RhdHVzLAogIC8vIHRoZSBvbGQgcm93cywgYW5kIGV2ZXJ5ICcrJy1rZXllZCBxdWVyeS4KICBpZiAocGhvbmUpIHsKICAgIGNvbnN0IGRpZ2l0cyA9IFN0cmluZyhwaG9uZSkucmVwbGFjZSgvW14wLTldL2csICcnKTsKICAgIHBob25lID0gZGlnaXRzID8gJysnICsgZGlnaXRzIDogbnVsbDsKICB9CiAgY29uc3Qgcm9sZVRhYmxlID0gcm9sZSA9PT0gJ2NvdXBsZScgPyAnY291cGxlcycgOiAndmVuZG9ycyc7Cg=='}
F = os.path.join(ROOT, "src", "lib", "provisionRole.js")
t = open(F, encoding="utf-8").read()
if "Normalize before any" in t or "replace(/[^0-9]/g" in t:
    print("= provisionRole already normalizes phone (idempotent)."); sys.exit(0)
old = base64.b64decode(P["old"]).decode()
new = base64.b64decode(P["new"]).decode()
if old not in t: die("provisionRole signature block not found verbatim.")
t = t.replace(old, new, 1)
open(F, "w", encoding="utf-8").write(t)
print("+ provisionRole: phone normalized to +E.164 before write/lookup")
print("\nDone. Restart (no engine change).")
