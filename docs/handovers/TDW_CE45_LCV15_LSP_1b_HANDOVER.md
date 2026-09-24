# repo: dream-os @ bd9d153 (base; rebased from 46af98d under R-45.14, SRV_1b disjoint) · dreamos-pwa untouched · code · TDW_CE45_LCV15_LSP_1b.zip
# TDW · CE-45 · SEAT LCV-15 · LSP_1b · F-44.141's CURE · A VENDOR'S "CANCEL …" NO LONGER OPTS HER OUT · 2026-09-24 IST

Line numbers derived by command at bd9d153; re-derive before citing. Trust evidence over narrative, including this file.

## 1 · THE DEFECT (F-44.141, minted by the chair, SEVERE, pre-existing since F-05.25, not LSP_1's)
On the vendor WhatsApp lane any message whose FIRST word was STOP, UNSUBSCRIBE, CANCEL, END, QUIT or STOPALL was read before the
door as an opt-out: the sender was marked opted_out, sent the opt-out confirmation, and the turn returned, so "Cancel Walk Seventeen
Alpha's shoot" never reached the door's cancel. While opted out the F-05.2 gate (whatsapp.js) blocks every send to her, the door's own
replies included. Neither turn was written to public.messages. Witnessed twice on the founder's handset on 24 September (02:33 and
02:35 IST) during LSP_1's BEFORE walk; START restored him each time. A second live witness sat in the benches: b0498's fixture
"start fresh tomorrow" tripped the first-token START matcher at 46af98d and logged a branch error; at this cut it no longer matches.

## 2 · THE CURE (the chair's rulings Q1b, Q2b, Q3b)
src/lib/fullStop.js :73 · matchOptOutExact(text): the WHOLE trimmed message, surrounding punctuation stripped and case folded, is one
  word of prospects.js's STOP_WORDS (six) or START_WORDS (three), read from their one home; anything with a space inside is null
  ("Cancel the shoot", "STOP MORNINGS", "Resume on Monday"). Total: no input throws. matchFullStopWord (first token) is kept for the
  bride lane.
src/lib/vendorInbound.js :269 · the pre-user, pre-cap branch calls matchOptOutExact, for EVERY sender on this lane (Q2b: the branch
  cannot know the sender yet, and a bride's "Cancel the shoot" to her vendor must reach the door too). Its place is unchanged.
src/lib/vendorInbound.js :175 persistOptOutTurn, called at :276 and :282 on the two RETURNING paths only (STOP; a START that changed
  the state): for a VENDOR OWNER (phone → users → vendors → her vendor_self thread, read only; nothing created) it writes her inbound
  row with its message_sid (RF-1's dedupe holds) and the acknowledgment as an outbound row with the send's id, and touches
  last_message_at. Never throws; a failure leaves the opt-out standing. Both acknowledgment sends keep their pinned fixed-copy shape.
NOT PERSISTED, NAMED: a couple's or an unknown sender's opt-out turns (her thread resolves far below this branch).
NOTHING ON A FALL-THROUGH (Q3b): a START from someone never opted out goes on to her normal turn, which writes her inbound row; a row
  written by the branch would be a second writer on it and would record a reply never sent.
UNTOUCHED: prospects.js (the marketing lane's isStopWord and its opt-out), brideInbound.js. The bride lane's twin is F-44.145 (minted),
  riding the F-44.125 sitting, which switches it to matchOptOutExact with one call change.

## 3 · THE BENCHES
NEW RUNG b111 (scripts/b111_lcv15_lsp1b_bench.js), 28 cells: the word lists read from one home (6 and 3); twelve phrases not matched;
a control that the first-token matcher still says "stop" for the witnessed sentence; hostile inputs total; prospects.js and
brideInbound.js pinned to their bytes (unchanged 46af98d..bd9d153); the vendor lane calls the exact matcher only, in its place; the REAL
processVendorInbound over a Postgres-shaped double with the unique sid: the witnessed sentence reaches the turn, STOP and START put
both rows on the record, START never opted out writes nothing from the branch, a couple's STOP writes no vendor_self row, a couple's
"Cancel the shoot" is not an opt-out; persistOptOutTurn total; mutations M1 (first-token restored), M2 (persisting on the fall-through),
M3 (a first-token exact matcher), each reddening its cell. Throws at 46af98d (the export is absent); green here. Reads no clock.
RE-PINNED: b05_f0555 5.1, the inboundRow census 6 → 7, the seventh named persistOptOutTurn's (23/23).
RE-ANCHORED: b05_p4_crons 9.5 and 5.3 accept either matcher (the vendor lane's is matchOptOutExact by ruling); 9.5 green; b05_p4_crons stays
base-red with exactly its base reds 5.3, 6.5, 6.6, 5.3 keeping its true reason (the twins have drifted). No bench retired (A-45.2 unused).
b06_m3 4.3 (the fixed-copy pin) held by curing the source, not the pin.

## 4 · THE PROOF
DIFFERENTIAL in series on one base, twice: at 46af98d and again at bd9d153 after the rebase. The set is 65 (every bench reading
fullStop.js, prospects' words or vendorInbound.js, plus b111), the same at both tips. Exit changes: b111 only. Output changes: the four
attributed (b0498's cured log line, b05_f0555, b05_p4_crons, b111), each byte-identical across the two tips.
FLOOR on bd9d153: "FLOOR = NAMED BASE, no delta (refusals, not in base: 3)", 21 exact, declared files unmoved.

## 5 · ERRORS AND CORRECTIONS
e-97 (the seat's read-first said persisting on the fall-through would DROP her turn; the lane discards its own insert's error, so it
would not; the ruling stands on the two real harms, recorded at the source comment and in b111 4.6).

## 6 · THE WALK (the card, his words)
On LSP_1b's deploy, on WhatsApp to DEV440's line: "Cancel Walk Seventeen Alpha's shoot" reaches B50 ("Cancel Walk Seventeen Alpha's
shoot on 22 November 2027? Reply YES or NO.") and "No" gives B3; "STOP" alone opts out with the confirmation; "START" resumes. His
export of vendor_self shows all six rows, the STOP and START inbound rows carrying their message_sid.

## 7 · THE WALK RECORD
Owed at the walk.

## 8 · NEXT FREE
As the chair holds them.
---
A PROSE INSTRUCTION IS NOT A MECHANISM. Next: LSP_1's AFTER half on this deploy (R-b, R-c, Cleanup B after), then LSP_2 (R-45.16).
