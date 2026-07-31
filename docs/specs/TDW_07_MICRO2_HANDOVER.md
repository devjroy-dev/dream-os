# TDW_07 MICRO-2 — EXECUTOR HANDOVER

**Seat:** Opus-LE · **Sitting:** 2026-07-31
**Base:** `dream-os 45f9ab6` · `dreamos-pwa 4e806ef` — re-derived fetch-first at origin. The dream-os tip had moved past P4b BODY's `157af5f` (the docs-fix commit landed); derived by command, not assumed.
**Charter:** the fifteenth chair's walk-note rulings + the founder-ruled MICRO-2 addendum.

---

## 1 · WHAT SHIPPED

### dream-os

| File | Movement |
|---|---|
| `src/lib/discover/shapeVendor.js` | display cap **retired**; supersession of Fork 7(b) + P6's inheritance recorded; payload delta derived in-file |
| `src/api/couple/discover.js` | cap literal gone from the real loop **and** the demo leg |
| `src/lib/vendor/discover.js` | the founder's gate string, byte-exact |
| `scripts/b07_p4b_body_bench.js` | §1.2/§1.5/§2.1/§2.2 inverted by label; §2.2b + §5b (6 cells) new — **67 → 73** |
| `scripts/b07_p3_bench.js` | §10.5 inverted a second time (Fork 7(b) superseded) |
| `docs/specs/TDW_07_P4B_BODY_FOUNDER_WALK_NOTE.md` | **NEW** — never reached origin; rides this delivery |

### dreamos-pwa

| File | Movement |
|---|---|
| `lib/vendor/vendorModeForPath.ts` | **NEW** — F-07.30's one path authority, leaf-sited |
| `components/vendor/Header.tsx` | the enumerated allow-list **dead** |
| `components/vendor/BottomNav.tsx` | its correct-but-duplicate classifier retired to an alias |
| `app/vendor/layout.tsx` | `panelIndexForPath` now a consumer, not an author |
| `app/vendor/discover/preview/page.tsx` | `data-pager-inert="true"`; the costume-class footer **removed** |
| `app/vendor/page.tsx` | CommandBar mount + `justDoIt` removed; full control inventory in-file |
| `components/vendor/CommandBar.tsx` | **DELETED** |
| `app/(frost)/frost/canvas/sanctuary/page.tsx` | six glyph labels → `Rs`; sanctuary at **zero glyphs** |
| `lib/vendor/derive.ts` | stale consumer census corrected |
| `scripts/tdw07_p4b_body.proof.mjs` | §7 re-authored 9→4; §8 new (12 cells) — **76 → 83** |
| `scripts/tdw07_p3_portfolio.proof.mjs` | §3.1 split nav/classifier — **110 → 111** |

---

## 2 · TWO §0.2 STOPS — HELD, NOT ADAPTED AROUND

### (a) Item 4's labels are not seven copies of one string

The ruling reads *"labels → `Amount (Rs)` ×7"*. Derived at the tip, the seven glyph labels are **six distinct strings**:

```
  Advance (₹)                 Amount paid (₹)
  Advance agreed (₹, optional) Total (₹)
  Amount (₹)  ×2              Total amount (₹, optional)
```

Renaming all seven to `Amount (Rs)` collapses *Advance*, *Total* and *Amount paid* into one word. Lines `638/639` and `683/684` are **adjacent pairs** — that change puts two identically-labelled fields side by side meaning different things, on a couple-facing form.

**The ambiguity is mine.** My walk note called them *"seven `Amount (₹)`-class input labels"*; the ruling reasonably read the class name as the target string.

**What I did:** applied the approved substitution (glyph → `Rs`) while **preserving each label's noun**. This is strictly more conservative than the literal reading — it changes only what the founder approved changing, and invents no new noun. **The glyph cell still reaches zero**, which was the ruling's stated measure.

**If you meant them literally identical, say so and it is a one-line change.**

