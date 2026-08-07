# TDW_10 · F-10.100 — THE COMBINED AI CAP · ZIP A (dream-os) · EXECUTOR HANDOVER

**Built at:** dream-os `8ce5422` · **pwa companion:** `97b8b8f`
**REBASED.** Cut first at `556e164`/`1959023`, rebased to `c44356e`/`d2ef96d`, rebased again to `8ce5422`/`97b8b8f` — the bride lane moved three times during this sitting's walk. ZIP A collided with **nothing** (`556e164..c44356e` is `coerceBudget.js` + `brideEngine` + `couple/me` + its bench and docs — derived by `git diff --name-only`, checked file-by-file against this ZIP's payload). Ladder re-derived at the new tip: `0116` still free, `0113` still an unwritten hole. Full floor re-run at `c44356e`; `tdw09_rider2_budget` **54/54** joins it unmoved.
**Rulings built under:** CE R-26.7 §A (the ruled bytes) · §C (F-1 · F-2 · F-3 · F-4 · F-6 · M-1) · §D (acceptance)
**Radius:** dream-os only. The pwa half ships as ZIP B.

---

## 0 · THE FIRST DERIVATION, BECAUSE THE RECORD MOVED

Fetch-first at seating and again at cut:

| | ruling said | origin at this seat |
|---|---|---|
| dream-os | `556e164` | **`556e164`** — unmoved |
| dreamos-pwa | `1959023` | **`1959023`** — confirmed; `137c24b..1959023` is F-09.166, bride lane, **zero radius files** |

Ladder re-derived, not carried: tail `0115_tier_vocabulary.sql`; `0113` a reserved-unwritten hole; `0116` free. **LD-8 satisfied.**

---

## 1 · WHAT SHIPPED

| File | State | What |
|---|---|---|
| `db/migrations/0116_combined_ai_cap.sql` | NEW | Eight `vendor_ai_*` keys, seed-from-source-row off the live `vendor_pwa_*` rows. Zero DDL, zero DELETE. Revert commented. |
| `src/api/vendor-engine/chat.js` | MOD | **F-6** — `buildMeta` plain-args `{ supabase, agentId, tier }`; the key family follows; five call sites re-pointed; the ruled copy + one selector. |
| `src/lib/vendorInbound.js` | MOD | **F-1** — the cap gate, the word trio's fourth member. W-1 opened for this alone. |
| `scripts/tdw10_combined_cap_bench.js` | NEW | 33 cells. |
| `scripts/tdw10_tier_bench.js` | MOD | **Labelled amendment**, 80 → 81. |

---

## 2 · THE PROOF

