# TDW_04 — THE READER CENSUS (surfaces S1, 2026-07-17) — **ONE PACKET, BATCH-RULED PER R-B6-20**

**CE-22:** dream-os `747d1b1` = `origin/main`, fetched and re-derived at the moment of writing · dreamos-pwa `552646d` = `origin/main`, same derivation · Railway green: not claimed — this census is a code read of two clones; nothing here ran against production.

**Charter:** R-B6-16 (the paper ratified whole; item 7 is S1's opening act) · R-B6-20 (this table + proposed dispositions travel as ONE packet; trivially-in-scope one-line cures may ride S1's ZIP only if individually named ratify-or-revert; anything structural waits for the batch ruling). Every claim below was read at the two HEADs by command this sitting — no line carried from a charter.

---

## §0 — THE PREDICATE, STATED (because "57" was not reproducible)

A **reader** = a dreamos-pwa code site that consumes `public.events` row data arriving over a wire. Three wires exist: **(a)** `GET /api/v2/vendor/events/:vendorId` (fetchEvents → useEventsData/useEventsWindow), **(b)** `GET /api/v2/vendor/availability` (the blocks **projection** of `public.events` post-0077 — `listBlocks` reads the same table), **(c)** embedded events legs of other payloads (`LeadDetailResponse.events`) and the couple-plane `GET /api/v2/couple/events` (same table, `couple_id`-scoped). **Excluded and named:** the demo pages (`app/demo/vendor/**`) and `hooks/demo/useDemoVendorData.ts` render fabricated fixtures — they touch no wire and are not readers; `components/vendor/CalendarMonth.tsx` is a tombstone returning null.

**The charter's "57" — DRIFT, RECORDED:** under this predicate the vendor-plane consumption-site count is **19** (table below) plus **4** couple-plane reader pages and **3** named non-readers. A looser grep (`events` identifier hits across the tree) reproduces a number of 57's magnitude, which is almost certainly the count's origin; it counted transport lines, type declarations, and demo fixtures as "readers." Per §3.2 the code is the truth: **the census of record is the table below, with its predicate; the 57 retires with this note.** Nothing was hidden by the tighter predicate — every excluded site is named above.

**The 5:3 blocked-majority ratio — STAGED, NOT CARRIED:** the ratio is a property of a **prod payload**, not of code; R-B6-2 said re-derive, and the executor runs no prod reads. It rides the S1 founder smoke (§4 of the handoff) as one count: blocked vs non-blocked rows in the default `/events` payload. Whatever it says lands here in the delivery that carries the smoke.
**→ RE-DERIVED, 2026-07-17 (founder-run, the S1 smoke): `7 blocked : 7 other` — the blocked-majority is GONE; today's windowless payload is exactly half refusals.** The B3-era 5:3 retires with this line; the estate moved under it (fixtures created and cleaned across four sittings), which is why R-B6-2 said re-derive and never carry.

---

## §1 — THE CLASSIFIED TABLE (vendor plane; sees-blocks-correctly ✅ / leaks-blocks 🔴 / blind-by-design ⚪)

Blocks ride the default wire: `blockDate` writes `kind='blocked', state='upcoming'` and the events GET applies **no kind filter** — verified at `747d1b1`.

