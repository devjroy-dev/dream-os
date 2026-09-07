# TDW · pwa — THE COLOUR CENSUS: EVERY INK OUTSIDE THE FOUR

**CE-40 · 2026-09-07 · `dreamos-pwa` @ `bfa3197e` (origin/main, fetch-first)**
Investigation only. No product byte is written by this packet.

---

## 0 · THE HEADLINE, AND A CORRECTION TO THE KICKOFF

Three things were derived that change the shape of the cure.

**① Wine Night is not in the vendor shell.** The kickoff's premise — the couple lane's ink
bleeding across — does not hold at tip. The wrong-lane grep (§3) returns exactly one
crossing from `lib/frost/**` into the vendor scope, and it is `istDayKey`, a date function,
at `components/vendor/slices/SliceRow.tsx:16`. `SliceRow.tsx:175` records it in comment as
the first such crossing. **No Wine Night colour token is read anywhere under `/vendor/**`.**

**② The kickoff's citation for Wine Night is wrong.** `lib/vendor/tokens.ts` is 42 lines
long and holds six colours, none of them wine (`:9-16`). Wine Night lives in
`lib/frost/tokens.ts:88` (`V2_WINE_NIGHT`), and the `:399`-ish line the kickoff meant is
`lib/frost/tokens.ts:401`. Named so the record is straight.

**③ The oxblood the founder saw is the shell's own literal, authored deliberately.**
`components/worklist/WlToast.tsx:94`:

```
.wl-toast.err{background:rgba(74,22,22,0.96);border-color:rgba(224,112,112,0.4)}
```

`rgba(74,22,22,·)` is `#4A1616`. Composited at 0.96 over the Chalk page `#F3F4F4` it
renders **`#511F1F`** — the oxblood on the glass. The file's own paragraph at `:80-84`
states the intent in plain words: *the error variant's ground is dark red in BOTH modes.*
It was ruled in, not leaked in. The founder's specimen is therefore not a bleed to be
plugged but a **fifth colour to be repealed**, which is the ruling request at §7.

The path to it, derived: `SliceShell.tsx:454` fires
`showToast(… ?? 'Failed to create schedule', 'error')` on a failed `createSchedule`;
`SliceShell.tsx:392` binds `ToastView = WlToast`; `WlToast.tsx:63` maps `kind === 'error'`
to `.err`. The schedule create **failed** and the failure painted `#511F1F`.

---

## 1 · TOKENS FIRST — THE 33, AND THE THREE THAT ARE NOT IN THE FOUR

`lib/worklist/theme.ts:173` (GRAPHITE) and `:221` (CHALK). Both objects hold 33 keys;
`TOKEN_COUNT_EXPECTED = 33` at `:260`.

| token | Graphite | Chalk | family |
|---|---|---|---|
| `--atelier-bg` `page-bg` `header-bg` `section-bg` `sheet-bg` `overlay-bg` `sheet-top` `sheet-bot` | `#0F1011` `#141516` `#1A1B1D` `#171819` `#1D1E20` `#0A0B0C` `#232527` `#191A1C` | `#EDEEEF` `#F3F4F4` `#FFFFFF` `#E7E9EA` `#FFFFFF` `#17191A` `#F8F9F9` `#EDEFEF` | Graphite / Chalk |
| `--atelier-ink` `ink-soft` `ink-dim` `ink-mute` `ink-fade` `label` | `#EDEEEF` `#C8CACC` `#A3A6A9` `#888B8E` `#585B5E` `#B9BCBF` | `#0E1112` `#272B2D` `#3D4245` `#52585B` `#767C80` `#3A3F42` | Graphite / Chalk |
| `--atelier-card-bg` `card-border` `card-shadow` `row-hover` `grain` `input-bg` `sheet-border` `overlay` | translucent over `#F0F4F6` | translucent over `#17191A` | Graphite / Chalk |
| `--atelier-accent-text` | `#68C9B4` | `#0D6A5A` | **teal** |
| `--atelier-input-border` | `rgba(104,201,180,·58)` | `rgba(13,106,90,·68)` | **teal** |
| `--role-metal` | `#C9A84C` | `#8A6F2A` | **gold** |
| `--role-ink-on-metal` · `--role-today-coin-ink` | `#141516` | `#FFFFFF` | Graphite / Chalk |
| `--role-ink-deep` · `--role-scrim` · `--role-sheet` | `#0F1011` · `rgba(10,11,12,·62)` · `#1D1E20` | `#17191A` · `rgba(23,25,26,·38)` · `#FFFFFF` | Graphite / Chalk |
| **`--role-positive`** | **`#6FC98C`** | **`#2C7343`** | **NONE OF THE FOUR** |
| **`--role-caution`** | **`#DFAE6C`** | **`#8A5A18`** | **NONE OF THE FOUR** |
| **`--role-critical`** | **`#E8836B`** | **`#AE3A22`** | **NONE OF THE FOUR** |

**The four are not four.** The ratified token table already carries a green, an amber and a
red, at `theme.ts:213-215` and `:252-254`, in both modes, counted inside the 33 the shell's
own cell asserts. Any ruling that says *"the palette is four inks and nothing else"* repeals
three tokens that ship today and are read by live call sites (`SwipeRow.tsx:104`,
`BulkBar.tsx:42`, `SliceShell.tsx:1216`, `SliceRow.tsx:31-32`, `WlToast.tsx:96`).

**The brass IS the gold family — confirmed by hex, not by name.** `SliceRow.tsx:28-29` maps
`A.brass → var(--atelier-accent-text)` and `A.brassWarm → var(--atelier-label)`. So the
`TDW` chip's "brass" resolves to **teal** `#68C9B4` / `#0D6A5A`, not to `--role-metal`. The
name says brass; the hex says teal. The `REFERRAL` chip and the `TDW` chip are therefore the
**same ink**, and the distinction the kickoff assumed does not exist at tip.

### 1b · `--role-critical` HAS THREE HOMES WITH THREE VALUES

The sole-writer law is broken on every role token.

| home | selector | `--role-critical` dark | light |
|---|---|---|---|
| `lib/worklist/theme.ts:215` / `:254` | `.wl[data-wl-mode]` | `#E8836B` | `#AE3A22` |
| `app/globals.css:745` / `:829` | `:root` / `html.theme-light` | `#E07B5C` | `#BA4723` |
| `app/globals.css:1323` / `:1359` | appended `:root`/`html.theme-light` **`!important`** | `#E8836B` | `#AE3A22` |

The same split holds for `--role-positive` (`#7FBE85`/`#3E7A44` vs `#6FC98C`/`#2C7343`) and
`--role-caution` (`#E0A870`/`#9B5E22` vs `#DFAE6C`/`#8A5A18`). The `!important` layer at
`globals.css:1276` wins at runtime, so the middle row is **dead-but-present** — a value a
reader will find and trust. `--atelier-accent-text` diverges the same way: `globals.css:800`
declares it **`#C9A84C` (gold)**; `:1317` forces it to `#68C9B4` (teal).

### 1c · TWO MODE SYSTEMS, INDEPENDENTLY WRITTEN

`lib/vendor/ThemeContext.tsx:194` toggles `html.theme-light`. `WorklistShell.tsx:126` and
`WorklistBoot.tsx:113` write `.wl[data-wl-mode]`. Nothing makes them agree. Components that
read `useT()` as JavaScript (`Toast.tsx:11`) and components that read CSS variables
(`WlToast.tsx`) can render in opposite modes on one screen. §4 shows this doing damage.

---

## 2 · LITERAL COLOURS — THE COUNT

Command (comment-stripped before assertion; `&#NNNN;` HTML entities excluded — `AiDock.tsx:59`
`&#8593;` and one `&#9670;` are arrows, not colours):

```
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(" app components lib hooks \
  --include=*.tsx --include=*.ts --include=*.css
```

**Exclusion list, by path** (the couple lane and non-vendor surfaces):
`node_modules/` · `docs/` · `public/` · `app/(frost)/` · `app/(landing)/` · `app/(auth)/` ·
`app/circle/` · `app/coplanner/` · `app/crew/` · `app/consent/` · `app/r/` · `app/sign/` ·
`app/credits/` · `app/demo/` · `app/demodiscover/` · `app/admin/` · `app/api/` ·
`components/frost/` · `components/discovery/` · `components/demo/` · `lib/frost/` ·
`lib/circle/` · `lib/demo/` · `lib/admin/`. There is no `app/couple/` at tip.

