# TDW_04_CALENDAR_FINAL — One Spine for Dates: Slots, Occupancy, and a Date-Aware Victor
**Block:** 04 · **Repos:** dream-os + dreamos-pwa · **Depends on:** TDW_02 (soul-weave discipline, snapshot, doors), TDW_03 (SliceShell grammar reused)
**Spawns:** TDW_04.5 (event planners: crew capacity, wedding-band view) — reserved, see §8
**Author:** Chief Engineer session, 2026-07-14 · **Doctrine:** TDW_BUILD_PROTOCOL.md governs

---

## 0. READ FIRST (verify each before any edit)
| File | Verifying |
|---|---|
| `app/vendor/calendar/page.tsx` (540 ln) | Month grid, `useHotDates` toggle, `fetchAvailability` blocks path, current write calls |
| dream-os `src/api/vendor/availability.js` | Whether blocks live in their own table or in `events kind='blocked'` — THE P1 question. Routes: `GET /:vendorId`, `POST /`, `DELETE /:blockId` |
| dream-os `src/api/vendor/events.js` | CRUD write path, request field names, `/cancel`, PATCH |
| dream-os `src/api/vendor-engine/chat.js` ~ln 93–215 | `donna_book_event` signal → door writes `public.events`; dedupe (same client+date); `linked_binder_id` backlink; "lockstep" comment ln ~101 |
| `src/engine/src/core/tools/recordPrimitives.ts` | `donna_date` (binder date cell — ln ~190), `donna_repeatfollowup` / `followup_on`, `repeat_every` |
| `src/api/vendor/schedules.js` | Milestone shapes for money-due-per-day (P5) |
| `src/lib/vendor/categoryProfiles.js` | Category taxonomy for occupancy seeding (P3) |
| `docs/SCHEMA.md` §events, §hot_dates; migrations `0069`, `0070` | `events` columns incl. XOR vendor/couple, kind enum incl. `blocked`; `linked_binder_id` |
| TDW_02 §P2 | Soul-weave constraints (P4 rides the same doctrine) |

## 1. LOCKED FOUNDER DECISIONS (this block)
| # | Ruling |
|---|---|
| C1 | Availability converges into `events kind='blocked'`; parallel storage retired (pending P1 verification) |
| C2 | Day = THREE slots: **morning** (until 12:00) · **noon** (12:00–15:59) · **evening** (16:00 onwards) · plus `full_day` |
| C3 | Two occupancy modes: **function artists** (occupancy ON, per-slot capacity) vs **delivery vendors** (occupancy OFF, `ready_by` deadlines + clustering awareness) |
| C4 | Capacity defaults: photographer 1 · mua 2 · decorator 2 · florist 2 · delivery N/A · **planner: occupancy OFF until 04.5 (crew math lands there)** — vendor-editable always |
| C5 | Appointments (trial, fitting, recce, call, meeting, task, reminder, social) never consume capacity; soft-warn when sharing a slot with an occupying booking |
| C6 | One shared write function for CRUD and AI — one writer, two doors |
| C7 | Followups render as a read-time projection layer, never duplicated rows |
| C8 | Milestones-due (money) in the day sheet — in scope |
| C9 | Delivery clustering: >3 deadlines in any rolling 7 days → Victor mentions once, never nags |

## 2. MIGRATION RESERVATIONS (ladder after 02 = 0074 next; LD-8)
| # | File | Adds |
|---|---|---|
| 0074 | `0074_calendar_slots.sql` | `events.slot text check (slot in ('morning','noon','evening','full_day'))` nullable · `events.ready_by date` nullable · `vendors.slot_capacity integer` nullable (NULL = category default) · partial index `events (vendor_id, event_date) where kind='blocked'` |
| 0075 | `0075_blocks_convergence.sql` | P1 data migration ONLY if a separate blocks table is confirmed: insert rows into `events` as `kind='blocked'` (title from block reason, slot full_day unless block carries granularity), verify counts, then `drop table` — founder executes per protocol §4 destructive rule |

