# TDW_05 · P4 — CRONS, THE NUDGE CLASS, AND THE RIDER · HANDOVER

**Base:** `a637d05` (origin tip, fetch-first re-derived at first motion)
**Witness:** `docs/db/PUBLIC_SCHEMA.md` — 62 tables, 691 columns, ladder tip `0096`
**Bench:** `scripts/b05_p4_crons_bench.js` — **34/34**, both-ways **10/10 by production mutation**
**Floor:** twelve-for-twelve, byte-stable (table below)
**Migrations:** `0086_nudge_optout` + `0099_circle_invite_link_fix` — **WITHHELD, founder-run, in one editor session**

---

## 1. WHAT SHIPPED

### F-05.22 — the nudge class, born
Two approved templates have been telling recipients *"Reply STOP MORNINGS to pause these updates"*
(`templates.js:51`, `:65`) since approval, and **no code anywhere read those words.** The estate was
making a promise it had no machinery to keep. It now has one.

- `src/lib/nudgeOptout.js` — the matcher, the positive read gate, the writer. All lane-scoped.
- `src/lib/nudgeCopy.js` — the copy, one keyed home under the founder's veto.
- The branch on **both** inbound cores, pre-engine, twin-shaped (§5.3 asserts they cannot drift).
- Both gates honour the table: `sendWa` (opt-in via `nudgeClass`) and the two nudge paths.

**The matcher is the safety property.** Bare `STOP` returns `null` and falls through untouched —
that word belongs to the full stop, and a nudge module that quietly swallowed it would downgrade a
terminal opt-out into a pause. `prospects.js` is not imported, not read, not written by any of this.

**Lane-scoped, per the chair's amendment.** `unique(phone, lane)`, not `unique(phone)`. The case that
forces it — a makeup artist planning her own wedding, one number on both lanes — is bench cell §2.2:
her bride nudge pauses, **her vendor briefings still arrive.**

**START MORNINGS is chartered in and built.** `state='resumed'`; the gates already read
`state='opted_out'` positively, so resume needed **zero gate change** (§4.3).

### F4 — the vendor briefing reaches a closed window
`src/cron.js` job #2 previously logged `skip … window_closed` and dropped the briefing. It now routes
to `tdw_morning_nudge_vendor` through `sendWa`, mirroring `brideCron.js:53-67`. That template was
approved on the WABA and **never called by any code** — approved, paid for, unreachable.
Two improvements from one cure: coverage, and the gate (the send no longer bypasses `sendWa`).
The now-dead `sendWhatsApp` import is removed — a dangling import to a bypassed transport is an
invitation to bypass it again.

### B3(a) — timezone, wall clock preserved
Each pair derived and disclosed. **Firing instants unchanged; only the expressions became honest.**

| job | was (implicit UTC) | now (Asia/Kolkata) | instant |
|---|---|---|---|
| 1 contracts | `'30 21 * * *'` | `'0 3 * * *'` | 21:30Z = 03:00 IST |
| 2 briefing | `'30 2 * * *'` UTC | **UNTOUCHED** | 02:30Z = 08:00 IST |
| 3 demo expiry | `'0 * * * *'` | `'30 * * * *'` | :00Z = :30 IST |
| 4 collab expiry | `'45 21 * * *'` | `'15 3 * * *'` | 21:45Z = 03:15 IST |

Cadence untouched, both lanes. §6.6 asserts the **pair** (expression ↔ timezone) on comment-stripped
code — the first draft of that cell read the header's own disclosure table and stayed green under
mutation M8. Caught by the harness, not by eye.

### 0086's ADOPT, wired
`couples.nudge_sent_at` had zero readers and zero writers estate-wide since `0013`. It is now the
bride lane's per-couple daily idempotency guard — the exact protection `brideCron.js`'s own TODO says
it lacks. **The day boundary is IST**, deliberately: a UTC boundary lands at 05:30 IST, three hours
inside the window a retry legitimately fires in, and would wave through the duplicate it exists to
stop (§1.4 proves the trap). `vendors` has **no sibling column** — flagged, not assumed, not invented.

