# TDW_09 · SITTING 1 · PAPER 3 — THE TOKEN CANON PROPOSAL

**Base:** dreamos-pwa `e3210b5`. **Authority:** kickoff · CE ruling R-U9 (F2 arm (a)+(c) ratified) · R-U4 (money register).

---

## 1 · THE OPENING LINE

> **Two hundred and twenty-six distinct hex literals, two thousand one hundred and twenty-five occurrences, across five competing palette homes, none of which is authoritative and one of which is guarded by a pointer to a file that does not exist.**

## 2 · THE FIVE HOMES, DERIVED

| # | Home | Scale | Shape |
|---|---|---|---|
| 1 | `app/globals.css` | **454** custom-property declarations | `--atelier-*`, `--bg-*`, `--ink-*`, `--border-*` — three theme blocks plus an `!important` override at `:978` |
| 2 | `app/globals-v2.css` | a second, *semantic* set | `--surface-base/card/raised/discovery`, `--ink-primary/secondary/muted/whisper/inverse`, `--accent(-hover/-border/-focus)` |
| 3 | `lib/vendor/tokens.ts` | `COLORS`, `FONTS`, `FONT_WEIGHTS` | 6 colours, hand-mirrored |
| 4 | `lib/frost/tokens.ts` | a fourth set | couple lane |
| 5 | **per-file JS palette consts** | the dominant idiom by volume | `const A = {…}`, `const T = {…}`, `const D = {…}`, bare `const GOLD = '#C9A84C'` — a fresh palette declared at the top of most surfaces |

Home 5 was invisible to the first census pass and is the reason P-B alone settles nothing: the literal in the file is a *variable name*, and the colour is one hop away.

