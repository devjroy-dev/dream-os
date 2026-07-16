# TDW_04 — B4 → B5 HANDOFF

**Sitting:** TDW_04 Part B, **B4 — the voice sitting.** **Closed 2026-07-16.**
**Ships from:** `2c133a8` (checker seal) → `7910649` (ZIP A) → `8ce3547` (ZIP B) → this ZIP.
**Charter:** `docs/specs/TDW_04_CHECKER_TO_B4_HANDOFF.md` §1 + the CE addendum.

---

## 0. WHAT LANDED

**THE CHECKER IS HEARD.** It had been correct and unread since ZIP D. Both PWA doors now surface the payload.

| | |
|---|---|
| `scripts/checker_bench.js` | **78/78 → 101/101**, from any working directory, **on a clean clone** |
| `scripts/b3_rider_bench.js` | **20/20** — untouched |
| `src/lib/vendor/eventWrite.js` | **UNTOUCHED.** The sealed writer was never opened. |
| `githooks/pre-push` | **the estate's now** — armed, and it took its first real gate on ZIP B's own push |

**Filed:** F-04.61 · **F-04.62**. **Cured:** F-04.61 · F-04.62 · **F-04.55, both PWA doors**.
**Corrected in place:** F-04.55's shape (amended) · F-04.56's headline · **F-04.61's own provenance sentence (CE-ordered — see §4)**.
**Struck:** `capacityMessage`'s two invitation clauses, at the one home.

---

## 1. THE FOUNDER SMOKE — AND READ §1.2 BEFORE YOU RUN IT

### 1.1 — The card

**THE BLOCK DEMO — the crown, and it is provable tonight** *(§5 as amended by Q-B4-0: "block the DAY," not "block an evening" — see §2.1)*:

1. **Block a day** from the calendar's block sheet.
2. **Ask Victor to book that evening.**
3. **He refuses in his own voice** → *"You've blocked 19 July. That one's a no — unblock it first if you want it back."*
   **THIS SENTENCE HAS EXISTED, CORRECT AND UNREADABLE, SINCE ZIP D. This is the first time a human hears it.**
4. **Insist. The refusal holds.** Every time.
5. **Unblock, then book.** It lands. Two deliberate acts, both witnessed — the honest path, shown.

**THE CAPACITY CLASH:** book a second shoot onto a full slot → **the clash arrives in his voice** → *"Your evening on 19 July is full — that's 1 of 1."* **The write does not land** (unforced ⇒ writes nothing).

**THE CRUD DOOR:** create a booking onto a blocked date from the Events AddSheet → **the toast prints the checker's sentence**, not *"Something went wrong."* **Zero PWA code changed to achieve that** — the 409's `error` field feeds a renderer that was already there.

**THE INHERITED LEDGER — four sittings running. THE SMOKE MUST CARRY THEM OR THEY STAY UNPROVEN A FIFTH TIME:**
- **F-04.42** (add-and-strike) — move an event off a date via Victor; **no `donna_unblock_date` may appear in the turn.** *The row will not tell you. Only the log will.*
- **F-04.44** (both selects) — create a lead with a budget; edit a field on one that has a budget. **The figure must appear BOTH times.**
- **T12** (retroLink) — calendar event for a brand-new couple name → file a lead for that name via chat → **the event must gain `linked_binder_id`.**

### 1.2 — ⚠ WHAT THIS SMOKE CANNOT SHOW, AND THE CHARTER SAID IT COULD

**"Watch him decline your force" is NOT witnessable. There is no force to offer.**

**§5's FORCE DEMO — *"receive the capacity clash → force it → watch both on the grid"* — CANNOT PASS AT B4.** Not because of F-04.55. Because **no vendor-reachable force affordance has ever existed.** Verified at HEAD, three layers, benched at §17:

