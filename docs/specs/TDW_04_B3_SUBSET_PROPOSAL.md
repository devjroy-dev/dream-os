# TDW_04 B3 — THE OCCUPYING-SUBSET PROPOSAL (+ one ordering finding, one verdict question)

**CE-22:** dream-os `2a15504` · dreamos-pwa `552646d` (untouched) · **NO DEPLOY-GREEN CLAIMED — NOTHING SHIPPED.** Paper only. Zero code, zero SQL, zero DB. The repo is untouched by this sitting in `docs/`, `src/`, and `db/` alike.

**Transport, not a delivery.** Proposed home if the CE wants it citable: `docs/specs/` beside the B2→B3 handoff. That is a proposal, not a call I have made.

B3 executor session, 2026-07-16. Written after the CE's GO, **before the rider batch**, for the reason in §1.

---

## 1. THE ORDERING FINDING — the ratified order cannot run as written, and the defect is mine

**The GO ratified: rider batch → `0076` → `occupancy` → subset proposal → proofs.** That order **was my plan**, and it has a dependency inversion in it that I put there and the ruling inherited:

- **Q-B3-3's anchor veto** needs the appointment set: *"(ii) `kind` is NOT in the appointment set — the same set your occupying-subset proposal defines."* The veto is **rider-batch work (item 1)**. The set is **item 4**.
- **`occupancy.js` (item 3)** needs the same classification for `deriveSlot`'s branches 3/4 and for C5's `appointment_overlap` check. **It also precedes item 4.**

**So two of the five items consume a set that the order ratifies *after* both of them.** This was already incoherent in my own plan before Q-B3-3 widened it — the CE's *"propose the final appointment set once, powering both"* is precisely what exposed it. **A proposal, by definition, is ratified before its consumers ship.**

**The minimal repair — proposed, not taken:** the subset proposal is **paper**, not code. Move it to the front of the *sitting*, leave the *build* order otherwise untouched:

> **subset proposal (paper, ratify) → rider batch → `0076` → `occupancy.js` → proofs**

