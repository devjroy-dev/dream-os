# repo: dream-os @ 51399689e55bfb607bcc4d434a0c83abd2f689cb
# TDW · CE-43 · SEAT LC-2s · PACKET 4a · READ-FIRST, ACCEPTED AND BANKED AT THE SEAM · 2026-09-18

Docs only. dream-os stands at `51399689` (unmoved since LC-2r rested); dreamos-pwa stands at `1db8a88e`. Both re-derived at origin at the moment of cutting. Rung b84 is unspent. Findings F-43.121 and F-43.122 are filed to packet 4's pwa half; F-43.123 onward are free.

**Why this file exists.** The read-first was accepted and the forks ruled in chat, and the build was banked at the seam rather than cut tired. c-43.15's lesson is that a record held only in chat is a record the tree does not have. The next sitting opens from this file and cuts 4a whole.

## §1 · The split (chair-ruled)

- **4a, this packet: the doors and the plane.** The two signals through one helper on both lanes, V12 with its door-built fact, F-43.82, and D3 and D4.
- **4b, on 4a's tip: Victor's reading and quoting hands.** V1 to V7, D1 and D2, A10, A11, Q1, and F-43.67 by label at `scripts/b68_introductions_bench.js:433` plus the family's own cell.
- Each is walked before the next cuts. Both on b84.

## §2 · The five seams, with the evidence each was derived from

**1 · The fact's home.** NEW `src/lib/vendor/bookedFacts.js`. It reads through `src/lib/vendor/bookedLeads.js` `readBookedBinderIds` (`:27`), the one home of the F13(a) predicate, and returns two things: the binder-id set the arms refuse on, and the opaque block the prompt carries. Shape and failure behaviour copy `src/lib/vendor/moneyFacts.js`: never throws, a failure returns null, and the caller passes `undefined`, which the engine treats as the pre-cure world (regression law).

**2 · Both doors build it and pass it.** The web thread at `src/api/vendor-engine/chat.js:3668` (its fact builder sits at `:3398`, `fetchMoneyFacts`), and the vendor lane at `src/lib/vendorInbound.js:1749`, where `buildMoneyFacts` is already built at `:1720`. One seam each, beside `moneyFacts`, never a per-lane cure (C-43.1).

**3 · The carrier, which already exists.** The chain `vendorWords` rides:
- `runTurn(args)` → `src/engine/src/core/loop.ts:906` hands the positional args to `runDonnaTurn`;
- `runDonnaTurn`'s signature is `src/engine/src/core/donna.ts:430`, where `vendorWords` (M-2) is the precedent for a door-built fact arriving as a trailing argument;
- `src/engine/src/core/donna.ts:726` is the ONE call site of `executeRecordTool(agentId, tu.name, input)`, which takes the fact as its fourth argument.

**Why not read the table instead.** `src/engine/src/core/db.ts:13-15` binds the engine client to `db: { schema: 'engine' }`, so `public.leads` is unreachable from the arms. The tree says so twice in its own words, at `loop.ts:168` and `recordPrimitives.ts:723`. R-VS.2 refuses a second client. Hence the door-built fact (c-43.20).

**4 · V12 in the arms, on both lanes.** `src/engine/src/core/tools/recordPrimitives.ts:644` (`donna_client`) and `:657` (`donna_stage`) refuse when the write would leave a binder at a booked stage with no lead behind it. The byte is V12 from the veto record, and under R-43.16 the refusal names the fix. The arms serve both lanes, so the web thread gets the same refusal as the vendor lane (C-43.1, chair-ruled).

