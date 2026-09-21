# repo: dream-os @ c96587dd379499a4757c8e4ccb35d5cdfa6e9568 · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307 (untouched)
# TDW · CE-44 · SEAT LCV-7 · LC-VICTOR P6a-1, THE LEAD HALF · HANDOVER · 2026-09-21 IST
# The door learns `lead`. W-1 NONE. NO migration (0171 and b93 stay free). Seven paths, every one in
# scripts/floor-manifest-ce44-lcv7-p6a1.txt. Line numbers below were derived from the delivered tree at the
# moment this file was written; re-derive before citing.

## 1 · WHAT THIS CUT IS, AND WHY IT IS HALF OF P6a

P6a was split by the chair's ruling of 21 September ("IF, WITH THAT LADDER, YOUR ROOM STILL WILL NOT HOLD THE
WHOLE OF P6a, DO NOT CLOSE: BUILD THE LEAD HALF FIRST AS ITS OWN CUT, P6a-1"). P6a-1 teaches the door `lead`.
P6a-2 teaches it `attach_package`, B22 to B29 and the delivery date, by this seat or a fresh one.

## 2 · HIS BYTES AND THEIR PROVENANCE

  B16  Lead added: {client}.
  B17  Lead added: {client} · {date}.
  B18  Who is the lead? Say the name.
  B19  That number is already on {client}. Nothing new was added.
  B20  Could not add the lead.
  B21  That wedding date cannot be right. Say it like 5 December 2027.
All six his at R-44.34 ("yes to all", 21 September), carried verbatim from TDW_CE44_LCV6_SEAT_CLOSE.md §4
into src/lib/vendor/doorLines.js from :60, hash-carried, ONE home. B15's key stays free (owed by the last
packet). NOTHING a vendor reads was minted by this seat or the chair.
FOR P6a-2, carried unchanged: B22 to B28 as the seat close §4 has them, and B28's provenance in the chair's
terms: "proposed by the chair as B21's twin 'in whichever word he picked'; he answered B and changed nothing;
recorded as his on that basis; he may still reword it."
FOR P6a-2, the chair's ruling on gap 2: R-44.12's "This couple is booked. The package is fixed on their
invoice." enters doorLines.js as key B29, bytes IDENTICAL to dreamos-pwa lib/worklist/packages.ts:126
(already_booked). REUSE, NOT A NEW VETO. b90 1.2's RULED gains it in P6a-2's cut. Its twin in the pwa cannot
be read by a dream-os bench on his machine (no sibling there), so the pin is the hash literal and the twin is
named in a comment, not tested.

