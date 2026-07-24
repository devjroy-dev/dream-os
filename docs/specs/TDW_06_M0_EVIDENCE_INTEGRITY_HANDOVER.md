# TDW_06 — M-0 · EVIDENCE-INTEGRITY PREP · HANDOVER

**Base `94598d7` (re-derived at origin, fetch-first, at authoring). §11 first motion clean: fresh clone, `git fetch`, `git status` empty at the charter's tip. Built to CE rulings R0–R6 and the founder's fork-A word 「 a1 」.**

**Delta: 5 files modified, 1 added.** `src/lib/vendorInbound.js` · `src/agent/engine.js` · `src/lib/vendor/enquiryBinder.js` · `src/api/middleware/agentBridge.js` · `scripts/b05_f0550_ping_drain_bench.js` (amended, labeled) · NEW `scripts/b06_m0_bench.js`.

**Zero migrations. Zero SQL in the ZIP. Zero copy bytes. Zero soul bytes. The veto slot is EMPTY and that is an assertion, not a claim — `b06_m0_bench §3.5`.**

---

## 1. WHAT THE FOUR DISEASES WERE, AND WHAT THEY ARE NOW

### F-05.60 — the `'hi'` substitution (A1, founder-ruled)

`vendorInbound.js:677` read `inboundMessage: firstWord.startsWith('TDW-') ? 'hi' : body`. A bride who sent a TDW code **with a question attached** was recorded, notified, pinged and summarised as having said hello. Seven consumers inside `runCoupleAgenticTurn` took the falsified value: the history filter, the model's user turn, both `pending_lead_pings` writers, the verbatim notification, the `Her message: "…"` line, and the intent extractor.

**A1 as built:** `stripRoutingToken(body) || 'hi'`. The routing token leaves; the sentence stays; the greeting fires only when stripping leaves nothing.

**THE CASE TRAP, AND WHY IT IS NOT AN INCIDENTAL DETAIL.** `firstWord` is `body.trim().split(/\s+/)[0].toUpperCase()`. The disease therefore fired on `tdw-droy550` exactly as on `TDW-DROY550`. A cure written to remove `firstWord` from the raw body would have stripped nothing on every lowercase send — **curing the loud half and leaving the quiet half alive, benched green.** `stripRoutingToken` never looks at the uppercased value: it re-splits the raw text and removes the first token by its own length. `§1.2` is the cell; `§8`'s M2 mutation is the uppercase-matching cure, and it REDs.

**PRECEDENT, NOT INVENTION.** `brideInbound.js:567` has run this exact discipline since M1b — `trimmedBody.length > 0 ? trimmedBody : bodyForLog`, a fallback that fires only on emptiness. The bride lane was already right. Both lanes now share one law.

### A-dedupe(α) — the second defect, which does not die with the first

`engine.js` filtered history with `m.body !== inboundMessage`. That comparison was only ever true while the derived message and the stored row's body were the same string. The substitution broke it silently — **and that break is the only reason the falsified turns still answered correctly.** Her real sentence leaked back in through history while `'hi'` sat in hand: two defects cancelling to produce a right-looking reply.

**A1 alone does not restore the match** — it replaces one mismatch with another, turning a compensating leak into a genuine near-duplicate. So `runCoupleAgenticTurn` gained `rawInboundBody`, **optional and defaulting to `inboundMessage`**, and the filter now compares against what the audit row actually stored. The three sibling couple callers pass nothing and are byte-identical (`§2.4`, `§2.7`).

**γ REFUSED, as pre-ruled.** The audit row at the TDW branch still stores the raw `body`. An audit row rewritten to match a derived value is not an audit row. Asserted structurally at `§2.8`.

### F-05.59 + F-05.54 — cured as one act (C1)

The primacy sentence was minted at `vendorInbound.js:668` and appended **blindly** at `enquiryBinder.js:69-73` on every dedupe hit — so a repeat enquiry stored a first-message claim about a message that was not the first (production specimen: binder `1e774015`, the sentence stored twice). The caller could not suppress it, because the only value that knows the answer is `deduped`, which the function returned and which no caller read.

**The cure splits the parameter, not the sentence.** `note` = a claim true on every path. `noteIfNew` = a claim true only of a binder this enquiry opened; written fresh, **skipped on dedupe**. The decision now lives at the one writer, beside the fact that decides it, rather than being re-derived by every caller. **Zero bytes of the sentence change** — only its key, and with it the path it is written on.

**And both door callers now READ the verdict** and speak loudly on `!ok` with a findable tag (`[enquiry-binder:pre-turn]` / `[enquiry-binder:post-turn]`). Loud, not fatal: a cabinet write can fail while the bride's turn continues correctly, and that is exactly the case that must not be silent. F-05.61's family, honoured at these two sites.

