# TDW · M-BRIDE-NAME · ZIP 1 (dream-os) — HANDOVER

Charter: `M-BRIDE-NAME`, CE-35, 2026-08-18. Tip at build: **`64fbd64`**,
re-derived by `git fetch -q origin` at the executor's own clone before any byte
was authored (CE-22). Sibling `dreamos-pwa` at `c6e631d`.

Rulings this ZIP is built under: the founder's **both-roles** word (2026-08-18),
**R-35.10** (fill-when-null is the shape), **R-35.13** (both lanes, both selects
widened, vendor response unchanged). **R-35.12** (arm 3b) is ZIP 2's and no byte
of it is here.

---

## 1 · WHAT SHIPPED — four files, nothing else

| file | what moved |
|---|---|
| `src/lib/provisionRole.js` | F-OB.13 cure. Both users lookups widened to `select('id, name')`; a fill-when-provided-and-currently-null after paths (a)/(b); `name` added to the return. Path (c) untouched. |
| `src/api/couple/auth.js` | F-OB.14 server half. `/provision` returns `name: r.name`. One line plus its reason. |
| `scripts/bOB_m_bridename_fill_bench.js` | NEW. 18 cells, both-ways, four production-code mutations. |
| `scripts/floor-manifest-m-bridename-zip1.txt` | NEW. This delivery's declared dirt for `--delivery` mode. |
| `docs/handovers/TDW_M_BRIDENAME_ZIP1_HANDOVER.md` | NEW. This file. |

**Zero migrations. Zero SQL. Zero copy.** `public.users.name` is column 3 and has
existed since birth (`docs/db/PUBLIC_SCHEMA.md:995`). Plane: `public`.

---

## 2 · WHAT IS PROVEN, AND HOW

`bOB_m_bridename_fill_bench.js`, run on both sides of the cure:

- **UNCURED tree (`64fbd64`, bench only): exit 1 — 2 ok, 16 FAIL.**
- **CURED tree: exit 0 — 18 ok, 0 FAIL.**

Both exit codes were measured **directly, not through a pipe**. A first
measurement of this bench reported `EXIT=0` on the red run because `$?` after
`node … | tail` is *tail's* status — the same class as D-4a error #1, which
`run-floor.sh` LESSON 3 names in its own header. The number in this handover is
the re-measured one.

The four mutation cells break **production source** and assert the matching cell
reddens; each restores in a `finally`, per LESSON 3:

| cell | mutation | reddens |
|---|---|---|
| §3.1 | the fill block's condition → `if (false)` | §1.1 |
| §3.2 | drop `!namePresent(currentName)` | §1.2 |
| §3.3 | narrow path (a) back to `select('id')` | §1.2 |
| §3.4 | remove `name: r.name` from `/provision` | §2.1 |

§3.3 is the cell that makes the widened projection more than a grep: on a plane
that honours `select(...)`, narrowing it leaves `currentName` undefined, and the
never-clobber guard **inverts into a clobber on every login**. The bench's fake
plane projects only what it was asked for precisely so that this is visible.

### The floor

**BEFORE (clean tree, `64fbd64`, warm, `--check`, sibling-full): `FLOOR = NAMED
BASE, no delta` — 21 reds by name, exit 0.**

⚠ **A first BEFORE measurement reported 70 reds and a 49-name delta. It was
wrong, and the reason is worth carrying forward:** the clone had no
`node_modules`. Every one of the 49 was a dependency-resolution failure —
`b06_m4_bench` reddening on `Command failed: npx tsc` was the specimen that gave
it away. This is LESSON 1's class in its severest form, and it was one report
away from being handed up as a delivery delta. **`npm ci` before any floor claim
in a fresh container.** The 21-name figure above is the post-install
measurement, and it matches `scripts/floor-base.txt` exactly.

**AFTER: see §5.** The founder runs it; the executor does not claim a floor over
a tree he cannot push.

---

## 3 · BLAST RADIUS, STATED RATHER THAN DISCOVERED

**The vendor lane gets this cure too.** `provisionRole` has exactly two callers —
`src/api/couple/auth.js:478` and `src/api/vendor/auth.js:552` — and both already
pass `name`. R-35.13 put the fill in the shared function, so a vendor whose
`users` row exists but is nameless will now have a typed business name land on
login. **This overshoots the founder's charge, which was the bride's.** It is
benign by construction: a fill that never clobbers cannot disturb the three
writers that overwrite `users.name` deliberately (`src/api/vendor/me.js:320`,
`src/api/vendor/onboarding.js:246`, `src/agent/onboarding.js:268`). §1.9 of the
bench drives the vendor caller shape rather than reasoning about it.

