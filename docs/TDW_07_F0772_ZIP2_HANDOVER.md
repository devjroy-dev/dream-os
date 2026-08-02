# TDW_07 · F-07.72 — THE CIRCLE-LANE AUTH SITTING · ZIP 2 (dream-os): ENFORCEMENT

**Base:** `dream-os @ a63f1ae` · **Paired pwa ZIP:** `tdw07_f0772_zip2_pwa` on `dreamos-pwa @ 25d1fb7`
**APPLY ORDER: dream-os FIRST, then the pwa.** The doors must refuse before the clients learn to land on a refusal; applied the other way the client code is inert and the walk proves nothing.
**Ruled at:** the ZIP 2 read-first ruling — Fork A(c) · Fork B(b) · Fork C guard-anyway · Fork D guard-it · Fork E one-home · F-07.116 cure-by-deletion · F-07.117 accepted open and shaping acceptance.
This document rides the ZIP. It is **not** a CE entry and touches neither `FINDINGS_LOG.md` nor the masterplan.

> **THIS ZIP ENFORCES. ELEVEN DOORS THAT ANSWERED ANYONE NOW ANSWER ONLY A PROVEN CALLER.**
> ZIP 1 minted a token and taught fourteen client call sites to carry it while refusing nothing. This is the other half. **It is a live-lane cutover:** one real member (Mehek) and the bride's sanctuary both ride these doors, and a wrong refusal is an outage on a production surface. The rollback is one command and it is in §9.

---

## 1 · WHAT SHIPPED

| File | Change |
|---|---|
| `src/lib/circlePermissions.js` | **NEW** — Fork E. The permission block's one home; carries F-07.115's `[F-06.85]` declaration. |
| `src/api/middleware/requireCircleMemberAuth.js` | **RE-AUTHORED WHOLE.** Both mount-blocking axes dead. Four proofs in order. |
| `src/api/router.js` | The guard mounted on three Class A files (six doors). The confession comment **discharged**. |
| `src/api/circle/session.js` | `:61–100` collapsed into `req.circleMember`. **F-07.106's paragraph untouched.** |
| `src/api/circle/muse.js` | Three doors onto the proven member. **F-07.116 deleted.** Fork D: the GET stops reading `:brideId`. |
| `src/api/circle/dreamai.js` | Fork C. Two doors onto the proven member; body identity dead. |
| `src/api/circle/feed.js` · `threads.js` · `messages.js` | Five handlers flipped to refuse-on-neither; the proven couple replaces every path param. |
| `src/api/circle/messages.js` | **F-07.113's log line.** The mint-and-teach fallback **deleted**, as its own comment promised. |
| `scripts/b07_f0772_circle_auth_bench.js` | §13 + §13.M. **107 → 149**, labeled. |
| `scripts/b07_auth_crossover_bench.js` | §6.7–§6.9, the triangle's third dimension. **30 → 33**, labeled. |

**Zero SQL. Zero DDL. Zero production writes.** The two parked partial unique indexes (CE-125's `invitee_phone` + F-07.112's R-b) stay parked and appear nowhere in this delivery, in any form. W-1 clean: `circleEngine.js`, `brideIndex.js`, `brideInbound.js` **0-line**.

---

## 2 · THE GUARD, AND THE ONE PLACE THE CHARTER WAS WRONG

Both mount-blocking axes were re-derived at `a63f1ae` before a byte moved, and both held:

- **Axis 1** — `supabase.auth.getUser(token)` off a Bearer. This lane mints no Supabase JWT; a circle token is five dot-separated parts and a JWT is three. Mounted unchanged, the guard 401s the entire live lane.
- **Axis 2** — `.eq('id', user.id)`, the auth-plane id used raw as a `public.users.id`. 0063 split those planes and `resolveUsersId.js:29-34` carries the founder-run probe: they *never coincide*. Mehek's row is plane-split, so axis 2 was armed on the only live row.

### §0.2 REPORT — `resolveUsersId` IS NOT CALLED, AND THE CHARTER SAID IT WOULD BE

The kickoff and the CE ruling both describe the guard as *"re-authored, `resolveUsersId`'d"*. **Re-authored it is; the hop is unnecessary, and carrying it would be worse than omitting it.** Reported rather than quietly adapted.

