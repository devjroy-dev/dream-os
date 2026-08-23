# repo: dream-os @ c7c1be1
# TDW · R-36.5 — THE RACE FENCE · LE DELIVERY HANDOVER
Base `c7c1be1` · authored 2026-08-24 · rides the ZIP per §7; FINDINGS_LOG and the
masterplan are the chair's ink and are untouched.

## 1 · WHAT SHIPPED (six files)
1. **`db/migrations/0129_agents_user_id_unique.sql`** — the arbiter: UNIQUE INDEX
   `agents_user_id_key` on `engine.agents(user_id)`. Founder-run FIRST (apply-order
   law, §4 below). In-file: the at-tip/no-register-row derivation, the ⚠
   first-engine-plane-file disclosure, the 0·0 dedupe witness named as the
   CREATE's precondition with STOP instructions, provenance (ENGINE_SCHEMA.md
   :54–:66), and the conditional-withheld revert one-liner, commented.
2. **`src/api/middleware/agentBridge.js`** — F1 arm (a): the step-2 agents write is
   now `upsert(…, { onConflict: 'user_id', ignoreDuplicates: true })`; the racing
   loser re-reads by user_id and adopts the winner's row; the `agent_owner` insert
   is WINNER-ONLY (the loser-safe clause). A vanished-row re-read throws loudly,
   never guesses.
3. **`src/engine/src/core/signup.ts`** — createOwner RULED IN, same (a)-shape: the
   agents insert is the same upsert; the loser adopts the ELDEST agent (the file's
   own returning-user read, so the two paths cannot disagree); owner anchor
   winner-only. **SEMANTICS DISCLOSED:** the racing loser now returns
   `existed: true` (the agent did exist — the winner minted it); the winner and
   every non-raced call return exactly what they always did. `/signup`
   (server.ts:286) echoes the object; nothing else reads `existed` in this repo.
