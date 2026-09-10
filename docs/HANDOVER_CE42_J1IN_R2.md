# CE-42 · SEAT E · J1-IN r2 · F-42.126 + F-42.127 — HANDOVER
**F-42.127 IS CREATED BY r2 AND CURED IN r2.** It is not latent at `2fadf83` and it is not
a pre-existing bug being tidied up: the fall-through this packet adds is what makes her
reply reachable by the consent arm at all. Cause and cure ship together, which is the only
acceptable order — but a reader diffing r1 against r2 must not misread it as either.

base `6164472` · no migration · bench `b71` 15/15 · floor: NAMED BASE, no delta (23 RED + 4 REFUSED, read 2026-09-10 04:15Z)

1. F-42.126 — r1 returned on EVERY match, so a number that was both an introduction
   recipient AND mid-conversation with the Closer stopped being answered. Not ended,
   just silent, until the expiry job wrote `expired` and nobody learnt why. Found on the
   founder's walk of 2026-09-10 by a `prospects` row dated the previous evening.
   Ordinary in production: a vendor's contacts and TDW's prospect list overlap by
   construction. Ruled (ii): the lead is written on EVERY match; she falls through only
   when a conversation is live.
2. LIVE = `replied` | `in_session` and nothing else (ruled). `cold` and `templated` are
   non-terminal too and are deliberately excluded — neither has a conversation in
   flight, and letting Maya open one off a vendor's introduction would be TDW taking
   over a message Mira sent.
3. STOP — "mint no prospect" was never "ignore an existing one". An existing row keeps
   today's arm in full: `stopped_at` stamped AND `opted_out` written AND the courtesy
   confirmation sent. With NO row it returns, because `:184` opens with
   `findOrCreateProspectByPhone` and would mint the very thing Fork A forbids.
4. F-42.127 — the fall-through made her reply reachable by R-41.131's consent arm
   (`prospects.js`), which would have filed a reply meant for MIRA as her consent to
   TDW's marketing, in the queue, for the founder to act on. Ruled skip. A direct
   message to TDW still records normally; `introMatched` is false on every other path.
5. Shape: `handleIntroductionInbound` → `applyIntroductionInbound({row, text, isStop,
   prospect})` returning `fallThrough`. The match moved to the lane so the prospect read
   happens ONLY on a match. `introductions.js` still never touches `prospects` — the row
   is handed in, and `prospects.js` lazily requires this file, so the reverse require
   would close a cycle.

## BOTH WAYS, PER CELL — STATED RATHER THAN CLAIMED
- 1–9 RED at r1 (F-42.90 and the original arm). 10 GREEN both ways BY DESIGN: it is the
  regression cell and asserts today's path is unchanged.
- 11, 14 RED at r1. These are F-42.126's cure.
- 12, 13 GREEN at r1. NO-CHANGE CELLS: r1 returned on every match, so silence was already
  the outcome. They pin the ruled behaviour; they prove no cure. Said so rather than
  counted as nine reds.
- 15 GREEN at r1 AND THAT GREEN IS WORTHLESS — the consent path does not exist at r1
  because nothing falls through. Proven against the tree that actually carries the
  defect (r2 with `!introMatched &&` removed): RED, `consent was harvested from a reply
  meant for the vendor`. Guard restored, 15/15.

## ⚠ F-42.127 IS A DEFECT THIS PACKET CREATES
It is not latent in what shipped at `2fadf83`. The fall-through is what makes her reply
reachable by the consent arm. The cure ships in the same packet as the cause, which is
the only acceptable order — but a later reader diffing r1 against r2 should not mistake
this for a pre-existing bug being tidied up.

## CLOSED BY REASONING, NOT BY A CELL (check me)
`stopped_at` set AND a live prospect is unreachable: if she had a row at STOP time she
fell through and it is `opted_out` now; if she had none, none can appear, because nothing
mints her. So the post-STOP branch returns `fallThrough: false` unconditionally. If a row
can arrive by a path this seat has not seen, that branch needs a cell.

## b66 — ANOTHER SEAT'S BENCH, AMENDED BY LABEL UNDER R-41.121 (chair-ruled)
The floor delta was one line: `RED: b66_inbound_consent`, cell 2.1. That cell pinned the
consent guard's LITERAL text — `if (!prospect.consent_text && text && text.trim())` — so
F-42.127's added condition reddened it over a SPELLING while the behaviour it guards (never
overwrite an existing record) was untouched. b66 strips comments before asserting, so the
r2 comment block is invisible to it and no other cell is passing for a wrong reason; this
was verified rather than assumed. The `if (` anchor is dropped, the three original
conditions stay pinned in order, and a new cell 2.3 pins F-42.127 in the bench that owns
this arm. **77 → 78 cells.** 2.3 proven both ways.
Ruled in rather than reverted: a cell that pins `if (` is asserting a SPELLING, and the law
is meaning over spelling (R-41.121). The bench that owns an arm is the right home for a
cell about that arm.

## V-2 FENCE
`victorLines.js` MOVED in V-2 and `introductions.js` requires it, so the blob check alone
was not enough. Derived: no `INTRO_` line touched in the diff, all five bytes hash true at
`6164472`, `assertLineHashes()` returns true. r2 touches victorLines.js not at all —
`INTRO_NOT_FOUND` / `INTRO_NOT_STAGED` remain E3's radius and unminted (F-42.93's class).

## OPEN
F-42.96 (seat B, the vendor's push notice) · F-42.91 · F-42.92 · F-42.93 ·
F-42.124 / F-42.125 (Block 09 runner charter).
