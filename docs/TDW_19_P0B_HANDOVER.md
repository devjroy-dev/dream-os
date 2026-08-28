# TDW_19 P0-B · HANDOVER (dream-os) — STEPS 1–2 OF 5: THE CONTRACTS, THE DOORS

**Seat:** LE, P0-B · **Chair:** CE-38 · **Sitting date:** 2026-08-28
**Governing kickoff:** TDW_19 P0-B, packet `906ef15b0b19fa9d31079cd74165f61d59c3a32902113ad445265a5028589cf2`
**Built on:** `dream-os` `aeca43f` (origin/main) · sibling `dreamos-pwa` `b251600` (origin/worklist)
**Ruled by:** CE-38 relay #1, items 1–7 and the `/v/` ruling.
**State:** kickoff §4 items 1 AND 2 COMPLETE and gated. Items 3–5 not started.
**Step 2 built on:** `dream-os` `b65b27a` · `dreamos-pwa` `7142cbf` (both pushed tips), siblings resolvable per c-38.12.

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

---
---

# STEP 2 — THE DOORS (kickoff §4-2, R-19.4)

## §10 · WHAT LANDED

| Path | Lines | Change |
|---|---|---|
| `src/api/vendor/solutions/index.js` | 375 | NEW — eight GETs live, POSTs conditional-withheld |
| `scripts/b43_solutions_doors_bench.js` | 388 | NEW — 35 cells over real HTTP |
| `src/api/vendor/core.js` | +6 | **EDITED** — the mount, one route line plus its reasoning |

The `core.js` edit is the **only** existing file touched by this seat in either
repo across both steps, and the kickoff named it as the one S2-adjacent backend
touch. It sits **above** the bare `router.use('/', require('./schedules'))`:
a root mount is reached for every path, so a segment router that needs to win its
own prefix belongs before it. Derived that `schedules` declares only
`/invoices/:invoiceId/schedule` and `/schedules/:milestoneId` routes, so there is
no live shadow either way — the ordering is defensive, not corrective.

**Still zero DDL, zero migrations.** One column is read across all eight doors:
`req.vendor.routing_handle`, which `resolveVendor` has already put on the
request. Witness and its staleness test are in §5 above.

## §11 · b43 — 35 CELLS, AND WHY IT DOES NOT REUSE b38's PATTERN

`b38` seats a `require.cache` stub for `resolveVendor`, because ownership was
scenery to what it tested. The kickoff asks for something stricter here: **over
real HTTP THROUGH `resolveVendor`.** So the real middleware runs against a
recording in-memory fake that answers the exact query chain `resolveUsersId` and
`resolveVendor` make — `users.auth_user_id`, the `users.id` legacy fallback, then
`vendors.user_id`.

**That is what makes §3 mean anything.** A stubbed `resolveVendor` cannot produce
a 403 — it would have to be *told* to, which proves nothing. The real one
produces it by failing to find a vendor row:

```
§3.1 no vendor row -> 403 from the real middleware      HTTP 403 "Not a vendor account."
§3.2 identity maps to no user -> 403                    HTTP 403
§3.3 restored -> 200 again (the guard is not sticky)    HTTP 200
§3.4 resolved BY JWT, not by a URL param                4 vendors read(s), filters: ["user_id"]
```

`requireAuth` **is** stubbed, and the distinction is deliberate rather than
convenient: it verifies a Supabase JWT signature against a live auth service —
a property of Supabase, not of this block, already asserted by every other door
bench. It attaches `req.auth` and nothing else, which is exactly what
`resolveVendor` consumes.

**The fake THROWS on any table it was not told about.** A door that started
reading `vendor_integrations` — a table with no DDL — reddens here rather than
500ing in production. §4.2 proves that refusal is real, so §4.1 is not vacuous.

Bench number is CE-38's (relay #1 item 2), and `b39`'s unavailability was
verified at origin: `b39_telemetry_bench.js` **and** `b39_worklist_today_bench.js`
both sit in `scripts/`. `b43` was free. `b40`/`b41`/`b42` remain reserved to
P1/P2/P3 by spec §4–§6.

**b43 runs on a dirty tree by design** — it reads no floor and mutates nothing at
rest, so the founder can satisfy the verify line at his apply moment, before
commit. See F-19.16 for what happens to benches that do otherwise.

## §12 · TWO DECISIONS INSIDE THE DOORS THAT ARE NOT OBVIOUS

**`/domain/search` returns an empty list rather than plausible suggestions.**
The registrar is not wired, so there is no availability to report and no price to
quote. This door could have returned realistic-looking domains at a
realistic-looking price and nobody would have noticed — and every one would be a
fabricated fact about a domain the vendor might try to buy, at a number that is
not the registrar's. It returns nothing and reports `live: false`.

