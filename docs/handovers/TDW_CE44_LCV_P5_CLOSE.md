# repo: dream-os @ 2aea4cebfefdf166c3bbaa34469431a92c6f1ebb (base) · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307
# TDW · CE-44 · SEAT LCV-2 · LC-VICTOR P5 CLOSE (docs only, C-44.1)

P5 and its follow-up P5-h1 are landed and walked green. This file is the record of both walks, the founder's
rulings R-44.21 to R-44.25, every finding F-44.51 to F-44.68 with where it sits now, the seat's errors and the
chair's corrections, and the queue. The protocol amendment rides beside it in `docs/TDW_BUILD_PROTOCOL.md` §13.
Code handovers: `TDW_CE44_LCV_P5_HANDOVER.md` (P5, `ecc564d`), `TDW_CE44_LCV_P5H1_HANDOVER.md` (P5-h1, `2aea4ce`).

## 1 · What stands in production

The working door (`src/lib/vendor/workingDoor.js`) answers bookings, advances, payments and invoices ALONE when every
act in her message is covered and names a client, on both lanes; anything else goes to the chain unchanged. Money is
staged in `public.pending_money_acts` (0169, RLS on, no policy) and asked in B1 or B2 ending "Reply YES or NO."; it
moves only on her whole-message yes within 15 minutes; a late yes or no to the door's own question gets B14. Every
figure comes from a row. One listener call per turn; a door turn counts once toward her limit. Victor still holds his
hands (R-44.21 (a)); a MIXED message with a money act goes through the chain WITHOUT the door's confirmation, so
confirm-before-money holds on door-only turns alone until P5b removes the chain's money hands (R-44.22 (b)).

## 2 · P5's walk (ecc564d, 20 September 2026, 18:03 to 19:06 IST), as witnessed on his screens and rows