- **`tdw10_combined_cap` 33/33 GREEN** cured · **1/33 at pristine `556e164`** — **32 cells RED per-cell**, run on an independently cloned pristine tree. Bar was 22; see §5.
- **The one green-both-ways cell is declared in-file.** §3.2 tests this bench's own capturing fake, so it cannot redden — it exists because §3.1 asserts an **absence**, and an absence assertion is worth nothing unless something proves the recorder would catch a presence.
- **Sixteen mutations, every one biting**, all against production source: the gate accepting any cap · the refusal losing its `return` · the key reverting · the meter writing a row · one character of the ruled copy · the upgrade path dropping out · `>= 0` regressing to `> 0` · `loop.ts` growing a lane column · the gate moving ahead of the glitch word · the held seat starting to speak · the fail-open path going silent · the null-guard dropping · the WA door re-typing the vetoed sentence · the selector keying on the tier word.
- **`tdw10_tier_bench` 81/81** cured; the amended bench **78/81 at pristine**; the **unamended bench witnessed 78/80 against the cured tree** before the amendment was written (CE-209's precedent, in that order).
- `node --check` clean on both touched JS files.
- **FLOOR, cured tree:** `b06_forkc_wireguard` **113/113** · `tdw10_billing` 52/52 · `tdw10_selfserve` 30/30 · `tdw09_micro` 23/23 · `b05_m2_vendor_inbound` 2/2 · `b05_arc_m1` 53/53 · `b05_arc_m6` 20/20 · `b0498_fresh_crew_rider` 58/58 · `b05_media_shim` 14/14 · `b06_m3` 37/37 · `b06_m0` 50/50 · `b05_arc_m3` 11/11 · `b6_s2` 48/48.
- **Attributed reds reproduced UNMOVED:** `b06_meter` 28/29 · `b05_f0555` 22/23 · `b07_f0772` 158/159 · `b10_p1_search` 44/45 · `b07_p4b_body` 75/76.

**THREE PRECONDITIONS FOR ANY FLOOR RUN IN THIS ARC, promoted at R-26.7 §D and paid for again here:** `npm ci` · `git fetch --unshallow` · `npm run build`. My first run reported `b06_forkc` 111/113 and `b05_arc_m6` 19/20; both were my container, not the tree.

---

## 3 · FOUR THINGS THIS BUILD PRODUCED, EACH OWNED BY NAME

**D-1 — THE LAZY REQUIRE KILLED THREE SEALED BENCHES, and the fix is an architecture call I made mid-build.** Requiring the cap seam pulls the engine's `db` module, which throws at load without its environment. Unguarded on the main path of every vendor turn it took `b05_m2` 2/2 → 0/2, plus `b05_f0555` and `b06_m3`. I avoided the deps-object trap the record warned about and walked into its cousin. **Cured fail-open**, on `buildMeta`'s own stated posture — *a broken meter NEVER blocks a turn* — with a `METER UNREACHABLE` error line. The trade is stated rather than assumed: failing open costs an unmetered turn; failing closed costs a vendor whose assistant has gone silent. **Not ruled. Reversible in one word.**

**D-2 — TWO VACUOUS GREENS IN MY OWN BENCH, caught by the pristine run and not by reasoning.** §1.6/§1.7 used `indexOf`, which returns `-1` for an absent gate and is less than every real offset — both were GREEN against a tree with no gate in it. §4.5 ran `/₹/.test(undefined)`, which tests the string `"undefined"` and passes. Both are the independent-method law's silent-zero clause, in a bench written by the executor who quoted that law in his read-first. Closed with explicit existence guards, each carrying its own tuition in-comment.

**D-3 — A NON-BITING MUTATION, so the cell was added.** Rewriting the selector's `turns_cap === 0` as `tier === 'basic'` passed **every** copy cell, because every zero-cap fixture happened to be Basic and every nonzero one happened not to be. Two properties travelling together in every fixture is one property proven. §4.7 now drives a **zero-capped Prestige** and a **Basic vendor who spent a real allowance** — the dial is the founder's interim lever on any tier, and the sentence must follow the cap, never the word.

**D-4 — MY READ-FIRST TOLD THE CHAIR `billing.selfserve_enabled` WAS FALSE. It is true.** I derived it from `laneFlags.js:81`, which is the *default*; both v2 handovers record both lane flags **witnessed `true` on 2026-08-07**. I asserted a live state from a code default, and smoke step ③ was reworded on that premise. The reword is still the safer step; the premise under it was mine and it was wrong.

---

## 4 · WHAT THIS DELIVERY DELIBERATELY DID NOT DO

- **The cap > 0 WhatsApp sentence is NOT built.** The seat is, and it warns rather than speaks. Shipping my own draft of a string awaiting the founder's veto is the one thing the copy law forbids outright. `§1.10` asserts the seat sends **nothing**, so the gap cannot close by accident. Until the byte lands, a paying vendor over her allowance is answered on WhatsApp exactly as she is today — **unchanged, never a regression.**
- **`couple_wa_*` / `couple_pwa_*` untouched.** Zero readers, both families; a live finding; with the founder. `0116` §6.3 and the pwa's `§3.5b` both assert this delivery did **not** widen a ruling to cover them.
- **`vendor_pwa_*` and `vendor_wa_*` rows are NOT deleted.** Deleting config is destructive and reversible only from a backup — 0115's call and its reason. They stop being offered and stop being read; the values stay legible.
- **No cap is set to zero by this delivery.** Zero is a founder act on his own console. A migration that quietly denied a tier its AI would be enforcing policy under cover of a rename.
- **W-1 held.** `git diff --numstat src/agent/` is **empty**. `engine.js` untouched — the dead twin stays dead. `loop.ts` byte-identical, asserted by `§2.5`.

---

## 5 · THREE NUMBERS MOVED. ALL DISCLOSED, NONE SILENTLY.

1. **Bench count 22 → 33.** Upward. 22 was ratified and I am over it; the eleven beyond are the three escape-hatch cells, the seat-ordering cells, the four migration cells, the fail-open cell, and §4.7 above. **Needs the chair's amendment.**
2. **`tdw10_tier_bench` 80 → 81.** Two cells re-aimed labelled; **one cell ADDED** — the F-04.36 negative asserting the retired template left no second reader behind.
3. **`b06_forkc_wireguard_bench` reddened over my COMMENT PROSE, then restored to 113/113.** Its `§12.8` slices this file from the glitch word to `const calendarSnapshot` and forbids three tokens in that window. I reworded rather than amend a sealed bench, and the gate's comment says in-file why it talks around two symbol names. **The window is over-wide and will trip the next sitting that seats anything there — F-10.104.**

---

## 6 · REGISTER DRAWN

- **F-10.103** — `db/migrations/` carries a genuine LD-8 collision at origin: `0063_users_auth_user_id.sql` **and** `0063_vendor_activity_log.sql`. Ninety migrations old, found by `§6.4`'s first draft, fenced **by name** rather than deleted — a cell that stops looking because it found something is not a cell.
- **F-10.104** — `b06_forkc_wireguard_bench §12.8`'s over-wide window, above.
- **F-10.102** (chair-filed) — the demo lane's `meta` type with no producer: confirmed at this tip, not cured here.
- **The destination divergence, filed unruled:** the PWA Upgrade control resolves to `/vendor/settings#tier`; the ruled WhatsApp copy sends her to **Billing**. Two lanes, two destinations, one purchase. Re-pointing a live control is a ruling, not a tidy.

---

## 7 · THE FOUNDER'S SHELF AFTER THIS ZIP

1. **Run the fixture SELECT** (separate message, ships first) and paste the rows. The smoke card is authored from them, never the other way round.
2. **Run the `0116` block** in the Supabase editor; paste the verify output. Expect eight rows, `values_match` true on every one.
3. Apply ZIP A, run its verify, paste it back. **Do not run the git line on a red verify.**
4. Then ZIP B (pwa).
5. **The push order stands and it is load-bearing:** `/vendor/billing` must be live before this reaches production. The WhatsApp refusal names 「 Billing 」, and at this tip the avatar menu carries **Settings**, not Billing — a refusal that sends a vendor to a door that isn't there is the same class of defect as the sentence it retires.
6. **Two bytes still owed by him:** the cap > 0 WhatsApp sentence, and the two dead couple dials.

---

## 8 · NEXT SITTING PICKS UP

The held WhatsApp spent-allowance sentence (one branch, one constant, nothing else moves) · F-10.103's elder ladder collision · F-10.104's bench window · the destination divergence · and whether the fail-open posture at the gate stands or reverses.
