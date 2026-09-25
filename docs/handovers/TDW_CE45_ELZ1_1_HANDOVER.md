# CE-45 · ELZ-1 · CUT 1 · THE COUPLE LANE ON R-45.26's FOOTING · HANDOVER

Base 62c7ef5 (G6-1 FE2b_SRV_1b), named by the chair 25 September 2026. Seat ELZ-1 (executor). Rung b117a (floor), b117m (measured, not floor).
Rulings carried: BS-1 §11 rule 1 (greeting once), R-45.25 (a date's answer), R-45.26 (facts by code, words by the agent; proof by replay and
rate), the founder's tables (a1), (a2) and the trades addendum as understanding, A3d and A3j his, A7 his. Findings cured: F-44.125, F-44.145
(the matcher; the persistence half is NOT in this cut, see §6), F-44.157, F-44.158, F-44.159. Error: e-125 (self-caught, §5).

## 1 · What shipped

The couple lane (Eliza) now receives four FACTS from code and writes every word herself.

FACT 1, in conversation: src/agent/coupleThreadFacts.js reads the thread's WHOLE record (ceiling 200 rows), not the turn's ten-minute,
five-row history (engine.js VENDOR_SESSION_IDLE_MS and HISTORY_LIMIT, unchanged). Any earlier row, a vendor relay included, puts the
client in conversation; the most recent agent row is her last question, not to be asked again. The prompt then gives her the in-conversation
block and no first-message greeting. This was F-44.125's mechanism: on 24 September Sarah's "Hi" twenty minutes after Eliza's question met
an empty window and the first-contact branch, three times in two days.

FACT 2, the trade: vendors.category as written and its fold, with COUPLE_ASKS (categoryProfiles.js, a separate export) giving each trade a
wedding list and a general list; the occasion is asked first. PROFILES and profileFor are byte-identical, because occupancy.js keys capacity
on profile.key and vendorCard.js and me.js read it.

