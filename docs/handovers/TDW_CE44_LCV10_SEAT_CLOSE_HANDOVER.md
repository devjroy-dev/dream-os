# repo: dream-os @ d4656402a5a599c46cf8c35cfdb8cbf544e8f437 · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307 (untouched by this seat)
# TDW · CE-44 · SEAT LCV-10 · SEAT CLOSE · THE STATE OF THE DOOR AT THIS TIP, FOR LCV-11 AND P6b · DOCS-ONLY (C-44.1) · 2026-09-22 IST
# Two paths, this file and its manifest. The chair reads from the repo after. Line numbers were derived by command from d465640 the minute this was
# written; re-derive before citing. Every byte a vendor reads below is quoted from doorLines.js with the first twelve characters of its pinned hash.

## 1 · WHAT THIS SEAT DID, IN ORDER (21 and 22 September 2026), each landed by the founder and walked live

  Part A (6456690) · F-44.110: an echoed book_event that repeats a new lead's client and date is dropped before the covered check; rung b94; C-44.12 born.
  Part B-1 r3 (14bc61d) · F-44.104, F-44.112: the door's own note of a DATE it asked for (B6, B7, B21, B26, B28); F-44.111 a two-digit year after a month
    name; rung b95. Its walk went red at step 1 and found F-44.114 and F-44.115.
  The B-1 fix r2 (7fa9dcd) · F-44.114 stray punctuation around a date; F-44.115 the restated job lapses the note (F-44.113 folded in); rung b96.
  B-2 first cut r2 (8dd2fc0) · the note of a NAME (B18, B35); B35 his; F-44.116 the echo; F-44.105's wording; the listener's no-name line; rung b97.
  B-2 second cut r4 (7f612ec) · B31, B33; the note of a PACKAGE (B24, B31); F-44.107 the lead before the package; F-44.108 sorted lists; F-44.117; rung b98.
  B-2 third cut r3 (fc96ab2) · B36 "Did you mean" in ONE home for leads and packages (R-44.40); F-44.118's floor under R-44.41; e-72; rung b99.
  The invoices cut (d465640) · binder names join the home; e-74; rung b100.
  Every cut's own handover, with its walk record written in by script from his export, is under docs/handovers/TDW_CE44_LCV10_*.md.

## 2 · THE STATE OF THE DOOR AT d465640 (src/lib/vendor/workingDoor.js unless said)

ONLY CODE SPEAKS IN THE WORKING ROOMS (R-44.37). The chain is not called on the pwa business room or the vendor WhatsApp lane unless admin_config
`vendor.working_chain_enabled` holds JSON true (laneFlags.readLaneFlag, 60 s cache; the row is ABSENT on production, witnessed by every fixture SELECT).
standIn() decides what is said when the door does not take a turn. COVERED: booking_confirmed, advance_paid, milestone_paid, invoice, lead, attach_package.
The Advisor room still reaches Victor. A PROSE INSTRUCTION IS NOT A MECHANISM: every line below that says "never" is code with a mutation that reddens.

