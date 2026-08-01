# TDW · THE ADMIN PANEL FOLD — F-07.84 · .85 · .82 · .86 · .87 · .88

Base: `dream-os ff851f494f9db5f2258d77a430b91e4ad813afef` · `dreamos-pwa 0eecccd3359bf0a06ef73391b975be17a2b319d6`
Two repos, two ZIPs. Executor never pushes. Ruling: the CE panel ruling + the founder's `keep` relay.

---

## 0 · WHAT THE FOUNDER GETS BACK

Every daily screen works again — control-room, money, revenue, approvals, conversations,
featured, subscriptions — and the reason they broke is gone rather than papered.
He signs in **once**, with the **rotated** password, at `/admin/login`.

**One blocking env fact, declared not derived:** `ADMIN_SESSION_SECRET` must be set on
`dream-os-production`. Slice one already made this a hard requirement; this delivery
extends it to the *entire* admin surface including the demo routes, which previously
needed only `ADMIN_PASSWORD`. If it is set, nothing to do. **`NEXT_PUBLIC_ADMIN_PASSWORD`
on Vercel is now DELETED, never rotated into** — the naive fix stays refused in ink.

---

## 1 · WHAT SHIPPED

### dream-os — 3 new files, 8 modified, 1 new bench, 1 sealed bench re-aimed

| file | what moved |
|---|---|
| `src/lib/adminSession.js` | **NEW — the one home.** HMAC-SHA256 over a mint-time nonce. F-07.82's cure. |
| `src/api/admin/login.js` | **NEW — the json login door.** F-2(a). |
| `src/api/admin/requireAdmin.js` | header limb DELETED · bearer limb added · rides the one home |
| `src/admin/middleware.js` | signSession twin deleted · rides the one home · break-glass status inked |
| `src/admin/router.js` | logout clears via the shared `COOKIE_NAME` |
| `src/api/admin/demoAdmin.js` | private guard dies; adopts `requireAdmin` (F-6(b)) |
| `src/api/couple/concierge.js` | **the third authority, found and folded** — see §3.1 |
| `src/api/admin/failedTurns.js` | one stale doc comment naming the dead header |
| `src/api/router.js` | mounts the login door first among admin routes |
| `src/index.js` | CORS drops `x-admin-password` · **F-07.87 guarded** |
| `scripts/b07_f0784_panel_bench.js` | **NEW — 59 cells** |
| `scripts/b07_f0776_doors_bench.js` | **13 cells RE-AIMED, labeled** — see §4 |

### dreamos-pwa — 1 authority rewritten, 27 screens adopted, 1 new bench

`lib/admin-api/_base.ts` becomes the one authority carrying the bearer. `app/admin/login/page.tsx`
posts to the backend. `app/admin/layout.tsx` and `app/admin/discover-heroes/page.tsx` stop
reading the boolean. `app/admin/control-room/page.tsx` stops printing the password.
Twenty-five further screens adopted mechanically. `scripts/tdw07_f0784_panel.proof.mjs` — **31 cells**.

---

## 2 · THE COUNTS, DERIVED — the chair's were scale-spots, these govern

| claim | kickoff | derived | now |
|---|---|---|---|
| `NEXT_PUBLIC_ADMIN_PASSWORD` sites | "ten further" | **10 total / 9 further** | **0** |
| `x-admin-password` files / lines | "25 files" | **26 files / 47 lines** | **0** |
| retired-literal sites | "~19" | **19 files / 19 lines** | **0** |
| Panel A routes | "~10" | **17** | 17, unchanged (break-glass) |
| `admin_session` boolean readers | 1 implied | **2 independent** | **0** |

---

## 3 · WHAT I FOUND THAT NOBODY CHARTERED

### 3.1 A THIRD authority, on a couple route

`src/api/couple/concierge.js:214` read `x-admin-password` directly. The F-07.85 census
could never have found it — that census searched `app/admin/**` on the pwa, and this is a
**couple** route. It surfaced only when the header was swept estate-wide *after* the limb
was deleted from the guard. Folded to the same session material; the `requireCoupleAuth`
mount above it is untouched, so the door keeps its position and only the credential's
shape changed. **Disclosed, not papered.**

### 3.2 The cookie limb is reachable by nobody

Panel A mints `Path=/admin`, so a browser never sends that cookie to `/api/v2/*`.
`requireAdmin`'s cookie limb is therefore live-but-unreachable from a browser. **This was
already true before this delivery** — it is not a regression, and I did **not** silently
widen the Path, because that is a behaviour change nobody ruled. Filed in-file at the site.

---

## 4 · THE SEALED BENCH MOVED — thirteen cells, disclosed and re-aimed

