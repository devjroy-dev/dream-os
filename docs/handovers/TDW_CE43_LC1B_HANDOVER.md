# repo: dream-os @ f277b6e4a16d4675be81f3f2a5f70753efe36109
# TDW · CE-43 · MICRO SEAT LC-1b · HANDOVER (the dream-os packet) · 2026-09-17

Cut on dream-os `f277b6e4a16d4675be81f3f2a5f70753efe36109`, re-derived at origin with `git fetch` at the moment of cutting.

- **Charter tip and drift.** The charter named `d4d3f92f`. The move to `f277b6e4` is docs only (the LC-1 walk record), and the chair accepted it.
- **No pwa packet, no migration, no SQL.** No plane is written.
- **Rulings.** CE-43 ruled on the read-first. c-43.11 is the chair's.
- **Findings.** This packet uses F-43.30 to F-43.34. F-43.35 stays unused.

## §1 · Veto record (founder, 2026-09-17, in chat, before build)

**V1 · YES.** Invoice line on the vendor WhatsApp lane.
- Current: `Invoice TDW/DEV440/10 for Tandon — sending the PDF now.`
- Shipped: `Invoice <number> for <client> is ready. Find it in the invoices list.`
- With no client on the binder, the ` for <client>` part is dropped, as it was before.

**V2 · YES.** Calendar mutation line.
- Current: `Updated: Dholakia · wedding — 2026-09-22. The calendar's set.`
- Shipped: `Updated: Dholakia · wedding — 22 September 2026. The calendar's set.`
- The shape is otherwise unchanged.
- **Ruling 7.** With a time the line reads `— 22 September 2026 at 18:00:00.` The raw `event_time` is outside the veto and is noted under F-43.33.

## §2 · What shipped

| File | Change |
|---|---|
| `src/lib/witnessLine.js` | NEW export `longDateYear(iso)`, next to `longDate` and built on it (ruled formatter (ii)). `2026-09-22` becomes `22 September 2026`. Anything that is not a plain ISO date is returned unchanged. `longDate` itself is untouched, and the file still holds one month list. |
| `src/api/vendor-engine/chat.js` | `mutationLines`: only the `Updated:` line renders through `longDateYear` (ruled D2 site (a)). `Cancelled:` and the crew line keep the raw `when` byte for byte. One require is added. |
| `src/lib/vendor/calendarSignals.js` | The same two lines in the WhatsApp twin (ruled lane (y), F-43.31, C-43.1). The twins stay byte-identical, as bench §2.9 proves. |
| `src/lib/vendorInbound.js` | The invoice confirmation line is swapped in place to the V1 bytes (ruled D1 (a), F-43.28(c)). The media loop below it is untouched: it still attempts the send, and Meta still refuses it (F-43.32, LC-4). |
| `scripts/b80_lc1b_door_strings_bench.js` | NEW bench (rung allocated by the chair). |
| `scripts/floor-manifest-lc1b.txt` | NEW. The declared dirt for `run-floor.sh --delivery`. |
| `docs/handovers/TDW_CE43_LC1B_HANDOVER.md` | This file. |

W-1 holds: no soul, lens or engine byte is touched, and both strings live in door files. No colour is touched (R-42.6). `node --check` is clean on all five `.js` files.

## §3 · What is proven (seat container, at `f277b6e4` with the packet applied, after `npm ci` and `npm run build`)

**`b80_lc1b_door_strings_bench`: 31/31 on the cured tree.**