**5 · The signals and their lines.** `donna_booking` and `donna_milestone_paid` return a signal; the door runs the act, never the engine (chair's fork 1, the shape `donna_invoice_pdf` already uses). One shared helper on both lanes calls `promoteLead` (`src/lib/vendor/promotion.js:168`, exported at `:396`) and `markMilestonePaid` (`src/lib/vendor/schedules.js:144`, which takes `receivedOn` and moves `due_date`). D3 and D4 are spoken from that helper, verbatim from the veto record.

**F-43.82, the cure as ratified.** `src/agent/engine.js:1613` builds its own PDF arguments and never passes a schedule, while the money lane calls the writer home `invoicePdfSource` (`src/lib/vendor/invoices.js:408`), which reads the invoice, the vendor, the name, the schedule gated on `has_schedule`, and the seal. The chat lane calls that home and overlays the fresh `amount_paid` it already computes at the site. One call site, one cell.

## §3 · What 4a's bench owes (b84, new)

- The fact home driven: the set and the block, and a failure returning null.
- Both doors passing it, and the carrier through to `executeRecordTool`'s fourth argument.
- V12 in both arms, on a binder with no lead behind it and on one with a lead, and the refusal naming the fix.
- The two signals: the tool returns a signal and writes nothing; the helper runs the act; D3 and D4 from the helper, over doubles of both lanes.
- F-43.82: the chat lane's PDF call reads through `invoicePdfSource` and carries the schedule.
- Mutations of production code, each turning its named cell RED, and the bench proven both ways at the base.

## §4 · Card 4a (chair-ruled, named in advance; R-43.17, the two test numbers only)

1. **Web thread as DEV440:** "Confirm the booking for <test lead> with the advance received today." D1's line belongs to 4b; in 4a the door speaks D3 for the deposit, and the rows are the same four the booking sheet makes: the lead booked, the binder, the event, and the one invoice with its milestones. A SELECT on the four tables is the witness.
2. **Vendor WhatsApp lane, from the founder's handset:** "Khanna paid the middle payment on 18 September." D3 on the handset with the label, the amount and the next due; the milestone paid on that date; `due_date` moved. The Railway line is named.
3. **Web thread:** mark the last milestone on that invoice. D4, "paid in full."; no second invoice; and the chat-served PDF now shows the schedule (F-43.82).
4. **Web thread:** "Add Meera as a confirmed client, fee 60,000" on a name with no lead. V12 is spoken, naming the fix, and nothing is written. The same sentence on the vendor lane gives the same refusal.
5. **Themes are not in play** (no surface changes). Railway's deployed tip equals the pushed tip (R-40.87).

## §5 · R-43.18 · packet 5 re-scoped (founder, chair-recorded)

> "backfills are not required, because the details in the estate are of test records only."

- **No data backfill in LC-2.** `tools/lc2_backfill.js` is not built. The four orphan mints (Khanna `14c39b8c`, Tandon `774d6dbd`, Dholakia `e6aacb34`, Meera `c9b66b36`), the invoice links on `/09`, `/10` and `/11`, the AMBIGUOUS hold on Anjali Rao (`f9818d27` ↔ `6491e70c`) and the `--link` command are all withdrawn. **C-43.7 is superseded.**
- **Seeding is not a backfill.** `ensureSeeded`, which seeds each vendor's packages, stands.
- **Packet 5 becomes:** the two merge/split collector additions (F-43.26), `PACKAGE_MONEY_MIRROR` set as a numbered Railway step, and the close handover carrying roadmap Amendment 4 and the master amendment for R-43.11. Rung b85 stays.
- **Card P5:** one merge and one split on test-number leads with their events dragged; one milestone marked with the mirror on, and the binder's money following it.
- **F-43.115's Block 09 note gains:** the test records are cleared by a ruled clean-out before the first real vendor, not backfilled.

## §6 · Carried forward, open

- **F-43.117.** The detail-chip route was walked live at the tip and writes correctly: `5b9e126d` took `2027-05-22`, PATCH 200, `updated_at` fresh. The two remaining routes (the booking sheet's `+ Wedding date` chip; the attach sheet's dashed line) are the seat's to drive in its container with the network logged and the service worker off in the probe. The verdict comes with the iOS walk.
- **F-43.121** (no sheet autofocuses a field on open, the attach sheet's fee field excepted when opened by the "Set the fee first." line) and **F-43.122** (every pwa date write stores precision `day`; a cell asserts it on all three routes) are packet 4's pwa half.
- **Cards 3j and 3l** stay open until the founder's iOS handset witnesses them. Nothing else waits on them.

Sequencing beyond this sitting is the founder's.
