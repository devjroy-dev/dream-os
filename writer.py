#!/usr/bin/env python3
# Piece 2-B - Cabinet read softened. ONE anchor-guarded, idempotent replacement of
# the slice block in src/api/vendor/cabinet.js:
#   clients : exact stage=='client'  ->  soft: stage CONTAINS a conversion word
#             (client/booked/confirmed/signed/advance/paid), read off STAGE only,
#             never inferred from money.
#   leads   : exact stage=='lead'    ->  catch-all: every non-client binder that
#             isn't an expense (direction!='out'), carrying its own stage as status.
#             Nothing falls through.
#   booked  : kind denylist          ->  allowlist of commitment kinds; 'call' no
#             longer leaks in. blocked/reminder/task stay out as before.
#   paid / owed / reminders : UNCHANGED.
# Safe to re-run: already-applied SKIPs; missing anchor SKIPs loudly, no corruption.
import base64, sys, os
PATH = "src/api/vendor/cabinet.js"
OLD = base64.b64decode("ICAvLyDilIDilIAgQmluZGVyIHNsaWNlcyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIAKICBjb25zdCBjbGllbnRzID0gYWxsQmluZGVycy5maWx0ZXIoYiA9PiAoYi5zdGFnZSB8fCAnJykudG9Mb3dlckNhc2UoKSA9PT0gJ2NsaWVudCcpOwogIGNvbnN0IGxlYWRzICAgPSBhbGxCaW5kZXJzLmZpbHRlcihiID0+IChiLnN0YWdlIHx8ICcnKS50b0xvd2VyQ2FzZSgpID09PSAnbGVhZCcpOwogIGNvbnN0IHBhaWQgICAgPSBhbGxCaW5kZXJzLmZpbHRlcihiID0+IE51bWJlcihiLmFtb3VudF9yZWNlaXZlZCkgPiAwKTsKICBjb25zdCBvd2VkICAgID0gYWxsQmluZGVycy5maWx0ZXIoYiA9PiBOdW1iZXIoYi5hbW91bnRfcGVuZGluZykgID4gMCk7CgogIC8vIOKUgOKUgCBDYWxlbmRhciBzbGljZXMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSACiAgLy8gQm9va2VkID0gcmVhbCBjb21taXRtZW50cyBnb2luZyBmb3J3YXJkIChleGNsdWRlIHJlbWluZGVycy90YXNrcy9ibG9ja2VkKS4KICBjb25zdCBSRU1JTkRFUl9LSU5EUyA9IFsncmVtaW5kZXInLCAndGFzayddOwogIGNvbnN0IGJvb2tlZCA9IGFsbEV2ZW50cy5maWx0ZXIoZSA9PgogICAgZS5ldmVudF9kYXRlICYmIGUuZXZlbnRfZGF0ZSA+PSB0b2RheSAmJgogICAgZS5raW5kICE9PSAnYmxvY2tlZCcgJiYgIVJFTUlOREVSX0tJTkRTLmluY2x1ZGVzKGUua2luZCkKICApOwoKICAvLyBSZW1pbmRlcnMgJiB0YXNrcyA9IGNhbGVuZGFyIHJlbWluZGVycy90YXNrcyArIGFueSBiaW5kZXIgY2FycnlpbmcgYSBmb2xsb3d1cC4KICBjb25zdCByZW1pbmRlckV2ZW50cyA9IGFsbEV2ZW50cwogICAgLmZpbHRlcihlID0+IFJFTUlOREVSX0tJTkRTLmluY2x1ZGVzKGUua2luZCkpCiAgICAubWFwKGUgPT4gKHsgc291cmNlOiAnZXZlbnQnLCAuLi5lIH0pKTsKICBjb25zdCByZW1pbmRlckJpbmRlcnMgPSBhbGxCaW5kZXJzCiAgICAuZmlsdGVyKGIgPT4gYi5mb2xsb3d1cF9vbikKICAgIC5tYXAoYiA9PiAoeyBzb3VyY2U6ICdiaW5kZXInLCBpZDogYi5pZCwgY2xpZW50OiBiLmNsaWVudCwKICAgICAgICAgICAgICAgICBmb2xsb3d1cF9vbjogYi5mb2xsb3d1cF9vbiwgZm9sbG93dXBfbm90ZTogYi5mb2xsb3d1cF9ub3RlLCBiaW5kZXI6IGIgfSkpOwogIGNvbnN0IHJlbWluZGVycyA9IFsuLi5yZW1pbmRlckV2ZW50cywgLi4ucmVtaW5kZXJCaW5kZXJzXTs=").decode("utf-8")
NEW = base64.b64decode("ICAvLyDilIDilIAgQmluZGVyIHNsaWNlcyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIAKICAvLyBTdGFnZSBpcyBmcmVlIHRleHQgKHRoZSBvd25lcidzIHdvcmQpIOKAlCB3ZSBuZXZlciBtYXRjaCBpdCBleGFjdGx5LiBBIGJpbmRlciBpcyBhCiAgLy8gQ0xJRU5UIHdoZW4gaXRzIHN0YWdlIGNhcnJpZXMgYSBjb252ZXJzaW9uIHdvcmQgKGNsaWVudC9ib29rZWQvY29uZmlybWVkL3NpZ25lZC8KICAvLyBhZHZhbmNlL3BhaWQpLCByZWFkIG9mZiB0aGUgU1RBR0UgdGhlIG93bmVyIHNldCBhbmQgbmV2ZXIgaW5mZXJyZWQgZnJvbSB0aGUgbW9uZXkKICAvLyBjb2x1bW5zIChhIHBhaWQgYmluZGVyIHRoZSBvd25lciBzdGlsbCBjYWxscyBhIGxlYWQgc3RheXMgYSBsZWFkOyBwYXltZW50IGRvZXMgbm90CiAgLy8gcHJvbW90ZSkuIEV2ZXJ5dGhpbmcgZWxzZSBpbmJvdW5kIGlzIGEgTEVBRCDigJQgdGhlIGNhdGNoLWFsbCwgc28gbm8gc3RhZ2UgZXZlciBmYWxscwogIC8vIHRocm91Z2gg4oCUIGNhcnJ5aW5nIGl0cyBvd24gc3RhZ2UgYXMgaXRzIHN0YXR1cy4gRXhwZW5zZXMgKGRpcmVjdGlvbj0nb3V0JykgYXJlIG5laXRoZXIuCiAgY29uc3QgQ0xJRU5UX1NUQUdFX1dPUkRTID0gWydjbGllbnQnLCAnYm9va2VkJywgJ2NvbmZpcm1lZCcsICdzaWduZWQnLCAnYWR2YW5jZScsICdwYWlkJ107CiAgY29uc3QgaXNDbGllbnRTdGFnZSA9IChiKSA9PiB7CiAgICBjb25zdCBzID0gKGIuc3RhZ2UgfHwgJycpLnRvTG93ZXJDYXNlKCk7CiAgICByZXR1cm4gQ0xJRU5UX1NUQUdFX1dPUkRTLnNvbWUodyA9PiBzLmluY2x1ZGVzKHcpKTsKICB9OwogIGNvbnN0IGNsaWVudHMgPSBhbGxCaW5kZXJzLmZpbHRlcihpc0NsaWVudFN0YWdlKTsKICBjb25zdCBsZWFkcyAgID0gYWxsQmluZGVycy5maWx0ZXIoYiA9PiAhaXNDbGllbnRTdGFnZShiKSAmJiAoYi5kaXJlY3Rpb24gfHwgJycpLnRvTG93ZXJDYXNlKCkgIT09ICdvdXQnKTsKICBjb25zdCBwYWlkICAgID0gYWxsQmluZGVycy5maWx0ZXIoYiA9PiBOdW1iZXIoYi5hbW91bnRfcmVjZWl2ZWQpID4gMCk7CiAgY29uc3Qgb3dlZCAgICA9IGFsbEJpbmRlcnMuZmlsdGVyKGIgPT4gTnVtYmVyKGIuYW1vdW50X3BlbmRpbmcpICA+IDApOwoKICAvLyDilIDilIAgQ2FsZW5kYXIgc2xpY2VzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgAogIC8vIEJvb2tlZCA9IHJlYWwgY29tbWl0bWVudHMgZ29pbmcgZm9yd2FyZC4gQW4gQUxMT1dMSVNUIG9mIGNvbW1pdG1lbnQga2luZHMsIG5vdCBhCiAgLy8gZGVueWxpc3Qg4oCUIHNvICdjYWxsJyAoYW5kIGFueXRoaW5nIHRoYXQgaXNuJ3QgYSB0cnVlIGJvb2tpbmcpIG5ldmVyIGxlYWtzIGluLgogIGNvbnN0IEJPT0tFRF9LSU5EUyA9IFsnc2hvb3QnLCAnbWVldGluZycsICdyZWNjZScsICdmaXR0aW5nJywgJ3RyaWFsJywgJ2ZhbWlseScsICdjZXJlbW9ueScsICdzb2NpYWwnLCAnb3RoZXInXTsKICBjb25zdCBib29rZWQgPSBhbGxFdmVudHMuZmlsdGVyKGUgPT4KICAgIGUuZXZlbnRfZGF0ZSAmJiBlLmV2ZW50X2RhdGUgPj0gdG9kYXkgJiYgQk9PS0VEX0tJTkRTLmluY2x1ZGVzKGUua2luZCkKICApOwoKICAvLyBSZW1pbmRlcnMgJiB0YXNrcyA9IGNhbGVuZGFyIHJlbWluZGVycy90YXNrcyArIGFueSBiaW5kZXIgY2FycnlpbmcgYSBmb2xsb3d1cC4KICBjb25zdCBSRU1JTkRFUl9LSU5EUyA9IFsncmVtaW5kZXInLCAndGFzayddOwogIGNvbnN0IHJlbWluZGVyRXZlbnRzID0gYWxsRXZlbnRzCiAgICAuZmlsdGVyKGUgPT4gUkVNSU5ERVJfS0lORFMuaW5jbHVkZXMoZS5raW5kKSkKICAgIC5tYXAoZSA9PiAoeyBzb3VyY2U6ICdldmVudCcsIC4uLmUgfSkpOwogIGNvbnN0IHJlbWluZGVyQmluZGVycyA9IGFsbEJpbmRlcnMKICAgIC5maWx0ZXIoYiA9PiBiLmZvbGxvd3VwX29uKQogICAgLm1hcChiID0+ICh7IHNvdXJjZTogJ2JpbmRlcicsIGlkOiBiLmlkLCBjbGllbnQ6IGIuY2xpZW50LAogICAgICAgICAgICAgICAgIGZvbGxvd3VwX29uOiBiLmZvbGxvd3VwX29uLCBmb2xsb3d1cF9ub3RlOiBiLmZvbGxvd3VwX25vdGUsIGJpbmRlcjogYiB9KSk7CiAgY29uc3QgcmVtaW5kZXJzID0gWy4uLnJlbWluZGVyRXZlbnRzLCAuLi5yZW1pbmRlckJpbmRlcnNdOw==").decode("utf-8")
if not os.path.exists(PATH):
    print("FATAL: %s not found. Run from the dream-os repo root." % PATH); sys.exit(1)
