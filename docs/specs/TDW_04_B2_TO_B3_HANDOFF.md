# TDW_04 B2 → B3 HANDOFF

**dream-os `3524f36` · dreamos-pwa `552646d` (untouched all sitting) · migration `0075` applied**
**B2 sealed on the founder's smoke, 2026-07-15 20:47 IST. Written AFTER the smoke, deliberately — a handover written before the smoke is exactly what F-04.40 was.**

---

## 0. READ THIS FIRST, B3

**Three things in this note will save you an evening each.**

1. **The plane rule.** `engine.events` is an agent audit trail. `public.events` is the calendar. **Plane is decided by the CLIENT at the call site, never by the table name.** `src/engine/src/core/db.ts:13-16` pins `db:{schema:'engine'}`; `src/index.js:37` is public-default. Modules with an injected client (`eventWrite.js`, `availability.js`, `occupancy.js` when you write it) **have no plane of their own** — resolvable only by caller trace. B1 caught a cross-plane disaster with this method *before a line of SQL*.
2. **`eventWrite` is the only writer.** The census of record is `docs/specs/TDW_04_CALENDAR_FINAL.md §3.1`, taken by command at `0e5b404`. Every exception is a ruling with a name. **If you find a raw `public.events` write on a vendor path that isn't in that table, it is a regression — file it, don't route it silently.**
3. **Four kind lists live in this neighbourhood (§3.2). Do not unify any two.** Unifying two IS F-04.36's regression and it has already happened once. **The one you are about to create is the fifth.**

---

## 1. WHAT B2 SHIPPED — and what is actually witnessed in prod

