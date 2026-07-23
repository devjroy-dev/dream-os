# TDW_05 — F-05.55 · THE VENDOR MEDIA LANE'S DURABLE DEDUPE · HANDOVER
**Base `0fb674a` (re-derived at origin, fetch-first, at authoring). §11 first motion clean. Two §0.2 reports filed at read-first; both ruled before a byte moved (CE rulings R1–R8 + the R4 addendum).**

Delta: **3 files modified, 1 added.** `src/lib/vendorInbound.js` · `scripts/b05_media_shim_bench.js` · `scripts/b05_arc_m6_bench.js` · NEW `scripts/b05_f0555_media_dedupe_bench.js`. Zero migrations, zero SQL, zero copy, zero PWA.

---

## 1. THE CURE — THE GUARD ROW, CLAIMED BEFORE THE SPEND

The media branch's inbound audit row **moved to branch entry and became a guard.** It is now the first thing the branch does: look up `vendor_self`, write one `inboundRow`-built row carrying `internalReplay ? null : messageSid`, read the insert's `{error}`, and on `isDuplicateSidError` **log and return — before the Vision call.**

**Why it moved rather than merely gaining a sid (R2).** The pair was written *after* `extractCalendarFromImage` and *after* the preview send. Handing that row a wamid would have cured the duplicate audit rows and nothing the finding is about: the Vision spend and the vendor's second message have already happened by then. Fork (a) buys a bench green, a byte-clean diff, a sealed micro, and a redelivered image that still OCRs twice.

**The two-insert split** is R2's disclosed structural consequence: the outbound half cannot move with it (the preview body does not exist until the send), so the array insert became two inserts.

**Ordering, asserted not assumed** (`§2.1`): `messages:inbound → vision → proposal → send → messages:outbound`.

## 2. R3 — THE OUTBOUND HALF

**Byte-untouched and takes no `message_sid`.** Same six keys, same values, same order, asserted key-by-key at `§3.1`. The chair's correction №3 stands in the record: the kickoff's *"the outbound half has no wamid by nature"* was false — `whatsapp.js:145` returns the wamid in `.sid` (the documented misnomer) and `:246` already persists it in `twilio_sid`. `0084`'s contract is inbound-only; an outbound wamid in that keyspace invites a cross-direction collision on a column whose whole meaning is inbound identity.

## 3. F-05.61 — SCOPE HELD AT ONE SITE (R1)

The `{error}` is read **at the new guard site and nowhere else.** `§5.1` asserts the census mechanically: six `inboundRow` sites in the file, **exactly one** reads its error, and it is the guard. The ten-site sweep is chartered to the **RF-1 coherence sitting** with F-05.62, and the file says so in its own header — including the pinned version (`@supabase/supabase-js 2.105.4`) the no-throw was proven against, so the next reader does not have to re-derive it.

**The witnessed index is cited at the site that depends on it** (`§5.3`): `messages_message_sid_uidx`, its partial predicate, and `0084`. Per the R4 addendum the mechanism is now a production fact, not a migration's promise.

## 4. THE BENCH — `b05_f0555_media_dedupe_bench` **23/23**

**It reaches the reject path nothing in this estate had ever driven.** `b05_arc_m6_bench §2.3` states its own limit correctly — *"the DB's unique index does the REJECTING and a bench has no index"* — so M6 proved the hand-off and stopped there. This harness **builds the index**: a seen-Set keyed on `message_sid` returning a real `{error:{code:'23505'}}`, reproducing the founder's witnessed `CREATE UNIQUE INDEX … WHERE (message_sid IS NOT NULL)`.

It also drives **the handler's own two lines** (`src/index.js:186-187`), because the finding's sentence is about a restart and the LRU lives in the handler. Same-process redelivery must die at the LRU (`§1.3`); post-restart redelivery must reach the core and die at the guard (`§1.2`).

**THE NAMED TEST — `§1.2`:** same wamid, `_resetSidLru()` between passes, DB state carried across → **zero second Vision calls, zero second proposals, zero second sends, zero second rows**, and the second pass's whole event log is `['messages:23505']` — it did one thing, hit the index, and stopped.

**FIVE PRODUCTION MUTATIONS, all RED, each for a named reason.** The helper matches the failure message against an expected regex, because a mutation that syntax-errors also makes a cell throw and a helper asking only *"did it throw?"* would score a crash as proof. M1 bare row · M2 error-read killed · M3 wamid not handed over · M4 **ordering reverted** (the region moved back after the Vision call) · M5 outbound half takes a `message_sid`. `§8.6` proves byte-identical restoration.

