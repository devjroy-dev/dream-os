#!/usr/bin/env python3
# Piece 3-A - GET /binders read hand. Adds src/api/vendor/binderRead.js (flat ledger)
# and mounts it at /binders alongside binderWrite (GET->reader, POST->writer by method).
# Additive, idempotent: existing file with same content SKIPs; missing mount anchor SKIPs.
import base64, sys, os

READ_PATH = "src/api/vendor/binderRead.js"
CORE_PATH = "src/api/vendor/core.js"
READ_SRC  = base64.b64decode("Ly8gc3JjL2FwaS92ZW5kb3IvYmluZGVyUmVhZC5qcwovLyBCaW5kZXIgUkVBRCBlbmRwb2ludCDigJQgdGhlIGZsYXQgbGVkZ2VyIGZvciB0aGUgU3R1ZGlvIExpc3QgKyBob29kLWxpZnQuCi8vCi8vICAgR0VUIC9hcGkvdjIvdmVuZG9yL2JpbmRlcnMvOnZlbmRvcklkICAgICAgICAgIC0+IGxpdmUgbGVkZ2VyIChoaWRkZW49ZmFsc2UpLCBuZXdlc3QgZmlyc3QKLy8gICAgICAgP2luY2x1ZGVfaGlkZGVuPXRydWUgICAgICAgICAgICAgICAgICAgICAgLT4gYWxzbyByZXR1cm4gYXJjaGl2ZWQgYmluZGVycwovLwovLyBSZWFkcyBhcmUgRElSRUNUIChzY29wZWQgdG8gdmVuZG9yX2lkKSwgTk9UIHRocm91Z2ggS3JpeWE6IHRoZSB0aHJvdWdoLUtyaXlhCi8vIGRpc2NpcGxpbmUgZ3VhcmRzIE1VVEFUSU9OUyAoZ3JvdW5kLXRydXRoLWJlZm9yZS13cml0ZSwgdGhlIG1vbmV5IGRvb3IpOyBhIHJlYWQKLy8gaGFzIG5vdGhpbmcgdG8gbXV0YXRlLiBPd25lcnNoaXAgaXMgZW5mb3JjZWQgdHdpY2Ugb3ZlciDigJQgcmVzb2x2ZVZlbmRvciBhc3NlcnRzCi8vIHRoZSBKV1Qgb3ducyA6dmVuZG9ySWQsIGFuZCBldmVyeSBxdWVyeSBpcyAuZXEoJ3ZlbmRvcl9pZCcpIHNjb3BlZCDigJQgc28gYSB2ZW5kb3IKLy8gY2FuIG5ldmVyIHJlYWQgYW5vdGhlcidzIGxlZGdlci4gU2FtZSBmdWxsIGJpbmRlciBzaGFwZSBhcyBjYWJpbmV0LmpzLCBidXQgdGhlCi8vIGxlZGdlciBpcyByZXR1cm5lZCBGTEFULCB3aGVyZSAvY2FiaW5ldCByZXR1cm5zIHRoZSBzYW1lIGJpbmRlcnMgcHJlLXNsaWNlZC4KLy8KLy8gVGhlIHRvb2wgdm9jYWJ1bGFyeSAoa3JpeWFfKikgaXMgbmV2ZXIgZXhwb3NlZCBoZXJlIOKAlCBhIHJlYWQgbmVlZHMgbm8gdG9vbDsgaXQKLy8gaXMgYSBwbGFpbiBzY29wZWQgc2VsZWN0LiBUaGUgZGlzcGxheSBmaXJld2FsbCBpcyB1bmFmZmVjdGVkLgoKJ3VzZSBzdHJpY3QnOwoKY29uc3QgZXhwcmVzcyAgICAgICAgPSByZXF1aXJlKCdleHByZXNzJyk7CmNvbnN0IHJvdXRlciAgICAgICAgID0gZXhwcmVzcy5Sb3V0ZXIoKTsKY29uc3QgcmVxdWlyZUF1dGggICAgPSByZXF1aXJlKCcuLi9taWRkbGV3YXJlL3JlcXVpcmVBdXRoJyk7CmNvbnN0IHJlc29sdmVWZW5kb3IgID0gcmVxdWlyZSgnLi4vbWlkZGxld2FyZS9yZXNvbHZlVmVuZG9yJyk7CgovLyBGdWxsIGJpbmRlciBzaGFwZSAoKyBoaWRkZW4vaGlkZGVuX2F0IHNvIHRoZSBMaXN0IGNhbiBiYWRnZSBhcmNoaXZlZCByb3dzKS4KY29uc3QgQklOREVSX1NFTEVDVCA9CiAgJ2lkLCBjbGllbnQsIGFtb3VudCwgYW1vdW50X3JlY2VpdmVkLCBhbW91bnRfcGVuZGluZywgcGF5bWVudF9zdGF0dXMsICcgKwogICdkaXJlY3Rpb24sIGRhdGUsIHN0YWdlLCBub3RlLCBmb2xsb3d1cF9vbiwgZm9sbG93dXBfbm90ZSwgcmVwZWF0X2V2ZXJ5LCAnICsKICAnZG9jX3JlZiwgcGhvbmUsIHJlYXNvbl9mb3JfYWN0aW9uLCBoaWRkZW4sIGhpZGRlbl9hdCwgY3JlYXRlZF9hdCwgdXBkYXRlZF9hdCc7Cgpjb25zdCBhdXRoID0gW3JlcXVpcmVBdXRoLCByZXNvbHZlVmVuZG9yKHsgcGFyYW1OYW1lOiAndmVuZG9ySWQnIH0pXTsKCi8vIEdFVCAvOnZlbmRvcklkIOKAlCB0aGUgcmF3IGxlZGdlciwgbmV3ZXN0IGZpcnN0Lgpyb3V0ZXIuZ2V0KCcvOnZlbmRvcklkJywgLi4uYXV0aCwgYXN5bmMgKHJlcSwgcmVzKSA9PiB7CiAgY29uc3Qgc3VwYWJhc2UgPSByZXEuYXBwLmxvY2Fscy5zdXBhYmFzZTsKICBjb25zdCB2ZW5kb3JJZCA9IHJlcS52ZW5kb3IuaWQ7CiAgY29uc3QgaW5jbHVkZUhpZGRlbiA9IHJlcS5xdWVyeS5pbmNsdWRlX2hpZGRlbiA9PT0gJ3RydWUnIHx8IHJlcS5xdWVyeS5pbmNsdWRlX2hpZGRlbiA9PT0gJzEnOwoKICBsZXQgcSA9IHN1cGFiYXNlLmZyb20oJ2JpbmRlcnMnKQogICAgLnNlbGVjdChCSU5ERVJfU0VMRUNUKQogICAgLmVxKCd2ZW5kb3JfaWQnLCB2ZW5kb3JJZCkKICAgIC5vcmRlcignY3JlYXRlZF9hdCcsIHsgYXNjZW5kaW5nOiBmYWxzZSB9KTsKICBpZiAoIWluY2x1ZGVIaWRkZW4pIHEgPSBxLmVxKCdoaWRkZW4nLCBmYWxzZSk7CgogIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHE7CiAgaWYgKGVycm9yKSB7CiAgICBjb25zb2xlLmVycm9yKCdbR0VUIC92ZW5kb3IvYmluZGVyc10gcmVhZCBmYWlsZWQ6JywgZXJyb3IubWVzc2FnZSk7CiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oeyBvazogZmFsc2UsIGVycm9yOiAnTG9va3VwIGZhaWxlZC4nIH0pOwogIH0KICBjb25zdCBiaW5kZXJzID0gZGF0YSB8fCBbXTsKICByZXR1cm4gcmVzLmpzb24oeyBvazogdHJ1ZSwgY291bnQ6IGJpbmRlcnMubGVuZ3RoLCBiaW5kZXJzIH0pOwp9KTsKCm1vZHVsZS5leHBvcnRzID0gcm91dGVyOwo=").decode("utf-8")
ANCHOR    = base64.b64decode("cm91dGVyLnVzZSgnL2JpbmRlcnMnLCAgcmVxdWlyZSgnLi9iaW5kZXJXcml0ZScpKTs=").decode("utf-8")
INSERT    = base64.b64decode("cm91dGVyLnVzZSgnL2JpbmRlcnMnLCAgcmVxdWlyZSgnLi9iaW5kZXJXcml0ZScpKTsKcm91dGVyLnVzZSgnL2JpbmRlcnMnLCAgcmVxdWlyZSgnLi9iaW5kZXJSZWFkJykpOw==").decode("utf-8")

