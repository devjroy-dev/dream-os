# TDW_19 P0-B · HANDOVER (dream-os) — STEP 1 OF 5: THE CONTRACTS

**Seat:** LE, P0-B · **Chair:** CE-38 · **Sitting date:** 2026-08-28
**Governing kickoff:** TDW_19 P0-B, packet `906ef15b0b19fa9d31079cd74165f61d59c3a32902113ad445265a5028589cf2`
**Built on:** `dream-os` `aeca43f` (origin/main) · sibling `dreamos-pwa` `b251600` (origin/worklist)
**Ruled by:** CE-38 relay #1, items 1–7 and the `/v/` ruling.
**State:** kickoff §4 item 1 COMPLETE and gated. Items 2–5 not started.

This file touches neither `FINDINGS_LOG.md` nor the masterplan. Findings raised
here are stated for the chair to file.

---

## §1 · WHAT LANDED

Two files, both new, both under one new directory. No existing file was edited —
**including `core.js`**, whose one-line mount belongs to kickoff §4 item 2 and is
not in this step.

| Path | Lines | What it is |
|---|---|---|
| `src/api/vendor/solutions/contract.js` | 314 | The wire contract's backend mirror: 12 JSDoc typedefs, the runtime `SHAPES` table, `shape()`, the digest, the subdomain mirror |
| `src/api/vendor/solutions/env.js` | 148 | Spec §8 as code: ten keys, `gates()`, `gbpQuotaApproved()`, `keyReport()` |

Zero DDL. Zero migrations. **No table is read and no column is named** — the
candidate DDL in spec §4/§5 is not chartered and nothing here anticipates it.

---

## §2 · THE CROSS-REPO MIRROR, AND HOW IT IS KEPT HONEST

`dreamos-pwa/lib/solutions/types.ts` is the authored home of these shapes. Two
repos cannot import from each other, and a mirror nobody checks is two homes
wearing one name.

**The check is a digest.** Each repo renders ITS OWN declarations canonically —
`TypeName{field,field,…}`, fields sorted, types sorted, newline-joined — sha256s
it, and compares to a literal it carries. The two literals are the same 64
characters. Neither repo reads the other.

```
CONTRACT_DIGEST = e31a1a2414ee3cb6e95a83c2fbb536cf80a20df4f4f614098e7e6b663b55f650
```

Derived, not typed. Both halves were computed independently BEFORE either
literal was pasted, and agreed:

```
$ node tools/bs_audit.mjs --print-digest                      # in dreamos-pwa
e31a1a2414ee3cb6e95a83c2fbb536cf80a20df4f4f614098e7e6b663b55f650
$ node -e "console.log(require('./src/api/vendor/solutions/contract.js').computeDigest())"
e31a1a2414ee3cb6e95a83c2fbb536cf80a20df4f4f614098e7e6b663b55f650
```

**12 shapes, 60 fields.** The seven R-19.3 payload types plus five named
supporting shapes (`SolutionsIndex`, `SolutionsRow`, `SeoChecklist`,
`SeoTopQuery`, `BenchmarksReport`). The supporting five exist because the parse
contract forbids inline nested object literals — a nested shape gets a name, so
the instrument can be sound.

### ⚠ WHERE THE DIGEST STOPS LOOKING, stated because a gate that overclaims is worse than none

**The digest is over FIELD NAMES ONLY.** A rename is caught. A RETYPE is not —
`number` to `string`, a union member added — because the TypeScript text in one
repo and the JSDoc text in the other will never match byte for byte, and a
comparison that fails on correct trees is a comparison that gets switched off.

That leaves one class open that actually matters: **the money unit**. R-19.3
fixes every money field as a paise integer, and a silent retype to rupees would
pass the digest. So that class gets its own cell on both sides, keyed on the
NAME: anything matching `price|amount|fee|cost|rupee|inr|paise` must end in
`Paise`. It reddens on `priceInr` (proven below, M2).

---

## §3 · `shape()` REFUSES EXTRA FIELDS, NOT ONLY MISSING ONES

Spec §5's bench note carries P3's lesson: *the fake refuses unknown fields.* A
validator that checks only for missing keys passes a response that has quietly
grown a field nobody agreed to — and the field becomes real by being consumed.

Witnessed at the moment of writing:

```
exact         {"ok":true, "missing":[],             "extra":[],        "reason":null}
missing one   {"ok":false,"missing":["generatedAt"],"extra":[],        "reason":null}
extra one     {"ok":false,"missing":[],             "extra":["leaked"],"reason":null}
unknown name  {"ok":false,"missing":[],             "extra":[],        "reason":"unknown shape: Nope"}
array         {"ok":false,"missing":[4 fields],     "extra":[],        "reason":"not a plain object"}
```

The doors (step 2) treat `missing` and `extra` as the same failure.

---

## §4 · `env.js` — AND THE ARITHMETIC THAT DOES NOT CLOSE

