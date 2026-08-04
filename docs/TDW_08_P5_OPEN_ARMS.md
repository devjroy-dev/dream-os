# TDW_08 P5 — THE CONSOLIDATED OPEN-ARMS PACKET

**Ordered by the CE at the ×3 ruling, 2026-08-04, §5:** *"half your 'still open'
line has never been [before this desk]… ONE CONSOLIDATED OPEN-ARMS PACKET: every
held item, its evidence, its arms, before or alongside the ZIP."*

**Derived at dream-os `1d79567`.** Every claim below has a command behind it or
is marked underived. **Nothing here is a recommendation dressed as a ruling; the
arms are enumerated and none is picked.**

**The chair is right that these were carried as a list rather than presented as
findings.** A "still open" line at the foot of a handover is a pointer, not a
packet, and a pointer is how F-08.51's orphans happened. This is the correction.

---

## ⚠ 1 · THE SOUL CEILING — SHIPPED PAST ITS LAST RATIFIED NUMBER, AND STILL IS

**THE MOST URGENT ITEM HERE.** The chair's §5 states the last ratified ceiling is
**12,250**, and that nothing past it ships until ratify-or-revert is put with its
arithmetic. **Derived at `1d79567`: `CLOSER_SOUL.length = 12,793`, `SOUL_CHAR_CEILING = 12,800`.**
It is live, it is running, and it has been since `5f29457`.

**How it happened, and it is a mechanism rather than an oversight.** The bench
asserts `length <= SOUL_CHAR_CEILING` — and the const moved with the prose in the
same commit, every time. **A ceiling that travels with the thing it caps is not a
cap.** That sentence is already in the const's own ladder comment; what it did
not do was stop the ship.

**THE ARITHMETIC, which is what was owed:**

| Step | Number | What bought it |
|---|---|---|
| spec, 2026-07-14 | 7,000 | written against a Closer with no name, no opening beat, no conviction paragraph, no persuasion craft |
| CE | 10,000 | the ceiling exists for COST; the prefix is cached by construction on both architectures |
| CE, third RED | 11,500 | the F-08.58/60/62/63 cures are soul craft, and craft costs characters |
| **executor-proposed** | 11,750 | the two ruled additions measured 11,650 after one tightening pass |
| **executor-proposed** | 12,100 | the fabrication root cause + the exit clause: 12,007 after three passes |
| **executor-proposed** | 12,250 | ← **the chair's last ratified number** |
| **executor-proposed** | **12,800** | the rename's same-name paragraph carrying the persona-boundary law: **12,793** after one pass |

**The measurement the cost argument rests on is fresh:** the founder's own run at
`39087f4` returned `cache_read=7,110` Haiku and `6,784–6,912` DeepSeek **on every
warm turn**. The prefix is paid once per cold window on both architectures.

