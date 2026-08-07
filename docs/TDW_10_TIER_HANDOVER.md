# TDW_10 · THE TIER & MONEY SITTING — ZIP A (dream-os) · EXECUTOR HANDOVER

**Built at:** dream-os `1e4fd7e` (CE-206, re-derived at origin with `checkout`) · **Radius:** dream-os only.
**Seat:** Opus LE, successor seat. The predecessor died unbanked at its tool boundary; this delivery was REBUILT from the resume charter's record, not recovered from its container.
**Rulings built under:** relay #2 (§1–§5) · relay #3 (§0–§2) · the RESUME CHARTER's ruled state.

---

## 0 · THE FIRST DERIVATION, BECAUSE THE RECORD MOVED

The charter's bases were stale by the time this seat opened. Re-derived, fetch-first, checkout-first:

| | charter said | origin at this seat |
|---|---|---|
| dream-os | `1e4fd7e+` | **`1e4fd7e`** — CE-206 |
| dreamos-pwa | `8c1351a` (Phase C not landed) | **`2452eb5`** — **Phase C ZIP 1 HAS landed** (portfolio 119/119, profile 48/48) |

**The sweep successor has NOT delivered** — CE-206 records it as chartered on the ZIP-1 handover. ZIP B's sequencing therefore stands unchanged.

`git diff --name-only 01f3bbc..1e4fd7e` = `docs/FINDINGS_LOG.md` + `docs/TDW_00_MASTERPLAN.md` only. **Every file in this radius is byte-identical to the tip the predecessor built against**, which is why its proven work reapplies rather than needing re-derivation of the diseases.

**Ladder re-derived, not carried:** tail `0114_billing_rails.sql`; `0113` a reserved-unwritten hole (ADMIN_FINAL §2 / R-A6 / R-P3.2); `0115` free. LD-8 satisfied.

---

## 1 · WHAT SHIPPED

| File | State | What |
|---|---|---|
| `db/migrations/0115_tier_vocabulary.sql` | NEW | The rename made a constraint. Backfill `trial`→`basic` AND `free`→`basic` → DEFAULT `'basic'` → four-word CHECK → four `_basic` cap-key seeds → nullable `vendors.razorpay_subscription_link`. One transaction. Revert commented. |
| `src/lib/billing/razorpay.js` | MOD | `FREE_TIER='free'` → **`BASE_TIER='basic'`**, name and value together. Entitlement table's prose follows. |
| `src/lib/billing/tierFlip.js` | MOD | **D-3's cure** — `CANON_TIERS`, the fail-closed guard, follows the vocabulary. |
| `src/api/admin/vendors.js` | MOD | `VALID_TIERS` → the four ruled words. |
| `src/api/admin/bridge.js` | MOD | The entry-rung count follows the word; the honest-state prose re-authored. |
| `src/admin/views/unifiedInvite.js` | MOD | **C4**, founder-approved 「 yes 」. |
| `src/api/vendor-engine/chat.js` | MOD | `ENGINE_TIER_MAP` key · three `\|\| 'basic'` fallbacks · **F-10.85** both halves. |
| `src/agent/closerEngine.js` | MOD | **Fork E** — the one ruled line. W-1 opened for it alone. |
| `src/api/vendor/me.js` | MOD | **Fork H(a)** — `/me` gains `billing_status` + `razorpay_subscription_link`; both explicitly LOCKED. |
| `scripts/tdw10_tier_bench.js` | NEW | 80 cells. |
| `scripts/tdw10_billing_bench.js` | MOD | **Labelled amendment**, 50 → 52. |

---

## 2 · THE PROOF

- **`tdw10_tier_bench` 80/80 GREEN** cured · **31/80 at pristine `1e4fd7e`** — **49 cure cells RED, per-cell**, run on an independently cloned pristine tree. Bar was 79/79 · 30/79; met and beaten.
- **`tdw10_billing_bench` 52/52 GREEN.**
- `node --check` clean on all ten JS files.
- **FLOOR, byte-identical pristine vs cured, every line:** `tdw09_micro` 23/23 · `b10_p1_search` 44/45 · `b06_meter` 5/6 (F-06.41) · `b05_f0555` 22/23 (F-07.11) · `b07_f0772` 158/159 (§12.14) · `b07_p4b_body` 75/76 (§5.26). **This delivery moves nothing on the floor.**