THE BYTES, all his, hash-carried in doorLines.js (assertLineHashes runs at load; b90 1.2 pins the ruled set):
  B16 "Lead added: {client}." a7fe91f49891 · B17 "Lead added: {client} · {date}." b332f4de8e46 · B18 "Who is the lead? Say the name." f6d70e738f12
  B19 "That number is already on {client}. Nothing new was added." ec10d50e073b · B20 "Could not add the lead." fcfa046d1cf3
  B21 "That wedding date cannot be right. Say it like 5 December 2027." ceb7ebc7a3ef
  B22 "Package attached: {client} · {package} · Rs {total}." bbca851eb1d8 · B23 "You have no package called {name}. Yours are: {list}." 5c68d52e3101
  B24 "Two packages are called {name}: {name} (Rs {total}) · {name} (Rs {total}). Say which one." 85943481b649
  B25 "Could not attach the package. {client} has no wedding date yet. Add the date first." 54da33cf13d4 · B26 "When is the delivery date for {client}?" ddf2ed942fc9
  B27 "Package attached: {client} · {package} · Rs {total} · Delivery {date}." fcbbbddfd505 · B28 "That delivery date cannot be right. Say it like 5 December 2027." a2d7f31aa0ba
  B29 "This couple is booked. The package is fixed on their invoice." a3f8c714b924 · B30 "Could not attach the package." 5b79740334d8
  B31 "Which package? Yours are: {list}." b84530f75e25 (R-44.36) · B32 "Could not attach the package. No lead called {name}. Add the lead first." 136ff0b0c57e
  B33 "Set the fee first." 7f0c3cc35495 (F-44.102, REUSE of dreamos-pwa lib/worklist/packages.ts:116) · B34 "I cannot do that by message yet. Use the app for it." 3dc0787ed3e7
  B35 "Which client? Say the name." 7b73fec4bc3c (R-44.39) · B36 "Did you mean {name}? Reply YES or NO." 43b514de672b (R-44.40)
  {list} in B23 and B31 is her own live package names sorted case-folded (doorLines.sortedNames, F-44.108). B33 is spoken where attachPackage refuses no_fee.
  NOT WITNESSED LIVE at close: B33 (the founder never made the no-fee package), F-44.118's floor on a pasted-on name (the ear pasted none on the walk that carried it).

THE HOMES · where each byte is spoken, by the plan that speaks it:
  planLead (B16 to B21; F-44.100's net speaks B18 for an event-word name); planAttach (B22 to B31, B33 via fileAttach, B32 via the attach_no_lead exit and
  standIn; F-44.107: the LEAD IS RESOLVED BEFORE THE PACKAGE); planMoney/planBooking/planPayment (B1 to B8, D5, staged rows); planInvoice (B10 to B15);
  askName (B18 or B35, R-44.39: a request whose every act is covered with one nameless act is the door's, B18 first if a lead is nameless, one question at
  a time, ONE write at the end); offerFor (B36); standIn (B15, B32, B34, LEFTOVER, GLITCH).