**`couple/enquire.js:88` is left as-is, per R3** — it reads `.binder.id`, which is what it needs. Its `binder` object is byte-stable: the dedupe path's SELECT widened to `id, client` for the guard, but the **returned** shape is still `{ id }` alone (`§5.4`).

### F-05.52 — the phantom column (E1)

`agentBridge.js:54` read `vendor.whatsapp_phone`. That column exists **once** in the entire witnessed public schema — `PUBLIC_SCHEMA.md:386`, on `public.demo_vendors`. `public.vendors` has 38 columns and no phone column of any name. So the read was `undefined` on every real vendor and every `engine.users` row born through this bridge landed `phone:NULL` **structurally — never by data, always by shape.**

The join was already in scope. The guard's own unconditional SELECT keys on exactly the right row; it widened from `auth_user_id` to `auth_user_id, phone`. **Zero new queries**, asserted by counting `public.users` reads on a warm path (`§6.3`).

---

## 2. 🛑 DECLARED GAPS AND BEHAVIOUR DELTAS — NAMED, NOT DISCOVERED

1. **E1 IS FORWARD-ONLY, BY THE SHAPE OF THE SITE.** The write lives inside `if (!u)`. Every `engine.users` row that already exists keeps its NULL. **The sizing SELECT travels with this delivery** (its own paste-block, read-only, zero placeholders) so the founder can see the population; **the UPDATE is not authored** and will not be until he rules, per R5 and the conditional-withheld rule. E3 (repair-on-read) was refused on the second-authority ground and the refusal is asserted structurally at `§6.5` so it cannot be quietly reversed.
2. **B0 — THE ONE-BRANCH ASYMMETRY IS NAMED, NOT CURED.** Only the TDW-code branch leaves an engine-plane trace. The disambiguation-resume (`:500`), sticky (`:608`) and existing-thread (`:876`) branches run a couple turn and write no binder. Recorded in-file at the site so it is not rediscovered a third time.
3. **D1-lite CHANGES WHAT THE VENDOR SEES.** A binder that previously read `Dream Wedding enquiry` forever will now gain the bride's real name on her next enquiry — **but only if the cell is still byte-identical to that default.** Any other value, his or anyone's, is untouched. This is a deliberate, ruled behaviour change on the vendor's own surface.
4. **The pre-turn call remains nameless and says so at the site.** She has not spoken yet; there is no name to give. The naming happens post-turn, where one exists.
5. **F-05.53's double-write STANDS (B2 as ruled).** `public.leads` owns the facts; the binder owns the narrative. Neither plane was collapsed into the other. B1 and B3 were refused at ruling.

---

## 3. 🛑 THE EXECUTOR'S REGISTER — THREE DEFECTS, ALL MINE, ALL IN THE APPARATUS

The bench's first full run was **47 passed, 3 failed. Every failure was in the bench. None was in the cure.** I record them rather than quietly shipping the fixes.

1. **`§1.8` asserted the wrong property.** It claimed `strip(b) || 'hi'` never equals `'hi'` for a body carrying a sentence — but a bride may perfectly well write `TDW-DROY550 hi`. The output is `'hi'` and the fallback never fired. **The cell conflated OUTPUT with BRANCH.** Re-authored to assert the branch, and it now carries the case that proves the distinction: same output, different world.
2. **`§2.8` sliced backwards off a comment** into a negative index.
3. **`§5.1`'s anchor was not unique — and this one cost a mutation.** `const result = await runCoupleAgenticTurn` occurs **four times** in `vendorInbound.js`; `indexOf` found the first, roughly 200 lines *above* the subject, so the window ran backwards and was empty. **The cell was RED at the cured tree.** Its `§8` mutation therefore proved nothing: red before, red after, and the harness's "RED on the named cell" check passed **on a corpse.** Anchored forward from `const preTurnBinder` (one occurrence) and the mutation re-aimed at the `ok` test itself.

**CE-68's banked maxim, second tenure, and it earned its place again: "the apparatus that proves the work must itself be proven."** The referent lesson — *the shape looked right and the referent was wrong* — reaches its fourth application here, inside the bench built to convict it. **Read the delivered mutation count as seven, one of which was hollow until caught.**

---

## 4. 🛑 ONE FLOOR MOVE — FORCED, LABELED, COUNT PRESERVED, RATIFY-OR-REVERT

**`b05_f0550_ping_drain_bench §4.3` — 31 preserved.**