`b07_f0776_doors_bench.js` went **48/61 RED** at the cured tree. Every one of the thirteen
was a cell asserting *the world slice one shipped* — the world this delivery deliberately
replaced. Per the **BOTH-SIDES CLAUSE (CE-59)**: the old shape's green is RETIRED, not
retained; a green over a header nobody sends is indistinguishable from no test at all.

- **§0 ×3 canaries** re-anchored: they named `requireAdminPassword` and both `signSession`
  twins — functions this delivery *deleted*. An anchor must be live code that exists.
  Re-anchored to surviving code at the same head/waist/tail spread; subject unchanged.
- **§6.1–6.8** re-aimed from the header contract to the session contract, and made
  **behavioural** against the shipped module rather than textual. Non-vacuity re-proven:
  flipping `verifyAdminSession`'s fail-closed limb reds them.
- **§7.2 CLOSED rather than drifted**: slice one asserted `signSession` was *still* base64
  so it could not be mistaken for having cured F-07.82. **That micro is this sitting.** The
  cell keeps its subject — the state of the mint — and states the new truth, so a
  regression to reversible encoding still reds it.

Count byte-stable at **61**. Every re-aim labeled in-file with its reason.

---

## 5 · THE MUTATION TABLE — 22 mutations of PRODUCTION code, all RED

**dream-os** (bench 59/59 cured): M-1 header limb restored `57` · M-2 base64 mint restored
`57` · M-3 timingSafeEqual removed `58` · M-4 verify fail-OPEN `58` · M-5 expiry check
deleted `58` · M-6 CORS re-allowlists the header `58` · M-7 F-07.87 guard stripped `58` ·
M-8 demoAdmin private guard restored `57` · M-9 login door redirects `58` · M-10 concierge
header limb restored `57` · **M-11 stripper no-op → 49 (the §0 CANARY firing, 10 cells)**.

**dreamos-pwa** (bench 31/31 cured): **M-12 the devtools bypass restored at the layout gate
`29`** · M-13 second gate reverts `29` · M-14 a hand-built header returns `30` · M-15 the
env var read again `29` · M-16 credential-shaped literal planted `29` · M-17 browser
compare returns `30` · M-18 the on-screen note restored `30` · M-19 eager token read `30` ·
M-20 expiry gate deleted `30` · M-21 boolean eviction removed `30` · **M-22 stripper no-op
→ 24 (canary, 7 cells)**.

All mutated files restored **byte-identical** (`cmp` / `git status --porcelain`).

---

## 6 · THE FLOORS — whole, both repos, cured trees

**dream-os** — `npm ci` 0 → `npm run build:engine` 0 → 91 benches sequential.

```
selftest (b06_gauntlet --rig-selftest) ... 386/386
b07_p5_bench ............................ 136/136
b07_p6_bench ............................  26/26
b07_auth_crossover_bench ................  24/24
b07_f0776_doors_bench ...................  61/61   ← 13 cells re-aimed, count stable
b07_f0784_panel_bench ...................  59/59   ← NEW
BENCHES RUN ............................. 91       (90 + this delivery's bench)
known-reds .............................. EXACTLY TWO
    b06_meter_bench ............ 28/29  (F-06.41)
    b05_f0555_media_dedupe ..... 22/23  (F-07.11)
```

**dreamos-pwa** — `npm ci` 0 · `rm -rf .next` · `tsc --noEmit` **ZERO**.
p1 35 · p2 42 · p3 111 · p4a 63 · p4b_slice1 24 · p4b_probe 27 · p4b_body 125 ·
f0760_claim 76 · f06133_drawer 41 · p6_fold 60 · auth_crossover 30 · f0766_orphan 21 ·
f0770_authority 101 · m3_chip ALL GREEN · **f0784_panel 31 ← NEW**.

**The seven `run-*.sh`, owed pre-build and paid:** assign-words **24** · bands **11** ·
city **17** · crew **11** · post-access **25** · roster-mint **22** · settle **41**. All green.

**Movement: ZERO** against the chair's maps on either repo, except the two additions and
the labeled re-aim.

---

## 7 · THE VETO SLOT — ONE STRING, and the packet closes on his word

A fetch can now fail in a way this screen could not fail before. `Incorrect password.`
cannot honestly describe a 502 — it would blame the operator for the server being down.

| | |
|---|---|
| **Frozen, unchanged** | `The Dream Wedding` · `Control Room` · `Password` · `Incorrect password.` · `Entering…` · `Enter` |
| **Sibling-lane precedent** | `Something went wrong. Try again.` · `Could not load your preview.` |
| **LE DRAFT, veto pending** | 「 Could not reach the server. Try again. 」 |

