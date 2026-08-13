# repo: BOTH · TDW_14 · D-3e — A QUESTION CAN BE TAKEN BACK

**Seat:** LE · **Founder's word 2026-08-14:** 「 only delete. no edit needed 」 · sheet ratified 「 all stand 」 · both open questions answered on the record.
**Tips, fetch-first:** dream-os `120fe6a` · dreamos-pwa `7476b1a`. **Two ZIPs. Zero DDL. W-1 shut.**

---

## 1 · WHAT SHIPPED

**dream-os** — `DELETE /frost/circle/polls/:pollId`, Class B · `b14_d3_polls_bench` **57 → 67**, 15 mutations.
**dreamos-pwa** — five bytes join the one home · `deleteCirclePoll` · the affordance and its confirm on the bloom · `tdw14_d3b_polls` **104 → 125**, 19 mutations · two censuses moved by charter.

---

## 2 · WHAT WAS ALREADY TRUE, AND SO WAS NOT BUILT

**The votes clean themselves.** `circle_poll_votes.poll_id … ON DELETE CASCADE` (0124), and the **D-3 walk already witnessed it in production**: deleting the lehenga poll left `polls 0 · votes 0`. The handler deletes one row. **A handler that also swept votes would be a second implementation of a rule the schema enforces, and would rot the first time a poll left by another path** — §11.5 server-side and §11.6 client-side assert that absence.

**The estate already had the pattern.** `people.tsx` removes a member with *"Remove {name}?"*, a consequence line, and Remove / Keep with the destructive button in muted red. **D-3e mirrors that shape rather than inventing a second one** — matching copy the founder has already approved beats my taste.

---

## 3 · A FORK THAT COLLAPSES, DECLARED RATHER THAN BUILT

`created_by_user_id` is on the row, so *"only the asker may unmake it"* is derivable. **It is not built**, and the reason is that it would be **indistinguishable from what is built**: create is bride-only, so every poll's asker *is* the bride, and asker-scope and couple-scope are **the same set**. Building the narrower rule would add a branch no request can take — an arm that looks tested and never runs.

**They diverge the moment a member can convene.** The handler carries an F-06.85 declaration instructing its own re-read then, because at that point the door silently widens from *"the bride unmakes her own questions"* to *"the bride unmakes anyone's"* — a product decision, not a refactor. **§11.8 reds if that record is deleted.**

---

## 4 · THE TWO RULED SILENCES

**No activity row.** Asking writes none and neither does unmaking: **the circle will never see that a question existed and was withdrawn.** Founder-confirmed as correct. **§11.6 (server) asserts it**, because a later reader will notice the silence and be tempted to fix it.

**No toast, and no separate word for a closed poll.** The poll vanishing *is* the confirmation, and a decided poll takes the same byte as a live one. Both founder-ratified, both asserted.

**And no edit door — anywhere.** §11.7 server-side reds on any `router.patch`/`put`; §11.10 client-side reds on any edit path. **A question rewritten under votes cast for its old wording is the thing delete-only exists to prevent.**

---

## 5 · PROOF

**dream-os 67/67 · pwa 125/125** · **11 cells RED** at the pre-D-3e tree · **34 mutations across both repos**, all sha256-restored.
**Both floors: DELTA ZERO** — dream-os 21, pwa `FLOOR = NAMED BASE`, both sibling-full on clean trees. `tsc` clean, `npm run build` exit 0.

**Two censuses moved by charter, counted from the diff:** `journey.ts` bride doors **6 → 7** (`deleteCirclePoll`, carrying `circleBrideHeaders()` like the six before it — and §3.2's equality census moved with it *on its own*, which is what that cell was rewritten to do). Controls **161 → 165**: +3 buttons (the card's Delete, the confirm's action, the confirm's Keep) and +1 scrim. **Inputs unmoved — unmaking asks for nothing typed.**

---

## 6 · MY ERRORS, THREE, ALL CAUGHT IN-BAND

1. **§11.5's slice ran to the end of the file** and convicted the *list* handler's vote query — an absence cell judging a door it was never about. **Third time this class has bitten in this arc.** Now bounded at both ends, with a guard that reds if the slice comes back empty.
2. **§8.M15's mutation target existed twice.** `if (!poll) return 404` is written identically in the vote and delete handlers, and `String.replace` takes the **first** — so it broke the *vote* path, left the delete guard intact, and §11.2 stayed green. **The harness reported it decorative rather than passing quietly.** The target now carries the delete's own `.select('id')`.
3. **§11.9 counted mentions rather than render sites** — the import line. **§10.8 made exactly this mistake earlier in this same arc and carries the lesson in its own comment.** I wrote that lesson down and then repeated it. **Writing a lesson down is not the same as having learnt it**, and that sentence is now in the cell.

---

## 7 · WHAT THE FOUNDER DOES

Apply both, verify both, then **the one thing only a handset closes**: ask a throwaway poll, vote on it, tap **Delete**, read the confirm, tap **Keep** — nothing should happen. Tap **Delete** again and confirm. **The poll goes and the empty state arrives**, with the votes gone by cascade.

**Sequencing beyond this delivery is the founder's.**