| Step | Lane | What he saw | Verdict |
|---|---|---|---|
| 3 (early) | app | B4, "No lead called Walk P5 Book" (no lead yet); then B5 "no package yet" (none attached yet) | true both times; bonus coverage |
| 3 | app | B2, Photographs and film, Rs 80,000, staged, expiry 15 minutes | green |
| 4 | app | his no: B3; row declined; no listener call | green |
| 5 | app | his yes: D1, TDW/DEV440/20, no chip; three milestones pending | green |
| 6 | app (card said WhatsApp: his deviation) | listener missed "today" (F-44.60), B6; his "today": B2; yes: D1 (/21) then D3, next due 15 February 2027 | green in effect |
| 7 in time | WhatsApp | B1 middle payment; his immediate yes: D3 "… Next due 29 April 2027" (tail settled by his screenshot) | green |
| 7 late | WhatsApp | staged 18:28:19; his yes at 19:01: B14; row expired; milestones untouched | green (F-44.58 live); the same run showed F-44.61 |
| 8 | app | B9, TDW/DEV440/19 served | green |
| 9 | app | B13, TDW/DEV440/22 minted for Priya Sachdeva (row witnessed at h1's H1) | green |
| 10 | WhatsApp | mixed message to the chain, door empty, both acts in the request, nothing staged; Victor's Walk45 figures later matched the rows exactly | green; not a specimen |
| 11 | — | closed as not applicable: Basic has no messaging (R-44.25) | moot |
| 12 | — | 15 door replies, 15 counted rows; "door · Rs 0" on yes or no; each chain turn one counted row and ONE uncounted listener row | green |

Cost, from his rows: a door turn about Rs 0.16; the two chain turns Rs 4.64 and Rs 5.51.

## 3 · P5-h1's walk (2aea4ce, 20:15 to 20:18 IST), all in the app (his deviation from WhatsApp on steps 4 to 6)

R-44.24 live (B2 ending "Reply YES or NO."); F-44.60 live ("came in today" heard with its date in ONE message, D1 /23
then D3); F-44.61 live (Walk P5 Book's deposit asked in B1, paid through `donna_milestone_paid`); F-44.62 live
("Blocked: 22 March 2027 — personal time."); H3 six door replies each counted once. The same minutes produced F-44.65 and
F-44.66 (§5); the limit refusal he met there was correct (F-44.67, withdrawn).

**Stated as it is (the chair's note on h1's handover):** a NULL block date prints "Blocked: null", as it did at base,
because `longDateYear(null)` returns null. Unreachable, since a block needs a date; not a regression. The h1 handover's
"never null" is true only of a non-date STRING.

## 4 · The founder's rulings

- **R-44.21** (20 Sept): Victor steps out one job at a time, money first; the leftover line stays off until he is out; a
  door turn counts as one message; the wait is 15 minutes (*"ill go with your ruling on all except no. 3. in no. 3 we
  wait 15 mins. thts the time it takes for the thread to refresh"*); the Basic walk; F-44.54's example; his thirteen bytes.
- **R-44.22** (20 Sept): asked *"arent we planning to take away write powers fro Victor"*, then *"yes"*: B14 *"That
  request timed out. Nothing was changed. Say it again."*; and P5b, where the chain loses every hand the door owns.
- **R-44.23** (20 Sept): *"we should get rid of the step where save details is shown after adding a lead. i think its
  a dead screen and doesnt route aywhere in the backend"* and *"After i add new lead, even without details, it gets
  added. end of step. then i can always open the lead and add whats needed later and that half of the machinary works
  perfectly today."* (F-44.59).
- **R-44.24** (20 Sept): *"the yes or no dies at the end of a long statement. we should replace it with Yes or No/ YES
  or NO."*, then *"YES or NO. It immedeately registers."* Landed in P5-h1.
- **R-44.25** (20 Sept): *"Basic doesnt have a messaging option. messaging and ai starts with essentiall signature or
  prestiege"*. R-44.20's Basic listener seat is moot, not withdrawn.

## 5 · Findings F-44.51 to F-44.68, and where each sits

| F | What | Where it sits |
|---|---|---|
| 51 | `ENGINE_SCHEMA.md` verified at 0129, tree past it | Block 09 |
| 52 | a door turn counts once | cured, P5 |
| 53 | yes and no are closed whole-message lists | cured, P5 |
| 54 | the first leftover example reworded | carried, P5 (unused until the last packet) |
| 55 | RLS on the estate unwitnessed | census confirmed; the founder runs it; HARD gate on G6 |
| 56 | the pwa's own "Got it." on an empty reply | the last packet's pwa cut; door turns always emit text (b90) |
| 57 | an invoice with no binder has no byte | ruled: the chain answers; P5 |
| 58 | a late yes reached the chain | cured, P5 (B14), walked live |
| 59 | the Add sheet's "Save detail" is dead | pwa cut on its own slot; leads ruled (R-44.23); the other four read first |
| 60 | the listener missed a relative date | cured, P5-h1, walked live |
| 61 | an advance on a booked lead asked as a booking | cured, P5-h1, walked live |
| 62 | the block lines printed ISO dates | cured, P5-h1, walked live |
| 63 | the 08:00 brief prints ISO dates | P7 |
| 64 | `spokenDate` treats any direction but 'past' as future | P5b's cut: an unknown direction refuses |
| 65 | the chain's false "done" on an unblock (22 March 2027 still blocked, live) | P7; evidence for P5b's read-first |
| 66 | a wedding in the year 227 accepted and carried into money; the list shows the booked lead as NEW | LC-3's opening, HARD before G6 |
| 67 | a limit refusal while under both limits | **WITHDRAWN** on his word: *"no. theres no false limit reach. i had to increase the limit."* The refusal was correct; the reads of 51/60 were taken after he raised the cap |
| 68 | a failed read of the caps would silently apply the in-code defaults (`buildMeta`, `chat.js` from :3310, `val(dayKey, 25)` and `val(monKey, 250)` over `(cfg \|\| [])`) | LATENT, Block 09: a property of the code read by the chair, not an observed fault; no cut now |

## 6 · Errors and corrections

**The seat's (e-17 to e-24):** e-17 A built before the ladder was read · e-18 A sent as a pasteable block before the
chair's confirm (cure C-44.10) · e-19 tdw10 called clear after reading some of its cells · e-20 the first cut's door
fell to the chain after a write · e-21 b90's M10 inside `quiet()` swallowed the bench's later output (the exit code
stayed true; the first cut's "112" was the visible lines) · e-22 the walk's S1 counted money-out records as clients ·
e-23 the walk's meter query matched rows by overlapping windows · e-24 a cap read AFTER an event was reported as the
cap AT the event, and a fault (F-44.67) was named from it. Cause: the seat read the setting and dated nothing; the
first question, did the setting change in between, was one the founder could answer in a line and was not put to him.

**The chair's:** c-44.18 (19 September): the chair told the founder his exported corpus file had already been moved
into scripts/out/ by the first run, from reading the block and not from his screen; it had never been in the
Codespace. Asserting a state the chair had not witnessed. · c-44.25 line cites taken from before a cut · c-44.26 D4
named for D7 · c-44.27 a pwa path written from memory · c-44.28 F-44.46 ruled too wide (payments received) · c-44.29
(20 September): on F-44.67 the chair built a cause, a failed admin_config read dropping the day cap to the in-code
default of 25, on the unverified premise that the cap was 60 at the moment of the refusal, and told the founder it
thought it had found the cause. The founder had raised the cap himself. A theory stood on a number nobody had dated.

## 7 · The queue, in the chair's order (LCV-3's)

1. **The pwa cut for F-44.59**, after the create routes for clients, invoices, expenses and events are read and the
   chair has put them to the founder.
2. **P5b's read-first**, opening with F-44.65 (derive, read-only, which hand Donna was asked to run at 20:18:55 and
   what it returned, from that turn's `tool_calls` and meta) and F-44.64; it needs W-1 and derives on live turns what
   Victor says when Donna has no such hand.

Recorded only, the founder told: his admin screen shows Prestige's monthly AI cap at 200, below Essential's 450 and
Signature's 1,000.

## 8 · Craft this seat learned that the code does not show

- **Both lanes in one bench, with `runTurn` spied.** b90 §12 and §13 drive the REAL `processVendorInbound`: a stub
  estate (b80's shape) whose `from()` chains answer users, vendors and conversations, deps with a counting `runTurn`
  and a recording `sendWhatsApp`, and `workingDoor` swapped in the require cache for a module that is the real one with
  `preTurn` replaced (or wrapped around a fake database with DEV440's vendor and agent pinned in). `vendorInbound`
  requires the door lazily inside the turn, so the swap reaches it; restore the cache in `finally`.
- **Mutations of modules other modules import:** compile the mutated source into a `Module`, put it in
  `require.cache`, delete the dependents from the cache, require them fresh, restore both. A mutation whose anchor is
  missing must fail the cell, never pass it.
- **`quiet()` restores the console only when its promise settles.** Never wrap a promise left pending on purpose (a
  hung listener) in it, or every later line of the bench vanishes while the exit code stays true (e-21).
- **Cold loads prove a lazy require.** A child process per load order (`spawnSync(process.execPath, ['-e', ...])`)
  is the only honest test that two modules requiring each other still yield a full string (b90 §14).
- **Every SELECT for the founder is run first on a local Postgres 16 built from the schema docs:** parse the column
  blocks of `PUBLIC_SCHEMA.md` and `ENGINE_SCHEMA.md` into DDL for exactly the tables the SELECT reads, plant rows
  shaped like his, and run the statement's exact bytes, including an empty database for the control. Postgres in the
  container does not survive between turns: restart it (`pg_ctl -D /tmp/pgd ... start`) before each use.
- **The container is not his machine.** Background processes and Postgres die between turns, so a floor is started
  with `setsid nohup` and polled INSIDE one turn (about 15 minutes). The container shows 6 refusals where his Codespace
  shows 4; neither number is an expectation. The pwa sibling must be moved aside to match his dream-os Codespace, and
  moved back after. A push always fails here (no credentials): run the git block to its commit and undo it.
- **Date the number before naming a fault from it** (e-24): a setting read now is not the setting at the event.

---

Trust evidence over narrative, including this file. Sequencing beyond this sitting is the founder's.