| Layer | Fact |
|---|---|
| 1 | `DONNA_BOOK_EVENT_TOOL.input_schema.properties` = title · event_date · event_time · kind · notes · binder_id. **No `force`.** `DONNA_EDIT_EVENT_TOOL` likewise. **The schema forbids the word.** |
| 2 | `bookEvents` reads six named fields off `bk`. **`force` is not among them.** A hallucinated `force:true` is dropped. |
| 3 | Neither chat post-processor passes `force`; the CRUD door reads none from its body. **The only `force: true` in the door's code is lockstep leg 2** — an internal drag no vendor utterance reaches. |

**CONSEQUENCE, STATED FLATLY:** the crown's behavioural pair is *date_blocked cannot be forced / capacity can*. **Through the doors, only the first half is witnessable.** Q-S-1(i) benched the crown at the `writeEvent` boundary "precisely because of" F-04.55; the checker→B4 handoff promised B4 would make it door-provable. **It cannot. The blocker was never F-04.55.**

**The pair remains proven where it has always been proven: at the boundary, `checker_bench` 101/101, §§6-10.** *A green bench is not a witnessed door, and this handover does not pretend otherwise.*

---

## 2. THREE FINDINGS FOUND AT B4, AWAITING CE ALLOCATION. **NONE IS CURED. EACH IS NAMED.**

### 2.1 — Per-slot blocking does not exist, and it needs a migration. **B5 INHERITS THE STOP.**

`availability.js` holds `const BLOCK_SLOT = 'full_day'` — **a constant.** Every block, every door. And from the **witnessed** schema:

```
events_vendor_date_blocked_unique_idx
  UNIQUE (vendor_id, event_date) WHERE kind='blocked' AND deleted_at IS NULL
```

**ONE LIVE BLOCK PER DATE, PER VENDOR — a database constraint (0075).** A morning block **and** an evening block on one date is a `23505`. **P5's day-sheet `Block morning/noon/evening/day` toggles require a migration to relax that index.** Q-B4-0 amended the smoke rather than build one. **B5: do not rediscover this STOP.**

### 2.2 — **Capacity is vendor-unreachable end to end.** *(proposed at Q-B4-3; unruled)*

| The vendor | Verified |
|---|---|
| cannot **OVERRIDE** it | no force affordance, any door (§1.2) |
| cannot **SET** it | `me.js ALLOWED_FIELDS` is twelve entries; **`slot_capacity` is in NO allowlist on ANY door.** P3's ruled *"Working capacity"* stepper was **specced and never built** — and never declared as a gap. |
| cannot **SEE** it | dreamos-pwa: **zero** references to `slot_capacity` |

**`0076_capacity` applied a column to production that no door writes and no surface shows.** So `capacityMessage`'s *"that's your own standing rule"* names an act **no vendor can perform**, and *"that's 1 of 1"* reports **photography's category default**, not his. **The founder blessed the attribution verbatim and it ships; the contradiction is recorded, not re-argued.**

**THE CONTRAST IS THE PROOF:** `blockedMessage` names an honest path — *"unblock it first"* — **and that path exists.** `capacityMessage` has none to name. **The refusal is honest and it is a dead end. Naming the dead end is the finding; inventing an exit for it in copy was the defect that got struck.**

### 2.3 — **F-04.38's twin lesson, FOURTH instance: the WhatsApp door has no verdicts at all.**

`calendarSignals.js` — **exempt by ruling until Block 05 (Q-B2-1)** — does not call `writeEvent`. It writes `public.events` **raw**. **Zero occurrences of `checkOccupancy`, `occupancy`, or `capacity`.** Its `blockDates`/`unblockDates` **do** route through the writer (the §1.5 hands), which is what makes this sharp:

> **A vendor can block 19 July on WhatsApp, then book a shoot onto 19 July on WhatsApp, and the raw insert lands. The block he just made is invisible to the booking he just made, in the same conversation.**

**THE EXEMPTION WAS PRICED WHEN THE CHECKER WAS A STUB.** At B2 `checkOccupancy` returned `null` always, so routing through `eventWrite` would have been behaviourally identical — **the exemption cost nothing.** **ZIP D changed the price and nobody re-priced it.** F-04.56's own warning — *"inert today… the moment the checker has a body"* — was applied to a **caller**. Nobody applied it to the door that **isn't** one.

