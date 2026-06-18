#!/usr/bin/env python3
# Piece 3-B - Glass-box firewall (server-side). Adds src/agent/displayFirewall.js
# and routes the vendor SSE wire through it: raw kriya_* names never cross to a
# client (not in a field, an event-type, or result prose). DB + /chat JSON stay RAW.
#   chat.js edits (SSE path only):
#     1. require the firewall module
#     2. onEvent: send(e)/text_delta passthrough  ->  send(translateBeat(e))
#     3. done.tool_calls: raw names  ->  safe kinds (read/write/calendar)
# Additive + idempotent. JSON path, DB persistence, myraLoop all untouched.
import base64, sys, os
def d(s): return base64.b64decode(s).decode("utf-8")

FW_PATH = "src/agent/displayFirewall.js"
FW_SRC  = d("Ly8gc3JjL2FnZW50L2Rpc3BsYXlGaXJld2FsbC5qcwovLyBUSEUgUFVCTElDQVRJT04gRklSRVdBTEwgKHNlcnZlci1zaWRlKS4gRXZlcnkgYmVhdCB0aGF0IGxlYXZlcyB0aGUgdmVuZG9yIFNTRQovLyB3aXJlIHBhc3NlcyB0aHJvdWdoIHRyYW5zbGF0ZUJlYXQoKSBmaXJzdCwgc28gdGhlIG9wZXJhdG9yJ3MgbmFtZSAoS3JpeWEpIGFuZAovLyB0aGUgcmF3IHRvb2wgdm9jYWJ1bGFyeSAoa3JpeWFfKikgTkVWRVIgY3Jvc3MgdG8gYSBjbGllbnQgLS0gbm90IGluIGEgZmllbGQsIG5vdAovLyBpbiBhbiBldmVudC10eXBlIHN0cmluZywgbm90IGluIHJlc3VsdCBwcm9zZS4gVGhlIERCIGFuZCB0aGUgL2NoYXQgSlNPTiBwYXRoCi8vIHN0YXkgUkFXIChob25lc3QgZW5naW5lZXJpbmcgcmVjb3JkICsgZGV2L2V2YWwgZGVidWdnaW5nKTsgb25seSB0aGlzIHB1YmxpYwovLyBzdXJmYWNlIGlzIHRyYW5zbGF0ZWQuIE1pcnJvcnMgZHJlYW1haSdzIGRpc3BsYXlEaWN0aW9uYXJ5LCBhZGFwdGVkIHRvIFREVzoKLy8gdGhlIE1BTkFHRVIgKE15cmEpIGlzIHRoZSBmYWNlIGFuZCBpcyBTSE9XTjsgb25seSB0aGUgT1BFUkFUT1IgKEtyaXlhKSBpcyBoaWRkZW4uCgondXNlIHN0cmljdCc7Cgpjb25zdCB7IEtSSVlBX1JFQURfTkFNRVMgfSAgICAgPSByZXF1aXJlKCcuL2tyaXlhUmVhZCcpOwpjb25zdCB7IEtSSVlBX0NBTEVOREFSX05BTUVTIH0gPSByZXF1aXJlKCcuL2tyaXlhQ2FsZW5kYXInKTsKCi8vIEEgaGFuZCdzIGNhdGVnb3J5IC0tIG5vbi1zZW5zaXRpdmUgKHJlYWQvd3JpdGUvY2FsZW5kYXIgcmV2ZWFscyBubyBhcmNoaXRlY3R1cmUpLAovLyBzbyB0aGUgc3VyZmFjZSBjYW4gc2F5ICJzZWFyY2hlZCIgdnMgImZpbGVkIiB3aXRob3V0IGV2ZXIgc2VlaW5nIGEgdG9vbCBuYW1lLgpmdW5jdGlvbiBraW5kT2YobmFtZSkgewogIGlmIChLUklZQV9SRUFEX05BTUVTLmhhcyhuYW1lKSkgICAgIHJldHVybiAncmVhZCc7CiAgaWYgKEtSSVlBX0NBTEVOREFSX05BTUVTLmhhcyhuYW1lKSkgcmV0dXJuICdjYWxlbmRhcic7CiAgcmV0dXJuICd3cml0ZSc7Cn0KCi8vIEJvZHkgc2NydWIgLS0gY29sbGFwc2UgdGhlIG9wZXJhdG9yJ3MgbmFtZSArIHRvb2wgdG9rZW5zIHdoZXJldmVyIHRoZXkgYXBwZWFyIGluCi8vIGRpc3BsYXllZCB0ZXh0LiBNeXJhICh0aGUgZmFjZSkgaXMgZGVsaWJlcmF0ZWx5IE5PVCBzY3J1YmJlZC4KY29uc3QgU0NSVUJTID0gWwogIFsvXGJrcml5YV9bYS16X10rXGIvZ2ksICdvcGVyYXRvciB0b29sJ10sCiAgWy9cYktyaXlhXGIvZywgJ09wZXJhdG9yJ10sCiAgWy9cYmtyaXlhXGIvZywgJ09wZXJhdG9yJ10sCl07CmZ1bmN0aW9uIHNjcnViKHRleHQpIHsKICBpZiAoIXRleHQpIHJldHVybiAnJzsKICBsZXQgb3V0ID0gU3RyaW5nKHRleHQpOwogIGZvciAoY29uc3QgW3JlLCByZXBdIG9mIFNDUlVCUykgb3V0ID0gb3V0LnJlcGxhY2UocmUsIHJlcCk7CiAgcmV0dXJuIG91dDsKfQoKLy8gVHJhbnNsYXRlIG9uZSByYXcgZW5naW5lIGJlYXQgaW50byBpdHMgc2FmZSBwdWJsaWMgYmVhdC4gUmV0dXJucyBudWxsIHRvIGRyb3AuCmZ1bmN0aW9uIHRyYW5zbGF0ZUJlYXQoZSkgewogIGlmICghZSB8fCAhZS50eXBlKSByZXR1cm4gbnVsbDsKICBzd2l0Y2ggKGUudHlwZSkgewogICAgY2FzZSAnbXlyYV90b2tlbic6CiAgICAgIC8vIFRoZSBtYW5hZ2VyJ3MgcHJvc2UsIHN0cmVhbWVkIGxpdmUuIEhlciBzb3VsIGhpZGVzIHRoZSBvcGVyYXRvciwgc28gaGVyCiAgICAgIC8vIG93biB3b3JkcyBuZXZlciBuYW1lIGl0OyBrZXB0IGFzIHRleHRfZGVsdGEgKHRoZSBsaXZlIHdpcmUgY29udHJhY3QpLgogICAgICByZXR1cm4geyB0eXBlOiAndGV4dF9kZWx0YScsIHRleHQ6IGUudGV4dCB9OwogICAgY2FzZSAnZGlzcGF0Y2gnOgogICAgICByZXR1cm4geyB0eXBlOiAnaGFuZG9mZicsIGZyb206ICdtYW5hZ2VyJywgdG86ICdvcGVyYXRvcicsIG1lc3NhZ2U6IHNjcnViKGUubWVzc2FnZSkgfTsKICAgIGNhc2UgJ2tyaXlhX2FjdGlvbic6CiAgICAgIC8vIE5hbWUgRFJPUFBFRC4ga2luZCAocmVhZC93cml0ZS9jYWxlbmRhcikgKyBzY3J1YmJlZCByZXN1bHQgb25seS4KICAgICAgcmV0dXJuIHsgdHlwZTogJ29wZXJhdG9yX2FjdGlvbicsIGtpbmQ6IGtpbmRPZihlLm5hbWUpLCBkZXRhaWw6IHNjcnViKGUucmVzdWx0KSB9OwogICAgY2FzZSAna3JpeWFfcmVwb3J0JzoKICAgICAgcmV0dXJuIHsgdHlwZTogJ29wZXJhdG9yX3JlcG9ydCcsIG1lc3NhZ2U6IHNjcnViKGUubWVzc2FnZSkgfTsKICAgIGNhc2UgJ2Fuc3dlcic6CiAgICAgIHJldHVybiB7IHR5cGU6ICdhbnN3ZXInLCByZXBseTogc2NydWIoZS5yZXBseSkgfTsKICAgIGNhc2UgJ3RoaW5raW5nJzoKICAgICAgcmV0dXJuIHsgdHlwZTogJ3RoaW5raW5nJyB9OwogICAgZGVmYXVsdDogewogICAgICAvLyBVbmtub3duIGJlYXQgLS0gcGFzcyB0aHJvdWdoIGJ1dCBzY3J1YiBldmVyeSBzdHJpbmcgZmllbGQgZGVmZW5zaXZlbHkuCiAgICAgIGNvbnN0IHNhZmUgPSB7fTsKICAgICAgZm9yIChjb25zdCBrIG9mIE9iamVjdC5rZXlzKGUpKSBzYWZlW2tdID0gdHlwZW9mIGVba10gPT09ICdzdHJpbmcnID8gc2NydWIoZVtrXSkgOiBlW2tdOwogICAgICByZXR1cm4gc2FmZTsKICAgIH0KICB9Cn0KCi8vIGRvbmUudG9vbF9jYWxscyB1c2VkIHRvIGNhcnJ5IHJhdyBrcml5YV8qIG5hbWVzLiBSZXBsYWNlIHdpdGggc2FmZSBraW5kcy4KZnVuY3Rpb24gc2FmZVN0ZXBLaW5kcyh0b29sQ2FsbHMpIHsKICBpZiAoIUFycmF5LmlzQXJyYXkodG9vbENhbGxzKSkgcmV0dXJuIFtdOwogIHJldHVybiB0b29sQ2FsbHMubWFwKCh0YykgPT4ga2luZE9mKHRjICYmIHRjLm5hbWUpKS5maWx0ZXIoQm9vbGVhbik7Cn0KCm1vZHVsZS5leHBvcnRzID0geyBzY3J1YiwgdHJhbnNsYXRlQmVhdCwgc2FmZVN0ZXBLaW5kcywga2luZE9mIH07Cg==")
CHAT    = "src/api/vendor/chat.js"
EDITS = [
    ("require firewall",        d("Y29uc3QgeyBydW5NeXJhVHVybiB9ID0gcmVxdWlyZSgnLi4vLi4vYWdlbnQvbXlyYUxvb3AnKTs="),  d("Y29uc3QgeyBydW5NeXJhVHVybiB9ID0gcmVxdWlyZSgnLi4vLi4vYWdlbnQvbXlyYUxvb3AnKTsKY29uc3QgeyB0cmFuc2xhdGVCZWF0LCBzYWZlU3RlcEtpbmRzIH0gPSByZXF1aXJlKCcuLi8uLi9hZ2VudC9kaXNwbGF5RmlyZXdhbGwnKTs=")),
    ("route beats via firewall",d("ICAgICAgICAgIGlmIChlLnR5cGUgPT09ICdteXJhX3Rva2VuJykgc2VuZCh7IHR5cGU6ICd0ZXh0X2RlbHRhJywgdGV4dDogZS50ZXh0IH0pOwogICAgICAgICAgZWxzZSBzZW5kKGUpOw=="),   d("ICAgICAgICAgIGNvbnN0IHNhZmUgPSB0cmFuc2xhdGVCZWF0KGUpOwogICAgICAgICAgaWYgKHNhZmUpIHNlbmQoc2FmZSk7")),
    ("neutralize done.tool_calls", d("ICAgICAgY29uc3QgZG9uZVBheWxvYWQgPSB7IHR5cGU6ICdkb25lJywgdG9vbF9jYWxsczogdG9vbENhbGxOYW1lcyB9Ow=="), d("ICAgICAgY29uc3QgZG9uZVBheWxvYWQgPSB7IHR5cGU6ICdkb25lJywgdG9vbF9jYWxsczogc2FmZVN0ZXBLaW5kcyhyZXN1bHQudG9vbENhbGxzKSB9Ow==")),
]

