# TDW_10 · BILLING v2 — SELF-SERVE SUBSCRIPTIONS · HANDOVER (dream-os)

**Base:** `2077214` (`origin/main`, re-derived at seating and at cut)
**Chair:** twenty-fifth · **Executor:** Opus LE
**Sealed benches at cut:** billing **52/52** · tier **80/80** · selfserve **26/26**

---

## 1 · WHAT SHIPPED, AND WHAT DISEASE IT CURES

v1 shipped a real rail. The first Rs 2 landed, the webhook verified, the ledger
wrote, the flip machinery held behind its flag. But the Subscription Link was
**minted by the founder's own hand** in the Razorpay dashboard, one vendor at a
time, and pasted into her row. Correct for night one. A wall at vendor four.

The settings surface said so in the founder's own vetoed words:

> Dev will send you a payment link.

That sentence is **RETIRED** in this delivery, because a sentence describing a
mechanism must not outlive the mechanism (RETIRE-WITH-THE-READER, F-10.73).

**Six files. Three new, three edited.**

| file | state | what |
|---|---|---|
| `src/lib/billing/razorpaySubscriptions.js` | NEW | create / cancel / fetch. No SDK. |
| `src/api/vendor/billing.js` | NEW | subscribe · cancel · upgrade, vendor-authed |
| `scripts/tdw10_selfserve_bench.js` | NEW | 26 cells, 5 of them mutations |
| `src/lib/laneFlags.js` | EDIT | `billing.selfserve_enabled: false` |
| `src/lib/billing/tierFlip.js` | EDIT | F-10.89 — the dead link nulls with the flip |
| `src/api/vendor/me.js` | EDIT | carries `razorpay_subscription_id` on the wire |
| `src/api/vendor/core.js` | EDIT | mounts `/billing` |

---

## 2 · THE DOOR IS DOUBLE-DARK, AND THE TWO HALVES ARE INDEPENDENT