| zone | code hits | in token-definition files | **at call sites** |
|---|---|---|---|
| **SHELL** — `app/vendor/(shell)`, `components/vendor`, `components/worklist`, `lib/worklist`, `hooks/vendor`, `*/solutions` | 377 | 68 | **309** |
| SHARED — `components/shared`, `lib/vendor` | 110 | 75 | 35 |
| LEGACY — `app/vendor/(legacy)` | 98 | 0 | 98 |
| STOREFRONT — `app/v` | 124 | 0 | 124 |

Of the shell's **309 call-site literals, 162 are LEAKS** — a hex that matches no member of
Graphite, Chalk, teal or gold in either mode. They are **38 distinct colours** across
**32 files**. The remaining 147 are token values restated as literals: correct colour,
wrong home, and they go dark the moment a token moves.

**Nine reds ship in the vendor shell. None of them is `--role-critical`.**

| hex | sites | where |
|---|---|---|
| `#7A3828` | 21 | ChatThread, Header, TipsCarousel, MessageBubble |
| `#E07B5C` | 14 | portfolio, couture, tds, calendar, SubscriptionCard, SettingsScreen, CalendarDaySheet, DetailSheet |
| `#E07070` | 10 | AddSheet, NotesBody, Toast, CalendarBlockSheet, CalendarDaySheet, SliceShell, BinderCard, BulkBar, WlToast |
| `#B42828` | 4 | NotesBody, CalendarBlockSheet, CalendarDaySheet |
| `#7A1A1A` | 2 | NotesBody, CalendarBlockSheet |
| `#5A1414` | 2 | Toast (light ground + shadow) |
| `#3C1414` | 1 | Toast (dark ground) |
| `#4A1616` | 1 | **WlToast:94 — the founder's specimen** |
| `#A12B2B` | 1 | ListRow:33 |
| `#B4453C` | 1 | wedding-pages:777 |

`#E07B5C` is the value `theme.ts:254` records as **replaced for failing contrast**
(`was #E07B5C -> 2.63:1`). Re-derived here: **2.66:1 on the Chalk page**, under the 3:1 UI
bar, live at fourteen sites.

---

## 3 · WRONG-LANE TOKENS — NIL

```
grep -rn -- "--wine\|--vibe\|--oxblood\|--bride\|V2_WINE\|frost/tokens\|FrostCtx" \
  app/vendor components/vendor components/worklist lib/worklist lib/solutions components/solutions
```

Three hits, all in `components/vendor/slices/SliceRow.tsx` (`:16`, `:168`, `:175`), all
`istDayKey` — a date function, no colour. **Zero Wine Night colour reads under `/vendor/**`.**

---

## 4 · TOASTS — WHICH TOKEN EACH VARIANT PAINTS, BOTH MODES

Two toasts ship. `useToast` (`hooks/vendor/useToast`) is the single home for state and
vocabulary; presentation is forked.

### `components/worklist/WlToast.tsx` — the shell's toast (SliceShell binds it at `:392`)

| variant | ground | dot | message ink | action ink |
|---|---|---|---|---|
| `success` | `var(--atelier-sheet-bg)` ✅ | `var(--role-metal)` — gold | `var(--atelier-ink)` ✅ | `var(--atelier-accent-text)` — teal ✅ |
| `error` | **`rgba(74,22,22,0.96)` LEAK** `:94` | `var(--role-critical)` | **`#F1EFEC` LEAK** `:99` | **`#F1EFEC` LEAK** `:103` |

**A correction to the kickoff.** It names three variants — `error`, `warn`, `ok`. The tree
has two: `hooks/vendor/useToast.ts:7` declares `ToastKind = 'success' | 'error'`, and
`:17` defaults to `'success'`. `WlToast.tsx:63`'s binary is therefore correct, not a
narrowing. There is no `warn` to paint and none is owed.

Composited, by command:

| mode | page | `.err` ground | ink `#F1EFEC` | if ink read `--atelier-ink` |
|---|---|---|---|---|
| Graphite | `#141516` | `#481616` | 13.05:1 | 12.89:1 |
| **Chalk** | `#F3F4F4` | **`#511F1F`** ← the specimen | 11.69:1 | **1.41:1** |

The `#F1EFEC` pin is load-bearing, and `:80-84` says so. It is a leak that is currently
holding a floor up.

### `components/vendor/Toast.tsx` — the legacy toast, **still mounted in five shell rooms**

`portfolio/screen.tsx:866` · `couture/screen.tsx:150` · `contracts/screen.tsx:1052` ·
`tds/screen.tsx:144` · `calendar/screen.tsx:733` · plus `NotesBody.tsx:130` and
`SettingsScreen.tsx:70`.

| variant | light ground | dark ground | border | message ink |
|---|---|---|---|---|
| non-error | `T.sheetTop` ✅ | **`rgba(20,20,18,0.95)` LEAK** `:35` | gold `rgba(201,168,76,0.35)` `:38` | `T.ink` / `var(--atelier-ink)` |
| `error` | **`rgba(90,20,20,0.96)` LEAK** `:34` | **`rgba(60,20,20,0.95)` LEAK** `:35` | **`rgba(224,112,112,0.4)` LEAK** `:38` | `var(--atelier-ink)` `:65` |

**F-04.75 IS LIVE AGAIN.** `Toast.tsx:56-64` records the cure for an unreadable refusal
sentence and states the mechanism it depends on: *"The dark theme's `var(--atelier-ink)` IS
`#F0E6D2`, so dark renders byte-identically."* The Graphite override layer moved that
variable. `globals.css:1347` now forces `--atelier-ink: #0E1112 !important` under
`html.theme-light`.

Measured at tip: the error ground composites to **`#601D1D`**; `#0E1112` on it reads
**1.53:1** against a 4.5 floor. **The refusal sentence is unreadable in light mode, in five
shell rooms.** This is F-06.85's mechanism-comment law doing exactly its job — the comment
named its donor, the donor moved, and the comment is now the evidence of the regression.
It is a legibility defect, not a taste note, and it outranks the colour question.

---

## 5 · STATE COLOURS

**Danger buttons already draw the way the chair's read proposes** — transparent ground,
hairline edge, `--role-critical` text. Derived, three sites:

| control | file:line | ground | edge | ink |
|---|---|---|---|---|
| Bulk action | `BulkBar.tsx:37-42` | `transparent` | `rgba(224,112,112,0.5)` LEAK | `var(--role-critical)` ✅ |
| `Yes — mark … lost` | `SliceShell.tsx:1213-1216` | `transparent` | `rgba(224,112,112,0.5)` LEAK | `var(--role-critical)` ✅ |
| `Cancel` / `Remove` confirm | `DetailSheet.tsx:93-96` | `transparent` | `rgba(224,123,92,0.4)` LEAK | `A.red` → `--role-critical` ✅ |
| Swipe reveal | `SwipeRow.tsx:104` | — | — | `var(--role-critical)` ✅ |
| `Remove` | `ListRow.tsx:33` | `none` | `none` | **`#A12B2B` LEAK** |

So the cure is narrow: **the ink is already right; the hairline is a literal.** Every one of
those hairlines is under the 3:1 UI bar:

| mode | edge | composited on sheet | edge contrast |
|---|---|---|---|
| Graphite | `#E07070@.5` on `#1D1E20` | `#7E4748` | 2.29:1 |
| Graphite | `#E07B5C@.4` on `#1D1E20` | `#6B4338` | 1.97:1 |
| Chalk | `#E07070@.5` on `#FFFFFF` | `#F0B8B8` | 1.71:1 |
| Chalk | `#E07B5C@.4` on `#FFFFFF` | `#F3CABE` | 1.50:1 |

**The chips.** `REFERRAL` and `TDW` both resolve to `--atelier-accent-text` — teal — via
`SliceRow.tsx:28`. Confirmed by hex: no chip reads `--role-metal`. The gold in the shell is
the coin, the seal and `WlToast`'s success dot.

**`stateColor()`** (`SliceRow.tsx:45-59`) is the one honest home: `booked`/`paid` →
`A.green` → `--role-positive`; `lost`/`overdue` → `A.red` → `--role-critical`. Tokens, both.

