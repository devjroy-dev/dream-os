# TDW_04.5 · P3 — THE CREW PAGE · EXECUTOR HANDOVER

**Bases (re-derived at origin, fetch-first, at the moment of writing — CE-22):**
dream-os `8143256` · dreamos-pwa `e465760`. Both trees clean at first motion (§11);
both matched the charter's stated tips exactly. No unexpected dirt, no found code.

**Sitting shape:** read ladder stated → read-first (anchors · mirrors · F1–F6 + four
forks the executor raised) → CE rulings F1–F10 + three reports + the engine-hop
acceptance teeth → founder veto ANSWERED YES to all 21 strings (#13 in the chair's
corrected form) → build. **SQL scope: ZERO. No migration. 0087 already carried
everything this sitting reads and writes.**

---

## §1 — WHAT SHIPPED

### dream-os (4 files)

| File | What |
|---|---|
| `src/api/crew.js` | **NEW.** The public capability door: `GET /api/v2/crew/:token`, `POST …/confirm`, `POST …/task`, and the in-memory limiter. |
| `src/api/router.js` | **+1 line.** Mounted beside the public routers. |
| `src/api/vendor/studio/team.js` | F-04.106's explicit column list + `POST /:memberId/rotate-token` (F9) + a guard comment on the PATCH allowlist. |
| `scripts/b0451_crew_page_bench.js` | **NEW.** 111 asserts over the REAL routers on REAL HTTP. |

### dreamos-pwa (6 files)

| File | What |
|---|---|
| `app/crew/[token]/page.tsx` | **NEW.** The public page. |
| `lib/vendor/slotWords.ts` | **NEW.** F8(d)'s one home for the slot vocabulary. |
| `components/vendor/CalendarDaySheet.tsx` | **+6/−9.** The labeled hoist; behaviour-identical. |
| `app/vendor/studio/team/page.tsx` | **+61/−1.** Send page + Rotate link inside the edit sheet (F10(b)). |
| `lib/vendor/types/vendor.ts` | `TeamMember.page_token` + the crew wire contract. |
| `lib/vendor/api/vendor.ts` | `rotateTeamMemberToken`. |

**The mount point.** `/api/v2/crew` lives in `router.js` beside `invite` and
`hot-dates`. It must never move under `vendor/core.js`, whose siblings all carry
`requireAuth` + `resolveVendor` — this door has no session by design.

**The three seams this endpoint ASKS rather than re-decides:**

- **"open" for a task** is the vendor door's own predicate (`studio/tasks.js:37`),
  cross-witnessed by the DB's own partial index (`PUBLIC_SCHEMA.md:2499`). Not re-listed.
- **The state transition on completion** is `studio/tasks.js:88`'s, copied: `state='done'`
  plus `completed_at` in the same motion.
- **The slot WORD** is the client's, and now has exactly one home (`slotWords.ts`).

**Plane + witnesses (SQL-provenance law):** PUBLIC — `team_members` (0087 §B for
`page_token`, PUBLIC_SCHEMA.md:732-746 for the rest), `events` (:390-408,
`assigned_member_ids` = 0087 §A), `team_tasks` (:778-792), `crew_confirmations`
(0087 §D), `vendors` (`business_name`), `users` (`auth_user_id`). ENGINE — read-only:
`users` → `agents` → `records` **`id, client`** (ENGINE_SCHEMA.md:339-362).
**No SQL ships in this delivery. No migration.**

---

## §2 — THE CAPABILITY LAW, AS BUILT

The response shape **is** the boundary — built field by named field, with no row ever
spread in. Absent by construction: every money cell, the client's phone, any member id,
the vendor id, any other member's name or task, `events.notes`, and any function this
member is not on.

**The read gate is load-bearing and doubled.** `events.assigned_member_ids` gates the
read (`.contains` + a JS re-assertion under it) **and** the write. CE-48/Ruling №2 left
`crew_confirmations` rows unpruned on unassign, so a stale row can outlive its
assignment; the bench proves a stale row does not resurrect a function.

