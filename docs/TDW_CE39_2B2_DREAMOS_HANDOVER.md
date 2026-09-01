# TDW · CE-39 · ROAD STEP 2b · 2b-2 (dream-os companion) — HANDOVER

**⚠ THIS ZIP RETIRES NOTHING, AND IT WAS CHARTERED TO RETIRE TWO THINGS. F-2b2.3:
`cabinet.js`'s `paid`/`owed` slices have THREE LIVE pwa READERS, named by `tsc`
after a grep reported zero. The `/vendor-e/` GET mounts have zero callers and are
HELD anyway, by ruling, to Phase 7's one motion.**

**Base `4918275` (main), re-derived fetch-first at the cut. Sibling dreamos-pwa
`bd60ac2` (worklist). THE PWA ZIP APPLIES FIRST.**

**FLOOR = NAMED BASE, compared as a SET** (`run-floor.sh --delivery`, sibling
present, `node_modules` AND `src/engine/dist` present). 20 REDs at base, 20 at
the cut, `diff` empty. **`b47` 22 PASS · 0 FAIL** · **`b48` 6 PASS · 0 FAIL** ·
`node --check` clean on every touched `.js`.

---

## 1 · WHAT MOVED

| file | arm |
|---|---|
| `tools/base_guard.sh` | the two copies made byte-identical |
| `scripts/b47_money_crossing_bench.js` | `s-2c.1` cured — 1.3's enclosing derivation |
| `scripts/b48_engine_mounts_bench.js` | **NEW**, and INVERTED |
| `scripts/floor-manifest-ce39-2b2.txt` | NEW |

**Two numbers corrected in band 5, both stale ink in the 2b-1 handover:** `b47`
is **22 PASS**, not 13 — 13 was true at the 2c ZIP-1 cut and four sittings have
landed since. And the dream-os floor cannot be read without `npm run build`:
`src/engine/dist` absent reads **twenty-seven** too many REDs by the floor's own
STOP text (F-39.p2). A missing `node_modules` in this repo separately faked a
`b41_ist_clock` FAIL (`Cannot find module 'express'`) that cost this seat a
detour. R-38.20b's class, twice in one sitting, in two repos.

## 2 · F-2b2.3 — THE RETIREMENT THAT DID NOT SHIP, AND WHY

The charter's companion was to retire `cabinet.js`'s `paid`/`owed` slices with
their counts, on RETIRE-WITH-THE-READER. The ruling put a condition on it: retire
**only if** no live reader consumes those fields, proven by grep on the
consumers' destructuring.

The grep returned nothing. **The grep was the wrong instrument.** Dropping the
two fields from `CabinetResponse` in the pwa made `tsc` name three readers in one
run:

| site | what it does |
|---|---|
| `dreamos-pwa lib/vendor/derive.ts:100` | `moneyBinders` composes its whole result from `cab.paid` + `cab.owed` |
| `dreamos-pwa app/vendor/list/[slice]/leads.tsx:96` | all four slices into the phone-keyed binder map |
| `dreamos-pwa app/vendor/list/[slice]/events.tsx:36` | all four slices into the id-keyed binder map |

The grep alternated on variable names (`cab|data|res|r`) and could see neither
`cab.data?.paid` nor a spread inside an array literal. **`c-2b2.1` is the
executor's**: that zero was published as a derivation, in the message that asked
for the ruling, and the ruling was given on it. **`c-39.41` is the chair's**: a
retirement ruled on a grep-zero with the type-checker one command away.

**THE LAW, band 5:** *a grep's failure mode is a silent zero; a type resolver's
is an error. For consumers of a typed wire, `tsc` IS the sweep and grep is the
hint.* The independent-method law already forbade a check whose failure mode is a
silent zero; this names the instrument that has one and the instrument that does
not.

`src/api/vendor-engine/cabinet.js` is **byte-identical to `4918275`**. So is
`src/api/vendor-engine/index.js`, and so is the pwa's `CabinetResponse`.

## 3 · THE TWIN MOUNTS — PROVEN SAFE, HELD ANYWAY

`/api/v2/vendor-e/cabinet` and `/api/v2/vendor-e/binders` (GET) have **zero
callers** in either repo — the only surviving matches are those files' own header
comments. `b48` §1 proved by REQUEST, both ways, that removing them leaves
`binderWrite`'s eight POST doors resolving on the same `/binders` prefix and the
live `/api/v2/vendor` twins answering.

**They ship UNRETIRED, and the reason is not doubt about the proof.** The same
sweep-shape produced this sitting's finding; the mounts cost nothing standing;
and Phase 7 retires the whole vendor-engine twin — mounts, slices, and the three
/vendor-tree readers — in ONE ruled motion at a tip where 「readers leave before
their sources」 can be proven by `tsc` on both sides at once. Two retirements
staged across two sittings is how a half-retired twin becomes somebody's
afternoon.

**So `b48` IS INVERTED.** It was written to prove a retirement and it ships
asserting the opposite: the four engine money addresses **all still resolve**,
and the cabinet payload **still carries all six slices**. It is a guard against
an accidental retirement, with the three pwa readers named in its failure
messages so the next seat reads WHY before it reads WHAT.