**`/benchmarks` sends `mine: null` as well as `median: null`.** Sending the
vendor's own number would be perfectly safe — it is hers. But it would establish
the habit of putting a number on this wire before the cohort has been checked,
and P6 would inherit that habit against a five-vendor floor. `city` and
`category` are null for the neighbouring reason: naming a city beside `cohort: 0`
invites the surface to render *"Not enough vendors in Mumbai yet"* as though we
had counted Mumbai. We have not. P6 fills all three together or none.

**A contract violation is a 500, not a logged warning.** A door that logs the
violation and sends the body anyway has taught its caller the contract is
advisory. Proven by mutation N4.

## §13 · THE WITHHELD POSTS

Nine POST addresses are declared in comments with method, response shape, gate,
and an explicit uncomment step. **They are not draft handlers** — writing a body
now would be writing against a table that does not exist and a registrar that is
not wired. What is fixed is the address, the method, the shape and the gate, so
P1 and P2 inherit a decision instead of making it again.

Two warnings are planted at their sites for whoever uncomments them:

- **`POST /domain/register` spends the founder's money.** It owes an idempotency
  key on the registrar call before the first real request, or a retried POST buys
  the domain twice.
- **F-19.15 lands there too.** The pass-through invoice line converts paise →
  rupees at the *invoices* room's own write door. It does not convert in
  `solutions/` and does not write `invoices` from there — sole-writer law.

**P3–P6 declare no POSTs, and that is not an oversight.** Spec §8 names no key
for them; declaring their addresses would pin an interface for phases whose gates
do not exist, and the next seat would inherit it as though ruled.

## §14 · GATE

```
npm ci && npm run build:engine                             ← PREREQUISITE, see below
node --check core.js / solutions/index.js / b43            OK, all three
node scripts/b43_solutions_doors_bench.js                  35 PASS · 0 FAIL, exit 0
floor --delivery <manifest> --check                        FLOOR = NAMED BASE, no delta, exit 0
  [F-14.16] 3 dirty paths, all declared
  [F-14.16] declared files unmoved — set and contents both verified
  b43 entered the scripts/*.js glob and added no red
```

### ⚠ LABELLED AMENDMENT (F-19.17) — the gate block above gained its first line after the push

The first cut of this table began at `node --check`, implying a bare `npm ci`
clone would do. **It will not.** §0 asserts the mount THROUGH `core.js` rather
than by requiring the router directly — deliberately, because the mount line is
the thing that can be wrong — and loading `core.js` loads every sibling door with
it. `leads.js:39` requires `../../engine/dist/core/donna`, which `.gitignore:26`
excludes. A fresh clone therefore gets `MODULE_NOT_FOUND` and exit 1 before one
cell runs.

Found by running the pushed tip `f1cf374` on a virgin clone, not by reasoning:
green in a tree where `build:engine` had been run earlier in the sitting, RED on
a clean one. b38's header states this prerequisite; b43's first cut did not.
**A bench whose clean-checkout failure looks like a broken door is a bench that
will get the door blamed.** Cured in b43's header with the reasoning at site;
no code changed and the 35 cells are untouched.

### Non-vacuity, by mutating production source

| # | Mutation | Reddened |
|---|---|---|
| N1 | unmount `/solutions` from `core.js` | §0.1 §0.2, all seven §2 cells, §3.1–§3.4, §5.x, §6.x — the whole surface |
| N2 | `subdomainFor(...)` → inline concatenation | §5.2 (`DEV550.thedreamwedding.in`) and **§5.3 (`"null.thedreamwedding.in"`)** |
| N3 | `/benchmarks` sends `mine: 12, median: 18` | §7.5, message derived: `first_reply_minutes=12/18 …` |
| N4 | `GoogleStatus` grows `internalNote` | §2 `/google` → **HTTP 500 CONTRACT_VIOLATION**, §3.3, §7.1 |
| N5 | `/domain` reads `vendor_integrations` | §4.1 (`tables touched: users, vendor_integrations, vendors`), §2, §5.x |

**N2 is the one worth reading.** Replacing the transform with the obvious inline
concatenation produced literally `"null.thedreamwedding.in"` on the wire — the
exact byte CE-38 relay #1 item 4 exists to prevent, reached by writing the line
the way anyone would write it if the ruling had not been made.

### ⚠ TWO DEFECTS IN THIS BENCH, FOUND BY ITS OWN MUTATIONS AND CURED

Disclosed rather than quietly fixed, because both are the class D-38.1 warns about.

