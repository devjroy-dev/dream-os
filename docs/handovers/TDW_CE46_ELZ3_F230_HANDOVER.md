# CE-46 · ELZ-3 · F-44.230 · THE PROMPT CACHE SPLIT · HANDOVER

Built on 91babd0 (cut 2 landed); carried once by command to 64acdaf (ADS-2 cut1f, G6-4 cuts A and B; no path overlap, no seam in the couple turn) on the chair's word of 29 September 2026. The chair released the filing hold. Rung b142c (the b142
package). The chair's charter of 29 September 2026: "the prompt cache split (stable per-vendor block cached, per-thread block after it,
with e-159's probe fix)"; the proof: cache_read > 0 from a thread's second turn, cost per turn before and after, keyed runs Haiku first,
cost first.

## 0 · The finding

The founder's Instagram walk of 29 September (deploy bcf9db1f): every turn's first model call printed cache_creation between 4,963 and
5,126 tokens and cache_read 0; only a second iteration inside one turn read. ELZ-2's cut 2 cached the WHOLE system as one block, and the
system carried per-thread facts (FACT 1's count and last question, the shape already asked, the known name, the chatted-before line, the
in-conversation date clause), so every turn's prefix was new: a write at 1.25x every turn and no read, dearer than no cache at all.

## 1 · What shipped

src/agent/coupleSystemPrompt.js · buildCoupleSystemBlocks returns { stable, thread }.
- STABLE, identical for every thread of one vendor on one channel and prompt lane (b142c §1 on all three channels, both lanes, and a
  second client of the same vendor): the header and soul, the voice, the Instagram link line, WHO YOU ARE WHEN THEY ARRIVE, the date
  rules, the job, the numbered asks with items 2 and 4 pointing at THIS CLIENT'S LIST and FOR THIS CLIENT, the twelve hard rules, the
  flow with steps 1 and 3 pointing at FOR THIS CLIENT, and the tone examples that do not depend on the client.
- THREAD, after the breakpoint: THIS CONVERSATION (FACT 1's block word for word, the in-conversation date clause, the planning-app
  shape, the known name, the chatted-before line), THIS CLIENT'S LIST (the wedding and other lists, with the shape question removed when
  she has asked it, as R-45.26(2) ruled), and FOR THIS CLIENT: the opening, the name line and the greeting example chosen by the facts.
  She is handed only the branch that fits (b142c §3: no first-message greeting in an in-conversation system).
- The rules are today's: every line of the 91babd0 prompt is present after the split except the four numbered pointers (first message)
  and three (in conversation) whose content moved under THIS CLIENT'S LIST and FOR THIS CLIENT; b142c §4 pins that list exactly.
- The RETURNING branch (a named lead) is unchanged and one text: its prefix is under Haiku 4.5's minimum (ELZ-2's seat close item 4;
  m230 counts it), so it never cached and pays no write.
- buildCoupleSystemPrompt remains, returning stable, a blank line, then THIS CONVERSATION, for readers that take one string.

src/agent/engine.js · the system goes as two blocks, cache_control on the STABLE block only, THIS CONVERSATION uncached; the returning
branch as one cached block as before.

scripts/m230_cache_split_probe.js · e-159's fix and the chair's proof. Bare: the stable text's sameness and sizes, the projected cost,
exit 0 (A-46.1). --live --budget: step 1 counts per shape (Instagram first contact, Instagram in conversation, the shared line in
conversation, Sarah's returning shape at prior 100) BOTH the PREFIX (tools + the stable block + a one-token message: what the cache can
hold) and the FULL request, plus the BEFORE prefix (the whole system as one cached block), and prices the input side per turn before and
after (before: a write every turn; after: turn 1 writes the stable block, later turns read it). Step 2: one three-turn Instagram thread
through the real turn; the verdict SPLIT PROVEN when cache_read > 0 after the first call. --dry proves the record, the budget stop and
the credit stop over a stub. Records under scripts/out/, fresh per run (A-46.3). ELZ-2's m135c stays as its record.

## 2 · Proof (this container, at 91babd0; engine built)

b142c 23/23; --mutate 6/6 (the breakpoint back on one block; the breakpoint on THIS CONVERSATION; FACT 1 back in the stable text; both
openings in the stable text; the date clause left in it; the shape question left on her list), every file restored by sha256. BOTH WAYS:
in a clean worktree of 91babd0 b142c reads 4/23, green on exactly the behaviours that do not change (3.1 to 3.3, R-45.26(2) as it held
before; 5.3, the returning branch's one block). Frozen clocks (next-day IST, 31 December 2027, 29 February 2028): 23/23 each.
Re-pinned by label: b117a 9.1, 9.2 and M11 (two blocks, the breakpoint on the stable one; M11 re-aimed at the new line; 61/61); b115
(runCoupleAgenticTurn 22ea40e74e5fb491 to bafbbd4df2b0e440; cap 930 unchanged; 25/25).
THE DIFFERENTIAL: the 33 benches reading engine.js or coupleSystemPrompt.js, a clean worktree of 91babd0 against the cut, keys unset:
exits identical on all 33; reached cells 1387 = 1387; b05_arc_m4 and b06_gauntlet red both sides (the named base's own); output differs
only in b117a (its relabelled cells), m135c (its bare size estimate, the system now about 270 characters longer by the pointers) and
b05_couple_soul (a clock line). b117m --dry identical on both sides (its stub's known over-tolerance line on both).

NOT YET PROVEN, the founder's keyed run (Haiku first, cost first): m230 --live --budget=0.10 (projected at most $0.048). It is the
chair's proof: the PREFIX counts against the 4,096 minimum (by estimate the Eliza stable text is about 4,200 tokens before the tools,
so the margin is a few hundred tokens), cache_read > 0 on the thread's second turn, and the cost per turn before and after. The prompt's
wording moved (the pointers and the chosen branch at the end), so b117m's rate replay on Haiku belongs before landing too; b117m has no
--budget, so its cost statement is the chair's to rule (A-45.15).

## 3 · Planned: the price switch's stable facts (0183, price_share_enabled; rate_min; the founder's sentences)

The switch and her starting price are per vendor and change only when she edits them: they go into the STABLE text (so a vendor's price
facts are cached with her studio facts, one write per edit), never into THIS CONVERSATION. A matched package's total is per question and
comes from the price_state tool's result, not the system. F-44.231 (two acts on one ambiguous name asking B8 twice) and F-44.248 (a
turn heard none answered with a draft outside the door record, naming the client wrongly) ride after this, as the chair ruled.

## 4 · Disclosed

No paid run from this seat. The legacy prompt lane's stable text (about 7,600 characters) is under the minimum and caches nothing, as it
never did. W-1: elizaSoul.js and listenerDoor.js unmoved.
