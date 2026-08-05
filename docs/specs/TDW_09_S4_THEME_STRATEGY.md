# TDW_09 · UX BLUEPRINT · THE THEME STRATEGY PAPER — AD-X2
### Every theme in both apps, measured · the four-bucket verdict · retain / modify / discard / new

**Base:** dreamos-pwa `e3210b5`. **Authority:** AD-X2 whole (the chair's design direction is this paper's starting position; departures carry evidence) · R-U16 by pointer (vendor pair ruled: Espresso + Editorial Paper, Navy retired — ground truth, re-argued nowhere) · the standing law over all buckets: **a theme is a measured artifact; nothing ships below AA on the core text roles, in any bucket, ever.**
**Mock (MODIFY entries' veto carrier):** `docs/mocks/tdw09_bride_themes.html` — reconstructed bride card, current vs proposed, measured ratios printed on the render.
**Instrument:** every ratio below computed by command (WCAG 2.1 relative luminance over alpha-composited values, this sitting's derivation run; reproducible from the sources cited per row).

**THE ONE QUESTION:** which themes stand, which are re-solved, which die — with every verdict carrying its measured reason.
**FAILING OBSERVATION:** any surviving theme renders a core text role below 4.5:1, or a reader of a discarded theme is found alive after its cure.

---

## 1 · THE INVENTORY — every set, where it lives, what reads it, its measured floor

### 1.1 · Vendor — `lib/vendor/theme.ts` (the trio) + `app/globals.css` (three contexts + the `:978` `!important`)

Readers: `lib/vendor/ThemeContext.tsx:78–79` toggles `theme-light`/`theme-flair` on `<html>`; `app/vendor/layout.tsx:80`/`:162` and `app/layout.tsx:103`/`:106` apply; the demo plane reads the same `--atelier-*` vars (`app/demo/vendor/[handle]/layout.tsx:16`) — **the demo has no dress of its own**, it wears whatever the vendor system wears.

| Set | Role on its page bg | Value | Measured | Verdict on the role |
|---|---|---|---|---|
| **DARK · Espresso** (`:35`, bg `#14100D`) | ink | `#F0E6D2` | **15.28** | AA |
| | inkSoft | α.65 | **6.88** | AA |
| | inkMute | α.45 | **3.87** | below body AA — the estate-wide mute disease (F-09.4's family), value-curable |
| | brassWarm / accent / accentText | | **10.44 / 6.45 / 8.28** | AA |
| **LIGHT · Editorial Paper** (`:69`, bg `#F5F2EE`) | ink | `#1A0F08` | **16.87** | AA |
| | inkSoft | α.80 | **9.60** | AA |
| | inkMute | α.58 | **4.48** | a hair under 4.5 — one alpha tick cures it |
| | brassWarm | `#9B6E1A` | **4.06** | below body AA; large-text/label only, or re-solved |
| | accent (oxblood-class) | `#7A3828` | **7.76** | AA |
| **FLAIR · Navy** (`:98`, bg `#101720`) | inkMute | α.34 | **2.72** | **FAIL** — and the theme is **ruled retired** (R-U16) |

### 1.2 · Bride / frost — `lib/frost/tokens.ts` (two authored sets, one switch, one drift)

The switch: `getV2Tokens(homeMode)` (`:147–148`), `'E1A'` → **Wine Night**, `'E3'` → **Sky & Ivory**; persisted at `:348`/`:362` via **`localStorage`** — the F-09.25 guardrail breach's bride-lane sibling, **F-09.26** minted below. **The founder's 「 white and navy filter 」 specimen is settled by this census: it is Sky & Ivory — a THEME (home-mode token set), not a content filter and not an overlay.** And the drift the chair predicted: `sanctuary/page.tsx` renders the switch as **31 inline `dark ?` ternaries** (`:3850` keys `dark = homeMode === 'E1A'`) whose literals have already diverged from the token file — `:870`'s `#1A0810` **appears nowhere in `tokens.ts`** — the theme-literal defect family (F-09.15's) live on the bride lane, **F-09.27** minted below. That is the "accidental third palette": not a third theme, but one theme's values forked into prose.

| Set | Role | Value | Measured | Verdict on the role |
|---|---|---|---|---|
| **Wine Night** (bg `#1E0A0E`) | ink | `#F5E5DC` | **15.50** | AA |
| | inkSoft | α.75 | **8.90** | AA |
| | inkMute | α.45 | **3.89** | value-curable (α.52 → **4.80**, solved this derivation) |
| | accent / signal | `#C4856A` / `#6B9E8F` | **6.25 / 6.26** | AA |
| **Sky & Ivory** (bg `#F0EEE8`) | ink | `#16243A` | **13.43** | AA |
| | inkSoft | α.75 | **6.40** | AA |
| | inkMute | α.45 | **2.67** | **FAIL** |
| | accent | `#4A7A9B` | **3.98** | below body AA |
| | signal | `#8B6E52` | **4.07** | below body AA |

### 1.3 · The semantic seed — `app/globals-v2.css`

`ink-primary` **17.64** AA · `ink-secondary` **7.24** AA · `ink-muted` `#888580` **3.43** (F-09.4's own token) · `ink-whisper` `#C8C4BE` **1.62 FAIL** · `accent` gold-as-text **2.13 FAIL** (F-09.3's law: gold gets no text role). The right *shape* (Paper 3 ruled it the migration seed) carrying three wrong *values*.

---

## 2 · THE VERDICT TABLE — every inventoried set, its bucket, one sentence

| Set | Bucket | The sentence |
|---|---|---|
| Vendor **Espresso** | **RETAIN** | AA-clean on every role but the estate-wide mute, which is a token value — R-U16's cure ground, actively read by every vendor and demo surface. |
| Vendor **Editorial Paper** | **RETAIN** | Structurally and measurably sound; two value ticks (mute α, brassWarm) ride the same R-U16 cure — nothing structural to re-solve. |
| Vendor **FLAIR / Navy** | **DISCARD** | Ruled retired at R-U16, fails AA on mute, and is a maintenance multiplier; deletion radius named: the `FLAIR` const, `ThemeContext:79`'s toggle, `app/layout.tsx:106`, `globals.css`'s `theme-flair` block, the demo layout's third-theme comment — each re-proven zero-reader at the cure's own tip per R-X6's discipline. |
| Frost **Wine Night** | **RETAIN** | It *is* the chair-directed "evening-dark partner in the romance register," already authored, AA everywhere but the one solved alpha — the direction arrived and found the theme waiting. |
| Frost **Sky & Ivory** | **MODIFY** | Two core roles fail measured AA and the chair's direction calls the default to warm; the token *architecture* is sound — re-solve the values into **Warm Porcelain** (proposed set below, every value pre-solved to AA), keep the structure, and route sanctuary's 31 ternaries onto `getV2Tokens` so the fork in prose dies with the re-solve (F-09.27's cure riding the same act). |
| `globals-v2` semantic set | **MODIFY** | The ruled migration seed with three wrong values: `ink-muted` takes Paper 3's `#6E6B67`-class cure, `ink-whisper` is re-solved or demoted to non-text, `accent` loses its text role per F-09.3 — values only, the shape ships. |
| `globals.css` `:root` + `theme-light` contexts | **MODIFY-FOLD** | Not themes but the themes' CSS transport — collapse into the canon's two-set home per Paper 3 §3.1, the `:978` `!important` deleted-not-overridden (F-09.7's standing cure). |
| Demo plane's dress | **RETAIN-WITH-VENDOR** | It reads `--atelier-*` and owns nothing; it inherits every vendor verdict automatically and gets no row of its own beyond this sentence. |
| **NEW** | **NONE** | Both apps land at exactly two themes each (vendor Espresso+Paper · bride Warm Porcelain+Wine) — the cap is met without minting, and no unmet audience need was found that a fifth palette would serve. |

**PROPOSED WARM PORCELAIN (the MODIFY's target values, each measured before proposal — the mock renders them):** bg `#F6F1EA` · ink `#241712` (**15.49**) · inkSoft α.80 (**8.52**) · inkMute α.62 (**4.69**) · accent deep-rose `#8E2F44` (**7.08** — the jewel earning its ratio) · Wine's mute companion-cure α.45→.52 (**4.80**). Every word and value rides the founder's veto from the reconstructed-screen mock, per the mock-fidelity law.

**SYSTEM-FOLLOW, proposed as a FEATURE:** each app defaults to its pair's light/dark by the device's `prefers-color-scheme`, override persisted **server-side** (`vendors.theme` per Addendum A's own persistence ruling; the frost equivalent replaces the localStorage key — F-09.25/.26 die in the same act). The switch itself sits settings-grade per AD-X1: discoverable, never competing with primary navigation.

## 3 · FINDINGS MINTED
**F-09.26** — frost's home-mode persists via `localStorage` (`lib/frost/tokens.ts:348`/`:362`), the F-09.25 class on the bride lane. **F-09.27** — sanctuary's theme rendered as 31 inline `dark ?` ternaries with literals already diverged from the token file (`:870`'s `#1A0810` ∉ `tokens.ts`) — the theme-literal family live; cure rides the Sky→Warm-Porcelain re-solve. **Next free: F-09.28.**
