# TDW_09 · BLUEPRINT STAGE 3 · FORK PAPERS 2–4 — MUSE RENDERING · MODE CONTROLS · THE BASELINE CURE

**Base:** dreamos-pwa `e3210b5`. Mocks (F-4(a) standing law, self-contained, paths cited in-file): `docs/mocks/tdw09_muse_render.html` · `docs/mocks/tdw09_mode_controls.html` · `docs/mocks/tdw09_baseline_cure.html`.

---

## PAPER 2 — MUSE RENDERING (founder item 6)

**ONE QUESTION:** why does the Muse board render restlessly, and what layout discipline cures it? **FAILING OBSERVATION:** the cured mock still visibly reflows as images arrive.

**Derived at `app/(frost)/frost/canvas/muse/page.tsx`:** the board is CSS multi-column masonry (`:440` — `columns: '2 auto', columnGap: 8`) of cards whose images ship with **no reserved dimensions** — `:451` renders `<img … style={{width:'100%', objectFit:'cover'}} loading="lazy">` with no `aspectRatio` and no height. Two consequences, both mechanical: **(1) layout shift** — every lazy image pops in at its own natural height and the column layout re-balances, repeatedly, as she scrolls (the restlessness has a name: cumulative layout shift, and this is its textbook cause); **(2) reading-order break** — CSS columns fill top-to-bottom *per column*, so save №2 renders *below* №1 in the same column and the newest saves scatter vertically, not left-to-right. The imageless link-save card *does* carry `aspectRatio:'3/4'` (`:453`) — the estate already knows the cure and applied it to the one card type that never needed it. Link-saves open `enquire_link` via `window.open` (`:48`); the empty state exists with a next action (`:442` + the add flow at `:489`), correctly.

**THE CURE (one shape, three moves), mocked current-vs-proposed:**
1. **Reserve every image's box:** default `aspectRatio: '3/4'` on the image cell (matching the placeholder card's own ratio — one ratio, whole board), `objectFit: cover`; a skeleton wash until `onLoad`. CLS goes to ~zero by construction; no data-model change needed (a stored natural-ratio column is a later refinement, named, not required).
2. **Keep two-column masonry but flow it row-wise:** with a fixed ratio, plain `grid-template-columns: 1fr 1fr` gives row-major order (newest reads left-to-right) and the "masonry" look survives via the uniform ratio; true mixed-ratio masonry (the Pinterest look) is the fork's arm (b) — it keeps natural ratios via a stored dimension + JS row-packing, at the cost of the reading-order fix. **Recommendation: arm (a) uniform-ratio grid** — the board's job is *her* saves, scannable, not a Pinterest homage; arm (b) stays available if the founder wants the ragged look, and the mock shows both.
3. **Link-card treatment unified:** the 3/4 card gains the destination's plain-word label (information scent — the link's label predicts its destination), same ratio, same corner grammar as image cards.

---

## PAPER 3 — THE TWO-MODE-CONTROLS CONFUSABILITY (R-U17)

**ONE QUESTION:** can a vendor tell, at a glance, which pill changes *what the screen shows* and which changes *how Victor behaves*? **FAILING OBSERVATION:** in the mock's proposed row, the founder still has to read both to know which is which.