### (b) The budget bands are HELD, untouched

The ruling gives three labels. The code carries **five bands with filter values**, duplicated across **three files**:

```
  Under Rs 1L → 100000    Rs 3L – 5L  → 500000     (sanctuary:1110)
  Rs 1L – 3L  → 300000    Rs 5L – 10L → 1000000    (canvas discover:57)
                          Rs 10L+     → ''         (demodiscover:50)
```

Three labels cannot be applied to five values without **deleting two filter options**. That is a change to what couples can filter by — behaviour, not copy — and no ruling authorises it.

**The glyph cell reaches zero without them**: the bands carry the L-form, not the `₹` glyph. So F-07.28's stated measure is met while its second half stays open.

**Shapes, for the chair:** (i) three bands, accepting the filter loss; (ii) five bands re-expressed in full register (`Under Rs 1,00,000` / `Rs 1,00,000 – 3,00,000` / `Rs 3,00,000 – 5,00,000` / `Rs 5,00,000 – 10,00,000` / `Rs 10,00,000+`); (iii) defer with the duplication filed as its own finding — **three copies of one filter list is a fourth instance of the block's standing disease**, and worth a number regardless of which shape wins.

### Still held from the walk-note rulings: the preview's footer string

The costume-class line is **removed** — it was both a false promise and its condition is now dead (with no cap, `approved > displayed` can never be true). **No replacement shipped**, because the gap wants vendor-facing copy and copy is your veto.

The gap is real: a vendor with nine approved photos sees **one** in the preview and is told nothing. Proposals, none shipped:

1. `This preview shows your first photo. Couples swipe through all of them on your card.`
2. `Couples see all 9 of your approved photos — swipe on the real card.`
3. `First photo shown. Your card carries every approved photo.`

A silent gap is not worse than a false promise, which is why the old line goes now rather than waiting.

---

## 3 · WHAT THE CHARTER DIDN'T KNOW

**The path authority was three files, not two.** `layout.tsx:88` names `BottomNav::modeFromPathname` as a third copy. It was **correct** (prefix-based, agreeing with the pager) — and retired anyway, because two correct copies are still two copies, and the third copy is what shipped the defect. All three now consume the leaf.

**The payload delta contradicts P3's stated reason for the cap.** Fork 7(b) capped at five because *"quadrupling every card's payload is the jank the spec's own measure exists to catch."* Derived at this tip:

- JSON delta is **URL text**: a 20-vendor page moves ~11.7KB → ~46.9KB of photo URLs, worst case (every vendor at the 20-photo ceiling).
- **Image bytes do not move on card load.** The deck preloads a rolling window of two (`canvas:652`) and always did — so "quadrupling the payload" described bytes the deck was never fetching.
- The real cost is **per-swipe**, not per-card.

**The founder's overturn is better founded than the cap was.** The jank surface is a walk step, not a bench.

**The card layer inherits the larger set cleanly** — confirmed by command: `:671`'s bound is `photos.length`, and `:808`'s `ImageDots total={photos.length}`. Both follow without change. *A vendor at the 20-photo ceiling will render 20 dots;* that is an affordance question for P6's pager, named not fixed.

---

## 4 · PROOF

### Both-ways, non-vacuous — 17 mutations of production code, all restored byte-identical

**dream-os (73/73):** cap secretly restored → 70 · constant re-exported at a sentinel → 72 · demo leg re-capped → 72 · gate string reverted → 70 · supersession record deleted → 72 · payload derivation blanked → 72 · shaper reorders → 72.

**dreamos-pwa (83/83):** Header's list restored → 82 · a route drops out of the leaf → 82 · pager index becomes a 4th opinion → 82 · pager-inert removed → 82 · CommandBar resurrected → 82 · unvetoed footer string slipped in → 82 · glyph label creeps back → 82 · **BottomNav re-authors, two spellings** → 82 each.

### Floors

