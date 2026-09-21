# repo: dream-os @ 10d5d9911a3993fad01aad70284b59ffc6b99d3b · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307 (untouched)
# TDW · CE-44 · SEAT LCV-9 · PART ONE: THE CHAIN LEAVES THE WORKING ROOMS · HANDOVER · 2026-09-21 IST
# W-1 NONE. NO migration (0171 stays free). Bench b93 is taken; b94 is the next free. Sixteen paths, every one in
# scripts/floor-manifest-ce44-lcv9-part1.txt. Line numbers below were derived by command from the delivered tree at the
# moment this file was written; re-derive before citing.

## 1 · WHAT THIS CUT IS, AND WHOSE WORD IT STANDS ON

On the P6a-2 walk of 21 September three of the founder's messages fell to Victor's chain, and the chain answered in the
door's own sentences with no tool call, claiming an attach, a booking and an invoice that did not exist (F-44.103).
R-44.37, THE FOUNDER, verbatim, 21 September 2026: "listen- theres no point in waiting for victor ( stop gap
arrangement)---why dont we shift victor out and then allow the code to work. faster and more efficient that way".
From this cut, in the business room on the pwa and on the vendor WhatsApp lane, ONLY CODE SPEAKS. R-44.18's fork (b) and
R-44.21 (a) are superseded. The Advisor room, Consult, the relay seat's drafting model and Eliza's onboarding are not
touched, and the engine's machinery is not deleted.
R-44.38, as the chair recorded it. THE CHAIR'S PROPOSAL CAME FIRST, a byte for an act heard that the door does not cover:
"I cannot do that by message yet. Use the app for it." THE FOUNDER, verbatim, 2026-09-21: ""I cannot do that by message
yet. Use the app for it."-yes". It is B34, his.
PART TWO IS NOT IN THIS CUT: the door's own note for B18, B24, B26 and B31 (F-44.104), B31 and B33, the lead resolved
before the package (F-44.107), F-44.105's description, F-44.108's sorted list, and the P6a-2 handover's addendum. A fresh
seat or this one takes it on its own kickoff.

