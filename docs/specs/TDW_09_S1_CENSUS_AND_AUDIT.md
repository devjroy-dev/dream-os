# TDW_09 · SITTING 1 · PAPER 1 — THE SCREENS CENSUS + THE CONTRAST & LEGIBILITY AUDIT

**Base:** dream-os `b0d7822` · dreamos-pwa `e3210b5`, both re-derived at origin fetch-first.
**Instrument:** `tools/tdw09_census.py` (ships in this ZIP, runnable from any directory via `TDW_PWA` env).
**Authority:** TDW_09 Sitting 1 kickoff · CE ruling R-U8 (census method ratified whole).

---

## 1 · METHOD, AND ITS FAILURE MODES — DECLARED FIRST

Three passes, deliberately differing failure modes. **P-C is the sole settler. UNRESOLVED is never GREEN.**

| Pass | Derives | Failure mode, named |
|---|---|---|
| **P-A** route enumeration — filesystem walk of `app/**/page.{tsx,jsx,js}` | the surface list | silent zero on anything mounted outside the app router; blind to which layout wraps which group |
| **P-B** literal extraction — hex scan across `app`, `components`, `lib` | declared values | **the F-08.42 / F-08.46 class** — blind to values arriving via custom property, JS palette const, or provider; blind to cascade precedence |
| **P-C** span-resolved cascade — true ancestor containment + custom-property + JS-const resolution, per theme | the settling witness | cannot resolve runtime-conditional values, gradients, or image backgrounds; those emit **UNRESOLVED** |

P-A and P-B share a failure mode, so neither settles anything.

### 1.1 · THE INSTRUMENT'S OWN CONVICTION, DISCLOSED BY NAME