FACT 3, a date's state: src/lib/vendor/coupleDateState.js, called through a third tool, date_state. The model passes the date as the client
wrote it; code resolves it (resolveSpokenDate) and reads the /v page's gates and reader (status, discover_paused, date_check_enabled,
describeDate, verdictOf imported). States: free, taken (blocked, sold, part held, unknown), check_off (incl. occupancy-off with a known
answer, which the route refuses), unreadable. No sentence is returned and nothing is written (date_checks is the public door's record).

FACT 4, the studio's name: src/agent/studioName.js, business_name first. Readers: the prompt (every name site, the admission line), engine.js
relayAttributionPrefix ("From Dev Roy Photography: ") and the capture close.

The prompt (coupleSystemPrompt.js) no longer assumes a bride, never tells her to call herself an assistant, carries no em dash, names the
persona only as the answer to "what's your name", and keeps HARD RULES 11 and 12 at their numbers. The soul (elizaSoul.js) is amended under
R-45.25: its paragraph "WHAT IS NOT YOURS TO SAY" said "you cannot see their calendar" (F-44.158's source) and now keeps price and the job as
the studio's and gives a date its own rule; every em dash set by sense; 7,369 characters under the 7,500 ceiling. ELIZA_ADMISSION is A7.
engine.js's fallback sentence (sent when the model never calls respond_to_couple, two sites) lost its em dash, words unchanged; it is on
the founder's table to reword if he wishes.

The bride lane (brideInbound.js) calls matchOptOutExact on the whole message (F-44.145).

## 2 · Proof

b117a: 43 cells, 43 green, reads no real clock. His 24 September thread replayed (the export 9dd7e3f2bd72; the 14:40 UTC rows transcribed
from his screenshots 0bfe907a4d40 and 0d3d067f1a3c): at 15:00:30 UTC she is in conversation with the 14:40 question named; at 18:17:37 UTC
likewise. Mutations M1 to M6 of production code each redden their cell. Money functions byte-identical to b115's pins.

b117m --readers: 27 hand-labelled replies x 6 rules, false positives 0, misses 0. --dry: 19 recorded turns over a stub model on both routes,
0 misses. --live: the founder's run, N = 20, both couple-lane models; tolerance r2, r3, r6 zero, r1, r4, r5 at most one in twenty.
LIVE RATES (his run, 25 September 2026, --lane=eliza, the live lane; N = 20, 380 replies per model):
claude-haiku-4-5-20251001: r1 0, r2 0, r3 0, r4 0, r5 37 OVER, r6 3 OVER. deepseek-v4-flash: r1 1, r2 0, r3 0, r4 0, r5 60 OVER, r6 0.
r2, r3 and r4 held at zero across 760 replies; r1 within tolerance. r5 and r6 over: cured in cut 1b (its handover), which the chair granted.

Re-aimed by label: b06_m4 (the stanza reads THEY; the name as the answer to "what's your name"), b06_relay_foundations ("From Rohan
Studios:"), b08_p5_eliza (headers; the admission re-pinned to A7; the soul's punctuation; names R-45.25 and R-45.26), b111 2.2 (the bride
lane pinned to this cut, whole-message matcher), b55 (its locator), b115 (runCoupleAgenticTurn ced902e22c42 and relayAttributionPrefix
2d00b510384e re-pinned; cap 770 lines; money pins unchanged).

Differential on 62c7ef5, 63 benches reading a touched file, in series: 23 red on both sides (the seat's environment: the pwa sibling
without node_modules, and dist); b117a and b117m green. The floor of record is the founder's block 2.

## 3 · Drift from the kickoff and the read-first

The couple lane's receiver is vendorInbound.js, not brideInbound.js; untouched. The chair's lean for the date (a fact injected before the
call) was replaced, on evidence, by a tool whose result is the fact (F1-r2, ruled). The code guard of read-first r1 (ii)c was withdrawn under
R-45.26. disambiguation.js was already studio-first and is untouched. The fallback sentence was found by b117m --dry, not planned.

## 4 · Walk record

Landed as 1512f42 on main, 25 September 2026; block 2 green (FLOOR = NAMED BASE, no delta); Railway ACTIVE. Walked the same day on the test
couple's handset (9625759924, lead Sarah) against DEV440; his W6 export read by script (times UTC).

W0: DEV440 count 1; Dev Roy Photography, photography, active, not paused, date_check_enabled true; couple.eliza_enabled true.
W1: 08:10:26 relay "Hello again, Sarah!"; her "Hi" at 08:10:38 answered "Hi Sarah! How can I help?". PASS.
W2: "Are you free on 5th March 2028?" answered "Dev Roy Photography is free on 5 March 2028! Shall I pass your details on?". PASS.
W3: 5 March blocked; "Are you free on March 5 2028m" answered with the house form. PASS on the words (the typo leaves taken vs unreadable
unwitnessed apart; both are the house form; b117a 3.2 and 3.5 prove each).
W4: the switch off; "Are you free on March 15 2028?" answered with the house form. PASS.
W5a: "Cancel the enquiry for now. We changed plans" answered warmly, not an opt-out. PASS; the reply carried an EN dash, cured in cut 1b.
W5b: the bride line, "Cancel the mehendi booking": public.prospects for his number unchanged (discarded, 8 September), no opt-out. PASS by
the record.
Restore: the block deleted 08:20:13; date_check_enabled back to true by the founder.
Every reply spoke the studio's name and said nothing of access, calendar or tools.
Found on the walk: F-44.165 (the known-client read meets seven leads rows, six soft-deleted, and returns nothing; the vendor is never told);
its cure rides cut 2.

## 5 · Errors

e-125 (self-caught before delivery): two b117a cells first tested a phrase that rule 9 of the prompt always contained, so they could not
redden; M1 failing to redden exposed it. Cured: the cells read the in-conversation block's own heading and rule 9 was reworded. b117m's
first readers run also caught one wrong seat label ("I can't see the diary from here" breaks r2); corrected in the labels, not the reader.

## 6 · Open, for the next cut or the seat close

F-44.145's persistence half: the bride lane's opt-out turns are not written to a thread as the vendor lane's are (persistOptOutTurn); it needs
a read of the bride lane's thread writer first. Ruled for cut 2 or the seat close.

The Meta opener (templates.js :205 to :206, "your wedding enquiry") stays off the table by his word; non-wedding clients will read it.

Cut 2 (the vendor side: P6b's second half, quote_send, R-45.23's lines V1 to V16, his) is next, on the base the chair names.
