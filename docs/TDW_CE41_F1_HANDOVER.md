# CE-41 · F1 — MODEL ROUTES · HANDOVER (F0's census folded in)

**Cut at `0b27cc67a0bfe3dfc7bc5c9b57bb532df24dd67e` (dream-os).** Sibling
`dreamos-pwa` at `034426fd956216cdebaca58ff490471fdc00a643` — read only; no pwa byte
in this packet. **Migration `0153`**, number derived at the cut by
`git ls-tree --name-only 0b27cc6 db/migrations/` (tail `0152`), never claimed.
Seat: CE-41 LE-F. Chair rulings 1–7 of the first reply, plus the four of the third.

The F-41.60 rider `1a37bbc291f976a5c34889f44b923b92feaa828b` is an ancestor of this
tip — verified by `git merge-base --is-ancestor`, not accepted on report. My radius
is byte-untouched by it.

---

## PART ONE · THE CENSUS (F0, folded)

### The truth of record

The founder's `SELECT` of 2026-09-08, eight rows, `LLM_PROVIDER` and
`BRIDE_LLM_PROVIDER` both unset. **The seed migrations are history and disagree with
the database on three keys.** Everything below is derived against the rows.

```
model.harvest.default       {"provider":"deepseek","model":"deepseek-v4-flash"}
model.pwa_vendor.advisor    {"provider":"deepseek","model":"deepseek-v4-flash"}
model.pwa_vendor.essential  {"provider":"anthropic","model":"claude-haiku-4-5-20251001","donna_provider":"deepseek","donna_model":"deepseek-v4-flash"}
model.pwa_vendor.prestige   { … same shape … }
model.pwa_vendor.signature  { … same shape … }
model.pwa_vendor.trial      { … same shape … }
model.wa_couple.default     {"provider":"anthropic","model":"claude-haiku-4-5-20251001"}
model.wa_marketing.default  {"provider":"anthropic","model":"claude-haiku-4-5-20251001","nudge_provider":"deepseek","nudge_model":"deepseek-v4-flash"}
```

### Every reader, by file:line (unchanged at this tip)

`modelRouter.js:187` is the **sole SQL read** of any `model.*` key in the estate.
Consumers: `chat.js` (`buildLlmForTurn`, both vendor doors) · `vendorInbound.js:1668`
· `closerEngine.js:1135` · `engine.js:351` · `harvest.js:122` ·
`brideLlmClient.js:51` (env, not a row). **No writer existed in `src/`** before this
packet — only `admin/config.js`'s generic PATCH, which 404s on a missing key.

### F-41.36's live radius — two provider disagreements, four undeclared splits

| Key | Live | Code | What a deleted row would cost |
|---|---|---|---|
| `model.pwa_vendor.essential` | anthropic | **deepseek** | Victor silently moves to DeepSeek |
| `model.harvest.default` | deepseek | **glm** | harvest silently moves to GLM — a provider in no other live path |
| four `pwa_vendor` tiers | `donna_provider: deepseek` | *no such field anywhere* | Donna silently follows Victor to Haiku |

