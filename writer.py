#!/usr/bin/env python3
# writer.py - Derive-pending fix (strict). In kriya_money_edit, amount_pending is no
# longer a model-supplied cell: the hand derives it as amount - received whenever a
# ground fact (amount or amount_received) changes. A model-passed amount_pending is
# ignored. Negative pending is allowed to stand (caught by Kriya's read-time backstop).
# Scope: kriya_money_edit ONLY - kriya_money (initial write) never set pending. No schema
# change. Guarded + idempotent.
import base64, os, sys

TARGET = os.path.join("src", "agent", "kriyaPrimitives.js")
OLD_B64 = "ICAgICAgY29uc3QgZmllbGRzID0ge307CiAgICAgIGNvbnN0IGNvbmZlc3Npb25zID0gW107CiAgICAgIGNvbnN0IG51bSA9ICh2KSA9PiAodiA9PSBudWxsID8gbnVsbCA6IHBhcnNlTW9uZXkodikpOwogICAgICBjb25zdCBtb25leUtleXMgPSBbJ2Ftb3VudCcsICdhbW91bnRfcmVjZWl2ZWQnLCAnYW1vdW50X3BlbmRpbmcnXTsKICAgICAgZm9yIChjb25zdCBrIG9mIG1vbmV5S2V5cykgewogICAgICAgIGlmIChrIGluIGlucHV0ICYmIGlucHV0W2tdICE9IG51bGwpIHsKICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IG51bShpbnB1dFtrXSk7CiAgICAgICAgICBpZiAocGFyc2VkID09IG51bGwpIHJldHVybiB7IGRpc3BsYXk6IGBFUlJPUjogY291bGQgbm90IHJlYWQgJHtrfSAiJHtpbnB1dFtrXX0iLmAsIGVycm9yOiB0cnVlIH07CiAgICAgICAgICBjb25zdCBvbGRWID0gZXhpc3Rpbmdba107CiAgICAgICAgICBjb25mZXNzaW9ucy5wdXNoKGAke2t9OiAke29sZFYgPT0gbnVsbCA/ICfigJQnIDogbW9uZXlXb3JkcyhvbGRWKX0g4oaSICR7bW9uZXlXb3JkcyhwYXJzZWQpfWApOwogICAgICAgICAgZmllbGRzW2tdID0gcGFyc2VkOwogICAgICAgIH0KICAgICAgfQ=="
NEW_B64 = "ICAgICAgY29uc3QgZmllbGRzID0ge307CiAgICAgIGNvbnN0IGNvbmZlc3Npb25zID0gW107CiAgICAgIGNvbnN0IG51bSA9ICh2KSA9PiAodiA9PSBudWxsID8gbnVsbCA6IHBhcnNlTW9uZXkodikpOwogICAgICAvLyBUaGUgZ3JvdW5kIGZhY3RzIHRoZSBtb2RlbCBzdXBwbGllczogYW1vdW50ICh0aGUgY29udHJhY3QgdG90YWwpIGFuZAogICAgICAvLyBhbW91bnRfcmVjZWl2ZWQgKHdoYXQgaGFzIGFjdHVhbGx5IGxhbmRlZCkuIFBlbmRpbmcgaXMgTkVWRVIgc3VwcGxpZWQgYnkgaGFuZCDigJQKICAgICAgLy8gaXQgaXMgZGVyaXZlZCBiZWxvdyBhcyBhbW91bnQgLSByZWNlaXZlZCwgc28gYSBzdG9yZWQgYmFsYW5jZSBjYW4gbmV2ZXIgZGlzYWdyZWUKICAgICAgLy8gd2l0aCB0aGUgZGVhbCBhbmQgdGhlIHBheW1lbnRzLiBBIG1vZGVsLXBhc3NlZCBhbW91bnRfcGVuZGluZyBpcyBpZ25vcmVkLgogICAgICBjb25zdCBncm91bmRLZXlzID0gWydhbW91bnQnLCAnYW1vdW50X3JlY2VpdmVkJ107CiAgICAgIGZvciAoY29uc3QgayBvZiBncm91bmRLZXlzKSB7CiAgICAgICAgaWYgKGsgaW4gaW5wdXQgJiYgaW5wdXRba10gIT0gbnVsbCkgewogICAgICAgICAgY29uc3QgcGFyc2VkID0gbnVtKGlucHV0W2tdKTsKICAgICAgICAgIGlmIChwYXJzZWQgPT0gbnVsbCkgcmV0dXJuIHsgZGlzcGxheTogYEVSUk9SOiBjb3VsZCBub3QgcmVhZCAke2t9ICIke2lucHV0W2tdfSIuYCwgZXJyb3I6IHRydWUgfTsKICAgICAgICAgIGNvbnN0IG9sZFYgPSBleGlzdGluZ1trXTsKICAgICAgICAgIGNvbmZlc3Npb25zLnB1c2goYCR7a306ICR7b2xkViA9PSBudWxsID8gJ+KAlCcgOiBtb25leVdvcmRzKG9sZFYpfSDihpIgJHttb25leVdvcmRzKHBhcnNlZCl9YCk7CiAgICAgICAgICBmaWVsZHNba10gPSBwYXJzZWQ7CiAgICAgICAgfQogICAgICB9CiAgICAgIC8vIERlcml2ZSBwZW5kaW5nIGZyb20gdGhlIHJlc3VsdGluZyBmYWN0cyB3aGVuZXZlciBhIGdyb3VuZCBmYWN0IG1vdmVkLiBUaGUgaGFuZAogICAgICAvLyBkb2VzIHRoZSBhcml0aG1ldGljLCBuZXZlciB0aGUgaGVhZDogcGVuZGluZyA9IGFtb3VudCAtIHJlY2VpdmVkIChyZWNlaXZlZCBudWxsCiAgICAgIC8vIHRyZWF0ZWQgYXMgMCkuIE5lZ2F0aXZlIGlzIGFsbG93ZWQgdG8gc3RhbmQg4oCUIGlmIHJlY2VpdmVkIGV4Y2VlZHMgYW1vdW50IHRoYXQgaXMKICAgICAgLy8gaXRzZWxmIGFuIGFic3VyZGl0eSwgYW5kIEtyaXlhJ3MgcmVhZC10aW1lIGJhY2tzdG9wIHdpbGwgY2F0Y2ggYW5kIHN1cmZhY2UgaXQKICAgICAgLy8gcmF0aGVyIHRoYW4gaGF2ZSBpdCBzaWxlbnRseSBjbGFtcGVkIGF3YXkuCiAgICAgIGlmICgnYW1vdW50JyBpbiBmaWVsZHMgfHwgJ2Ftb3VudF9yZWNlaXZlZCcgaW4gZmllbGRzKSB7CiAgICAgICAgY29uc3QgbmV3QW1vdW50ID0gKCdhbW91bnQnIGluIGZpZWxkcykgPyBmaWVsZHMuYW1vdW50IDogZXhpc3RpbmcuYW1vdW50OwogICAgICAgIGNvbnN0IG5ld1JlY2VpdmVkID0gKCdhbW91bnRfcmVjZWl2ZWQnIGluIGZpZWxkcykgPyBmaWVsZHMuYW1vdW50X3JlY2VpdmVkIDogZXhpc3RpbmcuYW1vdW50X3JlY2VpdmVkOwogICAgICAgIGNvbnN0IGRlcml2ZWQgPSAobmV3QW1vdW50ID09IG51bGwgPyAwIDogbmV3QW1vdW50KSAtIChuZXdSZWNlaXZlZCA9PSBudWxsID8gMCA6IG5ld1JlY2VpdmVkKTsKICAgICAgICBjb25zdCBvbGRQID0gZXhpc3RpbmcuYW1vdW50X3BlbmRpbmc7CiAgICAgICAgaWYgKG9sZFAgIT09IGRlcml2ZWQpIGNvbmZlc3Npb25zLnB1c2goYGFtb3VudF9wZW5kaW5nOiAke29sZFAgPT0gbnVsbCA/ICfigJQnIDogbW9uZXlXb3JkcyhvbGRQKX0g4oaSICR7bW9uZXlXb3JkcyhkZXJpdmVkKX1gKTsKICAgICAgICBmaWVsZHMuYW1vdW50X3BlbmRpbmcgPSBkZXJpdmVkOwogICAgICB9"
GUARD = "Pending is NEVER supplied by hand"

def main():
    if not os.path.exists(TARGET):
        print("[ERROR] %s not found. Run from the dream-os repo root." % TARGET); sys.exit(1)
    with open(TARGET, "r", encoding="utf-8") as f:
        content = f.read()
    if GUARD in content:
        print("[SKIP] derive-pending is already applied."); return
    old = base64.b64decode(OLD_B64).decode("utf-8")
    new = base64.b64decode(NEW_B64).decode("utf-8")
    n = content.count(old)
    if n != 1:
        print("[ERROR] money-edit anchor found %d time(s) (expected 1). File UNTOUCHED." % n); sys.exit(1)
    content = content.replace(old, new)
    with open(TARGET, "w", encoding="utf-8") as f:
        f.write(content)
    print("[OK] derive-pending applied to kriya_money_edit (pending = amount - received, hand-derived).")
    print("     Gate: node --check src/agent/kriyaPrimitives.js")

if __name__ == "__main__":
    main()
