#!/usr/bin/env python3
# Piece 5-B.3 (Piece 2) - authored owner-facing summaries for the operator's reads.
# Each tool now returns `summary` (built only from what it computed: counts, span,
# pending totals, event counts) alongside `display`. No UUIDs, no raw dumps. The
# firewall already sends `summary` as operator_action.detail. dream-os = JS; node --check.
import base64, sys, os
def d(s): return base64.b64decode(s).decode("utf-8")
EDITS = [
    ("src/agent/kriyaCalendar.js", "calendar empty summary", "ICAgIGlmIChyb3dzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHsgZGlzcGxheTogYENhbGVuZGFyICR7c3Bhbn06IG5vdGhpbmcgb24gaXQg4oCUIHRoZSBvd25lciBpcyBmcmVlLmAgfTs=", "ICAgIGlmIChyb3dzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHsgZGlzcGxheTogYENhbGVuZGFyICR7c3Bhbn06IG5vdGhpbmcgb24gaXQg4oCUIHRoZSBvd25lciBpcyBmcmVlLmAsIHN1bW1hcnk6ICdjaGVja2VkIHRoZSBjYWxlbmRhciDigJQgbm90aGluZyBzY2hlZHVsZWQsIHRoZSBkYXRlcyBhcmUgZnJlZS4nIH07"),
    ("src/agent/kriyaCalendar.js", "calendar populated summary", "ICAgIHJldHVybiB7IGRpc3BsYXk6IGAke2hlYWR9XG4ke2xpbmVzLmpvaW4oJ1xuJyl9YCB9Ow==", "ICAgIGNvbnN0IGZtdEQgPSAoaXNvKSA9PiBpc28gPyBuZXcgRGF0ZShpc28gKyAnVDAwOjAwOjAwJykudG9Mb2NhbGVEYXRlU3RyaW5nKCdlbi1HQicsIHsgZGF5OiAnbnVtZXJpYycsIG1vbnRoOiAnc2hvcnQnIH0pIDogJ+KApic7CiAgICBjb25zdCBzcGFuTGFiZWwgPSBvbmUgPyBmbXREKG9uZSkgOiBgJHtmbXREKGZyb20pfeKAkyR7Zm10RCh0byl9YDsKICAgIGNvbnN0IGJsb2NrZWRDb3VudCA9IHJvd3MuZmlsdGVyKChlKSA9PiBlLmtpbmQgPT09ICdibG9ja2VkJykubGVuZ3RoOwogICAgY29uc3QgY2FsU3VtbWFyeSA9IGBjaGVja2VkIHRoZSBjYWxlbmRhciDigJQgJHtyb3dzLmxlbmd0aH0gaXRlbSR7cm93cy5sZW5ndGggPT09IDEgPyAnJyA6ICdzJ30sICR7c3BhbkxhYmVsfSR7YmxvY2tlZENvdW50ID8gYDsgJHtibG9ja2VkQ291bnR9IGJsb2NrZWQgZGF5JHtibG9ja2VkQ291bnQgPT09IDEgPyAnJyA6ICdzJ31gIDogJyd9LmA7CiAgICByZXR1cm4geyBkaXNwbGF5OiBgJHtoZWFkfVxuJHtsaW5lcy5qb2luKCdcbicpfWAsIHN1bW1hcnk6IGNhbFN1bW1hcnkgfTs="),
    ("src/agent/kriyaRead.js", "find summary", "ICBpZiAocm93cy5sZW5ndGggPT09IDApIGxpbmVzLnB1c2goJyAgQ2FiaW5ldCBpcyBlbXB0eSDigJQgbm8gYmluZGVycyB5ZXQuJyk7CiAgcmV0dXJuIHsgZGlzcGxheTogbGluZXMuam9pbignXG4nKSB9Ow==", "ICBpZiAocm93cy5sZW5ndGggPT09IDApIGxpbmVzLnB1c2goJyAgQ2FiaW5ldCBpcyBlbXB0eSDigJQgbm8gYmluZGVycyB5ZXQuJyk7CiAgbGV0IGZpbmRTdW1tYXJ5OwogIGlmICh0ZXJtcy5sZW5ndGggJiYgIWZlbGxCYWNrKSBmaW5kU3VtbWFyeSA9IGBzZWFyY2hlZCB0aGUgY2FiaW5ldCDigJQgJHtyb3dzLmxlbmd0aH0gbWF0Y2gke3Jvd3MubGVuZ3RoID09PSAxID8gJycgOiAnZXMnfSBmb3IgIiR7dGVybXMuam9pbignIC8gJyl9Ii5gOwogIGVsc2UgaWYgKGZlbGxCYWNrKSBmaW5kU3VtbWFyeSA9IGBzZWFyY2hlZCB0aGUgY2FiaW5ldCDigJQgbm90aGluZyBtYXRjaGVkICIke3Rlcm1zLmpvaW4oJyAvICcpfSIuYDsKICBlbHNlIGZpbmRTdW1tYXJ5ID0gYHNlYXJjaGVkIHRoZSBjYWJpbmV0IOKAlCAke3Jvd3MubGVuZ3RofSByZWNlbnQgYmluZGVyJHtyb3dzLmxlbmd0aCA9PT0gMSA/ICcnIDogJ3MnfS5gOwogIHJldHVybiB7IGRpc3BsYXk6IGxpbmVzLmpvaW4oJ1xuJyksIHN1bW1hcnk6IGZpbmRTdW1tYXJ5IH07"),
    ("src/agent/kriyaRead.js", "tally summary", "ICBpZiAocm93cy5sZW5ndGggPT09IDApIGxpbmVzLnB1c2goJyAgTm8gYmluZGVycyBtYXRjaCB0aGlzIHNsaWNlLicpOwogIHJldHVybiB7IGRpc3BsYXk6IGxpbmVzLmpvaW4oJ1xuJykgfTs=", "ICBpZiAocm93cy5sZW5ndGggPT09IDApIGxpbmVzLnB1c2goJyAgTm8gYmluZGVycyBtYXRjaCB0aGlzIHNsaWNlLicpOwogIGNvbnN0IHRhbGx5U3VtbWFyeSA9IGB0YWxsaWVkIHRoZSBib29rcyDigJQgJHtyb3dzLmxlbmd0aH0gYmluZGVyJHtyb3dzLmxlbmd0aCA9PT0gMSA/ICcnIDogJ3MnfSR7c3VtUGVuZGluZyA+IDAgPyBgLCBScyAke051bWJlcihzdW1QZW5kaW5nKS50b0xvY2FsZVN0cmluZygnZW4tSU4nKX0gcGVuZGluZ2AgOiAnJ30uYDsKICByZXR1cm4geyBkaXNwbGF5OiBsaW5lcy5qb2luKCdcbicpLCBzdW1tYXJ5OiB0YWxseVN1bW1hcnkgfTs="),
    ("src/agent/kriyaRead.js", "history summary", "ICAgIGxpbmVzLnB1c2goJyAgd3JpdGVzOiBubyBldmVudCBsb2cgb24gdGhpcyBiaW5kZXIgeWV0LicpOwogIH0KICByZXR1cm4geyBkaXNwbGF5OiBsaW5lcy5qb2luKCdcbicpIH07", "ICAgIGxpbmVzLnB1c2goJyAgd3JpdGVzOiBubyBldmVudCBsb2cgb24gdGhpcyBiaW5kZXIgeWV0LicpOwogIH0KICBjb25zdCBoaXN0UGVuZGluZyA9IHIuYW1vdW50X3BlbmRpbmcgPyBgUnMgJHtOdW1iZXIoci5hbW91bnRfcGVuZGluZykudG9Mb2NhbGVTdHJpbmcoJ2VuLUlOJyl9IHBlbmRpbmcsIGAgOiAnJzsKICBjb25zdCBoaXN0U3VtbWFyeSA9IGBvcGVuZWQgJHtyLmNsaWVudCA/IGAke3IuY2xpZW50fSdzIGJpbmRlcmAgOiAndGhlIGJpbmRlcid9IOKAlCAke2hpc3RQZW5kaW5nfSR7ZXZlbnRzLmxlbmd0aH0gd3JpdGUke2V2ZW50cy5sZW5ndGggPT09IDEgPyAnJyA6ICdzJ30gb24gcmVjb3JkLmA7CiAgcmV0dXJuIHsgZGlzcGxheTogbGluZXMuam9pbignXG4nKSwgc3VtbWFyeTogaGlzdFN1bW1hcnkgfTs=")
]
applied = skipped = 0
for path, label, o_b64, n_b64 in EDITS:
    if not os.path.exists(path):
        print("SKIP  [%s] %s not found." % (label, path)); skipped += 1; continue
    text = open(path, encoding="utf-8").read()
    old, new = d(o_b64), d(n_b64)
    if new in text:
        print("SKIP  [%s] already applied." % label); skipped += 1; continue
    c = text.count(old)
    if c == 1:
        open(path, "w", encoding="utf-8").write(text.replace(old, new)); applied += 1; print("OK    [%s]" % label)
    elif c == 0: print("SKIP  [%s] anchor NOT FOUND." % label); skipped += 1
    else: print("SKIP  [%s] anchor x%d." % (label, c)); skipped += 1
cal = open("src/agent/kriyaCalendar.js", encoding="utf-8").read()
rd  = open("src/agent/kriyaRead.js", encoding="utf-8").read()
checks = [
  ("calendar empty summary",  "nothing scheduled, the dates are free." in cal),
  ("calendar populated summary","checked the calendar \u2014 ${rows.length} item" in cal),
  ("find summary",            "searched the cabinet \u2014 ${rows.length} match" in rd),
  ("tally summary",           "tallied the books \u2014 ${rows.length} binder" in rd),
  ("history summary",         "opened ${r.client ? `${r.client}'s binder`" in rd),
  ("grouped Rs (en-IN)",      "toLocaleString('en-IN')" in rd),
  ("no UUIDs in summaries",   "${e.id}" not in cal.split("calSummary")[1].split("return")[0] if "calSummary" in cal else True),
]
print(chr(10) + "-- verification --")
allok = True
for n,p in checks: print("  %s %s" % ("PASS" if p else "FAIL", n)); allok = allok and p
print(chr(10) + "(%d applied, %d skipped)" % (applied, skipped))
print("ALL CHECKS PASSED" if allok else "SOME CHECKS FAILED")
sys.exit(0 if allok else 2)
