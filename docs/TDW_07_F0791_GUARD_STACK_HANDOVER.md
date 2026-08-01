# TDW · F-07.91 + F-07.90(dashboard) — the lock with no key, and six tiles that lied

Base: `dream-os 22c094f` · `dreamos-pwa a315b1e`. Executor never pushes.
Ruling: F-1 → (a) all ten · F-2 → dashboard this sitting · the sweep bench chartered.

---

## 1 · WHAT SHIPPED

**dream-os** — `discover.js` (4 stacks) · `featured.js` (4) · `couture.js` (2) ·
`scripts/b07_f0791_guard_stack_bench.js` **NEW, 38 cells** · this doc.
**dreamos-pwa** — `app/admin/page.tsx` (six arms) · `scripts/tdw07_f0790_dashboard.proof.mjs`
**NEW, 34 cells**.

Derived at the ratified tip before a byte moved: **exactly ten** `requireAuth, requireAdmin`
stacks, three files. After: **zero** `requireAuth` references in `src/api/admin/**` — imports
and mounts both. `requireAuth` itself is untouched and still serves the lanes that legitimately
hold a user JWT.

---

## 2 · F-07.91 — WHY REMOVING A GUARD IS NOT A WEAKENING

`requireAuth` verifies a **Supabase user JWT** (`src/api/middleware/requireAuth.js:13`). It stood
FIRST, so it answered 401 before `requireAdmin` ran, and an admin holds no user JWT. Not a second
factor — **a lock with no key**. It protected nothing and blocked everything: the Discover
approval queue including grant/deny/revoke, the Featured queue including approve/reject, and
Couture payouts.

`requireAdmin` alone is the **identical** protection every other `/api/v2/admin/*` route carries.
`§3` proves nothing lost a guard in the cure.

**Couture ruled in with its siblings, and the reason rides in-file:** it is money movement and the
stack *looked* deliberate. It wasn't. The real second factor exists in-tree — Panel A re-prompts
for the password on its cascade deletes (`src/admin/router.js:324`) — and wiring it to payout
ACTIONS is **F-07.92**, named at the site so the want survives the cure rather than dying with the
broken lock. `§5.3` reddens if that charter is dropped.