**A fifth grey, five times.** `var(--atelier-ink-mute, #8a8578)` at `SliceShell.tsx:1186`
and `:1220`, `BinderCard.tsx:341`, `BulkBar.tsx:48`, `FilterRail.tsx:38`. `#8A8578` equals
no token in either mode. Chalk: the token reads 7.23:1, the fallback 3.68:1. The fallback is
a silent downgrade; it should be deleted, not corrected.

**`#25D366`, seven sites** (`TipsCarousel.tsx:380-385`, `MessageBubble.tsx:251`,
`SliceShell.tsx:1069-1071`) — the WhatsApp brand green. This is the one leak with a defensible
claim: a brand mark is not a palette choice. **Ruling owed.**

**`A.brassLine: 'rgba(201,168,76,0.18)'`** (`SliceRow.tsx:30`, `studioShared.tsx:27`) is
Graphite's gold at 18% and **does not theme**. In Chalk, where `--role-metal` is `#8A6F2A`,
the hairline still paints `#C9A84C`. Every hairline drawn from `A.brassLine` is a wrong-mode
gold — and `rgba(201,168,76,·)` appears at **123 code sites in the shell**, 168 across
all four zones.

---

## 6 · RENDER, DON'T REASON — DECLARED GAP

**The shot arm did not run in this seat, and no capture is claimed.** Derived:
`node_modules/` is absent, no Chromium binary is present, `~/.cache/puppeteer` does not
exist, and the Chromium download host is not on this container's allowlist.
`tools/mock_shot.cjs` and `tools/wl_render.cjs` are present and unrunnable here.

A hollow green is worse than a declared gap. What was run instead is **alpha compositing and
WCAG 2.1 relative-luminance arithmetic against the ground each surface actually sits on** —
the method `theme.ts:12-15` uses on itself. Those numbers are the tables in §4 and §5. The
four named captures (invoice schedule toast · leads `Mark lost` · contracts `Cancel` ·
Storefront switch, both modes) are **owed** and are the first item of the cure packet's
floor, on a seat with the arm.

---

## 7 · THE RULING REQUEST

**The vendor shell does have an error colour: `--role-critical`.** The kickoff's premise —
*"today it has none of its own — that is why oxblood leaked"* — does not hold. It has one,
ratified, in both modes, at `theme.ts:215`/`:254`, read correctly by every danger *ink* in
the estate. What it does not have is a **ground**, and that is the whole of the leak: nine
reds exist because nine authors each invented a dark-red *background* for a red *foreground*
that was already ruled.

### The chair's read, tested against the tree

| the read | derived verdict |
|---|---|
| *error text in the ink family at full weight with a teal hairline* | **Refuse.** `--role-critical` already exists, ships, and reads 6.87:1 (Graphite) / 5.56:1 (Chalk) on the page. Repealing it to plain ink loses the only channel that distinguishes `Mark lost` from `Keep`, and a *teal* hairline on a destructive control paints danger in the affirmative accent. Recommend: **keep `--role-critical` as ink**, and rule it the *only* red. |
| *danger buttons as outlined ink — the estate already draws Cancel/Delete that way* | **Confirmed by derivation.** `BulkBar.tsx:37`, `SliceShell.tsx:1213`, `DetailSheet.tsx:93` all draw transparent-ground + hairline + `--role-critical`. The shape is already law in practice. Only the hairline literal needs curing → `color-mix` or a ruled `--role-critical-line` at one alpha, clearing 3:1. |
| *no toast in any colour but the surface's own, with teal for success* | **Endorse, with one amendment.** Rule the error toast to `--atelier-sheet-bg` with a `--role-critical` dot, edge and ink — this deletes `#4A1616`, `#5A1414`, `#3C1414`, `#E07070` and both `#F1EFEC` pins in one act, and it *cures* F-04.75 rather than re-pinning around it, because ink on the surface's own sheet is legible in both modes by construction. Amendment: **success should be gold, not teal.** `WlToast.tsx:95` paints the success dot `--role-metal` today and the founder has walked it; teal is the FAB and the active seat. |

### The four forks the chair must rule before any byte

1. **Are `--role-positive` / `--role-caution` / `--role-critical` inside the palette or
   outside it?** Three of the ratified 33 are none of the four. If the palette is literally
   four inks, this ruling repeals three shipping tokens and ~30 correct call sites. If it is
   *four families plus three state roles*, then §2's headline is 162 leaks against a
   **seven**-ink law, and the census cell must know that.
2. **`#25D366`.** Brand mark or leak.
3. **Does `warn` need to exist?** `ToastKind` is two-way today (`useToast.ts:7`), so
   `--role-caution` has no toast to paint. Either it stays a chip-and-banner-only role, or
   a third kind is minted — but not silently, and not by a seat.
4. **Two mode systems** (§1c). `html.theme-light` and `.wl[data-wl-mode]` are written
   independently. Every JS-token component (`Toast.tsx`, everything on `useT()`) reads one;
   every CSS-variable component reads the other. Until they are one, a cure applied to
   either can be undone by the other on the same screen — which is precisely how F-04.75
   came back.

**Sequencing note.** F-04.75's return (§4) is a live 1.53:1 refusal sentence in five shell
rooms. It is a legibility defect with its own evidence and does not wait on the palette
ruling. Recommend the chair sever it as its own finding and cure it first.

---

## 8 · THE CENSUS CELL THAT SHIPS WITH THE CURE (R-40.94 / R-40.105)

Owed with the cure packet, not with this census. Home: `tools/wl_audit.mjs`.

The cell reads `codeOf(file)` — comments stripped — and reddens on:
- any `#RGB`/`#RRGGBB`/`#RRGGBBAA`/`rgb()`/`rgba()`/`hsl()`/`hsla()` literal under
  `app/vendor/**`, `components/vendor/**`, `components/worklist/**`, `lib/worklist/**`,
  outside the two token-definition files;
- any identifier matching `/--wine|--vibe|--oxblood|--bride|V2_WINE/` in the same scope;
- any import from `lib/frost/**` that is not the named `istDayKey` allowance.

It must **exclude `&#\d+;`** — `AiDock.tsx:59` (`&#8593;`) and one other are HTML entities,
not colours, and a cell that reddens on them will be silenced rather than obeyed.

**Both-ways mutation proof required**: RED at `bfa3197e` (162 hits, the number above), GREEN
at the cured tree. A cell that has only ever been green has proved nothing.

---

## 9 · THE TABLE — EVERY LEAK, BY FILE:LINE

162 rows, grouped by colour, most-frequent first. Family is LEAK for all; the four-family
matches are the 147 restated-token literals and are not listed (they are a separate,
lower-priority class: right colour, wrong home).