The circle token's first bound field **is already a `public.users.id`**: `verifyPin.js:112` mints from a row selected out of `public.users`, and `join.js:289` from the `userId` it has just provisioned in that same table. There is no auth-plane identity anywhere in this credential's provenance — no plane to hop *from*. Calling `resolveUsersId` would take its fallback leg (`users.id = <the same id>`), return its own input, cost a round trip, and tell every future reader that this lane carries auth-plane ids. It does not. **Axis 2 is cured by the credential, not by a helper.**

`§13.3` is the cell that makes that argument falsifiable: it asserts against `verifyPin.js` and `join.js` — the two *other* files the claim depends on — so that if either mint ever binds an auth id, axis 2 comes back to life loudly instead of silently.

### What the guard proves, in order

1. a Bearer verifies against `CIRCLE_SESSION_SECRET`;
2. the bound `user_id` is a live `public.users` row;
3. that row's phone is an **active** `circle_members` row — **revocation is live on every request**, which is the whole reason a 90-day TTL is safe;
4. **the membership found is the couple the token bound.** Not belt-and-braces: `circle_members_phone_idx` is a PLAIN index, one phone could be active in two circles, and `.maybeSingle()` on that shape is 1:1 by luck. The binding makes "whose circle" structural.

**401 and 403 are different answers and the client acts on the difference.** 401 = no usable credential → she goes to the PIN screen. 403 = a valid credential whose membership is gone → she must **not**, because re-entering a PIN cannot restore a membership the bride revoked.

---

## 3 · THE THREE THINGS THIS ZIP DELETED

- **The body's identity, everywhere.** `memberUserId`, `primary_user_id`, `body.user_id`, `:brideId`, `:coupleId`, `:userId` — every one of them still arrives from clients (zero pwa bytes move for it) and **none is read**. An accepted-but-unread field is the same lie in the API contract that `sender_name` was at F-07.107, and a client-supplied identity is a forgeable address (F-07.56).
- **`resolveAuthor`'s mint-and-teach fallback.** Its own comment said *"the fallback exists for routing alone and dies whole at the enforcement ZIP."* This is that ZIP, and it is **deleted rather than left unreachable** — `resolveCircleIdentityIfPresent` removed its own dead arm on exactly this reasoning at ZIP 1.
- **`getCircleMember` (F-07.116).** Seventeen lines, zero callers in the whole estate. F-07.99's class, third instance, found inside the file this ZIP came to guard. It dies here rather than in a return trip because a definition nobody calls eventually gets called by accident — and this one would have been the obvious thing to reach for the next time someone needed a membership check, *after* the guard had made one unnecessary.

---

## 4 · FORK D — THE DOOR THAT HAD NOTHING

`GET /circle/muse/:brideId` had **no validation of any kind** — not a token, not a membership check, not even the `memberUserId` the file's own header claimed it validated. It took a couple id and returned that couple's entire Muse board: every saved image, every vendor name, city, category and starting price, to anyone. The other two muse doors at least hand-rolled a lookup.

This is the largest behavioural delta in the ZIP and **the founder's card walks it explicitly**, because "it worked before" carries no information here: before, it worked for everyone.

---

## 5 · F-07.113 — THE THIRD ANSWER STOPS BEING SILENT

One line, at the write seam in `messages.js`'s POST, **fired before the refusal** — after the refusal this request produces no row, no reply and no other trace, so if the line does not speak there it never speaks at all.

```
[circle/messages] POST refused — credential present, resolved to no couple: source=<circle|couple> coupleId=null
```

**No token value, no prefix, and no length** — a length is a value, and F-07.108's rotation exists because one value reached a screenshot. No body, no phone, no name. `§13.31` proves the absence by driving a known token string and asserting none of it, nor any prefix of it, reaches the log. `§13.32` proves the line does **not** fire for a merely logged-out caller: it reports a mechanism, never traffic.

---

## 6 · WHAT THE BENCH CAUGHT IN ITS OWN AUTHOR — four faults, in ink

- **§13.M2's first cut** replaced the credential predicate with `if (false)`, which left `token` null, let `verifyCircleSession(null)` answer null, and produced a 401 **anyway**. The cell passed for the wrong reason — CE-125's third fault class exactly (a mutation that makes two halves agree on a broken world). The mutation that actually opens the hole is the one that lets a credential-less caller *through*.
- **§13.M4 passed over broken production code** because the test plane compared a status filter unconditionally; deleting `.eq('status','active')` left the comparison false and still produced a 403. A fake that ignores what it was asked for cannot convict code that fails to ask. §11's own tuition, second instance in this file.
- **§13.M8's anchor was written against bytes never re-read** and did not exist.
- **§13.21's census convicted itself** — the cell's own name contains the dead identifier it is hunting, so the scanner skips its own file, and that exclusion is **named rather than regexed away**.

