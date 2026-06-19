#!/usr/bin/env python3
# Vendor Suit -- Phase 5-B-2: WhatsApp TDW enquiry -> engine cabinet.
# The bride's TDW- WhatsApp enquiry currently writes public.leads directly. This
# welds it to the engine cabinet via enquiryToBinder (the same engine weld 5-B
# delivered), so BOTH enquiry channels (web Discover + WhatsApp TDW) land as leads
# in engine.records. The couple agent (bride-facing) is untouched. Guarded + idempotent.
# Requires 5-A (engine requires) AND 5-B (engine enquiryBinder.js) already applied.
#   unzip -o vendor-suit-phase5b2-whatsapp-enquiry-v1.zip && python3 writer.py
import os, sys, base64, json
ROOT = os.getcwd()
def die(m): print("ABORT: " + m); sys.exit(1)
if not os.path.isfile("package.json") or json.load(open("package.json")).get("name") != "dream-os-backend":
    die("run from the dream-os repo root.")
EB = os.path.join(ROOT,"src","lib","vendor","enquiryBinder.js")
if not os.path.isfile(EB) or "executeRecordTool" not in open(EB,encoding="utf-8").read():
    die("enquiryBinder.js is not the engine version -- apply Phase 5-B first.")

P = {'old_A': 'ICAgICAgICAvLyBDcmVhdGUgaW5pdGlhbCBsZWFkIChkZWR1cGVkIG9uIHZlbmRvcl9pZCArIHBob25lKQogICAgICAgIGNvbnN0IHsgZGF0YTogZXhpc3RpbmdMZWFkIH0gPSBhd2FpdCBzdXBhYmFzZQogICAgICAgICAgLmZyb20oJ2xlYWRzJykKICAgICAgICAgIC5zZWxlY3QoJ2lkJykKICAgICAgICAgIC5lcSgndmVuZG9yX2lkJywgbWF0Y2hlZEJ5VGR3LmlkKQogICAgICAgICAgLmVxKCdwaG9uZScsIHBob25lKQogICAgICAgICAgLm1heWJlU2luZ2xlKCk7CgogICAgICAgIGlmICghZXhpc3RpbmdMZWFkKSB7CiAgICAgICAgICBhd2FpdCBzdXBhYmFzZS5mcm9tKCdsZWFkcycpLmluc2VydCh7CiAgICAgICAgICAgIHZlbmRvcl9pZDogICBtYXRjaGVkQnlUZHcuaWQsCiAgICAgICAgICAgIHBob25lLAogICAgICAgICAgICBzb3VyY2U6ICAgICAgJ3doYXRzYXBwJywKICAgICAgICAgICAgcmF3X21lc3NhZ2U6IGJvZHksCiAgICAgICAgICAgIHN0YXRlOiAgICAgICAnbmV3JywKICAgICAgICAgIH0pOwogICAgICAgIH0K', 'new_A': 'ICAgICAgICAvLyA1LUItMiDigJQgbGFuZCB0aGUgZW5xdWlyeSBpbiB0aGUgZW5naW5lIGNhYmluZXQgKHdhcyBhIHB1YmxpYy5sZWFkcyBpbnNlcnQpLgogICAgICAgIC8vIGVucXVpcnlUb0JpbmRlciBkZWR1cHMgYnkgcGhvbmUgYW5kIG9wZW5zIHRoZSBiaW5kZXIgYXMgYSBsZWFkOyB0aGUKICAgICAgICAvLyBwb3N0LWFnZW50IGNhbGwgYmVsb3cgZW5yaWNoZXMgaXRzIG5vdGUgd2l0aCB0aGUgdmVuZG9yIHN1bW1hcnkuIFRoZQogICAgICAgIC8vIG1hcmtldHBsYWNlIGlzIGp1c3QgYW5vdGhlciBjYWxsZXIuCiAgICAgICAgYXdhaXQgZW5xdWlyeVRvQmluZGVyKHN1cGFiYXNlLCBtYXRjaGVkQnlUZHcuaWQsIHsKICAgICAgICAgIHBob25lLAogICAgICAgICAgbm90ZTogYEVucXVpcnkgdmlhIHlvdXIgVERXIGxpbmsuIEZpcnN0IG1lc3NhZ2U6ICR7Ym9keX1gLAogICAgICAgIH0pOwo=', 'old_B': 'ICAgICAgICAvLyBEZW5vcm1hbGlzZSB2ZW5kb3Jfc3VtbWFyeSBvbnRvIHRoZSBsZWFkIHJvdyBmb3IgZmFzdCByZWFkcyBpbiBkZXRhaWwgdmlldwogICAgICAgIGlmIChyZXN1bHQudmVuZG9yTm90aWZpY2F0aW9uICYmICFleGlzdGluZ0xlYWQpIHsKICAgICAgICAgIGF3YWl0IHN1cGFiYXNlLmZyb20oJ2xlYWRzJykKICAgICAgICAgICAgLnVwZGF0ZSh7IHZlbmRvcl9zdW1tYXJ5OiByZXN1bHQudmVuZG9yTm90aWZpY2F0aW9uIH0pCiAgICAgICAgICAgIC5lcSgndmVuZG9yX2lkJywgbWF0Y2hlZEJ5VGR3LmlkKQogICAgICAgICAgICAuZXEoJ3Bob25lJywgcGhvbmUpCiAgICAgICAgICAgIC5pcygnZGVsZXRlZF9hdCcsIG51bGwpOwogICAgICAgIH0K', 'new_B': 'ICAgICAgICAvLyBFbnJpY2ggdGhlIGVuZ2luZSBiaW5kZXIncyBub3RlIHdpdGggdGhlIHZlbmRvciBzdW1tYXJ5IChkZWR1cCAtPiBub3RlX2FwcGVuZCkuCiAgICAgICAgaWYgKHJlc3VsdC52ZW5kb3JOb3RpZmljYXRpb24pIHsKICAgICAgICAgIGF3YWl0IGVucXVpcnlUb0JpbmRlcihzdXBhYmFzZSwgbWF0Y2hlZEJ5VGR3LmlkLCB7CiAgICAgICAgICAgIHBob25lLAogICAgICAgICAgICBub3RlOiByZXN1bHQudmVuZG9yTm90aWZpY2F0aW9uLAogICAgICAgICAgfSk7CiAgICAgICAgfQo='}
dec = lambda k: base64.b64decode(P[k]).decode()
IDX = os.path.join(ROOT,"src","index.js"); txt = open(IDX,encoding="utf-8").read()