### F-05.20's rider (F5)
`src/lib/waNumbers.js` is the one home. Vendor `917982159047`, bride `917011788380`.
Sixteen `src/**` sites now import it; **runtime grep-zero achieved** on the re-scoped claim.

**The mis-route, cured.** `coupleInvite.js:5` read
`TDW_WA_NUMBER_BRIDE || TDW_WA_NUMBER || '917982159047'` — on the *couple* invite page, both tail
terms the vendor lane. Unless the bride var happened to be set, an admin inviting a bride handed her
a link to the **vendor** assistant on her first contact with the product. `waNumberFor('bride')`
deliberately does **not** fall through to the vendor var: preserving that fall-through would be
preserving the bug's mechanism (§8.1).

### The CE-63 header set
Four ratified edits land as `out.push` changes in `db/queries/format_public_schema.js`;
③ refused, not written. **`docs/db/PUBLIC_SCHEMA.md` at origin is byte-identical** — the script
changes now, the doc changes at its own next birth, per the VEHICLE clause.

> ⚠ **Disclosure.** The banked session's exact proposed wording did not survive with it. These four
> are reconstructed faithfully from the ruling's own descriptions (② *the pair, not half the pipe*;
> ⑤ *FILE → HALF*; ④ *one word, report → standing property* = `PASSED` → `PASSES`; ① *the prospects
> near-miss*). The intent is ruled; the bytes are mine. Chair to confirm the diff, or amend in one line.

---

## 2. THE PROOF

**Bench 34/34.** Real production functions throughout — `routeNudge`, `routeBriefing`, `matchNudgeWord`,
`isNudgeOptedOut`, `setNudgeOptout`, the real `sendWa`, the real registry, `waNumberFor`. Fakes at the
edges only (supabase, transport). No stub stands in for a function under test.

**Both-ways, 10/10, by mutating PRODUCTION code:**

| mutation | RED at |
|---|---|
| M1 bride nudge gate removed | §2.1, §2.2 |
| M2 gate made cross-lane (phone-only) | §2.2 |
| M3 matcher widened to swallow bare STOP | §3.2 |
| M4 F4 route reverted to log-and-drop | §6.2 |
| M5 sendWa nudge gate disabled | §2.3 |
| M6 mis-route restored | §8.1 |
| M7 dead literal reintroduced as runtime value | §7.1, §7.2, §7.3 |
| M8 TZ wall clock broken | §6.6 |
| M9 nudge_sent_at stamp removed | §1.5 |
| M10 the twins drift | §5.3 |

**Floor, twelve-for-twelve, post-build:** sendwa 55 · webhookcore 11/11 · otp_meta 24 · b0498 58/58 ·
movementb 47/47 · transport 10 · m1b 4 · m2 2 · prospect 47 · checker 101/101 · b6_sitting2 20/22 ·
b06_meter 28/29. Full sweep of every other bench: green. `tsc --noEmit` clean.
Two credential-gated refusals (`b06_gauntlet`, `b5_wa_door_smoke`) proven **pre-existing** by
byte-identical output against a stashed pristine tree.

> **D-10 note, banked:** `b06_meter` reports 5/6 on a clean clone — §1/§4 skip without `src/engine/dist`.
> `npm run build` must precede that bench. It joins the D-10 chain's lore.

---

## 3. WHAT IS NOT CURED, NAMED

**F-05.24 — FILED, NOT CURED (needs a ruling).** `app/(frost)/frost/canvas/sanctuary/page.tsx:91`
declares `DREAMAI_WA_NUMBER = '14787788550'` — the dead sandbox literal — and renders it as a live
`<a href>` at `:735` and `:3520`. **A bride-facing surface links to a number that does not answer.**
Same defect class as F-05.23, found in the same sweep. It sits **outside** the ratified `src/**` scope,
so it is reported rather than silently cured. The fix is one import and one line.

**The resume confirmation line is PROVISIONAL.** The relay ratified the line that *promises*
START MORNINGS but gave no copy for the acknowledgement. Authored as the plain mirror rather than left
silent — a resume that answers with nothing reads as a resume that failed. `nudgeCopy.js`, one line,
founder's veto, no code consequence.