4. **`src/lib/vendorInbound.js`** — F2 arm (b): the `:1399` resolve now runs
   through `resolveAgentOrDegrade` (module-level, exported for the bench —
   R-29.34's callable doctrine). Loud-first unconditional
   `[agent:resolve] RESOLVE FAILED` log (the binding clause); pre-onboarding
   rethrows into the ruled dead-letter (F3 as-is); otherwise the tier's DIAL is
   probed and a zero dial degrades to the shipped `WA_CAP_ZERO_LINE` (audited on
   public.messages + conversations), any open dial rethrows to the hiccup. Probe
   failure rethrows the ORIGINAL error. **EXPECTED-ZERO HELD** — zero new
   vendor-facing bytes; the refusal is the shipped, vetoed line.
5. **`scripts/b05_f0583_race_bench.js`** — the concurrency proof, §3 below.
6. **`scripts/floor-manifest-r365-race-fence.txt`** — this delivery's [F-14.16]
   file table (this document included).

## 2 · ONE DECLARED DEVIATION — RATIFY OR REVERT
**The degrade's predicate is the DIAL, never the tier WORD.** The ruling's arm was
"(b) with the tier-scoped degrade"; as proposed at the read-first that predicate
was `tier === 'basic'`. Built instead: degrade iff the vendor's tier DIAL reads
zero — probed through `buildMeta` itself with `NO_AGENT_USAGE_PROBE` (a uuid
owning no usage rows, so `capped` reduces exactly to `dayCap===0 || monCap===0`;
bench cell 6.7 asserts the reduction). TWO REASONS, both already on the record:
chat.js's own WA_CAP_ZERO_LINE doctrine ("a vendor on ANY tier whose dial the
founder set to zero deserves the same true sentence"; a tier-word predicate is a
rename's hostage — 0115), and the ruling's own sentence that the cap-0 refusal
"is derivable pre-resolve." Practical difference today: a zero-dialled non-basic
tier ALSO degrades truthfully (cell 6.5a); every open-dialled tier still gets the
hiccup, so no paying vendor is told a false cap. **REVERT IS ONE LINE** if the
chair keeps the literal arm: replace the probe block's predicate with
`(vendor && vendor.tier) === 'basic'` — the bench's 6.5 cells then need their
ruled expectations flipped, and that edit is the chair's to order.

## 3 · THE BENCH — 35/35 GREEN, NON-VACUOUS BOTH WAYS IN ONE FILE
`node scripts/b05_f0583_race_bench.js`. The fixture DB models the POST-0129 world
(the ruled apply order); a barrier holds every agents WRITE until both concurrent
step-2 READs have landed — the exact production interleaving (15–172ms pairs).
- **§2** the race on the shipped bridge: ONE agents row, BOTH callers the same
  agentId, ONE owner row; serial idempotence; F-05.47 and missing-authUserId
  fences intact.
- **§3 UNCURED CROSS-CHECK:** `git show c7c1be1:…agentBridge.js` loaded beside the
  original — the identical race REDS (the loser's bare INSERT takes 23505). A git
  show failure REFUSES loudly, never skips.
- **§4/§7 MUTATIONS ON PRODUCTION SOURCE** (comment-stripped first, F-06.192; the
  stripper carries its canary + §0.Z invocation cell): ignoreDuplicates flip,
  re-read severed, winner-guard dropped, pre-onboarding rethrow severed,
  loud-first log severed, dial predicate loosened — six arms, each convicts.
- **§5 createOwner on TWO LEGS:** the REAL compiled dist (cache-poisoned
  `db_js_1.supabase` — a property read at call time) AND a transpile of the real
  source; divergence is a stale-dist red by construction. Producible race
  fixture: engine.users pre-exists (WA-born through the bridge), then a
  double-submitted web signup. Uncured signup REDS; two source mutations
  convict; the returning-user path is untouched (eldest, existed:true, zero
  writes).
- **§6** the degrade cells: pass-through, dial-zero degrade (byte-equal
  WA_CAP_ZERO_LINE, messages audit, both loud lines), open-dial rethrow,
  pre-onboarding rethrow, the doctrine cell, probe-failure→ORIGINAL, and the
  probe-reduction matrix (0 / absent→25·250 defaults / negative→default).

## 4 · FOUNDER STEPS — NUMBERED, AND THE ORDER IS LAW (R-36.5)
`onConflict: 'user_id'` has no arbiter until 0129 exists; code-first errors every
first-touch. So: **(1)** run 0129 in the Supabase editor (the file ships in this
ZIP; its precondition is your own 0·0 witness, named in-file). **(2)** run the
verify SELECT (pg_indexes; provenance in-comment beside it in the chat packet) and
STOP on anything but one row `agents_user_id_key`. **(3)** git push. **(4)** smoke:
one WhatsApp message to Victor from 9888294440 — a reply landing is the resolve
walking its new path live (declared, not claimed: the walk is the witness).

## 5 · FLOOR — NAMED BASE, BEFORE AND AFTER
BEFORE (`--check`, clean tree at c7c1be1): the 21 reds of scripts/floor-base.txt
BY NAME, `FLOOR = NAMED BASE, no delta`, exit 0. AFTER (`--delivery` this
manifest `--check`): same 21 by name, declared files unmoved (set AND contents),
exit 0. ONE INTERIM DELTA, CURED IN-SITTING: the new bench imported the stripper
without the canary/§0.Z cell and `b07_f0774_stripper_bench` reddened — that is
F-07.99's coverage law working; the bench now carries both and f0774 is 19/19
again. NOTE: both floors ran SIBLING-ABSENT (dreamos-pwa not beside this clone);
the named base matched anyway, so no cross-repo refusal is in either set — but a
sibling-full re-run on the founder's clone is the stronger measurement if any
delta ever appears here.

## 6 · FLAGGED FOR THE CHAIR'S INK (zero bytes moved by this seat)
- **ENGINE_SCHEMA.md's header** truthfully said the ladder has never touched the
  engine plane; 0129 ends that sentence's truth. The header is hand-authored
  under CE lift — the amendment is the chair's.
- **The mirrors** F-05.85 / F-05.86 / F-08.103 stand OPEN as board-entered; the
  engine.users existence-proof technique is on the record for their sittings.
- **F-05.84** stays OPEN, cure re-pointed at the dark onboarding gate's sitting;
  cells 2.6 and 6.4 hold its ruled dead-letter shape in place meanwhile.