if "5-B-2 — land the enquiry" in txt:
    print("= index.js TDW enquiry already welded to the engine (idempotent)."); sys.exit(0)

# 1 — require enquiryToBinder (idempotent)
if "lib/vendor/enquiryBinder" not in txt:
    anchor = "const { sendWhatsApp } = require('./lib/whatsapp');"
    if anchor not in txt: die("sendWhatsApp require anchor not found -- inspect.")
    txt = txt.replace(anchor, anchor + "\nconst { enquiryToBinder } = require('./lib/vendor/enquiryBinder'); // 5-B-2", 1)
    print("+ index.js: added enquiryToBinder require")
else:
    print("= enquiryToBinder already required.")

# 2 — swap the bare lead insert (block A)
old_A, new_A = dec("old_A"), dec("new_A")
if old_A not in txt: die("the public.leads insert block (A) was not found verbatim -- inspect.")
txt = txt.replace(old_A, new_A, 1); print("+ index.js: TDW lead insert -> enquiryToBinder (engine)")

# 3 — swap the vendor_summary denormalisation (block B)
old_B, new_B = dec("old_B"), dec("new_B")
if old_B not in txt: die("the vendor_summary denorm block (B) was not found verbatim -- inspect.")
txt = txt.replace(old_B, new_B, 1); print("+ index.js: vendor_summary denorm -> note enrich (note_append via dedup)")

open(IDX,"w",encoding="utf-8").write(txt)
print("\nPhase 5-B-2 applied. Restart, then send a TDW- enquiry from a test number.")
