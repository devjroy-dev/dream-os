# TDW · F-05.48 SLICE ONE (F-07.76) + F-07.77 — dream-os handover

Base: `dream-os 36d3198b0dec1cab056fb70320238de6722b06c8` · one repo · executor never pushes.
Ruling: CE-120 addendum (six forks ruled, §D ruled, F-07.82 minted, .75/.79 vacated).

---

## ⚠ 0 · READ THIS BEFORE YOU APPLY — ONE BLOCKING ENV STEP

**`ADMIN_SESSION_SECRET` must be set on Railway before or with this deploy.**

Fork 5(c) killed the hardcoded fallback at `src/admin/middleware.js:5` and
`src/api/admin/requireAdmin.js:6`. Both files now fail **CLOSED** when the env is
absent — by design, and correctly. But that means: **if `ADMIN_SESSION_SECRET` is not
currently set on the service, the HTML admin panel's cookie login stops working the
moment this deploys.** It will refuse loudly with a named log line, not silently.

I cannot see your Railway variables from this container. This is declared, not derived.

**Numbered founder steps, before or with the deploy:**
1. Railway → the `dream-os-production` service → **Variables**.
2. If `ADMIN_SESSION_SECRET` is **already set** → nothing to do; skip to step 4.
3. If it is **absent** → add it. Any long random string; it is a signing salt, not a
   password, and changing it invalidates admin cookies already in your browser (you
   simply log in to `/admin` again).
4. Confirm `ADMIN_PASSWORD` is set (it is, per CE-120) and `ADMIN_PHONE` is set to
   `+919888294440` (confirmed on the relay).

**Everything under `/api/v2/admin/demo/*` uses the header, not the cookie, and is
unaffected by step 3.** Only the HTML panel's cookie path depends on it.

---

## 1 · WHAT SHIPPED — five production files, one new bench, this doc

| file | what moved |
|---|---|
| `src/api/couple/concierge.js` | fork 1(b) result-read + `admin_notified` response field · fork 3(a) presence guard · fork 4(b) `ADMIN_PHONE` env-only · the row-read (disclosed, §3.1) |
| `src/api/vendor/collab.js` | fork 2(b) — `poster_notified_at` writes only on `sent === true` |
| `src/api/admin/demoAdmin.js` | F-07.77 — literal dies; explicit absent-env refusal added |
| `src/api/admin/requireAdmin.js` | F-07.77 fork 5(c) — literal dies; both limbs fail closed; F-07.82 named in-file |
| `src/admin/middleware.js` | F-07.77 fork 5(c) — literal dies; `verifySession` + `handleLogin` fail closed |
| `scripts/b07_f0776_doors_bench.js` | NEW — 61 cells |

**Copy inventory: ZERO.** Expected-zero was stated at read-first and accepted at
ruling. The couple-facing sentence at the concierge return is byte-identical and
cell-asserted (`§2.8`); the CE-59 vetoed collab string is byte-identical (`§3.5`).
Every string this delivery adds is a `console.error` or a JSON field name.

**W-1: zero soul bytes.** No prompt, lens, engine or soul file opened.
**Transport: zero bytes.** `lib/whatsapp.js` and `lib/sendWa.js` are untouched — the
doors changed, not the wire, exactly as §5 required.
**SQL: NIL.** None chartered, none authored, none needed.

---

## 2 · THE SECRET-HYGIENE LAW, HELD AT THE BYTE

The retired password and the retired session secret appear **nowhere** — not in a
source file, not in a comment, not in a bench string, not in this handover. Every
in-file paragraph that describes what was removed writes the SHAPE with a
placeholder (`process.env.X || '<a literal>'`) and never the value. Every bench cell
asserts **absence of a pattern** — a quote-opening `||` adjacent to a secret-shaped
env read — never the presence or absence of a particular string.

Both literals were deleted **by mechanical substitution on a regex**, never by
authoring a replacement line containing the old value.