R-19.5 asks for "the six keys from spec §8" and a `gates()` over P1–P6.
Re-derived at origin, **spec §8 is six ROWS but TEN KEYS, and they cover P1 and
P2 only.** P3–P6 have no gate key anywhere in the spec. CE-38 relay #1 item 3
accepted the cure as proposed.

`UNKEYED_PHASES = ['p3','p4','p5','p6']` are `false` **by declaration, not by a
missing key** — those are different facts, and the comment at the head of the
file names spec §8 as the amendment site. **The honest cost, recorded:** this
file cannot be edited into making P3–P6 live. The spec table has to grow first.
That is the intended friction, not an oversight.

Witnessed:

```
bare env       {"p1":false,"p2":false,"p3":false,"p4":false,"p5":false,"p6":false}  quota=false
P1 keys set    {"p1":true, "p2":false,"p3":false,"p4":false,"p5":false,"p6":false}
KEYS.length    10
keyReport leaks a value?   no — presence booleans only
```

**No key value ever leaves this file.** `INTEGRATION_TOKEN_KEY` is an AES-256
secret and `RESELLERCLUB_API_KEY` spends the founder's money; the exported
surface returns booleans of presence, so a door cannot echo either into a
response body even by accident.

### Two `optional: true` marks, and they are not the same kind of claim

- **`GBP_QUOTA_APPROVED`** — spec §8's own row reads *sync calls withheld until
  true*. It gates the SYNC, not the row. A vendor can complete the OAuth grant
  while quota is pending, and reporting P1 dead because Google has not answered
  an application would tell her the wrong thing about her own product. Exported
  separately as `gbpQuotaApproved()`. P0-A AMENDMENT 3 records why it will be
  false for some time: TDW's profile was created 2026-08-28 against a 60-day
  prerequisite, so submission is not possible before ≈ 2026-10-27.
- **`VERCEL_TEAM_ID`** — ⚠ **OPEN QUESTION, not a fact.** Marked optional on
  this seat's belief that Vercel's API takes `teamId` only for team-scoped
  projects and a personal account has none, so requiring it would make P2
  permanently dead on a hobby-plan project. **No derive stands behind it.** Per
  the P0-A ledger's own distinction (AMENDMENT 2), an unwitnessed belief does not
  get to bind a charter. P2 re-derives before it ships; the cure if it is wrong
  is one word in the `KEYS` table.

---

## §5 · THE SUBDOMAIN MIRROR (CE-38 relay #1 item 4)

`vendors.routing_handle text` is **nullable, no default**
(`docs/db/PUBLIC_SCHEMA.md:1130`; UNIQUE `vendors_routing_handle_key` :1883) and
is minted **uppercase** (`src/agent/onboarding.js:174-192`; the change tool at
`src/agent/engine.js:1270` uppercases too). So `DEV550` is the stored byte,
`dev550.thedreamwedding.in` is the address, and a vendor mid-onboarding has
neither.

**The witness was itself tested before it was cited.** `PUBLIC_SCHEMA.md` carries
its own staleness rule; snapshot tip is `0125` and `db/migrations/` holds
`0126`–`0129`. Grepping each for `ALTER TABLE`/`CREATE TABLE` targets returns
`public.couple_bookings` and `public.engagements` only — **none touches
`public.vendors`**, so the witness is valid for this column.
`OUT_OF_ORDER.json` holds no outstanding record.

The parity contract is a **fixture of literals**, mirrored verbatim in both
repos. Each side asserts its own implementation against the same expected values,
so neither repo reads the other and a change to either implementation reddens
that side alone. Six cases: uppercase, already-lowercase, hyphenated, padded,
empty string, null. `all 6 cases agree with the pwa fixture literals`.

The root is env-first — `STOREFRONT_ROOT_DOMAIN` with R-19.4's ruled literal as
fallback, so a missing key cannot produce `dev550.undefined`.

### ⚠ REPORTED, NOT ADAPTED (§0.2) — offered once, built as ruled

The mirror was built exactly as CE-38 ruled. The observation the chair may want:
**the door already returns `subdomain` on `DomainStatus`**, so a surface that
renders only what it was handed needs no client-side copy. The pwa copy does earn
its place at `/v/[code]` and wherever the address is shown before the door
answers — so this is an observation, not an objection. If the chair wants the
mirror collapsed to the backend alone, that is one word and the block plus its
fixture come out together.

---

## §6 · GATE

```
node --check src/api/vendor/solutions/contract.js      OK
node --check src/api/vendor/solutions/env.js           OK
floor --delivery <manifest> --check                    FLOOR = NAMED BASE, no delta   (exit 0)
  [F-14.16] 1 dirty path, declared: src/api/vendor/solutions/
  [F-14.16] declared files unmoved — set and contents both verified.
  20 named reds, 153 benches
tree after floor                                       ?? src/api/vendor/solutions/   (unchanged)
```

