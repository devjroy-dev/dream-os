# CE-41 · F1b — THREE DOOR-SIDE CURES · HANDOVER

**Cut at `c52e92a68889f8ad88f6822426061f9471cd61b9` (dream-os).** Seat: CE-41 LE-F.
Seven files. **No migration** — no schema, no seed, no `PUBLIC_SCHEMA` regen.
**No engine byte** — `src/engine` is untouched and asserted so.

---

## 0 · THE PREMISE THAT WAS WITHDRAWN, RECORDED FIRST

F1b was very nearly a same-provider write guard and a warning note on every Donna
switch. It is not, because the mechanism behind it was wrong: **`c-41.50`** — sharing
Victor's transport does not empty the hand ledger. `donna.ts:455` records every hand
on one shared recorder with no transport branch, and `loop.ts:821–826` maps them
nested unconditionally. What zeroed the hands at 04:37 was the **advisor room**,
which carries no `dear_donna_talk` at all (`loop.ts:567–575`), so the guard's census
was empty by construction. At 04:42 the same vendor in business mode answered fine,
and the 25 basic-tier vendors have been answering all along.

Recorded because the guard would have put a false mechanism on the founder's glass
and left it there, and because two of my three objections to it were right for a
reason I did not have — **there is no defect in sharing at all.**

---

## 1 · F-41.96 — AN ANTHROPIC DONNA NEEDS A WIRE OF HER OWN

**The defect.** `chat.js` set `donnaTransport = undefined` for an explicit Anthropic
Donna, on the reasoning that no transport means her own pre-facade Haiku path. That
holds only when **Victor is also Anthropic**. When he is not, the engine reads
`args.donnaTransport ?? (providerDowngrade ? undefined : (transport ?? undefined))`
(`loop.ts:728`) and `undefined` falls through the `??` **to his wire**.

So the founder's 04:37 flip — Donna to Anthropic on the advisor lane, where Victor is
DeepSeek — **landed in the row and never reached the transport.** She kept answering
on DeepSeek. R-41.87's line printed `provider=anthropic` because it was printing the
**route**, which was true, while the wire was something else.

**The cure, door-side only.** The `donna_provider === 'anthropic'` special case is
gone: any Donna whose provider differs from Victor's now gets an explicit transport
built exactly as the non-Anthropic arm always built one. The `??` in `loop.ts` is left
alone and simply stops being reached — the smaller change, and it keeps the seam where
the engine seat put it.

**When Victor is already Anthropic** the outer `!==` guard means the branch is never
entered: both hands ride the same native path, neither has a transport object, and
that is correct and unchanged. Named in-comment beside `c-41.50` so the next sitting
does not re-derive the withdrawn cure.

**R-41.87 now names the wire, not the intent.** The line moved below the wiring and
gained a `transport=` field:

```
[model] surface=wa_vendor tier=advisor role=victor provider=deepseek  model=deepseek-v4-flash transport=facade
[model] surface=wa_vendor tier=advisor role=donna  provider=anthropic model=claude-haiku-…    transport=facade
```

- `facade` — a transport object of this hand's own
- `native` — no object because the provider *is* Anthropic; the right absence
- `shared` — no object of her own, so the `??` hands her Victor's wire

After this packet `shared` can only occur when Donna has no split at all, and then no
donna line prints. **So `shared` appearing beside a named provider is itself a
finding**, and the line is built to be able to say it. That is the whole lesson of
04:37: an instrument that reports the intent cannot witness the wire.

Five cells (§9) and three mutations (M19–M21).

## 2 · F-41.93 — THE STAMP BELONGS TO THE HAND THAT MOVED

`changed_at` / `changed_by` were row-level, and the panel rendered them beside every
hand — so flipping Donna made **Victor's** line read `changed 9 Sept`, attributing an
edit to a hand that had not moved. Visible on the founder's own walk.

Each role now carries `changed_at_<role>` / `changed_by_<role>`, served as a
`roles_changed` map so the panel loops roles instead of naming them. The row-level
pair is still written and still served, because rows written before F1b carry it and
must keep whatever truth they have. The six new field names join the known set, so
they never render as unknown junk on the glass, and the router still ignores all of
them. Five cells (§10), three mutations (M22–M24).

**F2b reads this.** Until then the panel shows the row-level stamp on both hands —
the defect stands on the glass until its other half ships.

## 3 · THE BRIDE APP LANE — the one lane that is not a row