Tailwind **v4** is installed (`tailwindcss ^4`, `@tailwindcss/postcss ^4`) with **no `tailwind.config.*`** — v4 is CSS-first. It is therefore not currently a palette home at all, which is why the canon is not built on it (R-U9's ratified reason: a Tailwind-only canon cannot be read by ~2,125 inline-style sites without rewriting all of them first, which is a cure, not a canon).

### 2.1 · **F-09.1 — THE PALETTE HAS NO HOME AND FIVE ADDRESSES**

No file is authoritative. `#C9A84C` appears 188 times as a literal *while also* being reachable through three named indirections. A change to the brand primary today requires 188 edits and cannot be proven complete.

### 2.2 · **F-09.2 — THE PALETTE'S STATED SOURCE OF TRUTH DOES NOT EXIST** *(chair-approved for mint, R-U8)*

`lib/vendor/tokens.ts` opens by naming its own authority:

> `SOURCE OF TRUTH: SESSION_BOUNDARIES_2026_05_12.md §154-181`
> `SESSION_BOUNDARIES §326-331: cross-repo imports are forbidden`
> `DO NOT MODIFY without a founder decision recorded in CONTEXT_AND_DECISIONS.`

`find` across **both repos** returns nothing for `SESSION_BOUNDARIES*`. Nothing for `CONTEXT_AND_DECISIONS` either. This is the path-over-range law's disease in terminal form: a cross-file pointer, cited by line range, to a file that is gone — and the comment still reads correctly while pointing at nothing. The estate's palette has been guarded for months by an instruction nobody can follow.

### 2.3 · **F-09.7 — THREE THEMES AGAINST ADDENDUM A'S RULED TWO**

`app/globals.css` declares `:root`, `html.theme-light`, and `html.theme-flair`, plus `html.theme-light *` with `!important` at `:978`. Addendum A rules exactly two vendor themes — **Midnight** and **Porcelain** — with espresso *deleted, not overridden*, and generic dark mode forbidden. The tree carries a third named theme and an `!important` sledgehammer that will defeat any token the canon introduces on that selector. The canon cannot land until this is reconciled.

---

## 3 · THE PROPOSAL — ONE HOME, TWO LAYERS

Per R-U9, **arm (a) + (c)**: custom properties as the runtime home; a thin typed re-export for the spec's export surface.

### 3.1 · Layer 1 — `app/tokens.css`, the single runtime home

Semantic names only, authored as two complete sets per Addendum A. Components never name a colour; they name a role.

```
surface-base · surface-raised · surface-sunken
ink-primary · ink-secondary · ink-muted · ink-inverse
accent · accent-hover · accent-contrast
hairline · overlay
positive · caution · critical · info
metal          /* display + badge only — never a text role */
```

`globals.css`'s three theme blocks collapse to two (`:root` = Porcelain, `[data-theme="midnight"]` = Midnight). `globals-v2.css`'s semantic set is the closest existing shape and is the migration's starting point rather than a competitor. The `html.theme-light *` `!important` block is **deleted, not overridden** — Addendum A's own precedent for espresso.

### 3.2 · Layer 2 — `lib/design/tokens.ts`, typed re-export

Plain exported consts, dependency-free, mirroring layer 1 one-for-one. This is the file the spec's §6 native-implications clause names as the seed of `@tdw/tokens`. It re-exports; it does not author. `lib/vendor/tokens.ts` and `lib/frost/tokens.ts` are retired into it, and F-09.2's ghost pointer dies with them.

### 3.3 · The palette, with every pair's ratio earned

Chair guidance binding: wedding-market warmth welcome; gold reserved for large display and accents, never body; body copy dark-on-light; a 4/8px rhythm; a ~1.2–1.25 type scale; one primary CTA per screen.

**PORCELAIN (default)** — Addendum A's ruled values, with the two corrections the audit forces:

| Role | Value | Against `surface-base` | Verdict |
|---|---|---|---|
| `surface-base` | `#F8F7F5` | — | house cream, unchanged |
| `surface-raised` | `#FFFFFF` | — | unchanged |
| `ink-primary` | `#0C0A09` | **18.9:1** | unchanged, passes everything |
| `ink-secondary` | `#4A4744` | **9.1:1** | new — a real secondary, not a dim |
| **`ink-muted`** | **`#6E6B67`** | **4.6:1** | **CORRECTS `#888580` (3.43:1, F-09.4)** — minimum change that clears AA |
| `accent` (oxblood) | `#5E1A24` | **10.8:1** | Addendum A's sole Porcelain accent; passes as text, as border, as CTA fill with cream on it |
| `hairline` | `#E2DED8` | 1.2:1 | non-text, correct as-is |
| **`metal`** (gold) | `#C9A84C` | **2.1:1** | **DEMOTED TO NON-TEXT.** Wordmark, Prestige badge, rule-lines. Never a text role. This is Addendum A's own ruling and P5.3's own rule; F-09.3 is 12 sites of it being ignored |

**MIDNIGHT** — Addendum A's values, ratios to be measured at build against the authored surface (`#0B1526`→`#0E1B2C` is a gradient, so the settling ratio is measured against the darkest stop, not the lightest — the conservative direction).

**The one deliberate demotion, stated plainly:** gold cannot be text. It fails 4.5:1 by a factor of two and fails even the 3:1 large-text bar. Every gold text byte in the estate is a legibility defect, and the spec has said so since 2026-07-14. The canon enforces it by *not giving gold a text role at all* — there is no token to reach for.

### 3.4 · Spacing and type

- **Spacing:** a 4px base with an 8px rhythm — `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`. Nothing between.
- **Type scale, ~1.25:** `12 · 13 · 16 · 20 · 25 · 31 · 39 · 49`, replacing 35 ad-hoc sizes.
- **Body floor 16px on mobile** with `line-height: 1.5` as the token default, curing 83% of declarations that set none.

**FORK T-1, founder's:** the spec's own DM Sans body sizes are **15 and 13** — both below the chair's 16px mobile floor. Arm (a) raise body to 16 and let the scale carry the label sizes down; arm (b) keep 15/13 and accept the floor breach as a house exception. **Recommendation: (a).** The founder's own complaint that opened this arc was legibility, and 15px DM Sans Light at 300 weight is the specimen. But the visual density of every existing surface changes with it, so it is his call, not mine.

---

## 4 · THE MONEY HOME (R-U4)

**F-09.6 — THE MONEY REGISTER IS BREACHED AT 53 GLYPH SITES, 8 SHORTHAND SITES, AND 12 COMPETING FORMATTERS.**

| Family | Emits | Sites |
|---|---|---|
| `fmtINR` | **`₹`** — violates the law | `admin/money:7` · `admin/dashboard:8` · `admin/subscriptions:8` · `admin/approvals:52` · `lib/frost/journey.ts:528` |
| `fmtRs` | `Rs ` — compliant | `components/vendor/slices/SliceRow.tsx:82` (exported) · `vendor/page.tsx:71` · `components/vendor/PeekNav.tsx:20` · `demo/vendor/[handle]/list/[slice]:29` |
| `rupees` | local | `components/vendor/CalendarDaySheet.tsx:66` |
| `formatRs` | compliant, **6 importers** | **`lib/vendor/format.ts:5`** |

L-shorthand in rendered bytes: `admin/demo:462` (`Rs 2L`) · `(frost)/frost/canvas/muse:127` · `components/shared/VendorProfileView.tsx:76` and `:196` · `components/vendor/TipsCarousel.tsx:112` · `lib/frost/budgetBands.ts:10`, `:11` (×2).

**PROPOSED PWA HOME: `lib/design/money.ts`, seeded from `lib/vendor/format.ts:5`'s `formatRs`** — it already exists, already emits the compliant register, and already has six importers, so the consolidation is a widening rather than a new invention. The eleven other formatters are deleted into it. The backend's `witnessLine.rupees` (`src/lib/moneyGuard.js:55` names it *"the CJS wire's one grouped money home"*) stays where it is per R-U4 — two homes by necessity, one per module system, each saying so in comment, F-06.85's mechanism-comment law applied.

Per R-U4 the mechanical re-format ships under standing law without per-site veto. **Two sites are not mechanical and go to the founder current-vs-proposed:** `lib/frost/budgetBands.ts:10–11`, where the L-shorthand is not a rendering of a number but the *name of a budget band* a couple selects — changing it changes what the band is called, not how a figure prints.

---

## 5 · SEQUENCING

The canon cannot land in one motion and should not try.

1. **`app/tokens.css` + `lib/design/tokens.ts` land empty of consumers** — additive, zero visual change, provable by screenshot identity.
2. **F-09.7's reconciliation** — the third theme and the `!important` block resolved by founder ruling. Nothing consumes tokens until this closes, because `html.theme-light *` will defeat them.
3. **F-09.4's `ink-muted` correction** — one token value, 42+ sites cured at once, the highest yield of any byte in this block.
4. **F-09.3's gold demotion** — 12 sites, admin-plane, no vendor-facing copy touched.
5. **The money consolidation** — twelve formatters to one, then the glyph sweep.
6. **The five homes retire into one**, surface by surface, in the founder's order.

Each is its own ZIP, smallest first, each with both-ways proof at the cured and uncured trees.

---

## 6 · FINDINGS MINTED IN THIS PAPER

**F-09.1** five palette homes, no authority · **F-09.2** `SESSION_BOUNDARIES_2026_05_12.md` ghost pointer guarding the palette · **F-09.6** money register breached at 53 + 8 sites across 12 formatters · **F-09.7** three themes against Addendum A's ruled two, plus an `!important` block that will defeat any token.
