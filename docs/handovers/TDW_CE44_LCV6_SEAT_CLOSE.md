# repo: dream-os @ fb0335ac459a35f8f40d057625b1fc2d1f3e14a3 · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307
# TDW · CE-44 · SEAT LCV-6 · SEAT CLOSE · 2026-09-21 IST
# Landed as docs/handovers/TDW_CE44_LCV6_SEAT_CLOSE.md, docs-only under C-44.1, on the chair's ruling
# of 21 September. LCV-6 closes BEFORE P6a's cut and wrote no code. Nothing below is runnable.

## 1 · WHY THIS SEAT CLOSES HERE

The chair's next step is the whole read of b80 (276 lines), b88 (307) and b90 (728) by the
differential, then run-floor.sh (421), base_guard.sh (124) and preflight.sh (238) with the instrument
in hand, then the cut itself: workingDoor.js, doorLines.js, b92, the four b90 re-pins, F-44.64, the
ZIP, the floor and the card. That is the packet. This seat's room holds the acts count card it is
delivering now and not the packet after it, and the kickoff's rule is to say so before a packet, never
inside one. Nothing is half-built. The next seat inherits a design accepted in full and every byte his.

## 2 · WHAT LCV-6 DELIVERED, IN ORDER

  · P6 read-first, first cut, 481 lines, sha256 a3fba2167e41…: accepted as a first cut; P6 SPLIT.
  · P6a read-first, 463 lines, sha256 ad76c9787d46…: ACCEPTED, with §2.3 and §5 then pending his word.
  · Acts count r2, rehearsed, 279 lines, sha256 c96f883d1766…: its four blocks CONFIRMED by the chair
    as text; the card built from them by script, byte-identical, sha256 99e09ea90f84….
  · This record.