**Three failure messages were static strings and contradicted their own verdict.**
N3 printed `FAIL §7.5 … — four metrics, all null, direction "unknown"` — the
message asserting the opposite of the failure, at exactly the moment it was
reporting a leaked number. A cell whose message contradicts its verdict is worse
than a silent one: it reads as reassurance. §3.4, §6.3 and §7.5 now derive their
messages from what was observed.

**The bench aborted mid-run under N4.** When `/google` 500s its body is absent,
and §7's first cut dereferenced it — `BENCH ABORTED — TypeError`, with §7, §8 and
§9 never printed. Exit 2 is still an honest verdict, but a **partial verdict set**
is precisely what `wl_audit`'s preamble refuses: the reader cannot distinguish an
unreported cell from a passing one. §7 is guarded; N4 now completes at
`32 PASS · 3 FAIL`.

Neither defect ever produced a false green — both were found by mutations that
correctly reddened. But a bench that reports badly under failure reports badly on
the day it matters.

## §15 · WHAT STEP 3 INHERITS

- `GET /api/v2/vendor/solutions` is live and returns `SolutionsIndex` with a
  `live` and `state` per row, driven by `env.gates()`. The surface reads chips
  off it; it does not compute them.
- `lib/solutions/client.ts` (pwa) is step 3's and is still unbuilt.
- Every door's empty payload is now fixed and asserted, so a surface can be built
  against a real response rather than a mock.
- Backend counts to carry forward, re-derived at the moment of writing:
  `index.js` 375 · `b43` 388 · `contract.js` 314 · `env.js` 148 · `core.js` mount
  at line 73.

---
---

# STEP 4 — THE TWO PUBLIC ROUTES (kickoff §4-4, R-19.7, CE-38 relay #3)

**Built on** `dream-os` `b52448f` · `dreamos-pwa` `9a868c8`, siblings resolvable.
**State:** kickoff §4 items 1–4 complete. Item 5 (copy register, handover close) remains.

## §18 · THE FIRST UNAUTHENTICATED PER-VENDOR READ IN THE ESTATE

| Path | Lines | Change |
|---|---|---|
| `src/api/public/vendorCard.js` | 201 | NEW — the public card door |
| `scripts/b44_public_vendor_card_bench.js` | 249 | NEW — 25 cells |
| `src/api/router.js` | +6 | **EDITED** — the mount, beside the public routers |

Mounted at `/api/v2/public/vendor-card`, **beside** `crew` and `hot-dates` and
never under `./vendor/core` — that sub-router's every sibling carries
`requireAuth` + `resolveVendor`, and a door with no session mounted among them
would be read as guarded by association.

**The shape is the security boundary**, inherited from `src/api/crew.js`'s
header. `public.vendors` has 45 columns including `upi_id`, `gstin`, `pin_hash`,
`rate_min` and `razorpay_subscription_id`. One `select('*')` publishes a bank
handle, a tax number and a password hash to anyone who guesses a six-character
code — **and it would look completely fine on screen**, because the page renders
three fields either way. A response-only assertion cannot see it.