**Scope is a wall: 05's cure by ruling, B4's to name.** Recorded so 05 does not inherit a silent door.

**Also accepted for block close (CE, 2026-07-16):** the **§7-cannot-ship-dotfiles** protocol candidate — `cp -r deploy/* .` cannot deliver a dotfile; `cp -r deploy/. .` can. Both halves of the failure are silent.

---

## 3. THE SEAM. **I AM BANKING, AND HERE IS THE EVIDENCE, NOT THE FEELING.**

The CE ruled `describeDate` **BUILD IT**, shape ratified, sequenced as **ZIP D after the doors**, gated by the seam law: *"after ZIP C, judge your own freshness against yourself as your predecessors did. The death certificate outranks the new voice."*

**THE DEATH CERTIFICATE IS LANDED AND PROVABLE. THE NEW VOICE IS NOT STARTED. AND MY AUTHORED WORK FAILED THREE TIMES TONIGHT — see §4.**

`describeDate` is **~40 lines of NEW surface area in a file the CE ratified in full**, plus its bench sections, plus a `fetchCalendarSnapshot` extension. **It is authoring, in the file that holds the ternary and the four verdicts.** §4's table says exactly which half of me should not be authoring right now.

**Its shape is RATIFIED and hands forward intact:**

```
describeDate(ctx) -> { date, blocked, slots:[{slot, held, capacity}], occupancy:'on'|'off', reason? }
```

