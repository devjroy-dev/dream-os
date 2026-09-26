# TDW · CE-45 · ASK-1 · CUT 1 HANDOVER · the question agent, built, both lanes OFF

R-45.33. Base 1b37c26 (ELZ-1's cut 2c), carried by hand from the first build on cda36fa; see "Base" below. Rungs b130a (floor half) and b130m (measured half).
Read-first ruled at sha256 8842dab2cda3...; departures d1 to d6 ruled 26 September 2026; d7 and d8 are new in this cut and are the chair's.

## What shipped

A vendor's question that the door does not own as an action or a pending confirmation can now be answered by a read-only agent,
from her own records, in plain words. **It is switched OFF on both lanes.** Nothing a vendor reads changes with this cut.

- `src/lib/vendor/askTools.js` (new): the thirteen read tools (day, days, events, client, leads, owed, paid, due, expenses,
  packages, team, sent, reminders). The vendor id is the context's, never the model's; SELECTs only; sums and counts in code;
  money said as "Rs 1,50,000", dates as "5 March 2028"; a failed read is "unreadable", never an empty list; lists cut at 40
  with the remainder counted; ranges capped at 92 days.
- `src/lib/vendor/askAgent.js` (new): the bounded loop (4 rounds, 4 tool calls a round, 20 s). Markdown and dashes folded on
  the way out; a reply naming itself fails closed to the glitch line.
- `src/lib/vendor/spokenRange.js` (new): her words for a stretch of days, resolved in code; composes spokenDate's day reader.
- `src/lib/vendor/workingDoor.js`: preTurn's two question exits carry the agent's context when the lane's switch is ON;
  standIn hands those turns to the agent; persistDoorTurn meters the agent's spend as its own uncounted row; five names
  exported. Every action path, note and the YES/NO machinery untouched (b130a §9.8, §10).
- `src/lib/laneFlags.js`: `vendor.ask_agent.pwa` and `vendor.ask_agent.whatsapp`, both false.
- `src/lib/vendor/coupleDrafts.js`: one new READ function, `sentFor` (d7).

## Departures (d1 to d6 ruled; d7, d8 for the chair)

- d1 `sent` does not read lead_alerts (TDW's alerts to her). d2 the agent's spend its own uncounted row on its own model.
  d3 a day she blocked is "blocked" to her. d4 a local name matcher (agreement with nearestName pinned, b130a §11).
  d5 workingDoor's export line. d6 dueThisWeek's invoice read by id, the one pinned scoping exception (b130a §1).
- **d7** `sent` reads drafts through a new `coupleDrafts.sentFor`, not a SELECT of its own: b06 7.3 holds coupleDrafts as the
  table's one home, and the first build's direct read reddened it. The function is additive; no existing byte of the file moved.
- **d8** two ratified rungs re-aimed BY LABEL, their claims kept: b110 3.4 (the door reads no lane flag but ASK_FLAGS, once, in
  askContext) and b93 3.2 and 8.2 (the reason `question` joins, 22 reasons; the uncovered exit's `return CHAIN(` became
  `return (...) || CHAIN(`, 32 returns by shape; the retired key read nowhere, the one lane-flag read the agent's).
  **r2**: b131 4.2 (ELZ-1's F-44.176: relaySeat.js and coupleDrafts.js untouched since 727ed5c) re-aimed the same way as b113 2.3:
  relaySeat.js still untouched; coupleDrafts.js zero lines removed and every added line sentFor's. It was found by his floor, not
  by the seat: the seat's radius was the rungs naming workingDoor.js or laneFlags.js and was not widened when d7 touched
  coupleDrafts.js. The radius is now every rung naming a module the tools read or touch (34 more), all identical to base.
  b99 M7's anchor was kept by writing the uncovered hand-off on the exit's own line, not by re-aiming b99.

## Proven

- b130a: 94 of 94 green (83 carried, plus 11 for 2c's pick notes: a live-note control and an E2 cell for each of B8, B10, B24, B61 and B53C, and a no-note control), including seven mutations of production code each reddening its cell, and the dirt check restoring
  and gating (A-45.4). Scoping over 400+ tool calls by recorded filters; no look-alike studio B row in any result; a model's
  vendor_id changes nothing; empty and failed reads; hand sums; caps; the symbols and the 24-module require graph pinned;
  342 bank questions through the real agent with a scripted model, ZERO writes and ZERO sends; the hand-off through the real
  preTurn and standIn with the switch off (identical) and on (per the ruled table); E2 by construction; the money functions
  byte-identical to the base by hash.
- b130m --readers: 20 hand-labelled replies, 5 rules, false positives 0, misses 0 (C-44.4). --dry: 342 of 342 through the
  real loop, zero writes; measured request about 4,200 input tokens a question.
- The differential: the 39 rungs that read workingDoor.js or laneFlags.js, at cda36fa and at the cut; see the record in the
  chair's relay (cell counts per rung).

## The measured half (before cut 2 opens; the founder's keys)

    node scripts/b130m_ask1_measure.js --live --model=haiku
    node scripts/b130m_ask1_measure.js --live --model=deepseek

Cost line printed by --dry: haiku about $0.0067 a question, 549 questions a model, about $3.67. DeepSeek's price is not in the
tree and is stated as unknown until read from its own page on the day (set DEEPSEEK_USD_PER_M_IN and DEEPSEEK_USD_PER_M_OUT
for --dry to print it).

## The walk for cut 1: a NO-CHANGE walk

Both switches are off, so every reply is what it was. The founder asks, on WhatsApp and in the app: "Who are my new leads?",
"What's due this week?", "Am I free on 14 February 2027?", "How much is owed to me in total", "What are my blocked days",
"Hi". Each reads exactly what it read before this cut (the lookups' own lines, B86/B87, B34 or LEFTOVER as today).

## The bank

`scripts/lib/ask1_bank.json`, 362 questions (31 witnessed from his export, 23 of them strat 'missed'; 20 notes-first controls
that never reach the agent; the rest from his kickoff words and variation, marked unwitnessed). It grows by every walk's misses.

## Base

First built on cda36fa, then carried onto ELZ-1's cut 2c (1b37c26) by hand: the banked patch applied without a conflict, and
every region was re-read against 2c's workingDoor.js. 2c's five pick notes (B8, B10, B24, B61, B53C) are all decided in
preTurn's note branches, above `if (!fromNote) {`, so both hand-offs still sit below every note (b130a 9.8 static, 9.15
at runtime: her bare "2" after each pick list, heard at its worst as a search with no act, switch ON, stays the note's; 9.16
shows the same "2" with no note does reach the agent, so 9.15 is not vacuous). B10's cell reads `invoice_unresolved`: the
pick replayed into planInvoice, which found no binder in the double. That is the door's own reason, not the agent's.

## Next

Cut 2: the app lane ON by one admin_config row, after --live is within tolerance on both models; the founder's walk.
