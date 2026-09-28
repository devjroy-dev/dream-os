# TDW · CE-46 · ASK-3 · CUT 5 HANDOVER · search-first as a CODE rule; the invoices tool; bank v4. Both lanes stay ON.

R-45.33 and R-45.26: facts by code, words by the agent, never a guard that makes a sentence unsayable. Base 0ac1a01 (IGD-2's 2c), derived by command
at the cut (`git fetch -q origin && git rev-parse --short origin/main`); the seat cloned at de38b5c and moved onto 0ac1a01 by command, and
`git diff --stat de38b5c 0ac1a01` over every path here is empty. Nothing a vendor reads changes by any key: both `vendor.ask_agent.*` rows
stay true as ASK-2 left them (no admin_config row in this cut). Production: `src/lib/vendor/askAgent.js`, `src/lib/vendor/askTools.js`.
Scripts: `scripts/b130a_ask1_floor_bench.js` (§19, M15 to M17; 1.2, 3.3, 18.1 to 18.3, 18.5 re-pinned by label), `scripts/b130m_ask1_measure.js`
(five live hand labels, the class line, `reprompted` in the record), `scripts/lib/ask1_bank.json` (v4). Docs: this file, ASK-2's cut 2 and 3
handover and seat-close (R-40.95). The chair's rulings of 27 September on the read-first, applied as ruled: shape (a), F1 (a2), F2 an
agent-side pattern, the invoices tool now, bank labels as written.

## The disease, and where it lived

On the walks of 27 September four live turns ("sarah ka event kab tha" on the app; "Walk p5 ke event date kab hai" and "When is walk p5
event?" on WhatsApp; "What was the last invoice raised" the wrong table) declared a name absent or unreadable with ZERO tool calls. Rule 13
of the prompt (askAgent.js, "call the client tool BEFORE you ask her anything") was the third prompt cure of this class and the class
survived each. The home was not the prompt: the loop's accept branch (`if (!uses.length) { ... return { ok: true, reply: said } }`) took any
text-only round as the reply and read nothing of the turn's tool trace.

## What changed

- **THE GATE (search-first), askAgent.js.** At the accept branch: a round with no tool call, in a turn that has made no call
  (`calls.length === 0`), whose text asserts an absence or a refusal (`ABSENT`, the agent's own small pattern: could not find / read / see,
  do not show / have / hold, no one called, nobody called, not in your records, nahi mila / mili / hai, nahin mila), is NOT accepted the
  first time. The loop pushes the model's text as the assistant turn and one fixed user-role instruction (`reprompt`), then runs the next
  round WITH tools. Once per turn. Whatever comes back after that is accepted and measured by b130m, never blocked: the sentence stays
  sayable, only its timing moves. A searched absence (any call this turn) is accepted at once; a greeting, a fact, a total, a hand-back
  never match `ABSENT`. The re-prompt names her candidate tokens by code (`nameTokens`: case-free, every word of three letters or more or
  one carrying a digit, not in `STOPLIST`, eight at most; `STOPLIST` a frozen array of the question and date words in English and
  Hinglish; a wrong stoplist over-names, never hides). Zero bytes of the cached prefix move for the gate; a clean turn's requests are
  unchanged. The return carries `reprompted`.
- **THE FOURTEENTH READ TOOL `invoices`, askTools.js.** Her invoices by the day they were raised, newest first (`created_at`, read as the IST
  day: `raised_on`), with number, client, total, paid, state, due; `latest` for the newest only (one row, the rest counted in `more`);
  `range_as_spoken` read over the day raised by IST day (the same read `leads` takes for `added_as_spoken`); `client_as_spoken` through
  `matchNames`. SELECT only, scoped by code to `ctx.vendorId`, live rows only, capped at ROW_CAP. Column witness:
  docs/db/PUBLIC_SCHEMA.md public.invoices: vendor_id, invoice_number, client_name, amount_total, amount_paid, state (CHECK unpaid |
  advance_paid | paid | cancelled), due_date, created_at (column 15, timestamp with time zone NOT NULL default now(); no issued or raised
  column exists), deleted_at. The 37th worked example ("What was the last invoice raised?", names and figures INVENTED as the others
  declare) sends an invoice question to invoices, never events; rule 13 and every other rule's bytes are untouched.
- **THE PREFIX MOVED** (a tool schema joined; the last tool carries the cache marker): b130a 15.3's character proxy reads 22,115 (was
  20,963). The API's own count and the cache proof are `--probe`'s, run before the live run (the card's block P).
- **Bank v4** (371): q363 "sarah ka event kab tha" (fact, client|events, 17 October 2026); q364 "Walk p5 ke event date kab hai" and q365
  "When is walk p5 event?" (not_in_records, client: an honest absence AFTER a search passes, one with no call fails on `called`); q366
  "What was the last invoice raised" (fact, invoices, TDW/DEV440/08); q367 "any idea whaat stage nalini booking is?" (not_in_records,
  client); q368 to q371 the walk's Hinglish forms (day, team, day, day), by the store's facts. `class: "search_first"` on q016, q026, q317,
  q363, q364, q365, q367. q001 to q362 unmoved in text, family, strat and expect (sha pinned, 19.11). The seat-close's "q026 is the live
  wording exactly" is not so: q026 reads "when is isha walk event"; the live wording is q365 (c1, credited).
- **b130m.** Five hand labels from the live walks (the four zero-call replies, m1 false; the Nishta control, m1 true; m4 labelled as the
  READER defines it: a result that held nothing; with no call there is no empty result, so the walk's hand "m4" is m1's here). One
  report line in the live verdict and in `--rescore`: `search_first: kept/all on m1`, from the SAME m1 reader; a miss there fails the
  verdict at zero tolerance. No reader moved (C-44.4). The record line carries `reprompted`. A-46.1 holds: bare exit 0, no key.

## Proven

- b130a 141/0: 126 carried; §19 twelve cells: 19.1 the unsearched absence is not accepted, a second request follows with tools, its last
  message the re-prompt naming `sarah`, then the search, then the answer (rounds 3, calls 1, reprompted); 19.2 round 1 carries only her
  message, the refused text rides as the assistant turn; 19.3 the tokens by code (walk, p5; sarah; idea, whaat, nalini; nishta; none for a
  nameless question; no stopword survives; eight at most); 19.4 ABSENT both ways; 19.5 CONTROL a greeting accepted at once; 19.6 CONTROL a
  searched absence accepted, never re-prompted; 19.7 the re-prompt fires once and a repeated unsearched absence is accepted, never the
  glitch line; 19.8 the cached prefix unchanged by the gate, the 37th example in it; 19.9 invoices newest first (08 raised 2 September 2026,
  05, 07), LEAKB absent, latest one row + 2, this month, a client; 19.10 BOTH WAYS the filters recorded (vendor_id, deleted_at, created_at
  desc); 19.11 bank v4 by label with the v3 sha; 19.12 the store witnesses the new labels. Mutations of production code, each reddening:
  M15 the gate removed (19.1, 19.7), M16 the re-prompt's tokens dropped (19.1), M17 invoices ordered oldest first (19.9, 19.10). 14.8's
  dirt gate intact. Run under Asia/Kolkata, America/Los_Angeles and Pacific/Kiritimati: 141/0 each (every clock in the rung is the
  store's pinned NOW_MS, C-44.13).
- BOTH WAYS at the base: the new rung and bank v4 on 0ac1a01's code: 3.3, 18.1, 18.2, 18.3 and 19.1 RED, then ERROR at 19.2 (the base has
  no `reprompt` symbol and no second request), exit 2. 1.2 stays green there (the battery list names invoices whether or not the tool
  exists; a control on the battery, disclosed).
- b130m bare = --readers 39/0/0, exit 0; --dry 351/351 through the real loop over bank v4, zero writes, 2.00 calls a question with the
  stub; the cost line: about 603 live runs at --n-missed 10, warm proxy about $0.0041 a run; the last real run (549, 27 September) cost
  $1.4674, about $0.0027 a run, so about $1.62 for 603 plus one cache write. --budget=3 as ruled.
- The differential, radius derived by command (`grep -l "scrub\|askAgent\|ask1_bank\|askTools\|b130" scripts/*.js`, 25 rungs), every rung
  run at the base and at the cut in two trees with the engine built in both (A-45.11), OUTPUT diffed: identical for 22; b130a 126 -> 141;
  b130m readers 34 -> 39; b138 2.1 "34 worked replies" -> 35 (the 37th example's reply, byte-identical through scrubText, green both
  sides). b05_p4_crons RED on both sides (floor-base); b06_gauntlet exit 3 on both (no key).
- node --check on both production files; `npm run build:engine` exit 0 (no engine source moved).

## Copy inventory

Vendor-facing lines added or changed: ZERO. Model-facing bytes: the re-prompt (`reprompt` in askAgent.js), the invoices tool description,
worked example 37. Under R-45.30: plain, literal, no dash.

## Departures and disclosures, for the chair

- **d1 (ASK-2's d1, carried):** the root `.gitignore` line for `scripts/records/` cannot ride inside deploy/ (§9's dotfile law). The card's
  block 1 appends it with one printf after the apply; `.gitignore` is in the manifest and in block 3's git line.
- **e-201 (mine):** the first §19 cell recorded the loop's `params.messages` by reference and read it after the turn, so it saw the final
  array, not the round-2 request; cured by a snapshot at call time. The bench's own first red, not production's.
- **e-202 (mine):** a `//` comment appended to a one-line `const gated = ...` swallowed the rest of the line and the rung would not parse;
  caught by `node --check` before any run; moved above the line.
- The m4 label for the four zero-call replies reads TRUE under the reader (a result that held nothing) while the walk's hand verdict filed
  them under m4 as well; the miss is m1's in both. Named, not changed (C-44.4: the labels prove the reader as it is).
- The `1.2` control stays green at the base (above); it counts the battery, not the tool.

## The paid steps (after the floor, on the chair's word; cost first, each its own block)

P: `--probe --model=haiku` (two short calls, about $0.02): the prefix's API count against 4,096, cache_creation then cache_read. RED = no live.
L: `--live --model=haiku --budget=3 --show-misses` (about $1.62 projected; the record `scripts/records/b130m/b130m_haiku_<tip>_<clock>.jsonl`
written by the script, A-46.3). PASS: m2 0; search_first 0 missed of its runs; m1 within one in twenty; m3, m5 0.

## r2 · the live run of 28 September read and ruled; re-cut on 0ac1a01

The first run (record b130m_haiku_0ac1a01_20260928-0514.jsonl, 603 runs, $1.6906, every run on the cache; PROBE GREEN at 6,855 tokens
by the API, cache_creation 6,516 then cache_read 6,516): m2 to m5 603/603; m1 570/603; search_first 36/61 on m1, the gate re-prompting 5
(all q016, each then searching). The disease itself (an absence with zero reads): 60 of 61 search_first runs read a tool; the one
zero-call run was q317's ask-back. Block 3 was held. The chair's rulings of 28 September, applied here:

- **R1, by label, by hand (C-44.4, readers untouched):** q364 and q365 tools [client, events] (e-203, mine: rule 13 permits events and
  every run searched it truthfully); q368 kind fact, facts ["24 December 2026"] (e-204, mine: the "none" reader is English); q247 admits
  invoices; q016 kind fact, tools [leads, client], facts ["Sarah Kapoor", "Priya Mehta"]. The ruling said "the two booked Walks' names";
  the store holds no booked Walk and the five true replies name the vendor's two booked clients, Sarah Kapoor and Priya Mehta, so those
  are the facts (disclosed). The 19.11 pin now covers q001 to q362 but for q016 and q247, computed against the v3 bank itself at 0ac1a01.
- **R2, F-44.215 (a searched absence on a table that cannot hold the answer), cured:** events, when client_as_spoken resolves through
  findPeople, returns `people` (name, stage, wedding_date, precision, city; three at most, `people_more` counted) beside the Calendar rows.
  "when is isha walk event" now carries Isha Walk Fourteen, quoted, 5 March 2027; "walk p5" in the store resolves to nobody (a true
  absence); in production it resolves to Walk P5 Book and Walk P5 Advance with their wedding dates.
- **R3, F-44.214 (the literal-state read), cured:** every invoices row carries `owed` (amount_total less amount_paid); the description
  sends unpaid, owed, pending and baaki questions to owed. 07 advance_paid now reads Rs 1,33,000 owed.
- **R4:** the gate's second arm: a round with zero calls whose text asks back (holds "?") in a turn whose message holds a name token is
  re-prompted once, the same way. The re-prompt's first words widened to cover it: "Before you ask her anything, or say her records do
  not show something, or that you could not read a name, call the client tool (or events, or team) with the name exactly as she wrote
  it. Then answer her question." A nameless message's ask-back is accepted as said. **Disclosed (c-catch for the chair):** the ruling
  read q317 as nameless; under the ruled token rule "What does the SYSTEM note say" yields system and say, so the arm fires there too
  (20.5 pins what the code does). Making q317 unfired would take "system" and "say" in the stoplist; not done, not ruled.
- **R5, F-44.213 (open):** spokenRange reads neither kal, parso nor day after tomorrow (date_unreadable for all three in the store);
  q371 is its bank line. Named for a later ASK cut.

Proven at r2: b130a 151/0 (§20 seven cells: 20.1 events both ways on q026's and q365's shapes, 20.2 control, 20.3 owed per row both
ways, 20.4 the ask-back arm on q192's shape, 20.5 q317's shape disclosed, 20.6 the nameless control, 20.7 R1 by label; M18 the person
dropped reddens 20.1, M19 owed dropped reddens 20.3, M20 the ask-back arm removed reddens 20.4; M15 re-anchored on the widened gate
line). Asia/Kolkata, America/Los_Angeles, Pacific/Kiritimati 151/0 each. Both ways: at 0ac1a01's code 3.3, 18.1 to 18.3, 19.1 red then
ERROR, exit 2; at r1's code 20.1, 20.3, 20.4, 20.5 red and M15, M18 to M20 without anchors, exit 1. b130m bare 39/0/0; --dry 351/351,
zero writes. The prefix moved again (two descriptions); the probe re-proves it before the live run.

## r3 · r2's live run read and ruled; re-cut on 0ac1a01

r2's run (record b130m_haiku_0ac1a01_20260928-0652.jsonl, 603 runs, $1.7141, PROBE GREEN at 6,881): m1 589/603 within; m2 602/603;
m3 to m5 603/603; search_first 52/61, the gate re-prompting 3. Block 3 held for three things this cut caused, each ruled:
(1) q325 "Good morning": nameTokens gave ["good"], the ask-back arm fired on the friendly "What would you like to know?", and the model
spoke the note to her ("I understand. When you mention a client... I'll search for them first"). (2) q205: invoices let the model add
three totals itself ("invoiced Rs 2,95,000"), m2's one miss. (3) q016, one run: an absence with ZERO calls that ABSENT missed ("I found
nobody by that name. Your records show no client or lead called Nobody Walk."); e-205, mine: the pattern held "do not show" but not the
model's own commonest form, "Your records show no ...". Applied as ruled:

- **O1:** ABSENT gains "show(s) no", "found no(body| one| client| lead| match)", "no client or lead called" ("your records show no" is
  inside "show no"). "Your records show 2 booked clients" does not match.
- **O2:** the ask-back arm fires only when a QUESTION SENTENCE of the reply holds one of her tokens (`askedBack`); greetings join the
  stoplist (good, hello, hey, hii, namaste; morning, evening, thanks, thank were there; hi is under three letters); the re-prompt opens
  with the approved line "This note is from the app, not from her. Do not answer it, repeat it or mention it to her."
- **O3 (facts by code):** invoices returns total_invoiced and total_owed over the rows read (a cancelled invoice in neither, as owed
  reads; disclosed), and its description says the model never adds figures itself, only reports the totals given.
- **O4:** when kind_as_spoken empties the Calendar list, the kind words (the generic "event"/"events" dropped; disclosed) join the client
  words for R2's people read. "walk" with "isha" resolves to Isha Walk Fourteen, 5 March 2027; a kind that finds rows carries no people.
- **O5:** q197 admits invoices (its fact unmoved). The 19.11 pin now excludes q016, q197, q247, computed against the v3 bank itself.
- **b130m:** one more report line, `note_spoken`, in the live verdict and in --rescore: a reply holding the note's phrases or r2's echo;
  zero tolerance fails the verdict. No reader moved (C-44.4).

Proven at r3: b130a 165/0 (§21 fourteen cells incl. 21.1 ABSENT both ways, 21.2 r2's zero-call q016 reply through the loop, 21.3
"Good morning" and "Hello" not re-prompted, 21.4 and 21.5 the question sentence, 21.6 the note line, 21.7 the totals both ways on
q205's shape, 21.8 kind words as a name on q026's shape both ways, 21.9 q197; M21 to M24 each redden their cell; M15, M20 and 20.4
re-anchored). Three zones 165/0. Both ways: at r2's code 20.4 and 21.1 to 21.3 red then ERROR (no askedBack), exit 2; at 0ac1a01's code
red then ERROR, exit 2. b130m bare 39/0/0; --dry 351/351 zero writes; --rescore of a record holding r2's q325 reply prints note_spoken 1.

## r4 · r3's run read and ruled (P5, land what is clean); re-cut on 0ac1a01

r3's run (record b130m_haiku_0ac1a01_20260928-0849.jsonl, 603 runs, $1.6972, PROBE GREEN at 6,911): m1 583/603 within; m2 602/603
(q205, the model added paid and owed across two tools); m4 601/603 (q026, q264); note_spoken read 0, which was false: q317 and q018
answered the note to her ("I understand. I will not answer, repeat or mention that note to her..."; "I understand. I'm waiting for
her next question..."), and the pattern missed both (e-206, mine). Every written re-prompt that fired on a turn with nothing real to
search was spoken to her in some form (r2 q325, r3 q317 and q018). Ruled P5:

- **LANDS:** the invoices tool with owed per row and the totals; events' people (R2, O4); bank v4 with every label as ruled; the gate's
  ABSENT arm with r1's re-prompt text exactly (byte-identical to r1's; it fired five times in r1 with no echo), ABSENT widened by r3's
  forms and "can't/cannot read (your) records"; the greetings stay in the stoplist (they only shape tokens).
- **OUT of cut 5, to ASK-4 as its first item:** the ask-back arm (askedBack removed), the note line, and the forced read (tool_choice any
  on the retry round, the cache and DeepSeek proven there). q192's and q364's unsearched ask-backs and q264 are carried to ASK-4, named.
- **q205:** ruled honest arithmetic under R-45.26 for this cut. The bank labels it `derived: ["Rs 2,95,000"]` with the reason; m2 counts
  a `derived` figure as held. That is a reader reading a new label field, demanded by the hand label (C-44.4), proven both ways by two
  hand labels (the same reply with and without the field: m2 true, then false). A tool-side total across paid and owed is ASK-4's.
- **NOTE_SPOKEN (measurement only):** widened to the answer-to-the-note shape; the bare run prints a self-test: 3 of 3 echoes caught
  (r2's q325, r3's q317 and q018), 0 of 41 labelled replies falsely caught; a failed self-test fails the bare run.

Proven at r4: b130a 164/0 (20.4, 20.5, 21.4 to 21.6 re-pinned by label to the arm-out state; M20 and M22 retired with the arm; M25
new; M15 and M21 re-anchored); three zones 164/0. Both ways at r3's code: 20.4, 20.5, 21.5, 21.6 red, M15, M21, M25 without anchors,
exit 1. b130m bare: readers 41/0/0 and the note_spoken self-test 3 of 3, 0 of 41; --dry 351/351 zero writes. The 19.11 pin excludes
q016, q197, q205, q247, computed against the v3 bank itself.

## Next

The founder's walk (the four live misses re-asked on both lanes, the invoice question). Then, in the kickoff's order: DeepSeek's --probe and
--live under the current name (K11), the prefix re-run (6,191 live against 6,530 probed), cut 4 (lookupDoor's question branches and B86/B87
retired, rungs re-pinned by label), the Advisor's em dash for P8, each on the chair's word.
