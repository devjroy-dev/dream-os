# repo: dream-os · TDW_15 · P1 · ZIP 1 — β1, THE RECEIPT PHOTO GETS A DOOR

**Seat:** LE (executor) · **Rulings:** CE-34 · R-34.7 (β1, OCR refused) · R-34.11 (two ZIPs, dream-os first)
**Laws:** W-1 · R-31.2 · LD-8 (no migration) · R-33.1–.9 · D-10 · SQL-provenance · apply-verbatim · head-guard · shell-boundary
**Base:** `dream-os cbf801f` — fresh sibling-full clone, fetch-first, clean, tips matched at seating.
**Sibling untouched:** `dreamos-pwa 6107ff3` — zero bytes move in this ZIP.

---

## 1 · WHAT SHIPPED

| Path | State |
|---|---|
| `src/api/couple/receipts.js` | **the image door** + the extracted row builder |
| `src/lib/imagePipeline.js` | R-34.7's one granted export line |
| `scripts/tdw15_p1_receipt_image.js` | **NEW** — 24 cells, 6 mutations |
| `scripts/floor-manifest-tdw15-p1.txt` | **NEW** — F-14.16 declared-dirt manifest |
| `docs/handovers/TDW_15_P1_ZIP1_HANDOVER.md` | this file |

**NO MIGRATION.** `0088`/`0089` remain P2's and P5's reservations; the ladder tip stays `0125`. `couple_receipts.image_url` has existed since `0019` — this delivery writes a column that was always there and that no HTTP path could reach.

---

## 2 · THE GAP, AND WHY IT WAS NOT A UI GAP

The parity matrix calls G-3 *"`save_receipt` is partial"* and files it under *"Open, needs a door"*. It was more specific than that, and the specificity is the whole delivery:

```
src/api/couple/receipts.js  POST /:coupleId   — omits image_url entirely
src/api/couple/expenses.js  POST /:coupleId   — sets image_url: null, explicitly (:63)
src/agent/brideEngine.js    save_receipt      — the ONLY writer in the estate
```

`brideEngine.js` is a live WhatsApp engine (protocol §8) and Row 9's file (R-31.2). **So the bride could type an expense in her app and could not file the receipt for it, and the one path that could was reachable only by forwarding a photo to Mira.** Every other arm of P1 is UI-only; this one needed a door, and it is the only reason ZIP 1 exists.

---

## 3 · R-34.7's TWO REFUSALS, BUILT AS REFUSALS

**The muse pipeline is not called.** `processImageForMuse` runs Google Vision **and** a metered Haiku call to derive *aesthetic tags* — a vocabulary for a mood board. A receipt has no aesthetic. Paying two model calls to hang `blush` off a caterer's invoice is not a cheaper feature, it is a wrong one. The door calls `uploadBufferToCloudinary` alone.

**The OCR router is not called.** `imageOCRRouter.classifyImage` decides whether an inbound WhatsApp photo is a receipt, a moment or a muse save. It does **not** extract an amount, a vendor or a date — and nothing in this estate turns a receipt photo into typed fields on any plane. Wiring it would have invented a capability, not closed a gap. She files the photo and types the amount, symmetric with `save_receipt` itself.

Both refusals are asserted as absences with a **bounded radius** (R-33.3): the cells convict `src/api/couple/receipts.js` and nothing else, because `brideEngine` legitimately writes this column and `muse.js` legitimately runs the full pipeline. §5.3 is the control that keeps the absence non-vacuous.

---

## 4 · TWO THINGS THIS DELIVERY FOUND IN ITS OWN AUTHORING

**1 · The spread that would have handed a stranger her vault.** The row builder was first called `buildReceiptRow({ couple_id, ...req.body })`. Spread order is a **security property** here: with the body last, a client sending its own `couple_id` overwrites the authenticated one and writes into another couple's receipts. Caught while writing, cured to `{ ...req.body, couple_id }`, and pinned by cells 3.2/3.3 with mutations **M1a** and **M1b** — one per door, because the first draft's single anchor appeared twice and **R-33.4's uniqueness rule reddened it in this bench's own first run.**

**2 · A brace-naive matcher read the wrong argument list.** The security cell first matched `/buildReceiptRow\(\s*\{([^}]*)\}\s*\)/` — which truncates at the `{}` inside `...(req.body || {})` and reported **correct code RED**. Replaced with `argsOf()`, a paren-balanced extractor. A false red costs the same as a false green: both teach the reader to stop believing the bench.

---

## 5 · THE EXTRACTION, AND THE ODDITY IT DELIBERATELY DID NOT CURE

The image door files a receipt that also carries an amount and a vendor — the same five fields the typed POST already coerces. A second copy would be two homes for one row shape, so the coercion is extracted to `buildReceiptRow` and **lifted byte-unchanged**, including this:

