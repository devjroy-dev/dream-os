# TDW_06 — THE RELAY LAW SITTING · EXECUTOR HANDOVER

**Base:** `612edfa` (re-derived at origin, fetch-first, at the moment of writing).
**Role:** LE / executor, code-capable. **Repo:** `devjroy-dev/dream-os` only.
**Findings:** F-06.81 · F-06.79 · F-06.85 (minted this sitting) · F-06.22's re-aim.
**Authority:** CE ruling 2026-07-27 (1B · 2B · 3A · 4B) + the founder's veto, discharged whole — 「 approved with #1 revised 」 then 「 approved 」 on the re-draft.

This document is the executor's handover. It carries **no CE number**, touches **no FINDINGS_LOG entry** and **no masterplan row** — those are the chair's, per protocol §10 part 6.

---

## 1. WHAT SHIPPED — four model-voiced bytes, all founder-vetoed

`src/engine/src/core/donnaSoul.ts` — the third-paper paragraph (`:50`), clauses 4 and 6b only:

| | |
|---|---|
| **clause 4 was** | `— and a reach that hands you an order is not a reach that hands you a clock.` |
| **clause 4 is** | `— and you read the hour a thing arrived the same way you read the name on it, because when a page landed is part of what the page says: this morning's enquiry and March's are different news, and he acts on them differently.` |
| **clause 6b was** | `So you say the true thing, which is the smaller thing: … and when it arrived you tell him this reach cannot say.` |
| **clause 6b is** | `So you say the true thing, which is the whole thing: … and when it arrived you give him just as plainly, because your hands now say so and a stamp read and not repeated is a stamp you swallowed.` |

`src/engine/src/core/donnaSoul.ts` — `:64`, a **fourth exemplar inserted** (F-06.79, Fork 3A):
`"Priya came in yesterday evening; the last before her was Tuesday."`

`src/engine/src/core/donna.ts` — the contract ceiling (Fork 2B, brevity kept, stamp exempted):
`Keep each reply to one or two plain lines — and an arrival your hand returned is part of the finding, never the bloat brevity is guarding against.`

**F-06.85's first instance:** a ten-line comment above `DONNA_SOUL` naming the mechanism the paragraph is conditioned on (`today.ts`'s `arrivalStamp`), both commits, the ten-hour gap, and the re-read obligation including clause 5. Not model-voiced; no veto owed; CE-approved as drafted.

**Boundary held mechanically:** the paragraph's other nine sentences are byte-identical to `612edfa`, clause 5's undated guard among them, asserted by `b06_f0681_bench` §2.2.

---

## 2. WHAT IS PROVEN, AND HOW

**`b06_f0681_bench` — NEW, 12/12 GREEN.** Not one cell pins a byte the cure added (LD-5). It asserts the retired *proposition*'s absence from the compiled soul, the ruled boundary against `612edfa`, the contract's ceiling as *qualified* rather than absolute, a date-bearing exemplar **by date shape never by literal**, and F-06.85's own floor.

**Both-ways, by mutation of PRODUCTION code — never test setup. Seven mutations, each verified to have landed:**

| | mutation | result |
|---|---|---|
| M1 | restore the stale clause 4 | RED 10/12 |
| M2 | restore the stale clause 6b | RED 11/12 |
| M3 | revert `donna.ts:362` | RED 11/12 |
| M4 | delete the fourth exemplar | RED 11/12 |
| M5 | strip the `arrivalStamp` naming | RED 11/12 |
| M6 | touch clause 5 | RED 10/12 |
| M7 | an exemplar teaching the tidy silence | RED 11/12 |

**Uncured tree (`612edfa`, scratch worktree, bench copied in): RED 7/12 on exactly §1.1 · §2.3 · §3.2 · §4.1 · §5.1 — the five cure cells and no others.**

**Disclosed:** §2.2 is trivially green at the uncured tree because it compares against that tree. It is a *boundary* cell, not a cure cell; its teeth are proven by M6, not by the uncured run. Said plainly rather than counted as a fifth cure.

