# CE-45 · ELZ-1 · CUT 2b · THE APP LANE'S RELAY, THE QUOTE, THE SAFE NUMBERED PICKS, THE HONESTY LINES · HANDOVER

Base 08025d4 (2f49ac0, cut 2a, plus G6-1's 0172). Ruled by the chair on 25 and 26 September 2026; the split ruled (V16's safe half here, the
same-named picks and V14 in cut 2c).

## 1 · What shipped

P6b's second half (src/lib/vendor/workingDoor.js): the relay stages, frames (B37) and sends on YES on BOTH lanes; relayLane removed at its three
sites; the relay_pwa exit and its B34 mapping DELETED (no reader or writer left in src).
quote_send (workingDoor.js, draftSeat.js): covered and needing a client; it rides the relay's path. planRelay reads the lead's LIVE lead_packages
row (newest); none: B39. The facts (package name, "Rs" total, delivery date) are handed to the writer as facts it must state exactly. F2: code
checks the package name and the figure appear VERBATIM in the body; one re-compose; a second miss stages nothing (the glitch line). F3: a quote
that reached her ('sent' or 'window_closed_doorbell') writes lead_packages.quoted_at and quote_draft_id straight after the send's record; a failed
mark is logged at error level with both ids and never undoes the send. validNote admits a quote's frame note and keeps quote_lp (e-143's cure).
V11 and V13 (doorLines.js, his bytes): B23 "You have no package called {name}. Yours are: {list}. Reply with the number." and B31 "Which package
for {client}? {list}. Reply with the number.", {list} numbered in ONE sorted order (sortedNameList; sortedNames now joins the same order). B23 is
a package note of B31's kind. After B23 or B31 a bare number is the Nth option shown; the name still accepted; out of range re-asks once. B24 is
NOT read by number (cut 2c). B8, B10, B24, B53, B61 keep their bytes until 2c.
F-44.175's honesty lines (his, the "OK" of 26 September), a stopgap until ASK-1's agent: B86 "I can't look that up yet. Open {room} in the app to
see {thing}." and B87 "I can't look that up yet. Open the app to see it." A bare find whose words do not ask for leads or enquiries names the room
by her words (Calendar, Clients, Packages, Invoices, Team: dreamos-pwa rooms.ts read at 612a5b76 and re-read at afe6b076, unchanged). LINES 83.
F-44.173 (src/agent/disambiguation.js): exactPick before the model; an exact, whole, case-folded name picks when exactly one option equals it.
F-44.174 (src/agent/engine.js): the vendor_self record written ONCE, at the end of the turn, from the very text the send carries (recordVendorNotice).
THE EIGHT DASHES (R-45.30; punctuation only, words unchanged): vendorInbound "Sorry, didn't catch that."; nudgeCopy "You're opted out. I won't ...",
"You're back on. I'll ...", "your morning briefing is ready, reply here ...", "Done. No more morning messages. ...", "Morning messages are back on.
You'll ..."; prospectCopy "You're opted out. You won't hear from us again. ..." and "Good to hear from you, thanks for reaching out! ...".

## 2 · Proof

b118b 34/34 (b101's harness verbatim; 2b's cells; five mutations). Every re-pin labelled at site; the old bytes of B23 and B31 grepped across
scripts/* first. c-45.54 applied (b95 9.5 and 9.12, b104 9.4, b108 7.1 anchored in their benches). The differential on 08025d4, engine built both
sides, 81 benches, exits and cell counts: printed on the card.
Self-caught before any cut: e-140 (the composer's deps dropped by composeChecked) and e-143 (a quote's frame note dropped by validNote).

## 3 · Walk record

Landed as 727ed5c. The founder's walk, 26 September (UTC): W1 PASS, the quote (pending_couple_drafts 43252ae5-e4fe-44bb-b1b9-c996432756b7,
"Hi Sarah, here's your quote for Photographs and film: Rs 80,000, with delivery on 5 February 2027. ...", sent 04:38:15.402; lead_packages
quoted_at 04:38:15.487 and quote_draft_id this draft). W2 PASS on the send ("Hi Sarah, your photos are ready! 📸", 04:40:45). W6 PASS (vendor_self
04:43:23 holds his date line, the text his WhatsApp received). Sarah at 04:45:20: "Who sent this message" (F-44.176, cured in its own cut).
W3, W4 and W5 close on his screenshots.

## 4 · Open

Cut 2c: B8, B10, B24, B61 and both B53 sites as notes binding record ids, with its own read-first. F-44.170 after cut 2. ASK-1 replaces B86 and B87.
