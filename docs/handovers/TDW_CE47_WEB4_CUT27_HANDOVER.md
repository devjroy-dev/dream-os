# TDW · CE-47 · WEB-4 · CUT 27 HANDOVER · the register's record for 0219 (dream-os)

Cut at dream-os `bcdb364`, 8 October 2026, for server train 13. This is its own small cut, so that the train can leave
without waiting for cut 26. No path is shared with cut 26. Rung: b269, extended by label (§5). No migration of mine:
0219 rides PTN's package.

## The bytes
PTN_A2_1C_SRV_r2.zip, sha256 ce198bb1…a172, equal to the chair's. db/migrations/0219_partner_send_log.sql, sha256
adf13f68…2629, was read whole.

## The record (appended last, after 202)
The register now reads 183, 204, 196, 200, 208, 209, 205, 195, 197, 198, 211, 218, 201, 202, 219.
0219 does the following:
- It creates `partner_send_log`, which is append-only. RLS is on, and the four service_role grants are in the same
  transaction (e-273). A trigger, `partner_send_log_no_update`, and its function, `partner_send_log_append_only`,
  refuse every UPDATE. Its rows are deleted only by the cascade from `partner_sends`.
- It creates `partner_send_revive(uuid, text, text)`. In one statement it makes the guarded UPDATE of
  `partner_sends` and writes the log line. It runs with invoker rights, and service_role alone may execute it.
- It alters `partner_orgs`, adding `whatsapp_opt_at` and `whatsapp_opt_words`.
- It seeds three `capabilities` rows, each born 'pending'. These are rows only, so no shape changes.
stale_for: `public.partner_send_log`, `public.partner_orgs`. State: OWED until the next PAIR regen.
The file's header agrees with its body. I found nothing for the chair.

## Proven
- **b269:** 14 passed, 0 failed. §5 is new: the record and what it says, plus three mutations (partner_orgs left out
  of stale_for; 0219 placed before 0202; the record removed). Each reddens 5.1. The cells amended by label are 1.1
  (the order now ends in 219), 1.2 (201 and 202 held at the thirteenth and fourteenth rows) and 4.2.
- **b263, b266, b267 and b268:** each exits 0.
- **On bcdb364 with this cut alone:** b15 is red, as expected ("names `0219`, which has NO .sql file"). b128, b91 and
  b07_f0789 exit 0.
- **On bcdb364 with this cut AND PTN's real 0219 beside it:** b15, b128, b91, b07_f0789 and b269 all exit 0.

## R-47.1
| Old | New |
|---|---|
| (none) | No line that a vendor, partner, visitor or admin reads changes in this cut. The register is read by the schema formatter, not by any screen. |

## Walk card
There is nothing for the founder to walk. The register is read by the schema formatter, not by any screen. The proof
is b15, which is green on the combined tree.