**`§7.1` is the synthesis scenario (§9's clause), and it is the one that mattered:** a captioned image whose Vision call throws falls through into the full vendor text path, which writes its own inbound row on the same wamid at the file's other `inboundRow` site — a site this micro deliberately does not fix. **Net inbound rows: one before the cure, one after.** The survivor is now the guard row, which additionally carries `media_url`. Each half worked; the pair was the risk; it is asserted rather than reasoned about.

## 5. 🛑 TWO FLOOR MOVES — BOTH FORCED, BOTH LABELED, RATIFY-OR-REVERT

**(a) `b05_media_shim_bench` — count preserved 14.** The cell read `captured.messages[0].find(...)`, which encoded the branch's OLD contract: one insert carrying an array of two. After the split, `messages[0]` is an object and `.find` was a `TypeError` waiting on apply. **Re-aimed at the NEW caller's payload under the both-sides clause (CE-59)** — the split is asserted explicitly, the old shape's green retired, not retained.

**(b) `b05_arc_m6_bench` — count preserved 20. THE FLOOR CAUGHT THIS, NOT ME.** `§2.1`'s mutation anchor was the bare substring `.insert(webhookCore.inboundRow({`, and `String.replace` with a string pattern replaces **the first occurrence only**. That first occurrence used to be couple door #1. This micro's guard row sits above every couple door, so the first occurrence became a `sent_by: 'vendor'` row — the mutation went on mutating something, just not its own subject, and `§2.1` (which scans `sent_by: 'couple'` rows alone) **stayed green over a tree it existed to convict.** Caught on the floor run. **Re-aimed to a couple door BY NAME** (`conversation_id: thread.id`, door #1's own referent, unique in the file) so it cannot drift onto a neighbour however many inbound writers this file grows. This is the referent lesson — *"the shape looked right and the REFERENT was wrong"* — in its third application, and this time the guard found it before a human did.

## 6. THE EXECUTOR'S REGISTER — ONE CLASS, CAUGHT IN DRAFT

**I wrote the live-tree trap and then refused it.** `§6.1`/`§6.2` were first authored as `git diff … 0fb674a -- src/` against the **working tree**: *"the src delta is exactly this one file"*, *"no speakable line entered the diff."* Both were true the minute they were written and both were the `arc_m4 §4.1` disease — a guard with an open end, green today, structurally RED the moment the founder commits this very delivery or the next chartered sitting adds a file. This estate has convicted that class three times and paid for it each time; I nearly shipped the fourth inside a cure. **Re-aimed to properties true forever:** every media-branch string asserted byte-exact, and the guard region asserted to contain no `sendWhatsApp` at all. `§8.6` was de-coupled from `git status` for the identical reason and now compares against a snapshot taken at bench start.

## 7. THE FLOOR — **24 FOR 24, ALL rc=0**

CE-68's living 23, plus this micro's new harness:

`crons 48` · `sendwa 55` · `webhookcore 11` · `otp_meta 24` · `b0498 58` · `punct 17` · `movementb 47` · `transport 10` · `m1b 4` · `m2 2` · `prospect 47` · `checker 101` · `onboarding 27` · `couple_soul 21` · `f0532 9` · `arc_m1 53` · `arc_m2 27` · `arc_m3 11` · `arc_m4 18` · `arc_m5 11` · **`arc_m6 20` (amended, labeled)** · `f0550 31` · **`media_shim 14` (amended, labeled)** · **`f0555 23` (NEW)**.

Twenty-one byte-stable, two amended in place with counts preserved, one new. `f0550` reads **31 with the engine dist built**; on a clean clone with no dist it reads **29**, `§2.2`/`§2.3` skipping per D-11's stated gate — named so nobody reads it as drift. `node --check` clean on all four touched sources. **W-1 clean:** `src/engine/` and `src/agent/` are 0-line, as are `eventWrite.js`, `scrub.js`, `calendarSignals.js`, `coupleEventWrite.js`, `leads.js`.

## 8. DECLARED GAPS AND BEHAVIOUR DELTAS — NAMED, NOT DISCOVERED

1. **A media-first vendor is undeduped for exactly one turn.** A vendor whose first-ever message is an image has no `vendor_self` conversation yet (it is created on the text path below), so there is no row to claim the wamid with. Pre-existing shape preserved; creating the conversation here would make this branch a second writer on that plane, which is unruled and outside charter. Logged loudly in production, asserted at `§4.3`.
2. **A zero-proposal or failed-proposal image now leaves an inbound audit row where it previously left none.** That row is what makes the redelivery dedupable; it is the cure, not a side effect.
3. **A redelivery after a failed Vision call is also dropped**, and that is correct: a redelivery is Meta re-sending one message, never a retry channel for our failures. The vendor was already answered on the first pass.
4. **The other nine `inboundRow` sites still discard their `{error}`** — F-05.61, chartered to the RF-1 coherence sitting per R1, deliberately untouched here.

## 9. THE LIVE WITNESS — **DECLARED, NOT CLAIMED (R8)**

Meta redelivery is not founder-triggerable on demand. **Structural proof carries the seal; nothing live was run and nothing live is claimed.**

**A restart-window replay travels as a PROPOSAL only, and runs only on the founder's word** — it is not part of acceptance:

> Send one calendar image and let the preview arrive. Restart the `dream-os` service in Railway. Then, from the Meta side, re-deliver that same message. Expected: no second preview on the handset, one `[webhook:vendor-image] duplicate wamid … dropping BEFORE the Vision call` line in the Railway log, and `select count(*) from messages where message_sid = '<that wamid>'` returning 1.

The founder performs and pastes; the executor reads the evidence. **Not requested, not sequenced — his call entirely.**

## 10. WHAT THE NEXT SITTING PICKS UP

- **F-05.61 + F-05.62 → the RF-1 coherence sitting** (ten-site error-read sweep, both lanes, plus the bride muse-save reorder), named kin to F-05.48's outbound sweep — one family, discarded return values, two directions. Founder-sequenced.
- **The shelf as it now stands:** F-05.39 · F-05.60 · F-05.56's deletion ruling · the RF-1 coherence sitting · the auth sitting (F-05.13+28+30) · F-05.52 · F-05.53+54+59 · the F-05.48 sweep · F-05.19.
- **Then the founder's spine: BLOCK 06 TO M-6 EXIT**, two-green acceptance clock at ZERO.