**Declared-not-claimed:** no live send was made; no SQL was run by this executor; the smoke is the
founder's.

---

## 4. SEQUENCING BEYOND — THE FOUNDER'S

The chartered spine after this seal: F-05.18 + γ → the couple soul → 05 whole → Block 06 to M-6 exit
(ledger unchanged, two-green clock still at ZERO). F-05.24 needs a home. CE-63 accrues to the seal.

---

# CLOSING MICRO — F-05.25 + F-05.24 (post-seal, CE-63 cuts at this green)

**Base:** `154049c` · **Bench:** `b05_p4_crons_bench` **44/44** · **both-ways 20/20** across two
harnesses · **floor twelve-for-twelve** · `tsc` clean both repos.

## F-05.25 — the full stop reaches bride and vendor

Found by the smoke walk: bare `Stop` returned *"Got it. What's up?"* — the estate answering a
compliance keyword as small talk. By command: `prospects.js:131` is the **only** writer of
`prospects.state='opted_out'`, and `handleMarketingInbound` is required by `marketingIndex.js`
**alone**. The read gates were always faithful; nothing on two of three lanes ever fed them.

**THE DERIVATION THE CHAIR OWED.** `updateProspect` is UPDATE-only and keyed on `id`, so alone it
cannot serve a number with no row. But it was never meant to be alone — the marketing lane's STOP
path is a **pair** (`prospects.js:128-131`): `findOrCreateProspectByPhone` INSERTS when the phone is
unknown, then `updateProspect` flips it. **The pair already is the upsert.** No new mode at the
writer's home, no second writer. `src/lib/fullStop.js` is a *caller* and holds no `.update()`,
`.insert()` or `.upsert()` of its own — asserted at §5.2 against comment-stripped code.

**ORDER IS LOAD-BEARING.** `isStopWord` matches the FIRST TOKEN ONLY, so
`isStopWord('STOP MORNINGS')` is **true**. Running the full stop first would swallow every pause into
a terminal opt-out — F-05.22's cure destroyed by its sibling. The nudge branch runs first on both
cores; §9.5 asserts **position**, not an outcome a reordering could still fake.

**Vocabulary mirrored, not invented.** `STOP_WORDS`/`START_WORDS` are IMPORTED from `prospects.js` —
one home, three lanes. Resume writes `state='replied'`, the marketing lane's own post-opt-out state.

## F-05.24 — the home, derived with evidence

The file exists in **both** repos and has already drifted: `dream-os` 248,612 bytes, `dreamos-pwa`
275,903 bytes, **659 differing lines**. `dream-os` has **no `next.config`** and its `package.json`
builds only the engine — **its `app/` tree is never served.** The live site is the pwa's.

Home: **a declared drift pair** (`lib/waNumbers.ts`), F-04.104's class. Two alternatives checked and
rejected on evidence, both recorded in the file's own header: an API-served value (nothing already
flows — `wa_me_link` is a per-invite token link, `/whatsapp-links` is `requireAdmin`-gated), and a
shared package (out of scope, two pipelines). The failure the file exists to prevent is not
divergence but **silent** divergence; all three homes now name each other, including 0099's SQL.

## The new copy item — PROPOSED, awaiting veto

`full_stop_confirmation` and its `full_start_confirmation` sibling. Terminal register derived from
`prospectCopy.js:20-21`: flat past-tense declaration, absoluteness, START as the single way back.
Two properties added — it names that **everything** stops (this is a product in use, not a campaign),
and it distinguishes itself from STOP MORNINGS, since two opt-outs shipped in one block would
otherwise be indistinguishable from a handset.

`resume_confirmation`'s ⚠ PROVISIONAL marker **struck** per founder ②.

## The executor's own, this micro

Three more of the same class, all caught by the harness rather than the eye:

1. **§5.2 read the comment that described the property it asserted** — `fullStop.js` says *"holds no
   `.update()` of its own"*, and the raw-file regex convicted the file on its own disclaimer.
   Fourth instance this arc of assertions reading prose instead of code.
