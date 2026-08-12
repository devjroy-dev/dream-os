# TDW_10.C · DELIVERY 3 — THE GATE. THE COUPLE LANE CAN NOW SAY NO.

**Repo:** `dream-os` · **base:** `ead0b9b` (re-derived fetch-first)
**Role:** LE. The executor never pushes.
**This is the third act of ⑨'s sequence** — 「 ledger → meter → refuse at three doors, never in one act 」. The doors turned out to be **eight**, not three; ⑨'s count was the then-known one.

---

## ⚠ ONE BYTE SHIPS UNARMED — PENDING VETO

§0.2-J / relay №4 ruled **J1**: the onboarding surface at dial `0` refuses with the trimmed byte 「 Chat is paused right now. 」 — because a bride mid-signup has saved nothing, and the full zero byte would promise a state the machine does not hold.

**The founder's word has not arrived.** `ZERO_ONBOARDING_ARMED = false`. The byte ships **present, inert, and named**: arming it without a veto would put an unvetoed sentence in front of a bride; omitting it would lose the ruling. Cell 8.7 asserts it stays unarmed. **One line flips it when he approves.**

---

## THE FOUR VETOED BYTES — frozen, pinned in the bench as literals

| surface / state | byte |
|---|---|
| bride, daily | 「 You've reached today's conversation limit. I'll be right here at midnight. 」 |
| bride, monthly | 「 You've reached this month's conversation limit. I'll be right here on the 1st. 」 |
| circle, any | 「 The board's chat is quiet for today — you can still browse and add to it any time. 」 |
| any, dial 0 | 「 Chat is paused right now. Everything you've saved is still here whenever you want it. 」 |

Cells 8.4 and 8.8 pin the **bytes**, not the intent — an edit, even a comma, reddens and needs a fresh veto.

---

## THE GATE

**The read** — `readCoupleCap` mirrors `chat.js:2687-2694`'s IST window shape, **re-derived at this seat's tip (`ead0b9b`), never transcribed**: `IST_MS` at `:2687`, `istDayStartUtcISO()` at `:2688`, `istMonthStartUtcISO()` at `:2692`. Duplicated rather than imported — that module is Express-bound vendor machinery and this one is called from the WhatsApp lane. Same shape deliberately: a couple and a vendor whose caps roll at different midnights is a support ticket nobody can answer.

**The unit** — `COUNT(DISTINCT turn_id) WHERE kind='turn'`. Counting rows would price 20 messages at as few as 4.

**F-10.85, and it is the most defect-prone line in the cure.** `dialValue` exists because both natural JS idioms swallow zero: `Number(v) || fallback` returns the fallback for `"0"`, and `v ?? fallback` returns `""` for an empty string. **A present dial reading `0` is a DENY; an absent dial is `Infinity`.** Absence is not zero — the gate fails open on missing config exactly as it fails open on a thrown read.

**Fail-open, absolutely.** Every failure path returns `state: 'ok'` with `degraded: true`. A broken meter costs an unmetered turn, never a silent agent.

**Precedence (fork E):** zero > monthly > daily. At `0` nothing was "reached."

## THE DOORS

| door | file | behaviour at cap |
|---|---|---|
| WhatsApp bride | `brideInbound.js` | one byte, turn ends; no engine, no fan-out, no loop |
| in-app SSE | `couple/chat.js` | byte streamed **before** `thinking` — no typing indicator for a turn that won't run |
| in-app JSON | `couple/chat.js` | byte in the route's own `{ ok, reply, tool_calls }` envelope |
| circle | `brideIndex.js` | his byte; the cap he meets is **hers** (F-10.107 in the refusal as in the meter) |
| image (both) | `imagePipeline.js` ← `museSave.js` | **fork A**: save survives, tagging skipped, tags empty |
| onboarding | resolved at the door | **fork B**: exempt from reached-cap; zero-dial refusal pending veto |
| fan-out | behind the bride door | **fork C**: never reached — the door refuses first |
| search / tagging in-flow | — | **fork D**: silent to the user, spoken to the log |

**Fork C, stated precisely:** the batch is not separately gated because it cannot be reached at cap — `surfacePendingCircleSessions` runs only inside a bride turn, and that turn is refused at the door. `summarized_to_bride` stays `false`, so nothing is lost and everything catches up on lift.

**Fork B's mechanism is named in-comment per F-06.85.** `surfaceForCouple` is a **copy** of `brideEngine.js:85`'s branch condition. The two are one fact: change how the engine decides a bride is onboarding without changing this line, and the door refuses a bride the engine would have onboarded.

**Every cap-caused skip logs itself by name** (forks A/C rider). F-09.173 is standing law — a photo was eaten silently and the silence cost a night of diagnosis. `logCapSkip` says which it is: *"This is a cap decision, NOT a pipeline fault."*

---

## NAMED COSTS — accepted at ruling, carried verbatim

- **An untagged save is invisible to `list_muse`'s tag search, and NO BACKFILL runs when the cap lifts.** (Fork A.)
- **Circle summaries are deferred, not lost**, while a couple is capped. (Fork C.)

---

## PROOF

**29/29 cells** on the applied tree (20 + nine gate cells). Both-ways by mutating **production code**:

| mutation | effect |
|---|---|
| `Number(v) \|\| fallback` in `dialValue` (F-10.85 swallowed) | 29 → **27** |
| absent dial defaults to `0` instead of `Infinity` | 29 → **28** |
| count rows instead of `DISTINCT turn_id` | 29 → **28** |
| gate fails **closed** (rethrow instead of warn) | 29 → **28** |
| onboarding loses its exemption | 29 → **28** |
| an approved byte drifts | 29 → **28** |

### TWO SELF-CAUGHT BENCH DEFECTS

1. **Cell 6.5's boundary could vanish.** It sliced the module at the `// DELIVERY 3` comment banner — after stripping comments, `indexOf` returned `-1` and the "meter half" silently became the whole file. It now cuts on a **code** marker and fails loudly if that marker moves. *A boundary that can vanish is not a boundary.*
2. **Fork B's exemption had no teeth.** With the zero byte unarmed, `refusalByteFor` returns `null` for every onboarding state — so deleting the exemption outright changed nothing observable and M12 stayed green. The rule now lives in `onboardingRefusesAt`, a predicate the bench asserts directly. *A rule that cannot be tested while a byte awaits veto is a rule that will be quietly lost at the veto.*

**Cell 6.5 is a LABELLED AMENDMENT, re-aimed not deleted.** It asserted 「 delivery 1 refuses nothing 」 — true when written, and its subject lawfully arrived. Teeth kept, aimed at what still must be true: the gate is **read-only** on the dials, and the ledger writers carry **no** cap decision. RATIFY-OR-REVERT.

`node --check` clean on all seven touched `.js`.

---

## WHAT GATES ACCEPTANCE — the founder's acts, not this seat's

1. **Walk leg 3** — one PWA upload through `couple/muse.js` (Meta cannot deliver a photo to the pipeline, F-09.173).
2. **R-29.34 both members** — dial to `0`, witness the vetoed byte on a real turn, restore.
3. **CE-209's bride integration walk** binds final acceptance.
4. **The J1 veto** — one word arms the onboarding zero byte.

Proof shape unchanged: refusal at `0` red-uncured / green-cured · broken meter still answers · floor byte-stable.
