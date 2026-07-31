# TDW_07 P4b-FINAL — EXECUTOR HANDOVER

*(MICRO-2 is absorbed into this delivery per the P4b-FINAL charter; its items ship unchanged and are marked below.)*

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

## 1b · P4b-FINAL — THE CAROUSEL, AND WHAT IT COST TO GET RIGHT

### The founder's contract, and why P4b's preview was wrong

> *"the entire reason to have see what couples see is to give the vendors the preview of a full bleed photo carousel, made up of their images… the right mechanics is full bleed image — tapping reveals the card — tapping outside card area removes it."*

P4b shipped a **still**: `photos[0]` as a CSS background, card permanently open, no paging. Every parity cell was green, because they asked *"do both mounts run the same component over the same shaper?"* — and they did. **The carousel lived one layer above the component**, in the canvas's card layer, and the preview re-created that layer as a static image.

That is CE-116's second clause landing on the sitting that produced it.

### What was extracted, and the boundary

`lib/frost/photoPager.ts` — the six gesture constants, the haptic, `classifyGesture`, `photoStepFor`, and `usePhotoPager`. `components/shared/ImageDots.tsx` — the position indicator.

**The deck's verbs were enumerated before any byte moved** (clause 2 applied to itself). Eight verbs; **three are shared** (tap-toggle, horizontal paging, swipe-down dismissal) and **five stay at the deck** (vendor paging up/down, Muse double-tap, the sheet's drag handle, blind mode). A vendor has no next vendor and no Muse to save himself into. The boundary is stated in the file rather than left to be rediscovered.

### The three-part gesture proof, as the chair restated it

- **(a) Every threshold identical at the new home** — `tdw07_p1 §4.1` pins all six by value (`45 · 0.3 · 10 · 250 · 280 · 80`), and §4.1b pins that the canvas declares **none** of them. That is stronger than the cell it replaces: a copy left behind at the old address would have satisfied the old form perfectly while letting the mounts drift.
- **(b) Chrome byte-diffed** — the `GlassOverlay` span is **2402 bytes at origin and 2402 bytes at this tree, byte-identical**, diffed anchored on the function. Ten gesture tokens, counts unmoved.
- **(c) The founder's deck walk** — walk step 7. Not yet witnessed, and no bench can substitute.

### F-07.33 — diagnosed, one candidate excluded, instrumented rather than closed

**The 503 is manufactured by our own service worker.** Every `.catch()` in `public/sw.js` synthesises `new Response('', { status: 503 })`. A `fetch()` only *rejects* on a network-layer failure; an HTTP error status resolves and passes through. From the page's side the two are indistinguishable, because **to the page, the service worker is the server**.

**Railway is excluded by derivation, not opinion.** `discover:1` is the `/discover` **page document** — a Next.js route served by Vercel (`app/(landing)/discover`). The SW's Railway branch keys on `railway.app`, `/api/` or `/admin`; a page document matches none, and Railway never serves that path. **A Railway cold start cannot produce that line.**

**The remaining candidate fits:** `install` calls `skipWaiting()`, `activate` purges *every* cache then `clients.claim()`s the live page. Requests crossing that handover can have `fetch()` rejected, find the cache just emptied, and get a synthetic 503. Both sightings sat beside an SW-update line.

**A fit is not a proof, so it is not closed.** Each synthetic response now carries `X-TDW-SW-Synthetic` naming its branch. The next sighting identifies itself: header ⇒ we made it; no header ⇒ real and upstream.

### §4 — the toasts, and the diagnosis behind them

The two vetoed lines ship byte-exact. The reason they exist: P4b's preview left **three of four controls inert**, and the founder read the screen as broken — correctly, because a screen where most taps do nothing *is* broken however defensible each gate was. It was also the same defect this block deleted the CommandBar for. *A tap that does nothing teaches nothing.*

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

**Deploy dream-os first**, then Vercel. **Hard-refresh once** after the pwa deploys — the service worker updates on load and F-07.33's instrumentation only exists in the new one.

**1 · The pill.** Discover Profile's top pill reads **DISCOVER**, not STUDIO. Into the preview and back — still DISCOVER.

**2 · ★ The preview opens on a PHOTOGRAPH.** Tap "See your profile as couples do". You should land on a **full-bleed photo with no card** — just the PREVIEW ribbon, the back chevron, and the dots. → *the founder's contract; P4b opened with the card stuck open over a still.*

**3 · ★ THE CAROUSEL — the sitting's centre.** Swipe left and right across the photo. You should move through **all nine** of Swati's approved photos, cross-fading, with the dots tracking. No slide to AI chat. → *the deck's own mechanics, extracted and shared.*

**4 · ★ Tap reveals the card.** Tap the photo — the card rises. Tap the photo again (outside the card) — it goes. Swipe down over the card — it goes. → *"tapping reveals the card — tapping outside card area removes it", plus the deck's swipe-down dismissal mirrored.*

**5 · The controls now teach.** With the card up, tap **Enquire** → *"Couples tap this to message you on WhatsApp."* Tap **Circle** → *"Couples tap this to save you to their Circle."* **Lock Date stays disabled with no toast** — as it is on the live card. → *the three dead taps that read as "touch not working" are now three explanations.*

**6 · The back chevron and the @handle chip.** Confirm ‹ returns you to Discover Profile, and the `@Makeupbyswatiroy` chip opens Instagram. → *charter §7 — the answers belong in the record even though the pivot made the question secondary.*

**7 · ★ The deck itself still feels right.** On the **Frost feed**, swipe through Swati's photos, swipe up/down between vendors, double-tap to save, drag the overlay down. → *proof part (c). Parts (a) and (b) are green — every constant pinned at the new home, chrome byte-identical at 2402 — but only your thumb can witness that the deck survived the extraction.*

**8 · The command bar is gone.** AI chat: no bar, no counters, no JUST DO IT. Leads (Business tab), Discover Profile (drawer), Calendar (bottom nav) all still reachable.

**9 · The labels.** Sanctuary's money forms read **`Rs`**, nouns preserved — `Advance (Rs)`, `Total (Rs)`. Tell me if you wanted them all identical (§2(a)).

**10 · The budget filter is UNCHANGED** — five bands, still `Rs 1L – 3L`. The held §0.2(b).

**11 · F-07.33.** If `discover:1 … 503` appears again, open the Network tab and click that request. **A response header `X-TDW-SW-Synthetic` means the service worker manufactured it and no server was unhealthy.** No header means it is real and upstream. That header is what closes the finding.

**NAMED SKIP:** the gate string is not phone-witnessable — the submit form's own Next button is disabled on an empty rate (`submit/page.tsx:242`), which is correct design, so the server string is a backstop no UI path reaches. Its witness is `b07_p4b_body §5b.1`, proven by mutation.

## 7 · NEXT SITTING

§2(a)'s label question · §2(b)'s bands + the three-copy duplication finding · the preview footer string · **P6 inherits the shared pager** (one home, both mounts — the affordance gap this sitting deliberately did not close) · the 20-dot question · F-07.32 (the Discover Profile's score mirror) · F-07.29 → Block 08.
