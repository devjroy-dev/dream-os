# TDW_05 — THE COUPLE-LANE MECHANICAL ARC · MOVEMENT M3 · HANDOVER

**Built at base `b091603` (fresh clone, fetch, clean — §11 first motion). F-05.47 CURED.**

## 1. THE DERIVATION, INCLUDING THE ONE THAT WAS WRONG

My first mechanism — legacy rows orphaned by `0063:23`'s `auth_user_id = id` backfill — was **falsified by the founder's own paste**: `public_orphans 0`, `engine_orphans 0`. I had written inference with a citation attached and it read as settled. The SELECT went first because the CE ordered it to, and that order is what caught it.

**The zero was the clue.** `23503` is a *rejection* — the FK refused the write, so no orphan ever persisted. The orphan was never a row; it is a **value, at write time**.

**THE REAL SEAM, command-derived and founder-confirmed three-for-three:**

```
vendorInbound.js:586   ← inside the TDW couple branch, BEFORE the agent turn at :591
  → enquiryToBinder(...)
    → enquiryBinder.js:32   resolveAgentForVendor(supabase, vendor, vendor.user_id)
      → agentBridge.js:29   upsert({ auth_user_id: <that value> }) into engine.users
        → FK to auth.users(id)  →  23503  →  throw  →  the couple turn dies
```

`vendors.user_id` is a **`public.users.id`**. Probe P1, all three vendors: passed value in `auth.users` = **false**; `users.auth_user_id` one column away = **true**; coincidental match = **false**. Probe P2: the witnessed `3c8eb9e0…` is a `public.users.id`, mirrored at `vendors.user_id`, **nowhere auth-shaped**.

**Neither `:586` nor `:624` is guarded**, so the cabinet write killed the conversation — a bride sent a TDW code and got a hiccup line instead of an answer, three times. The CE's two-eras framing was right; pre-mint, `users.id` *was* the identity and `:32` was correct code. `0063` split the planes and the FK made the difference fatal.

## 2. THE CENSUS FIRST, AS RULED — THE SET, NOT THE SPECIMEN

Eight `resolveAgentForVendor` call sites, each classified by what it actually passes:

| Sites | Passes | Verdict |
|---|---|---|
| `resolveAgent.js:21` · `day.js:153` · `events.js:491` · `leads.js:223` · `bands.js:258` · `payments.js:64` | `req.auth.user_id` — `getUser().id`, `requireAuth.js:45` | correct |
| `vendorInbound.js:803` | `user.auth_user_id` | correct |
| **`enquiryBinder.js:32`** | **`vendor.user_id`** | **the lone deviant** |

Seven correct, one wrong. **The census is what proves it is one rather than assuming it**, and §5.1 now asserts the property over the whole set so the next deviant cannot be born quietly.

## 3. THE CURE

**`src/lib/resolveUsersId.js` gains `resolveAuthUserId`** — the inverse plane hop (`users.id → auth id`), in the **same home as its twin**. The estate had the forward hop and not the backward one, so a caller needing an auth id from a `users.id` had nowhere to go and passed the `users.id` itself. Returns **null** when the user has no auth identity — a legitimate answer, not an error.

**`enquiryBinder.js`** resolves the auth id and passes **that**. And **the throw path is covered in the same seam, both modes**: a null auth id returns `{ ok:false, error }` — **this module's own existing contract** (`:31`'s `'vendor not found'`), not a new one — so the honest failure travels the way this file already says failures travel and **the bride still gets her answer**. **No live subject exists**: probe P3, both auth-less users own no vendor. The bench drives that mode synthetically and says so in the cell.

`vendorInbound.js` is **0-line**. The fix is entirely at the seam.

## 4. PROVEN

**`scripts/b05_arc_m3_bench.js` — 11/11 GREEN**, three production mutations RED on exactly their named cells. **The named test uses the witnessed values verbatim** (`vendors.user_id 3c8eb9e0…` vs `users.auth_user_id ce496223…`) and asserts **at the FK boundary** — the value actually reaching `engine.users.auth_user_id`, not merely the argument.

| Mutation | RED on |
|---|---|
| the plane swap restored | §2.1 `vendors.user_id` handed to the FK again |
| the null guard removed | §3.1 the throw kills the conversation again |
| the inverse hop keys on `auth_user_id` | §1.1 the forward hop in disguise |

**Floor + both prior arc benches: 17/17 rc=0**, every count byte-stable, `f0532` untouched. W-1 held; `src/engine/` untouched (§5.2 asserts both).

## 5. REPAIR POSTURE — THE SELECT IS ALREADY ANSWERED

Ruling item 4 asks for `engine.users.auth_user_id` anti-joined to `auth.users` before authoring any repair. **That query already ran**: it was probe 1's **Q1**, and **Q4 returned `engine_orphans = 0`**. The FK rejected every bad write, so nothing corrupt landed. **The repair is moot by evidence already on the record** — no second paste needed, nothing conditional-withheld remains. `0101` released back to unreserved; **DDL: none**.

## 6. THE FORK — PROPOSED, NOT PICKED

Should the hardening **also** land inside `resolveAgentForVendor`?

**A derivation that constrains the answer: the app cannot read the `auth` schema.** Zero code anywhere does (`grep`: 0 hits); PostgREST does not expose it. So *"is this a real auth id?"* **cannot be answered by lookup** — the resolver can only ask "is this the vendor's own `users.auth_user_id`?", which it can read.

- **(a) REJECT loudly** — compare the passed id against the vendor's `users.auth_user_id`; throw a named error on mismatch. Keeps callers honest and surfaces the next deviant immediately. The reject path has **no live subject** once `:32` is cured, so it costs nothing today and buys a permanent fence.
- **(b) RESOLVE silently** — swap a wrong-plane id for the right one inside the resolver. Never fails, and **hides the next deviant caller** — the CE's own stated hazard.
- **(c) RESOLVE + log loudly** — works and is visible, but a warning nobody reads is F-05.22's class.

**My lean: (a)**, because the caller is cured in this same delivery and a silent fixer would have made this very finding unfindable. **The CE rules.**

## 7. NEXT

**M4** (C8 + C10-loop, the wall's single opening, its own veto slot) · **M5** (C6 last, `f0532`'s labeled amendment) · **M6** (C9(a), carrying F-05.49).

**THE SEAL'S SMOKE, founder-run:** replay dead-letter `634ece1b` · send **TDW-DROY550** + the December-package question to **+91 79821 59047** · the couple wire answers · **the CE-66 transferred witness lands.**

**BANKED OBSERVATION, no cure, named only** (CE's word): the vendor line's own number `+917982159047` surfaces as a fixture-era `Vera Kapoor` `public.users` row with no auth identity.