**The vendor `/provision` response does NOT gain `name`.** R-35.13 killed that
symmetry fork as a recorded non-act — no reader exists for it. §2.2 of the bench
holds it dead, so a future sitting that adds it must do so deliberately.

---

## 4 · DECLARED TENSION — the emptiness definition is duplicated

`provisionRole.js` now carries a local `namePresent()` that mirrors `textPresent`
at `src/lib/onboardingPredicate.js:50-52` — the same rule `brideComplete` uses.
**It is duplicated rather than imported, and that is a knowing departure from the
ONE-HOME law.** `textPresent` is not in that module's export list, and this
charter fenced `onboardingPredicate.js` at zero bytes ("verified working,
therefore untouched"). The explicit fence won over the general law.

**This is a live drift risk and it is named, not hidden.** If the two definitions
ever diverge, the signup door and the onboarding form will disagree about what a
name is. **Recommended for a later sitting:** un-fence that file, export
`textPresent`, delete `namePresent` here, import it. The comment in
`provisionRole.js` says so at the site.

---

## 5 · WHAT THE FOUNDER RUNS

Apply, then:

```
bash scripts/run-floor.sh --delivery scripts/floor-manifest-m-bridename-zip1.txt --check
node scripts/bOB_m_bridename_fill_bench.js
```

Expected: `FLOOR = NAMED BASE, no delta`, then `18 ok, 0 FAIL`. **`npm ci` first
if the tree is a fresh clone** — see the warning in §2.

---

## 6 · WHAT THIS DOES **NOT** CURE

1. **The existing stock of 20 nameless couples.** This writes only when a name is
   *presented*. A bride already on file who presents nothing is untouched. That
   stock is fork (b)'s — the dark WhatsApp onboarding gate at
   `src/lib/laneFlags.js:96`, behind the flag *and* the un-vetoed redirect byte —
   and it remains **the founder's separate word**. Nothing here flips it.

2. **The signup button.** Still ungated at this ZIP. `app/(landing)/page.tsx:833`
   is ZIP 2's, under the founder's both-roles word.

3. **`:527`'s routing.** Still `!isVendor && !pinSet && !d.name` at this ZIP. The
   server now *sends* `name`; arm 3b consumes it in ZIP 2.

4. **Abandonment after OTP.** A bride who passes the gate, receives her code, and
   closes the tab is beyond both ZIPs. The gate stops the *empty-name* class at
   the door; it cannot stop a closed tab. The frost guard
   (`app/(frost)/layout.tsx:87`) catches her whenever she does open the app.

5. **F-OB.16** — `pin-login` (`src/api/couple/auth.js:460-466`) omits `name`, so a
   session born at that door carries null regardless of `users.name`. Minted,
   queued, chartered separately. **Zero bytes of it here.**

6. **F-OB.15** — Mira is handed the literal string `unknown`
   (`src/agent/brideSystemPrompt.js:233 → :254`). W-1-fenced prompt byte, rides
   Row 9 or its own charter. **Zero bytes of it here.**

---

## 7 · THE WINDOW BETWEEN THE TWO PUSHES, STATED HONESTLY

The founder applies and pushes **both ZIPs back-to-back in one sitting**; the walk
runs after both. Between the two pushes, `/provision` returns `name` while `:527`
still reads it under the old expression. The only behavioural delta in that window
is that a **named, pinless** bride routes to `/couple/pin` directly rather than
reaching it via the `(auth)` onboarding form's own name-bounce. Destination-
equivalent, minutes long.

Inversion was refused on arithmetic, and the arithmetic is worth recording:
pwa-first would make `(!pinSet || !d.name)` evaluate as `(!pinSet || true)` —
because `d.name` is `undefined` until this ZIP lands — routing **every** couple,
named or not, to onboarding. The dream-os-first order is the smaller window.

---

## 8 · NEXT

ZIP 2 (`dreamos-pwa`) — the both-roles gate at `:833` and arm 3b at `:527`, with
its own bench, floor DECLARED per F-14.26, and zero new copy. Then the fixture
SELECT anchored on the walking account, then the founder's walk card — including
the 3b case: a returning nameless bride with a PIN finally meeting the form.
