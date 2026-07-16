# TDW_04 B3 — OPENING PACKET (ladder read · drift · plan · seven questions)

**CE-22:** dream-os `2a15504` · dreamos-pwa `552646d` (untouched) · **NO DEPLOY-GREEN CLAIMED, AND NONE IS OWED — NOTHING SHIPPED.**
**Status: READ SITTING. Zero code written, zero migrations authored, zero DB touched.** This packet is questions and a plan. It claims no shipped work, per F-04.40's standing rule, and it is deliberately unmistakable about that: **B3 has not opened its first code ZIP and will not until T19 runs on a green banner and the 🔴 questions below are ruled.**

Written by the B3 executor session, 2026-07-16, after reading the ladder whole against fresh clones.

---

## 0. LADDER READ — CONFIRMED

Cloned fresh (both repos), unshallowed to verify every cited hash. Read in charter order:

`TDW_BUILD_PROTOCOL.md` · `TDW_00_MASTERPLAN.md` §1–§2 · `TDW_04_LEDGER_AND_CALENDAR_FINAL.md` · `TDW_04_CALENDAR_FINAL.md` (P3 body, §3.1 census, §3.2 four-lists) · `TDW_04_AUDIT_FINDINGS.md` (F-04.13→.21 §§, and **§9's rulings — Q-2 in particular**) · `FINDINGS_LOG.md` (B2 + B1 + B0 + engine-lane + 02-HOTFIX F12–F16) · `SURFACE_TRUTH_AUDIT.md` · `TDW_03_CROSSPLANE_CENSUS.md` (the oracle SQL) · `SCHEMA.md` + `db/BASELINE.md` · **`TDW_04_B2_TO_B3_HANDOFF.md` whole, §0 first.**

**The handoff's absence claims were re-verified by command, not accepted on the page:**

| Claim | Verified at `2a15504` |
|---|---|
| `0076` free | ✅ ladder: `0075` ✓ · hole · `0077` ✓ |
| `occupancy.js` does not exist | ✅ zero files |
| `vendors.slot_capacity` does not exist | ✅ 8 hits repo-wide, **all comments/specs, zero code** |
| `occupying` / `APPOINTMENT_KINDS` / `occupancy_unmapped` / `OCCUPYING_KINDS` | ✅ zero code hits |
| the seam is shaped per §8 | ✅ `eventWrite.js:273` `async function checkOccupancy(_ctx) { return null; }` |

## 0.1 DRIFT LOG (four; none material)

1. **Handoff header cites dream-os `3524f36`; HEAD is `2a15504`.** `git diff --name-only 3524f36 2a15504` → `docs/FINDINGS_LOG.md` + the handoff itself. **Docs-only delta. The handoff's code claims describe HEAD's code.** Recorded, not drift.
2. **`BOOKED_KINDS` — spec §3.2 and the handoff say `chat.js:132`; truth is `chat.js:136`.** `cabinet.js:125` exact. Both nine, both byte-identical lists. Moved-line.
3. **"ST-6" is not a label in `SURFACE_TRUTH_AUDIT.md`.** That file's numbering is R1–R7 (§6). **ST-6 = R6** — *"same-value guards + idempotency on the money doors — skip the stamp when old === new."* Spec §0 declares the S/M/R numbering is cited as ST-*, so this is by design. Recorded because grepping `ST-6` returns zero and the next session will do exactly that.
4. **A fifth kind list exists** at `src/lib/vendor/events.js:8` (`ALLOWED_KINDS`, 12) — the file §3.1 lists-not-deletes, whose `createEvent`/`deleteEvent` have zero callers. Not a finding (05's sweep owns it). Noted so the handoff §0.3's count ("the one you are about to create is the fifth") reads correctly: **the occupying subset is the sixth list in the neighbourhood, and the fifth *live* one.**

---

## 1. THE PLAN

**Order:** rider batch → `0076` → `occupancy.js` → subset proposal → proofs.
**Gate:** T19 (L-8 oracle) runs on a **green Supabase banner before the first code ZIP.** B2's smoke moved the calendar; `oracle_on_calendar` will have moved; the founder lists the rows once and that is the new baseline. No occupancy SQL is authored against an unlisted calendar.

| # | Sitting item | Contents | Gates |
|---|---|---|---|
| 1 | **Rider batch** (backend-only ZIP) | F-04.43's guard · F-04.46's kind-aware brain (T11) · F-04.42's one string · F-04.44's one column · docs touch (F-04.46 filed by name; F-04.41 → B4's opening proposal; the unnamed *"Victor asserts the estate's contents from his snapshot's contents"* → 06's packet by name) | `node --check` all touched `.js` · engine `tsc --noEmit` if `recordPrimitives.ts` is ruled in |
| 2 | **`0076_capacity`** | `vendors.slot_capacity`, nullable, NULL = category default. Header carries L-7's dated note + the Q-2 ruling. **Blocked on Q-B3-2's unit question** (below). | syntax-verified · founder-run · `information_schema` proof |
| 3 | **`occupancy.js`** | The checker, not the door. `require('./occupancy')` replaces `checkOccupancy`'s body; **no caller changes**. Slot branches 3/4 as pure extension over HEAD's null. Category map per Q-2 as ruled. Capacity resolution (`vendor.slot_capacity ?? category default`), `full_day`/`blocked` consumption, C9 clustering (advisory, once per window), C5 appointment overlap. §8's pluggability preserved — one context object, never scalars. | `node --check` |
| 4 | **The occupying-subset proposal** | Verified against `CALENDAR_KINDS`' thirteen (`eventWrite.js:112-116`); C5's list **tested for exhaustiveness, not assumed**; **`35c9ce50` argued on the record**, not inherited. | — |
| 5 | **Proofs** | §1.6's crown (byte-identical `ConflictPayload` via BOTH doors; `force:true` with the clash in the note) · acceptance #9's boundary units (11:59 / 12:00 / 15:59 / 16:00) · smoke: **T12** (retroLink, still unproven) · **the F-04.46 relink** of the founder's recreated 30 Jul trial · **one synthesis scenario** — components exercised in the same turn, because F-04.43 is precisely what isolation misses | browser pass N/A unless Q-B3-7 rules the settings row in |

---

## 2. SEVEN QUESTIONS. TWO BLOCK THE FIRST RIDER; ONE BLOCKS `0076`.

### Q-B3-1 🔴 — BLOCKS F-04.43. **The ruled guard has no *old* to read at the ruled site — but the estate's own guard shape sits twelve lines above the target.**

**THE RULING:** *"the binder→event lockstep gains the estate's own old≠new guard (ST-6's pattern): it fires only when the binder's date actually CHANGED."*

**THE PROBLEM, by command:**
- `lockstepBinderToEvent` (`chat.js:444`) is a **post-turn processor** (`chat.js:711`, `:752`). It reads `call.input` off `result.tool_calls`.
- `donna_date` (`recordPrimitives.ts:495-496`) is **two lines**: `return writeFields(agentId, rid, { date: input.date }, ...)`. **No `existing` read.** `date` is not in the append set (`ALWAYS_APPEND = ['reason_for_action']`, `:131`), so `writeFields` never reads a prior value for it and never returns one.
- **Therefore at the guard's site, `binder.date === call.input.date` unconditionally** — the engine wrote it during the turn. The comparison is always "equal". **The leg would not guard; it would die.**

**THE EXHIBIT — ST-6's pattern IS in the estate, and it proves where the guard must live.** `donna_money` (`recordPrimitives.ts:456-494`), shipped by the L-9 engine-lane sitting, with its own comment naming the ruling:

```
:465   if (existing.amount != null) {
:466     // TDW_04 engine-lane (ST-6, absorbed 02-HOTFIX-2): old ≠ new guard.
:470     if (Number(existing.amount) === parsed && (existing.direction ?? null) === dirIn) {
:471       return {
:472         display: `MONEY UNCHANGED on ${rid} — ${moneyWords(parsed)} ${dirIn} already stands; nothing re-stamped.`,
:473         item: recordItem(existing),
:474       };
```

**Read `:456-494` and `:495-496` together and the finding writes itself: the guard is twelve lines above `donna_date`, and `donna_date` never got it — because the engine lane's charter said "old≠new guards on both *money stamps*."** ST-6's pattern lives **inside the tool executor**, where `existing` is in hand. It cannot live in a post-turn processor, and that is not a style preference — it is the only place the old value exists.

**AND THE HALF THAT MATTERS MOST: guarding `donna_date` alone does NOT fix F-04.43.** The lockstep reads `call.input`, not the write's outcome. `donna_date` could no-op perfectly and the lockstep would still fire and still drag every linked appointment. **The cure needs both halves.**

**TWO ROUTES, both in-estate. Ruling yours; I have implemented neither.**

- **(a) THE SENTINEL — cheaper, fully precedented.** `donna_date` gains `donna_money`'s exact shape: read `existing`, and on no-change return early with `DATE UNCHANGED on ${rid} — …` + `item: recordItem(existing)` (so the snapshot still gets the current item — no data loss; donna_money already accepts this trade). Then `lockstepBinderToEvent` gates on `call.result`. **The door already does this**: `chat.js:339` — `const isErr = (r) => typeof r === 'string' && r.startsWith('ERROR')` — is chat.js gating on a tool result-string sentinel today, and `recordPrimitives` sniffs `outcome.display.startsWith('ERROR')` in four places. **This is status-sniffing, not value-parsing** — distinct from the thing `eventWrite.js:472-475` refuses (an id "parsed out of prose"). Zero type changes.
- **(b) THE STRUCTURED SIGNAL — cleaner, wider.** `ToolOutcome` (`snapshotTypes.ts:46-51`) is `{ display, item?, remove?, found? }` — **no status field.** Adding `changed?: boolean` also requires `loop.ts:48` to carry it onto `tool_calls` (which today carries `{ name, input, result: string, donna_calls? }`). Two files more, and it touches the engine's public shape.

**My lean, offered and NOT acted on: (a).** But `recordPrimitives.ts` is **engine surface and outside my charter's named files**, and the ruling as written names `chat.js`. **I will not touch either until you rule.**

### Q-B3-2 🔴 — BLOCKS `0076`. **Q-2's ruled capacity map is unreachable in the taxonomy it was ruled to ride.**

**THE RULING (audit §9):** *"code taxonomy is truth… `photography` 1/day, `makeup` 1/day, `decor` 1/day · `venue` 1/day · **`florist` ADDED, 3/day** · `other` 1/day as the floor. B3 implements exactly this."*

**Witnessed by running the real resolvers at HEAD:**

```
florist   -> normalise: other    | profile key: other    | timelineType: event
floral    -> normalise: decor    | profile key: decor    | timelineType: event
planning  -> normalise: planning | profile key: other    | timelineType: event
planner   -> normalise: planning | profile key: other    | timelineType: event
designer  -> normalise: designer | profile key: designer | timelineType: delivery
```

1. **`florist` is unreachable, twice over.** `normaliseCategory('florist')` → **`'other'`** — the contains-match tests `'floral'`/`'flower'` (`categoryFraming.js:92`) and *"florist"* contains neither. `profileFor('florist')` → key `'other'`. **A `florist: 3` key can never be selected by any input.** And the deeper one: **`categories.js:6` — *"16 categories (florist merged into decor — 2026-05-15, founder confirmed). Florist vendors onboard as category=decor, style_notes=floral."*** A real florist's `vendors.category` **is `decor`** — which Q-2 rules **1/day**. The ruling's own intent (production-bound, 3/day) is defeated by the taxonomy it names as truth. **The §3.5 audit's B-5 finding, which Q-2 was ruling on, never surfaced the 2026-05-15 merge.**
2. **`'other' = 1/day (ON)` contradicts C4 and P3 head-on.** `profileFor('planning')` → key **`'other'`**. C4: *"planner: occupancy OFF until 04.5 (crew math lands there)."* P3: *"unknown category → occupancy off, log `occupancy_unmapped` once per vendor."* **Implemented exactly, Q-2 turns planner occupancy ON at 1/day** — which §8 forbids by name (*"Nothing in 04 may foreclose these"*). And if `'other'` is ON, **`occupancy_unmapped` can never fire.** Further: **eight of the sixteen canonical categories collapse to `'other'`** (mehendi, catering, music_dj, music_live, choreography, planning, transport, invitations) — a caterer and a DJ would each get 1/day.
3. **"1/day" vs per-slot — and this is what blocks the migration.** C2/C4/P3 and the column's own name are **per-slot**; Q-2 rules **per-day**. Acceptance #3 (*"MUA (capacity 2): two morning bookings OK, third → capacity conflict"*) is written against C4's `mua:2`, which Q-2 superseded to `makeup 1/day` — **unreachable as written.** **The column name encodes the answer and LD-8 says applied numbers never rename.** `slot_capacity` (per-slot) or `daily_capacity` (per-day) must be settled *before* `0076` ships, not after.
4. **`designer`/`jewellery` are unnamed by Q-2** → `timelineType:'delivery'` → occupancy off + `ready_by` clustering. **Confirm the silence is the ruling.**

**Asks:** (i) which key space — `PROFILES`' six, or `VENDOR_CATEGORIES`' sixteen? (ii) how does a florist get 3/day when he onboards as `decor` at 1/day? (iii) per-slot or per-day? (iv) does `'other'` mean occupancy ON at the floor, or OFF per P3 — and if ON, what happens to C4's planner clause and §8?

### Q-B3-3 🔴 — F-04.46: **`kind='wedding'` does not exist.**

`CALENDAR_KINDS` (`eventWrite.js:112-116`) mirrors the DB CHECK's thirteen: `shoot, call, meeting, task, reminder, recce, fitting, trial, family, ceremony, social, other, blocked`. **No `wedding`.** The rider's first proposed anchor rule needs a **14th kind** — a CHECK migration, not in my charter, and a fourteenth value in a vocabulary §3.2 exists to keep stable.

The rider's **second** option — *"the event whose date equals the binder's"* — **is expressible today**: `events.js:270-272`'s `before` read (currently `id, linked_binder_id`) gains `event_date`, plus one engine hop for the binder's date. I will propose the anchor rule with this on the table. **Ruling yours.**

### Q-B3-4 🟡 — **F-04.46 has a twin, and the rider names two of three legs.**

There are **three** lockstep legs at HEAD, not two:

| Leg | Site | Direction | Named by the rider? |
|---|---|---|---|
| 1 | `chat.js:406-409` | **e→b** (Victor's `donna_edit_event` → `donna_date` on the binder) | ❌ **NO** |
| 2 | `chat.js:444-475` `lockstepBinderToEvent` | b→e | ✅ F-04.43 |
| 3 | `events.js:305-319` (T11) | **e→b** (CRUD date-edit → `donna_date` on the binder) | ✅ F-04.46 |

**Legs 1 and 3 are the same semantics through different doors.** F-04.46's sentence — *"a trial move rewrites a wedding"* — is true of `chat.js:406` identically: **move Meera's trial by voice and the wedding follows the trial.** This is F-04.38's shape exactly (the scrub's twin one file away, `grep -c` → 0) and FINDINGS #9's (`${API}` swept, `API +` missed). **Does the kind-aware brain land on both e→b legs, or only T11?** I will not widen the diff past the charter without the word.

### Q-B3-5 🟡 — **F-04.44 has a twin at the create door.**

`createLead` **writes** `budget_max` (`lib/vendor/leads.js:62`) and **its select omits it** (`:72` — same string as `updateLead`'s `:135`). `api/vendor/leads.js:224` hands that row straight to `patchLeadSnapshot`, whose `:249` reads `lead.budget_max`. **So a lead created *with* a budget also writes `"Name — lead, new"`** — F-04.44's exact mechanism, one door over, and it has been live as long. (`:315`, the state PATCH, passes `budget_max: existing.budget_max` explicitly and is clean.)

The rider names `updateLead` only. **Widen to `:72`?** One line each. **I will not touch `:72` without the word.**

### Q-B3-6 🟡 — **F-04.42: the CE's line adds; F-04.42's own diagnosis strikes.**

Current string (`recordPrimitives.ts:382-392`, authored at B2 §1.5), verbatim:

> *"Put a blocked date back on the vendor's calendar — the day becomes available to be booked again. Give date (YYYY-MM-DD). Use it when the vendor says unblock, free up, or open a date they had blocked. This does not touch bookings: it only lifts a block."*

**It already scopes to *"a date they had blocked"* — and it still fired unprompted on a booking move.** The ruled addition keeps *"free"*. F-04.42's own text: *"Cure is almost certainly the `:358` cure again — **strike 'free up'**."* **Add only, or add *and* strike?** Either way the exact final string ships listed verbatim in the handover for founder veto, per the copy law.

### Q-B3-7 🟡 — **Scope: does P3's settings surface land at B3?**

Spec P3 names a dreamos-pwa **"Working capacity"** row + the `me.js` PATCH allowlist. Verified at HEAD: `me.js:70` `ALLOWED_FIELDS` lacks `slot_capacity` (and `category` sits in `LOCKED_FIELDS` at `:69`); `settings/page.tsx` has no capacity row. **B-7's "smallest change" path is viable.**

But my charter §2.1 names **`0076` + `occupancy.js`** only. **If the row is mine**, the sitting gains a second repo, a full browser pass inside the vendor shell, and an SW-live scenario on a production-like build. **If it isn't**, `0076` ships a column **no surface can set** — while C4 and Q-2 both say *"vendor-editable always"*. Which?

---

## 3. FOR THE FOUNDER (not the CE)

- **Meera's trial (30 Jul → 1 Nov)** — repaired through the doors, or is that your 30-second fix before my occupancy proofs read dates?
- **T19** on a green banner before my first code ZIP. **T12** joins my smoke. **T1** stays Twilio-blocked.
- **The recreated 30 Jul trial is UNLINKED** — I relink it once the leg is safe, as the smoke's proof.

---

## 4. DISCLOSURE — this sitting

**Deviations, unilateral calls, and shortcuts, including the ones I believe justified.**

1. **A near-miss I caught, disclosed because the reflex is the point.** My first grep for `ALLOWED_KINDS` in `api/vendor/events.js` returned **zero**, and I was one keystroke from filing spec §3.2 as drift. The pattern was `ALLOWED_KINDS = `; the code is `ALLOWED_KINDS  = ` (two spaces, `:58`). **§3.2 is correct.** The tool was wrong, not the spec. *Prove which side is wrong; never declare it.*
2. **AN ERROR I SHIPPED TO THE FOUNDER, IN THE SITTING WHOSE WHOLE SUBJECT IS NOT DOING THAT.** In my first message I wrote that `donna_money` *"(`:400-425`) reads the old figure and reports old→new"* and that this was why ST-6 was expressible there. **I had not read `donna_money`. I was quoting `TDW_04_AUDIT_FINDINGS.md:41`'s line numbers as though they were my own read** — and that citation describes the **pre-engine-lane** state (*"stamps with NO old≠new guard"*). The truth, read this sitting: `donna_money` lives at **`:456-494`**, and **it already carries the full old≠new guard** (`:465-475`), shipped by the L-9 engine lane. **My claim was directionally right and its evidence was borrowed.** It is B1's and B2's disclosed root exactly — *a claim made from inference where a command was available* — and the command took ninety seconds. **It also made the packet stronger when I finally ran it**, which is the whole argument for running it.
3. **THIS PACKET IS TRANSPORT. IT IS NOT IN THE REPO AND HAS NOT BEEN COMMITTED.** The founder is carrying it to the CE as a file; nothing has been applied to `dream-os`. **The repo at `2a15504` is untouched by this sitting in every path — `docs/`, `src/`, and `db/` alike.** If the CE wants it durable and citable, its proposed home is **`docs/specs/TDW_04_B3_OPENING_PACKET.md`** — beside `TDW_04_B2_TO_B3_HANDOFF.md`, its direct predecessor in the chain, so the two read side by side; "packet" is the estate's own word. **That placement is a PROPOSAL, not a call I have made.** Say the word and it rides the rider batch's docs touch.
4. **A pre-go artifact reaching the ruling desk is exactly F-04.40's shape, so every guard I could apply, I applied.** The header states nothing shipped; the status line states nothing shipped; no proof is claimed; no seal is implied; no artifact is described as existing that does not; and the one hash in the first line is real and verified. **The standing rule cuts both ways and this packet claims no shipped work at all — there is nothing here to rule on except questions.**
5. **No code, no SQL, no DB, no ZIP of anything executable.** `node --check` / `tsc` gates are N/A — docs-only. Nothing in `db/` was touched or authored.
6. **`FINDINGS_LOG` pre-04 read: DONE** (B1's gate, discharged at B2, re-read this sitting — F12–F16 and #9's `${API}`/`API +` ancestry, which is Q-B3-4's shape).
7. **Every file:line asserted in this packet was read whole this sitting and re-verified by command immediately before it was written down.** Not one was carried from a spec's description, a comment's claim, or a grep hit — with the single named exception in item 2, which is why item 2 is here.
