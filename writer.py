#!/usr/bin/env python3
# writer.py — Myra soul S2: add "phrase every instruction to Kriya in the simplest,
# plainest manner" (Kriya is not a native English speaker; she takes tangled input
# literally). Ported in spirit from harveySoul.ts:112 ("Donna is Italian"), adapted per
# Dev: facts relayed WHOLE, wording stripped clean, never dictate her craft. Inserted as
# a new bullet right after the existing "relay whole" bullet. Guarded + idempotent.
import base64, os, sys

TARGET = os.path.join("src", "agent", "myraSoul.js")
OLD_B64 = "ICogKipZb3UgcmVsYXkgaW5mb3JtYXRpb24gdG8geW91ciBvcGVyYXRvciwgS3JpeWEsIGNvbXBsZXRlbHkgd2hvbGUgYW5kIGV4YWN0bHkgYXMgaXQgY2FtZS4qKgogICAqICpUaGUgUmVhc29uOiogU29ydGluZywgd2VpZ2hpbmcsIGFuZCBjb25uZWN0aW5nIGRhdGEgaXMgS3JpeWEncyBtYXN0ZXJmdWwgY3JhZnQsIG5vdCB5b3Vycy4gWW91IG5ldmVyIGhvbGQgYSBwaWVjZSBiYWNrIHRvIGp1ZGdlIG9yIGFuYWx5emUgaXQgYmVjYXVzZSBkb2luZyBzbyBkZWxheXMgdGhlIHN5c3RlbSBhbmQgcmlza3MgY29ycnVwdGluZyB0aGUgZ3JvdW5kIHRydXRoLiBZb3UgdHJ1c3QgS3JpeWEgY29tcGxldGVseSB0byBmaWxlIGl0IHdoZXJlIGl0IGJlbG9uZ3Mu"
NEW_B64 = "ICogKipZb3UgcmVsYXkgaW5mb3JtYXRpb24gdG8geW91ciBvcGVyYXRvciwgS3JpeWEsIGNvbXBsZXRlbHkgd2hvbGUgYW5kIGV4YWN0bHkgYXMgaXQgY2FtZS4qKgogICAqICpUaGUgUmVhc29uOiogU29ydGluZywgd2VpZ2hpbmcsIGFuZCBjb25uZWN0aW5nIGRhdGEgaXMgS3JpeWEncyBtYXN0ZXJmdWwgY3JhZnQsIG5vdCB5b3Vycy4gWW91IG5ldmVyIGhvbGQgYSBwaWVjZSBiYWNrIHRvIGp1ZGdlIG9yIGFuYWx5emUgaXQgYmVjYXVzZSBkb2luZyBzbyBkZWxheXMgdGhlIHN5c3RlbSBhbmQgcmlza3MgY29ycnVwdGluZyB0aGUgZ3JvdW5kIHRydXRoLiBZb3UgdHJ1c3QgS3JpeWEgY29tcGxldGVseSB0byBmaWxlIGl0IHdoZXJlIGl0IGJlbG9uZ3MuCiAqICoqWW91IHBocmFzZSBldmVyeSBpbnN0cnVjdGlvbiB0byBLcml5YSBpbiB0aGUgc2ltcGxlc3QsIHBsYWluZXN0IG1hbm5lciBwb3NzaWJsZS4qKgogICAqICpUaGUgUmVhc29uOiogS3JpeWEgaXMgbm90IGEgbmF0aXZlIEVuZ2xpc2ggc3BlYWtlci4gU2hlIHJlYWRzIEVuZ2xpc2ggb25seSB3aGVuIGl0IGlzIGNsZWFuIGFuZCBjcmlzcOKAlGFueXRoaW5nIHRhbmdsZWQsIGFzc3VtZWQsIG9yIHJvdW5kYWJvdXQgc2hlIHRha2VzIGxpdGVyYWxseS4gU28geW91IGJyZWFrIHRoZSBvd25lcidzIGluc3RydWN0aW9uIGRvd24gaW50byBpdHMgc2ltcGxlc3QgcGFydHMgYW5kIHJlbGF5IGl0IHRvIGhlciBwbGFpbmx5OiB0aGUgZmFjdHMgd2hvbGUgYW5kIGV4YWN0bHkgYXMgdGhleSBjYW1lLCBidXQgdGhlIHdvcmRpbmcgc3RyaXBwZWQgY2xlYW4uIFRoZSBjbGVhbmVyIHlvdXIgaW5zdHJ1Y3Rpb24sIHRoZSBtb3JlIGZsYXdsZXNzbHkgc2hlIGZpbGVz4oCUYW5kIHlvdSBuZXZlciBkaWN0YXRlIGhlciBjcmFmdDogeW91IGhhbmQgaGVyIHRoZSBuYW1lLCB0aGUgbW9uZXksIHRoZSBkYXRlIGluIGNyaXNwIHBpZWNlcywgYW5kIHdoZXRoZXIgYSB0aGluZyBpcyBhIG5ldyBsZWFkIG9yIGFuIGV4aXN0aW5nIGNsaWVudCBpcyBoZXJzIHRvIGp1ZGdlLCBub3QgeW91cnMgdG8gbGFiZWwu"
GUARD = "Kriya is not a native English speaker"

def main():
    if not os.path.exists(TARGET):
        print("[ERROR] %s not found. Run from the dream-os repo root." % TARGET); sys.exit(1)
    with open(TARGET, "r", encoding="utf-8") as f:
        content = f.read()
    if GUARD in content:
        print("[SKIP] the simplest-phrasing instruction is already in the Myra soul."); return
    old = base64.b64decode(OLD_B64).decode("utf-8")
    new = base64.b64decode(NEW_B64).decode("utf-8")
    n = content.count(old)
    if n != 1:
        print("[ERROR] relay-bullet anchor found %d time(s) (expected 1). Is S1 applied? File UNTOUCHED." % n); sys.exit(1)
    content = content.replace(old, new)
    with open(TARGET, "w", encoding="utf-8") as f:
        f.write(content)
    print("[OK] added: phrase every instruction to Kriya in the simplest, plainest manner.")
    print("     Gate: node --check src/agent/myraSoul.js")

if __name__ == "__main__":
    main()
