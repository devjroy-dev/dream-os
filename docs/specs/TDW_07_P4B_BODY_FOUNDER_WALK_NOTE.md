# NOTE TO CE — P4b BODY, THE FOUNDER'S WALK

**From:** Opus-LE (P4b BODY seat) · **Date:** 2026-07-31
**Tips walked:** `dream-os 157af5f` · `dreamos-pwa 4e806ef` — the pushed tips, verified byte-identical to delivery before this investigation began.
**Status:** the walk **PASSED on every step I authored**. The founder then found three things no cell in either harness could have caught. Two of the three are mine. None is ruled; all three need the chair.

---

## 0 · WHAT THE WALK CONFIRMED FIRST

The founder's screenshots witness, on device:

- **Copy ① renders** on Discover Profile, under the meter, at profile strength 100
- **The preview route loads** at `/vendor/discover/preview` — PREVIEW ribbon, back chevron, full-bleed photo, the card content over Frost glass
- **Parity of content holds**: `MAKEUP · DELHI` eyebrow, "Make Up by Swati Roy", the about line, the `@Makeupbyswatiroy` chip, Enquire / Lock Date (beta) / Circle — the shared renderer's exact inventory
- **The suppressed price holds**: no price renders, and Swati is `rate_display=false`. F1b's `starting_price` guard is correct on a real row.
- **My photo-arithmetic footer renders**: *"5 of your 9 approved photos appear on the card."*
- **The retirement is visible on the phone** — founder's words. F4 end to end.

**The mechanism shipped. What follows is about surfaces, not about the shaper or the renderer.**

---

## 1 · THE STUDIO PILL ON A DISCOVER ROUTE — **PRE-EXISTING, and P4b widens it**

**What the founder saw:** standing on `/vendor/discover/profile`, the top mode pill reads **STUDIO**.

**Diagnosis — this is a two-authority defect, the same disease F-07.15 killed one surface over.** Two files independently answer "is this path Discover?", and they answer differently:

| File | Method | Verdict on `/vendor/discover/profile` |
|---|---|---|
| `app/vendor/layout.tsx:93` `panelIndexForPath` | **prefix** — `pathname.startsWith('/vendor/discover')` | panel 2 = **DISCOVER** |
| `components/vendor/Header.tsx:55` `mode` | **enumerated allow-list** | falls through → **`return 'studio'`** |

Header's list carries `/vendor/discover/leads`, `/vendor/discover` (exact), and `/vendor/discover/submit`. It does **not** carry `/vendor/discover/profile`. The swipe pager believes you are on the Discover panel while the pill announces Studio.

**And the file disagrees with itself, which is sharper than the two-file split.** `Header.tsx:195` renders a drawer item — *Discover Profile · "How couples see you"* — whose handler is `router.push('/vendor/discover/profile')`. **The same component that sends the vendor to that route fails to recognise it when he arrives.** The push is at `:195`; the classifier that omits it is at `:55–:67`. This is not two files drifting apart over time — it is one file navigating somewhere its own mode logic does not know exists.

*(Method note: my first pass asserted `/vendor/discover/profile` was absent from `Header.tsx` outright. A verification grep found it at `:195` and I traced the hit before letting the claim stand. Absent from the **classifier**, present as a **navigation target** — the distinction is the finding.)*

**Enumerated by command, every vendor route and its pill verdict:**

```
  discover   /vendor/discover
  STUDIO     /vendor/discover/profile     ← wrong, pre-existing since P2
  discover   /vendor/discover/submit
  discover   /vendor/discover/leads
  STUDIO     /vendor/discover/preview     ← wrong, NEW — P4b minted this route
  discover   /vendor/portfolio
```

**Attribution, derived not asserted:** `Header.tsx` was last touched at `54ea9e3` (P4b **slice 1**, a prior seat) and appears **zero times** in my BODY commit's stat. The `/profile` mislabel predates this sitting — it has been live since P2 gave that screen its route. **But P4b adds the second instance**, because I minted `/vendor/discover/preview` without adding it to a list I had not read.

The preview's own screen hides the symptom — my mount is `position:fixed; inset:0; zIndex:60` and covers the header — so the pill is only visibly wrong on `/profile`, and on the return from the preview.

**Why I did not fix it:** the cheap fix is adding two strings to Header's list. That leaves **two authorities** and guarantees the third route minted into `/vendor/discover/*` is wrong again. The real cure is Header consuming the prefix test the layout already owns — one function, two callers, the F4/F-07.15 shape. That is a change to a shared chrome file on a live surface outside this sitting's fence, so it is **reported, not performed**.

**Recommended:** mint as a finding; cure by making `panelIndexForPath` (or a predicate extracted from it) the single authority both files consume.

