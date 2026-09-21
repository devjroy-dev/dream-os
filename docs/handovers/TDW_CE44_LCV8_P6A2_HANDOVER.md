# repo: dream-os @ 6adf9ae47306c81249a22b50ebfd85f51d334ae6 · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307 (untouched)
# TDW · CE-44 · SEAT LCV-8 · LC-VICTOR P6a-2, THE ATTACH HALF, WITH F-44.100 RIDING · HANDOVER · 2026-09-21 IST
# The door learns `attach_package`. W-1 NONE. NO migration (0171 and b93 stay free). Seven paths, every one in
# scripts/floor-manifest-ce44-lcv8-p6a2.txt. Line numbers below were derived by command from the delivered tree at
# the moment this file was written; re-derive before citing.

## 1 · WHAT THIS CUT IS

P6a-2 closes P6a: the door attaches a package by speech, at once (R-44.33), and asks for the delivery date of a
handover package (R-44.34 (b), R-44.35). F-44.100 rides it: on the founder's walk of 21 September his own approved
example, "Add a new lead, haldi shoot on 3 January", filed a lead NAMED "haldi shoot" (it stays; R-43.18).

## 2 · HIS BYTES AND THEIR PROVENANCE (src/lib/vendor/doorLines.js from :73)

  B22  Package attached: {client} · {package} · Rs {total}.
  B23  You have no package called {name}. Yours are: {list}.
  B24  Two packages are called {name}: {name} (Rs {total}) · {name} (Rs {total}). Say which one.
  B25  Could not attach the package. {client} has no wedding date yet. Add the date first.
  B26  When is the delivery date for {client}?
  B27  Package attached: {client} · {package} · Rs {total} · Delivery {date}.
  B28  That delivery date cannot be right. Say it like 5 December 2027.
  B29  This couple is booked. The package is fixed on their invoice.
  B30  Could not attach the package.
B22 to B28: his at R-44.34 and R-44.35, carried from TDW_CE44_LCV6_SEAT_CLOSE.md §4 and checked against it BY
COMMAND, byte for byte (b92 11.2 pins that). B28's provenance is carried unchanged, in the chair's terms: "proposed
by the chair as B21's twin 'in whichever word he picked'; he answered B and changed nothing; recorded as his on that
basis; he may still reword it." B29 is R-44.12's sentence, REUSE: bytes identical to dreamos-pwa
lib/worklist/packages.ts:126 (refusals.already_booked). B30 is REUSE by the chair's ruling of 21 September: bytes
identical to the same file's :73 (attachFailed), whose header records his veto of 2026-09-17. Both twins were
compared by command in this seat's container, where the pwa clone sits beside dream-os; on his machine no sibling
exists, so each pin is the hash literal and the twin is named in a comment. B24 and B23 have builders
(twoPackages :233, noSuchPackage :246), by position as B8 is. NOTHING a vendor reads was minted by this
seat or the chair.
WITH THE FOUNDER, NOT BUILT: B31, the chair's proposed question for an attach naming no package ("Which package?
Yours are: {list}."), and B32, its proposed refusal for an attach naming no lead ("Could not attach the package. No
lead called {name}. Add the lead first."). Their keys are free (b92 11.3). Their places are marked in
workingDoor.js's planAttach by comment. UNTIL HIS WORD: both cases send the WHOLE message to the chain before any
write; after a write in the same turn the door speaks B30 and asks nothing.

## 3 · c-44.44, AND THE LISTENER'S TWO PROMPT BYTES (src/lib/vendor/listenerDoor.js)