Eliza in the couple's own app reads `BRIDE_LLM_PROVIDER` off the environment and falls
to Anthropic when it is unset, empty or unknown. It is registered in `LANES` with
**no roles**, so the write door refuses it before it can reach a row that does not
exist; the read door derives its value by **importing** `resolveBrideProvider` and
`wireModelFor` rather than re-deriving the env, and serves `provenance: 'server'` — a
fifth word beside `default · borrowed · seeded · changed`, and the only one that
answers *where did this come from* with somewhere that is not a row.

**This is the line seat E's §D-34 was reaching for** when it marked the *couple* lane
`Set on the server`. `model.wa_couple.default` is a real row and stays switchable
(R-41.103 ②); this is the genuine env lane. Five cells (§11), three mutations
(M25–M27).

## 4 · `c-41.53` — THE BLANK MODEL, SELF-CAUGHT

`wireModelFor` takes the wire string off `CONF`, which is right, and `CONF` is
asymmetric: `deepseek.model` is `(m) => m || 'deepseek-v4-flash'` and answers, while
`anthropic.model` is `(m) => m` and returns the **empty string** when called with `''`
— which is how the bride client calls it. The read door would have served
`{provider: 'anthropic', model: ''}`: the provider true, the model blank.

**It would never have been seen.** The panel renders providers, not models, so the
blank never reaches the glass, and no cell asked because the thing the founder
switches was correct. True where anyone looks, empty where nobody does.

Caught while benching §11. The first cure wrote `provider === 'anthropic' ? HAIKU : null`
and **the one-home cell refused it** — a provider literal in this door is the first
brick of a second routing map. The shipped cure is a lookup, not a branch:
`wireModelFor(provider) || SWITCHABLE[provider] || null`, which names no provider and
no model and answers for any provider the set gains tomorrow. Two cells, one mutation
(M28).

---

## 5 · PROOF

- `b63_f1_model_routes` **57/57** cured · **43/57** at the uncured tree.
- `b63_mutations` **30/30**.
- Floor: **23 RED/ERROR + 4 refusals** against a base of 21. **By name:** 2 above
  (`b39_telemetry_bench`, `b61_mutations` — A10's, both re-run RED at the uncured tip
  with `node_modules` resolving), **0 below**. **F1's two cures held**: `b62_g34_s2`
  and `tdw10_combined_cap` are green in the tree and no longer above the base.
- Batched per R-40.63; the founder's single invocation is the floor of record.

**Four mutation anchors had vanished and the harness said so.** F-41.96 moved the
R-41.87 block below the wiring and gave both lines a `transport=` field, so M10, M11,
M16 and M16b matched **zero** times. The harness prints `??` rather than a pass for a
target it cannot find — which is the only reason this was visible. All four
re-derived. **This is `c-41.40`'s class one repo over**, and it is the argument for
that convention: a mutation whose anchor has drifted is silently vacuous in any
harness that treats "did not fail" as "passed".

---

## 6 · THE WALK — 04:37 REDONE

The point is the `transport=` field, which did not exist when the founder walked.

1. **Switchboard → Model routes → Answer vendors on WhatsApp → Advisor → Donna →
   Anthropic.** Victor is DeepSeek on that lane, so this is exactly the state that
   silently failed.
2. Send DEV440 a WhatsApp message that makes Victor ask her something. Railway now
   prints two lines, and Donna's reads `provider=anthropic … transport=facade` —
   where before the flip reached the row and stopped.
3. Switch her back; her line reads `provider=deepseek … transport=facade`.
4. Remove her split entirely and the donna line disappears — she is following him,
   and the absence is the record.

**Advisor mode is not required this time.** Business mode on Essential works the same
way and is the more ordinary path; advisor is named because it is where the defect
was found.

---

## 7 · OPEN

1. **F2b** — F-41.94's flat-row overflow at 374, the per-role stamp read, and the
   `c-41.51` / `c-41.52` re-numbering in `TDW_CE41_F2_HANDOVER.md` §1a and §8, with
   §8's paragraph amended to record the reassignment under **F-41.97** rather than
   silently rewriting it. Derived at origin: both replacements are free on both
   repos, and the fuller search found **one** collision, not two — only `c-41.40` is
   held elsewhere (seat D, `c52e92a`); `c-41.41` is held by no one but my own F2
   commit. The pair moves together anyway, so a reader does not have to know that.
2. **The basic-tier finding still needs a number** — 25 of 29 vendors, no row, no
   default, visible on the panel where the founder decides.
3. **`model.pwa_vendor.trial`'s retirement** — dead by constraint and by data.
4. **`scripts/floor-base.txt` 21 → 23**, or A10's two ride every packet from here.
5. **R-41.89's pre-existing persona debt** — two pwa files, counted on every b61 run.