Verified after the cure, estate-wide: the only `process.env.<SECRET-SHAPED> || '...'`
matches remaining in `src/` are (a) my own comment lines carrying placeholders, and
(b) `src/engine/smoke.js:9,11` — 5-character lowercase test placeholders, named at
read-first as harmless and left untouched, and `lib/vendor/igOAuth.js` × 3, whose
fallbacks are **empty strings**.

---

## 3 · THE ONE DISCLOSED ADDITION AND THE ONE DISCLOSED CURE-BEYOND-CHARTER

### 3.1 The `admin_activity_log` insert is now read (concierge.js)

Fork 1(b)'s ruling rests on a stated premise: *"the `:90` frozen sentence claims the
ROW and the row is true."* The insert was `.then(()=>{}).catch(()=>{})` — the outcome
discarded. So the premise could be false and silent, and the bride would be told a
concierge would reach her over nothing at all.

I bound it. The write is still **non-fatal** (she has done her part), but no longer
invisible: a failed insert logs loudly and `logged` rides the response. This is one
step beyond the literal charter and I am naming it rather than folding it in — the
ruling's own reason for choosing 1(b) is the thing it makes mechanically true.

### 3.2 `admin/middleware.js:handleLogin` carried a second fail-open

While in the file for fork 5(c) I found the **identical** shape the read-first
convicted at `concierge.js:97`: with `ADMIN_PASSWORD` absent, a login form posting no
password gave `undefined === undefined` and **minted a valid admin cookie**. Outside
the chartered sites. Cured here because it is one line, the same disease, and the file
was already open. Named in-comment at the site and cell-asserted (`§6.7`).

### 3.3 What I deliberately did NOT touch

- **`collab.js`'s two connect-notify sends** (the accept path) — still bare, still
  discarding. Ruled: fork 2(c) is F-05.48's later slices. Cell `§3.6` asserts
  **exactly two** bare sends still stand, so a later slice that cures one and forgets
  the other reddens here.
- **`vendorInbound.js` (17 sites) · `brideInbound.js` (4) · `agent/engine.js:1339`** —
  F-05.48's remaining population, untouched.
- **`signSession`'s base64** — F-07.82's chartered micro. Cell `§7.2` asserts it is
  *still* base64, so this delivery cannot be mistaken for having cured it.

---

## 4 · THE BENCH — `b07_f0776_doors_bench.js`, 61/61

Runnable from any working directory (Q-SP-5). Sections:

| § | subject |
|---|---|
| §0 | the CANARY — stripper anchors + the F-07.74 immunity proof, with its vacuity twin |
| §1 | the transport contract derived by command (3 refusal exits, 1 success, nullable sid) |
| §2 | the concierge door reads its send; frozen copy; the row read |
| §3 | the collab claimed-truth stamp under its guard; scope held at two untouched sends |
| §4 | `demoLeadAlert`'s ordering — the cited gold standard still stands |
| §5 | the four trapdoors — absence-of-pattern tripwires + a vacuity cell |
| §6 | fail-closed, evaluated against **extracted production expressions** |
| §7 | F-07.82 minted, named, and provably not silently cured |
| §8 | the F-06.85 mechanism comments name their facts |
| §9 | `node --check` on all five touched files |

### The mutation table — ten mutations of PRODUCTION code, all RED

| # | mutation | result |
|---|---|---|
| M-1 | concierge send fire-and-forget again | **58/61** |
| M-2 | collab stamp ungated (claimed-truth restored) | **60/61** |
| M-3 | secret literal planted at `concierge:97` | **60/61** |
| M-4 | `ADMIN_PHONE` fallback restored | **60/61** |
| M-5 | secret literal planted at `requireAdmin:6` | **60/61** |
| M-6 | secret literal planted at `middleware:5` | **60/61** |
| M-7 | **the naive cure** — presence limb stripped, door fail-OPEN | **60/61** |
| M-8 | `demoAdmin` absent-env limb deleted | **60/61** |
| M-9 | `handleLogin` fail-open restored | **60/61** |
| M-10 | the stripper's string-tracking **and** delimiter rule both removed | **60/61** |

