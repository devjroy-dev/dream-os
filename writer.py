#!/usr/bin/env python3
# Token refresh -> Supabase: on 401, refresh the session via
# supabase.auth.refreshSession() instead of the old dream-os /auth/refresh
# (mintSession) endpoint. Same writeSession contract + retry logic untouched.
#   unzip -o pwa-token-refresh-v1.zip && python3 writer.py
import os, sys, base64, json
ROOT = os.getcwd()
def die(m): print("ABORT: " + m); sys.exit(1)
if not os.path.isfile("package.json"): die("run from the dreamos-pwa repo root.")
P = {'old': 'ICAgICAgLy8gU3VwYWJhc2UgdG9rZW4gcmVmcmVzaCBlbmRwb2ludAogICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtBUElfQkFTRX0vYXBpL3YyL3ZlbmRvci9hdXRoL3JlZnJlc2hgLCB7CiAgICAgICAgbWV0aG9kOiAgJ1BPU1QnLAogICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LAogICAgICAgIGJvZHk6ICAgIEpTT04uc3RyaW5naWZ5KHsgcmVmcmVzaF90b2tlbjogc2Vzc2lvbi5yZWZyZXNoX3Rva2VuIH0pLAogICAgICB9KTsKCiAgICAgIGlmICghcmVzLm9rKSByZXR1cm4gZmFsc2U7CgogICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKS5jYXRjaCgoKSA9PiBudWxsKTsKICAgICAgaWYgKCFkYXRhPy5hY2Nlc3NfdG9rZW4pIHJldHVybiBmYWxzZTsK', 'new': 'ICAgICAgLy8gU3VwYWJhc2UgY2xpZW50LXNpZGUgcmVmcmVzaDogZXhjaGFuZ2UgdGhlIHN0b3JlZCByZWZyZXNoX3Rva2VuIGZvciBhCiAgICAgIC8vIGZyZXNoIHNlc3Npb24uIFJlcGxhY2VzIHRoZSBvbGQgZHJlYW0tb3MgL2F1dGgvcmVmcmVzaCAobWludFNlc3Npb24pIHBhdGguCiAgICAgIGNvbnN0IHsgZGF0YTogcmVmcmVzaGVkLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuYXV0aC5yZWZyZXNoU2Vzc2lvbih7CiAgICAgICAgcmVmcmVzaF90b2tlbjogc2Vzc2lvbi5yZWZyZXNoX3Rva2VuLAogICAgICB9KTsKICAgICAgaWYgKGVycm9yIHx8ICFyZWZyZXNoZWQ/LnNlc3Npb24/LmFjY2Vzc190b2tlbikgcmV0dXJuIGZhbHNlOwogICAgICBjb25zdCBkYXRhID0gewogICAgICAgIGFjY2Vzc190b2tlbjogIHJlZnJlc2hlZC5zZXNzaW9uLmFjY2Vzc190b2tlbiwKICAgICAgICByZWZyZXNoX3Rva2VuOiByZWZyZXNoZWQuc2Vzc2lvbi5yZWZyZXNoX3Rva2VuLAogICAgICB9Owo='}
F = os.path.join(ROOT, "lib", "vendor", "api", "_base.ts")
t = open(F, encoding="utf-8").read()
if "supabase.auth.refreshSession" in t:
    print("= _base.ts already uses supabase.auth.refreshSession (idempotent)."); sys.exit(0)
# import the supabase client (after the session-helpers import line)
anchor = "import type { VendorSession } from '@/lib/vendor/session';"
if anchor not in t: die("_base.ts VendorSession import anchor not found.")
if "from '@/lib/supabase'" not in t:
    t = t.replace(anchor, anchor + "\nimport { supabase } from '@/lib/supabase';", 1)
    print("+ _base.ts: supabase client import")
old = base64.b64decode(P["old"]).decode()
new = base64.b64decode(P["new"]).decode()
if old not in t: die("_base.ts refresh fetch block not found verbatim.")
t = t.replace(old, new, 1)
open(F, "w", encoding="utf-8").write(t)
print("+ _base.ts: 401 refresh -> supabase.auth.refreshSession()")
print("\nDone. Commit, push (Vercel redeploys). No new deps.")
