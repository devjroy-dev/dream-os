# CE-41 · SEAT D · D0 (dream-os) — F-41.63, R-41.97, F-41.61, the stale sites · HANDOVER

**Cut by** LE-D **at** dream-os `c4733904f567ae3b7e97af9d310a612306e849eb` (seat F's F1), derived fetch-first by command.

**Collision derivation (R-40.82).** `git diff --stat 0b27cc6..c473390 -- src/lib/templates.js src/lib/couple/assistance.js scripts/b20_a2_assistance_bench.js docs/TDW_CE41_A10_HANDOVER.md docs/TEMPLATES.md` is **empty**. F1 touched `modelRouter.js`, `chat.js`, `vendorInbound.js`, the admin doors, `0153` and three benches. Nothing of this seat's radius. Ancestry confirmed: `0b27cc6` is an ancestor of `c473390`.

**No migration.** Seat F took `0153`; the ladder tail is `0153` and nothing here needs `0154`.

---

## 1 · F-41.63 — the registry was wrong in body and in slot order, and it sent

The founder's WhatsApp Manager screenshot (2026-09-09 01:30) shows Meta holds `docs/TEMPLATES.md` §2 row 10. The registry held something else, in a different slot order. **Meta substitutes positionally**, so A10's live send to the founder's handset arrived garbled — the city rendered where the month belonged.

Cured on **both** sides in one rider, because either alone leaves the wire wrong:

| side | file | what moved |
|---|---|---|
| document | `src/lib/templates.js` | `body` byte-for-byte §2 row 10; `variables` → `name · month_year · city · category_words · budget_rs` |
| wire | `src/lib/couple/assistance.js` | `forwardToProspect`'s `vars` array reordered to match, each element annotated with its slot |

## 2 · R-41.97 — two cells, `b64` (b63 is seat F's)

**`scripts/b64_template_slots_bench.js`** — GREEN 105/105.

- **§1, the document side**, to seat B's spec exactly: registry `body` (its `+` parts concatenated) against the §2 entry whose *heading* carries the same Meta name and that entry's single blockquote; normalised only by stripping a leading `> `, collapsing whitespace runs, trimming; split on `/\{\{\d+\}\}/` keeping delimiters; assert (a) token subsequences identical and `1..N` with no gap or repeat, (b) `variables.length === N`, (c) **the literal subsequences identical, element for element**.
- **§2, the wire side** (the chair's Q3): each send site's `vars` construction order bound to that entry's `variables`.
- **§3/§4, the partitions, both directions.** Rule 5 says a registry entry with no §2 row FAILS, never skips — derived at the cut, 31 registry `tdw_*` entries, **10 comparable, 21 without a §2 heading**, so a cell that simply failed on all 21 could never be green. The ruling is a partition and **the list itself is asserted**: a name that gains a §2 row while still listed REDs; a name that leaves the list without a §2 row REDs. Same discipline the other way — a §2 heading with no registry entry is on `NOT_YET_REGISTERED` or it REDs. **`assist_found_vendor` and `assist_found_outside` sit there now and leave it in D2/D3**, which is precisely when the slot comparison switches on for the two templates F-41.63 proved load-bearing.

**`scripts/b64_mutations.js`** — 6/6. Five convict; **M6 is a declared survivor** and the harness asserts it stays GREEN.

## 3 · Two things this seat got wrong, both caught by its own mutations

**e-4 · §2's first cut read a comment.** It bound `variables` to the trailing `// {{n}} <name>` annotations. Its own **M3** — swap two `vars` expressions, carry their annotations along — walked straight through it: the cell stayed green while the wire was garbled. That is **F-41.63's exact live defect passing through the cell built to catch it**, and it is the comment-blindness class (R-40.105) plus R-40.94's — *the same class this rider struck out of `b20_a2:405` under c-41.39, reintroduced four edits later by the seat curing it.* §2 was rebuilt to strip line comments and bind the **expression**, by folding both to lowercase alphanumerics and requiring containment — derived, so there is no second home for the order.

**e-5 · the first M6 claimed a residue that was not the residue.** It permuted `variables` and the body and expected green; it red on 1.c, correctly, because the §2 document had not moved. The true residue is narrower and exact: **M2 and M3 applied together cancel.** Permute the registry `variables` *and* the send arm's expressions, leave both bodies untouched — §1 is green because no literal moved, §2 is green because each expression still sits at the index its variable names, and every source inside the estate agrees. **Meta does not.** `b64`'s header now states that precisely and M6 proves it survives, so the claim is asserted rather than promised.

**R-41.97 rule 7, honoured in the header:** this bench is a tripwire between two internal documents. Neither is Meta. F-41.63 is the proof — both sides were internally consistent for a day and the send still arrived garbled. **This bench catches the second drift, never the first.**

## 4 · F-41.61 — the double SENT line

`forwardToProspect`'s success-path `logWaSend` duplicated `sendWa`'s own dispatch-seam line. Dropped. **The throw path keeps its call**, because a throw never reaches that seam.

## 5 · The stale marketing-receipt sites — all four, and a fifth found

F-41.60/R-41.92 landed at `1a37bbc` and the marketing lane routes. Four documents still said otherwise:

1. `docs/TDW_CE41_A10_HANDOVER.md` §2 and §4 — struck, not deleted, so the history reads in order
2. `src/lib/templates.js` — the registry entry's header
3. `src/lib/couple/assistance.js` — the writer's comment
4. `scripts/b20_a2_assistance_bench.js:405` — **a cell asserting the stale sentence's spelling**, which is what held it in place

§4 also carried F-41.63's garbled body as the walk's expected sight; amended with Meta's real text and the `View the request` button.

## 6 · c-41.39 — three cells in seat A's sealed bench (c-41.6's disclosure form)

Disclosed rather than absorbed. **The count did not move: 126/126 before, 126/126 after.**

| cell | was | why it moved |
|---|---|---|
| `:392` | asserted `vars` in the **pre-cure** order | **it encoded the defect as a requirement.** A sealed cell can hold a bug in place, and this one did — it is why a garbled send survived a green bench. Not on the chair's residue list; found by running the floor. |
| `:404` | `(code.match(/logWaSend\(/g)).length === 2` | a **call-site count**, which F-41.61 legitimately changed. F-41.65's class, second specimen this sprint. Struck; the cell now asserts the grammar its label claims. |
| `:405` | asserted the stale comment's **spelling** | R-40.94's class. Now asserts the cured claim and that the struck sentence is gone. |

**Both ways, by command:** cured GREEN 126/126, uncured RED 124/126.

## 7 · Floor — `scripts/floor-manifest-ce41-d0.txt`

No count movements. Inherited and untouched: **F-41.64** (`b39_telemetry` reds 3.1–3.4 and 5.3 — five, not the two the s1 close note reported) and **F-41.65** (`b61_mutations` M8, a dead anchor whose subject woke under R-41.41). Both seat C's plane.

**Declared, not absorbed:** `b63_f1_model_routes_bench` exits 1 in this container on `Cannot find module '../../engine/dist/core/loop'`. **Verified identical at the uncured origin**, so it is neither this rider's doing nor a defect of seat F's — this container cannot build the engine's dist. The founder's gate can.

## 8 · Owed, and not in this rider

- **The walk.** One outsider forward on the founder's glass: the body should now read Meta's text with **View the request**, and the row should move `sent → delivered` (F-41.60). Both were wrong before this rider — the body garbled, the receipt believed dead.
- **c-41.38** (the `F1`–`F5` palette stand-in note) rides the **pwa** D0 rider, not this one.
- **F-41.3 mehendi** stays with the founder; four CHECKs and the taxonomy fence, not one migration.
- Seat D's range **F-41.77–F-41.85 remains unspent** — nothing new was filed by this rider; e-4 and e-5 are seat-owned errors, not findings against the estate.