`assigned_member_id` is EXPLICITLY reserved for 04.5 — do not add it here.

---

## PHASE TABLE (one phase per sitting)

### P1 — Availability convergence (C1)
1. VERIFY: read `availability.js` — if it already reads/writes `events kind='blocked'`, phase collapses to a comment-truth pass; record and skip to P2. If a separate table exists:
2. Write 0075 (counts before/after in the SQL as comments); founder applies with CSV backup per protocol.
3. Rewrite `availability.js` as a thin view over `events` (`kind='blocked'`): same response shape the FE already reads (`{ok, blocks:[...]}` — verify exact fields and preserve them; map `id/date/…` from event rows) so `fetchAvailability` needs zero FE change this phase.
4. Anywhere Discover reads availability (grep `availability` across couple/discover code) now derives from events. Record findings.
**Proof:** block a day via existing UI → row lands in `events`; unblock deletes it; GET shape unchanged (diff a before/after JSON).

### P2 — One writer, two doors + bidirectional lockstep (C6)
**New:** `src/lib/vendor/eventWrite.js` — the ONLY function that inserts/updates vendor calendar rows:
```
writeEvent({ vendorId, source:'crud'|'victor', event_id?, title, event_date, event_time?, slot?, kind, note?, linked_binder_id?, client_hint?, ready_by?, force?:boolean })
→ { ok, event, conflict?: ConflictPayload }
```
Owns, in order: slot derivation (P3 rule) → dedupe (same client_hint+date ⇒ update, exactly the door's current logic, moved here verbatim) → binder linking (current backlink logic moved here) → occupancy check (P3) → write or, on conflict without `force`, return `conflict` and write NOTHING.
- `chat.js` booking section and `events.js` POST/PATCH both become thin callers. Delete the duplicated logic from the door (moved, not rewritten — diff must show relocation).
- **Lockstep, both directions:** (a) `donna_date` on a binder with a linked event → after the binder write confirms, call `writeEvent` with `event_id` + new date (source 'victor'); (b) CRUD reschedule of an event with `linked_binder_id` → after event write, patch the binder date THROUGH the binder edit door (witnessed; the confession trail records "date moved with the calendar"). Loop guard: lockstep writes carry an internal flag so a mirrored write never re-triggers its mirror.
**ConflictPayload wire:**
```ts
{ kind:'capacity'|'appointment_overlap'|'cluster', slot?:string, date:string,
  holding:[{event_id,title,slot,kind}], capacity?:number, message:string }   // message = plain sentence, door hands it to Victor verbatim
```
**Proof curls:** create colliding bookings via BOTH doors → identical conflict payloads; `force:true` writes with the clash recorded in the event note.

### P3 — The occupancy engine (C2–C5, C9)
**New:** `src/lib/vendor/occupancy.js` (imported only by eventWrite):
- Slot derivation: `event_time < 12:00 → morning · 12:00–15:59 → noon · ≥16:00 → evening`; no time + kind occupying → `full_day` unless caller sent slot; appointments with no time → slot null (timeline-only).
- Category mode map (single source, mirrors categoryProfiles keys): `function_artist: {photographer:1, mua:2, decorator:2, florist:2}` · `delivery: {jeweller, designer}` · `planner: occupancy off (04.5)` · unknown category → occupancy off, log `occupancy_unmapped` once per vendor.
- Capacity resolution: `vendor.slot_capacity ?? category default`. `full_day` bookings consume ALL slots; `blocked` consumes all capacity of its slot(s).
- Delivery mode: occupying kinds file with `ready_by` (from `event_date` if the vendor spoke a deadline — the door already receives Donna's dates; delivery categories' "date" IS the deadline). Clustering check: >3 `ready_by` in any rolling 7-day window → `cluster` conflict, advisory only (never blocks), emitted at most once per window (dedupe via a note on the newest event).
- Appointment overlap (C5): appointment sharing a slot with an occupying booking → `appointment_overlap` advisory.
**Settings surface (dreamos-pwa `app/vendor/settings/page.tsx`):** a "Working capacity" row — per-slot capacity stepper (function artists only), Jost labels, writes `vendors.slot_capacity` (verify/add PATCH on `/vendor/me` — field exists after 0074; if `me.js` lacks the field, add it to the existing PATCH allowlist, smallest change).

### P4 — Victor's date self-awareness (soul + snapshot; TDW_02 §P2 doctrine governs)
1. **Snapshot date-pressure line** (in `donna.ts` snapshot builder, near-horizon block): next 30 days — count of occupied slots, blocked days, muhurat dates (join `hot_dates`), and lead-interest dates (`public.leads.wedding_date` for open states). One dense line, words not tables.
2. **Lead-in-hand check:** when a lead's `wedding_date` enters the conversation (create or discussion), the door enriches Donna's context with that date's occupancy verdict so Victor can say *open* / *holding X* in the same breath — no extra model call; it's a lookup.
3. **Soul weave (≤600 chars, affirmative, in-voice):** dates are his inventory — a man who quotes with the calendar already open in his head; a clash is never an error message, it's leverage or a choice he puts plainly; a muhurat is a market signal he prices to; delivery clients' deadlines are production he paces. No rules lists; behaviour falls out of the self.
4. Conflict payload `message` sentences authored so Victor can carry them verbatim without breaking voice (write them as he'd speak).
**Proof transcripts (founder reads):** (a) booking onto a full evening; (b) lead with a date he's holding; (c) 4th deadline in a week for a designer — each shows in-character awareness, zero robotic warnings.

### P5 — The calendar surface
**Heat grid (month):** each day cell = three slot pips (m/n/e): filled ink = at capacity, half = partially held, hollow = open; diagonal hatch overlay = blocked; small gold diamond = muhurat (existing toggle stays); hollow brass ring = lead-interest date; delivery vendors see deadline count pips instead of slots. Legend hairline under the grid, Jost 9.
**Agenda rail:** horizontal next-14-days strip above the grid — date, weekday, first booking title, money-due glyph when milestones land that day.
**Day sheet (tap a day)** — the platform thesis in one surface:
1. Bookings by slot with binder chips (`linked_binder_id` → name)
2. Followup projection (C7): `followup_on`/`repeat_every` from the vendor's records rendered as quiet italic lines — read-time computed in the day endpoint, never stored
3. Muhurat note when present
4. **Money due:** milestones from `payment_schedules` due that date — `₹2.5L due — Priya (2 of 3)` with tap-to-mark-paid (existing door)
5. Actions: `Block morning/noon/evening/day` toggles (writes via eventWrite) · `+ Booking` (AddSheet, draft-first per 03) · `Move` on any booking → date+slot picker with inline conflict verdict before commit · `Ask Victor about this date` (primer: `About <date>: `)
**Backend:** new `GET /api/v2/vendor/day/:vendorId/:date` returning the sheet payload (events, followups computed, hot note, milestones) — one round trip. Wire shape typed in `lib/vendor/types/vendor.ts`.
**Followup layer toggle** beside the hot-dates toggle.

### P6 — Polish + regression net
Skeleton grid shimmer · IST discipline audit on every date render/parse (the resolver from the engine is the single parser — grep any stray `new Date(` on date strings in calendar code and route through it) · empty state teaching (*"Nothing this month. Tell Victor — 'shoot for Kaaya on the 14th, evening' — and watch it land."*) · sync stamp · full acceptance sweep.

---

## 3. GUARDRAILS
After B2, `src/lib/vendor/eventWrite.js` is the ONLY writer of `public.events` (the vendor calendar). Any other insert/update targeting `public.events` in vendor paths is a failed session. `engine.events` is an UNRELATED agent audit trail (F-04.30/F-04.31) — its writers (`distill.ts:164/:198`, `recordPrimitives.ts:62`, `donnaBench.ts:155`) are exempt by plane, not by pardon, and must NEVER be routed through `eventWrite`. Plane is proven by the client in scope (B1's plane-proof method), never by the table name. (bride/couple XOR paths untouched) · records mutations only via binder doors (lockstep included) · souls per TDW_02 constraints · conflict NEVER silently blocks a write the vendor forced · no localStorage · design system: pips ink, one gold (muhurat diamond) per screen · WhatsApp engines untouched (their event writes route through eventWrite in blocks 05/06, noted for those specs).


### 3.1 — THE CENSUS OF RECORD (TDW_04 B2, CE-ruled 2026-07-15)

The guardrail above says "any other insert/update targeting `public.events` in vendor paths is a failed session." **A law with no census is a law a future session will read as already violated and "fix."** This table is that census, taken by command against dream-os `b610f99` and re-verified at `0e5b404`. **Every exception is a ruling with a name.**

| File | Writes | Disposition |
|---|---|---|
| `src/api/vendor-engine/chat.js` | **0 raw** · 5 via `writeEvent` | ROUTED (B2 relocation B + Q-B2-11) |
| `src/api/vendor/events.js` | **0 raw** · 4 via `writeEvent` | ROUTED (B2 relocation C) |
| `src/lib/vendor/availability.js` | **0 raw** · 2 via `writeEvent` | ROUTED (B2 relocation A) |
| `src/lib/vendor/blockHands.js` | 0 raw · via `availability.js` | ROUTED (B2 §1.5 rider) |
| `src/lib/vendor/eventWrite.js` | 2 (one insert, one update) | **THE WRITER ITSELF** |
| `src/lib/vendor/calendarSignals.js` | 5 | **EXEMPT BY RULING until Block 05** (Q-B2-1). The WA door's calendar apparatus. 05 owns that surface end-to-end and will have WA smokes to prove the change. NOT a stray; NOT a failed session. F-04.38's *scrub* half shipped at B2; its *routing* half is 05's. |
| `src/agent/engine.js` :940/:1028/:1239 | 3 | **EXEMPT BY RULING until Block 05/06.** The WA engine proper, Protocol §8's named file. **These three carry NO persona scrub either — an open leak surface, named not cured.** |
| `src/lib/vendor/events.js` | 3 | **LISTED, NOT DELETED** (spec §9). After B2 its only caller is `calendarSignals.js` — the exemption flows through. `createEvent`/`deleteEvent` now have **zero callers**; recorded for 05's sweep, which inherits the file warm. |
| `src/engine/src/core/distill.ts` :164/:198 · `tools/recordPrimitives.ts` :62 | 3 | **EXEMPT BY PLANE, never by pardon.** `engine.events` — an agent audit trail (F-04.30/31). Routing these through `eventWrite` would insert audit rows into vendors' calendars. **Never route them.** |
| `src/agent/brideEngine.js` · `src/api/couple/events.js` | 7 | **OUT OF SCOPE** — bride/couple XOR, different owner. |

**Amended by Q-B2-11(1):** `retroLinkOnFile`: **preserved in behaviour, routed at 4b-follow-up.** The charter's "preserved verbatim" clause protected the function's existence and behaviour — the §3.5 audit found an unspecced load-bearing wire and the fear was loss, not modification. Its routing ruling was never written because it was never in the spec. It is written here.

### 3.2 — FOUR KIND LISTS. FOUR JOBS. DO NOT UNIFY THEM.

Unifying any two **is F-04.36's regression**, and it has already happened once.

| List | Where | Answers |
|---|---|---|
| `CALENDAR_KINDS` (**13**) | `eventWrite.js` | *What may exist in the table.* Mirrors the DB CHECK (0007+0013+0069). The **write vocabulary**. |
| `BOOKED_KINDS` (**9**) | `cabinet.js:125`, `chat.js:132` | *What counts as on-calendar.* A **read predicate** + the booking door's coercion. Excludes `blocked` (F-04.36) and call/task/reminder. **Never a write allowlist.** |
| `ALLOWED_KINDS` (**12**) | `api/vendor/events.js` | *What may THIS DOOR mint.* Excludes `blocked`: this door has never made blocks, and a raw `POST {kind:'blocked'}` would bypass `blockDate` — no reason round-trip, no `'Blocked'` fallback, **NULL slot** — resurrecting the era 0077's bare column exists to prevent. **Ratified as door policy, Q-B2 (2026-07-15).** |
| The **occupying** subset | *does not exist yet* | *What consumes a slot's capacity.* **B3's opening proposal** (Q-B2-9). C5 names the appointments that do not; the list is **NOT presumed exhaustive** — B3 verifies against `CALENDAR_KINDS` and proposes the table. A no-time `other` **leans non-occupying** ("a timeless entry must not eat a day") — CE's provisional lean, **final table ratified at B3.** |

`BOOKED_KINDS` ⊄ occupying **and** occupying ⊄ `BOOKED_KINDS`. `BOOKED_KINDS` contains meeting/recce/fitting/trial/social — every one of which C5 calls an **appointment**.

## 4. ACCEPTANCE CRITERIA
1. P1: blocks live only in `events`; availability GET shape unchanged; Discover availability derives correctly.
2. Same colliding booking via CRUD and via Victor → byte-identical ConflictPayload; forced write records the clash.
3. MUA (capacity 2): two morning bookings OK, third → capacity conflict; photographer: second evening booking conflicts; `full_day` empties all slots.
4. Designer: 4th `ready_by` in 7 days → single cluster advisory, never repeated for that window, never blocks.
5. Lockstep: move a binder date → linked event moves (and vice versa), confession trail records both, no infinite mirror.
6. Followups appear on their dates with zero new rows in `events`.
7. Day sheet returns in one request; milestone mark-paid from the sheet persists.
8. Founder-read transcripts (P4) approved.
9. Slot derivation honors 12:00 / 16:00 boundaries exactly (unit tests at 11:59, 12:00, 15:59, 16:00).
10. `node --check` + engine `tsc` + PWA `tsc --noEmit` clean; migrations applied per protocol with information_schema proof.

## 5. FOUNDER SMOKE (phone)
**AMENDED 2026-07-16 (Q-B3-8(iii), CE-ruled) — this smoke instructed the founder to FORCE a booking onto a block, which the ratified `DATE_BLOCKED` vocabulary forbids by name (*"a block is a stated refusal, not a risk; force overriding refusals would make 'blocked' mean 'blocked unless someone is confident'"*). It now teaches the vocabulary instead of violating it.** **THE FORCE DEMO (capacity):** a second shoot on a full slot → receive the `capacity` clash in his voice → **force it** → watch both on the grid. **THE BLOCK DEMO (its opposite):** block an evening from the day sheet → ask Victor to book that evening → receive **`date_blocked`** in his voice → **it cannot be forced** → unblock, then book — two deliberate acts, both witnessed, the honest path shown → move a booking to a muhurat day, read the diamond → open a day with a milestone due, mark paid → tell Victor "Kaaya's date moved to the 18th" and watch the calendar follow the binder.

## 6. NATIVE-IMPLICATIONS CLAUSE
Grid/rail/day-sheet are presentational over the one `day` endpoint — RN port is layout work only. eventWrite/occupancy are pure backend. No gestures beyond tap (Move is a picker, not drag) — deliberate for parity.

## 7. UNIT ECONOMICS NOTE
Date-awareness lookups (P4.2) are DB reads, not model calls — zero token cost. Snapshot grows ~1 line (~40 tokens/turn) — record in UNIT_ECONOMICS.md.

## 8. TDW_04.5 RESERVATION (event planners — next session's discussion)
Scope reserved: `events.assigned_member_id` (+ migration number claimed AT 04.5 time per LD-8) · per-crew-member conflict math riding occupancy.js · wedding-band calendar view (binder-grouped spans across days) · crew assignment UX · planner capacity semantics · planner lead-quoting against the bride's `functions` shape (0065). Nothing in 04 may foreclose these: occupancy.js keeps its check function pluggable (capacity resolver takes a context object, not scalars).

## 9. SESSION BOUNDARIES
Six sittings P1→P6 strictly (P1 may collapse if convergence pre-exists — sitting continues into P2). Handover per protocol each sitting; MASTERPLAN + SCHEMA updated; any stray writers of `public.events` found outside eventWrite get listed, not fixed, unless trivially in scope — plane-qualified per §3's guardrail (F-04.30/F-04.31): `engine.events` writers are a DIFFERENT TABLE (an agent audit trail) and are never "strays"; prove the plane by the client in scope, never by the table name.

---

## ADDENDUM B (2026-07-14, founder-approved) — P7 Bulk Import + P8 Snap-a-Date
**Migration reservation:** `0095_calendar_import.sql` — `events.import_batch_id uuid null` + partial index; `import_batches (id uuid pk, vendor_id uuid fk, source text check (source in ('ics','csv','photo')), item_count int, created_at timestamptz default now(), undone_at timestamptz null)`.

### P7 — ICS + CSV bulk import (launch doors; Google OAuth one-time import folds into the existing post-launch sync flag)
1. **ICS upload** (`.ics` from Google Calendar / Apple Calendar export — one path, both providers, zero OAuth): parse VEVENTs with full TZID care, everything anchored to IST via the standing resolver; recurring events expanded within a founder-visible horizon (default 18 months).
2. **CSV upload** with a downloadable house template (client, date, time, kind, amount, note) — the Sheets/Excel vendor's door, likely the higher-volume one.
3. **The mandatory preview** (nothing commits without it): parsed rows as a review list — per-row kind assignment (booking / appointment / blocked / skip; bulk-apply), slot derived from time per the C2 boundaries, dedupe flags against existing events (same title+date → default skip), conflict verdicts computed LIVE (imports run occupancy like any write). Vendor confirms → commit.
4. **The one-writer law holds absolutely:** every committed row goes through `eventWrite` (conflicts surface per-row, `force` recorded); the whole batch carries `import_batch_id`.
5. **One-tap undo:** batch card in calendar settings — undo deletes the batch's rows (cancel semantics where money artifacts attached — never silent), `undone_at` stamped. No silent mass-writes into a vendor's calendar, ever.

### P8 — Snap-a-Date (photo → events; new feature — verified absent 2026-07-14, built on the existing Vision pipeline pattern)
1. **Capture:** camera/photo upload in the calendar surface (PWA `input capture` — full parity today; the native picker twin recorded in TDW_11's backlog) — a diary page, a printed calendar, a WhatsApp screenshot, a venue booking slip.
2. **Extraction:** one Vision turn (facade, surface `vendor_calendar_ocr`, haiku) → strict JSON: `{events:[{title, date, time?, client_hint?, kind_guess, confidence}]}` — dates through the IST resolver; low-confidence rows flagged, never guessed silently; the image is processed and DISCARDED (the Sarvam law's twin — nothing stored).
3. **Same preview, same laws:** extracted rows enter the P7 preview (kind, slot, dedupe, live conflicts) → eventWrite → `import_batch_id (source 'photo')` → same undo.
4. **WhatsApp twin (mechanical):** the vendor WA engine's media path gains the same extraction → Victor replies with the parsed list as a confirm-first beat ("I read five dates off that page — say yes and they're on the calendar") — confirm-before-write is law for batch photo imports on every surface; voice stays 06's.
**Acceptance additions:** a real Google export, an Apple export, the CSV template, and a photographed diary page each round-trip through preview→commit→undo; a deliberately double-booked import row shows its conflict verdict in preview; the discarded-image audit passes; TZ fixture (a UTC-stamped ICS) lands on the correct IST day.
