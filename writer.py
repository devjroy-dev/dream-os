#!/usr/bin/env python3
# Vendor Suit -- generate-invoice (ii): donna_invoice_pdf engine hand + chat-door
# detection. Engine: 1 tool def + array entry + signal case + ATTRIBUTE_ATOMS.
# dream-os: export generateInvoiceForBinder + door detects the signal, generates
# the numbered PDF (idempotent), confirms the NUMBER in chat (download from list).
# REQUIRES build:engine after.  unzip -o vendor-suit-geninvoice-ii-chat-v1.zip && python3 writer.py
import os, sys, base64, json
ROOT = os.getcwd()
def die(m): print("ABORT: " + m); sys.exit(1)
if not os.path.isfile("package.json") or json.load(open("package.json")).get("name") != "dream-os-backend":
    die("run from the dream-os repo root.")
P = {'tooldef': 'ZXhwb3J0IGNvbnN0IERPTk5BX0lOVk9JQ0VfUERGX1RPT0w6IEFudGhyb3BpYy5Ub29sID0gewogIG5hbWU6ICdkb25uYV9pbnZvaWNlX3BkZicsCiAgZGVzY3JpcHRpb246ICJQcm9kdWNlIHRoZSBmb3JtYWwsIG51bWJlcmVkIGludm9pY2UgZG9jdW1lbnQgZm9yIGEgYmluZGVyIOKAlCB0aGUgcHJvcGVyIFBERiB0aGUgY2xpZW50IHJlY2VpdmVzLCBzdGFtcGVkIHdpdGggdGhlIG5leHQgbnVtYmVyIGluIHRoZSBob3VzZSBzZXJpZXMuIFVzZSB0aGlzIHdoZW4gSGFydmV5IGFza3MgZm9yIHRoZSBpbnZvaWNlIGRvY3VtZW50IGl0c2VsZiAodGhlIHRoaW5nIHRvIGhhbmQgdGhlIGNsaWVudCksIG5vdCBtZXJlbHkgdGhlIG1vbmV5IHJlY29yZCBvbiB0aGUgYmluZGVyLiBPbWl0IGJpbmRlcl9pZCB0byBhY3Qgb24gdGhlIGJpbmRlciB5b3UncmUgd29ya2luZzsgZ2l2ZSBiaW5kZXJfaWQgdG8gbmFtZSBhIHNwZWNpZmljIG9uZS4iLAogIGlucHV0X3NjaGVtYTogeyB0eXBlOiAnb2JqZWN0JywgcHJvcGVydGllczogeyBiaW5kZXJfaWQ6IHsgdHlwZTogJ3N0cmluZycgfSB9IH0sCn07Cg==', 'toolcase': 'ICAgIGNhc2UgJ2Rvbm5hX2ludm9pY2VfcGRmJzogewogICAgICBpZiAoIXJpZCkgcmV0dXJuIHsgZGlzcGxheTogJ0VSUk9SOiBkb25uYV9pbnZvaWNlX3BkZiBuZWVkcyBiaW5kZXJfaWQgKHdoaWNoIGJpbmRlciB0byBpbnZvaWNlKS4nIH07CiAgICAgIC8vIFNpZ25hbCBvbmx5IOKAlCB0aGUgaG9zdCBzdGFtcHMgdGhlIG5leHQgbnVtYmVyLCByZW5kZXJzIHRoZSBQREYsIGZpbGVzIGl0LgogICAgICAvLyBEb25uYSdzIGhhbmQgYXNrcyBmb3IgdGhlIGRvY3VtZW50OyB0aGUgbnVtYmVyICsgUERGIHJldHVybiB0aHJvdWdoIHRoZSBkb29yLgogICAgICByZXR1cm4geyBkaXNwbGF5OiBgSW52b2ljZSBkb2N1bWVudCByZXF1ZXN0ZWQgZm9yIHJlY29yZCAke3JpZH0g4oCUIGl0IGlzIGJlaW5nIHByZXBhcmVkIGFuZCB3aWxsIGFwcGVhciBpbiB0aGUgaW52b2ljZXMgbGlzdC5gIH07CiAgICB9Cg==', 'door_old': 'ICAgIGNvbnN0IHJlc3VsdCAgICA9IGF3YWl0IHJ1blR1cm4oeyBhZ2VudElkOiByZXEuYWdlbnRJZCwgbWVzc2FnZSB9KTsKICAgIC8vIENvbnRyYWN0OiB0b29sX2NhbGxzIGlzIG5hbWVzIG9ubHkgKG5vIGludGVybmFsIGlucHV0L3Jlc3VsdCkuIHJlZnJlc2ggdGVsbHMKICAgIC8vIHRoZSBQV0EgdG8gcmVwYWludCB0aGUgY2FiaW5ldCB3aGVuIHRoZSB0dXJuIGFjdHVhbGx5IGZpbGVkIHNvbWV0aGluZy4KICAgIGNvbnN0IHRvb2xOYW1lcyA9IChyZXN1bHQudG9vbF9jYWxscyB8fCBbXSkubWFwKCh0KSA9PiB0Lm5hbWUpOwogICAgcmV0dXJuIHJlcy5qc29uKHsKICAgICAgb2s6IHRydWUsCiAgICAgIHJlcGx5OiByZXN1bHQucmVwbHksCiAgICAgIHRvb2xfY2FsbHM6IHRvb2xOYW1lcywKICAgICAgcmVmcmVzaDogdG9vbE5hbWVzLmxlbmd0aCA+IDAsCiAgICB9KTsK', 'door_new': 'ICAgIGNvbnN0IHJlc3VsdCAgICA9IGF3YWl0IHJ1blR1cm4oeyBhZ2VudElkOiByZXEuYWdlbnRJZCwgbWVzc2FnZSB9KTsKCiAgICAvLyBkb25uYV9pbnZvaWNlX3BkZiBpcyBEb25uYSdzIFNJR05BTCBoYW5kOiB0aGUgZW5naW5lIG9ubHkgZmxhZ3MgaW50ZW50LgogICAgLy8gVGhlIGRvb3IgcHJvZHVjZXMgdGhlIHJlYWwgbnVtYmVyZWQgZG9jdW1lbnQgKGlkZW1wb3RlbnQpIGFuZCBjb25maXJtcyB0aGUKICAgIC8vIE5VTUJFUiBpbiBjaGF0IOKAlCB0aGUgZG93bmxvYWQgbGl2ZXMgaW4gdGhlIGludm9pY2VzIGxpc3QgKG5vIFVSTCBwYXN0ZWQgaGVyZSkuCiAgICBjb25zdCBlbmcgPSByZXEuYXBwLmxvY2Fscy5zdXBhYmFzZS5zY2hlbWEoJ2VuZ2luZScpOwogICAgY29uc3Qgd2FudEludm9pY2UgPSBuZXcgU2V0KCk7CiAgICBmb3IgKGNvbnN0IHRjIG9mIChyZXN1bHQudG9vbF9jYWxscyB8fCBbXSkpIHsKICAgICAgaWYgKHRjLm5hbWUgPT09ICdkb25uYV9pbnZvaWNlX3BkZicgJiYgdGMuaW5wdXQgJiYgdGMuaW5wdXQuYmluZGVyX2lkKSB3YW50SW52b2ljZS5hZGQodGMuaW5wdXQuYmluZGVyX2lkKTsKICAgICAgZm9yIChjb25zdCBkYyBvZiAodGMuZG9ubmFfY2FsbHMgfHwgW10pKSB7CiAgICAgICAgaWYgKGRjLm5hbWUgPT09ICdkb25uYV9pbnZvaWNlX3BkZicgJiYgZGMuaW5wdXQgJiYgZGMuaW5wdXQuYmluZGVyX2lkKSB3YW50SW52b2ljZS5hZGQoZGMuaW5wdXQuYmluZGVyX2lkKTsKICAgICAgfQogICAgfQogICAgY29uc3QgZG9jdW1lbnRzID0gW107CiAgICBmb3IgKGNvbnN0IGJpbmRlcklkIG9mIHdhbnRJbnZvaWNlKSB7CiAgICAgIHRyeSB7CiAgICAgICAgY29uc3QgeyBkYXRhOiBiaW5kZXIgfSA9IGF3YWl0IGVuZy5mcm9tKCdyZWNvcmRzJykKICAgICAgICAgIC5zZWxlY3QoJ2lkLCBjbGllbnQsIHBob25lLCBhbW91bnQsIGFtb3VudF9yZWNlaXZlZCwgbm90ZScpCiAgICAgICAgICAuZXEoJ2FnZW50X2lkJywgcmVxLmFnZW50SWQpLmVxKCdpZCcsIGJpbmRlcklkKS5tYXliZVNpbmdsZSgpOwogICAgICAgIGlmIChiaW5kZXIgJiYgTnVtYmVyKGJpbmRlci5hbW91bnQpID4gMCkgewogICAgICAgICAgY29uc3QgZ2VuID0gYXdhaXQgZ2VuZXJhdGVJbnZvaWNlRm9yQmluZGVyKHJlcS5hcHAubG9jYWxzLnN1cGFiYXNlLCByZXEudmVuZG9yLCBiaW5kZXIpOwogICAgICAgICAgaWYgKGdlbiAmJiBnZW4ub2spIGRvY3VtZW50cy5wdXNoKHsgaW52b2ljZV9udW1iZXI6IGdlbi5pbnZvaWNlX251bWJlciwgcGRmX3VybDogZ2VuLnBkZl91cmwsIGNsaWVudDogYmluZGVyLmNsaWVudCB9KTsKICAgICAgICB9CiAgICAgIH0gY2F0Y2ggKGUpIHsgY29uc29sZS5lcnJvcignW3ZlbmRvci1lIGNoYXQ6ZG9ubmFfaW52b2ljZV9wZGZdJywgZS5tZXNzYWdlKTsgfQogICAgfQoKICAgIGxldCByZXBseSA9IHJlc3VsdC5yZXBseTsKICAgIGlmIChkb2N1bWVudHMubGVuZ3RoKSB7CiAgICAgIHJlcGx5ICs9ICdcblxuJyArIGRvY3VtZW50cy5tYXAoKGQpID0+CiAgICAgICAgYEludm9pY2UgJHtkLmludm9pY2VfbnVtYmVyfSR7ZC5jbGllbnQgPyAnIGZvciAnICsgZC5jbGllbnQgOiAnJ30gaXMgcmVhZHkg4oCUIGZpbmQgaXQgaW4gdGhlIGludm9pY2VzIGxpc3QgdG8gZG93bmxvYWQgb3Igc2VuZC5gCiAgICAgICkuam9pbignXG4nKTsKICAgIH0KCiAgICBjb25zdCB0b29sTmFtZXMgPSAocmVzdWx0LnRvb2xfY2FsbHMgfHwgW10pLm1hcCgodCkgPT4gdC5uYW1lKTsKICAgIHJldHVybiByZXMuanNvbih7CiAgICAgIG9rOiB0cnVlLAogICAgICByZXBseSwKICAgICAgdG9vbF9jYWxsczogdG9vbE5hbWVzLAogICAgICByZWZyZXNoOiB0b29sTmFtZXMubGVuZ3RoID4gMCwKICAgICAgZG9jdW1lbnRzOiBkb2N1bWVudHMubGVuZ3RoID8gZG9jdW1lbnRzLm1hcCgoZCkgPT4gKHsgaW52b2ljZV9udW1iZXI6IGQuaW52b2ljZV9udW1iZXIsIHBkZl91cmw6IGQucGRmX3VybCB9KSkgOiB1bmRlZmluZWQsCiAgICB9KTsK'}
dec = lambda k: base64.b64decode(P[k]).decode()