| # | Site (at `552646d`, pre-S1) | Class | Evidence + proposed disposition |
|---|---|---|---|
| 1 | calendar `page.tsx` `nextThree` (:127) | ✅ | F-04.36's cure, `kind !== 'blocked'`, shipped at the B1 rider. Nothing owed. |
| 2 | calendar `byDate` → day-cell **engagement dot** (:~330) | 🔴 | A block row rode `byDate`, so a block-only day lit the brass *booking* dot beside its own hatch — a refusal masquerading as an engagement. **CURED IN S1's ZIP, RATIFY-OR-REVERT** (one filter clause in `byDate`, F-04.36's exact shape — named in the ZIP's disclosure). |
| 3 | calendar `byDate` → day-popup `selEvents` | ✅* | Unreachable for blocked dates (the day-tap branch routes `isBlocked` to the block sheet first) — correct by control flow, not by filter. The S1 cure (#2) makes it correct by filter too. |
| 4 | calendar `byDate` → `CalendarBlockSheet` `events` prop (:173 in the sheet) | 🔴 | The sheet's "on this day" list filters only `state !== 'cancelled'` — it listed **the block row itself** as an engagement beside its own header ("Out of town · blocked"). **CURED by the same S1 one-liner (#2)** — `byDate` feeds it. |
| 5 | calendar `blockMap` ← `fetchAvailability` (:94) | ⚪✅ | The blocks projection consumed as blocks — the hatch, the tap-routing, the sheet's `existingBlock`. By design. |
| 6 | calendar grid `isBlocked` render (hatch, opacity) | ⚪✅ | Reads #5. By design. |
| 7 | list events slice `baseRows` (`app/vendor/list/[slice]/events.tsx:20`) | 🔴 | **No kind filter — block rows render as list rows** (primary = the reason, secondary = `blocked`, badge `upcoming`) wearing the slice's full affordance set. Disposition PROPOSED: this is a **policy** question (is the list the full-estate view, or is a block not a listable engagement?) — the mechanical filter is one line, but the affordances behind it (#8–#10) are the real disease, so the whole family is **batch-ruled together, not S1-cured.** |
| 8 | list events slice `deleteRequest` → `PATCH /events/:id/cancel` | 🔴 **the headline** | **The cancel door has no kind guard** (verified: `events.js` cancel route selects `id,title,state`, never `kind`). Cancelling a block through it produces a THREE-WAY DIVERGENCE, each leg verified at HEAD: the row goes `state='cancelled'`, `deleted_at` **null** → (i) `listBlocks` filters `deleted_at is null` but **not** `state <> 'cancelled'` (`availability.js:181`) — **the grid still draws the date blocked**; (ii) the checker's `liveRowsOn` excludes cancelled (`occupancy.js:464`) — **the checker books the date**; (iii) `0075`'s unique partial index predicates on `deleted_at IS NULL` only — **re-blocking the date refuses ALREADY_BLOCKED against a block the vendor cannot see or unblock.** Grid says held, checker says free, block door says taken. Reachable today from the list page's swipe-delete on a block row. **Structural — batch ruling.** Proposed cure shape (for the ruling, not taken): the cancel door gains a kind guard (a block cancels only through the availability door, 404-shaped like the unblock door's LOCK 2), OR `listBlocks` gains the state clause AND the cancel door soft-deletes blocks — the first is one guard at one door and forks no rule; the second touches the covenant. Executor recommends the first. |
| 9 | `SliceShell` mark-done on events rows (:568, :667 — `updateEvent {state:'done'}`) | 🔴 | A block can be swiped **done** ("a completed refusal"), same missing-kind-guard family as #8; a done block stays live to the checker (`liveRowsOn` excludes only cancelled) and live on the grid, so the damage is semantic, not divergent. **Batch-ruled with #8.** |
| 10 | list events slice Edit → `AddSheet` → `PATCH /events/:eventId` | 🔴 | The PATCH door guards kind **values** (can't set `blocked`) but not blocked **rows**: a block's title/date/time are editable through the generic edit path, bypassing the availability door's locks — moving a block's `event_date` via edit skirts the unique index only until it collides. **Batch-ruled with #8.** |
| 11 | list events slice cross-chip (`linked_binder_id`) | ✅ | Blocks carry no binder link; the chip's absence rule (ST-2) already speaks it. Nothing owed. |
| 12 | `SliceShell` `fetchLeadDetail` (:451) | ⚪ | Consumes `vendor_summary` + `conversation` only — the payload's `events[]` leg is **dropped on the floor**. Blind-by-design for blocks (harmless); noted as an F-04.44-family read-omission cousin (a leg fetched and unread), no block relevance, no cure proposed. |
| 13 | `CommandBar` `scoreHotDates` (:71) ← `fetchAvailability` | ⚪✅ | Blocked hot dates count as *locked* — deliberate reward semantics. By design. |
| 14 | `AddSheet` events branch (create/edit bodies, :293) | ✅* | Kind select offers `EVENT_KINDS` (no `blocked`); the door's 400 backs it. Its Block-offer half is **item 6(b), S2's by the ratified split** — named, not touched. |
| 15 | `useEventsData` (hook) | ⚪ | Transport; classification flows to its consumers (#1–#4, #7). |
| 16–19 | couple-plane readers: frost journey events page · reminders page (upcoming + done legs) · sanctuary (:2033) · `lib/frost/journey.ts` transport | ⚪✅ | `GET /couple/events` filters `eq('couple_id', …)` (verified `src/api/couple/events.js:28`); vendor blocks carry `vendor_id` and no couple scope — **blocks are unreachable by construction.** Correctly scoped, blind by design. |

**S1's shipped cure from this table: #2/#4's one-liner only** (one filter clause in `byDate`, disclosed ratify-or-revert in the ZIP). #7–#10 are one family with one root (the generic event doors don't know a block is not an engagement) and get **one batch ruling**. Everything ✅/⚪ needs nothing.

## §2 — `events_vendor_date_blocked_idx` (R-B6-7's free evidence, as predicted)

The census walked every read path above. **No code path names or depends on the non-unique index**; every blocked-row read goes through `listBlocks` / `liveRowsOn` / `blockedCheck`, whose predicates (`vendor_id, event_date, kind, deleted_at[, state]`) are covered by `0075`'s **unique** partial sibling for the blocked case and by the events table's ordinary access paths otherwise. The finding now has its evidence: the index is redundant beside its tighter-predicated sibling. **DDL still not proposed** — a DROP is a founder-gated destructive action and R-B6-7's posture ("someone should look") is now discharged as "looked, redundant, the CE holds the drop decision."

## §3 — ITEM 5's STRIKE, RECORDED (the paper's own verification, restated at the build sitting)

The `reason:'Blocked'` pill default was **already cured at the B1 seal rider** (`552646d`'s own commit message: F-04.35 — default pill 'Blocked'; picker opens with no pill highlighted, intended). Verified again this sitting in `CalendarBlockSheet.tsx`. **The item is a recorded nothing (B-2's precedent); the build sitting did not re-do it.**

---

**This packet's ask:** one batch ruling on the #7–#10 family (executor recommends the cancel-door kind guard as the root cure), ratify-or-revert on #2/#4's shipped one-liner, and the CE's disposition on §2's redundant index. Nothing else in the table is owed anything.
