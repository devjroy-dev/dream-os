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