# ============ ENGINE: recordPrimitives.ts ============
RP = os.path.join(ROOT, "src", "engine", "src", "core", "tools", "recordPrimitives.ts")
t = open(RP, encoding="utf-8").read()
if "donna_invoice_pdf" in t:
    print("= engine already has donna_invoice_pdf (idempotent on recordPrimitives).")
else:
    # 1 — tool def before RECORD_TOOLS
    a1 = "export const RECORD_TOOLS: Anthropic.Tool[] = ["
    if a1 not in t: die("RECORD_TOOLS anchor not found.")
    t = t.replace(a1, dec("tooldef") + "\n" + a1, 1)
    # 2 — add to the array (after the last entry line)
    a2 = "  DONNA_MERGE_TOOL, DONNA_SPLIT_TOOL, DONNA_MONEY_EDIT_TOOL,"
    if a2 not in t: die("RECORD_TOOLS last-line anchor not found.")
    t = t.replace(a2, a2 + "\n  DONNA_INVOICE_PDF_TOOL,", 1)
    # 3 — the signal case before donna_hide
    a3 = "    case 'donna_hide': {"
    if a3 not in t: die("donna_hide case anchor not found.")
    t = t.replace(a3, dec("toolcase") + a3, 1)
    open(RP, "w", encoding="utf-8").write(t)
    print("+ recordPrimitives.ts: tool def + array entry + signal case")