So b44 §3 **diffs the SELECT itself** (CE-38 relay #3: *diff the SELECT too*).
The fake records every column list asked for and compares it against a list
written from the ruling. A star select reddens before it reaches a response.

Every column names its `PUBLIC_SCHEMA.md` line at the site; the witness was
staleness-tested first (snapshot `0125`, migrations `0126`–`0129`, none touching
`public.vendors`).

## §19 · ⚠ SIX KEYS, NOT THE RELAY'S FOUR — reported, not adapted

CE-38 relay #3 names the card shape as `business_name, category, city, handle`.
Blocker 2's ruling in the same relay ships the demo `Enquire on WhatsApp` button
off `demo_vendors.whatsapp_phone`. **Those cannot both hold at four keys** — the
button needs a number on the wire and the page needs to know it is a demo.

Rather than emit two shapes, which would give the security boundary two
definitions, there is ONE shape of six fixed keys. `is_demo` and `enquiry_phone`
are always present; for a real vendor they are `false` and `null`, so a real
vendor's response carries no more information than the relay's four. The
allowlist stays one list the bench can diff. **If the chair wants four keys and
two shapes, that is one word and `CARD_KEYS` plus its cell move together.**

## §20 · WHAT THE ROUTES CAN HONESTLY DO TODAY

**`/r/<code>` redirects nobody, ever, yet.** `grep -niE
"review_url|review_link|google_review"` across `PUBLIC_SCHEMA.md` returns
NOTHING — there is nowhere for a review URL to live until P1's
`vendor_integrations`. F-19.17: `tdw_vendor_review_request` is APPROVED AT META
against this base and resolved to a framework 404 until this file existed. It
now renders one sentence. A sentence beats a 404; nothing more is built. The
uncomment step for P1 is stated in the file.

**`/v/<code>` is a 200 page, not a 302** (CE-38 relay #1) — there is no
storefront to redirect to, and a redirect to a route that does not exist is a
worse byte than a page that says what is true. It is the storefront's address
from today; P2 replaces the body, not the URL. `route.ts` → `page.tsx` is
c-38.16, the chair's.

**No button for real vendors, and that is the ruling.** `public.vendors` has no
phone and no "number is public" flag; a vendor's number lives on
`public.users.phone`. Publishing it because a button needed a target would put a
personal WhatsApp number on an open URL on the strength of a choice she was never
asked to make. A `public_contact_phone` with explicit consent is priced into P2.
Demo vendors get the button, off their own public Instagram contact, on a page
that says it is a demo. **The asymmetry is on the register.**

**Visibility is the vendor's own word.** `status='active' AND NOT
discover_paused`. A vendor who said *don't show me publicly* did not mean
*except on this new URL*. And absent, paused and inactive return **byte-identical
404s** — b44 §4.4 asserts the three bodies are one string, because a route that
distinguished them would answer *does this handle exist?* for anyone willing to
walk a six-character keyspace.

## §21 · GATE

```
node --check vendorCard.js / router.js / b44        OK, all three
node scripts/b44_public_vendor_card_bench.js        25 PASS · 0 FAIL, exit 0
node scripts/b43_solutions_doors_bench.js           35 PASS · 0 FAIL (unbroken)
backend floor --delivery <manifest> --check         NAMED BASE, no delta, exit 0
pwa npx tsc --noEmit                                exit 0
pwa node tools/bs_audit.mjs                         23 PASS · 0 FAIL
pwa floor, uninterrupted                            1 red: tdw_f0774_vacuity_probe (F-19.16, dirt)
```

### Non-vacuity, by mutating production source

| # | Mutation | Reddened |
|---|---|---|
| V1 | `VENDOR_SELECT` → `'*'` | §3.2 §3.3 §3.5 — *A STAR SELECT REACHED THE PUBLIC DOOR* |
| V2 | `discover_paused` check removed | §4.1 §4.4 §4.5 — the paused vendor was served |
| V3 | miss bodies made distinguishable | §4.4 — the enumeration oracle |
| V4 | `upi_id` added to the allowlist | §3.3 §3.4 §3.5 — *ASKED: upi_id* |
| V5 | the door unmounted from `router.js` | 9 cells across §1–§6 |
| V6 | a real vendor's phone put on the wire | §2.5 |

## §22 · ⚠ F-19.18 · A MUTATING BENCH KILLED MID-RUN DEFACES PRODUCTION SOURCE

**OPEN. Caused by this seat's process, not its code. Stated because the next
seat will hit it.**

The pwa floor reported `RED: tdw07_f0772_circle` — a bench with nothing to do
with this delivery. Withdrawing step 4 entirely did not clear it, which looked
like proof it was someone else's. It was not.

`git status` showed a file this seat never touched sitting modified:

```
+  permissions: { can_see_budget: boolean };
```

— inserted into `app/coplanner/CircleSessionContext.tsx` by that bench's own
mutation leg and never restored, which then made its §14.5b fail on the exact
vocabulary it had just injected. **The bench had reddened itself.**

The cause was this seat's: an earlier command hit its execution limit and was
killed while the floor was mid-mutation, so the restore never ran. Cleared with
`git checkout --` and re-run: **GREEN 131/131**, and an uninterrupted floor pass
leaves the tree clean.

Two things worth carrying:
1. **A red on a mutating bench is not evidence until the tree is checked.** The
   first instinct — withdraw the delivery and re-measure — was right and still
   gave the wrong answer, because the contamination survived the withdrawal.
   `git status` before `git blame`.
2. This is F-19.16's neighbour. That finding says the pwa floor cannot gate a
   dirty tree; this one says an interrupted floor MAKES the tree dirty, in
   production source, silently. The cure is the same `--delivery` port, plus
   restore-on-signal in the mutating legs.

## §23 · WHAT STEP 5 INHERITS

- `docs/COPY_REGISTER_TDW19.md` — two-column, for the founder's ONE pass. It must
  carry: the `Coming` chip as PROPOSED beyond spec §9's six; the demo-only button
  asymmetry; every sentence in `lib/solutions/copy.ts`; and the two strings
  transcribed inline in `app/r` and `app/v` with `copy.ts` named as their home.
- Frames on the seven surfaces plus `/v/` and `/r/` — the founder's, gated
  separately for `/v/` as the estate's first public byte.
- Still open: F-19.14, F-19.16, F-19.17, F-19.18, F-38.32.
