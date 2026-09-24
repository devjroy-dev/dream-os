# repo: dream-os @ e813d3f (base) · dreamos-pwa untouched · code · TDW_CE45_LCV15_LSP_2.zip
# TDW · CE-45 · SEAT LCV-15 · LSP_2 · R-45.16 THE SCREENSHOT SAVE · F-44.147 THE POSSESSIVE · F-44.148 THE LOST CLIENT · 2026-09-24 IST

Line numbers derived by command at e813d3f; re-derive before citing. Trust evidence over narrative, including this file.

## 1 · R-45.16, THE SCREENSHOT SAVE (designed and ruled; B84 and B85 his)
vendorInbound.js, the vendor-image stager: the preview of a calendar screenshot now ends with B84 ("Reply "save all" to add them, or "skip 2" to
leave one out."), read from doorLines; after the send the stager resolves her agent and calls workingDoor.noteProposals, which writes her image
and the preview on the engine thread the door reads, the assistant row carrying meta.listener.note { asked: 'IMG', proposal_id, count }. No
usage row. If the agent does not resolve, the preview stands and her reply is handled fresh (declared; two benches whose deps omit the resolver
log that fall-through and are otherwise unchanged).
workingDoor.js: IMG_ASKS joins ASKS; validNote accepts an IMG note only with a proposal id and a count from 1 to 20. preTurn answers an IMG note
BEFORE the ear by proposalChoice on her whole message: "save all" | "save" | "save them all"; "skip N", "skip N and M", "skip N, M and K"
(1..count, no repeats); anything else LAPSES the note. answerProposals re-reads the row (hers, unresolved, the same count, under 24 hours by the
store's created_at), writes each kept row through writeEvent as fileBook does (source 'victor', never force), speaks B46 per row, the writer's
conflict verbatim (B47) or B75, then ONE resolution update (save_all, save_selected, or cancel with B85 "Nothing was saved."). Money untouched.
doorLines.js: B84 and B85, hash-carried; LINES 79 → 81.

## 2 · F-44.147, THE POSSESSIVE
key() folds a word-final possessive ('s, ’s dropped; s' → s) with case and edge space; a name merely ending in s is untouched. The one home,
resolveLead in lifecycleHands.js (untouched by law), matches lower(trim) exactly, so the door's L wraps it: the name AS HEARD first, and only on
not_found, when the fold changes the name, once more folded. A stored "Alpha's Studio" still matches itself first. His 07:26:00 request
("walk seventeen alpha's") now reaches B50.

## 3 · F-44.148, THE LOST CLIENT
Mechanism, read from his engine row (07:42:43 UTC, one tool call, no note): F-44.118's safety floor strips a heard client not present in her
words under key() (her "talk seventeen alpha", the ear's "walk seventeen alpha"); assign_crew's client is optional (a member alone is a team add),
so the stripped act silently became a team add, B56 alone. The optional-client survey at build: of the covered acts outside NEEDS_CLIENT
(block_date, unblock_date, assign_crew) only assign_crew changes meaning; lookups return before the floor.
Cure: the floor marks the stripped act with UNSAID (a Symbol: the ear cannot send it, JSON cannot carry it); namelessOf counts a marked act as
nameless, so askName asks B35 with a note carrying the act and unsaid true; validNote and askAgain keep it; her answer fills the client through
the existing B35 path. Nothing is written on the asking turn. F-44.118's scope is unchanged. planAssign and fileAssign are byte-identical.

## 4 · THE BENCHES
NEW RUNG b112 (45): the grammar; the save through the REAL preTurn and REAL writeEvent (skip 2 with zero ear calls, save all, all skipped B85, a
clash verbatim, a refusal B75, four lapses, "ok thanks" lapsing, three more clocks for the 24-hour window, C-44.13); the stager's note with no
usage row; F-44.147's verbatim replay to B50 and the exact-first guard; F-44.148's verbatim replay to B35 with nothing written, her answer to B56
then B58, a plain team add still B56, a said client untouched; five mutations; the held functions pinned. Throws at e813d3f (absent exports).
The double's team_members rows take the store's defaults (a UUID id, active true), disclosed under C-44.3.
RE-PINNED, labelled: LINES 79 → 81 in b97 7.3, b98 6.3, b99 5.3, b102 3.2, b103 6.2, b104 10.2, b105 6.2, b106 1.4, b107 4.3 (count and blob),
b108 1.1, b109 1.1; b90's ruled key set gains B84 and B85 (218 → 220); b95 M12's anchor follows validNote's return line (unsaid). RE-AIMED:
b104 8.1, since R-45.16 supersedes F-44.109's drop (Victor's sentence never returns; the preview ends with B84 from doorLines).
e-105 AND ITS LESSON: the seat's read-first counted nine LINES pins; the true set was eleven count pins plus b90's key-set pin and b95's anchor on
validNote's return line. A LINES survey counts key-set pins and every anchor on validNote's return line, not only count pins.

## 5 · THE PROOF
DIFFERENTIAL in series on one base (e813d3f), 64 benches reading doorLines.js, workingDoor.js or vendorInbound.js plus b112: exits changed for
b112 only after the two cures; outputs changed for b90 (two new cells), b104 (8.1's label), b112, and the two fall-through log lines.
FLOOR: "FLOOR = NAMED BASE, no delta (refusals, not in base: 3)", 21 exact, declared files unmoved.

## 6 · THE WALK AND ITS RECORD
The card: a real three-event calendar screenshot, B84, "skip 2", the SELECT after; "Cancel walk seventeen alpha's shoot" to B50 then No;
"Add nobody crew to talk seventeen alpha shoot" to B35 then "Walk Seventeen Alpha" to B56 and B58. Cleanup D by id afterwards.
THE RECORD (written by the seat, 24 September 2026; docs-only under C-44.1). On a7e90bf's deploy, 11:39 to 11:42 UTC. His read after
(Supabase_Snippet_Untitled_query__5_.csv, sha256 f86bae8b3193f2ad…), the Railway log (logs_1790250347160.csv, 58 lines, 8eee79efec7685fa…) and the
engine rows for the crew exchange (…__6_.csv, 438dcd9513fef805…).
THE SAVE, LIVE: he sent his real calendar, not three test events: proposal eb86e3a1-f2b0-4c75-8727-98333b437a32 staged with 7; "skip 2" answered by
the door's grammar; "[door:wa] spoke alone (B46,B46,B46,B46,B46,B47)": five rows written, the sixth a clash spoken verbatim (B47); the proposal
resolved save_selected. F-44.147: "Cancel walk seventeen alpha's shoot" → B50, then B3.
F-44.148: the crew sentence ran the DID-YOU-MEAN path, not B35. At 11:41:07 the ear heard {"act":"assign_crew","client_as_spoken":"talk seventeen
alpha","member_as_spoken":"nobody"}: it kept his "talk" (ear variance against 07:42:43's correction), so the client was in his words, the floor
never fired, and nearestName offered Walk Seventeen Alpha (B36, the door's right answer). B35 was not exercised; b112 §5 is its proof. His
"Walk seventeen alpha" (heard as no act) drew B36 again (F-44.149, minted: a did-you-mean answered with the offered name itself is taken as yes);
"Yes" → B56 then B58 ("Assigned: nobody · Walk Seventeen Alpha · shoot · 22 November 2027."). "nobody" is the ear's split of "nobody crew".
NO CLEANUP (R-45.22, the founder: "the estate can use them for test"). TEST ROWS ON DEV440, for later walks: events fb9566b6-7b43-487c-ace6-ed5c882ccbac
(Yamini's Haldi, 2026-11-20), 8d6aa30a-0924-44d8-8215-498878c5544c (Bhoomika Arora (Bride + 2 guests booking), 2026-11-20),
a5559d06-a39e-49a1-ae51-6fffb5caedaf (yamini's wedding, 2026-11-21), 86613a10-8f16-41be-98ec-2f0f347b23eb (yamini's vidai, 2026-11-21),
f68b2a3f-2924-4a10-a2d2-3416438e4132 (Amritsar bride 22-24 nov (Day 1/3), 2026-11-22), all shoots; the member "nobody"
619b4104-ff1c-48d2-afdf-2b909eabe630, on the 22 November 2027 shoot beside Walk Seventeen Theta and Walk Seventeen Lambda.
---
A PROSE INSTRUCTION IS NOT A MECHANISM.