applied = skipped = 0

# 1 — write the read router file
if os.path.exists(READ_PATH):
    if open(READ_PATH, encoding="utf-8").read() == READ_SRC:
        print("SKIP  binderRead.js already present and identical."); skipped += 1
    else:
        open(READ_PATH, "w", encoding="utf-8").write(READ_SRC)
        print("OK    binderRead.js overwritten to current version."); applied += 1
else:
    os.makedirs(os.path.dirname(READ_PATH), exist_ok=True)
    open(READ_PATH, "w", encoding="utf-8").write(READ_SRC)
    print("OK    binderRead.js created."); applied += 1

# 2 — mount it in core.js (anchor-guarded)
if not os.path.exists(CORE_PATH):
    print("FATAL: %s not found." % CORE_PATH); sys.exit(1)
core = open(CORE_PATH, encoding="utf-8").read()
if "require('./binderRead')" in core:
    print("SKIP  binderRead already mounted in core.js."); skipped += 1
elif core.count(ANCHOR) == 1:
    open(CORE_PATH, "w", encoding="utf-8").write(core.replace(ANCHOR, INSERT))
    print("OK    binderRead mounted at /binders in core.js."); applied += 1
elif core.count(ANCHOR) == 0:
    print("SKIP  mount anchor NOT FOUND - core.js untouched (no corruption)."); skipped += 1
else:
    print("SKIP  mount anchor found %d times - untouched." % core.count(ANCHOR)); skipped += 1

# verification
checks = [
    ("read router file exists",  os.path.exists(READ_PATH)),
    ("GET route present",        "router.get('/:vendorId'" in open(READ_PATH, encoding="utf-8").read()),
    ("include_hidden handled",   "include_hidden" in open(READ_PATH, encoding="utf-8").read()),
    ("reads direct (no Kriya)",  "executeKriyaTool" not in open(READ_PATH, encoding="utf-8").read()),
    ("mounted in core.js",       "require('./binderRead')" in open(CORE_PATH, encoding="utf-8").read()),
]
print("\n-- verification --")
ok = True
for name, passed in checks:
    print("  %s %s" % ("PASS" if passed else "FAIL", name)); ok = ok and passed
print("\n(%d applied, %d skipped)" % (applied, skipped))
print("ALL CHECKS PASSED" if ok else "SOME CHECKS FAILED - review above")
sys.exit(0 if ok else 2)