# ============ ENGINE: donna.ts (ATTRIBUTE_ATOMS) ============
DN = os.path.join(ROOT, "src", "engine", "src", "core", "donna.ts")
d = open(DN, encoding="utf-8").read()
if "donna_invoice_pdf" in d:
    print("= donna.ts already lists donna_invoice_pdf (idempotent).")
else:
    a = "    'donna_money', 'donna_date', 'donna_note', 'donna_phone', 'donna_doc', 'donna_stage',"
    if a not in d: die("ATTRIBUTE_ATOMS anchor not found.")
    d = d.replace(a, a + "\n    'donna_invoice_pdf',", 1)
    open(DN, "w", encoding="utf-8").write(d)
    print("+ donna.ts: donna_invoice_pdf added to ATTRIBUTE_ATOMS")

# ============ dream-os: invoices.js export ============
IV = os.path.join(ROOT, "src", "api", "vendor", "invoices.js")
iv = open(IV, encoding="utf-8").read()
if "generateInvoiceForBinder" not in iv: die("generateInvoiceForBinder missing -- apply piece (i) first.")
if "module.exports.generateInvoiceForBinder" in iv:
    print("= invoices.js already exports generateInvoiceForBinder (idempotent).")
else:
    a = "module.exports = router;"
    if a not in iv: die("invoices.js module.exports anchor not found.")
    iv = iv.replace(a, a + "\nmodule.exports.generateInvoiceForBinder = generateInvoiceForBinder;", 1)
    open(IV, "w", encoding="utf-8").write(iv)
    print("+ invoices.js: exported generateInvoiceForBinder")

# ============ dream-os: chat.js detection ============
CH = os.path.join(ROOT, "src", "api", "vendor-engine", "chat.js")
ch = open(CH, encoding="utf-8").read()
if "donna_invoice_pdf" in ch:
    print("= chat.js already wired (idempotent).")
else:
    # add the require at top (after runTurn require)
    rq = "const { runTurn } = require('../../engine/dist/core/loop');"
    if rq not in ch: die("chat.js runTurn require anchor not found.")
    ch = ch.replace(rq, rq + "\nconst { generateInvoiceForBinder } = require('../vendor/invoices');", 1)
    # swap the runTurn->response block
    old, new = dec("door_old"), dec("door_new")
    if old not in ch: die("chat.js runTurn->response block not found verbatim.")
    ch = ch.replace(old, new, 1)
    open(CH, "w", encoding="utf-8").write(ch)
    print("+ chat.js: require + donna_invoice_pdf detection -> generate -> number-only reply")

print("\nDone. npm run build:engine, then restart.")