Nothing is resequenced but a document, and no code order changes. **That is why this packet exists before the rider batch and why no file has been opened.** If the CE would rather the rider batch ship its three unblocked legs first (F-04.43's sentinel, F-04.42's string, F-04.44's two selects — none of which touch the set) and let Q-B3-3's veto ride with `occupancy.js`, that is a clean alternative — **but it splits the rider batch, and the CE ruled legs 1 and 3 get "the same brain in the same diff."** Ruling yours; I have built neither.

---

## 2. THE SET ARITHMETIC — C5's list verified, not assumed

The CE ruled C5's list **NOT presumed exhaustive** and told B3 to verify it against `CALENDAR_KINDS`. Done, by command:

```
CALENDAR_KINDS : 13
C5 appointments: 8  | all present in CALENDAR_KINDS? true
REMAINDER (13-8): 5 -> shoot, family, ceremony, other, blocked
```

**VERDICT: C5's list is exhaustive as an appointment list.** Every kind it omits is either work the vendor sells (`shoot`, `family`, `ceremony`), a withdrawal from sale (`blocked`), or the uncertainty sink (`other`). **The gap the CE feared is not there — but the remainder is not homogeneous, and that is the whole finding of §3.**

**And the `BOOKED_KINDS` warning is confirmed by command, not by trusting its comment:**
```
BOOKED_KINDS ∩ C5-appointments: meeting, recce, fitting, trial, social
```
Five of the nine. **`BOOKED_KINDS ⊄ occupying` — the four-list law holds, and the fifth list does not collapse into it.**

---

## 3. THE PROPOSED TABLE — and it is TERNARY, not binary

| Set | Kinds | Count | Consumes capacity? | No-time slot (branch 3/4) |
|---|---|---|---|---|
| **OCCUPYING** | `shoot` · `family` · `ceremony` | **3** | **YES** — against `slot_capacity` | `full_day` (branch 3) |
| **APPOINTMENT** | `trial` · `fitting` · `recce` · `call` · `meeting` · `task` · `reminder` · `social` | **8** (C5 verbatim) | **NO** — soft-warns via `appointment_overlap` (C5) | `null`, timeline-only (branch 4) |
| **NEITHER** | `other` · `blocked` | **2** | see §4 and §5 | `null` |

**3 + 8 + 2 = 13.** Every kind in the write vocabulary has a home; none is in two.

**Slot ≠ occupancy, and the table keeps them apart.** Branches 1–2 (caller-sent slot; `event_time` → C2's boundaries) are **kind-blind and stay that way** — a timed appointment still gets `slot='morning'` because slot answers *where on the timeline*, while occupancy answers *whether it eats*. Only the **no-time** case consults this table. That separation is why an `other` at 09:00 can render in the morning and still consume nothing.

---

## 4. `other` — THE 35c9ce50 ARGUMENT

**The exhibit, and it is real:**
```
35c9ce50   "Personal — unavailable"   kind='other'   2026-07-24   (now cancelled)
```
**A day the vendor was NOT AVAILABLE, filed as `kind='other'`.** Under the lean, B3 reads 24 July as bookable and accepts a shoot on a day the vendor kept clear.

**THE PROPOSAL: the lean SURVIVES — `other` is NON-OCCUPYING — and 35c9ce50 is evidence *for* it, not against.**

**1. The row is a fossil, and its cause is cured.** 35c9ce50 exists because on 2026-07-15 **there was no right hand.** F-04.37 established all three layers: `:358`'s description told Victor to use the booking tool when the vendor says *"block"*; the kind list offered nine values with `blocked` **not among them** (now `recordPrimitives.ts:403`, cited as `:365` in the finding — **moved-line, content intact**, verified this sitting); and `chat.js:191`'s `BOOKED_KINDS` coercion **would have erased `kind='blocked'` had he invented it.** *"`other` is what a model reaches for when the right hand doesn't exist."* **At B2 §1.5 the hand shipped.** `donna_block_date`/`donna_unblock_date` exist, "block" is struck from `:358`, `blocked` is a real kind with its own door, its own UNIQUE partial index (0075), and its own non-overridable verdict. **The row is a photograph of the era whose cause was fixed.**

**2. The decisive argument is not the fossil — it is what `other` IS.** `recordPrimitives.ts:403`, verbatim: *"Name it from the vendor's field; **if unsure, leave it and a neutral booking is kept.**"* **`other` is where UNCERTAINTY lands, by written instruction.** Making it occupying means **uncertainty consumes a vendor's day**. File *"follow up with the printer"* as `other` with no time and the vendor's whole day silently leaves the market. **That failure is invisible, it recurs at scale, and it costs revenue.** The lean's failure — a shoot landing on a kept-clear day — is **visible the moment it happens, and the honest cure now exists** (block the date; two deliberate acts, both witnessed). **A silent failure that refuses money beats a visible one that has a door: false. The reverse is the ruling I am proposing.** Between a sink that eats days silently and a sink that yields a day loudly, the loud one is the only one a vendor can fight.

**3. The counterweight, stated because it survives.** The B2 cure is **model-facing**. `ALLOWED_KINDS` (12) still lets the **CRUD door** mint `other` — a vendor typing *"Personal — unavailable"* into the AddSheet with no time still produces a 35c9ce50. **The lean does not make that vendor safe; it makes them visible.** The real cure for that class is a surface that offers *Block* where the vendor is reaching for *other* — **B5's, and I am not proposing it here.**

**⚠️ SO THE LEAN SURVIVES ON A DIFFERENT ARGUMENT THAN THE ONE THE CE OFFERED.** *"A timeless entry must not eat a day"* is a good sentence and it is not the load-bearing one. The load-bearing one is: **`other` is the uncertainty sink by written instruction, and uncertainty must never be allowed to consume capacity.** The CE's framing — *"that row is pre-hand evidence"* — is exactly right, and it is the reason the exhibit loses.

---

## 5. `blocked` — NOT IN THE TABLE, AND THE THREE SOURCES DISAGREE (Q-B3-8 🔴)

`blocked` is in **neither** set, deliberately: a block is not work and not an appointment. But **what happens when a booking lands on a blocked slot is unruled at the wire, and three sources give three answers:**

1. **P3, verbatim:** *"`blocked` consumes all capacity of its slot(s)."* → that makes it a **`capacity`** conflict → and `capacity` is **FORCE-ABLE**.
2. **The ratified vocabulary (handoff §3):** **`DATE_BLOCKED` is NON-OVERRIDABLE.** *"A block is a stated refusal, not a risk. Force overriding refusals would make 'blocked' mean 'blocked unless someone is confident.'"* → **the opposite of (1).**
3. **The `ConflictPayload` wire (spec `:62-66`):** `kind: 'capacity' | 'appointment_overlap' | 'cluster'`. **There is no `DATE_BLOCKED` kind on the wire at all.**
4. **And the founder smoke (spec §5), verbatim:** *"Block an evening from the day sheet → ask Victor to book that evening, receive the clash in his voice, **force it** → watch both on the grid."* → **the smoke instructs the founder to force a booking onto a block**, which the ratified vocabulary forbids by name.

**Implementing P3 literally BREAKS the ratified ruling on its first call.** The handoff says *"B4's conflict-verdict work inherits this as given"* — but `occupancy.js` is **mine**, and my checker is what decides whether a booking onto a blocked slot returns a verdict at all.

**Asks:** (i) does `occupancy.js` emit a **fourth `ConflictPayload.kind`** — `date_blocked` — with `force` explicitly ignored for it (a wire addition, so B4/B5 inherit a shape rather than invent one)? Or (ii) is the blocked check **not B3's at all**, and my checker stays silent on blocked slots until B4? And (iii) **spec §5's smoke needs amending either way** — it currently tells the founder to do the thing the ruling forbids.

**I have written nothing that assumes an answer.**

---

## 6. THE CONSEQUENCE FOR Q-B3-3 — "NOT APPOINTMENT" ≠ "OCCUPYING" ON A TERNARY (Q-B3-9 🔴)

**The CE ruled the anchor veto as:** *"(ii) `kind` is **NOT in the appointment set**."*

**That condition was ruled against a binary. §3's table is ternary.** On a ternary they are different sets, and they differ on exactly the two kinds that should never anchor a wedding:

```
NOT-APPOINTMENT = { shoot, family, ceremony, other, blocked }   ← the ruled condition
IS-OCCUPYING    = { shoot, family, ceremony }                    ← what I believe was meant
DIFFERENCE      = { other, blocked }
```

**So under the ruling as written, an `other` event whose date equals the binder's may write the binder's date.** Move 35c9ce50 — *"Personal — unavailable"*, `kind='other'` — and **the wedding follows the personal day.** F-04.46's disease, surviving inside the sink the same sitting rules the sink non-occupying. `blocked` is *nearly* unreachable here (`eventWrite.js:377` — `if (!linkedBinder && agentId && kind !== 'blocked')` — blocks never **auto**-link) but an explicit `linked_binder_id` is not barred, and "nearly" is not a guard.

**PROPOSED AMENDMENT:** the veto reads **`kind` IS in OCCUPYING**, not **NOT in APPOINTMENT**. Same double duty, same one set proposed once, ternary-safe. A binder's date is written only by an e→b propagation whose event **(i)** `event_date` equals the binder's current date **AND (ii)** `kind ∈ {shoot, family, ceremony}`.

**The CE's own sentence is what the amendment protects:** *"A trial sitting on the wedding date can therefore never drag the wedding by moving."* **True under both conditions.** But *"a personal day sitting on the wedding date can never drag the wedding"* is true under **only one of them.**

---

## 7. F-04.47 — HORIZON-BLINDNESS, STATED AS INSTRUCTED

**The checker is horizon-blind by construction and will stay that way.** `occupancy.js` receives the injected `supabase` client and queries `from('events')` **directly** — same plane as `eventWrite` (public-default, no `db:{schema}` option; plane by caller trace, per B1's ratified method). **It reads the table, never a surface's view, and it will carry no date-horizon filter of any kind.**

**The stakes, made explicit:** a horizon-filtered checker would read F-04.47's stranded `98c91056` as *absent* and hand a vendor a clean slot on a date that already holds a booking they cannot see. **An invisible booking that still occupies is exactly the state occupancy exists to report.** The checker's date predicates will be `.eq('event_date', …)` / `ready_by` windows and **`deleted_at is null` + `state <> 'cancelled'` only** — soft-delete and cancellation are the *only* lawful reasons a row stops occupying. This will carry a comment naming F-04.47 so no future session adds a horizon "for symmetry with the grid."

**Smoke, per the ruling:** T12 and the relink use the founder's **repaired 30 Jul row**, never `98c91056`.

---

## 8. WHAT THIS UNBLOCKS

| Consumer | Needs |
|---|---|
| `occupancy.js` — `deriveSlot` branches 3/4 | OCCUPYING (branch 3 → `full_day`) · APPOINTMENT (branch 4 → `null`) |
| `occupancy.js` — capacity check | OCCUPYING only; `slot_capacity` ?? Q-B3-2's corrected defaults (photography 1 · makeup 2 · decor 1 · venue 1; designer/jewellery OFF; `other` OFF + `occupancy_unmapped`) |
| `occupancy.js` — `appointment_overlap` (C5) | APPOINTMENT ∩ (slot shared with an OCCUPYING booking) |
| **Rider batch — Q-B3-3's anchor veto** | **the set, per §6's amendment** |

**One home, one export, imported by both.** The list ships in `occupancy.js` with the four-list comment extended to five — *"THEY ARE DELIBERATELY DIFFERENT. DO NOT UNIFY THEM"* — naming this ruling.

---

## 9. DISCLOSURE

1. **The ordering defect in §1 is mine.** I wrote the plan that put a proposal after its two consumers; the CE ratified my order; the inversion is my authorship and I am naming it before it costs a delivery rather than after.
2. **§6 amends a ruling I was told not to re-litigate.** I am not re-litigating it — Q-B3-3 was ruled against a **binary** appointment/not split, and the ternary is **new information this packet produces.** The ruling's own stated goal is preserved and extended, not disputed. **If the CE says "NOT-APPOINTMENT, as ruled," I build that and say so in the handover.**
3. **§4 reaches the CE's conclusion by a different route than the CE's argument, and says so.** The lean survives; *"a timeless entry must not eat a day"* is not why. Adopting a right answer for a weaker reason is how the next session inherits a rule it can't defend.
4. **Zero code, zero SQL, zero DB, nothing in `db/`.** `node --check` / `tsc` gates N/A — paper only. `git status` on `dream-os`: no tracked file modified.
5. **Every file:line here was read whole this sitting and re-verified by command before it was written down.** `recordPrimitives.ts:403` (the nine kinds — F-04.37 cites `:365`; moved-line, content verified intact) · `eventWrite.js:377` (the blocked auto-link guard) · the set arithmetic in §2 (run, not reasoned). **The one number I did NOT verify is `35c9ce50` itself** — it is a prod row and I have no DB. **It is cited from `FINDINGS_LOG` B2 §8 and the handoff §2.3, as their claim, not as my witness.** Naming that is the whole of item 2 in the last packet's disclosure, applied forward instead of retroactively.
