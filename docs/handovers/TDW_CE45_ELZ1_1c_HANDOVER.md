# CE-45 · ELZ-1 · CUT 1c · THE DATE ANSWERS AFTER THE 1b r2 WALK · HANDOVER

Base e07f7fa (9bdcddc, cut 1b r2, plus IGD-1's walk docs). Ruled by the chair on 25 September 2026 after the 1b r2 walk, and narrowed the same
day by the founder's word on F-44.171.

## 1 · What the walk showed (his export, events SELECT and Railway log, 25 Sept, UTC; the live model claude-haiku-4-5-20251001)

The block on 5 March 2028 existed from 12:47:28 to 12:49:47. At 12:47:41 and 12:48:37 she told the couple the date was FREE: the log shows one
model iteration on each, so date_state was not called; she repeated her own 12:47:03 answer from the ten-minute history (F-44.171). At 12:49:09
she called it, read taken correctly, and said "booked". At 12:50:02, after the unblock, she read free correctly and wrote an em dash.
Every turn that called date_state read the truth.

## 2 · The rulings

F-44.171 MINTED, then ACCEPTED by the founder as a known low-likelihood behaviour ("Worst case, the vendor gets a lead that he can't pursue
because he is booked. That's FINE!"): one sentence in both branches, no rule, no hot turn, no extra measurement.
R-45.25 AMENDED by the founder ("booked reads fine"): on a day the calendar shows BLOCKED or SOLD she may say booked, with the house form
after it; a part-held day or a failed check stays the house form alone; the check off, the house form; never "taken", "unavailable" or
"not free".

## 3 · What shipped

src/lib/vendor/coupleDateState.js: "taken" split into "booked" (blocked or sold) and "unsure" (part held, could not check, unknown); every
failure is "unsure"; five states. The /v page's reader (availability.js, occupancy.js) untouched.
src/agent/engine.js: date_state's tool description names the five states (the only change; b115's pin on runCoupleAgenticTurn moved by label).
src/agent/coupleSystemPrompt.js: (a) "Every time they ask about a date, call date_state ... even if you answered the same date a moment ago:
the studio's calendar can change between two messages", in both branches; (b) the booked state's words with the house form after them, the
unsure/check_off/unreadable states the house form alone, "Never use the words taken, unavailable or not free for a date."; (c) the no-dash
rule first in HOW YOU SPEAK.
scripts/b117a_elz1_couple_bench.js: 3.2 moved by label to the split; M3 re-anchored; 6.11 to 6.13; M9 and M10. 56/56.
scripts/b117m_elz1_couple_measure.js: r4 reads the split ("booked" right only on a booked day with the house form; "taken", "unavailable",
"not free" wrong everywhere); 34 labelled replies, 0/0; date_taken_1817 renamed date_booked_1817; walk_booked_1249 added from the walk's own
rows; the date turns x 20, the rest x 5 (4 x 20 + 16 x 5 = 160 replies per model).
scripts/b115_lcv15_lsp4_bench.js: runCoupleAgenticTurn re-pinned (a98506ab5791), labelled.

## 4 · Proof

b117a 56/56; b115 25; b117m readers 34 x 6 clean; --dry drove all 20 turns (24 replies at 2 and 1). Differential on e07f7fa over the 26
benches reading a touched file: identical results both sides. b117m --live (block 2M, his keys, BEFORE block 3): RATES TO BE RECORDED.

## 5 · Open

F-44.170 latent (a provider refusal on the couple lane must reach the vendor and the founder), sequenced later by the chair. F-44.165 and the
rest of cut 2 as ruled.
