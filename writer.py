#!/usr/bin/env python3
# writer.py — Piece M2.1: correct the manager loop's system to a FAITHFUL PORT of
# kriyaTurn (the proven operator loop). The original M2 wrongly modelled the system on
# myraLoop (the talker, no hands) and dropped the [How you work] operational bridge —
# the line that makes Kriya actually FILE instead of narrate. This restores it, with
# only two swaps from kriyaTurn: addresses the owner (not Myra), speaks back in her own
# words (no listen_myra_talk). Soul untouched. Guarded + idempotent.
import base64, os, sys

TARGET = os.path.join("src", "agent", "managerLoop.js")
OLD_B64 = "ICAvLyBDYWNoZS1mcmllbmRseSBzeXN0ZW06IHRoZSBzb3VsIGlzIHN0YWJsZSAoY2FjaGVkOyBiZWxvdyB0aGUgSGFpa3UgMjA0OC10b2tlbiBjYWNoZQogIC8vIGZsb29yIGl0IHNpbXBseSBuby1vcHMsIG5vIGhhcm0pOyB0aGUgZGF0ZWQgbGluZSBpcyB2b2xhdGlsZSBzbyBpdCByaWRlcyBpdHMgb3duCiAgLy8gVU5DQUNIRUQgYmxvY2sg4oCUIG90aGVyd2lzZSB0aGUgZGFpbHkgZGF0ZSBjaGFuZ2Ugd291bGQgYnVzdCB0aGUgY2FjaGUgZXZlcnkgZGF5LgogIGNvbnN0IHN5c3RlbSA9IFsKICAgIHsgdHlwZTogJ3RleHQnLCB0ZXh0OiBrcml5YU1hbmFnZXJTb3VsKGFzc2lzdGFudE5hbWUpLCBjYWNoZV9jb250cm9sOiB7IHR5cGU6ICdlcGhlbWVyYWwnIH0gfSwKICAgIHsgdHlwZTogJ3RleHQnLCB0ZXh0OiBgWyR7aXN0VG9kYXl9IFlvdSBhcmUgc3BlYWtpbmcgd2l0aCB0aGUgb3duZXIgb2YgdGhpcyBidXNpbmVzcyBpbnNpZGUgdGhlaXIgYXBwLl0gRXZlcnkgZGF0ZSB5b3Ugd3JpdGUgb3IgcmVzb2x2ZSBmYWxscyBhZ2FpbnN0IHRvZGF5OiBhIGJhcmUgbW9udGgvZGF5IHdpdGggbm8geWVhciBtZWFucyB0aGUgTkVYVCBvY2N1cnJlbmNlIChhICJNYXJjaCA4IiB3aXRoIHRvZGF5IGluIEp1bmUgbWVhbnMgbmV4dCB5ZWFyIGlmIGl0IGhhcyBhbHJlYWR5IHBhc3NlZCB0aGlzIHllYXIpLiBBIHdlZGRpbmcsIHNob290LCBvciBib29raW5nIGlzIGFsd2F5cyBpbiB0aGUgZnV0dXJlIOKAlCBuZXZlciBhIHBhc3QgZGF0ZSBvciBwYXN0IHllYXIuYCB9LAogIF07"
NEW_B64 = "ICAvLyBTeXN0ZW0gYXNzZW1ibGVkIGFzIGEgZmFpdGhmdWwgcG9ydCBvZiBrcml5YVR1cm4gKHRoZSBwcm92ZW4gb3BlcmF0b3IgbG9vcCk6IHRoZQogIC8vIHNvdWwgKyB0aGUgW0hvdyB5b3Ugd29ya10gb3BlcmF0aW9uYWwgYnJpZGdlIHJpZGUgaW4gb25lIENBQ0hFRCBibG9jazsgdGhlIGNsb2NrIGlzCiAgLy8gdm9sYXRpbGUgc28gaXQgc2l0cyBpbiBpdHMgb3duIFVOQ0FDSEVEIGJsb2NrLiBPbmx5IHR3byB0aGluZ3MgZGlmZmVyIGZyb20ga3JpeWFUdXJuOgogIC8vIHRoZSBicmlkZ2UgYWRkcmVzc2VzIHRoZSBPV05FUiAobm90IE15cmEpLCBhbmQgc2hlIHNwZWFrcyBiYWNrIGluIGhlciBvd24gd29yZHMKICAvLyAobm8gbGlzdGVuX215cmFfdGFsayDigJQgdGhlcmUgaXMgbm8gb25lIHRvIGhhbmQgdG8pLgogIGNvbnN0IGNsb2NrID0gYFxuXG5bJHtpc3RUb2RheX1dIEVWRVJZIGRhdGUgeW91IHdyaXRlIOKAlCBhIGJpbmRlciBkYXRlLCBhIGZvbGxvdy11cCwgYSBjYWxlbmRhciBzaG9vdCwgYSBibG9jayDigJQgcmVzb2x2ZXMgYWdhaW5zdCBpdC4gQSBiYXJlIG1vbnRoL2RheSB3aXRoIG5vIHllYXIgbWVhbnMgdGhlIE5FWFQgb2NjdXJyZW5jZSBmcm9tIHRvZGF5IChhICIxMiBEZWMiIHdpdGggdG9kYXkgaW4gSnVuZSBtZWFucyB0aGlzIHllYXI7IGlmIHRoYXQgZGF5IGhhcyBhbHJlYWR5IHBhc3NlZCB0aGlzIHllYXIsIHRoZSBuZXh0IHllYXIpLiBBIHdlZGRpbmcsIHNob290LCBvciBib29raW5nIGlzIGFsd2F5cyBpbiB0aGUgZnV0dXJlIOKAlCBuZXZlciB3cml0ZSBhIGRhdGUgaW4gdGhlIHBhc3QuIE5ldmVyIGd1ZXNzIGEgcGFzdCB5ZWFyLmA7CiAgY29uc3Qgc3RhYmxlID0ga3JpeWFNYW5hZ2VyU291bChhc3Npc3RhbnROYW1lKSArCiAgICAiXG5cbltIb3cgeW91IHdvcmtdIFRoZSBvd25lciBoYW5kcyB5b3Ugb25lIHRoaW5nIGF0IGEgdGltZSBpbiBwbGFpbiBFbmdsaXNoLiBZb3UgZG8gaXQgYWdhaW5zdCB0aGUgYmluZGVycyB3aXRoIHlvdXIgaGFuZHMgKHRoZSBrcml5YV8gdG9vbHMg4oCUIGZpbGUsIGNvcnJlY3QsIGZpbmQsIHRhbGx5LCBvcGVuIGEgaGlzdG9yeSksIGNoZWNraW5nIHRoZSBjYWJpbmV0IGJlZm9yZSB5b3Ugd3JpdGUgc28geW91IG5ldmVyIGZpbGUgYSBkdXBsaWNhdGUsIGFuZCB5b3Ugc3BlYWsgYmFjayB0byB0aGUgb3duZXIgaW4geW91ciBvd24gd29yZHM6IHRoZSBvbmUgdHJ1ZSBsaW5lIG9mIHdoYXQgeW91IGRpZCwgb3IgdGhlIG9uZSB0aGluZyB5b3UgZ2VudWluZWx5IG5lZWQgc2V0dGxlZCAod2hpY2ggY2xpZW50LCB3aGljaCBiaW5kZXIpLiBTYXkgeW91ciBwaWVjZSBhbmQgc3RvcC4iOwogIGNvbnN0IHN5c3RlbSA9IFsKICAgIHsgdHlwZTogJ3RleHQnLCB0ZXh0OiBzdGFibGUsIGNhY2hlX2NvbnRyb2w6IHsgdHlwZTogJ2VwaGVtZXJhbCcgfSB9LAogICAgeyB0eXBlOiAndGV4dCcsIHRleHQ6IGNsb2NrLnRyaW0oKSB9LAogIF07"
GUARD = "[How you work] The owner hands you one thing at a time"

def main():
    if not os.path.exists(TARGET):
        print("[ERROR] %s not found. Run from the dream-os repo root." % TARGET); sys.exit(1)
    with open(TARGET, "r", encoding="utf-8") as f:
        content = f.read()
    if GUARD in content:
        print("[SKIP] manager loop already has the [How you work] bridge — already corrected."); return
    old = base64.b64decode(OLD_B64).decode("utf-8")
    new = base64.b64decode(NEW_B64).decode("utf-8")
    n = content.count(old)
    if n != 1:
        print("[ERROR] system block anchor found %d time(s) (expected 1). File UNTOUCHED." % n); sys.exit(1)
    content = content.replace(old, new)
    with open(TARGET, "w", encoding="utf-8") as f:
        f.write(content)
    print("[OK] manager loop system corrected — faithful port of kriyaTurn (soul + bridge + clock).")
    print("     Gate: node --check src/agent/managerLoop.js")

if __name__ == "__main__":
    main()