**DISCLOSED, because a wrong number is worse than no number:** the first floor run reported `tdw09_micro` 13/23 and `b10_p1_search` 41/45. Both were `Cannot find module 'express'` — **the container had no `node_modules`**. After `npm ci` the true counts are above. A floor reading taken on an uninstalled tree is not a floor reading, and it very nearly went into this handover as one.

---

## 3 · THE THREE FINDINGS THIS BUILD PRODUCED

**D-3 — the executor's own miss, owned.** `tierFlip.js:49` carried a **second** vocabulary list, `CANON_TIERS = ['free', …]`, feeding a fail-closed guard. The read-first census grepped `trial` and never grepped `free`, so it was invisible. Left alone, every `subscription.halted` and `subscription.cancelled` would have hit that guard, logged `non_canon_tier`, and **left the vendor on a tier she had stopped paying for — with no vendor-visible symptom whatsoever.** Cured in-delivery; the file's comment now tells the next vocabulary change to search for the WORDS, not for the one word it happens to be renaming.

**F-10.85's second half.** Once `0` became a lawful cap, `dayUsed / dayCap` could evaluate `0/0 = NaN`, and every comparison against NaN is false. A vendor denied by a zero day-cap would have been correctly capped — and then told she had used up her MONTH (`0/250`). **True refusal, false reason**, which sends the founder to the wrong dial. Cured with a zero-safe ratio helper in the shipped file.

**The billing bench's labelled amendment.** Three cells asserted `free`. The PROPERTY is unchanged — a lapsed rail drops to the canon floor, and the flip writes nothing outside canon — only the floor's NAME moved. CE-199's ratified precedent governs: same property, moved subject, amendment labelled in-bench. The amended cells assert against `razorpay.BASE_TIER` **plus a cell pinning that constant's value**, so a future edit cannot pass them by moving both sides at once.

---

## 4 · WHAT THIS DELIVERY DELIBERATELY DID NOT DO

- **W-1 held.** `git diff --numstat src/agent/` = `closerEngine.js` alone, one ruled line plus its warrant. `closerSoul.js` byte-untouched; its trial sentence is DEFERRED-FILED to the covenant sitting.
- **The calendar sense of `trial` survives, everywhere.** `brideTools.js`, `brideEngine.js:542`, `tools.js`, `recordPrimitives.ts`, `cabinet.js`, `chat.js:432`, and the bride lane are untouched. A naive rename sweep across the word would have destroyed live calendar machinery in both lanes; §7 of the bench asserts the survival rather than trusting it.
- **`basic`'s no-AI semantic is RECORDED, not ENFORCED.** The rename writes the word; F-10.41's W-1-gated sitting builds the teeth. `ENGINE_TIER_MAP` retains `basic: 'entry'` on purpose — dropping the key would have enforced by accident, on a live chat path, in a delivery chartered to rename a word. Stated so it is chosen, not discovered.
- **`0115` does not delete the `_trial` or `_bench` keys.** Deleting config is destructive and reversible only from a backup. Their retirement is a separate, ruled act.
- **The inverted PWA cap ladder is FILED, not fixed.** The seeds copy `_trial` faithfully, so `basic` inherits 500/day against prestige's 100/day. That is F-10.86's subject and a founder ruling about what people get for their money — not a rename's business to decide silently.

---

## 5 · THE FOUNDER'S SHELF AFTER THIS ZIP

1. Apply ZIP A, run its verify, paste the output back. **Do not run the git line on a red verify.**
2. Run the `0115` SQL block in the Supabase editor; paste the result.
3. Run the numbered **cap-dial card** (separate message) when he wants to regulate `basic`'s AI.
4. **C6 still owed:** the UPI mandate line. A fresh draft ships with the M2 veto batch — his bank's phrasing is welcome but no longer blocking.
5. **M2's rendered strings remain HELD** pending that veto batch.

---

## 6 · NEXT SITTING PICKS UP

ZIP B (pwa) — cut, **handed without apply blocks**, sequenced behind the sweep's delivery; it carries C1/C2, the makers dropdown, the cap-key editor, F-10.81's union, F-10.83's rider, M1's three deletions with registry tombstones, M2's data path, and **the retint 3→4 labelled amendment (CE-205 re-carriered to this ZIP)**. Then M2's veto batch → M2's surface. **Register: F-10.78–.85 spent · .86–.88 remain this seat's.**