All five production files restored **byte-identical** (`cmp`) after every mutation.

### Two cell mis-aims found by my own mutations, both labeled in-file

- **§2.9 / §3.3** went red on the *cured* tree at first run: they counted prose and
  column-name mentions across the whole file and convicted the new `console.error`
  text. Re-aimed at the mechanism — §2.9 now reads only `res.json` bodies, §3.3 counts
  only the key form `poster_notified_at:`. Subjects unchanged, spellings moved.
- **§6.1–6.3 went GREEN under M-7** — the most important mutation in the sitting. They
  evaluated a truth table the bench had typed by hand, so stripping the shipped
  presence limb left them untouched. That is the hollow-green class, in my own bench,
  caught only by running the mutation. **Re-aimed to EXTRACT the guard expression from
  `concierge.js` and evaluate it**, so any weakening of the shipped condition now
  reddens. `§6.3b` added. M-7 reds correctly after the re-aim.

### One honest limit, declared

**M-10 requires a DOUBLE mutation.** The bench's stripper is character-scanning with
string-tracking *and* a delimiter rule, so F-07.74's `accept="image/*"` shape is
blocked twice over; removing either arm alone leaves the other and `§0.X` stays green.
Non-vacuity is proven by removing both. Defence-in-depth is the reason, but the cell
cannot claim single-mutation sensitivity and does not.

---

## 5 · THE FLOOR — whole, cured tree, strictly sequential

`npm ci` exit 0 → `npm run build:engine` exit 0 (CE-119's order) → benches sequential,
none killed, `git status --porcelain` read before and after (F-07.46 interim protocol).

```
selftest ................ 386/386
b07_f0776_doors ......... 61/61     ← NEW
BENCHES RUN ............. 90
BYTE-STABLE vs base ..... 89
MOVED ................... 1  (the new bench only)
known-reds .............. EXACTLY TWO
    b06_meter_bench ............ 28/29   (F-06.41)
    b05_f0555_media_dedupe ..... 22/23   (F-07.11)
```

Named counts against the kickoff §4(vi): selftest **386** ✓ · p5 **136** ✓ ·
p6 **26** ✓ · auth_crossover **24** ✓ · known-reds **exactly two** ✓.

**Map:** the read-first's 89-bench inventory (92 scripts less `b06_gauntlet` — the
live-spend rig, `test-shape.js` — diagnostic-not-floor per F-07.11, and
`b5_wa_door_smoke` — a smoke) is now 90 with this delivery's bench. The chair adopted
that inventory as the going-forward map; this is its first run under that adoption.

---

## 6 · THE DERIVATION OWED AT READ-FIRST §F, NOW COMPLETE

**Which lane the concierge admin-notify rides.** `sendWhatsApp(ADMIN_PHONE, waBody)`
passes no `from`, so `defaultFrom(env)` resolves it. On `dream-os-production`,
`VENDOR_PHONE_NUMBER_ID` and `VENDOR_WHATSAPP_NUMBER` are set and
`BRIDE_PHONE_NUMBER_ID` is deliberately unset (`TDW_05_M2b_SUNSET_HANDOVER.md:145`,
`TDW_05_SEND200_RESOLUTION_HANDOVER.md:31`). Run by command against
`whatsapp.js`'s own exports:

```
defaultFrom  -> VENDOR_WHATSAPP_NUMBER
metaLaneFor  -> { line: 'vendor', phoneNumberId: <the vendor PNID> }
```

**Two consequences for the walk, both new information:**
1. The founder's concierge notification arrives **from the vendor WhatsApp number**,
   not a bride or admin number. Expect that; it is not a defect.