THE NOTES (meta.listener.note on the door's own assistant row, read from the LAST assistant row of the working thread only, never by matching text;
lastDoorNote :623; validNote :260 takes a well-formed note or NOTHING; asked and asked_name stay as they were, pinned by b90 13.5 and b92 12.4):
  DATE notes, asked B6, B7, B21, B26, B28 (:226): her whole trimmed message is read by the door's own resolveSpokenDate in the act's direction FIRST,
    whatever the listener heard; a closed NO is B3; a closed YES is unreadable; unreadable is answered as any unreadable date ONCE (B7, or B21/B28 for a
    readable date the plans refuse) with tries 1, then B3; the note LAPSES and the message is handled fresh when the heard request holds an act of another
    kind, the noted act for a different client, or the noted act with a date of its own that is neither her whole message nor the note's carried date
    (F-44.115, F-44.116); a job handled fresh and refused again gets a NEW note at tries 0. A TURN THAT WROTE SOMETHING IS NEVER ANSWERED "Nothing was
    changed" (law for every note). THE NOTE NEVER WRITES MONEY: a money act it carries is planned afresh and STAGED, only her YES to B1 or B2 applies it;
    the money act an attach's B26 silences rides the note and is staged after the attach lands.
  NAME notes, asked B18, B35 (:235): her whole trimmed message IS the name, event words and all; lapses only on a heard act of a kind the note does not
    hold, or a noted kind with a NEW date (the note's carried date excepted, c-44.49); a heard act whose client is her whole message under key(), or any
    act on route 'search', is her answer heard as a lookup and does NOT lapse (F-44.117); a closed YES re-asks once then B3; B35's answer fills EVERY
    nameless act but `lead`.
  PACKAGE notes, asked B24, B31 (:239): a package by the door's key() fold first; the echo rule; a different kind or the attach restated with another
    package lapses; else B31 once more then B3.
  OFFER notes, asked B36 (:242): YES runs the act with the candidate's OWN row name and id through the same plans; NO is B3; another kind lapses; else
    re-asked once then B3.
  On every note: a live staged money row wins (a yes or a no belongs to the money question first); the turn that answers a note carries meta.listener.answered.

THE ONE HOME FOR NAMES (R-44.40): nearestName :203 over damerau1 :189. Rows from her live leads (leadsOf :218), her live packages (packagesOf) and her live
  binders (bindersOf :212, engine.records with hidden false); NEVER dates or amounts. THE PINNED DISTANCE over key()-folded strings: a Damerau distance of
  exactly 1 (one character inserted, deleted or replaced, or two adjacent swapped) or the same words reordered; strings under three characters never; two
  edits nothing; two rows equally close nothing; an exact match never a candidate. Offered at planMoney's B4, planAttach's noLead (before the B32 exit) and
  B23, planInvoice's noBinder (before the B15 exit); NEVER on a turn that began with a money row live (liveAtStart), never on a note turn; the candidate
  appears nowhere but the question. The resolvers themselves are still exact by key(); a misspelt name never matches on purpose (the founder was told).

THE FLOORS (in the ear branch, before askName): withoutEchoedEvents :170 (F-44.110, an echoed book_event dropped; the record keeps what was HEARD);
  F-44.118 :865 (R-44.41, a safety floor under money and NOT a cure for context): on a turn not answering a note, a heard client not present in her message
  under key() is UNSAID and B18 or B35 is asked; SCOPED to messages of two or more words, so the rungs' one-word placeholder drivers are untouched.
  The phone guard (F-44.96) holds at the name question too.

spokenDate.js: F-44.111 a two-digit year after a month name reads as the slash form reads it (YEAR :177); F-44.114 stray punctuation around a date does not
  count, STRAY_MARKS :109 a closed set stripped from both ends only, an apostrophe before a closing two-digit year reads, SPOKEN_MAX :110 (200 characters),
  a bare "'27" refused; a WORD is never stripped ("5th march 27, evening" stays refused).

listenerDoor.js: SYSTEM ends with two prose bytes, "A wedding date said with a new lead belongs to that lead ..." and "A job said without a name is still a
  job: record it, with client_as_spoken empty."; client_as_spoken's description carries F-44.105's wording. PROSE HELD NOWHERE LIVE: the ear still pasted
  the thread's last name onto a nameless job twice after the line went in. The code floors are the mechanism.

## 3 · THE RUNGS, AND WHAT EACH PINS (all green at d465640; the founder's floor "FLOOR = NAMED BASE, no delta" on every landing)
  b90 181 (the ruled bytes and hashes, the P5 door) · b92 172 (P6a, attach) · b93 125 (chain out, exits, the card of Part One) · b94 62 (F-44.110)
  b95 74 (the date note) · b96 96 (F-44.114/115, the punctuation table) · b97 59 (the name note) · b98 47 (the package note) · b99 56 (the home, F-44.118)
  b100 16 (invoices in the home). Every rung's driver is the REAL preTurn, standIn and persistDoorTurn on b93's in-memory database; the WhatsApp lane
  is driven whole with runTurn spied. On the source before each cut, each rung reads named FAILs and no crash (e-62's guard, J()).

## 4 · THE FOUNDER'S RULINGS OF THIS SEAT, VERBATIM WHERE HE SPOKE
  R-44.36 B31 · R-44.39 B35 ("Yes to your recomendation") · R-44.40: "system wide ( even for packages etc) can we have the code offer alternate closest
  choices? a Did you mean _______?", the byte "Did you mean {name}? Reply YES or NO." GREEN, his · R-44.41: "a refesh thread fixes this problem. and these
  are test conditions where 10 random commands are given to test the code. In real use case, such kind f rapid fire instructions will not be given. further,
  after every rapid fire 8 exchanges- the refresh thread can start glowing-encouraging the user to click it. wont that sort the problem rather than waste
  estates time and energy on a problem that may open another problem once solved?" and "ill go with your lean": the listener's carry is a disease of long
  threads; its cure is the fresh-thread button (F-44.44, LC-3's, the app-side cut at the end of LC-Victor, glowing after eight exchanges); no server packet;
  F-44.119 CLOSED as will-not-fix; F-44.118 kept as a floor under money only.
  F-44.117 (a bare name heard as a lookup is her answer), F-44.118 (a pasted-on name is unsaid), F-44.119 (the shortening, closed) as above.

## 5 · CRAFT FOR EVERY SEAT AFTER THIS ONE
  C-44.12: a cell for a sentence a walk record holds replays that record's HEARD request verbatim and names the record and turn; a tidier request beside
    it, never instead. CELLS COME FROM WHAT HE DID ON THE LAST WALK, not only the design's cases (e-68). Walk records are written into handovers BY SCRIPT
    from his export, never retyped, and a handover's prose never states a hearing the record does not hold (e-74).
  C-44.13: every new or edited bench runs on shifted clocks before delivery. THE METHOD: a four-line preload, `FAKE_NOW=<iso> node -r clock.js scripts/<bench>.js`,
    that replaces the global Date with a subclass whose no-argument constructor and whose now() answer the pinned instant (every Date built from a value is
    untouched, so fixtures keep their dates). Run at least the next day in IST, a day months ahead, across a year's end and a leap day. A cell that names
    "today" derives it as production derives it, on both sides of the turn (e-66); a cell's name never prints a reading (e-72).
  e-67's rule: the floor gets a turn of its own, started first, every call after a poll until the sentinel exists; build in one turn, floor in the next, attach
    in the one after. A ZIP is cut by its own command after the card is checked present (e-58, e-73); a ZIP name is never reused; the floored tree is the
    final tree (prose goes in before the floor). The differential runs in place with the sibling repo beside it (e-70), exit codes AND outputs diffed.
  His blocks are rehearsed from files holding their exact bytes at /workspaces/dream-os, block 1 falsified with a wrong ZIP, block 4 with the push swapped
    for a no-op and falsified with a stray file. Fresh walk names carry no word with a meaning of its own; a walk that must write nothing answers No.

## 6 · WHAT P6b INHERITS, AND WHAT IS OPEN
  P6b: relay and quote_send routed from the door. It inherits the door's shape above: a plan per act that returns {speak,key} or a write, the covered
  check, the notes (a new question of the door's should keep a note of its own kind, as B18/B35, B24/B31, B36 do), the home for any name it resolves,
  standIn for what the door cannot say, and the walk-card discipline. Nothing in the chain is touched by any of it.
  OPEN: B33 live; F-44.118's floor live on a pasted-on name; the fresh-thread button (LC-3, app-side, R-44.41); "Did you mean" for team names when team
  resolution enters the door; the placeholder drivers ('x') of the older rungs if any future floor must read the whole message.
  Next free: finding F-44.120, migration 0171, bench b101, errors e-75. Fixture DEV440; 9888294440 signature; 8595356978 prestige; every row a test record.

## 7 · THIS SEAT'S ERRORS, e-58 TO e-74, WITH THEIR CAUSES (e-58 to e-60 are LCV-9's, carried on this seat's kickoff)
  e-61 a background job tied to the tool call that started it · e-62 a cell that assumed the green shape of the turn before it · e-63 a replacement string
  holding dollar-backtick · e-64 a cell written from expectation, not the ruling · e-65 built before saying the room in one line · e-66 a literal date for
  "today" (C-44.13 born) · e-67 three floors lost to a spent budget (the floor's own turn) · e-68 cells from the design's cases, not his last walk ·
  e-69 a literal future year, caught by C-44.13 before any cut · e-70 the base run in a place not shaped like the delivery's · e-71 a card expectation written
  from a fixture's shape without reading its basis · e-72 a timing printed in a cell's name · e-73 a ZIP line chained after a card writer that could fail ·
  e-74 an inferred hearing written into a handover's prose as settled.

---
A PROSE INSTRUCTION IS NOT A MECHANISM. Trust evidence over narrative, including this file. LCV-10 releases the slot at d4656402a5a599c46cf8c35cfdb8cbf544e8f437.
