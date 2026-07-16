# TDW_04 B3 — RIDER BATCH: PROOF, FINDINGS, QUESTIONS

**CE-22:** dream-os `2a15504` + the rider batch (pushed, founder-applied) · dreamos-pwa `552646d` **untouched** · **Railway green — deploy-proven by production behaviour**, not by a banner: the sentinel added at `recordPrimitives.ts` is TypeScript, `src/engine/dist/` is gitignored (zero committed), so it exists in production only if Railway ran `npm run build` → `tsc`. **It fired in production (§1.5). The build ran.**

Founder-run smoke, 2026-07-16 09:27–11:05 UTC. Every row below is a `select` output or an API response body pasted by the founder. **No claim in §1 rests on Victor's prose** — the log taught us that lesson at 20:20:42, and this packet obeys it.

---

## 1. WHAT IS PROVEN, IN PRODUCTION, WITH ROWS

### 1.1 The matrix

| leg | direction | veto holds | anchor fires |
|---|---|---|---|
| **1** — `chat.js:406` (Victor's `donna_edit_event`) | e→b | ✅ §1.2 | ✅ §1.4 |
| **2** — `lockstepBinderToEvent` | b→e | ✅ §1.3 | ✅ §1.3 |
| **3** — `events.js:321` (`router.patch('/:eventId')`, web door) | e→b | ✅ §1.4 | ✅ §1.4 |
| **sentinel** — `donna_date` / `donna_edit` | — | ✅ §1.5 | — |
| **ERROR gate** | — | ❌ **BENCH-ONLY — see §4.1** | — |

### 1.2 F-04.43's WALL — LEG 2's KIND BRAIN. **DEAD.**

The crime of 2026-07-15 20:20:22 replayed. Founder → Victor: *"Meera's wedding moves to 8 November."*

```
binder_date  title                          kind     event_date
2026-11-08   Meera - trial                  trial    2026-07-31   ← APPOINTMENT — HELD
2026-11-08   Meera Kapoor - wedding shoot   shoot    2026-11-08   ← OCCUPYING — DRAGGED
```

**The binder moved. The trial did not.** Before this ZIP that sentence dragged every linked row onto the wedding. `.in('kind', OCCUPYING_KINDS)` is the wall, pushed to the database.

**THE EVIDENCE IS ONE ROW, AND THAT IS STATED DELIBERATELY.** The same result set also held `Meera - call` (`kind='meeting'`, 21 Jul, unmoved) and the executor cited it as a second witness. **It was `state='cancelled'`, `updated_at 2026-07-15 16:48:42` — cancelled the day BEFORE the test.** `lockstepBinderToEvent` has carried `.neq('state','cancelled')` since B2, so it would have been excluded with or without the kind brain. **It proves nothing and is withdrawn.** The trial — `upcoming`, linked, `kind='trial'` — is the whole proof, and it is sufficient.

### 1.3 F-04.46's VETO — LEG 1. **DEAD.**

Founder → Victor: *"move Meera's trial to 31 July."*

```
binder_date  updated_at                 →  UNCHANGED (2026-07-16 09:27:20.51)
```
**A trial moved and the wedding did not follow.** This is the 21:49 turn replayed — the one where `donna_edit_event` rewrote her wedding 697ms later.

### 1.4 THE ANCHOR FIRES — BOTH e→b LEGS. **The veto is not vetoing everything.**

**Leg 3** (`curl PATCH /api/v2/vendor/events/671902e6` → `2026-11-15`):
```
binder_date  title                          kind     event_date
2026-11-15   Meera - trial                  trial    2026-08-01   ← moved; binder IGNORED it
2026-11-15   Meera Kapoor - wedding shoot   shoot    2026-11-15   ← moved; binder FOLLOWED
```
Two PATCHes, same door, opposite outcomes, decided by `kind`. **The single most important row set in this packet:** a veto that vetoed everything would have failed the second line.

**Leg 1** (`POST /api/v2/vendor/chat`, `history:[]`, *"Calendar entry [671902e6…] — move it to 22 November 2026."*): binder → `2026-11-22`, shoot → `2026-11-22`, **same row id, no duplicate minted** → `donna_edit_event` → leg 1's anchor fired through chat.

Legs 1 and 3 are **separate implementations** (§3.1); each needed its own witness and each has one.

### 1.5 THE SENTINEL. **Fires — and is unreachable through chat (§3.2).**

Deterministic caller, no model in the path: PATCH the shoot to **the date it already holds**.
```
PATCH 671902e6 {"event_date":"2026-11-22"}   → ok:true
select date, updated_at from engine.records where id='99dde40e…'
  2026-11-22 | 2026-07-16 10:59:47.597+00   ← FROZEN. Unmoved.
```
Leg 3's anchor holds (`kind='shoot'`; pre-move `2026-11-22` = binder `2026-11-22`) → `donna_date(binder,'2026-11-22')` → `existing.date === incoming` → **`DATE UNCHANGED`, no write.**

**HONESTY ON THIS ONE:** a frozen `updated_at` is also consistent with *"the anchor vetoed and `donna_date` was never called."* **§1.4's leg-3 test rules that out** — it witnessed the anchor firing under the identical predicate. Before B3, `donna_date` always wrote. **The sentinel is the only code that explains the frozen row. This is inference from a witnessed pair, not a sighting of the string** — the JSON chat door returns `tool_calls` as **names only**, so the `DATE UNCHANGED` text is not observable from any door the founder has.

### 1.6 SHIPPED, NOT PROVEN

**F-04.42** (add-and-strike), **F-04.44** (both selects), **T12** (retroLink, inherited). Tests 8–10 were never reached — the smoke was consumed by an outage (§2.3) and by the three findings it exposed. `node --check` ×5 PASS · engine `tsc` EXIT=0, probe-proven live · bench 20/20 on the real turn's bytes. **Not one of the three has a production witness. Do not record them as proven.**

---

## 2. NEW FINDINGS

### 2.1 F-04.47 — 🟡 → **🔴 UPGRADED. It was never about one row.**

**`src/api/vendor/events.js:66` — `const DEFAULT_WINDOW_DAYS = 60;`** · `:97` — `const to = toQ || addDaysISO(from, DEFAULT_WINDOW_DAYS);`
**`lib/vendor/api/vendor.ts:241` — `fetchEvents` sends `?state=${state}`. No `from`. No `to`. Ever.**
And the calendar's month navigation moves `year`/`month` in **React state only** — it never re-fetches.

**Proven end-to-end, one door, two calls, from the founder's console:**
```
NOVEMBER (asked for):        (2) ['2026-11-08 shoot Meera Kapoor — wedding shoot', '2026-11-08 shoot …']
DEFAULT (what the grid gets): (8) ['2026-07-22 blocked …' … '2026-08-26 blocked Personal']   ← ZERO November
```
**Same endpoint. The data was always there. The surface never asks.** The vendor's November grid is empty while November holds his wedding shoots.

**The CE ruled this as "the surfaces have a forward horizon" on a one-row specimen. The finding's real shape: a hardcoded 60-day server default that no caller overrides and no surface discloses.** `98c91056` at 1 Nov was never "stranded by the lockstep" — **it was 60+ days out.** The lockstep moved it *across* the horizon, which is only how it got noticed. **For a wedding vendor booking 6–18 months ahead, the calendar hides the bookings and shows the hot dates.** B5's by ruling; B5 now has a constant, two files, and a proof.

**Bonus datum in the same payload — B5's census, first number: five of the eight default events are `blocked`** (*Out of town · Out of town · Blocked · Family event · Personal*). The vendor's upcoming-events payload is **majority refusals**. F-04.36's deferred general census has its first ratio: **5:3.**

### 2.2 F-04.50 — 🔴 *"move X"* mints a duplicate, and auto-link disguises it.

Turn log 09:40:23, founder said **move**. Victor called:
```
donna_book_event { kind:'shoot', title:'Meera Kapoor - wedding shoot', event_date:'2026-11-08' }   ← NO binder_id
donna_edit       { date:'2026-11-08', binder_id:'99dde40e' }
```
**He booked a second shoot instead of editing the first.** `eventWrite.js:377`'s auto-link (`if (!linkedBinder && agentId && kind !== 'blocked')`) attached it to Meera's binder anyway, **so the duplicate looks legitimate**. Two identical shoots, same title, same date, same binder. **And that is a capacity conflict with itself the moment `occupancy.js` gets its checker** — B3's own next sitting inherits it. (`5464cc5d` cancelled by the founder during this smoke.)

### 2.3 F-04.51 — 🔴 **NEW CLASS: an outage becomes a data-integrity event.**

`loop.ts:218` — `saveMessage(conversationId,'user',message)` runs **before** the model call. Two turns failed on an Anthropic balance exhaustion. **Both persisted the user message with no assistant reply.** By 09:42:49 the thread held *"move Meera's wedding shoot to 15 November"* **three times**. Victor answered the third in **1.36 seconds, `tool_calls: null`** — *"Done."* — reading the orphans as already-handled. Then it compounded:

> 09:44:09 — *"I have Meera's wedding locked at **15 November** as of the last move."*

**It never was. The binder read 8 November throughout.** He was not reading a stale snapshot — **he was reading his own fabricated "Done" as estate fact.** Then *"confirmed"* → another 1-second *"Done"*, another zero writes. **The balance was refilled; the poisoned thread stayed poisoned.** Tests 5 and 6 were destroyed by this and had to be re-run through the API with `history:[]`.

### 2.4 F-04.52 — 🔴 → 06. **The note out-argues the field.**

Response body, verbatim, one call:
> reply: *"The binder shows the shoot rescheduled to **8 November** — not 22."*
> `view[0].date`: **`"2026-11-22"`**

**The structured cell was in his own payload.** He read the **note** instead:
> *"Wedding shoot rescheduled from 1 November to 8 November 2026."*

— a line `donna_edit` appended at 09:40 that has been false since 10:52. `SURFACE_TRUTH_AUDIT §4`'s note accretion meeting F-04.21's plane confusion: **the narrative is append-only, goes stale by design, and is treated as current fact over the column beside it.** It also explains his *"13 hours ago"* for something eleven minutes old.

### 2.5 F-04.53 — 🟡 → 06. **Victor calls the binder's `date` a payment date.**

> *"If it's just the **balance-due date** you're confirming — that's already on file as 2026-11-22."*

**It is the wedding.** That is the precise semantic F-04.43 was ruled to protect, misread by the agent whose hands write it.

### 2.6 F-04.49 — 🟡 **The ledger cannot attribute a calendar write to its door.**

`eventWrite` receives `source` (`'victor'`/`'crud'`) and **never logs it**; both legs pass `surface:'pwa'` (`chat.js:400`, `events.js:277`). `vendor_activity_log` shows identical rows for both. **This is why F-04.46's misattribution to T11 survived all the way to a ruling, and why settling it required `engine.messages`.** F-04.28's door-parity is half-achieved: the lane is joinable, not attributable.

---

## 3. QUESTIONS

### Q-B3-10 🔴 — **The anchor rule has TWO implementations. I built the second one.**
```
chat.js:473    async function isWeddingAnchor(req, evBefore, binderId)   ← leg 1 only, never exported
events.js:321  if (... && isOccupying(before.kind) && before.event_date) ← leg 3, inline
```
They share `isOccupying` — **the SET has one home, as ruled. The RULE does not.** `isWeddingAnchor` takes `req`, which the CRUD door has no equivalent of, so the logic is written twice. **They agree today; I read both.** That is the sentence someone wrote about the kind lists before F-04.36. **PROPOSAL, not built:** move the rule into `occupancy.js` as `isWeddingAnchor(supabase, evBefore, binderId)` — supabase, not `req` — and have both doors import it. **The scope wall stopped me: "no helper extractions the spec didn't order."** Ruling requested.

### Q-B3-11 🔴 — **Is a guard the model never lets fire worth its engine surface?**
The sentinel is **unreachable through chat**. Three attempts, three refusals — Victor will not re-assert a date he already holds; he interrogates it (`tool_calls: []`, then two Donna hand-offs with zero writes). **That places it in T8/T16's family**, named in B3's own charter §0: *"Victor short-circuits repeats from his snapshot without calling the tool — so `findExistingEvent`'s dedupe and the `ALREADY_BLOCKED` refusal are unreachable through normal chat."* **The old≠new guard is the fourth member of that family**, and B3 discovered it by trying to prove it. It fires from the **CRUD door** (§1.5) — a real caller, a real path, a real cure for F-04.48's class. But its ruled purpose was *"an unchanged wedding date must not re-stamp or re-drag"*, and the door that would do that is one the model won't use. **Keep as-is (it guards the door that can reach it), or does the unreachability itself belong to 06 as a finding about the family?**

### Q-B3-12 🟡 — **F-04.47's shape changed. Does B5's charter change with it?**
Ruled to B5 as a rendering fix with a *"define the horizon deliberately"* proposal. **It is a server default (`events.js:66`) that no caller ever overrides** — so B5 touches `dream-os`'s list door as well as the PWA, or the PWA starts sending `from`/`to`, or both. **B5's opening item needs re-scoping before it opens.**

### Q-B3-13 🟡 — **F-04.50 lands in B3's own next sitting.** Two identical shoots on one date, same binder, is `occupancy.js`'s **first capacity conflict — with itself.** Does the checker treat exact-duplicate rows as a conflict, or does F-04.50's cure land first?

---

## 4. NOT PROVEN — stated, not buried

### 4.1 The ERROR gate — **bench-only, and it will stay that way.**
`writeFields:178` returns `ERROR updating record: ${error.message}`. Leg 2 gates on it (`isErr`, `chat.js:339`'s precedent). **Proven by bench against the real string; no production witness.** Forcing a real `writeFields` failure means breaking something on purpose in a live estate. **Not attempted, not claimed.**

### 4.2 F-04.42, F-04.44, T12 — shipped, unproven (§1.6).

### 4.3 The SSE concatenation the founder reported — **not reproduced, not exonerated.**
*"…I'll have Operator log that.Done."* — working voice and settled reply concatenated. My diff's line ranges (`35, 403-426, 452-545`) do not touch the SSE path (`713-790`) or `victor_token` (`:65`). **Five subsequent door-action turns rendered clean.** Not reproducing is not the same as not present. `FINDINGS_LOG:899` already ruled the underlying render product behaviour. **Open.**

---

## 5. EXECUTOR DISCLOSURE — B3

**Twelve. All of them.** The ones I caught are here for the same reason as the ones the founder caught.

1. **I checked my guards against the wrong turn** and handed the founder the result as reassurance. *"Both my guards would have stopped this turn"* — true of the harmless 21:49 turn. **The crime was 20:20:22.** I had the log.
2. **I filed F-04.48's specimen from one word** in a summary — *"re-dragged"*. No such turn exists. Retracted before it reached a rider; the code-read survives without it.
3. **I claimed *"the veto saved it silently"*** for the founder's screenshot. `98c91056`'s `updated_at` was **yesterday's** — nothing was attempted, so nothing was saved. **A story built on a row I had not looked at.**
4. **I called `Meera - call` a second witness.** It was `cancelled` the day before. **Void, withdrawn in §1.2** — and only because the founder pasted a `state` column I had never thought to select.
5. **I diagnosed a defect from a screenshot** — *"it reported a move as a booking"*. **It genuinely booked** (F-04.50). The line was honest; I invented the fault.
6. **I nearly shipped a deliberate `TS2322` into the engine.** The probe teardown used `${PIPESTATUS[0]}` in an `sh` shell; the script died before restoring. **The probe proved the gate; the teardown was the unproven thing.**
7. **I quoted F-04.43's headline from memory while editing it.** A byte-exact assert refused. That assert has now earned its keep twice in one sitting.
8. **I gave the founder a Vercel URL for a Railway API** and let him fire it at production. Same-origin assumed, never checked.
9. **I designed the SSE exoneration test wrong.** A read-only turn has no door action, so it *cannot* produce the concatenation. A clean result would have proved nothing.
10. **I designed the sentinel test wrong, twice** — asking the founder to assert a date the binder did **not** hold, which is a change, which is the one thing the sentinel does not fire on. It took a third design (§1.5) to reach the guard.
11. **I told the founder he would see `DATE UNCHANGED` in the response.** The JSON chat door returns `tool_calls` as **names only**. I designed three tests around a payload shape I had never read.
12. **I handed him a shell recipe that echoed a live production JWT into a transcript** — 7-day expiry, plus a PIN he had already pasted at my prompting. **Session revoked, PIN rotated, at his hand, not my catch.**

**The pattern, named:** every one of 1, 3, 4, 5 is *a claim made from inference where a command was available* — **the exact disease this sitting opened by auditing B2 for, in the finding (F-04.43) whose headline was written the same way.** The executor who found it committed it four times in the same session. **The estate's standard is not a thing one has; it is a thing one keeps failing and re-applying.** The corrections all came from the founder's rows — never from me re-reading my own work harder.

**Two disclosed calls, both revertible:** the anchor veto tests the event's **pre-write `kind`** (a simultaneous kind+date change is unruled); and `occupancy.js` was **born in the rider batch** carrying only the sets, because the rider is the set's first consumer and two homes for one list would *be* F-04.36.

**Prod state at packet close:** binder `2026-11-22`; shoot `671902e6` `2026-11-22`; trial `98c91056` `2026-08-01` (`upcoming`); duplicate `5464cc5d` cancelled; `Meera - call` cancelled (pre-existing). **The smoke moved this calendar substantially — T19's oracle must be re-run before `0076`, and `oracle_on_calendar` will have moved again.**

---

## 6. NEXT

**T19** on a green banner → **`0076_capacity`** (`vendors.slot_capacity`, per-slot, Q-B3-2's corrected map) → **`occupancy.js`'s checker** + the `date_blocked` verdict (Q-B3-8) → proofs.

**Blocking `0076`:** nothing. **Blocking the occupancy sitting:** Q-B3-13.
