# CE-46 · ELZ-4 · LAYER B · F-44.248 · THE DRAFT FOLLOW-UP THROUGH THE DOOR · HANDOVER

Built by ELZ-3 (patch 0002 of its seat-close pack, 7fa54c1a...); taken by ELZ-4 on the tip 24854d2 (layer A 1ed3847, A2 93f054f, G6-4's
F-44.252), `git am` clean as a002e38; no path overlap with anything landed since layer A, so no carry. The chair minted F-44.248 on 29
September 2026; the founder's yes to the two messages came through the chair the same day.

## 0 · The finding (the founder's walk, 10:05:22 UTC, 29 September)

After a relay the door could not send (Asha Walk Fifteen had no number), "Just draft the message and give me" was heard as nothing and handed
to the question agent, which wrote a draft outside the door's record and named the client from her words ("Your Walk Fifteen booking").

## 1 · What ships (6 paths)

src/lib/vendor/workingDoor.js · A DRAFT FOLLOW-UP (her message asks for the draft, names no client, and is heard as nothing, on no note and no
live row) right after a door turn that decided a relay, within 30 minutes, is that relay again, through the door (lastDoorRelay, exported).
The client is the previous turn's recorded client read back through the lead's own row (resolveLead), never her words; the words composed
are the previous turn's. THE NO-NUMBER DRAFT: for a client with no number, TWO messages: "Here is the message for {client}. I don't have her
number, so copy the next message and send it yourself." then the composed draft ALONE (no quotes, nothing around it), so a long press copies
exactly the message. No send question, no phone. With her number on file, the follow-up frames the relay (B37) as before. The listener record
keeps both messages (content a blank line apart; replies on the record), rule 'draft_followup'.
src/api/vendor-engine/chat.js · the app lane: the stream sends each message with a message_break before the second (the app's second bubble,
FE-5's); an app that does not know the event shows both a blank line apart; the JSON route carries replies. One message: as before.
WhatsApp: the two leave as separate messages, in order, each with its own outbound row.

scripts/b142b · §6, 62 cells (6.1 to 6.12 and 6.4b); M13 to M16. 6.7 made total by label (lastDoorRelay absent at the uncured tip reddens the
cell instead of crashing the bench), so the both-ways read is at cell level.
scripts/b99 · M6 (7.6) RE-ANCHORED by label: the floor's gate now reads `key(message)` (the follow-up folds the previous words into saidKey
only); the mutation removes the same gate.

## 2 · Proof (ELZ-4's container, engine built, keys unset)

BOTH WAYS: this b142b on a truly clean 24854d2 reads 48/62, red on exactly 6.1, 6.2, 6.4, 6.7, 6.8 to 6.12 and on M11, M13 to M16 (their
anchors are layer B's own code); green there on 6.3, 6.4b, 6.5, 6.6 (today holds). Cured 62/62, mutations included.
THE DIFFERENTIAL (radius derived by command before the base run: the 71 benches reading workingDoor.js, vendor-engine/chat.js or b142b;
clean worktree of 24854d2 against this layer; one at a time; zero dirt both sides): exits identical; cells identical but b142b (45 to 62);
output differs only in b142b. Found on the first pass and cured above: b99 7.6 (M6's anchor moved). Red both sides byte-identical, the
named base's own: b06_gauntlet (exit 3), b06_meter.
SHIFTED CLOCKS (1 October 2026 IST, 31 December 2027 23:50 IST, 29 February 2028): b142b and b99 green each.

## 3 · The walk (DEV440 vendor side, 9888294440, on WhatsApp; the app for the second bubble after FE-5)

1. "Tell Asha Walk Fifteen her booking is confirmed" (she has no number): the no-number line, as today.
2. Within 30 minutes: "Just draft the message and give me". Two WhatsApp messages: the line naming Asha Walk Fifteen, then the draft alone.
   Long-press the second and copy: the clipboard holds only the draft.
3. "ok thanks": not taken as a follow-up.

## 4 · Carried and known limits

F-44.251 (the chair, 30 September): A2's S0 replaces the whole reply, so a date answer in the same reply is lost and S0 may ask a date already
given; a bare grouped non-money number ("1,000 guests") the model writes is refused. Later cure: remove only the offending sentence, S0's
question dropped when the date is known.
F-44.253 (the chair, 30 September): at 06:01:59 Eliza stated package contents the vendor never wrote. Queued after layer C: she may describe a
package only from its own items and description; a rung cell with the walk's exact turn.
No paid run. W-1: elizaSoul.js and listenerDoor.js unmoved. src/marketingIndex.js (G6-4's F-44.254) is not read by this layer.