## 3 · THE DESIGN AS BUILT (src/lib/vendor/workingDoor.js)

  · COVERED at five (:52): booking_confirmed, advance_paid, milestone_paid, invoice, lead.
  · HANDS gains `lead: 'donna_lead'` as its last entry (:60). The recorded tool call keeps the name donna_lead,
    the P6a read-first's §1.2, ruled by the chair; handResult.js's donna_lead codes (:55 there) already hold
    lead_created, unchanged and refused:write_failed, which is what the door records. handResult.js is NOT edited.
  · createLead is called AS IT STANDS, through a lazy seam (:69) the bench can fill; no new writer.
  · allCovered's lead exception is a branch ABOVE the untouched return (:84; the return at :87 is
    byte-identical, so b90 11.2's anchor holds): a lead may name no one; every other act beside it still needs
    its client.
  · planLead resolves read-only: no name is B18; no date files a dateless lead; a date goes through
    resolveSpokenDate direction 'future'; reason 'year' is B21 (F-44.98), any other refusal is B7; the year is
    then parsed STRICTLY from /^(\d{4})-\d{2}-\d{2}$/ and a date that does not match is B21, never passable;
    strictly before today in IST, or a year outside today's IST year through today's plus five, is B21 (F-44.66).
    TOTAL since r3 (the chair's ruling on r2): a non-object act, or one whose reads throw, answers B20.
  · fileLead: source by lane, 'self' on the pwa and 'whatsapp' on WhatsApp (:256; 'self' is what the
    app's own add route writes, src/api/vendor/leads.js:337; public.leads.source has no CHECK).
    wedding_date_precision 'day' ONLY beside a resolved date, nothing otherwise (the chair's ruling, from
    leads.js :335 to :339). Every name and date she reads comes from the ROW createLead returned (:259): B19's
    {client} above all is the lead that holds the number, pinned against the spoken name. A return that is not
    ok, or whose row carries no name, is B20. TOTAL since r3: anything thrown, createLead's own throw included,
    answers B20 and is recorded refused:exception (a donna_lead code handResult.js already holds).
  · ORDER in preTurn: every act resolved read-only first (leads :418, then invoices, then the money plan); only
    then the writes, leads first (:427), then invoices, then the ONE money act. An act the door cannot say sends
    the WHOLE message to the chain before anything is written. `st.wrote` is set before fileLead is called, so
    any throw after that point is the door's to the end, with B20 as the fallback.
  · THE PHONE GUARD (:412, F-44.96, the chair's ruling): a lead message carrying a phone-shaped number
    (PHONE_RE :96, phoneShaped :97) is NOT the door's; the WHOLE message goes to the chain, which files the
    number as today. Phone-shaped: ten digits beginning 6 to 9, optionally after +91, 91 or 0, whole or in the
    groups 5 5, 3 3 4 or 4 3 3 with one space or hyphen, not touching a letter, digit or '/'. It does not trip
    on a date, a year, an Indian-grouped amount or an invoice number (b92 §3).
  · A B18 turn sets skipHarvest, as P5 does for B8: RATIFIED by the chair (ruling 3, 21 September). The door
    asked WHO; harvest must not patch "3 January" onto some other open draft from a message that named no one.
    Harvest never INSERTS a lead, so no turn can file a second lead: pinned by b92 5.19 on harvest.js's source,
    with its control (harvest does read public.leads at :341 and update it at :423).
  · Door turns carry NO chips (R-44.21 (a)); pinned for a door-filed lead on both lanes (b92 §7). The pwa keeps
    the done event's tool names in useChat.ts's lastToolCalls, which nothing in the pwa reads.

## 4 · F-44.64 (src/lib/vendor/spokenDate.js :108)

resolveSpokenDate accepts exactly 'past' or 'future'; ABSENT is 'future', F-44.46's default as the file's
header has always said; present and anything else (null, 'Past', 'backward', a number, an object) is refused to
B7. The guard is a NEW line above :109, which is left byte-identical, so b90 11.8's mutation anchor did NOT move
and needed no re-pin. THE CHAIR'S RULING 2 (21 September): this reading IS the ruling. No production call omits
the direction (the chair grepped every caller at c96587d; only b90's helper at :192 and its fuzz at :426 do).
The defect was a misspelt direction resolving silently forward on a money path, and that is what is closed;
refusing absent would redden b90 2.1, 2.2 and 2.5 for nothing. An earlier seat's "absent included" (the P6a
read-first's wording, carried in the kickoff as "refuses anything else") is SUPERSEDED on this point.

## 4b · F-44.98 (r3; allocated by the chair): THE FOUNDER'S OWN YEAR-0227 CASE FILED A LEAD IN r2

His walk of 20 September typed a wedding date "15 March 0227". In r2, resolveSpokenDate('15 March 0227',
{ direction: 'future' }) returned { ok: true, iso: '227-03-15' }: iso() padded month and day but NOT the year,
so a four-digit zero-led year left as a malformed date; the door's range check read NaN off it, both comparisons
were false, and planLead planned the lead. createLead would have stored it as 0227-03-15 (new Date re-parses it);
b92 10.14 reproduces exactly that. This was P5 code, live: on the money paths the same date was refused only
because '227-03-15' > '2026-09-21' as STRINGS, an accident of ordering, not a rule.
THE CURE, as the chair ruled its mechanics:
  · spokenDate.js: iso() pads the year to four digits; resolveSpokenDate refuses a resolved year outside 1900 to
    2100 with its OWN reason, { ok: false, reason: 'year' }, in every direction, and re-reads its own result
    strictly, so no malformed date can leave the file (b92 2.6: every year 0001 to 9999, both directions).
  · workingDoor.js: planLead maps 'year' to B21 (P6a-2 maps it to B28 for a delivery date). THE MONEY PATHS ARE
    UNCHANGED: 'none' is B6, every other reason B7, so "paid on 15 March 0227" reads B7 after this cut as before
    it, now by the rule (b92 5.21, the accident named in its message).
  · The door holds the specimen by TWO independent guards: the resolver's floor, and its own strict range on a
    padded year. Removing the floor alone does NOT make it file; b92 10.12 reddens the resolver's cell (2.4),
    and 10.14 shows it takes the resolver's cure AND the door's strict parse reverted together to file it.
b90 after this change: its output is byte-identical to r2's delivery output (165 pass); none of its spokenDate
cells (§2, the fuzz, M8) moved, so nothing further was re-pinned.

## 5 · THE BENCHES

b92 (scripts/b92_lcv_p6a_bench.js, new): 75 cells, exit 0, sixteen mutations. §1 the bytes; §2 F-44.64; §3 the guard both ways;
§2 also carries the specimen at the resolver and the year floor's edges; §4 the exception; §5 preTurn through the REAL createLead on a whole-column public.leads double (29 columns from
docs/db/PUBLIC_SCHEMA.md); B19 reached through the REAL createLead's dedupe, with a wrapper that supplies the
phone the listener cannot yet hear; §6 the carry, the door's half; §7 no chip, both lanes; §8 W-1 from this
manifest; 5.20 the specimen at the door; 5.21 the money paths' unchanged byte; §9 1280 hostile calls with
the act itself hostile (throwing getters, throwing toString), zero throws; §10 sixteen mutations, each reddening
its cell. b92 is red on the
untouched base.
b90's re-pins, each by reading the cell (the chair's differential): H1 1.2 (:188), RULED and HASHES gain B16 to
B21; H2 4.2 (:227) at five; H3 the M5 mutation re-aimed on HANDS' last entry (:485); H5 imageOk (:224) gains
exactly 'donna_lead', FORBIDDEN unchanged; H4 1.5 (:191) stands, the door reads neither LEFTOVER nor EXAMPLES.
b90: 165 pass, exit 0 (base 159; the six new are the 1.1 cells for B16 to B21; every other line identical).
THE DIFFERENTIAL, THE CHAIR'S RULING: "THE DIFFERENTIAL REPLACES THE WHOLE READ ... e-19's 'every cell read
whole' is superseded by this for benches the differential covers." b80 and b88 were NOT read; both were run
in a base tree and a delivery tree and their output is byte-identical (exit 0 in both). b90's differing cells
before re-pinning were exactly 1.2, 4.1, 4.2 and the M5 anchor, whose throw ended the bench early. The chair
accepted the differential as the survey. After the re-pins, `diff base delivery` of b90's whole output is:

    16a17,22
    >   PASS  1.1 B16 is the founder's byte verbatim and its hash is the literal pinned here
    >   PASS  1.1 B17 is the founder's byte verbatim and its hash is the literal pinned here
    >   PASS  1.1 B18 is the founder's byte verbatim and its hash is the literal pinned here
    >   PASS  1.1 B19 is the founder's byte verbatim and its hash is the literal pinned here
    >   PASS  1.1 B20 is the founder's byte verbatim and its hash is the literal pinned here
    >   PASS  1.1 B21 is the founder's byte verbatim and its hash is the literal pinned here
    46,47c52,53
    <   PASS  4.1 item 1 (i): the door's hands are booking, milestone and invoice only; never donna_client, donna_stage, donna_money or donna_money_edit
    <   PASS  4.2 covered at P5: booking_confirmed, advance_paid, milestone_paid, invoice; nothing else
    ---
    >   PASS  4.1 item 1 (i): the door's hands are booking, milestone, invoice and (P6a-1) lead only; never donna_client, donna_stage, donna_money or donna_money_edit
    >   PASS  4.2 covered at P6a-1: booking_confirmed, advance_paid, milestone_paid, invoice, lead; nothing else
    191c197
    < ════════  b90 · 159 pass · 0 fail  ════════
    ---
    > ════════  b90 · 165 pass · 0 fail  ════════

b80 and b88: `diff` of base against delivery output is empty for both.

## 6 · OPEN, AND WHERE EACH SITS

  · F-44.96 (allocated, widened by the chair): the listener hears no phone, so B19 is unreachable live and,
    without the guard, a spoken phone would be dropped in silence. OWED BEFORE THE CHAIN LEAVES: EAR_TOOL gains
    an optional phone_as_spoken, the door passes it to createLead, the guard is removed in the same cut, with a
    listening check on the founder's keys as P1 had. Not P6a's. B19 is NOT walked.
  · F-44.97 (allocated): docs/handovers/TDW_CE44_LCV6_ACTS_COUNT_R2.txt opens "RUN ONCE"; it was filed before
    anyone had witnessed a run. It became true on 21 September: the founder ran all four blocks and the chair
    read his CSVs. As the chair recorded them: BLOCK 0, 25 rows; BLOCK 1, heard 54, joined 54, tier resolved 54,
    unresolved 0, assistant rows 761, both controls pass; BLOCK 2, 55 turns over 54 heard rows, invoice 12,
    booking_confirmed 6, advance_paid 5, find 5, block_date 2, milestone_paid 1, relay 1, unblock_date 1,
    whatsdue 1, no acts 21; BLOCK 3, on_the_day 4 live, days 1 live and 2 retired, NO handover row on the live
    estate. The chair's reading: all 54 are the founder's own walks, so the split measures the seats' scripts,
    not vendor demand, and does NOT order P6 against P7.
  · The P6a read-first reached the chair as text; no file of it exists to land. The seat close's §7 is NOT an
    open duty (the chair's ruling).
  · BOUNDARY, ACCEPTED BY THE CHAIR (ruling 4): if createLead's response is lost after its insert landed, the
    door says B20 though the lead exists. The chair read leads.js :340 to :352: the insert with its
    .select().single() is the function's LAST statement; nothing after the write can throw. What remains is a
    response lost in transit. For money the chair required a re-read; for a lead the worst case is a duplicate
    she can see and delete. NO re-read is to be built.
  · ACCEPTED BY THE CHAIR: two amounts written as five digits and five digits ("60000 70000") are phone-shaped;
    such a lead message goes to the chain, as every lead message did before this cut. Nothing is lost.
  · NAMES (the chair's ruling 1): this manifest and handover carry "p6a1"; the bench keeps b92_lcv_p6a_bench.js
    so P6a-2 extends ONE bench. The kickoff's list is superseded in those two names.
  · UNTIL THE CHAIN LEAVES, as he accepted it: a message carrying an act the door does not cover goes WHOLE to
    the chain, Victor and Donna, who may move money without the door's confirmation and may say "Done" over
    work that did not happen.
  · THE WALK moved to the chair (the chair's ruling). The P6a-2 card carries the delivery-date leg, with the
    handover package he creates in the app first.
  · F-44.98 (allocated): the resolver's malformed date for a zero-led four-digit year; CURED in this cut (§4b).
  · Next free: finding F-44.99, migration 0171, bench b93. Errors continue from e-51.

## 7 · THIS SEAT'S ERRORS, WITH THEIR CAUSES

  e-44 · the first bench run went ahead before the build step the instrument puts first, and gave three false
    reds. Cause: running a bench before reading the instrument that says how benches are run.
  e-45 · b92 6.1 first counted filed leads after turn two had already filed one, and reddened a correct door.
    Cause: an assertion about the state at one event, evaluated after a later event.
  e-46 · b92 9.1 first carried b90's "more than 1000 calls" threshold into a fuzz of 800. Cause: a number
    copied with its cell rather than derived for the new one. Now pinned at exactly 800.
  e-47 · the first cut's floor was started detached and the turn ended while it was live; the runner died with
    the turn and never wrote its sentinel, so no verdict existed. Cause: polls spent on card research and none
    kept for the floor. The floor was re-run from scratch on r2's bytes, and again from scratch on r3's.
  e-48 · r2's range cells tested the edges of the rule (yesterday, five and six years on) and never the case the
    rule was approved for: his own "15 March 0227". The chair gave the door that specimen and it filed. Cause: a
    boundary was tested where it was drawn, not where it had already been crossed; the founder's own recorded
    mistake is the first specimen, before any edge.
  e-49 · r2's fuzz held every argument of preTurn hostile but never planLead's act itself; planLead threw on
    undefined, null and a throwing Proxy. Cause: "every argument position" was applied to the entry point and
    not to each new function the entry point calls.
  e-50 · building r3's b92, the new specimen block was inserted between 5.18's run and its assertion, which then
    read the wrong result; and 9.1's pinned count was first written as 1360 before running (20 hostile acts at
    24 calls is 480, not 560). Both reddened on the first run and were corrected before anything left the room.
    Cause: an edit placed by searching for a cell's name, not its run; a count computed in the head.

---
A PROSE INSTRUCTION IS NOT A MECHANISM. Trust evidence over narrative, including this file.