**The audit, from the estate's own mouth:** two segmented pills — **ModePill** (`components/vendor/BottomNav.tsx`, Studio·Discover — swaps the nav's item-set; switching to studio *navigates* to `/vendor/calendar`, `Header.tsx:77`) and **VictorModeChip** (Business·Advisor — changes the AI's room, server-persisted). `VictorModeChip.tsx:7–9` confesses the disease verbatim: *"It **BORROWS the Atelier pill styling** …"* — one dress, two organs. Stage 2's datum compounds it: both pills render *selection* state only (gold fill on the active segment) with no pressed feedback, so the two controls are identical in dress **and** identical in silence. The IA map's §4 datum rides in: the thing labelled *Studio* lands on the *calendar*, so even the pill that changes the screen mispredicts *which* screen — F-09.18's collision, whose route-side half died at R-X8, leaving the label-side half to this paper.

**THE PROPOSED DISTINCTION (mocked, both current and proposed):** controls that change **place** look like *tabs* (rectangular segments, ink-weight active state, no icon — the BottomNav's own visual family, since that is what they are); controls that change **the assistant** look like *a state chip* (single rounded chip showing the current room with the ✦ mark and a tap-to-swap affordance — a mode *indicator you can flip*, not a place picker). Same information, two silhouettes, zero shared dress. Label fork riding the veto: Studio·Discover → the founder's word (the paper proposes **Work · Storefront** as plain-speech candidates, current-vs-proposed in the mock; "Studio" cannot survive as a label that opens the calendar). Both controls inherit the F-09.21 pressed primitive when the canon lands.

---

## PAPER 4 — F-09.16 · THE LANDING BASELINE CURE

**ONE QUESTION:** by how many pixels, and by what mechanism, do same-line letters sit on different planes — and does one rule cure the class? **FAILING OBSERVATION:** the founder's two screenshots (the F-1(c) smoke below) disagree with the computed deltas' direction or visibly exceed them.

**Metrics derived by command** (`@capsizecss/metrics`, the published font-table values; the container cannot fetch the fonts themselves — the adjudicated environment limit — so the tables are the model and the founder's screenshots are the settling witness, exactly as F-1(c) ruled):

| Family | ascent | descent | capHeight | xHeight | normal line-box (em) |
|---|---|---|---|---|---|
| Cormorant Garamond | 924 | −287 | 625 | 386 | 1.211 |
| DM Sans | 992 | −310 | 700 | 504 | 1.302 |
| Jost | 1070 | −375 | 700 | 460 | 1.445 |
| Italiana | 928 | −250 | 700 | 500 | 1.178 |

**Mechanism A, computed at the worst verified site** — `app/(landing)/page.tsx:795–797`, the Instagram row (`alignItems:'center'`): the input (DM Sans 15, `padding:'8px 0'`) centers as a 35.5px box with its baseline 22.9px from box-top; the gold `Open IG →` (Jost 9) centers as a 13.0px box with its baseline 9.6px from box-top. Centers equalized, the baselines land **≈2.0px apart** — the link floats visibly above the handle's line. The phone rows (`:786`, `:839`, `:968`) repeat the class at ≈0.7px between dial code and digits, plus the 16px platform-emoji flag whose baseline is the device's to place (measured only by the smoke). **Mechanism B** (`:648`, `alignItems:'baseline'`): baselines genuinely align, but Cormorant's x-height (386) against Jost's letterspaced caps (700 cap at 7px) puts the *optical* mass on different planes — correct typography that reads wrong at a 20px-vs-7px ratio; the cure is spacing/size, not alignment.

**THE CURE, one rule wide, mocked before/after:** same-line text rows align on **`baseline`**, never `center`; every text node in a shared row takes the token line-height (1.5) so line-boxes agree; icons/emoji/glyphs in text rows sit in **fixed square slots** (`inline-flex`, explicit box, `translateY` trimmed once per glyph class) instead of participating in text alignment. Shipped as the canon **Row primitive** (the F-09.21 pressed primitive's sibling — one delivery), then the landing's rows adopt it inside the Opus sitting's single landing cure per the standing sequencing. Radius: the class spans landing + demo tease + demodiscover per the ruled F-3(b).

**THE FOUNDER'S TWO-SCREENSHOT SMOKE (F-1(c), before the cure is ruled):** ① the Instagram row on `request_maker` with anything typed — one screenshot, a horizontal line laid under the typed text's baseline (any ruler app, or a straight edge held to the screen photo); paste whether `Open IG →` sits above/on/below it. ② the phone row on the same screen, same reading for `+91` against the digits. Two screenshots, two words each; the computed table predicts *above by ~2px* and *above by ~1px* respectively — agreement seals the mechanism, disagreement reopens it.

## FINDINGS MINTED IN STAGE 3
**F-09.24** — `fmtINR` (₹) reaches vendors through the Hub's Your-Books sheet (`Cabinet.tsx:63`/`:65`, home `lib/vendor/cabinet.ts`) — the thirteenth money home, missed by F-09.6's census, vendor-facing. **F-09.25** — the Cabinet skin persists via `localStorage` (`:277`/`:303`) against the house guardrail that `VictorModeChip.tsx:7` obeys by name. **Next free: F-09.26.**

---
## PAPER 4 AMENDMENT — R-X24, THE SMOKE'S MEASURED FIGURES ARE THE ACCEPTANCE NUMBERS
The founder's two photos, chair-measured: specimen ① (`Open IG →`) **~5–6 CSS px above** the typed baseline · specimen ② (`+91`) **~1 px above**. Direction confirmed on both; **the model undershot ①** (computed ~2.0px) — the unmodeled remainder sits in the UA's internal single-line-input centring and the anchor's own line-box, candidates named, not asserted. The witness outranks the model: **5–6px and 1px are the acceptance numbers**; the cure (the canon Row primitive — baseline rows, shared line-height, fixed glyph slots) is magnitude-independent by construction, and acceptance is the same two rows re-shot after deploy with the small text **ON** the line. Gate open per R-X24: the primitive enters the token canon; landing-class sites ride the Opus single landing cure; mirror sites take the primitive per F-3(b).