The accepted design resolved a package by name, and the listener had no slot to hear one: EAR_TOOL's act held six
keys and normaliseRequest dropped the rest. This seat raised it before building; the chair verified it and owned it
as c-44.44, with a standing check: before a design for any act is accepted, every slot the door reads for it is
checked against EAR_TOOL (b92 13.4 holds that for today's slots).
  · package_as_spoken (:61), OPTIONAL, "The package exactly as she named it. Empty if none."; normaliseRequest
    carries it trimmed, a string or absent (:92). `required` is still `act` alone.
  · client_as_spoken's description (:59) now says it is the NAME of a person, a couple or a family; that a kind
    of event or shoot is NEVER a client; that her answer to the door's question about who the lead is IS the name,
    whatever the word (the chair's sentence, for the hole in §4); and that it is EMPTY when no name was said.
THE KICKOFF SAID b86 PINS THAT DESCRIPTION. IT DOES NOT: b86's EAR_TOOL cells (:129 to :140) pin no advice word, the
route enum, the amount's minimum and that date_as_spoken exists; b90 :713 pins date_as_spoken's description alone.
The chair accepted this. b86 is NOT edited; the new pin is b92 13.1 with mutation 20.4. The differential shows b86's
output byte-identical with the new property present.
THE MODEL'S HALF IS UNPROVEN HERE. No provider key is in this seat's container or his Codespace. Whether the live
listener fills package_as_spoken, leaves the client empty for "haldi shoot", and carries B18's and B26's threads is
proven ONLY by the walk card's steps on live keys. The bench proves the door's half with a scripted listener.

## 4 · F-44.100 (src/lib/vendor/workingDoor.js)

  · THE NET: EVENT_WORDS (:243), closed and lower-case, and eventOnly (:246). A client_as_spoken whose every
    word is in the list is NO NAME and planLead asks B18 (:266). Words are split on anything that is not a
    letter or digit IN ANY SCRIPT, so a Devanagari name is a name and "haldi शर्मा" is a name; an empty split is no
    verdict. The list: haldi, mehendi, mehndi, mehandi, sangeet, shoot, photoshoot, wedding, shaadi, reception,
    engagement, roka, cocktail, pre, prewedding, ceremony, function, event, party, baraat, pheras, phera, and the
    fillers a, an, the, new, lead, and, for, of. "Khanna wedding" and "Sangeet Sharma" are names.
  · THE ONE EXCEPTION, so it cannot loop: lastWasDoorNameQuestion (:446) reads the LAST assistant row of the working
    thread for the door's OWN mark, meta.listener.asked_name === 'B18', written by persistDoorTurn on a NEW line
    (:721). `asked` stays B1 or B2 alone, so b90 13.5's regex and the anchor beside it are byte-identical. The
    thread is read only when a lead act's name is event words and nothing else (:565). Never by matching text
    (b92 12.7).
  · The net is for `lead` ONLY (b92 12.9).
  · THE HOLE IT CANNOT CLOSE, RAISED AND RULED: told an event is never a client, the live listener may return NO
    name when she answers B18 with "Sangeet", and the door would ask B18 again. This seat does not make a name out
    of her raw message (the chair: "RIGHT and stands"). The description carries the chair's sentence; the walk
    carries the specimen, B18 then "Sangeet". IF IT LOOPS LIVE THAT IS F-44.101, ALLOCATED, and the chair rules the
    cure then.

## 5 · THE ATTACH AS BUILT (src/lib/vendor/workingDoor.js)

  · COVERED at six (:65). HANDS' new last entry is attach_package: 'attach_package' (:74); no donna_ name
    invented; handResult.js NOT edited. attachPackage is called AS IT STANDS through a lazy seam (:84).
  · THE RESOLVER, inside the file: packagesOf (:318) reads public.vendor_packages where vendor_id is hers and
    deleted_at is null; planAttach (:323) matches `name` by the door's own key() fold. One attaches; two is B24
    with each row's own name and total; none is B23 with HER OWN live names; three of one name, a failed read, or
    no usable name for the list is not the door's to say. Never fuzzy, never nearest (b92 14.8, mutation 20.6).
  · The lead is resolved as the money acts resolve theirs (lifecycleHands.resolveLead). Two of one name reuse B8.
  · THE BODY is EXACTLY { package_id }, or { package_id, delivery_on } for a handover package (b92 14.5, 15.3).
  · FOR A HANDOVER PACKAGE THE LEAD'S OWN ROW IS READ BEFORE B26 IS ASKED (accepted by the chair): booked is B29, no
    day-precision wedding date is B25, MIRRORING leadPackages.js :127 and packageSchedule.js :78 to :79. b92 15.10
    pins the mirror against attachPackage's own answer on the same rows. For every other package attachPackage
    itself answers: already_booked is B29, no_wedding_date B25, no_handover_date B26, anything else B30.
  · THE DELIVERY DATE: resolved 'future'; reason 'year', a day before today in IST, or a year outside today's IST
    year through plus five is B28; unreadable is B7; none said, or a day EQUAL to the wedding date, asks B26; on a
    package that is not handover a spoken date is IGNORED; a date after (or before) the wedding is PASSED, as the
    app's sheet passes it (F-44.94 is LC-3's). B21 is never spoken for a delivery date. THE SPECIMEN, his own
    "15 March 0227", is b92 15.5's first assertion, before any edge.
  · THE READ-BACK IS FROM THE ROW attachPackage returned (fileAttach :377): snapshot.name, total, delivery_on; the
    row's own snapshot.delivery_basis decides B22 against B27 (b92 14.18, 14.19). A row that landed and cannot be
    read back is never spoken as B30: no line, and the turn's fallback becomes the founder's vetoed glitch line.
  · ORDER in preTurn: every act is PROBED read-only first (:574); an attach the door cannot say, or one naming no
    lead that this same message does not itself file, sends the WHOLE message to the chain before anything is
    written. Then the writes: leads, then attaches with each plan REBUILT on the rows as they then stand (:598),
    then invoices, then the ONE money act, ITS PLAN REBUILT TOO (:628): the probe's plan is never spoken or staged
    when the door filed a lead or handled an attach. An attach that did not land, for any reason (B23, B24, B8, B25,
    B26, B28, B29, B7, B30), means NO B2 and NO staged row; the money act is not answered in that turn, because the
    attach's own line says what is needed first.
  · A CHANGE TO P6a-1's BEHAVIOUR, DISCLOSED: because the money plan is now rebuilt after the lead pass, "add a lead
    for X, the booking is confirmed" speaks "Lead added: X." and B5 (no package yet) where P6a-1 spoke "Lead added"
    beside B4's "No lead called X". No P6a-1 cell held the old pair; b92 16.8 pins the new one.
  · A SECOND ATTACH ON A LEAD is the app's "Change package": attachPackage retires the live row and inserts a new one
    (b92 14.22). The door adds no rule the estate does not have.
  · B26, B24 and B8 turns set skipHarvest, as B18 and B8 do in P6a-1: the door asked a question. This seat's choice
    for B26 and B24; say if it should not stand.
  · Door turns carry NO chips on either lane (b92 §17).

## 6 · THE BENCHES

b92, EXTENDED IN PLACE: 172 cells, exit 0 (base 75). §11 the bytes; §12 F-44.100; §13 the listener's prompt bytes;
§14 the attach through the REAL attachPackage and the REAL resolveLead on whole-column doubles (public.vendor_packages
16 columns, public.lead_packages 13, public.leads 29, from docs/db/PUBLIC_SCHEMA.md), with another vendor's package
of the same name and a retired package planted; §15 the delivery date; §16 the order and the one-message flow; §17
no chip, both lanes; §18 W-1 from this packet's own manifest; §19 500 hostile calls, the act itself hostile, zero
throws; §20 twenty mutation cells. Re-pinned in place, each labelled: 1.2 (it asserted B22 to B29 absent), 4.5 (it
asserted attach_package uncovered; it now holds `relay` uncovered), and M9's anchor (planLead's call gained an
argument). EVERY SENTENCE ON THE WALK CARD IS A CELL, his own first (12.1, 12.10, 14.3, 14.7, 14.10, 14.11, 15.1,
15.3, 15.4, 16.1, 17.2). attachPackage reads the real clock for its schedule's due dates; no cell reads those.
ONE MUTATION CELL IS A CONTROL AND SAYS SO: 20.15a removes the probe's no-lead line ALONE and the turn still goes
to the chain, because the rebuild holds a second guard; 20.15 removes both and reddens. The new b92 on the
untouched base exits 2 (it cannot run past §11).
b90's re-pins: 1.2's RULED and HASHES gain B22 to B30; 4.1's imageOk gains exactly 'attach_package', FORBIDDEN
unchanged; 4.2 at six; M5's anchor re-aimed on HANDS' new last entry (b92 20.19 asserts the anchor). b90: 174 pass,
exit 0 (base 165; the nine new are 1.1's cells for B22 to B30).
THE DIFFERENTIAL, five benches, base against delivery after `npm ci` and `npm run build` in the base and the same
install in the delivery copy: b86, b88 and b80 byte-identical; b90 differs in exactly 1.1 (nine new lines), 4.1's
and 4.2's names, and the total; b92's old cells differ in exactly 1.2's and 4.5's names. Before the re-pins the
reds were exactly b92 1.2, 4.5 and M9's anchor, and b90 1.2, 4.1, 4.2 and M5's anchor, whose throw ended b90 early.

## 7 · OPEN, AND WHERE EACH SITS

  · B31 and B32: with the founder. When his word comes back verbatim they enter doorLines.js, b90 1.2 and b92 §11,
    and planAttach's two marked places speak them; 14.15 and 14.16 are then re-pinned.
  · F-44.101 (allocated by the chair, conditional): B18 looping live on an event-word name.
  · F-44.96 stands as LCV-7 left it: the listener hears no phone; the guard stays.
  · PROPOSED TO THE CHAIR, not allocated: (a) a money act beside an attach that did not land is not answered in that
    turn (this seat's reading of "asks NO B2 and stages NO row"; §5); (b) an attach naming a package with no fee
    speaks B30, where the app says "Set the fee first." (pwa refusals.no_fee); the door has no byte for it.
  · BOUNDARY, as LCV-7's for a lead: if attachPackage's response is lost after its insert landed the door says B30
    though the package is attached. She sees it on the lead; a second attach is a harmless re-attach. No re-read built.
  · UNTIL THE CHAIN LEAVES, as he accepted it: a message carrying an act the door does not cover goes WHOLE to the
    chain, Victor and Donna, who may move money without the door's confirmation and may say "Done" over work that
    did not happen.
  · Next free: finding F-44.102, migration 0171, bench b93. Errors continue from e-53.

## 8 · THIS SEAT'S ERRORS, WITH THEIR CAUSES

  e-51 · the baseline's first install was started detached without its own session and died with the tool call; two
    polls were spent on a process that no longer existed. Cause: e-47's lesson read and not applied; the count of
    live processes was not checked at the first poll.
  e-52 · two mutation cells were written from intent and reddened on their first run: 20.6's "nearest" match caught
    two packages and spoke B24, and 20.15 removed one guard where two hold the cell. Cause: a mutation's effect
    predicted in the head, not run. Both corrected before anything left the room; 20.15a now records the second guard.

---
A PROSE INSTRUCTION IS NOT A MECHANISM. Trust evidence over narrative, including this file.