**Adjacent, for the founder not the chair:** that drawer item's subtitle reads *"How couples see you"* and P4b's copy ① reads *"See your profile as couples do"* — two strings on the vendor's screens now saying nearly the same thing about two different destinations (the editor vs. the preview). Both are vetoed copy, neither is wrong, but they will read as a near-duplicate on the same phone. Flagged, not touched.

---

## 2 · THE PREVIEW SHOWS ONE PHOTO AND EATS THE SWIPE — **MINE, and it is a parity break**

**What the founder saw:** *"I can swipe any image. I just see this one image. Swiping left or right does nothing and swiping left takes me to AI chat."*

Two distinct defects, both mine, in one gesture.

### 2(a) — The live card pages photos. My preview does not. **This is an F1-b parity break.**

Derived from the canvas at the pushed tip:

- `page.tsx:763` — `const currentPhoto = photos[imageIdx] || null;`
- `page.tsx:670` — `nextImage()` advances `imageIdx` while `imageIdx < vendor.photos.length - 1`
- `page.tsx:746` — `if (dx < -SWIPE_THRESHOLD) nextImage(); else if (dx > SWIPE_THRESHOLD) prevImage();`

**A couple swiping horizontally on a card moves through all five photos.** My preview renders `vendor.photos[0]` as a static CSS background and holds no `imageIdx` at all. The vendor sees photo 1 and cannot reach photos 2–5.

**Why my benches went green over it.** They proved the two mounts share one *shaper* and one *renderer* — and they do; §3.1 asserts function identity, §2.5 asserts one renderer on the couple plane. But **the photo pager was never inside `VendorProfileView`.** It lives in the canvas's *card layer*, outside the `:416–:480` overlay content the ledger told me to extract. So the shared component genuinely cannot page, and every cell I wrote about parity was true about the layer I extracted while the layer I did not extract silently diverged.

**This is BENCHED-THE-MECHANISM-NOT-THE-AFFORDANCE (§10) in its exact form**, and I want to be precise about the lesson because "add a pager" understates it: my extraction boundary was correct per the ledger, but **the preview mount then had to re-create the card layer, and I built a static one without noticing the live one was interactive.** I never asked what the card layer *did*; I only asked what the overlay *contained*.

**My own footer sentence makes it worse, and that part is not a boundary question.** I wrote *"5 of your 9 approved photos appear on the card."* The number is **true** — five do reach the real card. But on a screen showing one photo with no way to reach the others, it reads as a promise the surface does not keep. **That is the costume class one surface over: fluent, accurate, and misleading.** It is the sentence a vendor would quote back when asking why his other photos vanished.

**Why I have not fixed it:** building a pager into the preview would be a **second implementation** of `imageIdx`/`nextImage`/`prevImage` — the precise disease F1-b exists to prevent, and the spec's §3 guardrail calls a second implementation anywhere a failed session. The honest cures are all rulings:

- **(i)** extract the card layer's pager into the shared component (or a sibling shared `VendorCardPhotos`) so both mounts page through one implementation — the F1-b-consistent cure, and the largest
- **(ii)** ship the preview single-photo **by ruling**, and rewrite my footer line so it describes the card rather than the screen — smallest, honest, but leaves a real behavioural gap between the two mounts
- **(iii)** defer the pager to P6, which the spec already says owns "in-card horizontal paging" — and rewrite the footer line in the meantime regardless

**I recommend the footer line be re-authored under any of the three**, because it is wrong *today* on the deployed surface and the copy is mine. **Founder's veto owed on the replacement string.**

### 2(b) — The preview leaks its horizontal swipe to the app pager. **The opt-out existed and I did not use it.**

`app/vendor/layout.tsx` runs a three-panel swipe pager — `STUDIO(0) · AI(1) · DISCOVER(2)` — and its comment says left-swipe on DISCOVER goes to AI. That is exactly what the founder hit.

The layout **already carries an opt-out**, at `layout.tsx:118`:

```
if (node.dataset && node.dataset.pagerInert === 'true') return true;
```

Its in-file provenance reads: *"TDW_04 A2.3 (founder phone smoke): explicit opt-out for row-level swipe surfaces… Without this the pager ate every row swipe and slid the whole panel instead."*

**The estate has already been bitten by this exact defect, cured it, and left a mechanism.** My preview page sets no `data-pager-inert`, so every horizontal swipe on it belongs to the app pager.

