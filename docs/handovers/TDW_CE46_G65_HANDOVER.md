# TDW · CE-46 · G6-5 · "Disconnect Instagram" · dream-os half · handover

Base: G6-4's dream-os cut (TDW_CE46_G64_DREAMOS.zip, sha256 0e5fd1d9...) on 1b8789f. Lands after it. Rung b153. No migration (F-i1 (a)).
Read-first ruled 29 September 2026: F-i1 (a), F-i2, F-i3; the founder's words for the sheet (rows 1 to 7) through the chair.
Cures F-44.243. Leaves F-44.244 (the Instagram token stored unsealed) for its own cut.

## Meta, read 29 September 2026
- Instagram webhooks, "Enable Subscriptions": POST /me/subscribed_apps with her Instagram User token. The DELETE this cut uses is
  IGD-1's read of 25 and 26 September (igMeta.setSubscribed); today's page shows POST only. The walk proves it.
- Business Login for Instagram: no revoke endpoint for an Instagram User token. Removing TDW is hers, in Instagram's settings
  (Help Center page 1144624522593085); Meta's deauthorize callback then deletes the row, as before.

## What changed
- `src/lib/instagram/igDisconnect.js`, the ONE function: her token read; past its expiry or absent -> no Meta call; else
  DELETE /me/subscribed_apps; a refusal (any code but 190, any status but 404, or a network failure) returns
  `{ ok:false, reason:'meta_unsubscribe' }` and changes nothing; otherwise igConnection.disconnect deletes the row (the standing law).
- `DELETE /api/v2/vendor/ig/disconnect` (Portfolio's door, and the room's) calls only that function; a refusal answers 200 `{ ok:false }`.
- igMeta.setSubscribed also returns Meta's error code (additive).
- The room's door (igRoom.answer) and Portfolio's status door carry `ig_username` and `replies_ever_on` (dm_consented_at), so the
  sheet reads the founder's row 2 or row 3.
- Unchanged: Meta's deauthorize and data-deletion callbacks.

## Rungs
b153 (new); b136c's double re-pinned by label (admits ig_username beside ig_account_id); b07_p4a, b07_p4b_probe, b07_p4b_slice1,
b119, b119b, b45, b77 green unchanged.

## Owed
The walk: replies on, disconnect, a DM to her account, no webhook. F-h's shared reconnect (G6-4's card).