It lives in **one named constant** (`NETWORK_FAIL`, `app/admin/login/page.tsx`) marked
`VETO PENDING` in-file, and cell `§5.2/§5.3` assert it stays a single constant and stays
marked. **The founder's one line is a one-byte re-cut.**

**F-07.88's replacement note** — 「 Always ON. The password lives in Railway env only —
never on this screen (F-07.88). 」 — is also his to word; it replaces a string that could
not survive in any form.

---

## 8 · SECRET HYGIENE, HELD AT THE BYTE

The retired literal appears **nowhere**: not in source, not in a comment, not in a bench
string, not in this handover. It was derived into a shell variable by regex and every
deletion was a mechanical substitution keyed on that variable. **No replacement line was
ever authored containing it.**

Both benches assert **absence of a PATTERN** — a credential-*shaped* string in a place
credentials must not live — never the presence or absence of a particular value. That is
the **repo-wide tripwire F-07.83 declared OWED and named this micro as its home.** Paid.

---

## 9 · THE FOUNDER'S WALK — you perform and paste; I read the evidence

**Before you start:** Railway → `dream-os-production` → Variables → confirm
`ADMIN_SESSION_SECRET` is set. Vercel → dreamos-pwa → Settings → Environment Variables →
**DELETE `NEXT_PUBLIC_ADMIN_PASSWORD`** → redeploy. (Deleting it is the point; do not set it.)

| # | you do | I read |
|---|---|---|
| 1 | Deploy dream-os. Railway logs → boot green. | the boot line |
| 2 | Open `/admin/login` on the big panel. Sign in with the **rotated** password. | admits, once |
| 3 | Walk the daily screens: **control-room · money · approvals · conversations**. | each loads data. **These have 403'd since the rotation; this is the outage ending.** |
| 4 | Also open **featured · revenue · subscriptions** and the **demo** screen. | demo is the F-6(b) witness — its routes changed guard |
| 5 | **Negative arm A.** New private window → devtools → `localStorage.setItem('admin_session','true')` → open `/admin`. | **bounced to login.** The boolean opens nothing. |
| 6 | **Negative arm B.** On any admin page: view-source, then Ctrl-F the page and the JS bundle for your password. | **not found.** Nothing password-shaped ships. |
| 7 | **Panel A break-glass** (F-4, your `keep`). Open `dream-os-production.up.railway.app/admin` → log in → the vendor list renders. Try `/admin/unified-invite`. | Panel A alive and independent. **Note: your old Panel A cookie is evicted by the HMAC change — you sign in again once. That is the eviction, working.** |
| 8 | Sign Out from the big panel, then hit `/admin/money` directly. | bounced to login |

**Card reconciliation, step by step:** 1–4 have thumb-paths through Railway and the panel;
5–6 through the browser's own devtools; 7 through Panel A's URL; 8 through the panel's
footer button. **No step depends on unsetting a production env** — slice one's lesson holds;
every fail-closed behaviour is bench-only and named as such. **Step 3 is the one that
matters**: if any of those four screens still 403s, STOP and paste the network tab.

**Fixture state required: none.** Every step reads existing data or creates nothing.

---

## 10 · FOR THE SEAL ENTRY

- **F-07.84 CURED** — the credential left the client; the boolean opens nothing at **both** gates.
- **F-07.85 CURED** — 19 literals and 47 header lines to zero; one authority; the header limb dead estate-wide including CORS.
- **F-07.82 CLOSED** — HMAC over a nonce, twins consolidated to one home, eviction free and stated.
- **F-07.86 RESOLVED AT THE CREDENTIAL** — one login, one session material, two mints. **Panel A KEPT as break-glass by founder decision** (verbatim 「 keep 」); its five uniques port nothing; Block 08 inherits a **choice, not an accident**.
- **F-07.87 CURED by GUARD, not deletion** — zero code callers in either repo, but `buildBriefing` is live at `cron.js:70`, so the diagnostic keeps its handler and gains the guard the mount would have given it.
- **F-07.88 CURED** — the display-site class now has a name and no note carries credential-shaped bytes.
- **MINT CANDIDATE, chair's number:** the `Path=/admin` cookie-limb unreachability (§3.2).
- **THE CENSUS-BLINDNESS LAW, earned here:** a census scoped to the surface where a defect was *noticed* cannot find the same defect on a surface nobody suspected. `concierge.js` carried the header for the whole arc and three censuses walked past it. The estate-wide sweep is what found it — **sweep after the cure, not only before it.**

Sequencing beyond this sitting is the founder's.