**ARMS:** **(a)** ratify 12,800 · **(b)** refuse, and revert — **the byte to
re-cut is the last sentence of the same-name paragraph** ("their couples get you,
they get Victor"), the least load-bearing of its three limbs; the boundary itself
does not cut · **(c)** ratify with a structural rider that the ceiling const may
not move in the same commit as the prose it caps.

---

## 2 · ARM 1 — DROPPING THE STALE INBOUND. SHOWN FATAL, TWICE.

**THE FINDING.** F-08.70's declarative killed the explicit "welcome back"
(4/6 → 0/18) but the softer form persists: ~5/6 wakes at `39087f4` answered the
stale `ok tell me more` as a live request. Arm 1 — drop the stale inbound from the
messages array — was pre-authorised by the chair at that reading.

**IT CANNOT EXECUTE AS WORDED, and I have shown it by command twice** — once at
`39087f4`, once again on the renamed tree:

```
[closer] no-send — a nudge with no conversation behind it has nothing to say
  RESULT source=no_send text=""
```

**Every nudge silently stops, with no red anywhere in the floor** — `runNudgeJob`
treats `no_send` as a legal silent turn that does not even spend one of her two.
The API constraint underneath is on the record at `886d0f7`: `400 messages: at
least one message is required`. Nothing in the rename changed it; with the opener
unlogged, dropping the inbound leaves either an empty array or a leading
assistant turn, and Meta's API takes neither.

**ARMS:** **(a)** quote the inbound into context too and keep it in the array —
the frame states its age; this is the current build plus the declarative, which
measured 1/6 explicit and ~5/6 soft · **(b)** retire the model call on wakes one
and two as well, the way §2 retired the exit — kills the class outright, costs
the two messages she is good at · **(c)** accept the residue and re-measure at the
next ×3, since the declarative has one run of data and the softest forms may be
prose rather than architecture.

---

## 3 · F-08.76 — THE OPENER IS UNLOGGED IN PRODUCTION

**THE FINDING, derived by command:** `runOpenerJob` (`src/lib/prospects.js`) sends
`marketing_opener` and calls **`logMessage` nowhere** — no conversation exists
yet; `openProspectConversation` runs on the INBOUND. **The first message every
prospect receives enters no history, no transcript, no bench and no model
context.** It was invisible to every instrument this arc built, which is exactly
why F-08.75's two-name defect survived three seals.

The harness now **renders** it (read from the registry, never retyped) and does
**not** push it into her history, because injecting a row production does not
have is F-08.68's own class.

**ARMS:** **(a)** leave it — she never saw it and the prospect did · **(b)** log
it at send time, which means opening the conversation earlier and touching the
state machine · **(c)** log it retroactively at the inbound. **Arm (b) is the only
one that makes fixture and production agree.**

---

## 4 · THE SIGN-OFF UPGRADE — A DECLARED DEVIATION AWAITING RATIFY-OR-REVERT

**THE RULING AS WORDED:** *"idempotence tests for the signature's SUBSTRING, not
the whole string."*

**WHY I DID NOT BUILD IT LITERALLY.** A trailing `— Mira` **is** a substring of
the signature, so the literal reading counts it as already-signed and
**suppresses the append** — leaving a link close carrying her name and **no
disclosure that she is an AI**, at the exact site the signature exists for. That
reopens F-08.58.

**WHAT SHIPPED INSTEAD:** the partial sign-off is **upgraded in place** — a
trailing bare `— Mira` is absorbed and the sealed line takes its position. Same
stated outcome (one sign-off), without the consequence. **Live since `39087f4`.**

**ARMS:** **(a)** ratify the upgrade · **(b)** the literal reading, accepting that
a close signed `— Mira` alone carries no AI disclosure · **(c)** a third shape
the chair names.

---

## 5 · THE `'closer'` SOURCE TOKEN

**THE CHANGE:** the turn's `source` read `'maya'`; at the rename it became
`'closer'` — persona-neutral, because a machine token carrying a vacated
persona's name is a rename waiting to be missed. **Live since `5f29457`.**

**DERIVED:** only benches read it. `prospects.js` passes it through as
`replySource` and gates on nothing.

**⚠ NAMED, NOT FIXED:** `b5c_prospect_lane_bench:200` and
`b08_p1_lifecycle_bench:893` still **stub** `source: 'maya'`. Harmless — they
never reach the engine — but **stale-named**, and outside the file list of every
charter since.

**ARMS:** **(a)** ratify `'closer'` and sweep the two stubs in a docs-and-benches
movement · **(b)** ratify and leave the stubs, filed · **(c)** revert to `'maya'`.

---

## 6 · F-08.73 — A BENCH RED FOR FOUR SEALS, NOT MINE

**`b06_meter_bench` reads 28/29.** `§3.2 no OTHER route moved — the whole DEFAULTS
map, key-for-key` has been FAILING since Phase 3 seeded `model.wa_marketing.default`.
**Proven both ways at every seal since, including this one: identical at base and
cured.**

The cell pins `JSON.stringify(DEFAULTS)` against a five-key literal. Maya's route
was a legitimate sixth key; the wake split has now grown that entry further.
**The bench convicted a correct change and nobody read the number.**

**ARMS:** **(a)** the literal gains the `wa_marketing` row · **(b)** the cell
narrows to the keys it means to police, so a new surface cannot redden it again ·
**(c)** leave it red and filed. **Arm (b) retires the class; arm (a) resets its
clock.**

---

## 7 · THE MEDIA-DEDUPE RED — A SECOND ONE, SAME CLASS

**`b05_f0555_media_dedupe_bench` reads 22 passed, 1 failed** — `§6.2 the guard
speaks to NOBODY — it writes a row and returns, never a line`. **Identical at
`101e03e` and at every cured tree since. Not mine, and its diagnosis is not
derived** — I have not read that bench's subject and will not guess at it.

**ARMS:** **(a)** charter a sitting to diagnose it · **(b)** file it and leave it ·
**(c)** fold it into F-08.73's sweep as one "unreported floor reds" act.

**THE SHAPE BEHIND BOTH:** two benches in this estate are known-red and were
reported by an executor rather than by the floor. **F-08.50's exact class, and it
has now recurred twice.** The arm nobody has proposed yet: a floor runner that
fails loudly on any non-green bench, so a red cannot be inherited.

---

## 8 · WHAT IS NOT ON THIS LIST, AND WHY

**F-08.64 (the humanity lie)** and **F-08.69's Haiku specimens** are OPEN but
carry no arms for the chair: the first waits on the founder's provenance
sentence, the second is measured by the next ×3 rather than ruled. **F-08.75's
opener template** is founder territory (a Meta re-filing) and its packet already
shipped. These are named here so the omission is deliberate rather than another
pointer.