The cell asserted that `strip(git show HEAD:src/agent/engine.js)` equals the working copy — **the whole file.** That is an OPEN-ENDED GUARD: green the day it shipped, structurally RED the moment any chartered sitting lawfully touches any part of `engine.js`, and green again the moment the founder commits that same delivery. **A guard that flips on push timing asserts a schedule, not a property.**

**M-0 is the collision the F-05.55 handover predicted in writing.** α and D1-lite move executable bytes in `runCoupleAgenticTurn`, ~400 lines *above* the defused island, and the cell reddened on the floor run — **caught by the floor, not by me.**

**Re-aimed by the `arc_m4 §4.1` cure's own shape:** base **pinned to `5335bb2`** (the commit that authored and proved the defusal) instead of a moving HEAD, and **scoped to the island** — from F-05.56's banner to `module.exports`, a string that occurs once and cannot drift onto a neighbour. **The defusal property itself is untouched and proven: the island's 825 executable lines are byte-identical to their base.**

**NON-VACUITY PROVEN, NOT ASSERTED:** an executable byte inserted inside the island (inside `executeTool`) drives the re-aimed cell RED; the file restored byte-identical. The guard still convicts exactly what it exists to convict.

---

## 5. PROVEN

**`b06_m0_bench` — 50/50, SEVEN production mutations RED on their named cells**, every mutated file restored byte-identical (`§8.0`).

The six CE-named cells: **`§1.2`** A-case · **`§2.6`** one-copy · **`§3.1`/`§3.2`** primacy both directions · **`§4.2`** never-clobber · **`§5.1`** loud-verdict · **`§6.1`** identity.

The functions under test are the shipped ones — `stripRoutingToken`, `enquiryToBinder` and `resolveAgentForVendor` are required from `src/`, and `§2` **lifts the shipped filter and default expressions out of `engine.js` and evaluates them**, so a later edit cannot satisfy this bench by leaving a comment behind. The only fixtures are the boundaries: a PostgREST-shaped recording client and a recording `executeRecordTool`.

**THE FLOOR — 25 harnesses, ALL rc=0** (`npm run build` first; the dist-dependent set is RED at a clean clone pre-build):

`crons 48 · sendwa 55 · webhookcore 11 · otp_meta 24 · b0498 58 · punct 17 · movementb 47 · transport 10 · m1b 4 · m2 2 · prospect 47 · checker 101 · onboarding 27 · couple_soul 21 · f0532 9 · arc_m1 53 · arc_m2 27 · arc_m3 11 · arc_m4 18 · arc_m5 11 · arc_m6 20 · **f0550 31 (amended, labeled)** · media_shim 14 · f0555 23 · **b06_m0 50 (NEW)**`

Twenty-three byte-stable, one amended in place with its count preserved, one new. `node --check` clean on all touched sources. `npm run build` (tsc) exit 0. **W-1 clean and asserted** (`§7.1`): zero soul/prompt/lens bytes. **Guarded files 0-line and asserted** (`§7.2`): `scrub.js`, `eventWrite.js`, `coupleEventWrite.js`, `calendarSignals.js`, `api/vendor/leads.js`. **SQL: zero. `0101` unreserved and asserted** (`§7.3`).

---

## 6. THE FOUNDER'S STEPS

1. Apply the ZIP, run the verify, push on green.
2. Railway redeploys and rebuilds `dist`.
3. **Paste the read-only sizing SELECT** (its own block). It is handed so the back-fill population can be SEEN. **Nothing is authored against it until he rules** — no UPDATE travels with this delivery.
4. Walk the smoke card **once, after proof**. **The card carries BOTH forms of the handle** — prefixed and bare — per the luck-not-method law. The card is authored against his pasted fixtures.

---

## 7. WHAT THE NEXT SITTING PICKS UP

The post-block ledger as CE-69 re-homed it, minus what M-0 discharged: **F-05.56's deletion ruling** (unhurried; the defusal guard is now stable under it) · **the RF-1 coherence sitting** (F-05.61 + 62 + 66 — this sitting read the verdict at **two** sites and the estate-wide sweep is still that charter's) · **the auth sitting** (13+28+30+63+67) · **F-05.64** · **F-05.65** (product call) · **the F-05.48 sweep** · **F-05.58** · **F-05.19**.

**Named forward from this sitting, unnumbered per CE-69 §N:** the three-of-four couple-branch asymmetry (B0, named-not-cured, its own charter if the chair ever wants the cabinet symmetric) · the E1 back-fill (waiting on the founder's ruling against the sizing SELECT).

**Then the founder's spine: BLOCK 06 TO M-6 EXIT** — the acceptance clock still at ZERO, F-06.13 · F6 · F-06.16/17/18 + the register items awaiting their sittings. **The data those evenings judge is now true.**