```js
tags: Array.isArray(tags) ? tags : (notes ? [notes] : null),
```

`notes` becoming a one-element array **looks like a bug and is live shipped behaviour.** A UI sitting does not get to change a persistence rule while extracting it — that is how a refactor becomes an incident. It is named in the file, pinned by cell **6.4**, and mutation **M5** reddens if a later hand "tidies" it. Filed for the chair as a candidate finding, uncured by choice.

Cell 6.3 proves the extraction moved no behaviour **by execution, not by reading** — `buildReceiptRow` is pure, so the bench calls it and compares the row. That required a reach-in export, taken on `imagePipeline.js`'s own precedent and carrying its sentence.

---

## 6 · THE BODY LIMIT — route-scoped, and the alternative named

`core.js:28` mounts this router with no explicit limit, so it inherits the app default — far below a phone photo. Two precedents existed: muse raises the **whole router** to 12mb (`core.js:19`), `pages.js:73` scopes a limit to **one route**. The route-scoped form was taken: raising the ceiling for `GET` and `DELETE` buys nothing and widens what a body can cost. Cell 7.2 asserts the mount was **not** widened.

---

## 7 · BOTH-WAYS, THE ARITHMETIC

```
CURED  (cbf801f + this delivery)   24 passed, 0 failed
                                    6 mutations, 2 files, all sha256-restored
BASE   (cbf801f, bench copied in)   6 passed, 24 failed — TWENTY-FOUR NAMED REDS
```

**The six green at base are all declared CONTROL cells** — 1.3, 2.6, 5.1, 5.2, 5.3, 7.2 — and their staying green both ways is what makes the absence cells non-vacuous rather than decorative. **The uncured run reports, it does not crash** (D-4c error 2): every derivation lives inside a cell, and the six mutations report `anchor not unique (0 hits)` by name rather than throwing at module scope.

**Disclosed, because it is the honest reading:** cells **5.1 and 5.2 are GUARD cells, not cure cells.** `receipts.js` never called the pipeline or the OCR router, so they are green in both worlds. They defend R-34.7's refusal against a future hand; they are not evidence of this delivery.

---

## 8 · THE FLOOR

```
bash scripts/run-floor.sh --delivery scripts/floor-manifest-tdw15-p1.txt --check
  [F-14.16] --delivery mode: 4 dirty path(s), all declared
  [F-14.16] declared files unmoved — set and contents both verified
  FLOOR = NAMED BASE, no delta
```

**The 21-base does not move, exactly as R-34.10 ruled.** The base lists RED benches; the new bench is green, so the red set is unchanged and `scripts/floor-base.txt` is untouched. F-14.24's glob cure is **not** here — it is a `dreamos-pwa` file (`run-floor.sh:32`) and rides ZIP 2, per c-34.4.

The manifest ships **because a floor should be measurable before the commit, not after it.** It declares itself, as it must: it arrives with the ZIP and is dirt on the tree it measures.

---

## 9 · GATES

| gate | result |
|---|---|
| `node --check src/api/couple/receipts.js` | clean |
| `node --check src/lib/imagePipeline.js` | clean |
| `node --check scripts/tdw15_p1_receipt_image.js` | clean |
| apply chain rehearsed on a fresh clone | clean, three paths + manifest, no dotfiles |
| W-1 | shut — zero soul/prompt/lens bytes |
| R-31.2 | held — `brideTools.js`/`brideEngine.js` **0-line diff**, read only |
| LD-8 | held — no migration minted |
| R-33.7 | held — executor git read-only throughout |

---

## 10 · CARRIED FORWARD

- **ZIP 2 (pwa) is next and is the larger half:** create · edit · the unlabelled done toggle · remove-with-confirm · `fetchEvents('all')` + grouping · the photo affordance calling this door · `+ Ask Mira` (founder override of R-34.13's KEEP, radius **A** — this button only) · F-14.24's glob cure · the matrix ticks · `tdw09_frost_parity §3.1`'s labelled re-baseline off **169** · `tdw13_d6_parity_matrix` cell 4a re-authored.
- **Unruled, therefore unbuilt:** `expenses.tsx:225` (*"Forward receipt images to Dream Ai on WhatsApp"*) goes half-false once this door has a surface. Named at the veto, not answered, so it ships byte-untouched.
- **For the chair to mint or decline:** the `tags`-from-`notes` oddity (§5).
- **F-15.5 stands** — POST silently falls back to `kind='other'` while PATCH 400s the same vocabulary. Not mine; ZIP 2's create sheet sends only recognised kinds and a cell pins it.
- **The walk card is authored after ZIP 2**, from the three pasted fixtures, in the order derived at read-first: each step creates its own precondition. **P1.2 leads it** — five bookings, zero payments, a sheet that has never been used.

**Sequencing beyond this delivery is the founder's.**