---

## 7 · FLOOR AT DELIVERY — `npm ci` then `build:engine` first, whole, sequential

**`b07_f0772_circle_auth` 149/149 cured · 118/149 at the uncured production tree, THIRTY-ONE RED.** Ten §13 mutations plus the pre-existing sixteen, every anchor **site-qualified** per CE-127's fault, all files restored byte-identical.

**Movements, disclosed:**

| Bench | Was | Now | Why |
|---|---|---|---|
| `b07_f0772_circle_auth` | 68→88→107 | **149** | §13 (32 cells) + §13.M (10 mutations). **Four pre-existing cells INVERTED, not deleted** — §5.3, §5.4 and §11.3 asserted ENFORCE NOTHING and §9's INVERSE 9 pinned an address the collapse moved. §9's BOTH-SIDES CLAUSE: the old shape's green is retired, because a green over a phase nobody is in is indistinguishable from no test at all. Nine further cells re-aimed at the NEW caller's payload (a credential, where they drove none). |
| `b07_auth_crossover` | 30 | **33** | §6.7–§6.9. §6.1–§6.5 proved the lanes' credentials mutually unreadable **at the verifiers**; that was the whole triangle while the circle lane had no mounted guard. Now the crossing has a DOOR to be refused at, and this file is the estate's one home for cross-lane refusals. §6.6's derived guard census is un-regressed — its predicate already counted `verifyCircleSession`. |

**Byte-stable:** `f0784 59` · `f0774 20/20` · `p1 75 PAIRED` · `p2 48` · `p3 55` · `p4a_ig 110` · `p4b_body 76` · `probe 22` · `slice1 19` · `p5 136` · `p6 29` · `f0776 64` · `f0791 38` · `f0789 19` · the 28-sealed sweep exit-0 whole.

**THE EXIT-CODE SWEEP, per F-07.114's discipline — 98 scripts, SIX non-zero, and the classification is the point:**
- **known-reds EXACTLY TWO BY TALLY:** `meter 28/29` (F-06.41) · `f0555 22/23` (F-07.11).
- **one CRASHING bench (F-07.114):** `b5b_movementb_bench.js`, rc=2, `TypeError` at `:225`. **Reproduced at my own tip, pre-existing, out of charter. Not cured, not smoothed.**
- **three CREDENTIAL-GATED LIVE RIGS that refuse loudly by design**, not benches: `b06_gauntlet` (no `ANTHROPIC_API_KEY`), `b5_wa_door_smoke` (refuses to write to a live database without service-role keys), `test-shape` (no key). CE-127's line said *"all 95 committed benches"*; these three are the difference between 95 and 98, and naming them here is the floor-method law rather than a new finding.

---

## 8 · WHAT THIS ZIP DID NOT DO

- **Uniform the refusal envelope.** `feed`/`threads` speak `{success}`, `messages` speaks `{ok}`. **F-07.117 stands open and named**; uniforming touches every reader in the estate and is not this sitting's. Each refusal matches its own door's family instead, and the cells assert the family rather than only the status.
- **Cure F-07.115.** Mira's keyless lock is next sitting's. Fork E means it now lands in **one** place; before this ZIP it would have found one site and missed the other.
- **Ship either partial unique index.** Parked, together or not at all.
- **Touch `couple/profile` (F-07.106) or `pin-status` (F-07.105).** Filed, unmoved.
- **Cure F-07.114.** Disclosed above, out of charter.

---

## 9 · THE ROLLBACK — read this before the walk

**One command, in the repo root, after the push:**

```
git revert --no-edit HEAD && git push
```

Railway rebuilds on the push and the lane returns to `a63f1ae`'s behaviour — every door open, nothing refused. **Use it the moment a door refuses the wrong person.** The pwa half is inert without this half, so reverting dream-os alone is a complete rollback of the enforcement; the pwa's landing simply never fires.

**THE ONE ENVIRONMENT PRECONDITION, AND IT IS AN OUTAGE IF MISSED:** `CIRCLE_SESSION_SECRET` must exist on the Railway service running `src/index.js` — the same variable ZIP 1 added. Without it `verifyCircleSession` fails closed and **every Class A door 401s, including Mehek's**. It was set for ZIP 1's walk; step 0 of the card confirms it before anything else.
