# CE-45 · ELZ-1 · CUT 1b · r5 AND r6 CURED IN THE PROMPT · HANDOVER

Base 1512f42 (cut 1). Granted by the chair on 25 September 2026 after b117m --live read r5 at 37/380 (Haiku) and 60/380 (DeepSeek) and r6 at
3/380 (Haiku), over the chair's tolerance. R-45.26(3): the cure is the prompt, re-measured; no guard.

## 1 · The diagnosis (b117m --show-misses, N = 5, his keys, 25 September 2026)

Every r5 miss on both models was one shape, on the three date turns only: the date answered correctly, then her LAST question (the functions
question, asked on 24 September) asked again in the same message ("In the meantime, is your wedding one day or spread across functions like
mehendi...?"). The reader was right: it is a re-ask, which §11 rule 1 and cut 1's prompt forbid. No first-contact trade turn missed.
Every r6 miss was a dash (Haiku): "free on 5 March 2028 — great!", "reach out—we're here". The thread's own history and the quoted last
question carried the dash ("I'm Dev Roy's assistant — ..."), and she copied it.
The run's "errors 26" on Haiku was 13 failed replies counted twice (a b117m fault).

## 2 · What shipped

src/agent/coupleSystemPrompt.js: (a) in conversation, her last question is not asked again "in any wording, even if they never answered it";
(b) in conversation, a date answer stands on its own, with no intake question after it (a first contact keeps answer-then-first-question);
(c) "No dashes of any kind, neither the long dash nor the short one, even if earlier messages in the thread used them"; (d) the quoted last
question has its dashes set as commas, a fact's punctuation, so the quote no longer teaches the dash.
scripts/b117m_elz1_couple_measure.js: the per-turn table and --show-misses (model text only, never a key, never written to disk); r6 reads the
en dash as well as the em dash, with two new labelled replies (29 x 6, false positives 0, misses 0); a failed reply counted once, retried
twice after a pause, its kind printed with any key-like text redacted; errors decide the verdict only above one in twenty; the file runs
from scripts/ or from the repo root.
scripts/b117a_elz1_couple_bench.js: cells 6.5 to 6.7 and mutation M7; 47 of 47.
docs/handovers/TDW_CE45_ELZ1_1_HANDOVER.md: cut 1's walk record and live rates.

## 3 · Proof

b117a 47/47. Differential on 1512f42 over the 14 benches that read a touched file: identical results both sides. The error path proven with a
failing stub: 19 failures counted once, the fake key printed as [redacted], the verdict "too many errors". b117m --live at N = 20 on the
founder's keys BEFORE the git line (block 2M): for 1b as first built see §3r2; for r2, block 3 ran BEFORE 2M (the
founder's slip, recorded); 2M then ran on 9bdcddc, stratified: claude-haiku r1 0, r2 0, r3 0, r4 0, r5 2/140, r6 0; deepseek-v4-flash all
0/140; errors 0. WITHIN TOLERANCE. The r2 walk (25 Sept, UTC): the shape question gone after a date answer (PASS); "Hi" answered directly
(PASS); a blocked date told FREE at 12:47:41 and 12:48:37 because she answered from her own earlier "free" without calling date_state
(F-44.171, minted, then accepted by the founder as low-likelihood); "booked" at 12:49:14 (R-45.25 then amended by the founder to allow it on
a booked day); an em dash at 12:50:08. Cured in cut 1c.

## 3r2 · r2: the measurement that failed 1b as first built, and the cure

1b as first built (sha256 94ab35b06248) was applied on 1512f42 and never committed. Its block 2M (N = 20, eliza, --show-misses, the
founder's keys, 25 September) read: claude-haiku 380 errors, every one "400 invalid_request_error: Your credit balance..." (the founder's
Anthropic account was empty; recharged the same afternoon; nothing measured on Haiku). deepseek-v4-flash: r1 0, r2 0, r3 0, r4 0, r6 0, r5
49/380 OVER (60 before 1b): date_free 12/20, date_taken 18/20, date_check_off 19/20, every miss the date answered and then the shape
question asked again. 1b's sentences did not hold because the list she is handed still led with that question.
THE r2 CURE (the chair to rule before any measurement): FACT 1 gains shapeAsked and shapeAskedOn, read from HER OWN earlier agent rows on the
thread (a row with a question mark naming one day, single day, spread across, functions like, mehendi or sangeet). When set, the shape
question is LEFT OUT of the wedding list she is given and she is told it was asked on that day. Code reads what she asked; she writes every
word; no guard. src/agent/coupleThreadFacts.js and src/agent/coupleSystemPrompt.js. b117a 51/51 with cells 6.8 to 6.10 and M8.
THE STRATIFIED RE-MEASURE (the chair's approval, the founder's cost): b117m --n-hot=20 on the three date turns, --n=5 on the other sixteen,
both models; a cold turn that misses is re-run alone at 20 before the verdict; a progress line per turn; error kinds up to 120 characters.

## 4 · Open

F-44.165 and cut 2 as ruled. The legacy lane was not measured (not live).
