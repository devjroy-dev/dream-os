# M-TRUST — HANDOVER

**Bases:** `dream-os d53b688` · `dreamos-pwa 3a66471`, fresh sibling-full clones, own `npm ci`. R-33.7 held throughout — no add, no commit, no checkout.

**Ruling executed:** the founder's trust ruling of **2026-08-14** — 「 the bride is consciously adding people. 1- mehek always sees the vendor info. 2- mehek always gets to add to muse. 3- budget never visible 」. **Membership is the permission.** Arm 1: the module retires whole.

---

## 1 · THE CENSUS ARITHMETIC

**Delta: ZERO. Re-derived from the final tree, never inherited from the estimate.**

`tdw09_frost_parity.proof.mjs §3.1` reads **169 controls** on the Sanctuary surface (165 + D-4b's delegation: 3 buttons, 1 scrim) — the same figure as before this delivery, and §3.2's per-class split matches.

The earlier `169 → 171` estimate assumed the switches UI. The switches were cancelled whole, so nothing was added: `people.tsx` untouched, and `muse/page.tsx` is a co-planner file outside `SURFACE_FILES`. `muse/page.tsx:22`'s change is a **binding**, not a control — `canAdd` went from a flag read to `true`, and the three controls it gates were already counted and still render.

---

## 2 · THE READERS-CENSUS TABLE

Every site that consulted permission machinery at `d53b688`, and its disposition.

| # | Site | At `d53b688` | Disposition |
|---|---|---|---|
| 1 | `src/lib/circlePermissions.js` | the one home | **DELETED** (Arm 1) |
| 2 | `circle/polls.js:73` | `require` | removed |
| 3 | `circle/polls.js:95-104` | `permissionsFor()` + its plane read | removed whole |
| 4 | `circle/polls.js:149` | the `can_see_vendors` gate | **unconditional serve** |
| 5 | `circle/polls.js:232, :407` | both call sites | removed |
| 6 | `circle/polls.js:138` | `perms` threaded through `shapePoll()` | parameter dropped |
| 7 | `middleware/requireCircleMemberAuth.js:77` | `require` | removed |
| 8 | `middleware/requireCircleMemberAuth.js:171` | `permissions:` on the identity | removed; **`visibility` stays in the SELECT, unread** |
| 9 | `circle/session.js:100` | `permissions: me.permissions` | removed from the payload |
| 10 | `couple/circle.js:20-21` | `require` (3 symbols) | removed |
| 11 | `couple/circle.js:337-417` | the PATCH visibility door, 81 lines | **RETIRED WHOLE** — no husk |
| 12 | `couple/circle.js:17-18` | live comment citing the module | cured (F-14.13's class) |
| 13 | `pwa muse/page.tsx:22` | `can_contribute_muse` read | `canAdd = true`, one home for the reason |
| 14 | `pwa CircleSessionContext.tsx:54-58` | `interface CirclePermissions` | retired whole |
| 15 | `pwa CircleSessionContext.tsx:91` | `permissions: CirclePermissions` | removed |
| 16 | `pwa CircleSessionContext.tsx:64` | wire-shape comment | cured |
| 17 | `pwa layout.tsx:47, :57` | ink naming a departed key | cured |
| 18 | `pwa threads/page.tsx:47` | comment asserting the server omits `vendor_id` | **cured — it had become false** |
| 19 | `pwa lib/circle/pollCopy.ts` ⑪ | expected-zero premised on the flag | ruling kept, premise replaced |

**Verified by command:** comment-stripped walk over **277** `src/` files → **zero** code references to `circlePermissions` · `permissionsFor` · `VISIBILITY_KEYS` · `normaliseVisibility`, and zero permission keys.

### Benches that moved with their subjects (RETIRE-WITH-THE-READER)

| Bench | Moved | Result |
|---|---|---|
| `b14_d1_visibility_bench` | whole re-author | **32/32** · 25/32 at base (7 named reds) |
| `b14_d3_polls_bench` | §5 family + M6/M7/M16 | **68/68** · 61/68 at base (7 named reds) |
| `b07_f0772_circle_auth_bench` | §8.1 · §13.13 · §13.14 · INVERSE 13/14 | **158/159** — RED for §12.14 only |
| `pwa tdw07_f0772_circle.proof` | §14.5b · M-22/22b/22c | **131/131** |
| `pwa tdw13_d2_beta_gate.proof` | F-13.14 stripper re-home | **29/29** |

---

## 3 · THE HEADER-SWALLOW CATCH — F-13.14

`tdw13_d2_beta_gate.proof.mjs:41` declared **its own 22-line comment stripper** while the estate has had one home since F-07.74's cure (`scripts/lib/stripComments.mjs`). The F-07.52 / F-07.99 class — and the local copy had **diverged from the home in two ways**:

1. **No mid-token guard.** The home opens a block comment only where one can legally begin (`prev` empty or in `(){};,=:+&|?!\n[<`). The local copy opened on any `/*` outside a string. `accept="image/*"` was safe only because quote-tracking caught it first; `${x}/*y*/` in a template literal is not the same accident twice.
2. **No line stability.** The home preserves newlines inside block comments so a cell reporting a line number reports the *source's* line number. The local copy deleted them — every line number reported after a block comment was wrong by that comment's height.

**Neither had armed at this tip. That is luck, not design, and F-07.74 lasted a whole block on exactly that kind of luck.** Cured by import; four rig cells minted — the guard, the vacuity twin (the naive rule *would* swallow the specimen), line stability, and F-07.99's invocation cell proving this file really calls what it imports.

---

## 4 · THE b14_d1 INVERSION SUMMARY

**§1–§4 and §7's eleven module mutations RETIRED WITH THEIR SUBJECT.** They proved the resolver, the allowlist, the guard's resolution and the writer's merge — all deleted code. A cell asserting over an absent module is noise wearing a green.

**§5 INVERTS.** Old condition: *"a second implementation."* New condition: *"an implementation."* Walks `src/` (R-33.1), comment-stripped, requires zero. Six cells: the walk · the module's absence · the key vocabulary · the write door **and its husk** · the guard carrying-not-reading · the ruling in ink and dated at all four obeying sites.

**§6 IS THE CENTREPIECE, and it replaces `TDW_14_CIRCLE_FINAL.md` §5 acceptance #4** — see item 5. Six bounded cells (R-33.3), one per serializer, each convicting one file *by name*. **Plus §6.7:** the old §6.2 claimed money-absence over the *nine*-file family; six cells alone would have silently dropped `join` / `verifyPin` / `messages` while the section looked like it grew. §6.8 holds the family at nine so a tenth cannot join unwatched. §6.9 requires the spec's dated strike.

**§8 STANDS** — 0098's column is inert at the plane, append-only (LD-8). A migration that already ran is not litter.

**§7 is now ten mutations:** six inject a budget symbol per serializer; M7 proves §5.1 is a walk and not a hand-list; M8 proves the comment-strip still works (this delivery's retirement prose names the retired symbols on purpose); M9 the inert-column read; M10 the dead-code husk.

---

## 5 · P6 ACCEPTANCE #4 — REPLACED, FOR THE BAND

`docs/specs/TDW_14_CIRCLE_FINAL.md` §5 acceptance #4 read: 「 member feed payload contains zero budget fields **with the flag off** (raw JSON audit); **flag on → visible**; the member AI refuses the budget probe in-character with the flag off 」.

**There is no flag,** so there is no "flag off" and no "flag on → visible" arm to test. The criterion is **struck in place and replaced** — not deleted — so a reader never reconciles a live tree against a retired promise.

**The replacement is stronger:** no member-facing serializer carries a budget-bearing field **at all**, unconditionally, with nothing to flip. Held by `b14_d1 §6.1–§6.7`, each cell bounded to one file, each proven non-vacuous by its own mutation. *A wall with no switch is a better promise than a switch that defaults closed, because a default can be moved by a hand that never read the ruling.*

**The member AI's in-character refusal is unaffected and remains owed by P6.**

`§P3.2` also carries a dated strike, and it records that the **D-3b veto sheet's line (b)** — 「 a member without the flag sees the event's name and date but not its vendor 」 — is superseded by the 2026-08-14 word. Both dated, so no future seat wonders which won.

---

## 6 · THE FLOORS

**dream-os — the new runner's first governed outing, via F-14.16's `--delivery` mode:**

```
FLOOR = NAMED BASE, no delta
```

21 by name against `scripts/floor-base.txt`. Warm-up discarded. 11 dirty paths, all declared, printed into the output; contents-hash guard confirmed **declared files unmoved — set and contents both verified**. `b07_f0772_circle_auth_bench` stays in the 21 for its **§12.14 elder** — the base does **not** move, and that red is not this delivery's.

**pwa — its own runner:** 5 base reds + **`tdw_f0774_vacuity_probe`**, which is **not a delta of this delivery**. See item 7.

---

## 7 · F-14.16'S RADIUS IS WIDER THAN THE RULING ASSUMED — §0.2 REPORT

The ruling read: *"the pwa runner never had this gap — it has ordering, not refusal."* **That is true of the runner and false of the repo.** `scripts/tdw_f0774_vacuity_probe.mjs` carries **its own clean-tree refusal**, at bench level rather than runner level:

> `STOP — the tree is dirty. This probe writes to production source and restores it; on a dirty tree it cannot prove the restore was clean.`

**Exonerated by contrast, not by argument.** On a pristine `3a66471` clone it is **GREEN (21 reds, exit 0)**; with this delivery's seven files copied in and stashed clean it is **GREEN again**; on the delivery tree it refuses. The red is the refusal, not a failure.

**Not cured here — outside the chartered radius,** and the cure is a ruling, not an executor's choice. The shape is identical to F-14.16 and the same `--delivery` manifest would serve it, but a bench-level refusal may want a different answer than a runner-level one. **Filed for the chair.**

---

## 8 · SELF-CAUGHT, DECLARED

- **The `if (false)` near-miss.** My first draft of the PATCH door's retirement dead-coded it. That is Arm 3, refused on sight. Caught before it ran; the door retired whole, and **§5.4 now refuses the husk mechanically** so the reviewer's eye is no longer the guard.
- **`b14_d3 §5.2` was vacuous** — it passed over a flag that no longer existed. Re-authored to the stronger arm: a **legacy `{vendors:false}` column cannot re-gate her.**
- **`b14_d3 §8.M7` would have reddened on a `ReferenceError`,** not on filtering — its replacement read a `perms` binding the file no longer has. A hollow red. Cured.
- **`b14_d1 §9.2` named the wrong cause.** It duplicated §5.2 and, on an uncured tree, printed 「 the retired module came back during the run 」 for a module the run never touched. Cured to footprint-only. *A red whose sentence names the wrong cause sends the next reader hunting a leak that never happened.*
- **`f0772 §13.13` was found by the bench, not by my census.** It is Fork E's own cell, the nearest possible sibling of §13.14, and my sweep named three sites and missed it. **The same structural miss this estate has already recorded:** the reader census covers *callers* reliably and cells that *pin shapes* unreliably.
- **F-07.115's closure record would have died with its host file.** Deleting `circlePermissions.js` deleted the paragraph F-06.85 requires to survive its mechanism. **Re-homed to the guard** — the surviving reader — carrying the same number and the same `PUBLIC_SCHEMA.md:74-89` column witness, with `§13.14` and INVERSE 14 re-aimed to read it there.

---

## 9 · COUNT MOVEMENTS, DISCLOSED

| Bench | Was | Now | Why |
|---|---|---|---|
| `b14_d3_polls_bench` | 67 | **68** | **§8.M6b minted** — restore a hand-rolled gate off the legacy column, and §5.2 must catch it. 0098's column is still on the plane and still hand-writable; proving "serves today" without proving "cannot be re-gated" is half a proof. |
| `b14_d1_visibility_bench` | 61 | **32** | §1–§4 and eleven module mutations retired with their subject. |
| `pwa tdw13_d2_beta_gate` | 25 | **29** | F-13.14's four rig cells. |
| `pwa tdw07_f0772_circle` | 129 | **131** | §14.5b, M-22b, M-22c. |
| `b07_f0772_circle_auth` | 159 | **159** | Cells moved; none added or lost. |

**Both-ways, both repos:** every re-authored cell reddens on the uncured tree and greens on the cured one. `b14_d1` 32/32 ↔ 25/32 (7 named). `b14_d3` 68/68 ↔ 61/68 (7 named).

---

## 10 · SCOPE

**DDL: NONE.** 0098's column untouched at the plane.
**Copy: ZERO.** All six vetoed bytes die unspent. Nothing member-facing gains a word — no sheet owed.
**W-1: clean.** No soul, lens, engine or prompt bytes.
