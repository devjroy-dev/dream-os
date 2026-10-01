# TDW · CE-47 · WEB-4 · CUT 8 HANDOVER · the account id on the admin's two lists (dream-os)

Cut at dream-os `c175e59` (ADS-2 cut 2 landed), 1 October 2026. Rung **b201**. No migration.

## What changed (two admin doors, behind requireAdmin; nothing else)
- `GET /api/v2/admin/vendors` (src/api/admin/vendors.js): the select names `user_id` (beside the users!inner(name, phone)
  join, unchanged) and each item gains `user_id: v.user_id`.
- `GET /api/v2/admin/couples` (src/api/admin/couples.js): the same, `user_id: c.user_id`.
Each item gains exactly one key, `user_id`: the uuid of the users row (vendors.user_id and couples.user_id are both NOT NULL),
always present, never renamed. Every other key of every item is unchanged. ADM-1's redesigned admin reads it to warn,
before a delete, when one account is both a vendor and a Dreamer.

## Proven
b201 12/0: per door, user_id present and equal to the row's account; exactly one new key named user_id, a uuid string; the
select names it with the join unchanged; the rest of each item byte-equal to the clean tip's door on the same rows (the rung
rebuilds the clean door by taking the two added lines back out, and proves that rebuild equals c175e59's file byte for byte);
a non-admin refused by the real requireAdmin (no session 401, a forged one refused, no rows). On the clean tip: 6 passed, 6
failed (the passes are the controls: rest-of-row and refusal). Differential over the readers of both doors and the source
walkers (31 benches): exits identical, outputs identical.
