# TDW_10 · F-10.100 RIDER — THE SPENT SEAT FILLED · THE HREF RE-POINTED · FAIL-OPEN RATIFIED

**Built at:** dream-os `a034537` · **pwa companion:** `b989172`
**Rulings:** R-26.14 §B (href) · §C (fail-open) · R-26.15 ① ② ③ ④
**Radius:** two files + two benches. Three lines of behaviour.

---

## 1 · WHAT SHIPPED

| File | What |
|---|---|
| `src/api/vendor-engine/chat.js` | `CAPPED_LINE` → the ruled bytes, both windows · `upgrade.href` → `/vendor/billing` · `CAPPED_LINE` exported for the WA door |
| `src/lib/vendorInbound.js` | the spent-allowance seat FILLED · fail-open ratification named per F-06.85 |
| `scripts/tdw10_combined_cap_bench.js` | **33 → 37**, five cells amended LABELLED |
| `docs/…_COMBINED_CAP_HANDOVER.md` | this |

**The ruled bytes, shipped verbatim, identical on both lanes:**

> You've reached today's conversation limit on your tier. The desk reopens at midnight.
> You've reached this month's conversation limit on your tier. The desk reopens on the 1st.

---

## 2 · THE SILENCE THIS ENDS

The seat shipped empty and warning, and the warn was right to exist. At the founder's
new ladder an **Essential vendor reaches 15 turns in a day** — and until this delivery
she then met SILENCE on WhatsApp. Paying, inside her rights, nothing back. That is the
exact failure F-3 was ruled to prevent, reintroduced by a held byte rather than by a
design. It was declared, visible in the logs as `SPENT-ALLOWANCE SEAT HELD`, and closed
by a ruling instead of discovered by a vendor. **The warn goes silent because the seat
is no longer empty.**

**No route line on this lane, and the asymmetry is deliberate.** The zero-cap sentence is
a SALE and carries directions to Billing. This one is a WAIT — there is nothing to tap,
and pointing a vendor at a payment page when her allowance resets at midnight would be
selling her something she does not need.

---

## 3 · THE ACCEPTANCE NUMBER AMENDED BY RULING — DISCLOSED BY NAME

F-10.100's ratified bar required *「 a nonzero cap still selects the spent-allowance
sentence unchanged 」*. **That cell is now falsified BY RULING, not by defect**, and the
distinction is the whole disclosure: the delivery met the number, the founder then ruled
the sentence, and a ruling outranks an acceptance number the same chair set.

Three classes retired from the sentence, each for its own reason, each asserted by a cell
so none can return by accident:

- **the figures** `(250/250)` — invited an argument with a number instead of stating a fact
- **the raw tier token** — rendered `basic` lowercase mid-sentence, the known founder
  question held open beside F-10.100; `your tier` retires the class rather than patching
  a capitalisation, and survives any future rename
- **`step up a tier`** — RETIRED BY FOUNDER RULING. Tokens are coming; he will not sell an
  upgrade he is about to replace. **The seat's SHAPE is preserved for a `buy tokens` line**
  and the reason is named in-comment per F-06.85, so no future sitting restores an upgrade
  prompt thinking it was an omission.

**The `window === 'day'` branch SURVIVES**, and §4.1b asserts it as a declared
green-both-ways continuity cell: it is the only thing between a monthly-capped vendor and
a promise of a midnight that never comes for her.

---

## 4 · THE HREF — EVENT (1) OF TWO, AND EVENT (2) IS NOT OURS

`href: '/vendor/settings#tier'` → **`/vendor/billing'`**, no fragment; that page IS the
picker. My own filing called the cost 「 one extra tap 」. **F-10.101's founder-witnessed
cold-load walk made it worse than I filed it:** the anchor DOES NOT SCROLL AND NEVER HAS.
A capped vendor landed at the TOP of a settings page and had to hunt. My derivation had
softened it to 「 a race 」; the walk was harder than the derivation and the walk wins.

**`id="tier"` in the pwa STAYS.** Its own comment records the two-event retirement: (1)
this line re-points — done — AND (2) **Railway redeploys so the new href is actually
SERVED**. Live clients take the address off the wire, so the anchor outlives the code
change by one deploy; deleting it early breaks Upgrade for every capped vendor. Named
in-comment at both ends per F-06.85.

---

## 5 · FAIL-OPEN — RATIFIED, NOT MERELY CHOSEN

R-26.14 §C. The reason is now in the file per F-06.85 so no future sitting "fixes" it into
fail-closed: **a paying vendor silenced by our own outage is worse than a Basic vendor
getting turns during one.** The cost is stated rather than left to be rediscovered — a
failed config read means unmetered AI for the duration, and only the error line says so.

---

## 6 · THE PROOF

- **`tdw10_combined_cap` 37/37** cured · **29/37 at the pre-ruling tree `a034537`** —
  eight cells RED per-cell on an independently cloned tree.
- **Nine mutations against production source, every one biting:** the seat going silent
  again · the seat sending the zero-cap SALE instead of the wait · the seat losing its
  `return` · the upgrade prompt re-added · the figures returning · the month branch
  collapsing into the day one · the href reverting · the fail-open reason stripped · the
  WA door re-typing the vetoed sentence.
- **Two declared green-both-ways cells, each declared in-file:** §3.2 (tests the bench's
  own recorder, which is what makes §3.1's absence assertion non-vacuous) and §4.1b (a
  continuity property that had to survive the rewrite).
- **FLOOR unmoved:** tier 81/81 · forkc 113/113 · billing 52/52 · selfserve 30/30 ·
  micro 23/23 · m2 2/2 · arc_m1 53/53 · arc_m6 20/20 · fresh_crew 58/58 · media_shim
  14/14 · m3 37/37 · m0 50/50 · s2 48/48. Attributed reds UNMOVED: meter 28/29 · f0555
  22/23 · f0772 158/159 · p1_search 44/45 · p4b_body 75/76.

---

## 7 · TWO DEFECTS OF MY OWN, BOTH CAUGHT BY RUNNING

**D-1 · A SCOPE BUG I WROTE AND CAUGHT.** My first draft called `capSeam.CAPPED_LINE` at
the spent seat — but `capSeam` is scoped to the try block above it, so that would have
been a ReferenceError **on every spent-allowance turn**: the exact silence this rider
exists to end, delivered by the fix for it. Hoisted as `capSpentLineFor` beside
`WA_CAP_ZERO_LINE`, for the same stated reason.

**D-2 · A VACUOUS CELL, caught on the both-ways run.** §1.11 asserted the spent seat sends
no route line — and passed against the PRE-RULING tree, where the seat sent *nothing at
all*. A cell green over an empty seat is green over the silence itself. The send is now
asserted FIRST, so the question 「 which sentence 」 only arises once there is one.

Also disclosed: a duplicate `module.exports.CAPPED_LINE` introduced and removed within one
edit, caught by grep; and one aborted `git checkout` in the pwa tree that left me editing a
stale file for a minute — reset and re-applied on the correct tip, disclosed rather than
quietly re-run.

---

## 8 · OPEN AFTER THIS RIDER

**F-10.104's cure is now ruled** (R-26.14 §D): re-anchor `b06_forkc §12.8` to the symbols
it guards rather than a file slice — a slice drifts silently while continuing to read
correctly. It rides the next sitting that seats anything in `vendorInbound.js`.

**The couple charter** stands ruled and unchartered (R-26.11/R-26.12, F-10.105/.107).
The load-bearing sentence for whoever seats it: **the vendor cure does not transfer.**

**The 503 is CLOSED** — a concurrent session on a different browser, founder-diagnosed.
Neither of my two candidates.
