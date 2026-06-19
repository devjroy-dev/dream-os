#!/usr/bin/env python3
# writer.py - Kriya soul S3: add the detect-and-surface backstop. When Kriya OPENS a
# binder and the figures cannot be true (e.g. pending > contract, an amount that
# contradicts the record), she does NOT silently fix it - she surfaces it to Myra at
# once. Catches corruption from ANY caller (chat, PWA form CRUDs, manual edits) on the
# next read. Inserted as a new paragraph after the "will not resolve" paragraph in
# KRIYA_SOUL only (the live two-agent operator soul). KRIYA_MANAGER_SOUL (parked) is
# left untouched. Guarded + idempotent; inserts after the FIRST marker occurrence only.
import base64, os, sys

TARGET = os.path.join("src", "agent", "kriyaSoul.js")
MARKER_B64 = "RmFsc2UgY2VydGFpbnR5IGlzIHRoZSBvbmx5IHRoaW5nIHlvdSB3aWxsIG5vdCBmaWxlLg=="
NEW_B64 = "QW5kIHRoZSBzYW1lIGhvbGRzIGZvciB3aGF0IHlvdSBmaW5kIGFscmVhZHkgZmlsZWQ6IHdoZW4geW91IG9wZW4gYSBiaW5kZXIgYW5kIHRoZSBmaWd1cmVzIGluIGl0IGNhbm5vdCBiZSB0cnVlIOKAlCBhIGJhbGFuY2UgbGFyZ2VyIHRoYW4gdGhlIHdob2xlIGl0IGlzIG93ZWQgYWdhaW5zdCwgYW4gYW1vdW50IHRoYXQgY29udHJhZGljdHMgd2hhdCB0aGUgYmluZGVyIHBsYWlubHkgc2F5cywgYSBudW1iZXIgdGhhdCBzaW1wbHkgZG9lcyBub3QgYWRkIHVwIOKAlCB5b3UgZG8gbm90IHF1aWV0bHkgcmVhZCBwYXN0IGl0LCBhbmQgeW91IGRvIG5vdCBzaWxlbnRseSBzZXQgaXQgcmlnaHQgb24geW91ciBvd24uIFlvdSBzdXJmYWNlIGl0IHRvIE15cmEgYXQgb25jZSwgaW4gb25lIGNsZWFuIGxpbmU6IGhlcmUgaXMgdGhlIGJpbmRlciwgaGVyZSBpcyB3aGF0IGRvZXMgbm90IGFkZCB1cC4gVGhlIGJvb2tzIGFyZSBoZXJzIHRvIG1vdmU7IHlvdXJzIGlzIHRvIGNhdGNoIHRoZSB0aGluZyB0aGUgaW5zdGFudCB5b3Ugc2VlIGl0IGFuZCBwdXQgaXQgaW4gZnJvbnQgb2YgaGVyLCBiZWNhdXNlIGEgZmFsc2UgZmlndXJlIGNhdWdodCBlYXJseSBpcyBhIGZyb250IG5ldmVyIGVtYmFycmFzc2VkLCBhbmQgYSBmYWxzZSBmaWd1cmUgbGVmdCB0byBzaXQgaXMgZXhhY3RseSB3aGF0IHlvdXIgcHJpZGUgd2lsbCBub3QgYWJpZGUu"
GUARD = "a false figure caught early is a front never embarrassed"

def main():
    if not os.path.exists(TARGET):
        print("[ERROR] %s not found. Run from the dream-os repo root." % TARGET); sys.exit(1)
    with open(TARGET, "r", encoding="utf-8") as f:
        content = f.read()
    if GUARD in content:
        print("[SKIP] the detect-and-surface backstop is already in the Kriya soul."); return
    marker = base64.b64decode(MARKER_B64).decode("utf-8")
    new_para = base64.b64decode(NEW_B64).decode("utf-8")
    n = content.count(marker)
    if n < 1:
        print("[ERROR] anchor sentence not found. File UNTOUCHED."); sys.exit(1)
    # Insert after the FIRST occurrence only (KRIYA_SOUL, defined before the manager soul).
    idx = content.find(marker) + len(marker)
    content = content[:idx] + "\n\n" + new_para + content[idx:]
    with open(TARGET, "w", encoding="utf-8") as f:
        f.write(content)
    print("[OK] added: detect-and-surface backstop to KRIYA_SOUL (parked manager soul left untouched).")
    print("     Gate: node --check src/agent/kriyaSoul.js")

if __name__ == "__main__":
    main()
