# TDW_04.5 · P4 — EXECUTOR HANDOVER AT THE SEAM (the item + roster layer)

**Base:** `9984dd2` (dream-os) · `3d38d33` (dreamos-pwa) · **Role:** executor (Opus per CE-49)
**Banked at:** the two one-homes built and benched; the router rewiring and the whole pwa half hand forward by name.
**Migration:** `0096_collab_planner.sql` authored, **WITHHELD** — founder-run, its own later block, never in this ZIP.

---

## §1 — WHAT SHIPPED (dream-os, 3 files, all NEW — zero existing files modified)

| File | What |
|---|---|
| `src/lib/vendor/collabItems.js` | **NEW.** The wrap (F3), the discovery predicate (F4 amended), auto-close, items input validation, Appendix A's kind→requirement map. |
| `src/lib/vendor/roster.js` | **NEW.** Roster edges both directions, two-predicate dedup (F9), the assign-external bridge row (spec §P4.4). |
| `scripts/b0452_collab_bench.js` | **NEW.** 52 asserts over the REAL libs. |

`git status --porcelain` at delivery = three `??` lines. **No shipped file was edited.**

---

## §2 — THE RULINGS, AS BUILT

- **F3 wrap-on-read** — `itemsForPost(post, rows)`. Zero rows ⇒ one synthesized item from the post's own NOT-NULL `requirement_type`, flagged `wrapped:true` with `id:null`. Nothing backfilled; legacy rows byte-untouched.
- **F4 amended** — storage keeps `collab_posts.requirement_type = items[0]`; **discovery** runs through `postMatchesCategory`, which reads the item list (which is the wrap, so legacy posts answer on their own column exactly as before). This is the census catch: `collab.js:66`'s `.eq('requirement_type', me.category)` filters the POST column, which would have made items 2–8 invisible to their own categories.
- **position (ratified widening)** — assigned in `normaliseItemsInput` and only there, so `items[0]` is deterministic. Pairs with `0096`'s `unique(post_id, position)`.
- **F9 second predicate** — member-keyed dedup, then phone-keyed; a manual phone-only row that later connects is **upgraded in place**, never duplicated.
- **F8 persistence** — nothing in `roster.js` deletes. A deactivated bridge row is **revived**, keeping its `page_token`, so a live crew URL is never revoked by an unassign.
- **Auto-close** — `allItemsFilled` drives the flip to the **existing terminal `'filled'`** (`0048:41-43`). No CHECK widening, no new state.
- **Appendix A** — `fitting`/`trial` return the **two-chip ask**, not a guess; `other`/`blocked`/unknown return `null`.

---

## §3 — PROOF

**`b0452_collab_bench` — 52/52 GREEN** on the cured tree.

**Non-vacuous by PRODUCTION mutation** (real edits to shipped files, each reverted):

| Mutation | Result |
|---|---|
| wrap loses its `wrapped:true` honesty flag | **51/1 RED** |
| `postMatchesCategory` reads `post.requirement_type` | **50/2 RED** |
| phone-keyed dedup predicate removed | **48/4 RED** |
| `ensureBridgeMember` always INSERTs | **47/5 RED** |
| revert | **52/52 restored** |

**Two further mutations CRASHED the bench rather than reddening it** — killing the wrap branch outright, and returning `[]` from it. Reported as crash-class, **not counted as REDs**: downstream asserts dereference `[0]`. Evidence the code is load-bearing; not evidence of the same quality as an assertion-level RED.

**THE FLOOR — chair-declared counts re-derived by my own run, byte-stable before and after:**

```
b0451 111/111 · b0450 46/46 · b0498 66/66 + 17/17 · b05_m2 4/4 · assign 30/30
crew 21/21 · gap 10/10 · crud_crew 19/19 · b0496 11/11 · b0497 ALL GREEN
b5_wa_door 32/32 · b6_referent 36/36 · checker 101/101 · b6_sitting2 20/22 (F-04.91)
```

**Engine build green, `tsc` 0** (`npm run build:engine`). Named: four floor benches require `src/engine/dist` and crash without it — this is the CE-53 engine-build step, not a defect.

`node --check` clean on all three new files.

---

## §4 — EXECUTOR DISCLOSURES (each vetoable on its own)

1. **`toE164` is now the THIRD copy in this repo.** `src/api/circle/join.js:55` and `src/api/circle/verifyPin.js:22` were read and compared by command — they are **byte-identical**, and `roster.js` reproduces them byte-identically rather than forking, because a divergent normalizer is precisely the defect M1b caught pre-deploy. The hoist to one home is **filed as an observation** and proposed as its own small item: it touches the circle/bride auth plane, outside this charter (§8). **Ratify-or-revert.**
2. **`position` widens the spec's `0077` row.** Disclosed at read-first Part 3, CE-ratified.
3. **The second partial unique widens it again.** CE-ratified under F9.
4. **`upsertRosterEdge` swallows nothing but reports through `addEdgesOnAccept`'s `error` field** — the connection is the product, the edge the convenience. A failed edge must not fail a connect.
5. **`ensureBridgeMember` revives deactivated rows.** Not in the spec's words; derived from F8 + the `page_token` capability. If the chair prefers a hard refusal on a deactivated external, it is a two-line change.

---

## §5 — WHAT HANDS FORWARD, BY NAME

**dream-os, not built:**
1. **`src/api/vendor/collab.js` rewiring** — create (items 1–8 + `first_look_until` from KV), feed (discovery through the new predicate + first-look gating), my-posts (serialize items always), responses (`item_id`), respond (`item_id`), connect (`filled_by_response_id` + `addEdgesOnAccept` + auto-close). **Every seam is a call into the two shipped libs; no new logic is owed, only wiring.**
2. **The assign-external route** — `ensureBridgeMember` needs a door before the picker can call it.
3. **The cron clause (F5)** — `cron.js:108` unchanged, to be NAMED in the final handover with the ruled persistence sentence: expiry closes the POST; responses, connections and roster edges already made are rows and persist.

**dreamos-pwa, wholly not built:** the Roster tab · the multi-item composer · the picker-foot `Post to Collab` row (F10(b)) with both in-sheet refusals · first-look states · the F11(c) shared module + second entry. **All fourteen veto-approved strings are unspent.**

**Also open:** the founder smoke card's final form (STEP 0 + the three-account derivation is drafted at read-first Part 2, not yet carded) · `0096`'s own delivery block.

---

## §6 — THE WITNESS THIS DOCUMENT DOES NOT CLAIM

Nothing here asserts production behaviour. `0096` has not run; no roster row, no bridge row, no multi-item post exists anywhere. The live witness is the founder's, declared-not-claimed.

**Sequencing beyond this sitting is the founder's.**