The estate has convicted three witnesses of not seeing what they were built to see (F-08.42's ancestor, F-07.95's regex, F-08.46's inverted census). **This instrument was convicted twice during its own construction, both times by hand-verification against source, both times rewritten rather than tuned:**

1. **The assumed root.** Draft 1 assumed a house-cream root background (`#F8F7F5`) where no ancestor declared one. Every light-on-dark atelier surface became a false failure — 996 of 1,517 pairs read FAIL. **Cure:** no assumed root. An undeclared ancestor background now yields UNRESOLVED.
2. **The depth counter.** Draft 2 tracked ancestry by a stack indexed on its own length rather than on DOM depth, so a `position:fixed` sibling's background leaked onto every later element. Caught by hand-reading `app/admin/collab/page.tsx:67`, where the instrument claimed `#555250 on #111111` and the source showed a `<div style={{marginBottom:28}}>` with no background at all — the `#111111` belonged to a toast four lines above. **Cure:** ancestry rewritten as true `[start,end]` span containment. That site now correctly reads UNRESOLVED.

Both drafts would have shipped a table full of confident wrong numbers. Named here because a census that does not publish its own conviction record is asking to be the fourth witness.

### 1.2 · THE THEME QUESTION

Custom properties are resolved per theme selector. `app/globals.css` declares **three** theme contexts — `:root`, `html.theme-light`, `html.theme-flair` — plus a `html.theme-light *` `!important` override at `:978`. `--atelier-ink` alone carries four distinct values (`:700`, `:730`, `:757`, `:978`). **Figures below are the `:root` pass.** Addendum A rules **two** vendor themes; see Paper 4, F-09.7.

---

## 2 · P-A — THE SCREENS CENSUS

**124 routed surfaces.**

| Lane | Surfaces | Who it serves |
|---|---|---|
| `admin` | 42 | founder / internal |
| `vendor` | 29 | vendor |
| `demo` | 20 | demo vendor + public tease |
| `(frost)` | 17 | couple |
| `coplanner` | 5 | couple's collaborators |
| `(auth)` | 4 | both, pre-login |
| `(landing)` | 3 | public |
| `circle` · `crew` · `demodiscover` · `privacy` | 1 each | couple's circle · crew member · public · public |

---

## 3 · P-B — THE LITERAL CENSUS (the token paper's opening line)

- **226 distinct hex literals**
- **2,125 hex occurrences** across `app`, `components`, `lib`
- **53 `₹` glyph occurrences** across 12+ routed surfaces
- **35 distinct declared font sizes**
- **454 custom-property declarations** in `app/globals.css`; a second semantic set in `app/globals-v2.css`
- **Five competing palette homes** — enumerated in Paper 4

The most-declared values: `#c9a84c` (188) · `#f8f7f5` (154) · `#888580` (140) · `#111111` (125) · `#e2ded8` (101) · `#ffffff` (95) · `#0c0a09` (86).

---

## 4 · P-C — THE CONTRAST AUDIT (WCAG 2.1 AA)

Body text 4.5:1 · large text (≥24px, or ≥18.66px at weight ≥700) and UI components 3:1.

| Lane | Surfaces | Pairs resolved | **FAIL** | UNRESOLVED |
|---|---|---|---|---|
| admin | 42 | 194 | **67** | 384 |
| vendor | 29 | 37 | **13** | 424 |
| demo | 20 | 19 | **4** | 315 |
| (frost) | 17 | 84 | **30** | 473 |
| coplanner | 5 | 0 | 0 | 41 |
| (auth) | 4 | 30 | **12** | 10 |
| (landing) | 3 | 35 | **3** | 25 |
| circle | 1 | 16 | **1** | 0 |
| crew | 1 | 13 | **6** | 3 |
| demodiscover | 1 | 7 | **5** | 18 |
| privacy | 1 | 0 | 0 | 0 |
| **TOTAL** | **124** | **435** | **141** | **1,693** |

**51 distinct failing colour pairs across 33 surfaces.** The UNRESOLVED column is four times the resolved column and that is the honest state of a tree with five palette homes — it is a declared gap, not a pass.

### 4.1 · THE FAILURE TABLE — worst by population

| Sites | Foreground | Background | Measured | Required |
|---|---|---|---|---|
| 29 | `#888580` | `#FFFFFF` | **3.68** | 4.5 |
| 13 | `#888580` | `#F8F7F5` | **3.43** | 4.5 |
| 13 | `#6A6967` | `#0C0A09` | **3.60** | 4.5 |
| 5 | `#C9A84C` | `#FFFFFF` | **2.29** | 4.5 |
| 5 | `#474544` | `#0C0A09` | **2.07** | 4.5 |
| 5 | `#464441` | `#1A1714` | **1.84** | 4.5 |
| 4 | `#5F5D5C` | `#0C0A09` | **3.02** | 4.5 |
| 4 | `#595756` | `#080608` | **2.81** | 4.5 |
| 3 | `#81807F` | `#FFFFFF` | **3.94** | 4.5 |
| 3 | `#E07B5C` | `#FFFFFF` | **2.93** | 4.5 |
| 2 | `#C9A84C` | `#F8F7F5` | **2.13** | 4.5 |

### 4.2 · **F-09.3 — GOLD IS BODY TEXT AT TWELVE SITES, AND THE SPEC ALREADY FORBADE IT**

`docs/specs/TDW_09_UIUX_FINAL.md` P5.3 carries the rule verbatim: *gold is never text (contrast law)*. It has never been enforced. Every site below is a live `<p>` or text node, hand-verified against source:

| Site | Size / weight | Ratio | Required |
|---|---|---|---|
| `app/admin/approvals/page.tsx:281` | 12 / — | 2.13 | 4.5 |
| `app/admin/approvals/page.tsx:338` | 8 / — | 2.29 | 4.5 |
| `app/admin/data/page.tsx:89` | 28 / 300 | 2.29 | 3.0 (large) |
| `app/admin/exploring/page.tsx:263` | 9 / 200 | 2.29 | 4.5 |
| `app/admin/featured/page.tsx:67` | 8 / 200 | 2.29 | 4.5 |
| `app/admin/featured/page.tsx:77` | 9 / 300 | 2.13 | 4.5 |
| `app/admin/money/page.tsx:27` | 11 / 300 | 2.29 | 4.5 |
| `app/admin/photos/page.tsx:120` | 8 / 300 | 2.12 | 4.5 |
| `app/admin/revenue/page.tsx:105` | 9 / 300 | 2.23 | 4.5 |
| `app/admin/revenue/page.tsx:108` | 20 / 300 | 2.23 | 4.5 |
| `app/admin/subscriptions/page.tsx:60` | 24 / 300 | 2.29 | 3.0 (large) |
| `app/admin/subscriptions/page.tsx:94` | 13 / 300 | 2.29 | 4.5 |

**Gold fails even the 3:1 large-text bar.** `#C9A84C` cannot be text on cream or white at any size. Three hand-verified specimens: `admin/money:27` renders `<p … color:'#C9A84C'>{sub}</p>` at 11px; `admin/subscriptions:60` renders `fmtINR(totalMRR)` in gold Cormorant at 24px; `admin/data:89` renders `totalLinks.toLocaleString('en-IN')` in gold at 28px. All admin-plane — the founder's own cockpit — which is why nobody has complained and why it has survived.

### 4.3 · **F-09.4 — THE HOUSE MUTED GREY FAILS BODY CONTRAST ON BOTH HOUSE BACKGROUNDS**

`#888580` — the `muted` token in `lib/vendor/tokens.ts` — measures **3.68:1 on white** and **3.43:1 on cream**. Required 4.5. **42 resolved sites**, and its 140 total literal occurrences mean the true population is larger than P-C could settle. This is the single highest-population legibility defect in the estate and it is a *token*, not a stray: the canon inherits it unless the canon changes it. A minimum-change cure that holds AA on `#F8F7F5` is approximately `#6E6B67`.

---

## 5 · THE TYPE AUDIT

**2,094 declarations carry an explicit `fontSize`.**

| Measure | Result |
|---|---|
| Distinct declared sizes | **35** — there is no scale |
| Below 16px | **1,657 (79%)** |
| Declarations with no `line-height` | **1,734 (83%)** |
| `line-height` present but below 1.5 | **208** |

Size distribution, top of the tail: **9px (434)** · 8px (257) · 13px (242) · 14px (155) · 12px (151) · 10px (146) · **7px (107)** · 22px (85) · 15px (78) · 18px (61) · 20px (55) · 11px (46) · 16px (45) · **6.5px (23)** · **6px (12)**.

Sub-16px density, worst surfaces: `(frost)/frost/canvas/sanctuary` (264) · `admin/control-room` (57) · `admin/approvals` (46) · `(landing)` (44) · `admin/demo` (44) · `vendor/portfolio` (44) · `vendor/collab` (40) · `(frost)/frost/canvas/muse` (39).

### 5.1 · **F-09.5 — NO TYPE SCALE, AND THE BOTTOM OF THE RANGE IS BELOW LEGIBLE**

Thirty-five sizes is not a hierarchy, it is an absence of one. The 6px / 6.5px / 7px band (142 declarations) is below the threshold at which a mid-range Android renders reliable stroke weight at all, and 83% of declarations set no line-height, so body measure and leading are the browser's default rather than a decision. The spec's P5.1 type scale (`Cormorant 44/32/24 · Jost 11/10/9 · DM Sans 15/13`) exists on paper and governs nothing.

**Note against the chair's guidance:** the chair's binding design note asks for body copy at a deliberate ~1.2–1.25 scale and 16px floor on mobile. The spec's own DM Sans body sizes are **15 and 13** — both below that floor. This is a real conflict between the spec's authored scale and the chair's guidance; it is a founder fork, stated in Paper 4 §5, not resolved here.

---

## 6 · RE-RUNNING THIS PAPER

```
TDW_PWA=/path/to/dreamos-pwa python3 tools/tdw09_census.py
```

Emits the summary line and writes the full per-surface record to `tools/census.json`. Every number in this paper is reproducible from that file. A cure nobody can re-run stops being a cure; so does an audit.

---

## 7 · FINDINGS MINTED IN THIS PAPER

**F-09.3** gold as body text, 12 sites, spec P5.3 unenforced · **F-09.4** `#888580` fails AA on both house backgrounds, 42+ sites · **F-09.5** no type scale — 35 sizes, 79% sub-16px, 83% no line-height.

Filed, not cured. Cures follow the founder's sequencing.
