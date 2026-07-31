# TDW_07 P5 — F-07.47 CURED + THE FLOOR RE-READ · EXECUTOR HANDOVER
**Base:** `dream-os @ 2493144` · **Executor:** Opus-LE · **Date:** 2026-07-31
**Rides:** the CE ruling of 2026-07-31 items (a) and (b).

---

## 1 · WHAT SHIPPED

| # | File | What |
|---|---|---|
| 1 | `src/lib/discover/demoLeadAlert.js` | F-07.47 — the phone normalized at its derivation; `normalizeTo` imported. |
| 2 | `scripts/b07_p5_bench.js` | §10 (5 cells) + the async driver for them. |

**Zero DDL.** `0105` unspent. **W-1 clean.** No user-facing byte added or changed.

## 2 · PROOF

```
CURED    b07_p5_bench  75 passed, 0 failed  (75)
UNCURED  b07_p5_bench  71 passed, 4 failed  (75)   ← §10.1 .2 .3 .5 red at 2493144
§6 gate  node --check  OK
```

§10.4 (idempotence) passes on both trees — a **guard cell, not a cure proof**, named
as such. §10.3 is the finding's own cell: an existing prospect stored normalized, a
`+`-form column arriving, and the assertion that **no second row is minted**.

## 3 · THE CURE'S SHAPE — ONE SITE, NOT TWO. DEVIATION NAMED.

The ruling said "both write sites (`:172/:239`) normalize." I cured **one** site: the
point where `phone` is BORN (`:151`). Reason, stated so the chair can overrule it:
normalizing at two write sites leaves the derivation raw and re-creates the very split
this finding is about — a third site added next month would inherit the defect. One
derivation, three honest consumers. It also fixes `sendWa`'s `to` for free
(`normalizeTo` is idempotent; metaCloud normalizes the wire again downstream, so the
outbound byte is unchanged).

**A second, smaller deviation:** normalizing runs BEFORE the falsy guard, so a
whitespace-only column now collapses to `''` and is refused rather than sent. §10.5
drives it.

## 4 · MECHANISM NAMED (F-06.85)

The ruling cites `sendWa.js:143-145` as the normalizer's home. By command that is its
**usage** site — a comment plus the call inside `defaultIsOptedOut`. The function
itself is `normalizeTo`, **defined at `src/lib/metaCloud.js:57-62`** and imported by
sendWa. `demoLeadAlert.js` now imports it from the same home. Recorded because a cite
that points at a caller instead of a definition is how a one-home cure quietly becomes
a two-home one.

## 5 · THE FLOOR, RE-READ UNDER THE INTERIM PROTOCOL

Per ruling (a), the second reading, taken on a clean tree with the benches strictly
sequential:

```
git status --porcelain BEFORE :  clean
87 bench files, sequential   :  2 RED
                                b05_f0555_media_dedupe  22/23  (F-07.11)
                                b06_meter_bench                (F-06.41)
git status --porcelain AFTER  :  clean — NO bench left a mutation standing
```

**Known-reds exactly TWO, named.** The post-run residue check is the new evidence: it
is the mechanical form of the chair's diagnosis, and on this run nothing was left
behind. The counts in the prior packet were one sample; **this is the second reading,
and it is deterministic.**

I did not re-read any red after a `git checkout -- .` because there was no unexpected
red to re-read.

## 6 · WHAT F-07.46's MICRO WOULD ADD (chartered, not built)

The chair chartered a shared pre-flight in every mutation bench: targets dirty → a
DISTINCT exit code + a residue message naming the cure, refusing to run. Noting one
design constraint found while running the floor: the pre-flight must distinguish
**residue** from an **intentional candidate delta** (this very sitting's tree is
"dirty" against origin by design). Keying on `git status` alone would refuse every
legitimate pre-delivery floor run. Keying on the bench's OWN declared mutation targets
does not have that problem. Offered for the micro's charter, not decided here.

## 7 · THE FIXTURE, NOW SIMPLER

F-07.47's cure retires the workaround. `demo_vendors.whatsapp_phone` may be written in
either form; the module normalizes. The Block A / Block B SQL in
`TDW_07_P5_F0745_HANDOVER.md` stands, and its "NORMALIZED FORM, deliberately" comment
is now historical rather than load-bearing — either form is safe.

## 8 · NEXT

Founder runs Block A → Block B resolved zero-placeholder → the walk. The Meta filing
clock on `tdw_enquiry_alert_vendor`. F-07.46's micro and F-07.48's fold, both
founder-sequenced.