It is run from `/tmp`, so it works from any directory. What it drives:
- The real `longDateYear`.
- Both real `mutationLines`.
- The shipped `processVendorInbound`, with its deps injected by its own design (b06_m3 §2's technique). The bytes handed to `sendWhatsApp` are the witness.
- Seven in-memory mutations of production code, each compiled under its real path with nothing written to disk:
  - the year dropped;
  - each twin's `Updated:` line back to raw;
  - each twin's full month creeping onto `Cancelled:`;
  - the PDF promise restored;
  - the media attempt removed.
  Each one turns its named cell RED.
- §5.1 is the column-existence cell for the doubled `engine.records` select, checked against `ENGINE_SCHEMA.md` (R-40.80).

**Both ways.** On a clean base worktree at `f277b6e4`, with the bench copied in: **12 passed, 19 failed.**
- RED on the cure cells: §1.1 to §1.4, §1.7, both twins' C2a, C2b and C6, §4.1, §4.2, and §6 M1 to M4, whose anchors are the cure's own bytes.
- GREEN at base: §1.5, §1.6, both C2c, §2.9, all of §3, §4.3, §5.1 and M5. So the red is not vacuous.

**Sealed benches, re-run.** Every one gives the same count at base and cured:

| Bench | Base | Cured |
|---|---|---|
| b0457_assign (pins the crew line's raw ISO) | 30/30 | 30/30 |
| b5_wa_door | 32/32 | 32/32 |
| checker_bench | 101/101 | 101/101 |
| b05_m2_vendor_inbound | 2/2 | 2/2 |
| b06_m3 | 37/37 | 37/37 |
| b79_lc1_seam | 31/31 | 31/31 |
| b0498_fresh_crew_rider | 58/58 | 58/58 |
| b0498_wa_assign_punct | 17/17 | 17/17 |
| b06_relay_hand | 126/126 | 126/126 |

**The wider radius.** These benches read `witnessLine.js` or hash a touched file. Cured results:

| Bench | Cured |
|---|---|
| b05_arc_m1 | 54/54 |
| b05_arc_m2 | 27/27 |
| b06_m4 | 33/33 |
| b06_m4b | 24/24 |
| b40_victor_sitting | 259/259 |
| b6_s1 | 24/24 |
| b09_d3_structural | 33/33 |
| b09_d4_honestmouth | 47/47 |
| b63_f1_model_routes | green |
| b65_g1_wa_advisor_off | green |

`b08_p5_unblock` reads 13/15. Both of its failures (§2.3, §4.4) are byte-identical at base, and the bench is in `scripts/floor-base.txt`.

**Floor.** Not claimed here, because this seat's container kills any command at 300 s (F-43.25). The floor rides the verify line, founder-run, under `--delivery scripts/floor-manifest-lc1b.txt --check`, and is compared by SET against `scripts/floor-base.txt` (23 lines). Record the founder's line here.

## §4 · Drift from the kickoff (all ruled)

- **Tip.** It moved from `d4d3f92f` to `f277b6e4`, docs only. Accepted.
- **F-43.30, c-43.11.** The kickoff's "reuse the full-month renderer Events used" named a formatter that does not exist.
  - The pwa Events row renders `21 Sep 2026` through its own `fmtDate` (`components/vendor/slices/SliceRow.tsx`).
  - dream-os held no JS renderer with day, full month and year.
  - `longDate` has no year, and `humanWeddingDate` is engine bytes under W-1.
  - Ruled: (ii), one sibling next to `longDate`.
- **F-43.31.** D2 has a byte-mirror twin on the WhatsApp lane (`calendarSignals.js`, `mutationLines`, F-04.98) that the kickoff did not name. It is cured here under (y).
- **D1(b) was not taken.** The web door's own sentence is not the V1 bytes (F-43.34).
- **Card (a) state at the cured tip.** Railway will **still** log `media send unsupported on Meta lane 'vendor' (M1 text-only); refusing`, because the media loop is LC-4's and is untouched. What changes is that the handset sentence no longer promises a PDF. Bench §4.3 pins that the attempt still happens.

## §5 · Mirror table (read-first §4(iii), verbatim; handed to LC-4)

| Line | chat.js | calendarSignals.js / other |
|---|---|---|
| Booked | `:566-567` | `:119-120` |
| Ambiguous candidates | `:1038` | `:394` |
| Crew witness | `:1057-1058` | `:411-412` |
| Cancelled | `:1061-1063` | `:415-417` |
| Calendar-image preview | | `vendorInbound.js:455` |

- These line numbers are at `f277b6e4` before this packet. Derived by `git diff -U0`, the shifts after the packet are:
  - chat.js: +1 after `:50`, and +7 after the `when` line in `mutationLines` (old `:1061`). So Booked is now `:567-568`, and Cancelled's `when` is at `:1062` with its return at `:1069-1070`.
  - calendarSignals.js: +1 after `:53`, and +7 after old `:415`.
  - vendorInbound.js: +3 from old `:1808` on. The invoice line is now `:1811`, and `:455` is unmoved.
  - Re-derive all of them at LC-4's tip.
- The crew-witness line is pinned verbatim by the sealed bench `b0457_assign_bench.js:130,212,235`.
- The comment at `chat.js:1048-1052` records Ruling №8, "one reply, one date voice", with humanizing parked at F-04.89.
- V2 lands ahead of that for one line. A single reply can now read `Booked: … — 2026-11-14` beside `Updated: … — 22 September 2026`.
- Model context only, not glass: `chat.js:2887` and `calendarSignals.js:519`.
- PDF promises: only D1 was false. The web `:445` promise is true on the PWA.

## §6 · Findings (CE-43 dispositions)

- **F-43.30 · ACCEPTED (c-43.11).** No full-month-with-year renderer existed, and Events renders the short month. Cured by `longDateYear`.
- **F-43.31 · ACCEPTED, cured here.** The WhatsApp twin of the `Updated:` line.
- **F-43.32 → LC-4.** The media loop in `vendorInbound.js` calls `sendWhatsApp(phone, '', [d.pdf_url])`. The Meta lane refuses with `sent:false`, without throwing, and the loop still inserts a `messages` row with body `[invoice PDF <number>]` and `media_url` set. That is a false record in the thread.
- **F-43.33 → LC-4, with F-04.89's Block 09 pointer.** The remaining raw-ISO door lines in §5; one date voice (Ruling №8); b0457's pin; and the raw `event_time` on the `Updated:` line (ruling 7). LC-4's cure reuses `longDateYear`.
- **F-43.34 → LC-4.** The web door's `invoiceLines` (`chat.js`) reads `is ready — find it in the invoices list to download or send.`, which is not the V1 bytes. There should be one invoice sentence on both lanes, founder-vetoed.
- **F-43.35.** Unused.

## §7 · The walk (founder performs and pastes; the seat reads)

**A push is not a deploy (R-40.87).** Railway's card shows a deployment id, not a commit (LC-1's method), so the deploy is witnessed by what only this tip can say. Wait until the vendor service's top deployment in Railway (the service → Deployments) is newer than your push and reads Active, then start.
- Step a's sentence is the deploy witness for the vendor lane.
- Step b's full month is the witness for the web door.
- If either still shows the old bytes, the deploy has not landed. Stop and paste what you see.

**a · Vendor WhatsApp lane, fresh binder (ruled (a-2)).**
1. From 9888294440, message the vendor line (+91 79821 59047) with:
   > Khanna wedding is confirmed for 5 December 2026. Fee 60000, follow up on 20 November 2026. Raise the invoice.

   The fields that make the mint qualify are a client name, a confirmed stage, a fee above zero (the door mints only when the binder's amount is above zero), and a follow-up date (which becomes the invoice's due date, LC-1).
2. If Victor asks whether Khanna is new or already on file, answer "New."
3. If 5 December is blocked or full, the reply carries the calendar's own refusal. That is the seam working; paste it.

**Evidence to paste:**
- A handset screenshot. The message should end with `Invoice TDW/DEV440/11 for Khanna is ready. Find it in the invoices list.` If another invoice was raised since `/10`, the number is the next one, whatever it is.
  - Victor's own prose above that line is the model's, not this cure's (F-43.27's class). The door line is the witness.