text = open(PATH, encoding="utf-8").read()
if NEW in text:
    print("SKIP  slice block already softened.")
elif text.count(OLD) == 1:
    open(PATH, "w", encoding="utf-8").write(text.replace(OLD, NEW))
    print("OK    slice block replaced (soft clients / catch-all leads / booked allowlist).")
elif text.count(OLD) == 0:
    print("SKIP  anchor NOT FOUND - left untouched (no corruption)."); 
else:
    print("SKIP  anchor found %d times (expected 1) - left untouched." % text.count(OLD))
final = open(PATH, encoding="utf-8").read()
checks = [
    ("soft client matcher present",   "CLIENT_STAGE_WORDS" in final and "isClientStage" in final),
    ("leads is catch-all",            "!isClientStage(b) && (b.direction" in final),
    ("booked is an allowlist",        "BOOKED_KINDS" in final),
    ("'call' excluded from booked",   "BOOKED_KINDS = ['shoot', 'meeting'" in final),
    ("old exact client-match GONE",   "=== 'client'" not in final),
    ("old exact lead-match GONE",     "=== 'lead'" not in final),
    ("old kind-denylist GONE",        "e.kind !== 'blocked'" not in final),
    ("paid/owed untouched",           "Number(b.amount_received) > 0" in final and "Number(b.amount_pending)  > 0" in final),
]
print("\n-- verification --")
ok = True
for name, passed in checks:
    print("  %s %s" % ("PASS" if passed else "FAIL", name)); ok = ok and passed
print("\nALL CHECKS PASSED" if ok else "\nSOME CHECKS FAILED - review above")
sys.exit(0 if ok else 2)