Both provider rows fail **towards a provider the founder did not choose**. The
`donna_provider` split is live on four rows, appears in no code default and in **no
migration** (`git grep -n donna_provider -- db/migrations` returns only 0111's prose).
**GLM is in no live path.** B4·5 §3's GLM derivation was right against code and is
overtaken by the rows.

### THE BASIC TIER HAS NO ROUTE — the census's largest finding, still unnumbered

`vendors.tier` defaults to `basic` (PUBLIC_SCHEMA.md:1370) and `vendors_tier_check`
admits four words. **0115 renamed the trial tier to basic** — `0115:104`
`UPDATE public.vendors SET tier='basic' WHERE tier='trial'`, `:118-120` the CHECK. It
rebuilt the four cap keys deliberately (`:137-162`) and **left the route key behind.**

So `model.pwa_vendor.basic` exists in neither the database nor the code matrix, and
every basic vendor resolves on the bare literal at the foot of `resolveModel` —
Haiku, **with no donna split**. Donna is Anthropic on the basic tier and DeepSeek on
all four others. Nothing has ever said so. **The chair mints the number.**

Companion: **`model.pwa_vendor.trial` is a live, well-formed row no code path can
ask for** — the CHECK forbids the tier and `readVictorMode` returns only
`advisor`/`business`.

**Owed, one founder-run block:**

```
select tier, count(*) from public.vendors group by tier order by tier;
```

---

## PART TWO · WHAT F1 SHIPS

### 1 · F-41.46 — the borrowed lane, split off (`modelRouter.js`, `chat.js`, `vendorInbound.js`)

The WhatsApp vendor door has always routed on `model.pwa_vendor.<tier>`: two wires,
one switch, only one of them labelled. It now names `wa_vendor`, and a `wa_vendor`
key **with no row delegates to its `pwa_vendor` twin**.

**The trap this cure had to avoid, stated because it is one argument away:**
`DEFAULTS` holds no `wa_vendor` entry, so a naive miss lands on the literal —
anthropic/Haiku, no split — which would have **silently retired DeepSeek from the
essential lane and Donna's split from all four, on the WhatsApp wire, on the day it
shipped.** The fallback therefore sits *before* the default matrix and fires only on a
genuine row miss. Benched both ways; `M1` is that exact defect and it reds.

Three further properties, each benched and each mutated:
- the resolved value caches under the **primary** key, so a later seed lands within a
  window rather than never (`M2`);
- `bustRouteCache` **cascades** to every lane borrowing the key just written —
  otherwise the panel and the wire disagree for up to 60s, which is R-39.15's subject
  (`M3`);
- `buildLlmForTurn`'s `surface` **defaults to the old literal**, so the PWA door is
  byte-identical and passes nothing.

The fallback fact lives once, in the lane registry, read by the builder and the door
through `fallbackSurfaceFor`.

### 2 · The lane registry, and why it is not `Object.keys(DEFAULTS)`

`LANES` carries the basic lane (in neither matrix nor database), the trial row
(`reachable: false`, with its reason in the row), and the `wa_vendor` lanes *before
any row exists*. Vendor tier words are **derived from `CANON_TIERS`** — the frozen
list the billing flip writes from and the four words the CHECK admits — not
transcribed. Today the two lists are equal, so the cell asserts the **derivation in
source** as well as the result; a result-only cell would have stayed green over a
transcription until the day a fifth tier arrives, which is precisely the day 0115
taught us this goes wrong (`M14`).

### 3 · `SWITCHABLE` — two providers, no minted string

Built from the existing `HAIKU_CLASS[0]` / `DEEPSEEK_CLASS[0]` constants six lines
above it, so no model name can be true in one place and stale in another (`M13`).
`glm` is absent by construction. **A live value outside the set is not rewritten:**
the write door refuses to PUT one, the read door renders one it *finds* read-only
with its real words. None exists today.

### 4 · The two doors (`src/api/admin/modelRoutes.js`, mounted beside seat C's)

`GET /api/v2/admin/model_routes` returns every lane with: its live row, its code
default, **which fields differ by name** (not a boolean — "a row I could delete would
move Victor" is a different sentence from "…would drop Donna's split", and both are
live), the router's own `effective` answer asked the way the wire asks it,
`has_row`, `borrowed`, `unknown_fields`, `outside_switchable`, the stamps, and
`updated_at`. `LLM_PROVIDER` comes back as a top-level banner.

`POST /api/v2/admin/model_routes/:key` takes `{role, provider, model?}` and:
- **read-merge-writes** — siblings and unknown fields carried untouched.
  `MAYA_MODEL_FLIP_FORMS.sql` Form A is the standing counter-example; `M4`/`M5` are it;
- **seeds an absent row from what is live, then applies the role.** Writing only the
  tapped role into a fresh row yields `{donna_provider, donna_model}` with no
  `provider` — which `parseRoute` rejects wholesale, so the row would exist, the panel
  would show it, and the router would ignore it. **A switch that appears to work and
  changes nothing is the worst outcome available here** (`M6`);
- refuses free text, unknown keys, unreachable rows, and roles a lane lacks;
- busts the cache and **reads the route back through the router**, so the response
  shows what the wire will do rather than what the glass hoped.

The door holds **no key, provider or model string of its own** — asserted as an
absence cell over comment-stripped source (`M15`).

### 5 · R-41.87 — the success path names the hand

One line per hand **inside `buildLlmForTurn`**, not at its three call sites:

```
[model] surface=wa_vendor tier=essential role=victor provider=anthropic model=claude-haiku-4-5-20251001
[model] surface=wa_vendor tier=essential role=donna  provider=deepseek  model=deepseek-v4-flash
```

The donna line prints **only when a split is live**, so its absence is itself the
record that she follows Victor — which is what the basic tier needs (`M10`, `M11`).

**Mira's half of the walk needed no new byte.** `closerEngine.js:1282-1290` has named
her mouth since F-08.72, and names the *called* provider beside the *routed* one,
which is stronger than R-41.87 asks. Derived, not assumed. `engine.js:353` covers the
couple lane. Only Donna was silent — her provider appeared solely in `donna.ts`'s
`[provider_downgrade]`, which fires when her hand **fails**.

### 6 · R-41.88 — one labelled cross-seat line

`whoFlipped` is exported from `src/api/admin/capabilities.js` and imported here.
`changed_by` and `changed_at` ride inside the value JSON because `admin_config` has
no columns for them (four columns, PUBLIC_SCHEMA.md:43-49). The door contains **no
hash of its own** — `M16` puts one there and reds; `M16c` removes the export and reds.
The withheld shape F1 first cut is retired per the chair's ruling. Benched that the
stamps pass through `parseRoute` unread and disturb no route.

### 7 · `0153` — four seeds, and two deliberate absences

Byte copies of the live `pwa_vendor` rows for `essential`, `signature`, `prestige`,
`advisor`. `ON CONFLICT (key) DO NOTHING` — a seed must never overwrite a value the
founder has since chosen (`M18`). **No schema moves; no PUBLIC_SCHEMA regen owed.**

Not seeded, each with its reason in the file:
- **`trial`** — copying a WhatsApp twin of an unreachable row is decoration (R-40.60);
- **`basic`** — **chair-ruled, and the right call.** Seeding it would be a live
  behaviour change wearing a migration's clothes: copy the trial row's shape and every
  basic vendor's Donna moves to DeepSeek tonight, decided by an executor. The panel
  shows the lane with `has_row: false`; the door creates the row *from what is live*
  on the founder's first tap. Nothing moves but the role he taps. `M17` reds.

---

## PART THREE · PROOF

- `b63_f1_model_routes` **40/40** at the cured tree · **1/40** at the uncured tree.
- `b63_mutations` **20/20** — every mutation edits production code in a scratch copy
  and must red its **named** cell; a mutation that reds something else has proven the
  tree fragile, not its cell.
- Floor: **23 non-green RED/ERROR + 4 env refusals**, against a base of 21.
  **Compared by name:** 2 above (`b39_telemetry_bench`, `b61_mutations`), **0 below**.
  Both were declared at A10 as arriving with 0152 / the F-41.59 rider, and both re-run
  RED at the uncured tip with this packet absent. **This is A10's floor exactly.**
  `FLOOR = NAMED BASE + A10's two, no delta.` The chair re-bases.

### The two benches this packet reddened, and carries the cure for

Neither was a defect in the tree. Both were **transcription cells broken by legitimate
movement** — F-38.27's exact lesson, which is why the protocol says a cure that changes
a line carries the bench that transcribes it rather than shipping a knowingly red floor
and calling it someone else's.

- **`c-41.35` · `tdw10_combined_cap` §1.6** held the WA door's call line as a literal
  marker. F-41.46 moved that line (it now names `surface: 'wa_vendor'`), so `indexOf`
  returned -1 and the cell's own "marker vanished" guard fired — the guard working. The
  cell's subject is unchanged and still true: the cap gate precedes the llm wiring. Only
  the spelling moved. Marker re-transcribed.
- **`c-41.36` · `b62_g34_s2` §1** asserted 0152 was **the ladder tail**. A tail
  assertion cannot survive the next migration; 0153 ended it, against a tree where
  nothing was wrong. That is a finding against the instrument, not the tree. The cell's
  real subject is that 0152 exists and nothing renumbered it, and that is what it now
  says — LD-8's append-only guarantee is unaffected, since a re-used number shows as two
  files sharing the prefix, which is the check. **Seat C's bench, edited by seat F:
  the chair reverses this if it prefers seat C to carry it.**

### Three disclosures about how the floor was derived

A hollow green is worse than a declared gap, so all three are here rather than absent.

1. **It was batched.** `scripts/floor-batch.sh 1..20 20`, not one `run-floor.sh`
   invocation. That file exists for this exact limit and states the rule: under R-40.63
   a seat runs a floor that fits its call, and **the founder's single invocation is the
   floor of record** — it is in the verify block. A first attempt at the single
   invocation was killed by the call limit; two detached retries were killed by the
   container without reporting either their death or their result, which is F-40.128
   reproduced rather than theorised.
2. **The batched pass has no discarded warm-up** (LESSON 1). Its risk is *extra* reds,
   never missing ones, and this tree had run most benches repeatedly before the measured
   pass. The 0-below-base result is the number that matters and is not the direction a
   cold-resolution artefact moves.
3. **My first "not mine" derivation was wrong, and I caught it by re-deriving.** I
   checked the four above-base benches against the uncured tree in a clone whose
   `node_modules` symlink I had broken by renaming its target. All four returned rc=1
   and I nearly reported all four as pre-existing. Two of them (`b62_g34_s2_bench`,
   `tdw10_combined_cap_bench`) were **green** there once the symlink was repaired —
   they were mine, and they are the two cured above. This is `tools/preflight.sh`'s own
   named failure class: a precondition wearing a defect's costume, one command from
   being nothing. **Error owned: had I not re-run it, this packet would have shipped
   two reds attributed to another seat.**

### `c-41.34` — my contamination, self-caught

The first killed floor left a mutation behind in
`src/engine/src/core/tools/recordPrimitives.ts`: `Rs ${inr(v)}` reduced to `Rs ${v}` —
a **wallet-law** violation in a file outside my manifest, from another bench's harness
dying mid-restore. `run-floor.sh --delivery` refused the next run and named it. I
reversed the edit rather than checking the file out (R-40.65) and re-derived the tree
as clean. Nothing of mine touched that file. Every later floor call ran to completion.

## PART FOUR · THE FOUNDER'S WALK (§7), AND WHAT IT WILL SHOW

Phone only, after apply + `0153` + deploy. **The switch is honest as "within 60
seconds", never "instantly"** — `bustRouteCache` clears *this* process's map and a
second Railway instance keeps its own until its window expires. The panel says so in
those words; F2 renders it.

1. Switch **Donna on WhatsApp** (`model.wa_vendor.<his fixture's tier>`, role `donna`)
   to Anthropic.
2. Send Victor one WhatsApp message that makes him ask her something.
3. Railway names her segment: `[model] surface=wa_vendor tier=… role=donna provider=anthropic …`
4. Switch back; the same line names `deepseek`.
5. Mira's nudge on the marketing fixture reads on the **existing** `[closer]` line —
   `route_provider` beside `called_provider`.

**If his fixture is on the `basic` tier, step 1 creates the row.** That is the design,
not a surprise: the door seeds it from what is live and moves only Donna. The `select
tier, count(*)` block above tells him which case he is in before he starts.

---

## PART FIVE · WHAT F2 PICKS UP, AND WHAT IS STILL OPEN

**F2 (pwa).** The panel, grouped by surface with tiers beneath (ruling 5), inside seat
E's E1 frame **if it has landed — it had not at `034426fd`**; the switchboard's last
move is C2 `da722fd9`. Else on the current card's tokens with seat E told. The data
serves both views. Seven-ink law; `tsc --noEmit` the seat's sweep, `next build` the
founder's gate. The PWA will hold **no list of keys, providers or models** — only the
founder's words per lane key, following the switchboard's `NAMES` precedent.

**Open, for the chair:**

1. **The basic-tier finding needs a number** — F0 §4, restated in Part One.
2. **`model.pwa_vendor.trial`'s retirement** — live, well-formed, unreachable. Filed,
   not done; it is now visible on the panel as read-only rather than silent.
3. **`select tier, count(*) from public.vendors group by tier` is still owed** —
   nothing in this packet depends on it, but the walk's first step does.
4. **`c-41.35` and `c-41.36`** — seat F edited two benches outside its own (both bench
   files, not doors). Both were broken by this packet's legitimate movement and both are
   cured here rather than left red. If the chair would rather seat C carried either,
   reverse the hunk and the floor grows by one named red.
