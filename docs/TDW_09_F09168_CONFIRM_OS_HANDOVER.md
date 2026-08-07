# TDW_09 · F-09.168 — THE QUESTION GETS A DOOR FOR ITS ANSWER (dream-os half)
**Founder ruling, verbatim:** 「 why making it so complicated? just make it such that after the question, the next save is a yes 」
**Repo:** `dream-os` · 2 files · **pushes FIRST**

## The defect — mine
The route asked *"Rs 50,000 — is that the full wedding budget, or did you mean Rs 50,00,000?"* and then had **no field for the reply**. `me.js` read only `budget_total`. Every re-press of Save re-sent the same figure, tripped the floor again, and returned another 409 — a loop with no exit, visible as a stack of identical conflicts in the founder's console.

**Rs 50,000 was permanently unsettable from Settings.** Not awkward — impossible. And Rs 50,000 is a perfectly real budget; the floor is a plausibility check, never a rule.

**I mis-labelled it.** The route's own comment called the 409 a *declared deviation* and the handshake *a rider*. A deviation is a different-but-working path. A question with no answer is a dead end, and calling it declared did not make it work. The founder hit the loop within a minute of the ZIP landing.

## The cure — six lines, and simpler than what I proposed
I had proposed two confirmation buttons carrying the two figures the question names. The founder cut that: **the next save IS the yes.** No new controls, no new words, no branch. `budget_confirmed` on the second attempt skips the floor for that one write.

Three properties, each benched:
- **Scoped to one write.** Never persisted, so the floor cannot go permanently deaf for a couple. The next ambiguous figure asks again.
- **Skips the question, never a refusal.** The 400 for an unreadable figure is evaluated *first* — cell 4.6 asserts that ordering by source position. Confirming a typo is not consent.
- **A changed figure is a fresh question**, enforced on the client (any keystroke clears the yes) and harmless on the server, which only honours the flag it is actually sent.

## Cells
`tdw09_rider2_budget` **58 / 58** (was 54) · four mutations biting: the answer door closing, the flag never read, the floor never asking, the floor disarmed at the seat.

**Cell 4.4 REVERSED, LABELLED.** It asserted the 409 arm was a *declared deviation* — the label I put on a hole. It now asserts the path.
**Cells 1.2, 3.5 updated** for the new destructure and the new guard shape.

## Walk — two steps
1. Settings → Total budget → `50000` → Save. You get the question, nothing is written.
2. **Press Save again without changing anything.** It should land as Rs 50,000.

Then: type `50000` again, and before saving change it to `50` — you should get a fresh question, not a silent write.
