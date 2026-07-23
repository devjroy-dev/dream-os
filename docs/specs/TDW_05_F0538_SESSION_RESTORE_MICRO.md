# TDW_05 — F-05.38: THE ITP-WIPED BRIDE GETS HER OWN NAME BACK

**Base:** dreamos-pwa `7c7d923` (= `origin/main`, re-derived fetch-first) · dream-os **0-line**.
**Charter:** CE-65 micro, step ① of the founder's ruled sequence. Third and final arc of this session; **the session banks at this delivery, at the seam.**

---

## 1. §0.2 REPORT — THE RULED CURE CANNOT PASS ITS OWN PROBE CARD

The charter rules: *restore the session blob from the sanctuary's EXISTING `/couple/me` fetch.* Its probe card demands: *her OWN name on screen — no "Priya".*

**Those two sentences contradict each other, and the charter's own named trap is why.** Both routes derived at my tip:

| route | selects | returns a name? |
|---|---|---|
| `me.js:100–106` — **bare `/couple/me`**, what the sanctuary calls | `id, onboarding_state, planning_state, wedding_date, wedding_city, partner_name, budget_total` | **NO** |
| `me.js:18–56` — **param `/couple/me/:coupleId`**, what pin-login calls | the same **+ `users(name)`**, returned as **`bride_name`** | **YES** |

`getBrideName()` reads `s?.user_name || s?.bride_name || s?.name`. **`bride_name` is one of its three keys** — the param route's field name and the helper's expected key already match. The bare route simply never carries it.

**Executed literally, this micro would heal the countdown, leave `Hello, Priya.` on screen, pass tsc, and fail P1.** The trap the charter told me to derive is exactly the thing that breaks the charter.

### The deviation, named for the CE to strike

The second fetch is **conditional**: it fires only when the blob carries no name at all — i.e. only on a wiped session. A normal load makes **zero** extra requests, and the equality check makes it write nothing and re-render nothing.

**If the CE strikes the second leg, the P1 probe's name clause must be struck with it** — the countdown would heal and "Priya" would stay. I would rather say that now than deliver a cure whose own acceptance card convicts it.

### Declared and unhealable

`engagement_date` **has no home in `public.couples`** — grep-zero across the witnessed schema; the only "engagement" hit is an unrelated event-type CHECK. `getEngagementDate()` keeps `DEMO_ENGAGEMENT` permanently. No endpoint can fix it. Named, not left to be re-discovered.

### The second thing the charter did not anticipate

The three helpers run **synchronously**, below the fetch, off the wiped blob. Healing the blob alone would leave the demo values on screen until some unrelated state change forced a render. The seam therefore re-derives the display values **once, after the write** — inside the restore, nowhere else.

## 2. THE CURE

Inside the existing `/couple/me` `.then`, after the onboarding guard:

- read the existing blob (empty if wiped);
- recover `bride_name` via the param route **only if no name is present**;
- merge **server value → existing → nothing**, writing only fields `me.js` actually witnessed — pin-login's own merge shape, never an invented field;
- **if the blob is unchanged, return** — no write, no cookie, no re-render;
- otherwise write both localStorage keys **and** the `tdw_couple_session` cookie at `max-age=7d; path=/; SameSite=Lax; Secure` — `pin-login:20–28` verbatim in shape. **Lax deliberately:** that is the session cookie's own convention; `_base.ts`'s token cookie uses `None` and is a different cookie with a different job. Copied, not assumed;
- re-derive `days / progress / name / proseLine / sinceYes`.

## 3. FENCES — ALL VERIFIED BY COMMAND

| fence | status |
|---|---|
| `_base.ts` untouched (F-05.30, second application) | ✅ not in the diff |
| F-05.29's guard lines untouched (sealed at `7c7d923`) | ✅ no `+/-` on them |
| `sanctuary/page.tsx` beyond the restore seam: 0-line | ✅ one contiguous hunk |
| dream-os: 0-line | ✅ `git status` clean |
| **COPY: EXPECTED-ZERO** | ✅ the bride's own name replacing a demo literal is data flowing correctly, not a string change. **Zero stated.** |

## 4. PROOF