**`b06_donna_cache_bench` — 16/16, and its non-movement is PROVEN by design, not assumed** (the ruling's own demand). The bench asserts prompt *structure* — `block[0]` carries `cache_control: ephemeral`, the dynamic tail carries none, the z-law strip leaves zero markers on DeepSeek — and asserts nothing about prefix *content*, so a content change correctly does not move it. Proven non-vacuous by structural mutation (drop the `cache_control` marker → **14/16 RED**).

**Economics disclosed:** `DONNA_SOUL` body 13,483 → 13,781 (+298); the contract clause 24 → 128 (+104). **Total cached-prefix growth +402 chars ≈ ~101 tokens**, one cold cache write per ~5-minute window. Smaller than F-06.56's founder-confirmed +511/~130.

---

## 3. TWO FLOOR AMENDMENTS — BOTH LABELED, BOTH COUNT-PRESERVING, RATIFICATION OWED ON THE SECOND

**(a) `b05_f0550_ping_drain_bench` §6.1 leg 2 — re-pinned WITH attribution, as ruled. 31/31.**
Base stays at `2028a0d` — a base moved to a seal that does not exist at bench-writing time is F-06.34's floating-referent family, which this cell has already been amended twice to escape. The count-only `deletions === 0` is **replaced by a stricter property**: exactly one base line may be absent, it must be the exemplar line by name, and **both of its halves must survive** — so the chartered act is provably an insertion into it, never a rewrite of it. The tripwire keeps biting, on more teeth than before.

**THE ATTRIBUTION NAMES THE TRUE CAUSE, NOT THE ASSUMED ONE — and this is the sitting's sharpest finding against its own reasoning.** Both the CE's kickoff and this executor's read-first predicted that F-06.81's clause replacement would trip this tripwire. **It does not.** The third-paper paragraph was authored at `c736a7e`, which *postdates* the pin base `2028a0d` — so the paragraph does not exist at the base and rewriting inside it is still purely additive against it. **Measured by isolation: `:50` + the F-06.85 comment alone = 13 insertions, ZERO deletions.** The one deletion is F-06.79's exemplar, a line that *does* exist at the base. **Had the CE ruled 1B without 3A, no re-pin would have been owed at all — the additive-vs-replacement argument that shaped Fork 1 was arguing over a constraint that never bound the clause cure.**

**(b) `b06_m4c_bench` §1.2 + §5.0 — amended, and this one the ruling did not anticipate. 20/20.**
§1.2 asserted donnaSoul **byte-identical to `daacf4f^`** — a whole-file byte pin, which convicted the founder-vetoed cure. This is the **fourth instance of the class this same file has already escaped twice**: §1.1's own comment, twenty lines above, already says *"a cell that greens only until the next ruled edit is not a floor."* harveySoul was narrowed at F-06.52 and again at F-06.60; donnaSoul was simply the surface that had not moved yet.

Cured on the file's own precedent, not a second invented shape: the property §1.2 guarded — every pre-M-4 readable sentence still **accounted for** — is kept, with the three permitted deltas **enumerated by ruling** and any fourth REDding. §5.0's restoration check moves from whole-file equality to this section's own mutation target, the treatment harveySoul already receives two lines below. **Narrowed, not weakened, and proven: an unruled sentence edit still REDs, and now names the lost sentence where byte-equality only said "does not match."**

**Authority:** CE-80's standing law — *re-pin-with-attribution is a REQUIRED step of any soul-touching seal* — and the kickoff §5's *"CE-80's re-pin-with-attribution if any W-1 cell fires."* A W-1 cell fired. **Flagged for ratification rather than absorbed quietly.**

---

## 4. THE FLOOR — every count held, every skip named

`b06_m0` 50 · `m1` 45 · `m2` 39 · `m3` 37 · `m4` 33 · `m4b` 24 · **`m4c` 20 (amended, count preserved)** · `m4d` 16 · `f0658` 20 · `f0667` 16 · `advisor` 16 · `advisor_route` 16 · `0081` 12 · `sonnet` 13 · `b0461_p6` 25 · `b6_floors` 47 · `b6_s1` 24 · `b6_sitting2` 22 · **`b05_f0550` 31 (amended, count preserved)** · `arc_m2` 27 · `arc_m4` 18 · `arc_m5` 11 · `gauntlet --rig-selftest` **278/278**. **Every one matches §5 exactly.**

Beyond the list, run anyway because `donna.ts` is a hot file: `b06_donna_cache` 16/16 · `b06_downgrade` 12/12 · `b06_fresh_thread` 10/10 · `b06_wa_words` 19/19 · `b06_pwa_flip_seam` 9/9 · `b6_witness` 22/22 · `b6_rider` 32/32 · `b6_f79` 19/19 · `b6_f80` 24/24 · `b6_referent` 36/36 · `b6_s2` 48/48 · `b6_open_question` 28/28. **New: `b06_f0681` 12/12.**

**SKIPPED, NAMED (floor-method law):**
- **`b6_door_rider_bench` — 0/0, CRASHES on missing `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.** Not run; no credentials in an LE container by design. This is CE-80's own named specimen of the silent-credential-drop class, and it is named here rather than counted as a green.
- **`b06_meter_bench` 28/29 — KNOWN RED, not mine** (F-06.41), carried loudly.
- **Block 04/04.5/05 bench families and `checker_bench`** — not run. Reason: this sitting's whole delta is two engine TS files and three scripts; no surface those benches guard was touched. Named as a declared judgement, not a claim of coverage.

**Engine gates:** `tsc -p src/engine/tsconfig.json` clean, zero errors.

---

## 5. WHAT THE FOUNDER MUST DO — and what he must not

**Dashboard/console acts required: NONE.** No env var, no Railway change, no Meta change, no SQL. This sitting reads no table and writes none.

**The apply block, the verify line and the git line ride the chat message this ZIP came with.** The verify line ends in the D-10 STOP; the git line is its own paste-block. **Do not run the git line over a red verify.**

---

## 6. THE LIVE VERDICT IS OUTSTANDING — stated plainly, as acceptance requires

**No bench in this ZIP witnesses whether Donna actually carries the dates.** No desk cell can: `loop.ts:710` hands Victor her voiced text alone, and whether that text carries an arrival is a model behaviour. **The verdict is the next gauntlet run's DATES DROPPED / DATES CARRIED census** (`b06_gauntlet.js:1005` / `:1033`), and it is outstanding at delivery. This cure will get no other verdict.

**A caution on reading that census, carried forward:** per the CE addendum (uncommitted, and therefore unverified by this executor), CE-90's fixture change means the next run is **not byte-comparable** to any run before it. A carry count that improves is not by itself evidence the cure worked.

---

## 7. FINDINGS FILED THIS SITTING (unnumbered, per §5 — the chair mints)

1. **The re-pin's true cause is not the assumed one.** §3(a) above. The clause cure never bound against `2028a0d`; only F-06.79's exemplar did. Both the kickoff and the read-first were wrong in the same direction.
2. **The executor's own bench shipped a vacuous cell and mutation caught it.** §4's first draft sliced from `src.indexOf('HOW YOU SPEAK TO HIM')` — which lands on the **file header's line 21** describing the paragraph, not the heading inside the soul. The cell then read every quoted string in the whole soul and **greened under a mutation that deleted the very exemplar it existed to guard.** F-06.55's family in this bench's own clothes: *the header describing the paragraph satisfied the cell about the paragraph.* Cured with a line-anchored, uniqueness-asserted anchor; M4 now REDs. Disclosed because the mutation ran, not because it was noticed by eye.
3. **`b06_m4c` §1.2 — the whole-file byte pin, fourth instance of the class.** §3(b) above.
4. **`HONEST_GAP_RE` (`b06_gauntlet.js:829`) still acquits `"this reach cannot say"` and `"unknown this turn"`.** Filed at read-first, ruled **F-06.84**, deliberately untouched this sitting per CE §5 — re-aiming the acquitting arm mid-sitting would change the instrument about to grade the cure. It must be ruled before the phrase can be treated as a conviction anywhere.
5. **The executor's prose clause census and the mechanical sentence split are different numberings, and the first draft of `b06_f0681` §2.2 conflated them** (boundary at prose clauses 4/6b = sentences 6/8). Caught by its own RED, corrected by deriving the mapping rather than loosening the cell; the mapping is disclosed in-file so the next reader is not misled the same way.

---

## 8. WHAT THE NEXT SITTING PICKS UP

The census run, and nothing else from this sitting. **F-06.84** is ruled and unbuilt. **F-06.13**, **F6**, F-06.69/77/78/82(d)/83, fork C3's referent oracle and both convict switches all stand open and were, correctly, not this sitting's business. Sequencing is the founder's.