## 3 · HIS RULINGS THIS SEAT CARRIED, VERBATIM

  R-44.33 · asked whether attach asks YES or NO first or lands at once and reads back: "attaching
    immediately". Attach LANDS AT ONCE; stages nothing; asks nothing.
  R-44.34 · to the chair's list of twelve and ASK against REFUSE for a handover package: "yes to all."
    and, of the question, "When/what is the delivery date for Sharma?". Bytes 1 to 10 his as B16 to
    B25; the door ASKS for the handover date.
  R-44.35 · to pairing A (his app's "Handover date") against B (his own word throughout):
    "B (your word throughout): "When is the delivery date for {client}?" with the same read-back."

## 4 · P6a's BYTES, B16 TO B28, ALL HIS

  B16  Lead added: {client}.
  B17  Lead added: {client} · {date}.
  B18  Who is the lead? Say the name.
  B19  That number is already on {client}. Nothing new was added.
  B20  Could not add the lead.
  B21  That wedding date cannot be right. Say it like 5 December 2027.
  B22  Package attached: {client} · {package} · Rs {total}.
  B23  You have no package called {name}. Yours are: {list}.
  B24  Two packages are called {name}: {name} (Rs {total}) · {name} (Rs {total}). Say which one.
  B25  Could not attach the package. {client} has no wedding date yet. Add the date first.
  B26  When is the delivery date for {client}?
  B27  Package attached: {client} · {package} · Rs {total} · Delivery {date}.
  B28  That delivery date cannot be right. Say it like 5 December 2027.

  B28's PROVENANCE, in the chair's terms: proposed by the chair as B21's twin "in whichever word he
  picked"; he answered B and changed nothing; recorded as his on that basis; he may still reword it.
  Reused as they stand: R-44.12's "This couple is booked. The package is fixed on their invoice.",
  B7, B8's shape. B15 owed by the last packet, keeps its key. b90's RULED and HASHES gain all thirteen.

## 5 · THE DESIGN, ACCEPTED, AS THE CUT MUST BUILD IT

  · The door calls createLead (src/lib/vendor/leads.js:164) and attachPackage (leadPackages.js:86) AS
    THEY STAND. No new writer; donna_lead never reached; attach records its tool call as
    `attach_package`, no donna_ name invented. handResult.js is NOT edited: isDoorLineKey and
    DOOR_LINE_KEYS have no production caller (only b90:187, :434); donna_lead's codes (:55) already
    cover filed, deduped and failed.
  · Source by lane, pinned per lane: 'self' on the pwa, 'whatsapp' on WhatsApp.
  · wedding_date_precision 'day' PASSED explicitly (createLead writes `|| null` at :339;
    computeSchedule reads null as day at packageSchedule.js:76, a fallback the door does not lean on).
  · Wedding date: resolveSpokenDate direction 'future'. Refused with B21: a resolved date strictly
    before today in IST, or a year outside today's IST year through today's plus five (F-44.66).
    Unreadable: B7.
  · B19's {client} from the RETURNED row (dedupe is phone-only, .eq('phone') at :231 and :316;
    enrichment absent on the vendor door by R-37.34), pinned against the spoken name.
  · Nameless lead: B18, and the rest of what she said carried on the thread, listenerDoor.js:122's
    "[understood then: …]" from meta.listener.request, written on every door turn at
    workingDoor.js:444. The carry is the MODEL's: proven in two halves, a b92 cell with a scripted
    listener for the door's half, ONE walk step on live keys for the model's, with the exact words
    "Add a new lead, haldi shoot on 3 January" then "Sharma".
  · Package resolution INSIDE workingDoor.js beside leadsNamed and sameName, by the door's key() fold:
    one match attaches; two is B24; none is B23 with her own names.
  · attachPackage sent EXACTLY { package_id }, and for a handover package { package_id, delivery_on }.
    B22 speaks when the returned row's package has no handover basis, B27 when it does; which one is
    read from the ROW attachPackage returned, never from what was asked. Name, total and delivery date
    all from that row, longDateYear for the date.
  · F-44.92's design: the attach act's own date_as_spoken is used as delivery_on ONLY when the resolved
    package is a handover package AND the resolved day differs from the lead's wedding_date; equal is
    treated as misheard and B26 is asked. A date on an attach act whose package is NOT handover is
    IGNORED and { package_id } alone is sent, pinned by a cell. A resolved delivery date strictly
    before today in IST or out of F-44.66's range takes B28; unreadable takes B7; B21 is NEVER spoken
    for a delivery date. A delivery date after the wedding is PASSED, as the sheet passes it.
  · Booked lead: R-44.12's line on `already_booked` (leadPackages.js:128).
  · ORDER in preTurn: leads, then attaches, then invoices, then THE ONE money act. The money plan is
    built AFTER the attach pass, so a refused attach asks NO B2 and stages NO row; a mutation moving the
    plan ahead must red it.
  · allCovered's lead exception is a branch ABOVE the untouched return, so b90:452's anchor holds.
  · COVERED becomes six: booking_confirmed, advance_paid, milestone_paid, invoice, lead, attach_package.
  · No migration. 0169's CHECK keeps its three money acts; 0171 stays free.
  · W-1 NONE. Files: workingDoor.js, doorLines.js, b92 (new), b90 (re-pins), handover, manifest.

## 6 · WHAT THE CUT MUST DO FIRST, AND THE FOUR b90 HITS

  Read b80, b88 and b90 WHOLE, every cell, by the differential: the change in one fresh copy, absent in
  another, all three benches run in both. Then run-floor.sh, base_guard.sh, preflight.sh with the
  instrument in hand. The hits already derived, each by reading the cell:
    H1 b90 1.2 (:177) pins the LINES key set exactly: gains B16 to B28 in RULED and HASHES.
    H2 b90 4.2 (:214) pins COVERED at four: rewritten to six.
    H3 b90's mutation at :471 anchors on "  invoice: 'donna_invoice_pdf',\n});" and loses it when HANDS
       grows: re-aimed on HANDS' last entry; b92 asserts it still reddens 4.3.
    H4 b90 1.5 (:180): nothing in the door reads LEFTOVER or EXAMPLES. A boundary, not a cure.
  F-44.64 rides the cut: resolveSpokenDate accepts exactly 'past' or 'future', refuses anything else to
  B7; its defect is one line, resolveRaw mapping anything not 'past' to future (spokenDate.js:91);
  b90's mutation anchor updated in the same cut.