- The three Railway lines for that turn:
  - `[agent:engine] reply: "…"  (N tool calls)`
  - `[whatsapp:out->meta] <your number without the plus> <- …`
  - `media send unsupported on Meta lane 'vendor' (M1 text-only); refusing …` — expected, per §4 and F-43.32.
- Invoices on the PWA shows Khanna, due 20 Nov 2026.

**b · Web thread, move a linked booking.**
1. On the deployed PWA as DEV440, open Events and read Dholakia · wedding's date. This is the fixture read; no SQL.
2. In the web thread, tell Victor:
   - if Events reads 22 September: "Move Dholakia to 21 September 2026."
   - if it reads 21 September: "Move Dholakia to 22 September 2026."
3. If the date is refused, the calendar's own sentence is the seam working. Paste it, and try the other date.

**Evidence:**
- A screenshot of the reply's line `Updated: Dholakia · wedding — 21 September 2026. The calendar's set.` (or 22), with the month written in full.
- Events showing the new date.
- The web door does not log the line. Railway shows only `[model] surface=pwa … role=victor` for the turn, so the screenshot is the evidence.

## §8 · Delivery

One ZIP, `TDW_CE43_LC1B_dream-os_f277b6e.zip`, `deploy/`-prefixed. It carries the seven files in `scripts/floor-manifest-lc1b.txt`.

The founder pastes four blocks from the chat relay:
1. The guard.
2. The apply chain, exactly `unzip -o FILE.zip && cp -r deploy/. . && rm -rf deploy FILE.zip`, with the real name.
3. One verify line, ending with the STOP sentence.
4. The git line alone.

Sequencing beyond this sitting is the founder's.