**dream-os — 84 exit-0.** `b07_p4b_body` **73/73** · `b07_p3` 52/52 · known-reds exactly two (`meter` 28/29, `f0555` 22/23) · three credential-gated scripts declining by design.

**dreamos-pwa — all seven green.** p1 35/35 · p2 42/42 · p3 **111/111** · p4a 63/63 · slice1 24/24 · probe 27/27 · **body 83/83**. **`tsc` ZERO** on a cleared `.next`.

---

## 5 · WHAT I GOT WRONG — three, all caught here

1. **I wrote the same defect for the third time in this block.** A new cell read raw text for `rate_min is required` and failed — because the cure's own comment quotes the placeholder it replaced. Prose read as mechanism: identical to §3.4 last sitting, **with `codeOf()` sitting twenty lines above it in the same file.** Cured, and re-aimed at something worth asserting (the old cell was a restatement of its neighbour).

2. **§8.4 pinned a variable name, not a property.** It asserted BottomNav carried no `pathname.startsWith(...)` classifier. A mutation re-authoring the same logic with `p` instead of `pathname` passed **GREEN**. The cell must assert the *shape that must not exist*, not one spelling of it — now checks for any function or arrow declaration, and reddens on both spellings.

3. **A comment insert broke a sentence in `derive.ts`** and I shipped it mid-paragraph before re-reading. Caught on inspection, re-sited.

**And one process note, not a defect:** `§7` collapses **9 cells → 4**, disclosed rather than padded. Every one read `code(BAR)`; the bench crashed ENOENT on its first run after the deletion, which forced the amendment. Asserting the internals of a deleted file is impossible, and nine hollow greens would be worse than a smaller true section — the floor-method law.

---

## 6 · THE WALK CARD

**Deploy dream-os first** (the shaper's payload feeds the card), then Vercel.

**1 · The pill.** Open **Discover Profile**. The top pill must read **DISCOVER**, not STUDIO. Tap into the preview and come back — still DISCOVER. → *F-07.30, the founder-found miss.*

**2 · ★ YOUR DEVICE — the swipe no longer escapes.** In the preview, swipe left and right. **You should stay on the preview.** It must not slide to AI chat. → *§2(b); the preview is single-photo by ruling, so the swipe does nothing — which is the point.*

**3 · ★ YOUR DEVICE — the jank witness, the sitting's one real unknown.** Open the **Frost feed** on Swati's card and swipe horizontally through **all nine** photos, then back. Watch for stutter on the 4th–9th. → *the cap is gone; no bench can witness whether nine feels as smooth as five. If it stutters, that is a finding and the cap's ghost has a case.*

**4 · The card carries them all.** Count the dots under her card — there should be **nine**, not five.

**5 · The command bar is gone.** Open **AI chat**. No bar, no counters, no JUST DO IT. Confirm you can still reach **Leads** (Business tab → it lands on leads), **Discover Profile** (drawer → *How couples see you*), and **Calendar** (bottom nav). → *every route the bar owned, proven to survive before deletion.*

**6 · The gate string.** On a vendor with no rate set, try to request Discover. It must read exactly: **"Add your starting rate to request Discover."**

**7 · The labels.** Open **Sanctuary**'s money forms. Every amount label reads **`Rs`**, never `₹`. Note the nouns are preserved — `Advance (Rs)`, `Total (Rs)` — per §2(a); tell me if you wanted them all `Amount (Rs)`.

**8 · The budget filter is UNCHANGED** — still five bands, still reading `Rs 1L – 3L`. That is the held §0.2(b), not a miss.

---

## 7 · NEXT SITTING

§2(a)'s label question · §2(b)'s bands + the three-copy duplication finding · the preview footer string · **P6 inherits the shared pager** (one home, both mounts — the affordance gap this sitting deliberately did not close) · the 20-dot question · F-07.32 (the Discover Profile's score mirror) · F-07.29 → Block 08.