## 2 · HIS BYTES IN THIS CUT (src/lib/vendor/doorLines.js)

  B15  Could not make the invoice. No client called {name}.                        (:66)   R-44.27, his; verbatim from
       TDW_CE44_LCV3_SEAT_CLOSE.md :77. "Owed by the last packet" meant the packet in which the chain leaves (the
       chair's ruling). F-44.57's ruling is fully superseded. NO-HITS BRANCH ONLY.
  B32  Could not attach the package. No lead called {name}. Add the lead first.   (:104)  R-44.36, his ("yes to your
       open earlirr questions").
  B34  I cannot do that by message yet. Use the app for it.                       (:107)  R-44.38, above.
Each is hash-carried (LINE_HASHES :153, :169, :170) and pinned as a literal in b90 1.1 and b93 1.1. B31, B33 and B35
are FREE (b93 1.2): B31 and B33 are Part Two's; B35, "Which client? Say the name.", is the chair's proposal and HIS WORD
IS PENDING. NOTHING a vendor reads was minted by this seat or the chair.
THE LEFTOVER LINE AND ITS EXAMPLES ARE NOW LIVE. EXAMPLE_ACTS (:133) carries example → act by position; leftover() (:290)
is the ONE builder: his line, then TWO different examples drawn at random from those whose act the door COVERS, each on
its own line, nothing else (the chair's ruling on the shape). Today that is four of his twelve: "The Sharma booking is
confirmed", "The advance came in today for the Kapoor booking", "Raise the invoice for the Bose wedding", "Add a new
lead, haldi shoot on 3 January". A later packet switches an example on by covering its act; it edits nothing here.
attach_package has no example until he approves one. The fourth example leads her to B18 since F-44.100; the chair
accepted that and told him the wording is his to change.

## 3 · THE SEAM AS BUILT

preTurn() IS UNCHANGED IN WHAT IT DECIDES. It still answers { door: false, why } on its FOURTEEN exits (thirteen reasons;
attach_unsayable has two sites), so every existing cell on it stands. Three exits now also carry what they know, in a
field the chain never reads: attach_no_lead the name (:589), invoice_unresolved the name when no binder matched (:593;
planInvoice returns { noBinder, name } at :236 and still null for a failed read), money_unsayable the act (:596).
standIn() (src/lib/vendor/workingDoor.js :713) is the ONE place the switch and the leftover builder are read. It returns
null ONLY when the switch reads JSON true; otherwise a door answer chosen by standKey() (:692) from the verdict's reason
and the listener's request, NEVER from her text:
  · yes_no_nothing_waiting; a request holding no act ............................ LEFTOVER with two covered examples
  · a request holding ANY act outside COVERED, a mixed message included; lead_phone ................................ B34
  · every act covered but one names no client .................... LEFTOVER (until B35 is his; then it marks as B18 does)
  · attach_no_lead B32 · invoice_unresolved with no binder B15 · attach_unsayable B30 · money_unsayable F29 or D8
  · no_input, no_lane, no_seat, no_request, empty, exception, a failed invoice read, anything unknown .. the glitch line,
    STAGE2_LINE_MUTATION, read from its one home, which is now spoken for a real glitch and nothing else.
A stand-in turn WRITES NOTHING, carries no tool name (no chip), sets skipHarvest, and is persisted by persistDoorTurn as
one door turn, counted once. The lane of the message is in the door's own note (meta.listener.lane; e-55).
THE LANES: doorTurn in chat.js hands the verdict to standIn once (:3552), after its Advisor return, which stays its first
line; a preTurn throw no longer returns null (:3546). The two routes' branches (:3642 and :3796) are byte-identical to 10d5d99, eight lines lower.
vendorInbound.js hands it once (:1767) before its door branch. If even standIn is unreachable each lane speaks the glitch
line and THE CHAIN IS NOT CALLED (on WhatsApp, if that line cannot be loaded either, nothing is sent and the lane returns,
:1771). The stage-2 retry (the second runTurn in vendorInbound.js) is downstream of the first call and is not edited.
THE SWITCH: admin_config key `vendor.working_chain_enabled`, in the LANE_FLAGS census of src/lib/laneFlags.js, default
false, read through the existing readLaneFlag: 60-second in-process cache, ONE read per process per minute (b93 4.9).
ONLY JSON true puts the chain back, and the lanes then behave as at 10d5d99. An absent key, a junk value, a read that
throws, a read that errors and no database handle are ALL chain out. A flip lands within 60 seconds with no deploy.
TO REVERSE WITHOUT A DEPLOY the founder would set that key's value to the text true; the statement is NOT given here
(C-44.10) and comes to the chair if it is ever needed.

## 4 · WHAT R-44.37 COSTS UNTIL LATER PACKETS, SAID PLAINLY

  · Every job the door has not learned (calendar, crew, find, what's due, notes, quotes, relay) now reads B34.
  · RELAY ON WHATSAPP: pendingRelay is built in vendorInbound.js and handed only to runTurn, so with the chain out an open
    draft's approval has no reader on that lane and "Send a message to my client" speaks B34, until P6b routes relay
    from the door. The relay seat's own code is untouched. The founder has been told (the chair's ruling).
  · A LEAD WITH A PHONE NUMBER reads B34 and is NOT filed: until the listener hears a phone, a lead with a number is added
    in the app. LCV-7's "owed before the chain leaves" is superseded; phone_as_spoken is owed by a later packet.
  · A covered act naming no client reads LEFTOVER until B35 is his.

## 5 · THE MEDIA READ (the chair asked for it before the build; accepted)

Vendor media never reaches the door with an empty body. An onboarded vendor's Twilio media goes to the image throttle
(vendorInbound.js :312) and then the calendar OCR (:333), every ending of which returns; media with no text is answered
at :494 by the fixed "please type your message" line, which returns. A Vision throw with a caption falls through with the
caption as ordinary text. On Meta, media arrives with mediaUrl null, a gap the file's header already declares. No
receipt, voice, document or location path exists between :500 and :1760. NO MEDIA TURN DEPENDS ON THE CHAIN.
F-44.109 (allocated and verified by the chair): the OCR preview tells her to reply "save all" (:460), and the hand that
would act on it, commit_event_proposals, exists in three files under src/agent and in none under src/engine/src, so the
chain never had a hand for it and improvised; after this cut that reply meets LEFTOVER or B34. Filed to P7. Not this cut's.

## 6 · THE BENCHES

b93 (scripts/b93_lcv9_chain_out_bench.js, NEW): 126 cells, exit 0; on the untouched base it exits 2. §1 the three bytes,
hash literals. §2 the example table and the builder: 2000 draws, always two different examples from the four, all six
pairs seen. §3 every exit through the REAL preTurn then standIn, each speaking its ruled byte and writing nothing; over
all 20 acts the listener can name, an uncovered act alone or beside a covered one is ALWAYS B34 and never LEFTOVER, and
B34 is never spoken when no act was heard. §4 the switch: absent, nine junk values, a throwing read, an erroring read, no
handle, a throwing reader, all chain out; JSON true alone is chain in; fifty turns cost one read. §5 THE REAL
processVendorInbound with runTurn SPIED: zero turns on every exit in all three chain-out positions, one line sent, the
ruled byte, no media, persisted once; chain in is measured AGAINST THE SAME LANE WITH THIS CUT'S BLOCK REMOVED, turn for
turn and line for line (the old lane's own stage-2 retry may call the chain twice; that is 10d5d99's behaviour, not
this cut's). §6 THE REAL chat.js POST handler, JSON and SSE, with engine/dist/core/loop's runTurn spied: the same; THE
ADVISOR ROOM REACHES THE CHAIN IN BOTH POSITIONS. 5.6 and 6.7 pin the EXACT BYTES of one leftover reply under a fixed
seed on both lanes (the chair's ruling on the layout). §7 persisted as one door turn, one counted usage row, the lane in
the note, no question mark. §8 the one-read pins and W-1 from this manifest. §9 4800 hostile calls, the verdict itself
hostile, zero throws. §10 SIXTEEN mutation cells over fifteen mutations (the pwa one runs on both routes) plus two
anchor-presence cells; each restored chain call reddens. §11 the walk card's own words, fourteen cells, one thread, the
real WhatsApp lane, including 21 September's three specimens now answered by code.
RE-PINS, each labelled at its site with R-44.37 and the chair's ruling:
  · b90: 1.2 (RULED and HASHES gain B15, B32, B34); 1.5 REVERSED (it asserted nothing read the leftover line; it now
    pins exactly one read); 13.3 and 13.4 REVERSED (a yes with nothing waiting reached the chain; it now reads LEFTOVER
    with runTurn at zero, the line pinned too). 174 to 177 pass (the three new are 1.1's cells for the three bytes).
  · b92: 1.2 (B15 free → B15 minted, with its hash); 11.3 (B31 and B32 free → B32 his and spoken only through standIn,
    B31 still free); N15a and N15's anchor re-aimed on the same line's new bytes. 172 pass, unchanged.
  · SIX OLD LANE BENCHES, PLANTED, NO ASSERTION CHANGED: b0498_fresh_crew_rider, b05_f0555_media_dedupe,
    b05_m2_vendor_inbound, b06_m3, b80_lc1b_door_strings carry plantChainIn(), which answers the ONE key as JSON true
    in the bench's own admin_config double and passes every other admin_config read to the double as before;
    b06_relay_hand §13.11 carries the key as a real row in its own world. They test machinery that STAYS (the chair's
    ground). After planting, each one's output is BYTE-IDENTICAL to base; b05_f0555 is back to its one base red.
THE DIFFERENTIAL: the 66 benches that read chat.js, vendorInbound.js or a door file, plus b61_switchboard and
tdw10_billing, which read laneFlags.js, in a base copy and a delivery copy after `npm ci` and `npm run build` in each.
Base: 58 of the 66 exit 0; seven of the eight non-zero are named in scripts/floor-base.txt and b06_gauntlet refuses for an
absent key. Reds before re-pinning were exactly the eight benches above; no chat.js route driver reddened (none runs the
handler). After re-pinning, the only outputs that differ from base are b90 and b92 in the cells named, and b05_arc_m1,
b07_p5 and b61 in file paths or timestamps alone. No dirt outside the manifest after either run.
CRAFT, FROM e-56: DIFF THE OUTPUT, NOT ONLY THE EXIT CODE. The first plant left two benches green by exit code and wrong
in their logs; only the output diff showed it.

## 7 · OPEN, AND WHERE EACH SITS

  · PART TWO, whole (§1).
  · B35: with the founder. When it is his, standKey's covered-no-client branch speaks it, it marks the thread as B18 does,
    and b93 3.1's and 11.9's specimens are re-pinned.
  · F-44.109: P7. F-44.101, F-44.106: open, no cure here. F-44.96: the guard stays; its exit now reads B34.
  · handResult.js DOOR_LINE_KEYS stops at B14 and D1 (no production reader; b90 alone reads isDoorLineKey). Observed, not
    touched, not a candidate unless the chair says so.
  · Next free: finding F-44.110, migration 0171, bench b94. Errors continue from e-59.

## 8 · THIS SEAT'S ERRORS, WITH THEIR CAUSES

  e-56 · the first plant answered EVERY admin_config read, not only the switch, and swallowed the meter's `.in()` read in
    b0498 and b80. Exit codes were green; the differential's log lines caught it. Cause: a plant shaped for the one call
    in mind, not for every call its table receives (C-44.3's class).
  e-57 · the status message said "seventeen mutation cells"; the count was a grep of §10's PASS lines, which included two
    anchor-presence cells. It was fifteen then and is sixteen now. Cause: a count read off a section, not off the cells
    of the kind being counted.
  e-58 · the first ZIP (TDW_CE44_LCV9_PART1.zip, sha256 21b5cd8a7b59…, never sent) was cut before the card was written; two
    of the card's SAY lines ("Yes", and the attach that lands) had no cell in §11's thread. The cells were added and the
    cut re-made as TDW_CE44_LCV9_PART1_r2.zip. Cause: the ZIP cut before the card it must hold; the card comes first.

---
A PROSE INSTRUCTION IS NOT A MECHANISM. Trust evidence over narrative, including this file.