**Door one — `RazorpayNotConfiguredError`.** `razorpaySubscriptions.js` throws
*before any socket opens* when `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are
absent. `§B.1` asserts nothing reaches the wire unconfigured; `§B.2` asserts the
refusal **names** the missing variables rather than failing blank.

**Door two — `billing.selfserve_enabled`.** laneFlags, default OFF, fails closed.
Checked *first* in every route, so a walk done before the flip reads as
`lane_disabled` / "door shut" rather than as a Razorpay failure.

The split is deliberate. Credentials are an **accident of deployment** — they
arrive when the founder saves them. An accident is not a ruling. The flag is the
ruling: even fully credentialed, no vendor can mint until his hand flips it.

---

## 3 · THE CREDENTIAL CORRECTION — READ THIS BEFORE THE WALK

The read-first derived, from the Railway variables screenshot, that
`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` **were not on the service**. Method:
the list is strictly alphabetical and the visible run is contiguous
(`PORT` → `RAZORPAY_PLAN_ESSENTIAL`); `KEY` sorts before `PLAN`, so the slot
where they would sit is empty.

**`RAZORPAY_WEBHOOK_SECRET` is not the same credential.** It signs *inbound*
events. The API pair authorises *outbound* calls. Different dashboard pages,
neither substitutes for the other. This is the estate's most likely v2 stumble
and it is designed to fail loudly rather than quietly 401.

---

## 4 · ONE HOME FOR THE PLAN IDS — P(a), AND WHY THE KICKOFF'S FORK WAS WRONG

The kickoff proposed an `admin_config` INSERT for the three plan IDs. The
read-first found `razorpay.js:93-103 tierFromPlan` **already** reads
`RAZORPAY_PLAN_ESSENTIAL` / `_SIGNATURE` / `_PRESTIGE` from env to resolve an
inbound event's plan back to a tier. A second home would be F-04.36's family
exactly: one fact, two homes, the webhook and the mint drifting apart without
either erroring.

**The mint reads the same three vars, in the other direction.** Zero SQL shipped
this sitting. `§A.1` asserts the mint sends the id `tierFromPlan` resolves back;
`§M.2` reds when a second home disagrees.

Plan IDs were **never transcribed by the executor**. They live in env; the code
reads env; reading `plan_TMeKxJOrWCR53z`-class strings off a screenshot is
OCR-grade evidence with live `O`/`0` ambiguity, and the independent-method law
forbids certifying an identifier by the same eyes that read it.

---

## 5 · `total_count` — FOUNDER-RULED 1200 (2026-08-07)

**RULED.** The disclosure that stood here is discharged and the constant's own
comment has been corrected to stop calling itself provisional.

Kept on the record because the numeral was contested rather than defaulted:
relay #2 ruled *do not default it*; relay #3 ruled *build everything now* without
carrying it; `total_count` is mandatory on create. The build seated 1200 as a
DISCLOSED recommendation, named the contradiction in-comment, and carried it up
as resume-card item 0. The founder ruled it.

Fallback remains 360 if Razorpay ever rejects 1200 — a loud 400 at create, never
a silent wrong.

## 6 · F-10.89 — CURED IN TWO PLACES, AND NEITHER MAY ASSUME THE OTHER RAN

`vendors.razorpay_subscription_link` holds the `short_url` of a mandate that has
just died. Razorpay does not restart a cancelled subscription. The settings
surface renders the pay path whenever `billing_status !== 'active'` — **exactly**
the post-cancel state. Left standing, she is told she moved to Basic and handed
a button to a page that cannot take her money.

- **`tierFlip.js:applyEntitlement`** — nulled in the *same write* that flips, on
  the `cancelled` / `halted` branches. Not a follow-up write: a second update
  could fail alone and leave the row half-cured.
- **`billing.js` cancel + upgrade** — nulled at the point of death.

Both, because **she may also cancel from Razorpay's own dashboard**, where the
webhook is the only thing that will ever hear about it. `§F.1/.2/.3` assert the
partition: cancelled and halted null it; active and pending do not (the
retry-window mercy keeps her path open, R-BILL.3).

---

## 7 · F-10.90 — FILED, ASSERTED AS THE DEFECT IT IS

`entitlementFor` handles `charged` · `halted` · `cancelled` · `pending`.
**`subscription.completed` falls to the default**: row ledgered, tier untouched.
A vendor whose subscription runs out its cycles has stopped paying and keeps her
tier, forever, with no vendor-visible symptom and no admin one.

`§G.1` asserts the **defect**, deliberately, with an in-cell note to invert when
ruled. A bench asserting a cure that has not shipped would be lying; a silent
bench would let the hole close unnoticed.

`subscription.expired` is **not** filed: it fires when authorisation never
completed, so nothing was granted and there is nothing to take away. `§G.2`
records the distinction so the two silences are not confused.

At 1200 this is a hundred-year problem. At 12 it would be a twelve-month one.
**The numeral and the finding are one fact seen from two ends.**

---

## 8 · WHAT THIS DELIVERY DOES NOT DO, AND MUST NOT

`billing.js` **does not write `vendors.tier` and does not write
`vendors.billing_status`.** Those move on ONE path: the webhook, through
`applyEntitlement`, gated by `billing.tier_flip_enabled`. A cancel endpoint that
also demoted her would be a second writer racing the webhook for the same row,
and the two would disagree the first time an event was retried. `§C.3` asserts
the webhook still owns the consequence; `§M.5` reds if the endpoint takes it.

`linkSubscription()` remains the sole writer of `razorpay_subscription_id` and is
**called**, not reimplemented.

---

## 9 · U(a) — THE SEAM IS PRICED, NOT HIDDEN

Upgrade = cancel-current + mint-new. Razorpay's cancel is **irreversible**, so
between the two calls there is a real window in which her old plan is dead and
her new one does not exist. If the mint fails there, she holds no live mandate.

That state is reported with its own code — **`mint_failed_after_cancel`** — so the
surface says the true sentence rather than a generic failure that would invite
her to assume nothing happened and tap again. Recovery is a re-tap, made safe by
I(a).

**The native `PATCH /v1/subscriptions/:id` update surface is RECORDED as the
available v3 arm, by name**, so no future sitting rediscovers it as new. It was
invisible at the v1 ruling; re-examined at v2 the chair upheld cancel-then-mint.

---

## 10 · I(a) WITH THE TERMINAL REFINEMENT — WHY THE WALK ACCOUNT IS LEGAL

The refusal keys on **Razorpay's live statuses** (`created` · `authenticated` ·
`active`), not on whether a row holds an id. Terminal statuses do not block.

Keying on "has an id" would have locked **every vendor who ever cancelled out of
ever paying again**. That is not hypothetical: `9888294440` carries
`sub_TMeuDLooXudasB` in status `cancelled`. `§M.3` reds against the id-keyed
refusal; `§D.3` asserts the fixture is legal.

Acceptance ① therefore runs the **remint-after-cancel** path — a better witness
than a virgin row, because it is the path every churned vendor walks.

---

## 11 · THE RESUME CARD

0. ~~Rule `total_count`~~ — **DONE, ruled 1200.**
1. **Save two Railway vars on `dream-os`**, names only:
   `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`. Values never in a transcript.
2. **Confirm the three `RAZORPAY_PLAN_*` vars hold the right IDs.** Values are
   masked, so nothing but the walk proves the mapping — tapping Essential must
   show **Rs 999**, Signature **Rs 1,999**, Prestige **Rs 2,999**. Crossed vars
   mismap silently and the amount fallback partially masks it.
3. ~~Flip `billing.selfserve_enabled`~~ — **DONE.** Both flags witnessed `true`
   on 2026-08-07: `billing.selfserve_enabled` AND `billing.tier_flip_enabled`.
   The second matters: with it off, a real charge would ledger and NOT move her
   tier, which reads as a failed acceptance ① to anyone who does not know.
4. **The walk** — acceptance ① ② ③ ④, `9888294440`.

**Acceptance ① is DECLARED-OPEN.** The live mint is the founder's, witnessed
after keys land — the A2/A3 pattern, recorded not assumed.

---

## 12 · REGISTER

`.89` spent (cured) · `.90` spent (filed, unruled) · **`.91`–`.99` remain the
executor's.** F-09.105 is **not** this delivery's — three sub-floor `fontSize`
sites at `page.tsx:318/347/358`, re-carried to the UI micro by chair relay #3.
This delivery adds **no new size** to that file: body at 16, action words at 10,
both named rungs, so the three pre-existing sites remain the only ones
`tdw09_type` can see.


---

## 13 · WALK RECORD — 2026-08-07, AND TWO FINDINGS IT PRODUCED

**Pushed:** dream-os `6b896a2` · pwa `0be7370`. tsc clean, Vercel build green.

**Door two witnessed holding.** `POST /vendor/billing/subscribe` returned
`503 {"ok":false,"error":"Payments are not set up yet.","code":"not_configured"}`
with the toast 「 Plan changes are not open yet. 」 The route exists, the gate fires
before anything reaches Razorpay, and the failure renders a true sentence. The
credential pair is blocked on Razorpay's own 2FA outage (SMS then email, no third
leg) — an external wall, not an estate defect.

**Plan vars founder-witnessed as NOT crossed.** Walk step 2 collapses from a test
to a confirmation. His direct inspection outranks the price-on-approval-screen
proxy the executor had proposed.

**F-10.91 — FILED AND CURED THIS DELIVERY.** See the pwa handover; witnessed on
two live rows.

**F-10.92 — FILED, OPEN.** Acceptance ④'s first half — *「 OFF = today's
byte-identical surface, proven by cell 」* — **was not built**. The flag gates the
SERVER only; the PWA renders the picker regardless of flag state, and the retired
null-link paragraph is gone unconditionally. So `selfserve_enabled = false` does
not restore the pre-v2 surface: it produces a picker that 503s. Harmless today
(the flag is on and staying on), but it was a RATIFIED acceptance number and the
executor missed it. Disclosed by name rather than allowed to pass under a green.
Cure, unruled: gate the picker client-side on a flag the wire carries, or amend
④ to drop the byte-identical arm. The founder's word decides which.

**Acceptance ① ② ③ remain DECLARED-OPEN**, blocked only on the credential pair.
