# TDW_09 · UX BLUEPRINT · STAGE 2 — THE HEURISTIC REVIEW · THE STATES CENSUS · THE TOUCH AUDIT

**Bases:** dreamos-pwa `e3210b5` · dream-os local `e0ff7d9` (docs home). **Authority:** the Blueprint kickoff charter items 2–3 + 5 · R-X4's F-5(b) (both derivable axes + the founder latency card) · R-X17 (proceed, stated order). **Scope note per R-X15: the legacy server-rendered console is excluded from every census here and was not opened.**
**Instrument:** `tools/tdw09_stage2.py` (ships in this ZIP; emits `tools/stage2.json`, full per-file rows).

**THE ONE QUESTION THIS ARTIFACT EXISTS TO ANSWER:** why do the buttons feel insensitive, and which screens go quiet when the network or the data does — stated per class with sites, so each cure is one ruling wide.
**THE OBSERVATION THAT WOULD PROVE IT FAILED:** the founder taps a cured button and still feels nothing, or a screen this paper passed goes silent on a failed load.

---

## 1 · METHOD AND ITS CONVICTIONS — DECLARED FIRST

Pattern census over `app/**` + `components/**` (comments stripped — stage 1's conviction №4 inherited as a base behavior). Failure modes named in the instrument's own header: declared-style floors only (the F-08.42 class — heights from CSS classes or parent stretch are invisible); pressed-feedback "absent" means *not statically visible in-file*, and a shared component can supply it — which is exactly what §2 finds; state renderings inside imported components are invisible to the states pass.

**This instrument's published conviction:** the raw below-44 counter reads every 20–80px `height:` declaration in an interactive file, and hand-verification convicted it of counting **decorative boxes** — `sanctuary:341`'s 40×40 "EXP" badge and `:359`'s 36×36 avatar circle are `<div>`s, not targets, sitting two lines from real buttons. **The raw counts below are therefore CANDIDATE floors; every specimen this paper stands on was verified at source to be a genuinely tappable element.** The candidate-vs-verified split is printed rather than smoothed over, because a touch audit that counts avatars as buttons is the fourth witness Paper 1 warned about.

---

## 2 · THE TOUCH AUDIT — the founder's word 「 buttons feel insensitive 」, diagnosed per class

Three candidate diseases were chartered: hit-area, missing pressed-state feedback, handler latency. The derivation splits them cleanly:

### 2.1 · **F-09.21 — THE SUPPRESSED-WITHOUT-REPLACEMENT FEEDBACK CLASS** *(the primary disease, and it is architectural)*

The estate suppresses the browser's native tap flash — `WebkitTapHighlightColor: 'transparent'` at **29 sites** (frost 18 · demo 5 · vendor chrome 6) — and replaces it with a pressed state in only **9 files of 148 interactive files**. The distribution is the conviction:

| Plane | Interactive elements | Files with true pressed feedback |
|---|---|---|
| **admin** | 286 | effectively **all** — `app/admin/_components/AdminUI.tsx:105`/`:166` carries `pressed → scale(0.97)` and the plane's buttons flow through it |
| **components/vendor** (the vendor chrome: BottomNav, Header, sheets, chips) | 252 | **0** |
| **frost** (the bride app) | 323 | 2 (isolated) |
| **vendor** pages | 283 | 1 (`portfolio:237`'s toggle) |

The 73 `active ?` ternaries across the tree are **selection** states (which tab is current), not **pressed** states (did my tap land) — the false friend that makes the tree look responsive in a grep and feel dead under a thumb. So the founder's cockpit acknowledges every tap while the products his vendors and brides hold do not — **the insensitivity is real, it is the feedback axis, and it is worst exactly where the native feedback was explicitly turned off with nothing put back.** Spec P6 ordered `pressed states (scale .98, 80ms)` estate-wide; it governs nothing yet.
**Cure shape (one ruling wide):** a pressed-state primitive in the canon (token-timed, `prefers-reduced-motion`-aware), applied first to the 29 suppression sites — the places currently giving *literally zero* feedback — then the chrome. Rides the token canon's sequencing (Paper 3 §5), not a per-site sweep.

### 2.2 · **F-09.22 — SUB-FLOOR HIT TARGETS, verified specimens** *(the secondary disease, surface-specific)*

Candidate floor: 123 sub-44 height declarations in interactive files. **Verified genuinely-tappable specimens, each opened at source:**

| Site | Element | Height |
|---|---|---|
| `components/vendor/ChatThread.tsx:140` / `:172` / `:206` | the chat surface's suggestion-chip `<button>`s | **32 / 30 / 30** |
| `app/(frost)/frost/canvas/sanctuary/page.tsx:301` | the full-image close `✕` `<button>` | **36** |
| `app/(frost)/frost/canvas/journey/people/page.tsx` | row actions | 34–42 |
| `app/(frost)/frost/canvas/muse/page.tsx` · `journey/circle/page.tsx` | pills / controls | 28–36 |
| `app/(landing)/page.tsx` (stage-1 datum) | `Sign in` / `Just exploring` | 42 |

The worst verified offenders sit on **the vendor chat surface** — the screen the product's whole promise runs through — at 30–32px against the 44pt/48dp floor. This is the second half of "insensitive": a tap near a chip misses it, and (per §2.1) the miss produces no feedback either, so a missed tap and a dead button are indistinguishable from the chair the vendor sits in.
**Cure shape:** the canon's chip/button primitives carry a 44px minimum *touch box* (visual height may stay smaller via transparent padding — the standard cure that preserves the aesthetic); the verified sites adopt first.

### 2.3 · The latency axis — not derivable here, and the card that settles it

Handlers in the specimens are synchronous state-sets (`onChipTap`, `setScreen`) — no derivable latency source — but a 200ms transition on color-only changes (`collab:26`'s pill) can *read* as lag when it is the only feedback. Whether any real handler latency exists is the founder's device's to witness, per the ruled F-5(b): **the three-button card is §5.**

---

## 3 · THE STATES CENSUS — empty · loading · error, first-class

119 routed pages censused; 46 fetch. Floors: **fetch-without-loading 2 · fetch-without-empty 15 · fetch-without-error 5.** Honest exclusions before any conviction: the auth lane's 4 "no-empty" pages render no collections (an OTP screen has no empty state to lack) — excluded; imported-component states are invisible to the pass (declared).

### 3.1 · **F-09.23 — THE SILENT-FAILURE CLASS: F-07.90's DISEASE, CURED ON ADMIN, ALIVE ON COPLANNER**

`app/coplanner/threads/page.tsx:70`: the load's tail is **`catch {}`** — then `setLoading(false)`. A 401 is handled (the lane's single refusal path, by design); **any other failure — network, 500, malformed body — is swallowed, and the screen renders its normal state over the failed load.** An empty thread list and a dead network are byte-identical on screen. The exact disease `app/admin/page.tsx`'s own F-07.90 cure comment narrates (*"a failed call became an empty collection… a confident stat tile"*), cured on the founder's plane, alive on the couple's collaborators': `threads/page.tsx` · `threads/[threadId]/page.tsx` · `muse/page.tsx`, all three with the same `catch {}` shape. Two further no-error fetchers (frost ×1, admin ×1) are candidate members, walk-owed.
**Cure shape:** the admin cure's own pattern, ported — failure is a distinct rendered state ("Could not load" + retry), never an empty collection. Three files, one shape.

### 3.2 · Empty states with no next action

Verified floor after exclusions: **11 fetching surfaces render no empty state.** The IA map's handed specimen — `journey/circle/[memberId]` — remains walk-owed (its empty rendering may live in an imported component; not convicted, listed). The charter's law stands over the class: *an empty screen with no next action is a finding every time* — but conviction per-surface requires the walk or a per-file read this stage's budget spent on the touch verifications; **the 11-surface list ships in `stage2.json` for stage 4's cure queue to walk**, not as 11 pre-convicted findings. Filed as one class-finding boundary, not eleven asserted ones.

---

## 4 · THE HEURISTIC REVIEW — the classic set, each anchored to derived sites

This section synthesizes; where a defect is already filed it is cited by number, never re-minted.

**Visibility of system status** — the estate's worst breaches are F-09.23 (failure invisible) and F-09.21 (the tap itself unacknowledged); the admin plane is the house's own proof both are curable, since it cured both.
**Recognition over recall** — the word "Studio" naming a mode that lands on the calendar while `/vendor/studio` was something else (F-09.18, cure ruled R-X8); the two-mode-controls dress (R-U17, stage 3's paper); `/vendor/list`'s slice machine asks the vendor to recall which slice holds what — stage 3's interaction paper carries it.
**Consistency** — 12 money formatters (F-09.6), 8+ date helpers (F-09.11), five palette homes (F-09.1), 35 type sizes (F-09.5): the canon papers already own the cures; nothing new to mint.
**Error prevention** — F-09.17 (the 404 CTA, cure ruled R-X7) was the class's live specimen; the retirement arc's zero-caller discipline is its process cure.
**Feedback** — F-09.21 whole.
**Aesthetic & minimalist design** — the landing's five-decision entry (Paper 2, Hick's — resolving at the ruled L-B two-door + open flow) and the ceremony's death (F-09.20, ruled) are the block's own minimalism rulings; the 6–9px microtype band (F-09.5) is the remaining density debt, owned by the type-scale fork T-1.

The review's summary sentence for the founder: **the house's defects are not scattered — they are five classes (feedback, hit-box, silent failure, format fragmentation, entry friction), three of which already carry ruled cures, and the remaining two (F-09.21/.22/.23) are one canon primitive and one three-file port away.**

---

## 5 · THE FOUNDER'S LATENCY CARD — three buttons, one word each *(the F-5(b) walk)*

On the phone, one tap per row; the reading is the **gap between finger-down and the first visible change**:

| # | Button | Where | Paste back |
|---|---|---|---|
| 1 | any suggestion chip in the Victor chat | vendor chat surface | instant / delayed / nothing |
| 2 | a bottom-nav tab (e.g. Calendar) | vendor app | instant / delayed / nothing |
| 3 | any filter pill on the Muse board | bride app | instant / delayed / nothing |

"Nothing-then-the-screen-changes" is §2.1's class confirmed live; "delayed" on №2/№3 points at handler or transition latency the desk cannot see. Three taps, three words — it gates nothing and can ride any later walk.

## 6 · FINDINGS MINTED IN THIS PAPER

**F-09.21** — native tap feedback suppressed at 29 sites with a pressed-state replacement in 9 of 148 interactive files; the vendor/bride chrome carries zero while the admin plane carries the cure. **F-09.22** — verified sub-floor tap targets, worst on the vendor chat's 30–32px suggestion chips. **F-09.23** — the `catch {}` silent-failure class on all three fetching coplanner pages; F-07.90's disease outside its cured plane.

**Range used: high-water F-09.23. Next free: F-09.24.**
