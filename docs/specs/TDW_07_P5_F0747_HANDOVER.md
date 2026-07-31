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

---

# ADDENDUM — F-07.49, THE REGISTERED-USER GUARD (same ZIP)

**Founder-caught** against the walk card that was about to aim `demo_lead_alert`
at his own vendor number. Fork (a) as ruled; (b) chartered to P6.

## WHAT SHIPPED
`src/lib/discover/demoLeadAlert.js` — the guard, above the prospect read and the
send. `scripts/b07_p5_bench.js` — §11 (5 cells).

## PROOF
```
CURED    b07_p5_bench  80 passed, 0 failed  (80)
UNCURED  b07_p5_bench  76 passed, 4 failed  (80)
```
§11.4 (an unregistered phone still alerts) passes both — a **guard cell proving the
cure is not a blanket refusal**, named rather than counted as a cure proof.

## TWO FIXTURE AMENDMENTS, LABELED
The guard added a `users` read, and TWO pre-existing bench planes went red on the
CURED tree because they did not model it:
1. `prospectPlane` (§10) threw on an unexpected table → all five §10 cells red.
2. `fakeSupabase` (§1) lacked `.in()` / `.limit()` → the chain threw → the guard
   fail-closed → §1.3/§1.4 red.

Both widened to answer `users` with `null` (unregistered), which leaves each
section's original meaning untouched. **The fixtures were behind production, not
the reverse** — and the reddening was the guard working exactly as designed: an
unprovable phone is refused, never assumed safe. Disclosed rather than silently
widened.

## DECLARED, NOT DERIVED
`users.phone`'s canonical storage format is NOT derived — 117 touch sites, no
single governing normalizer. The chair's founder-run SELECT shows the `+` form.
The guard therefore matches BOTH forms (`.in([phone, '+'+phone])`) rather than
assume one. **A guard that misses is worse than no guard, because it reads as
protection.** §11.3 pins the pair.

## A FAILED LOOKUP REFUSES
If the users query throws, the alert is refused (`registered_check_failed`), not
sent. We cannot prove the phone is unregistered, so we do not speak. §11.5 drives it.

---

# ADDENDUM 2 — F-07.40 CLOSED: THE TEMPLATE IS APPROVED (same ZIP)

**Meta returned ACTIVE on 2026-07-31**, same day as filing (WhatsApp Manager →
template_details, `tdw_enquiry_alert_vendor`, "Active – Quality pending", Utility,
English — founder screenshot on the chat record). *Quality pending* is the quality
RATING, not the review state.

`status: 'pending'` → `'approved'`. sendWa's gate now passes it, so an out-of-window
vendor is reached by template instead of being a logged gap. **F-07.40 is CLOSED.**

## THREE CELLS INVERTED, NONE DELETED — the P2 §8.4 precedent
1. **§7.6** asserted `isApproved === false`. Green for the right reason while Meta
   held it; green over a STALE TRUTH afterwards. Now asserts APPROVED, plus pins the
   BODY and the WABA `name` — a registry body drifted from the filed one builds a
   payload Meta rejects at send time.
2. **§7.7** proved sendWa REFUSED the pending template. Re-aimed at the DISPATCH:
   the template reaches the transport, `mode:'template'`, payload name
   `tdw_enquiry_alert_vendor`.
3. **§7.8 WENT RED ON ITS OWN, AND WAS RIGHT TO.** It asserted the approved
   vendor-line set was exactly three and none mentioned an enquiry — a tripwire whose
   written purpose was to redden if a template ever joined that set. Meta approved
   one and it tripped on precisely that event. Re-authored to the new truth (four
   approved; exactly ONE carrier may speak of an enquiry; the carrier must never
   acquire a STOP instruction — the `morning_nudge_vendor` trap), tripwire still live
   for a fifth.

**A cell that reddens at the event it was written to catch is the cheapest evidence
this estate produces. It is re-aimed, never deleted.**

## PROOF
```
CURED    b07_p5_bench  80 passed, 0 failed  (80)
UNCURED  b07_p5_bench  72 passed, 8 failed  (80)   ← at 629e759
```

## NAMED RESIDUAL, NOT DERIVED
The WABA **language code**. Meta's UI says "English", ambiguous between `en` and
`en_US`. `TEMPLATE_LANGUAGE` defaults to `en`, and `demo_lead_alert` sends live on
that value — the strongest available evidence, but it is evidence about a DIFFERENT
template. If the first real send returns Meta **132001** (name/language mismatch),
the language is the suspect and `WA_TEMPLATE_LANGUAGE` is the one-env-var cure.
Recorded so the walk does not mistake it for a code defect.

## THE WALK'S TWO NUMBERS, FOUNDER-CONFIRMED
`8595986978` — NEW, no TDW account → step 6 half one, receives the demo alert.
`8595356978` — REGISTERED user → step 6 half two, witnesses F-07.49 REFUSING.
The chair's earlier `…6978` was `8595356978`; the collision was in the last four
digits only. Settled by the founder's word, not by inference.