## 4 · s-2c.1 — CURED, AND MY FIRST CURE WAS ALSO A GUESS

`b47` 1.3 decides whether a typed money writer is called from a ROUTE (the
defect) or from `generateInvoiceForBinder` (the declared exception, three live
callers, F-39.33). It did that with a **900-character lookbehind** for
`function <name>`. Three defects in one line, and only the first was carried:

1. **`indexOf(m)` finds the FIRST occurrence, not this one.** `String.match` with
   `/g` returns TEXT, not positions, so every repeat of a symbol in one file was
   judged at the position of the first. Found while reading the line to cure it.
2. **900 characters is a proximity guess, not a scope.** A declaration 901 back
   yields the empty name and reds a lawful call; a long unrelated function inside
   the window exonerates an unlawful one.
3. **It sees only `function <name>`** — and every route in this estate is an
   arrow handler, invisible to it.

**THE FIRST CURE WAS ALSO WRONG, AND RUNNING IT SAID SO.** Replacing the window
with 「the nearest preceding declaration」 is a better guess and still a guess: at
`src/api/vendor/invoices.js` the nearest declaration before the lawful
`createInvoice` at `:364` is a local `const latest = (…)` **inside**
`generateInvoiceForBinder`, so `b47` went 21/1 against a call the estate has
ruled lawful. **A nearest-preceding declaration is not a scope; a scope is a
brace.** F-39.25's pattern, third instance this sitting.

The shipped cure walks BACKWARDS tracking brace depth and, at each brace that
actually encloses the call, reads the head before it: a named `function`, a
`NAME = (…) =>` binding, or a `router.<verb>(` handler. Anonymous blocks are
stepped over — which is exactly what the local `const` defeated. Its limit is
named in-file: braces inside string and template literals count as code, and a
mis-parse REDs rather than passes, which is the safe direction for a guard.

**PROVEN BOTH WAYS.** A `createInvoice` planted inside `router.patch('/:invoiceId/cancel', …)`
reds the cured cell; the old 900-char instrument, shown running on the same
planted call with a decoy declaration nearby, attributes it to
`generateInvoiceForBinder` and passes it.

## 5 · base_guard.sh — THE PARAGRAPH WAS THE DIVERGENCE

`cmp` at `bd60ac2`/`4918275`: the two copies **differed**, and they differed in
exactly the paragraph asserting they were byte-identical. The dream-os copy
carried 「the two copies are byte-identical rather than forked」 and the pwa copy
did not, so the sentence claiming the equality was the only thing breaking it.
Each also named only its OWN repo in the usage line — the line a reader in the
other workspace needs least.

Both usage lines now live in one file, and the paragraph records that it was
false until this sitting. **`b40` C81 and `b48` §3.1 assert the equality by
reading both trees**, so the next divergence reds a bench instead of being
described by the file that has already drifted. F-39.26's class, in a shell
script.

Both cells **REFUSE rather than FAIL** on an absent sibling: R-38.20b, because a
missing sibling has faked findings in both directions here, and a red on an
absent tree teaches a reader that reds are negotiable.

## 6 · NON-VACUITY

`b48` 6 PASS · 0 FAIL. **Five mutation proofs, all production code:**
§1.1 (retire the `/vendor-e` cabinet GET mount → FAIL) · §1.2 (remove the write
mount on the shared prefix → FAIL) · §1.3 + §1.5 (unmount the LIVE twin at
`core.js:44` — F-2b2.3's disaster, simulated → both FAIL) · §1.4 (drop the `owed`
slice from the payload → FAIL) · §3.1 (append one byte to the guard → FAIL).

`b47` 1.3 proven both ways (§4 above); `b47` otherwise byte-stable at 22/0.

**`s-2b2.3` — a third instrument defect, mine, caught by running it.** A `b48`
mutation that inserted a `const` inside an object literal made `cabinet.js`
unparseable; the bench threw; my matcher read the absence of a `FAIL` line as a
PASS and reported the cell VACUOUS. The harness now asserts the bench actually
RAN — `grep -q "passed, .* failed"` — before reading its verdict. **Three
instrument defects in one sitting, all the same shape: a matcher whose failure
mode is silence.** Which is the sitting's own law, arrived at from the other
direction.

## 7 · WHAT PHASE 7 INHERITS FROM THIS SITTING

ONE motion, and the pieces are enumerated so it cannot be taken in halves:
the two `/vendor-e/{cabinet,binders}` GET mounts · `cabinet.js`'s `paid`/`owed`
slices, their counts, and the local `pendingOf` (the THIRD copy of F-04.13 — the
canon is `dreamos-pwa lib/vendor/derive.ts::pendingOf`, the live dream-os mirror
is `today.js:103`) · the pwa's `CabinetResponse` money fields · and the three
/vendor-tree readers, which die with `app/vendor/layout.tsx`.
`b48` §1.1 and §1.4 red the day any of it moves early — which is the point.

## 8 · SQL

**ZERO.**