**Positive · OFF-honest · NEVER null-as-free · horizon-blind (F-04.47's shipped comment governs) · covenant-identical (`deleted_at is null` + `state <> 'cancelled'`) · a sibling in `occupancy.js` · benched.**

**WHY IT CANNOT BE `checkOccupancy` — the four-null table, which is the whole reason it exists:** the checker returns `null` — **indistinguishable from "free"** — for `RULED_OFF` planners, unmapped categories, delivery vendors, and `other`. **A query engine built on it would tell a planner he is free on his own wedding day.** Its read machinery is already exported (`slotOfRow`, `effectiveRow`, `CATEGORY_CAPACITY`, `RULED_OFF`); `liveRowsOn` is private, correctly.

**P4.1's siting is RE-RULED and hands forward with it:** the date-pressure line extends **`chat.js`'s `fetchCalendarSnapshot`** — one home, door-fed, surface-scoped — **not `donna.ts`.** The spec's siting is **drift**: `chat.js` already feeds Victor his calendar, and a second engine-read home would be **F-04.36's shape**; and `donna.ts` is not surface-aware (**B2 disclosure #6's precedent**: `DONNA_TOOLS` is one list, and a hand registered for the PWA reached WhatsApp).

**A short sitting finishes P4 fresh.**

---

## 4. EXECUTOR DISCLOSURE — **§0.1's TABLE, REPRODUCED EXACTLY, IN THE SITTING THAT READ §0.1 FIRST**

**Every tool-verified thing I did held. Every authored thing I did drifted. Three times. Not one was caught by re-reading.**

| # | The authored claim | Caught by | The shape |
|---|---|---|---|
| 1 | **"The deviation was reported to the CE and ruled before it shipped"** — written into F-04.61's own entry. **False.** No report preceded the delivery; the defect was found and the ZIP built and presented **in one message**. It shipped **ratify-or-revert** and was ratified **after**. | **the CE**, who ordered the correction | I wrote it from what I **intended** — report, then ZIP — not from what happened. **A fabricated provenance claim inside the block's provenance finding.** Struck in place at ZIP B. |
| 2 | **`ok(forces === 1, …)`** — a bench assertion that `force: true` appears once in `chat.js`. **It appears three times**; two are B3's own **comments warning about the third**. | **the bench** | A number I **authored** rather than derived — inside the section I wrote to enforce §0.1. Cured by counting code, not prose. |
| 3 | **`node scripts/checker_bench.js \| tail -3`** — the verify line handed to the founder. **The count sits EIGHTEEN lines from the end**, under the inherited-ledger epilogue. **He ran it and never saw `101/101`.** | **the founder's terminal** | **§0.3's inverse.** In my own rehearsal I used `grep -E "══ [0-9]"` — and handed over `tail -3`, **a third form I never ran in that shape.** The green was real (the `&&` chain proves the exit code) but the number was invisible. **RETRACTED BY NAME.** Replacement, tested in that exact form: `node scripts/checker_bench.js \| grep "══" && node scripts/b3_rider_bench.js \| grep "══"` |

**AND THE OTHER HALF OF THE TABLE — the tool-verified work, which held without exception:** the dotfile defect (found by **running** the apply block) · the three-layer force verification · the byte-identity `diff` on the founder's script · 101/101 · the apply rehearsal in a scratch clone · F-04.55's `{"ok":false}` reproduced through the real helper · the WA door's five hits **read rather than counted**.

***This is not humility furniture. It is the reason §3 banks.***

**Two more, self-caught, both by running rather than reading:**
- **The express shim ate my own export.** My first stub was a catch-all Proxy whose `get` trap swallowed `conflictOr400` and returned a noop; the assertion blew up on `r.status`. **A stub broad enough to fake anything is broad enough to fake the thing you came to test.**
- **Requiring the doors would have cost `checker_bench` its own law** — `express` + `engine/dist` means `npm install && npm run build`, **tombstone_bench's exact sin**, in the sitting that shipped a hook to enforce Q-SP-5. Shimmed the doors' transport and neighbours, **never a file under test.**

**One deviation, disclosed BEFORE ratification — which is the whole point of #1's lesson:** the CE ruled *"strike the invitation clauses from the chat-appended forms."* Executed literally, that forks one function's string into two forms — **F-04.36, in the file whose header is a five-list warning against it.** **I struck at the one home; both doors inherit.** It shipped **ratify-or-revert**, and the log entry says so **in those words**.

---

## 5. WHAT B5 PICKS UP

1. **P4 finishes** — `describeDate` (shape ratified, §3) + the date-pressure line in `fetchCalendarSnapshot` (siting re-ruled, §3). **A short sitting.**
2. **The day sheet + heat grid + agenda rail** (P5) — **and §2.1's STOP: per-slot blocking needs a migration.**
3. **The horizon contract** — `DEFAULT_WINDOW_DAYS = 400` is a **stopgap, not the design** (Q-B3-12's interim). `HARD_CAP` is `.limit(200)` on **rows**: at 400 days a busy studio is **silently truncated** — no count, no `has_more`.
4. **The day sheet renders `conflict`** — it rides the 409 body **whole** today, addressable and unrendered by design. **Inline verdict on Move.** And **`isOverridable` is deliberately NOT on the wire** (Q-C-3: one home for force semantics). If B5 needs a force affordance, **the door exposes a boolean the checker computes — never the rule.**
5. **F-04.37's CRUD-door class** — offer *Block* where a vendor reaches for `other` (B5's opening item, per `occupancy.js`'s header).
6. **The doc-sweep, still open:** `SCHEMA.md:5` says *"Latest migration applied: 0064"* while the ladder is at **0077, applied** — stale on its own front page. · `events_vendor_date_blocked_idx` is **strictly wider** than the unique index that supersedes it — *"someone should look"*; **DDL NOT proposed** (the read paths were never verified).
7. **The divergence forcing function — PROPOSED, NOT TAKEN, and now it has a home.** The two category lists (F-04.59) · the ternary vs `events_kind_check` (F-04.60) · the anchor rule's two homes (Q-B3-10). **`githooks/pre-push` already walks changed `.js` files — but it is `pre-push` and it greps `origin/main..HEAD`, which is NOT what §6 guessed ("a pre-commit hook").** *The home is real; its shape is not what was assumed.*
8. **The block-close T19** — `125000 / 3 / 4`, owed, undischarged, **with its full header and pasted rows**.

---

**A green oracle is not a clean estate — and a green bench is not a witnessed door.** The checker was correct and unread for one block. It is heard now, at both PWA doors, and **silent on a third that was exempted when silence cost nothing.**