**F7 in one sentence:** `note` is `crew_confirmations.note` — the member's own words.
`events.notes` is not selected anywhere in this file. The record supplied the proof
case: CE-57's ×3 anomaly lines lived in exactly that column.

---

## §3 — PROOF

**`b0451_crew_page_bench` 111/111 GREEN.** It drives the REAL `crew.js` and REAL
`team.js` routers mounted on a REAL express app answering REAL HTTP on an ephemeral
port, because THE CAPABILITY LAW is a claim about what leaves the process and the only
honest way to assert a phone number is absent is to read the response. The absence
asserts walk the whole serialized body and fail on the **value** appearing at any
depth — not on a key the bench remembered to check. The in-memory supabase runs its
filters for real **and projects its select lists** (a harness that ignored them could
not have caught F-04.106). Its engine schema is **namespaced**, because this door reads
`public.users` and `engine.users` in one chain.

**NON-VACUITY BY MUTATION OF PRODUCTION CODE** (never test setup); each reverted and
the file re-verified byte-identical by `md5sum`:

| # | Production mutation | Result |
|---|---|---|
| i | delete both halves of the read gate in `buildCrewPage` | **106/111** — RED on exactly the gate asserts (+ another member's function appearing in §2) |
| ii(a) | add `...e` to the assignment map | **109/111** — RED on the member-id and exact-field asserts, **and NOT on the F7 asserts**, because the select list had already excluded `notes` |
| ii(b) | (a) **plus** add `notes` to that select list | **107/111** — RED on the F7 asserts too: the client's preference and the "4,50,000 due" sentence reach a public URL |
| iii | delete the write gate's `includes(member.id)` | **109/111** — RED on exactly the write-gate asserts |
| iv | revert `MEMBER_COLS` to `'*'` | **108/111** — RED on exactly the F-04.106 asserts |

**ii(a) is reported as witnessed, not as predicted.** The read-first predicted the F7
asserts would fire; they did not, because two layers were holding and the bench saw the
outer one fail. Recorded rather than tidied.

**One declared mutation that does NOT fire, said plainly:** widening the engine hop's
`select('id, client')` to `select('*')` changes nothing the bench can see. That is the
boundary working — the answer is assembled by name, so an over-broad query cannot
produce an over-broad response. The select list is defence in depth (it keeps the money
and the phone out of process memory at all) and its narrowness is asserted by reading
the source, not by the bench.

**SEALED FLOOR, executor-run at this tip** (engine compiled first per CE-53,
`npx tsc -p src/engine/tsconfig.json`, exit 0):

`b0450_bands_bench` **46/46** · `b0498_fresh_crew_rider_bench` **66/66** ·
`b0498_wa_assign_punct_bench` **17/17** · `b05_m2_vendor_inbound_bench` **4/4** ·
`b0457_assign_bench` **30/30** · `b0457_crew_bench` **21/21** ·
`b0457_gap_bench` **10/10** · `b0457_crud_crew_bench` **19/19** ·
`b0496_pinlogin_tier_bench` **11/11** · `b0497_assign_crew_door_guidance_bench` **ALL
GREEN** · `b5_wa_door_bench` **32/32** · `b6_referent_bench` **36/36** ·
`checker_bench` **101/101** · `b6_sitting2_bench` **EXACTLY 20/22** (F-04.91's two
pre-existing, unchanged — 21+ or 19 would each have been a STOP) ·
pwa `bands.proof` **11/11** · `crewCommit.proof` **11/11**.
**All byte-stable — no amendment, labeled or otherwise.**

**GATES:** `node --check` clean on all three touched `.js` · **PWA `tsc --noEmit`
whole-tree ZERO on a cleared `.next`, run twice, output confirmed genuinely empty.**

**GUARDED FILES, 0-line diff vs origin, verified by command:**
dream-os — `eventWrite.js` · `occupancy.js` · `scrub.js` · `chat.js` ·
`calendarSignals.js` · `leads.js` · `bands.js` · `src/engine/**`.
dreamos-pwa — `CalendarCrewSheet.tsx` · `crewCommit.ts` · `CalendarBlockSheet.tsx` ·
**`CalendarBands.tsx`** (the rings this sitting feeds are byte-untouched — the ring
vocabulary closes live on the backend alone) · `derive.ts` · `calendar/page.tsx` ·
`middleware.ts`.
**The one exception, CE-ruled:** `CalendarDaySheet.tsx` is on P2's guarded list and is
touched here by F8(d)'s hoist. Declared, labeled in-file, behaviour-identical.

**W-1 CLEAN.** Zero engine, soul, prompt or voice files. `src/engine/**` 0-line.

---

## §4 — EXECUTOR DISCLOSURES (each vetoable/bounceable on its own)

1. **I EXCEEDED THE F-04.106 RULING'S SIZING, DELIBERATELY, AND SAY SO.** The chair
   ruled "explicit column list … **one line**". One line kills the class on `GET` only:
   `POST`, `PATCH` and `DELETE` all answered with a bare `.select()`, which is also
   `*`, so `page_token` and `roster_vendor_id` would have kept arriving there. The
   ruling's *intent* ("the class dies now") and its *sizing* could not both execute, so
   I took the intent, shared one `MEMBER_COLS` const across all four sites, and am
   reporting the deviation rather than quietly doing one line and leaving three leaks —
   or quietly doing four while claiming one. **Bounce me to the GET site alone and I
   will ship that instead.**
2. **`description` ships on task rows.** F7's reasoning does not reach it — a
   `team_tasks` row exists by construction to be handed to `assigned_to_member_id`, and
   its description shares an author with its title, which the spec puts on the page. No
   client prose has ever been observed landing there. **Flagged rather than buried: one
   field to delete and one bench line to flip if the chair reads the boundary tighter.**
3. **IST, not UTC, for "upcoming" — and the estate has no home to ask.** `chat.js:1102`
   (this work's nearest sibling) uses bare UTC; `vendorInbound.js:93` uses the IST
   offset. I chose IST and cited it in the file, because between 00:00 and 05:30 IST a
   UTC "today" still shows yesterday as upcoming, and the crew are reading this on a
   phone in India. **The divergence is disclosed, not resolved** — a shared `istToday`
   helper is a real (small) cleanup someone should own.
4. **FIRST USE OF `.contains()` IN THE ESTATE.** No other file calls it. Verified
   present by command on `@supabase/supabase-js` 2.105.4 rather than assumed; it is the
   containment test 0087 §A's GIN index exists to serve.
5. **THE LIMITER IS PER PROCESS.** Stated in the file's own comment as ruled. Railway
   may run more than one instance, so the effective ceiling is (limit × instances) and a
   restart forgets every bucket. Priced at three test accounts; a filed gap the day this
   door carries real crews.
6. **THE BENCH STUBS THREE AUTH MIDDLEWARES** via `require.cache` to mount the team
   router. That is the doubles allowance `b0450_bands_bench` declares in its own header
   ("the network and the auth middleware"), used for the same reason. Everything inside
   the handlers is real.
7. **A FIXTURE DEFECT I MADE AND CAUGHT.** My first fixture ids were not hex
   (`t0000000-…`), so the door's own uuid shape-check rejected them and three task
   asserts failed for the wrong reason. Fixed, and the lesson kept as two new asserts:
   a non-uuid `task_id` and `event_id` are refused at the door before any query.
8. **The bench name `b0451_crew_page_bench` is mine** (0451 after P2's `b0450`).
   Rename on a word.

---

## §5 — WIRE POINTS NAMED, NOT BUILT

1. **THE DECLINE WHISPER — CHARTERED-PARKED (CE ruling F3).** Spec §P3:65 routes
   declines to a snapshot whisper. That home is
   `src/api/vendor-engine/chat.js::fetchCalendarSnapshot`, whose return string is fed
   into engine context assembly — reported at read-first under §0.2 rather than built.
   The chair parked it as its own small sitting behind a W-1 ruling at its charter.
   **Spec §4 item 3's whisper clause completes THERE, before block close. P3 seals with
   this deferral NAMED.** This sitting closes the ring half only.
2. **THE BLOCK 05 AUTO-SEND (spec §P3:67).** Templated WhatsApp send fires on
   `crew_confirmations` INSERT. The webhook block's, never this sitting's.
3. **Re-entry key for both:** the confirm door is the insertion point for (1); the
   upsert in `confirmAssignment` is the fire site for (2).

---

## §6 — THE FOUNDER SMOKE CARD

**The founder only performs and pastes. The executor reads the evidence.**
Run **after both ZIPs are applied and both deploys are green.**

**Thumb-path, derived by command at `8143256`/`e465760`:**
landing Sign in → `/vendor/pin-login` → `/vendor` → BottomNav **More**
(`BottomNav.tsx:102`) → **Team Hub** (`more/page.tsx:62` → `/vendor/studio`) →
**Team** (`studio/page.tsx:51` → `/vendor/studio/team`) → tap the member row → the edit
sheet → **Crew page**.

**One gate the executor could not derive (no DB reach):** `/vendor/studio/team` is
Prestige-gated on both sides (`team/page.tsx:41`, `team.js:16`). Step 1 is therefore
**self-witnessing** (CE-ratified, P2's step-1 pattern): whatever appears is the answer.

| # | Do this | Paste back | What it witnesses |
|---|---|---|---|
| 1 | Open **More → Team Hub → Team** as the test vendor. | What you see — the roster, or an upgrade wall. | The Prestige gate, without a pre-read. **If it is the wall, stop here and say so** — the rest of the card needs the roster and that is a finding, not a failure. |
| 2 | Tap **Swati's** row. Scroll the sheet to **Crew page**. | Screenshot of the sheet. | F10(b): the two actions live in the row's ruled home, no new gesture. |
| 3 | Tap **Send page**. | What WhatsApp opened with — the text and whether a contact was pre-selected. | The wa.me prefill and the link built from this app's own origin (F6). **The link must start with your real site's address, not the Railway API address.** |
| 4 | Open that link on the handset. | Screenshot of the crew page. | Cream field · Vera's name as the eyebrow · Swati's name · "Your dates". |
| 5 | On the **29 Jul Rhea Malhotra sangeet**, tap **Confirm**. | Screenshot after it saves. | "You're confirmed." |
| 6 | Back on the phone, open `/vendor/calendar` in **Weddings** and find that sangeet pip. | Screenshot of the band. | **LIVE SPECIMEN #2: Swati's ring is now SOLID BRASS.** P2's card witnessed it hollow; this is the flip. |
| 7 | On the crew page, tap **Can't make it**, type a short note, tap **Can't make it** again. | Screenshot. | "You said you can't make it." + your note read back. |
| 8 | Reload the band board and look at the same pip. | Screenshot. | **LIVE SPECIMEN #3: the ring is TERRACOTTA. THE RING VOCABULARY CLOSES LIVE.** |
| 9 | Tick a task **Done** if Swati has one; if she has none, say so. | Screenshot or "no tasks". | The task rail, or an honest empty state. |
| 10 | Back in Team → Swati → **Rotate link** → read the warning → **Rotate link**. | Screenshot of the toast. | "New link created." |
| 11 | Open the **OLD** link from step 3 again (scroll up in WhatsApp). | Screenshot. | **The dead page: "This link isn't active." and NOTHING ELSE — no vendor name, no member name.** If you see either, that is a finding. |
| 12 | Tap **Send page** again and open the NEW link. | Screenshot. | The new capability works. |

**No dashboard or console act is required. No env var. No SQL. No migration.**

---

## §7 — OPEN AT THIS DELIVERY

- The founder's apply + push (both repos) + the smoke card. **The live witness is the
  founder's, declared-not-claimed — nothing in this document asserts production
  behaviour.**
- The chair's ruling on disclosure **§4.1** (the F-04.106 sizing deviation), **§4.2**
  (`description`), **§4.3** (the IST divergence) and **§4.8** (the bench name).
- **THE WHISPER SITTING** (§5.1) — chartered-parked, owed before block close.
- P3's spec surface otherwise complete. P4 (Collab Hub) is the next phase and is the
  first consumer of `roster_vendor_id`, which this sitting deliberately kept off the wire.

**Sequencing beyond this sitting is the founder's.**
