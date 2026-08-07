# TDW_10 · F-10.90 + F-10.92 — THE TWO REMAINING HOLES

**Base:** dream-os `3fa0259` · dreamos-pwa `503b254`
**Benches:** selfserve **28 → 30** · billing **52** · tier **80** (unmoved) · tsc **0**

---

## F-10.90 — `subscription.completed` LEFT HER ENTITLED ON A SPENT RAIL

### The hole

`entitlementFor` handled `charged` · `halted` · `cancelled` · `pending`.
`subscription.completed` fell to the default: **row ledgered, tier untouched.**

A subscription that runs out its billing cycles has stopped charging her exactly
as a cancellation has. The estate treated the two differently for no reason: one
demoted, the other left her on Prestige, permanently, with no vendor-visible
symptom and no admin one.

### The cure

```js
case 'subscription.completed':
  return { tier: BASE_TIER, billing_status: 'cancelled' };
```

Grouped with `cancelled` rather than given its own arm — the answer is identical,
and a second arm returning the same object is a place for the two to drift apart.

### The status word is a COMPROMISE, and it is named as one

0114's CHECK admits five words: `none` · `active` · `pending` · `halted` ·
`cancelled`. **`completed` is not among them.** Writing the semantically exact
word would be a write the database refuses — the 0115 lesson precisely: a
constant holding a word the CHECK rejects breaks the money path on the next
event.

`cancelled` is the closest **true** word available: her plan has ended and she is
on Basic, which is exactly what the surface then tells her. Buying an exact
vocabulary would cost a migration, a new vendor-facing string and a founder veto,
for a branch that at `total_count = 1200` is a hundred-year event. That would be
machinery serving a word rather than a vendor.

`§G.3` asserts every branch writes a word the CHECK admits — the failure this
compromise could otherwise cause is now a cell, not a comment.

### It inherits F-10.89 for free, and that is asserted

The dead-link cure keys on `cancelled` / `halted`, so a completed subscription's
`short_url` nulls in the same write. **Not left as a happy accident** — `§G.4`
asserts it, so a future sitting that changes this word is forced to notice it is
also changing the link cure.

### `subscription.expired` remains unhandled, correctly

It fires when the authorisation never completed. Nothing was granted, so there is
nothing to take away. `§G.2` records the distinction so the two silences are not
confused for each other.

---

## F-10.92 — THE KILL SWITCH THE VENDOR COULD STILL PRESS

### The miss, owned

Acceptance ④ ratified *「 OFF = today's byte-identical surface, proven by cell 」*.
**The v2 build did not deliver it.** `billing.selfserve_enabled` gated the ROUTE
only. The PWA rendered the picker regardless, so a flag flipped OFF produced a
picker that 503s — a kill switch the vendor can see and press, which is not a
kill switch. Executor's miss, filed by name rather than allowed to pass green.

### The cure

The flag now rides the wire. `GET /vendor/me` reads it through **laneFlags' own**
`readLaneFlag` — same 60-second cache, same fail-closed default — so the surface
and the route can never disagree about whether the door is open. A second
client-side constant would eventually guarantee they do (F-04.36).

Fail-closed at all three layers: the server read defaults `false`, the hook's
`EMPTY` state defaults `false`, the mapper uses `?? false`. A client that cannot
read the flag renders a **shut** door.

Both the picker and the cancel block are gated.

### ⚠ A DELIBERATE DEPARTURE FROM ④ AS RATIFIED — FOUNDER MAY REVERSE

**OFF is silent, not byte-identical to the pre-v2 surface.**

Byte-identical would require restoring 「 Dev will send you a payment link. 」 —
a sentence the founder retired WITH its mechanism, and which is now **false**:
Dev does not send links any more. **A rollback that reinstates a lie is worse
than a door that closes quietly.**

So OFF renders nothing where the picker was. Plan, Price and Status still show;
nothing offers her an action the estate cannot honour.

This is the executor choosing the third arm over both arms offered to the chair,
because both offered arms were wrong: building byte-identical would ship a lie,
and amending ④ to drop the arm would leave a real kill switch unbuilt. **Named
here so the founder can reverse it in one word.**

---

## WHAT IS STILL DECLARED-OPEN

Acceptance ① ② ③ — the live mint, cancel and upgrade on `9888294440` — remain
blocked on Razorpay's 2FA outage. Both lane flags are `true`; the credential pair
is the only thing left.

**Register: `.89` `.90` `.91` `.92` all cured. `.93`–`.99` unspent.**