- **`npx --no-install tsc --noEmit` — WHOLE TREE, ZERO.**
- **ONE file, 84+/2−.** No bench exists on this repo (CE-64, unchanged) — tsc plus the founder's probe is the ceiling of what this delivery claims.

## 5. THE FOUNDER PROBE

**P1.** Logged-in sanctuary → console → `localStorage.clear()` (**cookies INTACT**) → reload.
**Green:** **her own name** and her **real countdown** — no "Priya", no "119 mornings". Network shows the bare `/couple/me` and, because the blob was wiped, one `/couple/me/{id}` behind it.

**P2 — control.** Clear cookies **and** storage → reload.
**Green:** bounce to landing. F-05.29's guard still guards; this micro taught the helpers, not the door.

**P3 — control.** Normal load, nothing cleared.
**Green:** unchanged, her name as before, and **no second fetch in the Network tab** — the conditional and the equality check make the restore inert when there is nothing to heal.

**Read P3 as carefully as P1.** P1 proves the cure works; P3 proves it costs nothing on every other load of her life.

## 6. OPEN

- **The conditional second fetch** — the named deviation of §1, the CE's to ratify or strike (and if struck, P1's name clause goes with it).
- **`engagement_date`** — structurally unhealable, declared.
- No bench harness on this repo — unchanged since CE-64.

---

# 7. THE SESSION BANKS HERE — CLOSING HANDOVER

**Three arcs, in order, never interleaved.**

**ARC 1 — THE COUPLE SOUL (Mira).** `dream-os 0bfc8a5`. `miraSoul.js` as one CJS home (F-PORT C); the register amendment authored as character; the name reconciled across both wires; the demo-fixture clause dropped from the bride's first message; three composers folded onto one register. Bench `b05_couple_soul_bench` 21/21, non-vacuous 8/8 by production mutation, floor twelve-for-twelve byte-stable.
**Acceptance evening: 4½ of 5 cards.** Two/Three/Four/Five green; **CARD ONE red**. **THE SITTING DOES NOT SEAL.**

**ARC 2 — F-05.29.** `dreamos-pwa 7c7d923`, **CE-verified and SEALED.** The guard reads the cookie mirror; P1/P2 witnessed, the control proving it was taught, not disabled.

**ARC 3 — F-05.38.** This delivery. Awaiting apply, probe, and the CE's ruling on §1's deviation.

### What a successor session needs

**THE SEAL PATH (amended, authoritative):** one fresh evening = the **4× money-claim re-probe** (vendor + figure + filing intent, scripted, fresh thread) + **CARD ONE re-run TWO-LIMBED** (presence *and* agreement — F-05.36) + CARDS TWO–FOUR spot-held. **From `+919625759924`. NO START required** — the bride has been opted **in** since 12:54:33. 4/4 clean and two-limbed green → the sitting seals. A rate established → the seal waits on the arc's witness-line limb.

**THEN:** ② the seal evening → ③ F-05.32 (three one-line Sonnet de-escalations) → ④ **the couple-lane mechanical arc**, chartered with four customers: F-05.33's ruled (b)+(c) gate · F-05.34's witness-line limb · F-05.35's money guard (`provenanceHold.ts`'s port) · F-05.36's mechanical second limb, plus checkered bride writes.

**Also riding that evening:** the declared `twilio_sid` SELECT on the two undelivered rows — F-05.33's one open gap, which closes regardless of the cure's timing.

**Filed, homed, not this session's:** F-05.37 → Block 14. The doctrine-collision sentence → deferred by name to the arc; the W-1 wall does not reopen for a sentence that changes no behaviour.

**The register the successor inherits:** the founder's ruling stands — *a joke at the named sister is Mira's character.* The shipped soul is byte-exact. No v3 exists.

**The executor's own ledger this session, four owned:** a rigged humour probe that measured task-load instead of register · `"immediately after"` in a card's own wording, which nearly bought a false verdict and was excluded only by millisecond ordering · a SQL-provenance bounce (`public.bookings`, guessed from a tool name, in the same message that cited the law) · and a `heal-on-its-own` argument that was true of token reads and false of session-blob reads — **falsified by the founder's own probe, which is how this micro exists at all.** Root, true of all four: *reaching for the expected shape instead of the text in front of me.* The harness, the founder, and the browser each caught one. The eye caught none.