**The root cause is a read-first gap, and it is mine.** I minted a new full-screen route inside `app/vendor/layout.tsx` **without ever reading that layout**. The charter's ladder said "code READ-ONLY per the ledger's cites" and the ledger did not cite the layout — but authoring a new route into a layout is not covered by a ledger of cites, and I should have read the file I was mounting inside. I read the canvas I was extracting *from* with great care and never opened the shell I was building *into*.

**The cure is one attribute** (`data-pager-inert="true"` on the preview's root), and it is small enough that I could have shipped it — which is why I want it noted that I did **not**, because it is inseparable from 2(a): if the ruling extracts a pager, the preview needs the swipe *for its own photos* and the inert flag is what makes that possible. The two must be cured in one motion or the second cure fights the first.

---

## 3 · REMOVING THE COMMAND BAR FROM AI CHAT — **founder request; a control removal, so a ruling**

**Derived, by command:** `CommandBar` has exactly **one live mount** — `app/vendor/page.tsx:533`, which is `/vendor`, the AI panel (`layout.tsx:94` maps `/vendor` → panel 1 = AI). The only other occurrence is `DemoCommandBar`, a separate mock inside `app/demo/vendor/[handle]/studio/page.tsx` that shares no code.

**So "remove it from AI chat" is "remove its only mount".** The component becomes unreferenced unless it moves. That makes this a control-inventory question (CE-115), not a layout tweak, which is why it comes to the chair rather than into a ZIP.

**What the bar currently carries** (from the founder's own screenshot, expanded): ENQUIRY FOLLOW-UPS · INCOMPLETE PROFILES · DISCOVER PROFILE · HOT DATES LOCKED IN · JUST DO IT.

Note that **DISCOVER PROFILE is the row P4b just reduced to a link** under F-07.15. If the bar is removed from AI chat, that link disappears with it, and the vendor's route to Discover Profile from the AI panel goes too — worth weighing, since I explicitly declined to delete that row when its score died, on the grounds that a control is not removed because its data was wrong.

**A defect found while investigating this, worth its own number:** the **JUST DO IT toggle is already inert.** `justDoIt` is `useState(false)` at `page.tsx:480`, passed to the bar, and — derived by grep across `app/`, `components/` and `lib/` — read **nowhere except CommandBar's own styling** (`:332`, `:333`, `:334`, `:521`). It is never persisted, never sent to any endpoint, never consulted by any behaviour. **It is a live-looking switch that changes its own colour and nothing else.** That is F-07.13's dead-control class on the vendor's most-visited screen, and it stands regardless of how the removal is ruled.

**The three shapes, for the chair:**

- **(i) delete the bar and its component** — cleanest, and cheap now that JUST DO IT is known inert; but the DISCOVER PROFILE link and the four counters die with it, and the counters are the only place some of those numbers surface
- **(ii) move the bar to the STUDIO panel** — keeps every control, honours the founder's "not on AI chat", costs a siting decision about where it lands
- **(iii) keep the bar, remove only JUST DO IT** — does not answer the founder's request, but cures the dead control independently

**I did not build any of them.** The founder's sentence is a clear direction and I could have executed (i); I am reporting instead because removing five controls from a live surface on a founder aside, at the end of a sitting, with no ruling in the file, is exactly how scope becomes damage — and because the JUST DO IT finding materially changes the cost of (i) and the chair should price it before choosing.

---

## 4 · WHAT THIS SAYS ABOUT THE BENCHES — one honest reckoning

All 76 pwa cells and all 66 backend cells were green, on the deployed tip, while every defect above was live. That is not a bench failure in the sense of a wrong cell; it is the standing lesson landing a third time in three sittings (P3's affordance witness, P4a's three founder-found defects, now these).

**The specific gap worth carrying forward:** my parity cells asked *"do both mounts run the same code?"* — and the answer was yes and remains yes. They never asked *"does the live surface have behaviour the new mount lacks?"* A component-identity assertion cannot see a capability that lives one layer above the component. Any future extraction should carry a cell that enumerates the **interactive affordances** of the surface being cloned, not merely the elements — the control inventory law applied to *verbs*, not just to controls.

I would propose that as a standing amendment if the chair thinks it generalises, but it is the chair's to rule, not mine to adopt.

---

## 5 · WHAT I RECOMMEND, IN ORDER

1. **Rule 2(a)** — it is a live parity gap on a shipped surface, and my footer copy is actively wrong today. Fastest honest floor: re-author the footer string (founder veto) even if the pager is deferred to P6.
2. **Rule 2(b) with it** — one attribute, but only correct once 2(a) is decided.
3. **Rule §1** — mint the finding; cure by collapsing to one path authority rather than extending Header's list.
4. **Rule §3** — pick a shape; the JUST DO IT dead control wants a number either way.

Nothing built, nothing pushed. Zero bytes moved since the verified tips.
