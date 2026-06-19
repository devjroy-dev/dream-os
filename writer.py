#!/usr/bin/env python3
# writer.py — Revert R1: restore the two-agent (Myra -> Kriya) path as the DEFAULT.
# M2 had set the backend default to single-agent manager. The frontend never sends a
# mode, so that made the live PWA run manager. This flips the default back to the
# two-agent path. The manager loop is PARKED, not deleted — it still runs on an explicit
# mode:'manager' (curl/testing), so this is fully reversible. Nothing else changes:
# the runTurn ternary, the firewall, and managerLoop.js all stay. Guarded + idempotent.
import base64, os, sys

TARGET = os.path.join("src", "api", "vendor", "chat.js")
OLD_B64 = "ICAvLyBNb2RlIHNlbGVjdG9yIChwZXIgY29udmVyc2F0aW9uLCBzZW50IHdpdGggdGhlIHR1cm47IGRlZmF1bHQgPSBtYW5hZ2VyKS4gTWFuYWdlcgogIC8vIG1vZGUgcnVucyB0aGUgc2luZ2xlLWFnZW50IGxvb3A7IGV2ZXJ5IG90aGVyIG1vZGUga2VlcHMgdGhlIHR3by1hZ2VudCBwYXRoLgogIGNvbnN0IG1vZGUgPSAodHlwZW9mIGJvZHkubW9kZSA9PT0gJ3N0cmluZycgJiYgYm9keS5tb2RlLnRyaW0oKSkgPyBib2R5Lm1vZGUudHJpbSgpIDogJ21hbmFnZXInOwogIGNvbnN0IHJ1blR1cm4gPSAobW9kZSA9PT0gJ21hbmFnZXInKSA/IHJ1bk1hbmFnZXJUdXJuIDogcnVuTXlyYVR1cm47"
NEW_B64 = "ICAvLyBNb2RlIHNlbGVjdG9yIChwZXIgY29udmVyc2F0aW9uLCBzZW50IHdpdGggdGhlIHR1cm4pLiBERUZBVUxUID0gdGhlIHR3by1hZ2VudCBwYXRoCiAgLy8gKE15cmEgcmVhc29ucyArIHJlbGF5cywgS3JpeWEgZmlsZXMpIOKAlCB0aGUgcmVhc29uaW5nIGNoZWNrcG9pbnQgdGhhdCBrZWVwcyBmaWd1cmVzCiAgLy8gYW5kIGp1ZGdtZW50IGhvbmVzdC4gU2luZ2xlLWFnZW50IG1hbmFnZXIgaXMgUEFSS0VEOiBpdCBydW5zIG9ubHkgb24gYW4gZXhwbGljaXQKICAvLyBtb2RlOidtYW5hZ2VyJywgbmV2ZXIgYXMgdGhlIGV2ZXJ5ZGF5IGZhY2UuCiAgY29uc3QgbW9kZSA9ICh0eXBlb2YgYm9keS5tb2RlID09PSAnc3RyaW5nJyAmJiBib2R5Lm1vZGUudHJpbSgpKSA/IGJvZHkubW9kZS50cmltKCkgOiAndHdvX2FnZW50JzsKICBjb25zdCBydW5UdXJuID0gKG1vZGUgPT09ICdtYW5hZ2VyJykgPyBydW5NYW5hZ2VyVHVybiA6IHJ1bk15cmFUdXJuOw=="
GUARD = "DEFAULT = the two-agent path"

def main():
    if not os.path.exists(TARGET):
        print("[ERROR] %s not found. Run from the dream-os repo root." % TARGET); sys.exit(1)
    with open(TARGET, "r", encoding="utf-8") as f:
        content = f.read()
    if GUARD in content:
        print("[SKIP] default already reverted to the two-agent path."); return
    old = base64.b64decode(OLD_B64).decode("utf-8")
    new = base64.b64decode(NEW_B64).decode("utf-8")
    n = content.count(old)
    if n != 1:
        if "two_agent" in content:
            print("[SKIP] already reverted (no manager-default block found)."); return
        print("[ERROR] mode-default anchor found %d time(s) (expected 1). Is M2 applied? File UNTOUCHED." % n); sys.exit(1)
    content = content.replace(old, new)
    with open(TARGET, "w", encoding="utf-8") as f:
        f.write(content)
    print("[OK] default reverted: the two-agent Myra -> Kriya path is the everyday face again.")
    print("     Manager is parked (explicit mode:'manager' only). Gate: node --check src/api/vendor/chat.js")

if __name__ == "__main__":
    main()
