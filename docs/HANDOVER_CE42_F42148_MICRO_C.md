# CE-42 · SEAT E · MICRO C · F-42.148 / F-42.149 — HANDOVER
**THIS IS A DIAGNOSIS, NOT A FIX.** After this ships, `+918757788550` still cannot log in.
What changes is that the next occurrence names its own two rows in one log line instead of
naming a constraint and neither row. The cure for the locked-out account is D′, which is
authorised in shape and has not run.

base `ff94d75` · no migration · no schema · no data · bench `b72` 6/6

1. F-42.148 — `ensureAuthIdentity.js:96` handed Postgres a collision and the caller got
   `duplicate key value violates "users_auth_user_id_key"`. That sentence names a
   CONSTRAINT and NEITHER ROW. It now asks who holds the identity BEFORE binding, and
   refuses with a typed error naming the identity, the holder and the claimant.
2. The lockout it reports is DETERMINISTIC, which is why the doors no longer say "try
   again": `createUser` can never succeed (the phone owns an identity), the heal always
   finds that identity, the bind always collides. Both doors return 409
   `identity_bound_elsewhere`. Postgres's constraint name never reaches the caller.
3. IT REPAIRS NOTHING, deliberately (cell 3). Moving a live account's identity is a data
   act on somebody's session, not a decision an error path takes at 3am on behalf of a
   caller who asked to log in.
4. The specimen: auth `ce496223` (phone 918757788550) bound to users `3c8eb9e0`
   (+919999900550, "Droy"), both born 2026-06-23 within 21 seconds — the dead
   browser-OTP era `ensureAuthIdentity.js:6-7` records. Closed loop today: `mintSession`
   and `auth.uid()` both resolve through `auth_user_id`, so no cross-account door is open.
   What is wrong is that Droy's sessions carry a phone claim that is not his.
5. The class SELECT read ONE ROW across the whole estate. F-42.149's invariant — a bind is
   only correct when the identity's phone matches the row's on last-ten — is therefore
   TRUE EVERYWHERE TODAY except that pair, and would have cost nothing to enforce. Filed
   as its own charter (E), at both bind sites: `ensureAuthIdentity` and `provisionRole`.

## BOTH WAYS, PER CELL
- 1, 2, 6 RED at `567ab21`: the typed error, the named rows, the typed 409.
- 3, 4, 5 GREEN both ways — NO-CHANGE CELLS, said so rather than counted as six reds. They
  pin that the refusal moves nothing, that the ordinary heal still binds, and that an
  already-bound row is untouched. They prove no cure; they stop the next edit breaking
  what works. The stub honours the partial unique index itself, so no cell can go green
  over a write the database would have refused.

## e-3 — THIS SEAT'S OWN WRONG READ, AND WHY THE CURE IS SHAPED THIS WAY
The first read of F-42.145 inferred a SPLIT USERS REGISTER from the constraint name,
proposed a fork built on it (suffix LIKE at four insert gates), and was disproven by one
SELECT returning a single row. The proposed cure would not have touched this bug. That is
the entire argument for cell 2: an error that cannot name its own subjects sends the next
reader after the wrong bug, and it did.

## e-4 - A SECOND WRONG CLAIM BY THIS SEAT, CORRECTED
While pricing D-prime this seat said rebinding `ce496223` would hand the claimant "an
identity stamped with Droy's session email". FALSE. `internalEmail` is
`couple-${authId}@...` (couple/auth.js:92, vendor/auth.js:95) - keyed to the AUTH IDENTITY,
not to the users row. It carries nothing of Droy's and remains correct after a rebind.
D-prime pays no such cost.

## OPEN
D�� (mint before clear; Droy never holds zero identities) — authorised in shape, NOT run.
Dry-run script, Railway shell, output read before the live run. R-42.4.
E / F-42.149 — the invariant at both bind sites, later charter.