2. **The F-05.2 cross-line opt-out gate applies to `+919888294440` like any other
   recipient** (`whatsapp.js:131`). If that number ever sits in `prospects` at state
   `opted_out`, the admin notify returns `{blocked:'opted_out', sent:false}` — and as
   of this delivery you will *see* that in the log and the response instead of it
   vanishing. That is the cure working, not the walk failing.

---

## 7 · THE FOUNDER'S WALK — you perform and paste; I read the evidence

Every step names what I read. Nothing here needs a value you must invent.

**Fixture state:** none required. The walk creates its own row. Bride login is
`+919625759924` (couple `9f1f84d5`); admin phone `+919888294440`.

| # | you do | I read |
|---|---|---|
| 1 | Deploy. Railway logs → confirm boot green. | the boot line |
| 2 | Sign in to the bride PWA as `+919625759924`, open Meridian, tap **Ask a Personal Concierge**. | — |
| 3 | Read the on-screen confirmation. | it must say *"Our concierge will reach you at the earliest."* — **byte-identical to before**. If one character differs, STOP and paste it. |
| 4 | Check your own phone (`…4440`) for the WhatsApp notification. | the message, and **which number it came from** — expect the vendor number per §6 |
| 5 | Railway logs → paste the lines around the request. | on success: no `[concierge/request]` error line at all. On any refusal: `admin notify REFUSED (<code>)` or `admin notify THREW (…)` — either is the cure speaking |
| 6 | Open `/admin` in a browser, log in with the **rotated** password. | admits |
| 7 | Log out. Try `/admin` with the **OLD** password — the one you rotated away from. *(You have it; it appears nowhere in this packet by law.)* | **refused** — the trapdoor's death, witnessed |

**Steps 6–7 are the F-07.77 witness.** Step 4 is the F-07.76 witness. Step 3 is the
frozen-copy witness.

**Not walked, and why:** every env-absent behaviour (`§6.1`–`§6.8`) is **bench-only by
design**. Witnessing it live would mean unsetting `ADMIN_PASSWORD` or
`ADMIN_SESSION_SECRET` on the production service, which is exactly the outage this
cure is built to make loud. Named per §6 ⑤ rather than walked.

**Smoke-card reconciliation, step by step:** steps 1–5 have thumb-paths through the
bride PWA and the Railway console; steps 6–7 through the admin panel. **Step 5 has no
thumb-path if Railway log retention has rolled** — if you cannot find the lines,
re-run step 2 and read immediately. No step depends on a row you must first create.

---

## 8 · FOR THE SEAL ENTRY

- **F-07.76 → re-scoped in ink as F-05.48 SLICE ONE**: the admin-notify door + the
  claimed-truth stamp. Cross-reference both directions with `FINDINGS_LOG:2858`.
- **F-07.75 and F-07.79 VACATED** — no committed definition anywhere in either repo at
  `36d3198`/`0eecccd`; their gestured population belongs to F-05.48.
- **F-07.77 CURED, widened to FOUR sites**: both `ADMIN_PASSWORD` literals and both
  `ADMIN_SESSION_SECRET` literals.
- **F-07.82 MINTED, unbuilt**: `signSession` is reversible encoding, not a hash. Named
  in-file at `requireAdmin.js`; cure (real HMAC + cookie eviction) is its own micro.
- **CHAIR ERRATUM chartered**: CE-120 cited *"the handover's F-07.75/.79 census"*, which
  was never committed — the phantom-census correction, chair-owned.
- **THE ASYMMETRY LAW, earned here**: two sites carrying the same literal are not
  necessarily the same patch. `demoAdmin` was safe under a bare deletion; `concierge`
  would have gone fail-open. A cure applied uniformly to a census is a cure applied
  without reading the sites.
- **NEXT per the founder's standing order**: the F-07.74 stripper audit → the F-07.72
  sitting → Block 08.

Sequencing beyond this sitting is the founder's.