| | Status |
|---|---|
| **`0075_events_slots.sql`** | ✅ **APPLIED.** Six-for-six, predicted then witnessed. `events.ready_by` · `events_slot_check` · **`events_vendor_date_blocked_unique_idx`** (F-04.32's cure — the atomic ALREADY_BLOCKED that died at 0077 is back) |
| **`src/lib/vendor/scrub.js`** | ⚠️ **SHIPPED-UNPROVEN.** F-04.38's scrub half. **BLOCKED-EXTERNAL on a Twilio incident.** Proof = one WA booking turn. **Do not mark cured without it.** |
| **`src/lib/vendor/eventWrite.js`** | ✅ **The one writer.** Proven in prod: insert · block-dedupe · ALREADY_BLOCKED · soft-delete · re-block past dead rows · joinable ledger |
| **Relocations A/B/C** | ✅ `availability.js` · `chat.js` · `events.js` — **zero raw writes on the web door** |
| **`src/lib/vendor/blockHands.js`** | ✅ §1.5's two hands. F-04.37 cured at all three layers |
| **The CRUD lockstep leg (T11)** | ✅ **BUILT NEW, witnessed.** List-edit → event moved → binder followed (180ms) → binder's snapshot item followed |

**Witnessed in prod:** T2 T3 T4 T5 T6 · T7 T9 T10 **T11** T13 · T15 T17 T18 · **slot derivation branch 2** (`c0401b41.slot='morning'` from `event_time=09:00` — acceptance #9's rule, live) · T14's create leg.

**NOT witnessed, and why:**
- **T1** — Twilio outage. F-04.38's scrub half.
- **T8 / T16** — **Victor short-circuits repeats from his calendar snapshot without calling the tool.** So `findExistingEvent`'s dedupe and the `ALREADY_BLOCKED` refusal **are unreachable through normal chat.** They exist for stale snapshots and races. **They can only ever be proven by hitting the API directly, as T3 was.** Design fact, not a defect — but do not assume "the chat can't produce it" means "it can't happen."
- **T12** — retroLink untested. The executor invented a client name without querying the estate; she was already on file, so the retro path never ran. **`retroLinkOnFile` — the function the charter singled out to protect — is still unproven.**

---

## 2. WHAT B3 INHERITS — the work

### 2.1 `0076_capacity` + `occupancy.js` — your opening

`0076` is **FREE and reserved for you** (ladder: `0075` ✓ · `0076` yours · `0077` ✓). `occupancy.js` does not exist. `vendors.slot_capacity` does not exist.

**`eventWrite` already has your seam, and it is shaped per §8's pluggability clause:**

```js
async function checkOccupancy(_ctx) { return null; }   // ONE CONTEXT OBJECT, never scalars
```
```js
const conflict = await checkOccupancy({
  supabase, vendorId, kind, event_date, slot: derivedSlot, event_time,
  ready_by, source, event_id, existing,
});
if (conflict && !force) return { ok: false, conflict };   // WRITES NOTHING
```

**You write the checker, not the door.** The control flow — conflict-without-force writes nothing, `force` appends the clash to the note — **is built, and unexercised.** Replace `checkOccupancy`'s body with `require('./occupancy')`. No caller changes.

### 2.2 §1.6's conflict proof — **MOVED TO YOU** (Q-B2-9(iii), CE-ruled)

*"Colliding bookings via BOTH doors → byte-identical `ConflictPayload`"* and *"`force:true` writes, with the clash in the note."* **Structurally impossible before `occupancy.js` + `0076`** — every `ConflictPayload.kind` (`capacity` / `appointment_overlap` / `cluster`) needs machinery that is yours. It is your proof set's crown.

### 2.3 The occupying subset — **your opening PROPOSAL** (Q-B2-9(i)/(ii))

**Slot derivation ships two of four branches.** Branches 1–2 are live (caller-sent slot; `<12:00 morning · 12:00–15:59 noon · ≥16:00 evening`). **Branches 3–4 are yours** — they need the classification, which does not exist anywhere (grepped at `0e5b404`: zero hits for `occupying`, `APPOINTMENT_KINDS`, `occupancy`, `slot_capacity`).

**Returning `null` for a no-time booking is EXACTLY HEAD's behaviour** — no booking carries a slot today; only blocks do, via branch 1. **So `eventWrite` ships zero behaviour change and you add branches 3/4 as a pure extension.** A seam that matches current behaviour is not a placeholder.

**The CE's provisional leans, recorded so you don't build blind:**
- C5's appointment list (`trial, fitting, recce, call, meeting, task, reminder, social`) is **NOT presumed exhaustive** — verify against `CALENDAR_KINDS`' 13 and propose the table.
- A no-time **`other` leans NON-occupying** — *"a timeless entry must not eat a day."*
- **Final table ratified at B3.**

**⚠️ YOUR EXHIBIT — a real row, and it argues against the lean:**

```
35c9ce50   "Personal — unavailable"   kind='other'   2026-07-24   (now cancelled)
```

**F-04.37's signature on a live calendar: a day the vendor was NOT AVAILABLE, filed as `kind='other'`.** Under the lean, B3 reads 24 July as **bookable** and accepts a shoot on a day the vendor was told to keep clear.

**The CE's framing, and it is the actual question:** *`other` is what a model reaches for when the right hand doesn't exist.* **That row is pre-hand evidence.** The lean may well survive **precisely because blocks now have their own kind** — but **B3 must argue it, with this row as the exhibit**, not assume it.

---

## 3. WHAT B3 INHERITS — the rulings, already ratified

**Apply these when the artifacts exist. Do not re-litigate them.**

- **`DATE_BLOCKED` (non-overridable) vs `CONFLICT` (force-able)** — RATIFIED PERMANENTLY, not provisionally. *A block is a stated refusal, not a risk. Force overriding refusals would make "blocked" mean "blocked unless someone is confident."* The honest path is unblock-then-book: two deliberate acts, both witnessed. **B4's conflict-verdict work inherits this as given.** **Consequence already built into `eventWrite`: `force` never reaches the block-dedupe branch** (asserted by source position in B2's bench, not by comment).
- **`"{done} — but {undone}"`** — the standing partial-success grammar. *Claim exactly what was witnessed, name exactly what wasn't.*
- **Q-B2-5(a)** — `eventWrite` owns `CALENDAR_KINDS` (13) as an exported constant with the four-list comment. **The comment stays. No future "unification" without a ruling.**
- **Q-B2-7 as extended** — the relocation law bends **STATED, never silently**. Signature adaptations named in the diff header; logic byte-preserved; **prove it mechanically, don't assert it.**
- **Q-B2-10** — `eventWrite`'s contract: `supabase` first param · `code` on the return (`availability.js:73`'s 409 depends on it).
- **F-04.40's standing rule, BOTH DIRECTIONS** — **every packet claiming shipped work carries its commit hash in the first line, and the CE rules on nothing without one.**