applied = skipped = 0

# 1 - firewall module
if os.path.exists(FW_PATH) and open(FW_PATH,encoding="utf-8").read()==FW_SRC:
    print("SKIP  displayFirewall.js already present and identical."); skipped+=1
else:
    os.makedirs(os.path.dirname(FW_PATH), exist_ok=True)
    open(FW_PATH,"w",encoding="utf-8").write(FW_SRC)
    print("OK    displayFirewall.js written."); applied+=1

# 2 - chat.js edits
if not os.path.exists(CHAT):
    print("FATAL: %s not found." % CHAT); sys.exit(1)
text = open(CHAT,encoding="utf-8").read()
for label, old, new in EDITS:
    if new in text:
        print("SKIP  [%s] already applied." % label); skipped+=1; continue
    c = text.count(old)
    if c==1: text=text.replace(old,new); applied+=1; print("OK    [%s] applied." % label)
    elif c==0: print("SKIP  [%s] anchor NOT FOUND - untouched." % label); skipped+=1
    else: print("SKIP  [%s] anchor x%d - untouched." % (label,c)); skipped+=1
open(CHAT,"w",encoding="utf-8").write(text)

# verification
fw = open(FW_PATH,encoding="utf-8").read()
ch = open(CHAT,encoding="utf-8").read()
checks = [
    ("firewall exports translateBeat", "module.exports" in fw and "translateBeat" in fw),
    ("kriya tokens scrubbed",          "operator tool" in fw and "kriya_" in fw),
    ("firewall doc: Myra shown, Kriya hidden", "is the face and is SHOWN" in fw),
    ("chat requires firewall",         "require('../../agent/displayFirewall')" in ch),
    ("beats routed via translateBeat", "send(translateBeat(e))" in ch or "translateBeat(e)" in ch),
    ("done uses safe kinds",           "safeStepKinds(result.toolCalls)" in ch),
    ("raw send(e) gone from SSE",      "          else send(e);" not in ch),
    ("DB persist still raw",           "tool_calls:      result.toolCalls || []" in ch),
    ("JSON path untouched",            "return res.json(responseBody);" in ch),
]
print("\n-- verification --")
ok=True
for n,p in checks: print("  %s %s" % ("PASS" if p else "FAIL", n)); ok=ok and p
print("\n(%d applied, %d skipped)" % (applied,skipped))
print("ALL CHECKS PASSED" if ok else "SOME CHECKS FAILED - review")
sys.exit(0 if ok else 2)
