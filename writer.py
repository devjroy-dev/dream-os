#!/usr/bin/env python3
# Vendor Suit -- 6-B expenses HOTFIX (v2): fix the baseOut helper.
# Bug: eng.from('records').eq(...) -- supabase-js needs .select() BEFORE filters,
# so baseOut() threw "eq is not a function", crashing the process (502 loop).
# Fix: baseOut(sel, opts) applies .select() first, then the filters.
#   unzip -o vendor-suit-phase6b-expenses-fix-v2.zip && python3 writer.py
import os, sys, base64, json
ROOT = os.getcwd()
def die(m): print("ABORT: " + m); sys.exit(1)
if not os.path.isfile("package.json") or json.load(open("package.json")).get("name") != "dream-os-backend":
    die("run from the dream-os repo root.")
F = os.path.join(ROOT, "src", "api", "vendor", "expenses.js")
P = {'old': 'ICBjb25zdCBiYXNlT3V0ID0gKCkgPT4gZW5nLmZyb20oJ3JlY29yZHMnKQogICAgLmVxKCdhZ2VudF9pZCcsIGFnZW50SWQpLmVxKCdkaXJlY3Rpb24nLCAnb3V0JykuZXEoJ2hpZGRlbicsIGZhbHNlKTsKCiAgY29uc3QgWwogICAgeyBkYXRhOiByb3dzLCAgICBlcnJvcjogbGlzdEVyciB9LAogICAgeyBjb3VudCwgICAgICAgICBlcnJvcjogY291bnRFcnIgfSwKICAgIHsgZGF0YTogYWxsT3V0LCAgZXJyb3I6IHN1bUVyciB9LAogIF0gPSBhd2FpdCBQcm9taXNlLmFsbChbCiAgICBiYXNlT3V0KCkKICAgICAgLnNlbGVjdCgnaWQsIGNsaWVudCwgYW1vdW50LCBkYXRlLCBub3RlLCBjcmVhdGVkX2F0JykKICAgICAgLm9yZGVyKCdjcmVhdGVkX2F0JywgeyBhc2NlbmRpbmc6IGZhbHNlIH0pCiAgICAgIC5yYW5nZShvZmZzZXQsIG9mZnNldCArIGxpbWl0IC0gMSksCiAgICBiYXNlT3V0KCkuc2VsZWN0KCcqJywgeyBjb3VudDogJ2V4YWN0JywgaGVhZDogdHJ1ZSB9KSwKICAgIGJhc2VPdXQoKS5zZWxlY3QoJ2Ftb3VudCcpLAogIF0pOwo=', 'new': 'ICAvLyBzZWxlY3QoKSBtdXN0IGNvbWUgQkVGT1JFIGZpbHRlcnMgaW4gc3VwYWJhc2UtanMg4oCUIHRoZSBoZWxwZXIgdGFrZXMgdGhlCiAgLy8gcHJvamVjdGlvbiBzbyBlYWNoIGNhbGxlciBzdGFydHMgZnJvbSBhIHZhbGlkIHF1ZXJ5IGJ1aWxkZXIuCiAgY29uc3QgYmFzZU91dCA9IChzZWwsIG9wdHMpID0+IGVuZy5mcm9tKCdyZWNvcmRzJykKICAgIC5zZWxlY3Qoc2VsLCBvcHRzKQogICAgLmVxKCdhZ2VudF9pZCcsIGFnZW50SWQpLmVxKCdkaXJlY3Rpb24nLCAnb3V0JykuZXEoJ2hpZGRlbicsIGZhbHNlKTsKCiAgY29uc3QgWwogICAgeyBkYXRhOiByb3dzLCAgICBlcnJvcjogbGlzdEVyciB9LAogICAgeyBjb3VudCwgICAgICAgICBlcnJvcjogY291bnRFcnIgfSwKICAgIHsgZGF0YTogYWxsT3V0LCAgZXJyb3I6IHN1bUVyciB9LAogIF0gPSBhd2FpdCBQcm9taXNlLmFsbChbCiAgICBiYXNlT3V0KCdpZCwgY2xpZW50LCBhbW91bnQsIGRhdGUsIG5vdGUsIGNyZWF0ZWRfYXQnKQogICAgICAub3JkZXIoJ2NyZWF0ZWRfYXQnLCB7IGFzY2VuZGluZzogZmFsc2UgfSkKICAgICAgLnJhbmdlKG9mZnNldCwgb2Zmc2V0ICsgbGltaXQgLSAxKSwKICAgIGJhc2VPdXQoJyonLCB7IGNvdW50OiAnZXhhY3QnLCBoZWFkOiB0cnVlIH0pLAogICAgYmFzZU91dCgnYW1vdW50JyksCiAgXSk7Cg=='}
old = base64.b64decode(P["old"]).decode(); new = base64.b64decode(P["new"]).decode()
txt = open(F, encoding="utf-8").read()
if "select() must come BEFORE filters" in txt:
    print("= already fixed (idempotent)."); sys.exit(0)
if old not in txt: die("broken baseOut region not found verbatim -- inspect.")
open(F,"w",encoding="utf-8").write(txt.replace(old, new, 1))
print("+ fixed: baseOut selects before filtering, array properly closed.")