| file:line | the colour | family | the surface it paints | proposed token |
|---|---|---|---|---|
| `components/vendor/ChatThread.tsx:172` | `rgba(122,56,40,0.40)` | LEAK `#7A3828` | `border: `0.5px solid ${T.isLight ? 'rgba(122,56,40,0.40)' : 'rgba(201,168,76,0` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/ChatThread.tsx:209` | `rgba(122,56,40,0.35)` | LEAK `#7A3828` | `border: `0.5px dashed ${T.isLight ? 'rgba(122,56,40,0.35)' : 'rgba(201,168,76,` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/ChatThread.tsx:215` | `rgba(122,56,40,0.85)` | LEAK `#7A3828` | `color: T.isLight ? 'rgba(122,56,40,0.85)' : 'rgba(201,168,76,0.8)',` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/ChatThread.tsx:252` | `rgba(122,56,40,0.35)` | LEAK `#7A3828` | `border: `0.5px dashed ${T.isLight ? 'rgba(122,56,40,0.35)' : 'rgba(201,168,76,` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/ChatThread.tsx:257` | `rgba(122,56,40,0.85)` | LEAK `#7A3828` | `color: T.isLight ? 'rgba(122,56,40,0.85)' : 'rgba(201,168,76,0.8)',` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/Header.tsx:381` | `#7A3828` | LEAK `#7A3828` | `const color = danger ? 'var(--role-critical)' : accent ? (isLight ? '#7A3828' ` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/Header.tsx:382` | `#7A3828` | LEAK `#7A3828` | `const glyphColor = danger ? 'var(--role-critical)' : isLight ? '#7A3828' : 'va` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/MessageBubble.tsx:212` | `rgba(122,56,40,0.08)` | LEAK `#7A3828` | `? 'rgba(122,56,40,0.08)'` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/MessageBubble.tsx:214` | `rgba(122,56,40,0.25)` | LEAK `#7A3828` | `border: `0.5px solid ${T.isLight ? 'rgba(122,56,40,0.25)' : 'rgba(201,168,76,0` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/MessageBubble.tsx:228` | `rgba(122,56,40,0.4)` | LEAK `#7A3828` | `? 'linear-gradient(180deg, transparent 0%, rgba(122,56,40,0.4) 25%, rgba(122,5` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/MessageBubble.tsx:228` | `rgba(122,56,40,0.4)` | LEAK `#7A3828` | `? 'linear-gradient(180deg, transparent 0%, rgba(122,56,40,0.4) 25%, rgba(122,5` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/MessageBubble.tsx:228` | `rgba(122,56,40,0.65)` | LEAK `#7A3828` | `? 'linear-gradient(180deg, transparent 0%, rgba(122,56,40,0.4) 25%, rgba(122,5` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/TipsCarousel.tsx:249` | `#7A3828` | LEAK `#7A3828` | `? 'linear-gradient(180deg, #9B4E38 0%, #7A3828 100%)'` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/TipsCarousel.tsx:253` | `rgba(122,56,40,0.12)` | LEAK `#7A3828` | `? { bg: 'rgba(122,56,40,0.12)', border: 'rgba(122,56,40,0.40)', color: T.accen` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/TipsCarousel.tsx:253` | `rgba(122,56,40,0.40)` | LEAK `#7A3828` | `? { bg: 'rgba(122,56,40,0.12)', border: 'rgba(122,56,40,0.40)', color: T.accen` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/TipsCarousel.tsx:256` | `rgba(122,56,40,0.18)` | LEAK `#7A3828` | `? { bg: 'transparent', border: 'rgba(122,56,40,0.18)', color: T.inkMute }` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/TipsCarousel.tsx:394` | `rgba(122,56,40,0.10)` | LEAK `#7A3828` | `height: 2, background: isLight ? 'rgba(122,56,40,0.10)' : 'rgba(201,168,76,0.1` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/TipsCarousel.tsx:401` | `#7A3828` | LEAK `#7A3828` | `? 'linear-gradient(90deg, #9B4E38, #7A3828)'` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/TipsCarousel.tsx:413` | `rgba(122,56,40,0.18)` | LEAK `#7A3828` | `border: `0.5px solid ${isLight ? 'rgba(122,56,40,0.18)' : 'rgba(255,255,255,0.` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/TipsCarousel.tsx:429` | `rgba(122,56,40,0.30)` | LEAK `#7A3828` | `? '0 4px 16px rgba(122,56,40,0.30)'` | `--atelier-accent-text` — terracotta, no home in the four |
| `components/vendor/TipsCarousel.tsx:441` | `rgba(122,56,40,0.30)` | LEAK `#7A3828` | `? '0 4px 16px rgba(122,56,40,0.30)'` | `--atelier-accent-text` — terracotta, no home in the four |
| `app/vendor/(shell)/calendar/screen.tsx:442` | `rgba(224,123,92,0.6)` | LEAK `#E07B5C` | `boxShadow: hotOn ? '0 0 6px rgba(224,123,92,0.6)' : 'none',` | `--role-critical` — this IS its retired light value |
| `app/vendor/(shell)/calendar/screen.tsx:462` | `rgba(224,123,92,0.6)` | LEAK `#E07B5C` | `boxShadow: '0 0 8px rgba(224,123,92,0.6)',` | `--role-critical` — this IS its retired light value |
| `app/vendor/(shell)/calendar/screen.tsx:586` | `rgba(224,123,92,0.5)` | LEAK `#E07B5C` | `boxShadow: '0 0 4px rgba(224,123,92,0.5)',` | `--role-critical` — this IS its retired light value |
| `app/vendor/(shell)/couture/screen.tsx:202` | `rgba(224,123,92,0.4)` | LEAK `#E07B5C` | `background: 'none', border: '0.5px solid rgba(224,123,92,0.4)', borderRadius: ` | `--role-critical` — this IS its retired light value |
| `app/vendor/(shell)/portfolio/screen.tsx:1448` | `rgba(224,123,92,0.4)` | LEAK `#E07B5C` | `border: '0.5px solid rgba(224,123,92,0.4)', borderRadius: 2, cursor: 'pointer'` | `--role-critical` — this IS its retired light value |
| `app/vendor/(shell)/portfolio/screen.tsx:1475` | `rgba(224,123,92,0.55)` | LEAK `#E07B5C` | `border: '0.5px solid rgba(224,123,92,0.55)', borderRadius: 2, cursor: 'pointer` | `--role-critical` — this IS its retired light value |
| `app/vendor/(shell)/tds/screen.tsx:245` | `rgba(224,123,92,0.4)` | LEAK `#E07B5C` | `border: '0.5px solid rgba(224,123,92,0.4)', borderRadius: 2, cursor: 'pointer'` | `--role-critical` — this IS its retired light value |
| `components/vendor/CalendarDaySheet.tsx:373` | `rgba(224,123,92,0.6)` | LEAK `#E07B5C` | `<span style={{ width: 5, height: 5, borderRadius: '50%', background: D.terraco` | `--role-critical` — this IS its retired light value |
| `components/vendor/CalendarDaySheet.tsx:490` | `rgba(224,123,92,0.4)` | LEAK `#E07B5C` | `<button type="button" onClick={() => void doCancel(ev)} style={pillBtn(D.terra` | `--role-critical` — this IS its retired light value |
| `components/vendor/SettingsScreen.tsx:549` | `rgba(224,123,92,0.4)` | LEAK `#E07B5C` | `background: 'transparent', border: '0.5px solid rgba(224,123,92,0.4)', borderR` | `--role-critical` — this IS its retired light value |
| `components/vendor/SubscriptionCard.tsx:396` | `rgba(224,123,92,0.4)` | LEAK `#E07B5C` | `border: '0.5px solid rgba(224,123,92,0.4)', borderRadius: 2, cursor: 'pointer'` | `--role-critical` — this IS its retired light value |
| `components/vendor/SubscriptionCard.tsx:412` | `rgba(224,123,92,0.4)` | LEAK `#E07B5C` | `border: '0.5px solid rgba(224,123,92,0.4)', borderRadius: 2,` | `--role-critical` — this IS its retired light value |
| `components/vendor/slices/DetailSheet.tsx:95` | `rgba(224,123,92,0.4)` | LEAK `#E07B5C` | `border: '0.5px solid rgba(224,123,92,0.4)', borderRadius: 2, cursor: 'pointer'` | `--role-critical` — this IS its retired light value |
| `components/vendor/slices/DetailSheet.tsx:141` | `rgba(224,123,92,0.4)` | LEAK `#E07B5C` | `background: deleting ? 'rgba(224,123,92,0.4)' : A.red,` | `--role-critical` — this IS its retired light value |
| `app/vendor/(shell)/portfolio/screen.tsx:290` | `rgba(12,10,9,0.72)` | LEAK `#0C0A09` | `background: 'rgba(12,10,9,0.72)', color: '#F8F7F5',` | `--atelier-ink-deep` / `--atelier-overlay-bg` |
| `app/vendor/(shell)/portfolio/screen.tsx:303` | `rgba(12,10,9,0.42)` | LEAK `#0C0A09` | `position: 'absolute', inset: 0, background: 'rgba(12,10,9,0.42)',` | `--atelier-ink-deep` / `--atelier-overlay-bg` |
| `app/vendor/(shell)/portfolio/screen.tsx:1039` | `rgba(12,10,9,0.55)` | LEAK `#0C0A09` | `background: 'rgba(12,10,9,0.55)',` | `--atelier-ink-deep` / `--atelier-overlay-bg` |
| `app/vendor/(shell)/portfolio/screen.tsx:1278` | `rgba(12,10,9,0.55)` | LEAK `#0C0A09` | `position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(12,10,9,0.55)',` | `--atelier-ink-deep` / `--atelier-overlay-bg` |
| `components/vendor/FilingChip.tsx:18` | `rgba(12,10,9,0.78)` | LEAK `#0C0A09` | `INK:       isLight ? 'rgba(12,10,9,0.78)'  : 'rgba(240,230,210,0.88)',` | `--atelier-ink-deep` / `--atelier-overlay-bg` |
| `components/vendor/FilingChip.tsx:19` | `rgba(12,10,9,0.50)` | LEAK `#0C0A09` | `INK_DIM:   isLight ? 'rgba(12,10,9,0.50)'  : 'rgba(240,230,210,0.55)',` | `--atelier-ink-deep` / `--atelier-overlay-bg` |
| `components/vendor/FilingChip.tsx:20` | `rgba(12,10,9,0.10)` | LEAK `#0C0A09` | `HAIRLINE:  isLight ? 'rgba(12,10,9,0.10)'  : 'rgba(240,230,210,0.14)',` | `--atelier-ink-deep` / `--atelier-overlay-bg` |
| `components/vendor/FilingChip.tsx:21` | `rgba(12,10,9,0.030)` | LEAK `#0C0A09` | `SURFACE:   isLight ? 'rgba(12,10,9,0.030)' : 'rgba(245,235,212,0.055)',` | `--atelier-ink-deep` / `--atelier-overlay-bg` |
| `components/vendor/FilingChip.tsx:22` | `rgba(12,10,9,0.25)` | LEAK `#0C0A09` | `PILL_EDGE: isLight ? 'rgba(12,10,9,0.25)'  : 'rgba(240,230,210,0.30)',` | `--atelier-ink-deep` / `--atelier-overlay-bg` |
| `components/vendor/FilingChip.tsx:23` | `rgba(12,10,9,0.70)` | LEAK `#0C0A09` | `PILL_INK:  isLight ? 'rgba(12,10,9,0.70)'  : 'rgba(240,230,210,0.75)',` | `--atelier-ink-deep` / `--atelier-overlay-bg` |
| `components/vendor/TierMeter.tsx:24` | `#0C0A09` | LEAK `#0C0A09` | `<div className="relative h-px flex-1 bg-[#0C0A09]/10 overflow-visible">` | `--atelier-ink-deep` / `--atelier-overlay-bg` |
| `components/vendor/TierMeter.tsx:32` | `rgba(12,10,9,0.45)` | LEAK `#0C0A09` | `style={{ color: capped ? '#B85C38' : 'rgba(12,10,9,0.45)' }}` | `--atelier-ink-deep` / `--atelier-overlay-bg` |
| `components/vendor/TierMeter.tsx:40` | `rgba(12,10,9,0.6)` | LEAK `#0C0A09` | `style={{ color: 'rgba(12,10,9,0.6)' }}` | `--atelier-ink-deep` / `--atelier-overlay-bg` |
| `app/vendor/(shell)/calendar/screen.tsx:441` | `rgba(240,230,210,0.2)` | LEAK `#F0E6D2` | `background: hotOn ? A.terracotta : 'rgba(240,230,210,0.2)',` | `--atelier-ink` @ alpha — the RETIRED cream ink |
| `components/vendor/ChatThread.tsx:230` | `rgba(240,230,210,0.6)` | LEAK `#F0E6D2` | `color: T.isLight ? 'rgba(26,15,8,0.62)' : 'rgba(240,230,210,0.6)',` | `--atelier-ink` @ alpha — the RETIRED cream ink |
| `components/vendor/FilingChip.tsx:18` | `rgba(240,230,210,0.88)` | LEAK `#F0E6D2` | `INK:       isLight ? 'rgba(12,10,9,0.78)'  : 'rgba(240,230,210,0.88)',` | `--atelier-ink` @ alpha — the RETIRED cream ink |
| `components/vendor/FilingChip.tsx:19` | `rgba(240,230,210,0.55)` | LEAK `#F0E6D2` | `INK_DIM:   isLight ? 'rgba(12,10,9,0.50)'  : 'rgba(240,230,210,0.55)',` | `--atelier-ink` @ alpha — the RETIRED cream ink |
| `components/vendor/FilingChip.tsx:20` | `rgba(240,230,210,0.14)` | LEAK `#F0E6D2` | `HAIRLINE:  isLight ? 'rgba(12,10,9,0.10)'  : 'rgba(240,230,210,0.14)',` | `--atelier-ink` @ alpha — the RETIRED cream ink |
| `components/vendor/FilingChip.tsx:22` | `rgba(240,230,210,0.30)` | LEAK `#F0E6D2` | `PILL_EDGE: isLight ? 'rgba(12,10,9,0.25)'  : 'rgba(240,230,210,0.30)',` | `--atelier-ink` @ alpha — the RETIRED cream ink |
| `components/vendor/FilingChip.tsx:23` | `rgba(240,230,210,0.75)` | LEAK `#F0E6D2` | `PILL_INK:  isLight ? 'rgba(12,10,9,0.70)'  : 'rgba(240,230,210,0.75)',` | `--atelier-ink` @ alpha — the RETIRED cream ink |
| `components/vendor/Header.tsx:384` | `rgba(240,230,210,0.4)` | LEAK `#F0E6D2` | `const subtitleColor = isLight ? 'rgba(44,31,20,0.4)' : 'rgba(240,230,210,0.4)'` | `--atelier-ink` @ alpha — the RETIRED cream ink |
| `components/vendor/MessageBubble.tsx:178` | `rgba(240,230,210,0.45)` | LEAK `#F0E6D2` | `: (T.isLight ? T.inkMute : "rgba(240,230,210,0.45)"),` | `--atelier-ink` @ alpha — the RETIRED cream ink |
| `components/vendor/TipsCarousel.tsx:246` | `rgba(240,230,210,0.65)` | LEAK `#F0E6D2` | `const bodyColor  = isLight ? T.inkSoft : 'rgba(240,230,210,0.65)';` | `--atelier-ink` @ alpha — the RETIRED cream ink |
| `components/vendor/TipsCarousel.tsx:247` | `rgba(240,230,210,0.38)` | LEAK `#F0E6D2` | `const mutedColor = isLight ? T.inkMute : 'rgba(240,230,210,0.38)';` | `--atelier-ink` @ alpha — the RETIRED cream ink |
| `components/vendor/TipsCarousel.tsx:257` | `rgba(240,230,210,0.38)` | LEAK `#F0E6D2` | `: { bg: 'transparent', border: 'rgba(201,168,76,0.16)', color: 'rgba(240,230,2` | `--atelier-ink` @ alpha — the RETIRED cream ink |
| `components/vendor/AddSheet.tsx:578` | `rgba(224,112,112,0.6)` | LEAK `#E07070` | `border: `0.5px solid ${hasError ? 'rgba(224,112,112,0.6)' : 'rgba(226,222,216,` | `--role-critical` @ alpha |
| `components/vendor/CalendarBlockSheet.tsx:194` | `rgba(224,112,112,0.4)` | LEAK `#E07070` | `border: '0.5px solid rgba(224,112,112,0.4)', background: 'rgba(180,40,40,0.10)` | `--role-critical` @ alpha |
| `components/vendor/CalendarBlockSheet.tsx:227` | `rgba(224,112,112,0.4)` | LEAK `#E07070` | `border: '0.5px solid rgba(224,112,112,0.4)',` | `--role-critical` @ alpha |
| `components/vendor/CalendarDaySheet.tsx:386` | `rgba(224,112,112,0.4)` | LEAK `#E07070` | `border: '0.5px solid rgba(224,112,112,0.4)', background: 'rgba(180,40,40,0.10)` | `--role-critical` @ alpha |
| `components/vendor/NotesBody.tsx:242` | `rgba(224,112,112,0.4)` | LEAK `#E07070` | `border: '0.5px solid rgba(224,112,112,0.4)', borderRadius: 999,` | `--role-critical` @ alpha |
| `components/vendor/Toast.tsx:38` | `rgba(224,112,112,0.4)` | LEAK `#E07070` | `border: `0.5px solid ${isErr ? 'rgba(224,112,112,0.4)' : T.isLight ? T.sheetBo` | `--role-critical` @ alpha |
| `components/vendor/slices/BinderCard.tsx:347` | `rgba(224,112,112,0.5)` | LEAK `#E07070` | `border: '0.5px solid rgba(224,112,112,0.5)', borderRadius: 2, cursor: 'pointer` | `--role-critical` @ alpha |
| `components/vendor/slices/BulkBar.tsx:39` | `rgba(224,112,112,0.5)` | LEAK `#E07070` | `border: `0.5px solid ${a.destructive ? 'rgba(224,112,112,0.5)' : 'var(--atelie` | `--role-critical` @ alpha |
| `components/vendor/slices/SliceShell.tsx:1213` | `rgba(224,112,112,0.5)` | LEAK `#E07070` | `border: '0.5px solid rgba(224,112,112,0.5)', borderRadius: 2, cursor: 'pointer` | `--role-critical` @ alpha |
| `components/worklist/WlToast.tsx:94` | `rgba(224,112,112,0.4)` | LEAK `#E07070` | `.wl-toast.err{background:rgba(74,22,22,0.96);border-color:rgba(224,112,112,0.4` | `--role-critical` @ alpha |
| `components/vendor/AddSheet.tsx:27` | `#111111` | LEAK `#111111` | `const D = { bg: '#111111', card: 'var(--atelier-sheet-top)', border: 'var(--at` | `--atelier-ink-deep` |
| `components/vendor/AddSheet.tsx:543` | `#111` | LEAK `#111111` | `fontFamily: F.label, fontWeight: 400, fontSize: 9, color: '#111',` | `--atelier-ink-deep` |
| `components/vendor/AddSheet.tsx:562` | `#111111` | LEAK `#111111` | `color: '#111111', letterSpacing: '0.3em', textTransform: 'uppercase',` | `--atelier-ink-deep` |
| `components/vendor/CalendarBlockSheet.tsx:263` | `#111111` | LEAK `#111111` | `fontFamily: F.label, fontWeight: 400, fontSize: 10, color: '#111111',` | `--atelier-ink-deep` |
| `components/vendor/CalendarCrewSheet.tsx:181` | `#111` | LEAK `#111111` | `fontSize: 16, lineHeight: 1.5, color: '#111', fontWeight: 700,` | `--atelier-ink-deep` |
| `components/vendor/CalendarCrewSheet.tsx:203` | `#111` | LEAK `#111111` | `fontFamily: F.label, fontWeight: 400, fontSize: 9, color: '#111',` | `--atelier-ink-deep` |
| `components/vendor/CalendarDaySheet.tsx:519` | `#111` | LEAK `#111111` | `fontFamily: F.label, fontWeight: 400, fontSize: 9, color: '#111',` | `--atelier-ink-deep` |
| `components/vendor/NotesBody.tsx:237` | `#111111` | LEAK `#111111` | `color: '#111111', letterSpacing: '0.3em', textTransform: 'uppercase',` | `--atelier-ink-deep` |
| `components/vendor/NotesBody.tsx:274` | `#111111` | LEAK `#111111` | `fontFamily: F.label, fontWeight: 400, fontSize: 10, color: '#111111', letterSp` | `--atelier-ink-deep` |
| `components/vendor/ChatThread.tsx:110` | `rgba(26,15,8,0.16)` | LEAK `#1A0F08` | `<span style={{ flex: 1, height: '0.5px', background: T.isLight ? 'rgba(26,15,8` | `--atelier-card-shadow` / `--atelier-overlay` |
| `components/vendor/ChatThread.tsx:114` | `rgba(26,15,8,0.45)` | LEAK `#1A0F08` | `color: T.isLight ? 'rgba(26,15,8,0.45)' : 'rgba(201,168,76,0.6)',` | `--atelier-card-shadow` / `--atelier-overlay` |
| `components/vendor/ChatThread.tsx:117` | `rgba(26,15,8,0.16)` | LEAK `#1A0F08` | `<span style={{ flex: 1, height: '0.5px', background: T.isLight ? 'rgba(26,15,8` | `--atelier-card-shadow` / `--atelier-overlay` |
| `components/vendor/ChatThread.tsx:230` | `rgba(26,15,8,0.62)` | LEAK `#1A0F08` | `color: T.isLight ? 'rgba(26,15,8,0.62)' : 'rgba(240,230,210,0.6)',` | `--atelier-card-shadow` / `--atelier-overlay` |
| `components/vendor/Header.tsx:276` | `rgba(26,15,8,0.15)` | LEAK `#1A0F08` | `? `0 8px 24px -4px rgba(26,15,8,0.15), 0 0 0 0.5px ${T.sheetBorder}`` | `--atelier-card-shadow` / `--atelier-overlay` |
| `components/vendor/MessageBubble.tsx:86` | `rgba(26,15,8,0.06)` | LEAK `#1A0F08` | `out.push(<code key={`${salt}c${k++}`} style={{ fontFamily: 'ui-monospace, SFMo` | `--atelier-card-shadow` / `--atelier-overlay` |
| `components/vendor/TipsCarousel.tsx:241` | `rgba(26,15,8,0.55)` | LEAK `#1A0F08` | `const overlayBg  = isLight ? 'rgba(26,15,8,0.55)' : 'rgba(8,6,4,0.62)';` | `--atelier-card-shadow` / `--atelier-overlay` |
| `components/vendor/TipsCarousel.tsx:316` | `rgba(26,15,8,0.20)` | LEAK `#1A0F08` | `? '0 -8px 40px rgba(26,15,8,0.20), inset 0 1px 0 rgba(255,255,255,0.7)'` | `--atelier-card-shadow` / `--atelier-overlay` |
| `components/vendor/Toast.tsx:44` | `rgba(26,15,8,0.15)` | LEAK `#1A0F08` | `? isErr ? '0 8px 24px rgba(90,20,20,0.25)' : `0 8px 24px rgba(26,15,8,0.15)`` | `--atelier-card-shadow` / `--atelier-overlay` |
| `components/vendor/MessageBubble.tsx:251` | `rgba(37,211,102,0.10)` | LEAK `#25D366` | `background: 'rgba(37,211,102,0.10)', border: '0.5px solid rgba(37,211,102,0.4)` | **RULING OWED** — WhatsApp brand mark |
| `components/vendor/MessageBubble.tsx:251` | `rgba(37,211,102,0.4)` | LEAK `#25D366` | `background: 'rgba(37,211,102,0.10)', border: '0.5px solid rgba(37,211,102,0.4)` | **RULING OWED** — WhatsApp brand mark |
| `components/vendor/TipsCarousel.tsx:380` | `rgba(37,211,102,0.10)` | LEAK `#25D366` | `background: 'rgba(37,211,102,0.10)',` | **RULING OWED** — WhatsApp brand mark |
| `components/vendor/TipsCarousel.tsx:381` | `rgba(37,211,102,0.40)` | LEAK `#25D366` | `border: '0.5px solid rgba(37,211,102,0.40)',` | **RULING OWED** — WhatsApp brand mark |
| `components/vendor/TipsCarousel.tsx:385` | `#25D366` | LEAK `#25D366` | `color: '#25D366',` | **RULING OWED** — WhatsApp brand mark |
| `components/vendor/slices/SliceShell.tsx:1069` | `rgba(37,211,102,0.5)` | LEAK `#25D366` | `border: '0.5px solid rgba(37,211,102,0.5)', borderRadius: 3,` | **RULING OWED** — WhatsApp brand mark |
| `components/vendor/slices/SliceShell.tsx:1071` | `#25D366` | LEAK `#25D366` | `fontFamily: F.label, fontWeight: 400, fontSize: 9, color: '#25D366',` | **RULING OWED** — WhatsApp brand mark |
| `app/vendor/(shell)/portfolio/screen.tsx:290` | `#F8F7F5` | LEAK `#F8F7F5` | `background: 'rgba(12,10,9,0.72)', color: '#F8F7F5',` | `--atelier-sheet-bg` / `--atelier-ink` |
| `app/vendor/(shell)/portfolio/screen.tsx:314` | `#F8F7F5` | LEAK `#F8F7F5` | `background: 'var(--atelier-accent-text)', color: '#F8F7F5',` | `--atelier-sheet-bg` / `--atelier-ink` |
| `app/vendor/(shell)/portfolio/screen.tsx:1292` | `#F8F7F5` | LEAK `#F8F7F5` | `background: 'var(--atelier-paper, #F8F7F5)', borderRadius: '14px 14px 0 0',` | `--atelier-sheet-bg` / `--atelier-ink` |
| `app/vendor/(shell)/portfolio/screen.tsx:1340` | `#F8F7F5` | LEAK `#F8F7F5` | `background: 'var(--atelier-paper, #F8F7F5)',` | `--atelier-sheet-bg` / `--atelier-ink` |
| `app/vendor/(shell)/portfolio/screen.tsx:1351` | `#F8F7F5` | LEAK `#F8F7F5` | `color: igPicked.length ? '#F8F7F5' : A.interactiveWarm,` | `--atelier-sheet-bg` / `--atelier-ink` |
| `components/vendor/Header.tsx:295` | `#2C1F14` | LEAK `#2C1F14` | `color: isLight ? '#2C1F14' : 'var(--atelier-ink)',` | `--atelier-header-bg` |
| `components/vendor/Header.tsx:370` | `rgba(44,31,20,0.15)` | LEAK `#2C1F14` | `<span style={{ flex: 1, height: '0.5px', background: isLight ? 'rgba(44,31,20,` | `--atelier-header-bg` |
| `components/vendor/Header.tsx:380` | `#2C1F14` | LEAK `#2C1F14` | `const baseInk = isLight ? '#2C1F14' : 'var(--atelier-ink)';` | `--atelier-header-bg` |
| `components/vendor/Header.tsx:383` | `rgba(44,31,20,0.04)` | LEAK `#2C1F14` | `const hoverBg = isLight ? 'rgba(44,31,20,0.04)' : 'var(--atelier-row-hover)';` | `--atelier-header-bg` |
| `components/vendor/Header.tsx:384` | `rgba(44,31,20,0.4)` | LEAK `#2C1F14` | `const subtitleColor = isLight ? 'rgba(44,31,20,0.4)' : 'rgba(240,230,210,0.4)'` | `--atelier-header-bg` |
| `components/vendor/slices/BinderCard.tsx:341` | `#8a8578` | LEAK `#8A8578` | `fontFamily: F.label, fontWeight: 300, fontSize: 9, color: 'var(--atelier-ink-m` | **DELETE the fallback** — bare `var(--atelier-ink-mute)` |
| `components/vendor/slices/BulkBar.tsx:48` | `#8a8578` | LEAK `#8A8578` | `color: 'var(--atelier-ink-mute, #8a8578)',` | **DELETE the fallback** — bare `var(--atelier-ink-mute)` |
| `components/vendor/slices/FilterRail.tsx:38` | `#8a8578` | LEAK `#8A8578` | `color: on ? 'var(--atelier-accent-text)' : 'var(--atelier-ink-mute, #8a8578)',` | **DELETE the fallback** — bare `var(--atelier-ink-mute)` |
| `components/vendor/slices/SliceShell.tsx:1186` | `#8a8578` | LEAK `#8A8578` | `fontFamily: F.label, fontWeight: 300, fontSize: 9, color: 'var(--atelier-ink-m` | **DELETE the fallback** — bare `var(--atelier-ink-mute)` |
| `components/vendor/slices/SliceShell.tsx:1220` | `#8a8578` | LEAK `#8A8578` | `color: 'var(--atelier-ink-mute, #8a8578)', letterSpacing: '0.32em', textTransf` | **DELETE the fallback** — bare `var(--atelier-ink-mute)` |
| `components/vendor/CalendarBlockSheet.tsx:194` | `rgba(180,40,40,0.10)` | LEAK `#B42828` | `border: '0.5px solid rgba(224,112,112,0.4)', background: 'rgba(180,40,40,0.10)` | `--role-critical` @ alpha |
| `components/vendor/CalendarBlockSheet.tsx:226` | `rgba(180,40,40,0.18)` | LEAK `#B42828` | `background: working ? 'rgba(122,26,26,0.4)' : 'rgba(180,40,40,0.18)',` | `--role-critical` @ alpha |
| `components/vendor/CalendarDaySheet.tsx:386` | `rgba(180,40,40,0.10)` | LEAK `#B42828` | `border: '0.5px solid rgba(224,112,112,0.4)', background: 'rgba(180,40,40,0.10)` | `--role-critical` @ alpha |
| `components/vendor/NotesBody.tsx:241` | `rgba(180,40,40,0.18)` | LEAK `#B42828` | `background: saving ? 'rgba(122,26,26,0.4)' : 'rgba(180,40,40,0.18)',` | `--role-critical` @ alpha |
| `components/vendor/InputBar.tsx:83` | `rgba(255,235,200,0.6)` | LEAK `#FFEBC8` | `boxShadow: inNote ? '0 4px 14px -4px rgba(201,168,76,0.5), inset 0 1px 1px rgb` | `--atelier-ink` @ alpha |
| `components/vendor/InputBar.tsx:137` | `rgba(255,235,200,0.6)` | LEAK `#FFEBC8` | `? '0 4px 12px -4px rgba(42,26,16,0.2), inset 0 1px 1px rgba(255,235,200,0.6)'` | `--atelier-ink` @ alpha |
| `components/vendor/InputBar.tsx:138` | `rgba(255,235,200,0.6)` | LEAK `#FFEBC8` | `: '0 6px 16px -4px rgba(201,168,76,0.5), inset 0 1px 1px rgba(255,235,200,0.6)` | `--atelier-ink` @ alpha |
| `components/vendor/MessageBubble.tsx:215` | `rgba(255,235,200,0.08)` | LEAK `#FFEBC8` | `boxShadow: T.isLight ? 'none' : 'inset 0 1px 0 rgba(255,235,200,0.08)',` | `--atelier-ink` @ alpha |
| `components/vendor/slices/SliceRow.tsx:424` | `rgba(127,190,133,0.10)` | LEAK `#7FBE85` | `background: 'rgba(127,190,133,0.10)',` | `--role-positive` — its retired dark value |
| `components/vendor/slices/SliceRow.tsx:425` | `rgba(127,190,133,0.42)` | LEAK `#7FBE85` | `border: '0.5px solid rgba(127,190,133,0.42)',` | `--role-positive` — its retired dark value |
| `components/vendor/slices/SliceShell.tsx:1319` | `rgba(127,190,133,0.08)` | LEAK `#7FBE85` | `background: 'rgba(127,190,133,0.08)',` | `--role-positive` — its retired dark value |
| `components/vendor/slices/SliceShell.tsx:1320` | `rgba(127,190,133,0.42)` | LEAK `#7FBE85` | `border: '0.5px solid rgba(127,190,133,0.42)',` | `--role-positive` — its retired dark value |
| `app/vendor/(shell)/calendar/screen.tsx:557` | `rgba(245,235,212,0.92)` | LEAK `#F5EBD4` | `background: 'rgba(245,235,212,0.92)', zIndex: 0,` | `--atelier-ink` @ alpha |
| `components/vendor/FilingChip.tsx:21` | `rgba(245,235,212,0.055)` | LEAK `#F5EBD4` | `SURFACE:   isLight ? 'rgba(12,10,9,0.030)' : 'rgba(245,235,212,0.055)',` | `--atelier-ink` @ alpha |
| `components/vendor/TipsCarousel.tsx:317` | `rgba(245,235,212,0.05)` | LEAK `#F5EBD4` | `: '0 -8px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(245,235,212,0.05)',` | `--atelier-ink` @ alpha |
| `components/vendor/AddSheet.tsx:578` | `rgba(226,222,216,0.15)` | LEAK `#E2DED8` | `border: `0.5px solid ${hasError ? 'rgba(224,112,112,0.6)' : 'rgba(226,222,216,` | `--atelier-sheet-border` |
| `components/vendor/ConversationThread.tsx:8` | `rgba(226,222,216,0.1)` | LEAK `#E2DED8` | `const D = { card: '#1C1C1C', border: 'rgba(226,222,216,0.1)', muted: 'var(--at` | `--atelier-sheet-border` |
| `components/vendor/ConversationThread.tsx:59` | `rgba(226,222,216,0.1)` | LEAK `#E2DED8` | `border: `0.5px solid ${isIn ? 'rgba(226,222,216,0.1)' : 'rgba(201,168,76,0.2)'` | `--atelier-sheet-border` |
| `components/vendor/FilingChip.tsx:24` | `#B85C38` | LEAK `#B85C38` | `TERRACOTTA:isLight ? '#B85C38' : 'var(--role-critical)',` | `--role-metal` |
| `components/vendor/TierMeter.tsx:27` | `#B85C38` | LEAK `#B85C38` | `style={{ width: `${pct}%`, backgroundColor: capped ? '#B85C38' : 'var(--role-m` | `--role-metal` |
| `components/vendor/TierMeter.tsx:32` | `#B85C38` | LEAK `#B85C38` | `style={{ color: capped ? '#B85C38' : 'rgba(12,10,9,0.45)' }}` | `--role-metal` |
| `components/vendor/InputBar.tsx:88` | `#F5F2EE` | LEAK `#F5F2EE` | `stroke={inNote ? (T.isLight ? '#F5F2EE' : INK_DEEP) : T.inkDim} strokeWidth="2` | `--atelier-ink` |
| `components/vendor/InputBar.tsx:132` | `#F5F2EE` | LEAK `#F5F2EE` | `color: canSend ? (T.isLight ? '#F5F2EE' : INK_DEEP) : T.inkDim,` | `--atelier-ink` |
| `components/vendor/TipsCarousel.tsx:251` | `#F5F2EE` | LEAK `#F5F2EE` | `const ctaColor   = isLight ? '#F5F2EE' : INK_DEEP;` | `--atelier-ink` |
| `app/vendor/(shell)/collab/[post_id]/responses/screen.tsx:78` | `rgba(245,240,232,0.85)` | LEAK `#F5F0E8` | `cream:  'rgba(245,240,232,0.85)',` | `--atelier-ink` @ alpha |
| `app/vendor/(shell)/collab/[post_id]/responses/screen.tsx:79` | `rgba(245,240,232,0.40)` | LEAK `#F5F0E8` | `muted:  'rgba(245,240,232,0.40)',` | `--atelier-ink` @ alpha |
| `components/vendor/CalendarBlockSheet.tsx:226` | `rgba(122,26,26,0.4)` | LEAK `#7A1A1A` | `background: working ? 'rgba(122,26,26,0.4)' : 'rgba(180,40,40,0.18)',` | `--role-critical` @ alpha |
| `components/vendor/NotesBody.tsx:241` | `rgba(122,26,26,0.4)` | LEAK `#7A1A1A` | `background: saving ? 'rgba(122,26,26,0.4)' : 'rgba(180,40,40,0.18)',` | `--role-critical` @ alpha |
| `components/vendor/InputBar.tsx:54` | `rgba(139,75,55,0.08)` | LEAK `#8B4B37` | `const toggleOffBg = T.isLight ? 'rgba(139,75,55,0.08)' : 'rgba(201,168,76,0.10` | `--atelier-accent-text` @ alpha |
| `components/vendor/InputBar.tsx:129` | `rgba(139,75,55,0.12)` | LEAK `#8B4B37` | `: T.isLight ? 'rgba(139,75,55,0.12)' : 'rgba(201,168,76,0.15)',` | `--atelier-accent-text` @ alpha |
| `components/vendor/Header.tsx:403` | `rgba(224,188,110,0.3)` | LEAK `#E0BC6E` | `textShadow: hov ? '0 0 8px rgba(224,188,110,0.3)' : 'none',` | `--role-metal` @ alpha |
| `components/vendor/slices/SliceShell.tsx:1122` | `rgba(224,188,110,0.5)` | LEAK `#E0BC6E` | `border: `0.5px solid ${ms.state === 'paid' ? A.green : ms.state === 'waived' ?` | `--role-metal` @ alpha |
| `components/vendor/Toast.tsx:34` | `rgba(90,20,20,0.96)` | LEAK `#5A1414` | `? isErr ? 'rgba(90,20,20,0.96)' : T.sheetTop` | `--role-critical` ground |
| `components/vendor/Toast.tsx:44` | `rgba(90,20,20,0.25)` | LEAK `#5A1414` | `? isErr ? '0 8px 24px rgba(90,20,20,0.25)' : `0 8px 24px rgba(26,15,8,0.15)`` | `--role-critical` ground |
| `components/vendor/TipsCarousel.tsx:249` | `#9B4E38` | LEAK `#9B4E38` | `? 'linear-gradient(180deg, #9B4E38 0%, #7A3828 100%)'` | `--atelier-accent-text` |
| `components/vendor/TipsCarousel.tsx:401` | `#9B4E38` | LEAK `#9B4E38` | `? 'linear-gradient(90deg, #9B4E38, #7A3828)'` | `--atelier-accent-text` |
| `components/worklist/WlToast.tsx:99` | `#F1EFEC` | LEAK `#F1EFEC` | `.wl-toast.err .wl-toastmsg{color:#F1EFEC}` | `--atelier-ink` (pinned, F-04.75) |
| `components/worklist/WlToast.tsx:103` | `#F1EFEC` | LEAK `#F1EFEC` | `.wl-toast.err .wl-toastaction{color:#F1EFEC}` | `--atelier-ink` (pinned, F-04.75) |
| `app/vendor/(shell)/collab/[post_id]/responses/screen.tsx:67` | `#0E0D0B` | LEAK `#0E0D0B` | `onMetal: '#0E0D0B',` | `--atelier-bg` |
| `app/vendor/(shell)/wedding-pages/page.tsx:777` | `#B4453C` | LEAK `#B4453C` | `.wp-note.wp-err{color:var(--atelier-danger,#B4453C)}` | `--role-critical` |
| `components/vendor/ConversationThread.tsx:8` | `#1C1C1C` | LEAK `#1C1C1C` | `const D = { card: '#1C1C1C', border: 'rgba(226,222,216,0.1)', muted: 'var(--at` | `--atelier-ink-deep` |
| `components/vendor/InputBar.tsx:137` | `rgba(42,26,16,0.2)` | LEAK `#2A1A10` | `? '0 4px 12px -4px rgba(42,26,16,0.2), inset 0 1px 1px rgba(255,235,200,0.6)'` | `--atelier-ink-deep` @ alpha |
| `components/vendor/Toast.tsx:35` | `rgba(60,20,20,0.95)` | LEAK `#3C1414` | `: isErr ? 'rgba(60,20,20,0.95)' : 'rgba(20,20,18,0.95)',` | `--role-critical` ground |
| `components/vendor/Toast.tsx:35` | `rgba(20,20,18,0.95)` | LEAK `#141412` | `: isErr ? 'rgba(60,20,20,0.95)' : 'rgba(20,20,18,0.95)',` | `--atelier-sheet-bg` |
| `components/vendor/ListRow.tsx:33` | `#A12B2B` | LEAK `#A12B2B` | `{row.removable && <button type="button" onClick={() => onRemove(row)} style={{` | `--role-critical` |
| `components/vendor/TipsCarousel.tsx:241` | `rgba(8,6,4,0.62)` | LEAK `#080604` | `const overlayBg  = isLight ? 'rgba(26,15,8,0.55)' : 'rgba(8,6,4,0.62)';` | `--atelier-overlay-bg` @ alpha |
| `components/vendor/TipsCarousel.tsx:242` | `rgba(24,19,15,0.98)` | LEAK `#18130F` | `const cardBg     = isLight ? T.sheetTop : 'rgba(24,19,15,0.98)';` | `--atelier-sheet-bg` |
| `components/vendor/MessageBubble.tsx:86` | `rgba(233,228,217,0.08)` | LEAK `#E9E4D9` | `out.push(<code key={`${salt}c${k++}`} style={{ fontFamily: 'ui-monospace, SFMo` | `--atelier-ink` @ alpha |
| `components/vendor/slices/WishboneSheet.tsx:162` | `#B4552D` | LEAK `#B4552D` | `<div style={{ fontFamily: F.script, fontWeight: 300, fontSize: 16, lineHeight:` | `--role-metal` |
| `components/vendor/slices/BinderCard.tsx:33` | `#3E8B4A` | LEAK `#3E8B4A` | `go:   '#3E8B4A',` | `--role-positive` |
| `components/worklist/WlToast.tsx:94` | `rgba(74,22,22,0.96)` | LEAK `#4A1616` | `.wl-toast.err{background:rgba(74,22,22,0.96);border-color:rgba(224,112,112,0.4` | `--role-critical` ground (ruling owed) |

---

**Derived at `bfa3197e0deb0c8750f04e0a00ebb9f0e760b2d1`, `origin/main`, `dreamos-pwa`,
2026-09-07. Every hex in this document was produced by command at origin; none was recalled.
No product byte was written. The four captures of §6 are owed.**