**Refused in ink** (the LE's own grounds, chair-adopted): teaching the panel to hold a user JWT
re-crosses the lane geometry F-07.65 closed. `§5.4` holds the cite.

---

## 3 · F-07.90 AT THE DASHBOARD — `0` is an answer, `—` is the absence of one

Six arms read `.catch(() => ({ requests: [] }))` and siblings. A failed call became an empty
collection, an empty collection became a zero, and a zero became a confident tile on the founder's
first daily screen. 「 DISCOVER QUEUE · 0 · Under review 」 was **a 401 the page threw away**.

Every arm now fails to a **Symbol sentinel** — `null` would be indistinguishable from a real empty
payload, which is the exact confusion the cure exists to end. A failed arm renders `—` with
`Could not load`; a *successful* empty list still renders `0`, and `§3.1` proves zero stayed
reachable so the cure did not over-correct into never showing a real zero.

The raw waitlist `fetch` also gained an `r.ok` check — it was calling `.json()` on a 401 body and
treating the result as data (`§1.5`, mutation R-5).

**Beyond the dashboard:** the remaining swallow sites are FILED to F-07.90's sweep remainder per
the ruling, untouched here.

---

## 4 · THE SWEEP THE CHAIR CHARTERED — and my own gap it closes

`b07_f0784_panel_bench §2` asserted the header limb dead and the bearer limb live. **It never
asserted that a guard stack is satisfiable by an admin.** A route can carry `requireAdmin` and
still be shut. Ten were, through the whole fold, every cell green.

The new bench enumerates **every route in `src/api/admin/**`**, extracts each middleware chain
(including `router.use`-mounted guards), and classifies every guard against a **stated taxonomy** —
admin-satisfiable vs foreign (`requireAuth`, `requireCoupleAuth`, `requireVendorAuth`,
`requireCircleMemberAuth`, each named individually so a new guard cannot slip through an over-broad
allowlist). Two exemptions, both named and both effect-asserted:

- **PUBLIC BY DESIGN** — the three `publicRouter` files serving couples.
- **UNGUARDED BY NECESSITY** — the login door, as a ROUTE not a file. A guard on the door that
  mints the credential is circular.

---

## 5 · THREE MISSES OF MY OWN, ALL CAUGHT BY MUTATION

1. **The sweep convicted the innocent.** Draft 1 matched guards by literal NAME and flagged all ten
   `demoAdmin` routes UNGUARDED — because the F-07.86 fold imports the one guard as
   `const requireAdminPassword = require('./requireAdmin')`. The guard was there; the sweep could
   not see it under its local name. Worse than a false positive: **a foreign guard behind a
   friendly alias would have been ACQUITTED.** Alias resolution added, resolving from the require
   TARGET. `§4.5/§4.6` prove both directions; mutation Q-4 plants
   `const requireAdminish = require('../middleware/requireAuth')` and now convicts.
2. **`§3.2b` asserted a declaration, not an effect.** It checked the exemption set had one entry.
   Mutation Q-6 widened the exemption's *application* from route-match to file-match and planted a
   second unguarded route in `login.js` — set still size 1, second route walked straight through,
   **bench stayed 38/38 GREEN.** Re-aimed to count the routes actually exempted. Q-6 now reds.
3. **A shell-escaping artefact nearly recorded a vacuous mutation as real.** Q-5's first run showed
   green because my substitution never applied, not because the bench was blind. Re-run correctly:
   RED at 35/38. Recorded because a mutation table is only evidence if each mutation is verified to
   have LANDED.

---

## 6 · MUTATIONS — 21, all RED

**dream-os** (38/38): Q-1 requireAuth restored on discover `35` · Q-2 partial revert on couture
`35` · Q-3 a route loses its guard entirely `36` · **Q-4 foreign guard behind a friendly alias
`35`** · Q-5 alias resolver disabled `35` · **Q-6 exemption widened + second login route `37`** ·
Q-7 foreign taxonomy emptied `37` · Q-8 mechanism comment stripped `37` · Q-9 F-07.92 charter
dropped `37` · Q-10 stripper no-op `37`.

**dreamos-pwa** (34/34): R-1 the discover arm swallows again `32` · R-2 tile falls back to 0 `33` ·
R-3 confident caption kept `33` · R-4 null branch collapses `33` · R-5 `r.ok` removed `33` ·
R-6 Symbol → null `33` · R-7 zero unreachable `33` · R-8 mechanism cite dropped `33` ·
R-9 veto marker removed `33` · R-10 frozen tile label re-authored `33` · R-11 stripper no-op `31`.

All files restored **byte-identical** (`cmp` / porcelain).

---

## 7 · FLOORS — whole, both repos

**dream-os** — `npm ci` 0 → `build:engine` 0 → **93 benches**. selftest **386** · p5 **136** ·
p6 **26** · auth **24** · f0776_doors **61** · f0784_panel **59** · f0789_phantom **19** ·
**f0791_guard_stack 38 ← NEW** · known-reds **EXACTLY TWO** (meter 28/29 · f0555 22/23).

**dreamos-pwa** — `npm ci` 0 · `rm -rf .next` · `tsc --noEmit` **ZERO**. Sixteen prior counts
unmoved · **f0790_dashboard 34 ← NEW** · the seven `run-*.sh` 24·11·17·11·25·22·41 green.
**Movement: ZERO** beyond the two additions.

---

## 8 · VETO SLOT — two strings

| | |
|---|---|
| frozen | the six tile labels · `Total vendors` · `Total couples` · `Pending approval` · `Under review` · `Unconsumed codes` · `Awaiting review` |
| sibling precedent | `Could not load your preview.` · `Could not load conversations.` (F-07.90, one bank old) |
| **LE DRAFT** | 「 — 」 (the unknown value glyph) |
| **LE DRAFT** | 「 Could not load 」 (the unknown sub-label) |

Both in named constants, `VETO PENDING` in-file, `§4.1–4.4` assert they stay named and never inline.

---

## 9 · THE FOUNDER'S WALK

| # | you do | I read |
|---|---|---|
| 1 | Deploy dream-os, then Vercel. | boot green |
| 2 | `/admin` — read the **DISCOVER QUEUE** tile. | a real number. It has been a swallowed 401 wearing a zero. |
| 3 | `/admin/approvals/discover` | **the queue renders.** Unreachable until this deploy. |
| 4 | `/admin/approvals/photos` and `/admin/featured` | Featured renders; photos did not regress |
| 5 | Network tab on `/admin` — confirm **no 401** on `discover/requests` | the red line from your walk is gone |

**The UNKNOWN tiles are bench-only by design** — witnessing them live would mean breaking a
production route on purpose. `§2` proves all six arms; no step depends on unsetting anything.
**Fixture state: none.**

`/admin/couture` and Couture payouts are reachable now too, but that surface has no nav entry
(F-07.93) — type the URL if you want to see it.

---

## 10 · FOR THE SEAL ENTRY

- **F-07.91 CURED**, all ten routes, three files; the class made a runnable estate-wide sweep.
- **F-07.90 CURED at the dashboard**, six arms; remainder filed.
- **F-07.92 preserved by charter**, named at the couture site so the cure cannot erase the want.
- **THE ALIAS LAW, earned here:** a guard census that reads NAMES convicts the innocent and
  acquits the disguised. Guards are resolved from their require TARGET, never their local binding.
- **THE DECLARATION-VS-EFFECT LAW:** a cell asserting an exemption LIST is not a cell asserting the
  exemption's REACH. Count what the rule actually exempts, not what it says it exempts.
- **A mutation is evidence only once it is verified to have LANDED** — a failed substitution reads
  exactly like a robust cure.

Sequencing beyond this sitting is the founder's.