## 7 · OPEN, AND WHERE EACH SITS

  · THE ACTS COUNT r2's FOUR RESULTS: the card is with him; his results go to the chair first. They
    order P6 against P7, and BLOCK 3 sizes F-44.92 on her live estate.
  · P6b: relay and quote_send; quote_send as a relay whose body is the quote; the door never stages a
    relay and the two staging tables never cross. Precondition: relaySeat.js read WHOLE and the chair's
    three derivations, beginning with the fact that runRelaySeat is called ONLY at
    vendorInbound.js:2123 to :2124, with the chain's result, after the chain's turn.
  · Findings allocated this seat: F-44.92 (the handover package the door could not attach; now cured
    by design) · F-44.93 (refusal bytes naming a control WhatsApp cannot offer, to the pwa cut) ·
    F-44.94 (the handover date unbounded against the wedding date on every surface, the last payment
    able to precede the first; LC-3's opening, HARD before G6) · F-44.95 (the pwa says "handover date"
    where the door now says "delivery date", to the pwa cut with F-44.56, F-44.59, F-44.93).
  · The chair's own correction this seat, recorded at its ruling: **c-44.40**, the chair's first count
    of BLOCK 0's expected rows read 22, its script having missed the last table of the engine doc;
    corrected to 25 before ruling. Cause: a count taken from a parse not checked against the file's end.
  · THE TWO READ-FIRSTS ARE NOT IN THIS CUT (e-43 below). Both reached the chair and are held there:
    the P6 first cut, sha256 a3fba2167e41e75660651e91c5d9704d59c045f7c88f33d12861c62aaad5bc71, and the
    P6a read-first, sha256 ad76c9787d46352a56179c51c29ca37b676b9e8c6f34895916238aed87eb38e2. They land
    from the chair's copy, gated on those hashes, never retyped.
  · Next free: finding F-44.96, migration 0171, bench b92. Errors continue from e-44.

## 8 · THIS SEAT'S ERRORS, WITH THEIR CAUSES

  e-41 · the first cut called a nameless lead unreachable and needing no byte, having read the twelve
    approved examples whole in a file read whole. Cause: **reading a file is not the same as reading
    it against the question.**
  e-42 · a line span for threadText, ":128 to :137", carried from an earlier read and typed at the
    moment of writing; the line is :122. Cause: a citation not re-derived at the moment it was written,
    and not marked as different from the ones that were.
  e-43 · the chair ruled that the two read-firsts land beside this record, and this seat could not do it:
    it had deleted its only copies while clearing superseded files from its outputs, the turn before.
    Cause: **superseded is not the same as no longer needed.** A file the chair has accepted is the
    record of what was accepted, and clearing it was treated as tidying. Owned before the cut, not
    after it; nothing was retyped in their place, because a record reconstructed from memory is a
    document asserting it is the one that was read.

## 9 · FOR THE NEXT SEAT, ONE LESSON THIS SEAT PAID FOR

  The rehearsal plant for BLOCK 0 was built with four of public.vendors' 56 columns. Before telling him
  "25 rows" the seat checked production's column list, and BLOCK 0's name list does happen to match
  only id, user_id and tier on vendors, so 25 holds. It held by luck of the column names, not by the
  plant's design. A plant that trims a wide table can make an expected count right on the container and
  wrong on his screen. Plant the whole column block, or check the doc before stating a count.

---
A PROSE INSTRUCTION IS NOT A MECHANISM. Trust evidence over narrative, including this file.