---

## 4. THE FOUR OPEN FINDINGS — read `FINDINGS_LOG` for each

**These are not B3's to fix. They are B3's to not trip over.**

| | |
|---|---|
| **F-04.43** 🔴 | **The one to rule first.** The binder→event lockstep drags appointments onto wedding dates. **Re-asserting a binder's existing date is enough** — no change required. Silent. **It destroyed a real booking during B2's smoke** (Meera's trial, 30 Jul → 1 Nov). **If B3 touches lockstep or capacity, read this first: a trial sitting on a wedding date will poison your occupancy math.** |
| **F-04.41** 🟡 | Door lines never persist (`loop.ts:403` saves before the post-processors run). **The witness is ephemeral; the guess is permanent.** Any confession B3 writes into a door line **will vanish on refresh.** Design accordingly. |
| **F-04.42** 🔴 | `donna_unblock_date`'s *"free up"* wording fires the hand on a booking move. **Blast radius zero so far.** |
| **F-04.44** 🟡 | `updateLead`'s select omits `budget_max`; the snapshot patch builds its string from `undefined`. **Same shape as the `EVENT_SELECT`/`created_at` defect B2 caught at 4a.** |

**Open, unnamed, for the CE:** *Victor asserts the estate's contents from his snapshot's contents.* → 06.

---

## 5. THE METHOD — B2's one transferable lesson

**Build the caller. Do not describe it.**

Three latent defects in `eventWrite` were caught **in the first minute a caller existed**, and none would have surfaced by reading:
- `EVENT_SELECT` omitted `created_at` → the frozen wire would have carried `undefined`
- `ALLOWED_STATES` missing → routing PATCH would have silently dropped `updateEvent`'s validation
- the clear-field regression → `{event_time: null}` **clears** in `updateEvent`, was **dropped** by `eventWrite`

The last two were found by **running the two implementations against each other before writing the door.**

**And the counterweight, which matters more:** B2 made **seven** claims from inference where a command was available, and was wrong every time — a `notes=null` prediction about a PWA sheet never opened; *"there's a regression and it's mine"* before checking; five test-design errors including sending the founder to book on a blocked date **from a list of blocked dates he had just been handed**; and a finding named from a verbal report without a row (F-04.45, retracted).

**Two protocol candidates from this sitting:**
- **A bench asserts reality only if its calls are producible by a real caller.** B2's bench proved `blockDate(…, null)` — a call the UI cannot make. Green, and evidence of nothing.
- **The synthesis test:** every multi-component delivery runs at least one scenario exercising the components' *interaction*, not each in isolation. **F-04.43 is that lesson's specimen** — retroLink and lockstep each work; run in the same turn they destroy a booking.

---

## 6. GROUND TRUTH

Prod Supabase `nvzkbagqxbysoeszxent`/`main`, role `postgres`. Founder agent `50b2e89c-30a1-44ef-b69c-e9b6457e7a52`. Vendor WA line `+917982159047`; founder phone `+918757788550`.

**Key files:** `src/lib/vendor/eventWrite.js` (the writer) · `scrub.js` (the firewall, one home) · `blockHands.js` (the two hands, one home — **both doors import it because `DONNA_TOOLS` is one list**) · `availability.js` · `calendarSignals.js` (WA twin, exempt by ruling until 05) · `src/api/vendor/events.js` · `src/api/vendor-engine/chat.js` · `db/migrations/0075_events_slots.sql` · `docs/specs/TDW_04_CALENDAR_FINAL.md` §3.1/§3.2.

**The L-8 oracle (T19) has NOT been re-run** — the Supabase status banner was amber all sitting and the census doc's run discipline is explicit. **B2's smoke moved the calendar substantially** (blocks created/deleted, a phantom cancelled, three events rescheduled). **`oracle_on_calendar` will have moved. That is expected and is not a regression until someone lists the rows.**