`b43_solutions_doors_bench.js` is **step 2's**, not this step's. It is not in this
ZIP and no count is claimed for it. The number is CE-38's (`b39` verified taken
at origin — and doubly so: `b39_telemetry_bench.js` and
`b39_worklist_today_bench.js` both sit in `scripts/`; noted, not chased).
`b43` verified free.

### Non-vacuity, by mutating production source

Backend half, each mutation restored and the restore verified byte-identical:

| # | Mutation | Result |
|---|---|---|
| B1 | a field added to `SHAPES` on the backend side alone | `DIVERGE — literal e31a1a2414ee… computed e927b0b25d85…` — the drifting side reddens alone, exactly as designed |
| B2 | `shape()` against exact / missing / extra / unknown-name / array | all five verdicts correct, table in §3 |
| B3 | `subdomainFor` against the six fixture literals | all agree |

---

## §7 · FINDINGS RAISED THIS STEP

### F-19.16 · THE PWA FLOOR CANNOT BE MEASURED ON ANY DELIVERY TREE — and it is not this delivery's defect

**OPEN. Not mine to cure; stated for the chair.**

The first pwa floor run of this sitting reported a delta:

```
RED: tdw_f0774_vacuity_probe
22a23
FLOOR DELTA — the diff above is this delivery's to explain
```

**Derived, not assumed, in three steps.** A warm re-run reproduced it, so it is
not Lesson 1's cold-resolution artifact. Run standalone with this delivery's
files present, the bench prints its own refusal:

```
STOP — the tree is dirty. This probe writes to production source and
restores it; on a dirty tree it cannot prove the restore was clean.
```

Removing this seat's entire footprint (`lib/solutions/`, `tools/bs_audit.mjs`)
and re-running the same bench: **exit 0, GREEN.** Re-running the whole pwa floor
on that pristine tree: **`FLOOR = NAMED BASE, no delta`.**

So the red is the bench refusing the *delivery tree itself*, and this delivery
contributes zero floor movement.

**This is F-14.16's class, in the repo whose runner was said not to have it.**
`dream-os/scripts/run-floor.sh`'s own header states: *"`dreamos-pwa`'s runner
never had this gap — it has ORDERING, not refusal."* That is true of the pwa
RUNNER and false of the pwa FLOOR, because a pwa BENCH carries the refusal
instead. The effect at delivery time is identical: **a delivery tree is dirty by
definition, R-33.7 forbids the executor the commit that would clean it, and so
the pwa floor cannot gate the one tree it exists to gate.** This binds every pwa
seat, including M-FINISH S2 right now — not only this one.

`grep -rln "tree is dirty\|Commit or stash" scripts/` returns exactly one file,
so it is one bench today, not a class of many. That is what makes it cheap to
cure.

**Three cures, chair's to rule, none taken here:**
1. Give the pwa runner `--delivery <manifest>`, ported from `dream-os` where it
   already works. Cures the class.
2. Give the one bench a declared-dirt escape of its own. Cures the instance.
3. Leave it and require every pwa delivery to state the measurement method used.

**The method used for this delivery's honest number**, so it is reproducible: the
footprint was moved aside, the floor measured on the pristine tree, and the
footprint restored — with `git status` printed before and after and
`bs_audit.mjs` re-run green afterwards to prove the restore.

### F-19.15 · carried, not raised here

`public.invoices.amount_total` is a rupees integer
(`docs/db/PUBLIC_SCHEMA.md:626`) and this rail is paise. Named in `types.ts` and
`contract.js` at the site so P2 inherits it rather than discovering it. CE-38
relay #1 item 5: P2's pass-through line converts at the invoices room's own write
door, never on write from here. No change to R-19.3.

---

## §8 · WHAT STEP 2 INHERITS

- The mount is **one line in `core.js`** — the only S2-adjacent backend touch,
  and it is `dream-os`, not pwa. Not taken this step.
- Every GET returns the contract's empty shape for the resolved vendor, behind
  `resolveVendor()` (mode 1 — JWT→vendor, no URL param). Its header is at
  `src/api/middleware/resolveVendor.js`, **not** `src/middleware/` as the kickoff
  read — c-38.5.
- `domain` → `{status:'none', subdomain: subdomainFor(req.vendor.routing_handle)}`.
  Every other field of `DomainStatus` null/false per the contract.
- Every POST ships **fully commented with the uncomment step stated** —
  conditional-withheld, each waiting on a key in spec §8, and `gates()` is how a
  door knows.
- `b43_solutions_doors_bench.js` over real HTTP through `resolveVendor` on the
  fake; `shape()` asserted on every response; count declared, non-vacuity by
  mutating production source.
- ⚠ Bench numbering: `b40`, `b41`, `b42` are reserved to P1, P2, P3 by spec
  §4–§6 and are free in `scripts/` today. Do not take them.