2. **§5.3's twin guard did not cover the new branch** — mutation N10 drifted the vendor lane and the
   cell stayed GREEN. Then, once extended, it *ended at* the branch's last statement, so a trailing
   edit still landed outside it. Now slices to the closing brace.
3. **The supabase fake was unfaithful** — `.update().eq()` was awaitable but not chainable into
   `.select().single()`, the form `prospects.js:82-85` actually uses. Four §9 cells failed on the
   fake, not the code. Fixed by fidelity, never by a stub.

Also owned: the branch first landed **after** stray lines on each core (an orphaned `Step 5` comment
on bride, a hoisted `let user;` on vendor), producing a real twin drift and, briefly, a duplicate
declaration. Corrected; the twin regions are now byte-identical modulo the lane string.

## F-05.26 — FILED, NOT CURED

`dream-os/app/**` is a **dead 248KB copy** of the pwa's live Next tree, 659 lines diverged, built by
nothing. It is the estate's own named hazard — *a second home for the same facts is a home that goes
stale silently* (`format_public_schema.js` header). It made F-05.24 look like a dream-os finding when
the live site was always the pwa's. Deletion is the obvious cure and is **not** taken unruled.

---

# SECOND MICRO — F-05.27 + F-05.26 (founder-ruled, 2026-07-23)

**Base:** `072b948` · **Bench:** `b05_p4_crons_bench` **48/48** · **both-ways 27/27** across three
harnesses · floor twelve-for-twelve · `tsc` clean.

## F-05.27 — every acknowledgment now carries the bypass

**Found by the smoke, in the micro's own witness.** At `10:03:21` on 2026-07-23:

```
[whatsapp:out->meta] BLOCKED opted_out to=919625759924 line=bride (F-05.2 cross-line gate)
[bride-webhook] nudge-class OPT-OUT recorded for +919625759924 (lane=bride)
```

The write landed; the acknowledgment was swallowed. A number already fully opted out could pause its
morning messages correctly and receive **silence**.

The asymmetry was exact and mine: `prospects.js:132-138` carries the bypass with its reasoning
written out, the full-stop branch carried it, and the four nudge-branch acknowledgments — shipped at
`6c3e71e` — did not. It survived a 44-cell bench and twenty mutations because no test sequenced a
full STOP *before* a STOP MORNINGS. The founder's smoke did.

**Cure:** `ACK_BYPASS` gets ONE home in `fullStop.js` and is applied at all **eight** acknowledgment
sites across both cores. `full_start_confirmation` is included even though it already worked —
it was correct only *by ordering* (`recordFullStart` flips to `'replied'` before the send), and
correct-by-accident is one reorder away from broken.

**Why this is not a hole in the full stop:** the full stop governs *business-initiated* messaging.
An acknowledgment answers a message the human sent seconds ago. Refusing it does not honour the
opt-out; it makes the product look broken to someone still using it. The estate settled this on the
marketing lane first; F-05.27 is what happened when two lanes shipped without the settlement.

**§9.11 asserts it STRUCTURALLY** — over every `getNudgeCopy` send found on either core, not over
the eight that exist today — so a branch added later cannot quietly reintroduce it.

## F-05.26 — the dead copy removed

`dream-os/app/**` deleted: exactly **one file**, 264K, landed in a single commit (`acf0114`, a
TypeScript strict-build fix) and never touched again. **Zero requires, zero config references, no
build path** — `dream-os` has no `next.config` and builds only the engine. The live twin is the
pwa's, 659 lines diverged. It made F-05.24 read as a dream-os finding when the served page was
always elsewhere. `tsc` clean after removal; §9.14 asserts it stays gone.

`dream-os` now has **zero** runtime occurrences of the dead sandbox literal anywhere in the repo —
only the taught-anti-pattern comments.

## Copy

`full_stop_confirmation` — **RATIFIED by name** (founder, after two live handset witnesses). Marker
struck.

`full_start_confirmation` — **HELD, NARROWLY.** It was proposed alongside the stop line and witnessed
on the same handset, but was not named in the ratification. The marker is held rather than assumed
struck: reading a founder's veto as broader than its own words is how copy ships that nobody
approved. One word closes it.
